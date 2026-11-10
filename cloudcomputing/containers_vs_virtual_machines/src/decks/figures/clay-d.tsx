import type { CSSProperties, ReactNode } from 'react'
import { ClaySvg, useEase } from './art'
import { mo, type MotionKind } from './motion'
import { R, usePrefix, Shadow, BlurDef, GlowDef } from './depth'

/**
 * SECTION 5's OBJECTS (review 2026-10-16, slides 47 to 62), since the same
 * day's "same style for all" drawn the way slide 5's reference render draws
 * its rack, coins, cloud, tiles and meter: every form is a solid lit from
 * the upper left and shaded at its foot, a slab shows a lit top face and a
 * dark side face, gold carries a radial highlight and a crisp specular, a
 * light carries a glow, and anything standing casts a soft blurred cool
 * shadow. Chunky rounded parts, no outlines, each top-level child one form
 * the clay filter turns; small details inside their part's `<g>`. Colours
 * that are not tokens are the Lab palette, the render's hues where it has
 * one, marked as the object's own colour where they are used.
 */

/* ------------------------------------------------------------------ the motion layer (2026-10-16) */

/**
 * Every drawing here carries the motion layer's loop for what it is
 * (`motion.ts`): `mo()` seeds a phase; `seq()` sets one explicitly, so the
 * parts of one object move together, or a screen's lines type in sequence.
 * A class goes on an inner `<g>` or a wrapper, never on an element whose
 * inline transform or opacity a state change drives.
 */
function seq(kind: MotionKind, phase: number, dur: number): { className: string; style: CSSProperties } {
  return { className: `mo mo-${kind}`, style: { '--mo-dur': `${dur}s`, '--mo-delay': `${(-phase * dur).toFixed(2)}s` } as CSSProperties }
}

/** A caret blinking at the end of a typed line (catalog: code windows). */
const Caret = ({ x, y, h = 6, fill = '#FFFFFF', o = 0.8 }: { x: number; y: number; h?: number; fill?: string; o?: number }) => (
  <g {...mo('cursor')}>
    <rect x={x} y={y} width={2} height={h} rx={1} fill={fill} opacity={o} />
  </g>
)

/* the Lab palette, every one an object's own colour, the render's hues where it has one */
const YELLOW = R.gold
const ORANGE = '#FC963C'
const RED = '#D8352F'
const COBALT = R.cloudMid
const SKY = '#9CC4FB'
const LAVENDER = '#DCE1F1'
const SAGE = '#829983'
const NAVY = R.chassisBot
const CHARCOAL = '#3E3D45'
const CARD = '#E8B36A' // a cardboard box's own colour
const GREEN = R.arcGreen

/* ------------------------------------------------------------------ the render's depth (user, 2026-10-16) */

/**
 * One set of defs per svg: a lit gradient (white from the upper left), a
 * shade gradient (cool dark at the foot), a specular bloom, the gold disc
 * highlight, the LED glows and a blur for ground shadows.
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
      <radialGradient id={`${id}-gold`} cx="36%" cy="30%" r="72%">
        <stop offset="0" stopColor={R.goldHi} />
        <stop offset="1" stopColor={R.gold} />
      </radialGradient>
      <linearGradient id={`${id}-goldside`} x1={0} y1={0} x2={0} y2={1}>
        <stop offset="0" stopColor={R.goldSide} />
        <stop offset="1" stopColor={R.goldSideDark} />
      </linearGradient>
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

/** A gold disc seen a little from above: a graded rim band, a radial-lit face, a crisp specular. */
function GoldDisc({ id, cx, cy, rx, ry, band }: { id: string; cx: number; cy: number; rx: number; ry: number; band: number }) {
  return (
    <>
      <rect x={cx - rx} y={cy - ry} width={rx * 2} height={band + ry} rx={ry} fill={`url(#${id}-goldside)`} />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id}-gold)`} />
      <ellipse cx={cx} cy={cy} rx={rx * 0.72} ry={ry * 0.7} fill="none" stroke={R.goldSide} strokeWidth={1} opacity={0.5} />
      <ellipse cx={cx - rx * 0.28} cy={cy - ry * 0.35} rx={rx * 0.4} ry={ry * 0.32} fill={R.goldShine} opacity={0.75} />
    </>
  )
}

/* ------------------------------------------------------------------ money */

/** A stack of gold coins as the render's, `n` high: each a disc with a graded rim, a lit face and a specular, over a soft shadow. */
export function ClayCoins({ w, n }: { w: number; n: number }) {
  const id = usePrefix()
  const H = 20 + n * 13
  return (
    <ClaySvg w={w} vw={70} vh={H}>
      <Depth id={id} sd={3} />
      <Shadow id={id} cx={35} cy={H - 2} rx={32} ry={3.5} o={0.24} />
      {Array.from({ length: n }, (_, i) => {
        const y = H - 14 - i * 13
        return (
          <g key={i} {...seq('float', 0.4, 4.2)}>
            <GoldDisc id={id} cx={35} cy={y - 1} rx={30} ry={10} band={6} />
          </g>
        )
      })}
    </ClaySvg>
  )
}

/** One gold coin, face on: a lit face, a rim ring, a specular. */
export function ClayCoin({ w }: { w: number }) {
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={40} vh={40}>
      <Depth id={id} sd={2} />
      <g {...seq('hover', 0.1, 3.4)}>
        <circle cx={20} cy={21.5} r={18} fill={R.goldSideDark} />
        <circle cx={20} cy={20} r={18} fill={`url(#${id}-gold)`} />
      </g>
      <g {...seq('hover', 0.1, 3.4)}>
        <circle cx={20} cy={20} r={11} fill={R.goldSide} opacity={0.5} />
        <circle cx={20} cy={20} r={11} fill={`url(#${id}-lit)`} />
        <Spec id={id} cx={13} cy={12} rx={6} ry={4} o={0.8} />
      </g>
    </ClaySvg>
  )
}

