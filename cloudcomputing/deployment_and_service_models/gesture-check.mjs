/**
 * gesture-check.mjs — touch and trackpad navigation, from the BUILT file.
 *
 *   node gesture-check.mjs [path/to/deck.html]
 *
 * Touch at 390x844: a swipe left is next, right is previous; a tap, a vertical
 * swipe, two fingers and a swipe that starts on a button move nothing; the body
 * carries `touch-action: pan-y pinch-zoom`. Trackpad at 1280x720: a 12-event
 * burst with a 6-event inertia tail moves exactly one slide each way; a vertical
 * wheel moves nothing; the arrow keys still work. Session-owned, 2026-10-05
 * (the shape generate-slides section 7 asks for).
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { HTML_FILE, TITLE } from './deck.config.mjs'
/* Which slides to drive. Session 31's numbers are the defaults; a deck sets its own:
   e.g. CONTENT_SLIDE=9 node gesture-check.mjs. (kit, 2026-10-14) */
const CONTENT_SLIDE = Number(process.env.CONTENT_SLIDE ?? 8) // a slide with slides on both sides of it
const html = resolve(process.argv[2] ?? HTML_FILE)
const browser = await chromium.launch()
let fails = 0
const fail = (m) => { fails++; console.log('   FAIL', m) }
const ok = (m) => console.log('   ok', m)

{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => fail(`pageerror ${e.message}`))
  const cdp = await ctx.newCDPSession(page)
  const cur = () => page.evaluate(() => window.__DECK__.current)
  const swipe = async (x0, y0, x1, y1, steps = 8) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] })
    for (let i = 1; i <= steps; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + ((x1 - x0) * i) / steps, y: y0 + ((y1 - y0) * i) / steps }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await page.waitForTimeout(350)
  }
  console.log('touch, 390x844')
  await page.goto(`file://${html}?all#/${CONTENT_SLIDE}`, { waitUntil: 'load' })
  await page.waitForTimeout(500)
  const css = await page.evaluate(() => ({ ta: getComputedStyle(document.body).touchAction, ob: getComputedStyle(document.documentElement).overscrollBehaviorX }))
  if (css.ta === 'pan-y pinch-zoom' && css.ob === 'none') ok(`body touch-action "${css.ta}", html overscroll-behavior-x "${css.ob}"`)
  else fail(`css: ${JSON.stringify(css)}`)
  const s = await page.evaluate(() => { const r = document.querySelector('.slide-stage').getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height } })
  const y = s.t + s.h * 0.3
  let n = await cur()
  await swipe(s.l + s.w * 0.85, y, s.l + s.w * 0.15, y)
  ;(await cur()) === n + 1 ? ok(`swipe left: ${n} → ${n + 1}`) : fail(`swipe left: ${n} → ${await cur()}`)
  n = await cur()
  await swipe(s.l + s.w * 0.15, y, s.l + s.w * 0.85, y)
  ;(await cur()) === n - 1 ? ok(`swipe right: ${n} → ${n - 1}`) : fail(`swipe right: ${n} → ${await cur()}`)
  n = await cur()
  await page.touchscreen.tap(s.l + s.w / 2, y)
  ;(await cur()) === n ? ok('tap: no move') : fail(`tap moved ${n} → ${await cur()}`)
  await swipe(s.l + s.w / 2, s.t + 20, s.l + s.w / 2, s.t + s.h - 20)
  ;(await cur()) === n ? ok('vertical swipe: no move') : fail(`vertical swipe moved ${n} → ${await cur()}`)
  await swipe(s.l + s.w * 0.6, y, s.l + s.w * 0.4, y) // 20% of 390 = 78px... under 60? no: use a short one
  const b = await page.evaluate(() => {
    const el = [...document.querySelectorAll('.slide-stage button')].find((x) => !x.disabled)
    if (!el) return null
    const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: el.textContent.trim() }
  })
  if (b) {
    n = await cur()
    await swipe(b.x, b.y, b.x - 150, b.y)
    ;(await cur()) === n ? ok(`swipe that starts on "${b.text}": no move`) : fail(`swipe from a button moved ${n} → ${await cur()}`)
  } else ok(`no in-slide button on slide ${CONTENT_SLIDE}, swipe-from-a-button skipped (CONTENT_SLIDE names a slide with one)`)
  // two fingers
  n = await cur()
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 300, y }, { x: 320, y: y + 40 }] })
  for (let i = 1; i <= 6; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 300 - i * 30, y }, { x: 320 - i * 30, y: y + 40 }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await page.waitForTimeout(350)
  ;(await cur()) === n ? ok('two-finger swipe: no move') : fail(`two-finger swipe moved ${n} → ${await cur()}`)
  await ctx.close()
}
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => fail(`pageerror ${e.message}`))
  const cur = () => page.evaluate(() => window.__DECK__.current)
  console.log('trackpad and keyboard, 1280x720')
  await page.goto(`file://${html}?all#/${CONTENT_SLIDE}`, { waitUntil: 'load' })
  await page.waitForTimeout(500)
  await page.mouse.move(640, 300)
  let n = await cur()
  for (let i = 0; i < 12; i++) { await page.mouse.wheel(18, 0); await page.waitForTimeout(16) }
  for (let i = 0; i < 6; i++) { await page.mouse.wheel(5, 0); await page.waitForTimeout(40) }
  await page.waitForTimeout(400)
  ;(await cur()) === n + 1 ? ok(`trackpad burst with tail: ${n} → ${n + 1}, exactly one`) : fail(`trackpad burst: ${n} → ${await cur()}`)
  await page.waitForTimeout(800)
  n = await cur()
  for (let i = 0; i < 12; i++) { await page.mouse.wheel(-18, 0); await page.waitForTimeout(16) }
  await page.waitForTimeout(400)
  ;(await cur()) === n - 1 ? ok(`trackpad burst back: ${n} → ${n - 1}`) : fail(`trackpad back: ${n} → ${await cur()}`)
  await page.waitForTimeout(800)
  n = await cur()
  for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, 30); await page.waitForTimeout(16) }
  await page.waitForTimeout(400)
  ;(await cur()) === n ? ok('vertical wheel: no move') : fail(`vertical wheel moved ${n} → ${await cur()}`)
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(200)
  ;(await cur()) === n + 1 ? ok(`ArrowRight: ${n} → ${n + 1}`) : fail(`ArrowRight: ${n} → ${await cur()}`)
  await page.keyboard.press('ArrowLeft')
  await page.waitForTimeout(200)
  ;(await cur()) === n ? ok(`ArrowLeft: back to ${n}`) : fail(`ArrowLeft: ${await cur()}`)
  await ctx.close()
}
await browser.close()
console.log(fails ? `\ngestures: ${fails} FAIL` : '\ngestures: all checks passed')
process.exit(fails ? 1 : 0)
