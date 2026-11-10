import type { CSSProperties, ReactNode } from 'react'
import { BrickWall, Building2, DoorOpen, MapPin, Network, Route, Server, Trees, Users, Waypoints, X } from 'lucide-react'
import { SPEED, useAutoAnim } from '@/deck/autoAnim'
import { useInstant } from '@/motion/instant'
import { colors } from '@/design/tokens'
import { At, REDUCED, STILL, useCycle } from '../scene'
import { LAB } from '../clay-b'
import { AN_W, IsoAnalogy } from '../iso/frames'
import { Box, ISO, IsoAt, IsoScene, IsoSvg, P, Quad, Shadow, pts, shade, useIso } from '../iso/iso'
import { House } from '../iso/objects'
import { Resource } from './frames'
import { CvIcon, Ripple, fx } from './fx'

/**
 * T03-AN · A GATED SOCIETY INSIDE ONE CAMPUS (visual pass, 2026-11-04).
 *
 * Rebuilt in Session 4's analogy design (FlatsAnalogy): `IsoAnalogy bare`, the
 * familiar scene drawn in the isometric engine as a real place, the concept
 * scene beside it, every clause of the TR's sentence a tag INSIDE the picture
 * it names, and ONE clock (`useCycle`) walking the matched pairs, one pair per
 * press with auto animation off:
 *
 *   0  campus (violet)     one bigger campus            Provider's Shared Network
 *   1  association (blue)  gated residential society,   VPC
 *                          resident association
 *   2  gate (amber)        own gate                     Addressed
 *   3  roads (teal)        internal roads               routed
 *   4  wall (red)          boundary wall                Walled-Off Section
 *   5  the whole picture at rest (harness URLs hold this frame)
 *
 * Each pair has its own colour on both sides (G4); the lit pair is the only one
 * in colour, the rest fade. The motion is the analogy's own claim:
 *   campus  the campus fence's dashes march round it; packets ride the shared backbone
 *   assoc   the society's ground glows; the customer's VPC is ringed
 *   gate    a car drives up the campus road, the barrier lifts, the car drives
 *           in; an addressed packet climbs to the VPC's address and goes in
 *   roads   traffic runs along the internal roads; packets run the routed line
 *   wall    a stranger walks into the boundary wall and is turned away; a packet
 *           from the next VPC hits the walled-off section's rim and is refused
 * Every loop is a CSS loop on an element that only exists while its pair is
 * lit, so it starts in step with its partner on the other side.
 */

const EASE = 'cubic-bezier(0.22,1,0.36,1)'
const AN_SH = 400
const DUR = 3.2
/* the CSS loops run at the clock's own pace (auto animation plays every timing at SPEED) */
const LOOP = `${(DUR * SPEED).toFixed(2)}s`

/* the pairs and their colours (template tokens and the Lab palette) */
const PAIR = [LAB.periwinkle, colors.brand, colors.warning, colors.teal, colors.danger] as const
const CAMPUS_P = 0
const ASSOC_P = 1
const GATE_P = 2
const ROADS_P = 3
const WALL_P = 4

const FADE = 0.3
const BASE_FADE = 0.45
const fadeT = `opacity 460ms ${EASE}`
/** 1 for the pair in focus (or everything when none is), faded otherwise. */
const opFor = (focus: number, pair: number) => (focus < 0 || focus === pair ? 1 : FADE)
const baseOp = (focus: number) => (focus < 0 ? 1 : BASE_FADE)

/**
 * A tag in the TR's words, in its pair's colour: filled while its pair is lit, faded while another is.
 * The fade sits on a bare wrapper, never on the chip: with auto animation off the entrance layer holds
 * every drawn box at the opacity it had when the slide mounted, so a fade on the chip itself would freeze.
 */
function PairTag({ children, pair, focus, icon, size = 14 }: { children: ReactNode; pair: number; focus: number; icon: ReactNode; size?: number }) {
  const c = PAIR[pair]
  const on = !STILL && focus === pair
  return (
    <span className="inline-block" style={{ opacity: opFor(focus, pair), transform: on ? 'scale(1.06)' : 'none', transition: `opacity 420ms ${EASE}, transform 420ms ${EASE}` }}>
      <span
        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill py-[3px] pl-1 pr-2.5 font-heading font-semibold leading-tight"
        style={{
          fontSize: size,
          background: on ? c : 'linear-gradient(180deg, #FFFFFF 0%, #F3F6FD 100%)',
          color: on ? colors.white : colors.ink,
          boxShadow: `inset 0 0 0 1.8px ${c}, 0 8px 16px -10px rgba(16,32,58,0.4)`,
          transition: `background 420ms ${EASE}, color 420ms ${EASE}`,
        }}
      >
        <span aria-hidden className="grid h-[20px] w-[20px] shrink-0 place-items-center rounded-full [&>svg]:h-[12px] [&>svg]:w-[12px]" style={{ background: on ? 'rgba(255,255,255,0.25)' : `${c}22`, color: on ? colors.white : c, transition: `all 420ms ${EASE}` }}>
          {icon}
        </span>
        {children}
      </span>
    </span>
  )
}

/* ================================================================== THE CAMPUS (familiar side) */

