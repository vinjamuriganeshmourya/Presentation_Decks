import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { animate } from 'framer-motion'
import { colors } from '@/design/tokens'
import { MOTION, motionHeld } from '@/motion/tokens'
import { useInstant } from '@/motion/instant'
import { SPEED } from '@/deck/autoAnim'
import { At, Label, Num, type LabelTone } from '@/decks/figures/scene'
import { Box, ISO, IsoScene, IsoSvg, P, Quad, Shadow, measure, along, screenPts, shade, type GridPt } from '@/decks/figures/iso/iso'
import { Character } from '@/decks/figures/cast/rig/Character'
import { useCharacter } from '@/decks/figures/cast/rig/useCharacter'
import { buildSkin, PRESETS, type CharacterConfig } from '@/decks/figures/cast/skins/config'
import pMan from './ppl/man.png'
import pReception from './ppl/reception.png'
import pUserBoy from './ppl/userboy.png'
import mEc2Instance from '../images/aws-ec2-instance.svg'
import mAmi from '../images/aws-ami.svg'

/**
 * BUILDER G · FOUR ANALOGY SLIDES OF "ELASTIC COMPUTE INSTANCES" (Session 9: TR 15, 19, 21, 25).
 *
 * THE SAME LOOK AS SESSION 7'S ANALOGY ROOMS (`block_file_and_object_storage/custom/f.tsx`, whose shell, palette,
 * tags and motion helpers are copied here, not imported): one isometric camera, one 5.2 x 4 floor, two back walls,
 * lit from the top-left with soft contact shadows; the everyday stage is a furnished real place, the concept stage
 * the same place as a data-centre room with the official AWS marks on white tiles where the everyday parts stand.
 * T25 is outdoors, so its shell is a ground plane (a housing site) and its concept twin a data-centre floor plate.
 *
 * PEOPLE. Where the TR names a role the Library renders do not have (a carpenter, a chef, a site builder), the person
 * is a Character Lab rig in the clay Library look (`Rig`, the deck-engine `cast/` rig, as Session 6's patient), with
 * the role's clothing drawn as rig props (a work apron, the baker's cap and apron, a hard hat and a site vest). The
 * locker renter and the attendant are Library renders (`./ppl`); the owner on T21's concept side is the boy with a
 * laptop (rule 58). Everyone faces the scene's main part; no person appears twice on a stage.
 *
 * LINKS (cloud course R3 "Lighter labels"): no tags along the top; each kept tag carries a number badge, the same
 * number on the everyday tag and its concept tag, and a thin leader to the part it names. Every tag is TR words in
 * Title Case (rule 56). The full TR sentence is in the slide's `notes`.
 *
 * MOTION: tags and parts reveal pair by pair on the layout's one build track (`step` 0..3, the same press on both
 * stages); a press may start ONE one-shot motion that shows what it reveals (framer `animate` on the shared MOTION
 * tokens): the job is set down on the bench, the model is loaded onto the card, the dishes / instances come out one
 * after another, the locker door opens and the login rides once, the houses / instances rise one after another.
 * Nothing loops. `?still`, thumbnails and reduced motion show the end state at once.
 */

/* ------------------------------------------------------------------ shared frame values (as f.tsx) */

const SW = 470
const SH = 390
const UU = 42
const K = UU / 38
const REVEAL_MS = MOTION.reveal
const EASE = MOTION.ease
const ONCE = { flow: MOTION.flow.dur * 1000, slow: MOTION.flow.slow * 1000, door: MOTION.reveal * 2 }
const EASE_ARR = MOTION.ease.replace(/[^0-9.,]/g, '').split(',').map(Number) as [number, number, number, number]

const R = { W: 5.2, D: 4.0, H: 2.3 } as const
const O = { ox: 212, oy: 122 } as const

const PAL = {
  wall: '#F3F6FC',
  wallDc: '#E7EEFB',
  floor: '#E3E9F4',
  floorDc: '#D6E1F4',
  tileDc: '#CCD9F0',
  base: '#C9D3E6',
  wood: '#D9B48A',
  woodDark: '#B98A5E',
  rug: '#F3E6D2',
  navy: '#22346E',
  rack: '#1F2E63',
  glass: '#CFE3FF',
  leaf: '#5DBB7A',
  gold: '#F2C14E',
  tile: '#EEF2F8',
  grass: '#BFE0B0',
  grassDark: '#A8D49A',
  road: '#C9D1DE',
  roof: '#2D5BD8',
  brick: '#F0E2D0',
} as const

function useHeld() {
  return motionHeld(useInstant())
}

function useTr(ms = REVEAL_MS) {
  const instant = useInstant()
  return (p: string) => (instant ? 'none' : `${p} ${ms}ms ${EASE}`)
}

/** a one-shot progress 0..1 that starts when `on` turns true and stays at 1 (end state at once when held) */
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

const clamp = (v: number) => Math.min(1, Math.max(0, v))
/** the part of a one-shot that belongs to item i of n (staggered, each taking `span` of the whole) */
const part = (k: number, i: number, n: number, span = 0.45) => clamp((k - (i * (1 - span)) / Math.max(1, n - 1)) / span)
const sm = (k: number) => {
  const c = clamp(k)
  return c * c * (3 - 2 * c)
}

const sv = (x: number, y: number, z = 0): [number, number] => P(x, y, z, UU)
const st = (x: number, y: number, z = 0): [number, number] => {
  const [a, b] = P(x, y, z, UU)
  return [a + O.ox, b + O.oy]
}

const SPR = {
  man: [pMan, 126 / 220],
  reception: [pReception, 127 / 220],
  userboy: [pUserBoy, 166 / 220],
} as const
type SprKey = keyof typeof SPR

function Spr({ k, x, y, z = 0, h, op = 1, flip = false, shadow = true }: { k: SprKey; x: number; y: number; z?: number; h: number; op?: number; flip?: boolean; shadow?: boolean }) {
  const tr = useTr()
  const [px, py] = sv(x, y, z)
  const [src, ar] = SPR[k]
  h = h * K
  const w = h * ar
  return (
    <g style={{ opacity: op, transition: tr('opacity') }}>
      {shadow && <ellipse cx={px} cy={py - 1} rx={w * 0.34} ry={w * 0.1} fill={ISO.slate} opacity={0.2} />}
      <image href={src} x={px - w / 2} y={py - h} width={w} height={h} preserveAspectRatio="xMidYMax meet" transform={flip ? `translate(${px * 2} 0) scale(-1 1)` : undefined} style={{ filter: 'drop-shadow(0 4px 3px rgba(16,32,58,0.18))' }} />
    </g>
  )
}

/** An official AWS mark (rule 54) on its white tile, standing upright on grid (x, y, z). */
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

