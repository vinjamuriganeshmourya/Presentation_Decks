/**
 * The one permitted brand mark — the NxtWave logo.
 *
 * On dark backgrounds the mark is rendered in solid white and sits directly on
 * the background, with no pill behind it. The pill was there to keep the navy
 * artwork legible on blue, but a white container on a brand-blue field reads as
 * a UI chip rather than as a signature, and it drew more attention than the mark
 * itself. Reversing the mark to white solves the legibility problem the pill was
 * covering for, without adding a box.
 *
 * The white variant is produced with a filter rather than a second asset:
 * `brightness(0)` crushes every colour in the PNG to black, and `invert(1)`
 * flips that to pure white, leaving the alpha channel untouched. That is a
 * flat reverse of the supplied artwork, which brand guidelines allow, and not a
 * recolour of it.
 */
export function Logo({
  className = 'h-9',
  onDark = false,
}: {
  className?: string
  onDark?: boolean
}) {
  return (
    <img
      src="/assets/logo-nxtwave.png"
      alt="NxtWave"
      className={`${className} w-auto select-none`}
      style={onDark ? { filter: 'brightness(0) invert(1)' } : undefined}
      draggable={false}
    />
  )
}
