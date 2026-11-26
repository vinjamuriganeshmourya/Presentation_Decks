/**
 * Video-box reservation check.
 *
 * A 367x220 area at the top right of the 1280x720 slide is reserved
 * (equivalently 550x330 on a 1920x1080 canvas) for an
 * instructor video box composited in later. The box is NOT drawn on the slides;
 * this script only asserts that no slide content is placed inside it.
 *
 *   reserved rect: x 913..1280, y 0..220
 *
 * Usage:  CHROME_PATH=/opt/google/chrome/chrome node video-safe.mjs <url> <count>
 *
 * WHAT COUNTS AS CONTENT
 * Measuring elements is useless here: every slide has full-bleed layout wrappers
 * that "overlap" the area while painting nothing in it. So this measures the
 * things that actually put ink on the slide:
 *   - text nodes, via Range client rects (a wide container with short text is
 *     correctly judged by where the glyphs land, not by the container)
 *   - img / svg / canvas / video elements
 *   - elements with their own visible background or border that are not
 *     full-bleed (under 80% of the slide in either dimension)
 * Anything pointer-events-none is skipped: those are decorative blobs and arcs
 * that bleed off-canvas by design, and the video will sit over them harmlessly.
 */

import { chromium } from 'playwright'
import { SLIDE_COUNT, DEV_PORT } from './deck.config.mjs'

const URL = process.argv[2] ?? `http://localhost:${DEV_PORT}/?all`
const TOTAL = Number(process.argv[3] ?? SLIDE_COUNT)
// 550x330 was specified against a 1920x1080 canvas; this deck is authored at
// 1280x720, so the equivalent reservation is 367x220 at the top right.
const RESERVED = { x: 1280 - 367, y: 0, w: 367, h: 220 }

const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
)
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })

const offenders = []

for (let i = 1; i <= TOTAL; i++) {
  await page.goto(`${URL}#/${i}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  const res = await page.evaluate((R) => {
    // The visible slide is the last <section> that is actually on screen.
    const sections = [...document.querySelectorAll('section')]
    const sec =
      sections.find((s) => {
        const r = s.getBoundingClientRect()
        return r.width > 100 && r.height > 100 && getComputedStyle(s).opacity !== '0'
      }) ?? sections[0]
    if (!sec) return { title: '', hits: [] }

    const base = sec.getBoundingClientRect()
    const hidden = (el) => {
      for (let n = el; n && n !== document.body; n = n.parentElement) {
        const cs = getComputedStyle(n)
        if (cs.visibility === 'hidden' || cs.opacity === '0' || cs.display === 'none') return true
        if (typeof n.className === 'string' && /pointer-events-none/.test(n.className)) return true
      }
      return false
    }
    const rel = (r) => ({
      x: r.left - base.left,
      y: r.top - base.top,
      w: r.width,
      h: r.height,
    })
    const intrudes = (b) =>
      // require more than a hairline of real overlap: an element whose edge
      // lands exactly on the boundary is not an intrusion.
      b.w > 1 && b.h > 1 && b.x + b.w > R.x + 1 && b.x < R.x + R.w && b.y + b.h > R.y + 1 && b.y < R.y + R.h

    const hits = []
    const push = (kind, b, txt, el) =>
      hits.push({
        kind,
        x: Math.round(b.x),
        y: Math.round(b.y),
        w: Math.round(b.w),
        h: Math.round(b.h),
        over: Math.round(b.x + b.w - R.x),
        txt: (txt || '').trim().slice(0, 44),
        cls: (typeof el?.className === 'string' ? el.className : '').slice(0, 44),
      })

    // 1. text nodes
    const tw = document.createTreeWalker(sec, NodeFilter.SHOW_TEXT)
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      if (!n.nodeValue || !n.nodeValue.trim()) continue
      const el = n.parentElement
      if (!el || hidden(el)) continue
      const range = document.createRange()
      range.selectNodeContents(n)
      for (const r of range.getClientRects()) {
        const b = rel(r)
        if (intrudes(b)) push('text', b, n.nodeValue, el)
      }
    }

    // 2. media
    for (const el of sec.querySelectorAll('img, svg, canvas, video')) {
      if (hidden(el)) continue
      const b = rel(el.getBoundingClientRect())
      if (intrudes(b)) push(el.tagName.toLowerCase(), b, el.getAttribute('alt') || '', el)
    }

    // 3. painted surfaces that are not full-bleed
    for (const el of sec.querySelectorAll('div, span, li, td, th, figure, header, aside')) {
      if (hidden(el)) continue
      const cs = getComputedStyle(el)
      const hasBg = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent'
      const hasBorder = parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderLeftWidth) > 0
      if (!hasBg && !hasBorder) continue
      const b = rel(el.getBoundingClientRect())
      if (b.w > base.width * 0.8 || b.h > base.height * 0.8) continue // full-bleed wrapper
      if (intrudes(b)) push('surface', b, el.textContent, el)
    }

    const h = sec.querySelector('h1, h2')
    return { title: h ? h.textContent.trim().slice(0, 38) : '', hits }
  }, RESERVED)

  if (res.hits.length) offenders.push({ slide: i, ...res })
}

console.log(`reserved: x${RESERVED.x}..${RESERVED.x + RESERVED.w}  y${RESERVED.y}..${RESERVED.y + RESERVED.h}\n`)
if (!offenders.length) {
  console.log('CLEAN: nothing is placed in the reserved video area.')
} else {
  for (const o of offenders) {
    const worst = Math.max(...o.hits.map((h) => h.over))
    console.log(`slide ${String(o.slide).padStart(2)}  <${o.title}>  ${o.hits.length} hit(s), worst ${worst}px in`)
    for (const h of o.hits.slice(0, 3)) {
      console.log(`      ${h.kind} @${h.x},${h.y} ${h.w}x${h.h}  "${h.txt}"`)
    }
  }
  console.log(`\n${offenders.length} of ${TOTAL} slides intrude`)
}

await browser.close()
