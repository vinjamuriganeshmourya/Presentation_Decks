import { useEffect, useRef, useState, type ReactNode } from 'react'
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '@/design/tokens'

/**
 * Fits the fixed 1280x720 slide canvas into whatever space is available,
 * preserving the 16:9 aspect ratio (letterboxed). Every slide is authored at
 * exact 1280x720 px so layouts are pixel-deterministic. This component is the
 * one place that turns those pixels into whatever the projector actually has.
 *
 * ============================================================================
 * WHY THIS USES `zoom` AND NOT `transform: scale()`
 * ============================================================================
 *
 * THE BUG IT FIXES: the deck rendered SOFT in some browsers, and sharpened when
 * the viewer pressed Ctrl-plus. That pair of symptoms has exactly one cause.
 *
 * `transform: scale()` is a PAINT operation. It does not change layout: the
 * inner div is still 1280x720 to the layout engine, every glyph is still laid
 * out and rasterised for a 1280px-wide canvas, and the result is then handed to
 * the compositor as a texture and stretched. On a 1080p projector that texture
 * is being enlarged 1.5x, which is 1.5 rasterised pixels' worth of information
 * spread over 2.25 screen pixels. Text is the first thing to show it, because
 * text is all edges.
 *
 * Browser zoom sharpens it because zoom raises the device scale factor, which
 * forces the browser to rasterise the layer again at the higher resolution.
 * That is the tell: **if zooming fixes it, the content was rasterised smaller
 * than it was displayed.**
 *
 * Whether it is visible at all is up to the compositor, which is why it was
 * browser-dependent and why it does not reproduce headlessly. A browser
 * rasterising on the CPU re-rasterises at the effective scale and looks fine; a
 * GPU-composited layer is rasterised once and scaled, and looks soft. Same code,
 * two answers, and the one the instructor sees in the room is the soft one.
 *
 * `zoom` is a LAYOUT operation. It multiplies the used value of every length in
 * the subtree, so at 1.5 the browser lays the slide out as if the title were
 * 66px rather than 44 and rasterises the glyphs at that size. There is no
 * texture to stretch, so there is nothing to blur, in any engine, at any scale.
 *
 * THE TRADE, AND WHY IT IS SAFE HERE
 *
 * Re-laying out at a new size can in principle break a line differently, since
 * glyph advances at 66px are not exactly 1.5x the advances at 44px. That would
 * be serious in this repo, where several figures have their line counts
 * measured and written into a doc comment.
 *
 * It was checked rather than assumed, and the first check FAILED. `fit-check.mjs`
 * measures every text element at zoom 1, 1.5 and 2: line counts were stable, and
 * wrap points moved by up to 73px, which is the same number of lines with
 * different words on them. Harmless on the slides it was measured on and one long
 * bullet away from a wrap that changes a block's height.
 *
 * The fix is `text-rendering: geometricPrecision` on `.slide-stage`, which makes
 * glyph advances scale linearly with size instead of being rounded to the pixel
 * grid. With it the same check reports the boxes stable to a fraction of a pixel.
 * `src/index.css` has the full note and the trade it accepts. Re-run
 * `fit-check.mjs` after any change to the type scale.
 *
 * SUPPORT, AND THE FALLBACK
 *
 * `zoom` is in Chrome and Safari from their first versions and in Firefox from
 * 126 (May 2024), and it is now a standardised CSS property rather than the old
 * IE-era one. `CSS.supports` is asked rather than assumed, and anything that
 * says no gets the old `transform` path, which is the previous behaviour
 * exactly: a slightly soft slide is a great deal better than an unscaled one
 * hanging off the edge of the screen.
 *
 * `?fit=transform` forces the fallback and `?fit=zoom` forces the new path, so
 * the two can be compared in the same browser on the same machine without a
 * rebuild. That is how the bug was confirmed and it is how a regression would
 * be.
 *
 * ============================================================================
 * NEITHER PATH LETS CSS ALIGNMENT SEE THE SCALED ELEMENT, AND BOTH LEARNED IT
 * THE SAME WAY
 * ============================================================================
 *
 * Under `transform`, the inner div still occupies 1280x720 whatever the scale,
 * because transform is paint and not layout. Inside a centred grid that is fine
 * while the container is bigger than the canvas, but the moment it is smaller
 * (any window or iframe under 1280x720) the item overflows, and CSS alignment
 * then falls back to `start` rather than letting content spill off the top-left.
 * The slide ended up pinned to the container's left edge with the scaled result
 * hanging off the right. Absolute positioning plus `translate(-50%, -50%)`
 * centres by the element's OWN size, so it stays centred either way.
 *
 * `zoom` looked like it should not have that problem, since the box really is
 * 1280*z by 720*z, and the first version of this file said so and used
 * `place-items-center`. **It was wrong, in both engines, at every aspect ratio
 * that is not exactly 16:9.** Measured at 1440x900, 1280x1024, 2000x800 and
 * 1000x700, Chromium and Firefox both pinned the slide to the top-left and left
 * the whole letterbox on the right and the bottom: 578px of it in the widest
 * case. It passed the first check only because that check used 1920x1080, where
 * the scale fits both axes exactly and there is no letterbox to get wrong.
 *
 * The reason is the same shape as the transform one. **Grid sizes and aligns the
 * item by its UNZOOMED box** and the element then paints at the zoomed size from
 * that origin, so the slack all ends up on one side. Zoom is layout for the
 * element's own descendants and is not fully layout to the element's parent.
 *
 * So the zoomed stage now sits inside a plain, UNZOOMED box that this component
 * sizes in JS to the real rendered size, 1280*z by 720*z, and the flex centres
 * THAT. The box is honest parent-space pixels, so centring never depends on how
 * an engine chooses to size a zoomed item. The general rule, which cost two
 * rounds to learn: whatever is doing the scaling, hand CSS alignment a box whose
 * size it can see.
 */

