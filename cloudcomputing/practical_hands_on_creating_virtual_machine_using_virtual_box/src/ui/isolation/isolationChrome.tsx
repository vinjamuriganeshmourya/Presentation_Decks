import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { iconByName, type IconName } from '@/ui/icons'

/**
 * ONE LIGHT SOURCE FOR ALL FOUR CANDIDATES.
 *
 * `STYLE_GUIDE.md` section 9: every panel, tile and boundary in a figure carries
 * a light source, and it is the same one across the whole deck, top-left. A new
 * figure that ships flat is a bug and not a style choice, and session 4 shipped
 * three of them before that was written down.
 *
 * The four candidates differ in GEOMETRY, so they must not also differ in light,
 * or comparing them compares the wrong thing. Every surface in this family comes
 * from one of the three functions below.
 *
 * `#FFFFFF` and its alpha suffixes are the only literals here. The style guide
 * names that exception itself: a tint ABOVE the base colour has no token,
 * because the palette only ramps darker.
 */

/** A surface that is PRESENT: full recipe, all four parts. */
export function lit(accent: string): CSSProperties {
  return {
    borderColor: accent,
    background: [
      'radial-gradient(120% 100% at 14% 0%, #FFFFFF 0%, #FFFFFF00 62%)',
      `linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 46%, ${accent}14 100%)`,
    ].join(', '),
    boxShadow: [
      `0 3px 10px -4px ${accent}59`,
      'inset 0 1px 0 0 #FFFFFF',
      `inset 0 -1px 0 0 ${accent}2e`,
    ].join(', '),
  }
}

/**
 * A surface that is ABSENT: an empty frame.
 *
 * THE ONE DEVICE THIS FAMILY IS BUILT ON, and the reason it is not `opacity`.
 *
 * A filled card at 55% opacity reads as "this exists and does not matter". An
 * empty frame reads as "there is nothing here", which is the claim the slide
 * makes. So a ghost keeps a full-strength BORDER and full-strength TEXT and
 * loses its fill: it is a labelled hole, not a faded object.
 *
 * It keeps both hairlines and drops only the shadow, per the style guide's
 * "flatter means less light, never no light" — a frame with no light at all
 * reads as a second figure rather than as the far side of this one.
 */
export function ghost(): CSSProperties {
  return {
    borderColor: colors.line,
    borderStyle: 'dashed',
    /* A ground that is the SLIDE's own tint and not a surface of its own, so the
       frame reads as cut out of the slide rather than as a pale card on it. */
    background: `repeating-linear-gradient(135deg, #FFFFFF00 0px, #FFFFFF00 6px, ${colors.line}2e 6px, ${colors.line}2e 7px)`,
    boxShadow: ['inset 0 1px 0 0 #FFFFFFb3', `inset 0 -1px 0 0 ${colors.line}59`].join(', '),
  }
}

/** The boundary a machine draws around what it holds. Dashed, tinted, lit. */
export function boundary(accent: string): CSSProperties {
  return {
    borderColor: accent,
    background: [
      'radial-gradient(120% 90% at 12% 0%, #FFFFFF 0%, #FFFFFF00 58%)',
      `linear-gradient(135deg, ${colors.white} 0%, ${colors.surface} 54%, ${colors.surface2} 100%)`,
    ].join(', '),
    boxShadow: `0 8px 22px -12px ${colors.brandDeep}59, inset 0 1px 0 0 #FFFFFF`,
  }
}

/**
 * THE CUT. A hard bar with a cross on it, in `danger`.
 *
 * `danger` and not `muted`, and this is a deliberate reading of the style
 * guide's warning that red on a slide makes the room look for what broke. Here
 * something IS broken: `MachineBoundary` already prints `connection refused` in
 * this exact red for this exact event, so the deck has one word for it and this
 * is that word. A grey bar tested as "not connected yet", which is the wrong
 * claim on a slide whose point is that it never will be.
 */
export function SeveredMark({
  size = 18,
  className = '',
  style,
}: {
  size?: number
  className?: string
  style?: CSSProperties
}) {
  const s = size
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full ${className}`}
      style={{
        width: s + 10,
        height: s + 10,
        background: `radial-gradient(100% 100% at 30% 15%, #FFFFFF 0%, ${colors.danger}1f 100%)`,
        border: `2px solid ${colors.danger}`,
        boxShadow: `0 2px 7px -3px ${colors.danger}80, inset 0 1px 0 0 #FFFFFF`,
        ...style,
      }}
    >
      <svg width={s * 0.62} height={s * 0.62} viewBox="0 0 12 12" fill="none">
        <path
          d="M2 2 10 10M10 2 2 10"
          stroke={colors.danger}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}

/** A small label that names a zone without being read as content. */
export function ZoneTag({
  children,
  tone = colors.brand,
  className = '',
  style,
}: {
  children: ReactNode
  tone?: string
  className?: string
  style?: CSSProperties
}) {
  return (
    <span
      /* 16px, the type floor, and not the 11px this started at. A tag that names
         the zone the whole figure is about is not decoration. */
      className={`rounded-pill px-3 py-[5px] text-body-sm font-bold uppercase leading-none tracking-[0.08em] text-white ${className}`}
      style={{
        background: `linear-gradient(135deg, ${tone} 0%, ${tone} 46%, ${colors.brandDeep} 100%)`,
        boxShadow: `0 2px 6px -2px ${colors.brandDeep}66, inset 0 1px 0 0 #FFFFFF59`,
        ...style,
      }}
    >
      {children}
    </span>
  )
}

/** The icon well every present tile uses, so all four share one. */
export function IconWell({
  icon,
  tone,
  size = 30,
}: {
  icon?: IconName
  tone: string
  size?: number
}) {
  if (!icon) return null
  const Icon = iconByName[icon]
  return (
    <span
      className="grid shrink-0 place-items-center rounded-lg"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${tone}14 0%, ${tone}24 100%)`,
        color: tone,
        boxShadow: 'inset 0 1px 0 0 #FFFFFFb3',
      }}
    >
      <Icon width={size * 0.56} height={size * 0.56} />
    </span>
  )
}
