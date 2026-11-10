import { colors } from '@/design/tokens'

/**
 * THE STYLE GUIDE'S SURFACE LIGHTING, FOR SVG FIGURES.
 *
 * `STYLE_GUIDE.md` section 9 gives the four-part recipe for a lit surface — a
 * top-left highlight, a 135deg ramp, a drop shadow tinted with the surface's own
 * colour, and a pair of hairlines — and every DOM figure in the kit gets it from
 * plain CSS `background` and `boxShadow`.
 *
 * An SVG `<rect>` has neither. `fill` takes one paint, `filter` has to be
 * declared before it is referenced, and there is no `inset` anything. So the same
 * recipe needs a `<defs>` block, and a figure that hand-rolls one ends up with a
 * slightly different light source from the figure on the next slide. Session 4
 * shipped three SVG figures that way and the review's verdict was *"the container
 * depth is missing, all are very flat"*.
 *
 * `<SurfaceDefs/>` declares the gradients and filters once per `<svg>`, and
 * `surface()` returns the props a `<rect>` needs to use them.
 *
 * USAGE
 *
 *   <svg viewBox="...">
 *     <SurfaceDefs />
 *     <rect x={8} y={40} width={250} height={150} rx={14} {...surface('brand')} />
 *   </svg>
 *
 * Every `<svg>` that calls `surface()` must render exactly one `<SurfaceDefs/>`,
 * and it must come before the first reference. Two of them in one document is
 * harmless (the ids are stable, so the second simply wins) but pointless.
 *
 * WHY THE IDS ARE FIXED STRINGS
 *
 * Not generated per instance. A single-file deck inlines every figure into one
 * document, and a `useId()`-derived id changes between the dev render and the
 * static build, which is exactly the class of bug S8 records for asset paths:
 * it works in `dev`, it works in `build`, and it fails in the one build that
 * ships. Fixed ids are shared across every figure in the deck, which is correct,
 * because the light source is shared too.
 */

/** The tones a lit SVG surface can take. Add one only if `tokens.ts` has it. */
export type SurfaceTone = 'brand' | 'teal' | 'accent' | 'danger' | 'neutral'

interface ToneSpec {
  /** The border, and the tint the drop shadow is mixed from. */
  edge: string
  /** The ramp, corner to corner. Three stops, because two do not travel far
   *  enough to register from the back of a room (STYLE_GUIDE section 9). */
  ramp: [string, string, string]
}

/*
  THE TINTS ARE PALE AND THE EDGES ARE NOT.

  These are surfaces carrying dark text, so they take the gentler amplitude the
  style guide describes: a ramp that lands just off white rather than one that
  travels into the accent. A figure zone filled with saturated brand would make
  its own labels the hardest thing on the slide to read, which is the opposite of
  what the depth is for.
*/
const TONES: Record<SurfaceTone, ToneSpec> = {
  brand: { edge: colors.brand, ramp: ['#FFFFFF', '#F7FAFF', '#E8F0FF'] },
  teal: { edge: colors.teal, ramp: ['#FFFFFF', '#F4FDFB', '#DFF6F2'] },
  accent: { edge: colors.accent, ramp: ['#FFFFFF', '#FFFAF4', '#FFEEDC'] },
  danger: { edge: colors.danger, ramp: ['#FFFFFF', '#FFF7F7', '#FDE4E4'] },
  neutral: { edge: colors.line, ramp: ['#FFFFFF', '#FBFCFE', '#F0F4FA'] },
}

const TONE_NAMES = Object.keys(TONES) as SurfaceTone[]

const rampId = (t: SurfaceTone) => `nw-surface-${t}`
const shadowId = (t: SurfaceTone) => `nw-surface-shadow-${t}`

/**
 * Declare the ramps and the shadows. One per `<svg>`, before anything that uses
 * `surface()`.
 */
export function SurfaceDefs() {
  return (
    <defs>
      {TONE_NAMES.map((t) => {
        const { ramp } = TONES[t]
        return (
          <linearGradient key={t} id={rampId(t)} x1="0" y1="0" x2="1" y2="1">
            {/* 135deg, corner to corner, which is what x1,y1 -> x2,y2 on the
                unit square gives. The first stop is pure white and sits in the
                top-left, so the ramp doubles as the highlight: an SVG rect
                cannot carry two backgrounds the way a DOM node can. */}
            <stop offset="0%" stopColor={ramp[0]} />
            <stop offset="52%" stopColor={ramp[1]} />
            <stop offset="100%" stopColor={ramp[2]} />
          </linearGradient>
        )
      })}
      {TONE_NAMES.map((t) => (
        /*
          THE SHADOW IS TINTED WITH THE SURFACE'S OWN EDGE COLOUR.

          `feDropShadow` rather than a duplicated offset rect, because a rect
          would need its own copy of every geometry change made to the shape it
          sits under, and the two drift the first time a figure is nudged.

          `dy` of 3 and a 4px blur match the DOM recipe's
          `0 3px 10px -4px`: the shadow has to say "this is a few millimetres
          thick", not "this is floating".
        */
        <filter key={t} id={shadowId(t)} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow
            dx="0"
            dy="3"
            stdDeviation="4"
            floodColor={TONES[t].edge}
            floodOpacity={t === 'neutral' ? 0.18 : 0.3}
          />
        </filter>
      ))}
    </defs>
  )
}

/**
 * The `fill`, `stroke` and `filter` props for one lit surface.
 *
 * `flat` drops only the shadow and keeps the ramp, which is how the style guide
 * says a surface recedes: the layer that should sit further back keeps its
 * light, or the figure reads as lit from two different places.
 */
export function surface(tone: SurfaceTone = 'neutral', { flat = false } = {}) {
  return {
    fill: `url(#${rampId(tone)})`,
    stroke: TONES[tone].edge,
    strokeWidth: 2,
    filter: flat ? undefined : `url(#${shadowId(tone)})`,
  }
}

/**
 * The white hairline along a surface's top edge, as a `<path>` to render
 * immediately after the surface's own `<rect>`.
 *
 * This is the one part of the recipe SVG cannot express as a property. It is
 * what turns a filled rectangle into something with a lip, and on a projector it
 * does more work than the shadow does.
 */
export function TopHighlight({
  x,
  y,
  width,
  rx = 12,
  opacity = 0.9,
}: {
  x: number
  y: number
  width: number
  /** Match the surface's own `rx`, or the highlight will cut its corners. */
  rx?: number
  opacity?: number
}) {
  return (
    <path
      d={`M ${x + rx} ${y + 1.5} H ${x + width - rx}`}
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
      opacity={opacity}
      pointerEvents="none"
    />
  )
}