/** A linked tag: TR words in a chip with its link number, centred on `x`, top at `y`, a leader to `to`. */
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
        <span className="flex items-center gap-1" style={{ opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(6px)', transition: `${tr('opacity')}, ${tr('transform')}`, whiteSpace: 'nowrap' }}>
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

/** a soft highlight on the part this press names: in on its press, out on the next, no loop */
function Halo({ x, y, r, on, color = colors.brand }: { x: number; y: number; r: number; on: boolean; color?: string }) {
  const tr = useTr()
  return (
    <g style={{ opacity: on ? 1 : 0, transition: tr('opacity') }}>
      <circle cx={x} cy={y} r={r} fill={color} opacity={0.1} />
      <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={1.6} opacity={0.45} />
    </g>
  )
}

/** a dot riding grid points at phase t (0..1), fading at the ends */
function Dot({ points, t, z = 0.18, color = colors.brand, r = 4, on = true }: { points: GridPt[]; t: number; z?: number; color?: string; r?: number; on?: boolean }) {
  const q = screenPts(points, z, UU)
  const { seg, len } = measure(q)
  const tt = clamp(t)
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

/** a thin solid route (grid points), optional head */
function Route({ points, z = 0.05, color = colors.brand, width = 2, op = 1, dashed = false }: { points: GridPt[]; z?: number; color?: string; width?: number; op?: number; dashed?: boolean }) {
  const tr = useTr()
  const q = screenPts(points, z, UU)
  const d = q.map(([a, b], i) => `${i ? 'L' : 'M'}${a.toFixed(2)} ${b.toFixed(2)}`).join(' ')
  return <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dashed ? '5 5' : undefined} style={{ opacity: op, transition: tr('opacity') }} />
}

/* ------------------------------------------------------------------ the room shell (as f.tsx) */

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
            <rect x={6} y={h * UU - 18} width={14} height={6} rx={2} fill={colors.brand} opacity={0.7} />
          </g>
        }
      />
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

function Block({ x, y, z = 0, w, d, h, color, dc = false, front }: { x: number; y: number; z?: number; w: number; d: number; h: number; color: string; dc?: boolean; front?: ReactNode }) {
  return (
    <g>
      {z === 0 && <Shadow x={x} y={y} w={w} d={d} />}
      <Box
        x={x}
        y={y}
        z={z}
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
  return shift ? <div style={{ width: '100%', height: '100%', transform: `translate(${shift[0]}px, ${shift[1]}px)` }}>{scene}</div> : scene
}

/* ------------------------------------------------------------------ Character Lab people with role props */

/** The baker's cap (head-local, skull centre 0,0), copied from the engine's Cast.tsx. */
const CHEF_CAP = (
  <g data-part="cap">
    <path d="M -44 -50 C -70 -60 -66 -112 -34 -104 C -30 -134 30 -134 34 -104 C 66 -112 70 -60 44 -50 Z" fill="#FFFFFF" stroke="#D8E3F5" strokeWidth={3} />
    <path d="M -46 -58 H 46 V -40 C 20 -46 -20 -46 -46 -40 Z" fill="#F5F8FF" stroke="#D8E3F5" strokeWidth={3} />
  </g>
)
/** The baker's apron (body space: shoulders y 205, hips y 360), copied from Cast.tsx. */
const CHEF_APRON = (
  <g data-part="apron">
    <path d="M 170 236 H 230 V 270 C 246 276 250 300 248 330 L 246 420 H 154 L 152 330 C 150 300 154 276 170 270 Z" fill="#FFF4EC" stroke="#FF8A3D" strokeWidth={3} />
    <path d="M 170 236 C 168 220 160 212 152 208 M 230 236 C 232 220 240 212 248 208" stroke="#FF8A3D" strokeWidth={3} fill="none" />
    <rect x={178} y={318} width={44} height={30} rx={6} fill="none" stroke="#FF8A3D" strokeWidth={2.5} />
  </g>
)
/** A carpenter's leather work apron with a pencil and a hammer in its pockets (body space). */
const WORK_APRON = (
  <g data-part="work-apron">
    <path d="M 168 250 H 232 V 276 C 248 284 252 306 250 334 L 248 412 H 152 L 150 334 C 148 306 152 284 168 276 Z" fill="#B47A4A" stroke="#8A5530" strokeWidth={3} />
    <path d="M 168 250 C 166 232 158 216 150 210 M 232 250 C 234 232 242 216 250 210" stroke="#8A5530" strokeWidth={4} fill="none" />
    <rect x={160} y={336} width={36} height={30} rx={5} fill="#9C6538" stroke="#7A4A26" strokeWidth={2} />
    <rect x={204} y={336} width={36} height={30} rx={5} fill="#9C6538" stroke="#7A4A26" strokeWidth={2} />
    <rect x={168} y={318} width={6} height={24} rx={2} fill="#F2C14E" />
    <rect x={214} y={316} width={5} height={30} rx={2} fill="#5B4636" />
    <rect x={206} y={312} width={21} height={8} rx={2} fill="#6B7A90" />
  </g>
)
/** A site builder's hard hat (head-local). */
const HARD_HAT = (
  <g data-part="hard-hat">
    <path d="M -56 -48 C -58 -118 58 -118 56 -48 Z" fill="#F5B82E" stroke="#D99A12" strokeWidth={3} />
    <rect x={-8} y={-110} width={16} height={60} rx={6} fill="#FFD25A" opacity={0.9} />
    <path d="M -72 -46 C -40 -56 40 -56 72 -46 L 70 -38 C 40 -46 -40 -46 -70 -38 Z" fill="#E8A81E" stroke="#C88A0E" strokeWidth={2.5} />
  </g>
)
/** A site safety vest with reflective bands (body space). */
const SITE_VEST = (
  <g data-part="vest">
    <path d="M 150 214 L 182 214 L 192 300 L 186 372 L 146 372 C 140 330 140 260 150 214 Z" fill="#FF8A3D" stroke="#E06A1E" strokeWidth={2.5} />
    <path d="M 250 214 L 218 214 L 208 300 L 214 372 L 254 372 C 260 330 260 260 250 214 Z" fill="#FF8A3D" stroke="#E06A1E" strokeWidth={2.5} />
    <rect x={146} y={300} width={44} height={9} fill="#F4F6FA" />
    <rect x={210} y={300} width={44} height={9} fill="#F4F6FA" />
    <rect x={144} y={336} width={44} height={9} fill="#F4F6FA" />
    <rect x={212} y={336} width={44} height={9} fill="#F4F6FA" />
  </g>
)

const CARPENTER: CharacterConfig = {
  ...PRESETS.rohan,
  name: 'Carpenter',
  outfit: { ...PRESETS.rohan.outfit, top: 'tshirt', topColor: '#2D5BD8', bottom: 'jeans', bottomColor: '#24324F', shoeColor: '#5A3A2A' },
  build: { height: 1.04, shoulders: 1.14 },
}
const CHEF: CharacterConfig = {
  ...PRESETS.dev,
  name: 'Chef',
  outfit: { ...PRESETS.dev.outfit, top: 'shirt', topColor: '#FFFFFF', bottom: 'trousers', bottomColor: '#2C3C81', shoeColor: '#2A2A30' },
}
const BUILDER: CharacterConfig = {
  ...PRESETS.arjun,
  name: 'Builder',
  outfit: { ...PRESETS.arjun.outfit, top: 'shirt', topColor: '#95C2FB', bottom: 'jeans', bottomColor: '#2C3C81', shoeColor: '#5A3A2A' },
}

/**
 * A Character Lab person standing on grid (x, y, z), `h` px tall (before the camera's K), holding one frame of a
 * gesture (no idle motion: people hold still on a slide). `head` / `body` draw role props with the rig.
 */
function Rig({ cfg, x, y, z = 0, h = 136, head, body, gesture, side, amplitude = 1, at = 1.0, flip = false, expression = 'happy', id }: { cfg: CharacterConfig; x: number; y: number; z?: number; h?: number; head?: ReactNode; body?: ReactNode; gesture?: string; side?: 'L' | 'R'; amplitude?: number; at?: number; flip?: boolean; expression?: string; id: string }) {
  const skin = useMemo(() => {
    const s = buildSkin(cfg)
    return { ...s, hairFront: (<>{s.hairFront}{head}</>), top: (<>{s.top}{body}</>) }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  const c = useCharacter({ id: `g-${id}`, clock: 'manual', seed: 3 })
  const { seek, setExpression, play } = c
  useEffect(() => {
    seek(0)
    setExpression(expression)
    if (gesture) play(gesture, { side, amplitude, variation: 0 })
    seek(at)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [px, py] = sv(x, y, z)
  const s = (h * K) / 540
  return (
    <g>
      <ellipse cx={px} cy={py - 1} rx={26} ry={7} fill={ISO.slate} opacity={0.2} />
      <g transform={`translate(${px} ${py}) scale(${flip ? -s : s} ${s}) translate(-200 -580)`} style={{ filter: 'drop-shadow(0 4px 3px rgba(16,32,58,0.18))' }}>
        <Character pose={c.pose} skin={skin} width={400} />
      </g>
    </g>
  )
}

/* ------------------------------------------------------------------ small props */

/** a padlock glyph (svg px, centre bottom at x, y) */
function Padlock({ x, y, s = 1, color = PAL.gold, open = 0 }: { x: number; y: number; s?: number; color?: string; open?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={`M-5 -11 V-15 A5 5 0 0 1 5 -15 V${-11 - 6 * open}`} fill="none" stroke={shade(color, -0.35)} strokeWidth={2.4} strokeLinecap="round" />
      <rect x={-7.5} y={-12} width={15} height={12} rx={2.5} fill={color} stroke={shade(color, -0.3)} strokeWidth={1} />
      <circle cx={0} cy={-6.5} r={1.8} fill={shade(color, -0.5)} />
    </g>
  )
}

/** a key glyph (svg px, bow centre at x, y, pointing right) */
function KeyGlyph({ x, y, s = 1, color = PAL.gold, rot = 0 }: { x: number; y: number; s?: number; color?: string; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} style={{ filter: 'drop-shadow(0 2px 2px rgba(16,32,58,0.25))' }}>
      <circle cx={0} cy={0} r={6.5} fill={color} stroke={shade(color, -0.3)} strokeWidth={1.2} />
      <circle cx={0} cy={0} r={2.4} fill={colors.white} />
      <path d="M6 -1.8 H22 V1.8 H20 V5.5 H16.5 V1.8 H14 V4.5 H10.5 V1.8 H6 Z" fill={color} stroke={shade(color, -0.3)} strokeWidth={1} />
    </g>
  )
}

/* ================================================================== T15 · a workbench of fixed size */

/*
 * TR 15: "A workbench of fixed size cannot hold a job bigger than itself, however strong the worker — just as a
 * model exceeding VRAM cannot load, regardless of GPU speed."
 * Everyday: a carpentry workshop (a pegboard of tools and a window on the back wall, a lumber rack on the side wall,
 * sawdust on the floor); the workbench with its vice, a measuring line along it (its fixed size); the job, a long
 * table top far bigger than the bench, set down on it and overhanging both ends (crossed: it cannot be held); the
 * strong carpenter in his work apron beside it. Concept: the same room as a data-centre bay: the bench a GPU server,
 * its top the GPU card with its VRAM chips (the fixed size), the model a layered slab bigger than the VRAM (crossed,
 * Out Of Memory), and the GPU's speed gauge at full where the worker stands.
 * Links: 1 Workbench Of Fixed Size / VRAM; 2 A Job Bigger Than Itself / Model Exceeding VRAM; 3 However Strong The
 * Worker / Regardless Of GPU Speed. Motion: press 2 sets the job / loads the model once.
 */
const B15 = { x: 1.7, y: 1.55, w: 2.2, d: 0.95, h: 0.85 } as const
const J15 = { x: 0.65, y: 1.62, w: 4.3, d: 0.8, t: 0.1 } as const
const W15: GridPt = [0.85, 3.7]

function PegboardFace() {
  const a0 = 0.45 * UU
  const b0 = 0.3 * UU
  const w = 2.6 * UU
  const h = 1.05 * UU
  return (
    <g>
      <rect x={a0} y={b0} width={w} height={h} rx={4} fill="#E9D7BF" stroke={PAL.woodDark} strokeWidth={1.2} />
      {Array.from({ length: 10 }, (_, i) => Array.from({ length: 4 }, (_, j) => <circle key={`${i}-${j}`} cx={a0 + 8 + i * (w - 16) / 9} cy={b0 + 7 + j * (h - 14) / 3} r={1.1} fill={PAL.woodDark} opacity={0.5} />))}
      {/* a hand saw */}
      <path d={`M${a0 + 12} ${b0 + 10} L${a0 + 52} ${b0 + 10} L${a0 + 52} ${b0 + 26} Z`} fill="#C8D2E0" stroke="#8796AE" strokeWidth={1} />
      <rect x={a0 + 46} y={b0 + 8} width={16} height={20} rx={4} fill="#D2483F" />
      {/* a hammer */}
      <rect x={a0 + 74} y={b0 + 12} width={4} height={30} rx={1.5} fill={PAL.woodDark} />
      <rect x={a0 + 66} y={b0 + 8} width={20} height={7} rx={1.5} fill="#5B6F8A" />
      {/* a spanner */}
      <path d={`M${a0 + 98} ${b0 + 10} v30`} stroke="#8796AE" strokeWidth={4.5} strokeLinecap="round" />
      <circle cx={a0 + 98} cy={b0 + 10} r={5} fill="none" stroke="#8796AE" strokeWidth={3} />
      {/* a set square */}
      <path d={`M${a0 + 116} ${b0 + 8} v32 h24 Z`} fill="none" stroke={colors.brand} strokeWidth={3.5} strokeLinejoin="round" />
      {/* a screwdriver and a chisel */}
      <rect x={a0 + 150} y={b0 + 8} width={5} height={14} rx={2} fill="#F2C14E" />
      <rect x={a0 + 151.5} y={b0 + 22} width={2} height={16} fill="#8796AE" />
      <rect x={a0 + 164} y={b0 + 8} width={5} height={14} rx={2} fill={PAL.woodDark} />
      <rect x={a0 + 164.5} y={b0 + 22} width={4} height={16} fill="#8796AE" />
      {/* a tape measure */}
      <rect x={a0 + 180} y={b0 + 12} width={18} height={18} rx={4} fill="#F5B82E" stroke="#D99A12" />
      <circle cx={a0 + 189} cy={b0 + 21} r={4} fill="#FFFFFF" opacity={0.7} />
    </g>
  )
}

/** a plank-shaped prism along x (grid), thickness t, at height z */
function Plank({ x, y, z, w, d, t, color, op = 1 }: { x: number; y: number; z: number; w: number; d: number; t: number; color: string; op?: number }) {
  return <Box x={x} y={y} z={z} w={w} d={d} h={t} color={color} opacity={op} />
}

/** a dimension line along x on the floor-facing front edge (grid y), with end ticks */
function Dim({ x0, x1, y, z, color, dashed = false, op = 1 }: { x0: number; x1: number; y: number; z: number; color: string; dashed?: boolean; op?: number }) {
  const tr = useTr()
  const [ax, ay] = sv(x0, y, z)
  const [bx, by] = sv(x1, y, z)
  return (
    <g style={{ opacity: op, transition: tr('opacity') }}>
      <line x1={ax} y1={ay} x2={bx} y2={by} stroke={color} strokeWidth={2} strokeDasharray={dashed ? '5 4' : undefined} strokeLinecap="round" />
      <line x1={ax} y1={ay - 6} x2={ax} y2={ay + 6} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <line x1={bx} y1={by - 6} x2={bx} y2={by + 6} stroke={color} strokeWidth={2} strokeLinecap="round" />
    </g>
  )
}

function T15Shell({ dc }: { dc: boolean }) {
  return dc ? (
    <g>
      <Room dc />
      <CableTray />
      <Cooler y={0.5} d={1.1} h={1.7} />
      <Rack x={0.7} />
      <Rack x={1.65} />
      <Rack x={3.75} w={0.75} />
      <Rack x={4.55} w={0.6} />
    </g>
  ) : (
    <g>
      <Room
        dc={false}
        a={
          <g>
            <PegboardFace />
            <WindowFace a={3.55 * UU} b={0.42 * UU} w={1.3 * UU} h={0.95 * UU} />
          </g>
        }
        floor={
          <g>
            {[
              [1.4, 2.9, 0.22],
              [2.2, 3.3, 0.16],
              [4.3, 2.8, 0.2],
              [0.9, 3.5, 0.14],
            ].map(([x, y, r], i) => {
              const [px, py] = sv(x, y, 0)
              return <ellipse key={i} cx={px} cy={py} rx={r * UU} ry={r * UU * 0.45} fill="#E6C9A1" opacity={0.6} />
            })}
          </g>
        }
      />
      {/* a lumber rack on the side wall: planks standing on end */}
      {[0.5, 0.75, 1.0, 1.25, 1.5].map((y, i) => (
        <Box key={i} x={0.05} y={y} w={0.16} d={0.16} h={1.5 + (i % 2) * 0.25} color={i % 2 ? PAL.wood : shade(PAL.wood, -0.1)} />
      ))}
      <Box x={0} y={0.42} w={0.36} d={1.4} h={0.08} color={shade(ISO.steel, 0.1)} />
    </g>
  )
}

function Workbench() {
  const B = B15
  const legs: GridPt[] = [
    [B.x + 0.06, B.y + 0.06],
    [B.x + B.w - 0.16, B.y + 0.06],
    [B.x + 0.06, B.y + B.d - 0.16],
    [B.x + B.w - 0.16, B.y + B.d - 0.16],
  ]
  return (
    <g>
      <Shadow x={B.x} y={B.y} w={B.w} d={B.d} />
      {legs.map(([lx, ly], i) => (
        <Box key={i} x={lx} y={ly} w={0.1} d={0.1} h={B.h - 0.12} color={shade(PAL.wood, -0.15)} />
      ))}
      <Box x={B.x + 0.08} y={B.y + 0.08} z={0.2} w={B.w - 0.16} d={B.d - 0.16} h={0.06} color={shade(PAL.wood, -0.05)} />
      <Box x={B.x} y={B.y} z={B.h - 0.12} w={B.w} d={B.d} h={0.12} color={PAL.wood} />
      {/* the vice at the right end */}
      <Box x={B.x + B.w - 0.05} y={B.y + 0.25} z={B.h - 0.22} w={0.18} d={0.4} h={0.2} color={shade(ISO.steel, -0.05)} />
    </g>
  )
}

function GpuServer() {
  const B = B15
  return (
    <g>
      <Block x={B.x} y={B.y} w={B.w} d={B.d} h={B.h - 0.12} color={shade(ISO.steel, 0.32)} dc />
      {/* the GPU card lying on top: a board with its VRAM chips in a row and two fan discs */}
      <Box x={B.x} y={B.y} z={B.h - 0.12} w={B.w} d={B.d} h={0.12} color="#2A3550" />
      {Array.from({ length: 6 }, (_, i) => (
        <Box key={i} x={B.x + 0.14 + i * 0.34} y={B.y + 0.08} z={B.h} w={0.24} d={0.18} h={0.05} color={PAL.gold} />
      ))}
      {[0.65, 1.55].map((dx, i) => {
        const [cx, cy] = sv(B.x + dx, B.y + 0.6, B.h)
        return (
          <g key={i}>
            <ellipse cx={cx} cy={cy} rx={0.3 * UU * 1.2} ry={0.3 * UU * 0.6} fill="#1A2238" />
            <ellipse cx={cx} cy={cy} rx={0.24 * UU * 1.2} ry={0.24 * UU * 0.6} fill="#3B4A6E" />
            <ellipse cx={cx} cy={cy} rx={6} ry={3} fill="#1A2238" />
          </g>
        )
      })}
    </g>
  )
}

/** the speed gauge on a pedestal, its needle at full (svg px, centred on grid point) */
function SpeedGauge({ x, y }: { x: number; y: number }) {
  const [px, py] = sv(x, y, 1.0)
  const r = 20
  const a = (-90 + 160) * (Math.PI / 180)
  return (
    <g>
      <Block x={x - 0.22} y={y - 0.22} w={0.44} d={0.44} h={1.0} color={shade(ISO.steel, 0.32)} dc />
      <g transform={`translate(${px} ${py - 30})`} style={{ filter: 'drop-shadow(0 4px 3px rgba(16,32,58,0.22))' }}>
        <circle r={r + 4} fill={PAL.navy} />
        <circle r={r} fill={colors.white} />
        <path d={`M${-r * 0.8} ${r * 0.35} A${r * 0.85} ${r * 0.85} 0 1 1 ${r * 0.8} ${r * 0.35}`} fill="none" stroke={shade(colors.brand, 0.55)} strokeWidth={4} />
        <path d={`M${r * 0.5} ${-r * 0.65} A${r * 0.85} ${r * 0.85} 0 0 1 ${r * 0.8} ${r * 0.35}`} fill="none" stroke={colors.brand} strokeWidth={4} />
        <line x1={0} y1={0} x2={Math.cos(a - Math.PI / 2) * r * 0.75} y2={Math.sin(a - Math.PI / 2) * r * 0.75} stroke={ISO.ink} strokeWidth={2.4} strokeLinecap="round" />
        <circle r={2.6} fill={ISO.ink} />
      </g>
    </g>
  )
}

function T15Everyday({ step }: { step: number }) {
  const k = useOnce(step >= 2, ONCE.flow)
  const J = J15
  const z = B15.h + 0.75 * (1 - sm(k))
  const over = step >= 2 && k > 0.95
  const xr = sv(J.x + J.w - 0.25, J.y + J.d / 2, B15.h + 0.1)
  return (
    <Scene
      shift={[0, 0]}
      tags={
        <>
          <Tag n={1} x={232} y={342} to={st(B15.x + 1.0, B15.y + B15.d + 0.08, B15.h - 0.12)} on={step >= 1}>
            Workbench Of Fixed Size
          </Tag>
          <Tag n={2} x={350} y={276} to={st(J.x + J.w - 0.15, J.y + J.d, B15.h + 0.05)} on={step >= 2}>
            A Job Bigger Than Itself
          </Tag>
          <Tag n={3} x={120} y={300} to={st(W15[0] + 0.05, W15[1] + 0.05, 1.2)} on={step >= 3}>
            However Strong The Worker
          </Tag>
        </>
      }
    >
      <T15Shell dc={false} />
      <Workbench />
      {/* the bench's fixed size, a measuring line along its front edge */}
      <Dim x0={B15.x} x1={B15.x + B15.w} y={B15.y + B15.d + 0.08} z={B15.h - 0.12} color={colors.brand} op={step >= 1 ? 1 : 0} />
      {/* the job: a long table top lowered onto the bench, far longer than the bench */}
      <g style={{ opacity: step >= 2 ? 1 : 0, transition: `opacity ${REVEAL_MS}ms ${EASE}` }}>
        <Plank x={J.x} y={J.y} z={z} w={J.w} d={J.d} t={J.t} color={shade(PAL.wood, 0.12)} />
        {/* the overhanging ends, tinted: the part the bench cannot hold */}
        <Quad x={J.x} y={J.y} z={z + J.t} w={B15.x - J.x} d={J.d} fill={colors.danger} opacity={over ? 0.2 : 0} />
        <Quad x={B15.x + B15.w} y={J.y} z={z + J.t} w={J.x + J.w - B15.x - B15.w} d={J.d} fill={colors.danger} opacity={over ? 0.2 : 0} />
      </g>
      <Cross x={xr[0]} y={xr[1] - 16} on={over} />
      {/* the strong carpenter beside the bench, turned to it */}
      <Rig id="t15-carpenter" cfg={CARPENTER} x={W15[0]} y={W15[1]} h={134} body={WORK_APRON} gesture="presentLeft" side="L" amplitude={0.9} at={1.0} expression="neutral" flip />
    </Scene>
  )
}

function T15Concept({ step }: { step: number }) {
  const k = useOnce(step >= 2, ONCE.flow)
  const J = J15
  const z = B15.h + 0.05 + 0.75 * (1 - sm(k))
  const over = step >= 2 && k > 0.95
  const xr = sv(J.x + J.w - 0.25, J.y + J.d / 2, B15.h + 0.3)
  const layers = ['#6C8CF5', '#4C6EF0', '#2D5BD8']
  return (
    <Scene
      shift={[0, 0]}
      tags={
        <>
          <Tag n={1} x={232} y={342} to={st(B15.x + 1.0, B15.y + B15.d + 0.08, B15.h - 0.12)} on={step >= 1} tone="brand">
            VRAM
          </Tag>
          <Tag n={2} x={350} y={276} to={st(J.x + J.w - 0.15, J.y + J.d, B15.h + 0.2)} on={step >= 2} tone="brand">
            Model Exceeding VRAM
          </Tag>
          <Tag n={3} x={120} y={300} to={st(W15[0] + 0.1, W15[1] + 0.1, 1.0)} on={step >= 3} tone="brand">
            Regardless Of GPU Speed
          </Tag>
          <At x={xr[0] + O.ox - 6} y={xr[1] + O.oy - 62} cx>
            <span style={{ opacity: over ? 1 : 0, transition: `opacity ${REVEAL_MS}ms ${EASE}`, whiteSpace: 'nowrap', display: 'block' }}>
              <Label size={13} strong tone="bad" raised>
                Out Of Memory
              </Label>
            </span>
          </At>
        </>
      }
    >
      <T15Shell dc />
      <GpuServer />
      <Dim x0={B15.x} x1={B15.x + B15.w} y={B15.y + B15.d + 0.08} z={B15.h - 0.12} color={colors.brand} op={step >= 1 ? 1 : 0} />
      {/* the model: a layered slab of weights, far bigger than the card's VRAM */}
      <g style={{ opacity: step >= 2 ? 1 : 0, transition: `opacity ${REVEAL_MS}ms ${EASE}` }}>
        {layers.map((c, i) => (
          <Plank key={i} x={J.x} y={J.y} z={z + i * 0.08} w={J.w} d={J.d} t={0.08} color={c} />
        ))}
        <Quad x={J.x} y={J.y} z={z + 0.24} w={B15.x - J.x} d={J.d} fill={colors.danger} opacity={over ? 0.28 : 0} />
        <Quad x={B15.x + B15.w} y={J.y} z={z + 0.24} w={J.x + J.w - B15.x - B15.w} d={J.d} fill={colors.danger} opacity={over ? 0.28 : 0} />
      </g>
      <Cross x={xr[0]} y={xr[1] - 16} on={over} />
      <SpeedGauge x={W15[0]} y={W15[1]} />
    </Scene>
  )
}

/* ================================================================== T19 · a recipe card */

/*
 * TR 19: "A machine image is like a recipe card with every ingredient pre-measured — just as every instance launched
 * from it starts in the exact same state, with nothing improvised."
 * Everyday: a kitchen (wall cabinets and a window over the counter, a stove, a plant); on the counter the recipe card
 * on its stand and every ingredient pre-measured in its own bowl; the chef in cap and apron beside them; on the
 * island in front, the same cake turned out three times, identical. Concept: the same room as a data-centre bay: the
 * AMI mark where the recipe card stands, its contents (OS, software, configuration) as three measured layers where
 * the bowls stand, and three identical instances on the island, each with the same three layers.
 * Links: 1 Recipe Card / Machine Image; 2 Every Ingredient Pre-Measured / Exact Same State, With Nothing Improvised.
 * Motion: press 3, the three dishes / instances come out one after another, once.
 */
const C19 = { x: 0.35, y: 0.0, w: 4.85, d: 0.9, h: 0.9 } as const
const CARD19: GridPt = [1.0, 0.45]
const BOWLS19: GridPt[] = [
  [1.75, 0.45],
  [2.25, 0.45],
  [2.75, 0.45],
  [3.25, 0.45],
]
const BOWL_FILL = ['#FFFFFF', '#F7E7C8', '#F6C531', '#8B5A3C']
const ISL19 = { x: 1.0, y: 2.3, w: 3.3, d: 0.9, h: 0.85 } as const
const DISH19: GridPt[] = [
  [1.5, 2.7],
  [2.65, 2.7],
  [3.8, 2.7],
]
const CHEF19: GridPt = [4.75, 1.45]

function KitchenWallA() {
  return (
    <g>
      {/* wall cabinets left and right of the window */}
      {[0.4, 3.75].map((a, i) => (
        <g key={i}>
          <rect x={a * UU} y={0.25 * UU} width={1.3 * UU} height={0.75 * UU} rx={3} fill={colors.white} stroke={PAL.base} />
          <line x1={a * UU + 0.65 * UU} y1={0.25 * UU} x2={a * UU + 0.65 * UU} y2={1.0 * UU} stroke={PAL.base} />
          <rect x={a * UU + 0.55 * UU} y={0.55 * UU} width={4} height={10} rx={2} fill={PAL.base} />
          <rect x={a * UU + 0.71 * UU} y={0.55 * UU} width={4} height={10} rx={2} fill={PAL.base} />
        </g>
      ))}
      <WindowFace a={1.95 * UU} b={0.3 * UU} w={1.55 * UU} h={0.75 * UU} />
      {/* tiled splashback */}
      <rect x={0.35 * UU} y={1.15 * UU} width={4.85 * UU} height={0.25 * UU} fill="#E8EEF8" />
    </g>
  )
}

/** the counter with cupboard doors and a stove at its right end */
function Counter({ dc }: { dc: boolean }) {
  const C = C19
  const doors = (
    <g>
      {Array.from({ length: 6 }, (_, i) => (
        <g key={i}>
          <rect x={6 + i * ((C.w * UU - 12) / 6)} y={8} width={(C.w * UU - 12) / 6 - 4} height={C.h * UU - 16} rx={2} fill={dc ? shade(colors.brand, 0.75) : '#F7F9FD'} stroke={dc ? shade(colors.brand, 0.4) : PAL.base} strokeWidth={0.8} />
          {!dc && <rect x={6 + i * ((C.w * UU - 12) / 6) + ((C.w * UU - 12) / 6 - 4) / 2 - 6} y={14} width={12} height={3} rx={1.5} fill={PAL.base} />}
        </g>
      ))}
    </g>
  )
  return (
    <g>
      <Shadow x={C.x} y={C.y} w={C.w} d={C.d} />
      <Box x={C.x} y={C.y} w={C.w} d={C.d} h={C.h - 0.08} color={dc ? shade(ISO.steel, 0.3) : '#EEF2F8'} onLeft={dc ? undefined : doors} />
      <Box x={C.x} y={C.y} z={C.h - 0.08} w={C.w} d={C.d} h={0.08} color={dc ? shade(ISO.steel, 0.1) : '#D7DFEC'} />
      {!dc &&
        [
          [4.35, 0.3],
          [4.75, 0.3],
          [4.35, 0.62],
          [4.75, 0.62],
        ].map(([x, y], i) => {
          const [px, py] = sv(x, y, C.h)
          return <ellipse key={i} cx={px} cy={py} rx={9} ry={4.5} fill="none" stroke="#3E4A63" strokeWidth={2.4} />
        })}
    </g>
  )
}

/** the recipe card on a little stand (svg px from a grid point on the counter) */
function RecipeCard({ x, y, z }: { x: number; y: number; z: number }) {
  const [px, py] = sv(x, y, z)
  return (
    <g style={{ filter: 'drop-shadow(0 4px 3px rgba(16,32,58,0.22))' }} transform={`translate(${px} ${py}) scale(1.3) translate(${-px} ${-py})`}>
      <path d={`M${px - 4} ${py} L${px + 4} ${py - 8}`} stroke={PAL.woodDark} strokeWidth={3} />
      <rect x={px - 21} y={py - 52} width={42} height={48} rx={3} fill="#FFFBF1" stroke="#E7D9B8" strokeWidth={1} />
      <rect x={px - 21} y={py - 52} width={42} height={8} rx={2} fill={colors.brand} />
      <circle cx={px - 13} cy={py - 36} r={4} fill="#F59E0B" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <circle cx={px - 14} cy={py - 26 + i * 6} r={1.4} fill={PAL.navy} />
          <rect x={px - 10} y={py - 27 + i * 6} width={22 - (i % 2) * 6} height={2.2} rx={1.1} fill="#9AA7BE" />
        </g>
      ))}
      <rect x={px - 5} y={py - 39} width={20} height={2.4} rx={1.2} fill="#9AA7BE" />
    </g>
  )
}

/** a small bowl of one pre-measured ingredient (svg px) */
function Bowl({ x, y, z, fill }: { x: number; y: number; z: number; fill: string }) {
  const [px, py] = sv(x, y, z)
  return (
    <g style={{ filter: 'drop-shadow(0 3px 2px rgba(16,32,58,0.2))' }} transform={`translate(${px} ${py}) scale(1.35) translate(${-px} ${-py})`}>
      <path d={`M${px - 13} ${py - 10} Q${px - 12} ${py + 1} ${px} ${py + 1} Q${px + 12} ${py + 1} ${px + 13} ${py - 10} Z`} fill={colors.white} stroke="#C9D3E6" strokeWidth={1} />
      <ellipse cx={px} cy={py - 10} rx={13} ry={4.5} fill={colors.white} stroke="#C9D3E6" strokeWidth={1} />
      <ellipse cx={px} cy={py - 10} rx={10.5} ry={3.2} fill={fill} />
      <rect x={px - 7} y={py - 6} width={14} height={2.2} rx={1.1} fill={colors.brand} opacity={0.65} />
    </g>
  )
}

/** a cake on a plate (svg px) */
function Cake({ x, y, z }: { x: number; y: number; z: number }) {
  const [px, py] = sv(x, y, z)
  return (
    <g style={{ filter: 'drop-shadow(0 4px 3px rgba(16,32,58,0.22))' }}>
      <ellipse cx={px} cy={py} rx={22} ry={8} fill={colors.white} stroke="#C9D3E6" />
      <path d={`M${px - 15} ${py - 18} V${py - 3} Q${px} ${py + 4} ${px + 15} ${py - 3} V${py - 18} Z`} fill="#D99A5B" />
      <path d={`M${px - 15} ${py - 12} Q${px} ${py - 5} ${px + 15} ${py - 12}`} fill="none" stroke="#FFF4EC" strokeWidth={2.6} />
      <ellipse cx={px} cy={py - 18} rx={15} ry={5.5} fill="#FFF4EC" />
      <circle cx={px} cy={py - 22} r={3.4} fill="#D2483F" />
    </g>
  )
}

/** three stacked layers: an image's / an instance's OS, software and configuration (grid point, svg px) */
function Layers3({ x, y, z, s = 1 }: { x: number; y: number; z: number; s?: number }) {
  const c = ['#2D5BD8', '#4C6EF0', '#8FA9F7']
  const w = 0.42 * s
  return (
    <g>
      {c.map((col, i) => (
        <Box key={i} x={x - w / 2} y={y - w / 2} z={z + i * 0.1 * s} w={w} d={w} h={0.08 * s} color={col} />
      ))}
    </g>
  )
}

function T19Shell({ dc }: { dc: boolean }) {
  return dc ? (
    <g>
      <Room dc a={undefined} />
      <CableTray />
      <Cooler y={0.6} d={1.2} h={1.7} />
    </g>
  ) : (
    <g>
      <Room dc={false} a={<KitchenWallA />} floor={<Quad x={0.8} y={1.9} w={3.9} d={1.7} fill={PAL.rug} opacity={0.7} />} />
      <Plant x={0.4} y={3.3} />
    </g>
  )
}

function T19Everyday({ step }: { step: number }) {
  const k = useOnce(step >= 3, ONCE.flow * 1.4)
  const z = C19.h
  const card = st(CARD19[0], CARD19[1] + 0.45, z)
  const bowl = st(BOWLS19[1][0] + 0.25, BOWLS19[1][1] + 0.45, z)
  const [cx, cy] = sv(CARD19[0], CARD19[1], z)
  return (
    <Scene
      shift={[0, 0]}
      tags={
        <>
          <Tag n={1} x={92} y={262} to={[card[0], card[1] - 12]} on={step >= 1}>
            Recipe Card
          </Tag>
          <Tag n={2} x={300} y={334} to={[bowl[0], bowl[1] - 6]} on={step >= 2}>
            Every Ingredient Pre-Measured
          </Tag>
        </>
      }
    >
      <T19Shell dc={false} />
      <Counter dc={false} />
      <RecipeCard x={CARD19[0]} y={CARD19[1]} z={z} />
      <Halo x={cx} y={cy - 28} r={32} on={step === 1} />
      {BOWLS19.map(([x, y], i) => (
        <Bowl key={i} x={x} y={y} z={z} fill={BOWL_FILL[i]} />
      ))}
      <Halo x={sv(2.5, 0.45, z)[0]} y={sv(2.5, 0.45, z)[1] - 8} r={46} on={step === 2} />
      {/* the chef beside the counter, turned to the recipe and the bowls */}
      <Rig id="t19-chef" cfg={CHEF} x={CHEF19[0]} y={CHEF19[1]} h={132} head={CHEF_CAP} body={CHEF_APRON} gesture="presentLeft" side="L" amplitude={0.9} at={1.0} />
      {/* the island: the same cake, three times */}
      <Block x={ISL19.x} y={ISL19.y} w={ISL19.w} d={ISL19.d} h={ISL19.h} color={shade(PAL.wood, 0.25)} />
      {DISH19.map(([x, y], i) => {
        const p = sm(part(k, i, 3))
        return (
          <g key={i} style={{ opacity: p }} transform={`translate(0 ${(1 - p) * 10})`}>
            <Cake x={x} y={y} z={ISL19.h} />
          </g>
        )
      })}
    </Scene>
  )
}

function T19Concept({ step }: { step: number }) {
  const k = useOnce(step >= 3, ONCE.flow * 1.4)
  const z = C19.h
  const ami = st(CARD19[0], CARD19[1] + 0.45, z)
  const inst = st(DISH19[2][0] + 0.42, DISH19[2][1] + 0.38, ISL19.h + 0.2)
  const [ax, ay] = sv(CARD19[0], CARD19[1], z)
  return (
    <Scene
      shift={[0, 0]}
      tags={
        <>
          <Tag n={1} x={92} y={262} to={[ami[0], ami[1] - 12]} on={step >= 1} tone="brand">
            Machine Image
          </Tag>
          <Tag n={2} x={250} y={342} to={[inst[0], inst[1]]} on={step >= 2} tone="brand">
            Exact Same State, With Nothing Improvised
          </Tag>
        </>
      }
    >
      <T19Shell dc />
      {/* racks behind the counter line */}
      <Rack x={0.4} w={0.8} h={1.0} y={0} d={0.5} />
      <Counter dc />
      <Mark src={mAmi} x={CARD19[0]} y={CARD19[1]} z={z} h={44} ring={step === 1 ? colors.brand : undefined} />
      <Halo x={ax} y={ay - 28} r={32} on={step === 1} />
      {/* what the image holds, measured out where the bowls stand: OS, software and configuration */}
      {BOWLS19.slice(0, 3).map(([x, y], i) => (
        <Layers3 key={i} x={x + 0.25} y={y} z={z} s={0.9} />
      ))}
      <Halo x={sv(2.5, 0.45, z)[0]} y={sv(2.5, 0.45, z)[1] - 8} r={46} on={step === 2} />
      <Rack x={4.4} w={0.75} h={1.9} y={0} d={0.55} />
      <Block x={ISL19.x} y={ISL19.y} w={ISL19.w} d={ISL19.d} h={ISL19.h} color={shade(ISO.steel, 0.32)} dc />
      {DISH19.map(([x, y], i) => {
        const p = sm(part(k, i, 3))
        return (
          <g key={i} style={{ opacity: p }} transform={`translate(0 ${(1 - p) * 10})`}>
            <Mark src={mEc2Instance} x={x - 0.15} y={y + 0.05} z={ISL19.h} h={36} />
            <Layers3 x={x + 0.42} y={y + 0.38} z={ISL19.h} s={0.6} />
          </g>
        )
      })}
      {step >= 3 &&
        DISH19.map(([x, y], i) => (
          <Dot key={i} points={[[CARD19[0] + 0.3, CARD19[1] + 0.5], [x - 0.15, y - 0.1]]} z={z + 0.2} t={part(k, i, 3, 0.4)} r={3.2} />
        ))}
    </Scene>
  )
}

/* ================================================================== T21 · a rented locker */

/*
 * TR 21: "A key pair works like a locker whose lock the renter alone can open — the facility keeps only the lock
 * pattern, never a copy of the key — just as the instance holds only the public key, never the private one."
 * Everyday: a locker room (a wall of lockers, a bench, a mat), the renter at his locker with his own key; the facility
 * desk with its attendant, a card on the desk showing only the lock's pattern, and the key board behind it with no
 * copy of the key (crossed). Concept: the same room as a data-centre bay: the instance (EC2 mark) where the locker
 * is, carrying the public key's lock; the owner (the boy with a laptop) where the renter stands, the private key on
 * his laptop; at the desk, the instance's record holding only the public key, and no copy of the private key
 * (crossed). Links: 1 The Renter Alone Can Open / Private Key; 2 Keeps Only The Lock Pattern / Holds Only The Public
 * Key; 3 Never A Copy Of The Key / Never The Private One. Motion: press 1, the key turns and the locker door opens
 * once / the login rides once from the laptop to the instance, which opens.
 */
const LW21 = { x: 0.3, w: 3.2, d: 0.5, h: 2.05 } as const
const L21_COLS = 4
const L21_ROWS = 2
const L21_HIT = { c: 0, r: 1 } as const
const RENT21: GridPt = [3.1, 1.2]
const DESK21 = { x: 0.75, y: 1.65, w: 0.6, d: 1.45, h: 0.85 } as const
const ATT21: GridPt = [0.32, 2.45]

function LockerFace({ dc, open }: { dc: boolean; open: number }) {
  const W = LW21.w * UU
  const H = LW21.h * UU
  const pad = 7
  const cw = (W - pad * 2) / L21_COLS
  const rh = (H - pad * 2) / L21_ROWS
  return (
    <g>
      {Array.from({ length: L21_ROWS }, (_, r) =>
        Array.from({ length: L21_COLS }, (_, c) => {
          const hit = c === L21_HIT.c && r === L21_HIT.r
          const x = pad + c * cw + 2
          const y = pad + r * rh + 2
          const w = cw - 4
          const h = rh - 4
          if (dc) {
            return (
              <g key={`${r}-${c}`}>
                <rect x={x} y={y} width={w} height={h} rx={2} fill={shade(PAL.rack, 0.06)} stroke={shade(PAL.rack, -0.3)} strokeWidth={0.8} />
                {Array.from({ length: 5 }, (_, i) => (
                  <g key={i}>
                    <rect x={x + 4} y={y + 6 + i * ((h - 12) / 5)} width={w - 8} height={(h - 12) / 5 - 4} rx={1.5} fill={shade(PAL.rack, 0.2)} />
                    <circle cx={x + 8} cy={y + 6 + i * ((h - 12) / 5) + ((h - 12) / 5 - 4) / 2} r={1.5} fill={i % 2 ? ISO.green : colors.brand} />
                  </g>
                ))}
              </g>
            )
          }
          const fill = '#5C7CC9'
          if (hit) {
            const dw = w * (1 - 0.66 * open)
            return (
              <g key={`${r}-${c}`}>
                <rect x={x} y={y} width={w} height={h} rx={2} fill={shade(ISO.ink, 0.3)} />
                {/* the renter's things inside: a bag and a jacket */}
                <rect x={x + 6} y={y + h - 24} width={w * 0.45} height={18} rx={4} fill="#F59E0B" opacity={open > 0.25 ? 1 : 0} />
                <rect x={x + w * 0.52} y={y + 8} width={w * 0.3} height={h * 0.5} rx={3} fill="#D2483F" opacity={open > 0.25 ? 1 : 0} />
                <path d={`M${x} ${y} L${x + dw} ${y - 5 * open} L${x + dw} ${y + h + 5 * open} L${x} ${y + h} Z`} fill={fill} stroke={shade(fill, -0.3)} strokeWidth={0.8} />
                {[0, 1, 2].map((i) => (
                  <rect key={i} x={x + dw * 0.25} y={y + 8 + i * 5} width={dw * 0.5} height={2.4} rx={1.2} fill={colors.white} opacity={0.65} />
                ))}
              </g>
            )
          }
          return (
            <g key={`${r}-${c}`}>
              <rect x={x} y={y} width={w} height={h} rx={2} fill={fill} stroke={shade(fill, -0.3)} strokeWidth={0.8} />
              {[0, 1, 2].map((i) => (
                <rect key={i} x={x + w * 0.25} y={y + 8 + i * 5} width={w * 0.5} height={2.4} rx={1.2} fill={colors.white} opacity={0.65} />
              ))}
              <rect x={x + w - 9} y={y + h / 2 - 7} width={4} height={14} rx={2} fill={colors.white} opacity={0.8} />
            </g>
          )
        }),
      )}
    </g>
  )
}

/** grid point of the renter's locker lock (on the wall's front face) */
const L21_LOCK: [number, number, number] = [
  LW21.x + 7 / UU + (L21_HIT.c + 1) * ((LW21.w - 14 / UU) / L21_COLS) - 0.12,
  LW21.d,
  LW21.h - 7 / UU - (L21_HIT.r + 0.5) * ((LW21.h - 14 / UU) / L21_ROWS),
]

/** the key board on wall A behind the desk (face px): hooks, none holding a copy of the renter's key */
/** the reception counter: a white top over a wood front panel (grid) */
function Reception({ dc }: { dc: boolean }) {
  const D = DESK21
  return dc ? (
    <Block x={D.x} y={D.y} w={D.w} d={D.d} h={D.h} color={shade(ISO.steel, 0.32)} dc />
  ) : (
    <g>
      <Shadow x={D.x} y={D.y} w={D.w} d={D.d} />
      <Box x={D.x} y={D.y} w={D.w} d={D.d} h={D.h - 0.08} color={shade(PAL.wood, 0.05)} onRight={<g><rect x={8} y={8} width={D.d * UU - 16} height={(D.h - 0.08) * UU - 16} rx={3} fill="none" stroke={PAL.woodDark} strokeWidth={1.2} /></g>} />
      <Box x={D.x - 0.04} y={D.y - 0.04} z={D.h - 0.08} w={D.w + 0.08} d={D.d + 0.08} h={0.08} color="#F4F6FA" />
    </g>
  )
}

/** a small key board standing on the counter: hooks, and no copy of the renter's key on them (svg px) */
function KeyBoard({ x, y, dc }: { x: number; y: number; dc: boolean }) {
  return (
    <g style={{ filter: 'drop-shadow(0 3px 2px rgba(16,32,58,0.2))' }}>
      <rect x={x - 20} y={y - 34} width={40} height={30} rx={3} fill={dc ? colors.white : shade(PAL.wood, 0.15)} stroke={dc ? colors.brand : PAL.woodDark} strokeWidth={1.2} />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={x - 12 + i * 12} cy={y - 27} r={1.8} fill={PAL.navy} />
      ))}
      <g opacity={0.4}>
        <KeyGlyph x={x - 8} y={y - 16} s={0.62} color={shade(ISO.steel, 0.1)} />
      </g>
    </g>
  )
}

