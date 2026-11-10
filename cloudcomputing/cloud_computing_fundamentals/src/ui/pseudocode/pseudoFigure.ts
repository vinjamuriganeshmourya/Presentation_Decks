import type { ReactNode } from 'react'

/**
 * ONE CONTRACT FOR EVERY PSEUDOCODE FIGURE.
 *
 * Same principle as the sibling labs: it describes **meaning** and never
 * geometry, because turning meaning into geometry is the only thing the variants
 * disagree about. Picking a winner is a rename at the call site.
 *
 * WHY THIS LAB EXISTS
 *
 * Pseudocode on a slide currently goes through `CodeBlock`, which is a FILE view:
 * traffic lights, a filename, a language chip, line numbers, and a syntax
 * highlighter tuned for Python, JS, Dockerfile and YAML. Every one of those is
 * wrong for pseudocode, and two of them are actively misleading:
 *
 *   1. **A filename says "create this file".** Pseudocode is never a file. It is
 *      the step the learner does BEFORE there is a file.
 *   2. **A language chip says which language it is.** The entire point of
 *      pseudocode is that it is not any of them.
 *
 * And the thing pseudocode most needs, `CodeBlock` cannot do at all: there is
 * nowhere to say what a line MEANS, and nowhere to show what happens when the
 * algorithm runs.
 *
 * WHAT THE TEACHING LITERATURE ACTUALLY ASKS FOR
 *
 * The established device for explaining an algorithm is the **trace table**, also
 * called a dry run: a table with one column per variable and one row per
 * executed step, filled in as the algorithm proceeds, often also tracking the
 * line number and the output. It is standard in school and college computing
 * because it turns "what does this do" into something the room can watch happen.
 *
 * A trace table is not a decoration on top of pseudocode. It is the second half
 * of the same explanation, and it is why this contract carries `trace` as a
 * first-class field rather than leaving a variant to invent one.
 */

/** What a line DOES, which is the only classification a reader needs. */
export type PseudoLineKind = 'io' | 'assign' | 'branch' | 'loop' | 'call' | 'return' | 'plain'

export interface PseudoLine {
  /** 1-based, and referenced by `TraceStep.line`, so it is authored not derived. */
  n: number
  /** The pseudocode itself. Natural language shaped like code, never a language. */
  text: string
  /** Nesting depth. 0 is the outermost level. Drawn, not spaces in `text`. */
  indent?: number
  /**
   * Why this line exists, in the learner's terms.
   *
   * `CodeBlock` has nowhere to put this, which is the single biggest reason
   * pseudocode explained through it becomes an instructor reading the lines out.
   */
  note?: ReactNode
  kind?: PseudoLineKind
}

/**
 * One row of the dry run: the state AFTER the named line has executed.
 *
 * "After" rather than "before", stated here because a trace table that does not
 * say which it means is ambiguous exactly where it matters, on the row where a
 * loop variable changes.
 */
export interface TraceStep {
  /** Which `PseudoLine.n` just ran. */
  line: number
  /** Variable values after it ran. Keys must appear in `vars`. */
  vars: Record<string, string>
  /** Anything printed on this step. */
  output?: string
  /** One short line: why this step is the interesting one. */
  note?: ReactNode
}

export interface PseudoFigureProps {
  /** What the algorithm is called. Not a filename: pseudocode has no file. */
  title?: string
  lines: PseudoLine[]
  /**
   * Column order for the trace table. Explicit, because a table whose columns
   * come from `Object.keys` reorders itself when the author edits a step.
   */
  vars?: string[]
  /** The dry run, in execution order. */
  trace?: TraceStep[]
  /**
   * The real implementation, for a variant that shows the bridge.
   *
   * `map` aligns real lines to pseudocode lines: `map[realIndex] = pseudoLine`.
   * Alignment is authored because it is a claim about correspondence, and a
   * variant guessing it would quietly teach the wrong pairing.
   */
  real?: { language: string; lines: string[]; map?: number[] }
  /** One line under the figure, for the claim it makes. */
  caption?: ReactNode
  className?: string
}

export interface ResolvedPseudo {
  lines: PseudoLine[]
  vars: string[]
  trace: TraceStep[]
  byLine: Record<number, PseudoLine>
  maxIndent: number
  problems: string[]
}

/**
 * Resolve once, so the variants disagree about geometry only.
 *
 * The checks exist because every one of them is a mistake that renders as
 * something plausible. A trace step pointing at a line that does not exist draws
 * a row with no highlight; a variable in a step but not in `vars` silently
 * vanishes from the table.
 */
export function resolvePseudo({
  lines,
  vars,
  trace,
}: Pick<PseudoFigureProps, 'lines' | 'vars' | 'trace'>): ResolvedPseudo {
  const problems: string[] = []
  const byLine: Record<number, PseudoLine> = {}
  for (const l of lines) {
    if (byLine[l.n]) problems.push(`line ${l.n} declared twice`)
    byLine[l.n] = l
  }

  const cols = vars ?? []
  const steps = trace ?? []

  for (const [i, s] of steps.entries()) {
    if (!byLine[s.line]) problems.push(`trace step ${i + 1} runs line ${s.line}, which does not exist`)
    for (const k of Object.keys(s.vars)) {
      if (cols.length && !cols.includes(k)) {
        problems.push(`trace step ${i + 1} sets "${k}", which is not in vars, so it would not be shown`)
      }
    }
  }
  if (steps.length && !cols.length) problems.push('a trace was given but vars is empty, so it has no columns')
  if (lines.length > 14) problems.push(`${lines.length} lines; past about 14 the room reads instead of following`)

  return {
    lines,
    vars: cols,
    trace: steps,
    byLine,
    maxIndent: Math.max(0, ...lines.map((l) => l.indent ?? 0)),
    problems,
  }
}
