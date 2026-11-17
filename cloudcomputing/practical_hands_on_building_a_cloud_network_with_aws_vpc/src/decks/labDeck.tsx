import type React from 'react'
import type { DeckMeta, SlideDef } from '@/deck/types'
import type { SectionBreakerProps } from '@/slides/types'
import { BrandSlide, SectionBreakerSlide, ThankYouSlide } from '@/slides'
import { installSpecKeys } from '@/ui/foundations/keys'
import { revealEveryStep } from '@/motion/Stepper'
import { installEntrances } from './figures/entrance'
import { MOTION_CSS } from './figures/motion'
import { SCENE_CSS, STILL } from './figures/scene'
import { ART_CSS, mountClayDefs } from './figures/art'
import { NET_CSS } from './figures/net/frames'
import { FX_CSS, FX_CSS_2, FX_CSS_3 } from './figures/net/fx'
import { OVERVIEW_CSS } from './figures/net/overview'
import { VPC_CSS } from './figures/net/vpc'
import { SUBNETS_CSS } from './figures/net/subnets'
import { ROUTING_CSS } from './figures/net/routing'
import { SECURITY_CSS } from './figures/net/security'
import { LAB_CSS, ExploreSecurity2 } from './figures/net/lab'
import { LabSteps1, LabSteps2, VpcCreated, PublicSubnetCreated, PrivateSubnetCreated, IgwAttached, RouteTablesTable, PublicRtCreated, PrivateRtCreated, ExploreSecurity } from './figures/net/lab'

/**
 * CLOUD COMPUTING · "Building a Cloud Network with AWS VPC"
 *
 * Split from Cloud Networking & VPC (user, 2026-11-17): slides 61 to 77 of that
 * 77-slide deck, from its "Practical Hands-On" breaker on, became this session;
 * the deck is named after that breaker's title. The practical's slides are
 * unchanged (figures in `figures/net/lab*.tsx`). The opening and closing are the
 * course's standard frames without Key Takeaways, Agenda, Next Session and Quiz
 * (the user's list), and without the session title and recap (user, 2026-11-17):
 * Welcome, then Thank You and All the Best.
 */

export const SESSION = 'Building a Cloud Network with AWS VPC'

/** the section the practical's slides carry (the breaker's kicker) */
const LAB = 'Practical Hands-On'

export const labMeta: DeckMeta = {
  title: SESSION,
  course: 'Cloud Computing',
  lesson: SESSION,
  presenter: 'NxtWave Instructor',
  /* every move a transition, picker thumbnails, and the step/slide switch hidden (course skill R1) */
  player: { autoHideControls: true, smooth: true, thumbnails: true, hideModeSwitch: true },
}

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

/**
 * D-LAB: the practical's divider, kept exactly as it was in Cloud Networking &
 * VPC (the breaker frame through this wrapper, so the section bar is the one
 * segment this deck has).
 */
const LabBreaker = (p: SectionBreakerProps) => <SectionBreakerSlide {...p} />
const slide = (id: string, section: string, label: string, El: (p: { lesson: string }) => React.ReactElement): SlideDef => ({ id, section, label, element: <El lesson={SESSION} /> })

export const labDeck: SlideDef[] = [
  /* ── OPENING ─────────────────────────────────────────────────────────── */
  { id: 'S-WELCOME', section: 'Opening', label: 'Welcome', transition: 'fade', element: <BrandSlide greeting="Welcome" lesson={SESSION} /> },

  /* ── PRACTICAL HANDS-ON (slides 61-72 of the 77-slide Cloud Networking & VPC deck, unchanged) ── */
  { id: 'D-LAB', section: LAB, label: 'Practical divider', transition: 'zoom', element: <LabBreaker kicker="Practical Hands-On" title="Building a Cloud Network with AWS VPC" lesson={SESSION} /> },
  slide('T24-1', LAB, 'The lab, steps 1 to 3', LabSteps1),
  slide('T24-2', LAB, 'The lab, steps 4 to 6', LabSteps2),
  slide('T25-1', LAB, 'The VPC, created', VpcCreated),
  slide('T26-1', LAB, 'The public subnet, created', PublicSubnetCreated),
  slide('T26-2', LAB, 'The private subnet, created', PrivateSubnetCreated),
  slide('T27-1', LAB, 'The gateway, attached', IgwAttached),
  slide('T28-1', LAB, 'Two route tables, one difference', RouteTablesTable),
  slide('T28-2', LAB, 'Creating the public route table', PublicRtCreated),
  slide('T28-3', LAB, 'Creating the private route table', PrivateRtCreated),
  slide('T29-1', LAB, 'Security group and network ACL', ExploreSecurity),
  slide('T29-1b', LAB, 'Network ACL: inspect without changing', ExploreSecurity2),

  /* ── CLOSING ─────────────────────────────────────────────────────────── */
  { id: 'S-THANKS', section: 'Closing', label: 'Thank You', transition: 'zoom', element: <ThankYouSlide title="Thank You" lesson={SESSION} /> },
  { id: 'S-BEST', section: 'Closing', label: 'All the Best', transition: 'zoom', element: <ThankYouSlide title="All the Best" lesson={SESSION} /> },
]
