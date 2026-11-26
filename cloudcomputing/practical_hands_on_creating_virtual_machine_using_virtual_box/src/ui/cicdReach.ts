import type { ReactNode } from 'react'
import { colors } from '@/design/tokens'

/**
 * THE SHARED CONTRACT FOR EVERY CANDIDATE IN THIS LAB.
 *
 * All three figures take these identical props, so swapping one for another in
 * a deck is a rename and nothing else. `flow-lab` established the pattern with
 * `flowFigure.ts` and `comparison-lab` repeated it with `compareFigure.ts`; it
 * is the thing that makes choosing cheap, because the gallery renders one
 * fixture three times and the only variable is the drawing.
 *
 * WHAT A REACH FIGURE IS FOR
 *
 * ONE pipeline, and two or more named practices that differ ONLY in how far
 * along it their automation reaches. That is a narrower claim than any flow
 * figure in the registry makes, and it is the whole reason this lab exists:
 *
 *   `SpineFlow`   one happy path with exceptions hanging off it. It has no
 *                 notion of a VARIANT that stops early; an `alt` branch is a
 *                 different route, not a shorter version of the same route.
 *   `TrackSwitch` a loop rejoining the journey. There is no loop here.
 *   `GateFlow`    one check is the point of the slide. Three terms are not a
 *                 check.
 *   `LaneFlow`    who OWNS each step. The owner is the same machine in all
 *                 three terms right up to the last stage, so lanes drawn by
 *                 owner would be identical and say nothing.
 *   `StepLedger`  words only, and the containment is exactly the part words
 *                 cannot carry.
 *   `CircuitMap`  a conventional flow-chart dialect, one graph, one path.
 *
 * None of the six can draw NESTING, and nesting is the content.
 *
 * THE RELATIONSHIP IS CONTAINMENT
 *
 *   Continuous Integration  ⊂  Continuous Delivery  ⊂  Continuous Deployment
 *
 * Each term is the previous one plus more automation. A candidate is judged
 * first on whether a viewer sees that without being told, and only then on
 * anything else.
 */

/** One stage of the pipeline the terms are measured against. */
export interface ReachStage {
  /** 1-based position, shown to the room. `PEDAGOGY` section 5's numbering. */
  n: number
  /** Two words at most: the label is set in caps and must not wrap. */
  label: string
  /** What the stage does, in plain words. Carries meaning, so never under 16px. */
  caption: string
}

/**
 * The tones a span may take, as ROLES rather than colours.
 *
 * A caller cannot pass a hex and therefore cannot reach a verdict hue at all,
 * which is the same guard `annotatedSurface.ts`'s `BOX_TONE` puts up and for the
 * same reason. None of these three terms is a failure or a warning, so green,
 * amber and red stay reserved for the meanings the room has been trained on all
 * session.
 *
 * `inner` -> `outer` is also a LUMINANCE ramp, teal to brand to deep navy, so
 * the three survive a greyscale projector as three different greys. That is a
 * belt-and-braces measure and not the primary one: every span additionally
 * carries its own name and its own visible reach, because colour is never
 * allowed to be the only distinguisher.
 */
export type ReachTone = 'inner' | 'middle' | 'outer'

export const REACH_PAINT: Record<ReachTone, string> = {
  inner: colors.teal,
  middle: colors.brand,
  outer: colors.brandDeep,
}

/** One named practice, and how far along the chain its automation reaches. */
export interface ReachTerm {
  /** The term, spelled out. Never an acronym on first meeting. */
  name: string
  /**
   * The 1-based stage its automation reaches THROUGH, inclusive.
   *
   * `reaches: 2` means stages 1 and 2 are automated and stage 3 is not. The
   * figure derives every span, marker and dim boundary from this one number, so
   * a candidate cannot disagree with another about where a term stops.
   */
  reaches: number
  /** One short line: what happens once the automation has got that far. */
  then: string
  /**
   * A HUMAN DECIDES AT THIS TERM'S BOUNDARY, AND THE FIGURE MUST DRAW IT.
   *
   * This flag is the second scored criterion of the lab and it was missing from
   * the first pass of the contract, which is exactly the omission the research
   * pass caught. Every source that defines the two CDs separates them on ONE
   * thing: "continuous delivery requires human intervention to approve
   * deployments into production; the deployment itself is then performed by
   * automation." Continuous deployment removes that step and nothing else.
   *
   * Span length alone cannot say it. On this five-stage chain "reaches 4" and
   * "reaches 5" is a true statement of the difference but it hides the WHY, and
   * the why is the teaching. So Continuous Delivery carries the marker at its
   * own stop and Continuous Deployment is drawn identically WITHOUT it, and the
   * contrast is one mark rather than one stage.
   *
   * It is drawn as `play` plus the word, never as a colour and never as an icon
   * alone: `play` is the glyph session 7 already uses for "a person presses the
   * final deploy button", so the room has met it.
   */
  approval?: boolean
  tone: ReachTone
}

