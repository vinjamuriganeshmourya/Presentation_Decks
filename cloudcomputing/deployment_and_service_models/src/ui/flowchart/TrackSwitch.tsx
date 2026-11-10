import { colors } from '@/design/tokens'
import { FcArrowDefs, FcEdgeDraw, FcEdgeLabel, FcNodeIn, useBeats } from './motion'
import { resolveGraph, type FlowchartFigureProps } from './flowchartFigure'
import { NodeShell, lookOf, NODE_MIN_H } from './NodeShell'

/**
 * TRACK SWITCH — the process is a railway, and the loop is the hero.
 *
 * THE ARGUMENT
 *
 * Every other variant in this lab draws the rework path as an arrow pointing
 * backwards, which is a notation, not a picture: the room has to know that a
 * reversed arrowhead means "go back and do it again". This one draws it as a
 * physical detour. The happy path is one continuous rail, dead straight, with
 * the stations sitting ON it. At the decision the track SWITCHES: the reject
 * exit peels away on a curve, drops to a lower return track that runs right to
 * left, and merges back into the rail with a second curve at the step it
 * retries. Nothing reverses. The train leaves the main line, travels a longer
 * way round, and rejoins the same journey at an earlier station.
 *
 * The whole design is one contrast, and it only works if both halves hold: the
 * MAIN LINE IS STRAIGHT and the DETOUR IS CURVED. A right angle on the peel
 * would make the detour look like more track geometry. A kink in the main line
 * would make the straight-through story look like it, too, is a diversion. So
 * the curves are cubics with tangent-locked control points, and the rail is a
 * single horizontal run under the cards, so it reads as one rail crossing the
 * figure rather than four arrows laid end to end.
 *
 * The rail is 3px on a 7px bed of the same hue at ~12% alpha. That bed is what
 * makes it a rail rather than a stroke: a line with a shoulder reads as built
 * infrastructure, and it lets the main line be the heaviest thing on the figure
 * while carrying only one arrowhead, at the terminus. The return track is
 * thinner and dashed, so the detour is legible as the quieter path even in a
 * still frame with no motion to rank them.
 *
 * WHAT IT IS WORST AT
 *
 * **It hard-codes that there is exactly one loop, and that the detour has room
 * to the RIGHT of the gate.** The peel lands in the column after the decision
 * and the return track runs from there back to the retry step, so the geometry
 * needs the loop to point backwards over at least two slots. Feed it a process
 * whose decision is the second-to-last step, or one that loops back only a
 * single station, and the peel curve and the merge curve are computed from x
 * values 60px apart: the two curves fight over the same space and the "No"
 * label lands on top of the merge. A second loop has nowhere to go at all,
 * because there is one lower track and it is already occupied.
 *
 * It is also the widest-reading of the variants for what it says. Six nodes
 * cost the full 1100px and a 380px stage, and the lower track buys exactly one
 * idea, that rework rejoins the line. `StepLedger` says the same thing in half
 * the height. Pick this one when the loop IS the teaching point, not when a
 * process merely happens to have one.
 *
 * GEOMETRY
 *
 * A fixed 1100x380 stage. Five spine slots of 180px on 230px centres, matching
 * `SpineFlow` so the two can be compared without measuring padding. Stations sit
 * at y=48, 92px tall, so the rail runs at y=94 through their middles and is
 * hidden behind the opaque cards, surfacing in the 50px gaps. The return track
 * is at y=286, which is the mid-line of the 84px detour card parked at y=244.
 *
 * The peel: `M 590 140 C 590 206, 628 286, 684 286`. It leaves the gate's
 * bottom edge with a vertical tangent, because the first control point shares
 * the start's x, so it departs the main line at a right angle and there is no
 * doubt it left. It arrives with a horizontal tangent, because the second
 * control point shares the end's y, so it lands ALONG the lower track rather
 * than stabbing into it. 66px of vertical lead-out against 38px of horizontal
 * lead-in gives an asymmetric S that falls away quickly and then settles, which
 * is what a real switch looks like.
 *
 * The merge is the same curve run in the other order: 64px of straight track
 * (`MERGE_RUN`) before the turn, then `C 372 286, 340 262, 340 146` lifting into
 * the retry station's bottom edge. Horizontal tangent leaving, vertical tangent
 * arriving, so the detour rejoins pointing the way the main line runs. The
 * straight run before the curve exists so the "run again" label has flat track
 * to sit on; on a curve it would have to tilt or overlap the stroke.
 *
 * Every stroke ends 6 or 7px short of the card it points at, which is the
 * arrowhead's own length. `FcEdgeDraw` animates `pathLength`, and that is
 * indifferent to whether the path is a line or a cubic, so the peel and the
 * merge draw themselves exactly as the rail does.
 */

