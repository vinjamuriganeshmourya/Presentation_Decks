import { colors } from '@/design/tokens'
import { FcArrowDefs, FcEdgeDraw, FcEdgeLabel, FcNodeIn, useBeats } from './motion'
import { resolveGraph, type FlowchartFigureProps } from './flowchartFigure'
import { NodeShell, lookOf, NODE_MIN_H } from './NodeShell'

/**
 * GATE FLOW — the decision is a barrier the work has to get past, not a box in the row.
 *
 * THE ARGUMENT
 *
 * Every other variant in this lab draws the decision as one more card in a
 * sequence: same height, same silhouette, same weight as the steps around it. So
 * the room reads it as a step that happens to have two arrows, and the fork is
 * carried entirely by the arrows.
 *
 * This one gives the decision physical extent. The steps run left to right at
 * card height; the decision is a tall narrow bar standing ACROSS the line, 60px
 * wide and 190px tall, taller than everything it interrupts. The happy path is
 * drawn passing THROUGH it and out the far side. The failing path is ejected out
 * of the bar's underside and travels back leftward on a lower track to the step
 * it retries.
 *
 * The claim: a checkpoint is a place, not an activity. Nothing gets to the right
 * of the bar without being let through, and the picture says that with geometry
 * instead of asking the reader to infer it from two arrowheads. It is the shape
 * of a toll gate, a customs desk, a CI gate, which is what these decisions
 * usually are in the processes we teach.
 *
 * WHAT IT IS WORST AT
 *
 * **A chart with two decisions.** The whole effect depends on the bar being the
 * only tall object on the stage, and on there being one lower track underneath
 * it. Add a second gate and you get two barriers competing for the same
 * "everything must pass me" reading, plus two ejection paths that have to share
 * one lower lane; the second one either crosses the first or needs a third
 * vertical level the 380px stage does not have. This variant renders the FIRST
 * decision as a gate and would have to demote any others to ordinary cards,
 * which is exactly the inconsistency it exists to remove.
 *
 * Second, narrower failure: the question does not fit in the bar. A 60px column
 * cannot hold "All checks pass?" at any readable size, so the question is set as
 * a DOM label ABOVE the gate, and its tie to the bar is proximity alone. Give it
 * a question longer than about six words and the label grows wider than the gap
 * between the two cards it sits between, and starts to look like a title for the
 * whole figure rather than the gate's own text.
 *
 * GEOMETRY
 *
 * A fixed 1100x380 stage. Cards are 176px wide, the gate column is 60px, gaps
 * are 46px throughout, so five spine slots measure 948px and sit on a 76px
 * margin each side. The card row is 92px tall with its centre line at y=150; the
 * gate spans y=55 to y=245, overhanging the row by 95px top and bottom, which is
 * the overhang that makes it read as a barrier rather than a tall step. The
 * lower track sits at y=296, and the retry card is parked directly under the
 * step it returns to so the loop home is a single straight vertical.
 */

/*
  THE STAGE IS AS WIDE AS THE GRAPH, NOT AS WIDE AS THE WIDEST GRAPH.

  It was a flat 1100px, sized for five spine slots. Session 7's gate has THREE
  (a card, the gate, a card), which measure 504px and are drawn from the left
  margin, so the figure sat 260px left of where the room reads the centre.
  `align-check` passed it every time: the `figure` element is `mx-auto` and its
  BOX is perfectly centred, so the drift is entirely inside a box the harness
  reports as correct.

  Derived per render from the walk `slots()` already does, with the left margin
  repeated on the right, so the figure centres itself through `mx-auto` for any
  spine length.
*/

const START = 76
const SLOT = 176
const GATE_W = 60
const GAP = 46

const ROW_TOP = 92
const NODE_H = NODE_MIN_H
const ROW_MID = ROW_TOP + NODE_H / 2 /* 150 */

const GATE_H = 190
const GATE_TOP = ROW_MID - GATE_H / 2 /* 55 */
const GATE_BOTTOM = GATE_TOP + GATE_H /* 245 */

const LOWER_TOP = 258
const LOWER_H = NODE_MIN_H
const LOWER_MID = LOWER_TOP + LOWER_H / 2 /* 296 */

/* Tall enough for the lower track plus the caption under it, and derived from
   them so it cannot go stale when either moves. */
const H = LOWER_TOP + LOWER_H + 48

