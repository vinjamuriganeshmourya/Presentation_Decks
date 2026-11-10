#!/usr/bin/env node
/*
 * LOCAL REVIEW COPIES: reviewers' comments inside the deck itself.
 *
 *   npm run review            open comments only
 *   npm run review -- --all   resolved comments too
 *   npm run review -- --hook  (used by .githooks) never fails: one-line warning, exit 0
 *
 * For every published deck that has `<course>/<session>/edits/<deck>.json`
 * (the file the site's Save and comments commit to), this writes
 * `review/<course>/<session>/<deck>.html`: a copy of the deck's published HTML
 * with one inline script added. The original file is only read, never written.
 *
 * In the copy (presenter view, opened straight from disk, no network):
 *   - the review comments are in the deck's OWN comment panel (toolbar comment
 *     icon), labelled "Review comment" and read-only;
 *   - skipped / deleted slides keep their place and carry a small tag, on the
 *     slide and on their grid card;
 *   - comments whose slide id the deck no longer has are listed under
 *     "Comments not matched to a slide";
 *   - everything the deck keeps in localStorage lives under its own
 *     `nxtwave.review.*` keys, so the copy never touches the original deck's
 *     local skips, edits or comments, and review comments are never stored.
 *
 * Deck discovery mirrors site/build.mjs (which is not imported: importing it
 * would run a site build).
 */
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'review')
const ARGS = process.argv.slice(2)
const ALL = ARGS.includes('--all')
const HOOK = ARGS.includes('--hook')
const VERSION = 'review-1'

const SKIP_DIRS = new Set(['site', 'worker', 'node_modules', '_site', 'tests', 'review', 'scripts'])
const STATUSES = new Set(['visible', 'skipped', 'deleted'])

/* ------------------------------------------------------------------ discovery (same rules as site/build.mjs) */
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

function discover() {
  const out = []
  for (const c of fs.readdirSync(ROOT).sort()) {
    if (c.startsWith('.') || c.startsWith('_') || SKIP_DIRS.has(c)) continue
    const courseDir = path.join(ROOT, c)
    if (!isDir(courseDir)) continue
    for (const s of fs.readdirSync(courseDir).sort()) {
      if (s.startsWith('.')) continue
      const sessionDir = path.join(courseDir, s)
      if (!isDir(sessionDir)) continue
      for (const d of sessionDecks(sessionDir)) out.push({ course: c, session: s, ...d })
    }
  }
  return out
}

/* ------------------------------------------------------------------ the deck's review data (same reading as site/build.mjs) */
const DECK_STATE_RE = /<script id="deck-state">window\.__DECK_STATE__=(\{[^<]*\})<\/script>/

function fileState(html) {
  const m = DECK_STATE_RE.exec(html)
  if (!m) return null
  try {
    return JSON.parse(m[1])
  } catch {
    return null
  }
}

/** slide id -> 'skipped' | 'deleted' (visible slides are left out): the file's own defaults, then the edits file */
function slideStates(fState, edits) {
  const out = {}
  for (const id of fState?.deleted || []) out[id] = 'deleted'
  for (const id of fState?.skipped || []) out[id] = 'skipped'
  for (const [id, v] of Object.entries(edits.slides || {})) if (v && STATUSES.has(v.status)) out[id] = v.status
  for (const id of Object.keys(out)) if (out[id] === 'visible') delete out[id]
  return out
}

/** edits threads -> the deck's own CommentThread shape, ids prefixed `review-` */
function reviewThreads(edits, editsPath) {
  const msg = (id, m) => ({
    id,
    author: String(m.author || 'Reviewer'),
    text: String(m.text || ''),
    at: Number(m.at) || 0,
    ...(m.edited ? { edited: Number(m.edited) } : {}),
  })
  const out = []
  for (const [tid, t] of Object.entries(edits.threads || {})) {
    if (!t || typeof t.slide !== 'string' || typeof t.text !== 'string') continue
    const replies = Object.entries(t.replies && typeof t.replies === 'object' ? t.replies : {})
      .map(([rid, r]) => msg(`review-${tid}-${rid}`, r))
      .sort((a, b) => a.at - b.at)
    out.push({ ...msg(`review-${tid}`, t), slideId: t.slide, replies, resolved: !!t.resolved })
  }
  /* a single per-slide note from the first editor version is a thread on the site too */
  let mtime = 0
  try {
    mtime = fs.statSync(editsPath).mtimeMs
  } catch {}
  for (const [slide, v] of Object.entries(edits.slides || {})) {
    if (!v || typeof v.comment !== 'string' || !v.comment.trim()) continue
    const tid = 'legacy' + createHash('sha1').update(slide).digest('hex').slice(0, 10)
    if (out.some((t) => t.id === `review-${tid}`)) continue
    out.push({ id: `review-${tid}`, author: 'Editor', text: v.comment, at: Math.round(mtime), slideId: slide, replies: [], resolved: false })
  }
  return out.sort((a, b) => a.at - b.at)
}

