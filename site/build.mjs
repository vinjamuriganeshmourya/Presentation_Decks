#!/usr/bin/env node
/**
 * Site build: assembles every deck in this repo into `_site/` for GitHub Pages.
 *
 *   node site/build.mjs [--out _site] [--sha <commit>]
 *
 * Layout it understands (course > session > deck):
 *
 *   <course>/course.json                      optional: { title, sessions: [ordered session folders] }
 *   <course>/<session>/dist-single/*.html     the built, self-contained deck(s)
 *   <course>/<session>/deck.site.json         optional: { decks: [{ file, slug?, title? }] }
 *   <course>/<session>/edits/<slug>.json      the deck's edit source data (written by Save)
 *
 * Each deck's HTML is copied unchanged except for two things: a small loader
 * (`site-assets/overlay.js`) is put at the top of <head>, and the deck's own
 * module script is held back (type -> text/x-deck-module) so the loader can
 * hand it the merged edit state on `window.__DECK_STATE__` before it boots.
 * The slides themselves are never touched.
 */
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')
const args = process.argv.slice(2)
const arg = (name, dflt) => {
  const i = args.indexOf(name)
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt
}
const OUT = path.resolve(ROOT, arg('--out', '_site'))
const SHA = arg('--sha', process.env.GITHUB_SHA || 'local')
const CONFIG = JSON.parse(fs.readFileSync(path.join(HERE, 'config.json'), 'utf8'))
const BUILT_AT = new Date().toISOString()

const SKIP_DIRS = new Set(['site', 'worker', 'node_modules', '_site', 'tests'])
const STATUSES = new Set(['visible', 'skipped', 'deleted'])

const readJson = (p, dflt = null) => {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch {
    return dflt
  }
}
const isDir = (p) => {
  try {
    return fs.statSync(p).isDirectory()
  } catch {
    return false
  }
}
const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/\.html?$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'deck'
const titleCase = (s) => s.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
const decodeEntities = (s) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
/** JSON that is safe inside an inline <script>. */
const LINE_SEPS = new RegExp("[" + String.fromCharCode(0x2028, 0x2029) + "]", "g")
const scriptJson = (v) =>
  JSON.stringify(v)
    .replace(/</g, "\\u003c")
    .replace(LINE_SEPS, (c) => "\\u" + c.charCodeAt(0).toString(16))

/** The deck file(s) a session publishes. */
function sessionDecks(sessionDir) {
  const dist = path.join(sessionDir, 'dist-single')
  if (!isDir(dist)) return []
  const htmls = fs.readdirSync(dist).filter((f) => /\.html?$/i.test(f)).sort()
  if (!htmls.length) return []
  const site = readJson(path.join(sessionDir, 'deck.site.json'))
  if (site && Array.isArray(site.decks) && site.decks.length) {
    return site.decks.map((d) => ({
      file: path.join(sessionDir, d.file),
      slug: d.slug ? slugify(d.slug) : slugify(path.basename(d.file)),
      title: d.title || null,
    }))
  }
  const cfg = readJson(path.join(sessionDir, 'deck.config.json')) || {}
  const engine = readJson(path.join(sessionDir, 'deck.json'))
  const htmlName = cfg.htmlName || engine?.meta?.htmlName
  let pick = htmlName && htmls.find((f) => f === `${htmlName}.html`)
  if (!pick) pick = htmls.find((f) => f === 'index.html')
  if (!pick) pick = htmls[0]
  return [{ file: path.join(dist, pick), slug: slugify(htmlName || pick), title: cfg.title || engine?.meta?.title || null }]
}

