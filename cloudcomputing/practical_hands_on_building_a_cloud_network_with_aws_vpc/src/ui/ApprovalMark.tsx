import { motion, useReducedMotion } from 'framer-motion'
import { litBadge } from '@/ui/annotatedSurface'
import { iconByName } from '@/ui/icons'
import { T, E, c4 } from '@/ui/figureTiming'

/**
 * THE HUMAN APPROVAL STEP, DRAWN ONCE, FOR ALL FOUR CANDIDATES.
 *
 * THE SECOND SCORED CRITERION OF THE LAB, AND THE ONE THE FIRST BRIEF MISSED.
 *
 * Every source that defines the two CDs separates them on one thing and one
 * thing only: continuous delivery needs a person to approve the release into
 * production, and the deployment itself is then automatic. Continuous
 * deployment removes that step and changes nothing else.
 *
 * Reach length alone cannot say that. "Delivery reaches stage 4, deployment
 * reaches stage 5" is true of this chain but it hides the reason, and the reason
 * is the teaching. So the Delivery row carries this mark at its own boundary and
 * the Deployment row is drawn IDENTICALLY WITHOUT IT. Two rows that differ in
 * exactly one mark say "the only difference is the button" in a way two rows of
 * different length cannot.
 *
 * THREE PARTS, AND NONE OF THEM IS A COLOUR
 *
 *   a 4px bar     planted across the boundary, so the stop has a position
 *   a 38px disc   carrying `play`, the glyph session 7 already uses for "a
 *                 person presses the final deploy button"
 *   the words     `A PERSON PRESSES`, at 16px, because an icon alone is a
 *                 rebus and this is the most important sentence on the slide
 *
 * GEOMETRY. The disc is 38px on `x`, which on the chain row puts it over the
 * last 19px of the stage card to its left and 19px of the 45px gap to its
 * right: measured against `CHAIN`, stage 4 spans 675..855 and its caption ends
 * near 786, so the disc covers only that card's empty right margin and never
 * touches stage 5, which starts at 900.
 */
export function ApprovalMark({
  x,
  y,
  height,
  tone,
  labelSide,
  shown,
}: {
  /** The boundary, in figure coordinates. The bar and disc are centred on it. */
  x: number
  /** Vertical centre of the disc. */
  y: number
  /** Height of the bar. */
  height: number
  tone: string
  /**
   * `below` parks the words under the bar, for a candidate whose boundary sits
   * on the chain itself. `right` sets them beside the disc, for a candidate
   * whose band ENDS at the boundary and therefore has empty space to its right,
   * where the words then read as the next thing that happens.
   */
  labelSide: 'below' | 'right'
  shown: boolean
}) {
  const reduce = useReducedMotion()
  const Play = iconByName.play
  const enter = {
    initial: reduce ? false : { opacity: 0, transform: 'scale(0.9)' },
    animate: shown ? { opacity: 1, transform: 'scale(1)' } : { opacity: 0, transform: 'scale(0.9)' },
    /* Lands after the span it terminates has finished extending: the room
       watches the automation reach the boundary, and only then meets the person
       standing at it. */
    transition: { duration: T.enter, delay: shown ? T.drawStep * 0.75 : 0, ease: c4(E.out) },
  }
  return (
    <>
      <motion.div
        aria-hidden
        className="absolute rounded-pill"
        style={{
          left: x - 2,
          top: y - height / 2,
          width: 4,
          height,
          background: tone,
          boxShadow: `inset 1px 0 0 0 #FFFFFF80`,
        }}
        {...enter}
      />
      <motion.div
        className="absolute flex items-center justify-center rounded-full"
        style={{ left: x - 19, top: y - 19, width: 38, height: 38, ...litBadge(tone) }}
        {...enter}
      >
        <Play width={20} height={20} strokeWidth={2.4} />
      </motion.div>
      <motion.div
        className="absolute font-heading font-bold uppercase"
        style={
          labelSide === 'below'
            ? {
                left: x - 110,
                top: y + height / 2 + 8,
                width: 220,
                textAlign: 'center',
                fontSize: 16,
                lineHeight: 1.25,
                letterSpacing: '0.05em',
                color: tone,
              }
            : {
                left: x + 26,
                top: y - 10,
                fontSize: 16,
                lineHeight: 1.25,
                letterSpacing: '0.05em',
                color: tone,
                whiteSpace: 'nowrap',
              }
        }
        {...enter}
      >
        A person presses
      </motion.div>
    </>
  )
}
