import { useEffect, useState, type ReactNode } from 'react'
import { colors } from '@/design/tokens'

/**
 * A PHONE, drawn to the detail that makes it read as a phone.
 *
 * Course rule R5b: the hook depends on the room recognising the object before
 * it is asked to accept an abstraction, so the frame carries what a real phone
 * carries: the island, the clock, signal, wifi and battery, the home bar. A
 * rectangle with a notch reads as a wireframe, and a wireframe is a diagram.
 *
 * No product mark and no product name anywhere (content rule 12): the chat app
 * is a chat app, not a trademark. The status bar's colour is the screen's own.
 */

/** The chat app's own palette. Not brand tokens: these are the screen's colours. */
export const CHAT = {
  bar: '#0B7A66',
  wall: '#EFE7DC',
  wallMark: 'rgba(140,120,96,0.16)',
  mine: '#DCF6C8',
  theirs: '#FFFFFF',
  tick: '#53A6E8',
  hit: '#FFE58A',
} as const

/**
 * A real running clock (user, 2026-10-08, slide 4): the device's own time,
 * h:mm, re-read every second so the minute turns over when it should.
 */
export function LiveClock() {
  const read = () => {
    const d = new Date()
    return `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  const [t, setT] = useState(read)
  useEffect(() => {
    const id = window.setInterval(() => setT(read()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return <>{t}</>
}

function StatusBar({ light, time = '9:41' }: { light: boolean; time?: ReactNode }) {
  const ink = light ? colors.white : colors.ink
  /* Clock left of the island, icons right of it, never under it: the island is
     62px centred, and the icons are sized so they start clear of its edge. */
  return (
    <div className="flex h-[30px] items-center justify-between pl-[18px] pr-[14px] text-[12.5px] font-semibold" style={{ color: ink }}>
      <span>{time}</span>
      <span className="flex items-center gap-[4px]">
        {/* signal */}
        <svg width="14" height="10" viewBox="0 0 18 12" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={i * 4.5} y={9 - i * 3} width="3" height={3 + i * 3} rx="0.8" fill={ink} />
          ))}
        </svg>
        {/* wifi */}
        <svg width="13" height="10" viewBox="0 0 16 12" fill="none" stroke={ink} strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <path d="M1.5 4.2a9.5 9.5 0 0 1 13 0" />
          <path d="M4 7a5.8 5.8 0 0 1 8 0" />
          <circle cx="8" cy="10" r="0.9" fill={ink} />
        </svg>
        {/* battery */}
        <svg width="21" height="10" viewBox="0 0 26 12" aria-hidden>
          <rect x="0.8" y="0.8" width="21" height="10.4" rx="3" fill="none" stroke={ink} strokeOpacity="0.55" strokeWidth="1.4" />
          <rect x="2.6" y="2.6" width="15" height="6.8" rx="1.6" fill={ink} />
          <rect x="23" y="4" width="2" height="4" rx="1" fill={ink} fillOpacity="0.55" />
        </svg>
      </span>
    </div>
  )
}

/**
 * Real phone proportions: 232 x 478 is 1 : 2.06, the outline of a current
 * handset (the first cut was 264 x 418, 1 : 1.58, which read as a tablet).
 * `PHONE_LIFT` lets the phone alone rise into Space-3 (x 64..880, y 162..240),
 * which is legal on the left of the canvas and keeps its foot clear of the
 * control cluster at the bottom left. The text column beside it does not move.
 */
export const PHONE = { width: 232, height: 478 } as const
export const PHONE_LIFT = 48

export function Phone({
  width = PHONE.width,
  height = PHONE.height,
  time,
  island = { w: 62, h: 21 },
  top,
  children,
}: {
  width?: number
  height?: number
  /** The status bar's clock: a fixed time, or `<LiveClock />`. */
  time?: ReactNode
  /** The island's size, or `null` for none. The default suits the 232px phone. */
  island?: { w: number; h: number } | null
  /** The strip behind the status bar and the app's own header. */
  top: { bg: string; light: boolean; header: ReactNode }
  children: ReactNode
}) {
  return (
    <div
      className="relative shrink-0 rounded-[42px] p-[8px] shadow-float"
      style={{ width, height, background: '#15191F' }}
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-[34px]" style={{ background: colors.white }}>
        <div style={{ background: top.bg, transition: 'background-color 480ms cubic-bezier(0.22,1,0.36,1)' }}>
          <StatusBar light={top.light} time={time} />
          {top.header}
        </div>
        {/* the island */}
        {island && <span aria-hidden className="absolute left-1/2 top-[7px] -translate-x-1/2 rounded-full" style={{ width: island.w, height: island.h, background: '#15191F' }} />}
        <div className="relative min-h-0 flex-1">{children}</div>
        <span aria-hidden className="absolute bottom-[6px] left-1/2 h-[4px] w-[88px] -translate-x-1/2 rounded-full" style={{ background: 'rgba(11,26,43,0.35)' }} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ icons */

export function Back({ color }: { color: string }) {
  return (
    <svg width="11" height="18" viewBox="0 0 14 22" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 3 3 11l8 8" />
    </svg>
  )
}

export function Avatar() {
  return (
    <span className="grid h-[30px] w-[30px] shrink-0 place-items-center overflow-hidden rounded-full" style={{ background: '#D9DEE6' }}>
      <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden>
        <circle cx="17" cy="13" r="6.5" fill="#FFFFFF" />
        <path d="M5 32c1.8-7 6.6-10 12-10s10.2 3 12 10" fill="#FFFFFF" />
      </svg>
    </span>
  )
}