const W = 1100
const H = 380

const SLOT = 180
const PITCH = 230
const SPINE_Y = 34
const NODE_H = NODE_MIN_H

/** The lower track: the detour card, and the rail it sits on. */
const ALT_Y = 240
const ALT_H = NODE_MIN_H
const RETURN_Y = ALT_Y + ALT_H / 2

/** Straight track before the merge curve, so the loop label has flat rail. */
const MERGE_RUN = 64

const left = (i: number) => i * PITCH
const cx = (i: number) => i * PITCH + SLOT / 2

const RAIL_Y = SPINE_Y + NODE_H / 2
const RAIL_BOTTOM = SPINE_Y + NODE_H

const PAINT = {
  main: colors.brand,
  alt: colors.accentDark,
  end: colors.success,
}

/* The rail bed. Same hue as the rail, ~12% alpha, drawn under it at more than
   twice the width. Written as an 8-digit hex on the token rather than as a
   literal, so it cannot drift off-palette. */
const BED = `${PAINT.main}1f`

export function TrackSwitch({ nodes, edges, caption, className = '' }: FlowchartFigureProps) {
  const g = resolveGraph({ nodes, edges })
  const last = g.spine.length - 1

  const gateIdx = g.spine.findIndex((n) => n.kind === 'decision')
  const altNode = g.offSpine[0]
  const loopEdge = g.loop[0]
  const loopTargetIdx = loopEdge ? g.spineIndex(loopEdge.to) : -1

  /* The detour parks in the column AFTER the gate, which is the constraint the
     doc comment above is honest about. */
  const altIdx = gateIdx >= 0 ? gateIdx + 1 : 1
  const altLeft = left(altIdx)

  /* Beats. The rail assembles station by station, then the switch, then the
     return track, so the room reads the straight-through story to its end
     before it is shown the way back. */
  const happyEnd = last * 2
  const PEEL_AT = happyEnd + 1
  const ALT_AT = happyEnd + 2
  const RETURN_AT = happyEnd + 3
  const CAPTION = RETURN_AT + 2
  const shown = useBeats(CAPTION + 1)

  const peelX = gateIdx >= 0 ? cx(gateIdx) : 0
  const mergeX = loopTargetIdx >= 0 ? cx(loopTargetIdx) : 0

  return (
    <figure className={`relative mx-auto ${className}`} style={{ width: W, height: H }}>
      {/* CONNECTORS. One aria-hidden SVG layer, no text in it: an <svg> is a
          single rectangle to every harness in this repo, so every label in this
          figure is a real DOM element on top. Content rule 17. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0"
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
      >
        <FcArrowDefs id="track" colors={PAINT} />

        {/* THE MAIN LINE. Segment by segment for the choreography, but drawn
            centre to centre so the segments join UNDER the cards and read as one
            continuous rail surfacing in the gaps. Only the last segment carries
            an arrowhead, at the terminus: a rail with a head on every span is
            four arrows again. */}
        {g.spine.slice(0, -1).map((_n, i) => {
          const isLast = i === last - 1
          const x2 = isLast ? left(i + 1) - 7 : cx(i + 1)
          const d = `M ${cx(i)} ${RAIL_Y} H ${x2}`
          return (
            <g key={`rail${i}`}>
              {/* the bed */}
              <FcEdgeDraw d={d} at={i * 2 + 1} shown={shown[i * 2 + 1]} stroke={BED} width={7} />
              {/* the rail */}
              <FcEdgeDraw
                d={d}
                at={i * 2 + 1} shown={shown[i * 2 + 1]}
                stroke={PAINT.main}
                width={3}
                markerEnd={isLast ? 'url(#track-main)' : undefined}
              />
            </g>
          )
        })}

        {/* THE SWITCH. Vertical tangent out of the gate, horizontal tangent into
            the lower track. This curve is the argument. */}
        {altNode && gateIdx >= 0 && (
          <FcEdgeDraw
            d={`M ${peelX} ${RAIL_BOTTOM} C ${peelX} ${RAIL_BOTTOM + 66}, ${peelX + 38} ${RETURN_Y}, ${altLeft - 6} ${RETURN_Y}`}
            at={PEEL_AT} shown={shown[PEEL_AT]}
            stroke={PAINT.alt}
            width={2}
            markerEnd="url(#track-alt)"
          />
        )}

        {/* THE RETURN TRACK. Right to left, thinner and dashed so it is the
            quieter path in a still frame, then the merge curve lifting into the
            station it retries. */}
        {loopEdge && loopTargetIdx >= 0 && altNode && (
          <FcEdgeDraw
            d={`M ${altLeft} ${RETURN_Y} H ${mergeX + MERGE_RUN} C ${mergeX + 32} ${RETURN_Y}, ${mergeX} ${RETURN_Y - 24}, ${mergeX} ${RAIL_BOTTOM + 6}`}
            at={RETURN_AT} shown={shown[RETURN_AT]}
            stroke={PAINT.alt}
            width={1.5}
            dashed
            markerEnd="url(#track-alt)"
          />
        )}
      </svg>

      {/* THE STATIONS, sitting on the rail. */}
      {g.spine.map((n, i) => (
        <FcNodeIn
          key={n.id}
          at={i * 2} shown={shown[i * 2]}
          className="absolute"
          style={{ left: left(i), top: SPINE_Y, width: SLOT, height: NODE_H }}
        >
          <NodeShell
            node={n}
            look={lookOf(n)}
            paint={n.kind === 'end' ? PAINT.end : PAINT.main}
            side="bottom"
          />
        </FcNodeIn>
      ))}

      {/* THE DETOUR, parked on the lower track. */}
      {altNode && (
        <FcNodeIn
          at={ALT_AT} shown={shown[ALT_AT]}
          className="absolute"
          style={{ left: altLeft, top: ALT_Y, width: SLOT, height: ALT_H }}
        >
          <NodeShell node={altNode} look="step" paint={PAINT.alt} side="top" />
        </FcNodeIn>
      )}

      {/* LABELS. Real elements, absolutely positioned over the SVG. */}
      {g.main
        .filter((e) => e.label && g.spineIndex(e.from) >= 0)
        .map((e) => {
          const i = g.spineIndex(e.from)
          return (
            <FcEdgeLabel
              key={`m${e.from}-${e.to}`}
              at={i * 2 + 1} shown={shown[i * 2 + 1]}
              className="absolute rounded-pill px-2 py-0.5 text-[12px] font-bold uppercase tracking-wide"
              style={{
                left: left(i) + SLOT + 3,
                top: RAIL_Y - 34,
                background: `${PAINT.main}1a`,
                color: PAINT.main,
              }}
            >
              {e.label}
            </FcEdgeLabel>
          )
        })}

      {/* Every exit from the decision carries its condition. An unlabelled one
          is the defect this lab exists to fix. */}
      {gateIdx >= 0 &&
        g.alt
          .filter((e) => e.label)
          .map((e) => (
            <FcEdgeLabel
              key={`a${e.from}-${e.to}`}
              at={PEEL_AT} shown={shown[PEEL_AT]}
              className="absolute rounded-pill px-2 py-0.5 text-[12px] font-bold uppercase tracking-wide"
              style={{
                left: peelX + 12,
                top: RAIL_BOTTOM + 22,
                background: `${PAINT.alt}1a`,
                color: PAINT.alt,
              }}
            >
              {e.label}
            </FcEdgeLabel>
          ))}

      {/* On the flat run of the return track, which is what MERGE_RUN buys. */}
      {loopEdge?.label && loopTargetIdx >= 0 && (
        <FcEdgeLabel
          at={RETURN_AT} shown={shown[RETURN_AT]}
          className="absolute rounded-pill bg-white px-2 py-0.5 text-[12px] font-semibold"
          style={{
            left: mergeX + MERGE_RUN + 18,
            top: RETURN_Y - 12,
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
          style={{ left: 0, width: W, top: 352, color: colors.body }}
        >
          {caption}
        </FcEdgeLabel>
      )}
    </figure>
  )
}
