import type { CSSProperties, ReactNode } from 'react'
import {
  ArrowLeftRight, Building2, Cable, Check, Cloud, Cog, Globe, LayoutDashboard, LayoutGrid, Lock as LockIco, MousePointer2, Network, Plus, Route, Router as RouterIco,
  Server, ServerOff, ShieldCheck, SlidersHorizontal, Split, SquareDashed, Table2, Target, Unplug, UserRound, Users, Warehouse, Waypoints, Hash,
} from 'lucide-react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Arrow, At, Label, STILL, Traveller } from '../scene'
import { TILE_SKIN } from '../card'
import { Icon3D, RichCloud } from '../d3/kit'
import { Badge, fx, LitFigure, Ripple } from './fx'
import { BG, BigVpc, Boundary, Gateway, LockBadge, Logo, NET, NoMark, Resource, SubnetBox, ZigZag } from './frames'
import { OV_MOTION_CSS, run, shown, useWalk } from './overview-motion'
import vpcIcon from './icons/overview-aws-vpc.svg'

export { SchoolAnalogy } from './overview-school'

/**
 * SECTION 1 · CLOUD NETWORKING OVERVIEW (T01-1 to T02-3), visual pass 2026-11-04
 * (Session 4's design: `LitFigure` with a subject icon on every point, the point the
 * figure is acting out lit; every figure built state by state, one press per state
 * with auto animation off; ambient motion that says what each object does).
 *
 *   T01-1   the TR's "Cloud Networking" diagram, built as the description reads
 *           (useWalk): the user host, its router and the network cloud, the
 *           provider's router and cloud, the servers; then the four points walk:
 *           the boundary ring and a packet down the whole link; one server with
 *           no route goes dark behind a stop; traffic in and out; the four
 *           controls (isolation, addressing, routing, security) pop on the ring
 *   T01-AN  `overview-school.tsx`
 *   T02-1   the VPC console (a real console window, the cursor clicks create),
 *           the API call into the control plane, pushed onto shared racks with a
 *           customer on each; the cabling job crossed out
 *   T02-2   the one VPC drawing (`BigVpc`) built one block per point: the
 *           container, the subnets, the gateways and route tables (traffic on
 *           their lines), the locks
 *   T02-3   the control plane deciding (the four blocks as configuration tiles
 *           with switches), pushed down to the data plane where packets are
 *           actually forwarded rack to rack; the physical cable crossed out
 */

const EASE = 'cubic-bezier(0.22,1,0.36,1)'
const FIG_H = 380

/* ------------------------------------------------------------------ shared drawings */

/** A word of a diagram, as a chip with its subject icon. */
function Word({ children, on = true, tone = 'plain', delay = 0, icon, size = 14 }: { children: ReactNode; on?: boolean; tone?: 'plain' | 'brand' | 'solid' | 'dark'; delay?: number; icon?: ReactNode; size?: number }) {
  return (
    <div style={shown(on, delay, 6)}>
      <Label size={size} strong tone={tone} raised icon={icon}>
        {children}
      </Label>
    </div>
  )
}

/** A plain line on the stage, no head; it draws on from its first end. */
function Line({ x1, y1, x2, y2, tone = NET.boundary, width = 2.5, on = true, delay = 0 }: { x1: number; y1: number; x2: number; y2: number; tone?: string; width?: number; on?: boolean; delay?: number }) {
  const instant = useInstant()
  const minX = Math.floor(Math.min(x1, x2) - width)
  const minY = Math.floor(Math.min(y1, y2) - width)
  const maxX = Math.ceil(Math.max(x1, x2) + width)
  const maxY = Math.ceil(Math.max(y1, y2) + width)
  return (
    <svg aria-hidden className="pointer-events-none absolute" style={{ left: minX, top: minY, overflow: 'visible' }} width={maxX - minX} height={maxY - minY}>
      <path
        d={`M ${x1 - minX} ${y1 - minY} L ${x2 - minX} ${y2 - minY}`}
        stroke={tone}
        strokeWidth={width}
        strokeLinecap="round"
        fill="none"
        pathLength={1}
        strokeDasharray="1"
        style={{ strokeDashoffset: on ? 0 : 1, opacity: on ? 1 : 0, transition: instant ? 'none' : on ? `stroke-dashoffset 520ms ${EASE} ${delay}ms, opacity 160ms ${delay}ms, stroke 420ms` : `stroke-dashoffset 360ms ${EASE}, opacity 200ms 300ms, stroke 420ms` }}
      />
    </svg>
  )
}

/** A status light on a machine: it blinks while the machine works. */
const Led = ({ x, y, tone = colors.success, delay = 0 }: { x: number; y: number; tone?: string; delay?: number }) => (
  <span aria-hidden className={`absolute rounded-full ${run(true, 'ov-led') ?? ''}`} style={{ left: x - 3, top: y - 3, width: 6, height: 6, background: tone, boxShadow: '0 0 0 1.5px #fff', animationDelay: `${delay}s` }} />
)

/** An icon on a white disc, ringed in a tone (a badge on a drawing, no words). */
function IconDisc({ children, tone = colors.brand, size = 30, style, className }: { children: ReactNode; tone?: string; size?: number; style?: CSSProperties; className?: string }) {
  return (
    <span aria-hidden className={`grid place-items-center rounded-full ${className ?? ''}`} style={{ width: size, height: size, background: '#fff', color: tone, boxShadow: `inset 0 0 0 2px ${tone}, 0 6px 14px -8px rgba(16,32,58,0.55)`, ...style }}>
      {children}
    </span>
  )
}

