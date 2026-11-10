import { useEffect, useState, type ReactNode } from 'react'
import { animate } from 'framer-motion'
import { colors } from '@/design/tokens'
import { MOTION, motionHeld } from '@/motion/tokens'
import { useInstant } from '@/motion/instant'
import { SPEED } from '@/deck/autoAnim'
import { At, Label, Num, type LabelTone } from '@/decks/figures/scene'
import { Box, ISO, IsoScene, IsoSvg, P, Quad, Shadow, measure, along, pts, screenPts, shade, type GridPt } from '@/decks/figures/iso/iso'
import { iconUrl } from '@/decks/figures/net/fx'
import pMan from './ppl/man.png'
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
 * BUILDER F · THE FIVE ANALOGY SLIDES OF "BLOCK, FILE & OBJECT STORAGE" (rebuilt 2026-11-06 as full environments).
 *
 * ONE LOOK FOR ALL TEN STAGES. Every stage is the same isometric room shell (`Room`: one camera, one grid unit,
 * one 5.2 x 4 floor, two back walls), lit from the top-left (the iso solids' fixed shading: top lightest, left face
 * base, right face darker; soft contact shadows under every object). The everyday stage is a real place furnished
 * with recognisable props (an office desk area, an office corridor, a courier counter, a bank vault, a cinema lobby);
 * the concept stage is the SAME room translated into a clean data-centre room (racks, a cable tray, a cooling unit,
 * a tiled raised floor), with the official AWS marks on white tiles standing exactly where the everyday parts stand.
 * Palette: the deck tokens (royal blue dominant on white, small warm accents); people are the 3D library renders.
 * Clean plate behind the room, no grid lines (rule 59).
 *
 * LINKS. A tag keeps the TR clause it had (Title Case on every word, rule 56) and carries a numbered badge (the
 * engine's `Num`): the same number on the everyday tag and on its concept tag, with a short leader from the tag to
 * the part it names. Review round 2026-11-06 (user): no tags along the top of a stage; slide 19 has only a
 * `Technical` tag; slide 27 keeps the concept tags (no badges) and one TR sentence; slide 36 has no tags.
 *
 * MOTION (user, 2026-11-06: subtle, purposeful, tied to the concept, no decorative or looping motion). Tags reveal
 * pair by pair on the layout's ONE build track (`step` 0..3), the same press on both stages. Each press may start
 * ONE one-shot motion that shows what it reveals (`useOnce`, framer-motion on the shared `MOTION` tokens): a data
 * block rides the cable once, a note is pinned once, one write and one read ride the mount lines, the label is
 * scanned once, the locker door opens once, the request rides once, the gate accepts the code once and the clock
 * moves past the window once at expiry. Nothing loops. `?still`, thumbnails and prefers-reduced-motion show the
 * end state at once (`motionHeld(useInstant())`); a flow dot fades out at its end, so no dot is left behind.
 */

/* ------------------------------------------------------------------ shared motion and frame values */

const SW = 470
const SH = 390
const UU = 42
/** sprites and marks are sized for a 38 px grid unit; they scale with the camera */
const K = UU / 38
/** the engine's shared motion tokens (`src/motion/tokens.ts`): one reveal, one ease, one flow ride */
const REVEAL_MS = MOTION.reveal
const EASE = MOTION.ease
/** one-shot durations (ms), from the shared tokens: a flow dot's ride, the slow ride for time passing, a door opening */
const ONCE = { flow: MOTION.flow.dur * 1000, slow: MOTION.flow.slow * 1000, door: MOTION.reveal * 2, scan: MOTION.flow.dur * 500 }
/** MOTION.ease as framer-motion's bezier array */
const EASE_ARR = MOTION.ease.replace(/[^0-9.,]/g, '').split(',').map(Number) as [number, number, number, number]

/** the room shell, the same for every stage */
const R = { W: 5.2, D: 4.0, H: 2.3 } as const
const O = { ox: 212, oy: 122 } as const

/* the two room palettes: an everyday room and its data-centre twin */
const PAL = {
  wall: '#F3F6FC',
  wallDc: '#E7EEFB',
  floor: '#E3E9F4',
  floorDc: '#D6E1F4',
  tileDc: '#CCD9F0',
  base: '#C9D3E6',
  wood: '#D9B48A',
  rug: '#F3E6D2',
  navy: '#22346E',
  rack: '#1F2E63',
  glass: '#CFE3FF',
  kraft: '#C99A62',
  leaf: '#5DBB7A',
  gold: '#F2C14E',
} as const

function useHeld() {
  return motionHeld(useInstant())
}

function useTr(ms = REVEAL_MS) {
  const instant = useInstant()
  return (p: string) => (instant ? 'none' : `${p} ${ms}ms ${EASE}`)
}

/**
 * A ONE-SHOT progress 0..1 (framer-motion, the engine's motion library): it starts when `on` turns true (the
 * build press that reveals the part), runs once over `ms` on the shared ease, and stays at 1. 0 while off.
 * On every held frame (`?still`, thumbnails, prefers-reduced-motion) it is the end state at once, nothing moving.
 */
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

/** ease in and out over 0..1 */
const sm = (k: number) => {
  const c = Math.min(1, Math.max(0, k))
  return c * c * (3 - 2 * c)
}

/** grid point to scene-svg px (inside IsoSvg) */
const sv = (x: number, y: number, z = 0): [number, number] => P(x, y, z, UU)
/** grid point to stage px (for a tag's leader target) */
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
  laptop: [iconUrl('laptop'), 192 / 182],
  laptopFront: [iconUrl('laptop-front'), 241 / 168],
  desktop: [iconUrl('desktop'), 256 / 162],
  files: [iconUrl('files'), 256 / 182],
} as const
type SprKey = keyof typeof SPR

/** A sprite standing on grid (x, y, z): bottom centre on that point, `h` px tall, a soft contact shadow under it. */
function Spr({ k, x, y, z = 0, h, op = 1, cls, flip = false, shadow = true }: { k: SprKey; x: number; y: number; z?: number; h: number; op?: number; cls?: string; flip?: boolean; shadow?: boolean }) {
  const tr = useTr()
  const [px, py] = sv(x, y, z)
  const [src, ar] = SPR[k]
  h = h * K
  const w = h * ar
  return (
    <g style={{ opacity: op, transition: tr('opacity') }}>
      {shadow && <ellipse cx={px} cy={py - 1} rx={w * 0.34} ry={w * 0.1} fill={ISO.slate} opacity={0.2} />}
      <g className={cls}>
        <image href={src} x={px - w / 2} y={py - h} width={w} height={h} preserveAspectRatio="xMidYMax meet" transform={flip ? `translate(${px * 2} 0) scale(-1 1)` : undefined} style={{ filter: 'drop-shadow(0 4px 3px rgba(16,32,58,0.18))' }} />
      </g>
    </g>
  )
}

/** An official AWS mark (rule 54) on its white tile (r 0.27, mark 76 %), standing upright on grid (x, y, z). */
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
 * A LINKED TAG: the TR's words in a chip with its link number (the same number on the everyday tag and its
 * concept tag), centred on `x`, top at `y` (stage px), and a short leader to `to` (the part it names) that ends
 * in a small dot. The leader is drawn under the chip, so it starts at the chip's edge.
 */
