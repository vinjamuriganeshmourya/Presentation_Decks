import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { MOTION, motionHeld } from '@/motion/tokens'
import { TILE_SKIN } from '@/decks/figures/card'
import { litRing } from '@/decks/figures/net/frames'
import { Ico3D, Tile3D, type Ico3DName, type Badge } from './icons3d'
import cloudtrailMark from '../images/aws-cloudtrail.svg'

/*
 * CORRECTION ROUND 2026-11-16 · slides 37 (C_T19), 39 (C_T20), 43 (C_T23), 45 (C_T24), rebuilt from c.tsx / d.tsx.
 * index.tsx merges this file last, so these figures replace the earlier ones. Same props, same steps, same words.
 *
 * What changed: 3D-style icons (./icons3d) for every lucide glyph, official AWS marks kept on white tiles (rule 54);
 * every connector is ORTHOGONAL (90-degree elbows with soft corners), starting on its source edge with its tip on the
 * target edge, computed from the same constants as the boxes; equal padding inside each stage (>= 20 design px);
 * quiet loops on the icons and flow dots on the wires. Loops are CSS animations of transform / opacity on HTML
 * elements or root <svg>s only (low-end PCs); all held on ?still, thumbnails and reduced motion. Prefix `x13-`.
 *
 * Stage sizes (design px; the slide is drawn 1110 wide and shown x1.5 at 1920): points layout = 1110 - pointsW - 24
 * wide by figH: 37 = 496 x 330, 39 and 45 = 634 x 330. 43 is a lead figure, 1100 x 300 (w, h arrive in props).
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const EASE = MOTION.ease
const useHeld = () => motionHeld(useInstant())
const FONT = "'DM Sans', system-ui, sans-serif"
const ORANGE = colors.accent
const TILE_BG = 'linear-gradient(180deg, #FFFFFF 0%, #EEF3FF 100%)'
const TILE_RIM = 'inset 0 0 0 1.5px #D3DEF6, 0 10px 20px -12px rgba(31,64,140,0.5)'

/* ------------------------------------------------------------------ loop vocabulary */

const lc = (kind: string) => `x13 x13-${kind}`
const lv = (d = 0, t?: number): CSSProperties => ({ ['--x13-d' as string]: `${-d}s`, ...(t ? { ['--x13-t' as string]: `${t}s` } : {}) }) as CSSProperties

function useCycle(n: number, done: boolean, periodMs = 1500) {
  const held = useHeld()
  const [i, setI] = useState(0)
  useEffect(() => {
    setI(0)
    if (!done || held || n < 1) return
    const id = window.setInterval(() => setI((v) => (v + 1) % n), periodMs)
    return () => window.clearInterval(id)
  }, [n, done, held, periodMs])
  return done && !held ? i : -1
}

/** the lit item: the current press while building, then the walking cycle; -1 on held frames */
function useHot(n: number, step: number, periodMs?: number) {
  const held = useHeld()
  const cyc = useCycle(n, step >= n, periodMs)
  if (held) return -1
  return cyc >= 0 ? cyc : step - 1
}

/* ------------------------------------------------------------------ moving tokens, as CSS keyframes */

const KF: string[] = []
const pct = (v: number) => `${Math.max(0, Math.min(100, v)).toFixed(2)}%`
type Pt = [number, number]
/** a token riding the polyline `pts` during [t0, t1] of a `period`-second loop (timed by segment length) */
function ride(name: string, pts: Pt[], t0: number, t1: number, period: number) {
  const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]))
  const total = lens.reduce((a, b) => a + b, 0)
  const at = (k: number) => ((t0 + ((t1 - t0) * lens.slice(0, k).reduce((a, b) => a + b, 0)) / total) / period) * 100
  const tr = (p: Pt) => `translate(${p[0]}px, ${p[1]}px)`
  const lines = [`0%, ${pct((t0 / period) * 100)} { transform: ${tr(pts[0])} scale(0.6); opacity: 0 }`]
  lines.push(`${pct((t0 / period) * 100 + 2)} { opacity: 1 }`)
  pts.forEach((p, k) => k > 0 && lines.push(`${pct(at(k))} { transform: ${tr(p)} scale(1)${k === pts.length - 1 ? '; opacity: 1' : ''} }`))
  lines.push(`${pct((t1 / period) * 100 + 3)} { transform: ${tr(pts[pts.length - 1])} scale(0.7); opacity: 0 }`)
  lines.push(`100% { transform: ${tr(pts[pts.length - 1])} scale(0.7); opacity: 0 }`)
  KF.push(`@keyframes x13-${name} { ${lines.join(' ')} }\n.x13-${name} { animation: x13-${name} ${period}s ease-in-out infinite; }`)
  return `x13-${name}`
}

