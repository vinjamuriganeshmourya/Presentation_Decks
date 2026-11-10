import { useId, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { colors } from '@/design/tokens'
import { iconByName } from '@/ui/icons'
import { E, c4 } from '@/ui/figureTiming'
import { FcEdgeDraw, FcEdgeLabel, FcNodeIn, useBeats } from '@/ui/figures/motion'
import { resolveFeatures, type FeatureItem, type FeaturesFigureProps } from './featuresFigure'

/**
 * METRIC LED — the number leads and the name supports it.
 *
 * THE ARGUMENT
 *
 * Every other variant in this lab leads with the capability's NAME, which means
 * the eye has to read a phrase before it knows whether this tile is worth its
 * attention. A number does not have to be read: it is the one thing on a slide
 * the eye finds without being told where to look, which is why established
 * practice for a metric-led layout is to set the figure at display scale and
 * demote the words to a caption under it. "40ms" arrives before "Search
 * everything" does, and then the label explains what the 40 was about.
 *
 * That only works if the rest of the surface stays quiet. So there are no filled
 * cards on the supporting side, one hairline of structure, and exactly one
 * accent colour, all of it spent on five numerals. The hero's figure is set
 * larger again, because a field of five equal numbers is the flat grid the whole
 * lab exists to replace.
 *
 * A FEATURE WITH NO NUMBER SAYS SO. `metric` is a separate field on the contract
 * and not a formatting hint on `outcome` for exactly this reason: the honest
 * failure mode of a metric-led layout is a manufactured metric. Where the field
 * is absent this variant draws a short muted bar and the words "no figure for
 * this one", which is ugly on purpose. It should push the author to either find
 * the number or pick a different variant, and it must never invent a "2x".
 *
 * WHAT IT IS WORST AT
 *
 *   - **A feature set whose numbers are not comparable.** This fixture is the
 *     case: "40" is milliseconds, "100" is a percentage, "0" is a count and
 *     "every" is not a number at all. Set at one size, in one colour, in one row,
 *     the layout asserts that they are five readings of the same instrument. They
 *     are not, and no amount of unit text under them fixes it. Use this only
 *     where the figures share a dimension or are so obviously unlike that no
 *     comparison is implied.
 *   - **Numbers of very different LENGTH.** "every" is five glyphs at 88px on the
 *     hero and "0" is one, so the optical weight of a cell has nothing to do with
 *     the strength of its claim. The longest value the small cells can hold at
 *     34px is about ten glyphs; past that it wraps and the figure loses its grid.
 *   - **A set with no honest metrics at all.** Four "no figure for this one"
 *     panels is a worse slide than a plain card grid, and this variant will
 *     cheerfully draw it.
 *   - **Mechanism.** It states outcomes and never explains one. `body` is a
 *     single 11.5px line and `detail` is behind a hover the room cannot reach.
 *
 * GEOMETRY, AND THE PADDING ARITHMETIC
 *
 * A fixed 1100 x 354 stage on a 1280x720 slide, absolutely positioned. The hero
 * is a 428px panel on the left and the four supporting features are a 2x2 field
 * of 316px cells to the right of it: 428 + 24 channel + 316 + 16 + 316 = 1100
 * exactly, so no column carries a rounding remainder. Cell rows are 150px on a
 * 16px gutter, so the right field is 316 tall and the hero panel matches it.
 *
 * THE METRIC SLOT IS A FIXED HEIGHT, and that is what makes the padding
 * arithmetic hold whether or not an item has a number. `SLOT.hero` is 110px (an
 * 88px numeral on 1.0, a 4px gap, a 14px unit line on 1.3) and `SLOT.cell` is
 * 50px (34px numeral, 2px gap, 11px unit on 1.3). The "no figure" fallback draws
 * a 3px bar plus the same unit line inside the same box, so it cannot change any
 * height below.
 *
 * Padding is a floor, not a declaration: a box SHOWS `(box height - content
 * height) / 2`, and a declared `py-4` silently becomes 0 or negative the moment
 * content outgrows the box. The sibling flow-chart lab shipped four cards at 0px
 * and one at -7px, all of them declaring 12px, and passed every harness for
 * weeks. So both boxes here are sized from the content, against this fixture's
 * longest label, "Plain files on disk", plus its body line:
 *
 *   cell   150px   50 slot + 8 gap + 17.5 label (14px on 1.25) + 3 gap
 *                  + 15.5 body (11.5px on 1.35) = 94  ->  (150 - 94) / 2 = 28px
 *   hero   316px   110 slot + 12 gap + 26.4 label (22px on 1.2) + 4 gap
 *                  + 19.6 body (14px on 1.4) + 8 gap + 26 outcome pill = 206
 *                  ->  (316 - 206) / 2 = 55px
 *
 * The floor is 12px and the worst case is 28, so a label OR a body can gain a
 * whole line anywhere in the field before the padding is even threatened. At
 * 14px bold, "Plain files on disk" is about 130px wide inside 284px of usable
 * cell, so nothing in this fixture wraps in the first place.
 *
 * 316 grid + 14 + 24 = 354, and the caption sits on the last of that.
 */

const W = 1100
const HERO_W = 428
/** Channel between the hero and the supporting field. Wider than the field's own
    gutter, because it separates two KINDS of thing rather than two peers. */
const CHANNEL = 24
const GAP = 16
const CELL_W = (W - HERO_W - CHANNEL - GAP) / 2 /* 316 */
const CELL_H = 150
const GRID_H = CELL_H * 2 + GAP /* 316 */
const CAPTION_Y = GRID_H + 14
const H = CAPTION_Y + 24 /* 354 */

/** Fixed metric-slot heights. See the arithmetic in the doc comment. */
const SLOT = { hero: 110, cell: 50 }

/**
 * The hover popover's own duration, and deliberately NOT one of `T`'s.
 *
 * `T` is the explanatory tier: the figure assembles at 520ms because the room
 * reads it once from the back. A hover is the opposite case, triggered on purpose
 * and repeatedly by a presenter who is waiting for the answer, so it takes the
 * `animate` skill's UI numbers. The lift itself is a CSS transition in
 * `index.css` and is not written in this file.
 */
const POPOVER = 0.18

/** Where a supporting cell goes, in authored order, and which way it opens. */
const SLOTS = [
  { left: HERO_W + CHANNEL, top: 0, side: 'bottom' as const, align: 'left' as const },
  { left: HERO_W + CHANNEL + CELL_W + GAP, top: 0, side: 'bottom' as const, align: 'right' as const },
  { left: HERO_W + CHANNEL, top: CELL_H + GAP, side: 'top' as const, align: 'left' as const },
  {
    left: HERO_W + CHANNEL + CELL_W + GAP,
    top: CELL_H + GAP,
    side: 'top' as const,
    align: 'right' as const,
  },
]

export function MetricLed({ items, caption, className = '' }: FeaturesFigureProps) {
  const { hero, rest, all, problems } = resolveFeatures({ items })

  /*
    A SET WITH NO HERO STILL HAS TO DRAW. No hero is legal input, so the first
    item leads by default rather than the panel sitting empty. What is NOT legal
    is printed under the figure instead of drawn silently.
  */
  const lead = hero ?? all[0]
  const others = hero ? rest : all.slice(1)

  /*
    BEATS COME FROM `items` AND NEVER FROM STATE, so the step count the slide
    registers with the deck is stable for as long as the slide is up.

    Beat 0 is free (`useBeats` does not claim it) and it belongs to the hero: the
    slide arrives with its own headline number already on screen rather than on an
    empty stage that reads as a figure which failed to render. Then one supporting
    number per click in authored order, and the caption last. The divider rides
    beat 1 rather than taking a beat of its own, because a click that draws
    nothing but a hairline is a click the presenter reads as a dead deck.
  */
  const CAPTION_AT = 1 + Math.min(others.length, SLOTS.length)
  const shown = useBeats(CAPTION_AT + 1)

  return (
    <figure className={`relative mx-auto ${className}`} style={{ width: W, height: H }}>
      {/* THE ONE PIECE OF STRUCTURE, and it is geometry only. Every word in this
          figure is a DOM element, per content rule 17: an `<svg>` is a single
          rectangle to all three harnesses, so `<text>` labels can overlap and
          still pass every sweep. Session 4 shipped that twice. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0"
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
      >
        <FcEdgeDraw
          d={`M ${HERO_W + CHANNEL / 2} 8 V ${GRID_H - 8}`}
          at={1}
          shown={shown[1]}
          stroke={colors.line}
          width={1.5}
        />
      </svg>

      {lead && (
        <FcNodeIn
          at={0}
          shown={shown[0]}
          className="absolute"
          style={{ left: 0, top: 0, width: HERO_W, height: GRID_H }}
        >
          <MetricPanel item={lead} hero side="bottom" align="left" />
        </FcNodeIn>
      )}

      {others.slice(0, SLOTS.length).map((item, i) => {
        const slot = SLOTS[i]
        return (
          <FcNodeIn
            key={item.id}
            at={i + 1}
            shown={shown[i + 1]}
            className="absolute"
            style={{ left: slot.left, top: slot.top, width: CELL_W, height: CELL_H }}
          >
            <MetricPanel item={item} hero={false} side={slot.side} align={slot.align} />
          </FcNodeIn>
        )
      })}

      {caption && (
        <FcEdgeLabel
          at={CAPTION_AT}
          shown={shown[CAPTION_AT]}
          className="absolute block text-center text-body-sm"
          style={{ left: 0, top: CAPTION_Y, width: W, color: colors.body }}
        >
          {caption}
        </FcEdgeLabel>
      )}

      {/*
        CONTRACT VIOLATIONS ARE PRINTED, NOT SWALLOWED. `resolveFeatures` knows
        about two heroes, seven features, or an item with neither body nor
        outcome, and a figure that quietly draws the first five of seven is worse
        than one that says what it dropped. With valid input this element is not
        in the DOM at all, so no harness ever measures it.
      */}
      {problems.length > 0 && (
        <div
          className="absolute left-0 top-0 z-[70] w-full rounded-card px-4 py-2 text-[11.5px] leading-[1.4]"
          style={{ background: `${colors.danger}14`, color: colors.danger }}
        >
          {problems.map((p) => (
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
 * ONE FEATURE, NUMBER FIRST.
 *
 * The hero and the supporting cells differ in TYPE SCALE and in what they show,
 * not only in area: a hero that is a small cell scaled up reads as a zoom rather
 * than as a hierarchy. The hero is the only panel with a fill and the only one
 * that carries its `outcome`, because the outcome is the claim the slide is
 * actually making and five of them is the flat grid again.
 *
 * The hover pattern is copied exactly from `BentoGrid` and `AlternatingRows`:
 * `fc-node fc-node--hoverable` for the 160ms CSS lift (gated behind
 * `hover: hover` so a tap cannot leave a panel stuck raised), the popover in
 * `AnimatePresence` so it is never in the DOM unless open, and the z-index that
 * lets it paint over its neighbours living on `.fc-node-slot`, which `FcNodeIn`
 * puts on the wrapper. This element's parent animates `transform`, and a
 * transformed element creates a stacking context that no `z-index` in here can
 * escape.
 */
function MetricPanel({
  item,
  hero,
  side,
  align,
}: {
  item: FeatureItem
  hero: boolean
  /** Which way the popover opens, so a top row does not push off the stage. */
  side: 'top' | 'bottom'
  /** Which edge it leans on, so it opens inward. */
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
        className={`fc-node flex h-full w-full flex-col justify-center rounded-card px-5 ${
          hasDetail ? 'fc-node--hoverable' : ''
        }`}
        style={
          hero
            ? {
                /* Tint over an opaque white base, never a bare translucent fill:
                   a wash alone lets the slide read straight through the panel,
                   and the hero is the one panel that must not look like a hole. */
                background: `linear-gradient(${colors.brand}0f, ${colors.brand}0f), ${colors.white}`,
                border: `2px solid ${colors.brand}`,
                boxShadow: `0 10px 34px -14px ${colors.brand}4d`,
              }
            : {
                /* NO BORDER AND NO FILL on the supporting side. The whole
                   argument is that the numbers carry, and four outlined boxes
                   put four rectangles in front of them. */
                background: 'transparent',
              }
        }
        aria-describedby={open ? id : undefined}
      >
        {/* THE FIGURE, at display scale, in the one accent this figure spends. */}
        <MetricSlot item={item} hero={hero} />

        <span
          className={`block font-heading font-bold ${
            hero ? 'mt-3 text-[22px] leading-[1.2]' : 'mt-2 text-[14px] leading-[1.25]'
          }`}
          style={{ color: colors.ink }}
        >
          {Icon && (
            <span
              className="mr-2 inline-grid h-[18px] w-[18px] shrink-0 translate-y-[2px] place-items-center rounded-md align-baseline"
              style={{ background: `${colors.brand}1a`, color: colors.brand }}
            >
              <Icon width={11} height={11} />
            </span>
          )}
          {item.label}
        </span>

        {item.body && (
          <span
            className={`block ${
              hero ? 'mt-1 text-[14px] leading-[1.4]' : 'mt-[3px] text-[11.5px] leading-[1.35]'
            }`}
            style={{ color: colors.body }}
          >
            {item.body}
          </span>
        )}

        {/* The outcome is the hero's alone, and set as a pill so it reads as a
            different KIND of statement rather than as a third line of prose. */}
        {hero && item.outcome && (
          <span
            className="mt-2 inline-block self-start rounded-pill px-2.5 py-1 text-[13px] font-semibold leading-[1.35]"
            style={{ background: colors.brand, color: colors.white }}
          >
            {item.outcome}
          </span>
        )}

        {/* The room cannot hover a projector, so the dot is the only way anyone
            watching knows there is a second layer here at all. */}
        {hasDetail && (
          <span
            aria-hidden
            className="fc-node__more absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full"
            style={{ background: hero ? colors.brand : `${colors.muted}99` }}
          />
        )}
      </div>

      {/*
        THE POPOVER IS NEVER IN THE DOM UNLESS IT IS OPEN. `qa.mjs`,
        `video-safe.mjs` and `align-check.mjs` measure static rectangles, so a
        panel parked at `opacity: 0` is reported as overflowing the frame on every
        single run. It also keeps `detail` honest: the slide is complete without
        it, because the room cannot reach it.
      */}
      <AnimatePresence>
        {open && item.detail && (
          <motion.span
            id={id}
            role="tooltip"
            className="pointer-events-none absolute z-30 block w-[290px] rounded-card border bg-white px-3.5 py-3 text-left text-[12.5px] leading-snug shadow-float"
            style={{
              color: colors.body,
              borderColor: colors.line,
              [side === 'top' ? 'bottom' : 'top']: 'calc(100% + 10px)',
              [align]: 8,
              /* Scales from the corner nearest the panel, so it reads as coming
                 out of it rather than appearing beside it. */
              transformOrigin: `${side === 'top' ? 'bottom' : 'top'} ${align}`,
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

/**
 * THE METRIC, OR AN HONEST ADMISSION THAT THERE ISN'T ONE.
 *
 * A fixed-height box either way, which is what keeps the padding arithmetic in
 * the doc comment true for a set where only some items carry a number.
 *
 * The fallback is a drawn bar rather than a dash CHARACTER, for two reasons: the
 * repo bans a spaced em dash in rendered copy, and a hyphen at 34px reads as a
 * minus sign in a field of numerals. It is muted, unbold and slightly ugly on
 * purpose. A metric-led layout whose figures are invented is worse than no
 * figure at all, so this is the one place the variant is allowed to look bad.
 */
function MetricSlot({ item, hero }: { item: FeatureItem; hero: boolean }) {
  const h = hero ? SLOT.hero : SLOT.cell

  if (!item.metric) {
    return (
      <span className="flex flex-col justify-end" style={{ height: h }}>
        <span
          aria-hidden
          className="block rounded-full"
          style={{ width: hero ? 56 : 34, height: 3, background: colors.muted }}
        />
        <span
          className={`mt-2 block ${hero ? 'text-[14px]' : 'text-[11px]'} leading-[1.3]`}
          style={{ color: colors.muted }}
        >
          no figure for this one
        </span>
      </span>
    )
  }

  return (
    <span className="flex flex-col justify-end" style={{ height: h }}>
      <span
        className={`block font-heading font-bold tabular-nums ${
          hero ? 'text-[88px] leading-[1]' : 'text-[34px] leading-[1]'
        }`}
        style={{ color: colors.brand }}
      >
        {item.metric.value}
      </span>
      {item.metric.unit && (
        <span
          className={`block ${hero ? 'mt-1 text-[14px]' : 'mt-[2px] text-[11px]'} font-semibold uppercase leading-[1.3] tracking-wide`}
          style={{ color: colors.muted }}
        >
          {item.metric.unit}
        </span>
      )}
    </span>
  )
}
