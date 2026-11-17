import { motion } from 'framer-motion'
import { colors, easing } from '@/design/tokens'
import { useInstant } from '@/motion/instant'

/**
 * "One container = one process. Node gets a container. Python gets a container."
 *
 * The room's natural instinct is to put both apps in one container, and the TR
 * answers "technically yes, and it would be a mess". A table cannot show a mess.
 * So the left half tries it and visibly fails: both runtimes crammed into one
 * box, the box turning red, and a crash marker landing on BOTH halves at once to
 * make the "one crash takes down both" point. The right half is the same content
 * arranged correctly, and stays calm.
 *
 * The failure plays once and stops on the failed frame, so the presenter can point
 * at it.
 */

const CRASH_AT = 1.6

function Runtime({ logo, name, onDark = false }: { logo: string; name: string; onDark?: boolean }) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg border-2 bg-white px-2.5 py-1.5"
      style={{ borderColor: onDark ? colors.danger : colors.line }}
    >
      <img src={logo} alt="" draggable={false} className="h-5 w-5 object-contain" />
      <span className="text-xs font-bold" style={{ color: colors.ink }}>
        {name}
      </span>
    </div>
  )
}

export function OneProcessRule({ className = '' }: { className?: string }) {
  const instant = useInstant()
  const d = (x: number) => (instant ? 0 : x)

  return (
    <div className={`flex items-start justify-center gap-5 ${className}`}>
      {/* The attempt */}
      <div className="w-[224px]">
        <div className="mb-2 text-center text-xs font-bold uppercase tracking-wide" style={{ color: colors.danger }}>
          Both in one
        </div>
        <motion.div
          className="relative rounded-xl border-2 p-3"
          initial={instant ? false : { borderColor: colors.line, background: '#FFFFFF' }}
          animate={{ borderColor: colors.danger, background: '#FEF2F2' }}
          transition={{ duration: 0.5, delay: d(CRASH_AT), ease: easing.soft }}
        >
          <div className="flex flex-col gap-2">
            <Runtime logo="/assets/tech/nodejs.png" name="Node runtime" onDark />
            <Runtime logo="/assets/tech/python.png" name="Python runtime" onDark />
          </div>
          <div className="mt-2 space-y-1 text-xs font-semibold" style={{ color: colors.danger }}>
            <div>two runtimes in one image</div>
            <div>two processes to babysit</div>
          </div>
          {/* The crash lands across BOTH runtimes, which is the actual argument. */}
          <motion.div
            className="absolute inset-x-3 top-3 flex h-[84px] items-center justify-center rounded-lg"
            style={{ background: 'rgba(239,68,68,0.9)' }}
            initial={instant ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: d(CRASH_AT + 0.25), ease: easing.springy }}
          >
            <span className="text-center text-xs font-bold leading-tight text-white">one crash kills both</span>
          </motion.div>
        </motion.div>
      </div>

      {/* The rule */}
      <div className="w-[224px]">
        <div className="mb-2 text-center text-xs font-bold uppercase tracking-wide" style={{ color: colors.success }}>
          One each
        </div>
        <div className="flex flex-col gap-2">
          {[
            { logo: '/assets/tech/nodejs.png', name: 'Node runtime', svc: 'frontend' },
            { logo: '/assets/tech/python.png', name: 'Python runtime', svc: 'backend' },
          ].map((r, i) => (
            <motion.div
              key={r.svc}
              className="rounded-xl border-2 bg-white p-2.5"
              style={{ borderColor: colors.brand }}
              initial={instant ? false : { opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: d(0.2 + i * 0.15), ease: easing.soft }}
            >
              <Runtime logo={r.logo} name={r.name} />
              <div className="mt-1.5 text-center text-xs font-bold" style={{ color: colors.brandDark }}>
                its own container
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
