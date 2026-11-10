import type { ReactNode } from 'react'
import { CodeBlock } from '@/ui/CodeBlock'
import { Reveal, RevealGroup } from '@/motion/Reveal'
import { colors } from '@/design/tokens'
import { T } from '@/ui/figureTiming'

/*
  PROMOTED FROM `python_programming/programming_with_python`, WHERE IT WAS BUILT,
  AFTER `oops_theory/state_behaviour_constructor` COPIED IT AND MADE IT THE
  SECOND HAND-ROLL.

  That is the failure section 6 of the generate-slides skill is about: the
  syntax-anatomy figure was written three times, as `PortPublish`, `ExecAnatomy`
  and `TargetAnatomy`, before it became `SyntaxBreakdown`. Two copies was the
  point to stop.

  ONE THING THE HONESTY NOTE BELOW HAS TO ALLOW FOR: PSEUDOCODE.

  It says `output` is what the program actually printed, and in the Python
  session every string was produced by running the snippet on CPython 3.12. A
  deck teaching pseudocode has no interpreter to run: `NEW Book(...)` is not a
  program in any language, and that is the point of the material rather than a
  gap in it.

  For that case `output` is the DRY RUN of the pseudocode on the same slide, read
  line by line, and the pane is LABELLED "What it prints" rather than "Output" so
  the frame does not claim an execution that did not happen. That is the only
  permitted reading of `output` that was not produced by running something, and it
  is still not a licence to compose: every printed line must come from a statement
  the deck has shown.
*/

/**
 * A snippet, and what running it printed.
 *
 * THE GAP THIS FILLS
 *
 * The kit had two panels and neither of them could say "and this came out".
 * `CodeBlock` is a FILE: traffic lights, a filename, line numbers. `Terminal` is
 * VS Code's panel, where the command and its output share one scrollback and the
 * folder path is teaching content (hard rule 3). Neither is what a language
 * lesson needs, which is a two-part claim: *this* text, run, produces *that*
 * text. Thirteen slides of the first Python session needed exactly that, and the
 * source PPTX drew it by hand as a pair of rounded rectangles every single time.
 *
 * WHAT IT MUST NOT BE USED FOR
 *
 *   - A command the learner types at a shell. That is `Terminal`, with its path.
 *   - The SHAPE of a construct. That is `SyntaxBreakdown` / `CodeSyntaxSlide`.
 *   - A file that grows across slides. That is `CodeBuildSlide`.
 *
 * HONESTY
 *
 * `output` is what the program actually printed. Every string passed to it in
 * the Python course was produced by running the snippet on CPython 3.12; a
 * composed output is the one thing this component makes easy and must never
 * carry.
 *
 * WHERE THE CODE LIVES
 *
 * Hard rule 31: every code panel says where the code lives or runs. `location`
 * is the code panel's title bar text, and a deck should always pass it. In a
 * playground course that is the language (`Python`), never an invented file
 * name; in a project course it is the file path (`backend/app.py`). It is
 * optional only so a two-pane compare can name its panes with `label` instead
 * of repeating the location twice.
 *
 * LAYOUT
 *
 * One pane renders code and output side by side, which is the widest the well
 * gets and keeps both at a readable size. Two panes render as two columns, each
 * stacked code-over-output, because two side-by-side pairs would be four panels
 * in a row and none of them legible from the back of a room.
 *
 * `layout="stack"` gives a SINGLE pane the full width instead, code above output.
 * Reach for it when the output is wide rather than tall: a traceback runs to
 * about 62 characters on its `NameError:` line, which at 14px in a half-width
 * column wraps mid-token. `align-check.mjs` reported exactly that on two slides
 * of the first Python session, and the fix is width, not a smaller font, because
 * the font was already at 14px and the line is real output that may not be cut.
 */

export interface CodeOutputPane {
  /** Names what this pane IS, when there are two to tell apart: "Java", "In quotes". */
  label?: ReactNode
  /** A logo beside the label. `/assets/tech/java.png`. */
  logo?: string
  /** Where the code lives or runs. Rendered in the code panel's title bar (rule 31). */
  location?: string
  code: string
  /** Exactly what the program printed. Never composed. */
  output: string
  /** `error` renders the output as a failure rather than a result. */
  kind?: 'result' | 'error'
  language?: string
  /** Line numbers. Off by default: a one-line program does not need a gutter. */
  showLineNumbers?: boolean
}

