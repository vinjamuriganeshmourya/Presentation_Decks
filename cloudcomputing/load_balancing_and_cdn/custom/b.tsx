import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { BOX_W, Card, Label, Num, STILL, Stage, useBuild, useLoop } from '@/decks/figures/scene'
import { TILE_SKIN } from '@/decks/figures/card'
import { CvIcon } from '@/decks/figures/net/fx'
import { NoMark } from '@/decks/figures/net/frames'
import { Icon } from '@/engine/icon'
import userWoman from './b-user-woman.png'
import userBoy from './b-user-boy.png'
import elbLogo from '../images/aws-elb.svg'
import albLogo from '../images/aws-alb.svg'
import nlbLogo from '../images/aws-nlb.svg'

/** an official AWS icon (G1/G2, user 2026-11-06): Load Balancer = Elastic Load Balancing, ALB and NLB their own marks */
const Logo = ({ src, w }: { src: string; w: number }) => <img src={src} alt="" aria-hidden draggable={false} className="block h-auto select-none" style={{ width: w }} />

/**
 * BUILDER B · Section 3, Distribution Algorithms (TR slides 8-11).
 *
 * Every figure is drawn in its own pixels (`w` x `h`), labels are DOM text,
 * arrows are drawn rim to rim by `Ar` (the scene Arrow's look: the line draws,
 * then the head lands, a light dash rides the line). Each figure honours
 * `step` (its build) and holds its loop still on `?still`, in thumbnails and
 * under reduced motion (`useLoop`).
 */

type P = [number, number]
const EASE = 'cubic-bezier(0.22,1,0.36,1)'
const C1 = colors.brand
const C2 = colors.teal
const C3 = colors.brandDeep

/* ------------------------------------------------------------------ helpers */

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v))
const smooth = (a: number, b: number, t: number) => {
  const x = clamp((t - a) / (b - a))
  return x * x * (3 - 2 * x)
}
const lerp = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
/** a point a fraction `f` along a polyline */
function along(pts: P[], f: number): P {
  const segs = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]))
  const total = segs.reduce((s, x) => s + x, 0)
  let d = clamp(f) * total
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) return lerp(pts[i], pts[i + 1], segs[i] ? clamp(d / segs[i]) : 0)
    d -= segs[i]
  }
  return pts[pts.length - 1]
}
/** a seamless sawtooth phase 0..1 (the loop restarts with no rest, R8.1), held at `still` on harness URLs */
const usePhase = (ms: number, still: number, on = true) => useLoop(ms, { mode: 'sawtooth', still, on, steps: Math.max(120, Math.round(ms / 33)) })

