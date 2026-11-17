import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { SPEED } from '@/deck/autoAnim'
import { At, Label, REDUCED, STILL, type LabelTone } from '@/decks/figures/scene'
import { Box, ISO, IsoScene, IsoSvg, P, Quad, Shadow, measure, along, pts, screenPts, shade, useIso, type GridPt } from '@/decks/figures/iso/iso'
import { iconUrl } from '@/decks/figures/net/fx'
import pMan from './ppl/man.png'
import pSuit from './ppl/suit.png'
import pMansuit from './ppl/mansuit.png'
import pReception from './ppl/reception.png'
import pWoman from './ppl/woman.png'
import pVisitor from './ppl/visitor.png'
import pTeacher from './ppl/teacher.png'
import mEc2 from '../images/aws-ec2.svg'
import mVolume from '../images/aws-ebs-volume.svg'
import mS3 from '../images/aws-s3.svg'
import mBucket from '../images/aws-s3-bucket.svg'

/**
 * BUILDER F · THE FIVE ANALOGY SLIDES OF "BLOCK, FILE & OBJECT STORAGE" (2026-11-06).
 *
 * Built the way Session 6's analogies were (Load Balancing & CDN, custom/f.tsx): every picture is an
 * isometric scene from `figures/iso` (one camera, one grid unit, one floor), every person a realistic 3D
 * library render (`./ppl/`), every technical part either a 3D library render (`net/icons`) or the official
 * AWS mark on a white tile (rule 54). The everyday scene (left) and the concept (right) share the grid, so a
 * matched pair stands on the same spot on both stages.
 *
 * Text (course R3, lesson 2): no sentence; every clause of the TR analogy is a Title Case tag (rule 56) inside
 * the picture it describes, in the TR's words. Labels are DOM (`Label`), never svg text.
 *
 * Motion: the layout's ONE build track (`step`, 0..3) reveals the pairs, the same press on both stages; after
 * the build a quiet loop runs with no pause (R8.1). `?still`, thumbnails and reduced motion hold the full frame.
 */

/* ------------------------------------------------------------------ shared */

const SW = 470
const SH = 390
const UU = 46
const EASE = 'cubic-bezier(0.22,1,0.36,1)'
const WALL = shade(ISO.steel, 0.55)
const DESK = shade(ISO.steel, 0.42)

function useHeld() {
  const instant = useInstant()
  return STILL || REDUCED || instant
}

function useTr(ms = 520) {
  const instant = useInstant()
  return (p: string) => (instant ? 'none' : `${p} ${ms}ms ${EASE}`)
}