/* ===== T01-1 · The deployment boundary */

/* the first point cut at the TR's own colon (round 2, BRIEF2 rule 1: every word kept, in order, none added) */
const T011_POINTS = [
  'This connectivity layer, called cloud networking, is the deployment boundary',
  'The line deciding whether a launched resource is reachable at all',
  'An instance with no route, gateway or security rule is deployed but entirely unreachable',
  'The deployment boundary decides what traffic reaches a resource and what traffic it can send out',
  'Isolation, addressing, routing and security rules in a cloud network all exist to control this one boundary',
]
const T011_ICONS = [<Waypoints key="a" />, <Target key="t" />, <ServerOff key="b" />, <ArrowLeftRight key="c" />, <ShieldCheck key="d" />]

/*
  THE TR'S DIAGRAM (slide 1's image, "Cloud Networking"), element for element
  on the 634 x 380 stage: the Cloud User Host (three monitors on a line and two
  under it, "Enterprise"), the line to a router, a zigzag link to the Network
  Cloud, a zigzag on to the provider's router, the Cloud Service Provider's
  cloud with the servers in it, "Cloud Vendor's Infrastructure" under them.
*/
const D = {
  title: { cx: 317, cy: 22 },
  host: { cx: 122, cy: 52 },
  mon: { w: 44, h: 44, row1: { y: 76, xs: [46, 100, 154] }, row2: { y: 150, xs: [73, 127] } },
  bus: { y: 136, x1: 60, x2: 236 },
  enterprise: { cx: 106, cy: 218 },
  router1: { cx: 240, cy: 180, w: 50 },
  net: { x: 292, y: 112, w: 124 },
  router2: { cx: 472, cy: 100, w: 50 },
  provider: { x: 404, y: 166, w: 226 },
  srv: { w: 30, h: 40, row1: { y: 216, xs: [504, 545, 586] }, row2: { y: 264, xs: [524, 565] } },
} as const
const NET_CLOUD_H = Math.round((D.net.w * 150) / 220)
const PROV_H = Math.round((D.provider.w * 150) / 220)
const PROV_CX = D.provider.x + D.provider.w / 2
const SERVERS: [number, number][] = [...D.srv.row1.xs.map((x) => [x, D.srv.row1.y] as [number, number]), ...D.srv.row2.xs.map((x) => [x, D.srv.row2.y] as [number, number])]
/* the ring the deployment boundary draws round the vendor's servers */
const RING = { x: 462, y: 172, w: 160, h: 140 }
/* the one server with no route: the last on the second row */
const DARK = 4
/* the link, end to end: the bus, the router, the network cloud, the provider's router, down into the servers */
const LINK: [number, number][] = [
  [D.bus.x2 - 60, D.bus.y],
  [D.bus.x2, D.bus.y],
  [D.router1.cx, D.router1.cy - 6],
  [D.net.x + D.net.w / 2, D.net.y + NET_CLOUD_H * 0.55],
  [D.router2.cx, D.router2.cy],
  [D.router2.cx + 18, RING.y + 12],
  [SERVERS[0][0] + D.srv.w / 2, SERVERS[0][1] + D.srv.h / 2],
]
const OUT_PATH: [number, number][] = [
  [SERVERS[1][0] + D.srv.w / 2, SERVERS[1][1] + 8],
  [D.router2.cx + 22, RING.y + 10],
  [D.router2.cx, D.router2.cy],
  [D.net.x + D.net.w / 2, D.net.y + NET_CLOUD_H * 0.45],
]
const STOP_PATH: [number, number][] = [
  [D.router2.cx, D.router2.cy],
  [RING.x + RING.w - 30, RING.y - 2],
]

/** The four controls the session teaches, one icon each, popping onto the boundary ring (point 4). */
const CONTROLS = [<SquareDashed key="i" size={15} />, <Hash key="a" size={15} />, <Route key="r" size={15} />, <LockIco key="s" size={15} />]

/** What the diagram shows: `k` the build (0-3), then each point's part of the picture. */
type NetView = { k: number; ring?: boolean; link?: boolean; reach?: boolean; dark?: boolean; stop?: boolean; inout?: boolean; controls?: boolean }

