import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { colors } from '@/design/tokens'
import { useTween } from '@/ui'
import { useInstant } from '@/motion/instant'
import { Glow } from './motion'
import { Lines } from './common'

/**
 * THE PIECES OF PF 19 "LISTS".
 *
 * The spec draws a list the same way on every card that teaches one: a row of
 * boxes, one item per box, the position number under each box, smaller than
 * the value so the two never look alike (C1's must line). These are that row,
 * the cursor that points at a position, the output panel a press adds a line
 * to, the one big line of code a card asks about, and the small pills.
 *
 * Every colour is a token (content rule 37). Every number is the explanatory
 * tier. Session-local: nothing here is in the kit yet.
 */

/* ------------------------------------------------------------------ boxes */

/**
 *   plain   waiting
 *   hit     taken by a slice, or the value a press just handed back (success)
 *   now     the cursor is on it (brand ring, soft halo)
 *   new     just joined the row (brand tint)
 *   mark    pointed out (accent ring): the 2 that was a, the brackets
 *   grey    skipped or never reached, and it stays grey
 *   wall    the stop position: outlined in the danger tone, not taken
 *   ghost   a position past the end: dashed, nothing in it
 *   out     crossed off (the game's suspects use their own cards; this is for a value that is gone)
 */
export type BoxState = 'plain' | 'hit' | 'now' | 'new' | 'mark' | 'grey' | 'wall' | 'ghost' | 'out'

const SZ = {
  lg: { h: 64, font: 22, idx: 18, gap: 8, pad: 26, minW: 64, lane: 34 },
  md: { h: 54, font: 19, idx: 16, gap: 6, pad: 22, minW: 54, lane: 30 },
  sm: { h: 44, font: 16, idx: 16, gap: 6, pad: 18, minW: 44, lane: 26 },
  xs: { h: 40, font: 14, idx: 16, gap: 5, pad: 14, minW: 40, lane: 24 },
  /* the takeaways' small pictures */
  xxs: { h: 26, font: 12.5, idx: 11, gap: 3, pad: 8, minW: 26, lane: 18 },
} as const
export type BoxSize = keyof typeof SZ
export const BOX = SZ

/** The width every box of a row takes: the longest item decides, so the row is even. */
export function boxWidth(items: string[], size: BoxSize, fixed?: number) {
  if (fixed) return fixed
  const s = SZ[size]
  const longest = items.reduce((m, t) => Math.max(m, t.length), 0)
  /* PF 30: two pixels more, so `'Kiran'` at 19px never runs 1px past its box (box-overflow-check) */
  return Math.max(s.minW, Math.round(longest * s.font * 0.62 + s.pad) + 2)
}

function look(st: BoxState): { bg: string; ring: string; ink: string; dash?: boolean; fade?: number; thick?: boolean; halo?: boolean } {
  switch (st) {
    case 'hit':
      return { bg: '#E9F8EF', ring: colors.success, ink: colors.ink, thick: true }
    case 'now':
      return { bg: colors.surface2, ring: colors.brand, ink: colors.brandDark, thick: true, halo: true }
    case 'new':
      return { bg: colors.surface2, ring: colors.brand, ink: colors.brandDark }
    case 'mark':
      return { bg: '#FFF4EC', ring: colors.accent, ink: colors.ink, thick: true }
    case 'grey':
      return { bg: colors.surface, ring: colors.line, ink: colors.muted, fade: 0.55 }
    case 'wall':
      return { bg: 'transparent', ring: colors.danger, ink: colors.muted, thick: true, fade: 0.9 }
    case 'ghost':
      return { bg: 'transparent', ring: colors.line, ink: 'transparent', dash: true }
    case 'out':
      return { bg: colors.surface, ring: colors.line, ink: colors.muted, fade: 0.4 }
    default:
      return { bg: colors.white, ring: colors.line, ink: colors.ink }
  }
}

/**
 * A row of list boxes. `positions` draws the index under each box; `labels`
 * replaces the index with a word (Mon, Tue). `ghosts` adds dashed boxes past
 * the end, so a cursor can go where there is nothing (T1 line 6, the walker's
 * stop at 6). `cursor` is the position the cursor points at (may be a ghost);
 * `cursorDown` drops it onto the box, otherwise it waits above. `joined`
 * draws the boxes touching, as one row under one name; `name` is the tag at
 * the left and `tail` the words at the right.
 */
