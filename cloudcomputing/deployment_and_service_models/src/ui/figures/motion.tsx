/*
 * PROMOTED FROM THE FIGURE LABS, AND THIS IS THE ONE COPY.
 *
 * `flowchart-lab`, `pseudocode-lab`, `projectcode-lab`, `points-lab` and
 * `features-lab` each carried a byte-identical copy of this file, which is exactly
 * the drift those labs exist to avoid: five figure families that differ in
 * GEOMETRY must not also differ in tempo, or comparing them compares the wrong
 * thing. `src/ui/flowchart/motion.tsx` is now a re-export of this module rather
 * than a sixth copy.
 *
 * The one edit made on promotion: the labs write `T.draw` where the kit's
 * `figureTiming.ts` calls the same 600ms value `T.drawStep`. Same number, so no
 * figure changes behaviour; the kit's name wins because the kit also keeps a
 * longer `T.draw` for auto-playing figures.
 */
import type { CSSProperties, ReactNode } from 'react'
import { ArrowHead } from './ArrowHead'
import { motion, useReducedMotion } from 'framer-motion'
import { useClaimedSteps } from '@/motion/Stepper'
import { T, E, c4 } from '@/ui/figureTiming'

/**
 * SHARED MOTION FOR EVERY VARIANT IN THIS LAB.
 *
 * THE CHOREOGRAPHY RULE, WHICH IS THE WHOLE POINT
 *
 * Lifted from `slide-kit/flowchart-lab`, where the rule was that a flow chart's
 * content IS its order, so the figure assembles along the path. A features slide
 * is a SET rather than a sequence, so the rule here is weaker but not absent:
 * the hero lands first because it is what the slide is about, and the rest
 * follow in authored order.
 *
 * At the fork, the exits are deliberately not simultaneous:
 *
 *   1. the happy path draws first, at full weight
 *   2. the exception branch draws next, quieter
 *   3. the loop back draws last
 *
 * That ordering is the established practice ("the main process flow should be
 * visually dominant, with alternative outcomes easy to compare") expressed in
 * time rather than only in colour. The room follows the straight-through story
 * once, then sees what happens when it fails.
 *
 * `beat()` turns a step index into a delay so a variant never writes its own
 * arithmetic and all six keep one tempo.
 *
 * THE TIER
 *
 * Explanatory, from `figureTiming.ts`: entrances 520ms, staggers 130ms, draws
 * 860ms, whole figure assembled in about 2.4s. These are roughly double the
 * `animate` skill's UI numbers, on that skill's own instruction that explanatory
 * motion can run longer. Nobody triggers a slide figure and nobody repeats it;
 * it is read once from the back of a room while someone talks over it.
 *
 * REDUCED MOTION IS HANDLED HERE, AND THE CSS BLOCK DOES NOT COVER IT
 *
 * `src/index.css` clamps `animation-duration` and `transition-duration`, which
 * is the right thing for CSS. framer-motion animates by writing inline styles
 * frame by frame, so that block does not touch any of this. Every primitive
 * below reads `useReducedMotion()` and mounts at its final state, keeping the
 * figure legible while removing the movement.
 */

/** Delay for the nth beat along the path. Nothing computes its own. */
export const beat = (n: number) => T.lead + n * T.stagger

/**
 * CLICK-GATED BEATS: the figure builds one step per click, in beat order.
 *
 * A flow chart is a sequence, and an instructor talks through a sequence one
 * stage at a time. Auto-playing the whole thing on slide entry hands the room
 * the finished picture about 2.5 seconds in, whatever the instructor has
 * actually reached, and there is no way to hold on the decision while it is
 * being discussed.
 *
 * `useClaimedSteps` registers `count` build steps with the deck's `Stepper` and
 * returns which of them have been reached, so a part gates on `shown[at]` and
 * the same `at` that used to be a delay is now a click index. Nothing else in a
 * variant changes.
 *
 * It exists because `useReveal()` called in a loop does NOT work: every beat
 * claimed the same order, the whole figure appeared on the first click, and the
 * slide reported one step so the arrow key advanced to the next slide instead of
 * building this one.
 *
 * A variant must compute `count` from its own `nodes`/`edges` and never from
 * state, so the number of registered steps is stable while the slide is up.
 *
 * Under `?all` every `useReveal()` returns true, so all three harnesses still
 * measure the finished figure.
 */