/** a dot carried by a `ride` class (placed from the frame's 0,0); nothing on held frames */
function Token({ cls, tone = colors.brand, size = 10, on = true }: { cls: string; tone?: string; size?: number; on?: boolean }) {
  const held = useHeld()
  if (held || !on) return null
  return (
    <span aria-hidden style={{ position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, zIndex: 5, pointerEvents: 'none' }}>
      <span className={cls} style={{ display: 'block', width: size, height: size, borderRadius: 99, background: tone, boxShadow: `0 0 0 4px ${tone}2e, 0 4px 10px -4px ${tone}`, opacity: 0 }} />
    </span>
  )
}

/* ------------------------------------------------------------------ type and pieces */

const heading = (size: number, color: string = colors.ink): CSSProperties => ({ fontFamily: FONT, fontWeight: 700, fontSize: size, lineHeight: 1.2, color })
const body = (size: number, color: string = colors.ink): CSSProperties => ({ fontFamily: FONT, fontWeight: 500, fontSize: size, lineHeight: 1.36, color })
const tag = (size = 14, color: string = colors.brandDeep): CSSProperties => ({ fontFamily: FONT, fontWeight: 600, fontSize: size, lineHeight: 1.15, color, whiteSpace: 'nowrap', textAlign: 'center' })

function Show({ on, children, style, delay = 0, lift = 6 }: { on: boolean; children: ReactNode; style?: CSSProperties; delay?: number; lift?: number }) {
  const instant = useInstant()
  return (
    <div
      style={{
        opacity: on ? 1 : 0,
        transform: on ? 'none' : `translateY(${lift}px)`,
        transition: instant ? 'none' : `opacity 520ms ${EASE} ${on ? delay : 0}ms, transform 520ms ${EASE} ${on ? delay : 0}ms`,
        pointerEvents: on ? undefined : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

const Frame = ({ w, h, children }: { w: number; h: number; children: ReactNode }) => (
  <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
    <div style={{ position: 'relative', width: w, height: h }}>{children}</div>
  </div>
)

/** a plinth tile holding any icon node */
const Plinth = ({ size = 56, children, warm = false }: { size?: number; children: ReactNode; warm?: boolean }) => (
  <span data-x13="tile" style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: Math.round(size * 0.28), background: warm ? 'linear-gradient(180deg, #FFFFFF 0%, #FFF1E6 100%)' : TILE_BG, boxShadow: warm ? 'inset 0 0 0 1.5px #FFD2B0, 0 10px 20px -12px rgba(31,64,140,0.5)' : TILE_RIM, flexShrink: 0 }}>{children}</span>
)

/** an official mark on its white tile (rule 54); the mark never moves, a soft halo breathes behind it */
function MarkTile({ src, size = 56, scale = 0.68 }: { src: string; size?: number; scale?: number }) {
  const r = Math.round(size * 0.28)
  return (
    <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: size, height: size, flexShrink: 0 }}>
      <span aria-hidden className={lc('halo')} style={{ position: 'absolute', inset: -5, borderRadius: r + 5, background: `radial-gradient(closest-side, ${colors.brand}30, ${colors.brand}00)`, ...lv(0, 3.6) }} />
      <span style={{ position: 'absolute', inset: 0, borderRadius: r, background: TILE_BG, boxShadow: TILE_RIM, display: 'grid', placeItems: 'center' }}>
        <img src={src} alt="" aria-hidden draggable={false} style={{ width: Math.round(size * scale), height: Math.round(size * scale), objectFit: 'contain', display: 'block' }} />
      </span>
    </span>
  )
}

/** a white card that rings while it is the part being explained */
function Panel({ x, y, w, h, lit = false, on = true, radius = 18, children, delay = 0, tint, edge }: { x: number; y: number; w: number; h: number; lit?: boolean; on?: boolean; radius?: number; children?: ReactNode; delay?: number; tint?: string; edge?: string }) {
  const instant = useInstant()
  const base = edge ? `inset 0 0 0 2px ${edge}, 0 12px 24px -16px rgba(31,64,140,0.34)` : (TILE_SKIN.boxShadow as string)
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x, top: y, width: w, height: h, zIndex: 2 }}>
      <div data-x13="card" style={{ position: 'absolute', inset: 0, borderRadius: radius, ...TILE_SKIN, ...(tint ? { background: tint } : {}), boxShadow: litRing(lit, base), transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }} />
      <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
    </Show>
  )
}