/* ------------------------------------------------------------------ the copy */
const LINE_SEPS = new RegExp('[' + String.fromCharCode(0x2028, 0x2029) + ']', 'g')
const scriptJson = (v) =>
  JSON.stringify(v)
    .replace(/</g, '\\u003c')
    .replace(LINE_SEPS, (c) => '\\u' + c.charCodeAt(0).toString(16))

function injectHead(html, tag) {
  const charset = /<meta charset="[^"]*"\s*\/?>/i.exec(html.slice(0, 4000))
  if (charset) {
    const at = charset.index + charset[0].length
    return html.slice(0, at) + tag + html.slice(at)
  }
  const head = /<head[^>]*>/i.exec(html.slice(0, 4000))
  if (!head) throw new Error('no <head>')
  const at = head.index + head[0].length
  return html.slice(0, at) + tag + html.slice(at)
}

function reviewHtml(src, data, fState) {
  let html = src
  /* the file's own saved skips / deletions would drop slides: keep its text edits, show every slide */
  if (fState) {
    const kept = { ...fState, view: 'presenter', skipped: [], deleted: [] }
    html = html.replace(DECK_STATE_RE, () => `<script id="deck-state">window.__DECK_STATE__=${scriptJson(kept)}</script>`)
  }
  const tag =
    `\n<!--deck-review: local review copy, generated by scripts/review.mjs; not the published deck-->` +
    `\n<script id="deck-review-data">window.__DECK_REVIEW__=${scriptJson(data)}</script>` +
    `\n<script id="deck-review">${RUNTIME}</script>\n`
  return injectHead(html, tag)
}

