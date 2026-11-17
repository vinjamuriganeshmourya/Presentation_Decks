// The deck's Autoplay (2026-10-07), the slide menu's Auto-play setting (2026-10-12, PF 29) and the restart on
// re-entry (2026-10-12, PF 30), on the BUILT file: the per-slide default, that listed slides play by themselves
// and the rest hold still, the per-slide switch (plays, pauses on a manual press, resumes), the menu's option
// (immediate, kept across a reload, Off holds every slide, On plays again), and a listed slide starting again
// after leaving and coming back. Run: node autoplay-check.mjs
import { chromium } from 'playwright-core'
import { readdirSync } from 'node:fs'
/* Which slides to drive. Session 31's numbers are the defaults; a deck sets its own:
   e.g. CONTENT_SLIDE=9 node autoplay-check.mjs. (kit, 2026-10-14) */
const RESTART_SLIDE = Number(process.env.RESTART_SLIDE ?? 4) // a listed autoplay slide
const SWITCH_SLIDE = Number(process.env.SWITCH_SLIDE ?? 16) // a slide with the per-slide switch
const MENU_SLIDE = Number(process.env.MENU_SLIDE ?? 7) // a slide reachable from the picker's autoplay menu
const html = `${process.cwd()}/dist-single/${readdirSync('dist-single').find((f) => f !== 'index.html' && f.endsWith('.html'))}`
/* WHICH SLIDES AUTOPLAY IS THE DECK'S OWN LIST. AUTOPLAY_ON="3,4,7" names them; the
   default is PF 31's. AUTOPLAY_TOTAL caps the walk (a feedback iframe never goes
   network-idle); AUTOPLAY_SAMPLE names the slides timed for 8s. (kit, 2026-10-14) */
