import { colors } from '@/design/tokens'
import { FcEdgeLabel, FcNodeIn, useBeats } from '@/ui/figures/motion'
import { resolvePoints, type PointsFigureProps } from './pointsFigure'
import { HoverAside, MoreDot, ProblemPanel, TermChip, ToneChip, toneOf } from './pointsChrome'

/**
 * RULE STACK — one full-width row per point, in the order they become sayable.
 *
 * THE ARGUMENT
 *
 * A point is a CLAIM plus the one line that earns it, and a claim needs a line of
 * its own. This is the only variant here that gives it one: 802px of text column,
 * which is enough for the fixture's longest claim at 20px and its longest reason
 * at 15px to each stay on ONE line. Nothing wraps, so nothing has to be read
 * twice, and the eye travels straight down a stack of four claims in the order the
 * instructor will say them.
 *
 * That order is the second half of the argument. A points set in this course is
 * usually not four peers: it is four things that become sayable one after another,
 * and the fixture is exactly that, the image before the container before the
 * volume. A row stack states the sequence by existing. The ordinal in the marker
 * column makes it explicit rather than implied, so a room that looks up halfway
 * knows which point is being discussed.
 *
 * NO ICONS, DELIBERATELY
 *
 * `PeerCards` next door spends 34px of every card on one. Here the marker column
 * carries the TERM, which is the word the learner will type, and an icon beside a
 * term is decoration competing with the only mnemonic on the row. A variant that
 * gives up the icon has to be better at words, so this one is.
 *
 * WHAT IT IS WORST AT
 *
 * **It states an order whether or not there is one.** Four rows read top to
 * bottom, and a set of genuine peers, three ways to do the same thing, comes out
 * looking like three steps. There is no geometry here that can say "these are
 * interchangeable", and an author who does not notice will teach a sequence that
 * does not exist. That is `PeerCards`' entire reason to exist.
 *
 * Second, and measurable: **at six rows it is a wall.** Six rows on this 90px
 * pitch is 532px, which does not fit the 400px budget at all, so the honest
 * ceiling is four and the resolver's cap of six is reachable only by the two
 * variants that lay points out sideways. A five-row set fits at 442px and is
 * already more grey than a room will read.
 *
 * Third, the row is 1100px wide and the text stops at 802: the right third of
 * every row is empty unless the point carries a tone. That is air the card
 * variants spend on content.
 *
 * GEOMETRY, AND THE PADDING ARITHMETIC
 *
 * A fixed 1100x386 stage. Four rows of 82 on a 90px pitch, so the gaps are 8 and
 * the last row ends at 352; the caption sits at 360 and is 26 tall.
 *
 * PADDING IS A FLOOR, NOT A DECLARATION. A box shows `(box - content) / 2`, so the
 * row height is derived from the fixture rather than declared and hoped for:
 *
 *   claim, 20px on 1.3 leading                    26.0px
 *   gap                                            4.0px
 *   reason, 15px on 1.45 leading                  21.75px
 *   ----------------------------------------------------
 *   content                                       51.75px
 *   ROW_H 82 shows (82 - 51.75) / 2 =             15.1px real, against 14 declared
 *
 * Horizontally: 18 (row padding) + 132 (marker) + 22 (gap) + 802 (text) + 96
 * (tone chip) + 30 (gap and right padding) = 1100 exactly.
 *
 *   - The marker holds an ordinal (about 14px) plus a `md` TermChip. The longest
 *     term is "Container", 9 characters of 12.5px mono at 0.6em = 67.5px, plus
 *     20px of chip padding and 2px of border: 90px. With the ordinal and its 8px
 *     gap that is 112px inside 132.
 *   - The longest claim is 44 characters of 20px Sora bold at about 11.6px each:
 *     510px inside 802, so it stays one line with 292px spare.
 *   - The longest reason is 81 characters of 15px Inter at about 7.5px each:
 *     608px inside 802, also one line, with 194px spare.
 *   - "this one is free" is the longest tone word, 16 characters of 10.5px bold
 *     uppercase with tracking, about 109px plus 16px of padding: 125px. It is
 *     allowed to overrun its 96px column into the 30px gap, which is why the gap
 *     is 30 and not 12.
 */

const PAD_X = 18
const MARKER_GAP = 22
const CAPTION_GAP = 10
const CAPTION_H = 26
const ROW_GAP = 8
const TONE_W = 96
/** The most rows this figure will draw before it says so. */
const ROW_CAP = 5

/*
  THE MARKER COLUMN IS AS WIDE AS WHAT IS IN IT.

  132px was sized for a term chip, a word like `products/models.py` in mono with its
  own padding. A set with no terms puts a 28px numbered badge in that column and
  leaves 104px of nothing between the number and the claim, which was the first
  thing the user's eye landed on when Session 1 v3 shipped two untermed claims.
*/
const MARKER_TERMED = 132
const MARKER_PLAIN = 46

