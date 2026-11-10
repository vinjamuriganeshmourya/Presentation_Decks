import { Fragment, type CSSProperties, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeftRight, ArrowRightLeft, BadgeCheck, Ban, Building2, Cable, Clock, Coins, Crosshair, Globe, HardDrive, House, Link2Off,
  LockKeyhole, LogOut, MapPin, Merge, Milestone, Network, Route, ShieldAlert, Signpost, Split, Table2, Tag as TagIcon, Users, WandSparkles, Waypoints,
} from 'lucide-react'
import { colors } from '@/design/tokens'
import { Callout } from '@/ui'
import { useInstant } from '@/motion/instant'
import { Arrow, At, BOX_W, Card, Fade, Label, REDUCED, STILL, Stage, Traveller, useBuild } from '../scene'
import { RichCloud } from '../clay-c'
import { TILE_SKIN } from '../card'
import { Badge, CvIcon, LitFigure, Ripple, fx } from './fx'
import { VisualTable } from './vtable'
import { Boundary, G, Gateway, InstanceStack, InternetCloud, LockBadge, Logo, Mono, NET, NoMark, Resource, RouteChip, SubnetBox } from './frames'
import { OnPremOffice, ROUTING_ART_CSS } from './routing-art'
import { ROUTING_AN_CSS } from './routing-analogies'
export { PostalAnalogy, TicketAnalogy, PhoneLineAnalogy } from './routing-analogies'

/**
 * SECTION 4 · ROUTING & GATEWAYS (T13-1 to T18-2), VISUAL PASS 2026-11-04.
 *
 * Every content card is Session 4's `LitFigure`: the TR's points in tiles, each
 * with the icon of its subject, beside the figure; the figure builds one part
 * per step and the point it is acting out is lit (auto animation OFF: one part
 * per right-arrow press, through `useBuild`). The last state is the whole
 * picture with nothing lit, the same frame harness URLs hold.
 *
 *   T13-1   the local line (packets cross it), the three exits sketched faint
 *           on the VPC's edge with where they lead, the route tables (a packet
 *           drops from each subnet to its table)
 *   T13-1b  the internet gateway (two-way flow to the internet), the NAT
 *           gateway (private out only), the peering link (both ways)
 *   T14-1   the table's two heads, then the local row (orange), marked added
 *           automatically
 *   T14-1b  the default row to the gateway, a second subnet on the same table,
 *           the packet pointed at the longer prefix (figure on top, the points
 *           under it in two columns, 2026-11-05)
 *   T15-1   (one card again, 2026-11-05) an inbound packet stopped where the
 *           route is missing; the gateway attached on the VPC's border; the
 *           one-to-one translation glyph; the route (traffic both ways, a teal
 *           private packet leaves blue, the subnet marked public); the
 *           instance's public IP
 *   T16-1   the NAT lands; the private subnet's arrow to it and a packet out;
 *           the inbound path stopped AT the NAT (✖ on its rim); its line to
 *           the internet gateway; then (T16-1b) the route entry, the
 *           many-to-one translation with the same blocked inbound, the cost
 *   T17-1   the route entries with packets crossing; the account and region
 *           tags; then non-transitive, overlapping CIDRs, the cost
 *   T17-2   the tunnel, then IPsec and the two gateways, locked packets inside
 *   T18-1   Session 4's `VisualTable`, the NAT cost cell ringed orange
 *   T18-2   the finished map with traffic on every exit, then the locks and
 *           the security shield; the note as Session 4's callout
 *
 * The three analogies are in `./routing-analogies.tsx`, the drawn objects they
 * and T17-2 use in `./routing-art.tsx`.
 */

const EASE = 'cubic-bezier(0.22,1,0.36,1)'
/** BRIEF2 rule 6 (FS review, 2026-11-04): a dashed border is 1.5px, not the shared 2.5px; passed to `Boundary` through its `style` */
const THIN: CSSProperties = { borderWidth: 1.5 }
/** a box inside a dashed box: a thin solid hairline and a light tint, no second dashed rim */
const HAIR = (tone: string = colors.line): CSSProperties => ({ border: `1px solid ${tone}`, background: '#F7FAFFcc' })
/** the third route colour (G4: parallel paths, distinct colours) */
const PEER = '#7C3AED'

/** A harness URL, reduced motion or a picker thumbnail: the build holds its whole frame and nothing is lit as current. */
function useHeld() {
  const instant = useInstant()
  return STILL || REDUCED || instant
}

/**
 * THE LIT WALK: the figure's base (k -1, nothing lit), then `n` parts, one per
 * step (auto: every `ms` after the entrance; auto OFF: one per press), then the
 * whole picture (k n). `lit` is the part on now, -1 at the base, once the
 * picture is whole, and always on harness URLs.
 */
function useWalk(n: number, ms = 1600) {
  const held = useHeld()
  /* state 0 is the figure's base with nothing lit (so a press, not the entrance, lights the first point); then the n parts; then the rest */
  const k = useBuild(n + 2, ms, 900) - 1
  return { k, lit: held || k < 0 || k >= n ? -1 : k, held }
}

/* ------------------------------------------------------------------ local pieces */

/** A plain line between two points, no head (the attachment lines of the TR diagrams). */
function Line({ x1, y1, x2, y2, tone = NET.boundary, width = 2.5, on = true, dashed = false }: { x1: number; y1: number; x2: number; y2: number; tone?: string; width?: number; on?: boolean; dashed?: boolean }) {
  const instant = useInstant()
  const minX = Math.floor(Math.min(x1, x2) - width)
  const minY = Math.floor(Math.min(y1, y2) - width)
  const maxX = Math.ceil(Math.max(x1, x2) + width)
  const maxY = Math.ceil(Math.max(y1, y2) + width)
  return (
    <svg aria-hidden className="pointer-events-none absolute" style={{ left: minX, top: minY, overflow: 'visible' }} width={maxX - minX} height={maxY - minY}>
      <path d={`M ${x1 - minX} ${y1 - minY} L ${x2 - minX} ${y2 - minY}`} stroke={tone} strokeWidth={width} strokeLinecap="round" fill="none" strokeDasharray={dashed ? '7 7' : undefined} style={{ opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE}, stroke 420ms ${EASE}` }} />
    </svg>
  )
}

/** A tag inside a picture, in the TR's words; solid while its part is the one lit; `icon` puts Session 4's icon tile at its head. */
function Tag({ children, lit = false, tone = 'plain', icon, style }: { children: ReactNode; lit?: boolean; tone?: 'plain' | 'brand' | 'warn' | 'bad' | 'good' | 'muted'; icon?: ReactNode; style?: CSSProperties }) {
  return (
    <Label size={14} strong tone={lit ? 'solid' : tone} raised icon={icon} style={style}>
      {children}
    </Label>
  )
}

/** The dashed peering line between two boxes, as `VpcScene` draws it: a dashed top border, no head. */
function Dashed({ x, y, len, lit = false, on = true }: { x: number; y: number; len: number; lit?: boolean; on?: boolean }) {
  const instant = useInstant()
  return <span aria-hidden className="absolute" style={{ left: x, top: y - 1, width: len, borderTop: `2px dashed ${lit ? NET.lit : NET.boundary}`, opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE}, border-color 420ms ${EASE}` }} />
}

/** A curved arrow (a quadratic or cubic svg path in stage px), drawn tail to head, then its head (G8). */
function CurveArrow({ d, head, on, tone = colors.brand, width = 2.5, w, h }: { d: string; head: { x: number; y: number; angle: number }; on: boolean; tone?: string; width?: number; /** the svg's own box (its parent may be a 0x0 positioning wrapper) */ w: number; h: number }) {
  const instant = useInstant()
  const H = 9
  const a = head.angle
  const l = { x: head.x - Math.cos(a) * H + Math.cos(a + Math.PI / 2) * 5, y: head.y - Math.sin(a) * H + Math.sin(a + Math.PI / 2) * 5 }
  const r = { x: head.x - Math.cos(a) * H - Math.cos(a + Math.PI / 2) * 5, y: head.y - Math.sin(a) * H - Math.sin(a + Math.PI / 2) * 5 }
  return (
    <svg aria-hidden className="pointer-events-none absolute overflow-visible" style={{ left: 0, top: 0, zIndex: 3 }} width={w} height={h}>
      <path d={d} fill="none" stroke={tone} strokeWidth={width} strokeLinecap="round" pathLength={1} strokeDasharray="1" style={{ strokeDashoffset: on ? 0 : 1, transition: instant ? 'none' : on ? 'stroke-dashoffset 860ms cubic-bezier(0.65,0,0.35,1)' : 'stroke-dashoffset 520ms cubic-bezier(0.65,0,0.35,1) 200ms' }} />
      <path d={`M ${head.x} ${head.y} L ${l.x} ${l.y} L ${r.x} ${r.y} Z`} fill={tone} style={{ opacity: on ? 1 : 0, transition: instant ? 'none' : on ? 'opacity 240ms 860ms' : 'opacity 180ms' }} />
    </svg>
  )
}

/**
 * A PACKET THAT TRAVELS A PATH, over and over, at constant speed (the time on
 * each leg is its share of the length). `tones` gives a colour per point, so a
 * packet can change colour where it is translated (T15-1c, T16-1b); `glyph`
 * rides inside it (a padlock on an encrypted packet). Ambient motion: it only
 * runs while its step is on, and never on harness URLs.
 */
function Mover({ path, run, k, dur = 2.2, tone = colors.brand, tones, size = 14, glyph, delay = 0, pause = 0 }: { path: [number, number][]; run: boolean; k: string; dur?: number; tone?: string; tones?: string[]; size?: number; glyph?: ReactNode; delay?: number; pause?: number }) {
  const held = useHeld()
  if (!run || held) return null
  const n = path.length
  const seg = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1]))
  const total = seg.reduce((a, b) => a + b, 0) || 1
  const F = 0.08
  const cum = [0, ...seg.map((_, i) => seg.slice(0, i + 1).reduce((a, b) => a + b, 0) / total)]
  const times = [0, ...cum.map((c) => F + (1 - 2 * F) * c), 1]
  const xs = [path[0][0], ...path.map((p) => p[0]), path[n - 1][0]]
  const ys = [path[0][1], ...path.map((p) => p[1]), path[n - 1][1]]
  const ops = xs.map((_, i) => (i === 0 || i === xs.length - 1 ? 0 : 1))
  const tl = tones ?? path.map(() => tone)
  const bg = [tl[0], ...tl, tl[n - 1]]
  return (
    <motion.span
      key={k}
      aria-hidden
      data-cc-after=""
      className="pointer-events-none absolute grid place-items-center rounded-full"
      style={{ width: size, height: size, left: -size / 2, top: -size / 2, color: colors.white, boxShadow: `0 0 0 3px ${colors.white}cc, 0 4px 10px -4px rgba(16,32,58,0.5)`, zIndex: 4 }}
      initial={{ x: xs[0], y: ys[0], opacity: 0, backgroundColor: bg[0] }}
      animate={{ x: xs, y: ys, opacity: ops, backgroundColor: bg }}
      transition={{ duration: dur, ease: 'linear', times, repeat: Infinity, repeatDelay: pause, delay }}
    >
      {glyph}
    </motion.span>
  )
}

/** The internet beside a drawing, without a word under it (the slide's own labels name it where the TR does). */
function Cloud({ x, y, w = 100, dim = false }: { x: number; y: number; w?: number; dim?: boolean }) {
  return (
    <At x={x} y={y} style={{ opacity: dim ? 0.5 : 1, transition: `opacity 420ms ${EASE}` }}>
      <span className={fx('lift', 0, 3.2).className} style={{ ...fx('lift', 0, 3.2).style, display: 'block' }}>
        <RichCloud w={w} />
      </span>
    </At>
  )
}

/** A small round icon badge that pops when `on`, placed by its centre. */
function Pin({ x, y, on, children, ring = colors.brand, tone = colors.white, size = 28, spin }: { x: number; y: number; on: boolean; children: ReactNode; ring?: string; tone?: string; size?: number; spin?: string }) {
  return (
    <At x={x} y={y} cx cy style={{ zIndex: 5 }}>
      <Badge on={on} size={size} ring={ring} tone={tone}>
        <span className={spin ? fx(spin, 0).className : undefined} style={{ ...(spin ? fx(spin, 0).style : {}), display: 'grid', placeItems: 'center' }}>
          {children}
        </span>
      </Badge>
    </At>
  )
}

/* ------------------------------------------------------------------ the routing map */

