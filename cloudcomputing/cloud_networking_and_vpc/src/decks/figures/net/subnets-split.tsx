import type { CSSProperties, ReactNode } from 'react'
import { Calculator, Cloud, Copy, Eye, Globe, Layers, Lock, MapPin, Network, Route, Server, ShieldCheck, Tag } from 'lucide-react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Arrow, At, BOX_W, Card, Fade, Label, STILL, Stage, useBuild } from '../scene'
import { Badge, fx, Ripple } from './fx'
import { VisualTable } from './vtable'
import { Boundary, Gateway, Mono, NET, NoMark, SubnetBox } from './frames'
import { Cidr, EASE, Host, IconText, onRim, Packet, ThinBoundary } from './subnets-parts'

/**
 * T09-1, T09-2 and T10-1 · THE WORKED SPLIT AND PUBLIC VS PRIVATE.
 *   T09-1  the split as Session 4's `VisualTable`: a subnet icon per row (a globe on a public
 *          subnet, a lock on a private one), a pin on each zone cell in the zone's own colour,
 *          the Type cell as its subnet's coloured tag; rows built one by one
 *   T09-2  the split drawn, then each subnet's 251, the four gathered into 1004, the 65,536 and
 *          the sliver of it the four use
 *   T10-1  the table built row by row with the drawing beside it following the same press
 */

export const SPLIT_ROWS = [
  { cidr: '10.0.1.0/24', zone: 'ap-south-1a', type: 'Public' },
  { cidr: '10.0.2.0/24', zone: 'ap-south-1a', type: 'Private' },
  { cidr: '10.0.3.0/24', zone: 'ap-south-1b', type: 'Public' },
  { cidr: '10.0.4.0/24', zone: 'ap-south-1b', type: 'Private' },
] as const

export const ZONES = ['ap-south-1a', 'ap-south-1b'] as const
/** One colour per zone (G4: parallel paths, distinct colours). */
export const ZONE_TONE: Record<string, string> = { 'ap-south-1a': colors.brand, 'ap-south-1b': colors.accentDark }

/* ===== T09-1 · The worked split, row by row */

/** A subnet's type as its own coloured tag (green public, teal private), the word unchanged. */
function TypeTag({ type }: { type: 'Public' | 'Private' }) {
  const tone = type === 'Public' ? NET.public : NET.private
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill py-[3px] pl-1.5 pr-3 font-heading font-semibold leading-tight" style={{ color: colors.white, background: tone, boxShadow: `0 6px 12px -8px ${tone}` }}>
      <span aria-hidden className="grid h-[20px] w-[20px] place-items-center rounded-full" style={{ background: 'rgba(255,255,255,0.22)' }}>
        {type === 'Public' ? <Globe size={13} strokeWidth={2.6} /> : <Lock size={12} strokeWidth={2.8} />}
      </span>
      {type}
    </span>
  )
}

/** T09-1: the table alone across the body (user, 2026-10-30: "remove the right-side visual, keep only the left table and adjust spacing"). */
export function WorkedSplit({ lesson }: { lesson: string }) {
  return (
    <Card
      id="T09-1"
      kicker="Worked Subnet Split"
      title="Two Zones Four Subnets"
      lead={
        <>
          A VPC block of <Mono>10.0.0.0/16</Mono> is split into four <Mono>/24</Mono> subnets, pairing one public and one private subnet inside each of two availability zones for fault isolation
        </>
      }
      lesson={lesson}
    >
      <div style={{ width: BOX_W }}>
        <VisualTable
          size={18}
          columns={[
            { label: 'Subnet CIDR', icon: <Network size={16} />, weight: 1 },
            { label: 'Availability Zone', icon: <MapPin size={16} />, weight: 1.1 },
            { label: 'Type', icon: <Tag size={16} />, weight: 0.8 },
          ]}
          rows={SPLIT_ROWS.map((r) => ({
            icon: r.type === 'Public' ? <Globe size={18} /> : <Lock size={18} />,
            cells: [
              <b key="c" className="font-heading font-semibold">
                <Mono>{r.cidr}</Mono>
              </b>,
              <span key="z" className="inline-flex items-center gap-2">
                <MapPin aria-hidden size={18} strokeWidth={2.4} color={ZONE_TONE[r.zone]} className="sb-hop" />
                <Mono>{r.zone}</Mono>
              </span>,
              <TypeTag key="t" type={r.type} />,
            ],
          }))}
        />
      </div>
    </Card>
  )
}

/* ===== T09-2 · What the split adds up to */

const T09_2_POINT: ReactNode = (
  <>
    Each <Mono>/24</Mono> subnet carries 251 usable addresses after AWS reservations, so the four subnets together offer 1004 usable addresses out of the 65,536 the <Mono>/16</Mono> block holds
  </>
)

