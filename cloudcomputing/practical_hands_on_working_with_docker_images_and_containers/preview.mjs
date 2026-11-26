/**
 * PREVIEW HARNESS for the standalone HTML deck.
 *
 * Runs the built single-file deck from file:// with all network traffic
 * blocked, then captures two things:
 *
 *   1. A full sweep of every slide with ?all (every build step revealed), so
 *      the contact sheet shows finished slides rather than empty step-0 frames.
 *   2. Mid-flight frames of a slide-to-slide transition and of a Ctrl+Arrow
 *      build step, which is the only way to show that the motion survived
 *      bundling — a settled screenshot cannot.
 *
 *   node preview.mjs [builtHtml] [outDir] [slideCount]
 *
 * All three arguments default to this deck's own values, read from
 * `deck.config.json`, so the bare command is correct in every session.
 */
import { chromium } from 'playwright'
import { mkdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { HTML_FILE, SLIDE_COUNT } from './deck.config.mjs'

const FILE = resolve(process.argv[2] ?? HTML_FILE)
const OUT = resolve(process.argv[3] ?? 'workflow/preview')
const TOTAL = Number(process.argv[4] ?? SLIDE_COUNT)
/*
  THE FRAME DIRECTORIES ARE CLEARED FIRST, AND A SHRUNK DECK IS WHY.

  This only ever created the directories, so a frame from a previous run with a
  higher slide number was never removed. `build-preview-page.mjs` derives its
  headline count from the files on disk, which is the fix for it having once
  hardcoded "35 slides" above a grid of 48 — but a derived count is only honest
  if the directory is.

  Session 7 went from 59 slides to 56 and the contact sheet reported 59, listing
  three frames of slides that no longer exist, with the newest 56 written at
  14:56 and the ghosts left behind at 14:14. A stale frame is worse than a wrong
  number: it is a picture of a slide the deck does not have, and it is
  indistinguishable from a real one.
*/
rmSync(`${OUT}/slides`, { recursive: true, force: true })
rmSync(`${OUT}/motion`, { recursive: true, force: true })
mkdirSync(`${OUT}/slides`, { recursive: true })
mkdirSync(`${OUT}/motion`, { recursive: true })
/*
  THUMBS, written here rather than by hand.

  `scripts/build-preview-page.mjs` inlines `thumbs/NN.jpg` and
  `thumbs/m-transition-N.jpg` as data URIs. Nothing in the repo produced that
  directory: it had been created once by hand, so the contact sheet could only be
  rebuilt in a project that already had one, and in a fresh project the script
  crashed on `readdirSync` at import time. (It does carry a friendly
  "run preview.mjs first" guard for exactly this, 260 lines further down, which
  the crash never reaches.)

  Since this harness already has the page open at each frame, it writes the JPEG
  alongside the PNG. The PNGs stay: they are the lossless record for reading a
  slide, and the JPEGs exist only to keep the one-file contact sheet shareable.
*/
rmSync(`${OUT}/thumbs`, { recursive: true, force: true })
mkdirSync(`${OUT}/thumbs`, { recursive: true })
const THUMB = { type: 'jpeg', quality: 72 }

const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
)
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
// Nothing may reach the network. If the deck still needs a CDN, this fails it.
await ctx.route(/^https?:\/\//, (r) => r.abort())
const page = await ctx.newPage()

const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))

/*
  SETTLE TIME — the slowest self-playing entrance in the kit, plus headroom.

  `?all` forces every click-gated build step open, but it does NOT fast-forward
  the entrances that play themselves on mount. The binding constraint is
  `AgendaSlide`: its items are cued off the curve being drawn, so the last item
  starts at FIRST_AT + (DRAW - FIRST_AT - 0.15) = 1.75s and finishes its 0.55s
  rise at about 2.38s. `DataTable` is second at roughly 1.5s.

  At the old 1100ms every agenda in every deck was captured two items in, with a
  third ghosting at 30% opacity, over an acre of empty slide. That is not a
  content bug and it is not a layout bug, but it is indistinguishable from one in
  a screenshot, and it shipped in a signed-off preview.

  Raise this if a new slide type animates itself for longer, and say what it is.
*/
const SETTLE = 2600

/* ── 1. every slide, fully built ──────────────────────────────────────── */

const blank = []
for (let i = 1; i <= TOTAL; i++) {
  await page.goto(`file://${FILE}?all#/${i}`, { waitUntil: 'load' })
  await page.waitForTimeout(SETTLE)
  const ink = await page.evaluate(() => {
    const s = document.querySelector('section')
    if (!s) return { text: 0, imgs: 0, broken: 0 }
    const imgs = [...s.querySelectorAll('img')]
    return {
      text: s.innerText.replace(/\s/g, '').length,
      imgs: imgs.length,
      broken: imgs.filter((i) => !(i.complete && i.naturalWidth > 0)).length,
    }
  })
  if (ink.text < 12 || ink.broken > 0) blank.push({ slide: i, ...ink })
  const nn = String(i).padStart(2, '0')
  await page.screenshot({ path: `${OUT}/slides/${nn}.png` })
  await page.screenshot({ path: `${OUT}/thumbs/${nn}.jpg`, ...THUMB })
}

/* ── 2. motion, caught mid-flight ─────────────────────────────────────── */

// A slide-to-slide cross-fade/slide. Frames every 70ms across the transition.
await page.goto(`file://${FILE}#/4`, { waitUntil: 'load' })
await page.waitForTimeout(1200)
await page.keyboard.press('ArrowRight')
for (let f = 0; f < 8; f++) {
  await page.screenshot({ path: `${OUT}/motion/transition-${f}.png` })
  await page.screenshot({ path: `${OUT}/thumbs/m-transition-${f}.jpg`, ...THUMB })
  await page.waitForTimeout(70)
}

// A build step: Ctrl+Arrow, sampled while the reveal is still staggering in.
await page.goto(`file://${FILE}#/6`, { waitUntil: 'load' })
await page.waitForTimeout(1200)
const steps = []
for (let s = 0; s < 5; s++) {
  steps.push(await page.evaluate(() => document.querySelectorAll('section *').length))
  await page.screenshot({ path: `${OUT}/motion/build-${s}.png` })
  await page.keyboard.down('Control')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.up('Control')
  await page.waitForTimeout(140) // deliberately mid-animation
  await page.screenshot({ path: `${OUT}/motion/build-${s}-midflight.png` })
  await page.waitForTimeout(500)
}

console.log(
  JSON.stringify(
    { file: FILE, slidesCaptured: TOTAL, suspectSlides: blank, buildStepDomCounts: steps, errors: errors.slice(0, 10) },
    null,
    2,
  ),
)
await browser.close()
