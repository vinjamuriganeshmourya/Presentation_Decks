/**
 * THE ONE CONTRACT every annotated-output candidate takes.
 *
 * Four candidates, one prop shape, so choosing between them is a rename at the
 * call site. That is `flow-lab`'s and `comparison-lab`'s pattern and it is what
 * makes a lab cheap to judge: the gallery renders one fixture four times and the
 * only variable is the drawing.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THE ANNOTATIONS LIVE INSIDE THE LINES
 *
 * The obvious contract is `lines: TerminalLine[]` plus
 * `annotations: { lineIndex, text }[]`. It is also the exact failure
 * `SyntaxBreakdown` records in its own header: its first draft took a `command`
 * string AND a `parts` array, the two drifted within one session, and the slide
 * explained a flag the specimen no longer carried. A line index is worse than a
 * duplicated string, because inserting one line of real output silently moves
 * every annotation below it and nothing errors.
 *
 * So there are no indexes in this file's public shape. A line carries its own
 * `note`, and a RUN of lines is a NESTED node that owns the lines it spans. An
 * annotation cannot point at the wrong line because it does not point at all: it
 * is on the line.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY A RUN HAS AN `exception` ROLE
 *
 * Session 6's `docker push` output prints three `Pushed` lines and then
 * `b7f7d2967507: Mounted from library/python`. All four lines are layers, and
 * the room counts four; but `Mounted from` means that layer was NOT uploaded.
 * A figure that draws one brace around all four and labels it "3 layers
 * uploaded", or "4 layers pushed", is saying something false.
 *
 * `role: 'exception'` makes that structural rather than a matter of a designer
 * remembering. Every derived count in this lab comes from
 * `lines.filter(l => l.role !== 'exception')`, so a candidate cannot lump the
 * two together by accident. It can only do so by ignoring the field, and the
 * gallery's notes say which candidate does.
 */

/**
 * Mirrors `TerminalLine['kind']` from the kit's `src/ui/Terminal.tsx`. All four
 * kinds, unchanged: `err` is there because a console error IS red and rendering
 * it in the same grey as ordinary output loses the one cue a learner scans for.
 * Annotation is an ADDITION to the panel, never a replacement for it.
 */
export type OutputKind = 'cmd' | 'out' | 'ok' | 'err'

/** Where a line stands with respect to the run it sits inside. */
export type RunRole = 'member' | 'exception'

export interface OutputLine {
  /** The line exactly as the program printed it. Real output only. */
  text: string
  kind?: OutputKind
  /**
   * What this line is called, in a few words. Its PRESENCE is what makes the
   * line annotated: there is no separate list of which lines to mark.
   */
  note?: string
  /**
   * Only meaningful inside a run. `member` (the default) is one of the things
   * the run's label counts; `exception` is printed inside the run, counted by
   * the eye, and excluded from the claim.
   */
  role?: RunRole
  /** What an `exception` line actually means. Ignored on a `member`. */
  exceptionNote?: string
}

export interface OutputRun {
  /** One label for the WHOLE run. Not per line. */
  label: string
  /**
   * The unit the members are counted in, so a candidate can derive
   * `3 layers` rather than being handed the number. A number in the props is a
   * second source of truth and would drift the first time a line was added.
   */
  unit?: string
  /** The lines that make up the run, in the order the program printed them. */
  lines: OutputLine[]
}

/** A transcript is a list of lines, some of which are runs of lines. */
export type OutputNode = OutputLine | OutputRun

export function isRun(node: OutputNode): node is OutputRun {
  return Array.isArray((node as OutputRun).lines)
}

