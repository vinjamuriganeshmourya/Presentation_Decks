import type { DeckMeta, SlideDef } from '@/deck/types'
import { AgendaSlide, BrandSlide, NextSessionSlide, SectionBreakerSlide, ThankYouSlide, WelcomeSlide } from '@/slides'
import { FeedbackSlide } from '@/slides/FeedbackSlide'
import { ClassroomQuiz } from '@/ui/foundations/ClassroomQuiz'
import { Takeaways } from './figures/closing'
import { installSpecKeys } from '@/ui/foundations/keys'
import { AUTOPLAY_ON_BY_DEFAULT } from '@/ui/foundations/autoplay'
import { revealEveryStep } from '@/motion/Stepper'
import { installEntrances } from './figures/entrance'
import { MOTION_CSS } from './figures/motion'
import { SCENE_CSS, STILL } from './figures/scene'
import { ART_CSS, mountClayDefs } from './figures/art'
import { WalkSlide } from './figures/aws/walk'
import { WALKS } from './figures/aws/walks'
import { KeepReady, StopAutoPay, WhatYouNeed } from './figures/aws/before'

/**
 * CLOUD COMPUTING · "Setting Up Your AWS Account" (session 3)
 *
 * Built 2026-10-26 from `Outputs/cloudcomputing/session_plans/setting_up_your_aws_account/plan.md`
 * (signed off on the user's word). The source is the reference deck
 * `Reference ppt's/setting-up-your-aws-account 1.html`, 34 frames: its content and order, verbatim.
 *
 * THE USER'S RULES: no Autoplay and no Next anywhere; every slide plays by itself (the screenshot
 * walkthroughs cycle through their states on a clock, `figures/aws/walk.tsx`); subtle motion; a
 * removed element leaves no gap. Per slide: 6 split into two tables, 9 and 22 lose named callouts,
 * 14 is the first state only, 17 and 18 keep the full screenshot and move only the highlight. The
 * changes are applied where the walkthrough data is generated (`figures/aws/walks.ts`).
 */

export const SESSION = 'Setting Up Your AWS Account'

export const awsMeta: DeckMeta = {
  title: SESSION,
  course: 'Cloud Computing',
  lesson: SESSION,
  presenter: 'NxtWave Instructor',
  /* every move a transition, picker thumbnails, and the step/slide switch hidden (course skill R1) */
  player: { autoHideControls: true, smooth: true, thumbnails: true, hideModeSwitch: true },
}

/** The reference's agenda, four items; the Key Takeaways frame repeats these strings (content rule 20). */
export const AGENDA = [{ title: 'Before You Start' }, { title: 'Account Sign-Up' }, { title: 'Details and Identity' }, { title: 'Payment and First Login' }]

/* the keyframes the scene helpers use; harness URLs hold every loop still */
if (typeof document !== 'undefined' && !document.getElementById('cc-css')) {
  const el = document.createElement('style')
  el.id = 'cc-css'
  el.textContent = ART_CSS + SCENE_CSS + MOTION_CSS
  document.head.appendChild(el)
  if (STILL) document.documentElement.classList.add('cc-still')
  if (document.body) mountClayDefs()
  else document.addEventListener('DOMContentLoaded', mountClayDefs)
}
installSpecKeys()
revealEveryStep()
installEntrances()

const walk = (id: string, notes: string): SlideDef => {
  const w = WALKS[id]
  return { id, section: w.section, label: w.label, element: <WalkSlide w={w} lesson={SESSION} />, notes }
}
const breaker = (i: number): SlideDef => ({ id: `c${i + 1}-divider`, section: AGENDA[i].title, label: 'Section divider', transition: 'zoom', element: <SectionBreakerSlide index={i + 1} title={AGENDA[i].title} lesson={SESSION} />, notes: `Section ${i + 1}. The title only.` })
const PLAYS = 'The screenshot plays by itself: the whole page first, then each field in turn, ringed, with its callout lit.'