function Tag({ n, x, y, to, on = true, tone = 'plain', children }: { n?: number; x: number; y: number; to?: [number, number]; on?: boolean; tone?: LabelTone; children: ReactNode }) {
  const tr = useTr()
  const ink = tone === 'bad' ? colors.danger : tone === 'good' ? colors.success : colors.brand
  return (
    <>
      {to && (
        <svg className="pointer-events-none absolute inset-0 overflow-visible" width={SW} height={SH} aria-hidden style={{ opacity: on ? 1 : 0, transition: tr('opacity') }}>
          <line x1={x} y1={y + 12} x2={to[0]} y2={to[1]} stroke={ink} strokeWidth={1.4} strokeLinecap="round" opacity={0.75} />
          <circle cx={to[0]} cy={to[1]} r={4} fill={ink} stroke={colors.white} strokeWidth={1.6} />
        </svg>
      )}
      <At x={x} y={y} cx>
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

/** a one-sentence explanation in a rounded box (not a pill), sentence case, wrapping inside `w`, centred on `x` */
function Explain({ x, y, w, on = true, children }: { x: number; y: number; w: number; on?: boolean; children: ReactNode }) {
  const tr = useTr()
  return (
    <At x={x} y={y} cx w={w}>
      <div
        className="rounded-[12px] px-4 py-2 text-center font-medium leading-snug"
        style={{ fontSize: 15, color: colors.ink, background: colors.white, boxShadow: `inset 0 0 0 1.5px ${colors.brand}, 0 8px 16px -10px rgba(16,32,58,0.35)`, opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(6px)', transition: `${tr('opacity')}, ${tr('transform')}` }}
      >
        {children}
      </div>
    </At>
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

/** A route on the floor (grid points), thin and solid, its head on the last point when `head`. */
function Route({ points, z = 0.05, color = colors.brand, width = 2.2, head = true, op = 1 }: { points: GridPt[]; z?: number; color?: string; width?: number; head?: boolean; op?: number }) {
  const tr = useTr()
  const q = screenPts(points, z, UU)
  const d = q.map(([a, b], i) => `${i ? 'L' : 'M'}${a.toFixed(2)} ${b.toFixed(2)}`).join(' ')
  let tip: ReactNode = null
  if (head && q.length >= 2) {
    const [ax, ay] = q[q.length - 2]
    const [bx, by] = q[q.length - 1]
    const ang = Math.atan2(by - ay, bx - ax)
    const L = 9
    const W = 4.2
    const p1: [number, number] = [bx - L * Math.cos(ang) + W * Math.sin(ang), by - L * Math.sin(ang) - W * Math.cos(ang)]
    const p2: [number, number] = [bx - L * Math.cos(ang) - W * Math.sin(ang), by - L * Math.sin(ang) + W * Math.cos(ang)]
    tip = <polygon points={pts([[bx, by], p1, p2])} fill={color} />
  }
  return (
    <g style={{ opacity: op, transition: tr('opacity') }}>
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      {tip}
    </g>
  )
}

/** A dot riding a route at phase `t` (0..1), fading in and out at the ends. */
function Dot({ points, t, z = 0.18, color = colors.brand, r = 4, on = true }: { points: GridPt[]; t: number; z?: number; color?: string; r?: number; on?: boolean }) {
  const q = screenPts(points, z, UU)
  const { seg, len } = measure(q)
  const tt = Math.min(1, Math.max(0, t))
  const [hx, hy] = along(q, seg, tt * len)
  const [tx, ty] = along(q, seg, Math.max(0, tt * len - 12))
  const edge = Math.min(1, Math.min(tt, 1 - tt) / 0.08)
  return (
    <g opacity={on ? edge : 0}>
      <line x1={tx} y1={ty} x2={hx} y2={hy} stroke={color} strokeWidth={r * 0.9} strokeLinecap="round" opacity={0.35} />
      <circle cx={hx} cy={hy} r={r} fill={color} stroke={colors.white} strokeWidth={1.4} />
    </g>
  )
}

/** a soft highlight on the part this press names (svg px): it fades in on its press and out on the next, no loop */
function Halo({ x, y, r, on, color = colors.brand }: { x: number; y: number; r: number; on: boolean; color?: string }) {
  const tr = useTr()
  return (
    <g style={{ opacity: on ? 1 : 0, transition: tr('opacity') }}>
      <circle cx={x} cy={y} r={r} fill={color} opacity={0.1} />
      <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={1.6} opacity={0.45} />
    </g>
  )
}

/* ------------------------------------------------------------------ the room shell and its furniture */

/**
 * THE ROOM: a floor and two back walls (A along x at the back, B along y on the left), the same on every stage.
 * `a` / `b` decorate wall A's and wall B's room-facing faces, in face px: wall A `a` runs along +x (0..W*U),
 * wall B along +y (0..D*U), `b` down from the wall's top (0..H*U).
 */
function Room({ dc, a, b, floor }: { dc: boolean; a?: ReactNode; b?: ReactNode; floor?: ReactNode }) {
  const wall = dc ? PAL.wallDc : PAL.wall
  const T = 0.16
  const tiles: ReactNode[] = []
  if (dc) {
    /* the raised floor: a soft two-tone checker of panels, no lines (rule 59) */
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

/** a window on a wall face (face px), sky glass with mullions */
const WindowFace = ({ a, b, w, h }: { a: number; b: number; w: number; h: number }) => (
  <g>
    <rect x={a - 4} y={b - 4} width={w + 8} height={h + 8} rx={3} fill={colors.white} stroke={PAL.base} strokeWidth={1} />
    <rect x={a} y={b} width={w} height={h} rx={2} fill={PAL.glass} />
    <path d={`M${a} ${b + h * 0.7} L${a + w * 0.45} ${b + h * 0.35} L${a + w * 0.7} ${b + h * 0.55} L${a + w} ${b + h * 0.3} L${a + w} ${b + h} L${a} ${b + h} Z`} fill="#B5D3F8" />
    <rect x={a + w / 2 - 1.5} y={b} width={3} height={h} fill={colors.white} />
    <rect x={a} y={b + h / 2 - 1.5} width={w} height={3} fill={colors.white} />
    <rect x={a - 8} y={b + h + 3} width={w + 16} height={5} rx={1.5} fill={PAL.base} />
  </g>
)

/** a door on a wall face (face px) */
const DoorFace = ({ a, w, color = shade(PAL.wood, -0.1) }: { a: number; w: number; color?: string }) => (
  <g>
    <rect x={a - 3} y={0.55 * UU - 3} width={w + 6} height={R.H * UU - 0.55 * UU + 3} rx={2} fill={colors.white} stroke={PAL.base} />
    <rect x={a} y={0.55 * UU} width={w} height={R.H * UU - 0.55 * UU - 0.12 * UU} rx={1.5} fill={color} />
    <circle cx={a + w - 6} cy={1.4 * UU} r={2.4} fill={PAL.gold} />
  </g>
)

/** a server rack standing against wall A (grid), LED rows on its front, vents on its side */
function Rack({ x, y = 0, w = 0.9, d = 0.6, h = 2.0 }: { x: number; y?: number; w?: number; d?: number; h?: number }) {
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
                <circle cx={9} cy={10 + r * 12} r={1.6} fill={r % 3 ? ISO.green : colors.brand} />
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

/** a cable tray high on wall B, cables in deck colours */
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

/** a cooling unit against wall B (grid) */
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
            <rect x={6} y={h * UU - 18} width={14} height={6} rx={2} fill={colors.brand} opacity={0.7} />
          </g>
        }
      />
    </g>
  )
}

/** a potted plant (grid) */
function Plant({ x, y }: { x: number; y: number }) {
  const [px, py] = sv(x, y, 0.55)
  return (
    <g>
      <Shadow x={x - 0.2} y={y - 0.2} w={0.4} d={0.4} />
      <Box x={x - 0.18} y={y - 0.18} w={0.36} d={0.36} h={0.5} color="#E9EEF8" />
      <g>
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
    </g>
  )
}

/** a table with legs (grid) */
function Desk({ x, y, w, d, h, top = PAL.wood }: { x: number; y: number; w: number; d: number; h: number; top?: string }) {
  const legs: GridPt[] = [
    [x + 0.08, y + 0.08],
    [x + w - 0.16, y + 0.08],
    [x + 0.08, y + d - 0.16],
    [x + w - 0.16, y + d - 0.16],
  ]
  return (
    <g>
      <Shadow x={x} y={y} w={w} d={d} />
      {legs.map(([lx, ly], i) => (
        <Box key={i} x={lx} y={ly} w={0.08} d={0.08} h={h - 0.08} color={shade(ISO.slate, 0.15)} />
      ))}
      <Box x={x} y={y} z={h - 0.08} w={w} d={d} h={0.08} color={top} />
    </g>
  )
}

/** a solid block: a counter, a plinth, a pedestal (grid); `dc` gives it the data-centre skin with vents */
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
              {[0.25, 0.5].map((k) => (
                <rect key={k} x={Math.min(0.25, w * 0.15) * UU} y={k * h * UU} width={Math.max(4, (w - 2 * Math.min(0.25, w * 0.15)) * UU)} height={3} rx={1.5} fill={shade(color, -0.18)} />
              ))}
            </g>
          ) : undefined)
        }
      />
    </g>
  )
}

function Scene({ children, tags, shift }: { children: ReactNode; tags?: ReactNode; shift?: [number, number] }) {
  const scene = (
    <IsoScene w={SW} h={SH} ox={O.ox} oy={O.oy} u={UU}>
      <IsoSvg>{children}</IsoSvg>
      {tags}
    </IsoScene>
  )
  /* `shift` centres a scene's drawn content in its card (equal space on all four sides), measured from the render */
  return shift ? <div style={{ width: '100%', height: '100%', transform: `translate(${shift[0]}px, ${shift[1]}px)` }}>{scene}</div> : scene
}

/* ------------------------------------------------------------------ T01 · an external hard disk */

/*
 * TR 1: "An external hard disk plugged into one laptop stores files only that laptop can read directly — just as
 * an EBS volume attaches as a raw block device to a single EC2 instance at a time."
 * Everyday: an office desk area (window, wall shelf, bookshelf, rug, lamp, plant); on the desk two laptops with the
 * disk between them, its owner beside the desk. Concept: the same room as a data-centre bay, the desk a rack plinth,
 * the EC2 marks where the laptops stand, the EBS Volume mark where the disk stands.
 * Links (review 2026-11-06, the top tag removed): 1 the disk / the volume; 2 the cable into laptop 1 / the
 * attachment to instance 1. Step 3 still shows the files only laptop 1 reads and laptop 2 / instance 2 crossed.
 * Motion: one data block rides the cable (the attach line) once, on the press that plugs it in.
 */
const T01_DESK = { x: 1.3, y: 1.5, w: 3.0, d: 1.2, h: 0.75 } as const
const T01_A: GridPt = [1.9, 2.2]
const T01_D: GridPt = [2.9, 2.0]
const T01_B: GridPt = [3.9, 1.8]
const T01_CABLE: GridPt[] = [
  [2.65, 2.12],
  [2.35, 2.3],
  [2.1, 2.35],
]

function T01Shell({ dc }: { dc: boolean }) {
  return dc ? (
    <g>
      <Room dc />
      <CableTray />
      <Cooler y={0.5} d={1.2} h={1.75} />
      <Rack x={0.6} />
      <Rack x={1.6} />
      <Rack x={3.6} />
      <Rack x={4.5} w={0.7} />
    </g>
  ) : (
    <g>
      <Room
        dc={false}
        a={
          <g>
            <WindowFace a={0.7 * UU} b={0.42 * UU} w={1.9 * UU} h={1.0 * UU} />
          </g>
        }
        floor={<Quad x={1.0} y={1.2} w={3.7} d={2.1} fill={PAL.rug} />}
      />
      {/* a bookshelf against wall B */}
      <Box
        x={0}
        y={0.45}
        w={0.42}
        d={1.25}
        h={1.85}
        color={shade(PAL.wood, 0.1)}
        onRight={
          <g>
            {[0, 1, 2, 3].map((r) => (
              <g key={r}>
                <rect x={3} y={6 + r * 16} width={1.25 * UU - 6} height={14} fill={shade(PAL.wood, -0.25)} />
                {Array.from({ length: 6 }, (_, i) => (
                  <rect key={i} x={6 + i * 7} y={8 + r * 16} width={5} height={12} rx={1} fill={[colors.brand, PAL.navy, '#F59E0B', colors.white, colors.teal, colors.brand][(i + r) % 6]} />
                ))}
              </g>
            ))}
          </g>
        }
      />
      {/* a wall shelf with books on wall A */}
      <Box x={3.3} y={0} z={1.45} w={1.5} d={0.3} h={0.07} color={shade(PAL.wood, 0.05)} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Box key={i} x={3.4 + i * 0.16} y={0.04} z={1.52} w={0.12} d={0.22} h={0.32 - (i % 2) * 0.06} color={[colors.brand, '#F59E0B', PAL.navy, colors.teal, colors.brand][i]} />
      ))}
      <Plant x={4.85} y={0.5} />
    </g>
  )
}