function CloudNetworkingScene({ v }: { v: NetView }) {
  const { k } = v
  const netCx = D.net.x + D.net.w / 2
  const lineTone = v.link ? colors.accent : NET.boundary
  return (
    <>
      <At x={D.title.cx} y={D.title.cy} cx cy>
        <Word size={15} tone="brand" icon={<Network />}>Cloud Networking</Word>
      </At>
      {/* 0 · the cloud user host: five monitors on one line, the enterprise */}
      <At x={D.host.cx} y={D.host.cy} cx cy>
        <Word size={15} icon={<Users />}>Cloud User Host</Word>
      </At>
      {D.mon.row1.xs.map((x, i) => (
        <At key={`a${x}`} x={x} y={D.mon.row1.y}>
          <div style={shown(true, i * 60)}>
            <Icon3D name="desktop" w={D.mon.w} h={D.mon.h} shadow={false} />
          </div>
        </At>
      ))}
      {D.mon.row1.xs.map((x) => (
        <Line key={`l${x}`} x1={x + D.mon.w / 2} y1={D.mon.row1.y + D.mon.h} x2={x + D.mon.w / 2} y2={D.bus.y} tone={lineTone} />
      ))}
      <Line x1={D.bus.x1} y1={D.bus.y} x2={D.bus.x2} y2={D.bus.y} width={3} tone={lineTone} />
      {D.mon.row2.xs.map((x) => (
        <Line key={`m${x}`} x1={x + D.mon.w / 2} y1={D.bus.y} x2={x + D.mon.w / 2} y2={D.mon.row2.y} tone={lineTone} />
      ))}
      {D.mon.row2.xs.map((x) => (
        <At key={`b${x}`} x={x} y={D.mon.row2.y}>
          <Icon3D name="desktop" w={D.mon.w} h={D.mon.h} shadow={false} />
        </At>
      ))}
      <At x={D.enterprise.cx} y={D.enterprise.cy} cx cy>
        <Word size={15} icon={<Building2 />}>Enterprise</Word>
      </At>
      {/* 1 · the router at the end of the line, the zigzag link to the network cloud */}
      <Line x1={D.bus.x2} y1={D.bus.y} x2={D.bus.x2} y2={D.router1.cy - 20} on={k >= 1} tone={lineTone} />
      <Ripple x={D.router1.cx} y={D.router1.cy - 8} r={26} tone={colors.brand} on={k >= 1} n={2} dur={2.4} />
      <At x={D.router1.cx} y={D.router1.cy} cx cy>
        <div style={shown(k >= 1, 120)}>
          <Icon3D name="router" w={D.router1.w} shadow={false} />
        </div>
      </At>
      <At x={D.router1.cx - 2} y={D.router1.cy + 36} cx cy>
        <Word size={15} on={k >= 1} delay={160} icon={<RouterIco />}>Router</Word>
      </At>
      <ZigZag x1={D.router1.cx + 26} y1={D.router1.cy - 4} x2={D.net.x + 8} y2={D.net.y + NET_CLOUD_H * 0.6} on={k >= 1} delay={260} tone={lineTone} />
      <At x={D.net.x} y={D.net.y}>
        <div style={shown(k >= 1, 520)}>
          <div {...fx('lift', 0, 3.2)}>
            <RichCloud w={D.net.w} />
          </div>
        </div>
      </At>
      <At x={netCx + 18} y={D.net.y + NET_CLOUD_H + 14} cx cy>
        <Word size={15} on={k >= 1} delay={620} icon={<Globe />}>
          Network Cloud
        </Word>
      </At>
      {/* 2 · the zigzag on to the provider's router, the provider's cloud */}
      <ZigZag x1={D.net.x + D.net.w - 22} y1={D.net.y + NET_CLOUD_H * 0.24} x2={D.router2.cx - 26} y2={D.router2.cy + 8} on={k >= 2} tone={lineTone} teeth={3} />
      <Ripple x={D.router2.cx} y={D.router2.cy - 8} r={26} tone={colors.brand} on={k >= 2} n={2} dur={2.4} />
      <At x={D.router2.cx} y={D.router2.cy} cx cy>
        <div style={shown(k >= 2, 240)}>
          <Icon3D name="router" w={D.router2.w} shadow={false} />
        </div>
      </At>
      <At x={D.router2.cx + 34} y={D.router2.cy} cy>
        <Word size={15} on={k >= 2} delay={280} icon={<RouterIco />}>
          Router
        </Word>
      </At>
      <At x={D.provider.x} y={D.provider.y}>
        <div style={shown(k >= 4, 0)}>
          <RichCloud w={D.provider.w} />
        </div>
      </At>
      <At x={PROV_CX + 6} y={D.provider.y - 12} cx cy>
        <Word size={15} on={k >= 3} delay={120} icon={<Cloud />}>
          Cloud Service Provider
        </Word>
      </At>
      {/* the deployment boundary, ringed round the vendor's servers from point 1 on */}
      <At x={RING.x} y={RING.y}>
        <div style={{ width: RING.w, height: RING.h, borderRadius: 18, border: `2.5px dashed ${colors.accent}`, background: 'rgba(255,138,61,0.06)', ...shown(!!v.ring, 0, 0) }} />
      </At>
      {/* 3 · the servers drop in one by one, their lights working */}
      <At x={RING.x + RING.w / 2 + 14} y={D.srv.row1.y - 20} cx cy>
        <Word size={15} on={k >= 3} delay={260} icon={<Server />}>Server</Word>
      </At>
      {SERVERS.map(([x, y], i) => {
        const dark = i === DARK && !!v.dark
        return (
          <At key={i} x={x} y={y}>
            <div style={{ ...shown(k >= 3, 300 + i * 90, -14), filter: dark ? 'grayscale(1)' : 'none' }}>
              <div style={{ opacity: dark ? 0.4 : 1, transition: `opacity 420ms ${EASE}` }}>
                <Icon3D name="server-stack" w={D.srv.w} h={D.srv.h} shadow={false} />
              </div>
            </div>
            {k >= 3 && !dark && <Led x={D.srv.w - 3} y={4} delay={i * 0.23} />}
          </At>
        )
      })}
      {/* 5 · the server with no route: deployed, but nothing reaches it */}
      <At x={SERVERS[DARK][0] + D.srv.w + 2} y={SERVERS[DARK][1] - 2} cx cy>
        <NoMark size={22} on={!!v.dark} />
      </At>
      <At x={PROV_CX - 30} y={D.provider.y + PROV_H + 16} cx cy>
        <Word size={15} on={k >= 3} delay={700} icon={<Warehouse />}>
          Cloud Vendor's Infrastructure
        </Word>
      </At>
      {/* 7 · isolation, addressing, routing, security: the four controls on the ring */}
      {CONTROLS.map((ic, i) => (
        <At key={i} x={RING.x + 21} y={RING.y + 24 + i * 31} cx cy>
          <Badge on={!!v.controls} size={28} ring={colors.accent} style={{ transitionDelay: v.controls ? `${i * 140}ms` : '0ms' }}>
            <span className="grid place-items-center" style={{ color: colors.accentDark }}>
              {ic}
            </span>
          </Badge>
        </At>
      ))}
      {/* the traffic each point is about */}
      <Traveller path={LINK} run={!!v.reach && !STILL} k="link" tone={colors.accent} size={13} dur={2.2} />
      {v.reach && !STILL && <Ripple x={SERVERS[0][0] + D.srv.w / 2} y={SERVERS[0][1] + D.srv.h / 2} r={24} tone={colors.accent} n={1} dur={2.2} />}
      <Traveller path={STOP_PATH} run={!!v.stop && !STILL} k="stop" tone={NET.blocked} size={12} dur={1.2} />
      <Traveller path={LINK} run={!!v.inout && !STILL} k="in" tone={colors.brand} size={13} dur={2.2} />
      <Traveller path={OUT_PATH} run={!!v.inout && !STILL} k="out" tone={colors.accent} size={13} dur={1.8} />
    </>
  )
}

