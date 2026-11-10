/**
 * AUTO ANIMATION CHECK (user, 2026-11-03). Drives the BUILT file:
 *   1. presenter view opens with auto animation ON: a plain right arrow moves one slide;
 *   2. student view (`?view=student`) opens with it OFF: walking the whole deck with the right
 *      arrow, every press either plays one animation step or, after the last, moves one slide,
 *      never skipping a slide, and no page error is thrown;
 *   3. the bar's toggle (and `P`) flips it in either view.
 * Must print AUTO ANIMATION OK.
 */
import { chromium } from 'playwright-core'
import { resolve } from 'node:path'
const html = resolve('dist-single/containers-vs-virtual-machines.html')
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH })
const p = await b.newPage({ viewport: { width: 1280, height: 720 } })
const errors = []
p.on('pageerror', (e) => errors.push(e.message))
let bad = 0
const fail = (m) => { bad++; console.log('FAIL', m) }
const cur = () => p.evaluate(() => window.__DECK__.current)
const steps = () => p.evaluate(() => window.__DECK_STEPS__ ?? { at: 0, total: 0 })
const label = () => p.evaluate(() => document.querySelector('[aria-label^="Auto animation"]')?.getAttribute('aria-label') ?? '')

await p.goto(`file://${html}#/5`, { waitUntil: 'load' }); await p.waitForTimeout(1500)
if (!(await label()).startsWith('Auto animation is on')) fail('presenter view does not open with auto animation on')
await p.keyboard.press('ArrowRight'); await p.waitForTimeout(500)
if ((await cur()) !== 6) fail(`presenter right arrow: 5 -> ${await cur()}`)
await p.keyboard.press('p'); await p.waitForTimeout(300)
if (!(await label()).startsWith('Auto animation is off')) fail('P did not turn auto animation off in the presenter view')

const total = await p.evaluate(() => window.__DECK__.total)
await p.goto(`file://${html}?view=student&v=2#/1`, { waitUntil: 'load' }); await p.waitForTimeout(1200)
if (!(await label()).startsWith('Auto animation is off')) fail('student view does not open with auto animation off')
let n = 1, presses = 0
while (n < total && presses < 1500) {
  const s = await steps()
  await p.keyboard.press('ArrowRight'); presses++
  await p.waitForTimeout(140)
  const m = await cur()
  if (s.at < s.total) {
    if (m !== n) fail(`slide ${n}: a press with steps left (${s.at}/${s.total}) changed slide to ${m}`)
  } else {
    if (m !== n + 1) fail(`slide ${n}: the press after the last step went to ${m}`)
    n = m
    await p.waitForTimeout(260)
  }
}
console.log(`student walk: ${total} slides in ${presses} presses`)
await p.click('[aria-label^="Auto animation"]', { force: true }); await p.waitForTimeout(300)
if (!(await label()).startsWith('Auto animation is on')) fail('the bar toggle did not turn auto animation on in the student view')
if (errors.length) fail(`page errors: ${[...new Set(errors)].join(' | ')}`)
await b.close()
console.log(bad ? `${bad} failure(s)` : 'AUTO ANIMATION OK')
process.exit(bad ? 1 : 0)
