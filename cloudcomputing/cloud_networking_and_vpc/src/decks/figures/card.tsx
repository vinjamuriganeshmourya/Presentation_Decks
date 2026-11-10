import type { CSSProperties } from 'react'
import { colors } from '@/design/tokens'

/**
 * THE CARD SKIN (user, 2026-10-16: "no plain backgrounds for the card", from
 * the reference render "Cloud Computing: From Guesswork to Scale"). A raised
 * stage is a plate lying on the slide: white at its crown, pale blue at its
 * foot, a soft white bloom in its upper left, a low pale-blue hill with a
 * blurred edge sweeping across its lower third (the render's left card) and
 * a fainter second hill behind it, a 1px white highlight along its top edge,
 * a thin inset rim, 24px corners, and a blue-tinted shadow in three layers
 * (a long diffuse one, a close one, a hairline of ambient contact).
 *
 * It is CSS on the Group itself, not a layer in the DOM: `entrance.ts` gives
 * every svg and every drawn box its own entrance, so a decoration element
 * would rise in on its own, after the card. As backgrounds, the skin and the
 * card are one unit and arrive together. The rim is inset (content rule 43),
 * so `overlap-check` reads the card as a container, not a highlight. The
 * hill is at most 26% brand at the card's foot and under 7% where the head
 * text sits, so nothing on the card loses contrast.
 *
 * Lab: three variants were built side by side (a radial haze, one blurred
 * hill, two hills with a diagonal sheen) and the blurred hill matched the
 * render; the second hill is kept faint for depth, the sheen was dropped as
 * a visible band the render does not have.
 */

const HILL_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 540 300' preserveAspectRatio='none'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${colors.brand}' stop-opacity='0.10'/><stop offset='1' stop-color='${colors.brand}' stop-opacity='0.34'/></linearGradient><linearGradient id='h' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${colors.brand}' stop-opacity='0.05'/><stop offset='1' stop-color='${colors.brand}' stop-opacity='0.13'/></linearGradient><filter id='f' x='-10%' y='-30%' width='120%' height='160%'><feGaussianBlur stdDeviation='7'/></filter></defs><path d='M-20 320 V182 C 120 146 230 156 330 204 C 420 248 480 234 560 218 V320 Z' fill='url(%23h)' filter='url(%23f)'/><path d='M-20 320 V210 C 80 170 160 186 236 226 C 310 266 420 232 560 246 V320 Z' fill='url(%23g)' filter='url(%23f)'/></svg>`

const HILL_URL = `url("data:image/svg+xml;utf8,${encodeURIComponent(HILL_SVG)}")`

/** The raised card's surface and shadow, spread onto the Group's style. */
export const CARD_SKIN: CSSProperties = {
  borderRadius: 24,
  background: [
    'radial-gradient(ellipse 60% 55% at 26% 16%, rgba(255,255,255,0.95), rgba(255,255,255,0) 70%)',
    `${HILL_URL} center / 100% 100% no-repeat`,
    'linear-gradient(180deg, #FFFFFF 0%, #F3F7FD 55%, #E7EEFB 100%)',
  ].join(', '),
  boxShadow: [
    'inset 0 0 0 1px #CFDCF5',
    `inset 0 1px 0 ${colors.white}`,
    '0 24px 48px -24px rgba(31,64,140,0.44)',
    '0 8px 18px -10px rgba(31,64,140,0.20)',
    '0 2px 6px rgba(31,64,140,0.06)',
  ].join(', '),
}

/**
 * THE TILE (user, 2026-10-16, "same style for all"): the row boxes and inner
 * tiles that sit beside or inside a card take the card's finish without its
 * hill: the same white-to-pale-blue base, inset rim, white top highlight and
 * a shorter shadow, so a slide of rows reads as a stack of the same plates.
 */
export const TILE_SKIN: CSSProperties = {
  background: 'linear-gradient(180deg, #FFFFFF 0%, #ECF2FD 100%)',
  boxShadow: 'inset 0 0 0 1px #CFDCF5, inset 0 1px 0 #FFFFFF, 0 12px 24px -16px rgba(31,64,140,0.34), 0 2px 6px rgba(31,64,140,0.06)',
}
