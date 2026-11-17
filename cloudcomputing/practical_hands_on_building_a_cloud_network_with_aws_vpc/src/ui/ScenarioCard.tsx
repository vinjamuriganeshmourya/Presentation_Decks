import type { ReactNode } from 'react'
import { Step } from '@/motion/Stepper'
import { accentByTone, type Tone } from '@/design/tokens'
import { iconByName, type IconName } from './icons'

export interface ScenarioBeat {
  label: string
  detail: ReactNode
  icon?: IconName
  tone?: Tone
}

/**
 * A narrative "scenario" panel: a situation header, then a set of beats
 * (e.g. Situation → Action → Result) that reveal in sequence.
 */
export function ScenarioCard({
  situation,
  persona,
  beats,
  className = '',
}: {
  situation: ReactNode
  persona?: string
  beats: ScenarioBeat[]
  className?: string
}) {
  return (
    <div className={`overflow-hidden rounded-card border border-line bg-white shadow-card ${className}`}>
      {/* situation header */}
      <div className="flex items-start gap-4 bg-brand-gradient p-6 text-white">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/20">
          {(() => {
            const Icon = iconByName.book
            return <Icon width={22} height={22} />
          })()}
        </span>
        <div>
          {persona && (
            <p className="text-body-sm font-semibold uppercase tracking-wide text-white/70">
              {persona}
            </p>
          )}
          <p className="text-body-lg font-medium leading-snug">{situation}</p>
        </div>
      </div>

      {/* beats */}
      <div
        className="grid gap-5 p-6"
        style={{ gridTemplateColumns: `repeat(${beats.length}, minmax(0,1fr))` }}
      >
        {beats.map((b, i) => {
          const tone = b.tone ?? (['brand', 'teal', 'success'] as Tone[])[i % 3]
          const color = accentByTone[tone]
          const Icon = iconByName[b.icon ?? 'arrow']
          return (
            <Step dir="up" key={i}>
              <div className="h-full rounded-2xl border border-line bg-surface p-5">
                <span
                  className="mb-3 grid h-10 w-10 place-items-center rounded-xl text-white"
                  style={{ background: color }}
                >
                  <Icon width={20} height={20} />
                </span>
                <p className="text-kicker" style={{ color }}>
                  {b.label}
                </p>
                <p className="mt-1.5 text-body leading-relaxed text-ink-soft">{b.detail}</p>
              </div>
            </Step>
          )
        })}
      </div>
    </div>
  )
}
