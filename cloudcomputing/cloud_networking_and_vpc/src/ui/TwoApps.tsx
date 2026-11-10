import type { ReactNode } from 'react'
import { RevealGroup, Reveal } from '@/motion/Reveal'
import { iconByName } from './icons'
import { accentByTone } from '@/design/tokens'

/**
 * Custom illustration for the session's opening problem: two apps that both
 * run but aren't wired to each other — React (:3000) talks to someone else's
 * static API, Django (:8000) sits unused. The broken connector in the middle
 * is the whole point of the session.
 */

function Card({
  icon,
  title,
  port,
  note,
  color,
}: {
  icon: ReactNode
  title: string
  /** Omit when the app has no established port yet (doc §2: pre-setup). */
  port?: string
  note: string
  color: string
}) {
  return (
    <div
      className="flex w-64 flex-col items-center gap-1.5 rounded-card border-2 bg-white px-6 py-6 text-center shadow-card"
      style={{ borderColor: color }}
    >
      <span className="grid h-14 w-14 place-items-center rounded-2xl" style={{ background: `${color}18`, color }}>
        {icon}
      </span>
      <p className="mt-1 font-heading text-lg font-bold text-ink">{title}</p>
      {port && (
        <p className="font-mono text-body-sm" style={{ color }}>{port}</p>
      )}
      <p className="mt-1 text-body-sm text-body">{note}</p>
    </div>
  )
}

export function TwoApps({ className = '' }: { className?: string }) {
  const Chat = iconByName.chat
  const ServerIcon = iconByName.server
  const brand = accentByTone.brand
  const teal = accentByTone.teal
  const warn = accentByTone.accent

  return (
    <RevealGroup className={`flex items-center justify-center ${className}`} stagger={0.14}>
      <Reveal dir="right">
        <Card
          icon={<Chat width={28} height={28} />}
          title="React · NxtTrendz"
          port=":3000"
          note="→ apis.ccbp.in (someone else’s server)"
          color={brand}
        />
      </Reveal>

      {/* broken connector — "no wire yet" */}
      <Reveal dir="scale">
        <div className="relative mx-6 flex w-44 items-center justify-center">
          <span className="absolute left-0 top-1/2 h-[3px] w-[36%] -translate-y-1/2 rounded-full" style={{ background: `${warn}55` }} />
          <span className="absolute right-0 top-1/2 h-[3px] w-[36%] -translate-y-1/2 rounded-full" style={{ background: `${warn}55` }} />
          <span
            className="relative z-10 rounded-pill border-2 bg-white px-3 py-1 font-heading text-body-sm font-bold"
            style={{ borderColor: warn, color: warn }}
          >
            no wire yet
          </span>
        </div>
      </Reveal>

      <Reveal dir="left">
        <Card
          icon={<ServerIcon width={28} height={28} />}
          title="Django REST API"
          note="runs perfectly, and nothing calls it"
          color={teal}
        />
      </Reveal>
    </RevealGroup>
  )
}
