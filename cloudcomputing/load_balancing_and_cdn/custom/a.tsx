import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { TILE_SKIN } from '@/decks/figures/card'
import { Arrow, Label, STILL, REDUCED, useLoop } from '@/decks/figures/scene'
import { NET, NoMark } from '@/decks/figures/net/frames'
import { CvIcon } from '@/decks/figures/net/fx'
import * as K from '@/decks/figures/d3/kit'
import { Diagram } from '@/engine/Diagram'
import { Icon } from '@/engine/icon'
import type { DiagramSpec } from '@/engine/types'
import albLogo from '../images/aws-alb.svg'
import nlbLogo from '../images/aws-nlb.svg'
import elbLogo from '../images/aws-elb.svg'
import nginxLogo from '../images/nginx.svg'
import haproxyLogo from '../images/haproxy.png'

/*
 * Builder A · Load Balancing & CDN, sections 1 and 2 (T01 to T07-B).
 * Every figure takes the slide's `step` (0 = nothing yet, n = whole) and holds its final frame on `?still`.
 * Loops are CSS (class `a-loop`), stopped by `.cc-still` / `.deck-thumb` / reduced motion.
 * Styling is inline on purpose: Tailwind only scans the engine's own src/, so an arbitrary
 * class written here would not exist in the build.
 */

const EASE = 'cubic-bezier(0.22,1,0.36,1)'
const LB = 'Network'
const SRV = 'lib:server-stack'
const held = () => STILL || REDUCED

/** shown from its step on: fade and a 6px rise, the diagram's own reveal */
function Show({ on, children, style, delay = 0 }: { on: boolean; children: ReactNode; style?: CSSProperties; delay?: number }) {
  const instant = useInstant()
  return (
    <div
      style={{
        opacity: on ? 1 : 0,
        transform: on ? 'none' : 'translateY(6px)',
        transition: instant ? 'none' : `opacity 360ms ${EASE} ${on ? delay : 0}ms, transform 360ms ${EASE} ${on ? delay : 0}ms`,
        pointerEvents: on ? undefined : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** absolute, centred on (x, y) */
const At = ({ x, y, children, z = 6, style }: { x: number; y: number; children: ReactNode; z?: number; style?: CSSProperties }) => (
  <div style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', zIndex: z, ...style }}>{children}</div>
)

/** a w x h frame centred in the stage; children are placed in figure px */
const Frame = ({ w, h, children }: { w: number; h: number; children: ReactNode }) => (
  <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
    <div style={{ position: 'relative', width: w, height: h }}>{children}</div>
  </div>
)

const flex = (gap: number, dir: 'row' | 'column' = 'row', extra: CSSProperties = {}): CSSProperties => ({ display: 'flex', flexDirection: dir, alignItems: 'center', gap, ...extra })
const heading = (size: number, color: string = colors.ink): CSSProperties => ({ fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 600, fontSize: size, lineHeight: 1.3, color })

/** a round badge with an icon: the tick on a server still serving, the + and − of a pool */
function Badge({ icon, tone, size = 28 }: { icon: string; tone: string; size?: number }) {
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 999, background: tone, color: colors.white, boxShadow: `0 0 0 3px ${colors.white}, 0 8px 16px -8px rgba(16,32,58,0.5)` }}>
      <Icon name={icon} size={Math.round(size * 0.6)} style={{ strokeWidth: 3 }} />
    </span>
  )
}

/** the load balancer disc, drawn the way the diagram draws a `disc` node */
function LbDisc({ size, tone = NET.gateway }: { size: number; tone?: string }) {
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 999, background: `linear-gradient(180deg, ${colors.white} 0%, ${colors.surface2} 100%)`, boxShadow: `inset 0 0 0 2.5px ${tone}, 0 10px 20px -12px rgba(16,32,58,0.5)`, color: tone }}>
      <Icon name={LB} size={Math.round(size * 0.5)} />
    </span>
  )
}

/* G1/G2 (user, 2026-11-06): a named AWS balancer is drawn with its official icon, aspect kept (R8.5);
   in tsx the `images/` path is not rewritten by the build, so a diagram node takes the imported URL */
const ELB_ICON = `img:${elbLogo}`

/** an official logo or wordmark, its own aspect kept */
const Logo = ({ src, w, h, style }: { src: string; w?: number; h?: number; style?: CSSProperties }) => (
  <img src={src} alt="" aria-hidden draggable={false} style={{ display: 'block', width: w ?? 'auto', height: h ?? 'auto', userSelect: 'none', ...style }} />
)

/** an AWS resource mark (ALB, NLB) on a white tile, drawn the way the diagram draws a `tile` node; `tone` keeps a lane's ring */
function LogoTile({ src, size, tone }: { src: string; size: number; tone?: string }) {
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: Math.round(size * 0.27), ...TILE_SKIN, ...(tone ? { boxShadow: `inset 0 0 0 2.5px ${tone}, 0 10px 20px -12px rgba(16,32,58,0.5)` } : {}) }}>
      <Logo src={src} w={Math.round(size * 0.76)} />
    </span>
  )
}

