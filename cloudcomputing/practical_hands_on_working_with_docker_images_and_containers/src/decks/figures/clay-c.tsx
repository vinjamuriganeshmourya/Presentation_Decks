import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { ClaySvg, useEase, type UnitState } from './art'
import { mo, type MotionKind } from './motion'
import { R, usePrefix, Shadow, BlurDef, GlowDef } from './depth'

/**
 * AGENT C'S OBJECTS (review 2026-10-16: slides 29-45), since the same day's
 * "same style for all" drawn the way slide 5's reference render draws its
 * rack, coins, cloud, tiles and meter: every form is a solid lit from the
 * upper left and shaded at its foot, a slab shows a lit top face and a dark
 * side face, a light carries a glow and a specular, and anything standing
 * casts a soft blurred cool shadow. Same contract as `art.tsx` otherwise:
 * one `<svg>` per object sized by `w`, no outlines, every top-level child a
 * part the clay filter turns, labels DOM beside the object (rule 17).
 *
 * Colours: chrome-like parts use `colors`; an object's own colour is the
 * Lab palette below, graded by the depth overlays (`Depth`, `Vol`, `Slab`).
 */

/* ------------------------------------------------------------------ the motion layer (2026-10-16) */

/**
 * Every drawing here carries the motion layer's loop for what it is
 * (`motion.ts`): `mo()` seeds a phase; `seq()` sets one explicitly, so the
 * parts of one object move together, or a window's lines type in sequence.
 * A class goes on an inner `<g>` or a wrapper, never on an element whose
 * inline transform or opacity a state change drives.
 */
function seq(kind: MotionKind, phase: number, dur: number): { className: string; style: CSSProperties } {
  return { className: `mo mo-${kind}`, style: { '--mo-dur': `${dur}s`, '--mo-delay': `${(-phase * dur).toFixed(2)}s` } as CSSProperties }
}

/** A caret blinking at the end of a typed line (catalog: code windows). */
const Caret = ({ x, y, h = 6, fill = colors.white, o = 0.8 }: { x: number; y: number; h?: number; fill?: string; o?: number }) => (
  <g {...mo('cursor')}>
    <rect x={x} y={y} width={2} height={h} rx={1} fill={fill} opacity={o} />
  </g>
)

/* the Library palette (CONTRACTS.md "Art direction"): objects' own colours, the render's hues where it has one */
const LAB = {
  cobalt: R.cloudMid,
  cobaltDeep: R.tileLo,
  sky: '#6DAAFF',
  peri: '#5856DC',
  lav: '#D3E1FB',
  yellow: R.gold,
  orange: '#FC963C',
  red: '#D8352F',
  sage: '#6E9A72',
  navy: R.chassisBot,
  navyLit: R.chassisTop,
  charcoal: '#3E3D45',
  steel: '#B3C4E6',
  wood: '#E0A86A',
  cash: '#2ECC71',
  frost: R.frostFront,
}

/* ------------------------------------------------------------------ the render's depth (user, 2026-10-16) */

/**
 * One set of defs per svg: a lit gradient (white from the upper left), a
 * shade gradient (cool dark at the foot), a specular bloom, the LED glows
 * and a blur for ground shadows. Every form in the svg shares them.
 */
function Depth({ id, sd = 4 }: { id: string; sd?: number }) {
  return (
    <defs>
      <linearGradient id={`${id}-lit`} x1={0} y1={0} x2={0.35} y2={1}>
        <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.42} />
        <stop offset="0.55" stopColor="#FFFFFF" stopOpacity={0} />
      </linearGradient>
      <linearGradient id={`${id}-shade`} x1={0} y1={0} x2={0} y2={1}>
        <stop offset="0.45" stopColor={R.shadow} stopOpacity={0} />
        <stop offset="1" stopColor={R.shadow} stopOpacity={0.34} />
      </linearGradient>
      <linearGradient id={`${id}-gloss`} x1={0} y1={0} x2={0} y2={1}>
        <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.28} />
        <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
      </linearGradient>
      <radialGradient id={`${id}-spec`} cx="50%" cy="50%" r="50%">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.8} />
        <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
      </radialGradient>
      <GlowDef id={`${id}-glow-green`} tone={R.ledGreen} />
      <GlowDef id={`${id}-glow-blue`} tone={R.ledBlue} />
      <GlowDef id={`${id}-glow-red`} tone="#FF5A4F" />
      <GlowDef id={`${id}-glow-gold`} tone={R.goldHi} />
      <BlurDef id={id} sd={sd} />
    </defs>
  )
}

type VolProps = { id: string; x: number; y: number; w: number; h: number; rx?: number; fill: string; edge?: boolean; style?: CSSProperties; opacity?: number; transform?: string; className?: string; children?: ReactNode }

/** A turned form: the base fill, lit from the upper left, shaded at the foot, a white edge along its top. One `<g>`, so it is one clay part. */
function Vol({ id, x, y, w, h, rx = 6, fill, edge = true, style, opacity, transform, className, children }: VolProps) {
  return (
    <g transform={transform} className={className} style={style} opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={fill} />
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={`url(#${id}-lit)`} />
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={`url(#${id}-shade)`} />
      {edge && <rect x={x + Math.min(rx, w / 4) * 0.7} y={y + 1} width={w - Math.min(rx, w / 4) * 1.4} height={1.6} rx={0.8} fill="#FFFFFF" opacity={0.45} />}
      {children}
    </g>
  )
}

/** The same turning for a path. */
function VolPath({ id, d, fill, style, opacity, transform, className, children }: { id: string; d: string; fill: string; style?: CSSProperties; opacity?: number; transform?: string; className?: string; children?: ReactNode }) {
  return (
    <g transform={transform} className={className} style={style} opacity={opacity}>
      <path d={d} fill={fill} />
      <path d={d} fill={`url(#${id}-lit)`} />
      <path d={d} fill={`url(#${id}-shade)`} />
      {children}
    </g>
  )
}

