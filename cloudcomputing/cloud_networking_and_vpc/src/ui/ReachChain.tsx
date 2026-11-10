import { colors } from '@/design/tokens'
import { litCard } from '@/ui/annotatedSurface'
import { CHAIN, slotLeft, slotRight, type ReachStage } from './cicdReach'

/**
 * THE CHAIN, DRAWN ONCE, FOR ALL THREE CANDIDATES.
 *
 * `NodeShell.tsx` records what happens when six variants each grow their own
 * copy of a card: the declared padding had already drifted by the second one,
 * and four cards shipped with 0px of the 12px they claimed. Three candidates
 * that differ in HOW THEY MARK REACH must not also differ in how much air is
 * inside a stage card, or the gallery compares the padding instead of the
 * design. So the card lives here and every candidate imports it.
 *
 * GEOMETRY comes from `CHAIN` in `cicdReach.ts` and is stated there.
 *
 * TWO STATES, AND THE SECOND ONE IS NOT A COLOUR
 *
 *   `reached`     a lit card: the accent's ramp, the top hairline, the tinted
 *                 shadow, dark type. Automation has got this far.
 *   `beyond`      a DASHED outline on white, muted type, no shadow. Automation
 *                 has not. This is where a person still has to act.
 *
 * Dashed-versus-solid is deliberate and it is the load-bearing distinction:
 * `ThreeLanes` tells its three lanes apart by where that boundary falls, and a
 * greyscale projector keeps a dashed border while it may not keep a hue. Colour
 * is never the only distinguisher.
 */

export type CardState = 'neutral' | 'reached' | 'beyond'

const ARROW_ID = (prefix: string, key: string) => `${prefix}-arrow-${key}`

export function ReachChainArrowDefs({ prefix, tone }: { prefix: string; tone: string }) {
  return (
    <defs>
      {(
        [
          ['neutral', colors.ink],
          ['reached', tone],
          ['beyond', colors.muted],
        ] as const
      ).map(([key, color]) => (
        <marker
          key={key}
          id={ARROW_ID(prefix, key)}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
        </marker>
      ))}
    </defs>
  )
}

/**
 * One row of five stage cards plus the four connectors between them.
 *
 * `litThrough` is 1-based and inclusive: `2` lights stages 1 and 2 and leaves 3,
 * 4 and 5 dashed. `undefined` draws every card in the NEUTRAL ink tone, which is
 * the chain before any term has been named — beat 0 in every candidate.
 */
export function ReachChain({
  stages,
  tone,
  litThrough,
  prefix,
}: {
  stages: ReachStage[]
  /** The accent for the lit run. Ignored when `litThrough` is undefined. */
  tone: string
  litThrough?: number
  /** Namespaces the arrow marker ids, so two chains on one slide cannot collide. */
  prefix: string
}) {
  const stateOf = (i: number): CardState =>
    litThrough === undefined ? 'neutral' : i < litThrough ? 'reached' : 'beyond'

  const paintOf = (s: CardState) =>
    s === 'reached' ? tone : s === 'neutral' ? colors.ink : colors.muted

  return (
    <div className="relative" style={{ width: CHAIN.W, height: CHAIN.CARD_H }}>
      {/* CONNECTORS. One aria-hidden SVG under the cards: the lines are geometry
          and every label above them is a real element, per content rule 17. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0"
        width={CHAIN.W}
        height={CHAIN.CARD_H}
        viewBox={`0 0 ${CHAIN.W} ${CHAIN.CARD_H}`}
      >
        <ReachChainArrowDefs prefix={prefix} tone={tone} />
        {stages.slice(0, -1).map((s, i) => {
          /* A connector belongs to the WEAKER of the two cards it joins: the
             arrow out of the last automated stage is the one a person has to
             follow by hand, so it goes dashed with the card it points at. */
          const st = stateOf(i + 1)
          return (
            <line
              key={s.n}
              x1={slotRight(i) + 4}
              y1={CHAIN.CARD_H / 2}
              x2={slotLeft(i + 1) - 7}
              y2={CHAIN.CARD_H / 2}
              stroke={paintOf(st)}
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray={st === 'beyond' ? '5 5' : undefined}
              markerEnd={`url(#${ARROW_ID(prefix, st)})`}
              opacity={st === 'beyond' ? 0.85 : 1}
            />
          )
        })}
      </svg>

      {stages.map((s, i) => {
        const st = stateOf(i)
        const accent = paintOf(st)
        return (
          <div
            key={s.n}
            className="absolute flex flex-col justify-center rounded-xl px-4"
            style={{
              left: slotLeft(i),
              top: 0,
              width: CHAIN.SLOT,
              height: CHAIN.CARD_H,
              ...(st === 'beyond'
                ? {
                    background: colors.white,
                    border: `2px dashed ${colors.muted}`,
                  }
                : litCard(accent)),
            }}
          >
            <div
              className="font-heading font-bold uppercase"
              style={{
                fontSize: 17,
                lineHeight: 1.2,
                letterSpacing: '0.04em',
                color: st === 'beyond' ? colors.muted : colors.ink,
              }}
            >
              {s.n} {s.label}
            </div>
            <div
              style={{
                fontSize: 16,
                lineHeight: 1.25,
                color: st === 'beyond' ? colors.muted : colors.body,
              }}
            >
              {s.caption}
            </div>
          </div>
        )
      })}
    </div>
  )
}