/*
  THE ONE VPC DRAWING AT `G`'S NUMBERS, drawn here as a tree whose boxes
  contain their own lines (an arrow that runs inside a subnet is that
  subnet's child, so the harness reads it as inside, not over). The local
  line sits at y 180 and the NAT gateway at y 240 so the private subnet's
  line to the NAT and the local line keep clear of each other; everything
  else is where `VpcScene` puts it.
*/
const IGW_R = 23
/** half of a gateway's label and gap: `Gateway` with a label is centred as a column, so its disc sits this much above the point */
const GW_LABEL_HALF = 15
const NAT_R = 18
const M = {
  vpc: G.vpc,
  pub: { x: G.pub.x - G.vpc.x, y: G.pub.y - G.vpc.y, w: G.pub.w, h: G.pub.h },
  pri: { x: G.pri.x - G.vpc.x, y: G.pri.y - G.vpc.y, w: G.pri.w, h: G.pri.h },
  rt: { y: G.rtPub.y - G.vpc.y, h: G.rtPub.h },
  igw: { cx: G.igw.cx - G.vpc.x, cy: 0 },
  /** inside the public subnet */
  nat: { cx: 75, cy: 92 },
  localY: 80,
  natY: 92,
  peerSlot: { cx: G.vpc.w, cy: G.peer.y + G.peer.h / 2 - G.vpc.y },
  /** the subnets' bottom edge, in the VPC's own coordinates: where a lock sits in front of the route table */
  lockY: G.pub.y + G.pub.h - G.vpc.y,
} as const
/** the same places in stage coordinates (the map drawn at `G`'s numbers) */
const S = {
  instPub: { x: G.vpc.x + M.pub.x + M.pub.w / 2, y: G.vpc.y + M.pub.y + 50 },
  instPri: { x: G.vpc.x + M.pri.x + M.pri.w / 2, y: G.vpc.y + M.pri.y + 50 },
  nat: { x: G.vpc.x + M.pub.x + M.nat.cx, y: G.vpc.y + M.pub.y + M.nat.cy },
  igw: { x: G.vpc.x + M.igw.cx, y: G.vpc.y },
  localY: G.vpc.y + M.localY,
  peer: { x: G.vpc.x + M.peerSlot.cx, y: G.vpc.y + M.peerSlot.cy },
  rtY: G.vpc.y + M.rt.y + M.rt.h / 2,
} as const

/** the local line's ends (stage x): the public subnet's right edge to the private subnet's left edge, a little inside each */
const LOCAL_X = [G.pub.x + G.pub.w - 10, G.pri.x + 10] as const

type MapLit = Partial<Record<'routeTables' | 'igw' | 'nat' | 'peer' | 'locks' | 'local', boolean>>

function RoutingMap({ routeTables = false, igw = false, nat = false, peer = false, locks = false, instances = true, lit = {}, children, pubChildren, priChildren }: {
  routeTables?: boolean; igw?: boolean; nat?: boolean; peer?: boolean; locks?: boolean; instances?: boolean; lit?: MapLit; children?: ReactNode; pubChildren?: ReactNode; priChildren?: ReactNode
}) {
  const peerLineX = G.vpc.x + G.vpc.w + NAT_R + 2
  return (
    <>
      <At x={M.vpc.x} y={M.vpc.y}>
        <Boundary w={M.vpc.w} h={M.vpc.h} label="VPC" style={THIN}>
          {/* the two subnets, an instance in each from the first frame (user, 2026-10-30: no empty containers) */}
          <At x={M.pub.x} y={M.pub.y}>
            <SubnetBox w={M.pub.w} h={M.pub.h} kind="public" label="Public Subnet">
              {instances && (
                <At x={M.pub.w / 2} y={47} cx cy>
                  <Resource size={40} />
                </At>
              )}
              {/* the NAT gateway inside the public subnet */}
              {/* `Gateway` centres its disc AND label on the point: moved down by half the label (15px) so the DISC sits on M.nat, where the lines aim */}
              <At x={M.nat.cx} y={M.nat.cy + GW_LABEL_HALF} cx cy>
                <Fade on={nat} lift={6}>
                  <Gateway kind="nat" size={NAT_R * 2} lit={!!lit.nat} label="NAT Gateway" />
                </Fade>
              </At>
              {/* the private subnet's line, the part inside this subnet, ending at the NAT's rim */}
              <Arrow x1={M.pub.w - 2} y1={M.natY} x2={M.nat.cx + NAT_R + 2} y2={M.natY} on={nat} tone={lit.nat ? NET.lit : NET.private} />
              {pubChildren}
            </SubnetBox>
          </At>
          <At x={M.pri.x} y={M.pri.y}>
            <SubnetBox w={M.pri.w} h={M.pri.h} kind="private" label="Private Subnet">
              {instances && (
                <At x={M.pri.w / 2} y={50} cx cy>
                  <Resource size={40} />
                </At>
              )}
              {/* a database under it (FS review, slide 30: the private subnet held one icon), clear of the line to the NAT */}
              {instances && (
                <At x={M.pri.w / 2} y={116} cx cy>
                  <Resource size={34} kind="database" />
                </At>
              )}
              {priChildren}
            </SubnetBox>
          </At>
          {/* the built-in local line between them, there from the start */}
          <Line x1={M.pub.x + M.pub.w + 2} y1={M.localY} x2={M.pri.x - 2} y2={M.localY} tone={lit.local ? NET.lit : NET.boundary} width={3} />
          <At x={(M.pub.x + M.pub.w + M.pri.x) / 2} y={M.localY + 22} cx cy>
            <Label size={14} strong tone={lit.local ? 'solid' : 'plain'} raised>
              Local
            </Label>
          </At>
          {/* the private subnet's line to the NAT, the part between the subnets */}
          <Line x1={M.pri.x - 2} y1={M.pub.y + M.natY} x2={M.pub.x + M.pub.w + 2} y2={M.pub.y + M.natY} on={nat} tone={lit.nat ? NET.lit : NET.private} />
          {/* the route table beside each subnet */}
          {[M.pub, M.pri].map((sb, i) => (
            <At key={i} x={sb.x} y={M.rt.y} w={sb.w}>
              <Fade on={routeTables} lift={6} delay={i * 120}>
                <div className="grid place-items-center" style={{ height: M.rt.h }}>
                  <RouteChip lit={!!lit.routeTables} label="Route Table" />
                </div>
              </Fade>
            </At>
          ))}
          {/* the internet gateway on the VPC's top edge */}
          <At x={M.igw.cx} y={M.igw.cy} cx cy>
            <Fade on={igw} lift={6}>
              <Gateway kind="igw" lit={!!lit.igw} />
            </Fade>
          </At>
          <At x={M.igw.cx} y={M.igw.cy - 42} cx cy>
            <Fade on={igw} lift={6}>
              <Label size={14} strong tone={lit.igw ? 'solid' : 'plain'} raised>
                Internet Gateway
              </Label>
            </Fade>
          </At>
          {/* two-way: the public subnet's top edge and the gateway's rim */}
          <Arrow x1={M.igw.cx} y1={M.pub.y - 2} x2={M.igw.cx} y2={M.igw.cy + IGW_R + 2} on={igw} both tone={lit.igw ? NET.lit : NET.public} />
          {/* the peering link's exit on the VPC's right edge */}
          <At x={M.peerSlot.cx} y={M.peerSlot.cy} cx cy>
            <Fade on={peer} lift={6}>
              <Gateway kind="peer" size={NAT_R * 2} lit={!!lit.peer} />
            </Fade>
          </At>
          {/* a lock on each subnet's edge, in front of its route table (T18-2) */}
          {[M.pub, M.pri].map((sb, i) => (
            <At key={i} x={sb.x + sb.w / 2} y={M.lockY} cx cy>
              <Fade on={locks} lift={6} delay={i * 120}>
                <span className={locks ? fx('shackle', i * 0.4, 3).className : undefined} style={{ ...(locks ? fx('shackle', i * 0.4, 3).style : {}), display: 'block' }}>
                  <LockBadge lit={!!lit.locks} />
                </span>
              </Fade>
            </At>
          ))}
          {children}
        </Boundary>
      </At>
      {/* the second VPC on the dashed peering line (hidden, it waits over the first VPC, inside any stage the map is drawn on) */}
      <At x={peer ? G.peer.x : G.vpc.x} y={peer ? G.peer.y : G.vpc.y}>
        <Fade on={peer} lift={0}>
          <Boundary w={G.peer.w} h={G.peer.h} label="VPC" lit={!!lit.peer} style={THIN}>
            <At x={G.peer.w / 2 - 26} y={G.peer.h / 2 + 8} cx cy>
              <Resource size={40} />
            </At>
            <At x={G.peer.w / 2 + 26} y={G.peer.h / 2 + 8} cx cy>
              <Resource size={36} kind="database" />
            </At>
          </Boundary>
        </Fade>
      </At>
      <Dashed x={peerLineX} y={G.peer.y + G.peer.h / 2} len={G.peer.x - peerLineX} lit={!!lit.peer} on={peer} />
      <At x={(peerLineX + G.peer.x) / 2 - 10} y={G.peer.y + G.peer.h / 2 - 22} cx cy>
        <Fade on={peer} lift={6}>
          <Label size={14} strong tone={lit.peer ? 'solid' : 'plain'} raised>
            Peering
          </Label>
        </Fade>
      </At>
    </>
  )
}

/** The rim point of the internet gateway's disc facing `to` (stage coordinates of the map). */
function igwRim(to: { x: number; y: number }, gap = 3): [number, number] {
  const dx = to.x - S.igw.x
  const dy = to.y - S.igw.y
  const l = Math.hypot(dx, dy) || 1
  return [S.igw.x + (dx / l) * (IGW_R + gap), S.igw.y + (dy / l) * (IGW_R + gap)]
}

/**
 * THE INTERNET GATEWAY'S LINK TO THE INTERNET (5.md, slide 32: the cloud and the globe were not joined). An internet
 * gateway carries traffic both ways (the card: "two-way access to the public internet"), so the link is one arrow with
 * a head at each end, from the gateway's rim to the cloud's edge. `to` is the cloud's edge point.
 */
function IgwLink({ to, on = true, lit = false, tone = NET.public, width = 2 }: { to: { x: number; y: number }; on?: boolean; lit?: boolean; tone?: string; width?: number }) {
  const [x1, y1] = igwRim(to)
  return <Arrow x1={x1} y1={y1} x2={to.x} y2={to.y} on={on} both tone={lit ? NET.lit : tone} width={width} />
}

/** The map's traffic, one flow per exit: two-way through the internet gateway, out only through the NAT, both ways on the peering line. */
function MapFlows({ igw = false, nat = false, peer = false, local = false, cloud }: { igw?: boolean; nat?: boolean; peer?: boolean; local?: boolean; cloud: { x: number; y: number } }) {
  const peerA: [number, number] = [S.peer.x + NAT_R + 4, S.peer.y]
  const peerB: [number, number] = [G.peer.x + G.peer.w / 2 - 26, S.peer.y]
  const rim = igwRim(cloud, 1)
  return (
    <>
      {/* the local line's packets ride the gap between the subnets, clear of the subnets' name chips */}
      <Mover k="lo1" run={local} path={[[LOCAL_X[0], S.localY], [LOCAL_X[1], S.localY]]} tone={colors.brand} size={10} dur={1.2} />
      <Mover k="lo2" run={local} path={[[LOCAL_X[1], S.localY], [LOCAL_X[0], S.localY]]} tone={colors.brand} size={10} dur={1.2} delay={0.7} />
      <Mover k="ig1" run={igw} path={[[S.igw.x, S.instPub.y - 20], [S.igw.x, S.igw.y + IGW_R + 2], rim, [cloud.x, cloud.y]]} tone={NET.public} dur={2.2} />
      <Mover k="ig2" run={igw} path={[[cloud.x, cloud.y], rim, [S.igw.x, S.igw.y + IGW_R + 2], [S.igw.x, S.instPub.y - 20]]} tone={colors.brand} dur={2.2} delay={1.1} />
      {/* the NAT: a private instance STARTS the connection (out, teal turning green at the NAT), and the reply comes back the same way (green turning teal); nothing starts from outside */}
      <Mover
        k="na1"
        run={nat}
        path={[[S.instPri.x - 30, S.nat.y], [S.nat.x + NAT_R + 4, S.nat.y], [S.nat.x + 14, S.nat.y - 18], [S.igw.x + 6, S.igw.y + IGW_R + 4], [S.nat.x + 14, S.nat.y - 18], [S.nat.x + NAT_R + 4, S.nat.y + 6], [S.instPri.x - 30, S.nat.y + 6]]}
        tones={[NET.private, NET.private, NET.public, NET.public, NET.public, NET.private, NET.private]}
        dur={4}
      />
      <Mover k="pe1" run={peer} path={[peerA, peerB]} tone={PEER} dur={1.8} />
      <Mover k="pe2" run={peer} path={[peerB, peerA]} tone={PEER} dur={1.8} delay={1} />
    </>
  )
}

/* ===== T13-1 · The four connectivity pieces */

const T13_LEAD = 'Subnets in a VPC reach each other through a built-in local route'
const T13_POINTS: ReactNode[] = [
  'Traffic leaving the VPC follows a route table to the right exit: an internet gateway, a NAT gateway, or a direct link to another network',
  'Route tables decide the next hop for every outgoing packet, subnet by subnet',
  'An internet gateway gives public subnets two-way access to the public internet',
  'A NAT gateway lets private subnets reach the internet without accepting inbound connections',
  'VPC peering and private connectivity link two networks directly, bypassing the public internet',
]

