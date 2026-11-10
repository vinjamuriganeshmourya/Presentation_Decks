import type { ReactNode } from 'react'
import { Ban, Globe, Hash, Layers, Link2, ListChecks, Lock, MapPin, MapPinned, ShieldCheck, UserPlus, UserRound, X } from 'lucide-react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { At, BOX_W, Card, Fade, Label, REDUCED, STILL, useBuild } from '../scene'
import { LAB } from '../d3/kit'
import { lead } from '../iso/frames'
import { AwsMark, Badge, LitFigure, fx } from './fx'
import { VisualTable } from './vtable'
import { Boundary, LockBadge, Logo, NET, Resource } from './frames'
import { Flow, SOCIETY_CSS, vars } from './vpc-society'

export { SocietyAnalogy } from './vpc-society'
export { FourParts } from './vpc-parts'
export { DefaultCustom, DefaultCustom2 } from './vpc-region'
export { VpcToSubnets, VpcToSubnets2 } from './vpc-split'

/**
 * SECTION 2 · VIRTUAL PRIVATE CLOUD (T03-1 to T06-1). Visual pass 2026-11-04 in
 * Session 4's design: every point list is `LitFigure` (each point with its
 * subject icon in a tile, the point the figure is acting out lit), every table
 * is `VisualTable`, the analogy is `vpc-society.tsx`. Every string is the card's;
 * no figure carries a word the card does not already have.
 *
 * Each figure is ONE `useBuild` (auto ON it plays by itself and holds; auto OFF
 * one press per state), its state the point that is lit:
 *   T03-1   the shared infrastructure and the other customers' VPCs; the
 *           customer's VPC (a stranger's packet is refused at its rim); its
 *           address range and traffic rules; a server and a database on one
 *           locked line, packets running it
 *   T03-2   the four points beside a presenter from the 3D people library, lit
 *           one by one (2026-11-05: the VPC drawing removed on the user's word)
 *   T04-1   the region (the aws mark is its label's icon) with two empty slots; the default VPC made for you;
 *           the custom VPC built piece by piece
 *   T04-1b  the custom VPC's CIDR and its range bar the subnets fit inside; the
 *           production mark
 *   T05-1   the table, row by row, the Default on signup row in orange
 *   T06-1   the VPC and its address range; the range splits into four subnets;
 *           the shared switches and cables, its own traffic on its own lane; the
 *           three names; the Availability Zones and the one large CIDR block
 */

const EASE = 'cubic-bezier(0.22,1,0.36,1)'

/** A harness URL, reduced motion or a picker thumbnail: the build holds its complete frame and nothing is lit as current. */
function useHeld() {
  const instant = useInstant()
  return STILL || REDUCED || instant
}

/** A plain horizontal line between two pieces. */
function Line({ x, y, len, lit = false, tone = NET.boundary, thick = 3 }: { x: number; y: number; len: number; lit?: boolean; tone?: string; thick?: number }) {
  const instant = useInstant()
  return <span aria-hidden className="absolute rounded-full" style={{ left: x, top: y - thick / 2, width: len, height: thick, background: lit ? NET.lit : tone, transition: instant ? 'none' : `background 420ms ${EASE}` }} />
}

/** A small status light on a resource: it glows while the resource runs. */
function Status({ x, y, tone = colors.success, delay = 0 }: { x: number; y: number; tone?: string; delay?: number }) {
  const f = fx('glow', delay, 1.6)
  return <span aria-hidden className={`absolute rounded-full ${f.className}`} style={{ ...f.style, left: x - 4, top: y - 4, width: 8, height: 8, background: tone, boxShadow: '0 0 0 2px #fff' }} />
}

