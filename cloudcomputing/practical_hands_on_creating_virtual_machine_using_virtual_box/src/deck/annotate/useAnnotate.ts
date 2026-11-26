import { useCallback, useMemo, useRef, useState } from 'react'
import { INKS, NIBS, type Stroke, type Tool } from './types'

/**
 * WHOSE SHEET OF PAPER THE INK GOES ON.
 *
 *   `slide`  one sheet per slide. Ink belongs to the slide it was drawn on, and
 *            navigating away puts it away and brings it back on return. This is the
 *            default because it is what a whiteboard beside a projector does, and
 *            because ink is nearly always ABOUT the thing under it: an arrow drawn
 *            to a box on slide 12 means nothing over slide 13.
 *   `deck`   one sheet for the whole deck, a single screen of ink that stays put
 *            while the slides move underneath it. This is for the other thing
 *            instructors do with a pen, which is to build up a running scratch area
 *            (a running example, a list of terms the class asked about, a diagram
 *            they keep adding to) that has to survive walking back and forth
 *            through the deck to answer questions.
 *
 * The two are one toggle rather than two features because they are the same ink
 * with a different key, and because a presenter mid-session should be able to say
 * "keep this one up" without moving anything by hand.
 */
export type InkScope = 'slide' | 'deck'

/**
 * The document key for deck-wide ink. Prefixed so it cannot collide with a slide
 * id, however a session names its slides.
 */
const DECK_KEY = '\u0000deck'

export interface Annotate {
  active: boolean
  setActive: (on: boolean) => void
  toggle: () => void
  tool: Tool
  setTool: (t: Tool) => void
  color: string
  setColor: (c: string) => void
  cycleColor: () => void
  width: number
  setWidth: (w: number) => void
  cycleWidth: () => void
  /** The CURRENT slide's strokes. */
  strokes: Stroke[]
  /**
   * The strokes the class should currently SEE: those drawn at or before the build
   * step the slide is on. `strokes` is the whole slide's ink and is what undo,
   * erase and `hasInk` work on, so hiding a stroke never quietly loses it.
   */
  visible: Stroke[]
  /** The build step new ink will be stamped with. */
  step: number
  /**
   * Ink is on the slide but not being drawn.
   *
   * The reversible version of erase-all, and it exists because the alternative is
   * worse: without it an instructor who wants a clean slide for the next point
   * reaches for erase and destroys a diagram they may want back two minutes later.
   * Hiding is deck-wide, not per slide, because it is a state of the presenter
   * ("stop showing my ink for a moment"), not a property of a slide.
   */
  hidden: boolean
  setHidden: (on: boolean) => void
  toggleHidden: () => void
  /** Whether ink belongs to this slide or to the whole deck. See `InkScope`. */
  scope: InkScope
  setScope: (s: InkScope) => void
  toggleScope: () => void
  /** Add a finished stroke (the id is generated here). */
  /**
   * Add a finished stroke. The caller reports GEOMETRY ONLY: the id and the build
   * step it belongs to are stamped here, because both are facts about the deck's
   * state at the moment of the commit rather than about the shape that was drawn.
   */
  commit: (s: Omit<Stroke, 'id' | 'step'>) => void
  /** Remove strokes by id. A no-op (and no history entry) when the list is empty. */
  eraseIds: (ids: string[]) => void
  /** Erase everything on the current slide. */
  clear: () => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  /** True when the current slide carries ink, used to badge the toolbar button. */
  hasInk: boolean
  /**
   * True when ANY sheet in this session carries ink: this slide, another slide, or
   * the deck-wide sheet.
   *
   * It is what keeps the marker rail on screen after the pen is put down. Ink that
   * is on a slide but whose only control has vanished is a trap: the presenter can
   * see the drawing and has no way to hide it, erase it or undo it without first
   * remembering the shortcut that brings the palette back. So the rail is present
   * whenever there is ink anywhere, and absent only in the case that matters for
   * the harnesses, which is a deck nobody has drawn on.
   */
  hasAnyInk: boolean
}

/**
 * A slide's ink, and its undo history, as one value.
 *
 * `stack[i]` IS the document: there is no separate "current strokes" field to fall
 * out of step with the history. The first version kept both, and every bug it had
 * was the same bug, an edit that updated one and not the other, so undo pasted
 * back a document that had never been on screen.
 */
interface Doc {
  stack: Stroke[][]
  i: number
}

const EMPTY: Stroke[] = []
const FRESH: Doc = { stack: [EMPTY], i: 0 }

/** How many undo steps a slide keeps. */
const CAP = 60

/**
 * Ids only have to be unique inside one browser session, because ink is never
 * saved, so a counter is enough and `Date.now()` only guards against two hook
 * instances in the same page (the presenter window and a print view) colliding.
 * A uuid dependency would be a new npm package for a string, and this deck ships
 * as one offline HTML file.
 */
