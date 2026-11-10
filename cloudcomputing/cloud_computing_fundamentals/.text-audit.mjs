// Review 2026-10-16 audit: lowercase starts (A5), underlines (A1), clipped pictures.
// node .text-audit.mjs [from] [to]   (dev server on 5270, ?all)
import { chromium } from 'playwright'
const from = +(process.argv[2] ?? 1), to = +(process.argv[3] ?? 64)
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH })
const p = await b.newPage({ viewport: { width: 1280, height: 720 } })
let bad = 0
for (let i = from; i <= to; i++) {
  await p.goto(`http://127.0.0.1:5270/?all#/${i}`, { waitUntil: 'load' })
  await p.waitForTimeout(700)
  const r = await p.evaluate(() => {
    const out = []
    const sec = document.querySelector('main section, section')
    if (!sec) return out
    const w = document.createTreeWalker(sec, NodeFilter.SHOW_TEXT)
    const seen = new Set()
    while (w.nextNode()) {
      const n = w.currentNode, el = n.parentElement
      const t = n.textContent.trim()
      if (!t || !el || el.closest('[role=dialog],code,pre,[data-code],.font-mono,iframe')) continue
      const cs = getComputedStyle(el)
      if (/mono/i.test(cs.fontFamily)) continue
      if (cs.textDecorationLine.includes('underline')) out.push('UNDERLINE: ' + t.slice(0, 50))
      // first text of a block element only
      let blk = el; while (blk && getComputedStyle(blk).display.startsWith('inline')) blk = blk.parentElement
      if (seen.has(blk)) continue
      seen.add(blk)
      const first = (blk.innerText || '').trim()
      if (/^[a-z]/.test(first) && !/^(e\.g\.|vs\b|iOS|m5\.|x86)/.test(first)) out.push('lowercase: ' + first.slice(0, 60))
    }
    return out
  })
  if (r.length) { bad += r.length; console.log(`slide ${i}:`); for (const x of [...new Set(r)]) console.log('   ' + x) }
}
console.log(bad ? `\n${bad} finding(s)` : 'CLEAN: no underline, no lowercase start')
await b.close()
