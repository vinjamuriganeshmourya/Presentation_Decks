import { useEffect, useRef } from 'react'

/**
 * TOUCHPAD AND TOUCH NAVIGATION, beside the keyboard.
 *
 * WHY. The deck moved only from the keyboard (user, 2026-10-05, for every deck
 * from now on). An instructor on a laptop swipes the trackpad; a reviewer on a
 * phone swipes the screen. Both now do what the PLAIN arrow keys do, in
 * whichever mode the pill shows: whole slides by default, build steps after
 * `S`. `Deck.tsx` passes the same pair `useKeyboardNav` binds to the arrows, so
 * the three ways the deck moves can never disagree.
 *
 * TOUCHPAD. A `wheel` event whose horizontal delta dominates its vertical one.
 * The deltas of one gesture accumulate; at `WHEEL_TRIGGER` the deck moves ONCE
 * and the gesture is locked until no horizontal wheel has arrived for
 * `WHEEL_IDLE` ms AND `WHEEL_COOLDOWN` ms have passed. A trackpad keeps sending
 * a decaying tail after the fingers lift (inertia), and without the lock that
 * tail was a second slide. The event is cancelled, so the browser cannot read a
 * horizontal swipe as history navigation; `src/index.css` switches that gesture
 * off at the root as well, because Chromium starts it before the first wheel
 * event reaches the page. A vertical wheel is never touched. A wheel over an
 * element that can itself scroll sideways (a wide code panel) is left to it.
 *
 * TOUCH. One finger, start to end: `SWIPE_MIN` px sideways, more than
 * `SWIPE_RATIO` times the vertical travel, inside `SWIPE_TIME` ms. Left is
 * next, right is previous. One gesture, one slide, by construction. A tap, a
 * vertical scroll, a two-finger touch, and anything that starts on a control
 * (a button, a slider, a field, a link) or over an element that scrolls
 * sideways are ignored, so a slide's own panels keep their touches.
 *
 * `enabled` is false while something else owns the surface: the slide picker,
 * and the marker while it is armed (the ink layer takes the pointer then).
 *
 * The thresholds were set on Python session 17 and checked on its built file
 * from `file://`: a 12-event trackpad burst with a 5-event tail moves exactly
 * one slide; a 400px swipe moves one; a tap, a vertical scroll and a swipe that
 * starts on the slide's slider or on an option move nothing.
 */
const WHEEL_TRIGGER = 60
const WHEEL_IDLE = 300
const WHEEL_COOLDOWN = 650
const SWIPE_MIN = 60
const SWIPE_RATIO = 1.5
const SWIPE_TIME = 800

/** Elements a gesture must never start on. */
const CONTROL = 'button, input, select, textarea, a, [role="button"], [role="slider"], [contenteditable="true"]'

interface Handlers {
  /** What a swipe forward does: the plain arrow's binding, not a fixed one. */
  fwd: () => void
  back: () => void
  enabled?: boolean
}

/** True when `el` or an ancestor can scroll horizontally on its own. */
function scrollsSideways(el: Element | null): boolean {
  for (let n = el; n && n !== document.body; n = n.parentElement) {
    const h = n as HTMLElement
    if (h.scrollWidth > h.clientWidth + 1) {
      const o = getComputedStyle(h).overflowX
      if (o === 'auto' || o === 'scroll') return true
    }
  }
  return false
}

export function useGestureNav(h: Handlers) {
  /* The handlers change identity on every render; the listeners are bound once
     and read the latest pair through a ref, so a gesture never calls a stale
     closure and the listeners are not re-bound sixty times a minute. */
  const latest = useRef(h)
  latest.current = h

  useEffect(() => {
    /* A session that still carries its own copy of this (Python 17's
       `src/decks/figures/gestures.ts`, written before the kit had it) checks
       this flag and stands down, so a sync never leaves two listeners moving
       two slides per swipe. */
    ;(window as unknown as Record<string, unknown>).__deckGestureNav = true

    let acc = 0
    let locked = false
    let firedAt = 0
    let idle: number | undefined
    const onWheel = (e: WheelEvent) => {
      if (latest.current.enabled === false) return
      if (e.ctrlKey) return // pinch zoom
      const dx = e.deltaX
      const dy = e.deltaY
      if (Math.abs(dx) <= Math.abs(dy)) return // a vertical scroll: not ours
      if (scrollsSideways(e.target as Element)) return
      e.preventDefault()
      window.clearTimeout(idle)
      idle = window.setTimeout(() => {
        acc = 0
        if (Date.now() - firedAt >= WHEEL_COOLDOWN) locked = false
      }, WHEEL_IDLE)
      if (locked) {
        if (Date.now() - firedAt >= WHEEL_COOLDOWN) locked = false
        else return
      }
      acc += dx
      if (Math.abs(acc) >= WHEEL_TRIGGER) {
        if (acc > 0) latest.current.fwd()
        else latest.current.back()
        acc = 0
        locked = true
        firedAt = Date.now()
      }
    }

    let start: { x: number; y: number; t: number } | null = null
    const onStart = (e: TouchEvent) => {
      start = null
      if (latest.current.enabled === false) return
      if (e.touches.length !== 1) return
      const t = e.target as Element | null
      if (t && (t.closest(CONTROL) || scrollsSideways(t))) return
      const p = e.touches[0]
      start = { x: p.clientX, y: p.clientY, t: Date.now() }
    }
    const onEnd = (e: TouchEvent) => {
      const s = start
      start = null
      if (!s || e.touches.length > 0) return
      const p = e.changedTouches[0]
      if (!p) return
      const dx = p.clientX - s.x
      const dy = p.clientY - s.y
      if (Date.now() - s.t > SWIPE_TIME) return
      if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) <= Math.abs(dy) * SWIPE_RATIO) return
      if (dx < 0) latest.current.fwd()
      else latest.current.back()
    }
    const onCancel = () => {
      start = null
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    window.addEventListener('touchcancel', onCancel, { passive: true })
    return () => {
      window.clearTimeout(idle)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onCancel)
    }
  }, [])
}
