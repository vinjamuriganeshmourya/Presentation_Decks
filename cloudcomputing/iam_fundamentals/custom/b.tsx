import { useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { TILE_SKIN } from '@/decks/figures/card'
import { MOTION, motionHeld } from '@/motion/tokens'
import { litRing, NoteBox } from '@/decks/figures/net/frames'
import { VisualTable } from '@/decks/figures/net/vtable'
import { Icon } from '@/engine/icon'
import resPolicy from '../images/res-iam-permissions.svg'
import resBucket from '../images/res-s3-bucket.svg'
import awsS3 from '../images/aws-s3.svg'
import { Ico3D, Tile3D, type Ico3DName, type Badge, type Loop } from './icons3d'

/*
 * BUILDER B · IAM Fundamentals (Session 13), section 3 · Policy Structure:
 *   B_T10   slide 21  a policy document opening into Effect, Action, Resource, Condition (Condition dashed: optional)
 *   B_T10B  slide 22  the TR's policy JSON in a code pane, the TR's three field lines as callouts on their keys
 *   B_T11   slide 24  the four-part strip with Effect and Action lit (the TR's carried-over highlight) over the
 *           Field / Format / Example table
 *   B_T11B  slide 25  s3:* fanning to S3 operations, one statement listing several actions, a two-position Effect switch
 *   B_T12   slide 26  the TR's ARN split at its colons, the resource segment, condition keys, a resource wildcard
 *   B_T13   slide 27  identity-based (a user carrying its policy) beside resource-based (a bucket holding its policy,
 *           Principal line, a second account's arrow), the five TR bullets under the side they describe
 *   B_T14   slide 29  the TR table beside a small copy of the T13 two-box picture, the TR's closing note under both
 *
 * Built to Sessions 9-12 as reviewed (standing corrections 1-16, cloud R10-R13): icon-first, one Title Case tag per
 * untagged icon, no chips / badges / connector labels, official marks on still white tiles, a quiet loop on every
 * glyph after its build, sequential highlights loop first → last → first (orange), the press's own part lit blue,
 * straight arrows from constants, equal padding, nothing overlapping. `step` 0 = nothing pressed; step i shows part i
 * and lights it while it is the current press. Held frames (?still, thumbnails, reduced motion): the full end state,
 * nothing lit, nothing moving. Loops are CSS on HTML elements (`b13-*`, transform / opacity only) or state changes
 * eased by a transition.
 */

type Fig = (p: Record<string, unknown>) => ReactNode

const EASE = MOTION.ease
const FONT = "'DM Sans', system-ui, sans-serif"
const MONO = "'Fira Code', 'Ubuntu Mono', ui-monospace, monospace"
const NOLIG: CSSProperties = { fontVariantLigatures: 'none', fontFeatureSettings: "'liga' 0, 'calt' 0" }
const useHeld = () => motionHeld(useInstant())

const BLUE_RING = (on: boolean, base = '') => `${base}${base && on ? ', ' : ''}${on ? `0 0 0 2.5px ${colors.brand}, 0 10px 22px -12px ${colors.brand}` : ''}`
const CARD_RIM = 'inset 0 0 0 1px #D6E0F5, 0 10px 22px -16px rgba(31,64,140,0.45)'

const lc = (kind: string) => `b13 b13-${kind}`
const lv = (d = 0, t?: number): CSSProperties => ({ ['--b13-d' as string]: `${-d}s`, ...(t ? { ['--b13-t' as string]: `${t}s` } : {}) }) as CSSProperties

/** after the build: starts on the part the last press lit (no jump back), then walks first → last → first forever */
function useWalk(n: number, done: boolean, ms = 1400): number {
  const held = useHeld()
  const [i, setI] = useState(n - 1)
  useEffect(() => {
    setI(n - 1)
    if (!done || held || n < 1) return
    const id = window.setInterval(() => setI((v) => (v + 1) % n), ms)
    return () => window.clearInterval(id)
  }, [n, done, held, ms])
  return done && !held ? i : -1
}

/** build state for a figure of `n` parts: part i shows from press i, lit (blue) while it is the current press */
function useParts(step: number, n: number) {
  const held = useHeld()
  const s = held ? n : step
  return {
    held,
    s,
    shown: (i: number) => held || s >= i,
    lit: (i: number) => !held && s === i && s < n,
    done: !held && s >= n,
  }
}

function Show({ on, children, style, delay = 0, rise = 6 }: { on: boolean; children: ReactNode; style?: CSSProperties; delay?: number; rise?: number }) {
  const instant = useInstant()
  return (
    <div
      style={{
        opacity: on ? 1 : 0,
        transform: on ? 'none' : `translateY(${rise}px)`,
        transition: instant ? 'none' : `opacity ${MOTION.reveal}ms ${EASE} ${on ? delay : 0}ms, transform ${MOTION.reveal}ms ${EASE} ${on ? delay : 0}ms`,
        pointerEvents: on ? undefined : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** the figure's own w x h box, centred in the stage */
const Frame = ({ w, h, children }: { w: number; h: number; children: ReactNode }) => (
  <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
    <div style={{ position: 'relative', width: w, height: h }}>{children}</div>
  </div>
)

const tagStyle = (size = 14, color: string = colors.brandDeep): CSSProperties => ({ fontFamily: FONT, fontWeight: 600, fontSize: size, lineHeight: 1.15, color, whiteSpace: 'nowrap', textAlign: 'center' })

/** a zero-size anchor at (x, y) centring its child */
const At = ({ x, y, children, z = 4 }: { x: number; y: number; children: ReactNode; z?: number }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: 0, height: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: z }}>
    <div style={{ flexShrink: 0 }}>{children}</div>
  </div>
)

/** an official mark on its white tile (rule 54); the mark never moves */
function MarkTile({ src, size = 44, k = 0.66, ring }: { src: string; size?: number; k?: number; ring?: string }) {
  const instant = useInstant()
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: Math.round(size * 0.26), background: '#FFFFFF', boxShadow: `inset 0 0 0 1px #CFDCF5, 0 8px 18px -12px rgba(31,64,140,0.5)${ring ? `, ${ring}` : ''}`, transition: instant ? 'none' : `box-shadow 420ms ${EASE}`, flexShrink: 0 }}>
      <img src={src} alt="" aria-hidden draggable={false} style={{ width: Math.round(size * k), height: 'auto', display: 'block' }} />
    </span>
  )
}

/** a lucide glyph (or an `img:` mark from deck data) on a soft tile; the glyph carries the loop */
function GlyphTile({ icon, size = 40, tone = colors.brand, loop = 'float', d = 0, t, style }: { icon: string; size?: number; tone?: string; loop?: string; d?: number; t?: number; style?: CSSProperties }) {
  const img = icon.startsWith('img:')
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: Math.round(size * 0.27), ...TILE_SKIN, ...(img ? { background: '#FFFFFF' } : {}), color: tone, flexShrink: 0, ...style }}>
      <span className={loop && !img ? lc(loop) : undefined} style={{ display: 'grid', placeItems: 'center', ...lv(d, t) }}>
        <Icon name={icon} size={Math.round(size * (img ? 0.64 : 0.5))} />
      </span>
    </span>
  )
}

/** a white card whose rim turns blue while its press is current and orange while the after-build walk is on it */
function PartCard({ x, y, w, h, lit = false, walk = false, dashed = false, children, style }: { x: number; y: number; w: number; h: number; lit?: boolean; walk?: boolean; dashed?: boolean; children: ReactNode; style?: CSSProperties }) {
  const instant = useInstant()
  const base = dashed ? '0 10px 22px -16px rgba(31,64,140,0.45)' : CARD_RIM
  const ring = lit ? BLUE_RING(true, base) : litRing(walk, base)
  return (
    <div
      style={{
        position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 14, background: '#FFFFFF', boxSizing: 'border-box',
        border: dashed ? `2px dashed ${colors.brand}66` : undefined, boxShadow: ring,
        transition: instant ? 'none' : `box-shadow 420ms ${EASE}`, ...style,
      }}
    >
      {children}
    </div>
  )
}

/**
 * A straight arrow from (x1, y1) to (x2, y2): the shaft stops at the head's base, the filled head's tip lands exactly
 * on (x2, y2). It draws itself along its length when it appears.
 */
