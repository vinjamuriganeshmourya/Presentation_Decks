import { chromium } from 'playwright'
import fs from 'node:fs'
import { SLIDE_COUNT, DEV_PORT } from './deck.config.mjs'

const URL = process.argv[2] ?? `http://localhost:${DEV_PORT}/?all`
const TOTAL = Number(process.argv[3] ?? SLIDE_COUNT)
const OUT = process.argv[4] ?? 'workflow/qa-shots'
fs.mkdirSync(OUT, { recursive: true })

/**
 * THE TYPE FLOOR. 16px, and it is `body-sm`, the smallest body step in
 * `tailwind.config.ts`.
 *
 * WHERE THE NUMBER CAME FROM. `src/ui/isolation/isolationFigure.ts` exports it
 * as `MIN_TEXT_PX`, with the reason: the first pass of that figure family set
 * machine names at 15px, verb phrases at 11.5px and the slide's own conclusion
 * at 13px, and the review's verdict was that the concept's punchline had become
 * the SMALLEST text on the frame. A deck is read from the back of a room and
 * again, alone, from a recording, so text below the floor is not a style choice,
 * it is unreadable content. The lab's rule is that the figure fits the type, not
 * that the type shrinks to fit the figure.
 *
 * WHY IT IS A HARNESS CHECK AND NOT JUST A FIGURE CONTRACT. Session 6 slide 8
 * rendered the concept's conclusion at roughly 7px inside a figure, and
 * `video-safe.mjs`, `align-check.mjs` and this file all passed it. It was caught
 * by a human looking at a screenshot. A contract that only one figure family
 * imports cannot catch that; a sweep over the rendered DOM can.
 *
 * Keep this in sync with `MIN_TEXT_PX`. Two constants, one rule, and this repo
 * has already paid three times for a constant that encoded another constant's
 * old value.
 */
const MIN_TEXT_PX = 16

/**
 * The kicker used to be the ONE exemption: `text-kicker` was 15px, uppercase and
 * 0.14em tracked, under the floor, and flagging it would have put a finding on
 * nearly every slide. It was matched by its rendered SIGNATURE, never by class
 * name, so a 15px SENTENCE was still a finding.
 *
 * Since the updated template became the base template (2026-10-14) the kicker
 * is 22px, title case, 0.02em: it clears MIN_TEXT_PX on its own and the
 * exemption below never fires. The constants are kept current with the type
 * scale so nothing here encodes a value it no longer has; `align-check.mjs`
 * records at length that an exemption which fires by accident is worse than no
 * harness, because it is believed.
 */
const KICKER_PX = 22
const KICKER_TRACKING_PX = 0.3

/**
 * The deck's own chrome is UI, not content, so it is not held to the floor: the
 * control bar's slide counter is `text-[11.5px]` on purpose, the nav and marker
 * buttons carry icon-sized glyphs, and the footer mark is a logo.
 *
 * TWO MECHANISMS, because one is not enough on its own:
 *
 *   1. The sweep walks `<section>`, and the control bar is not inside it — it is
 *      painted over the stage by `SlideStage`, as `align-check.mjs`'s CHROME
 *      table exists to describe. The footer IS inside the section (it is
 *      `SlideBase`'s own element, a sibling of the content region), so it is
 *      excluded by ancestor.
 *   2. The geometric zones below, copied from `align-check.mjs`, catch anything a
 *      future refactor moves inside the section. Measured in stage coordinates
 *      at 1280x720; re-measure them there, not here, if the bar changes.
 */
const CHROME = [
  { name: 'controls', x1: 18, y1: 660, x2: 409, y2: 706 },
  { name: 'footer mark', x1: 1172, y1: 660, x2: 1248, y2: 706 },
]

const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
)
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))