/** the external disk on the desk, its status light on once it is plugged in */
function Disk({ lit }: { lit: boolean }) {
  const z = T01_DESK.h
  return (
    <Box
      x={T01_D[0] - 0.3}
      y={T01_D[1] - 0.22}
      z={z}
      w={0.6}
      d={0.44}
      h={0.17}
      color={PAL.navy}
      onLeft={<circle cx={0.48 * UU} cy={0.085 * UU} r={2.2} fill={lit ? ISO.green : shade(ISO.slate, 0.3)} />}
    />
  )
}

/** a desk lamp (grid, on the desk) */
function Lamp({ x, y, z }: { x: number; y: number; z: number }) {
  const [px, py] = sv(x, y, z)
  return (
    <g>
      <ellipse cx={px} cy={py} rx={8} ry={3.5} fill={PAL.navy} />
      <path d={`M${px} ${py} L${px + 4} ${py - 34} L${px + 18} ${py - 42}`} fill="none" stroke={PAL.navy} strokeWidth={2.2} strokeLinecap="round" />
      <path d={`M${px + 12} ${py - 50} L${px + 28} ${py - 44} L${px + 22} ${py - 34} Z`} fill={colors.brand} />
      <ellipse cx={px + 24} cy={py - 36} rx={5} ry={2.5} fill={PAL.gold} opacity={0.9} />
    </g>
  )
}

function T01Everyday({ step }: { step: number }) {
  const z = T01_DESK.h
  const plugged = step >= 2
  const only = step >= 3
  const t = useOnce(plugged, ONCE.flow)
  const cable: GridPt[] = [[T01_D[0] - 0.3, T01_D[1] + 0.05], ...T01_CABLE]
  const la = sv(T01_A[0], T01_A[1], z)
  const lb = sv(T01_B[0], T01_B[1], z)
  const dk = sv(T01_D[0], T01_D[1], z + 0.17)
  return (
    <Scene
      tags={
        <>
          <Tag n={1} x={358} y={326} to={st(T01_D[0], T01_D[1] + 0.22, z + 0.08)} on={step >= 1}>
            An External Hard Disk
          </Tag>
          <Tag n={2} x={116} y={326} to={st(2.3, 2.32, z + 0.04)} on={plugged}>
            Plugged Into One Laptop
          </Tag>
        </>
      }
    >
      <T01Shell dc={false} />
      <Desk {...T01_DESK} />
      <Lamp x={1.5} y={1.65} z={z} />
      <Spr k="laptop" x={T01_A[0]} y={T01_A[1]} z={z} h={58} />
      <Spr k="laptop" x={T01_B[0]} y={T01_B[1]} z={z} h={58} flip />
      <Route points={cable} z={z + 0.03} color={shade(ISO.ink, 0.25)} width={2.6} head={false} op={plugged ? 1 : 0} />
      {plugged && <Dot points={cable} z={z + 0.05} t={t} r={3.4} />}
      <Disk lit={plugged} />
      <Halo x={dk[0]} y={dk[1] - 4} r={24} on={step === 1} />
      <g style={{ opacity: only ? 1 : 0, transition: `opacity ${REVEAL_MS}ms ${EASE}` }}>
        <image href={SPR.files[0]} x={la[0] - 21} y={la[1] - 92} width={42} height={42 / SPR.files[1]} style={{ filter: 'drop-shadow(0 4px 3px rgba(16,32,58,0.18))' }} />
      </g>
      <Cross x={lb[0] + 6} y={lb[1] - 66} on={only} />
      {/* the laptop's owner beside the desk, turned to it */}
      <Spr k="man" x={0.45} y={3.25} h={132} flip />
    </Scene>
  )
}

function T01Concept({ step }: { step: number }) {
  const z = T01_DESK.h
  const attached = step >= 2
  const only = step >= 3
  const t = useOnce(attached, ONCE.flow)
  const link: GridPt[] = [[T01_D[0] - 0.1, T01_D[1] + 0.05], [T01_A[0] + 0.2, T01_A[1] + 0.05]]
  const ib = sv(T01_B[0], T01_B[1], z)
  const vd = sv(T01_D[0], T01_D[1], z)
  return (
    <Scene
      tags={
        <>
          <Tag n={1} x={358} y={326} to={st(T01_D[0], T01_D[1] + 0.22, z + 0.08)} on={step >= 1} tone="brand">
            An EBS Volume
          </Tag>
          <Tag n={2} x={150} y={326} to={st(2.4, 2.12, z + 0.04)} on={attached} tone="brand">
            Attaches As A Raw Block Device
          </Tag>
        </>
      }
    >
      <T01Shell dc />
      <Block {...T01_DESK} color={shade(ISO.steel, 0.32)} dc />
      <Mark src={mEc2} x={T01_A[0]} y={T01_A[1]} z={z} h={52} ring={attached ? colors.brand : undefined} />
      <Mark src={mEc2} x={T01_B[0]} y={T01_B[1]} z={z} h={52} />
      <Route points={link} z={z + 0.03} color={colors.brand} width={2.6} head={false} op={attached ? 1 : 0} />
      {attached && <Dot points={link} z={z + 0.05} t={t} r={3.4} />}
      <Mark src={mVolume} x={T01_D[0]} y={T01_D[1]} z={z} h={40} ring={step === 1 ? colors.brand : undefined} />
      <Halo x={vd[0]} y={vd[1] - 24} r={28} on={step === 1} />
      <Cross x={ib[0] + 24} y={ib[1] - 58} on={only} />
    </Scene>
  )
}

/* ------------------------------------------------------------------ T07 · an office notice board */

