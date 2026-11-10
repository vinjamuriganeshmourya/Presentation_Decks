import type React from 'react'
import type { DeckMeta, SlideDef } from '@/deck/types'
import { BrandSlide, NextSessionSlide, SectionBreakerSlide, ThankYouSlide, WelcomeSlide } from '@/slides'
import { Takeaways } from './figures/closing'
import { AgendaColumns, FeedbackCard } from './figures/variants'
import { installSpecKeys } from '@/ui/foundations/keys'
import { revealEveryStep } from '@/motion/Stepper'
import { installEntrances } from './figures/entrance'
import { MOTION_CSS } from './figures/motion'
import { SCENE_CSS, STILL } from './figures/scene'
import { ART_CSS, mountClayDefs } from './figures/art'
import { VH_CSS } from './figures/vh/frames'
import { CV_CSS } from './figures/cv/frames'
import { FX_CSS, FX_CSS_2, FX_CSS_3 } from './figures/cv/fx'
import { FUNDAMENTALS_CSS } from './figures/cv/fundamentals'
import { INSTALL_CSS } from './figures/cv/install'
import { DOCKER_CSS } from './figures/cv/docker'
import { BUILD_CSS } from './figures/cv/build'
import { COMPARE_CSS } from './figures/cv/compare'
import { CHOOSE_CSS } from './figures/cv/choose'
import { Container, FlatsAnalogy, Namespaces, Cgroups, UnionFs } from './figures/cv/fundamentals'
import { DockerParts, SetupPerOs, InstallStep1, InstallStep2, InstallStep3, InstallStep4, InstallStep5, InstallStep6, InstallStep7, InstallStep8, InstallStep8b } from './figures/cv/install'
import { ImageVsContainer, RecipeAnalogy, PullRun, PullRun2, PartA1, PartA2, RunCommand, CheckStopRemove, DockerfileLayers, BuildCache, HouseAnalogy } from './figures/cv/docker'
import { PartB1, PartB1b, PartB2, PartB3, PartB4, PartB5, PartB6, PartB7, PartB8 } from './figures/cv/build'
import { TwoStacks, TwoStacksPoints, BootMemory, WhyGap, SizeDensity, DensityBuys, Isolation, Isolation2, BlastRadius, BlastRadius2 } from './figures/cv/compare'
import { FourCriteria, ContainerUses, VmUses, DecisionTable, BothTogether } from './figures/cv/choose'
import { ToolingMap, Hypervisors, Containerd, Podman, Engines, Registries, Tagging, HeadsUp } from './figures/cv/tooling'

/**
 * CLOUD COMPUTING · "Containers vs Virtual Machines" (session 4)
 *
 * Built from `Outputs/cloudcomputing/session_plans/containers_vs_virtual_machines/plan.md`
 * (signed off on the user's word, 2026-10-28). The source is the session 4 spec
 * and TR in `Outputs/cloud_computing/session_plans/session_4/`: every string on
 * a slide is the spec's (the TR's words; a spaced dash turned into a colon or a
 * comma, the full stop at a line's end dropped). One slide per spec card, the
 * slide id is the card id (`Card` stamps it as `data-spec`).
 *
 * THE DESIGN is sessions 2 and 3's: `Card`, the points rail beside a raised
 * stage, library renders and clay objects, one self-running loop per figure
 * held still on harness URLs. No builds (`revealEveryStep`): every element
 * enters in reading order (`figures/entrance.ts`), which is how the spec's
 * press order reaches the screen. Section files: `figures/cv/`.
 *
 * REVIEW PAIRS (user, 2026-10-28) RESOLVED 2026-10-30: the user kept agenda1
 * (titles only), quiz1 and feedback1 and had agenda0, agenda1 (full lines),
 * quiz0 and feedback0 deleted, with the library analogy (T25-AN). The same
 * correction pass split T05-S8 and T07-1 in two each: 74 slides.
 */

export const SESSION = 'Containers vs Virtual Machines'

export const cvMeta: DeckMeta = {
  title: SESSION,
  course: 'Cloud Computing',
  lesson: SESSION,
  presenter: 'NxtWave Instructor',
  /* every move a transition, picker thumbnails, and the step/slide switch hidden (course skill R1) */
  player: { autoHideControls: true, smooth: true, thumbnails: true, hideModeSwitch: true },
}

/** A TR agenda line, `1. Container Fundamentals: Process-level isolation; …`, as the kit's title and sub. The number is the slide's own badge. */
const line = (s: string) => {
  const body = s.replace(/^\d+\.\s*/, '')
  const i = body.indexOf(': ')
  return { title: body.slice(0, i), sub: body.slice(i + 2) }
}