/* ───────────────────────── T01 · one server vs two servers ───────────────────────── */

const SPOF: DiagramSpec = {
  type: 'diagram',
  w: 566,
  h: 304,
  boxes: [
    { id: 'one', label: 'One Server', kind: 'zone', icon: 'Server', x: 10, y: 8, w: 266, h: 288 },
    { id: 'two', label: 'Two Servers', kind: 'zone', icon: 'Server', x: 290, y: 8, w: 266, h: 288 },
  ],
  nodes: [
    { id: 'b1', x: 143, y: 90, icon: 'lib:laptop', shape: 'bare', size: 62, label: 'Browser' },
    { id: 's0', x: 143, y: 200, icon: SRV, shape: 'bare', size: 56, label: 'Server' },
    { id: 'b2', x: 423, y: 90, icon: 'lib:laptop', shape: 'bare', size: 62, label: 'Browser' },
    { id: 'r1', x: 356, y: 200, icon: SRV, shape: 'bare', size: 56, label: 'Server 1' },
    { id: 'r2', x: 490, y: 200, icon: SRV, shape: 'bare', size: 56, label: 'Server 2' },
  ],
  arrows: [
    { from: 'b1', to: 's0' },
    { from: 'b2', to: 'r1', tone: 'muted', dashed: true },
    { from: 'b2', to: 'r2', tone: 'good' },
  ],
  packets: [{ path: ['b2', 'r2'], tone: 'good' }],
  steps: [['one', 'b1', 's0', 'b1>s0'], [], [], ['two', 'b2', 'r1', 'r2', 'b2>r1', 'b2>r2', 'packet:0']],
}

function A_Spof({ step }: { step: number }) {
  return (
    <Frame w={566} h={304}>
      <Diagram spec={SPOF} step={step} />
      {/* the failed server: a red cross through it */}
      <At x={143} y={200} z={8}>
        <NoMark size={38} on={step >= 2} />
      </At>
      <At x={143} y={270} z={8}>
        <Show on={step >= 3}>
          <Label strong tone="bad" icon={<Icon name="CircleX" size={14} />}>
            No Second Server
          </Label>
        </Show>
      </At>
      <At x={356} y={200} z={8}>
        <NoMark size={38} on={step >= 4} />
      </At>
      {/* the second server, still green */}
      <At x={514} y={176} z={8}>
        <Show on={step >= 4} delay={500}>
          <Badge icon="Check" tone={colors.success} size={26} />
        </Show>
      </At>
    </Frame>
  )
}

/* ───────────────────────── T02-B · ELB in the EC2 console; the pool grows and shrinks ───────────────────────── */

const POOL: DiagramSpec = {
  type: 'diagram',
  w: 550,
  h: 312,
  nodes: [
    { id: 'u', x: 62, y: 70, icon: 'lib:laptop', shape: 'bare', size: 58, label: 'Users' },
    { id: 'lb', x: 262, y: 70, icon: ELB_ICON, shape: 'bare', size: 54, label: 'Load Balancer', labelPos: 'right' },
    { id: 's1', x: 82, y: 232, icon: SRV, shape: 'bare', size: 50, label: 'Server 1' },
    { id: 's2', x: 196, y: 232, icon: SRV, shape: 'bare', size: 50, label: 'Server 2' },
    { id: 's3', x: 310, y: 232, icon: SRV, shape: 'bare', size: 50, label: 'Server 3' },
  ],
  arrows: [
    { from: 'u', to: 'lb' },
    { from: 'lb', to: 's1' },
    { from: 'lb', to: 's2' },
    { from: 'lb', to: 's3' },
  ],
  packets: [
    { path: ['u', 'lb', 's1'], dur: 2.8 },
    { path: ['u', 'lb', 's3'], dur: 2.8 },
    { path: ['u', 'lb', 's2'], dur: 2.8 },
  ],
  steps: [{ show: ['u', 'lb', 's1', 's2', 's3', 'u>lb', 'lb>s1', 'lb>s2', 'lb>s3', 'packet:0', 'packet:1'], dim: ['lb>s2', 's2'] }, ['packet:2'], []],
}

