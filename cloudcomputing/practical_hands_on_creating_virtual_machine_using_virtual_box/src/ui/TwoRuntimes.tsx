import { motion } from 'framer-motion'
import { colors, easing } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { ArrowHead } from './figures/ArrowHead'

/**
 * "Your application is not one program. It is two, and neither is any use
 * without the other."
 *
 * Deliberately NOT `TwoApps` from Session 1. That figure carries ports on both
 * boxes and a browser above them, which is problem 2 (hosting) and is not opened
 * in this session. This one draws only what today's claim needs: two programs,
 * two runtimes, and traffic in both directions between them.
 *
 * The runtime chip is the point of the figure, so it sits under each app name in
 * the accent position rather than as a footnote.
 */

/* Width only. A fixed height clipped the Django card's runtime chip, because its
   role line wraps to two lines where React's does not. `items-stretch` on the row
   keeps the two cards equal without either of them being capped. */
const CARD = { w: 216 }

function App({
  name,
  role,
  runtime,
  logo,
  delay,
  instant,
}: {
  name: string
  role: string
  runtime: string
  logo: string
  delay: number
  instant: boolean
}) {
  return (
    <motion.div
      className="rounded-card border-2 bg-white p-4 text-center shadow-card-soft"
      style={{ width: CARD.w, borderColor: colors.line }}
      initial={instant ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: instant ? 0 : delay, ease: easing.soft }}
    >
      <img src={logo} alt="" draggable={false} className="mx-auto h-10 w-10 object-contain" />
      <div className="mt-2 font-heading text-body-lg font-bold" style={{ color: colors.ink }}>
        {name}
      </div>
      <div className="text-xs font-semibold" style={{ color: colors.muted }}>
        {role}
      </div>
      <div
        className="mt-2 inline-block rounded-pill px-2.5 py-0.5 font-mono text-xs font-bold"
        style={{ background: colors.surface2, color: colors.brandDark }}
      >
        {runtime}
      </div>
    </motion.div>
  )
}

export function TwoRuntimes({ className = '' }: { className?: string }) {
  const instant = useInstant()
  const t = instant ? 0 : 1

  return (
    <div className={`flex items-stretch justify-center gap-3 ${className}`}>
      <App
        name="React"
        role="the UI, components, fetch calls"
        runtime="Node.js"
        logo="/assets/tech/react.png"
        delay={0.1}
        instant={instant}
      />

      {/* Both arrows, because the dependency runs both ways: the UI asks, the API
          answers, and neither is any use alone. A single arrow would read as one
          calling the other and being done. */}
      <div className="flex w-24 shrink-0 flex-col items-center gap-1">
        <svg width={88} height={44} viewBox="0 0 88 44" style={{ overflow: 'visible' }}>
          <motion.path
            d="M 2 13 L 84 13"
            fill="none"
            stroke={colors.brand}
            strokeWidth={3}
            initial={instant ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5 * t, delay: 0.6 * t, ease: 'easeOut' }}
          />
          <ArrowHead
            d="M 2 13 L 84 13"
            color={colors.brand}
            strokeWidth={3}
            initial={instant ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 * t, delay: 1.0 * t }}
          />
          <motion.path
            d="M 86 33 L 4 33"
            fill="none"
            stroke={colors.teal}
            strokeWidth={3}
            initial={instant ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5 * t, delay: 0.85 * t, ease: 'easeOut' }}
          />
          <ArrowHead
            d="M 86 33 L 4 33"
            color={colors.teal}
            strokeWidth={3}
            initial={instant ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 * t, delay: 1.25 * t }}
          />
        </svg>
        <span className="text-center text-xs font-bold" style={{ color: colors.body }}>
          neither works alone
        </span>
      </div>

      <App
        name="Django"
        role="the APIs, models, business logic"
        runtime="Python"
        logo="/assets/tech/django.png"
        delay={0.25}
        instant={instant}
      />
    </div>
  )
}