/** A meter dial as the render's: a pale turned body, a white face on a shaded rim, a blue arc swept by `value`, a dark needle with a white-dot hub. */
export function ClayMeter({ w, value }: { w: number; value: number }) {
  const id = usePrefix()
  const v = Math.max(0, Math.min(1, value))
  const a = -120 + v * 240
  return (
    <ClaySvg w={w} vw={100} vh={100}>
      <Depth id={id} sd={3} />
      <Shadow id={id} cx={50} cy={98} rx={38} ry={3.5} o={0.22} />
      <g>
        <circle cx={50} cy={50} r={46} fill={LAVENDER} />
        <circle cx={50} cy={50} r={46} fill={`url(#${id}-lit)`} />
        <circle cx={50} cy={50} r={46} fill={`url(#${id}-shade)`} />
      </g>
      <g>
        <circle cx={50} cy={51.5} r={36} fill={R.dialEdge} />
        <circle cx={50} cy={50} r={36} fill="#FFFFFF" />
        <circle cx={50} cy={50} r={36} fill={`url(#${id}-shade)`} opacity={0.22} />
      </g>
      <g>
        <path d="M 22 66 A 31 31 0 1 1 78 66" fill="none" stroke={R.arcGrey} strokeWidth={9} strokeLinecap="round" {...mo('glow', 1)} />
        <path d="M 22 66 A 31 31 0 1 1 78 66" fill="none" stroke={COBALT} strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray={`${v} 1`} />
      </g>
      <g transform={`rotate(${a} 50 50)`}>
        <path d="M 46 52 L 50 22 L 54 52 Z" fill={R.needle} />
        <circle cx={50} cy={50} r={7} fill={R.needle} />
        <circle cx={48.5} cy={48.5} r={2} fill="#FFFFFF" opacity={0.8} />
      </g>
      <Vol id={id} x={36} y={72} w={28} h={12} rx={6} fill={NAVY} edge={false} />
    </ClaySvg>
  )
}

/* 2026-10-22 (slide 58, user: "animate the bell"): a BURST of rings, then rest. A few swings about the hanger in the
   first 1.4s of a 4.2s period, still for the rest; transform only, held by `.cc-still` and the picker thumbnails. */
const BELL_CSS = `@keyframes cc-bell-burst { 0% { transform: rotate(0) } 6% { transform: rotate(-16deg) } 13% { transform: rotate(14deg) } 20% { transform: rotate(-11deg) } 27% { transform: rotate(8deg) } 33% { transform: rotate(-4deg) } 38%, 100% { transform: rotate(0) } }`
if (typeof document !== 'undefined' && !document.getElementById('cc-bell-css')) {
  const el = document.createElement('style')
  el.id = 'cc-bell-css'
  el.textContent = BELL_CSS
  document.head.appendChild(el)
}

