import { useId, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { colors } from '@/design/tokens'
import { iconByName } from '@/ui/icons'
import { E, c4 } from '@/ui/figureTiming'
import { FcEdgeLabel, FcNodeIn, useBeats } from '@/ui/figures/motion'
import { resolveFeatures, type FeatureItem, type FeaturesFigureProps } from './featuresFigure'

/**
 * FEATURE FOCUS — one capability per frame, at hero scale, with a progress rail
 * so the room knows more is coming.
 *
 * THE ARGUMENT
 *
 * Every other variant in this lab answers "here are the things it can do" by
 * putting all of them on one surface and then working out how to stop them
 * competing. This one refuses the premise. Established practice in the two places
 * that do this professionally, an app-store screenshot set and a product page,
 * is that a frame highlights ONE capability and does not try to show everything,
 * because a viewer given six things looks at none of them. A screenshot set is
 * five frames, not one frame with five insets.
 *
 * So the feature at `at` gets the whole stage: its label at TITLE scale rather
 * than card scale, its `body` at reading size instead of caption size, its
 * `metric` as the number it actually is, and its `outcome` as the claim the slide
 * is making. Nothing shares the stage with it, so nothing has to be shrunk to fit
 * beside it, and the instructor talking about search is not talking over four
 * other headings the room can already read.
 *
 * The other features are not gone. They are a progress rail: numbered ticks, the
 * current one filled, and a plain "3 of 5". That is the whole job of the rail. It
 * tells the room this is a set and it is not finished, which is the one thing a
 * single-feature frame otherwise throws away, and it costs about 30px to say. The
 * rail carries NO labels on purpose: a rail with five labels on it is a features
 * grid drawn small underneath a features slide, and then the frame is showing six
 * things again.
 *
 * IT IS DESIGNED TO BE REPEATED ACROSS N SLIDES, AND THAT IS THE DEAL
 *
 * The deck author writes N SLIDES, one per feature, same `items`, `at`
 * incremented: `at={0}`, `at={1}`, `at={2}`, and so on. There is no mode where
 * this figure walks its own set, because a figure that advances itself owns the
 * pacing of five slides' worth of speech, and it is the instructor who knows how
 * long the offline story takes. Five slides also means five titles, five sets of
 * presenter notes and five places to cut one feature that turned out not to
 * matter, which a single slide does not give you.
 *
 * That is a real cost and it should be stated plainly: this variant multiplies
 * the slide count by the feature count. Five capabilities is five slides. It is
 * the right trade when the features are the substance of the session and the
 * wrong one when they are a single "and it also does these" beat on the way to
 * something else.
 *
 * WHAT IT IS WORST AT
 *
 *   - **Breadth as a claim.** "It does five things" is a statement about the
 *     SET, and this figure can never show the set. `RadialSpread` exists for
 *     exactly that claim and this variant cannot make it. The rail is an
 *     acknowledgement, not a display.
 *   - **Comparison, absolutely.** Two features are never on screen together, so
 *     "which of these is fastest" or "which do I need" is unanswerable. The room
 *     has to hold frame 2 in memory to compare it with frame 4, which is the one
 *     thing a slide is supposed to save them from.
 *   - **A screenshot or a PDF of the deck.** A reader gets one feature per page
 *     and no page that lists them, so anybody skimming the exported deck has to
 *     read five pages to learn what five pages of the deck were about. Pair it
 *     with a takeaways slide that does list them.
 *   - **A set of five equal, minor features.** Hero scale on "exports to CSV" is
 *     a promise the content does not keep, and five frames of it reads as
 *     padding. `weight` is ignored here except as a mark on the rail, because
 *     every frame is a hero frame by construction, which is another way of saying
 *     no frame is.
 *   - **`caption`.** The caption belongs to the whole set, and it repeats
 *     verbatim on all five frames. Pass it on the first one only.
 *
 * GEOMETRY, AND THE PADDING ARITHMETIC
 *
 * A fixed 1100x348 stage on a 1280x720 slide, absolutely positioned.
 *
 *   panel   top 0    height 240
 *   rail    top 262  height 30
 *   caption top 324
 *
 * The panel is `px-9` (36) with an 84px icon tile and a 28px gap, so the text
 * column is 1100 - 72 - 84 - 28 = 916px wide. The longest label in the fixture,
 * "Links between notes", sets at 42px in about 440px, so every label in the set
 * is one line and the stack below is exact rather than hopeful:
 *
 *   label    42px on 1.1     46.2
 *   gap                       8
 *   body     19px on 1.45    27.6
 *   gap                      12
 *   metric   34px on 1.1     37.4
 *   gap                      12
 *   outcome  17px on 1.35 + 8px pill padding top and bottom  = 39.0
 *   -------------------------------------------------------------
 *   content                 182.2
 *
 * so the REAL vertical padding is (240 - 182.2) / 2 = 28.9px, against a floor of
 * 12. That arithmetic is the point of writing it down: `py-7` DECLARES 28, and
 * what a box SHOWS is `(box height - content height) / 2`, which silently becomes
 * 0 or negative the moment the content outgrows the box. The sibling flow-chart
 * lab shipped four cards at 0px and one at -7px, every one of them declaring
 * 12px, and it passed every harness the whole time.
 *
 * The margin left over, 28.9 against 12, buys one extra line: a `body` that wraps
 * to two lines costs 27.6 and lands at 15.1px of real padding, which still
 * clears. A label that wraps to two lines costs 46.2 and lands at 5.8px, which
 * does NOT, so the constraint this figure actually places on the author is a
 * one-line label. At 42px in a 916px column that is roughly 40 characters, and a
 * capability that cannot be named in 40 characters has a naming problem rather
 * than a layout problem.
 */

const W = 1100
const PANEL_H = 240
const RAIL_TOP = 262
const RAIL_H = 30
const CAPTION_TOP = 324
const H = CAPTION_TOP + 24 /* 348 */

const PAD_X = 36
const ICON = 84
const ICON_GAP = 28

/**
 * The hover popover's own duration, and deliberately NOT one of `T`'s.
 *
 * `T` is the explanatory tier: the panel enters at 520ms because it is read once
 * from the back of a room. A hover is the opposite case. The presenter triggers
 * it on purpose, repeatedly, and is waiting for the answer, so it takes the
 * `animate` skill's UI numbers and 520ms here would feel broken. The lift itself
 * is a CSS transition in `index.css` and is not written in this file.
 */
const POPOVER = 0.18

export function FeatureFocus({
  items,
  caption,
  className = '',
  at = 0,
}: FeaturesFigureProps & { at?: number }) {
  const { all, hero, problems } = resolveFeatures({ items })

  /*
    AN OUT OF RANGE `at` IS REPORTED, NOT CLAMPED QUIETLY.

    This variant is written across N slides with a hand-incremented `at`, so an
    off-by-one is the likeliest authoring mistake there is: delete the third
    feature and slide 5 now points past the end of the set. Clamping silently
    would render feature 5 twice and look entirely fine, which is the failure
    mode this lab exists to stop.
  */
  const wanted = Math.trunc(at)
  const idx = Math.min(Math.max(0, wanted), Math.max(0, all.length - 1))
  const rangeProblems =
    wanted === idx ? [] : [`at=${wanted} is outside 0..${all.length - 1}; showing ${idx}`]
  const allProblems = [...problems, ...rangeProblems]

  const item = all[idx]

  const hasMetric = Boolean(item?.metric)
  const hasOutcome = Boolean(item?.outcome)

  /*
    BEATS ARE DERIVED FROM `items` AND `at`, NEVER FROM STATE, so the number of
    steps this slide registers with the deck is stable for as long as it is up.

    Beat 0 is free and it is THE FEATURE: the label, the body, the icon and the
    rail. A single-feature frame that opens empty reads as a figure which failed
    to render, and it would cost the presenter a click to reach the one thing on
    the slide that needs no explanation.

    Then the number, then the payoff, then the caption. Every beat puts something
    new on screen, so there is no click that leaves the presenter wondering
    whether the deck is dead. A feature with no `metric` claims no beat for one.
  */
  let next = 1
  const metricAt = hasMetric ? next++ : -1
  const outcomeAt = hasOutcome ? next++ : -1
  const captionAt = next
  const shown = useBeats(caption ? captionAt + 1 : captionAt)

  return (
    <figure className={`relative mx-auto ${className}`} style={{ width: W, height: H }}>
      {item && (
        <FcNodeIn
          at={0}
          shown={shown[0]}
          className="absolute"
          style={{ left: 0, top: 0, width: W, height: PANEL_H }}
        >
          <FocusPanel
            item={item}
            metricShown={metricAt < 0 ? false : shown[metricAt]}
            metricAt={metricAt}
            outcomeShown={outcomeAt < 0 ? false : shown[outcomeAt]}
            outcomeAt={outcomeAt}
          />
        </FcNodeIn>
      )}

      {/*
        THE RAIL. Ticks only, and the count in words.

        It lands on beat 0 with the feature rather than on a click of its own,
        because "there are five of these and this is the third" is context the
        room needs while it is reading the first line, not a reveal.
      */}
      <FcNodeIn
        at={0}
        shown={shown[0]}
        className="absolute flex items-center justify-center gap-3"
        style={{ left: 0, top: RAIL_TOP, width: W, height: RAIL_H }}
      >
        <span className="flex items-center gap-2.5">
          {all.map((f, i) => (
            <span
              key={f.id}
              aria-hidden
              className="grid place-items-center rounded-full font-heading text-[12px] font-bold leading-none"
              style={{
                width: i === idx ? 26 : 22,
                height: i === idx ? 26 : 22,
                background: i === idx ? colors.brand : colors.white,
                color: i === idx ? colors.white : colors.muted,
                border: `1.5px solid ${i === idx ? colors.brand : colors.line}`,
                /* The hero is marked on the rail even when it is not the frame
                   you are on, so a room arriving at frame 4 still knows which
                   one the session was really about. */
                boxShadow: f === hero && i !== idx ? `0 0 0 3px ${colors.brand}1f` : undefined,
              }}
            >
              {i + 1}
            </span>
          ))}
        </span>
        <span
          className="block h-[14px] w-px"
          style={{ background: colors.line }}
          aria-hidden
        />
        <span className="block text-[13px] leading-none" style={{ color: colors.muted }}>
          {idx + 1} of {all.length}
        </span>
      </FcNodeIn>

      {caption && (
        <FcEdgeLabel
          at={captionAt}
          shown={shown[captionAt]}
          className="absolute block text-center text-body-sm"
          style={{ left: 0, top: CAPTION_TOP, width: W, color: colors.body }}
        >
          {caption}
        </FcEdgeLabel>
      )}

      {/*
        CONTRACT VIOLATIONS ARE PRINTED, NOT SWALLOWED.

        `resolveFeatures` knows about two heroes, seven features, or an item with
        neither body nor outcome, and this variant adds the one failure only it
        can have: an `at` past the end of the set. A frame that quietly renders
        the wrong feature looks perfect. With valid input this element is not in
        the DOM at all, so no harness ever measures it.
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
 * THE ONE FEATURE, AT HERO SCALE.
 *
 * The type scale is the whole variant. A 42px label is not a 15px card label
 * enlarged: at this size the label is the slide's own headline, so `body` can sit
 * at reading size underneath it instead of being compressed into a caption, and
 * the `metric` can be the number it claims to be rather than a badge.
 */
function FocusPanel({
  item,
  metricAt,
  metricShown,
  outcomeAt,
  outcomeShown,
}: {
  item: FeatureItem
  metricAt: number
  metricShown: boolean
  outcomeAt: number
  outcomeShown: boolean
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
        /*
          `fc-node` and `fc-node--hoverable` are the kit's existing hover pair in
          `index.css`: a 160ms CSS transition on `transform` and `box-shadow`,
          gated behind `hover: hover` so a tap on a touch device cannot leave the
          panel stuck lifted. CSS rather than framer because a CSS transition
          retargets from wherever it currently is when the pointer leaves, and
          keyframes and JS both restart from zero.
        */
        className={`fc-node flex h-full w-full items-center rounded-card ${
          hasDetail ? 'fc-node--hoverable' : ''
        }`}
        style={{
          paddingLeft: PAD_X,
          paddingRight: PAD_X,
          gap: ICON_GAP,
          /* Two layers, a tint over an opaque white base, never a bare
             translucent fill: a wash alone lets whatever sits behind the figure
             read straight through the panel, and this panel is the slide. */
          background: `linear-gradient(${colors.brand}0a, ${colors.brand}0a), ${colors.white}`,
          border: `1px solid ${colors.line}`,
          borderLeft: `6px solid ${colors.brand}`,
          boxShadow: `0 12px 38px -16px ${colors.brandDeep}33`,
        }}
        aria-describedby={open ? id : undefined}
      >
        {Icon && (
          <span
            className="grid shrink-0 place-items-center rounded-card"
            style={{
              width: ICON,
              height: ICON,
              background: colors.brand,
              color: colors.white,
              boxShadow: `0 10px 26px -12px ${colors.brand}80`,
            }}
          >
            <Icon width={40} height={40} />
          </span>
        )}

        <span className="min-w-0 flex-1">
          <span
            className="block font-heading text-[42px] font-bold leading-[1.1]"
            style={{ color: colors.ink }}
          >
            {item.label}
          </span>

          {item.body && (
            <span className="mt-2 block text-[19px] leading-[1.45]" style={{ color: colors.body }}>
              {item.body}
            </span>
          )}

          {/*
            THE NUMBER IS THE NUMBER. At hero scale the `metric` finally has room
            to be set as a figure with its unit beside it rather than as a pill,
            which is the one thing `MetricLed` argues and the only place in this
            lab where a variant that is not `MetricLed` can honour it. A feature
            with no honest number simply has none, and nothing is drawn.
          */}
          {item.metric && metricAt >= 0 && (
            <FcEdgeLabel
              at={metricAt}
              shown={metricShown}
              className="mt-3 flex items-baseline gap-2"
            >
              <span
                className="block font-heading text-[34px] font-bold leading-[1.1]"
                style={{ color: colors.brand }}
              >
                {item.metric.value}
              </span>
              {item.metric.unit && (
                <span className="block text-[14px] leading-[1.3]" style={{ color: colors.muted }}>
                  {item.metric.unit}
                </span>
              )}
            </FcEdgeLabel>
          )}

          {/*
            THE PAYOFF, AND IT ARRIVES LAST. `body` is what the thing IS and this
            is what it BUYS, so it is set as a pill rather than a third paragraph:
            it has to read as a different KIND of statement, not as more
            description.
          */}
          {item.outcome && outcomeAt >= 0 && (
            <FcEdgeLabel
              at={outcomeAt}
              shown={outcomeShown}
              className="mt-3 inline-block rounded-pill px-3.5 py-2 text-[17px] font-semibold leading-[1.35]"
              style={{ background: colors.brand, color: colors.white }}
            >
              {item.outcome}
            </FcEdgeLabel>
          )}
        </span>

        {/* A hover affordance the room can see without a pointer. Without it the
            detail is a secret only the person holding the mouse knows about. */}
        {hasDetail && (
          <span
            aria-hidden
            className="fc-node__more absolute right-3 top-3 h-2 w-2 rounded-full"
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

        It opens DOWNWARD and covers the rail, which is deliberate. The rail is
        context for someone meeting the frame for the first time; by the time the
        presenter is reaching for the aside, the room has already read "3 of 5"
        and nothing is lost by hiding it for as long as the pointer is down there.
      */}
      <AnimatePresence>
        {open && item.detail && (
          <motion.span
            id={id}
            role="tooltip"
            className="pointer-events-none absolute z-30 block w-[420px] rounded-card border bg-white px-4 py-3 text-left text-[13px] leading-snug shadow-float"
            style={{
              color: colors.body,
              borderColor: colors.line,
              top: 'calc(100% + 10px)',
              right: PAD_X,
              /* Scales from the edge nearest the panel, so it reads as coming OUT
                 of the panel rather than appearing under it. */
              transformOrigin: 'top right',
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
