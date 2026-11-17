import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useDeck } from '@/deck/DeckContext'
import { useAutoplayPref } from '@/deck/autoplayPref'
import { Press } from './motion'
import { keyFree } from './keys'
import {
  AUTOPLAY_ON_BY_DEFAULT,
  CONTROLS_BOTTOM,
  ENTRANCE_MS,
  SETTLE_MAX_MS,
  SETTLE_POLL_MS,
  STEP_START_MS,
  autoplayDefault,
  autoplayDisabled,
  ensureStepMode,
  HOLD_AFTER_MOTION_MS,
  STEP_MS,
  rememberAutoplay,
  visibleText,
} from './autoplay'

/**
 * The Python course's step controls (`PanelButton`, `StepControls`, `useVoteKeys`),
 * the evolved form of `src/ui/panels/beats.tsx`. Carried from session to session
 * since Python 16 and folded into the kit from session 31 on 2026-10-14.
 *
 * WHY. Review, 2026-10-01: "when all steps are complete, the button beside
 * Replay still looks active". The kit's disabled Next is the same brand blue
 * at 40% opacity, which from the back of a room reads as a paler live button.
 * Here a disabled step button turns grey (surface, muted text, no shadow).
 * Replay's slot now holds the Autoplay switch (2026-10-07, see StepControls).
 *
 * Every button answers the press (`Press`), as the rest of the deck's
 * controls do.
 */
const HOUSE = 'cubic-bezier(0.22, 1, 0.36, 1)'

export function PanelButton({
  children,
  onClick,
  disabled = false,
  ghost = false,
  on,
  label,
  round = false,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  ghost?: boolean
  /** an icon-only round button (Autoplay) */
  round?: boolean
  /** A switch: `true` draws it lit (brand tint and ring), `false` as the ghost. */
  on?: boolean
  label?: string
}) {
  const look = disabled
    ? { background: colors.surface2, color: colors.muted, boxShadow: `inset 0 0 0 1px ${colors.line}` }
    : on === true
      ? { background: colors.surface2, color: colors.brandDark, boxShadow: `inset 0 0 0 2px ${colors.brand}` }
      : ghost || on === false
      ? { background: 'rgba(255,255,255,0.85)', color: colors.muted, boxShadow: `inset 0 0 0 1px ${colors.muted}40` }
      : { background: colors.brand, color: colors.white, boxShadow: '0 6px 18px -8px rgba(0,37,75,0.35)' }
  return (
    <Press>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={on}
        aria-label={label}
        title={label ? 'Autoplay' : undefined}
        /* the deck's arrow keys must not also fire a focused button */
        onKeyDown={(e) => e.key !== 'Enter' && e.key !== ' ' && e.currentTarget.blur()}
        className={`inline-flex items-center justify-center rounded-pill font-body text-[14px] font-semibold leading-none disabled:cursor-default ${round ? 'h-[34px] w-[34px]' : 'h-[34px] gap-1.5 px-4'}`}
        style={{ ...look, transition: `background-color 300ms ${HOUSE}, color 300ms ${HOUSE}, box-shadow 300ms ${HOUSE}` }}
      >
        {children}
      </button>
    </Press>
  )
}

/** The switch's glyph: a play triangle while off (press to play), two bars while on (press to pause). */
function AutoGlyph({ on }: { on: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
      {on ? (
        <g fill="currentColor">
          <rect x="5" y="4" width="5" height="16" rx="1.5" />
          <rect x="14" y="4" width="5" height="16" rx="1.5" />
        </g>
      ) : (
        <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z" fill="currentColor" />
      )}
    </svg>
  )
}

/**
 * Next and Autoplay, centred on one fixed line at the foot of the slide,
 * placed from the bottom of `ZonedFrame`'s body box (y 709) so their bottom
 * edge is always y 680. Next is the deck's own `next()`.
 *
 * AUTOPLAY TOOK REPLAY'S SLOT (user, 2026-10-07): the same pill, the same size
 * and place. It is a switch that says its state in words, `Autoplay On` lit
 * with a brand ring, `Autoplay Off` as the quiet ghost, and its glyph is what
 * a press will do. While it is on, the card plays its own steps with a
 * reading-time pause after each one (`autoplay.ts`); while it is off, the
 * card is step-wise. A manual press while it runs pauses it; pressing the
 * switch again resumes from the step on screen. It never leaves the slide.
 * Replay itself is still the player's own ⟳ button and the R key.
 */
