import type { CSSProperties, ReactNode } from 'react'
import {
  AppWindow,
  ArrowDown,
  ArrowLeftRight,
  ArrowUpFromLine,
  Ban,
  Boxes,
  CalendarClock,
  Check,
  Combine,
  Crosshair,
  Globe,
  History,
  KeyRound,
  Layers,
  LayoutDashboard,
  Link2,
  ListChecks,
  ListFilter,
  ListOrdered,
  ListX,
  Lock,
  Network,
  Reply,
  Scale,
  ScrollText,
  SearchCheck,
  Server,
  Settings2,
  Shield,
  ShieldCheck,
  ShieldX,
  X,
} from 'lucide-react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Arrow, At, BOX_W, Card, Fade, Label, REDUCED, Stage, STILL, useBuild } from '../scene'
import { lead } from '../iso/frames'
import { TILE_SKIN } from '../card'
import { Badge, CvIcon, LitFigure } from './fx'
import { VisualTable } from './vtable'
import { Boundary, InstanceStack, Logo, Mono, NET, NoMark, Resource, SubnetBox } from './frames'
import { ACL_TONE, SG_TONE } from './security-analogy'

export { DoorCheckpointAnalogy } from './security-analogy'

/**
 * SECTION 5 · NETWORK SECURITY CONTROLS (T19-1 to T23-1), the visual pass
 * (user, 2026-11-04: Session 4's design, every string unchanged).
 *
 * The two filters keep ONE colour each on every slide of the section (G4):
 * the security group BLUE (on the instance), the network ACL TEAL (on the
 * subnet's edge). A request is an orange packet, its reply a green one. Every
 * point carries its subject's icon (`LitFigure`, Session 4's point tiles), the
 * point the figure is acting out lit. Every figure builds through `useBuild`,
 * so auto animation OFF walks it one press per state:
 *   T19-1   the instance and the local route; two faint rings; the group ring; the ACL ring;
 *           a packet checked at both, one more stopped at the ACL
 *   T19-AN  `security-analogy.tsx`: the visitor's walk, checkpoint in, door in, door out,
 *           checkpoint out (checked again)
 *   T20-1   the instance, its group and the rules; a request OUT (the outbound rule allows it);
 *           its reply back IN, let through automatically (no inbound rule matches it)
 *   T20-1b  the subnets; the groups (allow rules only, a tick each); the attachments;
 *           every rule lit at once (evaluated together)
 *   T20-1c  a request IN (the inbound rule matches); its reply OUT, automatic
 *   T20-2   one group; the console page; a second group attaches; their rules combine
 *   T21-1   a request reaches the ACL; allow or deny; rule 1 matches, the request goes on;
 *           the reply is checked rule by rule, 1, 2, then 3, its own separate rule
 *   T21-2   the shape; one ACL's rules reach every instance of its subnet; the console page
 *   T22-1   `VisualTable`, row by row
 *   T23-1   the funnel's mouth; its two stages (subnet level on top, instance level below); port 443
 *   T23-1b  the whole funnel; the sources; the explicit deny; the review
 * Ambient packets ride CSS `offset-path` loops (transform and opacity only), held
 * off on harness URLs, thumbnails and under reduced motion.
 */

const EASE = 'cubic-bezier(0.22,1,0.36,1)'
const SG = SG_TONE
const ACL = ACL_TONE
const ACL_D = colors.tealDark
const REQ = colors.accent
const REP = colors.success

/* ------------------------------------------------------------------ the section's keyframes */

const KEYS: string[] = []
/** A ride: [time %, distance along the path %, opacity] stops for a packet on an `offset-path`. */
function ride(name: string, stops: [number, number, number][]) {
  KEYS.push(`@keyframes sec-${name} { ${stops.map(([t, d, o]) => `${t}% { offset-distance: ${d}%; opacity: ${o} }`).join(' ')} }`)
  return name
}
/** A ping: [time %, scale, opacity] stops for a mark that appears when a packet reaches it. */
function ping(name: string, stops: [number, number, number][]) {
  KEYS.push(`@keyframes sec-${name} { ${stops.map(([t, s, o]) => `${t}% { transform: scale(${s}); opacity: ${o} }`).join(' ')} }`)
  return name
}

const LINE = ride('line', [[0, 0, 0], [8, 0, 1], [86, 100, 1], [100, 100, 0]])
const DROP = ride('drop', [[0, 0, 0], [8, 0, 1], [78, 100, 1], [96, 100, 0], [100, 100, 0]])
const DROP_X = ping('dropx', [[0, 0.4, 0], [76, 0.4, 0], [80, 1.15, 1], [84, 1, 1], [96, 1, 1], [100, 1, 0]])
/* T19-1: an allowed packet checked at the ACL, then at the group; then a second one stopped at the ACL */
const T19_ACL_AT = 55.6
const T19_SG_AT = 92.7
const T19_OK = ride('t19ok', [[0, 0, 0], [3, 0, 1], [14, T19_ACL_AT, 1], [22, T19_ACL_AT, 1], [31, T19_SG_AT, 1], [39, T19_SG_AT, 1], [43, 100, 1], [47, 100, 0], [100, 100, 0]])
const T19_NO = ride('t19no', [[0, 0, 0], [50, 0, 0], [53, 0, 1], [66, 51, 1], [94, 51, 1], [99, 51, 0], [100, 51, 0]])
const T19_PING_ACL = ping('t19pa', [[0, 0.5, 0], [13, 0.5, 0], [15, 1.15, 1], [17, 1, 1], [22, 1, 1], [25, 1, 0], [100, 1, 0]])
const T19_PING_SG = ping('t19ps', [[0, 0.5, 0], [30, 0.5, 0], [32, 1.15, 1], [34, 1, 1], [39, 1, 1], [42, 1, 0], [100, 1, 0]])
const T19_PING_NO = ping('t19pn', [[0, 0.5, 0], [65, 0.5, 0], [67, 1.15, 1], [69, 1, 1], [94, 1, 1], [99, 1, 0], [100, 1, 0]])

/** The section's micro-animations, appended to the deck's CSS by `netDeck.tsx`. */
const BASE_CSS = `
.sec-anim { will-change: transform, opacity, offset-distance; }
.sec-ride { offset-rotate: 0deg; opacity: 0; }
@keyframes sec-sweep { 0% { transform: translateX(-110%); opacity: 0 } 20% { opacity: 1 } 100% { transform: translateX(420%); opacity: 0 } }
.sec-sweep { animation: sec-sweep 1.1s cubic-bezier(0.45,0,0.55,1) 1 both; }
@keyframes sec-breathe { 0%, 100% { transform: scale(1); opacity: 0.55 } 50% { transform: scale(1.08); opacity: 1 } }
.sec-breathe { animation: sec-breathe 2.4s cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes sec-lift { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
.sec-lift { animation: sec-lift 2.8s cubic-bezier(0.45,0,0.55,1) infinite; }
.cc-still .sec-anim, .deck-thumb .sec-anim { animation: none !important; }
.cc-still .sec-ride, .deck-thumb .sec-ride, .cc-still .sec-ping, .deck-thumb .sec-ping { opacity: 0 !important; }
@media (prefers-reduced-motion: reduce) { .sec-anim { animation: none !important; } .sec-ride, .sec-ping { opacity: 0 !important; } }
`

/** Harness URLs, reduced motion and picker thumbnails: no packet rides. */
function useHeld() {
  const instant = useInstant()
  return STILL || REDUCED || instant
}

/* ------------------------------------------------------------------ local pieces */

/** A packet riding a path (stage px) on a CSS loop. */
function Rider({ d, anim = LINE, dur = 2.4, delay = 0, tone = REQ, size = 14, on = true }: { d: string; anim?: string; dur?: number; delay?: number; tone?: string; size?: number; on?: boolean }) {
  const held = useHeld()
  if (!on || held) return null
  return (
    <span
      aria-hidden
      className="sec-anim sec-ride pointer-events-none absolute rounded-full"
      style={{ left: 0, top: 0, width: size, height: size, background: tone, boxShadow: `0 0 0 4px ${tone}40, inset 0 0 0 2px ${colors.white}`, offsetPath: `path("${d}")`, animation: `sec-${anim} ${dur}s linear ${delay}s infinite`, zIndex: 4 } as CSSProperties}
    />
  )
}

/** A mark that pops when a riding packet reaches it, on the rider's clock. Centred on (x, y). */
function Ping({ x, y, anim, dur, delay = 0, on = true, children }: { x: number; y: number; anim: string; dur: number; delay?: number; on?: boolean; children: ReactNode }) {
  const held = useHeld()
  if (!on || held) return null
  return (
    <span aria-hidden className="pointer-events-none absolute" style={{ left: x, top: y, transform: 'translate(-50%, -50%)', zIndex: 5 }}>
      <span className="sec-anim sec-ping block" style={{ opacity: 0, animation: `sec-${anim} ${dur}s linear ${delay}s infinite` }}>
        {children}
      </span>
    </span>
  )
}

/** A small round mark: a tick in a filter's tone, a cross in danger red. */
function Disc({ tone, size = 26, children }: { tone: string; size?: number; children: ReactNode }) {
  return (
    <span className="grid place-items-center rounded-full" style={{ width: size, height: size, background: tone, color: colors.white, boxShadow: `0 0 0 3px ${colors.white}, 0 8px 16px -8px rgba(16,32,58,0.55)` }}>
      {children}
    </span>
  )
}

/** A drawn ring around a part (a security group on an instance, a network ACL on a subnet's edge). */
function Ring({ x, y, w, h, tone, on = true, solid = true, glow = false, radius = 16, fill }: { x: number; y: number; w: number; h: number; tone: string; on?: boolean; solid?: boolean; glow?: boolean; radius?: number; fill?: string }) {
  const instant = useInstant()
  return (
    <div
      aria-hidden
      className="absolute"
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: radius,
        border: `${solid ? 2 : 1.5}px ${solid ? 'solid' : 'dashed'} ${solid ? tone : colors.muted}`,
        background: solid ? (fill ?? `${tone}10`) : 'transparent',
        boxShadow: glow ? `0 0 0 5px ${tone}2E, 0 12px 26px -14px ${tone}` : undefined,
        opacity: on ? 1 : 0,
        transition: instant ? 'none' : `all 460ms ${EASE}`,
      }}
    />
  )
}