/** A sawtooth phase 0..1 that runs once `on`, never pausing between laps; `still` on every held frame. */
function useLap(on: boolean, ms: number, still: number) {
  const held = useHeld()
  const [t, setT] = useState(still)
  useEffect(() => {
    if (held || !on) {
      setT(still)
      return
    }
    let raf = 0
    let last = -1
    const t0 = performance.now()
    const period = ms * SPEED
    const tick = (now: number) => {
      const q = Math.floor((((now - t0) / period + still) % 1) * 360)
      if (q !== last) {
        last = q
        setT(q / 360)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [held, on, ms, still])
  return held || !on ? still : t
}

/** ease in and out over 0..1 */
const sm = (k: number) => {
  const c = Math.min(1, Math.max(0, k))
  return c * c * (3 - 2 * c)
}

const SPR = {
  man: [pMan, 126 / 220],
  suit: [pSuit, 144 / 220],
  mansuit: [pMansuit, 134 / 220],
  reception: [pReception, 127 / 220],
  woman: [pWoman, 128 / 220],
  visitor: [pVisitor, 125 / 220],
  teacher: [pTeacher, 126 / 220],
  laptop: [iconUrl('laptop'), 192 / 182],
  laptopFront: [iconUrl('laptop-front'), 241 / 168],
  desktop: [iconUrl('desktop'), 256 / 162],
  files: [iconUrl('files'), 256 / 182],
  clock: [iconUrl('clock'), 234 / 231],
} as const
type SprKey = keyof typeof SPR

/** A sprite standing on grid (x, y, z): bottom centre on that point, `h` px tall, a soft floor shadow under it. */
function Spr({ k, x, y, z = 0, h, op = 1, cls, flip = false, shadow = true, style }: { k: SprKey; x: number; y: number; z?: number; h: number; op?: number; cls?: string; flip?: boolean; shadow?: boolean; style?: CSSProperties }) {
  const tr = useTr()
  const { u } = useIso()
  const [px, py] = P(x, y, z, u)
  const [src, ar] = SPR[k]
  const w = h * ar
  return (
    <g style={{ opacity: op, transition: tr('opacity'), ...style }}>
      {shadow && <ellipse cx={px} cy={py - 1} rx={w * 0.34} ry={w * 0.1} fill={ISO.slate} opacity={0.18} />}
      <g className={cls}>
        <image href={src} x={px - w / 2} y={py - h} width={w} height={h} preserveAspectRatio="xMidYMax meet" transform={flip ? `translate(${px * 2} 0) scale(-1 1)` : undefined} style={{ filter: 'drop-shadow(0 4px 3px rgba(16,32,58,0.18))' }} />
      </g>
    </g>
  )
}

/** An official AWS mark (rule 54) on its white tile (r 0.27, mark 76 %), standing upright on grid (x, y, z). */
function Mark({ src, x, y, z = 0, h, op = 1, ring, cls }: { src: string; x: number; y: number; z?: number; h: number; op?: number; ring?: string; cls?: string }) {
  const tr = useTr()
  const { u } = useIso()
  const [px, py] = P(x, y, z, u)
  const m = h * 0.76
  return (
    <g style={{ opacity: op, transition: tr('opacity') }}>
      <ellipse cx={px} cy={py - 1} rx={h * 0.5} ry={h * 0.15} fill={ISO.slate} opacity={0.18} />
      <g className={cls}>
        <rect x={px - h / 2} y={py - h - 4} width={h} height={h} rx={h * 0.27} fill={colors.white} stroke={ring ?? '#D5E0F2'} strokeWidth={ring ? 2.5 : 1} style={{ filter: 'drop-shadow(0 5px 4px rgba(16,32,58,0.2))', transition: tr('stroke') }} />
        <image href={src} x={px - m / 2} y={py - h - 4 + (h - m) / 2} width={m} height={m} preserveAspectRatio="xMidYMid meet" />
      </g>
    </g>
  )
}

/** A tag in the TR's words: a DOM chip centred on `x`, its top at `y` (stage px). */
function Tag({ x, y, on = true, tone = 'plain', children }: { x: number; y: number; on?: boolean; tone?: LabelTone; children: ReactNode }) {
  const tr = useTr()
  return (
    <At x={x} y={y} cx>
      <span className="block" style={{ opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(6px)', transition: `${tr('opacity')}, ${tr('transform')}` }}>
        <Label size={14} strong tone={tone} raised>
          {children}
        </Label>
      </span>
    </At>
  )
}

function Cross({ x, y, on = true, r = 11 }: { x: number; y: number; on?: boolean; r?: number }) {
  const tr = useTr()
  return (
    <g style={{ opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transformOrigin: `${x}px ${y}px`, transition: `${tr('opacity')}, ${tr('transform')}` }}>
      <circle cx={x} cy={y} r={r + 3} fill={colors.danger} opacity={0.18} />
      <circle cx={x} cy={y} r={r} fill={colors.danger} stroke={colors.white} strokeWidth={2} />
      <path d={`M${x - r * 0.4} ${y - r * 0.4} L${x + r * 0.4} ${y + r * 0.4} M${x + r * 0.4} ${y - r * 0.4} L${x - r * 0.4} ${y + r * 0.4}`} stroke={colors.white} strokeWidth={2.4} strokeLinecap="round" />
    </g>
  )
}

function Tick({ x, y, on = true, r = 11 }: { x: number; y: number; on?: boolean; r?: number }) {
  const tr = useTr()
  return (
    <g style={{ opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transformOrigin: `${x}px ${y}px`, transition: `${tr('opacity')}, ${tr('transform')}` }}>
      <circle cx={x} cy={y} r={r + 3} fill={colors.success} opacity={0.18} />
      <circle cx={x} cy={y} r={r} fill={colors.success} stroke={colors.white} strokeWidth={2} />
      <path d={`M${x - r * 0.45} ${y + r * 0.02} L${x - r * 0.1} ${y + r * 0.38} L${x + r * 0.48} ${y - r * 0.34}`} fill="none" stroke={colors.white} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

/** A route on the floor (grid points), thin and solid, its head on the last point when `head`. */
function Route({ points, z = 0.05, color = colors.brand, width = 2.2, head = true, op = 1, dash }: { points: GridPt[]; z?: number; color?: string; width?: number; head?: boolean; op?: number; dash?: string }) {
  const tr = useTr()
  const { u } = useIso()
  const q = screenPts(points, z, u)
  const d = q.map(([a, b], i) => `${i ? 'L' : 'M'}${a.toFixed(2)} ${b.toFixed(2)}`).join(' ')
  let tip: ReactNode = null
  if (head && q.length >= 2) {
    const [ax, ay] = q[q.length - 2]
    const [bx, by] = q[q.length - 1]
    const ang = Math.atan2(by - ay, bx - ax)
    const L = 10
    const W = 4.6
    const p1: [number, number] = [bx - L * Math.cos(ang) + W * Math.sin(ang), by - L * Math.sin(ang) - W * Math.cos(ang)]
    const p2: [number, number] = [bx - L * Math.cos(ang) - W * Math.sin(ang), by - L * Math.sin(ang) + W * Math.cos(ang)]
    tip = <polygon points={pts([[bx, by], p1, p2])} fill={color} />
  }
  return (
    <g style={{ opacity: op, transition: tr('opacity') }}>
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} />
      {tip}
    </g>
  )
}

/** A dot riding a floor route at phase `t` (0..1), fading in and out at the ends. */
function Dot({ points, t, z = 0.18, color = colors.brand, r = 5, on = true }: { points: GridPt[]; t: number; z?: number; color?: string; r?: number; on?: boolean }) {
  const { u } = useIso()
  const q = screenPts(points, z, u)
  const { seg, len } = measure(q)
  const tt = Math.min(1, Math.max(0, t))
  const [hx, hy] = along(q, seg, tt * len)
  const [tx, ty] = along(q, seg, Math.max(0, tt * len - 14))
  const edge = Math.min(1, Math.min(tt, 1 - tt) / 0.08)
  return (
    <g opacity={on ? edge : 0}>
      <line x1={tx} y1={ty} x2={hx} y2={hy} stroke={color} strokeWidth={r * 0.9} strokeLinecap="round" opacity={0.35} />
      <circle cx={hx} cy={hy} r={r} fill={color} stroke={colors.white} strokeWidth={1.5} />
    </g>
  )
}

function Scene({ ox, oy, children, tags }: { ox: number; oy: number; children: ReactNode; tags?: ReactNode }) {
  return (
    <IsoScene w={SW} h={SH} ox={ox} oy={oy} u={UU}>
      <IsoSvg>{children}</IsoSvg>
      {tags}
    </IsoScene>
  )
}

/** grid point to scene-svg px (inside IsoSvg) */
const sv = (x: number, y: number, z = 0): [number, number] => P(x, y, z, UU)
/** grid point to stage px (for a DOM tag) */
const st = (o: { ox: number; oy: number }, x: number, y: number, z = 0): [number, number] => {
  const [a, b] = P(x, y, z, UU)
  return [a + o.ox, b + o.oy]
}

/** a soft halo that breathes around a lit part (svg px), quiet and continuous */
function Halo({ x, y, r, on, color = colors.brand }: { x: number; y: number; r: number; on: boolean; color?: string }) {
  const tr = useTr()
  return (
    <g style={{ opacity: on ? 1 : 0, transition: tr('opacity') }}>
      <circle cx={x} cy={y} r={r} fill={color} opacity={0.1} />
      <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={1.6} opacity={0.45} className="f7-ring" style={{ transformOrigin: `${x}px ${y}px` }} />
    </g>
  )
}

/** the floor plate every picture stands on */
const Floor = ({ x = -0.3, y = -0.3, w = 4.8, d = 3.8 }: { x?: number; y?: number; w?: number; d?: number }) => <Quad x={x} y={y} w={w} d={d} fill={ISO.paper} />

/* ------------------------------------------------------------------ T01 · an external hard disk */

/*
 * TR 1: "An external hard disk plugged into one laptop stores files only that laptop can read directly — just as
 * an EBS volume attaches as a raw block device to a single EC2 instance at a time."
 * One desk, two machines on it; the disk sits between them. Pairs: 1 the disk / the volume; 2 the cable into
 * laptop 1 / the attachment into instance 1; 3 the files only laptop 1 reads, laptop 2 shut out / one instance
 * at a time, instance 2 shut out. Loop: blocks ride the cable both ways, the disk's light blinks.
 */
const T01 = { ox: 236, oy: 142 } as const
const T01_DESK = { x: 0.5, y: 0.8, w: 3.6, d: 1.4, h: 0.72 } as const
const T01_A: GridPt = [1.25, 1.85] // laptop 1 / instance 1
const T01_D: GridPt = [2.35, 1.6] // the disk / the volume
const T01_B: GridPt = [3.45, 1.3] // laptop 2 / instance 2
const T01_CABLE: GridPt[] = [
  [2.0, 1.95],
  [1.7, 2.05],
  [1.5, 2.0],
]

function T01Desk({ concept }: { concept: boolean }) {
  const D = T01_DESK
  const legs: GridPt[] = [
    [D.x + 0.08, D.y + 0.08],
    [D.x + D.w - 0.16, D.y + 0.08],
    [D.x + 0.08, D.y + D.d - 0.16],
    [D.x + D.w - 0.16, D.y + D.d - 0.16],
  ]
  return concept ? (
    /* the concept's desk is a rack plinth: one solid block where the desk stands */
    <g>
      <Shadow x={D.x} y={D.y} w={D.w} d={D.d} />
      <Box
        x={D.x}
        y={D.y}
        w={D.w}
        d={D.d}
        h={D.h}
        color={shade(ISO.steel, 0.3)}
        onLeft={
          <g>
            {[0.18, 0.4].map((k) => (
              <rect key={k} x={0.3 * UU} y={k * UU} width={2.8 * UU} height={0.1 * UU} rx={2} fill={shade(ISO.steel, -0.05)} />
            ))}
          </g>
        }
      />
    </g>
  ) : (
    <g>
      <Shadow x={D.x} y={D.y} w={D.w} d={D.d} />
      {legs.map(([x, y], i) => (
        <Box key={i} x={x} y={y} w={0.08} d={0.08} h={D.h - 0.08} color={shade(ISO.slate, 0.1)} />
      ))}
      <Box x={D.x} y={D.y} z={D.h - 0.08} w={D.w} d={D.d} h={0.08} color={DESK} />
    </g>
  )
}

/** the external disk: a small dark block with a status light, standing on the desk */
function Disk({ x, y, z, lit }: { x: number; y: number; z: number; lit: boolean }) {
  const held = useHeld()
  return (
    <g>
      <Box
        x={x - 0.28}
        y={y - 0.2}
        z={z}
        w={0.56}
        d={0.4}
        h={0.16}
        color={shade(colors.brandDeep ?? '#1B2A6B', 0.08)}
        onLeft={<circle cx={0.42 * UU} cy={0.08 * UU} r={2.2} fill={lit ? ISO.green : shade(ISO.slate, 0.3)} className={lit && !held ? 'f7-blink' : undefined} />}
      />
    </g>
  )
}

function T01Everyday({ step }: { step: number }) {
  const z = T01_DESK.h
  const plugged = step >= 2
  const only = step >= 3
  const t = useLap(plugged, 2600, 0.45)
  const cable: GridPt[] = [[T01_D[0] - 0.22, T01_D[1] + 0.12], ...T01_CABLE]
  const dk = sv(T01_D[0], T01_D[1], z + 0.16)
  const lb = sv(T01_B[0], T01_B[1], z)
  const la = sv(T01_A[0], T01_A[1], z)
  return (
    <Scene
      ox={T01.ox}
      oy={T01.oy}
      tags={
        <>
          <Tag x={330} y={298} on={step >= 1}>
            An External Hard Disk
          </Tag>
          <Tag x={170} y={258} on={plugged}>
            Plugged Into One Laptop
          </Tag>
          <Tag x={235} y={334} on={only}>
            Stores Files Only That Laptop Can Read Directly
          </Tag>
        </>
      }
    >
      <Floor />
      <T01Desk concept={false} />
      <Spr k="laptop" x={T01_A[0]} y={T01_A[1]} z={z} h={62} />
      <Spr k="laptop" x={T01_B[0]} y={T01_B[1]} z={z} h={62} flip />
      {/* the cable: plugged in at step 2, blocks riding it both ways */}
      <Route points={cable} z={z + 0.04} color={shade(ISO.ink, 0.25)} width={2.6} head={false} op={plugged ? 1 : 0} />
      {plugged && [0, 0.5].map((k) => <Dot key={k} points={cable} z={z + 0.06} t={(t + k) % 1} r={3.6} color={colors.brand} />)}
      <Disk x={T01_D[0]} y={T01_D[1]} z={z} lit={plugged} />
      {/* the laptop's owner beside the desk, turned to it */}
      <Spr k="man" x={0.05} y={2.8} h={150} flip />
      <Halo x={dk[0]} y={dk[1] - 2} r={26} on={step === 1} />
      {/* the files laptop 1 reads; laptop 2 cannot */}
      <g style={{ opacity: only ? 1 : 0, transition: 'opacity 520ms' }}>
        <image href={SPR.files[0]} x={la[0] - 24} y={la[1] - 112} width={44} height={44 / SPR.files[1]} style={{ filter: 'drop-shadow(0 4px 3px rgba(16,32,58,0.18))' }} />
      </g>
      <Cross x={lb[0]} y={lb[1] - 78} on={only} r={12} />
    </Scene>
  )
}

function T01Concept({ step }: { step: number }) {
  const z = T01_DESK.h
  const attached = step >= 2
  const only = step >= 3
  const t = useLap(attached, 2600, 0.45)
  const link: GridPt[] = [[T01_D[0] - 0.05, T01_D[1] + 0.05], [T01_A[0] + 0.25, T01_A[1] + 0.15]]
  const vd = sv(T01_D[0], T01_D[1], z)
  const ib = sv(T01_B[0], T01_B[1], z)
  return (
    <Scene
      ox={T01.ox}
      oy={T01.oy}
      tags={
        <>
          <Tag x={330} y={298} on={step >= 1} tone="brand">
            An EBS Volume
          </Tag>
          <Tag x={170} y={258} on={attached} tone="brand">
            Attaches As A Raw Block Device
          </Tag>
          <Tag x={235} y={334} on={only} tone="brand">
            To A Single EC2 Instance At A Time
          </Tag>
        </>
      }
    >
      <Floor />
      <T01Desk concept />
      <Mark src={mEc2} x={T01_A[0]} y={T01_A[1]} z={z} h={58} ring={attached ? colors.brand : undefined} />
      <Mark src={mEc2} x={T01_B[0]} y={T01_B[1]} z={z} h={58} />
      <Route points={link} z={z + 0.04} color={colors.brand} width={2.6} head={false} op={attached ? 1 : 0} />
      {attached && [0, 0.5].map((k) => <Dot key={k} points={link} z={z + 0.06} t={(t + k) % 1} r={3.6} />)}
      <Mark src={mVolume} x={T01_D[0]} y={T01_D[1]} z={z} h={44} ring={step === 1 ? colors.brand : undefined} />
      <Halo x={vd[0]} y={vd[1] - 26} r={30} on={step === 1} />
      <Cross x={ib[0] + 28} y={ib[1] - 64} on={only} r={12} />
    </Scene>
  )
}

/* ------------------------------------------------------------------ T07 · an office notice board */

/*
 * TR 7: "An office notice board lets every employee read and pin updates on the very same board instead of each
 * keeping a private copy — just as NFS lets every mounting client read and write the one shared copy of a file
 * kept on the server."
 * The board hangs on the back wall where the server stands; the three employees stand where the three clients
 * stand. Pairs: 1 the board / NFS, the one file kept on the server; 2 every employee / every mounting client;
 * 3 read and pin on the same board (no private copies) / read and write the one shared copy. Loop: a note is
 * carried to the board and pinned; on the concept, reads and writes ride every client's line.
 */
const T07 = { ox: 236, oy: 128 } as const
const T07_WALL = { x: 0.5, y: 0.0, w: 3.6, d: 0.22, h: 2.0 } as const
const T07_P: GridPt[] = [
  [0.35, 2.35],
  [1.95, 2.5],
  [3.7, 1.9],
]
const T07_HIT: GridPt = [1.65, 0.3]

function NoticeBoard({ concept }: { concept: boolean }) {
  /* face units on the wall's front face: a along +x (0..w*U), b down from the top (0..h*U) */
  const W = T07_WALL.w * UU
  const bx = W * 0.14
  const bw = W * 0.72
  const by = 14
  const bh = 58
  if (concept) {
    /* the server's face: drive bays, and the one shared file in the middle */
    return (
      <g>
        {[0, 1, 2, 3].map((r) => (
          <rect key={r} x={bx} y={by - 8 + r * 20} width={bw} height={14} rx={3} fill={shade(colors.brand, -0.15)} />
        ))}
        {[0, 1, 2, 3].map((r) => (
          <circle key={r} cx={bx + 10} cy={by - 1 + r * 20} r={2.4} fill={ISO.green} />
        ))}
        <g transform={`translate(${bx + bw / 2 - 18} ${by + 4})`}>
          <path d="M0 0 h26 l10 10 v38 h-36 z" fill={colors.white} stroke={shade(colors.brand, -0.3)} strokeWidth={1} />
          <path d="M26 0 v10 h10" fill="#DCE6F7" />
          {[18, 25, 32, 39].map((y) => (
            <rect key={y} x={6} y={y} width={y === 39 ? 14 : 24} height={3} rx={1.5} fill={colors.brand} opacity={0.6} />
          ))}
        </g>
      </g>
    )
  }
  const notes: [number, number, string][] = [
    [0.1, 0.16, '#FFFFFF'],
    [0.3, 0.12, '#FFE7A3'],
    [0.52, 0.18, '#DCE8FF'],
    [0.72, 0.14, '#FFFFFF'],
    [0.18, 0.56, '#DCE8FF'],
    [0.42, 0.6, '#FFFFFF'],
    [0.64, 0.55, '#FFE7A3'],
  ]
  return (
    <g>
      <rect x={bx - 4} y={by - 4} width={bw + 8} height={bh + 8} rx={4} fill={shade('#B9824A', -0.15)} />
      <rect x={bx} y={by} width={bw} height={bh} rx={2} fill="#D8A56C" />
      {notes.map(([a, b, c], i) => (
        <g key={i}>
          <rect x={bx + a * bw} y={by + b * bh} width={bw * 0.16} height={bh * 0.3} rx={1.5} fill={c} stroke="rgba(16,32,58,0.12)" strokeWidth={0.6} />
          {[0.35, 0.55, 0.75].map((k) => (
            <rect key={k} x={bx + a * bw + 3} y={by + b * bh + k * bh * 0.3} width={bw * 0.16 - 6} height={1.6} rx={0.8} fill={shade(ISO.slate, 0.4)} />
          ))}
          <circle cx={bx + a * bw + bw * 0.08} cy={by + b * bh + 3} r={2.2} fill={i % 2 ? colors.danger : colors.brand} />
        </g>
      ))}
    </g>
  )
}

/** a paper copy (svg px) */
function Sheet({ x, y, w = 22, op = 1 }: { x: number; y: number; w?: number; op?: number }) {
  const h = w * 1.3
  return (
    <g opacity={op}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={2} fill={colors.white} stroke={shade(ISO.slate, 0.3)} strokeWidth={0.8} style={{ filter: 'drop-shadow(0 3px 2px rgba(16,32,58,0.18))' }} />
      {[0.3, 0.5, 0.7].map((k) => (
        <rect key={k} x={x - w / 2 + 4} y={y - h / 2 + k * h} width={w - 8} height={1.8} rx={0.9} fill={shade(ISO.slate, 0.35)} />
      ))}
    </g>
  )
}

function T07Wall({ concept }: { concept: boolean }) {
  const W = T07_WALL
  return (
    <g>
      <Shadow x={W.x} y={W.y} w={W.w} d={W.d + 0.2} />
      <Box x={W.x} y={W.y} w={W.w} d={W.d} h={W.h} color={concept ? colors.brand : WALL} onLeft={<NoticeBoard concept={concept} />} />
    </g>
  )
}

function T07Everyday({ step }: { step: number }) {
  const pin = step >= 3
  const t = useLap(pin, 3600, 0.62)
  /* the note's trip: from the middle employee's hand up to the board, pinned, then a fresh one */
  const from = sv(T07_P[1][0], T07_P[1][1], 1.55)
  const to = sv(T07_HIT[0], T07_WALL.d + 0.02, 1.25)
  const k = sm(t / 0.55)
  const nx = from[0] + (to[0] - from[0]) * k
  const ny = from[1] + (to[1] - from[1]) * k - Math.sin(k * Math.PI) * 18
  const nop = t < 0.06 ? t / 0.06 : t > 0.9 ? (1 - t) / 0.1 : 1
  const pb = st(T07, 2.3, 0.1, T07_WALL.h)
  const pCopy = sv(4.6, 1.4, 0.4)
  return (
    <Scene
      ox={T07.ox}
      oy={T07.oy}
      tags={
        <>
          <Tag x={pb[0]} y={pb[1] - 34} on={step >= 1}>
            An Office Notice Board
          </Tag>
          <Tag x={100} y={262} on={step >= 2}>
            Every Employee
          </Tag>
          <Tag x={235} y={340} on={pin}>
            Read And Pin Updates On The Very Same Board
          </Tag>
          <Tag x={235} y={302} on={pin} tone="bad">
            Instead Of Each Keeping A Private Copy
          </Tag>
        </>
      }
    >
      <Floor />
      <T07Wall concept={false} />
      <Spr k="reception" x={T07_P[0][0]} y={T07_P[0][1]} h={128} flip cls={step >= 2 ? 'f7-lean' : undefined} />
      <Spr k="man" x={T07_P[2][0]} y={T07_P[2][1]} h={130} cls={step >= 2 ? 'f7-lean f7-d1' : undefined} />
      <Spr k="teacher" x={T07_P[1][0]} y={T07_P[1][1]} h={128} cls={step >= 2 ? 'f7-lean f7-d2' : undefined} />
      {pin && <Sheet x={nx} y={ny} w={14} op={nop} />}
      {/* no private copies: a copy crossed out beside the group */}
      <g style={{ opacity: pin ? 1 : 0, transition: 'opacity 520ms' }}>
        <Sheet x={pCopy[0]} y={pCopy[1]} w={24} />
        <Sheet x={pCopy[0] + 8} y={pCopy[1] + 5} w={24} />
      </g>
      <Cross x={pCopy[0] + 18} y={pCopy[1] - 16} on={pin} r={10} />
    </Scene>
  )
}

function T07Concept({ step }: { step: number }) {
  const rw = step >= 3
  const t = useLap(rw, 3000, 0.3)
  const hit: GridPt = [T07_HIT[0], T07_WALL.d + 0.05]
  const lines: GridPt[][] = T07_P.map(([x, y]) => [[x, y - 0.15], [x * 0.5 + hit[0] * 0.5, (y - 0.15) * 0.5 + hit[1] * 0.5], hit])
  const pb = st(T07, 2.3, 0.1, T07_WALL.h)
  const kicks = [0, 0.33, 0.66]
  const clients: SprKey[] = ['laptop', 'desktop', 'laptopFront']
  return (
    <Scene
      ox={T07.ox}
      oy={T07.oy}
      tags={
        <>
          <Tag x={pb[0] - 60} y={pb[1] - 34} on={step >= 1} tone="brand">
            NFS
          </Tag>
          <Tag x={pb[0] + 50} y={pb[1] - 34} on={step >= 1} tone="brand">
            Kept On The Server
          </Tag>
          <Tag x={100} y={262} on={step >= 2} tone="brand">
            Every Mounting Client
          </Tag>
          <Tag x={235} y={340} on={rw} tone="brand">
            Read And Write The One Shared Copy
          </Tag>
        </>
      }
    >
      <Floor />
      <T07Wall concept />
      {lines.map((l, i) => (
        <Route key={i} points={l} color={colors.brand} width={2} head={false} op={step >= 2 ? 0.85 : 0} />
      ))}
      {rw &&
        lines.map((l, i) => (
          <g key={i}>
            <Dot points={l} t={(t + kicks[i]) % 1} r={4} />
            <Dot points={[...l].reverse()} t={(t + kicks[i] + 0.5) % 1} r={4} color={colors.teal} />
          </g>
        ))}
      {T07_P.map(([x, y], i) => (
        <Spr key={i} k={clients[i]} x={x} y={y} h={i === 1 ? 50 : 62} op={step >= 2 ? 1 : 0.35} flip={i === 0} />
      ))}
    </Scene>
  )
}

/* ------------------------------------------------------------------ T12 · a courier parcel */

/*
 * TR 12, speaker notes: "Use the courier parcel analogy: package, tracking label, contents declaration."
 * One parcel on the courier's counter, one object on the same spot: the package is the data, the tracking label
 * on its front is the key, the contents declaration on its side is the metadata. Pairs, one per press. Loop: a
 * scanner's line sweeps the label on both stages (the label and the key are what is read to find the item).
 */
const T12 = { ox: 230, oy: 168 } as const
const T12_C = { x: 0.3, y: 0.7, w: 3.9, d: 2.0, h: 0.62 } as const
const T12_B = { x: 1.25, y: 1.1, w: 1.8, d: 1.25, h: 1.15 } as const

function Counter({ concept }: { concept: boolean }) {
  const C = T12_C
  return (
    <g>
      <Shadow x={C.x} y={C.y} w={C.w} d={C.d} />
      <Box x={C.x} y={C.y} w={C.w} d={C.d} h={C.h} color={concept ? shade(ISO.steel, 0.3) : DESK} />
    </g>
  )
}

/** the parcel / the object: one block on the counter, its three parts drawn on its faces */
function Item({ concept, step }: { concept: boolean; step: number }) {
  const tr = useTr()
  const B = T12_B
  const z = T12_C.h
  const t = useLap(step >= 3, 2400, 0.5)
  const base = concept ? colors.brand : '#C99A62'
  /* front face (onLeft): a along +x 0..w*U, b down 0..h*U; the label / the key */
  const LW = 0.95 * UU
  const LH = 0.5 * UU
  const la = 0.42 * UU
  const lb = 0.36 * UU
  const sweep = la + 4 + (LW - 8) * (0.5 - 0.5 * Math.cos(t * Math.PI * 2))
  const label = (
    <g style={{ opacity: step >= 2 ? 1 : 0, transition: tr('opacity') }}>
      <rect x={la} y={lb} width={LW} height={LH} rx={3} fill={colors.white} stroke={concept ? shade(colors.brand, -0.3) : 'rgba(16,32,58,0.25)'} strokeWidth={0.8} />
      {concept ? (
        /* a key glyph: the object's key */
        <g transform={`translate(${la + 10} ${lb + LH / 2})`} stroke={colors.brand} strokeWidth={2.6} fill="none" strokeLinecap="round">
          <circle cx={0} cy={0} r={5.5} />
          <path d="M5.5 0 H24 M18 0 v5 M23 0 v4" />
        </g>
      ) : (
        /* a barcode: the tracking label */
        <g>
          {Array.from({ length: 14 }, (_, i) => (
            <rect key={i} x={la + 6 + i * 2.6} y={lb + 4} width={i % 3 === 0 ? 1.8 : 1} height={LH - 12} fill={ISO.ink} />
          ))}
        </g>
      )}
      <rect x={la + 6} y={lb + LH - 6} width={LW * 0.55} height={2} rx={1} fill={concept ? colors.brand : ISO.ink} opacity={0.6} />
      {step >= 3 && <rect x={sweep - 1} y={lb + 2} width={2} height={LH - 4} fill={colors.danger} opacity={0.7} />}
    </g>
  )
  /* right face (onRight): a along +y 0..d*U; the declaration in its pouch / the metadata sheet */
  const DW = 0.7 * UU
  const DH = 0.72 * UU
  const decl = (
    <g style={{ opacity: step >= 3 ? 1 : 0, transition: tr('opacity') }}>
      <rect x={0.28 * UU} y={0.2 * UU} width={DW} height={DH} rx={3} fill={concept ? '#EEF3FF' : 'rgba(235,244,255,0.92)'} stroke={concept ? shade(colors.brand, -0.3) : 'rgba(16,32,58,0.25)'} strokeWidth={0.8} />
      {[0.2, 0.36, 0.52, 0.68].map((k, i) => (
        <g key={k}>
          {concept && <rect x={0.28 * UU + 4} y={0.2 * UU + k * DH} width={7} height={3.2} rx={1.6} fill={colors.teal} />}
          <rect x={0.28 * UU + (concept ? 13 : 5)} y={0.2 * UU + k * DH} width={DW - (concept ? 18 : 10) - (i % 2) * 6} height={3.2} rx={1.6} fill={concept ? colors.brand : shade(ISO.slate, 0.2)} opacity={0.7} />
        </g>
      ))}
    </g>
  )
  /* top: the tape across the parcel / the object's bytes */
  const top = concept ? (
    <g style={{ opacity: step >= 1 ? 1 : 0.25, transition: tr('opacity') }}>
      {Array.from({ length: 5 }, (_, r) =>
        Array.from({ length: 7 }, (_, c) => <rect key={`${r}-${c}`} x={6 + c * 11} y={5 + r * 10} width={7} height={6} rx={1.5} fill={(r * 7 + c) % 3 ? colors.white : shade(colors.brand, 0.55)} opacity={0.85} />),
      )}
    </g>
  ) : (
    <rect x={0} y={B.d * UU * 0.42} width={B.w * UU} height={B.d * UU * 0.16} fill={shade('#C99A62', -0.25)} opacity={0.7} />
  )
  return (
    <g>
      <Box x={B.x} y={B.y} z={z} w={B.w} d={B.d} h={B.h} color={base} onLeft={label} onRight={decl} onTop={top} />
    </g>
  )
}

function T12Everyday({ step }: { step: number }) {
  const B = T12_B
  const z = T12_C.h
  const pTop = st(T12, B.x + B.w / 2, B.y + B.d / 2, z + B.h)
  const pFront = st(T12, B.x + 0.9, B.y + B.d, z + 0.2)
  const pSide = st(T12, B.x + B.w, B.y + 0.6, z + 0.3)
  const box = sv(B.x + B.w / 2, B.y + B.d / 2, z + B.h * 0.5)
  return (
    <Scene
      ox={T12.ox}
      oy={T12.oy}
      tags={
        <>
          <Tag x={pTop[0]} y={pTop[1] - 58} on={step >= 1}>
            Package
          </Tag>
          <Tag x={pFront[0] - 60} y={pFront[1] + 40} on={step >= 2}>
            Tracking Label
          </Tag>
          <Tag x={pSide[0] + 70} y={pSide[1] + 34} on={step >= 3}>
            Contents Declaration
          </Tag>
        </>
      }
    >
      <Floor />
      {/* the courier behind the counter, turned to the parcel */}
      <Spr k="man" x={3.7} y={0.25} h={150} />
      <Counter concept={false} />
      <Item concept={false} step={step} />
      <Halo x={box[0]} y={box[1]} r={58} on={step === 1} color={colors.accent} />
    </Scene>
  )
}

function T12Concept({ step }: { step: number }) {
  const B = T12_B
  const z = T12_C.h
  const pTop = st(T12, B.x + B.w / 2, B.y + B.d / 2, z + B.h)
  const pFront = st(T12, B.x + 0.9, B.y + B.d, z + 0.2)
  const pSide = st(T12, B.x + B.w, B.y + 0.6, z + 0.3)
  const box = sv(B.x + B.w / 2, B.y + B.d / 2, z + B.h * 0.5)
  return (
    <Scene
      ox={T12.ox}
      oy={T12.oy}
      tags={
        <>
          <Tag x={pTop[0]} y={pTop[1] - 58} on={step >= 1} tone="brand">
            Data
          </Tag>
          <Tag x={pFront[0] - 60} y={pFront[1] + 40} on={step >= 2} tone="brand">
            Key
          </Tag>
          <Tag x={pSide[0] + 70} y={pSide[1] + 34} on={step >= 3} tone="brand">
            Metadata
          </Tag>
        </>
      }
    >
      <Floor />
      <Counter concept />
      <Item concept step={step} />
      <Halo x={box[0]} y={box[1]} r={58} on={step === 1} />
    </Scene>
  )
}

/* ------------------------------------------------------------------ T17 · a bank locker */

/*
 * TR 17: "At a bank, you give the locker number and say what you want to do (open, put in, or close it), and the
 * bank checks your ID before acting, just as a REST call names the object key and HTTP verb, and S3 checks the
 * signature before acting."
 * The locker wall is the bucket's wall of objects; the customer stands where the client stands; the bank
 * officer's desk is where S3's check sits. Pairs: 1 the one numbered locker / the one key; 2 open, put in or
 * close / the HTTP verb riding the request; 3 the ID checked first / the signature checked first.
 * Loop: the request rides to the object; the locker door swings ajar and back.
 */
const T17 = { ox: 214, oy: 140 } as const
const T17_WALL = { x: 0.2, y: 0.0, w: 3.0, d: 0.5, h: 2.1 } as const
const T17_COLS = 4
const T17_ROWS = 4
const T17_HIT = { c: 2, r: 1 } as const
const T17_CUST: GridPt = [1.6, 2.15]
const T17_DESK = { x: 3.55, y: 1.0, w: 0.9, d: 0.7, h: 0.62 } as const
const T17_OFF: GridPt = [4.35, 0.55]

function LockerFace({ concept, open, lit }: { concept: boolean; open: number; lit: boolean }) {
  const W = T17_WALL.w * UU
  const H = T17_WALL.h * UU
  const pad = 10
  const cw = (W - pad * 2) / T17_COLS
  const rh = (H - pad * 2) / T17_ROWS
  return (
    <g>
      {Array.from({ length: T17_ROWS }, (_, r) =>
        Array.from({ length: T17_COLS }, (_, c) => {
          const hit = c === T17_HIT.c && r === T17_HIT.r
          const x = pad + c * cw + 2
          const y = pad + r * rh + 2
          const w = cw - 4
          const h = rh - 4
          const fill = concept ? (hit && lit ? colors.white : shade(colors.brand, 0.2)) : hit && lit ? '#F2C14E' : shade(ISO.steel, 0.25)
          if (hit && !concept) {
            /* the numbered locker: its door swings ajar (open 0..1) onto the dark inside */
            const dw = w * (1 - 0.62 * open)
            return (
              <g key={`${r}-${c}`}>
                <rect x={x} y={y} width={w} height={h} rx={2} fill={shade(ISO.ink, 0.25)} />
                <rect x={x + 4} y={y + h - 12} width={w * 0.5} height={8} rx={1.5} fill="#E6C27A" opacity={open > 0.2 ? 1 : 0} />
                <path d={`M${x} ${y} L${x + dw} ${y - 6 * open} L${x + dw} ${y + h + 6 * open} L${x} ${y + h} Z`} fill={fill} stroke={shade(ISO.ink, 0.1)} strokeWidth={0.8} />
                <rect x={x + dw * 0.3} y={y + 5} width={dw * 0.4} height={6} rx={1.5} fill={colors.white} opacity={0.9} />
                <circle cx={x + dw - 6} cy={y + h / 2} r={2.2} fill={ISO.ink} />
              </g>
            )
          }
          return (
            <g key={`${r}-${c}`}>
              <rect x={x} y={y} width={w} height={h} rx={2} fill={fill} stroke={concept ? shade(colors.brand, -0.25) : shade(ISO.steel, -0.2)} strokeWidth={0.8} />
              {concept ? (
                <g opacity={hit && lit ? 1 : 0.55}>
                  {/* each cell holds one object: a small document glyph */}
                  <path d={`M${x + w / 2 - 6} ${y + h / 2 - 8} h8 l4 4 v12 h-12 z`} fill={hit && lit ? colors.brand : colors.white} />
                </g>
              ) : (
                <>
                  <rect x={x + w * 0.3} y={y + 5} width={w * 0.4} height={6} rx={1.5} fill={colors.white} opacity={0.8} />
                  <circle cx={x + w - 6} cy={y + h / 2} r={2.2} fill={ISO.ink} />
                </>
              )}
            </g>
          )
        }),
      )}
    </g>
  )
}

/** a small upright card (an ID card) in screen px, on a desk */
function IdCard({ x, y }: { x: number; y: number }) {
  return (
    <g style={{ filter: 'drop-shadow(0 3px 2px rgba(16,32,58,0.2))' }}>
      <rect x={x - 17} y={y - 22} width={34} height={22} rx={3} fill={colors.white} stroke={colors.brand} strokeWidth={1.2} />
      <rect x={x - 17} y={y - 22} width={34} height={6} rx={2} fill={colors.brand} />
      <circle cx={x - 9} cy={y - 8} r={4} fill={shade(ISO.slate, 0.3)} />
      <rect x={x - 2} y={y - 11} width={14} height={2.4} rx={1.2} fill={shade(ISO.slate, 0.3)} />
      <rect x={x - 2} y={y - 6} width={10} height={2.4} rx={1.2} fill={shade(ISO.slate, 0.3)} />
    </g>
  )
}

function T17Wall({ concept, open, lit }: { concept: boolean; open: number; lit: boolean }) {
  const W = T17_WALL
  return (
    <g>
      <Shadow x={W.x} y={W.y} w={W.w} d={W.d + 0.15} />
      <Box x={W.x} y={W.y} w={W.w} d={W.d} h={W.h} color={concept ? colors.brand : shade(ISO.steel, 0.35)} onLeft={<LockerFace concept={concept} open={open} lit={lit} />} />
    </g>
  )
}

/** where the numbered locker sits, for tags and routes: its centre on the wall's front face */
const T17_HITPT: [number, number, number] = [T17_WALL.x + (10 / UU) + (T17_HIT.c + 0.5) * ((T17_WALL.w - 20 / UU) / T17_COLS), T17_WALL.y + T17_WALL.d, T17_WALL.h - (10 / UU) - (T17_HIT.r + 0.5) * ((T17_WALL.h - 20 / UU) / T17_ROWS)]

function T17Everyday({ step }: { step: number }) {
  const t = useLap(step >= 2, 4200, 0.35)
  /* the door: ajar and back, a smooth swing each lap; held open on the still frame */
  const open = step >= 2 ? sm(Math.min(1, Math.sin(t * Math.PI) * 1.6)) : 0
  const hp = st(T17, T17_HITPT[0], T17_HITPT[1], T17_HITPT[2])
  const D = T17_DESK
  const card = sv(D.x + D.w / 2, D.y + D.d / 2, D.h)
  const pc = st(T17, T17_CUST[0], T17_CUST[1], 0)
  return (
    <Scene
      ox={T17.ox}
      oy={T17.oy}
      tags={
        <>
          <Tag x={hp[0] + 6} y={hp[1] - 76} on={step >= 1}>
            Locker Number
          </Tag>
          <Tag x={pc[0] - 30} y={pc[1] + 14} on={step >= 2}>
            Open, Put In, Or Close
          </Tag>
          <Tag x={300} y={340} on={step >= 3} tone="good">
            Bank Checks Your ID Before Acting
          </Tag>
        </>
      }
    >
      <Floor w={5.0} />
      <T17Wall concept={false} open={open} lit={step >= 1} />
      {/* the bank officer behind the desk, turned to the customer */}
      <Spr k="mansuit" x={T17_OFF[0]} y={T17_OFF[1]} h={142} flip />
      <Shadow x={D.x} y={D.y} w={D.w} d={D.d} />
      <Box x={D.x} y={D.y} w={D.w} d={D.d} h={D.h} color={DESK} />
      <g style={{ opacity: step >= 3 ? 1 : 0, transition: 'opacity 520ms' }}>
        <IdCard x={card[0]} y={card[1]} />
      </g>
      <Tick x={card[0] + 24} y={card[1] - 30} on={step >= 3} r={10} />
      <Spr k="woman" x={T17_CUST[0]} y={T17_CUST[1]} h={140} />
    </Scene>
  )
}

function T17Concept({ step }: { step: number }) {
  const t = useLap(step >= 2, 2600, 0.55)
  const hp = st(T17, T17_HITPT[0], T17_HITPT[1], T17_HITPT[2])
  const D = T17_DESK
  const pc = st(T17, T17_CUST[0], T17_CUST[1], 0)
  const s3 = sv(D.x + D.w / 2, D.y + D.d / 2, D.h)
  /* the request: from the client, past S3's check, to the one object */
  const req: GridPt[] = [
    [T17_CUST[0] + 0.25, T17_CUST[1] - 0.3],
    [D.x + 0.2, D.y + D.d + 0.25],
    [D.x + 0.1, T17_WALL.d + 0.5],
    [T17_HITPT[0], T17_WALL.d + 0.1],
  ]
  return (
    <Scene
      ox={T17.ox}
      oy={T17.oy}
      tags={
        <>
          <Tag x={hp[0] + 6} y={hp[1] - 76} on={step >= 1} tone="brand">
            Object Key
          </Tag>
          <Tag x={pc[0] - 30} y={pc[1] + 14} on={step >= 2} tone="brand">
            HTTP Verb
          </Tag>
          <Tag x={300} y={340} on={step >= 3} tone="good">
            S3 Checks The Signature Before Acting
          </Tag>
        </>
      }
    >
      <Floor w={5.0} />
      <T17Wall concept open={0} lit={step >= 1} />
      {/* the bucket's own mark on top of its wall of objects */}
      <Mark src={mBucket} x={T17_WALL.x + 0.5} y={T17_WALL.y + 0.25} z={T17_WALL.h} h={40} />
      <Route points={req} color={colors.brand} width={2.2} op={step >= 2 ? 1 : 0} />
      {step >= 2 && [0, 0.5].map((k) => <Dot key={k} points={req} t={(t + k) % 1} r={4.2} />)}
      <Shadow x={D.x} y={D.y} w={D.w} d={D.d} />
      <Box x={D.x} y={D.y} w={D.w} d={D.d} h={D.h} color={shade(ISO.steel, 0.3)} />
      <Mark src={mS3} x={D.x + D.w / 2} y={D.y + D.d / 2} z={D.h} h={50} ring={step >= 3 ? colors.success : undefined} />
      <Tick x={s3[0] + 30} y={s3[1] - 52} on={step >= 3} r={10} />
      <Spr k="laptop" x={T17_CUST[0]} y={T17_CUST[1]} h={66} />
    </Scene>
  )
}

/* ------------------------------------------------------------------ T18 · a movie ticket QR code */

/*
 * TR 18: "A movie ticket booked online gives you a QR code that lets you into one show at one time, without making
 * you a theatre staff member. Once the show time passes, the QR code stops working, just as a presigned URL lets
 * its holder reach one object for a limited time without ever receiving the owner's AWS credentials."
 * The cinema's entrance is the bucket; the one screen is the one object; the show clock is the limited time (it keeps turning after
 * the window, so the frame never freezes); the staff badge (not given) is the owner's credentials (not given). Pairs: 1 the ticket booked online with its QR
 * code / the presigned URL; 2 one show at one time / one object for a limited time; 3 no staff badge, and the QR
 * stops once the show time passes / no AWS credentials, and the link expires. Loop: the clock's hand turns on.
 */
const T18 = { ox: 230, oy: 138 } as const
const T18_WALL = { x: 0.3, y: 0.0, w: 3.7, d: 0.3, h: 2.05 } as const
const T18_HOLD: GridPt = [1.1, 2.2]
const T18_BADGE: GridPt = [3.4, 2.7]

function CinemaFace({ concept, lit }: { concept: boolean; lit: boolean }) {
  const W = T18_WALL.w * UU
  /* the one screen / the one object, in the wall's middle, and the doors beside it */
  const sx = W * 0.3
  const sw = W * 0.4
  return (
    <g>
      <rect x={sx - 4} y={14} width={sw + 8} height={58} rx={5} fill={concept ? shade(colors.brand, -0.3) : '#1E2A55'} />
      <rect x={sx} y={18} width={sw} height={50} rx={3} fill={concept ? colors.white : lit ? '#3B5BDB' : '#2A3A73'} stroke={lit ? '#F2C14E' : 'none'} strokeWidth={lit ? 2 : 0} />
      {concept ? (
        <path d={`M${sx + sw / 2 - 12} 26 h16 l8 8 v26 h-24 z`} fill={colors.brand} />
      ) : (
        <path d={`M${sx + sw / 2 - 8} ${30} L${sx + sw / 2 + 12} ${43} L${sx + sw / 2 - 8} ${56} Z`} fill={colors.white} />
      )}
      {[0.08, 0.76].map((k) => (
        <g key={k}>
          <rect x={W * k} y={58} width={W * 0.16} height={56} rx={2} fill={concept ? shade(colors.brand, -0.15) : '#8E3B3B'} />
          <circle cx={W * k + W * 0.13} cy={88} r={2} fill={colors.white} />
        </g>
      ))}
    </g>
  )
}

/** a phone held up, its screen a QR code (or a link), in screen px; `dead` greys it with the code struck */
function Phone({ x, y, concept, dead }: { x: number; y: number; concept: boolean; dead: boolean }) {
  const tr = useTr()
  const w = 40
  const h = 66
  const cells = [
    [1, 1, 1, 0, 1, 1, 1],
    [1, 0, 1, 0, 0, 0, 1],
    [1, 1, 1, 0, 1, 0, 1],
    [0, 0, 0, 1, 0, 1, 0],
    [1, 1, 1, 0, 1, 1, 0],
    [1, 0, 1, 1, 0, 0, 1],
    [1, 1, 1, 0, 1, 0, 1],
  ]
  return (
    <g style={{ filter: 'drop-shadow(0 6px 5px rgba(16,32,58,0.25))' }}>
      <rect x={x - w / 2} y={y - h} width={w} height={h} rx={7} fill="#1F2A44" />
      <rect x={x - w / 2 + 3} y={y - h + 6} width={w - 6} height={h - 12} rx={3} fill={colors.white} />
      <g style={{ opacity: dead ? 0.35 : 1, transition: tr('opacity') }}>
        {concept ? (
          <g transform={`translate(${x} ${y - h / 2})`} stroke={colors.brand} strokeWidth={3} fill="none" strokeLinecap="round">
            <path d="M-3 -6 l-4 0 a6 6 0 0 0 0 12 l4 0 M3 -6 l4 0 a6 6 0 0 1 0 12 l-4 0 M-5 0 h10" />
          </g>
        ) : (
          cells.map((row, r) => row.map((v, c) => (v ? <rect key={`${r}-${c}`} x={x - 14 + c * 4} y={y - h / 2 - 14 + r * 4} width={4} height={4} fill={ISO.ink} /> : null)))
        )}
      </g>
    </g>
  )
}

/** the show clock / the expiry clock, hand turning (svg px) */
function ShowClock({ x, y, t, concept }: { x: number; y: number; t: number; concept: boolean }) {
  const a = t * Math.PI * 2
  const R = 17
  return (
    <g style={{ filter: 'drop-shadow(0 4px 3px rgba(16,32,58,0.2))' }}>
      <circle cx={x} cy={y} r={R + 3} fill={concept ? colors.brand : '#1E2A55'} />
      <circle cx={x} cy={y} r={R} fill={colors.white} />
      {/* the window it is valid for: a shaded wedge from the start to the end time */}
      <path d={`M${x} ${y} L${x} ${y - R + 2} A${R - 2} ${R - 2} 0 0 1 ${x + (R - 2)} ${y} Z`} fill={concept ? colors.brand : '#F2C14E'} opacity={0.3} />
      <line x1={x} y1={y} x2={x + (R - 4) * Math.sin(a)} y2={y - (R - 4) * Math.cos(a)} stroke={ISO.ink} strokeWidth={1.8} strokeLinecap="round" />
      <line x1={x} y1={y} x2={x + 8 * Math.sin(a / 12 + 1.2)} y2={y - 8 * Math.cos(a / 12 + 1.2)} stroke={ISO.ink} strokeWidth={2.4} strokeLinecap="round" />
      <circle cx={x} cy={y} r={2} fill={ISO.ink} />
    </g>
  )
}

/** the staff badge on a lanyard (everyday) / the owner's credentials as a key (concept), screen px */
function Badge({ x, y, concept }: { x: number; y: number; concept: boolean }) {
  return concept ? (
    <g transform={`translate(${x} ${y})`} style={{ filter: 'drop-shadow(0 4px 3px rgba(16,32,58,0.2))' }}>
      <circle cx={-12} cy={0} r={10} fill="#F2C14E" stroke={shade('#F2C14E', -0.3)} strokeWidth={1.2} />
      <circle cx={-12} cy={0} r={3.5} fill={colors.white} />
      <path d="M-2 -3 h26 v6 h-4 v6 h-5 v-6 h-3 v4 h-5 v-4 h-9 z" fill="#F2C14E" stroke={shade('#F2C14E', -0.3)} strokeWidth={1.2} />
    </g>
  ) : (
    <g transform={`translate(${x} ${y})`} style={{ filter: 'drop-shadow(0 4px 3px rgba(16,32,58,0.2))' }}>
      <path d="M-10 -34 L0 -14 L10 -34" fill="none" stroke={colors.danger} strokeWidth={2.4} />
      <rect x={-15} y={-16} width={30} height={38} rx={4} fill={colors.white} stroke={shade(ISO.slate, 0.2)} strokeWidth={1} />
      <rect x={-15} y={-16} width={30} height={9} rx={3} fill="#8E3B3B" />
      <circle cx={0} cy={3} r={6} fill={shade(ISO.slate, 0.35)} />
      <rect x={-9} y={12} width={18} height={3} rx={1.5} fill={shade(ISO.slate, 0.35)} />
    </g>
  )
}

function T18Stage({ step, concept }: { step: number; concept: boolean }) {
  const t = useLap(step >= 2, 9000, 0.4)
  const W = T18_WALL
  const ck = sv(W.x + W.w - 0.15, W.y + W.d, 2.05)
  const bd = sv(T18_BADGE[0], T18_BADGE[1], 0.9)
  const scr = sv(W.x + W.w * 0.5, W.y + W.d, W.h - 0.2)
  return (
    <g>
      <Floor />
      <Shadow x={W.x} y={W.y} w={W.w} d={W.d + 0.15} />
      <Box x={W.x} y={W.y} w={W.w} d={W.d} h={W.h} color={concept ? colors.brand : shade('#2A3A73', 0.12)} onLeft={<CinemaFace concept={concept} lit={step >= 2} />} />
      {/* the entry gate before the screen: a low rail on the floor */}
      <Box x={1.9} y={1.2} w={1.3} d={0.14} h={0.5} color={concept ? shade(ISO.steel, 0.3) : shade(ISO.steel, 0.15)} />
      <Halo x={scr[0]} y={scr[1] - 20} r={40} on={step === 2} color={concept ? colors.brand : '#F2C14E'} />
      <ShowClock x={ck[0]} y={ck[1]} t={t} concept={concept} />
      <g style={{ opacity: step >= 3 ? 1 : 0, transition: 'opacity 520ms' }}>
        <Badge x={bd[0]} y={bd[1]} concept={concept} />
      </g>
      <Cross x={bd[0] + 18} y={bd[1] - 20} on={step >= 3} r={10} />
    </g>
  )
}

/** the phone held up in the holder's hand, drawn in front of them */
function T18Phone({ step, concept }: { step: number; concept: boolean }) {
  const [fx, fy] = sv(T18_HOLD[0], T18_HOLD[1], 0)
  const x = fx + 40
  const y = fy - 62
  return (
    <g>
      <Phone x={x} y={y} concept={concept} dead={step >= 3} />
      <Cross x={x + 20} y={y - 64} on={step >= 3} r={10} />
    </g>
  )
}

function T18Everyday({ step }: { step: number }) {
  return (
    <Scene
      ox={T18.ox}
      oy={T18.oy}
      tags={
        <>
          <Tag x={124} y={260} on={step >= 1}>
            A Movie Ticket Booked Online
          </Tag>
          <Tag x={72} y={124} on={step >= 1}>
            QR Code
          </Tag>
          <Tag x={318} y={16} on={step >= 2}>
            Into One Show At One Time
          </Tag>
          <Tag x={235} y={302} on={step >= 3} tone="bad">
            Without Making You A Theatre Staff Member
          </Tag>
          <Tag x={235} y={342} on={step >= 3} tone="bad">
            Stops Working Once The Show Time Passes
          </Tag>
        </>
      }
    >
      <T18Stage step={step} concept={false} />
      <Spr k="visitor" x={T18_HOLD[0]} y={T18_HOLD[1]} h={140} flip />
      <T18Phone step={step} concept={false} />
    </Scene>
  )
}

function T18Concept({ step }: { step: number }) {
  return (
    <Scene
      ox={T18.ox}
      oy={T18.oy}
      tags={
        <>
          <Tag x={72} y={124} on={step >= 1} tone="brand">
            Presigned URL
          </Tag>
          <Tag x={318} y={16} on={step >= 2} tone="brand">
            One Object
          </Tag>
          <Tag x={388} y={170} on={step >= 2} tone="brand">
            For A Limited Time
          </Tag>
          <Tag x={235} y={302} on={step >= 3} tone="bad">
            Without The Owner&apos;s AWS Credentials
          </Tag>
          <Tag x={235} y={342} on={step >= 3} tone="bad">
            Expires
          </Tag>
        </>
      }
    >
      <T18Stage step={step} concept />
      <Spr k="man" x={T18_HOLD[0]} y={T18_HOLD[1]} h={140} flip />
      <T18Phone step={step} concept />
    </Scene>
  )
}

/* ------------------------------------------------------------------ exports */

export const figures = {
  F_T01Everyday: T01Everyday,
  F_T01Concept: T01Concept,
  F_T07Everyday: T07Everyday,
  F_T07Concept: T07Concept,
  F_T12Everyday: T12Everyday,
  F_T12Concept: T12Concept,
  F_T17Everyday: T17Everyday,
  F_T17Concept: T17Concept,
  F_T18Everyday: T18Everyday,
  F_T18Concept: T18Concept,
}

export const slides = {}

export const css = `
@keyframes f7-ring { 0% { transform: scale(0.85); opacity: 0.6 } 100% { transform: scale(1.3); opacity: 0 } }
.f7-ring { animation: f7-ring 2s linear infinite; transform-box: fill-box; }
@keyframes f7-lean { 0% { transform: rotate(0deg) translateX(0) } 25% { transform: rotate(-1.4deg) translateX(-1px) } 50% { transform: rotate(0deg) translateX(0) } 75% { transform: rotate(1.2deg) translateX(1px) } 100% { transform: rotate(0deg) translateX(0) } }
.f7-lean { animation: f7-lean 3.4s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
.f7-lean.f7-d1 { animation-delay: -1.1s } .f7-lean.f7-d2 { animation-delay: -2.2s }
@keyframes f7-blink { 0%, 100% { opacity: 1 } 50% { opacity: 0.3 } }
.f7-blink { animation: f7-blink 1.4s ease-in-out infinite; }
.cc-still .f7-ring, .deck-thumb .f7-ring { animation: none !important; opacity: 0 }
.cc-still .f7-lean, .deck-thumb .f7-lean, .cc-still .f7-blink, .deck-thumb .f7-blink { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .f7-ring, .f7-lean, .f7-blink { animation: none !important; } }
`
