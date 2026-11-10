import { SlideBase } from '@/ui/SlideBase'
import { Kicker } from '@/ui/primitives'
import { BulletList } from '@/ui/content'
import { RevealGroup, Reveal } from '@/motion/Reveal'
import { accentByTone, colors } from '@/design/tokens'
import type { QuestionPointsSlideProps } from './types'

/**
 * QUESTION + POINTS — the pause beat, and then the answer on the same frame.
 *
 * HOW THIS DOES NOT BREAK HARD RULE 16
 *
 * Rule 16 says a question slide carries the question and nothing else. It exists
 * so that while the room is thinking, there is nothing on screen to read instead
 * of thinking — a question with its answer printed underneath is not a question,
 * it is a heading.
 *
 * This type keeps that true by making the points BUILD STEPS. At step 0 the
 * slide is the question, the qualifier and nothing else: identical in substance
 * to `QuestionSlide`. The room answers out loud, and only then does the first
 * click bring the first point in. The rule constrains what is on screen while
 * the question is open, and an unrevealed step is not on screen.
 *
 * WHEN TO USE THIS INSTEAD OF `QuestionSlide`
 *
 * Use `QuestionSlide` when the ANSWER IS THE NEXT SLIDE — when the response
 * needs a figure, a terminal, or room to breathe. That is the default and it
 * stays the default.
 *
 * Use this one when the answer is two or three short points and putting them on
 * their own slide would mean the room reads the answer having lost sight of the
 * question. Keeping both on one frame is the argument for this type; if the
 * points do not need the question visible above them, they did not need to be
 * here.
 *
 * WHAT IT STILL MUST NOT CARRY: a figure, a code panel, a callout. Those make it
 * a `ContentSlide` whose lead ends in a question mark, which is a different
 * slide with a different job.
 *
 * LAYOUT
 *
 * No `SlideHeader`. Like `QuestionSlide`, the question IS the slide, so it is
 * set at title scale rather than at lead scale under a larger heading.
 *
 * The card is capped at 840px and left-aligned, so its right edge lands at x=904
 * and clears the instructor-video rectangle (x 913..1280, y 0..220) at any
 * height. `QuestionSlide` arrived at the same number the same way. The card is
 * shorter here than there (`min-h-[220px]` against 440) because the points below
 * it need the rest of the well; there is no oversized `?` glyph for the same
 * reason.
 */
export function QuestionPointsSlide({
  kicker = 'A Question First',
  question,
  qualifier,
  points,
  tone = 'brand',
  lesson,
}: QuestionPointsSlideProps) {
  const accent = accentByTone[tone]
  return (
    <SlideBase variant="light" lesson={lesson}>
      {/* `data-align-exempt` is read by align-check.mjs. The frame is a fixed
          column that grows downward as steps land, so the empty band under it at
          step 0 is the layout working, not tail drift. `QuestionSlide` carries
          the same opt-out. */}
      <div data-align-exempt="centred" className="flex h-full flex-col justify-center">
        <RevealGroup stagger={0.12} className="w-full max-w-[840px]">
          <Reveal dir="up">
            <div className="flex min-h-[220px] w-full flex-col justify-center rounded-card border border-line bg-surface-card px-12 py-9 text-left shadow-card">
              <Kicker tone={tone}>{kicker}</Kicker>
              <p className="mt-4 font-heading text-slide-title" style={{ color: colors.ink }}>
                {question}
              </p>
              {qualifier && (
                <>
                  {/* The rule separates the ask from its condition, so the room
                      hears one question and one constraint, not two questions. */}
                  <div
                    className="mt-5 h-[3px] w-20 rounded-pill"
                    style={{ backgroundColor: accent }}
                  />
                  <p className="mt-4 text-body-lg font-medium" style={{ color: colors.body }}>
                    {qualifier}
                  </p>
                </>
              )}
            </div>
          </Reveal>

          {/*
            NOT `immediate`. The default `BulletList` behaviour is one point per
            click, which is exactly what this type needs and the one thing that
            keeps it compliant with rule 16. Passing `immediate` here would print
            the answer under the question on entry and turn the slide into a
            heading with a list.
          */}
          <div className="mt-7">
            <BulletList items={points} tone={tone} />
          </div>
        </RevealGroup>
      </div>
    </SlideBase>
  )
}
