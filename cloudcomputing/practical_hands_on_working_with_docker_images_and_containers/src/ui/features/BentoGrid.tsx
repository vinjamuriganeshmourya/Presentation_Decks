import { useId, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { colors } from '@/design/tokens'
import { iconByName } from '@/ui/icons'
import { E, c4 } from '@/ui/figureTiming'
import { FcEdgeLabel, FcNodeIn, useBeats } from '@/ui/figures/motion'
import { resolveFeatures, type FeatureItem, type FeaturesFigureProps } from './featuresFigure'

/**
 * BENTO GRID — the modular grid, with one tile that actually leads.
 *
 * THE ARGUMENT
 *
 * A features slide is a set, not a sequence, so the form is a grid. The kit's
 * `CardGrid` already draws one, and the user's verdict on it was "All cards
 * having same design, it is not visually appealing". That is not a taste
 * complaint, it is a structural one, and established practice says the same
 * thing from the other end: a modular grid whose cells are all one size defeats
 * the point of a modular grid. Nothing leads, so the eye is given no door to
 * enter through and reads the tiles in whatever order they happen to be in.
 *
 * So the tiles here are three different shapes, and the difference carries
 * meaning rather than decoration. The `hero` gets a tile of exactly twice the
 * area of the largest of the others, and it is the only tile that shows its
 * `outcome`, because the outcome is why anyone is looking at the slide. One tall
 * tile stands beside it, three short ones run underneath, and every one of them
 * is a real box with a real border rather than a cell in a spreadsheet.
 *
 * WORST AT: A SET WITH NO LEADER, AND ANY COUNT THAT IS NOT FIVE.
 *
 * The layout is authored for one hero plus four supporting tiles, and it says so
 * rather than pretending otherwise: `SLOTS` below has exactly four entries and
 * anything past them is not drawn. Five equally important capabilities are the
 * case this variant handles worst, because it will still promote one of them to
 * a double-size tile and the room will read a hierarchy the content does not
 * have. When every feature genuinely matters the same amount, the honest answer
 * is a flat grid and this is the wrong figure. It is also poor at long copy: the
 * three bottom tiles are 356px wide and hold about one line of body each, so a
 * body that wraps to three lines eats the padding floor before it eats the box.
 *
 * GEOMETRY
 *
 * A fixed 1100px stage on a 1280x720 slide, three columns of 356px on a 16px
 * gutter (356 * 3 + 16 * 2 = 1100 exactly, so no column carries a rounding
 * remainder). The hero spans two of those columns, 728px, which is what makes
 * its area exactly twice the tall tile beside it rather than "bigger".
 *
 * Row heights are the padding floor, not a look. `px-4 py-3.5` declares 16 and
 * 14, and what a card SHOWS is `(box height - content height) / 2`, so a
 * declared value is worth nothing once the content outgrows the box. Sized
 * against the fixture's worst case, a two-line 15px label ("Plain files on
 * disk") over a two-line 12px body, which stacks to about 104px:
 *
 *   top row    178px   hero content ~119px  ->  ~29px real padding
 *                      tall tile   ~104px  ->  ~37px real padding
 *   bottom row 144px   short tile  ~104px  ->  ~20px real padding
 *
 * The floor is 12px and the worst case here is 20, so a body can gain a line
 * anywhere in the figure without the padding going to zero. The sibling
 * flow-chart lab shipped four cards at 0px and one at -7px, all of them
 * declaring 12, which is why these numbers are written down instead of eyeballed.
 */

const W = 1100
const GAP = 16
const COL = (W - GAP * 2) / 3 /* 356 */
const TOP_H = 178
const BOT_H = 144
const GRID_H = TOP_H + GAP + BOT_H /* 338 */

/**
 * The hover popover's own duration, and it is deliberately NOT one of `T`'s.
 *
 * `T` is the explanatory tier: the figure assembles at 520ms because it is read
 * once, from the back of a room. A hover is the opposite case. The presenter
 * triggers it on purpose, repeatedly, and is waiting for the answer, so it takes
 * the `animate` skill's UI numbers. 520ms here would feel broken. The lift
 * itself is a CSS transition in `index.css` and is not written in this file.
 */
const POPOVER = 0.18

/** Where a tile that is not the hero goes, in authored order. */
const SLOTS = [
  /* Tall, beside the hero. Shares the hero's row, so the top of the figure is
     one unbroken band and the eye is not asked to step down mid-row. */
  { left: (COL + GAP) * 2, top: 0, width: COL, height: TOP_H, side: 'bottom' as const },
  { left: 0, top: TOP_H + GAP, width: COL, height: BOT_H, side: 'top' as const },
  { left: COL + GAP, top: TOP_H + GAP, width: COL, height: BOT_H, side: 'top' as const },
  { left: (COL + GAP) * 2, top: TOP_H + GAP, width: COL, height: BOT_H, side: 'top' as const },
]

type TileSize = 'hero' | 'tall' | 'short'

export function BentoGrid({ items, caption, className = '' }: FeaturesFigureProps) {
  const { hero, rest, all, problems } = resolveFeatures({ items })

  /*
    A SET WITH NO HERO STILL HAS TO DRAW. `resolveFeatures` reports "no hero"
    nowhere, because no hero is legal input, so the first item leads by default
    and the tile shapes stay honest. What is NOT legal is reported below the
    figure rather than drawn silently.
  */
  const lead = hero ?? all[0]
  const others = hero ? rest : all.slice(1)

  /*
    BEATS ARE DERIVED FROM `items`, NEVER FROM STATE, so the number of steps the
    slide registers with the deck is stable for as long as the slide is up. Beat
    0 is free (`useBeats` does not claim it) and it belongs to the hero: the
    slide arrives with the thing it is about already on screen, rather than on an
    empty stage that reads as a figure which failed to render. Then one tile per
    click in authored order, and the caption last. Every beat changes something,
    so there is no click that leaves the presenter wondering if the deck is dead.
  */
  const CAPTION_AT = 1 + others.length
  const shown = useBeats(CAPTION_AT + 1)

  const probY = GRID_H + 10
  const captionY = GRID_H + 12 + (problems.length ? 26 : 0)
  const H = captionY + 24

  return (
    <figure className={`relative mx-auto ${className}`} style={{ width: W, height: H }}>
      {lead && (
        <FcNodeIn
          at={0}
          shown={shown[0]}
          className="absolute"
          style={{ left: 0, top: 0, width: COL * 2 + GAP, height: TOP_H }}
        >
          <Tile item={lead} size="hero" side="bottom" />
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
            style={{ left: slot.left, top: slot.top, width: slot.width, height: slot.height }}
          >
            <Tile item={item} size={slot.height === TOP_H ? 'tall' : 'short'} side={slot.side} />
          </FcNodeIn>
        )
      })}

      {/*
        CONTRACT VIOLATIONS ARE PRINTED, NOT SWALLOWED. `resolveFeatures` knows
        about two heroes, seven features, or an item with neither body nor
        outcome, and a figure that quietly draws the first four of seven is worse
        than one that says what it dropped. This strip only exists when there is
        something to say, so it costs the valid case nothing.
      */}
      {problems.length > 0 && (
        <div
          className="absolute text-[11.5px] leading-[1.4]"
          style={{ left: 0, top: probY, width: W, color: colors.danger }}
        >
          {problems.join('. ')}
        </div>
      )}

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
    </figure>
  )
}

