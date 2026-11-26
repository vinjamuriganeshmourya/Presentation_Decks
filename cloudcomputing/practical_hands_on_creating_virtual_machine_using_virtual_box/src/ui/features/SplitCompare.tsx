import { useId, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { colors } from '@/design/tokens'
import { E, c4 } from '@/ui/figureTiming'
import { FcEdgeDraw, FcEdgeLabel, FcNodeIn, useBeats } from '@/ui/figures/motion'
import { resolveFeatures, type FeatureItem, type FeaturesFigureProps } from './featuresFigure'

/**
 * SPLIT COMPARE — the same five features, drawn as a with and a without. Row n on
 * the left is life before the capability; row n on the right is life with it.
 *
 * THE ARGUMENT
 *
 * A features list ASSERTS value. A comparison DEMONSTRATES it. "You stop losing
 * work" is a sentence the room has read on every product page it has ever seen
 * and it lands as nothing; put "You lose work" immediately to its left, struck
 * through, and the same sentence becomes an answer to a problem the reader has
 * actually had.
 *
 * That is not a stylistic preference, it is the best-attested finding in the
 * behavioural literature: a loss is felt at roughly twice the weight of an
 * equivalent gain (Kahneman and Tversky's prospect theory, and NN/g's own write
 * up of it for interfaces). A feature slide that only lists gains is arguing on
 * the weak side of that asymmetry the whole time. The comparison table is the
 * standard form for exactly this reason, and it is the one shape a card grid
 * cannot take: cards sit beside each other as peers, and peers do not contradict
 * each other.
 *
 * THE LEFT-HAND COPY IS DERIVED, NEVER INVENTED. There is no `without` field on
 * this contract and this variant does not add one. The left cell renders the
 * item's OWN `outcome`, struck through and set in `colors.muted`, behind a small
 * bar that reads as a negation. The absence of the gain IS the without. Nothing
 * is written that the author did not write. Where an item has no `outcome` at
 * all, the left cell says so plainly rather than fabricating a hardship, because
 * a slide that invents the pain it then solves is the exact dishonesty the
 * illustration rule in `slide-content-rules` exists to stop.
 *
 * THE PAIR IS THE UNIT, and both the geometry and the choreography say so: the
 * two cells share a beat and land together. Revealing all five withouts and then
 * all five withs would be two lists, and the room would have to pair them up
 * itself, which is the failure mode `AlternatingRows` was built to avoid.
 *
 * WHAT IT IS WORST AT
 *
 *   - **`body` has nowhere to go.** The right cell holds `label` and `outcome`
 *     and there is no third line's worth of height in a 64px row, so what the
 *     feature IS moves into the hover popover, which a projector audience cannot
 *     reach. If the `body` line carries the teaching, this variant loses it, and
 *     that is the real price of the second column.
 *   - **A set with no downside.** Some capabilities have no meaningful "before":
 *     nobody suffered from the absence of a keyboard shortcut. Forcing those into
 *     a without column manufactures a grievance, and the honest fallback here
 *     (saying no gain is stated) reads as an admission mid-figure.
 *   - **Items with no `outcome`.** The whole left column is derived from it, so an
 *     item without one contributes a row of apology. `resolveFeatures` will not
 *     object, because an item with only a `body` is legal.
 *   - **Half the stage argues for the competition.** Twelve hundred pixels of
 *     slide, and 500 of them are spent stating the bad case in muted grey. If the
 *     room does not already recognise that bad case, the slide has spent its best
 *     real estate on something they will not read.
 *   - **Six items.** At six the rows drop below the padding floor, and the
 *     contract's own upper bound is already the point where a set becomes a list.
 *
 * GEOMETRY, AND WHY EVERY NUMBER IS WHAT IT IS
 *
 * A fixed 1100x400 stage, absolutely positioned. A 470px "without" column, a 60px
 * channel with the divider rule down its centre, and a 570px "with" column.
 * 470 + 60 + 570 = 1100. The without column is right-aligned and the with column
 * left-aligned, so each pair MEETS at the divider: the two halves of one argument
 * are 60px apart rather than 500.
 *
 * The right column is wider because it carries two lines of type inside a card
 * and the left carries one line of type with no box at all. The asymmetry is also
 * the point: one side has something and the other does not, and the figure should
 * look like that before a single word is read.
 *
 * The row heights ARE the padding floor:
 *
 *   normal row   64px   right cell content is a 15px label on 1.25 (18.75) plus
 *                       a 3px gap plus a 12.5px outcome on 1.35 (16.9) = 38.65,
 *                       so real vertical padding is (64 - 38.65) / 2 = 12.7px
 *   hero row     72px   18px label on 1.2 (21.6) + 4 + 14px outcome on 1.35
 *                       (18.9) = 44.5, so real padding is 13.75px
 *
 * The fixture's longest label, "Plain files on disk", sets on one line at 15px in
 * 538px of measure, so no row can grow past those numbers. That arithmetic is the
 * whole reason the block exists: `py-3` DECLARES 12px, but a box SHOWS
 * `(box height - content height) / 2`, and the sibling flow-chart lab shipped four
 * cards at 0px and one at -7px, all declaring 12px, past every harness it had.
 *
 * 32 for the column headings, then 72 + 4 x 64 + 4 x 3 of gap = 340, so the rows
 * end at 372, the caption sits at 378, and the figure is 400.
 */

const W = 1100
const H = 400

const LEFT_W = 470
const MID_W = 60
const RIGHT_W = W - LEFT_W - MID_W /* 570 */
const RIGHT_X = LEFT_W + MID_W

const HEAD_H = 22
const ROWS_TOP = 32
const HERO_H = 72
const ROW_H = 64
const GAP = 3
const CAPTION_Y = 378

/**
 * THE WITHOUT. Type only, no box, and that is the design.
 *
 * The right side is carded and this side is not, so the figure states its
 * asymmetry structurally: one column has a thing, the other is the shape of not
 * having it. Giving both sides a card would draw two options being compared,
 * which is a different and much weaker claim.
 *
 * The bar before the text is a negation mark rather than a glyph, because a
 * character would be a rendered string doing the work of a drawing and would
 * change size with the font stack.
 */
function WithoutCell({
  without,
  outcome,
  hero,
}: {
  without: FeatureItem['without']
  outcome: FeatureItem['outcome']
  hero: boolean
}) {
  /*
    THE LOSS IS ITS OWN SENTENCE, NOT THE GAIN CROSSED OUT.

    The first version struck through the item's `outcome`, on the sound principle
    that nothing should be invented. On screen both columns then read the SAME
    words with one of them scored through, and a comparison where both sides say
    the same thing demonstrates nothing: a struck "You stop filing things and
    just find them" is not "You lose an afternoon a week to filing". The whole
    argument of this variant is that the gain only lands beside the loss, and it
    had no loss to put there.

    `without` on the contract is the fix, and it was added for this. The
    strikethrough survives as the FALLBACK for an item that has no `without`,
    which is still better than an invented hardship, and the honest gap below is
    the fallback after that.
  */
  const stated = without ?? null
  return (
    <div className="flex h-full w-full items-center justify-end gap-2.5 pr-1">
      <span
        aria-hidden
        className="block shrink-0 rounded-full"
        style={{ width: hero ? 16 : 12, height: 2, background: colors.muted }}
      />
      {stated ? (
        <span
          className={`block text-right ${hero ? 'text-[14px]' : 'text-[12.5px]'} leading-[1.35]`}
          style={{ color: colors.muted }}
        >
          {stated}
        </span>
      ) : outcome ? (
        <span
          className={`block text-right ${hero ? 'text-[14px]' : 'text-[12.5px]'} leading-[1.35]`}
          style={{
            color: colors.muted,
            textDecorationLine: 'line-through',
            textDecorationColor: colors.line,
            textDecorationThickness: 1,
          }}
        >
          {outcome}
        </span>
      ) : (
        /* NOT FABRICATED. The item states no gain, so this cell states that, and
           the figure carries an honest gap rather than an invented hardship. */
        <span
          className="block text-right text-[12.5px] italic leading-[1.35]"
          style={{ color: colors.muted }}
        >
          No gain stated for this one
        </span>
      )}
    </div>
  )
}

/**
 * THE WITH. A card, and the only box in the figure.
 *
 * The hover lives on this side because this is the cell that names the feature,
 * and one popover per pair is one per row. The pattern is copied from
 * `NodeShell` exactly:
 *
 *   - `fc-node fc-node--hoverable` for the lift: a CSS transition in `index.css`
 *     at UI-tier speed (160ms), gated behind `hover: hover` so a tap does not
 *     leave a card stuck raised. The figure's entrance is 520ms because it is
 *     watched once; a hover is triggered deliberately and repeatedly.
 *   - The popover is framer, because it mounts and unmounts and needs an exit.
 *   - The popover is NEVER in the DOM unless open. All the harnesses measure
 *     static rectangles, so a panel parked at `opacity: 0` is reported as
 *     overflowing the frame on every run.
 *   - `transform-origin` points back at the card.
 *
 * The z-index that lets it paint over its neighbours lives on `.fc-node-slot`,
 * which `FcNodeIn` puts on the wrapper: this element's parent animates
 * `transform`, and a transformed element creates a stacking context that a
 * `z-index` in here could never escape.
 *
 * `body` is rendered INSIDE the popover, not on the card. There is no room for a
 * third line above the padding floor, and the doc block above says plainly that
 * this is the variant's worst trade.
 */
function WithCell({ item, hero, side }: { item: FeatureItem; hero: boolean; side: 'top' | 'bottom' }) {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()
  const id = useId()
  const hasDetail = Boolean(item.detail || item.body)

  return (
    <div
      className="relative h-full w-full"
      onPointerEnter={() => hasDetail && setOpen(true)}
      onPointerLeave={() => setOpen(false)}
    >
      <div
        className={`fc-node flex h-full w-full flex-col justify-center rounded-card px-4 ${
          hero ? 'shadow-card' : 'border shadow-card-soft'
        } ${hasDetail ? 'fc-node--hoverable' : ''}`}
        style={
          hero
            ? { background: colors.brand }
            : {
                background: colors.white,
                borderColor: colors.line,
                /* The accent edge on the with side, so the eye can find the
                   answer column without reading the heading again. */
                borderLeft: `3px solid ${colors.brand}`,
              }
        }
        aria-describedby={open ? id : undefined}
      >
        <span
          className={`block font-heading font-bold ${
            hero ? 'text-[18px] leading-[1.2]' : 'text-[15px] leading-[1.25]'
          }`}
          style={{ color: hero ? colors.white : colors.ink }}
        >
          {item.label}
        </span>
        {item.outcome && (
          <span
            className={`block ${hero ? 'mt-1 text-[14px]' : 'mt-[3px] text-[12.5px]'} font-heading font-semibold leading-[1.35]`}
            style={{ color: hero ? colors.white : colors.brand }}
          >
            {item.outcome}
          </span>
        )}

        {/* The room cannot hover a projector, so the dot is the only way anyone
            watching knows there is a second layer here at all. */}
        {hasDetail && (
          <span
            aria-hidden
            className="fc-node__more absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
            style={{ background: hero ? colors.white : colors.line }}
          />
        )}
      </div>

      <AnimatePresence>
        {open && hasDetail && (
          <motion.span
            id={id}
            role="tooltip"
            className="pointer-events-none absolute left-0 z-30 block w-[330px] rounded-card border bg-white px-3.5 py-3 text-left text-[12.5px] leading-snug shadow-float"
            style={{
              color: colors.body,
              borderColor: colors.line,
              [side === 'top' ? 'bottom' : 'top']: 'calc(100% + 10px)',
              transformOrigin: `${side === 'top' ? 'bottom' : 'top'} left`,
            }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.96)' }}
            animate={{ opacity: 1, transform: 'scale(1)' }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.98)' }}
            transition={{ duration: 0.18, ease: c4(E.out) }}
          >
            <span
              className="mb-1 block font-heading text-[11px] font-bold uppercase tracking-wide"
              style={{ color: colors.brand }}
            >
              {item.label}
            </span>
            {item.body && (
              <span className="mb-1 block" style={{ color: colors.ink }}>
                {item.body}
              </span>
            )}
            {item.detail}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

export function SplitCompare({ items, caption, className = '' }: FeaturesFigureProps) {
  const f = resolveFeatures({ items })

  /*
    PAIRS ARE DRAWN IN AUTHORED ORDER; BEATS RUN HERO FIRST, AND A PAIR IS ONE
    BEAT.

    The comparison is the unit, so the without and the with of one row share a
    beat and land together. Splitting them would cost a click that changes half a
    row, and would let the room read a column instead of a pair.
  */
  const order = f.hero ? [f.hero, ...f.rest] : f.all
  const beatOf = (item: FeatureItem) => order.indexOf(item)

  const heightOf = (item: FeatureItem) => (item === f.hero ? HERO_H : ROW_H)
  const topOf = (i: number) =>
    ROWS_TOP + f.all.slice(0, i).reduce((y, it) => y + heightOf(it) + GAP, 0)

  const rowsBottom = topOf(f.all.length) - GAP

  /* Derived from `items`, never from state, so the registered step count is
     stable while the slide is up. One beat per pair, plus the caption. Beat 0 is
     free: it carries the headings, the divider and the hero pair, so the slide
     never opens on an empty stage and no click is spent on furniture. */
  const CAPTION = f.all.length
  const shown = useBeats(CAPTION + 1)

  return (
    <figure className={`relative mx-auto ${className}`} style={{ width: W, height: H }}>
      {/* THE DIVIDER. One aria-hidden SVG layer, geometry only: every word in this
          figure is a DOM element, per content rule 17. An `<svg>` is a single
          rectangle to every harness here, so `<text>` labels can overlap and pass
          all of them, which shipped twice in session 4. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0"
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
      >
        <FcEdgeDraw
          d={`M ${LEFT_W + MID_W / 2} ${ROWS_TOP - 10} V ${rowsBottom}`}
          at={0}
          shown={shown[0]}
          stroke={colors.line}
          width={1.5}
        />
      </svg>

      {/* THE TWO HEADINGS. Base content, on the free beat, because a comparison
          whose columns are unlabelled is two lists. */}
      <FcNodeIn
        at={0}
        shown={shown[0]}
        className="absolute"
        style={{ left: 0, top: 0, width: LEFT_W, height: HEAD_H }}
      >
        <span
          className="block pr-1 text-right font-heading text-[11px] font-bold uppercase tracking-wide"
          style={{ color: colors.muted }}
        >
          Without it
        </span>
      </FcNodeIn>
      <FcNodeIn
        at={0}
        shown={shown[0]}
        className="absolute"
        style={{ left: RIGHT_X, top: 0, width: RIGHT_W, height: HEAD_H }}
      >
        <span
          className="block pl-4 font-heading text-[11px] font-bold uppercase tracking-wide"
          style={{ color: colors.brand }}
        >
          With it
        </span>
      </FcNodeIn>

      {f.all.map((item, i) => {
        const b = beatOf(item)
        const hero = item === f.hero
        const top = topOf(i)
        const h = heightOf(item)
        return (
          <FcNodeIn
            key={`w-${item.id}`}
            at={b}
            shown={shown[b]}
            className="absolute"
            style={{ left: 0, top, width: LEFT_W, height: h }}
          >
            <WithoutCell without={item.without} outcome={item.outcome} hero={hero} />
          </FcNodeIn>
        )
      })}

      {f.all.map((item, i) => {
        const b = beatOf(item)
        const hero = item === f.hero
        const top = topOf(i)
        const h = heightOf(item)
        return (
          <FcNodeIn
            key={`h-${item.id}`}
            at={b}
            shown={shown[b]}
            className="absolute"
            style={{ left: RIGHT_X, top, width: RIGHT_W, height: h }}
          >
            <WithCell
              item={item}
              hero={hero}
              /* The first two rows open downward and the rest upward, so a
                 popover never leaves the top of the stage, where the
                 instructor-video rectangle is. */
              side={i < 2 ? 'bottom' : 'top'}
            />
          </FcNodeIn>
        )
      })}

      {caption && (
        <FcEdgeLabel
          at={CAPTION}
          shown={shown[CAPTION]}
          className="absolute text-center text-body-sm"
          style={{ left: 0, width: W, top: CAPTION_Y, color: colors.body }}
        >
          {caption}
        </FcEdgeLabel>
      )}

      {/*
        CONTRACT VIOLATIONS ARE DRAWN, NOT SWALLOWED.

        `resolveFeatures` reports two heroes, or seven features, or an item with
        neither `body` nor `outcome`. Laying that out anyway produces a figure
        that looks fine and argues something the author did not mean. With valid
        input this element is not in the DOM at all, so no harness measures it.
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
