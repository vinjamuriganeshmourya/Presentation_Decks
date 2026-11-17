import type { ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { Countdown } from './Countdown'
import { StepControls, useBeats, useTween } from './beats'

/**
 * A CODING CHALLENGE — the problem, how to attempt it, a timer, and a hint held back.
 *
 * From PF 14 "For Loop" (Riya's savings). Two beats: the problem on its own
 * first, so the room starts without help; the hint arrives on the second beat,
 * when the instructor decides the room needs it.
 */
export function ChallengePanel({
  tag = 'Problem',
  title,
  statement,
  examples,
  lead,
  steps,
  seconds,
  hint,
  hintLabel = 'Hint',
  inputLabel = 'Input',
  outputLabel = 'Output',
}: {
  tag?: ReactNode
  title: ReactNode
  statement: ReactNode[]
  examples: { input: string; output: string }[]
  lead: ReactNode
  steps: ReactNode[]
  seconds: number
  hint: ReactNode
  hintLabel?: ReactNode
  inputLabel?: ReactNode
  outputLabel?: ReactNode
}) {
  const at = useBeats(2)
  const tween = useTween()
  return (
    <>
      <div className="flex items-start gap-10">
        <div className="w-[560px] shrink-0 rounded-card bg-white p-5 shadow-card-soft ring-1 ring-line">
          <span className="rounded-pill px-3 py-1 text-[16px] font-bold uppercase tracking-wider" style={{ background: colors.surface2, color: colors.brandDark }}>
            {tag}
          </span>
          <p className="mt-3 font-heading text-[24px] font-bold text-ink">{title}</p>
          {statement.map((p, i) => (
            <p key={i} className="mt-2 text-[18px] leading-snug text-ink [&_b]:font-bold">{p}</p>
          ))}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {examples.map((e, i) => (
              /* one small card per example, input over output, as the problem
                 statement's own examples are read: compact, not two full panels */
              <div key={i} className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-1 rounded-xl px-4 py-2.5" style={{ background: colors.surface, boxShadow: `inset 0 0 0 1px ${colors.line}` }}>
                <span className="text-[16px] font-bold uppercase tracking-wider" style={{ color: colors.muted }}>{inputLabel}</span>
                <span className="font-mono text-[22px] font-semibold text-ink">{e.input}</span>
                <span className="text-[16px] font-bold uppercase tracking-wider" style={{ color: colors.muted }}>{outputLabel}</span>
                <span className="font-mono text-[22px] font-semibold text-ink">{e.output}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <p className="text-body-lg text-ink [&_b]:font-bold">{lead}</p>
          <ol className="flex list-decimal flex-col gap-1 pl-6 text-[18px]" style={{ color: colors.body }}>
            {steps.map((s, i) => (
              <li key={i} className="[&_b]:font-bold [&_b]:text-ink">{s}</li>
            ))}
          </ol>
          <Countdown seconds={seconds} />
          <p
            className="flex items-center gap-3 rounded-card bg-white px-4 py-3 text-[18px] ring-2"
            style={{
              transition: tween,
              opacity: at >= 2 ? 1 : 0,
              transform: at >= 2 ? 'none' : 'translateY(6px)',
              ['--tw-ring-color' as string]: colors.info,
              color: colors.ink,
            }}
          >
            <span className="rounded-pill px-2.5 py-0.5 text-[16px] font-bold text-white" style={{ background: colors.info }}>{hintLabel}</span>
            <span className="[&_b]:font-bold [&_code]:font-mono">{hint}</span>
          </p>
        </div>
      </div>
      <StepControls at={at} total={2} />
    </>
  )
}
