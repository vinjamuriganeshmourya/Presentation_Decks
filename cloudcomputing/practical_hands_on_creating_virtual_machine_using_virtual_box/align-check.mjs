/**
 * ALIGNMENT CHECK — measures where every slide's body blocks actually sit.
 *
 *   node align-check.mjs                      # all slides, from deck.config
 *   node align-check.mjs "http://localhost:5174/?all" 69
 *
 * WHY THIS EXISTS AS A HARNESS
 *
 * `qa.mjs` catches content that leaves the 1280x720 frame and `video-safe.mjs`
 * catches content that enters the instructor-video rectangle. Neither has an
 * opinion about content that is comfortably inside the frame and still wrong:
 * a 468px figure inside a full-width block sits hard left with a 500px hole
 * beside it, and every automated check passes. That is the defect this finds.
 *
 * THE RULE IT ENFORCES (session-3 rule S14)
 *
 * The header is pinned at x=145. A body block must therefore be either
 *
 *   ALIGNED   its left edge on the header's, x=145
 *   CENTRED   its centre on the content area's centre
 *
 * and anything else is DRIFT: it reads as a mistake, because it is one. The
 * usual cause is `mx-auto` on an auto-width block, which distributes nothing.
 *
 * IT ALSO CATCHES TWO THINGS `qa.mjs` STRUCTURALLY CANNOT
 *
 * A 14-agent review of this deck found nine slides with defects that every
 * existing harness passed, in exactly two shapes, so both are now measured here:
 *
 *   CHROME    text sitting under the deck's own controls. The slide counter, the
 *             nav arrows and the footer mark are drawn OVER the stage, so a
 *             callout whose last line reaches y=660 is inside the frame,
 *             inside the video-safe area, and unreadable. Three slides shipped
 *             like that and read as "the a__r_ss becomes".
 *
 *   CLIPPED   a panel whose content is larger than its own clip box. A
 *             `CodeBlock` with `maxHeight` shorter than its file scrolls, and a
 *             `Terminal` narrower than its longest line shears it. Both look
 *             like a finished panel: there is no scrollbar at this size, just a
 *             line cut through the middle of a glyph. On one slide the clipped
 *             line was the one the slide's own bullet pointed at.
 *
 *             Detected by COMPUTED STYLE, not by class name. The first version
 *             matched `pre, .overflow-auto, .overflow-hidden` and still missed a
 *             7px overflow on slide 15 and a 13px HORIZONTAL one on slide 41,
 *             which is how a hand-written selector fails: it describes the markup
 *             you remember rather than the boxes that actually scroll.
 *
 *   WRAPPED   a label that broke across lines when it is one token to the reader.
 *             `python manage.py runserver` inside a sentence rendered as
 *             "python manage.py" then "runserver", and a squeezed `FileTree` note
 *             listing four filenames wrapped to FOUR lines on the row the slide
 *             was comparing. Monospace leaves and `·`-joined notes are checked,
 *             because those are the two that carry meaning as a single unit.
 *
 * It also reports the empty band under the last body block, because a slide with
 * 200px of dead space at the bottom and a cramped figure is a layout that needs
 * splitting, not nudging.
 *
 * WHAT IT DELIBERATELY IGNORES
 *
 * A harness that cries wolf does not get run. The first pass reported 18 of 69
 * slides and only two were defects, so these four categories are excluded by
 * name, each for a stated reason:
 *
 *   1. `pointer-events-none` decoration. The background blobs bleed off canvas
 *      BY DESIGN, and `qa.mjs` already excludes them for the same reason.
 *   2. SVG children. Their `className` is an SVGAnimatedString, not a string, and
 *      an SVG's internal geometry is not slide layout.
 *   3. `place-items-end` slots. That is the mascot corner on RecapSlide,
 *      KeyTakeawaysSlide, PracticeSlide and FeedbackSlide: right-aligned on
 *      purpose, so measuring it against the left datum is meaningless.
 *
 *      Excluded from the DRIFT verdict only, NOT from the tail measurement. The
 *      first version excluded them from both and then reported 332px of dead
 *      space under the recap slide, which is where its mascot is. Skipping a
 *      block for alignment purposes does not mean the pixels are empty.
 *   4. CENTRED slide types entirely. On a divider, the Welcome frame and the
 *      Thank You frame the title is itself centred, so "the header's left edge"
 *      is not a datum any body block should match, and a tall centred layout's
 *      bottom band is not dead space. Detected, not hardcoded: if the title's
 *      own centre is on the stage centre, the slide is centred.
 */
import { chromium } from 'playwright'
import { SLIDE_COUNT, DEV_PORT } from './deck.config.mjs'

