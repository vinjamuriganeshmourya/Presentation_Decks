import { useEffect, useId, useRef } from 'react'
import { motion, useSpring } from 'framer-motion'

export type NovaPose = 'neutral' | 'wave' | 'point' | 'idea' | 'cheer'
export type Facing = 'left' | 'right'

/* ── gaze ──────────────────────────────────────────────────────────────── */

/** How far a pupil may travel inside the white of the eye, in viewBox units. */
const GAZE_X = 4.2
const GAZE_Y = 2.8
/** Pointer distance at which the gaze reaches full deflection. */
const GAZE_REACH = 320
/** Quiet time before the eyes stop following and go back to drifting. */
const IDLE_AFTER = 2600
/** One step of the idle drift. */
const IDLE_EVERY = 2800
const IDLE_PATH: [number, number][] = [
  [0.62, 0.3],
  [0, 0],
  [-0.62, 0.3],
  [0, 0],
]

/**
 * Makes the pupils follow the mouse pointer.
 *
 * The offsets are returned as springs, so the eyes never snap to the pointer:
 * they ease toward wherever it is, and a fast flick across the screen reads as
 * a smooth glance rather than a jump.
 *
 * The pointer position is measured against the eyes' own position on screen, so
 * every Nova on a slide looks in its own correct direction, and deflection is
 * scaled by distance — the pointer has to come reasonably close before the eyes
 * are fully turned toward it.
 *
 * When the pointer has been still for a moment the eyes fall back to a slow
 * drift, so the character stays alive while the presenter is talking rather
 * than staring at an abandoned cursor. Honours `prefers-reduced-motion`, where
 * the eyes simply stay centred.
 */
function usePupilGaze(mirrored: boolean) {
  const ref = useRef<SVGGElement>(null)
  const spring = { stiffness: 90, damping: 20, mass: 0.7 }
  const x = useSpring(0, spring)
  const y = useSpring(0, spring)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    /* The mirror transform on the figure flips the face group, so a positive
       offset inside it moves the pupils toward screen LEFT. Undo that here, or
       a mirrored Nova looks away from the pointer instead of at it. */
    const sign = mirrored ? -1 : 1
    let pointer: { x: number; y: number } | null = null
    let lastMove = 0
    let frame = 0
    let idleStep = 0

    const apply = () => {
      frame = 0
      const el = ref.current
      if (!el || !pointer) return
      const r = el.getBoundingClientRect()
      const dx = pointer.x - (r.left + r.width / 2)
      const dy = pointer.y - (r.top + r.height / 2)
      const dist = Math.hypot(dx, dy) || 1
      /* Direction alone would give a hard-over stare from anywhere on the
         slide; scaling by distance keeps a distant pointer as a slight glance. */
      const pull = Math.min(1, dist / GAZE_REACH)
      x.set((dx / dist) * pull * GAZE_X * sign)
      y.set((dy / dist) * pull * GAZE_Y)
    }

    const onMove = (e: PointerEvent) => {
      pointer = { x: e.clientX, y: e.clientY }
      lastMove = performance.now()
      // one read per frame at most, however fast the pointer moves
      if (!frame) frame = requestAnimationFrame(apply)
    }

    const idle = window.setInterval(() => {
      if (performance.now() - lastMove < IDLE_AFTER) return
      const [ix, iy] = IDLE_PATH[idleStep % IDLE_PATH.length]
      idleStep += 1
      x.set(ix * GAZE_X)
      y.set(iy * GAZE_Y)
    }, IDLE_EVERY)

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.clearInterval(idle)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [mirrored, x, y])

  return { ref, x, y }
}

/**
 * "Nova" — the NxtWave-Evolve learning mascot.
 *
 * An original brand character: the NxtWave "spark of learning" given
 * personality — a plump, friendly four-point star-spark with an expressive
 * face and little arms. Not a human, robot, or animal. Built with real depth
 * (gradients, form shading, gloss, rim light, drop shadow) and gentle idle
 * motion so it feels alive.
 *
 * `facing` mirrors the figure so it always gestures TOWARD the content. The
 * base art gestures right; the default `facing="left"` turns it toward the
 * content that normally sits on the left of a slide.
 */
