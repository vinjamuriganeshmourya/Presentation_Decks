import { colors } from '@/design/tokens'
import { FcArrowDefs, FcEdgeDraw, FcEdgeLabel, FcNodeIn, useBeats } from './motion'
import { resolveGraph, type FlowchartFigureProps } from './flowchartFigure'
import { NodeShell, lookOf, NODE_MIN_H } from './NodeShell'

/**
 * CIRCUIT MAP — the notation everyone already knows, drawn properly.
 *
 * THE ARGUMENT
 *
 * Rounded rectangle for a process, stadium for a terminal, diamond for a
 * decision, orthogonal connectors with arrowheads, every exit labelled. This is
 * the notation a learner has met in every textbook, every exam paper and every
 * other course, and matching it means the figure costs them nothing to read.
 *
 * The other variants in this lab are all arguments for departing from it. This
 * one is the control: if a departure is not clearly better than this, it is not
 * worth the room having to learn a second dialect.
 *
 * THE DIAMOND IS REAL HERE, AND THAT IS THE TRADE
 *
 * `SpineFlow` argues that rotating a square makes its own text unreadable. This
 * variant takes the opposite position and pays the cost honestly: the diamond is
 * a rotated square with the label set STRAIGHT inside it via a counter-rotation,
 * which keeps the text level but leaves only the middle third of the shape
 * usable. So the question has to be short. "All checks pass?" fits; "Have all
 * automated checks completed successfully?" does not, and no amount of styling
 * will make it.
 *
 * That is the real finding to weigh when picking a winner: the classic notation
 * constrains the copy, and the copy is the teaching.
 *
 * ORTHOGONAL CONNECTORS
 *
 * Right angles only, never diagonals, because established practice is to
 * minimise crossings and a diagonal in a grid layout crosses everything. The
 * routing is deliberately simple: leave the source on one axis, turn once, enter
 * the target on the other.
 */

const W = 1100
const H = 392

/*
  A UNIFORM GRID, AND THE FIRST VERSION DID NOT HAVE ONE.

  That version tried to be clever: it packed the columns, then shifted the nodes
  after the diamond by a computed extra offset so the diamond could be narrower
  than a box. The result on screen was the diamond drawn straight through the
  reviewer card, the "Yes" label buried underneath it, and the end terminal
  hanging 100px off the right edge of the slide.

  There is no cleverness worth that. Every spine node takes one slot of the same
  pitch, the diamond is CENTRED in its slot rather than sizing it, and the
  arithmetic is `i * PITCH`. Five slots at 222 with 180-wide boxes ends at
  x=1068, inside the 1100 stage, with 42px gaps that give every arrowhead room.
*/
const BOX_W = 180
/* NodeShell's floor. Was 76, which made the two-line label overflow the card
   by 7px at top and bottom. */
const BOX_H = NODE_MIN_H
const PITCH = 222
const DIA = 140

const ROW_Y = 34
const ALT_Y = 238

const slotX = (i: number) => i * PITCH

const PAINT = {
  main: colors.brand,
  alt: colors.accentDark,
  end: colors.success,
}

