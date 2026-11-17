import type { ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useTween } from './beats'

/**
 * The small parts a code trace is drawn with, shared by every trace panel.
 */

/**
 * One variable and every value it has held, oldest first.
 *
 * The replaced values stay on screen, GREYED: a box that swaps its contents
 * hides the one thing a trace is for. They used to be struck through as well,
 * and the user read the line across the letters as a rendering glitch
 * (PF 14, 2026-09-29), so a replaced value is now faded and nothing else.
 */
export function VarTrail({
  name,
  values,
  empty = 'not set yet',
}: {
  name: ReactNode
  values: ReactNode[]
  empty?: ReactNode
}) {
  return (
    <div className="flex min-h-[48px] flex-nowrap items-center gap-2">
      <span className="w-[62px] shrink-0 font-mono text-[18px] font-semibold" style={{ color: colors.body }}>
        {name}
      </span>
      {values.length === 0 ? (
        <span className="text-[17px]" style={{ color: colors.muted }}>{empty}</span>
      ) : (
        values.map((v, i) => {
          const cur = i === values.length - 1
          return (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span style={{ color: colors.muted }}>→</span>}
              <span
                className="rounded-lg px-3 py-1 font-mono text-[20px] font-semibold"
                style={
                  cur
                    ? { background: colors.surface2, color: colors.brandDark, boxShadow: `inset 0 0 0 2px ${colors.brand}66` }
                    : { background: colors.surface, color: colors.muted, opacity: 0.55, boxShadow: `inset 0 0 0 2px ${colors.line}` }
                }
              >
                {v}
              </span>
            </span>
          )
        })
      )}
    </div>
  )
}

/**
 * A sequence drawn as boxes, one per item. An item the loop has taken is GONE,
 * not greyed: a grey ghost is the misconception this exists to fix. When every
 * box is gone, "nothing left" says so.
 */
export function SeqBoxes({
  items,
  taken,
  current,
  shown = true,
  drained = false,
  emptyLabel = 'nothing left',
}: {
  items: string[]
  /** Indices already taken. */
  taken: Set<number>
  current?: number
  shown?: boolean
  drained?: boolean
  emptyLabel?: ReactNode
}) {
  const tween = useTween(360)
  return (
    <div className="relative flex h-[64px] items-center gap-2">
      {items.map((c, i) => {
        const gone = taken.has(i) && i !== current
        return (
          <span
            key={i}
            className="grid h-[56px] w-[48px] place-items-center rounded-xl bg-white font-mono text-[26px] font-semibold"
            style={{
              transition: tween,
              color: colors.ink,
              boxShadow: `inset 0 0 0 2px ${i === current ? colors.brand : colors.line}`,
              opacity: shown && !gone ? 1 : 0,
              transform: !shown ? 'translateY(-10px) scale(0.94)' : gone ? 'scale(0.72)' : 'none',
            }}
          >
            {c}
          </span>
        )
      })}
      <span
        className="absolute -top-7 left-0 font-body text-[17px] font-bold"
        style={{ transition: tween, opacity: shown && drained ? 1 : 0, color: colors.danger }}
      >
        {emptyLabel}
      </span>
    </div>
  )
}

/** A tiny key: swatch, label. For the three line states a trace uses. */
export function TraceKey({ items }: { items: { swatch: 'ran' | 'now' | 'dead'; label: ReactNode }[] }) {
  const look = {
    ran: { background: colors.night2, boxShadow: 'inset 0 0 0 20px rgba(255,255,255,0.10)' },
    now: { background: colors.night2, boxShadow: 'inset 0 0 0 20px rgba(11,95,255,0.55)' },
    dead: { background: colors.night2, opacity: 0.3 },
  } as const
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[16px]" style={{ color: colors.muted }}>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-2">
          <span className="inline-block h-[16px] w-[16px] rounded" style={look[it.swatch]} />
          {it.label}
        </span>
      ))}
    </p>
  )
}

/** The caption under a trace: one bold lead-in, then the sentence. */
export function TraceCaption({ children, tone = 'brand' }: { children: ReactNode; tone?: 'brand' | 'warn' }) {
  const bar = tone === 'warn' ? colors.warning : colors.brand
  return (
    <p
      className="rounded-card px-5 py-3 text-[19px] leading-snug shadow-card-soft [&_b]:font-bold [&_b]:text-ink"
      style={{
        boxShadow: `inset 3px 0 0 ${bar}, 0 1px 2px rgba(11,26,43,.04)`,
        background: tone === 'warn' ? '#FFF8EC' : colors.white,
        color: colors.body,
      }}
    >
      {children}
    </p>
  )
}

/**
 * A row of numbered tiles a loop walks, each with what happened on it
 * ("+1", "skip"). Tiles already walked show their result; the one on now is
 * ringed; the rest wait, faded.
 */
export function DayTrack({
  label,
  days,
  reached,
  current,
}: {
  label: ReactNode
  days: { n: ReactNode; tag: ReactNode; skip?: boolean }[]
  /** How many tiles have been walked. */
  reached: number
  /** The tile on now, 0-based, or none. */
  current?: number
}) {
  const tween = useTween(300)
  return (
    <div className="flex items-center gap-2">
      <span className="w-[62px] shrink-0 font-mono text-[18px] font-semibold" style={{ color: colors.body }}>{label}</span>
      {days.map((d, i) => {
        const on = i < reached
        const now = i === current
        return (
          <span
            key={i}
            className="flex h-[58px] w-[48px] flex-col items-center justify-center rounded-xl bg-white"
            style={{
              transition: tween,
              opacity: on ? 1 : 0.45,
              boxShadow: `inset 0 0 0 2px ${now ? colors.brand : colors.line}`,
              background: now ? colors.surface2 : colors.white,
            }}
          >
            <b className="font-mono text-[20px] leading-none" style={{ color: colors.ink }}>{d.n}</b>
            <i className="mt-1 text-[16px] font-bold not-italic leading-none" style={{ transition: tween, opacity: on ? 1 : 0, color: d.skip ? colors.muted : '#B07A00' }}>
              {d.tag}
            </i>
          </span>
        )
      })}
    </div>
  )
}

/** A value with a short note pinned beside it: `range(1, 1)` [no numbers]. */
export function CallChip({ call, note, tone = colors.danger }: { call: ReactNode; note: ReactNode; tone?: string }) {
  return (
    <p className="flex items-center gap-3">
      <span className="font-mono text-[24px] font-semibold" style={{ color: colors.brandDark }}>{call}</span>
      <span className="rounded-lg px-3 py-1 text-[16px] font-bold" style={{ border: `2px dashed ${tone}`, color: tone }}>{note}</span>
    </p>
  )
}
