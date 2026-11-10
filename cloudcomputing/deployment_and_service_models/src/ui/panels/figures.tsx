import type { ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { CODE_BG, CODE_BORDER, SYNTAX } from '@/ui/pseudocode/pseudoText'

/**
 * Small static figures from PF 14 "For Loop". Each draws one shape the deck
 * explains in words beside it.
 */

/* ------------------------------------------------------------------ PseudoShape */

/**
 * The SHAPE of a loop, in the kit's dark pseudocode panel: its header line, and
 * the indented block it repeats, drawn as a dashed placeholder because the block
 * is "whatever goes here", not code. The loop-back arrow is the repetition.
 *
 * Colours are `pseudoText`'s own palette (control flow mauve, declared names
 * light blue, the rest plain) on the same `night-2` ground as `CodeBlock`: the
 * user asked for pseudocode boxes to be dark (PF 14, 2026-09-29), and a shape
 * that sits next to real code must not look like a different kind of thing.
 */
export type PseudoToken = { t: string; k?: 'control' | 'ident' | 'plain' }

export function PseudoShape({
  head,
  block,
  title = 'Pseudocode',
}: {
  head: PseudoToken[]
  block: ReactNode
  title?: string
}) {
  const ink = { control: SYNTAX.control, ident: SYNTAX.ident, plain: SYNTAX.plain } as const
  return (
    <div className="overflow-hidden rounded-card shadow-card" style={{ background: CODE_BG, boxShadow: `inset 0 0 0 1px ${CODE_BORDER}` }}>
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
        <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
        <span className="h-3 w-3 rounded-full bg-[#28C840]" />
        <span className="ml-2 font-mono text-body-sm text-white/60">{title}</span>
      </div>
      <div className="relative py-5 pl-14 pr-7">
        {/* loop-back arrow: from the block, back up to the header line */}
        <span
          aria-hidden
          className="absolute"
          style={{ left: 22, top: 38, width: 16, height: 76, border: `2px dashed ${colors.accent}`, borderRight: 0, borderRadius: '8px 0 0 8px' }}
        >
          <span
            className="absolute"
            style={{ right: -9, top: -6, width: 10, height: 11, background: colors.accent, clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }}
          />
        </span>
        <p className="whitespace-nowrap font-mono text-[24px] font-bold leading-[1.5]">
          {head.map((tk, i) => (
            <span key={i} style={{ color: ink[tk.k ?? 'plain'] }}>{tk.t}</span>
          ))}
        </p>
        <div className="mt-3 flex h-[76px]">
          <span className="w-12 shrink-0 rounded-l-lg" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <span
            className="grid flex-1 place-items-center rounded-r-xl font-mono text-[20px]"
            style={{ border: '2px dashed rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.72)' }}
          >
            {/* the text in its own line box, so a harness reads one line, not 76px */}
            <span className="leading-normal">{block}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ arrows */

function VArrow({ up = false, height = 56 }: { up?: boolean; height?: number }) {
  return (
    <span className="relative block w-[2px]" style={{ height, background: colors.success }}>
      <span
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          [up ? 'top' : 'bottom']: -10,
          width: 16,
          height: 12,
          background: colors.success,
          clipPath: up ? 'polygon(50% 0, 100% 100%, 0 100%)' : 'polygon(0 0, 100% 0, 50% 100%)',
        }}
      />
    </span>
  )
}

function HArrow({ width = 90 }: { width?: number }) {
  return (
    <span className="relative block h-[2px]" style={{ width, background: colors.danger }}>
      <span
        className="absolute top-1/2 -translate-y-1/2"
        style={{ right: -12, width: 14, height: 16, background: colors.danger, clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }}
      />
    </span>
  )
}

/* ------------------------------------------------------------------ RangeCall */

/**
 * A call to `range`, big, with what each argument means pointed at from above
 * or below. For "range(n): stops before n" and "range(start, end)".
 */
export function RangeCall({ call, above, below }: { call: ReactNode; above?: ReactNode; below?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {above && (
        <>
          <p className="text-body-lg" style={{ color: colors.body }}>{above}</p>
          <VArrow up height={52} />
        </>
      )}
      <p className="font-mono text-[44px] font-semibold leading-tight" style={{ color: colors.brandDark }}>{call}</p>
      {below && (
        <>
          <VArrow height={52} />
          <p className="text-body-lg" style={{ color: colors.body }}>{below}</p>
        </>
      )}
    </div>
  )
}

/** The parts of a call, coloured: `P` punctuation, `A` an argument. */
export const RangeArg = ({ children, tone = colors.danger }: { children: ReactNode; tone?: string }) => (
  <span style={{ color: tone }}>{children}</span>
)
export const RangePunct = ({ children }: { children: ReactNode }) => <span style={{ color: '#7C3AED' }}>{children}</span>

/* ------------------------------------------------------------------ RangeCells */

/** A call and the numbers it gives, as cells in a row. */
export function RangeCells({ call, values }: { call: ReactNode; values: ReactNode[] }) {
  return (
    <div className="flex items-center justify-center gap-8">
      <p className="font-mono text-[44px] font-semibold" style={{ color: colors.brandDark }}>{call}</p>
      <HArrow />
      <div className="ml-3 flex">
        {values.map((v, i) => (
          <span
            key={i}
            className="-ml-[2px] grid h-[76px] w-[76px] place-items-center bg-white font-mono text-[34px] font-semibold first:ml-0 first:rounded-l-xl last:rounded-r-xl"
            style={{ color: colors.brandDark, boxShadow: `inset 0 0 0 2px #C9D8F5, 0 8px 18px rgba(1,70,199,.06)` }}
          >
            {v}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ CrossList */

/** What a new form makes unnecessary: a heading, then each thing crossed off. */
export function CrossList({ heading, items }: { heading: ReactNode; items: ReactNode[] }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-heading text-[22px] font-bold text-ink">{heading}</p>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-3 self-start rounded-xl bg-white px-4 py-3 text-[19px] font-semibold text-ink shadow-card-soft ring-1 ring-line">
          <span className="grid h-7 w-7 place-items-center rounded-lg font-bold" style={{ background: `${colors.danger}1a`, color: colors.danger }}>
            ×
          </span>
          {it}
        </span>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ OptionList */

/** Lettered answer options for a question on screen: A, B, C, D. */
export function OptionList({ options }: { options: ReactNode[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {options.map((o, i) => (
        <li key={i} className="flex items-center gap-4 font-mono text-[21px] text-ink">
          <span className="font-heading text-[20px] font-bold" style={{ color: colors.muted }}>
            {String.fromCharCode(65 + i)}
          </span>
          {o}
        </li>
      ))}
    </ul>
  )
}

/* ------------------------------------------------------------------ Row */

/**
 * Two or more blocks side by side, top-aligned, a fixed gap apart. The one
 * layout a zoned body needs that the kit had no name for: a code box on the
 * left at x 64, and what goes with it to its right.
 */
export function Row({
  children,
  gap = 40,
  align = 'start',
  justify = 'start',
}: {
  children: ReactNode
  gap?: number
  align?: 'start' | 'center'
  justify?: 'start' | 'center'
}) {
  return (
    <div
      className={`flex ${align === 'center' ? 'items-center' : 'items-start'} ${justify === 'center' ? 'justify-center' : ''}`}
      style={{ gap }}
    >
      {children}
    </div>
  )
}
