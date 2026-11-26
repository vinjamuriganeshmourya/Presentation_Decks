import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { TILE_SKIN } from '../card'
import { BOX_W, Card, Stage, STILL } from '../scene'

/**
 * THE VISUAL PASS'S SHARED PIECES (user, 2026-11-03: "only visuals change: icons,
 * symbols, illustrations, transitions, micro-interactions"). Nothing here carries
 * words of its own: every string on a slide is still the spec's.
 *
 *   CvIcon       a render from the asset library (`assets/icons/Icons`), copied
 *                into `./icons/` trimmed to its subject and bundled, so the
 *                single file inlines it
 *   LitPoints    the TR's points with a subject icon each, the point the figure
 *                is on lit (the line and its picture are one idea, rule 6)
 *   AwsMark      the AWS logo with its smile drawn as a separate part, so the
 *                "a to z" arrow can swing like a smile
 *   FX_CSS       the micro-animations, each one saying what its object DOES:
 *                a gear turns (working), a needle sweeps (a measure), a wheel
 *                spins (moving), a ring ripples (spreading), a crash shakes, a
 *                badge pops (it just happened). Transform and opacity only, so
 *                every one runs on the compositor; all held still on harness
 *                URLs, in picker thumbnails and under reduced motion.
 */

const ICONS = import.meta.glob('./icons/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>

export type CvIconName =
  | 'layers' | 'shield-lock' | 'meter' | 'clock' | 'hourglass' | 'server-stack' | 'gear-update' | 'bug' | 'warning' | 'alert'
  | 'shield-closed' | 'desktop' | 'coder' | 'student-laptop' | 'data-storage' | 'cloud' | 'laptop-front' | 'tools' | 'database'
  | 'files' | 'network' | 'hierarchy' | 'laptop' | 'integration' | 'rocket' | 'gear-wrench' | 'globe-www' | 'aws-word' | 'aws-smile'

export const iconUrl = (n: CvIconName) => ICONS[`./icons/${n}.png`]

/** A library render at a width, its own aspect. */
export function CvIcon({ name, w, className = '', style }: { name: CvIconName; w: number; className?: string; style?: CSSProperties }) {
  return <img src={iconUrl(name)} alt="" aria-hidden draggable={false} className={`block h-auto select-none ${className}`} style={{ width: w, ...style }} />
}

/** `cvx cvx-<kind>` with a phase: the class pair every micro-animation uses. */
export function fx(kind: string, delay = 0, dur?: number): { className: string; style: CSSProperties } {
  const style: Record<string, string> = { '--fx-delay': `${delay}s` }
  if (dur) style['--fx-dur'] = `${dur}s`
  return { className: `cvx cvx-${kind}`, style: style as CSSProperties }
}

import { VTABLE_CSS } from './vtable'
export const FX_CSS = VTABLE_CSS + `
.cvx { animation-delay: var(--fx-delay, 0s); will-change: transform, opacity; }
@keyframes cvx-smile { 0%, 12% { transform: scaleX(0.35) rotate(0deg); opacity: 0.25 } 34% { transform: scaleX(1.06) rotate(-3deg); opacity: 1 } 44% { transform: scaleX(0.98) rotate(1deg) } 52%, 100% { transform: scaleX(1) rotate(0deg); opacity: 1 } }
.cvx-smile { transform-origin: 2% 30%; animation: cvx-smile var(--fx-dur, 3.4s) cubic-bezier(0.22,1,0.36,1) infinite; }
@keyframes cvx-spin { to { transform: rotate(360deg) } }
.cvx-spin { animation: cvx-spin var(--fx-dur, 6s) linear infinite; }
.cvx-spin-fast { animation: cvx-spin var(--fx-dur, 0.7s) linear infinite; }
@keyframes cvx-sweep { 0%, 100% { transform: rotate(-55deg) } 50% { transform: rotate(55deg) } }
.cvx-sweep { transform-origin: 50% 100%; animation: cvx-sweep var(--fx-dur, 2.6s) cubic-bezier(0.65,0,0.35,1) infinite; }
@keyframes cvx-ripple { 0% { transform: scale(0.6); opacity: 0.85 } 100% { transform: scale(1.5); opacity: 0 } }
.cvx-ripple { animation: cvx-ripple var(--fx-dur, 2.2s) cubic-bezier(0.22,1,0.36,1) infinite; }
@keyframes cvx-shake { 0%, 100% { transform: translateX(0) rotate(0) } 15% { transform: translateX(-3px) rotate(-4deg) } 30% { transform: translateX(3px) rotate(4deg) } 45% { transform: translateX(-2px) rotate(-2deg) } 60% { transform: translateX(2px) rotate(2deg) } 75%, 99% { transform: translateX(0) rotate(0) } }
.cvx-shake { animation: cvx-shake var(--fx-dur, 1.6s) ease-in-out infinite; }
@keyframes cvx-bob { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-2.5px) } }
.cvx-bob { animation: cvx-bob var(--fx-dur, 0.42s) ease-in-out infinite; }
@keyframes cvx-blink { 0%, 100% { opacity: 1 } 50% { opacity: 0.2 } }
.cvx-blink { animation: cvx-blink var(--fx-dur, 1s) steps(1, end) infinite; }
@keyframes cvx-glow { 0%, 100% { opacity: 0.55 } 50% { opacity: 1 } }
.cvx-glow { animation: cvx-glow var(--fx-dur, 1.8s) ease-in-out infinite; }
@keyframes cvx-pop { 0% { transform: scale(0.4); opacity: 0 } 60% { transform: scale(1.15); opacity: 1 } 100% { transform: scale(1); opacity: 1 } }
.cvx-pop { animation: cvx-pop 0.46s cubic-bezier(0.22,1,0.36,1) both; }
@keyframes cvx-flow { 0% { transform: translate(0, 0); opacity: 0 } 12% { opacity: 1 } 88% { opacity: 1 } 100% { transform: translate(var(--dx, 0px), var(--dy, 0px)); opacity: 0 } }
.cvx-flow { animation: cvx-flow var(--fx-dur, 1.8s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes cvx-wrench { 0%, 100% { transform: rotate(0deg) } 30% { transform: rotate(-28deg) } 60% { transform: rotate(6deg) } }
.cvx-wrench { transform-origin: 70% 70%; animation: cvx-wrench var(--fx-dur, 2.2s) cubic-bezier(0.65,0,0.35,1) infinite; }
@keyframes cvx-shackle { 0%, 20% { transform: translateY(-7px) } 38%, 80% { transform: translateY(0) } 100% { transform: translateY(-7px) } }
.cvx-shackle { animation: cvx-shackle var(--fx-dur, 3s) cubic-bezier(0.65,0,0.35,1) infinite; }
@keyframes cvx-clone { 0%, 15% { transform: translate(0, 0); opacity: 0 } 25% { opacity: 0.9 } 60%, 85% { transform: translate(var(--dx, 26px), var(--dy, 10px)); opacity: 0.9 } 100% { transform: translate(var(--dx, 26px), var(--dy, 10px)); opacity: 0 } }
.cvx-clone { animation: cvx-clone var(--fx-dur, 3.2s) cubic-bezier(0.22,1,0.36,1) infinite; }
@keyframes cvx-hop { 0%, 100% { transform: translateY(0) } 40% { transform: translateY(-6px) } 60% { transform: translateY(0) } }
.cvx-hop { animation: cvx-hop var(--fx-dur, 1.6s) cubic-bezier(0.22,1,0.36,1) infinite; }
@keyframes cvx-flip { 0%, 40% { transform: rotate(0deg) } 50%, 90% { transform: rotate(180deg) } 100% { transform: rotate(360deg) } }
.cvx-flip { animation: cvx-flip var(--fx-dur, 4s) cubic-bezier(0.65,0,0.35,1) infinite; }
.cc-still .cvx, .deck-thumb .cvx { animation: none !important; }
.cc-still .cvx-flow, .deck-thumb .cvx-flow, .cc-still .cvx-clone, .deck-thumb .cvx-clone { opacity: 0 !important; }
@media (prefers-reduced-motion: reduce) { .cvx { animation: none !important; } .cvx-flow, .cvx-clone { opacity: 0 !important; } }
`

/** A ring that ripples out from a point (a spread, a signal), `on` when it should be running. */
export function Ripple({ x, y, r, tone = colors.danger, on = true, n = 2, dur = 2.2 }: { x: number; y: number; r: number; tone?: string; on?: boolean; n?: number; dur?: number }) {
  if (!on || STILL) return null
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className={`pointer-events-none absolute rounded-full ${fx('ripple', (-i * dur) / n, dur).className}`}
          style={{ ...fx('ripple', (-i * dur) / n, dur).style, left: x - r, top: y - r, width: r * 2, height: r * 2, border: `2px solid ${tone}` }}
        />
      ))}
    </>
  )
}

