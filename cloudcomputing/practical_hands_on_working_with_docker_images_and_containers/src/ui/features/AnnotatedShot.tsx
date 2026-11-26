import { useId, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { colors } from '@/design/tokens'
import { E, c4 } from '@/ui/figureTiming'
import { FcEdgeDraw, FcEdgeLabel, FcNodeIn, useBeats } from '@/ui/figures/motion'
import { resolveFeatures, type FeatureItem, type FeaturesFigureProps } from './featuresFigure'

/**
 * ANNOTATED SHOT — the product itself, with each claim pinned to the region of
 * the screen that proves it.
 *
 * THE ARGUMENT
 *
 * Every other variant in this lab describes the software. This one shows it. For
 * a technical audience that is not a small difference: an icon and a sentence
 * asserting "live data, not fixtures" is a claim, and the same words with a
 * leader line landing on the product row Django actually returned is evidence.
 * The established practice around annotated interface figures is the shape of
 * this whole variant, and it is three rules rather than one:
 *
 *   1. **Annotate only when the interface cannot explain itself.** The pins are
 *      not decoration and there are three of them, not nine. A capture where
 *      every element wears a numbered dot teaches the room to ignore numbered
 *      dots, which is the same reason `Shot`'s own `highlight` prop is singular.
 *   2. **Crop to the relevant workflow.** The capture arrives cropped. Nothing in
 *      this component crops, scales or retouches, because hard rule 11 says a
 *      capture that is wrong gets captured again rather than edited.
 *   3. **Let the real UI carry the weight.** The screenshot is 620x360 of a
 *      1100x400 stage and it lands FIRST, on beat 0, before a single claim is
 *      made about it. The room looks at the thing, then at what is being said
 *      about the thing.
 *
 * The callout cards are a column on the right rather than floating over the
 * capture. A card sitting on top of the interface hides the pixels it is talking
 * about, and on a projector a white card over a white product page has no edge at
 * all. So the pin is on the image, the words are off it, and the correspondence is
 * carried twice: by the NUMBER, which survives any distance, and by a short
 * leader line, which is what makes the number worth looking up.
 *
 * IT IS THE ONE VARIANT THAT CANNOT SHARE THE LAB'S FIXTURE, AND THAT IS ITS COST
 *
 * Every other candidate here renders `noteAppFeatures`, so picking a winner is a
 * rename. This one cannot. It pins claims to regions of a real capture, so its
 * features have to be features OF THE THING IN THE PICTURE, and the note app has
 * no picture: it is a deliberate stand-in, hard rule 11 forbids inventing a
 * screenshot of it, and hard rule 8 forbids annotating an unrelated capture with
 * unrelated claims. So it renders `storefrontFeatures` instead, which is a real
 * screen from deployment session 1.
 *
 * **That is this variant's main cost rather than a gap in the lab.** It cannot be
 * judged like for like against the other five, and it is judged only on whether
 * the form is worth having. And the cost generalises past the lab: the variant is
 * UNUSABLE anywhere no real capture of the actual product exists. There is no
 * degraded mode, no mockup, no "close enough" screenshot of something similar,
 * because both of the rules above forbid exactly those. A features slide about
 * software nobody has run yet has to use one of the other five.
 *
 * WHAT ELSE IT IS WORST AT
 *
 *   - **Anything abstract.** "Offline first" has no pixels. A capability that is
 *     an architectural property rather than a visible element has nowhere to pin,
 *     and a pin planted near it anyway is the dishonest version of this figure.
 *   - **Ageing.** The capture is a version of a real product, so the figure goes
 *     stale the first time that screen is redesigned, and a stale capture on a
 *     slide is worse than no capture. Nothing else in this lab can rot.
 *   - **Room for words.** Each card is 440x96 and holds one line of label, one of
 *     body and one of outcome. There is no `metric`, no `without`, and a wrapped
 *     body eats the padding floor (see GEOMETRY). The capture takes the space.
 *   - **Legibility from the back.** The capture is shown at 620px wide, so 13px
 *     UI text inside it renders around 8px on the stage. The pins have to land on
 *     regions the room can SEE at that size, which is why they are on product
 *     images, titles and prices rather than on a form label.
 *   - **More than about four claims.** Leader lines start crossing, and a
 *     crossed leader is read as pointing at the wrong thing.
 *
 * WHY IT DOES NOT USE THE KIT'S `Shot`
 *
 * `src/ui/Shot.tsx` is the right component for a capture on a normal slide and
 * the wrong one here, for two reasons that are both structural rather than
 * cosmetic. Its image is `h-auto w-full`, so the height follows the width and
 * cannot be pinned into a fixed 360px band of a fixed 400px stage, which is what
 * every harness in this lab measures. And its `highlight` is deliberately
 * SINGULAR, with a good argument attached: one box per capture, added only when
 * the crop alone does not put the claim under the eye. This variant needs n
 * pins, which is precisely the thing `Shot` declines to offer.
 *
 * What is copied from it is the part worth copying: the amber. `Shot` uses
 * `#F59E0B` for its box because amber reads as "look here" on both light and dark
 * captures and collides with neither the deck's blue nor terminal green. That is
 * `colors.warning`, and every pin, leader and number badge here is that token, so
 * a deck using both components marks captures in one colour.
 *
 * GEOMETRY, AND THE PADDING ARITHMETIC
 *
 * A fixed 1100x400 stage, absolutely positioned.
 *
 *   capture   left 0    top 0   620 x 360
 *   cards     left 660  width 440, three of 96 on a 16px gap = 320,
 *                       centred in the 360 band, so tops are 20, 132, 244
 *   caption   top 376
 *
 * 620x360 is 1.7222 and the capture is 1310x760, which is 1.7237. `object-contain`
 * in a fixed frame therefore letterboxes by about 0.15px on each side rather than
 * distorting, and PINS ARE POSITIONED AGAINST THAT RENDERED IMAGE BOX rather than
 * against the figure: a percentage of 620 and 360, so a change to the frame size
 * moves every pin with it and a change of capture at the same aspect needs no new
 * numbers.
 *
 * Card content, at 440 wide with `px-3.5` (14) and a 22px number badge on a 10px
 * gap, leaves a 380px text column. The fixture's longest strings set to one line
 * each in it ("One component per product" at 15px is about 197px, "The API sends a
 * number, React renders currency" at 12px is about 284px), so:
 *
 *   label    15px on 1.25   18.8
 *   gap                      3
 *   body     12px on 1.4    16.8
 *   gap                      4
 *   outcome  12px on 1.35   16.2
 *   ---------------------------------
 *   content                 58.8
 *
 * and the REAL vertical padding is (96 - 58.8) / 2 = 18.6px, against a floor of
 * 12. `py-3.5` DECLARES 14; what a box SHOWS is `(box height - content height) /
 * 2`, and the declared value silently becomes 0 or negative once the content
 * outgrows the box. The sibling flow-chart lab shipped four cards at 0px and one
 * at -7px, every one declaring 12px, and passed every harness the whole time.
 *
 * The 18.6 leaves 6.6px of slack, which is NOT a second line: one wrapped body
 * costs 16.8 and lands the real padding at 10.2px, under the floor. So the
 * constraint is one line per field, and that is the honest limit of this layout
 * rather than something to be fixed by nudging a number.
 */

const W = 1100
const H = 400

const IMG_W = 620
const IMG_H = 360

const COL_X = 660
const COL_W = W - COL_X /* 440 */
const CARD_H = 96
const CARD_GAP = 16

/** Pin diameter. Big enough to read from the back, small enough not to be the figure. */
const PIN = 26

/**
 * WHERE EACH CLAIM'S PIN GOES, AS A PERCENTAGE OF THE RENDERED IMAGE BOX.
 *
 * Keyed by feature `id` and read off the capture itself rather than guessed. The
 * capture is the Nxt Trendz storefront at `localhost:3000/products`, a React grid
 * reading live rows from Django: a page heading, then three product cards, each
 * an image over a title, a brand and a price.
 *
 *   live   20.5 / 74     just above the first product's title, not on it. The claim is that
 *                        every card is a row the API returned, and a product
 *                        NAME is the part of the screen that could only have come
 *                        from the database. Pinning the grid as a whole would
 *                        point at a layout, which is the next claim's job.
 *   grid   82.4 / 54.5   the THIRD product image. "One component per product" is
 *                        a claim about repetition, and repetition is only visible
 *                        at the far end of it: the third identical card proves
 *                        there is one component, the first proves nothing.
 *   price  38.5 / 93.7   immediately left of the middle card's "Rs 13499.00/-". Currency symbol,
 *                        separators and the trailing "/-" are all things the
 *                        serializer's plain decimal does not have, so this is
 *                        exactly where client-side formatting is visible.
 *
 * An `id` with no entry here is a PROBLEM and is reported, not parked at 50/50:
 * a pin in the middle of the capture looks entirely deliberate and would point at
 * whatever happened to be there.
 */
/*
  A PIN POINTS AT THE EVIDENCE. IT MUST NOT COVER IT.

  The first pass put `live` at 20.6/82.6 and `price` at 45.3/93.7, dead centre on
  the product title and the price string. Both are the exact text that proves
  their claim, and a 26px disc sat on top of them: the price read "Rs [3]0/-" and
  the title read "Front L[1] Machine". A pin that occludes its own evidence is
  worse than no pin, because the room is told to look at something and then it is
  hidden.

  Both moved to sit BESIDE the string rather than on it, close enough that the
  pairing is unambiguous and clear of the glyphs. `grid` never moved: it sits on
  a product photograph, where there is nothing to obscure.
*/
const PIN_BY_ID: Record<string, { left: number; top: number }> = {
  live: { left: 20.5, top: 74 },
  grid: { left: 82.4, top: 54.5 },
  price: { left: 38.5, top: 93.7 },
}

/**
 * The hover popover's own duration, and deliberately NOT one of `T`'s.
 *
 * `T` is the explanatory tier: the capture and the pins land at 520ms because the
 * figure is read once from the back of a room. A hover is the opposite case. The
 * presenter triggers it on purpose, repeatedly, and is waiting for the answer, so
 * it takes the `animate` skill's UI numbers, and 520ms here would feel broken.
 * The lift itself is a CSS transition in `index.css`, not written in this file.
 */
const POPOVER = 0.18

export function AnnotatedShot({
  items,
  caption,
  className = '',
  src,
  alt = 'The product screen the claims beside it are pinned to',
}: FeaturesFigureProps & { src: string; alt?: string }) {
  const { all, hero, problems } = resolveFeatures({ items })

  const missing = all.filter((i) => !PIN_BY_ID[i.id]).map((i) => i.id)
  const allProblems = [
    ...problems,
    ...(missing.length
      ? [`no pin position for ${missing.join(', ')}; nothing was drawn for them`]
      : []),
    ...(all.length > 4
      ? [`${all.length} pins on one capture; past four the leader lines cross`]
      : []),
  ]

  /* Only features that actually have somewhere to point are drawn. Reported
     above, never invented. */
  const pinned = all.filter((i) => PIN_BY_ID[i.id])

  /*
    CARDS ARE ORDERED DOWN THE COLUMN BY THEIR PIN'S HEIGHT, NOT BY AUTHORED
    ORDER, AND THE NUMBER IS WHAT KEEPS THE AUTHORED ORDER.

    An annotated figure is read by number, so position is free to solve the one
    problem the number cannot: if the card for a pin near the bottom of the
    capture sits at the top of the column, its leader crosses the leader of a pin
    above it, and a crossed leader is read as pointing at the wrong region. The
    numbers still run in authored order, so the hero is still 1 and the reveal
    still leads with it.
  */
  const slotted = [...pinned].sort((a, b) => PIN_BY_ID[a.id].top - PIN_BY_ID[b.id].top)
  const slotOf = (item: FeatureItem) => slotted.indexOf(item)

  const stackH = pinned.length * CARD_H + Math.max(0, pinned.length - 1) * CARD_GAP
  const stackTop = Math.max(0, (IMG_H - stackH) / 2)
  const cardTop = (slot: number) => stackTop + slot * (CARD_H + CARD_GAP)
  const cardMid = (slot: number) => cardTop(slot) + CARD_H / 2

  const pinXY = (item: FeatureItem) => {
    const p = PIN_BY_ID[item.id]
    return { x: (p.left / 100) * IMG_W, y: (p.top / 100) * IMG_H }
  }

  /*
    BEAT 0 IS THE SCREENSHOT, AND IT IS THE ONLY ORDER THIS FIGURE CAN HAVE.

    The whole argument is that the room sees the real thing before anything is
    claimed about it, so the capture is the slide's base content and costs no
    click. Then one beat per pin, in authored order so the hero's claim is made
    first, and each beat lands its pin, its leader and its card together: they
    are one statement, and splitting them into two clicks would put a numbered
    dot on the capture with nothing anywhere to say what it means.

    Derived from `items`, never from state, so the step count the slide registers
    with the deck is stable for as long as the slide is up, and every beat changes
    something so no click is dead.
  */
  const captionAt = 1 + pinned.length
  const shown = useBeats(caption ? captionAt + 1 : captionAt)
  const beatOf = (item: FeatureItem) => 1 + (hero ? [hero, ...all.filter((i) => i !== hero)] : all)
    .filter((i) => PIN_BY_ID[i.id])
    .indexOf(item)

  return (
    <figure className={`relative mx-auto ${className}`} style={{ width: W, height: H }}>
      {/* THE CAPTURE. A fixed frame plus `object-contain`, so the image is never
          stretched to fit and never cropped by the frame. */}
      <FcNodeIn
        at={0}
        shown={shown[0]}
        className="absolute"
        style={{ left: 0, top: 0, width: IMG_W, height: IMG_H }}
      >
        <div
          className="h-full w-full overflow-hidden rounded-card"
          style={{
            border: `1px solid ${colors.line}`,
            boxShadow: `0 14px 40px -18px ${colors.brandDeep}3d`,
            background: colors.white,
          }}
        >
          <img
            src={src}
            alt={alt}
            draggable={false}
            className="block h-full w-full select-none object-contain"
          />
        </div>
      </FcNodeIn>

      {/* LEADER LINES. One aria-hidden SVG layer, geometry only: every word in
          this figure is a DOM element, per content rule 17. An `<svg>` is a
          single rectangle to all three harnesses, so `<text>` labels can overlap
          and still pass every sweep, which shipped twice in session 4. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0"
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
      >
        {pinned.map((item) => {
          const { x, y } = pinXY(item)
          const my = cardMid(slotOf(item))
          const dx = COL_X - x
          const dy = my - y
          const len = Math.max(1, Math.hypot(dx, dy))
          /* Starts clear of the pin's own circle and stops short of the card, so
             the line reads as a leader rather than as a spoke welded to both. */
          const sx = x + (dx / len) * (PIN / 2 + 3)
          const sy = y + (dy / len) * (PIN / 2 + 3)
          const b = beatOf(item)
          return (
            <FcEdgeDraw
              key={item.id}
              d={`M ${sx.toFixed(1)} ${sy.toFixed(1)} L ${COL_X - 8} ${my}`}
              at={b}
              shown={shown[b]}
              stroke={colors.warning}
              width={item === hero ? 2 : 1.5}
            />
          )
        })}
      </svg>

      {/* THE PINS. Numbered, and positioned against the rendered image box.
          Rendered as siblings of the frame rather than inside it, because the
          frame clips its overflow and a pin near an edge would be sliced. */}
      {pinned.map((item) => {
        const { x, y } = pinXY(item)
        const b = beatOf(item)
        return (
          <FcNodeIn
            key={`pin-${item.id}`}
            at={b}
            shown={shown[b]}
            className="absolute z-10"
            style={{ left: x - PIN / 2, top: y - PIN / 2, width: PIN, height: PIN }}
          >
            <span
              className="grid h-full w-full place-items-center rounded-full font-heading text-[13px] font-bold leading-none"
              style={{
                background: colors.warning,
                color: colors.ink,
                /* A white ring, because the pin has to hold its edge over
                   whatever pixels happen to be underneath it. */
                boxShadow: `0 0 0 2.5px ${colors.white}, 0 4px 12px -4px ${colors.brandDeep}66`,
              }}
            >
              {all.indexOf(item) + 1}
            </span>
          </FcNodeIn>
        )
      })}

      {/* THE CLAIMS. Off the capture, so nothing covers the evidence. */}
      {pinned.map((item) => {
        const slot = slotOf(item)
        const b = beatOf(item)
        return (
          <FcNodeIn
            key={`card-${item.id}`}
            at={b}
            shown={shown[b]}
            className="absolute"
            style={{ left: COL_X, top: cardTop(slot), width: COL_W, height: CARD_H }}
          >
            <ClaimCard
              item={item}
              number={all.indexOf(item) + 1}
              hero={item === hero}
              /* The top card opens downward and the rest upward, so a popover
                 never leaves the top of the stage, where the instructor-video
                 rectangle is. */
              side={slot === 0 ? 'bottom' : 'top'}
            />
          </FcNodeIn>
        )
      })}

      {caption && (
        <FcEdgeLabel
          at={captionAt}
          shown={shown[captionAt]}
          className="absolute block text-center text-body-sm"
          style={{ left: 0, top: 376, width: W, color: colors.body }}
        >
          {caption}
        </FcEdgeLabel>
      )}

      {/*
        CONTRACT VIOLATIONS ARE PRINTED, NOT SWALLOWED.

        `resolveFeatures` knows about two heroes, seven features, or an item with
        neither body nor outcome, and this variant adds the two failures only it
        can have: a feature with no pin position, and more pins than leader lines
        can carry without crossing. A figure that quietly drops the third claim
        looks perfect. With valid input this element is not in the DOM at all, so
        no harness ever measures it.
      */}
      {allProblems.length > 0 && (
        <div
          className="absolute z-[70] rounded-card px-4 py-2 text-[11.5px] leading-[1.4]"
          style={{ left: 0, top: 0, width: W, background: `${colors.danger}14`, color: colors.danger }}
        >
          {allProblems.map((p) => (
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
 * ONE CLAIM, IN A CARD, WITH THE HOVER.
 *
 * The number is the load-bearing element and it is set as a filled amber badge in
 * the same token as its pin, because the badge and the pin ARE the connection
 * once the leader line has been crossed by the eye. The label, body and outcome
 * are then ordinary text: the capture is the loud part of this figure and a card
 * competing with it would be two figures.
 */
function ClaimCard({
  item,
  number,
  hero,
  side,
}: {
  item: FeatureItem
  number: number
  hero: boolean
  /** Which way the popover opens, so it never pushes off the stage. */
  side: 'top' | 'bottom'
}) {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()
  const id = useId()
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
          card stuck lifted. CSS rather than framer because a CSS transition
          retargets from wherever it currently is when the pointer leaves, and
          keyframes and JS both restart from zero, which is what makes a fast
          sweep down a column look broken.
        */
        className={`fc-node flex h-full w-full items-center gap-2.5 rounded-card px-3.5 py-3.5 ${
          hasDetail ? 'fc-node--hoverable' : ''
        }`}
        style={{
          background: colors.white,
          border: `${hero ? 2 : 1}px solid ${hero ? colors.brand : colors.line}`,
          boxShadow: `0 6px 24px -10px ${colors.brandDeep}29`,
        }}
        aria-describedby={open ? id : undefined}
      >
        <span
          aria-hidden
          className="grid h-[22px] w-[22px] shrink-0 place-items-center self-start rounded-full font-heading text-[12px] font-bold leading-none"
          style={{ background: colors.warning, color: colors.ink }}
        >
          {number}
        </span>

        <span className="min-w-0 flex-1">
          <span
            className="block font-heading text-[15px] font-bold leading-[1.25]"
            style={{ color: colors.ink }}
          >
            {item.label}
          </span>
          {item.body && (
            <span className="mt-[3px] block text-[12px] leading-[1.4]" style={{ color: colors.body }}>
              {item.body}
            </span>
          )}
          {/*
            `body` is what the claim IS and `outcome` is what it BUYS, so the
            outcome is set in the brand rather than in body grey. It has to read
            as a different KIND of statement, not as a second description line,
            and there is no room here for a pill.
          */}
          {item.outcome && (
            <span
              className="mt-[4px] block text-[12px] font-semibold leading-[1.35]"
              style={{ color: colors.brand }}
            >
              {item.outcome}
            </span>
          )}
        </span>

        {/* A hover affordance the room can see without a pointer. Without it the
            detail is a secret only the person holding the mouse knows about. */}
        {hasDetail && (
          <span
            aria-hidden
            className="fc-node__more absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
            style={{ background: `${colors.brand}66` }}
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

        The z-index that lets it paint over its neighbours lives on
        `.fc-node-slot`, which `FcNodeIn` puts on the wrapper: this element's
        parent animates `transform`, and a transformed element creates a stacking
        context that a `z-index` in here can never escape.
      */}
      <AnimatePresence>
        {open && item.detail && (
          <motion.span
            id={id}
            role="tooltip"
            className="pointer-events-none absolute z-30 block w-[320px] rounded-card border bg-white px-3.5 py-3 text-left text-[12.5px] leading-snug shadow-float"
            style={{
              color: colors.body,
              borderColor: colors.line,
              [side === 'top' ? 'bottom' : 'top']: 'calc(100% + 10px)',
              right: 12,
              /* Scales from the edge nearest the card, so it reads as coming OUT
                 of the card rather than appearing beside it. */
              transformOrigin: `${side === 'top' ? 'bottom' : 'top'} right`,
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
