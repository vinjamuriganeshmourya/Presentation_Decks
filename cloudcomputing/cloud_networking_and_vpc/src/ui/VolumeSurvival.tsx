import { motion } from 'framer-motion'
import { colors, easing } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { ArrowHead } from './figures/ArrowHead'

/**
 * The volume idea, in three acts on one figure, so the explanation and its proof
 * land on the same picture two sections apart.
 *
 *   act 0   No volume. The container writes `starts.txt` INSIDE itself. The
 *           container is removed and the file goes with it. The host disk below
 *           is drawn, and empty.
 *   act 1   With a volume. The same write lands in the host disk instead. The
 *           container is removed, a new one is created, and it reads the file
 *           back.
 *   act 2   The proof, on the run-it-twice slide. Same drawing, and the counter
 *           in the disk climbs 1, 2, 3 while the container above is replaced
 *           each time.
 *
 * Acts 0 and 1 differ in exactly one thing: whether the write arrow crosses the
 * container's floor. Everything else is held still on purpose.
 */

const W = 560
const CONTAINER = { w: 260, h: 130 }
const DISK = { w: 260, h: 92 }

/** Beats, in seconds. Long enough to narrate over. */
const B = { write: 0.6, remove: 1.9, revive: 2.9, read: 3.6 }

function Disk({
  count,
  filled,
  instant,
}: {
  /** `null` renders the disk without a counter, for acts 0 and 1. */
  count: number | null
  filled: boolean
  instant: boolean
}) {
  return (
    <div
      className="relative mx-auto rounded-xl border-2"
      style={{
        width: DISK.w,
        height: DISK.h,
        borderColor: filled ? colors.teal : colors.line,
        background: filled ? '#E6FAF7' : '#F1F5F9',
      }}
    >
      {/* Act 0 must not name the volume or the host: slide 46 names `db_data` and
          slide 45 defines `host`, and a figure that prints them first takes the
          reveal off both of those slides. */}
      <div
        className="absolute left-3 top-2 font-mono text-xs font-bold"
        style={{ color: filled ? colors.tealDark : colors.muted }}
      >
        {filled ? 'db_data' : 'storage'}
      </div>
      <div className="flex h-full items-center justify-center">
        {filled ? (
          <motion.div
            className="rounded-lg border-2 bg-white px-3 py-1.5 text-center"
            style={{ borderColor: colors.teal }}
            initial={instant ? false : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: instant ? 0 : B.write + 0.5, duration: 0.4, ease: easing.springy }}
          >
            <div className="font-mono text-body-sm font-bold" style={{ color: colors.tealDark }}>
              starts.txt
            </div>
            {count != null && (
              <div className="text-xs font-semibold" style={{ color: colors.body }}>
                {count} {count === 1 ? 'line' : 'lines'}
              </div>
            )}
          </motion.div>
        ) : (
          <span className="text-body-sm font-semibold" style={{ color: colors.muted }}>
            empty
          </span>
        )}
      </div>
      <div
        className="absolute -bottom-6 left-0 right-0 text-center text-xs font-bold uppercase tracking-wide"
        style={{ color: colors.muted }}
      >
        {filled ? 'the host, your machine' : 'outside the container'}
      </div>
    </div>
  )
}

export function VolumeSurvival({
  act,
  /** Act 2 only: how far the counter has climbed on this slide. */
  runs = 3,
}: {
  act: 0 | 1 | 2
  runs?: number
}) {
  const instant = useInstant()
  const t = instant ? 0 : 1
  const kept = act > 0

  return (
    <div className="relative" style={{ width: W, height: 300 }}>
      {/* The container. In every act it is removed partway through, because that
          is the event the whole figure is about. */}
      <motion.div
        className="relative mx-auto rounded-xl border-2 bg-white shadow-card-soft"
        style={{ width: CONTAINER.w, height: CONTAINER.h, borderColor: colors.brand }}
        initial={instant ? false : { opacity: 1 }}
        animate={
          instant
            ? { opacity: 1 }
            : /* removed, then either gone for good (act 0) or replaced (acts 1, 2) */
              kept
              ? { opacity: [1, 1, 0.12, 0.12, 1], scale: [1, 1, 0.94, 0.94, 1] }
              : { opacity: [1, 1, 0.12], scale: [1, 1, 0.94] }
        }
        transition={
          instant
            ? { duration: 0 }
            : {
                duration: B.read,
                times: kept ? [0, B.remove / B.read, (B.remove + 0.4) / B.read, B.revive / B.read, 1] : [0, B.remove / B.read, 1],
                ease: 'easeInOut',
              }
        }
      >
        <div className="absolute left-3 top-2 font-mono text-xs font-bold" style={{ color: colors.brandDark }}>
          backend container
        </div>
        <div className="flex h-full items-center justify-center pt-4">
          {/* Act 0 keeps the file inside the box, which is why it dies with it. */}
          {act === 0 ? (
            <motion.div
              className="rounded-lg border-2 bg-white px-3 py-1.5 font-mono text-body-sm font-bold"
              style={{ borderColor: colors.danger, color: colors.danger }}
              initial={instant ? false : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: instant ? 0 : B.write, duration: 0.4, ease: easing.springy }}
            >
              starts.txt
            </motion.div>
          ) : (
            <div className="text-center">
              <div className="font-mono text-body-sm font-bold" style={{ color: colors.brandDark }}>
                /app/data
              </div>
              <div className="text-xs font-semibold" style={{ color: colors.muted }}>
                plugged into the volume
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* The write. In acts 1 and 2 it crosses the container floor into the disk;
          in act 0 there is no arrow at all, because nothing left the box. */}
      <div className="relative mx-auto" style={{ width: CONTAINER.w, height: 42 }}>
        {kept && (
          <svg width={CONTAINER.w} height={42} className="absolute inset-0" style={{ overflow: 'visible' }}>
            <motion.path
              d={`M ${CONTAINER.w / 2} 2 L ${CONTAINER.w / 2} 34`}
              fill="none"
              stroke={colors.teal}
              strokeWidth={3}
              initial={instant ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5 * t, delay: B.write * t, ease: 'easeOut' }}
            />
            <ArrowHead
              d={`M ${CONTAINER.w / 2} 2 L ${CONTAINER.w / 2} 34`}
              color={colors.teal}
              strokeWidth={3}
              initial={instant ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 * t, delay: (B.write + 0.4) * t }}
            />
          </svg>
        )}
        {!kept && (
          <div
            className="absolute inset-x-0 top-3 text-center text-xs font-bold uppercase tracking-wide"
            style={{ color: colors.danger }}
          >
            removed with the container
          </div>
        )}
      </div>

      <Disk count={act === 2 ? runs : null} filled={kept} instant={instant} />
    </div>
  )
}