const OUT_INK = { result: colors.ink, error: colors.danger, input: colors.ink } as const
const OUT_DOT = { result: colors.success, error: colors.danger, input: colors.brand } as const
const OUT_TITLE = { result: 'Output', error: 'Error', input: 'Input' } as const

/**
 * One output (or input) panel on its own: white card, a header strip with a
 * dot and a label, the text in mono.
 *
 * Exported for the slides that show what went IN as well as what came out, or
 * an output with no snippet beside it (PF 14 "For Loop": an input, an expected
 * output, an output). `title` renames the strip for the one honest variant,
 * "Expected output", on a slide whose program does NOT print it.
 *
 * `height` fixes the panel for a trace that fills it line by line: without it
 * the panel grows with every printed line and pushes the slide below it down.
 */
export function OutputPanel({
  output,
  kind = 'result',
  title,
  fontSize,
  height,
  lineHeight = 1.6,
  after,
  className = '',
}: {
  output: string
  kind?: 'result' | 'error' | 'input'
  title?: string
  fontSize?: number
  height?: number
  /** Tighter for a panel sized to its longest run (a trace that prints 7 lines). */
  lineHeight?: number
  /** A row drawn after the output, inside the panel: "the row you wanted". */
  after?: ReactNode
  className?: string
}) {
  return (
    <div
      className={`overflow-hidden rounded-card border border-line bg-white shadow-card-soft ${className}`}
      style={height ? { height } : undefined}
    >
      <div className="flex items-center gap-2 border-b border-line bg-surface px-4 py-2">
        <span className="inline-block h-2 w-2 rounded-full" style={{ background: OUT_DOT[kind] }} />
        <span className="font-term text-body-sm font-bold uppercase tracking-wider text-body">
          {title ?? OUT_TITLE[kind]}
        </span>
      </div>
      {/*
        ONE `<pre>` WITH `whitespace-pre`, NOT ONE `<div>` PER LINE.

        A traceback's leading spaces are load-bearing: the `^^^^` line is only
        meaningful sitting under the token it points at. `whitespace-pre-wrap`
        would re-wrap a long line in a narrow panel and break that alignment
        silently, so the panel scrolls horizontally instead of wrapping.

        (The first version split the output into one `<div>` per line, and in a
        1x screenshot the carets looked cut in half. They were not: measured at
        3x with `scrollHeight === clientHeight`, the line renders whole, and a
        caret is simply a few pixels tall at 15px. Recorded because the wrong
        conclusion is the easy one to reach from the screenshot alone.)
      */}
      {/*
        THE PADDING IS ON THE WRAPPER, NOT ON THE `<pre>`.

        With `px-4 py-3` on the pre itself, the pre's box is 24px taller than its
        text, and `align-check.mjs` divides a text block's height by its computed
        line-height to spot a token that has wrapped. A one-line output then
        measured as two lines and nine slides were reported WRAPPED for printing
        the single character `7`. The pre now hugs its own text exactly.
      */}
      {/*
        ONE `<pre>` PER LINE AFTER ALL, AND THE COMMENT ABOVE IS NOW HALF WRONG.

        The reason given for a single `<pre>` was that a traceback's leading
        spaces are load-bearing. They are, and `whitespace-pre` on each line
        keeps every one of them: the lines share a left edge, a font and a line
        box, so a `^^^^` row still sits exactly under the token it points at.
        What the single `<pre>` also did was hand `align-check.mjs` one mono leaf
        four line-heights tall, which is indistinguishable from one token that
        wrapped four times, and this deck was reported for it:

            slide 42  WRAPPED  one token over 4 lines: "Harry Potter borrowed…"

        `definitions-lab` reached the same conclusion for the same reason and its
        `ExampleBlock` splits on the newline too. An empty line keeps its height
        through the zero-width space, so a blank line in output is still a blank
        line rather than a collapsed row.
      */}
      <div className="overflow-x-auto px-4 py-3">
        {output.split('\n').map((line, i) => (
          <pre
            key={i}
            className="m-0 whitespace-pre font-mono"
            style={{ color: OUT_INK[kind], fontSize: fontSize ?? 17, lineHeight }}
          >
            {line === '' ? '\u200b' : line}
          </pre>
        ))}
        {after}
      </div>
    </div>
  )
}

