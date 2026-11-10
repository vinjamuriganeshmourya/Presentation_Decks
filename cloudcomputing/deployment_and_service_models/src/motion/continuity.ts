/**
 * CONTINUITY — which parts of a slide were already on screen a moment ago.
 *
 * THE PROBLEM THIS SOLVES
 *
 * A concept runs across several slides, and every one of them repeats the
 * concept's name in its kicker. The deck remounts a slide on navigation, so each
 * slide replayed its whole entrance: the accent rail, the kicker and the title
 * all animated in again. Advancing through four slides of one concept meant
 * watching the SAME kicker fly in from the left four times, while the only thing
 * that had actually changed was the body.
 *
 * That reads as four separate slides about four things, rather than one concept
 * being developed. It also draws the room's eye to the header at exactly the
 * moment they should be reading the new content.
 *
 * THE RULE
 *
 * A part that is unchanged from the previous slide does not animate. A part that
 * changed does. So within one concept the kicker sits perfectly still while the
 * title and the body animate, and the concept name only moves when the concept
 * itself changes.
 *
 * HOW IT DECIDES, WITHOUT ANY EXTRA AUTHORING
 *
 * Nothing is added to a deck to make this work. `computeContinuity` reads the two
 * `SlideDef`s directly:
 *
 *   1. Same slide FAMILY? Each light, header-bearing content slide type declares
 *      `family = 'content'` on itself (see `SLIDE_FAMILY`), and the dark chrome
 *      types declare nothing. So `ContentSlide -> ContentNoteSlide` is continuous
 *      and `SectionBreakerSlide -> ContentSlide` is not.
 *
 *      Comparing the component identity instead was the first attempt and it was
 *      too strict: real decks alternate `ContentSlide` and `ContentNoteSlide`
 *      inside one concept, so the kicker re-animated at every switch, which is
 *      the exact thing this is here to stop.
 *   2. Same `section`? Two content slides in different concepts are a real
 *      change of subject and get the full transition.
 *   3. Then, per part, is the VALUE identical? Compared as authored, so a kicker
 *      of the same string carries and a changed title does not.
 *
 * Anything that is not a plain string or number compares false and therefore
 * animates. Failing toward "animate" is the safe direction: a part that animates
 * when it did not need to is a small redundancy, whereas a part held static when
 * it should have changed would silently show the previous slide's text.
 */

import { createContext, useContext, isValidElement } from 'react'
import type { ReactNode } from 'react'
import type { SlideDef } from '@/deck/types'

/**
 * Marks a slide type as part of the light, header-bearing content family, which
 * is the set of layouts that can flow into one another inside a concept.
 *
 * Declared ON the component rather than listed here, so a new content layout opts
 * in at the point it is written and cannot be forgotten by someone editing a list
 * in another file:
 *
 *     export function MyContentSlide(...) { ... }
 *     MyContentSlide.family = SLIDE_FAMILY.content
 *
 * The dark chrome types (welcome, dividers, practice, feedback, thank you)
 * deliberately declare nothing: each is a single frame, so there is never a
 * previous slide of the same family to carry anything over from.
 */
export const SLIDE_FAMILY = { content: 'content' } as const
export type SlideFamily = (typeof SLIDE_FAMILY)[keyof typeof SLIDE_FAMILY]

export interface Continuity {
  /** True means: this part is unchanged from the previous slide, so hold it still. */
  kicker: boolean
  title: boolean
  lead: boolean
}

export const NO_CONTINUITY: Continuity = { kicker: false, title: false, lead: false }

export const ContinuityContext = createContext<Continuity>(NO_CONTINUITY)

/** What carried over from the previous slide. Read by `SlideHeader`. */
export const useContinuity = (): Continuity => useContext(ContinuityContext)

/** Identical as authored. Non-primitives always compare false, so they animate. */
function same(a: ReactNode, b: ReactNode): boolean {
  if (a === undefined || a === null) return false
  if (typeof a === 'string' || typeof a === 'number') return a === b
  return false
}

type WithHeaderProps = {
  kicker?: ReactNode
  title?: ReactNode
  lead?: ReactNode
}

/**
 * What the incoming slide shares with the outgoing one.
 *
 * `carry` is per-part continuity for `SlideHeader`. `held` is true when the two
 * slides are the same type in the same section, which is also the signal the deck
 * uses to suppress the whole-slide transition: a slide-level push with a static
 * header inside it would slide the "still" part across the screen.
 */
export function computeContinuity(
  prev: SlideDef | undefined,
  next: SlideDef | undefined,
): { carry: Continuity; held: boolean } {
  if (!prev || !next || prev === next) return { carry: NO_CONTINUITY, held: false }
  if (!isValidElement(prev.element) || !isValidElement(next.element)) {
    return { carry: NO_CONTINUITY, held: false }
  }
  const family = (prev.element.type as { family?: SlideFamily }).family
  const nextFamily = (next.element.type as { family?: SlideFamily }).family
  if (!family || family !== nextFamily) return { carry: NO_CONTINUITY, held: false }
  if (!prev.section || prev.section !== next.section) return { carry: NO_CONTINUITY, held: false }

  const a = prev.element.props as WithHeaderProps
  const b = next.element.props as WithHeaderProps
  return {
    held: true,
    carry: {
      kicker: same(a.kicker, b.kicker),
      title: same(a.title, b.title),
      lead: same(a.lead, b.lead),
    },
  }
}
