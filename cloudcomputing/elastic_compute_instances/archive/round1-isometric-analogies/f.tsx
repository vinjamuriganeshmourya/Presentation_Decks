import { useEffect, useState, type ReactNode } from 'react'
import { animate } from 'framer-motion'
import { colors } from '@/design/tokens'
import { MOTION, motionHeld } from '@/motion/tokens'
import { useInstant } from '@/motion/instant'
import { SPEED } from '@/deck/autoAnim'
import { At, Label, Num, type LabelTone } from '@/decks/figures/scene'
import { Box, ISO, IsoScene, IsoSvg, P, Quad, Shadow, measure, along, pts, shade } from '@/decks/figures/iso/iso'
import pMan from './ppl/man.png'
import pMansuit from './ppl/mansuit.png'
import pReception from './ppl/reception.png'
import pWoman from './ppl/woman.png'
import pVisitor from './ppl/visitor.png'
import pTeacher from './ppl/teacher.png'
import pTabwoman from './ppl/tabwoman.png'
import pSuit from './ppl/suit.png'
import pDoctor from './ppl/doctor.png'
import pBoy from './ppl/boy.png'
import mEc2 from '../images/aws-ec2.svg'
import mInstance from '../images/aws-ec2-instance.svg'

/**
 * BUILDER F · FOUR ANALOGY SLIDES OF "ELASTIC COMPUTE INSTANCES" (Session 9, 2026-11-10), in Session 7's analogy
 * look (`block_file_and_object_storage/custom/f.tsx`): one camera, one grid unit, one 5.2 x 4 floor; the everyday
 * stage a real place furnished with real props and Character Lab 3D people, the concept stage the same place as a
 * data-centre room with the official AWS marks on white tiles where the everyday parts stand.
 *
 *   T01  a house drawing electricity from the utility grid (pole, wires, a lamp switched on, the meter) ↔ an EC2
 *        instance drawing compute capacity, its billing meter running only while it is Running
 *   T06  a family sedan car between a sports car (the fastest) and a big-boot van (the biggest boot) ↔ a
 *        general-purpose instance between a CPU-heavy and a memory-heavy instance
 *   T09  an exam hall: many invigilators checking answer sheets at once, one teacher checking a stack one by one ↔
 *        a GPU's many cores processing data blocks at once, a CPU working through them one by one
 *   T12  a bakery: one worker at a counter, its counter space, three workers comfortable at a long counter and
 *        crowded at a short one ↔ vCPUs on an instance's memory
 *
 * LABELS (course R3 "Lighter labels"): no tags along the top; each kept tag carries a number badge, the same number
 * on the everyday tag and its concept tag, with a thin leader to the part. Words are the TR's, Title Case (rule 56).
 * MOTION: tags reveal pair by pair on the layout's one build track (step 0..3), the same press on both stages; a
 * press may start ONE one-shot motion (framer `animate` on the shared `MOTION` tokens). Nothing loops. Held frames
 * (`?still`, thumbnails, reduced motion) show the end state at once. Clean plate, no grid lines (rule 59).
 */

/* ------------------------------------------------------------------ shared values */

const SW = 470
const SH = 390
const UU = 42
const K = UU / 38
const REVEAL_MS = MOTION.reveal
const EASE = MOTION.ease
const ONCE = { flow: MOTION.flow.dur * 1000, slow: MOTION.flow.slow * 1000, pop: MOTION.reveal * 1.6 }
const EASE_ARR = MOTION.ease.replace(/[^0-9.,]/g, '').split(',').map(Number) as [number, number, number, number]

const R = { W: 5.2, D: 4.0, H: 2.3 } as const
const O = { ox: 212, oy: 104 } as const
/** the three tag rows under a stage (stage px, chip top) */
const ROW = [292, 324, 356] as const

const PAL = {
  wall: '#F3F6FC',
  wallDc: '#E7EEFB',
  floor: '#E3E9F4',
  floorDc: '#D6E1F4',
  tileDc: '#CCD9F0',
  base: '#C9D3E6',
  wood: '#D9B48A',
  navy: '#22346E',
  rack: '#1F2E63',
  glass: '#CFE3FF',
  leaf: '#5DBB7A',
  gold: '#F2C14E',
  grass: '#CFE6C4',
  grassDark: '#B9DBAA',
  road: '#9AA9BF',
  cream: '#F6EBDD',
  warm: '#FFE7A3',
  red: '#E8655A',
  pcb: '#1F6F5C',
  ram: '#2E8B6E',
} as const

function useHeld() {
  return motionHeld(useInstant())
}

function useTr(ms = REVEAL_MS) {
  const instant = useInstant()
  return (p: string) => (instant ? 'none' : `${p} ${ms}ms ${EASE}`)
}

/** a one-shot progress 0..1 that starts when `on` turns true and stays at 1; the end state at once when held */
function useOnce(on: boolean, ms: number, ease: [number, number, number, number] | 'linear' = EASE_ARR) {
  const held = useHeld()
  const [k, setK] = useState(0)
  useEffect(() => {
    if (!on) {
      setK(0)
      return
    }
    if (held) {
      setK(1)
      return
    }
    const c = animate(0, 1, { duration: (ms * SPEED) / 1000, ease, onUpdate: setK })
    return () => c.stop()
  }, [on, held, ms, ease])
  return !on ? 0 : held ? 1 : k
}

const clamp = (k: number) => Math.min(1, Math.max(0, k))
const sm = (k: number) => {
  const c = clamp(k)
  return c * c * (3 - 2 * c)
}

type G3 = [number, number, number]
/** grid point to scene-svg px */
const sv = (x: number, y: number, z = 0): [number, number] => P(x, y, z, UU)
/** grid point to stage px (a tag's leader target) */
const st = (x: number, y: number, z = 0): [number, number] => {
  const [a, b] = P(x, y, z, UU)
  return [a + O.ox, b + O.oy]
}

const SPR = {
  man: [pMan, 126 / 220],
  mansuit: [pMansuit, 134 / 220],
  reception: [pReception, 127 / 220],
  woman: [pWoman, 128 / 220],
  visitor: [pVisitor, 125 / 220],
  teacher: [pTeacher, 126 / 220],
  tabwoman: [pTabwoman, 118 / 220],
  suit: [pSuit, 144 / 220],
  doctor: [pDoctor, 103 / 220],
  boy: [pBoy, 131 / 220],
} as const
type SprKey = keyof typeof SPR

/** a person standing on grid (x, y, z): bottom centre on that point, `h` px tall, a soft contact shadow */
function Spr({ k, x, y, z = 0, h, op = 1, flip = false }: { k: SprKey; x: number; y: number; z?: number; h: number; op?: number; flip?: boolean }) {
  const tr = useTr()
  const [px, py] = sv(x, y, z)
  const [src, ar] = SPR[k]
  h = h * K
  const w = h * ar
  return (
    <g style={{ opacity: op, transition: tr('opacity') }}>
      <ellipse cx={px} cy={py - 1} rx={w * 0.34} ry={w * 0.1} fill={ISO.slate} opacity={0.2} />
      <image href={src} x={px - w / 2} y={py - h} width={w} height={h} preserveAspectRatio="xMidYMax meet" transform={flip ? `translate(${px * 2} 0) scale(-1 1)` : undefined} style={{ filter: 'drop-shadow(0 4px 3px rgba(16,32,58,0.18))' }} />
    </g>
  )
}

/** an official AWS mark (rule 54) on its white tile, standing upright on grid (x, y, z) */
function Mark({ src, x, y, z = 0, h, ring, op = 1 }: { src: string; x: number; y: number; z?: number; h: number; ring?: string; op?: number }) {
  const tr = useTr()
  const [px, py] = sv(x, y, z)
  h = h * K
  const m = h * 0.76
  return (
    <g style={{ opacity: op, transition: tr('opacity') }}>
      <ellipse cx={px} cy={py - 1} rx={h * 0.5} ry={h * 0.15} fill={ISO.slate} opacity={0.2} />
      <rect x={px - h / 2} y={py - h - 4} width={h} height={h} rx={h * 0.27} fill={colors.white} stroke={ring ?? '#D5E0F2'} strokeWidth={ring ? 2.5 : 1} style={{ filter: 'drop-shadow(0 5px 4px rgba(16,32,58,0.2))', transition: tr('stroke') }} />
      <image href={src} x={px - m / 2} y={py - h - 4 + (h - m) / 2} width={m} height={m} preserveAspectRatio="xMidYMid meet" />
    </g>
  )
}

/**
 * A LINKED TAG: TR words in a chip with its link number, centred on `x`, top at `y` (stage px), and thin leaders
 * to the parts it names (`to`, one point or several), each ending in a small dot.
 */
