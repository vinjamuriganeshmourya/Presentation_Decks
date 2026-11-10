import { colors } from '@/design/tokens'
import { motion, useReducedMotion } from 'framer-motion'
import { T } from '@/ui/figureTiming'
import { FcEdgeLabel, FcNodeIn, useBeats } from './motion'
import { resolveGraph, type FlowchartFigureProps } from './flowchartFigure'

/**
 * STEP LEDGER — the flow chart with no boxes at all.
 *
 * THE ARGUMENT
 *
 * Most teaching flow charts are a list of things that happen in order, and a box
 * around each one adds nothing except a border to align. This sets the process as
 * type: a number in the gutter, a rule between rows, the step in the reading
 * face. The eye goes down the numbers, which is the same information a spine of
 * arrows carries and costs about a third of the ink.
 *
 * This is `STYLE_GUIDE.md` section 8 applied to a flow chart: *"Ask what the
 * slide ARGUES, then pick the form that draws that argument."* Boxes and arrows
 * draw "these are discrete units connected by transitions". If the transitions
 * are all just "and then", the boxes are decoration.
 *
 * THE FORK IS THE ONE PLACE IT SPENDS INK
 *
 * A decision row splits into two labelled outcomes, indented under the question,
 * each with its own rule in its own colour. That is the only branching this form
 * can express, and it is honest about that: a chart with three decisions is not a
 * ledger, it is a `CircuitMap`.
 *
 * WHERE IT WINS AND WHERE IT LOSES
 *
 * Wins on long labels. Every other variant in this lab wraps "Automated checks
 * run" into two lines inside a fixed slot; here the row is full width and the
 * words simply sit there. Loses the moment the room needs to see the SHAPE of
 * the process, because a ledger has no shape: a loop back to step two is a line
 * of text saying so, not a line you can point at.
 */

const W = 980
const ROW_H = 58
const FORK_H = 46

const PAINT = {
  main: colors.brand,
  alt: colors.accentDark,
  end: colors.success,
}

