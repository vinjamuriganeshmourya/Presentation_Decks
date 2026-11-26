import type React from 'react'
import type { DeckMeta, SlideDef } from '@/deck/types'
import { BrandSlide, NextSessionSlide, SectionBreakerSlide, ThankYouSlide, WelcomeSlide } from '@/slides'
import { Takeaways } from './figures/closing'
import { AgendaColumns, QuizCard } from './figures/variants'
import { installSpecKeys } from '@/ui/foundations/keys'
import { AUTOPLAY_ON_BY_DEFAULT } from '@/ui/foundations/autoplay'
import { revealEveryStep } from '@/motion/Stepper'
import { installEntrances } from './figures/entrance'
import { MOTION_CSS } from './figures/motion'
import { SCENE_CSS, STILL } from './figures/scene'
import { ART_CSS, mountClayDefs } from './figures/art'
import { VH_CSS } from './figures/vh/frames'
import { Landscape, Benefits, Server, ServerZoom, Storage } from './figures/vh/basics-a'
import { StorageAnalogy, Network, NetworkLoops, DesktopApp, TypesCompared } from './figures/vh/basics-b'
import { Vmm, VmmRole, VmmAnalogy, Type1, Type2, TypeCompare } from './figures/vh/hyper'
import { Techniques, Full, FullPath, FullAnalogy, Para, ParaPath, HwAssisted, TechniquesCompared } from './figures/vh/tech'
import { Anatomy, Vcpu, DiskNic, Artifacts } from './figures/vh/anatomy'
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
 * SPLIT (user, 2026-11-26): slides 37-47 of the student view (Creating a VM to
 * First boot 2) became "Creating Virtual Machine Using Virtual Box"
 * (../practical_hands_on_creating_virtual_machine_using_virtual_box). The four
 * frames hidden in the shared student file (three analogies and the mid quiz)
 * are out of the list too, so this deck is the 47 slides that file showed.
 * Next Session unchanged on the user's word.
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
/** The review pairs (user, 2026-10-30): version 1 of the agenda and the two quiz frames, each directly beside its version 0; the user keeps one of each. */
const PAIR = (which: string, other: string) => `REVIEW PAIR (user, 2026-10-30): ${which}, beside ${other}. Keep one and delete the other.`