/*
  THE CAMPUS, drawn in the isometric engine at one scale: grass inside a dashed
  campus fence; the campus road along the front; on the left the gated
  residential society, our resident association's plot: a stone boundary wall
  round it, its own gate in the front wall facing the road (two posts with
  lamps, a red and white barrier, a guard's booth and the guard), internal
  roads in a cross from the gate, three houses and a garden tree; on the right
  another resident association, walled, with its own gate on the same road;
  trees behind. Every word is an HTML tag over the svg.
*/
const U = 29
const OX = 208
const OY = 100
const CAMPUS = { x: 0, y: 0, w: 8.4, d: 6.6 } as const
const PLOT = { x: 0.3, y: 0.4, w: 4.7, d: 4.8 } as const
const PX2 = PLOT.x + PLOT.w // its right wall
const PY2 = PLOT.y + PLOT.d // its front wall, where the gate is
const GATE = { x1: 2.2, x2: 3.2 } as const
const GATE_C = (GATE.x1 + GATE.x2) / 2
const STEM = { x: 2.4, w: 0.6, y: 0.9 } as const // the internal road from the gate, back along y
const CROSS = { x: 0.6, w: 4.2, y: 2.6, d: 0.6 } as const // the internal road across it, along x
const HW = 1.4
const HD = 1.15
const HOUSE_BACK: [number, number] = [0.75, 0.9]
const HOUSES_FRONT: [number, number][] = [[0.75, 3.55], [3.25, 3.55]]
const ROAD = { y: 5.7, d: 0.75 } as const // the campus road along the front
const BOOTH = { x: 1.42, y: 5.26, w: 0.42, d: 0.4, h: 0.74 } as const
/* the other resident association, its gate on the same road */
const OTHER = { x: 5.5, y: 1.9, w: 2.6, d: 3.3, gate: [6.45, 7.3] as const }
const OTHER_HOUSES: [number, number][] = [[5.75, 2.2], [7.0, 2.2]]
const WALL_H = 0.5
const HUMAN_H = 50 // a person's height in px at this scale
const WALL_T = 0.14
const STONE = '#E4D8C2'
const PILLAR = '#B9A88C'

/** A tree: trunk and a round crown, standing on its shadow. */
function Tree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const { u } = useIso()
  const [bx, by] = P(x, y, 0, u)
  const [tx, ty] = P(x, y, 0.5 * s, u)
  return (
    <g>
      <ellipse cx={bx} cy={by} rx={u * 0.32 * s} ry={u * 0.15 * s} fill={ISO.slate} opacity={0.16} />
      <line x1={bx} y1={by} x2={tx} y2={ty} stroke="#8B6B4A" strokeWidth={3 * s} strokeLinecap="round" />
      <circle cx={tx} cy={ty - u * 0.22 * s} r={u * 0.36 * s} fill="#5FAF6B" stroke="#3E8A4C" strokeWidth={0.8} />
      <circle cx={tx - u * 0.1 * s} cy={ty - u * 0.34 * s} r={u * 0.15 * s} fill="#8ACF92" opacity={0.85} />
    </g>
  )
}

/** One wall run, the wall pair's red while it is lit. */
function Wall({ x, y, w, d, lit, h = WALL_H }: { x: number; y: number; w: number; d: number; lit?: boolean; h?: number }) {
  return <Box x={x} y={y} w={w} d={d} h={h} color={lit ? shade(colors.danger, 0.35) : STONE} />
}

/** A gate post with its lamp. */
function Pillar({ x, y, lit = false, h = 0.85 }: { x: number; y: number; lit?: boolean; h?: number }) {
  const { u } = useIso()
  const [lx, ly] = P(x + 0.11, y + 0.11, h + 0.13, u)
  return (
    <g>
      <Box x={x} y={y} w={0.22} d={0.22} h={h} color={lit ? shade(colors.warning, 0.1) : PILLAR} />
      <circle cx={lx} cy={ly} r={3.4} fill={lit ? '#FFF3C4' : '#F7F1E3'} stroke={shade(PILLAR, -0.4)} strokeWidth={0.8} />
    </g>
  )
}

/**
 * A car at grid (x, y), long along x (the road): four wheels with hubs, a lower body, a cabin with
 * its windows, a roof, tail lights on its back face and a head lamp on its side.
 */
function Car({ x, y, color }: { x: number; y: number; color: string }) {
  const { u } = useIso()
  const L = 0.96
  const D = 0.5
  const x0 = x - L / 2
  const y0 = y - D / 2
  const wheel = (gx: number, gy: number) => {
    const [a, b] = P(gx, gy, 0.1, u)
    return (
      <g>
        <ellipse cx={a} cy={b} rx={4.6} ry={3.6} fill="#1F2633" />
        <ellipse cx={a} cy={b} rx={2} ry={1.6} fill="#C9D2DF" />
      </g>
    )
  }
  const dark = shade(color, -0.35)
  return (
    <g>
      <Shadow x={x0} y={y0} w={L} d={D} grow={0.06} opacity={0.22} />
      {wheel(x0 + 0.2, y0 + 0.02)}
      {wheel(x0 + L - 0.2, y0 + 0.02)}
      {/* the lower body: a lamp on the side, tail lights on the back face */}
      <Box
        x={x0}
        y={y0}
        z={0.09}
        w={L}
        d={D}
        h={0.22}
        color={color}
        onLeft={<g><rect x={L * u * 0.04} y={0.22 * u * 0.25} width={L * u * 0.1} height={0.22 * u * 0.3} rx={1} fill="#FFF3C4" /><rect x={L * u * 0.1} y={0.22 * u * 0.62} width={L * u * 0.8} height={1.2} fill={dark} opacity={0.6} /></g>}
        onRight={<g><rect x={D * u * 0.08} y={0.22 * u * 0.22} width={D * u * 0.18} height={0.22 * u * 0.32} rx={1} fill={ISO.red} /><rect x={D * u * 0.74} y={0.22 * u * 0.22} width={D * u * 0.18} height={0.22 * u * 0.32} rx={1} fill={ISO.red} /></g>}
      />
      {/* the cabin: windows on both faces, a roof */}
      <Box
        x={x0 + 0.24}
        y={y0 + 0.05}
        z={0.31}
        w={0.5}
        d={D - 0.1}
        h={0.2}
        color={color}
        onLeft={<g><rect x={0.5 * u * 0.08} y={0.2 * u * 0.14} width={0.5 * u * 0.38} height={0.2 * u * 0.7} rx={1} fill={ISO.glass} stroke={dark} strokeWidth={0.5} /><rect x={0.5 * u * 0.54} y={0.2 * u * 0.14} width={0.5 * u * 0.38} height={0.2 * u * 0.7} rx={1} fill={ISO.glass} stroke={dark} strokeWidth={0.5} /></g>}
        onRight={<rect x={(D - 0.1) * u * 0.12} y={0.2 * u * 0.14} width={(D - 0.1) * u * 0.76} height={0.2 * u * 0.7} rx={1} fill={ISO.glass} stroke={dark} strokeWidth={0.5} />}
      />
      <Box x={x0 + 0.22} y={y0 + 0.03} z={0.51} w={0.54} d={D - 0.06} h={0.04} color={dark} />
      {wheel(x0 + 0.2, y0 + D - 0.02)}
      {wheel(x0 + L - 0.2, y0 + D - 0.02)}
    </g>
  )
}