function A_Console({ step }: { step: number }) {
  const still = held()
  const lit = step === 3 && !still
  /* server 4's arrow: from the balancer disc (262, 70), r 29, to the server's top (424, 204) */
  const a = Math.atan2(204 - 70, 424 - 262)
  const x1 = 262 + Math.cos(a) * 32
  const y1 = 70 + Math.sin(a) * 32
  return (
    <Frame w={566} h={380}>
      {/* the console window */}
      <div style={{ position: 'absolute', left: 8, top: 8, width: 550, height: 364, borderRadius: 16, ...TILE_SKIN }}>
        <div style={{ ...flex(10), height: 46, padding: '0 16px', borderBottom: `1px solid ${colors.line}`, background: colors.surface, borderRadius: '16px 16px 0 0' }}>
          <span style={flex(6)}>
            {[colors.danger, colors.warning, colors.success].map((c) => (
              <span key={c} style={{ width: 10, height: 10, borderRadius: 99, background: c, opacity: 0.8 }} />
            ))}
          </span>
          <Show on={step >= 3} style={flex(8, 'row', { marginLeft: 6 })}>
            <CvIcon name="aws-word" w={42} />
            <Label strong tone={lit ? 'solid' : 'brand'}>EC2 Console</Label>
            <Icon name="ChevronRight" size={16} style={{ color: colors.muted }} />
            <Label strong tone={lit ? 'solid' : 'brand'}>Elastic Load Balancing</Label>
          </Show>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 8, top: 56, width: 550, height: 312 }}>
        <Diagram spec={POOL} step={Math.min(step, 3)} />
        {/* one of the identical servers fails; the others carry on */}
        <At x={196} y={232} z={8}>
          <NoMark size={34} on={step === 1 && !still} />
        </At>
        {/* server 4 joins and leaves: capacity changes, no code changes */}
        <Show on={step >= 2} style={{ position: 'absolute', inset: 0, zIndex: 4 }}>
          <div className={still ? undefined : 'a-loop a-pool'} style={{ position: 'absolute', inset: 0 }}>
            <Arrow x1={x1} y1={y1} x2={424} y2={204} on={step >= 2} tone={colors.brand} />
            <At x={424} y={232}>
              <CvIcon name="server-stack" w={52} />
            </At>
            <At x={424} y={275}>
              <Label strong>Server 4</Label>
            </At>
          </div>
          <At x={500} y={232}>
            <span style={flex(10, 'column')}>
              <Badge icon="Plus" tone={colors.success} size={26} />
              <Badge icon="Minus" tone={colors.danger} size={26} />
            </span>
          </At>
        </Show>
      </div>
    </Frame>
  )
}

/* ───────────────────────── T02-C · billed hourly plus traffic processed ───────────────────────── */

function MeterCard({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  return (
    <div style={{ ...flex(8, 'column'), width: 172, height: 156, padding: '14px 8px 12px', borderRadius: 16, ...TILE_SKIN }}>
      <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>{children}</div>
      <Label strong icon={<Icon name={icon} size={14} />}>
        {title}
      </Label>
    </div>
  )
}

const Op = ({ icon }: { icon: string }) => (
  <span style={{ display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: 99, background: colors.surface2, color: colors.brandDark, flexShrink: 0 }}>
    <Icon name={icon} size={18} style={{ strokeWidth: 2.6 }} />
  </span>
)

/*
 * THE BALANCE, AS A BODY (user, 2026-11-06: "physics-based motion: weight shift, inertia, damped settling").
 * The beam is an underdamped rotational spring: θ'' = -k(θ - θ*) - cθ'. The weight shifts from one pan to the
 * other (θ* glides to the other side over 0.9s), the beam swings past it on its inertia and settles; then the
 * weight shifts back. Integrated once at load over a few laps, so the lap stored is the steady periodic one
 * (a seamless loop, no reset). The tilt goes into ClayBalance's own `tilt`, which turns the beam about its pivot
 * and keeps the pans hanging level, instead of rocking the whole drawing.
 */
const BAL_MS = 6000
const BAL_N = 240
const BAL_A = 6
const BAL = (() => {
  const T = BAL_MS / 1000
  const dt = 1 / 600
  const k = 24
  const c = 2.4
  const shift = 0.9
  const ss = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x))
  const target = (t: number) => {
    const u = t % T
    return u < T / 2 ? -BAL_A + 2 * BAL_A * ss(u / shift) : BAL_A - 2 * BAL_A * ss((u - T / 2) / shift)
  }
  let th = BAL_A
  let w = 0
  const out: number[] = []
  const laps = 4
  const per = Math.round(T / dt)
  for (let i = 0; i < laps * per; i++) {
    const t = i * dt
    if (i >= (laps - 1) * per && (i - (laps - 1) * per) % Math.round(per / BAL_N) === 0 && out.length < BAL_N) out.push(th)
    w += (-k * (th - target(t)) - c * w) * dt
    th += w * dt
  }
  return out
})()
/* the frame held on harness URLs: the beam passing level on its first swing, as the drawing stood before */
const BAL_STILL = (() => {
  for (let i = 0; i < BAL_N / 2; i++) if (BAL[i] < 0 && BAL[i + 1] >= 0) return (i - BAL[i] / (BAL[i + 1] - BAL[i])) / BAL_N
  return 0
})()
const balTilt = (p: number) => {
  const x = (((p % 1) + 1) % 1) * BAL_N
  const i = Math.floor(x)
  const f = x - i
  return BAL[i % BAL_N] * (1 - f) + BAL[(i + 1) % BAL_N] * f
}

