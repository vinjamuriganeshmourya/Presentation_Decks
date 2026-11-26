import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useReveal } from '@/motion/Stepper'
import { useInstant } from '@/motion/instant'
import { colors } from '@/design/tokens'
import { iconByName, type IconName } from './icons'
import { T, E, c4 } from './figureTiming'

/**
 * One thing at the centre, reaching out to many places, drawn as it is said.
 *
 * THE ARGUMENT IT MAKES, AND WHY A GRID CANNOT MAKE IT
 *
 * "Python has applications in almost every field" is a claim about REACH. Five
 * cards in a row say "here are five things of equal weight" and leave the room to
 * infer the centre; the reach, which is the whole point, is the one thing a grid
 * does not draw. A hub with spokes draws it: one origin, five destinations, and
 * the lines between them are the sentence.
 *
 * This replaced a `CardGrid`, then a tile system, on the first Python session's
 * "Versatile Language" slide. The user's objection to the second is worth keeping
 * written down, because it is the general rule: *"why should we be constrained to
 * cards?"* The form follows the argument.
 *
 * THE MOTION IS THE ARGUMENT TOO
 *
 * A hub-and-spoke figure that arrives complete is a picture of reach. The same
 * figure with each spoke DRAWING outward is the act of reaching, which is the
 * difference between a diagram the room looks at and one it watches happen.
 * Static lines were the first version, and the note on them was fair: *"it should
 * be very dynamic, we should get the arrow also dynamically."*
 *
 * Per spoke, three beats:
 *
 *   1. the line traces from the hub outward   (`T.draw`, 860ms, and it leads)
 *   2. the arrowhead lands at its far end     (`T.label`, as the line arrives)
 *   3. the label slides in behind the arrow   (`T.enter`)
 *
 * AND THE SPOKES GO ONE AFTER ANOTHER, NOT TOGETHER.
 *
 * The default cadence is `CADENCE` below: each spoke starts when the previous
 * one's line is about half drawn. That is the difference between five lines
 * appearing at once (which reads as a diagram switching on) and five lines
 * reaching out in turn (which reads as one thing spreading). A `T.stagger` gap of
 * 130ms was the first attempt and it is far too short against an 860ms draw:
 * every line is in flight at once and the sequence is invisible.
 *
 * Only `pathLength`, `opacity` and `transform` are animated, so it composites.
 * No duration here is invented: every one comes from `figureTiming.ts`, the
 * explanatory tier, which runs at roughly double a UI animation's speed on
 * purpose. §4b of the generate-slides skill records why this deck does that.
 *
 * WHEN NOT TO USE IT
 *
 *   - Items that are a SEQUENCE. That is `StepList` or `FlowChart`. Spokes have
 *     no order, and the build order here is the instructor's pacing, never a
 *     claim about the content.
 *   - Items that are ALTERNATIVES to each other. Spokes all come from the hub, so
 *     they read as things it does, not things you choose between.
 *   - Two or three items. A hub with two spokes is a comparison drawn oddly.
 *
 * GEOMETRY AND RULE 17
 *
 * Each spoke owns a full-size `<svg>` overlay holding one line and one arrowhead,
 * and NO text. Every label is a DOM element in its own box, so the browser keeps
 * labels apart and `align-check.mjs` can measure each one. Content rule 17: an
 * `<svg>` with `<text>` inside is a single rectangle to every harness, and labels
 * that collide inside it pass all three sweeps.
 *
 * The per-spoke `<svg>` is also what lets ONE `useReveal()` call drive both the
 * line and its label. Sharing a single step between them is the requirement, and
 * one shared `<svg>` for all five lines could not do it without claiming a step
 * per line.
 */

export interface Spoke {
  icon?: IconName
  label: string
  /** One short line. Optional, and often better left off. */
  body?: ReactNode
}

/* The figure's own coordinate space, scaled by the wrapper. */
const W = 660
const H = 420
const HUB = { x: 150, y: H / 2 }
const R = 258
/** The line stops short of the label, leaving room for the arrowhead. */
const TIP_GAP = 20

/**
 * Gap between one spoke starting and the next, in seconds.
 *
 * Half the draw, so a spoke is clearly following the one before it while the
 * whole figure still lands in about three seconds. `T.stagger` (130ms) is the
 * house gap for items that FADE in together; it is the wrong unit for a set of
 * 860ms line draws that are meant to be read one at a time.
 */
const CADENCE = T.draw * 0.5

/**
 * The arc the spokes fan across, in degrees, 0 being straight right.
 *
 * WHY IT IS NARROW. At +/-58 with R=300 the outermost labels ran off the bottom
 * of the 720px frame once the figure was centred in the well, and the top one
 * climbed toward the instructor-video rectangle. Screenshotting the slide showed
 * "Backend Development" cut in half; no harness had said a word, because every
 * label is inside the frame as a DOM rect and it is the LAST one that is not.
 * Content rule 17, again.
 */
const ARC = { from: -44, to: 44 }

