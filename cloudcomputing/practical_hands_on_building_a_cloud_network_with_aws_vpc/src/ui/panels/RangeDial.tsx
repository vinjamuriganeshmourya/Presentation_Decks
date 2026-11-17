import { useEffect, useRef, useState, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { PanelButton } from './beats'
import { TraceCaption } from './tracePieces'

/**
 * THE RANGE DIAL — set start and stop, predict, then show the numbers.
 *
 * From PF 14 "For Loop". The stop value is drawn at its own cell with a cross
 * through it, every time, because "stops before the end" is the half that gets
 * forgotten. Changing either number hides the numbers again: the room predicts
 * before every reveal, not only the first.
 *
 * Local state, not build steps: the dial is played with, not presented.
 */
const MAX = 10

function Stepper({ label, onMinus, onPlus, minus, plus }: {
  label: string
  onMinus: () => void
  onPlus: () => void
  minus: boolean
  plus: boolean
}) {
  const btn = (txt: string, on: () => void, ok: boolean, aria: string) => (
    <button
      type="button"
      aria-label={aria}
      disabled={!ok}
      onClick={on}
      onKeyDown={(e) => e.key !== 'Enter' && e.key !== ' ' && e.currentTarget.blur()}
      className="grid h-10 w-10 place-items-center rounded-lg bg-white font-heading text-[22px] font-bold disabled:opacity-35"
      style={{ color: colors.brandDark, boxShadow: `inset 0 0 0 1px ${colors.line}` }}
    >
      {txt}
    </button>
  )
  return (
    <span className="flex items-center gap-2">
      <span className="text-[16px] font-semibold" style={{ color: colors.muted }}>{label}</span>
      {btn('−', onMinus, minus, `lower ${label}`)}
      {btn('+', onPlus, plus, `raise ${label}`)}
    </span>
  )
}

export function RangeDial({
  start: s0 = 1,
  stop: e0 = 5,
  caption,
}: {
  start?: number
  stop?: number
  caption: ReactNode
}) {
  const instant = useInstant()
  const [a, setA] = useState(s0)
  const [b, setB] = useState(e0)
  const [lit, setLit] = useState(-1) // how many cells have come in; -1 = hidden
  const [told, setTold] = useState(false)
  const timers = useRef<number[]>([])
  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  useEffect(() => clear, [])

  const move = (da: number, db: number) => {
    clear()
    let na = Math.max(0, Math.min(a + da, MAX))
    const nb = Math.max(na, Math.min(b + db, MAX))
    na = Math.min(na, nb)
    setA(na)
    setB(nb)
    setLit(-1)
    setTold(false)
  }
  const ok = (da: number, db: number) => {
    const na = a + da
    const nb = b + db
    return !(na < 0 || nb > MAX || na > nb)
  }
  const show = () => {
    clear()
    const gap = instant ? 0 : 90
    const n = Math.max(0, b - a)
    for (let k = 0; k <= n; k++) timers.current.push(window.setTimeout(() => setLit(k), gap * k))
    timers.current.push(window.setTimeout(() => setTold(true), gap * n + 160))
  }

  const n = Math.max(0, b - a)
  const shown = lit >= 0

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-8">
        <p className="font-mono text-[40px] font-semibold" style={{ color: colors.brandDark }}>
          range(
          <span className="mx-1 rounded-lg px-2" style={{ background: colors.surface2, color: colors.brand }}>{a}</span>,
          <span className="mx-1 rounded-lg px-2" style={{ background: colors.surface2, color: colors.brand }}>{b}</span>)
        </p>
        <Stepper label="start" onMinus={() => move(-1, 0)} onPlus={() => move(1, 0)} minus={ok(-1, 0)} plus={ok(1, 0)} />
        <Stepper label="stop" onMinus={() => move(0, -1)} onPlus={() => move(0, 1)} minus={ok(0, -1)} plus={ok(0, 1)} />
      </div>

      <div className="flex gap-3">
        {Array.from({ length: MAX + 1 }, (_, i) => {
          const isIn = shown && i >= a && i < b && i - a < lit
          const isStop = told && i === b
          const tag = isIn && i === a ? 'start' : isStop ? 'stop' : ''
          return (
            <div key={i} className="flex w-[64px] flex-col items-center gap-2">
              <span
                className="relative grid h-[64px] w-[64px] place-items-center rounded-xl font-mono text-[28px] font-semibold"
                style={{
                  transition: 'all 280ms cubic-bezier(0.22,1,0.36,1)',
                  background: isIn ? colors.surface2 : colors.white,
                  color: isIn ? colors.brandDark : isStop ? colors.danger : colors.muted,
                  opacity: isIn || isStop ? 1 : 0.35,
                  boxShadow: `inset 0 0 0 2px ${isIn ? colors.brand : isStop ? colors.danger : colors.line}`,
                  transform: isIn ? 'translateY(-4px)' : 'none',
                }}
              >
                <span className="leading-none">{i}</span>
                {isStop && (
                  <span aria-hidden className="absolute h-[3px] w-[70%] rotate-[-35deg] rounded" style={{ background: colors.danger }} />
                )}
              </span>
              <span className="h-[20px] text-[16px] font-bold uppercase tracking-wide" style={{ color: isStop ? colors.danger : colors.brandDark }}>
                {tag}
              </span>
            </div>
          )
        })}
      </div>

      <p className="min-h-[34px] text-body-lg" style={{ color: colors.body, opacity: told ? 1 : 0, transition: 'opacity 300ms' }}>
        {n ? (
          <>
            stop minus start is <b className="text-ink">{b} − {a} = {n}</b>, so {n} number{n === 1 ? '' : 's'} come
            {n === 1 ? 's' : ''} out. The last one is <b className="text-ink">{b - 1}</b>, never <b className="text-ink">{b}</b>.
          </>
        ) : (
          <>start and stop are the same, so <b className="text-ink">nothing</b> comes out at all.</>
        )}
      </p>

      <div className="flex items-center gap-4">
        <PanelButton onClick={show} disabled={shown}>Show the numbers</PanelButton>
        {!shown && <span className="text-[17px]" style={{ color: colors.muted }}>Say which numbers, and how many. Then press.</span>}
      </div>
      <TraceCaption>{caption}</TraceCaption>
    </div>
  )
}
