import { useEffect, useId, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { SPEED } from '@/deck/autoAnim'
import { At, Label, REDUCED, STILL, type LabelTone } from '@/decks/figures/scene'
import { Box, ISO, IsoScene, IsoSvg, P, Quad, measure, along, pts, screenPts, shade, useIso, type GridPt } from '@/decks/figures/iso/iso'
import { Character } from '@/decks/figures/cast/rig/Character'
import { useCharacter } from '@/decks/figures/cast/rig/useCharacter'
import { buildSkin, PRESETS, type CharacterConfig } from '@/decks/figures/cast/skins/config'
import type { Action } from '@/decks/figures/cast/rig/track'
import pDoctor from './ppl/doctor.png'

/**
 * BUILDER H · S37 [T14-AN], THE EVERYDAY SIDE ONLY (2026-11-06, correction pass).
 *
 * Overrides f.tsx's F_T14Everyday (index.tsx spreads h last). The concept side, F_T14Concept, stays in f.tsx and
 * is not touched; every matched part here stands where f put it, on the same camera (ox 235, oy 40, 46 px a grid
 * unit), so the pairs still line up across the two stages:
 *   the doctor     on the steel pad at stage (95, 300)   ~ the load balancer
 *   the patient    in a bed over the green pad at (395, 300) ~ the server
 *   the monitor    at (222, 212)                         ~ the meter
 *   the check line (160, 300) to (333, 300), the tick row at (395, 82), the five tags at f's positions.
 *
 * The user's request: a realistic hospital room. The patient is a Character Lab person (the rig, clay shading, the
 * Library look) sitting up in a hospital bed; the room has two walls, a window, a wall clock, a headwall with gas
 * outlets, a vitals monitor on a rolling stand with an ECG trace, an IV stand with a bag, drip chamber and pump.
 * The doctor stays the library render f used.
 *
 * Build (unchanged, 3 presses): 1 the breathing ring and its tag; 2 the check line, its riding dot and its tag;
 * 3 the tick row, its tag, and the monitor's live trace. Quiet continuous loops: the patient breathes and blinks
 * (the rig's own idle layer), the trace scrolls, the monitor and pump lights pulse, a drop falls in the drip
 * chamber. `?still`, thumbnails and reduced motion hold one complete frame.
 */

/* ------------------------------------------------------------------ shared (copied from f.tsx, not imported) */

const SW = 470
const SH = 390
const UU = 46
const EASE = 'cubic-bezier(0.22,1,0.36,1)'
const OX = 235
const OY = 40

type Px = [number, number]

function useHeld() {
  const instant = useInstant()
  return STILL || REDUCED || instant
}

function useTr(ms = 520) {
  const instant = useInstant()
  return (p: string) => (instant ? 'none' : `${p} ${ms}ms ${EASE}`)
}

/** f's quiet loop: a sawtooth 0..1 once `on`, never pausing; `still` on every held frame. */
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

/** Stage px to grid (floor, z 0) on this camera. */
const g = (sx: number, sy: number): GridPt => {
  const a = (sx - OX) / UU
  const b = (sy - OY) / (UU / 2)
  return [(a + b) / 2, (b - a) / 2]
}
/** grid to svg px (the svg is already translated by ox, oy) */
const S = (x: number, y: number, z = 0): Px => P(x, y, z, UU)
const poly = (q: Px[]) => pts(q)

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

function TickRow({ x, y, n, lit, on, gap = 28 }: { x: number; y: number; n: number; lit: number; on: boolean; gap?: number }) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <g key={i} style={{ opacity: i < lit ? 1 : 0.28 }}>
          <Tick x={x + (i - (n - 1) / 2) * gap} y={y} r={9} on={on} />
        </g>
      ))}
    </g>
  )
}

function Route({ points, z = 0.05, color = colors.brand, width = 2.2, op = 1 }: { points: GridPt[]; z?: number; color?: string; width?: number; op?: number }) {
  const tr = useTr()
  const { u } = useIso()
  const q = screenPts(points, z, u)
  const d = q.map(([a, b], i) => `${i ? 'L' : 'M'}${a.toFixed(2)} ${b.toFixed(2)}`).join(' ')
  const [ax, ay] = q[q.length - 2]
  const [bx, by] = q[q.length - 1]
  const ang = Math.atan2(by - ay, bx - ax)
  const L = 10
  const W = 4.6
  const p1: Px = [bx - L * Math.cos(ang) + W * Math.sin(ang), by - L * Math.sin(ang) - W * Math.cos(ang)]
  const p2: Px = [bx - L * Math.cos(ang) - W * Math.sin(ang), by - L * Math.sin(ang) + W * Math.cos(ang)]
  return (
    <g style={{ opacity: op, transition: tr('opacity') }}>
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      <polygon points={pts([[bx, by], p1, p2])} fill={color} />
    </g>
  )
}

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

function Pad({ c, n, fill, stroke }: { c: GridPt; n: number; fill: string; stroke: string }) {
  return <Quad x={c[0] - n / 2} y={c[1] - n / 2} w={n} d={n} fill={fill} stroke={stroke} width={1.2} />
}

/** The breathing ring: rings growing out on a loop, held as one still ring. */
function Ring({ x, y, r, on, color = ISO.green }: { x: number; y: number; r: number; on: boolean; color?: string }) {
  const held = useHeld()
  const tr = useTr()
  return (
    <g style={{ opacity: on ? 1 : 0, transition: tr('opacity') }}>
      <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={2} opacity={held ? 0.55 : 0.25} />
      {!held && on && (
        <>
          <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={2} className="h-ring" />
          <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={2} className="h-ring h-ring2" />
        </>
      )}
    </g>
  )
}

