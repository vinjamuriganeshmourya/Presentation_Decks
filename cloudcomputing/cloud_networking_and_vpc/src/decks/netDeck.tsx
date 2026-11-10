import type React from 'react'
import type { DeckMeta, SlideDef } from '@/deck/types'
import type { SectionBreakerProps } from '@/slides/types'
import { BrandSlide, NextSessionSlide, SectionBreakerSlide, ThankYouSlide, WelcomeSlide } from '@/slides'
import { AgendaColumns, QuizCard } from './figures/variants'
import { Takeaways } from './figures/closing'
import { installSpecKeys } from '@/ui/foundations/keys'
import { revealEveryStep } from '@/motion/Stepper'
import { installEntrances } from './figures/entrance'
import { MOTION_CSS } from './figures/motion'
import { SCENE_CSS, STILL } from './figures/scene'
import { ART_CSS, mountClayDefs } from './figures/art'
import { NET_CSS } from './figures/net/frames'
import { FX_CSS, FX_CSS_2, FX_CSS_3 } from './figures/net/fx'
import { OVERVIEW_CSS, Boundary1b, Pieces2 } from './figures/net/overview'
import { VPC_CSS, VpcToSubnets2 } from './figures/net/vpc'
import { SUBNETS_CSS } from './figures/net/subnets'
import { ROUTING_CSS } from './figures/net/routing'
import { SECURITY_CSS, NetworkAcl2 } from './figures/net/security'
import { LAB_CSS, ExploreSecurity2 } from './figures/net/lab'
import { Boundary1, SchoolAnalogy, Pieces, FourBlocks, Planes } from './figures/net/overview'
import { WhatIsVpc, FourParts, SocietyAnalogy, DefaultCustom, DefaultCustom2, Providers, VpcToSubnets } from './figures/net/vpc'
import { SubnetsOverview, SubnetsOverview2, CidrSizing, CidrSizing2, WorkedSplit, SplitTotals, PublicPrivate, ZonePlacement, ZonePlacement2 } from './figures/net/subnets'
import { FourPieces, FourPieces2, RouteTables, RouteTables2, PostalAnalogy, InternetGateway, NatGateway, NatGateway2, TicketAnalogy, Peering, Peering2, SiteToSiteVpn, PhoneLineAnalogy, RoutingCompared, RoutingNotPermission } from './figures/net/routing'
import { TwoFilters, DoorCheckpointAnalogy, SecurityGroup, SecurityGroup2, SecurityGroup3, SecurityGroupStacking, NetworkAcl, AclWholeSubnet, GroupsVsAcls, LeastPrivilege, LeastPrivilege2 } from './figures/net/security'
import { LabSteps1, LabSteps2, VpcCreated, PublicSubnetCreated, PrivateSubnetCreated, IgwAttached, RouteTablesTable, PublicRtCreated, PrivateRtCreated, ExploreSecurity } from './figures/net/lab'

/**
 * CLOUD COMPUTING · "Cloud Networking & VPC" (session 5)
 *
 * Built from `Outputs/cloudcomputing/session_plans/cloud_networking_and_vpc/plan.md`
 * (signed off on the user's word, 2026-10-29). The source is the session 5 spec
 * and TR in `Outputs/cloud_computing/session_plans/session_5/`: every string on
 * a slide is the spec's (the TR's words; a spaced dash turned into a colon or a
 * comma, the full stop at a line's end dropped). One slide per spec card, in the
 * TR's order, the slide id is the card id (`Card` stamps it as `data-spec`).
 *
 * THE DESIGN is sessions 2 to 4's: `Card`, the points rail beside a raised
 * stage, library renders and clay objects, one self-running loop per figure
 * held still on harness URLs. No builds (`revealEveryStep`): every element
 * enters in reading order (`figures/entrance.ts`), which is how the spec's
 * press order reaches the screen. Section files: `figures/net/`.
 *
 * REVISED 2026-10-30 on the user's correction list (TR fidelity, 3D analogies,
 * no empty space, fast build-once motion, arrows that never leave, dense
 * cards split, full screenshots): the split cards carry the card id with a
 * letter (`T04-1b`), agenda1 and quiz1 replace the kit frames, and there is no
 * feedback slide (content rule 41).
 */

export const SESSION = 'Cloud Networking & VPC'

