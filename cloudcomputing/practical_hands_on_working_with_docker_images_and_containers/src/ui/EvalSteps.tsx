import { Reveal, RevealGroup } from '@/motion/Reveal'
import { colors } from '@/design/tokens'
import { MonoBadge } from './MonoBadge'
import { T } from './figureTiming'

/**
 * An expression rewritten one step at a time, down to its value.
 *
 * THE ARGUMENT
 *
 * "In which order does Python evaluate `5 * 2 + 3 * 4`?" is answered by
 * showing the rewrite: `5 * 2 + 3 * 4` becomes `10 + 12` becomes `22`. Each
 * line is one operation done; the last line is the value and is set apart.
 * Three wrong approaches beside the right one is how Python session 4 teaches
 * BODMAS, and each approach is one of these.
 *
 * WHAT IT IS NOT
 *
 * Not a run (`CodeOutput`), not a trace of variables (`VariableTrace`), and not
 * a sequence of instructions (`StepList`). Every line here is the SAME
 * expression, one operation further along.
 *
 * DOM, colours from tokens, staggered on entry at the explanatory tier.
 */

export function EvalSteps({
  steps,
  className = '',
}: {
  /** First entry is the expression as written; last is its value. */
  steps: string[]
  className?: string
}) {
  const last = steps.length - 1
  return (
    <RevealGroup stagger={T.stagger * 2.5} delayChildren={T.lead} className={`flex flex-col items-center gap-2 ${className}`}>
      {steps.map((s, i) => (
        <Reveal key={i} dir="up" className="flex flex-col items-center gap-2">
          {i > 0 && (
            <svg width="24" height="28" viewBox="0 0 24 28" fill="none" stroke={colors.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 2v22M5 17l7 7 7-7" />
            </svg>
          )}
          <MonoBadge size="lg" solid={i === last}>
            {s}
          </MonoBadge>
        </Reveal>
      ))}
    </RevealGroup>
  )
}
