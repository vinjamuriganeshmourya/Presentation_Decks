/**
 * MIXED ALIGNMENT, inside one slide.
 *
 *   node mixed-align-check.mjs [url] [slideCount]
 *
 * Within a slide, every content block shares one horizontal alignment: a lead
 * on the left edge over a figure centred in the body is the defect (user,
 * 2026-10-05, on Python session 17's slides 9, 10, 21, 24 to 27: "the first
 * line of content is left-aligned, but the code boxes and everything below are
 * centre-aligned"). `align-check.mjs` measures blocks against the header's
 * left edge and tolerates anything that merely sits inside the frame, so a
 * centred figure under a left lead passes it. This sweep is the missing half.
 *
 * HOW. For every slide, fully revealed, the body box (`[data-zone="space1"]`)
 * is walked top down. A block that spans the box's full width is a container:
 * descend into it. A narrower block is classified by where it sits in the box:
 *   left     its left edge is on the box's left edge (within 12px)
 *   centre   its left and right slack are equal (within 14px) and both > 40px
 *   other    anything else (a right-hand column, a figure pushed by its row)
 * A full-width element whose own text is `text-align: center` is a centred
 * block too (a centred heading over a left figure). A slide that holds BOTH a
 * left block and a centred block is reported, with the blocks named.
 *
 * Session-local for now (a kit PR folds it into `align-check.mjs`). Session
 * files at the project root are never touched by `sync-kit`.
 */
import { chromium } from 'playwright'
import { DEV_PORT, SLIDE_COUNT } from './deck.config.mjs'

const URL = process.argv[2] ?? `http://localhost:${DEV_PORT}/?all`
const TOTAL = Number(process.argv[3] ?? SLIDE_COUNT)
const SETTLE = 2600

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })

const bad = []
for (let i = 1; i <= TOTAL; i++) {
  await page.goto(`${URL}#/${i}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(SETTLE)
  const r = await page.evaluate(() => {
    const zone = document.querySelector('[data-zone="space1"]')
    if (!zone) return { skipped: 'no body zone' }
    const Z = zone.getBoundingClientRect()
    const k = Z.width / zone.offsetWidth || 1 // the stage is zoomed; measure in canvas px
    const W = Z.width / k
    const blocks = []
    const name = (el) => {
      const t = (el.innerText || '').trim().replace(/\s+/g, ' ')
      return (t ? `"${t.slice(0, 36)}${t.length > 36 ? '…' : ''}"` : `<${el.tagName.toLowerCase()}>`) + ` ${Math.round(el.getBoundingClientRect().width / k)}px`
    }
    const walk = (el) => {
      for (const c of el.children) {
        const cs = getComputedStyle(c)
        if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'absolute' || cs.position === 'fixed') continue
        const r = c.getBoundingClientRect()
        if (r.width < 24 || r.height < 16) continue
        const left = (r.left - Z.left) / k
        const right = (Z.right - r.right) / k
        const width = r.width / k
        if (width >= W - 24) {
          /* a full-width block: its own centred text counts, then descend */
          const ownText = [...c.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
          if (ownText && cs.textAlign === 'center') blocks.push({ kind: 'centre', what: name(c) })
          walk(c)
          continue
        }
        if (left <= 12) blocks.push({ kind: 'left', what: name(c) })
        else if (Math.abs(left - right) <= 14 && left > 40) blocks.push({ kind: 'centre', what: name(c) })
        else blocks.push({ kind: 'other', what: name(c) })
      }
    }
    walk(zone)
    return { blocks }
  })
  const title = await page.evaluate(() => document.querySelector('h1,h2')?.textContent?.trim().slice(0, 40) ?? '')
  if (r.skipped) {
    console.log(`slide ${String(i).padStart(2)}  <${title}>  skipped: ${r.skipped}`)
    continue
  }
  const lefts = r.blocks.filter((b) => b.kind === 'left')
  const centres = r.blocks.filter((b) => b.kind === 'centre')
  const mixed = lefts.length > 0 && centres.length > 0
  const verdict = mixed ? 'MIXED' : centres.length ? 'centred' : lefts.length ? 'left' : 'no blocks'
  console.log(`slide ${String(i).padStart(2)}  <${title}>  ${verdict}  (${lefts.length} left, ${centres.length} centred, ${r.blocks.length - lefts.length - centres.length} other)`)
  if (mixed) {
    bad.push(i)
    for (const b of lefts.slice(0, 3)) console.log(`     left    ${b.what}`)
    for (const b of centres.slice(0, 3)) console.log(`     centre  ${b.what}`)
  }
}
await browser.close()
console.log(`\n${bad.length} of ${TOTAL} slides mix left and centred blocks${bad.length ? ': ' + bad.join(', ') : ''}`)
process.exit(bad.length ? 1 : 0)
