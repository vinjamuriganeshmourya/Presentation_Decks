import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { MOTION, motionHeld } from '@/motion/tokens'
import { TILE_SKIN } from '@/decks/figures/card'
import { litRing } from '@/decks/figures/net/frames'
import { Icon } from '@/engine/icon'
import s3Bucket from '../images/res-s3-bucket.svg'
import { Ico3D, Tile3D, type Ico3DName } from './icons3d'

/*
 * BUILDER C · IAM Fundamentals (Session 13), section 4 Policy Evaluation Logic:
 *   slide 31 C_T15 (the evaluation flowchart, deny branch orange), 32 C_T16 (padlocks that open only for an Allow),
 *   34 C_T17 (allow + deny converge into one Denied), 36 C_T18B (the combined trace: A allows, B's condition fails),
 *   37 C_T19 (identity and resource circles merging, an orange deny slice through them).
 *
 * Built to Sessions 9-12 as reviewed (standing corrections 1-16, cloud R10-R13): icon-first, one Title Case tag per
 * untagged icon, no chips, badges or connector labels; official marks on still white tiles; every glyph carries a
 * quiet loop after its build; the lit item follows the build, then walks first → last → first forever and is gone on
 * held frames; straight arrows computed from each figure's constants; equal padding; nothing overlapping. The TR's red
 * (deny branch, deny slice) is the template orange (rule 51), the slide's one highlight meaning: deny.
 * `step` 0 = nothing pressed, n = whole. On `?still`, thumbnails and reduced motion: everything shown, nothing lit,
 * nothing moving. Moving tokens are CSS keyframes on HTML spans (transform / opacity only, compositor), never a
 * per-frame React state. Classes are prefixed `c13-`.
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const EASE = MOTION.ease
const useHeld = () => motionHeld(useInstant())
const FONT = "'DM Sans', system-ui, sans-serif"
const MONO = "'Fira Code', ui-monospace, monospace"
const GREY = '#8792A8'
const ORANGE = colors.accent
const SOFT = 'linear-gradient(180deg, #EEF3FF 0%, #DDE7FF 100%)'

/* ------------------------------------------------------------------ loop vocabulary */

const lc = (kind: string) => `c13 c13-${kind}`
const lv = (d = 0, t?: number): CSSProperties =>
  ({ ['--c13-d' as string]: `${-d}s`, ...(t ? { ['--c13-t' as string]: `${t}s` } : {}) }) as CSSProperties

/** an index walking 0 → n-1 → 0 forever once the build is done; -1 on held frames (R13) */
function useCycle(n: number, done: boolean, periodMs = 1600) {
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
/**
 * A token riding the polyline `pts` during [t0, t1] of a `period`-second loop, timed by segment length, fading in at the
 * start and out at the end. Returns the class name; the keyframes go into this file's css.
 */
function ride(name: string, pts: [number, number][], t0: number, t1: number, period: number) {
  const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]))
  const total = lens.reduce((a, b) => a + b, 0)
  const at = (k: number) => ((t0 + ((t1 - t0) * lens.slice(0, k).reduce((a, b) => a + b, 0)) / total) / period) * 100
  const tr = (p: [number, number]) => `translate(${p[0]}px, ${p[1]}px)`
  const lines = [`0%, ${pct((t0 / period) * 100)} { transform: ${tr(pts[0])} scale(0.6); opacity: 0 }`]
  lines.push(`${pct((t0 / period) * 100 + 2)} { opacity: 1 }`)
  pts.forEach((p, k) => k > 0 && lines.push(`${pct(at(k))} { transform: ${tr(p)} scale(1)${k === pts.length - 1 ? '; opacity: 1' : ''} }`))
  lines.push(`${pct((t1 / period) * 100 + 3)} { transform: ${tr(pts[pts.length - 1])} scale(0.7); opacity: 0 }`)
  lines.push(`100% { transform: ${tr(pts[pts.length - 1])} scale(0.7); opacity: 0 }`)
  KF.push(`@keyframes c13-${name} { ${lines.join(' ')} }\n.c13-${name} { animation: c13-${name} ${period}s ease-in-out infinite; }`)
  return `c13-${name}`
}
/** a "stopped here" pop during [a, a+d] of a loop */
function pop(name: string, a: number, d: number, period: number) {
  const p0 = (a / period) * 100
  const p1 = ((a + d) / period) * 100
  KF.push(
    `@keyframes c13-${name} { 0%, ${pct(p0)} { transform: scale(0.5); opacity: 0 } ${pct(p0 + 3)} { transform: scale(1.12); opacity: 1 } ${pct(p1 - 4)} { transform: scale(1); opacity: 1 } ${pct(p1)}, 100% { transform: scale(0.8); opacity: 0 } }\n.c13-${name} { animation: c13-${name} ${period}s ease-out infinite; }`,
  )
  return `c13-${name}`
}

/** a dot carried by a keyframe class; drawn from the frame's (0,0), so the class's translate places it */
function Token({ cls, tone = colors.brand, size = 13, icon, z = 1 }: { cls: string; tone?: string; size?: number; icon?: string; z?: number }) {
  const held = useHeld()
  if (held) return null
  return (
    <span aria-hidden style={{ position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, zIndex: z, pointerEvents: 'none' }}>
      <span className={cls} style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: tone, color: colors.white, boxShadow: `0 0 0 4px ${tone}2e, 0 6px 12px -6px ${tone}`, opacity: 0 }}>
        {icon && <Icon name={icon} size={Math.round(size * 0.6)} />}
      </span>
    </span>
  )
}

/* ------------------------------------------------------------------ type and pieces */

const label = (size = 15, color: string = colors.ink): CSSProperties => ({ fontFamily: FONT, fontWeight: 700, fontSize: size, lineHeight: 1.2, color, whiteSpace: 'nowrap' })
const tagS = (size = 13, color: string = colors.brandDeep): CSSProperties => ({ fontFamily: FONT, fontWeight: 600, fontSize: size, lineHeight: 1.15, color, whiteSpace: 'nowrap', textAlign: 'center' })
const mono = (size = 14, color: string = colors.ink): CSSProperties => ({ fontFamily: MONO, fontVariantLigatures: 'none', fontWeight: 500, fontSize: size, lineHeight: 1.25, color, whiteSpace: 'nowrap' })

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

