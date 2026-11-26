/**
 * CONTINUITY CHECK — proves that an unchanged header part does not re-animate.
 *
 *   node continuity-check.mjs 6 7 14        # check the move INTO each of these slides
 *
 * WHY THIS EXISTS AS A HARNESS
 *
 * Continuity (see `src/motion/continuity.ts`) is invisible in a settled
 * screenshot: whether the kicker flew in or sat still, one second later the slide
 * looks identical. The first implementation was silently a no-op for exactly that
 * reason — `Stepper` reported its step count on mount, that re-render collapsed
 * the continuity value, React remounted the header parts and they animated in
 * anyway about 100ms late. Nothing in `qa.mjs`, `video-safe.mjs` or the preview
 * sweep could have caught it.
 *
 * So this samples mid-flight. For each slide N given, it settles on N-1, presses
 * ArrowRight, and reads the computed opacity and transform of the kicker, the
 * title and the first bullet 110ms in.
 *
 * HOW TO READ THE OUTPUT
 *
 *   HELD      op=1.00, tf=none          the part never moved
 *   ANIMATING op<1 and/or a transform   the part is entering
 *
 * Expected: inside one concept the kicker is HELD and the title and body are
 * ANIMATING. Crossing into a new concept, or arriving from a divider, everything
 * is ANIMATING. A kicker that is ANIMATING while the previous slide showed the
 * same kicker text is the regression this file is here to find.
 */
import { chromium } from 'playwright'
import { resolve } from 'node:path'
import { HTML_FILE } from './deck.config.mjs'

const FILE = resolve(HTML_FILE)
const SLIDES = process.argv.slice(2).map(Number).filter((n) => Number.isFinite(n) && n > 1)

if (SLIDES.length === 0) {
  console.error('usage: node continuity-check.mjs <slideNumber> [<slideNumber>...]')
  console.error('       each number is the slide being moved INTO, so it must be 2 or more')
  process.exit(2)
}

const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
)
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
await ctx.route(/^https?:\/\//, (r) => r.abort())
const page = await ctx.newPage()

/**
 * Read the header parts of the ACTIVE slide.
 *
 * The entering and exiting slides are both in the DOM during a transition, and
 * `AnimatePresence` appends the entering one, so the last `<section>` is the slide
 * being moved into. The animated wrapper is the PARENT of the visible element:
 * `Reveal` renders a motion div around the kicker span and the h2.
 */
const probe = () =>
  page.evaluate(() => {
    const sections = [...document.querySelectorAll('section')]
    const sec = sections[sections.length - 1]
    if (!sec) return null
    const state = (el) => {
      if (!el) return null
      const cs = getComputedStyle(el)
      return {
        op: Number(cs.opacity).toFixed(2),
        tf: cs.transform === 'none' ? 'none' : cs.transform,
      }
    }
    const kickerSpan = sec.querySelector('[data-kicker]')
    const h2 = sec.querySelector('h2')
    return {
      kickerText: kickerSpan?.textContent?.trim() ?? null,
      kicker: state(kickerSpan?.parentElement),
      titleText: h2?.textContent?.trim() ?? null,
      title: state(h2?.parentElement),
      bullet: state(sec.querySelector('li')),
    }
  })

const verdict = (s) => (s && s.op === '1.00' && s.tf === 'none' ? 'HELD     ' : 'ANIMATING')

const SETTLE = 2600
let problems = 0

for (const n of SLIDES) {
  await page.goto(`file://${FILE}#/${n - 1}`, { waitUntil: 'load' })
  await page.waitForTimeout(SETTLE)
  const before = await probe()
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(110)
  const mid = await probe()
  await page.waitForTimeout(SETTLE)
  const after = await probe()

  const sameKicker = before?.kickerText && before.kickerText === after?.kickerText
  const held = verdict(mid?.kicker).trim() === 'HELD'

  console.log(`\nslide ${n - 1} -> ${n}`)
  console.log(`  kicker  "${before?.kickerText}" -> "${after?.kickerText}"${sameKicker ? '  (unchanged)' : '  (changed)'}`)
  console.log(`  title   "${before?.titleText}" -> "${after?.titleText}"`)
  console.log(`  mid-flight:`)
  console.log(`    kicker  ${verdict(mid?.kicker)}  op=${mid?.kicker?.op}  tf=${mid?.kicker?.tf}`)
  console.log(`    title   ${verdict(mid?.title)}  op=${mid?.title?.op}`)
  console.log(`    bullet  ${verdict(mid?.bullet)}  op=${mid?.bullet?.op}`)

  if (sameKicker && !held) {
    console.log('    ^^ REGRESSION: the kicker text did not change but the kicker animated anyway')
    problems++
  }
  if (!sameKicker && held) {
    console.log('    ^^ SUSPECT: the kicker text changed but the kicker was held static')
    problems++
  }
}

await browser.close()
console.log(problems === 0 ? '\nOK: continuity behaved as authored.' : `\n${problems} problem(s).`)
process.exit(problems === 0 ? 0 : 1)
