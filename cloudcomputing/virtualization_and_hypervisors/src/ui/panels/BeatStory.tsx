import type { ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { StepControls, useBeats, useTween } from './beats'

/**
 * A STORY TOLD IN BEATS — a figure that changes, and one line per beat beside it.
 *
 * From PF 14 "For Loop" (the playlist hook). Every line is on screen from the
 * first beat, ghosted, so the room can see how long the story is. The line on
 * now carries its sentence; the one before it shrinks to its headline; anything
 * older steps back further. The column never holds more than one sentence, so
 * the figure is what the eye goes to.
 *
 * The last line is the question handed to the room, and it is marked as one.
 */
export interface BeatLine {
  title: ReactNode
  text: ReactNode
}

export function BeatStory({
  figure,
  lines,
  figureWidth = 300,
}: {
  /** Drawn for the beat on screen, 1-based. */
  figure: (beat: number) => ReactNode
  lines: BeatLine[]
  figureWidth?: number
}) {
  const total = lines.length
  const at = useBeats(total)
  const tween = useTween(320)
  return (
    <>
      <div className="flex items-start gap-12">
        <div className="shrink-0" style={{ width: figureWidth }}>
          {figure(at)}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center self-stretch">
          {lines.map((l, i) => {
            const n = i + 1
            const last = n === total
            const opacity = n > at ? 0.16 : n < at - 1 ? 0.4 : 1
            return (
              <div
                key={i}
                className="mb-4"
                style={{
                  transition: tween,
                  opacity,
                  transform: n > at ? 'translateY(6px)' : 'none',
                  ...(last && at === total
                    ? { boxShadow: `inset 4px 0 0 ${colors.brand}`, paddingLeft: 16, marginLeft: -20 }
                    : {}),
                }}
              >
                <p className="font-heading text-[22px] font-bold" style={{ color: last ? colors.brandDark : colors.brand }}>
                  {l.title}
                </p>
                {n === at && <p className="mt-1 text-body-lg" style={{ color: colors.body }}>{l.text}</p>}
              </div>
            )
          })}
        </div>
      </div>
      <StepControls at={at} total={total} />
    </>
  )
}
