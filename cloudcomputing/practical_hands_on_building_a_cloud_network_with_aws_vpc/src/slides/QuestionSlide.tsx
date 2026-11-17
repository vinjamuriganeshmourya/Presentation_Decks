import { SlideBase } from '@/ui/SlideBase'
import { Kicker } from '@/ui/primitives'
import { RevealGroup, Reveal } from '@/motion/Reveal'
import { accentByTone, colors } from '@/design/tokens'
import type { QuestionSlideProps } from './types'

/**
 * QUESTION — the pause beat. One question, on a card, and nothing else.
 *
 * WHY THIS IS ITS OWN TYPE
 *
 * A question posed to the room was previously written as a `ContentSlide` with
 * a `lead` and no points. That inherits the content layout: the header sits
 * top-left at its usual size and the body well below it is simply empty, so the
 * slide reads as a content slide someone forgot to finish. The question is also
 * set at lead size, which is smaller than the title above it, so the one thing
 * the room is meant to think about is not the largest thing on screen.
 *
 * This type inverts that. There is no header block and no body well: the
 * question IS the slide, set at hero scale.
 *
 * `choices` is the one thing allowed on the card besides the question and its
 * qualifier: the two or three answers the room is picking between, drawn as
 * identical boxes. It replaces the stage direction decks kept printing as a
 * bullet ("say yes or no before the next slide"), which told the room how to
 * behave instead of showing it what it was choosing. The boxes never mark which
 * one is right; the answer is still the next slide.
 *
 * WHY A CARD RATHER THAN BARE TEXT
 *
 * The first version of this type was a centred sentence on an empty canvas. The
 * emptiness was deliberate, but on a projector it read as an unfinished slide
 * rather than as a deliberate pause: nothing on screen said "this frame is a
 * different kind of frame". The card gives the beat an edge and a shadow, and
 * the oversized question mark behind it names the beat without adding a word to
 * read. Everything the room is asked to think about is still one sentence.
 *
 * WHAT IT MUST NOT CARRY
 *
 * No bullets, no figure, no callout, no answer. A question slide exists so the
 * room answers out loud before the next slide responds, and anything else on it
 * is something to read instead of think. If a slide needs supporting content,
 * it is a `ContentSlide` whose lead happens to end in a question mark, and that
 * is a different slide.
 *
 * One question per slide. A compound question ("what happens, and why?") gets
 * split, for the same reason a slide carries one idea.
 *
 * THE VIDEO RECTANGLE
 *
 * x 913..1280, y 0..220 is kept clear for the instructor video. The card is
 * left-aligned and capped at 840px, which is 66% of the canvas and the widest it
 * can be while its right edge still clears x 913. `SlideBase` already applies the
 * px-16 gutter, so this layout adds none of its own: a second one pushed the card
 * to x 128 and off the deck's left datum. It therefore never
 * reaches the rectangle at any height: the layout needs no vertical fudge to
 * stay clear, and a longer question simply grows the card downward. The question mark sits on
 * the right, in the band the card leaves empty. It is `pointer-events-none`, so
 * the checker skips it the way it skips every other decorative layer.
 *
 * The mark is a FLEX SIBLING of the card, not an absolutely-positioned layer:
 * that is what keeps the two optically parallel. Both sit on the row's centre
 * line, so a longer question grows the card in both directions and the mark
 * stays level with it instead of drifting off a hardcoded top offset.
 *
 * THE CARD HAS A FLOOR, AND THAT IS WHAT KEEPS `align-check` QUIET. A card sized
 * purely to its text leaves a deep empty band under it on a short question, which
 * the harness reports as tail drift (over 170px). `min-h-[440px]` with the
 * content centred inside means a one-line question and a three-line one occupy
 * the same block, so the pause beat is the same shape wherever it falls.
 */
export function QuestionSlide({
  kicker = 'A Question First',
  question,
  qualifier,
  choices,
  tone = 'brand',
  lesson,
}: QuestionSlideProps) {
  const accent = accentByTone[tone]
  return (
    <SlideBase variant="light" lesson={lesson}>
      {/*
        The mark, not a character: one glyph at display scale, low enough in
        opacity that the card reads over it. Set in the heading face so it is
        the same question mark the copy uses.
      */}
      {/* `data-align-exempt` is read by align-check.mjs: this frame is centred on
          purpose, so the empty band under the card is not tail drift. See the
          named opt-out in that harness. */}
      <div data-align-exempt="centred" className="flex h-full items-center gap-8">
        <RevealGroup stagger={0.14}>
          <Reveal dir="up">
            <div className="relative z-10 flex min-h-[440px] w-full max-w-[840px] flex-col justify-center rounded-card border border-line bg-surface-card px-14 py-12 text-left shadow-card">
              <Kicker tone={tone}>{kicker}</Kicker>
              {/*
                LEADING IS SET HERE, NOT LEFT TO THE TYPE TOKEN.

                `slide-title-lg` is 44px at 1.08, a 47.5px line box. An inline
                `Code` chip at 0.94em paints roughly 53px once its vertical
                padding is added, and for an INLINE non-replaced element that
                padding is painted WITHOUT expanding the line box. So a chip in
                a hero question spills onto the lines either side of it: session
                6's `c4-question` rendered both `v1` chips overlapping the text
                above them.

                1.08 is also simply too tight for a paragraph three lines long
                at this size. 1.3 gives the chip its room and the question its
                readability, and `min-h-[440px]` on the card absorbs the extra
                height. Set as a style so it cannot lose to the font-size
                utility on stylesheet order.
              */}
              <p
                className="mt-5 font-heading text-slide-title-lg"
                style={{ color: colors.ink, lineHeight: 1.3 }}
              >
                {question}
              </p>
              {qualifier && (
                <>
                  {/* The rule separates the ask from its condition, so the room
                      hears one question and one constraint, not two questions. */}
                  <div
                    className="mt-7 h-[3px] w-20 rounded-pill"
                    style={{ backgroundColor: accent }}
                  />
                  <p className="mt-5 text-body-lg font-medium" style={{ color: colors.body }}>
                    {qualifier}
                  </p>
                </>
              )}
              {choices && choices.length > 0 && (
                /*
                  THE BOXES ARE DRAWN IDENTICALLY, AND THAT IS THE FEATURE.

                  Every box takes the same border, the same tint and the same
                  flex basis, so nothing in the rendering ranks them. The moment
                  one is tinted differently, or drawn larger, or listed first for
                  a reason, the slide has answered its own question and the room
                  reads the answer instead of committing to one.

                  `flex-1` with a floor rather than a fixed width: two boxes and
                  three boxes both fill the card, so a deck does not get a
                  ragged right edge for having asked a three-way question.
                */
                <div className="mt-9 flex gap-4">
                  {choices.map((c, i) => (
                    <div
                      key={i}
                      className="flex min-w-[140px] flex-1 items-center justify-center rounded-card border-2 px-6 py-4 font-heading text-slide-title font-bold"
                      style={{ borderColor: accent, color: accent, background: `${accent}0F` }}
                    >
                      {c}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Reveal>
        </RevealGroup>

        {/* The mark, not a character: one glyph at display scale, low enough in
            opacity that it reads as ground rather than as content. Set in the
            heading face, so it is the same question mark the copy uses. */}
        <div
          aria-hidden
          className="pointer-events-none w-[220px] shrink-0 select-none text-center font-heading font-extrabold leading-none"
          style={{ fontSize: 300, color: accent, opacity: 0.1 }}
        >
          ?
        </div>
      </div>
    </SlideBase>
  )
}
