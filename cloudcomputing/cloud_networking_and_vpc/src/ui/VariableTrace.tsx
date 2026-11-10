import { AnimatePresence, motion } from 'framer-motion'
import { useClaimedSteps } from '@/motion/Stepper'
import { useInstant } from '@/motion/instant'
import { colors } from '@/design/tokens'
import { CodeBlock } from './CodeBlock'
import { T, E, c4 } from './figureTiming'

/**
 * A program run one line at a time, with its variables drawn as boxes.
 *
 * THE ARGUMENT
 *
 * "Python executes the code line-by-line" is a claim about TIME, and a static
 * code panel cannot make it. This figure lights one line, shows the variable
 * box that line changed, and appends what it printed, one click per line. The
 * source PPTX of Python session 4 drew the same thing as 27 consecutive slides;
 * here each program is one slide and its lines are the build steps.
 *
 * THE BOX IS THE COURSE'S OWN ANALOGY
 *
 * Session 3 taught "variables are like containers for storing values" with a
 * glass that changes from water to juice. The box here has a lid with the name
 * on it and the value inside, and the value swaps in place when a line
 * reassigns it, which is the glass changing colour.
 *
 * STEP MODEL
 *
 * Step 0 is the code alone, nothing lit, no boxes, no output. Click `k` shows
 * `steps[k-1]`: its `line` lit, its `boxes` as the whole state after that line,
 * and its `output` as everything printed so far. `?all` and an instant jump
 * land on the last step. `useClaimedSteps` claims exactly `steps.length` build
 * steps, so the deck's step counter matches the program's line count.
 *
 * DOM, never SVG (content rule 17). Colours from tokens, timing from the scale.
 */

export interface TraceStep {
  /** 1-based line that just ran. */
  line: number
  /** The whole variable state after this line. A box missing here is not yet created. */
  boxes: { name: string; value: string }[]
  /** Everything printed so far, one entry per line. */
  output: string[]
}

function VariableBox({ name, value }: { name: string; value: string }) {
  const instant = useInstant()
  return (
    <motion.div
      layout
      className="w-[128px] overflow-hidden rounded-card border border-line bg-white text-center shadow-card-soft"
      initial={instant ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: T.enter, ease: c4(E.out) }}
    >
      <div className="border-b border-line bg-surface px-3 py-1.5">
        <span className="font-mono text-body-sm font-bold leading-none text-body">{name}</span>
      </div>
      <div className="relative grid h-[64px] place-items-center">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            className="font-mono text-[30px] font-semibold leading-none"
            style={{ color: colors.brandDark }}
            initial={instant ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: T.label, ease: c4(E.out) }}
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export function VariableTrace({
  code,
  steps,
  location = 'Code Playground · main.py',
  className = '',
}: {
  code: string
  steps: TraceStep[]
  location?: string
  className?: string
}) {
  const shown = useClaimedSteps(steps.length)
  const reached = shown.filter(Boolean).length
  const current = reached > 0 ? steps[reached - 1] : undefined

  return (
    <div className={`grid grid-cols-[1.25fr_auto_1fr] items-start gap-8 ${className}`}>
      <CodeBlock code={code} filename={location} highlight={current ? [current.line] : []} />

      <div className="flex min-h-[120px] min-w-[128px] flex-col gap-4 pt-1">
        <span className="font-heading text-body-sm font-bold uppercase tracking-wider text-body">Variables</span>
        {current?.boxes.map((b) => <VariableBox key={b.name} name={b.name} value={b.value} />)}
      </div>

      <div className="overflow-hidden rounded-card border border-line bg-white shadow-card-soft">
        <div className="flex items-center gap-2 border-b border-line bg-surface px-4 py-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: colors.success }} />
          <span className="font-heading text-body-sm font-bold uppercase tracking-wider text-body">Output</span>
        </div>
        {/* Padding on the wrapper, one line per element: `align-check.mjs`
            reads a padded or multi-line `<pre>` as one wrapped token. */}
        <div className="min-h-[64px] px-4 py-3 font-mono text-[17px] leading-relaxed text-ink">
          {(current?.output ?? []).map((line, i) => (
            <div key={i} className="whitespace-pre">{line}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
