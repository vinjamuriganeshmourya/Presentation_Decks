import type { ReactNode } from 'react'
import type { BulletItem } from '@/ui/content'
import type { Step, FlowNode } from '@/ui/flow'
import type { ScenarioBeat } from '@/ui/ScenarioCard'
import type { SyntaxPart } from '@/ui/SyntaxBreakdown'
import type { StatusItem } from '@/ui/StatusList'
import type { ChatTurn } from '@/ui/ChatThread'
import type { IllustrationName } from '@/ui/characters/Illustration'
import type { Tone } from '@/design/tokens'

/** A slide image is either a real asset URL or a built-in illustration. */
export type SlideMedia =
  | { src: string; alt?: string; fit?: 'cover' | 'contain' }
  | { illustration: IllustrationName }

/** Every slide accepts an optional lesson label shown in the footer. */
interface Base {
  lesson?: string
}

export interface BrandSlideProps {
  /** The welcome line under the mark. Brand + welcome only — no session/course text. */
  greeting?: string
  /** Footer session name (rendered without the footer logo — the hero already carries it). */
  lesson?: string
}

export interface WelcomeSlideProps extends Base {
  course?: string
  title: ReactNode
  subtitle?: ReactNode
  presenter?: string
  meta?: string // e.g. date / module
  /**
   * Bare-body hero: only the "Welcome to today's session" kicker + the
   * session name, centered. No body logo (footer carries the single mark),
   * no course chip, presenter, meta, or mascot.
   */
  minimal?: boolean
}

export interface RecapSlideProps extends Base {
  kicker?: string
  title?: ReactNode
  points: (BulletItem | string)[]
  /**
   * All the points on landing instead of one per click. For a recap the room
   * reads as one list (PF 14 "For Loop" showed its three at once).
   */
  immediate?: boolean
}

export interface AgendaSlideProps extends Base {
  kicker?: string
  title?: ReactNode
  lead?: ReactNode
  items: { title: ReactNode; sub?: ReactNode }[]
}

export interface SectionBreakerProps extends Base {
  /** Brand mark shown above the title. Pass the WHITE variant: this stage is brand blue. */
  mark?: string
  markAlt?: string
  index?: number | string
  kicker?: string
  title: ReactNode
  subtitle?: ReactNode
  tone?: Tone
}

export interface SectionBreakerImageProps extends SectionBreakerProps {
  media?: SlideMedia
}

export interface ContentSlideProps extends Base {
  kicker?: string
  title: ReactNode
  lead?: ReactNode
  points?: (BulletItem | string)[]
  tone?: Tone
  children?: ReactNode
}

export interface ContentImageSlideProps extends ContentSlideProps {
  media: SlideMedia
  caption?: ReactNode
}

export interface ContentNoteSlideProps extends ContentSlideProps {
  /** Render the note above the points, for slides where the note is the definition. */
  noteFirst?: boolean
  note: {
    kind?: 'note' | 'tip' | 'info' | 'warning' | 'success'
    title?: ReactNode
    body: ReactNode
    /** Replaces the default glyph inside the callout's icon holder. */
    icon?: ReactNode
  }
}

export interface CodeBuildSlideProps extends Base {
  kicker?: string
  title: ReactNode
  lead?: ReactNode
  /** The whole file AS IT STANDS on this slide, not just the new lines. */
  code: string
  filename?: string
  /** 1-based lines added on this slide. These are the lit ones. */
  highlight?: number[]
  /** What the new key does. `replaces` names the manual step it retires. */
  annotation: { key: ReactNode; body: ReactNode; replaces?: ReactNode }
  note?: {
    kind?: 'note' | 'tip' | 'info' | 'warning' | 'success'
    title?: ReactNode
    body: ReactNode
  }
}

export interface FlowChartSlideProps extends Base {
  kicker?: string
  title: ReactNode
  lead?: ReactNode
  nodes: FlowNode[]
  direction?: 'horizontal' | 'vertical'
}

export interface OnlyImageSlideProps extends Base {
  media: SlideMedia
  title?: ReactNode
  caption?: ReactNode
}

