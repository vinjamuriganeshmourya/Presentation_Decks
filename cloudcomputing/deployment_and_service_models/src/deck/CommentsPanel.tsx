import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import type { SlideDef } from './types'
import { when, type CommentActions, type CommentThread } from './comments'

/**
 * THE COMMENTS PANEL (2026-10-26, session-local trial; `comments.ts` has the
 * model). Google Slides' comment experience, on the right of the slide:
 *
 *   header      Comments · this slide or all slides · show resolved · close
 *   + Comment   opens a composer card at the top (Ctrl+Enter posts, Esc cancels)
 *   a thread    avatar, name, time, text; a tick resolves it; the ⋮ menu edits
 *               or deletes it; clicking the card opens its reply box
 *   resolved    hidden unless "Show resolved", greyed, with Reopen
 *   all slides  threads grouped by slide, the slide chip jumps to that slide
 *
 * Drawn in screen pixels beside the stage (never inside it), so it never
 * covers or rescales a slide's content: the stage simply fits the room left.
 * Rendered only in the presenter view, and never in fullscreen (Deck.tsx).
 */

const AVATAR = ['#2D63FB', '#12B5A8', '#F59E0B', '#7C3AED', '#E11D48', '#16A34A']
function hue(name: string) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return AVATAR[h % AVATAR.length]
}

function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <span aria-hidden className="grid shrink-0 place-items-center rounded-full font-heading font-semibold text-white" style={{ width: size, height: size, fontSize: size * 0.44, background: hue(name) }}>
      {(name.trim()[0] || 'P').toUpperCase()}
    </span>
  )
}

/** Ctrl/Cmd+Enter submits, Esc cancels: Google Slides' composer keys. */
function keys(submit: () => void, cancel: () => void) {
  return (e: KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation()
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      submit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancel()
    }
  }
}

function Composer({ placeholder, submitLabel, initial = '', onSubmit, onCancel, autoFocus = true }: { placeholder: string; submitLabel: string; initial?: string; onSubmit: (text: string) => void; onCancel: () => void; autoFocus?: boolean }) {
  const [text, setText] = useState(initial)
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (autoFocus) ref.current?.focus()
  }, [autoFocus])
  /* the box grows with what is typed, up to six lines */
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }, [text])
  const submit = () => {
    if (!text.trim()) return
    onSubmit(text)
    setText('')
  }
  return (
    <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
      <textarea
        ref={ref}
        value={text}
        rows={2}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={keys(submit, onCancel)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full resize-none rounded-lg border border-line bg-white px-3 py-2 text-[14px] leading-snug text-ink outline-none placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/15"
      />
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-pill px-3 py-1.5 text-[13px] font-semibold text-brand hover:bg-brand/10">
          Cancel
        </button>
        <button type="button" onClick={submit} disabled={!text.trim()} className="rounded-pill bg-brand px-4 py-1.5 text-[13px] font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-muted/30">
          {submitLabel}
        </button>
      </div>
    </div>
  )
}