export const netMeta: DeckMeta = {
  title: SESSION,
  course: 'Cloud Computing',
  lesson: SESSION,
  presenter: 'NxtWave Instructor',
  /* every move a transition, picker thumbnails, and the step/slide switch hidden (course skill R1) */
  player: { autoHideControls: true, smooth: true, thumbnails: true, hideModeSwitch: true },
}

/** A TR agenda line, `1. Cloud Networking Overview: The network as …`, as the kit's title and sub. The number is the slide's own badge. */
const line = (s: string) => {
  const body = s.replace(/^\d+\.\s*/, '')
  const i = body.indexOf(': ')
  return { title: body.slice(0, i), sub: body.slice(i + 2) }
}

/** S-AGENDA, the TR's five agenda lines. The breakers, the takeaways and the section bar use the titles (course rule R5). */
export const AGENDA = [
  '1. Cloud Networking Overview: The network as the deployment boundary; core building blocks',
  '2. Virtual Private Cloud (VPC): Logically isolated networks; VPC concepts across providers',
  '3. Subnets & IP Addressing: CIDR notation & subnet sizing; public vs private subnets; availability-zone placement',
  '4. Routing & Gateways: Route tables; internet gateway; NAT gateway; VPC peering & private connectivity',
  '5. Network Security Controls: Security groups (stateful) vs network ACLs (stateless); least-privilege network design',
].map(line)

/** S-RECAP, the TR's recap of Containers vs Virtual Machines. */
const PREVIOUS = [
  '1. Container Fundamentals: Process-level isolation; Linux namespaces & control groups (cgroups); union filesystem & layered images',
  '2. Docker Architecture: Client, daemon, images, containers & registries; image vs container; layers & build caching',
  '3. Containers vs VMs: Boot time, memory footprint, image size & density; isolation strength & security trade-offs',
  '4. Choosing Between Them: Container use cases; VM use cases; decision criteria',
  '5. Tooling & Registries: VirtualBox, KVM, Hyper-V & VMware; Docker, Podman & containerd; public vs private registries; tagging strategy',
].map(line)

/* the keyframes the scene helpers use; harness URLs hold every loop still */
if (typeof document !== 'undefined' && !document.getElementById('cc-css')) {
  const el = document.createElement('style')
  el.id = 'cc-css'
  /* table heads read as the spec writes them (`Subnet CIDR`, `Typical Cost Driver`), not in the kit's capitals: the source text exactly */
  el.textContent = ART_CSS + SCENE_CSS + MOTION_CSS + NET_CSS + FX_CSS + FX_CSS_2 + FX_CSS_3 + OVERVIEW_CSS + VPC_CSS + SUBNETS_CSS + ROUTING_CSS + SECURITY_CSS + LAB_CSS + `[data-spec] .grid.items-end > .uppercase.tracking-wider { text-transform: none; letter-spacing: 0.01em }`
  document.head.appendChild(el)
  if (STILL) document.documentElement.classList.add('cc-still')
  if (document.body) mountClayDefs()
  else document.addEventListener('DOMContentLoaded', mountClayDefs)
}
installSpecKeys()
revealEveryStep()
installEntrances()

const S = AGENDA.map((a) => a.title)
const breaker = (i: number): SlideDef => ({ id: `D${i + 1}`, section: S[i], label: 'Section divider', transition: 'zoom', element: <SectionBreakerSlide index={i + 1} title={S[i]} lesson={SESSION} /> })
/**
 * D-LAB (plan decision 7): the practical's divider, the same frame as the five
 * section breakers, rendered through this wrapper so `Deck` does not count it
 * as a sixth section-bar segment (the bar is one segment per agenda point; the
 * lab belongs to section 5, where the TR puts it).
 */
const LabBreaker = (p: SectionBreakerProps) => <SectionBreakerSlide {...p} />
const slide = (id: string, section: string, label: string, El: (p: { lesson: string }) => React.ReactElement): SlideDef => ({ id, section, label, element: <El lesson={SESSION} /> })

