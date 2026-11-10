import type { ReactNode } from 'react'
import { Step } from '@/motion/Stepper'
import { Reveal, RevealGroup } from '@/motion/Reveal'
import { colors } from '@/design/tokens'
import { iconByName } from './icons'

/**
 * STATUS LIST — points that each carry a verdict.
 *
 * WHY THIS IS NOT A `BulletList`
 *
 * A bullet list says "here are four things". This says "here are four things
 * AND here is which of them is safe". The verdict is the content, so it cannot
 * be a colour applied to a bullet after the fact: each row is a card whose rail,
 * tint and glyph all carry the same verdict, which is what makes it readable at
 * projector distance and in greyscale.
 *
 * Reach for it when the slide is a set of outcomes, a do/don't pair, or a list
 * of states a command can leave you in. If every row would be `success`, it is a
 * `BulletList` and the colour is decoration.
 *
 * WHY NOT `Callout`
 *
 * `Callout` is ONE box that must not be missed, sitting beside other content.
 * Four callouts stacked read as four things that must not be missed, which is
 * none of them. This is the list form, deliberately quieter per row.
 *
 * COLOUR COMES FROM THE TAILWIND SCALE, NOT FROM HEXES
 *
 * `success` / `warning` / `danger` / `info` each ship a 100 (tint) and a 600
 * (ink) step in `tailwind.config.ts`. Using the classes rather than literals is
 * what keeps this figure in step with `Callout`, which names the same four
 * verdicts, and means a palette change lands in one file.
 */

export type StatusKind = 'success' | 'warning' | 'error' | 'info'

/**
 * `error` is the authored name and `danger` is the palette's name for the same
 * red. The slide author should be writing what the row MEANS, and a failing
 * command is an error rather than a danger, so the mapping lives here instead of
 * leaking the palette's vocabulary into every deck.
 */
const KIND: Record<StatusKind, { rail: string; tint: string; ink: string; icon: 'check' | 'warning' | 'cross' | 'info'; label: string }> = {
  success: { rail: 'border-success-600', tint: 'bg-success-100', ink: 'text-success-600', icon: 'check', label: 'Works' },
  warning: { rail: 'border-warning-600', tint: 'bg-warning-100', ink: 'text-warning-600', icon: 'warning', label: 'Careful' },
  error: { rail: 'border-danger-600', tint: 'bg-danger-100', ink: 'text-danger-600', icon: 'cross', label: 'Fails' },
  info: { rail: 'border-info-600', tint: 'bg-info-100', ink: 'text-info-600', icon: 'info', label: 'Note' },
}

export interface StatusItem {
  status: StatusKind
  text: ReactNode
  /** One line of consequence. What happens, or what to do instead. */
  detail?: ReactNode
  /**
   * Render `text` in the mono face. For a row whose subject is a literal string
   * the learner will see: a command, a filename, an error message.
   */
  code?: boolean
  /** Overrides the verdict's default word in the corner chip. */
  label?: ReactNode
}

export function StatusList({
  items,
  /**
   * Stagger the rows in on slide entry instead of click-gating each one.
   *
   * Required whenever the list sits beside a supporting visual (hard rule 6:
   * text and its visual arrive together). Left off, the rows are build steps,
   * which is the right default for a do/don't sequence the instructor talks
   * through one verdict at a time.
   */
  immediate = false,
  className = '',
}: {
  items: StatusItem[]
  immediate?: boolean
  className?: string
}) {
  const Row = immediate ? Reveal : Step
  const Wrapper = immediate ? RevealGroup : 'div'
  return (
    <Wrapper
      {...(immediate ? ({ stagger: 0.08 } as const) : {})}
      className={`space-y-3.5 ${className}`}
    >
      {items.map((item, i) => {
        const k = KIND[item.status]
        const Icon = iconByName[k.icon]
        return (
          <Row
            key={i}
            dir="up"
            className={`flex items-start gap-4 rounded-card border-l-[5px] px-5 py-4 ${k.rail} ${k.tint}`}
          >
            <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/70 ${k.ink}`}>
              <Icon width={20} height={20} />
            </span>
            <span className="min-w-0 flex-1 pt-0.5">
              <span
                className={`block font-medium text-ink ${
                  item.code ? 'font-mono text-body' : 'text-body-lg'
                }`}
              >
                {item.text}
              </span>
              {/*
                `text-body` IS A FONT SIZE, NOT ONLY A COLOUR.

                `body` is declared in BOTH `theme.colors` and `theme.fontSize` in
                tailwind.config.ts, so `.text-body` emits two rules and BOTH
                apply: `font-size: 19px; line-height: 1.6` and the grey. This
                element carried `text-body-sm text-body`, which is two font sizes
                on one element, and which one won was decided by the order of keys
                in the config's `fontSize` object rather than by anything here. It
                happened to render at 16px, and reordering that object would
                silently push every line like it to 19px.

                The colour comes from `tokens.ts` instead, which is what the rest
                of this file already does.
              */}
              {item.detail && (
                <span className="mt-0.5 block text-body-sm" style={{ color: colors.body }}>
                  {item.detail}
                </span>
              )}
            </span>
            {/* The verdict, spelled out. The colour says it to anyone who can see
                colour; the word says it to everyone else. */}
            <span
              className={`mt-1 shrink-0 rounded-pill bg-white/70 px-2.5 py-0.5 text-[13px] font-bold uppercase tracking-wide ${k.ink}`}
            >
              {item.label ?? k.label}
            </span>
          </Row>
        )
      })}
    </Wrapper>
  )
}
