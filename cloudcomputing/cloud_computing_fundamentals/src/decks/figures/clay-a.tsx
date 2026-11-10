import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { ClaySvg, useEase } from './art'
import { mo } from './motion'
import { R, usePrefix, Shadow, BlurDef, GlowDef, Lin } from './depth'

/**
 * SECTION 1 DRAWINGS IN THE REFERENCE RENDER'S STYLE (user, 2026-10-16,
 * "slide 5 is the image style reference, same style for all"). Every object
 * is a solid the way slide 5's rack, coins, cloud, tiles and meter are:
 * a graded front (lit at the top, shaded at the foot), a lit top face and a
 * shaded side where it is boxy, a thin white inner edge along its top, a
 * specular bloom on its upper left, a glow on every light, and a soft
 * blurred cool shadow on the ground under anything that stands. The
 * finish kit (`useFx`, `Slab`, `Led`) is exported for `clay-b.tsx`.
 *
 * The structure of the clay look stays: `ClaySvg` turns each top-level part
 * with its rim, small details sit inside a part's `<g>`, shadows are
 * `data-flat` with their blur inline, connector lines are the one stroke.
 * Object colours are the Library palette (`P`) and the render's (`R`);
 * slide chrome stays on `colors`. Labels are never drawn inside an svg
 * (content rule 17).
 *
 * MOTION (the motion layer, same day): every loop and seed is where it was;
 * a loop sits on an inner part or on each top-level part with one shared
 * phase, never on an element whose transform a state change drives.
 */

/** The Library palette: an object's own colours (shared with `depth.tsx`). */
export const P = {
  cobalt: '#0055E8',
  sky: '#95C2FB',
  peri: '#5856DC',
  lav: '#D5D8EB',
  yellow: '#FCC82B',
  orange: '#FC963C',
  red: '#D8352F',
  sage: '#829983',
  navy: '#2C3C81',
  charcoal: '#3E3D45',
}

/* ------------------------------------------------------------------ the finish kit */

function mix(c: string, t: string, k: number): string {
  const p = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16))
  const [a, b] = [p(c), p(t)]
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * k).toString(16).padStart(2, '0')).join('')
}
/** A hue lit toward white (a top face, the head of a gradient). */
export const lift = (c: string, k = 0.26) => mix(c, '#FFFFFF', k)
/** A hue shaded toward black (a side face, the foot of a gradient). */
export const drop = (c: string, k = 0.16) => mix(c, '#000000', k)

const GLOWS: Record<string, string> = { green: colors.success, yellow: P.yellow, blue: R.ledBlue, orange: P.orange, red: P.red, cobalt: P.cobalt, sky: P.sky, white: '#FFFFFF' }

export type Fx = {
  id: string
  defs: ReactNode
  /** a vertical gradient of the hue registered under `k`: lit at the top, shaded at the foot */
  g: (k: string) => string
  /** a light's glow in one of the stock tones */
  gl: (tone: keyof typeof GLOWS) => string
  /** the specular bloom: a radial white fade for a rounded form's upper left */
  spec: string
  /** the render's azure cloud, crown to base, and its sky-pale sister */
  cloud: string
  cloudSky: string
  /** a white dial face shaded at its rim */
  dial: string
}

/**
 * The render's finish for one drawing: per-instance ids, a vertical gradient
 * per hue the drawing uses, the stock glows, the cloud gradients, the dial
 * shade, the specular and the shadow blur, all in one `<defs>` placed first
 * inside the svg.
 */
export function useFx(hues: Record<string, string>): Fx {
  const id = usePrefix()
  const defs = (
    <defs>
      <BlurDef id={id} sd={4} />
      {Object.entries(GLOWS).map(([k, c]) => (
        <GlowDef key={k} id={`${id}-gl-${k}`} tone={c} />
      ))}
      {(Object.entries(hues) as [string, string][]).map(([k, c]) => (
        <Lin key={k} id={`${id}-${k}`} from={lift(c)} to={drop(c)} />
      ))}
      <Lin id={`${id}-cloud`} from={R.cloudTop} to={R.cloudBot}>
        <stop offset="0.55" stopColor={R.cloudMid} />
      </Lin>
      <Lin id={`${id}-cloudsky`} from="#D6E7FF" to="#78A9F2">
        <stop offset="0.55" stopColor={P.sky} />
      </Lin>
      <radialGradient id={`${id}-spec`} cx="32%" cy="28%" r="62%">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.55} />
        <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
      </radialGradient>
      <radialGradient id={`${id}-dial`} cx="50%" cy="46%" r="52%">
        <stop offset="0.78" stopColor="#FFFFFF" />
        <stop offset="1" stopColor={R.dialEdge} />
      </radialGradient>
    </defs>
  )
  return {
    id,
    defs,
    g: (k) => `url(#${id}-${k})`,
    gl: (tone) => `url(#${id}-gl-${tone})`,
    spec: `url(#${id}-spec)`,
    cloud: `url(#${id}-cloud)`,
    cloudSky: `url(#${id}-cloudsky)`,
    dial: `url(#${id}-dial)`,
  }
}

/**
 * A boxy solid seen from the upper left, the render's view of its rack: a
 * lit top face, a shaded side face (on the right by default, `side` 'left'
 * for the render's own rack view), a graded front, a white inner edge along
 * the top and a specular. `d` is the depth; 0 draws the front alone.
 */
export function Slab({ x, y, w, h, rx = 6, d = 7, hue, fill, side = 'right', spec = true, edge = true }: { x: number; y: number; w: number; h: number; rx?: number; d?: number; hue: string; fill: string; side?: 'left' | 'right'; spec?: boolean; edge?: boolean }) {
  const dy = d * 0.55
  const sx = side === 'right' ? x + w : x
  const dx = side === 'right' ? d : -d
  return (
    <>
      {d > 0 && <path d={`M ${sx} ${y} L ${sx + dx} ${y - dy} L ${sx + dx} ${y + h - dy} L ${sx} ${y + h} Z`} fill={side === 'right' ? drop(hue, 0.3) : lift(hue, 0.34)} />}
      {d > 0 && <path d={`M ${x} ${y} L ${x + dx} ${y - dy} L ${x + w + dx} ${y - dy} L ${x + w} ${y} Z`} fill={lift(hue, 0.48)} />}
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={fill} />
      {edge && <rect x={x + rx} y={y} width={Math.max(0, w - 2 * rx)} height={1.5} fill="#FFFFFF" opacity={0.22} />}
      {spec && <ellipse cx={x + w * 0.3} cy={y + Math.min(h * 0.16, 10)} rx={w * 0.2} ry={Math.min(h * 0.07, 5)} fill="#FFFFFF" opacity={0.14} />}
    </>
  )
}