/* the split drawing on a 634 x 350 stage under its description: the VPC box, the zone chips clear of its label (FS review:
   the 10.0.0.0/16 and ap-south-1a chips overlapped), two zone columns, public on top, private below, the total row under them */
const S9_W = 634
const S9_H = 350
const S9 = {
  vpc: { x: 20, y: 24, w: 594, h: 310 },
  headY: 52,
  colX: [40, 327],
  colW: 267,
  rowY: [92, 190],
  rowH: 86,
  chipY: 55,
  totalY: 290,
  bar: { x: 186, w: 408, h: 12 },
}
/** where a subnet's "251 usable" chip sits: under its CIDR */
const chipAt = (i: number) => ({ x: S9.colX[i < 2 ? 0 : 1] + 8, y: S9.rowY[i % 2] + S9.chipY })
const TOTAL = { x: 40, y: S9.totalY }

/**
 * THE WORKED SPLIT, drawn (T09-2's build, `k` 0 to 3): the VPC `10.0.0.0/16`
 * holding two zone columns, a Public subnet (its server stack) on top and a
 * Private one (its database) below, each with its CIDR; then each subnet's
 * "251 usable"; then the four counts gather into "1004 usable"; then the VPC's
 * 65,536 and, on the bar beside the total, the sliver of it the four use.
 */
function SplitTotalsScene({ k }: { k: number }) {
  const instant = useInstant()
  const each = k >= 1
  const sum = k >= 2
  const whole = k >= 3
  const share = Math.max(6, (S9.bar.w * 1004) / 65536)
  return (
    <>
      <At x={S9.vpc.x} y={S9.vpc.y}>
        <ThinBoundary dashed w={S9.vpc.w} h={S9.vpc.h} label={<IconText icon={<Cloud size={13} strokeWidth={2.4} />}><span className="font-mono" style={{ fontVariantLigatures: 'none' }}>10.0.0.0/16</span></IconText>} />
      </At>
      {/* the /16 block's size, on the VPC box */}
      <At x={S9.vpc.x + S9.vpc.w - 14} y={S9.vpc.y} style={{ transform: 'translate(-100%, -50%)' }}>
        <Fade on={whole} lift={0}>
          <Cidr tone="brand" strong raised>
            65,536
          </Cidr>
        </Fade>
      </At>
      {ZONES.map((z, i) => (
        <At key={z} x={S9.colX[i] + S9.colW / 2} y={S9.headY} cx>
          <Cidr tone="brand" strong icon={<MapPin color={ZONE_TONE[z]} />}>
            {z}
          </Cidr>
        </At>
      ))}
      {SPLIT_ROWS.map((r, i) => {
        const col = i < 2 ? 0 : 1
        const row = i % 2
        const pub = r.type === 'Public'
        return (
          <At key={r.cidr} x={S9.colX[col]} y={S9.rowY[row]}>
            <SubnetBox w={S9.colW} h={S9.rowH} kind={pub ? 'public' : 'private'} label={r.type} cidr={r.cidr}>
              <At x={S9.colW - 14} y={S9.rowH / 2} style={{ transform: 'translate(-100%, -50%)' }}>
                {/* the quiet loop after the build: each host breathes on its own phase */}
                <span className={`block ${fx('lift', i * 0.6, 2.8).className}`} style={fx('lift', i * 0.6, 2.8).style}>
                  <Host icon={pub ? 'server-stack' : 'database'} size={46} />
                </span>
              </At>
              <At x={8} y={S9.chipY}>
                <Fade on={each} lift={6} delay={i * 160}>
                  <Cidr size={14} strong>
                    251 Usable
                  </Cidr>
                </Fade>
              </At>
            </SubnetBox>
          </At>
        )
      })}
      {/* the four counts gather into the total: each chip sends a token down to it, then the total lands */}
      {sum &&
        !STILL &&
        !instant &&
        SPLIT_ROWS.map((r, i) => {
          const c = chipAt(i)
          return (
            <span
              key={`g${r.cidr}`}
              aria-hidden
              className="sb-gather pointer-events-none absolute rounded-full"
              style={{ left: c.x + 40, top: c.y + 6, width: 14, height: 14, background: colors.brand, boxShadow: `0 0 0 4px ${colors.brand}33`, zIndex: 4, animationDelay: `${i * 90}ms`, '--dx': `${TOTAL.x + 50 - (c.x + 40)}px`, '--dy': `${TOTAL.y + 4 - (c.y + 6)}px` } as CSSProperties}
            />
          )
        })}
      <At x={TOTAL.x} y={TOTAL.y}>
        <Fade on={sum} lift={0} delay={sum && !STILL ? 900 : 0}>
          <Cidr tone="solid" strong raised icon={<Calculator />}>
            1004 Usable
          </Cidr>
        </Fade>
      </At>
      {/* the bar: the whole /16 as its track, the four subnets' share as the sliver at its start */}
      <At x={S9.bar.x} y={TOTAL.y + 6}>
        <Fade on={whole} lift={0}>
          <span aria-hidden className="relative block overflow-hidden rounded-full" style={{ width: S9.bar.w, height: S9.bar.h, background: colors.surface2, boxShadow: `inset 0 0 0 1.5px ${colors.line}` }}>
            <span className={`absolute inset-y-0 left-0 rounded-full ${whole ? fx('glow', 0, 1.8).className : ''}`} style={{ ...(whole ? fx('glow', 0, 1.8).style : {}), width: share, background: NET.lit, transform: whole ? 'scaleX(1)' : 'scaleX(0)', transformOrigin: 'left', transition: instant ? 'none' : `transform 600ms ${EASE} 500ms` }} />
          </span>
        </Fade>
      </At>
    </>
  )
}

