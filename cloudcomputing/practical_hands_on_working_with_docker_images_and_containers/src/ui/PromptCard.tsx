import type { ReactNode } from 'react'
import { Reveal, RevealGroup } from '@/motion/Reveal'
import { colors } from '@/design/tokens'
import { iconByName } from './icons'
import { T } from './figureTiming'

/**
 * Text the learner pastes into an AI tool.
 *
 * WHY NOT `CodeBlock`, `Terminal` OR `Callout`
 *
 * A prompt is none of those. It is not a file (no line numbers, no filename),
 * it is not typed at a shell (no folder path, no command), and it is not an
 * aside beside other content. It is the CONTENT of its slide: prose the room
 * will copy word for word into a chat box. Python session 2 carries six of them
 * and the source PPTX drew each as a speech bubble beside a person.
 *
 * WHERE IT GOES
 *
 * Hard rule 31 by analogy: every panel of text the learner will type says
 * where it is typed. `location` is the chip on the panel's title row and it
 * defaults to the three tools the session names.
 *
 * SLOTS
 *
 * A prompt template carries `[bracketed]` slots the learner fills in. They are
 * rendered the way `SyntaxBreakdown` renders a `placeholder` part: a dashed
 * outline, so "which of these do I change?" is answered by the figure.
 *
 * DOM, never SVG (content rule 17). Colours from `tokens.ts`.
 */

const SLOT = /(\[[^\]]+\])/g

function withSlots(text: string): ReactNode[] {
  return text.split(SLOT).map((part, i) =>
    SLOT.test(part) ? (
      <span
        key={i}
        className="rounded-md px-1.5 py-0.5 font-medium"
        style={{
          color: colors.brandDark,
          background: colors.surface2,
          border: `1.5px dashed ${colors.brand}`,
        }}
      >
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

export function PromptCard({
  prompt,
  location = 'Paste into ChatGPT, Gemini or Claude',
  fontSize = 19,
  className = '',
}: {
  /** The prompt, verbatim. Newlines are kept. */
  prompt: string
  /** Where the learner types it. Never leave it blank. */
  location?: string
  /**
   * The lever for a long prompt, in px. Session 2's coding-problem prompt is
   * fourteen lines and needs 15. Never `maxHeight`: a panel that scrolls is a
   * prompt the room cannot copy.
   */
  fontSize?: number
  className?: string
}) {
  const Icon = iconByName.chat
  return (
    <RevealGroup stagger={T.stagger} delayChildren={T.lead} className={className}>
      <Reveal dir="up">
        <div className="overflow-hidden rounded-card border border-line bg-white shadow-card">
          <div className="flex items-center gap-2 border-b border-line bg-surface px-4 py-2.5">
            <span className="grid h-6 w-6 place-items-center rounded-md" style={{ background: colors.brand, color: colors.white }}>
              <Icon width={14} height={14} />
            </span>
            <span className="font-heading text-body-sm font-bold uppercase tracking-wider text-body">Prompt</span>
            <span className="ml-auto text-body-sm text-body">{location}</span>
          </div>
          <p
            className="m-0 whitespace-pre-wrap px-6 py-5 text-ink"
            style={{ fontSize, lineHeight: 1.55 }}
          >
            {withSlots(prompt)}
          </p>
        </div>
      </Reveal>
    </RevealGroup>
  )
}
