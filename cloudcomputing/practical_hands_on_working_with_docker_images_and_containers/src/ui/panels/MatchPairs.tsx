import type { ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { StepControls, useCount, useTween } from './beats'

/**
 * MATCH THE PAIRS — parts on the left, jobs on the right, joined one at a time.
 *
 * From PF 14 "For Loop" (the while-loop recap). The room calls out which two go
 * together BEFORE the press; each press then numbers one pair on both sides, in
 * that pair's colour, and adds the line that explains it. The right column is
 * deliberately not in the left column's order, or there would be nothing to
 * call out.
 *
 * Opens at 0 of n: nothing is joined when the slide lands.
 */
const PAIR = [colors.brand, colors.success, colors.accent, colors.info] as const

export interface MatchItem {
  /** Which pair this card belongs to, 1-based. */
  pair: number
  text: ReactNode
}

export function MatchPairs({
  left,
  right,
  notes,
  mono = true,
  buttonLabel = 'Join them',
}: {
  left: MatchItem[]
  /** In the order shown, which should NOT be the left column's order. */
  right: MatchItem[]
  /** One line per pair, in pair order, added as that pair is joined. */
  notes: ReactNode[]
  /** Set the left column in the mono face (code on the left). */
  mono?: boolean
  buttonLabel?: string
}) {
  const total = notes.length
  const at = useCount(total)
  const tween = useTween()

  const card = (it: MatchItem, isCode: boolean, key: string) => {
    const on = it.pair <= at
    const tone = PAIR[(it.pair - 1) % PAIR.length]
    return (
      <div
        key={key}
        className="flex min-h-[64px] items-center gap-4 rounded-card bg-white px-5 py-3 shadow-card-soft"
        style={{
          transition: tween,
          boxShadow: on ? `inset 0 0 0 2px ${tone}` : `inset 0 0 0 1px ${colors.line}`,
          background: on ? `${tone}0f` : colors.white,
        }}
      >
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full font-heading text-body-sm font-bold"
          style={{
            transition: tween,
            background: on ? tone : colors.surface2,
            color: on ? colors.white : 'transparent',
          }}
        >
          {it.pair}
        </span>
        <span className={isCode && mono ? 'font-mono text-[20px] text-ink' : 'text-[19px] leading-snug text-ink'}>
          {it.text}
        </span>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {left.map((l, i) => [card(l, true, `l${i}`), card(right[i], false, `r${i}`)])}
      </div>
      <div className="mt-5 flex flex-col gap-2.5">
        {notes.map((n, i) => (
          <p
            key={i}
            className="text-[18px] leading-snug"
            style={{
              transition: tween,
              opacity: i < at ? 1 : 0,
              transform: i < at ? 'none' : 'translateY(6px)',
              paddingLeft: 12,
              boxShadow: `inset 3px 0 0 ${PAIR[i % PAIR.length]}`,
              color: colors.body,
            }}
          >
            {n}
          </p>
        ))}
      </div>
      <StepControls at={at} first={0} total={total} nextLabel={buttonLabel} />
    </>
  )
}