/*
 * TR 7: "An office notice board lets every employee read and pin updates on the very same board instead of each
 * keeping a private copy — just as NFS lets every mounting client read and write the one shared copy of a file
 * kept on the server."
 * Everyday: an office corridor by the pantry (the board on the back wall, a door and a water cooler on the side
 * wall, a plant); three colleagues at the board, one pinning a note; their private copies crossed out. Concept:
 * the same room as a data-centre room, the board an NFS server unit holding the one shared file, three clients
 * where the colleagues stand, each on its mount line.
 * Review 2026-11-06: no tags on either stage (the `Technical` tag removed in the next review); both scenes centred in their cards. Motion: press 3,
 * a note is pinned once; one write rides each mount line to the server and one read rides back, once.
 */
const T07_P: GridPt[] = [
  [1.25, 2.7],
  [2.6, 3.1],
  [4.6, 2.0],
]
const T07_BOARD = { a0: 0.95, a1: 4.15, b0: 0.32, b1: 1.38 } as const
const T07_HIT: GridPt = [1.9, 0.02]
const T07_COPY: GridPt = [4.8, 3.6]

function BoardFace() {
  const B = T07_BOARD
  const bx = B.a0 * UU
  const bw = (B.a1 - B.a0) * UU
  const by = B.b0 * UU
  const bh = (B.b1 - B.b0) * UU
  const notes: [number, number, string][] = [
    [0.05, 0.12, '#FFFFFF'],
    [0.2, 0.1, '#FFE7A3'],
    [0.38, 0.16, '#DCE8FF'],
    [0.56, 0.1, '#FFFFFF'],
    [0.74, 0.14, '#FFE7A3'],
    [0.1, 0.56, '#DCE8FF'],
    [0.3, 0.6, '#FFFFFF'],
    [0.5, 0.55, '#FFE7A3'],
    [0.68, 0.58, '#DCE8FF'],
    [0.84, 0.52, '#FFFFFF'],
  ]
  return (
    <g>
      <rect x={bx - 5} y={by - 5} width={bw + 10} height={bh + 10} rx={4} fill={shade(PAL.wood, -0.3)} />
      <rect x={bx} y={by} width={bw} height={bh} rx={2} fill="#D8A56C" />
      {notes.map(([a, b, c], i) => (
        <g key={i}>
          <rect x={bx + a * bw} y={by + b * bh} width={bw * 0.12} height={bh * 0.32} rx={1.5} fill={c} stroke="rgba(16,32,58,0.12)" strokeWidth={0.6} />
          {[0.35, 0.55, 0.75].map((k) => (
            <rect key={k} x={bx + a * bw + 3} y={by + b * bh + k * bh * 0.32} width={bw * 0.12 - 6} height={1.6} rx={0.8} fill={shade(ISO.slate, 0.4)} />
          ))}
          <circle cx={bx + a * bw + bw * 0.06} cy={by + b * bh + 3} r={2.2} fill={i % 2 ? colors.danger : colors.brand} />
        </g>
      ))}
    </g>
  )
}

/** the NFS server unit against wall A where the board hangs: drive bays and the one shared file */
function NfsServer() {
  const x = T07_BOARD.a0
  const w = T07_BOARD.a1 - T07_BOARD.a0
  return (
    <g>
      <Shadow x={x} y={0} w={w} d={0.55} />
      <Box
        x={x}
        y={0}
        w={w}
        d={0.55}
        h={1.75}
        color={colors.brand}
        onLeft={
          <g>
            {[0, 1, 2, 3].map((r) => (
              <g key={r}>
                <rect x={8} y={10 + r * 15} width={w * UU * 0.36} height={10} rx={2} fill={shade(colors.brand, -0.18)} />
                <circle cx={13} cy={15 + r * 15} r={2} fill={ISO.green} />
                <rect x={w * UU * 0.62} y={10 + r * 15} width={w * UU * 0.34} height={10} rx={2} fill={shade(colors.brand, -0.18)} />
              </g>
            ))}
            <g transform={`translate(${w * UU * 0.45} 8)`}>
              <path d="M0 0 h20 l9 9 v42 h-29 z" fill={colors.white} stroke={shade(colors.brand, -0.3)} strokeWidth={1} />
              <path d="M20 0 v9 h9" fill="#DCE6F7" />
              {[16, 23, 30, 37, 44].map((y) => (
                <rect key={y} x={5} y={y} width={y === 44 ? 10 : 19} height={2.6} rx={1.3} fill={colors.brand} opacity={0.6} />
              ))}
            </g>
          </g>
        }
      />
    </g>
  )
}

