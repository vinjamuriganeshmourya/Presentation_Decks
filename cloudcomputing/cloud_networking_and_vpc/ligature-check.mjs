/**
 * ligature-check.mjs — the comparison operators in code are two characters, on
 * every slide of the BUILT file (content rule 40).
 *
 *   node ligature-check.mjs [path/to/deck.html]
 *
 * Walks every slide under ?all, finds every text node inside the stage that
 * carries `===`, `==`, `>=`, `<=` or `!=`, and asserts that the element drawing
 * it has ligatures off (`font-variant-ligatures: none`, or `"calt" 0` in its
 * feature settings). Prints, per slide, which operators it found, so a reviewer
 * can see the list the deck actually renders. Session-owned, 2026-10-05.
 */
import { chromium } from 'playwright'
import { resolve } from 'node:path'
import { HTML_FILE, SLIDE_COUNT } from './deck.config.mjs'
const html = resolve(process.argv[2] ?? HTML_FILE)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
let fails = 0
const found = []
for (let i = 1; i <= SLIDE_COUNT; i++) {
  await page.goto(`file://${html}?all&v=${i}#/${i}`, { waitUntil: 'load' })
  await page.waitForTimeout(600)
  const r = await page.evaluate(() => {
    const stage = document.querySelector('.slide-stage')
    const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT)
    const ops = /===|==|>=|<=|!=/g
    const hits = []
    let node
    while ((node = walker.nextNode())) {
      const text = node.nodeValue
      if (!ops.test(text)) continue
      ops.lastIndex = 0
      const el = node.parentElement
      const cs = getComputedStyle(el)
      const off = cs.fontVariantLigatures === 'none' || /"calt"\s*0/.test(cs.fontFeatureSettings)
      const mono = /JetBrains|mono/i.test(cs.fontFamily)
      for (const m of text.match(ops)) hits.push({ op: m, off, mono, font: cs.fontFamily.split(',')[0], snippet: text.trim().slice(0, 40) })
    }
    return hits
  })
  if (r.length) {
    found.push({ slide: i, ops: [...new Set(r.map((h) => h.op))], bad: r.filter((h) => h.mono && !h.off) })
    const bad = r.filter((h) => h.mono && !h.off)
    if (bad.length) { fails++; console.log(`FAIL slide ${i}: ligatures still on for ${bad.map((b) => `${b.op} in "${b.snippet}"`).join('; ')}`) }
    else console.log(`ok   slide ${i}: ${[...new Set(r.map((h) => `${h.op}`))].join(' ')}  (${r.length} occurrence${r.length > 1 ? 's' : ''}, ligatures off)`)
  }
}
await browser.close()
console.log(`\nslides with comparison operators in code: ${found.map((f) => f.slide).join(', ') || 'none'}`)
console.log(fails ? `ligatures: ${fails} slide(s) FAIL` : 'ligatures: every operator is drawn as separate characters')
process.exit(fails ? 1 : 0)