export interface ProceduralStepsSlideProps extends Base {
  kicker?: string
  title: ReactNode
  lead?: ReactNode
  steps: Step[]
  tone?: Tone
  /**
   * Tighten the step spacing and drop the detail text a size. Defaults to
   * `steps.length > 4`.
   *
   * Set it explicitly when the step DETAILS wrap: height comes from lines, not
   * from the step count, so four steps with two-line details overflow where five
   * one-liners fit. `ProceduralStepsSlide` has the full reason.
   */
  dense?: boolean
}

export interface ScenarioSlideProps extends Base {
  kicker?: string
  title: ReactNode
  situation: ReactNode
  persona?: string
  beats: ScenarioBeat[]
}

export interface QuestionSlideProps extends Base {
  kicker?: string
  /** The question. One question, and nothing else on the slide. */
  question: ReactNode
  /**
   * At most one short line under the question, for a constraint the room needs
   * in order to answer ("assume the container is already running").
   *
   * NOT for a hint, and never for the answer. If the slide needs explaining, it
   * is not a question slide.
   */
  qualifier?: ReactNode
  /**
   * The answers the room is choosing BETWEEN, two or three of them, rendered as
   * equal boxes under the question.
   *
   * They exist so a posed question has something to point at while hands go up:
   * "yes or no" said out loud is an instruction the slide has to carry in words,
   * and the same pair drawn as two boxes is the ask itself. Keep them to a word
   * or two each.
   *
   * STILL NOT THE ANSWER, and nothing here may hint at which box is right: no
   * ticks, no colour split, no ordering by likelihood. The boxes are drawn
   * identically on purpose. If one of them needs explaining, this is not a
   * question slide.
   */
  choices?: ReactNode[]
  tone?: Tone
}

export interface KeyTakeawaysSlideProps extends Base {
  kicker?: string
  title?: ReactNode
  lead?: ReactNode
  points: (BulletItem | string)[]
}

export interface PracticeSlideProps extends Base {
  kicker?: string
  title?: ReactNode
  prompt: ReactNode
  tasks?: (BulletItem | string)[]
}

/**
 * The standard feedback slide (content rule 41) takes the session name and
 * nothing else: its words, QR code and form are fixed. `title`, `prompt` and
 * `link` belonged to the kit's earlier heading-and-link frame and are accepted
 * so an older deck file still compiles; they are not rendered.
 */
export interface FeedbackSlideProps extends Base {
  /** @deprecated not rendered since 2026-10-14; the slide's words are fixed by rule 41 */
  title?: ReactNode
  /** @deprecated not rendered since 2026-10-14 */
  prompt?: ReactNode
  /** @deprecated not rendered since 2026-10-14; the form's link is fixed by rule 41 */
  link?: string
}

/*
  There is no `QuizSlideProps`, and that is deliberate.

  A quiz is NOT authored as a slide. Questions are delivered by an external quiz
  component, so a deck's only quiz frame is the announcement one below, which
  hands over to it. `QuizSlide` used to exist and render a question with four
  lettered options; it was removed because having it in the kit meant decks kept
  being written the wrong way.
*/

/** The quiz announcement frame. Carries no question by design. */
export interface QuizTimeSlideProps extends Base {
  /** Defaults to "Quiz Time!". */
  title?: ReactNode
  /**
   * DO NOT USE. Content rule 28: the frame carries "Quiz Time!" and nothing
   * else. The field stays declared only so already delivered sessions keep
   * compiling against this type. A subtitle here previews the questions the
   * external quiz tool is about to ask, and answers some of them.
   */
  subtitle?: ReactNode
  /**
   * The pill above the title. Defaults to "Your turn". PF 14 "For Loop" carries
   * its own ("Quiz time") and, with it, the three instructions below.
   */
  kicker?: string
  /** What the room does, in order, under the subtitle: "Open the quiz on your portal". */
  steps?: ReactNode[]
}

/** The next-session signpost: a glass chip over the next session's name, on the mesh ground (base template since 2026-10-14). */
export interface NextSessionSlideProps extends Base {
  /** The next session's name. */
  title: ReactNode
  /** The chip label. */
  label?: ReactNode
}

export interface ThankYouSlideProps extends Base {
  title?: ReactNode
  message?: ReactNode
  /*
    There is no `nextUp`. The Next session slide sits immediately before this one
    and already names what is coming; a "Next up:" chip here as well gave the deck
    two endings. Signpost the next session on that slide, not on this one.
  */
}


