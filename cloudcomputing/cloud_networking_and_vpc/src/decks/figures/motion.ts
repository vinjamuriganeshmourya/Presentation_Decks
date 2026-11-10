import type { CSSProperties } from 'react'

/**
 * THE MOTION LAYER (user, 2026-10-16, "Motion & micro-animation layer"):
 * every visual element carries a subtle loop that says what it is, on top
 * of the design, changing no layout, colour, copy, size or position. One
 * shared vocabulary of CSS keyframes and classes, applied by name where an
 * object is drawn, never a per-slide one-off.
 *
 * Rules the layer enforces by itself:
 * - transform, opacity and stroke properties only; the footprint is fixed.
 * - every class is paired with the marker class `mo`, and `.mo` is switched
 *   off on harness URLs (`.cc-still`), in picker thumbnails (`.deck-thumb`)
 *   and under `prefers-reduced-motion`. Inactive slides are unmounted by the
 *   deck and a hidden tab paints nothing, so there is nothing to pause.
 * - a phase seed (`mo()` below) gives each element its own negative delay,
 *   so nothing in a group moves in step.
 * - on an svg part, transforms need `transform-box: fill-box` and a centre
 *   origin: `.mo` sets both. Put a motion class on an inner `<g>` or a
 *   wrapper, never on an element whose inline `transform` a state change
 *   drives (a Fade, a rotating needle), or the loop replaces that transform.
 */

export type MotionKind =
  | 'float' // the default idle: translateY ±5px, 4.2s, ease-in-out, alternate
  | 'levitate' // cloud: vertical drift with a faint horizontal sway
  | 'shadow' // the soft shadow under a levitating thing: breathes with it
  | 'blink' // a status LED: a short dip at long intervals (stagger with seeds)
  | 'pulse' // stacked layers, a lock, an alert: a gentle scale breath
  | 'spin' // gear: slow continuous rotation
  | 'spin-ccw' // the interlocking gear
  | 'dash' // a flow line: moving dash in the path's direction (stroke-dashoffset)
  | 'wave' // wifi / signal ring: expands and fades, in sequence by seed
  | 'tick' // a clock hand: twelve steps round
  | 'shake' // warning / error: a very slight shake at long intervals
  | 'glow' // lightbulb / rays: an opacity pulse
  | 'breathe' // chart bars, after they have grown: scaleY from the base
  | 'scan' // magnifier: a small slow circle
  | 'hover' // rocket / vehicle: a tighter float
  | 'flicker' // a flame: scaleY from its base, fast and small
  | 'knob' // a toggle's knob: slides on, pauses, slides back (uses --mo-knob)
  | 'track' // a toggle's "on" tint: fades with the knob
  | 'shackle' // a padlock shackle: lifts and closes on a long loop
  | 'type' // a code line: types on (scaleX from the left), in sequence by seed
  | 'cursor' // a caret: blinks
  | 'breath' // a character: breathing, the smallest scale
  | 'pop' // a checkmark after drawing: a gentle pop