/** A slab: a lit top face and a dark side face carved inside the same bounds (depth `d` up and to the right), the front a `Vol`. */
function Slab({ id, x, y, w, h, rx = 6, fill, d = 5, style, opacity, className, children }: VolProps & { d?: number }) {
  const side = `M ${x + w - d} ${y + d} L ${x + w} ${y} L ${x + w} ${y + h - d} L ${x + w - d} ${y + h} Z`
  const top = `M ${x} ${y + d} L ${x + d} ${y} L ${x + w} ${y} L ${x + w - d} ${y + d} Z`
  return (
    <g className={className} style={style} opacity={opacity}>
      <path d={side} fill={fill} />
      <path d={side} fill={R.shadow} opacity={0.42} />
      <path d={top} fill={fill} />
      <path d={top} fill="#FFFFFF" opacity={0.32} />
      {/* review 2026-10-26 (joints): the front is rounded and the top and side faces are straight, so the
          three corners where they meet showed background notches; strips in each face's colour close them */}
      <rect x={x} y={y + d} width={w - d} height={Math.min(rx, h - d)} fill={fill} />
      <rect x={x} y={y + d} width={w - d} height={Math.min(rx, h - d)} fill="#FFFFFF" opacity={0.32} />
      <rect x={x + w - d - Math.min(rx, w - d)} y={y + d} width={Math.min(rx, w - d)} height={h - d} fill={fill} />
      <rect x={x + w - d - Math.min(rx, w - d)} y={y + d} width={Math.min(rx, w - d)} height={h - d} fill={R.shadow} opacity={0.42} />
      <Vol id={id} x={x} y={y + d} w={w - d} h={h - d} rx={rx} fill={fill}>
        {children}
      </Vol>
    </g>
  )
}

/** A specular bloom on the upper left of a form. */
const Spec = ({ id, cx, cy, rx, ry, o = 1 }: { id: string; cx: number; cy: number; rx: number; ry: number; o?: number }) => <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id}-spec)`} opacity={o} />

/** A light with its glow and a specular dot. */
function Led({ id, cx, cy, r, tone, glow, style, dim = false }: { id: string; cx: number; cy: number; r: number; tone: string; glow?: 'green' | 'blue' | 'red' | 'gold'; style?: CSSProperties; dim?: boolean }) {
  return (
    <g style={style}>
      {glow && !dim && <circle cx={cx} cy={cy} r={r * 2.2} fill={`url(#${id}-glow-${glow})`} />}
      <circle cx={cx} cy={cy} r={r} fill={tone} />
      <circle cx={cx - r * 0.3} cy={cy - r * 0.3} r={r * 0.3} fill="#FFFFFF" opacity={dim ? 0.2 : 0.85} />
    </g>
  )
}

/** A screen that cross-fades between its resting and lit face (gradients cannot ease). */
function Screen({ id, x, y, w, h, rx, lit, ease }: { id: string; x: number; y: number; w: number; h: number; rx: number; lit: boolean; ease: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={LAB.sky} />
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={LAB.cobalt} style={{ opacity: lit ? 1 : 0, transition: ease }} />
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={`url(#${id}-shade)`} opacity={0.5} />
      <rect x={x} y={y} width={w} height={h / 2} rx={rx} fill={`url(#${id}-gloss)`} />
    </g>
  )
}

/* ------------------------------------------------------------------ the cloud */

/** A rich cloud as the render draws it: five puffs in one azure volume graded crown to base, a deeper underside, a crown bloom, a soft contact shadow. */
export function RichCloud({ w }: { w: number }) {
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={220} vh={150} large>
      <defs>
        <linearGradient id={`${id}-body`} gradientUnits="userSpaceOnUse" x1={0} y1={16} x2={0} y2={132}>
          <stop offset="0" stopColor={R.cloudTop} />
          <stop offset="0.55" stopColor={R.cloudMid} />
          <stop offset="1" stopColor={R.cloudBot} />
        </linearGradient>
        <linearGradient id={`${id}-under`} gradientUnits="userSpaceOnUse" x1={0} y1={30} x2={0} y2={120}>
          <stop offset="0" stopColor={R.cloudBot} />
          <stop offset="1" stopColor={R.cloudUnder} />
        </linearGradient>
        <radialGradient id={`${id}-bloom`} cx="40%" cy="30%" r="55%">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.5} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
        <BlurDef id={id} sd={5} />
      </defs>
      <g data-flat {...seq('shadow', 0.5, 7)}>
        <Shadow id={id} cx={112} cy={140} rx={74} ry={6} o={0.24} />
      </g>
      {/* two puffs behind, in the deeper blue, give the cloud its depth; every part levitates on one phase, so the cloud moves as one */}
      <circle cx={156} cy={60} r={32} fill={`url(#${id}-under)`} {...seq('levitate', 0, 7)} />
      <circle cx={52} cy={84} r={26} fill={`url(#${id}-under)`} {...seq('levitate', 0, 7)} />
      {/* the body: one silhouette, so the clay turns it as one soft form */}
      <g {...seq('levitate', 0, 7)}>
        <rect x={20} y={86} width={180} height={50} rx={25} fill={`url(#${id}-under)`} />
        <rect x={20} y={80} width={180} height={50} rx={25} fill={`url(#${id}-body)`} />
        <circle cx={104} cy={62} r={46} fill={`url(#${id}-body)`} />
        <circle cx={62} cy={92} r={32} fill={`url(#${id}-body)`} />
        <circle cx={158} cy={88} r={32} fill={`url(#${id}-body)`} />
        <circle cx={104} cy={62} r={46} fill={`url(#${id}-bloom)`} />
        <ellipse cx={88} cy={34} rx={18} ry={7} fill="#FFFFFF" opacity={0.3} />
        <rect x={30} y={124} width={160} height={3} rx={1.5} fill="#9CC8FF" opacity={0.35} />
      </g>
    </ClaySvg>
  )
}

/* ------------------------------------------------------------------ devices */

/** A laptop: a charcoal lid lit along its top, a screen that fades to cobalt when lit, a pale base, a ground shadow. */
export function ClayLaptop({ w, lit = false }: { w: number; lit?: boolean }) {
  const ease = useEase()
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={160} vh={110}>
      <Depth id={id} />
      <Shadow id={id} cx={80} cy={108} rx={70} ry={4} o={0.2} />
      <g>
        <Vol id={id} x={18} y={4} w={124} h={84} rx={10} fill={LAB.charcoal} />
        <Screen id={id} x={26} y={12} w={108} h={68} rx={6} lit={lit} ease={ease} />
        <rect x={34} y={20} width={92} height={8} rx={4} fill={colors.white} opacity={0.85} />
        <rect x={34} y={36} width={40} height={36} rx={4} fill={colors.white} opacity={0.7} />
        <g {...seq('type', 0, 4.8)}>
          <rect x={80} y={36} width={46} height={6} rx={3} fill={colors.white} opacity={0.7} />
        </g>
        <g {...seq('type', 0.14, 4.8)}>
          <rect x={80} y={48} width={34} height={6} rx={3} fill={colors.white} opacity={0.55} />
        </g>
        <Caret x={117} y={48} />
      </g>
      {/* the base's own pale blue, a lit lip */}
      <VolPath id={id} d="M 4 92 Q 4 88 10 88 H 150 Q 156 88 156 92 L 150 104 Q 148 106 144 106 H 16 Q 12 106 10 104 Z" fill={LAB.lav}>
        <rect x={14} y={89} width={132} height={1.6} rx={0.8} fill="#FFFFFF" opacity={0.6} />
      </VolPath>
    </ClaySvg>
  )
}

