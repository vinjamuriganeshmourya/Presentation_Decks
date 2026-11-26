import { isValidElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SectionBreakerSlide } from '@/slides'
import type { DeckSegment } from './DeckContext'
import { AnimatePresence, MotionConfig, PresenceContext, motion, useReducedMotion } from 'framer-motion'
import type { DeckProps } from './types'
import { DeckContext } from './DeckContext'
import { SlideStage } from './SlideStage'
import { ProgressBar } from './ProgressBar'
import { DeckControls } from './DeckControls'
import {
  initialArrowMode,
  rememberArrowMode,
  useKeyboardNav,
  type ArrowMode,
} from './useKeyboardNav'
import { SlidePicker } from './SlidePicker'
import { useAnnotate } from './annotate/useAnnotate'
import { AnnotationLayer } from './annotate/AnnotationLayer'
import { AnnotationToolbar } from './annotate/AnnotationToolbar'
import { useFullscreen } from './useFullscreen'
import { useGestureNav } from './useGestureNav'
import { slideVariants, slideTransition, type SlideTransition } from '@/motion/presets'
import { Stepper } from '@/motion/Stepper'
import { InstantContext } from '@/motion/instant'
import { ContinuityContext, computeContinuity, NO_CONTINUITY } from '@/motion/continuity'
import { usePresenterState, detectView, downloadStudent, type DeckView } from './presenter'
import { SlideMenu } from './SlideMenu'
import { EditLayer } from './EditLayer'
import { FileSaveBadge } from './FileSaveBadge'
import { canSaveFile } from './fileSave'
import { useComments } from './comments'
import { CommentsPanel } from './CommentsPanel'
import { isHarness } from './presenter'