/** a paper copy (svg px) */
function Sheet({ x, y, w = 20, op = 1 }: { x: number; y: number; w?: number; op?: number }) {
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

/** the pantry water cooler against wall B */
function WaterCooler({ y }: { y: number }) {
  const [px, py] = sv(0.27, y + 0.27, 1.15)
  return (
    <g>
      <Shadow x={0} y={y} w={0.55} d={0.55} />
      <Box x={0.02} y={y} w={0.5} d={0.5} h={1.1} color="#EEF2FA" onRight={<rect x={7} y={10} width={10} height={6} rx={2} fill={colors.brand} opacity={0.7} />} />
      <ellipse cx={px} cy={py - 18} rx={11} ry={15} fill={PAL.glass} stroke="#9CC2F5" strokeWidth={1} opacity={0.95} />
      <ellipse cx={px - 3} cy={py - 24} rx={3} ry={6} fill={colors.white} opacity={0.6} />
    </g>
  )
}

function T07Shell({ dc }: { dc: boolean }) {
  return dc ? (
    <g>
      <Room dc b={<DoorFace a={2.0 * UU} w={0.95 * UU} color={shade(colors.brand, 0.15)} />} />
      <CableTray />
      <Cooler y={0.35} d={1.1} h={1.6} />
      <Rack x={4.4} w={0.75} />
      <NfsServer />
    </g>
  ) : (
    <g>
      <Room dc={false} a={<BoardFace />} b={<DoorFace a={2.0 * UU} w={0.95 * UU} />} />
      <WaterCooler y={3.15} />
      <Plant x={4.8} y={0.45} />
    </g>
  )
}

function T07Everyday({ step }: { step: number }) {
  const pin = step >= 3
  const t = useOnce(pin, ONCE.flow)
  /* the note's trip, once: from the middle colleague's hand up to the board, where it stays pinned */
  const from = sv(T07_P[1][0] + 0.1, T07_P[1][1] - 0.1, 1.45)
  const to = sv(T07_HIT[0], T07_HIT[1], 1.25)
  const nx = from[0] + (to[0] - from[0]) * t
  const ny = from[1] + (to[1] - from[1]) * t - Math.sin(t * Math.PI) * 16
  const cp = sv(T07_COPY[0], T07_COPY[1], 0.55)
  return (
    <Scene shift={[-2, 26]}>
      <T07Shell dc={false} />
      <Spr k="reception" x={T07_P[0][0]} y={T07_P[0][1]} h={124} flip />
      <Spr k="teacher" x={T07_P[1][0]} y={T07_P[1][1]} h={124} />
      <Spr k="man" x={T07_P[2][0]} y={T07_P[2][1]} h={126} />
      {pin && <Sheet x={nx} y={ny} w={13} />}
      {/* the private copies nobody needs: a small pile on a side table, crossed out */}
      <Desk x={T07_COPY[0] - 0.3} y={T07_COPY[1] - 0.3} w={0.6} d={0.5} h={0.55} />
      <g style={{ opacity: pin ? 1 : 0, transition: `opacity ${REVEAL_MS}ms ${EASE}` }}>
        <Sheet x={cp[0] - 4} y={cp[1] - 12} w={18} />
        <Sheet x={cp[0] + 4} y={cp[1] - 8} w={18} />
      </g>
      <Cross x={cp[0] + 16} y={cp[1] - 30} on={pin} />
    </Scene>
  )
}

function T07Concept({ step }: { step: number }) {
  const rw = step >= 3
  /* one write rides each mount line to the server, then one read rides back, once */
  const t = useOnce(rw, ONCE.flow * 1.5, 'linear')
  const hit: GridPt = [2.55, 0.6]
  const lines: GridPt[][] = T07_P.map(([x, y]) => [[x, y - 0.2], [x * 0.5 + hit[0] * 0.5, (y - 0.2) * 0.6 + hit[1] * 0.4], hit])
  const clients: SprKey[] = ['laptop', 'desktop', 'laptopFront']
  return (
    <Scene shift={[-5, 26]}>
      <T07Shell dc />
      {/* client pedestals where the colleagues stand */}
      {T07_P.map(([x, y], i) => (
        <Block key={`p${i}`} x={x - 0.3} y={y - 0.3} w={0.6} d={0.6} h={0.42} color={shade(ISO.steel, 0.35)} dc />
      ))}
      {lines.map((l, i) => (
        <Route key={i} points={l} z={0.45} color={colors.brand} width={2} head={false} op={step >= 2 ? 0.85 : 0} />
      ))}
      {rw &&
        lines.map((l, i) => (
          <g key={i}>
            <Dot points={l} z={0.5} t={sm(Math.min(1, t * 2))} />
            <Dot points={[...l].reverse()} z={0.5} t={sm(Math.max(0, t * 2 - 1))} color={colors.teal} on={t > 0.5} />
          </g>
        ))}
      {T07_P.map(([x, y], i) => (
        <Spr key={i} k={clients[i]} x={x} y={y} z={0.42} h={i === 1 ? 46 : 54} op={step >= 2 ? 1 : 0.4} flip={i === 0} />
      ))}
    </Scene>
  )
}

/* ------------------------------------------------------------------ T12 · a courier parcel */

/*
 * TR 12, speaker notes: "Use the courier parcel analogy: package, tracking label, contents declaration."
 * Everyday: a courier office (shelves of parcels on the back wall, a service sign and a clock on the side wall, the
 * counter with a weighing scale, the courier behind it); one parcel on the counter, its tracking label on the front,
 * its contents declaration in a pouch on the side. Concept: the same room as an object store: shelves of objects,
 * the S3 Bucket mark where the sign is, one object on the plinth: its bytes, its key, its metadata.
 * Review 2026-11-06: no everyday tags; the concept keeps Data, Key, Metadata (no badges, Data moved off the top)
 * and one TR sentence under the visual. Motion: the label (the key) is scanned once, on the press that adds it.
 */
const T12_C = { x: 0.9, y: 2.0, w: 3.7, d: 1.0, h: 0.95 } as const
const T12_B = { x: 1.5, y: 2.12, w: 1.55, d: 0.78, h: 0.95 } as const

/** a shelving unit against wall A; `dc` stocks it with objects, else with parcels */
function Shelving({ x, w, dc }: { x: number; w: number; dc: boolean }) {
  const levels = [0.08, 0.68, 1.28]
  return (
    <g>
      <Shadow x={x} y={0} w={w} d={0.6} />
      <Box x={x} y={0} w={w} d={0.6} h={1.85} color={dc ? shade(PAL.rack, 0.05) : shade(PAL.wood, 0.1)} />
      {levels.map((z, li) =>
        Array.from({ length: Math.floor(w / 0.42) }, (_, i) => (
          <Box
            key={`${li}-${i}`}
            x={x + 0.06 + i * 0.42}
            y={0.12}
            z={z + 0.02}
            w={0.34}
            d={0.4}
            h={0.26 + ((i + li) % 2) * 0.12}
            color={dc ? ((i + li) % 3 ? colors.brand : shade(colors.brand, 0.35)) : (i + li) % 3 ? PAL.kraft : shade(PAL.kraft, 0.18)}
          />
        )),
      )}
      {levels.slice(1).map((z) => (
        <Box key={z} x={x} y={0} z={z - 0.04} w={w} d={0.6} h={0.05} color={dc ? shade(PAL.rack, 0.2) : shade(PAL.wood, -0.15)} />
      ))}
    </g>
  )
}

/** the parcel / the object on the counter, its three parts on its faces */
function Item({ dc, step }: { dc: boolean; step: number }) {
  const tr = useTr()
  const B = T12_B
  const z = T12_C.h
  const t = useOnce(step >= 2, ONCE.scan)
  const base = dc ? colors.brand : PAL.kraft
  const LW = 0.78 * UU
  const LH = 0.46 * UU
  const la = 0.36 * UU
  const lb = 0.3 * UU
  const sweep = la + 4 + (LW - 8) * t
  const label = (
    <g style={{ opacity: step >= 2 ? 1 : 0, transition: tr('opacity') }}>
      <rect x={la} y={lb} width={LW} height={LH} rx={3} fill={colors.white} stroke={dc ? shade(colors.brand, -0.3) : 'rgba(16,32,58,0.25)'} strokeWidth={0.8} />
      {dc ? (
        <g transform={`translate(${la + 9} ${lb + LH / 2})`} stroke={colors.brand} strokeWidth={2.4} fill="none" strokeLinecap="round">
          <circle cx={0} cy={0} r={5} />
          <path d="M5 0 H20 M15 0 v4.5 M19.5 0 v3.5" />
        </g>
      ) : (
        <g>
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x={la + 5 + i * 2.4} y={lb + 4} width={i % 3 === 0 ? 1.7 : 1} height={LH - 11} fill={ISO.ink} />
          ))}
        </g>
      )}
      <rect x={la + 5} y={lb + LH - 5} width={LW * 0.55} height={2} rx={1} fill={dc ? colors.brand : ISO.ink} opacity={0.6} />
      {step >= 2 && t > 0 && t < 1 && <rect x={sweep - 1} y={lb + 2} width={2} height={LH - 4} fill={colors.danger} opacity={0.75} />}
    </g>
  )
  const DW = 0.5 * UU
  const DH = 0.6 * UU
  const decl = (
    <g style={{ opacity: step >= 3 ? 1 : 0, transition: tr('opacity') }}>
      <rect x={0.14 * UU} y={0.16 * UU} width={DW} height={DH} rx={3} fill={dc ? '#EEF3FF' : 'rgba(235,244,255,0.92)'} stroke={dc ? shade(colors.brand, -0.3) : 'rgba(16,32,58,0.25)'} strokeWidth={0.8} />
      {[0.2, 0.38, 0.56, 0.74].map((k, i) => (
        <g key={k}>
          {dc && <rect x={0.14 * UU + 3} y={0.16 * UU + k * DH} width={5} height={3} rx={1.5} fill={colors.teal} />}
          <rect x={0.14 * UU + (dc ? 10 : 4)} y={0.16 * UU + k * DH} width={DW - (dc ? 14 : 8) - (i % 2) * 4} height={3} rx={1.5} fill={dc ? colors.brand : shade(ISO.slate, 0.2)} opacity={0.7} />
        </g>
      ))}
    </g>
  )
  const top = dc ? (
    <g style={{ opacity: step >= 1 ? 1 : 0.3, transition: tr('opacity') }}>
      {Array.from({ length: 4 }, (_, r) =>
        Array.from({ length: 7 }, (_, c) => <rect key={`${r}-${c}`} x={4 + c * 8.2} y={4 + r * 7} width={5.4} height={4.4} rx={1.2} fill={(r * 7 + c) % 3 ? colors.white : shade(colors.brand, 0.55)} opacity={0.85} />),
      )}
    </g>
  ) : (
    <rect x={0} y={B.d * UU * 0.42} width={B.w * UU} height={B.d * UU * 0.16} fill={shade(PAL.kraft, -0.25)} opacity={0.7} />
  )
  return <Box x={B.x} y={B.y} z={z} w={B.w} d={B.d} h={B.h} color={base} onLeft={label} onRight={decl} onTop={top} />
}

/** the counter's weighing scale (grid, on the counter) */
function Scale({ x, y, z }: { x: number; y: number; z: number }) {
  return (
    <g>
      <Box x={x} y={y} z={z} w={0.6} d={0.5} h={0.1} color="#E9EEF8" />
      <Box x={x + 0.08} y={y + 0.05} z={z + 0.1} w={0.44} d={0.4} h={0.03} color={shade(ISO.steel, 0.3)} />
      <Box x={x + 0.45} y={y + 0.35} z={z} w={0.12} d={0.12} h={0.32} color={PAL.navy} onLeft={<rect x={1.5} y={2} width={0.12 * UU - 3} height={5} rx={1} fill={ISO.green} />} />
    </g>
  )
}

/** a wall sign (face px) for the courier office: a parcel glyph, no words */
const CourierSign = ({ a }: { a: number }) => (
  <g>
    <rect x={a} y={0.42 * UU} width={1.25 * UU} height={0.62 * UU} rx={5} fill={colors.brand} />
    <path d={`M${a + 0.4 * UU} ${0.6 * UU} l${0.22 * UU} -${0.08 * UU} l${0.22 * UU} ${0.08 * UU} v${0.26 * UU} l-${0.22 * UU} ${0.08 * UU} l-${0.22 * UU} -${0.08 * UU} z`} fill={PAL.gold} />
  </g>
)

/** a wall clock (face px) */
const WallClock = ({ a, b }: { a: number; b: number }) => (
  <g>
    <circle cx={a} cy={b} r={11} fill={colors.white} stroke={PAL.navy} strokeWidth={2} />
    <path d={`M${a} ${b} v-7 M${a} ${b} h5`} stroke={PAL.navy} strokeWidth={1.6} strokeLinecap="round" />
  </g>
)