/** an absolutely placed block, faded in when `on` (keeps its place) */
function Pos({ x, y, c = '', on = true, w, h, z, children, style, className = '' }: { x: number; y: number; c?: string; on?: boolean; w?: number; h?: number; z?: number; children?: ReactNode; style?: CSSProperties; className?: string }) {
  const instant = useInstant()
  const tx = c.includes('x') ? '-50%' : c.includes('r') ? '-100%' : '0'
  const ty = c.includes('y') ? '-50%' : c.includes('b') ? '-100%' : '0'
  return (
    <div
      className={`absolute ${className}`}
      style={{ left: x, top: y, width: w, height: h, zIndex: z, transform: tx === '0' && ty === '0' ? undefined : `translate(${tx}, ${ty})`, opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 460ms ${EASE}`, ...style }}
    >
      {children}
    </div>
  )
}

/** an arrow along `pts`: drawn tail to head, the head lands after the line, a light dash rides it (house look) */
function Ar({ pts, on = true, tone = C1, width = 2.5, dashed = false, head = 9, op = 1, flow = true }: { pts: P[]; on?: boolean; tone?: string; width?: number; dashed?: boolean; head?: number; op?: number; flow?: boolean }) {
  const instant = useInstant()
  const n = pts.length
  const a = pts[n - 2]
  const b = pts[n - 1]
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0])
  const H = Math.max(head, width * 2.6)
  const hw = H * 0.56
  const end: P = [b[0] - Math.cos(ang) * (H - 1), b[1] - Math.sin(ang) * (H - 1)]
  const line = [...pts.slice(0, -1), end]
  const d = 'M ' + line.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ')
  const l: P = [b[0] - Math.cos(ang) * H + Math.cos(ang + Math.PI / 2) * hw, b[1] - Math.sin(ang) * H + Math.sin(ang + Math.PI / 2) * hw]
  const r: P = [b[0] - Math.cos(ang) * H - Math.cos(ang + Math.PI / 2) * hw, b[1] - Math.sin(ang) * H - Math.sin(ang + Math.PI / 2) * hw]
  const all = [...pts, l, r]
  const pad = width
  const x0 = Math.floor(Math.min(...all.map((p) => p[0])) - pad)
  const y0 = Math.floor(Math.min(...all.map((p) => p[1])) - pad)
  const x1 = Math.ceil(Math.max(...all.map((p) => p[0])) + pad)
  const y1 = Math.ceil(Math.max(...all.map((p) => p[1])) + pad)
  const t = instant ? 'none' : on ? `stroke-dashoffset 860ms cubic-bezier(0.65,0,0.35,1), opacity 200ms` : `stroke-dashoffset 520ms cubic-bezier(0.65,0,0.35,1) 220ms, opacity 200ms 640ms`
  return (
    <svg aria-hidden className="pointer-events-none absolute" style={{ left: x0, top: y0, overflow: 'visible', zIndex: 3, opacity: op, transition: instant ? 'none' : `opacity 380ms ${EASE}` }} width={x1 - x0} height={y1 - y0}>
      <g transform={`translate(${-x0} ${-y0})`}>
        <path d={d} stroke={tone} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" fill="none" pathLength={dashed ? undefined : 1} className={dashed ? 'mo mo-dash' : undefined} style={{ strokeDasharray: dashed ? '7 7' : '1', strokeDashoffset: dashed ? undefined : on ? 0 : 1, opacity: on ? 1 : 0, transition: t }} />
        {!dashed && flow && <path d={d} stroke={colors.white} strokeWidth={Math.max(1, width * 0.42)} strokeLinecap="round" fill="none" strokeDasharray="5 9" className="mo mo-dash" style={{ opacity: on ? 0.75 : 0, transition: instant ? 'none' : on ? 'opacity 300ms 860ms' : 'opacity 160ms', '--mo-delay': `${-((pts[0][0] * 7 + pts[0][1] * 3) % 16) / 10}s` } as CSSProperties} />}
        <path d={`M ${b[0]} ${b[1]} L ${l[0]} ${l[1]} L ${r[0]} ${r[1]} Z`} fill={tone} style={{ opacity: on ? 1 : 0, transition: instant ? 'none' : on ? `opacity 240ms ${dashed ? 200 : 860}ms` : 'opacity 180ms' }} />
      </g>
    </svg>
  )
}

/** a request riding a line: a numbered disc */
function Token({ at, n, tone = C1, op = 1, size = 26 }: { at: P; n?: number | string; tone?: string; op?: number; size?: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute grid place-items-center rounded-full font-heading font-semibold leading-none"
      style={{ left: at[0] - size / 2, top: at[1] - size / 2, width: size, height: size, background: tone, color: colors.white, fontSize: 14, opacity: op, boxShadow: `0 0 0 4px ${tone}33, 0 6px 14px -6px ${tone}`, zIndex: 6 }}
    >
      {n}
    </div>
  )
}

/** a live counter disc (pops when its number changes) */
function Counter({ n, tone = C1, size = 30, lit = false }: { n: number; tone?: string; size?: number; lit?: boolean }) {
  return (
    <span
      key={n}
      className={`grid place-items-center rounded-full font-heading font-semibold leading-none ${STILL ? '' : 'cvx cvx-pop'}`}
      style={{ width: size, height: size, fontSize: Math.max(15, size * 0.52), background: tone, color: colors.white, boxShadow: lit ? `0 0 0 4px ${colors.success}55` : `0 0 0 3px ${colors.white}` }}
    >
      {n}
    </span>
  )
}

/** the load balancer card: its official AWS icon, its name, and the rule it runs */
function LbCard({ w, h, icon = 60, sub, name = 'Load Balancer', logo = elbLogo, children, row = false }: { w: number; h: number; icon?: number; sub?: ReactNode; name?: string; logo?: string; children?: ReactNode; row?: boolean }) {
  return (
    <div className={`flex h-full w-full ${row ? 'flex-row gap-3' : 'flex-col gap-1.5'} items-center justify-center rounded-[18px] px-2 text-center`} style={{ ...TILE_SKIN, width: w, height: h }}>
      <Logo src={logo} w={icon} />
      <div className="flex flex-col items-center gap-1">
        <span className="font-heading font-semibold leading-tight" style={{ fontSize: 16, color: colors.ink }}>
          {name}
        </span>
        {sub && (
          <span className="font-semibold leading-tight" style={{ fontSize: 14, color: colors.brandDark }}>
            {sub}
          </span>
        )}
        {children}
      </div>
    </div>
  )
}

/** a server: the library render, with an optional glow ring when a request lands */
function Srv({ w, glow = 0, tone = C1 }: { w: number; glow?: number; tone?: string }) {
  return (
    <span className="relative block" style={{ width: w }}>
      <span aria-hidden className="absolute rounded-[12px]" style={{ inset: -6, boxShadow: `0 0 0 3px ${tone}`, opacity: glow * 0.85 }} />
      <CvIcon name="server-stack" w={w} />
    </span>
  )
}

/** a small text label in the figure (Title Case words from the TR) */
function Txt({ children, size = 16, tone = colors.ink, strong = true, align = 'left', mono = false }: { children: ReactNode; size?: number; tone?: string; strong?: boolean; align?: 'left' | 'center' | 'right'; mono?: boolean }) {
  return (
    <span className={`block whitespace-nowrap leading-tight ${strong ? 'font-heading font-semibold' : 'font-medium'} ${mono ? 'font-mono' : ''}`} style={{ fontSize: size, color: tone, textAlign: align }}>
      {children}
    </span>
  )
}

/** a quiet tinted zone (a quadrant, a panel) */
function Zone({ x, y, w, h, on = true, tone, children }: { x: number; y: number; w: number; h: number; on?: boolean; tone?: string; children?: ReactNode }) {
  return (
    <Pos x={x} y={y} w={w} h={h} on={on} style={{ borderRadius: 16, background: tone ?? 'linear-gradient(180deg, rgba(255,255,255,0.86) 0%, rgba(236,242,253,0.86) 100%)', boxShadow: `inset 0 0 0 1px ${colors.line}` }}>
      {children}
    </Pos>
  )
}

const I = (name: string, size = 14) => <Icon name={name} size={size} />

/* ================================================================== T08 · static vs dynamic */

const SD_Y = [70, 150, 230]
const load = (i: number, p: number) => 0.5 + 0.36 * Math.sin(2 * Math.PI * (p + i / 3))
const meterTone = (v: number) => (v < 0.36 ? colors.success : v > 0.66 ? colors.warning : colors.brand)

function SdPanel({ x, kind, on, built, p }: { x: number; kind: 'static' | 'dynamic'; on: boolean; built: boolean; p: number }) {
  const LB: P = [x + 95, 128]
  const trips = 6
  const j = Math.floor(p * trips) % trips
  const v = p * trips - Math.floor(p * trips)
  const target = kind === 'static' ? j % 3 : [0, 1, 2].reduce((m, i) => (load(i, j / trips) < load(m, j / trips) ? i : m), 0)
  const from: P = [LB[0] + 44, LB[1]]
  const to = (i: number): P => [x + 300, SD_Y[i]]
  const tok = along([from, to(target)], smooth(0.08, 0.86, v))
  const top = kind === 'static' ? (
    <Label tone="brand" strong icon={I('Pin')}>
      Static
    </Label>
  ) : (
    <Label tone="brand" strong icon={I('Activity')}>
      Dynamic
    </Label>
  )
  /* the state the balancer reads at the moment it decides (the meters glide to it) */
  const live = [0, 1, 2].map((i) => load(i, j / trips))
  const low = live.indexOf(Math.min(...live))
  return (
    <>
      <Zone x={x} y={0} w={480} h={300} />
      <Pos x={x + 16} y={14} z={4}>
        {top}
      </Pos>
      {kind === 'static' && (
        <Pos x={x + 466} y={14} c="r" on={on} z={4}>
          <Label icon={I('EyeOff')}>Ignore Server Load</Label>
        </Pos>
      )}
      <Pos x={LB[0]} y={LB[1]} c="xy" z={4}>
        <Logo src={elbLogo} w={64} />
      </Pos>
      <Pos x={LB[0]} y={172} c="x" z={4}>
        <Txt size={15}>Load Balancer</Txt>
      </Pos>
      <Pos x={LB[0]} y={204} c="x" on={on} z={4}>
        {kind === 'static' ? <Label icon={I('ListOrdered')}>Fixed Rules</Label> : <Label icon={I('Gauge')}>Live Server State</Label>}
      </Pos>
      <Pos x={LB[0]} y={242} c="x" on={on} z={4}>
        {kind === 'static' ? (
          <span className="flex gap-2">
            {[1, 2, 3].map((n, i) => (
              <Num key={n} n={n} on={built && i === j % 3} size={26} />
            ))}
          </span>
        ) : (
          <span className="flex items-end gap-2" style={{ height: 34 }}>
            {live.map((lv, i) => (
              <span key={i} className="block rounded-[4px]" style={{ width: 18, height: 6 + lv * 28, background: i === low ? colors.success : meterTone(lv), transition: 'height 600ms ease' }} />
            ))}
          </span>
        )}
      </Pos>
      {SD_Y.map((y, i) => (
        <Ar key={i} pts={[from, to(i)]} on={on} tone={kind === 'dynamic' && built && i === target ? colors.success : C1} width={2} op={kind === 'dynamic' && built && i !== target ? 0.4 : 1} />
      ))}
      {SD_Y.map((y, i) => (
        <Pos key={`s${i}`} x={x + 330} y={y} c="xy" z={4}>
          <Srv w={46} glow={built && i === target ? smooth(0.78, 0.92, v) * (1 - smooth(0.96, 1, v)) : 0} tone={kind === 'dynamic' ? colors.success : C1} />
        </Pos>
      ))}
      {SD_Y.map((y, i) => (
        <Pos key={`m${i}`} x={x + 370} y={y - 5} z={4}>
          <span className="block overflow-hidden rounded-full" style={{ width: 86, height: 10, background: colors.surface2, boxShadow: `inset 0 0 0 1px ${colors.line}` }}>
            <span className="block h-full rounded-full" style={{ width: `${Math.round(live[i] * 100)}%`, background: meterTone(live[i]), transition: 'width 600ms ease, background-color 600ms ease' }} />
          </span>
        </Pos>
      ))}
      {built && <Token at={tok} size={18} tone={kind === 'dynamic' ? colors.success : C1} op={Math.min(1, smooth(0.04, 0.12, v), 1 - smooth(0.86, 0.94, v))} />}
    </>
  )
}

function StaticDynamic({ step = 2 }: { step?: number }) {
  const p = usePhase(9000, 0.27, step >= 2)
  return (
    <div className="relative" style={{ width: 1000, height: 300 }}>
      <SdPanel x={0} kind="static" on={step >= 1} built={step >= 2} p={p} />
      <SdPanel x={520} kind="dynamic" on={step >= 2} built={step >= 2} p={p} />
    </div>
  )
}

/* ================================================================== T08-B · four approaches around one balancer */

/** one quadrant's tint: a rounded rectangle whose inner corner is cut by a circle round the balancer */
function QuadShape({ w, h, R, on }: { w: number; h: number; R: number; on: boolean[] }) {
  const instant = useInstant()
  const cx = w / 2
  const cy = h / 2
  const g = 4
  const x0 = 8
  const y0 = 8
  const x1 = cx - g
  const y1 = cy - g
  const r = 16
  const ay = cy - Math.sqrt(R * R - g * g)
  const ax = cx - Math.sqrt(R * R - g * g)
  const d = `M ${x0 + r} ${y0} H ${x1 - r} Q ${x1} ${y0} ${x1} ${y0 + r} V ${ay} A ${R} ${R} 0 0 0 ${ax} ${y1} H ${x0 + r} Q ${x0} ${y1} ${x0} ${y1 - r} V ${y0 + r} Q ${x0} ${y0} ${x0 + r} ${y0} Z`
  const flips = ['', `translate(${w} 0) scale(-1 1)`, `translate(0 ${h}) scale(1 -1)`, `translate(${w} ${h}) scale(-1 -1)`]
  return (
    <svg aria-hidden className="pointer-events-none absolute" style={{ left: 0, top: 0 }} width={w} height={h}>
      <defs>
        <linearGradient id="bq-tint" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={colors.white} stopOpacity={0.92} />
          <stop offset="1" stopColor={colors.surface2} stopOpacity={0.9} />
        </linearGradient>
      </defs>
      {flips.map((t, i) => (
        <path key={i} d={d} transform={t || undefined} fill="url(#bq-tint)" stroke={colors.line} strokeWidth={1} style={{ opacity: on[i] ? 1 : 0, transition: instant ? 'none' : `opacity 460ms ${EASE}` }} />
      ))}
    </svg>
  )
}

function Quad({ step = 5, w = 526, h = 380 }: { step?: number; w?: number; h?: number }) {
  const p = usePhase(7200, 0.1, step >= 5)
  const C: P = [w / 2, h / 2]
  const R = 74
  const RIM = 60
  /* a target at a direction (degrees, y down) and a distance from the centre */
  const at = (deg: number, dist: number): P => [C[0] + Math.cos((deg * Math.PI) / 180) * dist, C[1] + Math.sin((deg * Math.PI) / 180) * dist]
  const from = (t: P): P => {
    const dx = t[0] - C[0]
    const dy = t[1] - C[1]
    const l = Math.hypot(dx, dy)
    return [C[0] + (dx / l) * RIM, C[1] + (dy / l) * RIM]
  }
  /* the arrow ends on the target's rim (a server render is about as wide as tall: a circle of radius ~w/2 + 6) */
  const rim = (t: P, size: number): P => {
    const dx = t[0] - C[0]
    const dy = t[1] - C[1]
    const l = Math.hypot(dx, dy)
    const k = size / 2 + 6
    return [t[0] - (dx / l) * k, t[1] - (dy / l) * k]
  }
  const ride = (t: P, size: number, f: number) => along([from(t), rim(t, size)], f)
  /* round robin: three targets in a fan, served in turn */
  const rr = [at(198, 172), at(224, 168), at(250, 164)]
  const rrK = Math.floor(p * 6) % 3
  const rrV = p * 6 - Math.floor(p * 6)
  /* least connections: counters 2 and 5, the arrow to the lower */
  const lcLow = at(-18, 170)
  const lcHigh = at(-46, 166)
  const lcV = p * 3 - Math.floor(p * 3)
  const lcN = lcV > 0.62 && lcV < 0.9 ? 3 : 2
  /* ip hash: dashed, always the same target */
  const ih = [at(162, 172), at(119, 162)]
  const ihV = p * 3 - Math.floor(p * 3)
  /* weighted: thick to the strong target, thin to the weak */
  const wBig = at(18, 168)
  const wSmall = at(48, 166)
  const wk = Math.floor(p * 8) % 4
  const wv = p * 8 - Math.floor(p * 8)
  const fade = (v: number, a = 0.08, b = 0.84) => Math.min(smooth(a - 0.06, a, v), 1 - smooth(b, b + 0.08, v))
  return (
    <div className="relative" style={{ width: w, height: h }}>
      <QuadShape w={w} h={h} R={R} on={[step >= 1, step >= 2, step >= 3, step >= 4]} />
      <Pos x={C[0]} y={C[1]} c="xy" z={4}>
        <span className="grid place-items-center rounded-full text-center" style={{ ...TILE_SKIN, width: 112, height: 112, borderRadius: 999 }}>
          <span className="flex flex-col items-center gap-0.5">
            <img src={elbLogo} alt="" aria-hidden draggable={false} className="block select-none" style={{ width: 40, height: 40 }} />
            <span className="font-heading font-semibold leading-tight" style={{ fontSize: 14, color: colors.ink }}>
              Load
              <br />
              Balancer
            </span>
          </span>
        </span>
      </Pos>
      {/* round robin (cyclic) */}
      <Pos x={20} y={18} on={step >= 1} z={4}>
        <Label tone="brand" strong icon={I('RefreshCw')}>
          Round Robin
        </Label>
      </Pos>
      {rr.map((t, i) => (
        <Pos key={`rr${i}`} x={t[0]} y={t[1]} c="xy" on={step >= 1} z={4}>
          <Srv w={36} glow={step >= 1 && i === rrK ? smooth(0.78, 0.9, rrV) * (1 - smooth(0.95, 1, rrV)) : 0} />
        </Pos>
      ))}
      {rr.map((t, i) => (
        <Ar key={`rra${i}`} pts={[from(t), rim(t, 36)]} on={step >= 1} width={2} op={step >= 1 && i === rrK ? 1 : 0.45} flow={false} />
      ))}
      {step >= 1 && <Token at={ride(rr[rrK], 36, smooth(0.04, 0.84, rrV))} size={14} op={fade(rrV)} />}
      {/* least connections (counter-based) */}
      <Pos x={w - 20} y={18} c="r" on={step >= 2} z={4}>
        <Label tone="brand" strong icon={I('Gauge')}>
          Least Connections
        </Label>
      </Pos>
      {[lcLow, lcHigh].map((t, i) => (
        <Pos key={`lc${i}`} x={t[0]} y={t[1]} c="xy" on={step >= 2} z={4}>
          <Srv w={38} />
        </Pos>
      ))}
      <Pos x={lcLow[0] + 36} y={lcLow[1]} c="xy" on={step >= 2} z={5}>
        <Counter n={step >= 2 ? lcN : 2} size={26} tone={colors.success} />
      </Pos>
      <Pos x={lcHigh[0] + 36} y={lcHigh[1]} c="xy" on={step >= 2} z={5}>
        <Counter n={5} size={26} tone={colors.muted} />
      </Pos>
      <Ar pts={[from(lcLow), rim(lcLow, 38)]} on={step >= 2} width={2.5} tone={colors.success} flow={false} />
      {step >= 2 && <Token at={ride(lcLow, 38, smooth(0.1, 0.6, lcV))} size={14} tone={colors.success} op={fade(lcV, 0.1, 0.6)} />}
      {/* ip hash (hash-based, dashed) */}
      <Pos x={20} y={h - 18} c="b" on={step >= 3} z={4}>
        <Label tone="brand" strong icon={I('Hash')}>
          IP Hash
        </Label>
      </Pos>
      {ih.map((t, i) => (
        <Pos key={`ih${i}`} x={t[0]} y={t[1]} c="xy" on={step >= 3} z={4}>
          <Srv w={36} />
        </Pos>
      ))}
      <Ar pts={[from(ih[0]), rim(ih[0], 36)]} on={step >= 3} width={2} dashed tone={C2} />
      <Pos x={ih[0][0]} y={ih[0][1] + 44} c="xy" on={step >= 3} z={4}>
        <Label mono>hash(IP)</Label>
      </Pos>
      {step >= 3 && <Token at={ride(ih[0], 36, smooth(0.1, 0.8, ihV))} size={14} tone={C2} op={fade(ihV, 0.1, 0.8)} />}
      {/* weighted (thick to the strong target, thin to the weak) */}
      <Pos x={w - 20} y={h - 18} c="rb" on={step >= 4} z={4}>
        <Label tone="brand" strong icon={I('Scale')}>
          Weighted Distribution
        </Label>
      </Pos>
      <Pos x={wBig[0]} y={wBig[1]} c="xy" on={step >= 4} z={4}>
        <Srv w={56} />
      </Pos>
      <Pos x={wSmall[0]} y={wSmall[1]} c="xy" on={step >= 4} z={4}>
        <Srv w={30} />
      </Pos>
      <Ar pts={[from(wBig), rim(wBig, 56)]} on={step >= 4} width={5} head={13} flow={false} />
      <Ar pts={[from(wSmall), rim(wSmall, 30)]} on={step >= 4} width={1.6} flow={false} />
      <Pos x={wBig[0] + 50} y={wBig[1] - 30} c="xy" on={step >= 5} z={5}>
        <span className="grid place-items-center rounded-full" style={{ width: 26, height: 26, background: colors.success, color: colors.white }}>
          {I('TrendingUp', 15)}
        </span>
      </Pos>
      {step >= 5 && <Token at={wk === 3 ? ride(wSmall, 30, smooth(0.06, 0.84, wv)) : along([from(wBig), rim(wBig, 56)], smooth(0.06, 0.84, wv))} size={14} tone={colors.success} op={fade(wv, 0.06, 0.84)} />}
    </div>
  )
}

/* ================================================================== T09 / T09-B / T10 · the TR's three diagrams, redrawn */

type Mode = 'rr' | 'wrr' | 'lc'
type Beat = [number, number] | 'd1' | 'd2' | 'dall'
const FLOW: Record<Mode, { sub: string; seq: Beat[]; user: number[][]; srv: number[][]; weights?: number[] }> = {
  rr: { sub: 'Round Robin (RR)', seq: [[1, 1], [2, 2], [3, 3], [1, 1], [2, 2], [3, 3]], user: [[4, 1], [5, 2], [6, 3]], srv: [[4, 1], [5, 2], [6, 3]] },
  wrr: { sub: 'Weighted Round Robin (WRR)', seq: [[2, 1], [1, 1], [1, 1], [2, 2], [2, 2], [3, 3]], user: [[3, 2], [5, 4, 1], [6]], srv: [[3, 2, 1], [5, 4], [6]], weights: [3, 2, 1] },
  lc: { sub: 'Least Connections (LC)', seq: [[1, 1], [2, 2], [3, 3], 'd1', [1, 1], 'd2', [2, 2], 'dall'], user: [[4, 1], [5, 2], [3]], srv: [[4, 1], [5, 2], [3]] },
}
const FY = [56, 165, 274]
const USERS: { src: string; w: number }[] = [
  { src: 'coder', w: 78 },
  { src: userWoman, w: 74 },
  { src: userBoy, w: 44 },
]
function Person({ i }: { i: number }) {
  const u = USERS[i]
  return u.src === 'coder' ? <CvIcon name="coder" w={u.w} /> : <img src={u.src} alt="" aria-hidden draggable={false} className="block h-auto select-none" style={{ width: u.w }} />
}

function Flow({ mode = 'rr', step = 2, w = 1100, h = 330 }: { mode?: Mode; step?: number; w?: number; h?: number }) {
  const F = FLOW[mode]
  const N = F.seq.length
  const still = mode === 'lc' ? (6 + 0.7) / 8 : (5 + 0.7) / 6
  const built = step >= 2
  const p = usePhase(N * 1700, still, built)
  const b = Math.min(N - 1, Math.floor(p * N))
  const u = p * N - b
  const LBX0 = 440
  const LBX1 = 610
  const UX = 150
  const SXC = 912
  const SX0 = 880
  /* which request number each beat carries */
  const reqNo: number[] = []
  let k = 0
  F.seq.forEach((s) => reqNo.push(typeof s === 'string' ? 0 : ++k))
  const cur = F.seq[b]
  const req = typeof cur === 'string' ? 0 : reqNo[b]
  /* live counters (least connections): +1 when a request lands, -1 when one completes */
  const counts = [0, 0, 0]
  F.seq.forEach((s, i) => {
    const passed = i < b || (i === b && (typeof s === 'string' ? u >= 0.5 : u >= 0.92))
    if (!passed) return
    if (typeof s !== 'string') counts[s[1] - 1]++
    else if (s === 'dall') counts.forEach((_, j) => counts[j]--)
    else counts[Number(s[1]) - 1]--
  })
  const done = typeof cur === 'string' ? (cur === 'dall' ? [0, 1, 2] : [Number(cur[1]) - 1]) : []
  let tok: P | null = null
  let op = 0
  if (typeof cur !== 'string') {
    const [uu, ss] = cur
    if (u < 0.46) {
      tok = lerp([UX + 16, FY[uu - 1]], [LBX0 - 18, FY[uu - 1]], smooth(0, 0.42, u))
      op = Math.min(smooth(0, 0.05, u), 1 - smooth(0.4, 0.46, u))
    } else if (u >= 0.5) {
      tok = lerp([LBX1 + 18, FY[ss - 1]], [SX0 - 22, FY[ss - 1]], smooth(0.5, 0.9, u))
      op = Math.min(smooth(0.5, 0.55, u), 1 - smooth(0.92, 0.98, u))
    }
  }
  const tgt = typeof cur === 'string' ? -1 : cur[1] - 1
  const glow = (i: number) => (built && i === tgt ? smooth(0.86, 0.93, u) * (1 - smooth(0.97, 1, u)) : 0)
  const chips = (list: number[], cx: number, y: number, on: boolean) => (
    <Pos x={cx} y={y - 46} c="x" on={on} z={4}>
      <span className="flex gap-1.5">
        {list.map((n) => (
          <Label key={n} tone={built && n === req ? 'brand' : 'plain'} strong={built && n === req}>
            Request {n}
          </Label>
        ))}
      </span>
    </Pos>
  )
  return (
    <div className="relative" style={{ width: w, height: h }}>
      {/* users */}
      {FY.map((y, i) => (
        <Pos key={`ul${i}`} x={60} y={y} c="ry" z={4}>
          <Txt>User {i + 1}</Txt>
        </Pos>
      ))}
      {FY.map((y, i) => (
        <Pos key={`up${i}`} x={104} y={y} c="xy" z={4}>
          <Person i={i} />
        </Pos>
      ))}
      {/* the balancer */}
      <Pos x={LBX0} y={14} z={4}>
        <LbCard w={LBX1 - LBX0} h={h - 28} icon={66} sub={<span className="block" style={{ maxWidth: 150 }}>{F.sub}</span>} />
      </Pos>
      {/* servers */}
      {FY.map((y, i) => (
        <Pos key={`s${i}`} x={SXC} y={y} c="xy" z={4}>
          <Srv w={58} glow={glow(i)} />
        </Pos>
      ))}
      {FY.map((y, i) => (
        <Pos key={`sl${i}`} x={958} y={y} c="y" z={4}>
          <div className="flex flex-col items-start gap-1.5">
            <Txt>Server {i + 1}</Txt>
            {F.weights && (
              <Pos x={0} y={0} on={step >= 2} style={{ position: 'relative' }}>
                <Label tone="lift" strong>
                  Weight = {F.weights[i]}
                </Label>
              </Pos>
            )}
          </div>
        </Pos>
      ))}
      {mode === 'lc' &&
        FY.map((y, i) => (
          <Pos key={`c${i}`} x={SXC + 30} y={y - 28} c="xy" on={step >= 2} z={6}>
            <Counter n={counts[i]} lit={built && i === tgt} />
          </Pos>
        ))}
      {mode === 'lc' &&
        FY.map((y, i) => (
          <Pos key={`d${i}`} x={SXC - 34} y={y - 30} c="xy" on={built && done.includes(i) && u > 0.3 && u < 0.95} z={6}>
            <span className="grid place-items-center rounded-full" style={{ width: 24, height: 24, background: colors.success, color: colors.white }}>
              {I('Check', 15)}
            </span>
          </Pos>
        ))}
      {/* the two sides of the journey */}
      {FY.map((y, i) => (
        <Ar key={`ua${i}`} pts={[[UX, y], [LBX0 - 4, y]]} on={step >= 1} width={2.2} />
      ))}
      {FY.map((y, i) => (
        <Ar key={`sa${i}`} pts={[[LBX1 + 4, y], [SX0 - 6, y]]} on={step >= 2} width={2.2} />
      ))}
      {F.user.map((list, i) => chips(list, (UX + LBX0) / 2, FY[i], step >= 1))}
      {F.srv.map((list, i) => chips(list, (LBX1 + SX0) / 2, FY[i], step >= 2))}
      {built && tok && <Token at={tok} n={req} op={op} />}
    </div>
  )
}

/* ================================================================== T09-C · smooth weighted round robin */

const SM_COLS = [218, 296, 374, 452]
const SM_TOT = { A: [3, 2, 1, 4], B: [1, 2, 3, 0] }
const SM_PICK = ['A', 'A', 'B', 'A']
const SM_PLAIN = ['A', 'A', 'A', 'B']
const tileTone = (l: string) => (l === 'A' ? C1 : C2)
function Tile({ l, ring = false, size = 40 }: { l: string; ring?: boolean; size?: number }) {
  return (
    <span className="grid place-items-center rounded-[10px] font-heading font-semibold leading-none" style={{ width: size, height: size, fontSize: 18, background: tileTone(l), color: colors.white, boxShadow: ring ? `0 0 0 3px ${colors.white}, 0 0 0 6px ${colors.accent}` : `0 6px 14px -8px ${tileTone(l)}`, transition: `box-shadow 300ms ${EASE}` }}>
      {l}
    </span>
  )
}

function Smooth({ step = 3, w = 526, h = 380 }: { step?: number; w?: number; h?: number }) {
  const p = usePhase(6400, 0.6, step >= 3)
  const col = Math.floor(p * 4) % 4
  const live = step >= 3 && !STILL
  const pick = SM_PICK[col]
  return (
    <div className="relative" style={{ width: w, height: h }}>
      {/* two servers sized by capacity */}
      <Pos x={150} y={102} c="xb" z={4}>
        <Srv w={92} glow={live && step >= 1 && pick === 'A' ? 0.7 : 0} />
      </Pos>
      <Pos x={380} y={102} c="xb" z={4}>
        <Srv w={50} glow={live && step >= 1 && pick === 'B' ? 0.7 : 0} tone={C2} />
      </Pos>
      {(['A', 'B'] as const).map((s, i) => (
        <Pos key={s} x={i === 0 ? 150 : 380} y={112} c="x" z={4}>
          <span className="flex items-center gap-2">
            <Txt>Server {s}</Txt>
            <Label tone="lift" strong icon={step >= 3 ? I('Lock') : undefined}>
              Weight = {s === 'A' ? 3 : 1}
            </Label>
          </span>
        </Pos>
      ))}
      {/* the 3:1 rotation, as a strip */}
      <Pos x={22} y={176} c="y" on={step >= 2} z={4}>
        <Label tone="brand" strong mono>
          3:1
        </Label>
      </Pos>
      {SM_PLAIN.map((l, i) => (
        <Pos key={`pl${i}`} x={SM_COLS[i]} y={176} c="xy" on={step >= 2} z={4}>
          <Tile l={l} ring={live && i === col} />
        </Pos>
      ))}
      {/* the running totals: add each weight, send to the larger, take the total off it */}
      <Zone x={10} y={206} w={w - 20} h={166} on={step >= 1} />
      <Pos x={22} y={218} on={step >= 1} z={4}>
        <Label icon={I('Sigma')}>Running Total</Label>
      </Pos>
      {(['A', 'B'] as const).map((s, r) => (
        <Pos key={`rl${s}`} x={52} y={r === 0 ? 268 : 302} c="y" on={step >= 1} z={4}>
          <span className="flex items-center gap-2">
            <span className="block rounded-[4px]" style={{ width: 14, height: 14, background: tileTone(s) }} />
            <Txt size={16}>Server {s}</Txt>
          </span>
        </Pos>
      ))}
      {SM_COLS.map((x, i) =>
        (['A', 'B'] as const).map((s, r) => {
          const v = SM_TOT[s][i]
          const top = SM_PICK[i] === s
          return (
            <Pos key={`t${i}${s}`} x={x} y={r === 0 ? 268 : 302} c="xy" on={step >= 1} z={4}>
              <span className="grid place-items-center rounded-[8px] font-mono font-semibold" style={{ width: 40, height: 28, fontSize: 18, color: top ? colors.white : colors.ink, background: top ? tileTone(s) : colors.surface2 }}>
                {v}
              </span>
            </Pos>
          )
        }),
      )}
      {SM_PICK.map((l, i) => (
        <Pos key={`pk${i}`} x={SM_COLS[i]} y={346} c="xy" on={step >= 1} z={4}>
          <Tile l={l} ring={live && i === col} size={36} />
        </Pos>
      ))}
    </div>
  )
}

/* ================================================================== T09-D · listener rule 90:10, round robin inside each group */

function Listener({ step = 4, w = 526, h = 380 }: { step?: number; w?: number; h?: number }) {
  const p = usePhase(16000, 0.52, step >= 3)
  const cx = w / 2
  const N = 20
  const k = Math.floor(p * N) % N
  const v = p * N - Math.floor(p * N)
  const toG2 = k === 9 || k === 19
  /* which server inside the group: round robin, one after another */
  const g1Count = [...Array(k + 1).keys()].filter((i) => i !== 9 && i !== 19).length - 1
  const g2Count = k >= 19 ? 1 : 0
  const g1 = [cx - 196, cx - 130, cx - 64]
  const g2 = [cx + 90, cx + 166]
  const srvX = toG2 ? g2[g2Count % 2] : g1[((g1Count % 3) + 3) % 3]
  const rule: P = [cx, 126]
  const g1Top: P = [cx - 130, 194]
  const g2Top: P = [cx + 128, 194]
  const path: P[] = [rule, toG2 ? g2Top : g1Top, [srvX, 258]]
  const rrK = step >= 3 ? (toG2 ? -1 : ((g1Count % 3) + 3) % 3) : Math.floor(p * 3) % 3
  const G1 = { x: 12, w: cx - 22 }
  const G2 = { x: cx + 10, w: cx - 22 }
  return (
    <div className="relative" style={{ width: w, height: h }}>
      <Pos x={cx} y={10} c="x" z={4}>
        <LbCard w={150} h={56} icon={34} name="ALB" logo={albLogo} row />
      </Pos>
      <Ar pts={[[cx, 70], [cx, 98]]} on={step >= 2} width={2.2} />
      <Pos x={cx} y={112} c="xy" on={step >= 2} z={4}>
        <Label tone="brand" strong icon={I('ListFilter')} raised>
          Listener Rule
        </Label>
      </Pos>
      <Pos x={cx + 92} y={112} c="xy" on={step >= 4} z={5}>
        <Num n={1} size={26} />
      </Pos>
      {/* weighted split between the target groups */}
      <Ar pts={[[cx - 34, 128], g1Top]} on={step >= 2} width={5} head={13} />
      <Ar pts={[[cx + 34, 128], g2Top]} on={step >= 2} width={1.8} />
      <Pos x={cx - 126} y={146} c="xy" on={step >= 3} z={4}>
        <Label tone="lift" strong mono>
          90
        </Label>
      </Pos>
      <Pos x={cx + 124} y={146} c="xy" on={step >= 3} z={4}>
        <Label tone="lift" strong mono>
          10
        </Label>
      </Pos>
      {/* the two target groups */}
      <Zone x={G1.x} y={198} w={G1.w} h={h - 206} on={step >= 1} />
      <Zone x={G2.x} y={198} w={G2.w} h={h - 206} on={step >= 1} />
      <Pos x={G1.x + 14} y={210} on={step >= 1} z={4}>
        <Txt size={15}>Target Group 1</Txt>
      </Pos>
      <Pos x={G2.x + 14} y={210} on={step >= 1} z={4}>
        <Txt size={15}>Target Group 2</Txt>
      </Pos>
      {g1.map((x, i) => (
        <Pos key={`a${i}`} x={x} y={278} c="xy" on={step >= 1} z={4}>
          <Srv w={40} glow={step >= 1 && !STILL && i === rrK ? 0.8 : 0} />
        </Pos>
      ))}
      {g2.map((x, i) => (
        <Pos key={`b${i}`} x={x} y={278} c="xy" on={step >= 1} z={4}>
          <Srv w={40} glow={step >= 3 && !STILL && toG2 && i === g2Count % 2 ? 0.8 : 0} />
        </Pos>
      ))}
      {[G1.x + G1.w / 2, G2.x + G2.w / 2].map((x, i) => (
        <Pos key={`rr${i}`} x={x} y={338} c="xy" on={step >= 1} z={4}>
          <span className="flex items-center gap-2">
            <Label icon={<span className={STILL ? '' : 'cvx cvx-spin'} style={{ display: 'inline-flex' }}>{I('RefreshCw')}</span>}>Round Robin</Label>
            {step >= 4 && <Num n={2} size={24} />}
          </span>
        </Pos>
      ))}
      {step >= 3 && <Token at={along(path, smooth(0.04, 0.88, v))} size={16} tone={toG2 ? C2 : C1} op={Math.min(smooth(0.02, 0.1, v), 1 - smooth(0.86, 0.94, v))} />}
    </div>
  )
}

/* ================================================================== T10-B · live counters, the arrow to the lower */

const active = (t: number, n: number, d: number, j: number) => {
  const a = (((t - j / n) % 1) + 1) % 1
  return a < d ? a / d : -1
}
function Counters({ step = 5, w = 526, h = 380 }: { step?: number; w?: number; h?: number }) {
  const p = usePhase(9000, 0.54, step >= 1)
  const cx = w / 2
  const A = { x: 118, n: 9, d: 0.3, lanes: 3 }
  const B = { x: w - 118, n: 6, d: 0.8, lanes: 6 }
  const lanesOf = (T: typeof A) => {
    const rows: number[] = Array(T.lanes).fill(-1)
    for (let j = 0; j < T.n; j++) {
      const f = active(p, T.n, T.d, j)
      if (f >= 0) rows[j % T.lanes] = f
    }
    return rows
  }
  const la = lanesOf(A)
  const lb = lanesOf(B)
  const na = la.filter((f) => f >= 0).length
  const nb = lb.filter((f) => f >= 0).length
  const lane = (rows: number[], x: number, tone: string, on: boolean) =>
    rows.map((f, i) => (
      <Pos key={`${x}${i}`} x={x - 90} y={240 + i * 16} on={on} z={4}>
        <span className="block overflow-hidden rounded-full" style={{ width: 180, height: 10, background: colors.surface2, boxShadow: `inset 0 0 0 1px ${colors.line}` }}>
          <span className="block h-full rounded-full" style={{ width: `${f < 0 ? 0 : Math.max(6, f * 100)}%`, background: tone, opacity: f < 0 ? 0 : 1 }} />
        </span>
      </Pos>
    ))
  return (
    <div className="relative" style={{ width: w, height: h }}>
      <Pos x={cx} y={14} c="x" z={4}>
        <LbCard w={176} h={60} icon={36} row />
      </Pos>
      {/* the arrow goes to the lower counter */}
      <Ar pts={[[cx - 92, 44], [A.x, 44], [A.x, 136]]} on={step >= 1} width={2.6} tone={colors.success} />
      {[A, B].map((T, i) => (
        <Pos key={`t${i}`} x={T.x} y={170} c="xy" z={4}>
          <Srv w={60} />
        </Pos>
      ))}
      {[A, B].map((T, i) => (
        <Pos key={`n${i}`} x={T.x + 36} y={140} c="xy" z={6}>
          <Counter n={step >= 1 ? (i === 0 ? na : nb) : i === 0 ? 2 : 5} size={34} tone={i === 0 ? colors.success : colors.muted} />
        </Pos>
      ))}
      {[A, B].map((T, i) => (
        <Pos key={`l${i}`} x={T.x} y={212} c="x" z={4}>
          <Txt>{i === 0 ? 'Target A' : 'Target B'}</Txt>
        </Pos>
      ))}
      {lane(la, A.x, colors.success, step >= 1)}
      {lane(lb, B.x, colors.brand, step >= 1)}
      <Pos x={B.x} y={h - 12} c="xb" on={step >= 2} z={4}>
        <Label icon={I('Timer')}>Long-Lived Connections</Label>
      </Pos>
      <Pos x={cx} y={102} c="xy" on={step >= 3} z={4}>
        <Label tone="brand" strong icon={I('Settings')}>
          Least Outstanding Requests
        </Label>
      </Pos>
      <Pos x={A.x} y={h - 12} c="xb" on={step >= 4} z={4}>
        <Label icon={I('Activity')}>In-Flight Requests</Label>
      </Pos>
      <Pos x={cx} y={146} c="xy" on={step >= 5} z={4}>
        <Label icon={I('SlidersHorizontal')}>No Manual Tuning</Label>
      </Pos>
    </div>
  )
}

/* ================================================================== T11 · hash(IP), the same client to the same target */

const HY = [50, 150, 250]
const HTONE = [C1, C2, C3]
const HMAP = [0, 1, 0]
function Hash({ step = 2, w = 1000, h = 300 }: { step?: number; w?: number; h?: number }) {
  const built = step >= 2
  const p = usePhase(3 * 1800, (2 + 0.72) / 3, built)
  const c = Math.min(2, Math.floor(p * 3))
  const u = p * 3 - c
  const LB = { x0: 420, x1: 600, y0: 60, y1: 240 }
  const inY = [110, 150, 190]
  const outY = [105, 185, 125]
  const T = [
    { x: 850, y: 95 },
    { x: 850, y: 215 },
  ]
  const pin = (i: number): P => [LB.x0 - 4, inY[i]]
  const pout = (i: number): P => [LB.x1 + 4, outY[i]]
  const tgtRim = (i: number): P => [T[HMAP[i]].x - 38, T[HMAP[i]].y + (i === 0 ? -8 : i === 2 ? 8 : 0)]
  let tok: P | null = null
  let op = 0
  if (u < 0.46) {
    tok = along([[178, HY[c]], [LB.x0 - 16, inY[c]]], smooth(0, 0.42, u))
    op = Math.min(smooth(0, 0.05, u), 1 - smooth(0.4, 0.46, u))
  } else if (u >= 0.5) {
    tok = along([[LB.x1 + 16, outY[c]], tgtRim(c)], smooth(0.5, 0.9, u))
    op = Math.min(smooth(0.5, 0.55, u), 1 - smooth(0.9, 0.97, u))
  }
  return (
    <div className="relative" style={{ width: w, height: h }}>
      {HY.map((y, i) => (
        <Pos key={`cl${i}`} x={84} y={y} c="ry" z={4}>
          <div className="flex flex-col items-end gap-0.5">
            <Txt>Client {i + 1}</Txt>
            <Txt size={14} mono strong={false} tone={HTONE[i]}>
              IP {['A', 'B', 'C'][i]}
            </Txt>
          </div>
        </Pos>
      ))}
      {HY.map((y, i) => (
        <Pos key={`cp${i}`} x={134} y={y} c="xy" z={4}>
          <Person i={i} />
        </Pos>
      ))}
      <Pos x={LB.x0} y={LB.y0} z={4}>
        <LbCard w={LB.x1 - LB.x0} h={LB.y1 - LB.y0} icon={58}>
          <Pos x={0} y={0} on={step >= 1} style={{ position: 'relative', marginTop: 6 }}>
            <Label tone="brand" strong mono>
              hash(IP)
            </Label>
          </Pos>
        </LbCard>
      </Pos>
      {HY.map((y, i) => (
        <Ar key={`ca${i}`} pts={[[178, y], pin(i)]} on={step >= 1} tone={HTONE[i]} width={2} dashed />
      ))}
      {HY.map((_, i) => (
        <Ar key={`ta${i}`} pts={[pout(i), tgtRim(i)]} on={built} tone={HTONE[i]} width={2} dashed />
      ))}
      {T.map((t, i) => (
        <Pos key={`t${i}`} x={t.x} y={t.y} c="xy" z={4}>
          <Srv w={64} glow={built && HMAP[c] === i ? smooth(0.86, 0.92, u) * (1 - smooth(0.97, 1, u)) : 0} tone={HTONE[c]} />
        </Pos>
      ))}
      {T.map((t, i) => (
        <Pos key={`tl${i}`} x={t.x + 46} y={t.y} c="y" z={4}>
          <div className="flex flex-col items-start gap-1.5">
            <Txt>Target {i + 1}</Txt>
            <Pos x={0} y={0} on={built} style={{ position: 'relative' }}>
              <span className="flex gap-1.5">
                {[0, 1, 2]
                  .filter((j) => HMAP[j] === i)
                  .map((j) => (
                    <span key={j} className="grid place-items-center rounded-full font-heading font-semibold" style={{ width: 24, height: 24, fontSize: 14, color: colors.white, background: HTONE[j] }}>
                      {j + 1}
                    </span>
                  ))}
              </span>
            </Pos>
          </div>
        </Pos>
      ))}
      {built && tok && <Token at={tok} n={c + 1} tone={HTONE[c]} op={op} />}
    </div>
  )
}

/* ================================================================== T11-B · four pictures, one per point */

function Disc({ n, tone, size = 26 }: { n: number | string; tone: string; size?: number }) {
  return (
    <span className="grid place-items-center rounded-full font-heading font-semibold leading-none" style={{ width: size, height: size, fontSize: 14, color: colors.white, background: tone }}>
      {n}
    </span>
  )
}

function Sticky({ step = 4, w = 526, h = 380 }: { step?: number; w?: number; h?: number }) {
  const s = useLoop(7000, { still: 1, on: step >= 1 })
  const add = smooth(0.3, 0.7, s)
  const g = usePhase(4200, (1 + 0.75) / 3, step >= 2)
  const PW = (w - 24) / 2
  const PH = (h - 24) / 2
  const X = [8, 16 + PW]
  const Y = [8, 16 + PH]
  /* panel 1: three clients, targets 1-2, then a third target reshuffles them */
  const cy = [72, 114, 156]
  const ty = [70, 112, 154]
  const before = [0, 1, 0]
  const after = [1, 2, 0]
  const line = (ci: number, ti: number): P[] => [[X[0] + 50, Y[0] + cy[ci]], [X[0] + PW - 54, Y[0] + ty[ti]]]
  /* panel 2: three clients behind one gateway IP all land on one target */
  const gk = Math.floor(g * 3) % 3
  const gv = g * 3 - Math.floor(g * 3)
  const gw: P = [X[1] + 112, Y[0] + 112]
  const gPath = (i: number): P[] => [[X[1] + 42, Y[0] + cy[i]], gw, [X[1] + PW - 62, Y[0] + 80]]
  return (
    <div className="relative" style={{ width: w, height: h }}>
      {/* 1 · adding a target reshuffles the mapping */}
      <Zone x={X[0]} y={Y[0]} w={PW} h={PH} on={step >= 1} />
      <Pos x={X[0] + 12} y={Y[0] + 12} on={step >= 1} z={4}>
        <Label tone="brand" strong icon={I('Shuffle')}>
          Reshuffles Mapping
        </Label>
      </Pos>
      {cy.map((y, i) => (
        <Pos key={`c${i}`} x={X[0] + 34} y={Y[0] + y} c="xy" on={step >= 1} z={4}>
          <Disc n={i + 1} tone={HTONE[i]} />
        </Pos>
      ))}
      {ty.map((y, i) => (
        <Pos key={`t${i}`} x={X[0] + PW - 36} y={Y[0] + y} c="xy" on={step >= 1 && (i < 2 || add > 0.02)} z={4} style={{ opacity: step >= 1 ? (i < 2 ? 1 : add) : 0 }}>
          <Srv w={30} />
        </Pos>
      ))}
      <Pos x={X[0] + PW - 12} y={Y[0] + ty[2]} c="xy" on={step >= 1} z={5} style={{ opacity: step >= 1 ? add : 0 }}>
        <span className="grid place-items-center rounded-full" style={{ width: 18, height: 18, background: colors.success, color: colors.white }}>
          {I('Plus', 12)}
        </span>
      </Pos>
      {[0, 1, 2].map((i) => (
        <Ar key={`b${i}`} pts={line(i, before[i])} on={step >= 1} tone={HTONE[i]} width={2} op={1 - add} flow={false} />
      ))}
      {[0, 1, 2].map((i) => (
        <Ar key={`a${i}`} pts={line(i, after[i])} on={step >= 1} tone={HTONE[i]} width={2} op={add} flow={false} />
      ))}
      {/* 2 · one gateway IP overloads one target */}
      <Zone x={X[1]} y={Y[0]} w={PW} h={PH} on={step >= 2} />
      <Pos x={X[1] + 12} y={Y[0] + 12} on={step >= 2} z={4}>
        <Label tone="brand" strong icon={I('Router')}>
          Gateway IP
        </Label>
      </Pos>
      {cy.map((y, i) => (
        <Pos key={`g${i}`} x={X[1] + 30} y={Y[0] + y} c="xy" on={step >= 2} z={4}>
          <Disc n={i + 1} tone={HTONE[i]} size={24} />
        </Pos>
      ))}
      {cy.map((y, i) => (
        <Ar key={`ga${i}`} pts={[[X[1] + 46, Y[0] + y], [gw[0] - 24, gw[1] + (i - 1) * 8]]} on={step >= 2} width={1.8} flow={false} tone={colors.muted} />
      ))}
      <Pos x={gw[0]} y={gw[1]} c="xy" on={step >= 2} z={4}>
        <span className="grid place-items-center rounded-full" style={{ ...TILE_SKIN, width: 40, height: 40, color: colors.brandDark }}>
          {I('Router', 20)}
        </span>
      </Pos>
      <Ar pts={[[gw[0] + 24, gw[1] - 6], [X[1] + PW - 62, Y[0] + 80]]} on={step >= 2} width={3.5} tone={colors.danger} head={11} />
      <Pos x={X[1] + PW - 40} y={Y[0] + 80} c="xy" on={step >= 2} z={4}>
        <Srv w={34} tone={colors.danger} glow={step >= 2 ? 0.75 : 0} />
      </Pos>
      <Pos x={X[1] + PW - 40} y={Y[0] + 148} c="xy" on={step >= 2} z={4} style={{ opacity: step >= 2 ? 0.55 : 0 }}>
        <Srv w={34} />
      </Pos>
      {step >= 2 && <Token at={along(gPath(gk), smooth(0.05, 0.9, gv))} size={14} tone={HTONE[gk]} op={Math.min(smooth(0.02, 0.1, gv), 1 - smooth(0.88, 0.95, gv))} />}
      {/* 3 · AWS: ALB cookie stickiness, NLB source-IP stickiness */}
      <Zone x={X[0]} y={Y[1]} w={PW} h={PH} on={step >= 3} />
      {[
        { tag: 'ALB', logo: albLogo, icon: 'Cookie', text: 'Cookie-Based Stickiness' },
        { tag: 'NLB', logo: nlbLogo, icon: 'Fingerprint', text: 'Source-IP Stickiness' },
      ].map((r, i) => (
        <Pos key={r.tag} x={X[0] + 14} y={Y[1] + 16 + i * 82} on={step >= 3} z={4}>
          <div className="flex flex-col items-start gap-2">
            <span className="flex items-center gap-2">
              <Logo src={r.logo} w={26} />
              <Txt>{r.tag}</Txt>
              <span className="grid place-items-center rounded-full" style={{ width: 26, height: 26, background: colors.surface2, color: colors.brandDark }}>
                {I(r.icon, 15)}
              </span>
            </span>
            <Label tone="lift" strong>
              {r.text}
            </Label>
          </div>
        </Pos>
      ))}
      {/* 4 · no shared session store needed */}
      <Zone x={X[1]} y={Y[1]} w={PW} h={PH} on={step >= 4} />
      <Pos x={X[1] + 12} y={Y[1] + 12} on={step >= 4} z={4}>
        <Label tone="brand" strong icon={I('Database')}>
          Shared Session Stores
        </Label>
      </Pos>
      {[0, 1].map((i) => (
        <Pos key={`ss${i}`} x={X[1] + 52 + i * 148} y={Y[1] + 98} c="xy" on={step >= 4} z={4}>
          <span className="flex items-center gap-1.5">
            {i === 1 && <Disc n={2} tone={HTONE[1]} size={22} />}
            <Srv w={34} />
            {i === 0 && <Disc n={1} tone={HTONE[0]} size={22} />}
          </span>
        </Pos>
      ))}
      <Pos x={X[1] + PW / 2} y={Y[1] + 146} c="xy" on={step >= 4} z={4}>
        <span className="relative block" style={{ opacity: 0.55 }}>
          <CvIcon name="database" w={32} />
        </span>
      </Pos>
      <Pos x={X[1] + PW / 2 + 26} y={Y[1] + 136} c="xy" on={step >= 4} z={5}>
        <NoMark size={22} />
      </Pos>
    </div>
  )
}

/* ================================================================== the lead slide with a two-sentence lead (one line each) */

const FIG: Record<string, (p: { step?: number; w?: number; h?: number }) => ReactNode> = { B_StaticDynamic: StaticDynamic, B_Hash: Hash }

function LeadSlide({ lesson, id, kicker, title, lines, figure, w, h, steps }: { lesson: string; id: string; kicker: string; title: string; lines: string[]; figure: string; w: number; h: number; steps: number }) {
  const step = useBuild(steps + 1)
  const F = FIG[figure]
  return (
    <Card id={id} kicker={kicker} title={title} lesson={lesson}>
      <div className="flex flex-col items-center gap-5" style={{ width: BOX_W }}>
        <p className="text-center text-[20px] leading-snug" style={{ color: colors.ink, maxWidth: BOX_W }}>
          {lines.map((l, i) => (
            <span key={i} className="block" style={{ textWrap: 'balance', marginTop: i ? 6 : 0 } as CSSProperties}>
              {l}
            </span>
          ))}
        </p>
        <Stage w={w} h={h}>
          <F step={step} w={w} h={h} />
        </Stage>
      </div>
    </Card>
  )
}

export const figures = {
  B_StaticDynamic: StaticDynamic,
  B_Quad: Quad,
  B_Flow: Flow,
  B_Smooth: Smooth,
  B_Listener: Listener,
  B_Counters: Counters,
  B_Hash: Hash,
  B_Sticky: Sticky,
}
export const slides = { B_LeadSlide: LeadSlide }
export const css = ''
