import type { ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { StoryArt } from '@/ui/characters/StoryArt'
import { useInstant } from '@/motion/instant'
import { StepControls, useBeats, useTween } from './beats'
import { TraceCaption } from './tracePieces'

/**
 * A SAVINGS STORY IN BEATS — a strip of days, a girl, a piggy bank, a running total.
 *
 * From PF 14 "For Loop" (Riya's piggy bank). It sets up the coding challenge
 * that follows: the room watches the rule applied day by day until adding by
 * hand stops being reasonable, and the last beat hands them the problem.
 *
 * Every beat names which day tiles are filled in, who is speaking (the girl or
 * the pig), the total in the bank, and whether a face changes. Coins drop into
 * the pig on the beat their day is filled.
 */
export interface SavingsDay {
  label: ReactNode
  /** The coin put in that day, or nothing on a skipped day. */
  coin?: ReactNode
  skip?: ReactNode
  /** The beat this day's tile fills on. */
  at: number
}

export interface SavingsBeat {
  who: 'girl' | 'pig'
  says: ReactNode
  total: ReactNode
  /** Coins that drop on this beat, by day index into `days`. */
  drops?: number[]
  pigSad?: boolean
  girlWorried?: boolean
  caption: ReactNode
}

export function SavingsStory({
  days,
  beats,
  name,
  bankLabel = 'in the piggy bank',
}: {
  days: SavingsDay[]
  beats: SavingsBeat[]
  /** The girl's name, under her. */
  name: ReactNode
  bankLabel?: ReactNode
}) {
  const at = useBeats(beats.length)
  const b = beats[at - 1]
  const tween = useTween()
  const instant = useInstant()
  const last = at === beats.length
  return (
    <>
      <style>{`@keyframes savingsdrop{0%{opacity:0;transform:translateY(-70px)}60%{opacity:1}100%{opacity:0;transform:translateY(40px)}}`}</style>
      <div className="flex flex-col gap-5">
        <div className="flex gap-3">
          {days.map((d, i) => {
            const on = at >= d.at
            const paid = on && d.coin !== undefined
            return (
              <div
                key={i}
                className="flex h-[80px] flex-1 flex-col items-center justify-center gap-1.5 rounded-card"
                style={{
                  transition: tween,
                  background: paid ? '#FFF8E6' : on ? colors.surface : 'transparent',
                  boxShadow: `inset 0 0 0 2px ${paid ? '#F5B82E' : colors.line}`,
                  borderStyle: 'dashed',
                }}
              >
                <span className="text-[16px] font-bold" style={{ color: colors.body }}>{d.label}</span>
                <span
                  style={{ transition: tween, opacity: on ? 1 : 0, transform: on ? 'none' : 'scale(0.6)' }}
                  /* one row height for a coin and a skip, so every day's label
                     sits on the same line */
                  className={
                    paid
                      ? 'grid h-9 place-items-center text-[16px] font-bold text-[#7A4B00]'
                      : 'grid h-9 place-items-center text-[16px] font-semibold'
                  }
                >
                  <span style={paid ? { background: '#F5B82E', borderRadius: 999, padding: '4px 10px' } : { color: colors.muted }}>
                    {paid ? d.coin : d.skip}
                  </span>
                </span>
              </div>
            )
          })}
        </div>

        <div className="flex h-[226px] items-end gap-8">
          <div className="flex w-[170px] shrink-0 flex-col items-center">
            <StoryArt name="story-girl" mood={b.girlWorried ? 'sad' : 'happy'} className="h-[190px] w-[150px]" />
            <span className="mt-1 font-heading text-[18px] font-bold" style={{ color: colors.brandDark }}>{name}</span>
          </div>
          <div className="flex min-w-0 flex-1 self-center">
            <p
              key={at}
              className="relative max-w-[92%] rounded-card bg-white px-6 py-4 text-[22px] leading-snug text-ink shadow-card-soft [&_b]:font-bold"
              style={{
                marginLeft: b.who === 'pig' ? 'auto' : 0,
                boxShadow: `inset 0 0 0 2px ${b.who === 'pig' ? '#F4B6CD' : '#9BD3EE'}`,
                background: b.who === 'pig' ? '#FFF5F9' : colors.white,
                color: colors.ink,
              }}
            >
              <span className={b.who === 'pig' ? '[&_b]:text-[#C2396F]' : '[&_b]:text-[#0B5FA5]'}>{b.says}</span>
            </p>
          </div>
          <div className="flex w-[190px] shrink-0 flex-col items-center gap-2">
            <div className="relative h-[130px] w-[160px]">
              {(b.drops ?? []).map((d, k) =>
                instant ? null : (
                  <span
                    key={`${at}-${d}`}
                    className="absolute left-1/2 top-0 z-10 -ml-5 grid h-10 w-10 place-items-center rounded-full text-[16px] font-bold"
                    style={{
                      background: '#F5B82E',
                      color: '#7A4B00',
                      animation: `savingsdrop 900ms cubic-bezier(0.22,1,0.36,1) ${k * 420}ms both`,
                    }}
                  >
                    {days[d].coin}
                  </span>
                ),
              )}
              <StoryArt name="piggy-bank" mood={b.pigSad ? 'sad' : 'happy'} className="h-full w-full" />
            </div>
            <div
              className="rounded-xl bg-white px-4 py-1.5 text-center"
              style={{ boxShadow: `inset 0 0 0 1px #F4B6CD${last ? ', 0 0 0 3px #3FB5E5' : ''}`, transition: tween }}
            >
              <span className="block text-[16px] font-semibold" style={{ color: colors.muted }}>{bankLabel}</span>
              <b className="font-heading text-[32px] leading-tight" style={{ color: '#C2396F' }}>{b.total}</b>
            </div>
          </div>
        </div>

        <TraceCaption>{b.caption}</TraceCaption>
      </div>
      <StepControls at={at} total={beats.length} />
    </>
  )
}
