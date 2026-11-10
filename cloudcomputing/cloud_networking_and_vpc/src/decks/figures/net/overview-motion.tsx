import { useLayoutEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { SPEED, useAutoAnim } from '@/deck/autoAnim'
import { REDUCED, STILL, useCycle, useTicker } from '../scene'

/**
 * SECTION 1's MOTION HELPERS (visual pass, 2026-11-04). Nothing here carries words.
 *
 *   useWalk      the Session 4 slide 5 clock: a figure builds state by state, then
 *                walks its points; in auto mode the build runs ONCE and only the
 *                walk loops after it (a rest, then the points again), so the
 *                drawing never empties; auto OFF it is one state per press
 *                (`useCycle`, so it registers its presses)
 *   usePhase     a 0..1 progress that replays from 0 whenever its key changes (a
 *                step's own motion: a person walking, a packet riding a line),
 *                held at 1 on harness URLs, in thumbnails and under reduced motion
 *   along        a point at a fraction of a polyline's length
 *   Dot          a packet: a dot with a soft halo, at a stage point
 */

/**
 * `n` states: 0..`build`-1 build the drawing, `build`..n-2 walk the points, n-1 rests on the whole picture.
 * Auto OFF: one state per press (`useCycle`). Auto ON: the first lap runs 0..n-1 once; after it the walk states
 * loop back to back with NO rest beat between cycles (R8.1, 5.md: "restart immediately"); a figure with no walk
 * states holds the whole picture while its ambient loops run on.
 */
export function useWalk(n: number, build: number, ms: number, still = n - 1): number {
  const auto = useAutoAnim()
  const instant = useInstant()
  const held = STILL || REDUCED || instant
  const k = useCycle(n, ms, still, n - 1)
  const t = useTicker(auto && !held, Math.round(ms * SPEED), still)
  if (held || !auto) return k
  if (t < n) return t
  const walk = n - 1 - build
  return walk > 0 ? build + ((t - n) % walk) : n - 1
}

/** 0 to 1 over `dur` ms, restarting whenever `key` changes; 1 when the scene is held still. */
export function usePhase(key: string | number, dur: number): number {
  const instant = useInstant()
  const held = STILL || REDUCED || instant
  const [u, setU] = useState(held ? 1 : 0)
  useLayoutEffect(() => {
    if (held) return
    setU(0)
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / dur)
      setU(k)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [key, dur, held])
  return held ? 1 : u
}

/** 0 before a, 1 after b, smooth between. */
export function seg(t: number, a: number, b: number): number {
  if (t <= a) return 0
  if (t >= b) return 1
  const x = (t - a) / (b - a)
  return x * x * (3 - 2 * x)
}

/** The point at fraction `t` of a polyline's length. */
export function along(q: [number, number][], t: number): [number, number] {
  const lens = q.slice(1).map((p, i) => Math.hypot(p[0] - q[i][0], p[1] - q[i][1]))
  const total = lens.reduce((a, b) => a + b, 0) || 1
  let d = Math.max(0, Math.min(1, t)) * total
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) {
      const f = lens[i] ? Math.min(1, d / lens[i]) : 0
      return [q[i][0] + (q[i + 1][0] - q[i][0]) * f, q[i][1] + (q[i + 1][1] - q[i][1]) * f]
    }
    d -= lens[i]
  }
  return q[q.length - 1]
}

/** A packet at a stage point: a dot with a halo; `op` fades it. */
export function Dot({ at, tone = colors.brand, size = 14, op = 1, children }: { at: [number, number]; tone?: string; size?: number; op?: number; children?: ReactNode }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute grid place-items-center rounded-full"
      style={{ left: at[0] - size / 2, top: at[1] - size / 2, width: size, height: size, background: tone, boxShadow: `0 0 0 4px ${tone}33, 0 0 0 2px #fff inset`, opacity: op, zIndex: 4 }}
    >
      {children}
    </span>
  )
}

/** In when `on`, with a lift; `d` the entry delay in ms (exit has none, so later parts leave first when their own `on` drops first). */
export const shown = (on: boolean, d = 0, lift = 8): CSSProperties => ({
  opacity: on ? 1 : 0,
  transform: on ? 'none' : `translateY(${lift}px)`,
  transition: `opacity 420ms cubic-bezier(0.22,1,0.36,1) ${on ? d : 0}ms, transform 480ms cubic-bezier(0.22,1,0.36,1) ${on ? d : 0}ms`,
})