/** a rounded-corner orthogonal path through `pts` (every segment horizontal or vertical) */
function elbowD(pts: Pt[], r = 10) {
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = pts[i]
    if (i < pts.length - 1) {
      const [px, py] = pts[i - 1]
      const [nx, ny] = pts[i + 1]
      const l1 = Math.hypot(x - px, y - py)
      const l2 = Math.hypot(nx - x, ny - y)
      const k = Math.min(r, l1 / 2, l2 / 2)
      d += ` L ${x - ((x - px) / l1) * k} ${y - ((y - py) / l1) * k} Q ${x} ${y} ${x + ((nx - x) / l2) * k} ${y + ((ny - y) / l2) * k}`
    } else d += ` L ${x} ${y}`
  }
  return d
}
const plen = (pts: Pt[]) => pts.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0)

/**
 * AN ORTHOGONAL WIRE through `pts`: draws itself when shown; with `head`, a filled arrowhead whose tip is exactly the
 * last point (the line stops at the head's base). The last segment's direction orients the head.
 */
function Wire({ pts, on = true, color = colors.brand, lit = false, width = 2.6, head = 10, delay = 0 }: { pts: Pt[]; on?: boolean; color?: string; lit?: boolean; width?: number; head?: number; delay?: number }) {
  const instant = useInstant()
  const c = lit ? ORANGE : color
  const n = pts.length
  const [tx, ty] = pts[n - 1]
  const [sx, sy] = pts[n - 2]
  const L = Math.hypot(tx - sx, ty - sy)
  const ux = (tx - sx) / L
  const uy = (ty - sy) / L
  const line: Pt[] = head ? [...pts.slice(0, -1), [tx - ux * head * 0.9, ty - uy * head * 0.9]] : pts
  const len = plen(line) + 2
  const tip = `${tx},${ty} ${tx - ux * head - uy * head * 0.58},${ty - uy * head + ux * head * 0.58} ${tx - ux * head + uy * head * 0.58},${ty - uy * head - ux * head * 0.58}`
  return (
    <svg aria-hidden style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', zIndex: 1 }} width={1} height={1}>
      <path d={elbowD(line)} fill="none" stroke={c} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={on ? 0 : len} style={{ transition: instant ? 'none' : `stroke-dashoffset 820ms ${EASE} ${on ? delay : 0}ms, stroke 420ms ${EASE}` }} />
      {head > 0 && <polygon points={tip} fill={c} style={{ opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 300ms ${EASE} ${on ? delay + 640 : 0}ms, fill 420ms ${EASE}` }} />}
    </svg>
  )
}

/** a junction dot where wires merge */
function Junction({ x, y, on, lit = false }: { x: number; y: number; on: boolean; lit?: boolean }) {
  const instant = useInstant()
  return <span aria-hidden style={{ position: 'absolute', left: x - 5, top: y - 5, width: 10, height: 10, borderRadius: 99, background: lit ? ORANGE : colors.brand, boxShadow: '0 0 0 3px #FFFFFF', opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE} 500ms, background 420ms ${EASE}`, zIndex: 2 }} />
}

/** a 3D icon with a second one laid over its lower-right corner (a composite mark, e.g. a Sid tag that denies) */
function Pair({ main, over, size = 52, k = 0.5, loop = 'bob', d = 0, overLoop = 'pulse' }: { main: Ico3DName; over: Ico3DName; size?: number; k?: number; loop?: 'bob' | 'float' | 'pulse' | 'glint' | 'tilt'; d?: number; overLoop?: 'pulse' | 'beat' | 'bob' | 'glint' }) {
  const o = Math.round(size * k)
  return (
    <span style={{ position: 'relative', display: 'inline-grid', placeItems: 'center', width: size, height: size, flexShrink: 0 }}>
      <Ico3D name={main} size={size} loop={loop} d={d} />
      <span style={{ position: 'absolute', right: -Math.round(o * 0.22), bottom: -Math.round(o * 0.18), borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6)', display: 'grid', placeItems: 'center', width: o + 4, height: o + 4 }}>
        <Ico3D name={over} size={o} loop={overLoop} d={d + 0.4} t={2.4} />
      </span>
    </span>
  )
}
void Tile3D

/* ================================================================== 37 · C_T19 · union with deny override */

/*
 * Three circles in one 496 x 330 stage: two identity-based policies on one user (their UNION is what the user may do),
 * the resource-based policy on the bucket, and the overlap cross-account access needs. The explicit deny is an orange
 * slice cut through the identity union, its 3D stop sign right above it: whatever it covers is not allowed although
 * both allows cover it. Steps (unchanged): 1 the identity union, 2 the cross-account overlap, 3 everything.
 */
const G = { W: 496, H: 330, R: 90, CY: 177, I1: 141, I2: 217, RX: 355 }
const G_BAND = `${G.I1 + 31},${G.CY - G.R} ${G.I1 + 59},${G.CY - G.R} ${G.I1 + 47},${G.CY + G.R} ${G.I1 + 19},${G.CY + G.R}`

const C_T19: Fig = (p) => {
  const step = Number(p.step ?? 0)
  const held = useHeld()
  const instant = useInstant()
  const hot = useHot(3, step, 2200)
  const st = held ? 3 : hot >= 0 ? hot + 1 : step
  const a1 = st === 1 || st === 3 ? 1 : st === 2 ? 0.3 : 0
  const a2 = st === 3 ? 1 : st === 2 ? 0.3 : 0
  const a3 = st === 2 ? 1 : 0
  const tr = instant ? 'none' : `opacity 520ms ${EASE}`
  const { W, H, R, CY, I1, I2, RX } = G
  const shown = held || step >= 1
  const at = (x: number, y: number, s: number): CSSProperties => ({ position: 'absolute', left: x - s / 2, top: y - s / 2, zIndex: 3 })
  return (
    <Frame w={W} h={H}>
      <svg aria-hidden width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          <clipPath id="x13-g-r">
            <circle cx={RX} cy={CY} r={R} />
          </clipPath>
          <clipPath id="x13-g-u">
            <circle cx={I1} cy={CY} r={R} />
            <circle cx={I2} cy={CY} r={R} />
          </clipPath>
          <radialGradient id="x13-g-fi" cx="0.4" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#E3EBFF" />
            <stop offset="1" stopColor="#B9CCFF" />
          </radialGradient>
          <radialGradient id="x13-g-fr" cx="0.4" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#E7F8EE" />
            <stop offset="1" stopColor="#BFE9D2" />
          </radialGradient>
          <linearGradient id="x13-g-band" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#FFB37A" />
            <stop offset="0.5" stopColor={ORANGE} />
            <stop offset="1" stopColor="#E8642A" />
          </linearGradient>
        </defs>
        <circle cx={RX} cy={CY} r={R} fill="url(#x13-g-fr)" style={{ opacity: a2, transition: tr }} />
      </svg>
      {/* the identity union, its own svg so its breathing is composited */}
      <div style={{ position: 'absolute', inset: 0, opacity: a1, transition: tr }}>
        <svg aria-hidden width={W} height={H} viewBox={`0 0 ${W} ${H}`} className={lc('union')} style={{ position: 'absolute', inset: 0, overflow: 'visible', ...lv(0, 3.2) }}>
          <rect x={0} y={0} width={W} height={H} fill="url(#x13-g-fi)" clipPath="url(#x13-g-u)" />
        </svg>
      </div>
      <svg aria-hidden width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <g clipPath="url(#x13-g-r)" style={{ opacity: a3, transition: tr }}>
          <circle cx={I1} cy={CY} r={R} fill="#86A6F7" />
          <circle cx={I2} cy={CY} r={R} fill="#86A6F7" />
        </g>
        <circle cx={I1} cy={CY} r={R} fill="none" stroke={colors.brand} strokeWidth={2.4} />
        <circle cx={I2} cy={CY} r={R} fill="none" stroke={colors.brand} strokeWidth={2.4} />
        <circle cx={RX} cy={CY} r={R} fill="none" stroke={st >= 2 ? '#1F9D63' : '#8792A8'} strokeWidth={2.4} strokeDasharray={st >= 2 ? undefined : '6 6'} style={{ transition: instant ? 'none' : `stroke 420ms ${EASE}` }} />
      </svg>
      {/* the deny slice over the union: it wins wherever it lies */}
      <div style={{ position: 'absolute', inset: 0, opacity: shown ? 1 : 0, transition: tr, zIndex: 2 }}>
        <svg aria-hidden width={W} height={H} viewBox={`0 0 ${W} ${H}`} className={lc('glow')} style={{ position: 'absolute', inset: 0, overflow: 'visible', ...lv(0, 2.6) }}>
          <polygon points={G_BAND} fill="url(#x13-g-band)" clipPath="url(#x13-g-u)" opacity={0.92} />
        </svg>
      </div>

      {/* the deny: its stop sign right above the slice, the slide's own word beside it */}
      <div style={{ position: 'absolute', left: I1 + 45 - 20, top: 34, zIndex: 3, display: 'flex', alignItems: 'center', gap: 8, opacity: shown ? 1 : 0, transition: tr }}>
        <Ico3D name="cross" size={40} loop="beat" t={2.6} />
        <span style={tag(15, colors.brandDeep)}>Deny</span>
      </div>

      {/* identity side: the user and two identity-based policies that add together */}
      <div style={at(I1 - 46, CY - 30, 48)}><Ico3D name="user" size={48} loop="bob" /></div>
      <div style={at(I1 - 42, CY + 40, 40)}><Ico3D name="policy" size={40} loop="float" d={0.6} /></div>
      <div style={at(I2 + 32, CY - 46, 38)}><Ico3D name="policy" size={38} loop="float" d={1.3} /></div>
      <div style={at(I2 + 32, CY + 46, 34)}><Ico3D name="plus" size={34} loop="pulse" d={0.3} t={2.4} /></div>
      {/* the overlap: both sides agree (cross-account) */}
      <div style={{ ...at((I2 + R + RX - R) / 2, CY, 32), opacity: a3, transition: tr }}><Ico3D name="link" size={32} loop="tilt" t={2.8} /></div>
      {/* resource side: the bucket and its resource-based policy */}
      <div style={at(RX + 20, CY - 32, 54)}><Ico3D name="bucket" size={54} loop="bob" d={0.9} /></div>
      <div style={at(RX + 20, CY + 38, 40)}><Ico3D name="policy" size={40} loop="float" d={1.8} /></div>

      <div style={{ position: 'absolute', left: (I1 + I2) / 2 - 60, top: CY + R + 10, width: 120, ...tag(15) }}>Identity</div>
      <div style={{ position: 'absolute', left: RX - 60, top: CY + R + 10, width: 120, ...tag(15) }}>Resource</div>
    </Frame>
  )
}

/* ================================================================== 39 · C_T20 · three pieces of evidence */

/* 634 x 330: three evidence cards on the left, wires merging at one junction, one arrow into Root Cause */
const E = { W: 634, H: 330, PAD: 20, BW: 280, BH: 82, CX: 544, CY: 165, R: 70, BUS: 404 }
const E_BY = [E.PAD, (E.H - E.BH) / 2, E.H - E.PAD - E.BH]
const E_YC = E_BY.map((y) => y + E.BH / 2)
const E_X1 = E.PAD + E.BW
const E_TIP = E.CX - E.R
const E_IN: Pt[][] = [
  [[E_X1, E_YC[0]], [E.BUS, E_YC[0]], [E.BUS, E.CY]],
  [[E_X1, E_YC[1]], [E.BUS, E.CY]],
  [[E_X1, E_YC[2]], [E.BUS, E_YC[2]], [E.BUS, E.CY]],
]
const E_PERIOD = 3.6
const E_RIDE = E_IN.map((pts, i) => ride(`e-${i}`, [...pts, [E_TIP - 8, E.CY]], 0.15 + i * 0.4, 1.9 + i * 0.4, E_PERIOD))

const C_T20: Fig = ({ step = 0 }) => {
  const s = step as number
  const hot = useHot(3, s)
  const held = useHeld()
  const items: [string, ReactNode][] = [
    ['Error Message', <Plinth key="a"><Ico3D name="alert" size={44} loop="beat" t={2.8} /></Plinth>],
    ['Audit Log', <MarkTile key="b" src={cloudtrailMark} size={56} />],
    ['Policy Statement', <Plinth key="c"><Ico3D name="policy" size={44} loop="float" d={0.9} /></Plinth>],
  ]
  return (
    <Frame w={E.W} h={E.H}>
      {items.map(([title, icon], i) => (
        <div key={title}>
          <Panel x={E.PAD} y={E_BY[i]} w={E.BW} h={E.BH} on={s >= i + 1} lit={hot === i}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 16, padding: '0 18px' }}>
              {icon}
              <span style={{ ...heading(18), whiteSpace: 'nowrap' }}>{title}</span>
            </div>
          </Panel>
          <Wire pts={E_IN[i]} on={s >= i + 1} lit={hot === i} head={0} delay={200} />
          <Token cls={E_RIDE[i]} on={s >= 3} size={10} />
        </div>
      ))}
      <Junction x={E.BUS} y={E.CY} on={s >= 1} lit={hot >= 0} />
      <Wire pts={[[E.BUS, E.CY], [E_TIP, E.CY]]} on={s >= 1} head={11} lit={hot >= 0} delay={600} />
      <Show on={s >= 1} style={{ position: 'absolute', left: E.CX - E.R, top: E.CY - E.R, width: E.R * 2, height: E.R * 2, zIndex: 2 }}>
        {!held && <span aria-hidden className={lc('ripple')} style={{ position: 'absolute', inset: -8, borderRadius: 999, border: `2px solid ${colors.brand}55`, ...lv(0, 2.8) }} />}
        <div style={{ position: 'absolute', inset: 0, borderRadius: 999, background: 'radial-gradient(circle at 40% 32%, #FFFFFF 0%, #EAF1FF 70%, #D7E3FF 100%)', boxShadow: 'inset 0 0 0 2px #C9D7F6, 0 16px 30px -16px rgba(31,64,140,0.55)', display: 'grid', placeItems: 'center' }}>
          <Ico3D name="search" size={92} loop="glint" t={3.4} />
        </div>
      </Show>
      <Show on={s >= 1} style={{ position: 'absolute', left: E.CX - 70, top: E.CY + E.R + 12, width: 140 }}>
        <div style={tag(17, colors.brandDark)}>Root Cause</div>
      </Show>
    </Frame>
  )
}

/* ================================================================== 43 · C_T23 · from the error to the one rule */

type Card23 = [string, string, string[]]
/*
 * Four cards, PAD on all four sides of the 1100 x 300 stage. Widths (user 2026-11-16): the CloudTrail card narrowed to
 * what its two-line title needs, the Sid card widened so its title sits BESIDE its icon (icon left, text right, as the
 * Policy Document card). Arrows run from one card's right edge to the next card's left edge, tip on the edge.
 */
const D_PAD = 20
/* Session 13 review (T23): the CloudTrail card carries a bullet now, so it is wider and the gaps narrower */
const D_WIDTHS = [222, 166, 306, 316]
const D_AY = 20 + 28
function dLayout(w: number) {
  const W = Math.min(w, 1110) - D_PAD * 2
  const GAP = (W - D_WIDTHS.reduce((a, b) => a + b, 0)) / (D_WIDTHS.length - 1)
  const xs: number[] = []
  let acc = 0
  for (const cw of D_WIDTHS) {
    xs.push(acc)
    acc += cw + GAP
  }
  return { W, xs }
}
const D_X = dLayout(1100).xs
const D_RIDE = [0, 1, 2].map((i) => ride(`d-${i}`, [[D_X[i] + D_WIDTHS[i] + 2, D_AY], [D_X[i + 1] - 12, D_AY]], 0.1 + i * 0.4, 1.0 + i * 0.4, 2.4))

const C_T23: Fig = ({ step = 0, cards = [], w = 1100, h = 300 }) => {
  const s = step as number
  const cs = cards as Card23[]
  const hot = useHot(cs.length, s)
  const held = useHeld()
  const { W, xs } = dLayout(w as number)
  const H = (h as number) - D_PAD * 2
  const iconFor = (icon: string, i: number, sid: boolean, empty: boolean, stack = false) => {
    if (icon.startsWith('img:')) return <MarkTile src={icon.slice(4).replace(/^images\//, '../images/')} size={empty ? 72 : stack ? 48 : 56} />
    if (sid) return <Plinth warm size={52}><Pair main="tag" over="cross" size={36} k={0.6} loop="tilt" d={0.4} overLoop="beat" /></Plinth>
    return <Plinth size={52}><Ico3D name={icon === 'MessageSquareWarning' ? 'alert' : 'doc'} size={40} loop="beat" d={i * 0.6} t={2.8} /></Plinth>
  }
  return (
    <Frame w={W} h={H}>
      {cs.map(([title, icon, bullets], i) => {
        const sid = i === cs.length - 1
        const empty = bullets.length === 0
        /* a narrow card keeps its icon above its title, and its bullets come under both, a size smaller */
        const stack = empty || D_WIDTHS[i] < 200
        return (
          <div key={title}>
            <Panel x={xs[i]} y={0} w={D_WIDTHS[i]} h={H} on={s >= i + 1} lit={hot === i} tint={sid ? 'linear-gradient(180deg,#FFF8F2 0%,#FFEBDC 100%)' : undefined} edge={sid ? ORANGE : undefined}>
              <div style={{ position: 'absolute', inset: 0, padding: stack ? 16 : '18px 16px', display: 'flex', flexDirection: 'column', gap: 12, alignItems: empty ? 'center' : 'flex-start', justifyContent: empty ? 'center' : 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: stack ? 'column' : 'row', alignItems: 'center', alignSelf: stack ? 'stretch' : undefined, gap: stack ? 8 : 12, marginBottom: empty ? 0 : 2 }}>
                  {iconFor(icon, i, sid, empty, stack)}
                  <span style={{ ...heading(sid ? 16 : 17), whiteSpace: stack ? 'normal' : 'nowrap', textAlign: stack ? 'center' : 'left' }}>{title}</span>
                </div>
                {bullets.map((b, k2) => (
                  <div key={k2} style={{ display: 'flex', gap: stack ? 7 : 9, alignItems: 'flex-start' }}>
                    <span style={{ width: 7, height: 7, borderRadius: 99, background: sid ? ORANGE : colors.brand, marginTop: stack ? 7 : 8, flexShrink: 0 }} />
                    <span style={{ ...body(stack ? 13.5 : 15), overflowWrap: 'break-word' }}>{b}</span>
                  </div>
                ))}
                {/* the resolution, icons only: signed in without MFA, so the deny is laid over the allow it overrides */}
                {sid && (
                  <div data-x13="override" style={{ marginTop: 'auto', alignSelf: 'stretch', position: 'relative', height: 86, borderRadius: 16, background: '#FFFFFFB8', boxShadow: 'inset 0 0 0 1.5px #FFD2B0' }}>
                    <span style={{ position: 'absolute', left: 'calc(50% - 104px)', top: 17 }}><Ico3D name="phone" size={52} loop="bob" badge="cross" /></span>
                    <span style={{ position: 'absolute', left: 'calc(50% - 18px)', top: 17, opacity: 0.45, filter: 'saturate(0.45)' }}><Ico3D name="check" size={52} loop="none" /></span>
                    <span className={held ? undefined : lc('press')} style={{ position: 'absolute', left: 'calc(50% + 14px)', top: 13, ...lv(0, 2.6) }}><Ico3D name="cross" size={60} loop="none" /></span>
                  </div>
                )}
              </div>
            </Panel>
            {i < cs.length - 1 && (
              <>
                <Wire pts={[[xs[i] + D_WIDTHS[i], D_AY], [xs[i + 1], D_AY]]} on={s >= i + 2} lit={hot === i + 1} head={10} />
                <Token cls={D_RIDE[i]} on={s >= cs.length} size={9} />
              </>
            )}
          </div>
        )
      })}
    </Frame>
  )
}

/* ================================================================== 45 · C_T24 · evidence → statement → corrected policy */

/*
 * 634 x 330, PAD on every side. Top row: the three stages, joined edge to edge. Bottom row: the three fix options, one
 * under each column so the lower-left is no longer empty; an orthogonal tree runs from Choose a Fix's bottom edge
 * down to a bus, across, and down into the top edge of each option card.
 */
const A = { W: 634, H: 330, PAD: 20, GAP: 40, BH: 132, OH: 100 }
const A_BW = (A.W - A.PAD * 2 - A.GAP * 2) / 3
const A_X = [0, 1, 2].map((i) => A.PAD + i * (A_BW + A.GAP))
const A_CX = A_X.map((x) => x + A_BW / 2)
const A_TOP = A.PAD
const A_OY = A.H - A.PAD - A.OH
const A_BUS = (A_TOP + A.BH + A_OY) / 2
const A_TREE: Pt[][] = [0, 1, 2].map((k) => (k === 2 ? [[A_CX[2], A_TOP + A.BH], [A_CX[2], A_OY]] : [[A_CX[2], A_TOP + A.BH], [A_CX[2], A_BUS], [A_CX[k], A_BUS], [A_CX[k], A_OY]]))
const A_PERIOD = 3.2
const A_RIDE_TOP = [0, 1].map((i) => ride(`a-top-${i}`, [[A_X[i] + A_BW, A_TOP + A.BH / 2], [A_X[i + 1] - 10, A_TOP + A.BH / 2]], 0.1 + i * 0.6, 0.9 + i * 0.6, A_PERIOD))
const A_RIDE_TREE = A_TREE.map((pts, k) => ride(`a-tree-${k}`, [...pts.slice(0, -1), [pts[pts.length - 1][0], pts[pts.length - 1][1] - 10]] as Pt[], 1.5, 2.9, A_PERIOD))

const C_T24: Fig = ({ step = 0 }) => {
  const s = step as number
  const hot = useHot(3, s)
  const boxes: [string, ReactNode][] = [
    ['Evidence Gathered', <Ico3D key="a" name="log" size={46} loop="bob" />],
    ['Statement Identified', <Pair key="b" main="doc" over="search" size={42} k={0.58} loop="bob" d={0.7} overLoop="glint" />],
    ['Choose a Fix', <Ico3D key="c" name="docfix" size={46} loop="bob" d={1.4} />],
  ]
  const fixes: [string, Ico3DName, Badge | undefined][] = [
    ['Add Allow', 'plus', undefined],
    ['Remove Deny', 'minus', undefined],
    ['Satisfy Condition', 'filter', 'check'],
  ]
  return (
    <Frame w={A.W} h={A.H}>
      {boxes.map(([title, icon], i) => (
        <div key={title}>
          <Panel x={A_X[i]} y={A_TOP} w={A_BW} h={A.BH} on={s >= i + 1} lit={hot === i}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14 }}>
              <Plinth size={54}>{icon}</Plinth>
              <span style={{ ...heading(16), textAlign: 'center' }}>{title}</span>
            </div>
          </Panel>
          {i < 2 && (
            <>
              <Wire pts={[[A_X[i] + A_BW, A_TOP + A.BH / 2], [A_X[i + 1], A_TOP + A.BH / 2]]} on={s >= i + 2} lit={hot === i + 1} />
              <Token cls={A_RIDE_TOP[i]} on={s >= 3} size={9} />
            </>
          )}
        </div>
      ))}
      {A_TREE.map((pts, k) => (
        <div key={k}>
          <Wire pts={pts} on={s >= 3} lit={hot === 2} delay={200 + 150 * k} />
          <Token cls={A_RIDE_TREE[k]} on={s >= 3} size={9} tone="#1F9D63" />
        </div>
      ))}
      <Junction x={A_CX[2]} y={A_BUS} on={s >= 3} lit={hot === 2} />
      {fixes.map(([label, icon, badge], k) => (
        <Panel key={label} x={A_X[k]} y={A_OY} w={A_BW} h={A.OH} on={s >= 3} delay={350 + 150 * k} lit={hot === 2} radius={16}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12 }}>
            <Ico3D name={icon} size={48} loop="pulse" d={k * 0.6} t={2.6} badge={badge} />
            <span style={tag(15, colors.brandDark)}>{label}</span>
          </div>
        </Panel>
      ))}
    </Frame>
  )
}