function Bench21({ dc }: { dc: boolean }) {
  return (
    <g>
      <Shadow x={3.2} y={2.75} w={1.6} d={0.4} />
      {[3.3, 4.6].map((x) => (
        <Box key={x} x={x} y={2.8} w={0.1} d={0.3} h={0.38} color={shade(ISO.steel, -0.1)} />
      ))}
      <Box x={3.2} y={2.75} w={1.6} d={0.4} z={0.38} h={0.07} color={dc ? shade(ISO.steel, 0.25) : PAL.wood} />
    </g>
  )
}

function T21Everyday({ step }: { step: number }) {
  const open = useOnce(step >= 1, ONCE.door)
  const D = DESK21
  const lock = sv(L21_LOCK[0], L21_LOCK[1], L21_LOCK[2])
  const card = sv(D.x + D.w / 2, D.y + 0.35, D.h)
  const kb = sv(D.x + D.w / 2, D.y + D.d - 0.3, D.h)
  return (
    <Scene
      shift={[0, 0]}
      tags={
        <>
          <Tag n={1} x={350} y={300} to={[lock[0] + O.ox + 4, lock[1] + O.oy + 4]} on={step >= 1}>
            The Renter Alone Can Open
          </Tag>
          <Tag n={2} x={250} y={344} to={[card[0] + O.ox, card[1] + O.oy - 8]} on={step >= 2}>
            Keeps Only The Lock Pattern
          </Tag>
          <Tag n={3} x={120} y={300} to={[kb[0] + O.ox, kb[1] + O.oy - 18]} on={step >= 3}>
            Never A Copy Of The Key
          </Tag>
        </>
      }
    >
      <Room dc={false} floor={<Quad x={0.5} y={0.9} w={2.9} d={1.4} fill="#DCE8F7" />} />
      <Shadow x={LW21.x} y={0} w={LW21.w} d={LW21.d} />
      <Box x={LW21.x} y={0} w={LW21.w} d={LW21.d} h={LW21.h} color={shade(ISO.steel, 0.38)} onLeft={<LockerFace dc={false} open={open} />} />
      {/* the renter's own key in his locker's lock */}
      <KeyGlyph x={lock[0] + 4} y={lock[1] + 2} s={0.95} rot={8} />
      <Halo x={lock[0] + 6} y={lock[1]} r={20} on={step === 1} color={PAL.gold} />
      <Plant x={4.85} y={0.45} />
      {/* the attendant behind the facility desk, turned to the renter */}
      <Spr k="reception" x={ATT21[0]} y={ATT21[1]} h={128} flip />
      <Reception dc={false} />
      <g style={{ opacity: step >= 2 ? 1 : 0, transition: `opacity ${REVEAL_MS}ms ${EASE}` }}>
        <rect x={card[0] - 17} y={card[1] - 30} width={34} height={28} rx={3} fill={colors.white} stroke={colors.brand} strokeWidth={1.2} style={{ filter: 'drop-shadow(0 3px 2px rgba(16,32,58,0.2))' }} />
        <Padlock x={card[0]} y={card[1] - 6} s={1.05} color={shade(colors.brand, 0.55)} />
      </g>
      <KeyBoard x={kb[0]} y={kb[1]} dc={false} />
      <Cross x={kb[0] + 16} y={kb[1] - 36} on={step >= 3} r={9} />
      {/* the renter at his locker, turned to it */}
      <Spr k="man" x={RENT21[0]} y={RENT21[1]} h={132} />
      <Bench21 dc={false} />
    </Scene>
  )
}

