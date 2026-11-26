/**
 * MARKER-CHECK — does the instructor's marker still work in the BUILT deck?
 *
 * The other harnesses here measure slides. This one measures the one piece of the
 * player an instructor drives with their hand, and it runs against
 * `dist-single/<name>.html` over `file://` rather than against the dev server,
 * because that is the artefact that gets handed over: one self-contained HTML file
 * opened by double-click, no server, no network. A marker that works under Vite and
 * not from `file://` is a marker that does not work.
 *
 * WHY IT DRIVES A REAL POINTER
 *
 * Everything interesting about the marker is a pointer gesture over a CSS-scaled
 * stage. Ink is stored in 1280x720 SLIDE coordinates while the stage is transformed
 * to fit the screen, so the whole feature rests on converting a client point
 * through the svg's own bounding rectangle. Nothing short of moving a pointer tests
 * that, and it is precisely the part that breaks silently when someone reaches for
 * the scale factor instead.
 *
 * WHAT ONE STROKE LOOKS LIKE TO THIS HARNESS
 *
 * A stroke paints more than one `<path>`: opaque ink also paints a wider contrast
 * halo behind itself, and an arrow paints its head separately. So strokes are
 * counted by the `[data-ink]` attribute, which `AnnotationLayer` puts on exactly
 * one path per stroke for this reason, and never by counting paths.
 *
 *     export CHROME_PATH=/opt/google/chrome/chrome
 *     npm run build:html && node marker-check.mjs
 *
 * Exits 1 on any failure, so it can gate a commit.
 */
import { chromium } from 'playwright'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { HTML_FILE } from './deck.config.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const html = resolve(here, HTML_FILE)
if (!existsSync(html)) {
  console.error(`\nNo built deck at ${html}\n  Run: npm run build:html\n`)
  process.exit(1)
}

/* The reserved instructor-video rectangle, the same one `video-safe.mjs` enforces.
   The marker rail is docked to the right wall, INSIDE that rect's x range, so it is
   the one piece of chrome that has to hold the rule at every height it can be
   dragged to rather than at one measured position. */
const RESERVED = { x1: 913, y2: 220 }

const rows = []
const check = (name, ok, note = '') => {
  rows.push({ ok, name, note })
  return ok
}

const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
)
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errs = []
page.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
page.on('pageerror', (e) => errs.push(`PAGEERROR ${e.message}`))
await page.goto(`file://${html}`)
await page.waitForTimeout(1500)

/** Strokes on screen. -1 means the ink layer is not even mounted. */
const inks = () =>
  page.evaluate(() => {
    const svg = document.querySelector('svg.absolute.inset-0.z-20')
    return svg ? svg.querySelectorAll('[data-ink]').length : -1
  })
const rail = () => page.locator('[data-marker-toolbar]')
const railBox = async () => ((await rail().count()) ? await rail().boundingBox() : null)
/* Both of these address `[data-marker-panel]` rather than hunting for the div with
   the most buttons in it. The tool clusters are divs full of buttons too, and the
   wrapper contains every button in the rail, so counting descendants identified the
   wrong element and reported the panel as open at rest. */
const panelBox = () =>
  page.evaluate(() => {
    const p = document.querySelector('[data-marker-panel]')?.getBoundingClientRect()
    return p ? { x1: Math.round(p.left), y1: Math.round(p.top), y2: Math.round(p.bottom) } : null
  })
const panelOpen = () =>
  page.evaluate(() => {
    const p = document.querySelector('[data-marker-panel]')
    return !!p && getComputedStyle(p).opacity === '1'
  })
async function drag(pts, { shift = false } = {}) {
  if (shift) await page.keyboard.down('Shift')
  await page.mouse.move(...pts[0])
  await page.mouse.down()
  for (const p of pts.slice(1)) await page.mouse.move(...p, { steps: 6 })
  await page.mouse.up()
  if (shift) await page.keyboard.up('Shift')
  await page.waitForTimeout(120)
}

