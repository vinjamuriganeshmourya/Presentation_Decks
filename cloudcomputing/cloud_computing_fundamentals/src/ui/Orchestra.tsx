import { motion } from 'framer-motion'
import { colors, easing } from '@/design/tokens'
import { useInstant } from '@/motion/instant'

/**
 * The session's signature scene, and the analogy the TR opens Compose with.
 *
 * A single musician can start playing alone. An orchestra cannot: someone has to
 * decide who plays, when they start, and how they stay in sync. That is the
 * conductor, reading from one score.
 *
 * The teaching is entirely in the TIMING, so the animation is the content: the
 * four players sit dark and idle, the baton rises, and all four light on the SAME
 * frame. Not staggered. A stagger would say "started one by one", which is the
 * `docker run` slide, not this one.
 *
 * Drawn, not photographed, because a stock orchestra photo carries a concert hall,
 * an audience and a mood, none of which map onto anything. Four seats, a stand and
 * a baton map exactly.
 */

const DOWNBEAT = 1.5

/** Each player is one container-to-be. Labelled by instrument, not by service:
 *  naming them `backend` and `frontend` here would cash the analogy out before
 *  the mapping slide does it properly. */
const PLAYERS = [
  { x: 104, y: 152, glyph: 'M7 17.5a3.5 3.5 0 1 0 7 0V4l6 2', label: 'Violin' },
  { x: 212, y: 188, glyph: 'M12 3v12m0 0a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z', label: 'Cello' },
  { x: 348, y: 188, glyph: 'M5 9h14M5 15h14M9 5v14M15 5v14', label: 'Flute' },
  { x: 456, y: 152, glyph: 'M4 12h4l3-6 3 12 3-6h4', label: 'Timpani' },
]

function Player({
  p,
  playing,
  instant,
}: {
  p: (typeof PLAYERS)[number]
  playing: boolean
  instant: boolean
}) {
  return (
    <motion.div
      className="absolute flex flex-col items-center"
      style={{ left: p.x, top: p.y }}
      initial={instant ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: instant ? 0 : 0.15, ease: easing.soft }}
    >
      <motion.div
        className="flex h-14 w-14 items-center justify-center rounded-xl border-2"
        initial={instant ? false : { background: '#F1F5F9', borderColor: colors.line }}
        animate={
          playing
            ? { background: colors.brand, borderColor: colors.brand }
            : { background: '#F1F5F9', borderColor: colors.line }
        }
        transition={{ duration: 0.45, delay: instant ? 0 : DOWNBEAT, ease: easing.soft }}
      >
        <svg width={26} height={26} viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round">
          <motion.path
            d={p.glyph}
            initial={instant ? false : { stroke: colors.muted }}
            animate={{ stroke: playing ? '#FFFFFF' : colors.muted }}
            transition={{ duration: 0.45, delay: instant ? 0 : DOWNBEAT }}
          />
        </svg>
      </motion.div>
      <span className="mt-1 text-xs font-bold" style={{ color: colors.body }}>
        {p.label}
      </span>
    </motion.div>
  )
}

export function Orchestra() {
  const instant = useInstant()

  return (
    <div className="relative" style={{ width: 560, height: 312 }}>
      {/* The score. One document, in front of one person, which is the half of the
          analogy that maps onto the file rather than onto the command. */}
      <motion.div
        /* NOT `-translate-x-1/2`: this element animates `y`, so framer-motion
           writes an inline transform every frame and the Tailwind translate is
           discarded. Centre it through the animation instead. See CLAUDE.md §6. */
        className="absolute left-1/2 top-2 rounded-lg border-2 bg-white px-4 py-2 shadow-card-soft"
        style={{ borderColor: colors.brand }}
        initial={instant ? false : { opacity: 0, x: '-50%', y: -8 }}
        animate={{ opacity: 1, x: '-50%', y: 0 }}
        transition={{ duration: 0.5, ease: easing.soft }}
      >
        <div className="flex items-center gap-2">
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.brand} strokeWidth={2} strokeLinecap="round">
            <path d="M4 5h16M4 9h16M4 13h10M4 17h6" />
          </svg>
          <span className="text-body-sm font-bold" style={{ color: colors.brandDeep }}>
            One score
          </span>
        </div>
      </motion.div>

      {/* The conductor. The baton is the only thing that MOVES before the
          downbeat, so the eye is already on it when the players light. */}
      <motion.div
        /* Same treatment for consistency, even though this one animates opacity
           only and its class would have survived. */
        className="absolute left-1/2 flex flex-col items-center"
        style={{ top: 76 }}
        initial={instant ? false : { opacity: 0, x: '-50%' }}
        animate={{ opacity: 1, x: '-50%' }}
        transition={{ duration: 0.5, delay: instant ? 0 : 0.3 }}
      >
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 bg-white"
          style={{ borderColor: colors.brandDeep }}
        >
          <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke={colors.brandDeep} strokeWidth={2} strokeLinecap="round">
            <circle cx="12" cy="7" r="3.2" />
            <path d="M5.5 21c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" />
          </svg>
        </div>
        <span className="mt-1 text-xs font-bold uppercase tracking-wide" style={{ color: colors.brandDeep }}>
          Conductor
        </span>
        <motion.svg
          className="absolute"
          style={{ left: 52, top: 6, transformOrigin: '4px 30px' }}
          width={44}
          height={36}
          viewBox="0 0 44 36"
          initial={instant ? false : { rotate: 26 }}
          animate={{ rotate: instant ? -18 : [26, -18, -18] }}
          transition={{ duration: instant ? 0 : DOWNBEAT + 0.3, times: [0, 0.82, 1], ease: 'easeInOut' }}
        >
          <path d="M4 30 L38 4" stroke={colors.accent} strokeWidth={3} strokeLinecap="round" />
          <circle cx="39" cy="3" r="3" fill={colors.accent} />
        </motion.svg>
      </motion.div>

      {PLAYERS.map((p) => (
        <Player key={p.label} p={p} playing instant={instant} />
      ))}

      {/* The one line that names what just happened, on the downbeat. */}
      <motion.div
        className="absolute left-0 right-0 text-center text-body-sm font-bold"
        style={{ bottom: 0, color: colors.brandDeep }}
        /* Its own row: at height 274 this line ran through the front-row labels. */
        initial={instant ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: instant ? 0 : DOWNBEAT + 0.2, ease: easing.soft }}
      >
        One baton, and all of them start together
      </motion.div>
    </div>
  )
}
