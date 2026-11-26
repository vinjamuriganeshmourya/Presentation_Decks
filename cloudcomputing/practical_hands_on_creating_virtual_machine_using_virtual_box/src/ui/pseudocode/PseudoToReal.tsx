import { useId, useState, type CSSProperties, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { colors } from '@/design/tokens'
import { E, c4 } from '@/ui/figureTiming'
import { FcArrowDefs, FcEdgeDraw, FcEdgeLabel, FcNodeIn, useBeats } from '@/ui/figures/motion'
import {
  CODE_BG,
  CODE_BORDER,
  CODE_CHIP_BG,
  CODE_CHIP_FG,
  CODE_GUTTER,
  CODE_TITLE,
  KIND_DARK,
  PseudoText,
  RealText,
} from './pseudoText'
import {
  resolvePseudo,
  type PseudoFigureProps,
  type PseudoLine,
} from './pseudoFigure'

/**
 * PSEUDO TO REAL — the bridge, and the two lines that have nothing on the far side.
 *
 * THE ARGUMENT
 *
 * Pseudocode earns its slide only if the learner can see it become code. So the
 * algorithm sits on the left, the real implementation on the right, and each real
 * line is DRAWN AT THE Y OF THE PSEUDOCODE LINE IT IMPLEMENTS, with a connector
 * between them. The pairing is not left to the room to work out from two blocks
 * of text sitting side by side, which is what a pair of `CodeBlock`s would be.
 *
 * `real.map` is authored, never guessed: `map[realIndex]` is the pseudocode line
 * that real line implements. Guessing it by index would pair `print(largest)`
 * with `END IF` and teach the wrong thing with total confidence.
 *
 * THE ABSENCE IS THE TEACHING, AND IT IS SHOWN HONESTLY
 *
 * Pseudocode lines 6 and 7, `END IF` and `END FOR`, HAVE NO REAL COUNTERPART.
 * Python closes a block by ending the indentation, so there is nothing on the
 * right for them to point at. That is not a hole in the figure, it is the single
 * most useful thing on the slide: it is where the room learns that the shape of
 * the pseudocode and the shape of the code are not the same shape.
 *
 * So those two rows get their own beat, their own marker on the right ("Nothing
 * here"), and their own hover note saying why. What this figure must never do,
 * and what a naive index pairing does by default, is invent a partner for them or
 * quietly skip them so the reader never notices two lines went missing. The
 * fixture's comment says exactly this, and the figure is built to obey it.
 *
 * WHY THE REAL SIDE IS NOT `CodeBlock`, WHICH IS THE ONE PLACE IT WOULD BE LEGAL
 *
 * The contract's rule is that pseudocode must not go through `CodeBlock`, and the
 * right-hand side here is not pseudocode: it is real Python, it will become a
 * file, and a language chip on it would be TRUE. So `CodeBlock` was allowed, and
 * it is still not used, for one reason that has nothing to do with taste: this
 * figure has to light ONE real line at a time and place each real line at an
 * arbitrary y, and `CodeBlock` renders a block. The asymmetry the reader sees is
 * therefore honest anyway: the left panel is labelled "Pseudocode" and carries no
 * language, the right panel is labelled `python` and does, which is the whole
 * claim the slide is making.
 *
 * WHAT IT IS WORST AT
 *
 * **It only draws a one-to-one map.** Two real lines implementing the same
 * pseudocode line would be placed at the same y and would draw on top of each
 * other, so that case is a listed problem rather than a render. Real code
 * collapses and expands against pseudocode constantly, and the honest version of
 * this figure for a many-to-one algorithm does not exist yet.
 *
 * **The right column is mostly air.** Five real lines occupy a panel scaled to
 * eight pseudocode rows, because the rows have to line up. That is the cost of
 * the alignment being geometric rather than described, and it is a bad trade on
 * an algorithm where the pseudocode is twice the length of the code.
 *
 * Third: **the connector is the weakest part on a projector.** It is a 140px
 * horizontal line in a gap, and at the back of a room the reader may be doing the
 * pairing from the shared y rather than from the line. That is why the active pair
 * is tinted on BOTH sides and not only joined.
 *
 * GEOMETRY, AND THE PADDING ARITHMETIC
 *
 * A fixed 1040x368 figure on the 1280x720 slide. Left panel 460, a 140px
 * connector gap, right panel 440: 460 + 140 + 440 = 1040.
 *
 * PADDING IS A FLOOR, NOT A DECLARATION. A box shows `(box height - content
 * height) / 2`, so both panels are SIZED FROM the content:
 *
 *   - Panel height = 14 + header 22 + 12 + 8 rows of 34 + 14 = **334**, so the
 *     real vertical padding is exactly **14px** by construction. Both panels take
 *     the same height because the right one's rows are positioned at the left
 *     one's y values, which only works if the two grids are identical.
 *   - A row is 34px and holds one 15px mono line on 1.35 leading (20.25px), so
 *     **6.8px** above and below.
 *   - Left code column. Inner width 460 - 32 = 428. The longest line, "SET
 *     largest TO first item of numbers" at 36 characters of 15px mono (9px each),
 *     needs 324, plus a 26px gutter and a 10px gap: 360. 68px spare, which pays
 *     for `indent` being drawn at 18px a level.
 *   - Right code column. Inner width 440 - 32 = 408. The longest real line,
 *     "        largest = item" at 22 characters including its own leading spaces,
 *     needs 198. The leading spaces are real characters in the string and are
 *     preserved by `whitespace-pre`, because on the REAL side the indentation IS
 *     the syntax.
 *   - The "Nothing here" marker is 26px tall inside a 34px row, so **4px** above
 *     and below, and it is deliberately smaller than a code row: it is an absence,
 *     not a step.
 *   - Connectors run from x 466 to x 592 at each row's centre, and the caption
 *     sits at y 342, 26px tall, clearing both panels by 8.
 *
 * All of it is re-derived from the props at render, and a failure is a listed
 * problem. The sibling lab's five cards declared 12px of padding and showed 0px,
 * 0px, 0px, 0px and -7px, for as long as the arithmetic lived only in a comment.
 */

/* Stage. */
const W = 1040
const LEFT_W = 460
const GAP = 140
const RIGHT_W = 440
const PAD_X = 16
const PAD_Y = 14
const HEADER_H = 22
const HEADER_GAP = 12
const ROW_H = 34
const CAPTION_H = 26
const CAPTION_GAP = 8

/* Rows and type metrics. */
const INDENT = 18
const GUTTER = 26
const GUTTER_GAP = 10
const MONO_15 = 9
const LEFT_ROOM = LEFT_W - PAD_X * 2 - GUTTER - GUTTER_GAP /* 392 */
const RIGHT_ROOM = RIGHT_W - PAD_X * 2 /* 408 */

/* Connector ends, inside the gap and touching neither panel. */
const WIRE_X0 = LEFT_W + 6
const WIRE_X1 = LEFT_W + GAP - 8

/*
  BOTH PANELS ARE DARK, SO THERE IS ONE RAMP AND IT IS THE DARK ONE.

  `KIND_DARK` lives in `pseudoText.tsx` with the highlighter, because the ramp and
  the syntax palette have to balance on the same ground and three private copies
  is how the sibling lab's padding came to differ per variant.
*/
const paintOf = (l: PseudoLine | undefined) => KIND_DARK[l?.kind ?? 'plain']

/**
 * The hover aside. Same three rules as everywhere else in this lab, all from
 * `flowchart-lab`'s `NodeShell`: never in the DOM unless open (the harnesses
 * measure static rectangles), the lift is an interruptible CSS transition while
 * the popover is framer because it mounts and unmounts, and the SLOT is what gets
 * raised, via `.fc-node-slot:has(...)` in `index.css`, because `FcNodeIn`
 * animates `transform` and therefore creates a stacking context a `z-index` in
 * here could never escape.
 *
 * On this figure the popover carries two different things, and both are asides
 * rather than teaching: a pseudocode line's `note`, and, on lines 6 and 7, why
 * there is nothing on the right. The absence itself is stated in the marker, on
 * the slide, where the room can see it without a pointer.
 *
 * The 180ms is the documented UI-tier exception to this lab's timing scale.
 */
function HoverNote({
  note,
  title,
  paint,
  side,
  align = 'left',
  onEnter,
  onLeave,
  className = '',
  style,
  children,
}: {
  note?: ReactNode
  title: string
  paint: string
  side: 'top' | 'bottom'
  align?: 'left' | 'right'
  onEnter?: () => void
  onLeave?: () => void
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
      onPointerEnter={() => {
        onEnter?.()
        if (has) setOpen(true)
      }}
      onPointerLeave={() => {
        onLeave?.()
        setOpen(false)
      }}
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
            className="pointer-events-none absolute z-30 block w-[300px] rounded-card border border-line bg-white px-3.5 py-3 text-left text-[12.5px] leading-snug shadow-float"
            style={{
              color: colors.body,
              [align === 'left' ? 'left' : 'right']: 8,
              [side === 'top' ? 'bottom' : 'top']: 'calc(100% + 8px)',
              transformOrigin: `${side === 'top' ? 'bottom' : 'top'} ${align}`,
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
 * `resolvePseudo` checks the lines and the trace. The map is this figure's
 * business, so its checks are here: a real line pointing at a pseudocode line
 * that does not exist, two real lines claiming the same one, or a map whose length
 * does not match the code. Every one of those renders as something plausible, and
 * a plausible wrong pairing is worse than no figure.
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
          This bridge cannot be drawn as authored
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

/*
  WHY AN ORPHAN HAS NO COUNTERPART DEPENDS ON THE LINE, AND SAYING ONE REASON FOR
  ALL OF THEM IS A FALSE STATEMENT.

  The first pass printed "the indentation already closed the block" against every
  unmapped line. That is exactly right for `END IF` and `END FOR`, and simply
  untrue for line 1, `INPUT numbers`: nothing closed a block there. `INPUT` has no
  counterpart because it names what the algorithm is GIVEN, and in Python that is
  a parameter or a variable that already exists, not a statement.

  So the reason is derived from what the line IS. A figure that explains an
  absence has to explain the right absence, or it teaches a wrong rule about the
  language while looking authoritative.
*/
function orphanReason(kind: PseudoLine['kind']): { short: string; note: string } {
  if (kind === 'plain') {
    return {
      short: 'Nothing here: the indentation already closed the block',
      note: 'Python ends a block by ending the indentation, so there is no line here to point at.',
    }
  }
  if (kind === 'io') {
    return {
      short: 'Nothing here: this is what the algorithm is given',
      note: 'An INPUT line names what the algorithm receives. In Python that is a parameter or a value that already exists, not a statement you write.',
    }
  }
  return {
    short: 'Nothing here: no single statement implements this line',
    note: 'This pseudocode line has no one-to-one counterpart in the implementation.',
  }
}

export function PseudoToReal({
  title,
  lines,
  vars,
  trace,
  real,
  caption,
  className = '',
}: PseudoFigureProps) {
  const g = resolvePseudo({ lines, vars, trace })

  const panelH = PAD_Y * 2 + HEADER_H + HEADER_GAP + g.lines.length * ROW_H
  const figureH = panelH + CAPTION_GAP + CAPTION_H
  const rowsTop = PAD_Y + HEADER_H + HEADER_GAP

  /* y of a pseudocode line, inside a panel. Both grids use it, which is what
     makes a connector a straight horizontal line. */
  const rowIndex = (n: number) => g.lines.findIndex((l) => l.n === n)
  const rowTop = (n: number) => rowsTop + rowIndex(n) * ROW_H
  const rowMid = (n: number) => rowTop(n) + ROW_H / 2

  const realLines = real?.lines ?? []
  const map = real?.map ?? []

  /* Pairs, and the pseudocode lines nothing pairs with. The second list is the
     point of the figure, so it is computed rather than noticed. */
  const pairs = realLines.map((text, i) => ({ text, i, pseudo: map[i] }))
  const orphans = g.lines.filter((l) => !map.includes(l.n))

  /*
    BEATS. Beat 0 is free and it is the pseudocode block plus the empty real
    panel: the room reads the algorithm before any claim is made about how Python
    spells it, and the slide never opens on an empty stage.

    Then one click per real line, in file order, each landing its line, its
    connector and the highlight on its pseudocode partner. Then ONE click for the
    orphans, together, because "these two have nothing on the right" is a single
    idea and splitting it over two clicks would make it look like two accidents.
    Then the caption.

    Derived from props, never from state, so the step count the deck registers is
    stable while the slide is up. No dead clicks: every beat changes the screen.

    BOTH HOOKS ARE CLAIMED BEFORE THE PROBLEM PANEL CAN RETURN. A hook behind an
    early return is a hook that appears and disappears with the props.
  */
  const PAIR0 = 1
  const ORPHAN = PAIR0 + pairs.length
  const CAPTION = ORPHAN + (orphans.length ? 1 : 0)
  const shown = useBeats(CAPTION + 1)

  /*
    HOVER OVERRIDES THE BUILD, IN BOTH DIRECTIONS.

    Pointing at a pseudocode line lights its real counterpart and pointing at a
    real line lights its pseudocode line, because the pairing is a two-way claim
    and a presenter answering "which line is that?" comes at it from whichever
    side the question did.
  */
  const [hover, setHover] = useState<number | null>(null)

  const problems = [...g.problems]
  if (real && map.length !== realLines.length) {
    problems.push(
      `real.map has ${map.length} entries for ${realLines.length} real lines, so the pairing is incomplete`,
    )
  }
  for (const p of pairs) {
    if (p.pseudo === undefined || !g.byLine[p.pseudo]) {
      problems.push(`real line ${p.i + 1} maps to pseudocode line ${String(p.pseudo)}, which does not exist`)
    }
  }
  const seen = new Set<number>()
  for (const p of pairs) {
    if (p.pseudo !== undefined) {
      if (seen.has(p.pseudo)) {
        problems.push(
          `two real lines map to pseudocode line ${p.pseudo}, and this figure places them at the same y, so they would draw on top of each other`,
        )
      }
      seen.add(p.pseudo)
    }
  }
  const widestLeft = Math.max(
    0,
    ...g.lines.map((l) => l.text.length * MONO_15 + (l.indent ?? 0) * INDENT),
  )
  const widestRight = Math.max(0, ...realLines.map((t) => t.length * MONO_15))
  if (widestLeft > LEFT_ROOM) {
    problems.push(`the longest pseudocode line needs ${Math.ceil(widestLeft)}px and its column is ${LEFT_ROOM}px`)
  }
  if (widestRight > RIGHT_ROOM) {
    problems.push(`the longest real line needs ${Math.ceil(widestRight)}px and its column is ${RIGHT_ROOM}px`)
  }
  if (!real) problems.push('no `real` was given, and the bridge is the whole figure')
  if (problems.length) return <ProblemPanel problems={problems} height={figureH} />

 const landedPairs = pairs.filter((p) => shown[PAIR0 + p.i])
  const steppedLine = landedPairs.length ? landedPairs[landedPairs.length - 1].pseudo : undefined
  const active = hover ?? steppedLine

  return (
    <figure className={`relative mx-auto ${className}`} style={{ width: W, height: figureH }}>
      {/* THE CONNECTORS. One aria-hidden SVG layer in the gap only: it crosses
          neither panel, so it can never be painted over by a `.fc-node-slot`,
          which is how the sibling lab lost every line that crossed a tinted lane.
          Lines are geometry; every label in this figure is a real DOM element,
          per content rule 17. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0"
        width={W}
        height={figureH}
        viewBox={`0 0 ${W} ${figureH}`}
      >
        <FcArrowDefs id="p2r" colors={{ main: colors.brand, none: colors.muted }} />
        {pairs.map((p) => {
          const n = p.pseudo as number
          const on = active === n
          return (
            <FcEdgeDraw
              key={`w${p.i}`}
              d={`M ${WIRE_X0} ${rowMid(n)} H ${WIRE_X1}`}
              at={PAIR0 + p.i}
              shown={shown[PAIR0 + p.i]}
              stroke={on ? colors.brand : `${colors.brand}55`}
              width={on ? 2.5 : 2}
              markerEnd="url(#p2r-main)"
            />
          )
        })}
        {/* THE ABSENCE, DRAWN AS A STUB THAT STOPS. It leaves the pseudocode and
            gets nowhere, which is the truth about `END IF` in Python. */}
        {orphans.map((l) => (
          <FcEdgeDraw
            key={`o${l.n}`}
            d={`M ${WIRE_X0} ${rowMid(l.n)} H ${WIRE_X0 + 34}`}
            at={ORPHAN}
            shown={shown[ORPHAN]}
            stroke={colors.muted}
            width={2}
            dashed
          />
        ))}
      </svg>

      {/* THE PSEUDOCODE. No filename, no language chip: it is not a file and it is
          not a language, and saying either would tell the learner to start typing
          one slide too early. */}
      <div
        /* DARK, and the panel on the right is dark too. The asymmetry this figure
           argues for is in the CHIP, which says "pseudocode" on one side and names
           a real language on the other. Putting the sketch on paper and the code on
           navy would have made it a difference of MEDIUM instead, which is the one
           claim the figure must not make: they are the same thing, one step apart. */
        className="absolute rounded-card shadow-card"
        style={{
          left: 0,
          top: 0,
          width: LEFT_W,
          height: panelH,
          padding: `${PAD_Y}px ${PAD_X}px`,
          background: CODE_BG,
          border: `1px solid ${CODE_BORDER}`,
        }}
      >
        <div className="flex items-center justify-between" style={{ height: HEADER_H }}>
          <span className="truncate font-heading text-[15px] font-bold" style={{ color: CODE_TITLE }}>
            {title}
          </span>
          <span
            className="shrink-0 rounded-pill px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide"
            style={{ background: CODE_CHIP_BG, color: CODE_CHIP_FG }}
          >
            Pseudocode
          </span>
        </div>

        <div style={{ marginTop: HEADER_GAP }}>
          {g.lines.map((l) => {
            const paint = paintOf(l)
            const on = active === l.n
            const orphan = !map.includes(l.n)
            return (
              <FcNodeIn
                key={l.n}
                at={0}
                shown={shown[0]}
                /*
                  `relative` IS LOAD-BEARING, AND ITS ABSENCE WAS THE BUG REPORTED
                  FROM THIS SLIDE.

                  `.fc-node-slot` in `index.css` raises a hovered slot to
                  `z-index: 60` so its popover paints above its neighbours, and a
                  `z-index` on a STATIC element is ignored outright. These rows are
                  the only ones in this figure in normal flow, the rows on the right
                  are absolutely positioned, so only this column was affected: the
                  first four lines open their aside DOWNWARD, it was painted over by
                  the code of every row below it, and it read as transparent. The
                  last four open upward over rows earlier in the DOM and always
                  looked fine, which is exactly the half-broken symptom reported.

                  `relative` with no offsets moves nothing and makes the z-index
                  apply.
                */
                className="relative"
                style={{ height: ROW_H }}
              >
                <HoverNote
                  note={
                    orphan
                      ? /* Why there is nothing on the right, in the learner's
                           terms. Rendered text, so no spaced em dashes. */
                        'Python ends a block by ending the indentation, so this line has no counterpart in the code at all.'
                      : l.note
                  }
                  title={`Line ${l.n}`}
                  paint={paint}
                  side={rowIndex(l.n) < Math.ceil(g.lines.length / 2) ? 'bottom' : 'top'}
                  onEnter={() => setHover(l.n)}
                  onLeave={() => setHover(null)}
                >
                  <div
                    className="flex h-full items-center rounded-lg"
                    style={{
                      /* A 12 wash is invisible on navy. The tint has to carry on
                         the ground it is painted on. */
                      background: on ? `${paint}2b` : undefined,
                      borderLeft: `3px solid ${on ? paint : 'transparent'}`,
                      paddingLeft: 6,
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
                        /* Drawn per level, never spaces inside `text`. On the
                           pseudocode side the indent is a claim about nesting; on
                           the real side, next door, it is syntax. */
                        paddingLeft: (l.indent ?? 0) * INDENT,
                      }}
                    >
                      {/* KEYWORDS COLOURED, and the declared variables with them.
                          An orphan line is dimmed rather than recoloured: it is
                          still pseudocode, it just has nothing on the right. */}
                      <PseudoText text={l.text} vars={g.vars} dim={orphan} bold={on} />
                    </span>
                  </div>
                </HoverNote>
              </FcNodeIn>
            )
          })}
        </div>
      </div>

      {/* THE REAL CODE. Same grid, so a pair shares a y. The language chip here is
          TRUE, which is the entire asymmetry with the panel on the left. */}
      <div
        className="absolute rounded-card shadow-card"
        style={{
          left: LEFT_W + GAP,
          top: 0,
          width: RIGHT_W,
          height: panelH,
          padding: `${PAD_Y}px ${PAD_X}px`,
          background: CODE_BG,
          border: `1px solid ${CODE_BORDER}`,
        }}
      >
        <div className="flex items-center justify-between" style={{ height: HEADER_H }}>
          <span className="font-heading text-[15px] font-bold" style={{ color: CODE_TITLE }}>
            The code
          </span>
          <span
            /* The chip on THIS side names a real language, and that is the whole
               asymmetry with the panel on the left. */
            className="shrink-0 rounded-pill px-2 py-0.5 font-mono text-[10.5px] font-bold lowercase"
            style={{ background: CODE_CHIP_BG, color: CODE_CHIP_FG }}
          >
            {real?.language}
          </span>
        </div>

        {/* Rows are absolutely positioned at their partner's y rather than
            stacked, which is what makes the two orphan bands visibly EMPTY. */}
        {pairs.map((p) => {
          const n = p.pseudo as number
          const on = active === n
          return (
            <FcNodeIn
              key={`r${p.i}`}
              at={PAIR0 + p.i}
              shown={shown[PAIR0 + p.i]}
              className="absolute"
              style={{ left: PAD_X, right: PAD_X, top: rowTop(n), height: ROW_H }}
            >
              <HoverNote
                note={g.byLine[n]?.note}
                title={`Line ${n}`}
                paint={colors.brand}
                align="right"
                side={rowIndex(n) < Math.ceil(g.lines.length / 2) ? 'bottom' : 'top'}
                onEnter={() => setHover(n)}
                onLeave={() => setHover(null)}
              >
                <div
                  className="flex h-full items-center rounded-lg"
                  style={{
                    background: on ? `${colors.info}2b` : undefined,
                    borderLeft: `3px solid ${on ? colors.info : 'transparent'}`,
                    paddingLeft: 8,
                  }}
                >
                  <span className="font-mono text-[15px] leading-[1.35]">
                    {/* COLOURED THE WAY VS CODE COLOURS IT: control flow in mauve,
                        declarations in blue, a call in function yellow. And
                        `whitespace-pre` inside `RealText` keeps the real leading
                        spaces, because on this side the indentation IS the block. */}
                    <RealText text={p.text} language={real?.language} bold={on} />
                  </span>
                </div>
              </HoverNote>
            </FcNodeIn>
          )
        })}

        {/* THE HONEST GAP. A marker, not a partner, and never a blank the reader
            could read as a rendering failure. */}
        {orphans.map((l) => (
          <FcNodeIn
            key={`om${l.n}`}
            at={ORPHAN}
            shown={shown[ORPHAN]}
            className="absolute"
            style={{ left: PAD_X, right: PAD_X, top: rowTop(l.n) + 4, height: 26 }}
          >
            <HoverNote
              note={orphanReason(l.kind).note}
              title="No counterpart"
              paint={colors.muted}
              align="right"
              side={rowIndex(l.n) < Math.ceil(g.lines.length / 2) ? 'bottom' : 'top'}
              onEnter={() => setHover(l.n)}
              onLeave={() => setHover(null)}
            >
              <div
                className="flex h-full items-center rounded-lg px-2.5"
                style={{ border: `1px dashed ${colors.white}33`, background: `${colors.white}0a` }}
              >
                <span className="text-[11.5px] font-semibold" style={{ color: `${colors.white}8a` }}>
                  {orphanReason(l.kind).short}
                </span>
              </div>
            </HoverNote>
          </FcNodeIn>
        ))}
      </div>

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
