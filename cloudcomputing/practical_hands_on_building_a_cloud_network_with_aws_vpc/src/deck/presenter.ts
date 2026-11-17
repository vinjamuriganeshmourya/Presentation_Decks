import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SLIDE_EDITS } from '../decks/slideEdits'
import { canSaveFile, saveIntoFile } from './fileSave'

/**
 * TWO VIEWS OF ONE DECK (Cloud Computing Fundamentals, 2026-10-22;
 * session-local kit change).
 *
 * PRESENTER is the file an instructor opens: every control, and on top of
 * them three things that change what the deck IS rather than where it is:
 * skipping a slide, deleting one, and editing the words on one. All three
 * are kept per deck in `localStorage`, so they survive a reload and a
 * fullscreen toggle, and they are what the Download button bakes into the
 * STUDENT file.
 *
 * STUDENT is that downloaded file: the deck as the presenter finalised it,
 * skipped and deleted slides gone, edited text in place, and none of the
 * three controls. It reads its state from `window.__DECK_STATE__`, which the
 * download injected, and never from `localStorage`: a student file must show
 * the same deck on every machine it is opened on.
 *
 * The harness flags (`?all`, `?noauto`, `?still`) force the presenter view
 * with NO stored state, and never write any: a harness must never read a
 * human's preference (`initialArrowMode` has the same rule), and a human who
 * opens `?all` must not have their skips wiped by an empty save.
 *
 * EDITS ARE SOURCE, NOT A PREFERENCE (2026-10-27). `localStorage` is one
 * origin's memory: the built file, another port and another machine never saw
 * an edit, so the words "reverted". Edits now live in `decks/slideEdits.ts`.
 * Under `npm run dev` every change is written there (`vite.config.ts`), so the
 * build bakes it in; the harness flags see them too, since they are content
 * now. A built file cannot write its own source, so there an edit is
 * remembered in `localStorage` on top of the baked ones, and Download carries
 * it. In Chrome and Edge the built file saves INTO ITSELF instead (`fileSave.ts`):
 * every edit, skip and delete is written into the open HTML file as a presenter
 * state, so the file that is shared carries them. Edits are undoable (Ctrl+Z, Ctrl+Y / Ctrl+Shift+Z) without touching the
 * saved state of anything else.
 */

export type DeckView = 'presenter' | 'student'

export interface PresenterState {
  /** ids of slides kept in the deck but left out of the presentation */
  skipped: string[]
  /** ids of slides removed from the deck (restorable from the picker) */
  deleted: string[]
  /** per slide id, per text element key (its original words, see `EditLayer`), the edited innerHTML */
  edits: SlideEdits
}

export type SlideEdits = Record<string, Record<string, string>>

/** What the download writes into the student file, or a save writes into the presenter file. */
interface InjectedState {
  view?: string
  /** student file: skipped and deleted together */
  hidden?: string[]
  /** presenter file */
  skipped?: string[]
  deleted?: string[]
  edits?: Record<string, Record<string, string>>
}

declare global {
  interface Window {
    __DECK_STATE__?: InjectedState
  }
}

export const EMPTY_STATE: PresenterState = { skipped: [], deleted: [], edits: {} }

export function slug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'deck'
}

/** The harness flags: `?all`, `?noauto`, `?still`. Same test as `STILL` in the figures. */
export function isHarness(): boolean {
  if (typeof window === 'undefined') return false
  return /[?&](all|noauto|still)(=|&|$)/.test(window.location.search)
}

export function detectView(): DeckView {
  if (typeof window === 'undefined' || isHarness()) return 'presenter'
  if (window.__DECK_STATE__?.view === 'student') return 'student'
  if (new URLSearchParams(window.location.search).get('view') === 'student') return 'student'
  return 'presenter'
}

const storageKey = (title: string) => `nxtwave.deck.${slug(title)}.presenter`

function strings(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}

function editsOf(v: unknown): PresenterState['edits'] {
  const out: PresenterState['edits'] = {}
  if (!v || typeof v !== 'object') return out
  for (const [id, m] of Object.entries(v as Record<string, unknown>)) {
    if (!m || typeof m !== 'object') continue
    const inner: Record<string, string> = {}
    for (const [k, h] of Object.entries(m as Record<string, unknown>)) if (typeof h === 'string') inner[k] = h
    if (Object.keys(inner).length) out[id] = inner
  }
  return out
}

