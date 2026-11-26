import type { ReactNode } from 'react'
import { accentByTone, colors, type Tone } from '@/design/tokens'

/**
 * Small eyebrow label.
 *
 * THE UPDATED TEMPLATE'S KICKER (user, 2026-10-13; the base template since
 * 2026-10-14): title case, not caps (no `uppercase` class, the text shows as
 * typed), 22px not 15px (the `kicker` token in tailwind.config.ts), and the
 * template's navy #002A4B (`colors.ink`) on light slides instead of the slide's
 * tone. White on dark slides stays. `data-kicker` is what the harnesses find it
 * by; they used to look for `span.uppercase`.
 *
 * NO LEADING ACCENT TICK (content rule 33). The label used to open with a 3px x
 * 24px pill in the tone; it was a second accent competing with the header's
 * gradient bars, and it is gone, with the `gap-2` that spaced it.
 */
export function Kicker({
  children,
  /* Kept so callers still compile; the colour no longer follows the tone. */
  tone: _tone = 'brand',
  onDark = false,
  className = '',
}: {
  children: ReactNode
  tone?: Tone
  onDark?: boolean
  className?: string
}) {
  return (
    <span
      data-kicker
      className={`inline-flex items-center text-kicker ${className}`}
      style={{ color: onDark ? '#FFFFFF' : colors.ink }}
    >
      {children}
    </span>
  )
}

/** Pill badge / chip. */
export function Chip({
  children,
  tone = 'brand',
  solid = false,
  className = '',
}: {
  children: ReactNode
  tone?: Tone
  solid?: boolean
  className?: string
}) {
  const color = accentByTone[tone]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-body-sm font-semibold ${className}`}
      style={
        solid
          ? { background: color, color: '#fff' }
          : { background: `${color}18`, color }
      }
    >
      {children}
    </span>
  )
}

/** Numbered index chip (used by agenda / steps). */
export function NumberBadge({
  n,
  tone = 'brand',
  className = '',
}: {
  n: number | string
  tone?: Tone
  className?: string
}) {
  const color = accentByTone[tone]
  return (
    <span
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl font-heading text-xl font-bold text-white shadow-card-soft ${className}`}
      style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
    >
      {n}
    </span>
  )
}
