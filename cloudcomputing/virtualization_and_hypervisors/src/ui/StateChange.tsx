import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { colors, fonts } from '@/design/tokens'
import { T, E, c4 } from '@/ui/figureTiming'
import { useInstant } from '@/motion/instant'
import { ObjectState, type StateRow } from './ObjectState'

/**
 * STATE CHANGE — the same object before and after one method ran.
 *
 * Promoted alongside `ObjectState`, which it is built from.
 *
 * THE ARGUMENT
 *
 * This deck's central claim is that state and behaviour are connected: run a
 * method and the object's values move. Two `ObjectState` cards side by side
 * state that and leave the room to diff them. This figure names the method on
 * the arrow between them and marks the rows that actually moved, so the picture
 * makes the claim instead of illustrating it.
 *
 * WHICH ROWS MOVED IS COMPUTED, NOT AUTHORED
 *
 * `changed` on the after card is derived by comparing each row's value with the
 * before card's. An authored flag can disagree with the values printed directly
 * underneath it, and a figure that contradicts itself on screen is worse than no
 * figure. Values are compared as rendered strings, so a row is only comparable
 * when both sides are strings or numbers; a `ReactNode` value is treated as
 * changed, which is the safe direction.
 *
 * WHY NOT `flowchart/SpineFlow`
 *
 * It is the closest existing thing: it draws a labelled edge between two nodes.
 * But an `FcNode`'s label is sized for a claim and one short caption, and its
 * stage height is arithmetic derived from that. Handing it a three-row object
 * card fights geometry the variant computed for something else, and
 * `flowchart-lab`'s own doc comment records what that costs.
 *
 * MOTION: THREE BEATS, AND THE ORDER IS THE TEACHING
 *
 *   1. the before card lands
 *   2. the arrow DRAWS, left to right, over `T.draw`, carrying the method name
 *   3. the after card lands, and its changed rows light last
 *
 * Left to right because that is the direction time runs here. Auto-played, not
 * click-gated, because the slide's text says the same thing and hard rule 6
 * requires them to arrive together.
 *
 * DOM, NOT `<svg>`. Content rule 17: the harnesses see one rectangle for an
 * `<svg>`, so a figure made of labels is made of DOM nodes. The arrow is a
 * `<div>` whose width animates, and its head is a rotated square, so even the
 * connector is measurable.
 */

export interface StateSide {
  /** The variable holding the object. The SAME name on both sides: it is one object. */
  name: string
  rows: StateRow[]
}

export interface StateChangeProps {
  before: StateSide
  /** The call that ran, exactly as it is written in the pseudocode. */
  action: string
  after: StateSide
  /** One line under the whole figure, for the claim the picture makes. */
  caption?: ReactNode
  /** Label over each card. Defaults say what they are. */
  labels?: { before: string; after: string }
  cardWidth?: number
  className?: string
}

const text = (v: ReactNode): string | null =>
  typeof v === 'string' || typeof v === 'number' ? String(v) : null

export function StateChange({
  before,
  action,
  after,
  caption,
  labels = { before: 'Before', after: 'After' },
  cardWidth = 300,
  className = '',
}: StateChangeProps) {
  const reduced = useReducedMotion()
  const instant = useInstant()
  const still = Boolean(reduced) || instant

  const beforeByName = new Map(before.rows.map((r) => [r.name, r.value]))
  const afterRows: StateRow[] = after.rows.map((r) => {
    const was = beforeByName.get(r.name)
    const a = text(r.value)
    const b = text(was)
    return { ...r, changed: a === null || b === null ? was !== r.value : a !== b }
  })

  /* The after card waits for the arrow to finish travelling. */
  const afterDelay = T.draw

  const capLabel = {
    display: 'block',
    marginBottom: 8,
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: colors.muted,
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-center" style={{ gap: 20 }}>
        <div>
          <span style={capLabel}>{labels.before}</span>
          <ObjectState name={before.name} rows={before.rows} width={cardWidth} />
        </div>

        {/* the arrow: a rule that draws, the method name riding above it */}
        <div style={{ width: 168, flex: '0 0 auto', paddingTop: 26 }}>
          <motion.div
            style={{
              fontFamily: fonts.mono,
              fontSize: 14,
              lineHeight: '20px',
              fontWeight: 700,
              color: colors.brand,
              textAlign: 'center',
              marginBottom: 10,
            }}
            initial={still ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: T.label, delay: T.lead + T.enter, ease: c4(E.out) }}
          >
            {action}
          </motion.div>
          <div style={{ position: 'relative', height: 10 }}>
            <motion.div
              style={{
                position: 'absolute',
                left: 0,
                top: 4,
                height: 2,
                background: colors.brand,
                borderRadius: 2,
              }}
              initial={still ? false : { width: 0 }}
              animate={{ width: 150 }}
              transition={{ duration: T.draw, delay: T.lead + T.enter, ease: c4(E.inOut) }}
            />
            <motion.div
              style={{
                position: 'absolute',
                top: 0,
                width: 10,
                height: 10,
                borderTop: `2px solid ${colors.brand}`,
                borderRight: `2px solid ${colors.brand}`,
                transform: 'rotate(45deg)',
              }}
              initial={still ? false : { left: 0, opacity: 0 }}
              animate={{ left: 146, opacity: 1 }}
              transition={{ duration: T.draw, delay: T.lead + T.enter, ease: c4(E.inOut) }}
            />
          </div>
        </div>

        <div>
          <span style={capLabel}>{labels.after}</span>
          <ObjectState
            name={after.name}
            rows={afterRows}
            width={cardWidth}
            delay={afterDelay}
          />
        </div>
      </div>

      {caption && (
        <motion.p
          style={{
            marginTop: 18,
            textAlign: 'center',
            fontFamily: fonts.body,
            fontSize: 14,
            lineHeight: 1.55,
            color: colors.body,
          }}
          initial={still ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: T.label,
            delay: T.lead + afterDelay + T.draw,
            ease: c4(E.out),
          }}
        >
          {caption}
        </motion.p>
      )}
    </div>
  )
}