/** A chip in one filter's tone: white with the tone's ring, or filled when lit. */
function ToneLabel({ tone, ink, lit = false, icon, children }: { tone: string; ink: string; lit?: boolean; icon?: ReactNode; children: ReactNode }) {
  return (
    <Label size={14} strong raised icon={icon} style={lit ? { background: tone, color: colors.white, boxShadow: `inset 0 0 0 1.5px ${tone}, 0 8px 16px -10px ${tone}` } : { color: ink, boxShadow: `inset 0 0 0 1.5px ${tone}, 0 8px 16px -10px rgba(16,32,58,0.35)` }}>
      {children}
    </Label>
  )
}

/** A line between two stage points that draws itself on (tail to head) when `on`, no head (the attachment lines of the TR images). */
function DrawLine({ x1, y1, x2, y2, tone = SG, width = 2.5, on = true, dashed = false, delay = 0 }: { x1: number; y1: number; x2: number; y2: number; tone?: string; width?: number; on?: boolean; dashed?: boolean; delay?: number }) {
  const instant = useInstant()
  const minX = Math.floor(Math.min(x1, x2) - width)
  const minY = Math.floor(Math.min(y1, y2) - width)
  const maxX = Math.ceil(Math.max(x1, x2) + width)
  const maxY = Math.ceil(Math.max(y1, y2) + width)
  const d = `M ${x1 - minX} ${y1 - minY} L ${x2 - minX} ${y2 - minY}`
  return (
    <svg aria-hidden className="pointer-events-none absolute" style={{ left: minX, top: minY, overflow: 'visible' }} width={maxX - minX} height={maxY - minY}>
      {dashed ? (
        <path d={d} stroke={tone} strokeWidth={Math.min(width, 1.5)} strokeLinecap="round" fill="none" strokeDasharray="5 5" style={{ opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE} ${delay}ms` }} />
      ) : (
        <path d={d} stroke={tone} strokeWidth={width} strokeLinecap="round" fill="none" pathLength={1} strokeDasharray="1" style={{ strokeDashoffset: on ? 0 : 1, opacity: on ? 1 : 0, transition: instant ? 'none' : `stroke-dashoffset 640ms cubic-bezier(0.65,0,0.35,1) ${delay}ms, opacity 160ms ${delay}ms` }} />
      )}
    </svg>
  )
}

type RuleRow = { cells: ReactNode[]; lit?: boolean; tone?: string; mark?: ReactNode }

/**
 * A rule table, the look of `MiniRouteTable`: an optional title bar, the heads
 * on a tinted row, then each rule. `litAll` lights every row at once (with one
 * sheen across them all: evaluated together); a row's own `lit` lights that row
 * in its `tone`; `marks` adds a narrow last column for each row's `mark`.
 */
function RuleTable({ heads, rows, w, cols = '1.5fr 1fr 0.8fr', size = 14, title, titleIcon, titleTone = NET.lock, litAll = false, marks = false, sweepKey }: {
  heads: ReactNode[]; rows: RuleRow[]; w: number; cols?: string; size?: number; title?: ReactNode; titleIcon?: ReactNode; titleTone?: string; litAll?: boolean; marks?: boolean; sweepKey?: string | number
}) {
  const instant = useInstant()
  const held = useHeld()
  const ease = instant ? 'none' : `all 420ms ${EASE}`
  /* the match mark sits at the end of the row's last cell (no extra column), the cells a little tighter, so the table keeps its width */
  const grid = cols
  const px = marks ? 'px-2' : 'px-3'
  return (
    <div className="relative overflow-hidden rounded-[12px]" style={{ width: w, ...TILE_SKIN }}>
      {title !== undefined && (
        <div className="flex items-center gap-1.5 px-3 font-heading font-semibold leading-tight" style={{ height: 26, fontSize: size, color: colors.white, background: titleTone }}>
          {titleIcon && <span className="grid place-items-center [&>svg]:h-[14px] [&>svg]:w-[14px]">{titleIcon}</span>}
          {title}
        </div>
      )}
      <div className="grid" style={{ gridTemplateColumns: grid }}>
        {heads.map((h, i) => (
          <div key={i} className={`flex items-center whitespace-nowrap ${px} font-heading font-semibold leading-tight`} style={{ height: 30, fontSize: size, color: colors.brandDark, background: colors.surface2 }}>
            {h}
          </div>
        ))}
        {rows.map((r, i) => {
          const on = litAll || !!r.lit
          const tone = r.tone ?? (litAll ? SG : NET.lit)
          return (
            <div key={i} className="contents">
              {r.cells.map((c, j) => (
                <div key={j} className={`flex items-center gap-1.5 whitespace-nowrap ${px} leading-tight`} style={{ height: 30, fontSize: size, color: colors.ink, borderTop: `1px solid ${colors.line}`, background: on ? `${tone}22` : undefined, boxShadow: on && j === 0 ? `inset 3px 0 0 0 ${tone}` : undefined, transition: ease }}>
                  {c}
                  {marks && j === r.cells.length - 1 && r.mark && <span className="ml-auto shrink-0">{r.mark}</span>}
                </div>
              ))}
            </div>
          )
        })}
      </div>
      {/* every row lit at once: one sheen crosses them all together */}
      {litAll && !held && <span key={sweepKey} aria-hidden className="sec-anim sec-sweep pointer-events-none absolute inset-y-0 left-0 w-[26%]" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%)' }} />}
    </div>
  )
}

/** A small round tick (a rule that matched, an allow rule). */
function Tick({ tone = colors.success, on = true, size = 18 }: { tone?: string; on?: boolean; size?: number }) {
  const instant = useInstant()
  return (
    <span aria-hidden className="grid place-items-center rounded-full" style={{ width: size, height: size, background: tone, color: colors.white, opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.5)', transition: instant ? 'none' : `all 380ms cubic-bezier(0.34,1.56,0.64,1)` }}>
      <Check size={size * 0.66} strokeWidth={3.4} />
    </span>
  )
}

/** The network interface: a small pill on an instance tile's right edge, in the group's blue. */
function Interface({ x, y, h = 44 }: { x: number; y: number; h?: number }) {
  return (
    <At x={x} y={y}>
      <span aria-hidden className="block rounded-full" style={{ width: 10, height: h, background: SG, boxShadow: `0 0 0 2px ${colors.white}` }} />
    </At>
  )
}

/** The network ACL as a gate bar on a subnet boundary: teal, a list icon on it; `check` glows it while a packet is checked. */
function AclBar({ x, y, w = 16, h = 76, check = false, icon = 12 }: { x: number; y: number; w?: number; h?: number; check?: boolean; icon?: number }) {
  const instant = useInstant()
  return (
    <At x={x} y={y}>
      <span aria-hidden className="grid place-items-center rounded-[8px]" style={{ width: w, height: h, background: `repeating-linear-gradient(180deg, ${ACL} 0 10px, ${ACL_D} 10px 14px)`, color: colors.white, boxShadow: check ? `0 0 0 2px ${colors.white}, 0 0 0 7px ${ACL}40, 0 10px 20px -8px ${ACL}` : `0 0 0 2px ${colors.white}, 0 8px 16px -8px rgba(16,32,58,0.6)`, transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
        <span className="grid place-items-center rounded-[6px]" style={{ width: icon + 10, height: icon + 10, background: ACL_D }}>
          <ListOrdered style={{ width: icon, height: icon, strokeWidth: 2.6 }} />
        </span>
      </span>
    </At>
  )
}

/** The network ACL as a disc on a line (T21-2): teal with the rule-list icon. */
function AclDisc({ size = 40, lit = false }: { size?: number; lit?: boolean }) {
  const instant = useInstant()
  return (
    <span aria-hidden className="grid place-items-center rounded-full" style={{ width: size, height: size, background: lit ? ACL : ACL_D, color: colors.white, boxShadow: lit ? `0 0 0 3px ${colors.white}, 0 0 0 8px ${ACL}38` : `0 0 0 3px ${colors.white}, 0 8px 16px -8px rgba(16,32,58,0.6)`, transition: instant ? 'none' : `all 420ms ${EASE}` }}>
      <ListOrdered style={{ width: size * 0.5, height: size * 0.5, strokeWidth: 2.4 }} />
    </span>
  )
}

/* the TR image's rule rows (slide-20-1.png), the only values this section may use */
const SG1_IN = (): RuleRow[] => [
  { cells: [<Mono key="a">198.51.100.0/24</Mono>, 'TCP', <Mono key="p">22</Mono>] },
  { cells: ['Subnet A CIDR', 'All', 'All'] },
]
const SG1_OUT = (): RuleRow[] => [{ cells: [<Mono key="a">0.0.0.0/0</Mono>, 'All', 'All'] }]
const SG2_IN = (): RuleRow[] => [
  { cells: ['Subnet B CIDR', 'All', 'All'] },
  { cells: ['Subnet A CIDR', 'TCP', <Mono key="p">22</Mono>] },
]
const IN_HEADS = ['Source', 'Protocol', 'Port']
const OUT_HEADS = ['Destination', 'Protocol', 'Port']
const lit = (rows: RuleRow[], i: number, on: boolean, tone: string, mark?: ReactNode): RuleRow[] => rows.map((r, j) => (j === i && on ? { ...r, lit: true, tone, mark } : r))

/* ===== T19-1 · Two filters, two places */

const T19_POINTS: { icon: ReactNode; text: string }[] = [
  { icon: <Layers />, text: 'Two controls do this at different points in the network' },
  { icon: <Shield />, text: "Security groups filter traffic at the individual instance's network interface" },
  { icon: <ListOrdered />, text: 'Network ACLs (Access Control Lists) filter traffic at the subnet boundary' },
  { icon: <KeyRound />, text: 'Least-privilege design combines both controls so only the traffic a workload truly needs is allowed' },
]

/* containment as boxes inside boxes: the VPC, one subnet, one instance; the group's ring on the instance, the ACL's along the subnet's edge */
const T19 = {
  vpc: { x: 40, y: 44, w: 554, h: 300 },
  sub: { x: 72, y: 96, w: 256, h: 212 },
  inst: { cx: 200, cy: 212, size: 56 },
  inner: { x: 150, y: 162, w: 100, h: 100 },
  outer: { x: 58, y: 82, w: 284, h: 240 },
  other: { cx: 500, cy: 212, size: 40 },
} as const

function TwoFiltersScene({ k }: { k: number }) {
  const rings = k >= 1
  const innerSolid = k >= 2
  const outerSolid = k >= 3
  const both = k >= 4
  const lineX1 = T19.inst.cx + T19.inst.size / 2
  const lineX2 = T19.other.cx - T19.other.size / 2
  const path = `M ${lineX2 - 2} ${T19.inst.cy} L ${lineX1 + 2} ${T19.inst.cy}`
  const aclX = T19.outer.x + T19.outer.w
  const sgX = T19.inner.x + T19.inner.w
  return (
    <>
      <At x={T19.vpc.x} y={T19.vpc.y}>
        {/* a thin dashed edge (FS review, slide 46: "reduce the dotted-line border width") */}
        <Boundary w={T19.vpc.w} h={T19.vpc.h} label="VPC" style={{ border: `1.5px dashed ${NET.boundary}`, background: `${NET.boundary}08` }} />
      </At>
      <At x={T19.sub.x} y={T19.sub.y}>
        <SubnetBox w={T19.sub.w} h={T19.sub.h} label="Subnet" />
      </At>
      {/* the local route: every resource reaches every other */}
      <span aria-hidden className="absolute rounded-full" style={{ left: lineX1, top: T19.inst.cy - 1.5, width: lineX2 - lineX1, height: 3, background: NET.boundary }} />
      <At x={(aclX + lineX2) / 2} y={T19.inst.cy + 14} cx>
        <Label size={14} strong raised icon={<Network />}>
          Local Route
        </Label>
      </At>
      <At x={T19.other.cx} y={T19.other.cy} cx cy>
        <Resource size={T19.other.size} />
      </At>
      {/* the network ACL's ring, along the subnet boundary (teal) */}
      <Ring {...T19.outer} tone={ACL} on={rings} solid={outerSolid} glow={outerSolid && !both} radius={20} fill={`${ACL}0C`} />
      {/* the security group's ring, tight around the instance (blue) */}
      <Ring {...T19.inner} tone={SG} on={rings} solid={innerSolid} glow={innerSolid && !outerSolid} radius={16} fill={`${SG}14`} />
      <At x={T19.inst.cx} y={T19.inst.cy} cx cy>
        <Resource size={T19.inst.size} />
      </At>
      <Fade on={innerSolid} className="absolute" style={{ left: sgX, top: T19.inner.y - 14 }}>
        <div style={{ transform: 'translateX(-50%)' }}>
          <ToneLabel tone={SG} ink={colors.brandDark} lit={innerSolid && !outerSolid} icon={<Shield />}>
            Security Group
          </ToneLabel>
        </div>
      </Fade>
      <Fade on={outerSolid} className="absolute" style={{ left: T19.outer.x + T19.outer.w / 2, top: T19.outer.y + T19.outer.h - 14 }}>
        <div style={{ transform: 'translateX(-50%)' }}>
          <ToneLabel tone={ACL} ink={ACL_D} lit={outerSolid && !both} icon={<ListOrdered />}>
            Network ACL
          </ToneLabel>
        </div>
      </Fade>
      {/* least privilege: one packet checked at the ACL, then at the group, and in; one more stopped at the ACL */}
      <Rider d={path} anim={T19_OK} dur={6.4} on={both} />
      <Rider d={path} anim={T19_NO} dur={6.4} tone={colors.danger} on={both} />
      <Ping x={aclX} y={T19.inst.cy - 26} anim={T19_PING_ACL} dur={6.4} on={both}>
        <Disc tone={ACL} size={24}><Check size={14} strokeWidth={3.2} /></Disc>
      </Ping>
      <Ping x={sgX} y={T19.inst.cy - 26} anim={T19_PING_SG} dur={6.4} on={both}>
        <Disc tone={SG} size={24}><Check size={14} strokeWidth={3.2} /></Disc>
      </Ping>
      <Ping x={aclX + 2} y={T19.inst.cy - 26} anim={T19_PING_NO} dur={6.4} on={both}>
        <Disc tone={colors.danger} size={24}><X size={14} strokeWidth={3.2} /></Disc>
      </Ping>
    </>
  )
}

export function TwoFilters({ lesson }: { lesson: string }) {
  const k = useBuild(5, 700)
  return (
    <LitFigure
      id="T19-1"
      kicker="Network Security Layers"
      title="Two Control Types"
      lead="Inside a VPC, the local route makes every resource reachable from every other, so filters must decide which traffic is allowed"
      lesson={lesson}
      points={T19_POINTS}
      lit={k - 1}
      figure={<TwoFiltersScene k={k} />}
      pointSize={16}
    />
  )
}

/**
 * A TR point cut in two at its own clause boundary (FS review, Part 3: no left point past two lines; the user,
 * 2026-11-04: "keep only in tr doc but if it needed split it"). `at` is the text the first piece ends with (its
 * trailing comma and space dropped at the cut); the second piece is the rest, every word kept, in order.
 */
function cut(point: string, at: string, cap = false): [string, string] {
  const i = point.indexOf(at)
  if (i < 0) throw new Error(`cut: "${at}" not in "${point}"`)
  const head = point.slice(0, i + at.length).replace(/[,;]\s*$/, '')
  const tail = point.slice(i + at.length)
  /* `cap` (R8.4): the second piece is a point of its own, so it starts with a capital (T20-1b keeps its piece as the user's reference) */
  return [head, cap ? tail.charAt(0).toUpperCase() + tail.slice(1) : tail]
}

/* ===== T20-1 / T20-1c · How a security group filters */

const T20_POINTS = [
  'Being stateful, it automatically permits the return traffic of a connection it already allowed, without needing a matching reverse rule',
  'Only allow rules exist; inbound traffic is blocked unless a rule permits it, while a new group allows all outbound traffic by default',
  'All rules in a group are evaluated together, not checked in a fixed order',
  'Reply traffic for an already-permitted request is tracked and let through automatically',
]

/* the instance in its group's ring (top left), the outside (top right), the two lanes between; the group's rules in one box below */
type SgGeo = {
  tag: number
  ring: { x: number; y: number; w: number; h: number }
  inst: { x: number; y: number; size: number }
  laneTop: number
  laneBot: number
  from: number
  to: number
  globe: { x: number; y: number; w: number }
  box: { x: number; y: number; w: number; h: number }
  inbound: { x: number; y: number; w: number }
  outbound: { x: number; y: number; w: number }
}
const T20_GEO: SgGeo = {
  tag: 14,
  ring: { x: 24, y: 44, w: 116, h: 104 },
  inst: { x: 40, y: 64, size: 64 },
  laneTop: 80,
  laneBot: 116,
  from: 146,
  to: 532,
  globe: { x: 544, y: 62, w: 74 },
  box: { x: 16, y: 200, w: 602, h: 166 },
  inbound: { x: 30, y: 220, w: 282 },
  outbound: { x: 324, y: 220, w: 280 },
}

/*
  T20-1c ON TOP, ITS ONE POINT BELOW (user, 2026-11-05: "use a top-and-bottom layout: the visual on top (enlarged)
  and the points at the bottom, using the full width"). The same drawing laid wide: the lanes run the slide's width,
  the two rule tables side by side under them, the whole scene drawn at T20W_S so every part is larger than on the
  half-width card. Its height is what Space-1 leaves above one full-width point (the body starts at y 221, the
  player bar at 664), so the scene's own padding is trimmed instead.
*/
const T20W_S = 1.08
const T20W_GAP = 14
const T20W_H = 330
const T20W_W = Math.round(BOX_W / T20W_S)
const T20W: SgGeo = (() => {
  const W = T20W_W
  const globeW = 74
  /* the box a little lower than the ring's shield disc reaches, so the disc keeps clear of the box's label */
  const box = { x: 16, y: 172, w: W - 32, h: 146 }
  const tw = (box.w - 14 * 3) / 2
  return {
    tag: 10,
    ring: { x: 24, y: 40, w: 116, h: 100 },
    inst: { x: 40, y: 58, size: 64 },
    laneTop: 74,
    laneBot: 106,
    from: 146,
    to: W - 24 - globeW - 12,
    globe: { x: W - 24 - globeW, y: 53, w: globeW },
    box,
    inbound: { x: box.x + 14, y: box.y + 18, w: tw },
    outbound: { x: box.x + 28 + tw, y: box.y + 18, w: tw },
  }
})()

/**
 * `dir` 'out' (T20-1): the instance sends a request OUT (the outbound rule allows
 * it), its reply comes back IN with no inbound rule to match, marked automatic.
 * `dir` 'in' (T20-1c): a request comes IN (the inbound rule matches), its reply
 * goes back OUT, marked automatic.
 */
function SecurityGroupScene({ k, dir, g: T20 = T20_GEO }: { k: number; dir: 'out' | 'in'; g?: SgGeo }) {
  const request = k >= 1
  const reply = k >= 2
  /* the top lane runs out (to the right), the bottom lane in (to the left) */
  const reqTop = dir === 'out'
  const reqY = reqTop ? T20.laneTop : T20.laneBot
  const repY = reqTop ? T20.laneBot : T20.laneTop
  const leftToRight = (y: number) => `M ${T20.from} ${y} L ${T20.to} ${y}`
  const rightToLeft = (y: number) => `M ${T20.to} ${y} L ${T20.from} ${y}`
  const inRows = dir === 'in' ? lit(SG1_IN(), 0, request, REQ, <Tick tone={REQ} />) : SG1_IN()
  const outRows = dir === 'out' ? lit(SG1_OUT(), 0, request, REQ, <Tick tone={REQ} />) : SG1_OUT()
  return (
    <>
      <At x={T20.ring.x} y={T20.tag}>
        <Label size={14} strong raised icon={<Link2 />}>
          Network Interface
        </Label>
      </At>
      <Ring {...T20.ring} tone={SG} glow={request} radius={20} />
      <At x={T20.inst.x} y={T20.inst.y}>
        <Resource size={T20.inst.size} />
      </At>
      <Interface x={T20.inst.x + T20.inst.size - 5} y={T20.inst.y + 10} />
      <span className="absolute" style={{ left: T20.ring.x + T20.ring.w - 16, top: T20.ring.y + T20.ring.h - 16 }}>
        <Disc tone={SG} size={30}><Shield size={16} strokeWidth={2.4} /></Disc>
      </span>
      {/* the outside */}
      <div className="sec-anim sec-lift absolute" style={{ left: T20.globe.x, top: T20.globe.y }}>
        <CvIcon name="globe-www" w={T20.globe.w} />
      </div>
      {/* the request, then its reply */}
      <Arrow x1={reqTop ? T20.from : T20.to} y1={reqY} x2={reqTop ? T20.to : T20.from} y2={reqY} on={request} tone={REQ} />
      <Rider d={reqTop ? leftToRight(reqY) : rightToLeft(reqY)} on={request} dur={2.4} />
      <Arrow x1={reqTop ? T20.to : T20.from} y1={repY} x2={reqTop ? T20.from : T20.to} y2={repY} on={reply} tone={REP} />
      <Rider d={reqTop ? rightToLeft(repY) : leftToRight(repY)} on={reply} dur={2.4} delay={1.2} tone={REP} />
      <Fade on={reply} className="absolute" style={{ left: (T20.from + T20.to) / 2, top: Math.max(reqY, repY) + 14 }}>
        <div className="flex items-center gap-2" style={{ transform: 'translateX(-50%)' }}>
          <Badge on={reply} ring={REP} size={28} style={{ color: REP }}>
            <History size={15} strokeWidth={2.4} />
          </Badge>
          <Label size={14} strong tone="good" raised>
            Automatic
          </Label>
        </div>
      </Fade>
      {/* the group attaches to the interface; its rules sit in one box */}
      <DrawLine x1={T20.ring.x + 40} y1={T20.ring.y + T20.ring.h + 2} x2={T20.ring.x + 40} y2={T20.box.y - 2} tone={SG} dashed />
      <At x={T20.box.x} y={T20.box.y}>
        <Boundary w={T20.box.w} h={T20.box.h} solid tone={SG} label="Security Group" fill={`${SG}08`} />
      </At>
      <At x={T20.inbound.x} y={T20.inbound.y}>
        <RuleTable title="Inbound" titleIcon={<ArrowDown />} titleTone={SG} heads={IN_HEADS} rows={inRows} w={T20.inbound.w} cols="1.75fr 1fr 0.75fr" marks />
      </At>
      <At x={T20.outbound.x} y={T20.outbound.y}>
        <RuleTable title="Outbound" titleIcon={<ArrowDown style={{ transform: 'rotate(180deg)' }} />} titleTone={SG} heads={OUT_HEADS} rows={outRows} w={T20.outbound.w} cols="1.75fr 1fr 0.75fr" marks />
      </At>
    </>
  )
}

/** T20-1, split in three (user, 2026-10-30, G6 and G1): the lead and the stateful point; the allow and evaluation points with the TR's image; the reply point. */
export function SecurityGroup({ lesson }: { lesson: string }) {
  const k = useBuild(3, 900)
  return (
    <LitFigure
      id="T20-1"
      kicker="Security Groups Explained"
      title="Stateful Instance Filter"
      lead="A security group attaches to an instance's network interface and acts as a virtual firewall for that instance"
      lesson={lesson}
      points={cut(T20_POINTS[0], 'allowed, ', true).map((text, i) => ({ icon: i ? <ListX /> : <History />, text }))}
      lit={k - 1}
      figure={<SecurityGroupScene k={k} dir="out" />}
      pointSize={16}
    />
  )
}

/*
  THE TR'S IMAGE (slide 20, user 2026-10-30, G1: "add the second TR doc
  visual, matching it exactly"): the VPC holding Subnet A and Subnet B, three
  instances in each; under each subnet its security group, a box holding the
  inbound table (Source, Protocol, Port) and the outbound table (Destination,
  Protocol, Port), each instance on its own line down to the group. The values
  are the image's own. On a 690 x 380 stage.
*/
const T20C = {
  vpc: { x: 8, y: 20, w: 674, h: 352 },
  sub: { y: 14, w: 300, h: 70, xs: [22, 352] },
  inst: { y: 38, size: 30, dxs: [100, 172, 244] },
  grp: { y: 108, w: 300, h: 228 },
  tbl: { w: 272, inY: 10, outY: 136 },
} as const

function TwoGroupsScene({ k }: { k: number }) {
  const groups = k >= 1
  const lines = k >= 2
  const together = k >= 3
  return (
    <At x={T20C.vpc.x} y={T20C.vpc.y}>
      <Boundary w={T20C.vpc.w} h={T20C.vpc.h} label="VPC" solid tone={NET.public} labelTone="good">
        {T20C.sub.xs.map((sx, i) => (
          <At key={i} x={sx} y={T20C.sub.y}>
            <SubnetBox w={T20C.sub.w} h={T20C.sub.h} label={i === 0 ? 'Subnet A' : 'Subnet B'}>
              {T20C.inst.dxs.map((dx) => (
                <At key={dx} x={dx} y={T20C.inst.y} cx cy>
                  <InstanceStack size={T20C.inst.size} />
                </At>
              ))}
            </SubnetBox>
          </At>
        ))}
        {T20C.sub.xs.map((sx, i) => (
          <At key={i} x={sx} y={T20C.grp.y}>
            <Fade on={groups} lift={6} delay={i * 100}>
              <Boundary w={T20C.grp.w} h={T20C.grp.h} solid tone={SG} radius={12} fill={together ? `${SG}14` : `${SG}0A`}>
                <At x={(T20C.grp.w - T20C.tbl.w) / 2} y={T20C.tbl.inY}>
                  <RuleTable heads={IN_HEADS} rows={i === 0 ? SG1_IN() : SG2_IN()} w={T20C.tbl.w} cols="1.7fr 1fr 0.7fr" size={13} litAll={together} sweepKey={`in${i}`} />
                </At>
                <At x={(T20C.grp.w - T20C.tbl.w) / 2} y={T20C.tbl.outY}>
                  <RuleTable heads={OUT_HEADS} rows={SG1_OUT()} w={T20C.tbl.w} cols="1.7fr 1fr 0.7fr" size={13} litAll={together} sweepKey={`out${i}`} />
                </At>
                <At x={T20C.grp.w / 2} y={T20C.grp.h - 14} cx cy>
                  <ToneLabel tone={SG} ink={colors.brandDark} lit={together} icon={<Shield />}>
                    {i === 0 ? 'Security group 1' : 'Security group 2'}
                  </ToneLabel>
                </At>
                {/* allow rules only: a green allow mark on the group */}
                <span className="absolute" style={{ right: -13, top: -13 }}>
                  <Badge on={groups} ring={colors.success} tone={colors.success} size={28} style={{ color: colors.white }}>
                    <ShieldCheck size={15} strokeWidth={2.6} />
                  </Badge>
                </span>
              </Boundary>
            </Fade>
          </At>
        ))}
        {/* each instance on its own line down to its group, traffic riding down it */}
        {T20C.sub.xs.map((sx, i) =>
          T20C.inst.dxs.map((dx, j) => (
            <span key={`${i}-${dx}`}>
              <DrawLine x1={sx + dx} y1={T20C.sub.y + T20C.sub.h + 2} x2={sx + dx} y2={T20C.grp.y - 2} on={lines} tone={SG} width={2} delay={(i * 3 + j) * 60} />
              <Rider d={`M ${sx + dx} ${T20C.sub.y + T20C.sub.h + 2} L ${sx + dx} ${T20C.grp.y - 2}`} on={lines} size={9} dur={1.6} delay={(i * 3 + j) * 0.27} tone={REQ} />
            </span>
          )),
        )}
      </Boundary>
    </At>
  )
}

export function SecurityGroup2({ lesson }: { lesson: string }) {
  const k = useBuild(4, 800)
  return (
    <LitFigure
      id="T20-1b"
      kicker="Security Groups Explained"
      title="Stateful Instance Filter"
      lesson={lesson}
      points={[
        ...cut(T20_POINTS[1], 'it, ').map((text, i) => ({ icon: i ? <ArrowUpFromLine /> : <ShieldCheck />, text })),
        { icon: <ListChecks />, text: T20_POINTS[2] },
      ]}
      lit={k - 1}
      figure={<TwoGroupsScene k={k} />}
      pointsW={396}
      pointSize={16}
    />
  )
}

/** The full-width point under T20-1c's drawing: the deck's point tile (`LitPoints`' look), its icon and text centred in it. */
function WidePoint({ icon, text, on }: { icon: ReactNode; text: ReactNode; on: boolean }) {
  const lit = on && !STILL
  const ease = useInstant() ? 'none' : 'all 420ms cubic-bezier(0.22,1,0.36,1)'
  return (
    <div
      className="flex items-center justify-center gap-3 rounded-2xl px-3.5 py-2.5"
      style={{
        width: BOX_W,
        ...TILE_SKIN,
        boxShadow: lit ? `inset 0 0 0 2px ${colors.brand}, 0 12px 24px -14px ${colors.brand}` : TILE_SKIN.boxShadow,
        background: lit ? 'linear-gradient(180deg, #F4F8FF 0%, #E3ECFD 100%)' : TILE_SKIN.background,
        transition: ease,
      }}
    >
      <span aria-hidden className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px] [&>svg]:h-[20px] [&>svg]:w-[20px]" style={{ background: lit ? colors.brand : colors.surface2, color: lit ? colors.white : colors.brand, transition: ease }}>
        {icon}
      </span>
      <span className="leading-snug" style={{ fontSize: 16, color: colors.ink }}>
        {text}
      </span>
    </div>
  )
}

export function SecurityGroup3({ lesson }: { lesson: string }) {
  const k = useBuild(3, 900)
  return (
    <Card id="T20-1c" kicker="Security Groups Explained" title="Stateful Instance Filter" lesson={lesson}>
      <div className="flex flex-col items-center" style={{ width: BOX_W, gap: T20W_GAP }}>
        <Stage w={BOX_W} h={Math.round(T20W_H * T20W_S)} active={false}>
          <div className="absolute left-0 top-0" style={{ width: T20W_W, height: T20W_H, transform: `scale(${T20W_S})`, transformOrigin: '0 0' }}>
            <SecurityGroupScene k={k} dir="in" g={T20W} />
          </div>
        </Stage>
        <WidePoint icon={<Reply />} text={T20_POINTS[3]} on={k >= 1} />
      </div>
    </Card>
  )
}

/* ===== T20-2 · Where it is managed, and stacking */

const T20B_POINTS = [
  { icon: <AppWindow />, text: 'Managed on the EC2 Security Groups console page, attached per instance or interface' },
  { icon: <Combine />, text: 'Multiple security groups can attach to one instance, and their allowed rules combine' },
]

const T20B = {
  inst: { x: 30, y: 136, size: 64 },
  g1: { x: 236, y: 30, w: 360, h: 110 },
  g2: { x: 236, y: 184, w: 360, h: 110 },
  table: { x: 252, w: 328 },
  chipY: 324,
} as const

function StackingScene({ k }: { k: number }) {
  const console = k >= 1
  const second = k >= 2
  const combined = k >= 3
  const ifaceX = T20B.inst.x + T20B.inst.size + 8
  const ifaceY = T20B.inst.y + T20B.inst.size / 2
  const g1y = T20B.g1.y + T20B.g1.h / 2
  const g2y = T20B.g2.y + T20B.g2.h / 2
  const rows1 = SG1_IN().map((r) => ({ ...r, lit: combined, tone: SG }))
  const rows2 = SG2_IN().map((r) => ({ ...r, lit: combined, tone: SG }))
  return (
    <>
      <Ring x={T20B.inst.x - 14} y={T20B.inst.y - 14} w={T20B.inst.size + 36} h={T20B.inst.size + 28} tone={SG} glow={combined} radius={18} />
      <At x={T20B.inst.x} y={T20B.inst.y}>
        <Resource size={T20B.inst.size} />
      </At>
      <Interface x={T20B.inst.x + T20B.inst.size - 5} y={T20B.inst.y + 10} />
      {/* the attachment lines, from the interface to each group's edge */}
      <DrawLine x1={ifaceX} y1={ifaceY - 10} x2={T20B.g1.x - 2} y2={g1y} tone={SG} />
      <DrawLine x1={ifaceX} y1={ifaceY + 10} x2={T20B.g2.x - 2} y2={g2y} tone={SG} on={second} />
      <Rider d={`M ${T20B.g1.x - 2} ${g1y} L ${ifaceX} ${ifaceY - 10}`} on={combined} size={12} dur={1.8} tone={SG} />
      <Rider d={`M ${T20B.g2.x - 2} ${g2y} L ${ifaceX} ${ifaceY + 10}`} on={combined} size={12} dur={1.8} delay={0.3} tone={SG} />
      <span className="absolute" style={{ left: ifaceX + 10, top: ifaceY - 15 }}>
        <Badge on={combined} ring={SG} size={30} style={{ color: SG }}>
          <Combine size={16} strokeWidth={2.4} />
        </Badge>
      </span>
      <At x={T20B.g1.x} y={T20B.g1.y}>
        <Boundary w={T20B.g1.w} h={T20B.g1.h} solid tone={SG} label={<span className="inline-flex items-center gap-1.5"><Shield size={14} strokeWidth={2.4} aria-hidden />Security Group 1</span>} />
      </At>
      <At x={T20B.table.x} y={T20B.g1.y + 12}>
        <RuleTable heads={IN_HEADS} rows={rows1} w={T20B.table.w} />
      </At>
      <Fade on={second} className="absolute" style={{ left: T20B.g2.x, top: T20B.g2.y }}>
        <Boundary w={T20B.g2.w} h={T20B.g2.h} solid tone={SG} label={<span className="inline-flex items-center gap-1.5"><Shield size={14} strokeWidth={2.4} aria-hidden />Security Group 2</span>} />
      </Fade>
      <Fade on={second} className="absolute" style={{ left: T20B.table.x, top: T20B.g2.y + 12 }}>
        <RuleTable heads={IN_HEADS} rows={rows2} w={T20B.table.w} />
      </Fade>
      {/* the two chips on one line under the drawing: the console page under the instance, the combined rules under the groups */}
      <Fade on={console} className="absolute" style={{ left: 14, top: T20B.chipY }}>
        <div className="flex items-center gap-2">
          <Logo name="aws" h={18} />
          <Label size={14} strong raised icon={<LayoutDashboard />}>
            EC2 Security Groups Console Page
          </Label>
        </div>
      </Fade>
      <Fade on={combined} className="absolute" style={{ left: 340, top: T20B.chipY }}>
        <div>
          <ToneLabel tone={SG} ink={colors.brandDark} lit icon={<Combine />}>
            Their Allowed Rules Combine
          </ToneLabel>
        </div>
      </Fade>
    </>
  )
}

export function SecurityGroupStacking({ lesson }: { lesson: string }) {
  const k = useBuild(4, 800)
  return (
    <LitFigure
      id="T20-2"
      kicker="Security Groups Explained"
      title="Stateful Instance Filter"
      lesson={lesson}
      points={T20B_POINTS}
      lit={k >= 2 ? 1 : k >= 1 ? 0 : -1}
      figure={<StackingScene k={k} />}
      pointSize={16}
    />
  )
}

/* ===== T21-1 · How a network ACL filters */

const T21_POINTS = [
  { icon: <ArrowLeftRight />, text: 'Being stateless, it must explicitly allow both a request and its reply, since it keeps no memory of the connection' },
  { icon: <Ban />, text: 'Support both allow and deny rules, so specific traffic can be blocked outright' },
  { icon: <ListOrdered />, text: 'Rules are numbered and checked in order; the first matching rule decides the outcome' },
  { icon: <Reply />, text: 'Outbound reply traffic needs its own separate rule because no connection state is kept' },
]

/* the router at the top, the ACL on the line, the subnet below; the rule list on the right (a 546 x 380 stage: the points column is wider so no point runs past two lines) */
const T21 = {
  router: { x: 78, y: 22, size: 46 },
  laneIn: 90,
  laneOut: 112,
  acl: { x: 79, y: 124, w: 44, h: 58 },
  sub: { x: 10, y: 252, w: 190, h: 108 },
  inst: { cx: 101, cy: 318, size: 46 },
  list: { x: 240, y: 172, w: 296 },
  rowH: 30,
} as const

/**
 * A rule's one action (user, 2026-11-05: "each row must show only one value"): Allow or Deny, shown once the card has
 * said both words exist. T21-1 and T21-1b share the rows (Allow, Deny ... as each card's list says).
 */
function RuleAction({ allow, on }: { allow: boolean; on: boolean }) {
  const instant = useInstant()
  return (
    <span className="inline-flex items-center" style={{ opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE}` }}>
      <Label size={14} tone={allow ? 'good' : 'bad'}>
        {allow ? 'Allow' : 'Deny'}
      </Label>
    </span>
  )
}

/** The Router glyph as `Gateway` draws it, without its label so the label can carry an icon of its own. */
function RouterDisc({ size = 46 }: { size?: number }) {
  return (
    <span aria-hidden className="grid place-items-center rounded-full" style={{ width: size, height: size, background: `linear-gradient(180deg, #FFFFFF 0%, ${colors.surface2} 100%)`, color: NET.gateway, boxShadow: `inset 0 0 0 2.5px ${NET.gateway}, 0 10px 20px -12px rgba(16,32,58,0.5)` }}>
      <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="8" x="2" y="14" rx="2" />
        <path d="M6.01 18H6M10.01 18H10M15 10v4M17.84 7.17a4 4 0 0 0-5.66 0M20.66 4.34a8 8 0 0 0-11.31 0" />
      </svg>
    </span>
  )
}

/**
 * T21-1, split in two (FS review, 2026-11-04, slide 52: "split into two slides").
 * `part` 0 (T21-1): stateless, so the request AND its reply are each checked at
 * the ACL; then the allow or deny words. `part` 1 (T21-1b): the rules are read in
 * order: rule 1 matches the request and decides; the reply is read 1, 2, then 3,
 * its own separate rule.
 */
function NetworkAclScene({ k, part }: { k: number; part: 0 | 1 }) {
  const instant = useInstant()
  const request = k >= 1
  const reply = part === 0 ? k >= 2 : k >= 2
  const words = part === 1 || k >= 3
  const reqPass = part === 0 ? k >= 1 : k >= 1
  const first = part === 1 && k >= 1
  const own = part === 1 && k >= 4
  const repPass = part === 0 ? k >= 2 : own
  /* the rule the check is on (part 1): the request matches rule 1; the reply is read 1, 2, 3 */
  const cur = part === 0 ? -1 : k === 1 ? 0 : k >= 2 ? Math.min(2, k - 2) : -1
  const curTone = part === 1 && k >= 2 ? REP : REQ
  const curMatch = k === 1 || k === 4
  const routerBottom = T21.router.y + T21.router.size + 2
  const aclTop = T21.acl.y - 2
  const aclBottom = T21.acl.y + T21.acl.h + 2
  const subTop = T21.sub.y - 2
  /* one action per rule (user, 2026-11-05): T21-1 Allow, Allow, Deny; T21-1b Allow (the request's match), Deny, Allow (the reply's own rule).
     No Port column: it held no port values (the TR gives none), only T21-1b's match ticks, which now sit at the end of the action cell */
  const acts = part === 0 ? [true, true, false] : [true, false, true]
  const rows: RuleRow[] = [
    { cells: ['1', <RuleAction key="w" allow={acts[0]} on={words} />], lit: first, tone: REQ, mark: <Tick tone={REQ} on={first} /> },
    { cells: ['2', <RuleAction key="w" allow={acts[1]} on={words} />] },
    { cells: ['3', <RuleAction key="w" allow={acts[2]} on={words} />], lit: own, tone: REP, mark: <Tick tone={REP} on={own} /> },
  ]
  const rowY = (i: number) => T21.list.y + T21.rowH + i * T21.rowH + T21.rowH / 2
  const checking = part === 0 ? k >= 1 && k <= 2 : k >= 1
  return (
    <>
      <At x={T21.router.x} y={T21.router.y}>
        <div className="flex items-center gap-2">
          <RouterDisc size={T21.router.size} />
          <Label size={14} strong raised>
            Router
          </Label>
        </div>
      </At>
      {/* the two lanes, faint until a packet takes them */}
      <DrawLine x1={T21.laneIn} y1={routerBottom} x2={T21.laneIn} y2={subTop} tone="#C3D3F0" width={1.5} dashed />
      <DrawLine x1={T21.laneOut} y1={routerBottom} x2={T21.laneOut} y2={subTop} tone="#C3D3F0" width={1.5} dashed />
      {/* the request: down to the ACL, checked, then on into the subnet */}
      <Arrow x1={T21.laneIn} y1={routerBottom} x2={T21.laneIn} y2={aclTop} on={request} tone={REQ} />
      <Arrow x1={T21.laneIn} y1={aclBottom} x2={T21.laneIn} y2={subTop} on={reqPass} tone={REQ} />
      <Rider d={`M ${T21.laneIn} ${routerBottom} L ${T21.laneIn} ${subTop}`} on={reqPass} dur={2.2} />
      {/* the reply: up to the ACL, checked on its own, then on to the router */}
      <Arrow x1={T21.laneOut} y1={subTop} x2={T21.laneOut} y2={aclBottom} on={reply} tone={REP} />
      <Arrow x1={T21.laneOut} y1={aclTop} x2={T21.laneOut} y2={routerBottom} on={repPass} tone={REP} />
      <Rider d={`M ${T21.laneOut} ${subTop} L ${T21.laneOut} ${routerBottom}`} on={repPass} dur={2.2} delay={1.1} tone={REP} />
      <AclBar x={T21.acl.x} y={T21.acl.y} w={T21.acl.w} h={T21.acl.h} icon={18} check={checking} />
      {/* part 0: each packet gets its own check at the ACL (no memory of the other) */}
      {part === 0 && (
        <>
          <span className="absolute" style={{ left: T21.acl.x - 34, top: T21.acl.y + 4 }}>
            <Badge on={k >= 1} ring={REQ} size={26} style={{ color: REQ }}>
              <SearchCheck size={14} strokeWidth={2.6} />
            </Badge>
          </span>
          <span className="absolute" style={{ left: T21.acl.x + T21.acl.w + 8, top: T21.acl.y + 28 }}>
            <Badge on={k >= 2} ring={REP} size={26} style={{ color: REP }}>
              <SearchCheck size={14} strokeWidth={2.6} />
            </Badge>
          </span>
        </>
      )}
      <At x={T21.acl.x + T21.acl.w + 12} y={T21.acl.y - 28}>
        <ToneLabel tone={ACL} ink={ACL_D} lit={checking}>
          Network ACL
        </ToneLabel>
      </At>
      <At x={4} y={204}>
        <Label size={14} strong raised style={{ color: colors.ink, boxShadow: `inset 0 0 0 1.5px ${REQ}` }}>
          Request
        </Label>
      </At>
      <At x={T21.laneOut + 14} y={204}>
        <Label size={14} strong raised style={{ color: colors.ink, boxShadow: `inset 0 0 0 1.5px ${REP}` }}>
          Reply
        </Label>
      </At>
      <At x={T21.sub.x} y={T21.sub.y}>
        <SubnetBox w={T21.sub.w} h={T21.sub.h} label="Subnet" />
      </At>
      <At x={T21.inst.cx} y={T21.inst.cy} cx cy>
        <Resource size={T21.inst.size} />
      </At>
      {/* the rule list: its heads, the rows marked by their order; the check walks it from the top */}
      <At x={T21.list.x} y={T21.list.y}>
        <RuleTable heads={['Rule Number', 'Allow or Deny']} rows={rows} w={T21.list.w} cols="1fr 1fr" marks />
      </At>
      {part === 1 && (
        <>
          {/* the check's pointer: beside the rule being read; a down arrow when it does not match and the check moves on, a tick when it does */}
          <span
            aria-hidden
            className="absolute grid place-items-center rounded-full"
            style={{
              left: T21.list.x - 32,
              top: 0,
              width: 24,
              height: 24,
              background: curTone,
              color: colors.white,
              boxShadow: `0 0 0 3px ${colors.white}, 0 6px 14px -6px ${curTone}`,
              opacity: cur >= 0 ? 1 : 0,
              transform: `translateY(${(cur >= 0 ? rowY(cur) : rowY(0)) - 12}px)`,
              transition: instant ? 'none' : `transform 420ms ${EASE}, opacity 300ms ${EASE}, background 300ms ${EASE}`,
            }}
          >
            {/* hidden (before the first rule is read) it keeps the tick it fades in and out with, so a press back never shows the down arrow while it fades */}
            {curMatch || cur < 0 ? <Check size={14} strokeWidth={3.2} /> : <ArrowDown size={14} strokeWidth={3} />}
          </span>
          <Fade on={first} className="absolute" style={{ left: T21.list.x, top: T21.list.y - 40 }}>
            <Label size={14} strong raised icon={<Check />} style={{ color: colors.ink, boxShadow: `inset 0 0 0 1.5px ${REQ}, 0 8px 16px -10px rgba(16,32,58,0.35)` }}>
              First Matching Rule Decides
            </Label>
          </Fade>
          <Fade on={own} className="absolute" style={{ left: T21.list.x, top: T21.list.y + T21.rowH * 4 + 14 }}>
            <Label size={14} strong raised icon={<Reply />} style={{ color: colors.ink, boxShadow: `inset 0 0 0 1.5px ${REP}, 0 8px 16px -10px rgba(16,32,58,0.35)` }}>
              Its Own Separate Rule
            </Label>
          </Fade>
        </>
      )}
    </>
  )
}

/** The points column for both halves: wide enough that no point runs past two lines (FS review, Part 3). */
const T21_POINTS_W = 540

export function NetworkAcl({ lesson }: { lesson: string }) {
  const k = useBuild(4, 900)
  return (
    <LitFigure
      id="T21-1"
      kicker="Network ACLs Explained"
      title="Stateless Subnet Filter"
      lead="A network ACL sits at the subnet boundary and inspects every packet entering or leaving it, independent of any earlier traffic"
      lesson={lesson}
      points={T21_POINTS.slice(0, 2)}
      lit={k >= 3 ? 1 : k >= 1 ? 0 : -1}
      figure={<NetworkAclScene k={k} part={0} />}
      pointsW={T21_POINTS_W}
      pointSize={16}
    />
  )
}

/** T21-1b, the second half of T21-1 (wired by the lead after T21-1): the rules read in order, and the reply's own rule. */
export function NetworkAcl2({ lesson }: { lesson: string }) {
  const k = useBuild(5, 760)
  return (
    <LitFigure
      id="T21-1b"
      kicker="Network ACLs Explained"
      title="Stateless Subnet Filter"
      lesson={lesson}
      points={T21_POINTS.slice(2)}
      lit={k >= 2 ? 1 : k >= 1 ? 0 : -1}
      figure={<NetworkAclScene k={k} part={1} />}
      pointsW={T21_POINTS_W}
      pointSize={16}
    />
  )
}

/* ===== T21-2 · Whole subnet, VPC console */

const T21B_POINTS = [
  { icon: <Boxes />, text: 'Applied to an entire subnet, so every instance inside shares the same rule set' },
  { icon: <LayoutDashboard />, text: "Managed on the VPC console's Network ACLs page, separate from security groups" },
]

/* the TR image's shape: the router at the top, two subnets below, each with its own ACL on the line into it */
const T21B = {
  /* the router a little smaller and lower, so the console chip above it keeps its padding (5.md, slide 56) */
  router: { cx: 317, cy: 80, size: 40 },
  junctionY: 136,
  aclA: { cx: 250, cy: 265, size: 42 },
  aclB: { cx: 384, cy: 265, size: 42 },
  sub1: { x: 24, y: 190, w: 160, h: 140 },
  sub2: { x: 450, y: 190, w: 160, h: 140 },
  instY: 278,
  instXs: [22, 62, 102],
  instSize: 36,
} as const

function AclWholeSubnetScene({ k }: { k: number }) {
  const shared = k >= 1
  const console = k >= 2
  const r = T21B.router
  const routerBottom = r.cy + r.size / 2 + 2
  const aclR = T21B.aclA.size / 2
  const inA = `M ${r.cx} ${routerBottom} L ${r.cx} ${T21B.junctionY} L ${T21B.aclA.cx} ${T21B.junctionY} L ${T21B.aclA.cx} ${T21B.aclA.cy} L ${T21B.sub1.x + T21B.sub1.w + 4} ${T21B.aclA.cy}`
  const inB = `M ${r.cx} ${routerBottom} L ${r.cx} ${T21B.junctionY} L ${T21B.aclB.cx} ${T21B.junctionY} L ${T21B.aclB.cx} ${T21B.aclB.cy} L ${T21B.sub2.x - 4} ${T21B.aclB.cy}`
  return (
    <>
      <At x={r.cx} y={r.cy} cx cy>
        <RouterDisc size={r.size} />
      </At>
      <At x={r.cx + r.size / 2 + 8} y={r.cy - 13}>
        <Label size={14} strong raised>
          Router
        </Label>
      </At>
      <DrawLine x1={r.cx} y1={routerBottom} x2={r.cx} y2={T21B.junctionY} tone={NET.boundary} />
      <DrawLine x1={T21B.aclA.cx} y1={T21B.junctionY} x2={T21B.aclB.cx} y2={T21B.junctionY} tone={NET.boundary} />
      <DrawLine x1={T21B.aclA.cx} y1={T21B.junctionY} x2={T21B.aclA.cx} y2={T21B.aclA.cy - aclR - 2} tone={NET.boundary} />
      <DrawLine x1={T21B.aclB.cx} y1={T21B.junctionY} x2={T21B.aclB.cx} y2={T21B.aclB.cy - aclR - 2} tone={NET.boundary} />
      <Rider d={inA} on={shared} dur={3} />
      <Rider d={inB} on={shared} dur={3} delay={1.5} size={12} tone="#8FA3BF" />
      <At x={T21B.aclA.cx} y={T21B.aclA.cy} cx cy>
        <AclDisc size={T21B.aclA.size} lit={shared} />
      </At>
      <At x={T21B.aclB.cx} y={T21B.aclB.cy} cx cy>
        <AclDisc size={T21B.aclB.size} />
      </At>
      <At x={T21B.aclA.cx} y={T21B.aclA.cy + aclR + 10} cx>
        <ToneLabel tone={ACL} ink={ACL_D} lit={shared}>
          Network ACL A
        </ToneLabel>
      </At>
      <At x={T21B.aclB.cx} y={T21B.aclB.cy + aclR + 10} cx>
        <ToneLabel tone={ACL} ink={ACL_D}>
          Network ACL B
        </ToneLabel>
      </At>
      <Arrow x1={T21B.aclA.cx - aclR - 2} y1={T21B.aclA.cy} x2={T21B.sub1.x + T21B.sub1.w + 2} y2={T21B.aclA.cy} both tone={ACL_D} />
      <Arrow x1={T21B.aclB.cx + aclR + 2} y1={T21B.aclB.cy} x2={T21B.sub2.x - 2} y2={T21B.aclB.cy} both tone={ACL_D} />
      {/* each subnet's edge is its ACL's: teal when its rules are the ones being applied */}
      <At x={T21B.sub1.x} y={T21B.sub1.y}>
        <SubnetBox w={T21B.sub1.w} h={T21B.sub1.h} label="Subnet 1" style={shared ? { boxShadow: `inset 0 0 0 2.5px ${ACL}, 0 0 0 5px ${ACL}30` } : undefined} />
      </At>
      <At x={T21B.sub2.x} y={T21B.sub2.y}>
        <SubnetBox w={T21B.sub2.w} h={T21B.sub2.h} label="Subnet 2" />
      </At>
      {T21B.instXs.map((dx, i) => (
        <At key={`a${dx}`} x={T21B.sub1.x + dx} y={T21B.instY - T21B.instSize / 2}>
          <div className="relative">
            <Resource size={T21B.instSize} />
            {/* the one rule set, reaching every instance inside */}
            <span className="absolute" style={{ right: -9, top: -11 }}>
              <Badge on={shared} ring={ACL} size={22} style={{ color: ACL_D, transitionDelay: `${i * 140}ms` }}>
                <ScrollText size={12} strokeWidth={2.6} />
              </Badge>
            </span>
          </div>
        </At>
      ))}
      {T21B.instXs.map((dx) => (
        <At key={`b${dx}`} x={T21B.sub2.x + dx} y={T21B.instY - T21B.instSize / 2}>
          <Resource size={T21B.instSize} />
        </At>
      ))}
      <Fade on={shared} className="absolute" style={{ left: T21B.sub1.x + T21B.sub1.w / 2, top: T21B.sub1.y + T21B.sub1.h + 8 }}>
        <div style={{ transform: 'translateX(-50%)' }}>
          <ToneLabel tone={ACL} ink={ACL_D} lit icon={<ScrollText />}>
            Same Rule Set
          </ToneLabel>
        </div>
      </Fade>
      <Fade on={console} className="absolute" style={{ left: 22, top: 22 }}>
        <div className="flex items-center gap-2">
          <Logo name="aws" h={18} />
          <Label size={14} strong raised icon={<LayoutDashboard />}>
            VPC Console's Network ACLs Page
          </Label>
        </div>
      </Fade>
    </>
  )
}

export function AclWholeSubnet({ lesson }: { lesson: string }) {
  const k = useBuild(3, 900)
  return (
    <LitFigure
      id="T21-2"
      kicker="Network ACLs Explained"
      title="Stateless Subnet Filter"
      lesson={lesson}
      points={T21B_POINTS}
      lit={k - 1}
      figure={<AclWholeSubnetScene k={k} />}
    />
  )
}

/* ===== T22-1 · Groups and ACLs, side by side */

const ICON_CELL = (icon: ReactNode, text: ReactNode, tone: string) => (
  <span className="flex items-center gap-2">
    <span aria-hidden className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full [&>svg]:h-[13px] [&>svg]:w-[13px]" style={{ background: `${tone}1F`, color: tone }}>
      {icon}
    </span>
    <span className="min-w-0">{text}</span>
  </span>
)

export function GroupsVsAcls({ lesson }: { lesson: string }) {
  return (
    <Card
      id="T22-1"
      kicker="Groups Vs ACLs"
      title="Side By Side"
      lead={lead('Security groups and network ACLs operate at different layers, so a workload normally passes through both as a two-tier filter rather than relying on just one')}
      lesson={lesson}
    >
      <div style={{ width: BOX_W }}>
        <VisualTable
          compact
          columns={[
            { label: 'Aspect', weight: 0.7, icon: <ListChecks /> },
            { label: 'Security Group', weight: 1.25, icon: <Shield /> },
            { label: 'Network ACL', weight: 1.45, icon: <ListOrdered /> },
          ]}
          rows={[
            { icon: <Crosshair />, cells: ['Scope', ICON_CELL(<Server />, 'Instance / interface', SG), ICON_CELL(<Network />, 'Entire subnet', ACL_D)] },
            { icon: <History />, cells: ['State', 'Stateful, return traffic automatic', 'Stateless, needs rule each way'] },
            { icon: <ListFilter />, cells: ['Rule Type', ICON_CELL(<Check />, 'Allow only', colors.success), ICON_CELL(<Ban />, 'Allow and deny', colors.danger)] },
            { icon: <Scale />, cells: ['Evaluation', 'All rules together', 'Numbered, first match wins'] },
            { icon: <Settings2 />, cells: ['Default', 'Inbound denied, all outbound allowed', 'Default ACL allows all; a new custom ACL denies all'] },
          ]}
          highlight={[1, 2]}
        />
      </div>
    </Card>
  )
}

/* ===== T23-1 · Least privilege, both layers */

const T23_POINTS = [
  { icon: <Layers />, text: 'Security groups and network ACLs together implement this by narrowing both the instance-level and subnet-level entry points' },
  { icon: <Lock />, text: 'Open only the exact ports a workload needs, such as port 443 for a web tier' },
  { icon: <Crosshair />, text: 'Restrict allowed sources to specific IP ranges or security group IDs, not open to all' },
  { icon: <ShieldX />, text: 'Use a network ACL as a subnet-wide backstop to explicitly deny traffic a group might miss' },
  { icon: <CalendarClock />, text: 'Review rules periodically, since an unused open port is a common cause of breaches' },
]

type Stage = { y: number; h: number; top: number; bot: number }
/**
 * The funnel at a centre and a scale: the mouth, then the ACL's stage, then the group's stage (user, 2026-11-05:
 * "put ACL Rules where Security Group Rules are, and Security Group Rules where ACL Rules are"; traffic meets the
 * subnet's ACL before the instance's group). Each layer moved whole: its colour, label, icon and side tile go with
 * it. The group's stage keeps the taller band because two chips point at it; the sides keep one straight narrowing.
 */
function funnel(cx: number, s: number) {
  const st = (y: number, h: number, top: number, bot: number): Stage => ({ y, h, top: top * s, bot: bot * s })
  /* the sides narrow less steeply than before the swap: the group's long label now sits on the lowest stage and must still fit inside it */
  return { cx, mouth: st(40, 62, 340, 304), acl: st(106, 74, 304, 276), sg: st(184, 86, 276, 246), outlet: 270 }
}
type Fun = ReturnType<typeof funnel>

/** One trapezoid of the funnel: a div clipped to the shape, its label chip centred on it. */
function FunnelStage({ f, s, fill, on, label, icon, tone = 'plain' }: { f: Fun; s: Stage; fill: string; on: boolean; label: ReactNode; icon: ReactNode; tone?: 'brand' | 'plain' }) {
  const w = s.top
  const inset = (s.top - s.bot) / 2
  const style: CSSProperties = { width: w, height: s.h, background: fill, clipPath: `polygon(0 0, 100% 0, ${w - inset}px 100%, ${inset}px 100%)` }
  return (
    <Fade on={on} lift={-10} className="absolute" style={{ left: f.cx - w / 2, top: s.y }}>
      <div aria-hidden style={style} />
      <div className="absolute inset-0 grid place-items-center" style={{ zIndex: 6 }}>
        <Label size={14} strong tone={tone} raised icon={icon}>
          {label}
        </Label>
      </div>
    </Fade>
  )
}

/** Where a stage's right edge is at a height. */
function edgeAt(f: Fun, s: Stage, y: number, side: 1 | -1 = 1) {
  const t = (y - s.y) / s.h
  return f.cx + side * (s.top / 2 - ((s.top - s.bot) / 2) * t)
}

/** Traffic poured into the funnel: most of it stopped at a stage (a red cross where it stops), one packet through to the outlet. */
function FunnelTraffic({ f, on }: { f: Fun; on: boolean }) {
  const drops: { dx: number; to: number; dur: number; delay: number; stop: boolean }[] = [
    /* the wide drops stop at the upper layer (the ACL), the near-centre ones at the lower (the group), so every cross sits inside the funnel */
    { dx: -0.36, to: f.acl.y + 10, dur: 2.6, delay: 0, stop: true },
    { dx: 0, to: f.outlet + 22, dur: 3.4, delay: 0.5, stop: false },
    { dx: 0.3, to: f.sg.y + 12, dur: 3.0, delay: 1.2, stop: true },
    { dx: -0.16, to: f.sg.y + 12, dur: 3.0, delay: 2.1, stop: true },
    { dx: 0.38, to: f.acl.y + 10, dur: 2.6, delay: 1.7, stop: true },
  ]
  return (
    <>
      {drops.map((p, i) => {
        const x = f.cx + p.dx * f.mouth.top
        return (
          <span key={i}>
            <Rider d={`M ${x} 18 L ${x} ${p.to}`} anim={DROP} dur={p.dur} delay={p.delay} size={12} tone={p.stop ? '#8FA3BF' : REQ} on={on} />
            {p.stop && (
              <Ping x={x} y={p.to} anim={DROP_X} dur={p.dur} delay={p.delay} on={on}>
                <Disc tone={colors.danger} size={20}><X size={12} strokeWidth={3.4} /></Disc>
              </Ping>
            )}
          </span>
        )
      })}
    </>
  )
}

function FunnelBody({ f, stages }: { f: Fun; stages: boolean }) {
  return (
    <>
      <FunnelStage f={f} s={f.mouth} fill={`${colors.brand}22`} on label="All Traffic" icon={<Globe />} tone="brand" />
      <FunnelStage f={f} s={f.acl} fill={ACL} on={stages} label="ACL Rules" icon={<ListOrdered />} />
      <FunnelStage f={f} s={f.sg} fill={SG} on={stages} label="Security Group Rules" icon={<Shield />} />
      <FunnelTraffic f={f} on={stages} />
      <Arrow x1={f.cx} y1={f.outlet + 4} x2={f.cx} y2={f.outlet + 26} on={stages} tone={colors.success} />
      <Fade on={stages} className="absolute" style={{ left: f.cx, top: f.outlet + 30 }}>
        <div style={{ transform: 'translateX(-50%)' }}>
          <Label size={14} strong tone="good" raised icon={<ShieldCheck />}>
            Allowed Traffic Only
          </Label>
        </div>
      </Fade>
    </>
  )
}

/** A level marker beside a stage (T23-1: the subnet level beside the ACL's stage on top, the instance level beside the group's below). */
function LevelTile({ x, y, tone, on, children }: { x: number; y: number; tone: string; on: boolean; children: ReactNode }) {
  return (
    <Fade on={on} className="absolute" style={{ left: x - 26, top: y - 26 }}>
      <span aria-hidden className="grid place-items-center rounded-[14px] [&>svg]:h-[26px] [&>svg]:w-[26px]" style={{ width: 52, height: 52, ...TILE_SKIN, color: tone, boxShadow: `inset 0 0 0 2px ${tone}, 0 10px 20px -12px rgba(16,32,58,0.5)` }}>
        {children}
      </span>
    </Fade>
  )
}

/*
  ONE FUNNEL, TWO STAGES OF IT (FS review: paired slides keep identical styling and positions; Part 3 line
  limits): T23-1 and T23-1b share the 580px points column and this geometry on a 506px stage. The funnel sits
  left; the right column (from LP.chipX) holds what each card adds beside the stage it acts on.
*/
const LP = (() => {
  const f = funnel(150, 0.78)
  return { f, chipX: 290, portY: f.sg.y + 30, srcY: f.sg.y + 66, aclY: f.acl.y + 36, tileX: 470 } as const
})()

function PortChip({ on = true }: { on?: boolean }) {
  const { f, chipX, portY } = LP
  return (
    <>
      <Fade on={on} className="absolute" style={{ left: chipX, top: portY - 14 }}>
        <Label size={14} strong raised icon={<Lock />}>
          Port <Mono>443</Mono>
        </Label>
      </Fade>
      <Arrow x1={chipX - 4} y1={portY} x2={edgeAt(f, f.sg, portY) + 4} y2={portY} on={on} />
    </>
  )
}

function LeastPrivilegeScene({ k }: { k: number }) {
  /* the mouth; its two stages and the outlet (instance level, subnet level); port 443 */
  const stages = k >= 1
  const port = k >= 2
  const { f, tileX } = LP
  const sgY = f.sg.y + f.sg.h / 2 + 14
  const aclY = f.acl.y + f.acl.h / 2 + 14
  return (
    <>
      <FunnelBody f={f} stages={stages} />
      {/* the two entry points: the instance (the group's level) and the subnet (the ACL's), each tied to its stage */}
      <LevelTile x={tileX} y={sgY} tone={SG} on={stages}>
        <Server />
      </LevelTile>
      <DrawLine x1={tileX - 30} y1={sgY} x2={edgeAt(f, f.sg, sgY) + 6} y2={sgY} tone={SG} dashed on={stages} />
      <LevelTile x={tileX} y={aclY} tone={ACL_D} on={stages}>
        <Network />
      </LevelTile>
      <DrawLine x1={tileX - 30} y1={aclY} x2={edgeAt(f, f.acl, aclY) + 6} y2={aclY} tone={ACL_D} dashed on={stages} />
      {/* the exact port the web tier needs */}
      <PortChip on={port} />
      {/* the next card's three chips, held hidden here as they always were on this card (its DOM text is unchanged; they show on T23-1b) */}
      <div aria-hidden className="pointer-events-none absolute flex flex-col" style={{ left: 196, top: 266, opacity: 0 }}>
        <Label size={14}>Specific IP Ranges or Security Group IDs</Label>
        <Label size={14}>Explicit Deny</Label>
        <Label size={14}>Review</Label>
        <Label size={14}>Unused Open Port</Label>
      </div>
    </>
  )
}

function LeastPrivilegeScene2({ k }: { k: number }) {
  /* the complete funnel and port 443; then the sources, the explicit deny, the review */
  const sources = k >= 1
  const deny = k >= 2
  const review = k >= 3
  const { f, chipX, srcY, aclY } = LP
  return (
    <>
      <FunnelBody f={f} stages />
      <PortChip />
      {/* the allowed sources: the one long chip wraps to two lines in the right column, its arrow on the first line */}
      <Fade on={sources} className="absolute" style={{ left: chipX, top: srcY - 14 }}>
        <Label size={14} strong raised icon={<Crosshair />} style={{ whiteSpace: 'normal', width: 206, alignItems: 'flex-start', borderRadius: 14, paddingTop: 4, paddingBottom: 4 }}>
          Specific IP Ranges or Security Group IDs
        </Label>
      </Fade>
      <Arrow x1={chipX - 4} y1={srcY} x2={edgeAt(f, f.sg, srcY) + 4} y2={srcY} on={sources} />
      {/* the ACL stage: the explicit deny */}
      <Fade on={deny} className="absolute" style={{ left: chipX, top: aclY - 14 }}>
        <span className="inline-flex items-center gap-2">
          <NoMark size={24} on={deny} />
          <Label size={14} strong tone="bad" raised>
            Explicit Deny
          </Label>
        </span>
      </Fade>
      <Arrow x1={chipX - 4} y1={aclY} x2={edgeAt(f, f.acl, aclY) + 4} y2={aclY} on={deny} tone={NET.blocked} />
      {/* under the outlet: the review, one unused open port crossed out */}
      <Fade on={review} className="absolute" style={{ left: 16, top: f.outlet + 66 }}>
        <span className="inline-flex items-center gap-2">
          <Label size={14} strong tone="brand" raised icon={<SearchCheck />}>
            Review
          </Label>
          <Label size={14} tone="muted" raised style={{ textDecoration: 'line-through', textDecorationThickness: 2, textDecorationColor: NET.blocked }}>
            Unused Open Port
          </Label>
          <NoMark size={22} on={review} />
        </span>
      </Fade>
    </>
  )
}

/** T23-1's points column: wide enough that its first point holds to two lines (FS review, Part 3); the funnel refits to the 506px stage. */
const LP_POINTS_W = 580

/** T23-1, split in two (user, 2026-10-30, G6): the lead and the first two points with the funnel; then the three remaining points. */
export function LeastPrivilege({ lesson }: { lesson: string }) {
  const k = useBuild(3, 900)
  return (
    <LitFigure
      id="T23-1"
      kicker="Least Privilege Design"
      title="Combining Both Layers"
      lead="Least-privilege design means granting a workload only the network access it genuinely needs, nothing wider"
      lesson={lesson}
      points={T23_POINTS.slice(0, 2)}
      lit={k - 1}
      figure={<LeastPrivilegeScene k={k} />}
      pointsW={LP_POINTS_W}
      pointSize={16}
    />
  )
}

export function LeastPrivilege2({ lesson }: { lesson: string }) {
  const k = useBuild(4, 900)
  return (
    <LitFigure
      id="T23-1b"
      kicker="Least Privilege Design"
      title="Combining Both Layers"
      lesson={lesson}
      points={T23_POINTS.slice(2)}
      lit={k - 1}
      figure={<LeastPrivilegeScene2 k={k} />}
      pointsW={LP_POINTS_W}
      pointSize={16}
    />
  )
}

/** This section's micro-animations (visual pass, 2026-11-04), appended to the deck's CSS by `netDeck.tsx`. */
export const SECURITY_CSS = BASE_CSS + KEYS.join('\n')
