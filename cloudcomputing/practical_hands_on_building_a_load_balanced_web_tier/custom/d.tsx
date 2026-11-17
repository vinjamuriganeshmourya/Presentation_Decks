import { useMemo, type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Diagram } from '@/engine/Diagram'
import { Icon, Rich } from '@/engine/icon'
import type { DiagramSpec } from '@/engine/types'
import { Arrow, At, Label, STILL, Traveller } from '@/decks/figures/scene'
import { CvIcon, fx } from '@/decks/figures/net/fx'
import { ClayPin } from '@/decks/figures/clay-d'
import route53Svg from '../images/aws-route-53.svg'
import elbSvg from '../images/aws-elb.svg'
import resolverSvg from '../images/aws-route-53-resolver.svg'

/**
 * BUILDER D · Section 5, DNS & Content Delivery (T17 to T23-B).
 *
 * Most figures here are engine diagrams driven by PHASES: the engine's `steps`
 * can only reveal, and these slides need a part to leave (a failed route
 * replaced by a blocked one, a dropped DNS answer). `Phased` turns "what is
 * visible at press k" into an engine spec for that press, so every arrow is
 * still routed rim to rim by the engine and every loop is the engine's own.
 * The rest (a timeline, a TTL bar, a card grid) is DOM over the same stage.
 */

type Phase = { add?: string[]; drop?: string[]; lit?: string[] }

const arrowKey = (a: { id?: string; from: string; to: string }) => a.id ?? `${a.from}>${a.to}`

function allIds(s: DiagramSpec): string[] {
  return [
    ...(s.boxes ?? []).map((b) => b.id),
    ...(s.nodes ?? []).map((n) => n.id),
    ...(s.chips ?? []).map((c) => c.id),
    ...(s.arrows ?? []).map(arrowKey),
    ...(s.packets ?? []).map((_, i) => `packet:${i}`),
  ]
}

function visAt(s: DiagramSpec, phases: Phase[], k: number): Set<string> {
  const added = new Set(phases.flatMap((p) => p.add ?? []))
  const vis = new Set(allIds(s).filter((id) => !added.has(id)))
  for (let i = 0; i <= k && i < phases.length; i++) {
    for (const id of phases[i].add ?? []) vis.add(id)
    for (const id of phases[i].drop ?? []) vis.delete(id)
  }
  return vis
}

/** the engine spec for press `k`: on a harness frame the final picture only; live, the new parts as one step and the gone parts as an unreached one */
function phased(s: DiagramSpec, phases: Phase[], k: number): { spec: DiagramSpec; step: number } {
  const last = phases.length - 1
  if (STILL) {
    const v = visAt(s, phases, last)
    const keep = <T,>(xs: T[] | undefined, id: (x: T) => string) => (xs ?? []).filter((x) => v.has(id(x)))
    return {
      spec: { ...s, boxes: keep(s.boxes, (b) => b.id), nodes: keep(s.nodes, (n) => n.id), chips: keep(s.chips, (c) => c.id), arrows: keep(s.arrows, arrowKey), packets: [], steps: [] },
      step: 0,
    }
  }
  const kk = Math.max(0, Math.min(last, k))
  const cur = visAt(s, phases, kk)
  const prev = visAt(s, phases, Math.max(0, kk - 1))
  const fresh = kk === 0 ? [] : [...cur].filter((id) => !prev.has(id))
  const gone = allIds(s).filter((id) => !cur.has(id))
  return { spec: { ...s, steps: [{ show: fresh, lit: phases[kk]?.lit ?? [] }, gone] }, step: 1 }
}