/** Screen offset (px) of a grid move, for a CSS loop that slides a sprite along the floor. */
function shift(dx: number, dy: number): [number, number] {
  return [(dx - dy) * U, ((dx + dy) * U) / 2]
}
export const vars = (o: Record<string, number>): CSSProperties => Object.fromEntries(Object.entries(o).map(([k, v]) => [`--${k}`, `${v.toFixed(1)}px`])) as CSSProperties

/* the visitor's run: along the campus road from the right (A to B), a wait at the gate while the barrier lifts, in through it (C), up the internal road to the crossing (D) */
const ROAD_C = ROAD.y + ROAD.d / 2
const CAR_A: [number, number] = [8.0, ROAD_C]
const CAR_B = shift(GATE_C - CAR_A[0], 0)
const CAR_C = shift(GATE_C - CAR_A[0], PY2 - 0.55 - ROAD_C)
const CAR_D = shift(GATE_C - CAR_A[0], CROSS.y + CROSS.d / 2 - ROAD_C)
/* the stranger's walk from the road up to the front wall */
const STRANGER: [number, number] = [0.85, 6.3]
const STRANGER_B = shift(0, PY2 + 0.3 - STRANGER[1])

/** Dots of traffic along a straight stretch of the internal roads (teal, the roads pair). */
function RoadFlow({ from, to, n = 3, delay = 0 }: { from: [number, number]; to: [number, number]; n?: number; delay?: number }) {
  const { u } = useIso()
  const a = P(from[0], from[1], 0.06, u)
  const b = P(to[0], to[1], 0.06, u)
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const f = fx('flow', delay - (i * 2.2) / n, 2.2)
        return <circle key={i} cx={a[0]} cy={a[1]} r={4} fill={colors.white} stroke={colors.teal} strokeWidth={2.4} className={f.className} style={{ ...f.style, ...vars({ dx: b[0] - a[0], dy: b[1] - a[1] }) }} />
      })}
    </>
  )
}