/** incoming traffic (blue) runs into the meter, processed traffic (green) leaves it; the needle rides the flow */
function TrafficMeter({ on }: { on: boolean }) {
  const still = held()
  const p = useLoop(4800, { mode: 'sawtooth', still: 0, on, steps: 144 })
  const value = 0.62 + 0.07 * Math.sin(2 * Math.PI * p)
  const lane = (kind: 'in' | 'out') =>
    [0, 1, 2].map((i) => (
      <span
        key={`${kind}${i}`}
        className={still ? undefined : `a-loop a-${kind}`}
        style={{
          position: 'absolute',
          left: kind === 'in' ? -4 : 116,
          top: 44,
          width: 10,
          height: 10,
          borderRadius: 99,
          background: kind === 'in' ? colors.brand : colors.success,
          boxShadow: `0 0 0 2px ${colors.white}`,
          transform: `translateX(${kind === 'in' ? 8 + i * 12 : 4 + i * 11}px)`,
          animationDelay: `${-i * 0.4 - (kind === 'out' ? 0.2 : 0)}s`,
        }}
      />
    ))
  return (
    <div style={{ position: 'relative', width: 156, height: 96 }}>
      {lane('in')}
      {lane('out')}
      <div style={{ position: 'absolute', left: 38, top: 8, zIndex: 2 }}>
        <K.ClayMeter w={80} value={value} />
      </div>
    </div>
  )
}

function A_Billing({ step }: { step: number }) {
  const still = held()
  const bal = useLoop(BAL_MS, { mode: 'sawtooth', still: BAL_STILL, on: step >= 2, steps: BAL_N })
  return (
    <Frame w={566} h={380}>
      {/* the ALB = hourly + traffic processed */}
      <Show on={step >= 1} style={{ position: 'absolute', left: 14, top: 30, width: 538 }}>
        <div style={flex(0, 'row', { justifyContent: 'space-between' })}>
          <div style={{ ...flex(10, 'column'), width: 112 }}>
            <LogoTile src={albLogo} size={82} />
            <span style={{ ...heading(15), textAlign: 'center' }}>Application Load Balancer</span>
          </div>
          <Op icon="Equal" />
          <MeterCard title="Hourly" icon="Clock">
            {/* a working clock: the long hand goes round once a lap, the short hand once in twelve */}
            <div className={still ? undefined : 'a-clock'}>
              <K.ClayClock w={80} turn={0.15} />
            </div>
          </MeterCard>
          <Op icon="Plus" />
          <MeterCard title="Traffic Processed" icon="Activity">
            <TrafficMeter on={step >= 1} />
          </MeterCard>
        </div>
      </Show>
      {/* choosing a type is also a cost decision */}
      <Show on={step >= 2} style={{ position: 'absolute', left: 14, top: 228, width: 538 }}>
        <div style={{ ...flex(22, 'row', { justifyContent: 'center' }), height: 120, borderRadius: 16, background: `${colors.warning}12`, boxShadow: `inset 0 0 0 1.5px ${colors.warning}66` }}>
          <Label strong tone="brand" icon={<Icon name="Layers" size={14} />}>
            Load Balancer Type
          </Label>
          <div>
            <K.ClayBalance w={126} tilt={balTilt(bal)} />
          </div>
          <Label strong tone="warn" icon={<Icon name="Tag" size={14} />}>
            Cost Decision
          </Label>
        </div>
      </Show>
    </Frame>
  )
}

/* ───────────────────────── T03 · two servers growing to four behind the same balancer ───────────────────────── */

