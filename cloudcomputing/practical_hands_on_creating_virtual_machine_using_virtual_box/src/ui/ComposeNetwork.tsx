import { motion } from 'framer-motion'
import { colors, easing } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { ArrowHead } from './figures/ArrowHead'

/**
 * The session's last idea, and the one the TR calls the number one
 * multi-container mistake: inside a container, `localhost` is the container
 * itself.
 *
 *   act 0   The frontend sends to `localhost:8000`. The arrow leaves the box,
 *           curves straight back into the same box, and turns red. Nothing is
 *           listening there.
 *   act 1   The frontend sends to `backend:8000`. The same arrow crosses the
 *           network to the other container and turns green.
 *
 * Both acts draw the SAME two containers inside the SAME network boundary in
 * the same positions, so the only thing that changes between the two slides is
 * where the arrow goes. That difference is the whole teaching, and it is spatial,
 * which is why this is a figure and not a table.
 *
 * The backend box is drawn identically in both acts, including in act 0 where it
 * is never reached. Dimming it would suggest the backend is the problem; the
 * problem is the address.
 */

/** The one thing act 0 must not do: look like a network failure. It is a
 *  successful request, delivered to the wrong place. */
const W = 620
const H = 268

/** Geometry, shared by both acts so the boxes cannot drift between slides. */
const BOX = { w: 190, h: 96 }
const FE = { x: 46, y: 118 }
const BE = { x: W - 46 - BOX.w, y: 118 }

function Container({
  x,
  y,
  name,
  runtime,
  logo,
}: {
  x: number
  y: number
  name: string
  runtime: string
  logo: string
}) {
  return (
    <div
      className="absolute rounded-xl border-2 bg-white shadow-card-soft"
      style={{ left: x, top: y, width: BOX.w, height: BOX.h, borderColor: colors.brand }}
    >
      <div className="flex h-full flex-col items-center justify-center gap-1">
        <img src={logo} alt="" draggable={false} className="h-7 w-7 object-contain" />
        <div className="font-mono text-body-sm font-bold" style={{ color: colors.brandDark }}>
          {name}
        </div>
        <div className="text-xs font-semibold" style={{ color: colors.muted }}>
          {runtime}
        </div>
      </div>
    </div>
  )
}

export function ComposeNetwork({ act }: { act: 0 | 1 }) {
  const instant = useInstant()
  const t = instant ? 0 : 1

  /* Act 0: out of the frontend's right edge, a loop that returns to its own left
     edge. Act 1: a straight run across to the backend. Both start at the same
     point, so the two slides share an origin the eye can hold. */
  const from = { x: FE.x + BOX.w, y: FE.y + BOX.h / 2 }
  const loop = `M ${from.x} ${from.y} C ${from.x + 74} ${from.y - 74}, ${FE.x - 74} ${from.y - 74}, ${FE.x - 2} ${from.y}`
  const cross = `M ${from.x} ${from.y} L ${BE.x - 2} ${from.y}`
  const path = act === 0 ? loop : cross
  const stroke = act === 0 ? colors.danger : colors.success
  const label = act === 0 ? 'localhost:8000' : 'backend:8000'

  return (
    <div className="relative" style={{ width: W, height: H }}>
      {/* The network boundary. Compose created it without being asked, so it is
          drawn as the ground both containers sit on, not as a box added later. */}
      <motion.div
        className="absolute inset-0 rounded-xl2 border-2 border-dashed"
        style={{ borderColor: colors.line, background: colors.surface }}
        initial={instant ? false : { opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 * t, ease: easing.soft }}
      />
      <div
        className="absolute left-4 top-3 rounded-pill px-2.5 py-1 font-mono text-xs font-bold"
        style={{ background: colors.surface2, color: colors.brandDeep }}
      >
        docker-demo_default
      </div>

      <Container x={FE.x} y={FE.y} name="frontend" runtime="Node" logo="/assets/tech/nodejs.png" />
      <Container x={BE.x} y={BE.y} name="backend" runtime="Python" logo="/assets/tech/python.png" />

      <svg className="absolute inset-0" width={W} height={H} style={{ overflow: 'visible' }}>
        <motion.path
          d={path}
          fill="none"
          stroke={stroke}
          strokeWidth={3}
          strokeLinecap="round"
          initial={instant ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.1 * t, delay: 0.5 * t, ease: 'easeInOut' }}
        />
        <ArrowHead
          key={`arw-${act}`}
          d={path}
          color={stroke}
          strokeWidth={3}
          initial={instant ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 * t, delay: 1.5 * t }}
        />
      </svg>

      {/* The address rides above the arrow: the address IS the variable between
          the two acts, so it must read as part of the arrow, not as a caption. */}
      <motion.div
        className="absolute rounded-pill border-2 bg-white px-3 py-1 font-mono text-body-sm font-bold"
        style={{
          borderColor: stroke,
          color: stroke,
          left: act === 0 ? FE.x + 30 : W / 2 - 74,
          top: act === 0 ? FE.y - 74 : FE.y + BOX.h / 2 - 44,
        }}
        initial={instant ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 * t, delay: 1.4 * t, ease: easing.soft }}
      >
        {label}
      </motion.div>

      {/* The verdict. One line, on the same beat the arrow finishes. */}
      <motion.div
        className="absolute left-0 right-0 text-center text-body-sm font-bold"
        style={{ bottom: 10, color: stroke }}
        initial={instant ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 * t, delay: 1.7 * t }}
      >
        {act === 0 ? 'Back into its own container, where nothing is listening' : 'Across the network, to the other container'}
      </motion.div>
    </div>
  )
}