/** A light with its glow: the glow circle sits behind the bead, a white point on the bead's upper left. */
export function Led({ cx, cy, r, tone, fill, fx, on = true, motion, style }: { cx: number; cy: number; r: number; tone: keyof typeof GLOWS; fill: string; fx: Fx; on?: boolean; motion?: ReturnType<typeof mo>; style?: CSSProperties }) {
  return (
    <g {...(motion ?? {})} style={{ ...(motion?.style ?? {}), ...(style ?? {}) }}>
      {on && <circle cx={cx} cy={cy} r={r * 2.3} fill={fx.gl(tone)} />}
      <circle cx={cx} cy={cy} r={r} fill={fill} />
      <circle cx={cx - r * 0.32} cy={cy - r * 0.32} r={r * 0.3} fill="#FFFFFF" opacity={on ? 0.8 : 0.2} />
    </g>
  )
}

/** A point at `a` degrees clockwise from straight up, `r` from (cx, cy). */
function polar(cx: number, cy: number, r: number, a: number): [number, number] {
  const t = (a * Math.PI) / 180
  return [cx + r * Math.sin(t), cy - r * Math.cos(t)]
}

/** A filled ring segment from angle a0 to a1 (degrees from up), no stroke. */
export function band(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number): string {
  const big = a1 - a0 > 180 ? 1 : 0
  const [x0, y0] = polar(cx, cy, r1, a0)
  const [x1, y1] = polar(cx, cy, r1, a1)
  const [x2, y2] = polar(cx, cy, r0, a1)
  const [x3, y3] = polar(cx, cy, r0, a0)
  return `M ${x0} ${y0} A ${r1} ${r1} 0 ${big} 1 ${x1} ${y1} L ${x2} ${y2} A ${r0} ${r0} 0 ${big} 0 ${x3} ${y3} Z`
}

/** The deck's cloud outline (art.tsx `CloudShape`), placed and scaled. */
const CLOUD_D = 'M 30 70 C 12 70 2 58 4 46 C 6 34 16 28 28 29 C 30 14 44 4 60 6 C 74 7 84 16 87 27 C 102 25 116 36 116 50 C 116 62 106 70 94 70 Z'

/**
 * The render's cloud: a darker underside set below, the azure body graded
 * crown to base (or the sky-pale sister when `pale`), a specular bloom on
 * the upper left and a brighter crown highlight.
 */
function CloudPart({ x, y, s, fx, pale = false, motion }: { x: number; y: number; s: number; fx: Fx; pale?: boolean; motion?: ReturnType<typeof mo> }) {
  const part = (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={CLOUD_D} transform="translate(0 5)" fill={pale ? '#6F9FE8' : R.cloudUnder} />
      <path d={CLOUD_D} fill={pale ? fx.cloudSky : fx.cloud} />
      <path d={CLOUD_D} fill={fx.spec} opacity={0.6} />
      <ellipse cx={48} cy={20} rx={16} ry={6} fill="#FFFFFF" opacity={0.28} />
    </g>
  )
  /* the loop wraps the scaled group, so its drift is in the svg's own units */
  return motion ? <g {...motion}>{part}</g> : part
}

/** A server rack part: a navy cabinet with `n` units, the first `lit` running; the render's drawer fronts and glowing lights. */
function RackPart({ x, y, w, h, n, lit = n, fx }: { x: number; y: number; w: number; h: number; n: number; lit?: number; fx: Fx }) {
  const uh = (h - 10) / n
  return (
    <g>
      <Slab x={x} y={y} w={w} h={h} rx={Math.min(6, w / 6)} d={Math.min(6, w / 7)} hue={P.navy} fill={fx.g('navy')} spec={false} />
      {Array.from({ length: n }, (_, i) => {
        const on = i < lit
        const uy = y + 5 + i * uh + 1
        return (
          <g key={i}>
            <rect x={x + 4} y={uy} width={w - 8} height={uh - 3} rx={2} fill={on ? fx.g('drawer') : fx.g('idle')} opacity={on ? 1 : 0.7} />
            <rect x={x + 5} y={uy} width={w - 10} height={1} fill="#FFFFFF" opacity={0.14} />
            <rect x={x + 8} y={uy + (uh - 3) * 0.3} width={(w - 8) * 0.42} height={Math.max(1.5, uh / 7)} rx={1} fill={on ? R.barA : R.barIdle} />
            <Led cx={x + w - 9} cy={y + 5 + i * uh + uh / 2} r={Math.max(1.4, uh / 7)} tone="green" fill={on ? colors.success : R.ledOff} fx={fx} on={on} motion={on ? mo('blink', i + x) : undefined} />
          </g>
        )
      })}
    </g>
  )
}

/* ------------------------------------------------------------------ slide 5 */

/** A shipping crate: more servers ordered, on their way. */
export function Crate({ w }: { w: number }) {
  const fx = useFx({ orange: P.orange, yellow: P.yellow, lav: P.lav })
  const idle = mo('hover', 5)
  return (
    <ClaySvg w={w} vw={80} vh={64}>
      {fx.defs}
      <Shadow id={fx.id} cx={40} cy={62} rx={34} ry={3.5} />
      <g {...idle}>
        <Slab x={4} y={14} w={72} h={46} rx={8} d={0} hue={P.orange} fill={fx.g('orange')} />
      </g>
      <g {...idle}>
        <path d="M 10 14 L 24 2 H 70 L 76 14 Z" fill={fx.g('yellow')} />
        <path d="M 24 2 H 70 L 68 4 H 26 Z" fill="#FFFFFF" opacity={0.3} />
        <rect x={35} y={2} width={10} height={12} fill={fx.g('lav')} opacity={0.9} />
      </g>
      <rect x={34} y={14} width={12} height={46} fill={fx.g('lav')} opacity={0.9} data-flat {...idle} />
    </ClaySvg>
  )
}