const GROW: DiagramSpec = {
  type: 'diagram',
  w: 546,
  h: 380,
  nodes: [
    { id: 'u', x: 52, y: 96, icon: 'lib:routing-visitor', shape: 'person', size: 110, label: 'Users' },
    { id: 'lb', x: 199, y: 96, icon: ELB_ICON, shape: 'bare', size: 54, label: 'Load Balancer', labelPos: 'above' },
    { id: 's1', x: 58, y: 240, icon: SRV, shape: 'bare', size: 50, label: 'Server 1' },
    { id: 's2', x: 152, y: 240, icon: SRV, shape: 'bare', size: 50, label: 'Server 2' },
    { id: 's3', x: 246, y: 240, icon: SRV, shape: 'bare', size: 50, label: 'Server 3' },
    { id: 's4', x: 340, y: 240, icon: SRV, shape: 'bare', size: 50, label: 'Server 4' },
  ],
  chips: [
    { id: 'cost', x: 450, y: 240, text: 'Compute Cost', icon: 'Tag', tone: 'warn' },
    { id: 't2', x: 105, y: 344, text: 'Two Servers', icon: 'Server', tone: 'plain' },
    { id: 't4', x: 360, y: 344, text: 'Four Servers', icon: 'Server', tone: 'brand' },
  ],
  arrows: [
    { from: 'u', to: 'lb' },
    { from: 'lb', to: 's1' },
    { from: 'lb', to: 's2' },
    { from: 'lb', to: 's3', tone: 'good' },
    { from: 'lb', to: 's4', tone: 'good' },
    { id: 'time', from: 't2', to: 't4', tone: 'muted' },
  ],
  packets: [
    { path: ['u', 'lb', 's2'], dur: 2.6 },
    { path: ['u', 'lb', 's1'], dur: 2.6 },
    { path: ['u', 'lb', 's3'], dur: 2.6, tone: 'good' },
    { path: ['u', 'lb', 's4'], dur: 2.6, tone: 'good' },
  ],
  steps: [
    { show: ['u', 'lb', 's1', 's2', 'u>lb', 'lb>s1', 'lb>s2', 't2', 'packet:0'], dim: ['s1', 'lb>s1'] },
    { show: ['s3', 's4', 'lb>s3', 'lb>s4', 't4', 'time', 'packet:1', 'packet:2', 'packet:3'], lit: ['s3', 's4'] },
    { show: [], lit: ['u', 'u>lb', 'lb'] },
    { show: ['cost'], lit: ['cost'] },
  ],
}

function A_Growth({ step }: { step: number }) {
  return (
    <Frame w={546} h={380}>
      <Diagram spec={GROW} step={step} />
      {/* step 1 only: one server is being patched, traffic keeps reaching the healthy one */}
      <At x={58} y={190} z={8}>
        <Show on={step === 1 && !held()}>
          <Label strong tone="warn" icon={<Icon name="Wrench" size={14} />}>
            Patching
          </Label>
        </Show>
      </At>
    </Frame>
  )
}

/* ───────────────────────── T04 · the 2x2 type grid ───────────────────────── */

type Cell = { text: string; icon: string }
const GRID: { row: string; sub: string; cells: [Cell, Cell] }[] = [
  { row: 'Layer 4', sub: 'IP and Port', cells: [{ text: 'Raw TCP/UDP Speed', icon: 'Zap' }, { text: 'Internal Calls', icon: 'ArrowLeftRight' }] },
  { row: 'Layer 7', sub: 'HTTP Content', cells: [{ text: 'Public Websites', icon: 'Globe' }, { text: 'An Application Calling a Backend Service', icon: 'Server' }] },
]

function A_TypeGrid({ step }: { step: number }) {
  const still = held()
  const lit = (k: number) => !still && step === k
  const ring = (on: boolean): CSSProperties => ({ boxShadow: on ? `0 0 0 3px ${NET.lit}` : 'none', transition: `box-shadow 420ms ${EASE}` })
  const head = (on: boolean, l: boolean, icon: string, text: string, tone: string) => (
    <Show on={on} style={{ height: '100%' }}>
      <div style={{ ...flex(8, 'row', { justifyContent: 'center' }), ...heading(17, colors.white), height: '100%', borderRadius: 14, background: tone, ...ring(l) }}>
        <Icon name={icon} size={18} />
        {text}
      </div>
    </Show>
  )
  return (
    <Frame w={566} h={380}>
      <div style={{ position: 'absolute', left: 14, top: 14, width: 538, height: 352, display: 'grid', gridTemplateColumns: '128px 1fr 1fr', gridTemplateRows: '56px 1fr 1fr', gap: 10 }}>
        <div />
        {head(step >= 2, lit(2), 'Globe', 'Internet-Facing', colors.brand)}
        {head(step >= 3, lit(3), 'Lock', 'Internal', colors.tealDark)}
        {GRID.map((r, ri) => [
          <Show key={`h${ri}`} on={step >= 1} delay={ri * 120} style={{ height: '100%' }}>
            <div style={{ ...flex(6, 'column', { alignItems: 'flex-start', justifyContent: 'center' }), height: '100%', padding: '0 16px', borderRadius: 14, background: colors.brandDeep, ...ring(lit(1)) }}>
              <span style={{ ...flex(8), ...heading(18, colors.white) }}>
                <Icon name="Layers" size={18} />
                {r.row}
              </span>
              <span style={{ fontSize: 14, fontWeight: 500, color: colors.surface2 }}>{r.sub}</span>
            </div>
          </Show>,
          ...r.cells.map((c, ci) => (
            <Show key={`c${ri}${ci}`} on={step >= 2 + ci} delay={120 + ri * 120} style={{ height: '100%' }}>
              <div style={{ ...flex(10, 'column', { justifyContent: 'center', textAlign: 'center' }), height: '100%', padding: '0 12px', borderRadius: 14, ...TILE_SKIN }}>
                <span className={still ? undefined : 'a-loop a-bob'} style={{ display: 'grid', placeItems: 'center', width: 44, height: 44, flexShrink: 0, borderRadius: 12, background: ci === 0 ? colors.surface2 : `${colors.teal}1F`, color: ci === 0 ? colors.brandDark : colors.tealDark, animationDelay: `${-(ri * 2 + ci) * 0.7}s` }}>
                  <Icon name={c.icon} size={22} />
                </span>
                <span style={heading(16)}>{c.text}</span>
              </div>
            </Show>
          )),
        ])}
      </div>
    </Frame>
  )
}

