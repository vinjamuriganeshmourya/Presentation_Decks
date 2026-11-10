import { ClaySvg, useEase } from './art'
import { band } from './clay-a'
import { R, usePrefix, Shadow, BlurDef, GlowDef, Lin } from './depth'

/**
 * THE CLOUD CLUSTER of slide 5 (user, 2026-10-16, from the reference render):
 * the cloud, its cables, the rented tiles and the meter, drawn with the
 * render's own detail, depth and colours. Palette and helpers in `depth.tsx`;
 * the colours only this cluster uses are `C` below.
 */

/** The render's colours that only the cloud side uses. */
const C = {
  crown: '#78B2FF',
  baseRim: '#9CC8FF',
  tileTopLit: '#4B5578',
  tileSideLit: '#141A33',
  tileFrontLo: '#1A2140',
  frostFront: '#BFD5F8',
  frostTop: '#E3ECFC',
  frostSide: '#A9C2EE',
  frostLed: '#8FBCFF',
  port: '#2F7BFF',
  dialRim: '#D8E1F2',
  dialFace: '#FFFFFF',
  dialFaceEdge: '#EAF0FA',
  arcRest: '#C9D6F0',
  bevel: '#FFFFFF',
}

/* ------------------------------------------------------------------ the cloud */

/**
 * The render's cloud silhouette: a small bump on the left, a tall dome on
 * the upper left, a lower dome on the right, and a flat rounded base. Drawn
 * as four primitives so the same silhouette serves the body, its underside
 * and the clip for the crown bloom (a union clips as one shape).
 */
function Silhouette({ fill, opacity }: { fill?: string; opacity?: number }) {
  return (
    <>
      <circle cx={26} cy={52} r={16} fill={fill} opacity={opacity} />
      <circle cx={52} cy={36} r={30} fill={fill} opacity={opacity} />
      <circle cx={86} cy={48} r={22} fill={fill} opacity={opacity} />
      <rect x={10} y={52} width={98} height={18} rx={9} fill={fill} opacity={opacity} />
    </>
  )
}

/**
 * The provider's cloud as the render draws it: a fat glossy azure volume,
 * its crown lighter, a bright soft bloom on the upper left of the tall dome,
 * a deeper underside with a faint lighter reflected rim along its base, and
 * a soft cool shadow on the ground beneath it.
 */
export function GlossCloud({ w }: { w: number }) {
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={120} vh={84} large>
      <defs>
        <BlurDef id={id} sd={4} />
        <filter id={`${id}-soft`} x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation={1.3} />
        </filter>
        <linearGradient id={`${id}-body`} gradientUnits="userSpaceOnUse" x1={0} y1={6} x2={0} y2={70}>
          <stop offset="0" stopColor={C.crown} />
          <stop offset="0.42" stopColor={R.cloudMid} />
          <stop offset="1" stopColor={R.cloudBot} />
        </linearGradient>
        <radialGradient id={`${id}-bloom`} gradientUnits="userSpaceOnUse" cx={42} cy={24} r={34}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.5} />
          <stop offset="0.6" stopColor="#FFFFFF" stopOpacity={0.12} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}-shade`} gradientUnits="userSpaceOnUse" x1={0} y1={40} x2={0} y2={70}>
          <stop offset="0" stopColor={R.cloudUnder} stopOpacity={0} />
          <stop offset="1" stopColor={R.cloudUnder} stopOpacity={0.55} />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <Silhouette />
        </clipPath>
      </defs>
      <Shadow id={id} cx={58} cy={79} rx={46} ry={5} o={0.3} />
      <g>
        {/* the underside, showing below the base */}
        <g transform="translate(0 5)">
          <Silhouette fill={R.cloudUnder} />
        </g>
        {/* the body, graded crown to base */}
        <Silhouette fill={`url(#${id}-body)`} />
        {/* the base turning away from the light, then the crown bloom, both held to the silhouette */}
        <g clipPath={`url(#${id}-clip)`}>
          <rect x={0} y={40} width={120} height={30} fill={`url(#${id}-shade)`} />
          <rect x={0} y={0} width={120} height={70} fill={`url(#${id}-bloom)`} />
          <rect x={13} y={67} width={92} height={1.6} rx={0.8} fill={C.baseRim} opacity={0.42} />
        </g>
        {/* the specular on the tall dome */}
        <ellipse cx={38} cy={17} rx={11} ry={4.2} transform="rotate(-24 38 17)" fill="#FFFFFF" opacity={0.42} style={{ filter: `url(#${id}-soft)` }} />
        <ellipse cx={80} cy={32} rx={6} ry={2.4} transform="rotate(-18 80 32)" fill="#FFFFFF" opacity={0.24} style={{ filter: `url(#${id}-soft)` }} />
      </g>
    </ClaySvg>
  )
}

