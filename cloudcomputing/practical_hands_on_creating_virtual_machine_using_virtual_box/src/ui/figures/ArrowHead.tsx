import { useLayoutEffect, useRef, useState } from 'react'
import { motion, type MotionProps } from 'framer-motion'

/**
 * AN ARROWHEAD DRAWN AS A PLAIN TRIANGLE, NEVER AS AN SVG `<marker>`.
 *
 * WHY THIS EXISTS. The stage is fitted with CSS `zoom` (see `SlideStage`), and
 * Firefox positions and rotates SVG markers wrongly inside a zoomed element:
 * every arrowhead on the Authorization deck's flow charts
 * (`Rules_beta/Output/authorization`, slides 9 and 20) landed below its line,
 * turned sideways, in Firefox only. Chromium drew them correctly, and so did
 * Firefox under `?fit=transform`. A polygon is ordinary geometry, which every
 * engine scales the same way, so the arrow is identical in all of them.
 *
 * So: **no `<marker>` anywhere in the kit.** Draw the line, then put one of
 * these on the same `d`.
 *
 * HOW. It measures the path it is given with `getTotalLength()` and
 * `getPointAtLength()`, which work in user units and are unaffected by zoom, so
 * it follows any path: straight, bent or curved. The geometry copies the marker
 * it replaces, a 10x10 box scaled to `size` stroke widths with its tip at
 * `refX`, so swapping a marker for this moves nothing:
 *
 *   length      size * strokeWidth
 *   overhang    the tip sits (10 - refX) / 10 of that PAST the end of the path
 *
 * It renders nothing until it has measured, and it measures in a layout effect,
 * so the first paint already has it in place.
 */
export function ArrowHead({
  d,
  color,
  strokeWidth = 2,
  size = 6,
  refX = 8,
  ...motionProps
}: {
  /** The same `d` as the line it ends. */
  d: string
  color: string
  strokeWidth?: number
  /** Length of the head, in stroke widths. `markerWidth` on the old markers. */
  size?: number
  /** Where the tip sits on the old 0..10 marker box. 10 puts it on the path end. */
  refX?: number
} & Pick<MotionProps, 'initial' | 'animate' | 'transition'>) {
  const probe = useRef<SVGPathElement>(null)
  const [at, setAt] = useState<{ x: number; y: number; deg: number } | null>(null)

  useLayoutEffect(() => {
    const el = probe.current
    if (!el) return
    const len = el.getTotalLength()
    if (!len) return
    const end = el.getPointAtLength(len)
    const back = el.getPointAtLength(Math.max(0, len - 0.5))
    setAt({ x: end.x, y: end.y, deg: (Math.atan2(end.y - back.y, end.x - back.x) * 180) / Math.PI })
  }, [d])

  const s = size * strokeWidth
  const tip = ((10 - refX) / 10) * s
  const base = tip - s

  return (
    <>
      <path ref={probe} d={d} fill="none" stroke="none" />
      {at && (
        <motion.g {...motionProps}>
          <polygon
            points={`${tip},0 ${base},${-s / 2} ${base},${s / 2}`}
            fill={color}
            transform={`translate(${at.x} ${at.y}) rotate(${at.deg})`}
          />
        </motion.g>
      )}
    </>
  )
}