/* T13-1's stage (FS review, slide 29): 486 x 330 beside a 600px points column (the first point in two lines). The map at
   `G`'s numbers moved 14px left and 48px up; the internet sits right of the gateway's slot, above the map; another network
   right of the VPC, above the peering slot; every connector a thin solid arrow (no dashed lines here) */
const A_DX = -14
const A_DY = -48
const T13_PW = 600
/** where the exits lead (G coordinates): the internet, another network */
const GHOST_CLOUD = { x: 410, y: 56, w: 82 }
const GHOST_NET = { x: 416, y: 166, w: 76, h: 74 }

/**
 * T13-1 (split, 2026-10-30): the base, the lead's local line (packets cross it);
 * 1 the three exits on the VPC (internet gateway on its edge, NAT gateway in the
 * public subnet, the peering link on its right edge), with where each leads;
 * 2 the route tables arrive, a packet drops from each subnet to its own table
 * and a route marker pops beside each table.
 */
function FourPiecesSceneA({ k, lit, held }: { k: number; lit: number; held: boolean }) {
  const exits = k >= 1
  const tables = k >= 2
  const exitsLit = lit === 0
  const cloudMid = { x: GHOST_CLOUD.x, y: GHOST_CLOUD.y + 32 }
  return (
    <div className="absolute" style={{ left: A_DX, top: A_DY, width: 0, height: 0 }}>
      <RoutingMap routeTables={tables} lit={{ local: !held && k === 0, routeTables: lit === 1 }} />
      {/* the three exits on the VPC: solid discs, dimmed until a gateway is attached (T13-1b) */}
      {([['igw', S.igw.x, S.igw.y], ['nat', S.nat.x, S.nat.y], ['peer', S.peer.x, S.peer.y]] as const).map(([kind, x, y], i) => (
        <At key={kind} x={x} y={y} cx cy>
          <Fade on={exits} lift={6} delay={i * 160}>
            <Gateway kind={kind} size={36} lit={exitsLit} dim={!exitsLit} />
          </Fade>
        </At>
      ))}
      {[S.igw, S.nat, S.peer].map((p, i) => (
        <Ripple key={i} x={p.x} y={p.y} r={22} tone={NET.lit} on={exitsLit} />
      ))}
      {/* where they lead: the internet (from the gateway's slot, above the VPC's edge), another network (from the peering slot) */}
      <Fade on={exits} lift={0} delay={300}>
        <Cloud x={GHOST_CLOUD.x} y={GHOST_CLOUD.y} w={GHOST_CLOUD.w} dim={!exitsLit} />
      </Fade>
      <IgwLink to={{ x: cloudMid.x + 8, y: cloudMid.y - 4 }} on={exits} lit={exitsLit} tone={colors.muted} width={1.5} />
      <At x={GHOST_NET.x} y={GHOST_NET.y}>
        <Fade on={exits} lift={0} delay={300}>
          <Boundary w={GHOST_NET.w} h={GHOST_NET.h} tone={exitsLit ? NET.lit : colors.muted} solid style={{ borderWidth: 1.5, opacity: exitsLit ? 1 : 0.7 }} radius={14}>
            <At x={GHOST_NET.w / 2 - 17} y={GHOST_NET.h / 2} cx cy>
              <Resource size={30} dim={!exitsLit} />
            </At>
            <At x={GHOST_NET.w / 2 + 17} y={GHOST_NET.h / 2} cx cy>
              <Resource size={30} kind="database" dim={!exitsLit} />
            </At>
          </Boundary>
        </Fade>
      </At>
      {/* peering carries traffic both ways: a head at each end */}
      <Arrow x1={S.peer.x + 13} y1={S.peer.y - 13} x2={GHOST_NET.x + GHOST_NET.w / 2} y2={GHOST_NET.y + GHOST_NET.h} on={exits} both tone={exitsLit ? NET.lit : colors.muted} width={1.5} />
      {/* the lead's local line: packets cross it both ways */}
      <MapFlows local={k === 0 || k >= 3} cloud={cloudMid} />
      {/* a packet drops from each subnet to its own route table; a route marker beside each table */}
      <Mover k="rt1" run={tables} path={[[S.instPub.x - 22, S.instPub.y + 24], [S.instPub.x - 22, S.rtY - 14]]} tone={colors.brand} dur={1.4} />
      <Mover k="rt2" run={tables} path={[[S.instPri.x - 34, S.instPri.y + 24], [S.instPri.x - 34, S.rtY - 14]]} tone={colors.brand} dur={1.4} delay={0.7} />
      {[G.pub, G.pri].map((sb, i) => (
        <Pin key={i} x={sb.x + sb.w - 4} y={S.rtY} on={tables} ring={lit === 1 ? NET.lit : colors.brand} size={24}>
          <Route size={13} color={lit === 1 ? NET.lit : colors.brand} />
        </Pin>
      ))}
    </div>
  )
}

/** T13-1b: the internet gateway (two-way traffic to the internet), the NAT gateway (private, out only), the peering link (both ways). */
/** T13-1b's internet: right of the gateway's label, above the VPC's edge; the link lands on its lower-left lobe */
const B_CLOUD = { x: 330, y: 2, w: 104 }
const B_LINK = { x: 340, y: 54 }
function FourPiecesSceneB({ k, lit }: { k: number; lit: number }) {
  const cloudAt = B_LINK
  return (
    <>
      <RoutingMap routeTables igw={k >= 0} nat={k >= 1} peer={k >= 2} lit={{ igw: lit === 0, nat: lit === 1, peer: lit === 2 }} />
      <Cloud x={B_CLOUD.x} y={B_CLOUD.y} w={B_CLOUD.w} />
      <Ripple x={S.igw.x} y={S.igw.y} r={30} tone={NET.lit} on={lit === 0} />
      <Ripple x={S.nat.x} y={S.nat.y} r={26} tone={NET.lit} on={lit === 1} />
      <Ripple x={S.peer.x} y={S.peer.y} r={26} tone={NET.lit} on={lit === 2} />
      <IgwLink to={B_LINK} lit={lit === 0} />
      <MapFlows igw nat={k >= 1} peer={k >= 2} cloud={cloudAt} />
    </>
  )
}

export function FourPieces({ lesson }: { lesson: string }) {
  /* the lead's state, then the two points */
  const { k, held } = useWalk(3)
  const lit = held || k < 1 || k >= 3 ? -1 : k - 1
  return (
    <LitFigure
      id="T13-1"
      kicker="Connectivity Building Blocks"
      title="Four Core Pieces"
      lead={T13_LEAD}
      lesson={lesson}
      lit={lit}
      pointSize={16}
      figH={330}
      pointsW={T13_PW}
      points={[
        { icon: <Signpost />, text: T13_POINTS[0] },
        { icon: <Route />, text: T13_POINTS[1] },
      ]}
      figure={<FourPiecesSceneA k={k} lit={lit} held={held} />}
    />
  )
}

export function FourPieces2({ lesson }: { lesson: string }) {
  const { k, lit } = useWalk(3)
  return (
    <LitFigure
      id="T13-1b"
      kicker="Connectivity Building Blocks"
      title="Four Core Pieces"
      lesson={lesson}
      lit={lit}
      pointSize={16}
      points={[
        { icon: <Globe />, text: T13_POINTS[2] },
        { icon: <LogOut />, text: T13_POINTS[3] },
        { icon: <Waypoints />, text: T13_POINTS[4] },
      ]}
      figure={<FourPiecesSceneB k={k} lit={lit} />}
    />
  )
}

/* ===== T14-1 · A route table, entry by entry */

const T14_LEAD = 'A route table is a subnet’s rulebook for where traffic goes next'
const T14_POINTS: ReactNode[] = [
  'Each entry pairs a destination range with a target, such as local, a gateway, or a peering link, and the most specific match wins',
  "A local route keeps all traffic inside the VPC's own CIDR block, added automatically",
  <>
    A default route of <Mono>0.0.0.0/0</Mono> sends everything else to a gateway target
  </>,
  'Each subnet associates with exactly one route table, though one table can serve many subnets',
  'Longest-prefix-match order decides which entry wins when destinations overlap',
]

/* the stage, 686 wide (points column 400): subnets on the left, Session 4's table in the middle, the tags at its right */
/* FS review (slide 31): the points column widened to 460 (the first point in three lines), the picture narrowed to 626 */
const T14_PW = 460
const T14 = {
  sub: { x: 8, w: 96, h: 68, y: [84, 206] },
  /* 5.md slide 33: the table 270 wide so the Added Automatically chip sits clear of the VPC box and inside the stage */
  table: { x: 124, y: 48, w: 270 },
  head: 44,
  row: 41,
  packet: { cx: 536, cy: 26 },
} as const
const T14_RIGHT = T14.table.x + T14.table.w
/** the local loop: from under the local cell back up into the subnet's foot; the tip 1px below the subnet's edge, the line ending at the head's base */
const LOOP = { x0: T14.table.x + 228, x1: T14.sub.x + T14.sub.w / 2, tip: T14.sub.y[0] + T14.sub.h + 1 }
const rowMid = (i: number) => T14.table.y + T14.head + T14.row * i + T14.row / 2

/** A monospace table value with its icon (content rule 40: ligatures off). */
function MonoCell({ icon, children, tone = colors.brand }: { icon?: ReactNode; children: ReactNode; tone?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-mono" style={{ fontVariantLigatures: 'none', fontSize: 15 }}>
      {icon && (
        <span aria-hidden className="grid h-[20px] w-[20px] place-items-center [&>svg]:h-[16px] [&>svg]:w-[16px]" style={{ color: tone }}>
          {icon}
        </span>
      )}
      {children}
    </span>
  )
}

/**
 * T14-1 and T14-1b (split 2026-10-30), the route table as Session 4's table,
 * one entry per step, the entry in focus in orange. Part 0: the heads, then
 * the local row marked added automatically (a packet loops back inside).
 * Part 1: the default row and its gateway, a second subnet on the same table,
 * the packet pointed at the longer prefix.
 */
