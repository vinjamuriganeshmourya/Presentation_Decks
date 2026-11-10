import type { ReactNode } from 'react'
import { Step } from '@/motion/Stepper'
import { colors } from '@/design/tokens'

/**
 * A stack of the layers an application sits on — bottom-up: OS, runtime,
 * framework, your code.
 *
 * The session returns to this figure three times, so the shape is one
 * component with a per-layer `state` rather than three drawings:
 *
 *   `ships`  the layer that actually travels with a `git push` (solid brand)
 *   `host`   re-supplied by whatever machine receives it (grey, dashed)
 *   `breaks` the layer where this particular machine fails (danger tint)
 *   `shared` borrowed rather than duplicated — the kernel (teal)
 *
 * Layers are listed **top-first** so the array reads the way the figure looks.
 * Each layer is a `Step`, so the stack builds under the deck's Stepper.
 */

export type LayerState = 'ships' | 'host' | 'breaks' | 'shared'

export interface Layer {
  label: ReactNode
  /** Small right-aligned annotation — the version, or what breaks here. */
  note?: ReactNode
  state?: LayerState
}

/**
 * `bg` may be any CSS background, so a state can carry a gradient.
 *
 * `ships` used to be one flat `colors.brand` fill with a border of the SAME blue,
 * which is a border that does no work: a solid rectangle of one hex, three of them
 * stacked, reading as a single blue slab rather than as three layers. It now has a
 * top-lit gradient, a darker edge that the fill can actually be seen against, and
 * `glow`, a shadow tinted with the brand rather than with neutral black.
 *
 * Every state carries the same treatment, at an amplitude that matches its job:
 * `ships` is the loudest because it is the layer the figure is about, `host` is the
 * flattest and takes no drop shadow at all because it is the layer someone else's
 * machine re-supplies. The ordering is the teaching, not decoration.
 */
const STATE: Record<
  LayerState,
  { bg: string; border: string; text: string; dashed?: boolean; glow?: string; lit?: boolean }
> = {
  ships: {
    /*
      TWO LAYERS, AND THE FIRST PASS AT THIS WAS TOO TIMID TO SEE.
      A `brand` to `brandDark` ramp across a 44px-tall box moves too few pixels to
      register at the back of a room, so at 3x zoom it still read as a flat slab.

      Bottom: a 135deg ramp that starts ABOVE `brand` and lands on `brandDark`, so
      the box travels a real distance from corner to corner.
      Top: a soft white radial parked at the top-left, which is what makes it read
      as a lit surface rather than as a two-tone fill.

      `#4C7AFD` is `brand` lifted about 12%. It is a literal because the palette has
      no tint above `brand` (`brand`, `brandDark`, `brandDeep` all go darker) and
      inventing a token for one figure would be the tail wagging the dog.
    */
    bg: [
      'radial-gradient(120% 100% at 14% 0%, #FFFFFF38 0%, #FFFFFF00 58%)',
      `linear-gradient(135deg, #4C7AFD 0%, ${colors.brand} 46%, ${colors.brandDark} 100%)`,
    ].join(', '),
    border: colors.brandDark,
    text: '#FFFFFF',
    /* A brand-tinted drop shadow, a white hairline along the top edge and a dark
       one along the bottom: the three things that give a box a thickness. */
    glow: [
      `0 3px 10px -3px ${colors.brandDeep}66`,
      'inset 0 1px 0 0 #FFFFFF59',
      `inset 0 -1px 0 0 ${colors.brandDeep}33`,
    ].join(', '),
    lit: true,
  },
  /*
    THE SAME LIGHT SOURCE ON EVERY STATE.

    Lighting only `ships` left the other three flat beside it, and a figure lit from
    two different places reads as two figures. Each state below is the identical
    structure at a gentler amplitude, because these are TINTS carrying dark text
    rather than solids carrying white: the ramp depth that reads as dimension on the
    blue would read as a stain here. Highlight down, shadow down, hairlines kept.
  */
  host: {
    bg: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 55%, #E4EAF2 100%)',
    border: colors.line,
    text: colors.body,
    dashed: true,
    /* No drop shadow on the dashed state. It is the layer that gets re-supplied by
       someone else's machine, so it should sit FLATTER than what travels. */
    glow: `inset 0 1px 0 0 #FFFFFF, inset 0 -1px 0 0 ${colors.brandDeep}14`,
  },
  breaks: {
    bg: [
      'radial-gradient(120% 100% at 14% 0%, #FFFFFF99 0%, #FFFFFF00 62%)',
      'linear-gradient(135deg, #FFF5F5 0%, #FEE2E2 52%, #FBCDCD 100%)',
    ].join(', '),
    border: colors.danger,
    text: '#991B1B',
    glow: [
      `0 3px 10px -4px ${colors.danger}59`,
      'inset 0 1px 0 0 #FFFFFFb3',
      `inset 0 -1px 0 0 ${colors.danger}2e`,
    ].join(', '),
  },
  shared: {
    bg: [
      'radial-gradient(120% 100% at 14% 0%, #FFFFFF99 0%, #FFFFFF00 62%)',
      'linear-gradient(135deg, #F0FDFB 0%, #E6FAF7 52%, #C9F2EC 100%)',
    ].join(', '),
    border: colors.teal,
    text: '#0E6B63',
    glow: [
      `0 3px 10px -4px ${colors.tealDark}4d`,
      'inset 0 1px 0 0 #FFFFFFb3',
      `inset 0 -1px 0 0 ${colors.tealDark}2e`,
    ].join(', '),
  },
}

