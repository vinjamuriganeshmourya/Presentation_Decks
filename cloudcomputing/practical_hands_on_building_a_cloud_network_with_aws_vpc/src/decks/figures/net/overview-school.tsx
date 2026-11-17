import type { ReactNode } from 'react'
import { IdCard, ShieldCheck, Check } from 'lucide-react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { SPEED, useAutoAnim } from '@/deck/autoAnim'
import { Arrow, At, Label, REDUCED, STILL, useCycle } from '../scene'
import { Icon3D } from '../d3/kit'
import { AN_W, IsoAnalogy } from '../iso/frames'
import { Box, FACE_STROKE, ISO, IsoAt, IsoScene, IsoSvg, P, Quad, Shadow, pts, shade } from '../iso/iso'
import { Lock } from '../iso/objects'
import { Badge } from './fx'
import { Boundary, NET, NoMark } from './frames'
import { along, Dot, focusOp, run, seg, usePhase } from './overview-motion'
import studentPng from './icons/overview-student.png'

/**
 * T01-AN · A SCHOOL'S GATES, CORRIDORS AND ENTRY RULES (visual pass, 2026-11-04;
 * Session 4's FlatsAnalogy is the reference: one clock for both pictures, one pair
 * of matched parts lit at a time, the rest faded back).
 *
 * THE SCHOOL (`../iso/iso`, one scale for everything): a walled campus on grass; a
 * two-storey school block with a clock turret, three classrooms on the ground floor
 * behind a covered corridor (its columns and canopy), the third room padlocked; a
 * flagpole and two trees; outside, a footpath up to the gate (two posts, an arch,
 * a sliding barred gate) and the entry-rules board on its posts beside it. One
 * student with a backpack walks the whole way.
 *
 * THE PAIRS, each in its own colour (G4), the other pair faded back:
 *   A  amber   gates, entry rules, who can enter  =  how traffic reaches cloud resources
 *      the student walks up the path, shows an ID at the board, the board ticks,
 *      the gate slides open, the student walks in, the gate slides shut; on the
 *      cloud side a packet rides from the user to the checkpoint on the boundary,
 *      the checkpoint ticks, the packet rides on to the first server
 *   B  green   corridors, which rooms they can access, where they can go  =  which resources it can access
 *      the student walks the corridor, the padlocked room shakes its lock as she
 *      passes (no entry), the first room's door opens; on the cloud side a packet
 *      reaches the second server, and one is stopped before the third
 *   then the whole picture at rest. Auto: it loops. Auto OFF: one press per pair.
 */

const AN_H = 400
const AMBER = ISO.customer
const AMBER_DK = '#C77C0A'
const GREEN = colors.success

/* ------------------------------------------------------------------ the campus, in grid units */

const SU = 32
const PLOT = { w: 7.4, d: 5 } as const
const WALL_H = 0.45
const WALL_T = 0.16
const GATE = { y1: 3.1, y2: 4.3 } as const
const ROAD = { x1: 7.4, x2: 9.9 } as const
const BLD = { x: 0.4, y: 0.3, w: 4.6, d: 1.6 } as const
const STOREY = 1.4
const SLAB = 0.08
const CORR = { y: BLD.y + BLD.d, d: 0.72 } as const
const DOORS = [0.9, 2.3, 3.7] // the three classroom doors, along the block's front
const DOOR_W = 0.42
const DOOR_H = 1.15
const SIGN = { x: 8.0, y: 2.66, w: 0.95 } as const
const FLAG = { x: 6.45, y: 1.05 } as const

const BRICK = '#E9D9C4'
const WALL_C = '#D7CDBE'
const BLOCK_C = '#F3EEE6'
const TRIM = '#C9B99A'
const WOOD = '#B9814E'
const ROOF = '#9AA8BC'
const GATE_C = '#3E4C63'

/* the student's route: A from the far end of the path to the board, through the gate, into the yard;
   B from the yard round to the corridor, along it to the first classroom's door */
