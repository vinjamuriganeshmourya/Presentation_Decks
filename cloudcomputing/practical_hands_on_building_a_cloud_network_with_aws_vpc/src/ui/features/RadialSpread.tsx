import { useId, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { colors } from '@/design/tokens'
import { iconByName } from '@/ui/icons'
import { E, c4 } from '@/ui/figureTiming'
import { FcArrowDefs, FcEdgeDraw, FcEdgeLabel, FcNodeIn, useBeats } from '@/ui/figures/motion'
import { resolveFeatures, type FeatureItem, type FeaturesFigureProps } from './featuresFigure'

/**
 * RADIAL SPREAD — one thing, reaching into many, with the reaching drawn.
 *
 * THE ARGUMENT
 *
 * "It does all of this" is a claim about BREADTH, and breadth is the one thing a
 * grid states without showing. Five equal cards say "here are five things"; they
 * leave the room to infer that all five come from the same place, which is the
 * entire point of the slide. A centre with spokes draws it: one origin, five
 * destinations, and the lines between them are the sentence.
 *
 * The motion is the argument too. A hub-and-spoke figure that arrives complete is
 * a picture of reach; the same figure with each spoke DRAWING outward is the act
 * of reaching. That is why every spoke is `FcEdgeDraw` (a real `pathLength`
 * trace, at `linear`, so the line reads as travelling rather than as an
 * entrance running out of energy) and never a fade.
 *
 * WHAT IT IS WORST AT
 *
 *   - **It has nowhere to put `body`.** A spoke card is 78px, which holds a label
 *     and one wrapped supporting line, and this variant spends that line on
 *     `outcome`, because "what each area gains" is what makes breadth an argument
 *     rather than a list. `body` moves into the hover popover, and the room
 *     cannot hover a projector. **So this is the wrong figure whenever the
 *     mechanism is the teaching**, and the right one whenever the coverage is.
 *   - **The centre is not in the contract.** `FeaturesFigureProps` has `items`
 *     and `caption` and no name for the thing they belong to, so the hub falls
 *     back to the count. See THE HUB below; it is a real gap, not a styling
 *     choice.
 *   - **Order.** Spokes have no sequence, and anything laid out on a ring will be
 *     read as a cycle by somebody. Never use it for steps.
 *   - **Alternatives.** Every spoke leaves the same centre, so they read as things
 *     it does, never as things you choose between.
 *   - **Three items.** A centre with three spokes is a lot of ceremony for a
 *     list, and with two it is a comparison drawn oddly.
 *
 * WHAT CAME FROM THE PYTHON SESSION'S VERSION, AND WHAT CHANGED
 *
 * `python_programming/programming_with_python/src/ui/RadialSpread.tsx` is the
 * original, written for one slide ("Python has applications in almost every
 * field"). This is that idea generalised onto the lab's shared contract.
 *
 * KEPT, because each was learned the hard way there:
 *
 *   - Spokes are SVG and carry NO text; every label is a DOM element. That file
 *     records why (content rule 17), and its own arc was found to be too wide only
 *     because a screenshot showed "Backend Development" cut in half while all
 *     three harnesses passed.
 *   - The arrowhead's placement lives on a static `<g>`, never on an animated
 *     element. framer-motion writes an inline `transform` every frame and that
 *     overrides an SVG `transform` attribute, which stacked all five arrowheads
 *     at the origin. Here it is `FcArrowDefs` plus the transparent second path
 *     inside `FcEdgeDraw`, which solves the same problem in the lab's own idiom.
 *   - The line stops SHORT of what it points at, so the arrowhead has air.
 *
 * CHANGED:
 *
 *   - **The hub prop is gone.** That version took `hub` and `hubLogo`; the shared
 *     contract has neither, and the whole point of the lab is that picking a
 *     winner is a rename at the call site. See THE HUB.
 *   - **Percentage layout became a fixed stage.** It scaled a 660x420 box with
 *     `pct()` and `aspectRatio`, so no real padding could be reasoned about. This
 *     is 1100x400 in absolute pixels for the same reason every box here is: a
 *     card's real padding is `(box - content) / 2`, and you cannot check that
 *     against a percentage.
 *   - **A fan became a ring.** Its spokes fanned across a narrow +/-44 degree arc
 *     from a left-hand hub, because 660px of width was all it had. 1100x400 fits
 *     a full ring on an ELLIPSE, which uses the whole stage and makes "in every
 *     direction" literal instead of "off to the right".
 *   - **`stepped` is gone and every part is a build step.** That version defaulted
 *     to auto-play and its `stepped` mode called `useReveal()` once per spoke.
 *     `useReveal()` in a loop does not work in this kit, and the lab's
 *     `useBeats(count)` is the fix.
 *   - **The ring, the pulse and the `E.pop` overshoot are gone.** Three ornaments
 *     per spoke are affordable when a figure plays itself once; they are noise
 *     when the presenter is pressing a key and waiting for an answer.
 *   - **Hover, weight and hero are new**, because the contract has them and that
 *     file's `Spoke` did not.
 *
 * THE HUB
 *
 * The contract names no subject, so the centre states the only thing it can know
 * for certain: how many capabilities are on the spokes. That is true of any
 * `items` array and invents nothing. **The honest fix is a `subject` field on
 * `FeaturesFigureProps`**, and it is deliberately not added here, because a lab
 * variant that quietly widens the shared contract stops being comparable with the
 * other five.
 *
 * GEOMETRY
 *
 * A fixed 1100x400 stage. The hub is an 80px-radius disc at (500, 190). Spokes
 * sit on an ellipse of rx 400 / ry 138 about that centre, which is the shape of
 * the space rather than a circle squashed into it, and the hero's rx is 1.13x so
 * its spoke is visibly the longest. Angles are `i * 360 / n` with the hero at 0
 * degrees, which puts the lead capability on the right, where the eye leaves the
 * hub.
 *
 * The cards are 256x78 and that number is the padding floor, not a taste. The
 * worst content is a 14px label on 1.25 (17.5) plus a 3px gap plus a 11.5px
 * outcome that wraps to two lines on 1.3 (30), which is 50.5px, so the REAL
 * vertical padding is (78 - 50.5) / 2 = 13.75px. `py-3.5` DECLARES 14px and a
 * declaration means nothing: what a box shows is `(box - content) / 2`, and the
 * sibling flow-chart lab shipped four cards at 0px and one at -7px, all of them
 * declaring 12px, all of them passing every harness. The hero card is 86px on the
 * same arithmetic at 16px / 12px type.
 *
 * With those numbers the lowest card ends at y=360, the highest starts at y=20,
 * and the caption sits at 376. Nothing on the ring reaches the hub: the two lower
 * cards start 12px below the disc and the two upper ones end 12px above it.
 */

const W = 1100
const H = 400
const CX = 500
const CY = 190
const HUB_R = 80
const RX = 400
const RY = 138
/** The hero's spoke is longer. Reach, drawn as reach. */
const HERO_RX = 1.13
const CARD_W = 256
const CARD_H = 78
const HERO_H = 86
/** The line stops this far short of the card it points at. */
const TIP_GAP = 8

const PAINT = {
  hero: colors.brand,
  spoke: colors.brand,
}

/**
 * Where a spoke's line has to stop.
 *
 * The ray from the hub to a card's centre does not hit the card square on, so a
 * fixed pull-back either buries the arrowhead inside the card or leaves it
 * floating in space. This is the standard slab test: walking back from the
 * centre along the ray, the boundary is whichever axis you leave first.
 */
function stopShortOf(
  cardX: number,
  cardY: number,
  halfW: number,
  halfH: number,
): { x: number; y: number } {
  const dx = cardX - CX
  const dy = cardY - CY
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const tx = Math.abs(ux) > 1e-6 ? halfW / Math.abs(ux) : Infinity
  const ty = Math.abs(uy) > 1e-6 ? halfH / Math.abs(uy) : Infinity
  const back = Math.min(tx, ty) + TIP_GAP
  return { x: cardX - ux * back, y: cardY - uy * back }
}

/**
 * ONE SPOKE'S CARD, WITH THE HOVER.
 *
 * The pattern is the flow-chart lab's `NodeShell`, copied deliberately rather
 * than imported, because that shell is sized for a 180px column and this is a
 * 256px card on a ring:
 *
 *   - `fc-node fc-node--hoverable` for the lift. That is a CSS transition in
 *     `index.css` at UI-tier speed, gated behind `hover: hover` so a tap does not
 *     leave a card stuck raised. The figure's own entrance is explanatory and
 *     twice as slow, on purpose; reusing 520ms on a hover feels broken.
 *   - The popover is framer, because it mounts and unmounts and needs an exit,
 *     and it is NEVER in the DOM unless open: all three harnesses measure static
 *     rectangles, and a panel parked at `opacity: 0` is reported as overflowing
 *     the frame every single run.
 *   - `transform-origin` faces the card, so it grows out of it.
 *
 * The z-index that lifts it over its neighbours belongs to `.fc-node-slot` on
 * `FcNodeIn`'s wrapper, because that wrapper animates `transform` and therefore
 * creates a stacking context nothing inside it can escape.
 */
function SpokeCard({
  item,
  hero,
  side,
}: {
  item: FeatureItem
  hero: boolean
  side: 'top' | 'bottom'
}) {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()
  const id = useId()
  const Icon = item.icon ? iconByName[item.icon] : null
  const hasDetail = Boolean(item.detail || item.body)

  return (
    <div
      className="relative h-full w-full"
      onPointerEnter={() => hasDetail && setOpen(true)}
      onPointerLeave={() => setOpen(false)}
    >
      <div
        className={`fc-node flex h-full w-full items-center gap-3 rounded-card px-4 py-3.5 ${
          hero ? 'shadow-card' : 'border shadow-card-soft'
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
              hero ? 'text-[16px] leading-[1.25]' : 'text-[14px] leading-[1.25]'
            }`}
            style={{ color: hero ? colors.white : colors.ink }}
          >
            {item.label}
          </span>
          {item.outcome && (
            <span
              className={`mt-[3px] block ${
                hero ? 'text-[12px] leading-[1.3]' : 'text-[11.5px] leading-[1.3]'
              }`}
              style={{ color: hero ? 'rgba(255,255,255,0.84)' : colors.body }}
            >
              {item.outcome}
            </span>
          )}
        </span>

        {hasDetail && (
          <span
            aria-hidden
            className="fc-node__more absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
            style={{ background: hero ? 'rgba(255,255,255,0.55)' : `${PAINT.hero}66` }}
          />
        )}
      </div>

      <AnimatePresence>
        {open && hasDetail && (
          <motion.span
            id={id}
            role="tooltip"
            className="pointer-events-none absolute left-1/2 z-30 block w-[300px] rounded-card border bg-white px-3.5 py-3 text-left text-[12.5px] leading-snug shadow-float"
            style={{
              color: colors.body,
              borderColor: colors.line,
              [side === 'top' ? 'bottom' : 'top']: 'calc(100% + 10px)',
              transformOrigin: side === 'top' ? 'bottom center' : 'top center',
            }}
            initial={
              reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateX(-50%) scale(0.96)' }
            }
            animate={{ opacity: 1, transform: 'translateX(-50%) scale(1)' }}
            exit={
              reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateX(-50%) scale(0.98)' }
            }
            transition={{ duration: 0.18, ease: c4(E.out) }}
          >
            <span
              className="mb-1 block font-heading text-[11px] font-bold uppercase tracking-wide"
              style={{ color: PAINT.hero }}
            >
              {item.label}
            </span>
            {/* `body` lives here rather than on the card, and this is the trade
                the doc comment above names: the mechanism is only a hover away
                for the presenter, and out of reach for the room. */}
            {item.body && <span className="mb-1 block">{item.body}</span>}
            {item.detail}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

export function RadialSpread({ items, caption, className = '' }: FeaturesFigureProps) {
  const f = resolveFeatures({ items })

  /* The hero takes 0 degrees and everything else follows in authored order, so
     the lead capability is on the right where the eye leaves the hub, and the
     ring never reshuffles for any other reason. */
  const order = f.hero ? [f.hero, ...f.rest] : f.all
  const n = order.length

  const place = (item: FeatureItem, i: number) => {
    const hero = item === f.hero
    const rad = ((i * 360) / Math.max(1, n)) * (Math.PI / 180)
    const x = CX + RX * (hero ? HERO_RX : 1) * Math.cos(rad)
    const y = CY + RY * Math.sin(rad)
    const h = hero ? HERO_H : CARD_H
    return { hero, x, y, h }
  }

  /* Derived from `items`, never from state. Beat 0 is the hub, which is on
     screen the instant the slide arrives: claiming it would open the slide on an
     empty stage that reads as a figure which failed to render. Then two beats a
     spoke, the line and then the card it arrives at, and the caption last. */
  const CAPTION = 1 + n * 2
  const shown = useBeats(CAPTION + 1)

  return (
    <figure className={`relative mx-auto ${className}`} style={{ width: W, height: H }}>
      {/* SPOKES. One aria-hidden SVG layer holding lines and arrowheads and not
          one character of text, per content rule 17: an `<svg>` is a single
          rectangle to `qa.mjs`, `video-safe.mjs` and `align-check.mjs`, so
          `<text>` labels can sit on top of each other and pass all three. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0"
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
      >
        <FcArrowDefs id="radial" colors={PAINT} />
        {order.map((item, i) => {
          const { hero, x, y, h } = place(item, i)
          const tip = stopShortOf(x, y, CARD_W / 2, h / 2)
          /* The line leaves the disc's EDGE, not its centre, or its first 80px
             is drawn underneath the hub and the spoke reads as starting late. */
          const len = Math.hypot(x - CX, y - CY) || 1
          const sx = CX + ((x - CX) / len) * (HUB_R + 6)
          const sy = CY + ((y - CY) / len) * (HUB_R + 6)
          const b = 1 + i * 2
          return (
            <FcEdgeDraw
              key={item.id}
              d={`M ${sx} ${sy} L ${tip.x} ${tip.y}`}
              at={b}
              shown={shown[b]}
              stroke={PAINT.spoke}
              width={hero ? 2.5 : 1.5}
              markerEnd={hero ? 'url(#radial-hero)' : 'url(#radial-spoke)'}
            />
          )
        })}
      </svg>

      {/*
        THE HUB, and it is beat 0.

        It states the count, because the contract gives it nothing else to state.
        The doc comment above says why that is a gap in `FeaturesFigureProps`
        rather than a decision made here.
      */}
      <FcNodeIn
        at={0}
        shown={shown[0]}
        className="absolute"
        style={{ left: CX - HUB_R, top: CY - HUB_R, width: HUB_R * 2, height: HUB_R * 2 }}
      >
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-full shadow-card"
          style={{ background: PAINT.hero }}
        >
          <span className="font-heading text-[34px] font-extrabold leading-none text-white">
            {f.all.length}
          </span>
          <span
            className="font-heading text-[11px] font-bold uppercase tracking-wide"
            style={{ color: 'rgba(255,255,255,0.82)' }}
          >
            capabilities
          </span>
        </div>
      </FcNodeIn>

      {/* THE CARDS, each landing on the beat after its own line has drawn. */}
      {order.map((item, i) => {
        const { hero, x, y, h } = place(item, i)
        const b = 2 + i * 2
        return (
          <FcNodeIn
            key={item.id}
            at={b}
            shown={shown[b]}
            className="absolute"
            style={{ left: x - CARD_W / 2, top: y - h / 2, width: CARD_W, height: h }}
          >
            <SpokeCard
              item={item}
              hero={hero}
              /* Cards in the top half open downward, so a popover never climbs
                 into the instructor-video rectangle. */
              side={y < CY ? 'bottom' : 'top'}
            />
          </FcNodeIn>
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

      {/* Contract violations are painted over the stage rather than laid out
          silently: a figure that draws invalid input looks fine and argues
          something nobody meant. Not in the DOM at all when the input is valid,
          so no harness ever measures it. */}
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