/*
  THE SLIDE IS SPLIT IN TWO (round 2, the review: "split this slide into two slides"): the same diagram on
  both halves, at the same place and scale, the points column wide enough that every point is at most two
  lines. T01-1 builds the diagram and walks the first three points; T01-1b opens on the whole diagram and
  walks the last two.
*/
const S5_POINTS_W = 500
const S5_SCALE = (1110 - S5_POINTS_W - 24) / 634
const S5_FIG_H = Math.round(380 * S5_SCALE)

/** The 634 x 380 diagram, scaled into the narrower stage the wider points column leaves. */
function Scaled({ children, scale = S5_SCALE }: { children: ReactNode; scale?: number }) {
  return (
    <div className="absolute left-0 top-0" style={{ width: 634, height: 380, transform: `scale(${scale})`, transformOrigin: '0 0' }}>
      {children}
    </div>
  )
}

export function Boundary1({ lesson }: { lesson: string }) {
  /* 0 host, 1 router and network cloud, 2 provider's router, 3 provider's cloud and its servers;
     4 the boundary ring and the lit link (point 1), 5 a packet reaches a server through it (point 2),
     6 the server with no route goes dark behind a stop (point 3); 7 rest */
  const k = useWalk(8, 4, 1600)
  const v: NetView = { k: Math.min(k, 3), link: k === 4, ring: k >= 4, reach: k === 5, dark: k >= 6, stop: k === 6 }
  return (
    <LitFigure
      id="T01-1"
      kicker="Deployment Boundary"
      title="Why Networking Matters"
      lead="Every cloud resource needs connectivity rules deciding what it can reach and what can reach it"
      lesson={lesson}
      points={T011_POINTS.slice(0, 3).map((text, i) => ({ icon: T011_ICONS[i], text }))}
      lit={k >= 4 && k <= 6 ? k - 4 : -1}
      figure={<Scaled><CloudNetworkingScene v={v} /></Scaled>}
      figH={S5_FIG_H}
      pointsW={S5_POINTS_W}
      pointSize={17}
    />
  )
}

/** T01-1b, the second half: the whole diagram (boundary ring, the dark server), then traffic in and out (point 4), then the four controls (point 5). */
export function Boundary1b({ lesson }: { lesson: string }) {
  const k = useWalk(4, 1, 1900)
  const v: NetView = { k: 3, ring: true, dark: true, inout: k === 1, controls: k >= 2 }
  return (
    <LitFigure
      id="T01-1b"
      kicker="Deployment Boundary"
      title="Why Networking Matters"
      lesson={lesson}
      points={T011_POINTS.slice(3).map((text, i) => ({ icon: T011_ICONS[i + 3], text }))}
      lit={k === 1 || k === 2 ? k - 1 : -1}
      figure={<Scaled><CloudNetworkingScene v={v} /></Scaled>}
      figH={S5_FIG_H}
      pointsW={S5_POINTS_W}
      pointSize={17}
    />
  )
}

/* ===== T02-1 · Pieces, configured in software */

const T021_LEAD = 'The deployment boundary is built from a small set of pieces that together control where traffic starts, stops and crosses isolation lines'
const T021_POINTS = [
  'On AWS (Amazon Web Services), all of them are configured from the VPC (Virtual Private Cloud) console',
  /* the SDN point cut at the TR's own clause boundaries (round 2: "too large, split it into smaller points"); every word kept, in order */
  'All of it runs on software-defined networking (SDN)',
  'The model where a control plane makes routing and security decisions in software',
  'Then pushes them onto hardware shared across many customers',
  'So creating a VPC is an API call, not a cabling job',
]
const T021_ICONS = [<LayoutDashboard key="a" />, <Network key="b" />, <Route key="c" />, <Users key="d" />, <Unplug key="e" />]
const S7_POINTS_W = 540

/*
  THE CARD'S OWN EXPLANATION on the 634 x 380 stage: the VPC console on AWS
  (a console window: the service's pages down the side, the cursor clicking
  create), the API call down into the control plane (routing and security
  decisions in software, its gear turning), pushed onto the hardware shared
  across many customers (racks, a customer on each); and what it is not, a
  cabling job, crossed out beside the console.
*/
/* laid out for the 546px stage beside the wider points column */
const P = {
  console: { x: 20, y: 12, w: 300, h: 112 },
  cable: { cx: 436, cy: 66 },
  plane: { x: 16, y: 156, w: 514, h: 82 },
  hw: { x: 16, y: 280, w: 514, h: 86 },
  lane: 170,
} as const
const CUSTOMERS = [colors.brand, colors.accent, colors.teal, '#8B5CF6']

