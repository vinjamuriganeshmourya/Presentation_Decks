/**
 * NxtWave Evolve — design tokens (TypeScript mirror).
 *
 * Tailwind owns the CSS side (see tailwind.config.ts). This file exposes
 * the same semantic values to TypeScript for places CSS can't reach:
 * inline SVG fills, Framer Motion configs, canvas math, etc.
 *
 * Keep this in sync with tailwind.config.ts.
 */

export const SLIDE_WIDTH = 1280
export const SLIDE_HEIGHT = 720
export const SLIDE_ASPECT = SLIDE_WIDTH / SLIDE_HEIGHT // 16:9

export const colors = {
  /* The style guide's blue. Mirrors `brand.500/600/900` in tailwind.config.ts,
     and is the same colour as nwBlue / nwDeep / nwNavy below: SVG paint and
     Tailwind classes have to land on one hue or figures drift off-palette. */
  brand: '#2D63FB',
  brandDark: '#0146C7',
  brandDeep: '#00254B',
  teal: '#12B5A8',
  tealDark: '#0E9285',
  accent: '#FF8A3D',
  accentDark: '#E5732A',
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#0EA5E9',
  ink: '#002A4B', // the updated template's navy: headings AND body on light slides (user, 2026-10-12; base template 2026-10-14)
  body: '#002A4B', // body text, the same navy
  /* COLOURS (Cloud Computing Fundamentals, user 2026-10-22, "washed out"): a darker muted ink and a bluer hairline, for contrast. Session-local kit change. */
  muted: '#6B7F95',
  line: '#CFDCF5',
  surface: '#F5F8FF',
  surface2: '#E8F0FF',
  white: '#FFFFFF',
  night: '#081026',
  night2: '#0C1A3A',
  night3: '#122554',
  /* NxtWave PPT style guide, page 01. See tailwind.config.ts. */
  nwNavy: '#00254B',
  nwBlue: '#2D63FB',
  nwDeep: '#0146C7',
  nwBlack: '#1C1C1C',
} as const

export type ColorToken = keyof typeof colors

/**
 * Accent color used by the slide-type category system.
 *
 * `nw` and `nwDeep` are the style guide's blues, and they are what every DARK
 * chrome slide uses. The chrome frames used to reach for `accent` (orange) and
 * `teal`, which is the whole reason the welcome frame and the section dividers
 * looked like they came from two different decks: orange and teal are Evolve
 * hues and there is no orange or teal anywhere in the NxtWave style guide.
 *
 * The Evolve tones below are still live on the LIGHT content slides. Do not
 * reach for them on a navy ground.
 */
export const accentByTone = {
  brand: colors.brand,
  teal: colors.teal,
  accent: colors.accent,
  success: colors.success,
  info: colors.info,
  /* style guide, page 01 */
  nw: colors.nwBlue,
  nwDeep: colors.nwDeep,
} as const

export type Tone = keyof typeof accentByTone

export const fonts = {
  /* The updated template's font sheet (user, 2026-10-12; the base template since 2026-10-14; content rule 34): see tailwind.config.ts. */
  heading: "'DM Sans', system-ui, sans-serif",
  body: "'DM Sans', system-ui, sans-serif",
  mono: "'Fira Code', ui-monospace, monospace",
  tplTitle: "'Sora', system-ui, sans-serif",
  tplBody: "'DM Sans', system-ui, sans-serif",
  term: "'Ubuntu Mono', ui-monospace, monospace",
} as const

/** Standard easing curves shared across all slide/element transitions. */
export const easing = {
  soft: [0.22, 1, 0.36, 1] as const, // easeOutExpo-ish, the house curve
  swift: [0.4, 0, 0.2, 1] as const,
  springy: [0.34, 1.56, 0.64, 1] as const, // slight overshoot
}