/** A phone at real proportions, a navy body with a lit edge and a screen that fades to cobalt. */
export function ClayPhone({ w, lit = false }: { w: number; lit?: boolean }) {
  const ease = useEase()
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={56} vh={114}>
      <Depth id={id} />
      <g>
        <Vol id={id} x={2} y={2} w={52} h={110} rx={12} fill={LAB.navy} />
        <Screen id={id} x={6} y={10} w={44} h={92} rx={7} lit={lit} ease={ease} />
        <rect x={12} y={18} width={32} height={6} rx={3} fill={colors.white} opacity={0.8} />
        {[0, 1, 2, 3].map((i) => (
          <g key={i} {...mo('glow', i)}>
            <rect x={12 + (i % 2) * 17} y={32 + Math.floor(i / 2) * 18} width={15} height={14} rx={4} fill={colors.white} opacity={0.65} />
          </g>
        ))}
        <rect x={20} y={5} width={16} height={2.6} rx={1.3} fill={LAB.charcoal} />
        <Spec id={id} cx={12} cy={16} rx={7} ry={10} o={0.5} />
      </g>
    </ClaySvg>
  )
}

/** A monitor showing a browser window: a gold frame lit along its top, a tab bar, the page, a stand with a shadow. */
export function ClayMonitor({ w, lit = false }: { w: number; lit?: boolean }) {
  const ease = useEase()
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={150} vh={124}>
      <Depth id={id} />
      <Shadow id={id} cx={75} cy={122} rx={44} ry={3.5} o={0.22} />
      <Vol id={id} x={66} y={88} w={18} h={22} rx={4} fill={LAB.charcoal} edge={false} />
      <Vol id={id} x={40} y={106} w={70} h={14} rx={7} fill={LAB.charcoal} />
      <g>
        {/* the frame's own gold */}
        <Vol id={id} x={4} y={4} w={142} h={90} rx={11} fill={LAB.yellow} />
        <rect x={12} y={12} width={126} height={74} rx={6} fill={colors.white} />
        <g>
          <rect x={12} y={12} width={126} height={14} rx={6} fill={LAB.sky} />
          <rect x={12} y={12} width={126} height={14} rx={6} fill={LAB.cobalt} style={{ opacity: lit ? 1 : 0, transition: ease }} />
        </g>
        {[0, 1, 2].map((i) => <circle key={i} cx={20 + i * 8} cy={19} r={2.6} fill={colors.white} />)}
        <rect x={20} y={34} width={46} height={44} rx={4} fill={LAB.lav} />
        <rect x={20} y={34} width={46} height={44} rx={4} fill={`url(#${id}-shade)`} opacity={0.5} />
        <g {...seq('type', 0, 4.8)}>
          <rect x={74} y={34} width={56} height={7} rx={3.5} fill={LAB.sky} />
          <rect x={74} y={34} width={56} height={7} rx={3.5} fill={LAB.cobalt} style={{ opacity: lit ? 1 : 0, transition: ease }} />
        </g>
        <g {...seq('type', 0.14, 4.8)}>
          <rect x={74} y={48} width={44} height={6} rx={3} fill={LAB.lav} />
        </g>
        <g {...seq('type', 0.28, 4.8)}>
          <rect x={74} y={60} width={50} height={6} rx={3} fill={LAB.lav} />
        </g>
        <Caret x={127} y={60} fill={LAB.lav} o={1} />
      </g>
    </ClaySvg>
  )
}

/** A terminal window: a charcoal slab, a navy title bar, three window dots, green command lines with a glow. */
export function ClayTerminal({ w, lit = false }: { w: number; lit?: boolean }) {
  const ease = useEase()
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={140} vh={100}>
      <Depth id={id} />
      <Shadow id={id} cx={70} cy={98} rx={60} ry={4} o={0.2} />
      <g>
        <Vol id={id} x={4} y={4} w={132} h={92} rx={12} fill={LAB.charcoal} edge={false} />
        <Vol id={id} x={4} y={4} w={132} h={18} rx={9} fill={LAB.navyLit} />
        {[LAB.red, LAB.yellow, R.ledGreen].map((c, i) => <Led key={i} id={id} cx={16 + i * 11} cy={13} r={3.4} tone={c} />)}
        {[0, 1, 2].map((i) => (
          <g key={i} style={{ opacity: lit ? 1 : 0.55, transition: ease }}>
            <g {...seq('type', i * 0.14, 4.8)}>
              <path d={`M 16 ${36 + i * 18} l 6 4 l -6 4`} fill="none" stroke={R.ledGreen} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
              <rect x={28} y={36 + i * 18} width={i === 1 ? 46 : 78} height={7} rx={3.5} fill={R.ledGreen} opacity={0.85} />
            </g>
          </g>
        ))}
        <Caret x={110} y={72} h={7} fill={R.ledGreen} />
      </g>
    </ClaySvg>
  )
}

/* ------------------------------------------------------------------ servers */

/** One server unit as the render's tile: a navy slab with a lit top face, two blue bars, a glowing status light; frosted when idle or off. */
export function ClayServer({ w, state = 'run' }: { w: number; state?: UnitState }) {
  const ease = useEase()
  const id = usePrefix()
  const live = state === 'run' || state === 'hot'
  return (
    <ClaySvg w={w} vw={84} vh={32}>
      <Depth id={id} sd={2} />
      <g style={{ opacity: state === 'idle' ? 0.75 : 1, transition: ease }}>
        <Slab id={id} x={2} y={2} w={80} h={28} rx={7} fill={LAB.frost} d={4} />
        <Slab id={id} x={2} y={2} w={80} h={28} rx={7} fill={LAB.navy} d={4} style={{ opacity: live ? 1 : 0, transition: ease }} />
        <rect x={12} y={12} width={34} height={4.5} rx={2.2} fill={live ? R.barA : colors.white} opacity={state === 'off' ? 0 : 0.9} style={{ transition: ease }} />
        <rect x={12} y={20} width={22} height={4.5} rx={2.2} fill={live ? R.barB : colors.white} opacity={state === 'off' ? 0 : 0.6} style={{ transition: ease }} />
        <g {...mo('blink', 1)}>
          <Led id={id} cx={68} cy={17} r={4.5} tone={state === 'hot' ? '#FF5A4F' : live ? R.ledGreen : R.ledFrost} glow={state === 'hot' ? 'red' : 'green'} dim={!live} style={{ transition: ease }} />
        </g>
      </g>
    </ClaySvg>
  )
}