/** The edits saved to source, read once. */
const SOURCE_EDITS: SlideEdits = editsOf(SLIDE_EDITS)
/* which source edits a built file's `localStorage` was written against: a rebuild with new ones starts from them */
const SOURCE_STAMP = JSON.stringify(SOURCE_EDITS)
const DEV = import.meta.env.DEV

/** `over`'s slides and keys on top of `base`'s. */
function mergeEdits(base: SlideEdits, over: SlideEdits): SlideEdits {
  const out: SlideEdits = { ...base }
  for (const [id, m] of Object.entries(over)) out[id] = { ...(out[id] ?? {}), ...m }
  return out
}

const stampOf = (st: PresenterState) => JSON.stringify([st.skipped, st.deleted, st.edits])

/** A built presenter file's own state: what a save into the file left in it, on top of the baked edits. */
function fileState(): PresenterState {
  const s = typeof window !== 'undefined' ? window.__DECK_STATE__ : undefined
  if (!s || s.view !== 'presenter') return { ...EMPTY_STATE, edits: SOURCE_EDITS }
  return { skipped: strings(s.skipped), deleted: strings(s.deleted), edits: mergeEdits(SOURCE_EDITS, editsOf(s.edits)) }
}
const FILE_STATE = fileState()
/* which file state a built file's `localStorage` was written against; moves on with every save into the file */
let fileStamp = stampOf(FILE_STATE)

export function loadState(title: string, view: DeckView): PresenterState {
  if (typeof window === 'undefined' || isHarness()) return { ...EMPTY_STATE, edits: SOURCE_EDITS }
  if (view === 'student') {
    const s = window.__DECK_STATE__
    /* a hidden slide is gone for good in a student file: it is a deletion, never a skip */
    return { skipped: [], deleted: strings(s?.hidden), edits: mergeEdits(SOURCE_EDITS, editsOf(s?.edits)) }
  }
  try {
    const base = DEV ? { ...EMPTY_STATE, edits: SOURCE_EDITS } : FILE_STATE
    const raw = window.localStorage.getItem(storageKey(title))
    if (!raw) return base
    const p = JSON.parse(raw) as Record<string, unknown>
    const local = editsOf(p.edits)
    /*
      DEV: the source file is the truth; edits remembered before it existed are carried into it once.
      BUILT FILE: what this browser saved against this same file is used as it is (so a reset of a
      baked edit stays reset). Against another file (a rebuild, a save elsewhere) the file's state
      leads and this browser's edits are laid on top, so nothing typed here is lost.
    */
    if (DEV) return { skipped: strings(p.skipped), deleted: strings(p.deleted), edits: p.migrated ? SOURCE_EDITS : mergeEdits(local, SOURCE_EDITS) }
    if (p.stamp === fileStamp) return { skipped: strings(p.skipped), deleted: strings(p.deleted), edits: local }
    return { ...base, edits: mergeEdits(base.edits, local) }
  } catch {
    /* file:// with site data blocked, or a hand-edited value: the deck opens whole */
    return DEV ? { ...EMPTY_STATE, edits: SOURCE_EDITS } : FILE_STATE
  }
}

export function saveState(title: string, st: PresenterState) {
  try {
    window.localStorage.setItem(storageKey(title), JSON.stringify({ ...st, migrated: DEV, stamp: DEV ? SOURCE_STAMP : fileStamp }))
  } catch {
    /* not remembering is a lost convenience; throwing would be a blank deck */
  }
}

/** Under `npm run dev`, the edits written to `decks/slideEdits.ts`. `keepalive` lets a save started by a reload finish. */
function saveSource(edits: SlideEdits): Promise<boolean> {
  return fetch('/__deck/edits', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(edits), keepalive: true })
    .then((r) => r.ok)
    .catch(() => false)
}

export interface PresenterActions {
  toggleSkip: (id: string) => void
  remove: (id: string) => void
  restoreAll: () => void
  /** `null` removes the key: the presenter typed the original words back */
  setEdit: (slideId: string, key: string, html: string | null) => void
  resetEdits: (slideId: string) => void
  /** an old position key (`t<n>`) renamed to its words; not an undo step */
  renameEdit: (slideId: string, from: string, to: string) => void
  /** step the edits back or forward; false when there is nothing to step to */
  undo: () => boolean
  redo: () => boolean
}