const PAINT = {
  main: colors.brand,
  alt: colors.accentDark,
  end: colors.success,
}

/**
 * Slot geometry for the spine, left to right.
 *
 * Computed by walking rather than by a constant pitch, because the gate column
 * is a different width from a card and a single `i * PITCH` would silently
 * un-centre everything downstream of it.
 */
function slots(spine: { kind?: string }[]) {
  const out: { x: number; w: number; cx: number }[] = []
  let x = START
  for (const n of spine) {
    const w = n.kind === 'decision' ? GATE_W : SLOT
    out.push({ x, w, cx: x + w / 2 })
    x += w + GAP
  }
  return out
}

export function GateFlow({ nodes, edges, caption, className = '' }: FlowchartFigureProps) {
  const g = resolveGraph({ nodes, edges })
  const pos = slots(g.spine)
  const spineRight = pos.length ? pos[pos.length - 1].x + pos[pos.length - 1].w : START

  const gateIdx = g.spine.findIndex((n) => n.kind === 'decision')
  const gate = gateIdx >= 0 ? g.spine[gateIdx] : undefined
  const gateSlot = gateIdx >= 0 ? pos[gateIdx] : undefined

  const altEdge = g.alt[0]
  const altNode = g.offSpine[0]
  const loopEdge = g.loop[0]
  const loopTargetIdx = loopEdge ? g.spineIndex(loopEdge.to) : -1

  /* The retry card parks under the step it loops back to, so the return is one
     straight vertical and never crosses the row. Falls back to the gate's own
     column when there is no loop to aim at. */
  const retrySlot = loopTargetIdx >= 0 ? pos[loopTargetIdx] : gateSlot
  const retryLeft = retrySlot ? retrySlot.cx - SLOT / 2 : START

  /* The retry card can hang past the last spine slot when it parks under the
     gate, so the extent is the wider of the two. */
  const W = Math.max(spineRight, retryLeft + SLOT) + START

  /*
    WHERE THE EJECTION ARROW ENDS, AND WHY IT IS NOT ALWAYS THE SAME EDGE.

    The exception path used to run down from the gate and then horizontally to
    `retryLeft + SLOT + 6`, the retry card's RIGHT edge. That is correct only for
    the shape this figure was designed around, where the work is ejected and
    travels back LEFTWARD to the step it retries.

    A graph with no loop edge parks the retry card directly under the gate. The
    horizontal run then travelled RIGHTWARD, past the card, and left its
    arrowhead floating in space 6px beyond the card's right edge, pointing at
    nothing. Visible on session 7's `c2-iron-rules`, where the branch is a
    dead-end `Stop` rather than a retry.

    Three cases, one per relative position. Directly below gets no horizontal
    run at all: the arrow drops into the card's top edge, which is also the
    plainest reading of "ejected out of the underside".
  */
  const GAP_TO_CARD = 6
  const dropStraight = !!retrySlot && !!gateSlot && Math.abs(retrySlot.cx - gateSlot.cx) < 1
  const altPath =
    gateSlot && retrySlot
      ? dropStraight
        ? `M ${gateSlot.cx} ${GATE_BOTTOM} V ${LOWER_TOP - GAP_TO_CARD}`
        : retrySlot.cx < gateSlot.cx
          ? `M ${gateSlot.cx} ${GATE_BOTTOM} V ${LOWER_MID} H ${retryLeft + SLOT + GAP_TO_CARD}`
          : `M ${gateSlot.cx} ${GATE_BOTTOM} V ${LOWER_MID} H ${retryLeft - GAP_TO_CARD}`
      : ''

  /* BEATS. The happy path assembles along itself first: node i lands on beat
     2i, the edge leaving it on 2i+1. The exception only starts once the whole
     straight-through story has finished, which is the choreography rule in
     `motion.tsx` taken literally rather than interleaved. */
  const nodeBeat = (i: number) => i * 2
  const edgeBeat = (i: number) => i * 2 + 1
  const EXC = (g.spine.length - 1) * 2 + 1 /* the ejection, straight after the spine's last beat */
  const RETRY = EXC + 1
  const LOOP = EXC + 2
  const CAPTION = LOOP + 2
  const shown = useBeats(CAPTION + 1)

  return (
    <figure className={`relative mx-auto ${className}`} style={{ width: W, height: H }}>
      {/* CONNECTORS. One aria-hidden SVG layer, under the DOM nodes so the main
          path is literally drawn through the gate and occluded by it. Every
          label in this figure is a real element above this layer, per content
          rule 17: a harness reads an <svg> as one rectangle, so overlapping
          <text> would pass every sweep. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0"
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
      >
        <FcArrowDefs id="gate" colors={PAINT} />

        {/* THE ROW. Each main segment lands after the node it leaves. The
            segment arriving AT the gate stops at the bar's face; the segment
            leaving it starts at the bar's near face and runs out the far side,
            so the line is continuous under the gate and the flow reads as
            passing through rather than restarting on the other side. */}
        {g.main
          .map((e) => ({ from: g.spineIndex(e.from), to: g.spineIndex(e.to) }))
          .filter((s) => s.from >= 0 && s.to >= 0)
          .map((s) => {
            const a = pos[s.from]
            const b = pos[s.to]
            const fromGate = g.spine[s.from].kind === 'decision'
            const x1 = fromGate ? a.x : a.x + a.w
            return (
              <FcEdgeDraw
                key={`m${s.from}-${s.to}`}
                d={`M ${x1} ${ROW_MID} H ${b.x - 6}`}
                at={edgeBeat(s.from)} shown={shown[edgeBeat(s.from)]}
                stroke={PAINT.main}
                markerEnd="url(#gate-main)"
              />
            )
          })}

        {/* THE EJECTION. Out of the BOTTOM of the bar, then left along the lower
            track. Leaving downward out of the gate's underside is the whole
            argument in one path: the work did not get through, so it falls out
            of the checkpoint instead of continuing. */}
        {altEdge && altNode && gateSlot && retrySlot && (
          <FcEdgeDraw
            d={altPath}
            at={EXC} shown={shown[EXC]}
            stroke={PAINT.alt}
            markerEnd="url(#gate-alt)"
          />
        )}

        {/* THE LOOP HOME, dashed and last: straight up out of the retry card
            into the step it re-enters. */}
        {loopEdge && loopTargetIdx >= 0 && retrySlot && (
          <FcEdgeDraw
            d={`M ${retrySlot.cx} ${LOWER_TOP} V ${ROW_TOP + NODE_H + 6}`}
            at={LOOP} shown={shown[LOOP]}
            stroke={PAINT.alt}
            dashed
            markerEnd="url(#gate-alt)"
          />
        )}
      </svg>

      {/* THE ROW, gate included. The gate takes the same NodeShell as every
          other node so its padding, hover and detail popover cannot drift; only
          its slot and its body differ. */}
      {g.spine.map((n, i) => {
        const isGate = i === gateIdx
        return (
          <FcNodeIn
            key={n.id}
            at={nodeBeat(i)} shown={shown[nodeBeat(i)]}
            className="absolute"
            style={{
              left: pos[i].x,
              top: isGate ? GATE_TOP : ROW_TOP,
              width: pos[i].w,
              height: isGate ? GATE_H : NODE_H,
            }}
          >
            <NodeShell
              node={n}
              look={lookOf(n)}
              paint={n.kind === 'end' ? PAINT.end : PAINT.main}
              /* The gate's popover opens downward: its top edge is 55px from
                 the stage top and an upward popover would leave the figure. */
              side={isGate ? 'bottom' : 'top'}
            >
              {isGate ? (
                /* The bar's body. 60px wide leaves 28px inside NodeShell's own
                   padding, so this is a mark and a rule, never text. The
                   question is set as a DOM label above the bar instead. */
                <span className="flex h-full w-full flex-col items-center justify-center gap-2">
                  <span
                    className="grid h-6 w-6 place-items-center rounded-md font-heading text-[13px] font-bold"
                    style={{ background: `${PAINT.main}1f`, color: PAINT.main }}
                  >
                    ?
                  </span>
                  <span
                    className="block w-px flex-1 rounded-pill"
                    style={{ background: `${PAINT.main}40` }}
                  />
                </span>
              ) : undefined}
            </NodeShell>
          </FcNodeIn>
        )
      })}

      {/* THE QUESTION, above the bar. Real DOM, sitting in the air the gate's
          overhang opens up between the two cards either side of it. */}
      {gate && gateSlot && (
        <FcNodeIn
          at={nodeBeat(gateIdx)} shown={shown[nodeBeat(gateIdx)]}
          className="absolute text-center"
          style={{ left: gateSlot.cx - 110, top: 10, width: 220 }}
        >
          <span
            className="block font-heading text-[14px] font-bold leading-tight"
            style={{ color: PAINT.main }}
          >
            {gate.label}
          </span>
          <span
            className="mt-0.5 block text-[10.5px] font-bold uppercase tracking-[0.14em]"
            style={{ color: colors.body }}
          >
            Checkpoint
          </span>
        </FcNodeIn>
      )}

      {/* THE RETRY CARD, on the lower track. */}
      {altNode && (
        <FcNodeIn
          at={RETRY} shown={shown[RETRY]}
          className="absolute"
          style={{ left: retryLeft, top: LOWER_TOP, width: SLOT, height: LOWER_H }}
        >
          <NodeShell node={altNode} look="step" paint={PAINT.alt} side="top" />
        </FcNodeIn>
      )}

      {/* EXIT LABELS. Both exits from the gate are named, always. An unlabelled
          exit is the defect this lab exists to fix. */}
      {gateSlot &&
        g.main
          .filter((e) => e.label && e.from === gate?.id)
          .map((e) => (
            <FcEdgeLabel
              key={`y${e.to}`}
              at={edgeBeat(gateIdx)} shown={shown[edgeBeat(gateIdx)]}
              className="absolute rounded-pill px-2 py-0.5 text-[12px] font-bold uppercase tracking-wide"
              /*
                ABOVE THE CARD ROW, NOT ON IT.
                This pill used to sit at `ROW_MID - 34`, which is inside the card
                band (`ROW_TOP` to `ROW_TOP + NODE_H`), and to start 10px past the
                gate in a gap that is only `GAP` = 46px wide. A four-letter label
                is already about 50px with its padding, so the next card printed
                over it and PASS rendered as PAS. It was not a content problem:
                no label short enough to fit exists, which is why shortening the
                nodes in `cicd-lab` did not move it.
                It now clears the row entirely and centres on the gap, so its
                width no longer has to fit between two cards.
              */
              style={{
                left: gateSlot.x + gateSlot.w + GAP / 2,
                top: ROW_TOP - 28,
                transform: 'translateX(-50%)',
                background: `${PAINT.main}1a`,
                color: PAINT.main,
              }}
            >
              {e.label}
            </FcEdgeLabel>
          ))}

      {altEdge?.label && gateSlot && (
        <FcEdgeLabel
          at={EXC} shown={shown[EXC]}
          className="absolute rounded-pill px-2 py-0.5 text-[12px] font-bold uppercase tracking-wide"
          /*
            CLEAR OF THE EXCEPTION CARD, WHICH IS DIRECTLY BELOW THE GATE.
            `GATE_BOTTOM` is 245 and the lower row starts at 258, so there are 13
            vertical pixels here and a pill is 20. Sitting at `cx + 12` put this
            label under the card every time. The card is `SLOT` wide and centred
            on the gate, so the first clear column is half a slot to the right.
          */
          style={{
            left: gateSlot.cx + SLOT / 2 + 14,
            top: GATE_BOTTOM + 6,
            background: `${PAINT.alt}1a`,
            color: PAINT.alt,
          }}
        >
          {altEdge.label}
        </FcEdgeLabel>
      )}

      {loopEdge?.label && retrySlot && (
        <FcEdgeLabel
          at={LOOP} shown={shown[LOOP]}
          className="absolute rounded-pill bg-white px-2 py-0.5 text-[12px] font-semibold"
          style={{
            left: retrySlot.cx + 12,
            top: LOWER_TOP - 40,
            color: PAINT.alt,
            border: `1px solid ${PAINT.alt}44`,
          }}
        >
          {loopEdge.label}
        </FcEdgeLabel>
      )}

      {caption && (
        <FcEdgeLabel
          at={CAPTION} shown={shown[CAPTION]}
          className="absolute text-center text-body-sm"
          /* Derived from the lowest thing in the figure, not hardcoded. `top:
             352` was set when the retry card ended at 338; growing that card to
             the padding floor pushed it to 364 and the card, which carries
             `z-index: 1`, painted straight over the caption. A constant that
             encodes another constant's old value breaks silently the moment that
             one moves. */
          style={{ left: 0, width: W, top: LOWER_TOP + LOWER_H + 16, color: colors.body }}
        >
          {caption}
        </FcEdgeLabel>
      )}
    </figure>
  )
}
