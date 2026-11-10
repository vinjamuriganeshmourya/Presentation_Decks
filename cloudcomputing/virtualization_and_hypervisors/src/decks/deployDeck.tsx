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
import { DeployMap, PublicCloud, PublicAnalogy, PrivateCloud, PrivateTable, PrivateAnalogy, HybridCloud, HybridBurst, HybridAnalogy, CommunityCloud, DeployCompared } from './figures/iso/deploy'
import { MultiCloud, MultiVsHybrid, MultiAnalogy, Motivations, Overhead } from './figures/iso/multi'
import { StackMap, StackGrid, Iaas, IaasAnalogy, Paas, PaasAnalogy, Saas, SaasAnalogy } from './figures/iso/service'
import { Beyond, Faas, FaasTimeline, FaasAnalogy, AiMl, AiMlFlow, AiMlAnalogy, Responsibility } from './figures/iso/beyond'
import { EconMap, CapexOpex, CapexOpexMore, CapexAnalogy, Tco, TcoAnalogy, Pricing, PricingAnalogy, PricingTable, PricingBars, Providers, India } from './figures/iso/econ'

/**
 * CLOUD COMPUTING · "Deployment & Service Models" (session 2)
 *
 * Built from `Outputs/cloudcomputing/session_plans/deployment_and_service_models/plan.md`
 * (signed off on the user's standing word, 2026-10-23). The source is the
 * reference deck `Reference ppt's/deployment-and-service-models 2.html`, used
 * for its CONTENT only: every title, kicker, lead, bullet, table cell, label,
 * analogy label and claim on these slides is the reference's own string; the
 * speaker notes are its TR speaker notes and TR analogy lines.
 *
 * THE DESIGN is the plan's: every figure is isometric (`figures/iso/`), drawn
 * to the TR's Visual Guidance or the TR's own diagram, and runs a short loop
 * whose motion explains the slide. No cast, no clay (the user: ignore session
 * 1's illustration style). No builds: every beat is on screen when the slide
 * opens (`revealEveryStep`), and every element enters in reading order
 * (`figures/entrance.ts`, session 1's 1.5s timing).
 *
 * THE USER'S THIRTEEN POINTS on the reference (2026-10-23) are applied here
 * and listed in the plan's decision 2: breakers with the title only, the
 * analogies redesigned, 9 / 12 / 19 / 27 / 29 / 31 drawn to the TR, the lead
 * and the body as one block, the `Stack layer` heading on 25, the table's
 * words moved up from 26 into 25's slabs, 35's points under their lead, 45
 * as two columns.
 */

export const SESSION = 'Deployment & Service Models'

export const deployMeta: DeckMeta = {
  title: SESSION,
  course: 'Cloud Computing',
  lesson: SESSION,
  presenter: 'NxtWave Instructor',
  /* every move a transition, picker thumbnails, and the step/slide switch hidden (course skill R1) */
  player: { autoHideControls: true, smooth: true, thumbnails: true, hideModeSwitch: true },
}

/** The TR's own agenda, five items; the Key Takeaways frame repeats these strings (content rule 20). */
export const AGENDA = [
  { title: 'Cloud Deployment Models', sub: 'Public cloud; private cloud: on-premise vs hosted; hybrid & cloud bursting; community cloud' },
  { title: 'Multi-Cloud', sub: 'Motivations: resilience, negotiation & regulation; operational cost of multiple platforms' },
  { title: 'Service Models', sub: 'IaaS, PaaS & SaaS: what each provides & abstracts; representative services' },
  { title: 'Beyond the Big Three', sub: 'Function as a Service (FaaS) & serverless; AI/ML-as-a-Service; responsibility boundaries across models' },
  { title: 'Cloud Economics & Providers', sub: 'CapEx vs OpEx; total cost of ownership (TCO); pricing: on-demand, committed use & spot; AWS, Azure, GCP & Indian providers' },
]

/** The previous session's five agenda titles, for the recap frame (reference slide 3). */
const PREVIOUS = [{ title: 'Cloud Computing Basics' }, { title: 'History & Evolution' }, { title: 'Essential Characteristics - I' }, { title: 'Essential Characteristics - II' }, { title: 'Benefits & Challenges' }]

