import { useId, useState, type CSSProperties, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { colors } from '@/design/tokens'
import { E, c4 } from '@/ui/figureTiming'
import { FcEdgeLabel, FcNodeIn, useBeats } from '@/ui/figures/motion'
import {
  CODE_BG,
  CODE_BORDER,
  CODE_GUTTER,
  KIND_DARK,
  KIND_LIGHT,
  PseudoText,
} from './pseudoText'
import {
  resolvePseudo,
  type PseudoFigureProps,
  type PseudoLine,
} from './pseudoFigure'

/**
 * LINE ANNOTATED — the pseudocode read as prose with code, one line per click.
 *
 * THE ARGUMENT
 *
 * `CodeBlock` has nowhere to put a per-line note. That is not a styling gap, it
 * is the reason pseudocode explained through it degrades into an instructor
 * reading the lines out loud: the code is on the slide, the meaning is in the
 * room's memory of what was just said, and anyone who looked away has lost the
 * pairing for good.
 *
 * So the note is ON the slide, beside the line it belongs to, and it lands on the
 * same click that highlights the line. The room reads algorithm-as-prose, in
 * execution order, and can look back up at any earlier line and still see why it
 * exists. `PseudoLine.note` is in the contract for exactly this, and this figure
 * is the one that spends it.
 *
 * NO TRACE TABLE, DELIBERATELY
 *
 * `TraceTable` is the canonical device and it costs eight clicks and eight
 * spoken sentences. This one is for the pass where the question is "what does
 * each line mean", not "what are the values". Two figures because they are two
 * different questions; a figure that answered both would answer neither well.
 *
 * LINES WITH NO NOTE STILL REVEAL AND CLAIM NO SPACE
 *
 * `END IF` and `END FOR` have no note, because there is nothing to say about them
 * that the indentation does not already say. They still get their own beat, so
 * the build never skips a line and the room never loses its place, but their note
 * cell is empty and their row stays at the 34px base. A placeholder there ("no
 * note") would be four words of furniture on the two quietest lines in the
 * algorithm.
 *
 * WHAT IT IS WORST AT
 *
 * **It cannot show a value.** Nothing in this figure knows what `largest` holds
 * on the second pass, and the fixture's most interesting fact, that line 4 is
 * true once out of three tries, is unsayable here except as a claim in prose. On
 * a slide about how a loop CONVERGES, this figure is the wrong one and
 * `TraceTable` is the right one.
 *
 * **Its height is a function of its longest note, and it will run off a slide.**
 * The row heights below are computed from an estimated wrap, so the panel grows
 * as notes get longer. The fixture's worst case, the 101-character note on line
 * 2, wraps to two lines and takes the figure to 388px. Add one more two-line note
 * and it is 408 and past the 400px budget, at which point it pushes a problem
 * rather than overflowing the stage. The pressure that puts on the author is the
 * point: a note that needs three lines is not a note, it is the next slide.
 *
 * Third, and honest: **the estimate is an estimate.** Wrapping is measured at
 * 7.1px per character of 14px Inter, which is an average. A note made entirely of
 * capitals or long identifiers will wrap earlier than the arithmetic thinks and
 * the row will show less padding than it claims. Notes are sentences, which is
 * where that average holds, and a `ReactNode` note is assumed to be two lines
 * because it cannot be counted at all.
 *
 * GEOMETRY, AND THE PADDING ARITHMETIC
 *
 * One 1100px panel on the 1280x720 slide, height derived from the content so the
 * padding cannot be squeezed. Inside: 20px of horizontal padding, so 1060 of
 * inner width, split 420 code + 24 gap + 616 note.
 *
 * PADDING IS A FLOOR, NOT A DECLARATION. A box shows `(box height - content
 * height) / 2`, so the panel here is SIZED FROM its content rather than being
 * given a height it then has to fit:
 *
 *   - Panel height = 14 + header 22 + 12 + sum(rows) + 14. Real vertical padding
 *     is therefore exactly **14px**, top and bottom, by construction and not by
 *     hope. On the fixture: 14 + 34 + 292 + 14 = **354**.
 *   - A base row is 34px and holds one 15px mono line on 1.35 leading (20.25px),
 *     so **6.8px** above and below.
 *   - A row with an n-line note is `max(34, n * 20 + 14)`: a two-line note is
 *     40px of text in a 54px row, so **7px** above and below. The fixture's line
 *     2 is the only such row.
 *   - Code column. The longest line, "SET largest TO first item of numbers" at 36
 *     characters of 15px mono (9px each), needs 324, plus a 26px gutter and a 10px
 *     gap: 360 inside 420. 60px spare, which is what lets `indent` be DRAWN at
 *     18px a level rather than faked with spaces inside `text`.
 *   - Note column. 616 less 2 x 16 of cell padding is 584 usable, which at 7.1px
 *     a character is 82 characters a line. The 101-character note is 2 lines.
 *   - Figure height = panel 354 + 8 + caption 26 = **388**, inside the 400px
 *     budget with 12 to spare.
 *
 * Every one of those is re-derived from the actual props at render, and a failure
 * becomes a listed problem. The sibling lab's cards all declared 12px of padding
 * and showed 0, and it stayed true for as long as the arithmetic lived only in a
 * comment.
 */

/* Stage. */
const W = 1100
const MAX_H = 400
const PAD_X = 20
const PAD_Y = 14
const HEADER_H = 22
const HEADER_GAP = 12
const CAPTION_H = 26
const CAPTION_GAP = 8

/* Columns. 420 + 24 + 616 = 1060 = 1100 - 2 x 20. */
const CODE_W = 420
const COL_GAP = 24
const NOTE_W = 616
const NOTE_PAD_X = 16

/* Rows. */
const ROW_BASE = 34
const NOTE_LH = 20
const NOTE_PAD_Y = 7
const INDENT = 18
const GUTTER = 26
const GUTTER_GAP = 10

/* Type metrics. Stated here because the row heights are computed from them. */
const MONO_15 = 9
const NOTE_CH = 7.1
const NOTE_ROOM = NOTE_W - NOTE_PAD_X * 2 /* 584 */
const CODE_ROOM = CODE_W - GUTTER - GUTTER_GAP /* 384 */
const CHARS_PER_LINE = Math.floor(NOTE_ROOM / NOTE_CH) /* 82 */

/*
  TWO GROUNDS ON ONE PANEL, SO TWO ENDS OF ONE RAMP.

  The code column is a dark slab now and the note column beside it is still white,
  because a note is prose and prose belongs on paper. `KIND_DARK` and `KIND_LIGHT`
  in `pseudoText.tsx` are the same four hue families at the two ends, so a line
  whose rule is teal on the dark side keeps a teal marker on the light side.
*/
const darkOf = (l: PseudoLine) => KIND_DARK[l.kind ?? 'plain']
const lightOf = (l: PseudoLine) => KIND_LIGHT[l.kind ?? 'plain']

/**
 * How many lines a note will wrap to, and why it is estimated rather than
 * measured.
 *
 * The row heights have to be known before layout, because the panel's height and
 * therefore its real padding are derived from them. Measuring would mean a
 * render, a read and a second render, which on a slide that must look identical
 * in the browser and in the exported single HTML file is not worth the risk of
 * the two disagreeing.
 *
 * A `ReactNode` note counts as two lines: it cannot be measured as a string, and
 * guessing one line low is the failure that eats the padding.
 */
function noteLines(note: ReactNode | undefined): number {
  if (!note) return 0
  if (typeof note !== 'string') return 2
  return Math.max(1, Math.ceil(note.length / CHARS_PER_LINE))
}

const rowHeight = (l: PseudoLine) =>
  Math.max(ROW_BASE, noteLines(l.note) * NOTE_LH + NOTE_PAD_Y * 2)

/**
 * The hover aside. Same three rules as every hoverable thing in this lab, all of
 * them from `flowchart-lab`'s `NodeShell`:
 *
 *   1. **Never in the DOM unless open**, because all three harnesses measure
 *      static rectangles and would report a parked panel as overflowing.
 *   2. **The lift is CSS** (`.fc-node--hoverable`, 160ms, interruptible) and the
 *      **popover is framer**, because it mounts and unmounts and needs an exit.
 *   3. **The slot gets raised, not the popover.** `FcNodeIn` animates `transform`
 *      and so creates a stacking context; `index.css` raises `.fc-node-slot` with
 *      `:has()`, which is why the hoverable row lives inside an `FcNodeIn`.
 *
 * WHAT THE POPOVER CARRIES HERE, AND WHY IT IS NOT THE NOTE TWICE
 *
 * Once a line's beat has landed, its note is ON the slide, and a popover
 * repeating it would be a second copy of the same sentence. So the hover is armed
 * only on lines whose note has NOT yet been claimed: it is the presenter's
 * look-ahead, one line early, without showing the room the answer.
 *
 * That is a deliberate compromise and it has a cost worth writing down: the hover
 * affordance disappears as the build advances, and an affordance that comes and
 * goes is a weaker affordance. The alternative was worse, which is why the dot
 * marks unrevealed notes rather than hoverability in general.
 *
 * The 180ms is the UI-tier exception to this lab's timing scale: a hover is
 * triggered deliberately and repeatedly while the presenter waits for it.
 */
function HoverNote({
  note,
  title,
  paint,
  side,
  className = '',
  style,
  children,
}: {
  note?: ReactNode
  title: string
  paint: string
  side: 'top' | 'bottom'
  className?: string
  style?: CSSProperties
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()
  const id = useId()
  const has = Boolean(note)

  return (
    <div
      className="relative h-full w-full"
      onPointerEnter={() => has && setOpen(true)}
      onPointerLeave={() => setOpen(false)}
    >
      <div
        className={`fc-node h-full w-full ${has ? 'fc-node--hoverable' : ''} ${className}`}
        style={style}
        aria-describedby={open ? id : undefined}
      >
        {children}
      </div>
      <AnimatePresence>
        {open && note && (
          <motion.span
            id={id}
            role="tooltip"
            className="pointer-events-none absolute left-8 z-30 block w-[340px] rounded-card border border-line bg-white px-3.5 py-3 text-left text-[12.5px] leading-snug shadow-float"
            style={{
              color: colors.body,
              [side === 'top' ? 'bottom' : 'top']: 'calc(100% + 8px)',
              transformOrigin: side === 'top' ? 'bottom left' : 'top left',
            }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.96)' }}
            animate={{ opacity: 1, transform: 'scale(1)' }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.98)' }}
            transition={{ duration: 0.18, ease: c4(E.out) }}
          >
            <span
              className="mb-1 block font-heading text-[11px] font-bold uppercase tracking-wide"
              style={{ color: paint }}
            >
              {title}
            </span>
            {note}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Input this figure cannot draw, said out loud.
 *
 * `resolvePseudo` reports the meaning problems and this figure adds its own
 * geometry ones, because a panel 40px past the slide's budget is not a taller
 * figure, it is a figure with its last line under the instructor's video.
 */
function ProblemPanel({ problems, height }: { problems: string[]; height: number }) {
  return (
    <figure className="relative mx-auto" style={{ width: W, height }}>
      <div
        className="h-full w-full rounded-card bg-white px-6 py-5"
        style={{ border: `2px solid ${colors.danger}` }}
      >
        <span
          className="mb-3 block font-heading text-[13px] font-bold uppercase tracking-wide"
          style={{ color: colors.danger }}
        >
          This annotation cannot be drawn as authored
        </span>
        <ul className="space-y-1.5">
          {problems.map((p) => (
            <li key={p} className="text-body-sm" style={{ color: colors.ink }}>
              {p}
            </li>
          ))}
        </ul>
      </div>
    </figure>
  )
}

export function LineAnnotated({ title, lines, vars, trace, caption, className = '' }: PseudoFigureProps) {
  /*
    `vars` and `trace` are passed through to the resolver even though nothing here
    draws them: the contract is one shape for every variant, and a figure that
    quietly ignored an authoring mistake in the half it does not render would let
    that mistake reach the variant that does.
  */
  const g = resolvePseudo({ lines, vars, trace })

  const rows = g.lines.map((l) => ({ line: l, h: rowHeight(l) }))
  const rowsH = rows.reduce((sum, r) => sum + r.h, 0)
  const panelH = PAD_Y * 2 + HEADER_H + HEADER_GAP + rowsH
  const figureH = panelH + CAPTION_GAP + CAPTION_H

  const widestCode = Math.max(
    0,
    ...g.lines.map((l) => l.text.length * MONO_15 + (l.indent ?? 0) * INDENT),
  )

  /*
    BEATS. Beat 0 is free and it is the whole pseudocode block, unhighlighted and
    unannotated: the room sees the algorithm before anything is claimed about it,
    and the slide never opens on an empty stage that reads as a figure which
    failed to render.

    Then one click per line, in execution order, whether or not it has a note, so
    the build never skips and the room never loses its place. Then the caption.
    Count is derived from props, never from state.

    CLAIMED BEFORE THE PROBLEM PANEL CAN RETURN: a hook behind an early return is
    a hook that appears and disappears with the props.
  */
  const LINE0 = 1
  const CAPTION = LINE0 + g.lines.length
  const shown = useBeats(CAPTION + 1)

  const problems = [...g.problems]
  if (figureH > MAX_H) {
    problems.push(
      `the notes take this figure to ${figureH}px and the slide's budget is ${MAX_H}px, so a note has to become the next slide`,
    )
  }
  if (widestCode > CODE_ROOM) {
    problems.push(
      `the longest pseudocode line needs ${Math.ceil(widestCode)}px and the code column is ${CODE_ROOM}px`,
    )
  }
  if (problems.length) return <ProblemPanel problems={problems} height={Math.min(figureH, MAX_H)} />

  const activeIdx = (() => {
    let last = -1
    rows.forEach((_r, i) => {
      if (shown[LINE0 + i]) last = i
    })
    return last
  })()

  return (
    <figure className={`relative mx-auto ${className}`} style={{ width: W, height: figureH }}>
      <FcNodeIn
        at={0}
        shown={shown[0]}
        className="absolute rounded-card border border-line bg-white shadow-card-soft"
        style={{ left: 0, top: 0, width: W, height: panelH, padding: `${PAD_Y}px ${PAD_X}px` }}
      >
        {/* No filename bar and no language chip, because pseudocode is not a file
            and is not a language. What the header says instead is what the thing
            IS. */}
        <div className="flex items-center justify-between" style={{ height: HEADER_H }}>
          <span className="font-heading text-[15px] font-bold" style={{ color: colors.ink }}>
            {title}
          </span>
          <span
            className="rounded-pill px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide"
            style={{ background: `${colors.brand}14`, color: colors.brand }}
          >
            Line by line
          </span>
        </div>

        {/*
          THE CODE COLUMN'S DARK GROUND.

          One slab behind the code cells rather than a dark card: the notes beside
          them are sentences, and 14px prose reversed out on navy is the least
          readable thing on any slide in this repo. So code sits on the ground code
          sits on everywhere else in the course, and the note column stays paper.

          `zIndex: 0` and the rows at 1. This element is POSITIONED, and a
          positioned element paints above the inline content of the in-flow blocks
          around it, so without the rows being positioned in turn the slab would
          cover the very text it is a ground for. `relative` on each row slot is
          what puts them back on top, and it is the same line that makes their
          hover popovers work.
        */}
        <div
          aria-hidden
          className="absolute rounded-card"
          style={{
            left: PAD_X - 8,
            top: PAD_Y + HEADER_H + HEADER_GAP - 6,
            width: CODE_W + 12,
            height: rowsH + 12,
            background: CODE_BG,
            border: `1px solid ${CODE_BORDER}`,
            zIndex: 0,
          }}
        />

        <div style={{ marginTop: HEADER_GAP }}>
          {rows.map(({ line: l, h }, i) => {
            const paint = darkOf(l)
            const landed = shown[LINE0 + i]
            const on = i === activeIdx
            /*
              ARMED ON EVERY ROW, AND IT USED TO BE ARMED ONLY ON THE UNLANDED ONES.

              The intent was good: the note is the room's and the popover is the
              presenter's, so hovering a line that had not landed yet was the way
              to read ahead. It could never work. `FcNodeIn` holds an unlanded row
              at `opacity: 0`, the popover is a child of that same slot, and an
              opacity on an ancestor applies to the whole subtree, so the aside was
              rendered, positioned, and completely invisible.

              A hover that answers nothing is worse than no hover, so it is armed
              everywhere. On a landed row it repeats the note, which costs the room
              nothing because the room cannot hover a projector.
            */
            const peek = l.note
            return (
              <FcNodeIn
                key={l.n}
                at={LINE0 + i}
                shown={landed}
                /*
                  `relative` IS LOAD-BEARING, TWICE OVER.

                  `.fc-node-slot` in `index.css` raises a hovered slot to
                  `z-index: 60` so its popover paints above its neighbours, and a
                  `z-index` on a STATIC element is ignored outright. These rows are
                  in normal flow, so the raise did nothing: an aside opening
                  downward out of an early row was painted over by the text of the
                  rows below it and read as transparent.

                  It is also what puts the rows above the dark slab, which is a
                  positioned element and would otherwise paint over them.
                */
                className="relative"
                style={{ height: h }}
              >
                <HoverNote
                  note={peek}
                  title={`Line ${l.n}`}
                  paint={paint}
                  side={i < Math.ceil(rows.length / 2) ? 'bottom' : 'top'}
                >
                  <div
                    className="flex h-full items-center"
                    style={{ borderLeft: `3px solid ${on ? paint : 'transparent'}` }}
                  >
                    {/* THE CODE CELL. Mono, 15px, the indent drawn, and the tint
                        lives HERE rather than on the row: the row crosses from the
                        dark slab onto the white note column, and one wash cannot
                        be right on both grounds. */}
                    <span
                      className="flex h-full shrink-0 items-center rounded-lg"
                      style={{
                        width: CODE_W,
                        paddingLeft: 6,
                        /* A 12 wash is invisible on navy. The tint has to carry on
                           the ground it is painted on. */
                        background: on ? `${paint}2b` : undefined,
                      }}
                    >
                      <span
                        className="shrink-0 text-right font-mono text-[11px]"
                        style={{ width: GUTTER, color: on ? paint : CODE_GUTTER }}
                      >
                        {l.n}
                      </span>
                      <span
                        className="font-mono text-[15px] leading-[1.35]"
                        style={{
                          marginLeft: GUTTER_GAP,
                          /* Drawn, never spaces inside `text`: spaces would be
                             part of the string, unmeasurable, and would break the
                             width arithmetic in the doc comment. */
                          paddingLeft: (l.indent ?? 0) * INDENT,
                        }}
                      >
                        {/* KEYWORDS COLOURED, and the declared variables with them.
                            The tokenizer emits every character verbatim, so the
                            width arithmetic is untouched. */}
                        <PseudoText text={l.text} vars={g.vars} dim={!landed} bold={on} />
                      </span>
                    </span>

                    {/* THE NOTE CELL. Empty for a line with nothing to say, and it
                        claims no height when empty: the row falls back to its
                        34px base. */}
                    <span
                      className="flex shrink-0 items-center"
                      style={{ width: NOTE_W, marginLeft: COL_GAP, paddingLeft: NOTE_PAD_X, paddingRight: NOTE_PAD_X }}
                    >
                      {l.note && landed && (
                        <span
                          className="block text-[14px] leading-[1.4]"
                          style={{ color: on ? colors.ink : colors.body }}
                        >
                          {l.note}
                        </span>
                      )}
                      {l.note && !landed && (
                        /* The look-ahead marker: the room can see that this line
                           has something to say before it is said, which is why
                           they wait for it rather than reading ahead. */
                        <span
                          aria-hidden
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: `${lightOf(l)}66` }}
                        />
                      )}
                    </span>
                  </div>
                </HoverNote>
              </FcNodeIn>
            )
          })}
        </div>
      </FcNodeIn>

      {caption && (
        <FcEdgeLabel
          at={CAPTION}
          shown={shown[CAPTION]}
          className="absolute text-center text-body-sm"
          style={{ left: 0, width: W, top: panelH + CAPTION_GAP, color: colors.body }}
        >
          {caption}
        </FcEdgeLabel>
      )}
    </figure>
  )
}