const URL = process.argv[2] ?? `http://localhost:${DEV_PORT}/?all`
const TOTAL = Number(process.argv[3] ?? SLIDE_COUNT)
/** Half a bullet's marker. Tighter than this and sub-pixel layout reads as drift. */
const TOL = 10

/**
 * The deck chrome, in stage coordinates: it is painted ON TOP of slide content,
 * so anything a slide puts here is legible only by luck. Measured from the
 * rendered player, with a couple of px of slack.
 *   left   the slide counter chip, the two nav arrows, the jump-to-slide button,
 *          the arrow-mode pill and the fullscreen button
 *   right  the NxtWave footer mark
 *
 * THE LEFT BOX GREW FROM 252 TO 335, AND THAT IS THE POINT OF THIS COMMENT.
 *
 * It was measured when the cluster held a counter and three separate floating
 * chips. It is one bar now, and it also carries a jump-to-slide button and the
 * arrow-mode control: `{left: 20, top: 664, right: 333, bottom: 704}`, identical in
 * both modes, on every hover, and on one-digit and two-digit slide numbers. For as
 * long as this constant said 252 the harness would have passed any slide with
 * words between x=252 and x=333 in that band while the deck painted the bar
 * straight over them. A constant that encodes another constant's old value breaks
 * silently, which this repo has now paid for three times.
 *
 * AND IT GREW AGAIN, FROM 335 TO 409, when the bar took a REPLAY button and a
 * MARKER button. Measured on the built deck at 1280x720:
 * `{left: 20, top: 664, right: 407, bottom: 704}`, plus the usual 2px of slack.
 * The marker button's "this slide has ink" dot is absolutely positioned inside the
 * button precisely so that it cannot move this number.
 *
 * The MARKER PALETTE is deliberately not in this table. It is only in the DOM while
 * the marker is open, which is never during a harness run, and a zone that is
 * usually absent is a zone that would fail slides for a collision the room never
 * sees. It is parked one row higher than the control bar for the same reason it is
 * not listed: see `annotate/AnnotationToolbar.tsx`.
 *
 * MEASURE IT AGAIN IF THE BAR CHANGES: open the deck, and read
 * `document.querySelector('div.absolute.bottom-4.left-5').getBoundingClientRect()`.
 * The bar is fixed-width by construction, so one reading is the whole answer: the
 * counter is `tabular-nums` in a fixed box and the mode label sits in a 40px box,
 * precisely so this number cannot depend on which slide is up.
 */
const CHROME = [
  { name: 'controls', x1: 18, y1: 660, x2: 480, y2: 706 }, /* 2026-10-22: the presenter bar carries Edit text and Download, 70px wider */
  { name: 'footer mark', x1: 1172, y1: 660, x2: 1248, y2: 706 },
]

const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
)
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const rows = []