/** A meter: the render's cobalt tile with its underside and gloss, a white dial that fills to `value` (0 to 1), and its needle. */
export function PayMeter({ w, value }: { w: number; value: number }) {
  const ease = useEase(700)
  const fx = useFx({ tile: R.tileHi })
  const v = Math.max(0.001, Math.min(1, value))
  const a = -120 + v * 240
  return (
    <ClaySvg w={w} vw={80} vh={80}>
      {fx.defs}
      <Shadow id={fx.id} cx={40} cy={79} rx={30} ry={3.5} />
      <g>
        <rect x={4} y={10} width={72} height={68} rx={18} fill={R.tileUnder} />
        <rect x={4} y={4} width={72} height={68} rx={18} fill={fx.g('tile')} />
        <rect x={10} y={7} width={60} height={22} rx={11} fill="#FFFFFF" opacity={0.16} />
        <rect x={9} y={5} width={62} height={1.5} rx={0.75} fill="#FFFFFF" opacity={0.3} />
      </g>
      <g {...mo('pulse', 2)}>
        <circle cx={40} cy={40} r={28} fill={fx.dial} />
        <path d={band(40, 40, 18, 24, -120, 120)} fill={R.arcGrey} />
        <path d={band(40, 40, 18, 24, -120, a)} fill={R.arcGreen} style={{ transition: ease }} />
        <g style={{ transformBox: 'view-box', transformOrigin: '40px 40px', transform: `rotate(${a}deg)`, transition: ease }}>
          <path d="M 37.5 40 L 40 18 L 42.5 40 Z" fill={R.needle} />
        </g>
        <circle cx={40} cy={40} r={4.5} fill={R.needle} />
        <circle cx={39} cy={39} r={1.6} fill="#FFFFFF" opacity={0.8} />
      </g>
    </ClaySvg>
  )
}

/**
 * Pay as you go (review 2026-10-26, the Cost card's cloud well, in place of the dial the user read as a
 * clock): a usage meter whose bars show what was used, green up to `value`, and the coin that pays for it.
 */
export function PayGoMeter({ w, value }: { w: number; value: number }) {
  const ease = useEase(700)
  const fx = useFx({ tile: R.tileHi, gold: P.yellow })
  const used = Math.ceil(Math.max(0, Math.min(1, value)) * 4)
  const idle = mo('hover', 3)
  return (
    <ClaySvg w={w} vw={80} vh={80}>
      {fx.defs}
      <Shadow id={fx.id} cx={40} cy={79} rx={30} ry={3.5} />
      <g>
        <rect x={4} y={10} width={66} height={62} rx={16} fill={R.tileUnder} />
        <rect x={4} y={4} width={66} height={62} rx={16} fill={fx.g('tile')} />
        <rect x={10} y={7} width={54} height={20} rx={10} fill="#FFFFFF" opacity={0.16} />
        <rect x={9} y={5} width={56} height={1.5} rx={0.75} fill="#FFFFFF" opacity={0.3} />
      </g>
      <g {...mo('pulse', 2)}>
        <rect x={12} y={13} width={50} height={32} rx={7} fill={fx.dial} />
        {[0.38, 0.58, 0.8, 1].map((f, i) => (
          <rect key={i} x={18 + i * 10} y={40 - 22 * f} width={7} height={22 * f} rx={2} fill={i < used ? R.arcGreen : R.arcGrey} style={{ transition: ease }} />
        ))}
        <rect x={20} y={52} width={30} height={5} rx={2.5} fill={R.needle} opacity={0.85} />
      </g>
      <g className={idle.className} style={idle.style}>
        <circle cx={61} cy={60} r={16} fill={R.goldSideDark} />
        <circle cx={61} cy={58} r={16} fill={fx.g('gold')} />
        <circle cx={61} cy={58} r={16} fill={fx.spec} opacity={0.5} />
        <circle cx={61} cy={58} r={11.5} fill="none" stroke={R.goldSide} strokeWidth={1.4} opacity={0.8} />
        <path d="M 14 13 H 26 M 14 18 H 26 M 16 13 C 24 13 24 23 16 23 L 25 30" transform="translate(43.5 40.5) scale(0.875)" fill="none" stroke={R.goldSideDark} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </ClaySvg>
  )
}

/** A wall calendar, its page number laid over as DOM. */
export function ClayCalendar({ w, page }: { w: number; page: string }) {
  const fx = useFx({ paper: '#FFFFFF', red: P.red, ring: P.charcoal })
  const idle = mo('hover', 7)
  return (
    <div className={`relative ${idle.className}`} style={{ width: w, height: (w * 84) / 80, ...idle.style }}>
      <ClaySvg w={w} vw={80} vh={84}>
        {fx.defs}
        <Shadow id={fx.id} cx={40} cy={83} rx={30} ry={3.5} />
        <g>
          <rect x={4} y={10} width={72} height={70} rx={12} fill={fx.g('paper')} />
          <rect x={6} y={11} width={68} height={68} rx={11} fill="none" />
        </g>
        <g>
          <path d="M 4 24 A 14 14 0 0 1 16 10 H 64 A 14 14 0 0 1 76 24 V 30 H 4 Z" fill={fx.g('red')} />
          <path d="M 16 10 H 64 A 14 14 0 0 1 72 13 H 8 A 14 14 0 0 1 16 10 Z" fill="#FFFFFF" opacity={0.25} />
        </g>
        <g>
          <rect x={18} y={2} width={8} height={16} rx={4} fill={fx.g('ring')} />
          <rect x={54} y={2} width={8} height={16} rx={4} fill={fx.g('ring')} />
        </g>
      </ClaySvg>
      <span className="absolute inset-x-0 text-center font-heading font-semibold leading-none" style={{ top: w * 0.47, fontSize: w * 0.34, color: P.charcoal }}>
        {page}
      </span>
    </div>
  )
}

