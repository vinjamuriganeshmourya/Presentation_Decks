import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { STILL } from '../scene'
import { iconUrl } from './fx'

/**
 * THE ROUTING SECTION'S DRAWN OBJECTS (visual pass 2026-11-04, the user: "detailed,
 * concrete visuals, not abstract"; Session 4's BusAnalogy is the reference: side-on
 * objects in svg, real parts, micro-animations that say what the object does).
 * Each one is an svg `<g>` placed in its scene's own coordinates; no words in them
 * (labels are DOM chips the scenes put beside them, content rule 17).
 *
 *   LibFigure    a person: a 3D render from the asset library (round 2, R7), moved
 *                whole; `Ticket` is the ticket in a visitor's hand
 *   Parcel       a cardboard parcel, taped shut, an address label with a pincode
 *                strip (bars, no characters)
 *   VanRear      a delivery van from behind: open or shut rear doors, a stripe in
 *                its route's colour, tail lights
 *   Office3D, Desk3D, Phone3D, JunctionBox, Exchange3D   T17-AN's 3D pieces (round 2)
 *   OfficeBlock  an office building: storeys of windows, a door, a junction box
 *   OnPremOffice an office with a server rack beside it, lights blinking (T17-2)
 */

/**
 * THE PEOPLE (round 2, the FS team's review and course rule R7: "detailed, realistic
 * illustrations with natural proportions"): the asset library's 3D renders, one family,
 * copied into `./icons/routing-*.png` trimmed to the figure. A figure that moves moves
 * as a whole image (translated by its scene's clock, a small walking bob), never by
 * redrawn limbs. Width over height of each render, so a figure is placed by its feet.
 */
const FIG = {
  visitor: 101 / 176,
  'queue-a': 102 / 176,
  'queue-b': 102 / 176,
  outsider: 103 / 176,
  clerk: 87 / 96,
  caller: 197 / 170,
  receiver: 197 / 170,
} as const
export type FigName = keyof typeof FIG

/** A library figure standing with its feet centred at (x, y), `h` px tall; `dir` -1 mirrors it; `walking` bobs it; `children` are drawn in its own frame (feet at 0, 0). */
export function LibFigure({ name, x, y, h, dir = 1, walking = false, idle = false, opacity = 1, shadow = true, children }: {
  name: FigName; x: number; y: number; h: number; dir?: 1 | -1; walking?: boolean; idle?: boolean; opacity?: number; shadow?: boolean; children?: ReactNode
}) {
  const w = h * FIG[name]
  const cls = STILL ? undefined : walking ? 'rt-bob' : idle ? 'rt-idle' : undefined
  return (
    <g transform={`translate(${x} ${y})`} style={{ opacity, transition: 'opacity 420ms cubic-bezier(0.22,1,0.36,1)' }}>
      {shadow && <ellipse cx={0} cy={0} rx={w * 0.4} ry={3.2} fill="#1F408C" opacity={0.2} />}
      <g className={cls}>
        <g transform={`scale(${dir} 1)`}>
          <image href={iconUrl(`routing-${name}`)} x={-w / 2} y={-h} width={w} height={h} preserveAspectRatio="xMidYMax meet" />
          {children}
        </g>
      </g>
    </g>
  )
}

/** A paper ticket held at (x, y) of a figure's frame: a stub, a perforation, a printed band. */
export function Ticket({ x, y, rot = -14 }: { x: number; y: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={-6} y={-4} width={12} height={8} rx={1.3} fill="#FFC531" stroke="#B3860F" strokeWidth={0.7} />
      <rect x={-6} y={-4} width={12} height={2.4} rx={1} fill={colors.accent} />
      <line x1={2.4} y1={-3.6} x2={2.4} y2={3.6} stroke="#B3860F" strokeWidth={0.7} strokeDasharray="1.1 0.9" />
    </g>
  )
}

