import type { CSSProperties, ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { colors, fonts } from '@/design/tokens'
import { T, E, c4 } from '@/ui/figureTiming'
import { useInstant } from '@/motion/instant'

/**
 * OBJECT STATE — one named object, its attributes, and which of them just moved.
 *
 * PROMOTED OUT OF `oops_theory/state_behaviour_constructor`, WHERE IT CARRIED
 * ELEVEN SLIDES.
 *
 * Any deck that teaches objects needs this picture, and it is not Docker, Django
 * or OOP specific: the contract is a named thing and the values it is holding
 * right now. A build with its settings, a request with its headers, a container
 * with its ports.
 *
 * WHY NOTHING ELSE IN THE KIT DRAWS IT
 *
 * An object-with-values is the single most frequent picture an OOP deck needs,
 * and every existing candidate is a different shape of thing:
 *
 *   1. **`DataTable`** says "these rows are data". They are, but the point is
 *      not the rows: it is that they BELONG to `book1` and that `book2` has its
 *      own set. A table has no owner to attach them to, so the identity, which
 *      is the whole teaching, has to go in the caption.
 *   2. **`definitions/*`** define words. `title` here is not being defined, it
 *      is holding a value, and a definition card sets the term at display size
 *      and the meaning as prose. Both are wrong for `title : "Harry Potter"`.
 *   3. **`points/PeerCards`** states claims. `Speed : 3` is not a claim.
 *   4. **`Card` with a `title`** has no row structure and nowhere to mark a row.
 *
 * THE `changed` FLAG IS THE ARGUMENT, NOT A DECORATION
 *
 * Five slides in this deck exist to say one thing: `borrow()` moved `available`
 * and left `title` and `author` exactly as they were. Draw the after-state
 * without marking which row moved and the room has to diff two cards by eye,
 * which is the work the figure was supposed to do for them. So `changed` lights
 * the row, and it lands on its own late beat rather than with the row, so the
 * room reads the object first and the delta second.
 *
 * DOM ELEMENTS, NOT AN `<svg>`, AND THAT IS A HARD REQUIREMENT
 *
 * Content rule 17: `qa.mjs`, `video-safe.mjs` and `align-check.mjs` all measure
 * DOM rectangles, and an `<svg>` is ONE rectangle to all three. A figure whose
 * internal `<text>` labels sit on top of each other passes every sweep. This
 * figure is almost entirely labels, so every one of them is a real DOM node in
 * normal flow: the harnesses can see them, and CSS keeps them apart rather than
 * a coordinate that was right until the font rendered wider than assumed.
 *
 * MOTION
 *
 * Explanatory tier from `figureTiming.ts`, and it AUTO-PLAYS rather than
 * click-gating. Hard rule 6: this figure supports the slide's text, so it has to
 * arrive with it. A click-gated card would leave the lead sentence on screen
 * beside an empty space until the presenter clicked.
 */

export interface StateRow {
  /** The attribute's name, as it appears in the pseudocode. */
  name: string
  /** Its value right now. Rendered in the mono face: it is a literal. */
  value: ReactNode
  /**
   * This row moved. Lights the row and prints the mark.
   *
   * Only ever true on an AFTER card. Marking a row on a before card claims a
   * change the slide has not shown yet.
   */
  changed?: boolean
}

export interface ObjectStateProps {
  /** The variable holding the object: `book1`, `account1`, `Fan Right Now`. */
  name: string
  rows: StateRow[]
  /** One line under the card. Never the definition of anything. */
  caption?: ReactNode
  /** Dim the whole card, for the object a slide is NOT talking about. */
  muted?: boolean
  /** Beats already spent before this card starts, so a pair can stagger. */
  delay?: number
  width?: number
  className?: string
}

/** What a row says when it has moved. One word, so it cannot wrap. */
const CHANGED_MARK = 'changed'

export function ObjectState({
  name,
  rows,
  caption,
  muted = false,
  delay = 0,
  width,
  className = '',
}: ObjectStateProps) {
  const reduced = useReducedMotion()
  const instant = useInstant()
  const still = Boolean(reduced) || instant

  /*
    THE NAME COLUMN IS SIZED FROM THE LONGEST NAME, ONCE.

    Every row's value then starts at the same x, which is the only reason a
    three-row card reads as a set of pairs rather than as six loose words. 8.4px
    per character is JetBrains Mono at 14px; the floor of 84px keeps a one-letter
    attribute from collapsing the gutter.
  */
  const nameCol = Math.max(84, Math.max(...rows.map((r) => r.name.length)) * 8.4 + 8)

  const card: CSSProperties = {
    width: width ? `${width}px` : undefined,
    background: colors.white,
    border: `1px solid ${muted ? colors.line : colors.surface2}`,
    borderRadius: 16,
    boxShadow: muted ? 'none' : '0 8px 24px rgba(11, 26, 43, 0.07)',
    opacity: muted ? 0.62 : 1,
    overflow: 'hidden',
  }

  return (
    <div className={`inline-block align-top ${className}`}>
      <motion.div
        style={card}
        initial={still ? false : { opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: muted ? 0.62 : 1, y: 0, scale: 1 }}
        transition={{ duration: T.enter, delay: T.lead + delay, ease: c4(E.out) }}
      >
        {/* the identity band. The object's name is the reason this is not a table. */}
        <div
          style={{
            background: muted ? colors.surface : colors.brandDeep,
            padding: '10px 18px',
          }}
        >
          {/*
            THE NAME IS ITS OWN SPAN, AND THE `lineHeight` IS EXPLICIT.

            `align-check.mjs` counts a label's lines as `height / lineHeight` on
            every LEAF element set in the mono face. With the text sitting
            directly in the padded div, the leaf's height was 20px of padding plus
            a line, `line-height: normal` gave it no number to divide by so it
            fell back to `fontSize * 1.4`, and every object card in the deck was
            reported as a one-token label wrapped over two lines:

                slide  9  WRAPPED  one token over 2 lines: "Book"

            The padding is real and the wrap was not. An inner span with a stated
            line height makes the measured box the text's box, which is what the
            harness is actually asking about.
          */}
          <span
            style={{
              display: 'block',
              fontFamily: fonts.mono,
              fontSize: 15,
              lineHeight: '18px',
              fontWeight: 700,
              letterSpacing: '0.01em',
              color: muted ? colors.body : colors.white,
            }}
          >
            {name}
          </span>
        </div>

        <div style={{ padding: '12px 18px 14px' }}>
          {rows.map((r, i) => (
            <motion.div
              key={r.name}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 12,
                padding: '7px 0',
                borderTop: i === 0 ? 'none' : `1px solid ${colors.surface}`,
              }}
              initial={still ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: T.enter,
                delay: T.lead + delay + 0.1 + i * T.stagger,
                ease: c4(E.out),
              }}
            >
              <span
                style={{
                  width: nameCol,
                  flex: '0 0 auto',
                  fontFamily: fonts.mono,
                  fontSize: 14,
                  lineHeight: '20px',
                  color: colors.muted,
                }}
              >
                {r.name}
              </span>
              <span
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 15,
                  lineHeight: '20px',
                  fontWeight: r.changed ? 700 : 500,
                  color: r.changed ? colors.brand : colors.ink,
                }}
              >
                {r.value}
              </span>
              {r.changed && (
                /*
                  THE DELTA LANDS LAST, ON ITS OWN BEAT.

                  `T.draw` after the card, not with it: the room reads the object,
                  then sees which row moved. Arriving together makes the mark part
                  of the card's furniture and it stops being an event.
                */
                <motion.span
                  style={{
                    marginLeft: 'auto',
                    flex: '0 0 auto',
                    fontFamily: fonts.body,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: colors.brand,
                    background: colors.surface2,
                    borderRadius: 999,
                    padding: '3px 9px',
                  }}
                  initial={still ? false : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: T.label,
                    delay: T.lead + delay + T.draw,
                    ease: c4(E.out),
                  }}
                >
                  {CHANGED_MARK}
                </motion.span>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {caption && (
        <motion.p
          style={{
            marginTop: 10,
            maxWidth: width ? `${width}px` : 320,
            fontFamily: fonts.body,
            fontSize: 13,
            lineHeight: 1.5,
            color: colors.body,
          }}
          initial={still ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: T.label, delay: T.lead + delay + T.draw, ease: c4(E.out) }}
        >
          {caption}
        </motion.p>
      )}
    </div>
  )
}

/**
 * A row of `ObjectState` cards that arrive one after another.
 *
 * Exists so the two-book and three-object slides do not each write their own
 * flex row with their own gap and their own stagger arithmetic. The gap is 28px
 * because two 320px cards plus 28px is 668px, which sits inside the content well
 * with room for the text column beside it.
 */
export function ObjectStateRow({
  objects,
  gap = 28,
  className = '',
}: {
  objects: (ObjectStateProps & { key?: string })[]
  gap?: number
  className?: string
}) {
  return (
    <div className={`flex flex-wrap items-start ${className}`} style={{ gap }}>
      {objects.map((o, i) => (
        <ObjectState key={o.key ?? o.name} {...o} delay={(o.delay ?? 0) + i * T.stagger * 2} />
      ))}
    </div>
  )
}
