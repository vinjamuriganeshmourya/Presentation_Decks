/**
 * THE AGENDA, content rules 39 and 44. The mark says `Agenda`, large, over the
 * session's name, small, which shrinks to fit and never clips; the points sit on
 * the arc with the group centred on the mark's centre line, evenly gapped, clear
 * of the speaker box; nothing steps or is selected.
 *
 * This is the file every Python-course deck from session 17 to 31 carried as
 * `src/decks/figures/Agenda.tsx` (the kit branch `kit/agenda-session-name` plus
 * the point layout asked for on 2026-10-05), folded into the kit from session 31
 * on the user's word on 2026-10-14, with the updated template's two changes:
 * no blue field of its own, and the big word in the title face.
 */
import { useLayoutEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { SlideBase } from '@/ui'
import { useInstant } from '@/motion/instant'
import { colors } from '@/design/tokens'
import type { AgendaSlideProps } from './types'

/**
 * AGENDA — a navy orbit mark on the left, the session's sections strung along a
 * arc on the right.
 *
 * The previous version was a stack of bordered cards, which gave four equal
 * boxes and no sense of sequence. Here the numbers sit ON a single curve, so the
 * eye is carried down the list in order and the whole slide reads as one object
 * rather than as a list of containers.
 *
 * GEOMETRY
 * Every item and the curve itself come from the same function, so they cannot
 * drift apart: `x = X_BASE + BULGE * sin(pi * t)`, `y` spread evenly, with `t`
 * running 0..1 across the items. The drawn path samples the same function past
 * both ends, which is what lets the curve run off the top and bottom edges the
 * way the reference does.
 *
 * The first item starts below y=230 so that nothing lands in the rectangle
 * reserved at the top right for the instructor video.
 *
 * WHAT THE MARK SAYS (user, 2026-10-05, every deck from now on)
 *
 * The large word in the mark is `Agenda`, always. The small line above it is
 * the SESSION'S NAME. Before this the decks had the mark saying "What We Will
 * Cover" or "Today's Agenda" with the word Agenda as the small kicker, so the
 * one slide whose job is to say "this is the agenda for this session" said
 * neither at a glance. `title` therefore defaults to `Agenda` and `kicker` to
 * `lesson`, the session name every deck already passes for the footer: a deck
 * that passes only `lesson` and `items` is right by default, and a deck that
 * passes anything else as the title is the thing to fix, not this file.
 *
 * A session name can be long ("Comparing Strings & Naming Variables") and the
 * mark is a 268px circle, so the kicker FITS ITSELF. `useFitText` measures it
 * and steps the size down from 16px until it sits in at most two lines with no
 * sideways overflow, to a floor of 11px; a single word that still does not fit
 * at the floor may then break inside itself (`overflow-wrap: anywhere`). It is
 * never clipped and never truncated: the only thing that gives is the size,
 * and at the floor the line count, because 11px is the smallest that reads
 * from a seat and the mark holds five such lines over the word with room. A
 * 71-character name sits in three lines at 11px, inside the circle. It re-fits
 * when the webfont lands (the first measurement may be of the fallback face)
 * and whenever its box changes width.
 */

/*
  THE CURVE
  One cubic Bézier, sweeping in from the top left, bulging right through the
  middle and returning left at the bottom — the shape of the reference. It is
  deliberately NOT symmetric: the entry is steeper than the exit, which is what
  makes it read as a sweep rather than as a bow.

  An earlier version placed the numbers with `sin(pi * t)` and drew the path from
  the same function. That is symmetric, and worse, it reverses direction just
  past each end, so the line kinked back on itself at the top and bottom instead
  of running off the frame.

  Numbers are positioned by SAMPLING this very path, so they sit exactly on the
  drawn line by construction rather than by two formulas being kept in step.
*/
const P0 = { x: 398, y: 4 }
const P1 = { x: 545, y: 170 }
const P2 = { x: 548, y: 505 }
const P3 = { x: 424, y: 706 }

/*
  THE POINTS ARE CENTRED ON THE MARK (user, 2026-10-05, every deck from now on).

  The points used to be spread from a fixed y=268 to a fixed y=612 whatever
  their number, so two points sat with their middle at y=440, one up near the
  mark's top and the other below the mark altogether. The band the user drew
  is the mark's orbit ring: y 197 to 535, its midpoint the mark's centre at
  y=366. The group of points is now centred on that line, whatever the count.

  THE GAP between neighbouring points is `BAND_H / n`, so a small count spreads
  evenly across the band (two points sit 169px apart, three 113px) with no
  empty stretch and no crowding, and never less than `GAP_MIN`, the height of a
  title with its sub line plus breathing room. From five points the group is
  taller than the band and extends past it equally above and below, which is
  allowed; past `Y_MIN`..`Y_MAX` (30px of block clear of the canvas edges and
  the footer bar) the gaps shrink evenly instead, so nothing ever runs off the
  slide. The badges still sit on the curve: the curve gives x from y, so a
  point moved up or down slides along the arc by construction.

  THE SPEAKER BOX (x 913..1280, y 0..220, the rectangle `video-safe.mjs`
  asserts and content rule 32 names) is never entered. A point whose centre is
  within 100px below the box's bottom edge could reach into its rows once a
  title wraps, so its text is capped at `VIDEO_LEFT - GUTTER`; every other
  point is capped at the frame's right edge. A long title or sub therefore
  wraps inside the width it has, and never extends under the box.
*/
/** The mark's centre and its orbit ring: the band the points are centred on. */
const MARK_CY = 366
const BAND_H = 338
/** The least two neighbouring points may be apart, centre to centre. */
const GAP_MIN = 96
/** The furthest a point's centre may go: 30px of block each side stays on the canvas and above the footer bar. */
const Y_MIN = 60
const Y_MAX = 672
/** The speaker box's left edge and bottom edge (content rule 32). */
const VIDEO_LEFT = 913
const VIDEO_BOTTOM = 220
/** Below the box by less than this, a point's text is capped short of it. */
const VIDEO_REACH = 100
/** The padded frame's right edge (content rule 32) and the gutter kept to the box. */
const RIGHT_EDGE = 1216
const GUTTER = 24
/** The text starts this far right of the badge's centre. */
const TEXT_DX = 42

/** The y of every point's centre: evenly gapped, the group centred on `MARK_CY`. */
function pointYs(n: number): number[] {
  if (n <= 1) return [MARK_CY]
  let gap = Math.max(BAND_H / n, GAP_MIN)
  const room = Y_MAX - Y_MIN
  if ((n - 1) * gap > room) gap = room / (n - 1)
  const first = MARK_CY - ((n - 1) * gap) / 2
  return Array.from({ length: n }, (_, i) => first + i * gap)
}

const bezier = (t: number) => {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return {
    x: a * P0.x + b * P1.x + c * P2.x + d * P3.x,
    y: a * P0.y + b * P1.y + c * P2.y + d * P3.y,
  }
}

/** The x on the curve at a given y, found by sampling — the curve is monotonic
 *  in y, so a linear scan is exact enough at this resolution. */
function xAt(y: number) {
  let best = bezier(0)
  let bestDy = Math.abs(best.y - y)
  for (let t = 0; t <= 1; t += 0.002) {
    const p = bezier(t)
    const dy = Math.abs(p.y - y)
    if (dy < bestDy) {
      best = p
      bestDy = dy
    }
  }
  return best.x
}

const CURVE_D = `M${P0.x} ${P0.y} C${P1.x} ${P1.y} ${P2.x} ${P2.y} ${P3.x} ${P3.y}`

/** How long the line takes to draw itself, in seconds. */
const DRAW = 1.9
/** The line is already moving before the first item lands. */
const FIRST_AT = 0.45

/**
 * The kicker's sizes, in px. The top is `text-body-sm`, what it always was; the
 * floor is the smallest the session name may go and still be read from a seat.
 */
const KICKER_MAX = 16
const KICKER_MIN = 11
/** At most this many lines of session name above the word. */
const KICKER_LINES = 2
/** `leading-snug`, which the kicker keeps at every size. */
const KICKER_LEADING = 1.375

/**
 * Shrink a block of text until it fits its box: no more than `KICKER_LINES`
 * lines tall and no wider than its container. `useLayoutEffect`, so the room
 * never sees the unshrunk size for a frame. Re-measured when the text changes,
 * when the box changes width (a `ResizeObserver` on the element; width only, so
 * the hook's own font-size changes cannot ask for the hook again) and once the
 * webfonts are ready, because the first measurement may be of the fallback
 * face.
 */
function useFitText(text: unknown) {
  const ref = useRef<HTMLParagraphElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => {
      let size = KICKER_MAX
      el.style.fontSize = `${size}px`
      el.style.overflowWrap = 'normal'
      const over = () =>
        el.scrollWidth > el.clientWidth + 1 ||
        el.scrollHeight > Math.ceil(size * KICKER_LEADING * KICKER_LINES) + 1
      while (size > KICKER_MIN && over()) {
        size -= 0.5
        el.style.fontSize = `${size}px`
      }
      /* The floor, and still too wide: one word longer than the box. It may
         break inside itself rather than run out of the mark. */
      if (over()) el.style.overflowWrap = 'anywhere'
    }
    fit()
    let width = el.clientWidth
    const ro = new ResizeObserver(() => {
      if (el.clientWidth === width) return
      width = el.clientWidth
      fit()
    })
    ro.observe(el)
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(fit).catch(() => {})
    }
    return () => ro.disconnect()
  }, [text])
  return ref
}

