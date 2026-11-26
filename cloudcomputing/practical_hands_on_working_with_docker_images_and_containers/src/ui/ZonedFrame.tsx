import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { RevealGroup, Reveal } from '@/motion/Reveal'
import { useContinuity } from '@/motion/continuity'
import { SlideHeader } from './SlideHeader'
import type { Tone } from '@/design/tokens'

/**
 * THE ZONES OF A CONTENT SLIDE (content rule 32), built once.
 *
 * Every light content slide type renders through this instead of stacking a
 * `SlideHeader` on top of a flex well. The zones are the user's annotated
 * templates, `Rules_beta/A.png` (zones) and `Rules_beta/C.png` (centring lines),
 * first judged on slide 9 of `Rules_beta/beta_testing_slides`:
 *
 *   Header       x 0..912,     y 0..148    kicker and title, and nothing else
 *   Speaker box  x 913..1280,  y 0..220    held empty for the instructor video
 *   Space-1      x 64..1159,   y 251..709  the content area, the default
 *   Space-2      x 1159..1214, y 251..658  a little extra width, taken SECOND
 *   Space-3      x 64..880,    y 162..240  extra height above, taken LAST
 *
 * WHY. With the lead inside the header, the header's height changed from slide
 * to slide, so the body started at a different height on every slide. Here the
 * header holds only the kicker and title, the LEAD IS THE FIRST BLOCK OF THE
 * BODY, and every slide gets the same body box.
 *
 * THE BODY BOX runs x 64..1159 (Space-1) and y 221..709: C.png's ceiling, which
 * is the video rectangle's floor, down to Space-1's real bottom. Two modes:
 *
 *   'center'  (default) content that fits the 221..647 band is centred on y=434.
 *             Heavy content pins to 221 and grows down to 709. Two spacers do it:
 *             the top one starts at 0, the bottom one at the 62px between 647 and
 *             709, both grow equally, and only the bottom one can shrink.
 *             Content taller than 221..709 takes SPACE-3, last: the box's top
 *             rises just far enough to hold it, and never above y=162.
 *   'top'     a fixed origin, for a layout that must not move between steps,
 *             like `CodeBuildSlide`'s fixed code panel. With a lead, the lead
 *             sits in Space-3 and the content starts at y=221; without one, the
 *             content starts at y=221. Either way the origin never moves.
 *   'fill'    the body is exactly the 221..647 band with a DEFINITE height, for
 *             layouts that size media as a percentage of the well. Centred on
 *             434 by construction.
 *
 * `wide` lets the box take Space-2 as well (x 64..1214). Nothing in the kit sets
 * it; it is there for a session slide whose content will not fit Space-1.
 *
 * SPACE-3 IS x 64..880 ONLY, because past 880 is the speaker box. Whatever lands
 * in that band is the lead, the body's first block, so the lead is capped at
 * 816px (x 64..880) on every slide rather than only on the heavy ones. A heavy
 * block that is itself wider than 816 and would reach the band cannot be made
 * legal by this frame: `video-safe.mjs` reports it, and the slide splits.
 *
 * `SlideBase` must be asked for `padded={false}`: every offset here is a canvas
 * coordinate, which is what the zone table is written in.
 *
 * TWO ZONE BOXES, NOT ONE FULL-CANVAS WRAPPER. A 1280x720 wrapper fails
 * `qa.mjs`'s edge test by construction and it stops descending there, so nothing
 * inside would be checked. Boxes the size of their own zones keep the sweep able
 * to see the content.
 */
export const ZONE = {
  header: { left: 64, top: 48, right: 912 },
  space1: { left: 64, top: 251, right: 1159, bottom: 709 },
  space2: { left: 1159, top: 251, right: 1214, bottom: 658 },
  space3: { left: 64, top: 162, right: 880, bottom: 240 },
  /** C.png's centring band. 647 is a centring guide, NOT a floor. */
  band: { top: 221, bottom: 647 },
} as const