/* ── the deck nobody has drawn on: no marker chrome in the DOM at all ─────────
   This is what every other harness sees, and it is why they are unaffected by the
   marker: an inert full-stage overlay would be reported by `qa.mjs` as content
   that scrolls and by `video-safe.mjs` as covering the instructor video. */
check('an untouched deck carries no ink layer', (await inks()) === -1)
check('an untouched deck carries no marker rail', (await railBox()) === null)

await page.keyboard.press('m')
await page.waitForTimeout(300)

/* ── the rail: docked, curved on the wall side, out of the video rect ──────── */
let r = await railBox()
check('the rail is flush against the right wall', Math.round(r.x + r.width) === 1280, `right edge ${Math.round(r.x + r.width)}`)
const radii = await page.evaluate(() => {
  const el = document.querySelector('[data-marker-tab]')
  if (!el) return null
  const s = getComputedStyle(el)
  return { tl: parseFloat(s.borderTopLeftRadius), tr: parseFloat(s.borderTopRightRadius) }
})
check('the tab is curved on its left only, square into the wall', radii && radii.tl > 6 && radii.tr === 0, JSON.stringify(radii))
check('the panel is closed at rest', !(await panelOpen()))
await rail().hover()
await page.waitForTimeout(400)
check('hover opens the panel', await panelOpen())
let p = await panelBox()
check('the open panel clears the reserved video rect', p.y1 >= RESERVED.y2 || p.x1 < RESERVED.x1, JSON.stringify(p))
await page.mouse.move(400, 400)
await page.waitForTimeout(300)

/* ── drawing: every tool, and the two that need a modifier ────────────────── */
await drag([[300, 300], [360, 340], [420, 300], [480, 360]])
check('a pen stroke commits', (await inks()) === 1)
await page.mouse.click(520, 300)
await page.waitForTimeout(120)
check('a tap with no travel still leaves a dot', (await inks()) === 2)
/* THE THREE PENS AT ONE NIB. The point of having three is that they are three
   weights, so the harness checks the WIDTHS against each other rather than just
   counting strokes: a refactor that collapsed `paintWidth` would still commit three
   strokes and would silently make the pen, the marker and the highlighter identical. */
await page.keyboard.press('2')
await drag([[300, 360], [480, 400]])
check('the marker pen commits', (await inks()) === 3)
await page.keyboard.press('3')
await drag([[300, 420], [600, 420]])
check('the highlighter commits', (await inks()) === 4)
/* Identified by WIDTH ORDER, not by DOM order. Highlighter strokes render in their
   own group ahead of the opaque ink so that a highlight can never wash out a note,
   so the document order is not the drawing order and indexing into it read the
   wrong strokes. The three pens are defined by being three weights, so the widths
   themselves are the honest way to tell them apart. */
const weights = await page.evaluate(() => {
  const all = [...document.querySelectorAll('[data-ink]')].map((p) => ({
    width: parseFloat(p.getAttribute('stroke-width')),
    alpha: p.getAttribute('stroke-opacity'),
  }))
  const hi = all.find((x) => x.alpha !== null && Number(x.alpha) < 1)
  const opaque = all.filter((x) => x !== hi).sort((a, b) => a.width - b.width)
  return {
    pen: opaque[0].width,
    marker: opaque[opaque.length - 1].width,
    hi: hi?.width ?? 0,
    hiAlpha: hi?.alpha ?? null,
  }
})
check('the pen writes thin, like a pen', weights.pen < 4, `pen ${weights.pen}px`)
check('the marker pen is heavier than the pen', weights.marker > weights.pen * 2.5, JSON.stringify(weights))
check('the highlighter is wider again and translucent',
  weights.hi > weights.marker * 1.8 && Number(weights.hiAlpha) < 1, JSON.stringify(weights))
