import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import type { ArrowMode } from './useKeyboardNav'
import type { DeckView } from './presenter'

interface Props {
  index: number
  total: number
  step: number
  maxStep: number
  isFirst: boolean
  isLast: boolean
  isFullscreen: boolean
  next: () => void
  prev: () => void
  toggleFullscreen: () => void
  /** What the plain arrow keys currently do. */
  arrowMode: ArrowMode
  toggleArrowMode: () => void
  /**
   * Leave the step/slide switch out of the bar (`DeckMeta.player.hideModeSwitch`).
   * Hidden, not removed: a deck with no build steps has nothing for it to choose.
   */
  hideModeSwitch?: boolean
  openPicker: () => void
  /** Play the current slide's entrance and build again from the top. */
  replay: () => void
  /** Whether the marker is currently open. */
  markerActive: boolean
  toggleMarker: () => void
  /** Whether THIS slide carries ink, drawn as a dot on the marker button. */
  hasInk: boolean
  /**
   * What the bar does on a SMALL SCREEN (see "SMALL SCREENS" below). `dock`,
   * the default, gives it a strip of its own under the stage and keeps it there.
   * `overlay` lays it over the stage, hidden until it is asked for, and hides it
   * again after a press or a few seconds of nothing. A desktop ignores both.
   */
  mobile?: 'dock' | 'overlay'
  /** False while something else owns the surface: the picker, the armed marker. */
  enabled?: boolean
  /** One extra control a session may add, drawn beside fullscreen. */
  extra?: ReactNode
  /*
    THE TWO VIEWS (2026-10-22, session-local; `presenter.ts`). The counter
    opens the slide list in both; Edit text and Download are drawn in the
    presenter view only, because the student file is their output.
  */
  view: DeckView
  menuOpen: boolean
  toggleMenu: () => void
  editing: boolean
  toggleEditing: () => void
  download: () => void
  /* COMMENTS (2026-10-26, session-local trial; `comments.ts`): presenter view only */
  commentsOpen?: boolean
  toggleComments?: () => void
  /** open comment threads on the slide on screen, shown as a badge */
  commentCount?: number
}