function Tag({ n, x, y, to, on = true, tone = 'plain', children }: { n?: number; x: number; y: number; to?: [number, number] | [number, number][]; on?: boolean; tone?: LabelTone; children: ReactNode }) {
  const tr = useTr()
  /* keep the whole chip inside the stage: its width estimated from the words (14px semibold) plus the badge */
  const est = (typeof children === 'string' ? children.length * 7.7 + 26 : 160) + (n !== undefined ? 26 : 0)
  x = Math.min(SW - 10 - est / 2, Math.max(10 + est / 2, x))
  const ink = tone === 'bad' ? colors.danger : tone === 'good' ? colors.success : colors.brand
  const list: [number, number][] = !to ? [] : Array.isArray(to[0]) ? (to as [number, number][]) : [to as [number, number]]
  return (
    <>
      {list.length > 0 && (
        <svg className="pointer-events-none absolute inset-0 overflow-visible" width={SW} height={SH} aria-hidden style={{ opacity: on ? 1 : 0, transition: tr('opacity'), zIndex: 1 }}>
          {list.map(([tx, ty], i) => (
            <g key={i}>
              <line x1={x} y1={y + 12} x2={tx} y2={ty} stroke={ink} strokeWidth={1.4} strokeLinecap="round" opacity={0.75} />
              <circle cx={tx} cy={ty} r={4} fill={ink} stroke={colors.white} strokeWidth={1.6} />
            </g>
          ))}
        </svg>
      )}
      <At x={x} y={y} cx style={{ zIndex: 2 }}>
        <span className="flex items-center gap-1" style={{ opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(6px)', transition: `${tr('opacity')}, ${tr('transform')}` }}>
          {n !== undefined && (
            <span className="block rounded-full" style={{ boxShadow: `0 0 0 2px ${colors.white}, 0 6px 12px -8px rgba(16,32,58,0.45)` }}>
              <Num n={n} size={22} />
            </span>
          )}
          <Label size={14} strong tone={tone} raised>
            {children}
          </Label>
        </span>
      </At>
    </>
  )
}

function Cross({ x, y, on = true, r = 10 }: { x: number; y: number; on?: boolean; r?: number }) {
  const tr = useTr()
  return (
    <g style={{ opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transformOrigin: `${x}px ${y}px`, transition: `${tr('opacity')}, ${tr('transform')}` }}>
      <circle cx={x} cy={y} r={r + 3} fill={colors.danger} opacity={0.18} />
      <circle cx={x} cy={y} r={r} fill={colors.danger} stroke={colors.white} strokeWidth={2} />
      <path d={`M${x - r * 0.4} ${y - r * 0.4} L${x + r * 0.4} ${y + r * 0.4} M${x + r * 0.4} ${y - r * 0.4} L${x - r * 0.4} ${y + r * 0.4}`} stroke={colors.white} strokeWidth={2.4} strokeLinecap="round" />
    </g>
  )
}

function Tick({ x, y, on = true, r = 10 }: { x: number; y: number; on?: boolean; r?: number }) {
  const tr = useTr()
  return (
    <g style={{ opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transformOrigin: `${x}px ${y}px`, transition: `${tr('opacity')}, ${tr('transform')}` }}>
      <circle cx={x} cy={y} r={r + 3} fill={colors.success} opacity={0.18} />
      <circle cx={x} cy={y} r={r} fill={colors.success} stroke={colors.white} strokeWidth={2} />
      <path d={`M${x - r * 0.45} ${y + r * 0.02} L${x - r * 0.1} ${y + r * 0.38} L${x + r * 0.48} ${y - r * 0.34}`} fill="none" stroke={colors.white} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

/** a soft highlight on the part this press names: fades in on its press and out on the next, no loop */
function Halo({ x, y, r, on, color = colors.brand }: { x: number; y: number; r: number; on: boolean; color?: string }) {
  const tr = useTr()
  return (
    <g style={{ opacity: on ? 1 : 0, transition: tr('opacity') }}>
      <circle cx={x} cy={y} r={r} fill={color} opacity={0.1} />
      <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={1.6} opacity={0.45} />
    </g>
  )
}

/** a 3D polyline (grid points with height) as screen px */
const line3 = (q: G3[]) => q.map(([x, y, z]) => sv(x, y, z))

/** a dot riding a screen polyline once at phase t, fading at both ends */
function Ride({ q, t, color = colors.brand, r = 4, on = true }: { q: [number, number][]; t: number; color?: string; r?: number; on?: boolean }) {
  const { seg, len } = measure(q)
  const tt = clamp(t)
  const [hx, hy] = along(q, seg, tt * len)
  const [tx, ty] = along(q, seg, Math.max(0, tt * len - 12))
  const edge = Math.min(1, Math.min(tt, 1 - tt) / 0.08)
  return (
    <g opacity={on && tt > 0 && tt < 1 ? edge : 0}>
      <line x1={tx} y1={ty} x2={hx} y2={hy} stroke={color} strokeWidth={r * 0.9} strokeLinecap="round" opacity={0.35} />
      <circle cx={hx} cy={hy} r={r} fill={color} stroke={colors.white} strokeWidth={1.4} />
    </g>
  )
}

/* ------------------------------------------------------------------ the shells */

/** THE ROOM: a floor and two back walls, as in Session 7; `a` decorates wall A (along x), `b` wall B (along y) */
function Room({ dc, a, b, floor }: { dc: boolean; a?: ReactNode; b?: ReactNode; floor?: ReactNode }) {
  const wall = dc ? PAL.wallDc : PAL.wall
  const T = 0.16
  const tiles: ReactNode[] = []
  if (dc) {
    for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) if ((i + j) % 2) tiles.push(<Quad key={`${i}-${j}`} x={i * (R.W / 6)} y={j * (R.D / 5)} w={R.W / 6} d={R.D / 5} fill={PAL.tileDc} opacity={0.55} />)
  }
  const band = (len: number) =>
    dc ? (
      <g>
        <rect x={0} y={0.18 * UU} width={len} height={0.08 * UU} fill={colors.brand} opacity={0.55} />
        <rect x={0} y={R.H * UU - 0.12 * UU} width={len} height={0.12 * UU} fill={shade(colors.brand, 0.1)} opacity={0.8} />
      </g>
    ) : (
      <rect x={0} y={R.H * UU - 0.12 * UU} width={len} height={0.12 * UU} fill={PAL.base} />
    )
  return (
    <g>
      <Quad x={0} y={0} w={R.W} d={R.D} fill={dc ? PAL.floorDc : PAL.floor} />
      {tiles}
      {floor}
      <Box x={0} y={-T} w={R.W} d={T} h={R.H} color={wall} tone={{ left: wall, top: shade(wall, -0.06) }} onLeft={<g>{band(R.W * UU)}{a}</g>} />
      <Box x={-T} y={0} w={T} d={R.D} h={R.H} color={wall} tone={{ right: shade(wall, -0.05), top: shade(wall, -0.06), left: shade(wall, -0.12) }} onRight={<g>{band(R.D * UU)}{b}</g>} />
    </g>
  )
}

/** OUTDOORS: a grass plot with a soft rim (the room's footprint, no walls) */
function Ground({ children }: { children?: ReactNode }) {
  return (
    <g>
      <Box x={0} y={0} z={-0.14} w={R.W} d={R.D} h={0.14} color={PAL.grass} tone={{ top: PAL.grass, left: shade(PAL.grassDark, -0.05), right: shade(PAL.grassDark, -0.15) }} stroke={false} />
      {children}
    </g>
  )
}

const WindowFace = ({ a, b, w, h, sky = true }: { a: number; b: number; w: number; h: number; sky?: boolean }) => (
  <g>
    <rect x={a - 4} y={b - 4} width={w + 8} height={h + 8} rx={3} fill={colors.white} stroke={PAL.base} strokeWidth={1} />
    <rect x={a} y={b} width={w} height={h} rx={2} fill={PAL.glass} />
    {sky && <path d={`M${a} ${b + h * 0.7} L${a + w * 0.45} ${b + h * 0.35} L${a + w * 0.7} ${b + h * 0.55} L${a + w} ${b + h * 0.3} L${a + w} ${b + h} L${a} ${b + h} Z`} fill="#B5D3F8" />}
    <rect x={a + w / 2 - 1.5} y={b} width={3} height={h} fill={colors.white} />
    <rect x={a} y={b + h / 2 - 1.5} width={w} height={3} fill={colors.white} />
  </g>
)

const WallClock = ({ a, b }: { a: number; b: number }) => (
  <g>
    <circle cx={a} cy={b} r={11} fill={colors.white} stroke={PAL.navy} strokeWidth={2} />
    <path d={`M${a} ${b} v-7 M${a} ${b} h5`} stroke={PAL.navy} strokeWidth={1.6} strokeLinecap="round" />
  </g>
)

function Rack({ x, y = 0, w = 0.9, d = 0.6, h = 2.0, lit = false }: { x: number; y?: number; w?: number; d?: number; h?: number; lit?: boolean }) {
  const rows = Math.floor((h * UU - 12) / 12)
  return (
    <g>
      <Shadow x={x} y={y} w={w} d={d} />
      <Box
        x={x}
        y={y}
        w={w}
        d={d}
        h={h}
        color={PAL.rack}
        onLeft={
          <g>
            {Array.from({ length: rows }, (_, r) => (
              <g key={r}>
                <rect x={4} y={6 + r * 12} width={w * UU - 8} height={8} rx={1.5} fill={shade(PAL.rack, 0.18)} />
                <circle cx={9} cy={10 + r * 12} r={1.6} fill={lit || r % 3 ? ISO.green : colors.brand} />
              </g>
            ))}
          </g>
        }
        onRight={
          <g>
            {Array.from({ length: 6 }, (_, r) => (
              <rect key={r} x={4} y={10 + r * 10} width={d * UU - 8} height={3} rx={1.5} fill={shade(PAL.rack, -0.2)} />
            ))}
          </g>
        }
      />
    </g>
  )
}

function CableTray() {
  return (
    <g>
      <Box x={0} y={0.15} w={0.42} d={R.D - 0.3} z={R.H - 0.42} h={0.1} color={shade(ISO.steel, 0.25)} />
      {[0, 1, 2].map((i) => {
        const c = [colors.brand, colors.teal, PAL.gold][i]
        const [ax, ay] = sv(0.1 + i * 0.1, 0.2, R.H - 0.3)
        const [bx, by] = sv(0.1 + i * 0.1, R.D - 0.2, R.H - 0.3)
        return <line key={i} x1={ax} y1={ay} x2={bx} y2={by} stroke={c} strokeWidth={2} strokeLinecap="round" opacity={0.85} />
      })}
    </g>
  )
}

function Cooler({ y, d = 1.1, h = 1.6 }: { y: number; d?: number; h?: number }) {
  return (
    <g>
      <Shadow x={0} y={y} w={0.5} d={d} />
      <Box
        x={0}
        y={y}
        w={0.5}
        d={d}
        h={h}
        color="#E9EEF8"
        onRight={
          <g>
            {Array.from({ length: 7 }, (_, r) => (
              <rect key={r} x={6} y={10 + r * 7} width={d * UU - 12} height={3} rx={1.5} fill={PAL.base} />
            ))}
          </g>
        }
      />
    </g>
  )
}

/** a round tree on the grass (grid) */
function Tree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const [px, py] = sv(x, y, 0)
  return (
    <g>
      <ellipse cx={px} cy={py} rx={16 * s} ry={6 * s} fill={ISO.slate} opacity={0.16} />
      <rect x={px - 3 * s} y={py - 30 * s} width={6 * s} height={30 * s} rx={2} fill={shade(PAL.wood, -0.35)} />
      {[
        [0, -46, 20],
        [-13, -36, 14],
        [13, -36, 14],
        [0, -62, 13],
      ].map(([dx, dy, r], i) => (
        <circle key={i} cx={px + dx * s} cy={py + dy * s} r={r * s} fill={i % 2 ? shade(PAL.leaf, -0.12) : PAL.leaf} />
      ))}
    </g>
  )
}

function Plant({ x, y }: { x: number; y: number }) {
  const [px, py] = sv(x, y, 0.55)
  return (
    <g>
      <Shadow x={x - 0.2} y={y - 0.2} w={0.4} d={0.4} />
      <Box x={x - 0.18} y={y - 0.18} w={0.36} d={0.36} h={0.5} color="#E9EEF8" />
      {[
        [-10, -14, 12],
        [8, -18, 11],
        [-2, -30, 13],
        [12, -34, 9],
        [-12, -36, 9],
      ].map(([dx, dy, r], i) => (
        <circle key={i} cx={px + dx} cy={py + dy} r={r} fill={i % 2 ? shade(PAL.leaf, -0.12) : PAL.leaf} />
      ))}
    </g>
  )
}

function Desk({ x, y, w, d, h, top = PAL.wood }: { x: number; y: number; w: number; d: number; h: number; top?: string }) {
  const legs: [number, number][] = [
    [x + 0.06, y + 0.06],
    [x + w - 0.12, y + 0.06],
    [x + 0.06, y + d - 0.12],
    [x + w - 0.12, y + d - 0.12],
  ]
  return (
    <g>
      <Shadow x={x} y={y} w={w} d={d} />
      {legs.map(([lx, ly], i) => (
        <Box key={i} x={lx} y={ly} w={0.06} d={0.06} h={h - 0.06} color={shade(ISO.slate, 0.15)} />
      ))}
      <Box x={x} y={y} z={h - 0.06} w={w} d={d} h={0.06} color={top} />
    </g>
  )
}

function Block({ x, y, w, d, h, color, dc = false, front }: { x: number; y: number; w: number; d: number; h: number; color: string; dc?: boolean; front?: ReactNode }) {
  return (
    <g>
      <Shadow x={x} y={y} w={w} d={d} />
      <Box
        x={x}
        y={y}
        w={w}
        d={d}
        h={h}
        color={color}
        onLeft={
          front ??
          (dc ? (
            <g>
              {[0.3, 0.6].map((k) => (
                <rect key={k} x={0.2 * UU} y={k * h * UU} width={Math.max(4, (w - 0.4) * UU)} height={3} rx={1.5} fill={shade(color, -0.18)} />
              ))}
            </g>
          ) : undefined)
        }
      />
    </g>
  )
}

function Scene({ children, tags }: { children: ReactNode; tags?: ReactNode }) {
  return (
    <IsoScene w={SW} h={SH} ox={O.ox} oy={O.oy} u={UU}>
      <IsoSvg>{children}</IsoSvg>
      {tags}
    </IsoScene>
  )
}

/* ================================================================== T01 · the utility grid */

/*
 * TR 1: "Similar to drawing electricity from a utility grid, compute capacity is used on demand and billed only for
 * the time it is consumed — just as an instance incurs compute charges only while it is running."
 * Everyday: a house on its plot; a utility pole with its transformer brings the grid's wires to the roof; through
 * the front window a lamp; on the side wall the electricity meter. Press 2: the lamp is switched on and electricity
 * rides the wire once; press 3: the meter's dial turns once, only now that the lamp is on.
 * Concept: the same plot as a data-centre room: racks of compute capacity where the pole stands, the EC2 instance
 * on its plinth where the house stands (Running once switched on), its billing meter where the house meter is.
 * Links: 1 Utility Grid / Compute Capacity; 2 Drawing Electricity / Used On Demand; 3 billed only for the time it is
 * consumed / compute charges only while it is running.
 */
const H1 = { x: 1.95, y: 0.7, w: 2.55, d: 1.8, h: 1.4 } as const
const POLE: G3 = [0.75, 0.75, 2.55]
const ATTACH: G3 = [H1.x + 0.15, H1.y + 0.4, H1.h + 0.32]

/** a sagging wire between two grid points (screen polyline) */
function wire(a: G3, b: G3, sag = 0.28, n = 10): [number, number][] {
  const q: [number, number][] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    q.push(sv(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t - sag * 4 * t * (1 - t)))
  }
  return q
}
const dpath = (q: [number, number][]) => q.map(([a, b], i) => `${i ? 'L' : 'M'}${a.toFixed(1)} ${b.toFixed(1)}`).join(' ')

function UtilityPole() {
  const [x, y, top] = POLE
  return (
    <g>
      <Shadow x={x - 0.08} y={y - 0.08} w={0.16} d={0.16} />
      <Box x={x - 0.06} y={y - 0.06} w={0.12} d={0.12} h={top} color={shade(PAL.wood, -0.3)} />
      <Box x={x - 0.42} y={y - 0.05} z={top - 0.18} w={0.84} d={0.1} h={0.08} color={shade(PAL.wood, -0.4)} />
      {[-0.36, 0, 0.36].map((dx) => (
        <Box key={dx} x={x + dx - 0.03} y={y - 0.03} z={top - 0.1} w={0.06} d={0.06} h={0.1} color={colors.white} />
      ))}
      {/* the transformer can */}
      <Box x={x + 0.06} y={y - 0.12} z={top - 0.9} w={0.22} d={0.24} h={0.38} color="#AAB7CA" />
    </g>
  )
}

/** the grid's wires from beyond the plot, to the pole, then down to the house */
const GRID_IN = [wire([-0.25, 2.1, 2.2], [POLE[0] - 0.36, POLE[1], POLE[2]], 0.2), wire([-0.25, 2.35, 2.2], [POLE[0] + 0.36, POLE[1], POLE[2]], 0.2)]
const SERVICE = wire([POLE[0], POLE[1], POLE[2] - 0.02], ATTACH, 0.25)

function Lamp({ on }: { on: boolean }) {
  /* drawn in the left face's px: a floor lamp inside the front window */
  const tr = useTr()
  return (
    <g>
      <rect x={0.38 * UU} y={0.4 * UU} width={0.86 * UU} height={0.6 * UU} rx={2} style={{ fill: on ? PAL.warm : '#C8D5EC', transition: tr('fill') }} />
      <circle cx={0.81 * UU} cy={0.58 * UU} r={14} fill="#FFF6D0" style={{ opacity: on ? 0.9 : 0, transition: tr('opacity') }} />
      <path d={`M${0.7 * UU} ${0.48 * UU} L${0.92 * UU} ${0.48 * UU} L${0.97 * UU} ${0.64 * UU} L${0.65 * UU} ${0.64 * UU} Z`} style={{ fill: on ? '#FFC94A' : '#E7D9B8', transition: tr('fill') }} />
      <rect x={0.8 * UU} y={0.64 * UU} width={2} height={0.34 * UU} fill={PAL.navy} />
      <rect x={0.38 * UU + 0.43 * UU - 1.5} y={0.4 * UU} width={3} height={0.6 * UU} fill={colors.white} opacity={0.9} />
      <rect x={0.38 * UU - 4} y={0.4 * UU - 4} width={0.86 * UU + 8} height={0.6 * UU + 8} rx={3} fill="none" stroke={colors.white} strokeWidth={4} />
    </g>
  )
}

/** a meter face (face px at a, b): a dial with a needle at angle `ang` (deg) and a usage bar filled to `fill` */
function MeterFace({ a, b, ang, fill, lit }: { a: number; b: number; ang: number; fill: number; lit: boolean }) {
  const cx = a + 13
  const cy = b + 15
  const r = Math.PI / 180
  return (
    <g>
      <rect x={a} y={b} width={26} height={34} rx={4} fill={colors.white} stroke={lit ? colors.brand : PAL.base} strokeWidth={lit ? 2 : 1} />
      <circle cx={cx} cy={cy} r={8} fill="#EEF3FD" stroke={PAL.navy} strokeWidth={1} />
      <line x1={cx} y1={cy} x2={cx + 6.5 * Math.cos((ang - 90) * r)} y2={cy + 6.5 * Math.sin((ang - 90) * r)} stroke={colors.accent} strokeWidth={1.8} strokeLinecap="round" />
      <rect x={a + 4} y={b + 27} width={18} height={3.5} rx={1.5} fill={PAL.base} />
      <rect x={a + 4} y={b + 27} width={18 * fill} height={3.5} rx={1.5} fill={colors.brand} />
    </g>
  )
}

function T01Everyday({ step }: { step: number }) {
  const on = step >= 2
  const t = useOnce(on, ONCE.flow)
  const k = useOnce(step >= 3, ONCE.slow)
  const pole = st(POLE[0], POLE[1], POLE[2] - 0.6)
  const lamp = st(H1.x + 0.8, H1.y + H1.d, H1.h - 0.7)
  const meter = st(H1.x + H1.w, H1.y + 1.25, H1.h - 0.72)
  const lampSv = sv(H1.x + 0.8, H1.y + H1.d, H1.h - 0.7)
  const meterSv = sv(H1.x + H1.w, H1.y + 1.25, H1.h - 0.75)
  const ridgeZ = H1.h + 0.7
  const ry = H1.y + H1.d / 2
  const roofBack = [sv(H1.x - 0.1, ry, ridgeZ), sv(H1.x + H1.w + 0.1, ry, ridgeZ), sv(H1.x + H1.w + 0.1, H1.y - 0.12, H1.h - 0.05), sv(H1.x - 0.1, H1.y - 0.12, H1.h - 0.05)]
  const roofFront = [sv(H1.x - 0.1, ry, ridgeZ), sv(H1.x + H1.w + 0.1, ry, ridgeZ), sv(H1.x + H1.w + 0.1, H1.y + H1.d + 0.12, H1.h - 0.05), sv(H1.x - 0.1, H1.y + H1.d + 0.12, H1.h - 0.05)]
  const gable = [sv(H1.x + H1.w, H1.y, H1.h), sv(H1.x + H1.w, H1.y + H1.d, H1.h), sv(H1.x + H1.w, ry, ridgeZ)]
  return (
    <Scene
      tags={
        <>
          <Tag n={1} x={90} y={ROW[0]} to={pole} on={step >= 1}>
            Utility Grid
          </Tag>
          <Tag n={2} x={190} y={ROW[1]} to={lamp} on={on}>
            Drawing Electricity
          </Tag>
          <Tag n={3} x={300} y={ROW[2]} to={meter} on={step >= 3}>
            Billed Only For The Time It Is Consumed
          </Tag>
        </>
      }
    >
      <Ground>
        {/* the street and the path to the door */}
        <Quad x={0} y={3.25} w={R.W} d={0.75} fill={PAL.road} />
        <Quad x={0} y={3.58} w={R.W} d={0.08} fill={colors.white} opacity={0.7} />
        <Quad x={H1.x + 1.45} y={H1.y + H1.d} w={0.45} d={3.25 - H1.y - H1.d} fill="#E9DFCF" />
      </Ground>
      <Tree x={0.5} y={2.6} s={0.9} />
      <Tree x={4.95} y={0.5} s={0.8} />
      {/* the grid comes in from beyond the plot */}
      {GRID_IN.map((q, i) => (
        <path key={i} d={dpath(q)} fill="none" stroke={PAL.navy} strokeWidth={1.4} opacity={0.75} />
      ))}
      <UtilityPole />
      {/* the house */}
      <Shadow x={H1.x} y={H1.y} w={H1.w} d={H1.d} grow={0.22} />
      <polygon points={pts(roofBack)} fill={shade(colors.brand, -0.1)} />
      <Box
        x={H1.x}
        y={H1.y}
        w={H1.w}
        d={H1.d}
        h={H1.h}
        color={PAL.cream}
        onLeft={
          <g>
            <Lamp on={on} />
            <rect x={1.45 * UU} y={0.42 * UU} width={0.45 * UU} height={H1.h * UU - 0.42 * UU} rx={2} fill={shade(PAL.wood, -0.15)} />
            <circle cx={1.82 * UU} cy={0.9 * UU} r={2.2} fill={PAL.gold} />
          </g>
        }
        onRight={
          <g>
            <g transform={`translate(${0.95 * UU} ${0.36 * UU}) scale(1.35)`}><MeterFace a={0} b={0} ang={-60 + 300 * sm(k)} fill={sm(k)} lit={step >= 3} /></g>
          </g>
        }
      />
      <polygon points={pts(gable)} fill={shade(PAL.cream, -0.2)} stroke={shade(PAL.cream, -0.45)} strokeWidth={0.75} />
      <polygon points={pts(roofFront)} fill={colors.brand} stroke={shade(colors.brand, -0.3)} strokeWidth={0.75} />
      {/* the service wire, pole to roof, and the electricity riding it once when the lamp is switched on */}
      <path d={dpath(SERVICE)} fill="none" stroke={PAL.navy} strokeWidth={1.6} />
      <Ride q={SERVICE} t={t} color={PAL.gold} r={4} on={on} />
      <Halo x={sv(POLE[0], POLE[1], POLE[2] - 0.6)[0]} y={sv(POLE[0], POLE[1], POLE[2] - 0.6)[1]} r={34} on={step === 1} />
      <Halo x={lampSv[0]} y={lampSv[1]} r={28} on={step === 2} color={colors.accent} />
      <Halo x={meterSv[0]} y={meterSv[1]} r={24} on={step === 3} />
      {/* the homeowner on the path, turned to the house */}
      <Spr k="woman" x={1.45} y={2.95} h={104} />
    </Scene>
  )
}

function T01Concept({ step }: { step: number }) {
  const on = step >= 2
  const t = useOnce(on, ONCE.flow)
  const k = useOnce(step >= 3, ONCE.slow)
  const z = 0.5
  const ec2 = [H1.x + 1.05, H1.y + 0.95] as const
  const cable = line3([
    [1.75, 0.62, 0.03],
    [1.75, 1.6, 0.03],
    [1.97, 1.6, 0.03],
  ])
  const racks = st(1.0, 0.3, 1.6)
  const inst = st(ec2[0], ec2[1], z + 1.2)
  const meterPt = st(4.85, 1.75, 1.0)
  const mSv = sv(4.85, 1.75, 1.0)
  const iSv = sv(ec2[0], ec2[1], z + 0.7)
  return (
    <Scene
      tags={
        <>
          <Tag n={1} x={90} y={ROW[0]} to={racks} on={step >= 1} tone="brand">
            Compute Capacity
          </Tag>
          <Tag n={2} x={190} y={ROW[1]} to={inst} on={on} tone="brand">
            Used On Demand
          </Tag>
          <Tag n={3} x={300} y={ROW[2]} to={meterPt} on={step >= 3} tone="brand">
            Compute Charges Only While It Is Running
          </Tag>
        </>
      }
    >
      <Room dc />
      <CableTray />
      <Rack x={0.35} lit={step >= 1} />
      <Rack x={1.3} lit={step >= 1} />
      <Rack x={4.35} w={0.7} h={1.8} />
      <Cooler y={1.4} d={1.0} h={1.6} />
      <Block x={H1.x} y={H1.y + 0.35} w={2.1} d={1.2} h={z} color={shade(ISO.steel, 0.32)} dc />
      <path d={dpath(cable)} fill="none" stroke={colors.brand} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" opacity={on ? 1 : 0.25} style={{ transition: `opacity ${REVEAL_MS}ms ${EASE}` }} />
      <Ride q={cable} t={t} color={colors.brand} r={4} on={on} />
      <Mark src={mEc2} x={ec2[0]} y={ec2[1]} z={z} h={56} ring={on ? colors.brand : undefined} />
      {/* the billing meter: a standing panel where the house meter hangs */}
      <Shadow x={4.35} y={1.3} w={0.5} d={0.85} />
      <Box x={4.35} y={1.3} w={0.5} d={0.85} h={1.4} color="#EEF2FA" onRight={<g transform={`translate(${0.17 * UU} ${0.14 * UU}) scale(1.35)`}><MeterFace a={0} b={0} ang={-60 + 300 * sm(k)} fill={sm(k)} lit={step >= 3} /></g>} />
      <Halo x={sv(1.0, 0.3, 1.2)[0]} y={sv(1.0, 0.3, 1.2)[1]} r={46} on={step === 1} />
      <Halo x={iSv[0]} y={iSv[1]} r={36} on={step === 2} />
      <Halo x={mSv[0]} y={mSv[1]} r={26} on={step === 3} />
      <ChipAt x={ec2[0] + 0.55} y={ec2[1] + 1.35} z={z} on={on}>
        Running
      </ChipAt>
    </Scene>
  )
}

/** a status chip anchored to a grid point (inside the svg layer, as a foreignObject-free DOM chip via portal-less At) */
function ChipAt({ x, y, z = 0, on, children }: { x: number; y: number; z?: number; on: boolean; children: ReactNode }) {
  const [px, py] = sv(x, y, z)
  return (
    <foreignObject x={px - 50} y={py - 2} width={100} height={30} style={{ overflow: 'visible' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <ChipInner on={on}>{children}</ChipInner>
      </div>
    </foreignObject>
  )
}
function ChipInner({ on, children }: { on: boolean; children: ReactNode }) {
  const tr = useTr()
  return (
    <span style={{ opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(4px)', transition: `${tr('opacity')}, ${tr('transform')}`, display: 'inline-block' }}>
      <Label size={14} strong tone="good" raised>
        {children}
      </Label>
    </span>
  )
}

/* ================================================================== T06 · the family sedan car */

/*
 * TR 6: "A general-purpose instance is like a family sedan car — not the fastest, not the biggest boot, but
 * balanced for most everyday trips — just as it balances CPU and memory instead of maximising either."
 * Everyday: a supermarket car park on an everyday shopping trip; three cars in their bays, boots toward us: at the
 * back a tall van with a huge open boot full of suitcases (the biggest boot), in the middle the family sedan with a
 * mother and her son loading a shopping bag, in front a low red sports car (the fastest). Concept: the same park as a
 * data-centre room: three instances on plinths in the cars' bays, each with a CPU column and a Memory column: Memory
 * maximised (the van's bay), both balanced (the sedan's), CPU maximised (the sports car's). Links: 1 Family Sedan Car
 * / General-Purpose Instance; 2 Not The Fastest, Not The Biggest Boot / Instead Of Maximising Either (two leaders
 * each); 3 Balanced For Most Everyday Trips / Balances CPU And Memory.
 * Motion: press 3, the bag is lifted into the sedan's boot once; the balanced columns rise once.
 */
type CarSpec = { x: number; y: number; len: number; dep: number; body: number; cab: number; cabOff: number; cabLen: number; color: string; clear?: number }
/* three bays side by side along x, each car's length along y, nose into the bay, boot toward us (+y) */
const VAN: CarSpec = { x: 0.35, y: 0.35, len: 1.95, dep: 0.95, body: 1.0, cab: 0, cabOff: 0, cabLen: 0, color: '#E9EEF8', clear: 0.12 }
const SEDAN: CarSpec = { x: 1.75, y: 0.4, len: 1.95, dep: 0.85, body: 0.36, cab: 0.34, cabOff: 0.4, cabLen: 0.95, color: colors.brand, clear: 0.1 }
const SPORT: CarSpec = { x: 3.15, y: 0.5, len: 1.85, dep: 0.78, body: 0.25, cab: 0.2, cabOff: 0.6, cabLen: 0.7, color: PAL.red, clear: 0.07 }

function Wheel({ x, y, z, r = 9 }: { x: number; y: number; z: number; r?: number }) {
  const [px, py] = sv(x, y, z)
  return (
    <g>
      <ellipse cx={px} cy={py} rx={r * 0.62} ry={r} fill="#1E2A44" transform={`rotate(28 ${px} ${py})`} />
      <ellipse cx={px} cy={py} rx={r * 0.3} ry={r * 0.5} fill="#B9C4D6" transform={`rotate(28 ${px} ${py})`} />
    </g>
  )
}

/** a car along y, nose into its bay (-y), its boot on the +y face we see; `boot` draws the boot on that face */
function Car({ c, boot, open = false, speed = false }: { c: CarSpec; boot?: ReactNode; open?: boolean; speed?: boolean }) {
  const cl = c.clear ?? 0.1
  const glass = '#BFD6F6'
  const wheelR = c.body > 0.6 ? 12 : 10
  return (
    <g>
      <Shadow x={c.x} y={c.y} w={c.dep} d={c.len} grow={0.1} opacity={0.16} />
      <Box
        x={c.x}
        y={c.y}
        z={cl}
        w={c.dep}
        d={c.len}
        h={c.body}
        color={c.color}
        onRight={
          c.cab === 0 ? (
            <g>
              <rect x={0.15 * UU} y={0.1 * UU} width={0.55 * UU} height={0.36 * UU} rx={3} fill={glass} />
              <rect x={0.8 * UU} y={0.1 * UU} width={0.95 * UU} height={0.36 * UU} rx={3} fill={glass} />
              <rect x={0} y={c.body * UU - 8} width={c.len * UU} height={4} fill={shade(c.color, -0.2)} />
            </g>
          ) : (
            <rect x={0} y={c.body * UU * 0.45} width={c.len * UU} height={2.5} fill={shade(c.color, 0.35)} opacity={0.8} />
          )
        }
        onLeft={
          <g>
            <rect x={3} y={c.body * UU * 0.18} width={7} height={5} rx={1.5} fill="#E23B3B" />
            <rect x={c.dep * UU - 10} y={c.body * UU * 0.18} width={7} height={5} rx={1.5} fill="#E23B3B" />
            {boot}
          </g>
        }
      />
      {c.cab > 0 && (
        <Box
          x={c.x + 0.06}
          y={c.y + c.cabOff}
          z={cl + c.body}
          w={c.dep - 0.12}
          d={c.cabLen}
          h={c.cab}
          color={shade(c.color, 0.15)}
          onRight={<rect x={4} y={3} width={c.cabLen * UU - 8} height={c.cab * UU - 6} rx={3} fill={glass} />}
          onLeft={<rect x={3} y={3} width={(c.dep - 0.12) * UU - 6} height={c.cab * UU - 6} rx={3} fill={glass} />}
        />
      )}
      {c.cab === 0 && open && (
        <polygon
          points={pts([sv(c.x, c.y + c.len, cl + c.body), sv(c.x + c.dep, c.y + c.len, cl + c.body), sv(c.x + c.dep, c.y + c.len + 0.45, cl + c.body + 0.2), sv(c.x, c.y + c.len + 0.45, cl + c.body + 0.2)])}
          fill={shade(c.color, -0.08)}
          stroke={shade(c.color, -0.4)}
          strokeWidth={0.75}
        />
      )}
      <Wheel x={c.x + c.dep} y={c.y + 0.36} z={cl + 0.04} r={wheelR} />
      <Wheel x={c.x + c.dep} y={c.y + c.len - 0.38} z={cl + 0.04} r={wheelR} />
      {speed &&
        [0, 1, 2].map((i) => {
          const [ax, ay] = sv(c.x + 0.18 + i * 0.2, c.y + c.len + 0.12, cl + 0.12)
          const [bx, by] = sv(c.x + 0.18 + i * 0.2, c.y + c.len + 0.6 - i * 0.12, cl + 0.12)
          return <line key={i} x1={ax} y1={ay} x2={bx} y2={by} stroke={PAL.red} strokeWidth={2.2} strokeLinecap="round" opacity={0.5} />
        })}
    </g>
  )
}

/** suitcases filling the van's open boot (right face px) */
const VanLoad = ({ c }: { c: CarSpec }) => {
  const W = c.dep * UU
  const H = c.body * UU
  return (
    <g>
      <rect x={5} y={5} width={W - 10} height={H - 12} rx={3} fill="#33415F" />
      {[
        [0.08, 0.1, 0.38, 0.42, colors.accent],
        [0.5, 0.08, 0.42, 0.46, colors.brand],
        [0.08, 0.56, 0.5, 0.3, PAL.gold],
        [0.62, 0.58, 0.3, 0.28, colors.teal],
      ].map(([x, y, w, h, f], i) => (
        <rect key={i} x={5 + (x as number) * (W - 10)} y={5 + (y as number) * (H - 12)} width={(w as number) * (W - 10)} height={(h as number) * (H - 12)} rx={2.5} fill={f as string} />
      ))}
    </g>
  )
}

/** the sedan's modest boot (right face px): an open lid line and a dark opening */
const SedanBoot = ({ c }: { c: CarSpec }) => <rect x={8} y={c.body * UU * 0.38} width={c.dep * UU - 16} height={c.body * UU * 0.48} rx={2} fill="#2B3A5A" />

/** a supermarket front along wall B's line (x = 0), its door and windows facing the car park */
function Supermarket() {
  return (
    <Box
      x={0.1}
      y={-0.55}
      w={4.3}
      d={0.5}
      h={1.6}
      color="#F8E2C8"
      onLeft={
        <g>
          <rect x={0.2 * UU} y={0.18 * UU} width={3.9 * UU} height={0.26 * UU} rx={3} fill={colors.accent} />
          <rect x={0.25 * UU} y={0.62 * UU} width={1.1 * UU} height={0.75 * UU} rx={2} fill={PAL.glass} />
          <rect x={1.5 * UU} y={0.62 * UU} width={0.6 * UU} height={0.98 * UU} rx={2} fill={shade(PAL.glass, -0.1)} />
          <rect x={2.25 * UU} y={0.62 * UU} width={1.1 * UU} height={0.75 * UU} rx={2} fill={PAL.glass} />
          <rect x={3.5 * UU} y={0.62 * UU} width={0.6 * UU} height={0.75 * UU} rx={2} fill={PAL.glass} />
        </g>
      }
    />
  )
}

/** the car park: asphalt and white bay lines between the three bays */
function CarPark() {
  return (
    <Ground>
      <Quad x={0.05} y={0.05} w={4.4} d={3.6} fill={PAL.road} />
      {[1.48, 2.88].map((x) => (
        <Quad key={x} x={x} y={0.2} w={0.07} d={2.2} fill={colors.white} opacity={0.85} />
      ))}
    </Ground>
  )
}

function T06Everyday({ step }: { step: number }) {
  const k = useOnce(step >= 3, ONCE.pop * 2)
  const sedanPt = st(SEDAN.x + SEDAN.dep, SEDAN.y + 1.0, 0.3)
  const sportPt = st(SPORT.x + SPORT.dep, SPORT.y + 0.9, 0.2)
  const vanPt = st(VAN.x + 0.45, VAN.y + VAN.len, 0.75)
  const bootPt = st(SEDAN.x + 0.42, SEDAN.y + SEDAN.len, 0.28)
  /* the shopping bag: from the mother's hand into the boot, once */
  const from = sv(SEDAN.x + 1.0, SEDAN.y + SEDAN.len + 0.35, 0.62)
  const to = sv(SEDAN.x + 0.42, SEDAN.y + SEDAN.len + 0.02, 0.3)
  const e = sm(k)
  const bx = from[0] + (to[0] - from[0]) * e
  const by = from[1] + (to[1] - from[1]) * e - Math.sin(Math.PI * e) * 14
  const sedanSv = sv(SEDAN.x + 0.42, SEDAN.y + 1.0, 0.45)
  const spSv = sv(SPORT.x + 0.4, SPORT.y + 0.9, 0.25)
  const vnSv = sv(VAN.x + 0.45, VAN.y + 1.0, 0.6)
  return (
    <Scene
      tags={
        <>
          <Tag n={1} x={110} y={ROW[0]} to={sedanPt} on={step >= 1}>
            Family Sedan Car
          </Tag>
          <Tag n={2} x={235} y={ROW[1]} to={[vanPt, sportPt]} on={step >= 2}>
            Not The Fastest, Not The Biggest Boot
          </Tag>
          <Tag n={3} x={300} y={ROW[2]} to={bootPt} on={step >= 3}>
            Balanced For Most Everyday Trips
          </Tag>
        </>
      }
    >
      <CarPark />
      <Supermarket />
      <Tree x={4.95} y={0.9} s={0.85} />
      <Tree x={4.9} y={3.2} s={0.75} />
      <Car c={VAN} boot={<VanLoad c={VAN} />} open />
      <Car c={SEDAN} boot={<SedanBoot c={SEDAN} />} />
      <Car c={SPORT} speed />
      {/* the family at the sedan's boot, turned to it: the mother lifts the bag in, her son beside her */}
      <Spr k="woman" x={SEDAN.x + 1.15} y={SEDAN.y + SEDAN.len + 0.4} h={96} flip />
      <Spr k="boy" x={SEDAN.x + 1.65} y={SEDAN.y + SEDAN.len + 0.7} h={60} flip />
      <g>
        <rect x={bx - 8} y={by - 13} width={16} height={14} rx={2} fill={PAL.gold} stroke={shade(PAL.gold, -0.35)} strokeWidth={0.8} />
        <path d={`M${bx - 4.5} ${by - 13} q4.5 -8 9 0`} fill="none" stroke={shade(PAL.gold, -0.4)} strokeWidth={1.4} />
      </g>
      <Halo x={sedanSv[0]} y={sedanSv[1]} r={46} on={step === 1} />
      <Halo x={spSv[0]} y={spSv[1]} r={40} on={step === 2} color={colors.accent} />
      <Halo x={vnSv[0]} y={vnSv[1]} r={52} on={step === 2} color={colors.accent} />
    </Scene>
  )
}

/** an instance on a plinth in a car's bay: its mark, a CPU column and a Memory column (heights 0..1 of the max) */
function InstanceUnit({ c, cpu, mem, ring }: { c: CarSpec; cpu: number; mem: number; ring?: string }) {
  const z = 0.3
  const MAXH = 1.2
  return (
    <g>
      <Block x={c.x + 0.05} y={c.y} w={c.dep - 0.1} d={c.len} h={z} color={shade(ISO.steel, 0.32)} dc />
      <Box x={c.x + 0.12} y={c.y + 0.25} z={z} w={0.32} d={0.3} h={Math.max(0.02, MAXH * cpu)} color={colors.brand} />
      <Box x={c.x + c.dep - 0.44} y={c.y + 0.25} z={z} w={0.32} d={0.3} h={Math.max(0.02, MAXH * mem)} color={colors.teal} />
      <Mark src={mInstance} x={c.x + c.dep / 2} y={c.y + c.len - 0.45} z={z} h={36} ring={ring} />
    </g>
  )
}

function T06Concept({ step }: { step: number }) {
  const k = useOnce(step >= 3, ONCE.pop * 2)
  const bal = 0.42 + 0.16 * sm(k)
  const top = 0.3 + 1.3 * bal
  const genPt = st(SEDAN.x + SEDAN.dep / 2, SEDAN.y + SEDAN.len - 0.45, 0.75)
  const cpuPt = st(SPORT.x + 0.28, SPORT.y + 0.55, 1.2)
  const memPt = st(VAN.x + VAN.dep - 0.28, VAN.y + 0.55, 1.2)
  const balPt = st(SEDAN.x + SEDAN.dep / 2, SEDAN.y + 0.4, top - 0.1)
  const genSv = sv(SEDAN.x + SEDAN.dep / 2, SEDAN.y + SEDAN.len - 0.45, 0.7)
  const cpuLbl = st(SPORT.x + 0.28, SPORT.y + 0.4, 0.3 + 1.2)
  const memLbl = st(VAN.x + VAN.dep - 0.28, VAN.y + 0.4, 0.3 + 1.2)
  const tr = useTr()
  return (
    <Scene
      tags={
        <>
          <Tag n={1} x={110} y={ROW[0]} to={genPt} on={step >= 1} tone="brand">
            General-Purpose Instance
          </Tag>
          <Tag n={2} x={235} y={ROW[1]} to={[cpuPt, memPt]} on={step >= 2} tone="brand">
            Instead Of Maximising Either
          </Tag>
          <Tag n={3} x={300} y={ROW[2]} to={balPt} on={step >= 3} tone="brand">
            Balances CPU And Memory
          </Tag>
          {/* the column names, on the column each side instance maximises */}
          <At x={cpuLbl[0]} y={cpuLbl[1] - 34} cx style={{ zIndex: 2 }}>
            <span className="block" style={{ opacity: step >= 2 ? 1 : 0, transition: tr('opacity') }}>
              <Label size={14} strong tone="brand" raised>
                CPU
              </Label>
            </span>
          </At>
          <At x={memLbl[0]} y={memLbl[1] - 34} cx style={{ zIndex: 2 }}>
            <span className="block" style={{ opacity: step >= 2 ? 1 : 0, transition: tr('opacity') }}>
              <Label size={14} strong tone="brand" raised style={{ color: colors.tealDark, boxShadow: `inset 0 0 0 1.5px ${colors.teal}` }}>
                Memory
              </Label>
            </span>
          </At>
        </>
      }
    >
      <Room dc />
      <CableTray />
      <Rack x={4.3} w={0.75} h={1.8} />
      <InstanceUnit c={VAN} cpu={0.25} mem={1} />
      <InstanceUnit c={SEDAN} cpu={bal} mem={bal} ring={step >= 1 ? colors.brand : undefined} />
      <InstanceUnit c={SPORT} cpu={1} mem={0.25} />
      <Halo x={genSv[0]} y={genSv[1]} r={40} on={step === 1} />
    </Scene>
  )
}

/* ================================================================== T09 · the exam hall */

/*
 * TR 9: "A GPU is like an exam hall with hundreds of invigilators checking answer sheets at once, instead of one
 * teacher checking them one by one — just as thousands of GPU cores process data in parallel instead of a CPU
 * working sequentially."
 * Everyday: an exam hall (windows, a clock, a board): two rows of desks, an invigilator at every desk checking its
 * answer sheet; at the front right one teacher at her desk with a stack, checking sheets one by one onto a done pile.
 * Press 2: every sheet in the hall is ticked at the same moment. Press 3: three sheets move one by one.
 * Concept: the same hall as a data-centre room: a GPU board where the desks stand, a core on every desk's place,
 * every core's data block lit at once; a CPU chip where the teacher sits, working a queue of blocks one by one.
 * Links: 1 Hundreds Of Invigilators / Thousands Of GPU Cores; 2 Checking Answer Sheets At Once / Process Data In
 * Parallel; 3 One Teacher Checking Them One By One / A CPU Working Sequentially.
 */
const DESKS: [number, number][] = [0.3, 1.05, 1.8, 2.55].flatMap((x) => [0.75, 1.85].map((y) => [x, y] as [number, number]))
const INVIG: SprKey[] = ['man', 'reception', 'mansuit', 'visitor', 'suit', 'tabwoman', 'doctor', 'woman']
const TDESK = { x: 3.95, y: 1.75, w: 1.1, d: 0.62, h: 0.62 } as const

function Sheet({ x, y, z, tick, done }: { x: number; y: number; z: number; tick: boolean; done?: boolean }) {
  const q = [sv(x, y, z), sv(x + 0.3, y, z), sv(x + 0.3, y + 0.22, z), sv(x, y + 0.22, z)]
  const [cx, cy] = sv(x + 0.15, y + 0.11, z)
  return (
    <g>
      <polygon points={pts(q)} fill={colors.white} stroke={PAL.base} strokeWidth={0.8} />
      <line x1={q[0][0] + 4} y1={q[0][1] + 4} x2={q[1][0] - 2} y2={q[1][1] + 5} stroke={PAL.base} strokeWidth={1} />
      <Tick x={cx} y={cy - 9} r={6} on={tick} />
      {done && null}
    </g>
  )
}

function T09Everyday({ step }: { step: number }) {
  const all = step >= 2
  const k = useOnce(step >= 3, ONCE.slow, 'linear')
  const deskH = 0.45
  const front = DESKS.filter(([, y]) => y > 1.5)
  const back = DESKS.filter(([, y]) => y < 1.5)
  const inv = st(DESKS[2][0] + 0.3, DESKS[2][1] - 0.16, 1.15)
  const sheetPt = st(DESKS[3][0] + 0.25, DESKS[3][1] + 0.15, deskH)
  const teachPt = st(TDESK.x + 0.3, TDESK.y + 0.3, TDESK.h + 0.15)
  const tz = TDESK.h
  /* the teacher's stack: 3 sheets leave it one by one (each takes a third of the ride) to the checked pile */
  const moving = [0, 1, 2].map((i) => sm((k - i / 3) * 3))
  const stackA: G3 = [TDESK.x + 0.12, TDESK.y + 0.15, tz]
  const stackB: G3 = [TDESK.x + 0.58, TDESK.y + 0.18, tz]
  const deskRow = (list: [number, number][], people: SprKey[]) =>
    list.map(([x, y], i) => (
      <g key={`${x}-${y}`}>
        <Spr k={people[i]} x={x + 0.3} y={y - 0.16} h={60} />
        <Desk x={x} y={y} w={0.6} d={0.45} h={deskH} />
        <Sheet x={x + 0.15} y={y + 0.12} z={deskH} tick={all} />
      </g>
    ))
  return (
    <Scene
      tags={
        <>
          <Tag n={1} x={110} y={ROW[0]} to={inv} on={step >= 1}>
            Hundreds Of Invigilators
          </Tag>
          <Tag n={2} x={170} y={ROW[1]} to={sheetPt} on={all}>
            Checking Answer Sheets At Once
          </Tag>
          <Tag n={3} x={330} y={ROW[2]} to={teachPt} on={step >= 3}>
            One Teacher Checking Them One By One
          </Tag>
        </>
      }
    >
      <Room
        dc={false}
        a={
          <g>
            <rect x={0.5 * UU} y={0.45 * UU} width={2.1 * UU} height={0.95 * UU} rx={3} fill="#2F5D50" stroke={shade(PAL.wood, -0.2)} strokeWidth={3} />
            <WindowFace a={3.2 * UU} b={0.45 * UU} w={1.5 * UU} h={0.95 * UU} />
          </g>
        }
        b={
          <g>
            <WallClock a={1.0 * UU} b={0.7 * UU} />
            <WindowFace a={1.7 * UU} b={0.45 * UU} w={1.6 * UU} h={0.95 * UU} />
          </g>
        }
      />
      {deskRow(back, INVIG.slice(0, 4))}
      {deskRow(front, INVIG.slice(4))}
      {/* the teacher's desk at the front right, her stack and her done pile */}
      <Spr k="teacher" x={TDESK.x + 0.55} y={TDESK.y - 0.18} h={74} />
      <Desk {...TDESK} top={shade(PAL.wood, -0.08)} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Box key={i} x={stackA[0]} y={stackA[1]} z={tz + i * 0.035} w={0.34} d={0.26} h={0.03} color={i % 2 ? '#F4F6FB' : colors.white} />
      ))}
      {moving.map((m, i) => {
        const a = sv(stackA[0] + 0.15, stackA[1] + 0.11, tz + 0.21)
        const b = sv(stackB[0] + 0.15, stackB[1] + 0.11, tz + 0.04 + i * 0.035)
        const x = a[0] + (b[0] - a[0]) * m
        const y = a[1] + (b[1] - a[1]) * m - Math.sin(Math.PI * m) * 10
        const q = [
          [x - 12, y - 1],
          [x + 1, y - 7],
          [x + 12, y - 1],
          [x - 1, y + 5],
        ] as [number, number][]
        return <polygon key={i} points={pts(q)} fill={colors.white} stroke={PAL.base} strokeWidth={0.8} opacity={m > 0 ? 1 : 0} />
      })}
      <Halo x={sv(DESKS[2][0] + 0.3, DESKS[2][1] - 0.2, 0.9)[0]} y={sv(DESKS[2][0] + 0.3, DESKS[2][1] - 0.2, 0.9)[1]} r={36} on={step === 1} />
      <Halo x={sv(TDESK.x + 0.5, TDESK.y + 0.3, 0.9)[0]} y={sv(TDESK.x + 0.5, TDESK.y + 0.3, 0.9)[1]} r={40} on={step === 3} />
    </Scene>
  )
}

/** one GPU core (or CPU core): a small chip box, its data block lit when `lit` */
function Core({ x, y, z, lit, big = false }: { x: number; y: number; z: number; lit: boolean; big?: boolean }) {
  const s = big ? 0.42 : 0.2
  return <Box x={x} y={y} z={z} w={s} d={s} h={big ? 0.12 : 0.08} color={lit ? colors.brand : PAL.navy} style={{ transition: `opacity ${REVEAL_MS}ms ${EASE}` }} />
}

function T09Concept({ step }: { step: number }) {
  const all = step >= 2
  const k = useOnce(step >= 3, ONCE.slow, 'linear')
  const pz = 0.42
  const B = { x: 0.3, y: 0.6, w: 3.0, d: 1.9 }
  const cols = 10
  const rows = 6
  const cores: [number, number][] = []
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) cores.push([B.x + 0.14 + i * 0.3, B.y + 0.12 + j * 0.3])
  /* the CPU's queue: three data blocks enter the chip one after another */
  const qa: G3 = [TDESK.x - 0.05, TDESK.y + 0.95, TDESK.h + 0.02]
  const chip: G3 = [TDESK.x + 0.5, TDESK.y + 0.3, TDESK.h + 0.14]
  const coresPt = st(cores[13][0] + 0.1, cores[13][1] + 0.1, pz + 0.1)
  const dataPt = st(cores[40][0] + 0.1, cores[40][1] + 0.1, pz + 0.1)
  const cpuPt = st(chip[0], chip[1], chip[2])
  const tr = useTr()
  return (
    <Scene
      tags={
        <>
          <Tag n={1} x={110} y={ROW[0]} to={coresPt} on={step >= 1} tone="brand">
            Thousands Of GPU Cores
          </Tag>
          <Tag n={2} x={170} y={ROW[1]} to={dataPt} on={all} tone="brand">
            Process Data In Parallel
          </Tag>
          <Tag n={3} x={330} y={ROW[2]} to={cpuPt} on={step >= 3} tone="brand">
            A CPU Working Sequentially
          </Tag>
        </>
      }
    >
      <Room dc />
      <CableTray />
      <Rack x={3.6} w={0.75} h={1.8} />
      <Rack x={4.4} w={0.75} h={1.8} />
      {/* the GPU board on its plinth where the desks stand */}
      <Block x={B.x - 0.1} y={B.y - 0.1} w={B.w + 0.2} d={B.d + 0.2} h={pz - 0.1} color={shade(ISO.steel, 0.32)} dc />
      <Box x={B.x} y={B.y} z={pz - 0.1} w={B.w} d={B.d} h={0.1} color={PAL.pcb} />
      {cores.map(([x, y], i) => (
        <g key={i}>
          <Core x={x} y={y} z={pz} lit={false} />
          <g style={{ opacity: all ? 1 : 0, transition: tr('opacity') }}>
            <Box x={x + 0.03} y={y + 0.03} z={pz + 0.08} w={0.14} d={0.14} h={0.05} color={PAL.gold} stroke={false} />
          </g>
        </g>
      ))}
      <Halo x={sv(cores[13][0], cores[13][1], pz)[0]} y={sv(cores[13][0], cores[13][1], pz)[1]} r={40} on={step === 1} />
      {/* the CPU where the teacher's desk stands */}
      <Block x={TDESK.x} y={TDESK.y} w={TDESK.w} d={TDESK.d} h={TDESK.h} color={shade(ISO.steel, 0.32)} dc />
      <Box x={TDESK.x + 0.22} y={TDESK.y + 0.06} z={TDESK.h} w={0.56} d={0.48} h={0.06} color={PAL.pcb} />
      <Core x={TDESK.x + 0.29} y={TDESK.y + 0.09} z={TDESK.h + 0.06} lit={step >= 3} big />
      {[0, 1, 2].map((i) => {
        const m = sm((k - i / 3) * 3)
        const a = sv(qa[0] + 0.15 + i * 0.0, qa[1] - i * 0.0, qa[2])
        const b = sv(chip[0], chip[1], chip[2] + 0.06)
        const x = a[0] + (b[0] - a[0]) * m
        const y = a[1] + (b[1] - a[1]) * m
        const show = step >= 3 && m < 1
        return <rect key={i} x={x - 6 + (m === 0 ? i * 14 : 0)} y={y - 6} width={12} height={12} rx={2.5} fill={PAL.gold} stroke={shade(PAL.gold, -0.35)} strokeWidth={0.8} opacity={show ? 1 : 0} />
      })}
      <Halo x={sv(chip[0], chip[1], chip[2])[0]} y={sv(chip[0], chip[1], chip[2])[1]} r={34} on={step === 3} />
    </Scene>
  )
}

/* ================================================================== T12 · workers at a counter */

/*
 * TR 12: "A vCPU is like one worker at a counter and memory is the counter space available — just as more workers
 * need more counter space, more vCPUs need more memory to avoid contention."
 * Everyday: a bakery: bread shelves on the back wall, a long counter with three workers, each with room for a tray;
 * a short counter at the front right where three workers crowd one small top, their trays piled. Press 1 names one
 * worker, press 2 the counter space (the long counter's top lights), press 3 the crowded counter is crossed and the
 * long one ticked. Concept: the same bakery as a data-centre room: each counter an instance plinth whose top is a
 * row of memory sticks, each worker a vCPU chip. Links: 1 One Worker At A Counter / vCPU; 2 Counter Space / Memory;
 * 3 More Workers Need More Counter Space / More vCPUs Need More Memory.
 */
const LONG = { x: 0.35, y: 1.3, w: 3.05, d: 0.62, h: 0.9 } as const
const SHORT = { x: 3.7, y: 2.7, w: 1.0, d: 0.62, h: 0.9 } as const
const LONG_W: [SprKey, number][] = [
  ['man', 0.55],
  ['woman', 1.55],
  ['visitor', 2.55],
]
const SHORT_W: [SprKey, number][] = [
  ['reception', 3.8],
  ['mansuit', 4.2],
  ['tabwoman', 4.6],
]

function Shelves() {
  return (
    <g>
      <Box
        x={0.3}
        y={0}
        w={3.2}
        d={0.32}
        h={1.7}
        color={shade(PAL.wood, 0.1)}
        onLeft={
          <g>
            {[0, 1, 2].map((r) => (
              <g key={r}>
                <rect x={3} y={8 + r * 22} width={3.2 * UU - 6} height={18} fill={shade(PAL.wood, -0.25)} />
                {Array.from({ length: 12 }, (_, i) => (
                  <ellipse key={i} cx={12 + i * 11} cy={18 + r * 22} rx={5} ry={6} fill={['#D99A4E', '#C9813A', '#E8B46A'][(i + r) % 3]} />
                ))}
              </g>
            ))}
          </g>
        }
      />
    </g>
  )
}

function Tray({ x, y, z, pile = false }: { x: number; y: number; z: number; pile?: boolean }) {
  return (
    <g>
      <Box x={x} y={y} z={z} w={0.42} d={0.3} h={0.04} color="#C9D3E6" />
      {[0, 1, 2].map((i) => (
        <Box key={i} x={x + 0.04 + i * 0.12} y={y + 0.08} z={z + 0.04 + (pile ? i * 0.06 : 0)} w={0.1} d={0.14} h={0.07} color="#D99A4E" stroke={false} />
      ))}
    </g>
  )
}

function T12Everyday({ step }: { step: number }) {
  const lz = LONG.h
  const one = st(LONG_W[0][1], LONG.y - 0.2, 1.55)
  const space = st(LONG.x + 1.5, LONG.y + 0.3, lz)
  const more = st(SHORT.x + 0.5, SHORT.y + 0.3, lz + 0.1)
  const topLit = step === 2
  const tr = useTr()
  const ls = sv(LONG.x + 1.5, LONG.y + 0.3, lz)
  const ss = sv(SHORT.x + 0.5, SHORT.y + 0.3, lz)
  const w1 = sv(LONG_W[0][1], LONG.y - 0.2, 0.9)
  const tk = sv(LONG.x + LONG.w - 0.25, LONG.y + 0.3, lz)
  return (
    <Scene
      tags={
        <>
          <Tag n={1} x={100} y={ROW[0]} to={one} on={step >= 1}>
            One Worker At A Counter
          </Tag>
          <Tag n={2} x={150} y={ROW[1]} to={space} on={step >= 2}>
            Counter Space
          </Tag>
          <Tag n={3} x={300} y={ROW[2]} to={more} on={step >= 3}>
            More Workers Need More Counter Space
          </Tag>
        </>
      }
    >
      <Room
        dc={false}
        b={
          <g>
            <WindowFace a={1.2 * UU} b={0.45 * UU} w={1.6 * UU} h={0.95 * UU} />
            <WallClock a={3.3 * UU} b={0.75 * UU} />
          </g>
        }
        a={<rect x={3.7 * UU} y={0.4 * UU} width={1.3 * UU} height={0.5 * UU} rx={5} fill={colors.accent} />}
      />
      <Shelves />
      {LONG_W.map(([k, x]) => (
        <Spr key={k} k={k} x={x} y={LONG.y - 0.2} h={84} />
      ))}
      <Block x={LONG.x} y={LONG.y} w={LONG.w} d={LONG.d} h={lz} color={shade(PAL.wood, 0.05)} front={<rect x={0} y={0.12 * UU} width={LONG.w * UU} height={0.08 * UU} fill={colors.brand} opacity={0.8} />} />
      <g style={{ opacity: topLit ? 1 : 0, transition: tr('opacity') }}>
        <Quad x={LONG.x + 0.04} y={LONG.y + 0.04} z={lz + 0.002} w={LONG.w - 0.08} d={LONG.d - 0.08} fill={colors.brand} opacity={0.22} />
      </g>
      {LONG_W.map(([, x]) => (
        <Tray key={x} x={x - 0.2} y={LONG.y + 0.16} z={lz} />
      ))}
      {SHORT_W.map(([k, x]) => (
        <Spr key={k} k={k} x={x} y={SHORT.y - 0.18} h={84} />
      ))}
      <Block x={SHORT.x} y={SHORT.y} w={SHORT.w} d={SHORT.d} h={lz} color={shade(PAL.wood, 0.05)} front={<rect x={0} y={0.12 * UU} width={SHORT.w * UU} height={0.08 * UU} fill={colors.brand} opacity={0.8} />} />
      <Tray x={SHORT.x + 0.08} y={SHORT.y + 0.12} z={lz} pile />
      <Tray x={SHORT.x + 0.42} y={SHORT.y + 0.2} z={lz + 0.05} pile />
      <Halo x={w1[0]} y={w1[1]} r={34} on={step === 1} />
      <Halo x={ls[0]} y={ls[1]} r={46} on={step === 2} />
      <Cross x={ss[0] + 30} y={ss[1] + 6} on={step >= 3} />
      <Tick x={tk[0]} y={tk[1] - 14} on={step >= 3} />
    </Scene>
  )
}

/** a vCPU chip standing where a worker stands: a navy die with gold pins, lifted on a short post */
function Chip3({ x, y, z, lit }: { x: number; y: number; z: number; lit?: boolean }) {
  const [px, py] = sv(x, y, z + 0.55)
  return (
    <g>
      <Box x={x - 0.04} y={y - 0.04} w={0.08} d={0.08} h={z + 0.45} color={shade(ISO.steel, 0.1)} />
      <g>
        {[-1, 0, 1].map((i) => (
          <g key={i}>
            <rect x={px - 17 + 0} y={py - 6 + i * 6} width={4} height={2} fill={PAL.gold} />
            <rect x={px + 13} y={py - 6 + i * 6} width={4} height={2} fill={PAL.gold} />
          </g>
        ))}
        <rect x={px - 13} y={py - 13} width={26} height={26} rx={4} fill={lit ? colors.brand : PAL.navy} stroke={colors.white} strokeWidth={1.4} />
        <rect x={px - 7} y={py - 7} width={14} height={14} rx={2} fill={shade(PAL.navy, 0.35)} />
      </g>
    </g>
  )
}

/** a row of memory sticks lying on an instance plinth's top */
function RamRow({ x, y, z, w, n }: { x: number; y: number; z: number; w: number; n: number }) {
  const s = w / n
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <Box
          key={i}
          x={x + i * s + 0.03}
          y={y}
          z={z}
          w={s - 0.06}
          d={0.34}
          h={0.06}
          color={PAL.ram}
          onTop={
            <g>
              {[0, 1, 2].map((j) => (
                <rect key={j} x={3} y={3 + j * 4.2} width={(s - 0.06) * UU - 6} height={2.4} fill="#1E2A44" />
              ))}
            </g>
          }
        />
      ))}
    </g>
  )
}