export interface AnnotatedOutputProps {
  /** The folder the prompt sits in, passed straight through to `Terminal`. */
  path: string
  /** The transcript. A run is a nested node, never a line-index range. */
  nodes: OutputNode[]
  /**
   * Both of the kit's chromes stay reachable. A slide that says "Administrator
   * PowerShell" while drawing VS Code's panel tells the room two different
   * things, and the one it draws wins.
   */
  chrome?: 'vscode' | 'powershell'
  /**
   * 13 is the floor. `align-check.mjs` flags a token wrapped over two lines,
   * which a long repository name will do in a narrow panel, and the fix is a
   * wider panel or a shorter fixture, never smaller type.
   */
  fontSize?: number
  /** Caption under the whole figure, saying what the annotation claims. */
  caption?: string
  className?: string
}

/* ───────────────────────── flattening, once ─────────────────────────────── */

export interface FlatLine {
  line: OutputLine
  /** The run this line belongs to, if any. */
  run?: OutputRun
  /** Index of that run in `runs`, for pairing paint and numbering. */
  runIndex?: number
}

export interface RunSpan {
  run: OutputRun
  runIndex: number
  /** First and last flat-line index the run occupies, inclusive. */
  from: number
  to: number
  /** Flat-line indexes of the MEMBERS only, in order. */
  members: number[]
  /** Flat-line indexes of the exceptions, in order. */
  exceptions: number[]
}

/**
 * One pass over `nodes`, producing the flat transcript AND the run spans that
 * index into it. Every candidate calls this and nothing else, so all four draw
 * the same lines in the same order from the same source.
 */
export function flattenOutput(nodes: OutputNode[]): { lines: FlatLine[]; runs: RunSpan[] } {
  const lines: FlatLine[] = []
  const runs: RunSpan[] = []
  for (const node of nodes) {
    if (!isRun(node)) {
      lines.push({ line: node })
      continue
    }
    const runIndex = runs.length
    const from = lines.length
    const members: number[] = []
    const exceptions: number[] = []
    for (const line of node.lines) {
      const at = lines.length
      lines.push({ line, run: node, runIndex })
      if (line.role === 'exception') exceptions.push(at)
      else members.push(at)
    }
    runs.push({ run: node, runIndex, from, to: lines.length - 1, members, exceptions })
  }
  return { lines, runs }
}

/** The count a run claims, derived from its members. Never passed in. */
export function runCount(span: RunSpan): number {
  return span.members.length
}

/** `3 layers`, singularised so a one-member run does not read `1 layers`. */
export function runCountLabel(span: RunSpan): string {
  const n = runCount(span)
  const unit = span.run.unit ?? 'lines'
  return `${n} ${n === 1 ? unit.replace(/s$/, '') : unit}`
}

/* ───────────────────────── panel geometry ───────────────────────────────── */

/**
 * ANCHOR EVERY ANNOTATION FROM THE PANEL'S BOTTOM EDGE, NOT ITS TOP.
 *
 * The candidates render the kit's `Terminal` unchanged and lay their apparatus
 * out in a lane beside it. That needs the y of a given line, and the kit's
 * component exposes none — but it does not have to. `Terminal`'s body is
 * `px-4 py-3.5` with `lineHeight: 1.65` in BOTH chromes, and only its HEADER
 * differs between them (a tab strip versus a title bar). So a line's distance
 * from the panel's TOP depends on the chrome and a line's distance from its
 * BOTTOM does not.
 *
 * Measuring from the bottom therefore needs two numbers and no measurement, and
 * the same arithmetic is correct for `vscode` and for `powershell`. That is the
 * only reason these candidates can reuse the kit panel instead of forking it.
 *
 * Both numbers are read off `src/ui/Terminal.tsx`. If that file's body padding
 * or line-height ever changes, these change with it, and the gallery's
 * screenshots are what catches it.
 */
export const PANEL_BODY_PAD_BOTTOM = 14 /* py-3.5 */
export const PANEL_LINE_RATIO = 1.65 /* Terminal's `lineHeight` */

/* ─────────────────────── the vertical placement ─────────────────────────── */