/** A stopwatch: a green case with a specular, a white face, the hand at `turn` (0 to 1 of a lap). */
export function ClayStopwatch({ w, turn }: { w: number; turn: number }) {
  const fx = useFx({ green: colors.success, cap: P.charcoal })
  return (
    <ClaySvg w={w} vw={80} vh={92}>
      {fx.defs}
      <Shadow id={fx.id} cx={40} cy={91} rx={30} ry={3.5} />
      <rect x={32} y={2} width={16} height={12} rx={4} fill={fx.g('cap')} />
      <g>
        <circle cx={40} cy={52} r={37} fill={fx.g('green')} />
        <circle cx={40} cy={52} r={37} fill={fx.spec} opacity={0.5} />
      </g>
      <circle cx={40} cy={52} r={28} fill={fx.dial} />
      <g>
        <g className={mo('tick').className} style={{ ...mo('tick').style, transformBox: 'view-box', transformOrigin: '40px 52px' }}>
          <g transform={`rotate(${turn * 360} 40 52)`}>
            <rect x={38} y={30} width={4} height={24} rx={2} fill={R.needle} />
          </g>
        </g>
        <circle cx={40} cy={52} r={4.5} fill={R.needle} />
        <circle cx={39} cy={51} r={1.5} fill="#FFFFFF" opacity={0.8} />
      </g>
    </ClaySvg>
  )
}

/* ------------------------------------------------------------------ slide 7 icons, one style */

function starPath(cx: number, cy: number, r0: number, r1: number): string {
  const pts = Array.from({ length: 10 }, (_, i) => polar(cx, cy, i % 2 ? r0 : r1, i * 36))
  return `M ${pts.map((p) => p.join(' ')).join(' L ')} Z`
}

/** Five characteristics: a star badge. */
export function StarBadge({ w }: { w: number }) {
  const fx = useFx({ cobalt: P.cobalt, gold: P.yellow })
  return (
    <ClaySvg w={w} vw={60} vh={60}>
      {fx.defs}
      <Shadow id={fx.id} cx={30} cy={59} rx={22} ry={3} />
      <g {...mo('pulse', 1)}>
        <circle cx={30} cy={30} r={26} fill={fx.g('cobalt')} />
        <circle cx={30} cy={30} r={26} fill={fx.spec} opacity={0.55} />
      </g>
      <g {...mo('glow', 2)}>
        <path d={starPath(30, 31, 7.5, 16)} fill={fx.g('gold')} />
        <ellipse cx={25} cy={24} rx={5} ry={2.5} fill="#FFFFFF" opacity={0.5} />
      </g>
    </ClaySvg>
  )
}

/** Three service models: three stacked layers, each with a lit top. */
export function LayersIcon({ w }: { w: number }) {
  const fx = useFx({ navy: P.navy, peri: P.peri, sky: P.sky })
  const layer = (y: number) => `M 30 ${y} L 55 ${y + 11} L 30 ${y + 22} L 5 ${y + 11} Z`
  const top = (y: number) => `M 30 ${y} L 55 ${y + 11} L 52 ${y + 11} L 30 ${y + 2} L 8 ${y + 11} L 5 ${y + 11} Z`
  return (
    <ClaySvg w={w} vw={60} vh={60}>
      {fx.defs}
      <Shadow id={fx.id} cx={30} cy={58} rx={24} ry={3} />
      <g {...mo('pulse', 0)}>
        <path d={layer(32)} fill={fx.g('navy')} />
        <path d={top(32)} fill="#FFFFFF" opacity={0.18} />
      </g>
      <g {...mo('pulse', 1)}>
        <path d={layer(20)} fill={fx.g('peri')} />
        <path d={top(20)} fill="#FFFFFF" opacity={0.2} />
      </g>
      <g {...mo('pulse', 2)}>
        <path d={layer(8)} fill={fx.g('sky')} />
        <path d={top(8)} fill="#FFFFFF" opacity={0.35} />
      </g>
    </ClaySvg>
  )
}

/** Four deployment models: a cloud above two buildings. */
export function CloudBuildingIcon({ w }: { w: number }) {
  const fx = useFx({ cobalt: P.cobalt, navy: P.navy })
  return (
    <ClaySvg w={w} vw={60} vh={60}>
      {fx.defs}
      <Shadow id={fx.id} cx={31} cy={58} rx={24} ry={3} />
      <CloudPart x={14} y={2} s={0.36} fx={fx} pale motion={mo('hover', 1)} />
      <g {...mo('pulse', 3)}>
        <Slab x={8} y={26} w={26} h={30} rx={4} d={4} hue={P.cobalt} fill={fx.g('cobalt')} spec={false} />
        {[0, 1, 2].map((r) => [0, 1].map((c) => <rect key={`${r}${c}`} x={13 + c * 10} y={31 + r * 8} width={6} height={5} rx={1} fill="#E3EEFF" opacity={0.95} />))}
      </g>
      <g {...mo('pulse', 4)}>
        <Slab x={36} y={36} w={18} h={20} rx={4} d={3} hue={P.navy} fill={fx.g('navy')} spec={false} />
        {[0, 1].map((r) => (
          <rect key={r} x={42} y={41 + r * 7} width={6} height={4} rx={1} fill={P.yellow} />
        ))}
      </g>
    </ClaySvg>
  )
}