/** The doctor: the same library render f used, standing on its grid point with a soft floor shadow. */
function Doctor({ x, y, h }: { x: number; y: number; h: number }) {
  const [px, py] = S(x, y)
  const w = h * (103 / 220)
  return (
    <g>
      <ellipse cx={px} cy={py - 1} rx={w * 0.34} ry={w * 0.1} fill={ISO.slate} opacity={0.18} />
      <image href={pDoctor} x={px - w / 2} y={py - h} width={w} height={h} preserveAspectRatio="xMidYMax meet" style={{ filter: 'drop-shadow(0 4px 3px rgba(16,32,58,0.18))' }} />
    </g>
  )
}

/* ------------------------------------------------------------------ the layout (f's numbers, unchanged) */

const T14_D: Px = [95, 300]
const T14_P: Px = [395, 300]
const T14_PAD = 1.3
const T14_LINE: Px[] = [
  [160, 300],
  [333, 300],
]
const T14_TICKS: Px = [395, 82]
const T14_MON: Px = [222, 212]

function useChecks(step: number) {
  const t = useLap(step >= 2, 6400, 0.999)
  const k = t * 4
  return { dot: k % 1, lit: Math.min(4, Math.floor(k) + 1) }
}

/* ------------------------------------------------------------------ the room */

/* the room's back corner and wall height; the right wall runs behind the bed, the left one behind the doctor */
const CX = 2.6
const CY = 3.0
const WH = 2.4
const WT = 0.15
const WALL_IN = shade(ISO.paper, 0.35)
const WALL_SIDE = shade(ISO.paper, -0.03)
const STRIPE = shade(colors.teal, 0.55)

