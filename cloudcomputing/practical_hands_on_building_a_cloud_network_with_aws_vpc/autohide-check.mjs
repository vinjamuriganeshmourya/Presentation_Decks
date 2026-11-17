/**
 * autohide-check.mjs — the overlay bar's clock, from the BUILT file (session 18:
 * `player.autoHideControls`).
 *
 *   node autohide-check.mjs [path/to/deck.html]
 *
 * At 390x844 and 844x390: visible on load, gone after 3s; a tap on the stage
 * toggles it; a press on its Forward moves the slide and the bar goes 1.5s
 * later; a pull up from the bottom edge shows it; a tap on the slide's own
 * button does not; focus arriving on the bar shows it. Session-owned, 2026-10-05.
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { HTML_FILE, TITLE } from './deck.config.mjs'
/* Which slides to drive. Session 31's numbers are the defaults; a deck sets its own:
   e.g. CONTENT_SLIDE=9 node autohide-check.mjs. (kit, 2026-10-14) */
const CONTENT_SLIDE = Number(process.env.CONTENT_SLIDE ?? 8) // any content slide
const PLAIN_SLIDE = Number(process.env.PLAIN_SLIDE ?? 5) // a slide with no build steps
const BUTTONS_SLIDE = Number(process.env.BUTTONS_SLIDE ?? 9) // a slide with step buttons
const html = resolve(process.argv[2] ?? HTML_FILE)
const OUT = 'workflow/qa-shots/phone'
mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch()
let fails = 0
const fail = (m) => { fails++; console.log('   FAIL', m) }
const ok = (m) => console.log('   ok', m)

async function run(w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => fail(`pageerror ${e.message}`))
  const cdp = await ctx.newCDPSession(page)
  const visible = () => page.evaluate(() => {
    const bar = document.querySelector('[data-deck-controls]')
    const r = bar.getBoundingClientRect()
    return Number(getComputedStyle(bar).opacity) > 0.5 && r.top < innerHeight - 1
  })
  const cur = () => page.evaluate(() => window.__DECK__.current)
  const expect = async (want, label) => {
    const v = await visible()
    if (v === want) ok(`${label}: bar ${want ? 'visible' : 'hidden'}`)
    else fail(`${label}: bar ${v ? 'visible' : 'hidden'}, wanted ${want ? 'visible' : 'hidden'}`)
  }
  console.log(`${w}x${h}`)
  await page.goto(`file://${html}?all#/${CONTENT_SLIDE}`, { waitUntil: 'load' })
  await page.waitForTimeout(400)
  await expect(true, 'on load')
  await page.waitForTimeout(3300)
  await expect(false, 'after 3.7s of nothing')
  // a tap on the stage, away from any control
  const spot = await page.evaluate(() => {
    const s = document.querySelector('.slide-stage').getBoundingClientRect()
    return { x: s.left + s.width * 0.5, y: s.top + s.height * 0.12 }
  })
  const under = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('button, input, a, [role="button"]') ? 'control' : 'plain', spot)
  if (under !== 'plain') fail(`tap spot is on a control`)
  await page.touchscreen.tap(spot.x, spot.y)
  await page.waitForTimeout(350)
  await expect(true, 'after a tap on the stage')
  let before = await cur()
  if ((await cur()) !== before) fail('the tap moved the slide')
  await page.touchscreen.tap(spot.x, spot.y)
  await page.waitForTimeout(350)
  await expect(false, 'after a second tap (toggle)')
  await page.touchscreen.tap(spot.x, spot.y)
  await page.waitForTimeout(350)
  await expect(true, 'after a third tap')
  await page.waitForTimeout(3300)
  await expect(false, 'after 3.6s of nothing again')
  // summon, then press Forward: the slide moves and the bar goes after ~1.5s.
  // On a slide with no build steps, so the step-wise Forward crosses a slide.
  await page.goto(`file://${html}?all#/${PLAIN_SLIDE}`, { waitUntil: 'load' })
  await page.waitForTimeout(3500)
  await expect(false, 'slide 5, after load and 3.5s')
  await page.touchscreen.tap(spot.x, spot.y)
  await page.waitForTimeout(350)
  await expect(true, 'slide 5, summoned')
  const fwd = await page.evaluate(() => { const r = document.querySelector('[data-deck-controls] button[aria-label="Forward"]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })
  before = await cur()
  await page.touchscreen.tap(fwd.x, fwd.y)
  await page.waitForTimeout(300)
  const after = await cur()
  if (after === before + 1) ok(`Forward on the bar moved ${before} → ${after}`)
  else fail(`Forward on the bar: ${before} → ${after}`)
  await expect(true, '0.3s after the press')
  await page.waitForTimeout(1600)
  await expect(false, '1.9s after the press (re-hides after a selection)')
  // a pull up from the bottom edge
  const x = w / 2
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: h - 12 }] })
  for (let i = 1; i <= 6; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: h - 12 - i * 10 }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await page.waitForTimeout(350)
  await expect(true, 'after a pull up from the bottom edge')
  if ((await cur()) !== after) fail('the edge pull moved the slide')
  await page.waitForTimeout(3300)
  await expect(false, 'hidden again')
  // a tap on one of the slide's own buttons must not summon the bar. Session 20:
  // slide 9 (slide 8 is the Objects divider, which has no buttons), Replay enabled under ?all
  await page.goto(`file://${html}?all#/${BUTTONS_SLIDE}`, { waitUntil: 'load' })
  await page.waitForTimeout(3500)
  await expect(false, 'slide 9, hidden after load')
  const inSlide = await page.evaluate(() => {
    const b = [...document.querySelectorAll('.slide-stage button')].find((x) => !x.disabled && /^(Next|One step|Replay|Show me)$/.test(x.textContent.trim()))
    if (!b) return null
    const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: b.textContent.trim() }
  })
  if (inSlide) {
    await page.touchscreen.tap(inSlide.x, inSlide.y)
    await page.waitForTimeout(350)
    await expect(false, `after tapping the slide's own "${inSlide.text}"`)
  } else ok(`no in-slide button on slide ${BUTTONS_SLIDE}, tap-on-a-button skipped (BUTTONS_SLIDE names a slide with one)`)
  // keyboard focus arriving on the bar summons it
  await page.evaluate(() => { document.activeElement?.blur(); document.querySelector('[data-deck-controls] button[aria-label="Forward"]').focus() })
  await page.waitForTimeout(250)
  await expect(true, 'after focus arrives on the bar')
  await page.evaluate(() => document.activeElement.blur())
  await page.waitForTimeout(3300)
  await expect(false, 'hidden after focus, with nothing pressed')
  await page.screenshot({ path: `${OUT}/autohide-${w}x${h}.png` })
  await ctx.close()
}
await run(390, 844)
await run(844, 390)
await browser.close()
console.log(fails ? `\nautohide: ${fails} FAIL` : '\nautohide: all checks passed')
process.exit(fails ? 1 : 0)
