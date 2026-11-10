import { useId, type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { Arrow, At, Label, Traveller, useCycle, useLoop } from '../scene'
import { ClayDataCentre, ClayHouse, ClayNo, ClayPadlock, ClayRack, ClayTaxi, ClayTicket, Icon3D, LAB, RichCloud, TenantTile } from '../d3/kit'
import { TILE_SKIN } from '../card'
import { ISO, beatOf, pulse, within } from './iso'
import { Dot, FigureOnly, IsoAnalogy, PointsFigure, TableCard } from './frames'

/**
 * SECTION 1 · CLOUD DEPLOYMENT MODELS (reference frames 6 to 16).
 *
 * REBUILT 2026-10-26 in session 1's 3D style (the user: the flat isometric
 * look is retired). Every figure is the TR's Visual Guidance or the TR's own
 * diagram, drawn with session 1's front-facing clay objects and the library's
 * renders on raised plates, and runs one loop whose motion is the claim:
 * capacity flows out from the one provider (public), the fence is the
 * organisation's own or the provider's (private), workloads cross one bridge
 * (hybrid), a gauge crosses a line before anything bursts, members' traffic
 * converges inside the ring and the public bounces off it (community). Labels
 * are the reference's strings, as HTML chips.
 */

const LAP = 8000
const TENANTS = [colors.brand, colors.teal, ISO.green]
/** what the customer brings (the reference's amber, `ISO.customer`) */
const AMBER = '#F5A623'
const EASE = 'cubic-bezier(0.22,1,0.36,1)'

/* ------------------------------------------------------------------ local pieces */

/** An object placed by its bottom centre (`x`, `b`), so a row of things shares one ground line. */
function Put({ x, b, children, style }: { x: number; b: number; children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="absolute" style={{ left: x, top: b, transform: 'translate(-50%, -100%)', ...style }}>
      {children}
    </div>
  )
}

/**
 * A raised plate on the stage that groups a site: `plain` the white plate,
 * `own` the organisation's own fence (a solid brand rim), `provider` the
 * provider's (a dashed cool rim), `lit` the plate that has just taken work.
 */
function Zone({ x, y, w, h, kind = 'plain', dim = false }: { x: number; y: number; w: number; h: number; kind?: 'plain' | 'own' | 'provider' | 'lit'; dim?: boolean }) {
  const skin: CSSProperties =
    kind === 'own'
      ? { background: 'linear-gradient(180deg, rgba(45,99,251,0.07), rgba(45,99,251,0.02))', boxShadow: `inset 0 0 0 2px ${colors.brand}` }
      : kind === 'provider'
        ? { background: 'linear-gradient(180deg, rgba(166,187,232,0.10), rgba(166,187,232,0.03))', outline: `2px dashed ${LAB.lavDeep}`, outlineOffset: -2 }
        : kind === 'lit'
          ? { ...TILE_SKIN, boxShadow: `inset 0 0 0 2px ${colors.brand}, inset 0 1px 0 #FFFFFF, 0 14px 28px -16px rgba(45,99,251,0.45)` }
          : TILE_SKIN
  return <div aria-hidden className="pointer-events-none absolute rounded-[18px]" style={{ left: x, top: y, width: w, height: h, opacity: dim ? 0.55 : 1, transition: `all 420ms ${EASE}`, ...skin }} />
}

/** A packet on a straight link from `a` to `b` at phase `t` (0..1): moved by transform only, fading at both ends. */
function Pkt({ a, b, t, tone = colors.brand, size = 12, on = true, square = false }: { a: [number, number]; b: [number, number]; t: number; tone?: string; size?: number; on?: boolean; square?: boolean }) {
  const x = a[0] + (b[0] - a[0]) * t
  const y = a[1] + (b[1] - a[1]) * t
  const fade = Math.max(0, Math.min(1, t * 6, (1 - t) * 6))
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute left-0 top-0 ${square ? 'rounded-[4px]' : 'rounded-full'}`}
      style={{ width: size, height: size, background: tone, boxShadow: square ? `0 0 0 2px ${colors.white}, 0 4px 10px -2px ${tone}` : `0 0 0 4px ${tone}40`, transform: `translate(${x - size / 2}px, ${y - size / 2}px)`, opacity: on ? fade : 0 }}
    />
  )
}

/**
 * The load gauge, drawn here in session 1's way (no library render fits): a
 * glass tube with a lit left edge and a specular, the level a rounded column
 * that grows by `scaleY` and turns red past the dashed threshold line.
 */
function Gauge({ load, thresh, over, h = 150 }: { load: number; thresh: number; over: boolean; h?: number }) {
  const id = useId().replace(/:/g, '')
  const W = 34
  const foot = h - 9
  const run = h - 18
  const lineY = foot - run * thresh
  return (
    <svg width={W} height={h} viewBox={`0 0 ${W} ${h}`} aria-hidden style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" x2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#D9E4FA" />
        </linearGradient>
        <linearGradient id={`${id}-b`} x1="0" x2="1">
          <stop offset="0" stopColor={LAB.sky} />
          <stop offset="1" stopColor={LAB.cobalt} />
        </linearGradient>
        <linearGradient id={`${id}-r`} x1="0" x2="1">
          <stop offset="0" stopColor="#FF8A80" />
          <stop offset="1" stopColor={LAB.red} />
        </linearGradient>
        <radialGradient id={`${id}-s`}>
          <stop offset="0" stopColor="rgba(31,64,140,0.28)" />
          <stop offset="1" stopColor="rgba(31,64,140,0)" />
        </radialGradient>
      </defs>
      <ellipse cx={W / 2} cy={h - 2} rx={20} ry={4} fill={`url(#${id}-s)`} />
      <rect x={2} y={2} width={W - 4} height={h - 6} rx={(W - 4) / 2} fill={`url(#${id}-g)`} stroke="#C3D3F0" strokeWidth={1.5} />
      <g style={{ transformOrigin: `${W / 2}px ${foot}px`, transform: `scaleY(${load})`, transition: 'transform 120ms linear' }}>
        <rect x={8} y={foot - run} width={W - 16} height={run} rx={(W - 16) / 2} fill={`url(#${id}-b)`} />
        <rect x={8} y={foot - run} width={W - 16} height={run} rx={(W - 16) / 2} fill={`url(#${id}-r)`} style={{ opacity: over ? 1 : 0, transition: `opacity 240ms ${EASE}` }} />
      </g>
      <rect x={9} y={10} width={5} height={h * 0.45} rx={2.5} fill="#FFFFFF" opacity={0.6} />
      <line x1={-8} y1={lineY} x2={W + 8} y2={lineY} stroke={colors.ink} strokeWidth={2} strokeDasharray="4 3" strokeLinecap="round" />
    </svg>
  )
}

/**
 * An oven, drawn here in session 1's way (neither the catalogue nor the library
 * has one): a pale rounded body lit from the upper left, a navy control strip
 * with three knobs, a dark door window that glows amber while it cooks.
 */
function Oven({ w, on }: { w: number; on: boolean }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg width={w} height={(w * 84) / 80} viewBox="0 0 80 84" aria-hidden style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor={LAB.lavDeep} />
        </linearGradient>
        <linearGradient id={`${id}-strip`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3B52B0" />
          <stop offset="1" stopColor={LAB.navy} />
        </linearGradient>
        <radialGradient id={`${id}-fire`} cx="0.5" cy="0.75" r="0.8">
          <stop offset="0" stopColor={LAB.yellow} />
          <stop offset="1" stopColor={LAB.orange} />
        </radialGradient>
        <radialGradient id={`${id}-shadow`}>
          <stop offset="0" stopColor="rgba(31,64,140,0.28)" />
          <stop offset="1" stopColor="rgba(31,64,140,0)" />
        </radialGradient>
      </defs>
      <ellipse cx={40} cy={81} rx={36} ry={4} fill={`url(#${id}-shadow)`} />
      <rect x={4} y={4} width={72} height={74} rx={12} fill={`url(#${id}-body)`} />
      <rect x={4} y={4} width={72} height={18} rx={10} fill={`url(#${id}-strip)`} />
      <rect x={4} y={14} width={72} height={8} fill={`url(#${id}-strip)`} />
      {[20, 34, 48].map((cx) => (
        <circle key={cx} cx={cx} cy={13} r={3.6} fill="#E8EEFC" />
      ))}
      <circle cx={64} cy={13} r={3} fill={on ? '#3DDC84' : '#8A94B8'} style={{ transition: `fill 420ms ${EASE}` }} />
      <rect x={18} y={27} width={44} height={3.5} rx={1.75} fill="#FFFFFF" opacity={0.9} />
      <rect x={13} y={34} width={54} height={36} rx={8} fill={LAB.charcoal} />
      <rect x={16} y={37} width={48} height={30} rx={6} fill={`url(#${id}-fire)`} style={{ opacity: on ? 1 : 0, transition: `opacity 420ms ${EASE}` }} />
      <path d="M 16 43 Q 16 37 22 37 L 40 37 L 16 60 Z" fill="#FFFFFF" opacity={0.2} />
      <ellipse cx={16} cy={9} rx={7} ry={3} fill="#FFFFFF" opacity={0.35} />
    </svg>
  )
}

/* ================================================================== 6 · four ways to deploy */

/**
 * The spectrum: four sites on one ground line, the rail under them from FULLY
 * SHARED to FULLY DEDICATED, the `Infrastructure Choice` node above with a
 * link to each site; the pointer walks the rail and lights the site it reaches
 * (its link, its chip, its objects).
 */
const MAP_X = [225, 445, 665, 885]
const MAP_BASE = 206
/* the top of each site's tallest object, where its link from the node stops */
const MAP_TOP = [107, 100, 146, 127]

export function DeployMap({ lesson }: { lesson: string }) {
  const t = useLoop(12000, { mode: 'pingpong', still: 0.34 })
  const pos = t * 3 // 0..3 along the four sites
  const lit = Math.round(pos)
  const sites = [
    { title: 'Public cloud', sub: 'Provider-owned, shared across tenants' },
    { title: 'Community cloud', sub: 'Shared by organisations with common needs' },
    { title: 'Hybrid cloud', sub: 'Private and public linked together' },
    { title: 'Private cloud', sub: 'Dedicated, either on-premise or hosted' },
  ]
  const op = (i: number): CSSProperties => ({ opacity: lit === i ? 1 : 0.45, transition: `opacity 420ms ${EASE}` })
  return (
    <FigureOnly id="deploy-map" kicker="Deployment Models Map" title="Four Ways To Deploy" lead="Every workload needs infrastructure somewhere, and no single arrangement of ownership, location and sharing suits every organisation's control and compliance needs" lesson={lesson} h={392}>
      <At x={555} y={24} cx>
        <Label tone="solid" size={16} strong>
          Infrastructure Choice
        </Label>
      </At>
      {MAP_X.map((x, i) => (
        <Arrow key={i} x1={555} y1={52} x2={x} y2={i === 2 ? 168 : MAP_TOP[i] - 3} tone={lit === i ? colors.brand : colors.line} width={2} />
      ))}
      {/* public: the provider's one data centre */}
      <Put x={MAP_X[0]} b={MAP_BASE} style={op(0)}>
        <ClayDataCentre w={136} />
      </Put>
      {/* community: one shared cloud over three members */}
      <Put x={MAP_X[1]} b={MAP_BASE} style={op(1)}>
        <div className="flex flex-col items-center gap-1.5">
          <RichCloud w={100} />
          <div className="flex gap-1.5">
            {TENANTS.map((c) => (
              <TenantTile key={c} w={32} tone={c} />
            ))}
          </div>
        </div>
      </Put>
      {/* hybrid: the organisation's own site linked to a cloud */}
      <Put x={MAP_X[2] - 75} b={MAP_BASE} style={op(2)}>
        <TenantTile w={60} tone={colors.brand} />
      </Put>
      <div className="absolute inset-0" style={op(2)}>
        <Arrow x1={MAP_X[2] - 37} y1={176} x2={MAP_X[2] + 3} y2={176} both tone={colors.brand} width={2} />
      </div>
      <Put x={MAP_X[2] + 53} b={MAP_BASE} style={op(2)}>
        <RichCloud w={84} />
      </Put>
      {/* private: one dedicated rack, locked */}
      <Put x={MAP_X[3] - 21} b={MAP_BASE} style={op(3)}>
        <ClayRack w={72} units={['run', 'run', 'run']} />
      </Put>
      <Put x={MAP_X[3] + 41} b={MAP_BASE - 2} style={op(3)}>
        <ClayPadlock w={32} />
      </Put>
      {/* the rail, its stops, and the pointer that walks it */}
      <div aria-hidden className="pointer-events-none absolute rounded-full" style={{ left: 200, top: 230, width: 710, height: 4, background: colors.line }} />
      {MAP_X.map((x, i) => (
        <span key={x} aria-hidden className="pointer-events-none absolute rounded-full" style={{ left: x - 5, top: 227, width: 10, height: 10, background: lit === i ? colors.brand : '#B9CBEF', transition: `background 420ms ${EASE}` }} />
      ))}
      <span aria-hidden className="pointer-events-none absolute left-0 top-0 rounded-full" style={{ width: 18, height: 18, background: colors.brand, boxShadow: `0 0 0 5px ${colors.brand}33, 0 4px 10px -2px ${colors.brand}`, transform: `translate(${MAP_X[0] - 9 + pos * 220}px, 223px)` }} />
      <At x={188} y={232} cy style={{ transform: 'translate(-100%, -50%)' }}>
        <Label tone="brand" size={14} strong mono>
          FULLY SHARED
        </Label>
      </At>
      <At x={922} y={232} cy>
        <Label tone="brand" size={14} strong mono>
          FULLY DEDICATED
        </Label>
      </At>
      {sites.map((s, i) => (
        <At key={s.title} x={MAP_X[i]} y={252} cx w={200}>
          <div className="flex flex-col items-center gap-1 text-center">
            <Label tone={lit === i ? 'brand' : 'plain'} size={16} strong>
              {s.title}
            </Label>
            <span className="text-[14px] leading-snug" style={{ color: colors.muted }}>
              {s.sub}
            </span>
          </div>
        </At>
      ))}
    </FigureOnly>
  )
}

/* ================================================================== 7 · public cloud */

/**
 * The TR's diagram, in session 1's 3D style (2026-10-26 rebuild): the provider's
 * data centre in the middle under its AWS mark, Enterprise P and Q either side,
 * User R below; the provider's capacity flows OUT to each tenant in turn.
 */
function PublicScene() {
  const k = useCycle(3, 2400, 1)
  /* the data centre's base, and the top centre of each tenant on the row under it */
  const SRC: [number, number][] = [[262, 212], [317, 214], [372, 212]]
  const TO: [number, number][] = [[118, 250], [317, 244], [516, 250]]
  return (
    <>
      <At x={317} y={22} cx>
        <Label tone="brand" size={15} strong>
          Cloud Service Provider
        </Label>
      </At>
      <At x={317} y={58} cx>
        <div className="flex flex-col items-center gap-1">
          <img src="/assets/companies/aws.png" alt="AWS" draggable={false} className="h-[20px] w-auto select-none" />
          <ClayDataCentre w={186} />
        </div>
      </At>
      {TO.map(([x, y], i) => (
        <Arrow key={i} x1={SRC[i][0]} y1={SRC[i][1]} x2={x} y2={y} tone={i === k ? colors.brand : colors.line} />
      ))}
      <Traveller path={[SRC[k], TO[k]]} run k={k} size={12} tone={TENANTS[k]} dur={1.2} />
      {[
        { x: 118, name: 'Enterprise P', art: <TenantTile w={66} tone={TENANTS[0]} /> },
        { x: 317, name: 'User R', art: <Icon3D name="boy-laptop" w={66} shadow={false} /> },
        { x: 516, name: 'Enterprise Q', art: <TenantTile w={66} tone={TENANTS[1]} /> },
      ].map((t) => (
        <At key={t.name} x={t.x} y={256} cx>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-[66px] items-end">{t.art}</div>
            <Label size={15} strong>
              {t.name}
            </Label>
          </div>
        </At>
      ))}
    </>
  )
}

export function PublicCloud({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="public"
      kicker="Public Cloud"
      title="Shared Multi-Tenant Infrastructure"
      lead="A provider such as Amazon Web Services (AWS) builds and operates the data centres, then rents capacity to any customer over the internet on shared hardware"
      lesson={lesson}
      points={['Infrastructure owned and run entirely by the provider', 'Many tenants share hardware, isolated logically from each other', 'Capacity scales rapidly across resources pooled across customers', 'Best fit: variable workloads, fast launch, low compliance limits']}
      figure={<PublicScene />}
    />
  )
}

/* ================================================================== 8 · a shared cab */

/** Three riders, each in a tenant's colour, board the one cab at the stop; it arrives, waits while they board, and drives on. */
const RIDERS = [
  { name: 'man-pro', w: 44 },
  { name: 'woman-pro', w: 42 },
  { name: 'student-bag', w: 52 },
]

function CabScene() {
  const t = useLoop(LAP, { mode: 'sawtooth', still: 0.68 })
  // the cab drives in (0..0.3), waits while three riders board (0.3..0.7), drives off (0.72..1)
  const inT = within(t, 0, 0.3)
  const outT = within(t, 0.72, 1)
  const cabDx = -60 * (1 - inT) + 70 * outT
  const cabOp = Math.max(0, Math.min(1, inT * 1.5, 1 - outT))
  const boarded = (i: number) => within(t, 0.32 + i * 0.12, 0.42 + i * 0.12)
  const BASE = 214
  /* the cab's three window seats, at w 200 (the taxi's own 200x104 viewbox, scaled) */
  const SEATS = [70, 118, 140]
  return (
    <>
      {/* the road: a soft charcoal band with a dashed centre line */}
      <div aria-hidden className="pointer-events-none absolute rounded-[12px]" style={{ left: 24, top: BASE + 4, width: 422, height: 24, background: `linear-gradient(180deg, #55545E, ${LAB.charcoal})`, boxShadow: '0 10px 18px -12px rgba(31,64,140,0.5)' }} />
      <div aria-hidden className="pointer-events-none absolute" style={{ left: 40, top: BASE + 15, width: 390, height: 0, borderTop: '2px dashed rgba(255,255,255,0.6)' }} />
      {/* the stop: a post with its sign */}
      <div aria-hidden className="pointer-events-none absolute rounded-full" style={{ left: 401, top: 66, width: 7, height: BASE - 62, background: `linear-gradient(90deg, #FFFFFF, ${LAB.lavDeep})`, boxShadow: '0 6px 10px -6px rgba(31,64,140,0.5)' }} />
      <At x={404} y={40} cx>
        <Label size={14} tone="muted" raised>
          The stop
        </Label>
      </At>
      <Put x={126} b={BASE + 6} style={{ opacity: cabOp }}>
        <div className="relative" style={{ transform: `translateX(${cabDx}px)` }}>
          <ClayTaxi w={200} />
          {TENANTS.map((c, i) => (
            <span key={c} aria-hidden className="pointer-events-none absolute rounded-full" style={{ left: SEATS[i] - 7, top: 31, width: 14, height: 14, background: c, boxShadow: `0 0 0 2px ${colors.white}`, opacity: boarded(i) > 0.5 ? 1 : 0, transition: `opacity 300ms ${EASE}` }} />
          ))}
        </div>
      </Put>
      {RIDERS.map((r, i) =>
        boarded(i) > 0.98 ? null : (
          <Put key={r.name} x={[278, 322, 368][i]} b={BASE} style={{ opacity: 1 - boarded(i), transform: `translate(calc(-50% - ${boarded(i) * 40}px), -100%)` }}>
            <div className="flex flex-col items-center gap-1.5">
              <span aria-hidden className="block rounded-full" style={{ width: 12, height: 12, background: TENANTS[i], boxShadow: `0 0 0 3px ${TENANTS[i]}33` }} />
              <Icon3D name={r.name} w={r.w} shadow={false} />
            </div>
          </Put>
        ),
      )}
    </>
  )
}

/** On the cloud side the same three colours reach one shared rack, and the unit each one rents lights. */
function TenantRackScene() {
  const t = useLoop(LAP, { mode: 'sawtooth', still: 0.68 })
  const boarded = (i: number) => within(t, 0.32 + i * 0.12, 0.46 + i * 0.12)
  const ROWS = [72, 150, 228]
  const UNITS = [113, 149, 186]
  const from = (i: number): [number, number] => [134, ROWS[i]]
  const to = (i: number): [number, number] => [276, UNITS[i]]
  return (
    <>
      {TENANTS.map((c, i) => (
        <Arrow key={c} x1={from(i)[0]} y1={from(i)[1]} x2={to(i)[0]} y2={to(i)[1]} tone={boarded(i) > 0.5 ? c : colors.line} width={2} />
      ))}
      {TENANTS.map((c, i) => {
        const p = within(t, 0.36 + i * 0.12, 0.56 + i * 0.12)
        return <Pkt key={c} a={from(i)} b={[to(i)[0] - 12, to(i)[1]]} t={p} tone={c} on={t > 0.36 + i * 0.12 && t < 0.56 + i * 0.12} />
      })}
      {TENANTS.map((c, i) => (
        <At key={c} x={96} y={ROWS[i]} cx cy>
          <TenantTile w={56} tone={c} />
        </At>
      ))}
      <At x={345} y={150} cx cy>
        <ClayRack w={130} units={TENANTS.map((_, i) => (boarded(i) > 0.5 ? 'run' : 'idle'))} />
      </At>
      <At x={345} y={234} cx>
        <Label tone="brand" size={14} strong>
          One shared rack
        </Label>
      </At>
    </>
  )
}

export function PublicAnalogy({ lesson }: { lesson: string }) {
  return <IsoAnalogy id="public-analogy" kicker="Public Cloud" lesson={lesson} everyday={{ label: 'A shared cab', scene: <CabScene /> }} cloud={{ label: 'Public cloud', scene: <TenantRackScene /> }} claim="Many riders share one vehicle" />
}

/* ================================================================== 9 · private cloud, on-premise against hosted */

/**
 * The TR's split diagram. Left: Enterprise P's own building and its rack inside
 * its own fence, locked. Right: the provider's larger fence; inside it P's
 * dedicated, locked section, and the provider's other servers greyed beside it.
 */
function PrivateScene() {
  const t = useLoop(LAP, { mode: 'sawtooth', still: 0.4 })
  const BASE = 262
  return (
    <>
      <At x={24} y={24}>
        <Label size={16} strong>
          On-Premise Private Cloud
        </Label>
      </At>
      <At x={560} y={24}>
        <Label size={16} strong>
          Externally Hosted Private Cloud
        </Label>
      </At>

      {/* on-premise: the organisation's own fence round all of it */}
      <Zone x={24} y={66} w={500} h={262} kind="own" />
      <At x={44} y={84}>
        <Label tone="brand" size={14} strong mono>
          ENTERPRISE P
        </Label>
      </At>
      <Put x={150} b={BASE}>
        <TenantTile w={96} tone={colors.brand} />
      </Put>
      <Arrow x1={210} y1={214} x2={270} y2={214} width={2} />
      <Pkt a={[210, 214]} b={[262, 214]} t={t} />
      <Put x={334} b={BASE + 4}>
        <ClayRack w={100} units={['run', 'run', 'run']} />
      </Put>
      <Put x={440} b={BASE}>
        <ClayPadlock w={40} />
      </Put>
      <At x={334} y={BASE + 14} cx>
        <Label tone="brand" size={15} strong>
          Private cloud
        </Label>
      </At>

      {/* hosted: the provider's fence, P's dedicated section inside it, the other servers greyed */}
      <Zone x={560} y={66} w={526} h={290} kind="provider" />
      <At x={580} y={84}>
        <Label tone="muted" size={14} strong mono>
          CLOUD SERVICE PROVIDER
        </Label>
      </At>
      <Zone x={580} y={124} w={290} h={186} kind="own" />
      <Put x={636} b={BASE}>
        <TenantTile w={76} tone={colors.brand} />
      </Put>
      <Arrow x1={682} y1={226} x2={712} y2={226} width={2} />
      <Pkt a={[682, 226]} b={[706, 226]} t={t} />
      <Put x={758} b={BASE + 4}>
        <ClayRack w={84} units={['run', 'run', 'run']} />
      </Put>
      <Put x={836} b={BASE}>
        <ClayPadlock w={34} />
      </Put>
      <At x={725} y={BASE + 12} cx>
        <Label tone="brand" size={15} strong>
          Enterprise P
        </Label>
      </At>
      {[934, 1022].map((x) => (
        <Put key={x} x={x} b={BASE + 4} style={{ opacity: 0.45 }}>
          <ClayRack w={70} units={['idle', 'idle', 'idle']} />
        </Put>
      ))}
      <At x={978} y={BASE + 14} cx>
        <Label tone="muted" size={14}>
          Other servers
        </Label>
      </At>
      <At x={725} y={320} cx>
        <span className="inline-flex items-center gap-2">
          <span className="relative block" style={{ width: 22, height: 20 }}>
            <Arrow x1={11} y1={18} x2={11} y2={2} on />
          </span>
          <Label tone="brand" size={15} strong>
            Dedicated for Enterprise P
          </Label>
        </span>
      </At>
    </>
  )
}

export function PrivateCloud({ lesson }: { lesson: string }) {
  return <FigureOnly id="private" kicker="Private Cloud" title="On-Premise Vs Hosted" lead="Private cloud dedicates infrastructure to one organisation only, chosen when compliance, data residency or latency needs rule out shared public hardware" lesson={lesson} figure={<PrivateScene />} h={380} />
}

export function PrivateTable({ lesson }: { lesson: string }) {
  return (
    <TableCard
      id="private-table"
      kicker="Private Cloud"
      title="On-Premise Vs Hosted"
      lesson={lesson}
      columns={[
        { label: 'Aspect', weight: 0.8 },
        { label: 'On-Premise Private', weight: 1.4 },
        { label: 'Hosted Private', weight: 1.4 },
      ]}
      rows={[
        ['Location', "Organisation's own data centre", "Provider's data centre, dedicated section"],
        ['Owned by', 'The organisation itself', 'Provider, leased to one customer'],
        ['Example', 'In-house VMware or OpenStack cluster', 'VMware Cloud on AWS'],
        ['Control', 'Full physical and logical control', 'Full logical control, no physical access'],
      ]}
    />
  )
}


/* ================================================================== 11 · a house or a bungalow */

/** Left: a house going up on your own plot, then locked; right: a bungalow in a gated estate, rented, locked the same moment. */
function HousesScene() {
  const t = useLoop(LAP, { mode: 'sawtooth', still: 0.7 })
  const built = within(t, 0.05, 0.45)
  const locked = within(t, 0.55, 0.7) > 0.5
  const BASE = 196
  return (
    <>
      <Zone x={24} y={52} w={202} h={172} kind="own" />
      <Put x={108} b={BASE}>
        {/* review 2026-10-26: the house rises into place and fades in; one uniform scale, so it never stretches (it was a scaleY) */}
        <div style={{ transformOrigin: '50% 100%', transform: `translateY(${(1 - built) * 22}px) scale(${0.9 + 0.1 * built})`, opacity: 0.2 + 0.8 * built }}>
          <ClayHouse w={110} />
        </div>
      </Put>
      <Put x={192} b={BASE}>
        <ClayPadlock w={32} open={!locked} />
      </Put>
      <Zone x={244} y={52} w={202} h={172} kind="provider" />
      <Put x={328} b={BASE}>
        <ClayHouse w={110} />
      </Put>
      <Put x={412} b={BASE}>
        <ClayPadlock w={32} open={!locked} />
      </Put>
      <At x={125} y={236} cx>
        <Label size={14} tone="muted">
          Your plot
        </Label>
      </At>
      <At x={345} y={236} cx>
        <Label size={14} tone="muted">
          A gated estate, rented
        </Label>
      </At>
    </>
  )
}

/** Left: a rack in your own building, switched on, then locked; right: a dedicated rack in the provider's hall beside another's idle one, locked the same moment. */
function RacksScene() {
  const t = useLoop(LAP, { mode: 'sawtooth', still: 0.7 })
  const locked = within(t, 0.55, 0.7) > 0.5
  const on = within(t, 0.05, 0.45) > 0.5
  const BASE = 196
  return (
    <>
      <Zone x={24} y={52} w={202} h={172} kind="own" />
      <Put x={70} b={BASE}>
        <TenantTile w={54} tone={colors.brand} />
      </Put>
      <Put x={142} b={BASE + 3}>
        <ClayRack w={66} units={on ? ['run', 'run', 'run'] : ['idle', 'idle', 'idle']} />
      </Put>
      <Put x={202} b={BASE}>
        <ClayPadlock w={28} open={!locked} />
      </Put>
      <Zone x={244} y={52} w={202} h={172} kind="provider" />
      <Put x={290} b={BASE + 3} style={{ opacity: 0.45 }}>
        <ClayRack w={60} units={['idle', 'idle', 'idle']} />
      </Put>
      <Put x={360} b={BASE + 3}>
        <ClayRack w={66} units={on ? ['run', 'run', 'run'] : ['idle', 'idle', 'idle']} />
      </Put>
      <Put x={422} b={BASE}>
        <ClayPadlock w={28} open={!locked} />
      </Put>
      <At x={125} y={236} cx>
        <Label size={14} tone="brand" strong>
          On-premise
        </Label>
      </At>
      <At x={345} y={236} cx>
        <Label size={14} tone="brand" strong>
          Hosted, dedicated
        </Label>
      </At>
    </>
  )
}

export function PrivateAnalogy({ lesson }: { lesson: string }) {
  return <IsoAnalogy id="private-analogy" kicker="Private Cloud" lesson={lesson} everyday={{ label: 'Build a house or rent a bungalow', scene: <HousesScene /> }} cloud={{ label: 'On-premise or hosted private cloud', scene: <RacksScene /> }} claim="Both are yours alone" />
}

/* ================================================================== 12 · hybrid cloud */

/** One linked system: Enterprise P's own private site bridged to the provider's data centre, P present on both sides, workloads crossing the bridge both ways. */
function HybridScene() {
  const t = useLoop(LAP, { mode: 'sawtooth', still: 0.3 })
  const BASE = 270
  const OUT: [[number, number], [number, number]] = [[356, 204], [594, 204]]
  const BACK: [[number, number], [number, number]] = [[594, 240], [356, 240]]
  return (
    <>
      <At x={44} y={24}>
        <Label size={16} strong>
          Private cloud
        </Label>
      </At>
      <At x={600} y={24}>
        <Label size={16} strong>
          Public cloud
        </Label>
      </At>

      {/* the private side: P's own fence */}
      <Zone x={24} y={66} w={396} h={278} kind="own" />
      <At x={44} y={84}>
        <Label tone="brand" size={14} strong mono>
          ENTERPRISE P
        </Label>
      </At>
      <Put x={130} b={BASE}>
        <TenantTile w={100} tone={colors.brand} />
      </Put>
      <Put x={290} b={BASE + 4}>
        <ClayRack w={100} units={['run', 'run', 'run']} />
      </Put>
      <At x={290} y={BASE + 14} cx>
        <Label tone="brand" size={15} strong>
          Private cloud
        </Label>
      </At>

      {/* the bridge: workloads cross both ways */}
      <Arrow x1={OUT[0][0]} y1={OUT[0][1]} x2={OUT[1][0]} y2={OUT[1][1]} width={3} />
      <Arrow x1={BACK[0][0]} y1={BACK[0][1]} x2={BACK[1][0]} y2={BACK[1][1]} width={3} />
      <Pkt a={OUT[0]} b={[OUT[1][0] - 14, OUT[1][1]]} t={t} size={14} square />
      <Pkt a={BACK[0]} b={[BACK[1][0] + 14, BACK[1][1]]} t={(t + 0.5) % 1} size={14} square />
      <At x={500} y={160} cx cy>
        <Label tone="solid" size={22} strong>
          +
        </Label>
      </At>

      {/* the public side: the provider's data centre, P's rack and Q's beside it */}
      <Zone x={580} y={66} w={506} h={278} kind="provider" />
      <Put x={690} b={BASE}>
        <ClayDataCentre w={170} />
      </Put>
      <At x={690} y={BASE + 14} cx>
        <Label size={15} strong>
          Cloud Service Provider
        </Label>
      </At>
      {[
        { x: 875, tone: colors.brand, name: 'Enterprise P', label: 'brand' as const },
        { x: 1000, tone: colors.teal, name: 'Enterprise Q', label: 'plain' as const },
      ].map((r) => (
        <div key={r.name}>
          <Put x={r.x} b={BASE + 4}>
            <div className="flex flex-col items-center gap-2">
              <TenantTile w={30} tone={r.tone} />
              <ClayRack w={80} units={['run', 'run', 'run']} />
            </div>
          </Put>
          <At x={r.x} y={BASE + 14} cx>
            <Label tone={r.label} size={15} strong>
              {r.name}
            </Label>
          </At>
        </div>
      ))}
    </>
  )
}

export function HybridCloud({ lesson }: { lesson: string }) {
  return <FigureOnly id="hybrid" kicker="Hybrid Cloud" title="Cloud Bursting Explained" lead="Hybrid cloud links private and public infrastructure so workloads move between them, avoiding the need to size on-premise capacity for rare demand peaks" lesson={lesson} figure={<HybridScene />} h={380} />
}

/* ================================================================== 13 · cloud bursting */

/** The TR's gauge: the private racks' load fills past the threshold line, and only then does the dashed `burst` arrow carry work to the public cloud and its racks light. */
function BurstScene() {
  const t = useLoop(10000, { mode: 'sawtooth', still: 0.5 })
  const load = 0.28 + 0.6 * pulse(t, 0.1, 0.42, 0.62, 0.9)
  const THRESH = 0.7
  const over = load >= THRESH
  const burstT = within(t, 0.32, 0.62)
  const BASE = 262
  const A: [number, number] = [316, 222]
  const B: [number, number] = [404, 222]
  return (
    <>
      <At x={70} y={64} cx>
        <Label size={14} tone="muted">
          Threshold
        </Label>
      </At>
      <Put x={70} b={BASE}>
        <Gauge load={load} thresh={THRESH} over={over} h={160} />
      </Put>

      <Zone x={122} y={76} w={198} h={246} />
      <Put x={176} b={BASE + 4}>
        <ClayRack w={80} units={['run', 'run', load > 0.5 ? 'run' : 'idle', load > 0.6 ? 'hot' : 'idle']} />
      </Put>
      <Put x={266} b={BASE + 4}>
        <ClayRack w={80} units={['run', load > 0.4 ? 'run' : 'idle', load > 0.55 ? 'hot' : 'idle', load > 0.65 ? 'hot' : 'idle']} />
      </Put>
      <At x={221} y={BASE + 12} cx>
        <Label size={15} strong>
          Private Infrastructure
        </Label>
      </At>

      <div className="absolute inset-0" style={{ opacity: over ? 1 : 0.2, transition: `opacity 420ms ${EASE}` }}>
        <Arrow x1={A[0] + 8} y1={A[1]} x2={B[0] - 8} y2={B[1]} dashed width={2.5} />
      </div>
      <Pkt a={[A[0] + 8, A[1]]} b={[B[0] - 20, B[1]]} t={(burstT * 2) % 1} on={over} />
      <At x={360} y={190} cx cy>
        <Label tone={over ? 'brand' : 'muted'} size={14} strong mono>
          burst
        </Label>
      </At>

      <Zone x={400} y={76} w={196} h={246} kind={over ? 'lit' : 'plain'} />
      <Put x={498} b={178} style={{ opacity: over ? 1 : 0.55, transition: `opacity 420ms ${EASE}` }}>
        <RichCloud w={120} />
      </Put>
      {[456, 540].map((x, i) => (
        <Put key={x} x={x} b={BASE + 4} style={{ opacity: over ? 1 : 0.55, transition: `opacity 420ms ${EASE}` }}>
          <ClayRack w={70} units={over ? (i === 0 ? ['run', 'run', 'run'] : ['run', 'run', 'idle']) : ['idle', 'idle', 'idle']} />
        </Put>
      ))}
      <At x={498} y={BASE + 12} cx>
        <Label tone={over ? 'brand' : 'plain'} size={15} strong>
          Public Cloud
        </Label>
      </At>
    </>
  )
}

export function HybridBurst({ lesson }: { lesson: string }) {
  return <PointsFigure id="hybrid-burst" kicker="Hybrid Cloud" title="Cloud Bursting Explained" lesson={lesson} points={['Sudden overload bursts into public cloud capacity temporarily', 'Cloud bursting: automatic overflow triggered by demand thresholds', 'Example: AWS Outposts extends AWS infrastructure into on-premise sites']} figure={<BurstScene />} />
}


/* ================================================================== 14 · a banquet hall for the rush */

/** The kitchen's two stoves cope until the order queue grows; then the banquet hall's stoves next door light and take the overflow, and switch off when the rush ends. */
function KitchenScene() {
  const t = useLoop(10000, { mode: 'sawtooth', still: 0.5 })
  const rush = pulse(t, 0.1, 0.42, 0.62, 0.9)
  const orders = Math.round(1 + rush * 5)
  const hired = rush > 0.6
  return (
    <>
      <Zone x={24} y={52} w={190} h={172} />
      {[78, 160].map((x) => (
        <Put key={x} x={x} b={146}>
          <Oven w={70} on />
        </Put>
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <Put key={i} x={77 + (i % 3) * 42} b={184 + Math.floor(i / 3) * 28} style={{ opacity: i < orders ? 1 : 0, transition: `opacity 300ms ${EASE}` }}>
          <ClayTicket w={34} />
        </Put>
      ))}
      <Zone x={250} y={52} w={196} h={172} kind={hired ? 'lit' : 'plain'} />
      {[290, 348, 406].map((x) => (
        <Put key={x} x={x} b={146} style={{ opacity: hired ? 1 : 0.45, transition: `opacity 420ms ${EASE}` }}>
          <Oven w={52} on={hired} />
        </Put>
      ))}
      {[320, 376].map((x) => (
        <Put key={x} x={x} b={198} style={{ opacity: hired ? 1 : 0, transition: `opacity 420ms ${EASE}` }}>
          <ClayTicket w={34} />
        </Put>
      ))}
      <div className="absolute inset-0" style={{ opacity: hired ? 1 : 0, transition: `opacity 300ms ${EASE}` }}>
        <Arrow x1={186} y1={186} x2={296} y2={186} dashed width={2.2} />
      </div>
      <Pkt a={[186, 186]} b={[284, 186]} t={(t * 4) % 1} tone={AMBER} on={hired} />
      <At x={119} y={236} cx>
        <Label size={14} tone="muted">
          The restaurant kitchen
        </Label>
      </At>
      <At x={348} y={236} cx>
        <Label size={14} tone={hired ? 'brand' : 'muted'} strong={hired}>
          {hired ? 'The banquet hall, hired' : 'The banquet hall, idle'}
        </Label>
      </At>
    </>
  )
}

/** The same rush on the cloud side: the private racks run hot, and only then does work burst to the public cloud's racks, which go idle again after. */
function BurstRacksScene() {
  const t = useLoop(10000, { mode: 'sawtooth', still: 0.5 })
  const rush = pulse(t, 0.1, 0.42, 0.62, 0.9)
  const over = rush > 0.6
  const fade: CSSProperties = { opacity: over ? 1 : 0.5, transition: `opacity 420ms ${EASE}` }
  return (
    <>
      <Zone x={24} y={52} w={190} h={172} />
      <Put x={82} b={204}>
        <ClayRack w={72} units={['run', 'run', rush > 0.5 ? 'hot' : 'idle']} />
      </Put>
      <Put x={158} b={204}>
        <ClayRack w={72} units={['run', rush > 0.3 ? 'run' : 'idle', rush > 0.5 ? 'hot' : 'idle']} />
      </Put>
      <Zone x={250} y={52} w={196} h={172} kind={over ? 'lit' : 'plain'} />
      <Put x={348} b={130} style={fade}>
        <RichCloud w={96} />
      </Put>
      {[312, 384].map((x, i) => (
        <Put key={x} x={x} b={204} style={fade}>
          <ClayRack w={58} units={over ? (i === 0 ? ['run', 'run', 'run'] : ['run', 'run', 'idle']) : ['idle', 'idle', 'idle']} />
        </Put>
      ))}
      <div className="absolute inset-0" style={{ opacity: over ? 1 : 0, transition: `opacity 300ms ${EASE}` }}>
        <Arrow x1={202} y1={170} x2={276} y2={170} dashed width={2.2} />
      </div>
      <Pkt a={[202, 170]} b={[262, 170]} t={(t * 4) % 1} on={over} />
      <At x={119} y={236} cx>
        <Label size={14} tone="muted">
          Private racks
        </Label>
      </At>
      <At x={348} y={236} cx>
        <Label size={14} tone={over ? 'brand' : 'muted'} strong={over}>
          {over ? 'Public cloud, bursting' : 'Public cloud, idle'}
        </Label>
      </At>
    </>
  )
}

export function HybridAnalogy({ lesson }: { lesson: string }) {
  return <IsoAnalogy id="hybrid-analogy" kicker="Hybrid Cloud" lesson={lesson} everyday={{ label: 'A banquet hall for the rush', scene: <KitchenScene /> }} cloud={{ label: 'Cloud bursting', scene: <BurstRacksScene /> }} claim="Extra capacity only while the rush lasts" />
}

/* ================================================================== 15 · community cloud */

/** The TR's diagram: one shared data centre inside the community's ring, three members' buildings feeding it, the general public outside the ring and turned back at its edge. */
function CommunityScene() {
  const t = useLoop(LAP, { mode: 'sawtooth', still: 0.3 })
  const members = [
    /* review 2026-10-26 (connections): each arrow starts under its member's name (y 160, the chip's foot at
       157) and ends on the shared data centre's roof (drawing top at y 207); they floated 10px short at both ends */
    { name: 'Government', x: 90, tone: colors.brand, end: [172, 210] as [number, number] },
    { name: 'Healthcare', x: 202, tone: colors.teal, end: [202, 208] as [number, number] },
    { name: 'Research', x: 314, tone: ISO.green, end: [232, 210] as [number, number] },
  ]
  // the public's packet goes toward the ring and bounces back
  const pub = beatOf(t, 2) === 0 ? within(t, 0.05, 0.4) : 1 - within(t, 0.55, 0.9)
  return (
    <>
      <Zone x={24} y={24} w={356} h={328} kind="own" />
      <At x={40} y={38}>
        <Label tone="brand" size={14} strong mono>
          COMMUNITY CLOUD
        </Label>
      </At>
      {members.map((m) => (
        <Arrow key={m.name} x1={m.x} y1={160} x2={m.end[0]} y2={m.end[1]} tone={m.tone} width={2} />
      ))}
      {members.map((m, i) => (
        <Pkt key={m.name} a={[m.x, 160]} b={[m.end[0] + (m.x - m.end[0]) * 0.18, m.end[1] - 6]} t={(t + i * 0.33) % 1} tone={m.tone} size={11} />
      ))}
      {members.map((m) => (
        <At key={m.name} x={m.x} y={74} cx>
          <div className="flex flex-col items-center gap-1.5">
            <TenantTile w={52} tone={m.tone} />
            <Label size={15} strong>
              {m.name}
            </Label>
          </div>
        </At>
      ))}
      <Put x={202} b={302}>
        <ClayDataCentre w={130} />
      </Put>
      <At x={202} y={312} cx>
        <Label tone="brand" size={15} strong>
          Shared infrastructure
        </Label>
      </At>

      {/* outside the ring: the public, turned back at its edge */}
      <At x={380} y={232} cx cy>
        <ClayNo w={36} />
      </At>
      <Pkt a={[446, 232]} b={[404, 232]} t={pub} tone={colors.muted} size={11} />
      {[
        { name: 'man-pro', w: 42, x: 470 },
        { name: 'woman-pro', w: 40, x: 518 },
        { name: 'student-bag', w: 52, x: 568 },
      ].map((p) => (
        <Put key={p.name} x={p.x} b={262}>
          <Icon3D name={p.name} w={p.w} dim />
        </Put>
      ))}
      <At x={505} y={276} cx>
        <Label size={14} tone="muted">
          General public: not admitted
        </Label>
      </At>
    </>
  )
}

export function CommunityCloud({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="community"
      kicker="Community Cloud"
      title="Shared Among Peers"
      lead="Community cloud is infrastructure shared by several organisations with common regulatory, security or mission needs, rather than opened to the general public"
      lesson={lesson}
      points={['Governance and compliance rules set jointly by member organisations', 'Cost split among fewer tenants than public, more than solo private', 'Example: AWS GovCloud (US), reserved for government agencies and partners', 'Typical users: government bodies, healthcare consortiums, research collaborations']}
      figure={<CommunityScene />}
      pointSize={17}
    />
  )
}

/* ================================================================== 16 · compared */

export function DeployCompared({ lesson }: { lesson: string }) {
  return (
    <TableCard
      id="deploy-compared"
      kicker="Deployment Models Compared"
      title="Ownership Tenancy Use Case"
      lead="Choosing a deployment model trades control for convenience: full ownership costs more effort, full sharing costs less control"
      lesson={lesson}
      columns={[
        { label: 'Model', weight: 0.9 },
        { label: 'Owned by', weight: 1.3 },
        { label: 'Tenancy', weight: 0.9 },
        { label: 'Typical use', weight: 1.5 },
      ]}
      rows={[
        ['Public', <Dot k={0}>Provider</Dot>, 'Multi-tenant', 'Variable, public-facing workloads'],
        ['Private (on-premise)', <Dot k={1}>Organisation</Dot>, 'Single-tenant', 'Strict compliance, latency-sensitive systems'],
        ['Private (hosted)', <Dot k={0.8}>Provider, dedicated to one customer</Dot>, 'Single-tenant', 'Dedicated capacity without own data centre'],
        ['Hybrid', <Dot k={0.55}>Shared: organisation and provider</Dot>, 'Mixed', 'Steady load with occasional bursts'],
        ['Community', <Dot k={0.3}>Member organisations, or a third party</Dot>, 'Shared within group', 'Sector-specific compliance, for example government'],
      ]}
      compact
    />
  )
}