function CampusScene({ focus }: { focus: number }) {
  const opCampus = opFor(focus, CAMPUS_P)
  const opAssoc = opFor(focus, ASSOC_P)
  const opGate = opFor(focus, GATE_P)
  const opRoads = opFor(focus, ROADS_P)
  const opWall = opFor(focus, WALL_P)
  const opBase = baseOp(focus)
  const gateOn = focus === GATE_P
  const roadsOn = focus === ROADS_P
  const wallOn = focus === WALL_P
  const campusOn = focus === CAMPUS_P
  const assocOn = focus === ASSOC_P
  const campusQ = pts([P(CAMPUS.x, CAMPUS.y, 0, U), P(CAMPUS.x + CAMPUS.w, CAMPUS.y, 0, U), P(CAMPUS.x + CAMPUS.w, CAMPUS.y + CAMPUS.d, 0, U), P(CAMPUS.x, CAMPUS.y + CAMPUS.d, 0, U)])
  /* the barrier: hinged on the right post, across the gate, at the posts' waist */
  const hinge = P(GATE.x2 - 0.1, PY2 + 0.02, 0.56, U)
  const tip = P(GATE.x1 + 0.12, PY2 + 0.02, 0.56, U)
  const lineA = P(0.2, ROAD_C, 0.02, U)
  const lineB = P(CAMPUS.w - 0.2, ROAD_C, 0.02, U)
  const roadFill = roadsOn ? colors.teal : '#8C9BB0'
  /* the leader lines from two tags to what they name */
  const wallMid = P(PLOT.x, PLOT.y + 2.5, WALL_H, U)
  const roadEnd = P(CROSS.x + CROSS.w - 0.25, CROSS.y + CROSS.d / 2, 0.02, U)
  const gatePost = P(GATE.x1, PY2 + 0.1, 0.5, U)
  return (
    <IsoScene w={AN_W} h={AN_SH} ox={OX} oy={OY} u={U}>
      <IsoSvg>
        {/* THE CAMPUS: grass, its fence (the campus pair) */}
        <g style={{ opacity: focus < 0 || campusOn ? 1 : 0.6, transition: fadeT }}>
          <polygon points={campusQ} fill={ISO.grass} opacity={0.55} />
          <polygon points={campusQ} fill={PAIR[CAMPUS_P]} opacity={campusOn ? 0.14 : 0} style={{ transition: fadeT }} />
          <polygon points={campusQ} fill="none" stroke={PAIR[CAMPUS_P]} strokeWidth={campusOn ? 3 : 2} strokeDasharray="7 5" strokeLinejoin="round" className={campusOn ? 'vpc-march' : undefined} style={{ opacity: opCampus, transition: fadeT }} />
        </g>
        {/* the campus road along the front, its centre line, the drives to both gates */}
        <g style={{ opacity: opBase, transition: fadeT }}>
          <Quad x={CAMPUS.x} y={ROAD.y} w={CAMPUS.w} d={ROAD.d} fill={ISO.slate} opacity={0.85} />
          <line x1={lineA[0]} y1={lineA[1]} x2={lineB[0]} y2={lineB[1]} stroke={colors.white} strokeWidth={1.6} strokeDasharray="7 6" opacity={0.75} />
          <Quad x={GATE.x1} y={PY2} w={GATE.x2 - GATE.x1} d={ROAD.y - PY2} fill={ISO.slate} opacity={0.85} />
          <Quad x={OTHER.gate[0]} y={OTHER.y + OTHER.d} w={OTHER.gate[1] - OTHER.gate[0]} d={ROAD.y - OTHER.y - OTHER.d} fill={ISO.slate} opacity={0.85} />
          <Tree x={5.9} y={0.75} s={0.9} />
          <Tree x={7.1} y={0.55} s={1} />
          <Tree x={8.1} y={1.0} s={0.85} />
          <Tree x={5.95} y={4.5} s={0.8} />
        </g>

        {/* THE SOCIETY'S PLOT: its ground (the association pair) */}
        <g style={{ opacity: opAssoc, transition: fadeT }}>
          <Quad x={PLOT.x} y={PLOT.y} w={PLOT.w} d={PLOT.d} fill="#EAF2E2" opacity={0.95} />
          <Quad x={PLOT.x} y={PLOT.y} w={PLOT.w} d={PLOT.d} fill={PAIR[ASSOC_P]} opacity={assocOn ? 0.2 : 0} style={{ transition: fadeT }} />
        </g>
        {/* its internal roads in a cross from the gate (the roads pair) */}
        <g style={{ opacity: opRoads, transition: fadeT }}>
          <Quad x={STEM.x} y={STEM.y} w={STEM.w} d={PY2 - STEM.y} fill={roadFill} opacity={0.9} style={{ transition: `fill 420ms ${EASE}` }} />
          <Quad x={CROSS.x} y={CROSS.y} w={CROSS.w} d={CROSS.d} fill={roadFill} opacity={0.9} style={{ transition: `fill 420ms ${EASE}` }} />
          {roadsOn && (
            <>
              <RoadFlow from={[STEM.x + STEM.w / 2, PY2 - 0.1]} to={[STEM.x + STEM.w / 2, STEM.y + 0.1]} />
              <RoadFlow from={[CROSS.x + 0.1, CROSS.y + CROSS.d / 2]} to={[CROSS.x + CROSS.w - 0.1, CROSS.y + CROSS.d / 2]} delay={-0.5} />
            </>
          )}
        </g>
        {/* the back walls, behind everything inside */}
        <g style={{ opacity: opWall, transition: fadeT }}>
          <Wall x={PLOT.x} y={PLOT.y} w={PLOT.w} d={WALL_T} lit={wallOn} />
          <Wall x={PLOT.x} y={PLOT.y} w={WALL_T} d={PLOT.d} lit={wallOn} />
        </g>
        {/* the back house and the garden tree */}
        <g style={{ opacity: opAssoc, transition: fadeT }}>
          <House x={HOUSE_BACK[0]} y={HOUSE_BACK[1]} w={HW} d={HD} h={0.85} roof="#C8644E" />
          <Tree x={3.6} y={1.05} s={1.05} />
        </g>
        {/* the left gate post, the barrier, the visitor */}
        <g style={{ opacity: opGate, transition: fadeT }}>
          <Pillar x={GATE.x1 - 0.22} y={PY2 - 0.1} lit={gateOn} />
          {/* the barrier: red and white, it lifts for the visitor */}
          <g className={gateOn ? 'vpc-barrier' : undefined}>
            <line x1={hinge[0]} y1={hinge[1]} x2={tip[0]} y2={tip[1]} stroke={colors.white} strokeWidth={5.5} strokeLinecap="round" />
            <line x1={hinge[0]} y1={hinge[1]} x2={tip[0]} y2={tip[1]} stroke={ISO.red} strokeWidth={5.5} strokeDasharray="5 5" strokeLinecap="butt" />
          </g>
          {gateOn && (
            <g className="vpc-drive" style={vars({ bx: CAR_B[0], by: CAR_B[1], cx: CAR_C[0], cy: CAR_C[1], ex: CAR_D[0], ey: CAR_D[1] })}>
              <Car x={CAR_A[0]} y={CAR_A[1]} color={colors.warning} />
            </g>
          )}
        </g>
        {/* the front houses */}
        <g style={{ opacity: opAssoc, transition: fadeT }}>
          {HOUSES_FRONT.map(([hx, hy], i) => (
            <House key={i} x={hx} y={hy} w={HW} d={HD} h={0.85} roof={i ? '#C8644E' : '#D9735B'} />
          ))}
        </g>
        {/* the front and right walls, the gap in the front one for the gate */}
        <g style={{ opacity: opWall, transition: fadeT }}>
          <Wall x={PX2 - WALL_T} y={PLOT.y} w={WALL_T} d={PLOT.d} lit={wallOn} />
          <Wall x={PLOT.x} y={PY2 - WALL_T} w={GATE.x1 - PLOT.x - 0.22} d={WALL_T} lit={wallOn} />
          <Wall x={GATE.x2} y={PY2 - WALL_T} w={PX2 - GATE.x2} d={WALL_T} lit={wallOn} />
        </g>
        {/* the right gate post, the guard's booth and the guard */}
        <g style={{ opacity: opGate, transition: fadeT }}>
          <Pillar x={GATE.x2 - 0.02} y={PY2 - 0.1} lit={gateOn} />
          <Box x={BOOTH.x} y={BOOTH.y} w={BOOTH.w} d={BOOTH.d} h={BOOTH.h} color="#F1E4CF" onLeft={<rect x={BOOTH.w * U * 0.2} y={BOOTH.h * U * 0.22} width={BOOTH.w * U * 0.6} height={BOOTH.h * U * 0.32} rx={1.5} fill={ISO.glass} />} />
          <Box x={BOOTH.x - 0.06} y={BOOTH.y - 0.06} z={BOOTH.h} w={BOOTH.w + 0.12} d={BOOTH.d + 0.12} h={0.08} color={gateOn ? colors.warning : '#B4BECD'} />
        </g>

        {/* the other resident association, walled, with its own gate on the same road */}
        <g style={{ opacity: opBase, transition: fadeT }}>
          <Quad x={OTHER.x} y={OTHER.y} w={OTHER.w} d={OTHER.d} fill="#EAF2E2" opacity={0.95} />
          <Quad x={OTHER.gate[0] + 0.15} y={OTHER.y + 1.4} w={OTHER.gate[1] - OTHER.gate[0] - 0.3} d={OTHER.d - 1.4} fill="#8C9BB0" opacity={0.9} />
          <Wall x={OTHER.x} y={OTHER.y} w={OTHER.w} d={WALL_T} h={WALL_H * 0.85} />
          <Wall x={OTHER.x} y={OTHER.y} w={WALL_T} d={OTHER.d} h={WALL_H * 0.85} />
          {OTHER_HOUSES.map(([hx, hy], j) => (
            <House key={j} x={hx} y={hy} w={0.92} d={0.95} h={0.75} roof={j % 2 ? '#D9735B' : '#C8644E'} />
          ))}
          <Wall x={OTHER.x + OTHER.w - WALL_T} y={OTHER.y} w={WALL_T} d={OTHER.d} h={WALL_H * 0.85} />
          <Wall x={OTHER.x} y={OTHER.y + OTHER.d - WALL_T} w={OTHER.gate[0] - OTHER.x - 0.2} d={WALL_T} h={WALL_H * 0.85} />
          <Wall x={OTHER.gate[1]} y={OTHER.y + OTHER.d - WALL_T} w={OTHER.x + OTHER.w - OTHER.gate[1]} d={WALL_T} h={WALL_H * 0.85} />
          <Pillar x={OTHER.gate[0] - 0.2} y={OTHER.y + OTHER.d - 0.1} h={0.72} />
          <Pillar x={OTHER.gate[1] - 0.02} y={OTHER.y + OTHER.d - 0.1} h={0.72} />
        </g>

        {/* the leader lines of the two tags set off the picture */}
        <g style={{ opacity: opWall, transition: fadeT }}>
          <line x1={wallMid[0] - 52} y1={wallMid[1] - 44} x2={wallMid[0] - 3} y2={wallMid[1] - 3} stroke={PAIR[WALL_P]} strokeWidth={1.8} strokeDasharray="3 3" />
          <circle cx={wallMid[0] - 3} cy={wallMid[1] - 2} r={3} fill={PAIR[WALL_P]} />
        </g>
        <g style={{ opacity: opGate, transition: fadeT }}>
          <line x1={gatePost[0] - 30} y1={gatePost[1] + 40} x2={gatePost[0] - 3} y2={gatePost[1] + 4} stroke={PAIR[GATE_P]} strokeWidth={1.8} strokeDasharray="3 3" />
          <circle cx={gatePost[0] - 2} cy={gatePost[1] + 3} r={3} fill={PAIR[GATE_P]} />
        </g>
        <g style={{ opacity: opRoads, transition: fadeT }}>
          <line x1={roadEnd[0] + 70} y1={roadEnd[1] - 72} x2={roadEnd[0] + 3} y2={roadEnd[1] - 3} stroke={PAIR[ROADS_P]} strokeWidth={1.8} strokeDasharray="3 3" />
          <circle cx={roadEnd[0] + 2} cy={roadEnd[1] - 2} r={3} fill={PAIR[ROADS_P]} />
        </g>
      </IsoSvg>

      {/* the people are the library's 3D renders (FS review 2026-11-04: no abstract figures), standing on their grid points */}
      {/* the guard at the gate: he steps on the spot while the visitor is let in */}
      <IsoAt x={GATE.x2 + 0.85} y={PY2 + 0.32}>
        <span className="block" style={{ opacity: opGate, transition: fadeT, transform: 'translateY(-100%)' }}>
          <span className={`block ${gateOn ? fx('lift', 0, 1.6).className : ''}`} style={gateOn ? fx('lift', 0, 1.6).style : undefined}>
            <CvIcon name="vpc-guard" w={HUMAN_H * 0.646} />
          </span>
        </span>
      </IsoAt>
      {/* the stranger: walks up to the wall, is stopped, turns back */}
      {wallOn && (
        <IsoAt x={STRANGER[0]} y={STRANGER[1]}>
          <span className="block" style={{ transform: 'translateY(-100%)' }}>
            <span className="vpc-bump block" style={vars({ bx: STRANGER_B[0], by: STRANGER_B[1] })}>
              <CvIcon name="vpc-stranger" w={HUMAN_H * 0.554} />
            </span>
          </span>
        </IsoAt>
      )}
      {/* the X over the stranger's head, as she is turned away */}
      {wallOn && (
        <IsoAt x={STRANGER[0]} y={PY2 + 0.3} z={2.1} cy>
          <span aria-hidden className="vpc-deny grid h-[24px] w-[24px] place-items-center rounded-full" style={{ background: colors.danger, color: colors.white, boxShadow: '0 0 0 2.5px #fff, 0 6px 12px -6px rgba(16,32,58,0.6)' }}>
            <X size={15} strokeWidth={3} />
          </span>
        </IsoAt>
      )}

      {/* the tags, in the TR's words, beside what they name */}
      <IsoAt x={PLOT.x + PLOT.w / 2 + 0.2} y={PLOT.y} z={1.6} dy={-30}>
        <PairTag pair={ASSOC_P} focus={focus} icon={<Users />}>Resident Association</PairTag>
      </IsoAt>
      <At x={wallMid[0] + OX - 52} y={wallMid[1] + OY - 58} cx cy>
        <PairTag pair={WALL_P} focus={focus} icon={<BrickWall />}>Boundary Wall</PairTag>
      </At>
      <At x={roadEnd[0] + OX + 92} y={roadEnd[1] + OY - 84} cx cy>
        <PairTag pair={ROADS_P} focus={focus} icon={<Route />}>Internal Roads</PairTag>
      </At>
      <At x={gatePost[0] + OX - 30} y={gatePost[1] + OY + 40} cx>
        <PairTag pair={GATE_P} focus={focus} icon={<DoorOpen />}>Own Gate</PairTag>
      </At>
      <IsoAt x={PX2 + 0.7} y={CAMPUS.d} dy={18}>
        <PairTag pair={ASSOC_P} focus={focus} icon={<Building2 />}>Gated Residential Society</PairTag>
      </IsoAt>
      <IsoAt x={CAMPUS.x + CAMPUS.w} y={CAMPUS.y + CAMPUS.d} dy={12}>
        <PairTag pair={CAMPUS_P} focus={focus} icon={<Trees />}>One Bigger Campus</PairTag>
      </IsoAt>
    </IsoScene>
  )
}