/**
 * ONE CONTROL BAR, BOTTOM LEFT.
 *
 * It was five separate floating chips: a counter, two arrows, a jump button, a
 * mode pill and a fullscreen button, each with its own background, its own ring
 * and its own hover. Five chips is not a design, it is five decisions that never
 * met, and at the width the cluster reached it read as debris along the bottom of
 * the slide rather than as the presenter's instrument.
 *
 * So it is one container now: one background, one ring, one blur, one radius, with
 * hairline dividers grouping what belongs together.
 *
 *   counter | back  forward  replay | jump  mode | marker | fullscreen
 *
 * WHY THE GROUPS ARE THOSE GROUPS
 *
 * The counter is a READOUT and never a control, so it sits alone and is not
 * pressable. Back and forward are the pair used every few seconds, and REPLAY
 * joins them because it is the third thing that moves you around inside the
 * material being taught rather than a setting: it is "show that again", which is
 * what a presenter reaches for in the same breath as "go back". Jump and mode are
 * both "change how I am moving", used occasionally and deliberately. MARKER is a
 * group of its own because it is the only control here that changes what the
 * POINTER does, and it is the only one that opens something. Fullscreen is set once
 * at the start of a session and never touched again, so it is last, furthest from
 * the keys that matter.
 *
 * THE MARKER BUTTON IS THE ONLY ONE WITH A STATE, and it carries it the way the
 * rest of this bar carries everything: a background tint and an ink colour, no
 * ring, no scale, nothing that moves a neighbour. It also shows a dot when the
 * CURRENT slide has ink on it while the marker is closed, because ink is kept per
 * slide and a presenter who left a diagram on slide 12 has no other way to know it
 * is still there before the room sees it.
 *
 * NOTHING CHANGES SIZE, EVER
 *
 * Two rules, and both were broken before:
 *
 *   1. **No hover geometry.** Every button changes only its ink and its own
 *      background tint. No scale, no padding shift, no ring that appears and
 *      pushes its neighbours along. A control that grows under the pointer moves
 *      the control next to it, which is how a presenter mis-clicks in front of a
 *      room. `transition-colors` and not `transition`, so a stray layout property
 *      can never be animated by accident.
 *   2. **Fixed widths for changing text.** The mode label swaps between "slide"
 *      and "step", which are different widths, so it lives in a fixed 40px box.
 *      The counter is `tabular-nums` in a fixed box for the same reason: "1 / 38"
 *      and "11 / 38" must not shuffle the buttons sideways as the deck advances.
 *
 * IT GETS OUT OF THE WAY UNTIL THE CURSOR COMES LOOKING FOR IT
 *
 * The bar is the presenter's instrument and the room has no use for it, so it
 * fades out once the pointer is anywhere but the bottom of the screen, and fades
 * back in when the pointer enters the bottom band. A projector then shows the
 * slide and nothing else for the 99% of a session when nobody is reaching for a
 * control.
 *
 * Three details make that safe rather than merely clever:
 *
 *   1. **It starts VISIBLE and hides on the first pointer move away from the
 *      band.** Hiding on load would make the control undiscoverable, and it also
 *      keeps every harness working unchanged: `qa.mjs`, `align-check.mjs` and
 *      `video-safe.mjs` never move a pointer, so they see the bar exactly where
 *      they always did, and `align-check`'s hardcoded chrome rectangle still means
 *      what it says.
 *   2. **Keyboard focus reveals it too**, through `focus-within`. A control that
 *      only a mouse can summon is not reachable by Tab, and this bar is the only
 *      pointer route to the slide picker.
 *   3. **A device with no fine pointer keeps it on screen.** No hover means no
 *      way to ask for it, and a deck opened on a tablet would have lost its
 *      controls entirely. Same gate `index.css` uses for the hover lift.
 *
 * The fade is a CSS transition, not framer: it is interrupted constantly as the
 * pointer crosses the boundary, and a transition retargets from wherever it is
 * while a keyframe or a JS tween restarts from zero. `opacity` and `transform`
 * only, so it costs no layout.
 *
 * Left, not right: the cluster and the NxtWave mark swapped corners. The mark is
 * the signature and sits bottom-right where the eye finishes; the controls are the
 * presenter's tools and sit out of the reading path.
 *
 * THE MODE LABEL IS A LABEL BEFORE IT IS A BUTTON. The arrow keys can mean either
 * "next slide" or "next build step", and the one thing worse than a fixed binding
 * is a binding the presenter cannot see. It states what the plain arrow does right
 * now, in the words of the thing it does, and pressing it swaps.
 *
 * SMALL SCREENS (a phone, either way up)
 *
 * Everything above is a desktop instrument: 32px buttons in a pill at the bottom
 * left, lying over the stage. On a phone that was three defects at once (user,
 * 2026-10-05, Python sessions 17 and 18): the pill ran off the right edge of a
 * 320px screen, its buttons were half the size a thumb needs, and in landscape it
 * lay on top of the slide's own Next and Replay, which sit at the foot of every
 * played panel.
 *
 * So under `COMPACT_MQ` the bar is laid out again, from the same pieces:
 *
 *   - every control is at least 44 x 44 CSS px, the smallest target a thumb hits
 *     reliably (Apple's HIG and WCAG 2.5.5 give the same number), and that size
 *     is used on ANY coarse pointer, a large tablet included;
 *   - under 560px wide it is TWO ROWS, `back · counter · mode · fwd` above
 *     `replay · jump · marker · (extra) · fullscreen`, so nothing is clipped at
 *     320px and the pair pressed every few seconds sits under the thumbs. The
 *     counter and the mode label share the middle of the top row because both
 *     are readouts about where the deck is and how it moves;
 *   - it keeps clear of the notch and the home indicator with the safe-area
 *     insets (`index.html` sets `viewport-fit=cover`, without which they are
 *     zero), and `useMedia` re-lays it on an orientation change;
 *   - fullscreen is dropped where the browser has no fullscreen for a page
 *     (iPhone Safari), rather than shown as a button that does nothing;
 *   - and it never lies on the slide unless asked to. In `dock` mode `Deck` gives
 *     it a strip of its own below the stage and the stage shrinks to fit above
 *     it. In `overlay` mode it lies over the stage but is HIDDEN by default: a
 *     tap on the stage (not on a control), a pull up from the bottom edge, or
 *     keyboard focus brings it up; a press on one of its buttons, or `SHOW_FOR`
 *     ms of nothing, puts it away. It starts on screen, as the desktop bar does,
 *     so it can be found once.
 *
 * Which mode is the session's choice (`DeckMeta.player.autoHideControls`),
 * because the two trade differently: `dock` costs a little slide height in
 * landscape and is never in the way; `overlay` keeps the slide whole and is in
 * the way for a second or two when summoned.
 *
 * NOTHING HERE CHANGES ON A DESKTOP. Above the breakpoints the markup, the
 * classes and the hover reveal are what they were, and the harnesses, which run
 * at 1280x720, measure the bar they always did.
 */