function Room() {
  /* floor tiles: the grid lines in front of the two walls */
  const tiles: ReactNode[] = []
  for (let k = 4; k <= 12; k++) {
    const a = S(CX, k)
    const b = S(14, k)
    tiles.push(<line key={`y${k}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={ISO.floor} strokeWidth={1} />)
  }
  for (let k = 3; k <= 12; k++) {
    const a = S(k, CY)
    const b = S(k, 14)
    tiles.push(<line key={`x${k}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={ISO.floor} strokeWidth={1} />)
  }
  const L = 12
  /* right wall (behind the bed): its inner face is the box's left face; local a = (x - (CX - WT)) * UU, b = (WH - z) * UU */
  const ra = (x: number) => (x - (CX - WT)) * UU
  const lb = (z: number) => (WH - z) * UU
  /* left wall (behind the doctor): its inner face is the box's right face; local a = (y - CY) * UU */
  const la = (y: number) => (y - CY) * UU
  return (
    <g>
      <Quad x={-3} y={-3} w={17} d={17} fill={ISO.paper} />
      {tiles}
      {/* the soft shade the walls throw on the floor along their foot */}
      <polygon points={poly([S(CX, CY), S(L, CY), S(L, CY + 0.35), S(CX + 0.35, CY + 0.35)])} fill={ISO.slate} opacity={0.06} />
      <polygon points={poly([S(CX, CY), S(CX + 0.35, CY + 0.35), S(CX + 0.35, L), S(CX, L)])} fill={ISO.slate} opacity={0.05} />
      <Box
        x={CX - WT}
        y={CY - WT}
        w={L}
        d={WT}
        h={WH}
        color={ISO.paper}
        tone={{ left: WALL_IN, top: shade(ISO.steel, 0.55), right: WALL_SIDE, line: shade(ISO.steel, 0.25) }}
        onLeft={
          <g>
            {/* skirting and the hospital stripe */}
            <rect x={0} y={lb(0.12)} width={L * UU} height={0.12 * UU} fill={shade(ISO.steel, 0.45)} />
            <rect x={0} y={lb(1.0)} width={L * UU} height={4} fill={STRIPE} />
            {/* the wall clock: no numbers, twelve marks */}
            <g transform={`translate(${ra(4.85)} ${lb(1.95)})`}>
              <circle r={10.5} fill={colors.white} stroke={shade(ISO.steel, 0.1)} strokeWidth={2} />
              {Array.from({ length: 12 }, (_, i) => {
                const a = (i / 12) * Math.PI * 2
                return <line key={i} x1={Math.sin(a) * 7.4} y1={-Math.cos(a) * 7.4} x2={Math.sin(a) * 8.8} y2={-Math.cos(a) * 8.8} stroke={ISO.slate} strokeWidth={i % 3 ? 0.7 : 1.3} />
              })}
              <line x1={0} y1={0} x2={3.4} y2={-4.4} stroke={ISO.ink} strokeWidth={1.6} strokeLinecap="round" />
              <line x1={0} y1={0} x2={-1.4} y2={-7.2} stroke={ISO.ink} strokeWidth={1.1} strokeLinecap="round" />
              <circle r={1.2} fill={ISO.red} />
            </g>
            {/* the headwall behind the bed's head: a rail with gas outlets and a reading light */}
            <g>
              <rect x={ra(6.0)} y={lb(1.42)} width={1.55 * UU} height={0.26 * UU} rx={3} fill={shade(ISO.steel, 0.62)} stroke={shade(ISO.steel, 0.2)} strokeWidth={1} />
              {[ISO.green, colors.white, ISO.gold, colors.white].map((c, i) => (
                <g key={i} transform={`translate(${ra(6.18 + i * 0.22)} ${lb(1.29)})`}>
                  <circle r={3.6} fill={c} stroke={shade(ISO.steel, -0.1)} strokeWidth={0.9} />
                  <circle r={1.1} fill={ISO.slate} />
                </g>
              ))}
              <rect x={ra(7.08)} y={lb(1.38)} width={0.36 * UU} height={0.18 * UU} rx={2} fill={ISO.ink} />
              <rect x={ra(7.12)} y={lb(1.33)} width={0.12 * UU} height={2.4} rx={1} fill={ISO.green} className="h-led h-led-b" />
              <rect x={ra(6.5)} y={lb(1.9)} width={0.62 * UU} height={0.12 * UU} rx={2.6} fill={colors.white} stroke={shade(ISO.steel, 0.15)} strokeWidth={0.9} />
            </g>
          </g>
        }
      />
      <Box
        x={CX - WT}
        y={CY}
        w={WT}
        d={L}
        h={WH}
        color={ISO.paper}
        tone={{ right: WALL_SIDE, top: shade(ISO.steel, 0.55), left: WALL_IN, line: shade(ISO.steel, 0.25) }}
        onRight={
          <g>
            <rect x={0} y={lb(0.12)} width={L * UU} height={0.12 * UU} fill={shade(ISO.steel, 0.38)} />
            <rect x={0} y={lb(1.0)} width={L * UU} height={4} fill={shade(STRIPE, -0.05)} />
            {/* the window: two panes of sky, a frame, a sill and a gathered curtain */}
            <g>
              <rect x={la(3.55)} y={lb(2.08)} width={1.4 * UU} height={1.08 * UU} rx={2} fill={colors.white} stroke={shade(ISO.steel, 0.1)} strokeWidth={1} />
              <rect x={la(3.62)} y={lb(2.01)} width={0.62 * UU} height={0.94 * UU} fill={ISO.glass} />
              <rect x={la(4.26)} y={lb(2.01)} width={0.62 * UU} height={0.94 * UU} fill={ISO.glass} />
              <path d={`M${la(3.7)} ${lb(1.25)} L${la(4.0)} ${lb(1.95)} L${la(4.12)} ${lb(1.95)} L${la(3.82)} ${lb(1.25)} Z`} fill={colors.white} opacity={0.55} />
              <path d={`M${la(4.36)} ${lb(1.4)} L${la(4.58)} ${lb(1.95)} L${la(4.66)} ${lb(1.95)} L${la(4.44)} ${lb(1.4)} Z`} fill={colors.white} opacity={0.45} />
              <rect x={la(3.48)} y={lb(1.02)} width={1.54 * UU} height={4} rx={1.5} fill={shade(ISO.steel, 0.3)} />
              <path d={`M${la(4.95)} ${lb(2.12)} C ${la(5.05)} ${lb(1.7)}, ${la(4.98)} ${lb(1.3)}, ${la(5.06)} ${lb(0.98)} L ${la(5.3)} ${lb(0.98)} C ${la(5.24)} ${lb(1.4)}, ${la(5.3)} ${lb(1.8)}, ${la(5.22)} ${lb(2.12)} Z`} fill={STRIPE} />
              <path d={`M${la(5.04)} ${lb(2.0)} C ${la(5.1)} ${lb(1.6)}, ${la(5.06)} ${lb(1.3)}, ${la(5.12)} ${lb(1.05)}`} fill="none" stroke={shade(STRIPE, -0.12)} strokeWidth={1} />
              <rect x={la(3.4)} y={lb(2.2)} width={2.0 * UU} height={2.4} rx={1} fill={shade(ISO.steel, 0.1)} />
            </g>
          </g>
        }
      />
    </g>
  )
}

/* ------------------------------------------------------------------ the vitals monitor on its rolling stand */

/** Five spokes and casters of a rolling stand, centred on grid (x, y). */
function Casters({ x, y, r = 0.3 }: { x: number; y: number; r?: number }) {
  const c = S(x, y, 0.07)
  const spokes = Array.from({ length: 5 }, (_, i) => {
    const a = (i / 5) * Math.PI * 2 + 0.3
    return S(x + Math.cos(a) * r, y + Math.sin(a) * r, 0.07)
  })
  return (
    <g>
      <ellipse cx={c[0]} cy={c[1] + 6} rx={r * UU * 1.1} ry={r * UU * 0.5} fill={ISO.slate} opacity={0.12} />
      {spokes.map((p, i) => (
        <g key={i}>
          <line x1={c[0]} y1={c[1]} x2={p[0]} y2={p[1]} stroke={shade(ISO.slate, -0.1)} strokeWidth={2.4} strokeLinecap="round" />
          <ellipse cx={p[0]} cy={p[1] + 2.2} rx={2.6} ry={2} fill={ISO.ink} />
        </g>
      ))}
    </g>
  )
}

/** One beat of an ECG trace (P, QRS, T) as points, `p` px long, baseline `y`. */
const ecgBeat = (x0: number, y: number, p: number): Px[] => {
  const k = p / 20
  return [
    [x0, y],
    [x0 + 3 * k, y],
    [x0 + 4.5 * k, y - 1.8],
    [x0 + 6 * k, y],
    [x0 + 7.4 * k, y + 1.4],
    [x0 + 8.4 * k, y - 8.5],
    [x0 + 9.6 * k, y + 3],
    [x0 + 10.8 * k, y],
    [x0 + 13.2 * k, y - 2.2],
    [x0 + 15.4 * k, y],
    [x0 + 20 * k, y],
  ]
}

/** A pleth wave (the oxygen sensor's pulse): one smooth bump per beat. */
const plethBeat = (x0: number, y: number, p: number) =>
  `M${x0} ${y} C ${x0 + p * 0.18} ${y}, ${x0 + p * 0.22} ${y - 6}, ${x0 + p * 0.34} ${y - 6} S ${x0 + p * 0.5} ${y - 2}, ${x0 + p * 0.56} ${y - 2.6} S ${x0 + p * 0.8} ${y}, ${x0 + p} ${y}`

const MON = { w: 1.25, d: 0.16, h: 0.82, z: 1.38 }
const BEAT = 20

function Monitor({ ok }: { ok: boolean }) {
  const held = useHeld()
  const tr = useTr()
  const id = useId().replace(/:/g, '')
  const [mx, my] = g(...T14_MON)
  const fw = MON.w * UU
  const fh = MON.h * UU
  const sx0 = 3.5
  const sy0 = 3.5
  const sw = fw - 7
  const sh = fh - 12
  const trW = sw - 13
  const beats = Math.ceil(trW / BEAT) + 2
  const live = ok && !held
  const ecg = Array.from({ length: beats }, (_, i) => ecgBeat(sx0 + 1 + i * BEAT, sy0 + 10.5, BEAT)).flat()
  const pleth = Array.from({ length: beats }, (_, i) => plethBeat(sx0 + 1 + i * BEAT, sy0 + sh - 4, BEAT)).join(' ')
  return (
    <g>
      <Casters x={mx} y={my} />
      <Box x={mx - 0.04} y={my - 0.04} w={0.08} d={0.08} z={0.07} h={MON.z - 0.07} color={shade(ISO.steel, 0.1)} stroke={false} />
      {/* a basket on the pole for the cables */}
      <Box x={mx - 0.16} y={my - 0.02} z={0.92} w={0.32} d={0.14} h={0.16} color={shade(ISO.steel, 0.35)} />
      <Box
        x={mx - MON.w / 2}
        y={my - MON.d / 2}
        z={MON.z}
        w={MON.w}
        d={MON.d}
        h={MON.h}
        color={shade(ISO.steel, 0.5)}
        tone={{ left: shade(ISO.steel, 0.62), top: shade(ISO.steel, 0.78), right: shade(ISO.steel, 0.28), line: shade(ISO.steel, -0.15) }}
        onLeft={
          <g>
            <defs>
              <clipPath id={`h-scr-${id}`}>
                <rect x={sx0 + 1} y={sy0} width={trW} height={sh} />
              </clipPath>
            </defs>
            <rect x={sx0} y={sy0} width={sw} height={sh} rx={1.8} fill={ISO.ink} />
            {/* the screen's faint grid */}
            {Array.from({ length: 5 }, (_, i) => (
              <line key={i} x1={sx0 + 1 + (i * trW) / 4} y1={sy0 + 1} x2={sx0 + 1 + (i * trW) / 4} y2={sy0 + sh - 1} stroke={shade(ISO.ink, 0.22)} strokeWidth={0.5} />
            ))}
            <line x1={sx0 + 1} y1={sy0 + sh / 2 + 1} x2={sx0 + trW} y2={sy0 + sh / 2 + 1} stroke={shade(ISO.ink, 0.22)} strokeWidth={0.5} />
            {/* before the check: a flat grey line; after it, the beat runs */}
            <line x1={sx0 + 2} y1={sy0 + 10.5} x2={sx0 + trW} y2={sy0 + 10.5} stroke={shade(ISO.steel, 0.2)} strokeWidth={1.4} style={{ opacity: ok ? 0 : 1, transition: tr('opacity') }} />
            <line x1={sx0 + 2} y1={sy0 + sh - 4} x2={sx0 + trW} y2={sy0 + sh - 4} stroke={shade(ISO.steel, 0.2)} strokeWidth={1.1} style={{ opacity: ok ? 0 : 1, transition: tr('opacity') }} />
            <g clipPath={`url(#h-scr-${id})`} style={{ opacity: ok ? 1 : 0, transition: tr('opacity') }}>
              <g className={live ? 'h-ecg' : undefined} style={{ ['--h-beat' as string]: `${-BEAT}px` } as CSSProperties}>
                <polyline points={pts(ecg)} fill="none" stroke={ISO.green} strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round" />
                <path d={pleth} fill="none" stroke={colors.info} strokeWidth={1.1} />
              </g>
            </g>
            {/* the readouts beside the traces: bars, no numbers */}
            <g style={{ opacity: ok ? 1 : 0.35, transition: tr('opacity') }}>
              <path d={`M${sx0 + trW + 4.4} ${sy0 + 3.6} c -1.4 -1.6 -3.6 -0.2 -2 1.6 l 2 2 l 2 -2 c 1.6 -1.8 -0.6 -3.2 -2 -1.6 z`} fill={ok ? ISO.green : shade(ISO.steel, 0.2)} className={live ? 'h-beat' : undefined} />
              <rect x={sx0 + trW + 2.4} y={sy0 + 8.6} width={7.5} height={3.6} rx={1} fill={ok ? ISO.green : shade(ISO.steel, 0.2)} />
              <rect x={sx0 + trW + 2.4} y={sy0 + sh - 8} width={7.5} height={3.6} rx={1} fill={ok ? colors.info : shade(ISO.steel, 0.2)} />
            </g>
            {/* the bezel: power light and two keys */}
            <circle cx={sx0 + 3} cy={fh - 4.2} r={1.5} fill={ISO.green} className="h-led" />
            <rect x={fw - 17} y={fh - 5.6} width={5} height={2.6} rx={1} fill={shade(ISO.steel, 0.05)} />
            <rect x={fw - 10} y={fh - 5.6} width={5} height={2.6} rx={1} fill={shade(ISO.steel, 0.05)} />
          </g>
        }
      />
      {/* the carry handle on top */}
      <path d={`M${S(mx - 0.3, my, MON.z + MON.h)[0]} ${S(mx - 0.3, my, MON.z + MON.h)[1]} L${S(mx - 0.26, my, MON.z + MON.h + 0.1)[0]} ${S(mx - 0.26, my, MON.z + MON.h + 0.1)[1]} L${S(mx + 0.26, my, MON.z + MON.h + 0.1)[0]} ${S(mx + 0.26, my, MON.z + MON.h + 0.1)[1]} L${S(mx + 0.3, my, MON.z + MON.h)[0]} ${S(mx + 0.3, my, MON.z + MON.h)[1]}`} fill="none" stroke={shade(ISO.steel, -0.05)} strokeWidth={2.2} strokeLinejoin="round" />
    </g>
  )
}

/* ------------------------------------------------------------------ the bed, the patient, the IV stand */

/* the bed, centred on the patient's pad, its long side along x (head toward the back left) */
const PC = g(...T14_P)
const BED = { x0: PC[0] - 0.97, x1: PC[0] + 0.97, y0: PC[1] - 0.47, y1: PC[1] + 0.47 }
const ZM = 0.46 /* mattress bottom */
const ZT = 0.66 /* mattress top */
const XM = BED.x0 + 0.86 /* where the raised back section hinges */
const XH = BED.x0 + 0.08
const ZH = 1.16 /* top of the raised back section */
const ZB = 0.76 /* blanket top */
const XB = XM - 0.08 /* blanket's top edge, at the waist */
const BLANKET = shade(colors.teal, 0.6)
const BLANKET_F = shade(colors.teal, 0.42)
const BLANKET_E = shade(colors.teal, 0.3)
const FRAME = shade(ISO.steel, 0.2)
const SHEET = colors.white

/* the patient: a Character Lab person in the Library look (clay), in a pale hospital gown */
const PATIENT: CharacterConfig = {
  ...PRESETS.kabir,
  name: 'Patient',
  hair: { style: 'short', color: PRESETS.kabir.hair.color },
  outfit: { ...PRESETS.kabir.outfit, top: 'tshirt', topColor: ISO.glass as `#${string}` },
}
const PS = 0.27 /* px per lab unit */
const LEAN = -21 /* degrees, the torso resting back on the raised section */
/* the hips sit on the mattress where the back section hinges */
const HIP = S(XM + 0.02, PC[1], ZT)

/** The resting pose: forearms folded over the lap, the head turned a little toward the doctor. */
const REST: Action = {
  name: 'patientRest',
  duration: 8,
  loop: true,
  blendIn: 0,
  blendOut: 0,
  tracks: {
    shoulderL: [[0, 12]],
    elbowL: [[0, 92]],
    wristL: [[0, 8]],
    shoulderR: [[0, 12]],
    elbowR: [[0, 92]],
    wristR: [[0, 8]],
    headTurn: [[0, -0.22]],
    headTilt: [[0, 8]],
    lookX: [[0, -0.5]],
    lookY: [[0, 0.1]],
  },
}

function Patient() {
  const held = useHeld()
  const id = useId().replace(/:/g, '')
  const skin = useMemo(() => buildSkin(PATIENT), [])
  /* the rig's own idle layer: breathing (4.2 s, inhale 40%) and blinks; no sway, no wandering eyes, no drifting life layer */
  const c = useCharacter({ id: 'h-patient', seed: 5, clock: held ? 'manual' : 'auto', idle: { breath: true, sway: false, blink: true, saccades: false, liveliness: 0.7 }, life: 0 })
  const { setExpression, play, seek } = c
  useEffect(() => {
    setExpression('neutral')
    play(REST, { variation: 0 })
    if (held) seek(2.1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [held])
  return (
    <g transform={`translate(${HIP[0]} ${HIP[1]}) rotate(${LEAN}) scale(${PS}) translate(-200 -360)`}>
      <defs>
        <clipPath id={`h-waist-${id}`}>
          <rect x={0} y={0} width={400} height={384} />
        </clipPath>
      </defs>
      <g clipPath={`url(#h-waist-${id})`}>
        <Character pose={c.pose} skin={skin} width={400} />
      </g>
    </g>
  )
}

/** The IV stand behind the bed's head: pole, hook, bag, drip chamber with a falling drop, and a pump with a light. */
const IV: GridPt = [BED.x0 - 0.42, BED.y0 - 0.18]
function IVStand() {
  const [x, y] = IV
  const top = S(x, y, 2.3)
  const base = S(x, y, 0.07)
  const bag = S(x, y, 2.18)
  return (
    <g>
      <Casters x={x} y={y} r={0.26} />
      <line x1={base[0]} y1={base[1]} x2={top[0]} y2={top[1]} stroke={shade(ISO.steel, -0.05)} strokeWidth={2.6} strokeLinecap="round" />
      {/* the hook arms */}
      <path d={`M${top[0] - 9} ${top[1] + 3} Q ${top[0]} ${top[1] - 2} ${top[0] + 9} ${top[1] + 3}`} fill="none" stroke={shade(ISO.steel, -0.05)} strokeWidth={1.8} strokeLinecap="round" />
      <path d={`M${top[0] - 9} ${top[1] + 3} q -1 3 1.5 3.5`} fill="none" stroke={shade(ISO.steel, -0.05)} strokeWidth={1.4} strokeLinecap="round" />
      {/* the bag hangs from the left hook */}
      <g transform={`translate(${bag[0] - 8} ${bag[1] + 4})`}>
        <path d="M -7 2 Q -8 0 -5 -0.5 L 5 -0.5 Q 8 0 7 2 L 7.5 15 Q 7.5 21 2 22 L -2 22 Q -7.5 21 -7.5 15 Z" fill={ISO.glass} stroke={shade(ISO.glass, -0.25)} strokeWidth={0.9} opacity={0.95} />
        <path d="M -6.4 9 L 6.4 9 L 6.6 15 Q 6.5 20.2 2 21 L -2 21 Q -6.5 20.2 -6.6 15 Z" fill={shade(ISO.glass, -0.08)} />
        <rect x={-4} y={2.5} width={8} height={4.5} rx={0.8} fill={colors.white} opacity={0.9} />
        <line x1={-4.8} y1={3} x2={-4.8} y2={18} stroke={colors.white} strokeWidth={1.2} opacity={0.7} strokeLinecap="round" />
        {/* the drip chamber and its drop */}
        <rect x={-1.6} y={22} width={3.2} height={8.5} rx={1.4} fill={shade(ISO.glass, 0.2)} stroke={shade(ISO.glass, -0.3)} strokeWidth={0.7} />
        <rect x={-1.4} y={27.5} width={2.8} height={2.6} rx={1} fill={shade(ISO.glass, -0.12)} />
        <ellipse cx={0} cy={23.8} rx={0.9} ry={1.1} fill={shade(ISO.glass, -0.35)} className="h-drop" />
      </g>
      {/* the infusion pump clamped to the pole */}
      <Box x={x - 0.16} y={y + 0.02} z={1.38} w={0.3} d={0.2} h={0.26} color={shade(ISO.steel, 0.5)} tone={{ left: shade(ISO.steel, 0.66), right: shade(ISO.steel, 0.3), top: shade(ISO.steel, 0.8), line: shade(ISO.steel, -0.1) }}
        onLeft={
          <g>
            <rect x={2} y={2} width={8} height={5.5} rx={1} fill={ISO.ink} />
            <rect x={3} y={4} width={5} height={1.6} rx={0.6} fill={ISO.green} opacity={0.85} />
            <circle cx={11.5} cy={4.5} r={1.2} fill={ISO.green} className="h-led h-led-p" />
          </g>
        }
      />
    </g>
  )
}

/** The tube from the drip chamber down to the patient's forearm (screen px, from the IV bag's chamber). */
function IVTube() {
  const bag = S(...IV, 2.18)
  const from: Px = [bag[0] - 8, bag[1] + 4 + 30.5]
  const to: Px = [HIP[0] - 22, HIP[1] - 16]
  return <path d={`M${from[0]} ${from[1]} C ${from[0] - 6} ${from[1] + 34}, ${to[0] - 30} ${to[1] + 6}, ${to[0]} ${to[1]}`} fill="none" stroke={shade(ISO.glass, -0.3)} strokeWidth={1.2} opacity={0.9} />
}

function Bed() {
  const { x0, x1, y0, y1 } = BED
  const W = y1 - y0
  const L = x1 - x0
  const legs: GridPt[] = [
    [x0 + 0.14, y0 + 0.12],
    [x1 - 0.14, y0 + 0.12],
    [x0 + 0.14, y1 - 0.12],
    [x1 - 0.14, y1 - 0.12],
  ]
  return (
    <g>
      {/* the soft shadow under the bed */}
      <polygon points={poly([S(x0 - 0.1, y0 - 0.05), S(x1 + 0.12, y0 - 0.05), S(x1 + 0.12, y1 + 0.16), S(x0 - 0.1, y1 + 0.16)])} fill={ISO.slate} opacity={0.12} />
      {/* casters and legs, the undercarriage */}
      {legs.map(([lx, ly], i) => {
        const w = S(lx, ly, 0.05)
        return (
          <g key={i}>
            <Box x={lx - 0.03} y={ly - 0.03} z={0.1} w={0.06} d={0.06} h={0.28} color={FRAME} stroke={false} />
            <ellipse cx={w[0]} cy={w[1]} rx={3.6} ry={3} fill={ISO.ink} />
            <ellipse cx={w[0] - 0.8} cy={w[1] - 0.8} rx={1.3} ry={1.1} fill={shade(ISO.ink, 0.35)} />
          </g>
        )
      })}
      <Box x={x0 + 0.3} y={y0 + 0.22} z={0.2} w={L - 0.6} d={W - 0.44} h={0.12} color={shade(ISO.slate, 0.25)} />
      {/* the headboard */}
      <Box x={x0 - 0.1} y={y0} z={0.32} w={0.1} d={W} h={1.06} color={shade(ISO.steel, 0.45)} tone={{ right: shade(ISO.steel, 0.55), left: shade(ISO.steel, 0.3), top: shade(ISO.steel, 0.7), line: shade(ISO.steel, -0.1) }} />
      {/* the frame and the mattress (foot section) */}
      <Box x={x0} y={y0} z={0.36} w={L} d={W} h={0.1} color={FRAME} />
      <Box x={XM} y={y0 + 0.02} z={ZM} w={x1 - XM - 0.02} d={W - 0.04} h={ZT - ZM} color={SHEET} tone={{ top: colors.white, left: shade(ISO.paper, -0.02), right: shade(ISO.paper, -0.08), line: shade(ISO.steel, 0.25) }} />
      {/* the raised back section: a wedge from the hinge up to the head */}
      <polygon points={poly([S(XH, y1 - 0.02, ZH), S(XM, y1 - 0.02, ZT), S(XM, y1 - 0.02, ZM), S(XH, y1 - 0.02, ZM)])} fill={shade(ISO.paper, -0.02)} stroke={shade(ISO.steel, 0.25)} strokeWidth={0.75} strokeLinejoin="round" />
      <polygon points={poly([S(XH, y0 + 0.02, ZH), S(XM, y0 + 0.02, ZT), S(XM, y1 - 0.02, ZT), S(XH, y1 - 0.02, ZH)])} fill={colors.white} stroke={shade(ISO.steel, 0.25)} strokeWidth={0.75} strokeLinejoin="round" />
      {/* the pillow against the raised section */}
      {(() => {
        const c = S(XH + 0.16, PC[1], ZH + 0.02)
        return (
          <g>
            <path d={`M${c[0] - 26} ${c[1] + 2} Q ${c[0] - 27} ${c[1] - 14} ${c[0] - 8} ${c[1] - 16} L ${c[0] + 14} ${c[1] - 12} Q ${c[0] + 30} ${c[1] - 8} ${c[0] + 26} ${c[1] + 8} Q ${c[0] + 22} ${c[1] + 18} ${c[0] + 4} ${c[1] + 16} L ${c[0] - 16} ${c[1] + 13} Q ${c[0] - 26} ${c[1] + 12} ${c[0] - 26} ${c[1] + 2} Z`} fill={colors.white} stroke={shade(ISO.steel, 0.3)} strokeWidth={0.9} />
            <path d={`M${c[0] - 18} ${c[1] + 8} Q ${c[0]} ${c[1] + 12} ${c[0] + 18} ${c[1] + 6}`} fill="none" stroke={shade(ISO.paper, -0.12)} strokeWidth={1.4} strokeLinecap="round" />
          </g>
        )
      })()}
    </g>
  )
}

/** The blanket over the legs, the turned-down sheet at the waist, the side rail and the footboard: all in front of the patient. */
function BedFront() {
  const { x1, y0, y1 } = BED
  const W = y1 - y0
  const ya = y0 - 0.02
  const yb = y1 + 0.06
  const xe = x1 - 0.02
  /* the drape's lower edge, a soft wave */
  const n = 6
  const hem = Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n
    return S(xe - t * (xe - XB), yb, 0.43 + (i % 2 ? 0.035 : 0))
  })
  const hemD = hem.map(([a, b], i) => (i === 0 ? `L${a} ${b}` : `Q ${(hem[i - 1][0] + a) / 2} ${(hem[i - 1][1] + b) / 2 + (i % 2 ? 3 : -2)} ${a} ${b}`)).join(' ')
  const tl = S(XB, ya, ZB)
  const tr = S(xe, ya, ZB)
  const br = S(xe, yb, ZB)
  const bl = S(XB, yb, ZB)
  /* the legs under the blanket: two soft ridges and the feet */
  const ridge = (yy: number) => {
    const a = S(XB + 0.35, yy, ZB + 0.02)
    const b = S(xe - 0.22, yy, ZB + 0.04)
    return <path d={`M${a[0]} ${a[1]} Q ${(a[0] + b[0]) / 2} ${(a[1] + b[1]) / 2 - 5} ${b[0]} ${b[1]}`} fill="none" stroke={shade(BLANKET, 0.4)} strokeWidth={3.2} strokeLinecap="round" opacity={0.8} />
  }
  const foot = (yy: number) => {
    const f = S(xe - 0.2, yy, ZB + 0.08)
    return <ellipse cx={f[0]} cy={f[1]} rx={7} ry={5.5} fill={shade(BLANKET, 0.15)} stroke={shade(BLANKET, -0.1)} strokeWidth={0.6} />
  }
  const band = [S(XB, ya, ZB + 0.01), S(XB + 0.2, ya, ZB + 0.01), S(XB + 0.2, yb, ZB + 0.01), S(XB, yb, ZB + 0.01)] as Px[]
  const bandF = [S(XB, yb, ZB + 0.01), S(XB + 0.2, yb, ZB + 0.01), S(XB + 0.2, yb, ZB - 0.07), S(XB, yb, ZB - 0.07)] as Px[]
  /* the side rail along the head section, in front of the patient's hips */
  const r0 = XH + 0.1
  const r1 = XM + 0.1
  const ry = y1 + 0.1
  const rail = (z: number) => {
    const a = S(r0, ry, z)
    const b = S(r1, ry, z)
    return <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={FRAME} strokeWidth={2.4} strokeLinecap="round" />
  }
  const post = (x: number) => {
    const a = S(x, ry, 0.46)
    const b = S(x, ry, 0.98)
    return <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={FRAME} strokeWidth={2.4} strokeLinecap="round" />
  }
  return (
    <g>
      {/* the foot-end drape */}
      <polygon points={poly([tr, br, S(xe, yb, 0.44), S(xe, ya, 0.44)])} fill={BLANKET_E} />
      {/* the front drape, its hem waving */}
      <path d={`M${bl[0]} ${bl[1]} L${br[0]} ${br[1]} ${hemD} Z`} fill={BLANKET_F} stroke={BLANKET_F} strokeWidth={1} strokeLinejoin="round" />
      {/* the top, over the legs */}
      <polygon points={poly([tl, tr, br, bl])} fill={BLANKET} stroke={BLANKET} strokeWidth={1.5} strokeLinejoin="round" />
      {ridge(PC[1] - 0.16)}
      {ridge(PC[1] + 0.16)}
      {foot(PC[1] - 0.16)}
      {foot(PC[1] + 0.16)}
      {/* the turned-down sheet at the waist */}
      <polygon points={poly(band)} fill={SHEET} stroke={shade(ISO.steel, 0.35)} strokeWidth={0.7} strokeLinejoin="round" />
      <polygon points={poly(bandF)} fill={shade(ISO.paper, -0.04)} stroke={shade(ISO.steel, 0.35)} strokeWidth={0.7} strokeLinejoin="round" />
      {rail(0.96)}
      {rail(0.74)}
      {post(r0)}
      {post(r1)}
      {/* the footboard, with the patient's chart hanging on it */}
      <Box
        x={x1}
        y={y0}
        z={0.32}
        w={0.1}
        d={W}
        h={0.66}
        color={shade(ISO.steel, 0.45)}
        tone={{ right: shade(ISO.steel, 0.4), left: shade(ISO.steel, 0.25), top: shade(ISO.steel, 0.7), line: shade(ISO.steel, -0.1) }}
        onRight={
          <g>
            <rect x={W * UU * 0.3} y={5} width={W * UU * 0.4} height={0.38 * UU} rx={1.5} fill={colors.white} stroke={shade(ISO.steel, 0.05)} strokeWidth={0.8} />
            <rect x={W * UU * 0.45} y={3.4} width={W * UU * 0.1} height={3} rx={1} fill={ISO.slate} />
            {[0, 1, 2, 3].map((i) => (
              <line key={i} x1={W * UU * 0.34} y1={9.5 + i * 3} x2={W * UU * (i === 3 ? 0.55 : 0.66)} y2={9.5 + i * 3} stroke={shade(ISO.steel, 0.05)} strokeWidth={0.9} />
            ))}
          </g>
        }
      />
    </g>
  )
}

/* ------------------------------------------------------------------ the figure */

function T14Everyday({ step }: { step: number }) {
  const { dot, lit } = useChecks(step)
  const line = T14_LINE.map(([a, b]) => g(a, b))
  const D = g(...T14_D)
  /* the breathing ring sits on the patient's chest */
  const chest: Px = [HIP[0] - 14, HIP[1] - 30]
  return (
    <IsoScene w={SW} h={SH} ox={OX} oy={OY} u={UU}>
      <IsoSvg>
        <Room />
        <Pad c={D} n={T14_PAD} fill={shade(ISO.steel, 0.72)} stroke={shade(ISO.steel, 0.15)} />
        <Pad c={PC} n={T14_PAD} fill={shade(ISO.green, 0.82)} stroke={shade(ISO.green, 0.2)} />
        <Route points={line} z={0} color={colors.brand} op={step >= 2 ? 1 : 0} />
        <Dot points={line} z={0.12} t={dot} color={colors.brand} on={step >= 2} />
        <Monitor ok={step >= 3} />
        <IVStand />
        <Bed />
        <Patient />
        <BedFront />
        <IVTube />
        <Ring x={chest[0]} y={chest[1]} r={44} on={step >= 1} />
        <Doctor x={D[0]} y={D[1]} h={150} />
        <TickRow x={T14_TICKS[0] - OX} y={T14_TICKS[1] - OY} n={4} lit={lit} on={step >= 3} />
      </IsoSvg>
      <Tag x={T14_D[0]} y={114}>
        A Doctor
      </Tag>
      <Tag x={T14_P[0]} y={118}>
        A Patient
      </Tag>
      <Tag x={330} y={345} on={step >= 1} tone="good">
        Just Because They Are Breathing
      </Tag>
      <Tag x={234} y={250} on={step >= 2} tone="brand">
        Short, Repeated Vitals Check
      </Tag>
      <Tag x={366} y={30} on={step >= 3} tone="good">
        Actually Functioning
      </Tag>
    </IsoScene>
  )
}

/* ------------------------------------------------------------------ exports */

export const figures = {
  F_T14Everyday: T14Everyday,
}

export const slides = {}

export const css = `
@keyframes h-ring { 0% { transform: scale(0.8); opacity: 0.75 } 100% { transform: scale(1.35); opacity: 0 } }
.h-ring { animation: h-ring 2s linear infinite; transform-box: fill-box; transform-origin: 50% 50%; }
.h-ring2 { animation-delay: -1s }
@keyframes h-ecg { from { transform: translateX(0) } to { transform: translateX(var(--h-beat)) } }
.h-ecg { animation: h-ecg 0.92s linear infinite; }
@keyframes h-beat { 0%, 100% { opacity: 1 } 12% { opacity: 1 } 40% { opacity: 0.35 } 80% { opacity: 0.9 } }
.h-beat { animation: h-beat 0.92s ease-in-out infinite; }
@keyframes h-led { 0%, 100% { opacity: 1 } 50% { opacity: 0.35 } }
.h-led { animation: h-led 2.6s ease-in-out infinite; }
.h-led-p { animation-duration: 1.8s; animation-delay: -0.7s }
.h-led-b { animation-duration: 3.4s; animation-delay: -1.3s }
@keyframes h-drop { 0% { transform: translateY(0); opacity: 0 } 18% { opacity: 1 } 62% { transform: translateY(0); opacity: 1; animation-timing-function: cubic-bezier(0.55,0,1,0.45) } 84% { transform: translateY(3.6px); opacity: 1 } 90%, 100% { transform: translateY(3.6px); opacity: 0 } }
.h-drop { animation: h-drop 2.2s linear infinite; transform-box: fill-box; }
.cc-still .h-ring, .deck-thumb .h-ring { animation: none !important; opacity: 0 }
.cc-still .h-ecg, .deck-thumb .h-ecg, .cc-still .h-beat, .deck-thumb .h-beat, .cc-still .h-led, .deck-thumb .h-led, .cc-still .h-drop, .deck-thumb .h-drop { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .h-ring, .h-ecg, .h-beat, .h-led, .h-drop { animation: none !important; } }
`
