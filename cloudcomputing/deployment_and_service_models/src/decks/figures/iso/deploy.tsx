import { useId, type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { Arrow, At, Label, Traveller, useCycle, useLoop } from '../scene'
import { ClayDataCentre, ClayHouse, ClayPadlock, ClayRack, ClayTaxi, ClayTicket, ClayTools, Icon3D, LAB, RichCloud, TenantTile } from '../d3/kit'
import { TILE_SKIN } from '../card'
import { ISO, pulse, within } from './iso'
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
 * THE TR'S CLOUD (2026-10-27, the TR comparison): the soft pale-blue cloud the
 * TR's own diagrams set their servers in, `w` by `h` px, drawn as one shape
 * (overlapping lobes in one fill) on a cool shadow. A backdrop: objects sit on it.
 */
function CloudBack({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg aria-hidden className="pointer-events-none absolute" width={w} height={h} viewBox="0 0 400 220" preserveAspectRatio="none" style={{ left: x, top: y, overflow: 'visible', filter: 'drop-shadow(0 14px 18px rgba(31,64,140,0.16))' }}>
      <defs>
        <linearGradient id={`${id}-c`} x1="0" y1="0" x2="0" y2="220" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#E3EEFF" />
          <stop offset="1" stopColor="#BCD5FB" />
        </linearGradient>
      </defs>
      <g fill={`url(#${id}-c)`}>
        <rect x={12} y={108} width={376} height={108} rx={54} />
        <circle cx={112} cy={118} r={70} />
        <circle cx={214} cy={92} r={88} />
        <circle cx={306} cy={128} r={64} />
      </g>
    </svg>
  )
}

/** A connector in the TR's elbow style: straight segments through `pts`, the last one ending in a head. */
function Elbow({ pts, tone = colors.ink, width = 2, dashed = false }: { pts: [number, number][]; tone?: string; width?: number; dashed?: boolean }) {
  const a = pts[pts.length - 2]
  const b = pts[pts.length - 1]
  return (
    <>
      {pts.length > 2 && (
        <svg aria-hidden className="pointer-events-none absolute inset-0" style={{ overflow: 'visible' }} width="100%" height="100%">
          <polyline points={pts.slice(0, -1).map((p) => p.join(',')).join(' ')} fill="none" stroke={tone} strokeWidth={width} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={dashed ? '6 5' : undefined} />
        </svg>
      )}
      <Arrow x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} tone={tone} width={width} dashed={dashed} />
    </>
  )
}

/** A packet along a polyline at phase `t` (0..1), by transform only, fading at both ends. */
function PathPkt({ pts, t, tone = colors.brand, size = 11, on = true }: { pts: [number, number][]; t: number; tone?: string; size?: number; on?: boolean }) {
  const segs = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]))
  const total = segs.reduce((x, y) => x + y, 0)
  let d = t * total
  let i = 0
  while (i < segs.length - 1 && d > segs[i]) d -= segs[i++]
  const k = segs[i] ? Math.min(1, d / segs[i]) : 0
  const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k
  const y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k
  const fade = Math.max(0, Math.min(1, t * 8, (1 - t) * 8))
  return <span aria-hidden className="pointer-events-none absolute left-0 top-0 rounded-full" style={{ width: size, height: size, background: tone, boxShadow: `0 0 0 4px ${tone}40`, transform: `translate(${x - size / 2}px, ${y - size / 2}px)`, opacity: on ? fade : 0 }} />
}

/** The provider's server stack (the library render), lit or dimmed. */
function Stack3D({ w, dim = false }: { w: number; dim?: boolean }) {
  return <Icon3D name="server-stack" w={w} dim={dim} />
}