/**
 * How far up from the bottom edge counts as reaching for the controls.
 *
 * 132px, which is a little under a fifth of the 720px stage: deep enough that the
 * bar is already there by the time the pointer arrives, shallow enough that
 * pointing at the bottom of a figure does not summon it. The bar itself is 40px
 * tall and sits 16px off the bottom, so the band clears it by 76px and the pointer
 * never crosses back out of the zone while travelling to a button.
 */
const REVEAL_BAND = 132

/**
 * Below this the bar is re-laid for a phone: a narrow window, or a short one (a
 * phone in landscape is 320 to 480px tall). A laptop window is neither.
 */
const COMPACT_MQ = '(max-width: 640px), (max-height: 480px)'
/** Below this it is two rows: one row of 44px targets is wider than the screen. */
const NARROW_MQ = '(max-width: 559px)'
/** A finger rather than a mouse: the targets grow, whatever the screen size. */
const COARSE_MQ = '(pointer: coarse)'

/** How long a summoned bar stays with nothing pressed, in ms. */
const SHOW_FOR = 3000
/**
 * How long it stays after a press: long enough for the second press of a pair,
 * short enough to be gone by the time the room looks back at the slide.
 */
const SHOW_AFTER_PRESS = 1500
/** A tap: this little travel, this quickly. More is a swipe or a scroll, and those belong to someone else. */
const TAP_SLOP = 10
const TAP_TIME = 350
/** A pull up that starts inside this band at the bottom edge summons the bar once it has travelled `EDGE_PULL`. */
const EDGE = 32
const EDGE_PULL = 24
/** Elements a summoning tap must never start on: the touch already means something there. */
const CONTROL = 'button, input, select, textarea, a, [role="button"], [role="slider"], [contenteditable="true"]'

/** A media query as state, kept current through resizes and orientation changes. */
function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia(query).matches,
  )
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia(query)
    const sync = () => setMatches(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [query])
  return matches
}

/**
 * Whether the pointer is in the bottom band.
 *
 * Starts TRUE, so the bar is on screen before anything has moved: a control nobody
 * knows about is worse than a control that is briefly in the way, and the
 * harnesses, which never move a pointer, keep measuring the deck they always
 * measured.
 */
