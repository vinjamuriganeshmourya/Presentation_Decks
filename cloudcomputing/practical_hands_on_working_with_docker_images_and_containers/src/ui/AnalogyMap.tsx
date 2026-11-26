import { RevealGroup, Reveal } from '@/motion/Reveal'
import { ArrowRight } from './icons'
import { accentByTone, type Tone } from '@/design/tokens'

/**
 * A two-column analogy mapping: a real-world idea on the left maps to its
 * technical counterpart on the right, one row per pairing. Rows stagger in on
 * entry (no clicking) so the whole mapping reads at a glance. Used for the
 * session's restaurant / security-guard analogies.
 */
export function AnalogyMap({
  leftLabel,
  rightLabel,
  rows,
  tone = 'brand',
  className = '',
}: {
  leftLabel: string
  rightLabel: string
  rows: { from: string; to: string }[]
  tone?: Tone
  className?: string
}) {
  const color = accentByTone[tone]
  const cols = 'grid grid-cols-[1fr_2.5rem_1fr] items-center gap-x-4'
  return (
    <div className={`mx-auto w-full max-w-4xl ${className}`}>
      <div className={`${cols} mb-3`}>
        <p className="text-right font-heading text-body-sm font-bold uppercase tracking-wider text-body">
          {leftLabel}
        </p>
        <span />
        <p className="font-heading text-body-sm font-bold uppercase tracking-wider" style={{ color }}>
          {rightLabel}
        </p>
      </div>
      <RevealGroup className="flex flex-col gap-3" stagger={0.09}>
        {rows.map((r, i) => (
          <Reveal key={i} dir="up">
            <div className={cols}>
              <div className="rounded-card border-2 border-line bg-surface-card px-4 py-2.5 text-right text-body-lg text-ink">
                {r.from}
              </div>
              <ArrowRight className="mx-auto h-5 w-5" style={{ color }} />
              <div
                className="rounded-card border-2 px-4 py-2.5 text-body-lg text-ink"
                style={{ borderColor: color, background: `${color}12` }}
              >
                {r.to}
              </div>
            </div>
          </Reveal>
        ))}
      </RevealGroup>
    </div>
  )
}