/* typing into one element within this long is one undo step, not one per letter */
const COALESCE_MS = 1000
const HISTORY_MAX = 200

function without(list: string[], id: string) {
  return list.filter((x) => x !== id)
}

/** The state, remembered per deck in the presenter view and read-only in the student view. */
export function usePresenterState(title: string, view: DeckView): [PresenterState, PresenterActions] {
  const [st, setSt] = useState<PresenterState>(() => loadState(title, view))
  const persist = view === 'presenter' && !isHarness()
  useEffect(() => {
    if (persist) saveState(title, st)
  }, [persist, title, st])

  /* the source file follows the edits, a beat behind the typing; a pending save is flushed on leaving the page */
  const savedRef = useRef(JSON.stringify(SOURCE_EDITS))
  const pendingRef = useRef<SlideEdits | null>(null)
  useEffect(() => {
    if (!persist || !DEV) return
    const json = JSON.stringify(st.edits)
    if (json === savedRef.current) return
    pendingRef.current = st.edits
    const flush = () => {
      const e = pendingRef.current
      if (!e) return
      pendingRef.current = null
      savedRef.current = JSON.stringify(e)
      void saveSource(e).then((ok) => {
        if (!ok) console.warn('[deck] the edits could not be written to src/decks/slideEdits.ts; they are kept in this browser')
      })
    }
    const t = window.setTimeout(flush, 300)
    window.addEventListener('pagehide', flush)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('pagehide', flush)
    }
  }, [persist, st.edits])

  /*
    THE BUILT FILE SAVES INTO ITSELF (Chrome, Edge; `fileSave.ts`). Every change to the edits, skips or
    deletes rewrites the open file, a beat after the last one; the first asks once for the file. The
    save runs from the change's own click or key press, so the browser allows the dialog.
  */
  useEffect(() => {
    if (!persist || DEV || !canSaveFile()) return
    const stamp = stampOf(st)
    if (stamp === fileStamp) return
    const t = window.setTimeout(() => {
      const pristine = window.__DECK_HTML__
      if (!pristine) return
      void saveIntoFile(() => presenterHtml(pristine, st), true).then((ok) => {
        if (!ok) return
        fileStamp = stamp
        saveState(title, st)
      })
    }, 600)
    return () => window.clearTimeout(t)
  }, [persist, title, st])

  /*
    UNDO AND REDO, edits only. The state is mirrored in a ref so the history is pushed outside the
    state updater (StrictMode runs updaters twice). Typing into the same element within a second is
    one step; a reset of a slide's words is one step too.
  */
  const stRef = useRef(st)
  stRef.current = st
  const past = useRef<SlideEdits[]>([])
  const future = useRef<SlideEdits[]>([])
  const lastStep = useRef({ at: 0, slot: '' })
  const commit = useCallback((edits: SlideEdits, slot: string | null) => {
    const prev = stRef.current.edits
    if (edits === prev) return
    const now = Date.now()
    if (slot === null || slot !== lastStep.current.slot || now - lastStep.current.at > COALESCE_MS) {
      past.current.push(prev)
      if (past.current.length > HISTORY_MAX) past.current.shift()
    }
    lastStep.current = { at: now, slot: slot ?? '' }
    future.current = []
    stRef.current = { ...stRef.current, edits }
    setSt((s) => ({ ...s, edits }))
  }, [])
  const step = useCallback((from: { current: SlideEdits[] }, to: { current: SlideEdits[] }) => {
    const target = from.current.pop()
    if (!target) return false
    to.current.push(stRef.current.edits)
    lastStep.current = { at: 0, slot: '' }
    stRef.current = { ...stRef.current, edits: target }
    setSt((s) => ({ ...s, edits: target }))
    return true
  }, [])
  const undo = useCallback(() => step(past, future), [step])
  const redo = useCallback(() => step(future, past), [step])

  const toggleSkip = useCallback((id: string) => {
    setSt((s) => ({ ...s, skipped: s.skipped.includes(id) ? without(s.skipped, id) : [...s.skipped, id] }))
  }, [])
  const remove = useCallback((id: string) => {
    setSt((s) => ({ ...s, skipped: without(s.skipped, id), deleted: s.deleted.includes(id) ? s.deleted : [...s.deleted, id] }))
  }, [])
  const restoreAll = useCallback(() => {
    setSt((s) => (s.deleted.length ? { ...s, deleted: [] } : s))
  }, [])
  const setEdit = useCallback(
    (slideId: string, key: string, html: string | null) => {
      const cur = stRef.current.edits
      if ((cur[slideId]?.[key] ?? null) === html) return
      const slide = { ...(cur[slideId] ?? {}) }
      if (html === null) delete slide[key]
      else slide[key] = html
      const edits = { ...cur }
      if (Object.keys(slide).length) edits[slideId] = slide
      else delete edits[slideId]
      commit(edits, `${slideId}\u0000${key}`)
    },
    [commit],
  )
  const resetEdits = useCallback(
    (slideId: string) => {
      const cur = stRef.current.edits
      if (!cur[slideId]) return
      const edits = { ...cur }
      delete edits[slideId]
      commit(edits, null)
    },
    [commit],
  )
  const renameEdit = useCallback((slideId: string, from: string, to: string) => {
    const cur = stRef.current.edits
    const html = cur[slideId]?.[from]
    if (html === undefined) return
    const slide = { ...cur[slideId] }
    delete slide[from]
    if (!(to in slide)) slide[to] = html
    const edits = { ...cur, [slideId]: slide }
    stRef.current = { ...stRef.current, edits }
    setSt((s) => ({ ...s, edits }))
  }, [])

  const actions = useMemo(
    () => ({ toggleSkip, remove, restoreAll, setEdit, resetEdits, renameEdit, undo, redo }),
    [toggleSkip, remove, restoreAll, setEdit, resetEdits, renameEdit, undo, redo],
  )
  return [st, actions]
}