function usePointerNearBottom(): boolean {
  const [near, setNear] = useState(true)
  useEffect(() => {
    /* No hover, no way to ask for the bar, so it simply stays. */
    if (typeof window.matchMedia === 'function') {
      const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
      if (!fine.matches) return
    }
    const onMove = (e: PointerEvent) => setNear(e.clientY >= window.innerHeight - REVEAL_BAND)
    /* `pointerleave` on the document: the pointer can leave the window from the
       top without a final move event inside the band, which would otherwise strand
       the bar on screen. */
    const onLeave = () => setNear(false)
    window.addEventListener('pointermove', onMove)
    document.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [])
  return near
}

/**
 * THE OVERLAY BAR'S OWN CLOCK. Shown on mount and on a summons, hidden `SHOW_FOR`
 * later; a press re-arms it for the shorter `SHOW_AFTER_PRESS`.
 *
 * The summons are read on `window`, like the deck's other gestures, and the same
 * three things disqualify a touch: it started on a control (the slide's own
 * buttons, sliders and fields keep their touches), it started on the bar itself,
 * or something else owns the surface (`enabled` false: the picker, the marker).
 * A tap toggles; a pull up from the bottom edge only ever shows, because a hand
 * reaching for the bar is not asking for it to go.
 *
 * A mouse in a small window gets the same toggle on `click`. The click a browser
 * synthesises after a touch is the touch again, half a second late, and is
 * dropped by the timestamp: without that a tap would show the bar and then hide
 * it.
 *
 * Does nothing while `active` is false, so the desktop bar never pays for it.
 */
function useAutoHide(active: boolean, enabled: boolean, bar: React.RefObject<HTMLDivElement | null>) {
  const [shown, setShown] = useState(true)
  const shownRef = useRef(true)
  shownRef.current = shown
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled
  const timer = useRef<number | undefined>(undefined)

  const show = useCallback((ms: number) => {
    window.clearTimeout(timer.current)
    setShown(true)
    timer.current = window.setTimeout(() => setShown(false), ms)
  }, [])
  const hide = useCallback(() => {
    window.clearTimeout(timer.current)
    setShown(false)
  }, [])

  useEffect(() => {
    if (!active) {
      window.clearTimeout(timer.current)
      setShown(true)
      return
    }
    show(SHOW_FOR)
    return () => window.clearTimeout(timer.current)
  }, [active, show])

  useEffect(() => {
    if (!active) return
    let start: { x: number; y: number; t: number; edge: boolean; onBar: boolean } | null = null
    let lastTouch = 0
    /*
      THE SEGMENTED SECTION BAR (2026-10-22) sits exactly in the bottom edge band
      a pull-up starts from, and its segments are buttons. A touch that starts on
      it is still ours for the PULL (a hand reaching for the control bar), but a
      TAP on it belongs to the segment, which jumps to its section: the tap must
      not also toggle the control bar.
    */
    const onSectionBar = (t: EventTarget | null) => t instanceof Element && !!t.closest('[data-section-bar]')
    const ours = (t: EventTarget | null) => {
      if (!(t instanceof Element)) return false
      if (onSectionBar(t)) return true
      if (t.closest(CONTROL)) return false
      if (bar.current && bar.current.contains(t)) return false
      return true
    }
    const onStart = (e: TouchEvent) => {
      start = null
      if (!enabledRef.current || e.touches.length !== 1 || !ours(e.target)) return
      const p = e.touches[0]
      start = { x: p.clientX, y: p.clientY, t: Date.now(), edge: p.clientY >= window.innerHeight - EDGE, onBar: onSectionBar(e.target) }
    }
    const onEnd = (e: TouchEvent) => {
      const s = start
      start = null
      lastTouch = Date.now()
      if (!s || e.touches.length > 0) return
      const p = e.changedTouches[0]
      if (!p) return
      const dx = p.clientX - s.x
      const dy = p.clientY - s.y
      if (s.edge && -dy >= EDGE_PULL && Math.abs(dx) < -dy) {
        show(SHOW_FOR)
        return
      }
      if (s.onBar) return
      if (Date.now() - s.t <= TAP_TIME && Math.abs(dx) <= TAP_SLOP && Math.abs(dy) <= TAP_SLOP) {
        if (shownRef.current) hide()
        else show(SHOW_FOR)
      }
    }
    const onCancel = () => {
      start = null
    }
    const onClick = (e: MouseEvent) => {
      if (!enabledRef.current || Date.now() - lastTouch < 600 || !ours(e.target)) return
      if (shownRef.current) hide()
      else show(SHOW_FOR)
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    window.addEventListener('touchcancel', onCancel, { passive: true })
    window.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onCancel)
      window.removeEventListener('click', onClick)
    }
  }, [active, show, hide, bar])

  /** After a press on one of the bar's own buttons. */
  const pressed = useCallback(() => {
    if (active) show(SHOW_AFTER_PRESS)
  }, [active, show])
  /** An explicit ask: keyboard focus arriving on the bar. */
  const summon = useCallback(() => {
    if (active) show(SHOW_FOR)
  }, [active, show])

  return { shown, pressed, summon }
}