/** A bell, for an alarm; `ringing` swings it (the alarm itself, so the loop is the content); `burst` rings a few times then rests. */
export function ClayBell({ w, ringing = false, burst = false }: { w: number; ringing?: boolean; burst?: boolean }) {
  const id = usePrefix()
  const anim = ringing ? 'cc-ring 0.5s ease-in-out infinite alternate' : burst ? 'cc-bell-burst 4.2s ease-in-out infinite' : undefined
  return (
    <ClaySvg w={w} vw={60} vh={64}>
      <Depth id={id} sd={2} />
      <g style={{ transformBox: 'view-box', transformOrigin: '30px 6px', animation: anim }}>
        <circle cx={30} cy={7} r={5} fill={ORANGE} />
        <circle cx={30} cy={7} r={5} fill={`url(#${id}-lit)`} />
        <VolPath id={id} d="M 30 8 C 15 8 11 20 11 32 C 11 40 7 44 5 48 H 55 C 53 44 49 40 49 32 C 49 20 45 8 30 8 Z" fill={`url(#${id}-gold)`} />
        <Vol id={id} x={4} y={46} w={52} h={8} rx={4} fill={ORANGE} edge={false} />
        <circle cx={30} cy={58} r={5.5} fill={ORANGE} />
        <circle cx={30} cy={58} r={5.5} fill={`url(#${id}-lit)`} />
        <ellipse cx={21} cy={22} rx={4} ry={8} fill="#FFFFFF" opacity={0.5} />
      </g>
    </ClaySvg>
  )
}

/* ------------------------------------------------------------------ the balance */

/**
 * A balance scale, `tilt` in degrees (positive drops the right pan). The left
 * pan holds a green tick token (the benefit), the right a red warning token
 * (the risk it carries).
 */
export function ClayBalance({ w, tilt = 0 }: { w: number; tilt?: number }) {
  const id = usePrefix()
  /* 2026-10-22 (slide 47 balances live): the tilt is TRANSFORMS, never recomputed geometry. The beam and each pan's
     hanger rotate about the pivot (110,40); inside that, the pan is rotated back about its own hanging point, so it
     stays level and hangs straight down from wherever the beam end has gone. A `useLoop` phase can drive `tilt`. */
  const L = { x: 26, y: 40 }
  const Rt = { x: 194, y: 40 }
  const pan = (p: { x: number; y: number }, tone: string, token: 'tick' | 'warn') => (
    <g transform={`rotate(${tilt} 110 40)`}>
     <g transform={`rotate(${-tilt} ${p.x} ${p.y})`}>
      {/* review 2026-10-26 (connections): the hangers were lavender on a white plate and vanished, so the pans looked loose; steel blue, and they run from inside the beam into the pan's rim */}
      <Vol id={id} x={p.x - 2.5} y={p.y - 4} w={5} h={46} rx={2.5} fill="#7F95C4" edge={false} />
      <VolPath id={id} d={`M ${p.x - 34} ${p.y + 40} H ${p.x + 34} C ${p.x + 32} ${p.y + 58} ${p.x - 32} ${p.y + 58} ${p.x - 34} ${p.y + 40} Z`} fill={tone} />
      {token === 'tick' ? (
        <g {...mo('pop', 1)}>
          <circle cx={p.x} cy={p.y + 26} r={15} fill={`url(#${id}-glow-green)`} opacity={0.5} />
          <circle cx={p.x} cy={p.y + 26} r={13} fill={GREEN} />
          <circle cx={p.x} cy={p.y + 26} r={13} fill={`url(#${id}-lit)`} />
          <path d={`M ${p.x - 6} ${p.y + 26} L ${p.x - 1.5} ${p.y + 31} L ${p.x + 7} ${p.y + 21}`} fill="none" stroke="#FFFFFF" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ) : (
        <g {...mo('shake', 3)}>
          <VolPath id={id} d={`M ${p.x} ${p.y + 11} L ${p.x + 15} ${p.y + 38} H ${p.x - 15} Z`} fill={YELLOW} />
          <rect x={p.x - 1.6} y={p.y + 20} width={3.2} height={10} rx={1.6} fill={CHARCOAL} />
          <circle cx={p.x} cy={p.y + 34} r={1.8} fill={CHARCOAL} />
        </g>
      )}
     </g>
    </g>
  )
  return (
    <ClaySvg w={w} vw={220} vh={150} large>
      <Depth id={id} sd={5} />
      <Shadow id={id} cx={110} cy={148} rx={60} ry={4} o={0.24} />
      <Vol id={id} x={70} y={134} w={80} h={14} rx={7} fill={NAVY} />
      <Vol id={id} x={102} y={36} w={16} h={104} rx={8} fill={COBALT} edge={false} />
      <Vol id={id} x={22} y={34} w={176} h={12} rx={6} fill={COBALT} transform={`rotate(${tilt} 110 40)`} />
      {pan(L, SKY, 'tick')}
      {pan(Rt, '#F2A3A0', 'warn')}
      <g>
        <circle cx={110} cy={40} r={11} fill={`url(#${id}-gold)`} />
        <Spec id={id} cx={106} cy={36} rx={4} ry={3} o={0.8} />
      </g>
    </ClaySvg>
  )
}

