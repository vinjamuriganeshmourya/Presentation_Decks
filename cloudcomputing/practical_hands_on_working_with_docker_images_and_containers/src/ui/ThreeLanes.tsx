import { colors } from '@/design/tokens'
import { FcNodeIn, useBeats } from '@/ui/figures/motion'
import { ApprovalMark } from './ApprovalMark'
import { ReachChain } from './ReachChain'
import { CHAIN, REACH_PAINT, type CicdReachProps } from './cicdReach'

/**
 * THREE LANES — the chain drawn three times, once per term, each lane going
 * dashed after its own stop point. The literal answer, and the conventional one.
 *
 * THE ARGUMENT, AND IT IS NOT A HOUSE ARGUMENT
 *
 * This is the shape the industry actually draws. Atlassian's own framing is
 * that the three practices "build on each other as stacked stages in a CI/CD
 * pipeline", and Red Hat, AWS Prescriptive Guidance, CircleCI, IBM and Bitrise
 * all publish the same picture: one left-to-right chain of stages, with the
 * three practices as rows, each row reaching further right than the one above.
 * A learner who leaves this session and reads any article on CI/CD will meet
 * this diagram again. That is worth something no amount of local cleverness
 * buys, and it is an argument the other candidates do not have.
 *
 * It also asks nothing of the viewer. `NestedSpans` and `ReachBands` both draw
 * the reach as an ABSTRACTION over the chain, and a reader has to carry a bar's
 * right end back up to the stage above it. Here every lane states its own
 * outcome for every stage in place: stage 5 under Continuous Delivery is
 * dashed, right there, in the row it belongs to.
 *
 * THE PRICE IS HEIGHT, AND IT IS PAID THREE TIMES
 *
 * Fifteen cards instead of five, on a well 439px tall with a 425px ceiling
 * before the composite's own top edge centres into the instructor-video
 * reserve. Measured, this lands at 394px, which fits, and it fits only because
 * the cards carry no icon and the consequence line is set inline with the term
 * name rather than on a line of its own. There is no room here for a caption
 * and no room for a two-line consequence.
 *
 * GEOMETRY
 *
 * A fixed 1080x394 stage.
 *
 *   LANE_PITCH 146   a 24px label row, 4px, a 74px chain, and 44px underneath
 *                    for the approval mark's words. 146 is set by the tightest
 *                    pair in the figure: Delivery's `A person presses` ends at
 *                    y=284 and Deployment's label starts at y=292.
 *   label            ONE line. Name at 17px bold, consequence at 16px, both on
 *                    the same baseline, because a second line per lane is 3 x
 *                    22px and the figure has 31px of headroom.
 */

const LANE_PITCH = 146
const LANE_Y = (i: number) => i * LANE_PITCH
const LABEL_H = 24
const CHAIN_DY = 28
const H = LANE_Y(2) + CHAIN_DY + CHAIN.CARD_H

/*
  `caption` IS NOT IN THIS FIGURE'S PROPS, AND THE OMISSION IS LOAD-BEARING.

  `CicdReachProps` carries `caption?: ReactNode` because three of the four lab
  candidates have room for one. This one does not: the docstring above says so
  ("no room here for a caption and no room for a two-line consequence"), and it
  is a consequence of the 394px height, not an oversight.

  It used to take the shared props whole and drop the caption on the floor.
  Session 7's `c2-how-far-it-goes` passed one carrying the verdict of the concept
  ("we build up to Continuous Delivery") and it rendered nowhere: every harness
  passed, because a string that is never in the DOM cannot overflow, wrap or
  drift. `Omit` makes that a typecheck error at the call site instead.

  A verdict for this figure rides on the `then` line of the term it is about.
*/
export function ThreeLanes({ stages, terms, className = '' }: Omit<CicdReachProps, 'caption'>) {
  const shown = useBeats(1 + terms.length)

  return (
    <figure className={`relative mx-auto ${className}`} style={{ width: CHAIN.W, height: H }}>
      {terms.map((term, i) => {
        const at = i + 1
        const on = shown[at]
        const paint = REACH_PAINT[term.tone]
        const y = LANE_Y(i)
        /*
          LANE 0 IS ON SCREEN AT BEAT 0, AND IT IS THE PLAIN CHAIN.

          Every candidate's first beat is "the chain", with no term named. The
          other three can show a bare chain because their terms are drawn
          somewhere else on the canvas. This one cannot: its terms ARE chains. So
          lane 0 arrives neutral, un-dimmed and unlabelled, and the first click
          turns it into Continuous Integration rather than adding a fourth
          object. The alternative, three pale skeletons on entry, opens the slide
          on fifteen cards nobody has been introduced to.
        */
        const isBase = i === 0
        const litThrough = isBase && !on ? undefined : term.reaches
        return (
          <div key={term.name}>
            <FcNodeIn
              at={at}
              shown={on}
              className="absolute"
              style={{ left: 0, top: y, width: CHAIN.W, height: LABEL_H }}
            >
              <div className="flex items-baseline gap-2">
                <span
                  className="font-heading font-bold"
                  style={{ fontSize: 17, lineHeight: 1.25, color: paint }}
                >
                  {term.name}
                </span>
                <span style={{ fontSize: 16, lineHeight: 1.25, color: colors.body }}>
                  {term.then}
                </span>
              </div>
            </FcNodeIn>

            {isBase ? (
              <div className="absolute" style={{ left: 0, top: y + CHAIN_DY }}>
                <ReachChain
                  stages={stages}
                  tone={paint}
                  litThrough={litThrough}
                  prefix={`lane${i}`}
                />
              </div>
            ) : (
              <FcNodeIn
                at={at}
                shown={on}
                className="absolute"
                style={{ left: 0, top: y + CHAIN_DY }}
              >
                <ReachChain
                  stages={stages}
                  tone={paint}
                  litThrough={litThrough}
                  prefix={`lane${i}`}
                />
              </FcNodeIn>
            )}

            {term.approval && (
              <ApprovalMark
                x={CHAIN.PITCH * (term.reaches - 1) + CHAIN.SLOT}
                y={y + CHAIN_DY + CHAIN.CARD_H / 2}
                height={CHAIN.CARD_H + 16}
                tone={paint}
                labelSide="below"
                shown={on}
              />
            )}
          </div>
        )
      })}
    </figure>
  )
}