function Phased({ spec, phases, step, under, over }: { spec: DiagramSpec; phases: Phase[]; step: number; under?: ReactNode; over?: ReactNode }) {
  const p = useMemo(() => phased(spec, phases, step), [spec, phases, step])
  return (
    <div className="grid h-full w-full place-items-center">
      <div className="relative" style={{ width: spec.w, height: spec.h }}>
        {under}
        <div className="absolute inset-0">
          <Diagram spec={p.spec} step={p.step} />
        </div>
        {over}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ small shared parts */

const EASE = 'cubic-bezier(0.22,1,0.36,1)'
function useT(ms = 420) {
  return useInstant() ? 'none' : `all ${ms}ms ${EASE}`
}
/** shown or not, in place */
function Show({ on, children, style, className = '' }: { on: boolean; children: ReactNode; style?: CSSProperties; className?: string }) {
  const t = useT()
  return (
    <div className={className} style={{ opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(6px)', transition: t, ...style }}>
      {children}
    </div>
  )
}
/**
 * a faint ground for a figure that is laid out geographically: a plain tinted plate. The curved grid lines it
 * carried are gone (corrections 2026-11-06, G5: "remove the distorted grid-line background" on slides 45, 46, 49,
 * the only three that use it).
 */
function Ground({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <svg aria-hidden className="pointer-events-none absolute" style={{ left: x, top: y }} width={w} height={h}>
      <defs>
        <linearGradient id="d-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={colors.surface} />
          <stop offset="1" stopColor={colors.surface2} />
        </linearGradient>
      </defs>
      <rect x={0.75} y={0.75} width={w - 1.5} height={h - 1.5} rx={16} fill="url(#d-ground)" stroke={colors.line} strokeWidth={1.5} />
    </svg>
  )
}
/** a round status badge (tick or cross) */
function Mark({ ok, size = 26, on = true }: { ok: boolean; size?: number; on?: boolean }) {
  const t = useT(380)
  const c = ok ? colors.success : colors.danger
  return (
    <span className="grid place-items-center rounded-full" style={{ width: size, height: size, background: c, color: colors.white, boxShadow: `0 6px 14px -8px ${c}`, opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.5)', transition: t }}>
      {ok ? <Icon name="Check" size={size * 0.6} /> : <Icon name="X" size={size * 0.6} />}
    </span>
  )
}

/* ================================================================== T17 · DNS picks a data centre, then fails over */

const T17: DiagramSpec = {
  type: 'diagram',
  w: 526,
  h: 380,
  nodes: [
    { id: 'user', x: 60, y: 180, icon: 'lib:routing-visitor', shape: 'person', size: 124, label: 'User' },
    { id: 'dns', x: 240, y: 180, icon: `img:${resolverSvg}`, shape: 'tile', size: 62, label: 'DNS Resolver', loop: 'pulse' },
    { id: 'a', x: 440, y: 74, icon: 'lib:server-stack', shape: 'bare', size: 72, label: 'Data Centre A' },
    { id: 'b', x: 440, y: 262, icon: 'lib:server-stack', shape: 'bare', size: 72, label: 'Data Centre B' },
  ],
  chips: [
    { id: 'p1', x: 116, y: 40, text: 'Location', icon: 'MapPin', tone: 'brand' },
    { id: 'p2', x: 226, y: 40, text: 'Latency', icon: 'Timer', tone: 'brand' },
    { id: 'p3', x: 328, y: 40, text: 'Health', icon: 'HeartPulse', tone: 'brand' },
    { id: 'fa', x: 440, y: 160, text: 'Failed', icon: 'X', tone: 'bad' },
    { id: 'hb', x: 440, y: 352, text: 'Healthy', icon: 'Check', tone: 'good' },
  ],
  arrows: [
    { from: 'user', to: 'dns' },
    { from: 'dns', to: 'a', tone: 'good' },
    { id: 'xa', from: 'dns', to: 'a', blocked: true },
    { from: 'dns', to: 'b', tone: 'good', label: 'TTL', labelPos: 'above' },
  ],
  packets: [
    { path: ['user', 'dns', 'a'], tone: 'good' },
    { path: ['user', 'dns', 'b'], tone: 'good' },
  ],
}
const T17_P: Phase[] = [
  { add: ['p1', 'p2', 'p3', 'dns>a', 'packet:0', 'xa', 'fa', 'dns>b', 'hb', 'packet:1'] },
  { add: ['p1', 'p2', 'p3', 'dns>a', 'packet:0'], lit: ['dns'] },
  { add: ['xa', 'fa', 'dns>b', 'hb', 'packet:1'], drop: ['dns>a', 'packet:0'], lit: ['b'] },
]
function D_DnsPick({ step }: { step: number }) {
  return <Phased spec={T17} phases={T17_P} step={step} />
}

/* ================================================================== T17-B · a nearby edge, one distant origin */

const T17B: DiagramSpec = {
  type: 'diagram',
  w: 546,
  h: 380,
  nodes: [
    { id: 'user', x: 70, y: 214, icon: 'lib:build-boy-laptop', shape: 'person', size: 124, label: 'User' },
    { id: 'edge', x: 270, y: 214, icon: 'lib:server-stack', shape: 'bare', size: 64, label: 'Edge Location', loop: 'pulse' },
    { id: 'origin', x: 452, y: 84, icon: 'lib:server-stack', shape: 'bare', size: 84, label: 'Origin Server' },
  ],
  chips: [
    { id: 'copy', x: 270, y: 296, text: 'Copy', icon: 'Files', tone: 'good' },
    { id: 'ttl', x: 214, y: 340, text: 'TTL', icon: 'Clock', tone: 'warn' },
    { id: 'inv', x: 330, y: 340, text: 'Invalidation', icon: 'RefreshCw', tone: 'warn' },
  ],
  arrows: [
    { id: 'near', from: 'user', to: 'edge', two: true, tone: 'good', label: 'Close To Users', labelPos: 'below' },
    { id: 'link', from: 'edge', to: 'origin', dashed: true, tone: 'muted' },
    { id: 'miss', from: 'edge', to: 'origin', tone: 'warn', label: 'Cache Miss', labelPos: 'below' },
  ],
  packets: [
    { path: ['user', 'edge'], tone: 'good', back: true },
    { path: ['edge', 'origin'], tone: 'brand', back: true },
  ],
}
const T17B_P: Phase[] = [
  { add: ['edge', 'copy', 'near', 'link', 'packet:0', 'miss', 'packet:1', 'ttl', 'inv'] },
  { add: ['edge', 'copy', 'near', 'link', 'packet:0'], lit: ['edge'] },
  { add: ['miss', 'packet:1'], drop: ['link'], lit: ['origin'] },
  { add: ['ttl', 'inv'], lit: ['ttl', 'inv'] },
]
function D_EdgeOrigin({ step }: { step: number }) {
  return <Phased spec={T17B} phases={T17B_P} step={step} under={<Ground x={14} y={14} w={518} h={352} />} />
}

/* ================================================================== T18 · one resolver, three regions, three policies */

const T18: DiagramSpec = {
  type: 'diagram',
  w: 1000,
  h: 330,
  nodes: [
    { id: 'user', x: 92, y: 168, icon: 'lib:build-boy-laptop', shape: 'person', size: 120, label: 'User' },
    { id: 'dns', x: 318, y: 168, icon: `img:${resolverSvg}`, shape: 'tile', size: 62, label: 'DNS Resolver', loop: 'pulse' },
    { id: 'r1', x: 598, y: 62, icon: 'lib:server-stack', shape: 'bare', size: 58, label: 'Region 1' },
    { id: 'r2', x: 884, y: 168, icon: 'lib:server-stack', shape: 'bare', size: 58, label: 'Region 2' },
    { id: 'r3', x: 640, y: 258, icon: 'lib:server-stack', shape: 'bare', size: 58, label: 'Region 3' },
  ],
  arrows: [
    { from: 'user', to: 'dns' },
    { id: 'geo', from: 'dns', to: 'r1', tone: 'good', label: 'Geo', labelPos: 'above' },
    { id: 'lat', from: 'dns', to: 'r2', tone: 'good', label: 'Latency', labelPos: 'above' },
    { id: 'wei', from: 'dns', to: 'r3', tone: 'good', label: 'Weighted', labelPos: 'below' },
  ],
  packets: [
    { path: ['user', 'dns', 'r1'], tone: 'good' },
    { path: ['user', 'dns', 'r2'], tone: 'good' },
    { path: ['user', 'dns', 'r3'], tone: 'good' },
  ],
}
const T18_P: Phase[] = [
  { add: ['geo', 'lat', 'wei', 'packet:0', 'packet:1', 'packet:2'] },
  { add: ['geo', 'packet:0'], lit: ['r1'] },
  { add: ['lat', 'packet:1'], lit: ['r2'] },
  { add: ['wei', 'packet:2'], lit: ['r3'] },
]
function D_GeoMap({ step }: { step: number }) {
  return (
    <Phased
      spec={T18}
      phases={T18_P}
      step={step}
      under={
        <>
          <Ground x={14} y={14} w={972} h={302} />
          {[
            [598, 62],
            [884, 168],
            [640, 258],
          ].map(([x, y], i) => (
            <At key={i} x={x + 36} y={y - 44}>
              <div {...fx('hop', i * 0.5, 2.4)}>
                <ClayPin w={22} />
              </div>
            </At>
          ))}
        </>
      }
    />
  )
}

/* ================================================================== T18-B · the four routing policies, a small picture each */

/** the policy pictures' width: narrow enough that each card's point keeps to two lines beside it (R7) */
const ART_W = 170
function GeoArt({ near }: { near: boolean }) {
  const t = useT()
  return (
    <div className="relative" style={{ width: ART_W, height: 122 }}>
      <div className="absolute rounded-[14px]" style={{ inset: 0, background: colors.surface2, boxShadow: `inset 0 0 0 1.5px ${colors.line}` }} />
      <At x={8} y={8}><Label size={14} tone="lift" strong>Continent</Label></At>
      <div className="absolute rounded-[12px]" style={{ left: 8, top: 42, width: 80, height: 72, background: colors.white, boxShadow: `inset 0 0 0 1.5px ${colors.brand}` }} />
      <At x={14} y={50}><Label size={14} tone="brand" strong>Country</Label></At>
      <At x={56} y={78}><div {...fx('hop', 0, 2.4)}><ClayPin w={22} /></div></At>
      <div style={{ opacity: near ? 1 : 0, transition: t }}>
        <At x={122} y={44}><div {...fx('hop', 0.6, 2.4)}><ClayPin w={22} tone={colors.success} /></div></At>
        <At x={91} y={86}><Label size={14} tone="good" strong>Nearest</Label></At>
      </div>
    </div>
  )
}
function LatencyArt() {
  const rows = [0.86, 0.34, 0.62]
  return (
    <div className="flex flex-col justify-center gap-[6px]" style={{ width: ART_W, height: 122 }}>
      {rows.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <CvIcon name="server-stack" w={24} />
          <div className="relative h-[11px] flex-1 rounded-full" style={{ background: colors.surface2 }}>
            <div className={`absolute left-0 top-0 h-full rounded-full ${i === 1 ? fx('glow', 0, 1.8).className : ''}`} style={{ width: `${v * 100}%`, background: i === 1 ? colors.success : colors.line }} />
          </div>
        </div>
      ))}
      <div className="mt-1 flex items-center gap-2 pl-[32px]">
        <Label size={14} tone="good" strong icon={<Icon name="Timer" />}>Fastest</Label>
      </div>
    </div>
  )
}
function WeightArt() {
  const parts = [
    { v: 0.6, c: colors.brand, t: 'Region 1' },
    { v: 0.3, c: colors.teal, t: 'Region 2' },
    { v: 0.1, c: colors.brandDeep, t: 'Region 3' },
  ]
  const R = 38
  const C = 2 * Math.PI * R
  let acc = 0
  return (
    <div className="flex items-center justify-center gap-3" style={{ width: ART_W, height: 122 }}>
      {/* still (corrections 2026-11-06, slide 47: the donut's spin removed entirely) */}
      <svg width={84} height={84} viewBox="0 0 96 96" aria-hidden>
        {parts.map((p, i) => {
          const el = <circle key={i} cx={48} cy={48} r={R} fill="none" stroke={p.c} strokeWidth={15} strokeDasharray={`${p.v * C - 2} ${C}`} strokeDashoffset={-acc * C} transform="rotate(-90 48 48)" />
          acc += p.v
          return el
        })}
      </svg>
      <div className="flex flex-col gap-1.5">
        {parts.map((p) => (
          <span key={p.t} className="flex items-center gap-1.5 text-[14px] font-semibold" style={{ color: colors.ink }}>
            <span className="block h-[10px] w-[10px] rounded-full" style={{ background: p.c }} />
            {p.t}
          </span>
        ))}
      </div>
    </div>
  )
}
function MultiArt() {
  return (
    <div className="flex items-center justify-center gap-3" style={{ width: ART_W, height: 122 }}>
      <div className="flex flex-col items-center gap-1">
        <span className="grid place-items-center rounded-[12px]" style={{ width: 44, height: 44, background: colors.surface2, color: colors.brandDark, boxShadow: `inset 0 0 0 1.5px ${colors.line}` }}>
          <Icon name="Laptop" size={24} />
        </span>
        <span className="text-[14px] font-semibold" style={{ color: colors.ink }}>Client</span>
      </div>
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((n) => (
          <span key={n} className={n === 2 ? fx('glow', 0, 2.2).className : ''} style={n === 2 ? fx('glow', 0, 2.2).style : undefined}>
            <Label size={14} tone={n === 2 ? 'brand' : 'plain'} strong icon={<Icon name="Check" />} iconRound>{`Address ${n}`}</Label>
          </span>
        ))}
      </div>
    </div>
  )
}
/*
 * THE FOUR POLICIES AS FOUR CARDS (corrections 2026-11-06, slide 47, after the reference deck's frame 41): one
 * 2 x 2 grid across the whole width, each card its policy's name and icon on top, the TR's point (unchanged)
 * under it on the left and the policy's small picture beside it on the right, so the picture reads as part of
 * the card rather than a panel of its own. Geoproximity is the second point of the geolocation card. One press per
 * point: the card it belongs to arrives (or, for geoproximity, its line and the nearest pin) and is lit.
 */
const CELLS = [
  { title: 'Geolocation Routing', icon: 'Globe', pts: [0, 1] },
  { title: 'Latency-Based Routing', icon: 'Timer', pts: [2] },
  { title: 'Weighted Routing', icon: 'Scale', pts: [3] },
  { title: 'Multi-Value Answer Routing', icon: 'ListChecks', pts: [4] },
]
function D_PolicyCells({ step, points = [] }: { step: number; points?: string[] }) {
  const t = useT()
  const s = STILL ? 5 : step
  return (
    <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-2.5 p-2.5">
      {CELLS.map((c, i) => {
        const first = c.pts[0] + 1
        const on = i === 0 || s >= first
        const lit = !STILL && c.pts.some((k) => k + 1 === s)
        return (
          <div
            key={c.title}
            className="flex min-h-0 flex-col gap-2.5 rounded-[16px] px-3 py-3"
            style={{
              opacity: on ? 1 : 0,
              transform: on ? 'none' : 'translateY(8px)',
              transition: t,
              background: lit ? 'linear-gradient(180deg, #F4F8FF 0%, #E3ECFD 100%)' : colors.white,
              boxShadow: lit ? `inset 0 0 0 2px ${colors.brand}, 0 12px 24px -16px ${colors.brand}` : `inset 0 0 0 1.5px ${colors.line}, 0 10px 22px -20px rgba(16,32,58,0.4)`,
            }}
          >
            <div className="flex items-center gap-2.5">
              <span aria-hidden className="grid h-[36px] w-[36px] shrink-0 place-items-center rounded-[11px]" style={{ background: lit ? colors.brand : colors.surface2, color: lit ? colors.white : colors.brand, transition: t }}>
                <Icon name={c.icon} size={19} />
              </span>
              <span className="font-heading text-[19px] font-semibold leading-tight" style={{ color: colors.ink }}>
                {c.title}
              </span>
            </div>
            <div className="flex min-h-0 flex-1 items-center gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                {c.pts.map((k) => (
                  <span key={k} className="text-[15px] leading-snug" style={{ color: colors.ink, opacity: k === 0 || s >= k + 1 ? 1 : 0, transition: t }}>
                    <Rich text={points[k] ?? ''} />
                  </span>
                ))}
              </div>
              <div className="grid shrink-0 place-items-center" style={{ width: ART_W }}>
                {i === 0 ? <GeoArt near={s >= 2} /> : i === 1 ? <LatencyArt /> : i === 2 ? <WeightArt /> : <MultiArt />}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ================================================================== T19 · health checks every interval, then the answer list drops the region */

function D_FailTimeline({ step }: { step: number }) {
  const t = useT()
  const s = STILL ? 3 : step
  const xs = [176, 252, 328, 404, 480, 556]
  const y = 150
  const down = s >= 2
  const dropped = s >= 3
  return (
    <div className="relative" style={{ width: 1000, height: 320 }}>
      <Ground x={14} y={14} w={972} h={292} />
      {/* the health checker */}
      <At x={92} y={y} cx cy>
        <div className="flex flex-col items-center gap-1.5" style={{ marginTop: 14 }}>
          <span className="grid place-items-center rounded-[16px] bg-white" style={{ width: 60, height: 60, color: colors.brandDark, boxShadow: `inset 0 0 0 2px ${colors.brand}, 0 10px 20px -14px rgba(16,32,58,0.5)` }}>
            <span {...fx('glow', 0, 1.6)}>
              <HeartIcon />
            </span>
          </span>
          <Label size={14} strong>Health Checker</Label>
        </div>
      </At>
      {/* the strip: one ping per interval, travelling to the region */}
      <Arrow x1={128} y1={y} x2={612} y2={y} tone={colors.brand} />
      <Traveller k="ping" run={!STILL} path={[[132, y], [604, y]]} tone={colors.brand} size={12} dur={2.2} />
      {xs.map((x, i) => (
        <div key={x}>
          <span className="absolute block rounded-full" style={{ left: x - 4, top: y - 4, width: 8, height: 8, background: colors.white, boxShadow: `inset 0 0 0 2px ${colors.brand}` }} />
          <At x={x} y={y - 46} cx>
            <Mark ok={i < 3} size={28} on={i < 3 ? s >= 1 : s >= 2} />
          </At>
        </div>
      ))}
      {/* one interval, bracketed */}
      <svg aria-hidden className="pointer-events-none absolute" style={{ left: xs[1], top: y + 16 }} width={xs[2] - xs[1]} height={14}>
        <path d={`M 1 1 V 8 H ${xs[2] - xs[1] - 1} V 1`} fill="none" stroke={colors.muted} strokeWidth={1.5} />
      </svg>
      <At x={(xs[1] + xs[2]) / 2} y={y + 36} cx>
        <Label size={14} tone="muted" strong icon={<Icon name="Clock"  />}>Every Interval</Label>
      </At>
      <Show on={s >= 2} style={{ position: 'absolute', left: xs[3] - 18, top: y + 22, width: xs[5] - xs[3] + 36 }}>
        <div className="flex flex-col items-center gap-1">
          <svg aria-hidden width={xs[5] - xs[3] + 36} height={14}>
            <path d={`M 19 1 V 8 H ${xs[5] - xs[3] + 17} V 1`} fill="none" stroke={colors.danger} strokeWidth={1.5} />
          </svg>
          <Label size={14} tone="bad" strong>Repeated Failures</Label>
        </div>
      </Show>
      {/* the region */}
      <At x={664} y={y} cx cy>
        <div className="relative flex flex-col items-center gap-1.5" style={{ marginTop: 14 }}>
          <div style={{ opacity: down ? 0.5 : 1, transition: t }}>
            <CvIcon name="server-stack" w={66} />
          </div>
          <Label size={14} strong tone={down ? 'bad' : 'plain'}>Region 1</Label>
          <span className="absolute" style={{ right: -10, top: -8 }}>
            <Mark ok={false} size={28} on={down} />
          </span>
        </div>
      </At>
      {/* the DNS answer list */}
      <Show on={s >= 3} style={{ position: 'absolute', left: 706, top: y - 4 }}>
        <Arrow x1={0} y1={4} x2={54} y2={4} tone={colors.danger} on={s >= 3} />
      </Show>
      <div className="absolute rounded-[16px] bg-white" style={{ left: 770, top: y - 71, width: 200, height: 228, boxShadow: `inset 0 0 0 1.5px ${colors.line}, 0 12px 26px -20px rgba(16,32,58,0.45)` }}>
        <div className="px-3 pt-3">
          <Label size={14} tone="brand" strong icon={<Icon name="ListChecks"  />}>DNS Answers</Label>
        </div>
        <div className="mt-3 flex flex-col gap-2.5 px-3">
          {[1, 2, 3].map((n) => {
            const gone = n === 1 && dropped
            return (
              <div key={n} className="flex items-center justify-between rounded-[12px] px-3 py-2" style={{ background: gone ? '#FDECEC' : colors.surface, boxShadow: `inset 0 0 0 1.5px ${gone ? colors.danger : colors.line}`, opacity: gone ? 0.6 : 1, transition: t }}>
                <span className="text-[15px] font-semibold" style={{ color: gone ? colors.danger : colors.ink, textDecoration: gone ? 'line-through' : 'none' }}>{`Region ${n}`}</span>
                <Mark ok={!gone} size={20} />
              </div>
            )
          })}
        </div>
        <Show on={dropped} className="mt-3 flex justify-center">
          <Label size={14} tone="bad" strong icon={<Icon name="X"  />}>Dropped</Label>
        </Show>
      </div>
    </div>
  )
}
function HeartIcon() {
  return (
    <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}

/* ================================================================== T19-B · primary and secondary records, and the TTL trade-off */

const T19B: DiagramSpec = {
  type: 'diagram',
  w: 546,
  h: 380,
  nodes: [
    { id: 'r53', x: 273, y: 44, icon: 'Signpost', shape: 'disc', size: 52, label: 'Route 53', labelPos: 'right', loop: 'pulse' },
    { id: 'pri', x: 120, y: 150, icon: 'lib:server-stack', shape: 'bare', size: 56, label: 'Primary' },
    { id: 'sec', x: 426, y: 150, icon: 'lib:server-stack', shape: 'bare', size: 56, label: 'Secondary' },
  ],
  chips: [{ id: 'down', x: 120, y: 226, text: 'Marked Down', icon: 'X', tone: 'bad' }],
  arrows: [
    { id: 'toP', from: 'r53', to: 'pri', tone: 'good' },
    { id: 'xP', from: 'r53', to: 'pri', blocked: true },
    { id: 'toS', from: 'r53', to: 'sec', tone: 'good' },
  ],
  packets: [
    { path: ['r53', 'pri'], tone: 'good' },
    { path: ['r53', 'sec'], tone: 'good' },
  ],
}
const T19B_P: Phase[] = [
  { add: ['toP', 'packet:0', 'xP', 'down', 'toS', 'packet:1'] },
  { add: ['toP', 'packet:0'], lit: ['pri'] },
  { add: ['xP', 'down', 'toS', 'packet:1'], drop: ['toP', 'packet:0'], lit: ['sec'] },
  {},
  {},
]
function D_Failover({ step }: { step: number }) {
  const s = STILL ? 4 : step
  const t = useT(700)
  /* the failover time bar: detection, then the TTL of cached answers; a lower TTL shortens it */
  const det = 150
  const ttl = s >= 4 ? 118 : 232
  const x0 = 24
  return (
    <Phased
      spec={T19B}
      phases={T19B_P}
      step={step}
      over={
        <Show on={s >= 3} style={{ position: 'absolute', left: 0, top: 262, width: 546, height: 118 }}>
          <div className="absolute" style={{ left: x0, top: 0, height: 34, width: det, borderRadius: '10px 0 0 10px', background: '#FDECEC', boxShadow: `inset 0 0 0 1.5px ${colors.danger}` }}>
            <span className="grid h-full place-items-center text-[14px] font-semibold" style={{ color: colors.danger }}>Detection</span>
          </div>
          <div className="absolute overflow-hidden" style={{ left: x0 + det, top: 0, height: 34, width: ttl, borderRadius: '0 10px 10px 0', background: '#FFF4E0', boxShadow: `inset 0 0 0 1.5px ${colors.warning}`, transition: t }}>
            <span className="flex h-full items-center justify-center gap-1.5 whitespace-nowrap text-[14px] font-semibold" style={{ color: '#9A5B00' }}>
              <Icon name="Clock" size={15} />
              TTL Expiry
            </span>
          </div>
          <div className="absolute" style={{ left: x0 + det + ttl + 12, top: 4, transition: t }}>
            <Label size={14} tone="good" strong icon={<Icon name="Check"  />} iconRound>Failover</Label>
          </div>
          <Show on={s >= 4} style={{ position: 'absolute', left: x0, top: 50, width: 498 }}>
            <div className="flex items-center gap-3">
              <Label size={14} tone="brand" strong icon={<Icon name="Clock"  />}>Lower TTL</Label>
              <Icon name="ArrowRight" size={18} style={{ color: colors.muted }} />
              <Label size={14} tone="warn" strong icon={<Icon name="Zap"  />}>Resolver Query Load</Label>
              <div className="relative h-[12px] flex-1 overflow-hidden rounded-full" style={{ background: colors.surface2 }}>
                <div className={`absolute left-0 top-0 h-full rounded-full ${fx('glow', 0, 1.6).className}`} style={{ width: s >= 4 ? '88%' : '20%', background: colors.warning, transition: t }} />
              </div>
            </div>
          </Show>
        </Show>
      }
    />
  )
}

/* ================================================================== T20 · the CDN map (TR p15 redrawn) */

const V = (id: string, x: number, y: number, icon: string) => ({ id, x, y, icon, shape: 'person' as const, size: 60, label: 'Visitor' })
const T20: DiagramSpec = {
  type: 'diagram',
  w: 1000,
  h: 350,
  nodes: [
    { id: 'o', x: 500, y: 52, icon: 'lib:server-stack', shape: 'bare', size: 70, label: 'Origin Server', loop: 'pulse' },
    { id: 'c1', x: 250, y: 118, icon: 'lib:server-stack', shape: 'bare', size: 46, label: 'Cache Server' },
    { id: 'c2', x: 790, y: 150, icon: 'lib:server-stack', shape: 'bare', size: 46, label: 'Cache Server' },
    { id: 'c3', x: 290, y: 236, icon: 'lib:server-stack', shape: 'bare', size: 46, label: 'Cache Server' },
    { id: 'c4', x: 650, y: 246, icon: 'lib:server-stack', shape: 'bare', size: 46, label: 'Cache Server' },
    V('v1', 70, 52, 'lib:routing-visitor'),
    V('v2', 70, 176, 'lib:routing-queue-a'),
    V('v3', 120, 284, 'lib:routing-queue-b'),
    V('v4', 450, 284, 'lib:routing-visitor'),
    V('v5', 820, 284, 'lib:routing-queue-a'),
    V('v6', 540, 196, 'lib:routing-outsider'),
    V('v7', 930, 52, 'lib:routing-queue-b'),
    V('v8', 930, 196, 'lib:routing-visitor'),
  ],
  chips: [
    { id: 'hit', x: 170, y: 52, text: 'Hit', icon: 'Check', tone: 'good' },
  ],
  arrows: [
    { from: 'c1', to: 'o', tone: 'muted' },
    { from: 'c2', to: 'o', tone: 'muted' },
    { from: 'c3', to: 'o', tone: 'muted' },
    { id: 'miss', from: 'c3', to: 'o', tone: 'warn', label: 'Miss', labelPos: 'on' },
    { from: 'c4', to: 'o', tone: 'muted' },
    { from: 'v1', to: 'c1' },
    { id: 'hitA', from: 'v1', to: 'c1', tone: 'good', two: true },
    { from: 'v2', to: 'c1' },
    { from: 'v3', to: 'c3' },
    { from: 'v4', to: 'c3' },
    { from: 'v6', to: 'c4' },
    { from: 'v5', to: 'c4' },
    { from: 'v7', to: 'c2' },
    { from: 'v8', to: 'c2' },
  ],
  packets: [
    { path: ['v1', 'c1'], tone: 'good', back: true },
    { path: ['v3', 'c3', 'o'], tone: 'accent', back: true },
  ],
}
const VIS = ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'v1>c1', 'v2>c1', 'v3>c3', 'v4>c3', 'v6>c4', 'v5>c4', 'v7>c2', 'v8>c2']
const T20_P: Phase[] = [
  { add: [...VIS, 'hit', 'hitA', 'packet:0', 'miss', 'packet:1'] },
  { add: VIS, lit: ['c1', 'c2', 'c3', 'c4'] },
  { add: ['hit', 'hitA', 'packet:0'], drop: ['v1>c1'], lit: ['c1'] },
  { add: ['miss', 'packet:1'], drop: ['c3>o'], lit: ['o'] },
]
function D_CdnMap({ step }: { step: number }) {
  return <Phased spec={T20} phases={T20_P} step={step} />
}

/* ================================================================== T20-B · hit and miss at one edge */

const T20B: DiagramSpec = {
  type: 'diagram',
  w: 546,
  h: 400,
  boxes: [{ id: 'edgeBox', label: 'Edge Location', kind: 'zone', icon: 'MapPin', x: 138, y: 14, w: 196, h: 372 }],
  nodes: [
    { id: 'u1', x: 56, y: 104, icon: 'lib:routing-visitor', shape: 'person', size: 100, label: 'User 1' },
    { id: 'u2', x: 56, y: 288, icon: 'lib:routing-queue-a', shape: 'person', size: 100, label: 'User 2' },
    { id: 'edge', x: 236, y: 104, icon: 'lib:server-stack', shape: 'bare', size: 56, label: 'Cache Server', loop: 'pulse' },
    { id: 'o', x: 462, y: 232, icon: 'lib:server-stack', shape: 'bare', size: 70, label: 'Origin Server' },
  ],
  chips: [
    { id: 'hit', x: 236, y: 190, text: 'Cache Hit', icon: 'Check', tone: 'good' },
    { id: 'copy', x: 236, y: 224, text: 'Copy', icon: 'Files', tone: 'good' },
    { id: 'img', x: 236, y: 276, text: 'Images', icon: 'Image', tone: 'good' },
    { id: 'css', x: 236, y: 310, text: 'Style Sheets', icon: 'FileCode2', tone: 'good' },
    { id: 'js', x: 236, y: 344, text: 'Scripts', icon: 'FileCode2', tone: 'good' },
    { id: 'missC', x: 462, y: 140, text: 'Cache Miss', icon: 'X', tone: 'warn' },
    { id: 'pers', x: 450, y: 352, text: 'Personalised Pages', icon: 'UserRound', tone: 'bad' },
    { id: 'shield', x: 450, y: 48, text: 'Shields The Origin', icon: 'Shield', tone: 'brand' },
  ],
  arrows: [
    { id: 'a1', from: 'u1', to: 'edge', tone: 'good', two: true },
    { id: 'a2', from: 'u2', to: 'edge' },
    { id: 'miss', from: 'edge', to: 'o', tone: 'warn' },
  ],
  packets: [
    { path: ['u1', 'edge'], tone: 'good', back: true },
    { path: ['u2', 'edge', 'o'], tone: 'accent', back: true },
  ],
}
const T20B_P: Phase[] = [
  { add: ['u1', 'u2', 'a1', 'a2', 'hit', 'packet:0', 'miss', 'missC', 'copy', 'packet:1', 'shield', 'img', 'css', 'js', 'pers'] },
  { add: ['u1', 'u2'], lit: ['edge'] },
  { add: ['a1', 'hit', 'packet:0'], lit: ['hit'] },
  { add: ['a2', 'miss', 'missC', 'copy', 'packet:1'], lit: ['o'] },
  { add: ['shield'], lit: ['edgeBox'] },
  { add: ['img', 'css', 'js', 'pers'] },
]
function D_HitMiss({ step }: { step: number }) {
  return <Phased spec={T20B} phases={T20B_P} step={step} />
}

/* ================================================================== T21 · origin pull on a miss, a TTL check on a hit */

const T21: DiagramSpec = {
  type: 'diagram',
  w: 566,
  h: 380,
  boxes: [{ id: 'cache', label: 'Edge Server Cache', kind: 'zone', icon: 'Server', x: 150, y: 76, w: 200, h: 194 }],
  nodes: [
    { id: 'user', x: 60, y: 180, icon: 'lib:build-boy-laptop', shape: 'person', size: 100, label: 'User' },
    { id: 'edge', x: 250, y: 160, icon: 'lib:server-stack', shape: 'bare', size: 56, loop: 'pulse' },
    { id: 'o', x: 480, y: 298, icon: 'lib:server-stack', shape: 'bare', size: 60, label: 'Origin Server' },
  ],
  chips: [{ id: 'ttl', x: 250, y: 226, text: '`cache-control`', icon: 'Clock', tone: 'warn' }],
  arrows: [
    { id: 'req', from: 'user', to: 'cache' },
    { id: 'pull', from: 'cache', to: 'o', tone: 'warn', label: 'Origin Pull On Miss', labelPos: 'above', offset: -12 },
    { id: 'cond', from: 'cache', to: 'o', tone: 'good', dashed: true, two: true, label: 'Conditional Request', labelPos: 'below', offset: 12 },
  ],
  packets: [
    { path: ['user', 'cache'], tone: 'brand' },
    { path: ['cache', 'o'], tone: 'accent', back: true },
  ],
}
const T21_P: Phase[] = [
  { add: ['pull', 'packet:1', 'ttl', 'cond'] },
  { add: ['pull', 'packet:1'], lit: ['o'] },
  { add: ['ttl'], lit: ['ttl'] },
  { add: ['cond'], lit: ['o'] },
  {},
]
/** the loop back on a hit: out of the cache's foot and back into it, head up */
function LoopBack({ on }: { on: boolean }) {
  const t = useT(500)
  return (
    <div style={{ opacity: on ? 1 : 0, transition: t }}>
      <svg aria-hidden className="pointer-events-none absolute" style={{ left: 0, top: 0, overflow: 'visible' }} width={566} height={380}>
        <path d="M 282 273 C 282 324, 218 324, 218 284" fill="none" stroke={colors.success} strokeWidth={2.5} strokeLinecap="round" />
        <path d="M 282 273 C 282 324, 218 324, 218 284" fill="none" stroke={colors.white} strokeWidth={1.2} strokeLinecap="round" strokeDasharray="5 9" className="mo mo-dash" opacity={0.75} />
        <path d="M 218 274 L 223.5 284 L 212.5 284 Z" fill={colors.success} />
      </svg>
      <At x={250} y={338} cx>
        <Label size={14} strong raised>TTL Check On Hit</Label>
      </At>
    </div>
  )
}
function D_OriginPull({ step }: { step: number }) {
  const s = STILL ? 4 : step
  return (
    <Phased
      spec={T21}
      phases={T21_P}
      step={step}
      over={
        <>
          <LoopBack on={s >= 2} />
          <Show on={s >= 4} style={{ position: 'absolute', left: 14, top: 18, width: 538 }}>
            <div className="flex items-center gap-2.5">
              <Label size={14} tone="lift" strong>Static Assets</Label>
              <span className="block h-[10px] w-[70px] rounded-full" style={{ background: colors.success }} />
              <span className="w-3" />
              <Label size={14} tone="lift" strong>Frequently Changing Pages</Label>
              <span className="block h-[10px] w-[14px] rounded-full" style={{ background: colors.warning }} />
            </div>
          </Show>
        </>
      }
    />
  )
}

/* ================================================================== T22 · purge, and a versioned URL */

const T22: DiagramSpec = {
  type: 'diagram',
  w: 1000,
  h: 320,
  boxes: [
    { id: 'pb', label: 'Purge Invalidation', kind: 'zone', icon: 'Trash2', x: 14, y: 14, w: 470, h: 292 },
    { id: 'vb', label: 'Versioned URLs', kind: 'zone', icon: 'FileCode2', x: 516, y: 14, w: 470, h: 292 },
  ],
  nodes: [
    { id: 'op', x: 100, y: 176, icon: 'lib:coder', shape: 'bare', size: 132, label: 'Operator' },
    { id: 'obj', x: 384, y: 176, icon: 'FileImage', shape: 'tile', size: 60, label: 'Cached Object', tone: 'bad' },
    { id: 'old', x: 640, y: 206, icon: 'FileCode2', shape: 'tile', size: 52, label: '`style.css`', tone: 'muted' },
    { id: 'new', x: 860, y: 206, icon: 'FileCode2', shape: 'tile', size: 52, label: '`style-v2.css`', tone: 'good' },
  ],
  chips: [
    { id: 'u1', x: 640, y: 96, text: '`style.css`', mono: true, tone: 'muted' },
    { id: 'u2', x: 860, y: 96, text: '`style-v2.css`', mono: true, tone: 'brand' },
    { id: 'same', x: 640, y: 282, text: 'Unchanged', icon: 'Lock', tone: 'muted' },
    { id: 'stale', x: 384, y: 104, text: 'Stale', icon: 'Clock', tone: 'warn' },
  ],
  arrows: [
    { id: 'purge', from: 'op', to: 'obj', blocked: true, label: 'Purge', labelPos: 'above' },
    { id: 'url', from: 'u1', to: 'u2', label: 'New Filename', labelPos: 'above' },
    { id: 'hold', from: 'u1', to: 'old', tone: 'muted', dashed: true },
    { id: 'fetch', from: 'u2', to: 'new', tone: 'good' },
  ],
  packets: [{ path: ['u2', 'new'], tone: 'good' }],
}
const T22_P: Phase[] = [
  { add: ['purge', 'u2', 'url', 'fetch', 'new', 'same', 'packet:0'] },
  { add: ['purge'], lit: ['obj'] },
  { add: ['u2', 'url', 'fetch', 'new', 'same', 'packet:0'], lit: ['new'] },
]
function D_PurgeVersion({ step }: { step: number }) {
  return <Phased spec={T22} phases={T22_P} step={step} />
}

/* ================================================================== T22-B · one request, every edge, and the origin's load */

const T22B: DiagramSpec = {
  type: 'diagram',
  w: 546,
  h: 380,
  nodes: [
    { id: 'req', x: 273, y: 40, icon: 'Zap', shape: 'disc', size: 48, label: 'Invalidation Request', labelPos: 'right', tone: 'bad' },
    { id: 'e1', x: 90, y: 168, icon: 'lib:server-stack', shape: 'bare', size: 50, label: 'Edge 1' },
    { id: 'e2', x: 273, y: 168, icon: 'lib:server-stack', shape: 'bare', size: 50, label: 'Edge 2' },
    { id: 'e3', x: 456, y: 168, icon: 'lib:server-stack', shape: 'bare', size: 50, label: 'Edge 3' },
    { id: 'o', x: 273, y: 318, icon: 'lib:server-stack', shape: 'bare', size: 64, label: 'Origin Server', labelPos: 'right' },
  ],
  chips: [
    { id: 'cf', x: 90, y: 40, text: 'CloudFront', icon: 'Cloud', tone: 'brand' },
    { id: 'path', x: 456, y: 88, text: 'One Path', icon: 'FileText', tone: 'plain' },
    { id: 'all', x: 90, y: 88, text: 'Entire Cache', icon: 'Database', tone: 'plain' },
    { id: 'v2', x: 456, y: 262, text: 'New Filename', icon: 'FileCode2', tone: 'good' },
    { id: 'load', x: 120, y: 318, text: 'Origin Load', icon: 'TrendingUp', tone: 'warn' },
  ],
  arrows: [
    { from: 'req', to: 'e1', tone: 'bad' },
    { from: 'req', to: 'e2', tone: 'bad' },
    { from: 'req', to: 'e3', tone: 'bad' },
    { id: 'f1', from: 'e1', to: 'o', tone: 'warn' },
    { id: 'f2', from: 'e2', to: 'o', tone: 'warn' },
    { id: 'f3', from: 'e3', to: 'o', tone: 'warn' },
  ],
  packets: [
    { path: ['o', 'e1'], tone: 'accent' },
    { path: ['o', 'e2'], tone: 'accent' },
    { path: ['o', 'e3'], tone: 'accent' },
  ],
}
const T22B_P: Phase[] = [
  { add: ['req>e1', 'req>e2', 'req>e3', 'cf', 'v2', 'path', 'all', 'f1', 'f2', 'f3', 'load', 'packet:0', 'packet:1', 'packet:2'] },
  { add: ['req>e1', 'req>e2', 'req>e3'], lit: ['e1', 'e2', 'e3'] },
  { add: ['cf'], lit: ['req'] },
  { add: ['v2'], lit: ['e3'] },
  { add: ['path', 'all'], lit: ['path', 'all'] },
  { add: ['f1', 'f2', 'f3', 'load', 'packet:0', 'packet:1', 'packet:2'], lit: ['o'] },
]
function D_Invalidate({ step }: { step: number }) {
  return <Phased spec={T22B} phases={T22B_P} step={step} />
}

/* ================================================================== T23-B · two layers: DNS across regions, a load balancer inside one */

const T23B: DiagramSpec = {
  type: 'diagram',
  w: 1000,
  h: 316,
  boxes: [
    { id: 'top', label: 'DNS Routing', kind: 'region', icon: 'Globe', x: 14, y: 12, w: 972, h: 116 },
    { id: 'zoom', label: 'Region 1', kind: 'zone', icon: 'MapPin', x: 220, y: 150, w: 560, h: 154 },
  ],
  nodes: [
    /* corrections 2026-11-06 (slide 58, G1/G2): no generic person; DNS is the official Route 53 mark, the load balancer the ELB mark, one size */
    { id: 'dns', x: 200, y: 76, icon: `img:${route53Svg}`, shape: 'bare', size: 50, label: 'DNS', labelPos: 'right' },
    { id: 'r1', x: 540, y: 76, icon: 'lib:server-stack', shape: 'bare', size: 46, label: 'Region 1', labelPos: 'right' },
    { id: 'r2', x: 700, y: 76, icon: 'lib:server-stack', shape: 'bare', size: 46, label: 'Region 2', labelPos: 'right' },
    { id: 'r3', x: 860, y: 76, icon: 'lib:server-stack', shape: 'bare', size: 46, label: 'Region 3', labelPos: 'right' },
    { id: 'lb', x: 360, y: 238, icon: `img:${elbSvg}`, shape: 'bare', size: 50, label: 'Load Balancer' },
    { id: 's1', x: 560, y: 196, icon: 'Server', shape: 'tile', size: 34, label: 'Server 1', labelPos: 'right' },
    { id: 's2', x: 560, y: 238, icon: 'Server', shape: 'tile', size: 34, label: 'Server 2', labelPos: 'right' },
    { id: 's3', x: 560, y: 280, icon: 'Server', shape: 'tile', size: 34, label: 'Server 3', labelPos: 'right' },
  ],
  arrows: [
    { id: 'go', from: 'dns', to: 'r1', tone: 'good' },
    { id: 'in', from: 'r1', to: 'lb', tone: 'good', via: [[540, 140], [360, 140]] },
    { from: 'lb', to: 's1', tone: 'good' },
    { from: 'lb', to: 's2', tone: 'good' },
    { from: 'lb', to: 's3', tone: 'good' },
  ],
  packets: [{ path: ['dns', 'r1', 'lb', 's2'], tone: 'good' }],
}
const T23B_P: Phase[] = [
  { add: ['go', 'zoom', 'lb', 's1', 's2', 's3', 'in', 'lb>s1', 'lb>s2', 'lb>s3', 'packet:0'] },
  { add: ['go'], lit: ['r1'] },
  { add: ['zoom', 'lb', 's1', 's2', 's3', 'in', 'lb>s1', 'lb>s2', 'lb>s3', 'packet:0'], lit: ['lb'] },
]
function D_TwoLayers({ step }: { step: number }) {
  return <Phased spec={T23B} phases={T23B_P} step={step} />
}

export const figures = { D_DnsPick, D_EdgeOrigin, D_GeoMap, D_PolicyCells, D_FailTimeline, D_Failover, D_CdnMap, D_HitMiss, D_OriginPull, D_PurgeVersion, D_Invalidate, D_TwoLayers }
export const slides = {}

/* two sentences, two lines: a lead string may carry a line break (the engine renders the lead as one paragraph) */
const PRE = ['T17', 'T23'].map((id) => `div:has(> div > [data-spec="${id}"]) p.text-body-lg`).concat(['T18', 'T22', 'T23-B'].map((id) => `[data-spec="${id}"] p.text-center`))
/* a diagram chip's or arrow label's positioned wrapper keeps the chip's untranslated width (the chip itself is centred by a
   transform), so near a stage's right edge the wrapper reads as overflow though the chip is inside: zero the wrapper on these slides */
const MINE = ['T17', 'T17-B', 'T18', 'T18-B', 'T19', 'T19-B', 'T20', 'T20-B', 'T21', 'T22', 'T22-B', 'T23', 'T23-B']
const WRAP = MINE.flatMap((id) => [`[data-spec="${id}"] [data-diagram-chip]`, `[data-spec="${id}"] [data-diagram-arrow] > div.absolute:not(.pointer-events-none)`])
export const css = `${PRE.join(', ')} { white-space: pre-line; } ${WRAP.join(', ')} { width: 0; }`