function PaneLabel({ label, logo }: { label?: ReactNode; logo?: string }) {
  if (!label && !logo) return null
  return (
    <div className="mb-2 flex items-center gap-2">
      {logo && <img src={logo} alt="" aria-hidden className="h-6 w-6 object-contain" />}
      {label && (
        <span className="font-term text-body-sm font-bold uppercase tracking-wider text-body">
          {label}
        </span>
      )}
    </div>
  )
}

/** The run arrow. A glyph, not SVG text, so nothing can collide inside it. */
function RunArrow({ dir }: { dir: 'right' | 'down' }) {
  return (
    <Reveal dir="fade" className="flex shrink-0 items-center justify-center">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full text-white"
        style={{ background: colors.brand }}
        aria-hidden
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          {dir === 'right' ? <path d="M5 12h13M13 6l6 6-6 6" /> : <path d="M12 5v13M6 13l6 6 6-6" />}
        </svg>
      </span>
    </Reveal>
  )
}

export function CodeOutput({
  panes,
  outputFontSize,
  layout = 'row',
  className = '',
}: {
  /** One pane, or two to compare. Three would be unreadable at 1280x720. */
  panes: CodeOutputPane[]
  outputFontSize?: number
  /** Single-pane only: `stack` puts output UNDER code at full width. */
  layout?: 'row' | 'stack'
  className?: string
}) {
  const two = panes.length > 1

  if (two) {
    return (
      <RevealGroup
        stagger={T.stagger}
        delayChildren={T.lead}
        className={`grid grid-cols-2 items-start gap-6 ${className}`}
      >
        {panes.slice(0, 2).map((p, i) => (
          <Reveal key={i} dir="up">
            <PaneLabel label={p.label} logo={p.logo} />
            <CodeBlock
              code={p.code}
              filename={p.location}
              language={p.language ?? 'python'}
              showLineNumbers={p.showLineNumbers ?? false}
              fontSize={16}
            />
            <div className="my-2 flex justify-center">
              <RunArrow dir="down" />
            </div>
            <OutputPanel output={p.output} kind={p.kind} fontSize={outputFontSize ?? 16} />
          </Reveal>
        ))}
      </RevealGroup>
    )
  }

  const p = panes[0]

  if (layout === 'stack') {
    return (
      <RevealGroup
        stagger={T.stagger}
        delayChildren={T.lead}
        className={`flex w-full flex-col ${className}`}
      >
        <Reveal dir="up">
          <PaneLabel label={p.label} logo={p.logo} />
          <CodeBlock
            code={p.code}
            filename={p.location}
            language={p.language ?? 'python'}
            showLineNumbers={p.showLineNumbers ?? false}
          />
        </Reveal>
        <div className="my-2 flex justify-center">
          <RunArrow dir="down" />
        </div>
        <Reveal dir="up">
          <OutputPanel output={p.output} kind={p.kind} fontSize={outputFontSize} />
        </Reveal>
      </RevealGroup>
    )
  }

  return (
    <RevealGroup
      stagger={T.stagger}
      delayChildren={T.lead}
      className={`flex items-center gap-5 ${className}`}
    >
      <Reveal dir="up" className="min-w-0 flex-1">
        <PaneLabel label={p.label} logo={p.logo} />
        <CodeBlock
          code={p.code}
          filename={p.location}
          language={p.language ?? 'python'}
          showLineNumbers={p.showLineNumbers ?? false}
        />
      </Reveal>
      <RunArrow dir="right" />
      <Reveal dir="up" className="min-w-0 flex-1">
        <OutputPanel output={p.output} kind={p.kind} fontSize={outputFontSize} />
      </Reveal>
    </RevealGroup>
  )
}