/** A cardboard parcel, taped shut, an address label with a pincode strip, centred at (x, y), `w` wide. */
export function Parcel({ x, y, w = 28, sealGlow = false }: { x: number; y: number; w?: number; sealGlow?: boolean }) {
  const h = w * 0.74
  return (
    <g transform={`translate(${x - w / 2} ${y - h / 2})`}>
      <rect x={0} y={0} width={w} height={h} rx={2.5} fill="#C99560" stroke="#8E6237" strokeWidth={1} />
      <rect x={0} y={0} width={w} height={h * 0.22} rx={2} fill="#DDB07E" />
      {/* the tape across the lid and down the front */}
      <rect x={w * 0.44} y={0} width={w * 0.12} height={h} fill={sealGlow ? '#FF8A3D' : '#B07A44'} opacity={0.9} style={{ transition: 'fill 420ms' }} />
      {/* the address label: a pincode strip of bars */}
      <rect x={w * 0.06} y={h * 0.4} width={w * 0.34} height={h * 0.42} rx={1} fill="#FFFFFF" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={w * 0.09 + i * w * 0.048} y={h * 0.5} width={w * (i % 2 ? 0.02 : 0.032)} height={h * 0.24} fill="#1C1F26" />
      ))}
    </g>
  )
}

/** A delivery van from behind, centred on `cx`, its roof at `y`, 66px wide: rear doors open or shut, a stripe in its route's colour. */
export function VanRear({ cx, y, tone, open = true, lit = false }: { cx: number; y: number; tone: string; open?: boolean; lit?: boolean }) {
  const ease = 'all 420ms cubic-bezier(0.22,1,0.36,1)'
  return (
    <g>
      <ellipse cx={cx} cy={y + 66} rx={40} ry={4} fill="#1F408C" opacity={0.18} />
      {/* the open doors, swung out to the sides */}
      <g style={{ opacity: open ? 1 : 0, transition: ease }}>
        <rect x={cx - 42} y={y + 6} width={8} height={40} rx={2} fill="#E3E8F1" stroke="#B8C3D6" />
        <rect x={cx + 34} y={y + 6} width={8} height={40} rx={2} fill="#E3E8F1" stroke="#B8C3D6" />
      </g>
      <rect x={cx - 33} y={y} width={66} height={54} rx={7} fill="#F4F6FA" stroke={lit ? tone : '#B8C3D6'} strokeWidth={lit ? 2.5 : 1.2} style={{ transition: ease }} />
      <rect x={cx - 10} y={y - 4} width={20} height={4} rx={1.5} fill="#FFB547" />
      {/* the cargo hold, dark when open; the two shut doors otherwise */}
      <rect x={cx - 26} y={y + 6} width={52} height={36} rx={2} fill={open ? '#2A2D38' : '#E9EDF4'} stroke="#B8C3D6" style={{ transition: ease }} />
      <g style={{ opacity: open ? 0 : 1, transition: ease }}>
        <line x1={cx} y1={y + 6} x2={cx} y2={y + 42} stroke="#B8C3D6" strokeWidth={1.4} />
        <rect x={cx - 6} y={y + 22} width={4} height={2} rx={1} fill="#7A879E" />
        <rect x={cx + 2} y={y + 22} width={4} height={2} rx={1} fill="#7A879E" />
      </g>
      {/* the route's colour */}
      <rect x={cx - 33} y={y + 42} width={66} height={6} fill={tone} />
      <rect x={cx - 31} y={y + 34} width={5} height={7} rx={1.5} fill="#E5484D" />
      <rect x={cx + 26} y={y + 34} width={5} height={7} rx={1.5} fill="#E5484D" />
      <rect x={cx - 35} y={y + 52} width={70} height={6} rx={2} fill="#5B6478" />
      <rect x={cx - 30} y={y + 57} width={12} height={9} rx={3} fill="#25252B" />
      <rect x={cx + 18} y={y + 57} width={12} height={9} rx={3} fill="#25252B" />
    </g>
  )
}

/**
 * T17-AN's 3D PIECES (round 2: "proportionate, realistic 3D illustrations", not flat
 * 2D). Light comes from the upper left; every solid has a lit front face, a darker
 * receding side and a lit top, with gradients for curvature and a soft contact shadow.
 * The scene is seen from slightly above and from its centre, so a building on the left
 * shows its right-hand side and one on the right its left-hand side (`side`).
 */