export const vhDeck: SlideDef[] = [
  /* ── OPENING ─────────────────────────────────────────────────────────── */
  { id: 'brand', section: 'Opening', label: 'Brand', transition: 'fade', element: <BrandSlide greeting="Welcome!" lesson={SESSION} />, notes: note('brand') },
  { id: 'welcome', section: 'Opening', label: 'Welcome', transition: 'zoom', element: <WelcomeSlide minimal title={SESSION} lesson={SESSION} />, notes: note('welcome') },
  { id: 'recap', section: 'Opening', label: 'Recap', element: <Takeaways id="recap" kicker="Recap" title="Deployment & Service Models" lesson={SESSION} items={PREVIOUS} art="/assets/takeaways/presenter.png" />, notes: note('recap') },
  { id: 'agenda-1', section: 'Opening', label: 'Agenda (layout 1)', element: <AgendaColumns kicker={SESSION} lesson={SESSION} items={AGENDA.map(({ title }) => ({ title }))} />, notes: PAIR('agenda1, the column layout (titles only, course lesson 4)', 'agenda0, the kit agenda (the previous frame)') },

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
  /* removed 2026-11-26 to match the shared student file, where it was hidden (a hidden slide is deleted in a student file): network-analogy, Analogy: a Wi-Fi for each company (NetworkAnalogy, basics-b.tsx) */
  slide('desktop-app', S[0], 'Desktop and app virtualization', DesktopApp),
  /* removed 2026-11-26 to match the shared student file, where it was hidden (a hidden slide is deleted in a student file): desktop-analogy, Analogy: cable TV (DesktopAnalogy, basics-b.tsx) */
  slide('types-compared', S[0], 'Virtualization types compared', TypesCompared),

  /* ── 2 · HYPERVISORS ─────────────────────────────────────────────────── */
  breaker(1),
  slide('vmm', S[1], 'Hypervisor and VMM', Vmm),
  slide('vmm-role', S[1], 'What a hypervisor does', VmmRole),
  slide('vmm-analogy', S[1], 'Analogy: an apartment management office', VmmAnalogy),
  slide('type1', S[1], 'Type 1 hypervisor', Type1),
  slide('type2', S[1], 'Type 2 hypervisor', Type2),
  slide('type-compare', S[1], 'Bare-metal vs hosted', TypeCompare),
  /* removed 2026-11-26 to match the shared student file, where it was hidden (a hidden slide is deleted in a student file): quiz-mid-1, the mid-deck Quiz Time! card (QuizCard) */

  /* ── 3 · VIRTUALIZATION TECHNIQUES ───────────────────────────────────── */
  breaker(2),
  slide('techniques', S[2], 'Three techniques', Techniques),
  slide('full', S[2], 'Full virtualization', Full),
  slide('full-path', S[2], 'Full virtualization: the path', FullPath),
  slide('full-analogy', S[2], 'Analogy: a hotel key card', FullAnalogy),
  slide('para', S[2], 'Para-virtualization', Para),
  slide('para-path', S[2], 'Para-virtualization: hypercalls', ParaPath),
  /* removed 2026-11-26 to match the shared student file, where it was hidden (a hidden slide is deleted in a student file): para-analogy, Analogy: a service bell (ParaAnalogy, tech.tsx) */
  slide('hw-assisted', S[2], 'Hardware-assisted virtualization', HwAssisted),
  slide('techniques-compared', S[2], 'Three techniques compared', TechniquesCompared),

  /* ── 4 · VIRTUAL MACHINE ANATOMY ─────────────────────────────────────── */
  breaker(3),
  slide('anatomy', S[3], 'VM anatomy map', Anatomy),
  slide('vcpu', S[3], 'vCPU and memory', Vcpu),
  slide('disk-nic', S[3], 'Disk and NIC', DiskNic),
  slide('artifacts', S[3], 'VM packaging artifacts', Artifacts),
  /* slides 37-47 of the student view (create-vm to boot-2, the VirtualBox walkthrough) moved to the hands-on deck
     "Creating Virtual Machine Using Virtual Box" (user, 2026-11-26): ../practical_hands_on_creating_virtual_machine_using_virtual_box */

  /* ── 5 · VM LIFECYCLE & MIGRATION ────────────────────────────────────── */
  breaker(4),
  slide('lifecycle', S[4], 'Lifecycle stages', Lifecycle),
  slide('suspend-snapshot-clone', S[4], 'Suspend, snapshot, clone', SuspendSnapshotClone),
  slide('live-migration', S[4], 'Live migration', LiveMigration),
  slide('live-analogy', S[4], 'Analogy: a call between towers', LiveAnalogy),
  slide('cost', S[4], 'Cost of full VMs', Cost),

  /* ── CLOSING ─────────────────────────────────────────────────────────── */
  { id: 'quiz-close-1', section: 'Closing', label: 'Quiz time (layout 1)', transition: 'zoom', element: <QuizCard lesson={SESSION} title="Quiz Time!" />, notes: PAIR('quiz1, the title card with the question cube', 'quiz0, the course quiz frame (the previous frame)') },
  { id: 'takeaways', section: 'Closing', label: 'Key takeaways', element: <Takeaways lesson={SESSION} items={AGENDA} />, notes: note('takeaways') },
  { id: 'next-session', section: 'Closing', label: 'Next session', transition: 'zoom', element: <NextSessionSlide title="Containers vs Virtual Machines" lesson={SESSION} />, notes: note('next-session') },
  { id: 'thank-you', section: 'Closing', label: 'Thank you', transition: 'zoom', element: <ThankYouSlide title="Thank you!" lesson={SESSION} />, notes: note('thank-you') },
  { id: 'all-the-best', section: 'Closing', label: 'All the Best', transition: 'zoom', element: <ThankYouSlide title="All the Best" lesson={SESSION} /> },
]

/** No slide opens with Autoplay (no builds); the kit's set ships holding Python 31's numbers. */
AUTOPLAY_ON_BY_DEFAULT.clear()
