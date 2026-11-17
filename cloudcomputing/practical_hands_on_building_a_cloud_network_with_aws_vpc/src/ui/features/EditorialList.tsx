import { useId, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { colors } from '@/design/tokens'
import { E, c4 } from '@/ui/figureTiming'
import { FcEdgeLabel, FcNodeIn, useBeats } from '@/ui/figures/motion'
import { resolveFeatures, type FeatureItem, type FeaturesFigureProps } from './featuresFigure'

/**
 * EDITORIAL LIST — no boxes at all. A rule in the gutter, the name set large, the
 * description and the payoff beside it, a hairline between rows.
 *
 * THE ARGUMENT
 *
 * A grid of equal cards draws exactly one proposition: "n things of equal
 * weight". That is the whole of its content. When the NAMES are the content, the
 * boxes are decoration, and worse, they are decoration that costs the names the
 * size they need to be read from the back of a room: a card has to hold an icon,
 * a label, a body and a border inside a tile, so the label lands at 14 or 15px
 * whatever the projector is.
 *
 * This is `STYLE_GUIDE.md` section 8 applied to a features slide, and it is the
 * received answer to the same question outside this repo. The usual guidance on
 * cards is that they earn their keep when the items are heterogeneous, each with
 * its own image and its own shape, and that a set of similar items is better as a
 * list, because identical cards are a list with borders drawn on it
 * (Justinmind, "Card UI design"; Wise Design's own feature-section pattern makes
 * the same split, cards for mixed content, rows for parallel content). Every item
 * in this contract is parallel by construction: `label`, `body`, `outcome`. So
 * this variant deletes the box and spends the space on type.
 *
 * The hero is not a bigger tile here, because there are no tiles. It is set
 * larger, it carries the accent rule in the gutter, and it is first. That is the
 * editorial answer to the flat grid the user rejected: hierarchy through size and
 * position, which is the cheapest hierarchy there is and the only one that
 * survives being projected badly.
 *
 * WHERE IT WINS OUTRIGHT: LONG LABELS. "Plain files on disk" and "Links between
 * notes" wrap inside every boxed variant in this lab, because a tile's width is
 * fixed by the grid and not by its content. Here a label has 306px of measure and
 * a whole row to grow into, so the longest label in the fixture still sets on one
 * line at 18px, and the hero's at 24px.
 *
 * WHAT IT IS WORST AT
 *
 *   - **Anything that is not a list.** Nothing here draws a relationship. A set
 *     whose items relate to each other, or to a centre, is misdrawn by this
 *     figure as five unrelated names, and it will look tidy while doing it.
 *   - **Three items.** Three big rows across 1100px leaves a bottom third of the
 *     stage empty, and reads as a slide that failed to finish rendering rather
 *     than as an editorial one. `resolveFeatures` already objects under three;
 *     this variant wants four or five.
 *   - **Icons and logos.** `item.icon` and `item.logo` are deliberately NOT
 *     drawn. An icon per row rebuilds the gutter into a column of decoration and
 *     puts back the thing the variant exists to remove. If a slide's technology
 *     marks are required by hard rule 12, this is the wrong variant for it, and
 *     that is a real cost, not a quibble.
 *   - **A body that wraps.** A row is one label line and one body line. Two-line
 *     copy in the middle column eats the padding floor from below (see GEOMETRY),
 *     and it does it silently.
 *   - **Comparison across rows.** The three columns line up, so this is better at
 *     it than `AlternatingRows`, but the type sizes differ between hero and rest,
 *     which quietly asserts the hero wins on every axis. Never use it for options
 *     somebody is choosing between.
 *
 * KEPT AND CHANGED FROM THE PYTHON SESSION'S `EditorialList`
 *
 * `python_programming/programming_with_python/src/ui/EditorialList.tsx` is the
 * session-owned original. This is that component generalised onto this lab's
 * contract.
 *
 * KEPT, because they were right and the reasons are recorded there:
 *   - the form itself: hairline rules between rows, the name at display size, one
 *     line of gloss, no boxes anywhere
 *   - the gutter, and the finding that made it what it is: numbering every row
 *     claims a rank the content does not have, and it looks like tidiness rather
 *     than like a claim, which is what makes it the quietest way to break
 *     `STYLE_GUIDE.md` section 8. The original made numbers opt-in; this variant
 *     takes `FeaturesFigureProps` and has no prop to opt in WITH, so the gutter
 *     carries a rule instead of a number. A set of capabilities is unordered, and
 *     a rule says "another one" without saying "the third one".
 *   - a fixed-width gutter, so every name starts on the same x.
 *
 * CHANGED:
 *   - **Two columns became three.** The original had `label` and `body` only. This
 *     contract separates what it IS from what it BUYS, so `outcome` gets its own
 *     right-hand column at full weight rather than being appended to the gloss.
 *   - **The hero exists.** The original set every row identically; a features set
 *     has a leader and the whole lab exists because a flat set has none.
 *   - **Stacked became beside.** `label` over `body` in one column is what forces
 *     a boxed row; three columns on one baseline is what lets the row be 68px and
 *     still show 16px of real padding.
 *   - **`Step` became `useBeats`.** The original auto-revealed with the deck's
 *     `Step`. Every part here is a click-gated build step, and beat 0 is free and
 *     belongs to the hero.
 *   - **Hover detail added.** The contract has `detail`, and the original had no
 *     second layer at all.
 *   - **Fixed stage.** The original was a flowing `grid` sized by its parent. This
 *     is 1100x400, absolutely positioned, because the harnesses measure static
 *     rectangles on a 1280x720 slide.
 *
 * GEOMETRY, AND WHY EVERY NUMBER IS WHAT IT IS
 *
 * A fixed 1100x400 stage. One column of full-width rows, and inside a row four
 * fixed measures: a 56px gutter, a 330px name column, a 414px description
 * column, a 300px outcome column. 56 + 330 + 414 + 300 = 1100 exactly, with 24px
 * of the label and body columns spent on their own right padding so the columns
 * never touch.
 *
 * The row heights ARE the padding floor, and they are computed from the type
 * rather than chosen:
 *
 *   normal row   68px   1px rule leaves 67. Tallest cell is the outcome at 13px
 *                       on 1.35, which wraps to two lines at this measure in the
 *                       worst case: 35.1px. Real vertical padding is therefore
 *                       (67 - 35.1) / 2 = 15.9px, and 22px on a row whose
 *                       outcome fits one line.
 *   hero row     84px   2px rule leaves 82. Tallest cell is the hero outcome at
 *                       15px on 1.35 over two lines, 40.5px, so real padding is
 *                       (82 - 40.5) / 2 = 20.7px.
 *
 * That arithmetic is the point of the block. `py-4` DECLARES 16px; what a row
 * SHOWS is `(row height - content height) / 2`, and once the content outgrows the
 * row the declared number silently becomes 0 or negative. The sibling flow-chart
 * lab shipped four cards at 0px and one at -7px, every one of them declaring
 * 12px, and all three harnesses passed them the whole time. So the rows are sized
 * from the tallest cell they can contain, and the floor is 12px.
 *
 * 84 + 4 x 68 = 356, the caption sits at 372, the figure is 400. There is no gap
 * between rows: the hairlines do the dividing, and a gap plus a rule reads as a
 * table.
 */

const W = 1100
const H = 400

/** The gutter. Wide enough for the tick rule and the air after it, no wider. */
const GUT = 56
/** The name column. 306px of measure once its own right padding is taken out. */
const LABEL_W = 330
/** What it BUYS. Right-hand column, at full weight, never appended to the gloss. */
const OUT_W = 300
/** What it IS. Whatever is left, which is 414. */
const BODY_W = W - GUT - LABEL_W - OUT_W

const HERO_H = 84
const ROW_H = 68
const CAPTION_Y = 372

/**
 * ONE ROW. Type, a rule above it, and a hover.
 *
 * No box, so nothing here is a card and `NodeShell` is not reused: that shell
 * exists to give a card consistent chrome, and this variant's entire argument is
 * that the chrome is what should go. What IS copied from it, exactly, is the
 * hover pattern:
 *
 *   - `fc-node fc-node--hoverable` for the lift, a CSS transition in `index.css`
 *     at UI-tier speed (160ms), gated behind `hover: hover` so a tap cannot leave
 *     a row stuck raised. The figure's entrance is 520ms because it is watched
 *     once; a hover is triggered deliberately and repeatedly.
 *   - `fc-node--bare` as well, which is the class `NodeShell` gives its diamond.
 *     The default hover rule paints a shadow on the hovered element, and this
 *     element has no background, so the shadow came out as a blue haze under bare
 *     type with no edge to belong to. `--bare` drops the shadow and keeps the
 *     lift, which is exactly the boxless case it was written for.
 *   - The popover is framer, because it mounts and unmounts and needs an exit.
 *   - The popover is NEVER in the DOM unless open. `qa.mjs`, `video-safe.mjs` and
 *     `align-check.mjs` measure static rectangles, so a panel parked at
 *     `opacity: 0` is reported as overflowing the frame on every run.
 *   - `transform-origin` points back at the row it came out of.
 *
 * The z-index that lets it paint over the rows below lives on `.fc-node-slot`,
 * which `FcNodeIn` puts on the wrapper: this element's parent animates
 * `transform`, and a transformed element creates a stacking context that no
 * `z-index` in here can escape.
 */
function ListRow({
  item,
  hero,
  side,
}: {
  item: FeatureItem
  hero: boolean
  /** Which way the popover opens, so a top row does not push off the stage. */
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
        className={`fc-node flex h-full w-full items-center ${
          hasDetail ? 'fc-node--hoverable fc-node--bare' : ''
        }`}
        style={{
          /* The hairline IS the row's separator and the hero's is the accent.
             `border-box` is Tailwind's preflight default, so the rule eats into
             the row's own height and the padding numbers above already allow for
             it. */
          borderTop: `${hero ? 2 : 1}px solid ${hero ? colors.brand : colors.line}`,
        }}
        aria-describedby={open ? id : undefined}
      >
        {/* THE GUTTER. A rule, not a number: a set of capabilities is unordered,
            and `01` beside a feature claims a rank the content does not have. */}
        <span className="flex shrink-0 justify-start" style={{ width: GUT }}>
          <span
            aria-hidden
            className="block rounded-full"
            style={{
              width: hero ? 30 : 20,
              height: hero ? 4 : 2,
              background: hero ? colors.brand : colors.muted,
            }}
          />
        </span>

        {/* THE NAME, which is the content. */}
        <span className="shrink-0 pr-6" style={{ width: LABEL_W }}>
          <span
            className={`block font-heading font-extrabold ${
              hero ? 'text-[24px] leading-[1.2]' : 'text-[18px] leading-[1.25]'
            }`}
            style={{ color: hero ? colors.brand : colors.ink }}
          >
            {item.label}
            {/* The room cannot hover a projector, so this dot is the only way
                anyone watching knows there is a second layer here at all. It is
                inline rather than absolute, because a full-width row has no
                corner near the text to park it in. */}
            {hasDetail && (
              <span
                aria-hidden
                className="fc-node__more ml-2 inline-block h-1.5 w-1.5 rounded-full align-middle"
                style={{ background: hero ? colors.brand : colors.muted }}
              />
            )}
          </span>
        </span>

        {/* WHAT IT IS. One line, and it stays one line. */}
        <span className="shrink-0 pr-6" style={{ width: BODY_W }}>
          {item.body && (
            <span
              className={`block ${hero ? 'text-[14px]' : 'text-[12.5px]'} leading-[1.35]`}
              style={{ color: colors.body }}
            >
              {item.body}
            </span>
          )}
        </span>

        {/* WHAT IT BUYS. Its own column, at full weight, never appended to the
            gloss: the contract separates the two and this is the layout that
            takes the separation literally. */}
        <span className="shrink-0" style={{ width: OUT_W }}>
          {item.outcome && (
            <span
              className={`block font-heading font-semibold ${
                hero ? 'text-[15px]' : 'text-[13px]'
              } leading-[1.35]`}
              style={{ color: hero ? colors.brand : colors.ink }}
            >
              {item.outcome}
            </span>
          )}
        </span>
      </div>

      <AnimatePresence>
        {open && item.detail && (
          <motion.span
            id={id}
            role="tooltip"
            className="pointer-events-none absolute z-30 block w-[340px] rounded-card border bg-white px-3.5 py-3 text-left text-[12.5px] leading-snug shadow-float"
            style={{
              color: colors.body,
              borderColor: colors.line,
              left: GUT,
              [side === 'top' ? 'bottom' : 'top']: 'calc(100% + 8px)',
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
            {item.detail}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

export function EditorialList({ items, caption, className = '' }: FeaturesFigureProps) {
  const f = resolveFeatures({ items })

  /*
    ROWS ARE DRAWN IN AUTHORED ORDER; BEATS RUN HERO FIRST.

    The two are usually the same list, because a hero is normally authored first.
    When they are not, it is the REVEAL that leads with the hero and never the
    layout reshuffling itself: a figure whose rows move when you mark one of them
    `hero` is a figure whose geometry depends on its weights.
  */
  const order = f.hero ? [f.hero, ...f.rest] : f.all
  const beatOf = (item: FeatureItem) => order.indexOf(item)

  const heightOf = (item: FeatureItem) => (item === f.hero ? HERO_H : ROW_H)
  const topOf = (i: number) => f.all.slice(0, i).reduce((y, it) => y + heightOf(it), 0)

  /* Derived from `items`, never from state, so the registered step count is
     stable while the slide is up. One beat per row, plus the caption. Beat 0 is
     free and it belongs to the hero, so the slide never opens on an empty stage
     and no click is spent on the row that needs no explanation. */
  const CAPTION = f.all.length
  const shown = useBeats(CAPTION + 1)

  return (
    <figure className={`relative mx-auto ${className}`} style={{ width: W, height: H }}>
      {f.all.map((item, i) => {
        const b = beatOf(item)
        return (
          <FcNodeIn
            key={item.id}
            at={b}
            shown={shown[b]}
            className="absolute"
            style={{ left: 0, top: topOf(i), width: W, height: heightOf(item) }}
          >
            <ListRow
              item={item}
              hero={item === f.hero}
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