/* ------------------------------------------------------------------ server tiles under the cloud */

/**
 * One rented server as the render draws it: a slab with a front, a lighter
 * top face and a shaded side over a faint shadow. Lit, it is dark navy with
 * a subtle inner edge, two blue bars and a glowing green light with its
 * specular; unlit, it is frosted translucent glass with white bars and a
 * pale light. The two looks are stacked and cross-fade, since a graded fill
 * cannot ease.
 */
export function ServerTile({ w, lit }: { w: number; lit: boolean }) {
  const ease = useEase()
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={80} vh={34}>
      <defs>
        <BlurDef id={id} sd={2} />
        <Lin id={`${id}-front`} from={R.chassisTop} to={C.tileFrontLo} />
        <Lin id={`${id}-frost`} from="#D7E5FC" to={C.frostFront} />
        <GlowDef id={`${id}-glow`} tone={R.ledGreen} />
        <GlowDef id={`${id}-fglow`} tone={C.frostLed} />
      </defs>
      <Shadow id={id} cx={40} cy={33} rx={34} ry={2.6} o={0.16} />
      <g style={{ opacity: lit ? 0 : 1, transition: ease }}>
        <path d="M 74 8 L 80 2 L 80 26 L 74 32 Z" fill={C.frostSide} opacity={0.7} />
        <path d="M 2 8 L 8 2 L 80 2 L 74 8 Z" fill={C.frostTop} opacity={0.92} />
        <rect x={2} y={8} width={72} height={24} rx={5} fill={`url(#${id}-frost)`} opacity={0.8} />
        <rect x={2} y={8} width={72} height={1.5} rx={0.75} fill="#FFFFFF" opacity={0.6} />
        <rect x={10} y={15} width={28} height={4} rx={2} fill="#FFFFFF" opacity={0.95} />
        <rect x={10} y={22} width={17} height={4} rx={2} fill="#FFFFFF" opacity={0.75} />
        <circle cx={64} cy={20} r={7} fill={`url(#${id}-fglow)`} opacity={0.7} />
        <circle cx={64} cy={20} r={3.6} fill={C.frostLed} />
        <circle cx={62.9} cy={18.9} r={1} fill="#FFFFFF" opacity={0.8} />
      </g>
      <g style={{ opacity: lit ? 1 : 0, transition: ease }}>
        <path d="M 74 8 L 80 2 L 80 26 L 74 32 Z" fill={C.tileSideLit} />
        <path d="M 2 8 L 8 2 L 80 2 L 74 8 Z" fill={C.tileTopLit} />
        <rect x={2} y={8} width={72} height={24} rx={5} fill={`url(#${id}-front)`} />
        <rect x={3} y={9} width={70} height={1.5} rx={0.75} fill="#FFFFFF" opacity={0.16} />
        <rect x={3} y={30} width={70} height={1.5} rx={0.75} fill="#000000" opacity={0.25} />
        <rect x={10} y={15} width={28} height={4} rx={2} fill={R.barA} />
        <rect x={10} y={22} width={17} height={4} rx={2} fill={R.barB} />
        <circle cx={64} cy={20} r={10} fill={`url(#${id}-glow)`} />
        <circle cx={64} cy={20} r={4.2} fill={R.ledGreen} />
        <circle cx={62.7} cy={18.7} r={1.3} fill="#FFFFFF" opacity={0.85} />
      </g>
    </ClaySvg>
  )
}

/**
 * The cables from the cloud to the tiles, as the render draws them: pale
 * blue lines under a soft glow, a bus below the cloud's base, one drop per
 * column running on through every row, faint links between the columns at
 * each row (`rows`, measured from this svg's top; the slide's three tile
 * rows by default), and a small round port where each drop leaves the bus.
 * Flat strokes, sized to their box, no heads, so `overlap-check` does not
 * read an arrow.
 */
export function Cables({ w, h, xs, bus = 8, rows = [26, 58, 90] }: { w: number; h: number; xs: number[]; bus?: number; rows?: number[] }) {
  const x0 = xs[0]
  const x1 = xs[xs.length - 1]
  const drops = `M ${w / 2} 0 V ${bus} M ${x0} ${bus} H ${x1} ${xs.map((x) => `M ${x} ${bus} V ${h}`).join(' ')}`
  const links = rows.map((y) => `M ${x0} ${y} H ${x1}`).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden style={{ display: 'block', overflow: 'visible' }}>
      <path d={drops} stroke={R.cable} strokeWidth={9} strokeLinecap="round" fill="none" opacity={0.22} />
      <path d={links} stroke={R.cable} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.55} />
      <path d={drops} stroke={R.cable} strokeWidth={2.6} strokeLinecap="round" fill="none" />
      <path d={drops} stroke="#FFFFFF" strokeWidth={0.8} strokeLinecap="round" fill="none" opacity={0.5} />
      {xs.map((x) => (
        <g key={x}>
          <circle cx={x} cy={bus} r={6} fill={R.cable} opacity={0.4} />
          <circle cx={x} cy={bus} r={3.6} fill={C.port} />
          <circle cx={x - 0.8} cy={bus - 0.8} r={1.3} fill="#FFFFFF" opacity={0.9} />
        </g>
      ))}
    </svg>
  )
}