export function StepLedger({ nodes, edges, caption, className = '' }: FlowchartFigureProps) {
  const g = resolveGraph({ nodes, edges })
  const reduce = useReducedMotion()
  const gateIdx = g.spine.findIndex((n) => n.kind === 'decision')
  const altEdge = g.alt[0]
  const yesEdge = g.main.find((e) => e.from === g.spine[gateIdx]?.id)
  const altNode = g.offSpine[0]
  const loopEdge = g.loop[0]

  /* Rows are the spine; the fork block is injected straight after the decision,
     so the two outcomes read as belonging to the question above them. */
  /*
    BEATS RUN IN VISUAL ORDER HERE, NOT IN SPINE ORDER.

    Every other variant is a diagram, so its beats follow the path. A ledger is
    read top to bottom, and the fork is printed BETWEEN the decision row and the
    row after it. Numbering by spine index would reveal row 4 before the two
    outcomes sitting above it, which is the one thing a list must not do.

    So a running counter assigns a beat to each block in the order it appears on
    the page, and the fork takes two of them: Yes, then No. That also gives the
    two branches their own clicks, rather than landing together.
  */
  let y = 0
  let cursor = 0
  const rows = g.spine.map((n, i) => {
    const top = y
    const at = cursor
    cursor += 1
    y += ROW_H
    if (i === gateIdx) {
      y += FORK_H * 2
      cursor += 2 /* the Yes row, then the No row */
    }
    return { node: n, top, i, at }
  })
  const FORK_YES = (rows[gateIdx]?.at ?? 0) + 1
  const FORK_NO = FORK_YES + 1
  const CAPTION = cursor
  const shown = useBeats(CAPTION + 1)
  const H = y + 44

  return (
    <figure className={`relative mx-auto ${className}`} style={{ width: W, height: H }}>
      {rows.map(({ node: n, top, i, at }) => {
        const isEnd = n.kind === 'end'
        const isDecision = n.kind === 'decision'
        const paint = isEnd ? PAINT.end : PAINT.main
        return (
          <div key={n.id}>
            <FcNodeIn
              at={at}
              shown={shown[at]}
              className="absolute flex items-baseline gap-5"
              style={{ left: 0, top, width: W, height: ROW_H }}
            >
              {/* The number IS the connector. It is what the eye follows down the
                  page, so it carries the weight the arrows carry elsewhere. */}
              <span
                className="w-9 shrink-0 text-right font-heading text-[26px] font-extrabold leading-none"
                style={{ color: isDecision ? paint : `${paint}59` }}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className="font-heading text-[21px] font-bold leading-tight"
                  style={{ color: isDecision ? paint : colors.ink }}
                >
                  {n.label}
                </span>
                {n.caption && (
                  <span className="ml-3 text-body-sm" style={{ color: colors.body }}>
                    {n.caption}
                  </span>
                )}
              </span>
              {isEnd && (
                <span
                  className="shrink-0 rounded-pill px-2.5 py-0.5 text-[12px] font-bold uppercase tracking-wide"
                  style={{ background: `${PAINT.end}1a`, color: PAINT.end }}
                >
                  End
                </span>
              )}
            </FcNodeIn>

            {/* The rule under each row, drawn left to right in time with it.
                `scaleX` from a left origin rather than an animated width: the kit
                animates transform and opacity only. */}
            <motion.span
              aria-hidden
              className="absolute"
              style={{
                left: 56,
                top: top + ROW_H - 10,
                width: W - 56,
                height: 1,
                background: colors.line,
                transformOrigin: 'left center',
              }}
              initial={reduce ? false : { transform: 'scaleX(0)' }}
              animate={{ transform: shown[at] ? 'scaleX(1)' : 'scaleX(0)' }}
              transition={{ duration: T.drawStep, delay: 0, ease: 'linear' }}
            />
          </div>
        )
      })}

      {/*
        THE FORK, AND WHY THE "YES" BRANCH NAMES A NUMBER RATHER THAN A STEP.

        The first version printed the next spine node's label in the Yes branch,
        so "A reviewer reads it" appeared twice: once as the outcome of the
        question and again as row 4 directly underneath it. The room reads that
        as two separate things happening.

        In a ledger the happy path IS the next row, so the Yes branch only has to
        say so, and it says it by number. The No branch is the one that leaves the
        page, so it is the one that gets a name.
      */}
      {gateIdx >= 0 && yesEdge && (
        <FcNodeIn
          at={FORK_YES}
          shown={shown[FORK_YES]}
          className="absolute flex items-center gap-4"
          style={{ left: 56, top: rows[gateIdx].top + ROW_H, width: W - 56, height: FORK_H }}
        >
          <span
            className="shrink-0 rounded-pill px-2.5 py-1 text-[12px] font-bold uppercase tracking-wide"
            style={{ background: `${PAINT.main}1a`, color: PAINT.main }}
          >
            {yesEdge.label}
          </span>
          <span aria-hidden className="h-[2px] w-8 shrink-0 rounded-pill" style={{ background: PAINT.main }} />
          <span className="text-body-lg" style={{ color: colors.body }}>
            carry on to step {g.spineIndex(yesEdge.to) + 1}
          </span>
        </FcNodeIn>
      )}

      {gateIdx >= 0 && altEdge && altNode && (
        <FcNodeIn
          at={FORK_NO}
          shown={shown[FORK_NO]}
          className="absolute flex items-center gap-4"
          style={{ left: 56, top: rows[gateIdx].top + ROW_H + FORK_H, width: W - 56, height: FORK_H }}
        >
          <span
            className="shrink-0 rounded-pill px-2.5 py-1 text-[12px] font-bold uppercase tracking-wide"
            style={{ background: `${PAINT.alt}1a`, color: PAINT.alt }}
          >
            {altEdge.label}
          </span>
          <span aria-hidden className="h-[2px] w-8 shrink-0 rounded-pill" style={{ background: PAINT.alt }} />
          <span className="font-heading text-[18px] font-bold" style={{ color: colors.ink }}>
            {altNode.label}
          </span>
          {loopEdge && (
            <span className="text-body-sm" style={{ color: PAINT.alt }}>
              then {loopEdge.label}, back to step {g.spineIndex(loopEdge.to) + 1}
            </span>
          )}
        </FcNodeIn>
      )}

      {caption && (
        <FcEdgeLabel
          at={CAPTION}
          shown={shown[CAPTION]}
          className="absolute text-body-sm"
          style={{ left: 56, top: H - 26, color: colors.body }}
        >
          {caption}
        </FcEdgeLabel>
      )}
    </figure>
  )
}