/** S-AGENDA, the TR's five agenda lines. The breakers, the takeaways and the section bar use the same strings. */
export const AGENDA = [
  '1. Container Fundamentals: Process-level isolation; Linux namespaces & control groups (cgroups); union filesystem & layered images',
  '2. Docker Architecture: Client, daemon, images, containers & registries; image vs container; layers & build caching',
  '3. Containers vs VMs: Boot time, memory footprint, image size & density; isolation strength & security trade-offs',
  '4. Choosing Between Them: Container use cases; VM use cases; decision criteria',
  '5. Tooling & Registries: VirtualBox, KVM, Hyper-V & VMware; Docker, Podman & containerd; public vs private registries; tagging strategy',
].map(line)

/** S-RECAP, the TR's recap of Virtualization & Hypervisors. */
const PREVIOUS = [
  '1. Virtualization Basics: Physical vs virtual resources; consolidation, isolation & utilization; types: server, storage, network, desktop, application',
  '2. Hypervisors: Type 1 (bare-metal) vs Type 2 (hosted); Virtual Machine Monitor (VMM) & its role',
  '3. Virtualization Techniques: Full virtualization; para-virtualization; hardware-assisted virtualization (VT-x / AMD-V)',
  '4. Virtual Machine Anatomy: vCPU, virtual memory, virtual disk & virtual NIC; machine images, templates & snapshots',
  '5. VM Lifecycle & Migration: Provision, start, suspend, snapshot, clone & terminate; live migration & its uses',
].map(line)