function Arrow({ x1, y1, x2, y2, on = true, color = colors.brand, width = 2.5, head = 10, delay = 0 }: { x1: number; y1: number; x2: number; y2: number; on?: boolean; color?: string; width?: number; head?: number; delay?: number }) {
  const instant = useInstant()
  const len = Math.hypot(x2 - x1, y2 - y1)
  const ux = (x2 - x1) / len
  const uy = (y2 - y1) / len
  const bx = x2 - ux * head
  const by = y2 - uy * head
  const hw = head * 0.55
  const shaft = Math.max(0.1, len - head)
  const tr = instant ? 'none' : `stroke-dashoffset 760ms ${EASE} ${on ? delay : 0}ms`
  return (
    <svg aria-hidden style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', zIndex: 2 }} width={1} height={1}>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={shaft} strokeDashoffset={on ? 0 : shaft} style={{ transition: tr }} />
      <polygon points={`${x2},${y2} ${bx - uy * hw},${by + ux * hw} ${bx + uy * hw},${by - ux * hw}`} fill={color} style={{ opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 240ms ${EASE} ${on ? delay + 520 : 0}ms` }} />
    </svg>
  )
}

/** a plain straight line (no head) that draws itself */
function Line({ x1, y1, x2, y2, on = true, color = `${colors.brand}99`, width = 2.5, delay = 0 }: { x1: number; y1: number; x2: number; y2: number; on?: boolean; color?: string; width?: number; delay?: number }) {
  const instant = useInstant()
  const len = Math.max(0.1, Math.hypot(x2 - x1, y2 - y1))
  return (
    <svg aria-hidden style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', zIndex: 1 }} width={1} height={1}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={on ? 0 : len} style={{ transition: instant ? 'none' : `stroke-dashoffset 620ms ${EASE} ${on ? delay : 0}ms` }} />
    </svg>
  )
}

/** the four policy parts, one icon each, the same on every slide of this section */
const PARTS = [
  { tag: 'Effect', icon: 'ToggleRight' },
  { tag: 'Action', icon: 'Play' },
  { tag: 'Resource', icon: 'Crosshair' },
  { tag: 'Condition', icon: 'Filter' },
]

/** a policy document drawn as a page: the IAM Permissions mark and faint JSON lines */
function PolicyPage({ w, h, mark = 40, ring }: { w: number; h: number; mark?: number; ring?: string }) {
  const instant = useInstant()
  const bars = [0.78, 0.56, 0.7, 0.44, 0.62, 0.5, 0.66]
  const rows = Math.max(2, Math.min(bars.length, Math.floor((h - mark - 34) / 15)))
  return (
    <div style={{ width: w, height: h, borderRadius: 14, background: 'linear-gradient(180deg, #FFFFFF 0%, #F4F7FE 100%)', boxShadow: `${CARD_RIM}${ring ? `, ${ring}` : ''}`, transition: instant ? 'none' : `box-shadow 420ms ${EASE}`, padding: 14, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 9 }}>
      <MarkTile src={resPolicy} size={mark} />
      {bars.slice(0, rows).map((b, i) => (
        <span key={i} style={{ display: 'block', height: 6, width: `${b * 100}%`, borderRadius: 4, background: i % 3 === 0 ? `${colors.brand}40` : '#D9E2F3' }} />
      ))}
    </div>
  )
}

/* ═════════════════════════════════════════ B_T10 · slide 21 · a policy document opening into its four parts */

function B_T10({ step = 0 }: { step?: number }) {
  const W = 600
  const H = 300
  const P = useParts(step, 4)
  const walk = useWalk(4, P.done)
  const DOC = { x: 18, y: 40, w: 172, h: 220 }
  const TRUNK_X = 240
  const CARD = { x: 278, w: 300, h: 56 }
  const CY = [45, 115, 185, 255]
  const midY = DOC.y + DOC.h / 2
  return (
    <Frame w={W} h={H}>
      <div style={{ position: 'absolute', left: DOC.x, top: DOC.y }}>
        <PolicyPage w={DOC.w} h={DOC.h} mark={46} />
      </div>
      <At x={DOC.x + DOC.w / 2} y={DOC.y + DOC.h + 22}>
        <span style={tagStyle(15)}>Policy</span>
      </At>
      {/* the trunk: doc → spine, spine runs between the first and the last shown part */}
      <Line x1={DOC.x + DOC.w} y1={midY} x2={TRUNK_X} y2={midY} on={P.shown(1)} />
      <Line x1={TRUNK_X} y1={Math.min(midY, CY[0])} x2={TRUNK_X} y2={Math.max(midY, CY[Math.max(0, Math.min(3, P.s - 1))])} on={P.shown(1)} />
      {PARTS.map((p, i) => (
        <div key={p.tag}>
          <Arrow x1={TRUNK_X} y1={CY[i]} x2={CARD.x - 4} y2={CY[i]} on={P.shown(i + 1)} delay={120} />
          <Show on={P.shown(i + 1)} delay={180}>
            <PartCard x={CARD.x} y={CY[i] - CARD.h / 2} w={CARD.w} h={CARD.h} lit={P.lit(i + 1)} walk={walk === i} dashed={i === 3}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, height: '100%', padding: '0 14px' }}>
                <GlyphTile icon={p.icon} size={36} d={i * 0.7} />
                <span style={{ ...tagStyle(18, colors.ink), textAlign: 'left' }}>{p.tag}</span>
              </div>
            </PartCard>
          </Show>
        </div>
      ))}
    </Frame>
  )
}

/* ═════════════════════════════════════════ correction round 2026-11-16: shared pieces for slides 22-29 */

type Pt = [number, number]

/**
 * An ORTHOGONAL connector (user 2026-11-16, G5): every segment horizontal or vertical, 90° bends with a small
 * rounded corner, the shaft stopping at the head's base and the head's tip exactly on the last point. Draws itself.
 */
function Elbow({ pts, on = true, color = colors.brand, width = 2.5, head = 10, delay = 0, r = 7, z = 2 }: { pts: Pt[]; on?: boolean; color?: string; width?: number; head?: number; delay?: number; r?: number; z?: number }) {
  const instant = useInstant()
  const n = pts.length
  const [ax, ay] = pts[n - 2]
  const [bx, by] = pts[n - 1]
  const l = Math.max(0.1, Math.hypot(bx - ax, by - ay))
  const ux = (bx - ax) / l
  const uy = (by - ay) / l
  const P: Pt[] = [...pts.slice(0, -1), [bx - ux * head, by - uy * head]]
  let d = `M ${P[0][0]} ${P[0][1]}`
  let len = 0
  for (let i = 1; i < P.length; i++) len += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])
  for (let i = 1; i < P.length - 1; i++) {
    const [px, py] = P[i - 1]
    const [cx, cy] = P[i]
    const [nx, ny] = P[i + 1]
    const l1 = Math.max(0.1, Math.hypot(cx - px, cy - py))
    const l2 = Math.max(0.1, Math.hypot(nx - cx, ny - cy))
    const rr = Math.min(r, l1 / 2, l2 / 2)
    d += ` L ${cx - ((cx - px) / l1) * rr} ${cy - ((cy - py) / l1) * rr} Q ${cx} ${cy} ${cx + ((nx - cx) / l2) * rr} ${cy + ((ny - cy) / l2) * rr}`
  }
  d += ` L ${P[P.length - 1][0]} ${P[P.length - 1][1]}`
  const hw = head * 0.55
  const tr = instant ? 'none' : `stroke-dashoffset 760ms ${EASE} ${on ? delay : 0}ms, stroke 420ms ${EASE}`
  return (
    <svg aria-hidden style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', zIndex: z }} width={1} height={1}>
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={on ? 0 : len} style={{ transition: tr }} />
      {head > 0 && (
        <polygon
          points={`${bx},${by} ${bx - ux * head - uy * hw},${by - uy * head + ux * hw} ${bx - ux * head + uy * hw},${by - uy * head - ux * hw}`}
          fill={color}
          style={{ opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 240ms ${EASE} ${on ? delay + 520 : 0}ms, fill 420ms ${EASE}` }}
        />
      )}
    </svg>
  )
}

/**
 * A flow dot riding a polyline, as ONE CSS animation of `transform` / `opacity` on an HTML element (composited, no
 * per-frame React render). It moves for `ride` of the period, eased, and fades at both ends. Gone on held frames.
 */
