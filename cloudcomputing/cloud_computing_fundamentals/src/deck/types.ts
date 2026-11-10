import type { ReactNode } from 'react'
import type { SlideTransition } from '@/motion/presets'

/** One slide in a deck. */
export interface SlideDef {
  /** Stable id — also used as the URL hash target. */
  id: string
  /** The rendered slide element. */
  element: ReactNode
  /** How this slide enters/exits. Defaults to the deck's transition. */
  transition?: SlideTransition
  /** Optional section label, used to group slides in the progress rail. */
  section?: string
  /** Short human label for the overview grid / navigation. */
  label?: string
  /** Speaker notes (shown in the presenter overlay, press "N"). */
  notes?: string
}

/**
 * What a session may ask of the PLAYER, as opposed to of a slide.
 *
 * It rides on `DeckMeta` because that is the one session-owned object that
 * already reaches `Deck`: `App.tsx` is kit and identical in every session, so a
 * new prop there would be a kit change for every option a session wanted.
 */
export interface DeckPlayerOptions {
  /**
   * On a SMALL SCREEN (a phone, either way up), lay the control bar over the
   * stage and keep it hidden until it is asked for: a tap on the stage or a pull
   * up from the bottom edge shows it, a press on it or a few seconds of nothing
   * hides it again. Off, the bar keeps a strip of its own under the stage and
   * stays on screen. Desktop is the same either way. See `DeckControls`.
   */
  autoHideControls?: boolean
  /**
   * One extra control for the bar, drawn beside fullscreen. Build it from
   * `ControlButton` (exported by `DeckControls`) so it takes the bar's size and
   * its auto-hide timing with the rest.
   */
  extraControls?: ReactNode
  /**
   * EVERY MOVE IS A TRANSITION (Cloud Computing Fundamentals, 2026-10-15). No
   * cuts: the plain arrows, the picker and a held pair all play the deck's one
   * transition, and under `prefers-reduced-motion` every motion in the deck
   * becomes a plain fade.
   */
  smooth?: boolean
  /** The slide picker shows a live thumbnail of each slide, built in its final state. */
  thumbnails?: boolean
  /**
   * HIDE THE STEP/SLIDE SWITCH (Cloud Computing, 2026-10-23: every deck in that
   * course). These decks animate themselves: every slide reports 0 build steps
   * (`revealEveryStep`) and the entrances run on their own clock, so a switch
   * between "step" and "slide" picks between two identical moves. The button is
   * HIDDEN, never removed: the plain arrows stay in `slides` mode, `S` does
   * nothing, and the browser's remembered choice is ignored. `?nav=steps` on the
   * URL is still honoured, because the harnesses drive the deck with it.
   */
  hideModeSwitch?: boolean
}

export interface DeckMeta {
  title: string
  course?: string
  lesson?: string
  presenter?: string
  player?: DeckPlayerOptions
}

export interface DeckProps {
  slides: SlideDef[]
  meta?: DeckMeta
  /** Default slide transition when a slide doesn't override it. */
  transition?: SlideTransition
}