function ConsoleWindow({ click, w = P.console.w, h = P.console.h }: { click: boolean; w?: number; h?: number }) {
  const side = [<img key="v" src={vpcIcon} alt="" className="block h-[16px] w-[16px]" />, <Network key="n" size={14} />, <Table2 key="t" size={14} />, <LockIco key="l" size={14} />]
  return (
    <div className="relative overflow-hidden rounded-[14px]" style={{ width: w, height: h, ...TILE_SKIN }}>
      {/* the title bar: the window's dots, the AWS mark, the console's name */}
      <div className="flex items-center gap-2 px-3" style={{ height: 34, background: 'linear-gradient(180deg, #232F3E 0%, #1B2532 100%)' }}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
          <span key={c} aria-hidden className="block h-[8px] w-[8px] rounded-full" style={{ background: c }} />
        ))}
        <span className="ml-2 grid h-[22px] place-items-center rounded-[6px] bg-white px-1.5">
          <Logo name="aws" h={14} />
        </span>
        <span className="font-heading text-[15px] font-semibold text-white">VPC Console</span>
      </div>
      {/* the service's pages down the side, the page body with a create button */}
      <div className="absolute flex flex-col items-center gap-1 py-2" style={{ left: 0, top: 34, bottom: 0, width: 40, background: '#EEF3FB', color: colors.brandDark, boxShadow: 'inset -1px 0 0 #CFDCF5' }}>
        {side.map((s, i) => (
          <span key={i} className="grid h-[14px] place-items-center" style={{ opacity: i === 0 ? 1 : 0.7 }}>
            {s}
          </span>
        ))}
      </div>
      <div className="absolute" style={{ left: 54, top: 46, right: 14 }}>
        {[0.62, 0.86, 0.48].map((w, i) => (
          <span key={i} aria-hidden className="mb-2 block h-[7px] rounded-full" style={{ width: `${w * 100}%`, background: i === 0 ? '#C9D7F2' : '#E2E9F6' }} />
        ))}
      </div>
      <span aria-hidden className={`absolute grid place-items-center rounded-[8px] ${run(click, 'ov-click') ?? ''}`} style={{ right: 16, bottom: 12, width: 38, height: 26, background: colors.accent, color: '#fff', boxShadow: '0 6px 12px -6px rgba(229,115,42,0.8)' }}>
        <Plus size={16} strokeWidth={3} />
      </span>
      {/* the cursor, moving onto create and pressing it */}
      <span aria-hidden className="absolute" style={{ right: click ? 12 : 120, bottom: click ? 2 : 20, color: colors.ink, transition: `right 700ms ${EASE}, bottom 700ms ${EASE}`, filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.25))' }}>
        <MousePointer2 size={20} fill="#fff" strokeWidth={2} />
      </span>
    </div>
  )
}

/** The control plane box with its decisions row (`decide` shows the row); shared by both halves of T02-1. */
function ControlPlane({ w, h, decide }: { w: number; h: number; decide: boolean }) {
  return (
    <Boundary w={w} h={h} solid tone={NET.gateway} fill={TILE_SKIN.background as string} radius={16} style={{ boxShadow: TILE_SKIN.boxShadow }} label="Control Plane" labelTone="dark">
      <At x={w / 2} y={h / 2 + 4} cx cy>
        <span className="inline-flex items-center gap-3" style={shown(decide, 0)}>
          <IconDisc tone={colors.brand} size={34}>
            <Route size={17} />
          </IconDisc>
          <Label size={14} strong raised icon={<span className={run(decide, 'cvx cvx-spin')} style={{ display: 'grid' }}><Cog size={14} /></span>}>
            Routing and Security Decisions in Software
          </Label>
          <IconDisc tone={colors.brand} size={34}>
            <ShieldCheck size={17} />
          </IconDisc>
        </span>
      </At>
    </Boundary>
  )
}

/*
  T02-1 IS SPLIT IN TWO (round 3, 5.md: "split into two slides to reduce density"), each half with its own
  picture on the 546 x 380 stage:
    A  the VPC console on AWS, the cursor clicking create; the API call down into the control plane,
       which makes its routing and security decisions in software
    B  the control plane pushing them onto hardware shared across many customers; the cabling job crossed out
*/
const PA = { console: { x: 93, y: 26, w: 360, h: 132 }, plane: { x: 16, y: 230, w: 514, h: 118 }, lane: 273 } as const
const PB = { plane: { x: 16, y: 24, w: 514, h: 96 }, hw: { x: 16, y: 190, w: 514, h: 100 }, cable: { cy: 336 }, lane: 273 } as const

function PiecesSceneA({ k }: { k: number }) {
  const consoleBottom = PA.console.y + PA.console.h
  return (
    <>
      {/* 0 · the VPC console, on AWS */}
      <At x={PA.console.x} y={PA.console.y}>
        <ConsoleWindow click={k >= 1} w={PA.console.w} h={PA.console.h} />
      </At>
      {/* 1 · the API call, down into the control plane */}
      <Arrow x1={PA.lane} y1={consoleBottom + 4} x2={PA.lane} y2={PA.plane.y - 1} on={k >= 1} />
      <Traveller path={[[PA.lane, consoleBottom + 6], [PA.lane, PA.plane.y - 6]]} run={k >= 1 && !STILL} k="api" tone={colors.accent} size={11} dur={1.2} />
      <At x={PA.lane + 16} y={(consoleBottom + PA.plane.y) / 2} cy>
        <Word on={k >= 1} tone="brand" delay={500}>
          API Call
        </Word>
      </At>
      <At x={PA.plane.x} y={PA.plane.y}>
        <div style={shown(k >= 1, 300)}>
          <ControlPlane w={PA.plane.w} h={PA.plane.h} decide={k >= 2} />
        </div>
      </At>
    </>
  )
}