export function LayerStack({
  title,
  caption,
  layers,
  width = 300,
  stepped = true,
  className = '',
}: {
  /** Label above the stack — the machine this stack belongs to. */
  title?: ReactNode
  /** One-line verdict under the stack. */
  caption?: ReactNode
  /** Top layer first. */
  layers: Layer[]
  width?: number
  /** False renders every layer immediately (side-by-side comparisons). */
  stepped?: boolean
  className?: string
}) {
  return (
    <div className={`flex flex-col items-center ${className}`} style={{ width }}>
      {title && (
        <p className="mb-2 font-heading text-base font-bold text-ink">{title}</p>
      )}
      <div className="flex w-full flex-col gap-1.5">
        {layers.map((l, i) => {
          const s = STATE[l.state ?? 'host']
          const box = (
            <div
              className="flex items-center justify-between gap-2 rounded-xl px-4 py-2.5"
              style={{
                background: s.bg,
                border: `2px ${s.dashed ? 'dashed' : 'solid'} ${s.border}`,
                color: s.text,
                boxShadow: s.glow,
                /* The label reads on a gradient the way it read on the flat fill,
                   which it stops doing at the dark end without this. */
                textShadow: s.lit ? `0 1px 1px ${colors.brandDeep}4d` : undefined,
              }}
            >
              <span className="text-body-sm font-semibold leading-tight">{l.label}</span>
              {l.note && (
                <span
                  className="shrink-0 font-mono text-xs"
                  /* A flat 0.8 opacity on white over a gradient goes muddy at the
                     bottom of the box. On a lit layer the note gets its own tint. */
                  style={s.lit ? { color: '#FFFFFFc7' } : { opacity: 0.8 }}
                >
                  {l.note}
                </span>
              )}
            </div>
          )
          return stepped ? (
            <Step dir="up" key={i}>
              {box}
            </Step>
          ) : (
            <div key={i}>{box}</div>
          )
        })}
      </div>
      {caption && (
        <p className="mt-2.5 text-center text-body-sm leading-snug text-body">{caption}</p>
      )}
    </div>
  )
}

/**
 * The gap the code has to cross. Sits between two `LayerStack`s and carries the
 * question the figure ends on.
 */
export function LayerGap({ label, className = '' }: { label?: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center px-3 ${className}`}>
      <svg width="52" height="26" viewBox="0 0 52 26" fill="none" aria-hidden>
        <path
          d="M2 13h44M38 6l8 7-8 7"
          stroke={colors.brand}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label && (
        <span className="mt-1 text-center text-xs font-semibold uppercase tracking-wider text-brand-600">
          {label}
        </span>
      )}
    </div>
  )
}
