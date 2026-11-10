import { easing } from '@/design/tokens'

/**
 * ONE TIMING SCALE FOR EVERY VARIANT.
 *
 * WHY THESE NUMBERS ARE NOT THE `animate` SKILL'S NUMBERS
 *
 * That skill's duration table caps UI at 300ms and calls a 400ms dropdown
 * sluggish. It is right, and it is about a different thing: a dropdown is opened
 * by the person watching it, tens of times a day, and the animation sits between
 * them and what they came for.
 *
 * A slide figure is the same skill's EXPLANATORY tier, where it says plainly that
 * durations can be longer. Nobody triggers it, nobody repeats it, and it is read
 * once, from the back of a room, on a projector, while an instructor is talking
 * over it. The first pass of these four variants used 240 to 280ms entrances and
 * a 70ms stagger, and on screen it reads as a flinch: the figure has finished
 * assembling before the room has finished looking up from their laptops.
 *
 * So the tier is explanatory and the numbers below are roughly double. They are
 * still bounded: nothing here is a 2-second reveal, because the instructor has
 * to be able to talk over the whole figure landing without waiting for it.
 *
 * These are the ONLY durations a variant may use. Four figures that differ in
 * geometry should not also differ in tempo, or comparing them compares the wrong
 * thing.
 */
export const T = {
  /** A card, a tile, a station arriving. */
  enter: 0.52,
  /** Gap between items in a stagger. Was 70ms, which read as one clump. */
  stagger: 0.13,
  /**
   * A rail or a connector tracing itself, inside a figure that AUTO-PLAYS.
   *
   * The slowest beat, and it leads. Session 6's `BoundaryBridge` is built on this
   * number and its skill records it, so it does not move.
   */
  draw: 0.86,
  /**
   * The same draw inside a figure that is CLICK-GATED, which is a different tier.
   *
   * An auto-played connector is one beat in an assembly the room watches once,
   * and 860ms of travel leads the eye. A click-gated one draws in direct response
   * to a key press the presenter is waiting on before they speak the next
   * sentence: that is the `animate` skill's UI case, and 860ms after a deliberate
   * press reads as lag.
   *
   * 600ms keeps the line visibly travelling, which is the whole reason it draws
   * rather than fades, while answering the click promptly.
   *
   * A separate field rather than a change to `draw`, because both tiers are live
   * in this kit at once and one number cannot serve both.
   */
  drawStep: 0.6,
  /** A label or caption fading up once its line has landed. */
  label: 0.34,
  /** The one emphasis beat a figure is allowed, and it plays once. */
  accent: 0.6,
  /** Cargo moving from one stop to the next. */
  travel: 0.78,
  /** Delay before anything starts, so the slide transition finishes first. */
  lead: 0.12,
} as const

/** The house curves, re-exported so a variant never reaches for its own. */
export const E = {
  /** Entrances and exits. */
  out: easing.soft,
  /** Something already on screen moving from A to B. */
  inOut: [0.77, 0, 0.175, 1] as const,
  /** One emphasis pop. Use sparingly and never on an entrance. */
  pop: easing.springy,
} as const

/**
 * A multi-keyframe track needs ONE EASING PER SEGMENT.
 *
 * `ease: easing.soft` on a five-keyframe animation is a four-number array, so
 * framer-motion reads it as four per-segment easings instead of one curve, and
 * the motion runs to the end and comes back. This was a real bug in the first
 * pass of `CargoTrack`.
 */
export const perSegment = (
  keyframeCount: number,
  curve: readonly number[] = E.inOut,
): number[][] => Array.from({ length: Math.max(1, keyframeCount - 1) }, () => [...curve])

/**
 * A readonly curve tuple, copied into the mutable 4-tuple framer's `Easing`
 * type wants.
 *
 * `E.out` and friends are `as const`, so they are `readonly [number, number,
 * number, number]` and framer rejects them outright. Every variant was writing
 * its own two-line copy helper for this, so it lives here once.
 */
export const c4 = (curve: readonly number[]): [number, number, number, number] => [
  curve[0],
  curve[1],
  curve[2],
  curve[3],
]