await page.keyboard.press('5')
await drag([[700, 300], [820, 380]])
check('an arrow commits as ONE stroke, head included', (await inks()) === 5)
await page.keyboard.press('6')
await drag([[700, 430], [800, 500]], { shift: true })
const d = await page.evaluate(() => [...document.querySelectorAll('[data-ink]')].pop().getAttribute('d'))
const n = d.match(/-?\d+(\.\d+)?/g).map(Number)
check('Shift constrains the rectangle to a square', Math.abs(Math.abs(n[2] - n[0]) - Math.abs(n[5] - n[1])) < 1.5)
await page.keyboard.press('7')
await drag([[900, 430], [1000, 500]])
check('an ellipse commits', (await inks()) === 7)

/* ── the halo: contrast that does not depend on which ground the slide is ─── */
const halo = await page.evaluate(() => {
  const paths = [...document.querySelectorAll('svg.absolute.inset-0.z-20 g:not([style]) path')]
  const ink = paths.find((x) => x.hasAttribute('data-ink'))
  const back = paths.find((x) => !x.hasAttribute('data-ink'))
  return back && ink
    ? { wider: parseFloat(back.getAttribute('stroke-width')) > parseFloat(ink.getAttribute('stroke-width')), colour: back.getAttribute('stroke') }
    : null
})
check('opaque ink is backed by a wider contrast halo', halo?.wider === true, JSON.stringify(halo))

/* ── undo, redo, and the three ways to remove ink ─────────────────────────── */
const all = await inks()
await page.keyboard.press('Control+z')
await page.waitForTimeout(150)
check('Ctrl+Z removes the last stroke', (await inks()) === all - 1)
await page.keyboard.press('Control+Shift+z')
await page.waitForTimeout(150)
check('Ctrl+Shift+Z restores it', (await inks()) === all)
await page.keyboard.press('e')
await drag([[290, 300], [490, 360]])
const swept = await inks()
check('the eraser removes what it is dragged across', swept < all, `${all} -> ${swept}`)
await page.keyboard.press('E')
await drag([[660, 270], [1050, 520]])
const boxed = await inks()
check('Shift+E erases everything in a dragged box', boxed < swept, `${swept} -> ${boxed}`)
await page.keyboard.press('h')
await page.waitForTimeout(200)
check('H hides the ink without erasing it', (await inks()) === 0)
await page.keyboard.press('h')
await page.waitForTimeout(200)
check('H brings it back', (await inks()) === boxed)
await page.keyboard.press('Delete')
await page.waitForTimeout(200)
check('ONE Delete does not erase: the wipe needs confirming', (await inks()) === boxed)
await page.keyboard.press('Delete')
await page.waitForTimeout(200)
check('a second Delete erases the sheet', (await inks()) === 0)
await page.keyboard.press('Control+z')
await page.waitForTimeout(200)
check('erase-all is undoable', (await inks()) === boxed)

/* ── ink outlives the pen, and belongs to its slide ───────────────────────── */
const kept = await inks()
await page.keyboard.press('Escape')
await page.waitForTimeout(250)
check('Esc puts the pen down and keeps the ink', (await inks()) === kept)
check('the rail stays, because ink exists', (await railBox()) !== null)
check('ink on screen does not eat clicks once the pen is down', await page.evaluate(
  () => getComputedStyle(document.querySelector('svg.absolute.inset-0.z-20')).pointerEvents === 'none',
))
await page.keyboard.press('ArrowRight')
await page.waitForTimeout(650)
check('the next slide starts clean', (await inks()) === 0 || (await inks()) === -1)
check('the rail is still reachable from a slide with no ink', (await railBox()) !== null)
await page.keyboard.press('ArrowLeft')
await page.waitForTimeout(650)
check("coming back restores that slide's ink", (await inks()) === kept, String(await inks()))

