/**
 * NAVIGATION STRESS CHECK, on the built file, in three engines and four sizes.
 *
 * Why it exists: in "slide" mode the player used to leave every departed
 * slide mounted, so slides stacked over each other and leftovers showed as
 * dark or blank frames (user, 2026-10-06, Python 19 and 20). This drives the
 * deck every way a presenter can and asserts that, once a move has settled,
 * exactly ONE slide layer is on the stage and it is fully opaque, on screen,
 * and holds content.
 *
 *   node nav-stress-check.mjs [built.html] [chromium,firefox,webkit]
 */
import { chromium, firefox, webkit } from 'playwright-core'
import { SLIDE_COUNT } from './deck.config.mjs'
import { readdirSync } from 'node:fs'
const html = process.argv[2] || `${process.cwd()}/dist-single/${readdirSync('dist-single').find((f) => f !== 'index.html' && f.endsWith('.html'))}`
const engines = (process.argv[3] || 'chromium,firefox,webkit').split(',')
const SIZES = [
  { name: 'phone-portrait', width: 390, height: 844, touch: true },
  { name: 'laptop', width: 1366, height: 768 },
  { name: '1080p', width: 1920, height: 1080 },
  { name: '4k', width: 3840, height: 2160 },
]
const N = SLIDE_COUNT
let fails = 0
const state = (p) => p.evaluate(() => {
  const stage = document.querySelector('.slide-stage')
  const top = [...(stage?.querySelectorAll('div.absolute.inset-0') ?? [])].filter((d) => !d.parentElement.closest('.slide-stage div.absolute.inset-0'))
  const layers = top.filter((d) => d.childElementCount > 0)
  const r = stage?.getBoundingClientRect()
  return {
    layers: layers.length,
    opacity: layers.map((d) => Number(getComputedStyle(d).opacity)),
    onScreen: !!r && r.width > 100 && r.height > 50 && r.left > -5 && r.top > -5 && r.right < innerWidth + 5 && r.bottom < innerHeight + 5,
    content: (stage?.innerText ?? '').trim().length > 2 || !!stage?.querySelector('img,svg'),
    slide: Number(location.hash.match(/#\/(\d+)/)?.[1] ?? 0),
  }
})
for (const name of engines) {
  const type = { chromium, firefox, webkit }[name]
  const b = await type.launch()
  for (const size of SIZES) {
    const ctx = await b.newContext({ viewport: { width: size.width, height: size.height }, hasTouch: !!size.touch, isMobile: name !== 'firefox' && !!size.touch })
    const p = await ctx.newPage()
    const errs = []
    p.on('pageerror', (e) => errs.push(String(e)))
    const problems = []
    const check = async (what, settle = 900) => {
      await p.waitForTimeout(settle)
      const s = await state(p)
      if (s.layers !== 1 || s.opacity[0] < 0.99 || !s.onScreen || !s.content) problems.push(`${what} @${s.slide}: ${JSON.stringify(s)}`)
    }
    const key = async (k, n = 1, gap = 120) => { for (let i = 0; i < n; i++) { await p.keyboard.press(k); await p.waitForTimeout(gap) } }
    // 1. slide mode, forward then back, one press at a time
    await p.goto(`file://${html}?nav=slides#/1`, { waitUntil: 'load' }); await p.waitForTimeout(1200)
    /* settle 800, not 350 (2026-10-22): since 2026-10-15 every move in this deck plays the 600ms glide
       (`player.smooth`), so 350ms after a press the departing layer is still mid-exit by design; the
       assertion is about what is left once the move has settled */
    for (let i = 1; i < N - 1; i++) { await key('ArrowRight'); await check(`slides → ${i}`, 800) }
    for (let i = 0; i < 6; i++) { await key('ArrowLeft'); await check(`slides ← ${i}`, 800) }
    // 2. slide mode, hammered: ten presses with no wait, then settle
    await key('ArrowRight', 10, 0); await check('slides hammered →')
    await key('ArrowLeft', 10, 0); await check('slides hammered ←')
    // 3. step mode across slide boundaries (animated transitions), and Ctrl jumps
    await p.goto(`file://${html}?nav=steps#/1`, { waitUntil: 'load' }); await p.waitForTimeout(1200)
    for (let i = 0; i < 30; i++) { await key('ArrowRight', 1, 60) } await check('steps → x30')
    await key('Control+ArrowRight', 3, 0); await check('ctrl jumps →')
    await key('Control+ArrowLeft', 2, 0); await check('ctrl jumps ←')
    // 4. Replay and a picker jump
    await key('r'); await check('replay')
    await key('g'); await p.waitForTimeout(500); await p.keyboard.press('Escape'); await check('picker open/close')
    // 5. switch mode with the on-screen control, mid-deck, then move both ways
    const btn = await p.$('button[aria-label^="Plain arrow keys currently move by"]')
    if (btn) { await p.evaluate((el) => el.click(), btn); await p.waitForTimeout(300) }
    await key('ArrowRight', 4, 200); await check('after toggle →')
    await key('ArrowLeft', 4, 200); await check('after toggle ←')
    if (btn) { await p.evaluate((el) => el.click(), btn); await p.waitForTimeout(300) }
    await key('ArrowRight', 6, 150); await check('toggled back →')
    const out = problems.length || errs.length ? 'FAIL' : 'ok'
    if (out === 'FAIL') fails++
    console.log(`${out.padEnd(4)} ${name.padEnd(8)} ${size.name.padEnd(14)} ${problems.length} problem(s), ${errs.length} page error(s)`)
    for (const x of [...problems.slice(0, 4), ...errs.slice(0, 2)]) console.log('       ', x)
    await ctx.close()
  }
  await b.close()
}
console.log(fails ? `\nnavigation: ${fails} FAIL` : '\nnavigation: every engine and size clean')
process.exit(fails ? 1 : 0)
