import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'

/**
 * MICRO-INTERACTIONS for the played panels of PF 15 (review, 2026-10-01).
 *
 * Three pieces, all session-local because `src/ui/` is the kit's and a kit
 * change is a PR (generate-slides section 6):
 *
 *   Press     a button answers the hand that pressed it: scale 0.96, 160ms
 *   .sm-spin  the machine's gear turns while it runs (linear, constant motion)
 *   .sm-bump  a result appears (the hook's "FOUR!" beside the batter); opacity only, no
 *             transform, so the compositor never draws it mis-zoomed in full view
 *   .sm-dash  a flow line draws itself from its start (the hook's "back up the arrow")
 *   Glow      a panel that just received something (an output, a result) lights
 *             its rim for a moment, so the eye goes to what changed
 *   Confetti  the one celebration in the deck, thrown across the whole slide.
 *             It fires only when the room's pick turns out right, which is the
 *             rare tier the delight budget lives in (`animate` skill, step 1)
 *
 * Every number is the explanatory tier: roughly double the skill's UI figures,
 * because this is read from the back of a room (generate-slides section 4b).
 * Everything moves on transform and opacity only. The CSS is injected once at
 * module load rather than written into `src/index.css`, which is kit-owned.
 * `prefers-reduced-motion` is handled there already: every animation and
 * transition collapses to its end state.
 */

const HOUSE = 'cubic-bezier(0.22, 1, 0.36, 1)'

const CSS = `
.sm-press { display: inline-flex; transition: transform 160ms ${HOUSE}; }
.sm-press:active { transform: scale(0.96); }
.sm-press:has(> button:disabled) { transform: none; }
.sm-tap:active:not(:disabled) { transform: scale(0.98); }
.sm-rise { animation: sm-rise 480ms ${HOUSE} both; }
@keyframes sm-rise {
  from { opacity: 0; transform: translate3d(0, -10px, 0); }
  to { opacity: 1; transform: translate3d(0, 0, 0); }
}
.sm-spin { animation: sm-spin 1.6s linear infinite; transform-origin: 50% 50%; }
.sm-bump { animation: sm-bump 420ms ${HOUSE} both; }
@keyframes sm-bump { from { opacity: 0; } to { opacity: 1; } }
.sm-dash { stroke-dasharray: 300; animation: sm-dash 900ms ease-out both; }
@keyframes sm-dash { from { stroke-dashoffset: 300; } to { stroke-dashoffset: 0; } }
@keyframes sm-spin { to { transform: rotate(360deg); } }
.sm-confetti { animation-name: sm-confetti; animation-fill-mode: both; will-change: transform, opacity; }
@keyframes sm-confetti {
  0% { transform: translate3d(0, 0, 0) rotate(0deg); opacity: 1; animation-timing-function: ${HOUSE}; }
  48% { transform: translate3d(var(--x1), var(--y1), 0) rotate(var(--r1)); opacity: 1; animation-timing-function: cubic-bezier(0.5, 0, 0.9, 0.6); }
  100% { transform: translate3d(var(--x2), var(--y2), 0) rotate(var(--r2)); opacity: 0; }
}
`

if (typeof document !== 'undefined' && !document.querySelector('style[data-sm-motion]')) {
  const el = document.createElement('style')
  el.dataset.smMotion = ''
  el.textContent = CSS
  document.head.appendChild(el)
}

/* ------------------------------------------------------------------ press */

/** Wrap a `PanelButton`: the press reads as a press. A disabled button stays still. */
export function Press({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`sm-press ${className}`}>{children}</span>
}

/* ------------------------------------------------------------------- glow */

/**
 * A rim of light on a panel, for the moment it receives something. Fires once
 * each time `on` goes from false to true, holds 900ms, and is skipped during an
 * instant jump so a Ctrl+arrow landing does not light every panel at once.
 */
export function Glow({
  on,
  pulse,
  color = colors.success,
  className = '',
  style,
  children,
}: {
  /** Size the wrapper to its child (rule 43): a glow is the highlighted element's own bounds, never its column's. */
  style?: CSSProperties
  on: boolean
  /** Change this while `on` to light the rim again: one glow per line that lands. */
  pulse?: number | string
  color?: string
  className?: string
  children: ReactNode
}) {
  const instant = useInstant()
  const [lit, setLit] = useState(false)
  const was = useRef(on)
  const lastPulse = useRef(pulse)
  useEffect(() => {
    const rose = on && !was.current
    const pulsed = on && pulse !== undefined && pulse !== lastPulse.current
    was.current = on
    lastPulse.current = pulse
    if ((!rose && !pulsed) || instant) return
    setLit(true)
    const t = window.setTimeout(() => setLit(false), 900)
    return () => {
      window.clearTimeout(t)
      setLit(false)
    }
  }, [on, pulse, instant])
  return (
    <div
      className={`relative rounded-card ${className}`}
      style={{
        ...style,
        boxShadow: lit ? `0 0 0 4px ${color}40, 0 0 28px ${color}40` : `0 0 0 0 ${color}00, 0 0 0 ${color}00`,
        transition: `box-shadow 420ms ${HOUSE}`,
      }}
    >
      {children}
    </div>
  )
}