/** the figure's own w x h box, centred in the stage */
const Frame = ({ w, h, children }: { w: number; h: number; children: ReactNode }) => (
  <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
    <div style={{ position: 'relative', width: w, height: h }}>{children}</div>
  </div>
)

/** an official mark on its white tile (rule 54); the mark never moves */
function MarkTile({ src, size = 44, scale = 0.74 }: { src: string; size?: number; scale?: number }) {
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: Math.round(size * 0.26), ...TILE_SKIN, flexShrink: 0 }}>
      <img src={src} alt="" aria-hidden draggable={false} style={{ width: Math.round(size * scale), height: Math.round(size * scale), objectFit: 'contain', display: 'block' }} />
    </span>
  )
}

/** a lucide glyph on a tile; `loop` moves the glyph only */
function Glyph({ icon, size = 44, tone = colors.brand, loop = 'breathe', d = 0, t, lit = false }: { icon: string; size?: number; tone?: string; loop?: string | null; d?: number; t?: number; lit?: boolean }) {
  const instant = useInstant()
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: Math.round(size * 0.27), ...TILE_SKIN, boxShadow: litRing(lit, TILE_SKIN.boxShadow as string), transition: instant ? 'none' : `box-shadow 420ms ${EASE}`, color: tone, flexShrink: 0 }}>
      <span className={loop ? lc(loop) : undefined} style={{ display: 'grid', placeItems: 'center', ...lv(d, t) }}>
        <Icon name={icon} size={Math.round(size * 0.5)} />
      </span>
    </span>
  )
}

/** a white card at (x, y) that rings orange while it is the part being explained */
function Panel({ x, y, w, h, lit = false, on = true, radius = 14, children, delay = 0, tint, edge, z = 2, dashed = false }: { x: number; y: number; w: number; h: number; lit?: boolean; on?: boolean; radius?: number; children?: ReactNode; delay?: number; tint?: string; edge?: string; z?: number; dashed?: boolean }) {
  const instant = useInstant()
  const base = edge ? `inset 0 0 0 1.5px ${edge}, 0 12px 24px -16px rgba(31,64,140,0.34)` : (TILE_SKIN.boxShadow as string)
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x, top: y, width: w, height: h, zIndex: z }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: radius, ...TILE_SKIN, ...(tint ? { background: tint } : {}), ...(dashed ? { border: `1.5px dashed ${GREY}`, background: '#F7F9FC' } : {}), boxShadow: dashed ? 'none' : litRing(lit, base), transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }} />
      <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
    </Show>
  )
}

/** a tag that crossfades between two words */
function SwapTag({ a, b, alt, style }: { a: string; b: string; alt: boolean; style?: CSSProperties }) {
  const instant = useInstant()
  const tr = instant ? 'none' : `opacity 420ms ${EASE}`
  return (
    <div style={{ display: 'grid', placeItems: 'center', ...style }}>
      <span style={{ gridArea: '1 / 1', ...tagS(), opacity: alt ? 0 : 1, transition: tr }}>{a}</span>
      <span style={{ gridArea: '1 / 1', ...tagS(), opacity: alt ? 1 : 0, transition: tr }}>{b}</span>
    </div>
  )
}

/* ================================================================== correction round 2026-11-16 · shared pieces for 31-36
 * Every connector is ORTHOGONAL (90-degree elbows, small rounded corners) computed from the same constants as the
 * boxes, its tip exactly on the target edge (user, G5). Icons are the deck's 3D set (./icons3d). Each frame is the
 * stage's own size with an equal padding P on all four sides (user, G1). */

const TILE3D_BASE = 'inset 0 0 0 1.5px #D3DEF6, 0 10px 20px -12px rgba(31,64,140,0.5)'
type Pt = [number, number]

