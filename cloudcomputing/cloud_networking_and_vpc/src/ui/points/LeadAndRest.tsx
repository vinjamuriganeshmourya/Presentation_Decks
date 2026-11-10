import { colors } from '@/design/tokens'
import { iconByName } from '@/ui/icons'
import { FcEdgeLabel, FcNodeIn, useBeats } from '@/ui/figures/motion'
import { resolvePoints, type PointsFigureProps } from './pointsFigure'
import { HoverAside, MoreDot, ProblemPanel, TermChip, ToneChip, toneOf } from './pointsChrome'

/**
 * LEAD AND REST — one point at the weight it deserves, and the others in support.
 *
 * THE ARGUMENT
 *
 * Most point sets have a lead, and every list format in this kit flattens it. The
 * fixture is the ordinary case: the image is the point the other three are only
 * sayable AFTER, and a bullet list, a row stack and a card row all draw it at
 * exactly the weight of the port. That is not a neutral choice. It is a claim that
 * the four matter equally, made silently, by geometry, against the author's
 * intent.
 *
 * So this variant reads the claim off the contract, `tone: 'lead'`, and spends
 * 440px and 26px type on it while the other three share a 640px column at 17px.
 * The hero is DERIVED, never hardcoded to index 0: an author who marks the third
 * point as the lead gets the third point in the hero panel, which is the only way
 * a figure can be trusted to mean what the data says.
 *
 * It is also the cheapest variant to present. The hero is beat 0, so the slide
 * opens on the one thing the instructor is about to say, and the three supports
 * arrive on three clicks without ever competing with it for the eye.
 *
 * WHAT IT IS WORST AT
 *
 * **It makes a claim about weight, and it will be wrong sometimes.** A set of
 * genuine peers rendered here promotes one of them for no reason, and the room
 * will remember the big one. There is no way to switch that off short of choosing
 * a different variant, which is exactly what `PeerCards` is for. A figure that
 * cannot be neutral must not be the default.
 *
 * Second, and measured: **the support rows are too short for a real reason.** A
 * row gives its reason ONE line of 584px, which at 13.5px is about 86 characters.
 * The fixture's longest reason is 81, so it fits with five characters to spare.
 * Anything longer wraps, the row's content goes from 45px to 64px, and its
 * declared 16px of padding becomes 9. The resolver's 150-character ceiling on a
 * reason is far too generous for this variant, and it is the one place in the lab
 * where the contract permits something a figure cannot draw well.
 *
 * Third, a support row has no room for the tone word. 125px of chip does not fit
 * beside a term and a claim, so a support point's warning is carried by a 4px rule
 * and a hue, and the presenter has to say it. Only the hero states it in words.
 *
 * Fourth, it holds four points and no more. Three support rows fill the hero's own
 * height exactly, so a fifth point has nowhere to go.
 *
 * GEOMETRY, AND THE PADDING ARITHMETIC
 *
 * A fixed 1100x292 stage. Hero 440 wide at x 0, a 20px gap, support column 640
 * wide at x 460: 440 + 20 + 640 = 1100 exactly. Both columns are 258 tall and the
 * caption sits at 266, 26 tall.
 *
 * PADDING IS A FLOOR, NOT A DECLARATION. A box shows `(box - content) / 2`:
 *
 *   THE HERO, content width 440 - 2 x 24 = 392.
 *     icon tile, with the tone chip on the same line    44px
 *     gap                                              12px
 *     term chip, `md`                                  22px
 *     gap                                               8px
 *     claim, 26px on 34px lines, 2 allowed             68px
 *     gap                                              10px
 *     reason, 16px on 23px lines, 2 allowed            46px
 *     -------------------------------------------------------
 *     content                                         210px
 *     HERO_H = 210 + 2 x 24                            258px  -> exactly 24px real
 *
 *   The longest claim is 44 characters of 26px Sora bold at about 15.08px each:
 *   664px, which is 1.69 lines in 392, so 2. The longest reason is 81 characters
 *   of 16px Inter at 8px each: 648px, or 1.65 lines, so 2. Both are exactly at
 *   their allowance, which is why the hero is the panel to watch in review.
 *
 *   A SUPPORT ROW, content width 640 - 2 x 16 = 608, less 24 for the aside dot:
 *     claim line, 17px on 22px, with the `sm` term chip inline   22px
 *     gap                                                        4px
 *     reason, 13.5px on 19px, one line                          19px
 *     ---------------------------------------------------------------
 *     content                                                   45px
 *     ROW_H 82 shows (82 - 45) / 2 =                          18.5px real
 *
 *   The claim line is a 73px term chip plus 8px plus 434px of claim, plus the 6px
 *   aside dot and its 8px gap: 529px inside 608. At the resolver's 52-character
 *   ceiling the claim is 513px and the line comes to 608 exactly, which is the
 *   number to watch in review: this variant has no slack left for a longer claim.
 *   It is also why the tone WORD does not appear on a support row. The reason is 547px inside 584. Three rows of 82 with 6px gaps is
 *   3 x 82 + 2 x 6 = 258, the hero's height to the pixel, which is what makes the
 *   two columns bottom out together rather than approximately.
 */