/* ================================================================== THE PROVIDER'S SHARED NETWORK (concept side) */

const OUT = { x: 12, y: 26, w: 446, h: 360 } as const
/* inside OUT */
const VPC = { x: 14, y: 48, w: 272, h: 200 } as const
const OTHER_VPC = [
  { x: 308, y: 48, w: 124, h: 94 },
  { x: 308, y: 154, w: 124, h: 94 },
] as const
const RES = 56
/* inside VPC */
const SRV = { cx: 62, cy: 100 } as const
const DB = { cx: 210, cy: 100 } as const
const HOP = { cx: 136, cy: 100 } as const
const DISC = { cx: 72, cy: VPC.h, r: 19 } as const
const BACKBONE_Y = 318
const ROUTERS = [52, 223, 394]

/** A small white disc holding an icon, ringed in a pair's colour. */
function Disc({ icon, tone, size, lit }: { icon: ReactNode; tone: string; size: number; lit: boolean }) {
  return (
    <span aria-hidden className="grid place-items-center rounded-full" style={{ width: size, height: size, background: lit ? tone : `linear-gradient(180deg, ${colors.white} 0%, ${colors.surface2} 100%)`, color: lit ? colors.white : tone, boxShadow: `inset 0 0 0 2.5px ${tone}, 0 8px 16px -10px rgba(16,32,58,0.55)`, transition: `all 420ms ${EASE}` }}>
      {icon}
    </span>
  )
}