/** A refused packet: it rides in, hits a rim and is turned back while an X pops over the rim (the analogy's CSS loops). */
function Refused({ x, y, dx, dy, xAt }: { x: number; y: number; dx: number; dy: number; xAt: [number, number] }) {
  if (STILL) return null
  return (
    <>
      <span aria-hidden className="vpc-bump absolute rounded-full" style={{ ...vars({ bx: dx, by: dy }), left: x - 7, top: y - 7, width: 14, height: 14, background: colors.danger, boxShadow: '0 0 0 2.5px #fff, 0 6px 12px -6px rgba(16,32,58,0.6)', zIndex: 3 }} />
      <span aria-hidden className="vpc-deny absolute grid h-[22px] w-[22px] place-items-center rounded-full" style={{ left: xAt[0] - 11, top: xAt[1] - 11, background: colors.danger, color: colors.white, boxShadow: '0 0 0 2.5px #fff, 0 6px 12px -6px rgba(16,32,58,0.6)', zIndex: 3 }}>
        <X size={13} strokeWidth={3} />
      </span>
    </>
  )
}

/** A point's icon that acts out its subject (a loop from `fx`). */
function Act({ kind, delay = 0, dur, children }: { kind: string; delay?: number; dur?: number; children: ReactNode }) {
  const f = fx(kind, delay, dur)
  return (
    <span className={`grid place-items-center ${f.className}`} style={f.style}>
      {children}
    </span>
  )
}

/* ================================================================== T03-1 · What a VPC is */

const T031_LEAD = 'Public cloud infrastructure is shared by many customers, so each needs an isolated network'
const T031_POINTS = [
  { icon: <ShieldCheck size={20} />, text: 'A VPC (Virtual Private Cloud) provides a logically isolated network with its own IP address range and traffic rules' },
  { icon: <Lock size={20} />, text: 'Resources such as servers and databases commonly use a VPC to communicate securely' },
]

const S1_H = 340
/* the shared infrastructure box on the 634 x 340 stage; the customer's VPC on the left, the other customers' own networks on the right (relative to the box) */
const S1_BOX = { x: 18, y: 30, w: 598, h: 296 }
const S1_VPC = { x: 14, y: 40, w: 322, h: 232 }
const S1_OTHER = { x: 356, w: 226, h: 64, ys: [54, 130, 206] }
const S1_TENANT = [colors.teal, LAB.periwinkle, colors.warning]
/* inside the VPC */
const S1_R = 56
const S1_SRV = { cx: 82, cy: 116 }
const S1_DB = { cx: 240, cy: 116 }

/**
 * The build: 0 the shared infrastructure, every other customer in its own VPC;
 * 1 the customer's VPC, logically isolated (a packet from the next VPC is refused
 * at its rim); 2 its own IP address range and traffic rules; 3 a server and a
 * database on one locked line, packets running it.
 */
