import { colors } from '@/design/tokens'
import { FcArrowDefs, FcEdgeDraw, FcEdgeLabel, FcNodeIn, useBeats } from './motion'
import { resolveGraph, type FlowchartFigureProps } from './flowchartFigure'
import { NodeShell, lookOf } from './NodeShell'

/**
 * LANE FLOW — the swimlane. The vertical axis is WHO, not when.
 *
 * THE ARGUMENT
 *
 * Every other variant in this lab answers "what happens next". This one answers
 * "and whose job is that", which is a different question and often the more
 * useful one. A step's row is its owner, so handoffs become visible as vertical
 * moves: the figure shows that the work crosses from the learner to a machine to
 * a human three times, and that every crossing is a place it can stall.
 *
 * Established practice for cross-functional processes, and the reason the lane
 * names in the fixture are roles rather than departments: "Reviewer" over
 * "Review", "Grading service" over "System". A lane labelled with a noun tells
 * you nothing about who to chase.
 *
 * WHEN IT IS THE WRONG CHOICE
 *
 * When every step has the same owner. Three lanes with all six nodes in the
 * middle one is a spine flow that has thrown away a third of its height. The
 * contract makes `lane` optional for exactly that reason, and this variant is
 * the only one that reads it.
 *
 * GEOMETRY
 *
 * Lanes are discovered from the nodes in first-appearance order, so the caller
 * controls the vertical order by writing the fixture in process order. Columns
 * are the spine position, which keeps time on the horizontal axis: mixing "later"
 * and "someone else" on one axis is what makes a bad swimlane unreadable.
 */

const W = 1100
const LANE_H = 118
const HEAD_W = 132
/* Narrower cards, same pitch, so the gap that has to hold an arrowhead grows
   from 14px to 22px. Measured horizontal padding stays at 12px or better. */
const COL_W = 168
const COL_GAP = 22
/* Row layout stacks a two-line label over a two-line caption beside the icon,
   which measured 73px of content in a 74px box: zero real padding on four of
   the six cards. */
const NODE_H = 94

const colLeft = (i: number) => HEAD_W + 16 + i * (COL_W + COL_GAP)
const colMid = (i: number) => colLeft(i) + COL_W / 2

const PAINT = {
  main: colors.brand,
  alt: colors.accentDark,
  end: colors.success,
}