/* ---------------------------------------------------------- overlay host */

/**
 * Where a slide-wide overlay mounts.
 *
 * The deck's fullscreen button puts the deck's ROOT div into fullscreen, not
 * the document, and while an element is fullscreen the browser paints only
 * that element's subtree. A portal on `document.body` sits outside it, so the
 * confetti existed, animated, and was never seen in the deliverable, where an
 * instructor is always in fullscreen (session 15, user, 2026-10-01: "confetti
 * missing in the built HTML"). Mount inside the fullscreen element when there
 * is one, and re-read it when fullscreen toggles.
 */
function useOverlayHost(): Element | null {
  const [host, setHost] = useState<Element | null>(() =>
    typeof document === 'undefined' ? null : (document.fullscreenElement ?? document.body),
  )
  useEffect(() => {
    const update = () => setHost(document.fullscreenElement ?? document.body)
    update()
    document.addEventListener('fullscreenchange', update)
    return () => document.removeEventListener('fullscreenchange', update)
  }, [])
  return host
}

/* --------------------------------------------------------------- confetti */

const PALETTE = [colors.brand, colors.brandDark, colors.success, colors.warning, colors.danger, '#8E44AD']

/** A small deterministic generator, so a re-render never reshuffles the pieces mid-flight. */
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}

/* Three cannons along the slide's foot, each aimed up and inward, so the
   paper crosses the whole slide (user, 2026-10-01: "for the entire slide",
   not a puff over the right option). Angles in degrees, 0 is right, -90 is up. */
const CANNONS = [
  { x: 0.08, a0: -108, a1: -50 },
  { x: 0.5, a0: -130, a1: -50 },
  { x: 0.92, a0: -130, a1: -72 },
]

/**
 * A celebration across the whole slide. Mount it when the pick is right, key
 * it so it fires once per occasion.
 *
 * Rendered through a portal over the viewport, which in full view IS the
 * slide, so nothing inside the slide's zones clips it. Each piece rises on
 * the house curve to its own peak and falls on an ease-in, because after the
 * peak it is a thing falling, not a thing arriving. 2.0s to 2.9s, so the room
 * sees it and it is gone before the next sentence. Transform and opacity only.
 */
export function Confetti({ count = 96, seed = 1 }: { count?: number; seed?: number }) {
  const instant = useInstant()
  const host = useOverlayHost()
  const pieces = useMemo(() => {
    if (typeof window === 'undefined') return []
    const W = window.innerWidth
    const H = window.innerHeight
    const r = rng(seed * 7919 + count)
    return Array.from({ length: count }, (_, i) => {
      const c = CANNONS[i % CANNONS.length]
      const a = ((c.a0 + r() * (c.a1 - c.a0)) * Math.PI) / 180
      const v = H * (0.5 + r() * 0.45)
      const x1 = Math.cos(a) * v * 0.85
      const y1 = Math.sin(a) * v
      const x2 = x1 + Math.cos(a) * v * 0.3 + (r() - 0.5) * 140
      const y2 = y1 + H * 0.9 + r() * H * 0.35
      const r1 = (r() < 0.5 ? -1 : 1) * (180 + r() * 420)
      const r2 = r1 + (r() < 0.5 ? -1 : 1) * (180 + r() * 300)
      const round = r() < 0.3
      return {
        left: c.x * W,
        x1, y1, x2, y2, r1, r2,
        d: 2000 + r() * 900,
        delay: r() * 220,
        w: round ? 10 : 12 + r() * 5,
        h: round ? 10 : 8,
        round,
        color: PALETTE[i % PALETTE.length],
      }
    })
  }, [count, seed])
  if (instant || !host) return null
  return createPortal(
    <span aria-hidden className="pointer-events-none fixed inset-0 z-[80] block overflow-hidden">
      {pieces.map((p, i) => (
        <i
          key={i}
          className="sm-confetti absolute block"
          style={
            {
              '--x1': `${p.x1.toFixed(1)}px`,
              '--y1': `${p.y1.toFixed(1)}px`,
              '--x2': `${p.x2.toFixed(1)}px`,
              '--y2': `${p.y2.toFixed(1)}px`,
              '--r1': `${p.r1.toFixed(0)}deg`,
              '--r2': `${p.r2.toFixed(0)}deg`,
              left: p.left - p.w / 2,
              top: '101%',
              width: p.w,
              height: p.h,
              background: p.color,
              borderRadius: p.round ? '50%' : 1.5,
              animationDuration: `${p.d.toFixed(0)}ms`,
              animationDelay: `${p.delay.toFixed(0)}ms`,
            } as CSSProperties
          }
        />
      ))}
    </span>,
    host,
  )
}
