import type { ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { StoryArt, type StoryArtName } from '@/ui/characters/StoryArt'
import { StepControls, useBeats, useTween } from './beats'

/**
 * EXAMPLES, THEN THE SHAPE THEY SHARE — four beats.
 *
 *   1  the question, and three empty boxes marked "yours": the room answers first
 *   2  our three examples fill the boxes
 *   3  the boxes give way to the one shape all three have, with its caption
 *   4  the shape's closing line
 *
 * From PF 14 "For Loop". The three boxes share ONE text size (user, 2026-09-29):
 * a label that is smaller in one box than the next reads as less important.
 */
export interface Example {
  art: StoryArtName
  title: ReactNode
  text: ReactNode
}

export function ExamplesToShape({
  ask,
  examples,
  placeholder = 'yours',
  shape,
  caption,
}: {
  ask: { title: ReactNode; text: ReactNode }
  examples: Example[]
  placeholder?: ReactNode
  /** The drawing of the shared shape; its `.hk-never` line shows on beat 4. */
  shape: StoryArtName
  caption: ReactNode
}) {
  const at = useBeats(4)
  const tween = useTween()
  const filled = at >= 2
  return (
    <>
      {at <= 2 ? (
        <div className="flex flex-col gap-4">
          <div
            className="rounded-card bg-brand-soft px-6 py-4"
            style={{ boxShadow: `inset 4px 0 0 ${colors.brand}` }}
          >
            <p className="font-heading text-[22px] font-bold text-ink">{ask.title}</p>
            <p className="mt-1 text-body-lg" style={{ color: colors.body }}>{ask.text}</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {examples.map((e, i) => (
              <div
                key={i}
                className="flex h-[250px] flex-col rounded-card px-4 pb-4 pt-3"
                style={{
                  transition: tween,
                  background: filled ? colors.white : 'transparent',
                  boxShadow: filled ? `inset 0 0 0 1px ${colors.line}` : `inset 0 0 0 2px ${colors.line}`,
                  border: filled ? undefined : `2px dashed ${colors.line}`,
                }}
              >
                <StoryArt
                  name={e.art}
                  live={filled}
                  className="mx-auto h-[140px] w-[182px]"
                  style={{ transition: tween, opacity: filled ? 1 : 0.2 }}
                />
                <div className="mt-auto grid text-center">
                  <div className="[grid-area:1/1]" style={{ transition: tween, opacity: filled ? 1 : 0 }}>
                    <p className="font-heading text-[17px] font-bold" style={{ color: colors.brandDark }}>{e.title}</p>
                    <p className="mt-0.5 text-[16px] leading-snug" style={{ color: colors.body }}>{e.text}</p>
                  </div>
                  <p
                    className="self-center text-[16px] font-semibold uppercase tracking-[0.09em] [grid-area:1/1]"
                    style={{ transition: tween, opacity: filled ? 0 : 1, color: colors.muted }}
                  >
                    {placeholder}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <StoryArt name={shape} beat={at} className="h-[330px] w-[440px]" />
          <div
            className="w-full rounded-card bg-white px-6 py-3 text-body-lg shadow-card-soft"
            style={{ boxShadow: `inset 4px 0 0 ${colors.brand}`, color: colors.body }}
          >
            {caption}
          </div>
        </div>
      )}
      <StepControls at={at} total={4} />
    </>
  )
}