const ROUTE_A: [number, number][] = [
  [9.7, 3.7],
  [8.5, 3.7],
  [6.0, 3.7],
]
const ROUTE_B: [number, number][] = [
  [6.0, 3.7],
  [5.4, 3.7],
  [5.4, 2.28],
  [BLD.x + DOORS[0] - 0.3, 2.28],
]

/** Where the student is, and what the gate and doors are doing, at phase `u` of a pair (or at rest). */
function schoolState(pair: number, u: number) {
  if (pair === 0) {
    /* 0-0.28 walk to the board; 0.28-0.5 the ID and the tick; 0.46-0.56 the gate opens; 0.56-0.86 walk in; 0.88-0.98 the gate shuts */
    const walk1 = seg(u, 0.02, 0.28)
    const walk2 = seg(u, 0.56, 0.86)
    const at = walk2 > 0 ? along([ROUTE_A[1], ROUTE_A[2]], walk2) : along([ROUTE_A[0], ROUTE_A[1]], walk1)
    return {
      at,
      op: Math.min(1, u / 0.05),
      moving: (u > 0.02 && u < 0.28) || (u > 0.56 && u < 0.86),
      /* the ID, once shown at the board, stays in hand through the gate (it never shows and hides within one press) */
      id: u > 0.28,
      tick: u > 0.38,
      gate: seg(u, 0.46, 0.56) * (1 - seg(u, 0.88, 0.98)),
      door: 0,
    }
  }
  if (pair === 1) {
    const w = seg(u, 0.02, 0.76)
    return { at: along(ROUTE_B, w), op: 1, moving: u > 0.02 && u < 0.76, id: false, tick: true, gate: 0, door: seg(u, 0.78, 0.88) }
  }
  return { at: ROUTE_B[ROUTE_B.length - 1], op: 1, moving: false, id: false, tick: true, gate: 0, door: 1 }
}

/** A tag inside a picture, in the TR's words: in its pair's colour while that pair is lit. */
function Tag({ children, lit, tone }: { children: ReactNode; lit: boolean; tone: 'warn' | 'good' }) {
  return (
    <Label size={14} strong tone={lit ? tone : 'plain'} raised>
      {children}
    </Label>
  )
}

/**
 * The student: the library's 3D render (R7: realistic people, the same family as the cloud side's
 * user), trimmed to the figure. She moves as a whole image along the route, with a small bob while
 * walking; feet at screen point (x, y).
 */