export const MOTION_CSS = `
.mo { transform-box: fill-box; transform-origin: center; animation-delay: var(--mo-delay, 0s); }
.mo-base { transform-origin: center bottom; }
.mo-left { transform-origin: left center; }
@keyframes mo-float { from { transform: translateY(-5px) } to { transform: translateY(5px) } }
@keyframes mo-levitate { 0% { transform: translate(0, -5px) } 50% { transform: translate(3px, 5px) } 100% { transform: translate(0, -5px) } }
@keyframes mo-shadow { 0% { transform: scaleX(1.04); opacity: 1 } 50% { transform: scaleX(0.92); opacity: 0.6 } 100% { transform: scaleX(1.04); opacity: 1 } }
@keyframes mo-blink { 0%, 88% { opacity: 1 } 91% { opacity: 0.2 } 94%, 100% { opacity: 1 } }
@keyframes mo-pulse { from { transform: scale(1) } to { transform: scale(1.03) } }
@keyframes mo-spin { to { transform: rotate(360deg) } }
@keyframes mo-spin-ccw { to { transform: rotate(-360deg) } }
@keyframes mo-dash { to { stroke-dashoffset: -28 } }
@keyframes mo-wave { 0% { transform: scale(0.55); opacity: 0.9 } 100% { transform: scale(1.6); opacity: 0 } }
@keyframes mo-shake { 0%, 90%, 100% { transform: translateX(0) } 92% { transform: translateX(-1.5px) } 94% { transform: translateX(1.5px) } 96% { transform: translateX(-1px) } 98% { transform: translateX(1px) } }
@keyframes mo-glow { from { opacity: 0.72 } to { opacity: 1 } }
@keyframes mo-breathe { from { transform: scaleY(1) } to { transform: scaleY(1.03) } }
@keyframes mo-scan { 0% { transform: translate(0, 0) } 25% { transform: translate(2.5px, -2px) } 50% { transform: translate(0, -3.5px) } 75% { transform: translate(-2.5px, -1.5px) } 100% { transform: translate(0, 0) } }
@keyframes mo-hover { from { transform: translateY(-3px) } to { transform: translateY(3px) } }
@keyframes mo-flicker { 0%, 100% { transform: scaleY(1); opacity: 1 } 35% { transform: scaleY(0.82); opacity: 0.85 } 70% { transform: scaleY(1.08); opacity: 0.95 } }
@keyframes mo-knob { 0%, 38% { transform: translateX(0) } 50%, 88% { transform: translateX(var(--mo-knob, 18px)) } 100% { transform: translateX(0) } }
@keyframes mo-track { 0%, 38% { opacity: 1 } 50%, 88% { opacity: 0.3 } 100% { opacity: 1 } }
@keyframes mo-shackle { 0%, 78%, 100% { transform: translateY(0) } 86% { transform: translateY(-3px) } 92% { transform: translateY(-3px) } }
@keyframes mo-type { 0% { transform: scaleX(0); opacity: 0.3 } 18% { transform: scaleX(1); opacity: 1 } 100% { transform: scaleX(1); opacity: 1 } }
@keyframes mo-cursor { 0%, 40% { opacity: 1 } 55%, 85% { opacity: 0.15 } 100% { opacity: 1 } }
@keyframes mo-breath { from { transform: scale(1) } to { transform: scale(1.012) } }
@keyframes mo-pop { 0%, 80%, 100% { transform: scale(1) } 88% { transform: scale(1.12) } }
/* IDLE MOTION POLICY (user, 2026-10-22, "remove idle micro-animations unless they carry meaning"):
   a kind that only decorates (float, hover, levitate, its shadow, pulse, breathe, scan, shake, pop,
   shackle, breath) is a no-op now; the class names stay so every call site still compiles. A kind
   that says what the object is DOING stays: an LED blinking (running), a dash flowing (direction),
   a gear or fan spinning (working), a clock hand moving (time passing), a signal rippling, a screen
   typing with its caret, a toggle throwing (a state change shown), a flame, a light's glow. */
.mo-float, .mo-levitate, .mo-shadow, .mo-pulse, .mo-breathe, .mo-scan, .mo-hover, .mo-shake, .mo-pop, .mo-shackle, .mo-breath { animation: none; }
.mo-blink { animation: mo-blink var(--mo-dur, 5.2s) ease-in-out infinite; }
.mo-spin { animation: mo-spin var(--mo-dur, 14s) linear infinite; }
.mo-spin-ccw { animation: mo-spin-ccw var(--mo-dur, 14s) linear infinite; }
.mo-dash { animation: mo-dash var(--mo-dur, 1.6s) linear infinite; }
.mo-wave { animation: mo-wave var(--mo-dur, 3.6s) ease-out infinite; }
/* SMOOTHNESS (user, 2026-10-22, "no stepped motion"): the clock hand sweeps instead of stepping twelve times, the caret fades instead of snapping */
.mo-tick { animation: mo-spin var(--mo-dur, 12s) linear infinite; }
.mo-glow { animation: mo-glow var(--mo-dur, 2.8s) ease-in-out infinite alternate; }
.mo-flicker { animation: mo-flicker var(--mo-dur, 0.9s) ease-in-out infinite; transform-origin: center top; }
.mo-knob { animation: mo-knob var(--mo-dur, 6s) cubic-bezier(0.22, 1, 0.36, 1) infinite; }
.mo-track { animation: mo-track var(--mo-dur, 6s) cubic-bezier(0.22, 1, 0.36, 1) infinite; }
.mo-type { animation: mo-type var(--mo-dur, 4.8s) ease-out infinite; transform-origin: left center; }
.mo-cursor { animation: mo-cursor var(--mo-dur, 1.1s) ease-in-out infinite; }
.cc-still .mo, .deck-thumb .mo { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .mo { animation: none !important; } }
`

/**
 * The class list and the phase for one element: `mo('float', 3)` gives
 * `{ className: 'mo mo-float', style: { '--mo-delay': '-1.7s' } }`. The
 * seed walks a golden-ratio sequence, so a group of eight gets eight
 * well-spread phases; `dur` overrides the kind's duration (seconds).
 */
export function mo(kind: MotionKind, seed = 0, opts: { dur?: number; base?: boolean; knob?: number } = {}): { className: string; style: CSSProperties } {
  const phase = (seed * 0.618034) % 1
  const dur = opts.dur ?? DUR[kind]
  const style: Record<string, string> = { '--mo-delay': `${(-phase * dur).toFixed(2)}s` }
  if (opts.dur) style['--mo-dur'] = `${opts.dur}s`
  if (opts.knob !== undefined) style['--mo-knob'] = `${opts.knob}px`
  return { className: `mo mo-${kind}${opts.base ? ' mo-base' : ''}`, style: style as CSSProperties }
}

const DUR: Record<MotionKind, number> = {
  float: 4.2, levitate: 7, shadow: 7, blink: 5.2, pulse: 3.6, spin: 14, 'spin-ccw': 14, dash: 1.6, wave: 3.6, tick: 12,
  shake: 6, glow: 2.8, breathe: 3.8, scan: 5, hover: 3.4, flicker: 0.9, knob: 6, track: 6, shackle: 7, type: 4.8, cursor: 1.1, breath: 3.6, pop: 6,
}