/** The management console: a browser window holding a resource list. */
export function ConsoleIcon({ w }: { w: number }) {
  const fx = useFx({ frame: P.charcoal, page: '#FFFFFF', cobalt: P.cobalt })
  return (
    <ClaySvg w={w} vw={60} vh={60}>
      {fx.defs}
      <Shadow id={fx.id} cx={30} cy={57} rx={24} ry={3} />
      <g>
        <Slab x={4} y={8} w={52} h={44} rx={8} d={0} hue={P.charcoal} fill={fx.g('frame')} spec={false} />
        <circle cx={11} cy={14.5} r={2.2} fill={P.red} />
        <circle cx={18} cy={14.5} r={2.2} fill={P.yellow} />
        <circle cx={25} cy={14.5} r={2.2} fill={P.sage} />
      </g>
      <g>
        <rect x={9} y={21} width={42} height={26} rx={4} fill={fx.g('page')} />
        <rect x={13} y={25} width={10} height={18} rx={2} fill={fx.g('cobalt')} />
        <rect x={26} y={26} width={21} height={4} rx={2} fill={P.orange} {...mo('type', 0)} />
        <rect x={26} y={33} width={17} height={4} rx={2} fill={P.sky} {...mo('type', 1)} />
        <rect x={26} y={40} width={19} height={3} rx={1.5} fill={P.sky} {...mo('type', 2)} />
        <rect x={47} y={39.5} width={2} height={4} rx={1} fill={P.cobalt} {...mo('cursor')} />
      </g>
    </ClaySvg>
  )
}

/* ------------------------------------------------------------------ slide 9 analogy */

/** A furnished flat, cut away: fridge, lamp, sofa under a window, a made bed. Everything already in place. */
export function FurnishedFlat({ w }: { w: number }) {
  const fx = useFx({ wall: P.lav, floor: P.sage, white: '#FFFFFF', cobalt: P.cobalt, navy: P.navy, peri: P.peri, gold: P.yellow, pole: P.charcoal })
  return (
    <ClaySvg w={w} vw={440} vh={262} large>
      {fx.defs}
      {/* the room: back wall and floor */}
      <rect x={0} y={0} width={440} height={204} rx={18} fill={fx.g('wall')} />
      <rect x={0} y={192} width={440} height={70} rx={18} fill={fx.g('floor')} />
      <rect x={14} y={192} width={412} height={1.5} fill="#FFFFFF" opacity={0.25} data-flat />
      {/* the window */}
      <g>
        <rect x={136} y={22} width={112} height={84} rx={10} fill={fx.g('white')} />
        <rect x={144} y={30} width={44} height={68} rx={5} fill={fx.cloudSky} />
        <rect x={196} y={30} width={44} height={68} rx={5} fill={fx.cloudSky} />
        <path d="M 148 34 L 180 34 L 148 70 Z" fill="#FFFFFF" opacity={0.28} />
      </g>
      {/* the fridge */}
      <g {...mo('pulse', 2)}>
        <Shadow id={fx.id} cx={46} cy={202} rx={34} ry={5} o={0.18} />
        <Slab x={16} y={66} w={60} h={132} rx={10} d={6} hue="#E4E8F4" fill={fx.g('white')} />
        <rect x={16} y={110} width={60} height={3} fill={P.lav} />
        <rect x={64} y={80} width={5} height={20} rx={2.5} fill={fx.g('pole')} />
        <rect x={64} y={122} width={5} height={28} rx={2.5} fill={fx.g('pole')} />
      </g>
      {/* the floor lamp: pole and base, then its shade */}
      <g>
        <rect x={98} y={70} width={5} height={122} rx={2.5} fill={fx.g('pole')} />
        <ellipse cx={100.5} cy={194} rx={14} ry={5} fill={drop(P.charcoal, 0.1)} />
      </g>
      <g {...mo('glow', 1)}>
        <ellipse cx={100} cy={78} rx={26} ry={10} fill={fx.gl('yellow')} />
        <path d="M 84 74 L 92 44 H 109 L 117 74 Z" fill={fx.g('gold')} />
        <path d="M 92 44 H 100 L 94 74 H 84 Z" fill="#FFFFFF" opacity={0.3} />
      </g>
      {/* the sofa: back, seat, two arms */}
      <g>
        <Shadow id={fx.id} cx={198} cy={196} rx={76} ry={6} o={0.18} />
        <rect x={136} y={124} width={124} height={48} rx={16} fill={fx.g('cobalt')} />
        <rect x={152} y={124} width={92} height={2} fill="#FFFFFF" opacity={0.28} />
        <rect x={132} y={156} width={132} height={32} rx={12} fill={fx.g('cobalt')} />
        <rect x={146} y={156} width={104} height={2} fill="#FFFFFF" opacity={0.3} />
        <rect x={122} y={142} width={26} height={50} rx={12} fill={fx.g('navy')} />
        <rect x={248} y={142} width={26} height={50} rx={12} fill={fx.g('navy')} />
      </g>
      {/* the bed: headboard, mattress, pillow, blanket */}
      <g>
        <Shadow id={fx.id} cx={360} cy={196} rx={70} ry={6} o={0.18} />
        <rect x={290} y={112} width={20} height={86} rx={8} fill={fx.g('navy')} />
        <rect x={300} y={154} width={128} height={34} rx={10} fill={fx.g('white')} />
        <rect x={306} y={138} width={40} height={20} rx={10} fill={fx.g('white')} />
        <rect x={338} y={148} width={92} height={42} rx={12} fill={fx.g('peri')} />
        <rect x={350} y={148} width={70} height={2} fill="#FFFFFF" opacity={0.3} />
      </g>
      {/* a rug */}
      <g>
        <ellipse cx={198} cy={222} rx={96} ry={18} fill={fx.g('gold')} opacity={0.9} />
        <ellipse cx={178} cy={214} rx={40} ry={5} fill="#FFFFFF" opacity={0.25} />
      </g>
    </ClaySvg>
  )
}

/** Where each cloud resource tile sits in `CloudResources`, centre x in its viewBox (also its width). */
export const RESOURCE_X = [58, 168, 278, 388]
export const RESOURCE_VW = 446

/**
 * Cloud resources, ready to use: the provider's cloud above its servers,
 * storage, network and applications, joined by one bus line. The chips that
 * name them are DOM, laid under each tile at `RESOURCE_X`.
 */