let seq = 0
const run = Date.now().toString(36)
function nextId(): string {
  return `a${run}${++seq}`
}

/** Truncate the redo tail, append, and cap the stack, returning a new Doc. */
function push(d: Doc, next: Stroke[]): Doc {
  const kept = d.stack.slice(0, d.i + 1)
  kept.push(next)
  /* Oldest out first, and `i` moves with it, or undo walks off the front. */
  const over = kept.length - CAP
  if (over > 0) return { stack: kept.slice(over), i: kept.length - over - 1 }
  return { stack: kept, i: kept.length - 1 }
}

/**
 * MARKER STATE FOR THE WHOLE DECK, WITH ONE DOCUMENT PER SLIDE.
 *
 * Called once, in `Deck.tsx`, and handed down through the deck context. It is one
 * hook and not one per slide because the slide components are unmounted the moment
 * the deck moves on, so state owned by a slide would take that slide's annotations
 * with it. An instructor circles a term on slide 12, answers a question, goes back
 * to 12, and the circle has to still be there: that is the whole reason the
 * documents are keyed by `slideKey` up here rather than stored inside the slide.
 *
 * WHAT IS PER SLIDE AND WHAT IS DECK-WIDE
 *
 * The ink and its undo history are per slide. Undo has to be, or a presenter who
 * has moved on two slides and presses Ctrl+Z would silently rearrange a slide the
 * room can no longer see. The TOOL, COLOUR AND WIDTH are deck-wide: an instructor
 * picks a bold red pen once at the start of a session, and resetting the palette
 * on every slide change would make the toolbar hostile.
 *
 * INK IS SESSION MEMORY ONLY, DELIBERATELY NOT PERSISTED. Nothing here touches
 * `localStorage`. Two reasons, and the second is the hard one: the deliverable is
 * a double-clicked HTML file on a `file://` origin, where that API throws outright
 * in some browser configurations; and ink is said out loud to one room, so a deck
 * reopened for the next batch must come up clean rather than covered in last
 * week's arrows.
 *
 * EVERY CALLBACK IS STABLE FOR THE LIFE OF THE DECK, including across slide
 * changes. They go into keyboard effects and a memoised context, so a callback
 * whose identity changed on every slide would retear the context and rebind the
 * key handler on every advance. The current slide is therefore read through a ref
 * rather than closed over, and the setters are all functional updates so they never
 * need the state in their dependencies either.
 */
