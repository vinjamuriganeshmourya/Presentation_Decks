import { useCallback, useEffect, useMemo, useState } from 'react'
import { isHarness, slug } from './presenter'

/**
 * SLIDE COMMENTS (Deployment & Service Models, 2026-10-26; session-local, a
 * trial before it becomes a rule). Modelled on Google Slides' comments:
 *
 *   - a COMMENT is a thread on one slide: the first message plus replies;
 *   - a thread can be RESOLVED (it leaves the list, "Show resolved" brings it
 *     back, "Reopen" puts it back in play) or DELETED (gone, after a confirm);
 *   - every message can be edited or deleted by its menu.
 *
 * PRESENTER VIEW ONLY. Comments are kept in their OWN `localStorage` key,
 * never in `PresenterState`, so `studentHtml()` cannot carry them into the
 * student file even by accident: it serialises the presenter state, and the
 * comments are not in it. The student view never reads this key either.
 *
 * Harness URLs (`?all`, `?noauto`, `?still`) read nothing and write nothing,
 * the same rule `presenter.ts` follows.
 */

export interface CommentMessage {
  id: string
  author: string
  text: string
  /** ms since epoch */
  at: number
  /** set when the text was changed after posting */
  edited?: number
}

export interface CommentThread extends CommentMessage {
  slideId: string
  replies: CommentMessage[]
  resolved: boolean
  resolvedAt?: number
}

export interface CommentActions {
  /** `as` names the author for this comment (the composer's name field), else the remembered name */
  add: (slideId: string, text: string, as?: string) => void
  reply: (threadId: string, text: string) => void
  /** `replyId` null edits the thread's first message */
  edit: (threadId: string, replyId: string | null, text: string) => void
  /** `replyId` null deletes the whole thread */
  remove: (threadId: string, replyId: string | null) => void
  setResolved: (threadId: string, resolved: boolean) => void
  setAuthor: (name: string) => void
}

const keyOf = (title: string) => `nxtwave.deck.${slug(title)}.comments`
const AUTHOR_KEY = 'nxtwave.deck.comment-author'

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`

function isMessage(v: unknown): v is CommentMessage {
  const m = v as CommentMessage
  return !!m && typeof m.id === 'string' && typeof m.text === 'string' && typeof m.author === 'string' && typeof m.at === 'number'
}

function load(title: string): CommentThread[] {
  if (typeof window === 'undefined' || isHarness()) return []
  try {
    const raw = window.localStorage.getItem(keyOf(title))
    if (!raw) return []
    const list = JSON.parse(raw)
    if (!Array.isArray(list)) return []
    return list
      .filter((t) => isMessage(t) && typeof (t as CommentThread).slideId === 'string')
      .map((t: CommentThread) => ({ ...t, resolved: !!t.resolved, replies: Array.isArray(t.replies) ? t.replies.filter(isMessage) : [] }))
  } catch {
    return []
  }
}

function loadAuthor(): string {
  try {
    return window.localStorage.getItem(AUTHOR_KEY) || ''
  } catch {
    return ''
  }
}

/** The comment threads of this deck, for the presenter view; `enabled` false (student view, harness) is an empty, inert list. */
export function useComments(title: string, enabled: boolean): [CommentThread[], string, CommentActions] {
  const [threads, setThreads] = useState<CommentThread[]>(() => (enabled ? load(title) : []))
  const [author, setAuthorState] = useState<string>(() => (enabled && !isHarness() ? loadAuthor() : ''))
  const persist = enabled && !isHarness()

  useEffect(() => {
    if (!persist) return
    try {
      window.localStorage.setItem(keyOf(title), JSON.stringify(threads))
    } catch {
      /* storage blocked: comments live for this page load only */
    }
  }, [persist, title, threads])

  const name = author.trim() || 'Presenter'

  const add = useCallback(
    (slideId: string, text: string, as?: string) => {
      const t = text.trim()
      if (!t) return
      const by = as?.trim() || name
      setThreads((s) => [...s, { id: uid(), slideId, author: by, text: t, at: Date.now(), replies: [], resolved: false }])
    },
    [name],
  )
  const reply = useCallback(
    (threadId: string, text: string) => {
      const t = text.trim()
      if (!t) return
      /* Google Slides: replying to a resolved thread reopens it */
      setThreads((s) => s.map((th) => (th.id === threadId ? { ...th, resolved: false, resolvedAt: undefined, replies: [...th.replies, { id: uid(), author: name, text: t, at: Date.now() }] } : th)))
    },
    [name],
  )
  const edit = useCallback((threadId: string, replyId: string | null, text: string) => {
    const t = text.trim()
    if (!t) return
    setThreads((s) =>
      s.map((th) => {
        if (th.id !== threadId) return th
        if (replyId === null) return { ...th, text: t, edited: Date.now() }
        return { ...th, replies: th.replies.map((r) => (r.id === replyId ? { ...r, text: t, edited: Date.now() } : r)) }
      }),
    )
  }, [])
  const remove = useCallback((threadId: string, replyId: string | null) => {
    setThreads((s) => (replyId === null ? s.filter((th) => th.id !== threadId) : s.map((th) => (th.id === threadId ? { ...th, replies: th.replies.filter((r) => r.id !== replyId) } : th))))
  }, [])
  const setResolved = useCallback((threadId: string, resolved: boolean) => {
    setThreads((s) => s.map((th) => (th.id === threadId ? { ...th, resolved, resolvedAt: resolved ? Date.now() : undefined } : th)))
  }, [])
  const setAuthor = useCallback(
    (n: string) => {
      setAuthorState(n)
      if (!persist) return
      try {
        window.localStorage.setItem(AUTHOR_KEY, n)
      } catch {
        /* ignore */
      }
    },
    [persist],
  )

  const actions = useMemo(() => ({ add, reply, edit, remove, setResolved, setAuthor }), [add, reply, edit, remove, setResolved, setAuthor])
  return [threads, author, actions]
}

/** "Just now", "5 min ago", "2 hours ago", then the date (Google Slides' own ladder). */
export function when(at: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - at) / 1000))
  if (s < 45) return 'Just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`
  const d = new Date(at)
  const sameYear = d.getFullYear() === new Date(now).getFullYear()
  return d.toLocaleDateString(undefined, sameYear ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}