/*
  TYPE METRICS, so the row height is computed rather than declared. Same reasoning
  as `LineAnnotated` in the pseudocode lab: the height has to be known before
  layout, and a measure-then-render pass risks the browser and the exported file
  disagreeing.
*/
const LABEL_LH = 26
const LABEL_CH = 11.6 /* 20px Sora bold */
const BODY_GAP = 4
const BODY_LH = 22
const BODY_CH = 7.5 /* 15px Inter */
const ROW_PAD_Y = 14

const linesFor = (text: string, chWidth: number, room: number) =>
  Math.max(1, Math.ceil((text.length * chWidth) / room))

/**
 * THE STAGE IS AS TALL AS ITS ROWS, AND IT USED TO BE 386 WHATEVER THEY WERE.
 *
 * 386 is four rows plus a caption, which is what the lab fixture has. On a
 * two-point set that left about 200px of empty stage under the last row, and the
 * slide read as a figure that had failed to finish drawing. Session 1 v3 rejected
 * this figure for exactly that on its "Where We Are" slide.
 *
 * Height is now `rows * 90 - 8 + 10 + 26`: two rows come to 208, three to 298, four
 * to 388. The padding INSIDE a row is untouched at 15.1px real, because that was
 * measured against the longest claim and has nothing to do with how many rows there
 * are.
 *
 * `width` is the same accommodation `PeerCards` got: these figures were built to own
 * a 1100px stage, and a slide that pairs a figure with a points column gives one
 * about half of that.
 */
