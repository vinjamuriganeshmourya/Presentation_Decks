import { motion } from 'framer-motion'
import { colors, easing } from '@/design/tokens'
import { useInstant } from '@/motion/instant'

/**
 * What `docker compose up` did without being asked.
 *
 * Sits beside the `up` transcript and ticks the four created things in the SAME
 * order the transcript prints them, so the eye pairs figure to output line by
 * line. That pairing is the reason this is not a bullet list: the transcript is
 * the evidence, and the figure is the index into it.
 *
 * `depends_on` is drawn as the arrow between the two container rows rather than as
 * a fifth item, because start order is not a thing Compose created, it is the
 * order in which it created two of them.
 */

const ITEMS = [
  { label: 'Network', name: 'docker-demo_default', icon: 'net' as const },
  { label: 'Volume', name: 'docker-demo_db_data', icon: 'disk' as const },
  { label: 'Container', name: 'docker-demo-backend-1', icon: 'box' as const },
  { label: 'Container', name: 'docker-demo-frontend-1', icon: 'box' as const },
]

const GLYPH = {
  net: 'M5 12h14M12 5v14M7.5 7.5l9 9M16.5 7.5l-9 9',
  disk: 'M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Zm0 0v10c0 1.7 3.6 3 8 3s8-1.3 8-3V7',
  box: 'M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9ZM12 12l8.5-4.5M12 12v9M12 12 3.5 7.5',
}

export function StackUp({ className = '' }: { className?: string }) {
  const instant = useInstant()

  return (
    <div className={`space-y-2 ${className}`}>
      {ITEMS.map((it, i) => (
        <motion.div
          key={it.name}
          className="flex items-center gap-3 rounded-lg border-2 bg-white px-3 py-2"
          style={{ borderColor: colors.line }}
          initial={instant ? false : { opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: instant ? 0 : 0.3 + i * 0.35, ease: easing.soft }}
        >
          <motion.span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
            style={{ background: colors.success }}
            initial={instant ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: instant ? 0 : 0.55 + i * 0.35, ease: easing.springy }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </motion.span>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.brand} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d={GLYPH[it.icon]} />
          </svg>
          <span className="w-[76px] shrink-0 text-xs font-bold uppercase tracking-wide" style={{ color: colors.muted }}>
            {it.label}
          </span>
          <span className="font-mono text-body-sm font-semibold" style={{ color: colors.ink }}>
            {it.name}
          </span>
        </motion.div>
      ))}

      <motion.div
        className="pt-1 text-center text-xs font-bold"
        style={{ color: colors.brandDeep }}
        initial={instant ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: instant ? 0 : 1.9 }}
      >
        backend before frontend, because of depends_on
      </motion.div>
    </div>
  )
}