/** an orthogonal connector through `pts`, rounded corners, a head landing exactly on the last point; draws itself */
function Elbow({ pts, on = true, color = colors.brand, width = 2.5, head = 9, delay = 0, dashed = false, z = 1, r = 7 }: { pts: Pt[]; on?: boolean; color?: string; width?: number; head?: number; delay?: number; dashed?: boolean; z?: number; r?: number }) {
  const instant = useInstant()
  const n = pts.length
  const [ax, ay] = pts[n - 2]
  const [bx, by] = pts[n - 1]
  const L = Math.hypot(bx - ax, by - ay) || 1
  const ux = (bx - ax) / L
  const uy = (by - ay) / L
  const end: Pt = head ? [bx - ux * head * 0.85, by - uy * head * 0.85] : [bx, by]
  const line: Pt[] = [...pts.slice(0, -1), end]
  let d = `M ${line[0][0]} ${line[0][1]}`
  for (let i = 1; i < line.length; i++) {
    const [x, y] = line[i]
    if (i < line.length - 1) {
      const [px, py] = line[i - 1]
      const [nx, ny] = line[i + 1]
      const li = Math.hypot(x - px, y - py) || 1
      const lo = Math.hypot(nx - x, ny - y) || 1
      const k = Math.min(r, li / 2, lo / 2)
      d += ` L ${x - ((x - px) / li) * k} ${y - ((y - py) / li) * k} Q ${x} ${y} ${x + ((nx - x) / lo) * k} ${y + ((ny - y) / lo) * k}`
    } else d += ` L ${x} ${y}`
  }
  const total = line.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - line[i][0], p[1] - line[i][1]), 0) + 2
  const tip = `${bx},${by} ${bx - ux * head - uy * head * 0.55},${by - uy * head + ux * head * 0.55} ${bx - ux * head + uy * head * 0.55},${by - uy * head - ux * head * 0.55}`
  return (
    <svg aria-hidden style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', zIndex: z }} width={1} height={1}>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dashed ? '5 6' : total}
        strokeDashoffset={dashed ? 0 : on ? 0 : total}
        style={{ opacity: dashed && !on ? 0 : 1, transition: instant ? 'none' : dashed ? `opacity 520ms ${EASE} ${on ? delay : 0}ms` : `stroke-dashoffset 860ms ${EASE} ${on ? delay : 0}ms` }}
      />
      {head > 0 && <polygon points={tip} fill={color} style={{ opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 300ms ${EASE} ${on ? delay + 700 : 0}ms` }} />}
    </svg>
  )
}

/** a bus junction: a small filled dot where branches meet */
const Junction = ({ x, y, on = true, color = colors.brand, r = 4 }: { x: number; y: number; on?: boolean; color?: string; r?: number }) => (
  <Show on={on} lift={0} style={{ position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: 99, background: color, boxShadow: `0 0 0 3px #FFFFFF`, zIndex: 2 }}>
    {null}
  </Show>
)

/** a 3D tile that crossfades between two 3D icons (a lock that opens) */
function Swap3D({ a, b, alt, size = 56, lit = false, k = 0.74, d = 0 }: { a: Ico3DName; b: Ico3DName; alt: boolean; size?: number; lit?: boolean; k?: number; d?: number }) {
  const instant = useInstant()
  const tr = instant ? 'none' : `opacity 460ms ${EASE}, transform 460ms ${EASE}`
  const s = Math.round(size * k)
  return (
    <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: Math.round(size * 0.28), background: 'linear-gradient(180deg, #FFFFFF 0%, #EEF3FF 100%)', boxShadow: litRing(lit, TILE3D_BASE), transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
      <span className="i3d i3d-bob" style={{ display: 'grid', placeItems: 'center', ['--i3d-d' as string]: `${-d}s` } as CSSProperties}>
        <span style={{ gridArea: '1 / 1', opacity: alt ? 0 : 1, transform: alt ? 'scale(0.8)' : 'none', transition: tr, display: 'grid' }}>
          <Ico3D name={a} size={s} loop="none" />
        </span>
        <span style={{ gridArea: '1 / 1', opacity: alt ? 1 : 0, transform: alt ? 'none' : 'scale(0.8)', transition: tr, display: 'grid' }}>
          <Ico3D name={b} size={s} loop="none" />
        </span>
      </span>
    </span>
  )
}

/** a 3D "stopped here" pop at (x, y), carried by a `pop` class */
function Stop3D({ x, y, cls, size = 30 }: { x: number; y: number; cls: string; size?: number }) {
  const held = useHeld()
  if (held) return null
  return (
    <span aria-hidden style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: 6, pointerEvents: 'none' }}>
      <span className={cls} style={{ display: 'grid', placeItems: 'center', width: size, height: size, opacity: 0 }}>
        <Ico3D name="ban" size={size} loop="none" />
      </span>
    </span>
  )
}

/** one row inside a flow box: a 3D icon and its label */
const Row3D = ({ icon, text, size = 15, iconSize = 26, ink = colors.ink, loop = 'bob', d = 0 }: { icon: Ico3DName; text: string; size?: number; iconSize?: number; ink?: string; loop?: 'bob' | 'pulse' | 'tilt' | 'glint' | 'beat' | 'float' | 'swing'; d?: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, height: '100%', padding: '0 12px' }}>
    <Ico3D name={icon} size={iconSize} loop={loop} d={d} />
    <span style={label(size, ink)}>{text}</span>
  </div>
)

/* ================================================================== C_T15 · the evaluation flowchart (slide 31) */

/* stage 634 x 300, padding 20 all round */
const F15 = { W: 634, H: 300, P: 20, PX: 30, MX: 176, MW: 210, BH: 36, GAP: 20, DW: 150, PS: 44, BUS: 128 }
const f15y = (i: number) => F15.P + i * (F15.BH + F15.GAP)
const f15cy = (i: number) => f15y(i) + F15.BH / 2
const F15CX = F15.MX + F15.MW / 2
const F15_DX = F15.W - F15.P - F15.DW
const F15_BOX: [string, Ico3DName][] = [
  ['Start', 'play'],
  ['Default Deny', 'lock'],
  ['Explicit Deny', 'cross'],
  ['Explicit Allow', 'check'],
  ['Allowed \u2705', 'gavel'],
]
/* which press shows each box, and which press lights it */
const F15_ON = [1, 2, 3, 4, 4]
const F15_PERIOD = 6.4
const F15_POL = [72, 134, 196]
const F15_PR = F15.PX + F15.PS // policies' right edge
const F15_MERGE = ride('t15-merge', [[F15_PR + 6, F15_POL[1]], [F15.BUS, F15_POL[1]], [F15.BUS, f15cy(0)], [F15.MX - 8, f15cy(0)]], 0.2, 2.2, F15_PERIOD)
const F15_DENY = ride('t15-deny', [[F15.MX + F15.MW + 8, f15cy(2)], [F15_DX - 8, f15cy(2)]], 3.2, 4.6, F15_PERIOD)
const F15_DENY_HIT = pop('t15-deny-hit', 4.6, 1.2, F15_PERIOD)

