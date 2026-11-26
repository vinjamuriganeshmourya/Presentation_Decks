import { useId, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { colors } from '@/design/tokens'
import { iconByName } from '@/ui/icons'
import { E, c4 } from '@/ui/figureTiming'
import { FcEdgeDraw, FcEdgeLabel, FcNodeIn, useBeats } from '@/ui/figures/motion'
import { resolveFeatures, type FeatureItem, type FeaturesFigureProps } from './featuresFigure'

/**
 * LAYER ANATOMY — the features as strata of ONE artefact, seen with depth.
 *
 * THE ARGUMENT
 *
 * Every other variant here draws the features as peers: tiles, rows, spokes,
 * columns. That is the right drawing for a set of independent capabilities and it
 * actively LIES about the other case, which is just as common. Some feature sets
 * are not a set at all: they are one thing with parts, and the parts sit on each
 * other. "Plain files on disk" is not a sibling of "Search everything", it is
 * what search is standing on. A grid puts them side by side at equal size and
 * tells the room they are alternatives to be picked between.
 *
 * So this is a stack, and the vertical order carries the argument. SURFACE AT THE
 * TOP, FOUNDATION AT THE BOTTOM: the layer the person actually touches is the one
 * they meet first, the layer everything rests on is drawn last and heaviest. That
 * direction is chosen deliberately over the reverse. Bottom-first is the right
 * order for a build sequence, where nothing above exists yet; but a features
 * slide is answering "what is this thing", and the honest answer starts at the
 * part the person has their hands on. It also agrees with the kit's own
 * `LayerStack`, which takes its layers top-first so the array reads the way the
 * figure looks.
 *
 * The horizontal offset is the reason this is not five rows. Each layer steps
 * 26px to the right of the one above it and a drawn diagonal joins their left
 * edges, so what the eye reads is the side wall of a single solid: one object cut
 * open, not five bars in a column. Take the offset away and it collapses back
 * into a table, which is the failure mode this variant exists to avoid.
 *
 * HOW THIS DIFFERS FROM THE KIT'S `LayerStack`, AND WHY IT IS NOT JUST THAT ONE
 *
 * `slide-kit/slide-template/src/ui/LayerStack.tsx` already draws a stack, and it
 * is the right component for what it does. It is a 300px flex column of flat
 * bars, sized to stand two or three abreast so two machines can be compared
 * layer by layer, and its meaning lives in a four-value `state` enum: which layer
 * `ships`, which is supplied by the `host`, which one `breaks`, which is
 * `shared`. It is a DIAGNOSTIC figure about deployment, no layer leads, and there
 * is no depth: every bar is the same width and the same x.
 *
 * This one is a different job on the same shape. It is a full-stage 1100px
 * figure, it takes `FeatureItem`s rather than `Layer`s, so it carries `label`,
 * `body`, `outcome`, `icon` and a hover `detail` per stratum where `LayerStack`
 * carries a label and a short note. It has a hero, which is the whole point of
 * this lab's contract and which `LayerStack` has no way to express. It has the
 * horizontal offset and the drawn side wall, so it reads as ONE artefact instead
 * of a column of independent bars. And it is click-gated through this lab's
 * `useBeats`, where `LayerStack` wraps each bar in a `Step`.
 *
 * Making `LayerStack` do all that would mean giving it a second content contract,
 * a hero, a depth mode and a per-layer hover, at which point it is two components
 * sharing a name and the deployment sessions that depend on its `state` enum pay
 * for a features figure they never asked for. Keeping them apart is cheaper than
 * one component with a mode switch.
 *
 * WHAT IT IS WORST AT
 *
 *   - **A set with no real ordering.** This is the honest failure, and it is the
 *     mirror of the grid's: the geometry INSISTS that the top rests on the bottom,
 *     and the room will believe it. This fixture is only borderline defensible,
 *     because plain files on disk genuinely do underlie the other four. Feed it
 *     five unrelated capabilities and it invents an architecture, which is a
 *     worse lie than drawing them as peers.
 *   - **Its own reveal order.** Beat 0 belongs to the hero because the slide has
 *     to arrive with its subject on screen, and here the hero is the SURFACE
 *     layer. So the stack assembles downward, which reads as excavation rather
 *     than construction: the room watches the thing being dug under rather than
 *     built up. Bottom-up would read better as motion and would cost the hero its
 *     free beat, and the hero mattered more.
 *   - **Comparison, and counting.** Layers are 760px wide and 66px apart, so
 *     "which of these is the fastest" is unanswerable, and a stack of six starts
 *     reading as a list with an offset bug.
 *   - **Long `outcome` copy.** The right column is 260px, which holds two lines at
 *     13px. A third line eats the padding floor (see the arithmetic below), and
 *     that failure is silent.
 *
 * GEOMETRY, AND THE PADDING ARITHMETIC
 *
 * A fixed 1100 x 398 stage, absolutely positioned. Layers are 760px wide and step
 * `DX = 26` right per level, centred on x = 190, so the top layer sits at 138 and
 * the bottom at 242 and the widest right edge is 1002: the offset never leaves the
 * stage, and the 138px gutter on the left carries the two axis words.
 *
 * Padding is a floor, not a declaration. A box SHOWS `(box height - content
 * height) / 2`, so a declared `py-3.5` silently becomes 0 or negative the moment
 * the content outgrows the box, and the sibling flow-chart lab shipped four cards
 * at 0px and one at -7px, all of them declaring 12px, passing every harness the
 * whole time. Both layer heights here are therefore derived from the content,
 * measured against this fixture's longest label, "Plain files on disk", plus its
 * body line:
 *
 *   layer   66px   18.75 label (15px on 1.25) + 3 gap + 16.2 body (12px on 1.35)
 *                  = 38  ->  real vertical padding (66 - 38) / 2 = 14px
 *   hero    82px   22.8 label (19px on 1.2) + 3 gap + 17.55 body (13px on 1.35)
 *                  = 43.35  ->  (82 - 43.35) / 2 = 19.3px
 *
 * The floor is 12px and the worst case is 14, so the sizes are tight rather than
 * comfortable and the doc comment is the only thing standing between the next
 * editor and a 0px card. The right-hand `outcome` at two lines is 35.1px, still
 * under the 38px the label column already claims, so it does not move the floor.
 * The text column is 760 - 40 padding - 26 icon - 12 gap - 260 outcome - 16 gap =
 * 406px, and the longest body in the fixture sets at about 264px, so nothing
 * wraps.
 *
 * 82 + 4 x 66 + 4 x 4 of gap = 362, the caption sits at 374, the figure is 398.
 * The gap is 4px rather than 0 because touching layers read as one filled block
 * and the strata stop being countable; it is not 12px, because a stack with air
 * between its layers is a column of separate bars again.
 */

const W = 1100
const LAYER_W = 760
/** The x every layer is centred on. The offset spreads either side of it. */
const CENTRE_LEFT = 190
/** Horizontal step per level. This is the depth, and without it this is a table. */
const DX = 26
const HERO_H = 82
const ROW_H = 66
const GAP = 4
/** The right-hand column that carries what the layer buys you. */
const OUT_W = 260

/**
 * The hover popover's own duration, and deliberately NOT one of `T`'s.
 *
 * `T` is the explanatory tier: the figure assembles at 520ms because the room
 * reads it once, from the back, while someone talks over it. A hover is the
 * opposite case, triggered on purpose and repeatedly by a presenter who is
 * waiting for the answer, so it takes the `animate` skill's UI numbers. The lift
 * itself is a CSS transition in `index.css` and is not written in this file.
 */
const POPOVER = 0.18

export function LayerAnatomy({ items, caption, className = '' }: FeaturesFigureProps) {
  const f = resolveFeatures({ items })

  /*
    THE STACK IS DRAWN IN AUTHORED ORDER, AND THE BEATS RUN HERO FIRST.

    Those are usually the same list, because a hero is normally authored first.
    Where they are not, it is the REVEAL that leads with the hero and never the
    geometry: a figure whose strata reorder themselves when one of them is marked
    `hero` would be a figure that changes what it claims about the artefact
    because of an emphasis flag. Depth has to mean depth.
  */
  const order = f.hero ? [f.hero, ...f.rest] : f.all
  const beatOf = (item: FeatureItem) => order.indexOf(item)

  const heightOf = (item: FeatureItem) => (item === f.hero ? HERO_H : ROW_H)
  const topOf = (i: number) => f.all.slice(0, i).reduce((y, it) => y + heightOf(it) + GAP, 0)
  /* Centred on `CENTRE_LEFT`, so adding a layer widens the stack both ways rather
     than walking the whole figure off one edge. */
  const leftOf = (i: number) => CENTRE_LEFT + (i - (f.all.length - 1) / 2) * DX

  const stackH = f.all.reduce((y, it) => y + heightOf(it) + GAP, 0) - GAP
  const captionY = stackH + 12
  const H = captionY + 24

  /* Derived from `items` and never from state, so the step count the slide
     registers with the deck is stable while the slide is up. One beat per layer,
     plus the caption. Beat 0 is free (`useBeats` does not claim it) and it belongs
     to the hero, so the slide arrives with its subject already on screen instead
     of on an empty stage that reads as a figure which failed to render. The side
     wall and the two axis words ride existing beats rather than taking their own,
     because a click that draws nothing but a hairline reads as a dead deck. */
  const CAPTION_AT = f.all.length
  const shown = useBeats(CAPTION_AT + 1)

  /* The BASE layer's beat, looked up rather than assumed to be the last one. The
     stack is drawn in authored order and the beats run hero first, so if the hero
     is authored at the bottom its beat is 0 and "what it rests on" has to land
     then, not on the final click. */
  const base = f.all[f.all.length - 1]
  const baseBeat = base ? beatOf(base) : 0

  return (
    <figure className={`relative mx-auto ${className}`} style={{ width: W, height: H }}>
      {/* THE SIDE WALL. Geometry only: every word in this figure is a DOM element,
          per content rule 17, because an `<svg>` is a single rectangle to all
          three harnesses and two `<text>` labels can therefore overlap and pass
          every sweep. Session 4 shipped exactly that, twice. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0"
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
      >
        {f.all.map((item, i) => {
          if (i === 0) return null
          const prev = f.all[i - 1]
          const b = beatOf(item)
          /* Bottom-left of the layer above to top-left of this one: the short
             diagonal that makes the two read as faces of one solid rather than as
             two bars that happen to be near each other. */
          const x1 = leftOf(i - 1)
          const y1 = topOf(i - 1) + heightOf(prev)
          const x2 = leftOf(i)
          const y2 = topOf(i)
          return (
            <FcEdgeDraw
              key={`wall-${item.id}`}
              d={`M ${x1} ${y1} L ${x2} ${y2}`}
              at={b}
              shown={shown[b]}
              stroke={colors.line}
              width={2}
            />
          )
        })}
      </svg>

      {/* THE AXIS, IN TWO WORDS. The offset says there is depth; these say which
          end of it is which, and without them a viewer has to guess whether the
          stack is read down or up. They ride the hero's free beat and the last
          layer's beat, so neither costs a click. */}
      <FcEdgeLabel
        at={0}
        shown={shown[0]}
        className="absolute block font-heading text-[11px] font-bold uppercase leading-[1.3] tracking-wider"
        style={{ left: 0, top: 6, width: leftOf(0) - 16, color: colors.muted }}
      >
        What you touch
      </FcEdgeLabel>
      <FcEdgeLabel
        at={baseBeat}
        shown={shown[baseBeat]}
        className="absolute block font-heading text-[11px] font-bold uppercase leading-[1.3] tracking-wider"
        style={{
          left: 0,
          top: stackH - 22,
          width: leftOf(Math.max(0, f.all.length - 1)) - 16,
          color: colors.brand,
        }}
      >
        What it rests on
      </FcEdgeLabel>

      {f.all.map((item, i) => {
        const b = beatOf(item)
        return (
          <FcNodeIn
            key={item.id}
            at={b}
            shown={shown[b]}
            className="absolute"
            style={{
              left: leftOf(i),
              top: topOf(i),
              width: LAYER_W,
              height: heightOf(item),
            }}
          >
            <LayerBar
              item={item}
              hero={item === f.hero}
              /* Depth drives the paint: the deeper the stratum, the more solid it
                 is drawn, because the bottom of a stack is the part holding the
                 rest up and a foundation drawn in the lightest tint contradicts
                 the geometry above it. */
              depth={i / Math.max(1, f.all.length - 1)}
              foundation={i === f.all.length - 1}
              /* The top two open downward and the rest upward, so a popover never
                 leaves the top of the stage, where the instructor-video rectangle
                 sits. */
              side={i < 2 ? 'bottom' : 'top'}
            />
          </FcNodeIn>
        )
      })}

      {caption && (
        <FcEdgeLabel
          at={CAPTION_AT}
          shown={shown[CAPTION_AT]}
          className="absolute block text-center text-body-sm"
          style={{ left: 0, top: captionY, width: W, color: colors.body }}
        >
          {caption}
        </FcEdgeLabel>
      )}

      {/*
        CONTRACT VIOLATIONS ARE PRINTED, NOT SWALLOWED. `resolveFeatures` knows
        about two heroes, seven features, or an item with neither body nor
        outcome, and a stack that quietly draws seven strata 66px apart looks
        fine while arguing something nobody meant. With valid input this element
        is not in the DOM at all, so no harness ever measures it.
      */}
      {f.problems.length > 0 && (
        <div
          className="absolute left-0 top-0 z-[70] w-full rounded-card px-4 py-2 text-[11.5px] leading-[1.4]"
          style={{ background: `${colors.danger}14`, color: colors.danger }}
        >
          {f.problems.map((p) => (
            <span key={p} className="block">
              {p}
            </span>
          ))}
        </div>
      )}
    </figure>
  )
}