export function Nova({
  pose = 'neutral',
  facing = 'left',
  className,
  float = true,
}: {
  pose?: NovaPose
  facing?: Facing
  className?: string
  float?: boolean
}) {
  const u = useId().replace(/:/g, '')
  const gaze = usePupilGaze(facing === 'left')
  const bodyG = `body-${u}`
  const form = `form-${u}`
  const gloss = `gloss-${u}`
  const rim = `rim-${u}`
  const orange = `orange-${u}`
  const soft = `soft-${u}`

  const HAND = '#33C6B7'
  const armStroke = { stroke: `url(#${bodyG})`, strokeWidth: 17, strokeLinecap: 'round' as const, fill: 'none' }

  // Gesturing (screen-right) arm + accessory, per pose. Shoulder ≈ (160,176).
  function GestureArm() {
    if (pose === 'wave' || pose === 'idea' || pose === 'cheer') {
      return (
        <motion.g
          style={{ transformOrigin: '160px 176px' }}
          animate={pose === 'wave' ? { rotate: [0, 13, -4, 13, 0] } : { rotate: [0, 3, 0] }}
          transition={{
            duration: pose === 'wave' ? 1.9 : 3.4,
            repeat: Infinity,
            ease: 'easeInOut',
            repeatDelay: pose === 'wave' ? 1 : 0,
          }}
        >
          <path d="M160 176 C 182 160 192 144 192 128" {...armStroke} />
          <circle cx="192" cy="124" r="11" fill={HAND} />
          {pose === 'idea' && (
            <motion.g
              animate={{ scale: [1, 1.09, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: '192px 104px' }}
            >
              <circle cx="192" cy="102" r="15" fill={`url(#${orange})`} />
              <circle cx="188" cy="98" r="3.5" fill="#fff" fillOpacity="0.7" />
              <rect x="185" y="116" width="14" height="6" rx="3" fill="#0E9285" />
              {[0, 60, 120, 180, 240, 300].map((a) => (
                <line
                  key={a}
                  x1={192 + Math.cos((a * Math.PI) / 180) * 19}
                  y1={102 + Math.sin((a * Math.PI) / 180) * 19}
                  x2={192 + Math.cos((a * Math.PI) / 180) * 26}
                  y2={102 + Math.sin((a * Math.PI) / 180) * 26}
                  stroke="#FF8A3D"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              ))}
            </motion.g>
          )}
        </motion.g>
      )
    }
    const reach = pose === 'point' ? 214 : 200
    return (
      <motion.g
        style={{ transformOrigin: '160px 176px' }}
        animate={{ rotate: [0, 3, 0] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d={`M160 176 C 176 184 186 192 ${reach} 196`} {...armStroke} />
        <circle cx={reach + 2} cy="197" r="11" fill={HAND} />
      </motion.g>
    )
  }

  function SupportArm() {
    if (pose === 'cheer') {
      return (
        <>
          <path d="M80 176 C 58 160 48 144 48 128" {...armStroke} />
          <circle cx="48" cy="124" r="11" fill={HAND} />
        </>
      )
    }
    return (
      <>
        <path d="M80 176 C 72 190 68 202 70 214" {...armStroke} />
        <circle cx="69" cy="216" r="11" fill={HAND} />
      </>
    )
  }

  // rounded four-point star body, center (120,140)
  const STAR =
    'M120 44 Q158 102 216 140 Q158 178 120 236 Q82 178 24 140 Q82 102 120 44 Z'

  const Sparkle = ({ x, y, s, i }: { x: number; y: number; s: number; i: number }) => (
    <motion.path
      d={`M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s} Z`}
      fill={`url(#${orange})`}
      animate={{ scale: [0.7, 1, 0.7], opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}
      style={{ transformOrigin: `${x}px ${y}px` }}
    />
  )

  return (
    <motion.svg
      viewBox="0 0 240 300"
      className={className}
      role="img"
      aria-label="Nova, the learning spark"
      animate={float ? { y: [0, -10, 0] } : undefined}
      transition={float ? { duration: 5.2, repeat: Infinity, ease: 'easeInOut' } : undefined}
    >
      <defs>
        <linearGradient id={bodyG} x1="0.18" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#5A93FF" />
          <stop offset="46%" stopColor="#0B5FFF" />
          <stop offset="100%" stopColor="#0C8E82" />
        </linearGradient>
        <radialGradient id={form} cx="0.4" cy="0.36" r="0.68">
          <stop offset="52%" stopColor="#06215A" stopOpacity="0" />
          <stop offset="100%" stopColor="#06215A" stopOpacity="0.4" />
        </radialGradient>
        <radialGradient id={gloss} cx="0.34" cy="0.24" r="0.55">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
          <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={rim} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EAF3FF" stopOpacity="0.9" />
          <stop offset="16%" stopColor="#EAF3FF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={orange} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFC46A" />
          <stop offset="100%" stopColor="#FF7A29" />
        </linearGradient>
        <filter id={soft} x="-40%" y="-30%" width="180%" height="180%">
          <feDropShadow dx="0" dy="12" stdDeviation="13" floodColor="#05204F" floodOpacity="0.32" />
        </filter>
      </defs>

      {/* contact shadow */}
      <ellipse cx="120" cy="270" rx="70" ry="12" fill="#05204F" opacity="0.15" />

      <g transform={facing === 'left' ? 'matrix(-1,0,0,1,240,0)' : undefined}>
        <SupportArm />

        {/* body — the spark */}
        <path d={STAR} fill={`url(#${bodyG})`} filter={`url(#${soft})`} />
        <path d={STAR} fill={`url(#${form})`} />
        <path d={STAR} fill={`url(#${gloss})`} />
        <path d={STAR} fill={`url(#${rim})`} />
        {/* crisp specular highlight */}
        <ellipse cx="96" cy="98" rx="15" ry="9" fill="#fff" opacity="0.55" transform="rotate(-22 96 98)" />

        {/* face */}
        <g>
          {/* brows */}
          <path d="M92 118 q10 -5 20 -1" stroke="#0A2A6B" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.55" />
          <path d="M128 117 q10 -4 20 1" stroke="#0A2A6B" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.55" />
          {/* eyes */}
          <circle cx="104" cy="134" r="13" fill="#fff" />
          <circle cx="136" cy="134" r="13" fill="#fff" />
          {/*
            The pupils follow the mouse pointer; the whites do not move. Both
            pupils and both catchlights sit in ONE group so the gaze stays
            convergent — offsetting them separately makes the eyes wander
            independently, which reads as a defect rather than as looking at
            something.

            The group is also what the tracker measures: its own position on
            screen is the origin the pointer direction is taken from.
          */}
          <motion.g ref={gaze.ref} style={{ x: gaze.x, y: gaze.y }}>
            <circle cx="107" cy="136" r="6.5" fill="#0B1A2B" />
            <circle cx="139" cy="136" r="6.5" fill="#0B1A2B" />
            <circle cx="109.5" cy="133.5" r="2.3" fill="#fff" />
            <circle cx="141.5" cy="133.5" r="2.3" fill="#fff" />
          </motion.g>
          {/* cheeks */}
          <circle cx="88" cy="150" r="8" fill="#FF8A3D" opacity="0.22" />
          <circle cx="152" cy="150" r="8" fill="#FF8A3D" opacity="0.22" />
          {/* smile */}
          <path d="M106 154 Q120 168 134 154" stroke="#0B1A2B" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        </g>

        {/* arms */}
        <GestureArm />

        {/* twinkling brand sparkles */}
        <Sparkle x={38} y={70} s={11} i={0} />
        <Sparkle x={206} y={64} s={9} i={1} />
        <Sparkle x={214} y={188} s={8} i={2} />

        {/* confetti for cheer */}
        {pose === 'cheer' &&
          [
            { x: 40, y: 120, c: '#0B5FFF' },
            { x: 200, y: 120, c: '#12B5A8' },
          ].map((d, i) => (
            <motion.rect
              key={i}
              x={d.x}
              y={d.y}
              width="9"
              height="9"
              rx="2"
              fill={d.c}
              transform={`rotate(${i * 30} ${d.x + 4} ${d.y + 4})`}
              animate={{ y: [d.y, d.y - 8, d.y], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
            />
          ))}
      </g>
    </motion.svg>
  )
}