/* the keyframes the scene helpers use; harness URLs hold every loop still */
if (typeof document !== 'undefined' && !document.getElementById('cc-css')) {
  const el = document.createElement('style')
  el.id = 'cc-css'
  /* table heads read as the spec writes them (`Namespace`, `Favours VM`), not in the kit's capitals: the user asked for the source text exactly */
  el.textContent = ART_CSS + SCENE_CSS + MOTION_CSS + VH_CSS + CV_CSS + FX_CSS + FX_CSS_2 + FX_CSS_3 + FUNDAMENTALS_CSS + INSTALL_CSS + DOCKER_CSS + BUILD_CSS + COMPARE_CSS + CHOOSE_CSS + `[data-spec] .grid.items-end > .uppercase.tracking-wider { text-transform: none; letter-spacing: 0.01em }`
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
const slide = (id: string, section: string, label: string, El: (p: { lesson: string }) => React.ReactElement): SlideDef => ({ id, section, label, element: <El lesson={SESSION} /> })

export const cvDeck: SlideDef[] = [
  /* ── OPENING ─────────────────────────────────────────────────────────── */
  { id: 'S-WELCOME', section: 'Opening', label: 'Welcome', transition: 'fade', element: <BrandSlide greeting="Welcome!" lesson={SESSION} /> },
  { id: 'S-TITLE', section: 'Opening', label: 'Session name', transition: 'zoom', element: <WelcomeSlide minimal title={SESSION} lesson={SESSION} /> },
  { id: 'S-RECAP', section: 'Opening', label: 'Recap', element: <Takeaways id="S-RECAP" kicker="Recap" title="Virtualization & Hypervisors" lesson={SESSION} items={PREVIOUS.map(({ title }) => ({ title }))} art="/assets/takeaways/presenter.png" /> },
  /* agenda1, titles only: the frame the user kept (2026-10-30); agenda0 and the full-line agenda1 were deleted */
  { id: 'S-AGENDA-1B', section: 'Opening', label: 'Agenda', element: <AgendaColumns kicker={SESSION} lesson={SESSION} items={AGENDA.map(({ title }) => ({ title }))} /> },

  /* ── 1 · CONTAINER FUNDAMENTALS ──────────────────────────────────────── */
  breaker(0),
  slide('T01-1', S[0], 'What a container is', Container),
  slide('T01-AN', S[0], 'Analogy: Flats in one building', FlatsAnalogy),
  slide('T02-1', S[0], 'Six namespaces', Namespaces),
  slide('T03-1', S[0], 'Control groups', Cgroups),
  slide('T03-2', S[0], 'Union filesystem', UnionFs),

  /* ── 2 · DOCKER ARCHITECTURE ─────────────────────────────────────────── */
  breaker(1),
  slide('T04-1', S[1], "Docker's five parts", DockerParts),
  slide('T05-1', S[1], 'Setup per operating system', SetupPerOs),
  slide('T05-S1', S[1], 'Step 1: WSL 2 enabled', InstallStep1),
  slide('T05-S2', S[1], 'Step 2: installer options', InstallStep2),
  slide('T05-S3', S[1], 'Step 3: installed', InstallStep3),
  slide('T05-S4', S[1], 'Step 4: sign in or skip', InstallStep4),
  slide('T05-S5', S[1], 'Step 5: back to the app', InstallStep5),
  slide('T05-S6', S[1], 'Step 6: allow the redirect', InstallStep6),
  slide('T05-S7', S[1], 'Step 7: Docker Desktop opens', InstallStep7),
  /* user, 2026-11-04: the two halves swapped, the commands first */
  slide('T05-S8b', S[1], 'Step 8: the two commands and the Linux note', InstallStep8b),
  slide('T05-S8', S[1], 'Step 8: verify from the terminal', InstallStep8),
  slide('T06-1', S[1], 'Image vs container', ImageVsContainer),
  slide('T06-AN', S[1], 'Analogy: One recipe, many cakes', RecipeAnalogy),
  slide('T07-1', S[1], 'Pull and run: the two commands', PullRun),
  slide('T07-1b', S[1], 'Pull and run: socket, cache, repeat run', PullRun2),
  slide('T08-1', S[1], 'Part A, steps 1 to 5', PartA1),
  slide('T08-2', S[1], 'Part A, steps 6 to 10', PartA2),
  slide('T09-1', S[1], 'The run command, slot by slot', RunCommand),
  slide('T09-2', S[1], 'Check, stop, remove', CheckStopRemove),
  slide('T10-1', S[1], 'A Dockerfile, line by line', DockerfileLayers),
  slide('T10-2', S[1], 'Build caching', BuildCache),
  slide('T10-AN', S[1], 'Analogy: A house built floor by floor', HouseAnalogy),
  slide('T11-1', S[1], 'Part B: the project folder', PartB1),
  slide('T11-1b', S[1], 'Part B: Step 1, the folder in VS Code', PartB1b),
  slide('T11-2', S[1], 'Part B: index.html', PartB2),
  slide('T11-3', S[1], 'Part B: the Dockerfile', PartB3),
  slide('T11-4', S[1], 'Part B: build and list', PartB4),
  slide('T11-5', S[1], 'Part B: container started', PartB5),
  slide('T11-6', S[1], 'Part B: port mapping confirmed', PartB6),
  slide('T11-7', S[1], 'Part B: the custom page', PartB7),
  slide('T11-8', S[1], 'Part B: clean up', PartB8),

  /* ── 3 · CONTAINERS VS VMS ───────────────────────────────────────────── */
  breaker(2),
  slide('T12-1', S[2], 'Two stacks (the TR diagram)', TwoStacks),
  slide('T12-1b', S[2], 'Five dimensions', TwoStacksPoints),
  slide('T13-1', S[2], 'Boot time and memory', BootMemory),
  slide('T13-2', S[2], 'Why the gap', WhyGap),
  slide('T14-1', S[2], 'Image size and density', SizeDensity),
  slide('T14-2', S[2], 'What density buys', DensityBuys),
  slide('T15-1', S[2], 'Isolation strength', Isolation),
  slide('T15-1b', S[2], 'Isolation strength, continued', Isolation2),
  slide('T16-1', S[2], 'Blast radius', BlastRadius),
  slide('T16-1b', S[2], 'Blast radius, continued', BlastRadius2),

  /* ── 4 · CHOOSING BETWEEN THEM ───────────────────────────────────────── */
  breaker(3),
  slide('T17-1', S[3], 'Four criteria', FourCriteria),
  slide('T18-1', S[3], 'Container use cases', ContainerUses),
  slide('T19-1', S[3], 'VM use cases', VmUses),
  slide('T20-1', S[3], 'Decision criteria', DecisionTable),
  slide('T20-2', S[3], 'Both together', BothTogether),

  /* ── 5 · TOOLING & REGISTRIES ────────────────────────────────────────── */
  breaker(4),
  slide('T21-1', S[4], 'Tooling landscape', ToolingMap),
  slide('T22-1', S[4], 'Four hypervisor products', Hypervisors),
  slide('T23-1', S[4], 'containerd', Containerd),
  slide('T23-2', S[4], 'Podman', Podman),
  slide('T24-1', S[4], 'Docker, Podman, containerd', Engines),
  slide('T25-1', S[4], 'Public and private registries', Registries),
  slide('T26-1', S[4], 'Tagging strategy', Tagging),
  slide('X1', S[4], 'Heads-up: AWS account', HeadsUp),

  /* ── CLOSING ─────────────────────────────────────────────────────────── */
  { id: 'S-TAKEAWAYS', section: 'Closing', label: 'Key Takeaways', element: <Takeaways id="S-TAKEAWAYS" lesson={SESSION} items={AGENDA.map(({ title }) => ({ title }))} /> },
  /* feedback1: the frame the user kept (2026-10-30); feedback0 was deleted */
  { id: 'feedback-card', section: 'Closing', label: 'Feedback', transition: 'zoom', element: <FeedbackCard lesson={SESSION} /> },
  { id: 'S-NEXT', section: 'Closing', label: 'Next session', transition: 'zoom', element: <NextSessionSlide title="Cloud Networking & VPC" lesson={SESSION} /> },
  { id: 'S-THANKS', section: 'Closing', label: 'Thank You', transition: 'zoom', element: <ThankYouSlide title="Thank You" lesson={SESSION} /> },
  { id: 'S-BEST', section: 'Closing', label: 'All the Best', transition: 'zoom', element: <ThankYouSlide title="All the Best" lesson={SESSION} /> },
]