/* ------------------------------------------------------------------ growth and place */

/** A map pin, chunky, lit from the upper left, a white eye with a shade. */
export function ClayPin({ w, tone = COBALT }: { w: number; tone?: string }) {
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={40} vh={52}>
      <Depth id={id} sd={2} />
      <Shadow id={id} cx={20} cy={50} rx={9} ry={2} o={0.28} />
      <VolPath id={id} d="M 20 2 C 9 2 2 10 2 20 C 2 33 20 50 20 50 C 20 50 38 33 38 20 C 38 10 31 2 20 2 Z" fill={tone} {...seq('hover', 0.5, 3.4)}>
        <Spec id={id} cx={12} cy={10} rx={5} ry={4} o={0.7} />
      </VolPath>
      <g {...seq('hover', 0.5, 3.4)}>
        <circle cx={20} cy={20} r={7.5} fill="#FFFFFF" />
        <circle cx={20} cy={20} r={7.5} fill={`url(#${id}-shade)`} opacity={0.4} />
      </g>
    </ClaySvg>
  )
}

/** A rocket, for speed to market: a lit white body, red fins and nose, a cobalt porthole, a flickering flame. */
export function ClayRocket({ w }: { w: number }) {
  const id = usePrefix()
  const h = seq('hover', 0, 3.4)
  return (
    <ClaySvg w={w} vw={70} vh={110}>
      <Depth id={id} sd={3} />
      <g {...h}>
        <path d="M 26 82 C 26 96 35 106 35 106 C 35 106 44 96 44 82 Z" fill={`url(#${id}-glow-gold)`} transform="scale(1.6 1.15) translate(-13 -14)" opacity={0.9} />
        <path d="M 26 82 C 26 96 35 106 35 106 C 35 106 44 96 44 82 Z" fill={ORANGE} {...mo('flicker', 0)} />
        <path d="M 30 82 C 30 92 35 99 35 99 C 35 99 40 92 40 82 Z" fill={R.goldHi} opacity={0.8} />
      </g>
      <VolPath id={id} d="M 17 52 C 6 60 4 74 6 86 L 20 76 Z M 53 52 C 64 60 66 74 64 86 L 50 76 Z" fill={RED} {...h} />
      <g {...h}>
        <VolPath id={id} d="M 35 2 C 54 18 58 46 52 82 H 18 C 12 46 16 18 35 2 Z" fill="#F4F5FB" />
        <VolPath id={id} d="M 35 2 C 44 10 50 20 53 30 H 17 C 20 20 26 10 35 2 Z" fill={RED} />
        <ellipse cx={26} cy={52} rx={4} ry={14} fill="#FFFFFF" opacity={0.6} />
      </g>
      <g {...h}>
        <circle cx={35} cy={48} r={11} fill={COBALT} />
        <circle cx={35} cy={48} r={11} fill={`url(#${id}-shade)`} opacity={0.6} />
        <circle cx={35} cy={48} r={6.5} fill={SKY} />
        <circle cx={33} cy={46} r={2} fill="#FFFFFF" opacity={0.8} />
      </g>
      <Vol id={id} x={30} y={70} w={10} h={22} rx={5} fill={RED} edge={false} {...h} />
    </ClaySvg>
  )
}

/* ------------------------------------------------------------------ lock-in */