/* ------------------------------------------------------------------ the download */

/**
 * The student file: the page as built (`pristine.ts`) with the finalised
 * state written into it as the FIRST script, so it is on `window` before the
 * deck's module runs. `<` is escaped in the JSON so an edited text can never
 * close the tag early.
 */
export function studentHtml(pristine: string, st: PresenterState): string {
  return withState(pristine, { view: 'student', hidden: [...st.skipped, ...st.deleted], edits: st.edits })
}

/** The presenter file as it is now: the same page with its skips, deletes and edits in it, every control kept. */
export function presenterHtml(pristine: string, st: PresenterState): string {
  return withState(pristine, { view: 'presenter', skipped: st.skipped, deleted: st.deleted, edits: st.edits })
}

/** The page with `state` as its first script, replacing any state a previous save left in it. */
function withState(pristine: string, state: InjectedState): string {
  /*
    Only the tag itself, and only before the deck's module: the bundle's own source contains this
    function's strings, and a looser pattern once cut 5 MB of code out of the saved file. The JSON in
    the tag never holds a `<`, so `[^<]*` cannot run past it.
  */
  const end = pristine.search(/<script type="module"/i)
  const cut = end >= 0 ? end : pristine.length
  pristine = pristine.slice(0, cut).replace(/<script id="deck-state">window\.__DECK_STATE__=[^<]*<\/script>/g, '') + pristine.slice(cut)
  const json = JSON.stringify(state).replace(/</g, '\\u003c')
  const tag = `<script id="deck-state">window.__DECK_STATE__=${json}</script>`
  const at = pristine.search(/<script[\s>]/i)
  if (at >= 0) return pristine.slice(0, at) + tag + pristine.slice(at)
  const head = pristine.indexOf('</head>')
  return head >= 0 ? pristine.slice(0, head) + tag + pristine.slice(head) : tag + pristine
}

/**
 * Save the student file. From `npm run dev` the captured page still points at
 * `/src/main.tsx`, so the file it saves only plays from the single-file build;
 * that is the build an instructor is handed, so it is the one that matters.
 */
export function downloadStudent(title: string, st: PresenterState): boolean {
  const pristine = typeof window !== 'undefined' ? window.__DECK_HTML__ : undefined
  if (!pristine) return false
  const blob = new Blob([studentHtml(pristine, st)], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${slug(title)}-student-view.html`
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
  return true
}