function PiecesSceneB({ k }: { k: number }) {
  const planeBottom = PB.plane.y + PB.plane.h
  const racks = 4
  const rackX = (i: number) => 52 + i * 50
  return (
    <>
      {/* 0 · the control plane, deciding */}
      <At x={PB.plane.x} y={PB.plane.y}>
        <ControlPlane w={PB.plane.w} h={PB.plane.h} decide />
      </At>
      {/* 1 · pushed onto the hardware, shared across many customers */}
      <Arrow x1={PB.lane} y1={planeBottom + 4} x2={PB.lane} y2={PB.hw.y - 1} on={k >= 1} />
      <Traveller path={[[PB.lane, planeBottom + 6], [PB.lane, PB.hw.y - 6]]} run={k >= 1 && !STILL} k="push" tone={colors.brand} size={11} dur={1.2} />
      <At x={PB.lane + 16} y={(planeBottom + PB.hw.y) / 2} cy>
        <Word on={k >= 1} tone="brand" delay={500}>
          Pushes Them Onto
        </Word>
      </At>
      <At x={PB.hw.x} y={PB.hw.y}>
        <div style={shown(k >= 1, 300)}>
          <Boundary w={PB.hw.w} h={PB.hw.h} solid tone={NET.gateway} fill={TILE_SKIN.background as string} radius={16} style={{ boxShadow: TILE_SKIN.boxShadow }} label="Hardware" labelTone="dark">
          {Array.from({ length: racks }, (_, i) => (
            <At key={i} x={rackX(i)} y={PB.hw.h / 2 + 10} cx cy>
              <div className="relative">
                <Icon3D name="server-stack" w={32} h={38} shadow={false} />
                <Led x={28} y={6} delay={i * 0.3} />
                {/* a customer on every rack: one machine, many customers */}
                <span className="absolute" style={{ left: 14, top: -20, ...shown(k >= 1, 600 + i * 120, -6) }}>
                  <IconDisc tone={CUSTOMERS[i]} size={22}>
                    <UserRound size={12} strokeWidth={2.6} />
                  </IconDisc>
                </span>
              </div>
            </At>
          ))}
          <At x={PB.hw.w - 18} y={PB.hw.h / 2 + 4} cy style={{ transform: 'translate(-100%, -50%)' }}>
            <Label size={14} strong>
              Shared Across Many Customers
            </Label>
          </At>
          </Boundary>
        </div>
      </At>
      {/* 2 · not a cabling job */}
      <At x={PB.lane} y={PB.cable.cy} cx cy>
        <div className="flex items-center gap-4" style={shown(k >= 2, 0)}>
          <span className="relative">
            <IconDisc tone={colors.muted} size={48}>
              <Cable size={24} strokeWidth={2} />
            </IconDisc>
            <span className="absolute" style={{ right: -9, top: -7 }}>
              <NoMark size={22} on={k >= 2} />
            </span>
          </span>
          <Label size={14} strong tone="muted" raised style={{ textDecoration: 'line-through', textDecorationThickness: 2, textDecorationColor: NET.blocked }}>
            A Cabling Job
          </Label>
        </div>
      </At>
    </>
  )
}

export function Pieces({ lesson }: { lesson: string }) {
  /* 0 the console (point 1); 1 the click, the API call, the control plane (point 2); 2 its routing and security decisions (point 3); 3 rest */
  const k = useWalk(4, 3, 1700)
  return (
    <LitFigure
      id="T02-1"
      kicker="Core Building Blocks"
      title="The Network Map"
      lead={T021_LEAD}
      lesson={lesson}
      points={T021_POINTS.slice(0, 3).map((text, i) => ({ icon: T021_ICONS[i], text }))}
      lit={k <= 2 ? k : -1}
      figure={<PiecesSceneA k={k} />}
      pointsW={S7_POINTS_W}
      pointSize={17}
    />
  )
}

/** T02-1b, the second half: the control plane, then the push onto the shared hardware (point 4), then the cabling job crossed out (point 5). */
export function Pieces2({ lesson }: { lesson: string }) {
  const k = useWalk(4, 3, 1700)
  return (
    <LitFigure
      id="T02-1b"
      kicker="Core Building Blocks"
      title="The Network Map"
      lesson={lesson}
      points={T021_POINTS.slice(3).map((text, i) => ({ icon: T021_ICONS[i + 3], text }))}
      lit={k === 1 || k === 2 ? k - 1 : -1}
      figure={<PiecesSceneB k={k} />}
      pointsW={S7_POINTS_W}
      pointSize={17}
    />
  )
}

/* ===== T02-2 · The four building blocks */

const T022_POINTS = [
  'The isolated network container groups all resources that should share one private address space',
  'Subnets subdivide that container into smaller address ranges placed in specific availability zones',
  'Gateways and route tables decide which subnets can reach the internet or other private networks',
  'Security groups and network access control lists filter traffic allowed in and out of each resource',
]
const T022_ICONS = [<SquareDashed key="a" />, <LayoutGrid key="b" />, <RouterIco key="c" />, <ShieldCheck key="d" />]