for (let i = 1; i <= TOTAL; i++) {
  const target = URL.includes('?') ? `${URL}#/${i}` : `${URL}/#/${i}`
  await page.goto(target, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2600)

  const r = await page.evaluate(({ TOL, CHROME }) => {
    const sec = document.querySelector('section')
    const content = sec?.querySelector(':scope > div.relative.z-10')
    if (!content) return null
    const cr = content.getBoundingClientRect()
    /* `.font-tpl-title` as well: since the updated template became the base
       template (2026-10-14) a hero word such as the agenda mark's "Agenda" is set
       in the title face, not `font-heading`, and without it the first
       `font-heading` match on that slide was a number badge at x=489, which put
       every block on the agenda in DRIFT. */
    const title = content.querySelector('h1, h2, .font-heading, .font-tpl-title')
    const tr = title?.getBoundingClientRect()
    const headerLeft = tr ? Math.round(tr.left) : Math.round(cr.left)
    const centre = cr.left + cr.width / 2
    /*
      A CENTRED SLIDE TYPE: a divider, the Welcome frame, the Thank You frame.
      On those the title is centred on the stage, so its left edge is not a datum
      any body block should match and the bottom band is not dead space.

      Detected from `text-align`, NOT from geometry. The first version compared the
      title's BOX centre to the stage centre, and a full-width LEFT-ALIGNED heading
      has a centred box too, so it classified almost every content slide as centred
      and silently skipped every check on them. The sweep reported "1 of 69" while
      thirteen slides had wrapped labels and scrolling panels. A harness that
      exempts by accident is worse than no harness, because it is believed.
    */
    /*
      ONE EXPLICIT OPT-OUT, DECLARED BY THE SLIDE ITSELF.

      `QuestionSlide` is a vertically centred pause frame: one card on the stage's
      centre line, with a deliberate empty band above and below it. Its text is
      LEFT-aligned inside that card, so neither test below sees it, and the tail
      measurement reports the intentional band as dead space.

      The slide type therefore declares itself with `data-align-exempt="centred"`.
      That is a NAMED exemption a reader can grep for, not a widened heuristic:
      the comment above is emphatic that an exemption which fires by accident is
      worse than no harness, and loosening the geometry test to cover this frame
      is exactly how that happens. Chrome collisions and clipped panels are still
      measured on an exempt slide, because those are wrong on any layout.
    */
    const declaredCentred = !!content.querySelector('[data-align-exempt="centred"]')

    const centredLayout =
      declaredCentred ||
      (!!tr &&
      (getComputedStyle(title).textAlign === 'center' ||
        /* Centred by flex rather than by text-align, as the Welcome and Thank You
           frames are. The width test is what the first version was missing: a
           full-width LEFT-aligned heading also has a centred box, so "centred box"
           alone exempted almost the whole deck. */
        (tr.width < cr.width - 40 && Math.abs((tr.left + tr.right) / 2 - centre) <= 16)))

    /* The header block itself is not a finding: it defines the datum. Walk past it
       and measure the blocks that carry the slide's body. */
    const header = content.querySelector('header') || title?.closest('div')
    const blocks = []
    /* Every block that occupies real pixels, whether or not its alignment is
       measured. The tail is computed from this, so an excluded mascot still
       counts as content. */
    let lowest = 0
    const consider = (el) => {
      for (const c of el.children) {
        if (header && (c === header || c.contains(header))) {
          consider(c)
          continue
        }
        // Decoration and SVG internals are not slide layout. See the header note.
        const cls = typeof c.className === 'string' ? c.className : ''
        const rect = c.getBoundingClientRect()
        // Decoration bleeds off canvas by design, so it counts as neither
        // alignment nor content.
        if (cls.includes('pointer-events-none')) continue
        if (rect.height > 0 && rect.bottom > lowest && rect.bottom <= cr.bottom + 1) {
          lowest = rect.bottom
        }
        if (c instanceof SVGElement) continue
        if (cls.includes('place-items-end')) continue
        if (cls.includes('items-center justify-')) continue
        const b = rect
        if (b.width < 120 || b.height < 40) continue
        // A block that spans the whole content area is a wrapper, not a placed
        // block: descend into it rather than reporting it as trivially aligned.
        if (b.width > cr.width - 24) {
          consider(c)
          continue
        }
        blocks.push({
          cls: cls.slice(0, 40),
          left: Math.round(b.left),
          right: Math.round(b.right),
          top: Math.round(b.top),
          bottom: Math.round(b.bottom),
        })
      }
    }
    consider(content)

    /* CHROME COLLISIONS. Only leaf text nodes: a wrapper that merely spans the
       region is not the defect, the words under the buttons are. */
    const chromeHits = []
    content.querySelectorAll('*').forEach((el) => {
      if (el.children.length) return
      const t = (el.textContent || '').trim()
      if (!t) return
      const b = el.getBoundingClientRect()
      if (b.width === 0 || b.height === 0) return
      for (const c of CHROME) {
        const ox = Math.min(b.right, c.x2) - Math.max(b.left, c.x1)
        const oy = Math.min(b.bottom, c.y2) - Math.max(b.top, c.y1)
        if (b.right > c.x1 && b.left < c.x2 && b.bottom > c.y1 && b.top < c.y2) {
          chromeHits.push({ zone: c.name, txt: t.slice(0, 46), x: Math.round(b.left), y: Math.round(b.top), ox: Math.round(ox), oy: Math.round(oy) })
          break
        }
      }
    })

    /* CLIPPED PANELS, and WRAPPED single-token labels. Both walk every element,
       because both are properties of the rendered box rather than of a class. */
    const clipped = []
    const wrapped = []
    content.querySelectorAll('*').forEach((el) => {
      const cs = getComputedStyle(el)

      if (/auto|scroll/.test(cs.overflow + cs.overflowX + cs.overflowY)) {
        const dy = el.scrollHeight - el.clientHeight
        const dx = el.scrollWidth - el.clientWidth
        // A reserved scrollbar gutter is as much a defect as the overflow itself.
        const gutterY = el.offsetWidth - el.clientWidth
        const gutterX = el.offsetHeight - el.clientHeight
        if (dy > 2 || dx > 2 || gutterY > 2 || gutterX > 2) {
          const label =
            el.closest('div')?.querySelector('.font-mono')?.textContent?.trim() ||
            el.tagName.toLowerCase()
          clipped.push({ label: label.slice(0, 40), dy: Math.round(dy), dx: Math.round(dx) })
        }
      }

      if (el.children.length) return
      const t = (el.textContent || '').trim()
      if (!t || t.length > 90) return
      // Only tokens that mean one thing: a command or path (monospace), or a
      // `·`-joined file list in a FileTree note.
      const oneToken = cs.fontFamily.includes('Mono') || t.includes('\u00b7')
      if (!oneToken) return
      const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.4
      /*
        PADDING IS NOT A SECOND LINE.

        This divided the element's full border-box height by its line height,
        so any padded monospace leaf reported two rows while rendering on one:
        a `py-2.5` chip at 17px line height measures 40px, and 40/17 rounds to
        2. Session 3 shipped four such false positives (`starts.txt`,
        `docker-demo_default` twice, and a `backend:8000 resolves` pill), all
        confirmed single-line in the rendered screenshots, and a harness whose
        warnings are known-noisy is a harness people stop reading.

        Measuring the CONTENT box is what the check meant all along: subtract
        the vertical padding before dividing. A genuine wrap still grows the
        content box by a full line, so nothing real is masked.
      */
      /*
        NOR IS A STRETCHED GRID ROW A SECOND LINE.

        Subtracting the padding fixed the chip case above and still reported a
        false positive on session 7's `c1-same-two-steps`, for a different
        reason: `SwapRows` puts both halves of a pairing in one grid row, and the
        right half carries a command AND a gloss under it. The left half holds
        one line, and the grid stretches it to match, so its CONTENT box is two
        lines tall while its text renders on one. `docker tag ravi123/...` was
        reported wrapped and was confirmed single-line on the screenshot.

        A box is the wrong thing to measure. Ask the TEXT how many line boxes it
        occupies: a Range over the text node returns one rect per line, which no
        amount of padding, stretch or alignment can inflate. The box arithmetic
        stays as the fallback for the case the Range cannot answer.
      */
      let rows = 0
      const node = el.firstChild
      if (node && node.nodeType === 3) {
        const range = document.createRange()
        range.selectNodeContents(el)
        const lineTops = new Set()
        for (const r of range.getClientRects()) {
          if (r.width === 0 && r.height === 0) continue
          lineTops.add(Math.round(r.top))
        }
        rows = lineTops.size
        range.detach?.()
      }
      if (!rows) {
        const padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0)
        rows = Math.round((el.getBoundingClientRect().height - padY) / lh)
      }
      if (rows >= 2) wrapped.push({ rows, txt: t.slice(0, 56) })
    })

    const findings = blocks.map((b) => {
      const aligned = Math.abs(b.left - headerLeft) <= TOL
      const centred = Math.abs((b.left + b.right) / 2 - centre) <= TOL
      return { ...b, verdict: aligned ? 'ALIGNED' : centred ? 'CENTRED' : 'DRIFT' }
    })
    return {
      headerLeft,
      centredLayout,
      chromeHits,
      clipped,
      wrapped,
      tail: lowest ? Math.round(cr.bottom - lowest) : 0,
      findings,
      titleTxt: (title?.textContent || '').trim().slice(0, 34),
    }
  }, { TOL, CHROME })

  if (!r) continue
  const drift = (r.findings || []).filter((f) => f.verdict === 'DRIFT')
  const chromeHits = r.chromeHits || []
  const clipped = r.clipped || []
  const wrapped = r.wrapped || []
  // A centred slide type is exempt from the left-edge datum and the tail, but NOT
  // from chrome collisions or clipped panels: those are wrong on any layout.
  const driftReported = r.centredLayout ? [] : drift
  const tailReported = r.centredLayout ? 0 : r.tail
  if (driftReported.length || chromeHits.length || clipped.length || wrapped.length || tailReported > 170) {
    rows.push({ i, ...r, drift: driftReported, chromeHits, clipped, wrapped, tail: tailReported })
  }
}

console.log('datum: header left edge   ·   tolerance ±%dpx\n', TOL)
for (const r of rows) {
  console.log(`slide ${String(r.i).padStart(2)}  <${r.titleTxt}>   header@${r.headerLeft}  tail=${r.tail}px`)
  for (const d of r.drift) {
    const off = d.left - r.headerLeft
    console.log(`   DRIFT    left=${d.left} (${off > 0 ? '+' : ''}${off} from header)  right=${d.right}  ${d.cls}`)
  }
  for (const c of r.chromeHits) {
    console.log(`   CHROME   under the ${c.zone} at ${c.x},${c.y} (${c.ox}x${c.oy}px)  "${c.txt}"`)
  }
  for (const c of r.clipped) {
    const dir =
      [c.dy > 2 ? `${c.dy}px below` : null, c.dx > 2 ? `${c.dx}px right` : null]
        .filter(Boolean)
        .join(' and ') || 'a scrollbar gutter'
    console.log(`   CLIPPED  ${c.label} loses ${dir} of its own content`)
  }
  for (const w of r.wrapped) {
    console.log(`   WRAPPED  one token over ${w.rows} lines: "${w.txt}"`)
  }
}
console.log(`\n${rows.length} of ${TOTAL} slides need attention`)
await browser.close()
