import { SlideBase } from '@/ui/SlideBase'
import { ZonedFrame } from '@/ui/ZonedFrame'
import { ChatThread } from '@/ui/ChatThread'
import { Illustration } from '@/ui/characters/Illustration'
import { RevealGroup, Reveal } from '@/motion/Reveal'
import { SLIDE_FAMILY } from '@/motion/continuity'
import type { ChatSlideProps, ChatCharacterSlideProps } from './types'

/**
 * CHAT — a conversation drawn as messages.
 *
 * See `src/ui/ChatThread.tsx` for why a deck has this at all, and
 * `ConversationSlide` for when the same content should be a transcript instead
 * (short version: past four turns, or past a dozen words a turn, bubbles run off
 * the bottom of the frame and the transcript is the right form).
 *
 * TURNS ARE BUILD STEPS BY DEFAULT
 *
 * A conversation has an order and the order is the teaching. All six messages at
 * once lets the room read the answer before it has heard the question, which is
 * the one thing this layout exists to prevent. `stepped={false}` exists for a
 * two-turn exchange the instructor reads aloud in one breath.
 *
 * THE WIDTH CAP IS THE VIDEO RECTANGLE
 *
 * x 913..1280, y 0..220 is held for the instructor video. `SlideBase` opens at
 * x=64, so 840px ends at x=904 and clears it at every height — the same number
 * `QuestionSlide` arrived at the same way. Do not widen it to "use the space":
 * that space is not empty, it is reserved.
 *
 * THE HEIGHT BUDGET
 *
 * A one-line bubble with its avatar is about 74px, and each turn adds 12px of
 * gap. The well runs y=220..656 with no lead under the header, so FIVE one-line
 * turns, or four if two of them wrap; a lead costs about 50px of that, which is
 * one turn. A six-turn exchange is a `ConversationSlide`.
 */
export function ChatSlide({
  kicker,
  title,
  lead,
  speakers = { left: 'Learner', right: 'Mentor' },
  turns,
  tone = 'brand',
  stepped = true,
  lesson,
}: ChatSlideProps) {
  return (
    <SlideBase variant="light" lesson={lesson} padded={false}>
      <ZonedFrame kicker={kicker} title={title} lead={lead} tone={tone}>
        <div className="w-full max-w-[840px]">
          <ChatThread turns={turns} who={speakers} tone={tone} immediate={!stepped} />
        </div>
      </ZonedFrame>
    </SlideBase>
  )
}
ChatSlide.family = SLIDE_FAMILY.content

/**
 * CHAT WITH A CHARACTER — the same thread, with Nova standing beside it.
 *
 * WHAT THE CHARACTER ADDS, AND WHEN IT DOES NOT
 *
 * It gives the answering voice a face, which is worth doing on the ONE slide in
 * a concept where the exchange is the argument — a misconception being named and
 * corrected. On every chat slide in a row it is wallpaper, and hard rule 8's
 * standard applies to characters as much as to diagrams: a figure that does not
 * make the slide's own argument is decoration.
 *
 * THE CHARACTER IS ON THE LEFT, AND THAT IS NOT A STYLE CHOICE
 *
 * Two reasons, both structural. The instructor-video rectangle (x 913..1280,
 * y 0..220) claims the top right, so a character on the right is a figure placed
 * in the one column that is spoken for. And `Illustration` defaults to facing
 * left, "toward content" — on the right of the thread it would be gesturing off
 * the edge of the slide. So it sits left and takes `facing="right"`, pointing at
 * the messages.
 *
 * THE BUDGET IS TIGHTER THAN `ChatSlide`'s
 *
 * The character column is 190px plus a 40px gap, which comes out of the thread,
 * not out of the slide: the thread is capped at 600px so its right edge lands at
 * x=894 and still clears the video rectangle. A 600px bubble column wraps sooner,
 * so FOUR turns, not five, and shorter ones.
 */
export function ChatCharacterSlide({
  kicker,
  title,
  lead,
  speakers = { left: 'Learner', right: 'Nova' },
  turns,
  tone = 'brand',
  stepped = true,
  character = 'nova-point',
  lesson,
}: ChatCharacterSlideProps) {
  return (
    <SlideBase variant="light" lesson={lesson} padded={false}>
      <ZonedFrame kicker={kicker} title={title} lead={lead} tone={tone}>
        <div className="flex items-center gap-10">
          {/*
            The character reveals WITH the first turn rather than being gated
            behind the thread's steps: hard rule 6 says text and its supporting
            visual arrive together, and a character that walks on after the
            conversation has finished is the visual arriving last.
          */}
          <RevealGroup className="shrink-0">
            <Reveal dir="up">
              <Illustration name={character} facing="right" className="h-[230px] w-[190px]" />
            </Reveal>
          </RevealGroup>
          <div className="min-w-0 flex-1" style={{ maxWidth: 600 }}>
            <ChatThread turns={turns} who={speakers} tone={tone} immediate={!stepped} />
          </div>
        </div>
      </ZonedFrame>
    </SlideBase>
  )
}
ChatCharacterSlide.family = SLIDE_FAMILY.content
