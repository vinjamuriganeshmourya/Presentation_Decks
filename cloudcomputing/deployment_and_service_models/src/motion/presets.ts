import type { Variants, Transition } from 'framer-motion'
import { easing } from '@/design/tokens'

/**
 * Shared Framer Motion presets.
 *
 * Two layers of animation power the "dynamic effects":
 *   1. Slide transitions   — how a whole slide enters/exits (deck level)
 *   2. Element reveals      — how content staggers in within a slide
 */

/* ------------------------------------------------------------------ */
/* 1. SLIDE TRANSITIONS                                                */
/* ------------------------------------------------------------------ */

export type SlideTransition =
  | 'slide'
  | 'glide'
  | 'fade'
  | 'zoom'
  | 'rise'
  | 'cover'
  | 'flip'
  | 'none'

/**
 * What a slide transition is told about the move: its direction (+1 when
 * advancing, -1 when going back) and whether it is a CUT (the plain arrows in
 * "slide" mode, the picker, Replay). A bare number is still accepted, as the
 * direction of a move that is not a cut.
 */
export type SlideMove = number | { dir: number; cut?: boolean }

const dirOf = (m: SlideMove) => (typeof m === 'number' ? m : m.dir)
const isCut = (m: SlideMove) => typeof m !== 'number' && !!m.cut

export const slideTransition: Transition = {
  duration: 0.6,
  ease: easing.soft,
}

const INSTANT: Transition = { duration: 0 }

/*
  THE CUT HAS A REAL EXIT, AND EVERY EXIT CARRIES ITS OWN TIMING.

  The `none` variant used to be `{ enter: {}, center: {}, exit: {} }`. An exit
  with nothing to animate never reports itself finished to `AnimatePresence`,
  so the slide that left was never unmounted: in "slide" mode every press laid
  the next slide over the ones before it, and a leftover caught mid-fade showed
  as a dark or blank frame (user, 2026-10-06, Python 19 and 20: "when I switch
  to slide mode … sometimes it just shows black screen and sometimes it
  overlaps the content"). Every variant now ends on a real value, and a cut
  leaves by going to opacity 0 at once.

  The timing rides on the variant, read from `custom` at the moment the slide
  leaves, because `AnimatePresence` keeps a departing slide's LAST props: its
  `transition` prop is the one it arrived with, so a slide that came in by an
  animated move and left by a cut used to fade out for 0.6s under the new one.
*/
function base(kind: SlideTransition) {
  switch (kind) {
    case 'fade':
      return {
        enter: () => ({ opacity: 0 }),
        center: () => ({ opacity: 1 }),
        exit: () => ({ opacity: 0 }),
      }
    case 'zoom':
      return {
        enter: () => ({ opacity: 0, scale: 1.06 }),
        center: () => ({ opacity: 1, scale: 1 }),
        exit: () => ({ opacity: 0, scale: 0.96 }),
      }
    case 'rise':
      return {
        enter: () => ({ opacity: 0, y: 60 }),
        center: () => ({ opacity: 1, y: 0 }),
        exit: () => ({ opacity: 0, y: -60 }),
      }
    case 'cover':
      return {
        enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%' }),
        center: () => ({ x: 0, opacity: 1 }),
        exit: (dir: number) => ({ x: dir > 0 ? '-30%' : '30%', opacity: 0.4 }),
      }
    case 'flip':
      return {
        enter: (dir: number) => ({ opacity: 0, rotateY: dir > 0 ? 35 : -35 }),
        center: () => ({ opacity: 1, rotateY: 0 }),
        exit: (dir: number) => ({ opacity: 0, rotateY: dir > 0 ? -35 : 35 }),
      }
    case 'none':
      return {
        enter: () => ({ opacity: 1 }),
        center: () => ({ opacity: 1 }),
        exit: () => ({ opacity: 0 }),
      }
    /*
      GLIDE (Cloud Computing Fundamentals, review 2026-10-16: "remove the
      jitter between slides"; session-local change to a kit file). The same
      move as 'slide', fade plus a sideways drift, but written as a literal
      `transform` string, because framer-motion 11 hands only `opacity` and
      `transform` to the compositor (WAAPI). 'slide' animates `x`, which runs
      on the main thread: the frame a heavy slide mounts in stalls it, and the
      stall shows as a jerk. Here a stalled main thread cannot touch the
      movement. 60px instead of 120: half the travel, the same direction.
    */
    case 'glide':
      return {
        enter: (dir: number) => ({ opacity: 0, transform: `translateX(${dir > 0 ? 60 : -60}px)` }),
        center: () => ({ opacity: 1, transform: 'translateX(0px)' }),
        exit: (dir: number) => ({ opacity: 0, transform: `translateX(${dir > 0 ? -60 : 60}px)` }),
      }
    case 'slide':
    default:
      return {
        enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 120 : -120 }),
        center: () => ({ opacity: 1, x: 0 }),
        exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -120 : 120 }),
      }
  }
}

/** The whole-slide variants for a transition. Pass `{ dir, cut }` as `custom`. */
export function slideVariants(kind: SlideTransition): Variants {
  const v = base(kind)
  return {
    /* a cut lands where the slide rests: no offset, fully opaque */
    enter: (m: SlideMove) => (isCut(m) ? { ...v.center(), transition: INSTANT } : v.enter(dirOf(m))),
    center: (m: SlideMove) => ({ ...v.center(), transition: isCut(m) ? INSTANT : slideTransition }),
    exit: (m: SlideMove) => (isCut(m) ? { opacity: 0, transition: INSTANT } : { ...v.exit(dirOf(m)), transition: slideTransition }),
  }
}

/* ------------------------------------------------------------------ */
/* 2. ELEMENT REVEALS (in-slide, staggered)                            */
/* ------------------------------------------------------------------ */

export type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade'

const offset = 26

export function revealVariants(dir: RevealDirection = 'up', duration = 0.55): Variants {
  const from: Record<RevealDirection, { x?: number; y?: number; scale?: number }> = {
    up: { y: offset },
    down: { y: -offset },
    left: { x: offset },
    right: { x: -offset },
    scale: { scale: 0.9 },
    fade: {},
  }
  return {
    hidden: { opacity: 0, ...from[dir] },
    show: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      // duration 0 → the element snaps to its final state (used for instant,
      // no-animation slide jumps like Ctrl+←/→).
      transition: { duration, ease: easing.soft },
    },
  }
}

/** Parent container that staggers its children's reveals. */
export function staggerContainer(stagger = 0.09, delayChildren = 0.12): Variants {
  return {
    hidden: {},
    show: {
      transition: { staggerChildren: stagger, delayChildren },
    },
  }
}