/** One hairline between groups. Never a full-height rule: that reads as a seam. */
function Divide() {
  return <span aria-hidden className="mx-0.5 h-5 w-px shrink-0 bg-muted/25" />
}

interface BtnProps {
  label: string
  onClick: () => void
  disabled?: boolean
  /** For the mode control, which carries a word rather than a glyph. */
  wide?: boolean
  /**
   * Latched on, for the marker. COLOUR ONLY, and that is a rule rather than a
   * style: a selected state drawn with a ring or a heavier border changes the
   * button's painted size, and every neighbour in a flex row then sits a pixel or
   * two off where the presenter last saw it.
   *
   * THE TINT IS `/10` AND NOT `/12`, AND THAT COST A DEBUGGING SESSION. Tailwind
   * generates an opacity modifier only for values on its opacity SCALE (0, 5, 10,
   * 20, 25, and up in fives). `bg-brand/12` is off the scale, so no rule is emitted
   * for it and the class silently does nothing: the marker button looked identical
   * whether the marker was open or closed, with no error anywhere. Off-scale values
   * have to be written as an arbitrary value, `bg-brand/[0.12]`. Reach for a scale
   * step unless the exact number matters.
   */
  on?: boolean
  children: React.ReactNode
}

function Btn({
  label,
  onClick,
  disabled,
  wide = false,
  on = false,
  big = false,
  children,
}: BtnProps & {
  /** 44px targets, for a finger. The desktop size is 32. */
  big?: boolean
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={on || undefined}
      onClick={onClick}
      disabled={disabled}
      /* FLEX AND NOT GRID. `place-items-center` on a grid puts two children in two
         ROWS, so the mode control came out with its arrow stacked above its word
         like a road sign. Flex is what "an icon beside a label" means. */
      className={`relative inline-flex ${big ? 'h-11' : 'h-8'} shrink-0 items-center justify-center rounded-pill transition-colors disabled:pointer-events-none disabled:opacity-25 ${
        on
          ? 'bg-brand/10 text-brand hover:bg-brand/20'
          : 'text-muted hover:bg-muted/10 hover:text-ink'
      } ${wide ? (big ? 'gap-1.5 px-3' : 'gap-1.5 px-2.5') : big ? 'w-11' : 'w-8'}`}
    >
      {children}
    </button>
  )
}

/**
 * What a session's extra control needs to know: the size the bar is drawn at and
 * how to tell the overlay clock it was pressed. Read by `ControlButton`.
 */
const BarContext = createContext<{ big: boolean; pressed: () => void }>({
  big: false,
  pressed: () => {},
})

/**
 * A button for `DeckMeta.player.extraControls`: the bar's own button, with the
 * bar's size and its auto-hide timing, for a control the kit does not know about.
 */
export function ControlButton(props: BtnProps) {
  const { big, pressed } = useContext(BarContext)
  const { onClick, ...rest } = props
  return (
    <Btn
      {...rest}
      big={big}
      onClick={() => {
        onClick()
        pressed()
      }}
    />
  )
}