export function CloudResources({ w }: { w: number }) {
  const [sx, st, nx, ax] = RESOURCE_X
  const fx = useFx({ navy: P.navy, drawer: R.drawerTop, idle: R.drawerIdle, peri: P.peri, sky: P.sky, router: P.charcoal, white: '#FFFFFF', cobalt: P.cobalt, orange: P.orange, gold: P.yellow })
  return (
    <ClaySvg w={w} vw={RESOURCE_VW} vh={214} large>
      {fx.defs}
      <Shadow id={fx.id} cx={223} cy={213} rx={200} ry={5} o={0.16} />
      <CloudPart x={123} y={0} s={1.7} fx={fx} motion={mo('hover', 0)} />
      <path d={`M 223 116 V 130 M ${sx} 146 V 130 H ${ax} V 146 M ${st} 130 V 146 M ${nx} 130 V 146`} fill="none" stroke={R.cable} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" data-flat data-draw />
      {/* the flow down the bus: a lighter dash riding the line, cloud to resources */}
      <path d={`M 223 116 V 130 M ${sx} 146 V 130 H ${ax} V 146 M ${st} 130 V 146 M ${nx} 130 V 146`} fill="none" stroke={colors.white} strokeWidth={2} strokeLinecap="round" strokeDasharray="5 9" opacity={0.7} data-flat data-draw {...mo('dash', 0)} />
      {/* servers: a rack */}
      <RackPart x={sx - 30} y={146} w={60} h={66} n={4} fx={fx} />
      {/* storage: three stacked disks */}
      <g>
        {[0, 1, 2].map((i) => {
          const y = 192 - i * 18
          return (
            <g key={i} {...mo('pulse', i + 3)}>
              <path d={`M ${st - 32} ${y - 14} V ${y} A 32 9 0 0 0 ${st + 32} ${y} V ${y - 14} Z`} fill={i === 1 ? fx.g('peri') : fx.g('navy')} />
              <ellipse cx={st} cy={y - 14} rx={32} ry={9} fill={fx.g('sky')} />
              <ellipse cx={st - 10} cy={y - 16} rx={12} ry={3} fill="#FFFFFF" opacity={0.4} />
            </g>
          )
        })}
      </g>
      {/* networks: a router with two aerials */}
      <g>
        <rect x={nx - 26} y={158} width={8} height={26} rx={4} fill={fx.g('router')} />
        <rect x={nx + 18} y={158} width={8} height={26} rx={4} fill={fx.g('router')} />
      </g>
      <g>
        <Slab x={nx - 38} y={178} w={76} h={34} rx={10} d={0} hue={P.charcoal} fill={fx.g('router')} />
        {[0, 1, 2, 3, 4].map((i) => (
          <Led key={i} cx={nx - 22 + i * 11} cy={195} r={3.4} tone={i % 2 ? 'yellow' : 'green'} fill={i % 2 ? P.yellow : colors.success} fx={fx} motion={mo('blink', i + 7)} />
        ))}
      </g>
      {/* applications: a window of app tiles */}
      <g>
        <rect x={ax - 36} y={146} width={72} height={66} rx={10} fill={fx.g('white')} />
        <rect x={ax - 36} y={146} width={72} height={14} rx={7} fill="#E4E9F7" />
        <rect x={ax - 28} y={166} width={25} height={18} rx={5} fill={fx.g('cobalt')} {...mo('pulse', 11)} />
        <rect x={ax + 3} y={166} width={25} height={18} rx={5} fill={fx.g('orange')} {...mo('pulse', 12)} />
        <rect x={ax - 28} y={188} width={25} height={18} rx={5} fill={fx.g('gold')} {...mo('pulse', 13)} />
        <rect x={ax + 3} y={188} width={25} height={18} rx={5} fill={fx.g('peri')} {...mo('pulse', 14)} />
      </g>
    </ClaySvg>
  )
}

/* ------------------------------------------------------------------ slide 10 */

/** On-premise IT: the organisation's own server room, racks inside, a door with a card reader. */
export function OnPremRoom({ w }: { w: number }) {
  const fx = useFx({ wall: P.lav, floor: P.sage, white: '#FFFFFF', navy: P.navy, drawer: R.drawerTop, idle: R.drawerIdle, door: P.navy, reader: P.charcoal })
  return (
    <ClaySvg w={w} vw={260} vh={104} large>
      {fx.defs}
      <rect x={0} y={0} width={260} height={92} rx={12} fill={fx.g('wall')} />
      <rect x={0} y={82} width={260} height={22} rx={10} fill={fx.g('floor')} />
      <rect x={10} y={82} width={240} height={1.5} fill="#FFFFFF" opacity={0.25} data-flat />
      {/* a cooling unit on the wall */}
      <g {...mo('pulse', 9)}>
        <rect x={142} y={12} width={52} height={20} rx={6} fill={fx.g('white')} />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={148} y={17 + i * 5} width={40} height={2} rx={1} fill={P.lav} />
        ))}
      </g>
      <Shadow id={fx.id} cx={75} cy={90} rx={64} ry={4} o={0.2} />
      <RackPart x={16} y={22} w={34} h={66} n={5} fx={fx} />
      <RackPart x={58} y={22} w={34} h={66} n={5} fx={fx} />
      <RackPart x={100} y={22} w={34} h={66} n={5} fx={fx} />
      {/* the door and its card reader */}
      <g>
        <Slab x={206} y={26} w={40} h={64} rx={6} d={0} hue={P.navy} fill={fx.g('door')} />
        <circle cx={238} cy={60} r={3} fill={P.lav} />
      </g>
      <g>
        <rect x={190} y={48} width={10} height={16} rx={3} fill={fx.g('reader')} />
        <Led cx={195} cy={53} r={2} tone="green" fill={colors.success} fx={fx} motion={mo('blink', 21)} />
      </g>
    </ClaySvg>
  )
}