/**
 * THE COMPOSITE FIGURE IS CENTRED IN THE CONTENT WELL, NOT TOP ALIGNED.
 *
 * Reviewer: *"in all labs the content is top aligned i want content to be
 * center aligned."*
 *
 * Centring needs no mechanism at all, and that is the finding. `ContentSlide`'s
 * body well is `flex min-h-0 flex-1 flex-col justify-center`, and it wraps a
 * child in a `RevealGroup` and a `Reveal` which are both content-height blocks.
 * So a figure handed to it is content-height, becomes the centred flex item, and
 * lands with equal gaps above and below WITHOUT being asked to.
 *
 * The corollary is the useful half: `ContentSlide` can centre a figure and
 * CANNOT top-align one. An earlier pass of this lab wanted a fixed top datum and
 * `h-full` did nothing, precisely because a percentage height resolves against
 * those two content-height wrappers. Asserting a `minHeight` faked it, and that
 * fake is now deleted. **A figure cannot see the well's height from inside it**,
 * which is why the clamp below is a measured constant rather than a computation.
 *
 * THE ONE THING CENTRING NEEDS GUARDING AGAINST. Centring frees a tall figure
 * UPWARD, and the top-right of the stage (x 913..1280, y 0..220) is held for the
 * instructor video. The well opens at y=217, which is already 3px inside that
 * rectangle, so a figure that filled the well completely would clip it.
 *
 * `FIGURE_VIDEO_GUARD` is applied as EQUAL padding top and bottom: equal padding
 * leaves the centring exact, and guarantees the panel starts at least this far
 * below whatever the figure's own top edge is. See `FIGURE_MAX_CENTRED_H` for
 * the height at which centring alone stops being safe.
 */
export const FIGURE_VIDEO_GUARD = 8

/**
 * The measured content well of `ContentSlide` at 1280x720 with a ONE-LINE lead:
 * it opens at y=217 and is 439px tall. Identical on all nine content slides of
 * this gallery (`node center-check.mjs` prints it).
 *
 * A two-line lead shortens the well and moves it down, and under centring the
 * figure moves by HALF of that rather than all of it.
 */
export const WELL_TOP = 217
export const WELL_HEIGHT = 439

/**
 * The tallest a composite figure can be and still centre clear of the video
 * rectangle.
 *
 * Centred top = `WELL_TOP + (WELL_HEIGHT - H) / 2`, and that has to stay at or
 * below the reserve's floor plus the guard, so
 * `H <= WELL_HEIGHT - 2 * (224 - WELL_TOP)` = 425px. The tallest candidate in
 * this lab is `GutterMarks` at 369px, so nothing here needs clamping and
 * `node video-safe.mjs` is the check that keeps it true. A future candidate that
 * exceeds this has to be shortened, not clamped, because a clamped figure is no
 * longer centred and the reviewer asked for centred.
 */
export const FIGURE_MAX_CENTRED_H = WELL_HEIGHT - 2 * (220 + 4 - WELL_TOP)

/** The root class every candidate uses, so placement cannot be set two ways. */
export const FIGURE_ROOT = 'mx-auto flex w-full flex-col'

export interface LineBox {
  /** px from the panel's bottom edge to the bottom of this line's box. */
  bottom: number
  /** px, one line's height. */
  height: number
}

export function lineHeightPx(fontSize: number): number {
  return fontSize * PANEL_LINE_RATIO
}

/** The box of one flat line, measured from the panel's bottom edge. */
export function lineBox(fontSize: number, total: number, index: number): LineBox {
  const lh = lineHeightPx(fontSize)
  return { bottom: PANEL_BODY_PAD_BOTTOM + (total - 1 - index) * lh, height: lh }
}

/** The box spanning a contiguous group of flat lines, `from` and `to` inclusive. */
export function spanBox(fontSize: number, total: number, from: number, to: number): LineBox {
  const lh = lineHeightPx(fontSize)
  return { bottom: PANEL_BODY_PAD_BOTTOM + (total - 1 - to) * lh, height: (to - from + 1) * lh }
}

/** The centre of a line's box, from the panel's bottom edge. */
export function lineCentre(fontSize: number, total: number, index: number): number {
  const box = lineBox(fontSize, total, index)
  return box.bottom + box.height / 2
}