function T12Shell({ dc }: { dc: boolean }) {
  return dc ? (
    <g>
      <Room dc />
      <CableTray />
      <Shelving x={0.5} w={1.75} dc />
      <Shelving x={3.15} w={1.75} dc />
      <Mark src={mBucket} x={0.45} y={3.45} h={46} />
    </g>
  ) : (
    <g>
      <Room dc={false} b={<g><CourierSign a={0.6 * UU} /><WallClock a={2.6 * UU} b={0.75 * UU} /></g>} />
      <Shelving x={0.5} w={1.75} dc={false} />
      <Shelving x={3.15} w={1.75} dc={false} />
    </g>
  )
}

function T12Everyday({ step }: { step: number }) {
  const B = T12_B
  const z = T12_C.h
  const box = sv(B.x + B.w / 2, B.y + B.d / 2, z + B.h * 0.5)
  return (
    <Scene>
      <T12Shell dc={false} />
      {/* the courier behind the counter, turned to the parcel */}
      <Spr k="man" x={3.5} y={1.2} h={138} />
      <Block x={T12_C.x} y={T12_C.y} w={T12_C.w} d={T12_C.d} h={T12_C.h} color={shade(PAL.wood, 0.05)} front={<rect x={0} y={0.12 * UU} width={T12_C.w * UU} height={0.08 * UU} fill={colors.brand} opacity={0.8} />} />
      <Scale x={3.6} y={2.2} z={z} />
      <Item dc={false} step={step} />
      <Halo x={box[0]} y={box[1]} r={52} on={step === 1} color={colors.accent} />
    </Scene>
  )
}

function T12Concept({ step }: { step: number }) {
  const B = T12_B
  const z = T12_C.h
  const box = sv(B.x + B.w / 2, B.y + B.d / 2, z + B.h * 0.5)
  return (
    <Scene
      tags={
        <>
          <Tag x={92} y={118} to={st(B.x + B.w / 2, B.y + B.d / 2, z + B.h)} on={step >= 1} tone="brand">
            Data
          </Tag>
          <Tag x={112} y={282} to={st(B.x + 0.75, B.y + B.d, z + 0.45)} on={step >= 2} tone="brand">
            Key
          </Tag>
          <Tag x={350} y={282} to={st(B.x + B.w, B.y + 0.45, z + 0.55)} on={step >= 3} tone="brand">
            Metadata
          </Tag>
          <Explain x={235} y={320} w={420} on={step >= 3}>
            An object is the basic unit of object storage: data, a key and metadata bundled together
          </Explain>
        </>
      }
    >
      <T12Shell dc />
      <Block x={T12_C.x} y={T12_C.y} w={T12_C.w} d={T12_C.d} h={T12_C.h} color={shade(ISO.steel, 0.32)} dc />
      <Item dc step={step} />
      <Halo x={box[0]} y={box[1]} r={52} on={step === 1} />
    </Scene>
  )
}

/* ------------------------------------------------------------------ T17 · a bank locker */

/*
 * TR 17: "At a bank, you give the locker number and say what you want to do (open, put in, or close it), and the
 * bank checks your ID before acting, just as a REST call names the object key and HTTP verb, and S3 checks the
 * signature before acting."
 * Everyday: a bank's locker vault (the locker wall at the back, the round vault door on the side wall, the officer's
 * desk with an ID card, a carpet runner); the customer at the numbered locker. Concept: the same room as a bucket:
 * a wall of objects with the keyed one, the S3 Bucket mark at the vault door, the S3 mark on the officer's desk
 * checking the request, a laptop where the customer stands. Links (review 2026-11-06, the top tags removed):
 * 1 open, put in or close / the HTTP verb; 2 the ID checked first / the signature checked first. Motion: the locker
 * door opens once and the request rides once to the object, on press 2.
 */
const T17_WALL = { x: 0.35, w: 3.55, d: 0.5, h: 2.05 } as const
const T17_COLS = 5
const T17_ROWS = 4
const T17_HIT = { c: 2, r: 1 } as const
const T17_CUST: GridPt = [2.25, 2.85]
const T17_DESK = { x: 4.05, y: 1.85, w: 0.95, d: 0.75, h: 0.72 } as const
const T17_OFF: GridPt = [4.75, 1.2]

function LockerFace({ dc, open, lit }: { dc: boolean; open: number; lit: boolean }) {
  const W = T17_WALL.w * UU
  const H = T17_WALL.h * UU
  const pad = 8
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
          const fill = dc ? (hit && lit ? colors.white : shade(colors.brand, 0.2)) : hit && lit ? PAL.gold : shade(ISO.steel, 0.28)
          if (hit && !dc) {
            const dw = w * (1 - 0.62 * open)
            return (
              <g key={`${r}-${c}`}>
                <rect x={x} y={y} width={w} height={h} rx={2} fill={shade(ISO.ink, 0.25)} />
                <rect x={x + 4} y={y + h - 11} width={w * 0.5} height={7} rx={1.5} fill="#E6C27A" opacity={open > 0.2 ? 1 : 0} />
                <path d={`M${x} ${y} L${x + dw} ${y - 5 * open} L${x + dw} ${y + h + 5 * open} L${x} ${y + h} Z`} fill={fill} stroke={shade(ISO.ink, 0.1)} strokeWidth={0.8} />
                <rect x={x + dw * 0.3} y={y + 4} width={dw * 0.4} height={5} rx={1.5} fill={colors.white} opacity={0.9} />
                <circle cx={x + dw - 5} cy={y + h / 2} r={2} fill={ISO.ink} />
              </g>
            )
          }
          return (
            <g key={`${r}-${c}`}>
              <rect x={x} y={y} width={w} height={h} rx={2} fill={fill} stroke={dc ? shade(colors.brand, -0.25) : shade(ISO.steel, -0.2)} strokeWidth={0.8} />
              {dc ? (
                <path d={`M${x + w / 2 - 5} ${y + h / 2 - 7} h7 l3.5 3.5 v10.5 h-10.5 z`} fill={hit && lit ? colors.brand : colors.white} opacity={hit && lit ? 1 : 0.6} />
              ) : (
                <>
                  <rect x={x + w * 0.3} y={y + 4} width={w * 0.4} height={5} rx={1.5} fill={colors.white} opacity={0.8} />
                  <circle cx={x + w - 5} cy={y + h / 2} r={2} fill={ISO.ink} />
                </>
              )}
            </g>
          )
        }),
      )}
    </g>
  )
}

/** the round vault door on wall B (face px) */
const VaultFace = ({ a }: { a: number }) => {
  const cx = a
  const cy = 1.25 * UU
  return (
    <g>
      <circle cx={cx} cy={cy} r={0.72 * UU} fill={shade(ISO.steel, 0.1)} stroke={shade(ISO.steel, -0.25)} strokeWidth={3} />
      <circle cx={cx} cy={cy} r={0.5 * UU} fill={shade(ISO.steel, 0.3)} />
      {[0, 60, 120].map((d) => (
        <line key={d} x1={cx - 0.32 * UU * Math.cos((d * Math.PI) / 180)} y1={cy - 0.32 * UU * Math.sin((d * Math.PI) / 180)} x2={cx + 0.32 * UU * Math.cos((d * Math.PI) / 180)} y2={cy + 0.32 * UU * Math.sin((d * Math.PI) / 180)} stroke={PAL.navy} strokeWidth={3} strokeLinecap="round" />
      ))}
      <circle cx={cx} cy={cy} r={5} fill={PAL.gold} />
    </g>
  )
}

/** where the numbered locker's centre sits on the wall's front face (grid) */
const T17_HITPT: [number, number, number] = [
  T17_WALL.x + 8 / UU + (T17_HIT.c + 0.5) * ((T17_WALL.w - 16 / UU) / T17_COLS),
  T17_WALL.d,
  T17_WALL.h - 8 / UU - (T17_HIT.r + 0.5) * ((T17_WALL.h - 16 / UU) / T17_ROWS),
]

function LockerWall({ dc, open, lit }: { dc: boolean; open: number; lit: boolean }) {
  const W = T17_WALL
  return (
    <g>
      <Shadow x={W.x} y={0} w={W.w} d={W.d} />
      <Box x={W.x} y={0} w={W.w} d={W.d} h={W.h} color={dc ? colors.brand : shade(ISO.steel, 0.38)} onLeft={<LockerFace dc={dc} open={open} lit={lit} />} />
    </g>
  )
}

