import { colors } from '@/design/tokens'

/**
 * The lit-surface recipe of `STYLE_GUIDE.md` section 9, in one place, because
 * all four candidates draw the same two kinds of object: a small solid badge
 * carrying white type, and a pale caption card carrying dark type.
 *
 * "A new figure that ships flat is a bug, not a style choice." Four parts, always
 * in this order: a white radial highlight parked top-left, a 135deg ramp that
 * travels far enough to see, a drop shadow TINTED WITH THE SURFACE'S OWN COLOUR,
 * and two inset hairlines that give the box a thickness.
 *
 * NO HEX LITERALS except white with an alpha suffix. That is the one literal the
 * style guide accepts, and for the reason it gives: the palette only ramps
 * darker, so a highlight ABOVE the base colour has no token to come from, and
 * minting one for a figure's highlight is the tail wagging the dog.
 */

/** A ramp partner one step darker, for each accent this lab paints with. */
const DEEP: Record<string, string> = {
  [colors.brand]: colors.brandDark,
  [colors.brandDark]: colors.brandDeep,
  [colors.teal]: colors.tealDark,
  [colors.tealDark]: colors.brandDeep,
  [colors.brandDeep]: colors.night,
  [colors.muted]: colors.body,
}

function deepen(accent: string): string {
  return DEEP[accent] ?? colors.brandDeep
}

/** A solid badge: white type on the accent, lit from the top-left. */
export function litBadge(accent: string) {
  const deep = deepen(accent)
  return {
    background: [
      'radial-gradient(120% 100% at 14% 0%, #FFFFFF7a 0%, #FFFFFF00 62%)',
      `linear-gradient(135deg, ${accent} 0%, ${accent} 38%, ${deep} 100%)`,
    ].join(', '),
    boxShadow: [
      `0 3px 10px -4px ${accent}66`,
      'inset 0 1px 0 0 #FFFFFFb3',
      `inset 0 -1px 0 0 ${deep}`,
    ].join(', '),
    color: colors.white,
  }
}

/**
 * A caption card: dark type on a pale ground with the accent as a left rail.
 * A gentler ramp than `litBadge`, per the style guide's "amplitude follows the
 * job": a tint carrying dark text looks stained rather than lit if it ramps as
 * hard as a solid carrying white.
 */
export function litCard(accent: string) {
  return {
    background: [
      'radial-gradient(120% 160% at 8% 0%, #FFFFFFe6 0%, #FFFFFF00 64%)',
      `linear-gradient(135deg, ${accent}0f 0%, ${accent}17 52%, ${accent}22 100%)`,
    ].join(', '),
    boxShadow: [
      `0 3px 10px -5px ${accent}59`,
      `inset 3px 0 0 0 ${accent}`,
      'inset 0 1px 0 0 #FFFFFFcc',
      `inset 0 -1px 0 0 ${accent}2e`,
    ].join(', '),
  }
}

/** A rail or brace: the same object seen edge on, so it keeps the hairlines. */
export function litRail(accent: string) {
  const deep = deepen(accent)
  return {
    background: `linear-gradient(180deg, ${accent} 0%, ${deep} 100%)`,
    boxShadow: [`0 2px 6px -3px ${accent}80`, 'inset 1px 0 0 0 #FFFFFF80'].join(', '),
  }
}

/** `01`, `02`, `03` — the corpus's numbering, zero padded (PEDAGOGY section 5). */
export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

/**
 * The paint each role gets, and it is a claim rather than decoration.
 *
 * NO VERDICT COLOUR APPEARS HERE, AND THAT IS A HARD RULE, NOT A PREFERENCE.
 *
 * This deck's palette is semantic and the room has been trained on it all
 * session: `success` green means "works", `warning` amber means "careful",
 * `danger` red means "fails". `StatusList` is where that mapping is fixed.
 * `b7f7d2967507: Mounted from library/python` is none of those three. That layer
 * was not uploaded because the registry already holds it, which is the layer
 * system PAYING OFF, and painting it amber tells the room to be careful about
 * the best thing on the slide. That is a content-honesty bug (content rule 8),
 * not a palette choice. The first pass of this lab used amber and it was wrong.
 *
 * So every distinction here is drawn from NON-VERDICT tokens: the brand ramp and
 * the teal. Green, amber and red stay reserved for output that genuinely means
 * works, careful and fails, which is what `Terminal`'s own `ok` and `err` kinds
 * are already for.
 *
 * COLOUR IS NEVER THE ONLY DISTINCTION. Every marked thing in every candidate
 * also carries a word or a number: `StatusList` pairs each verdict with both an
 * icon and a word, and the slide-types registry records that numbered callouts
 * exist "so the pairing survives a projector and greyscale". These meet the same
 * bar.
 */
export const PAINT = {
  member: colors.brand,
  exception: colors.teal,
  single: colors.brandDeep,
} as const

/**
 * The two tones a box may take, as NAMES rather than colours, so a caller
 * cannot pass an arbitrary hex and cannot reach a verdict hue at all.
 *
 * `primary` is the group being claimed. `secondary` is a second group in the
 * same panel, and it exists because the reviewer asked for it: *"use different
 * colors if multiple highlight in a single."* Two boxes of one hue in one panel
 * cannot be told apart at the back of a room.
 */
export const BOX_TONE = {
  primary: colors.brand,
  secondary: colors.teal,
} as const

export type BoxTone = keyof typeof BOX_TONE