function RouteTableScene({ part, k, lit }: { part: 0 | 1; k: number; lit: number }) {
  const shown = part === 0 ? (k >= 1 ? 1 : 0) : k >= 0 ? 2 : 1
  const second = part === 1 && k >= 1
  const packet = part === 1 && k >= 2
  const highlight = part === 0 ? (lit === 1 ? [0] : []) : lit === 0 ? [1] : lit === 2 ? [0] : []
  const headsLit = part === 0 && lit === 0
  const dy = part === 0 ? 10 : 0
  const packetEnd: [number, number] = [T14_RIGHT + 2, rowMid(0) - 10]
  const packetStart: [number, number] = [T14.packet.cx - 30, T14.packet.cy + 14]
  const head = (icon: ReactNode, text: string) => (
    <span className="inline-flex items-center gap-2" style={{ color: headsLit ? NET.lit : undefined, transition: `color 420ms ${EASE}` }}>
      <span aria-hidden className={`grid h-[26px] w-[26px] place-items-center rounded-[8px] [&>svg]:h-[15px] [&>svg]:w-[15px] ${headsLit ? fx('hop', 0, 1.4).className : ''}`} style={{ ...(headsLit ? fx('hop', 0, 1.4).style : {}), background: colors.white, boxShadow: `inset 0 0 0 1.5px ${headsLit ? NET.lit : `${colors.brand}40`}` }}>
        {icon}
      </span>
      {text}
    </span>
  )
  return (
    <div className="absolute" style={{ left: 0, top: dy, width: 0, height: 0 }}>
      {/* the subnets, each on its one line to the table, a resource in each */}
      {T14.sub.y.map((yy, i) => {
        /* T14-1 keeps the second subnet's words but not its place: hidden, on top of the first, inside the stage */
        const y = part === 0 ? T14.sub.y[0] : yy
        const on = i === 0 || second
        const sLit = part === 1 && lit === 1 && i === 1
        const toY = i === 0 ? y + T14.sub.h / 2 : T14.table.y + T14.head + T14.row * 2 - 10
        return (
          <Fragment key={i}>
            <At x={T14.sub.x} y={y}>
              <Fade on={on} lift={8}>
                <SubnetBox w={T14.sub.w} h={T14.sub.h} label="Subnet" lit={sLit}>
                  <At x={T14.sub.w - 10} y={T14.sub.h / 2 + 14} cy style={{ transform: 'translate(-100%, -50%)' }}>
                    <Resource size={30} />
                  </At>
                </SubnetBox>
              </Fade>
            </At>
            <Line x1={T14.sub.x + T14.sub.w + 2} y1={y + T14.sub.h / 2} x2={T14.table.x - 2} y2={toY} on={on} tone={sLit ? NET.lit : NET.boundary} />
          </Fragment>
        )
      })}
      <Ripple x={T14.table.x + 40} y={rowMid(1)} r={30} tone={NET.lit} on={part === 1 && lit === 1} />
      {/* the table: the TR's two rows and nothing else */}
      <At x={T14.table.x} y={T14.table.y} w={T14.table.w}>
        <VisualTable
          size={15}
          compact
          shown={shown}
          highlight={highlight}
          columns={[
            { label: head(<MapPin />, 'Destination'), weight: 1.25 },
            { label: head(<Crosshair />, 'Target'), weight: 1 },
          ]}
          rows={[
            { cells: [<MonoCell key="d">10.0.0.0/16</MonoCell>, <MonoCell key="t" icon={<House />} tone={colors.success}>local</MonoCell>] },
            ...(part === 1 ? [{ cells: [<MonoCell key="d">0.0.0.0/0</MonoCell>, <MonoCell key="t" icon={<Globe />}>igw-id</MonoCell>] }] : []),
          ]}
        />
      </At>
      {/* part 0: the VPC drawn round the subnet and its table (no word: the point names it), the local route's loop back inside it */}
      {part === 0 && (
        <>
          <At x={4} y={T14.table.y - 22}>
            <Boundary w={T14_RIGHT + 8} h={T14.head + T14.row + 92} tone={`${colors.brand}`} style={{ ...THIN, opacity: 0.7 }} />
          </At>
          <CurveArrow
            w={T14_RIGHT}
            h={T14.sub.y[0] + T14.sub.h + 50}
            on={k >= 1}
            tone={lit === 1 ? NET.lit : colors.success}
            d={`M ${LOOP.x0} ${rowMid(0) + T14.row / 2 + 2} C ${LOOP.x0} ${rowMid(0) + 70}, ${LOOP.x1} ${rowMid(0) + 84}, ${LOOP.x1} ${LOOP.tip + 9}`}
            head={{ x: LOOP.x1, y: LOOP.tip, angle: -Math.PI / 2 }}
          />
        </>
      )}
      {/* the local row's mark */}
      <At x={T14_RIGHT + 24} y={rowMid(0) + 6} cy>
        <Fade on={part === 0 ? k >= 1 : true} lift={6}>
          <Tag lit={part === 0 && lit === 1} icon={<WandSparkles />}>Added Automatically</Tag>
        </Fade>
      </At>
      {/* part 0: the local route keeps a packet inside: out of the subnet, through the table, back */}
      <Mover k="loc" run={part === 0 && k >= 1} path={[[T14.sub.x + T14.sub.w - 24, T14.sub.y[0] + T14.sub.h / 2], [T14.table.x - 4, rowMid(0)], [T14.table.x + 60, rowMid(0)], [T14.table.x - 4, rowMid(0) + 8], [T14.sub.x + 60, T14.sub.y[0] + T14.sub.h - 12]]} tone={colors.success} dur={2.6} />
      {/* part 1: the default row's target, the gateway */}
      {part === 1 && (
        <>
          <Arrow x1={T14_RIGHT + 2} y1={rowMid(1)} x2={T14_RIGHT + 30} y2={rowMid(1)} tone={lit === 0 ? NET.lit : colors.brand} />
          <At x={T14_RIGHT + 50} y={rowMid(1)} cx cy>
            <Gateway kind="igw" size={36} lit={lit === 0} />
          </At>
          <Mover k="dflt" run={k >= 0} path={[[T14.table.x + 120, rowMid(1)], [T14_RIGHT + 30, rowMid(1)]]} tone={colors.brand} dur={1.6} />
        </>
      )}
      {/* the incoming packet, from the top right, pointed at the longer prefix */}
      <At x={T14.packet.cx} y={T14.packet.cy} cx cy>
        <Fade on={packet} lift={6}>
          <Tag lit={lit === 2}>Incoming Packet</Tag>
        </Fade>
      </At>
      <Arrow x1={packetStart[0]} y1={packetStart[1]} x2={packetEnd[0]} y2={packetEnd[1]} on={packet} tone={lit === 2 ? NET.lit : colors.brand} />
      <Traveller path={[packetStart, packetEnd]} run={packet && part === 1} k="packet" tone={colors.brand} size={14} dur={1.8} />
      <At x={T14.table.x + T14.table.w / 2} y={part === 0 ? T14.table.y + T14.head : T14.table.y + T14.head + T14.row * 2 + 30} cx cy>
        <Fade on={packet} lift={6}>
          <Tag lit={lit === 2} icon={<Crosshair />}>Longest-Prefix-Match</Tag>
        </Fade>
      </At>
    </div>
  )
}

export function RouteTables({ lesson }: { lesson: string }) {
  const { k, lit } = useWalk(2)
  return (
    <LitFigure
      id="T14-1"
      kicker="Route Tables"
      title="Next-Hop Rules"
      lead={T14_LEAD}
      lesson={lesson}
      lit={lit}
      pointSize={16}
      pointsW={T14_PW}
      figH={226}
      points={[
        { icon: <Table2 />, text: T14_POINTS[0] },
        { icon: <Network />, text: T14_POINTS[1] },
      ]}
      figure={<RouteTableScene part={0} k={k} lit={lit} />}
    />
  )
}

/**
 * THE FIGURE ON TOP, THE POINTS UNDER IT IN TWO COLUMNS (review 2026-11-05, slide 36: "move the visual to the top
 * and resize it as needed; place the points below it as 2 pairs side by side"). `LitPoints`' tile, laid in a
 * two-column grid; an odd last tile sits centred under the pair, one column wide, so the rows stay balanced.
 */