/** An enterprise's own server: a tall dark tower (the TR's tower icon). */
function Tower({ w }: { w: number }) {
  return <ClayRack w={w} units={['run', 'run', 'run', 'run']} />
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
const MAP_BASE = 158
/* the top of each site's tallest object, where its link from the node stops */
const MAP_TOP = [59, 66, 98, 79]

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
    <FigureOnly id="deploy-map" kicker="Deployment Models Map" title="Four Ways To Deploy" lead={['A cloud deployment model defines who owns the infrastructure, where it is hosted, and who has access to it.', 'Different organisations choose different deployment models based on their control, security, scalability, and sharing requirements.', 'Let’s explore the four major deployment models.']} lesson={lesson} h={286}>
      <At x={555} y={12} cx>
        <Label tone="solid" size={16} strong>
          Infrastructure Choice
        </Label>
      </At>
      {MAP_X.map((x, i) => (
        <Arrow key={i} x1={555} y1={40} x2={x} y2={i === 2 ? 120 : MAP_TOP[i] - 3} tone={lit === i ? colors.brand : colors.line} width={2} />
      ))}
      {/* public: the provider's one data centre */}
      <Put x={MAP_X[0]} b={MAP_BASE} style={op(0)}>
        <ClayDataCentre w={136} />
      </Put>
      {/* community: one shared cloud over three members */}
      <Put x={MAP_X[1]} b={MAP_BASE} style={op(1)}>
        <div className="flex flex-col items-center gap-1.5">
          <RichCloud w={80} />
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
        <Arrow x1={MAP_X[2] - 37} y1={128} x2={MAP_X[2] + 3} y2={128} both tone={colors.brand} width={2} />
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
      <div aria-hidden className="pointer-events-none absolute rounded-full" style={{ left: 200, top: 182, width: 710, height: 4, background: colors.line }} />
      {MAP_X.map((x, i) => (
        <span key={x} aria-hidden className="pointer-events-none absolute rounded-full" style={{ left: x - 5, top: 179, width: 10, height: 10, background: lit === i ? colors.brand : '#B9CBEF', transition: `background 420ms ${EASE}` }} />
      ))}
      <span aria-hidden className="pointer-events-none absolute left-0 top-0 rounded-full" style={{ width: 18, height: 18, background: colors.brand, boxShadow: `0 0 0 5px ${colors.brand}33, 0 4px 10px -2px ${colors.brand}`, transform: `translate(${MAP_X[0] - 9 + pos * 220}px, 175px)` }} />
      <At x={188} y={184} cy style={{ transform: 'translate(-100%, -50%)' }}>
        <Label tone="brand" size={14} strong mono>
          FULLY SHARED
        </Label>
      </At>
      <At x={922} y={184} cy>
        <Label tone="brand" size={14} strong mono>
          FULLY DEDICATED
        </Label>
      </At>
      {sites.map((s, i) => (
        <At key={s.title} x={MAP_X[i]} y={200} cx w={200}>
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
      lead="A public cloud is a cloud environment where a cloud provider owns and manages the infrastructure, and multiple customers use its resources over the internet"
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
  return <IsoAnalogy id="public-analogy" kicker="Public Cloud" lesson={lesson} text="A shared cab is owned by the cab company; many riders book seats and pay only for the ride taken, never owning the vehicle, just as public cloud tenants share provider-owned servers and pay only for the capacity used." everyday={{ label: 'A shared cab', scene: <CabScene /> }} cloud={{ label: 'Public cloud', scene: <TenantRackScene /> }} />
}

/* ================================================================== 9 · private cloud, on-premise against hosted */

/**
 * The TR's own diagram (2026-10-27 redraw, TR slide 3's image). Left, on-premise:
 * Enterprise P's own server stands in the cloud beside the provider's servers,
 * and the arrow names the Cloud Service Provider. Right, externally hosted: the
 * provider's cloud holds several server stacks; one is lit, and its two links
 * run out to Enterprise P's server and to `Dedicated for Enterprise P`.
 */
function PrivateScene() {
  const t = useLoop(LAP, { mode: 'sawtooth', still: 0.45 })
  const TO_P: [number, number][] = [[852, 214], [1010, 214], [1010, 178]]
  const TO_LABEL: [number, number][] = [[852, 238], [960, 238], [960, 318]]
  return (
    <>
      <At x={24} y={24}>
        <Label size={16} strong>
          On-Premise Private Cloud
        </Label>
      </At>
      <At x={600} y={24}>
        <Label size={16} strong>
          Externally Hosted Private Cloud
        </Label>
      </At>

      {/* on-premise: P's own server inside the cloud, the provider's servers beside it */}
      <CloudBack x={60} y={108} w={430} h={200} />
      <At x={130} y={106} cx>
        <Label tone="brand" size={15} strong>
          Enterprise P
        </Label>
      </At>
      <Put x={130} b={236}>
        <Tower w={68} />
      </Put>
      <Put x={330} b={266}>
        <Stack3D w={104} />
      </Put>
      <Arrow x1={330} y1={272} x2={330} y2={318} tone={colors.ink} width={2} />
      <At x={330} y={322} cx>
        <Label size={15} strong>
          Cloud Service Provider
        </Label>
      </At>

      {/* hosted: the provider's cloud, one dedicated stack lit, linked out to P */}
      <CloudBack x={590} y={130} w={330} h={172} />
      <Put x={668} b={262}>
        <Stack3D w={72} dim />
      </Put>
      <Zone x={748} y={164} w={106} h={112} kind="lit" />
      <Put x={801} b={266}>
        <Stack3D w={92} />
      </Put>
      <At x={720} y={322} cx>
        <Label size={15} strong>
          Cloud Service Provider
        </Label>
      </At>
      <At x={1010} y={56} cx>
        <Label tone="brand" size={15} strong>
          Enterprise P
        </Label>
      </At>
      <Put x={1010} b={172}>
        <Tower w={60} />
      </Put>
      <Elbow pts={TO_P} />
      <Elbow pts={TO_LABEL} />
      <PathPkt pts={TO_P} t={t} />
      <At x={960} y={322} cx>
        <Label tone="brand" size={15} strong>
          Dedicated for Enterprise P
        </Label>
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

/**
 * The TR's analogy, clause by clause (2026-10-27): left, a house goes up on the
 * owner's own land, the tools out while it is built (construction effort, full
 * control); right, a private bungalow a developer already built, rented, and
 * locked to its one tenant the same moment (the same exclusivity, no effort).
 */
function Chip({ x, y, children, tone = 'plain' }: { x: number; y: number; children: ReactNode; tone?: 'plain' | 'brand' | 'muted' }) {
  return (
    <At x={x} y={y} cx>
      <Label size={14} tone={tone} strong>
        {children}
      </Label>
    </At>
  )
}

function HousesScene() {
  const t = useLoop(LAP, { mode: 'sawtooth', still: 0.75 })
  const built = within(t, 0.05, 0.5)
  const locked = within(t, 0.55, 0.7) > 0.5
  const BASE = 200
  return (
    <>
      <Zone x={24} y={24} w={202} h={204} kind="own" />
      <Chip x={125} y={36} tone="brand">
        Full control
      </Chip>
      <Put x={100} b={BASE}>
        <div style={{ transformOrigin: '50% 100%', transform: `translateY(${(1 - built) * 22}px) scale(${0.9 + 0.1 * built})`, opacity: 0.2 + 0.8 * built }}>
          <ClayHouse w={104} />
        </div>
      </Put>
      <Put x={186} b={BASE} style={{ opacity: built < 1 ? 1 : 0, transition: `opacity 420ms ${EASE}` }}>
        <ClayTools w={34} />
      </Put>
      <Put x={186} b={BASE} style={{ opacity: built < 1 ? 0 : 1, transition: `opacity 420ms ${EASE}` }}>
        <ClayPadlock w={30} open={!locked} />
      </Put>
      <Zone x={244} y={24} w={202} h={204} kind="provider" />
      <Chip x={345} y={36} tone="brand">
        Same exclusivity
      </Chip>
      <Put x={320} b={BASE}>
        <ClayHouse w={104} />
      </Put>
      <Put x={406} b={BASE}>
        <ClayPadlock w={30} open={!locked} />
      </Put>
      <At x={125} y={240} cx>
        <Label size={14} tone="muted">
          House on owned land
        </Label>
      </At>
      <At x={345} y={240} cx>
        <Label size={14} tone="muted">
          Private bungalow, rented
        </Label>
      </At>
    </>
  )
}

/** Left: owned infrastructure, P's building and its own rack; right: a rack dedicated to P inside the provider's hall, provider-managed, beside another's idle one; both locked the same moment. */
function RacksScene() {
  const t = useLoop(LAP, { mode: 'sawtooth', still: 0.75 })
  const locked = within(t, 0.55, 0.7) > 0.5
  const on = within(t, 0.05, 0.45) > 0.5
  const BASE = 200
  return (
    <>
      <Zone x={24} y={24} w={202} h={204} kind="own" />
      <Chip x={125} y={36} tone="brand">
        Owned
      </Chip>
      <Put x={70} b={BASE}>
        <TenantTile w={54} tone={colors.brand} />
      </Put>
      <Put x={142} b={BASE + 3}>
        <ClayRack w={66} units={on ? ['run', 'run', 'run'] : ['idle', 'idle', 'idle']} />
      </Put>
      <Put x={202} b={BASE}>
        <ClayPadlock w={28} open={!locked} />
      </Put>
      <Zone x={244} y={24} w={202} h={204} kind="provider" />
      <Chip x={345} y={36} tone="brand">
        Provider-managed
      </Chip>
      <Put x={290} b={BASE + 3} style={{ opacity: 0.45 }}>
        <ClayRack w={60} units={['idle', 'idle', 'idle']} />
      </Put>
      <Put x={360} b={BASE + 3}>
        <ClayRack w={66} units={on ? ['run', 'run', 'run'] : ['idle', 'idle', 'idle']} />
      </Put>
      <Put x={422} b={BASE}>
        <ClayPadlock w={28} open={!locked} />
      </Put>
      <At x={125} y={240} cx>
        <Label size={14} tone="brand" strong>
          On-premise
        </Label>
      </At>
      <At x={345} y={240} cx>
        <Label size={14} tone="brand" strong>
          Hosted, dedicated
        </Label>
      </At>
    </>
  )
}

export function PrivateAnalogy({ lesson }: { lesson: string }) {
  return (
    <IsoAnalogy
      id="private-analogy"
      kicker="Private Cloud"
      lesson={lesson}
      text="Building a house on owned land gives full control forever; renting a private bungalow built by a developer gives the same exclusivity without construction effort, just as on-premise private cloud means owned infrastructure, while hosted private cloud means dedicated but provider-managed infrastructure."
      everyday={{ label: 'House on owned land or rented bungalow', scene: <HousesScene /> }}
      cloud={{ label: 'On-premise or hosted private cloud', scene: <RacksScene /> }}
    />
  )
}

/* ================================================================== 12 · hybrid cloud */

/**
 * The TR's own diagram (2026-10-27 redraw, TR slide 4's image): the private
 * cloud (Enterprise P's server in the cloud beside the provider's servers)
 * PLUS the public cloud (the provider's servers in a cloud, serving
 * Enterprise P, Enterprise Q and a user); capacity flows out to each in turn.
 */
function HybridScene() {
  const k = useCycle(3, 2400, 0)
  const t = useLoop(2400, { mode: 'sawtooth', still: 0.5 })
  const OUT: [number, number][][] = [
    [[702, 196], [640, 196], [640, 176]],
    [[968, 196], [1020, 196], [1020, 176]],
    [[780, 262], [780, 296], [690, 296], [690, 310]],
  ]
  return (
    <>
      <At x={24} y={24}>
        <Label size={16} strong>
          Private cloud
        </Label>
      </At>
      <At x={760} y={24} cx>
        <Label size={16} strong>
          Public cloud
        </Label>
      </At>

      {/* private: P's own server inside the cloud, the provider's servers beside it */}
      <CloudBack x={44} y={112} w={380} h={190} />
      <At x={110} y={106} cx>
        <Label tone="brand" size={15} strong>
          Enterprise P
        </Label>
      </At>
      <Put x={110} b={236}>
        <Tower w={68} />
      </Put>
      <Put x={290} b={262}>
        <Stack3D w={100} />
      </Put>
      <Arrow x1={290} y1={268} x2={290} y2={318} tone={colors.ink} width={2} />
      <At x={290} y={322} cx>
        <Label size={15} strong>
          Cloud Service Provider
        </Label>
      </At>

      <At x={484} y={190} cx cy>
        <span className="font-heading text-[56px] font-bold leading-none" style={{ color: colors.ink }}>
          +
        </span>
      </At>

      {/* public: the provider's cloud serving P, Q and a user */}
      <CloudBack x={680} y={116} w={300} h={150} />
      <Put x={840} b={244}>
        <Stack3D w={100} />
      </Put>
      <At x={910} y={282} cx>
        <Label size={15} strong>
          Cloud Service Provider
        </Label>
      </At>
      <At x={640} y={50} cx>
        <Label tone="brand" size={15} strong>
          Enterprise P
        </Label>
      </At>
      <Put x={640} b={168}>
        <Tower w={56} />
      </Put>
      <At x={1020} y={50} cx>
        <Label size={15} strong>
          Enterprise Q
        </Label>
      </At>
      <Put x={1020} b={168}>
        <Tower w={56} />
      </Put>
      <At x={672} y={314}>
        <div className="flex items-center gap-2">
          <Icon3D name="boy-laptop" w={28} shadow={false} />
          <Label size={15} strong>
            User
          </Label>
        </div>
      </At>
      {OUT.map((pts, i) => (
        <Elbow key={i} pts={pts} tone={i === k ? colors.brand : colors.ink} />
      ))}
      <PathPkt pts={OUT[k]} t={t} tone={TENANTS[k]} />
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
      <Chip x={119} y={24} tone={rush > 0.5 ? 'brand' : 'plain'}>
        {rush > 0.5 ? 'Wedding rush' : 'Daily orders'}
      </Chip>
      <At x={119} y={236} cx>
        <Label size={14} tone="muted">
          Restaurant kitchen
        </Label>
      </At>
      <At x={348} y={236} cx>
        <Label size={14} tone={hired ? 'brand' : 'muted'} strong={hired}>
          {hired ? 'Banquet hall, hired' : 'Banquet hall, released'}
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
      <Chip x={119} y={24} tone={rush > 0.5 ? 'brand' : 'plain'}>
        {rush > 0.5 ? 'Demand spike' : 'Daily load'}
      </Chip>
      <At x={119} y={236} cx>
        <Label size={14} tone="muted">
          Private racks
        </Label>
      </At>
      <At x={348} y={236} cx>
        <Label size={14} tone={over ? 'brand' : 'muted'} strong={over}>
          {over ? 'Public cloud, bursting' : 'Public cloud, released'}
        </Label>
      </At>
    </>
  )
}

export function HybridAnalogy({ lesson }: { lesson: string }) {
  return (
    <IsoAnalogy
      id="hybrid-analogy"
      kicker="Hybrid Cloud"
      lesson={lesson}
      text="A restaurant kitchen handles daily orders alone, but during a wedding rush it hires a banquet hall's ovens for the overflow and releases them once the rush ends, just as cloud bursting shifts excess load to public cloud only during demand spikes."
      everyday={{ label: "A banquet hall's ovens for the overflow", scene: <KitchenScene /> }}
      cloud={{ label: 'Cloud bursting', scene: <BurstRacksScene /> }}
    />
  )
}

/* ================================================================== 15 · community cloud */

/**
 * The TR's own diagram (2026-10-27 redraw, TR slide 5's image): the provider's
 * cloud holds the server stacks; one is lit, `Dedicated for Community User`
 * above it, and its links fan out to the community users, Enterprise P, Q
 * and R, one after another.
 */
const MEMBERS = ['Enterprise P', 'Enterprise Q', 'Enterprise R']
const MEMBER_Y = [104, 204, 304] /* each member tower's middle */

function CommunityScene() {
  const k = useCycle(3, 2400, 1)
  const t = useLoop(2400, { mode: 'sawtooth', still: 0.6 })
  const links: [number, number][][] = MEMBER_Y.map((y, i) => [[262, 232 + (i - 1) * 10], [372, 232 + (i - 1) * 10], [372, y], [440, y]])
  return (
    <>
      <At x={146} y={30} cx>
        <Label tone="brand" size={15} strong>
          Dedicated for Community User
        </Label>
      </At>
      <At x={490} y={30} cx>
        <Label size={16} strong>
          Community Users
        </Label>
      </At>
      <CloudBack x={24} y={150} w={290} h={156} />
      <Put x={96} b={282}>
        <Stack3D w={74} dim />
      </Put>
      <Zone x={160} y={180} w={106} h={108} kind="lit" />
      <Put x={213} b={278}>
        <Stack3D w={88} />
      </Put>
      <Arrow x1={213} y1={182} x2={213} y2={62} tone={colors.ink} width={2} />
      <At x={170} y={318} cx>
        <Label size={15} strong>
          Cloud Service Provider
        </Label>
      </At>
      {links.map((pts, i) => (
        <Elbow key={i} pts={pts} tone={i === k ? TENANTS[i] : colors.ink} />
      ))}
      <PathPkt pts={links[k]} t={t} tone={TENANTS[k]} />
      {MEMBERS.map((name, i) => (
        <At key={name} x={448} y={MEMBER_Y[i]} cy>
          <div className="flex items-center gap-3">
            <Tower w={46} />
            <Label size={15} strong tone={i === k ? 'brand' : 'plain'}>
              {name}
            </Label>
          </div>
        </At>
      ))}
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
