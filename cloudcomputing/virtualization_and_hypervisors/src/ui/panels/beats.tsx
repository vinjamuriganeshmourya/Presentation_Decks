import type { ReactNode } from 'react'
import { useDeck } from '@/deck/DeckContext'
import { useClaimedSteps } from '@/motion/Stepper'
import { useInstant } from '@/motion/instant'

/**
 * A PANEL: a slide that is taught in beats, with its own Next and Replay.
 *
 * Built for PF 14 "For Loop", whose lesson-plan page carried fifteen of them.
 * Each panel there ran its own stepper; here the beats ARE the kit's build steps,
 * so the deck's own keys walk them (Ctrl+arrow, or `S` then the plain arrow),
 * `?all` opens every one for the harnesses, and the panel's buttons are only a
 * second way to press the same key. There is one stepper, not two that can
 * disagree.
 */

/**
 * The beat a panel is on, 1-based, for a panel that opens on its first beat.
 * `total` beats claim `total - 1` build steps: beat 1 is the slide as it lands.
 */
export function useBeats(total: number): number {
  const shown = useClaimedSteps(Math.max(0, total - 1))
  return 1 + shown.filter(Boolean).length
}

/** The same, for a panel that opens EMPTY (0 of n): every beat is a build step. */
export function useCount(total: number): number {
  return useClaimedSteps(total).filter(Boolean).length
}

/**
 * Transitions for a panel's state changes. Explanatory tier (generate-slides
 * section 4b), and none at all during an instant jump, so a Ctrl+arrow landing
 * does not play a panel's whole build.
 */
export function useTween(ms = 420): string {
  return useInstant() ? 'none' : `all ${ms}ms cubic-bezier(0.22, 1, 0.36, 1)`
}

/** One pill button. `ghost` is the quiet one (Replay, Reset). */
export function PanelButton({
  children,
  onClick,
  disabled = false,
  ghost = false,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  ghost?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      /* the deck's arrow keys must not also fire a focused button */
      onKeyDown={(e) => e.key !== 'Enter' && e.key !== ' ' && e.currentTarget.blur()}
      className={`rounded-pill px-5 py-2.5 font-body text-body-sm font-semibold transition-opacity disabled:opacity-40 ${
        ghost ? 'bg-white/85 text-muted ring-1 ring-muted/25' : 'bg-brand text-white shadow-card-soft'
      }`}
    >
      {children}
    </button>
  )
}

/**
 * Next and Replay, centred on one fixed line at the foot of the slide, so they
 * never move from beat to beat and never meet the body above them.
 *
 * They are placed from the BOTTOM of `ZonedFrame`'s body box, which ends at
 * y 709 (Space-1's floor) whatever the box's top is, so the buttons' bottom edge
 * is always y 680, clear of the footer bar and the nav chip.
 *
 * Next is the deck's own `next()`: at the last beat the deck moves on, the same
 * as the key. Replay walks the deck back to this panel's first beat.
 */
export function StepControls({
  at,
  first = 1,
  total,
  nextLabel = 'Next',
}: {
  /** The beat on screen now. */
  at: number
  /** 1 for `useBeats`, 0 for `useCount`. */
  first?: 0 | 1
  total: number
  nextLabel?: string
}) {
  const deck = useDeck()
  return (
    <div className="absolute inset-x-0 z-20 flex justify-center gap-2" style={{ bottom: 29 }}>
      <PanelButton onClick={deck.next} disabled={at >= total}>
        {nextLabel}
      </PanelButton>
      <PanelButton
        ghost
        onClick={() => {
          for (let i = at; i > first; i--) deck.prev()
        }}
      >
        Replay
      </PanelButton>
    </div>
  )
}
