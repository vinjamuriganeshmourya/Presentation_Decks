import { useEffect, useRef } from 'react'
import type { Annotate } from './annotate/useAnnotate'
import type { ShapeKind } from './annotate/types'

/**
 * Which thing the PLAIN arrow keys do.
 *
 *   `slides`  →  whole slide, as a cut. Ctrl+→ steps the build. The original.
 *   `steps`   →  one build step. Ctrl+→ jumps a whole slide.
 *
 * The two are a straight swap, so there is exactly one key that changes and
 * nothing is unreachable in either mode.
 */
export type ArrowMode = 'slides' | 'steps'

interface Handlers {
  /** One build step forward, crossing into the next slide with the transition. */
  next: () => void
  /** One build step back, crossing into the previous slide with the transition. */
  prev: () => void
  /** Previous slide as a cut, landing fully revealed. */
  prevSlide: () => void
  /** Next slide as a cut, landing fully revealed. */
  nextSlide: () => void
  arrowMode: ArrowMode
  toggleArrowMode: () => void
  openPicker: () => void
  /** Replay the current slide's entrance and build from the top. */
  replay: () => void
  /** The marker. Its keys only bind while `ann.active`, except the toggle. */
  ann: Annotate
  /** False while something else owns the keyboard, e.g. the slide picker. */
  enabled?: boolean
}

/**
 * WHICH DIGIT PICKS WHICH TOOL, AND WHY THEY ARE DIGITS AND NOT LETTERS.
 *
 * The mnemonic letters collide with keys the deck already owns or wants. `S` is
 * the arrow-mode swap and `G` is the picker, so `s` cannot be "square"; `R` is
 * worth far more as "replay this slide" than as "rectangle", because replay is
 * used on any slide in the deck and the rectangle only inside marker mode.
 *
 * Digits also match the toolbar left to right, which is the thing an instructor
 * actually looks at while learning the palette, and they leave the letters free
 * for the three verbs that are worth a mnemonic: `E` erase, `C` colour, `T`
 * thickness.
 */
const TOOL_KEYS: ShapeKind[] = [
  'pen',
  'marker',
  'highlighter',
  'line',
  'arrow',
  'rect',
  'ellipse',
]

/**
 * Presentation navigation, and the two keys that are not arrows.
 *
 *   →  /  ←        depends on the mode below
 *   Ctrl+→ / ←     the other one
 *   PageDown / Up  same as the plain arrows, because that is what a clicker sends
 *   G              jump to a slide
 *   S              swap what the arrows do
 *   R              replay the current slide from the top
 *   M              open or close the marker
 *
 * AND, WHILE THE MARKER IS OPEN AND ONLY THEN
 *
 *   1 … 7          pen, marker, highlighter, line, arrow, rectangle, ellipse
 *   E / Shift+E    eraser / erase everything inside a dragged box
 *   Delete twice   erase this sheet's ink (undoable, and it takes two presses)
 *   C / T          cycle ink colour / nib thickness
 *   H              hide the ink without erasing it, and show it again
 *   A              swap between ink that belongs to THIS SLIDE and one sheet of
 *                  ink for the whole deck
 *   Ctrl+Z, +Shift undo, redo
 *   Esc            put the pen down, keeping the ink
 *
 * WHY REPLAY IS A KEY AT ALL
 *
 * A built slide is an explanation in sequence, and the commonest thing that goes
 * wrong while teaching it is that the room did not follow the first pass. Before
 * this key the only way back to the top of a build was to leave the slide and come
 * back, which crosses a slide boundary twice and plays two transitions to get to
 * the same place. `R` restages the slide in place.
 *
 * WHY THE ARROW BINDING IS NOW A TOGGLE
 *
 * The original binding was fixed: plain arrows changed slide, Ctrl+arrow stepped
 * the build. That is the right default, because the plain arrows are what gets
 * tapped every few seconds while presenting and one press should mean one slide,
 * with no half-built state.
 *
 * It is the wrong default for a deck whose slides are mostly BUILDS. Six of the
 * figures in the labs step eight or nine times, so on those slides the presenter
 * holds Ctrl for the whole slide and reaches for a plain arrow only once. Worse,
 * a hardware clicker cannot send Ctrl at all, so a build-heavy deck could not be
 * presented from a clicker: it would skip every build in the deck.
 *
 * So the pair swaps, on one key, and the control cluster shows which way round it
 * currently is. It is a swap and not a third mode because both jobs have to stay
 * reachable: an instructor mid-session must be able to skip a slide as well as
 * step one, whichever they chose.
 *
 * PageDown and PageUp follow the PLAIN arrows rather than being pinned to slides,
 * for the clicker reason above: a clicker should do what the presenter just chose,
 * not something a third binding decided for them.
 */