const STUDENT_H = 40
const STUDENT_W = Math.round((STUDENT_H * 44) / 88)
function Student({ x, y, op, moving }: { x: number; y: number; op: number; moving: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`} opacity={op}>
      <ellipse cx={0} cy={0} rx={9} ry={3.4} fill={ISO.slate} opacity={0.22} />
      <g className={run(moving, 'ov-step')}>
        <image href={studentPng} x={-STUDENT_W / 2} y={-STUDENT_H + 1} width={STUDENT_W} height={STUDENT_H} preserveAspectRatio="xMidYMax meet" />
      </g>
    </g>
  )
}

/** One classroom door on the block's front face (face units): wood with a glass slit; open shows the room's dark inside and the leaf swung back. */
function Door({ at, open, fh }: { at: number; open: number; fh: number }) {
  const x = at * SU - (DOOR_W * SU) / 2
  const w = DOOR_W * SU
  const h = DOOR_H * SU
  const y = fh - h
  return (
    <g>
      <rect x={x - 1.5} y={y - 1.5} width={w + 3} height={h + 1.5} rx={1.5} fill={TRIM} />
      <rect x={x} y={y} width={w} height={h} rx={1} fill="#2B3A52" />
      {/* the leaf: full width when shut, a narrow swung-back strip when open */}
      <rect x={x} y={y} width={w * (1 - 0.78 * open)} height={h} rx={1} fill={WOOD} stroke={shade(WOOD, -0.3)} strokeWidth={0.8} style={FACE_STROKE} />
      <rect x={x + w * 0.3 * (1 - 0.78 * open)} y={y + h * 0.14} width={w * 0.4 * (1 - 0.78 * open)} height={h * 0.26} rx={0.8} fill={ISO.glass} />
      {/* the handle rides the leaf as it swings back: always drawn, never faded (no paint-then-vanish within a step) */}
      <circle cx={x + w * (1 - 0.78 * open) - 3} cy={y + h * 0.56} r={1.3} fill="#F2C14E" />
    </g>
  )
}

/** A window on a face (face units). */
const Win = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={1.2} fill={ISO.glass} stroke="#9FB3D1" strokeWidth={1} style={FACE_STROKE} />
    <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke="#9FB3D1" strokeWidth={0.8} style={FACE_STROKE} />
  </g>
)

/** A round tree: a trunk and a two-tone crown, standing at grid (x, y). */
function Tree({ x, y, r = 0.55 }: { x: number; y: number; r?: number }) {
  const [cx, cy] = P(x, y, 1.05, SU)
  return (
    <g>
      <Shadow x={x - 0.3} y={y - 0.3} w={0.6} d={0.6} grow={0.1} opacity={0.14} />
      <Box x={x - 0.07} y={y - 0.07} w={0.14} d={0.14} h={0.8} color="#8B6B4A" />
      <circle cx={cx} cy={cy} r={r * SU} fill="#5DAA5E" stroke="#3F8A45" strokeWidth={1} />
      <circle cx={cx - r * SU * 0.3} cy={cy - r * SU * 0.3} r={r * SU * 0.55} fill="#7CC27A" />
    </g>
  )
}

/** The front face of the ground storey: the three doors and a window between each pair. */
function GroundFront({ open, fh }: { open: number; fh: number }) {
  return (
    <g>
      {[1.6, 3.0].map((a) => (
        <Win key={a} x={a * SU - 0.26 * SU} y={fh * 0.22} w={0.52 * SU} h={fh * 0.32} />
      ))}
      {[4.25].map((a) => (
        <Win key={a} x={a * SU - 0.2 * SU} y={fh * 0.22} w={0.4 * SU} h={fh * 0.32} />
      ))}
      <Door at={DOORS[0]} open={open} fh={fh} />
      <Door at={DOORS[1]} open={0} fh={fh} />
      <Door at={DOORS[2]} open={0} fh={fh} />
    </g>
  )
}

function UpperFront({ fh }: { fh: number }) {
  return (
    <g>
      {[0.55, 1.6, 2.65, 3.7].map((a) => (
        <Win key={a} x={a * SU} y={fh * 0.24} w={0.62 * SU} h={fh * 0.4} />
      ))}
    </g>
  )
}

const SideWin = ({ fh }: { fh: number }) => <Win x={BLD.d * SU * 0.32} y={fh * 0.24} w={BLD.d * SU * 0.36} h={fh * 0.4} />

/** The clock on the turret's front: a face and two hands. */
const ClockFace = ({ fw, fh }: { fw: number; fh: number }) => (
  <g>
    <circle cx={fw / 2} cy={fh * 0.5} r={fh * 0.3} fill="#fff" stroke={shade(TRIM, -0.3)} strokeWidth={1.2} />
    <line x1={fw / 2} y1={fh * 0.5} x2={fw / 2} y2={fh * 0.3} stroke={colors.ink} strokeWidth={1.3} strokeLinecap="round" />
    <line x1={fw / 2} y1={fh * 0.5} x2={fw / 2 + fh * 0.14} y2={fh * 0.56} stroke={colors.ink} strokeWidth={1.3} strokeLinecap="round" />
  </g>
)

/** The entry-rules board's face: an ID card glyph and three rule lines. */
const BoardFace = ({ fw, fh }: { fw: number; fh: number }) => (
  <g>
    <rect x={3} y={3} width={fw - 6} height={fh - 6} rx={2} fill="#FFFDF7" stroke={AMBER_DK} strokeWidth={1} style={FACE_STROKE} />
    <rect x={6} y={6} width={9} height={7} rx={1.2} fill="none" stroke={AMBER_DK} strokeWidth={1} />
    <circle cx={9} cy={9.5} r={1.4} fill={AMBER_DK} />
    {[0, 1, 2].map((i) => (
      <line key={i} x1={18} y1={7.5 + i * 3.4} x2={fw - 7} y2={7.5 + i * 3.4} stroke="#B9C2CF" strokeWidth={1.4} strokeLinecap="round" />
    ))}
  </g>
)

function SchoolScene({ pair, u }: { pair: number; u: number }) {
  const st = schoolState(pair, u)
  const focus = STILL ? -1 : pair <= 1 ? pair : -1
  const opA = focusOp(focus < 0 || focus === 0)
  const opB = focusOp(focus < 0 || focus === 1)
  const opN = focusOp(focus < 0, 0.6)
  const [sx, sy] = P(st.at[0], st.at[1], 0, SU)
  const inYard = st.at[1] > CORR.y + CORR.d - 0.05
  /* the gate panel slides back along the wall as it opens */
  const slide = st.gate * (GATE.y2 - GATE.y1 + 0.05)
  const [gdx, gdy] = [slide * SU, (-slide * SU) / 2]
  const gx = PLOT.w - WALL_T / 2
  const bars = Array.from({ length: 9 }, (_, i) => GATE.y1 + 0.06 + (i * (GATE.y2 - GATE.y1 - 0.12)) / 8)
  const lockShake = pair === 1 && st.at[0] > BLD.x + DOORS[2] - 0.6 && st.at[0] < BLD.x + DOORS[2] + 0.9 && st.moving
  const routeA = ROUTE_A.map(([x, y]) => P(x, y, 0.02, SU))
  const routeB = ROUTE_B.map(([x, y]) => P(x, y, 0.08, SU))
  const wall = (x: number, y: number, w: number, d: number) => (
    <>
      <Box x={x} y={y} w={w} d={d} h={WALL_H} color={WALL_C} />
      <Box x={x - 0.03} y={y - 0.03} z={WALL_H} w={w + 0.06} d={d + 0.06} h={0.06} color={shade(WALL_C, -0.12)} />
    </>
  )
  const student = <Student x={sx} y={sy} op={st.op} moving={st.moving} />
  return (
    <IsoScene w={AN_W} h={AN_H} ox={214} oy={132} u={SU}>
      <IsoSvg>
        {/* the grass plot and the ground outside */}
        <Quad x={-0.5} y={-0.4} w={PLOT.w + 3.2} d={PLOT.d + 0.9} fill={ISO.grass} opacity={0.42} />
        <Quad x={0} y={0} w={PLOT.w} d={PLOT.d} fill={ISO.grass} opacity={0.35} />
        {/* the footpath, out to the gate and in across the yard to the corridor */}
        <g style={opA}>
          <Quad x={ROAD.x1} y={GATE.y1} w={ROAD.x2 - ROAD.x1} d={GATE.y2 - GATE.y1} fill="#C3CBD8" stroke={shade('#C3CBD8', -0.2)} />
        </g>
        <g style={opN}>
          <Quad x={5.0} y={GATE.y1} w={PLOT.w - 5.0} d={GATE.y2 - GATE.y1} fill="#D6DCE6" />
          <Quad x={5.0} y={CORR.y + CORR.d} w={0.8} d={GATE.y1 - CORR.y - CORR.d} fill="#D6DCE6" />
        </g>
        {/* the routes, each pair's own colour: the way in (amber) and the way round inside (green) */}
        <g style={opA}>
          <polyline points={pts(routeA)} fill="none" stroke={AMBER} strokeWidth={2} strokeDasharray="6 4" strokeLinecap="round" className={run(focus === 0, 'ov-march')} />
        </g>
        {/* the back walls */}
        <g style={opA}>
          {wall(0, 0, PLOT.w, WALL_T)}
          {wall(0, 0, WALL_T, PLOT.d)}
        </g>
        {/* the flagpole */}
        <g style={opN}>
          <Box x={FLAG.x - 0.05} y={FLAG.y - 0.05} w={0.1} d={0.1} h={2.6} color="#AEB8C6" />
          {(() => {
            const a = P(FLAG.x, FLAG.y, 2.55, SU)
            return (
              <g transform={`translate(${a[0]} ${a[1]})`}>
                <g className={run(true, 'ov-flag')}>
                  <path d="M 0 0 L 26 5 L 26 21 L 0 16 Z" fill={colors.brand} stroke={shade(colors.brand, -0.35)} strokeWidth={0.8} />
                  <path d="M 0 5.3 L 26 10.3 L 26 15.7 L 0 10.7 Z" fill="#fff" opacity={0.85} />
                </g>
              </g>
            )
          })()}
        </g>
        {/* THE SCHOOL BLOCK: two storeys, a clock turret, the three classrooms behind the corridor */}
        <g style={opB}>
          <Shadow x={BLD.x} y={BLD.y} w={BLD.w} d={BLD.d} grow={0.2} opacity={0.14} />
          <Box x={BLD.x} y={BLD.y} w={BLD.w} d={BLD.d} h={STOREY} color={BLOCK_C} onLeft={<GroundFront open={st.door} fh={STOREY * SU} />} onRight={<SideWin fh={STOREY * SU} />} />
          <Box x={BLD.x} y={BLD.y} z={STOREY + SLAB} w={BLD.w} d={BLD.d} h={STOREY - 0.1} color={BRICK} onLeft={<UpperFront fh={(STOREY - 0.1) * SU} />} onRight={<SideWin fh={(STOREY - 0.1) * SU} />} />
          <Box x={BLD.x - 0.08} y={BLD.y - 0.08} z={2 * STOREY - 0.02} w={BLD.w + 0.16} d={BLD.d + 0.16} h={0.14} color={ROOF} />
          <Box x={2.2} y={0.65} z={2 * STOREY + 0.12} w={0.85} d={0.85} h={0.7} color={BRICK} onLeft={<ClockFace fw={0.85 * SU} fh={0.7 * SU} />} />
          <Box x={2.12} y={0.57} z={2 * STOREY + 0.82} w={1.01} d={1.01} h={0.1} color={ROOF} />
          {/* the corridor: a raised floor along the front, the canopy over it (the first floor's slab) */}
          <Box x={BLD.x} y={CORR.y} w={BLD.w} d={CORR.d} h={0.06} color="#E4E9F1" />
        </g>
        {/* the way round inside (green), over the corridor's floor */}
        <g style={opB}>
          <polyline points={pts(routeB)} fill="none" stroke={GREEN} strokeWidth={2} strokeDasharray="6 4" strokeLinecap="round" strokeLinejoin="round" className={run(focus === 1, 'ov-march')} />
        </g>
        {/* the padlocked third classroom: its lock shakes when someone tries the corridor past it */}
        <g style={opB}>
          <g className={run(lockShake, 'ov-shake')}>
            <Lock x={BLD.x + DOORS[2] + 0.08} y={CORR.y} z={0.5} size={0.62} color={NET.blocked} />
          </g>
        </g>
        {/* the student, under the canopy while in the corridor */}
        {!inYard && student}
        <g style={opB}>
          {[0.05, 1.18, 2.31, 3.44, 4.5].map((dx) => (
            <Box key={dx} x={BLD.x + dx} y={CORR.y + CORR.d - 0.12} w={0.1} d={0.1} h={STOREY} color={TRIM} />
          ))}
          <Box x={BLD.x - 0.05} y={CORR.y - 0.02} z={STOREY} w={BLD.w + 0.1} d={CORR.d + 0.06} h={SLAB} color={shade(TRIM, 0.2)} />
        </g>
        {/* the trees */}
        <g style={opN}>
          <Tree x={6.85} y={0.5} r={0.5} />
        </g>
        {/* THE GATE: the panel slides back behind the wall, the wall drawn over it */}
        <g style={opA}>
          <g transform={`translate(${gdx} ${gdy})`}>
            {bars.map((y) => {
              const a = P(gx, y, 0.06, SU)
              const b = P(gx, y, 0.92, SU)
              return <line key={y} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={GATE_C} strokeWidth={2} strokeLinecap="round" />
            })}
            {[0.12, 0.5, 0.9].map((z) => {
              const a = P(gx, GATE.y1 + 0.02, z, SU)
              const b = P(gx, GATE.y2 - 0.02, z, SU)
              return <line key={z} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={GATE_C} strokeWidth={2.4} strokeLinecap="round" />
            })}
          </g>
          {wall(PLOT.w - WALL_T, 0, WALL_T, GATE.y1 - 0.12)}
          <Box x={PLOT.w - 0.2} y={GATE.y1 - 0.24} w={0.24} d={0.24} h={1.25} color={shade(GATE_C, 0.25)} />
        </g>
        {/* the entry-rules board on its posts beside the path */}
        <g style={opA}>
          <Box x={SIGN.x + 0.06} y={SIGN.y} w={0.08} d={0.08} h={0.75} color={ISO.slate} />
          <Box x={SIGN.x + SIGN.w - 0.14} y={SIGN.y} w={0.08} d={0.08} h={0.75} color={ISO.slate} />
          <Box x={SIGN.x} y={SIGN.y + 0.06} z={0.55} w={SIGN.w} d={0.05} h={0.55} color="#fff" tone={{ line: AMBER_DK }} onLeft={<BoardFace fw={SIGN.w * SU} fh={0.55 * SU} />} />
        </g>
        {inYard && student}
        <g style={opA}>
          <Box x={PLOT.w - 0.2} y={GATE.y2} w={0.24} d={0.24} h={1.25} color={shade(GATE_C, 0.25)} />
          <Box x={PLOT.w - 0.14} y={GATE.y1 - 0.24} z={1.2} w={0.12} d={GATE.y2 - GATE.y1 + 0.48} h={0.14} color={GATE_C} />
          {wall(PLOT.w - WALL_T, GATE.y2 + 0.24, WALL_T, PLOT.d - GATE.y2 - 0.24)}
          {wall(0, PLOT.d - WALL_T, PLOT.w, WALL_T)}
        </g>
        <g style={opN}>
          <Tree x={0.95} y={4.35} r={0.58} />
        </g>
      </IsoSvg>

      {/* the ID shown at the board, and the board's tick */}
      <IsoAt x={st.at[0]} y={st.at[1]} z={1.25} dy={-34}>
        <span className="block" style={{ opacity: st.id ? 1 : 0, transform: st.id ? 'none' : 'translateY(6px)', transition: 'all 260ms cubic-bezier(0.22,1,0.36,1)' }}>
          <Badge on size={26} ring={AMBER_DK}>
            <IdCard size={14} color={AMBER_DK} aria-hidden />
          </Badge>
        </span>
      </IsoAt>
      <IsoAt x={SIGN.x + SIGN.w} y={SIGN.y} z={1.15} dx={4} dy={-6}>
        <span className="block" style={opA}>
          <Badge on={st.tick} size={22} ring={GREEN} tone={GREEN}>
            <Check size={13} color="#fff" strokeWidth={3.4} aria-hidden />
          </Badge>
        </span>
      </IsoAt>

      {/* the tags, in the TR's words, each by the thing it names */}
      <div style={opA}>
        <IsoAt x={PLOT.w + 0.1} y={GATE.y2 + 0.45} z={0.1} dx={6} dy={-2} cx={false}>
          <Tag lit={focus === 0} tone="warn">Gates</Tag>
        </IsoAt>
        <IsoAt x={SIGN.x + SIGN.w / 2 - 0.2} y={SIGN.y} z={1.15} dy={-34}>
          <Tag lit={focus === 0} tone="warn">Entry Rules</Tag>
        </IsoAt>
        <IsoAt x={ROAD.x2 - 0.5} y={GATE.y2} dy={16}>
          <Tag lit={focus === 0} tone="warn">Who Can Enter</Tag>
        </IsoAt>
      </div>
      <div style={opB}>
        <IsoAt x={BLD.x} y={CORR.y + CORR.d} z={STOREY + 0.2} dx={-6} cx={false} style={{ transform: 'translateX(-100%)' }}>
          <Tag lit={focus === 1} tone="good">Corridors</Tag>
        </IsoAt>
        <IsoAt x={2.6} y={0.6} z={2 * STOREY + 1.0} dy={-40}>
          <Tag lit={focus === 1} tone="good">Which Rooms They Can Access</Tag>
        </IsoAt>
        <IsoAt x={3.1} y={3.85} dy={-4}>
          <Tag lit={focus === 1} tone="good">Where They Can Go</Tag>
        </IsoAt>
      </div>
    </IsoScene>
  )
}

/* ------------------------------------------------------------------ the cloud side, matched part for part */

const BN = { x: 150, y: 40, w: 300, h: 336 }
const USER = { cx: 74, cy: 140 }
const GATEPT = { cx: BN.x, cy: 140 }
const R1 = { cx: 392, cy: 140 }
const R2 = { cx: 236, cy: 284 }
const R3 = { cx: 392, cy: 284 }
const SRV = 58

/** A server render with its status lights; `ping` ripples it when traffic arrives. */
function Server({ at, ping, tone }: { at: { cx: number; cy: number }; ping: boolean; tone: string }) {
  return (
    <>
      {ping && !STILL && <span aria-hidden className="ov-ring pointer-events-none absolute rounded-full" style={{ left: at.cx - 36, top: at.cy - 36, width: 72, height: 72, border: `2.5px solid ${tone}` }} />}
      <At x={at.cx} y={at.cy} cx cy>
        <span className="relative block">
          <Icon3D name="server-stack" w={SRV} shadow={false} />
        </span>
      </At>
    </>
  )
}

function CloudScene({ pair, u }: { pair: number; u: number }) {
  const focus = STILL ? -1 : pair <= 1 ? pair : -1
  const opA = focusOp(focus < 0 || focus === 0)
  const opB = focusOp(focus < 0 || focus === 1)
  /* A: the packet rides to the checkpoint (0.05-0.36), is checked (0.36-0.5), rides on to the first server (0.5-0.84) */
  const a1 = seg(u, 0.05, 0.36)
  const a2 = seg(u, 0.5, 0.84)
  const pktA = a2 > 0 ? along([[GATEPT.cx, GATEPT.cy], [R1.cx - SRV / 2 - 6, R1.cy]], a2) : along([[USER.cx + 34, USER.cy], [GATEPT.cx - 14, GATEPT.cy]], a1)
  const showA = focus === 0 && u > 0.04 && u < 0.88
  /* B: one packet reaches the second server (0.05-0.6); another is stopped before the third (0.12-0.42) */
  const b1 = seg(u, 0.05, 0.6)
  const b2 = seg(u, 0.12, 0.42)
  const pktB = along([[R1.cx - 22, R1.cy + 30], [R2.cx + 22, R2.cy - 30]], b1)
  const pktX = along([[R3.cx, R1.cy + 34], [R3.cx, 200]], b2)
  const stopped = focus === 1 && u > 0.42 && u < 0.85
  return (
    <>
      <At x={BN.x} y={BN.y}>
        <Boundary w={BN.w} h={BN.h} label="Cloud Networking" />
      </At>
      {/* A, amber: the user outside, the checkpoint on the boundary, the line in to the first server */}
      <div style={opA}>
        <At x={USER.cx} y={USER.cy} cx cy>
          <Icon3D name="boy-laptop" w={92} shadow={false} />
        </At>
        <Arrow x1={USER.cx + 40} y1={USER.cy} x2={R1.cx - SRV / 2 - 4} y2={R1.cy} tone={AMBER} />
        <At x={BN.x + BN.w / 2} y={BN.y + 34} cx cy>
          <Tag lit={focus === 0} tone="warn">How Traffic Reaches Cloud Resources</Tag>
        </At>
      </div>
      {/* the checkpoint sits OVER the line (review: the arrow passes behind the shield): its own layer above the arrows, an opaque disc */}
      <At x={GATEPT.cx} y={GATEPT.cy} cx cy style={{ zIndex: 6 }}>
        <span className="relative grid place-items-center rounded-full" style={{ width: 40, height: 40, background: '#fff', boxShadow: `inset 0 0 0 2.5px ${AMBER}, 0 8px 18px -10px rgba(16,32,58,0.5)`, color: AMBER_DK }}>
          <span className="grid place-items-center" style={opA}>
            <ShieldCheck size={22} strokeWidth={2.2} aria-hidden />
          </span>
          <span className="absolute" style={{ right: -8, top: -8 }}>
            <Badge on={focus !== 0 || u > 0.4} size={20} ring={GREEN} tone={GREEN}>
              <Check size={12} color="#fff" strokeWidth={3.4} aria-hidden />
            </Badge>
          </span>
        </span>
      </At>
      {/* B, green: from the first server on to the second; red: stopped before the third */}
      <div style={opB}>
        <Arrow x1={R1.cx - 26} y1={R1.cy + 34} x2={R2.cx + 19} y2={R2.cy - 27} tone={GREEN} />
        <Arrow x1={R3.cx} y1={R1.cy + 36} x2={R3.cx} y2={212} tone={NET.blocked} />
        <At x={R3.cx} y={226} cx cy>
          <span className={`block ${run(stopped, 'ov-shake') ?? ''}`}>
            <NoMark size={26} />
          </span>
        </At>
        <Server at={R2} ping={focus === 1 && u > 0.6 && u < 0.95} tone={GREEN} />
        <Server at={R3} ping={false} tone={NET.blocked} />
        <At x={BN.x + BN.w / 2} y={BN.y + BN.h - 24} cx cy>
          <Tag lit={focus === 1} tone="good">Which Resources It Can Access</Tag>
        </At>
      </div>
      <Server at={R1} ping={focus === 0 && u > 0.84} tone={AMBER} />
      {showA && <Dot at={pktA} tone={AMBER} size={14} />}
      {focus === 1 && u > 0.04 && u < 0.64 && <Dot at={pktB} tone={GREEN} size={14} />}
      {focus === 1 && u > 0.11 && u < 0.46 && <Dot at={pktX} tone={NET.blocked} size={13} />}
    </>
  )
}

/**
 * ONE clock for both pictures (one step track): 0 the whole picture (what the stage enters with, so the
 * gate pair never plays unseen behind the entrance with auto animation off), 1 the gate pair, 2 the
 * corridor pair, 3 the whole picture at rest. Auto: it loops; off: one press per pair, then the rest.
 */
function useSchoolPair() {
  const instant = useInstant()
  const auto = useAutoAnim()
  const held = STILL || REDUCED || instant
  /* one state lasts exactly one phase (PHASE ms after SPEED), so each pair starts the moment the last one ends */
  const k = useCycle(4, PHASE / SPEED, 3, 3)
  if (held) return 2
  /* auto ON (round 3, 5.md: "loop continuously, the next cycle immediately"): the gate pair and the corridor pair
     alternate with no rest beat; auto OFF keeps the four presses: whole picture, gate pair, corridor pair, rest */
  if (auto) return k % 2
  return k === 0 ? 2 : k - 1
}
const PHASE = 3400

export function SchoolAnalogy({ lesson }: { lesson: string }) {
  const pair = useSchoolPair()
  const u = usePhase(pair, PHASE)
  return (
    <IsoAnalogy
      id="T01-AN"
      kicker="Deployment Boundary"
      title="A School's Gates, Corridors and Entry Rules"
      lesson={lesson}
      bare
      h={AN_H}
      everyday={{ label: "A School's Gates, Corridors and Entry Rules", scene: <SchoolScene pair={pair} u={u} /> }}
      cloud={{ label: 'Cloud networking controls traffic to resources', scene: <CloudScene pair={pair} u={u} /> }}
    />
  )
}
