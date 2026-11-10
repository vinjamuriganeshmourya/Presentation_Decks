/* The hair catalogue, in the flat vector style of reference/arjun.png and
 * reference/riya.png: every style is a solid mass in the hair colour, one
 * shade shape a step darker where the mass turns under or away, and one
 * sheen shape a step lighter where the reference paints a highlight. No
 * gradients, no strand strokes, no filters: flat shapes read as the
 * reference does at 120 px on a slide and at 1080 px in a reel, and the
 * renderer keeps the old lit look behind skin.shading === 'lit' on its own.
 *
 * Head-local space, the NEW skull: centre at the origin, rx 50 ry 56, so the
 * crown is y=-56 and the chin y=56; ears at (+-50, 2), brows at y=-18, eyes
 * at (+-20, -2). A quiff or a bun rises to about y=-84. Every front piece
 * leaves the forehead and the eyes clear: no hairline below y=-34.
 *
 * hairBack is drawn behind the skull, hairFront over the forehead. Long hair
 * (bun, long, wavy) falls behind both shoulders as hairBack, so it reaches
 * body space (y > 56, down to the waist at about y=230); a braid or a
 * ponytail hangs over the viewer's right shoulder. Both still live inside
 * the head group, so they turn with the head. */
import type { ReactNode } from 'react'
import type { HairStyle } from '../skins/config'
import type { Palette } from '../skins/types'

type Draw = (p: Palette) => ReactNode

/* `clay` picks the Library drawing where a style has one (CLAY_BACK and
   CLAY_FRONT, at the bottom of this file); the renderer's clay filter turns
   it, so a clay drawing is mass plus sculpted grooves, with no flat sheen. */
export function hairBack(style: HairStyle, p: Palette, clay = false): ReactNode | null {
  const draw = (clay && CLAY_BACK[style]) || BACK[style]
  return draw ? draw(p) : null
}

export function hairFront(style: HairStyle, p: Palette, clay = false): ReactNode | null {
  const draw = (clay && CLAY_FRONT[style]) || FRONT[style]
  return draw ? draw(p) : null
}

/* The band on Riya's bun is the blouse colour in the reference: the palette's
 * accent, with the reference hex behind it for a palette built without one. */
const accent = (p: Palette) => p.accent || '#5B6EE1'

/* The three marks every style is built from: the mass, its shade, its sheen. */
const mass = (p: Palette, d: string, opacity = 1) => <path d={d} fill={p.hair} opacity={opacity} />
const shade = (p: Palette, d: string) => <path d={d} fill={p.hairShade} />
const sheen = (p: Palette, d: string) => <path d={d} fill={p.hairLight} />

const BACK: Record<HairStyle, Draw | null> = {
  short: cap,
  sidePart: cap,
  quiff: quiffBack,
  curly: curlyBack,
  buzz: null,
  braid: braidBack,
  ponytail: ponytailBack,
  bob: bobBack,
  long: longBack,
  bun: bunBack,
  wavy: wavyBack,
}

const FRONT: Record<HairStyle, Draw | null> = {
  short: shortFront,
  sidePart: sidePartFront,
  quiff: quiffFront,
  curly: curlyFront,
  buzz: buzzFront,
  braid: braidFront,
  ponytail: ponytailFront,
  bob: bobFront,
  long: longFront,
  bun: bunFront,
  wavy: wavyFront,
}

/* ---- the two presets ---------------------------------------------------- */

/* Arjun's quiff. One near-black mass: from a shallow-curve hairline on the
 * forehead it sweeps up over the viewer's left, crests at about y=-88, and
 * runs back to three soft points at the top back right. Short over the ears,
 * a sideburn in front of each. The sheen is the one lighter patch the
 * reference paints on the swept front; the shade is the underside of the
 * points, which on #151515 is almost invisible, as in the reference. */
function quiffFront(p: Palette) {
  return (
    <>
      {mass(
        p,
        'M-43 12 C-49 2 -51 -8 -52 -18 C-64 -36 -68 -64 -52 -80 C-42 -90 -24 -92 -10 -90 ' +
          'C8 -90 26 -90 40 -86 C44 -86 48 -88 50 -90 C48 -84 46 -80 46 -78 C52 -78 60 -76 64 -72 ' +
          'C60 -68 56 -64 56 -62 C62 -60 68 -56 68 -50 C64 -42 60 -34 58 -26 C57 -20 54 -12 50 -10 ' +
          'C48 -8 46 -4 44 8 C46 0 46 -8 46 -16 C44 -26 43 -34 36 -40 C28 -45 12 -47 0 -47 ' +
          'C-12 -47 -28 -45 -36 -40 C-43 -34 -45 -26 -45 -18 C-46 -8 -45 0 -43 12 Z',
      )}
      {sheen(p, 'M-58 -38 C-58 -66 -40 -84 -10 -88 C0 -89 8 -87 10 -84 C-14 -80 -34 -68 -42 -44 C-45 -34 -56 -30 -58 -38 Z')}
      {shade(p, 'M50 -90 C60 -78 68 -64 68 -50 C60 -60 52 -70 36 -80 Z')}
    </>
  )
}