/** A rack cabinet as the render's: a navy cabinet with a lit top and dark side, frosted units each with its glowing light, on a soft shadow. */
export function ClayRack({ w, units }: { w: number; units: UnitState[] }) {
  const ease = useEase()
  const id = usePrefix()
  const H = 30 + units.length * 34
  return (
    <ClaySvg w={w} vw={120} vh={H}>
      <Depth id={id} />
      <Shadow id={id} cx={60} cy={H - 3} rx={56} ry={4} o={0.24} />
      <Slab id={id} x={4} y={4} w={112} h={H - 12} rx={12} fill={LAB.navy} d={6} />
      {units.map((u, i) => {
        const y = 18 + i * 34
        const live = u === 'run' || u === 'hot'
        return (
          <g key={i}>
            <g style={{ transition: ease }}>
              <Vol id={id} x={14} y={y} w={90} h={27} rx={7} fill={u === 'off' ? LAB.charcoal : LAB.frost} opacity={u === 'idle' ? 0.6 : 1} style={{ transition: ease }} />
              {u !== 'off' && (
                <>
                  <rect x={24} y={y + 8} width={40} height={4.5} rx={2.2} fill={live ? LAB.cobalt : LAB.charcoal} opacity={live ? 0.9 : 0.4} />
                  <rect x={24} y={y + 16} width={26} height={4.5} rx={2.2} fill={live ? LAB.cobalt : LAB.charcoal} opacity={live ? 0.55 : 0.3} />
                  <g {...mo('blink', i + 3)}>
                    <Led id={id} cx={93} cy={y + 14} r={4.5} tone={u === 'hot' ? '#FF5A4F' : live ? R.ledGreen : LAB.charcoal} glow={u === 'hot' ? 'red' : 'green'} dim={!live} />
                  </g>
                </>
              )}
            </g>
          </g>
        )
      })}
    </ClaySvg>
  )
}

/** A tenant's badge: a turned tile in the tenant's colour with an office block on it (a customer, no face). */
/**
 * A small padlock that still reads as a padlock (user, 2026-10-22: "icons are not completely in
 * shape, for example the lock"): a thick rounded shackle standing on a rounded body with a keyhole,
 * drawn in one tone (white on a coloured slice) with a darker inset for depth. Never under 18px.
 */
export function ClayLockIcon({ w, tone = '#FFFFFF' }: { w: number; tone?: string }) {
  return (
    <ClaySvg w={Math.max(18, w)} vw={40} vh={48}>
      <path d="M 11 24 V 15 A 9 9 0 0 1 29 15 V 24" fill="none" stroke={tone} strokeWidth={6} strokeLinecap="round" />
      <rect x={4} y={22} width={32} height={24} rx={6} fill={tone} />
      <rect x={4} y={34} width={32} height={12} rx={6} fill="#000000" opacity={0.12} data-flat />
      <circle cx={20} cy={32} r={3.4} fill="#000000" opacity={0.35} data-flat />
      <rect x={18.4} y={33} width={3.2} height={7} rx={1.6} fill="#000000" opacity={0.35} data-flat />
    </ClaySvg>
  )
}

export function TenantTile({ w, tone }: { w: number; tone: string }) {
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={64} vh={64}>
      <Depth id={id} sd={2} />
      <Vol id={id} x={2} y={2} w={60} h={60} rx={16} fill={tone}>
        <Spec id={id} cx={14} cy={12} rx={9} ry={6} o={0.6} />
      </Vol>
      <g>
        <Vol id={id} x={18} y={14} w={28} h={38} rx={5} fill={colors.white} edge={false} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={23 + (i % 2) * 11} y={19 + Math.floor(i / 2) * 9} width={7} height={5} rx={1.5} fill={tone} opacity={0.75} />
        ))}
        <rect x={28} y={44} width={8} height={8} rx={2} fill={tone} />
      </g>
    </ClaySvg>
  )
}

/* ------------------------------------------------------------------ the old path: approval desks */

/** The manager's approval: a clipboard with a form and a red stamp. */
export function ClayClipboard({ w }: { w: number }) {
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={80} vh={96}>
      <Depth id={id} />
      <Shadow id={id} cx={40} cy={94} rx={30} ry={3} o={0.2} />
      {/* the board's own orange */}
      <Vol id={id} x={6} y={10} w={68} h={82} rx={10} fill={LAB.orange} />
      <g>
        <Vol id={id} x={14} y={20} w={52} h={64} rx={5} fill={colors.white} edge={false} />
        <rect x={22} y={30} width={30} height={5} rx={2.5} fill={LAB.charcoal} opacity={0.7} />
        <rect x={22} y={42} width={36} height={4} rx={2} fill={LAB.lav} />
        <rect x={22} y={51} width={28} height={4} rx={2} fill={LAB.lav} />
        <g>
          <circle cx={50} cy={70} r={9} fill={LAB.red} opacity={0.85} />
          <circle cx={50} cy={70} r={9} fill={`url(#${id}-lit)`} />
        </g>
      </g>
      <Vol id={id} x={26} y={4} w={28} h={14} rx={5} fill={LAB.charcoal} />
    </ClaySvg>
  )
}