/* ── the scope toggle: one sheet per slide, or one for the whole deck ─────── */
await page.keyboard.press('m')
await page.waitForTimeout(200)
await page.keyboard.press('a')
await page.waitForTimeout(250)
check('switching to the deck sheet puts the slide sheet away', (await inks()) === 0, String(await inks()))
await page.keyboard.press('2')
await drag([[200, 560], [400, 560]])
const shared = await inks()
await page.keyboard.press('ArrowRight')
await page.waitForTimeout(700)
check('deck-wide ink stays put across a slide change', (await inks()) === shared, String(await inks()))
await page.keyboard.press('a')
await page.waitForTimeout(250)
check('switching back hides the deck sheet again', (await inks()) === 0 || (await inks()) === -1)
await page.keyboard.press('ArrowLeft')
await page.waitForTimeout(650)
check("and the slide's own ink is still there", (await inks()) === kept, String(await inks()))

/* ── dragging the rail up the wall, and the clamp that keeps it legal ─────── */
r = await railBox()
const startY = r.y
await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2)
await page.mouse.down()
await page.mouse.move(r.x + r.width / 2, r.y - 220, { steps: 14 })
await page.mouse.up()
await page.waitForTimeout(250)
let r2 = await railBox()
check('dragging moves the rail up the wall', r2.y < startY - 120, `${Math.round(startY)} -> ${Math.round(r2.y)}`)
check('it stays flush to the wall while dragging', Math.round(r2.x + r2.width) === 1280)
await page.mouse.move(500, 400)
await page.waitForTimeout(350)
check('a drag does not pin the panel open', !(await panelOpen()))
/* Drive it hard into both stops: the clamp is the only thing standing between a
   dragged rail and a `video-safe` failure, and it is measured, not assumed. */
r2 = await railBox()
await page.mouse.move(r2.x + r2.width / 2, r2.y + r2.height / 2)
await page.mouse.down()
await page.mouse.move(r2.x + r2.width / 2, -200, { steps: 16 })
await page.mouse.up()
await page.waitForTimeout(250)
const top = await railBox()
check('the tab itself never enters the reserved video rect', top.y >= RESERVED.y2, `tab top ${Math.round(top.y)}`)
await rail().hover()
await page.waitForTimeout(400)
p = await panelBox()
check('nor does the panel, at the top of its travel', p.y1 >= RESERVED.y2 || p.x1 < RESERVED.x1, JSON.stringify(p))
await page.mouse.move(top.x + top.width / 2, top.y + top.height / 2)
await page.mouse.down()
await page.mouse.move(top.x + top.width / 2, 900, { steps: 16 })
await page.mouse.up()
await page.waitForTimeout(250)
const bot = await railBox()
check('and it stops above the deck chrome at the bottom', bot.y + bot.height <= 664, `tab bottom ${Math.round(bot.y + bot.height)}`)
/* A press that does not travel is still the click that pins the panel. */
await page.mouse.move(bot.x + bot.width / 2, bot.y + bot.height / 2)
await page.mouse.down()
await page.mouse.up()
await page.waitForTimeout(250)
await page.mouse.move(500, 300)
await page.waitForTimeout(350)
check('a press with no travel still pins the panel open', await panelOpen())

/* ── replay: R restages the slide and must not cost the presenter their ink ─ */
await page.keyboard.press('Escape')
await page.waitForTimeout(200)
const hashBefore = await page.evaluate(() => location.hash)
const shotBefore = await page.screenshot()
await page.keyboard.press('r')
await page.waitForTimeout(120)
const shotDuring = await page.screenshot()
await page.waitForTimeout(900)
check('R restages the slide in place', !shotBefore.equals(shotDuring))
check('R does not change slide', (await page.evaluate(() => location.hash)) === hashBefore)
check('and the ink survives the replay', (await inks()) === kept, String(await inks()))

check('no console errors anywhere in the run', errs.length === 0, errs.slice(0, 2).join(' | '))

await browser.close()

const failed = rows.filter((x) => !x.ok)
console.log(`\nmarker-check  ·  ${rows.length - failed.length}/${rows.length} passed\n`)
for (const x of rows) {
  if (!x.ok) console.log(`  FAIL  ${x.name}${x.note ? `   ${x.note}` : ''}`)
}
if (failed.length === 0) console.log('  CLEAN: the marker works in the built HTML.\n')
process.exit(failed.length === 0 ? 0 : 1)