/* A tight cap behind the skull: the rim of hair that shows behind the ears
 * and keeps the crown dark when a turn slides the front piece sideways. */
function quiffBack(p: Palette) {
  return mass(p, 'M-52 12 C-58 -24 -46 -64 0 -64 C46 -64 58 -24 52 12 Z')
}

/* Riya's bun. The cap sits close to the skull with a parting right of
 * centre; two strands fall in front of the left ear and one in front of the
 * right. No sheen: the reference paints her hair as one flat navy mass. */
function bunFront(p: Palette) {
  return (
    <>
      {mass(
        p,
        'M-44 22 C-50 10 -52 -4 -52 -20 C-56 -40 -46 -62 -12 -63 C16 -65 40 -58 50 -40 C54 -28 54 -16 50 -8 ' +
          'C48 2 46 10 44 16 C45 6 45 -4 46 -16 C46 -26 42 -36 34 -40 C26 -42 20 -42 16 -40 L14 -36 ' +
          'C10 -43 -4 -46 -16 -44 C-30 -42 -40 -36 -44 -26 C-46 -16 -46 -6 -45 2 C-45 10 -44 16 -44 22 Z',
      )}
      {/* the parting: a sliver of scalp from the hairline up toward the bun */}
      <path d="M14 -36 C15 -42 17 -48 20 -52 C18 -47 17 -41 16 -36 Z" fill={p.skinShade} />
      {/* the strands in front of the ears */}
      {mass(p, 'M-46 -14 C-50 -2 -50 12 -45 28 C-43 14 -43 0 -45 -14 Z M-42 -4 C-45 6 -44 12 -41 20 C-40 12 -40 4 -42 -4 Z M46 -12 C50 -2 50 8 45 22 C44 10 44 0 46 -12 Z')}
      {shade(p, 'M34 -40 C42 -36 46 -26 46 -16 C46 -4 46 6 44 16 C47 4 49 -8 48 -22 C47 -32 42 -40 34 -40 Z')}
    </>
  )
}

/* Behind: a dome a few px proud of the skull, the fall behind both
 * shoulders in one smooth wave that drifts to the viewer's right and ends at
 * the waist (y about 230), and the bun high at the back with its band. */
function bunBack(p: Palette) {
  return (
    <>
      {mass(
        p,
        'M-53 10 C-58 -30 -42 -64 0 -64 C42 -64 58 -30 53 10 ' +
          'C62 30 72 40 76 70 C80 100 84 130 92 160 C100 182 112 196 106 216 C100 232 80 240 58 236 ' +
          'C30 232 10 220 -10 190 C-30 160 -44 130 -48 90 C-54 60 -56 30 -53 10 Z',
      )}
      {/* the bun, its base tucked behind the cap */}
      <circle cx="16" cy="-74" r="21" fill={p.hair} />
      {shade(p, 'M28 -58 C38 -63 40 -78 33 -90 C42 -82 42 -64 28 -58 Z')}
      <path d="M10.4 -54 A21.5 21.5 0 0 1 -5.4 -75.9 L1.6 -74.7 A14.5 14.5 0 0 0 12 -60 Z" fill={accent(p)} />
    </>
  )
}

/* ---- short styles, read as male by default ---------------------------- */

/* The cap behind every short style: about 8 px proud of the skull so a rim
 * of hair shows past the face. Only that rim is ever visible. */
const CAP = 'M-52 14 C-62 -19 -53 -56 -25 -70 C-10 -76 12 -76 27 -70 C55 -56 63 -19 52 14 Z'
const CAP_SHADE = 'M27 -70 C55 -56 63 -19 52 14 L46 14 C55 -20 48 -49 25 -63 Z'

/* The shade down the right of a front piece: the side of the head away from
 * the lamp, which the flat style keeps as one darker shape. */
const RIGHT_SHADE = 'M25 -64 C48 -53 55 -22 48 10 L42 10 C47 -20 42 -44 22 -58 Z'

function cap(p: Palette) {
  return (
    <>
      {mass(p, CAP)}
      {shade(p, CAP_SHADE)}
    </>
  )
}