/** Finance: a calculator beside a stack of gold coins, each a turned disc with a specular. */
export function ClayCalculator({ w }: { w: number }) {
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={100} vh={96}>
      <Depth id={id} />
      <Shadow id={id} cx={50} cy={94} rx={44} ry={3.5} o={0.2} />
      <g>
        <Slab id={id} x={4} y={4} w={60} h={88} rx={10} fill={LAB.peri} d={4} />
        <rect x={12} y={14} width={44} height={18} rx={4} fill={LAB.lav} />
        <rect x={12} y={14} width={44} height={18} rx={4} fill={`url(#${id}-shade)`} opacity={0.5} />
        {Array.from({ length: 12 }, (_, i) =>
          i === 11 ? (
            <g key={i}>
              <Vol id={id} x={12 + (i % 3) * 16} y={38 + Math.floor(i / 3) * 13} w={12} h={9} rx={3} fill={LAB.orange} edge={false} />
            </g>
          ) : (
            <rect key={i} x={12 + (i % 3) * 16} y={38 + Math.floor(i / 3) * 13} width={12} height={9} rx={3} fill={colors.white} opacity={0.85} />
          ),
        )}
      </g>
      {/* the coins' own gold: one phase, so the stack hovers as one */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={67} y={82 - i * 9} width={30} height={8} rx={4} fill={R.goldSide} />
          <ellipse cx={82} cy={82 - i * 9} rx={15} ry={6} fill={R.gold} />
          <ellipse cx={82} cy={82 - i * 9} rx={15} ry={6} fill={`url(#${id}-lit)`} />
          <ellipse cx={78} cy={80 - i * 9} rx={6} ry={2} fill={R.goldShine} opacity={0.7} />
        </g>
      ))}
    </ClaySvg>
  )
}

/** The IT desk: a monitor with a red toolbox in front of it. */
export function ClayItDesk({ w }: { w: number }) {
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={110} vh={96}>
      <Depth id={id} />
      <Shadow id={id} cx={55} cy={94} rx={42} ry={3.5} o={0.22} />
      <Vol id={id} x={47} y={56} w={14} h={10} rx={3} fill={LAB.charcoal} edge={false} />
      <g>
        <Vol id={id} x={14} y={4} w={80} h={56} rx={9} fill={LAB.charcoal} />
        <rect x={21} y={11} width={66} height={42} rx={5} fill={LAB.sky} />
        <rect x={21} y={11} width={66} height={42} rx={5} fill={`url(#${id}-shade)`} opacity={0.5} />
        <rect x={21} y={11} width={66} height={20} rx={5} fill={`url(#${id}-gloss)`} />
        <g {...seq('type', 0, 4.8)}>
          <rect x={28} y={18} width={34} height={5} rx={2.5} fill={colors.white} />
        </g>
        <g {...seq('type', 0.14, 4.8)}>
          <rect x={28} y={28} width={46} height={5} rx={2.5} fill={colors.white} opacity={0.7} />
        </g>
        <Caret x={77} y={28} h={5} />
      </g>
      {/* the toolbox's own red */}
      <g>
        <Slab id={id} x={20} y={70} w={70} h={24} rx={7} fill={LAB.red} d={4} />
        <VolPath id={id} d="M 44 72 V 66 Q 44 62 48 62 H 62 Q 66 62 66 66 V 72 H 61 V 67 H 49 V 72 Z" fill={LAB.red} />
        <rect x={26} y={80} width={56} height={4} rx={2} fill={colors.white} opacity={0.35} />
      </g>
    </ClaySvg>
  )
}

/** A procurement ticket: a gold slip with a lit edge; `struck` lays a red bar across it. */
export function ClayTicket({ w, struck = false }: { w: number; struck?: boolean }) {
  const ease = useEase()
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={92} vh={62}>
      <Depth id={id} />
      <Shadow id={id} cx={46} cy={60} rx={40} ry={3} o={0.2} />
      <g>
        <g>
          <VolPath id={id} d="M 10 6 H 82 Q 88 6 88 12 V 22 A 9 9 0 0 0 88 40 V 50 Q 88 56 82 56 H 10 Q 4 56 4 50 V 40 A 9 9 0 0 0 4 22 V 12 Q 4 6 10 6 Z" fill={LAB.yellow}>
            <rect x={12} y={7} width={68} height={1.6} rx={0.8} fill="#FFFFFF" opacity={0.5} />
          </VolPath>
          <rect x={16} y={16} width={40} height={6} rx={3} fill={LAB.charcoal} opacity={0.75} />
          <rect x={16} y={28} width={54} height={4.5} rx={2.2} fill={colors.white} opacity={0.8} />
          <rect x={16} y={37} width={44} height={4.5} rx={2.2} fill={colors.white} opacity={0.8} />
        </g>
        <rect x={6} y={27} width={80} height={8} rx={4} fill={LAB.red} transform="rotate(-24 46 31)" style={{ opacity: struck ? 1 : 0, transition: ease }} />
      </g>
    </ClaySvg>
  )
}

/** A wall calendar, its weeks crossed off; the number is a DOM label beside it. */
export function ClayCalendar({ w, crossed = 6 }: { w: number; crossed?: number }) {
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={90} vh={90}>
      <Depth id={id} />
      <Shadow id={id} cx={45} cy={88} rx={38} ry={3} o={0.2} />
      <g>
        <Vol id={id} x={4} y={10} w={82} h={76} rx={10} fill={colors.white} edge={false} />
        {Array.from({ length: 12 }, (_, i) =>
          i < crossed ? (
            <g key={i} {...seq('glow', i / 12, 2.8)}>
              <rect x={12 + (i % 4) * 18} y={36 + Math.floor(i / 4) * 15} width={13} height={10} rx={3} fill={LAB.red} opacity={0.8} />
              <rect x={12 + (i % 4) * 18} y={36 + Math.floor(i / 4) * 15} width={13} height={10} rx={3} fill={`url(#${id}-lit)`} />
            </g>
          ) : (
            <rect key={i} x={12 + (i % 4) * 18} y={36 + Math.floor(i / 4) * 15} width={13} height={10} rx={3} fill={LAB.lav} />
          ),
        )}
      </g>
      {/* the binding's own red */}
      <Vol id={id} x={4} y={10} w={82} h={20} rx={10} fill={LAB.red} />
      <g>
        <Vol id={id} x={22} y={3} w={7} h={14} rx={3.5} fill={LAB.charcoal} edge={false} />
        <Vol id={id} x={61} y={3} w={7} h={14} rx={3.5} fill={LAB.charcoal} edge={false} />
      </g>
    </ClaySvg>
  )
}

/* ------------------------------------------------------------------ the ATM */

