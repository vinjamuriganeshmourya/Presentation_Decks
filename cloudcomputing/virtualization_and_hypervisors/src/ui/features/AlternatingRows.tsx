import { useId, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { colors } from '@/design/tokens'
import { iconByName } from '@/ui/icons'
import { E, c4 } from '@/ui/figureTiming'
import { FcArrowDefs, FcEdgeDraw, FcEdgeLabel, FcNodeIn, useBeats } from '@/ui/figures/motion'
import { resolveFeatures, type FeatureItem, type FeaturesFigureProps } from './featuresFigure'

/**
 * ALTERNATING ROWS — what it is on one side, what it buys you on the other, and
 * the side swaps every row.
 *
 * THE ARGUMENT
 *
 * A features grid buries the payoff. Every card ends up as "name, then a
 * sentence about the name", and the reason anybody would want the thing is
 * either absent or hidden in the third line of a 12px paragraph. This contract
 * already separates the two (`body` is what it IS, `outcome` is what it BUYS),
 * and this variant is the layout that takes that separation literally: a
 * full-width row per feature, the capability on one side, the gain on the other,
 * an arrow between them pointing from the WHAT to the WHY.
 *
 * The swap is the whole reason it is not two columns. Two fixed columns are a
 * table, and a table is read down one column and then down the other, so the
 * room gets five capabilities and then, separately, five gains, and has to pair
 * them up itself. Alternating forces the eye back across the centre on every
 * row, so each pair is read as a pair. It is also the established fix for the
 * flat-grid complaint that started this lab: nothing leads in a grid of equals,
 * and here the hero row is taller, filled and first.
 *
 * WHAT IT IS WORST AT
 *
 *   - **Comparison.** Rows are wide and the labels do not line up in a column,
 *     so "which of these is fastest" is a question this figure cannot answer.
 *     A grid can. Use it for a SET of independent capabilities, never for
 *     options someone is choosing between.
 *   - **Features with no `outcome`.** Half of every row goes blank and the
 *     alternation turns into a ragged left margin with nothing on the right of
 *     it. `resolveFeatures` will not catch that, because an item with only a
 *     `body` is legal; this variant simply has nowhere to put the emptiness.
 *   - **Long copy.** A row is 66px, which is one label line and one body line and
 *     nothing else. A `body` that wraps to two lines eats the padding floor, and
 *     that failure is silent (see GEOMETRY).
 *   - **Six items.** At six the rows are shorter than their own type wants, and
 *     the contract's own upper bound of six is already the point where this stops
 *     being a set and starts being a list with rules between it.
 *
 * GEOMETRY, AND WHY EVERY NUMBER IS WHAT IT IS
 *
 * A fixed 1100x400 stage, absolutely positioned. Two 462px sides with a 176px
 * channel down the middle for the connector, which is enough for the arrow to
 * read as travel rather than as a hyphen.
 *
 * The row heights are the padding floor, not a taste:
 *
 *   normal row   66px   content is a 15px label on 1.25 (18.75) plus a 3px gap
 *                       plus a 12px body on 1.35 (16.2) = 38px, so the REAL
 *                       vertical padding is (66 - 38) / 2 = 14px
 *   hero row     88px   19px label on 1.2 (22.8) + 3 + 13px body on 1.35
 *                       (17.55) = 43px, so real padding is 22px
 *
 * That arithmetic is the point of the whole block. `py-3.5` DECLARES 14px; what
 * a box shows is `(box height - content height) / 2`, and when the content
 * outgrows the box the declared value silently becomes 0 or negative. The
 * sibling flow-chart lab shipped four cards at 0px and one at -7px, all of them
 * declaring 12px, and all six of its variants passed every harness the whole
 * time. So the boxes here are sized from the content, and the content is capped
 * at one line each by the type sizes above.
 *
 * 88 + 4 x 66 + 4 x 4 of gap = 368, the caption sits at 376, the figure is 400.
 * The gap is 4px rather than a rule, because five hairlines stacked 66px apart
 * read as a table and the connectors are already doing the dividing.
 */

const W = 1100
const H = 400
const SIDE = 462
const MID = W - SIDE * 2 /* 176 */
const HERO_H = 88
const ROW_H = 66
const GAP = 4
/** The connector stops this far short of each side, so the arrow has air. */
const TIP_GAP = 16

const PAINT = {
  hero: colors.brand,
  row: colors.muted,
}

/**
 * ONE ROW'S CARD, WITH THE HOVER.
 *
 * Written here rather than reused from the flow-chart lab's `NodeShell`, because
 * that shell stacks an icon over a label over a caption and is sized for a 180px
 * column; this is a 462px row with the icon beside the text. What IS copied is
 * the pattern, and it is copied exactly:
 *
 *   - `fc-node fc-node--hoverable` for the lift, which is a CSS transition in
 *     `index.css` at UI-tier speed (160ms), gated behind `hover: hover` so a
 *     tap does not leave a row stuck raised. The figure's entrance is 520ms
 *     because it is watched once; a hover is triggered deliberately and
 *     repeatedly and takes UI numbers.
 *   - The popover is framer, because it mounts and unmounts and needs an exit.
 *   - The popover is NEVER in the DOM unless open. `qa.mjs`, `video-safe.mjs`
 *     and `align-check.mjs` measure static rectangles, so a panel parked at
 *     `opacity: 0` is reported as overflowing the frame on every run.
 *   - `transform-origin` points back at the row, so it reads as coming out of
 *     the row rather than appearing beside it.
 *
 * The z-index that lets it paint over its neighbours lives on `.fc-node-slot`,
 * which `FcNodeIn` puts on the wrapper: this element's parent animates
 * `transform`, and a transformed element creates a stacking context that a
 * `z-index` in here can never escape.
 */
function RowCard({
  item,
  hero,
  side,
  align,
}: {
  item: FeatureItem
  hero: boolean
  /** Which way the popover opens, so the top rows do not push off the stage. */
  side: 'top' | 'bottom'
  /** Which edge of the row the card sits against, so the popover leans inward. */
  align: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()
  const id = useId()
  const Icon = item.icon ? iconByName[item.icon] : null
  const hasDetail = Boolean(item.detail)

  return (
    <div
      className="relative h-full w-full"
      onPointerEnter={() => hasDetail && setOpen(true)}
      onPointerLeave={() => setOpen(false)}
    >
      <div
        className={`fc-node flex h-full w-full items-center gap-3 px-4 py-3.5 ${
          hero ? 'rounded-card shadow-card' : 'rounded-card border shadow-card-soft'
        } ${hasDetail ? 'fc-node--hoverable' : ''}`}
        style={
          hero
            ? { background: PAINT.hero }
            : { background: colors.white, borderColor: colors.line }
        }
        aria-describedby={open ? id : undefined}
      >
        {Icon && (
          <span
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
            style={
              hero
                ? { background: 'rgba(255,255,255,0.22)', color: colors.white }
                : { background: `${PAINT.hero}14`, color: PAINT.hero }
            }
          >
            <Icon width={16} height={16} />
          </span>
        )}
        <span className="min-w-0">
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

        {/* The room cannot hover a projector, so the dot is the only way anyone
            watching knows there is a second layer here at all. */}
        {hasDetail && (
          <span
            aria-hidden
            className="fc-node__more absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
            style={{ background: hero ? 'rgba(255,255,255,0.55)' : `${PAINT.hero}66` }}
          />
        )}
      </div>

      <AnimatePresence>
        {open && item.detail && (
          <motion.span
            id={id}
            role="tooltip"
            className="pointer-events-none absolute z-30 block w-[300px] rounded-card border bg-white px-3.5 py-3 text-left text-[12.5px] leading-snug shadow-float"
            style={{
              color: colors.body,
              borderColor: colors.line,
              [side === 'top' ? 'bottom' : 'top']: 'calc(100% + 10px)',
              [align]: 16,
              transformOrigin: `${side === 'top' ? 'bottom' : 'top'} ${align}`,
            }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.96)' }}
            animate={{ opacity: 1, transform: 'scale(1)' }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.98)' }}
            transition={{ duration: 0.18, ease: c4(E.out) }}
          >
            <span
              className="mb-1 block font-heading text-[11px] font-bold uppercase tracking-wide"
              style={{ color: PAINT.hero }}
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

/** What it buys you. Type, not a box: the row already has its box on the other side. */
function OutcomeBlock({
  outcome,
  hero,
  /** Which edge the connector arrives on, so the rule sits under the arrowhead. */
  from,
}: {
  outcome: ReactNode
  hero: boolean
  from: 'left' | 'right'
}) {
  return (
    <span
      className={`block ${from === 'left' ? 'border-l pl-4 text-left' : 'border-r pr-4 text-right'}`}
      style={{ borderColor: `${PAINT.hero}55`, borderLeftWidth: from === 'left' ? 3 : 0, borderRightWidth: from === 'right' ? 3 : 0 }}
    >
      <span
        className={`block font-heading font-semibold ${
          hero ? 'text-[16px] leading-[1.3]' : 'text-[13.5px] leading-[1.35]'
        }`}
        style={{ color: hero ? PAINT.hero : colors.ink }}
      >
        {outcome}
      </span>
    </span>
  )
}

export function AlternatingRows({ items, caption, className = '' }: FeaturesFigureProps) {
  const f = resolveFeatures({ items })

  /*
    ROWS ARE DRAWN IN AUTHORED ORDER; BEATS RUN HERO FIRST.

    The two are usually the same list, because a hero is normally authored first,
    and when they are not it is the reveal that leads with the hero rather than
    the layout reshuffling itself. A figure whose rows move when you mark one of
    them `hero` would be a figure whose geometry depends on its weights.
  */
  const order = f.hero ? [f.hero, ...f.rest] : f.all
  const beatOf = (item: FeatureItem) => order.indexOf(item) * 2

  const heightOf = (item: FeatureItem) => (item === f.hero ? HERO_H : ROW_H)
  const topOf = (i: number) =>
    f.all.slice(0, i).reduce((y, it) => y + heightOf(it) + GAP, 0)

  /* Derived from `items`, never from state, so the step count is stable while
     the slide is up. Two beats per row (the card, then its payoff), plus the
     caption. Beat 0 is free and it belongs to the hero. */
  const CAPTION = f.all.length * 2
  const shown = useBeats(CAPTION + 1)

  return (
    <figure className={`relative mx-auto ${className}`} style={{ width: W, height: H }}>
      {/* CONNECTORS. One aria-hidden SVG layer, geometry only: every word in this
          figure is a DOM element, per content rule 17. An `<svg>` is a single
          rectangle to all three harnesses, so `<text>` labels can overlap and
          still pass every sweep, which shipped twice in session 4. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0"
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
      >
        <FcArrowDefs id="altrows" colors={PAINT} />
        {f.all.map((item, i) => {
          if (!item.outcome) return null
          const hero = item === f.hero
          const flip = i % 2 === 1
          const y = topOf(i) + heightOf(item) / 2
          const b = beatOf(item) + 1
          const x1 = flip ? W - SIDE - TIP_GAP : SIDE + TIP_GAP
          const x2 = flip ? SIDE + TIP_GAP : W - SIDE - TIP_GAP
          return (
            <FcEdgeDraw
              key={item.id}
              d={`M ${x1} ${y} H ${x2}`}
              at={b}
              shown={shown[b]}
              stroke={hero ? PAINT.hero : PAINT.row}
              width={hero ? 2.5 : 1.5}
              markerEnd={hero ? 'url(#altrows-hero)' : 'url(#altrows-row)'}
            />
          )
        })}
      </svg>

      {/* THE CAPABILITY. A card, on the side this row's index gives it. */}
      {f.all.map((item, i) => {
        const hero = item === f.hero
        const flip = i % 2 === 1
        const b = beatOf(item)
        const top = topOf(i)
        return (
          <FcNodeIn
            key={item.id}
            at={b}
            shown={shown[b]}
            className="absolute"
            style={{
              left: flip ? W - SIDE : 0,
              top,
              width: SIDE,
              height: heightOf(item),
            }}
          >
            <RowCard
              item={item}
              hero={hero}
              /* The first two rows open downward and the rest upward, so a
                 popover never leaves the top of the stage, where the
                 instructor-video rectangle is. */
              side={i < 2 ? 'bottom' : 'top'}
              align={flip ? 'right' : 'left'}
            />
          </FcNodeIn>
        )
      })}

      {/* THE PAYOFF, on the other side, landing after the arrow reaches it. */}
      {f.all.map((item, i) => {
        if (!item.outcome) return null
        const hero = item === f.hero
        const flip = i % 2 === 1
        const b = beatOf(item) + 1
        const top = topOf(i)
        const h = heightOf(item)
        return (
          <FcEdgeLabel
            key={`o-${item.id}`}
            at={b}
            shown={shown[b]}
            className="absolute flex items-center"
            style={{
              left: flip ? 0 : W - SIDE,
              top,
              width: SIDE,
              height: h,
              justifyContent: flip ? 'flex-end' : 'flex-start',
              paddingLeft: flip ? 0 : MID / 8,
              paddingRight: flip ? MID / 8 : 0,
            }}
          >
            <OutcomeBlock outcome={item.outcome} hero={hero} from={flip ? 'right' : 'left'} />
          </FcEdgeLabel>
        )
      })}

      {caption && (
        <FcEdgeLabel
          at={CAPTION}
          shown={shown[CAPTION]}
          className="absolute text-center text-body-sm"
          style={{ left: 0, width: W, top: 376, color: colors.body }}
        >
          {caption}
        </FcEdgeLabel>
      )}

      {/*
        CONTRACT VIOLATIONS ARE DRAWN, NOT SWALLOWED.

        `resolveFeatures` reports two heroes, or seven features, or an item with
        neither `body` nor `outcome`. Laying that out anyway produces a figure
        that looks fine and argues something the author did not mean, so the
        report is painted over the top of the stage where it cannot be missed.
        With valid input this element is not in the DOM at all, so no harness
        ever measures it.
      */}
      {f.problems.length > 0 && (
        <div
          className="absolute left-0 top-0 z-[70] w-full rounded-card px-4 py-2 text-[12px] leading-snug"
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