/* Short: the hairline sits 16 px above the brows, combed up and back. */
function shortFront(p: Palette) {
  return (
    <>
      {mass(p, 'M-48 12 C-57 -19 -48 -53 -23 -64 C-8 -70 10 -70 25 -64 C50 -53 57 -19 48 12 L42 12 C42 -3 43 -19 38 -31 C33 -37 20 -41 3 -41 C-15 -41 -32 -37 -38 -29 C-43 -19 -42 -3 -42 12 Z')}
      {sheen(p, 'M-36 -46 C-24 -60 -4 -67 18 -63 C0 -62 -18 -56 -30 -44 Z')}
      {shade(p, RIGHT_SHADE)}
    </>
  )
}

/* Side part: parted left of centre, the larger side swept right across the
 * forehead. The shade is the pocket right of the part plus the far side. */
function sidePartFront(p: Palette) {
  return (
    <>
      {mass(p, 'M-48 12 C-57 -19 -48 -53 -23 -64 C-8 -70 10 -70 25 -64 C50 -53 57 -19 48 12 L42 12 C43 -5 42 -20 33 -27 C22 -34 2 -37 -13 -37 C-28 -36 -38 -31 -40 -20 C-42 -8 -42 2 -42 12 Z')}
      {sheen(p, 'M-6 -59 C10 -62 28 -56 40 -44 C28 -52 12 -56 -4 -54 Z')}
      {shade(p, `M-13 -37 C-7 -48 2 -54 12 -56 C3 -49 -5 -42 -8 -36 Z ${RIGHT_SHADE}`)}
    </>
  )
}

/* Curly: a cap with curls sitting on it. Each curl is a circle in the mass;
 * the sheen is one path of crescents on the upper-left curls, the shade one
 * path of crescents on the lower-right ones. */
const CURLS_BACK: [number, number, number][] = [
  [-57, -2, 13], [-53, -27, 13], [-40, -51, 13], [-20, -68, 13], [3, -75, 13], [27, -68, 13], [45, -49, 13], [55, -25, 13], [57, 2, 13],
]
const CURLS_FRONT: [number, number, number][] = [
  [-42, -12, 8], [-35, -31, 9], [-20, -39, 9], [-2, -42, 9], [17, -40, 9], [32, -32, 8], [42, -19, 8],
  [-30, -56, 10], [-8, -64, 10], [13, -63, 10], [32, -53, 9],
]
/* A crescent on a circle: the arc between two angles, bowed toward the centre. */
function crescent(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const pt = (rad: number, a: number) => `${(cx + rad * Math.cos(a)).toFixed(1)} ${(cy + rad * Math.sin(a)).toFixed(1)}`
  return `M${pt(r, a0)} A${r} ${r} 0 0 1 ${pt(r, a1)} A${r * 0.9} ${r * 0.9} 0 0 0 ${pt(r, a0)} Z`
}
const curls = (p: Palette, cs: [number, number, number][]) => (
  <>
    {cs.map(([x, y, r], i) => (
      <circle key={i} cx={x} cy={y} r={r} fill={p.hair} />
    ))}
  </>
)

function curlyBack(p: Palette) {
  return (
    <>
      {mass(p, 'M-55 17 C-67 -17 -58 -59 -25 -73 C-8 -80 12 -80 28 -73 C63 -59 68 -17 55 17 Z')}
      {curls(p, CURLS_BACK)}
      {shade(p, CURLS_BACK.slice(5).map(([x, y, r]) => crescent(x, y, r * 0.86, -0.3, 1.2)).join(' '))}
    </>
  )
}

function curlyFront(p: Palette) {
  return (
    <>
      {mass(p, 'M-47 10 C-55 -20 -47 -54 -22 -66 C-7 -73 10 -73 25 -66 C50 -54 55 -20 47 10 L42 10 C42 -5 42 -20 37 -32 C27 -42 7 -48 -3 -48 C-18 -48 -33 -42 -38 -31 C-42 -20 -42 -5 -42 10 Z')}
      {curls(p, CURLS_FRONT)}
      {sheen(p, CURLS_FRONT.slice(7, 10).map(([x, y, r]) => crescent(x, y, r * 0.8, 3.4, 4.9)).join(' '))}
      {shade(p, CURLS_FRONT.slice(4, 7).map(([x, y, r]) => crescent(x, y, r * 0.86, -0.3, 1.2)).join(' '))}
    </>
  )
}

/* Buzz: hair so short the scalp shows through, so the cap is translucent.
 * No back piece: nothing stands proud of the skull. */