/**
 * T09-2 (FS review 2026-11-04: "move the sentence above the right visual and keep it as a description; centre the
 * description and the visual together, horizontally on the slide"): the TR's one point is the description over the
 * drawing, the two one centred column; its words unchanged.
 */
export function SplitTotals({ lesson }: { lesson: string }) {
  const k = useBuild(4, 1400, 1300)
  return (
    <Card id="T09-2" kicker="Worked Subnet Split" title="Two Zones Four Subnets" lesson={lesson}>
      <div className="flex flex-col items-center" style={{ width: BOX_W, gap: 18 }}>
        <p className="text-center leading-snug" style={{ maxWidth: 900, fontSize: 20, color: colors.ink }}>
          {T09_2_POINT}
        </p>
        <Stage w={S9_W} h={S9_H} active={false}>
          <SplitTotalsScene k={k} />
        </Stage>
      </div>
    </Card>
  )
}

/* ===== T10-1 · Public or private, by route */

const PP_ROWS = [
  ['Internet-Bound Route', 'Points to an internet gateway', 'No direct internet gateway route'],
  ['Typical Resources', 'Load balancers, bastion hosts', 'Databases, internal application servers'],
  ['Public IP Exposure', 'Instances can hold a public IP', 'Instances cannot be reached directly from the internet'],
  ['Zone Pairing', 'Mirrored in every AZ used', 'Mirrored in every AZ used'],
]
const PP_ICONS: ReactNode[] = [<Route key="0" size={18} />, <Server key="1" size={18} />, <Eye key="2" size={18} />, <Layers key="3" size={18} />]

const TABLE10_W = 640
const STAGE10_W = BOX_W - TABLE10_W - 24
const STAGE10_H = 330

/* the drawing on a 446 x 330 stage: the gateway on the VPC's top edge, the two subnets under it */
const S10 = {
  vpc: { x: 18, y: 88, w: 410, h: 226 },
  igw: { cx: 223, cy: 88, r: 22 },
  box: { y: 140, w: 180, h: 142, x: [36, 230] },
}

/**
 * T10-1's drawing, one state per table row (`k`, 0 to 4):
 *   0  the VPC, the internet gateway, the two subnets, each with one host
 *   1  Internet-bound route: the public subnet's line up to the gateway (traffic riding it); the
 *      private one gains none, a stop on its edge
 *   2  Typical resources: each subnet's own pair of hosts (a load balancer's network and a server
 *      stack; a database and a server stack)
 *   3  Public IP exposure: a public address on the public hosts, the internet's traffic reaching
 *      them down the line; a shield on the private hosts
 *   4  Zone pairing: each subnet's mirror slides out behind it
 */