/** Every course > session > deck in the repo. */
function discover() {
  const courses = []
  for (const c of fs.readdirSync(ROOT).sort()) {
    if (c.startsWith('.') || c.startsWith('_') || SKIP_DIRS.has(c)) continue
    const courseDir = path.join(ROOT, c)
    if (!isDir(courseDir)) continue
    const courseCfg = readJson(path.join(courseDir, 'course.json')) || {}
    const order = Array.isArray(courseCfg.sessions) ? courseCfg.sessions : []
    const sessions = []
    for (const s of fs.readdirSync(courseDir)) {
      if (s.startsWith('.')) continue
      const sessionDir = path.join(courseDir, s)
      if (!isDir(sessionDir)) continue
      const decks = sessionDecks(sessionDir)
      if (decks.length) sessions.push({ folder: s, dir: sessionDir, decks })
    }
    if (!sessions.length) continue
    const rank = (s) => {
      const i = order.indexOf(s.folder)
      return i >= 0 ? i : order.length
    }
    sessions.sort((a, b) => rank(a) - rank(b) || a.folder.localeCompare(b.folder))
    courses.push({ folder: c, title: courseCfg.title || titleCase(c), sessions })
  }
  return courses
}

/** Pull the presenter state a deck saved INTO its own file (its in-page Save), then strip it. */
function takeFileState(html) {
  const re = /<script id="deck-state">window\.__DECK_STATE__=(\{[^<]*\})<\/script>/
  const m = re.exec(html)
  if (!m) return { html, fileState: null }
  let fileState = null
  try {
    fileState = JSON.parse(m[1])
  } catch {
    fileState = null
  }
  return { html: html.slice(0, m.index) + html.slice(m.index + m[0].length), fileState }
}

/** The deck's edit source: { slides: { [id]: { status?, comment? } } } */
function readEdits(p) {
  const raw = readJson(p, {}) || {}
  const slides = {}
  for (const [id, v] of Object.entries(raw.slides || {})) {
    if (!v || typeof v !== 'object') continue
    const o = {}
    if (STATUSES.has(v.status)) o.status = v.status
    if (typeof v.comment === 'string' && v.comment.trim()) o.comment = v.comment
    if (Object.keys(o).length) slides[id] = o
  }
  return slides
}

/** Merge a self-saved file's skip/delete defaults under the edit source (the source wins per slide). */
function bakedSlides(fileState, edits) {
  const out = {}
  const set = (id, k, v) => ((out[id] ??= {})[k] = v)
  if (fileState) {
    for (const id of fileState.deleted || []) set(id, 'status', 'deleted')
    for (const id of fileState.skipped || []) set(id, 'status', 'skipped')
  }
  for (const [id, v] of Object.entries(edits)) {
    if (v.status) set(id, 'status', v.status)
    if (v.comment) set(id, 'comment', v.comment)
  }
  return out
}

function transformDeck(srcHtml, site) {
  let { html, fileState } = takeFileState(srcHtml)
  const modRe = /<script type="module"(?:\s+crossorigin(?:="[^"]*")?)?\s*>/
  const m = modRe.exec(html)
  if (!m) throw new Error(`${site.id}: no module script found`)
  html = html.slice(0, m.index) + '<script type="text/x-deck-module" id="deck-main">' + html.slice(m.index + m[0].length)
  return { html, fileState }
}

function injectHead(html, tags) {
  const charset = /<meta charset="[^"]*"\s*\/?>/i.exec(html.slice(0, 4000))
  if (charset) {
    const at = charset.index + charset[0].length
    return html.slice(0, at) + tags + html.slice(at)
  }
  const head = /<head[^>]*>/i.exec(html.slice(0, 4000))
  if (!head) throw new Error('no <head>')
  const at = head.index + head[0].length
  return html.slice(0, at) + tags + html.slice(at)
}

function rmrf(p) {
  fs.rmSync(p, { recursive: true, force: true })
}