/** A padlock, shut or open; its own colour by `tone`. A turned body, a steel shackle lit on its curve, a keyhole. */
export function ClayPadlock({ w, open = false, tone = R.cloudMid }: { w: number; open?: boolean; tone?: string }) {
  /*
    REDRAWN 2026-10-23 (user: "the lock on slide 55 looks broken or unfinished;
    make it blue"). The old body was a `Slab`, an isometric plate whose flat lid
    and right fin stuck out past the rounded body, and the shackle's legs sat on
    that lid instead of entering the body. Now: the shackle is drawn first (a
    steel-blue arch with a shaded right edge and a lit left edge), its legs run
    down INTO the body, and the body is one rounded clay form over them (lit top,
    shaded foot, a specular on the upper left, a deeper band at the base), with a
    navy keyhole that has a rim and a hole. The default tone is the render's
    cloud blue; slide 56 still passes its own tones for open and shut.
  */
  const ease = useEase()
  const id = usePrefix()
  const base = tone === R.cloudMid ? R.cloudUnder : R.shadow
  return (
    <ClaySvg w={w} vw={60} vh={72}>
      <Depth id={id} sd={2} />
      <defs>
        <clipPath id={`${id}-body`}>
          <rect x={6} y={34} width={48} height={34} rx={10} />
        </clipPath>
      </defs>
      <Shadow id={id} cx={30} cy={70} rx={24} ry={2.6} o={0.26} />
      <g style={{ transformBox: 'fill-box', transformOrigin: '100% 100%', transform: open ? 'translateY(-8px) rotate(28deg)' : 'none', transition: ease }}>
        {/* the shackle: a shaded edge on the right, the arch, a lit edge on the upper left; its legs reach y=42, under the body's top edge (34) */}
        <path d="M 17 42 V 22 A 13 13 0 0 1 43 22 V 42" fill="none" stroke={R.chassisBot} strokeWidth={9} strokeLinecap="round" transform="translate(1.2 1.2)" />
        <path d="M 17 42 V 22 A 13 13 0 0 1 43 22 V 42" fill="none" stroke={R.chassisTop} strokeWidth={9} strokeLinecap="round" />
        <path d="M 17 42 V 22 A 13 13 0 0 1 43 22 V 30" fill="none" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" opacity={0.5} transform="translate(-1.6 -1.6)" />
      </g>
      <g>
        <Vol id={id} x={6} y={34} w={48} h={34} rx={10} fill={tone} style={{ transition: ease }} />
        {/* a deeper band at the base, inside the rounded shape */}
        <rect x={6} y={60} width={48} height={8} fill={base} opacity={0.28} clipPath={`url(#${id}-body)`} />
        <ellipse cx={17} cy={42} rx={6} ry={3.4} fill={`url(#${id}-spec)`} opacity={0.75} />
        {/* the keyhole: a navy rim round a darker hole */}
        <circle cx={30} cy={49} r={6} fill={R.chassisTop} />
        <rect x={26} y={50} width={8} height={13} rx={4} fill={R.chassisTop} />
        <circle cx={30} cy={49} r={4.2} fill="#0F1733" />
        <rect x={27.6} y={51} width={4.8} height={10.5} rx={2.4} fill="#0F1733" />
      </g>
    </ClaySvg>
  )
}

/** A spanner and a screwdriver crossed: a team's tool skills. */
export function ClayTools({ w }: { w: number }) {
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={48} vh={48}>
      <Depth id={id} sd={2} />
      <g {...seq('hover', 0.8, 3.4)}>
        <g transform="rotate(45 24 24)">
          <Vol id={id} x={20} y={6} w={8} h={36} rx={4} fill={ORANGE} edge={false} />
          <Vol id={id} x={22} y={2} w={4} h={8} rx={1.5} fill={LAVENDER} edge={false} />
        </g>
      </g>
      <g {...seq('hover', 0.8, 3.4)}>
        <g transform="rotate(-45 24 24)">
          <Vol id={id} x={20.5} y={12} w={7} h={32} rx={3.5} fill={SAGE} edge={false} />
          <VolPath id={id} d="M 16 6 A 9 9 0 1 0 32 6 L 28 6 L 28 12 H 20 V 6 Z" fill={SAGE} />
        </g>
      </g>
    </ClaySvg>
  )
}

/**
 * A flat's wall with four cupboards fitted to it: one long countertop, bolts
 * through each unit into the wall, labelled drawers. It cannot leave the wall.
 */
export function ClayFittedCupboards({ w }: { w: number }) {
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={240} vh={170} large>
      <Depth id={id} sd={4} />
      <g>
        <Vol id={id} x={0} y={0} w={240} h={170} rx={14} fill={LAVENDER} edge={false} />
        {[38, 76, 114, 152].map((y) => (
          <rect key={y} x={8} y={y} width={224} height={2} rx={1} fill="#C4C8E0" />
        ))}
      </g>
      <Vol id={id} x={12} y={36} w={216} h={14} rx={7} fill={ORANGE} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <Vol id={id} x={16 + i * 53} y={52} w={48} h={104} rx={9} fill="#FFFFFF" edge={false} />
          {[0, 1, 2].map((r) => (
            <g key={r}>
              <rect x={20 + i * 53} y={58 + r * 32} width={40} height={28} rx={6} fill="#F1F2FA" />
              <rect x={20 + i * 53} y={58 + r * 32} width={40} height={28} rx={6} fill={`url(#${id}-shade)`} opacity={0.35} />
              <rect x={31 + i * 53} y={69 + r * 32} width={18} height={6} rx={3} fill={COBALT} />
              <rect x={31 + i * 53} y={69 + r * 32} width={18} height={3} rx={1.5} fill={`url(#${id}-gloss)`} />
            </g>
          ))}
          {/* the bolts into the wall, the reason it cannot move: the one thing here that moves is their glow (the cupboards stay put, that is the point) */}
          <g {...mo('glow', i)}>
            <Led id={id} cx={22 + i * 53} cy={60} r={2.6} tone={CHARCOAL} />
            <Led id={id} cx={58 + i * 53} cy={60} r={2.6} tone={CHARCOAL} />
          </g>
        </g>
      ))}
    </ClaySvg>
  )
}