export const awsDeck: SlideDef[] = [
  /* ── OPENING ─────────────────────────────────────────────────────────── */
  { id: 'brand', section: 'Opening', label: 'Welcome', transition: 'fade', element: <BrandSlide greeting="Welcome!" lesson={SESSION} />, notes: 'The opening mark.' },
  { id: 'session', section: 'Opening', label: 'Session name', transition: 'zoom', element: <WelcomeSlide minimal title={SESSION} lesson={SESSION} />, notes: 'The session name.' },
  { id: 'agenda', section: 'Opening', label: 'Agenda', element: <AgendaSlide kicker={SESSION} title="Agenda" lesson={SESSION} items={AGENDA} />, notes: 'Four parts: what to keep ready, the sign-up, identity, then payment and the first login.' },

  /* ── 1 · BEFORE YOU START ────────────────────────────────────────────── */
  breaker(0),
  { id: 'what-you-need', section: AGENDA[0].title, label: 'What you need', element: <WhatYouNeed lesson={SESSION} />, notes: 'Check every learner has all five before starting: a sign-up abandoned halfway is harder to resume than to begin.' },
  { id: 'keep-ready', section: AGENDA[0].title, label: 'Keep these ready', element: <KeepReady lesson={SESSION} />, notes: 'One ID proof and one payment method. The left table is the Aadhaar and UPI route, the right one the PAN and card route.' },

  /* ── 2 · ACCOUNT SIGN-UP ─────────────────────────────────────────────── */
  breaker(1),
  walk('open-aws', `${PLAYS} Only aws.amazon.com: a look-alike address is the commonest way a sign-up goes wrong.`),
  walk('email', `${PLAYS} The email must be one the learner can open now; the code arrives there.`),
  walk('name', `${PLAYS} The name must match the ID proof used later.`),
  walk('verify-email', `${PLAYS} No code: check spam, or press Resend code.`),
  walk('password', `${PLAYS} The password rules appear beside the field as it is typed.`),

  /* ── 3 · DETAILS AND IDENTITY ────────────────────────────────────────── */
  breaker(2),
  walk('contact', 'The contact page, whole: country India, then the address and PIN code, then the mobile number. Static (the user, 2026-10-26: the first state only).'),
  walk('purpose', `${PLAYS} Personal use and Individual for this course.`),
  walk('aadhaar', `${PLAYS} Route 7A: Aadhaar through DigiLocker.`),
  walk('digilocker', 'The DigiLocker page stays whole on screen; only the highlight moves, from the Aadhaar Card tick box to Allow (the user, 2026-10-26: no pan or zoom).'),
  walk('pan', 'Route 7B: the PAN page stays whole; the highlight moves from the PAN number to Choose file (the user, 2026-10-26: no pan or zoom).'),
  walk('console-ready', `${PLAYS} Setup can take up to 24 hours; the email says when it is ready.`),

  /* ── 4 · PAYMENT AND FIRST LOGIN ─────────────────────────────────────── */
  breaker(3),
  walk('plan', `${PLAYS} The free plan is the one for this course.`),
  walk('payment-method', `${PLAYS} UPI AutoPay or a card; card details never go on screen.`),
  walk('two-rupees', `${PLAYS} The ₹2 is a check, refunded later.`),
  walk('scan-qr', `${PLAYS} The QR code works for 10 minutes.`),
  { id: 'stop-autopay', section: AGENDA[3].title, label: 'Stop AutoPay', element: <StopAutoPay lesson={SESSION} />, notes: 'The one step people forget: cancel the AutoPay mandate after 2 to 3 days.' },
  walk('sign-in', `${PLAYS} If the older sign-in page shows, choose the new experience.`),
  walk('console', `${PLAYS} Alt+S searches any service; the project name opens the account menu.`),
  walk('sign-out', `${PLAYS} Always sign out on a shared computer.`),

  /* ── CLOSING ─────────────────────────────────────────────────────────── */
  { id: 'quiz', section: 'Closing', label: 'Quiz time', transition: 'zoom', element: <ClassroomQuiz lesson={SESSION} />, notes: 'Immediately before Key Takeaways (content rule 18).' },
  { id: 'takeaways', section: 'Closing', label: 'Key takeaways', element: <Takeaways kicker="Key Takeaways" title={SESSION} lesson={SESSION} items={AGENDA} />, notes: 'The four agenda titles.' },
  { id: 'next-session', section: 'Closing', label: 'Next session', transition: 'zoom', element: <NextSessionSlide title="Next Cloud Computing Session" lesson={SESSION} />, notes: "The reference's next-session line." },
  { id: 'feedback', section: 'Closing', label: 'Feedback', element: <FeedbackSlide lesson={SESSION} />, notes: 'Leave it on screen while the room fills the form.' },
  { id: 'thank-you', section: 'Closing', label: 'Thank you', transition: 'zoom', element: <ThankYouSlide title="Thank You" lesson={SESSION} /> },
  { id: 'all-the-best', section: 'Closing', label: 'All the best', transition: 'zoom', element: <ThankYouSlide title="All the Best" lesson={SESSION} /> },
]

/** No slide opens with Autoplay (no builds); the kit's set ships holding Python 31's numbers. */
AUTOPLAY_ON_BY_DEFAULT.clear()