function buzzFront(p: Palette) {
  return (
    <>
      {mass(p, 'M-47 8 C-53 -20 -47 -49 -22 -59 C-7 -64 8 -64 22 -59 C48 -49 55 -20 47 8 L42 8 C42 -7 42 -20 37 -31 C27 -39 7 -42 -2 -42 C-17 -42 -30 -39 -37 -31 C-42 -20 -42 -7 -42 8 Z', 0.86)}
      {sheen(p, 'M-30 -42 C-20 -54 -2 -60 16 -56 C0 -56 -14 -50 -24 -40 Z')}
      {shade(p, 'M22 -59 C47 -49 54 -20 47 6 L42 6 C45 -20 40 -42 18 -54 Z')}
    </>
  )
}

/* ---- long styles, read as female by default --------------------------- */

/* The dome behind every long style: proud of the crown, falling straight
 * past the ears to just below the chin where the shoulders hide it. */
const DOME = 'M-53 17 C-65 -20 -55 -61 -25 -73 C-8 -80 12 -80 28 -73 C60 -61 67 -20 55 17'
const DOME_SHEEN = 'M-44 -34 C-38 -56 -18 -72 8 -74 C-12 -70 -30 -56 -38 -34 Z'

/* Braid: the hair gathers behind the right ear and the plait hangs over the
 * viewer's right shoulder to the chest. Each segment is two lobes, one from
 * each side; the shade is one path of crescents under the right lobes, so
 * the plait reads as interlocking strands without a single stroke. */
function braidBack(p: Palette) {
  const lobes: string[] = []
  const shades: string[] = []
  for (let i = 0; i < 7; i++) {
    const y = 60 + i * 15
    const cx = 36 + i * 0.4
    const w = 19 - i
    lobes.push(`M${cx} ${y} C${cx - w * 0.8} ${y + 3} ${cx - w * 0.8} ${y + 15} ${cx} ${y + 18} C${cx - w * 0.15} ${y + 13} ${cx - w * 0.15} ${y + 5} ${cx} ${y} Z`)
    lobes.push(`M${cx} ${y + 7} C${cx + w * 0.8} ${y + 11} ${cx + w * 0.8} ${y + 23} ${cx} ${y + 26} C${cx + w * 0.15} ${y + 21} ${cx + w * 0.15} ${y + 12} ${cx} ${y + 7} Z`)
    shades.push(`M${cx} ${y + 20} C${cx + w * 0.5} ${y + 22} ${cx + w * 0.6} ${y + 18} ${cx + w * 0.62} ${y + 14} C${cx + w * 0.5} ${y + 25} ${cx + w * 0.2} ${y + 26} ${cx} ${y + 26} Z`)
  }
  return (
    <>
      {mass(p, `${DOME} C57 37 55 54 53 68 L-52 68 C-55 54 -55 37 -53 17 Z`)}
      {sheen(p, DOME_SHEEN)}
      {/* the gather behind the ear, the plait, the tie and the tassel */}
      {mass(p, 'M22 32 C35 34 45 46 45 61 L28 66 C27 51 25 41 18 36 Z M26 59 C31 56 41 56 46 59 L46 66 C41 63 31 63 26 66 Z')}
      {mass(p, lobes.join(' '))}
      <ellipse cx="38.5" cy="167" rx="6" ry="3" fill={p.hairShade} />
      {mass(p, 'M34 169 C31 177 32 185 37 192 C39 185 40 180 39 173 C40 180 43 185 45 190 C46 182 45 175 43 169 Z')}
      {shade(p, shades.join(' '))}
    </>
  )
}

/* Riya's old fringe, re-fitted: a curtain that clears the brows by 24 px at
 * the centre and falls to the ears at the sides. */
function braidFront(p: Palette) {
  return (
    <>
      {mass(p, 'M-47 -7 C-50 -51 -25 -71 0 -71 C28 -71 53 -51 50 -4 C42 -31 25 -42 2 -42 C-22 -42 -38 -31 -47 -7 Z')}
      {sheen(p, 'M-34 -42 C-20 -58 4 -64 26 -56 C6 -58 -14 -54 -28 -40 Z')}
      {shade(p, 'M28 -68 C48 -58 53 -33 50 -4 L43 -7 C45 -30 42 -50 23 -62 Z')}
    </>
  )
}

/* Ponytail: the tail leaves the back of the head on the right, swings out
 * past the jaw and falls over the shoulder, splitting into tips. */
function ponytailBack(p: Palette) {
  return (
    <>
      {mass(p, CAP)}
      {shade(p, CAP_SHADE)}
      {mass(p, 'M7 -2 C23 7 38 19 43 39 C50 76 48 119 45 161 L42 180 L37 166 L33 176 L30 163 C27 119 28 81 23 48 C20 27 15 12 5 2 Z')}
      {sheen(p, 'M20 2 C30 10 38 24 42 44 C36 28 28 14 16 6 Z')}
    </>
  )
}

