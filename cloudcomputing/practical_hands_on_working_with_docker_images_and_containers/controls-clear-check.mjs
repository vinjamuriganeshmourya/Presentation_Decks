/**
 * CONTROLS-CLEAR CHECK: no card content may sit behind, or in front of, the
 * card's Next and Autoplay buttons or the player's control bar, at ANY build
 * step (generate-slides section 2: "neither may touch the slide's content").
 *
 * Why it exists: on PF 24, E1's step 5 and H2's long program reached under
 * the Next and Play buttons, and no other harness looked there:
 * overlap-check measures arrows and highlights, qa the frame edge, video-safe
 * the top-right rectangle.
 *
 * It drives the dev server slide by slide in step mode with Autoplay off,
 * presses through every step (counts from src/export/revealSteps.ts), lets the
 * step's motion settle, and reports any visible text or drawn box inside a
 * card (`[data-spec]`) whose rectangle comes within GAP px of a button.
 *
 *   node controls-clear-check.mjs [baseUrl] [slideCount]
 */
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const cfg = JSON.parse(readFileSync('deck.config.json', 'utf8'))
const BASE = process.argv[2] ?? `http://localhost:${cfg.devPort}`
const TOTAL = Number(process.argv[3] ?? cfg.slideCount)
const STEPS = JSON.parse(readFileSync('src/export/revealSteps.ts', 'utf8').match(/PAGE_REVEAL_MAX_STEPS: number\[\] = (\[[^\]]*\])/)[1])
const SETTLE = 2200
const GAP = 6

const b = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {})
const p = await b.newPage({ viewport: { width: 1280, height: 720 } })
const found = []

for (let i = 1; i <= TOTAL; i++) {
  await p.goto(`${BASE}/?nav=steps&still&v=${i}#/${i}`, { waitUntil: 'load' }) /* `still` (2026-10-22): the deck's entrances now run 2 to 4s apart, so the final state is only reachable with them off */
  await p.waitForTimeout(900)
  const on = await p.$('[data-autoplay-ignore] button[aria-pressed="true"]')
  if (on) await on.click()
  const steps = STEPS[i - 1] ?? 0
  for (let s = 0; s <= steps; s++) {
    if (s > 0) await p.keyboard.press('ArrowRight')
    await p.waitForTimeout(SETTLE)
    const hits = await p.evaluate((gap) => {
      const root = document.querySelector('[data-autoplay-ignore]')
      if (!root) return null
      const card = root.closest('[data-spec]')
      if (!card) return null
      const keep = [...root.querySelectorAll('button')].map((x) => x.getBoundingClientRect())
      /* the player's bar: the box round its full-screen button */
      let bar = document.querySelector('button[aria-label="Toggle fullscreen"]')
      while (bar && bar.getBoundingClientRect().width < 300) bar = bar.parentElement
      if (bar) keep.push(bar.getBoundingClientRect())
      const seen = (el) => {
        for (let e = el; e && e !== document.body; e = e.parentElement) {
          const cs = getComputedStyle(e)
          if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.05) return false
        }
        return true
      }
      const drawn = (el) => {
        const cs = getComputedStyle(el)
        if ([...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return true
        if (el.tagName === 'svg' || el.tagName === 'IMG' || el.tagName === 'IFRAME') return true
        return (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') || cs.boxShadow !== 'none' || parseFloat(cs.borderTopWidth) > 0
      }
      const out = []
      for (const el of card.querySelectorAll('*')) {
        if (root.contains(el) || el.closest('svg') !== null && el.tagName !== 'svg') continue
        const r = el.getBoundingClientRect()
        if (r.width < 2 || r.height < 2 || r.width > 1000 || r.height > 520) continue
        if (getComputedStyle(el).pointerEvents === 'none' && !el.textContent.trim()) continue
        if (!drawn(el) || !seen(el)) continue
        for (const k of keep) {
          if (r.left < k.right + gap && r.right > k.left - gap && r.top < k.bottom + gap && r.bottom > k.top - gap) {
            out.push(`${el.tagName.toLowerCase()} "${(el.textContent || '').trim().slice(0, 40)}" ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)} (bottom ${Math.round(r.bottom)} vs button top ${Math.round(k.top)})`)
            break
          }
        }
      }
      return out
    }, GAP)
    if (hits && hits.length) found.push(`slide ${i} step ${s}: ${hits[0]}${hits.length > 1 ? ` (+${hits.length - 1} more)` : ''}`)
  }
  process.stdout.write(`${i} `)
}
process.stdout.write('\n')
await b.close()
console.log(found.length ? found.join('\n') : 'CLEAR: no content touches the Next, Autoplay or player bar, at any step.')
process.exit(found.length ? 1 : 0)
