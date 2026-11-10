import type React from 'react'
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
import { VH_CSS } from './figures/vh/frames'
import { Landscape, Benefits, Server, ServerZoom, Storage } from './figures/vh/basics-a'
import { StorageAnalogy, Network, NetworkLoops, NetworkAnalogy, DesktopApp, DesktopAnalogy, TypesCompared } from './figures/vh/basics-b'
import { Vmm, VmmRole, VmmAnalogy, Type1, Type2, TypeCompare } from './figures/vh/hyper'
import { Techniques, Full, FullPath, FullAnalogy, Para, ParaPath, ParaAnalogy, HwAssisted, TechniquesCompared } from './figures/vh/tech'
import { Anatomy, Vcpu, DiskNic, Artifacts, CreateVm } from './figures/vh/anatomy'
import { Install1, Install2, Install3, Install4, Install5, Wizard1, Wizard2, Wizard3, Boot1, Boot2 } from './figures/vh/walk'
import { Lifecycle, SuspendSnapshotClone, LiveMigration, LiveAnalogy, Cost } from './figures/vh/life'
import { NOTES } from './vhNotes'

/**
 * CLOUD COMPUTING · "Virtualization & Hypervisors"
 *
 * Built from `Outputs/cloudcomputing/session_plans/virtualization_and_hypervisors/plan.md`
 * (signed off on the user's word, 2026-10-27). The source is the reference deck
 * `Reference ppt's/virtualization-and-hypervisors 2.html`, CONTENT ONLY: every
 * kicker, title, lead, bullet, table cell, label and caption is its string,
 * unchanged. The speaker notes are its own notes (`vhNotes.ts`), which quote the
 * TR speaker notes and Visual Guidance. The TR PDF is used for comparison only;
 * the walkthrough captures are its images, which the reference names but does
 * not carry.
 *
 * THE DESIGN is session 2's current one (session 1's 3D finish): `Card`, the
 * points rail beside a raised stage, library renders (`Icon3D`) and clay
 * objects, every figure one self-running loop held still on harness URLs. No
 * builds (`revealEveryStep`), every element enters in reading order
 * (`figures/entrance.ts`). Section files: `figures/vh/`.
 */

export const SESSION = 'Virtualization & Hypervisors'

export const vhMeta: DeckMeta = {
  title: SESSION,
  course: 'Cloud Computing',
  lesson: SESSION,
  presenter: 'NxtWave Instructor',
  /* every move a transition, picker thumbnails, and the step/slide switch hidden (course skill R1) */
  player: { autoHideControls: true, smooth: true, thumbnails: true, hideModeSwitch: true },
}

/** The reference's agenda, five items; the Key Takeaways frame repeats these strings (content rule 20). */
export const AGENDA = [
  { title: 'Virtualization Basics', sub: 'Physical vs virtual resources; consolidation, isolation & utilization; types: server, storage, network, desktop, application' },
  { title: 'Hypervisors', sub: 'Type 1 (bare-metal) vs Type 2 (hosted); Virtual Machine Monitor (VMM) & its role' },
  { title: 'Virtualization Techniques', sub: 'Full virtualization; para-virtualization; hardware-assisted virtualization (VT-x / AMD-V)' },
  { title: 'Virtual Machine Anatomy', sub: 'vCPU, virtual memory, virtual disk & virtual NIC; machine images, templates & snapshots' },
  { title: 'VM Lifecycle & Migration', sub: 'Provision, start, suspend, snapshot, clone & terminate; live migration & its uses' },
]

/** The previous session's five agenda items, for the recap frame (reference slide 3). */
const PREVIOUS = [
  { title: 'Cloud Deployment Models', sub: 'Public cloud; private cloud: on-premise vs hosted; hybrid & cloud bursting; community cloud' },
  { title: 'Multi-Cloud', sub: 'Motivations: resilience, negotiation & regulation; operational cost of multiple platforms' },
  { title: 'Service Models', sub: 'IaaS, PaaS & SaaS: what each provides & abstracts; representative services' },
  { title: 'Beyond the Big Three', sub: 'Function as a Service (FaaS) & serverless; AI/ML-as-a-Service; responsibility boundaries across models' },
  { title: 'Cloud Economics & Providers', sub: 'CapEx vs OpEx; total cost of ownership (TCO); pricing: on-demand, committed use & spot; AWS, Azure, GCP & Indian providers' },
]