/* ================================================================== exports */

export const figures: Record<string, Fig> = { C_T19, C_T20, C_T23, C_T24 }

export const css = `
.x13 { animation-delay: var(--x13-d, 0s); }
@keyframes x13-halo { 0%, 100% { opacity: 0.35; transform: scale(0.985) } 50% { opacity: 0.9; transform: scale(1.015) } }
.x13-halo { animation: x13-halo var(--x13-t, 3.6s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes x13-glow { 0%, 100% { opacity: 1 } 50% { opacity: 0.74 } }
.x13-glow { animation: x13-glow var(--x13-t, 2.6s) ease-in-out infinite; }
@keyframes x13-union { 0%, 100% { opacity: 0.8 } 50% { opacity: 1 } }
.x13-union { animation: x13-union var(--x13-t, 3.2s) ease-in-out infinite; }
@keyframes x13-ripple { 0% { transform: scale(0.94); opacity: 0.9 } 100% { transform: scale(1.14); opacity: 0 } }
.x13-ripple { animation: x13-ripple var(--x13-t, 2.8s) ease-out infinite; }
@keyframes x13-press { 0%, 100% { transform: translateX(8px) scale(0.96) } 45%, 60% { transform: translateX(-4px) scale(1.06) } }
.x13-press { animation: x13-press var(--x13-t, 2.6s) cubic-bezier(0.45,0,0.55,1) infinite; }
${KF.join('\n')}
.cc-still .x13, .deck-thumb .x13 { animation: none !important; }
.cc-still .x13-halo, .deck-thumb .x13-halo { opacity: 0.5 !important; transform: none !important; }
@media (prefers-reduced-motion: reduce) { .x13 { animation: none !important; } }
`