function T21Concept({ step }: { step: number }) {
  const t = useOnce(step >= 1, ONCE.flow, 'linear')
  const D = DESK21
  const inst = sv(L21_LOCK[0] - 0.35, LW21.d + 0.2, 0.91)
  const rec = sv(D.x + D.w / 2, D.y + 0.35, D.h)
  const kb = sv(D.x + D.w / 2, D.y + D.d - 0.3, D.h)
  const lap = sv(RENT21[0] + 0.15, RENT21[1] + 0.15, 0)
  const login: GridPt[] = [
    [RENT21[0] - 0.1, RENT21[1] - 0.05],
    [L21_LOCK[0] - 0.35, LW21.d + 0.45],
  ]
  return (
    <Scene
      shift={[0, 0]}
      tags={
        <>
          <Tag n={1} x={350} y={300} to={[lap[0] + O.ox - 4, lap[1] + O.oy - 44]} on={step >= 1} tone="brand">
            Private Key
          </Tag>
          <Tag n={2} x={250} y={344} to={[rec[0] + O.ox, rec[1] + O.oy - 8]} on={step >= 2} tone="brand">
            Holds Only The Public Key
          </Tag>
          <Tag n={3} x={120} y={300} to={[kb[0] + O.ox, kb[1] + O.oy - 18]} on={step >= 3} tone="brand">
            Never The Private One
          </Tag>
        </>
      }
    >
      <Room dc />
      <CableTray />
      <Shadow x={LW21.x} y={0} w={LW21.w} d={LW21.d} />
      <Box x={LW21.x} y={0} w={LW21.w} d={LW21.d} h={LW21.h} color={PAL.rack} onLeft={<LockerFace dc open={0} />} />
      {/* the instance where the renter's locker is: the EC2 mark on a shelf, the public key's lock beside it */}
      <Box x={L21_LOCK[0] - 0.75} y={LW21.d} z={0.85} w={0.8} d={0.4} h={0.06} color={shade(ISO.steel, 0.2)} />
      <Mark src={mEc2Instance} x={L21_LOCK[0] - 0.35} y={LW21.d + 0.2} z={0.91} h={40} ring={step >= 1 && t > 0.95 ? colors.success : undefined} />
      <Padlock x={inst[0] + 30} y={inst[1] - 6} s={1.1} color={shade(colors.brand, 0.35)} open={step >= 1 ? sm((t - 0.85) / 0.15) : 0} />
      <Rack x={3.75} w={0.7} h={1.9} y={0} d={0.5} />
      <Rack x={4.5} w={0.65} h={1.9} y={0} d={0.5} />
      {/* at the desk: the instance's record, the public key only, and no copy of the private key */}
      <Reception dc />
      <g style={{ opacity: step >= 2 ? 1 : 0, transition: `opacity ${REVEAL_MS}ms ${EASE}` }}>
        <rect x={rec[0] - 17} y={rec[1] - 30} width={34} height={28} rx={3} fill={colors.white} stroke={colors.brand} strokeWidth={1.2} style={{ filter: 'drop-shadow(0 3px 2px rgba(16,32,58,0.2))' }} />
        <Padlock x={rec[0]} y={rec[1] - 6} s={1.05} color={shade(colors.brand, 0.35)} />
      </g>
      <KeyBoard x={kb[0]} y={kb[1]} dc />
      <Route points={login} z={1.0} color={colors.brand} op={step >= 1 ? 0.8 : 0} dashed />
      {step >= 1 && <Dot points={login} z={1.0} t={t} />}
      <Cross x={kb[0] + 16} y={kb[1] - 36} on={step >= 3} r={9} />
      {/* the owner where the renter stands: the boy with his laptop, the private key on it */}
      <Spr k="userboy" x={RENT21[0]} y={RENT21[1]} h={104} />
      <KeyGlyph x={lap[0] - 2} y={lap[1] - 48} s={0.95} rot={-8} />
      <Bench21 dc />
    </Scene>
  )
}

