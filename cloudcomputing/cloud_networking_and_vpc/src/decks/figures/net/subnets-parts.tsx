import type { ComponentProps, CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Label, STILL, type LabelTone } from '../scene'
import { TILE_SKIN } from '../card'
import { CvIcon, fx, type CvIconName } from './fx'
import { Boundary, NET } from './frames'

/**
 * THE SUBNETS SECTION'S SHARED PIECES (visual pass, 2026-11-04). No words of
 * their own: every string on a slide is still the spec's.
 *
 *   Cidr      a CIDR, a zone name or a count as a monospace chip, an icon tile at its head when given
 *   IconText  an icon before a boundary's own word
 *   Host      a library render (server stack, database, network) on a raised tile, popping in
 *   Packet    a dot riding a straight line over and over: the traffic the line carries
 *   Disc      a lucide glyph in a ringed disc (a function, a tool, a failure)
 *   onRim     where a line towards a disc's centre meets its rim
 */

/**
 * A BOUNDARY DRAWN THIN (FS review 2026-11-04, decision 6: few, thin dotted lines): the shared `Boundary` with a
 * 1.5px rim, dashed only where asked (the outermost box of a picture); a box inside a dashed box is a thin solid
 * line on a light tint.
 */
export function ThinBoundary({ dashed = false, tone = NET.boundary, ...rest }: ComponentProps<typeof Boundary> & { dashed?: boolean }) {
  return <Boundary {...rest} tone={tone} style={{ border: `1.5px ${dashed ? 'dashed' : 'solid'} ${tone}`, ...rest.style }} />
}

/**
 * A SMALL CHIP for a label that must sit inside a small box (FS review 2026-11-04: the zone and CIDR chips ran past
 * their subnet boxes). The scene's `Label` holds a 14px floor, so this is its own chip: 12.5px monospace, an 11px
 * icon, tight padding.
 */
export function MiniChip({ children, icon, size = 12.5 }: { children: ReactNode; icon?: ReactNode; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-pill py-[1px] pl-1 pr-2 font-mono font-medium leading-tight" style={{ fontSize: size, color: colors.ink, fontVariantLigatures: 'none', background: 'linear-gradient(180deg, #FFFFFF 0%, #EEF3FD 100%)', boxShadow: 'inset 0 0 0 1px #C3D3F0' }}>
      {icon && (
        <span aria-hidden className="grid h-[15px] w-[15px] shrink-0 place-items-center rounded-full [&>svg]:h-[11px] [&>svg]:w-[11px]" style={{ background: colors.surface2, color: colors.brand }}>
          {icon}
        </span>
      )}
      {children}
    </span>
  )
}

export const EASE = 'cubic-bezier(0.22,1,0.36,1)'
export const SPRING = 'cubic-bezier(0.34,1.56,0.64,1)'

export function Cidr({ children, tone = 'plain', size = 14, raised = false, strong = false, icon, style }: { children: ReactNode; tone?: LabelTone; size?: number; raised?: boolean; strong?: boolean; icon?: ReactNode; style?: CSSProperties }) {
  return (
    <Label mono size={size} tone={tone} raised={raised} strong={strong} icon={icon} style={{ fontVariantLigatures: 'none', ...style }}>
      {children}
    </Label>
  )
}

export function IconText({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className="grid place-items-center">
        {icon}
      </span>
      {children}
    </span>
  )
}

export function onRim(x1: number, y1: number, c: { cx: number; cy: number; r: number }) {
  const dx = c.cx - x1
  const dy = c.cy - y1
  const l = Math.hypot(dx, dy) || 1
  return { x2: c.cx - (dx / l) * c.r, y2: c.cy - (dy / l) * c.r }
}

export function Host({ icon = 'server-stack', size = 36, on = true, delay = 0, badge, lit = false, dim = false, style }: { icon?: CvIconName; size?: number; on?: boolean; delay?: number; badge?: ReactNode; lit?: boolean; dim?: boolean; style?: CSSProperties }) {
  const instant = useInstant()
  return (
    <span
      className="relative grid shrink-0 place-items-center rounded-[10px]"
      style={{
        width: size,
        height: size,
        ...TILE_SKIN,
        boxShadow: lit ? `inset 0 0 0 2px ${NET.lit}, 0 8px 16px -10px ${NET.lit}` : TILE_SKIN.boxShadow,
        opacity: on ? (dim ? 0.45 : 1) : 0,
        transform: on ? 'scale(1)' : 'scale(0.5)',
        transition: instant ? 'none' : `opacity 360ms ${EASE} ${delay}ms, transform 460ms ${SPRING} ${delay}ms, box-shadow 420ms ${EASE}`,
        ...style,
      }}
    >
      <CvIcon name={icon} w={Math.round(size * 0.72)} />
      {badge && (
        <span className="absolute" style={{ right: -8, top: -8 }}>
          {badge}
        </span>
      )}
    </span>
  )
}