/** An ATM set into a wall: the screen, keypad, card slot and cash slot, a navy slab in a pale wall. */
export function ClayAtm({ w, card = false, cash = false, lit = false }: { w: number; card?: boolean; cash?: boolean; lit?: boolean }) {
  const ease = useEase()
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={120} vh={164}>
      <Depth id={id} />
      {/* the wall's own pale blue */}
      <Vol id={id} x={0} y={0} w={120} h={164} rx={14} fill={LAB.lav} edge={false} />
      <Slab id={id} x={14} y={12} w={92} h={142} rx={12} fill={LAB.navy} d={5} />
      <g>
        <Screen id={id} x={24} y={24} w={72} h={46} rx={7} lit={lit} ease={ease} />
        <g {...seq('type', 0, 4.8)}>
          <rect x={32} y={34} width={40} height={6} rx={3} fill={colors.white} opacity={0.85} />
        </g>
        <g {...seq('type', 0.14, 4.8)}>
          <rect x={32} y={46} width={28} height={6} rx={3} fill={colors.white} opacity={0.6} />
        </g>
        <Caret x={63} y={46} />
      </g>
      <g>
        {Array.from({ length: 9 }, (_, i) => (
          <Vol key={i} id={id} x={28 + (i % 3) * 15} y={82 + Math.floor(i / 3) * 13} w={11} h={9} rx={3} fill={LAB.lav} edge={false} />
        ))}
      </g>
      <g>
        <rect x={78} y={86} width={18} height={6} rx={3} fill={LAB.charcoal} />
        {/* the card's own gold */}
        <rect x={81} y={74} width={12} height={14} rx={2} fill={LAB.yellow} style={{ transformBox: 'view-box', transformOrigin: '87px 88px', transform: `scaleY(${card ? 1 : 0})`, transition: ease }} />
      </g>
      <g>
        <rect x={32} y={130} width={56} height={8} rx={4} fill={LAB.charcoal} />
        {/* the cash note's own green */}
        <rect x={38} y={134} width={44} height={22} rx={3} fill={LAB.cash} style={{ transformBox: 'view-box', transformOrigin: '60px 134px', transform: `scaleY(${cash ? 1 : 0})`, transition: ease }} />
      </g>
    </ClaySvg>
  )
}

/** A bank counter with its shutter down: no queue and no clerk. */
export function ClosedCounter({ w }: { w: number }) {
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={150} vh={104}>
      <Depth id={id} />
      <Vol id={id} x={4} y={4} w={142} h={58} rx={10} fill={LAB.lav} edge={false} />
      <g>
        <Vol id={id} x={22} y={12} w={106} h={46} rx={6} fill={LAB.steel} />
        {[0, 1, 2, 3].map((i) => <rect key={i} x={26} y={18 + i * 10} width={98} height={4} rx={2} fill={colors.white} opacity={0.6} />)}
      </g>
      {/* the counter top's own wood */}
      <Vol id={id} x={0} y={58} w={150} h={12} rx={6} fill={LAB.wood} />
      <Slab id={id} x={6} y={68} w={138} h={34} rx={8} fill={LAB.navy} d={4} />
    </ClaySvg>
  )
}

/* ------------------------------------------------------------------ the mess kitchen */

const FOOD = [LAB.yellow, R.ledGreen, LAB.orange]

/** A serving counter with three steel pots, shared by everyone; `served` lowers what is left. */
export function ClayMessCounter({ w, served = 0 }: { w: number; served?: number }) {
  const ease = useEase()
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={250} vh={110} large>
      <Depth id={id} />
      {FOOD.map((f, i) => (
        <g key={i}>
          <Vol id={id} x={14 + i * 78} y={18} w={66} h={42} rx={14} fill={LAB.steel} edge={false}>
            <Spec id={id} cx={30 + i * 78} cy={30} rx={10} ry={6} o={0.6} />
          </Vol>
          <ellipse cx={47 + i * 78} cy={22} rx={30} ry={8} fill={f} style={{ opacity: 1 - served * 0.12, transition: ease }} />
          <ellipse cx={47 + i * 78} cy={22} rx={30} ry={8} fill={`url(#${id}-lit)`} style={{ opacity: 1 - served * 0.12, transition: ease }} />
          <Vol id={id} x={8 + i * 78} y={30} w={8} h={10} rx={4} fill={LAB.steel} edge={false} />
          <Vol id={id} x={78 + i * 78} y={30} w={8} h={10} rx={4} fill={LAB.steel} edge={false} />
        </g>
      ))}
      {/* the counter top's own wood */}
      <Vol id={id} x={2} y={56} w={246} h={14} rx={7} fill={LAB.wood} />
      <Slab id={id} x={8} y={68} w={234} h={40} rx={10} fill={LAB.sage} d={5} />
      <g>
        <Vol id={id} x={210} y={2} w={6} h={30} rx={3} fill={LAB.charcoal} edge={false} />
        <ellipse cx={213} cy={32} rx={9} ry={6} fill={LAB.charcoal} />
        <ellipse cx={213} cy={32} rx={9} ry={6} fill={`url(#${id}-lit)`} />
      </g>
    </ClaySvg>
  )
}

/** A steel plate with up to three portions. */
export function ClayPlate({ w, portions = 0 }: { w: number; portions?: number }) {
  const ease = useEase()
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={60} vh={34}>
      <Depth id={id} sd={2} />
      <g>
        <ellipse cx={30} cy={21} rx={28} ry={13} fill={LAB.steel} />
        <ellipse cx={30} cy={19} rx={28} ry={13} fill={LAB.steel} />
        <ellipse cx={30} cy={19} rx={28} ry={13} fill={`url(#${id}-lit)`} />
        <ellipse cx={30} cy={19} rx={20} ry={8} fill={`url(#${id}-shade)`} opacity={0.5} />
      </g>
      <g>
        {FOOD.map((f, i) => (
          <g key={i} style={{ opacity: i < portions ? 1 : 0, transition: ease, transitionDelay: `${i * 120}ms` }}>
            <ellipse cx={17 + i * 13} cy={17} rx={6.5} ry={4.5} fill={f} />
            <ellipse cx={17 + i * 13} cy={17} rx={6.5} ry={4.5} fill={`url(#${id}-lit)`} />
          </g>
        ))}
      </g>
    </ClaySvg>
  )
}

/** A gas stove: the dedicated thing pooling replaces. */
export function ClayStove({ w }: { w: number }) {
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={70} vh={44}>
      <Depth id={id} sd={2} />
      <Slab id={id} x={2} y={16} w={66} h={26} rx={8} fill={LAB.charcoal} d={4} />
      <g {...mo('glow', 1)}>
        <ellipse cx={20} cy={18} rx={12} ry={6} fill={LAB.navy} />
        <ellipse cx={50} cy={18} rx={12} ry={6} fill={LAB.navy} />
        <ellipse cx={20} cy={18} rx={12} ry={6} fill={`url(#${id}-lit)`} />
        <ellipse cx={50} cy={18} rx={12} ry={6} fill={`url(#${id}-lit)`} />
      </g>
      <g>
        <Led id={id} cx={20} cy={33} r={3.5} tone={LAB.lav} />
        <Led id={id} cx={50} cy={33} r={3.5} tone={LAB.lav} />
      </g>
    </ClaySvg>
  )
}

