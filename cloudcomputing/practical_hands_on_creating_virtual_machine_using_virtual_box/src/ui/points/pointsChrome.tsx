import { useId, useState, type CSSProperties, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { colors } from '@/design/tokens'
import { E, c4 } from '@/ui/figureTiming'
import type { PointTone } from './pointsFigure'

/**
 * ONE TONE RAMP, ONE TERM CHIP, ONE HOVER, FOR EVERY VARIANT IN THIS LAB.
 *
 * The sibling labs each grew three private copies of their card chrome, and by
 * the second variant the padding had already drifted. Three figures that differ in
 * GEOMETRY must not also differ in how much air is inside a box or which orange a
 * risk is, or the comparison measures the drift instead of the design.
 *
 * THE TONE RAMP, AND WHY `risk` IS NOT RED
 *
 * `danger` on a slide reads as an error in the deck: the room looks for what
 * broke. A risk in a points set is a trap the learner is about to walk into, which
 * is a warning and not a failure, so it takes the amber-orange the style guide
 * already uses for attention. Red stays available for the day a figure genuinely
 * needs to say "this is wrong".
 *
 * `lead` is the deepest brand blue rather than a fifth hue: the lead point is not
 * a different KIND of point, it is the same point carrying more weight, and weight
 * is what a variant's geometry is for.
 */
export const TONE_PAINT: Record<PointTone, string> = {
  neutral: colors.brand,
  good: colors.success,
  risk: colors.accentDark,
  lead: colors.brandDark,
}

export const toneOf = (tone: PointTone | undefined) => TONE_PAINT[tone ?? 'neutral']

/**
 * What a tone SAYS, spelled out.
 *
 * Colour alone carries on a good projector and nothing on a bad one, and a room
 * that cannot tell the amber point from the blue ones has lost the only part of
 * the set that was a warning. So a non-neutral tone gets a word as well as a hue,
 * and `neutral` gets nothing at all: a chip on every point is a chip the eye stops
 * reading.
 */
/**
 * Defaults only. A point's own `tag` wins, because these words were written against
 * one fixture and a deck that means something else by `risk` should say so.
 */
export const TONE_WORD: Record<PointTone, string | null> = {
  neutral: null,
  good: 'this one is free',
  risk: 'the usual trap',
  lead: 'start here',
}

export function ToneChip({
  tone,
  /** The author's own word for this tone. Wins over the default. */
  tag,
  style,
}: {
  tone: PointTone | undefined
  tag?: string
  style?: CSSProperties
}) {
  const word = tag ?? TONE_WORD[tone ?? 'neutral']
  if (!word) return null
  const paint = toneOf(tone)
  return (
    <span
      className="inline-block shrink-0 rounded-pill px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider"
      style={{ background: `${paint}1a`, color: paint, ...style }}
    >
      {word}
    </span>
  )
}

/**
 * The term, when the point has one.
 *
 * Mono, because a term is a word the learner will type, and setting it in the body
 * face makes it look like part of the sentence rather than the name of a thing.
 */
export function TermChip({
  term,
  paint,
  size = 'md',
}: {
  term: string
  paint: string
  size?: 'sm' | 'md'
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-pill font-mono font-bold ${
        size === 'sm' ? 'px-2 py-0.5 text-[10.5px]' : 'px-2.5 py-1 text-[12.5px]'
      }`}
      style={{ background: `${paint}14`, color: paint, border: `1px solid ${paint}2e` }}
    >
      {/*
        ITS OWN TIGHT-LEADING SPAN, AND THAT IS A HARNESS FIX RATHER THAN A STYLE
        CHOICE. The pill is 23px tall from its own padding around a 15px line, and
        `align-check.mjs` infers a wrapped token by comparing an element's height
        against its line-height: every one of the four terms was reported as "one
        token over 2 lines". The padding stays on the pill, the text gets
        `leading-none`, and the measurement matches what the eye sees. Same false
        positive the flow-chart lab hit on its own token chips.
      */}
      <span className="leading-none">{term}</span>
    </span>
  )
}

/**
 * THE HOVER ASIDE, AND THE THREE RULES IT EXISTS TO KEEP.
 *
 * All three were learned expensively in the sibling labs:
 *
 *   1. **Never in the DOM unless open.** `qa.mjs`, `video-safe.mjs` and
 *      `align-check.mjs` measure static rectangles, so a panel parked at
 *      `opacity: 0` is measured, and reported as overflowing the frame, on every
 *      run. `AnimatePresence` keeps it out of the tree entirely.
 *   2. **The lift is CSS, the popover is framer.** `.fc-node--hoverable` in
 *      `index.css` owns a 160ms transition, which retargets mid-flight; a keyframe
 *      or a JS tween restarts from zero and makes a quick pointer sweep across a
 *      row of cards look broken.
 *   3. **The SLOT is what gets raised, and the slot must be POSITIONED.**
 *      `.fc-node-slot:has(.fc-node--hoverable:hover)` in `index.css` lifts the
 *      whole slot to `z-index: 60`, because `FcNodeIn` animates `transform` and
 *      therefore creates a stacking context a `z-index` in here could never
 *      escape. A `z-index` on a STATIC element is ignored outright, so every
 *      `FcNodeIn` in this lab is passed `absolute` or `relative`. The pseudocode
 *      lab shipped without it and every aside that opened downward was painted
 *      over by the text below it: it read as transparent.
 *
 * The 0.18s is the documented UI-tier exception to this lab's timing scale. A
 * hover is triggered deliberately and repeatedly by the presenter while they wait
 * for the answer, so the figure's explanatory 520ms would feel broken here.
 */
export function HoverAside({
  detail,
  label,
  paint,
  side,
  /** Keeps a 300px aside inside the stage at either end of a row of cards. */
  dx = 0,
  className = '',
  children,
}: {
  detail?: ReactNode
  label: string
  paint: string
  side: 'top' | 'bottom'
  dx?: number
  className?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()
  const id = useId()
  const has = Boolean(detail)
  return (
    <div
      className={`relative h-full w-full ${className}`}
      onPointerEnter={() => has && setOpen(true)}
      onPointerLeave={() => setOpen(false)}
    >
      <div
        className={`fc-node h-full w-full ${has ? 'fc-node--hoverable' : ''}`}
        aria-describedby={open ? id : undefined}
      >
        {children}
      </div>
      <AnimatePresence>
        {open && detail && (
          <motion.span
            id={id}
            role="tooltip"
            className="pointer-events-none absolute left-1/2 z-30 block w-[300px] rounded-card border border-line bg-white px-3.5 py-3 text-left text-[12.5px] leading-snug shadow-float"
            style={{
              color: colors.body,
              marginLeft: dx,
              [side === 'top' ? 'bottom' : 'top']: 'calc(100% + 10px)',
              transformOrigin: side === 'top' ? 'bottom center' : 'top center',
            }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateX(-50%) scale(0.96)' }}
            animate={{ opacity: 1, transform: 'translateX(-50%) scale(1)' }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateX(-50%) scale(0.98)' }}
            transition={{ duration: 0.18, ease: c4(E.out) }}
          >
            <span
              className="mb-1 block font-heading text-[11px] font-bold uppercase tracking-wide"
              style={{ color: paint }}
            >
              {label}
            </span>
            {detail}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * A hover affordance the room can see without a pointer.
 *
 * Without it the detail is a secret only the person holding the mouse knows
 * exists, and a presenter who has forgotten which points have one will not go
 * looking.
 */
export function MoreDot({ paint, className = '' }: { paint: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={`fc-node__more h-1.5 w-1.5 rounded-full ${className}`}
      style={{ background: `${paint}66` }}
    />
  )
}

/** Input this lab cannot draw, said out loud rather than drawn badly. */
export function ProblemPanel({
  problems,
  width,
  height,
}: {
  problems: string[]
  width: number
  height: number
}) {
  return (
    <figure className="relative mx-auto" style={{ width, height }}>
      <div
        className="h-full w-full rounded-card bg-white px-6 py-5"
        style={{ border: `2px solid ${colors.danger}` }}
      >
        <span
          className="mb-3 block font-heading text-[13px] font-bold uppercase tracking-wide"
          style={{ color: colors.danger }}
        >
          This set cannot be stated as authored
        </span>
        <ul className="space-y-1.5">
          {problems.map((p) => (
            <li key={p} className="text-body-sm" style={{ color: colors.ink }}>
              {p}
            </li>
          ))}
        </ul>
      </div>
    </figure>
  )
}