function spokeAngle(i: number, n: number) {
  const t = n === 1 ? 0.5 : i / (n - 1)
  return ((ARC.from + (ARC.to - ARC.from) * t) * Math.PI) / 180
}

const at = (rad: number, r: number) => ({
  x: HUB.x + r * Math.cos(rad),
  y: HUB.y + r * Math.sin(rad),
})

const pct = (v: number, of: number) => `${(v / of) * 100}%`

function Label({
  spoke,
  iconShown = true,
  iconTransition,
}: {
  spoke: Spoke
  iconShown?: boolean
  /** Omitted on an instant jump, which mounts the icon at its final state. */
  iconTransition?: { duration: number; ease: [number, number, number, number]; delay: number }
}) {
  const Icon = spoke.icon ? iconByName[spoke.icon] : null
  return (
    <div
      className="flex -translate-y-1/2 items-center gap-3 rounded-pill bg-white py-2.5 pl-2.5 pr-5 shadow-card-soft"
      style={{ border: `1px solid ${colors.line}` }}
    >
      {Icon && (
        <motion.span
          className="flex size-9 shrink-0 items-center justify-center rounded-full"
          style={{ background: colors.surface2, color: colors.brand }}
          aria-hidden
          initial={iconTransition ? { scale: 0.5, opacity: 0 } : false}
          animate={{ scale: iconShown ? 1 : 0.5, opacity: iconShown ? 1 : 0 }}
          transition={iconTransition}
        >
          <Icon />
        </motion.span>
      )}
      <span className="whitespace-nowrap font-heading text-[17px] font-bold text-ink">
        {spoke.label}
      </span>
    </div>
  )
}

/**
 * FIVE THINGS PER SPOKE, IN ORDER. The choreography IS the content here.
 *
 * A line that fades in and a label that fades in is two crossfades, and it reads
 * as a diagram switching on. What this slide claims is that Python REACHES into
 * a field, so the motion has to travel:
 *
 *   1. a ring pushes out of the hub          the reach starts here
 *   2. a pulse rides the line outward        something is travelling
 *   3. the line traces behind the pulse      the path it took
 *   4. the arrowhead lands at the far end    it arrived
 *   5. the label pops in, icon last          what it arrived at
 *
 * Every one of those is `transform`, `opacity` or `pathLength`, so the whole
 * figure composites and nothing triggers layout. The overshoot on the label is
 * the ONE emphasis beat the timing scale allows (`E.pop`), and it is on the
 * arrival, never on the line.
 *
 * Durations come from `figureTiming.ts` and nothing here invents one.
 */
function SpokeParts({
  spoke,
  index,
  count,
  shown,
  /** Extra delay, used only when the whole figure animates on entry. */
  delay = 0,
}: {
  spoke: Spoke
  index: number
  count: number
  shown: boolean
  delay?: number
}) {
  const instant = useInstant()
  const rad = spokeAngle(index, count)
  const tip = at(rad, R - TIP_GAP)
  const anchor = at(rad, R)
  const deg = (rad * 180) / Math.PI

  /* On a Ctrl+arrow jump every part mounts at its final state, or this figure is
     the only thing moving on an otherwise still slide. */
  const still = instant

  const ringT = { duration: T.accent, ease: c4(E.out), delay }
  const pulseT = { duration: T.travel, ease: c4(E.inOut), delay: delay + T.accent * 0.3 }
  const lineT = { duration: T.draw, ease: c4(E.out), delay }
  const headT = { duration: T.label, ease: c4(E.out), delay: delay + T.draw * 0.84 }
  const labelT = { duration: T.enter, ease: c4(E.pop), delay: delay + T.draw * 0.9 }
  const iconT = { duration: T.label, ease: c4(E.out), delay: delay + T.draw * 0.9 + T.enter * 0.4 }

  return (
    <>
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={`0 0 ${W} ${H}`}
        fill="none"
        aria-hidden
      >
        {/* 1. The ring leaving the hub as this spoke launches. Plays once. */}
        {!still && (
          <motion.circle
            cx={HUB.x}
            cy={HUB.y}
            r={84}
            fill="none"
            stroke={colors.brand}
            strokeWidth={2}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={shown ? { scale: 1.28, opacity: [0, 0.4, 0] } : { scale: 0.9, opacity: 0 }}
            transition={ringT}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          />
        )}

        {/* 3. The path, tracing behind the pulse. */}
        <motion.line
          x1={HUB.x}
          y1={HUB.y}
          x2={tip.x}
          y2={tip.y}
          stroke={colors.brand}
          strokeWidth={2}
          strokeOpacity={0.5}
          strokeLinecap="round"
          initial={still ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: shown ? 1 : 0, opacity: shown ? 1 : 0 }}
          transition={lineT}
        />

        {/* 2. The pulse riding out along it. Translated, not re-drawn. */}
        {!still && (
          <motion.circle
            cx={HUB.x}
            cy={HUB.y}
            r={5}
            fill={colors.brand}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.6 }}
            animate={
              shown
                ? {
                    x: tip.x - HUB.x,
                    y: tip.y - HUB.y,
                    opacity: [0, 1, 1, 0],
                    scale: [0.6, 1, 1, 0.5],
                  }
                : { x: 0, y: 0, opacity: 0, scale: 0.6 }
            }
            transition={pulseT}
          />
        )}

        {/*
          4. The arrowhead is a SHAPE, not a `marker-end`: a marker appears the
             instant the line exists and cannot be timed to its arrival.

          THE PLACEMENT LIVES ON A STATIC `<g>`, AND IT HAS TO.

          framer-motion writes an inline `transform` on every frame of an animated
          element, and an inline `transform` style OVERRIDES an SVG `transform`
          attribute on the same node. The first version put
          `translate(tip) rotate(deg)` on the `motion.path` itself and animated
          `scale`: framer replaced the whole transform, the translate and rotate
          were discarded, and all five arrowheads rendered on top of each other at
          the origin. The slide screenshot showed no arrowheads at all.

          `KIT.md` §6 warns about this exact failure for Tailwind's
          `-translate-x-1/2`; it is the same mechanism. Put positioning on a
          wrapper that never animates, and animate only inside it.
        */}
        <g transform={`translate(${tip.x} ${tip.y}) rotate(${deg})`}>
          <motion.path
            d="M0 0 L-11 -6 L-11 6 Z"
            fill={colors.brand}
            fillOpacity={0.8}
            initial={still ? false : { opacity: 0, scale: 0.5 }}
            animate={{ opacity: shown ? 1 : 0, scale: shown ? 1 : 0.5 }}
            transition={headT}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          />
        </g>
      </svg>

      {/* 5. The label, arriving with the one overshoot the scale allows. */}
      <motion.div
        className="absolute"
        style={{ left: pct(anchor.x, W), top: pct(anchor.y, H) }}
        initial={still ? false : { opacity: 0, x: -26, scale: 0.94 }}
        animate={{ opacity: shown ? 1 : 0, x: shown ? 0 : -26, scale: shown ? 1 : 0.94 }}
        transition={labelT}
      >
        <Label spoke={spoke} iconTransition={still ? undefined : iconT} iconShown={shown} />
      </motion.div>
    </>
  )
}