/** a small upright ID card (svg px) */
function IdCard({ x, y }: { x: number; y: number }) {
  return (
    <g style={{ filter: 'drop-shadow(0 3px 2px rgba(16,32,58,0.2))' }}>
      <rect x={x - 16} y={y - 21} width={32} height={21} rx={3} fill={colors.white} stroke={colors.brand} strokeWidth={1.2} />
      <rect x={x - 16} y={y - 21} width={32} height={6} rx={2} fill={colors.brand} />
      <circle cx={x - 8} cy={y - 8} r={4} fill={shade(ISO.slate, 0.3)} />
      <rect x={x - 1} y={y - 11} width={13} height={2.4} rx={1.2} fill={shade(ISO.slate, 0.3)} />
      <rect x={x - 1} y={y - 6} width={9} height={2.4} rx={1.2} fill={shade(ISO.slate, 0.3)} />
    </g>
  )
}

function T17Everyday({ step }: { step: number }) {
  /* the locker door swings ajar once, on "Open, Put In, Or Close", and stays open */
  const open = useOnce(step >= 2, ONCE.door)
  const D = T17_DESK
  const card = sv(D.x + D.w / 2, D.y + D.d / 2, D.h)
  return (
    <Scene
      tags={
        <>
          <Tag n={1} x={110} y={290} to={st(T17_CUST[0] - 0.1, T17_CUST[1], 1.7)} on={step >= 2}>
            Open, Put In, Or Close
          </Tag>
          <Tag n={2} x={300} y={350} to={st(D.x + D.w / 2, D.y + D.d, D.h - 0.1)} on={step >= 3} tone="good">
            Bank Checks Your ID Before Acting
          </Tag>
        </>
      }
    >
      <Room dc={false} b={<VaultFace a={2.0 * UU} />} floor={<Quad x={1.4} y={1.1} w={1.9} d={2.9} fill={PAL.rug} />} />
      <LockerWall dc={false} open={open} lit={step >= 1} />
      {/* the bank officer behind the desk, turned to the customer */}
      <Spr k="mansuit" x={T17_OFF[0]} y={T17_OFF[1]} h={132} flip />
      <Block x={D.x} y={D.y} w={D.w} d={D.d} h={D.h} color={shade(PAL.wood, 0.05)} />
      <g style={{ opacity: step >= 3 ? 1 : 0, transition: `opacity ${REVEAL_MS}ms ${EASE}` }}>
        <IdCard x={card[0]} y={card[1]} />
      </g>
      <Tick x={card[0] + 22} y={card[1] - 30} on={step >= 3} />
      <Spr k="woman" x={T17_CUST[0]} y={T17_CUST[1]} h={132} />
    </Scene>
  )
}

function T17Concept({ step }: { step: number }) {
  /* the request rides once from the client, past S3's check, to the one object */
  const t = useOnce(step >= 2, ONCE.flow, 'linear')
  const D = T17_DESK
  const s3 = sv(D.x + D.w / 2, D.y + D.d / 2, D.h)
  const req: GridPt[] = [
    [T17_CUST[0] + 0.3, T17_CUST[1] - 0.3],
    [D.x - 0.2, D.y + D.d + 0.1],
    [D.x - 0.3, T17_WALL.d + 0.4],
    [T17_HITPT[0], T17_WALL.d + 0.08],
  ]
  return (
    <Scene
      tags={
        <>
          <Tag n={1} x={110} y={290} to={st(T17_CUST[0] + 0.3, T17_CUST[1] - 0.3, 0.1)} on={step >= 2} tone="brand">
            HTTP Verb
          </Tag>
          <Tag n={2} x={300} y={350} to={st(D.x + D.w / 2, D.y + D.d, D.h - 0.1)} on={step >= 3} tone="good">
            S3 Checks The Signature Before Acting
          </Tag>
        </>
      }
    >
      <Room dc />
      <CableTray />
      <LockerWall dc open={0} lit={step >= 1} />
      {/* the bucket's own mark where the vault door is */}
      <Mark src={mBucket} x={0.5} y={2.1} h={48} />
      <Route points={req} color={colors.brand} width={2.2} op={step >= 2 ? 1 : 0} />
      {step >= 2 && <Dot points={req} t={sm(t)} />}
      <Block x={D.x} y={D.y} w={D.w} d={D.d} h={D.h} color={shade(ISO.steel, 0.32)} dc />
      <Mark src={mS3} x={D.x + D.w / 2} y={D.y + D.d / 2} z={D.h} h={46} ring={step >= 3 ? colors.success : undefined} />
      <Tick x={s3[0] + 28} y={s3[1] - 48} on={step >= 3} />
      <Block x={T17_CUST[0] - 0.3} y={T17_CUST[1] - 0.3} w={0.6} d={0.6} h={0.42} color={shade(ISO.steel, 0.35)} dc />
      <Spr k="laptop" x={T17_CUST[0]} y={T17_CUST[1]} z={0.42} h={56} />
    </Scene>
  )
}

/* ------------------------------------------------------------------ T18 · a movie ticket QR code */

/*
 * TR 18: "A movie ticket booked online gives you a QR code that lets you into one show at one time, without making
 * you a theatre staff member. Once the show time passes, the QR code stops working, just as a presigned URL lets
 * its holder reach one object for a limited time without ever receiving the owner's AWS credentials."
 * Everyday: a cinema lobby (the hall entrance with its now-showing screen and doors on the back wall, posters on the
 * side wall, the entry gate with its ticket scanner, the show clock); the visitor holds up the QR code; the staff
 * badge is not hers (crossed). Concept: the same room as a bucket room, the screen one object, the scanner the S3
 * mark that checks the link, the clock its expiry, the owner's key not given (crossed).
 * Review 2026-11-06: no tags on either stage; the picture carries it. Motion: press 2, the gate accepts the code
 * once (a check rides to the scanner, a tick); press 3, the clock moves past the valid window once and the code is
 * crossed out.
 */
const T18_WALL = { x: 0.6, w: 4.1, d: 0.3, h: 2.0 } as const
const T18_HOLD: GridPt = [1.55, 3.0]
const T18_GATE: GridPt = [3.05, 2.35]
const T18_BADGE: GridPt = [4.55, 3.15]

function HallFace({ dc, lit }: { dc: boolean; lit: boolean }) {
  const W = T18_WALL.w * UU
  const sx = W * 0.3
  const sw = W * 0.4
  return (
    <g>
      <rect x={sx - 4} y={10} width={sw + 8} height={52} rx={5} fill={dc ? shade(colors.brand, -0.3) : PAL.navy} />
      <rect x={sx} y={14} width={sw} height={44} rx={3} fill={dc ? colors.white : lit ? '#3B5BDB' : '#2A3A73'} stroke={lit ? PAL.gold : 'none'} strokeWidth={lit ? 2 : 0} />
      {dc ? (
        <path d={`M${sx + sw / 2 - 11} 22 h14 l8 8 v22 h-22 z`} fill={colors.brand} />
      ) : (
        <path d={`M${sx + sw / 2 - 7} 25 L${sx + sw / 2 + 11} 36 L${sx + sw / 2 - 7} 47 Z`} fill={colors.white} />
      )}
      {[0.07, 0.77].map((k) => (
        <g key={k}>
          <rect x={W * k} y={44} width={W * 0.16} height={T18_WALL.h * UU - 44} rx={2} fill={dc ? shade(colors.brand, -0.15) : '#8E3B3B'} />
          <circle cx={W * k + W * 0.13} cy={60} r={2} fill={colors.white} />
        </g>
      ))}
    </g>
  )
}

/** three movie posters on wall B (face px): shapes only, no words */
const PosterFace = () => (
  <g>
    {[0.5, 1.4, 2.3].map((k, i) => (
      <g key={k}>
        <rect x={k * UU} y={0.45 * UU} width={0.7 * UU} height={1.0 * UU} rx={3} fill={[PAL.navy, '#8E3B3B', colors.brand][i]} />
        <circle cx={k * UU + 0.35 * UU} cy={0.8 * UU} r={6} fill={[PAL.gold, colors.white, PAL.gold][i]} opacity={0.9} />
        <rect x={k * UU + 5} y={1.15 * UU} width={0.7 * UU - 10} height={3} rx={1.5} fill={colors.white} opacity={0.7} />
      </g>
    ))}
  </g>
)

/** a phone held up, its screen a QR code (or a link), svg px; `dead` greys it once it stops working */
function Phone({ x, y, dc, dead }: { x: number; y: number; dc: boolean; dead: boolean }) {
  const tr = useTr()
  const w = 34
  const h = 56
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
      <rect x={x - w / 2} y={y - h} width={w} height={h} rx={6} fill="#1F2A44" />
      <rect x={x - w / 2 + 3} y={y - h + 5} width={w - 6} height={h - 10} rx={3} fill={colors.white} />
      <g style={{ opacity: dead ? 0.35 : 1, transition: tr('opacity') }}>
        {dc ? (
          <g transform={`translate(${x} ${y - h / 2})`} stroke={colors.brand} strokeWidth={2.6} fill="none" strokeLinecap="round">
            <path d="M-3 -5 l-3.5 0 a5 5 0 0 0 0 10 l3.5 0 M3 -5 l3.5 0 a5 5 0 0 1 0 10 l-3.5 0 M-4 0 h8" />
          </g>
        ) : (
          cells.map((row, r) => row.map((v, c) => (v ? <rect key={`${r}-${c}`} x={x - 12 + c * 3.4} y={y - h / 2 - 12 + r * 3.4} width={3.4} height={3.4} fill={ISO.ink} /> : null)))
        )}
      </g>
    </g>
  )
}

