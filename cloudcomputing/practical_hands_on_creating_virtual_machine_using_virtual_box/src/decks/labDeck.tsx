import type React from 'react'
import type { DeckMeta, SlideDef } from '@/deck/types'
import type { SectionBreakerProps } from '@/slides/types'
import { BrandSlide, SectionBreakerSlide, ThankYouSlide } from '@/slides'
import { installSpecKeys } from '@/ui/foundations/keys'
import { AUTOPLAY_ON_BY_DEFAULT } from '@/ui/foundations/autoplay'
import { revealEveryStep } from '@/motion/Stepper'
import { installEntrances } from './figures/entrance'
import { MOTION_CSS } from './figures/motion'
import { SCENE_CSS, STILL } from './figures/scene'
import { ART_CSS, mountClayDefs } from './figures/art'
import { VH_CSS } from './figures/vh/frames'
import { CreateVm } from './figures/vh/anatomy'
import { Install1, Install2, Install3, Install4, Install5, Wizard1, Wizard2, Wizard3, Boot1, Boot2 } from './figures/vh/walk'
import { NOTES } from './vhNotes'

/**
 * CLOUD COMPUTING · "Creating Virtual Machine Using Virtual Box"
 *
 * Split from Virtualization & Hypervisors (user, 2026-11-26): slides 37 to 47 of
 * that deck as its student view shows it (58 slides; its 4 hidden frames not
 * counted), "Creating a VM" to "First boot 2", became this session, named by the
 * user. The slides are unchanged (figures in `figures/vh/anatomy.tsx` and
 * `walk.tsx`, speaker notes from `vhNotes.ts`). Opening and closing are the
 * course's hands-on frames, as in the earlier splits: Welcome, the Practical
 * Hands-On divider, then this deck's own Thank you! and All the Best.
 */

export const SESSION = 'Creating Virtual Machine Using Virtual Box'

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

/* the keyframes the scene helpers use; harness URLs hold every loop still. The same CSS as Virtualization & Hypervisors. */
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

const note = (id: string) => NOTES[id] ?? ''
/** D-LAB: the practical's divider, the section-breaker frame with the "Practical Hands-On" kicker (as in the other hands-on decks). */
const LabBreaker = (p: SectionBreakerProps) => <SectionBreakerSlide {...p} />
const slide = (id: string, section: string, label: string, El: (p: { lesson: string }) => React.ReactElement): SlideDef => ({ id, section, label, element: <El lesson={SESSION} />, notes: note(id) })
const WALK = 'Trainer walks through each screen live rather than reading the captions (the TR\'s own instruction).'

export const labDeck: SlideDef[] = [
  /* ── OPENING ─────────────────────────────────────────────────────────── */
  { id: 'brand', section: 'Opening', label: 'Brand', transition: 'fade', element: <BrandSlide greeting="Welcome!" lesson={SESSION} />, notes: note('brand') },

  /* ── PRACTICAL HANDS-ON ──────────────────────────────────────────────── */
  { id: 'D-LAB', section: LAB, label: 'Practical divider', transition: 'zoom', element: <LabBreaker kicker="Practical Hands-On" title={SESSION} lesson={SESSION} /> },

  /* slides 37-47 of the Virtualization & Hypervisors student view, unchanged */
  slide('create-vm', LAB, 'Creating a VM', CreateVm),
  { ...slide('install-1', LAB, 'Installing VirtualBox 1', Install1), notes: `${note('install-1')}` },
  { ...slide('install-2', LAB, 'Installing VirtualBox 2', Install2), notes: WALK },
  { ...slide('install-3', LAB, 'Installing VirtualBox 3', Install3), notes: WALK },
  { ...slide('install-4', LAB, 'Installing VirtualBox 4', Install4), notes: WALK },
  { ...slide('install-5', LAB, 'Installing VirtualBox 5', Install5), notes: WALK },
  { ...slide('wizard-1', LAB, 'New VM wizard 1', Wizard1), notes: WALK },
  { ...slide('wizard-2', LAB, 'New VM wizard 2', Wizard2), notes: WALK },
  { ...slide('wizard-3', LAB, 'New VM wizard 3', Wizard3), notes: WALK },
  slide('boot-1', LAB, 'First boot', Boot1),
  { ...slide('boot-2', LAB, 'First boot 2', Boot2), notes: WALK },

  /* ── CLOSING ─────────────────────────────────────────────────────────── */
  { id: 'thank-you', section: 'Closing', label: 'Thank you', transition: 'zoom', element: <ThankYouSlide title="Thank you!" lesson={SESSION} />, notes: note('thank-you') },
  { id: 'all-the-best', section: 'Closing', label: 'All the Best', transition: 'zoom', element: <ThankYouSlide title="All the Best" lesson={SESSION} /> },
]

/** No slide opens with Autoplay (no builds); the kit's set ships holding Python 31's numbers. */
AUTOPLAY_ON_BY_DEFAULT.clear()