function PublicPrivateScene({ k }: { k: number }) {
  const instant = useInstant()
  const route = k >= 1
  const kinds = k >= 2
  const exposed = k >= 3
  const mirrored = k >= 4
  const x1 = S10.box.x[0] + 132
  const y1 = S10.box.y
  const end = onRim(x1, y1, S10.igw)
  const B = S10.box
  const hosts = (pub: boolean) => {
    const pair: ('network' | 'server-stack' | 'database')[] = pub ? ['network', 'server-stack'] : ['database', 'server-stack']
    return (
      <>
        {/* one host until the row on resources, then the subnet's own two */}
        <At x={B.w / 2} y={84} cx cy>
          <Host icon="server-stack" size={48} on={!kinds} />
        </At>
        {pair.map((icon, i) => (
          <At key={icon} x={B.w / 2 + (i === 0 ? -32 : 32)} y={84} cx cy>
            <Host
              icon={icon}
              size={50}
              on={kinds}
              delay={i * 160}
              badge={
                pub ? (
                  <Badge on={exposed} size={22} ring={NET.public}>
                    <Globe size={12} strokeWidth={2.8} color={NET.public} />
                  </Badge>
                ) : (
                  <Badge on={exposed} size={22} ring={NET.private}>
                    <ShieldCheck size={12} strokeWidth={2.8} color={NET.private} />
                  </Badge>
                )
              }
            />
          </At>
        ))}
      </>
    )
  }
  const mirror = (x: number, tone: string, d: number) => (
    <At x={x} y={B.y}>
      <div
        aria-hidden
        className="relative rounded-[14px]"
        style={{
          width: B.w,
          height: B.h,
          border: `2px dashed ${tone}`,
          background: `${tone}10`,
          opacity: mirrored ? 1 : 0,
          transform: mirrored ? 'translate(9px, 10px)' : 'translate(0, 0)',
          transition: instant ? 'none' : `opacity 300ms ${EASE} ${d}ms, transform 560ms ${EASE} ${d}ms`,
        }}
      >
        <span className="absolute" style={{ right: -10, bottom: -10 }}>
          <Badge on={mirrored} size={24} ring={tone}>
            <Copy size={13} strokeWidth={2.6} color={tone} />
          </Badge>
        </span>
      </div>
    </At>
  )
  return (
    <>
      <At x={S10.vpc.x} y={S10.vpc.y}>
        <Boundary w={S10.vpc.w} h={S10.vpc.h} label={<IconText icon={<Cloud size={13} strokeWidth={2.4} />}>VPC</IconText>} />
      </At>
      <At x={S10.igw.cx} y={S10.igw.cy - 44} cx cy>
        <Label size={14} strong raised>
          Internet Gateway
        </Label>
      </At>
      <Ripple x={S10.igw.cx} y={S10.igw.cy} r={S10.igw.r} tone={NET.public} on={route} />
      <At x={S10.igw.cx} y={S10.igw.cy} cx cy>
        <Gateway kind="igw" size={S10.igw.r * 2} />
      </At>
      {mirror(B.x[0], NET.public, 0)}
      {mirror(B.x[1], NET.private, 160)}
      <At x={B.x[0]} y={B.y}>
        <SubnetBox w={B.w} h={B.h} kind="public" label="Public Subnet">
          {hosts(true)}
        </SubnetBox>
      </At>
      <At x={B.x[1]} y={B.y}>
        <SubnetBox w={B.w} h={B.h} kind="private" label="Private Subnet">
          {hosts(false)}
        </SubnetBox>
      </At>
      {/* the public subnet's route: from its top edge up to the gateway's rim; the private one gains none */}
      <Arrow x1={x1} y1={y1} x2={end.x2} y2={end.y2} on={route} tone={NET.public} />
      <Packet x1={x1} y1={y1} x2={end.x2} y2={end.y2} on={route} tone={NET.public} delay={1} dur={1.7} />
      {/* the internet reaching the public hosts down the same line */}
      <Packet x1={end.x2} y1={end.y2} x2={x1 - 12} y2={y1 + 50} on={exposed} tone={colors.accent} delay={0.6} dur={1.9} />
      <At x={B.x[1] + B.w - 34} y={B.y} cx cy>
        <NoMark size={26} on={route} />
      </At>
    </>
  )
}

export function PublicPrivate({ lesson }: { lesson: string }) {
  const k = useBuild(5, 1000, 1200)
  return (
    <Card id="T10-1" kicker="Public Vs Private" title="Classification By Route" lead="A subnet is labelled public or private by what its route table sends internet-bound traffic to, not by its name or tag" lesson={lesson}>
      <div className="flex items-center" style={{ width: BOX_W, gap: 24 }}>
        <div className="shrink-0" style={{ width: TABLE10_W }}>
          <VisualTable
            compact
            shown={k}
            columns={[
              { label: 'Aspect', icon: <Tag size={16} />, weight: 0.95 },
              { label: 'Public Subnet', icon: <Globe size={16} color={NET.public} />, weight: 1 },
              { label: 'Private Subnet', icon: <Lock size={16} color={NET.private} />, weight: 1.1 },
            ]}
            rows={PP_ROWS.map((r, i) => ({ icon: PP_ICONS[i], cells: [r[0], r[1], r[2]] }))}
          />
        </div>
        <Stage w={STAGE10_W} h={STAGE10_H} active={false}>
          <PublicPrivateScene k={k} />
        </Stage>
      </div>
    </Card>
  )
}

export const SPLIT_CSS = ``
