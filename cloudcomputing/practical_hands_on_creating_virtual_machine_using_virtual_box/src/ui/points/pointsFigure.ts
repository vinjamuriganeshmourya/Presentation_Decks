import type { ReactNode } from 'react'

/**
 * ONE CONTRACT FOR EVERY POINT-STATING FIGURE.
 *
 * Same principle as the sibling labs: it describes **meaning** and never
 * geometry. Picking a winner is a rename at the call site.
 *
 * WHY THIS LAB EXISTS, AND WHY IT IS THE MOST USEFUL ONE IN THE KIT
 *
 * Stating a short set of points is the single most frequent thing any deck in
 * this repo does. Every session has slides that say "three things are true here",
 * and every one of them currently reaches for a bullet list inside
 * `ContentSlide`, or for whichever bespoke component was written for the session
 * that first needed it. That is the opposite of the kit's own rule, and it shows:
 * a bullet list is not a figure, it is the absence of one.
 *
 * WHAT A BULLET LIST GETS WRONG, SPECIFICALLY
 *
 *   1. **Equal weight for unequal points.** Four bullets say the four are peers.
 *      Most sets have a lead, and the list flattens it.
 *   2. **No claim, no reason.** A stated point is a CLAIM plus the one line that
 *      earns it. A bullet holds one string, so authors either state the claim and
 *      lose the reason, or write a sentence too long to read from the back.
 *   3. **No structure to reveal.** A list either arrives whole or fades in, and
 *      neither is the same as an instructor arriving at a point.
 *   4. **It invites two ideas per bullet**, which is the hard rule this repo
 *      breaks most often. A geometry with a fixed label width makes the second
 *      idea not fit, which is the only enforcement that has ever worked.
 *
 * So the unit of this contract is a POINT, and a point is a claim, a reason, and
 * optionally the word it is about. Not a string.
 *
 * WHY `term` IS ON THE CONTRACT
 *
 * Roughly half the point sets in this course are "a word, and what it means":
 * image, container, volume, port. The other half are plain claims. A contract that
 * carried only a label would push every author to fold the term into the claim
 * ("An image is a recipe, not a running thing"), and the set then has no scannable
 * left edge. Carrying it separately lets a variant align the terms and lets a
 * variant that has no room for them ignore the field.
 */

/**
 * What a point IS, in paint. Never decoration: a tone is a claim about the point.
 *
 * `risk` is the one that earns the field. A points slide that states three
 * neutral facts and one trap must not draw the trap like a fact, and the
 * alternative, an author reaching for red directly, is how a deck ends up with
 * four different reds.
 */
export type PointTone = 'neutral' | 'good' | 'risk' | 'lead'

export interface StatedPoint {
  id: string
  /**
   * The claim, in a handful of words. NOT a sentence, and the resolver says so
   * when it is one: a claim the room cannot hold in one glance is a paragraph
   * that has been given a bullet.
   */
  label: string
  /** The one line that earns the claim. */
  body?: ReactNode
  /** The word this point is about, when it has one. Aligned by some variants. */
  term?: string
  /**
   * The tone's word, in THIS deck's language.
   *
   * `pointsChrome` carries a default word per tone, and those defaults were written
   * against the lab's own fixture: `risk` says "the usual trap". Session 1 v3 used
   * `risk` for a problem that is LATER rather than dangerous, and the figure called
   * it a trap on the slide. A tone is a claim about the point, and the exact words
   * of that claim belong to the author, not to the ramp.
   */
  tag?: string
  /** A name from the kit's icon set. */
  icon?: string
  tone?: PointTone
  /**
   * The aside the presenter reaches for when asked. Hover only, and never the
   * teaching: the room cannot hover a projector.
   */
  detail?: ReactNode
}

export interface PointsFigureProps {
  /** What the set is about. Optional, because most slides have a title already. */
  title?: string
  points: StatedPoint[]
  caption?: ReactNode
  className?: string
}

export interface ResolvedPoints {
  points: StatedPoint[]
  /** Longest label and body, in characters. Every variant sizes from these. */
  maxLabel: number
  maxBody: number
  maxTerm: number
  /** True when every point carries a `term`, which some variants require. */
  allTermed: boolean
  /** True when every point carries a `body`. */
  allReasoned: boolean
  problems: string[]
}

/** Bodies may be `ReactNode`, and a node cannot be measured. Assume the worst. */
const NODE_CHARS = 150

const chars = (n: ReactNode | undefined): number =>
  n === undefined || n === null ? 0 : typeof n === 'string' ? n.length : NODE_CHARS

/**
 * Resolve once, so the variants disagree about geometry only.
 *
 * Every check here is an authoring mistake that renders as something PLAUSIBLE,
 * which is the only kind worth checking. A slide with seven points draws seven
 * points; it just cannot be read from the back of a room, and nothing about the
 * output says so. The sibling labs learned this the expensive way: a figure that
 * looks right and teaches something false is worse than a figure that refuses.
 */
export function resolvePoints({ points }: Pick<PointsFigureProps, 'points'>): ResolvedPoints {
  const problems: string[] = []

  if (points.length === 0) problems.push('no points, so there is nothing to state')
  /*
    SIX IS THE CAP, AND IT IS A TEACHING NUMBER RATHER THAN A GEOMETRIC ONE.

    Every variant here can physically draw eight. None of them can be READ at
    eight from the back of a room in the time an instructor spends on one slide,
    and the deck's own rule is one idea per slide. Past six the honest edit is two
    slides, so the figure says that instead of shrinking its own type.
  */
  if (points.length > 6) {
    problems.push(`${points.length} points; past six this is a handout, so it is two slides`)
  }

  const seen = new Set<string>()
  for (const [i, p] of points.entries()) {
    if (seen.has(p.label)) problems.push(`point ${i + 1} repeats the label "${p.label}"`)
    seen.add(p.label)

    if (p.label.length > 52) {
      problems.push(
        `point ${i + 1}'s label is ${p.label.length} characters; a claim the room can hold is about 52`,
      )
    }
    /* A full stop means a sentence, and a sentence in the label means the reason
       has been folded into the claim. That is the two-ideas-per-bullet failure
       arriving through the front door. */
    if (/[.]\s*$/.test(p.label)) {
      problems.push(`point ${i + 1}'s label ends in a full stop, so it is a sentence and not a claim`)
    }
    if (chars(p.body) > 150) {
      problems.push(`point ${i + 1}'s reason is ${chars(p.body)} characters; one line is about 150`)
    }
  }

  const termed = points.filter((p) => p.term).length
  const reasoned = points.filter((p) => p.body).length
  /*
    A HALF-FILLED FIELD IS THE MISTAKE, NOT AN EMPTY ONE.

    Four points where two carry a reason and two do not reads as an edit somebody
    abandoned, and every variant here has to leave a hole for the missing half.
    All or none, and the resolver will not guess which was intended.
  */
  if (reasoned > 0 && reasoned < points.length) {
    problems.push(`${reasoned} of ${points.length} points carry a reason; a set is all or none`)
  }
  if (termed > 0 && termed < points.length) {
    problems.push(`${termed} of ${points.length} points carry a term; a set is all or none`)
  }

  return {
    points,
    maxLabel: Math.max(0, ...points.map((p) => p.label.length)),
    maxBody: Math.max(0, ...points.map((p) => chars(p.body))),
    maxTerm: Math.max(0, ...points.map((p) => (p.term ?? '').length)),
    allTermed: points.length > 0 && termed === points.length,
    allReasoned: points.length > 0 && reasoned === points.length,
    problems,
  }
}