const C_T15: Fig = (p) => {
  const step = Number(p.step ?? 0)
  const held = useHeld()
  const on = (k: number) => held || step >= k
  const hot = useHot(4, step)
  const litBox = (i: number) => hot >= 0 && Math.min(i, 3) === hot && !(i === 4 && hot !== 3)
  const done = !held && step >= 4
  const denyTop = f15y(2)
  const denyH = f15y(3) + F15.BH - denyTop
  const blue = `${colors.brand}88`
  return (
    <Frame w={F15.W} h={F15.H}>
      {/* three policies, merged on one bus into Start */}
      {F15_POL.map((cy, k) => (
        <Show key={k} on={on(1)} delay={k * 130} style={{ position: 'absolute', left: F15.PX, top: cy - F15.PS / 2, zIndex: 2 }}>
          <Tile3D name="policy" size={F15.PS} k={0.8} loop="bob" d={k * 0.6} ring={litRing(hot === 0, TILE3D_BASE)} />
        </Show>
      ))}
      <Show on={on(1)} delay={300} style={{ position: 'absolute', left: F15.PX - 16, top: F15_POL[2] + F15.PS / 2 + 8, width: F15.PS + 32 }}>
        <div style={tagS()}>Policies</div>
      </Show>
      {[0, 1].map((k) => (
        <Elbow key={k} pts={[[F15_PR, F15_POL[k]], [F15.BUS, F15_POL[k]]]} on={on(1)} delay={150 + k * 120} color={blue} width={2.2} head={0} />
      ))}
      <Elbow pts={[[F15_PR, F15_POL[2]], [F15.BUS, F15_POL[2]], [F15.BUS, f15cy(0)], [F15.MX, f15cy(0)]]} on={on(1)} delay={300} color={blue} width={2.2} head={8} />
      {[0, 1].map((k) => <Junction key={k} x={F15.BUS} y={F15_POL[k]} on={on(1)} color={colors.brand} r={3.5} />)}

      {/* the main column */}
      {F15_BOX.map(([text, icon], i) => (
        <Panel key={text} x={F15.MX} y={f15y(i)} w={F15.MW} h={F15.BH} on={on(F15_ON[i])} delay={i === 4 ? 260 : 0} lit={litBox(i)} radius={12} z={3} edge={i === 2 ? `${ORANGE}66` : undefined}>
          <Row3D icon={icon} text={text} d={i * 0.45} loop={i === 2 ? 'pulse' : i === 4 ? 'swing' : 'bob'} />
        </Panel>
      ))}
      {[0, 1, 2, 3].map((i) => (
        <Elbow key={`d${i}`} pts={[[F15CX, f15y(i) + F15.BH], [F15CX, f15y(i + 1)]]} on={on(F15_ON[i + 1])} head={7} width={2.2} />
      ))}

      {/* the deny branch, orange (the TR's red, rule 51), and the no-allow fall-through, grey dashed */}
      <Elbow pts={[[F15.MX + F15.MW, f15cy(2)], [F15_DX, f15cy(2)]]} on={on(3)} color={ORANGE} width={2.6} />
      <Elbow pts={[[F15.MX + F15.MW, f15cy(3)], [F15_DX, f15cy(3)]]} on={on(4)} color={GREY} width={2} dashed />
      {/* the two ways out of Explicit Allow, named (Session 13 review, T15) */}
      <Show on={on(4)} delay={200} style={{ position: 'absolute', left: F15.MX + F15.MW, top: f15cy(3) - 34, width: F15_DX - F15.MX - F15.MW, zIndex: 4 }}>
        <div style={{ ...tagS(12.5, '#6B7891'), whiteSpace: 'normal', lineHeight: 1.1 }}>No allow found</div>
      </Show>
      <Show on={on(4)} delay={360} lift={0} style={{ position: 'absolute', left: F15CX + 8, top: f15y(3) + F15.BH + 3, zIndex: 4 }}>
        <div style={{ ...tagS(12.5, colors.brandDeep), textAlign: 'left' }}>Allow found</div>
      </Show>
      <Panel x={F15_DX} y={denyTop} w={F15.DW} h={denyH} on={on(3)} delay={300} lit={hot === 2} edge={`${ORANGE}99`} radius={14} z={3} tint="linear-gradient(180deg, #FFFFFF 0%, #FFF3EA 100%)">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, height: '100%' }}>
          <Ico3D name="cross" size={40} loop="pulse" t={2.2} />
          <span style={label(15)}>Denied</span>
        </div>
      </Panel>

      {/* after the build: policies merge into Start, then an explicit deny sends a request to Denied */}
      {done && <Token cls={F15_MERGE} z={2} />}
      {done && <Token cls={F15_DENY} tone={ORANGE} z={4} />}
      {done && (
        <span aria-hidden style={{ position: 'absolute', left: F15_DX - 10, top: denyTop - 10, width: F15.DW + 20, height: denyH + 20, zIndex: 2, pointerEvents: 'none' }}>
          <span className={F15_DENY_HIT} style={{ display: 'block', width: '100%', height: '100%', borderRadius: 22, background: `radial-gradient(closest-side, ${ORANGE}33, ${ORANGE}00)`, opacity: 0 }} />
        </span>
      )}
    </Frame>
  )
}

/* ================================================================== C_T16 · padlocks that open only for an Allow (slide 32) */

/* stage 496 x 300, padding 20 all round */
const F16 = { W: 496, H: 300, P: 20, RS: 52, LX: 192, LS: 58, LA: 128, LB: 228, BS: 64, CW: 150, CH: 46, ELB: 330 }
const F16_RR = F16.P + F16.RS // request tiles' right edge
const F16_LC = F16.LX + F16.LS / 2
const F16_BX = F16.W - F16.P - F16.BS
const F16_BY = (F16.LA + F16.LB) / 2
const F16_PERIOD = 4.8
const F16_READ1 = ride('t16-read1', [[F16_RR + 8, F16.LA], [F16.LX - 10, F16.LA]], 0.2, 1.2, F16_PERIOD)
const F16_READ2 = ride('t16-read2', [[F16.LX + F16.LS + 8, F16.LA], [F16.ELB, F16.LA], [F16.ELB, F16_BY], [F16_BX - 8, F16_BY]], 1.5, 3.1, F16_PERIOD)
const F16_DEL = ride('t16-del', [[F16_RR + 8, F16.LB], [F16.LX - 10, F16.LB]], 1.0, 2.2, F16_PERIOD)
const F16_DEL_STOP = pop('t16-del-stop', 2.2, 1.4, F16_PERIOD)
const F16_EARLY_A = ride('t16-early-a', [[F16_RR + 8, F16.LA], [F16.LX - 10, F16.LA]], 0.2, 1.4, F16_PERIOD)
const F16_EARLY_A_STOP = pop('t16-early-a-stop', 1.4, 1.4, F16_PERIOD)