/* ================================================================== T25 · a builder's standard house plan */

/*
 * TR 25: "A launch template is like a builder's standard house plan: every house built from it gets the same layout
 * and door locks — just as every instance launched gets the same AMI, instance type and security group from the
 * template."
 * Everyday: a housing site (grass plots, a road, a pallet of bricks, cones, a tree); the builder in hard hat and vest
 * beside the plan on its drafting stand (a floor plan drawn on blueprint paper); a row of three houses built from it,
 * the same layout, the same door lock on every door. Concept: the same site as a data-centre floor: the launch
 * template card on the stand (the AMI, the instance type and the security group drawn on it), and three instances in
 * a row, each with the same AMI badge, the same size, and the same security group shield.
 * Links: 1 Standard House Plan / Launch Template; 2 Same Layout / Same AMI And Instance Type; 3 Same Door Locks / Same
 * Security Group. Motion: press 2, the houses / instances rise one after another, once.
 */
const HOUSES25: number[] = [0.45, 2.05, 3.65]
const HY25 = 0.35
const HW25 = 1.2
const HD25 = 1.0
const HH25 = 0.8
const PLAN25: GridPt = [1.9, 3.3]
const BLD25: GridPt = [0.62, 3.62]

function Ground({ dc }: { dc: boolean }) {
  const tiles: ReactNode[] = []
  if (dc) for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) if ((i + j) % 2) tiles.push(<Quad key={`${i}-${j}`} x={i * (R.W / 6)} y={j * (R.D / 5)} w={R.W / 6} d={R.D / 5} fill={PAL.tileDc} opacity={0.55} />)
  return (
    <g>
      <Box x={0} y={0} z={-0.12} w={R.W} d={R.D} h={0.12} color={dc ? PAL.floorDc : PAL.grass} tone={dc ? undefined : { top: PAL.grass, left: shade(PAL.grass, -0.12), right: shade(PAL.grass, -0.2) }} />
      {tiles}
      {!dc && (
        <g>
          {HOUSES25.map((x, i) => (
            <Quad key={i} x={x - 0.15} y={HY25 - 0.15} w={HW25 + 0.3} d={HD25 + 0.55} fill={PAL.grassDark} opacity={0.8} />
          ))}
          <Quad x={0} y={1.95} w={R.W} d={0.55} fill={PAL.road} />
          {[0.3, 1.3, 2.3, 3.3, 4.3].map((x) => (
            <Quad key={x} x={x} y={2.19} w={0.45} d={0.07} fill={colors.white} opacity={0.9} />
          ))}
        </g>
      )}
      {dc && <Quad x={0} y={1.95} w={R.W} d={0.55} fill={shade(colors.brand, 0.7)} opacity={0.7} />}
    </g>
  )
}