/** The gradients the 3D pieces share; render once inside the scene's svg. */
export function Art3dDefs() {
  return (
    <defs>
      <linearGradient id="rt3-front" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#F4F7FC" />
        <stop offset="1" stopColor="#D3DCEB" />
      </linearGradient>
      <linearGradient id="rt3-side" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#B4C1D8" />
        <stop offset="1" stopColor="#8E9DB8" />
      </linearGradient>
      <linearGradient id="rt3-roof" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#E9EEF7" />
        <stop offset="1" stopColor="#CBD5E6" />
      </linearGradient>
      <linearGradient id="rt3-glass" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0" stopColor="#B9D3FF" />
        <stop offset="0.55" stopColor="#7DA4EE" />
        <stop offset="1" stopColor="#4F78CC" />
      </linearGradient>
      <linearGradient id="rt3-glass-side" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#6E8FCF" />
        <stop offset="1" stopColor="#3E5D9E" />
      </linearGradient>
      <linearGradient id="rt3-lobby" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FBF7EF" />
        <stop offset="0.72" stopColor="#F1E9DB" />
        <stop offset="0.72" stopColor="#D9CBB4" />
        <stop offset="1" stopColor="#CDBDA3" />
      </linearGradient>
      <linearGradient id="rt3-wood" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#D8B48A" />
        <stop offset="1" stopColor="#A87C52" />
      </linearGradient>
      <linearGradient id="rt3-woodtop" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#EBCDA5" />
        <stop offset="1" stopColor="#DDB98F" />
      </linearGradient>
      <linearGradient id="rt3-box" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#F2F4F8" />
        <stop offset="1" stopColor="#B7C0CF" />
      </linearGradient>
      <linearGradient id="rt3-phone" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3C4A66" />
        <stop offset="1" stopColor="#1C2436" />
      </linearGradient>
      <linearGradient id="rt3-phonetop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#6A7B9C" />
        <stop offset="1" stopColor="#47567A" />
      </linearGradient>
      <linearGradient id="rt3-brick" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#E3D6C6" />
        <stop offset="1" stopColor="#C2AE98" />
      </linearGradient>
      <linearGradient id="rt3-panel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2A3550" />
        <stop offset="1" stopColor="#141B2B" />
      </linearGradient>
    </defs>
  )
}

/** The depth of a receding face, in px across and up. */
const DX = 18
const DY = 12

/**
 * An office tower in 3D: front `fx`..`fx + w`, roof at `top`, foot at `foot`; `side` 1
 * shows its right-hand face, -1 its left. Three storeys of glass, a canopy, a glass
 * lobby whose inside (`lobby`, drawn by the scene in the stage's coordinates) shows
 * through, a roof parapet with a plant box and a mast whose light blinks.
 */