/**
 * ONE STRATUM.
 *
 * The hero is thicker AND brighter, not one or the other: thickness alone reads
 * as "this layer is bigger", which is a claim about size rather than about
 * importance, and brightness alone is lost on a projector two rows from the back.
 *
 * The hover pattern is copied exactly from `BentoGrid` and `AlternatingRows`:
 * `fc-node fc-node--hoverable` for the 160ms CSS lift (gated behind
 * `hover: hover` so a tap cannot leave a layer stuck raised), the popover inside
 * `AnimatePresence` so it is never in the DOM unless open, and the z-index that
 * lets it paint over its neighbours living on `.fc-node-slot`, which `FcNodeIn`
 * puts on the wrapper. This element's parent animates `transform`, and a
 * transformed element creates a stacking context no `z-index` in here can escape;
 * without that rule the panel came out sliced by the next two layers along.
 */
function LayerBar({
  item,
  hero,
  depth,
  foundation,
  side,
}: {
  item: FeatureItem
  hero: boolean
  /** 0 at the surface, 1 at the base. Drives the tint only. */
  depth: number
  foundation: boolean
  side: 'top' | 'bottom'
}) {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()
  const id = useId()
  const Icon = item.icon ? iconByName[item.icon] : null
  const hasDetail = Boolean(item.detail)

  /* Tint over an opaque base, never a bare translucent fill: a wash alone lets
     the slide read straight through the stratum, and a stack you can see through
     is not an artefact. */
  const surface = depth > 0.5 ? colors.surface2 : colors.surface
  const border = foundation ? `${colors.brand}66` : colors.line

  return (
    <div
      className="relative h-full w-full"
      onPointerEnter={() => hasDetail && setOpen(true)}
      onPointerLeave={() => setOpen(false)}
    >
      <div
        className={`fc-node flex h-full w-full items-center gap-3 rounded-card px-5 ${
          hasDetail ? 'fc-node--hoverable' : ''
        }`}
        style={
          hero
            ? {
                background: colors.brand,
                border: `2px solid ${colors.brand}`,
                boxShadow: `0 12px 34px -14px ${colors.brand}66`,
              }
            : {
                background: `linear-gradient(${surface}, ${surface}), ${colors.white}`,
                border: `1px solid ${border}`,
                boxShadow: foundation
                  ? `0 8px 26px -12px ${colors.brandDeep}33`
                  : `0 6px 24px -10px ${colors.brandDeep}1f`,
              }
        }
        aria-describedby={open ? id : undefined}
      >
        {Icon && (
          <span
            className={`grid shrink-0 place-items-center rounded-lg ${
              hero ? 'h-[28px] w-[28px]' : 'h-[26px] w-[26px]'
            }`}
            style={
              hero
                ? { background: 'rgba(255,255,255,0.22)', color: colors.white }
                : { background: `${colors.brand}1a`, color: colors.brand }
            }
          >
            <Icon width={hero ? 16 : 14} height={hero ? 16 : 14} />
          </span>
        )}

        <span className="min-w-0 flex-1">
          <span
            className={`block font-heading font-bold ${
              hero ? 'text-[19px] leading-[1.2]' : 'text-[15px] leading-[1.25]'
            }`}
            style={{ color: hero ? colors.white : colors.ink }}
          >
            {item.label}
          </span>
          {item.body && (
            <span
              className={`mt-[3px] block ${
                hero ? 'text-[13px] leading-[1.35]' : 'text-[12px] leading-[1.35]'
              }`}
              style={{ color: hero ? 'rgba(255,255,255,0.84)' : colors.body }}
            >
              {item.body}
            </span>
          )}
        </span>

        {/* WHAT THIS STRATUM BUYS YOU, right-aligned in its own column, so the
            whole right edge of the stack reads down as one list of gains while
            the left edge reads as the artefact. */}
        {item.outcome && (
          <span
            className={`shrink-0 text-right font-heading font-semibold ${
              hero ? 'text-[14px] leading-[1.3]' : 'text-[13px] leading-[1.35]'
            }`}
            style={{ width: OUT_W, color: hero ? colors.white : colors.brand }}
          >
            {item.outcome}
          </span>
        )}

        {/* The room cannot hover a projector, so the dot is the only way anyone
            watching knows there is a second layer of detail here at all. */}
        {hasDetail && (
          <span
            aria-hidden
            className="fc-node__more absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
            style={{ background: hero ? 'rgba(255,255,255,0.55)' : `${colors.muted}99` }}
          />
        )}
      </div>

      {/*
        THE POPOVER IS NEVER IN THE DOM UNLESS IT IS OPEN. `qa.mjs`,
        `video-safe.mjs` and `align-check.mjs` all measure static rectangles, so a
        panel parked at `opacity: 0` is reported as overflowing the frame on every
        run. It also keeps `detail` honest: the slide has to be complete without
        it, because nobody in the room can reach it.
      */}
      <AnimatePresence>
        {open && item.detail && (
          <motion.span
            id={id}
            role="tooltip"
            className="pointer-events-none absolute left-6 z-30 block w-[320px] rounded-card border bg-white px-3.5 py-3 text-left text-[12.5px] leading-snug shadow-float"
            style={{
              color: colors.body,
              borderColor: colors.line,
              [side === 'top' ? 'bottom' : 'top']: 'calc(100% + 10px)',
              /* Scales from the edge nearest the stratum, so it reads as coming
                 out of the layer rather than appearing beside it. */
              transformOrigin: `${side === 'top' ? 'bottom' : 'top'} left`,
            }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.96)' }}
            animate={{ opacity: 1, transform: 'scale(1)' }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.98)' }}
            transition={{ duration: POPOVER, ease: c4(E.out) }}
          >
            <span
              className="mb-1 block font-heading text-[11px] font-bold uppercase tracking-wide"
              style={{ color: colors.brand }}
            >
              {item.label}
            </span>
            {item.detail}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