function hashIndex(total: number): number {
  if (typeof window === 'undefined') return 0
  const m = window.location.hash.match(/#\/(\d+)/)
  if (!m) return 0
  const n = Number(m[1]) - 1
  return Math.min(Math.max(n, 0), total - 1)
}

/**
 * A full-page deck: the slide fills the viewport edge-to-edge (no padding or
 * letterbox chrome). Kept on top: the progress bar, the slide counter, the ◀ ▶
 * arrows, a jump-to-slide button, the arrow-key mode pill, and a fullscreen
 * toggle.
 *
 * NAVIGATION
 *
 *   →  /  ←        whole slide as a cut, or one build step: whichever the mode
 *                  pill says. `S` swaps the pair, and the choice is remembered
 *                  per browser.
 *   Ctrl+→ / ←     the other one of the pair
 *   PageDown / Up  the same as the plain arrows, because that is what a clicker
 *                  sends and a clicker cannot send Ctrl
 *   G              jump to a slide, by name or number
 *   R              replay this slide from the top of its build
 *   M              the marker: draw on the slide (see `annotate/`)
 *
 * ON A PHONE the control bar is re-laid for a thumb and, if the session asks
 * (`meta.player.autoHideControls`), hides until a tap on the stage or a pull up
 * from the bottom edge brings it back. See `DeckControls`.
 *
 * Speaker notes and click-to-advance are still intentionally omitted.
 */
export function Deck({ slides, meta, transition = 'slide' }: DeckProps) {
  /*
    TWO VIEWS, ONE DECK (2026-10-22, session-local; `presenter.ts` says why).
    The presenter may skip, delete and re-word slides; those choices are
    remembered per deck, and the ACTIVE list below is what every piece of
    navigation in this file runs over: the counter, the hash, the progress
    bar, the picker's jump, the menu, `__DECK__`. The full `slides` list is
    only ever handed to the picker, which shows the skipped ones marked and
    keeps the deleted ones restorable. The student file is the same player
    reading an injected state and drawing none of the three controls.
  */
  const title = meta?.title ?? 'deck'
  const [view] = useState<DeckView>(detectView)
  const presenter = view === 'presenter'
  const [pst, actions] = usePresenterState(title, view)
  const skipped = useMemo(() => new Set(pst.skipped), [pst.skipped])
  const deleted = useMemo(() => new Set(pst.deleted), [pst.deleted])
  const active = useMemo(() => slides.filter((s) => !deleted.has(s.id) && !skipped.has(s.id)), [slides, skipped, deleted])
  const edited = useMemo(() => new Set(Object.keys(pst.edits)), [pst.edits])
  const total = active.length
  const rootRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(() => hashIndex(total))
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [direction, setDirection] = useState(1)
  const [step, setStepState] = useState(0) // current fragment within the slide
  const [maxStep, setMaxStep] = useState(0) // total fragments in the slide
  /*
    `cut` skips the slide-to-slide transition and nothing else.

    It replaced a flag called `instant` that did two jobs at once: skip the
    transition AND mount the slide with every animation already finished. Now
    that the plain arrows cut, that second job would have switched off every
    entrance in the deck. Arriving with the build already revealed is handled
    separately, by `pendingFull` below.
  */
  const [cut, setCut] = useState(false)
  /*
    REPLAY: A COUNTER, BECAUSE THE THING BEING ASKED FOR IS A REMOUNT.

    "Play this slide again" is not a navigation, so none of the machinery above
    expresses it: `index` does not change, and every animation in the deck is a
    Framer `animate` that has already reached its target. Nothing replays an
    animation that is already finished; the only thing that does is mounting the
    subtree afresh.

    So the counter is folded into the `key` of the slide's motion element. React
    then tears the old slide down and builds a new one, every `Reveal` and `Step`
    starts from `hidden` again, and the build plays exactly as it did on arrival.

    A boolean would not work: the second press has to be distinguishable from the
    first, and a flag that has to be set and then cleared in an effect is a
    remount that fires twice.
  */
  const [replay, setReplay] = useState(0)
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(rootRef)
  /*
    WHAT THE SESSION ASKED OF THE PLAYER. `meta` is the one session-owned object
    that reaches this component, so the player's options ride on it rather than
    on a prop that `App.tsx` (kit, identical in every session) would have to pass.
  */
  const player = meta?.player

  /*
    WHAT THE PLAIN ARROWS DO, AND WHERE THE PICKER LIVES.

    The mode is initialised from the URL, then the harness flag, then this
    browser's last choice, then the default: see `initialArrowMode`. It is
    remembered on change rather than in an effect, so a render can never write it.

    With the switch hidden (`player.hideModeSwitch`, see `types.ts`) the saved
    choice is skipped and the toggle is a no-op, so the bar button, the `S` key
    and another deck's leftover `localStorage` can none of them move it.
  */
  const modeLocked = !!player?.hideModeSwitch
  const [arrowMode, setArrowMode] = useState<ArrowMode>(() => initialArrowMode(!modeLocked))
  const [pickerOpen, setPickerOpen] = useState(false)

  const toggleArrowMode = useCallback(() => {
    if (modeLocked) return
    setArrowMode((m) => {
      const nextMode: ArrowMode = m === 'slides' ? 'steps' : 'slides'
      rememberArrowMode(nextMode)
      return nextMode
    })
  }, [modeLocked])

  const openPicker = useCallback(() => setPickerOpen(true), [])
  const closePicker = useCallback(() => setPickerOpen(false), [])

  // Refs mirror state so nav callbacks read the latest values without stale closures.
  const stepRef = useRef(0)
  const maxRef = useRef(0)
  const indexRef = useRef(index)
  const pendingFull = useRef(false) // when entering a slide fully-built, reveal all
  indexRef.current = index

  const setStep = useCallback((n: number) => {
    stepRef.current = n
    setStepState(n)
  }, [])

  // Reported by <Stepper> once the active slide has registered its fragments.
  const onMax = useCallback(
    (m: number) => {
      maxRef.current = m
      setMaxStep(m)
      if (pendingFull.current) {
        pendingFull.current = false
        setStep(m)
      }
    },
    [setStep],
  )

  /*
    EVERY MOVE IS ANNOUNCED ON `window` AS `deck:navigate`, for whatever a session
    wants to hang on it (a sound, a log, a presenter display) without reaching
    into this file: `detail` is `{ kind: 'slide' | 'step' | 'replay', dir }`.
    Dispatched from the action and not from an effect, so a listener hears it in
    the same tick as the press, and only for a move that happens: a press on the
    last slide's forward arrow announces nothing.
  */
  const announce = useCallback((kind: 'slide' | 'step' | 'replay', dir: 1 | -1 | 0) => {
    window.dispatchEvent(new CustomEvent('deck:navigate', { detail: { kind, dir } }))
  }, [])

  /*
    WHICH SLIDE IS ON SCREEN, BY ID. `index` is a position in the active list,
    and that list changes under it when the presenter skips or deletes from
    the picker. The id is what must not change: a skip of slide 3 while slide
    9 is up renumbers 9 to 8 and the deck stays on it (the effect below); a
    skip of the slide on screen moves to the next active one.
  */
  const idRef = useRef<string | undefined>(active[index]?.id)
  const activeRef = useRef(active)
  activeRef.current = active

  const gotoSlide = useCallback(
    (i: number, dir: number, opts: { cut?: boolean } = {}) => {
      const clamped = Math.min(Math.max(i, 0), total - 1)
      idRef.current = activeRef.current[clamped]?.id
      setDirection(dir)
      setCut(opts.cut ?? false)
      setIndex(clamped)
      maxRef.current = 0
      setMaxStep(0)
      setStep(0)
      if (clamped !== indexRef.current) announce('slide', dir < 0 ? -1 : 1)
    },
    [total, setStep, announce],
  )

  useEffect(() => {
    const id = idRef.current
    if (id === undefined) return
    const at = active.findIndex((s) => s.id === id)
    if (at === indexRef.current) return
    if (at >= 0) {
      /* the same slide at a new number: no transition, the key is its id */
      setIndex(at)
      return
    }
    /* the slide on screen was skipped or deleted: the nearest following active slide, else the last */
    const was = slides.findIndex((s) => s.id === id)
    let to = active.findIndex((s) => slides.indexOf(s) > was)
    if (to < 0) to = active.length - 1
    if (to < 0) return
    idRef.current = active[to].id
    pendingFull.current = true
    setDirection(1)
    setCut(false)
    setIndex(to)
    maxRef.current = 0
    setMaxStep(0)
    setStep(0)
  }, [active, slides, setStep])

  // "Next" (Ctrl+→): reveal the next fragment, or advance to the next slide with
  // the deck's transition.
  const next = useCallback(() => {
    if (stepRef.current < maxRef.current) {
      setStep(stepRef.current + 1)
      announce('step', 1)
    } else if (indexRef.current < total - 1) gotoSlide(indexRef.current + 1, 1)
  }, [total, gotoSlide, setStep, announce])

  // "Prev" (Ctrl+←): hide the last fragment, or go back a slide with the
  // transition, landing revealed.
  const prev = useCallback(() => {
    if (stepRef.current > 0) {
      setStep(stepRef.current - 1)
      announce('step', -1)
    } else if (indexRef.current > 0) {
      pendingFull.current = true
      gotoSlide(indexRef.current - 1, -1)
    }
  }, [gotoSlide, setStep, announce])

  // "Prev slide" (←): one slide back as a cut, landing with the build already
  // revealed. This is the key that gets tapped while presenting.
  const prevSlide = useCallback(() => {
    if (indexRef.current > 0) {
      pendingFull.current = true
      gotoSlide(indexRef.current - 1, -1, { cut: true })
    }
  }, [gotoSlide])

  // "Next slide" (→): mirror of prevSlide — one slide forward as a cut, skipping
  // the build steps and landing revealed.
  const nextSlide = useCallback(() => {
    if (indexRef.current < total - 1) {
      pendingFull.current = true
      gotoSlide(indexRef.current + 1, 1, { cut: true })
    }
  }, [total, gotoSlide])

  /*
    REPLAY THE CURRENT SLIDE, AS A CUT, FROM STEP ZERO.

    Three things have to happen together, and leaving any one of them out gives a
    replay that is visibly not a replay:

      `setCut(true)`   no slide-to-slide transition. The slide is not arriving from
                       anywhere, so pushing it in from the right would be a lie
                       about what just happened, and it would play the transition
                       while the build underneath restarts.
      step back to 0   the build is the animation. Remounting at the step the
                       presenter had reached would replay the entrance and then
                       snap every fragment straight back on.
      bump `replay`    the remount itself. See the counter's comment above.

    `maxRef` is cleared too, because the new subtree re-registers its fragments and
    a stale maximum would let `next` fall through to the following slide on the
    first press after a replay.
  */
  const replaySlide = useCallback(() => {
    setCut(true)
    maxRef.current = 0
    setMaxStep(0)
    setStep(0)
    setReplay((n) => n + 1)
    announce('replay', 0)
  }, [setStep, announce])

  const goTo = useCallback(
    (i: number) => gotoSlide(i, i >= indexRef.current ? 1 : -1),
    [gotoSlide],
  )

  /* the original words come back by remounting the slide, which is what replay already does */
  const resetText = useCallback(
    (id: string) => {
      actions.resetEdits(id)
      if (id === idRef.current) replaySlide()
    },
    [actions, replaySlide],
  )

  // React to browser back/forward (hash changes).
  useEffect(() => {
    const onHash = () => {
      const target = hashIndex(total)
      gotoSlide(target, target >= indexRef.current ? 1 : -1)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [total, gotoSlide])

  // Reflect current slide in the URL hash (its number in the ACTIVE deck).
  useEffect(() => {
    const id = active[index]?.id ?? String(index + 1)
    window.history.replaceState(null, '', `#/${index + 1}${id ? `-${id}` : ''}`)
  }, [index, active])

  /*
    THE DECK'S OWN TABLE OF CONTENTS, PUBLISHED ON `window`.

    Read by the review app (`review.mjs`), which frames this deck and needs to
    know what it is looking at: the slide ids in order, so a comment can be filed
    against `why-layers` rather than against "slide 14" and survive a slide being
    inserted above it.

    It is published from HERE, at runtime, rather than derived by a tool reading
    `src/decks/<session>Deck.tsx`, because the deck file is a TypeScript module
    whose slide list is assembled by hand and sometimes conditionally. The only
    thing that knows the real order is the running deck. A regex over the source
    would be wrong the first time somebody wrote `...moreSlides` into the array.

    Harmless in a shipped deck — an object on `window` that nothing reads — so it
    is not gated behind a flag. Keeping it ungated is the point: a review build and
    the deck an instructor opens stay the same code path.
  */
  useEffect(() => {
    ;(window as unknown as Record<string, unknown>).__DECK__ = {
      total,
      current: index + 1,
      /* the active deck, numbered as the counter numbers it; `all` is the full list for a reader that wants it */
      slides: active.map((s, i) => ({
        n: i + 1,
        id: s.id,
        label: s.label ?? null,
        section: s.section ?? null,
      })),
      all: slides.map((s, i) => ({ n: i + 1, id: s.id, label: s.label ?? null, section: s.section ?? null })),
      view,
      skipped: pst.skipped,
      deleted: pst.deleted,
    }
  }, [slides, active, total, index, view, pst.skipped, pst.deleted])

  /*
    THE MARKER, KEYED BY SLIDE.

    Ink belongs to the slide it was drawn on, so the store is per slide and the key
    is the slide's own id: an instructor who circles a term, jumps to slide 30 to
    answer a question and comes back finds the circle still round the term. That is
    the behaviour a whiteboard has and it is the one presenters expect; ink that
    evaporates on navigation is the single commonest complaint about the annotation
    tools in the video-call products.

    It falls back to the index for a deck whose slides have no ids, which only the
    labs have, so the feature still works there rather than putting every slide's
    ink in one bucket.
  */
  const slideKey = active[index]?.id ?? String(index)
  const ann = useAnnotate(slideKey, step)

  /*
    THE TRACKPAD AND THE TOUCH SCREEN PRESS THE PLAIN ARROWS. The same pair the
    keyboard binds, so the mode pill governs all three. Off while the picker is
    open (it owns the surface) and while the marker is armed (a finger on the
    ink layer is a stroke, not a swipe). From kit branch `kit/deck-gestures`,
    folded into the kit on 2026-10-14; the sessions' `figures/gestures.ts` stands
    down when this hook has mounted.
  */
  /* off while editing text too: a drag across a word being selected is not a swipe */
  useGestureNav({
    fwd: arrowMode === 'steps' ? next : nextSlide,
    back: arrowMode === 'steps' ? prev : prevSlide,
    enabled: !pickerOpen && !ann.active && !menuOpen && !editing,
  })

  /*
    THE PICKER OWNS THE ARROW KEYS WHILE IT IS OPEN.

    Both this and the picker listen on `window`, so without the flag an arrow press
    would move the picker's cursor AND change the slide behind it, and the deck
    would be somewhere else by the time the presenter pressed Enter.
  */
  useKeyboardNav({
    next,
    prev,
    prevSlide,
    nextSlide,
    arrowMode,
    toggleArrowMode,
    openPicker,
    replay: replaySlide,
    ann,
    /* the menu owns Up, Down, Enter and Escape while it is open, like the picker owns the arrows */
    enabled: !pickerOpen && !menuOpen,
  })

  /*
    A JUMP FROM THE PICKER LANDS FULLY REVEALED, like the plain-arrow cut does.

    Anything else would be a trap: the presenter jumps to slide 12 to answer a
    question and gets its first build step, so the slide they wanted to show is
    two thirds absent and they have to guess how many presses it takes to restore
    it in front of the room.
  */
  const pickSlide = useCallback(
    (i: number) => {
      setPickerOpen(false)
      if (i === indexRef.current) return
      pendingFull.current = true
      gotoSlide(i, i >= indexRef.current ? 1 : -1, { cut: true })
    },
    [gotoSlide],
  )

  /*
    A SKIPPED CARD PRESSED IN THE PICKER UNSKIPS THE SLIDE AND GOES TO IT: the
    press says "I want this one after all". The new active list is computed
    here, in the same handler, because `gotoSlide` clamps against the active
    total of the render it was made in, which does not yet know the slide.
  */
  const showSlide = useCallback(
    (id: string) => {
      const nextSkipped = new Set(skipped)
      nextSkipped.delete(id)
      const nextActive = slides.filter((s) => !deleted.has(s.id) && !nextSkipped.has(s.id))
      const i = nextActive.findIndex((s) => s.id === id)
      if (i < 0) return
      actions.toggleSkip(id)
      setPickerOpen(false)
      pendingFull.current = true
      idRef.current = id
      setDirection(1)
      setCut(true)
      setIndex(i)
      maxRef.current = 0
      setMaxStep(0)
      setStep(0)
      announce('slide', 1)
    },
    [skipped, deleted, slides, actions, setStep, announce],
  )

  /* a skip or a delete may never empty the deck */
  const canDrop = useCallback((id: string) => active.length > 1 || !active.some((s) => s.id === id), [active])

  const toggleMenu = useCallback(() => setMenuOpen((o) => !o), [])
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  /* a jump from the list lands fully revealed and plays the deck's transition */
  const pickFromMenu = useCallback(
    (i: number) => {
      setMenuOpen(false)
      if (i === indexRef.current) return
      pendingFull.current = true
      gotoSlide(i, i >= indexRef.current ? 1 : -1)
    },
    [gotoSlide],
  )
  const toggleEditing = useCallback(() => setEditing((e) => !e), [])

  /*
    UNDO AND REDO FOR TEXT EDITS (2026-10-27): Ctrl+Z, and Ctrl+Y or Ctrl+Shift+Z (Cmd on a Mac).
    Presenter view only, and never while the marker is open (its own undo has the key then) or in a
    real text field (the comments box keeps the browser's undo). Captured before the browser's own
    contenteditable undo, which knew nothing of the saved edits and fought them.
  */
  const annActive = ann.active
  useEffect(() => {
    if (!presenter) return
    const onKey = (e: KeyboardEvent) => {
      if (annActive || !(e.ctrlKey || e.metaKey) || e.altKey) return
      const k = e.key.toLowerCase()
      const isUndo = k === 'z' && !e.shiftKey
      const isRedo = k === 'y' || (k === 'z' && e.shiftKey)
      if (!isUndo && !isRedo) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
      if (isUndo ? actions.undo() : actions.redo()) e.preventDefault()
      else if (t?.isContentEditable) e.preventDefault()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [presenter, annActive, actions])
  const download = useCallback(() => downloadStudent(title, pst), [title, pst])

  /*
    COMMENTS (2026-10-26, session-local trial; `comments.ts`, `CommentsPanel.tsx`).
    Presenter view only: the student view gets no list, no button and no panel,
    and the student download never carries them (they are not in `pst`). The
    panel sits BESIDE the stage, so the slide fits the room left and nothing on
    it is covered; it is never shown in fullscreen, and reappears on leaving it.
    Whether it was open is remembered per browser; harness URLs never open it.
  */
  const [threads, commentAuthor, commentActions] = useComments(title, presenter)
  const [commentsOpen, setCommentsOpen] = useState<boolean>(() => {
    if (!presenter || isHarness()) return false
    try {
      return window.localStorage.getItem('nxtwave.deck.comments-open') === '1'
    } catch {
      return false
    }
  })
  const [composing, setComposing] = useState(false)
  const toggleComments = useCallback(() => {
    setCommentsOpen((o) => {
      const v = !o
      if (!isHarness()) {
        try {
          window.localStorage.setItem('nxtwave.deck.comments-open', v ? '1' : '0')
        } catch {
          /* ignore */
        }
      }
      if (!v) setComposing(false)
      return v
    })
  }, [])
  const openCount = presenter ? threads.filter((t) => t.slideId === active[index]?.id && !t.resolved).length : 0
  const [smallScreen, setSmallScreen] = useState(() => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 900px)').matches)
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(max-width: 900px)')
    const on = () => setSmallScreen(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  const showComments = presenter && commentsOpen && !isFullscreen
  /* Google Slides' shortcut, Ctrl+Alt+M: open the panel with a new comment on this slide */
  useEffect(() => {
    if (!presenter) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'm' && e.ctrlKey && e.altKey && !isFullscreen) {
        e.preventDefault()
        setCommentsOpen(true)
        setComposing(true)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [presenter, isFullscreen])

  /*
    THE SEGMENTS OF THE PROGRESS BAR (user, 2026-10-22): one per section
    breaker in the ACTIVE list, each covering the slides up to the next
    breaker (the last one takes the closing slides too), plus a small opening
    segment for the slides before the first breaker that lands on slide 1. A
    breaker is recognised by its element type, with the label as a fallback,
    so any deck built from the kit gets the bar with no configuration; a deck
    with no breakers is one segment. Read by `SectionBar` in every slide's foot.
  */
  const segments = useMemo<DeckSegment[]>(() => {
    const isBreaker = (s: (typeof active)[number]) =>
      (isValidElement(s.element) && s.element.type === SectionBreakerSlide) || s.label === 'Section divider'
    const breakers = active.map((s, i) => (isBreaker(s) ? i : -1)).filter((i) => i >= 0)
    if (!total) return []
    if (!breakers.length) return [{ name: meta?.title ?? 'Deck', start: 0, end: total - 1, target: 0, element: active[0]?.element }]
    const out: DeckSegment[] = []
    if (breakers[0] > 0) out.push({ name: 'Start', start: 0, end: breakers[0] - 1, target: 0, element: active[0]?.element })
    breakers.forEach((b, k) => {
      const end = k + 1 < breakers.length ? breakers[k + 1] - 1 : total - 1
      out.push({ name: active[b].section ?? `Section ${k + 1}`, start: b, end, target: b, element: active[b].element })
    })
    return out
  }, [active, total, meta])

  /* a press on a segment lands fully revealed, the picker's way */
  const jump = useCallback(
    (i: number) => {
      if (i === indexRef.current) return
      pendingFull.current = true
      gotoSlide(i, i >= indexRef.current ? 1 : -1, { cut: true })
    },
    [gotoSlide],
  )

  const ctx = useMemo(
    () => ({
      index,
      total,
      direction,
      goTo,
      next,
      prev,
      isFirst: index === 0,
      isLast: index === total - 1,
      segments,
      jump,
    }),
    [index, total, direction, goTo, next, prev, segments, jump],
  )

  const current = active[index]

  /*
    WHAT CARRIED OVER FROM THE OUTGOING SLIDE.

    Recomputed ONLY when `index` changes, and cached in a ref for the rest of the
    slide's life. That is load-bearing, not an optimisation.

    The first version derived this every render from a `prevIndexRef` updated in an
    effect. It looked right and was subtly broken: `Stepper` reports its step count
    on mount, which calls `setMaxStep`, which re-renders — and by then the effect
    had already moved the ref forward, so continuity collapsed to nothing, the
    header swapped its held parts back to animated ones, and React remounted them.
    A remounted `Reveal` starts from `hidden`, so the kicker animated in anyway,
    roughly 100ms late. The whole feature silently did nothing.

    Comparing against the cached index instead makes the pair (outgoing, incoming)
    a function of the navigation itself rather than of render timing, so it is also
    correct for hash jumps and the overview grid, not just the arrow keys.
  */
  const contRef = useRef({ index, replay, carry: NO_CONTINUITY, held: false })
  if (contRef.current.index !== index) {
    contRef.current = {
      index,
      replay,
      ...computeContinuity(active[contRef.current.index], current),
    }
  } else if (contRef.current.replay !== replay) {
    /*
      A REPLAY CARRIES NOTHING OVER, EVEN INSIDE A HELD PAIR.

      Continuity exists so that the second content slide of one concept does not
      restage a header the room is already reading. A replay is the opposite
      request: the presenter has asked to see the slide built again, and the header
      is part of what gets built. Left at the carried value the kicker and title
      would sit still while the body rebuilt underneath them, which reads as a
      glitch rather than as a replay.
    */
    contRef.current = { index, replay, carry: NO_CONTINUITY, held: false }
  }
  /* a smooth deck holds nothing over and cuts nothing: every move is the one transition */
  const smooth = !!player?.smooth
  /* under prefers-reduced-motion a smooth deck's transition is the plain fade, so nothing slides or snaps */
  const reduceMotion = useReducedMotion()
  const { carry, held } = smooth ? { carry: NO_CONTINUITY, held: false } : contRef.current

  /*
    Plain arrows jump a whole slide as a cut; Ctrl+arrows step the build and play
    the deck's transition when they cross a slide boundary.

    `held` also forces the cut. Two content slides in one concept are one idea
    being developed, so pushing the second one in from the right restages
    something the room is already looking at — and it would slide the static
    header across the screen, which is the opposite of holding it still.
  */
  const noCut = !smooth && (cut || held)
  const kind: SlideTransition = smooth ? (reduceMotion ? 'fade' : 'glide') : noCut ? 'none' : (current?.transition ?? transition)
  /* what the transition needs to know about this move: its direction, and whether it is a cut */
  const move = useMemo(() => ({ dir: direction, cut: noCut }), [direction, noCut])

  return (
    <DeckContext.Provider value={ctx}>
      <MotionConfig reducedMotion={smooth ? 'user' : 'never'}>
      {/*
        A FLEX COLUMN, so that on a phone the control bar can be a sibling BELOW
        the stage rather than a layer over it (see `DeckControls`, "SMALL
        SCREENS"). On a desktop the bar is absolute and the stage area is the
        whole player, exactly as before.
      */}
      <div ref={rootRef} className="relative flex h-full w-full flex-col overflow-hidden bg-[#060c1c]">
        <ProgressBar index={index} total={total} onDot={goTo} />

        {/*
          THE STAGE AREA. On a desktop this is the whole player and the bar lies
          over it. On a phone in `dock` mode the bar is a flex sibling below, so
          this box is what is left above it and `SlideStage` fits the slide into
          that; the bar never lies on the slide.
        */}
        {/* the stage and, beside it, the comments panel (presenter view, not fullscreen) */}
        <div className="relative flex min-h-0 flex-1">
        <div className="relative min-h-0 min-w-0 flex-1">
          <SlideStage flip={kind === 'flip'}>
            {/* `custom` reaches the slide that is LEAVING too, so it leaves the way this
                move asks (a cut, or the deck's transition), never the way it arrived.
                See `slideVariants`. */}
            <AnimatePresence initial={false} custom={move} mode="popLayout">
              <motion.div
                /* `replay` IS PART OF THE KEY. That is the whole mechanism: a new key
                   is a new subtree, and a new subtree animates in. */
                key={`${current?.id ?? index}#${replay}`}
                custom={move}
                variants={slideVariants(kind)}
                initial="enter"
                animate="center"
                exit="exit"
                transition={cut && !smooth ? { duration: 0 } : slideTransition}
                className="absolute inset-0"
                /*
                  `preserve-3d` ONLY FOR THE FLIP, AND THAT IS HALF THE BLUR FIX.

                  It used to be unconditional. Together with the `perspective` on
                  the stage wrapper it put every slide of every deck into a 3D
                  rendering context, and a 3D context is a promise to the
                  compositor that the subtree will be transformed in space: the
                  subtree gets flattened into a texture up front, and a texture
                  cannot be re-rasterised when an ancestor scales it. That is the
                  soft text, paid for on all 44 slides to support one transition no
                  shipping deck uses. `rotateY` is the only variant that needs it;
                  see `slideVariants`.
                */
                style={kind === 'flip' ? { transformStyle: 'preserve-3d' } : undefined}
              >
                {/*
                  NOT `landFull`. Landing a slide fully revealed means "do not wait
                  for clicks", not "do not animate": the plain arrows are now the
                  normal way through the deck, so feeding that flag into
                  InstantContext switched every entrance animation in the deck off.
                  Fragments still arrive built, because `pendingFull` sets the step
                  to the slide's maximum; what plays is each slide's own entrance.
                */}
                {/*
                  THE SLIDE'S INSIDE NEVER HOLDS UP THE SLIDE'S EXIT.

                  Without this, every motion element inside the slide joins the
                  deck-level `AnimatePresence`: a shared-layout element (`layoutId`)
                  or a nested presence waits for a hand-over that never comes when
                  its whole slide leaves, so the slide is never unmounted, and
                  `AnimatePresence` removes nothing until EVERY exit has finished.
                  One such slide and every slide after it stayed mounted, stacked
                  over the next (user, 2026-10-06, Python 19 and 20, "slide" mode:
                  black screens and overlapping content). `null` tells the inside
                  it is simply present; it unmounts with the slide. Exits INSIDE a
                  slide (its own `AnimatePresence`) are untouched.
                */}
                <PresenceContext.Provider value={null}>
                  <InstantContext.Provider value={false}>
                    <ContinuityContext.Provider value={carry}>
                      <Stepper step={step} onMax={onMax}>
                        {current?.element}
                      </Stepper>
                    </ContinuityContext.Provider>
                  </InstantContext.Provider>
                </PresenceContext.Provider>
                {/* LAST, so its layout effect sees the slide's committed DOM (see `EditLayer`) */}
                <EditLayer slideId={current?.id ?? String(index)} edits={pst.edits} editing={presenter && editing} onEdit={actions.setEdit} onRename={actions.renameEdit} />
              </motion.div>
            </AnimatePresence>

            {/*
              THE INK LIVES INSIDE THE STAGE AND OUTSIDE THE SLIDE.

              Inside the stage, because the stage is the 1280x720 box that gets
              scaled to the screen: an overlay in here shares the slide's coordinate
              system, so a circle drawn round a word in a window is still round that
              word on the projector and after a fullscreen toggle.

              Outside the slide's own motion element, because that element is keyed
              and gets replaced on every navigation AND on every replay. Ink mounted
              in there would be destroyed by the very key that replays the build, so
              pressing R would silently wipe the annotation the presenter had just
              drawn to explain the slide.

              MOUNTED WHILE THE MARKER IS OPEN *OR* THE SLIDE HAS INK, WHICH IS NOT
              THE SAME CONDITION AND THE DIFFERENCE IS THE FEATURE.

              An instructor draws on a build, puts the pen down, and advances the
              build. Gating the layer on `active` alone erases the drawing from the
              screen the moment they close the marker, so the annotation they made to
              explain the slide vanishes exactly when they start talking about it.
              Gating it on `hasInk` as well keeps the ink on the slide and lets the
              pen go away, which is what a whiteboard does.

              It is still ABSENT from the DOM in the case that matters for the
              harnesses: a deck nobody has drawn on. An inert full-stage overlay would
              be reported by `qa.mjs` as content that scrolls and by `video-safe.mjs`
              as covering the instructor video, on every slide of every deck, and
              `qa.mjs` never draws. The layer itself also drops `pointer-events` when
              the marker is closed, so ink on screen never eats a click.
            */}
            {(ann.active || ann.hasInk) && <AnnotationLayer ann={ann} />}
          </SlideStage>
        </div>
        {/* inside the root, so it still shows in fullscreen: is the open file holding the changes (`fileSave.ts`) */}
        {presenter && canSaveFile() && <FileSaveBadge />}
        {showComments && (
          <CommentsPanel
            slides={active}
            index={index}
            threads={threads}
            author={commentAuthor}
            actions={commentActions}
            composing={composing}
            setComposing={setComposing}
            onJump={goTo}
            onClose={toggleComments}
            overlay={smallScreen}
          />
        )}
        </div>

        <DeckControls
          index={index}
          total={total}
          step={step}
          maxStep={maxStep}
          isFirst={index === 0}
          isLast={index === total - 1}
          isFullscreen={isFullscreen}
          next={next}
          prev={prev}
          toggleFullscreen={toggleFullscreen}
          arrowMode={arrowMode}
          toggleArrowMode={toggleArrowMode}
          hideModeSwitch={modeLocked}
          openPicker={openPicker}
          replay={replaySlide}
          markerActive={ann.active}
          toggleMarker={ann.toggle}
          hasInk={ann.hasInk}
          mobile={player?.autoHideControls ? 'overlay' : 'dock'}
          enabled={!pickerOpen && !ann.active}
          extra={player?.extraControls}
          view={view}
          menuOpen={menuOpen}
          toggleMenu={toggleMenu}
          editing={presenter && editing}
          toggleEditing={toggleEditing}
          download={download}
          commentsOpen={showComments}
          toggleComments={isFullscreen ? undefined : toggleComments}
          commentCount={openCount}
        />

        {/* the slide list, above the bar; never in the DOM unless open (see `SlideMenu`) */}
        <AnimatePresence>
          {menuOpen && <SlideMenu slides={active} index={index} onPick={pickFromMenu} onClose={closeMenu} />}
        </AnimatePresence>

        {/*
          THE RAIL IS PRESENT WHILE THE MARKER IS OPEN *OR* THERE IS INK ANYWHERE IN
          THE SESSION.

          Not just while the marker is open, and not just while THIS slide has ink.
          Once anything has been drawn, the presenter owns a drawing they need to be
          able to reach: hide it, undo it, erase it, or pick the pen back up. A
          control that disappears the moment the pen goes down leaves that drawing
          on screen with no visible way to act on it, and "press M again" is not a
          thing anybody remembers halfway through a session.

          It is a sibling of the control bar rather than of the slide, so it is
          drawn in screen pixels and stays legible at any window size instead of
          being scaled with the canvas. And it is still absent from the DOM for a
          deck nobody has drawn on, which is every harness run.
        */}
        {(ann.active || ann.hasAnyInk) && <AnnotationToolbar ann={ann} />}

        {/* NEVER IN THE DOM UNLESS OPEN. It covers the whole stage, so parked at
            `opacity: 0` it would be reported by `qa.mjs` as content that scrolls
            and by `video-safe.mjs` as covering the instructor video, on every
            slide of every deck. */}
        <AnimatePresence>
          {pickerOpen && (
            <SlidePicker
              slides={slides}
              currentId={current?.id}
              skipped={skipped}
              deleted={deleted}
              edited={edited}
              activeIndexOf={(id) => active.findIndex((s) => s.id === id)}
              presenter={presenter}
              controls={{ toggleSkip: actions.toggleSkip, remove: actions.remove, restoreAll: actions.restoreAll, resetText, canDrop }}
              onPick={pickSlide}
              onShow={showSlide}
              onClose={closePicker}
              thumbnails={!!player?.thumbnails}
            />
          )}
        </AnimatePresence>
      </div>
      </MotionConfig>
    </DeckContext.Provider>
  )
}
