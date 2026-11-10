import type { ReactNode } from 'react'
import { Step } from '@/motion/Stepper'
import { iconByName, type IconName } from './icons'

type CalloutKind = 'note' | 'tip' | 'info' | 'warning' | 'success' | 'error'

const KIND: Record<CalloutKind, { color: string; bg: string; icon: IconName; label: string }> = {
  note: { color: '#0B5FFF', bg: '#EAF1FF', icon: 'info', label: 'Note' },
  tip: { color: '#12B5A8', bg: '#E6FAF7', icon: 'bulb', label: 'Tip' },
  info: { color: '#0EA5E9', bg: '#E0F2FE', icon: 'info', label: 'Good to know' },
  warning: { color: '#B45309', bg: '#FEF3C7', icon: 'warning', label: 'Watch out' },
  success: { color: '#15803D', bg: '#DCFCE7', icon: 'check', label: 'Remember' },
  /*
    `error` is the fourth verdict, added alongside `StatusList` so a callout and
    a status row can say the same thing in the same red. `warning` already meant
    "careful, this can bite you"; there was no kind for "this does not work",
    and decks were reaching for `warning` to say it, which flattened the two into
    one colour the room could not tell apart.

    The hexes are `danger.600` / `danger.100` from tailwind.config.ts, matching
    how the other four rows were written.
  */
  error: { color: '#B91C1C', bg: '#FEE2E2', icon: 'cross', label: 'This fails' },
}

/**
 * Highlighted callout / note-point box. The recurring "Note point" element
 * for content slides.
 */
export function Callout({
  kind = 'note',
  title,
  children,
  className = '',
  asStep = true,
  icon,
}: {
  kind?: CalloutKind
  title?: ReactNode
  children: ReactNode
  className?: string
  /**
   * Replace the kind's default glyph inside the icon holder. Used where the
   * callout defines a named product and its own mark is more informative than a
   * generic info glyph. Pass the WHITE variant of any logo: the holder is filled
   * with the kind's colour.
   */
  icon?: ReactNode
  /**
   * When true (default) the callout is a click-revealed build step. Set false
   * to render it immediately alongside the slide's base content — e.g. a quiz
   * hint, which is a thinking aid meant to be visible before the answer.
   */
  asStep?: boolean
}) {
  const k = KIND[kind]
  const Icon = iconByName[k.icon]
  const inner = (
    <>
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white"
        style={{ background: k.color }}
      >
        {icon ?? <Icon width={20} height={20} />}
      </span>
      <div>
        <p className="font-heading text-base font-bold" style={{ color: k.color }}>
          {title ?? k.label}
        </p>
        <div className="mt-1 text-body leading-relaxed text-ink-soft">{children}</div>
      </div>
    </>
  )
  const boxClass = `flex items-start gap-4 rounded-card border-l-[5px] p-5 ${className}`
  const boxStyle = { background: k.bg, borderColor: k.color }

  if (!asStep) {
    return (
      <div className={boxClass} style={boxStyle}>
        {inner}
      </div>
    )
  }
  return (
    <Step dir="up" className={boxClass} style={boxStyle}>
      {inner}
    </Step>
  )
}
