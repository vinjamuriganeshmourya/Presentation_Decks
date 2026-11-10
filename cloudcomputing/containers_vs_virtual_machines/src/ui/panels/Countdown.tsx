import { useEffect, useRef, useState } from 'react'
import { colors } from '@/design/tokens'

/**
 * A class timer: one button, a dial that drains, the digits.
 *
 * From PF 14 "For Loop", where every hands-on card carried one (worksheet
 * tasks, the coding challenge, the exit question). The instructor presses play;
 * nothing starts by itself. Press again to pause; at 0:00 the next press starts
 * it over. It warns (amber) in its last quarter or last 30 seconds, whichever is
 * shorter, and goes red at zero. Leaving the slide unmounts it, which resets it:
 * a timer the room left behind must not be half-spent when they come back.
 */
const R = 15
const LEN = 2 * Math.PI * R

function fmt(n: number) {
  const m = Math.floor(n / 60)
  const s = n % 60
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

export function Countdown({ seconds }: { seconds: number }) {
  const [left, setLeft] = useState(seconds)
  const [running, setRunning] = useState(false)
  const tick = useRef<number | null>(null)

  useEffect(() => {
    if (!running) return
    tick.current = window.setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          setRunning(false)
          return 0
        }
        return l - 1
      })
    }, 1000)
    return () => {
      if (tick.current) window.clearInterval(tick.current)
    }
  }, [running])

  const done = left <= 0
  const warn = !done && left <= Math.min(30, Math.round(seconds * 0.25))
  const tone = done ? colors.danger : warn ? colors.warning : colors.brand

  return (
    <span className="inline-flex items-center gap-3 self-start rounded-pill bg-white py-2 pl-2 pr-5 shadow-card-soft ring-1 ring-line">
      <button
        type="button"
        aria-label={done ? 'Restart the timer' : running ? 'Pause the timer' : 'Start the timer'}
        onKeyDown={(e) => e.key !== 'Enter' && e.key !== ' ' && e.currentTarget.blur()}
        onClick={() => {
          if (done) {
            setLeft(seconds)
            setRunning(true)
          } else setRunning((r) => !r)
        }}
        className="grid h-11 w-11 place-items-center rounded-full text-white"
        style={{ background: tone }}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
          {running ? (
            <>
              <rect x="6.6" y="4.4" width="4.2" height="15.2" rx="1.4" />
              <rect x="13.2" y="4.4" width="4.2" height="15.2" rx="1.4" />
            </>
          ) : (
            <path d="M7.4 4.4 L19.4 12 L7.4 19.6 Z" />
          )}
        </svg>
      </button>
      <svg viewBox="0 0 36 36" width="36" height="36" aria-hidden className="-rotate-90">
        <circle cx="18" cy="18" r={R} fill="none" stroke={colors.line} strokeWidth="3.5" />
        <circle
          cx="18"
          cy="18"
          r={R}
          fill="none"
          stroke={tone}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={LEN}
          strokeDashoffset={LEN * (1 - left / seconds)}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <span role="timer" className="font-body text-body-lg font-semibold tabular-nums" style={{ color: done ? colors.danger : colors.ink }}>
        {fmt(left)}
      </span>
    </span>
  )
}