export function AgendaSlide({
  kicker,
  title = 'Agenda',
  items,
  lesson,
}: AgendaSlideProps) {
  const n = items.length
  const ys = pointYs(n)
  const instant = useInstant()
  /* The session name, unless the deck says otherwise. */
  const line = kicker ?? lesson ?? 'Agenda'
  const kickerRef = useFitText(line)

  return (
    <SlideBase variant="light" lesson={lesson} padded={false}>
      {/* the soft blue field behind the curve, top right */}
      {/* No blue field of its own: the frame's paper ground carries the azure
          corner wash (the updated template, base template since 2026-10-14). */}

      {/* the orbit mark */}
      <div className="absolute left-[292px] top-[366px] -translate-x-1/2 -translate-y-1/2">
        <motion.span
          aria-hidden
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{ width: 338, height: 338, border: `1px solid ${colors.nwNavy}1F` }}
          initial={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }}
          animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.div
          /*
            ONE COLUMN, THE MARK'S OWN WIDTH, WHATEVER THE TEXT. A bare `grid`
            gives an `auto` track, and an auto track is sized from its content:
            one unbreakable word longer than the mark grew the track past the
            circle and carried the text out of it, where no font size could
            follow. `minmax(0, 1fr)` pins the track to 268px, so an over-long
            word is an overflow INSIDE a 188px box, which the fit below sees.
          */
          className="relative grid grid-cols-[minmax(0,1fr)] place-items-center rounded-full text-center"
          style={{ width: 268, height: 268, background: colors.nwNavy }}
          initial={{ opacity: 0, scale: 0.86 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          {/*
            `w-full min-w-0`, so the kicker's box is the mark's width less the
            padding (188px) whatever the text, and the fit above measures
            against a box that does not itself depend on the text's size.
            Centred text, so nothing moves for a short name.
          */}
          <div className="w-full min-w-0 px-10">
            <p
              ref={kickerRef}
              className="font-semibold leading-snug text-white/70"
              style={{ fontSize: KICKER_MAX }}
            >
              {line}
            </p>
            {/* The big word in the template's title face, like every hero word. */}
            <p className="mt-1 font-tpl-title text-[46px] font-semibold leading-none text-white">
              {title}
            </p>
          </div>
        </motion.div>
      </div>

      {/*
        The curve's canvas is a narrow band, not the whole slide. A full-bleed
        <svg> would overlap the reserved video rectangle, and the video-box sweep
        cannot skip it the way it skips decorative divs: on an SVG element
        `className` is an SVGAnimatedString rather than a string, so its
        `pointer-events-none` is invisible to that check.
      */}
      <svg
        className="pointer-events-none absolute"
        style={{ left: 360, top: 0 }}
        width={240}
        height={710}
        viewBox="360 0 240 710"
        aria-hidden
      >
        <motion.path
          d={CURVE_D}
          fill="none"
          stroke={colors.nwBlue}
          strokeOpacity={0.45}
          strokeWidth={1.5}
          initial={instant ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: instant ? 0 : DRAW, ease: 'easeInOut' }}
        />
      </svg>

      {/*
        Each item lands as the line reaches it, rather than the whole list
        appearing at once. The delay is the item's own position along the curve
        scaled by the draw time, so the timing follows the drawing by
        construction: move an item and its cue moves with it.

        These are plain entrances rather than click-driven `Step`s. The deck's
        plain arrows now jump whole slides, so a click-built agenda would never
        get built at all; this plays itself as soon as the slide is on screen.
      */}
      {items.map((item, i) => {
        const t = n === 1 ? 0.5 : i / (n - 1)
        const y = ys[i]
        const x = xAt(y)
        const textLeft = x + TEXT_DX
        /* Short of the speaker box where the box is in reach, else the frame's edge. */
        const maxWidth = (y < VIDEO_BOTTOM + VIDEO_REACH ? VIDEO_LEFT - GUTTER : RIGHT_EDGE) - textLeft
        const delay = instant ? 0 : FIRST_AT + t * (DRAW - FIRST_AT - 0.15)
        const rise = { duration: instant ? 0 : 0.55, delay, ease: [0.16, 1, 0.3, 1] as const }
        return (
          <div key={i}>
            <motion.div
              className="absolute"
              style={{ left: x, top: y }}
              initial={instant ? false : { opacity: 0, scale: 0.5, x: '-50%', y: '-50%' }}
              animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
              transition={rise}
            >
              <span
                className="grid h-9 w-9 place-items-center rounded-full font-heading text-body-sm font-bold"
                style={{ background: '#DCE7FB', color: colors.nwNavy }}
              >
                {i + 1}
              </span>
            </motion.div>
            <motion.div
              className="absolute"
              style={{ left: textLeft, top: y, maxWidth }}
              initial={instant ? false : { opacity: 0, x: -14, y: '-50%' }}
              animate={{ opacity: 1, x: 0, y: '-50%' }}
              transition={{ ...rise, delay: delay + 0.08 }}
            >
              <p
                className="font-heading text-[27px] font-bold leading-tight"
                style={{ color: colors.nwBlue }}
              >
                {item.title}
              </p>
              {item.sub && <p className="mt-1 text-body-sm text-body">{item.sub}</p>}
            </motion.div>
          </div>
        )
      })}
    </SlideBase>
  )
}
