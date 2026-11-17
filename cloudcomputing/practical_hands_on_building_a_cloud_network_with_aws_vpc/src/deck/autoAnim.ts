import { useSyncExternalStore } from 'react'
import { detectView, isHarness } from './presenter'
import { revealAllSteps } from './animSteps'

/**
 * AUTO ANIMATION, ON OR OFF, FOR THE WHOLE DECK (user, 2026-11-03, Containers vs
 * Virtual Machines; session-local kit change, like `autoplayPref.ts`).
 *
 *   ON    every slide plays itself: the entrance layer brings each unit in on
 *         its own clock and every figure's build cycle runs on a timer, as the
 *         cloud computing decks have done since session 1.
 *   OFF   step-by-step reveal: nothing moves until the room asks. Each press of
 *         the plain forward arrow (the key, the bar's button, a swipe) plays the
 *         NEXT animation step: first the entrance units in reading order, then
 *         the figure's build, one state per press; the press after the last step
 *         goes to the next slide. Back undoes one step.
 *
 * THE DEFAULT IS THE VIEW'S: the presenter file opens with it ON, the student
 * file (the download, `?view=student`) with it OFF, and any phone or tablet with
 * it ON whatever the view (corrections G12). Either view can override it
 * with the bar's toggle or the `P` key at any time; the override is kept for the
 * browser session (`sessionStorage`), so a reload keeps it and a fresh open
 * returns to the view's default. Harness URLs (`?all`, `?still`, `?noauto`)
 * are always ON and never store anything: every check presses the plain arrow
 * and expects the next SLIDE.
 *
 * Toggling mid-slide keeps what is on screen: everything revealed so far
 * stays, and (`revealAllSteps`) the step registry treats the slide as complete,
 * so turning it OFF holds the figure at its full state and Back walks it
 * backwards, while turning it ON plays whatever had not entered yet and starts
 * the figure's timer from where it is.
 */

/** The pace of every auto animation, a little quicker than before (user, 2026-11-03: "increase slightly from the current speed"). Durations and periods are multiplied by it. */
export const SPEED = 0.85

const key = () => `deck:autoanim:${typeof location === 'undefined' ? '' : location.pathname}:${detectView()}`
let value: boolean | null = null
const subs = new Set<() => void>()

function read(): boolean {
  if (typeof window === 'undefined' || isHarness()) return true
  try {
    const v = sessionStorage.getItem(key())
    if (v === 'on') return true
    if (v === 'off') return false
  } catch {
    /* file:// with site data blocked: the view's default is the answer */
  }
  /* a phone or tablet, either view, opens with it ON (user, 2026-11-03 corrections, G12) */
  return detectView() === 'presenter' || isMobile()
}

/** A touch-first or phone-width screen. */
function isMobile(): boolean {
  try {
    return window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 820
  } catch {
    return false
  }
}

export function getAutoAnim(): boolean {
  if (value === null) value = read()
  return value
}

export function setAutoAnim(on: boolean) {
  if (isHarness() || on === getAutoAnim()) return
  value = on
  try {
    sessionStorage.setItem(key(), on ? 'on' : 'off')
  } catch {
    /* the setting still holds while the deck is open */
  }
  revealAllSteps()
  subs.forEach((fn) => fn())
}

export const toggleAutoAnim = () => setAutoAnim(!getAutoAnim())

export function subscribeAutoAnim(fn: () => void): () => void {
  subs.add(fn)
  return () => {
    subs.delete(fn)
  }
}

/** The setting, live: a component re-renders when it changes. */
export function useAutoAnim(): boolean {
  return useSyncExternalStore(subscribeAutoAnim, getAutoAnim, () => true)
}
