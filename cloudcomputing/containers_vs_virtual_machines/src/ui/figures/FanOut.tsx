import type { ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { iconByName, type IconName } from '@/ui/icons'
import { FcArrowDefs, FcEdgeDraw, FcEdgeLabel, FcNodeIn, useBeats } from '@/ui/figures/motion'

/**
 * FAN OUT — one thing on the left, many copies of it on the right.
 *
 * THE ARGUMENT
 *
 * A chain says "this becomes that". A fan-out says something a chain structurally
 * cannot: that ONE artefact is the origin of SEVERAL live things, and that it does
 * not change or divide when they are made. The source keeps its single box at full
 * size while three connectors leave it at once, so the room reads multiplicity
 * rather than sequence. Docker is the first caller, one image and many containers,
 * and the same figure draws one build and many environments, one template and many
 * generated files, one migration and many databases.
 *
 * The source is deliberately drawn as the QUIET box: dashed border, tinted ground,
 * no live dot. Everything that moves is on the right. That contrast is the whole
 * teaching, because the mistake the figure exists to prevent is thinking the source
 * is one of the running things.
 *
 * WHAT IT IS WORST AT
 *
 * ANY RELATIONSHIP BETWEEN THE COPIES. They are drawn as a stack of peers with no
 * connectors between them, so a slide claiming that copy 2 was made from copy 1, or
 * that they share a volume, or that traffic is balanced across them, is claiming it
 * in the voice of the presenter and not in the figure. Three containers that talk
 * to each other are a topology, and this draws four unrelated boxes.
 *
 * Second, it has no room for a second source. One image and many containers is its
 * shape; two images feeding six containers needs two of these stacked, which does
 * not fit the 400px budget, or a different figure entirely.
 *
 * GEOMETRY, AND THE PADDING ARITHMETIC
 *
 * A 900px stage on the 1280x720 slide. The source card is 300 wide at x=0, the
 * copies are 300 wide at x=600, and the 300px between them is the connector fan,
 * which is what gives three curves room to separate rather than overlapping into
 * one thick line.
 *
 * HEIGHT IS DERIVED FROM THE COPY COUNT, not declared, so a fourth copy can never
 * silently overlap a third: each copy card is 66px on a 78px pitch, so the stack is
 * `n * 66 + (n - 1) * 12`. Three copies is the design point at 222px, and with the
 * caption the figure is 258px. Four is 300px and still fits. FIVE IS THE CEILING at
 * 378px plus caption; past that the figure is taller than the well and the honest
 * edit is two slides.
 *
 * PADDING IS A FLOOR, NOT A DECLARATION. What a box shows is
 * `(box height - content height) / 2`, and a sibling lab shipped four cards at 0px
 * and one at -7px while all five declared 12px, so every number here is derived
 * from the fixture's own worst case:
 *
 *   COPY CARD. Content is a 15px label on 1.3 leading (19.5px), a 3px gap, and an
 *   11.5px note on 1.35 (15.5px) = 38px. CARD_H 66 shows (66 - 38) / 2 = **14px**
 *   real, against 14 declared. Content width is 300 - 28 (px-14) - 8 (the dot) - 10
 *   (its gap) = 254px, so a label at 15px semibold (about 8.7px a character) fits
 *   29 characters on one line and the note fits 45 at 11.5px.
 *
 *   SOURCE CARD. A 28px icon tile, an 8px gap, a 19px label on 1.3 (24.7px), a 4px
 *   gap and a 12px caption on 1.3 (15.6px). MEASURED in the browser rather than
 *   added up here, because the icon tile's own margin collapses into the stack: the
 *   union of the boxed descendants is 77px, so CARD_H 117 shows
 *   (117 - 77) / 2 = **20px** real, against 18 declared. Content width is
 *   300 - 36 = 264px: 24 characters of 19px label, 44 of 12px caption.
 *
 *   Both numbers are readings, not sums. Walk the card's descendants that have a
 *   box, take the union, and halve the difference: the trap is that a default body
 *   wrapped in a `display: contents` span has NO box, which made a first attempt at
 *   this measurement report zero content height for every card in a sibling lab.
 *
 * The source is centred on the copy stack rather than pinned to the top, so the fan
 * is symmetrical and the middle connector is horizontal. With an even number of
 * copies there is no middle one, and that is fine: the two central curves mirror.
 */

/** One of the things made from the source. */
export interface FanOutCopy {
  id: string
  label: string
  /** One short line under the label. Its own state, never a repeat of the label. */
  note?: string
  /**
   * This copy is running.
   *
   * Draws the pulse dot. Deliberately per copy rather than a property of the
   * figure, because "one image, three containers, two of them stopped" is a real
   * slide and a figure that could not say it would make the author draw two.
   */
  live?: boolean
}

/** The single thing every copy is made from. */
export interface FanOutSource {
  label: string
  /** What KIND of thing it is, in two or three words. */
  caption?: string
  icon?: IconName
}

export interface FanOutProps {
  source: FanOutSource
  copies: FanOutCopy[]
  caption?: ReactNode
  className?: string
}

/* Stage. See the height arithmetic in the doc comment. */
const COPY_H = 66
const COPY_PITCH = 78
const SOURCE_H = 117
const CAPTION_GAP = 10
const CAPTION_H = 26

const copyTop = (i: number) => i * COPY_PITCH

/**
 * `size` EXISTS BECAUSE 900px IS A WHOLE SLIDE, AND THIS FIGURE IS OFTEN HALF OF ONE.
 *
 * `full` is the 900px stage this was built at: a 300px card either side of a 300px
 * fan, which is right when the figure owns the slide, as it does in the gallery.
 *
 * `half` is 460: a 150px card either side of a 160px fan. It exists because session
 * 1 v3 pairs this figure with a four-point column, and at 900px the figure squeezed
 * that column to about 150px, wrapped every point to four or five lines, printed the
 * first one over the title and ran the last off the bottom of the frame. The cards
 * hold a label and a note at their own type sizes either way; what shrinks is the
 * card WIDTH and the length of the fan, which is why the labels stay readable.
 *
 * Two named sizes rather than an arbitrary `width`, so the arithmetic in this file
 * stays two columns of numbers that were each checked against a render.
 */
const SIZES = {
  full: { W: 900, CARD_W: 300, COPY_X: 600 },
  half: { W: 460, CARD_W: 150, COPY_X: 300 },
} as const

export function FanOut({
  source,
  copies,
  caption,
  size = 'full',
  className = '',
}: FanOutProps & { size?: keyof typeof SIZES }) {
  const { W, CARD_W, COPY_X } = SIZES[size]
  const stackH = copies.length ? copies.length * COPY_H + (copies.length - 1) * (COPY_PITCH - COPY_H) : 0
  const bodyH = Math.max(stackH, SOURCE_H)
  const figureH = bodyH + CAPTION_GAP + CAPTION_H

  /* The source is centred on the stack, so the fan is symmetrical. */
  const sourceTop = (bodyH - SOURCE_H) / 2
  const stackTop = (bodyH - stackH) / 2

  /*
    BEATS. Beat 0 is free and carries the SOURCE, so the slide opens on the thing
    every copy comes from rather than on an empty stage, and no click does nothing.
    Then one click per copy, its connector drawing as its card lands, then the
    caption. Count is derived from `copies.length` and never from state, so the
    number of build steps the slide registers is stable while it is up.
  */
  const CAPTION = copies.length + 1
  const shown = useBeats(CAPTION + 1)

  const Icon = source.icon ? iconByName[source.icon] : null

  return (
    <figure className={`relative mx-auto ${className}`} style={{ width: W, height: figureH }}>
      {/* THE FAN. One aria-hidden SVG layer under the cards: the curves are
          geometry, and every label on this figure is a real DOM element, per
          content rule 17. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0"
        width={W}
        height={figureH}
        viewBox={`0 0 ${W} ${figureH}`}
      >
        <FcArrowDefs id="fanout" colors={{ copy: colors.brand }} />
        {copies.map((c, i) => {
          const sy = sourceTop + SOURCE_H / 2
          const ty = stackTop + copyTop(i) + COPY_H / 2
          const x0 = CARD_W
          const x1 = COPY_X - 8
          const mid = (x0 + x1) / 2
          return (
            <FcEdgeDraw
              key={c.id}
              /* A cubic with both handles at the horizontal midpoint: it leaves the
                 source level and arrives level, which is what makes three of them
                 read as one fan rather than three diagonals. */
              d={`M ${x0} ${sy} C ${mid} ${sy}, ${mid} ${ty}, ${x1} ${ty}`}
              at={i + 1}
              shown={shown[i + 1]}
              stroke={colors.brand}
              width={2}
              markerEnd="url(#fanout-copy)"
            />
          )
        })}
      </svg>

      {/* THE SOURCE. Quiet on purpose: dashed, tinted, and the only box with no
          live dot. The mistake this figure exists to prevent is reading the source
          as one of the running things. */}
      <FcNodeIn
        at={0}
        shown={shown[0]}
        className="absolute"
        style={{ left: 0, top: sourceTop, width: CARD_W, height: SOURCE_H }}
      >
        <div
          className="flex h-full w-full flex-col items-center justify-center rounded-card border-2 border-dashed px-[18px] py-[18px] text-center"
          style={{ borderColor: colors.muted, background: colors.surface }}
        >
          {Icon && (
            <span
              className="mb-2 grid h-7 w-7 place-items-center rounded-lg"
              style={{ background: `${colors.muted}26`, color: colors.body }}
            >
              <Icon width={16} height={16} />
            </span>
          )}
          <span
            className="block font-heading text-[19px] font-bold leading-[1.3]"
            style={{ color: colors.body }}
          >
            {source.label}
          </span>
          {source.caption && (
            <span className="mt-1 block text-[12px] leading-[1.3]" style={{ color: colors.muted }}>
              {source.caption}
            </span>
          )}
        </div>
      </FcNodeIn>

      {/* THE COPIES. Peers, drawn identically, with no connectors between them:
          anything about how they relate to each other is a claim this figure does
          not make. */}
      {copies.map((c, i) => (
        <FcNodeIn
          key={c.id}
          at={i + 1}
          shown={shown[i + 1]}
          className="absolute"
          style={{ left: COPY_X, top: stackTop + copyTop(i), width: CARD_W, height: COPY_H }}
        >
          <div
            className="flex h-full w-full items-center gap-2.5 rounded-card border-2 bg-white px-3.5 py-3.5"
            style={{ borderColor: colors.brand }}
          >
            {/* The pulse is a CSS animation, so `index.css`'s reduced-motion block
                clamps it. framer would need its own guard. */}
            <span
              aria-hidden
              className={`h-2 w-2 shrink-0 rounded-full ${c.live ? 'animate-pulse' : ''}`}
              style={{ background: c.live ? colors.brand : colors.line }}
            />
            <span className="min-w-0">
              <span
                className="block truncate font-heading text-[15px] font-semibold leading-[1.3]"
                style={{ color: colors.ink }}
              >
                {c.label}
              </span>
              {c.note && (
                <span
                  className="mt-[3px] block truncate text-[11.5px] leading-[1.35]"
                  style={{ color: colors.muted }}
                >
                  {c.note}
                </span>
              )}
            </span>
          </div>
        </FcNodeIn>
      ))}

      {caption && (
        <FcEdgeLabel
          at={CAPTION}
          shown={shown[CAPTION]}
          className="absolute text-center text-body-sm"
          style={{ left: 0, width: W, top: bodyH + CAPTION_GAP, color: colors.body }}
        >
          {caption}
        </FcEdgeLabel>
      )}
    </figure>
  )
}