/** A cardboard moving box, flaps open, a strip of tape, lit along its top edge. */
export function ClayMovingBox({ w }: { w: number }) {
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={100} vh={86}>
      <Depth id={id} sd={3} />
      <Shadow id={id} cx={50} cy={84} rx={44} ry={3.5} o={0.24} />
      <VolPath id={id} d="M 8 26 L 0 12 L 30 8 L 38 26 Z M 92 26 L 100 12 L 70 8 L 62 26 Z" fill="#D49A52" {...seq('hover', 0.25, 3.4)} />
      <g {...seq('hover', 0.25, 3.4)}>
        <Slab id={id} x={6} y={24} w={88} h={60} rx={8} fill={CARD} d={5} />
        <rect x={44} y={29} width={12} height={34} rx={3} fill={YELLOW} opacity={0.75} />
        <rect x={44} y={29} width={12} height={34} rx={3} fill={`url(#${id}-lit)`} />
        <ellipse cx={20} cy={42} rx={6} ry={10} fill="#FFFFFF" opacity={0.2} />
      </g>
    </ClaySvg>
  )
}

/* ------------------------------------------------------------------ vehicles */

/** A yellow taxi, its meter sign lit on the roof (gold is the taxi's own colour): a lit body, glass windows, wheels with hubs, a ground shadow. */
export function ClayTaxi({ w }: { w: number }) {
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={200} vh={104} large>
      <Depth id={id} sd={5} />
      <Shadow id={id} cx={100} cy={100} rx={92} ry={4} o={0.24} />
      <g {...seq('hover', 0.15, 3.4)}>
        <rect x={74} y={-2} width={52} height={24} rx={10} fill={`url(#${id}-glow-green)`} />
        <Vol id={id} x={78} y={2} w={44} h={16} rx={6} fill={GREEN} {...mo('glow', 0)} />
      </g>
      <g {...seq('hover', 0.15, 3.4)}>
        <VolPath id={id} d="M 22 50 C 30 28 42 18 62 18 H 132 C 152 18 164 30 176 50 H 186 C 194 50 198 56 198 64 V 76 C 198 82 194 84 188 84 H 12 C 6 84 2 82 2 76 V 64 C 2 56 8 50 16 50 Z" fill={`url(#${id}-gold)`} />
        <g>
          <path d="M 44 48 C 50 34 56 28 66 28 H 94 V 48 Z M 104 28 H 130 C 142 28 150 36 158 48 H 104 Z" fill={SKY} />
          <path d="M 44 48 C 50 34 56 28 66 28 H 94 V 48 Z M 104 28 H 130 C 142 28 150 36 158 48 H 104 Z" fill={`url(#${id}-gloss)`} />
        </g>
        <rect x={2} y={62} width={196} height={6} fill={ORANGE} opacity={0.6} />
        <ellipse cx={70} cy={56} rx={20} ry={3} fill="#FFFFFF" opacity={0.4} />
        <rect x={60} y={20} width={60} height={2} rx={1} fill="#FFFFFF" opacity={0.5} />
      </g>
      {[52, 150].map((cx) => (
        <g key={cx} {...seq('hover', 0.15, 3.4)}>
          <circle cx={cx} cy={84} r={17} fill={CHARCOAL} />
          <circle cx={cx} cy={84} r={17} fill={`url(#${id}-lit)`} />
          <circle cx={cx} cy={84} r={17} fill={`url(#${id}-shade)`} />
        </g>
      ))}
      <g {...seq('hover', 0.15, 3.4)}>
        <circle cx={52} cy={84} r={7} fill={LAVENDER} />
        <circle cx={150} cy={84} r={7} fill={LAVENDER} />
        <circle cx={50} cy={82} r={2.5} fill="#FFFFFF" opacity={0.7} />
        <circle cx={148} cy={82} r={2.5} fill="#FFFFFF" opacity={0.7} />
      </g>
    </ClaySvg>
  )
}