/* runs in the review copy before the deck; plain ES5, no network */
const RUNTIME = String.raw`;(function () {
  'use strict'
  var R = window.__DECK_REVIEW__
  if (!R || window.__DECK_REVIEW_ON__) return
  window.__DECK_REVIEW_ON__ = true
  var REVIEW = /^review-/
  var BY_ID = {}
  R.threads.forEach(function (t) { BY_ID[t.id] = t })

  /* 1. storage: the copy keeps its own nxtwave.review.* keys; review threads are served, never stored */
  try {
    var S = Storage.prototype, get = S.getItem, set = S.setItem, rem = S.removeItem
    var LS = window.localStorage
    var own = function (k) { return typeof k === 'string' && k.indexOf('nxtwave.deck.') === 0 && k !== 'nxtwave.deck.comment-author' }
    var key = function (k) { return own(k) ? 'nxtwave.review.' + k.slice(13) : k }
    var comments = function (k) { return own(k) && /\.comments$/.test(k) }
    var mine = function (raw) {
      try { var l = JSON.parse(raw); return Array.isArray(l) ? l.filter(function (t) { return t && !REVIEW.test(t.id) }) : [] } catch (e) { return [] }
    }
    S.getItem = function (k) {
      var v = get.call(this, key(k))
      if (this === LS && comments(k)) return JSON.stringify(mine(v).concat(R.threads))
      return v
    }
    S.setItem = function (k, v) {
      if (this === LS && comments(k)) v = JSON.stringify(mine(v))
      return set.call(this, key(k), v)
    }
    S.removeItem = function (k) { return rem.call(this, key(k)) }
  } catch (e) {}

  /* 2. review threads are read-only: nothing inside one reacts, except its slide chip (jump) */
  function reviewCard(el) {
    var c = el && el.closest ? el.closest('[data-comment-thread]') : null
    return c && REVIEW.test(c.getAttribute('data-comment-thread')) ? c : null
  }
  ;['click', 'dblclick', 'pointerdown', 'mousedown'].forEach(function (type) {
    document.addEventListener(type, function (e) {
      var c = reviewCard(e.target)
      if (!c) return
      var b = e.target.closest('button')
      if (b && b.hasAttribute('data-review-keep')) return
      e.stopPropagation()
      if (type === 'click') e.preventDefault()
    }, true)
  })

  var CSS = [
    '[data-comment-thread^="review-"]{cursor:default!important;box-shadow:0 1px 3px rgba(0,37,75,.12)!important;outline:1.5px solid rgba(45,99,251,.35);outline-offset:-1.5px}',
    '[data-comment-thread^="review-"] [data-review-hide]{display:none!important}',
    '[data-comment-thread^="review-"][data-review-unmatched]{display:none!important}',
    '[data-review-badge]{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-family:inherit;font-size:11.5px;font-weight:600;line-height:1.3;color:#1f4fd8}',
    '[data-review-badge] b{background:#eaf0ff;color:#1f4fd8;border-radius:999px;padding:2px 8px;font-size:11px;letter-spacing:.02em}',
    '[data-review-badge] span{color:#6b7f95;font-weight:500}',
    '[data-review-note]{margin-top:6px;font-size:12px;line-height:1.35;color:#1f4fd8;background:#eaf0ff;border-radius:10px;padding:6px 10px}',
    '[data-review-unmatched-list]{margin-top:6px;display:flex;flex-direction:column;gap:8px;padding:10px;border-radius:12px;background:#fff7ed;outline:1px dashed #f59e0b}',
    '[data-review-unmatched-list] h3{margin:0;font-size:13px;font-weight:700;color:#92400e}',
    '[data-review-unmatched-list] p.why{margin:0;font-size:12px;color:#92400e}',
    '[data-review-unmatched-list] article{background:#fff;border-radius:10px;padding:8px 10px;box-shadow:0 1px 3px rgba(0,37,75,.12);font-size:13px;color:#0f172a}',
    '[data-review-unmatched-list] .m{font-size:11.5px;color:#6b7f95;margin-bottom:3px}',
    '[data-review-unmatched-list] code{font:600 11px ui-monospace,Menlo,monospace;background:#fef3c7;color:#92400e;border-radius:6px;padding:1px 5px}',
    '[data-review-unmatched-list] .r{margin:6px 0 0 10px;padding-top:6px;border-top:1px solid #eef2f7}',
    '[data-review-unmatched-list] .t{white-space:pre-wrap;word-wrap:break-word;line-height:1.4}',
    '[data-review-slide-tag]{position:fixed;z-index:40;pointer-events:none;font:700 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.06em;text-transform:uppercase;padding:5px 9px;border-radius:999px;box-shadow:0 4px 14px rgba(0,0,0,.18)}',
    '[data-review-slide-tag][data-st="skipped"],[data-review-grid-tag][data-st="skipped"]{background:#f59e0b;color:#0b1020}',
    '[data-review-slide-tag][data-st="deleted"],[data-review-grid-tag][data-st="deleted"]{background:#ef4444;color:#fff}',
    '[data-review-grid-tag]{border-radius:999px;padding:2px 6px;font:700 9.5px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.05em}',
  ].join('\n')

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] })
  }
  function stamp(at) {
    if (!at) return ''
    var d = new Date(at)
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  }
  var STATE_TEXT = { skipped: 'Skipped on the site', deleted: 'Deleted on the site' }

  /* 3. after the deck is up: decorate its comment panel, slide and grid */
  var known = null
  function deck() { return window.__DECK__ }
  function tick() {
    var d = deck()
    if (!d || !d.all || !d.all.length) return
    if (!known) {
      known = {}
      d.all.forEach(function (s) { known[s.id] = true })
      R.unmatched = R.threads.filter(function (t) { return !known[t.slideId] })
    }
    decoratePanel()
    slideTag(d)
    gridTags(d)
  }

  function decoratePanel() {
    var cards = document.querySelectorAll('[data-comment-thread^="review-"]')
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i]
      var t = BY_ID[card.getAttribute('data-comment-thread')]
      if (!t) continue
      if (!known[t.slideId]) card.setAttribute('data-review-unmatched', '')
      if (!card.querySelector('[data-review-badge]')) {
        var b = document.createElement('div')
        b.setAttribute('data-review-badge', '')
        b.innerHTML = '<b>Review comment · read-only</b><span>' + esc(stamp(t.at)) + '</span>'
        card.insertBefore(b, card.firstChild)
      }
      var btns = card.querySelectorAll('button')
      for (var j = 0; j < btns.length; j++) {
        var x = btns[j]
        if (x.hasAttribute('data-review-keep') || x.hasAttribute('data-review-hide')) continue
        if (/^Slide\s+\d+/.test(x.textContent.trim())) x.setAttribute('data-review-keep', '')
        else x.setAttribute('data-review-hide', '')
      }
      var spans = card.querySelectorAll('span')
      for (var k = 0; k < spans.length; k++) if (spans[k].textContent === 'Reply' && !spans[k].children.length) spans[k].setAttribute('data-review-hide', '')
      var boxes = card.querySelectorAll('textarea')
      for (var m = 0; m < boxes.length; m++) boxes[m].closest('div').setAttribute('data-review-hide', '')
    }
    var panel = document.querySelector('[data-comments-panel]')
    if (!panel) return
    var header = panel.querySelector('header')
    if (header && !header.querySelector('[data-review-note]')) {
      var n = document.createElement('div')
      n.setAttribute('data-review-note', '')
      n.textContent = R.count + ' review comment' + (R.count === 1 ? '' : 's') + ' from the site (read-only), generated ' + stamp(R.generatedAt) + '. Comments you add here stay in this copy only.'
      header.appendChild(n)
    }
    var list = panel.querySelector('.overflow-y-auto > div') || panel.querySelector('.overflow-y-auto')
    if (!list || !R.unmatched.length) return
    var box = panel.querySelector('[data-review-unmatched-list]')
    if (box && box.parentNode === list && box === list.lastElementChild) return
    if (!box) {
      box = document.createElement('section')
      box.setAttribute('data-review-unmatched-list', '')
      box.innerHTML =
        '<h3>Comments not matched to a slide (' + R.unmatched.length + ')</h3>' +
        '<p class="why">These comments name slide IDs this deck no longer has (for example after a regeneration). Nothing is lost: they are listed here.</p>' +
        R.unmatched.map(function (t) {
          return '<article><div class="m"><code>' + esc(t.slideId) + '</code> · ' + esc(t.author) + ' · ' + esc(stamp(t.at)) + (t.resolved ? ' · resolved' : '') + '</div><div class="t">' + esc(t.text) + '</div>' +
            t.replies.map(function (r) { return '<div class="r"><div class="m">' + esc(r.author) + ' · ' + esc(stamp(r.at)) + '</div><div class="t">' + esc(r.text) + '</div></div>' }).join('') +
            '</article>'
        }).join('')
    }
    list.appendChild(box)
  }

  var tagEl = null
  function slideTag(d) {
    var cur = d.slides && d.slides[(d.current || 1) - 1]
    var st = cur && R.states[cur.id]
    var stage = document.querySelector('.slide-stage')
    if (!st || !stage) {
      if (tagEl) tagEl.style.display = 'none'
      return
    }
    if (!tagEl) {
      tagEl = document.createElement('div')
      tagEl.setAttribute('data-review-slide-tag', '')
      tagEl.title = 'Viewers on the site do not see this slide'
    }
    var host = document.fullscreenElement || document.body
    if (tagEl.parentNode !== host) host.appendChild(tagEl)
    var r = stage.getBoundingClientRect()
    tagEl.setAttribute('data-st', st)
    tagEl.textContent = STATE_TEXT[st]
    tagEl.style.display = ''
    tagEl.style.top = Math.max(4, r.top + 10) + 'px'
    tagEl.style.left = Math.max(4, r.right - tagEl.offsetWidth - 10) + 'px'
  }

  function gridTags(d) {
    var cards = document.querySelectorAll('div[role="button"][tabindex="0"]')
    for (var i = 0; i < cards.length; i++) {
      var num = cards[i].querySelector(':scope > span > span.font-mono')
      if (!num || !/^\d{1,3}$/.test(num.textContent.trim())) continue
      var s = d.all[parseInt(num.textContent, 10) - 1]
      var st = s && R.states[s.id]
      var tag = num.parentNode.querySelector('[data-review-grid-tag]')
      if (!st) {
        if (tag) tag.remove()
        continue
      }
      if (!tag) {
        tag = document.createElement('span')
        tag.setAttribute('data-review-grid-tag', '')
        num.parentNode.appendChild(tag)
      }
      if (tag.getAttribute('data-st') !== st) {
        tag.setAttribute('data-st', st)
        tag.textContent = st === 'deleted' ? 'deleted on site' : 'skipped on site'
      }
    }
  }

  function start() {
    var style = document.createElement('style')
    style.id = 'deck-review-css'
    style.textContent = CSS
    document.head.appendChild(style)
    setInterval(tick, 250)
    window.addEventListener('hashchange', function () { setTimeout(tick, 0) })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start)
  else start()
})()`

