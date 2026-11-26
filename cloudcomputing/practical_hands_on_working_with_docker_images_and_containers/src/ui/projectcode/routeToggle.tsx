import { useState, type CSSProperties } from 'react'
import { colors } from '@/design/tokens'
import type { ResolvedProject, TourRoute } from './projectFigure'

/**
 * ONE TOGGLE, SHARED BY EVERY VARIANT, FOR THE TWO ORDERS THE SAME FILES HAVE.
 *
 * WHY IT IS A CONTROL AND NOT A BUILD STEP
 *
 * Everything else on these figures is click-gated: the presenter presses a key and
 * one more part of the picture lands. This is not that. It is a question the room
 * asks at an unpredictable moment ("so which one do we write first?"), and the
 * answer has to be reachable whether the tour is on stop one or stop five. A build
 * step can only be reached in order, so the toggle would be a build step that
 * sometimes cannot be pressed.
 *
 * It is therefore always on screen, from beat 0, and it is the second
 * presenter-tier interaction in this lab after the hover aside. Same rule applies:
 * the room cannot press it either, so switching order must never be the only way
 * to see something the slide is claiming.
 *
 * WHY THE BEAT COUNT DOES NOT COME FROM THE ACTIVE ROUTE
 *
 * `useBeats(count)` registers build steps with the deck's `Stepper`, and that
 * number must not change while the slide is up: if it does, the arrow key advances
 * to the next slide instead of building this one. Picking a route is a click, so
 * `route.stops.length` is state as far as the count is concerned. Variants use
 * `resolved.stopCount`, the longest route, and the resolver reports any route whose
 * length differs so the two can never disagree in practice.
 */
export function useRoute(resolved: ResolvedProject): {
  route: TourRoute
  index: number
  pick: (i: number) => void
  many: boolean
} {
  const [index, setIndex] = useState(0)
  const i = Math.min(index, Math.max(0, resolved.routes.length - 1))
  return {
    route: resolved.routes[i],
    index: i,
    pick: setIndex,
    /* A toggle with one entry is a button that does nothing, so a figure with one
       honest order does not grow a control it cannot use. */
    many: resolved.routes.length > 1,
  }
}

/**
 * THE BOX THE TOGGLE OCCUPIES, RESERVED RATHER THAN GUESSED.
 *
 * A control is not exempt from the padding rule. The first pass placed the toggle
 * at the top-left corner of `LayerMap` and left the column headers where they
 * were, and the "Code flow" pill printed straight through "File, and what it is
 * for": a 14px overlap that `align-check.mjs` does not look for, because it checks
 * left-edge alignment and wrapped tokens rather than arbitrary collisions. It took
 * a screenshot to see, which is exactly why the geometry has to be stated.
 *
 * Measured, with headroom: two pills of 11px bold uppercase on 0.05em tracking,
 * "Request flow" at 12 characters and "Code flow" at 9, are about 108 and 86px
 * wide including their own 10px of horizontal padding; plus a 4px gap, the group's
 * own 4px of padding and its 1px border, that is 208. `TOGGLE_W` is 230, not 210:
 * at exactly the measured width the group had no slack and "Request flow" wrapped
 * onto two lines inside its own pill. The pills also carry `whitespace-nowrap`, so
 * a label can never wrap whatever box it is given. Measured twice, because the
 * first measurement was the one that shipped wrong.
 *
 * `TOGGLE_CLEAR` IS AIR OUTSIDE THE CONTROL, NOT INSIDE IT.
 *
 * The pills' own `px-2.5` is inner padding and was never the question. This is the
 * gap between the toggle's box and whatever is around it: the first map row under
 * it, the column header beside it, the caption it shares a line with. 14px, raised
 * from 10 because at 10 the control still read as touching the figure it sits on.
 *
 * Its LEFT edge stays flush with the figure's own left edge on purpose. That edge
 * is the alignment datum `align-check.mjs` measures every slide against, the one
 * the slide title and the figure already sit on, so insetting the toggle from it
 * would trade a real alignment for the appearance of one. The air goes on the sides
 * that face CONTENT.
 */
export const TOGGLE_W = 230
export const TOGGLE_H = 28
export const TOGGLE_CLEAR = 14

export function RouteToggle({
  routes,
  index,
  onPick,
  paint = colors.brand,
  className = '',
  style,
}: {
  routes: TourRoute[]
  index: number
  onPick: (i: number) => void
  paint?: string
  className?: string
  style?: CSSProperties
}) {
  if (routes.length < 2) return null
  return (
    /*
      REAL BUTTONS, and real text in them. Content rule 17 is about `<text>` in an
      SVG, and the same reasoning applies here: the harnesses measure DOM
      rectangles, so a control drawn as anything but DOM is invisible to them and
      its overlaps pass every sweep.
    */
    <span
      role="group"
      aria-label="Which order to walk the files in"
      className={`inline-flex items-center gap-1 rounded-pill p-1 ${className}`}
      style={{ background: `${paint}12`, border: `1px solid ${paint}26`, ...style }}
    >
      {routes.map((r, i) => {
        const on = i === index
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => onPick(i)}
            aria-pressed={on}
            className="whitespace-nowrap rounded-pill px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider"
            style={
              on
                ? { background: paint, color: colors.white }
                : { background: 'transparent', color: paint }
            }
          >
            {r.label}
          </button>
        )
      })}
    </span>
  )
}
