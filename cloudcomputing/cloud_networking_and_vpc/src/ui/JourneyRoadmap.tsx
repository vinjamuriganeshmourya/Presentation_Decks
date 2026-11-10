import { RevealGroup, Reveal } from '@/motion/Reveal'
import { iconByName, type IconName } from './icons'
import { colors } from '@/design/tokens'

/**
 * The deployment journey, with a pin on the stage this session is at.
 *
 * Problem 1 is broken into its three stages because those are what this course
 * builds next. Problem 2 stays a **single unopened block**: it is not
 * decomposed into stages and no tool is named for it, because a student who has
 * not met the problem cannot place a tool against it. It gets opened up in the
 * hosting sessions, and this figure grows there.
 *
 * Opens every session in the module with `pin` moved, so it is parameterised
 * rather than redrawn.
 */

interface Stage {
  label: string
  question: string
  icon: IconName
}

const STAGES: Stage[] = [
  { label: 'Package', question: 'Bundle app + everything it needs', icon: 'target' },
  { label: 'Configure', question: 'Run it the production way', icon: 'settings' },
  { label: 'Combine', question: 'Front, back and database together', icon: 'network' },
]

export function JourneyRoadmap({
  pin = 1,
  className = '',
}: {
  /** 1-based Problem 1 stage the current session sits at. */
  pin?: number
  className?: string
}) {
  return (
    <div className={`w-full ${className}`}>
      {/* Problem brackets */}
      <div className="mb-2 grid grid-cols-4 gap-3">
        <div className="col-span-3">
          <p
            className="rounded-pill py-1 text-center text-xs font-bold uppercase tracking-wider text-white"
            style={{ background: colors.brand }}
          >
            Problem 1 · Runs anywhere
          </p>
        </div>
        <p
          className="rounded-pill border-2 border-dashed py-1 text-center text-xs font-bold uppercase tracking-wider"
          style={{ borderColor: colors.line, color: colors.muted }}
        >
          Problem 2
        </p>
      </div>

      <RevealGroup className="grid grid-cols-4 gap-3" stagger={0.09}>
        {STAGES.map((s, i) => {
          const n = i + 1
          const here = n === pin
          const color = here ? colors.brand : colors.teal
          const Icon = iconByName[s.icon]
          return (
            <Reveal key={s.label} dir="up">
              <div className="flex flex-col items-center">
                <div className="mb-1 h-6">
                  {here && (
                    <span
                      className="rounded-pill px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-white"
                      style={{ background: colors.accent }}
                    >
                      You are here
                    </span>
                  )}
                </div>
                <div
                  className="flex w-full flex-col items-center rounded-card bg-white px-2 py-3 text-center"
                  style={{
                    border: `2px solid ${color}`,
                    boxShadow: here ? '0 10px 34px -14px rgba(11,95,255,0.45)' : undefined,
                  }}
                >
                  <span
                    className="grid h-9 w-9 place-items-center rounded-xl"
                    style={{ background: `${color}18`, color }}
                  >
                    <Icon width={18} height={18} />
                  </span>
                  <span className="mt-1.5 font-heading text-base font-bold text-ink">
                    {n}. {s.label}
                  </span>
                  <span className="mt-0.5 text-xs leading-snug text-body">{s.question}</span>
                </div>
              </div>
            </Reveal>
          )
        })}

        {/* Problem 2: one unopened block. Not decomposed, no tools named. */}
        <Reveal dir="up">
          <div className="flex flex-col items-center">
            <div className="mb-1 h-6" />
            <div
              className="flex w-full flex-col items-center rounded-card border-2 border-dashed px-2 py-3 text-center"
              style={{ borderColor: colors.line, background: '#F8FAFC' }}
            >
              <span
                className="grid h-9 w-9 place-items-center rounded-xl"
                style={{ background: '#E9EEF5', color: colors.muted }}
              >
                {(() => {
                  const Icon = iconByName.lock
                  return <Icon width={18} height={18} />
                })()}
              </span>
              <span className="mt-1.5 font-heading text-base font-bold" style={{ color: colors.body }}>
                Reachable
              </span>
              <span className="mt-0.5 text-xs leading-snug" style={{ color: colors.muted }}>
                Later in this course
              </span>
            </div>
          </div>
        </Reveal>
      </RevealGroup>
    </div>
  )
}