function SharedNetworkScene({ k, held }: { k: number; held: boolean }) {
  const now = (i: number) => !held && k === i
  return (
    <At x={S1_BOX.x} y={S1_BOX.y}>
      <Boundary w={S1_BOX.w} h={S1_BOX.h} solid tone={LAB.lavDeep} label="Public Cloud Infrastructure" labelTone="dark">
        <div className="absolute" style={{ right: 14, top: 8 }}>
          <Label strong tone="brand" icon={<UserRound />}>
            Shared by Many Customers
          </Label>
        </div>
        {/* the other customers, each in its own isolated network: a customer mark, a server and a database, their lights on */}
        {S1_OTHER.ys.map((y, i) => (
          <At key={i} x={S1_OTHER.x} y={y}>
            <Boundary w={S1_OTHER.w} h={S1_OTHER.h} label="VPC" labelSize={14} tone="#8FA9DA">
              <div className="absolute flex items-center gap-3" style={{ left: 16, top: '54%', transform: 'translateY(-50%)' }}>
                <span aria-hidden className="grid h-[30px] w-[30px] place-items-center rounded-full" style={{ background: `${S1_TENANT[i]}22`, color: S1_TENANT[i], boxShadow: `inset 0 0 0 2px ${S1_TENANT[i]}` }}>
                  <UserRound size={16} strokeWidth={2.4} />
                </span>
                <span className="relative">
                  <Resource kind="server" size={36} />
                  <Status x={32} y={4} delay={i * 0.4} />
                </span>
                <span aria-hidden className="block h-[3px] w-[18px] rounded-full" style={{ background: '#AFC2E4' }} />
                <Resource kind="database" size={36} />
              </div>
            </Boundary>
          </At>
        ))}
        {/* THE CUSTOMER'S VPC */}
        <At x={S1_VPC.x} y={S1_VPC.y}>
          <Fade on={k >= 1} lift={8}>
            <Boundary w={S1_VPC.w} h={S1_VPC.h} label="VPC" lit={now(1)}>
              {/* its isolation: a shield on its corner */}
              <div className="absolute" style={{ right: -14, top: -14 }}>
                <Badge on={k >= 1} size={30}>
                  <Act kind="glow" dur={2}>
                    <ShieldCheck size={16} color={colors.brand} />
                  </Act>
                </Badge>
              </div>
              {/* its own IP address range and traffic rules */}
              <div className="absolute flex items-center justify-between" style={{ left: 14, right: 22, top: 20 }}>
                <Fade on={k >= 2} lift={6}>
                  <Label strong tone={now(2) ? 'solid' : 'brand'} raised icon={<MapPin />}>
                    IP Address Range
                  </Label>
                </Fade>
                <Fade on={k >= 2} lift={6} delay={120}>
                  <Label strong tone={now(2) ? 'solid' : 'brand'} raised icon={<ListChecks />}>
                    Traffic Rules
                  </Label>
                </Fade>
              </div>
              {/* a server and a database on one locked line */}
              <Fade on={k >= 3} lift={8}>
                <div className="relative" style={{ width: S1_VPC.w, height: S1_VPC.h }}>
                  <Line x={S1_SRV.cx + S1_R / 2 + 2} y={S1_SRV.cy - 12} len={S1_DB.cx - S1_SRV.cx - S1_R - 4} lit={now(3)} />
                  {k >= 3 && !held && <Flow x1={S1_SRV.cx + S1_R / 2 + 6} y1={S1_SRV.cy - 12} x2={S1_DB.cx - S1_R / 2 - 6} y2={S1_SRV.cy - 12} tone={colors.brand} n={2} dur={1.8} size={10} />}
                  <At x={(S1_SRV.cx + S1_DB.cx) / 2} y={S1_SRV.cy - 12} cx cy>
                    <span className={`block ${fx('shackle', 0, 3).className}`} style={fx('shackle', 0, 3).style}>
                      <LockBadge size={28} lit={now(3)} />
                    </span>
                  </At>
                  <At x={S1_SRV.cx} y={S1_SRV.cy - 12 - S1_R / 2} cx>
                    <Resource kind="server" size={S1_R} lit={now(3)} label="Servers" />
                  </At>
                  <At x={S1_DB.cx} y={S1_DB.cy - 12 - S1_R / 2} cx>
                    <Resource kind="database" size={S1_R} lit={now(3)} label="Databases" />
                  </At>
                  <At x={(S1_SRV.cx + S1_DB.cx) / 2} y={170} cx>
                    <Label strong tone={now(3) ? 'solid' : 'plain'} raised>
                      Communicate Securely
                    </Label>
                  </At>
                </div>
              </Fade>
              {/* its isolation, named on its rim */}
              <At x={S1_VPC.w / 2} y={S1_VPC.h} cx cy>
                <Label strong tone={now(1) ? 'solid' : 'plain'} raised icon={<ShieldCheck />}>
                  Logically Isolated Network
                </Label>
              </At>
            </Boundary>
          </Fade>
        </At>
        {/* the next customer's packet is refused at the VPC's rim */}
        {k >= 1 && !held && <Refused x={S1_OTHER.x + 4} y={S1_OTHER.ys[1] + 33} dx={S1_VPC.x + S1_VPC.w + 8 - S1_OTHER.x - 4} dy={0} xAt={[S1_VPC.x + S1_VPC.w + 2, S1_OTHER.ys[1] + 4]} />}
      </Boundary>
    </At>
  )
}

function WhatIsVpcBody({ lesson }: { lesson: string }) {
  const held = useHeld()
  const k = useBuild(4, 1100)
  const lit = held ? -1 : k === 1 || k === 2 ? 0 : k === 3 ? 1 : -1
  return <LitFigure id="T03-1" kicker="What Is A VPC" title="The Private Boundary" lead={T031_LEAD} lesson={lesson} points={T031_POINTS} lit={lit} figure={<SharedNetworkScene k={k} held={held} />} figH={S1_H} />
}