export function useBeats(count: number): boolean[] {
  /*
    BEAT 0 IS NOT A CLICK.

    It is the slide's base content, on screen the moment the slide arrives, which
    for every variant here is the `start` node. Claiming it as a step would open
    the slide on an empty stage that looks like a figure which failed to render,
    and would cost the presenter a click to reach the one part of the chart that
    needs no explanation.

    So the first beat is free and the remaining `count - 1` are claimed.
  */
  const claimed = useClaimedSteps(Math.max(0, count - 1))
  return [true, ...claimed]
}

/**
 * A node arriving.
 *
 * `scale(0.96)` and not `scale(0)`: nothing in the real world appears out of
 * nothing, and a node popping from zero reads as a notification rather than as a
 * step in a process. Rises 10px, so the motion has a direction that agrees with
 * the path being drawn.
 */
export function FcNodeIn({
  at,
  shown,
  children,
  className,
  style,
}: {
  /** Which beat this node lands on: a click index when `shown` is passed. */
  at: number
  /**
   * Click-gated mode. `undefined` keeps the old auto-play behaviour, where the
   * part animates on entry after `beat(at)`. A boolean makes it a build step:
   * it holds hidden until the deck reaches its beat, then animates with no
   * delay, because the click IS the timing.
   */
  shown?: boolean
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  const reduce = useReducedMotion()
  const stepped = shown !== undefined
  return (
    <motion.div
      /*
        `fc-node-slot` is what lets a hover popover paint above its neighbours.

        This element animates `transform`, and a transformed element CREATES A
        STACKING CONTEXT. So a `z-index` on the popover inside it only competes
        with that node's own children: every slot rendered later in the DOM paints
        on top of it regardless, and the detail panel came out sliced by the next
        two cards along.

        The fix has to raise the SLOT, not the popover, and `index.css` does it
        with `:has()` so no state has to be threaded from `NodeShell` back up to
        here.
      */
      className={`fc-node-slot ${className ?? ''}`}
      style={style}
      initial={reduce ? false : { opacity: 0, transform: 'translateY(10px) scale(0.96)' }}
      animate={
        stepped && !shown
          ? { opacity: 0, transform: 'translateY(10px) scale(0.96)' }
          : { opacity: 1, transform: 'translateY(0px) scale(1)' }
      }
      transition={{ duration: T.enter, delay: stepped ? 0 : beat(at), ease: c4(E.out) }}
    >
      {children}
    </motion.div>
  )
}

/**
 * An edge drawing itself.
 *
 * `pathLength` is framer's handle on `stroke-dasharray` / `stroke-dashoffset`,
 * which is the canonical line-draw: set the dash to the path's own length and
 * animate the offset from hidden to shown. It is the right primitive here
 * because the drawing IS the explanation, unlike a fade, which would just make
 * a finished line appear.
 *
 * `linear` rather than the house ease-out, and this is the one deliberate
 * departure in the file. An eased draw arrives at the arrowhead already slowing
 * down, which reads as the line running out of energy before it connects. A
 * constant-speed draw reads as something travelling, which is what an edge in a
 * process diagram means. The `animate` skill lists `linear` for exactly this:
 * constant motion rather than an entrance.
 */
export function FcEdgeDraw({
  d,
  at,
  shown,
  stroke,
  width = 2,
  dashed = false,
  markerEnd,
  duration = T.drawStep,
  crisp = false,
}: {
  d: string
  at: number
  shown?: boolean
  stroke: string
  width?: number
  dashed?: boolean
  markerEnd?: string
  duration?: number
  /**
   * Snap the LINE to whole device pixels (`shape-rendering: crispEdges`).
   *
   * For straight horizontal and vertical edges only. At a fractional stage zoom
   * (1.2x on a 1536px screen) a 2px line lands on 2.4 device pixels and
   * antialiases into a soft grey band, while the arrowhead beside it stays sharp,
   * so the two read as misaligned. A curved edge must NOT set this: crispEdges
   * turns a curve into a staircase. The arrowhead is never snapped.
   */
  crisp?: boolean
}) {
  const reduce = useReducedMotion()
  const stepped = shown !== undefined
  const hidden = stepped && !shown
  return (
    <>
      <motion.path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        shapeRendering={crisp ? 'crispEdges' : undefined}
        /* A dashed edge cannot also be drawn by pathLength: both want the dash
           array. The dashed exception paths therefore fade instead, which is the
           honest trade and part of why they read as subordinate. */
        strokeDasharray={dashed ? '7 7' : undefined}
        initial={reduce ? false : dashed ? { opacity: 0 } : { pathLength: 0, opacity: 0 }}
        animate={
          hidden
            ? dashed
              ? { opacity: 0 }
              : { pathLength: 0, opacity: 0 }
            : dashed
              ? { opacity: 1 }
              : { pathLength: 1, opacity: 1 }
        }
        transition={{
          duration: dashed ? T.label : duration,
          delay: stepped ? 0 : beat(at),
          ease: dashed ? c4(E.out) : 'linear',
          opacity: { duration: T.label, delay: stepped ? 0 : beat(at), ease: c4(E.out) },
        }}
      />
      {/*
        THE ARROWHEAD IS A SEPARATE TRIANGLE, AND IT ARRIVES WHEN THE LINE DOES.

        It used to be an SVG marker on a transparent copy of this path. Two
        reasons it is not any more: a marker is painted at the path's end vertex
        from the first frame, so it floated in empty space while the line was
        still drawing; and Firefox misplaces markers inside the CSS-zoomed stage,
        which put every arrowhead below its line (see `ArrowHead`). So it is a
        plain polygon on the same `d`, in the colour `FcArrowDefs` registered for
        `markerEnd`, fading in once the draw has finished.
      */}
      {markerEnd && (
        <ArrowHead
          d={d}
          color={arrowColor(markerEnd) ?? stroke}
          strokeWidth={width}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: hidden ? 0 : 1 }}
          transition={{
            duration: T.label,
            delay: (stepped ? 0 : beat(at)) + (dashed ? T.label : duration) * 0.82,
            ease: c4(E.out),
          }}
        />
      )}
    </>
  )
}