export function ListBoxes({
  items,
  size = 'md',
  states = {},
  positions = true,
  labels,
  width,
  ghosts = 0,
  ghostStates = {},
  cursor = null,
  cursorDown = true,
  cursorLabel,
  joined = false,
  name,
  tail,
  posOn = true,
  posStagger = false,
  quote = false,
  frame,
  empty,
  lane = true,
  neg,
  rowLabels = false,
  posHidden,
  negStagger = false,
  className = '',
}: {
  /** The negative row fills from the right, one number at a time (C9). */
  negStagger?: boolean
  items: string[]
  /**
   * The second position row (PF 21), counted from the end: -n … -1. `null`
   * draws no row; an array says, box by box, whether the number shows (false
   * draws an empty dashed slot, so the row is there before it fills).
   */
  neg?: boolean[] | null
  /** The words `index` and `negative index` at the left of the two rows. */
  rowLabels?: boolean
  /** Positions whose number is hidden (X1 hides none; a drop-in hides some). */
  posHidden?: number[]
  /** Reserve the cursor lane above the boxes (off for a row that never carries a cursor). */
  lane?: boolean
  /** A dashed frame drawn round boxes [first, last], inclusive. */
  frame?: [number, number]
  /** Words drawn in a dashed box when the row has no items: `empty`. */
  empty?: string
  size?: BoxSize
  states?: Record<number, BoxState>
  positions?: boolean
  labels?: string[]
  width?: number
  ghosts?: number
  ghostStates?: Record<number, BoxState>
  cursor?: number | null
  cursorDown?: boolean
  cursorLabel?: ReactNode
  joined?: boolean
  name?: string
  tail?: ReactNode
  /** The position row shows (false keeps the space and hides the numbers, for a drop-in). */
  posOn?: boolean
  /** Drop the positions in one by one, left to right, when `posOn` turns on. */
  posStagger?: boolean
  /** Items are strings of a Python list: wrap them in quotes when they are words. */
  quote?: boolean
  className?: string
}) {
  const s = SZ[size]
  const w = boxWidth(items, size, width)
  const gap = joined ? 0 : s.gap
  const tween = useTween(420)
  const instant = useInstant()
  const total = items.length + ghosts
  /* The cursor lives in its own lane above the boxes and never enters a box
     (rule 42). A cursor that carries a label (`item`) needs 16px more lane, and
     the lane is reserved whenever the prop is passed, so it never changes
     height between steps. */
  const labelled = cursorLabel !== undefined
  const CURSOR_H = 20 + (labelled ? 16 : 0)
  const laneH = lane ? s.lane + (labelled ? 16 : 0) : 0
  const xOf = (i: number) => i * (w + gap) + w / 2
  const showCursor = cursor !== null && cursor !== undefined && cursor >= -1 && cursor <= total
  const rowW = total * w + (total - 1) * gap
  const IDX_GAP = 6
  const NEG_GAP = 8
  return (
    <div className={`flex items-start ${className}`} style={{ gap: 14 }}>
      {rowLabels && (
        <div className="flex shrink-0 flex-col items-end font-body font-semibold leading-none" style={{ paddingTop: laneH + s.h + IDX_GAP, fontSize: s.idx - 1, color: colors.muted }}>
          <span style={{ height: s.idx, lineHeight: `${s.idx}px` }}>index</span>
          {neg && <span style={{ marginTop: NEG_GAP, height: s.idx + 8, lineHeight: `${s.idx + 8}px` }}>negative index</span>}
        </div>
      )}
      {name && (
        <span className="shrink-0 self-start rounded-lg px-3 font-mono font-bold" style={{ marginTop: laneH, height: s.h, lineHeight: `${s.h}px`, fontSize: s.font - 2, background: colors.brandDark, color: colors.white }}>
          {name}
        </span>
      )}
      <div className="relative" style={{ width: total === 0 ? undefined : rowW, paddingTop: laneH }}>
        {total === 0 && (
          <span className="grid place-items-center rounded-xl px-4 font-body font-semibold" style={{ height: s.h, minWidth: w, fontSize: s.font - 4, color: colors.muted, border: `2px dashed ${colors.line}` }}>
            {empty ?? '[ ]'}
          </span>
        )}
        {frame && (
          <span
            aria-hidden
            className="pointer-events-none absolute rounded-2xl"
            style={{
              left: frame[0] * (w + gap) - 7,
              width: (frame[1] - frame[0] + 1) * (w + gap) - gap + 14,
              top: laneH - 7,
              height: s.h + 14,
              border: `3px dashed ${colors.brandDark}`,
              transition: instant ? 'none' : tween,
            }}
          />
        )}
        {/* the cursor lane */}
        {showCursor && (
          <div
            aria-hidden
            className="absolute flex flex-col items-center"
            style={{
              left: xOf(cursor) - 16,
              top: cursorDown ? laneH - CURSOR_H - 4 : 0,
              width: 32,
              transition: instant ? 'none' : tween,
              zIndex: 2,
            }}
          >
            {cursorLabel && <span className="mb-0.5 whitespace-nowrap font-mono text-[16px] font-bold leading-none" style={{ color: colors.brandDark }}>{cursorLabel}</span>}
            <svg width="26" height="20" viewBox="0 0 26 20" aria-hidden>
              <path d="M13 2 v8" stroke={colors.brandDark} strokeWidth="3.5" strokeLinecap="round" />
              <path d="M3 9 L13 19 L23 9 Z" fill={colors.brandDark} />
            </svg>
          </div>
        )}
        <div className="flex" style={{ gap }}>
          {Array.from({ length: total }, (_, i) => {
            const isGhost = i >= items.length
            const st: BoxState = isGhost ? (ghostStates[i] ?? 'ghost') : (states[i] ?? 'plain')
            const L = look(st)
            const text = isGhost ? '' : quote ? `'${items[i]}'` : items[i]
            const radius = joined ? (i === 0 ? '12px 0 0 12px' : i === total - 1 ? '0 12px 12px 0' : '0') : 12
            return (
              <div key={i} className="flex flex-col items-center" style={{ width: w }}>
                <span
                  className="grid place-items-center font-mono font-semibold"
                  style={{
                    width: w,
                    height: s.h,
                    fontSize: s.font,
                    borderRadius: radius,
                    background: L.bg,
                    color: L.ink,
                    border: `${L.thick ? 3 : 2}px ${L.dash ? 'dashed' : 'solid'} ${L.ring}`,
                    marginLeft: joined && i > 0 ? -2 : 0,
                    opacity: L.fade ?? 1,
                    boxShadow: L.halo ? `0 0 0 5px ${colors.brand}26` : `0 0 0 0 ${colors.brand}00`,
                    textDecoration: st === 'out' ? 'line-through' : 'none',
                    transition: instant ? 'none' : tween,
                    whiteSpace: 'nowrap',
                    zIndex: st === 'now' ? 1 : 0,
                    position: 'relative',
                  }}
                >
                  {text}
                </span>
                {(positions || labels) && (
                  <span
                    className="font-mono leading-none"
                    style={{
                      marginTop: IDX_GAP,
                      height: s.idx,
                      lineHeight: `${s.idx}px`,
                      fontSize: s.idx,
                      color: isGhost ? colors.danger : labels ? colors.body : colors.muted,
                      fontWeight: labels ? 600 : 500,
                      opacity: posOn ? (isGhost ? 0.9 : 1) : 0,
                      transform: posOn ? 'none' : 'translateY(-8px)',
                      transition: instant ? 'none' : `opacity 420ms cubic-bezier(0.22,1,0.36,1) ${posStagger ? i * 130 : 0}ms, transform 420ms cubic-bezier(0.22,1,0.36,1) ${posStagger ? i * 130 : 0}ms`,
                    }}
                  >
                    {labels ? (labels[i] ?? '') : posHidden?.includes(i) ? '' : i}
                  </span>
                )}
                {neg && !isGhost && (
                  <span
                    className="grid place-items-center rounded-md font-mono font-semibold leading-none"
                    style={{
                      marginTop: NEG_GAP,
                      height: s.idx + 8,
                      minWidth: Math.min(w, 40),
                      fontSize: s.idx,
                      color: colors.accentDark,
                      border: `1.5px dashed ${neg[i] ? 'transparent' : colors.line}`,
                      transition: instant ? 'none' : 'border-color 420ms cubic-bezier(0.22,1,0.36,1)',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        opacity: neg[i] ? 1 : 0,
                        transform: neg[i] ? 'none' : 'translateY(-6px)',
                        transition: instant ? 'none' : `opacity 420ms cubic-bezier(0.22,1,0.36,1) ${negStagger ? (items.length - 1 - i) * 260 : 0}ms, transform 420ms cubic-bezier(0.22,1,0.36,1) ${negStagger ? (items.length - 1 - i) * 260 : 0}ms`,
                      }}
                    >
                      {i - items.length}
                    </span>
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
      {tail && (
        <span className="shrink-0 whitespace-nowrap font-semibold" style={{ marginTop: laneH, height: s.h, lineHeight: `${s.h}px`, fontSize: s.font - 2, color: colors.body }}>
          {tail}
        </span>
      )}
    </div>
  )
}

/** Where box `i` of a row drawn by `ListBoxes` has its centre, for anything drawn above or under it. */
export function boxCentre(i: number, items: string[], size: BoxSize, joined = false, width?: number) {
  const s = SZ[size]
  const w = boxWidth(items, size, width)
  const gap = joined ? 0 : s.gap
  return i * (w + gap) + w / 2
}

/* ------------------------------------------------------------- type sizes */

/**
 * ONE SIZE PER ROLE (generate-slides 2b, item 7): every program on a content
 * card at CODE_FS, every output at OUT_FS, chosen so the longest spec line
 * fits its column. CODE_REF_FS is the one smaller role: a program shown for
 * reference beside the one being asked (C2's corner copy of the recap, the
 * recap's closing program, C13's waiting question). K1's grid has its own.
 */
export const CODE_FS = 15
export const OUT_FS = 16
export const CODE_REF_FS = 13

/* ----------------------------------------------------------------- output */

export interface OutLine {
  text: string
  tone?: 'plain' | 'error' | 'muted'
}

/**
 * The output panel a press adds a line to. Lines arrive in order and stay;
 * `minRows` keeps the panel one height all card. An `error` line is Python's
 * own message, in the danger tone. The header is `Output`, `Terminal` or
 * `Expected output` (content rule 31), never a file.
 */
export function OutPanel({
  title = 'Output',
  lines,
  minRows = 1,
  fontSize = 18,
  width,
  tone = 'out',
  empty,
  className = '',
  maxH,
}: {
  title?: string
  lines: OutLine[]
  minRows?: number
  fontSize?: number
  width?: number | string
  tone?: 'out' | 'in' | 'exp'
  /** Words shown in the panel while it has no lines: `nothing printed` */
  empty?: ReactNode
  className?: string
  /** The panel's whole height may not pass this (a fixed-height group): more lines than fit step the rows, and the type with them, down until they do (PF 29's T2). Never a clip. */
  maxH?: number
}) {
  const paint = tone === 'in' ? colors.brand : tone === 'exp' ? colors.accent : colors.success
  const rowH0 = Math.round(fontSize * 1.6)
  /* the header is 37px and the frame 2px; the body pads 20px */
  const bodyMax = maxH === undefined ? Infinity : maxH - 39 - 20
  const rowH = lines.length > 0 && lines.length * rowH0 > bodyMax ? Math.max(14, Math.floor(bodyMax / lines.length)) : rowH0
  const base = rowH < rowH0 ? Math.floor(((fontSize * rowH) / rowH0) * 10) / 10 : fontSize
  const lastKey = lines.length
  /* A long line (Python's own error text) never clips and never wraps into what
     looks like a second output line: the panel's type steps down until the
     longest line fits (sessions 23 and 24 audit, 2026-10-08). */
  const body = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(base)
  const sig = lines.map((l) => l.text).join('\n')
  useLayoutEffect(() => {
    const el = body.current
    if (!el) return
    const avail = el.clientWidth - 32
    let widest = 0
    el.querySelectorAll<HTMLElement>('[data-outline]').forEach((d) => (widest = Math.max(widest, d.scrollWidth * (base / fit))))
    setFit(widest > avail && widest > 0 ? Math.max(11, Math.floor((base * avail) / widest * 10) / 10) : base)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, base])
  return (
    <Glow on={lines.length > 0} pulse={lastKey} color={lines.some((l) => l.tone === 'error') ? colors.danger : colors.success} className={className} style={width !== undefined ? { width } : undefined}>
      <div className="w-full overflow-hidden rounded-card border border-line bg-white" style={{ boxShadow: '0 1px 2px rgba(16,32,58,0.07), 0 6px 14px -6px rgba(16,32,58,0.13)' }}>
        <div className="flex items-center gap-2.5 border-b border-line px-4 py-1.5" style={{ background: `${paint}14` }}>
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: paint }} />
          <span className="font-heading text-[16px] font-bold uppercase tracking-wider" style={{ color: colors.body }}>
            {title}
          </span>
        </div>
        <div ref={body} className="relative px-4 py-2.5" style={{ minHeight: minRows * rowH + 20 }}>
          {lines.length === 0 && empty && (
            <span className="absolute inset-x-4 top-2.5 text-[16px] font-semibold italic" style={{ color: colors.muted }}>
              {empty}
            </span>
          )}
          {lines.map((l, j) => (
            <Appear key={j}>
              <div data-outline className="w-max whitespace-pre font-mono" style={{ fontSize: fit, lineHeight: `${rowH}px`, color: l.tone === 'error' ? colors.danger : l.tone === 'muted' ? colors.muted : colors.ink, fontWeight: l.tone === 'error' ? 600 : 500 }}>
                {l.text || ' '}
              </div>
            </Appear>
          ))}
        </div>
      </div>
    </Glow>
  )
}

/** A block that fades up on mount, and mounts still during an instant jump. */
export function Appear({ children, className = '', style, delay = 0 }: { children: ReactNode; className?: string; style?: CSSProperties; delay?: number }) {
  const instant = useInstant()
  const [on, setOn] = useState(instant)
  useEffect(() => {
    if (instant) return
    const t = window.setTimeout(() => setOn(true), 16 + delay)
    return () => window.clearTimeout(t)
  }, [instant, delay])
  return (
    <div className={className} style={{ ...style, opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(8px)', transition: instant ? 'none' : 'opacity 480ms cubic-bezier(0.22,1,0.36,1), transform 480ms cubic-bezier(0.22,1,0.36,1)' }}>
      {children}
    </div>
  )
}

/**
 * Content that is swapped in place (a new program, a new round's options, a
 * new list on a phone): when `k` changes, the new content eases in, a short
 * fade from 0.2 with a 6px rise, instead of popping (user, 2026-10-08: "every
 * element that appears suddenly needs a little ease-in animation"). The first
 * mount is left to the slide's own entrance; an instant jump never animates.
 */
export function Fresh({ k, children, className = '', style }: { k: string | number; children: ReactNode; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const instant = useInstant()
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const el = ref.current
    if (!el || instant) return
    el.animate([{ opacity: 0.2, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(0.22,1,0.36,1)' })
  }, [k, instant])
  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  )
}

/** Something that is on screen or not, kept in the layout either way so nothing jumps. */
export function Show({ on, children, className = '', style, lift = 8 }: { on: boolean; children: ReactNode; className?: string; style?: CSSProperties; lift?: number }) {
  const tween = useTween(480)
  return (
    <div className={className} style={{ ...style, opacity: on ? 1 : 0, transform: on ? 'none' : `translateY(${lift}px)`, transition: tween, pointerEvents: on ? undefined : 'none' }}>
      {children}
    </div>
  )
}

/* --------------------------------------------------------------- big line */

/**
 * The line a card is asking about, the biggest text on the card (C5, C10,
 * E1's must lines). Mono, in the brand's dark blue, on a white strip. Re-enters
 * on each change.
 */
export function BigLine({ children, size = 30, k, className = '' }: { children: ReactNode; size?: number; k?: string | number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const instant = useInstant()
  useEffect(() => {
    const el = ref.current
    if (!el || instant) return
    el.animate([{ opacity: 0.2, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 480, easing: 'cubic-bezier(0.22,1,0.36,1)' })
  }, [k, instant])
  return (
    <div ref={ref} className={`inline-block rounded-2xl bg-white px-6 py-2 font-mono font-bold ${className}`} style={{ fontSize: size, color: colors.brandDark, boxShadow: `inset 0 0 0 2px ${colors.line}`, lineHeight: 1.25, whiteSpace: 'nowrap' }}>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ pills */

/** The small uppercase pill over a task: `Worksheet · Task 1`, `Your turn · 5 minutes`. */
export function TaskPill({ children }: { children: ReactNode }) {
  return (
    <span className="self-start whitespace-nowrap rounded-md px-3 py-1 text-[16px] font-bold uppercase tracking-wider" style={{ background: '#FFF4EC', color: colors.accentDark }}>
      {children}
    </span>
  )
}

/** The numbered brief of a task, one step per line. */
export function Steps({ items, size = 17 }: { items: ReactNode[]; size?: number }) {
  return (
    <ol className="flex flex-col gap-1 [&_b]:font-bold [&_b]:text-ink">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2.5 leading-snug" style={{ fontSize: size, color: colors.body }}>
          <b className="w-5 shrink-0">{i + 1}.</b>
          <span>{t}</span>
        </li>
      ))}
    </ol>
  )
}

/** The blue note under a figure: the rule, said once. */
export function Note({ lines, size = 16, on = true, className = '' }: { lines: ReactNode[]; size?: number; on?: boolean; className?: string }) {
  const tween = useTween(420)
  return (
    <div className={`rounded-xl px-4 py-2 font-semibold leading-snug ${className}`} style={{ fontSize: size, background: colors.surface2, color: colors.ink, boxShadow: `inset 4px 0 0 ${colors.brandDark}`, opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(6px)', transition: tween }}>
      <Lines lines={lines.flatMap((l) => (typeof l === 'string' ? sentences(l) : [l]))} />
    </div>
  )
}

/** A question to the room, in the brand's dark blue. */
export function Ask({ children, size = 22, className = '' }: { children: ReactNode; size?: number; className?: string }) {
  return (
    <p className={`font-heading font-bold leading-snug ${className}`} style={{ fontSize: size, color: colors.brandDark }}>
      {/* PF 27: a plain sentence is set one per line, its closing full stop dropped (content rule 36) */}
      {typeof children === 'string' ? <Lines lines={sentences(children)} /> : children}
    </p>
  )
}

/* ---------------------------------------------------------------- options */

const HOUSE = 'cubic-bezier(0.22, 1, 0.36, 1)'

/**
 * A vote option: clickable so the room's pick is locked in, never gating the
 * press (plan decision 11). `shown` is the reveal: the right one goes green,
 * a wrong pick red, the rest fade. `detail` is what shows under it once shown.
 */
export function Option({
  letter,
  picked,
  right,
  shown,
  onPick,
  children,
  detail,
  mono = true,
  size = 18,
  dense = false,
  nowrap = false,
  className = '',
  style,
}: {
  /** keep the option on one line (PF 24's rule G2) */
  nowrap?: boolean
  /** PF 29: a grid placement (an option spanning two columns) */
  style?: CSSProperties
  /** Tighter vertical padding, for a stack of three under a crowded panel. */
  dense?: boolean
  letter: string
  picked: boolean
  right: boolean
  shown: boolean
  onPick: () => void
  children: ReactNode
  detail?: ReactNode
  mono?: boolean
  size?: number
  className?: string
}) {
  const instant = useInstant()
  const tween = useTween(420)
  const isRight = shown && right
  const wrongPick = shown && picked && !right
  return (
    <button
      type="button"
      disabled={shown}
      aria-pressed={picked}
      onKeyDown={(e) => e.key !== 'Enter' && e.key !== ' ' && e.currentTarget.blur()}
      onClick={() => !shown && onPick()}
      className={`sm-tap relative flex flex-col items-start justify-center rounded-xl bg-white px-4 ${dense ? 'py-1.5' : 'py-2.5'} text-left ${className}`}
      style={{
        ...style,
        transition: instant ? 'none' : `background-color 360ms ${HOUSE}, box-shadow 360ms ${HOUSE}, opacity 360ms ${HOUSE}, transform 160ms ${HOUSE}`,
        background: isRight ? '#E9F8EF' : wrongPick ? '#FDECEC' : picked ? colors.surface2 : colors.white,
        boxShadow: `inset 0 0 0 ${isRight || picked ? 3 : 2}px ${isRight ? colors.success : wrongPick ? colors.danger : picked ? colors.brand : colors.line}`,
        opacity: shown && !right ? 0.6 : 1,
      }}
    >
      {/* G5 (user, 2026-10-08): the letter and the option text share one centre line, with equal space above and below */}
      <span className="flex w-full items-center gap-3" style={{ minHeight: Math.round(size * 1.5) }}>
        <span className="grid w-5 shrink-0 place-items-center self-stretch font-mono text-[16px] font-bold leading-none" style={{ color: isRight ? colors.success : picked ? colors.brand : colors.muted }}>{letter}</span>
        <span className={`${mono ? 'font-mono' : ''} block font-semibold`} style={{ fontSize: size, lineHeight: 1.35, color: isRight ? '#137A3A' : colors.brandDark, whiteSpace: nowrap ? 'nowrap' : 'pre-line' }}>{children}</span>
      </span>
      {detail && (
        <span className="ml-8 block text-[16px] leading-snug" style={{ color: colors.body, maxHeight: shown ? 160 : 0, opacity: shown ? 1 : 0, overflow: 'hidden', transition: tween }}>
          {detail}
        </span>
      )}
    </button>
  )
}

/* ------------------------------------------------------------ sentences */

/**
 * Content rule 36 on a spec sentence: split a line that holds two or three
 * sentences into one line each, and drop the full stop that ends each. A
 * question keeps its mark. Not a word changes.
 */
export function sentences(s: string): string[] {
  return s
    /* A `!` ends a sentence only before a capital (PF 22's fix); so does a `?` (PF 28: "in cse? yes" is one clause) */
    /* PF 31: `from ... import brings in one name.` is one sentence; a full stop after another full stop is an ellipsis, not an end */
    .split(/(?<=[^.]\.)\s+(?=\S)|(?<=[?!])\s+(?=[A-Z])/)
    .map((t) => t.trim().replace(/\.$/, ''))
    .filter(Boolean)
}

/* ------------------------------------------------------------------ swap */

/**
 * Content that is REPLACED on a press (a caption, a question, an app screen):
 * the old one eases out, the new one eases in from `from`, never a cut
 * (review, 2026-10-08, rule G1). `mode="wait"` for text, so two sentences
 * never overlap; `overlay` stacks the two (an app screen sliding over the
 * last one), the parent then needs `relative` and a fixed size.
 */
export function Swap({
  k,
  children,
  className = '',
  from = 'up',
  overlay = false,
}: {
  k: string | number
  children: ReactNode
  className?: string
  from?: 'up' | 'right'
  overlay?: boolean
}) {
  const instant = useInstant()
  const off = from === 'right' ? { x: 46, y: 0 } : { x: 0, y: 10 }
  const gone = from === 'right' ? { x: -46, y: 0 } : { x: 0, y: -8 }
  return (
    <AnimatePresence mode={overlay ? 'sync' : 'wait'} initial={false}>
      <motion.div
        key={k}
        className={`${overlay ? 'absolute inset-0 ' : ''}${className}`}
        initial={instant ? false : { opacity: 0, ...off }}
        animate={{ opacity: 1, x: 0, y: 0, transition: { duration: instant ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] } }}
        exit={{ opacity: 0, ...gone, transition: { duration: instant ? 0 : overlay ? 0.42 : 0.22, ease: [0.22, 1, 0.36, 1] } }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

/* --------------------------------------------------------------- draw box */

/** A square drawn round an element with a path, as a pen would (rule G4). */
export function DrawBox({ on, color, pad = 6, delay = 0, radius = 6 }: { on: boolean; color: string; pad?: number; delay?: number; radius?: number }) {
  const instant = useInstant()
  return (
    <svg aria-hidden className="pointer-events-none absolute" style={{ left: -pad, top: -pad, width: `calc(100% + ${pad * 2}px)`, height: `calc(100% + ${pad * 2}px)`, overflow: 'visible' }}>
      <rect
        x="1.5"
        y="1.5"
        rx={radius}
        fill="none"
        stroke={color}
        strokeWidth="3"
        pathLength={1}
        strokeDasharray="1"
        style={{ width: 'calc(100% - 3px)', height: 'calc(100% - 3px)', strokeDashoffset: on ? 0 : 1, opacity: on ? 1 : 0, transition: instant ? 'none' : `stroke-dashoffset 860ms cubic-bezier(0.65,0,0.35,1) ${delay}ms, opacity 160ms ${delay}ms` }}
      />
    </svg>
  )
}