export function Office3D({ id, fx, w, top, foot, side, lobby }: { id: string; fx: number; w: number; top: number; foot: number; side: 1 | -1; lobby?: ReactNode }) {
  const ex = side > 0 ? fx + w : fx
  const sx = ex + side * DX
  const lobbyTop = foot - 98
  const lx = fx + 8
  const lw = w - 16
  const cols = 4
  const gap = 8
  const ww = (w - 24 - gap * (cols - 1)) / cols
  const rows = [top + 12, top + 38, top + 64]
  const rimX = side > 0 ? fx : fx + w
  return (
    <g>
      {/* contact shadow on the ground */}
      <ellipse cx={fx + w / 2 + side * 8} cy={foot + 2} rx={w / 2 + 18} ry={5} fill="#1F408C" opacity={0.18} />
      {/* the receding side wall, its narrow windows */}
      <polygon points={`${ex},${top} ${sx},${top - DY} ${sx},${foot - DY} ${ex},${foot}`} fill="url(#rt3-side)" stroke="#7D8CA8" strokeWidth={0.8} />
      {rows.map((y) => (
        <polygon key={y} points={`${ex + side * 4},${y - (DY * 4) / DX} ${ex + side * (DX - 4)},${y - (DY * (DX - 4)) / DX} ${ex + side * (DX - 4)},${y + 20 - (DY * (DX - 4)) / DX} ${ex + side * 4},${y + 20 - (DY * 4) / DX}`} fill="url(#rt3-glass-side)" />
      ))}
      {/* the roof: its top face, a parapet rim, a plant box, a mast with a blinking light */}
      <polygon points={`${fx},${top} ${fx + w},${top} ${fx + w + side * DX},${top - DY} ${fx + side * DX},${top - DY}`} fill="url(#rt3-roof)" stroke="#9FAECA" strokeWidth={0.8} />
      <rect x={fx - 1} y={top - 3} width={w + 2} height={5} rx={1.5} fill={colors.brandDark} />
      <g transform={`translate(${rimX + (side > 0 ? 22 : -46)} ${top - 13})`}>
        <rect x={0} y={0} width={24} height={9} rx={1.5} fill="url(#rt3-box)" stroke="#8E9AB0" strokeWidth={0.7} />
        <polygon points={`0,0 24,0 ${24 + side * 5},-3 ${side * 5},-3`} fill="#E6EBF3" stroke="#8E9AB0" strokeWidth={0.6} />
        {[0, 1, 2, 3].map((i) => <line key={i} x1={4 + i * 5} y1={2} x2={4 + i * 5} y2={7} stroke="#7A879E" strokeWidth={0.9} />)}
      </g>
      <line x1={fx + w * (side > 0 ? 0.7 : 0.3)} y1={top - 6} x2={fx + w * (side > 0 ? 0.7 : 0.3)} y2={top - 24} stroke="#5B6478" strokeWidth={2} />
      <circle cx={fx + w * (side > 0 ? 0.7 : 0.3)} cy={top - 25} r={2.6} fill="#E5484D" className={STILL ? undefined : 'rt-blink'} />
      {/* the front face: concrete frame, three storeys of glass with a reflection */}
      <rect x={fx} y={top} width={w} height={foot - top} fill="url(#rt3-front)" stroke="#9FAECA" strokeWidth={0.8} />
      {rows.map((y) =>
        Array.from({ length: cols }, (_, c) => (
          <g key={`${y}-${c}`}>
            <rect x={fx + 12 + c * (ww + gap)} y={y} width={ww} height={20} rx={1.5} fill="url(#rt3-glass)" stroke="#5E7DB8" strokeWidth={0.6} />
            <polygon points={`${fx + 12 + c * (ww + gap) + 4},${y + 20} ${fx + 12 + c * (ww + gap) + 12},${y} ${fx + 12 + c * (ww + gap) + 17},${y} ${fx + 12 + c * (ww + gap) + 9},${y + 20}`} fill="#FFFFFF" opacity={0.28} />
          </g>
        )),
      )}
      {rows.slice(1).map((y) => <rect key={y} x={fx} y={y - 4} width={w} height={1.4} fill="#B9C5DA" />)}
      {/* the canopy over the lobby, a blank sign plate */}
      <rect x={fx - 3} y={lobbyTop - 9} width={w + 6} height={8} rx={2} fill={colors.brandDark} />
      <rect x={fx + w / 2 - 18} y={lobbyTop - 7.5} width={36} height={5} rx={1.2} fill="#FFFFFF" opacity={0.85} />
      {/* the lobby: what is inside (the scene's), then the glass over it */}
      <clipPath id={`rt3-lobby-${id}`}>
        <rect x={lx} y={lobbyTop} width={lw} height={foot - 6 - lobbyTop} />
      </clipPath>
      <rect x={lx} y={lobbyTop} width={lw} height={foot - 6 - lobbyTop} fill="url(#rt3-lobby)" />
      <g clipPath={`url(#rt3-lobby-${id})`}>{lobby}</g>
      <polygon points={`${lx + lw * 0.06},${foot - 6} ${lx + lw * 0.22},${lobbyTop} ${lx + lw * 0.3},${lobbyTop} ${lx + lw * 0.14},${foot - 6}`} fill="#FFFFFF" opacity={0.16} />
      <rect x={lx} y={lobbyTop} width={lw} height={foot - 6 - lobbyTop} fill="none" stroke="#5B6B86" strokeWidth={2} />
      {/* the plinth */}
      <rect x={fx - 3} y={foot - 6} width={w + 6} height={6} rx={1} fill="#8D99AE" />
    </g>
  )
}