function build() {
  const courses = discover()
  rmrf(OUT)
  fs.mkdirSync(OUT, { recursive: true })
  fs.mkdirSync(path.join(OUT, 'site-assets'), { recursive: true })
  for (const f of ['overlay.js', 'gallery.js', 'gallery.css']) {
    fs.copyFileSync(path.join(HERE, f), path.join(OUT, 'site-assets', f))
  }
  const assetVersion = createHash('sha1')
    .update(['overlay.js', 'gallery.js', 'gallery.css'].map((f) => fs.readFileSync(path.join(HERE, f))).join('\n'))
    .digest('hex')
    .slice(0, 10)

  const manifest = { sha: SHA, builtAt: BUILT_AT, siteBase: CONFIG.siteBase, siteUrl: CONFIG.siteUrl, courses: [] }
  const seen = new Set()
  for (const course of courses) {
    const mc = { id: course.folder, title: course.title, sessions: [] }
    course.sessions.forEach((session, si) => {
      const ms = { id: session.folder, number: si + 1, title: null, decks: [] }
      for (const d of session.decks) {
        const id = `${course.folder}/${session.folder}/${d.slug}`
        if (seen.has(id)) throw new Error(`duplicate deck id ${id}`)
        seen.add(id)
        const src = fs.readFileSync(d.file, 'utf8')
        const htmlTitle = /<title>([^<]*)<\/title>/i.exec(src)
        const title = d.title || (htmlTitle ? decodeEntities(htmlTitle[1].trim()) : titleCase(d.slug))
        const editsRel = `${course.folder}/${session.folder}/edits/${d.slug}.json`
        const site = { id, title, course: course.title, session: session.folder }
        const { html, fileState } = transformDeck(src, site)
        const slides = bakedSlides(fileState, readEdits(path.join(ROOT, editsRel)))
        const contentHash = createHash('sha1').update(src).digest('hex').slice(0, 12)
        const state = { deck: id, sha: SHA, builtAt: BUILT_AT, contentHash, slides }
        const boot = {
          id,
          title,
          course: course.title,
          session: session.folder,
          sessionNumber: si + 1,
          editsPath: editsRel,
          worker: CONFIG.workerUrl,
          siteBase: CONFIG.siteBase,
          sha: SHA,
          builtAt: BUILT_AT,
          slides,
          textEdits: fileState?.edits || {},
        }
        const tags =
          `\n<script id="deck-site">window.__DECK_SITE__=${scriptJson(boot)}</script>` +
          `\n<script src="../../../site-assets/overlay.js?v=${assetVersion}"></script>\n`
        const outDir = path.join(OUT, course.folder, session.folder, d.slug)
        fs.mkdirSync(outDir, { recursive: true })
        fs.writeFileSync(path.join(outDir, 'index.html'), injectHead(html, tags))
        fs.writeFileSync(path.join(outDir, 'state.json'), JSON.stringify(state))
        /* a deck whose HTML points at sibling files (not single-file) keeps them */
        const assets = path.join(path.dirname(d.file), 'assets')
        if (isDir(assets) && /(?:src|href)="\.?\/?assets\//.test(src)) fs.cpSync(assets, path.join(outDir, 'assets'), { recursive: true })
        ms.title ??= title
        ms.decks.push({ id, slug: d.slug, title, path: `${course.folder}/${session.folder}/${d.slug}/`, source: path.relative(ROOT, d.file) })
        console.log(`deck  ${id}  <- ${path.relative(ROOT, d.file)}  (${Object.keys(slides).length} edited slides)`)
      }
      mc.sessions.push(ms)
    })
    manifest.courses.push(mc)
  }

  fs.writeFileSync(path.join(OUT, 'decks.json'), JSON.stringify(manifest, null, 1))
  fs.writeFileSync(path.join(OUT, 'build.json'), JSON.stringify({ sha: SHA, builtAt: BUILT_AT }))
  const gallery = fs
    .readFileSync(path.join(HERE, 'gallery.html'), 'utf8')
    .replace('/*MANIFEST*/null', scriptJson(manifest))
    .replaceAll('%ASSET_VERSION%', assetVersion)
    .replaceAll('%BASE%', CONFIG.siteBase)
  fs.writeFileSync(path.join(OUT, 'index.html'), gallery)
  fs.writeFileSync(path.join(OUT, '404.html'), gallery)
  fs.writeFileSync(path.join(OUT, '.nojekyll'), '')
  const n = manifest.courses.reduce((a, c) => a + c.sessions.reduce((b, s) => b + s.decks.length, 0), 0)
  console.log(`built ${n} decks -> ${path.relative(ROOT, OUT)} (sha ${SHA})`)
}

build()
