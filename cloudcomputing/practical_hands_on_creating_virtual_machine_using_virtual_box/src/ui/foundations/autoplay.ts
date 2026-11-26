import { getAutoplayPref, subscribeAutoplayPref } from '@/deck/autoplayPref'

/**
 * AUTOPLAY FOR THIS DECK'S BUILT CARDS (user, 2026-10-07, for session 21;
 * carried to 22, 23 and 24; this file is session 23's, copied per
 * generate-slides section 2). In session 24 it is ON when slides 3, 4, 7, 13, 14, 15 and 21 open
 * (user, 2026-10-07, over the spec's rule 1). Slides 8, 11, 16 and 17 were
 * turned off on the user's word the same day; the tasks, the game and the
 * exit open off too. It paces at 2.5s per step (generate-slides section 2).
 *
 * Extends the archived Auto Play (`Outputs/python/workflow/archive/autoplay-player/`)
 * from a player-wide mode to a per-slide switch that lives in each card's own
 * `StepControls`, in the slot Replay had:
 *
 *   - ON BY DEFAULT on the slides in AUTOPLAY_ON_BY_DEFAULT only;
 *     every other slide opens off, in step-wise mode, and the student can turn
 *     it on with the button.
 *   - A switch the student presses is remembered for that slide while the
 *     deck stays open (never in storage: a `file://` origin is shared by every
 *     deck on the machine).
 *   - Off means step-wise: one step per Next or arrow press. A manual press
 *     while it runs pauses it on that slide; turning it back on resumes from
 *     the step on screen.
 *   - PACE: each step holds 2.5s from the moment it starts (STEP_MS); a step
 *     whose own motion runs longer holds until its visible text stops
 *     changing, plus HOLD_AFTER_MOTION_MS.
 *   - It never crosses to the next slide.
 *   - `?all` (every harness) and `?noauto` turn it off entirely, so nothing
 *     that counts presses or measures a frame sees a step it did not ask for.
 */

/**
 * Slides (1-based, deck order) that play their steps when they open, while the
 * deck's Auto-play setting is On (the slide menu, `@/deck/autoplayPref`, the
 * standing rule of 2026-10-12), and again on every re-entry (PF 30, user
 * 2026-10-12). PF 31's own list (SLIDE_WORKFLOW Stage 5: never copied from
 * another deck): the two hooks, the explainer and the concept cards whose
 * presses hold no vote; a card with a vote opens step-wise so the vote waits
 * for the room (the per-card switch beside Next still turns it on).
 *   4 H1 · 7 C1 · 8 C2 · 11 C5 · 12 C6 · 14 C8 · 21 H2 · 23 C13 · 24 C14 · 25 C15 · 26 E1 · 27 C16
 * plus 3 (the recap sort), 13 (C7) and 31 (K1) on the user's word (2026-10-13).
 */
export const AUTOPLAY_ON_BY_DEFAULT = new Set<number>([3, 4, 7, 8, 11, 12, 13, 14, 21, 23, 24, 25, 26, 27, 31])

/** The student's own switches, per slide, for as long as the deck is open. */
const chosen = new Map<number, boolean>()

export function autoplayDisabled(): boolean {
  if (typeof window === 'undefined') return true
  const q = new URLSearchParams(window.location.search)
  return q.has('all') || q.has('noauto')
}

export function autoplayDefault(slide: number): boolean {
  if (autoplayDisabled()) return false
  /* a listed slide starts again on EVERY entry while the deck's setting is On (user, 2026-10-12: "restart cleanly on every re-entry"); a switch pressed on it holds only while it stays on screen */
  if (getAutoplayPref() && AUTOPLAY_ON_BY_DEFAULT.has(slide)) return true
  return chosen.get(slide) ?? false
}

/* the deck-wide setting, once switched, wins over every per-slide press before it */
subscribeAutoplayPref(() => chosen.clear())

export function rememberAutoplay(slide: number, on: boolean) {
  chosen.set(slide, on)
}

/* ------------------------------------------------------------------ timing */

/** The first step waits for the slide's entrance; later steps for the step's own motion to start. */
export const ENTRANCE_MS = 1500
export const STEP_START_MS = 400
/**
 * PACE (user, 2026-10-07, generate-slides section 2, every deck from then on):
 * a step stays on screen 2.5s from the moment it starts. A step whose own
 * motion runs longer is held until the motion settles, plus a short beat.
 */
export const STEP_MS = 2500
export const HOLD_AFTER_MOTION_MS = 500
/** The step buttons' bottom edge above the frame's foot, px: low, clear of the player bar's row. */
export const CONTROLS_BOTTOM = 14
/** Polled until the visible text holds still for three polls, or this long. */
export const SETTLE_POLL_MS = 250
export const SETTLE_MAX_MS = 7000
/**
 * How much text a reader can see inside `root` right now. A text node counts
 * when every element above it, up to `root`, is at least half opaque and it
 * takes up space; anything under `[data-autoplay-ignore]` (the controls) is
 * left out. Code (`.font-mono`, `pre`, `code`) weighs 1.3.
 */
export function visibleText(root: Element): { chars: number; weighted: number } {
  const seen = new Map<Element, number>()
  const opacityOf = (el: Element | null): number => {
    if (!el || el === root.parentElement) return 1
    const hit = seen.get(el)
    if (hit !== undefined) return hit
    const own = Number(getComputedStyle(el).opacity) || 0
    const v = own * (el === root ? 1 : opacityOf(el.parentElement))
    seen.set(el, v)
    return v
  }
  let chars = 0
  let weighted = 0
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = (n.textContent ?? '').replace(/\s+/g, '')
    if (!text) continue
    const el = n.parentElement
    if (!el || el.closest('[data-autoplay-ignore]')) continue
    if (opacityOf(el) < 0.5) continue
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue
    chars += text.length
    weighted += text.length * (el.closest('.font-mono, pre, code') ? 1.3 : 1)
  }
  return { chars, weighted }
}

/** Off means step-wise: if the player's plain arrows were set to whole slides, set them back to steps. */
export function ensureStepMode() {
  const btn = document.querySelector<HTMLButtonElement>('button[aria-label^="Plain arrow keys currently move by whole slides"]')
  btn?.click()
}
