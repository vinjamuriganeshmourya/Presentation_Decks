/**
 * phone-nav-check.mjs — the control bar on phone viewports, from the BUILT file.
 *
 *   node phone-nav-check.mjs [path/to/deck.html]
 *
 * Six portrait sizes (320 to 480 wide) and their landscapes, each rotated in
 * place. Asserts: every bar button at least 44x44, the bar inside the viewport,
 * no document overflow, two rows under 560px and one above, the stage inside the
 * viewport; in `dock` mode the bar never overlaps the stage; in `overlay` mode
 * the bar is gone 3s after load. The mode is read from the page
 * (`[data-deck-controls][data-mobile]`), so the same script serves both.
 * Screenshots land in workflow/qa-shots/phone/ (ignored by git).
 * Session-owned; written for Python 17 and 18 on 2026-10-05.
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { HTML_FILE, TITLE } from './deck.config.mjs'
/* Which slides to drive. Session 31's numbers are the defaults; a deck sets its own:
   e.g. CONTENT_SLIDE=9 node phone-nav-check.mjs. (kit, 2026-10-14) */
const CONTENT_SLIDE = Number(process.env.CONTENT_SLIDE ?? 8)
const html = resolve(process.argv[2] ?? HTML_FILE)
const tag = 'phone'
let mode = null
const OUT = 'workflow/qa-shots/phone'
mkdirSync(OUT, { recursive: true })
const PORTRAIT = [[320, 568], [360, 740], [375, 667], [390, 844], [412, 915], [480, 854]]
const LANDSCAPE = PORTRAIT.map(([w, h]) => [h, w])
const browser = await chromium.launch()
let fails = 0
const fail = (m) => { fails++; console.log('   FAIL', m) }

const measure = () => {
  const bar = document.querySelector('[data-deck-controls]')
  const vw = innerWidth, vh = innerHeight
  if (!bar) return { nobar: true, vw, vh }
  const pill = bar.firstElementChild
  const R = (e) => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height } }
  const cs = getComputedStyle(bar)
  const se = document.scrollingElement
  const stage = document.querySelector('.slide-stage')
  return {
    vw, vh,
    mode: bar.dataset.mobile ?? 'desktop',
    bar: R(bar), pill: R(pill),
    opacity: Number(cs.opacity), transform: cs.transform,
    buttons: [...bar.querySelectorAll('button')].map((b) => ({ label: b.getAttribute('aria-label'), ...R(b) })),
    stage: R(stage),
    overflow: se.scrollWidth > vw + 0.5 || se.scrollHeight > vh + 0.5,
    rows: new Set([...bar.querySelectorAll('button')].map((b) => Math.round(b.getBoundingClientRect().top))).size,
  }
}

function check(m, w, h, label) {
  const narrow = w <= 559
  const exp = mode
  if (m.nobar) return fail(`${label}: no [data-deck-controls]`)
  if (m.mode !== exp) fail(`${label}: mode ${m.mode}, expected ${exp}`)
  const small = m.buttons.filter((b) => b.w < 43.5 || b.h < 43.5)
  if (small.length) fail(`${label}: small targets ${small.map((b) => `${b.label} ${b.w.toFixed(0)}x${b.h.toFixed(0)}`).join(', ')}`)
  if (m.pill.l < -0.5 || m.pill.r > m.vw + 0.5 || m.pill.b > m.vh + 0.5 || m.pill.t < -0.5) fail(`${label}: pill outside viewport ${JSON.stringify(m.pill)}`)
  if (m.overflow) fail(`${label}: document overflows the viewport`)
  if (m.rows !== (narrow ? 2 : 1)) fail(`${label}: ${m.rows} rows, expected ${narrow ? 2 : 1}`)
  if (exp === 'dock' && m.stage.b > m.pill.t + 0.5) fail(`${label}: dock bar overlaps the stage (stage.b ${m.stage.b.toFixed(1)} > pill.t ${m.pill.t.toFixed(1)})`)
  if (m.stage.r > m.vw + 0.5 || m.stage.b > m.vh + 0.5 || m.stage.l < -0.5 || m.stage.t < -0.5) fail(`${label}: stage outside viewport ${JSON.stringify(m.stage)}`)
  const over = exp === 'overlay' && m.stage.b > m.pill.t ? ` (overlay covers ${(m.stage.b - m.pill.t).toFixed(0)}px of stage while shown)` : ''
  console.log(`   ok ${label}: ${m.mode}, ${m.rows} row(s), ${m.buttons.length} buttons ≥44, pill ${m.pill.w.toFixed(0)}x${m.pill.h.toFixed(0)} at y ${m.pill.t.toFixed(0)}..${m.pill.b.toFixed(0)} of ${m.vh}, stage ${m.stage.w.toFixed(0)}x${m.stage.h.toFixed(0)}${over}`)
}

for (const [w, h] of [...PORTRAIT, ...LANDSCAPE]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => fail(`pageerror ${e.message}`))
  await page.goto(`file://${html}?all#/${CONTENT_SLIDE}`, { waitUntil: 'load' })
  await page.waitForTimeout(900)
  const m = await page.evaluate(measure)
  if (!mode) { mode = m.mode === 'desktop' ? null : m.mode; console.log(`mode on the page: ${mode}`) }
  console.log(`${tag} ${w}x${h}`)
  check(m, w, h, `${w}x${h}`)
  await page.screenshot({ path: `${OUT}/${w}x${h}.png` })
  if (mode === 'overlay') {
    await page.waitForTimeout(3000)
    const m2 = await page.evaluate(measure)
    const gone = m2.opacity < 0.05 && m2.bar.t >= m2.vh - 0.5
    if (!gone) fail(`${w}x${h}: overlay bar not hidden after 3.9s (opacity ${m2.opacity}, top ${m2.bar.t.toFixed(0)} of ${m2.vh})`)
    else console.log(`   ok ${w}x${h}: hidden after inactivity (bar top ${m2.bar.t.toFixed(0)} ≥ ${m2.vh})`)
    await page.screenshot({ path: `${OUT}/${w}x${h}-hidden.png` })
  }
  // orientation change in the same page
  await page.setViewportSize({ width: h, height: w })
  await page.waitForTimeout(700)
  if (mode === 'overlay') await page.evaluate(() => document.querySelector('[data-deck-controls] button').focus())
  await page.waitForTimeout(300)
  const m3 = await page.evaluate(measure)
  check(m3, h, w, `${w}x${h} → rotated to ${h}x${w}`)
  await ctx.close()
}
await browser.close()
console.log(fails ? `\n${tag}: ${fails} FAIL` : `\n${tag}: all layout checks passed`)
process.exit(fails ? 1 : 0)