/* ------------------------------------------------------------------ the rubber band */

/**
 * A rubber band on a board, round two pegs; `stretch` (0 to 1) pulls the pegs
 * apart. The band is a chunky loop: its outer form in the band's red, its
 * hole in the board's wood, so the clay turns both. The board and the pegs
 * are lit from the upper left; the band's geometry is the state's.
 */
export function ClayBand({ w, stretch }: { w: number; stretch: number }) {
  const ease = useEase(640)
  const id = usePrefix()
  /*
    THE BAND STRETCHES BY TRANSFORMS ONLY (user 2026-10-22: transform and opacity, 60fps). It is drawn once at
    its middle stretch (half-width 68, half-height 21, wall 9) as a stadium in three parts, two round caps and
    the straight middle, each with its own origin: the caps slide out and scale, the middle scales wider and
    flatter about the centre, the pegs slide with the caps. No x, width or height is ever animated.
  */
  const spread = 32 + stretch * 72
  const hh = 24 - stretch * 6
  const t = 11 - stretch * 4
  const dx = spread - 68
  const sy = hh / 21
  const sx = spread / 68
  const inner = (hh - t) / 12
  const vb: CSSProperties = { transformBox: 'view-box', transition: ease }
  const capL = (k: number): CSSProperties => ({ ...vb, transformOrigin: '52px 50px', transform: `translateX(${-dx}px) scale(${k})` })
  const capR = (k: number): CSSProperties => ({ ...vb, transformOrigin: '188px 50px', transform: `translateX(${dx}px) scale(${k})` })
  const mid = (k: number): CSSProperties => ({ ...vb, transformOrigin: '120px 50px', transform: `scale(${sx}, ${k})` })
  const stadium = (fill: string, r: number, k: number) => (
    <>
      <circle cx={52} cy={50} r={r} fill={fill} style={capL(k)} />
      <rect x={52} y={50 - r} width={136} height={r * 2} fill={fill} style={mid(k)} />
      <circle cx={188} cy={50} r={r} fill={fill} style={capR(k)} />
    </>
  )
  return (
    <ClaySvg w={w} vw={240} vh={100} large>
      <Depth id={id} />
      <Shadow id={id} cx={120} cy={92} rx={112} ry={5} o={0.2} />
      {/* the board's own wood */}
      <Vol id={id} x={4} y={16} w={232} h={68} rx={18} fill={LAB.wood} />
      <g>
        {stadium(LAB.red, 21, sy)}
        {stadium(`url(#${id}-lit)`, 21, sy)}
        {stadium(LAB.wood, 12, inner)}
      </g>
      <g style={{ ...vb, transform: `translateX(${-dx}px)` }}>
        <circle cx={52} cy={50} r={10} fill={LAB.navy} />
        <circle cx={52} cy={50} r={10} fill={`url(#${id}-lit)`} />
      </g>
      <g style={{ ...vb, transform: `translateX(${dx}px)` }}>
        <circle cx={188} cy={50} r={10} fill={LAB.navy} />
        <circle cx={188} cy={50} r={10} fill={`url(#${id}-lit)`} />
      </g>
    </ClaySvg>
  )
}

/* ------------------------------------------------------------------ the house and its meter */

/** A house front: red roof, pale walls, a cobalt door, windows that glow. */
export function ClayHouse({ w, lit = true }: { w: number; lit?: boolean }) {
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={120} vh={110}>
      <Depth id={id} />
      <Shadow id={id} cx={60} cy={108} rx={50} ry={3.5} o={0.22} />
      <Vol id={id} x={16} y={44} w={88} h={62} rx={8} fill={LAB.lav} edge={false} />
      {/* the roof's own red */}
      <VolPath id={id} d="M 6 50 Q 2 46 7 42 L 54 8 Q 60 4 66 8 L 113 42 Q 118 46 114 50 Z" fill={LAB.red}>
        <path d="M 14 44 L 56 12 L 64 12" fill="none" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" opacity={0.4} />
      </VolPath>
      <Vol id={id} x={50} y={70} w={20} h={36} rx={6} fill={LAB.cobalt} />
      <g {...mo('glow', 0)}>
        {lit && <rect x={20} y={56} width={26} height={24} rx={8} fill={`url(#${id}-glow-gold)`} />}
        {lit && <rect x={74} y={56} width={26} height={24} rx={8} fill={`url(#${id}-glow-gold)`} />}
        <rect x={24} y={60} width={18} height={16} rx={4} fill={lit ? LAB.yellow : LAB.sky} />
        <rect x={78} y={60} width={18} height={16} rx={4} fill={lit ? LAB.yellow : LAB.sky} />
        <rect x={24} y={60} width={18} height={8} rx={4} fill={`url(#${id}-gloss)`} />
        <rect x={78} y={60} width={18} height={8} rx={4} fill={`url(#${id}-gloss)`} />
      </g>
    </ClaySvg>
  )
}

/** A household electricity meter: a pale box with a white dial on a shaded rim and a turning wheel (`spin`, the sign that power is counted). */
export function ElectricMeter({ w, value, spin = false }: { w: number; value: number; spin?: boolean }) {
  const ease = useEase(700)
  const id = usePrefix()
  const a = -110 + Math.max(0, Math.min(1, value)) * 220
  return (
    <ClaySvg w={w} vw={110} vh={130}>
      <Depth id={id} />
      <Shadow id={id} cx={55} cy={128} rx={46} ry={3.5} o={0.22} />
      <Slab id={id} x={4} y={4} w={102} h={122} rx={16} fill={LAB.lav} d={5} />
      <g>
        <circle cx={55} cy={56} r={39} fill={R.dialEdge} />
        <circle cx={55} cy={54} r={38} fill={colors.white} />
        <circle cx={55} cy={54} r={38} fill={`url(#${id}-shade)`} opacity={0.25} />
        <path d="M 26 66 A 31 31 0 1 1 84 66" fill="none" stroke={R.arcGrey} strokeWidth={7} strokeLinecap="round" />
        <path d="M 26 66 A 31 31 0 1 1 84 66" fill="none" stroke={LAB.cobalt} strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray="1" style={{ strokeDashoffset: 1 - Math.max(0, Math.min(1, value)), transition: ease }} />
        <g style={{ transformBox: 'view-box', transformOrigin: '55px 54px', transform: `rotate(${a}deg)`, transition: ease }}>
          <path d="M 55 54 L 52.5 30 L 55 24 L 57.5 30 Z" fill={R.needle} />
        </g>
        <circle cx={55} cy={54} r={5} fill={R.needle} />
        <circle cx={54} cy={53} r={1.6} fill="#FFFFFF" opacity={0.8} />
      </g>
      <g>
        <Vol id={id} x={25} y={98} w={60} h={18} rx={6} fill={LAB.charcoal} edge={false} />
        <g transform="translate(55 107)">
          <circle r={5.5} fill="none" stroke={spin ? R.ledGreen : LAB.lav} strokeWidth={2.5} strokeDasharray="3.5 3" style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: spin ? 'cc-spin 1.2s linear infinite' : undefined }} />
        </g>
      </g>
    </ClaySvg>
  )
}