/** A part of a picture faded back while another part is the one in focus. */
export const focusOp = (on: boolean, faded = 0.28): CSSProperties => ({ opacity: on ? 1 : faded, transition: 'opacity 460ms cubic-bezier(0.22,1,0.36,1)' })

/** Section 1's keyframes (`ov-`), transform and opacity only, every one held still on harness URLs. */
export const OV_MOTION_CSS = `
.ov-caps span { text-transform: capitalize; }
@keyframes ov-step { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-1.6px) } }
.ov-step { animation: ov-step 0.36s ease-in-out infinite; }
@keyframes ov-leg { 0%, 100% { transform: rotate(14deg) } 50% { transform: rotate(-14deg) } }
.ov-leg { transform-box: fill-box; transform-origin: 50% 0%; animation: ov-leg 0.36s ease-in-out infinite; }
.ov-leg2 { transform-box: fill-box; transform-origin: 50% 0%; animation: ov-leg 0.36s ease-in-out infinite reverse; }
@keyframes ov-march { to { stroke-dashoffset: -22 } }
.ov-march { animation: ov-march 0.9s linear infinite; }
@keyframes ov-shake { 0%, 100% { transform: translateX(0) rotate(0) } 20% { transform: translateX(-2.5px) rotate(-8deg) } 40% { transform: translateX(2.5px) rotate(8deg) } 60% { transform: translateX(-1.5px) rotate(-4deg) } 80% { transform: translateX(1.5px) rotate(4deg) } }
.ov-shake { transform-box: fill-box; transform-origin: 50% 50%; animation: ov-shake 0.6s ease-in-out infinite; }
@keyframes ov-led { 0%, 100% { opacity: 1 } 50% { opacity: 0.25 } }
.ov-led { animation: ov-led 1.1s steps(2, jump-none) infinite; }
@keyframes ov-flag { 0%, 100% { transform: skewY(0deg) scaleX(1) } 50% { transform: skewY(-6deg) scaleX(0.94) } }
.ov-flag { transform-box: fill-box; transform-origin: 0% 50%; animation: ov-flag 1.8s ease-in-out infinite; }
@keyframes ov-click { 0%, 60%, 100% { transform: scale(1) } 70% { transform: scale(0.82) } }
.ov-click { animation: ov-click 1.6s cubic-bezier(0.22,1,0.36,1) infinite; }
@keyframes ov-toggle { 0%, 35% { transform: translateX(0) } 50%, 85% { transform: translateX(10px) } 100% { transform: translateX(0) } }
.ov-toggle { animation: ov-toggle 3.2s cubic-bezier(0.65,0,0.35,1) infinite; }
@keyframes ov-ring { 0% { transform: scale(0.7); opacity: 0.9 } 100% { transform: scale(1.7); opacity: 0 } }
.ov-ring { animation: ov-ring 1.6s cubic-bezier(0.22,1,0.36,1) infinite; }
.cc-still .ov-step, .cc-still .ov-leg, .cc-still .ov-leg2, .cc-still .ov-march, .cc-still .ov-shake, .cc-still .ov-led, .cc-still .ov-flag, .cc-still .ov-click, .cc-still .ov-toggle,
.deck-thumb .ov-step, .deck-thumb .ov-leg, .deck-thumb .ov-leg2, .deck-thumb .ov-march, .deck-thumb .ov-shake, .deck-thumb .ov-led, .deck-thumb .ov-flag, .deck-thumb .ov-click, .deck-thumb .ov-toggle { animation: none !important; }
.cc-still .ov-ring, .deck-thumb .ov-ring { animation: none !important; opacity: 0 !important; }
@media (prefers-reduced-motion: reduce) { .ov-step, .ov-leg, .ov-leg2, .ov-march, .ov-shake, .ov-led, .ov-flag, .ov-click, .ov-toggle { animation: none !important; } .ov-ring { animation: none !important; opacity: 0 !important; } }
`

/** `className` only while running (never on a held frame). */
export const run = (on: boolean, cls: string) => (on && !STILL ? cls : undefined)
