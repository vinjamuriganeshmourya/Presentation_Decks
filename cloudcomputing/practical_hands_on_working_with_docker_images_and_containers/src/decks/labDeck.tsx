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
import { VH_CSS } from './figures/vh/frames'
import { CV_CSS } from './figures/cv/frames'
import { FX_CSS, FX_CSS_2, FX_CSS_3 } from './figures/cv/fx'
import { FUNDAMENTALS_CSS } from './figures/cv/fundamentals'
import { INSTALL_CSS } from './figures/cv/install'
import { DOCKER_CSS } from './figures/cv/docker'
import { BUILD_CSS } from './figures/cv/build'
import { COMPARE_CSS } from './figures/cv/compare'
import { CHOOSE_CSS } from './figures/cv/choose'
import { SetupPerOs, InstallStep1, InstallStep2, InstallStep3, InstallStep4, InstallStep5, InstallStep6, InstallStep7, InstallStep8, InstallStep8b } from './figures/cv/install'
import { PartA1, PartA2, RunCommand, CheckStopRemove, DockerfileLayers, BuildCache, HouseAnalogy } from './figures/cv/docker'
import { PartB1, PartB1b, PartB2, PartB3, PartB4, PartB5, PartB6, PartB7, PartB8 } from './figures/cv/build'

/**
 * CLOUD COMPUTING · "Working with Docker Images and Containers"
 *
 * Split from Containers vs Virtual Machines (user, 2026-11-26): slides 13 to 22
 * (Docker installation, setup per OS to Step 8) and 27 to 42 (Part A to Part B
 * clean up) of that 73-slide deck became this session, named by the user. The
 * slides are unchanged (figures in `figures/cv/install.tsx`, `docker.tsx`,
 * `build.tsx`). Opening and closing are the course's hands-on frames, as in the
 * earlier splits: Welcome, the Practical Hands-On divider, then Thank You and
 * All the Best.
 */

export const SESSION = 'Working with Docker Images and Containers'

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

/* the keyframes the scene helpers use; harness URLs hold every loop still. The same CSS as Containers vs Virtual Machines, so the copied slides render exactly as there. */
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

/** D-LAB: the practical's divider, the section-breaker frame with the "Practical Hands-On" kicker (as in the other hands-on decks). */
const LabBreaker = (p: SectionBreakerProps) => <SectionBreakerSlide {...p} />
const slide = (id: string, section: string, label: string, El: (p: { lesson: string }) => React.ReactElement): SlideDef => ({ id, section, label, element: <El lesson={SESSION} /> })

export const labDeck: SlideDef[] = [
  /* ── OPENING ─────────────────────────────────────────────────────────── */
  { id: 'S-WELCOME', section: 'Opening', label: 'Welcome', transition: 'fade', element: <BrandSlide greeting="Welcome!" lesson={SESSION} /> },

  /* ── PRACTICAL HANDS-ON ──────────────────────────────────────────────── */
  { id: 'D-LAB', section: LAB, label: 'Practical divider', transition: 'zoom', element: <LabBreaker kicker="Practical Hands-On" title={SESSION} lesson={SESSION} /> },

  /* slides 13-22 of the 73-slide Containers vs Virtual Machines deck, unchanged */
  slide('T05-1', LAB, 'Setup per operating system', SetupPerOs),
  slide('T05-S1', LAB, 'Step 1: WSL 2 enabled', InstallStep1),
  slide('T05-S2', LAB, 'Step 2: installer options', InstallStep2),
  slide('T05-S3', LAB, 'Step 3: installed', InstallStep3),
  slide('T05-S4', LAB, 'Step 4: sign in or skip', InstallStep4),
  slide('T05-S5', LAB, 'Step 5: back to the app', InstallStep5),
  slide('T05-S6', LAB, 'Step 6: allow the redirect', InstallStep6),
  slide('T05-S7', LAB, 'Step 7: Docker Desktop opens', InstallStep7),
  slide('T05-S8b', LAB, 'Step 8: the two commands and the Linux note', InstallStep8b),
  slide('T05-S8', LAB, 'Step 8: verify from the terminal', InstallStep8),

  /* slides 27-42 of the same deck, unchanged */
  slide('T08-1', LAB, 'Part A, steps 1 to 5', PartA1),
  slide('T08-2', LAB, 'Part A, steps 6 to 10', PartA2),
  slide('T09-1', LAB, 'The run command, slot by slot', RunCommand),
  slide('T09-2', LAB, 'Check, stop, remove', CheckStopRemove),
  slide('T10-1', LAB, 'A Dockerfile, line by line', DockerfileLayers),
  slide('T10-2', LAB, 'Build caching', BuildCache),
  slide('T10-AN', LAB, 'Analogy: A house built floor by floor', HouseAnalogy),
  slide('T11-1', LAB, 'Part B: the project folder', PartB1),
  slide('T11-1b', LAB, 'Part B: Step 1, the folder in VS Code', PartB1b),
  slide('T11-2', LAB, 'Part B: index.html', PartB2),
  slide('T11-3', LAB, 'Part B: the Dockerfile', PartB3),
  slide('T11-4', LAB, 'Part B: build and list', PartB4),
  slide('T11-5', LAB, 'Part B: container started', PartB5),
  slide('T11-6', LAB, 'Part B: port mapping confirmed', PartB6),
  slide('T11-7', LAB, 'Part B: the custom page', PartB7),
  slide('T11-8', LAB, 'Part B: clean up', PartB8),

  /* ── CLOSING ─────────────────────────────────────────────────────────── */
  { id: 'S-THANKS', section: 'Closing', label: 'Thank You', transition: 'zoom', element: <ThankYouSlide title="Thank You" lesson={SESSION} /> },
  { id: 'S-BEST', section: 'Closing', label: 'All the Best', transition: 'zoom', element: <ThankYouSlide title="All the Best" lesson={SESSION} /> },
]