export function Packet({ x1, y1, x2, y2, on, tone = colors.accent, delay = 0, dur = 1.8, size = 9 }: { x1: number; y1: number; x2: number; y2: number; on: boolean; tone?: string; delay?: number; dur?: number; size?: number }) {
  if (!on || STILL) return null
  const f = fx('flow', delay, dur)
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute rounded-full ${f.className}`}
      style={{ ...f.style, animationFillMode: 'backwards', left: x1 - size / 2, top: y1 - size / 2, width: size, height: size, background: tone, boxShadow: `0 0 0 3px ${tone}33`, zIndex: 4, '--dx': `${x2 - x1}px`, '--dy': `${y2 - y1}px` } as CSSProperties}
    />
  )
}

export function Disc({ children, size = 30, tone = colors.brand, fill = colors.white, ink, className = '', style }: { children: ReactNode; size?: number; tone?: string; fill?: string; ink?: string; className?: string; style?: CSSProperties }) {
  return (
    <span aria-hidden className={`grid place-items-center rounded-full ${className}`} style={{ width: size, height: size, background: fill, color: ink ?? tone, boxShadow: `inset 0 0 0 2px ${tone}, 0 8px 16px -10px rgba(16,32,58,0.55)`, ...style }}>
      {children}
    </span>
  )
}

/** The section's own loops and one-shot moves, prefixed `sb-`; every one held still on harness URLs, in thumbnails and under reduced motion. */
export const SB_CSS = `
/* R8.1 (2026-11-04): every loop runs on with no rest beat between cycles */
@keyframes sb-snip { 0%, 100% { transform: rotate(-90deg) } 25% { transform: rotate(-104deg) } 75% { transform: rotate(-80deg) } }
.sb-snip { animation: sb-snip 1.2s ease-in-out infinite; }
@keyframes sb-hop { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }
.sb-hop { animation: sb-hop 1.6s ease-in-out infinite; }
@keyframes sb-shackle { 0% { transform: translateY(-6px) } 100% { transform: translateY(0) } }
.sb-shackle { animation: sb-shackle 640ms cubic-bezier(0.34,1.56,0.64,1) 260ms both; }
@keyframes sb-gather { 0% { transform: translate(0, 0) scale(1); opacity: 0 } 15% { opacity: 1 } 85% { opacity: 1 } 100% { transform: translate(var(--dx), var(--dy)) scale(0.6); opacity: 0 } }
.sb-gather { animation: sb-gather 900ms cubic-bezier(0.45,0,0.55,1) both; }
@keyframes sb-bounce { 0% { transform: translateX(70px); opacity: 0 } 30% { transform: translateX(0); opacity: 1 } 42% { transform: translateX(-6px) } 52% { transform: translateX(6px) } 62% { transform: translateX(-4px) } 72%, 100% { transform: translateX(0); opacity: 1 } }
.sb-bounce { animation: sb-bounce 1.3s cubic-bezier(0.22,1,0.36,1) both; }
@keyframes sb-flash { 0% { opacity: 0 } 18% { opacity: 0.55 } 40% { opacity: 0.12 } 58% { opacity: 0.45 } 100% { opacity: 0 } }
.sb-flash { animation: sb-flash 1.1s ease-out both; }
@keyframes sb-jolt { 0%, 100% { transform: translateX(0) } 15% { transform: translateX(-4px) rotate(-1.5deg) } 30% { transform: translateX(4px) rotate(1.5deg) } 45% { transform: translateX(-3px) } 60% { transform: translateX(3px) } 75% { transform: translateX(0) } }
.sb-jolt { animation: sb-jolt 700ms ease-in-out 2 both; }
@keyframes sb-drop { 0% { transform: translateY(-16px); opacity: 0 } 60% { transform: translateY(2px); opacity: 1 } 100% { transform: translateY(0); opacity: 1 } }
.sb-drop { animation: sb-drop 560ms cubic-bezier(0.34,1.4,0.64,1) both; }
@keyframes sb-slide { 0% { transform: translateX(-46px); opacity: 0 } 100% { transform: translateX(0); opacity: 1 } }
.sb-slide { animation: sb-slide 620ms cubic-bezier(0.22,1,0.36,1) both; }
@keyframes sb-glass { 0%, 100% { transform: scale(1) } 50% { transform: scale(1.12) } }
.sb-glass { animation: sb-glass 2.4s cubic-bezier(0.45,0,0.55,1) infinite; }
.cc-still .sb-snip, .cc-still .sb-hop, .cc-still .sb-shackle, .cc-still .sb-bounce, .cc-still .sb-jolt, .cc-still .sb-drop, .cc-still .sb-slide, .cc-still .sb-glass,
.deck-thumb .sb-snip, .deck-thumb .sb-hop, .deck-thumb .sb-shackle, .deck-thumb .sb-bounce, .deck-thumb .sb-jolt, .deck-thumb .sb-drop, .deck-thumb .sb-slide, .deck-thumb .sb-glass { animation: none !important; }
.cc-still .sb-gather, .cc-still .sb-flash, .deck-thumb .sb-gather, .deck-thumb .sb-flash { display: none; }
@media (prefers-reduced-motion: reduce) { .sb-snip, .sb-hop, .sb-shackle, .sb-bounce, .sb-jolt, .sb-drop, .sb-slide, .sb-glass { animation: none !important; } .sb-gather, .sb-flash { display: none; } }
`