/**
 * One click per spoke. `useReveal()` is called exactly once here, so the line,
 * the arrowhead and the label share a single build step rather than costing
 * three.
 */
function SteppedSpoke(props: { spoke: Spoke; index: number; count: number }) {
  const shown = useReveal()
  return <SpokeParts {...props} shown={shown} />
}

export function RadialSpread({
  hub,
  hubLogo,
  spokes,
  stepped = false,
  className = '',
}: {
  /** What everything radiates from. Two words at most. */
  hub: string
  /** A logo for the hub, `/assets/tech/python.png`. */
  hubLogo?: string
  spokes: Spoke[]
  /**
   * `true` gates each spoke behind its own click, so the instructor names one
   * field at a time. `false` (the default) plays the whole sequence on slide
   * entry, one spoke after another at `CADENCE`.
   *
   * The default is `false` because the instructor talks over this figure rather
   * than driving it: five clicks to finish one slide is five chances to lose the
   * thread. Turn it on when the room is meant to guess what comes next.
   */
  stepped?: boolean
  className?: string
}) {
  const instant = useInstant()
  const n = spokes.length
  const hubStyle: CSSProperties = { left: pct(HUB.x, W), top: pct(HUB.y, H) }

  return (
    /*
      CENTRED IN THE WELL, NOT LEFT-ALIGNED.

      A 660px figure pinned left in a ~1150px well leaves a third of the slide
      empty and reads as though it slid off its own frame. Centring is safe here
      because everything sits below y=230 and the instructor-video rectangle only
      reaches y=220.
    */
    <div className={`relative mx-auto w-full ${className}`} style={{ maxWidth: W }}>
      <div className="relative" style={{ aspectRatio: `${W} / ${H}` }}>
        {/* The hub lands before anything reaches out of it. */}
        <motion.div
          className="absolute"
          style={hubStyle}
          initial={instant ? false : { opacity: 0, scale: 0.82 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: T.enter, ease: c4(E.out), delay: instant ? 0 : T.lead }}
        >
          <div
            className="flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-2 rounded-full shadow-card"
            style={{ background: colors.brand, width: 168, height: 168 }}
          >
            {hubLogo && (
              <img
                src={hubLogo}
                alt=""
                aria-hidden
                className="h-10 w-10 object-contain"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            )}
            <span className="text-center font-heading text-[20px] font-extrabold leading-tight text-white">
              {hub}
            </span>
          </div>
        </motion.div>

        {spokes.map((s, i) =>
          stepped ? (
            <SteppedSpoke key={s.label} spoke={s} index={i} count={n} />
          ) : (
            <SpokeParts
              key={s.label}
              spoke={s}
              index={i}
              count={n}
              shown
              delay={T.lead + T.enter * 0.6 + i * CADENCE}
            />
          ),
        )}
      </div>
    </div>
  )
}