/** An owned car, parked: the same body in sage grey, nobody in it, breathing like an idling engine. */
export function ClayParkedCar({ w }: { w: number }) {
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={200} vh={104} large>
      <Depth id={id} sd={5} />
      <Shadow id={id} cx={100} cy={100} rx={92} ry={4} o={0.24} />
      <g {...mo('breath', 1)}>
        <VolPath id={id} d="M 22 50 C 30 28 42 18 62 18 H 132 C 152 18 164 30 176 50 H 186 C 194 50 198 56 198 64 V 76 C 198 82 194 84 188 84 H 12 C 6 84 2 82 2 76 V 64 C 2 56 8 50 16 50 Z" fill={SAGE} />
        <path d="M 44 48 C 50 34 56 28 66 28 H 94 V 48 Z M 104 28 H 130 C 142 28 150 36 158 48 H 104 Z" fill={LAVENDER} />
        <path d="M 44 48 C 50 34 56 28 66 28 H 94 V 48 Z M 104 28 H 130 C 142 28 150 36 158 48 H 104 Z" fill={`url(#${id}-gloss)`} />
        <rect x={60} y={20} width={60} height={2} rx={1} fill="#FFFFFF" opacity={0.4} />
      </g>
      {[52, 150].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={84} r={17} fill={CHARCOAL} />
          <circle cx={cx} cy={84} r={17} fill={`url(#${id}-lit)`} />
          <circle cx={cx} cy={84} r={17} fill={`url(#${id}-shade)`} />
        </g>
      ))}
      <g>
        <circle cx={52} cy={84} r={7} fill={LAVENDER} />
        <circle cx={150} cy={84} r={7} fill={LAVENDER} />
        <circle cx={50} cy={82} r={2.5} fill="#FFFFFF" opacity={0.7} />
        <circle cx={148} cy={82} r={2.5} fill="#FFFFFF" opacity={0.7} />
      </g>
    </ClaySvg>
  )
}

/* ------------------------------------------------------------------ charts */

/**
 * A row of chunky bars, `values` 0 to 1, each a turned block lit along its
 * top. `lit` bars carry `tone`, the rest are frosted; `hot` bars (index at
 * or past it) turn red.
 */
export function ClayBars({ w, h, values, lit, tone, hot, gap = 14 }: { w: number; h: number; values: number[]; lit: number; tone: string; hot?: number; gap?: number }) {
  const ease = useEase(400)
  const id = usePrefix()
  const n = values.length
  const bw = (w - gap * (n - 1)) / n
  return (
    <ClaySvg w={w} vw={w} vh={h}>
      <Depth id={id} sd={2} />
      {values.map((v, i) => {
        const bh = Math.max(10, v * (h - 4))
        const on = i < lit
        const fill = !on ? R.frostFront : hot !== undefined && i >= hot ? RED : tone
        const m = mo('breathe', i, { base: true })
        const rx = Math.min(10, bw / 3)
        const geo = { x: i * (bw + gap), width: bw, rx }
        return (
          <g key={i} className={m.className} style={m.style}>
            <rect {...geo} y={h - bh} height={bh} fill={fill} style={{ transition: ease }} />
            <rect {...geo} y={h - bh} height={bh} fill={`url(#${id}-lit)`} style={{ transition: ease }} />
            <rect {...geo} y={h - bh} height={bh} fill={`url(#${id}-shade)`} style={{ transition: ease }} />
            <rect x={geo.x + rx * 0.6} y={h - bh + 1} width={bw - rx * 1.2} height={1.6} rx={0.8} fill="#FFFFFF" opacity={0.5} style={{ transition: ease }} />
          </g>
        )
      })}
    </ClaySvg>
  )
}

/* ------------------------------------------------------------------ devices */

/** A phone at real proportions, a navy turned body, a plane wholly inside its screen when roaming is on. */
export function ClayPhone({ w, roaming = true }: { w: number; roaming?: boolean }) {
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={60} vh={124}>
      <Depth id={id} sd={3} />
      <Vol id={id} x={2} y={2} w={56} h={120} rx={12} fill={NAVY} />
      <g>
        <rect x={7} y={12} width={46} height={100} rx={7} fill={roaming ? SKY : LAVENDER} />
        <rect x={7} y={12} width={46} height={100} rx={7} fill={`url(#${id}-shade)`} opacity={0.4} />
        <rect x={7} y={12} width={46} height={40} rx={7} fill={`url(#${id}-gloss)`} />
        <rect x={24} y={6} width={12} height={3} rx={1.5} fill={CHARCOAL} />
        {roaming && (
          /* the plane: 32 units wide, centred in the 46-unit screen with room on every side */
          <g {...mo('hover', 3)}>
            <g transform="translate(30 58) rotate(-30)">
              <rect x={-15} y={-3} width={30} height={6} rx={3} fill="#FFFFFF" />
              <path d="M -3 -2 L -9 -14 H -4 L 6 -2 Z M -3 2 L -9 14 H -4 L 6 2 Z" fill="#FFFFFF" />
              <path d="M -15 -1 L -17 -7 H -13 L -10 -1 Z M -15 1 L -17 7 H -13 L -10 1 Z" fill="#FFFFFF" />
              <rect x={-15} y={-3} width={30} height={6} rx={3} fill={`url(#${id}-shade)`} opacity={0.5} />
            </g>
          </g>
        )}
      </g>
    </ClaySvg>
  )
}