/** A wooden desk seen from slightly above: its top from `x0` to `x1` with its front edge at `y`, a front panel down to `foot`. */
export function Desk3D({ x0, x1, y, foot }: { x0: number; x1: number; y: number; foot: number }) {
  return (
    <g>
      <polygon points={`${x0},${y} ${x1},${y} ${x1 - 4},${y - 7} ${x0 + 4},${y - 7}`} fill="url(#rt3-woodtop)" stroke="#A47A50" strokeWidth={0.6} />
      <rect x={x0} y={y} width={x1 - x0} height={foot - y} fill="url(#rt3-wood)" stroke="#8E6237" strokeWidth={0.7} />
      <rect x={x0} y={y} width={x1 - x0} height={2.4} fill="#F3DDBE" opacity={0.7} />
      <rect x={x0 + 8} y={y + 8} width={x1 - x0 - 16} height={foot - y - 14} rx={2} fill="none" stroke="#946A40" strokeWidth={0.9} opacity={0.7} />
    </g>
  )
}

/**
 * A desk telephone in 3D, standing on a desk at (x, y): a sloped body with a keypad and
 * a display, the handset on its cradle with a coiled cord. `off` lifts the handset
 * toward its owner (`toward` -1 left, 1 right); `ring` shakes it inside two ringing
 * arcs; `talk` sends talking arcs from the lifted handset.
 */
export function Phone3D({ x, y, toward, off = false, ring = false, talk = false }: { x: number; y: number; toward: 1 | -1; off?: boolean; ring?: boolean; talk?: boolean }) {
  const lift = off ? `translate(${toward * 3}px, -8px) rotate(${toward * 16}deg)` : 'none'
  const end = off ? `${toward * 22} -27` : `${toward * 20} -21`
  return (
    <g transform={`translate(${x} ${y}) scale(0.82)`}>
      <ellipse cx={0} cy={0} rx={22} ry={3} fill="#5A3E22" opacity={0.25} />
      <g className={ring && !STILL ? 'rt-buzz' : undefined}>
        {/* the body: front face, sloped top with keypad and display */}
        <path d="M -20 0 L -17 -11 L 17 -11 L 20 0 Z" fill="url(#rt3-phone)" />
        <path d="M -17 -11 L -12 -21 L 12 -21 L 17 -11 Z" fill="url(#rt3-phonetop)" stroke="#2A3550" strokeWidth={0.6} />
        <rect x={-7} y={-19} width={14} height={3.2} rx={0.8} fill="#9FE6C9" opacity={0.9} />
        {[0, 1, 2].map((r) => [0, 1, 2].map((c) => (
          <rect key={`${r}${c}`} x={-6.5 + c * 4.6 - r * 0.6} y={-15 + r * 1.3} width={3.4} height={1} rx={0.4} fill="#E3E8F1" opacity={0.85} />
        )))}
        <rect x={-19} y={-2.6} width={38} height={1.4} rx={0.7} fill="#5E6E8E" opacity={0.6} />
      </g>
      {/* the coiled cord from the body's side to the handset's near end */}
      <path d={`M ${toward * 18} -5 Q ${toward * 27} -9 ${end}`} fill="none" stroke="#2A3550" strokeWidth={2.2} strokeDasharray="1.2 1" strokeLinecap="round" />
      {/* the handset: ear cup, grip, mouth cup, a highlight along its back */}
      <g style={{ transform: lift, transformOrigin: '50% 50%', transformBox: 'fill-box', transition: 'transform 460ms cubic-bezier(0.34,1.4,0.64,1)' } as CSSProperties}>
        <path d="M -21 -20 Q -22 -27 -15 -28 L 15 -28 Q 22 -27 21 -20 L 16 -19 Q 14 -23 9 -23 L -9 -23 Q -14 -23 -16 -19 Z" fill="url(#rt3-phone)" stroke="#141B2B" strokeWidth={0.6} />
        <path d="M -15 -27 L 15 -27" stroke="#7F90B0" strokeWidth={1.2} strokeLinecap="round" opacity={0.8} />
      </g>
      {(ring || talk) && !STILL && (
        <g className={ring ? 'rt-ring' : 'rt-talk'} style={{ transformOrigin: '50% 50%', transformBox: 'fill-box' } as CSSProperties}>
          <path d="M -27 -26 Q -33 -14 -27 -2" fill="none" stroke={ring ? colors.accent : colors.success} strokeWidth={2.2} strokeLinecap="round" />
          <path d="M 27 -26 Q 33 -14 27 -2" fill="none" stroke={ring ? colors.accent : colors.success} strokeWidth={2.2} strokeLinecap="round" />
        </g>
      )}
    </g>
  )
}

