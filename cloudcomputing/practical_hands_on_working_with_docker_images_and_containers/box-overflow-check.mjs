/**
 * BOX-OVERFLOW CHECK: no text may run outside the box it is drawn in, at any
 * build step (user, 2026-10-08, on PF 25's takeaways: "make sure no overflow
 * happens, it is a global rule").
 *
 * For every visible text node inside a card (`[data-spec]`), it measures the
 * text's own extent (a Range, so a wrapped line is measured as drawn, not as
 * its element's box) and finds the nearest ancestor that is drawn as a box: a
 * background, a border, an inset ring or a shadow. The text must sit inside
 * that box, and inside every clipping (overflow hidden/auto/scroll) ancestor
 * on the way. It also reports an element whose content is clipped by its own
 * overflow (scrollWidth or scrollHeight past its client size), the case where
 * text is cut off rather than spilling, and a group (`[data-group]`, the
 * deck's `Group`) whose content runs past its own box (PF 29, 2026-10-12).
 *
 * None of qa, align-check, overlap-check or controls-clear sees this: all of
 * them measure an element against the frame, a zone or another element,
 * never text against the box around it. Session 25's takeaway sentences ran
 * out of their cards past all of them.
 *
 *   node box-overflow-check.mjs [baseUrl] [slideCount]
 */
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const cfg = JSON.parse(readFileSync('deck.config.json', 'utf8'))
const BASE = process.argv[2] ?? `http://localhost:${cfg.devPort}`
const TOTAL = Number(process.argv[3] ?? cfg.slideCount)
const STEPS = JSON.parse(readFileSync('src/export/revealSteps.ts', 'utf8').match(/PAGE_REVEAL_MAX_STEPS: number\[\] = (\[[^\]]*\])/)[1])
const SETTLE = 2200
const TOL = 1

const b = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {})
const p = await b.newPage({ viewport: { width: 1280, height: 720 } })
const found = []

for (let i = 1; i <= TOTAL; i++) {
  await p.goto('about:blank')
  await p.goto(`${BASE}/?nav=steps&still&v=${i}#/${i}`, { waitUntil: 'load' }) /* `still` (2026-10-22): the deck's entrances now run 2 to 4s apart, so the final state is only reachable with them off */
  await p.waitForTimeout(900)
  const on = await p.$('[data-autoplay-ignore] button[aria-pressed="true"]')
  if (on) await on.click()
  const steps = STEPS[i - 1] ?? 0
  for (let s = 0; s <= steps; s++) {
    if (s > 0) await p.keyboard.press('ArrowRight')
    await p.waitForTimeout(SETTLE)
    const hits = await p.evaluate((tol) => {
      const root = document.querySelector('[data-spec]')
      if (!root) return []
      const out = []
      const visible = (el) => {
        for (let e = el; e && e !== document.body; e = e.parentElement) {
          const cs = getComputedStyle(e)
          if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.05) return false
        }
        return true
      }
      const isBox = (el) => {
        const cs = getComputedStyle(el)
        const bg = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent'
        const border = ['Top', 'Right', 'Bottom', 'Left'].some((d) => parseFloat(cs[`border${d}Width`]) > 0 && cs[`border${d}Style`] !== 'none')
        const ring = cs.boxShadow !== 'none' || cs.outlineStyle !== 'none'
        return bg || border || ring || cs.backgroundImage !== 'none'
      }
      const clips = (el) => {
        const cs = getComputedStyle(el)
        return cs.overflowX !== 'visible' || cs.overflowY !== 'visible'
      }
      const name = (el) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').slice(0, 3).join('.') : ''}`
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (!n.textContent.trim()) continue
        const el = n.parentElement
        if (!el || !visible(el) || el.closest('svg')) continue
        const range = document.createRange()
        range.selectNodeContents(n)
        const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0)
        if (!rects.length) continue
        const t = { l: Math.min(...rects.map((r) => r.left)), r: Math.max(...rects.map((r) => r.right)), t: Math.min(...rects.map((r) => r.top)), b: Math.max(...rects.map((r) => r.bottom)) }
        for (let a = el; a && a !== root.parentElement; a = a.parentElement) {
          if (!(isBox(a) || clips(a))) continue
          const r = a.getBoundingClientRect()
          const over = Math.max(r.left - t.l, t.r - r.right, r.top - t.t, t.b - r.bottom)
          if (over > tol) out.push(`"${n.textContent.trim().slice(0, 38)}" runs ${Math.round(over)}px outside ${name(a)}`)
          break
        }
      }
      /* content clipped by its own overflow */
      for (const el of root.querySelectorAll('*')) {
        if (!visible(el) || el.closest('svg') || !clips(el)) continue
        const cs = getComputedStyle(el)
        if (!el.textContent.trim()) continue
        const x = cs.overflowX !== 'visible' && el.scrollWidth > el.clientWidth + tol
        const y = cs.overflowY !== 'visible' && el.scrollHeight > el.clientHeight + tol
        if (x || y) out.push(`${name(el)} clips its own text (${x ? `${el.scrollWidth - el.clientWidth}px wide` : ''}${x && y ? ', ' : ''}${y ? `${el.scrollHeight - el.clientHeight}px tall` : ''}): "${el.textContent.trim().slice(0, 30)}"`)
      }
      /* a group's content stays inside the group (PF 29, 2026-10-12: T2's
         terminal ran 8px past its group's foot; the text sat inside the
         terminal, so the two rules above were silent) */
      for (const g of root.querySelectorAll('[data-group]')) {
        if (!visible(g)) continue
        const over = Math.max(g.scrollHeight - g.clientHeight, g.scrollWidth - g.clientWidth)
        if (over > tol) out.push(`${name(g)} content runs ${over}px past its group: "${g.textContent.trim().slice(0, 30)}"`)
      }
      return [...new Set(out)]
    }, TOL)
    for (const h of hits) found.push(`slide ${i} step ${s}: ${h}`)
  }
  process.stdout.write(`${i} `)
}
await b.close()
console.log('\n')
const uniq = [...new Set(found)]
for (const f of uniq) console.log(f)
console.log(uniq.length ? `\n${uniq.length} overflow(s)` : 'NO OVERFLOW: every text sits inside its box, at every step.')
process.exit(uniq.length ? 1 : 0)