function Ride({ pts, period = 2.4, phase = 0, on = true, tone = colors.brand, size = 9, ride = 0.72, z = 3 }: { pts: Pt[]; period?: number; phase?: number; on?: boolean; tone?: string; size?: number; ride?: number; z?: number }) {
  const held = useHeld()
  const name = 'b13r' + useId().replace(/[^a-zA-Z0-9]/g, '')
  if (held || !on || pts.length < 2) return null
  const segs = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]))
  const total = Math.max(0.1, segs.reduce((a, b) => a + b, 0))
  let acc = 0
  const pct = (u: number) => (u * 100).toFixed(2)
  const frames: string[] = [`0% { transform: translate(${pts[0][0]}px, ${pts[0][1]}px); opacity: 0; animation-timing-function: cubic-bezier(0.45,0,0.55,1) }`]
  frames.push(`${pct(ride * 0.12)}% { opacity: 1 }`)
  pts.slice(1).forEach((p, i) => {
    acc += segs[i]
    frames.push(`${pct((ride * acc) / total)}% { transform: translate(${p[0]}px, ${p[1]}px) }`)
  })
  frames.push(`${pct(ride * 0.86)}% { opacity: 1 }`, `${pct(ride)}% { opacity: 0 }`, `100% { transform: translate(${pts[pts.length - 1][0]}px, ${pts[pts.length - 1][1]}px); opacity: 0 }`)
  return (
    <>
      <style>{`@keyframes ${name} { ${frames.join(' ')} }`}</style>
      <span
        aria-hidden
        className="b13ride"
        style={{ position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, borderRadius: 99, background: tone, boxShadow: `0 0 0 4px ${tone}2e, 0 4px 10px -4px ${tone}`, opacity: 0, zIndex: z, animation: `${name} ${period}s linear ${-phase}s infinite`, willChange: 'transform, opacity', pointerEvents: 'none' }}
      />
    </>
  )
}

/** a counter that ticks every `ms` while `on` (a discrete state change, eased by a CSS transition: no per-frame render) */
function useTick(ms: number, on: boolean) {
  const held = useHeld()
  const [n, setN] = useState(0)
  useEffect(() => {
    setN(0)
    if (!on || held) return
    const id = window.setInterval(() => setN((v) => v + 1), ms)
    return () => window.clearInterval(id)
  }, [ms, on, held])
  return held ? 0 : n
}

/** a round numbered marker: the same number on a code key and on the card it explains */
const Num = ({ n, size = 22, tone = colors.brand, rim = '#FFFFFF' }: { n: number; size?: number; tone?: string; rim?: string }) => (
  <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, flexShrink: 0, background: `linear-gradient(180deg, ${tone === colors.accent ? '#FFB27A' : '#6F97FF'} 0%, ${tone} 100%)`, color: '#FFFFFF', fontFamily: FONT, fontWeight: 800, fontSize: Math.round(size * 0.56), lineHeight: 1, boxShadow: `0 0 0 2.5px ${rim}, 0 4px 10px -4px ${tone}`, transition: `background 420ms ${EASE}` }}>
    {n}
  </span>
)

/** a soft halo that breathes behind a lit card (opacity loop on an HTML element) */
const Halo = ({ on, radius = 16, tone = colors.brand }: { on: boolean; radius?: number; tone?: string }) =>
  on ? <span aria-hidden className={lc('halo')} style={{ position: 'absolute', inset: -6, borderRadius: radius + 6, background: `radial-gradient(closest-side, ${tone}38, ${tone}00)`, pointerEvents: 'none', ...lv(0, 2.6) }} /> : null

/** a glossy 3D light bulb (Example), drawn here in icons3d's style because that set has none */
function Bulb3D({ size = 32 }: { size?: number }) {
  const id = 'bb' + useId().replace(/[^a-zA-Z0-9]/g, '')
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} style={{ display: 'block', overflow: 'visible' }} aria-hidden>
      <defs>
        <radialGradient id={`${id}g`} cx="0.36" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFF4C2" />
          <stop offset="0.5" stopColor="#FFC53A" />
          <stop offset="1" stopColor="#E69C0E" />
        </radialGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F5F7FB" />
          <stop offset="0.5" stopColor="#C8D1DF" />
          <stop offset="1" stopColor="#95A2B8" />
        </linearGradient>
        <radialGradient id={`${id}sh`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#0B1F4D" stopOpacity="0.3" />
          <stop offset="1" stopColor="#0B1F4D" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={32} cy={60} rx={14} ry={3} fill={`url(#${id}sh)`} />
      <path d="M 32 5 C 44 5 52 14 52 25 C 52 33 47 37 44 42 H 20 C 17 37 12 33 12 25 C 12 14 20 5 32 5 Z" fill="#AE7105" transform="translate(0 2.5)" />
      <path d="M 32 5 C 44 5 52 14 52 25 C 52 33 47 37 44 42 H 20 C 17 37 12 33 12 25 C 12 14 20 5 32 5 Z" fill={`url(#${id}g)`} />
      <ellipse cx={24} cy={15} rx={6} ry={3.6} fill="#FFFFFF" opacity="0.6" transform="rotate(-30 24 15)" />
      <path d="M 26 40 V 31 L 29 27 L 32 31 L 35 27 L 38 31 V 40" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <rect x={20} y={42} width={24} height={6} rx={3} fill={`url(#${id}s)`} />
      <rect x={21} y={49} width={22} height={5} rx={2.5} fill={`url(#${id}s)`} />
      <rect x={26} y={55} width={12} height={4} rx={2} fill="#6C788E" />
    </svg>
  )
}

