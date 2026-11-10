import { SlideBase } from '@/ui/SlideBase'
import { ZonedFrame } from '@/ui/ZonedFrame'
import { Step } from '@/motion/Stepper'
import { RevealGroup, Reveal } from '@/motion/Reveal'
import { accentByTone, colors } from '@/design/tokens'
import { SLIDE_FAMILY } from '@/motion/continuity'
import type { ConversationSlideProps } from './types'

/**
 * CONVERSATION — a two-voice exchange set as a transcript.
 *
 * THE DENSE COUSIN OF `ChatSlide`
 *
 * Same content, different form. `ChatSlide` draws bubbles, which are instantly
 * legible as a conversation and cost about 40% of the slide's width to the empty
 * column beside each message. This draws a transcript: speaker in a fixed
 * gutter, line beside it, full width for the words.
 *
 * So the choice is about length, not taste:
 *
 *   - up to four short turns, and the point is that these are PEOPLE talking
 *     → `ChatSlide`
 *   - five or more turns, or lines that run past a dozen words
 *     → this one
 *
 * A transcript that would fit as bubbles should be bubbles. Bubbles that need
 * six turns should be a transcript. Getting this backwards produces either a
 * wall of grey text or a stack of bubbles running off the bottom of the frame.
 *
 * EXACTLY TWO VOICES
 *
 * `speakers` takes a left and a right and nothing else. Three voices in a
 * teaching transcript is a panel discussion: the room loses track of who holds
 * the correct view, which is the one thing the form is for. A third voice means
 * the content is a `ScenarioSlide`.
 *
 * THE VOICES ARE COLOURED, AND THE COLOUR MEANS SOMETHING
 *
 * Left is muted: the question, the wrong turn, the room's own voice. Right is
 * the tone accent: the answer. Same asymmetry as `ChatThread`, for the same
 * reason — the filled side is the voice the deck wants the room to leave in.
 *
 * THE HEIGHT BUDGET
 *
 * A one-line turn is about 56px and a two-line turn about 84px. The well runs
 * y=220..656 with no lead under the header, so six one-line turns or four
 * two-line turns; a lead costs about 50px of that, which is one turn. `qa.mjs` catches the overflow; the budget is here so it does not have to.
 */
export function ConversationSlide({
  kicker,
  title,
  lead,
  speakers,
  turns,
  tone = 'brand',
  stepped = true,
  lesson,
}: ConversationSlideProps) {
  const accent = accentByTone[tone]
  const Row = stepped ? Step : Reveal
  return (
    <SlideBase variant="light" lesson={lesson} padded={false}>
      <ZonedFrame kicker={kicker} title={title} lead={lead} tone={tone}>
        {/*
          The gutter is a fixed 150px so every line of dialogue starts on the
          same left datum. Sized to the gutter, the names would jump left and
          right with their own length and the transcript would lose the single
          vertical edge that makes it scannable.

          Capped at 1000px rather than 840: this layout is text-only and its
          tallest content sits well below y=220, so it is not competing with
          the instructor-video rectangle the way a figure would. The cap is
          about line length — 1000px at 22px is a comfortable measure, and the
          full 1152 is not.
        */}
        <RevealGroup className="max-w-[1000px] space-y-2" stagger={0.08}>
          {turns.map((turn, i) => {
            const right = turn.side === 'right'
            const name = right ? speakers.right : speakers.left
            /* The name is printed only when the voice changes. Repeating it on
               consecutive turns from the same speaker is noise, and its absence
               is itself the signal that the same person is still talking. */
            const show = turns[i - 1]?.side !== turn.side
            return (
              <Row key={i} dir="up" className="grid grid-cols-[150px_1fr] items-start gap-6">
                <span
                  className="pt-1 text-right font-heading text-body font-bold uppercase tracking-wide"
                  style={{ color: show ? (right ? accent : colors.muted) : 'transparent' }}
                >
                  {name}
                </span>
                {/* The rule is per-row and coloured by voice, so the two sides
                    read as two columns of speech without indenting either one
                    away from the datum. */}
                <span
                  className="border-l-[3px] pl-6"
                  style={{ borderColor: right ? accent : colors.line }}
                >
                  <span
                    className={`block ${
                      turn.code ? 'font-mono text-body' : 'text-body-lg'
                    }`}
                    style={{ color: right ? colors.ink : colors.body }}
                  >
                    {turn.text}
                  </span>
                </span>
              </Row>
            )
          })}
        </RevealGroup>
      </ZonedFrame>
    </SlideBase>
  )
}

ConversationSlide.family = SLIDE_FAMILY.content