/* the keyframes the scene helpers use; harness URLs hold every loop still */
if (typeof document !== 'undefined' && !document.getElementById('cc-css')) {
  const el = document.createElement('style')
  el.id = 'cc-css'
  el.textContent = ART_CSS + SCENE_CSS + MOTION_CSS
  document.head.appendChild(el)
  if (STILL) document.documentElement.classList.add('cc-still')
  /* session 1's 3D finish for the drawn objects (2026-10-26 visual rebuild, figures/d3/kit.tsx) */
  if (document.body) mountClayDefs()
  else document.addEventListener('DOMContentLoaded', mountClayDefs)
}
installSpecKeys()
revealEveryStep()
installEntrances()

const say = (s: string) => `TR speaker notes: ${s}`
const analogy = (s: string) => `TR analogy: ${s}`

export const deployDeck: SlideDef[] = [
  /* ── OPENING ─────────────────────────────────────────────────────────── */
  { id: 'brand', section: 'Opening', label: 'Brand', transition: 'fade', element: <BrandSlide greeting="Welcome!" lesson={SESSION} />, notes: 'The opening mark. Content rule 21 keeps "Welcome to today\'s session" for the next frame.' },
  { id: 'welcome', section: 'Opening', label: 'Welcome', transition: 'zoom', element: <WelcomeSlide minimal title={SESSION} lesson={SESSION} />, notes: 'The session name, in minimal mode: the kicker and the title, nothing else.' },
  { id: 'recap', section: 'Opening', label: 'Recap', element: <Takeaways id="recap" kicker="Recap" title="Cloud Computing Fundamentals" lesson={SESSION} items={PREVIOUS} />, notes: "The TR's recap block: the five agenda items of the previous session, titles only, in the takeaways layout. Ask which one the room is least sure of before moving on." },
  { id: 'agenda', section: 'Opening', label: 'Agenda', element: <AgendaSlide kicker={SESSION} title="Agenda" lesson={SESSION} items={AGENDA.map(({ title }) => ({ title }))} />, notes: "The TR's agenda, all five items, titles only; the Key Takeaways frame repeats these strings (content rule 20)." },

  /* ── 1 · CLOUD DEPLOYMENT MODELS ─────────────────────────────────────── */
  { id: 's1', section: AGENDA[0].title, label: 'Section divider', transition: 'zoom', element: <SectionBreakerSlide index={1} title={AGENDA[0].title} lesson={SESSION} />, notes: 'TR section 1. The title only (the user, 2026-10-23: no description on a section breaker).' },
  { id: 'deploy-map', section: AGENDA[0].title, label: 'Deployment models map', element: <DeployMap lesson={SESSION} />, notes: `${say('Frame deployment choice as a spectrum from fully shared to fully dedicated infrastructure. A common exam question gives a scenario and asks which model fits it best.')} TR visual guidance: four boxes labelled Public, Private, Hybrid, Community around a central "Infrastructure Choice" node, arrows showing a spectrum from fully shared to fully dedicated. The pointer walks the rail and lights each site in turn.` },
  { id: 'public', section: AGENDA[0].title, label: 'Public cloud', element: <PublicCloud lesson={SESSION} />, notes: `${say('Note that AWS, Azure and Google Cloud Platform (GCP) are the leading public cloud providers offering this shared model. Interviewers often test whether a given scenario needs public or private cloud based on tenancy and control.')} The TR's own diagram: the provider in the middle, Enterprise P and Q either side, User R below, every arrow pointing outward from the provider.` },
  { id: 'public-analogy', section: AGENDA[0].title, label: 'Analogy: a shared cab', element: <PublicAnalogy lesson={SESSION} />, notes: 'Riders of three colours board the one cab at the stop; on the cloud side the same three colours light slots in one provider rack. Many riders, one vehicle; many tenants, one shared infrastructure.' },
  { id: 'private', section: AGENDA[0].title, label: 'Private cloud', element: <PrivateCloud lesson={SESSION} />, notes: `${say("Private cloud is the answer when compliance, data residency or latency rules out shared hardware. Point at the fence: on the left it is the organisation's own wall, on the right it is the provider's, and the dedicated rack inside it is the only lit one.")} TR visual guidance: split diagram, left a building icon inside an organisation's fence (on-premise); right the same dedicated building inside a provider's larger data centre fence (hosted).` },
  { id: 'private-table', section: AGENDA[0].title, label: 'Private cloud table', element: <PrivateTable lesson={SESSION} />, notes: "The TR's table: location, owner, example and control for on-premise against hosted private cloud." },
  { id: 'private-analogy', section: AGENDA[0].title, label: 'Analogy: a house or a bungalow', element: <PrivateAnalogy lesson={SESSION} />, notes: 'Build a house on your own plot, or rent a bungalow in a gated estate: either way one key, and the place is yours alone. On-premise and hosted private cloud are the same choice.' },
  { id: 'hybrid', section: AGENDA[0].title, label: 'Hybrid cloud', element: <HybridCloud lesson={SESSION} />, notes: "The TR's own diagram, drawn as one linked system (the user, 2026-10-23: the reference's two separate boxes were not correct): Enterprise P's private site bridged to the public provider, P present on both sides, workloads crossing. The next frame says what moves across the link, and when." },
  { id: 'hybrid-burst', section: AGENDA[0].title, label: 'Cloud bursting', element: <HybridBurst lesson={SESSION} />, notes: `${say('Stress that bursting is temporary and automatic, not a permanent migration of workloads. A common interview question asks how hybrid architecture avoids over-provisioning private capacity for rare peaks.')} TR visual guidance: two linked boxes, "Private Infrastructure" and "Public Cloud", with a dashed arrow labelled "burst" flowing from private to public only when a load gauge crosses a threshold line. Watch one full loop before talking.` },
  { id: 'hybrid-analogy', section: AGENDA[0].title, label: 'Analogy: a banquet hall', element: <HybridAnalogy lesson={SESSION} />, notes: analogy("A restaurant kitchen handles daily orders alone, but during a wedding rush it hires a banquet hall's ovens for the overflow and releases them once the rush ends, just as cloud bursting shifts excess load to public cloud only during demand spikes.") },
  { id: 'community', section: AGENDA[0].title, label: 'Community cloud', element: <CommunityCloud lesson={SESSION} />, notes: `${say('Position community cloud as narrower than public but broader than private, sized to one sector\'s shared compliance need. An interviewer may ask why a government agency would pick AWS GovCloud over standard public cloud.')} The TR's own diagram: one shared block, organisation icons for government, healthcare and research, ringed off from the general public.` },
  { id: 'deploy-compared', section: AGENDA[0].title, label: 'Deployment models compared', element: <DeployCompared lesson={SESSION} />, notes: `${say('Use this table to map any given scenario, such as a hospital or a startup, to its best-fit deployment model. A recurring exam pattern gives a scenario and asks which model minimises cost while meeting its compliance need.')} TR visual guidance: the "Owned By" column colour-coded to reinforce the control-versus-sharing spectrum from the first frame.` },

  /* ── 2 · MULTI-CLOUD ─────────────────────────────────────────────────── */
  { id: 's2', section: AGENDA[1].title, label: 'Section divider', transition: 'zoom', element: <SectionBreakerSlide index={2} title={AGENDA[1].title} lesson={SESSION} />, notes: 'TR section 2.' },
  { id: 'multicloud', section: AGENDA[1].title, label: 'Multi-cloud defined', element: <MultiCloud lesson={SESSION} />, notes: `${say('Stress that multi-cloud is a deliberate split among public providers, not a synonym for hybrid cloud. A common interview question asks to differentiate multi-cloud from hybrid cloud with an example.')} TR visual guidance: one company icon with three arrows branching to AWS, Azure and GCP logos, each labelled with a workload type. The three workload lines are the TR's three bullets.` },
  { id: 'multi-vs-hybrid', section: AGENDA[1].title, label: 'Multi-cloud against hybrid', element: <MultiVsHybrid lesson={SESSION} />, notes: "The TR's own diagram, redrawn and corrected (the source captioned two marks \"Azure\"): left, several public providers together, each with its own name; right, one private cloud linked to a public one." },
  { id: 'multicloud-analogy', section: AGENDA[1].title, label: 'Analogy: two banks', element: <MultiAnalogy lesson={SESSION} />, notes: 'Savings split between two banks: one closes its shutter and the money is still there at the other. Two providers: one goes dark and the traffic carries on through the other.' },
  { id: 'motivations', section: AGENDA[1].title, label: 'Multi-cloud motivations', element: <Motivations lesson={SESSION} />, notes: `${say('Walk through each motivation with a one-line business scenario before naming it. Interviewers frequently ask why a company would choose multi-cloud over a single vendor: resilience, leverage and compliance form the three-part answer.')} TR visual guidance: three labelled icons (shield, handshake, gavel) mapped to resilience, negotiation and regulation.` },
  { id: 'overhead', section: AGENDA[1].title, label: 'Operational overhead', element: <Overhead lesson={SESSION} />, notes: `${say("Frame overhead as the price paid for multi-cloud's benefits, not a separate flaw. A typical exam question asks to list the operational costs of running a multi-cloud environment.")} TR visual guidance: a table-style graphic, rows for Skills, Tooling, Billing, Security, each row showing duplicated icons across AWS, Azure and GCP columns. The same icon three times in a row is the claim.` },
  { id: 'quiz-mid', section: AGENDA[1].title, label: 'Quiz time', transition: 'zoom', element: <ClassroomQuiz lesson={SESSION} />, notes: 'The first quiz frame, after the second topic: it tests the four deployment models and what multi-cloud is, which every later section assumes. Open the quiz on the portal, everyone answers alone, then go through the answers together.' },

  /* ── 3 · SERVICE MODELS ──────────────────────────────────────────────── */
  { id: 's3', section: AGENDA[2].title, label: 'Section divider', transition: 'zoom', element: <SectionBreakerSlide index={3} title={AGENDA[2].title} lesson={SESSION} />, notes: 'TR section 3.' },
  { id: 'stack', section: AGENDA[2].title, label: 'Service model spectrum', element: <StackMap lesson={SESSION} />, notes: `${say('Point out that only the ownership line moves, not the stack itself. Interviewers often test whether a named service can be placed on the correct layer.')} TR visual guidance: a horizontal stack bar split into layers, shaded by owner colour for IaaS, PaaS and SaaS side by side. The TR table's cell words (Customer, Provider) are in the slabs, under the "Stack layer" heading.` },
  { id: 'stack-grid', section: AGENDA[2].title, label: 'Any service model on any deployment model', element: <StackGrid lesson={SESSION} />, notes: "The TR's second paragraph, drawn: deployment models along one edge, service models along the other, and the TR's two examples lit. The deployment models from the first section and the service models from this one are two separate questions, and the room should be able to say which question a given word answers." },
  { id: 'iaas', section: AGENDA[2].title, label: 'IaaS', element: <Iaas lesson={SESSION} />, notes: `${say('IaaS gives maximum control at the cost of managing everything above hardware. Interviewers often ask to map EC2 or a virtual machine to this layer.')} The TR's own diagram: a cloud labelled IaaS with three connectors down to storage, compute and network.` },
  { id: 'iaas-analogy', section: AGENDA[2].title, label: 'Analogy: a kitchen only', element: <IaasAnalogy lesson={SESSION} />, notes: analogy("Domino's kitchen space and oven are used, but the dough, sauce and toppings are supplied separately and the pizza is cooked from scratch, just as the IaaS provider manages only the physical infrastructure while the customer manages the operating system, runtime and application.") },
  { id: 'paas', section: AGENDA[2].title, label: 'PaaS', element: <Paas lesson={SESSION} />, notes: `${say('PaaS trades some flexibility for less operational work than IaaS. Interviewers often ask why Elastic Beanstalk beats raw EC2.')} The TR's own diagram: a cloud labelled PaaS above the managed pieces and the one thing the customer brings.` },
  { id: 'paas-analogy', section: AGENDA[2].title, label: 'Analogy: a kitchen with dough ready', element: <PaasAnalogy lesson={SESSION} />, notes: analogy("Domino's kitchen, oven and ready dough are already set up, so only assembling and baking the pizza on that setup remains, just as the PaaS provider manages infrastructure, operating system and runtime while the customer manages only the application.") },
  { id: 'saas', section: AGENDA[2].title, label: 'SaaS', element: <Saas lesson={SESSION} />, notes: `${say('SaaS trades all control for zero operational burden, completing the IaaS-PaaS-SaaS spectrum. Interviewers often ask to classify Gmail or a CRM tool by service model.')} The TR's own diagram: a cloud labelled SaaS delivering a finished application to several devices.` },
  { id: 'saas-analogy', section: AGENDA[2].title, label: 'Analogy: a ready-made pizza', element: <SaasAnalogy lesson={SESSION} />, notes: analogy("A ready-made pizza is ordered directly from Domino's with no kitchen work at all, just as the SaaS provider manages the entire stack while the customer only uses the finished application.") },

  /* ── 4 · BEYOND THE BIG THREE ────────────────────────────────────────── */
  { id: 's4', section: AGENDA[3].title, label: 'Section divider', transition: 'zoom', element: <SectionBreakerSlide index={4} title={AGENDA[3].title} lesson={SESSION} />, notes: 'TR section 4.' },
  { id: 'beyond', section: AGENDA[3].title, label: 'Beyond IaaS, PaaS and SaaS', element: <Beyond lesson={SESSION} />, notes: 'Five steps rising from IaaS to AI/ML-as-a-Service: on each step the user share shrinks and the provider share grows. The two newer models push abstraction higher.' },
  { id: 'faas', section: AGENDA[3].title, label: 'FaaS and serverless', element: <Faas lesson={SESSION} />, notes: `${say('Emphasise that FaaS removes even the persistent runtime instance PaaS still manages. Interview question: differentiate FaaS from PaaS by billing granularity.')} The four triggers fire a function that exists only while it runs.` },
  { id: 'faas-timeline', section: AGENDA[3].title, label: "A function's life", element: <FaasTimeline lesson={SESSION} />, notes: 'Idle, a trigger event, the function instantiated, it executes, it is torn down. The billing bracket lights only across the two stations where it runs.' },
  { id: 'faas-analogy', section: AGENDA[3].title, label: 'Analogy: a cab for one trip', element: <FaasAnalogy lesson={SESSION} />, notes: 'A cab is hailed, the meter runs only for the trip, the cab leaves. A function appears on its trigger, is billed while it runs, and is torn down.' },
  { id: 'aiml', section: AGENDA[3].title, label: 'AI/ML-as-a-Service', element: <AiMl lesson={SESSION} />, notes: `${say('Distinguish SageMaker, a full ML platform, from Rekognition and Comprehend, narrow pre-built APIs. Interviewers often ask when to call a managed AI service instead of training a custom model.')} The model service is a building with an API door; the GPUs inside are the provider's, the input data at the door is the user's.` },
  { id: 'aiml-flow', section: AGENDA[3].title, label: 'An API call to a model', element: <AiMlFlow lesson={SESSION} />, notes: 'The round trip: the application sends an API call to the pre-trained model service and a prediction comes back. Nothing is trained or hosted on the application side.' },
  { id: 'aiml-analogy', section: AGENDA[3].title, label: 'Analogy: a specialist doctor', element: <AiMlAnalogy lesson={SESSION} />, notes: 'One consultation with a specialist, with no hospital of your own to build. One API call to a trained model, with no GPUs of your own to run.' },
  { id: 'responsibility', section: AGENDA[3].title, label: 'Responsibility boundaries', element: <Responsibility lesson={SESSION} />, notes: `${say('Point out this table extends the same responsibility axis used for IaaS, PaaS and SaaS to FaaS and AI/ML-as-a-Service. This full spectrum is a favourite interview format for comparing cloud service models.')} TR visual guidance: a full-width table, one row per model, shading intensity rising to show growing provider responsibility.` },

  /* ── 5 · CLOUD ECONOMICS & PROVIDERS ─────────────────────────────────── */
  { id: 's5', section: AGENDA[4].title, label: 'Section divider', transition: 'zoom', element: <SectionBreakerSlide index={5} title={AGENDA[4].title} lesson={SESSION} />, notes: 'TR section 5.' },
  { id: 'econ-map', section: AGENDA[4].title, label: 'Cloud economics map', element: <EconMap lesson={SESSION} />, notes: 'The four questions this section answers: how spend is classified, the true multi-year cost, the three pricing models, and who supplies the infrastructure.' },
  { id: 'capex-opex', section: AGENDA[4].title, label: 'CapEx vs OpEx', element: <CapexOpex lesson={SESSION} />, notes: 'Balance sheet against income statement: one large spend depreciated over time, or the same amount each month. The frame after this one carries the approvals and the tax timing.' },
  { id: 'capex-opex-more', section: AGENDA[4].title, label: 'CapEx vs OpEx, continued', element: <CapexOpexMore lesson={SESSION} />, notes: say('Stress that AWS invoices are OpEx by default, which is why finance teams favour the flexibility. Interviewers often ask why cloud shifted budgeting power from capital committees to individual teams.') },
  { id: 'capex-analogy', section: AGENDA[4].title, label: 'Analogy: a house on a loan, or rent', element: <CapexAnalogy lesson={SESSION} />, notes: 'A house bought on a loan is an asset on the books; a rented flat is a monthly cost. An owned rack is CapEx; a cloud invoice is OpEx.' },
  { id: 'tco', section: AGENDA[4].title, label: 'Total cost of ownership', element: <Tco lesson={SESSION} />, notes: `${say('Emphasise that TCO, not sticker price, is the number that should justify a migration. TCO comparisons are a favourite whiteboard question when interviewers test cloud cost reasoning.')} TR visual guidance: a layered bar, sticker price at the base, staffing, power and downtime stacked above it to show true TCO.` },
  { id: 'tco-analogy', section: AGENDA[4].title, label: 'Analogy: a smartphone', element: <TcoAnalogy lesson={SESSION} />, notes: analogy("A smartphone's price tag ignores the data plan, repairs and accessories bought over its life, just as a server's purchase price ignores the staffing, power and downtime that TCO adds back in.") },
  { id: 'pricing', section: AGENDA[4].title, label: 'Three pricing models', element: <Pricing lesson={SESSION} />, notes: 'On-demand, committed use, spot: the price falls as the buyer gives up flexibility. The spot tag can be taken back at short notice.' },
  { id: 'pricing-analogy', section: AGENDA[4].title, label: 'Analogy: three train tickets', element: <PricingAnalogy lesson={SESSION} />, notes: 'A walk-up ticket, a season pass, a standby ticket that can be bumped when the train fills. The same three bargains as on-demand, committed use and spot.' },
  { id: 'pricing-table', section: AGENDA[4].title, label: 'Pricing models compared', element: <PricingTable lesson={SESSION} />, notes: "The TR's table: commitment, typical discount, key risk and best fit for each of the three." },
  { id: 'pricing-bars', section: AGENDA[4].title, label: 'Discount against flexibility', element: <PricingBars lesson={SESSION} />, notes: "TR visual guidance: a three-column bar chart showing discount depth against flexibility surrendered for each model. The bar heights are the TR's own numbers, ~70% and ~90%, with the on-demand baseline as a stub." },
  { id: 'providers', section: AGENDA[4].title, label: 'Global cloud providers', element: <Providers lesson={SESSION} />, notes: `${say('Keep the comparison at strategic strength rather than a feature-by-feature list. Interviewers often ask which provider suits an AI-heavy startup versus a Windows-heavy enterprise.')} TR visual guidance: three logos in a row, one strength keyword under each.` },
  { id: 'india', section: AGENDA[4].title, label: 'Indian cloud providers', element: <India lesson={SESSION} />, notes: `${say('Note that data-residency and sector regulation, not just price, drive some workloads to Indian providers. This regulatory angle is a common follow-up question after any provider-comparison discussion.')} TR visual guidance asks for a map of India with data-centre pins beside the hyperscaler logos; no map outline is drawn (plan decision 3), one pin per provider inside an in-country zone instead.` },

  /* ── CLOSING ─────────────────────────────────────────────────────────── */
  { id: 'quiz-close', section: 'Closing', label: 'Quiz time', transition: 'zoom', element: <ClassroomQuiz lesson={SESSION} />, notes: 'The second quiz frame, immediately before Key Takeaways (content rule 18): the last chance to find out whether the room believes the takeaways while the session is still in the room.' },
  { id: 'takeaways', section: 'Closing', label: 'Key takeaways', element: <Takeaways lesson={SESSION} items={AGENDA} />, notes: "The TR's Key Takeaways list, which is its agenda word for word; the five titles, as the agenda frame shows them." },
  { id: 'next-session', section: 'Closing', label: 'Next session', transition: 'zoom', element: <NextSessionSlide title="Virtualization & Hypervisors" lesson={SESSION} />, notes: "The TR's own upcoming-session line, named by title, not by number (content rule 2b)." },
  { id: 'feedback', section: 'Closing', label: 'Feedback', element: <FeedbackSlide lesson={SESSION} />, notes: 'Leave it on screen while the room fills the form. Read the link out rather than assuming everyone can see it.' },
  { id: 'thank-you', section: 'Closing', label: 'Thank you', transition: 'zoom', element: <ThankYouSlide title="Thank You" lesson={SESSION} /> },
  { id: 'all-the-best', section: 'Closing', label: 'All the Best', transition: 'zoom', element: <ThankYouSlide title="All the Best" lesson={SESSION} /> },
]

/** No slide opens with Autoplay (no builds); the kit's set ships holding Python 31's numbers. */
AUTOPLAY_ON_BY_DEFAULT.clear()