export const netDeck: SlideDef[] = [
  /* ── OPENING ─────────────────────────────────────────────────────────── */
  { id: 'S-WELCOME', section: 'Opening', label: 'Welcome', transition: 'fade', element: <BrandSlide greeting="Welcome" lesson={SESSION} /> },
  /* the session title frame (course rule R9, user 2026-11-04: a title slide after the welcome slide in every session) */
  { id: 'S-TITLE', section: 'Opening', label: 'Session name', transition: 'zoom', element: <WelcomeSlide minimal title={SESSION} lesson={SESSION} /> },
  { id: 'S-RECAP', section: 'Opening', label: 'Recap', element: <Takeaways id="S-RECAP" kicker="Recap" title="Containers vs Virtual Machines" lesson={SESSION} items={PREVIOUS.map(({ title }) => ({ title }))} art="/assets/takeaways/presenter.png" /> },
  /* agenda1, the column layout (user, 2026-10-30: "replace Agenda0 with Agenda1"), titles only (course rule R5) */
  { id: 'S-AGENDA', section: 'Opening', label: 'Agenda', element: <AgendaColumns kicker={SESSION} lesson={SESSION} items={AGENDA.map(({ title }) => ({ title }))} /> },

  /* ── 1 · CLOUD NETWORKING OVERVIEW ───────────────────────────────────── */
  breaker(0),
  slide('T01-1', S[0], 'The deployment boundary', Boundary1),
  slide('T01-1b', S[0], 'The deployment boundary, traffic and controls', Boundary1b),
  slide('T01-AN', S[0], "Analogy: A school's gates and corridors", SchoolAnalogy),
  slide('T02-1', S[0], 'Pieces, configured in software', Pieces),
  slide('T02-1b', S[0], 'Pieces, pushed onto shared hardware', Pieces2),
  slide('T02-2', S[0], 'The four building blocks', FourBlocks),
  slide('T02-3', S[0], 'Control plane and data plane', Planes),

  /* ── 2 · VIRTUAL PRIVATE CLOUD (VPC) ─────────────────────────────────── */
  breaker(1),
  slide('T03-1', S[1], 'What a VPC is', WhatIsVpc),
  slide('T03-2', S[1], 'Four parts of a VPC', FourParts),
  slide('T03-AN', S[1], 'Analogy: A gated society', SocietyAnalogy),
  slide('T04-1', S[1], 'Default VPC or custom VPC', DefaultCustom),
  slide('T04-1b', S[1], 'Default VPC or custom VPC, the CIDR', DefaultCustom2),
  slide('T05-1', S[1], 'Same idea, three names', Providers),
  slide('T06-1', S[1], 'From one VPC to its subnets', VpcToSubnets),
  slide('T06-1b', S[1], 'From VPC to subnets: names and zones', VpcToSubnets2),

  /* ── 3 · SUBNETS & IP ADDRESSING ─────────────────────────────────────── */
  breaker(2),
  slide('T07-1', S[2], 'Subnets: size and type', SubnetsOverview),
  slide('T07-1b', S[2], 'Subnets: zone', SubnetsOverview2),
  slide('T08-1', S[2], 'The reserved address cost', CidrSizing),
  slide('T08-1b', S[2], 'The smallest subnet', CidrSizing2),
  slide('T09-1', S[2], 'The worked split, row by row', WorkedSplit),
  slide('T09-2', S[2], 'What the split adds up to', SplitTotals),
  slide('T10-1', S[2], 'Public or private, by route', PublicPrivate),
  slide('T11-1', S[2], 'Two zones', ZonePlacement),
  slide('T11-1b', S[2], 'One zone goes down', ZonePlacement2),

  /* ── 4 · ROUTING & GATEWAYS ──────────────────────────────────────────── */
  breaker(3),
  slide('T13-1', S[3], 'The route tables', FourPieces),
  slide('T13-1b', S[3], 'The three exits', FourPieces2),
  slide('T14-1', S[3], 'A route table, entry by entry', RouteTables),
  slide('T14-1b', S[3], 'A route table, the default route', RouteTables2),
  slide('T14-AN', S[3], 'Analogy: A postal sorting hub', PostalAnalogy),
  slide('T15-1', S[3], 'The internet gateway', InternetGateway),
  /* T15-1c merged into T15-1 (review 2026-11-05, slides 38 and 39 into one) */
  slide('T16-1', S[3], 'The NAT gateway', NatGateway),
  slide('T16-1b', S[3], 'The NAT gateway, its route and cost', NatGateway2),
  slide('T16-AN', S[3], 'Analogy: A ticket counter', TicketAnalogy),
  slide('T17-1', S[3], 'VPC peering', Peering),
  slide('T17-1b', S[3], 'VPC peering, its limits and cost', Peering2),
  slide('T17-2', S[3], 'Site-to-Site VPN', SiteToSiteVpn),
  slide('T17-AN', S[3], 'Analogy: A private telephone line', PhoneLineAnalogy),
  slide('T18-1', S[3], 'Four routing options compared', RoutingCompared),
  slide('T18-2', S[3], 'Routing is not permission', RoutingNotPermission),

  /* ── 5 · NETWORK SECURITY CONTROLS ───────────────────────────────────── */
  breaker(4),
  slide('T19-1', S[4], 'Two filters, two places', TwoFilters),
  slide('T19-AN', S[4], 'Analogy: A door and a checkpoint', DoorCheckpointAnalogy),
  slide('T20-1', S[4], 'How a security group filters', SecurityGroup),
  slide('T20-1b', S[4], 'Allow rules, evaluated together', SecurityGroup2),
  slide('T20-1c', S[4], 'The reply, let through', SecurityGroup3),
  slide('T20-2', S[4], 'Where it is managed, and stacking', SecurityGroupStacking),
  slide('T21-1', S[4], 'How a network ACL filters', NetworkAcl),
  slide('T21-1b', S[4], 'How a network ACL filters, rule order', NetworkAcl2),
  slide('T21-2', S[4], 'Whole subnet, VPC console', AclWholeSubnet),
  slide('T22-1', S[4], 'Groups and ACLs, side by side', GroupsVsAcls),
  slide('T23-1', S[4], 'Least privilege, both layers', LeastPrivilege),
  slide('T23-1b', S[4], 'Least privilege, the rules', LeastPrivilege2),

  /* ── PRACTICAL HANDS-ON (inside section 5, where the TR puts it) ─────── */
  { id: 'D-LAB', section: S[4], label: 'Practical divider', transition: 'zoom', element: <LabBreaker kicker="Practical Hands-On" title="Building a Cloud Network with AWS VPC" lesson={SESSION} /> },
  slide('T24-1', S[4], 'The lab, steps 1 to 3', LabSteps1),
  slide('T24-2', S[4], 'The lab, steps 4 to 6', LabSteps2),
  slide('T25-1', S[4], 'The VPC, created', VpcCreated),
  slide('T26-1', S[4], 'The public subnet, created', PublicSubnetCreated),
  slide('T26-2', S[4], 'The private subnet, created', PrivateSubnetCreated),
  slide('T27-1', S[4], 'The gateway, attached', IgwAttached),
  slide('T28-1', S[4], 'Two route tables, one difference', RouteTablesTable),
  slide('T28-2', S[4], 'Creating the public route table', PublicRtCreated),
  slide('T28-3', S[4], 'Creating the private route table', PrivateRtCreated),
  slide('T29-1', S[4], 'Security group and network ACL', ExploreSecurity),
  slide('T29-1b', S[4], 'Network ACL: inspect without changing', ExploreSecurity2),

  /* ── CLOSING ─────────────────────────────────────────────────────────── */
  /* quiz1, the title card with the question cube (user, 2026-10-30: "replace the quiz slide with the Quizslide 1 version") */
  { id: 'S-QUIZ', section: 'Closing', label: 'Quiz Time', transition: 'zoom', element: <QuizCard lesson={SESSION} title="Quiz Time" /> },
  { id: 'S-TAKEAWAYS', section: 'Closing', label: 'Key Takeaways', element: <Takeaways id="S-TAKEAWAYS" lesson={SESSION} items={AGENDA.map(({ title }) => ({ title }))} /> },
  { id: 'S-NEXT', section: 'Closing', label: 'Next session', transition: 'zoom', element: <NextSessionSlide title="Load Balancing & CDN" lesson={SESSION} /> },
  { id: 'S-THANKS', section: 'Closing', label: 'Thank You', transition: 'zoom', element: <ThankYouSlide title="Thank You" lesson={SESSION} /> },
  { id: 'S-BEST', section: 'Closing', label: 'All the Best', transition: 'zoom', element: <ThankYouSlide title="All the Best" lesson={SESSION} /> },
]