/* Pulled back tight: a smooth cap with the hairline 14 px above the brows. */
function ponytailFront(p: Palette) {
  return (
    <>
      {mass(p, 'M-47 8 C-55 -19 -48 -53 -23 -64 C-8 -70 10 -70 25 -64 C50 -53 55 -19 47 8 L42 8 C42 -7 42 -19 37 -29 C28 -37 8 -41 -3 -41 C-17 -41 -32 -37 -37 -29 C-42 -19 -42 -7 -42 8 Z')}
      {sheen(p, 'M-30 -44 C-16 -60 6 -68 26 -62 C8 -62 -10 -56 -24 -42 Z')}
      {shade(p, RIGHT_SHADE)}
    </>
  )
}

/* Bob: the mass behind is wider than the head and curls under at the jaw.
 * The front is a blunt fringe plus two curtains over the ears. */
function bobBack(p: Palette) {
  return (
    <>
      {mass(p, 'M-58 0 C-67 -25 -55 -61 -25 -73 C-8 -80 12 -80 28 -73 C60 -61 70 -25 60 0 C65 25 63 51 55 66 C45 73 30 71 18 68 L-17 68 C-30 71 -45 73 -55 66 C-63 51 -65 25 -58 0 Z')}
      {sheen(p, DOME_SHEEN)}
      {shade(p, 'M28 -73 C60 -61 70 -25 60 0 C65 25 63 51 55 66 L47 64 C55 48 57 25 52 0 C48 -25 44 -52 27 -64 Z')}
    </>
  )
}

function bobFront(p: Palette) {
  return (
    <>
      {mass(p, 'M-43 -8 C-48 -34 -37 -59 -12 -66 C5 -71 25 -68 37 -59 C48 -49 50 -31 45 -10 L42 -12 C43 -25 38 -34 30 -36 C12 -39 -13 -39 -30 -34 C-38 -31 -42 -22 -40 -10 Z')}
      {mass(p, 'M-42 -14 C-52 -3 -60 20 -58 42 C-57 56 -50 66 -40 70 C-35 64 -33 58 -35 51 C-38 34 -38 17 -38 -8 Z M42 -15 C52 -5 60 19 58 41 C57 56 50 66 40 70 C35 64 33 58 35 51 C38 34 38 17 38 -10 Z')}
      {sheen(p, 'M-26 -52 C-10 -62 10 -62 30 -54 C12 -58 -8 -58 -22 -48 Z')}
      {shade(p, 'M42 -15 C52 -5 60 19 58 41 C57 56 50 66 40 70 C42 60 45 47 47 37 C48 17 47 0 42 -15 Z M37 -59 C48 -49 50 -31 45 -10 L42 -12 C43 -25 42 -42 33 -52 Z')}
    </>
  )
}

/* Long: falls behind both shoulders to the chest, ending in tips. */
function longBack(p: Palette) {
  return (
    <>
      {mass(p, 'M-53 -8 C-63 -34 -53 -63 -25 -73 C-8 -80 12 -80 28 -73 C58 -63 67 -34 55 -8 C62 34 70 93 72 144 C72 161 68 173 63 180 L55 170 L50 182 L43 168 L37 178 C25 175 -25 175 -37 178 L-43 168 L-50 182 L-55 170 L-63 180 C-68 173 -72 161 -72 144 C-70 93 -63 34 -53 -8 Z')}
      {sheen(p, DOME_SHEEN)}
      {shade(p, 'M55 -8 C62 34 70 93 72 144 L65 147 C65 102 58 42 50 -3 Z')}
    </>
  )
}

/* Centre parted, just off centre, each side sweeping past the ear to the jaw. */
function longFront(p: Palette) {
  return (
    <>
      {mass(p, 'M2 -71 C-25 -71 -48 -54 -52 -25 C-55 8 -55 37 -48 66 C-42 70 -37 66 -35 59 C-37 34 -38 8 -37 -17 C-33 -34 -20 -48 2 -53 Z M2 -71 C28 -71 52 -54 53 -25 C57 8 55 37 48 66 C42 70 37 66 35 59 C37 34 38 8 37 -17 C33 -34 22 -49 2 -53 Z')}
      {/* the parting, where the scalp shows */}
      <path d="M2 -71 C0 -65 0 -59 2 -53 C3 -59 3 -65 2 -71 Z" fill={p.skinShade} />
      {sheen(p, 'M-30 -58 C-18 -66 -8 -68 -1 -68 C-8 -64 -18 -60 -26 -52 Z M8 -68 C20 -66 34 -58 42 -44 C32 -54 20 -62 8 -64 Z')}
      {shade(p, 'M37 -17 C38 17 37 42 35 59 L42 62 C45 37 45 8 43 -20 Z')}
    </>
  )
}