export function RuleStack({
  points,
  caption,
  width = 1100,
  /*
    NUMBER THE ROWS, OR DO NOT.

    This figure's own worst failure, written into its doc comment on the day it was
    built, is that it states an ORDER whether or not there is one. `ordered={false}`
    is the fix rather than a workaround: Session 1 v3 has a two-row set where the
    first row is the problem and the second is the fix, and "1" and "2" told the room
    to read them as step one and step two of something.

    An unordered set puts the ROLE in the marker instead, through each point's
    `term`, which is what a reader needs there. With neither an order nor terms the
    marker column disappears and the tone rule carries the row on its own.
  */
  ordered = true,
  className = '',
}: PointsFigureProps & { width?: number; ordered?: boolean }) {
  const g = resolvePoints({ points })
  const W = width
  const MARKER_W = g.allTermed ? MARKER_TERMED : ordered ? MARKER_PLAIN : 0

  /*
    THE ROW IS AS TALL AS ITS OWN TALLEST CONTENT, AND IT USED TO BE 82 ALWAYS.

    82 is a one-line claim over a one-line reason at 802px of text column, which is
    what the lab fixture has on a full-width stage. Nothing else got the padding it
    declared: a narrower slot wraps the claim and the text overflowed a row that had
    not grown, and a short set left the same air a fixed height always leaves.

    Estimated from the strings and the real text width, and taken from the WORST row
    because the rows are equal, so a row can be too tall by a rounding and never too
    short. The 14px of vertical padding is therefore a floor again.
  */
  const textW = width - PAD_X - MARKER_W - MARKER_GAP - TONE_W - PAD_X
  const labelLines = Math.max(1, ...g.points.map((p) => linesFor(p.label, LABEL_CH, textW)))
  const bodyLines = Math.max(
    0,
    ...g.points.map((p) =>
      typeof p.body === 'string' ? linesFor(p.body, BODY_CH, textW) : p.body ? 2 : 0,
    ),
  )
  const ROW_H = Math.round(
    labelLines * LABEL_LH + (bodyLines ? BODY_GAP + bodyLines * BODY_LH : 0) + ROW_PAD_Y * 2,
  )
  const PITCH = ROW_H + ROW_GAP
  const rowTop = (i: number) => i * PITCH
  const rowsH = g.points.length > 0 ? rowTop(g.points.length - 1) + ROW_H : 0
  const CAPTION_Y = rowsH + CAPTION_GAP
  const H = rowsH + CAPTION_GAP + CAPTION_H

  /*
    BEATS. Beat 0 is free and it carries the FIRST POINT, so the slide never opens
    on an empty stage that reads as a figure which failed to render, and the first
    click states the second point rather than the first. One click per remaining
    point, then the caption. Count is derived from props and never from state, so
    the number of steps registered with the deck's Stepper is stable for as long as
    the slide is up.

    CLAIMED BEFORE THE PROBLEM PANEL CAN RETURN, because `useBeats` is a hook and a
    hook behind an early return is a hook that appears and disappears with the
    props.
  */
  const CAPTION = g.points.length
  const shown = useBeats(CAPTION + 1)

  /* This variant's own geometric limit, checked rather than hoped for. */
  const problems = [...g.problems]
  /* The stage grows with the rows now, so the limit is the SLIDE's well rather than
     this figure's own frame: five rows is 448px plus a header, which is all a
     1280x720 stage has. Past that the honest edit is two slides. */
  if (g.points.length > ROW_CAP) {
    problems.push(
      `${g.points.length} rows come to ${H}px, and a slide's content well is about 460px, so this set is a wall rather than a slide`,
    )
  }
  if (problems.length) return <ProblemPanel problems={problems} width={W} height={H} />

  return (
    <figure className={`relative mx-auto ${className}`} style={{ width: W, height: H }}>
      {g.points.map((p, i) => {
        const paint = toneOf(p.tone)
        const lead = p.tone === 'lead'
        return (
          <FcNodeIn
            key={p.id}
            at={i}
            shown={shown[i]}
            /* `absolute` is load-bearing: `.fc-node-slot`'s `z-index` is ignored on
               a static element, and the hover aside then gets painted over by the
               rows below it. See the note in `pointsChrome.tsx`. */
            className="absolute"
            style={{ left: 0, top: rowTop(i), width: W, height: ROW_H }}
          >
            <HoverAside
              detail={p.detail}
              label={p.term ?? `Point ${i + 1}`}
              paint={paint}
              /* The first half opens downward and the second upward, so an aside
                 never leaves the top or the bottom of the slide. */
              side={i < Math.ceil(g.points.length / 2) ? 'bottom' : 'top'}
            >
              <div
                className="flex h-full w-full items-center rounded-card"
                style={{
                  /*
                    THE SAME DIAGONAL LIGHT AND TONE-TINTED SHADOW AS `PeerCards`, AT
                    HALF THE STRENGTH.

                    A row is a wider, quieter surface than a card, and the card's 10%
                    wash across 1100px reads as a colour block rather than as depth.
                    Every layer is opaque over a white base: a bare wash lets whatever
                    is behind it read through, which is how the sibling lab ended up
                    with a rail running across a card.
                  */
                  background: [
                    `linear-gradient(150deg, ${paint}14 0%, ${paint}06 38%, ${colors.white}00 62%)`,
                    colors.white,
                  ].join(', '),
                  border: `1px solid ${lead ? `${paint}3d` : colors.line}`,
                  borderLeft: `4px solid ${paint}`,
                  boxShadow: `0 12px 28px -20px ${paint}59, inset 0 0 0 1px ${paint}0f`,
                  paddingLeft: PAD_X,
                  paddingRight: PAD_X,
                }}
              >
                {/* THE MARKER. The ordinal states the order the stack only implies,
                    and the term is the word the learner will actually type. */}
                <span
                  className="flex shrink-0 items-center gap-2"
                  style={{ width: MARKER_W }}
                >
                  {/*
                    THE ORDINAL IS DRAWN ONCE, AND IT USED TO BE DRAWN TWICE.

                    The small mono number was written for the TERMED case, where it
                    numbers a row whose marker is a word. With no term the marker is
                    itself a numbered badge, so a set without terms came out reading
                    "1 (1)" and "2 (2)": Session 1 v3 put two untermed claims on a
                    slide and the double number is the first thing the eye landed on.
                  */}
                  {g.allTermed && p.term ? (
                    <>
                      {ordered && (
                        <span
                          className="font-mono text-[13px] font-bold"
                          style={{ color: `${paint}8a` }}
                        >
                          {i + 1}
                        </span>
                      )}
                      <TermChip term={p.term} paint={paint} />
                    </>
                  ) : ordered ? (
                    <span
                      className="grid h-7 w-7 place-items-center rounded-full font-heading text-[13px] font-bold"
                      style={{ background: `${paint}14`, color: paint }}
                    >
                      {i + 1}
                    </span>
                  ) : null}
                </span>

                {/* THE CLAIM AND ITS REASON, one line each by construction. */}
                <span className="min-w-0 flex-1" style={{ marginLeft: MARKER_GAP }}>
                  <span
                    className="block font-heading text-[20px] font-bold leading-[1.3]"
                    style={{ color: colors.ink }}
                  >
                    {p.label}
                  </span>
                  {p.body && (
                    <span
                      className="mt-1 block text-[15px] leading-[1.45]"
                      style={{ color: colors.body }}
                    >
                      {p.body}
                    </span>
                  )}
                </span>

                <span className="ml-3 flex shrink-0 items-center gap-2">
                  {/*
                    THE ROLE IS STATED ONCE PER ROW.

                    When the marker carries a `term`, that word IS the role, and the
                    tone ramp's default word then says it again from the other end of
                    the row: Session 1 v3's "Problem" row came out with "THE USUAL
                    TRAP" 900px to its right. An author who wants a second word says
                    so with `tag`, and an empty string is how this asks `ToneChip` for
                    no word at all.
                  */}
                  <ToneChip tone={p.tone} tag={p.tag ?? (p.term ? '' : undefined)} />
                  {p.detail && <MoreDot paint={paint} />}
                </span>
              </div>
            </HoverAside>
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
    </figure>
  )
}
