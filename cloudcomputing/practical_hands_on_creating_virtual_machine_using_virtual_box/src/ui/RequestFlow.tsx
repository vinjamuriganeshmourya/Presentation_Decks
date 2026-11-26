import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { iconByName } from './icons'
import { accentByTone } from '@/design/tokens'

/**
 * A looping, real-time visualization of one request/response round trip:
 * a request packet travels Browser → Django, then a response packet travels
 * back. Fixed geometry + `x` transforms keep the motion smooth (GPU) and the
 * labels readable. Uses only the session's own terms — no outside analogy.
 */

const W = 820 // fixed stage width (the deck canvas is fixed, so geometry is deterministic)
const H = 210
const BOX = 96
const NODE_TOP = 32
const TRACK_TOP = NODE_TOP + BOX / 2 // vertical centre of the node boxes
const TRACK_LEFT = 132
const TRACK_W = W - TRACK_LEFT * 2 // symmetric track between the two nodes
const CYCLE = 4 // seconds for a full request-then-response loop

function Node({
  icon,
  title,
  sub,
  color,
  side,
}: {
  icon: ReactNode
  title: string
  sub: string
  color: string
  side: 'left' | 'right'
}) {
  const left = side === 'left' ? 30 : W - 30 - BOX
  return (
    <div className="absolute flex flex-col items-center" style={{ left, top: NODE_TOP, width: BOX }}>
      <motion.div
        className="grid place-items-center rounded-2xl border-2 bg-white shadow-card"
        style={{ width: BOX, height: BOX, borderColor: color }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: CYCLE, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span style={{ color }}>{icon}</span>
      </motion.div>
      <p className="mt-2 font-heading text-base font-bold text-ink">{title}</p>
      <p className="font-mono text-body-sm text-body">{sub}</p>
    </div>
  )
}

function Packet({
  label,
  color,
  reverse = false,
  delay = 0,
}: {
  label: string
  color: string
  reverse?: boolean
  delay?: number
}) {
  // Hold at the start edge, glide across, hold at the far edge (fading at each end).
  const xs = reverse ? [TRACK_W, TRACK_W, 0, 0] : [0, 0, TRACK_W, TRACK_W]
  return (
    <motion.div
      className="absolute z-10"
      style={{ left: TRACK_LEFT, top: TRACK_TOP }}
      initial={{ opacity: 0, x: xs[0] }}
      animate={{ x: xs, opacity: [0, 1, 1, 0] }}
      transition={{
        duration: CYCLE / 2,
        times: [0, 0.14, 0.86, 1],
        ease: 'easeInOut',
        repeat: Infinity,
        repeatDelay: CYCLE / 2,
        delay,
      }}
    >
      {/* inner div centres the pill on the travelling point (its transform is
          independent of the animated `x` on the parent). */}
      <div className="-translate-x-1/2 -translate-y-1/2 whitespace-nowrap">
        <span
          className="rounded-pill px-4 py-1.5 font-mono text-body-sm font-semibold text-white shadow-card"
          style={{ background: color }}
        >
          {label}
        </span>
      </div>
    </motion.div>
  )
}

export function RequestFlow({ className = '' }: { className?: string }) {
  const Chat = iconByName.chat
  const Server = iconByName.server
  const brand = accentByTone.brand
  const teal = accentByTone.teal
  const success = accentByTone.success

  return (
    <div className={className}>
      <div className="relative mx-auto" style={{ width: W, height: H }}>
        {/* track */}
        <div
          className="absolute rounded-full bg-line"
          style={{ left: TRACK_LEFT, width: TRACK_W, top: TRACK_TOP - 2, height: 4 }}
        />
        <Node side="left" icon={<Chat width={40} height={40} />} title="Browser" sub=":3000" color={brand} />
        <Node side="right" icon={<Server width={40} height={40} />} title="Django" sub=":8000" color={teal} />
        <Packet label="GET /api/products/" color={brand} />
        <Packet label="200 OK · JSON" color={success} reverse delay={CYCLE / 2} />
      </div>
      <p className="mt-6 text-center text-body">Request out, response back.</p>
    </div>
  )
}