/* Wavy: the mass behind falls to the chest with an S-curve down each edge;
 * the front is a side-swept fringe and two waved locks over the ears. */
function wavyBack(p: Palette) {
  return (
    <>
      {mass(p, 'M-53 -8 C-63 -34 -53 -63 -25 -73 C-8 -80 12 -80 28 -73 C58 -63 67 -34 55 -8 C63 17 55 42 63 68 C72 93 58 119 65 144 C67 156 62 166 55 168 C52 161 47 163 43 158 C38 161 35 154 30 151 L-30 151 C-35 154 -38 161 -43 158 C-47 163 -52 161 -55 168 C-62 166 -67 156 -65 144 C-58 119 -72 93 -63 68 C-55 42 -63 17 -53 -8 Z')}
      {sheen(p, DOME_SHEEN)}
      {shade(p, 'M55 -8 C63 17 55 42 63 68 C72 93 58 119 65 144 L57 146 C53 119 63 93 55 69 C48 46 55 17 48 -5 Z')}
    </>
  )
}

function wavyFront(p: Palette) {
  return (
    <>
      {mass(p, 'M-45 -12 C-52 -34 -42 -58 -18 -66 C2 -73 25 -70 37 -59 C50 -49 52 -31 45 -14 L40 -15 C42 -24 38 -29 32 -31 C22 -36 8 -31 0 -34 C-8 -37 -13 -39 -18 -37 C-27 -36 -33 -31 -37 -22 C-38 -17 -40 -14 -40 -10 Z')}
      {mass(p, 'M-42 -15 C-50 0 -58 17 -53 37 C-50 51 -58 61 -50 71 C-43 73 -37 66 -37 56 C-38 37 -35 17 -38 -3 Z M42 -17 C50 -3 58 12 52 31 C47 46 58 56 52 71 C45 75 38 68 37 58 C37 41 33 19 38 -5 Z')}
      {sheen(p, 'M-12 -60 C6 -64 24 -58 36 -46 C24 -54 8 -58 -8 -56 Z')}
      {shade(p, 'M42 -17 C50 -3 58 12 52 31 C47 46 58 56 52 71 C48 60 45 50 45 38 C47 20 45 0 42 -17 Z M37 -59 C50 -49 52 -31 45 -14 L40 -15 C43 -30 42 -43 33 -52 Z')}
    </>
  )
}

/* ---- the Library look ---------------------------------------------------- */

/* Library hair is sculpted, not painted: big soft clumps, each a rounded
 * ridge with a groove between it and the next, swept in one direction, with
 * a gloss on the ridges facing the lamp (the gloss comes from the clay
 * filter's sheen). Drawn here as the mass, the grooves as soft strokes a
 * step darker, and the ridge tops as strokes a step lighter just above them.
 * The references: Wondering man, M and Please Stop for the pompadour;
 * Female Teacher Icon, Woman Pointing-1 and Woman Pointing wirh tab for the bun. */
const groove = (p: Palette, d: string, w = 3.2) => <path d={d} fill="none" stroke={p.hairShade} strokeWidth={w} strokeLinecap="round" opacity="0.6" />
const ridge = (p: Palette, d: string, w = 3) => <path d={d} fill="none" stroke={p.hairLight} strokeWidth={w} strokeLinecap="round" opacity="0.32" />

const CLAY_BACK: Partial<Record<HairStyle, Draw>> = { quiff: clayQuiffBack, bun: clayBunBack, curly: clayCurlyBack, short: clayShortBack, sidePart: clayShortBack }
const CLAY_FRONT: Partial<Record<HairStyle, Draw>> = { quiff: clayQuiffFront, bun: clayBunFront, curly: clayCurlyFront, short: clayShortFront, sidePart: claySidePartFront }

/* The pompadour of the white-shirt teacher: a full rounded mass wider than
 * the skull, rising from a low soft hairline into one big roll that sweeps
 * up from the viewer's left and back over to the right. Thick at the sides,
 * covering the top of the ear, with a short sideburn. No points anywhere. */