const C_T16: Fig = (p) => {
  const step = Number(p.step ?? 0)
  const held = useHeld()
  const on = (k: number) => held || step >= k
  const hot = useHot(3, step)
  const open = held || step >= 2
  const done = !held && step >= 3
  const lane = (y: number, icon: Ico3DName, tag: string, d: number) => (
    <>
      <Show on={on(1)} style={{ position: 'absolute', left: F16.P, top: y - F16.RS / 2, zIndex: 2 }}>
        <Tile3D name={icon} size={F16.RS} k={0.74} loop="bob" d={d} ring={litRing(hot === 0, TILE3D_BASE)} />
      </Show>
      <Show on={on(1)} style={{ position: 'absolute', left: F16.P - 20, top: y + F16.RS / 2 + 6, width: F16.RS + 40 }}>
        <div style={tagS()}>{tag}</div>
      </Show>
      <Elbow pts={[[F16_RR, y], [F16.LX, y]]} on={on(1)} delay={200} color={`${colors.brand}88`} width={2.2} />
    </>
  )
  return (
    <Frame w={F16.W} h={F16.H}>
      {lane(F16.LA, 'eye', 'Read', 0)}
      {lane(F16.LB, 'trash', 'Delete', 0.7)}

      {/* the Allow statement, above the lock it opens */}
      <Panel x={F16_LC - F16.CW / 2} y={F16.P} w={F16.CW} h={F16.CH} on={on(2)} lit={hot === 1} radius={12} z={3} edge={`${colors.success}66`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: '100%' }}>
          <Ico3D name="policy" size={26} loop="bob" t={2.8} />
          <span style={label(15)}>Allow</span>
          <Ico3D name="eye" size={24} loop="pulse" t={2.6} />
        </div>
      </Panel>
      <Elbow pts={[[F16_LC, F16.P + F16.CH], [F16_LC, F16.LA - F16.LS / 2]]} on={on(2)} delay={250} color={colors.success} width={2.4} head={7} />

      {/* the two locks */}
      <Show on={on(1)} style={{ position: 'absolute', left: F16.LX, top: F16.LA - F16.LS / 2, zIndex: 3 }}>
        <Swap3D a="lock" b="unlock" alt={open} size={F16.LS} lit={hot === 0 || hot === 1} />
      </Show>
      <Show on={on(1)} style={{ position: 'absolute', left: F16.LX - 26, top: F16.LA + F16.LS / 2 + 6, width: F16.LS + 52 }}>
        <SwapTag a="Denied" b="Allowed" alt={open} />
      </Show>
      <Show on={on(1)} style={{ position: 'absolute', left: F16.LX, top: F16.LB - F16.LS / 2, zIndex: 3 }}>
        <Swap3D a="lock" b="lock" alt={false} size={F16.LS} lit={hot === 0 || hot === 2} d={0.8} />
      </Show>
      <Show on={on(1)} style={{ position: 'absolute', left: F16.LX - 26, top: F16.LB + F16.LS / 2 + 6, width: F16.LS + 52 }}>
        <div style={tagS()}>Denied</div>
      </Show>

      {/* only the opened lane reaches the resource: one elbow, tip on the bucket tile's edge */}
      <Elbow pts={[[F16.LX + F16.LS, F16.LA], [F16.ELB, F16.LA], [F16.ELB, F16_BY], [F16_BX, F16_BY]]} on={open} delay={300} color={colors.brand} width={2.4} />
      <Show on={on(1)} style={{ position: 'absolute', left: F16_BX, top: F16_BY - F16.BS / 2, zIndex: 2 }}>
        <MarkTile src={s3Bucket} size={F16.BS} />
      </Show>
      <Show on={on(1)} style={{ position: 'absolute', left: F16_BX - 20, top: F16_BY + F16.BS / 2 + 6, width: F16.BS + 40 }}>
        <div style={tagS()}>Resource</div>
      </Show>

      {done && <Token cls={F16_READ1} icon="Eye" size={18} z={4} />}
      {done && <Token cls={F16_READ2} icon="Eye" size={18} z={4} />}
      {done && <Token cls={F16_DEL} icon="Trash2" size={18} z={4} />}
      {done && <Stop3D x={F16.LX - 16} y={F16.LB} cls={F16_DEL_STOP} />}
      {!held && step === 1 && <Token cls={F16_EARLY_A} icon="Eye" size={18} z={4} />}
      {!held && step === 1 && <Stop3D x={F16.LX - 16} y={F16.LA} cls={F16_EARLY_A_STOP} />}
    </Frame>
  )
}

/* ================================================================== C_T17 · deny overrides allow (slide 34) */

/* stage 634 x 330, padding 20 all round */
const F17 = { W: 634, H: 330, P: 20, CW: 204, CH: 42, BUS: 306, RW: 176, RH: 120, LT: 40 }
/* card rows: Allow, Allow, Deny, Allow, then the unrelated Allow below a gap */
const F17_ROWS = [20, 70, 120, 170, 268]
const F17_KIND: ('allow' | 'deny' | 'other')[] = ['allow', 'allow', 'deny', 'allow', 'other']
const F17_ON = [1, 2, 1, 2, 3]
const f17cy = (i: number) => F17_ROWS[i] + F17.CH / 2
const F17_CR = F17.P + F17.CW // cards' right edge
const F17_RX = F17.W - F17.P - F17.RW
const F17_DC = (f17cy(0) + f17cy(3)) / 2 // Denied's centre line = the bus's middle
const F17_RY = F17_DC - F17.RH / 2
const F17_PERIOD = 2.8
const F17_DENY = ride('t17-deny', [[F17_CR + 8, f17cy(2)], [F17.BUS, f17cy(2)], [F17.BUS, F17_DC], [F17_RX - 8, F17_DC]], 0.1, 1.7, F17_PERIOD)
const F17_SCAN_Y = F17_ROWS[3] + F17.CH - F17_ROWS[0]
const F17_LINK_X = F17_CR + 64