/** A dot riding a straight DOM line (cvx-flow), the pair's colour. */
export function Flow({ x1, y1, x2, y2, tone, n = 2, dur = 2, delay = 0, size = 11 }: { x1: number; y1: number; x2: number; y2: number; tone: string; n?: number; dur?: number; delay?: number; size?: number }) {
  if (STILL) return null
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const f = fx('flow', delay - (i * dur) / n, dur)
        return <span key={i} aria-hidden className={`absolute rounded-full ${f.className}`} style={{ ...f.style, ...vars({ dx: x2 - x1, dy: y2 - y1 }), left: x1 - size / 2, top: y1 - size / 2, width: size, height: size, background: colors.white, boxShadow: `inset 0 0 0 3px ${tone}` }} />
      })}
    </>
  )
}

function HLine({ x, y, len, tone, thick = 3, op = 1 }: { x: number; y: number; len: number; tone: string; thick?: number; op?: number }) {
  return <span aria-hidden className="absolute rounded-full" style={{ left: x, top: y - thick / 2, width: len, height: thick, background: tone, opacity: op, transition: `background 420ms ${EASE}, opacity 460ms ${EASE}` }} />
}
function VLine({ x, y, len, tone, thick = 3, op = 1 }: { x: number; y: number; len: number; tone: string; thick?: number; op?: number }) {
  return <span aria-hidden className="absolute rounded-full" style={{ left: x - thick / 2, top: y, width: thick, height: len, background: tone, opacity: op, transition: `background 420ms ${EASE}, opacity 460ms ${EASE}` }} />
}

