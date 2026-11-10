import type { ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { StepControls, useBeats, useTween } from './beats'

/**
 * TAKEAWAYS AS A TREE — one idea at the top, the ideas it leads to below it.
 *
 * From PF 14 "For Loop" ("What we did today"). One node per beat, in reading
 * order, each arriving with the lines from its parents, so the room sees WHY a
 * takeaway follows as well as what it says. The nodes are DOM (content rule 17:
 * a figure made of labels is never SVG text); only the connecting lines are SVG.
 *
 * Layout is fixed for the shape PF 14 needs, one root, two pairs, then a chain:
 *
 *            [ 1 ]
 *        [ 2 ]   [ 3 ]
 *        [ 4 ]   [ 5 ]
 *           [ 6 ]
 *           [ 7 ]
 */
export interface TakeawayNode {
  chip: ReactNode
  text: ReactNode
  tone?: string
}

const W = 1150
const H = 400
/* x, y, width of each node, in the 1150-wide body box (Space-1 plus Space-2) */
const SLOT = [
  { x: 275, y: 0, w: 600 },
  { x: 60, y: 92, w: 480 },
  { x: 612, y: 92, w: 480 },
  { x: 60, y: 176, w: 480 },
  { x: 612, y: 176, w: 480 },
  { x: 216, y: 264, w: 720 },
  { x: 216, y: 348, w: 720 },
] as const
const NODE_H = 52
/* parent slot -> child slot */
const EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 4],
  [3, 5],
  [4, 5],
  [5, 6],
]

export function TakeawayTree({ nodes }: { nodes: TakeawayNode[] }) {
  const at = useBeats(nodes.length)
  const tween = useTween(400)
  const cx = (i: number) => SLOT[i].x + SLOT[i].w / 2
  return (
    <>
      <div className="relative" style={{ width: W, height: H }}>
        <svg className="absolute inset-0" width={W} height={H} aria-hidden>
          {EDGES.map(([p, c], k) => {
            const on = c < at
            const x1 = cx(p)
            const y1 = SLOT[p].y + NODE_H
            const x2 = cx(c)
            const y2 = SLOT[c].y
            const my = (y1 + y2) / 2
            return (
              <path
                key={k}
                d={`M${x1} ${y1} C${x1} ${my} ${x2} ${my} ${x2} ${y2}`}
                fill="none"
                stroke={colors.brand}
                strokeWidth={2.5}
                style={{ transition: tween, opacity: on ? 0.8 : 0 }}
              />
            )
          })}
        </svg>
        {nodes.slice(0, SLOT.length).map((nd, i) => {
          const on = i < at
          const root = i === 0
          const tone = nd.tone ?? colors.brandDark
          return (
            <div
              key={i}
              className="absolute flex items-center gap-3 rounded-card bg-white px-3"
              style={{
                left: SLOT[i].x,
                top: SLOT[i].y,
                width: SLOT[i].w,
                height: NODE_H,
                transition: tween,
                opacity: on ? 1 : 0,
                transform: on ? 'none' : 'translateY(11px)',
                background: root ? colors.surface2 : colors.white,
                boxShadow: `inset 0 0 0 ${root ? 3 : 2}px ${root ? colors.brandDark : colors.line}`,
              }}
            >
              <span className="shrink-0 rounded-lg px-2.5 py-1 font-mono text-[16px] font-bold text-white" style={{ background: tone }}>
                {nd.chip}
              </span>
              <span className={`truncate ${root ? 'font-heading text-[21px] font-bold' : 'text-[19px] font-semibold'}`} style={{ color: root ? colors.brandDark : colors.body }}>
                {nd.text}
              </span>
            </div>
          )
        })}
      </div>
      <StepControls at={at} total={nodes.length} />
    </>
  )
}