/* ------------------------------------------------------------------ run */
function git(...a) {
  const r = spawnSync('git', a, { cwd: ROOT, encoding: 'utf8' })
  return r.status === 0 ? r.stdout.trim() : ''
}

function main() {
  const sha = git('rev-parse', '--short', 'HEAD')
  const generatedAt = Date.now()
  const decks = discover()
  const written = new Set()
  const manifestPath = path.join(OUT, '.inputs.json')
  const before = readJson(manifestPath, {}) || {}
  const after = {}
  let open = 0
  let shown = 0
  let unmatched = 0
  const lines = []
  for (const d of decks) {
    const editsPath = path.join(ROOT, d.course, d.session, 'edits', `${d.slug}.json`)
    if (!fs.existsSync(editsPath) || !fs.existsSync(d.file)) continue
    const edits = readJson(editsPath)
    if (!edits || typeof edits !== 'object') throw new Error(`${path.relative(ROOT, editsPath)} is not valid JSON`)
    const src = fs.readFileSync(d.file, 'utf8')
    const fState = fileState(src)
    const allThreads = reviewThreads(edits, editsPath)
    const threads = ALL ? allThreads : allThreads.filter((t) => !t.resolved)
    const states = slideStates(fState, edits)
    const htmlTitle = /<title>([^<]*)<\/title>/i.exec(src)
    const title = d.title || (htmlTitle ? decodeEntities(htmlTitle[1].trim()) : titleCase(d.slug))
    /* a slide id that is not even written in the deck's HTML cannot match a slide (the copy works it out exactly) */
    const missing = threads.filter((t) => !src.includes(`"${t.slideId}"`)).length
    const outRel = path.join(d.course, d.session, `${d.slug}.html`)
    const outFile = path.join(OUT, outRel)
    const data = { deck: `${d.course}/${d.session}/${d.slug}`, title, sha, generatedAt, all: ALL, count: threads.length, threads, states }
    /* skip the write when nothing that feeds this copy changed */
    const stat = fs.statSync(d.file)
    const inputs = createHash('sha1')
      .update([VERSION, RUNTIME, ALL, d.file, stat.size, stat.mtimeMs, JSON.stringify(edits)].join('\n'))
      .digest('hex')
    if (before[outRel] !== inputs || !fs.existsSync(outFile)) {
      fs.mkdirSync(path.dirname(outFile), { recursive: true })
      fs.writeFileSync(outFile, reviewHtml(src, data, fState))
    }
    after[outRel] = inputs
    written.add(path.resolve(outFile))
    const openHere = allThreads.filter((t) => !t.resolved).length
    open += openHere
    shown += threads.length
    unmatched += missing
    const hidden = Object.values(states)
    lines.push(
      `  ${outRel}  ${openHere} open comment${openHere === 1 ? '' : 's'}` +
        (ALL ? ` (${threads.length} shown)` : '') +
        (hidden.length ? `, ${hidden.filter((s) => s === 'skipped').length} skipped / ${hidden.filter((s) => s === 'deleted').length} deleted slides` : '') +
        (missing ? `, ${missing} not matched to a slide` : ''),
    )
  }
  /* drop copies of decks that no longer have an edits file (only inside review/) */
  if (isDir(OUT)) {
    const walk = (dir) => {
      for (const f of fs.readdirSync(dir)) {
        const p = path.join(dir, f)
        if (isDir(p)) {
          walk(p)
          if (!fs.readdirSync(p).length) fs.rmdirSync(p)
        } else if (f.endsWith('.html') && !written.has(path.resolve(p))) fs.rmSync(p)
      }
    }
    walk(OUT)
  }
  fs.mkdirSync(OUT, { recursive: true })
  fs.writeFileSync(manifestPath, JSON.stringify(after, null, 1))
  console.log(
    `review: ${lines.length} deck${lines.length === 1 ? '' : 's'}, ${open} open comment${open === 1 ? '' : 's'}` +
      (ALL ? `, ${shown} shown with resolved` : '') +
      (unmatched ? `, ${unmatched} not matched to a slide` : '') +
      ` -> open ${OUT}${path.sep}`,
  )
  for (const l of lines) console.log(l)
}

try {
  main()
} catch (e) {
  if (HOOK) {
    console.log(`review: warning: local review copies not updated (${e && e.message ? e.message : e}); run "npm run review" to retry`)
    process.exit(0)
  }
  console.error(`review: ${e && e.stack ? e.stack : e}`)
  process.exit(1)
}