export function CircuitMap({ nodes, edges, caption, className = '' }: FlowchartFigureProps) {
  const g = resolveGraph({ nodes, edges })

  const gateIdx = g.spine.findIndex((n) => n.kind === 'decision')
  const altNode = g.offSpine[0]
  const loopEdge = g.loop[0]

  /* One slot per spine node, same pitch throughout. The diamond is centred in
     its slot, not given one of its own. */
  const place: Record<string, { x: number; y: number; w: number; h: number }> = {}
  g.spine.forEach((n, i) => {
    place[n.id] =
      i === gateIdx
        ? { x: slotX(i) + (BOX_W - DIA) / 2, y: ROW_Y + BOX_H / 2 - DIA / 2, w: DIA, h: DIA }
        : { x: slotX(i), y: ROW_Y, w: BOX_W, h: BOX_H }
  })
  if (altNode) place[altNode.id] = { x: slotX(gateIdx), y: ALT_Y, w: BOX_W, h: BOX_H }

  const box = (id: string) => place[id] ?? { x: 0, y: 0, w: BOX_W, h: BOX_H }
  const rightOf = (id: string) => { const b = box(id); return { x: b.x + b.w, y: b.y + b.h / 2 } }
  const leftOf = (id: string) => { const b = box(id); return { x: b.x, y: b.y + b.h / 2 } }
  const below = (id: string) => { const b = box(id); return { x: b.x + b.w / 2, y: b.y + b.h } }
  const above = (id: string) => { const b = box(id); return { x: b.x + b.w / 2, y: b.y } }

  const loopFrom = loopEdge ? leftOf(loopEdge.from) : null
  const loopTo = loopEdge ? below(loopEdge.to) : null

  /* The exception hangs off the END of the spine, with one empty beat between,
     so the two branches never leave the fork together. See SpineFlow. */
  const SPINE_END = (g.spine.length - 1) * 2
  const ALT_EDGE = SPINE_END + 1
  const ALT_NODE = SPINE_END + 2
  const LOOP = SPINE_END + 3
  const CAPTION = SPINE_END + 4
  const shown = useBeats(CAPTION + 1)

  return (
    <figure className={`relative mx-auto ${className}`} style={{ width: W, height: H }}>
      <svg aria-hidden className="pointer-events-none absolute inset-0" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <FcArrowDefs id="circuit" colors={PAINT} />
        {g.main.map((e, i) => {
          const a = rightOf(e.from)
          const b = leftOf(e.to)
          return (
            <FcEdgeDraw
              key={`m${i}`}
              d={`M ${a.x} ${a.y} H ${b.x - 7}`}
              at={i * 2 + 1} shown={shown[i * 2 + 1]}
              stroke={PAINT.main}
              markerEnd="url(#circuit-main)"
            />
          )
        })}
        {g.alt.map((e, i) => {
          const a = below(e.from)
          const b = above(e.to)
          return (
            <FcEdgeDraw
              key={`a${i}`}
              d={`M ${a.x} ${a.y} V ${b.y - 7}`}
              at={ALT_EDGE} shown={shown[ALT_EDGE]}
              stroke={PAINT.alt}
              markerEnd="url(#circuit-alt)"
            />
          )
        })}
        {loopEdge && loopFrom && loopTo && (
          <FcEdgeDraw
            d={`M ${loopFrom.x} ${loopFrom.y} H ${loopTo.x} V ${loopTo.y + 7}`}
            at={LOOP} shown={shown[LOOP]}
            stroke={PAINT.alt}
            dashed
            markerEnd="url(#circuit-alt)"
          />
        )}
      </svg>

      {nodes.map((n) => {
        const b = box(n.id)
        const i = g.spineIndex(n.id)
        const at = i >= 0 ? i * 2 : ALT_NODE
        const terminal = n.kind === 'start' || n.kind === 'end'
        const decision = n.kind === 'decision'
        return (
          <FcNodeIn key={n.id} at={at} shown={shown[at]} className="absolute" style={{ left: b.x, top: b.y, width: b.w, height: b.h }}>
            {/* The classic notation's three silhouettes, all through the shared
                shell so hover, padding and the detail popover are identical to
                every other variant. Only the outline differs, which is the whole
                point of this candidate. */}
            <NodeShell
              node={n}
              look={lookOf(n)}
              paint={n.kind === 'end' ? PAINT.end : PAINT.main}
              shape={decision ? 'diamond' : terminal ? 'pill' : 'card'}
              side={decision || n.id === altNode?.id ? 'bottom' : 'top'}
            />
          </FcNodeIn>
        )
      })}

      {/* EXIT LABELS. Each one is positioned from ITS OWN edge, not from the
          decision's index. The first version derived every label's beat and
          position from `gateIdx`, so the "Yes" ended up under the node the edge
          pointed at and "run again" landed in the bottom-right corner nowhere
          near its line. */}
      {g.main.filter((e) => e.label).map((e) => {
        const a = rightOf(e.from)
        const b = leftOf(e.to)
        return (
          <FcEdgeLabel
            key={`m${e.from}-${e.to}`}
            at={g.spineIndex(e.from) * 2 + 1} shown={shown[g.spineIndex(e.from) * 2 + 1]}
            className="absolute -translate-x-1/2 rounded-pill bg-white px-2 py-0.5 text-[12px] font-bold uppercase tracking-wide"
            /* Above the ROW, not above the LINE. The gap between two slots is
               42px and "Yes" is wider than that, so a label centred on the edge
               and lifted 30px still sat across the top edge of the node it was
               pointing at. Clearing the row entirely is the only position that
               works at every gap width. */
            style={{ left: (a.x + b.x) / 2, top: ROW_Y - 30, color: PAINT.main, border: `1px solid ${PAINT.main}44` }}
          >
            {e.label}
          </FcEdgeLabel>
        )
      })}

      {g.alt.filter((e) => e.label).map((e) => {
        const a = below(e.from)
        return (
          <FcEdgeLabel
            key={`a${e.from}-${e.to}`}
            at={ALT_EDGE} shown={shown[ALT_EDGE]}
            className="absolute rounded-pill bg-white px-2 py-0.5 text-[12px] font-bold uppercase tracking-wide"
            style={{ left: a.x + 12, top: (a.y + above(e.to).y) / 2 - 11, color: PAINT.alt, border: `1px solid ${PAINT.alt}44` }}
          >
            {e.label}
          </FcEdgeLabel>
        )
      })}

      {loopEdge?.label && loopFrom && loopTo && (
        <FcEdgeLabel
          at={LOOP} shown={shown[LOOP]}
          className="absolute -translate-x-1/2 rounded-pill bg-white px-2 py-0.5 text-[12px] font-semibold"
          /* Centred on the run rather than on the midpoint of the two endpoints:
             the midpoint sits a few px from the card the line leaves, so the pill
             touched it. */
          style={{ left: (loopFrom.x + loopTo.x) / 2 - 24, top: loopFrom.y - 12, color: PAINT.alt, border: `1px solid ${PAINT.alt}44` }}
        >
          {loopEdge.label}
        </FcEdgeLabel>
      )}

      {caption && (
        <FcEdgeLabel
          at={CAPTION} shown={shown[CAPTION]}
          className="absolute text-center text-body-sm"
          style={{ left: 0, width: W, top: H - 22, color: colors.body }}
        >
          {caption}
        </FcEdgeLabel>
      )}
    </figure>
  )
}