/* the keyframes the scene helpers use; harness URLs hold every loop still */
if (typeof document !== 'undefined' && !document.getElementById('cc-css')) {
  const el = document.createElement('style')
  el.id = 'cc-css'
  el.textContent = ART_CSS + SCENE_CSS + MOTION_CSS + VH_CSS
  document.head.appendChild(el)
  if (STILL) document.documentElement.classList.add('cc-still')
  if (document.body) mountClayDefs()
  else document.addEventListener('DOMContentLoaded', mountClayDefs)
}
installSpecKeys()
revealEveryStep()
installEntrances()

const S = AGENDA.map((a) => a.title)
const note = (id: string) => NOTES[id] ?? ''
const breaker = (i: number): SlideDef => ({ id: `s${i + 1}`, section: S[i], label: 'Section divider', transition: 'zoom', element: <SectionBreakerSlide index={i + 1} title={S[i]} lesson={SESSION} />, notes: `TR section ${i + 1}. The title only.` })
const slide = (id: string, section: string, label: string, El: (p: { lesson: string }) => React.ReactElement): SlideDef => ({ id, section, label, element: <El lesson={SESSION} />, notes: note(id) })
const WALK = 'Trainer walks through each screen live rather than reading the captions (the TR\'s own instruction).'

export const vhDeck: SlideDef[] = [
  /* ── OPENING ─────────────────────────────────────────────────────────── */
  { id: 'brand', section: 'Opening', label: 'Brand', transition: 'fade', element: <BrandSlide greeting="Welcome!" lesson={SESSION} />, notes: note('brand') },
  { id: 'welcome', section: 'Opening', label: 'Welcome', transition: 'zoom', element: <WelcomeSlide minimal title={SESSION} lesson={SESSION} />, notes: note('welcome') },
  { id: 'recap', section: 'Opening', label: 'Recap', element: <Takeaways id="recap" kicker="Recap" title="Deployment & Service Models" lesson={SESSION} items={PREVIOUS} />, notes: note('recap') },
  { id: 'agenda', section: 'Opening', label: 'Agenda', element: <AgendaSlide kicker={SESSION} title="Agenda" lesson={SESSION} items={AGENDA.map(({ title }) => ({ title }))} />, notes: note('agenda') },

  /* ── 1 · VIRTUALIZATION BASICS ───────────────────────────────────────── */
  breaker(0),
  slide('landscape', S[0], 'Virtualization landscape', Landscape),
  slide('benefits', S[0], 'Three core benefits', Benefits),
  slide('server', S[0], 'Server virtualization', Server),
  slide('server-zoom', S[0], 'Server virtualization: one VM', ServerZoom),
  slide('storage', S[0], 'Storage virtualization', Storage),
  slide('storage-analogy', S[0], "Analogy: a bank's shared pool", StorageAnalogy),
  slide('network', S[0], 'Network virtualization', Network),
  slide('network-loops', S[0], 'Network virtualization: logical networks', NetworkLoops),
  slide('network-analogy', S[0], 'Analogy: a Wi-Fi for each company', NetworkAnalogy),
  slide('desktop-app', S[0], 'Desktop and app virtualization', DesktopApp),
  slide('desktop-analogy', S[0], 'Analogy: cable TV', DesktopAnalogy),
  slide('types-compared', S[0], 'Virtualization types compared', TypesCompared),

  /* ── 2 · HYPERVISORS ─────────────────────────────────────────────────── */
  breaker(1),
  slide('vmm', S[1], 'Hypervisor and VMM', Vmm),
  slide('vmm-role', S[1], 'What a hypervisor does', VmmRole),
  slide('vmm-analogy', S[1], 'Analogy: an apartment management office', VmmAnalogy),
  slide('type1', S[1], 'Type 1 hypervisor', Type1),
  slide('type2', S[1], 'Type 2 hypervisor', Type2),
  slide('type-compare', S[1], 'Bare-metal vs hosted', TypeCompare),
  { id: 'quiz-mid', section: S[1], label: 'Quiz time', transition: 'zoom', element: <ClassroomQuiz lesson={SESSION} />, notes: `${note('quiz-mid')} Open the quiz on the portal, everyone answers alone, then go through the answers together.` },

  /* ── 3 · VIRTUALIZATION TECHNIQUES ───────────────────────────────────── */
  breaker(2),
  slide('techniques', S[2], 'Three techniques', Techniques),
  slide('full', S[2], 'Full virtualization', Full),
  slide('full-path', S[2], 'Full virtualization: the path', FullPath),
  slide('full-analogy', S[2], 'Analogy: a live interpreter', FullAnalogy),
  slide('para', S[2], 'Para-virtualization', Para),
  slide('para-path', S[2], 'Para-virtualization: hypercalls', ParaPath),
  slide('para-analogy', S[2], 'Analogy: a service bell', ParaAnalogy),
  slide('hw-assisted', S[2], 'Hardware-assisted virtualization', HwAssisted),
  slide('techniques-compared', S[2], 'Three techniques compared', TechniquesCompared),

  /* ── 4 · VIRTUAL MACHINE ANATOMY ─────────────────────────────────────── */
  breaker(3),
  slide('anatomy', S[3], 'VM anatomy map', Anatomy),
  slide('vcpu', S[3], 'vCPU and memory', Vcpu),
  slide('disk-nic', S[3], 'Disk and NIC', DiskNic),
  slide('artifacts', S[3], 'VM packaging artifacts', Artifacts),
  slide('create-vm', S[3], 'Creating a VM', CreateVm),
  { ...slide('install-1', S[3], 'Installing VirtualBox 1', Install1), notes: `${note('install-1')}` },
  { ...slide('install-2', S[3], 'Installing VirtualBox 2', Install2), notes: WALK },
  { ...slide('install-3', S[3], 'Installing VirtualBox 3', Install3), notes: WALK },
  { ...slide('install-4', S[3], 'Installing VirtualBox 4', Install4), notes: WALK },
  { ...slide('install-5', S[3], 'Installing VirtualBox 5', Install5), notes: WALK },
  { ...slide('wizard-1', S[3], 'New VM wizard 1', Wizard1), notes: WALK },
  { ...slide('wizard-2', S[3], 'New VM wizard 2', Wizard2), notes: WALK },
  { ...slide('wizard-3', S[3], 'New VM wizard 3', Wizard3), notes: WALK },
  slide('boot-1', S[3], 'First boot', Boot1),
  { ...slide('boot-2', S[3], 'First boot 2', Boot2), notes: WALK },

  /* ── 5 · VM LIFECYCLE & MIGRATION ────────────────────────────────────── */
  breaker(4),
  slide('lifecycle', S[4], 'Lifecycle stages', Lifecycle),
  slide('suspend-snapshot-clone', S[4], 'Suspend, snapshot, clone', SuspendSnapshotClone),
  slide('live-migration', S[4], 'Live migration', LiveMigration),
  slide('live-analogy', S[4], 'Analogy: a call between towers', LiveAnalogy),
  slide('cost', S[4], 'Cost of full VMs', Cost),

  /* ── CLOSING ─────────────────────────────────────────────────────────── */
  { id: 'quiz-close', section: 'Closing', label: 'Quiz time', transition: 'zoom', element: <ClassroomQuiz lesson={SESSION} />, notes: note('quiz-close') },
  { id: 'takeaways', section: 'Closing', label: 'Key takeaways', element: <Takeaways lesson={SESSION} items={AGENDA} />, notes: note('takeaways') },
  { id: 'next-session', section: 'Closing', label: 'Next session', transition: 'zoom', element: <NextSessionSlide title="Containers vs Virtual Machines" lesson={SESSION} />, notes: note('next-session') },
  { id: 'feedback', section: 'Closing', label: 'Feedback', element: <FeedbackSlide lesson={SESSION} />, notes: note('feedback') },
  { id: 'thank-you', section: 'Closing', label: 'Thank you', transition: 'zoom', element: <ThankYouSlide title="Thank you!" lesson={SESSION} />, notes: note('thank-you') },
  { id: 'all-the-best', section: 'Closing', label: 'All the Best', transition: 'zoom', element: <ThankYouSlide title="All the Best" lesson={SESSION} /> },
]

/** No slide opens with Autoplay (no builds); the kit's set ships holding Python 31's numbers. */
AUTOPLAY_ON_BY_DEFAULT.clear()