/** A crescent moon, for "overnight", gold with a lit edge. */
export function ClayMoon({ w }: { w: number }) {
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={44} vh={44}>
      <Depth id={id} sd={2} />
      <VolPath id={id} d="M 28 3 A 19 19 0 1 0 41 31 A 15 15 0 1 1 28 3 Z" fill={`url(#${id}-gold)`} {...mo('hover', 6)}>
        <Spec id={id} cx={14} cy={14} rx={5} ry={6} o={0.6} />
      </VolPath>
    </ClaySvg>
  )
}

/** A server unit as the render's tile: a navy slab with a lit top face, two blue bars, a glowing green light while it runs; frosted when stopped. */
export function ClayServerUnit({ w, running = true }: { w: number; running?: boolean }) {
  const ease = useEase()
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={100} vh={40}>
      <Depth id={id} sd={2} />
      <g>
        <Slab id={id} x={2} y={2} w={96} h={36} rx={8} fill={R.frostFront} d={5} />
        <Slab id={id} x={2} y={2} w={96} h={36} rx={8} fill={NAVY} d={5} style={{ opacity: running ? 1 : 0, transition: ease }} />
        <rect x={14} y={15} width={40} height={6} rx={3} fill={running ? R.barA : '#FFFFFF'} style={{ transition: ease }} />
        <rect x={14} y={25} width={26} height={6} rx={3} fill={running ? R.barB : '#FFFFFF'} opacity={0.8} style={{ transition: ease }} />
        <g {...mo('blink', 2)}>
          <Led id={id} cx={82} cy={22} r={5.5} tone={running ? R.ledGreen : R.ledFrost} glow="green" dim={!running} style={{ transition: ease }} />
        </g>
      </g>
    </ClaySvg>
  )
}

/** A desktop computer, the Library's way: a gold-framed monitor on a stand, a keyboard, a ground shadow. */
export function ClayComputer({ w }: { w: number }) {
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={100} vh={84}>
      <Depth id={id} sd={3} />
      <Shadow id={id} cx={50} cy={83} rx={40} ry={3} o={0.2} />
      <Vol id={id} x={42} y={56} w={16} h={14} rx={3} fill={ORANGE} edge={false} />
      <Vol id={id} x={28} y={66} w={44} h={8} rx={4} fill={ORANGE} />
      <g>
        <Vol id={id} x={4} y={2} w={92} h={58} rx={9} fill={`url(#${id}-gold)`} />
        <rect x={10} y={8} width={80} height={46} rx={5} fill="#FFFFFF" />
        <rect x={16} y={14} width={30} height={22} rx={3} fill={SKY} />
        <rect x={16} y={14} width={30} height={22} rx={3} fill={`url(#${id}-gloss)`} />
        <g {...seq('type', 0, 4.8)}>
          <rect x={52} y={15} width={30} height={4} rx={2} fill={COBALT} />
        </g>
        <g {...seq('type', 0.14, 4.8)}>
          <rect x={52} y={24} width={22} height={4} rx={2} fill={LAVENDER} />
        </g>
        <g {...seq('type', 0.28, 4.8)}>
          <rect x={16} y={42} width={66} height={4} rx={2} fill={LAVENDER} />
        </g>
        <Caret x={85} y={42} h={4} fill={LAVENDER} o={1} />
      </g>
      <Vol id={id} x={18} y={76} w={64} h={7} rx={3.5} fill={LAVENDER} edge={false} />
    </ClaySvg>
  )
}

/** A red disc with a white cross: this way is shut. */
export function ClayNo({ w }: { w: number }) {
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={40} vh={40}>
      <Depth id={id} sd={2} />
      <g {...mo('shake', 4)}>
        <circle cx={20} cy={21.5} r={18} fill="#A8231F" />
        <circle cx={20} cy={20} r={18} fill={RED} />
        <circle cx={20} cy={20} r={18} fill={`url(#${id}-lit)`} />
        <circle cx={20} cy={20} r={18} fill={`url(#${id}-shade)`} opacity={0.5} />
        <path d="M 13 13 L 27 27 M 27 13 L 13 27" stroke="#FFFFFF" strokeWidth={4.5} strokeLinecap="round" />
      </g>
    </ClaySvg>
  )
}