/** the show clock / the expiry clock on the wall, its hand turning (svg px); the shaded wedge is the valid window */
function ShowClock({ x, y, t, dc }: { x: number; y: number; t: number; dc: boolean }) {
  const a = t * Math.PI * 2
  const r = 15
  return (
    <g style={{ filter: 'drop-shadow(0 4px 3px rgba(16,32,58,0.2))' }}>
      <circle cx={x} cy={y} r={r + 3} fill={dc ? colors.brand : PAL.navy} />
      <circle cx={x} cy={y} r={r} fill={colors.white} />
      <path d={`M${x} ${y} L${x} ${y - r + 2} A${r - 2} ${r - 2} 0 0 1 ${x + (r - 2)} ${y} Z`} fill={dc ? colors.brand : PAL.gold} opacity={0.3} />
      <line x1={x} y1={y} x2={x + (r - 4) * Math.sin(a)} y2={y - (r - 4) * Math.cos(a)} stroke={ISO.ink} strokeWidth={1.8} strokeLinecap="round" />
      <line x1={x} y1={y} x2={x + 7 * Math.sin(a / 12 + 1.2)} y2={y - 7 * Math.cos(a / 12 + 1.2)} stroke={ISO.ink} strokeWidth={2.4} strokeLinecap="round" />
      <circle cx={x} cy={y} r={2} fill={ISO.ink} />
    </g>
  )
}

/** the staff badge on a lanyard (everyday) / the owner's credentials as a key (concept), svg px */
function Badge({ x, y, dc }: { x: number; y: number; dc: boolean }) {
  return dc ? (
    <g transform={`translate(${x} ${y})`} style={{ filter: 'drop-shadow(0 4px 3px rgba(16,32,58,0.2))' }}>
      <circle cx={-11} cy={0} r={9} fill={PAL.gold} stroke={shade(PAL.gold, -0.3)} strokeWidth={1.2} />
      <circle cx={-11} cy={0} r={3.2} fill={colors.white} />
      <path d="M-2 -3 h24 v6 h-4 v6 h-5 v-6 h-3 v4 h-5 v-4 h-7 z" fill={PAL.gold} stroke={shade(PAL.gold, -0.3)} strokeWidth={1.2} />
    </g>
  ) : (
    <g transform={`translate(${x} ${y})`} style={{ filter: 'drop-shadow(0 4px 3px rgba(16,32,58,0.2))' }}>
      <path d="M-9 -30 L0 -13 L9 -30" fill="none" stroke={colors.danger} strokeWidth={2.2} />
      <rect x={-13} y={-14} width={26} height={34} rx={4} fill={colors.white} stroke={shade(ISO.slate, 0.2)} strokeWidth={1} />
      <rect x={-13} y={-14} width={26} height={8} rx={3} fill="#8E3B3B" />
      <circle cx={0} cy={3} r={5.5} fill={shade(ISO.slate, 0.35)} />
      <rect x={-8} y={11} width={16} height={3} rx={1.5} fill={shade(ISO.slate, 0.35)} />
    </g>
  )
}

/** the entry gate: a pedestal with its scanner screen and a barrier arm (grid) */
function Gate({ dc }: { dc: boolean }) {
  const [gx, gy] = T18_GATE
  return (
    <g>
      <Block x={gx - 0.25} y={gy - 0.25} w={0.5} d={0.5} h={0.95} color={dc ? shade(ISO.steel, 0.32) : shade(ISO.steel, 0.2)} dc={dc} />
      <Box x={gx + 0.25} y={gy - 0.05} z={0.75} w={1.2} d={0.1} h={0.08} color={dc ? colors.brand : colors.danger} />
      {!dc && <Box x={gx - 0.2} y={gy + 0.1} z={0.95} w={0.4} d={0.12} h={0.22} color={PAL.navy} onLeft={<rect x={2} y={2} width={0.4 * UU - 4} height={0.22 * UU - 4} rx={1.5} fill={ISO.green} opacity={0.85} />} />}
    </g>
  )
}

function T18Stage({ step, dc }: { step: number; dc: boolean }) {
  /* the clock: still inside the valid window until expiry (step 3), then its hand moves on past it, once */
  const exp = useOnce(step >= 3, ONCE.slow * 0.5)
  const t = 0.12 + 0.3 * exp
  /* the scanner accepts the code once (step 2): one check rides from the phone to the gate, a tick, gone */
  const acc = useOnce(step >= 2, ONCE.flow, 'linear')
  const [gx, gy] = sv(T18_GATE[0], T18_GATE[1], 1.25)
  const W = T18_WALL
  const ck = sv(W.x + W.w - 0.2, W.d, 1.75)
  const scr = sv(W.x + W.w * 0.5, W.d, W.h - 0.45)
  const bd = sv(T18_BADGE[0], T18_BADGE[1], 0.95)
  return (
    <g>
      <Room dc={dc} b={dc ? undefined : <PosterFace />} />
      {dc ? <CableTray /> : null}
      {dc ? <Cooler y={0.6} d={1.3} h={1.6} /> : null}
      <Shadow x={W.x} y={0} w={W.w} d={W.d} />
      <Box x={W.x} y={0} w={W.w} d={W.d} h={W.h} color={dc ? colors.brand : shade('#2A3A73', 0.12)} onLeft={<HallFace dc={dc} lit={step >= 2} />} />
      <Halo x={scr[0]} y={scr[1]} r={34} on={step === 2} color={dc ? colors.brand : PAL.gold} />
      <ShowClock x={ck[0]} y={ck[1]} t={t} dc={dc} />
      <Gate dc={dc} />
      {dc && <Mark src={mS3} x={T18_GATE[0]} y={T18_GATE[1]} z={0.95} h={40} />}
      {step >= 2 && <Dot points={[[T18_HOLD[0] + 0.45, T18_HOLD[1] - 0.45], [T18_GATE[0], T18_GATE[1] + 0.05]]} z={1.15} t={sm(Math.min(1, acc * 1.6))} />}
      <g style={{ opacity: step >= 2 && acc > 0.6 && acc < 1 ? 1 : 0, transition: `opacity ${REVEAL_MS}ms ${EASE}` }}>
        <Tick x={gx + 22} y={gy - (dc ? 34 : 6)} />
      </g>
      {/* a low stand for the badge / the key, at the front right */}
      <Block x={T18_BADGE[0] - 0.22} y={T18_BADGE[1] - 0.22} w={0.44} d={0.44} h={0.5} color={dc ? shade(ISO.steel, 0.35) : '#E9EEF8'} dc={dc} />
      <g style={{ opacity: step >= 3 ? 1 : 0, transition: `opacity ${REVEAL_MS}ms ${EASE}` }}>
        <Badge x={bd[0]} y={bd[1]} dc={dc} />
      </g>
      <Cross x={bd[0] + 17} y={bd[1] - 20} on={step >= 3} />
    </g>
  )
}

/** the phone in the holder's hand, drawn in front of them */
function T18Phone({ step, dc }: { step: number; dc: boolean }) {
  const [fx, fy] = sv(T18_HOLD[0], T18_HOLD[1], 0)
  const x = fx + 34
  const y = fy - 56
  return (
    <g>
      <Phone x={x} y={y} dc={dc} dead={step >= 3} />
      <Cross x={x + 17} y={y - 56} on={step >= 3} />
    </g>
  )
}

function T18Everyday({ step }: { step: number }) {
  return (
    <Scene shift={[-2, 26]}>
      <T18Stage step={step} dc={false} />
      <Spr k="visitor" x={T18_HOLD[0]} y={T18_HOLD[1]} h={132} flip />
      <T18Phone step={step} dc={false} />
    </Scene>
  )
}

function T18Concept({ step }: { step: number }) {
  return (
    <Scene shift={[-2, 26]}>
      <T18Stage step={step} dc />
      <Spr k="man" x={T18_HOLD[0]} y={T18_HOLD[1]} h={132} flip />
      <T18Phone step={step} dc />
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

/* no CSS loops: every motion is a one-shot tied to its build press (user, 2026-11-06) */
export const css = ''
