import type { ReactNode } from 'react'
import { Step } from '@/motion/Stepper'
import { Reveal, RevealGroup } from '@/motion/Reveal'
import { accentByTone, colors, type Tone } from '@/design/tokens'

/**
 * CHAT THREAD — a conversation drawn as messages.
 *
 * WHY A DECK HAS A CHAT SLIDE AT ALL
 *
 * Some lessons are a misunderstanding being corrected, and the misunderstanding
 * has to be VOICED before it can be corrected. Written as bullets, "your image
 * is 1.2 GB because you based it on the full python image" is a fact the room
 * nods at. Written as two people talking, the room recognises itself in the
 * first line and is already asking the question the second line answers.
 *
 * So this is for a real exchange with a real wrong turn in it. It is not a
 * decorative frame for content that was going to be bullets anyway: two speakers
 * who agree with each other are a `BulletList` wearing a costume, and cost the
 * slide half its width for nothing.
 *
 * THE TWO SIDES ARE NOT SYMMETRIC, ON PURPOSE
 *
 * Left is white on the light ground: the learner, the person with the problem,
 * the side the room is sitting on. Right is a solid brand fill: the answer.
 * Messaging apps have trained everyone that the filled side is "me", and here
 * "me" is the voice the deck wants the room to end up in. Reversing them reads
 * as the learner being corrected AT rather than answered.
 *
 * WIDTH IS CAPPED BY THE VIDEO RECTANGLE, NOT BY TASTE
 *
 * x 913..1280, y 0..220 is held for the instructor video. `SlideBase` opens at
 * x=64, so a thread capped at 840px ends at x=904 and can never reach it at any
 * height — the same 840 that `QuestionSlide` arrived at for the same reason. The
 * cap lives on the SLIDE, not here, because `ChatCharacterSlide` spends part of
 * that budget on the character instead.
 *
 * TURNS ARE BUILD STEPS BY DEFAULT
 *
 * A conversation has an order and the order is the teaching. Revealing all six
 * messages at once lets the room read the answer before it has heard the
 * question, which is the one thing this layout exists to prevent.
 */

export interface ChatTurn {
  /** `left` is the learner / the problem. `right` is the answer. */
  side: 'left' | 'right'
  /** Shown once above the bubble, and only when the speaker changes. */
  speaker?: string
  text: ReactNode
  /**
   * Render the body in the mono face — for a command, a path, or an error
   * message the speaker pasted in. Keeps a literal string literal instead of
   * letting the body face quietly re-space it.
   */
  code?: boolean
}

/** A round initials chip. The character variant swaps this for a figure. */
function Avatar({ name, tone, onBrand }: { name: string; tone: Tone; onBrand: boolean }) {
  const color = accentByTone[tone]
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  return (
    <span
      aria-hidden
      className="mt-6 grid h-10 w-10 shrink-0 place-items-center rounded-full font-heading text-[15px] font-bold"
      style={
        onBrand
          ? { background: color, color: '#FFFFFF' }
          : { background: '#FFFFFF', color, border: `1.5px solid ${colors.line}` }
      }
    >
      {initials}
    </span>
  )
}

export function ChatThread({
  turns,
  /** Names for the initials chips. Pass `false` to drop the chips entirely. */
  who = { left: 'Learner', right: 'Mentor' },
  /** Tone of the right-hand (answer) side. The left side is always neutral. */
  tone = 'brand',
  /** Reveal every turn on entry instead of click-gating them. */
  immediate = false,
  className = '',
}: {
  turns: ChatTurn[]
  who?: { left: string; right: string } | false
  tone?: Tone
  immediate?: boolean
  className?: string
}) {
  const Row = immediate ? Reveal : Step
  const Wrapper = immediate ? RevealGroup : 'div'
  const accent = accentByTone[tone]
  return (
    <Wrapper
      {...(immediate ? ({ stagger: 0.1 } as const) : {})}
      className={`space-y-3 ${className}`}
    >
      {turns.map((turn, i) => {
        const right = turn.side === 'right'
        /* The speaker label repeats only when the voice changes. A name over
           every bubble in a six-turn thread is five labels of pure noise. */
        const showSpeaker = turn.speaker && turns[i - 1]?.speaker !== turn.speaker
        return (
          <Row
            key={i}
            dir={right ? 'left' : 'right'}
            className={`flex items-start gap-3 ${right ? 'flex-row-reverse' : ''}`}
          >
            {who && (
              <Avatar name={right ? who.right : who.left} tone={tone} onBrand={right} />
            )}
            <span className={`flex min-w-0 max-w-[76%] flex-col ${right ? 'items-end' : 'items-start'}`}>
              {showSpeaker && (
                <span className="mb-1 px-1 text-body-sm font-semibold text-muted">
                  {turn.speaker}
                </span>
              )}
              {/* The squared corner points back at the speaker's own side, which
                  is the cue that makes a stack of bubbles read as a direction of
                  travel rather than as a list of boxes. */}
              <span
                className={`inline-block rounded-card px-5 py-3.5 shadow-card-soft ${
                  right ? 'rounded-tr-md' : 'rounded-tl-md'
                } ${turn.code ? 'font-mono text-body' : 'text-body-lg'}`}
                style={
                  right
                    ? { background: accent, color: '#FFFFFF' }
                    : {
                        background: colors.white,
                        color: colors.ink,
                        border: `1px solid ${colors.line}`,
                      }
                }
              >
                {turn.text}
              </span>
            </span>
          </Row>
        )
      })}
    </Wrapper>
  )
}
