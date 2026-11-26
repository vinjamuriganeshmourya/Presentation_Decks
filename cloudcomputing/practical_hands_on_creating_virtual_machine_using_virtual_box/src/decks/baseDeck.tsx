import type { DeckMeta, SlideDef } from '@/deck/types'
import {
  AgendaSlide,
  BrandSlide,
  ContentNoteSlide,
  ContentSlide,
  FeedbackSlide,
  FlowChartSlide,
  KeyTakeawaysSlide,
  PracticeSlide,
  ProceduralStepsSlide,
  QuizTimeSlide,
  RecapSlide,
  SectionBreakerSlide,
  ThankYouSlide,
  NextSessionSlide,
  WelcomeSlide,
} from '@/slides'
import { CodeBlock, DataTable, Terminal } from '@/ui'

/**
 * THE BASE DECK — the chrome every NxtWave session is built from.
 *
 * This is the reference frame for each slide type a session always has, in the
 * order a session always has them. It is deliberately CONTENT-FREE: the copy is
 * placeholder, so nothing here reads as a real session and nothing has to be
 * kept in sync with a TR doc.
 *
 * WHAT IT IS FOR
 *
 *   1. Reviewing a theme change. Change a colour in `tailwind.config.ts`, run
 *      this deck, and every chrome frame is on one screen. That is much faster
 *      than scrolling a 48-slide session looking for the six frames a divider
 *      change touched.
 *   2. Starting a session. Copy this file, rename it, point
 *      `src/decks/activeDeck.ts` at the copy, then replace the placeholder copy
 *      with real content.
 *
 * WHAT IT IS NOT
 *
 *   `sampleDeck.tsx` is the exhaustive component gallery — every slide type,
 *   every `src/ui` figure, every callout kind. Open that one when a LAYOUT looks
 *   wrong. Open this one when the THEME looks wrong.
 *
 * The content rules in `.claude/skills/slide-content-rules/SKILL.md` apply to
 * this file too, placeholder or not: no em dashes, no trailing full stops on
 * titles or bullets, one idea per slide. If the base deck breaks them, every
 * session copied from it starts out breaking them.
 */

export const baseDeckMeta: DeckMeta = {
  title: 'Base Template',
  course: 'NxtWave · Session Template',
  lesson: 'Base Template',
  presenter: 'NxtWave Instructor',
  /* The control bar auto-hides, as every delivered Python deck from session 18 ran it (2026-10-14). */
  player: { autoHideControls: true },
}

/** Footer text on every slide: the session name, never "Session N". */
const SESSION = 'Base Template'