const W = 1100
const H = 292
const HERO_W = 440
const HERO_H = 258
const HERO_PAD = 24
const REST_X = 460
const REST_W = 640
const ROW_H = 82
const ROW_PITCH = 88
const CAPTION_Y = 266

const rowTop = (i: number) => i * ROW_PITCH

export function LeadAndRest({ points, caption, className = '' }: PointsFigureProps) {
  const g = resolvePoints({ points })

  /*
    THE HERO IS DERIVED, AND THAT IS THE WHOLE POINT OF THE VARIANT.

    `tone: 'lead'` is the author saying which point carries the set. Falling back to
    the first point is right, because a set with no declared lead is almost always
    written lead first, but hardcoding index 0 would make the figure ignore the one
    field it exists to read.
  */
  const heroIdx = Math.max(0, g.points.findIndex((p) => p.tone === 'lead'))
  const hero = g.points[heroIdx]
  const rest = g.points.filter((_p, i) => i !== heroIdx)

  /*
    BEATS. Beat 0 is free and carries the HERO, so the slide opens on the one thing
    the instructor is about to say. Then one click per support row, then the
    caption. Derived from props, never from state, and claimed before the problem
    panel can return: a hook behind an early return appears and disappears with the
    props.
  */
  const CAPTION = g.points.length
  const shown = useBeats(CAPTION + 1)

  /* This variant's own limit: the support column is exactly the hero's height, so
     it runs out of rows rather than degrading quietly. */
  const problems = [...g.problems]
  if (rest.length > 0 && rowTop(rest.length - 1) + ROW_H > HERO_H) {
    problems.push(
      `${g.points.length} points leave ${rest.length} support rows needing ${rowTop(rest.length - 1) + ROW_H}px against the hero's ${HERO_H}px, so this set has no lead to promote`,
    )
  }
  if (problems.length || !hero) {
    return <ProblemPanel problems={problems.length ? problems : ['no points to lead with']} width={W} height={H} />
  }

  const heroPaint = toneOf(hero.tone)
  const HeroIcon = hero.icon ? iconByName[hero.icon as keyof typeof iconByName] : null

  return (
    <figure className={`relative mx-auto ${className}`} style={{ width: W, height: H }}>
      {/* THE LEAD. 440px and 26px type, because the set hangs off it. */}
      <FcNodeIn
        at={0}
        shown={shown[0]}
        /* `absolute` is load-bearing: `.fc-node-slot`'s `z-index` is ignored on a
           static element, and the aside then gets painted over by the support
           column. See the note in `pointsChrome.tsx`. */
        className="absolute"
        style={{ left: 0, top: 0, width: HERO_W, height: HERO_H }}
      >
        <HoverAside detail={hero.detail} label={hero.term ?? 'The lead'} paint={heroPaint} side="bottom">
          <div
            className="flex h-full w-full flex-col rounded-card shadow-card"
            style={{
              /* Opaque base under the tint, so nothing behind the panel reads
                 through it. */
              background: `linear-gradient(${heroPaint}12, ${heroPaint}12), ${colors.white}`,
              border: `1px solid ${heroPaint}3d`,
              borderLeft: `5px solid ${heroPaint}`,
              padding: HERO_PAD,
            }}
          >
            <span className="flex items-center" style={{ height: 44 }}>
              <span
                className="grid shrink-0 place-items-center rounded-xl2"
                style={{ width: 44, height: 44, background: `${heroPaint}1a`, color: heroPaint }}
              >
                {HeroIcon ? <HeroIcon width={22} height={22} /> : null}
              </span>
              <span className="ml-auto flex items-center gap-1.5">
                <ToneChip tone={hero.tone} tag={hero.tag} />
                {hero.detail && <MoreDot paint={heroPaint} />}
              </span>
            </span>

            {hero.term && (
              <span className="mt-3 flex" style={{ height: 22 }}>
                <TermChip term={hero.term} paint={heroPaint} />
              </span>
            )}

            <span
              className="mt-2 block font-heading text-[26px] font-extrabold"
              style={{ color: colors.ink, lineHeight: '34px' }}
            >
              {hero.label}
            </span>

            {hero.body && (
              <span
                className="mt-2.5 block text-[16px]"
                style={{ color: colors.body, lineHeight: '23px' }}
              >
                {hero.body}
              </span>
            )}
          </div>
        </HoverAside>
      </FcNodeIn>

      {/* THE REST. One line for the claim, one for the reason, and the term inline
          rather than in a column of its own: at 640px wide there is no room for a
          marker column that would also fit the 547px reason. */}
      {rest.map((p, i) => {
        const paint = toneOf(p.tone)
        return (
          <FcNodeIn
            key={p.id}
            at={i + 1}
            shown={shown[i + 1]}
            className="absolute"
            style={{ left: REST_X, top: rowTop(i), width: REST_W, height: ROW_H }}
          >
            <HoverAside
              detail={p.detail}
              label={p.term ?? `Point ${i + 2}`}
              paint={paint}
              /* The first two open downward, the last upward, so an aside never
                 leaves the bottom of the slide. */
              side={i < 2 ? 'bottom' : 'top'}
            >
              <div
                className="flex h-full w-full flex-col justify-center rounded-card bg-white shadow-card-soft"
                style={{
                  border: `1px solid ${colors.line}`,
                  borderLeft: `4px solid ${paint}`,
                  paddingLeft: 16,
                  paddingRight: 16,
                }}
              >
                {/* NO TONE WORD ON A SUPPORT ROW, AND THAT IS A MEASURED LOSS.

                    The chip needs about 125px and the claim line has 69px left
                    after the term and the claim. So the tone survives here only as
                    the 4px rule and the chip's hue, which is the thing
                    `pointsChrome` says colour alone cannot carry on a bad
                    projector. The hero keeps its word; a support row's warning is
                    the presenter's to say out loud. */}
                <span className="flex items-center gap-2">
                  {p.term && <TermChip term={p.term} paint={paint} size="sm" />}
                  <span
                    className="min-w-0 flex-1 font-heading text-[17px] font-bold"
                    style={{ color: colors.ink, lineHeight: '22px' }}
                  >
                    {p.label}
                  </span>
                  {p.detail && <MoreDot paint={paint} className="shrink-0" />}
                </span>
                {p.body && (
                  <span
                    className="mt-1 block text-[13.5px]"
                    style={{ color: colors.body, lineHeight: '19px' }}
                  >
                    {p.body}
                  </span>
                )}
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
