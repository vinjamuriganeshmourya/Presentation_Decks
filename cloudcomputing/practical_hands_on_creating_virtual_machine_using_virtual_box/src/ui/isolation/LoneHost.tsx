import { RevealGroup, Reveal } from '@/motion/Reveal'
import { colors } from '@/design/tokens'
import { lit, ghost, IconWell } from './isolationChrome'
import { HALF_WIDTH, type IsolationFigureProps } from './isolationFigure'

/**
 * CANDIDATE 3 — LONE HOST. Four identical frames, one of them filled.
 *
 * THE BET
 *
 * Absence is only legible against a place where the thing WOULD be. So every
 * machine here is drawn as the same frame with the same slot in the same
 * position, and the only difference between the holder and the other three is
 * that its slot has something in it. Nothing is dimmed, nothing is crossed out,
 * and there are no connectors at all.
 *
 * THAT IS THE STRICTEST READING OF CONTENT RULE 8 IN THIS LAB. A severed
 * connector still draws a relationship: something was going to happen and did
 * not. An empty slot draws no relationship whatsoever. The three machines are
 * not blocked, not queued and not stale, they are simply machines with nothing in
 * them, which is the literal truth of a `docker build` that has run once on one
 * laptop.
 *
 * The slots sit at the same offset inside their frame, because the comparison is
 * what carries the meaning. THE LABEL BOX IS A FIXED TWO LINES for exactly that
 * reason: on the first render "An automation server" wrapped, its frame's slot
 * dropped below its neighbours', and the row stopped reading as a comparison at
 * all.
 *
 * WHY IT MIGHT WIN. It is the only candidate with nothing on it that could be
 * misread as "has it, faintly": there is no dimmed copy, no ghosted label of the
 * artefact, no arrow pointing at a machine. Ask a room what is in the second box
 * and the only available answer is "nothing".
 *
 * WORST AT
 *
 * THE THREE ARE PEERS AND THE FIGURE SAYS SO. Three equal frames in a row claim
 * the three machines are the same kind of thing, and on the session 6 slide a
 * teammate's laptop, an automation server and a production host are three
 * different kinds of thing at three different stakes. `SealedBoundary`'s stacked
 * rows can be read in order; this cannot.
 *
 * Second, it is the family's worst fit for the 16px type floor, and this is the
 * finding that the floor exists to surface. At 552px each frame is about 177px
 * wide, so at 16px "An automation server" takes two lines and "cannot deploy it
 * for real users" takes three, which is what makes the frames 190px tall for two
 * short facts. FOUR RECIPIENTS IS 130px A FRAME and the labels stop fitting
 * altogether, so three is a hard ceiling rather than a design point.
 *
 * Third, it draws no cause, exactly as `ReachTable` does not. It shows the state
 * of the world and never says the word "local".
 */

/** The slot: 42px, so a 16px label and a 16px mono ref fit inside the holder's. */
const SLOT_H = 44
const FRAME_GAP = 10
/** Two lines of 16px on 1.2, so a wrapped machine name cannot move the slot. */
const LABEL_H = 39
/* MEASURED at 1280x720 on the session 6 fixture. `GHOST_H` is the row's worst
   case, which is a three-line verb phrase in a 177px frame -- the candidate's
   documented cost of the 16px type floor. A shorter set of verb phrases makes
   this figure SHORTER than stated, never taller, which is the direction a height
   estimate is allowed to be wrong in. */
const HOLDER_H = 140
const GHOST_H = 162
const ROW_GAP = 10

/** See `sealedBoundaryHeight` for why a figure states its height as arithmetic. */
export const loneHostHeight = () => HOLDER_H + ROW_GAP + GHOST_H

export function LoneHost({
  artefact,
  holder,
  recipients,
  negation = 'cannot',
  width = HALF_WIDTH,
  className = '',
}: IsolationFigureProps) {
  const frameW = (width - FRAME_GAP * (recipients.length - 1)) / recipients.length

  return (
    <div className={`mx-auto ${className}`} style={{ width }}>
      <RevealGroup className="flex flex-col" stagger={0.12}>
        {/* THE ONE THAT HAS IT. Same frame as the three below, filled slot. */}
        <Reveal dir="up">
          <div className="rounded-card border-2 px-3.5 pb-3 pt-2.5" style={lit(colors.brand)}>
            <p
              className="text-body-sm font-bold uppercase leading-[1.2] tracking-[0.08em]"
              style={{ color: colors.brandDark, minHeight: LABEL_H }}
            >
              {holder.label}
            </p>
            <div
              className="flex items-center gap-2.5 rounded-lg border-2 px-2.5"
              style={{
                minHeight: SLOT_H,
                borderColor: colors.brand,
                background: [
                  'radial-gradient(120% 200% at 8% 0%, #FFFFFF 0%, #FFFFFF00 62%)',
                  `linear-gradient(135deg, ${colors.surface} 0%, ${colors.surface2} 100%)`,
                ].join(', '),
                boxShadow: `0 2px 8px -4px ${colors.brandDeep}59, inset 0 1px 0 0 #FFFFFF`,
              }}
            >
              <IconWell icon={artefact.icon} tone={colors.brand} size={28} />
              <span className="min-w-0 leading-tight">
                <span className="block text-body-sm font-bold" style={{ color: colors.ink }}>
                  {artefact.label}
                </span>
                {artefact.ref && (
                  <span
                    className="block truncate font-mono text-body-sm"
                    style={{ color: colors.brandDark }}
                  >
                    {artefact.ref}
                  </span>
                )}
              </span>
            </div>
            {holder.note && (
              <p className="mt-2 text-body-sm leading-[1.3]" style={{ color: colors.body }}>
                {holder.note}
              </p>
            )}
          </div>
        </Reveal>

        {/* THE ONES THAT DO NOT. Identical frames, empty slots. */}
        <Reveal dir="up">
          <div className="mt-2.5 flex items-stretch" style={{ gap: FRAME_GAP }}>
            {recipients.map((r) => (
              <div
                key={r.id}
                className="flex flex-col rounded-card border-2 px-2.5 pb-2.5 pt-2.5"
                style={{ width: frameW, ...ghost() }}
              >
                <p
                  className="text-body-sm font-bold uppercase leading-[1.2] tracking-[0.04em]"
                  style={{ color: colors.body, minHeight: LABEL_H }}
                >
                  {r.label}
                </p>
                {/* THE HOLE. Same height and the same place as the holder's tile,
                    so the eye compares the two rather than reading two designs. */}
                <div
                  aria-hidden
                  className="rounded-lg border-2 border-dashed"
                  style={{
                    height: SLOT_H,
                    borderColor: colors.line,
                    background: colors.white,
                    boxShadow: `inset 0 2px 6px -3px ${colors.brandDeep}1f`,
                  }}
                />
                <p
                  className="mt-2 text-body-sm font-semibold leading-[1.25]"
                  style={{ color: colors.danger }}
                >
                  {negation} {r.cannot}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </RevealGroup>
    </div>
  )
}
