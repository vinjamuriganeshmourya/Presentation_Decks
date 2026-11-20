import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { TILE_SKIN } from '@/decks/figures/card'
import { Label, REDUCED, STILL, type LabelTone } from '@/decks/figures/scene'
import { SPEED } from '@/deck/autoAnim'
import { Icon } from '@/engine/icon'

/*
 * THE SESSION'S SHARED FIGURE PARTS (Storage Tiering, Backup & DR, 2026-11-06), used by `a.tsx` (sections 1-2) and
 * `b.tsx` (sections 3-5). Every figure takes the slide's `step` (0 = nothing yet, n = whole) and holds its final frame
 * on `?still`, in thumbnails and under reduced motion. Labels are DOM chips (`Label`), never svg text. Official AWS
 * marks sit on the white tile (rule 54: r 0.27 x size, mark 76 %). Styling is inline: an arbitrary Tailwind class
 * written here would not be generated.
 */

export const EASE = 'cubic-bezier(0.22,1,0.36,1)'
export const FONT = "'DM Sans', system-ui, sans-serif"

/** true on every held frame: harness, thumbnails, reduced motion, a picker jump */
export function useHeld() {
  const instant = useInstant()
  return STILL || REDUCED || instant
}

/** shown from its step on: fade and a 6px rise, the diagram's own reveal */
export function Show({ on, children, style, delay = 0, lift = 6 }: { on: boolean; children: ReactNode; style?: CSSProperties; delay?: number; lift?: number }) {
  const instant = useInstant()
  return (
    <div
      style={{
        opacity: on ? 1 : 0,
        transform: on ? 'none' : `translateY(${lift}px)`,
        transition: instant ? 'none' : `opacity 420ms ${EASE} ${on ? delay : 0}ms, transform 420ms ${EASE} ${on ? delay : 0}ms`,
        pointerEvents: on ? undefined : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** absolute, centred on (x, y) */
export const At = ({ x, y, children, z = 6, style }: { x: number; y: number; children: ReactNode; z?: number; style?: CSSProperties }) => (
  <div style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', zIndex: z, ...style }}>{children}</div>
)

/** a w x h frame centred in the stage; children are placed in figure px */
export const Frame = ({ w, h, children }: { w: number; h: number; children: ReactNode }) => (
  <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
    <div style={{ position: 'relative', width: w, height: h }}>{children}</div>
  </div>
)

export const flex = (gap: number, dir: 'row' | 'column' = 'row', extra: CSSProperties = {}): CSSProperties => ({ display: 'flex', flexDirection: dir, alignItems: 'center', gap, ...extra })
export const heading = (size: number, color: string = colors.ink, weight = 700): CSSProperties => ({ fontFamily: FONT, fontWeight: weight, fontSize: size, lineHeight: 1.2, color })

/** an official mark (or any image) on its white tile */
export function Mark({ src, size = 56, ring, dim = false, style }: { src: string; size?: number; ring?: string; dim?: boolean; style?: CSSProperties }) {
  const instant = useInstant()
  return (
    <span
      style={{
        display: 'grid',
        placeItems: 'center',
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: Math.round(size * 0.27),
        ...TILE_SKIN,
        boxShadow: ring ? `${TILE_SKIN.boxShadow}, 0 0 0 3px ${ring}` : TILE_SKIN.boxShadow,
        filter: dim ? 'grayscale(1)' : undefined,
        opacity: dim ? 0.5 : 1,
        transition: instant ? 'none' : `box-shadow 420ms ${EASE}, opacity 420ms ${EASE}, filter 420ms ${EASE}`,
        ...style,
      }}
    >
      <img src={src} alt="" aria-hidden draggable={false} style={{ width: Math.round(size * 0.76), height: Math.round(size * 0.76), objectFit: 'contain', display: 'block' }} />
    </span>
  )
}

/** a lucide glyph on the same soft tile */
export function Glyph({ icon, size = 48, tone = colors.brand, ring, style, cls }: { icon: string; size?: number; tone?: string; ring?: string; style?: CSSProperties; cls?: string }) {
  return (
    <span
      className={cls}
      style={{ display: 'grid', placeItems: 'center', width: size, height: size, flexShrink: 0, borderRadius: Math.round(size * 0.27), ...TILE_SKIN, boxShadow: ring ? `${TILE_SKIN.boxShadow}, 0 0 0 3px ${ring}` : TILE_SKIN.boxShadow, color: tone, ...style }}
    >
      <Icon name={icon} size={Math.round(size * 0.5)} />
    </span>
  )
}

/** a chip in Title Case (rule 56) */
export function Tag({ children, tone = 'plain', icon, size = 14, raised = true, style }: { children: ReactNode; tone?: LabelTone; icon?: string; size?: number; raised?: boolean; style?: CSSProperties }) {
  return (
    <Label strong tone={tone} size={size} raised={raised} icon={icon ? <Icon name={icon} size={14} /> : undefined} style={style}>
      {children}
    </Label>
  )
}

/** a round status mark: a tick (good) or a cross (bad) */
export function Mark2({ ok, size = 24, pulse = false, delay = 0 }: { ok: boolean; size?: number; pulse?: boolean; delay?: number }) {
  const c = ok ? colors.success : colors.danger
  return (
    <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: size, background: c, color: colors.white, boxShadow: `0 0 0 3px ${c}2e`, flexShrink: 0 }}>
      {pulse && <Ring color={c} delay={delay} />}
      <Icon name={ok ? 'Check' : 'X'} size={Math.round(size * 0.62)} />
    </span>
  )
}

/* ── micro-animations (2026-11-07): quiet, continuous, never on an official mark itself (R7.8) ── */

/** a ring that breathes out from its parent (the parent must be position: relative) */
export function Ring({ color = colors.brand, delay = 0, radius = 999 }: { color?: string; delay?: number; radius?: number }) {
  return <span aria-hidden className="s8-ring" style={{ position: 'absolute', inset: -4, borderRadius: radius, boxShadow: `0 0 0 2px ${color}`, pointerEvents: 'none', animationDelay: `${delay}s` }} />
}

/** a soft band of light that crosses its parent slowly, over and over (the parent clips: overflow hidden) */
export function Sheen({ delay = 0, dur = 4.2 }: { delay?: number; dur?: number }) {
  return (
    <span
      aria-hidden
      className="s8-sheen"
      style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '34%', pointerEvents: 'none', background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 100%)', animationDelay: `${delay}s`, animationDuration: `${dur}s` }}
    />
  )
}

/** a soft card (the stage's own panel look) */
export function Panel({ children, style, active = false }: { children?: ReactNode; style?: CSSProperties; active?: boolean }) {
  const instant = useInstant()
  return (
    <div
      style={{
        position: 'absolute',
        borderRadius: 16,
        ...TILE_SKIN,
        boxShadow: active ? `${TILE_SKIN.boxShadow}, 0 0 0 2px ${colors.brand}` : TILE_SKIN.boxShadow,
        transition: instant ? 'none' : `box-shadow 420ms ${EASE}`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** a zone box drawn the way the diagram draws one: a faint brand tint, a hairline, a label chip at the top left */
export function Zone({ x, y, w, h, label, icon, img, dashed = false, children, tone = colors.brand }: { x: number; y: number; w: number; h: number; label?: string; icon?: string; img?: string; dashed?: boolean; children?: ReactNode; tone?: string }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 14, background: `${tone}0b`, border: `1.5px ${dashed ? 'dashed' : 'solid'} ${tone}55` }}>
      {label && (
        <div style={{ position: 'absolute', left: 8, top: 8 }}>
          <Label strong tone="lift" size={14} icon={img ? <img src={img} alt="" style={{ width: 16, height: 16 }} /> : icon ? <Icon name={icon} size={14} /> : undefined}>
            {label}
          </Label>
        </div>
      )}
      {children}
    </div>
  )
}

/** A sawtooth phase 0..1 that runs once `on`, never pausing between laps (R8.1); `still` on every held frame. */
export function useLap(on: boolean, ms: number, still: number) {
  const held = useHeld()
  const [t, setT] = useState(still)
  useEffect(() => {
    if (held || !on) {
      setT(still)
      return
    }
    let raf = 0
    let last = -1
    const t0 = performance.now()
    const period = ms * SPEED
    const tick = (now: number) => {
      const q = Math.floor((((now - t0) / period + still) % 1) * 360)
      if (q !== last) {
        last = q
        setT(q / 360)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [held, on, ms, still])
  return held || !on ? still : t
}

/** ease in and out over 0..1 */
export const sm = (k: number) => {
  const c = Math.min(1, Math.max(0, k))
  return c * c * (3 - 2 * c)
}

/** a straight svg arrow with a filled head that lands on (x2, y2) */
export function SvgArrow({ x1, y1, x2, y2, color = colors.brand, width = 2.4, dashed = false, head = 9, op = 1, both = false }: { x1: number; y1: number; x2: number; y2: number; color?: string; width?: number; dashed?: boolean; head?: number; op?: number; both?: boolean }) {
  const a = Math.atan2(y2 - y1, x2 - x1)
  const hw = head * 0.5
  const tip = (x: number, y: number, ang: number) => {
    const p1 = [x - head * Math.cos(ang) + hw * Math.sin(ang), y - head * Math.sin(ang) - hw * Math.cos(ang)]
    const p2 = [x - head * Math.cos(ang) - hw * Math.sin(ang), y - head * Math.sin(ang) + hw * Math.cos(ang)]
    return `${x},${y} ${p1[0]},${p1[1]} ${p2[0]},${p2[1]}`
  }
  const sx = both ? x1 + head * 0.9 * Math.cos(a) : x1
  const sy = both ? y1 + head * 0.9 * Math.sin(a) : y1
  const ex = x2 - head * 0.9 * Math.cos(a)
  const ey = y2 - head * 0.9 * Math.sin(a)
  return (
    <g opacity={op} style={{ transition: `opacity 420ms ${EASE}` }}>
      <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={dashed ? '7 6' : undefined} />
      <polygon points={tip(x2, y2, a)} fill={color} />
      {both && <polygon points={tip(x1, y1, a + Math.PI)} fill={color} />}
    </g>
  )
}

/** a full-stage svg layer for lines under the DOM parts */
export const Lines = ({ w, h, children }: { w: number; h: number; children: ReactNode }) => (
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', zIndex: 1 }} aria-hidden>
    {children}
  </svg>
)

/** coins standing for RELATIVE cost (no prices: the TR gives none) */
export function Coins({ n, of = 3, size = 18 }: { n: number; of?: number; size?: number }) {
  return (
    <span style={flex(3)} aria-hidden>
      {Array.from({ length: of }, (_, i) => (
        <span
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: size,
            background: i < n ? 'radial-gradient(circle at 35% 30%, #FFE7A3 0%, #F2C14E 55%, #C9962B 100%)' : colors.surface2,
            boxShadow: i < n ? 'inset 0 -1.5px 0 rgba(120,80,10,0.35), 0 2px 3px rgba(16,32,58,0.15)' : `inset 0 0 0 1.5px ${colors.line}`,
          }}
        />
      ))}
    </span>
  )
}

/** the session's loops, stopped on every held frame */
export const K_CSS = `
@keyframes s8-spin { to { transform: rotate(360deg) } }
.s8-spin { animation: s8-spin 6s linear infinite; transform-box: fill-box; transform-origin: 50% 50%; }
.s8-spin-slow { animation: s8-spin 60s linear infinite; transform-box: fill-box; transform-origin: 50% 50%; }
@keyframes s8-pulse { 0%, 100% { transform: scale(1) } 50% { transform: scale(1.06) } }
.s8-pulse { animation: s8-pulse 2.4s ease-in-out infinite; }
@keyframes s8-ring { 0% { transform: scale(0.85); opacity: 0.6 } 100% { transform: scale(1.35); opacity: 0 } }
.s8-ring { animation: s8-ring 2s linear infinite; }
@keyframes s8-blink { 0%, 100% { opacity: 1 } 50% { opacity: 0.35 } }
.s8-blink { animation: s8-blink 1.4s ease-in-out infinite; }
@keyframes s8-bob { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
.s8-bob { animation: s8-bob 3s ease-in-out infinite; }
@keyframes s8-dash { to { stroke-dashoffset: -26 } }
@keyframes s8-sheen { 0% { transform: translateX(-120%) } 100% { transform: translateX(400%) } }
.s8-sheen { animation: s8-sheen 4.2s cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes s8-flash { 0%, 100% { opacity: 1 } 50% { opacity: 0.45 } }
.s8-flash { animation: s8-flash 1.8s ease-in-out infinite; }
@keyframes s8-nudge { 0%, 100% { transform: translateX(0) } 50% { transform: translateX(3px) } }
.s8-nudge { animation: s8-nudge 1.6s ease-in-out infinite; }
.cc-still .s8-sheen, .deck-thumb .s8-sheen { display: none; }
.cc-still .s8-flash, .deck-thumb .s8-flash, .cc-still .s8-nudge, .deck-thumb .s8-nudge { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .s8-sheen { display: none; } .s8-flash, .s8-nudge { animation: none !important; } }
.s8-dash { animation: s8-dash 1.2s linear infinite; }
.cc-still .s8-spin, .deck-thumb .s8-spin, .cc-still .s8-spin-slow, .deck-thumb .s8-spin-slow, .cc-still .s8-pulse, .deck-thumb .s8-pulse,
.cc-still .s8-blink, .deck-thumb .s8-blink, .cc-still .s8-bob, .deck-thumb .s8-bob, .cc-still .s8-dash, .deck-thumb .s8-dash { animation: none !important; }
.cc-still .s8-ring, .deck-thumb .s8-ring { animation: none !important; opacity: 0 }
@media (prefers-reduced-motion: reduce) { .s8-spin, .s8-spin-slow, .s8-pulse, .s8-ring, .s8-blink, .s8-bob, .s8-dash { animation: none !important; } }
/* 2026-11-10 (user: more visible motion on slides 10, 23, 26, 27, 30, 37, 45, 46) */
@keyframes s8-run { 0% { left: 0%; opacity: 0 } 8% { opacity: 1 } 88% { opacity: 1 } 100% { left: 100%; opacity: 0 } }
.s8-run { position: absolute; top: 50%; margin: -5px 0 0 -5px; animation: s8-run 2s cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes s8-fall { 0% { transform: translateY(0); opacity: 0 } 10% { opacity: 1 } 85% { opacity: 1 } 100% { transform: translateY(var(--fall, 240px)); opacity: 0 } }
.s8-fall { animation: s8-fall 2.6s cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes s8-shake { 0%, 70%, 100% { transform: translateX(0) rotate(0) } 75% { transform: translateX(-3px) rotate(-6deg) } 80% { transform: translateX(3px) rotate(6deg) } 85% { transform: translateX(-2px) rotate(-3deg) } 90% { transform: translateX(2px) rotate(3deg) } }
.s8-shake { animation: s8-shake 2.2s ease-in-out infinite; }
@keyframes s8-flip { 0%, 60% { transform: rotate(0) } 80%, 100% { transform: rotate(180deg) } }
.s8-flip { animation: s8-flip 2.4s cubic-bezier(0.65,0,0.35,1) infinite; transform-origin: 50% 50%; }
@keyframes s8-pop { 0%, 100% { transform: scale(1) } 40% { transform: scale(1.18) } 60% { transform: scale(0.96) } }
.s8-pop { animation: s8-pop 1.8s ease-in-out infinite; }
@keyframes s8-glow { 0%, 100% { box-shadow: 0 0 0 0 rgba(224,72,72,0) } 50% { box-shadow: 0 0 0 7px rgba(224,72,72,0.3) } }
.s8-glow { animation: s8-glow 1.3s ease-in-out infinite; }
@keyframes s8-rowsheen { 0% { transform: translateX(-120%) } 60%, 100% { transform: translateX(420%) } }
.s8-tbl .block > div::after { content: ''; position: absolute; top: 0; bottom: 0; left: 0; width: 22%; pointer-events: none; background: linear-gradient(90deg, rgba(45,99,251,0) 0%, rgba(45,99,251,0.10) 50%, rgba(45,99,251,0) 100%); animation: s8-rowsheen 4.5s cubic-bezier(0.45,0,0.55,1) infinite; }
.s8-tbl .block > div:nth-child(2)::after { animation-delay: 1.5s; }
.s8-tbl .block > div:nth-child(3)::after { animation-delay: 3s; }
.s8-tbl .block > div > div:first-child span[aria-hidden] { animation: s8-pop 2.4s ease-in-out infinite; }
.s8-tbl .block > div:nth-child(2) > div:first-child span[aria-hidden] { animation-delay: 0.8s; }
.s8-tbl .block > div:nth-child(3) > div:first-child span[aria-hidden] { animation-delay: 1.6s; }
.s8-tbl > div:first-child span[aria-hidden] { animation: s8-bob 3s ease-in-out infinite; }
.s8-tbl > div:first-child > div:nth-child(2) span[aria-hidden] { animation-delay: 0.4s; }
.s8-tbl > div:first-child > div:nth-child(3) span[aria-hidden] { animation-delay: 0.8s; }
.s8-tbl > div:first-child > div:nth-child(4) span[aria-hidden] { animation-delay: 1.2s; }
.s8-tbl > div:first-child > div:nth-child(5) span[aria-hidden] { animation-delay: 1.6s; }
.cc-still .s8-run, .deck-thumb .s8-run, .cc-still .s8-fall, .deck-thumb .s8-fall { animation: none !important; opacity: 0 !important; }
.cc-still .s8-shake, .deck-thumb .s8-shake, .cc-still .s8-flip, .deck-thumb .s8-flip, .cc-still .s8-pop, .deck-thumb .s8-pop, .cc-still .s8-glow, .deck-thumb .s8-glow { animation: none !important; }
.cc-still .s8-tbl *, .deck-thumb .s8-tbl * { animation: none !important; }
.cc-still .s8-tbl .block > div::after, .deck-thumb .s8-tbl .block > div::after { display: none; }
@media (prefers-reduced-motion: reduce) { .s8-run, .s8-fall { animation: none !important; opacity: 0 !important; } .s8-shake, .s8-flip, .s8-pop, .s8-glow, .s8-tbl * { animation: none !important; } .s8-tbl .block > div::after { display: none; } }
`