export const baseDeck: SlideDef[] = [
  /* ── OPENING ─────────────────────────────────────────────────────────── */
  {
    id: 'base-welcome',
    section: 'Opening',
    label: 'Welcome',
    element: <BrandSlide greeting="Welcome" lesson={SESSION} />,
    notes:
      'The brand frame. Nothing but the mark and the welcome: no session name, no course, no agenda. It is on screen while the room settles.',
  },
  {
    id: 'base-session-name',
    section: 'Opening',
    label: 'Session name',
    element: <WelcomeSlide minimal title={SESSION} lesson={SESSION} />,
    notes:
      'The session name, and only the session name. `minimal` drops the course chip, presenter, meta and mascot so the title is the one thing on the slide.',
  },
  {
    id: 'base-recap',
    section: 'Opening',
    label: 'Recap',
    element: (
      <RecapSlide
        kicker="Recap"
        title="Last Session"
        lesson={SESSION}
        points={[
          { text: 'The first thing they should already know', sub: 'One line on why it still matters today' },
          { text: 'The second thing they should already know', sub: 'Kept to a phrase, not a paragraph' },
          { text: 'The third thing they should already know', sub: 'Stop at three, or the recap becomes the session' },
        ]}
      />
    ),
    notes:
      'Only what today actually builds on. A recap that covers everything last session did is a second session, and it eats the clock.',
  },
  {
    id: 'base-agenda',
    section: 'Opening',
    label: 'Agenda',
    element: (
      /* Pass the items and the session name only: the mark says Agenda, large,
         over the session name, small (content rule 39). "What We Will Cover"
         as the title is one of the three ways it shipped wrong. */
      <AgendaSlide
        lesson={SESSION}
        items={[
          { title: 'The First Concept', sub: 'One divider, then three slides of mixed layouts' },
          { title: 'The Second Concept', sub: 'Same shape, so the deck has a rhythm' },
        ]}
      />
    ),
    notes:
      'The agenda items and the section dividers must use the SAME wording, and so must the key-takeaways list. All three name the concepts here. When they drift, the room cannot tell where it is in the session.',
  },

  /* ── CONCEPT ONE ─────────────────────────────────────────────────────── */
  /*
    TWO CONCEPTS, NOT ONE, AND DIFFERENT LAYOUTS INSIDE EACH.

    A single-concept base deck cannot show the two things most likely to look
    wrong after a theme or motion change:

      1. The SECTION CHANGE. Continuity (see `src/motion/continuity.ts`) holds an
         unchanged kicker still inside a concept and lets it animate when the
         concept changes. With one section there is no boundary to look at, so a
         broken boundary would be invisible here and only show up in a real deck.
      2. MIXED LAYOUTS inside one concept. Continuity keys off the slide FAMILY,
         not the component, precisely so `ContentSlide -> ContentNoteSlide ->
         ProceduralStepsSlide` flows without the kicker twitching at each switch.
         That only gets exercised if the concepts actually mix types.

    So concept one runs Content -> Content+note -> Content+terminal, concept two
    runs Procedural steps -> Flow chart -> Content+table, and both carry the same
    kicker throughout. Advancing through either one should move the title and the
    body while the kicker stays nailed in place; crossing from one to the other
    should move everything.
  */
  {
    id: 'base-c1-divider',
    section: 'The First Concept',
    label: 'Section divider',
    element: <SectionBreakerSlide index={1} title="The First Concept" lesson={SESSION} />,
    notes:
      'One divider per concept. The numeral behind the title tells the room how far in it is without a progress rail on the slide itself.',
  },
  {
    id: 'base-c1-content',
    section: 'The First Concept',
    label: 'Content',
    element: (
      <ContentSlide
        kicker="The First Concept"
        title="One Idea, Stated Once"
        lesson={SESSION}
        points={[
          { text: 'The claim, as a short sentence', sub: 'The supporting detail goes on this second line', icon: 'check' },
          { text: 'The second point about the same idea', sub: 'Still the same idea, or it belongs on its own slide', icon: 'arrow' },
          { text: 'The third and last point', sub: 'Four points on one slide is usually two slides', icon: 'target' },
        ]}
      >
        <CodeBlock
          language="python"
          filename="example.py"
          code={'def greet(name):\n    return f"Hello, {name}"'}
        />
      </ContentSlide>
    ),
    notes:
      'The workhorse layout: points on the left, one exhibit on the right. The exhibit and the text reveal together, never text and then picture.',
  },
  {
    id: 'base-c1-note',
    section: 'The First Concept',
    label: 'Content + note',
    element: (
      <ContentNoteSlide
        kicker="The First Concept"
        title="When the Idea Needs a Caveat"
        lesson={SESSION}
        points={[
          { text: 'The thing that is true most of the time', icon: 'check' },
          { text: 'The condition that makes it true', icon: 'info' },
        ]}
        note={{
          kind: 'tip',
          title: 'Worth saying out loud',
          body: 'The callout carries the caveat so the points stay short. Use `noteFirst` when the note IS the definition rather than an aside.',
        }}
      />
    ),
    notes:
      'A different layout, same concept. The kicker does not move on the way in, which is the point: the room should read this as the same subject continuing.',
  },
  {
    id: 'base-c1-terminal',
    section: 'The First Concept',
    label: 'Content + terminal',
    element: (
      <ContentSlide
        kicker="The First Concept"
        title="Run It and Read the Output"
        lesson={SESSION}
        points={[
          { text: 'The command, and what it is for', sub: 'One command per slide, so the room can follow', icon: 'terminal' },
          { text: 'The line in the output that matters', sub: 'Point at it rather than reading the whole transcript', icon: 'target' },
        ]}
      >
        <Terminal
          path={'C:\\nxttrendz\\demo'}
          lines={[
            { text: 'python example.py', kind: 'cmd' },
            { text: 'Hello, NxtWave', kind: 'out' },
          ]}
        />
      </ContentSlide>
    ),
    notes:
      'Terminal output is rendered by `src/ui/Terminal.tsx`, never a screenshot of a terminal and never invented. Windows PowerShell in VS Code\u2019s integrated terminal is the house default; macOS and Linux forms belong in the notes.',
  },

  /* ── CONCEPT TWO ─────────────────────────────────────────────────────── */
  {
    id: 'base-c2-divider',
    section: 'The Second Concept',
    label: 'Section divider',
    element: <SectionBreakerSlide index={2} title="The Second Concept" lesson={SESSION} />,
    notes:
      'The second divider. Crossing into a new concept is the one place the kicker SHOULD animate on the slides that follow, because the subject genuinely changed.',
  },
  {
    id: 'base-c2-steps',
    section: 'The Second Concept',
    label: 'Procedural steps',
    element: (
      <ProceduralStepsSlide
        kicker="The Second Concept"
        title="Do It In Order"
        lead="Numbered steps, for the times the order is the lesson"
        lesson={SESSION}
        steps={[
          { title: 'The first step', detail: 'What the room does, in one line', icon: 'play' },
          { title: 'The second step', detail: 'What changes as a result', icon: 'arrow' },
          { title: 'The third step', detail: 'How they know it worked', icon: 'check' },
        ]}
      />
    ),
    notes:
      'Use this instead of bullets when doing the steps out of order would fail. If the order does not matter, it is a content slide with bullets.',
  },
  {
    id: 'base-c2-flow',
    section: 'The Second Concept',
    label: 'Flow chart',
    element: (
      <FlowChartSlide
        kicker="The Second Concept"
        title="How the Pieces Connect"
        lesson={SESSION}
        nodes={[
          { label: 'Input', caption: 'Where it starts', icon: 'code' },
          { label: 'Process', caption: 'What happens to it', icon: 'bolt' },
          { label: 'Output', caption: 'What the room sees', icon: 'check' },
        ]}
      />
    ),
    notes:
      'A flow is worth a slide only when the ARROWS carry information. Three boxes in a row that could have been three bullets is a bullet slide wearing a costume.',
  },
  {
    id: 'base-c2-table',
    section: 'The Second Concept',
    label: 'Content + table',
    element: (
      <ContentSlide
        kicker="The Second Concept"
        title="Comparing the Options"
        lesson={SESSION}
        points={[
          { text: 'What the two columns actually differ on', sub: 'Name the axis, or the table is just a layout', icon: 'target' },
          { text: 'Which one this course uses, and why', sub: 'A comparison with no recommendation leaves the room stuck', icon: 'check' },
        ]}
      >
        <DataTable
          columns={[{ label: 'Option' }, { label: 'When to reach for it', weight: 1.6 }]}
          rows={[
            ['The first one', 'The case it handles well'],
            ['The second one', 'The case the first one cannot'],
            ['The third one', 'Mentioned so nobody asks, not recommended'],
          ]}
          highlight={[2]}
        />
      </ContentSlide>
    ),
    notes:
      'Highlight the row you are recommending. An unhighlighted three-row table makes the room read all nine cells looking for the answer.',
  },

  /* ── CHECKING UNDERSTANDING ──────────────────────────────────────────── */
  {
    id: 'base-quiz-time',
    section: 'Checking understanding',
    label: 'Quiz time',
    element: <QuizTimeSlide lesson={SESSION} />,
    notes:
      'The announcement frame, and the ONLY quiz slide a deck has. The questions themselves are delivered by an external quiz component, not authored as slides, so this frame hands over to it rather than introducing a question of its own.',
  },
  /* ── CLOSING ─────────────────────────────────────────────────────────── */
  {
    id: 'base-key-takeaways',
    section: 'Closing',
    label: 'Key takeaways',
    element: (
      <KeyTakeawaysSlide
        title={SESSION}
        lesson={SESSION}
        points={['The First Concept', 'The Second Concept']}
      />
    ),
    notes:
      'The section names, in order. This is the one slide that should be predictable: if a takeaway is a surprise, it was missing from the agenda.',
  },
  {
    id: 'base-practice',
    section: 'Closing',
    label: 'Practice',
    element: (
      <PracticeSlide
        title="Before the Next Session"
        prompt="Do the whole thing yourself, at least once"
        lesson={SESSION}
        tasks={[
          { text: 'The first task, done from scratch', sub: 'Not repeating the demo, redoing it' },
          { text: 'The second task, which varies one thing', sub: 'Changing one input is what proves they understood' },
          { text: 'The third task, which breaks it on purpose', sub: 'Reading the error is the skill' },
        ]}
      />
    ),
    notes:
      'Practice is the last thing they see before feedback, so it is the thing they remember to do. Keep it to three tasks they can finish.',
  },
  {
    id: 'base-next-session',
    section: 'Closing',
    label: 'Next session',
    element: <NextSessionSlide title="The Next Session" lesson={SESSION} />,
    notes:
      'The signpost: a glass chip over the next session\'s name, on the mesh ground. Name the next session the way its own title slide will name it, and put nothing else on the frame.',
  },
  {
    id: 'base-feedback',
    section: 'Closing',
    label: 'Feedback',
    element: <FeedbackSlide lesson={SESSION} />,
    notes: 'Leave it on screen while the room fills the form. Read the link out rather than assuming everyone can see it.',
  },
  {
    id: 'base-thank-you',
    section: 'Closing',
    label: 'Thank you',
    element: <ThankYouSlide title="Thank You" lesson={SESSION} />,
    notes:
      'The closing frame. Nothing new goes on it, and in particular no "next up" line: the Next session slide before the feedback frame already carries that, and saying it twice makes the deck look like it has two endings.',
  },
  {
    id: 'base-all-the-best',
    section: 'Closing',
    label: 'All the best',
    element: <ThankYouSlide title="All the Best" lesson={SESSION} />,
    notes: 'The send-off, the last frame: the Thank you frame with different words.',
  },
]