function LitGridFigure({ id, kicker, title, lesson, points, lit, figure, figH, gap = 10, size = 16 }: { id: string; kicker: string; title: string; lesson: string; points: { icon: ReactNode; text: ReactNode }[]; lit: number; figure: ReactNode; figH: number; gap?: number; size?: number }) {
  const ease = 'all 420ms cubic-bezier(0.22,1,0.36,1)'
  const colW = (BOX_W - gap) / 2
  return (
    <Card id={id} kicker={kicker} title={title} lesson={lesson}>
      <div className="flex flex-col" style={{ width: BOX_W, gap: 12 }}>
        <Stage w={BOX_W} h={figH} active={false}>
          {figure}
        </Stage>
        <div className="grid" style={{ gridTemplateColumns: `repeat(2, ${colW}px)`, gap }}>
          {points.map((it, i) => {
            const on = !STILL && i === lit
            const odd = points.length % 2 === 1 && i === points.length - 1
            return (
              <div
                key={i}
                className="flex items-center gap-3 rounded-2xl px-3.5 py-2"
                style={{
                  ...TILE_SKIN,
                  ...(odd ? { gridColumn: '1 / span 2', justifySelf: 'center', width: colW } : {}),
                  boxShadow: on ? `inset 0 0 0 2px ${colors.brand}, 0 12px 24px -14px ${colors.brand}` : TILE_SKIN.boxShadow,
                  background: on ? 'linear-gradient(180deg, #F4F8FF 0%, #E3ECFD 100%)' : TILE_SKIN.background,
                  transform: on ? 'translateY(-3px)' : 'none',
                  transition: ease,
                }}
              >
                <span
                  aria-hidden
                  className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px] [&>svg]:h-[20px] [&>svg]:w-[20px]"
                  style={{ background: on ? colors.brand : colors.surface2, color: on ? colors.white : colors.brand, transition: ease }}
                >
                  {it.icon}
                </span>
                <span className="min-w-0 leading-snug" style={{ fontSize: size, color: colors.ink }}>
                  {it.text}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

/**
 * T14-1b's drawing centred on the full-width stage above the points. Its own extent is about 612 x 262 (the packet tag
 * at y 13 to the second subnet's foot at 274); the space under a no-lead title is 419px, so the drawing keeps its size
 * (stage 277 + 12 + the two tile rows 130) rather than growing.
 */
const T14B = { scale: 1, w: 612, top: -6, h: 277 } as const

export function RouteTables2({ lesson }: { lesson: string }) {
  const { k, lit } = useWalk(3)
  return (
    <LitGridFigure
      id="T14-1b"
      kicker="Route Tables"
      title="Next-Hop Rules"
      lesson={lesson}
      lit={lit}
      figH={T14B.h}
      points={[
        { icon: <Milestone />, text: T14_POINTS[2] },
        { icon: <Split />, text: T14_POINTS[3] },
        { icon: <Crosshair />, text: T14_POINTS[4] },
      ]}
      figure={
        <div className="absolute" style={{ left: (BOX_W - T14B.w * T14B.scale) / 2, top: T14B.top, width: 0, height: 0, transform: `scale(${T14B.scale})`, transformOrigin: '0 0' }}>
          <RouteTableScene part={1} k={k} lit={lit} />
        </div>
      }
    />
  )
}

/* ===== T15-1 · The internet gateway (review 2026-11-05: T15-1 and T15-1c merged back into one card, the user's lead and four points) */

const T15_LEAD = 'A subnet is public only when its route table sends outside-bound traffic to an internet gateway (IGW), a VPC component attached once per VPC'
const T15_POINTS: ReactNode[] = [
  'Attaches at the VPC level, not inside a subnet',
  'Translates between private and public IP addresses (one-to-one NAT)',
  'The route to the IGW is what makes a subnet public',
  'The instance also needs a public or Elastic IP, or the route alone won’t make it reachable',
]

/*
  THE TR'S IMAGE (slide 15, user 2026-10-30, G1: "recreate the TR doc visual
  exactly"), in this deck's pieces: a Region box; inside it the VPC; inside
  that Availability Zone A holding the Public subnet with its instances, and
  Availability Zone B holding the Private subnet with its instances; the
  Internet gateway on the VPC's right border; a line from the public subnet's
  instances that runs right then down into the gateway, a head at each end;
  the gateway's two-way line out to the internet cloud.
*/
const T15_H = 340
const T15_PW = 520
const T15 = {
  /* FS review (slides 34/35): a 566px stage beside a 520px points column (every point in two lines), the same on both cards */
  region: { x: 10, y: 16, w: 384, h: 320 },
  vpc: { x: 18, y: 48, w: 336, h: 278 },
  zoneA: { x: 18, y: 36, w: 210, h: 110 },
  zoneB: { x: 18, y: 156, w: 210, h: 110 },
  subnet: { x: 14, y: 32, w: 182, h: 66 },
  inst: { cx: 130, cy: 38, size: 40 },
  cloud: { x: 452, y: 136, w: 100 },
} as const
const T15_IGW = { cx: T15.vpc.w, cy: T15.vpc.h / 2 + 10 }
/* the elbow from the instances to the gateway: right along the instances' line, then down to the gateway's rim (in the VPC's own coordinates) */
const T15_INST_X = T15.zoneA.x + T15.subnet.x + T15.inst.cx + T15.inst.size / 2 + 4
const T15_INST_Y = T15.zoneA.y + T15.subnet.y + T15.inst.cy
const T15_FLOW_Y = T15.vpc.y + T15_IGW.cy
/* the same places in stage coordinates */
const T15S = {
  inst: { x: T15.vpc.x + T15.zoneA.x + T15.subnet.x + T15.inst.cx, y: T15.vpc.y + T15_INST_Y },
  elbowX: T15.vpc.x + T15_IGW.cx - 48,
  igw: { x: T15.vpc.x + T15_IGW.cx, y: T15_FLOW_Y },
  subnet: { x: T15.vpc.x + T15.zoneA.x + T15.subnet.x, y: T15.vpc.y + T15.zoneA.y + T15.subnet.y },
}

/**
 * T15-1, one card (merged 2026-11-05), in step with the four points. The base:
 * the instance already holds a public IP, but there is no route, so a packet
 * from the internet is stopped at the gap where the route would be (✖).
 * 0 the gateway attaches on the VPC's border (the VPC lights, not a subnet);
 * 1 the one-to-one translation glyph lands on the gateway; 2 the route draws,
 * the ✖ goes, the public subnet is marked public and traffic runs both ways
 * (a teal private packet leaves blue, the reply comes back teal); 3 the
 * instance's public IP lights: without it the route alone reaches nothing.
 */
function GatewayScene({ k, lit }: { k: number; lit: number }) {
  const xlate = k >= 1
  const routed = k >= 2
  const litAttach = lit === 0
  const litX = lit === 1
  const litRoute = lit === 2
  const litIp = lit === 3
  const instanceStack = (on: boolean) => (
    <At x={T15.inst.cx} y={T15.inst.cy} cx cy>
      <InstanceStack size={T15.inst.size} lit={on} />
    </At>
  )
  const gw = T15S.igw
  const cloudIn: [number, number] = [T15.cloud.x + 6, T15_FLOW_Y]
  const routeTone = litRoute ? NET.lit : NET.gateway
  return (
    <>
      <At x={T15.region.x} y={T15.region.y}>
        <Boundary w={T15.region.w} h={T15.region.h} label="Region" radius={14} style={THIN}>
          <At x={T15.vpc.x - T15.region.x} y={T15.vpc.y - T15.region.y}>
            <Boundary w={T15.vpc.w} h={T15.vpc.h} label="VPC" solid tone={NET.public} labelTone="good" radius={12} lit={litAttach} style={{ borderWidth: 2 }}>
              <At x={T15.zoneA.x} y={T15.zoneA.y}>
                <Boundary w={T15.zoneA.w} h={T15.zoneA.h} label="Availability Zone A" labelTone="plain" radius={10} style={HAIR()}>
                  <At x={T15.subnet.x} y={T15.subnet.y}>
                    <SubnetBox w={T15.subnet.w} h={T15.subnet.h} kind="public" label="Public Subnet" lit={litRoute}>
                      {instanceStack(litIp)}
                    </SubnetBox>
                  </At>
                </Boundary>
              </At>
              <At x={T15.zoneB.x} y={T15.zoneB.y}>
                <Boundary w={T15.zoneB.w} h={T15.zoneB.h} label="Availability Zone B" labelTone="plain" radius={10} style={HAIR()}>
                  <At x={T15.subnet.x} y={T15.subnet.y}>
                    <SubnetBox w={T15.subnet.w} h={T15.subnet.h} kind="private" label="Private Subnet">
                      {instanceStack(false)}
                    </SubnetBox>
                  </At>
                </Boundary>
              </At>
              {/* the route: from the instances, right, then down into the gateway; a head at each end (traffic both ways) */}
              <Arrow x1={T15_IGW.cx - 48} y1={T15_INST_Y} x2={T15_INST_X} y2={T15_INST_Y} on={routed} tone={routeTone} />
              <Line x1={T15_IGW.cx - 48} y1={T15_INST_Y} x2={T15_IGW.cx - 48} y2={T15_INST_Y + 1} on={routed} tone={routeTone} />
              <Arrow x1={T15_IGW.cx - 48} y1={T15_INST_Y} x2={T15_IGW.cx - 48} y2={T15_IGW.cy - 2} on={routed} tone={routeTone} delay={200} />
              <Line x1={T15_IGW.cx - 48} y1={T15_IGW.cy} x2={T15_IGW.cx - IGW_R - 2} y2={T15_IGW.cy} on={routed} tone={routeTone} />
              {/* the Internet gateway on the VPC's right border */}
              <At x={T15_IGW.cx} y={T15_IGW.cy} cx cy>
                <Gateway kind="igw" lit={litAttach || litX} />
              </At>
            </Boundary>
          </At>
        </Boundary>
      </At>
      <At x={T15.vpc.x + T15_IGW.cx} y={T15_FLOW_Y + IGW_R + 22} cx cy>
        <Label size={14} strong tone={litAttach ? 'solid' : 'plain'} raised>
          Internet Gateway
        </Label>
      </At>
      <Ripple x={gw.x} y={gw.y} r={32} tone={NET.lit} on={litAttach} />
      {/* out to the internet, both ways */}
      <Arrow x1={gw.x + IGW_R + 2} y1={T15_FLOW_Y} x2={T15.cloud.x - 2} y2={T15_FLOW_Y} both tone={litRoute ? NET.lit : NET.gateway} />
      <At x={T15.cloud.x} y={T15.cloud.y - 24}>
        <span className={fx('lift', 0, 3.2).className} style={{ ...fx('lift', 0, 3.2).style, display: 'block' }}>
          <RichCloud w={T15.cloud.w} />
        </span>
      </At>
      <At x={T15.cloud.x + T15.cloud.w / 2} y={T15.cloud.y + 62} cx cy>
        <Label size={14} strong raised>
          Internet
        </Label>
      </At>
      {/* the instance's public IP: a tag badge on the stack, there from the start (a public IP alone is not enough) */}
      <Pin x={T15S.subnet.x + 88} y={T15S.subnet.y + 50} on ring={litIp ? NET.lit : colors.brand} size={26}>
        <TagIcon size={14} color={litIp ? NET.lit : colors.brand} />
      </Pin>
      {/* the one-to-one translation, at the gateway's upper right (clear of the VPC's border and of the internet arrow) */}
      <Pin x={gw.x + 28} y={gw.y - 30} on={xlate} ring={litX ? NET.lit : colors.brand} size={26}>
        <ArrowLeftRight size={14} color={litX ? NET.lit : colors.brand} />
      </Pin>
      {/* no route yet: an inbound packet is stopped where the route is missing */}
      <At x={T15S.elbowX} y={T15_FLOW_Y} cx cy>
        <NoMark size={24} on={!routed} />
      </At>
      <Mover k="blk" run={!routed} path={[cloudIn, [gw.x + IGW_R + 4, gw.y], [gw.x - IGW_R - 4, gw.y], [T15S.elbowX + 16, gw.y]]} tone={NET.blocked} dur={2} />
      {/* the route: the subnet is public, traffic both ways, translated at the gateway */}
      <Pin x={T15S.subnet.x + T15.subnet.w - 14} y={T15S.subnet.y + 17} on={routed} ring={colors.success} size={24}>
        <BadgeCheck size={15} color={colors.success} />
      </Pin>
      <Mover
        k="tr"
        run={routed}
        path={[[T15S.inst.x + 24, T15S.inst.y], [T15S.elbowX, T15S.inst.y], [T15S.elbowX, gw.y], [gw.x, gw.y], [cloudIn[0], gw.y]]}
        tones={[NET.private, NET.private, NET.private, colors.brand, colors.brand]}
        dur={2.6}
      />
      <Mover k="back" run={routed} path={[[cloudIn[0], gw.y + 2], [gw.x, gw.y + 2], [T15S.elbowX, gw.y + 2], [T15S.elbowX, T15S.inst.y + 2], [T15S.inst.x + 24, T15S.inst.y + 2]]} tones={[colors.brand, colors.brand, NET.private, NET.private, NET.private]} dur={2.6} delay={1.3} />
    </>
  )
}

export function InternetGateway({ lesson }: { lesson: string }) {
  const { k, lit } = useWalk(4)
  return (
    <LitFigure
      id="T15-1"
      kicker="Internet Gateway"
      title="Public Two-Way Access"
      lead={T15_LEAD}
      lesson={lesson}
      lit={lit}
      pointSize={16}
      figH={T15_H}
      pointsW={T15_PW}
      points={[
        { icon: <Cable />, text: T15_POINTS[0] },
        { icon: <ArrowRightLeft />, text: T15_POINTS[1] },
        { icon: <BadgeCheck />, text: T15_POINTS[2] },
        { icon: <TagIcon />, text: T15_POINTS[3] },
      ]}
      figure={<GatewayScene k={k} lit={lit} />}
    />
  )
}

/* ===== T16-1 · The NAT gateway */

const T16_LEAD = 'A private subnet still needs to download updates or call external services, but it must never accept an unsolicited inbound connection'
/* FS review (slide 36, BRIEF2 rule 1): the first point cut at the TR's own clause boundaries into three, every word kept, in order */
const T16_POINTS: ReactNode[] = [
  'A NAT (Network Address Translation) gateway, placed in a public subnet',
  'Lets private instances start outbound connections',
  'While blocking anything started from outside',
  'Deployed inside a public subnet so it can itself reach the internet gateway',
  <>
    Private subnet's route table sends <Mono>0.0.0.0/0</Mono> to the NAT gateway, not the internet gateway
  </>,
  "Translates many private source addresses to the gateway's own single public address",
  /* review 2026-11-05 (slide 40): the two cost pieces merged into one point, in the user's words */
  'Billed per hour plus per gigabyte processed, so an idle NAT gateway still costs money',
]

/* T16-1's own places: the NAT high in the public subnet so its lines run clear of the subnet's name, which sits at the foot on this card */
const N16 = { nat: { cx: 75, cy: 70 }, inst: { cx: 46, cy: 86 }, db: { cx: 106, cy: 86 }, tagY: G.pub.h - 8 } as const
const NAT_C = { x: G.pub.x + N16.nat.cx, y: G.pub.y + N16.nat.cy }
/* the NAT's line up to the gateway crosses the public subnet's top edge: the point on it, so the two segments meet there */
const UP = (() => {
  const dx = G.igw.cx - NAT_C.x
  const dy = G.igw.cy - NAT_C.y
  const l = Math.hypot(dx, dy)
  const ux = dx / l
  const uy = dy / l
  const from = { x: NAT_C.x + ux * (NAT_R + 2), y: NAT_C.y + uy * (NAT_R + 2) }
  const to = { x: G.igw.cx - ux * (IGW_R + 2), y: G.igw.cy - uy * (IGW_R + 2) }
  const cutX = NAT_C.x + dx * ((NAT_C.y - G.pub.y) / -dy)
  return { from, to, cut: { x: cutX, y: G.pub.y } }
})()
/*
  THE BLOCKED INBOUND PATH (review 2026-11-05, slides 39/40: "end the red inbound arrow at the NAT Gateway and place
  the ✖ on it"): Internet → internet gateway → NAT gateway, stopped AT the NAT. The first leg runs in from the cloud
  to the gateway's rim (no head); the second leaves the gateway's lower rim and runs parallel to the NAT's own line,
  OFF px to its left, its head landing on the ✖, which sits on the NAT disc's rim. An inbound connection from the
  internet cannot reach the private instances through the NAT.
*/
const IN = (() => {
  const OFF = 16
  const X = 11
  const dx = NAT_C.x - G.igw.cx
  const dy = NAT_C.y - G.igw.cy
  const l = Math.hypot(dx, dy)
  const d = { x: dx / l, y: dy / l }
  const L = { x: -d.y, y: d.x }
  const s0 = Math.sqrt(IGW_R * IGW_R - OFF * OFF) + 3
  const start = { x: G.igw.cx + L.x * OFF + d.x * s0, y: G.igw.cy + L.y * OFF + d.y * s0 }
  const r0 = Math.sqrt(NAT_R * NAT_R - OFF * OFF)
  const mark = { x: NAT_C.x + L.x * OFF - d.x * r0, y: NAT_C.y + L.y * OFF - d.y * r0 }
  const end = { x: mark.x - d.x * (X + 2), y: mark.y - d.y * (X + 2) }
  const t = (G.pub.y - start.y) / d.y
  const cut = { x: start.x + d.x * t, y: G.pub.y }
  const y0 = G.igw.cy - 16
  const rimX = G.igw.cx + Math.sqrt(IGW_R * IGW_R - 16 * 16) + 2
  return { start, end, cut, mark, size: X * 2, y0, rimX }
})()
const COST_Y = G.rtPub.y + G.rtPub.h / 2
/* the private subnet's route entry and the translation, in the column right of the VPC */
/** T16-1 (FS review, slide 36: too much empty stage): a wider points column, a 566px stage the drawing fills, centred */
const T16_A_PW = 560
const T16_A_DX = 54
/* T16-1b (FS review rule 8: every point in two lines): points 460 wide, the stage 626; the drawing 15px left, the column at 518 so its chips clear the VPC by 6px */
const COL_CX_B = 518
const T16_B_PW = 460
const T16_B_DX = -15
const ENTRY = { title: 156, dest: 194, target: 238 } as const
const XLATE = { from: 290, to: 334 } as const

/** A subnet's name as its own chip, where this card puts it (the foot of the box). */
function SubnetTag({ kind, children }: { kind: 'public' | 'private'; children: ReactNode }) {
  return (
    <span className="inline-flex whitespace-nowrap rounded-pill px-2 py-[2px] font-heading text-[14px] font-semibold leading-tight" style={{ color: colors.white, background: kind === 'public' ? NET.public : NET.private }}>
      {children}
    </span>
  )
}

/** A route entry's value as a chip: monospace, ligatures off (content rule 40). */
function MonoTag({ children, lit = false }: { children: ReactNode; lit?: boolean }) {
  return (
    <Label mono strong size={14} tone={lit ? 'solid' : 'brand'} raised style={{ fontVariantLigatures: 'none' }}>
      {children}
    </Label>
  )
}

/**
 * T16-1, split in two (user, 2026-10-30, G6). Part 0: 0 the NAT lands in the
 * public subnet (a ripple); 1 its line up to the internet gateway draws and
 * traffic leaves by it. Part 1: 0 the private subnet's route entry and its
 * line to the NAT; 1 many private packets merge into one public one, an
 * inbound arrow is stopped; 2 the two cost tags, a coin dropping on each.
 */
function NatScene({ part, k, lit }: { part: 0 | 1; k: number; lit: number }) {
  const held = useHeld()
  const nat = true
  /*
    THE NAT FLOW (5.md, slides 38/39: verify the one-way dot). A NAT gateway lets a private instance START a connection
    outward, and the replies to that connection come back through it (it keeps the translation); a connection started
    from outside is dropped. So the packet makes a round trip, out then back, teal (private address) until the NAT,
    green (the NAT's public address) beyond it, and teal again on the way in; the arrows keep one head, the direction
    a connection may be STARTED (the TR's table: NAT "Outbound only"); the red arrow is the one started outside.
  */
  const OUT_A: [number, number] = [G.pri.x + N16.inst.cx - 24, G.pri.y + N16.inst.cy]
  const OUT_B: [number, number] = [NAT_C.x + NAT_R + 4, NAT_C.y + 8]
  const OUT_C: [number, number] = [NAT_C.x + 16, NAT_C.y - 22]
  const OUT_D: [number, number] = [G.igw.cx + 4, G.igw.cy + IGW_R + 2]
  const OUT_E: [number, number] = [G.igw.cx + IGW_R + 2, G.igw.cy - 6]
  const OUT_F: [number, number] = [G.cloud.x + 40, G.cloud.y + 52]
  /* part 0 (T16-1): 0 the NAT lands; 1 a private instance's packet goes out through it; 2 an inbound arrow is stopped; 3 its own line up to the internet gateway */
  const joined = part === 1 || k >= 3
  const outbound = part === 0 && k >= 1
  const routed = part === 1 && k >= 0
  const xlate = part === 1 && k >= 1
  const blocked = part === 1 ? xlate : k >= 2
  const cost = part === 1 && k >= 2
  const litNat = part === 0 && lit === 0
  const litOut = part === 0 && lit === 1
  const litBlock = (part === 0 && lit === 2) || (part === 1 && lit === 1)
  const litJoin = part === 0 && lit === 3
  const litRoute = part === 1 && lit === 0
  const litX = part === 1 && lit === 1
  const litCost = part === 1 && lit === 2
  /* the private subnet's arrow to the NAT (review 2026-11-05, slide 39: T16-1 had none): with the outbound packet on T16-1, with the route entry on T16-1b */
  const priLine = part === 1 ? routed : outbound
  const litPri = litRoute || litOut
  const pubRel = (p: { x: number; y: number }) => ({ x: p.x - G.pub.x, y: p.y - G.pub.y })
  const vpcRel = (p: { x: number; y: number }) => ({ x: p.x - G.vpc.x, y: p.y - G.vpc.y })
  const upIn = { a: pubRel(UP.from), b: pubRel(UP.cut) }
  const upOut = { a: vpcRel(UP.cut), b: vpcRel(UP.to) }
  const natY = N16.nat.cy
  const COL_CX = part === 0 ? 300 : COL_CX_B
  return (
    <div className="absolute" style={{ left: part === 0 ? T16_A_DX : T16_B_DX, top: part === 0 ? 20 : 0, width: 0, height: 0, transition: 'none' }}>
      {/* the internet, outside the VPC at the top right */}
      <At x={G.cloud.x} y={G.cloud.y} w={G.cloud.w}>
        <div className="grid place-items-center" style={{ height: G.cloud.h }}>
          <span className={fx('lift', 0, 3.2).className} style={{ ...fx('lift', 0, 3.2).style, display: 'block' }}>
            <InternetCloud w={100} label="Internet" />
          </span>
        </div>
      </At>
      {/* the blocked inbound path, first leg: from the internet into the gateway's rim (its head is at the NAT) */}
      <Line x1={G.cloud.x + 6} y1={IN.y0} x2={IN.rimX} y2={IN.y0} on={blocked} tone={NET.blocked} />
      <At x={G.vpc.x} y={G.vpc.y}>
        <Boundary w={G.vpc.w} h={part === 0 ? 228 : G.vpc.h} label="VPC" style={THIN}>
          <At x={M.pub.x} y={M.pub.y}>
            <SubnetBox w={M.pub.w} h={M.pub.h} kind="public">
              <At x={N16.nat.cx} y={N16.nat.cy + GW_LABEL_HALF} cx cy>
                <Fade on={nat} lift={6}>
                  <Gateway kind="nat" size={NAT_R * 2} lit={litNat || litX} label="NAT Gateway" />
                </Fade>
              </At>
              {/* up to the internet gateway, the part inside this subnet */}
              <Line x1={upIn.a.x} y1={upIn.a.y} x2={upIn.b.x} y2={upIn.b.y} on={joined} tone={litJoin ? NET.lit : NET.public} />
              {/* the private subnet's line, the part inside this subnet, ending at the NAT's rim */}
              <Arrow x1={M.pub.w - 2} y1={natY} x2={N16.nat.cx + NAT_R + 2} y2={natY} on={priLine} tone={litPri ? NET.lit : NET.private} />
              {/* the blocked inbound path, last leg inside this subnet: its head lands on the ✖ on the NAT's rim */}
              <Arrow x1={IN.cut.x - G.pub.x} y1={0} x2={IN.end.x - G.pub.x} y2={IN.end.y - G.pub.y} on={blocked} tone={NET.blocked} />
              <At x={IN.mark.x - G.pub.x} y={IN.mark.y - G.pub.y} cx cy style={{ zIndex: 6 }}>
                <span className={litBlock ? fx('shake', 0, 1.4).className : undefined} style={{ ...(litBlock ? fx('shake', 0, 1.4).style : {}), display: 'block' }}>
                  <NoMark size={IN.size} on={blocked} />
                </span>
              </At>
              <At x={8} y={N16.tagY} style={{ transform: 'translateY(-100%)' }}>
                <SubnetTag kind="public">Public Subnet</SubnetTag>
              </At>
            </SubnetBox>
          </At>
          <At x={M.pri.x} y={M.pri.y}>
            <SubnetBox w={M.pri.w} h={M.pri.h} kind="private">
              <At x={N16.inst.cx} y={N16.inst.cy} cx cy>
                <Resource size={44} lit={litRoute || litOut} />
              </At>
              <At x={N16.db.cx} y={N16.db.cy} cx cy>
                <Resource size={40} kind="database" />
              </At>
              <At x={8} y={N16.tagY} style={{ transform: 'translateY(-100%)' }}>
                <SubnetTag kind="private">Private Subnet</SubnetTag>
              </At>
            </SubnetBox>
          </At>
          {/* the private subnet's line to the NAT, the part between the subnets */}
          <Line x1={M.pri.x - 2} y1={M.pub.y + natY} x2={M.pub.x + M.pub.w + 2} y2={M.pub.y + natY} on={priLine} tone={litPri ? NET.lit : NET.private} />
          {/* up to the internet gateway, the part above the subnet */}
          <Arrow x1={upOut.a.x} y1={upOut.a.y - 2} x2={upOut.b.x} y2={upOut.b.y} on={joined} tone={litJoin ? NET.lit : NET.public} />
          {/* the blocked inbound path, second leg: out of the gateway's lower rim, down to the public subnet's edge */}
          <Line x1={IN.start.x - G.vpc.x} y1={IN.start.y - G.vpc.y} x2={IN.cut.x - G.vpc.x} y2={IN.cut.y - G.vpc.y} on={blocked} tone={NET.blocked} />
          {/* the internet gateway, from the previous card */}
          <At x={M.igw.cx} y={M.igw.cy} cx cy>
            <Gateway kind="igw" lit={litJoin} />
          </At>
          <At x={M.igw.cx} y={M.igw.cy - 42} cx cy>
            <Label size={14} strong raised>
              Internet Gateway
            </Label>
          </At>
          {/* the two cost drivers, under the subnets */}
          <At x={M.pub.x} y={COST_Y - G.vpc.y} cy>
            <Fade on={cost} lift={6}>
              <Tag lit={litCost} tone="warn" icon={<Clock className={litCost ? fx('spin', 0, 4).className : undefined} style={litCost ? fx('spin', 0, 4).style : undefined} />}>
                Per Hour Running
              </Tag>
            </Fade>
          </At>
          <At x={M.pub.x + 166} y={COST_Y - G.vpc.y} cy>
            <Fade on={cost} lift={6} delay={120}>
              <Tag lit={litCost} tone="warn" icon={<HardDrive />}>
                Per Gigabyte Processed
              </Tag>
            </Fade>
          </At>
        </Boundary>
      </At>
      {/* a coin dropping onto each cost tag: it costs while it runs, and per gigabyte */}
      {cost && !held &&
        [G.pub.x + 60, G.pub.x + 260].map((x, i) => (
          <At key={i} x={x} y={COST_Y - 38} cx cy>
            <span className={'rt-coin'} style={{ animationDelay: `${i * 0.5}s`, display: 'grid', color: colors.warning }}>
              <Coins size={18} />
            </span>
          </At>
        ))}
      <Ripple x={NAT_C.x} y={NAT_C.y} r={28} tone={NET.lit} on={litNat} />
      {/* a packet started outside: in through the internet gateway, stopped at the NAT */}
      <Mover k="nat-in" run={blocked} path={[[G.cloud.x + 6, IN.y0], [IN.rimX, IN.y0], [IN.start.x, IN.start.y], [IN.end.x, IN.end.y]]} tone={NET.blocked} size={12} dur={2.4} />
      {/* part 0: a private instance's packet leaves through the NAT, up through the internet gateway, out (teal inside, green once translated) */}
      <Mover
        k="nat-out"
        run={outbound || xlate}
        path={[OUT_A, OUT_B, OUT_C, OUT_D, OUT_E, OUT_F, OUT_E, OUT_D, OUT_C, OUT_B, OUT_A]}
        tones={[NET.private, NET.private, NET.public, NET.public, NET.public, NET.public, NET.public, NET.public, NET.public, NET.private, NET.private]}
        dur={5.2}
      />
      {/* the many private addresses enter the gateway; one public address leaves it */}
      {[1.4, 1.9, 2.4].map((dur, i) => (
        <Traveller key={i} path={[[G.pri.x + 8, G.pub.y + natY], [NAT_C.x + NAT_R + 6, G.pub.y + natY]]} run={xlate && !held} k={`in${i}`} tone={NET.private} size={12} dur={dur} />
      ))}
      {/* the private subnet's route entry, in the column beside the VPC: the destination, pointed at the NAT gateway's id */}
      <At x={COL_CX} y={ENTRY.title} cx cy>
        <Fade on={routed} lift={6}>
          <Label size={14} strong tone={litRoute ? 'solid' : 'dark'} raised>
            Private Subnet's Route Table
          </Label>
        </Fade>
      </At>
      <At x={COL_CX} y={ENTRY.dest} cx cy>
        <Fade on={routed} lift={6} delay={100}>
          <MonoTag lit={litRoute}>0.0.0.0/0</MonoTag>
        </Fade>
      </At>
      <Arrow x1={COL_CX} y1={ENTRY.dest + 14} x2={COL_CX} y2={ENTRY.target - 14} on={routed} delay={200} tone={litRoute ? NET.lit : colors.brand} />
      <At x={COL_CX} y={ENTRY.target} cx cy>
        <Fade on={routed} lift={6} delay={200}>
          <MonoTag lit={litRoute}>nat-gateway-id</MonoTag>
        </Fade>
      </At>
      {/* the translation, many to one */}
      <At x={COL_CX} y={XLATE.from} cx cy>
        <Fade on={xlate} lift={6}>
          <Tag lit={litX}>Many Private Source Addresses</Tag>
        </Fade>
      </At>
      <Arrow x1={COL_CX} y1={XLATE.from + 14} x2={COL_CX} y2={XLATE.to - 14} on={xlate} tone={litX ? NET.lit : colors.brand} />
      <At x={COL_CX} y={XLATE.to} cx cy>
        <Fade on={xlate} lift={6} delay={120}>
          <Tag lit={litX}>Single Public Address</Tag>
        </Fade>
      </At>
    </div>
  )
}

export function NatGateway({ lesson }: { lesson: string }) {
  const { k, lit } = useWalk(4)
  return (
    <LitFigure
      id="T16-1"
      kicker="NAT Gateway"
      title="Outbound-Only Access"
      lead={T16_LEAD}
      lesson={lesson}
      lit={lit}
      pointSize={16}
      pointsW={T16_A_PW}
      figH={380}
      points={[
        { icon: <ArrowLeftRight />, text: T16_POINTS[0] },
        { icon: <LogOut />, text: T16_POINTS[1] },
        { icon: <Ban />, text: T16_POINTS[2] },
        { icon: <Network />, text: T16_POINTS[3] },
      ]}
      figure={<NatScene part={0} k={k} lit={lit} />}
    />
  )
}

export function NatGateway2({ lesson }: { lesson: string }) {
  const { k, lit } = useWalk(3)
  return (
    <LitFigure
      id="T16-1b"
      kicker="NAT Gateway"
      title="Outbound-Only Access"
      lesson={lesson}
      lit={lit}
      pointSize={16}
      pointsW={T16_B_PW}
      figH={380}
      points={[
        { icon: <Table2 />, text: T16_POINTS[4] },
        { icon: <Merge />, text: T16_POINTS[5] },
        { icon: <Coins />, text: T16_POINTS[6] },
      ]}
      figure={<NatScene part={1} k={k} lit={lit} />}
    />
  )
}

/* ===== T17-1 · VPC peering */

const T17_LEAD = "Two VPCs that need to exchange data privately, without the traffic ever touching the public internet, connect through VPC peering, a one-to-one networking connection between two VPCs' private address spaces"
const T17_POINTS: ReactNode[] = [
  "Each side still adds its own route table entries pointing the peer's CIDR block at the peering connection",
  'Works between VPCs in the same account or across accounts, same region or across regions',
  'Non-transitive: a peering connection does not extend automatically to a third VPC',
  'Overlapping CIDR blocks between the two VPCs cannot be peered',
  'No hourly charge, only data-transfer fees, usually cheaper than routing through NAT and the internet',
]

/* the 634 x 340 stage: two VPCs on one dashed line, the third VPC under the right one, the crossed CIDRs under the left one */
const P = {
  a: { x: 10, y: 60, w: 180, h: 150 },
  b: { x: 396, y: 60, w: 180, h: 150 },
  c: { x: 396, y: 248, w: 180, h: 72 },
  lineY: 135,
  mid: 293,
} as const
const P_A_R = P.a.x + P.a.w
/** FS review (slides 39 to 41): the points column 500 wide so every point keeps to two lines; the stage 586 */
const T17_PW = 500
/** T17-1b's overlapping ranges: centred under the first VPC's side, between it and the third VPC */
const CIDR = { cx: 166, y: 262 }
/** T17-1b's faded NAT-and-internet route with its coins, between the two VPCs' feet */
const NAT_ROUTE = { x: 202, y: 222 }

/** One VPC's route entry, without a full table: the route table chip, the peer's CIDR block, pointed at the peering connection id. */
function PeerEntry({ on, lit }: { on: boolean; lit: boolean }) {
  return (
    <>
      {/* the VPC's own instance, top right; its route entry under the chip: the peer's range, pointed at the peering connection */}
      <At x={154} y={34} cx cy>
        <Resource size={28} />
      </At>
      <At x={74} y={34} cx cy>
        <Fade on={on} lift={6}>
          <RouteChip lit={lit} label="Route Table" />
        </Fade>
      </At>
      <At x={90} y={76} cx cy>
        <Fade on={on} lift={6} delay={100}>
          <Tag lit={lit} tone="brand" icon={<Network />}>
            Peer's CIDR Block
          </Tag>
        </Fade>
      </At>
      <Arrow x1={90} y1={90} x2={90} y2={107} on={on} delay={200} tone={lit ? NET.lit : colors.brand} />
      <At x={90} y={122} cx cy>
        <Fade on={on} lift={6} delay={200}>
          <Tag lit={lit} tone="brand">
            Peering Connection ID
          </Tag>
        </Fade>
      </At>
    </>
  )
}

/**
 * T17-1, split in two (user, 2026-10-30, G6). Part 0: 0 each side's route
 * entry, packets crossing the peering line both ways; 1 the account and region
 * tags. Part 1: 0 a third VPC joined to one side, a packet from the far side
 * stopped there (non-transitive); 1 two overlapping CIDR blocks crossed out;
 * 2 the data-transfer tag on the line, a coin on it.
 */
function PeeringScene({ part, k, lit }: { part: 0 | 1; k: number; lit: number }) {
  const now = (p: 0 | 1, i: number) => part === p && lit === i
  const entries = true
  const scope = part === 0 && k >= 1
  const third = part === 1 && k >= 0
  const overlap = part === 1 && k >= 1
  const cost = part === 1 && k >= 2
  const a: [number, number] = [P_A_R + 14, P.lineY]
  const b: [number, number] = [P.b.x - 14, P.lineY]
  const cTop = P.c.y - 2
  return (
    <>
      <At x={P.a.x} y={P.a.y}>
        <Boundary w={P.a.w} h={P.a.h} label="VPC" style={THIN}>
          <PeerEntry on={entries} lit={now(0, 0)} />
        </Boundary>
      </At>
      <At x={P.b.x} y={P.b.y}>
        <Boundary w={P.b.w} h={P.b.h} label="VPC" style={THIN} tone={PEER}>
          <PeerEntry on={entries} lit={now(0, 0)} />
        </Boundary>
      </At>
      {/* the peering connection: one solid line (FS review: fewer dotted lines), heads at both VPCs */}
      <Arrow x1={P_A_R + 2} y1={P.lineY} x2={P.b.x - 2} y2={P.lineY} both tone={PEER} width={2} />
      <At x={P.mid} y={P.lineY - 29} cx cy>
        <Tag icon={<Waypoints />}>Peering Connection</Tag>
      </At>
      {/* 5.md slides 41/42 (more explaining icons): the public internet, struck out, over the link (the lead: "without the traffic
          ever touching the public internet") */}
      <At x={P.mid} y={44} cx cy>
        <span className="relative block" style={{ width: 44, height: 44 }}>
          <span className="grid h-[44px] w-[44px] place-items-center rounded-full" style={{ background: colors.surface, boxShadow: `inset 0 0 0 1.5px ${colors.line}`, color: colors.muted }}>
            <Globe size={24} strokeWidth={1.8} />
          </span>
          <span className="absolute" style={{ right: -6, bottom: -4 }}>
            <NoMark size={20} />
          </span>
        </span>
      </At>
      <Mover k="ab" run path={[a, b]} tone={PEER} dur={1.8} />
      <Mover k="ba" run path={[b, a]} tone={colors.brand} dur={1.8} delay={1} />
      {/* same or across: an account badge and a region pin under each VPC, in its own colour (two accounts, two regions) */}
      {[{ x: P.a.x + P.a.w / 2, tone: colors.brand }, { x: P.b.x + P.b.w / 2, tone: PEER }].map((v, i) => (
        <Fragment key={i}>
          <Pin x={v.x - 22} y={P.a.y + P.a.h + 26} on={scope} ring={now(0, 1) ? NET.lit : v.tone} size={30}>
            <Users size={15} color={v.tone} />
          </Pin>
          <Pin x={v.x + 22} y={P.a.y + P.a.h + 26} on={scope} ring={now(0, 1) ? NET.lit : v.tone} size={30}>
            <MapPin size={15} color={v.tone} />
          </Pin>
        </Fragment>
      ))}
      {/* same or across: account, region */}
      <At x={P.mid} y={250} cx cy>
        <Fade on={scope} lift={6}>
          <Tag lit={now(0, 1)} icon={<Users />}>Same Account or Across Accounts</Tag>
        </Fade>
      </At>
      <At x={P.mid} y={290} cx cy>
        <Fade on={scope} lift={6} delay={120}>
          <Tag lit={now(0, 1)} icon={<MapPin />}>Same Region or Across Regions</Tag>
        </Fade>
      </At>
      {/* a third VPC, joined to one side only */}
      <At x={P.c.x} y={P.c.y}>
        <Fade on={third} lift={0}>
          <Boundary w={P.c.w} h={P.c.h} label="VPC" lit={now(1, 0)} style={THIN} tone={colors.muted}>
            <At x={90} y={40} cx cy>
              <Tag lit={now(1, 0)} icon={<Link2Off />}>Non-Transitive</Tag>
            </At>
          </Boundary>
        </Fade>
      </At>
      <Arrow x1={P.b.x + P.b.w / 2} y1={P.b.y + P.b.h + 2} x2={P.c.x + P.c.w / 2} y2={cTop} on={third} both width={2} tone={now(1, 0) ? NET.lit : PEER} />
      {/* a packet from the first VPC rides to the second, and is stopped before the third */}
      <At x={P.b.x + P.b.w / 2 + 22} y={(P.b.y + P.b.h + cTop) / 2} cx cy>
        <span className={now(1, 0) ? fx('shake', 0, 1.4).className : undefined} style={{ ...(now(1, 0) ? fx('shake', 0, 1.4).style : {}), display: 'block' }}>
          <NoMark size={22} on={third} />
        </span>
      </At>
      <Mover k="tr" run={third && now(1, 0)} path={[a, b, [P.b.x + P.b.w / 2 - 30, P.lineY], [P.b.x + P.b.w / 2 - 30, P.b.y + P.b.h + 16]]} tone={NET.blocked} dur={2.4} />
      {/* two overlapping CIDR blocks (FS review, slide 40): one chip per VPC in its colour, centred on one row, the two ranges
          drawn as overlapping circles between them, the shared part red and crossed; the words under */}
      <At x={CIDR.cx - 92} y={CIDR.y} cx cy>
        <Fade on={overlap} lift={6}>
          <span className={now(1, 1) ? fx('shake', 0, 1.6).className : undefined} style={{ ...(now(1, 1) ? fx('shake', 0, 1.6).style : {}), display: 'block' }}>
            <Tag lit={now(1, 1)} tone="brand">
              CIDR Block
            </Tag>
          </span>
        </Fade>
      </At>
      <At x={CIDR.cx} y={CIDR.y} cx cy>
        <Fade on={overlap} lift={6} delay={100}>
          <svg width={70} height={42} viewBox="0 0 70 42" aria-hidden style={{ display: 'block' }}>
            <defs>
              <clipPath id="rt-cidr-a">
                <circle cx={26} cy={21} r={18} />
              </clipPath>
            </defs>
            <circle cx={26} cy={21} r={18} fill={`${colors.brand}22`} stroke={colors.brand} strokeWidth={1.5} />
            <circle cx={44} cy={21} r={18} fill={`${PEER}22`} stroke={PEER} strokeWidth={1.5} />
            <circle cx={44} cy={21} r={18} fill={`${NET.blocked}66`} clipPath="url(#rt-cidr-a)" />
          </svg>
        </Fade>
      </At>
      <At x={CIDR.cx} y={CIDR.y} cx cy>
        <NoMark size={18} on={overlap} />
      </At>
      <At x={CIDR.cx + 92} y={CIDR.y} cx cy>
        <Fade on={overlap} lift={6} delay={100}>
          <span className={now(1, 1) ? fx('shake', 0.2, 1.6).className : undefined} style={{ ...(now(1, 1) ? fx('shake', 0.2, 1.6).style : {}), display: 'block' }}>
            <Label size={14} strong tone={now(1, 1) ? 'solid' : 'brand'} raised style={{ boxShadow: `inset 0 0 0 1.5px ${PEER}`, color: now(1, 1) ? undefined : PEER }}>
              CIDR Block
            </Label>
          </span>
        </Fade>
      </At>
      <At x={CIDR.cx} y={CIDR.y + 50} cx cy>
        <Fade on={overlap} lift={6} delay={200}>
          <Tag lit={now(1, 1)} icon={<Ban />}>Overlapping CIDR Blocks</Tag>
        </Fade>
      </At>
      {/* the cost, on the line */}
      <At x={P.mid} y={P.lineY + 29} cx cy>
        <Fade on={cost} lift={6}>
          <Tag lit={now(1, 2)} tone="warn">
            Data-Transfer Charges
          </Tag>
        </Fade>
      </At>
      {/* far cheaper than NAT and the internet: that route drawn faded beside it, NAT gateway to internet, with a coin stack */}
      <At x={NAT_ROUTE.x} y={NAT_ROUTE.y} cy>
        <Fade on={cost} lift={6} delay={150}>
          <span className="flex items-center gap-1.5" style={{ opacity: 0.75 }}>
            <Gateway kind="nat" size={30} dim />
            <span aria-hidden className="block h-[2px] w-[16px]" style={{ background: colors.muted }} />
            <span className="block" style={{ opacity: 0.6 }}>
              <RichCloud w={46} />
            </span>
            <span aria-hidden className="grid place-items-center rounded-full" style={{ width: 30, height: 30, background: '#FFF4E0', boxShadow: `inset 0 0 0 1.5px ${colors.warning}`, color: '#9A5B00' }}>
              <Coins size={16} className={fx('hop', 0, 1.6).className} style={fx('hop', 0, 1.6).style} />
            </span>
            <span aria-hidden className="grid place-items-center rounded-full" style={{ width: 30, height: 30, background: '#FFF4E0', boxShadow: `inset 0 0 0 1.5px ${colors.warning}`, color: '#9A5B00' }}>
              <Coins size={16} className={fx('hop', 0.4, 1.6).className} style={fx('hop', 0.4, 1.6).style} />
            </span>
          </span>
        </Fade>
      </At>
    </>
  )
}

export function Peering({ lesson }: { lesson: string }) {
  const { k, lit } = useWalk(2)
  return (
    <LitFigure
      id="T17-1"
      kicker="VPC Peering"
      title="Direct Network Link"
      lead={T17_LEAD}
      lesson={lesson}
      lit={lit}
      pointSize={16}
      pointsW={T17_PW}
      figH={340}
      points={[
        { icon: <Table2 />, text: T17_POINTS[0] },
        { icon: <Building2 />, text: T17_POINTS[1] },
      ]}
      figure={<PeeringScene part={0} k={k} lit={lit} />}
    />
  )
}

export function Peering2({ lesson }: { lesson: string }) {
  const { k, lit } = useWalk(3)
  return (
    <LitFigure
      id="T17-1b"
      kicker="VPC Peering"
      title="Direct Network Link"
      lesson={lesson}
      lit={lit}
      pointSize={16}
      pointsW={T17_PW}
      figH={340}
      points={[
        { icon: <Link2Off />, text: T17_POINTS[2] },
        { icon: <Ban />, text: T17_POINTS[3] },
        { icon: <Coins />, text: T17_POINTS[4] },
      ]}
      figure={<PeeringScene part={1} k={k} lit={lit} />}
    />
  )
}

/* ===== T17-2 · Site-to-Site VPN */

const T172_POINTS: ReactNode[] = [
  'A Site-to-Site VPN connects a VPC to an on-premises network instead of another VPC',
  /* FS review (slide 41, BRIEF2 rule 1): cut at the TR's clause boundary, every word kept */
  'Encrypted over the public internet using IPsec',
  'Anchored by a virtual private gateway on the AWS side and a customer gateway on the on-premises side',
]

/*
  The 586 x 340 stage: the VPC on the left, the on-premises office on the right, the public internet between, one
  tunnel across it. Review 2026-11-05 (slide 44): each gateway's name sits right under its own disc, in one row under
  the tunnel, clear of the IPsec chip above it and of each other. To make room, the VPC box ends just under its disc,
  the office stands 40px higher (its gateway disc on the ground floor's left edge) and its name moves over its roof.
  `dy` centres the whole drawing on the stage.
*/
const V = {
  vpc: { x: 16, y: 96, w: 194, h: 120 },
  bld: { x: 420, y: 36, w: 140 },
  cloud: { cx: 318, cy: 150, w: 140 },
  tunnelY: 176,
  ipsecY: 208,
  gwY: 240,
  dy: 40,
} as const
const V_VPC_R = V.vpc.x + V.vpc.w

/**
 * T17-2: 0 the VPC and the office, a tunnel draws across the public internet
 * and packets ride it; 1 the lock labelled IPsec closes on the tunnel, the two
 * gateways land at its ends, and every packet in it carries a padlock.
 */
function VpnScene({ k, lit }: { k: number; lit: number }) {
  /* 0 the tunnel; 1 IPsec: the lock closes on it, every packet in it carries a padlock; 2 the two gateways at its ends */
  const tunnel = k >= 0
  const sealed = k >= 1
  const anchored = k >= 2
  const l0 = lit === 0
  const l1 = lit === 1
  const l2 = lit === 2
  const a: [number, number] = [V_VPC_R + 26, V.tunnelY]
  const b: [number, number] = [V.bld.x - 26, V.tunnelY]
  return (
    <div className="absolute" style={{ left: 0, top: V.dy, width: 0, height: 0 }}>
      <At x={V.vpc.x} y={V.vpc.y}>
        <Boundary w={V.vpc.w} h={V.vpc.h} label="VPC" lit={l0} style={THIN}>
          {/* review 2026-11-05 (global rule 2): the aws mark carries the name, so the chip beside it drops "AWS" */}
          <div className="absolute" style={{ right: 12, top: -13 }}>
            <Label size={14} strong raised icon={<Logo name="aws" h={14} />}>
              Side
            </Label>
          </div>
          <At x={V.vpc.w / 2 - 34} y={V.vpc.h / 2 + 12} cx cy>
            <Resource size={46} />
          </At>
          <At x={V.vpc.w / 2 + 30} y={V.vpc.h / 2 + 12} cx cy>
            <Resource size={46} kind="database" />
          </At>
        </Boundary>
      </At>
      <At x={V.cloud.cx} y={V.cloud.cy - 78} cx cy>
        <Label size={14} strong raised icon={<Globe />}>
          Public Internet
        </Label>
      </At>
      <At x={V.cloud.cx} y={V.cloud.cy} cx cy>
        <span className={fx('lift', 0, 3.4).className} style={{ ...fx('lift', 0, 3.4).style, display: 'block', opacity: 0.85 }}>
          <RichCloud w={V.cloud.w} />
        </span>
      </At>
      <At x={V.bld.x} y={V.bld.y}>
        <OnPremOffice w={V.bld.w} lit={l0} />
      </At>
      <At x={V.bld.x + V.bld.w / 2 - 22} y={V.bld.y - 22} cx cy>
        <Tag lit={l0} icon={<Building2 />}>On-Premises Network</Tag>
      </At>
      {/* the tunnel: a wide sleeve across the internet, the flow inside it */}
      <Line x1={a[0]} y1={V.tunnelY} x2={b[0]} y2={V.tunnelY} width={16} tone={`${colors.brand}30`} on={tunnel} />
      <Arrow x1={a[0]} y1={V.tunnelY} x2={b[0]} y2={V.tunnelY} on={tunnel} dashed both tone={l0 ? NET.lit : colors.brand} />
      <Mover k="t1" run={tunnel} path={[a, b]} size={sealed ? 20 : 14} tone={sealed ? colors.brandDark : colors.brand} glyph={sealed ? <LockKeyhole size={11} strokeWidth={2.6} /> : undefined} dur={2.2} />
      <Mover k="t2" run={tunnel} path={[b, a]} size={sealed ? 20 : 14} tone={sealed ? colors.brandDark : colors.brand} glyph={sealed ? <LockKeyhole size={11} strokeWidth={2.6} /> : undefined} dur={2.2} delay={1.1} />
      {/* the lock on the tunnel, labelled IPsec */}
      <At x={V.cloud.cx} y={V.tunnelY} cx cy>
        <Fade on={sealed} lift={0}>
          <span className={l1 ? fx('shackle', 0, 2.6).className : undefined} style={{ ...(l1 ? fx('shackle', 0, 2.6).style : {}), display: 'block' }}>
            <LockBadge size={34} lit={l1} />
          </span>
        </Fade>
      </At>
      <At x={V.cloud.cx} y={V.ipsecY} cx cy>
        <Fade on={sealed} lift={6}>
          <Tag lit={l1}>IPsec</Tag>
        </Fade>
      </At>
      {/* the gateway at each end */}
      <At x={V_VPC_R} y={V.tunnelY} cx cy>
        <Fade on={anchored} lift={0}>
          <Gateway kind="vgw" lit={l2} />
        </Fade>
      </At>
      <Ripple x={V_VPC_R} y={V.tunnelY} r={30} tone={NET.lit} on={l2} />
      <At x={V_VPC_R} y={V.gwY} cx cy>
        <Fade on={anchored} lift={6}>
          <Tag lit={l2} icon={<Waypoints />}>Virtual Private Gateway</Tag>
        </Fade>
      </At>
      <At x={V.bld.x} y={V.tunnelY} cx cy>
        <Fade on={anchored} lift={0} delay={120}>
          <Gateway kind="cgw" lit={l2} />
        </Fade>
      </At>
      <Ripple x={V.bld.x} y={V.tunnelY} r={30} tone={NET.lit} on={l2} />
      <At x={V.bld.x} y={V.gwY} cx cy>
        <Fade on={anchored} lift={6} delay={120}>
          <Tag lit={l2} icon={<Building2 />}>Customer Gateway</Tag>
        </Fade>
      </At>
    </div>
  )
}

export function SiteToSiteVpn({ lesson }: { lesson: string }) {
  const { k, lit } = useWalk(3)
  return (
    <LitFigure
      id="T17-2"
      kicker="VPC Peering"
      title="Direct Network Link"
      lesson={lesson}
      lit={lit}
      pointSize={16}
      pointsW={T17_PW}
      figH={340}
      points={[
        { icon: <Building2 />, text: T172_POINTS[0] },
        { icon: <LockKeyhole />, text: T172_POINTS[1] },
        { icon: <Waypoints />, text: T172_POINTS[2] },
      ]}
      figure={<VpnScene k={k} lit={lit} />}
    />
  )
}

/* ===== T18-1 · Four routing options compared */

const T18_LEAD = 'Route tables decide where traffic goes, while each remaining piece answers the same question differently: reach the public internet, go out only, reach another VPC directly, or reach an on-premises network'
const T18_ROWS: [string, string, string][] = [
  ['Internet Gateway', 'Two-way, public', 'No hourly charge, only data transfer'],
  ['NAT Gateway', 'Outbound only', 'Hourly charge plus data processed'],
  ['VPC Peering', 'Two-way, VPC-to-VPC', 'Data transfer only, no hourly charge'],
  ['VPN (Site-to-Site)', 'Two-way, to on-premises', 'Hourly charge per connection, plus standard data-transfer rates'],
]
/** The one highlighted cell (the TR's guidance): a ring on the cell's own words, nothing wider (content rule 43), in the template's orange. */
const NAT_ROW = 1
const ROW_ICON = [<Globe key="g" />, <LogOut key="n" />, <Waypoints key="p" />, <LockKeyhole key="v" />]

function CellLit({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-[8px] px-2 py-[2px]" style={{ margin: '-2px -8px', background: `${colors.accent}26`, boxShadow: `inset 0 0 0 2px ${colors.accent}`, color: colors.ink }}>
      {children}
    </span>
  )
}

/** A direction cell: two-way or out-only, its arrow in front. */
function DirCell({ text }: { text: string }) {
  const out = text.startsWith('Outbound')
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden className={`grid h-[24px] w-[24px] shrink-0 place-items-center rounded-full ${fx(out ? 'hop' : 'lift', 0, 2).className}`} style={{ ...fx(out ? 'hop' : 'lift', 0, 2).style, background: out ? '#FFF4E0' : colors.surface2, color: out ? '#9A5B00' : colors.brand }}>
        {out ? <LogOut size={14} /> : <ArrowLeftRight size={14} />}
      </span>
      <span>{text}</span>
    </span>
  )
}

export function RoutingCompared({ lesson }: { lesson: string }) {
  return (
    <Card id="T18-1" kicker="Routing Options Compared" title="Side By Side" lead={T18_LEAD} lesson={lesson}>
      <div style={{ width: BOX_W }}>
        <VisualTable
          compact
          columns={[
            { label: 'Component', icon: <Network />, weight: 1 },
            { label: 'Direction', icon: <ArrowLeftRight />, weight: 1.05 },
            { label: 'Typical Cost Driver', icon: <Coins />, weight: 1.75 },
          ]}
          rows={T18_ROWS.map(([c, d, cost], i) => ({ icon: ROW_ICON[i], cells: [c, <DirCell key="d" text={d} />, i === NAT_ROW ? <CellLit key="cost">{cost}</CellLit> : cost] }))}
        />
      </div>
    </Card>
  )
}

/* ===== T18-2 · Routing is not permission */

const T182_NOTE = "Together these pieces route traffic from a subnet to the internet or to another VPC; whether a packet is allowed to leave or enter at all is a separate decision, made by the network's security controls"

/* the finished map of T13-1 across the body, lifted so the stage holds it with the callout under; the security shield at its right */
const T182_H = 330
const T182_DX = 120
const T182_DY = -44
const SHIELD = { cx: 912, cy: 160, w: 150 }
/** the internet over the map, right of the gateway's label, inside the stage */
/** the internet beside the gateway's label (the stage starts 44px into the map), the two-way link on its left lobe */
const T182_CLOUD = { x: 236, y: 46 }
const T182_LINK = { x: 242, y: 84 }

/** T18-2: 0 the finished map with traffic on every exit; 1 a lock lands on each subnet, in front of its route table, and the security shield beside the map. */
function NotPermissionScene({ k, held }: { k: number; held: boolean }) {
  const locks = k >= 1
  const now = !held && k === 1
  return (
    <>
      <div className="absolute" style={{ left: T182_DX, top: T182_DY, width: 0, height: 0 }}>
        <RoutingMap routeTables igw nat peer locks={locks} lit={{ locks: now }} />
        <Cloud x={T182_CLOUD.x} y={T182_CLOUD.y} w={80} />
        <IgwLink to={T182_LINK} />
        <MapFlows igw nat peer local cloud={T182_LINK} />
        {[M.pub, M.pri].map((sb, i) => (
          <Ripple key={i} x={G.vpc.x + sb.x + sb.w / 2} y={G.vpc.y + M.lockY} r={22} tone={NET.lit} on={now} />
        ))}
      </div>
      {/* the security controls: a shield beside the map, its own decision */}
      <At x={SHIELD.cx} y={SHIELD.cy} cx cy>
        <Fade on={locks} lift={10}>
          <span className={fx('lift', 0, 2.8).className} style={{ ...fx('lift', 0, 2.8).style, display: 'block' }}>
            <CvIcon name="shield-lock" w={SHIELD.w} />
          </span>
        </Fade>
      </At>
      <Ripple x={SHIELD.cx} y={SHIELD.cy} r={70} tone={NET.lit} on={now} />
    </>
  )
}

export function RoutingNotPermission({ lesson }: { lesson: string }) {
  const held = useHeld()
  const k = useBuild(2, 1600, 1100)
  return (
    <Card id="T18-2" kicker="Routing Options Compared" title="Side By Side" lesson={lesson}>
      <div className="flex flex-col" style={{ width: BOX_W, gap: 16 }}>
        <Stage w={BOX_W} h={T182_H} active={false}>
          <NotPermissionScene k={k} held={held} />
        </Stage>
        <Callout kind="warning" title="Watch Out" asStep={false} icon={<ShieldAlert width={20} height={20} />} className="!p-4 [&>div>p:first-child]:hidden [&>div>div]:!mt-0 [&>div>div]:text-[17px]">
          {T182_NOTE}
        </Callout>
      </div>
    </Card>
  )
}

/** This section's micro-animations (visual pass, 2026-11-04), appended to the deck's CSS by `netDeck.tsx`. */
export const ROUTING_CSS =
  ROUTING_ART_CSS +
  ROUTING_AN_CSS +
  `
@keyframes rt-coin { 0% { transform: translateY(-16px); opacity: 0 } 25% { transform: translateY(0); opacity: 1 } 70% { transform: translateY(0); opacity: 1 } 100% { transform: translateY(6px); opacity: 0 } }
.rt-coin { animation: rt-coin 1.8s cubic-bezier(0.34,1.4,0.64,1) infinite; }
.cc-still .rt-coin, .deck-thumb .rt-coin { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .rt-coin { animation: none !important; } }
`