/** Cloud: a cloud above the provider's data centre (rows of servers), reached over the network from a laptop. */
export function CloudDataCentre({ w }: { w: number }) {
  const fx = useFx({ hall: P.sky, navy: P.navy, laptop: P.charcoal, base: P.lav })
  return (
    <ClaySvg w={w} vw={260} vh={104} large>
      {fx.defs}
      <Shadow id={fx.id} cx={110} cy={103} rx={94} ry={4} o={0.2} />
      <CloudPart x={52} y={0} s={0.82} fx={fx} motion={mo('hover', 2)} />
      <path d="M 92 58 V 50 M 132 58 V 50" fill="none" stroke={R.cable} strokeWidth={3} strokeLinecap="round" data-flat />
      <g>
        <Slab x={20} y={56} w={180} h={46} rx={10} d={6} hue={P.sky} fill={fx.g('hall')} spec={false} />
        {[0, 1, 2, 3, 4, 5].map((c) => (
          <g key={c}>
            <rect x={30 + c * 28} y={64} width={22} height={32} rx={3} fill={fx.g('navy')} />
            <rect x={31 + c * 28} y={64} width={20} height={1} fill="#FFFFFF" opacity={0.2} />
            {[0, 1, 2].map((r) => (
              <rect key={r} x={33 + c * 28} y={68 + r * 9} width={16} height={5} rx={1.5} fill={r === 1 && c % 2 ? P.yellow : '#D9E3F7'} {...(r === 1 && c % 2 ? mo('blink', c + 4) : {})} />
            ))}
          </g>
        ))}
      </g>
      <path d="M 168 26 C 214 24 236 40 236 62" fill="none" stroke={P.peri} strokeWidth={3} strokeDasharray="5 6" strokeLinecap="round" data-flat {...mo('dash', 1)} />
      <g {...mo('pulse', 6)}>
        <Slab x={214} y={66} w={44} h={28} rx={5} d={0} hue={P.charcoal} fill={fx.g('laptop')} spec={false} />
        <rect x={218} y={70} width={36} height={20} rx={3} fill={fx.cloudSky} />
        <path d="M 220 72 L 236 72 L 220 84 Z" fill="#FFFFFF" opacity={0.3} />
      </g>
      <rect x={208} y={94} width={56} height={8} rx={4} fill={fx.g('base')} />
    </ClaySvg>
  )
}

/* ------------------------------------------------------------------ slide 6 (review 2026-10-16: the definition gets a picture) */

/** One resource tile of the pool: a white rounded square, lit at its top, over a soft shadow, holding a small mark. */
function PoolTile({ x, y, fx, children }: { x: number; y: number; fx: Fx; children: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={26} cy={54} rx={22} ry={4} fill={R.shadow} opacity={0.18} style={{ filter: `url(#${fx.id}-blur)` }} />
      <rect x={0} y={0} width={52} height={52} rx={12} fill={fx.g('tileWhite')} />
      <rect x={8} y={0} width={36} height={1.5} fill="#FFFFFF" />
      {children}
    </g>
  )
}

/**
 * THE DEFINITION'S PICTURE: the shared pool as one cloud holding the
 * resources the definition lists (network, servers, storage, applications),
 * reached by a client over the network (the connector draws on from the
 * laptop to the cloud: the line explains the access), with one more tile
 * that is provisioned into the pool and released again while `on` cycles
 * (the motion explains "quickly provisioned and released"), and a single
 * switch for the minimal management effort it takes. Labels are the
 * definition itself, beside it as DOM.
 */