function ProviderScene({ focus }: { focus: number }) {
  const campusOn = !STILL && focus === CAMPUS_P
  const assocOn = !STILL && focus === ASSOC_P
  const gateOn = !STILL && focus === GATE_P
  const roadsOn = !STILL && focus === ROADS_P
  const wallOn = !STILL && focus === WALL_P
  const ring = (on: boolean, tone: string) => (on ? `0 0 0 4px ${tone}55, 0 12px 26px -12px ${tone}` : '0 0 0 0 transparent')
  /* where the addressed packet climbs: the backbone, up to the VPC's address, then in to the server */
  const discAbs = { x: VPC.x + DISC.cx, y: VPC.y + DISC.cy }
  const srvAbs = { x: VPC.x + SRV.cx, y: VPC.y + SRV.cy }
  /* the refused packet: from the next VPC across to the walled-off section's right rim */
  const strayFrom = { x: OTHER_VPC[1].x + 12, y: OTHER_VPC[1].y + 60 }
  const strayTo = { x: VPC.x + VPC.w + 9, y: strayFrom.y }
  return (
    <At x={OUT.x} y={OUT.y}>
      <div className="relative" style={{ width: OUT.w, height: OUT.h, borderRadius: 18, border: `${campusOn ? 2 : 1.5}px solid ${campusOn ? PAIR[CAMPUS_P] : '#B7C6E6'}`, background: campusOn ? `${PAIR[CAMPUS_P]}12` : 'rgba(45,99,251,0.04)', boxShadow: ring(campusOn, PAIR[CAMPUS_P]), transition: `all 420ms ${EASE}` }}>
        {/* the tag sits inside the box, clear of its rim (FS review 2026-11-04: a faded tag over the border read as overlapping it) */}
        <div className="absolute" style={{ left: 12, top: 10, zIndex: 2 }}>
          <PairTag pair={CAMPUS_P} focus={focus} icon={<Network />}>
            Provider's Shared Network
          </PairTag>
        </div>

        {/* the shared backbone every tenant rides: three switches on one line */}
        <div style={{ opacity: focus < 0 || campusOn ? 1 : BASE_FADE, transition: fadeT }}>
          <HLine x={ROUTERS[0]} y={BACKBONE_Y} len={ROUTERS[2] - ROUTERS[0]} tone={campusOn ? PAIR[CAMPUS_P] : '#AFC2E4'} thick={4} />
          {/* drops from the backbone to each VPC */}
          <VLine x={discAbs.x} y={discAbs.y + DISC.r} len={BACKBONE_Y - discAbs.y - DISC.r} tone={gateOn ? PAIR[GATE_P] : '#C9D6EE'} />
          <VLine x={OTHER_VPC[1].x + OTHER_VPC[1].w / 2} y={OTHER_VPC[1].y + OTHER_VPC[1].h} len={BACKBONE_Y - OTHER_VPC[1].y - OTHER_VPC[1].h} tone="#C9D6EE" />
          {ROUTERS.map((x, i) => (
            <div key={x} className="absolute" style={{ left: x, top: BACKBONE_Y, transform: 'translate(-50%, -50%)' }}>
              <span className="relative grid h-[34px] w-[34px] place-items-center rounded-[10px]" style={{ background: `linear-gradient(180deg, #33478F 0%, ${LAB.navy} 100%)`, boxShadow: '0 8px 16px -8px rgba(16,32,58,0.6)' }}>
                <Waypoints size={18} color={colors.white} aria-hidden />
                <span aria-hidden className={`absolute right-[4px] top-[4px] h-[5px] w-[5px] rounded-full ${fx('blink', i * 0.33, 1.2).className}`} style={{ ...fx('blink', i * 0.33, 1.2).style, background: ISO.green }} />
              </span>
            </div>
          ))}
          {(campusOn || focus < 0) && <Flow x1={ROUTERS[0] + 20} y1={BACKBONE_Y} x2={ROUTERS[2] - 20} y2={BACKBONE_Y} tone={PAIR[CAMPUS_P]} n={3} dur={2.6} />}
        </div>

        {/* the other tenants' own VPCs */}
        {OTHER_VPC.map((r, i) => (
          <div key={i} className="absolute" style={{ left: r.x, top: r.y, opacity: focus < 0 || campusOn ? 1 : BASE_FADE, transition: fadeT }}>
            <div className="relative" style={{ width: r.w, height: r.h, borderRadius: 14, border: '1.5px solid #B9CBEA', background: 'rgba(45,99,251,0.05)' }}>
              <div className="absolute" style={{ left: 8, top: 8 }}>
                <span className="inline-flex rounded-pill px-2 py-[2px] font-heading text-[14px] font-semibold leading-tight" style={{ background: colors.surface, color: colors.muted, boxShadow: 'inset 0 0 0 1.5px #CFDCF5' }}>
                  VPC
                </span>
              </div>
              <div className="absolute flex items-center gap-2" style={{ left: '50%', top: '64%', transform: 'translate(-50%, -50%)' }}>
                <Resource kind="server" size={36} />
                <Resource kind="database" size={36} />
              </div>
            </div>
          </div>
        ))}

        {/* THE CUSTOMER'S VPC */}
        <div className="absolute" style={{ left: VPC.x, top: VPC.y, opacity: focus < 0 || assocOn || wallOn ? 1 : 0.7, transition: fadeT }}>
          <div
            className="relative"
            style={{
              width: VPC.w,
              height: VPC.h,
              borderRadius: 16,
              border: `${wallOn ? 2.5 : 1.75}px dashed ${wallOn ? PAIR[WALL_P] : PAIR[ASSOC_P]}`,
              background: assocOn ? `${PAIR[ASSOC_P]}1a` : 'rgba(45,99,251,0.06)',
              boxShadow: assocOn ? ring(true, PAIR[ASSOC_P]) : wallOn ? ring(true, PAIR[WALL_P]) : 'none',
              transition: `border-color 420ms ${EASE}, background 420ms ${EASE}, box-shadow 420ms ${EASE}`,
            }}
          >
            <div className="absolute" style={{ left: 10, top: 10, zIndex: 2 }}>
              <PairTag pair={ASSOC_P} focus={focus} icon={<Server />}>
                VPC
              </PairTag>
            </div>
            <div className="absolute" style={{ right: 10, top: 10 }}>
              <PairTag pair={WALL_P} focus={focus} icon={<BrickWall />}>
                Walled-Off Section
              </PairTag>
            </div>
            {/* the routed line: server, a hop, database */}
            <div style={{ opacity: focus < 0 || roadsOn || assocOn ? 1 : FADE, transition: fadeT }}>
              <HLine x={SRV.cx + RES / 2 + 2} y={SRV.cy} len={DB.cx - SRV.cx - RES - 4} tone={roadsOn ? PAIR[ROADS_P] : '#9DB3DD'} thick={roadsOn ? 4 : 3} />
              {roadsOn && (
                <>
                  <Flow x1={SRV.cx + RES / 2 + 4} y1={SRV.cy} x2={HOP.cx - 14} y2={SRV.cy} tone={PAIR[ROADS_P]} n={1} dur={1.4} size={10} />
                  <Flow x1={HOP.cx + 14} y1={SRV.cy} x2={DB.cx - RES / 2 - 4} y2={SRV.cy} tone={PAIR[ROADS_P]} n={1} dur={1.4} delay={-0.7} size={10} />
                </>
              )}
              <div className="absolute" style={{ left: HOP.cx, top: HOP.cy, transform: 'translate(-50%, -50%)' }}>
                <Disc icon={<Route size={14} />} tone={PAIR[ROADS_P]} size={28} lit={roadsOn} />
              </div>
            </div>
            <div className="absolute" style={{ left: SRV.cx, top: SRV.cy, transform: 'translate(-50%, -50%)', opacity: focus < 0 || assocOn || roadsOn || gateOn ? 1 : FADE, transition: fadeT }}>
              <Resource kind="server" size={RES} />
            </div>
            <div className="absolute" style={{ left: DB.cx, top: DB.cy, transform: 'translate(-50%, -50%)', opacity: focus < 0 || assocOn || roadsOn ? 1 : FADE, transition: fadeT }}>
              <Resource kind="database" size={RES} />
            </div>
            <div className="absolute" style={{ left: HOP.cx, top: HOP.cy + 52, transform: 'translate(-50%, -50%)' }}>
              <PairTag pair={ROADS_P} focus={focus} icon={<Route />}>
                Routed
              </PairTag>
            </div>
            {/* its address, on its edge */}
            <div className="absolute" style={{ left: DISC.cx, top: DISC.cy, transform: 'translate(-50%, -50%)', opacity: opFor(focus, GATE_P), transition: fadeT }}>
              <Ripple x={DISC.r} y={DISC.r} r={DISC.r + 4} tone={PAIR[GATE_P]} on={gateOn} n={2} dur={1.6} />
              <Disc icon={<MapPin size={18} />} tone={PAIR[GATE_P]} size={DISC.r * 2} lit={gateOn} />
            </div>
            <div className="absolute" style={{ left: DISC.cx + DISC.r + 8, top: DISC.cy + 22, transform: 'translateY(-50%)' }}>
              <PairTag pair={GATE_P} focus={focus} icon={<MapPin />}>
                Addressed
              </PairTag>
            </div>
          </div>
        </div>

        {/* the addressed packet: up from the backbone to the VPC's address, then in to the server */}
        {gateOn && (
          <span aria-hidden className="vpc-addr absolute grid h-[16px] w-[16px] place-items-center rounded-full" style={{ ...vars({ bx: 0, by: discAbs.y - BACKBONE_Y, cx: srvAbs.x - discAbs.x, cy: srvAbs.y - BACKBONE_Y }), left: discAbs.x - 8, top: BACKBONE_Y - 8, background: PAIR[GATE_P], boxShadow: '0 0 0 2.5px #fff, 0 6px 12px -6px rgba(16,32,58,0.6)', zIndex: 3 }} />
        )}
        {/* the refused packet: it hits the walled-off section's rim and is turned back */}
        {wallOn && (
          <>
            <span aria-hidden className="vpc-bump absolute rounded-full" style={{ ...vars({ bx: strayTo.x - strayFrom.x, by: 0 }), left: strayFrom.x - 8, top: strayFrom.y - 8, width: 16, height: 16, background: PAIR[WALL_P], boxShadow: '0 0 0 2.5px #fff, 0 6px 12px -6px rgba(16,32,58,0.6)', zIndex: 3 }} />
            <span aria-hidden className="vpc-deny absolute grid h-[24px] w-[24px] place-items-center rounded-full" style={{ left: strayTo.x - 2, top: strayFrom.y - 40, background: colors.danger, color: colors.white, boxShadow: '0 0 0 2.5px #fff, 0 6px 12px -6px rgba(16,32,58,0.6)', zIndex: 3 }}>
              <X size={15} strokeWidth={3} />
            </span>
          </>
        )}
      </div>
    </At>
  )
}