export function useAnnotate(slideKey: string, step: number): Annotate {
  const [active, setActiveState] = useState(false)
  const [tool, setToolState] = useState<Tool>('pen')
  const [color, setColorState] = useState<string>(INKS[0].value)
  const [width, setWidthState] = useState<number>(
    NIBS.find((nib) => nib.name === 'medium')?.value ?? NIBS[0].value,
  )
  const [docs, setDocs] = useState<Record<string, Doc>>({})
  const [hidden, setHiddenState] = useState(false)
  const [scope, setScopeState] = useState<InkScope>('slide')

  /* Written during render, on purpose: an edit can be committed by a pointerup in
     the same tick as a slide change, and an effect-assigned ref would still be
     pointing at the slide we just left. */
  /*
    THE SCOPE IS A CHOICE OF KEY, AND NOTHING ELSE IN HERE KNOWS ABOUT IT.

    Deck-wide ink is not a second store, a second undo stack or a second render
    path: it is the same per-document machinery pointed at one shared key instead of
    the slide's own. So every behaviour that took work to get right (undo per
    document, erase, the ink dot on the marker button) is correct for both scopes
    for free, and switching scope mid-session cannot lose either sheet, because the
    other one is still sitting under its own key.
  */
  const docKey = scope === 'deck' ? DECK_KEY : slideKey
  const keyRef = useRef(docKey)
  keyRef.current = docKey
  /* Same reason as `keyRef`: a `pointerup` can land in the same tick as a step
     change, and a stroke has to be stamped with the step it was actually drawn
     over. */
  const stepRef = useRef(step)
  stepRef.current = step
  const scopeRef = useRef(scope)
  scopeRef.current = scope

  const doc = docs[docKey] ?? FRESH
  const strokes = doc.stack[doc.i] ?? EMPTY

  /** Apply an edit to the CURRENT slide's document. Returning `d` means no-op. */
  const edit = useCallback((fn: (d: Doc, cur: Stroke[]) => Doc) => {
    const key = keyRef.current
    setDocs((prev) => {
      const d = prev[key] ?? FRESH
      const cur = d.stack[d.i] ?? EMPTY
      const next = fn(d, cur)
      if (next === d) return prev
      return { ...prev, [key]: next }
    })
  }, [])

  const setScope = useCallback((s: InkScope) => setScopeState(s), [])
  const toggleScope = useCallback(
    () => setScopeState((s) => (s === 'slide' ? 'deck' : 'slide')),
    [],
  )

  const setHidden = useCallback((on: boolean) => setHiddenState(on), [])
  const toggleHidden = useCallback(() => setHiddenState((v) => !v), [])

  const setActive = useCallback((on: boolean) => setActiveState(on), [])
  /* Leaving marker mode NEVER discards ink: the presenter turns the pen off to
     click through a build, and coming back to a wiped slide would be a data loss
     they did not ask for. `clear` is the only thing that erases wholesale. */
  const toggle = useCallback(() => setActiveState((v) => !v), [])

  /*
    PICKING A TOOL ARMS THE MARKER.

    The rail stays on screen after the pen is put down, whenever there is ink
    anywhere, so that the presenter can still reach undo, hide and erase. That means
    a tool button can now be pressed while the marker is CLOSED, and without this it
    would appear to do nothing: the button would latch, the pointer would still pass
    straight through to the slide, and the only feedback would be the absence of
    ink. Choosing a pen is a statement of intent to draw, so it opens the marker.

    Deliberately NOT true of undo, redo, hide or erase. Those are things you do to
    ink that already exists, and doing one of them should not hand the pointer to a
    drawing tool behind the presenter's back.
  */
  const setTool = useCallback((t: Tool) => {
    setToolState(t)
    setActiveState(true)
  }, [])
  const setColor = useCallback((c: string) => setColorState(c), [])
  const setWidth = useCallback((w: number) => setWidthState(w), [])

  const cycleColor = useCallback(() => {
    setColorState((c) => {
      const at = INKS.findIndex((ink) => ink.value === c)
      return INKS[(at + 1) % INKS.length].value
    })
  }, [])

  const cycleWidth = useCallback(() => {
    setWidthState((w) => {
      const at = NIBS.findIndex((nib) => nib.value === w)
      return NIBS[(at + 1) % NIBS.length].value
    })
  }, [])

  const commit = useCallback(
    (s: Omit<Stroke, 'id' | 'step'>) => {
      /* The id is minted here so the drawing surface can stay stateless about
         identity: it reports the geometry it just finished and nothing else. */
      /*
        DECK-WIDE INK IS STAMPED WITH STEP 0, WHICH IS THE ONLY HONEST ANSWER.

        Step numbers belong to a single slide's build, so a stroke on the shared
        sheet drawn while slide 12 was at step 4 would then be invisible on every
        slide whose build has fewer than four steps. A sheet that is deliberately
        independent of the slides underneath it cannot also be gated by them.
      */
      const full: Stroke = {
        ...s,
        id: nextId(),
        step: scopeRef.current === 'deck' ? 0 : stepRef.current,
      }
      edit((d, cur) => push(d, [...cur, full]))
      /* DRAWING UNHIDES. Committing a stroke while the ink is hidden would put the
         presenter in the one state where the tool does nothing visible and the
         reason why is off screen, so the act of drawing cancels the hide. */
      setHiddenState(false)
    },
    [edit],
  )

  const eraseIds = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return
      edit((d, cur) => {
        const gone = new Set(ids)
        const next = cur.filter((s) => !gone.has(s.id))
        /* An eraser dragged over blank slide must not fill the history with
           entries that undo to the same picture. */
        if (next.length === cur.length) return d
        return push(d, next)
      })
    },
    [edit],
  )

  const clear = useCallback(() => {
    edit((d, cur) => (cur.length === 0 ? d : push(d, EMPTY)))
  }, [edit])

  const undo = useCallback(() => {
    edit((d) => (d.i === 0 ? d : { stack: d.stack, i: d.i - 1 }))
  }, [edit])

  const redo = useCallback(() => {
    edit((d) => (d.i >= d.stack.length - 1 ? d : { stack: d.stack, i: d.i + 1 }))
  }, [edit])

  return useMemo(
    () => ({
      active, setActive, toggle,
      tool, setTool,
      color, setColor, cycleColor,
      width, setWidth, cycleWidth,
      strokes, commit, eraseIds, clear,
      visible: hidden
        ? EMPTY
        : scope === 'deck'
          ? strokes
          : strokes.filter((s) => s.step <= step),
      step,
      hidden, setHidden, toggleHidden,
      scope, setScope, toggleScope,
      undo, redo,
      canUndo: doc.i > 0,
      canRedo: doc.i < doc.stack.length - 1,
      hasInk: strokes.length > 0,
      /* Every document, not just this one. `docs` is a handful of entries and this
         is a boolean short-circuit, so it is cheaper than the render it gates. */
      hasAnyInk: Object.values(docs).some((d) => (d.stack[d.i] ?? EMPTY).length > 0),
    }),
    [
      active, setActive, toggle,
      tool, setTool,
      color, setColor, cycleColor,
      width, setWidth, cycleWidth,
      strokes, commit, eraseIds, clear,
      step, hidden, setHidden, toggleHidden,
      scope, setScope, toggleScope,
      undo, redo, doc, docs,
    ],
  )
}