export function NistPool({ w, on }: { w: number; on: boolean }) {
  const ease = useEase()
  const fx = useFx({ tileWhite: '#FFFFFF', navy: P.navy, peri: P.peri, sky: P.sky, cobalt: P.cobalt, gold: P.yellow, green: colors.success, laptop: P.navy, base: P.lav })
  const lev = mo('levitate', 0)
  return (
    <ClaySvg w={w} vw={380} vh={320} large>
      {fx.defs}
      {/* the network line: client to pool, drawn on in its entrance slot, a dash riding it toward the pool */}
      {/* audit 2026-10-22: the line ends inside the cloud's foot, under the provisioned tile, so it reads as entering the pool rather than stopping at its edge */}
      <path data-draw data-flat d="M 92 232 C 92 196 124 190 160 170" fill="none" stroke={colors.brand} strokeWidth={3} strokeLinecap="round" />
      <path data-draw data-flat d="M 92 232 C 92 196 124 190 160 170" fill="none" stroke={colors.white} strokeWidth={1.5} strokeLinecap="round" strokeDasharray="5 9" opacity={0.75} {...mo('dash', 2)} />
      {/* the pool: one cloud, drifting with everything it holds (one shared phase) */}
      <g {...lev}>
        <CloudPart x={40} y={8} s={2.5} fx={fx} />
      </g>
      {/* the resources it holds */}
      <g {...lev}>
        <PoolTile x={62} y={96} fx={fx}>
          <path d="M 14 16 L 38 16 L 26 38 Z" fill="none" stroke={P.sky} strokeWidth={2.5} strokeLinejoin="round" />
          <Led cx={14} cy={16} r={5} tone="cobalt" fill={fx.g('cobalt')} fx={fx} motion={mo('glow', 0)} />
          <Led cx={38} cy={16} r={5} tone="cobalt" fill={fx.g('cobalt')} fx={fx} motion={mo('glow', 1)} />
          <Led cx={26} cy={38} r={5} tone="cobalt" fill={fx.g('cobalt')} fx={fx} motion={mo('glow', 2)} />
        </PoolTile>
        <PoolTile x={128} y={96} fx={fx}>
          <rect x={9} y={10} width={34} height={14} rx={4} fill={fx.g('navy')} />
          <rect x={9} y={28} width={34} height={14} rx={4} fill={fx.g('navy')} />
          <rect x={12} y={10} width={28} height={1} fill="#FFFFFF" opacity={0.2} />
          <rect x={12} y={28} width={28} height={1} fill="#FFFFFF" opacity={0.2} />
          <rect x={14} y={15} width={14} height={3.5} rx={1.75} fill={R.barA} />
          <rect x={14} y={33} width={14} height={3.5} rx={1.75} fill={R.barA} />
          <Led cx={37} cy={17} r={2.6} tone="green" fill={colors.success} fx={fx} motion={mo('blink', 3)} />
          <Led cx={37} cy={35} r={2.6} tone="green" fill={colors.success} fx={fx} motion={mo('blink', 4)} />
        </PoolTile>
        <PoolTile x={194} y={96} fx={fx}>
          <g {...mo('pulse', 5)}>
            <rect x={13} y={14} width={26} height={26} fill={fx.g('peri')} />
            <ellipse cx={26} cy={40} rx={13} ry={5} fill={drop(P.peri, 0.2)} />
            <ellipse cx={26} cy={14} rx={13} ry={5} fill={fx.g('sky')} />
            <ellipse cx={22} cy={13} rx={6} ry={2} fill="#FFFFFF" opacity={0.45} />
            <ellipse cx={26} cy={27} rx={13} ry={5} fill="none" stroke={P.lav} strokeWidth={2} />
          </g>
        </PoolTile>
        <PoolTile x={260} y={96} fx={fx}>
          <rect x={9} y={10} width={34} height={32} rx={5} fill={fx.g('sky')} />
          <rect x={9} y={10} width={34} height={9} rx={4} fill={fx.g('cobalt')} />
          <rect x={14} y={25} width={18} height={3.5} rx={1.75} fill={colors.white} {...mo('type', 6)} />
          <rect x={14} y={32} width={12} height={3.5} rx={1.75} fill={colors.white} {...mo('type', 7)} />
        </PoolTile>
      </g>
      {/* the tile provisioned and released: a service, in and out of the pool; its gear turns */}
      <g style={{ transformBox: 'fill-box', transformOrigin: 'center', transform: on ? 'scale(1)' : 'scale(0.2)', opacity: on ? 1 : 0, transition: ease }}>
        <g {...lev}>
          <PoolTile x={161} y={154} fx={fx}>
            <g {...mo('spin', 0, { dur: 10 })}>
              <circle cx={26} cy={26} r={15} fill={fx.g('gold')} />
              {Array.from({ length: 8 }, (_, i) => (
                <rect key={i} x={23} y={6} width={6} height={8} rx={2} fill={fx.g('gold')} transform={`rotate(${i * 45} 26 26)`} />
              ))}
              <circle cx={26} cy={26} r={15} fill={fx.spec} opacity={0.5} />
              <circle cx={26} cy={26} r={6} fill={colors.white} />
            </g>
          </PoolTile>
        </g>
      </g>
      {/* the client: a laptop, on the network */}
      <g {...mo('hover', 3)}>
        <Shadow id={fx.id} cx={92} cy={300} rx={48} ry={4} />
        <Slab x={52} y={232} w={80} h={52} rx={6} d={0} hue={P.navy} fill={fx.g('laptop')} spec={false} />
        <rect x={58} y={238} width={68} height={40} rx={3} fill={fx.cloudSky} />
        <path d="M 60 240 L 92 240 L 60 270 Z" fill="#FFFFFF" opacity={0.28} />
        <path d="M 40 288 H 144 L 138 298 H 46 Z" fill={fx.g('base')} />
      </g>
      {/* the management effort: one switch, throwing itself off and on (track fades, knob slides 40 units) */}
      <g>
        <Shadow id={fx.id} cx={300} cy={286} rx={36} ry={4} />
        <rect x={262} y={246} width={76} height={36} rx={18} fill={fx.g('green')} {...mo('track', 0)} />
        <rect x={276} y={247} width={48} height={1.5} fill="#FFFFFF" opacity={0.35} />
        <g {...mo('knob', 0, { knob: -40 })}>
          <circle cx={320} cy={266} r={14} fill={R.shadow} opacity={0.18} />
          <circle cx={320} cy={264} r={14} fill={colors.white} />
          <circle cx={316} cy={260} r={5} fill="#FFFFFF" opacity={0.9} />
        </g>
      </g>
    </ClaySvg>
  )
}

/* ------------------------------------------------------------------ slide 11 (review 2026-10-16: the back end without its small boxes) */

/** The provider's back end as a building: a cloud on its roof, a door, no windows. */
export function BackEndBuilding({ w }: { w: number }) {
  const fx = useFx({ wall: P.lav, roof: P.cobalt, door: P.navy, white: '#FFFFFF', base: '#B3C4E6' })
  /* audit 2026-10-22: it was a bare slab with a slot for a door and a cloud floating clear of the roof, which read as
     half drawn. Now a finished block: a plinth it stands on, the cloud resting on the roof band, two cooling units on
     the roof, a lintel over a double door with a step, and a service stripe along the wall. Still no windows (review
     2026-10-16). The idle float and pulse are gone with the motion policy; nothing here changes state. */
  return (
    <ClaySvg w={w} vw={220} vh={150}>
      {fx.defs}
      <Shadow id={fx.id} cx={110} cy={148} rx={104} ry={5} />
      <rect x={2} y={136} width={216} height={12} rx={6} fill={fx.g('base')} />
      <CloudPart x={56} y={14} s={0.56} fx={fx} />
      <g>
        <Slab x={14} y={54} w={192} h={84} rx={9} d={8} hue={P.lav} fill={fx.g('wall')} spec={false} />
        <rect x={14} y={54} width={192} height={14} rx={7} fill={fx.g('roof')} />
        <rect x={22} y={55} width={176} height={1.5} fill="#FFFFFF" opacity={0.35} />
        <rect x={14} y={92} width={192} height={5} fill={fx.g('roof')} opacity={0.45} />
      </g>
      {[26, 152].map((x) => (
        <g key={x}>
          <rect x={x} y={42} width={40} height={13} rx={4} fill={fx.g('white')} />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={x + 5} y={45 + i * 3.5} width={30} height={1.6} rx={0.8} fill={P.lav} />
          ))}
        </g>
      ))}
      <rect x={86} y={100} width={48} height={5} rx={2.5} fill={fx.g('roof')} />
      <rect x={92} y={104} width={36} height={34} rx={4} fill={fx.g('door')} />
      <rect x={109.2} y={106} width={1.6} height={30} fill="#FFFFFF" opacity={0.25} />
      <circle cx={104} cy={122} r={1.8} fill={P.lav} />
      <circle cx={116} cy={122} r={1.8} fill={P.lav} />
      <rect x={82} y={136} width={56} height={4} rx={2} fill={fx.g('base')} />
    </ClaySvg>
  )
}
