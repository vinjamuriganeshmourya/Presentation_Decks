import { useCallback, useEffect, useMemo, useState } from 'react'

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
 */

export type DeckView = 'presenter' | 'student'

export interface PresenterState {
  /** ids of slides kept in the deck but left out of the presentation */
  skipped: string[]
  /** ids of slides removed from the deck (restorable from the picker) */
  deleted: string[]
  /** per slide id, per text element key (`t<n>`, see `EditLayer`), the edited innerHTML */
  edits: Record<string, Record<string, string>>
}

/** What the download writes into the student file. */
interface InjectedState {
  view?: string
  hidden?: string[]
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

export function loadState(title: string, view: DeckView): PresenterState {
  if (typeof window === 'undefined' || isHarness()) return EMPTY_STATE
  if (view === 'student') {
    const s = window.__DECK_STATE__
    /* a hidden slide is gone for good in a student file: it is a deletion, never a skip */
    return { skipped: [], deleted: strings(s?.hidden), edits: editsOf(s?.edits) }
  }
  try {
    const raw = window.localStorage.getItem(storageKey(title))
    if (!raw) return EMPTY_STATE
    const p = JSON.parse(raw) as Record<string, unknown>
    return { skipped: strings(p.skipped), deleted: strings(p.deleted), edits: editsOf(p.edits) }
  } catch {
    /* file:// with site data blocked, or a hand-edited value: the deck opens whole */
    return EMPTY_STATE
  }
}

export function saveState(title: string, st: PresenterState) {
  try {
    window.localStorage.setItem(storageKey(title), JSON.stringify(st))
  } catch {
    /* not remembering is a lost convenience; throwing would be a blank deck */
  }
}

export interface PresenterActions {
  toggleSkip: (id: string) => void
  remove: (id: string) => void
  restoreAll: () => void
  /** `null` removes the key: the presenter typed the original words back */
  setEdit: (slideId: string, key: string, html: string | null) => void
  resetEdits: (slideId: string) => void
}

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

  const toggleSkip = useCallback((id: string) => {
    setSt((s) => ({ ...s, skipped: s.skipped.includes(id) ? without(s.skipped, id) : [...s.skipped, id] }))
  }, [])
  const remove = useCallback((id: string) => {
    setSt((s) => ({ ...s, skipped: without(s.skipped, id), deleted: s.deleted.includes(id) ? s.deleted : [...s.deleted, id] }))
  }, [])
  const restoreAll = useCallback(() => {
    setSt((s) => (s.deleted.length ? { ...s, deleted: [] } : s))
  }, [])
  const setEdit = useCallback((slideId: string, key: string, html: string | null) => {
    setSt((s) => {
      const slide = { ...(s.edits[slideId] ?? {}) }
      if (html === null) delete slide[key]
      else slide[key] = html
      const edits = { ...s.edits }
      if (Object.keys(slide).length) edits[slideId] = slide
      else delete edits[slideId]
      return { ...s, edits }
    })
  }, [])
  const resetEdits = useCallback((slideId: string) => {
    setSt((s) => {
      if (!s.edits[slideId]) return s
      const edits = { ...s.edits }
      delete edits[slideId]
      return { ...s, edits }
    })
  }, [])

  const actions = useMemo(() => ({ toggleSkip, remove, restoreAll, setEdit, resetEdits }), [toggleSkip, remove, restoreAll, setEdit, resetEdits])
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
  const state: InjectedState = { view: 'student', hidden: [...st.skipped, ...st.deleted], edits: st.edits }
  const json = JSON.stringify(state).replace(/</g, '\\u003c')
  const tag = `<script>window.__DECK_STATE__=${json}</script>`
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