const C_T17: Fig = (p) => {
  const step = Number(p.step ?? 0)
  const held = useHeld()
  const on = (k: number) => held || step >= k
  const hot = useHot(4, step)
  const done = !held && step >= 4
  const otherY = f17cy(4)
  const lockY = F17_RY + F17.RH + 18
  return (
    <Frame w={F17.W} h={F17.H}>
      {F17_ROWS.map((y, i) => {
        const k = F17_KIND[i]
        const deny = k === 'deny'
        const lit = (hot === 0 && deny) || (hot === 1 && k === 'allow') || (hot === 2 && k === 'other')
        return (
          <Panel key={i} x={F17.P} y={y} w={F17.CW} h={F17.CH} on={on(F17_ON[i])} delay={i * 90} lit={lit} radius={12} dashed={k === 'other'} edge={deny ? `${ORANGE}99` : undefined} tint={deny ? 'linear-gradient(180deg, #FFFFFF 0%, #FFF3EA 100%)' : undefined}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: '100%', padding: '0 14px', opacity: k === 'other' ? 0.62 : 1 }}>
              <Ico3D name={deny ? 'cross' : 'check'} size={26} loop={deny ? 'pulse' : 'bob'} d={i * 0.4} />
              <span style={{ ...label(15, k === 'other' ? GREY : colors.ink), flex: 1 }}>{deny ? 'Deny' : 'Allow'}</span>
              <Ico3D name={k === 'other' ? 'eye' : 'trash'} size={24} loop="none" />
            </div>
          </Panel>
        )
      })}

      {/* the scan for an explicit deny, first */}
      {!held && step === 1 && (
        <span aria-hidden style={{ position: 'absolute', left: F17.P - 6, top: F17_ROWS[0] - 4, width: F17.CW + 12, height: 6, zIndex: 4, pointerEvents: 'none' }}>
          <span className={lc('scan')} style={{ display: 'block', width: '100%', height: '100%', borderRadius: 6, background: `linear-gradient(90deg, ${ORANGE}00, ${ORANGE}cc, ${ORANGE}00)`, ['--c13-y' as string]: `${F17_SCAN_Y}px` } as CSSProperties} />
        </span>
      )}

      {/* every matched policy joins one bus that enters Denied's left edge; the deny's path drawn last, in orange */}
      {[0, 1, 3].map((i) => (
        <Elbow key={i} pts={[[F17_CR, f17cy(i)], [F17.BUS, f17cy(i)], [F17.BUS, F17_DC], [F17_RX, F17_DC]]} on={on(F17_ON[i])} delay={250 + i * 90} color={`${colors.brand}77`} width={2.2} head={8} />
      ))}
      <Elbow pts={[[F17_CR, f17cy(2)], [F17.BUS, f17cy(2)], [F17.BUS, F17_DC], [F17_RX, F17_DC]]} on={on(1)} delay={250} color={ORANGE} width={2.8} head={9} z={2} />

      {[1, 2].map((i) => <Junction key={i} x={F17.BUS} y={f17cy(i)} on={on(F17_ON[i])} color={i === 2 ? ORANGE : colors.brand} r={3.5} />)}

      {/* the unrelated allow never reaches it: its dashed line ends at a broken link */}
      <Elbow pts={[[F17_CR, otherY], [F17_LINK_X, otherY]]} on={on(3)} delay={250} color={GREY} width={2} head={0} dashed />
      <Show on={on(3)} delay={500} style={{ position: 'absolute', left: F17_LINK_X, top: otherY - F17.LT / 2, zIndex: 3 }}>
        <Tile3D name="link" size={F17.LT} k={0.76} badge="cross" loop="tilt" t={2.8} ring={litRing(hot === 2, TILE3D_BASE)} />
      </Show>

      <Panel x={F17_RX} y={F17_RY} w={F17.RW} h={F17.RH} on={on(1)} delay={400} lit={hot === 0 || hot === 3} edge={`${ORANGE}99`} radius={16} tint="linear-gradient(180deg, #FFFFFF 0%, #FFF3EA 100%)">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, height: '100%' }}>
          <Ico3D name="cross" size={46} loop="pulse" t={2.2} />
          <span style={label(16)}>Denied</span>
        </div>
      </Panel>
      {/* the sensitive action, locked */}
      <Show on={on(4)} delay={200} style={{ position: 'absolute', left: F17_RX, top: lockY, width: F17.RW, zIndex: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Tile3D name="trash" size={40} k={0.72} loop="none" ring={litRing(hot === 3, TILE3D_BASE)} />
          <Tile3D name="lock" size={40} k={0.74} loop="bob" t={2.4} ring={litRing(hot === 3, TILE3D_BASE)} />
        </div>
        <div style={{ ...tagS(), marginTop: 6 }}>Locked</div>
      </Show>
      {/* the deny keeps arriving */}
      {done && <Token cls={F17_DENY} tone={ORANGE} z={4} />}
    </Frame>
  )
}

/* ================================================================== C_T18B · the combined trace (slide 36) */

/* stage 1100 x 360, padding 24 all round. The request forks on a bus to both policies; Policy A's allow (dashed) and
   Policy B's failed IP condition (orange) both reach the decision; the deny wins. B's condition row carries an
   address line: the allowed /24 range as a blue band, the request's address as the orange dot outside it (198.51.100.7
   sits below 203.0.113.0 on the line). */
const F18 = { W: 1100, H: 360, P: 24, QW: 220, QH: 184, PX: 330, PW: 420, PH: 132, DW: 230, DH: 160, FORK: 287, EA: 790, EB: 806 }
const F18_QY = (F18.H - F18.QH) / 2
const F18_QR = F18.P + F18.QW
const F18_AY = F18.P
const F18_BY = F18.H - F18.P - F18.PH
const F18_AC = F18_AY + F18.PH / 2
const F18_BC = F18_BY + F18.PH / 2
const F18_PR = F18.PX + F18.PW
const F18_DX = F18.W - F18.P - F18.DW
const F18_DY = (F18.H - F18.DH) / 2
const F18_MID = F18.H / 2
const F18_PERIOD = 6
const F18_TO_A = ride('t18-a', [[F18_QR + 6, F18_MID], [F18.FORK, F18_MID], [F18.FORK, F18_AC], [F18.PX - 8, F18_AC]], 0.2, 1.5, F18_PERIOD)
const F18_TO_B = ride('t18-b', [[F18_QR + 6, F18_MID], [F18.FORK, F18_MID], [F18.FORK, F18_BC], [F18.PX - 8, F18_BC]], 1.8, 3.1, F18_PERIOD)
const F18_TO_D = ride('t18-d', [[F18_PR + 8, F18_BC], [F18.EB, F18_BC], [F18.EB, F18_MID + 20], [F18_DX - 8, F18_MID + 20]], 3.5, 4.8, F18_PERIOD)

