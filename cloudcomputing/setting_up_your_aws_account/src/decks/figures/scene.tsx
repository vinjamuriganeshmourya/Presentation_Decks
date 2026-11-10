import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { colors, easing } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Panel, Group } from '@/ui/foundations/common'
import { Press } from '@/ui/foundations/motion'
import { TILE_SKIN } from './card'
import { CARD_SKIN } from './card'

/**
 * THE PIECES EVERY FIGURE SLIDE OF THIS DECK IS BUILT FROM.
 *
 * `Card` is the frame: the kit's zoned header, the reference's lead as the
 * body's first block (content rule 32), one body BOX 1110px wide on the left
 * edge (content rule 38: the lead and the box share the left edge, and the box
 * is narrower than the zone so `mixed-align-check` reads it as one left block).
 *
 * NO NEXT, NO AUTOPLAY (user, 2026-10-15): every beat is on screen when the
 * slide opens (`revealEveryStep` in the deck file), so `beat` arrives as the
 * slide's last beat and there is nothing left for a button to press.
 *
 * Inside the box a scene is laid out with absolute positions on a fixed
 * stage, so a step never moves what is already there.
 */

export const BOX_W = 1110

/**
 * WHICH BEAT IS "THE CURRENT ONE": none (user, 2026-10-15). Every beat is on
 * screen when the slide opens, so the last bullet or row is not the one being
 * talked about, and lighting it as current would say it is.
 */
export const isNow = (_beat: number, _at: number) => false

/** Harness URLs hold every live loop still (Python 29's lesson: a moving svg stalls the screenshot). */
export const STILL = typeof window !== 'undefined' && /[?&](all|noauto|still)(=|&|$)/.test(window.location.search)

/** Reduced motion holds every loop at its still frame too (motion layer, 2026-10-16): the content loops are loop animation. */
export const REDUCED = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function Card({
  id,
  kicker,
  title,
  lead,
  lesson,
  beat,
  total,
  children,
}: {
  id: string
  kicker: string
  title: string
  lead?: ReactNode
  lesson: string
  /** the beat on screen (from `useBeats`) and the slide's beat count; no controls when absent */
  beat?: number
  total?: number
  children: ReactNode
}) {
  void beat
  /*
    VISUALLY CENTRED (user, 2026-10-22: "some slides have empty space below,
    push that content down a little, visually centred, not the kicker, divider
    or title"; then: "the text needs to be associated with the content", and
    "it is glitching, moving up and down"). Once, when the slide mounts, the
    LEAD AND THE BODY are moved down together by half the empty space between
    the body's foot and the safe bottom (640 on the 720 canvas, above the
    player bar), by a transform, so the kicker, divider and title stay where
    they are and the layout never changes. Measured with the transforms
    cleared and in slide units whatever the stage's zoom; measured ONCE, not
    on every render (re-measuring an already-moved body halved the shift each
    time and the content rocked up and down). Only when the slack is worth
    moving for; never past the safe bottom.
  */
  const body = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = body.current
    const sec = el?.closest('section')
    if (!el || !sec) return
    /* the kit's ZonedFrame (mode "top") lays the lead and the body in one content column:
       content > [lead block, wrapper > this div]; that column is what moves, lead and body as one */
    const zone = el.closest('[data-zone="space1"]')
    const block = ((zone?.firstElementChild as HTMLElement | null) ?? el.parentElement?.parentElement ?? el) as HTMLElement
    block.style.transform = ''
    const sr = sec.getBoundingClientRect()
    const scale = sr.height / 720 || 1
    const r = block.getBoundingClientRect()
    const slack = 640 - (r.bottom - sr.top) / scale
    block.style.transform = slack > 24 ? `translateY(${Math.round(slack / 2)}px)` : ''
  }, [])
  return (
    <Panel kicker={kicker} title={title} lead={lead} lesson={lesson} mode="top" wide spec={id} presses={total ? total - 1 : 0}>
      <div ref={body} style={{ width: BOX_W }}>{children}</div>
    </Panel>
  )
}

