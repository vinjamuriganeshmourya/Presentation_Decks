/**
 * agenda-check.mjs — the agenda mark, from the BUILT file.
 *
 *   node agenda-check.mjs [path/to/deck.html]
 *
 * The large word is `Agenda`, the small line is the session's name (deck.config
 * `title`), both inside the mark, the name in at most two lines with no sideways
 * overflow. Then three stress names are written into the mark and the fit is
 * woken through its own ResizeObserver: a 64- and a 71-character name must end
 * at the 11px floor inside the mark, an unbreakable word must break inside the
 * box. Session-owned; written for Python 17 and 18 on 2026-10-05.
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { HTML_FILE, TITLE } from './deck.config.mjs'
/* Which slides to drive. Session 31's numbers are the defaults; a deck sets its own:
   e.g. CONTENT_SLIDE=9 node agenda-check.mjs. (kit, 2026-10-14) */
const AGENDA_SLIDE = Number(process.env.AGENDA_SLIDE ?? 6)
const html = resolve(process.argv[2] ?? HTML_FILE)
/* The small line is the session name: deck.config's title, or AGENDA_NAME for a deck whose agenda names it differently (the kit's gallery). */
const session = process.env.AGENDA_NAME ?? TITLE
const tag = 'agenda'
const OUT = 'workflow/qa-shots/phone'
mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch()
let fails = 0
const fail = (m) => { fails++; console.log('   FAIL', m) }
const ok = (m) => console.log('   ok', m)
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
page.on('pageerror', (e) => fail(`pageerror ${e.message}`))
await page.goto(`file://${html}?all#/${AGENDA_SLIDE}`, { waitUntil: 'load' })
await page.waitForTimeout(1500)
const read = () => page.evaluate(() => {
  const circle = [...document.querySelectorAll('div')].find((d) => d.style.width === '268px' && d.style.height === '268px')
  /* the big word is in the title face since the updated template (2026-10-14) */
  const title = circle.querySelector('p.font-tpl-title')
  const kicker = circle.querySelector('p:not(.font-tpl-title)')
  const R = (e) => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2 } }
  const c = R(circle)
  const inside = (q) => [[q.l, q.t], [q.r, q.t], [q.l, q.b], [q.r, q.b]].every(([x, y]) => Math.hypot(x - c.cx, y - c.cy) <= c.w / 2 - 1)
  const fs = parseFloat(getComputedStyle(kicker).fontSize)
  return {
    title: title.textContent, titleIn: inside(R(title)), titleR: R(title),
    kicker: kicker.textContent, kickerIn: inside(R(kicker)), kickerR: R(kicker), fs,
    lines: Math.round(kicker.scrollHeight / (fs * 1.375)),
    overX: kicker.scrollWidth > kicker.clientWidth + 1, wrap: kicker.style.overflowWrap, clientW: kicker.clientWidth,
    circle: c,
  }
})
let m = await read()
console.log(`${tag}: title "${m.title}", kicker "${m.kicker}" at ${m.fs}px, ${m.lines} line(s), box ${m.clientW}px`)
m.title === 'Agenda' ? ok('large word is Agenda') : fail(`title is "${m.title}"`)
m.kicker === session ? ok('small line is the session name') : fail(`kicker is "${m.kicker}"`)
m.titleIn ? ok('Agenda sits inside the mark') : fail(`title rect ${JSON.stringify(m.titleR)} leaves the circle`)
m.kickerIn ? ok('session name sits inside the mark') : fail(`kicker rect ${JSON.stringify(m.kickerR)} leaves the circle`)
m.lines <= 2 ? ok(`${m.lines} line(s)`) : fail(`${m.lines} lines`)
!m.overX ? ok('no sideways overflow') : fail('sideways overflow')
await page.screenshot({ path: `${OUT}/${tag}-agenda-after.png` })