/** THE ONE VPC DRAWING at the size that fills the stage, one block per point, lit on its beat: the container, the subnets, the gateways with their route tables, the locks. */
function BlocksScene({ k }: { k: number }) {
  const igwPath: [number, number][] = [
    [BG.igw.cx, BG.igw.cy + BG.igw.r + 2],
    [BG.igw.cx, BG.pub.y + 30],
    [BG.instPub.cx + 30, BG.instPub.cy - 10],
  ]
  const natPath: [number, number][] = [
    [BG.instPri.cx - 30, BG.instPri.cy + 12],
    [BG.pri.x - 2, BG.nat.cy],
    [BG.nat.cx + BG.nat.r + 2, BG.nat.cy],
  ]
  return (
    <>
      {/* 0 · the container already groups the resources: the two instances stand in it before the subnets divide it */}
      {k === 0 &&
        [BG.instPub, BG.instPri].map((p, i) => (
          <At key={i} x={p.cx} y={p.cy} cx cy>
            <Resource size={56} />
          </At>
        ))}
      {/* `ov-caps`: the shared drawing's chips in Title Case (R8.4: its route table chip has no label prop, so the case is set by CSS, which DOM text reads too) */}
      <div className="ov-caps absolute inset-0">
        <BigVpc subnets={k >= 1} instances igw={k >= 2} nat={k >= 2} routeTables={k >= 2} locks={k >= 3} lit={{ public: k === 1, private: k === 1, igw: k === 2, nat: k === 2, routeTables: k === 2, locks: k === 3 }} publicLabel="Public Subnet" privateLabel="Private Subnet" />
      </div>
      {/* the container: the AWS VPC mark on its corner */}
      <At x={BG.vpc.x + 96} y={BG.vpc.y + 24} cx cy>
        <span className="grid place-items-center rounded-[10px] bg-white p-1" style={{ boxShadow: k === 0 && !STILL ? `0 0 0 3px ${NET.lit}, 0 8px 16px -8px rgba(16,32,58,0.5)` : '0 8px 16px -8px rgba(16,32,58,0.5)', transition: `box-shadow 420ms ${EASE}` }}>
          <img src={vpcIcon} alt="" aria-hidden className="block h-[30px] w-[30px]" />
        </span>
      </At>
      {/* the locks filter: each shackle snaps shut as its pair is lit */}
      {k === 3 &&
        !STILL &&
        [BG.pub, BG.pri].map((b, i) => (
          <span key={i} aria-hidden className="ov-ring pointer-events-none absolute rounded-full" style={{ left: b.x + b.w - 22, top: b.y - 22, width: 44, height: 44, border: `2.5px solid ${NET.lit}`, animationDelay: `${i * 0.3}s` }} />
        ))}
      {/* traffic on the gateways' lines, from the gateways' beat on */}
      <Traveller path={igwPath} run={k >= 2 && !STILL} k="igw" tone={NET.public} size={12} dur={2} />
      <Traveller path={natPath} run={k >= 2 && !STILL} k="nat" tone={NET.private} size={12} dur={2.2} />
    </>
  )
}

/* round 2 (the review: "reduce the right illustration slightly, widen the left points so every point fits in two lines") */
const S8_POINTS_W = 510
const S8_SCALE = (1110 - S8_POINTS_W - 24) / 634

export function FourBlocks({ lesson }: { lesson: string }) {
  /* 0 the container, 1 the subnets, 2 the gateways and route tables, 3 the locks, 4 rest */
  const k = useWalk(5, 4, 1700)
  return (
    <LitFigure
      id="T02-2"
      kicker="Core Building Blocks"
      title="The Network Map"
      lesson={lesson}
      points={T022_POINTS.map((text, i) => ({ icon: T022_ICONS[i], text }))}
      lit={k <= 3 ? k : -1}
      figure={<Scaled scale={S8_SCALE}><BlocksScene k={k} /></Scaled>}
      figH={Math.round(380 * S8_SCALE)}
      pointsW={S8_POINTS_W}
      pointSize={17}
    />
  )
}

/* ===== T02-3 · Control plane and data plane */

const T023_POINTS = [
  'SDN separates the control plane (deciding where traffic should go) from the data plane (hardware actually forwarding packets)',
  'This split is what makes every building block above configurable instead of physically wired',
]

/*
  THE TWO PLANES on the 634 x 380 stage: the control plane on top holds the four
  building blocks of T02-2 as configuration tiles, each with its switch, and a
  turning gear (deciding where traffic should go); its decisions drop down the
  arrow onto the data plane, five racks on one lane where packets are actually
  forwarded rack to rack. Point 2: every switch flips (configurable) and the
  physical cable is crossed out beside the data plane.
*/
const Q = {
  plane: { x: 24, y: 24, w: 586, h: 170 },
  hw: { x: 24, y: 246, w: 586, h: 104 },
  lane: 317,
}
const TILE = { w: 104, h: 112, y: 40 }
const TILE_X = [118, 236, 354, 472]

/** One building block as a configuration tile: the block's drawing, a switch under it. */
function ConfigTile({ children, on, flip, delay }: { children: ReactNode; on: boolean; flip: boolean; delay: number }) {
  return (
    <div className="relative flex flex-col items-center justify-between rounded-[14px] py-2.5" style={{ width: TILE.w, height: TILE.h, ...TILE_SKIN, ...shown(on, delay) }}>
      <div className="grid flex-1 place-items-center">{children}</div>
      {/* the switch: off, then flipped on by software */}
      <span aria-hidden className="relative block rounded-full" style={{ width: 36, height: 18, background: flip ? colors.success : '#C9D3E3', transition: `background 380ms ${EASE} ${delay}ms` }}>
        <span className="absolute block rounded-full bg-white" style={{ top: 2, left: 2, width: 14, height: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transform: flip ? 'translateX(18px)' : 'none', transition: `transform 380ms ${EASE} ${delay}ms` }} />
      </span>
    </div>
  )
}