export function StepControls({
  at,
  first = 1,
  total,
  nextLabel = 'Next',
}: {
  /** The beat on screen now. */
  at: number
  /** 1 for `useBeats`, 0 for `useCount`. */
  first?: 0 | 1
  total: number
  nextLabel?: string
}) {
  const deck = useDeck()
  /* the engine reads the deck through a ref: a new context object on a render must not restart its clock */
  const deckRef = useRef(deck)
  deckRef.current = deck
  const done = at >= total
  const slide = deck.index + 1
  const rootRef = useRef<HTMLDivElement>(null)
  /* End shows the whole card at once (the spec's build contract 3): as many
     presses as the card has left. A ref, so the listener is bound once and
     always reads the beat on screen now. */
  const left = useRef(total - at)
  left.current = total - at
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'End' || !keyFree(e)) return
      e.preventDefault()
      for (let i = 0; i < left.current; i++) deck.next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [deck])

  /* ---- autoplay ---- */
  const [on, setOn] = useState(() => autoplayDefault(slide))
  /** The step autoplay itself asked for; any other change of step was a person. */
  const expected = useRef<number | null>(null)
  const lastAt = useRef(at)
  /** Weighted visible text when the last step settled: the next step's reading time counts only what is new. */
  const baseline = useRef(0)
  /** The first wait on a card is the slide's entrance; after a resume it is a short one. */
  const fresh = useRef(true)

  const measure = useCallback(() => {
    const root = rootRef.current?.closest('[data-spec]') ?? rootRef.current?.parentElement
    return root ? visibleText(root) : { chars: 0, weighted: 0 }
  }, [])

  /* AN AUTOPLAY SLIDE STARTS FROM THE TOP ON EVERY ENTRY (user, 2026-10-12, PF 30: "restart
     cleanly on every re-entry, forward or back"). A whole-slide move (a plain arrow back, a
     Ctrl+arrow, a swipe) lands the card fully revealed by the player's own design: the step
     jumps from the first to the last in one change right after the mount. That is not a
     press, so it is not a pause either: the card is wound back to its first step through
     the deck's own prev(), one step at a time in the same tick, and the run then starts as
     on any fresh entry. (The player's Replay was tried first: a replay inside a cut landing
     left a stale copy of the card on screen.) Never under `?all` or `?noauto`, so the
     harnesses keep their revealed landings. */
  const landed = useRef(Date.now())
  const pref = useAutoplayPref()
  const restarts = pref && AUTOPLAY_ON_BY_DEFAULT.has(slide) && !autoplayDisabled()
  useEffect(() => {
    if (lastAt.current === at) return
    const was = lastAt.current
    lastAt.current = at
    const mine = expected.current === at
    expected.current = null
    if (mine) return
    if (restarts && was === first && at === total && total > first && Date.now() - landed.current < 1500) {
      expected.current = first /* the rewind is ours, not a press */
      for (let i = at; i > first; i--) deckRef.current.prev()
      return
    }
    if (on) setOn(false) /* a person pressed: pause here, step-wise */
  }, [at, on, restarts, first, total])

  useEffect(() => {
    if (!on || done || autoplayDisabled()) return
    let cancelled = false
    const timers: number[] = []
    const wait = (ms: number) => new Promise<void>((res) => timers.push(window.setTimeout(res, ms)))
    const run = async () => {
      /* PACE (generate-slides section 2): a step holds 2.5s from the moment it
         starts; a step whose own motion runs longer holds until its visible
         text has stopped changing, plus a short beat. */
      const began = Date.now()
      await wait(fresh.current && at === first ? ENTRANCE_MS : STEP_START_MS)
      fresh.current = false
      let last = measure()
      let lastChange = Date.now()
      let still = 0
      while (!cancelled && still < 3 && Date.now() - began < SETTLE_MAX_MS) {
        await wait(SETTLE_POLL_MS)
        const now = measure()
        if (now.weighted === last.weighted) still++
        else {
          still = 0
          last = now
          lastChange = Date.now()
        }
      }
      if (cancelled) return
      baseline.current = last.weighted
      const until = Math.max(began + STEP_MS, lastChange + HOLD_AFTER_MOTION_MS)
      await wait(Math.max(0, until - Date.now()))
      if (cancelled) return
      expected.current = at + 1
      deckRef.current.next()
    }
    void run()
    return () => {
      cancelled = true
      timers.forEach((t) => window.clearTimeout(t))
    }
  }, [on, at, done, first, measure])

  /* THE SLIDE MENU'S AUTO-PLAY SETTING (2026-10-12, PF 29) takes effect on the slide
     on screen the moment it is switched: On starts a listed slide from the
     step on screen, Off pauses it; a slide the deck does not list is
     step-wise either way. The first render only reads it. */
  const lastPref = useRef(pref)
  useEffect(() => {
    if (lastPref.current === pref) return
    lastPref.current = pref
    const want = pref && AUTOPLAY_ON_BY_DEFAULT.has(slide) && !autoplayDisabled()
    if (want === on) return
    if (want) {
      baseline.current = measure().weighted
      fresh.current = false
    } else ensureStepMode()
    setOn(want)
  }, [pref, on, slide, measure])

  const toggle = () => {
    const nextOn = !on
    rememberAutoplay(slide, nextOn)
    if (nextOn) {
      /* resume from the step on screen: what is already shown has been read */
      baseline.current = measure().weighted
      fresh.current = false
    } else ensureStepMode()
    setOn(nextOn)
  }

  return (
    <div ref={rootRef} data-autoplay-ignore className="absolute inset-x-0 z-20 flex justify-center gap-2" style={{ bottom: CONTROLS_BOTTOM }}>
      <PanelButton onClick={deck.next} disabled={done}>
        {nextLabel}
      </PanelButton>
      <PanelButton round on={on} onClick={toggle} label={on ? 'Autoplay: on. Press to pause and go step by step' : 'Autoplay: off. Press to play the steps by themselves'}>
        <AutoGlyph on={on} />
      </PanelButton>
    </div>
  )
}

/**
 * Keys 1 to n mark the room's choice on a vote (G1's must line: "Keys 1 to
 * 4, or a click, may mark the room's choice. The right arrow works with or
 * without a mark."). Off once the answer is shown, and while the marker is
 * open, whose tools are the same digits.
 */
export function useVoteKeys(n: number, onPick: (i: number) => void, enabled: boolean) {
  const pick = useRef(onPick)
  pick.current = onPick
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if (!keyFree(e)) return
      const k = Number(e.key)
      if (Number.isInteger(k) && k >= 1 && k <= n) {
        e.preventDefault()
        pick.current(k - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [n, enabled])
}
