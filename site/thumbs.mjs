#!/usr/bin/env node
/*
 * Card thumbnails for the gallery: the first slide a student sees, per deck.
 *
 *   node site/thumbs.mjs [--out _site]
 *
 * Runs AFTER build.mjs, on the built site. For each deck it makes the student
 * file (site/student.js, the same file the Download button saves: no site
 * layer, skipped and deleted slides left out), opens it in headless Chrome at
 * 1280x720, waits for the first slide's entrances, and captures only the
 * slide (`.slide-stage`), with the deck's own controls hidden, as
 * `<deck>/thumb.jpg`. The slide is the session title (else the agenda): every
 * deck opens on the same welcome slide. The slide counts go to `deck-meta.json`.
 *
 * Optional by design: the gallery draws a designed card when a thumbnail is
 * missing, so CI runs this with continue-on-error.
 *
 * Needs playwright-core (or playwright) and a Chrome:
 *   PW_FROM=<dir with node_modules>  CHROME_PATH=<chrome binary>
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.dirname(HERE)
const argv = process.argv.slice(2)
const arg = (k, d) => {
  const i = argv.indexOf(k)
  return i >= 0 ? argv[i + 1] : d
}
const OUT = path.resolve(ROOT, arg('--out', '_site'))

function loadPlaywright() {
  const bases = [process.env.PW_FROM, ROOT].filter(Boolean)
  for (const b of bases) {
    const req = createRequire(path.join(path.resolve(b), 'noop.js'))
    for (const name of ['playwright-core', 'playwright']) {
      try {
        return req(name)
      } catch {}
    }
  }
  throw new Error('playwright-core not found (set PW_FROM)')
}
function findChrome() {
  const c = [process.env.CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser']
  return c.find((p) => p && fs.existsSync(p))
}

/* site/student.js is a browser script; run it on a bare window object */
function loadStudent() {
  const sandbox = { window: {}, location: { pathname: '/' }, setTimeout, clearTimeout }
  vm.runInNewContext(fs.readFileSync(path.join(HERE, 'student.js'), 'utf8'), sandbox)
  return sandbox.window.DeckStudent
}

const manifest = JSON.parse(fs.readFileSync(path.join(OUT, 'decks.json'), 'utf8'))
const decks = manifest.courses.flatMap((c) => c.sessions.flatMap((s) => s.decks))
const DS = loadStudent()
const { chromium } = loadPlaywright()
const executablePath = findChrome()
const browser = await chromium.launch({ executablePath, args: ['--hide-scrollbars', '--mute-audio'] })
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'deck-thumbs-'))
const meta = {}
let failed = 0
try {
  for (const d of decks) {
    const dir = path.join(OUT, d.path)
    try {
      const page0 = fs.readFileSync(path.join(dir, 'index.html'), 'utf8')
      const state = JSON.parse(fs.readFileSync(path.join(dir, 'state.json'), 'utf8'))
      const site = DS.siteOf(page0) || {}
      const hidden = DS.hiddenFrom(state.slides || {}, [])
      const file = path.join(tmp, d.slug + '.html')
      fs.writeFileSync(file, DS.studentHtml(DS.pristine(page0), { hidden, edits: site.textEdits || {} }))

      const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 0.5, reducedMotion: 'no-preference' })
      await ctx.route(/^https?:/, (r) => r.abort())
      const page = await ctx.newPage()
      /* ?still: the decks' own harness flag, every slide fully drawn and held (entrances and loops off) */
      await page.goto('file://' + file + '?still#/1')
      await page.waitForFunction(() => window.__DECK__ && window.__DECK__.all && window.__DECK__.all.length, null, { timeout: 30000 })
      await page.waitForSelector('.slide-stage', { timeout: 10000 })
      /* every deck opens on the same welcome slide: show the session title, else the agenda, else the first real slide */
      const at = await page.evaluate(() => {
        const s = window.__DECK__.slides
        const find = (re) => s.findIndex((x) => re.test(x.label || ''))
        let i = find(/session name|^title/i)
        if (i < 0) i = find(/agenda/i)
        if (i < 0) i = s.findIndex((x) => !/brand|welcome/i.test((x.label || '') + ' ' + x.id))
        return Math.max(0, i) + 1
      })
      if (at !== 1) {
        await page.evaluate((n) => { location.hash = '#/' + n }, at)
        await page.waitForFunction((n) => window.__DECK__.current === n, at, { timeout: 10000 })
      }
      await page.waitForTimeout(2500) /* the move's transition, fonts and pictures */
      const total = await page.evaluate((hidden) => {
        /* keep only the slide: hide every sibling along the stage's ancestor chain (controls, bars, toasts) */
        const stage = document.querySelector('.slide-stage')
        for (let el = stage; el && el !== document.body; el = el.parentElement) {
          for (const sib of el.parentElement ? el.parentElement.children : []) {
            if (sib !== el && !(sib instanceof HTMLScriptElement) && !(sib instanceof HTMLStyleElement)) sib.style.visibility = 'hidden'
          }
        }
        /* ?still shows every slide; students see the ones not skipped or deleted */
        return window.__DECK__.all.filter((x) => hidden.indexOf(x.id) < 0).length
      }, hidden)
      await page.waitForTimeout(150)
      await page.locator('.slide-stage').screenshot({ path: path.join(dir, 'thumb.jpg'), type: 'jpeg', quality: 82 })
      await ctx.close()
      meta[d.id] = { slides: total, thumb: 'thumb.jpg', thumbSlide: at }
      console.log(`thumb ${d.id}  (${total} slides, ${(fs.statSync(path.join(dir, 'thumb.jpg')).size / 1024).toFixed(0)} KB)`)
    } catch (e) {
      failed++
      console.warn(`thumb ${d.id} FAILED: ${e.message}`)
    }
  }
} finally {
  await browser.close()
  fs.rmSync(tmp, { recursive: true, force: true })
}
fs.writeFileSync(path.join(OUT, 'deck-meta.json'), JSON.stringify(meta))
console.log(`thumbnails: ${Object.keys(meta).length} made, ${failed} failed`)
if (failed && !Object.keys(meta).length) process.exit(1)