/** A table fan: cobalt blades while on, grey when off. The blades turn while it is on (motion layer, 2026-10-16); off, they rest. */
export function ClayFan({ w, on }: { w: number; on: boolean }) {
  const ease = useEase()
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={70} vh={92}>
      <Depth id={id} sd={3} />
      <Shadow id={id} cx={35} cy={90} rx={24} ry={3} o={0.22} />
      <Vol id={id} x={30} y={56} w={10} h={22} rx={4} fill={LAB.charcoal} edge={false} />
      <Vol id={id} x={12} y={74} w={46} h={14} rx={7} fill={LAB.charcoal} />
      <g>
        <circle cx={35} cy={32} r={30} fill={LAB.lav} />
        <circle cx={35} cy={32} r={30} fill={`url(#${id}-lit)`} />
        <circle cx={35} cy={32} r={30} fill={`url(#${id}-shade)`} />
      </g>
      <g>
        <g {...(on ? mo('spin', 0, { dur: 4 }) : {})}>
          {[0, 120, 240].map((r) => (
            <g key={r} transform={`rotate(${r} 35 32)`}>
              <ellipse cx={35} cy={17} rx={8} ry={14} fill={on ? LAB.cobalt : colors.muted} style={{ transition: ease }} />
              <ellipse cx={35} cy={17} rx={8} ry={14} fill={`url(#${id}-lit)`} />
            </g>
          ))}
        </g>
        <circle cx={35} cy={32} r={6} fill={LAB.navy} />
        <circle cx={33.5} cy={30.5} r={1.8} fill="#FFFFFF" opacity={0.7} />
      </g>
    </ClaySvg>
  )
}

/** A light bulb, glowing gold when on. */
export function ClayBulb({ w, on }: { w: number; on: boolean }) {
  const ease = useEase()
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={44} vh={66}>
      <Depth id={id} sd={2} />
      {on && (
        <g data-flat {...mo('glow', 0)}>
          <circle data-flat cx={22} cy={22} r={22} fill={`url(#${id}-glow-gold)`} />
        </g>
      )}
      <g>
        <path d="M 22 4 C 10 4 4 13 4 22 C 4 31 12 35 13 43 H 31 C 32 35 40 31 40 22 C 40 13 34 4 22 4 Z" fill={on ? LAB.yellow : LAB.lav} style={{ transition: ease }} />
        <path d="M 22 4 C 10 4 4 13 4 22 C 4 31 12 35 13 43 H 31 C 32 35 40 31 40 22 C 40 13 34 4 22 4 Z" fill={`url(#${id}-lit)`} />
        <path d="M 22 4 C 10 4 4 13 4 22 C 4 31 12 35 13 43 H 31 C 32 35 40 31 40 22 C 40 13 34 4 22 4 Z" fill={`url(#${id}-shade)`} opacity={0.6} />
        <Spec id={id} cx={14} cy={14} rx={5} ry={7} o={0.7} />
      </g>
      <g>
        <Vol id={id} x={13} y={45} w={18} h={7} rx={3} fill={LAB.steel} edge={false} />
        <Vol id={id} x={14} y={53} w={16} h={7} rx={3} fill={LAB.steel} edge={false} />
      </g>
    </ClaySvg>
  )
}

/** A fridge: two pale-blue doors with lit edges, charcoal handles, a ground shadow. */
export function ClayFridge({ w }: { w: number }) {
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={56} vh={100}>
      <Depth id={id} sd={3} />
      <Shadow id={id} cx={28} cy={98} rx={24} ry={3} o={0.22} />
      <Vol id={id} x={3} y={3} w={50} h={34} rx={9} fill={LAB.sky} />
      <Vol id={id} x={3} y={39} w={50} h={58} rx={9} fill={LAB.sky} />
      <g>
        <rect x={42} y={12} width={5} height={16} rx={2.5} fill={LAB.charcoal} />
        <rect x={42} y={48} width={5} height={22} rx={2.5} fill={LAB.charcoal} />
      </g>
    </ClaySvg>
  )
}

/** A bill: a white slip with item rows and a total, its torn foot drawn as a zigzag. */
export function ClayBill({ w, rows = 3 }: { w: number; rows?: number }) {
  const ease = useEase()
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={72} vh={96}>
      <Depth id={id} />
      <Shadow id={id} cx={36} cy={94} rx={30} ry={3} o={0.2} />
      <g>
        <VolPath id={id} d="M 10 4 H 62 Q 68 4 68 10 V 90 L 60 84 L 52 90 L 44 84 L 36 90 L 28 84 L 20 90 L 12 84 L 4 90 V 10 Q 4 4 10 4 Z" fill={colors.white} />
        <rect x={13} y={13} width={30} height={6} rx={3} fill={LAB.cobalt} />
        {Array.from({ length: 4 }, (_, i) => (
          <g key={i} style={{ opacity: i < rows ? 1 : 0, transition: ease }}>
            <rect x={13} y={27 + i * 10} width={28} height={4.5} rx={2.2} fill={LAB.lav} />
            <rect x={47} y={27 + i * 10} width={12} height={4.5} rx={2.2} fill={LAB.steel} />
          </g>
        ))}
        <rect x={13} y={70} width={46} height={6} rx={3} fill={LAB.charcoal} />
      </g>
    </ClaySvg>
  )
}

/** The tenant colours used across slides 30, 36 and 37. */
export const TENANT_TONES = [LAB.orange, colors.teal, LAB.cobalt]
