/**
 * Content rule 41: the deck's feedback slide is the kit's `FeedbackSlide`,
 * untouched. The source of truth is the KIT's built gallery, found by walking up
 * from this file to the repo root (`FEEDBACK_SOURCE` overrides it):
 *
 *   slide-kit/slide-template/dist-single/base-template.html
 *
 * Until 2026-10-14 the source was Python session 18's built file, where the
 * slide was built and chosen; the kit carries that same slide now.
 *
 * Opens both built files from file://, finds the slide whose id is `feedback`
 * (the hash `#/<n>-feedback`), and compares the rendered slide markup. The only
 * allowed difference is session-specific text, listed in ALLOWED below (none
 * today: the slide carries no session name). Also asserts the QR image loads,
 * the link text, the form frame's src, and that only the close follows it:
 * Thank you, then All the Best, and nothing after (content rule 41).
 *
 * Run: node feedback-check.mjs [path/to/built.html]
 */
import { chromium } from 'playwright'
import { resolve, dirname } from 'node:path'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { HTML_FILE } from './deck.config.mjs'

const here = dirname(fileURLToPath(import.meta.url))
/** The kit's built gallery: walk up from here until `slide-kit/slide-template/dist-single/base-template.html` exists. */
const findKitBuild = () => {
  let dir = here
  for (let i = 0; i < 8; i++) {
    const candidate = resolve(dir, 'slide-kit/slide-template/dist-single/base-template.html')
    if (existsSync(candidate)) return candidate
    const up = dirname(dir)
    if (up === dir) break
    dir = up
  }
  return null
}
const SOURCE = process.env.FEEDBACK_SOURCE ? resolve(process.env.FEEDBACK_SOURCE) : findKitBuild()
if (!SOURCE) { console.log(' FAIL no kit build found above this folder: build slide-kit/slide-template first, or set FEEDBACK_SOURCE'); process.exit(1) }
const TARGET = resolve(process.argv[2] ?? resolve(here, HTML_FILE))
const ALLOWED = [] /* [from, to] pairs of session-specific text, if the slide ever carries any */

const b = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {})
const read = async (file) => {
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } })
  await p.route(/^https?:/, (r) => r.abort()) /* the form frame needs the network; markup is what is compared */
  await p.goto(`file://${file}?fbcheck`)
  await p.waitForTimeout(1200)
  let n = 0
  for (let i = 1; i <= 200; i++) {
    await p.goto(`file://${file}?fbcheck=${i}#/${i}`)
    await p.waitForTimeout(300)
    const hash = await p.evaluate(() => location.hash)
    if (hash.endsWith('-feedback')) { n = i; break }
    if (!hash.startsWith(`#/${i}-`)) break /* past the deck's end: the player clamped the hash */
  }
  if (!n) { await p.close(); return null }
  await p.waitForTimeout(2500) /* entrance settled */
  const r = await p.evaluate(() => {
    const stage = [...document.querySelectorAll('section')].filter((s) => s.getBoundingClientRect().width >= 1200 && s.querySelector('iframe')).pop()
    const q = stage?.querySelector('img[src*="feedback-qr"], img[alt*="QR"]')
    return {
      html: stage ? stage.outerHTML.replace(/\sstyle="[^"]*opacity[^"]*"/g, '') : '',
      qr: q ? q.naturalWidth : 0,
      link: [...(stage?.querySelectorAll('a') ?? [])].map((a) => a.textContent.trim()),
      frame: stage?.querySelector('iframe')?.getAttribute('src') ?? '',
    }
  })
  /* what follows: Thank you, then All the Best, and nothing after them */
  await p.goto(`file://${file}?fbnext#/${n + 1}`)
  await p.waitForTimeout(300)
  const next = await p.evaluate(() => location.hash)
  await p.goto(`file://${file}?fbnext2#/${n + 2}`)
  await p.waitForTimeout(300)
  const next2 = await p.evaluate(() => location.hash)
  await p.goto(`file://${file}?fbnext3#/${n + 3}`)
  await p.waitForTimeout(300)
  const after = await p.evaluate(() => location.hash)
  await p.close()
  return { n, next, next2, last: !after.startsWith(`#/${n + 3}`), ...r }
}
const src = await read(SOURCE)
const tgt = await read(TARGET)
await b.close()

let ok = true
const say = (good, msg) => { console.log(`${good ? '   ok' : ' FAIL'} ${msg}`); ok &&= good }
say(Boolean(src), 'source deck has a slide with id `feedback`')
say(Boolean(tgt), 'this deck has a slide with id `feedback`')
if (src && tgt) {
  let html = tgt.html
  for (const [a, c] of ALLOWED) html = html.split(c).join(a)
  say(html === src.html, `slide markup identical to the kit's (${src.html.length} chars)`)
  if (html !== src.html) {
    let i = 0
    while (i < html.length && html[i] === src.html[i]) i++
    console.log(`        first difference at char ${i}:\n        source: …${src.html.slice(Math.max(0, i - 60), i + 80)}\n        deck:   …${html.slice(Math.max(0, i - 60), i + 80)}`)
  }
  say(tgt.qr > 0, `QR image loads (${tgt.qr}px)`)
  say(tgt.link.some((t) => t.includes('forms.gle/5d1Ru8geTKdC4Bcr7')), 'link text forms.gle/5d1Ru8geTKdC4Bcr7')
  say(tgt.frame === src.frame && /viewform\?embedded=true/.test(tgt.frame), 'form frame src matches the source')
  say(/-thank-you$/.test(tgt.next) && /-all-the-best$/.test(tgt.next2) && tgt.last, `feedback is slide ${tgt.n}, followed only by Thank you and All the Best (${tgt.next}, ${tgt.next2})`)
}
console.log(ok ? '\nfeedback: the kit\'s slide, untouched' : '\nfeedback: NOT the kit\'s slide')
process.exit(ok ? 0 : 1)