const ON = new Set((process.env.AUTOPLAY_ON ?? '3,4,7,8,11,12,13,14,21,23,24,25,26,27,31').split(',').map(Number)) /* PF 31's own list: the hooks, the explainer, the concept cards without a vote; 3, 13 and 31 added on the user's word (2026-10-13) */
const TOTAL = Number(process.env.AUTOPLAY_TOTAL ?? 31) /* the feedback iframe never goes network-idle; 32 and 33 have no steps */
const b = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {})
const p = await b.newPage({ viewport: { width: 1280, height: 720 } })
await p.addInitScript(() => { window.__steps = 0; window.addEventListener('deck:navigate', (e) => e.detail.kind === 'step' && window.__steps++) })
let fails = 0
const ok = (c, m) => { if (!c) fails++; console.log(`${c ? '   ok' : '   FAIL'} ${m}`) }
const sw = () => p.evaluate(() => [...document.querySelectorAll('button')].find((x) => (x.getAttribute('aria-label') ?? '').startsWith('Autoplay') || x.textContent.includes('Autoplay'))?.getAttribute('aria-pressed') ?? 'none')
const steps = () => p.evaluate(() => window.__steps)
const defaults = []
for (let i = 1; i <= TOTAL; i++) {
  await p.goto(`file://${html}?v=${i}#/${i}`, { waitUntil: 'load' }); await p.waitForTimeout(300)
  const s = await sw()
  defaults.push(`${i}:${s === 'true' ? 'on' : s === 'false' ? 'off' : '-'}`)
  if (s !== 'none') ok((s === 'true') === ON.has(i), `slide ${i}: Autoplay ${s === 'true' ? 'On' : 'Off'} by default`)
  else ok(!ON.has(i), `slide ${i}: no built steps, no switch`)
}
console.log('  ', defaults.join(' '))
if (!defaults.some((d) => !d.endsWith(':-'))) {
  console.log('\nautoplay: no slide in this deck carries the Autoplay switch, so there is nothing to check here (a deck lists its autoplay slides in AUTOPLAY_ON)')
  await b.close(); process.exit(0)
}
/* a listed slide plays by itself; an unlisted one holds still */
for (const n of (process.env.AUTOPLAY_SAMPLE ?? '3,4,9,13,15,16,26,28,31').split(',').map(Number)) {
  await p.goto(`file://${html}?v=x${n}#/${n}`, { waitUntil: 'load' }); await p.waitForTimeout(8000)
  const k = await steps()
  ok(ON.has(n) ? k >= 1 : k === 0, `slide ${n}: ${k} step(s) by itself in 8s (${ON.has(n) ? 'listed' : 'not listed'})`)
}
/* a listed slide starts again after leaving and coming back (PF 30) */
await p.goto(`file://${html}?v=re#/${RESTART_SLIDE}`, { waitUntil: 'load' }); await p.waitForTimeout(5000)
const played4 = await steps()
await p.keyboard.press('Control+ArrowRight'); await p.waitForTimeout(400)
const leftAt = await steps()
await p.waitForTimeout(7000)
ok((await steps()) === leftAt, `left slide 4 for slide 5: no step by itself in 7s away (${leftAt - played4} fired while leaving)`)
await p.keyboard.press('Control+ArrowLeft'); await p.waitForTimeout(600)
const hash = await p.evaluate(() => location.hash)
const back = await steps()
await p.waitForTimeout(7000)
const after = await steps()
ok(hash.startsWith('#/' + RESTART_SLIDE) && after > back && (await sw()) === 'true', `back on slide ${RESTART_SLIDE}: restarted from press 1, ${after - back} step(s) by itself in 7s, switch On`)
/* the per-slide switch, on a slide that opens off (G1, 24 presses, so a resume still has steps left) */
const clickSwitch = () => p.evaluate(() => [...document.querySelectorAll('button')].find((x) => (x.getAttribute('aria-label') ?? '').startsWith('Autoplay') || x.textContent.includes('Autoplay')).click())
await p.goto(`file://${html}?v=m#/${SWITCH_SLIDE}`, { waitUntil: 'load' }); await p.waitForTimeout(400)
await clickSwitch(); await p.waitForTimeout(7000)
const played = await steps()
ok((await sw()) === 'true' && played >= 1, `slide 16 pressed on: ${played} step(s) by itself in 7s`)
await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300)
ok((await sw()) === 'false', 'a manual press pauses it: switch reads Off')
const before = await steps(); await p.waitForTimeout(7000)
ok((await steps()) === before, 'paused: no step in 7s')
await clickSwitch(); await p.waitForTimeout(6000)
ok((await sw()) === 'true' && (await steps()) > before, 'switched back on: resumes from the step on screen')
/* the slide menu's Auto-play option */
const menuCard = (which) => p.evaluate((w) => {
  const c = [...document.querySelectorAll('[role="dialog"][aria-label="Jump to a slide"] [role="group"][aria-label="Auto-play"] button')].find((x) => x.textContent.trim().startsWith(w))
  if (!c) return 'none'
  return c.getAttribute('aria-pressed')
}, which)
const clickCard = (which) => p.evaluate((w) => [...document.querySelectorAll('[role="dialog"][aria-label="Jump to a slide"] [role="group"][aria-label="Auto-play"] button')].find((x) => x.textContent.trim().startsWith(w)).click(), which)
await p.goto(`file://${html}?v=menu#/${MENU_SLIDE}`, { waitUntil: 'load' }); await p.waitForTimeout(400)
ok((await sw()) === 'true', 'slide 7 opens with Autoplay On (the menu setting is On when the deck first loads)')
await p.keyboard.press('g'); await p.waitForTimeout(500)
ok((await menuCard('ON')) === 'true' && (await menuCard('OFF')) === 'false', 'the menu shows Auto-play: the ON card pressed')
await clickCard('OFF'); await p.waitForTimeout(300)
ok((await menuCard('OFF')) === 'true' && (await sw()) === 'false', 'Off in the menu: the slide switch reads Off at once')
await p.keyboard.press('Escape'); await p.waitForTimeout(300)
const k0 = await steps(); await p.waitForTimeout(7000)
ok((await steps()) === k0, 'Off: no step by itself in 7s on a listed slide')
await p.goto(`file://${html}?v=menu2#/8`, { waitUntil: 'load' }); await p.waitForTimeout(400)
ok((await sw()) === 'false', 'after a reload, slide 8 opens Off: the choice is kept')
await p.keyboard.press('g'); await p.waitForTimeout(500)
ok((await menuCard('OFF')) === 'true', 'the menu still shows OFF pressed')
await clickCard('ON'); await p.waitForTimeout(300)
ok((await sw()) === 'true', 'On in the menu: the slide switch reads On at once')
await p.keyboard.press('Escape'); await p.waitForTimeout(7000)
ok((await steps()) >= 1, `On again: ${await steps()} step(s) by itself in 7s`)
await p.goto(`file://${html}?v=menu3#/9`, { waitUntil: 'load' }); await p.waitForTimeout(8000)
ok((await steps()) === 0 && (await sw()) === 'false', 'slide 9 (not listed) still holds still with the setting On')
await p.goto(`file://${html}?all#/4`, { waitUntil: 'load' }); await p.waitForTimeout(6000)
ok((await steps()) === 0, '?all (the harnesses): never plays')
console.log(fails ? `\nautoplay: ${fails} failure(s)` : '\nautoplay: all checks passed')
await b.close()
