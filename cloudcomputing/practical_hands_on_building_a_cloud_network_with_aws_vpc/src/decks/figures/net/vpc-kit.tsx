import type { CSSProperties, ReactNode } from 'react'
import { X } from 'lucide-react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Label, REDUCED, STILL } from '../scene'
import { fx } from './fx'
import { NET } from './frames'
import { vars } from './vpc-society'

/**
 * The VPC section's small shared pieces (round 2, FS review 2026-11-04). The
 * review asked for fewer, thinner dotted lines and nothing on a border, so the
 * boxes here are local: `Frame` draws a 1.5px rim (dashed only where it is a
 * VPC, the thing a dashed boundary means in this deck) with its label chip
 * INSIDE the box, never astride the rim; `Tint` is a borderless grouping (an
 * Availability Zone) that replaces a dashed box inside a dashed box.
 */

export const EASE = 'cubic-bezier(0.22,1,0.36,1)'

/**
 * THE CURRENT-PART RING IS BLUE here (round 3, 5.md rule 2: "no excessive orange"): orange stays for the one
 * thing a card highlights; a box that is merely the step's subject gets a soft brand ring.
 */
export const LIT_RING = `0 0 0 3px ${colors.brand}33, 0 10px 22px -12px ${colors.brand}`
export const LIT = colors.brand

/** A harness URL, reduced motion or a picker thumbnail: the build holds its complete frame and nothing is lit as current. */
export function useHeld() {
  const instant = useInstant()
  return STILL || REDUCED || instant
}

/** A plain horizontal line between two pieces. */
export function Line({ x, y, len, lit = false, tone = NET.boundary, thick = 2 }: { x: number; y: number; len: number; lit?: boolean; tone?: string; thick?: number }) {
  const instant = useInstant()
  return <span aria-hidden className="absolute rounded-full" style={{ left: x, top: y - thick / 2, width: len, height: thick, background: lit ? NET.lit : tone, transition: instant ? 'none' : `background 420ms ${EASE}` }} />
}

/** A small status light on a resource: it glows while the resource runs. */
export function Status({ x, y, tone = colors.success, delay = 0 }: { x: number; y: number; tone?: string; delay?: number }) {
  const f = fx('glow', delay, 1.6)
  return <span aria-hidden className={`absolute rounded-full ${f.className}`} style={{ ...f.style, left: x - 4, top: y - 4, width: 8, height: 8, background: tone, boxShadow: '0 0 0 2px #fff' }} />
}

/** A refused packet: it rides in, hits a rim and is turned back while an X pops over the rim (the analogy's CSS loops). */
export function Refused({ x, y, dx, dy, xAt }: { x: number; y: number; dx: number; dy: number; xAt: [number, number] }) {
  if (STILL) return null
  return (
    <>
      <span aria-hidden className="vpc-bump absolute rounded-full" style={{ ...vars({ bx: dx, by: dy }), left: x - 7, top: y - 7, width: 14, height: 14, background: colors.danger, boxShadow: '0 0 0 2.5px #fff, 0 6px 12px -6px rgba(16,32,58,0.6)', zIndex: 3 }} />
      <span aria-hidden className="vpc-deny absolute grid h-[22px] w-[22px] place-items-center rounded-full" style={{ left: xAt[0] - 11, top: xAt[1] - 11, background: colors.danger, color: colors.white, boxShadow: '0 0 0 2.5px #fff, 0 6px 12px -6px rgba(16,32,58,0.6)', zIndex: 3 }}>
        <X size={13} strokeWidth={3} />
      </span>
    </>
  )
}

/** A point's or a figure's icon that acts out its subject (a loop from `fx`). */
export function Act({ kind, delay = 0, dur, children }: { kind: string; delay?: number; dur?: number; children: ReactNode }) {
  const f = fx(kind, delay, dur)
  return (
    <span className={`grid place-items-center ${f.className}`} style={f.style}>
      {children}
    </span>
  )
}

/** A box with a 1.5px rim and its label chip inside its top-left corner; `dashed` only for a VPC. */
export function Frame({ w, h, label, labelIcon, dashed = false, tone = NET.boundary, lit = false, fill, children, style, extra }: { w?: number | string; h?: number | string; label?: ReactNode; labelIcon?: ReactNode; dashed?: boolean; tone?: string; lit?: boolean; fill?: string; children?: ReactNode; style?: CSSProperties; extra?: ReactNode }) {
  const instant = useInstant()
  return (
    <div
      className="relative"
      style={{
        width: w,
        height: h,
        borderRadius: 16,
        border: `1.5px ${dashed ? 'dashed' : 'solid'} ${lit ? colors.brand : tone}`,
        background: fill ?? `${tone}0A`,
        boxShadow: lit ? LIT_RING : 'none',
        transition: instant ? 'none' : `box-shadow 420ms ${EASE}, border-color 420ms ${EASE}`,
        ...style,
      }}
    >
      {(label !== undefined || extra) && (
        <div className="flex items-center justify-between gap-2" style={{ padding: '8px 8px 0 10px' }}>
          {label !== undefined ? (
            <Label size={14} strong tone={lit ? 'solid' : 'brand'} icon={labelIcon}>
              {label}
            </Label>
          ) : (
            <span />
          )}
          {extra}
        </div>
      )}
      {children}
    </div>
  )
}

/** A borderless grouping: a light tint and its label chip inside (an Availability Zone). */
export function Tint({ label, labelIcon, lit = false, children, style }: { label: ReactNode; labelIcon?: ReactNode; lit?: boolean; children?: ReactNode; style?: CSSProperties }) {
  const instant = useInstant()
  return (
    <div className="relative flex flex-col gap-2 rounded-[14px] p-2" style={{ background: lit ? 'rgba(45,99,251,0.14)' : 'rgba(45,99,251,0.07)', boxShadow: lit ? `inset 0 0 0 1.5px ${colors.brand}` : 'none', transition: instant ? 'none' : `background 420ms ${EASE}, box-shadow 420ms ${EASE}`, ...style }}>
      <div className="flex">
        <Label size={14} strong tone={lit ? 'solid' : 'plain'} icon={labelIcon}>
          {label}
        </Label>
      </div>
      {children}
    </div>
  )
}