/** one house: walls, a gable roof, windows, a door with its lock (grid); `k` rises it from the ground (0..1) */
function House({ x, k, lockLit }: { x: number; k: number; lockLit: boolean }) {
  const y = HY25
  const h = HH25 * k
  const roofH = 0.55 * k
  const wall = PAL.brick
  const W = HW25
  const D = HD25
  /* the gable roof: ridge along x at the middle of the depth */
  const a = sv(x - 0.06, y - 0.06, h)
  const b = sv(x + W + 0.06, y - 0.06, h)
  const c = sv(x + W + 0.06, y + D + 0.06, h)
  const d = sv(x - 0.06, y + D + 0.06, h)
  const r1 = sv(x - 0.06, y + D / 2, h + roofH)
  const r2 = sv(x + W + 0.06, y + D / 2, h + roofH)
  const P2 = (q: [number, number][]) => q.map(([u, v]) => `${u.toFixed(1)},${v.toFixed(1)}`).join(' ')
  return (
    <g opacity={k > 0.02 ? 1 : 0}>
      <Shadow x={x} y={y} w={W} d={D} opacity={0.12 * k} />
      <Box
        x={x}
        y={y}
        w={W}
        d={D}
        h={Math.max(0.01, h)}
        color={wall}
        onLeft={
          k > 0.6 ? (
            <g>
              <rect x={0.16 * UU} y={h * UU - 0.62 * UU} width={0.3 * UU} height={0.62 * UU} rx={2} fill={PAL.woodDark} />
              <circle cx={0.16 * UU + 0.24 * UU} cy={h * UU - 0.32 * UU} r={3.4} fill={lockLit ? PAL.gold : shade(PAL.gold, -0.2)} stroke={lockLit ? '#B07D10' : 'none'} />
              <rect x={0.62 * UU} y={h * UU - 0.62 * UU} width={0.4 * UU} height={0.3 * UU} rx={2} fill={PAL.glass} stroke={colors.white} strokeWidth={2} />
            </g>
          ) : undefined
        }
        onRight={
          k > 0.6 ? (
            <g>
              <rect x={0.3 * UU} y={h * UU - 0.62 * UU} width={0.4 * UU} height={0.3 * UU} rx={2} fill={PAL.glass} stroke={colors.white} strokeWidth={2} />
            </g>
          ) : undefined
        }
      />
      {/* roof: back slope, front slope, gable end */}
      <polygon points={P2([a, b, r2, r1])} fill={shade(PAL.roof, 0.15)} stroke={shade(PAL.roof, -0.3)} strokeWidth={0.75} />
      <polygon points={P2([b, c, r2])} fill={shade(PAL.brick, -0.12)} stroke={shade(PAL.roof, -0.3)} strokeWidth={0.75} />
      <polygon points={P2([d, c, r2, r1])} fill={PAL.roof} stroke={shade(PAL.roof, -0.3)} strokeWidth={0.75} />
    </g>
  )
}

