/**
 * Content rules 42 and 43, checked on the BUILT file at every build step.
 *
 *   42  An arrow or connector never overlaps a box. Every small <svg> carrying a
 *       path, line or polygon (an arrowhead, a cursor, a connector) is tested
 *       against every bordered box on the slide that is neither its ancestor nor
 *       its descendant. An overlap of more than 2px either way is a failure.
 *   43  A highlight matches the bounds of what it highlights. Every glow wrapper
 *       (an element whose inline transition animates box-shadow and that wraps a
 *       single child) must be within 2px of its child's width and height.
 *   47  A label never sits on a box. Every absolutely placed piece of text (a
 *       callout, an annotation, a ring's label) is tested against every box it
 *       is not inside: a bordered or ringed box, a code block, any panel with an
 *       opaque fill. An overlap of more than 2px either way is a failure.
 *
 * Run: node overlap-check.mjs [path/to/built.html] [slideCount]
 * Defaults come from deck.config.mjs. Exits 1 when anything fails.
 */
import { chromium } from 'playwright'
import { resolve } from 'node:path'
import { HTML_FILE, SLIDE_COUNT } from './deck.config.mjs'

const file = resolve(process.argv[2] ?? HTML_FILE)
const count = Number(process.argv[3] ?? SLIDE_COUNT)
const b = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {})
const p = await b.newPage({ viewport: { width: 1280, height: 720 } })

const probe = () => {
  const stage = [...document.querySelectorAll('section')].filter((s) => s.getBoundingClientRect().width >= 1200).pop()
  if (!stage) return { arrows: [], glows: [], labels: [] }
  const vis = (e) => {
    for (let x = e; x && x !== stage; x = x.parentElement) {
      const cs = getComputedStyle(x)
      if (cs.opacity === '0' || cs.visibility === 'hidden' || cs.display === 'none') return false
    }
    const r = e.getBoundingClientRect()
    return r.width > 0 && r.height > 0
  }
  const R = (e) => e.getBoundingClientRect()
  const text = (e) => (e.textContent || '').trim().slice(0, 30)
  const boxes = [...stage.querySelectorAll('*')].filter((e) => {
    if (e instanceof SVGElement) return false
    const cs = getComputedStyle(e)
    const bw = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderLeftWidth)
    const ring = /inset/.test(cs.boxShadow) && !/0px 0px 0px 0px/.test(cs.boxShadow)
    const r = R(e)
    return (bw >= 2 || ring) && r.width >= 20 && r.height >= 20 && r.width < 1000 && vis(e)
  })
  const arrows = []
  for (const s of stage.querySelectorAll('svg')) {
    const r = R(s)
    if (!vis(s) || r.width > 120 || r.height > 120) continue
    if (!s.querySelector('path, line, polygon, polyline')) continue
    if (s.closest('button')) continue /* an icon on a control */
    for (const bx of boxes) {
      if (bx.contains(s) || s.contains(bx)) continue
      const q = R(bx)
      const ox = Math.min(r.right, q.right) - Math.max(r.left, q.left)
      const oy = Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top)
      if (ox > 2 && oy > 2) arrows.push(`arrow at ${Math.round(r.left)},${Math.round(r.top)} overlaps box "${text(bx)}" by ${Math.round(ox)}x${Math.round(oy)}px`)
    }
  }
  const glows = []
  for (const g of stage.querySelectorAll('[style*="box-shadow"]')) {
    const st = g.getAttribute('style') || ''
    if (!/transition:[^;]*box-shadow/.test(st) || g.children.length !== 1 || !vis(g)) continue
    if (/inset/.test(getComputedStyle(g).boxShadow)) continue /* a ring drawn on the element's own edge, not a wrapper */
    const a = R(g), c = R(g.children[0])
    if (Math.abs(a.width - c.width) > 2 || Math.abs(a.height - c.height) > 2)
      glows.push(`highlight ${Math.round(a.width)}x${Math.round(a.height)} around "${text(g)}", which is ${Math.round(c.width)}x${Math.round(c.height)}`)
  }
  /* 47: absolutely placed text against every box it is not part of */
  const opaque = (cs) => {
    const m = cs.backgroundColor.match(/rgba?\(([^)]+)\)/)
    if (!m) return false
    const a = m[1].split(',').map(Number)
    return a.length < 4 || a[3] > 0.5
  }
  const solid = [...stage.querySelectorAll('*')].filter((e) => {
    if (e instanceof SVGElement) return false
    const cs = getComputedStyle(e)
    const bw = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderLeftWidth)
    const ring = /inset/.test(cs.boxShadow) && !/0px 0px 0px 0px/.test(cs.boxShadow)
    const r = R(e)
    return (bw >= 2 || ring || opaque(cs) || e.tagName === 'PRE') && r.width >= 40 && r.height >= 24 && r.width < 1000 && vis(e)
  })
  const placed = (e) => {
    for (let x = e; x && x !== stage; x = x.parentElement) if (getComputedStyle(x).position === 'absolute') return true
    return false
  }
  const labels = []
  for (const t of stage.querySelectorAll('span, div, p')) {
    const own = [...t.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1)
    if (!own || !vis(t) || !placed(t) || t.closest('button, pre, code')) continue
    const r = R(t)
    for (const bx of solid) {
      if (bx.contains(t) || t.contains(bx)) continue
      const q = R(bx)
      /* text set wholly inside an empty shape is that shape's own label (the agenda mark) */
      if (!text(bx) && r.left >= q.left && r.right <= q.right && r.top >= q.top && r.bottom <= q.bottom) continue
      const ox = Math.min(r.right, q.right) - Math.max(r.left, q.left)
      const oy = Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top)
      if (ox > 2 && oy > 2) labels.push(`label "${text(t)}" overlaps box "${text(bx)}" by ${Math.round(ox)}x${Math.round(oy)}px`)
    }
  }
  return { arrows, glows, labels }
}

let fails = 0
for (let n = 1; n <= count; n++) {
  await p.goto(`file://${file}?nav=steps&noauto&oc=${n}#/${n}`) /* PF 30: eight slides open with Autoplay on; the sweep steps them itself */
  await p.waitForTimeout(1600)
  const seen = new Set()
  for (let k = 0; k <= 40; k++) {
    await p.waitForTimeout(700)
    const { arrows, glows, labels } = await p.evaluate(probe)
    for (const m of [...arrows.map((a) => `42 ${a}`), ...glows.map((g) => `43 ${g}`), ...labels.map((l) => `47 ${l}`)]) {
      if (seen.has(m)) continue
      seen.add(m)
      fails++
      console.log(`slide ${n} step ${k}: rule ${m}`)
    }
    const h = await p.evaluate(() => location.hash)
    await p.keyboard.press('ArrowRight')
    await p.waitForTimeout(250)
    if ((await p.evaluate(() => location.hash)) !== h) break
  }
}
await b.close()
console.log(fails ? `\n${fails} finding(s)` : `\noverlap-check: no arrow over a box, every highlight on its own bounds, no label on a box (${count} slides, every step)`)
process.exit(fails ? 1 : 0)