/**
 * ONE clock for both pictures (one step track): campus, association, gate, roads,
 * wall, then the whole picture; it loops in auto mode, one press per pair by hand.
 */
export function SocietyAnalogy({ lesson }: { lesson: string }) {
  /* R8.1 (round 3): in auto mode the five pairs loop with no rest beat between laps; by hand the sixth press
     still shows the whole picture, and harness URLs, thumbnails and reduced motion hold it */
  const auto = useAutoAnim()
  const instant = useInstant()
  const held = STILL || REDUCED || instant
  const k = useCycle(auto && !held ? 5 : 6, DUR * 1000, 5, 5)
  const focus = held || k >= 5 ? -1 : k
  return (
    <IsoAnalogy
      id="T03-AN"
      kicker="What Is A VPC"
      title="A Gated Society Inside One Campus"
      lesson={lesson}
      bare
      h={AN_SH}
      everyday={{ label: 'A Gated Society Inside One Campus', scene: <CampusScene focus={focus} /> }}
      cloud={{ label: "A VPC inside the provider's shared network", scene: <ProviderScene focus={focus} /> }}
    />
  )
}

/** The analogy's loops: the fence's march, the barrier, the car, the stranger, the refusal, the addressed packet. */
export const SOCIETY_CSS = `
@keyframes vpc-march { to { stroke-dashoffset: -24 } }
.vpc-march { animation: vpc-march 1.2s linear infinite; }
@keyframes vpc-barrier { 0%, 30% { transform: rotate(0deg) } 42%, 80% { transform: rotate(62deg) } 92%, 100% { transform: rotate(0deg) } }
.vpc-barrier { transform-box: fill-box; transform-origin: 100% 100%; animation: vpc-barrier ${LOOP} cubic-bezier(0.65,0,0.35,1) infinite; }
@keyframes vpc-drive { 0% { transform: translate(0px, 0px); opacity: 0 } 6% { opacity: 1 } 32%, 46% { transform: translate(var(--bx), var(--by)) } 72% { transform: translate(var(--cx), var(--cy)) } 90% { transform: translate(var(--ex), var(--ey)); opacity: 1 } 100% { transform: translate(var(--ex), var(--ey)); opacity: 0 } }
.vpc-drive { animation: vpc-drive ${LOOP} cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes vpc-addr { 0% { transform: translate(0px, 0px) scale(0.6); opacity: 0 } 8% { opacity: 1; transform: translate(0px, 0px) scale(1) } 32%, 46% { transform: translate(var(--bx), var(--by)) scale(1) } 82% { transform: translate(var(--cx), var(--cy)) scale(1); opacity: 1 } 100% { transform: translate(var(--cx), var(--cy)) scale(0.5); opacity: 0 } }
.vpc-addr { animation: vpc-addr ${LOOP} cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes vpc-bump { 0% { transform: translate(0px, 0px); opacity: 0 } 10% { opacity: 1 } 42% { transform: translate(var(--bx), var(--by)) } 48% { transform: translate(calc(var(--bx) - 4px), var(--by)) } 54% { transform: translate(calc(var(--bx) + 3px), var(--by)) } 60% { transform: translate(var(--bx), var(--by)) } 82% { transform: translate(calc(var(--bx) * 0.35), calc(var(--by) * 0.35)); opacity: 1 } 100% { transform: translate(0px, 0px); opacity: 0 } }
.vpc-bump { animation: vpc-bump ${LOOP} cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes vpc-deny { 0%, 42% { transform: scale(0.4); opacity: 0 } 50% { transform: scale(1.15); opacity: 1 } 56%, 80% { transform: scale(1); opacity: 1 } 90%, 100% { transform: scale(0.6); opacity: 0 } }
.vpc-deny { animation: vpc-deny ${LOOP} cubic-bezier(0.22,1,0.36,1) infinite; }
.cc-still .vpc-march, .deck-thumb .vpc-march, .cc-still .vpc-barrier, .deck-thumb .vpc-barrier { animation: none !important; }
.cc-still .vpc-drive, .deck-thumb .vpc-drive, .cc-still .vpc-addr, .deck-thumb .vpc-addr, .cc-still .vpc-bump, .deck-thumb .vpc-bump, .cc-still .vpc-deny, .deck-thumb .vpc-deny { animation: none !important; opacity: 0 !important; }
@media (prefers-reduced-motion: reduce) { .vpc-march, .vpc-barrier { animation: none !important; } .vpc-drive, .vpc-addr, .vpc-bump, .vpc-deny { animation: none !important; opacity: 0 !important; } }
`