/* ------------------------------------------------------------------ the meter */

/** A tapered needle from the hub to `len`, pointing straight up; the caller rotates it. */
const NEEDLE_D = (cx: number, cy: number, len: number) => `M ${cx - 2.6} ${cy} L ${cx - 0.9} ${cy - len} L ${cx + 0.9} ${cy - len} L ${cx + 2.6} ${cy} Z`

/**
 * The pay meter as the render draws it: a glossy blue rounded tile graded
 * from its lit upper left to its deep lower right, a bright bevel along its
 * top and left edges, a darker bottom edge showing its thickness, a soft
 * shadow under it, and a white dial in a pale rim with a soft inner shade,
 * a wide green and pale arc, and a dark tapered needle with a white-dot hub,
 * sweeping to `value` (0 to 1): a bill that follows use.
 */
export function MeterTile({ w, value }: { w: number; value: number }) {
  const ease = useEase(700)
  const id = usePrefix()
  const v = Math.max(0.001, Math.min(1, value))
  const a = -120 + v * 240
  const CX = 50
  const CY = 47
  return (
    <ClaySvg w={w} vw={100} vh={110} large>
      <defs>
        <BlurDef id={id} sd={4} />
        <Lin id={`${id}-tile`} from={R.tileHi} to={R.tileLo} x2={1} y2={1} />
        <linearGradient id={`${id}-bevel`} x1={0} y1={0} x2={1} y2={1}>
          <stop offset="0" stopColor={C.bevel} stopOpacity={0.55} />
          <stop offset="0.5" stopColor={C.bevel} stopOpacity={0.08} />
          <stop offset="1" stopColor={C.bevel} stopOpacity={0} />
        </linearGradient>
        <radialGradient id={`${id}-face`} cx="50%" cy="44%" r="54%">
          <stop offset="0.74" stopColor={C.dialFace} />
          <stop offset="1" stopColor={C.dialFaceEdge} />
        </radialGradient>
        <linearGradient id={`${id}-rim`} x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor={C.dialRim} />
        </linearGradient>
      </defs>
      <Shadow id={id} cx={50} cy={104} rx={40} ry={5} o={0.26} />
      {/* the tile: its thickness, its graded face, the bevel on the lit edges, a gloss across its top */}
      <g>
        <rect x={4} y={12} width={92} height={86} rx={23} fill={R.tileUnder} />
        <rect x={4} y={4} width={92} height={86} rx={23} fill={`url(#${id}-tile)`} />
        <rect x={5.5} y={5.5} width={89} height={83} rx={21.5} fill="none" stroke={`url(#${id}-bevel)`} strokeWidth={2.5} />
        <path d="M 16 8 H 84 A 12 12 0 0 1 96 20 V 34 Q 50 44 4 34 V 20 A 12 12 0 0 1 16 8 Z" fill="#FFFFFF" opacity={0.13} />
      </g>
      {/* the dial: a pale rim, the face with its inner shade, the arc, the needle, the hub */}
      <g>
        <circle cx={CX} cy={CY} r={35} fill={`url(#${id}-rim)`} />
        <circle cx={CX} cy={CY} r={32} fill={`url(#${id}-face)`} />
        <path d={band(CX, CY, 22, 30, -120, 120)} fill={C.arcRest} />
        <path d={band(CX, CY, 22, 30, -120, a)} fill={R.arcGreen} style={{ transition: ease }} />
        <path d={band(CX, CY, 22, 23.5, -120, 120)} fill="#FFFFFF" opacity={0.35} />
        <g style={{ transformBox: 'view-box', transformOrigin: `${CX}px ${CY}px`, transform: `rotate(${a}deg)`, transition: ease }}>
          <path d={NEEDLE_D(CX, CY, 26)} fill={R.needle} />
        </g>
        <circle cx={CX} cy={CY} r={6} fill={R.needle} />
        <circle cx={CX - 1} cy={CY - 1} r={2.1} fill="#FFFFFF" opacity={0.9} />
      </g>
    </ClaySvg>
  )
}