export interface CicdReachProps {
  /** The chain, in order. Five is the geometry every candidate is built on. */
  stages: ReachStage[]
  /**
   * The terms, INNERMOST FIRST.
   *
   * The order is the containment order and every candidate reads it as such:
   * `NestedSpans` stacks the outermost bracket highest, `StopPoints` puts the
   * outermost badge on the top tier, `ThreeLanes` draws the innermost lane
   * first. A caller who shuffles this array is claiming a different
   * containment, which is a content error rather than a layout one.
   */
  terms: ReachTerm[]
  caption?: ReactNode
  className?: string
}

/* --------------------------------------------------------------------- *
 * THE CHAIN'S GEOMETRY, SHARED, AND STATED THE WAY `GateFlow` STATES ITS OWN.
 *
 * A fixed 1080px stage. Five slots of 180px on 225px centres, so the gaps are
 * 45px and every connector has room for its arrowhead. 1080 rather than
 * `SpineFlow`'s 1100 because the last slot must end ON the stage's right edge:
 * the outermost span reaches stage 5, and a span that stopped 20px short of the
 * frame would read as stopping short of the pipeline.
 *
 * A card is 74px tall and not `NodeShell`'s 106px floor, because these cards
 * carry no icon: a 17px label on 1.2 leading plus a 16px caption on 1.25 is
 * 42px of content, and 42 + 2 * 14px of the padding scale is 70. 74 gives the
 * caption a 2px cushion at either end. Every candidate imports `CHAIN` rather
 * than picking its own number, which is the drift `NodeShell.tsx` records
 * having found across six variants.
 * --------------------------------------------------------------------- */

export const CHAIN = {
  W: 1080,
  SLOT: 180,
  PITCH: 225,
  CARD_H: 74,
} as const

/** Left edge of the i-th slot, 0-based. */
export const slotLeft = (i: number) => i * CHAIN.PITCH

/** Right edge of the i-th slot, 0-based. */
export const slotRight = (i: number) => i * CHAIN.PITCH + CHAIN.SLOT

/**
 * Where a term's automation stops, in stage coordinates.
 *
 * The RIGHT EDGE of the last stage it covers, not the middle of the gap after
 * it. A boundary parked in the gap sits between two cards and has to be read as
 * belonging to the one on its left; a boundary flush with a card's edge belongs
 * to that card and to nothing else. For `reaches: 5` it lands on `CHAIN.W`,
 * which is why the stage is 1080 and not 1100.
 */
export const stopX = (reaches: number) => slotRight(Math.max(1, reaches) - 1)

/**
 * THE DECK'S STAGE NAMES ARE LOCAL, AND THE CHAIN IS NOT.
 *
 * The literature's canonical vocabulary is source -> build -> test -> release
 * -> production. Session 7's `1 FETCH`, `2 TEST`, `3 BUILD`, `4 PUSH`,
 * `5 DEPLOY` is one project's instance of that same chain: FETCH is source,
 * PUSH is release, DEPLOY is production. The deck's names stay, because the
 * room met them on `c2-our-pipeline` and content rule 24 forbids a second name
 * for a thing already named. A reader of this lab should know the figure is
 * conventional even though its labels are the project's own.
 */

/**
 * HOW MANY LINES A CONSEQUENCE LINE WILL TAKE, AND WHY THIS IS ESTIMATED.
 *
 * `NestedSpans` and `StopPoints` both position their bands absolutely, because
 * a bracket's arms have to run from one band's rail past every band below it to
 * the chain, which is geometry no flow layout expresses. Absolute positioning
 * means every band's height has to be known BEFORE anything renders, and the
 * height of wrapped text is not knowable before it renders.
 *
 * The first pass hard-coded two lines. Continuous Integration's line took
 * three, because it is the LONGEST of the three consequences and it lives in the
 * NARROWEST box in the figure: the innermost bracket spans two stages of five,
 * so it is 405px wide. The third line landed on top of the chain.
 *
 * `CH` is the measured average advance of this deck's 16px body face across
 * this fixture. `SLACK` is 1.3 and it is the part that matters: a greedy line
 * breaker leaves the tail of every line unused, so character count divided by
 * box width UNDER-counts, and under-counting is what put text on the chain.
 * Over-reserving costs vertical space in a figure that has some; under-reserving
 * ships an overlap that no harness in this repo can see, because `qa.mjs`,
 * `video-safe.mjs` and `align-check.mjs` all measure rectangles and two
 * rectangles are allowed to overlap.
 *
 * The right long-term answer is to measure after the first paint and lay out on
 * the second. That is a two-pass render for a figure that is otherwise static,
 * and it is not worth it until a candidate is chosen. If one of these two wins,
 * do it then, and delete this.
 */
const CH = 7.5
const SLACK = 1.3

export function estimateLines(text: string, width: number): number {
  return Math.max(1, Math.ceil((text.length * CH * SLACK) / Math.max(1, width)))
}