/** a policy page with a 3D policy sheet in place of a flat mark, faint JSON lines under it */
function PolicyPage3D({ w, h, mark = 40, ring, d = 0 }: { w: number; h: number; mark?: number; ring?: string; d?: number }) {
  const instant = useInstant()
  const bars = [0.78, 0.56, 0.7, 0.44, 0.62]
  const rows = Math.max(1, Math.min(bars.length, Math.floor((h - mark - 24) / 13)))
  return (
    <div style={{ width: w, height: h, borderRadius: 14, background: 'linear-gradient(180deg, #FFFFFF 0%, #F4F7FE 100%)', boxShadow: `${CARD_RIM}${ring ? `, ${ring}` : ''}`, transition: instant ? 'none' : `box-shadow 420ms ${EASE}`, padding: 10, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
      <Ico3D name="policy" size={mark} loop="tilt" d={d} t={3.4} />
      {bars.slice(0, rows).map((b, i) => (
        <span key={i} style={{ display: 'block', height: 5, width: `${b * 100}%`, borderRadius: 4, background: i % 3 === 0 ? `${colors.brand}40` : '#D9E2F3' }} />
      ))}
    </div>
  )
}

/** the four policy parts as 3D icons (Effect a switch, Action a play button, Resource a target, Condition a filter) */
const PART3D: Ico3DName[] = ['toggle', 'play', 'target', 'filter']
const LOOP3D: Loop[] = ['pulse', 'beat', 'glint', 'tilt']

/* ═════════════════════════════════════════ B_T10B · slide 22 · the policy JSON with the TR's three field lines */

type KeyMark = { key: string; state: 'shown' | 'lit' | 'walk' }

/** one JSON line, keys tinted blue, string values warm, punctuation quiet; `mark` boxes one key token exactly */
function JsonLine({ text, mark }: { text: string; mark?: KeyMark }) {
  const instant = useInstant()
  const out: ReactNode[] = []
  const re = /("[^"]*")(\s*:)?/g
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(<span key={k++} style={{ color: '#9FB0D6' }}>{text.slice(last, m.index)}</span>)
    const hit = mark && m[2] && m[1] === `"${mark.key}"`
    const st = hit ? mark!.state : null
    const fill = st === 'lit' ? 'rgba(86,140,255,0.42)' : st === 'walk' ? 'rgba(255,150,70,0.36)' : st === 'shown' ? 'rgba(86,140,255,0.16)' : 'transparent'
    const ring = st === 'lit' ? '#6F97FF' : st === 'walk' ? colors.accent : st === 'shown' ? 'rgba(142,192,255,0.55)' : 'transparent'
    out.push(
      <span key={k++} style={{ color: m[2] ? (st === 'walk' ? '#FFD2AE' : '#8EC0FF') : '#FFC98F', borderRadius: 4, padding: hit ? '3px 0' : undefined, background: fill, boxShadow: hit ? `inset 0 0 0 ${st === 'shown' ? 1.5 : 2}px ${ring}` : 'none', transition: instant ? 'none' : `background 420ms ${EASE}, box-shadow 420ms ${EASE}, color 420ms ${EASE}` }}>
        {m[1]}
      </span>,
    )
    if (m[2]) out.push(<span key={k++} style={{ color: '#9FB0D6' }}>{m[2]}</span>)
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(<span key={k++} style={{ color: '#9FB0D6' }}>{text.slice(last)}</span>)
  return <>{out}</>
}

const FIELD_3D: Record<string, Ico3DName> = { Version: 'version', Statement: 'list', Sid: 'tag' }
const LEAD = '#6F97FF'

function B_T10B({ step = 0, code = '', fields = [] }: { step?: number; code?: string; fields?: string[][] }) {
  const W = 1040
  const H = 400
  const P = useParts(step, 3)
  const walk = useWalk(3, P.done, 1700)
  const instant = useInstant()
  const lines = code.split('\n')
  const PANE = { x: 0, y: 0, w: 640, h: H }
  const PAD_X = 26
  const LH = 25
  const PAD_Y = Math.max(16, Math.round((H - lines.length * LH) / 2))
  const lineY = (i: number) => PAD_Y + i * LH + LH / 2
  const keyLine = (key: string) => Math.max(0, lines.findIndex((l) => l.includes(`"${key}"`)))
  const CALL = { x: 712, w: 328, h: 96 }
  /* card 1 sits level with its key (a straight connector); the last card meets the frame's foot; card 2 between */
  const y0 = Math.max(CALL.h / 2, lineY(keyLine(fields[0]?.[1] ?? '')))
  const y2 = H - CALL.h / 2
  const CCY = [y0, (y0 + y2) / 2, y2]
  /* vertical channels between the pane and the cards: the lower a key, the nearer the pane, so no two cross */
  const CH_X = [0, 690, 668]
  const route = (j: number, ly: number): Pt[] => (Math.abs(ly - CCY[j]) < 1 ? [[PANE.w, ly], [CALL.x, CCY[j]]] : [[PANE.w, ly], [CH_X[j], ly], [CH_X[j], CCY[j]], [CALL.x, CCY[j]]])
  const keyState = (j: number): KeyMark['state'] | null => (P.lit(j + 1) ? 'lit' : walk === j ? 'walk' : P.shown(j + 1) ? 'shown' : null)
  const lineMark = new Map<number, { j: number; key: string }>()
  fields.forEach((f, j) => lineMark.set(keyLine(f[1]), { j, key: f[1] }))
  return (
    <Frame w={W} h={H}>
      <div style={{ position: 'absolute', left: PANE.x, top: PANE.y, width: PANE.w, height: PANE.h, borderRadius: 18, background: 'linear-gradient(160deg, #13224A 0%, #0D1834 100%)', boxShadow: '0 18px 36px -22px rgba(13,24,52,0.8), inset 0 0 0 1px #24386B', overflow: 'hidden' }}>
        {/* a soft light sweeping the pane once a period (composited) */}
        {P.done && <span aria-hidden className={lc('sweep')} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 160, background: 'linear-gradient(90deg, rgba(120,160,255,0) 0%, rgba(120,160,255,0.08) 50%, rgba(120,160,255,0) 100%)', ...lv(0, 7) }} />}
        <pre style={{ position: 'absolute', left: PAD_X, top: PAD_Y, width: PANE.w - PAD_X, margin: 0, fontFamily: MONO, fontSize: 15, lineHeight: `${LH}px`, color: '#E6ECFA', whiteSpace: 'pre', ...NOLIG }}>
          {lines.map((l, i) => {
            const mk = lineMark.get(i)
            const st = mk ? keyState(mk.j) : null
            const on = mk ? P.shown(mk.j + 1) : false
            const tone = st === 'walk' ? colors.accent : colors.brand
            return (
              <div key={i} style={{ height: LH, display: 'flex', alignItems: 'center' }}>
                <span style={{ flexShrink: 0 }}>
                  <JsonLine text={l} mark={mk && st ? { key: mk.key, state: st } : undefined} />
                </span>
                {mk && (
                  <>
                    <span style={{ marginLeft: 12, opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.4)', transition: instant ? 'none' : `opacity 360ms ${EASE}, transform 420ms ${EASE}` }}>
                      <span className={on && P.done ? lc('pulse') : undefined} style={{ display: 'block', ...lv(mk.j * 0.5, 2.4) }}>
                        <Num n={mk.j + 1} size={21} tone={tone} rim="#13224A" />
                      </span>
                    </span>
                    {/* the leader from the marker to the pane's edge, where the connector takes over */}
                    <span aria-hidden style={{ flex: 1, height: 2.5, marginLeft: 8, borderRadius: 2, background: st === 'walk' ? colors.accent : LEAD, transformOrigin: '0 50%', transform: on ? 'scaleX(1)' : 'scaleX(0)', transition: instant ? 'none' : `transform 520ms ${EASE} 120ms, background 420ms ${EASE}` }} />
                  </>
                )}
              </div>
            )
          })}
        </pre>
      </div>
      {fields.map((f, j) => {
        const [text, key] = f
        const cut = text.indexOf(':')
        const ly = lineY(keyLine(key))
        const on = P.shown(j + 1)
        const st = keyState(j)
        const pts = route(j, ly)
        return (
          <div key={key}>
            <Elbow pts={pts} on={on} delay={420} color={st === 'walk' ? colors.accent : LEAD} />
            <Ride pts={pts} on={P.done} period={3.6} phase={j * 1.2} tone={LEAD} />
            <Show on={on} delay={560}>
              <PartCard x={CALL.x} y={CCY[j] - CALL.h / 2} w={CALL.w} h={CALL.h} lit={P.lit(j + 1)} walk={walk === j}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, height: '100%', padding: '0 18px' }}>
                  <span style={{ position: 'relative', flexShrink: 0 }}>
                    <Tile3D name={FIELD_3D[key] ?? 'code'} size={52} k={0.8} loop={j === 0 ? 'tilt' : j === 1 ? 'bob' : 'swing'} d={j * 0.7} />
                    <span style={{ position: 'absolute', left: -8, top: -8 }}>
                      <Num n={j + 1} size={20} tone={walk === j ? colors.accent : colors.brand} />
                    </span>
                  </span>
                  <span style={{ fontFamily: FONT, fontSize: 17, lineHeight: 1.3, color: colors.ink }}>
                    <span style={{ color: colors.brand, fontWeight: 700 }}>{text.slice(0, cut + 1)}</span>
                    {text.slice(cut + 1)}
                  </span>
                </div>
              </PartCard>
            </Show>
          </div>
        )
      })}
    </Frame>
  )
}

/* ═════════════════════════════════════════ B_T11 · slide 24 · Effect and Action lit, over the Field table */

