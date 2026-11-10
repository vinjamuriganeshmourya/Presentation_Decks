import { motion } from 'framer-motion'
import { colors, easing } from '@/design/tokens'
import { useInstant } from '@/motion/instant'

/**
 * Why running containers by hand does not scale.
 *
 * The TR makes the point arithmetically: six commands for two services, and a
 * real backend is normally four services (add a database and a cache). The
 * figure animates that arithmetic: the two known services are listed, then the
 * two new ones drop in and the command count rolls from 6 to 12.
 *
 * The count is the content, so it is a large numeral rather than a caption. The
 * two new rows arrive DASHED, because they are not part of today's exercise: they
 * are the shape of a real project, named but not built (session scope rule S1).
 */

const GROW_AT = 1.4

const KNOWN = [
  { name: 'backend', note: 'cd, build, run' },
  { name: 'frontend', note: 'cd, build, run' },
]
const EXTRA = [
  { name: 'database', note: 'cd, build, run' },
  { name: 'cache', note: 'cd, build, run' },
]

function Row({
  name,
  note,
  dashed = false,
  delay,
  instant,
}: {
  name: string
  note: string
  dashed?: boolean
  delay: number
  instant: boolean
}) {
  return (
    <motion.div
      className="flex items-center justify-between rounded-lg border-2 bg-white px-3 py-2"
      style={{
        borderColor: dashed ? colors.muted : colors.brand,
        borderStyle: dashed ? 'dashed' : 'solid',
      }}
      initial={instant ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: instant ? 0 : delay, ease: easing.soft }}
    >
      <span className="font-mono text-body-sm font-bold" style={{ color: dashed ? colors.body : colors.brandDark }}>
        {name}
      </span>
      <span className="text-xs font-semibold" style={{ color: colors.muted }}>
        {note}
      </span>
    </motion.div>
  )
}

export function HandRitual({ className = '' }: { className?: string }) {
  const instant = useInstant()

  return (
    <div className={`flex items-center justify-center gap-6 ${className}`}>
      <div className="w-[268px] space-y-2">
        {KNOWN.map((r, i) => (
          <Row key={r.name} {...r} delay={0.15 + i * 0.12} instant={instant} />
        ))}
        {EXTRA.map((r, i) => (
          <Row key={r.name} {...r} dashed delay={GROW_AT + i * 0.18} instant={instant} />
        ))}
      </div>

      <div className="text-center">
        <div className="text-xs font-bold uppercase tracking-wide" style={{ color: colors.muted }}>
          commands to type
        </div>
        {/* Two numerals stacked in the same slot: the 6 fades out as the 12 fades
            in, so the value appears to change rather than two values appearing. */}
        <div className="relative mx-auto mt-1 h-[74px] w-[120px]">
          <motion.div
            className="absolute inset-0 font-heading text-hero font-extrabold leading-none"
            style={{ color: colors.brandDeep }}
            initial={instant ? false : { opacity: 1 }}
            animate={{ opacity: instant ? 0 : [1, 1, 0] }}
            transition={{ duration: instant ? 0 : GROW_AT + 0.4, times: [0, 0.78, 1] }}
          >
            6
          </motion.div>
          <motion.div
            className="absolute inset-0 font-heading text-hero font-extrabold leading-none"
            style={{ color: colors.danger }}
            initial={instant ? false : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: instant ? 0 : GROW_AT + 0.3, ease: easing.springy }}
          >
            12
          </motion.div>
        </div>
        <motion.div
          className="mt-1 max-w-[150px] text-xs font-bold"
          style={{ color: colors.danger }}
          initial={instant ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: instant ? 0 : GROW_AT + 0.6 }}
        >
          and every one is a chance to be in the wrong folder
        </motion.div>
      </div>
    </div>
  )
}