/** the drafting stand with the house plan on blueprint paper (grid point, svg px) */
function PlanStand({ x, y, dc }: { x: number; y: number; dc: boolean }) {
  const [px, py] = sv(x, y, 0)
  const top = py - 64
  return (
    <g>
      <ellipse cx={px} cy={py} rx={20} ry={6} fill={ISO.slate} opacity={0.2} />
      <path d={`M${px - 12} ${py} L${px} ${top + 30} L${px + 12} ${py}`} fill="none" stroke={dc ? shade(ISO.steel, -0.2) : PAL.woodDark} strokeWidth={3} strokeLinecap="round" />
      <g style={{ filter: 'drop-shadow(0 5px 4px rgba(16,32,58,0.25))' }}>
        <rect x={px - 34} y={top - 6} width={68} height={48} rx={3} fill={dc ? colors.white : '#2E64C9'} stroke={dc ? colors.brand : '#1F4FA8'} strokeWidth={1.4} />
        {dc ? (
          <g>
            <image href={mAmi} x={px - 29} y={top} width={18} height={18} />
            <rect x={px - 8} y={top + 5} width={36} height={8} rx={4} fill={shade(colors.brand, 0.75)} />
            <rect x={px - 29} y={top + 23} width={18} height={12} rx={3} fill={shade(colors.brand, 0.55)} />
            <path d={`M${px + 4} ${top + 21} l9 3 v6 c0 5 -4 8 -9 10 c-5 -2 -9 -5 -9 -10 v-6 z`} fill={colors.brand} />
            <path d={`M${px + 18} ${top + 28} h10`} stroke={shade(colors.brand, 0.4)} strokeWidth={3} strokeLinecap="round" />
          </g>
        ) : (
          <g stroke="#E8F0FF" strokeWidth={1.4} fill="none">
            <rect x={px - 28} y={top} width={56} height={36} />
            <line x1={px - 2} y1={top} x2={px - 2} y2={top + 22} />
            <line x1={px - 28} y1={top + 18} x2={px - 2} y2={top + 18} />
            <line x1={px + 10} y1={top + 18} x2={px + 28} y2={top + 18} />
            <path d={`M${px - 14} ${top + 36} a8 8 0 0 1 8 -8`} />
          </g>
        )}
      </g>
    </g>
  )
}