function PartStrip({ lit, w = 220, h = 58, gap = 16, size = 17 }: { lit: number[]; w?: number; h?: number; gap?: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap }}>
      {PARTS.map((p, i) => {
        const on = lit.includes(i)
        return (
          <div key={p.tag} style={{ position: 'relative', width: w, height: h }}>
            <Halo on={on} radius={14} />
            <div style={{ position: 'relative', width: w, height: h, borderRadius: 14, boxSizing: 'border-box', background: on ? 'linear-gradient(135deg, #EEF3FF 0%, #DDE7FF 100%)' : '#FFFFFF', border: i === 3 ? `2px dashed ${colors.brand}55` : undefined, boxShadow: on ? BLUE_RING(true, CARD_RIM) : i === 3 ? '0 10px 22px -16px rgba(31,64,140,0.45)' : CARD_RIM, display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px', opacity: on ? 1 : 0.78 }}>
              <Ico3D name={PART3D[i]} size={40} loop={on ? LOOP3D[i] : 'bob'} d={i * 0.6} />
              <span style={{ ...tagStyle(size, on ? colors.brandDark : colors.ink), textAlign: 'left' }}>{p.tag}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const mono = (s: string) => <code style={{ fontFamily: MONO, fontSize: '0.95em', color: colors.brandDark, background: '#EEF3FF', borderRadius: 6, padding: '1px 6px', whiteSpace: 'nowrap', ...NOLIG }}>{s}</code>

const ROW3D: Record<string, Ico3DName> = { ToggleRight: 'toggle', Play: 'play', Crosshair: 'target', Filter: 'filter', Paperclip: 'link', Building2: 'building', MonitorCog: 'laptop', FileText: 'doc', User: 'user', ListTree: 'list' }

function B_T11({ step = 0, head = [], rows = [] }: { step?: number; head?: string[]; rows?: string[][] }) {
  const W = 928
  const H = 300
  const held = useHeld()
  const shown = held ? rows.length : step
  const HEAD: ReactNode[] = [<Ico3D key="t" name="tag" size={32} loop="none" />, <Ico3D key="c" name="code" size={32} loop="none" />, <Bulb3D key="b" size={32} />]
  return (
    <Frame w={W} h={H}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <PartStrip lit={[0, 1]} />
        <div style={{ width: 928 }}>
          <VisualTable
            size={18}
            bigIcons
            shown={shown}
            columns={head.map((label, i) => ({ label, weight: [0.7, 1, 1][i] ?? 1, icon: HEAD[i] }))}
            rows={rows.map((r) => ({ icon: <Ico3D name={ROW3D[r[3]] ?? 'doc'} size={34} loop="none" />, cells: [r[0], r[1].includes(':') ? mono(r[1]) : r[1], r[2].includes(':') ? mono(r[2]) : r[2]] }))}
          />
        </div>
      </div>
    </Frame>
  )
}

/* ═════════════════════════════════════════ B_T11B · slide 25 · wildcard, several actions, a two-position switch */

const OPS = ['s3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:ListBucket']

function EffectSwitch({ allow, size = 1 }: { allow: boolean; size?: number }) {
  const instant = useInstant()
  const TW = 190 * size
  const TH = 54 * size
  const K = TH - 10
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: TW, height: TH, borderRadius: 99, background: allow ? 'linear-gradient(180deg, #E9FBF1 0%, #CFF3DF 100%)' : 'linear-gradient(180deg, #FFF0EE 0%, #FFD9D6 100%)', boxShadow: `inset 0 0 0 1px ${allow ? '#22B86A55' : '#F0475C55'}, inset 0 3px 8px -4px rgba(31,64,140,0.35)`, transition: instant ? 'none' : `background 520ms ${EASE}, box-shadow 520ms ${EASE}` }}>
        <span style={{ position: 'absolute', left: 5, top: 5, width: K, height: K, borderRadius: 99, display: 'grid', placeItems: 'center', transform: `translateX(${allow ? 0 : TW - K - 10}px)`, transition: instant ? 'none' : `transform 620ms ${EASE}` }}>
          <Ico3D name={allow ? 'check' : 'cross'} size={K + 4} loop="none" />
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: TW }}>
        <span style={tagStyle(15, allow ? colors.ink : colors.muted)}>Allow</span>
        <span style={tagStyle(15, allow ? colors.muted : colors.ink)}>Deny</span>
      </div>
    </div>
  )
}

function B_T11B({ step = 0 }: { step?: number }) {
  const W = 594
  const H = 320
  const P = useParts(step, 3)
  /* the switch flips every 1.8 s after the build; held and while building it rests on Allow */
  const tick = useTick(1800, P.done)
  const allow = tick % 2 === 0
  const OPX = 354
  const OPW = 240
  const OPH = 34
  const OPY = [20, 62, 104, 146]
  const midY = (OPY[0] + OPY[3]) / 2
  const SRC = { x: 0, w: 182, h: 76, y: midY - 38 }
  const SPINE = 296
  const branch = (i: number): Pt[] => [[SRC.x + SRC.w, midY], [SPINE, midY], [SPINE, OPY[i]], [OPX, OPY[i]]]
  return (
    <Frame w={W} h={H}>
      {/* point 1: s3:* fans to every S3 operation */}
      <Show on={P.shown(1)}>
        <div style={{ position: 'absolute', left: SRC.x, top: SRC.y, width: SRC.w, height: SRC.h }}>
          <Halo on={P.done} radius={14} />
        </div>
        <PartCard x={SRC.x} y={SRC.y} w={SRC.w} h={SRC.h} lit={P.lit(1)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, height: '100%' }}>
            <MarkTile src={awsS3} size={40} />
            <span style={{ fontFamily: MONO, fontSize: 24, fontWeight: 600, color: colors.brandDark, ...NOLIG }}>s3:*</span>
            <Ico3D name="asterisk" size={26} loop="spin" t={9} />
          </div>
        </PartCard>
        <At x={SRC.x + SRC.w / 2} y={SRC.y + SRC.h + 18}>
          <span style={tagStyle(14)}>Action</span>
        </At>
      </Show>
      {OPS.map((op, i) => (
        <div key={op}>
          <Elbow pts={branch(i)} on={P.shown(1)} delay={140 + i * 90} />
          <Ride pts={branch(i)} on={P.done} period={2.8} phase={i * 0.7} />
          <Show on={P.shown(1)} delay={420 + i * 90}>
            <div style={{ position: 'absolute', left: OPX, top: OPY[i] - OPH / 2, width: OPW, height: OPH, borderRadius: 10, background: '#FFFFFF', boxShadow: CARD_RIM, display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', boxSizing: 'border-box' }}>
              <Ico3D name="doc" size={24} loop="bob" d={i * 0.5} />
              <span style={{ fontFamily: MONO, fontSize: 15, color: colors.ink, ...NOLIG }}>{op}</span>
            </div>
          </Show>
        </div>
      ))}
      {/* point 2: one statement, several actions */}
      <Show on={P.shown(2)}>
        <PartCard x={0} y={196} w={296} h={124} lit={P.lit(2)}>
          <div style={{ display: 'flex', gap: 12, padding: '16px 18px', height: '100%', boxSizing: 'border-box' }}>
            <Ico3D name="policy" size={42} loop="tilt" t={3.6} />
            <pre style={{ margin: 0, fontFamily: MONO, fontSize: 14.5, lineHeight: '23px', whiteSpace: 'pre', ...NOLIG }}>
              <div><JsonDark text={'"Action": ['} /></div>
              <div><JsonDark text={'  "s3:GetObject",'} /></div>
              <div><JsonDark text={'  "s3:PutObject"'} /></div>
              <div><JsonDark text={']'} /></div>
            </pre>
          </div>
        </PartCard>
      </Show>
      {/* point 3: Effect has exactly two positions */}
      <Show on={P.shown(3)}>
        <PartCard x={316} y={196} w={278} h={124} lit={P.lit(3)}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Ico3D name="toggle" size={26} loop="pulse" />
              <span style={tagStyle(15)}>Effect</span>
            </div>
            <EffectSwitch allow={allow} size={0.9} />
          </div>
        </PartCard>
      </Show>
    </Frame>
  )
}

/** JSON on a light card: keys blue, values ink */
function JsonDark({ text }: { text: string }) {
  const out: ReactNode[] = []
  const re = /("[^"]*")(\s*:)?/g
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(<span key={k++} style={{ color: colors.muted }}>{text.slice(last, m.index)}</span>)
    out.push(<span key={k++} style={{ color: m[2] ? colors.brand : colors.ink, fontWeight: m[2] ? 600 : 400 }}>{m[1]}</span>)
    if (m[2]) out.push(<span key={k++} style={{ color: colors.muted }}>{m[2]}</span>)
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(<span key={k++} style={{ color: colors.muted }}>{text.slice(last)}</span>)
  return <>{out}</>
}

/* ═════════════════════════════════════════ B_T12 · slide 26 · the ARN split at its colons */

const ARN = 'arn:aws:s3:::finance-reports/jan.pdf'
const SEGS = [
  { v: 'arn', tag: 'Prefix', w: 52 },
  { v: 'aws', tag: 'Partition', w: 60 },
  { v: 's3', tag: 'Service', w: 48 },
  { v: '', tag: 'Region', w: 52 },
  { v: '', tag: 'Account', w: 58 },
]

function B_T12({ step = 0 }: { step?: number }) {
  /* the stage is 446 x 300: a 406 x 260 frame leaves 20 px on all four sides (user 2026-11-16, G1) */
  const W = 406
  const H = 260
  const P = useParts(step, 4)
  const walk = useWalk(SEGS.length + 1, P.done, 1100)
  const instant = useInstant()
  const GAP = 14
  const rowW = SEGS.reduce((a, s) => a + s.w, 0) + GAP * SEGS.length
  let x = (W - rowW) / 2
  const segX = SEGS.map((s) => {
    const at = x
    x += s.w + GAP
    return at
  })
  const BUS_Y = 40
  const SEG_Y = 50
  const SEG_H = 34
  const RES = { w: 262, h: 36, y: 116 }
  const resX = (W - RES.w) / 2
  const resCY = RES.y + RES.h / 2
  const lastColon = segX[SEGS.length - 1] + SEGS[SEGS.length - 1].w + GAP / 2
  const CH_X = lastColon + 16
  const segCX = segX.map((sx, i) => sx + SEGS[i].w / 2)
  const toRes: Pt[] = [[CH_X, BUS_Y], [CH_X, resCY], [resX + RES.w, resCY]]
  const CARD = { y: 180, h: 80, w: (W - 14) / 2 }
  /* each lower card's own title (Session 13 review, T12): Condition, Wildcard */
  const cardTitle: CSSProperties = { ...tagStyle(13, colors.brand), fontWeight: 700 }
  const segBox = (empty: boolean, walkOn: boolean): CSSProperties => ({
    height: SEG_H, borderRadius: 10, boxSizing: 'border-box', display: 'grid', placeItems: 'center',
    background: empty ? 'rgba(255,255,255,0.6)' : 'linear-gradient(180deg, #FFFFFF 0%, #F2F6FF 100%)', border: empty ? `2px dashed ${colors.brand}55` : undefined,
    boxShadow: litRing(walkOn, empty ? '' : CARD_RIM), transition: instant ? 'none' : `box-shadow 420ms ${EASE}`,
  })
  return (
    <Frame w={W} h={H}>
      {/* the whole string */}
      <At x={W / 2} y={15}>
        <span style={{ display: 'block', fontFamily: MONO, fontSize: 14, color: colors.brandDark, background: 'linear-gradient(180deg, #F2F6FF 0%, #E3ECFF 100%)', borderRadius: 10, padding: '5px 12px', whiteSpace: 'nowrap', boxShadow: `inset 0 0 0 1px ${colors.brand}30, 0 8px 16px -12px rgba(31,64,140,0.5)`, ...NOLIG }}>{ARN}</span>
      </At>
      {/* point 1: split at the colons: one bus under the string, a drop into every field */}
      <Line x1={W / 2} y1={30} x2={W / 2} y2={BUS_Y} on={P.shown(1)} />
      <Line x1={segCX[0]} y1={BUS_Y} x2={CH_X} y2={BUS_Y} on={P.shown(1)} delay={120} />
      {segCX.map((cx, i) => (
        <Line key={i} x1={cx} y1={BUS_Y} x2={cx} y2={SEG_Y} on={P.shown(1)} delay={240 + i * 60} />
      ))}
      {SEGS.map((s, i) => (
        <div key={s.tag}>
          <Show on={P.shown(1)} delay={i * 90} style={{ position: 'absolute', left: segX[i], top: SEG_Y, width: s.w }}>
            <div style={segBox(!s.v, walk === i)}>
              <span style={{ fontFamily: MONO, fontSize: 14.5, color: colors.ink, ...NOLIG }}>{s.v}</span>
            </div>
            <div style={{ ...tagStyle(12.5), marginTop: 6 }}>{s.tag}</div>
          </Show>
          <Show on={P.shown(1)} delay={i * 90} style={{ position: 'absolute', left: segX[i] + s.w, top: SEG_Y, width: GAP, height: SEG_H, display: 'grid', placeItems: 'center' }}>
            <span style={{ fontFamily: MONO, fontSize: 17, fontWeight: 700, color: colors.muted }}>:</span>
          </Show>
        </div>
      ))}
      {/* point 2: the resource field, the ARN's last part, joined from the bus */}
      <Elbow pts={toRes} on={P.shown(1)} delay={SEGS.length * 90} head={9} />
      <Ride pts={toRes} on={P.done} period={3.2} />
      <Show on={P.shown(1)} delay={SEGS.length * 90 + 200} style={{ position: 'absolute', left: resX, top: RES.y, width: RES.w }}>
        <div style={{ height: RES.h, borderRadius: 10, background: P.lit(2) ? 'linear-gradient(135deg, #EEF3FF 0%, #DDE7FF 100%)' : '#FFFFFF', boxShadow: P.lit(2) ? BLUE_RING(true, CARD_RIM) : litRing(walk === SEGS.length, CARD_RIM), transition: instant ? 'none' : `box-shadow 420ms ${EASE}, background 420ms ${EASE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Ico3D name="object" size={24} loop="bob" />
          <span style={{ fontFamily: MONO, fontSize: 14.5, color: colors.ink, ...NOLIG }}>finance-reports/jan.pdf</span>
        </div>
        <div style={{ ...tagStyle(12.5), marginTop: 6 }}>Resource</div>
      </Show>
      {/* point 3: condition keys */}
      <Show on={P.shown(3)} style={{ position: 'absolute', left: 0, top: CARD.y, width: CARD.w, height: CARD.h }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', gap: 4, height: '100%', borderRadius: 14, background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F8FF 100%)', boxShadow: P.lit(3) ? BLUE_RING(true, CARD_RIM) : CARD_RIM, transition: instant ? 'none' : `box-shadow 420ms ${EASE}`, padding: '6px 10px', boxSizing: 'border-box' }}>
          <span style={cardTitle}>Condition</span>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          {([
            { icon: 'globe', tag: 'IP', loop: 'spin' },
            { icon: 'clock', tag: 'Time', loop: 'pulse' },
            { icon: 'phone', tag: 'MFA', loop: 'swing' },
          ] as { icon: Ico3DName; tag: string; loop: Loop }[]).map((c, i) => (
            <div key={c.tag} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <Ico3D name={c.icon} size={30} loop={c.loop} d={i * 0.7} t={c.loop === 'spin' ? 12 : undefined} />
              <span style={tagStyle(12.5)}>{c.tag}</span>
            </div>
          ))}
          </div>
        </div>
      </Show>
      {/* point 4: a wildcard covers a group of items */}
      <Show on={P.shown(4)} style={{ position: 'absolute', left: CARD.w + 14, top: CARD.y, width: CARD.w, height: CARD.h }}>
        <div style={{ height: '100%', borderRadius: 14, background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F8FF 100%)', boxShadow: P.lit(4) ? BLUE_RING(true, CARD_RIM) : CARD_RIM, transition: instant ? 'none' : `box-shadow 420ms ${EASE}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px 10px', boxSizing: 'border-box' }}>
          <span style={cardTitle}>Wildcard</span>
          <span style={{ fontFamily: MONO, fontSize: 14, color: colors.brandDark, whiteSpace: 'nowrap', ...NOLIG }}>finance-reports/*</span>
          <div style={{ display: 'flex', gap: 14 }}>
            {[0, 1, 2].map((k) => (
              <Ico3D key={k} name="object" size={26} loop="bob" d={k * 0.45} />
            ))}
          </div>
        </div>
      </Show>
    </Frame>
  )
}

/* ═════════════════════════════════════════ B_T13 · slide 27 · identity-based beside resource-based */

/**
 * A soft drawn background for a panel (user 2026-11-16: "add background images"): low-contrast shapes that say where
 * the panel lives, an office of people behind the identity side, stored buckets and a cloud behind the resource
 * side. Static; the loops stay on the icons.
 */
function SceneBg({ kind, w, h }: { kind: 'identity' | 'resource'; w: number; h: number }) {
  const id = 'sb' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const tint = kind === 'identity' ? ['#F6F8FF', '#E6EEFF'] : ['#F3FBF7', '#E3F2FF']
  const ink = kind === 'identity' ? '#2D63FB' : '#1F9A60'
  const bust = (x: number, y: number, s: number, o: number) => (
    <g key={`${x}${y}`} transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <circle cx={0} cy={-10} r={7} fill={ink} />
      <path d="M -12 10 C -12 0 -6 -2 0 -2 C 6 -2 12 0 12 10 Z" fill={ink} />
    </g>
  )
  const can = (x: number, y: number, s: number, o: number) => (
    <g key={`${x}${y}`} transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <path d="M -12 -12 L -9 12 Q -8.5 14 -6 14 H 6 Q 8.5 14 9 12 L 12 -12 Z" fill={ink} />
      <ellipse cx={0} cy={-12} rx={12} ry={4} fill={ink} />
    </g>
  )
  return (
    <svg aria-hidden width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: 'absolute', inset: 0, borderRadius: 18, display: 'block' }}>
      <defs>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={tint[0]} />
          <stop offset="1" stopColor={tint[1]} />
        </linearGradient>
        <radialGradient id={`${id}l`} cx="0.25" cy="0.15" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={w} height={h} rx={18} fill={`url(#${id}t)`} />
      <path d={`M 0 ${h * 0.72} C ${w * 0.25} ${h * 0.6} ${w * 0.5} ${h * 0.86} ${w} ${h * 0.66} V ${h} H 0 Z`} fill={ink} opacity={0.05} />
      <path d={`M 0 ${h * 0.86} C ${w * 0.3} ${h * 0.76} ${w * 0.6} ${h * 0.98} ${w} ${h * 0.82} V ${h} H 0 Z`} fill={ink} opacity={0.05} />
      {kind === 'identity'
        ? [bust(w - 120, 44, 1.1, 0.07), bust(w - 80, 66, 0.9, 0.06), bust(w - 44, 40, 1.2, 0.07), bust(w - 150, 84, 0.8, 0.05), bust(36, 92, 0.8, 0.05)]
        : [can(w * 0.52, 30, 0.8, 0.05), can(w * 0.6, 86, 0.7, 0.05), can(30, 98, 0.6, 0.05)]}
      {kind === 'resource' && <path d={`M ${w * 0.66} 30 a 10 10 0 0 1 18 -8 a 13 13 0 0 1 24 6 a 9 9 0 0 1 -2 18 H ${w * 0.66} a 8 8 0 0 1 0 -16 Z`} fill={ink} opacity={0.06} />}
      <rect width={w} height={h} rx={18} fill={`url(#${id}l)`} />
    </svg>
  )
}

/** a 3D icon (or an official mark from deck data) for a row card */
function RowIcon({ icon, size = 38, d = 0 }: { icon: string; size?: number; d?: number }) {
  if (icon.startsWith('img:')) return <MarkTile src={icon.slice(4)} size={size} />
  const map: Record<string, [Ico3DName, Badge?]> = { User: ['user'], UserCheck: ['user', 'check'], Building2: ['building'], BadgeCheck: ['check'] }
  const [name, badge] = map[icon] ?? ['doc']
  return <Tile3D name={name} badge={badge} size={size} k={0.82} d={d} loop="bob" />
}

/* Session 13 review (T13, "can we split this"): `part` 1 is the two types side by side without the resource-only
 * details; `part` 2 is the resource side alone, centred, with Principal and the other account; no `part` is the
 * original single slide. The rows come from deck.json in press order, as before.
 * Second review (2026-11-16): part 1 no longer has the "Resource-based: attached…" card; part 2 shows it, unchanged,
 * to the left of the resource picture (a row tagged 'aside'), and the Principal and Account rows sit under the picture. */
function B_T13({ step = 0, rows = [], part = 0 }: { step?: number; rows?: string[][]; part?: 0 | 1 | 2 }) {
  const W = 1040
  const P = useParts(step, part ? 3 : 5)
  const instant = useInstant()
  const COL_W = 500
  const GAP = W - COL_W * 2
  const BOX_H = 112
  const ROW_H = 58
  const ROW_GAP = 8
  const ROW_Y0 = BOX_H + 14
  const left = rows.map((r, i) => ({ r, i })).filter((x) => x.r[2] === 'identity')
  const right = rows.map((r, i) => ({ r, i })).filter((x) => x.r[2] === 'resource')
  const aside = rows.map((r, i) => ({ r, i })).filter((x) => x.r[2] === 'aside')
  const H = part ? ROW_Y0 + Math.max(left.length, right.length) * (ROW_H + ROW_GAP) - ROW_GAP : 320
  /* the press that shows each row: part 1 keeps the resource picture on press 2 between its two identity rows */
  const rowAt = (i: number) => (part === 1 ? [1, 3][i] ?? i + 1 : i + 1)
  const rowLit = (i: number) => P.lit(rowAt(i))
  /* the press that shows (and lights) each part of the picture; 0 = from the start, -1 = not on this slide */
  const at = part === 1 ? { id: 1, res: 2, principal: -1, acc: -1 } : part === 2 ? { id: -1, res: 0, principal: 2, acc: 3 } : { id: 1, res: 2, principal: 3, acc: 4 }
  const has = (k: number) => k >= 0
  const idLit = P.lit(1) || P.lit(part === 1 ? 3 : 5)
  const bucketLit = part === 2 ? P.lit(1) : P.lit(at.res)
  const principalLit = has(at.principal) && P.lit(at.principal)
  const crossLit = has(at.acc) && P.lit(at.acc)
  const RX = COL_W + GAP
  const CY = 48 // the icon row's centre inside each panel
  /* identity panel: user tile → policy page */
  const U = { x: 120, s: 62 }
  const IDP = { x: 236, y: 10, w: 96, h: 92 }
  const GR = { bus: 356, x: 392, s: 32 }
  /* resource panel (x relative to the panel): bucket → policy card ← account */
  const B = { x: 70, s: 60 }
  const BP = { x: 136, y: 12, w: 216, h: 88 }
  const ACC = { x: 444, s: 46 }
  const accLine: Pt[] = [[RX + ACC.x - ACC.s / 2, CY], [RX + BP.x + BP.w, CY]]
  const Row = ({ r, i, x, k, top }: { r: string[]; i: number; x: number; k: number; top?: number }) => (
    <Show on={P.shown(rowAt(i))} style={{ position: 'absolute', left: x, top: top ?? ROW_Y0 + k * (ROW_H + ROW_GAP), width: COL_W }}>
      <div style={{ height: ROW_H, borderRadius: 14, background: '#FFFFFF', boxShadow: rowLit(i) ? BLUE_RING(true, CARD_RIM) : CARD_RIM, transition: instant ? 'none' : `box-shadow 420ms ${EASE}`, display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px', boxSizing: 'border-box' }}>
        <RowIcon icon={r[1]} size={40} d={i * 0.6} />
        <span style={{ fontFamily: FONT, fontSize: 16, lineHeight: 1.28, color: colors.ink }}>{r[0]}</span>
      </div>
    </Show>
  )
  const panelRing = (lit: boolean) => (lit ? BLUE_RING(true, `inset 0 0 0 1px ${colors.brand}30`) : `inset 0 0 0 1px ${colors.brand}30`)
  return (
    <Frame w={W} h={H}>
      {/* identity side: a user carrying its policy (a group and a role could carry one too) */}
      {has(at.id) && <Show on={P.shown(1)} style={{ position: 'absolute', left: 0, top: 0, width: COL_W, height: BOX_H }}>
        <div style={{ position: 'relative', height: '100%', borderRadius: 18 }}>
          <SceneBg kind="identity" w={COL_W} h={BOX_H} />
          <span aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: 18, boxShadow: panelRing(idLit), transition: instant ? 'none' : `box-shadow 420ms ${EASE}`, pointerEvents: 'none' }} />
          {/* a group or a role can carry the same policy: dashed branches to them (the TR's "user, group or role") */}
          {([['users', 'Group', CY - 21], ['idcard', 'Role', CY + 21]] as [Ico3DName, string, number][]).map(([n, tag, y], k) => (
            <div key={tag}>
              <Elbow pts={[[IDP.x + IDP.w, CY], [GR.bus, CY], [GR.bus, y], [GR.x - GR.s / 2, y]]} on={P.shown(1)} head={0} width={2.5} color={`${colors.brand}88`} delay={500 + k * 120} />
              <At x={GR.x} y={y}>
                <Tile3D name={n} size={GR.s} k={0.8} loop="bob" d={0.5 + k * 0.6} />
              </At>
              <div style={{ position: 'absolute', left: GR.x + GR.s / 2 + 8, top: y - 9, ...tagStyle(13.5), textAlign: 'left' }}>{tag}</div>
            </div>
          ))}
          <At x={U.x} y={CY}>
            <Tile3D name="user" size={U.s} k={0.82} loop="bob" />
          </At>
          <At x={U.x} y={BOX_H - 13}>
            <span style={tagStyle(14)}>Identity-Based</span>
          </At>
          <Elbow pts={[[U.x + U.s / 2, CY], [IDP.x, CY]]} on={P.shown(1)} head={0} color={`${colors.brand}aa`} delay={200} />
          <span aria-hidden className={lc('pulse')} style={{ position: 'absolute', left: U.x + U.s / 2 - 4, top: CY - 4, width: 8, height: 8, borderRadius: 99, background: colors.brand, ...lv(0, 2.2) }} />
          <span aria-hidden className={lc('pulse')} style={{ position: 'absolute', left: IDP.x - 4, top: CY - 4, width: 8, height: 8, borderRadius: 99, background: colors.brand, zIndex: 3, ...lv(1.1, 2.2) }} />
          <div style={{ position: 'absolute', left: IDP.x, top: IDP.y }}>
            <PolicyPage3D w={IDP.w} h={IDP.h} mark={40} d={0.4} />
          </div>
        </div>
      </Show>}
      {/* resource side: a bucket holding its policy, Principal named, another account's arrow on this side only */}
      <Show on={P.shown(at.res)} style={{ position: 'absolute', left: RX, top: 0, width: COL_W, height: BOX_H }}>
        <div style={{ position: 'relative', height: '100%', borderRadius: 18 }}>
          <SceneBg kind="resource" w={COL_W} h={BOX_H} />
          <span aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: 18, boxShadow: panelRing(bucketLit), transition: instant ? 'none' : `box-shadow 420ms ${EASE}`, pointerEvents: 'none' }} />
          <At x={B.x} y={CY}>
            <MarkTile src={resBucket} size={B.s} k={0.7} />
          </At>
          <At x={B.x} y={BOX_H - 13}>
            <span style={tagStyle(14)}>Resource-Based</span>
          </At>
          <Elbow pts={[[B.x + B.s / 2, CY], [BP.x, CY]]} on={P.shown(at.res)} head={0} color={`${colors.brand}aa`} delay={200} />
          <span aria-hidden className={lc('pulse')} style={{ position: 'absolute', left: B.x + B.s / 2 - 4, top: CY - 4, width: 8, height: 8, borderRadius: 99, background: colors.brand, ...lv(0.6, 2.2) }} />
          <div style={{ position: 'absolute', left: BP.x, top: BP.y, width: BP.w, height: BP.h, borderRadius: 14, background: 'linear-gradient(180deg, #FFFFFF 0%, #F4F7FE 100%)', boxShadow: CARD_RIM, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', boxSizing: 'border-box' }}>
            <Ico3D name="policy" size={42} loop="tilt" t={3.6} d={0.8} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              <span style={{ display: 'block', height: 6, width: '82%', borderRadius: 4, background: '#D9E2F3' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8, padding: '3px 6px', background: principalLit ? '#DDE7FF' : '#F2F5FC', boxShadow: principalLit ? BLUE_RING(true) : 'none', opacity: has(at.principal) && P.shown(at.principal) ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE}, box-shadow 420ms ${EASE}` }}>
                <Ico3D name="user" badge="check" size={22} loop="bob" />
                <span style={{ ...tagStyle(13, colors.brandDark), textAlign: 'left' }}>Principal</span>
              </div>
              <span style={{ display: 'block', height: 6, width: '64%', borderRadius: 4, background: '#D9E2F3' }} />
            </div>
          </div>
        </div>
      </Show>
      {/* another AWS account, granted from the resource side */}
      {has(at.acc) && <Show on={P.shown(at.acc)} style={{ position: 'absolute', left: RX + ACC.x - 34, top: 0, width: 68, height: BOX_H, zIndex: 4 }}>
        <div style={{ position: 'relative', height: '100%' }}>
          <At x={34} y={CY}>
            <Tile3D name="building" size={ACC.s} k={0.82} loop="bob" d={0.3} ring={crossLit ? BLUE_RING(true, 'inset 0 0 0 1.5px #D3DEF6') : undefined} />
          </At>
          <At x={34} y={BOX_H - 13}>
            <span style={tagStyle(14)}>Account</span>
          </At>
        </div>
      </Show>}
      {has(at.acc) && <Elbow pts={accLine} on={P.shown(at.acc)} delay={200} z={5} />}
      {has(at.acc) && <Ride pts={accLine} on={P.done} period={2.4} z={6} />}
      {left.map((x, k) => <Row key={x.i} r={x.r} i={x.i} x={0} k={k} />)}
      {right.map((x, k) => <Row key={x.i} r={x.r} i={x.i} x={RX} k={k} />)}
      {aside.map((x) => <Row key={x.i} r={x.r} i={x.i} x={0} k={0} top={(BOX_H - ROW_H) / 2} />)}
    </Frame>
  )
}

/* ═════════════════════════════════════════ B_T14 · slide 29 · the comparison table beside the small two-box picture */

/** one of the two small right-hand scenes: the owner (a user / a bucket) joined end to end to its policy sheet */
function MiniSide({ kind, d = 0 }: { kind: 'identity' | 'resource'; d?: number }) {
  const PW = 204
  const PH = 92
  const I = { x: 44, s: 50 }
  const PG = { x: 118, y: 12, w: 70, h: 68 }
  const cy = PH / 2
  const link: Pt[] = [[I.x + I.s / 2, cy], [PG.x, cy]]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: PW, height: PH, borderRadius: 18 }}>
        <SceneBg kind={kind} w={PW} h={PH} />
        <span aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: 18, boxShadow: `inset 0 0 0 1px ${colors.brand}30`, pointerEvents: 'none' }} />
        <At x={I.x} y={cy}>
          {kind === 'identity' ? <Tile3D name="user" size={I.s} k={0.82} loop="bob" d={d} /> : <MarkTile src={resBucket} size={I.s} k={0.7} />}
        </At>
        <Elbow pts={link} head={0} color={`${colors.brand}aa`} />
        <Ride pts={link} period={2.6} phase={d} size={8} />
        <div style={{ position: 'absolute', left: PG.x, top: PG.y }}>
          <PolicyPage3D w={PG.w} h={PG.h} mark={32} d={d + 0.4} />
        </div>
      </div>
      <span style={tagStyle(14)}>{kind === 'identity' ? 'Identity-Based' : 'Resource-Based'}</span>
    </div>
  )
}

function B_T14({ step = 0, head = [], rows = [], note = '' }: { step?: number; head?: string[]; rows?: string[][]; note?: string }) {
  const W = 1040
  const H = 300
  const held = useHeld()
  const shown = held ? rows.length : step
  const HEAD: ReactNode[] = [
    <span key="l" className="b13-ti"><Ico3D name="list" size={24} loop="none" /></span>,
    <span key="u" className="b13-ti"><Ico3D name="user" size={24} loop="none" /></span>,
    <img key="b" src={resBucket} alt="" aria-hidden style={{ width: 18, height: 'auto', display: 'block' }} />,
  ]
  const TABLE_W = 808
  return (
    <Frame w={W} h={H}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 7 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ width: TABLE_W, flexShrink: 0 }}>
            <VisualTable
              size={15}
              compact
              shown={shown}
              columns={head.map((label, i) => ({ label, weight: [0.92, 0.9, 1.3][i] ?? 1, icon: HEAD[i] }))}
              rows={rows.map((r) => ({ icon: <span className="b13-ti b13-tr"><Ico3D name={ROW3D[r[3]] ?? 'doc'} size={26} loop="none" /></span>, cells: [r[0], r[1], r[2]] }))}
            />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <MiniSide kind="identity" />
            <MiniSide kind="resource" d={1.2} />
          </div>
        </div>
        {note && (
          <NoteBox w="100%" tone={colors.brand} size={15}>
            {note}
          </NoteBox>
        )}
      </div>
    </Frame>
  )
}

export const figures: Record<string, Fig> = {
  B_T10: B_T10 as Fig,
  B_T10B: B_T10B as Fig,
  B_T11: B_T11 as Fig,
  B_T11B: B_T11B as Fig,
  B_T12: B_T12 as Fig,
  B_T13: B_T13 as Fig,
  B_T14: B_T14 as Fig,
}

export const css = `
.b13 { animation-delay: var(--b13-d, 0s); }
@keyframes b13-float { 0%, 100% { transform: translateY(0) scale(1) } 50% { transform: translateY(-2.5px) scale(1.06) } }
.b13-float { animation: b13-float var(--b13-t, 3.6s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes b13-bob { 0%, 100% { transform: translateY(-2px) } 50% { transform: translateY(2px) } }
.b13-bob { animation: b13-bob var(--b13-t, 2.4s) ease-in-out infinite; }
@keyframes b13-pulse { 0%, 100% { transform: scale(0.94) } 50% { transform: scale(1.08) } }
.b13-pulse { animation: b13-pulse var(--b13-t, 1.8s) ease-in-out infinite; }
.b13-pulse { transform-origin: center; }
.b13-ti svg { width: 24px !important; height: 24px !important; display: block; }
.b13-tr svg { width: 26px !important; height: 26px !important; }
@keyframes b13-halo { 0%, 100% { opacity: 0.35; transform: scale(0.985) } 50% { opacity: 1; transform: scale(1.02) } }
.b13-halo { animation: b13-halo var(--b13-t, 2.6s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes b13-sweep { 0% { transform: translateX(-180px) } 60%, 100% { transform: translateX(820px) } }
.b13-sweep { animation: b13-sweep var(--b13-t, 7s) cubic-bezier(0.45,0,0.55,1) infinite; }
.cc-still .b13, .deck-thumb .b13 { animation: none !important; }
.cc-still .b13-halo, .deck-thumb .b13-halo, .cc-still .b13-sweep, .deck-thumb .b13-sweep, .cc-still .b13ride, .deck-thumb .b13ride { display: none !important; }
@media (prefers-reduced-motion: reduce) { .b13ride, .b13-sweep { display: none !important; } }
@media (prefers-reduced-motion: reduce) { .b13 { animation: none !important; } }
`