/** A bold label at the head of a point (the review's `**Label:**`). */
export const B = ({ children }: { children: ReactNode }) => <b className="font-heading font-semibold">{children}</b>

/** One phrase of a statement, lit (brand colour, semibold, never underlined: review 2026-10-16) when `hi` is set. */
export type StatementPart = { t: string; hi?: boolean }

/**
 * THE STATEMENT HALF OF A SPLIT SLIDE (review 2026-10-15): the definition or
 * lead a slide opened with, alone on its own frame in one 1110px box, so the
 * points and the picture get the next frame to themselves. Every split slide
 * in this deck uses this frame, so the halves read as one pattern. `art` is a
 * small static picture on the box's right, never a second copy of the words.
 */
export function Statement({ id, kicker, title, label, parts, lesson, art }: { id: string; kicker: string; title: string; label: string; parts: StatementPart[]; lesson: string; art?: ReactNode }) {
  return (
    <Card id={id} kicker={kicker} title={title} lesson={lesson}>
      <Stage w={BOX_W} h={art ? 400 : 360} active={false} pad={36}>
        <div className="flex h-full items-center gap-10">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-full" style={{ background: colors.brand }} aria-hidden>
                <svg width={14} height={18} viewBox="0 0 14 18"><circle cx={7} cy={3} r={2.2} fill={colors.white} /><rect x={5.2} y={7} width={3.6} height={10} rx={1.8} fill={colors.white} /></svg>
              </span>
              <span className="font-heading text-[20px] font-semibold" style={{ color: colors.brandDark }}>{label}</span>
            </div>
            <p className="mt-5 whitespace-pre-line text-[28px] font-medium leading-[1.5]" style={{ color: colors.ink }}>
              {parts.map((p, i) => (
                <span key={i} style={p.hi ? { color: colors.brand, fontWeight: 600 } : undefined}>
                  {p.t}
                </span>
              ))}
            </p>
          </div>
          {art && <div className="grid w-[300px] shrink-0 place-items-center">{art}</div>}
        </div>
      </Stage>
    </Card>
  )
}

/** A lead that holds two sentences: one line each (content rule 36). */
export function LeadLines({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((l, i) => (
        <span key={i} className="block">
          {l}
        </span>
      ))}
    </>
  )
}

/* ------------------------------------------------------------------ the rail */

export type RailItem = { text: ReactNode; at: number }

/**
 * The reference's bullets, each arriving on the beat that draws it (content
 * rule 6: the line and its picture arrive together). The bullet whose beat is
 * on screen is lit; the earlier ones stay, quieter.
 */