/* ───────────────────────── T04-B · one from each axis; by deployment ───────────────────────── */

function Pick({ text, icon, on }: { text: string; icon: string; on: boolean }) {
  return (
    <span style={{ ...flex(7), ...heading(15, on ? colors.white : colors.muted), padding: '5px 12px', borderRadius: 999, background: on ? colors.brand : colors.surface, boxShadow: on ? 'none' : `inset 0 0 0 1.5px ${colors.line}` }}>
      <Icon name={icon} size={15} />
      {text}
    </span>
  )
}

const Axis = ({ children }: { children: ReactNode }) => <div style={{ ...flex(8), padding: '8px 10px', borderRadius: 14, background: colors.surface, boxShadow: `inset 0 0 0 1px ${colors.line}` }}>{children}</div>

function DeployCard({ art, text, focus, tag }: { art: ReactNode; text: string; focus?: boolean; tag?: ReactNode }) {
  return (
    <div style={{ position: 'relative', ...flex(12, 'column'), width: 312, height: 236, padding: '18px 22px 0', borderRadius: 18, ...TILE_SKIN, ...(focus ? { boxShadow: `inset 0 0 0 2.5px ${colors.accent}, 0 14px 26px -16px ${colors.accent}` } : {}) }}>
      <div style={{ height: 96, display: 'grid', placeItems: 'center' }}>{art}</div>
      <span style={{ ...heading(18), textAlign: 'center' }}>{text}</span>
      {/* the tag stays inside the card: it wraps within the card's inner width instead of running past its edges */}
      {tag && <div style={{ position: 'absolute', left: 18, right: 18, bottom: 14, display: 'flex', justifyContent: 'center' }}>{tag}</div>}
    </div>
  )
}

function A_Deploy({ step }: { step: number }) {
  const still = held()
  const bob = (d = 0): { className?: string; style: CSSProperties } => ({ className: still ? undefined : 'a-loop a-bob', style: { animationDelay: `${d}s` } })
  return (
    <Frame w={1060} h={380}>
      {/* one from each axis */}
      <Show on={step >= 1} style={{ position: 'absolute', left: 0, top: 12, width: 1060 }}>
        <div style={flex(14, 'row', { justifyContent: 'center' })}>
          <Axis>
            <Pick text="Layer 4" icon="Layers" on={false} />
            <Pick text="Layer 7" icon="Layers" on />
          </Axis>
          <Op icon="Plus" />
          <Axis>
            <Pick text="Internet-Facing" icon="Globe" on />
            <Pick text="Internal" icon="Lock" on={false} />
          </Axis>
          <Op icon="Equal" />
          <span style={{ ...flex(10), ...heading(16), padding: '8px 16px 8px 10px', borderRadius: 14, ...TILE_SKIN }}>
            <LbDisc size={36} />
            Internet-Facing Layer 7 Balancer
          </span>
        </div>
      </Show>
      {/* by deployment, split at its own clauses */}
      <Show on={step >= 2} style={{ position: 'absolute', left: 0, top: 84, width: 1060, display: 'flex', justifyContent: 'center' }}>
        <Label strong tone="brand" icon={<Icon name="Boxes" size={14} />}>
          By Deployment: Load Balancers Can Also Be
        </Label>
      </Show>
      <div style={{ position: 'absolute', left: 30, top: 126, width: 1000, display: 'flex', justifyContent: 'space-between' }}>
        <Show on={step >= 2}>
          <DeployCard
            text="Hardware Appliances"
            art={
              <div {...bob()}>
                <K.ClayServerUnit w={150} />
              </div>
            }
          />
        </Show>
        <Show on={step >= 2} delay={160}>
          <DeployCard
            text="Software (Like NGINX Or HAProxy)"
            art={
              <div {...bob(-0.9)}>
                <div style={flex(14, 'column')}>
                  <Logo src={nginxLogo} w={136} />
                  <Logo src={haproxyLogo} w={150} />
                </div>
              </div>
            }
          />
        </Show>
        <Show on={step >= 3}>
          <DeployCard
            focus
            text="Cloud-Managed Services (Like AWS ELB)"
            art={
              <div {...bob(-1.6)}>
                <Logo src={elbLogo} w={84} />
              </div>
            }
            tag={
              <Label strong tone="solid" style={{ background: colors.accent, boxShadow: `inset 0 0 0 1.5px ${colors.accent}, 0 8px 16px -10px rgba(16,32,58,0.35)`, whiteSpace: 'normal', maxWidth: 232, borderRadius: 12, padding: '5px 12px 5px 6px', lineHeight: 1.3 }} icon={<Icon name="Star" size={14} />}>
                <span style={{ textAlign: 'center' }}>
                  This Session Focuses On <span style={{ whiteSpace: 'nowrap' }}>Cloud-Managed</span>
                </span>
              </Label>
            }
          />
        </Show>
      </div>
    </Frame>
  )
}