/** the address line inside Policy B: the allowed range (blue band) and the request's address (orange dot), outside it */
function AddrLine({ show }: { show: boolean }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'relative', display: 'block', flex: 1, height: 14, minWidth: 56 }}>
      <span style={{ position: 'absolute', left: 0, right: 0, top: 5, height: 4, borderRadius: 4, background: '#DCE4F4' }} />
      <span style={{ position: 'absolute', left: '58%', width: '26%', top: 2, height: 10, borderRadius: 6, background: `linear-gradient(180deg, #8DB0FF, ${colors.brand})`, boxShadow: `0 4px 8px -4px ${colors.brand}` }} />
      <span style={{ position: 'absolute', left: '22%', top: 0, width: 14, height: 14, marginLeft: -7, opacity: show ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE} 300ms` }}>
        <span className="i3d i3d-pulse" style={{ display: 'block', width: 14, height: 14, borderRadius: 99, background: `radial-gradient(circle at 35% 30%, #FFC9A0, ${ORANGE} 55%, #E8642A)`, boxShadow: `0 0 0 3px ${ORANGE}2e` }} />
      </span>
    </span>
  )
}

const C_T18B: Fig = (p) => {
  const step = Number(p.step ?? 0)
  const held = useHeld()
  const on = (k: number) => held || step >= k
  const hot = useHot(3, step)
  const done = !held && step >= 3
  const status = (show: boolean, ok: boolean) => (
    <Show on={show} delay={500} lift={0} style={{ display: 'grid' }}>
      <Ico3D name={ok ? 'check' : 'cross'} size={32} loop="pulse" t={2.4} />
    </Show>
  )
  const head = (icon: ReactNode, title: string, sub: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      {icon}
      <div style={{ flex: 1 }}>
        <div style={label(17)}>{title}</div>
        <div style={{ ...tagS(13, colors.muted), textAlign: 'left' }}>{sub}</div>
      </div>
      <Ico3D name="policy" size={34} loop="bob" t={3} d={title === 'Policy A' ? 0 : 0.8} />
    </div>
  )
  return (
    <Frame w={F18.W} h={F18.H}>
      {/* the request */}
      <Panel x={F18.P} y={F18_QY} w={F18.QW} h={F18.QH} lit={hot === 0 || hot === 1} radius={18}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, height: '100%' }}>
          <Ico3D name="laptop" size={72} loop="bob" t={2.8} />
          <span style={label(17)}>Request</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="i3d i3d-pulse" style={{ display: 'block', width: 12, height: 12, borderRadius: 99, background: `radial-gradient(circle at 35% 30%, #FFC9A0, ${ORANGE} 55%, #E8642A)` }} />
            <span style={mono(15, colors.brandDark)}>198.51.100.7</span>
          </span>
        </div>
      </Panel>

      {/* the request is evaluated against both: one fork bus */}
      <Elbow pts={[[F18_QR, F18_MID], [F18.FORK, F18_MID], [F18.FORK, F18_AC], [F18.PX, F18_AC]]} on={on(1)} color={`${colors.brand}aa`} />
      <Elbow pts={[[F18_QR, F18_MID], [F18.FORK, F18_MID], [F18.FORK, F18_BC], [F18.PX, F18_BC]]} on={on(2)} color={`${colors.brand}aa`} />
      <Junction x={F18.FORK} y={F18_MID} on={on(1)} r={4} />

      {/* Policy A: identity-based, allows */}
      <Panel x={F18.PX} y={F18_AY} w={F18.PW} h={F18.PH} lit={hot === 0} radius={18} edge={on(1) ? `${colors.success}55` : undefined}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12, height: '100%', padding: '0 22px' }}>
          {head(<Tile3D name="user" size={46} k={0.78} loop="bob" d={0.3} />, 'Policy A', 'Identity-Based')}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 32 }}>
            <Ico3D name="play" size={24} loop="none" />
            <span style={{ ...mono(15), flex: 1 }}>Allow s3:GetObject</span>
            {status(on(1), true)}
          </div>
        </div>
      </Panel>

      {/* Policy B: resource-based, its IP condition */}
      <Panel x={F18.PX} y={F18_BY} w={F18.PW} h={F18.PH} lit={hot === 1 || hot === 2} radius={18} edge={on(2) ? `${ORANGE}99` : undefined}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12, height: '100%', padding: '0 22px' }}>
          {head(<MarkTile src={s3Bucket} size={46} />, 'Policy B', 'Resource-Based')}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 32 }}>
            <Ico3D name="filter" size={24} loop="none" />
            {/* the whole rule, not only its range (Session 13 review, T18-B) */}
            <span style={{ ...mono(14), lineHeight: 1.3 }}>Deny s3:GetObject<br />if IP not in 203.0.113.0/24</span>
            <AddrLine show={on(2)} />
            {status(on(2), false)}
          </div>
        </div>
      </Panel>

      {/* both reach the decision: A's allow does not decide (dashed), B's deny does (orange) */}
      <Elbow pts={[[F18_PR, F18_AC], [F18.EA, F18_AC], [F18.EA, F18_MID - 20], [F18_DX, F18_MID - 20]]} on={on(3)} color={`${colors.brand}66`} width={2} dashed />
      <Elbow pts={[[F18_PR, F18_BC], [F18.EB, F18_BC], [F18.EB, F18_MID + 20], [F18_DX, F18_MID + 20]]} on={on(3)} color={ORANGE} width={2.8} z={2} />

      {/* the decision */}
      <Panel x={F18_DX} y={F18_DY} w={F18.DW} h={F18.DH} on={on(3)} delay={400} lit={hot === 2} edge={`${ORANGE}99`} radius={18} tint="linear-gradient(180deg, #FFFFFF 0%, #FFF3EA 100%)">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, height: '100%' }}>
          <Ico3D name="cross" size={56} loop="pulse" t={2.2} />
          <span style={label(18)}>Access Denied</span>
        </div>
      </Panel>

      {done && <Token cls={F18_TO_A} z={4} />}
      {done && <Token cls={F18_TO_B} z={4} />}
      {done && <Token cls={F18_TO_D} tone={ORANGE} z={4} />}
    </Frame>
  )
}

/* ================================================================== C_T19 · policies combine fully */

const F19 = { W: 600, H: 318, R: 92, CY: 168, I1: 186, I2: 278, RX: 420 }
/* the deny slice: a slanted band through the identity union */
const F19_BAND = '208,62 240,62 222,272 190,272'