const report = []
for (let i = 1; i <= TOTAL; i++) {
  const target = URL.includes('?') ? `${URL}#/${i}` : `${URL}/#/${i}`
  await page.goto(target, { waitUntil: 'networkidle' })
  /*
    2600ms, not 700 and not 1800.

    `?all` opens every click-gated step but does not fast-forward entrances that
    play on mount, so this has to outlast the slowest one in the kit.

      AgendaSlide  ~2.38s  items are cued off the curve drawing itself
      DataTable    ~1.5s   rows are timed off the header, not staggered by a parent

    At 700ms every table slide showed a header and one row over an empty panel;
    at 1800ms every agenda showed two items and a third at 30% opacity. Both look
    exactly like content bugs and neither is one. The overflow numbers were right
    the whole time (the rects exist while the content is transparent), but a QA
    screenshot nobody can read is not QA.
  */
  await page.waitForTimeout(2600)

  const info = await page.evaluate((K) => {
    const sec = document.querySelector('section')
    if (!sec) return { error: 'no section' }
    const sr = sec.getBoundingClientRect()
    // The padded content region inside SlideBase.
    const content = sec.querySelector(':scope > div.relative.z-10')
    const bad = []
    const walk = (el) => {
      for (const c of el.children) {
        const r = c.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) continue
        const overBottom = r.bottom - (sr.bottom - 8)
        const overRight = r.right - (sr.right - 4)
        const overLeft = sr.left - r.left
        if (overBottom > 1 || overRight > 1 || overLeft > 1) {
          bad.push({
            tag: c.tagName.toLowerCase(),
            cls: (c.className || '').toString().slice(0, 70),
            txt: (c.textContent || '').trim().slice(0, 48),
            overBottom: Math.round(overBottom),
            overRight: Math.round(overRight),
            overLeft: Math.round(overLeft),
          })
          continue // report the outermost offender only
        }
        walk(c)
      }
    }
    if (content) walk(content)

    /*
      MINIMUM TYPE SIZE.

      Leaf text only, the same test `align-check.mjs` uses for its chrome
      collisions: `el.children.length` means the words belong to a descendant, so
      a wrapper is never the defect. Reporting wrappers would name a slide's
      outermost div for a 7px label six levels down.

      Findings are keyed by size + text so a figure that repeats one tiny label
      across eight tiles is one line with a count, not eight lines.
    */
    const tinyBy = new Map()
    for (const el of sec.querySelectorAll('*')) {
      if (el.children.length) continue
      // The footer is the NxtWave mark. See the CHROME note.
      if (el.closest('footer')) continue
      const txt = (el.textContent || '').trim()
      if (!txt) continue
      const b = el.getBoundingClientRect()
      if (b.width === 0 || b.height === 0) continue
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden') continue
      const px = parseFloat(cs.fontSize)
      if (!(px < K.MIN_TEXT_PX)) continue
      // The one exemption, matched by rendered signature. See the KICKER note.
      if (
        Math.round(px) === K.KICKER_PX &&
        cs.textTransform === 'uppercase' &&
        parseFloat(cs.letterSpacing) >= K.KICKER_TRACKING_PX
      )
        continue
      if (
        K.CHROME.some(
          (c) => b.left >= c.x1 && b.right <= c.x2 && b.top >= c.y1 && b.bottom <= c.y2,
        )
      )
        continue
      const key = `${px}|${txt}`
      const hit = tinyBy.get(key)
      if (hit) hit.n++
      else tinyBy.set(key, { px: Math.round(px * 10) / 10, txt: txt.slice(0, 40), n: 1 })
    }
    const tiny = [...tinyBy.values()].sort((a, b) => a.px - b.px)

    return {
      contentScroll: content ? content.scrollHeight - content.clientHeight : 0,
      overflow: bad.slice(0, 4),
      tinyCount: tiny.length,
      tiny: tiny.slice(0, 6),
      title: sec.querySelector('h1,h2')?.textContent?.trim().slice(0, 44) ?? '',
      // The footer carries the NxtWave mark only. The session name used to sit
      // here too, but it collided with the deck's slide counter and duplicated
      // each slide's kicker, so it was removed.
      hasLogo: !!sec.querySelector('footer svg, footer img'),
    }
  }, { MIN_TEXT_PX, KICKER_PX, KICKER_TRACKING_PX, CHROME })

  await page.screenshot({ path: `${OUT}/${String(i).padStart(2, '0')}.png` })
  report.push({ n: i, ...info })
}

await browser.close()

console.log('slide | logo | contentScroll | overflow')
let issues = 0
for (const r of report) {
  const ov = r.overflow?.length ?? 0
  if (!r.hasLogo || r.contentScroll > 1 || ov) {
    issues++
    console.log(
      `${String(r.n).padStart(2)} | ${r.hasLogo ? 'ok' : 'NO LOGO'} | ${r.contentScroll} | ${JSON.stringify(r.overflow)}  <${r.title}>`,
    )
  }
}
console.log(issues === 0 ? `ALL ${TOTAL} CLEAN` : `${issues} slide(s) with issues`)

/*
  TYPE FLOOR: A WARNING, NOT A FAILURE — AND THAT IS A CHOICE, NOT AN OVERSIGHT.

  It is reported in its own block and deliberately does NOT feed `issues`, so it
  cannot change the slide-1-and-last-slide baseline every session is signed off
  against.

  WHY. Two figures in the KIT break the floor today: `src/ui/figures/FanOut.tsx`
  sets its copy notes at 11.5px and `src/ui/MachineBoundary.tsx` uses `text-xs`
  (12px). A hard failure would therefore fail every deck that renders either one,
  for a defect the deck's author did not write and cannot fix from a session —
  `sync-kit.mjs` would overwrite the fix. A gate that a deck cannot pass by doing
  its own work correctly gets routed around, and then the whole harness is.

  WHEN IT BECOMES A FAILURE. When those two figures are raised to 16px in the kit
  (a kit PR, per `KIT.md`), fold `tinyCount` into `issues` above and delete this
  paragraph. Until then a 7px punchline is VISIBLE in the output, which is the
  whole gap this check was added to close — it was invisible before.
*/
const tinyRows = report.filter((r) => (r.tinyCount ?? 0) > 0)
if (tinyRows.length) {
  console.log(`\nWARNING: text below the ${MIN_TEXT_PX}px type floor on ${tinyRows.length} slide(s)`)
  console.log('slide | px | text (x occurrences)')
  for (const r of tinyRows) {
    for (const t of r.tiny) {
      console.log(
        `${String(r.n).padStart(2)} | ${String(t.px).padStart(5)} | "${t.txt}"${t.n > 1 ? ` (x${t.n})` : ''}`,
      )
    }
    if (r.tinyCount > r.tiny.length) {
      console.log(`${String(r.n).padStart(2)} |       | +${r.tinyCount - r.tiny.length} more distinct`)
    }
  }
} else {
  console.log(`\nTYPE FLOOR CLEAN: no text below ${MIN_TEXT_PX}px`)
}
if (errors.length) console.log('CONSOLE ERRORS:', [...new Set(errors)].slice(0, 8))