export function Rail({ items, beat, width = 372, size = 17, gap = 10 }: { items: RailItem[]; beat: number; width?: number; size?: number; gap?: number }) {
  const instant = useInstant()
  const ease = instant ? 'none' : `all 480ms cubic-bezier(0.22,1,0.36,1)`
  return (
    <div className="flex shrink-0 flex-col" style={{ width, gap }}>
      {items.map((it, i) => {
        const shown = beat >= it.at
        const now = isNow(beat, it.at)
        return (
          <div
            key={i}
            className="flex items-start gap-3 rounded-2xl px-3.5 py-2.5"
            style={{
              ...(now ? { background: 'rgba(232,240,255,0.95)', boxShadow: `inset 0 0 0 2px ${colors.brand}` } : TILE_SKIN),
              opacity: shown ? 1 : 0,
              transform: shown ? 'none' : 'translateY(8px)',
              transition: ease,
            }}
          >
            <span className="mt-[7px] grid h-[14px] w-[14px] shrink-0 place-items-center rounded-full" style={{ background: now ? colors.brand : colors.surface2, boxShadow: `inset 0 0 0 1.5px ${colors.brand}`, transition: ease }}>
              <span className="block h-[5px] w-[5px] rounded-full" style={{ background: now ? colors.white : colors.brand }} />
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

/* ------------------------------------------------------------------ the stage */

/**
 * A fixed-size stage for a scene: one `Group` (generate-slides 2b item 1),
 * lit while it is the cluster the room works on. Everything inside is placed
 * with `At`, so nothing moves the stage's own size.
 */
export function Stage({ w, h, active, children, className = '', pad = 0, style, raised = true }: { w: number | string; h: number; active?: boolean; children: ReactNode; className?: string; pad?: number; style?: CSSProperties; raised?: boolean }) {
  return (
    <Group pad={pad} active={active} className={`relative shrink-0 overflow-hidden ${className}`} style={{ width: w, height: h, ...(raised ? RAISED : {}), ...style }}>
      {children}
    </Group>
  )
}

/**
 * THE RAISED CARD (user, 2026-10-16, from the reference render; the default for
 * every stage since the same day's "same style for all"): a stage that
 * reads as a plate lying on the slide. Its surface and shadow are `card.tsx`
 * `CARD_SKIN`, which says why it is CSS on the Group and not a layer.
 */
const RAISED: CSSProperties = CARD_SKIN

/** Absolute placement inside a stage. `cx` centres the child on x. */
export function At({ x, y, cx = false, cy = false, w, children, style, className = '' }: { x: number; y: number; cx?: boolean; cy?: boolean; w?: number; children: ReactNode; style?: CSSProperties; className?: string }) {
  const t = `${cx ? 'translateX(-50%)' : ''} ${cy ? 'translateY(-50%)' : ''}`.trim()
  return (
    <div className={`absolute ${className}`} style={{ left: x, top: y, width: w, transform: t || undefined, ...style }}>
      {children}
    </div>
  )
}

/** Shown or not, fading and rising, keeping its place. */
export function Fade({ on, children, lift = 10, delay = 0, style, className = '' }: { on: boolean; children: ReactNode; lift?: number; delay?: number; style?: CSSProperties; className?: string }) {
  const instant = useInstant()
  return (
    <div
      className={className}
      style={{
        opacity: on ? 1 : 0,
        transform: on ? 'none' : `translateY(${lift}px)`,
        transition: instant ? 'none' : `opacity 520ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 520ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
        pointerEvents: on ? undefined : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ labels */

export type LabelTone = 'plain' | 'brand' | 'solid' | 'lift' | 'good' | 'bad' | 'warn' | 'muted' | 'dark'

const LABEL: Record<LabelTone, { bg: string; ink: string; ring: string }> = {
  /* COLOURS (user, 2026-10-22): the plain chip is the render's: white to a faint blue foot, a blue ring */
  plain: { bg: 'linear-gradient(180deg, #FFFFFF 0%, #EEF3FD 100%)', ink: colors.ink, ring: '#C3D3F0' },
  brand: { bg: colors.surface2, ink: colors.brandDark, ring: colors.brand },
  solid: { bg: colors.brand, ink: colors.white, ring: colors.brand },
  lift: { bg: 'linear-gradient(180deg, #FFFFFF 0%, #EEF3FD 100%)', ink: colors.brandDark, ring: '#C3D3F0' },
  good: { bg: '#E9F8EF', ink: '#137A3A', ring: colors.success },
  bad: { bg: '#FDECEC', ink: colors.danger, ring: colors.danger },
  warn: { bg: '#FFF4E0', ink: '#9A5B00', ring: colors.warning },
  muted: { bg: colors.surface, ink: colors.muted, ring: '#CFDCF5' },
  dark: { bg: colors.brandDeep, ink: colors.white, ring: colors.brandDeep },
}

/**
 * A label: a DOM chip beside the object it names (content rule 17), never
 * text inside the svg. `icon` (user, 2026-10-16, from the reference render)
 * puts a house icon on a small tinted tile at the chip's head, only where it
 * says something the words do not (generate-slides §4), `iconRound` as a
 * filled disc (the render's tick); `raised` lifts the chip off the card with
 * a soft shadow, the ring still inset (rule 43); `lift` is its white chip
 * with brand ink.
 */
export function Label({ children, tone = 'plain', size = 14, strong = false, mono = false, className = '', style, icon, raised = false, iconRound = false }: { children: ReactNode; tone?: LabelTone; size?: number; strong?: boolean; mono?: boolean; className?: string; style?: CSSProperties; icon?: ReactNode; raised?: boolean; iconRound?: boolean }) {
  const ease = useInstant() ? 'none' : 'all 420ms cubic-bezier(0.22,1,0.36,1)'
  const t = LABEL[tone]
  /* a label is read from the back of a room: never under 14px, whatever a scene asks for */
  const px = Math.max(14, size)
  const tileBg = iconRound ? t.ring : tone === 'plain' || tone === 'lift' ? colors.surface2 : tone === 'solid' ? 'rgba(255,255,255,0.22)' : `${t.ring}26`
  const tileInk = iconRound ? colors.white : tone === 'plain' || tone === 'lift' ? colors.brand : t.ink
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-pill ${icon ? 'gap-2 pl-1.5 pr-3 py-[3px]' : 'px-2.5 py-[3px]'} leading-tight ${strong ? 'font-heading font-semibold' : 'font-medium'} ${mono ? 'font-mono' : ''} ${className}`}
      style={{ fontSize: px, background: t.bg, color: t.ink, boxShadow: `inset 0 0 0 1.5px ${t.ring}${raised ? ', 0 8px 16px -10px rgba(16,32,58,0.35)' : ''}`, transition: ease, ...style }}
    >
      {icon && (
        <span className={`grid shrink-0 place-items-center ${iconRound ? 'rounded-full [&>svg]:h-[12px] [&>svg]:w-[12px] [&>svg]:[stroke-width:3]' : 'rounded-[7px] [&>svg]:h-[14px] [&>svg]:w-[14px]'}`} style={{ width: iconRound ? px + 4 : px + 8, height: iconRound ? px + 4 : px + 8, background: tileBg, color: tileInk }} aria-hidden>
          {icon}
        </span>
      )}
      {children}
    </span>
  )
}

/** A plain line of text in a scene, the quietest layer. */
export function Note({ children, size = 14, tone = colors.ink, className = '', style }: { children: ReactNode; size?: number; tone?: string; className?: string; style?: CSSProperties }) {
  return (
    <span className={`block leading-snug ${className}`} style={{ fontSize: Math.max(14, size), color: tone, ...style }}>
      {children}
    </span>
  )
}

/**
 * The scene's caption: centred, and a new caption eases in after the old one
 * eases out (generate-slides 2b item 5). Absolute, at the foot of a stage.
 */
export function Caption({ text, k, w, x = 0, y, size = 16 }: { text: ReactNode; k: string | number; w: number; x?: number; y: number; size?: number }) {
  const instant = useInstant()
  return (
    <div className="absolute" style={{ left: x, top: y, width: w }}>
      <motion.div
        key={k}
        initial={instant ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: instant ? 0 : 0.52, ease: easing.soft }}
        className="text-center font-semibold leading-snug"
        style={{ fontSize: size, color: colors.ink }}
      >
        {text}
      </motion.div>
    </div>
  )
}

/* ------------------------------------------------------------------ arrows */

/**
 * An arrow from (x1, y1) to (x2, y2) on the stage, drawn along its path in
 * reading order when `on` turns true (generate-slides 2b item 10). The head is
 * 9px on a 2.5px line, sized in user space (content rule 45), and the last
 * stretch of the line runs straight into it (rule 46).
 */
export function Arrow({ x1, y1, x2, y2, on = true, tone = colors.brand, dashed = false, delay = 0, both = false, width = 2.5 }: { x1: number; y1: number; x2: number; y2: number; on?: boolean; tone?: string; dashed?: boolean; delay?: number; both?: boolean; width?: number }) {
  const instant = useInstant()
  const ang = Math.atan2(y2 - y1, x2 - x1)
  const H = 9
  const ex = x2 - Math.cos(ang) * H
  const ey = y2 - Math.sin(ang) * H
  const sx = both ? x1 + Math.cos(ang) * H : x1
  const sy = both ? y1 + Math.sin(ang) * H : y1
  const head = (tx: number, ty: number, a: number) => {
    const l = { x: tx - Math.cos(a) * H + Math.cos(a + Math.PI / 2) * 5, y: ty - Math.sin(a) * H + Math.sin(a + Math.PI / 2) * 5 }
    const r = { x: tx - Math.cos(a) * H - Math.cos(a + Math.PI / 2) * 5, y: ty - Math.sin(a) * H - Math.sin(a + Math.PI / 2) * 5 }
    return `M ${tx} ${ty} L ${l.x} ${l.y} L ${r.x} ${r.y} Z`
  }
  /* the box is the line and its heads, nothing more: overlap-check reads an arrow by its svg's own box */
  const px = Math.cos(ang + Math.PI / 2) * 5
  const py = Math.sin(ang + Math.PI / 2) * 5
  const xs = [x1, x2, ex + px, ex - px, ...(both ? [sx + px, sx - px] : [])]
  const ys = [y1, y2, ey + py, ey - py, ...(both ? [sy + py, sy - py] : [])]
  const minX = Math.floor(Math.min(...xs) - width / 2)
  const minY = Math.floor(Math.min(...ys) - width / 2)
  const maxX = Math.ceil(Math.max(...xs) + width / 2)
  const maxY = Math.ceil(Math.max(...ys) + width / 2)
  const t = instant ? 'none' : `stroke-dashoffset 860ms cubic-bezier(0.65,0,0.35,1) ${delay}ms, opacity 200ms ${delay}ms`
  return (
    <svg aria-hidden className="pointer-events-none absolute" style={{ left: minX, top: minY, overflow: 'visible' }} width={maxX - minX} height={maxY - minY}>
      <g transform={`translate(${-minX} ${-minY})`}>
        {/* a dashed arrow keeps user-unit lengths (no pathLength), so its '7 7' pattern (period 14) travels two periods per mo-dash lap with no jump */}
        <path d={`M ${sx} ${sy} L ${ex} ${ey}`} stroke={tone} strokeWidth={width} strokeLinecap="round" fill="none" pathLength={dashed ? undefined : 1} strokeDasharray={dashed ? undefined : '1'} className={dashed ? 'mo mo-dash' : undefined} style={{ strokeDashoffset: dashed ? undefined : on ? 0 : 1, opacity: on ? 1 : 0, transition: t, ...(dashed ? { strokeDasharray: '7 7' } : {}) }} />
        {/* the motion layer (2026-10-16): a lighter dash rides the line from source to target, so the direction of flow is always readable */}
        {!dashed && <path d={`M ${sx} ${sy} L ${ex} ${ey}`} stroke={colors.white} strokeWidth={Math.max(1, width * 0.45)} strokeLinecap="round" fill="none" strokeDasharray="5 9" className="mo mo-dash" style={{ opacity: on ? 0.75 : 0, transition: instant ? 'none' : `opacity 300ms ${delay + 700}ms`, '--mo-delay': `${-((x1 * 7 + y1 * 3) % 16) / 10}s` } as CSSProperties} />}
        <path d={head(x2, y2, ang)} fill={tone} style={{ opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 300ms ${delay + (dashed ? 200 : 700)}ms` }} />
        {both && <path d={head(x1, y1, ang + Math.PI)} fill={tone} style={{ opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 300ms ${delay + 700}ms` }} />}
      </g>
    </svg>
  )
}

/** A dot that travels a list of stage points while `run` is true, then rests on the last one. */
export function Traveller({ path, run, k, tone = colors.accent, size = 16, dur = 2.4 }: { path: [number, number][]; run: boolean; k: string | number; tone?: string; size?: number; dur?: number }) {
  const instant = useInstant()
  const end = path[path.length - 1]
  if (!run) return null
  return (
    <motion.span
      key={k}
      aria-hidden
      data-cc-after=""
      className="pointer-events-none absolute rounded-full"
      style={{ width: size, height: size, background: tone, boxShadow: `0 0 0 4px ${tone}40`, left: -size / 2, top: -size / 2 }}
      initial={instant ? { x: end[0], y: end[1] } : { x: path[0][0], y: path[0][1] }}
      animate={{ x: path.map((p) => p[0]), y: path.map((p) => p[1]) }}
      transition={{ duration: instant ? 0 : dur, ease: 'easeInOut' }}
    />
  )
}

/* ------------------------------------------------------------------ live controls */

/**
 * A control the room uses inside a scene (plan decision 5): a pill button.
 * It never changes slide (the kit's gesture hook skips a swipe that starts on
 * a button), and it gives the arrow keys back by blurring after a press.
 */
export function Control({ children, onClick, on, disabled = false, size = 14 }: { children: ReactNode; onClick: () => void; on?: boolean; disabled?: boolean; size?: number }) {
  const ease = useInstant() ? 'none' : 'all 300ms cubic-bezier(0.22,1,0.36,1)'
  const look = disabled
    ? { background: colors.surface, color: colors.muted, boxShadow: `inset 0 0 0 1px ${colors.line}` }
    : on
      ? { background: colors.brand, color: colors.white, boxShadow: `0 6px 16px -8px ${colors.brand}` }
      : { background: colors.white, color: colors.brandDark, boxShadow: `inset 0 0 0 1.5px ${colors.brand}` }
  return (
    <Press>
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          onClick()
          e.currentTarget.blur()
        }}
        onKeyDown={(e) => e.key !== 'Enter' && e.key !== ' ' && e.currentTarget.blur()}
        className="inline-flex h-[30px] items-center gap-1.5 whitespace-nowrap rounded-pill px-3.5 font-heading font-semibold leading-none"
        style={{ fontSize: Math.max(14, size), transition: ease, ...look }}
      >
        {children}
      </button>
    </Press>
  )
}

/** A slider the room drags (demand, load). Gives the arrow keys back to the deck when released. `auto`: driven by the scene's `useLoop`, no hand can move it (global rule 3). */
export function Slider({ value, onChange, label, width = 220, fill = false, auto = false }: { value: number; onChange: (v: number) => void; label: ReactNode; width?: number; fill?: boolean; auto?: boolean }) {
  const ref = useRef<HTMLInputElement>(null)
  /* `fill` (user, 2026-10-16, from the reference render): the track is brand up to the thumb, so the level reads at a glance */
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <label className="flex items-center gap-3" style={{ width }}>
      <span className="shrink-0 font-heading text-[14px] font-semibold" style={{ color: colors.ink }}>
        {label}
      </span>
      {/* SMOOTHNESS (user, 2026-10-22): the filled part of the track is a bar scaled by `transform`, under the input, not a gradient repainted per frame */}
      <span className="relative min-w-0 flex-1" style={{ height: 22 }}>
        {fill && (
          <span aria-hidden className="pointer-events-none absolute left-0 right-0 top-1/2 h-[8px] -translate-y-1/2 overflow-hidden rounded-full" style={{ background: colors.surface2, boxShadow: `inset 0 0 0 1px ${colors.line}` }}>
            <span className="absolute inset-0 origin-left rounded-full" style={{ background: colors.brand, transform: `scaleX(${pct / 100})` }} />
          </span>
        )}
        <input
          ref={ref}
          type="range"
          min={0}
          max={100}
          value={Math.round(value * 100)}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          onPointerUp={() => ref.current?.blur()}
          onKeyDown={(e) => e.stopPropagation()}
          className={`cc-range absolute inset-x-0 top-1/2 w-full -translate-y-1/2${fill ? ' cc-range-clear' : ''}`}
          tabIndex={auto ? -1 : undefined}
          style={auto ? { pointerEvents: 'none' } : undefined}
          aria-label={typeof label === 'string' ? label : 'level'}
        />
      </span>
    </label>
  )
}

/** A counter that grows by one every `ms` while `on`, held at `still` on harness URLs. */
export function useTicker(on: boolean, ms = 600, still = 0): number {
  const [n, setN] = useState(0)
  /* a picker thumbnail renders under InstantContext: it holds still like a harness URL */
  const instant = useInstant()
  const held = STILL || REDUCED || instant
  useEffect(() => {
    if (!on || held) return
    const t = window.setInterval(() => setN((v) => v + 1), ms)
    return () => window.clearInterval(t)
  }, [on, ms, held])
  return held ? still : n
}

/**
 * A LOOP THAT NEEDS NO HAND (review 2026-10-16, global rule 3: every manual
 * interaction becomes an automatic, seamless, looping animation). Returns a
 * phase that runs forever at constant speed: ping-pong 0 to 1 to 0 (a level
 * that rises and falls, no visible reset) or `sawtooth` 0 to 1 then 0 again
 * (a flow in one direction). Drawn on requestAnimationFrame, so a scene eases
 * its own state changes on the house curve and never jumps. Held at `still`
 * on harness URLs and under InstantContext (a picker thumbnail), or the
 * screenshot stalls. The deck's one loop duration: a lap every 8s.
 */
export function useLoop(periodMs = 8000, opts: { mode?: 'pingpong' | 'sawtooth'; still?: number; on?: boolean; steps?: number } = {}): number {
  const { mode = 'pingpong', still = 0.25, on = true, steps = 240 } = opts
  const instant = useInstant()
  const held = STILL || REDUCED || instant || !on
  const [t, setT] = useState(still)
  useEffect(() => {
    if (held) return
    let raf = 0
    let last = -1
    const t0 = performance.now()
    const tick = (now: number) => {
      /* the phase is quantised to `steps` per lap, so a slide re-renders only when it has moved (about 30 times a second at 8s) */
      const q = Math.floor((((now - t0) / periodMs) % 1) * steps)
      if (q !== last) {
        last = q
        const u = q / steps
        setT(mode === 'sawtooth' ? u : u < 0.5 ? u * 2 : 2 - u * 2)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [held, periodMs, mode, steps])
  return held ? still : t
}

/** A step index that advances by itself every `ms`, 0 to n-1 and round again (a scene that had a Next or a button). The deck's one step duration: 2400ms. */
export function useCycle(n: number, ms = 2400, still = 0): number {
  const k = useTicker(true, ms, still)
  return n > 0 ? k % n : 0
}

/** Local state that resets to `init` whenever the beat changes (a press shows the beat's own picture). */
export function useBeatState<T>(beat: number, init: (b: number) => T): [T, (v: T) => void] {
  const [st, setSt] = useState<{ beat: number; v: T }>(() => ({ beat, v: init(beat) }))
  const v = st.beat === beat ? st.v : init(beat)
  return [v, (nv: T) => setSt({ beat, v: nv })]
}

/** A small round number badge, for a numbered step in a scene. */
export function Num({ n, on = true, size = 24 }: { n: number | string; on?: boolean; size?: number }) {
  const ease = useInstant() ? 'none' : 'all 420ms cubic-bezier(0.22,1,0.36,1)'
  return (
    <span className="grid shrink-0 place-items-center rounded-full font-heading font-semibold leading-none" style={{ width: size, height: size, fontSize: Math.max(14, size * 0.55), background: on ? colors.brand : colors.surface2, color: on ? colors.white : colors.brandDark, transition: ease }}>
      {n}
    </span>
  )
}

/** The CSS a live control needs (the range thumb), mounted once by the deck. */
export const SCENE_CSS = `
.cc-range { -webkit-appearance: none; appearance: none; height: 8px; border-radius: 999px; background: ${colors.surface2}; box-shadow: inset 0 0 0 1px ${colors.line}; cursor: pointer; }
.cc-range-clear { background: transparent; box-shadow: none; }
.cc-range::-webkit-slider-thumb { -webkit-appearance: none; width: 22px; height: 22px; border-radius: 999px; background: ${colors.brand}; box-shadow: 0 0 0 4px ${colors.white}, 0 4px 10px -2px ${colors.brand}; }
.cc-range::-moz-range-thumb { width: 22px; height: 22px; border: 0; border-radius: 999px; background: ${colors.brand}; box-shadow: 0 0 0 4px ${colors.white}, 0 4px 10px -2px ${colors.brand}; }
.cc-still svg *, .cc-still svg { animation: none !important; }
[data-cc-after] { transition: opacity 400ms cubic-bezier(0.22,1,0.36,1); }
.cc-entering [data-cc-after] { opacity: 0 !important; transition: none; }
`