/** The ⋮ menu: Edit, Delete. Closes on any outside press. */
function MoreMenu({ items, label }: { items: { label: string; danger?: boolean; onSelect: () => void }[]; label: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close, true)
    return () => document.removeEventListener('pointerdown', close, true)
  }, [open])
  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <IconBtn label={label} onClick={() => setOpen((o) => !o)} on={open}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <circle cx="12" cy="5" r="1.9" />
          <circle cx="12" cy="12" r="1.9" />
          <circle cx="12" cy="19" r="1.9" />
        </svg>
      </IconBtn>
      {open && (
        <div role="menu" className="absolute right-0 top-8 z-10 min-w-[120px] overflow-hidden rounded-lg bg-white py-1 shadow-lg ring-1 ring-muted/20">
          {items.map((it) => (
            <button
              key={it.label}
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false)
                it.onSelect()
              }}
              className={`block w-full px-4 py-2 text-left text-[14px] hover:bg-muted/10 ${it.danger ? 'text-danger-600' : 'text-ink'}`}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function IconBtn({ label, onClick, children, on = false }: { label: string; onClick: () => void; children: ReactNode; on?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full transition-colors ${on ? 'bg-brand/10 text-brand' : 'text-muted hover:bg-muted/10 hover:text-ink'}`}
    >
      {children}
    </button>
  )
}

/** One message: the thread's first one or a reply, editable in place. */
function Message({ name, at, edited, text, editing, onSave, onCancelEdit, tools }: { name: string; at: number; edited?: number; text: string; editing: boolean; onSave: (t: string) => void; onCancelEdit: () => void; tools: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-2">
        <Avatar name={name} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-semibold text-ink">{name}</div>
          <div className="text-[12px] text-muted">
            {when(at)}
            {edited ? ' · Edited' : ''}
          </div>
        </div>
        {tools}
      </div>
      {editing ? (
        <Composer placeholder="Edit comment" submitLabel="Save" initial={text} onSubmit={onSave} onCancel={onCancelEdit} />
      ) : (
        <p className="whitespace-pre-wrap break-words text-[14px] leading-snug text-ink">{text}</p>
      )}
    </div>
  )
}

function Thread({ th, slideNo, showSlide, selected, onSelect, actions, onJump }: { th: CommentThread; slideNo: number; showSlide: boolean; selected: boolean; onSelect: () => void; actions: CommentActions; onJump: () => void }) {
  /* which message is being edited: 'root', a reply id, or none */
  const [editing, setEditing] = useState<string | null>(null)
  const confirmDelete = (replyId: string | null) => {
    const what = replyId === null ? 'Delete this comment thread?' : 'Delete this reply?'
    if (window.confirm(what)) actions.remove(th.id, replyId)
  }
  const rootTools = th.resolved ? (
    <button type="button" onClick={(e) => { e.stopPropagation(); actions.setResolved(th.id, false) }} className="shrink-0 rounded-pill px-2.5 py-1 text-[12px] font-semibold text-brand hover:bg-brand/10">
      Reopen
    </button>
  ) : (
    <div className="flex shrink-0 items-center">
      <IconBtn label="Mark as resolved and hide discussion" onClick={() => actions.setResolved(th.id, true)}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
          <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </IconBtn>
      <MoreMenu
        label="More options"
        items={[
          { label: 'Edit', onSelect: () => setEditing('root') },
          { label: 'Delete', danger: true, onSelect: () => confirmDelete(null) },
        ]}
      />
    </div>
  )
  return (
    <article
      data-comment-thread={th.id}
      onClick={th.resolved ? undefined : onSelect}
      className={`flex flex-col gap-3 rounded-xl bg-white p-3 transition-shadow ${th.resolved ? 'opacity-70' : 'cursor-pointer'} ${selected ? 'shadow-[0_6px_20px_-8px_rgba(0,37,75,0.35)] ring-2 ring-brand/40' : 'shadow-[0_1px_3px_rgba(0,37,75,0.12)] ring-1 ring-muted/15 hover:shadow-[0_4px_14px_-6px_rgba(0,37,75,0.3)]'}`}
    >
      {(showSlide || th.resolved) && (
        <div className="flex items-center gap-2">
          {showSlide && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onJump() }} className="rounded-pill bg-brand/10 px-2 py-0.5 text-[12px] font-semibold text-brand hover:bg-brand/20">
              Slide {slideNo}
            </button>
          )}
          {th.resolved && <span className="rounded-pill bg-success-100 px-2 py-0.5 text-[12px] font-semibold text-success-600">Resolved</span>}
        </div>
      )}
      <Message
        name={th.author}
        at={th.at}
        edited={th.edited}
        text={th.text}
        editing={editing === 'root'}
        onSave={(t) => { actions.edit(th.id, null, t); setEditing(null) }}
        onCancelEdit={() => setEditing(null)}
        tools={rootTools}
      />
      {th.replies.map((r) => (
        <div key={r.id} className="border-t border-line/70 pt-3">
          <Message
            name={r.author}
            at={r.at}
            edited={r.edited}
            text={r.text}
            editing={editing === r.id}
            onSave={(t) => { actions.edit(th.id, r.id, t); setEditing(null) }}
            onCancelEdit={() => setEditing(null)}
            tools={
              th.resolved ? null : (
                <MoreMenu
                  label="More options for this reply"
                  items={[
                    { label: 'Edit', onSelect: () => setEditing(r.id) },
                    { label: 'Delete', danger: true, onSelect: () => confirmDelete(r.id) },
                  ]}
                />
              )
            }
          />
        </div>
      ))}
      {selected && !th.resolved && editing === null && (
        <div className="border-t border-line/70 pt-3">
          <Composer placeholder="Reply" submitLabel="Reply" onSubmit={(t) => actions.reply(th.id, t)} onCancel={onSelect} autoFocus={false} />
        </div>
      )}
      {!selected && !th.resolved && th.replies.length === 0 && <span className="text-[12px] text-muted">Reply</span>}
    </article>
  )
}

export function CommentsPanel({
  slides,
  index,
  threads,
  author,
  actions,
  composing,
  setComposing,
  onJump,
  onClose,
  overlay,
}: {
  /** the slides in play, in order (so "Slide N" matches the counter) */
  slides: SlideDef[]
  index: number
  threads: CommentThread[]
  author: string
  actions: CommentActions
  composing: boolean
  setComposing: (v: boolean) => void
  onJump: (i: number) => void
  onClose: () => void
  /** small screens: the panel lies over the slide instead of beside it */
  overlay: boolean
}) {
  const [scope, setScope] = useState<'slide' | 'all'>('slide')
  const [showResolved, setShowResolved] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [name, setName] = useState(author)
  const currentId = slides[index]?.id
  const order = useMemo(() => new Map(slides.map((s, i) => [s.id, i])), [slides])

  /* a thread from a slide no longer in play (deleted or skipped) is still listed under "All slides", without a jump */
  const visible = threads
    .filter((t) => (scope === 'slide' ? t.slideId === currentId : true))
    .filter((t) => showResolved || !t.resolved)
    .sort((a, b) => (scope === 'all' ? (order.get(a.slideId) ?? 1e9) - (order.get(b.slideId) ?? 1e9) : 0) || a.at - b.at)
  const openHere = threads.filter((t) => t.slideId === currentId && !t.resolved).length
  const resolvedCount = threads.filter((t) => (scope === 'slide' ? t.slideId === currentId : true) && t.resolved).length

  useEffect(() => setSelected(null), [currentId])

  const post = (text: string) => {
    if (!currentId) return
    if (name.trim() && name.trim() !== author) actions.setAuthor(name.trim())
    actions.add(currentId, text, name)
    setComposing(false)
    setScope('slide')
  }

  return (
    <aside
      data-comments-panel=""
      aria-label="Comments"
      onKeyDown={(e) => e.stopPropagation()}
      className={`flex h-full w-[340px] max-w-full shrink-0 flex-col border-l border-line bg-[#F4F7FD] ${overlay ? 'absolute inset-y-0 right-0 z-40 shadow-2xl' : 'relative'}`}
    >
      <header className="flex shrink-0 flex-col gap-2.5 border-b border-line bg-white px-4 pb-3 pt-3.5">
        <div className="flex items-center gap-2">
          <h2 className="flex-1 font-heading text-[16px] font-semibold text-ink">Comments</h2>
          <IconBtn label="Close comments" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </IconBtn>
        </div>
        <div className="flex items-center gap-2">
          <div role="tablist" className="flex rounded-pill bg-muted/10 p-0.5 text-[12.5px] font-semibold">
            {(['slide', 'all'] as const).map((s) => (
              <button key={s} type="button" role="tab" aria-selected={scope === s} onClick={() => setScope(s)} className={`rounded-pill px-3 py-1 ${scope === s ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>
                {s === 'slide' ? `Slide ${index + 1}` : 'All slides'}
              </button>
            ))}
          </div>
          <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-[12.5px] text-muted">
            <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} className="h-3.5 w-3.5 accent-brand" />
            Show resolved{resolvedCount ? ` (${resolvedCount})` : ''}
          </label>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <div className="flex flex-col gap-2.5">
          {composing ? (
            <div className="flex flex-col gap-2.5 rounded-xl bg-white p-3 shadow-[0_6px_20px_-8px_rgba(0,37,75,0.35)] ring-2 ring-brand/40">
              <div className="flex items-center gap-2">
                <Avatar name={name || 'Presenter'} />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="Your name"
                  aria-label="Your name"
                  className="min-w-0 flex-1 rounded-md border border-transparent px-1.5 py-1 text-[14px] font-semibold text-ink outline-none hover:border-line focus:border-brand"
                />
              </div>
              <Composer placeholder={`Comment on slide ${index + 1}`} submitLabel="Comment" onSubmit={post} onCancel={() => setComposing(false)} />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setComposing(true)}
              className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-brand/40 bg-white px-3 py-2.5 text-[14px] font-semibold text-brand hover:border-brand hover:bg-brand/5"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              Comment on slide {index + 1}
            </button>
          )}

          {visible.map((th) => {
            const i = order.get(th.slideId)
            return (
              <Thread
                key={th.id}
                th={th}
                slideNo={(i ?? -1) + 1}
                showSlide={scope === 'all' && i !== undefined}
                selected={selected === th.id}
                onSelect={() => setSelected((s) => (s === th.id ? null : th.id))}
                actions={actions}
                onJump={() => i !== undefined && onJump(i)}
              />
            )
          })}

          {!visible.length && !composing && (
            <p className="px-2 py-6 text-center text-[13.5px] leading-snug text-muted">
              {scope === 'slide'
                ? openHere === 0 && resolvedCount && !showResolved
                  ? 'All comments on this slide are resolved.'
                  : 'No comments on this slide yet.'
                : 'No comments in this deck yet.'}
            </p>
          )}
        </div>
      </div>
      <footer className="shrink-0 border-t border-line bg-white px-4 py-2 text-[11.5px] text-muted">Presenter only. Not included in the student download. Ctrl+Alt+M adds a comment.</footer>
    </aside>
  )
}