const C_T19: Fig = (p) => {
  const step = Number(p.step ?? 0)
  const held = useHeld()
  const instant = useInstant()
  const hot = useHot(3, step, 2200)
  /* the state on show: the press while building, then the walk 1 → 2 → 3; the whole merge (3) on held frames */
  const st = held ? 3 : hot >= 0 ? hot + 1 : step
  const a1 = st === 1 || st === 3 ? 1 : st === 2 ? 0.28 : 0
  const a2 = st === 3 ? 1 : st === 2 ? 0.28 : 0
  const a3 = st === 2 ? 1 : 0
  const tr = instant ? 'none' : `opacity 520ms ${EASE}`
  const { R, CY, I1, I2, RX } = F19
  const shown = held || step >= 1
  return (
    <Frame w={F19.W} h={F19.H}>
      <svg aria-hidden width={F19.W} height={F19.H} viewBox={`0 0 ${F19.W} ${F19.H}`} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          <clipPath id="c13-t19-r">
            <circle cx={RX} cy={CY} r={R} />
          </clipPath>
          <clipPath id="c13-t19-u">
            <circle cx={I1} cy={CY} r={R} />
            <circle cx={I2} cy={CY} r={R} />
          </clipPath>
        </defs>
        {/* fills: identity union, resource, and their overlap */}
        <g style={{ opacity: a1, transition: tr }}>
          <circle cx={I1} cy={CY} r={R} fill="#C6D6FF" />
          <circle cx={I2} cy={CY} r={R} fill="#C6D6FF" />
        </g>
        <circle cx={RX} cy={CY} r={R} fill="#CCDAFF" style={{ opacity: a2, transition: tr }} />
        <g clipPath="url(#c13-t19-r)" style={{ opacity: a3, transition: tr }}>
          <circle cx={I1} cy={CY} r={R} fill="#7F9FF5" />
          <circle cx={I2} cy={CY} r={R} fill="#7F9FF5" />
        </g>
        {/* outlines */}
        <circle cx={I1} cy={CY} r={R} fill="none" stroke={colors.brand} strokeWidth={2.2} />
        <circle cx={I2} cy={CY} r={R} fill="none" stroke={colors.brand} strokeWidth={2.2} />
        <circle cx={RX} cy={CY} r={R} fill="none" stroke={st >= 2 ? colors.brandDark : GREY} strokeWidth={2.2} strokeDasharray={st >= 2 ? undefined : '6 6'} style={{ transition: instant ? 'none' : `stroke 420ms ${EASE}` }} />
      </svg>
      {/* the deny slice, its own svg so its pulse is composited */}
      <div style={{ position: 'absolute', inset: 0, opacity: shown ? 1 : 0, transition: tr }}>
        <svg aria-hidden width={F19.W} height={F19.H} viewBox={`0 0 ${F19.W} ${F19.H}`} className={lc('glow')} style={{ position: 'absolute', inset: 0, overflow: 'visible', ...lv(0, 2.6) }}>
          <polygon points={F19_BAND} fill={ORANGE} clipPath="url(#c13-t19-u)" opacity={0.88} />
        </svg>
      </div>

      {/* icons on the circles */}
      <div style={{ position: 'absolute', left: I1 - 62, top: CY - 22, zIndex: 2 }}>
        <Glyph icon="User" size={44} d={0} />
      </div>
      <div style={{ position: 'absolute', left: I2 + 2, top: CY - 62, zIndex: 2 }}>
        <Glyph icon="User" size={40} d={0.8} />
      </div>
      <div style={{ position: 'absolute', left: RX + 22, top: CY - 22, zIndex: 2 }}>
        <MarkTile src={s3Bucket} size={44} />
      </div>
      <div style={{ position: 'absolute', left: 202, top: 14, zIndex: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Glyph icon="OctagonX" size={34} tone={ORANGE} loop="pulse" t={2.2} />
        <span style={tagS(13, colors.brandDeep)}>Deny</span>
      </div>
      {/* the overlap that cross-account sharing needs */}
      <div style={{ position: 'absolute', left: 330, top: CY + 34, zIndex: 2, opacity: a3, transition: tr }}>
        <Glyph icon="Handshake" size={34} loop="bob" t={2.4} />
      </div>

      <div style={{ position: 'absolute', left: (I1 + I2) / 2 - 60, top: CY + R + 10, width: 120, ...tagS() }}>Identity</div>
      <div style={{ position: 'absolute', left: RX - 60, top: CY + R + 10, width: 120, ...tagS() }}>Resource</div>
    </Frame>
  )
}

/* ================================================================== exports */

export const figures: Record<string, Fig> = { C_T15, C_T16, C_T17, C_T18B, C_T19 }

export const css = `
.c13 { animation-delay: var(--c13-d, 0s); }
@keyframes c13-breathe { 0%, 100% { transform: translateY(0) scale(1) } 50% { transform: translateY(-1.5px) scale(1.08) } }
.c13-breathe { animation: c13-breathe var(--c13-t, 3.2s) cubic-bezier(0.45,0,0.55,1) infinite; transform-origin: center; }
@keyframes c13-bob { 0%, 100% { transform: translateY(-2px) } 50% { transform: translateY(2px) } }
.c13-bob { animation: c13-bob var(--c13-t, 2.2s) ease-in-out infinite; }
@keyframes c13-pulse { 0%, 100% { transform: scale(0.94) } 50% { transform: scale(1.08) } }
.c13-pulse { animation: c13-pulse var(--c13-t, 1.8s) ease-in-out infinite; transform-origin: center; }
@keyframes c13-rock { 0%, 100% { transform: rotate(-10deg) } 50% { transform: rotate(10deg) } }
.c13-rock { animation: c13-rock var(--c13-t, 2.4s) ease-in-out infinite; transform-origin: 50% 50%; }
@keyframes c13-glow { 0%, 100% { opacity: 1 } 50% { opacity: 0.72 } }
.c13-glow { animation: c13-glow var(--c13-t, 2.6s) ease-in-out infinite; }
@keyframes c13-scan { 0% { transform: translateY(0); opacity: 0 } 10% { opacity: 1 } 90% { opacity: 1 } 100% { transform: translateY(var(--c13-y, 200px)); opacity: 0 } }
.c13-scan { animation: c13-scan 1.8s ease-in-out infinite; }
${KF.join('\n')}
.cc-still .c13, .deck-thumb .c13 { animation: none !important; }
@media (prefers-reduced-motion: reduce) {
  .c13 { animation: none !important; }
}
`