/** A wall-mounted junction box in 3D, centred at (x, y): a lid, its hinge line, a status light (lit while the line carries a call). */
export function JunctionBox({ x, y, lit = false }: { x: number; y: number; lit?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-8} y={-12} width={16} height={24} rx={2} fill="url(#rt3-box)" stroke="#6B7891" strokeWidth={0.9} />
      <polygon points="-8,-12 8,-12 11,-14.5 -5,-14.5" fill="#F4F6FA" stroke="#6B7891" strokeWidth={0.6} />
      <polygon points="8,-12 11,-14.5 11,9.5 8,12" fill="#98A3B8" />
      <line x1={-5} y1={-8} x2={5} y2={-8} stroke="#8C98AE" strokeWidth={0.9} />
      <rect x={-2} y={6} width={4} height={2.4} rx={0.8} fill="#6B7891" />
      <circle cx={0} cy={-2} r={2.4} fill={lit ? colors.success : '#9AA6B8'} className={lit && !STILL ? 'rt-blink' : undefined} style={{ transition: 'fill 300ms' }} />
    </g>
  )
}

/** The public telephone exchange in 3D, front `fx`..`fx + w`, roof at `top`, foot at `foot`: a brick hall, a lit switchboard window with patch cords, a lattice mast on its roof. */
export function Exchange3D({ fx, w, top, foot }: { fx: number; w: number; top: number; foot: number }) {
  const cx = fx + w / 2
  const mastTop = top - 46
  return (
    <g>
      <ellipse cx={cx} cy={foot + 2} rx={w / 2 + 12} ry={4.5} fill="#1F408C" opacity={0.18} />
      {/* the roof seen from above the centre, and the lattice mast */}
      <polygon points={`${fx},${top} ${fx + w},${top} ${fx + w - 8},${top - 9} ${fx + 8},${top - 9}`} fill="url(#rt3-roof)" stroke="#9FAECA" strokeWidth={0.8} />
      <g stroke="#5B6478" strokeWidth={1.4} fill="none">
        <path d={`M ${cx - 7} ${top - 5} L ${cx - 1.5} ${mastTop} M ${cx + 7} ${top - 5} L ${cx + 1.5} ${mastTop}`} />
        {[0.2, 0.45, 0.7].map((k) => {
          const y1 = top - 5 - (top - 5 - mastTop) * k
          const y2 = top - 5 - (top - 5 - mastTop) * (k + 0.22)
          const half = (yy: number) => 1.5 + (5.5 * (yy - mastTop)) / (top - 5 - mastTop)
          return <path key={k} d={`M ${cx - half(y1)} ${y1} L ${cx + half(y2)} ${y2} M ${cx + half(y1)} ${y1} L ${cx - half(y2)} ${y2}`} strokeWidth={0.8} />
        })}
        <path d={`M ${cx - 12} ${mastTop + 5} L ${cx + 12} ${mastTop + 5} M ${cx - 9} ${mastTop + 12} L ${cx + 9} ${mastTop + 12}`} strokeWidth={2} />
      </g>
      {[-12, -6, 6, 12].map((dx) => <circle key={dx} cx={cx + dx} cy={mastTop + 3.4} r={1.4} fill="#E3E8F1" stroke="#5B6478" strokeWidth={0.6} />)}
      {/* the brick front, its courses */}
      <rect x={fx} y={top} width={w} height={foot - top} fill="url(#rt3-brick)" stroke="#A8927C" strokeWidth={0.8} />
      {Array.from({ length: Math.floor((foot - top - 4) / 7) }, (_, i) => (
        <line key={i} x1={fx + 1} y1={top + 5 + i * 7} x2={fx + w - 1} y2={top + 5 + i * 7} stroke="#B49F88" strokeWidth={0.6} opacity={0.6} />
      ))}
      {/* the switchboard behind its window: rows of jacks, patch cords */}
      <rect x={fx + 8} y={top + 8} width={w - 16} height={foot - top - 18} rx={2.5} fill="url(#rt3-panel)" stroke="#5B6478" strokeWidth={1.2} />
      {Array.from({ length: 3 }, (_, r) =>
        Array.from({ length: 7 }, (_, c) => (
          <circle key={`${r}${c}`} cx={fx + 16 + c * ((w - 32) / 6)} cy={top + 17 + r * 11} r={2.3} fill={(r + c) % 4 === 0 ? '#FFC531' : '#9AA6B8'} />
        )),
      )}
      <path d={`M ${fx + 16} ${top + 17} Q ${fx + 26} ${foot - 8} ${fx + 16 + 3 * ((w - 32) / 6)} ${top + 28}`} fill="none" stroke={colors.accent} strokeWidth={1.4} />
      <path d={`M ${fx + 16 + 5 * ((w - 32) / 6)} ${top + 17} Q ${fx + w - 22} ${foot - 6} ${fx + 16 + 2 * ((w - 32) / 6)} ${top + 39}`} fill="none" stroke="#2D63FB" strokeWidth={1.4} />
      <rect x={fx - 2} y={foot - 4} width={w + 4} height={4} rx={1} fill="#8D99AE" />
    </g>
  )
}