export function LaneFlow({ nodes, edges, caption, className = '' }: FlowchartFigureProps) {
  const g = resolveGraph({ nodes, edges })

  /* Lanes in first-appearance order. The caller writes the fixture in process
     order, so the lanes come out in the order the work actually moves. */
  const lanes: string[] = []
  for (const n of nodes) {
    const lane = n.lane ?? 'Unassigned'
    if (!lanes.includes(lane)) lanes.push(lane)
  }
  const laneY = (lane?: string) => lanes.indexOf(lane ?? 'Unassigned') * LANE_H + (LANE_H - NODE_H) / 2

  /* Column = position along the process. The exception shares its predecessor's
     column plus one, so the loop has somewhere to go without doubling back
     through a node. */
  const col: Record<string, number> = {}
  g.spine.forEach((n, i) => (col[n.id] = i))
  g.offSpine.forEach((n) => {
    const src = g.alt.find((e) => e.to === n.id)
    col[n.id] = src ? (col[src.from] ?? 0) + 1 : g.spine.length
  })


  /* Lanes first, then the spine, then the exception after the spine finishes
     with one empty beat between. See SpineFlow for why the two branches must not
     leave the fork together. */
  const base = lanes.length
  const SPINE_END = base + (g.spine.length - 1) * 2
  const ALT_EDGE = SPINE_END + 1
  const ALT_NODE = SPINE_END + 2
  const LOOP = SPINE_END + 3
  const CAPTION = SPINE_END + 4
  const beatOf = (id: string) =>
    g.spineIndex(id) >= 0 ? base + g.spineIndex(id) * 2 : ALT_NODE
  const shown = useBeats(CAPTION + 1)
  const H = lanes.length * LANE_H + 44
  const mid = (id: string) => ({ x: colMid(col[id]), y: laneY(g.byId[id]?.lane) + NODE_H / 2 })

  /*
    ROUTING, THIRD ATTEMPT, AND THE FIRST TWO FAILED IN DIFFERENT WAYS.

    Attempt one went `H midX V enterY` and simply STOPPED there, a column short
    of the target: every arrowhead floated in open space.

    Attempt two added the final leg but kept turning horizontally FIRST. The
    columns are only 14px apart, so the turning column landed PAST the entry
    point and the last leg ran backwards. On screen that is an arrowhead pointing
    left, out of the node it was supposed to be entering.

    So a lane change exits VERTICALLY. Down (or up) out of the source's own
    column, across the intervening space at the target's row, then straight into
    the target's left edge. The vertical leg is the handoff, which is exactly the
    thing this variant exists to show, and it needs no gap between columns at all.

    A same-lane edge is a plain horizontal run, because there is no handoff.
  */
  const ENTER = 7
  const route = (from: string, to: string) => {
    const a = mid(from)
    const b = mid(to)
    const into = colLeft(col[to] ?? 0) - ENTER
    if (Math.abs(a.y - b.y) < 2) return `M ${a.x + COL_W / 2} ${a.y} H ${into}`
    const exitY = a.y + (b.y > a.y ? NODE_H / 2 : -NODE_H / 2)
    return `M ${a.x} ${exitY} V ${b.y} H ${into}`
  }

  /* A label belongs on the leg that has room, which after a lane change is the
     horizontal run at the TARGET's row, not the source's. */
  const labelAt = (from: string, to: string) => {
    const a = mid(from)
    const b = mid(to)
    const into = colLeft(col[to] ?? 0) - ENTER
    const sameLane = Math.abs(a.y - b.y) < 2
    return { x: sameLane ? (a.x + COL_W / 2 + into) / 2 : (a.x + into) / 2, y: b.y - 28 }
  }

  return (
    <figure className={`relative mx-auto ${className}`} style={{ width: W, height: H }}>
      {/* LANE BANDS. Alternating tint rather than ruled lines: a hairline grid at
          this size competes with the connectors, which are also hairlines. */}
      {lanes.map((lane, i) => (
        <FcNodeIn
          key={lane}
          at={i} shown={shown[i]}
          className="absolute rounded-xl2"
          style={{
            left: 0,
            top: i * LANE_H,
            width: W,
            height: LANE_H,
            background: i % 2 === 0 ? colors.surface : 'transparent',
            /*
              THE BANDS MUST PAINT UNDER THE CONNECTORS.

              They are `FcNodeIn`s, so they carry `.fc-node-slot`, which sets
              `z-index: 1` for the hover-popover fix. That put a tinted opaque
              band ON TOP of the connector SVG, and every line crossing a tinted
              lane was simply erased: the figure looked like it had truncated
              stubs where its edges should be.

              An inline value beats the class rule, so the band drops back to 0
              and the natural order is restored: bands, then connectors, then
              nodes.
            */
            zIndex: 0,
          }}
        >
          <span
            className="absolute left-4 top-1/2 -translate-y-1/2 font-heading text-[13px] font-bold uppercase tracking-wide"
            style={{ color: colors.muted, width: HEAD_W - 24 }}
          >
            {lane}
          </span>
        </FcNodeIn>
      ))}

      <svg aria-hidden className="pointer-events-none absolute inset-0 z-[1]" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <FcArrowDefs id="lane" colors={PAINT} />
        {g.main.map((e, i) => (
          <FcEdgeDraw
            key={`m${i}`}
            d={route(e.from, e.to)}
            at={beatOf(e.from) + 1} shown={shown[beatOf(e.from) + 1]}
            stroke={PAINT.main}
            markerEnd="url(#lane-main)"
          />
        ))}
        {g.alt.map((e, i) => (
          <FcEdgeDraw
            key={`a${i}`}
            d={route(e.from, e.to)}
            at={ALT_EDGE} shown={shown[ALT_EDGE]}
            stroke={PAINT.alt}
            markerEnd="url(#lane-alt)"
          />
        ))}
        {/* The loop runs back UNDER every lane rather than through them, so a
            return path can never be mistaken for a handoff. */}
        {g.loop.map((e, i) => {
          const a = mid(e.from)
          const b = mid(e.to)
          const floor = lanes.length * LANE_H + 14
          return (
            <FcEdgeDraw
              key={`l${i}`}
              d={`M ${a.x} ${a.y + NODE_H / 2} V ${floor} H ${b.x} V ${b.y + NODE_H / 2 + ENTER}`}
              at={LOOP} shown={shown[LOOP]}
              stroke={PAINT.alt}
              dashed
              markerEnd="url(#lane-alt)"
            />
          )
        })}
      </svg>

      {nodes.map((n) => {
        const laneIdx = lanes.indexOf(n.lane ?? 'Unassigned')
        return (
          <FcNodeIn
            key={n.id}
            at={beatOf(n.id)} shown={shown[beatOf(n.id)]}
            className="absolute"
            style={{ left: colLeft(col[n.id] ?? 0), top: laneY(n.lane), width: COL_W, height: NODE_H }}
          >
            <NodeShell
              node={n}
              look={lookOf(n)}
              paint={n.kind === 'end' ? PAINT.end : PAINT.main}
              layout="row"
              /* The popover opens away from the lane it would otherwise cover:
                 downward in the top lane, upward everywhere else. */
              side={laneIdx === 0 ? 'bottom' : 'top'}
            />
          </FcNodeIn>
        )
      })}

      {[...g.main, ...g.alt].filter((e) => e.label).map((e) => {
        const at = labelAt(e.from, e.to)
        const isAlt = g.alt.includes(e)
        const paint = isAlt ? PAINT.alt : PAINT.main
        return (
          <FcEdgeLabel
            key={`lab${e.from}-${e.to}`}
            at={isAlt ? ALT_EDGE : beatOf(e.from) + 1} shown={shown[isAlt ? ALT_EDGE : beatOf(e.from) + 1]}
            className="absolute z-[2] -translate-x-1/2 rounded-pill px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
            style={{ left: at.x, top: at.y, background: `${paint}1a`, color: paint }}
          >
            {e.label}
          </FcEdgeLabel>
        )
      })}

      {caption && (
        <FcEdgeLabel
          at={CAPTION} shown={shown[CAPTION]}
          className="absolute text-center text-body-sm"
          style={{ left: 0, width: W, top: H - 16, color: colors.body }}
        >
          {caption}
        </FcEdgeLabel>
      )}
    </figure>
  )
}