export function DeckControls({
  index,
  total,
  step,
  maxStep,
  isFirst,
  isLast,
  isFullscreen,
  next,
  prev,
  toggleFullscreen,
  arrowMode,
  toggleArrowMode,
  hideModeSwitch = false,
  openPicker,
  replay,
  markerActive,
  toggleMarker,
  hasInk,
  mobile = 'dock',
  enabled = true,
  extra,
  view,
  menuOpen,
  toggleMenu,
  editing,
  toggleEditing,
  download,
  commentsOpen = false,
  toggleComments,
  commentCount = 0,
}: Props) {
  const compact = useMedia(COMPACT_MQ)
  const narrow = useMedia(NARROW_MQ)
  const coarse = useMedia(COARSE_MQ)
  const big = compact || coarse
  const overlay = compact && mobile === 'overlay'
  const barRef = useRef<HTMLDivElement>(null)
  const near = usePointerNearBottom()
  const { shown, pressed, summon } = useAutoHide(overlay, enabled, barRef)
  /*
    Fullscreen is offered where the browser can fullscreen a page. On an iPhone
    it cannot (Safari fullscreens video only), so the button would do nothing.
    Checked only at phone size: in the review app's iframe the API is also off,
    and a desktop deck is left exactly as it was.
  */
  const canFullscreen = !big || typeof document === 'undefined' || document.fullscreenEnabled !== false
  /* A press on a bar button re-arms the overlay clock; on a desktop `pressed` is a no-op. */
  const act = (fn: () => void) => () => {
    fn()
    pressed()
  }

  /*
    THE READOUT, AND NOW THE LIST BEHIND IT (2026-10-22). It was deliberately
    not a button: the slide number is information, and a fourth navigation
    gesture beside three that worked was one too many. The presenter asked
    for the list anyway, and the number is where a presenter already looks
    when they want to know where they are, so pressing it opens `SlideMenu`:
    every active slide, number and title, one press to jump. It still draws
    like a readout (no ring, no glyph) and its box is fixed, so the bar is the
    width it always was. `tabular-nums` so the digits do not shuffle the bar.

    11.5px, THE SAME SIZE AS EVERYTHING ELSE IN THE BAR, and it was 13.

    It was 13 because the counter used to be its own floating chip at
    `text-sm`, and when the chips became one bar its size was trimmed rather
    than re-decided. On a bar it was then the largest and heaviest thing in the
    control, which is a claim about importance that is exactly backwards: the
    ROOM never reads the slide number, and the presenter glances at it from a
    laptop between sentences. The things worth aiming for are the buttons.

    So the bar has one type size and the hierarchy comes from weight and
    colour: the current number in body ink at semibold, the total muted behind
    a slash. Nothing is emphasised by being bigger than its neighbours.
  */
  const counter = (
    <button
      type="button"
      data-menu-toggle=""
      aria-haspopup="listbox"
      aria-expanded={menuOpen}
      aria-label="Open the list of slides"
      onClick={act(toggleMenu)}
      className={`inline-flex ${big ? 'h-11' : 'h-8'} shrink-0 select-none items-center rounded-pill px-1.5 font-mono text-[11.5px] tabular-nums leading-none transition-colors ${menuOpen ? 'bg-brand/10' : 'hover:bg-muted/10'}`}
    >
      {/*
        `style={{ color }}` AND NOT `text-body`, WHICH IS THE REAL ANSWER TO WHY
        THIS NUMBER WAS TOO BIG.

        `tailwind.config.ts` defines `body` in BOTH `colors` (#4A5B6B) and
        `fontSize` (19px). When a key exists in both, the fontSize utility wins
        and the colour one is shadowed, so `text-body` is a 19px TYPE STEP, not a
        colour. This span declared 11.5px on its parent and rendered at 19px,
        measured: `12 / 38 @ 11.5px` on the parent, `12 @ 19px` on this child.

        It is also what made the mode control expand on hover. `IconBtn` carried
        `hover:text-body`, so pointing at it set the label to 19px and the pill
        grew. The buttons now use `hover:text-ink`, and `ink` has no `fontSize`
        entry, so it is a colour and only a colour.

        The lesson generalises: in this repo `text-body`, `text-body-sm`,
        `text-code` and `text-kicker` are SIZES. For that grey, reach for the
        token.
      */}
      <span className="font-medium" style={{ color: colors.body }}>
        {String(index + 1).padStart(2, '0')}
      </span>
      {/* a non-breaking space: inside a flex button the leading space of a text run is collapsed away */}
      <span className="text-muted/70">{'\u00a0/ '}{String(total).padStart(2, '0')}</span>
    </button>
  )

  const back = (
    <Btn big={big} label="Back" onClick={act(prev)} disabled={isFirst && step === 0}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Btn>
  )

  const fwd = (
    <Btn big={big} label="Forward" onClick={act(next)} disabled={isLast && step >= maxStep}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Btn>
  )

  {/* REPLAY. A circular arrow, which is the one glyph every product on a
      projector has already trained an instructor to read as "again". It is
      never disabled: replaying a slide with no build steps still replays its
      entrance, which is exactly what it says it does. */}
  const again = (
    <Btn big={big} label="Play this slide again from the top (R)" onClick={act(replay)}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          d="M20 11a8 8 0 10-2.3 5.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M20 4v7h-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Btn>
  )

  const jump = (
    <Btn big={big} label="Jump to a slide (G)" onClick={act(openPicker)}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          d="M4 5h6v6H4zM14 5h6v6h-6zM4 13h6v6H4zM14 13h6v6h-6z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Btn>
  )

  /* `null` when the session hides it: every layout below drops it by the same test. */
  const mode = hideModeSwitch ? null : (
    <Btn
      big={big}
      label={`Plain arrow keys currently move by ${
        arrowMode === 'slides' ? 'whole slides' : 'build steps'
      }. Press to swap. (S)`}
      onClick={act(toggleArrowMode)}
      wide
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M5 12h13M13 7l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {/* FIXED BOX. "slide" and "step" are different widths and this label
          changes while the deck is up, so without it every button to its right
          steps sideways on the press. */}
      <span className="w-[40px] text-left font-mono text-[11.5px] font-semibold leading-none">
        {arrowMode === 'slides' ? 'slide' : 'step'}
      </span>
    </Btn>
  )

  const marker = (
    <Btn
      big={big}
      label={`${markerActive ? 'Close' : 'Open'} the marker and draw on this slide (M)`}
      onClick={act(toggleMarker)}
      on={markerActive}
    >
      {/* A pen nib pointing down-left, angled the way a hand holds one. */}
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          d="M16.5 3.5a2.1 2.1 0 013 3L8 18l-4 1.5L5.5 15.5z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M14.5 5.5l3 3" strokeLinecap="round" />
      </svg>
      {/*
        THIS SLIDE HAS INK ON IT. Shown only while the marker is CLOSED: with the
        palette up the ink is on screen and the dot would be noise. Absolutely
        positioned, so it cannot change the button's size and shift the bar.
      */}
      {hasInk && !markerActive && (
        <span
          aria-hidden
          className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full"
          style={{ background: colors.danger }}
        />
      )}
    </Btn>
  )

  const fullscreen = canFullscreen ? (
    <Btn big={big} label="Toggle fullscreen" onClick={act(toggleFullscreen)}>
      {isFullscreen ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 3v6H3M21 9h-6V3M15 21v-6h6M3 15h6v6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </Btn>
  ) : null

  /*
    EDIT TEXT AND DOWNLOAD, PRESENTER VIEW ONLY (2026-10-22). Edit is a latch
    like the marker: while it is on, every text element of the slide on screen
    is editable in place (`EditLayer`). Download saves the student file: the
    deck as finalised, skipped and deleted slides out, edits in, these two
    buttons and the picker's skip and delete gone (`presenter.ts`). Both sit in
    the marker's group because, like the marker, they change what the pointer
    does to the slide rather than where the deck is.
  */
  const edit =
    view === 'presenter' ? (
      <Btn big={big} label={`${editing ? 'Stop editing' : 'Edit'} the text on this slide`} onClick={act(toggleEditing)} on={editing}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h11M9.5 6v12" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M17.5 12.5l2.3 2.3-5.2 5.2H12.3v-2.3z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Btn>
    ) : null

  const save =
    view === 'presenter' ? (
      <Btn big={big} label="Download the student view: the deck as finalised, with skipped slides left out" onClick={act(download)}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Btn>
    ) : null

  /* COMMENTS, presenter only (2026-10-26): opens the panel on the right of the slide (`CommentsPanel`). */
  const comments =
    view === 'presenter' && toggleComments ? (
      <Btn big={big} label={`${commentsOpen ? 'Hide' : 'Show'} comments${commentCount ? ` (${commentCount} open on this slide)` : ''}`} onClick={act(toggleComments)} on={commentsOpen}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 19 17H11l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5z" strokeLinejoin="round" />
        </svg>
        {commentCount > 0 && (
          <span aria-hidden className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-white">
            {commentCount}
          </span>
        )}
      </Btn>
    ) : null

  /* The whole bar is one surface, so the shadow belongs to the bar and not to
     each thing inside it. */
  const shadow = { boxShadow: '0 6px 24px -12px rgba(0, 37, 75, 0.28)' }

  if (!compact) {
    return (
      <BarContext.Provider value={{ big, pressed }}>
        <div
          ref={barRef}
          data-deck-controls=""
          /* `focus-within:` twice over, so tabbing to a button brings the bar back even
             when the pointer is elsewhere. */
          className={`absolute bottom-4 left-5 z-30 flex items-center gap-0.5 rounded-pill bg-white/85 px-1.5 py-1 ring-1 ring-muted/20 backdrop-blur transition-[opacity,transform] duration-200 ease-out focus-within:pointer-events-auto focus-within:translate-y-0 focus-within:opacity-100 ${
            /* the bar stays while its list is open: the pointer is up in the list, outside the band */
            near || menuOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-1.5 opacity-0'
          }`}
          style={shadow}
        >
          {counter}
          <Divide />
          {back}
          {fwd}
          {again}
          <Divide />
          {jump}
          {mode}
          <Divide />
          {marker}
          {edit}
          {comments}
          {save}
          <Divide />
          {extra}
          {fullscreen}
        </div>
      </BarContext.Provider>
    )
  }

  /*
    THE PHONE BAR. One element positions it (a strip in the flow for `dock`, an
    overlay at the bottom for `overlay`) and carries the safe-area padding; the
    pill inside is the same surface as the desktop one, centred, and never wider
    than the screen.

    The overlay's hidden state is a translate off the bottom plus a fade, on the
    same 200ms the desktop reveal uses, and `pointer-events-none` so a hidden bar
    cannot eat the tap that would have summoned it. No `focus-within` here: a tap
    leaves its button focused on Android, which would have pinned the bar on
    screen for good; focus arriving on the bar summons it instead, through
    `onFocus`, and the clock runs as usual.
  */
  const hidden = overlay && !shown
  return (
    <BarContext.Provider value={{ big, pressed }}>
      <div
        ref={barRef}
        data-deck-controls=""
        data-mobile={overlay ? 'overlay' : 'dock'}
        onFocus={overlay ? summon : undefined}
        className={`z-30 ${
          overlay
            ? 'absolute inset-x-0 bottom-0 transition-[opacity,transform] duration-200 ease-out'
            : 'relative w-full shrink-0'
        } ${hidden ? 'pointer-events-none translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}
        style={{
          paddingTop: 8,
          paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
          paddingLeft: 'max(8px, env(safe-area-inset-left))',
          paddingRight: 'max(8px, env(safe-area-inset-right))',
        }}
      >
        {narrow ? (
          <div
            className="mx-auto flex w-full max-w-[440px] flex-col gap-1 rounded-[28px] bg-white/85 px-1.5 py-1.5 ring-1 ring-muted/20 backdrop-blur"
            style={shadow}
          >
            <div className="flex items-center gap-1">
              {back}
              <span className="flex min-w-0 flex-1 items-center justify-center gap-1">
                {counter}
                {mode}
              </span>
              {fwd}
            </div>
            <div className="flex items-center justify-center gap-1">
              {again}
              {jump}
              {marker}
              {edit}
              {comments}
              {save}
              {extra}
              {fullscreen}
            </div>
          </div>
        ) : (
          <div
            className="mx-auto flex w-fit max-w-full items-center gap-0.5 rounded-pill bg-white/85 px-1.5 py-1 ring-1 ring-muted/20 backdrop-blur"
            style={shadow}
          >
            {counter}
            <Divide />
            {back}
            {fwd}
            {again}
            <Divide />
            {jump}
            {mode}
            <Divide />
            {marker}
            {edit}
            {comments}
            {save}
            <Divide />
            {extra}
            {fullscreen}
          </div>
        )}
      </div>
    </BarContext.Provider>
  )
}