function clayQuiffFront(p: Palette) {
  return (
    <>
      {/* The loaf: as tall above the brows as the face is below them (on
          Wondering man the hair is 85 px tall to the face's 80). Widest at
          the temples, 12 px proud of the skull each side, narrowing to a
          rounded peak that leans to the viewer's right, because the roll
          sweeps up from the left temple. The hairline arches over the
          forehead and comes down over the temples to the top of the ear,
          ending in a short sideburn. */}
      {mass(
        p,
        'M-57 -2 C-63 -18 -63 -38 -60 -50 C-56 -72 -46 -86 -30 -92 C-14 -100 6 -100 22 -96 ' +
          'C44 -90 60 -74 63 -52 C66 -36 64 -18 57 -2 L46 -2 C45 4 44 9 43 13 C41 13 40 9 41 4 L42 -8 ' +
          'C38 -32 18 -42 0 -42 C-18 -42 -38 -32 -42 -8 L-41 4 C-40 9 -41 13 -43 13 C-44 9 -45 4 -46 -2 Z',
      )}
      {/* the clumps: each one sweep from the left temple up and over to the right */}
      {groove(p, 'M-52 -44 C-36 -60 -8 -70 20 -66 C36 -63 48 -54 54 -44')}
      {groove(p, 'M-46 -72 C-30 -88 -4 -96 22 -92 C40 -88 54 -76 58 -62')}
      {groove(p, 'M-24 -94 C-8 -100 12 -100 30 -94', 2.8)}
      {groove(p, 'M56 -16 C62 -30 62 -46 56 -60', 2.6)}
      {groove(p, 'M-56 -16 C-60 -28 -60 -40 -56 -52', 2.6)}
      {ridge(p, 'M-48 -52 C-32 -68 -4 -76 22 -72')}
      {ridge(p, 'M-40 -80 C-24 -94 2 -100 26 -96')}
      {ridge(p, 'M-30 -86 C-14 -94 8 -96 26 -90', 2.6)}
    </>
  )
}

/* Behind: the rest of the mass, so the crown is full from any turn. */
function clayQuiffBack(p: Palette) {
  return mass(p, 'M-54 14 C-66 -24 -64 -70 -30 -92 C-6 -104 26 -102 46 -88 C66 -72 68 -28 56 14 Z')
}

/* Library curls (Man Working on Laptop-4, Man Working on Laptop): a few big
 * soft clumps, each a bump on the silhouette with a groove curling under
 * it, not a cap of small circles. The hairline is a row of bumps too. */
const CLAY_CURLS_FRONT: [number, number, number][] = [
  [-50, -22, 14], [-44, -52, 15], [-22, -72, 16], [8, -78, 16], [36, -68, 15], [52, -44, 14], [54, -14, 13],
]
/* two clumps over the forehead, inside the silhouette, with no groove */
const CLAY_CURLS_INNER: [number, number, number][] = [[-8, -44, 13], [26, -40, 12]]
const CLAY_CURLS_BACK: [number, number, number][] = [
  [-58, -6, 15], [-56, -34, 15], [-40, -62, 16], [-12, -82, 17], [20, -84, 17], [44, -68, 16], [58, -40, 15], [60, -8, 14],
]

function clayCurlyFront(p: Palette) {
  return (
    <>
      {mass(p, 'M-47 10 C-55 -20 -47 -54 -22 -66 C-7 -73 10 -73 25 -66 C50 -54 55 -20 47 10 L42 10 C42 -5 42 -20 37 -32 C27 -42 7 -48 -3 -48 C-18 -48 -33 -42 -38 -31 C-42 -20 -42 -5 -42 10 Z')}
      {curls(p, CLAY_CURLS_INNER)}
      {curls(p, CLAY_CURLS_FRONT)}
      {CLAY_CURLS_FRONT.map(([x, y, r], i) => (
        <path key={i} d={`M${x - r * 0.7} ${y + r * 0.5} A${r * 0.85} ${r * 0.85} 0 0 0 ${x + r * 0.75} ${y + r * 0.4}`} fill="none" stroke={p.hairShade} strokeWidth="2.6" strokeLinecap="round" opacity="0.38" />
      ))}
    </>
  )
}

function clayCurlyBack(p: Palette) {
  return (
    <>
      {mass(p, 'M-55 17 C-67 -17 -58 -59 -25 -73 C-8 -80 12 -80 28 -73 C63 -59 68 -17 55 17 Z')}
      {curls(p, CLAY_CURLS_BACK)}
    </>
  )
}

/* Short, brushed up and back (Bearded Man Presenting, Man Pointing): the
 * flat cap with more height at the front, and the clumps as sweeps that
 * run from the forehead back over the crown. */