/**
 * An edge's condition label, and the arrival of the arrowhead it belongs to.
 *
 * Lands AFTER its edge has finished drawing, never with it. A "Yes" that is
 * already on screen while the line is still travelling towards it tells the room
 * the answer before it has watched the question being asked.
 *
 * DOM, not `<text>`. Content rule 17: an `<svg>` is one rectangle to every
 * harness in this repo, so two `<text>` labels can overlap and pass all three
 * sweeps. Session 4 shipped that twice.
 */
export function FcEdgeLabel({
  at,
  shown,
  children,
  className = '',
  style,
}: {
  at: number
  shown?: boolean
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  const reduce = useReducedMotion()
  const stepped = shown !== undefined
  return (
    <motion.span
      className={className}
      style={style}
      initial={reduce ? false : { opacity: 0, transform: 'scale(0.92)' }}
      animate={
        stepped && !shown
          ? { opacity: 0, transform: 'scale(0.92)' }
          : { opacity: 1, transform: 'scale(1)' }
      }
      /*
        THE LABEL STILL LANDS AFTER ITS LINE, INCLUDING IN STEPPED MODE.

        Click-gating removed the auto-play delay, and the first pass zeroed this
        one with it. That put "Yes" on screen the instant the click landed, while
        the line was still travelling towards it, which is precisely what the note
        above says must not happen: the room is told the answer before it has
        watched the question being asked.

        A click removes the delay BEFORE the beat, not the ordering WITHIN it.
      */
      transition={{
        duration: T.label,
        delay: stepped ? T.drawStep * 0.7 : beat(at) + 0.24,
        ease: c4(E.out),
      }}
    >
      {children}
    </motion.span>
  )
}

/**
 * The arrowhead colours, defined once per figure.
 *
 * NO LONGER A `<marker>` SET. Firefox misplaces SVG markers inside the CSS-zoomed
 * stage, so arrowheads are drawn as polygons by `ArrowHead` (via `FcEdgeDraw`).
 * The API is unchanged so every figure keeps its call: this registers each
 * colour under `${id}-${key}`, and `FcEdgeDraw` resolves its
 * `markerEnd="url(#id-key)"` against it. Ids stay namespaced per figure, as the
 * marker ids were. It renders nothing.
 */
const ARROW_COLORS = new Map<string, string>()

export function FcArrowDefs({ id, colors }: { id: string; colors: Record<string, string> }) {
  for (const [key, color] of Object.entries(colors)) ARROW_COLORS.set(`${id}-${key}`, color)
  return null
}

/** `url(#spine-main)` to the colour registered for `spine-main`. */
function arrowColor(markerEnd: string): string | undefined {
  const m = /^url\(#(.+)\)$/.exec(markerEnd.trim())
  return m ? ARROW_COLORS.get(m[1]) : undefined
}