function SiteProps() {
  /* a pallet of bricks, two cones and a tree, at the site's edges */
  const tree = sv(4.85, 3.4, 0)
  return (
    <g>
      <Box x={4.1} y={2.7} w={0.6} d={0.45} h={0.08} color={PAL.woodDark} />
      {[0, 1].map((r) => (
        <Box key={r} x={4.15} y={2.75} z={0.08 + r * 0.14} w={0.5} d={0.35} h={0.14} color={'#D2704A'} />
      ))}
      {[
        [3.0, 3.5],
        [3.3, 3.7],
      ].map(([x, y], i) => {
        const [cx, cy] = sv(x, y, 0)
        return <path key={i} d={`M${cx - 6} ${cy} L${cx} ${cy - 18} L${cx + 6} ${cy} Z`} fill="#FF8A3D" stroke="#E06A1E" />
      })}
      <rect x={tree[0] - 3} y={tree[1] - 30} width={6} height={30} fill={PAL.woodDark} />
      {[
        [0, -44, 16],
        [-10, -34, 12],
        [10, -34, 12],
      ].map(([dx, dy, r], i) => (
        <circle key={i} cx={tree[0] + dx} cy={tree[1] + dy} r={r} fill={i ? shade(PAL.leaf, -0.1) : PAL.leaf} />
      ))}
    </g>
  )
}

function T25Everyday({ step }: { step: number }) {
  const k = useOnce(step >= 2, ONCE.flow * 1.5)
  const lock = sv(HOUSES25[2] + 0.4, HY25 + HD25, HH25 - 0.32)
  const plan = sv(PLAN25[0], PLAN25[1], 0)
  const wall = sv(HOUSES25[2] + 0.82, HY25 + HD25, 0.5)
  return (
    <Scene
      shift={[0, 0]}
      tags={
        <>
          <Tag n={1} x={140} y={330} to={[plan[0] + O.ox - 10, plan[1] + O.oy - 30]} on={step >= 1}>
            Standard House Plan
          </Tag>
          <Tag n={2} x={330} y={352} to={[wall[0] + O.ox, wall[1] + O.oy]} on={step >= 2}>
            Same Layout
          </Tag>
          <Tag n={3} x={372} y={276} to={[lock[0] + O.ox + 4, lock[1] + O.oy]} on={step >= 3}>
            Same Door Locks
          </Tag>
        </>
      }
    >
      <Ground dc={false} />
      {HOUSES25.map((x, i) => (
        <House key={i} x={x} k={step >= 2 ? sm(part(k, i, 3)) : 0} lockLit={step >= 3} />
      ))}
      {step >= 3 &&
        HOUSES25.map((x, i) => {
          const p = sv(x + 0.4, HY25 + HD25, HH25 - 0.32)
          return <Halo key={i} x={p[0]} y={p[1]} r={9} on color={PAL.gold} />
        })}
      <SiteProps />
      <PlanStand x={PLAN25[0]} y={PLAN25[1]} dc={false} />
      <Halo x={plan[0]} y={plan[1] - 46} r={42} on={step === 1} />
      {/* the builder beside the plan, presenting the row of houses */}
      <Rig id="t25-builder" cfg={BUILDER} x={BLD25[0]} y={BLD25[1]} h={128} head={HARD_HAT} body={SITE_VEST} gesture="presentLeft" side="L" amplitude={0.9} at={1.0} flip />
    </Scene>
  )
}

/** one instance on its plinth: the EC2 mark, its AMI badge and its security group shield (grid) */
function Instance25({ x, k, shieldLit }: { x: number; k: number; shieldLit: boolean }) {
  const cx = x + HW25 / 2
  const cy = HY25 + HD25 / 2
  const top = sv(cx, cy, 0.5)
  return (
    <g style={{ opacity: k }} transform={`translate(0 ${(1 - k) * 14})`}>
      <Block x={x + 0.1} y={HY25 + 0.1} w={HW25 - 0.2} d={HD25 - 0.2} h={0.5} color={shade(ISO.steel, 0.32)} dc />
      <Mark src={mEc2Instance} x={cx} y={cy} z={0.5} h={44} />
      <g style={{ filter: 'drop-shadow(0 3px 2px rgba(16,32,58,0.2))' }}>
        <rect x={top[0] - 35} y={top[1] - 61} width={22} height={22} rx={5} fill={colors.white} stroke="#D5E0F2" />
        <image href={mAmi} x={top[0] - 32} y={top[1] - 58} width={16} height={16} />
        <path d={`M${top[0] + 26} ${top[1] - 62} l11 4 v8 c0 6 -5 10 -11 12 c-6 -2 -11 -6 -11 -12 v-8 z`} fill={shieldLit ? colors.brand : shade(colors.brand, 0.35)} stroke={colors.white} strokeWidth={1.4} />
      </g>
    </g>
  )
}

function T25Concept({ step }: { step: number }) {
  const k = useOnce(step >= 2, ONCE.flow * 1.5)
  const plan = sv(PLAN25[0], PLAN25[1], 0)
  const inst = sv(HOUSES25[2] + HW25 / 2, HY25 + HD25 / 2, 0.5)
  const shield = inst
  return (
    <Scene
      shift={[0, 0]}
      tags={
        <>
          <Tag n={1} x={140} y={330} to={[plan[0] + O.ox - 10, plan[1] + O.oy - 30]} on={step >= 1} tone="brand">
            Launch Template
          </Tag>
          <Tag n={2} x={330} y={352} to={[inst[0] + O.ox - 24, inst[1] + O.oy - 50]} on={step >= 2} tone="brand">
            Same AMI And Instance Type
          </Tag>
          <Tag n={3} x={372} y={276} to={[shield[0] + O.ox + 26, shield[1] + O.oy - 48]} on={step >= 3} tone="brand">
            Same Security Group
          </Tag>
        </>
      }
    >
      <Ground dc />
      {HOUSES25.map((x, i) => (
        <Instance25 key={i} x={x} k={step >= 2 ? sm(part(k, i, 3)) : 0} shieldLit={step >= 3} />
      ))}
      {step >= 2 &&
        HOUSES25.map((x, i) => (
          <Dot key={i} points={[[PLAN25[0], PLAN25[1] - 0.6], [x + HW25 / 2, HY25 + HD25 + 0.2]]} z={0.3} t={part(k, i, 3, 0.4)} r={3.2} />
        ))}
      <PlanStand x={PLAN25[0]} y={PLAN25[1]} dc />
      <Halo x={plan[0]} y={plan[1] - 46} r={42} on={step === 1} />
    </Scene>
  )
}

/* ------------------------------------------------------------------ exports */

export const figures = {
  G_T15Everyday: T15Everyday,
  G_T15Concept: T15Concept,
  G_T19Everyday: T19Everyday,
  G_T19Concept: T19Concept,
  G_T21Everyday: T21Everyday,
  G_T21Concept: T21Concept,
  G_T25Everyday: T25Everyday,
  G_T25Concept: T25Concept,
}

export const slides = {}

/* no CSS loops: every motion is a one-shot tied to its build press */
export const css = ''