function clayShortFront(p: Palette) {
  return (
    <>
      {mass(p, 'M-48 12 C-57 -19 -50 -58 -24 -72 C-6 -80 14 -78 28 -70 C52 -56 57 -19 48 12 L42 12 C42 -3 43 -19 38 -31 C33 -37 20 -41 3 -41 C-15 -41 -32 -37 -38 -29 C-43 -19 -42 -3 -42 12 Z')}
      {groove(p, 'M-40 -44 C-24 -60 0 -66 24 -60')}
      {groove(p, 'M-34 -62 C-16 -74 6 -76 26 -68', 2.8)}
      {groove(p, 'M50 -10 C54 -28 50 -46 40 -58', 2.6)}
      {ridge(p, 'M-38 -52 C-22 -66 2 -70 24 -64')}
    </>
  )
}

/* Parted on the viewer's left and swept across to the right in a soft
 * wave (Man Presenting-3, Man Holding Pointer): the same cap, the parting
 * a single groove and the sweep three grooves fanning from it. */
function claySidePartFront(p: Palette) {
  return (
    <>
      {mass(p, 'M-48 12 C-57 -19 -48 -58 -20 -70 C-4 -77 16 -76 30 -68 C54 -54 57 -19 48 12 L42 12 C43 -5 42 -22 33 -29 C22 -36 2 -39 -13 -39 C-28 -38 -38 -31 -40 -20 C-42 -8 -42 2 -42 12 Z')}
      {groove(p, 'M-14 -40 C-18 -48 -22 -56 -24 -66', 2.8)}
      {groove(p, 'M-10 -46 C8 -54 26 -52 40 -40')}
      {groove(p, 'M-12 -58 C8 -68 28 -64 44 -52')}
      {groove(p, 'M-30 -40 C-36 -48 -40 -56 -42 -62', 2.4)}
      {ridge(p, 'M-8 -52 C10 -60 28 -58 42 -46')}
    </>
  )
}

function clayShortBack(p: Palette) {
  return mass(p, 'M-52 14 C-62 -19 -54 -60 -26 -74 C-8 -82 14 -80 28 -72 C56 -58 63 -19 52 14 Z')
}

/* Riya's bun after Female Teacher Icon: hair drawn smoothly back from a
 * parting on the viewer's right, a soft side-swept fringe over the left
 * temple, a short lock in front of each ear, and a round bun on top held by
 * a scrunchie in the accent colour. */
function clayBunFront(p: Palette) {
  return (
    <>
      {mass(
        p,
        'M-46 16 C-53 2 -56 -18 -54 -36 C-50 -58 -30 -70 -2 -70 C26 -70 48 -58 53 -36 C56 -18 53 2 47 14 ' +
          'C46 0 46 -14 43 -24 C40 -32 30 -38 16 -40 C8 -36 -6 -32 -22 -30 C-34 -28 -42 -22 -44 -12 C-46 -2 -46 8 -46 16 Z',
      )}
      {/* the fringe sweeping from the parting down over the left temple */}
      {mass(p, 'M16 -42 C2 -36 -22 -32 -38 -24 C-46 -20 -50 -10 -48 2 C-46 -16 -34 -26 -16 -28 C0 -30 10 -34 16 -42 Z')}
      {groove(p, 'M14 -44 C0 -40 -24 -36 -40 -24', 2.2)}
      {groove(p, 'M18 -46 C24 -54 30 -60 36 -62', 2)}
      {groove(p, 'M-46 -26 C-46 -44 -32 -60 -10 -64', 2.2)}
      {groove(p, 'M48 -18 C50 -32 46 -48 34 -58', 2)}
      {ridge(p, 'M-38 -40 C-30 -54 -16 -62 2 -64')}
      {ridge(p, 'M22 -60 C32 -58 40 -50 44 -40', 2)}
    </>
  )
}

function clayBunBack(p: Palette) {
  return (
    <>
      {mass(p, 'M-54 14 C-62 -22 -52 -66 -2 -70 C48 -66 62 -22 54 14 Z')}
      {/* the bun sits on top, a little back of centre */}
      <circle cx="4" cy="-84" r="21" fill={p.hair} />
      {groove(p, 'M-12 -90 C-6 -100 10 -102 18 -94', 2.2)}
      {groove(p, 'M-14 -78 C-6 -70 12 -70 20 -78', 2.2)}
      {ridge(p, 'M-10 -96 C-2 -103 10 -103 16 -98', 2)}
      {/* the scrunchie where the bun meets the head */}
      <path d="M-18 -68 C-10 -60 18 -60 26 -68 C24 -61 16 -56 4 -56 C-8 -56 -16 -61 -18 -68 Z" fill={accent(p)} />
      <path d="M-14 -66 C-6 -61 14 -61 22 -66" fill="none" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="1.6" strokeLinecap="round" />
    </>
  )
}
