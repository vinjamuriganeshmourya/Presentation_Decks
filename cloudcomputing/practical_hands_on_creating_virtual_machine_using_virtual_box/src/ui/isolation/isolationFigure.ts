import type { IconName } from '@/ui/icons'

/**
 * THE SHARED CONTRACT FOR EVERY CANDIDATE IN THIS LAB.
 *
 * All four figures take these identical props, so swapping one for another in a
 * deck is a rename and nothing else. `flow-lab` established that pattern with
 * `flowFigure.ts`, `comparison-lab` repeated it with `compareFigure.ts`, and it
 * is the thing that makes choosing a winner cheap: the gallery renders the same
 * fixture four times and the only variable is the drawing.
 *
 * WHAT AN ISOLATION FIGURE IS FOR
 *
 * ONE artefact exists on exactly ONE machine, and the other machines that would
 * want it cannot get it. That is the argument on session 6 slide 8
 * (`c1-and-nowhere-else`), and the kit has nothing that makes it:
 *
 *   - `FanOut` argues the OPPOSITE. One source, many live copies. Drawn on this
 *     slide it asserts that the three other machines DO have the image, which is
 *     the claim the slide exists to deny. Its `live?: boolean` per-copy flag is
 *     "running versus stopped", not "cannot reach", so dimming the copies does
 *     not rescue it: a stopped container is still a container that exists.
 *   - `MachineBoundary` takes only `className`. It is hardcoded to session 1's
 *     browser and two dev servers and cannot carry any other content.
 *   - `BoundaryBridge` needs a hub between two machines and draws what
 *     successfully CROSSES. Here nothing crosses and there is no hub yet: the
 *     registry is the next concept, and drawing it here opens problem 2 before
 *     problem 1 is closed.
 *
 * THE HONESTY REQUIREMENT (content rule 8)
 *
 * The figure must assert that the copies DO NOT EXIST. A viewer who reads it as
 * "three machines have it, dimly" is looking at a figure that lies, and that is
 * the one test every candidate here is judged on. Three drawing devices are
 * allowed and a candidate may combine them: a connector that is visibly severed
 * or barred, a boundary that visibly CONTAINS the artefact, and a recipient
 * drawn as an empty frame rather than as a filled card at reduced opacity.
 *
 * `opacity` alone is forbidden. It is the one device that reads as "present but
 * unimportant", which is exactly the misreading.
 */

/** The thing that exists in one place. */
export interface IsolationArtefact {
  /** What it is, in two or three words. */
  label: string
  /** Its name or tag, where one earns its place. Set in mono by every candidate. */
  ref?: string
  icon?: IconName
}

/** The one machine that has it. */
export interface IsolationHolder {
  label: string
  /** WHERE on that machine it sits. The slide's whole lead is this phrase. */
  note?: string
  icon?: IconName
}

/**
 * A machine that would want the artefact and does not have it.
 *
 * `cannot` is the verb phrase WITHOUT its negation: the figure owns the word
 * "cannot", because a figure whose rows each carry their own negation reads as
 * four unrelated complaints rather than as one boundary. It is also what lets a
 * candidate print the negation once, as a column heading or as a barrier label,
 * instead of three times.
 */
export interface IsolationRecipient {
  id: string
  /** The machine. A noun phrase, not a sentence. */
  label: string
  /** What it cannot do with the artefact: `run it`, `test it`. No "cannot". */
  cannot: string
  /** One short clause on why, where it adds something the label does not. */
  note?: string
  icon?: IconName
}

export interface IsolationFigureProps {
  artefact: IsolationArtefact
  holder: IsolationHolder
  recipients: IsolationRecipient[]
  /**
   * The negation, printed ONCE by the figure.
   *
   * Defaults to `cannot`. A deck whose argument is "not yet" rather than "not
   * ever" passes its own word, and the figure never invents one, because the
   * strength of the claim is the author's to make and not the drawing's.
   */
  negation?: string
  /**
   * Drawing width in px.
   *
   * The default is 552 and not a full slide's 900, for the reason `FanOut`'s
   * `size` prop records in its own header: at 900px a figure beside a
   * four-point column squeezed the column to about 150px, wrapped every point to
   * five lines, printed the first over the title and ran the last off the frame.
   * Every candidate here is designed at 552 first, because that is the width it
   * will really have on `c1-and-nowhere-else`.
   */
  width?: number
  className?: string
}

/**
 * Every candidate's default: half the content well, less half the 40px gap.
 *
 * The well is 1152px wide, so an even split is 556 a side. 552 leaves 4px, which
 * is the rounding a figure should give away rather than take.
 *
 * IT WAS 460 FOR THE FIRST RENDER, on the 1.4fr / 1fr split `ContentSlide` uses
 * when it is handed both `points` and `children`. That split is right for a
 * figure of tiles and wrong for this family, because every candidate here has to
 * print a MACHINE NAME and a VERB PHRASE on one row: at 460 the verb phrase went
 * to three lines and the first pass "solved" it by setting figure text at 11px,
 * which is the defect the review caught. The width moved and the type did not
 * shrink. See `MIN_TEXT_PX`.
 */
export const HALF_WIDTH = 552

/**
 * THE TYPE FLOOR, AND IT IS NOT NEGOTIABLE PER FIGURE.
 *
 * `tailwind.config.ts`'s smallest body step is `body-sm` at 16px. Nothing inside
 * a figure in this family carries meaning below it.
 *
 * WHY IT IS WRITTEN DOWN HERE. The first pass of all four candidates set machine
 * names at 15px, verb phrases at 11.5px and the slide's own conclusion at 13px,
 * and the review's verdict was that the concept's punchline had become the
 * SMALLEST text on the frame. A deck is read from the back of a room and again,
 * alone, from a recording. So the rule is that the figure fits the type, and a
 * candidate that cannot fit its labels at 16px at half-slide width has found
 * something out about itself: that goes in its "worst at" entry and is never
 * rescued by shrinking the type.
 *
 * Two consequences worth knowing before designing a fifth candidate:
 *
 *   - THE SLIDE'S CONCLUSION IS NOT THE FIGURE'S CAPTION. This contract
 *     deliberately has no `caption`. A caption is the last thing laid out and
 *     the first thing squeezed, and the sentence the whole slide exists for
 *     ended up there at 13px. It belongs to the slide, as a lead, a callout or a
 *     point.
 *   - Several figures already in the kit are below this floor: `FanOut` sets
 *     copy notes at 11.5px, `MachineBoundary` uses `text-xs`. That is a
 *     pre-existing repo-wide problem this lab did not create and cannot fix from
 *     here; it is recorded in this lab's CLAUDE.md.
 */
export const MIN_TEXT_PX = 16
