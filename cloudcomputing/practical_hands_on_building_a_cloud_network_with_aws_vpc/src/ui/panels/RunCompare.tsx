import { useEffect, useRef, useState, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { CodeBlock } from '@/ui/CodeBlock'
import { OutputPanel } from '@/ui/CodeOutput'
import { useInstant } from '@/motion/instant'
import { PanelButton } from './beats'
import { TraceCaption } from './tracePieces'

/**
 * TWO PROGRAMS, ONE n, RUN SIDE BY SIDE — vote first, then run.
 *
 * From PF 14 "For Loop". Two programs a few characters apart, on the same `n`.
 * The room votes by hand first; Run then prints both, row by row. The row the
 * wrong one never prints is drawn as a dashed outline, so the mistake is a hole
 * they can point at, not a sentence they have to believe.
 *
 * Each side's output is COMPUTED from `n` by `rows`, which must be the program's
 * real behaviour: the component draws what it is told, it does not run Python.
 */
export interface RunSide {
  mark: ReactNode
  heading: ReactNode
  code: string
  /** The rows this side prints for a given n. */
  rows: (n: number) => string[]
  /** The row it should have printed and did not, drawn dashed. */
  missing?: (n: number) => string | null
  wrong?: boolean
}

export function RunCompare({
  question,
  sides,
  n0 = 4,
  min = 2,
  max = 6,
  hint,
  verdict,
  missingLabel = 'the row you wanted',
  caption,
}: {
  /** Shown above the programs; leave it out when the slide's lead asks it. */
  question?: ReactNode
  sides: [RunSide, RunSide]
  n0?: number
  min?: number
  max?: number
  hint: ReactNode
  verdict: ReactNode
  missingLabel?: ReactNode
  caption: ReactNode
}) {
  const instant = useInstant()
  const [n, setN] = useState(n0)
  const [shown, setShown] = useState(0) // rows printed per side so far
  const [told, setTold] = useState(false)
  const timers = useRef<number[]>([])
  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  useEffect(() => clear, [])

  const reset = (v: number) => {
    clear()
    setN(v)
    setShown(0)
    setTold(false)
  }
  const most = Math.max(...sides.map((s) => s.rows(n).length))
  const run = () => {
    const gap = instant ? 0 : 300
    for (let k = 1; k <= most; k++) timers.current.push(window.setTimeout(() => setShown(k), gap * (k - 1)))
    timers.current.push(window.setTimeout(() => setTold(true), gap * n + 420))
  }
  const ran = shown > 0

  const step = (d: number, aria: string) => (
    <button
      type="button"
      aria-label={aria}
      disabled={n + d < min || n + d > max}
      onClick={() => reset(n + d)}
      onKeyDown={(e) => e.key !== 'Enter' && e.key !== ' ' && e.currentTarget.blur()}
      className="grid h-10 w-10 place-items-center rounded-lg bg-white font-heading text-[22px] font-bold disabled:opacity-35"
      style={{ color: colors.brandDark, boxShadow: `inset 0 0 0 1px ${colors.line}` }}
    >
      {d < 0 ? '−' : '+'}
    </button>
  )

  return (
    <div className="flex flex-col gap-3">
      {question && <p className="max-w-[816px] text-body-lg" style={{ color: colors.body }}>{question}</p>}
      <div className="flex items-center gap-3">
        <span className="font-mono text-[32px] font-semibold text-ink">n =</span>
        <span className="rounded-lg px-3 font-mono text-[32px] font-semibold" style={{ background: colors.surface2, color: colors.brand }}>{n}</span>
        {step(-1, 'lower n')}
        {step(1, 'raise n')}
        {/* the run sits on the n row: vote, set n, run, all on one line */}
        <span className="ml-8">
          <PanelButton onClick={run} disabled={ran}>Run them both</PanelButton>
        </span>
        <span className="text-[17px]" style={{ color: colors.muted }}>{told ? verdict : ran ? '' : hint}</span>
      </div>
      <div className="grid grid-cols-2 gap-6">
        {sides.map((s, i) => {
          const rows = s.rows(n)
          const miss = s.missing?.(n) ?? null
          const tone = told ? (s.wrong ? colors.danger : colors.success) : colors.brandDark
          return (
            <div key={i} className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span
                  className="grid h-9 w-9 place-items-center rounded-lg font-heading text-[18px] font-bold"
                  style={{ color: tone, boxShadow: `inset 0 0 0 2px ${tone}`, background: colors.white, transition: 'all 300ms' }}
                >
                  {s.mark}
                </span>
                <span className="font-mono text-[18px] font-semibold" style={{ color: s.wrong ? colors.danger : colors.brandDark }}>{s.heading}</span>
                <span
                  className="ml-auto font-heading text-[18px] font-bold"
                  style={{ color: tone, opacity: shown >= rows.length && ran ? 1 : 0, transition: 'opacity 300ms' }}
                >
                  {rows.length} rows
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CodeBlock code={s.code} filename="Python" chip={false} fontSize={17} showLineNumbers={false} className="min-w-0 flex-1" maxHeight={400} />
                <div className="w-[190px] shrink-0">
                  {/* sized for the largest n, plus the missing row, so it never grows */}
                  <OutputPanel
                    output={rows.slice(0, shown).join('\n')}
                    fontSize={16}
                    lineHeight={1.35}
                    height={Math.round((max + 2) * 16 * 1.35 + 74)}
                    after={
                      miss && told ? (
                        <div className="mt-1 rounded-md px-1.5 font-mono text-[16px] leading-snug" style={{ border: `2px dashed ${colors.danger}`, color: colors.danger }}>
                          <span className="block whitespace-pre">{miss}</span>
                          <span className="block font-body text-[16px] font-semibold">{missingLabel}</span>
                        </div>
                      ) : null
                    }
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <TraceCaption>{caption}</TraceCaption>
    </div>
  )
}