/* ───────────────────────── T05 · the sealed packet and the opened packet ───────────────────────── */

function Envelope({ open, seal }: { open: boolean; seal?: boolean }) {
  return (
    <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 66, height: 50, borderRadius: 12, ...TILE_SKIN, color: colors.brandDark }}>
      <Icon name={open ? 'MailOpen' : 'Mail'} size={30} />
      {seal && (
        <span style={{ position: 'absolute', right: -9, top: -9 }}>
          <Badge icon="Lock" tone={NET.lock} size={22} />
        </span>
      )}
    </span>
  )
}

/** one lane: client (70) → balancer (260) → server (452) on y = 236; the packet rides above it on y = 140 */
function Lane({ title, tone, name, logo, l7, still }: { title: string; tone: string; name: string; logo: string; l7: boolean; still: boolean }) {
  const Y = 196
  return (
    <div style={{ position: 'absolute', inset: 0, borderRadius: 18, background: `${tone}0A`, boxShadow: `inset 0 0 0 1.5px ${tone}55` }}>
      <div style={{ position: 'absolute', left: 16, top: 16 }}>
        <Label strong tone="solid" style={{ background: tone, boxShadow: `inset 0 0 0 1.5px ${tone}` }} icon={<Icon name="Layers" size={14} />}>
          {title}
        </Label>
      </div>
      <At x={70} y={Y}>
        <CvIcon name="laptop" w={70} />
      </At>
      <At x={70} y={Y + 52}>
        <Label strong>Client</Label>
      </At>
      <At x={260} y={Y}>
        <LogoTile src={logo} size={60} tone={tone} />
      </At>
      <At x={260} y={Y + 54}>
        <Label strong>{name}</Label>
      </At>
      <At x={452} y={Y}>
        <CvIcon name="server-stack" w={56} />
      </At>
      <At x={452} y={Y + 52}>
        <Label strong>Server</Label>
      </At>
      <Arrow x1={112} y1={Y} x2={226} y2={Y} tone={tone} />
      <Arrow x1={294} y1={Y} x2={420} y2={Y} tone={tone} />
      {!l7 ? (
        /* Layer 4: the packet passes through sealed; only the IP and port outside are read */
        <div className={still ? undefined : 'a-loop a-l4'} style={{ position: 'absolute', left: 0, top: 0, transform: 'translate(360px, 104px)', zIndex: 7 }}>
          <div style={{ ...flex(6, 'column'), transform: 'translate(-50%, -50%)' }}>
            <Envelope open={false} seal />
            <span style={flex(5)}>
              <Label strong tone="brand">IP</Label>
              <Label strong tone="brand">Port</Label>
            </span>
          </div>
        </div>
      ) : (
        <>
          {/* Layer 7: the packet stops at the balancer, opens, is read, and goes on */}
          <div className={still ? undefined : 'a-loop a-l7'} style={{ position: 'absolute', left: 0, top: 0, transform: 'translate(260px, 92px)', zIndex: 7 }}>
            <div style={{ position: 'relative', transform: 'translate(-50%, -50%)' }}>
              <span className={still ? undefined : 'a-loop a-l7-shut'} style={{ position: 'absolute', inset: 0, opacity: still ? 0 : undefined }}>
                <Envelope open={false} />
              </span>
              <span className={still ? undefined : 'a-loop a-l7-open'} style={{ display: 'block' }}>
                <Envelope open />
              </span>
            </div>
          </div>
          <div className={still ? undefined : 'a-loop a-l7-sheet'} style={{ position: 'absolute', left: 306, top: 40, width: 186, zIndex: 7 }}>
            <div style={{ ...flex(8, 'column', { alignItems: 'stretch' }), padding: '10px 14px', borderRadius: 12, ...TILE_SKIN, boxShadow: `inset 0 0 0 1.5px ${tone}, 0 12px 24px -16px rgba(31,64,140,0.34)` }}>
              {[
                ['Link2', 'URL Path'],
                ['FileText', 'HTTP Headers'],
                ['Cookie', 'Cookies'],
              ].map(([g, t]) => (
                <span key={t} style={{ ...flex(8), ...heading(15) }}>
                  <span style={{ display: 'grid', placeItems: 'center', width: 24, height: 24, borderRadius: 7, background: `${tone}1F`, color: tone }}>
                    <Icon name={g} size={14} style={{ strokeWidth: 2.4 }} />
                  </span>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function A_Packets({ step }: { step: number }) {
  const still = held()
  return (
    <Frame w={1060} h={300}>
      <Show on={step >= 1} style={{ position: 'absolute', left: 8, top: 8, width: 512, height: 284 }}>
        <Lane title="Layer 4 (Transport)" tone={colors.brand} name="Network Load Balancer (NLB)" logo={nlbLogo} l7={false} still={still} />
      </Show>
      <Show on={step >= 2} style={{ position: 'absolute', left: 540, top: 8, width: 512, height: 284 }}>
        <Lane title="Layer 7 (Application)" tone={colors.tealDark} name="Application Load Balancer (ALB)" logo={albLogo} l7 still={still} />
      </Show>
    </Frame>
  )
}

/* ───────────────────────── exports ───────────────────────── */

export const figures = { A_Spof, A_Console, A_Billing, A_Growth, A_TypeGrid, A_Deploy, A_Packets }
export const slides = {}
export const css = `
.a-loop { animation-iteration-count: infinite; animation-timing-function: cubic-bezier(0.45,0,0.55,1); }
@keyframes a-pool { 0% { opacity: 0; transform: translateY(8px) } 35%, 65% { opacity: 1; transform: none } 100% { opacity: 0; transform: translateY(8px) } }
.a-pool { animation-name: a-pool; animation-duration: 4.8s; }
@keyframes a-bob { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
.a-bob { animation-name: a-bob; animation-duration: 2.8s; }
/* T02-C clock: the hands of ClayClock turn like a working clock (an animation outranks the hand's inline rotate);
   the long hand starts where turn=0.15 put it (54deg), the short hand from three o'clock, twelve times slower */
@keyframes a-min { from { transform: rotate(54deg) } to { transform: rotate(414deg) } }
@keyframes a-hour { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
.a-clock path:not(.mo) { animation: a-min 8s linear infinite; }
.a-clock path.mo-tick { animation: a-hour 96s linear infinite !important; }
.cc-still .a-clock path, .deck-thumb .a-clock path { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .a-clock path { animation: none !important; } }
/* T02-C traffic: incoming requests run into the meter, processed ones leave it, a steady stream with no rest */
@keyframes a-in { 0% { transform: translateX(0); opacity: 0 } 15%, 80% { opacity: 1 } 100% { transform: translateX(40px); opacity: 0 } }
.a-in { animation-name: a-in; animation-duration: 1.2s; animation-timing-function: linear; }
@keyframes a-out { 0% { transform: translateX(0); opacity: 0 } 20%, 82% { opacity: 1 } 100% { transform: translateX(30px); opacity: 0 } }
.a-out { animation-name: a-out; animation-duration: 1.2s; animation-timing-function: linear; }
@keyframes a-l4 { 0% { transform: translate(70px, 104px); opacity: 0 } 10% { opacity: 1 } 90% { opacity: 1 } 100% { transform: translate(452px, 104px); opacity: 0 } }
.a-l4 { animation-name: a-l4; animation-duration: 3.6s; animation-timing-function: linear; }
@keyframes a-l7 { 0% { transform: translate(70px, 104px); opacity: 0 } 8% { opacity: 1 } 30% { transform: translate(260px, 104px) } 36%, 68% { transform: translate(260px, 92px) } 74% { transform: translate(260px, 104px) } 92% { opacity: 1 } 100% { transform: translate(452px, 104px); opacity: 0 } }
.a-l7 { animation-name: a-l7; animation-duration: 5.4s; animation-timing-function: linear; }
@keyframes a-l7-open { 0%, 33% { opacity: 0 } 38%, 68% { opacity: 1 } 72%, 100% { opacity: 0 } }
@keyframes a-l7-shut { 0%, 33% { opacity: 1 } 38%, 68% { opacity: 0 } 72%, 100% { opacity: 1 } }
.a-l7-open { animation-name: a-l7-open; animation-duration: 5.4s; animation-timing-function: linear; }
.a-l7-shut { animation-name: a-l7-shut; animation-duration: 5.4s; animation-timing-function: linear; }
@keyframes a-l7-sheet { 0%, 34% { opacity: 0; transform: translateY(8px) } 40%, 66% { opacity: 1; transform: none } 72%, 100% { opacity: 0; transform: translateY(8px) } }
.a-l7-sheet { animation-name: a-l7-sheet; animation-duration: 5.4s; animation-timing-function: linear; }
/* ENGINE GAP: a lead holding two TR sentences takes one line each (rule 36); the lead <p> collapses "\\n", so these slides keep it */
section:has([data-spec="T01"]) p.text-body-lg, section:has([data-spec="T04"]) p.text-body-lg, section:has([data-spec="T05"]) p.leading-snug.text-center { white-space: pre-line; }
.cc-still .a-loop, .deck-thumb .a-loop { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .a-loop { animation: none !important; } }
`