/** An office building, its foot at `y`, from `x`, `w` wide and `h` tall: storeys of windows, a door, a sign plate; `children` drawn over its ground-floor window. */
export function OfficeBlock({ x, y, w = 120, h = 150, tone = '#DCE5F7', roof = colors.brandDark, children }: { x: number; y: number; w?: number; h?: number; tone?: string; roof?: string; children?: ReactNode }) {
  const top = y - h
  const cols = 3
  const rows = Math.max(2, Math.floor((h - 70) / 26))
  const ww = (w - 28 - (cols - 1) * 8) / cols
  return (
    <g>
      <ellipse cx={x + w / 2} cy={y + 2} rx={w / 2 + 8} ry={4.5} fill="#1F408C" opacity={0.18} />
      <rect x={x} y={top} width={w} height={h} rx={4} fill={tone} stroke="#B3C2DF" />
      <rect x={x - 4} y={top - 8} width={w + 8} height={10} rx={3} fill={roof} />
      <rect x={x + w * 0.62} y={top - 20} width={4} height={12} fill="#5B6478" />
      <circle cx={x + w * 0.62 + 2} cy={top - 22} r={3} fill={colors.accent} className={STILL ? undefined : 'rt-blink'} />
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => (
          <rect key={`${r}-${c}`} x={x + 14 + c * (ww + 8)} y={top + 12 + r * 26} width={ww} height={16} rx={2} fill="#F7FAFF" stroke="#9FB3D1" strokeWidth={0.8} />
        )),
      )}
      {/* the ground floor: a wide window (what the scene puts in it shows through) and the door */}
      <rect x={x + 10} y={y - 50} width={w * 0.56} height={38} rx={3} fill="#EAF2FF" stroke="#9FB3D1" />
      <rect x={x + w - 34} y={y - 46} width={22} height={46} rx={2} fill="#4A5B74" />
      <circle cx={x + w - 16} cy={y - 22} r={1.6} fill="#D7DCE6" />
      {children}
    </g>
  )
}

