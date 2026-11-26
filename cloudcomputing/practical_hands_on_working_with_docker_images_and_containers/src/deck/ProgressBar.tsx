import { motion } from 'framer-motion'

/**
 * Deck progress indicator — a single hairline rail across the TOP of the player.
 *
 * HISTORY, because this component has been emptied once already. It used to
 * carry the top bar AND a dot per slide along the bottom. The dots were the
 * problem: on a 48-slide deck they became a band of specks that pulled the eye
 * off the content and, in a recording, read as part of the slide rather than as
 * the player. The fix at the time removed both, which took the useful half with
 * the noisy half.
 *
 * So: the rail is back, the dots are not.
 *
 * It sits OUTSIDE the 1280x720 slide canvas, on the player's own chrome, so it
 * cannot collide with slide content and it is not caught by the video-box sweep.
 * Three things keep it from reading as slide furniture:
 *
 *   - 3px tall, so it is a rule rather than a band.
 *   - The style-guide blues, matching `DeckControls` and the footer strip, so it
 *     reads as one piece with the player.
 *   - A dim track behind the fill, so the bar communicates "how far through"
 *     even on the first slide, where a fill alone would be invisible.
 *
 * `onDot` is still in the signature: `Deck` passes it, and a click-to-seek rail
 * is the obvious next step if anyone wants one.
 */
export function ProgressBar({
  index,
  total,
}: {
  index: number
  total: number
  onDot: (i: number) => void
}) {
  /* One-based, so the first slide already shows a sliver and the last fills the
     rail. A zero-based fraction would leave slide 1 at an empty bar and slide 48
     of 48 short of the end, both of which read as broken. */
  const pct = total > 0 ? ((index + 1) / total) * 100 : 0

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[3px] bg-white/10"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={index + 1}
      aria-label={`Slide ${index + 1} of ${total}`}
    >
      <motion.div
        className="h-full origin-left rounded-r-pill bg-gradient-to-r from-nw-deep via-nw-blue to-nw-blue"
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}