/** A small round badge holding an icon: it pops in when `on` turns true (it just happened). */
export function Badge({ on, children, tone = colors.white, ring = colors.brand, size = 30, style }: { on: boolean; children: ReactNode; tone?: string; ring?: string; size?: number; style?: CSSProperties }) {
  return (
    <span
      aria-hidden
      className="grid place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background: tone,
        boxShadow: `inset 0 0 0 2px ${ring}, 0 6px 14px -8px rgba(16,32,58,0.6)`,
        opacity: on ? 1 : 0,
        transform: on ? 'scale(1)' : 'scale(0.5)',
        transition: 'opacity 380ms cubic-bezier(0.22,1,0.36,1), transform 460ms cubic-bezier(0.34,1.56,0.64,1)',
        ...style,
      }}
    >
      {children}
    </span>
  )
}

/**
 * The TR's points, each with the icon of its subject in a tile, the one the
 * figure is showing lit. The words are passed in unchanged.
 */
export function LitPoints({ items, lit = -1, width = 452, size = 18, gap = 10 }: { items: { icon: ReactNode; text: ReactNode }[]; lit?: number; width?: number; size?: number; gap?: number }) {
  const ease = 'all 420ms cubic-bezier(0.22,1,0.36,1)'
  return (
    <div className="flex shrink-0 flex-col" style={{ width, gap }}>
      {items.map((it, i) => {
        const on = !STILL && i === lit
        return (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5"
            style={{
              ...TILE_SKIN,
              boxShadow: on ? `inset 0 0 0 2px ${colors.brand}, 0 12px 24px -14px ${colors.brand}` : TILE_SKIN.boxShadow,
              background: on ? 'linear-gradient(180deg, #F4F8FF 0%, #E3ECFD 100%)' : TILE_SKIN.background,
              transform: on ? 'translateX(4px)' : 'none',
              transition: ease,
            }}
          >
            <span
              aria-hidden
              className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px] [&>svg]:h-[20px] [&>svg]:w-[20px]"
              style={{ background: on ? colors.brand : colors.surface2, color: on ? colors.white : colors.brand, transition: ease }}
            >
              {it.icon}
            </span>
            <span className="min-w-0 leading-snug" style={{ fontSize: size, color: colors.ink }}>
              {it.text}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/**
 * THE AWS MARK WITH A MOVING SMILE (user, 2026-11-03: "on the Amazon logo, animate
 * the a to z arrow like a smile"). The mark is the same file, cut in two at the gap
 * between the word and the arrow (`icons/aws-word.png`, `icons/aws-smile.png`), laid
 * back together at their original offsets; the arrow stretches out from its tail
 * and settles, on a loop.
 */
export function AwsMark({ w, caption }: { w: number; caption?: string }) {
  const k = w / 508
  return (
    <span className="inline-flex flex-col items-center gap-1">
      <span className="relative block" style={{ width: w, height: 304 * k }} role="img" aria-label="AWS">
        <img src={iconUrl('aws-word')} alt="" draggable={false} className="absolute block select-none" style={{ left: 21 * k, top: 0, width: 466 * k }} />
        <img src={iconUrl('aws-smile')} alt="" draggable={false} className={`absolute block select-none ${fx('smile').className}`} style={{ ...fx('smile').style, left: 0, top: 189 * k, width: 508 * k }} />
      </span>
      {caption && (
        <span className="whitespace-nowrap text-[14px] font-medium leading-tight" style={{ color: colors.muted }}>
          {caption}
        </span>
      )}
    </span>
  )
}

/**
 * The PointsFigure frame with lit points: the TR's points (each with its icon) on
 * the left, the figure on the right, the point the figure is acting out lit.
 */
export function LitFigure({ id, kicker, title, lead: l, lesson, points, lit, figure, figH = 380, pointsW = 452, pointSize = 18 }: { id: string; kicker: string; title: string; lead?: string; lesson: string; points: { icon: ReactNode; text: ReactNode }[]; lit: number; figure: ReactNode; figH?: number; pointsW?: number; pointSize?: number }) {
  return (
    <Card id={id} kicker={kicker} title={title} lead={l} lesson={lesson}>
      <div className="flex items-center" style={{ width: BOX_W, gap: 24 }}>
        <LitPoints items={points} lit={lit} width={pointsW} size={pointSize} />
        <Stage w={BOX_W - pointsW - 24} h={figH} active={false}>
          {figure}
        </Stage>
      </div>
    </Card>
  )
}

/** Two more loops for the use-case cards: a job lifting off its queue and finishing, a box dropping onto a host. */
export const FX_CSS_2 = `
@keyframes cvx-job { 0% { transform: translateY(0); opacity: 1 } 25% { transform: translateY(-16px); opacity: 1 } 38% { transform: translateY(-24px); opacity: 0 } 39%, 70% { transform: translateY(12px); opacity: 0 } 85%, 100% { transform: translateY(0); opacity: 1 } }
.cvx-job { animation: cvx-job var(--fx-dur, 3.2s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes cvx-drop { 0% { transform: translateY(-14px); opacity: 0 } 12% { transform: translateY(0); opacity: 1 } 88% { transform: translateY(0); opacity: 1 } 100% { transform: translateY(0); opacity: 0 } }
.cvx-drop { animation: cvx-drop var(--fx-dur, 4.2s) cubic-bezier(0.34,1.4,0.64,1) infinite; }
@keyframes cvx-lift { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-5px) } }
.cvx-lift { animation: cvx-lift var(--fx-dur, 2.6s) cubic-bezier(0.45,0,0.55,1) infinite; }
`

/**
 * A GAUGE WHOSE NEEDLE MOVES, NOT THE DIAL (corrections 2026-11-03, slides 5 and 50:
 * the lucide `Gauge` swung side to side as a whole). The dial is drawn still; only
 * the needle turns about the hub. `run` false holds the needle upright.
 */
export function NeedleGauge({ size = 16, color = colors.accent, run = true, delay = 0, dur = 2.4 }: { size?: number; color?: string; run?: boolean; delay?: number; dur?: number }) {
  const f = fx('needle', delay, dur)
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M3.5 17a9 9 0 1 1 17 0" />
      <path d="M6 12.5h.01M8.2 8.2h.01M12 6.5h.01M15.8 8.2h.01M18 12.5h.01" strokeWidth={2.4} />
      <g className={run ? f.className : undefined} style={{ ...(run ? f.style : {}), transformOrigin: '12px 16px', transformBox: 'view-box' }}>
        <path d="M12 16 L12 9" strokeWidth={2.2} />
      </g>
      <circle cx="12" cy="16" r="1.8" fill={color} stroke="none" />
    </svg>
  )
}

/**
 * THE DECK'S BULLET (corrections G7): no plain blue dot. `kind` says what the line
 * is: `ring` an outlined dot (a plain point), `tick` a step that is done, `arrow` a
 * step that leads on, `diamond` a sub point, `icon` a subject icon. The marker is a
 * box one line tall (`lineH` = font size x line height), centred in it, so its centre
 * sits on the first line's x-height middle whatever wraps below.
 */
export function Bullet({ kind = 'ring', size = 18, lineH = 1.45, tone = colors.brand, children }: { kind?: 'ring' | 'tick' | 'arrow' | 'diamond' | 'icon'; size?: number; lineH?: number; tone?: string; children?: ReactNode }) {
  const box = Math.round(size * lineH)
  const d = Math.round(size * (kind === 'icon' ? 1.1 : kind === 'ring' ? 0.62 : 0.95))
  return (
    <span aria-hidden className="grid shrink-0 place-items-center" style={{ height: box, width: Math.max(d, Math.round(size * 0.9)) }}>
      {kind === 'ring' && <span className="block rounded-full" style={{ width: d, height: d, boxShadow: `inset 0 0 0 2.5px ${tone}`, background: `${tone}14`, transform: 'translateY(0.04em)' }} />}
      {kind === 'diamond' && <span className="block" style={{ width: d * 0.6, height: d * 0.6, border: `2.5px solid ${tone}`, transform: 'rotate(45deg)' }} />}
      {kind === 'tick' && (
        <span className="grid place-items-center rounded-full" style={{ width: d, height: d, background: colors.success }}>
          <svg width={d * 0.62} height={d * 0.62} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </span>
      )}
      {kind === 'arrow' && (
        <svg width={d} height={d} viewBox="0 0 24 24" fill="none" stroke={tone} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9.5" strokeWidth={2} /><path d="M10 8l4 4-4 4" /></svg>
      )}
      {kind === 'icon' && <span className="grid place-items-center [&>svg]:h-full [&>svg]:w-full" style={{ width: d, height: d, color: tone }}>{children}</span>}
    </span>
  )
}

/** A bulleted line: the marker and the text in one flex row, aligned to the first line (items-start, the marker box one line tall). */
export function BulletLine({ kind, size = 18, lineH = 1.45, tone, icon, children, className = '', style }: { kind?: 'ring' | 'tick' | 'arrow' | 'diamond' | 'icon'; size?: number; lineH?: number; tone?: string; icon?: ReactNode; children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`flex items-start gap-2.5 ${className}`} style={style}>
      <Bullet kind={kind ?? (icon ? 'icon' : 'ring')} size={size} lineH={lineH} tone={tone}>{icon}</Bullet>
      <span className="min-w-0" style={{ fontSize: size, lineHeight: lineH, color: colors.ink }}>{children}</span>
    </div>
  )
}

/** The needle's sweep, a real gauge reading rising and falling about its hub. */
export const FX_CSS_3 = `
@keyframes cvx-needle { 0%, 100% { transform: rotate(-60deg) } 45% { transform: rotate(52deg) } 60% { transform: rotate(38deg) } }
.cvx-needle { animation: cvx-needle var(--fx-dur, 2.4s) cubic-bezier(0.65,0,0.35,1) infinite; }
.cc-still .cvx-needle, .deck-thumb .cvx-needle { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .cvx-needle { animation: none !important; } }
`

/**
 * THE NUMBERED ZOOM CALLOUT (corrections 2026-11-03, change 1: replaces the pointer
 * lines between a screenshot and its zooms). The same number sits on a ringed region
 * of the capture and on that region's zoom, so the room matches them by number.
 * Numbers restart at 1 on each screenshot, in the order the zooms appear. One style
 * for the whole deck: the template's orange disc (the ring colour), a white number,
 * a white rim so it reads on dark and light captures alike. Place it with `style`
 * (absolute, centred on the region's top-left corner, kept inside the capture).
 */
export function ZoomBadge({ n, on = true, size = 26, style }: { n: number; on?: boolean; size?: number; style?: CSSProperties }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none grid place-items-center rounded-full font-heading font-bold tabular-nums"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.56),
        lineHeight: 1,
        color: colors.white,
        background: colors.accent,
        boxShadow: `0 0 0 2.5px ${colors.white}, 0 4px 10px -4px rgba(16,32,58,0.55)`,
        opacity: on ? 1 : 0,
        transform: on ? 'scale(1)' : 'scale(0.5)',
        transition: 'opacity 320ms cubic-bezier(0.22,1,0.36,1), transform 420ms cubic-bezier(0.34,1.56,0.64,1)',
        zIndex: 3,
        ...style,
      }}
    >
      {n}
    </span>
  )
}