// THE POINTS: centred on the mark's centre line (y 366), evenly gapped, badges on
// the arc, clear of the speaker box, and no annotation-like black rule anywhere.
const pts = await page.evaluate(() => {
  const stage = document.querySelector('.slide-stage').getBoundingClientRect()
  const rel = (r) => ({ l: r.left - stage.left, t: r.top - stage.top, r: r.right - stage.left, b: r.bottom - stage.top, cx: r.left - stage.left + r.width / 2, cy: r.top - stage.top + r.height / 2 })
  const badges = [...document.querySelectorAll('.slide-stage span.h-9.w-9')].map((b) => rel(b.getBoundingClientRect()))
  const texts = [...document.querySelectorAll('.slide-stage p.text-\\[27px\\]')].map((p) => rel(p.parentElement.getBoundingClientRect()))
  const path = document.querySelector('.slide-stage svg path')
  const len = path.getTotalLength()
  const svg = path.ownerSVGElement.getBoundingClientRect()
  const onArc = badges.map((b) => {
    let best = 1e9
    for (let d = 0; d <= len; d += 2) {
      const q = path.getPointAtLength(d)
      // the svg's viewBox starts at x 360, so its user x maps to slide x directly; y likewise
      const dist = Math.hypot(q.x - b.cx, q.y - b.cy)
      if (dist < best) best = dist
    }
    return best
  })
  const black = [...document.querySelectorAll('.slide-stage *')].filter((el) => {
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    const dark = (c) => /^rgba?\(0, 0, 0(, 1)?\)$/.test(c)
    return r.width > 400 && r.height <= 4 && (dark(cs.backgroundColor) || (dark(cs.borderTopColor) && parseFloat(cs.borderTopWidth) > 0))
  }).length
  return { badges, texts, onArc, black, svgLeft: svg.left - stage.left }
})
const n = pts.badges.length
const centre = (pts.badges[0].cy + pts.badges[n - 1].cy) / 2
Math.abs(centre - 366) <= 1 ? ok(`group centred on y 366 (${centre.toFixed(1)})`) : fail(`group centre ${centre.toFixed(1)}, wanted 366`)
const gaps = pts.badges.slice(1).map((b, i) => b.cy - pts.badges[i].cy)
const even = gaps.every((g) => Math.abs(g - gaps[0]) <= 1)
even ? ok(`${n} points, gaps ${gaps.map((g) => g.toFixed(1)).join(', ')}`) : fail(`uneven gaps ${gaps.map((g) => g.toFixed(1)).join(', ')}`)
pts.onArc.every((d) => d <= 2) ? ok(`every badge on the arc (max ${Math.max(...pts.onArc).toFixed(2)}px off)`) : fail(`badge off the arc: ${pts.onArc.map((d) => d.toFixed(1)).join(', ')}`)
const hitsBox = pts.texts.filter((t) => t.r > 913 && t.t < 220)
hitsBox.length === 0 ? ok('no point reaches the speaker box') : fail(`${hitsBox.length} point(s) reach the speaker box`)
const off = pts.texts.filter((t) => t.r > 1216 + 0.5 || t.b > 712 || t.t < 0)
off.length === 0 ? ok('every point inside the frame') : fail(`${off.length} point(s) leave the frame`)
pts.black === 0 ? ok('no black rule on the slide') : fail(`${pts.black} black rule(s) on the slide`)

// stress the fit through the hook's own trigger: new text, then a width change
const stress = async (text, label) => {
  await page.evaluate((t) => {
    const circle = [...document.querySelectorAll('div')].find((d) => d.style.width === '268px')
    const k = circle.querySelector('p:not(.font-heading)')
    k.textContent = t
    const box = k.parentElement
    box.style.paddingLeft = box.style.paddingLeft === '41px' ? '40px' : '41px' // a 1px width change wakes the ResizeObserver
  }, text)
  await page.waitForTimeout(400)
  const r = await read()
  console.log(`   "${label}": ${r.fs}px, ${r.lines} line(s), overflow-wrap ${r.wrap || 'normal'}, sideways overflow ${r.overX}`)
  const noOverlap = r.kickerR.b <= r.titleR.t + 0.5
  const fits = !r.overX && r.kickerIn && r.titleIn && noOverlap && (r.lines <= 2 || r.fs <= 11)
  fits ? ok(`fits: ${label}${r.lines > 2 ? ' (at the floor, ' + r.lines + ' lines, inside the mark)' : ''}`) : fail(`does not fit: ${label} ${JSON.stringify({ lines: r.lines, overX: r.overX, kickerIn: r.kickerIn, titleIn: r.titleIn, noOverlap, fs: r.fs })}`)
  if (r.fs >= 16 && label !== 'short') fail(`${label}: size did not shrink (${r.fs}px)`)
}
await stress('Leveraging Generative AI for Accelerated and Deliberate Learning', 'long (64 chars)')
await page.screenshot({ path: `${OUT}/${tag}-agenda-stress-long.png` })
await stress('Object Oriented Programming Fundamentals and Design Principles in Python', 'longer (71 chars)')
await stress('Supercalifragilisticexpialidocious_Programming_Foundations', 'one unbreakable word (57 chars)')
await page.screenshot({ path: `${OUT}/${tag}-agenda-stress-word.png` })
await browser.close()
console.log(fails ? `\n${tag} agenda: ${fails} FAIL` : `\n${tag} agenda: all checks passed`)
process.exit(fails ? 1 : 0)