function T12Concept({ step }: { step: number }) {
  const lz = LONG.h
  const tr = useTr()
  const one = st(LONG_W[0][1], LONG.y - 0.2, 1.35)
  const space = st(LONG.x + 1.5, LONG.y + 0.3, lz + 0.06)
  const more = st(SHORT.x + 0.5, SHORT.y + 0.3, lz + 0.1)
  const ls = sv(LONG.x + 1.5, LONG.y + 0.3, lz)
  const ss = sv(SHORT.x + 0.5, SHORT.y + 0.3, lz)
  const w1 = sv(LONG_W[0][1], LONG.y - 0.2, 1.3)
  const tk = sv(LONG.x + LONG.w - 0.25, LONG.y + 0.3, lz)
  return (
    <Scene
      tags={
        <>
          <Tag n={1} x={100} y={ROW[0]} to={one} on={step >= 1} tone="brand">
            vCPU
          </Tag>
          <Tag n={2} x={150} y={ROW[1]} to={space} on={step >= 2} tone="brand">
            Memory
          </Tag>
          <Tag n={3} x={300} y={ROW[2]} to={more} on={step >= 3} tone="brand">
            More vCPUs Need More Memory
          </Tag>
        </>
      }
    >
      <Room dc />
      <CableTray />
      <Rack x={0.4} w={0.8} h={1.7} />
      <Rack x={1.3} w={0.8} h={1.7} />
      <Rack x={2.2} w={0.8} h={1.7} />
      <Cooler y={2.3} d={1.0} h={1.5} />
      {LONG_W.map(([, x], i) => (
        <Chip3 key={x} x={x} y={LONG.y - 0.18} z={0.6} lit={step === 1 && i === 0} />
      ))}
      <Block x={LONG.x} y={LONG.y} w={LONG.w} d={LONG.d} h={lz} color={shade(ISO.steel, 0.32)} dc />
      <RamRow x={LONG.x + 0.08} y={LONG.y + 0.14} z={lz} w={LONG.w - 0.16} n={6} />
      <g style={{ opacity: step === 2 ? 1 : 0, transition: tr('opacity') }}>
        <Quad x={LONG.x + 0.04} y={LONG.y + 0.04} z={lz + 0.07} w={LONG.w - 0.08} d={LONG.d - 0.08} fill={colors.brand} opacity={0.2} />
      </g>
      <Mark src={mInstance} x={LONG.x + 0.35} y={LONG.y + LONG.d + 0.4} h={30} />
      {SHORT_W.map(([, x]) => (
        <Chip3 key={x} x={x} y={SHORT.y - 0.15} z={0.6} />
      ))}
      <Block x={SHORT.x} y={SHORT.y} w={SHORT.w} d={SHORT.d} h={lz} color={shade(ISO.steel, 0.32)} dc />
      <RamRow x={SHORT.x + 0.3} y={SHORT.y + 0.14} z={lz} w={0.42} n={1} />
      <Mark src={mInstance} x={SHORT.x - 0.3} y={SHORT.y + SHORT.d + 0.15} h={30} />
      <Halo x={w1[0]} y={w1[1]} r={30} on={step === 1} />
      <Halo x={ls[0]} y={ls[1]} r={46} on={step === 2} />
      <Cross x={ss[0] + 30} y={ss[1] + 6} on={step >= 3} />
      <Tick x={tk[0]} y={tk[1] - 14} on={step >= 3} />
    </Scene>
  )
}

/* ------------------------------------------------------------------ exports */

export const figures = {
  F_T01Everyday: T01Everyday,
  F_T01Concept: T01Concept,
  F_T06Everyday: T06Everyday,
  F_T06Concept: T06Concept,
  F_T09Everyday: T09Everyday,
  F_T09Concept: T09Concept,
  F_T12Everyday: T12Everyday,
  F_T12Concept: T12Concept,
} as unknown as Record<string, (p: Record<string, unknown>) => ReactNode>

export const slides = {}

/* no CSS loops: every motion is a one-shot tied to its build press */
export const css = ''
