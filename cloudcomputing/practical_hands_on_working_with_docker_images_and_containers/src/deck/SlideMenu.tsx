import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { SlideDef } from './types'
import { colors } from '@/design/tokens'

/**
 * THE SLIDE LIST BEHIND THE COUNTER (Cloud Computing Fundamentals,
 * 2026-10-22; session-local kit change).
 *
 * The grid picker (`G`) is a search over thumbnails and takes the whole
 * stage. This is the other thing a presenter asks for: "show me the list",
 * one line per slide, number and title, opened from the number they are
 * already looking at, without leaving the slide. It lists the ACTIVE deck
 * (skipped and deleted slides are not in it), so its numbers are the
 * counter's numbers, and it is the one jump control the student file keeps.
 *
 * Up and Down move a cursor, Enter goes, Escape and a press anywhere else
 * close it; the deck's own keys are off while it is open, as they are for
 * the picker. Never in the DOM unless open, for the same reason the picker
 * is not. Reduced motion: it fades.
 */
export function SlideMenu({
  slides,
  index,
  onPick,
  onClose,
}: {
  slides: SlideDef[]
  index: number
  onPick: (i: number) => void
  onClose: () => void
}) {
  const reduce = useReducedMotion()
  const [cursor, setCursor] = useState(index)
  const box = useRef<HTMLDivElement>(null)
  const row = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    row.current?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          onClose()
          break
        case 'Enter':
          e.preventDefault()
          onPick(cursor)
          break
        case 'ArrowDown':
          e.preventDefault()
          setCursor((c) => Math.min(c + 1, slides.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setCursor((c) => Math.max(c - 1, 0))
          break
        case 'Home':
          e.preventDefault()
          setCursor(0)
          break
        case 'End':
          e.preventDefault()
          setCursor(slides.length - 1)
          break
      }
    }
    /* a press outside closes it; the counter itself toggles, so it is left to its own click */
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element | null
      if (!t || box.current?.contains(t) || t.closest('[data-menu-toggle]')) return
      onClose()
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown, true)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown, true)
    }
  }, [cursor, slides.length, onPick, onClose])

  return (
    <motion.div
      ref={box}
      role="listbox"
      aria-label="Slides"
      className="absolute bottom-[68px] left-5 z-40 flex w-[380px] max-h-[60%] flex-col overflow-hidden rounded-card bg-white/95 ring-1 ring-muted/20 backdrop-blur"
      style={{ boxShadow: '0 12px 32px -12px rgba(0, 37, 75, 0.35)' }}
      initial={{ opacity: 0, y: reduce ? 0 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduce ? 0 : 6 }}
      transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="flex shrink-0 items-baseline justify-between border-b border-muted/15 px-4 py-2.5">
        <span className="font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Slides</span>
        <span className="font-mono text-[11px] text-muted/80">
          {index + 1} / {slides.length} · enter to go · esc to close
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {slides.map((s, i) => {
          const here = i === index
          const on = i === cursor
          return (
            <button
              key={s.id}
              ref={on ? row : undefined}
              type="button"
              role="option"
              aria-selected={here}
              onClick={() => onPick(i)}
              onPointerEnter={() => setCursor(i)}
              className={`flex w-full items-baseline gap-3 px-4 py-1.5 text-left transition-colors ${on ? 'bg-brand/10' : ''}`}
            >
              <span className="w-7 shrink-0 font-mono text-[11.5px] font-semibold tabular-nums" style={{ color: here ? colors.brand : colors.muted }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0 flex-1 truncate font-heading text-[13.5px] font-semibold" style={{ color: here ? colors.brand : colors.ink }}>
                {s.label ?? s.id}
              </span>
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}