export type FitMode = 'zoom' | 'transform'

/**
 * Which path to use, decided once and never re-decided.
 *
 * In a `useState` initialiser rather than at module scope: this runs in a
 * browser today, but a value captured at import time is the kind of thing that
 * breaks silently the first time anything renders this on a server, and the
 * cost of doing it properly is one closure.
 */
function detectFitMode(): FitMode {
  if (typeof window === 'undefined') return 'transform'
  const forced = new URLSearchParams(window.location.search).get('fit')
  if (forced === 'zoom' || forced === 'transform') return forced
  /*
    `CSS.supports('zoom', '2')` rather than a version sniff. Firefox 125 and
    earlier parse the property and drop it, and a browser that drops it silently
    would render the deck at a flat 1280x720 in the corner of the screen, which
    is worse than soft text by a wide margin.
  */
  try {
    return window.CSS?.supports?.('zoom', '2') ? 'zoom' : 'transform'
  } catch {
    return 'transform'
  }
}

export function SlideStage({
  children,
  /**
   * Turns on the 3D rendering context the `flip` transition needs.
   *
   * OFF BY DEFAULT, AND THAT IS HALF THE FIX. `perspective` on this wrapper and
   * `transform-style: preserve-3d` on the slide inside it used to be
   * unconditional, and together they put the entire deck into a 3D rendering
   * context on every slide of every session. A 3D context is a promise to the
   * compositor that the subtree will be transformed in space, so the subtree is
   * flattened into a texture up front, and a texture is the thing that cannot be
   * re-rasterised when it is scaled.
   *
   * So the deck was paying the blur on all 44 slides to support one transition
   * that no shipping deck uses. `Deck` now passes this only when the slide
   * actually being played is a `flip`.
   */
  flip = false,
}: {
  children: ReactNode
  flip?: boolean
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [mode] = useState(detectFitMode)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const compute = () => {
      const { width, height } = el.getBoundingClientRect()
      if (!width || !height) return
      setScale(Math.min(width / SLIDE_WIDTH, height / SLIDE_HEIGHT))
    }
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* The wrapper is OUTSIDE the zoom, so this measurement is always in real
     viewport pixels and the scale it computes never feeds back into itself. */
  const perspective = flip ? { perspective: 2000 } : undefined

  if (mode === 'zoom') {
    return (
      <div
        ref={wrapRef}
        data-fit="zoom"
        className="relative flex h-full w-full items-center justify-center overflow-hidden"
        style={perspective}
      >
        {/*
          THE LETTERBOX BOX: unzoomed, sized in JS to what the stage actually
          renders at. This is the element the flex centres, and it exists only so
          that CSS alignment is given a size it can see. See the note above.
        */}
        <div
          className="relative shrink-0"
          style={{ width: SLIDE_WIDTH * scale, height: SLIDE_HEIGHT * scale }}
        >
          {/*
            `zoom` as a plain number. The CSS property takes a number or a
            percentage, and a number is what the standardised form specifies;
            React writes `zoom: 1.5` unprefixed, which is what every engine that
            supports it reads.

            It fills its parent exactly: 1280 zoomed by z is 1280*z, which is the
            width the parent was given. Nothing overflows and nothing has to be
            clipped.
          */}
          <div
            className="slide-stage"
            style={{ width: SLIDE_WIDTH, height: SLIDE_HEIGHT, zoom: scale }}
          >
            {children}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={wrapRef}
      data-fit="transform"
      className="relative h-full w-full overflow-hidden"
      style={perspective}
    >
      <div
        /*
          NAMED so tooling can find the slide's own coordinate system.

          This is the box that is exactly SLIDE_WIDTH x SLIDE_HEIGHT, and its
          `getBoundingClientRect()` therefore carries the current scale. The review
          app converts a click into slide coordinates against this rect, the same
          way `AnnotationLayer` converts a pen stroke — a comment pinned at
          "x 820, y 300" means the same place on a laptop and on a projector.
        */
        data-slide-stage=""
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          /* translate first (by the element's own 1280x720), then scale about
             that centre. The browser applies these right to left, so the
             centring is unaffected by the scale factor. */
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
        }}
        className="slide-stage relative"
      >
        {children}
      </div>
    </div>
  )
}