/** The on-premises side of T17-2: an office block with a server rack beside it, its lights blinking, at `w` wide (an html-sized svg). */
export function OnPremOffice({ w = 140, lit = false }: { w?: number; lit?: boolean }) {
  const h = w * 1.18
  return (
    <svg width={w} height={h} viewBox="0 0 140 165" aria-hidden style={{ overflow: 'visible' }}>
      <OfficeBlock x={6} y={158} w={92} h={138} tone={lit ? '#FFE8D6' : '#DCE5F7'} />
      {/* the server rack beside it: three units, status lights */}
      <ellipse cx={120} cy={160} rx={20} ry={3.5} fill="#1F408C" opacity={0.18} />
      <rect x={104} y={92} width={32} height={66} rx={4} fill="#2A3346" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={108} y={98 + i * 15} width={24} height={11} rx={2} fill="#3B4660" />
          <circle cx={113} cy={103.5 + i * 15} r={1.8} fill={i % 2 ? colors.success : '#5CE1E6'} className={STILL ? undefined : 'rt-blink'} style={{ animationDelay: `${i * 0.3}s` }} />
          <rect x={117} y={102.5 + i * 15} width={12} height={2} rx={1} fill="#7A879E" />
        </g>
      ))}
      <path d="M 98 140 L 104 140" stroke={colors.brand} strokeWidth={2.4} strokeLinecap="round" />
    </svg>
  )
}

/** The section's svg micro-animations: a walking bob, an idle breath, a buzzing phone, a ringing phone, talking arcs, blinking lights, a scanner beam. */
export const ROUTING_ART_CSS = `
@keyframes rt-bob { 0% { transform: translateY(0) rotate(-1.6deg) } 50% { transform: translateY(-3px) rotate(0deg) } 100% { transform: translateY(0) rotate(1.6deg) } }
.rt-bob { transform-box: fill-box; transform-origin: 50% 100%; animation: rt-bob 0.46s ease-in-out infinite alternate; }
@keyframes rt-idle { 0%, 100% { transform: scaleY(1) } 50% { transform: scaleY(1.014) } }
.rt-idle { transform-box: fill-box; transform-origin: 50% 100%; animation: rt-idle 3.2s ease-in-out infinite; }
@keyframes rt-buzz { 0%, 100% { transform: translateX(0) } 25% { transform: translateX(-1.2px) } 75% { transform: translateX(1.2px) } }
.rt-buzz { animation: rt-buzz 0.16s linear infinite; }
@keyframes rt-ring { 0%, 100% { transform: scale(0.9); opacity: 0.3 } 50% { transform: scale(1.12); opacity: 1 } }
.rt-ring { animation: rt-ring 0.5s ease-in-out infinite; }
@keyframes rt-talk { 0%, 100% { opacity: 0.25 } 50% { opacity: 1 } }
.rt-talk { animation: rt-talk 1.1s ease-in-out infinite; }
@keyframes rt-blink { 0%, 100% { opacity: 1 } 50% { opacity: 0.25 } }
.rt-blink { animation: rt-blink 1.3s steps(2, end) infinite; }
@keyframes rt-beam { 0%, 100% { transform: scaleX(0.6); opacity: 0.55 } 50% { transform: scaleX(1.15); opacity: 1 } }
.rt-beam { transform-box: fill-box; transform-origin: 50% 0%; animation: rt-beam 0.7s ease-in-out infinite; }
@keyframes rt-spin { to { transform: rotate(360deg) } }
.rt-roll { transform-box: fill-box; transform-origin: 50% 50%; animation: rt-spin 0.8s linear infinite; }
@keyframes rt-bulb { 0%, 100% { opacity: 1 } 50% { opacity: 0.35 } }
.rt-bulb { animation: rt-bulb 1.2s ease-in-out infinite; }
.cc-still .rt-bob, .cc-still .rt-idle, .cc-still .rt-buzz, .cc-still .rt-ring, .cc-still .rt-talk, .cc-still .rt-blink, .cc-still .rt-beam, .cc-still .rt-roll, .cc-still .rt-bulb,
.deck-thumb .rt-bob, .deck-thumb .rt-idle, .deck-thumb .rt-buzz, .deck-thumb .rt-ring, .deck-thumb .rt-talk, .deck-thumb .rt-blink, .deck-thumb .rt-beam, .deck-thumb .rt-roll, .deck-thumb .rt-bulb { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .rt-bob, .rt-idle, .rt-buzz, .rt-ring, .rt-talk, .rt-blink, .rt-beam, .rt-roll, .rt-bulb { animation: none !important; } }
`