/* ------------------------------------------------------------------ */
/* Syntax explanation                                                  */
/* ------------------------------------------------------------------ */

/**
 * Shared by the two syntax types. The specimen line is BUILT from `parts`, so
 * there is no separate string to keep in step with the legend.
 */
interface SyntaxSlideBase extends Base {
  kicker?: string
  title: ReactNode
  lead?: ReactNode
  parts: SyntaxPart[]
  /** Click-gate the legend rows. The specimen itself is always immediate. */
  stepped?: boolean
  /** One line under the breakdown: the filled-in example, or the gotcha. */
  note?: {
    kind?: 'note' | 'tip' | 'info' | 'warning' | 'success' | 'error'
    title?: ReactNode
    body: ReactNode
  }
}

export interface CodeSyntaxSlideProps extends SyntaxSlideBase {
  /** The chip on the specimen panel. Also picks nothing else: there is no
      highlighter here, because a grammar diagram colours by SLOT, not by token
      class. Use `CodeBuildSlide` when the subject is a real file. */
  language?: string
}

export interface CommandSyntaxSlideProps extends SyntaxSlideBase {
  /*
    No `path` prop, deliberately.

    Hard rule 3 ("one panel per terminal, with the folder path shown") governs
    `Terminal`, which shows a command being RUN. This type shows a command's
    SHAPE and runs nothing, so a prompt path here would be claiming a working
    directory the slide never demonstrates. Show the run in a `Terminal` on the
    next slide.
  */
}

/* ------------------------------------------------------------------ */
/* Points that carry a verdict                                         */
/* ------------------------------------------------------------------ */

export interface StatusPointsSlideProps extends Base {
  kicker?: string
  title: ReactNode
  lead?: ReactNode
  items: StatusItem[]
  tone?: Tone
  /** A supporting figure beside the list. Forces the rows to reveal immediately. */
  children?: ReactNode
  /**
   * Click-gate the rows. Ignored when `children` is present, because hard rule 6
   * requires text and its supporting visual to arrive together.
   */
  stepped?: boolean
}

/* ------------------------------------------------------------------ */
/* Question with supporting points                                     */
/* ------------------------------------------------------------------ */

/**
 * A question the room answers, followed by the points that answer it.
 *
 * NOT a relaxation of hard rule 16. `QuestionSlide` carries the question and
 * nothing else, and this type keeps that true FOR AS LONG AS THE QUESTION IS
 * OPEN: at step 0 the slide is the question alone, and the points are build
 * steps that land only after the room has answered out loud. The rule exists so
 * there is nothing to read instead of think, and a step that has not been
 * revealed is not on screen to read.
 *
 * If the points are meant to be visible WHILE the question is asked, this is the
 * wrong type — that is a `ContentSlide` whose lead ends in a question mark.
 */
export interface QuestionPointsSlideProps extends Base {
  kicker?: string
  question: ReactNode
  qualifier?: ReactNode
  /** Revealed one click at a time, after the question. */
  points: (BulletItem | string)[]
  tone?: Tone
}

/* ------------------------------------------------------------------ */
/* Conversation and chat                                               */
/* ------------------------------------------------------------------ */

/**
 * A two-voice exchange set as a transcript: speaker in the gutter, line beside
 * it. Denser than `ChatSlide`, so it is the one to reach for when the exchange
 * runs past four turns or the lines are long.
 */
export interface ConversationSlideProps extends Base {
  kicker?: string
  title: ReactNode
  lead?: ReactNode
  /** Exactly two voices. A third is a panel discussion, not a teaching device. */
  speakers: { left: string; right: string }
  turns: ChatTurn[]
  tone?: Tone
  stepped?: boolean
}

export interface ChatSlideProps extends Base {
  kicker?: string
  title: ReactNode
  lead?: ReactNode
  speakers?: { left: string; right: string }
  turns: ChatTurn[]
  tone?: Tone
  stepped?: boolean
}

export interface ChatCharacterSlideProps extends ChatSlideProps {
  /**
   * The figure standing beside the thread. Defaults to Nova pointing at it.
   *
   * It goes on the LEFT and gestures right, toward the messages. On the right it
   * would sit in the column the video rectangle already claims, and it would be
   * gesturing off the edge of the slide.
   */
  character?: IllustrationName
}