export function WhatIsVpc({ lesson }: { lesson: string }) {
  return <WhatIsVpcBody lesson={lesson} />
}

/* ================================================================== T05-1 · Same idea, three names */

const T051_LEAD = 'Every major provider offers the same isolation model under a different name, so the mental model built for one cloud transfers directly to another'
const T051_ROWS: [string, string, string, string][] = [
  ['Isolated Network', 'VPC (Virtual Private Cloud)', 'VNet (Virtual Network)', 'VPC Network'],
  ['Default on Signup', 'One default VPC per region', 'No general-purpose VNet created automatically', 'One default VPC, global scope'],
  ['Cross-Network Link', 'VPC peering', 'VNet peering', 'VPC network peering'],
  ['Address Range Unit', 'CIDR block on the VPC', 'CIDR block on the VNet', 'Subnet-level CIDR only'],
]

/* each row's subject, acting it out: the shield glows (isolation), the new member hops in (signup), the link lifts (a join), the hash stays (a number) */
const T051_ICONS: ReactNode[] = [
  <Act key="0" kind="glow" dur={2}><ShieldCheck size={18} /></Act>,
  <Act key="1" kind="hop" dur={1.8}><UserPlus size={18} /></Act>,
  <Act key="2" kind="lift" dur={2.4}><Link2 size={18} /></Act>,
  <Act key="3" kind="glow" dur={2.6} delay={0.4}><Hash size={18} /></Act>,
]

/** A provider's column head: its logo alone, at its own aspect ratio (user, 2026-11-05: the blue `AWS` / `Azure` / `GCP` beside the mark repeated the name the mark already carries). The name reaches screen readers through the mark's role="img" label. */
function Head({ name, alt }: { name: 'aws' | 'azure' | 'gcp'; alt: string }) {
  return (
    <span className="inline-flex items-center" style={{ height: 28 }} role="img" aria-label={alt}>
      <span className="inline-flex shrink-0 items-center">{name === 'aws' ? <AwsMark w={40} /> : <Logo name={name} h={24} style={{ alignItems: 'flex-start' }} />}</span>
    </span>
  )
}

/** A cell's words with an icon before them (the highlighted row: per region, none made, global). */
function Cell({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="flex items-start gap-2">
      <span aria-hidden className="mt-[1px] grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full" style={{ background: '#FFFFFFcc', color: colors.accentDark, boxShadow: `inset 0 0 0 1.5px ${colors.accent}66` }}>
        {icon}
      </span>
      <span className="min-w-0">{children}</span>
    </span>
  )
}

export function Providers({ lesson }: { lesson: string }) {
  const cellIcons: ReactNode[] = [
    <MapPinned key="a" size={13} />,
    <Ban key="z" size={13} />,
    <Act key="g" kind="spin" dur={8}><Globe size={13} /></Act>,
  ]
  return (
    <Card id="T05-1" kicker="VPC Across Providers" title="Same Idea Renamed" lead={lead(T051_LEAD)} lesson={lesson}>
      <div style={{ width: BOX_W }}>
        <VisualTable
          compact
          columns={[
            { label: 'Concept', icon: <Layers size={16} />, weight: 0.95 },
            { label: <Head name="aws" alt="AWS" />, weight: 1 },
            { label: <Head name="azure" alt="Azure" />, weight: 1.12 },
            { label: <Head name="gcp" alt="GCP" />, weight: 1 },
          ]}
          rows={T051_ROWS.map(([c, a, z, g], r) => ({
            icon: T051_ICONS[r],
            cells: r === 1 ? [c, <Cell key="a" icon={cellIcons[0]}>{a}</Cell>, <Cell key="z" icon={cellIcons[1]}>{z}</Cell>, <Cell key="g" icon={cellIcons[2]}>{g}</Cell>] : [c, a, z, g],
          }))}
          highlight={[1]}
        />
      </div>
    </Card>
  )
}

/** This section's micro-animations (visual pass, 2026-11-04), appended to the deck's CSS by `netDeck.tsx`: the analogy's loops (the refusal and bump loops are shared with T03-1 and T03-2). */
export const VPC_CSS = SOCIETY_CSS