/**
 * ONE TILE. Three sizes, one padding scale, one hover.
 *
 * The sizes differ in TYPE SCALE and in what they show, not only in area. A hero
 * that is a short tile scaled up is a short tile scaled up, and the room reads
 * the zoom rather than the hierarchy.
 */
function Tile({ item, size, side }: { item: FeatureItem; size: TileSize; side: 'top' | 'bottom' }) {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()
  const id = useId()
  const Icon = item.icon ? iconByName[item.icon] : null
  const isHero = size === 'hero'
  const hasDetail = Boolean(item.detail)

  return (
    <div
      className="relative h-full w-full"
      onPointerEnter={() => hasDetail && setOpen(true)}
      onPointerLeave={() => setOpen(false)}
    >
      <div
        /*
          `fc-node` and `fc-node--hoverable` are the kit's existing hover pair in
          `index.css`: a 160ms CSS transition on `transform` and `box-shadow`,
          gated behind `hover: hover` so a tap on a touch device cannot leave a
          tile stuck lifted. A CSS transition rather than framer because it
          retargets from wherever it is when the pointer leaves; keyframes and JS
          both restart from zero, which is what makes a fast sweep across a row
          look broken.
        */
        className={`fc-node flex h-full w-full flex-col rounded-card px-4 py-3.5 ${
          hasDetail ? 'fc-node--hoverable' : ''
        } ${isHero ? 'justify-center gap-2' : 'justify-center gap-1.5'}`}
        style={
          isHero
            ? {
                /*
                  Two background layers, tint over an opaque white base, never a
                  bare translucent fill. A wash alone lets whatever sits behind
                  the figure read straight through the tile, and the hero is the
                  one tile that must not look like a hole.
                */
                background: `linear-gradient(${colors.brand}0f, ${colors.brand}0f), ${colors.white}`,
                border: `2px solid ${colors.brand}`,
                boxShadow: `0 10px 34px -14px ${colors.brand}4d`,
              }
            : {
                background: colors.white,
                border: `1px solid ${colors.line}`,
                boxShadow: `0 6px 24px -10px ${colors.brandDeep}29`,
              }
        }
        aria-describedby={open ? id : undefined}
      >
        {Icon && (
          <span
            className={`grid shrink-0 place-items-center rounded-lg ${
              isHero ? 'h-[26px] w-[26px]' : 'h-[22px] w-[22px]'
            }`}
            style={{
              background: isHero ? colors.brand : `${colors.brand}1a`,
              color: isHero ? colors.white : colors.brand,
            }}
          >
            <Icon width={isHero ? 15 : 13} height={isHero ? 15 : 13} />
          </span>
        )}

        <span
          className={
            isHero
              ? 'block font-heading text-[20px] font-bold leading-[1.2]'
              : 'block font-heading text-[15px] font-bold leading-[1.25]'
          }
          style={{ color: colors.ink }}
        >
          {item.label}
        </span>

        {item.body && (
          <span
            className={isHero ? 'block text-[14px] leading-[1.45]' : 'block text-[12px] leading-[1.4]'}
            style={{ color: colors.body }}
          >
            {item.body}
          </span>
        )}

        {/*
          THE OUTCOME IS THE HERO'S ALONE, AND THAT IS THE POINT OF THE SIZE
          DIFFERENCE. "What it is" belongs on every tile; "what it buys you" is
          the line the slide is actually making, and putting it on all five turns
          it back into a flat grid with two lines per cell. It is set as a pill
          rather than a third paragraph so it reads as a different KIND of
          statement, not as more description.
        */}
        {isHero && item.outcome && (
          <span
            className="mt-0.5 inline-block self-start rounded-pill px-2.5 py-1 text-[12.5px] font-semibold leading-[1.35]"
            style={{ background: colors.brand, color: colors.white }}
          >
            {item.outcome}
          </span>
        )}

        {/* A hover affordance the room can see without a pointer. Without it the
            detail is a secret only the person holding the mouse knows about. */}
        {hasDetail && (
          <span
            aria-hidden
            className="fc-node__more absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full"
            style={{ background: isHero ? colors.brand : `${colors.muted}99` }}
          />
        )}
      </div>

      {/*
        THE POPOVER IS NEVER IN THE DOM UNLESS IT IS OPEN.

        `qa.mjs`, `video-safe.mjs` and `align-check.mjs` measure static DOM
        rectangles. A panel parked at `opacity: 0` gets measured, gets reported as
        overflowing the frame or intruding on the instructor-video rectangle, and
        is wrong every single run. `AnimatePresence` keeps it out of the tree.

        It also means the slide is complete without it: the room cannot hover a
        projector, so `detail` is the presenter's aside and never the teaching.
      */}
      <AnimatePresence>
        {open && item.detail && (
          <motion.span
            id={id}
            role="tooltip"
            className="pointer-events-none absolute left-1/2 z-30 block w-[268px] rounded-card border border-line bg-white px-3.5 py-3 text-left text-[12.5px] leading-snug shadow-float"
            style={{
              color: colors.body,
              [side === 'top' ? 'bottom' : 'top']: 'calc(100% + 10px)',
              /* Scales from the edge nearest the tile, so it reads as coming OUT
                 of the tile rather than appearing beside it. */
              transformOrigin: side === 'top' ? 'bottom center' : 'top center',
            }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateX(-50%) scale(0.96)' }}
            animate={{ opacity: 1, transform: 'translateX(-50%) scale(1)' }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateX(-50%) scale(0.98)' }}
            transition={{ duration: POPOVER, ease: c4(E.out) }}
          >
            <span
              className="mb-1 block font-heading text-[11px] font-bold uppercase tracking-wide"
              style={{ color: colors.brand }}
            >
              {item.label}
            </span>
            {item.detail as ReactNode}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