/** How long the first `Delete` stays armed, in ms. See the `Delete` case. */
const CLEAR_WINDOW = 3000

export function useKeyboardNav(h: Handlers) {
  /* When the first `Delete` was pressed, or 0. A ref and not state: nothing on
     screen depends on it, and re-rendering the whole deck to remember a keypress
     would restart nothing useful. */
  const armedRef = useRef(0)
  useEffect(() => {
    if (h.enabled === false) return
    const onKey = (e: KeyboardEvent) => {
      // Don't hijack typing in inputs.
      const t = e.target as HTMLElement
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable))
        return

      /*
        UNDO IS CHECKED BEFORE THE MODIFIER GUARD BELOW, AND IT ACCEPTS META.

        The guard drops anything carrying Alt or Meta, which is right for the
        navigation keys (Meta+arrow belongs to the window manager) and wrong for
        exactly one binding: undo is Cmd+Z on a Mac and Ctrl+Z everywhere else,
        and an instructor who has just drawn a wrong circle in front of a room
        should not have to find out which machine they are on.

        It is also gated on marker mode. Ctrl+Z with the marker closed is the
        browser's own undo, and taking it from a page that has no text field would
        be taking a key to do nothing with it.
      */
      if (h.ann.active && (e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault()
        if (e.shiftKey) h.ann.redo()
        else h.ann.undo()
        return
      }

      /* Never on a modified key beyond Ctrl: Alt+arrow is the browser's history
         and Meta+arrow belongs to the window manager. */
      if (e.altKey || e.metaKey) return

      /*
        THE PALETTE KEYS BIND ONLY WHILE THE MARKER IS OPEN.

        Every one of them is a bare letter or digit, which is the same key space
        the deck's own navigation lives in, so binding them permanently would mean
        an instructor pressing `e` on a closed deck silently arming an eraser they
        cannot see. Inside marker mode the presenter has asked for a drawing
        instrument and the letters are theirs.

        `Escape` closes the marker rather than clearing it. The ink is the reason
        the marker was opened; a key that threw it away on a mis-press, next to a
        key that merely puts the pen down, would eventually throw away the wrong
        one in front of a room. Erase-all is `Delete`, which is unambiguous, and it
        is undoable.
      */
      if (h.ann.active && !e.ctrlKey) {
        const digit = TOOL_KEYS[Number(e.key) - 1]
        if (digit) {
          e.preventDefault()
          h.ann.setTool(digit)
          return
        }
        switch (e.key) {
          case 'e':
            e.preventDefault()
            h.ann.setTool('eraser')
            return
          case 'E':
            e.preventDefault()
            h.ann.setTool('area')
            return
          case 'Delete': {
            /*
              ERASE-ALL TAKES TWO PRESSES, WITHIN THREE SECONDS.

              This is the one destructive key in the deck and it is one key away
              from nothing: `Delete` sits beside the arrow cluster on most
              keyboards, and the failure it guards against is not a careless
              instructor but a normal one whose hand was going for something else
              while talking. Every other product's version of this key is a
              single press with no undo (one of them is Shift+A, next to the keys
              that move slides), and wiping the board mid-explanation in front of
              a class is not recoverable socially even when it is recoverable
              technically.

              The second press is the confirmation, so it costs nothing to learn
              and nothing to perform. The window is deliberately short: a stale
              armed state that fires half a minute later is a worse bug than the
              one being fixed. The toolbar's erase-all button stays a single
              click, because pointing at a small button labelled "erase
              everything" is already a deliberate act in a way a keypress is not.

              And it remains undoable either way. This guard is about the press
              nobody meant to make, not about making the action irreversible.
            */
            e.preventDefault()
            const now = Date.now()
            if (armedRef.current && now - armedRef.current < CLEAR_WINDOW) {
              armedRef.current = 0
              h.ann.clear()
            } else if (h.ann.hasInk) {
              armedRef.current = now
            }
            return
          }
          case 'h':
          case 'H':
            e.preventDefault()
            h.ann.toggleHidden()
            return
          case 'a':
          case 'A':
            e.preventDefault()
            h.ann.toggleScope()
            return
          case 'c':
          case 'C':
            e.preventDefault()
            h.ann.cycleColor()
            return
          case 't':
          case 'T':
            e.preventDefault()
            h.ann.cycleWidth()
            return
          case 'Escape':
            e.preventDefault()
            h.ann.setActive(false)
            return
        }
      }

      const stepping = h.arrowMode === 'steps'
      const fwd = stepping ? h.next : h.nextSlide
      const back = stepping ? h.prev : h.prevSlide
      const ctrlFwd = stepping ? h.nextSlide : h.next
      const ctrlBack = stepping ? h.prevSlide : h.prev

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault()
          if (e.ctrlKey) ctrlFwd()
          else fwd()
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (e.ctrlKey) ctrlBack()
          else back()
          break
        case 'PageDown':
          e.preventDefault()
          fwd()
          break
        case 'PageUp':
          e.preventDefault()
          back()
          break
        case 'g':
        case 'G':
          if (e.ctrlKey) return
          e.preventDefault()
          h.openPicker()
          break
        case 's':
        case 'S':
          /* Ctrl+S is save. Taking it would train an instructor to lose a file. */
          if (e.ctrlKey) return
          e.preventDefault()
          h.toggleArrowMode()
          break
        case 'm':
        case 'M':
          if (e.ctrlKey) return
          e.preventDefault()
          h.ann.toggle()
          break
        case 'r':
        case 'R':
          /* Ctrl+R is reload, and a reload of a single-file deck means finding the
             slide again from the top. */
          if (e.ctrlKey) return
          e.preventDefault()
          h.replay()
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [h])
}

/**
 * THE MODE THE DECK OPENS IN, AND WHY THE HARNESSES OVERRIDE IT.
 *
 * Read in this order:
 *
 *   1. `?nav=slides` or `?nav=steps` in the URL. An explicit instruction wins.
 *   2. `?all`, the harness flag, forces `slides`. `preview.mjs` and
 *      `continuity-check.mjs` both press a PLAIN ArrowRight and expect the next
 *      SLIDE. A stored preference of `steps` would have them stepping builds
 *      instead, which under `?all` are already all revealed, so they would press
 *      79 times and never leave slide 1 while reporting cheerfully. A harness must
 *      never be able to read a human's preference.
 *   3. What this browser last chose, from `localStorage`.
 *   4. `slides`, the original binding.
 *
 * The read is wrapped, and so is the write. The deliverable is a single HTML file
 * an instructor opens by double-click, which is a `file://` origin, and
 * `localStorage` on `file://` throws outright in some browser configurations
 * rather than returning null. An exception here would take the whole deck down on
 * load, which is the one failure this repo cannot ship.
 */
const KEY = 'nxtwave.deck.arrowMode'

/**
 * `remembered` false (the session hides the switch, `player.hideModeSwitch`) skips
 * the browser's saved choice: a presenter who pressed `S` in another deck on this
 * machine must not open this one in a mode it gives them no way out of. The URL is
 * read either way, because the harnesses ask for `?nav=steps` on purpose.
 */
export function initialArrowMode(remembered = true): ArrowMode {
  if (typeof window === 'undefined') return 'slides'
  const params = new URLSearchParams(window.location.search)
  const asked = params.get('nav')
  if (asked === 'slides' || asked === 'steps') return asked
  if (params.has('all')) return 'slides'
  if (!remembered) return 'slides'
  try {
    const saved = window.localStorage.getItem(KEY)
    if (saved === 'slides' || saved === 'steps') return saved
  } catch {
    /* file:// with site data blocked. The default is the answer. */
  }
  return 'slides'
}

export function rememberArrowMode(mode: ArrowMode) {
  try {
    window.localStorage.setItem(KEY, mode)
  } catch {
    /* Not remembering is a lost convenience. Throwing is a blank slide. */
  }
}