/** The gap between the lead and the first content block. */
const LEAD_GAP = 26

/** Space-1 and Space-3 stacked: the tallest the body box is allowed to get. */
const TALLEST = ZONE.space1.bottom - ZONE.space3.top

export function ZonedFrame({
  kicker,
  title,
  lead,
  tone = 'brand',
  mode = 'center',
  wide = false,
  bodyWidth,
  children,
}: {
  kicker?: string
  title: ReactNode
  lead?: ReactNode
  tone?: Tone
  mode?: 'center' | 'top' | 'fill'
  wide?: boolean
  /** Narrow the body box, for a slide that owns a right-hand column (takeaways, recap). */
  bodyWidth?: number
  children?: ReactNode
}) {
  const carry = useContinuity()
  const S1 = ZONE.space1
  const right = wide ? ZONE.space2.right : S1.right
  const width = bodyWidth ?? right - S1.left
  const bottom = mode === 'fill' ? ZONE.band.bottom : S1.bottom

  /* Space-3, taken last. Measure the content; if it is taller than the normal
     box, raise the box's top just enough, never past y=162. Layout effect, so
     the corrected position is what paints first. */
  const content = useRef<HTMLDivElement>(null)
  const [tall, setTall] = useState(0)
  useLayoutEffect(() => {
    if (mode !== 'center' || !content.current) return
    const el = content.current
    const measure = () => setTall(el.offsetHeight)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [mode])
  const normal = bottom - ZONE.band.top
  const top =
    mode === 'top' && lead
      ? ZONE.space3.top
      : mode === 'center' && tall > normal
        ? bottom - Math.min(tall, TALLEST)
        : ZONE.band.top

  /* The old header lead. Capped below the zone's width because a line of prose
     run edge to edge is a newspaper column read from twelve metres, and at 816
     (x 64..880) it stays out of the speaker box when it rises into Space-3. An
     unchanged lead holds still across a continuity boundary, exactly as it did
     in the header. */
  const leadBlock = lead ? (
    carry.lead ? (
      <p className="max-w-[816px] shrink-0 text-body-lg text-body">{lead}</p>
    ) : (
      <RevealGroup className="shrink-0" delayChildren={0.2}>
        <Reveal dir="up">
          <p className="max-w-[816px] text-body-lg text-body">{lead}</p>
        </Reveal>
      </RevealGroup>
    )
  ) : null

  const body = (
    <div
      ref={content}
      className={`flex flex-col ${mode === 'fill' ? 'min-h-0 flex-1' : 'shrink-0'}`}
    >
      {leadBlock}
      {children && (
        <div
          className={`flex flex-col ${mode === 'fill' ? 'min-h-0 flex-1' : 'shrink-0'}`}
          style={lead ? { marginTop: LEAD_GAP } : undefined}
        >
          {children}
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* HEADER ZONE. No lead and no height floor: the kicker and title alone
          keep it inside y 0..148, which the floor used to pad past. */}
      <div
        data-zone="header"
        style={{
          position: 'absolute',
          left: ZONE.header.left,
          top: ZONE.header.top,
          width: ZONE.header.right - ZONE.header.left,
        }}
      >
        <SlideHeader kicker={kicker} title={title} tone={tone} floor={false} />
      </div>

      {/* BODY BOX, Space-1 horizontally, C.png's band vertically (or up into
          Space-3, see `top`). */}
      <div
        data-zone="space1"
        className="flex flex-col"
        style={{
          position: 'absolute',
          left: S1.left,
          top,
          width,
          height: bottom - top,
        }}
      >
        {mode === 'center' && <div aria-hidden style={{ flex: '1 1 0px', minHeight: 0 }} />}
        {body}
        {mode === 'center' && (
          <div aria-hidden style={{ flex: `1 1 ${S1.bottom - ZONE.band.bottom}px`, minHeight: 0 }} />
        )}
      </div>
    </>
  )
}