function PlanesScene({ k }: { k: number }) {
  const flip = k >= 2
  const rackXs = [70, 180, 290, 400, 510]
  const laneY = Q.hw.h / 2 + 6
  return (
    <>
      {/* 0 · the control plane: the gear deciding, the four blocks as configuration */}
      <At x={Q.plane.x} y={Q.plane.y}>
        <Boundary w={Q.plane.w} h={Q.plane.h} solid tone={NET.gateway} fill={TILE_SKIN.background as string} radius={16} style={{ boxShadow: TILE_SKIN.boxShadow }} label="Control Plane" labelTone="dark">
          <At x={50} y={Q.plane.h / 2 + 4} cx cy>
            <div className="flex flex-col items-center gap-2">
              <IconDisc tone={colors.brand} size={46}>
                <span className={`grid place-items-center ${fx('spin', 0, 6).className}`} style={fx('spin', 0, 6).style}>
                  <Cog size={24} />
                </span>
              </IconDisc>
              <IconDisc tone={colors.brand} size={34}>
                <Route size={17} />
              </IconDisc>
            </div>
          </At>
          {[
            <Boundary key="v" w={62} h={60} radius={10} />,
            <div key="s" className="flex" style={{ gap: 6 }}>
              <SubnetBox w={30} h={60} kind="public" />
              <SubnetBox w={30} h={60} kind="private" />
            </div>,
            <Gateway key="g" kind="igw" size={50} />,
            <LockBadge key="l" size={44} />,
          ].map((b, i) => (
            <At key={i} x={TILE_X[i] - Q.plane.x} y={TILE.y - 8}>
              <ConfigTile on flip={flip} delay={i * 140}>
                {b}
              </ConfigTile>
            </At>
          ))}
        </Boundary>
      </At>
      {/* 1 · the decisions pushed down onto the data plane */}
      <Arrow x1={Q.lane} y1={Q.plane.y + Q.plane.h + 4} x2={Q.lane} y2={Q.hw.y - 1} on={k >= 1} />
      <Traveller path={[[Q.lane, Q.plane.y + Q.plane.h + 6], [Q.lane, Q.hw.y - 6]]} run={k >= 1 && !STILL} k="down" tone={colors.accent} size={11} dur={1.1} />
      <At x={Q.hw.x} y={Q.hw.y}>
        <div style={shown(k >= 1, 300)}>
          <Boundary w={Q.hw.w} h={Q.hw.h} solid tone={NET.gateway} fill={TILE_SKIN.background as string} radius={16} style={{ boxShadow: TILE_SKIN.boxShadow }} label="Data Plane" labelTone="dark">
            {/* the lane the packets are forwarded along */}
            <span aria-hidden className="absolute rounded-full" style={{ left: rackXs[0], right: Q.hw.w - rackXs[4], top: laneY - 1.5, height: 3, background: '#C9D7F2' }} />
            {rackXs.map((x, i) => (
              <At key={i} x={x} y={laneY} cx cy>
                <div className="relative">
                  <Icon3D name="server-stack" w={38} h={44} shadow={false} />
                  <Led x={33} y={7} delay={i * 0.27} />
                </div>
              </At>
            ))}
            <Traveller path={rackXs.map((x) => [x, laneY + 26] as [number, number])} run={k >= 1 && !STILL} k="fw1" tone={colors.brand} size={11} dur={2.6} />
          </Boundary>
        </div>
      </At>
      {/* 2 · configurable, not physically wired: the cable crossed out */}
      <At x={Q.lane + 84} y={(Q.plane.y + Q.plane.h + Q.hw.y) / 2} cx cy>
        <span className="relative block" style={shown(k >= 2, 300)}>
          <IconDisc tone={colors.muted} size={38}>
            <Cable size={19} />
          </IconDisc>
          <span className="absolute" style={{ right: -9, top: -7 }}>
            <NoMark size={20} on={k >= 2} />
          </span>
        </span>
      </At>
      <At x={Q.lane - 84} y={(Q.plane.y + Q.plane.h + Q.hw.y) / 2} cx cy>
        <span className="relative block" style={shown(k >= 2, 150)}>
          <IconDisc tone={colors.success} size={38}>
            <SlidersHorizontal size={19} />
          </IconDisc>
          <span className="absolute" style={{ right: -8, top: -7 }}>
            <Badge on={k >= 2} size={20} ring={colors.success} tone={colors.success}>
              <Check size={12} color="#fff" strokeWidth={3.4} />
            </Badge>
          </span>
        </span>
      </At>
    </>
  )
}

export function Planes({ lesson }: { lesson: string }) {
  /* 0 the control plane, 1 the push and the data plane forwarding, 2 the switches flip and the cable is crossed, 3 rest */
  const k = useWalk(4, 3, 1900)
  return (
    <LitFigure
      id="T02-3"
      kicker="Core Building Blocks"
      title="The Network Map"
      lesson={lesson}
      points={T023_POINTS.map((text, i) => ({ icon: i === 0 ? <Split /> : <SlidersHorizontal />, text }))}
      lit={k <= 1 ? 0 : k === 2 ? 1 : -1}
      figure={<PlanesScene k={k} />}
      figH={FIG_H}
    />
  )
}

/** This section's micro-animations (visual pass, 2026-11-04), appended to the deck's CSS by `netDeck.tsx`. */
export const OVERVIEW_CSS = OV_MOTION_CSS
