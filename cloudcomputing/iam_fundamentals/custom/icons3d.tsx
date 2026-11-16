import { useId, type CSSProperties, type ReactNode } from 'react'

/*
 * 3D-STYLE ICONS for IAM Fundamentals (correction round 2026-11-16, user: "replace with a higher-resolution 3D-style
 * icon"). Vector, so they are sharp at any size and any zoom: soft glossy clay, a lit top, a darker extruded side,
 * a specular highlight and a contact shadow. One drawing per name in a 64 x 64 box; colours are the deck's blue
 * (#2D63FB), accent orange (#FF8A3D) and a green / red / gold kept for meaning (allow / deny / root).
 *
 *   <Ico3D name="user" size={56} loop="bob" d={0.4} badge="check" />
 *
 * The loop runs on the wrapping <span> (transform only: composited, never an element inside the svg, low-end rule).
 * Held still on ?still, thumbnails and reduced motion.
 */

type Tone = 'blue' | 'sky' | 'orange' | 'green' | 'red' | 'gold' | 'paper' | 'steel' | 'navy' | 'pink'
const T: Record<Tone, [string, string, string, string]> = {
  //          highlight   body        low         side (extrusion)
  blue: ['#8DB0FF', '#2D63FB', '#1640C8', '#0D2A8C'],
  sky: ['#D6E3FF', '#9DB8FF', '#6E93F5', '#4D72D6'],
  orange: ['#FFC9A0', '#FF8A3D', '#E8642A', '#B4461A'],
  green: ['#9AF0C2', '#25BC6E', '#128A4E', '#0A6638'],
  red: ['#FFA3AE', '#F04A5E', '#C8293D', '#931A2A'],
  gold: ['#FFEA9C', '#FFC53A', '#E69C0E', '#AE7105'],
  paper: ['#FFFFFF', '#F4F7FE', '#DCE4F4', '#B9C6E0'],
  steel: ['#F5F7FB', '#C8D1DF', '#95A2B8', '#6C788E'],
  navy: ['#4E6A9C', '#1D3563', '#122447', '#0A1730'],
  pink: ['#FF9FCB', '#F0428E', '#C42370', '#8F1752'],
}

export type Ico3DName =
  | 'user' | 'users' | 'crown' | 'key' | 'lock' | 'unlock' | 'mail' | 'phone' | 'password' | 'policy' | 'doc' | 'shield'
  | 'bucket' | 'check' | 'cross' | 'ban' | 'search' | 'alert' | 'log' | 'gear' | 'wrench' | 'plus' | 'minus' | 'globe'
  | 'clock' | 'tag' | 'filter' | 'play' | 'toggle' | 'target' | 'building' | 'fingerprint' | 'server' | 'code' | 'list'
  | 'version' | 'receipt' | 'door' | 'laptop' | 'asterisk' | 'link' | 'cloud' | 'eye' | 'trash' | 'idcard' | 'object'
  | 'merge' | 'gavel' | 'bolt' | 'scale' | 'trail' | 'flag' | 'user-x' | 'user-plus' | 'user-minus' | 'token' | 'docfix'

export type Badge = 'check' | 'cross' | 'plus' | 'minus' | 'lock' | 'clock' | 'star' | 'alert'

function Defs({ id }: { id: string }) {
  return (
    <defs>
      {(Object.keys(T) as Tone[]).map((k) => {
        const [hi, mid, lo] = T[k]
        return (
          <g key={k}>
            <linearGradient id={`${id}l${k}`} x1="0" y1="0" x2="0.35" y2="1">
              <stop offset="0" stopColor={hi} />
              <stop offset="0.45" stopColor={mid} />
              <stop offset="1" stopColor={lo} />
            </linearGradient>
            <radialGradient id={`${id}r${k}`} cx="0.36" cy="0.3" r="0.78">
              <stop offset="0" stopColor={hi} />
              <stop offset="0.5" stopColor={mid} />
              <stop offset="1" stopColor={lo} />
            </radialGradient>
          </g>
        )
      })}
      <linearGradient id={`${id}gloss`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.75" />
        <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
      </linearGradient>
      <radialGradient id={`${id}shadow`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#0B1F4D" stopOpacity="0.32" />
        <stop offset="1" stopColor="#0B1F4D" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}glass`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#E9F1FF" />
        <stop offset="1" stopColor="#9FC0FF" />
      </linearGradient>
    </defs>
  )
}

/* ---------------------------------------------------------------- primitives (all in the 64 box) */
type P = { id: string }
const L = (id: string, t: Tone) => `url(#${id}l${t})`
const R = (id: string, t: Tone) => `url(#${id}r${t})`
const side = (t: Tone) => T[t][3]

const Shadow = ({ id, cx = 32, cy = 59, rx = 20, ry = 3.6 }: P & { cx?: number; cy?: number; rx?: number; ry?: number }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id}shadow)`} />
)

/** a glossy sphere */
const Ball = ({ id, cx, cy, r, t }: P & { cx: number; cy: number; r: number; t: Tone }) => (
  <g>
    <circle cx={cx} cy={cy + r * 0.08} r={r} fill={side(t)} />
    <circle cx={cx} cy={cy} r={r} fill={R(id, t)} />
    <ellipse cx={cx - r * 0.3} cy={cy - r * 0.42} rx={r * 0.42} ry={r * 0.24} fill="#FFFFFF" opacity="0.55" />
  </g>
)

/** an extruded rounded block: side first (offset down by `dz`), then the lit face, then a gloss band */
const Block = ({ id, x, y, w, h, r = 6, t, dz = 3.5, gloss = true }: P & { x: number; y: number; w: number; h: number; r?: number; t: Tone; dz?: number; gloss?: boolean }) => (
  <g>
    <rect x={x} y={y + dz} width={w} height={h} rx={r} fill={side(t)} />
    <rect x={x} y={y} width={w} height={h} rx={r} fill={L(id, t)} />
    {gloss && <rect x={x + 2} y={y + 1.5} width={w - 4} height={Math.min(h * 0.42, 14)} rx={Math.max(r - 2, 1)} fill={`url(#${id}gloss)`} opacity="0.7" />}
  </g>
)

/** an extruded path: the side copy offset down, then the lit face */
const Solid = ({ id, d, t, dz = 3.2, gloss }: P & { d: string; t: Tone; dz?: number; gloss?: string }) => (
  <g>
    <path d={d} fill={side(t)} transform={`translate(0 ${dz})`} />
    <path d={d} fill={L(id, t)} />
    {gloss && <path d={gloss} fill="#FFFFFF" opacity="0.42" />}
  </g>
)

const W = ({ d, w = 4, c = '#FFFFFF', o = 1 }: { d: string; w?: number; c?: string; o?: number }) => (
  <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={o} />
)

/** a sheet of paper with a folded corner */
const Sheet = ({ id, x = 14, y = 6, w = 36, h = 48 }: P & { x?: number; y?: number; w?: number; h?: number }) => {
  const f = 10
  const d = `M ${x + 4} ${y} H ${x + w - f} L ${x + w} ${y + f} V ${y + h - 4} Q ${x + w} ${y + h} ${x + w - 4} ${y + h} H ${x + 4} Q ${x} ${y + h} ${x} ${y + h - 4} V ${y + 4} Q ${x} ${y} ${x + 4} ${y} Z`
  return (
    <g>
      <path d={d} fill={side('paper')} transform="translate(0 3.2)" />
      <path d={d} fill={L(id, 'paper')} stroke="#C9D5EC" strokeWidth="0.8" />
      <path d={`M ${x + w - f} ${y} V ${y + f - 2} Q ${x + w - f} ${y + f} ${x + w - f + 2} ${y + f} H ${x + w} Z`} fill="#C7D3EA" />
    </g>
  )
}

const Bust = ({ id, t, dx = 0, dy = 0, k = 1 }: P & { t: Tone; dx?: number; dy?: number; k?: number }) => (
  <g transform={`translate(${dx} ${dy}) translate(32 34) scale(${k}) translate(-32 -34)`}>
    <Solid id={id} t={t} d="M 13 55 C 13 42 21 35.5 32 35.5 C 43 35.5 51 42 51 55 Q 51 57 49 57 H 15 Q 13 57 13 55 Z" gloss="M 19 44 C 22 39.5 26.5 38 32 38 C 28 40 24 42.5 21.5 47 Z" />
    <Ball id={id} cx={32} cy={21} r={11} t={t} />
  </g>
)

const gearPath = (cx: number, cy: number, ro: number, ri: number, n: number) => {
  const pts: string[] = []
  for (let i = 0; i < n * 2; i++) {
    const a0 = (Math.PI * i) / n - Math.PI / (n * 2.6)
    const a1 = (Math.PI * i) / n + Math.PI / (n * 2.6)
    const r = i % 2 === 0 ? ro : ri
    pts.push(`${(cx + Math.cos(a0) * r).toFixed(2)} ${(cy + Math.sin(a0) * r).toFixed(2)}`, `${(cx + Math.cos(a1) * r).toFixed(2)} ${(cy + Math.sin(a1) * r).toFixed(2)}`)
  }
  return `M ${pts.join(' L ')} Z`
}

const octa = (cx: number, cy: number, r: number) => {
  const p: string[] = []
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i + Math.PI / 8
    p.push(`${(cx + Math.cos(a) * r).toFixed(2)} ${(cy + Math.sin(a) * r).toFixed(2)}`)
  }
  return `M ${p.join(' L ')} Z`
}

/* ---------------------------------------------------------------- the drawings */
const DRAW: Record<Ico3DName, (id: string) => ReactNode> = {
  user: (id) => (<><Shadow id={id} /><Bust id={id} t="blue" /></>),
  users: (id) => (<><Shadow id={id} rx={24} /><Bust id={id} t="sky" dx={9} dy={-4} k={0.82} /><Bust id={id} t="blue" dx={-6} dy={2} k={0.9} /></>),
  'user-x': (id) => (<><Shadow id={id} /><Bust id={id} t="blue" dx={-3} /><Ball id={id} cx={49} cy={46} r={9} t="red" /><W d="M 45.5 42.5 L 52.5 49.5 M 52.5 42.5 L 45.5 49.5" w={3} /></>),
  'user-plus': (id) => (<><Shadow id={id} /><Bust id={id} t="blue" dx={-3} /><Ball id={id} cx={49} cy={46} r={9} t="green" /><W d="M 49 41.5 V 50.5 M 44.5 46 H 53.5" w={3} /></>),
  'user-minus': (id) => (<><Shadow id={id} /><Bust id={id} t="blue" dx={-3} /><Ball id={id} cx={49} cy={46} r={9} t="orange" /><W d="M 44.5 46 H 53.5" w={3} /></>),
  crown: (id) => (
    <>
      <Shadow id={id} />
      <Solid id={id} t="gold" d="M 9 22 L 20 33 L 32 13 L 44 33 L 55 22 L 51 47 H 13 Z" gloss="M 14 30 L 20 36 L 26 27 L 18 30 Z" />
      <Block id={id} x={12} y={44} w={40} h={9} r={3.5} t="gold" dz={2.5} />
      <Ball id={id} cx={32} cy={13} r={4} t="red" />
      <Ball id={id} cx={9} cy={22} r={3.4} t="blue" />
      <Ball id={id} cx={55} cy={22} r={3.4} t="blue" />
      <Ball id={id} cx={32} cy={36} r={4.2} t="red" />
    </>
  ),
  key: (id) => (
    <>
      <Shadow id={id} rx={24} />
      <g transform="rotate(-35 32 32)">
        <Block id={id} x={26} y={27.5} w={30} h={8} r={3} t="gold" dz={3} />
        <Block id={id} x={44} y={33} w={5} h={9} r={1.5} t="gold" dz={2} gloss={false} />
        <Block id={id} x={51} y={33} w={5} h={7} r={1.5} t="gold" dz={2} gloss={false} />
        <path d="M 18 18 a 13.5 13.5 0 1 0 0.01 0 Z M 18 26 a 5.5 5.5 0 1 1 -0.01 0 Z" fill={side('gold')} fillRule="evenodd" transform="translate(0 3)" />
        <path d="M 18 18 a 13.5 13.5 0 1 0 0.01 0 Z M 18 26 a 5.5 5.5 0 1 1 -0.01 0 Z" fill={R(id, 'gold')} fillRule="evenodd" />
        <ellipse cx={13} cy={22} rx={5} ry={2.6} fill="#FFFFFF" opacity="0.5" />
      </g>
    </>
  ),
  lock: (id) => (
    <>
      <Shadow id={id} />
      <path d="M 21 30 V 21 a 11 11 0 0 1 22 0 V 30" fill="none" stroke={side('steel')} strokeWidth="7.5" transform="translate(0 1.5)" />
      <path d="M 21 30 V 21 a 11 11 0 0 1 22 0 V 30" fill="none" stroke={L(id, 'steel')} strokeWidth="6" />
      <Block id={id} x={12} y={28} w={40} h={27} r={7} t="blue" dz={4} />
      <circle cx={32} cy={39} r={4.2} fill="#0A1E5A" />
      <rect x={30.4} y={40} width={3.2} height={8.5} rx={1.6} fill="#0A1E5A" />
    </>
  ),
  unlock: (id) => (
    <>
      <Shadow id={id} />
      <path d="M 21 24 V 16 a 11 11 0 0 1 22 0 V 18" fill="none" stroke={side('steel')} strokeWidth="7.5" transform="translate(0 1.5)" />
      <path d="M 21 24 V 16 a 11 11 0 0 1 22 0 V 18" fill="none" stroke={L(id, 'steel')} strokeWidth="6" />
      <Block id={id} x={12} y={28} w={40} h={27} r={7} t="green" dz={4} />
      <circle cx={32} cy={39} r={4.2} fill="#08442A" />
      <rect x={30.4} y={40} width={3.2} height={8.5} rx={1.6} fill="#08442A" />
    </>
  ),
  mail: (id) => (
    <>
      <Shadow id={id} rx={24} />
      <Block id={id} x={7} y={16} w={50} h={36} r={6} t="paper" dz={4} />
      <path d="M 8 20 L 32 37 L 56 20" fill="none" stroke={T.blue[1]} strokeWidth="4.5" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M 9 50 L 25 33 M 55 50 L 39 33" stroke="#C3CFE6" strokeWidth="2.2" strokeLinecap="round" />
      <Ball id={id} cx={50} cy={16} r={7} t="orange" />
    </>
  ),
  phone: (id) => (
    <>
      <Shadow id={id} rx={16} />
      <Block id={id} x={17} y={4} w={30} h={52} r={7} t="navy" dz={3.5} />
      <rect x={20} y={10} width={24} height={38} rx={3} fill={`url(#${id}glass)`} />
      <rect x={28} y={6.5} width={8} height={1.8} rx={0.9} fill="#5E7AAE" />
      {[24, 30, 36].map((x, i) => <circle key={i} cx={x + 2} cy={25} r={2.4} fill={T.blue[2]} />)}
      <path d="M 32 32 l 7 2.5 v 4.5 c 0 4 -3 6.5 -7 8 c -4 -1.5 -7 -4 -7 -8 v -4.5 Z" fill={L(id, 'green')} />
      <W d="M 28.8 39.2 l 2.3 2.3 l 4 -4" w={1.8} />
    </>
  ),
  password: (id) => (
    <>
      <Shadow id={id} rx={25} />
      <Block id={id} x={5} y={19} w={54} h={26} r={8} t="paper" dz={4} />
      {[15, 25, 35].map((x) => <Ball key={x} id={id} cx={x} cy={32} r={3.8} t="navy" />)}
      <rect x={45} y={24} width={3.4} height={16} rx={1.7} fill={T.blue[1]} />
    </>
  ),
  policy: (id) => (
    <>
      <Shadow id={id} rx={18} />
      <Sheet id={id} />
      {[18, 30, 42].map((y, i) => (
        <g key={y}>
          <Ball id={id} cx={22} cy={y} r={4} t={i === 1 ? 'red' : 'green'} />
          {i === 1 ? <W d={`M 20.4 ${y - 1.6} l 3.2 3.2 m 0 -3.2 l -3.2 3.2`} w={1.6} /> : <W d={`M 20 ${y} l 1.5 1.5 l 2.8 -2.8`} w={1.6} />}
          <rect x={29} y={y - 2} width={15} height={4} rx={2} fill="#B7C6E4" />
        </g>
      ))}
    </>
  ),
  doc: (id) => (
    <>
      <Shadow id={id} rx={18} />
      <Sheet id={id} />
      {[20, 27, 34, 41].map((y, i) => <rect key={y} x={20} y={y} width={i === 3 ? 14 : 24} height={3.6} rx={1.8} fill={i === 0 ? T.blue[1] : '#B7C6E4'} />)}
    </>
  ),
  docfix: (id) => (
    <>
      <Shadow id={id} rx={18} />
      <Sheet id={id} />
      {[20, 27, 34].map((y, i) => <rect key={y} x={20} y={y} width={i === 2 ? 12 : 22} height={3.6} rx={1.8} fill="#B7C6E4" />)}
      <Ball id={id} cx={44} cy={46} r={9.5} t="green" />
      <W d="M 39.5 46 l 3 3 l 6 -6" w={3} />
    </>
  ),
  shield: (id) => (
    <>
      <Shadow id={id} rx={18} />
      <Solid id={id} t="blue" d="M 32 5 L 53 13 V 30 C 53 43 44 52 32 57 C 20 52 11 43 11 30 V 13 Z" gloss="M 32 9 L 49 15.5 V 22 C 42 19 36 18.5 32 19 Z" />
      <W d="M 22.5 31 L 29 37.5 L 42 24.5" w={5} />
    </>
  ),
  bucket: (id) => (
    <>
      <Shadow id={id} rx={18} />
      <Solid id={id} t="green" d="M 12 16 L 18 52 Q 19 56 23 56 H 41 Q 45 56 46 52 L 52 16 Z" gloss="M 16 20 L 20 44 L 22 20 Z" />
      <ellipse cx={32} cy={16} rx={20} ry={6.5} fill={T.green[3]} />
      <ellipse cx={32} cy={15.2} rx={17.5} ry={4.8} fill="#0B5A34" />
      <path d="M 14 30 Q 32 38 50 30" fill="none" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="2" />
    </>
  ),
  object: (id) => (
    <>
      <Shadow id={id} rx={18} />
      <Sheet id={id} x={16} y={8} w={32} h={44} />
      <Ball id={id} cx={32} cy={33} r={9} t="green" />
      <W d="M 28 33 h 8 M 32 29 v 8" w={2.4} o={0.9} />
    </>
  ),
  check: (id) => (<><Shadow id={id} rx={17} /><Ball id={id} cx={32} cy={31} r={23} t="green" /><W d="M 21 31.5 L 29 39.5 L 44 24" w={6} /></>),
  cross: (id) => (<><Shadow id={id} rx={17} /><Solid id={id} t="orange" d={octa(32, 31, 25)} gloss="M 22 10 H 42 L 47 15 C 38 13 28 13 17 16 Z" /><W d="M 23 22 L 41 40 M 41 22 L 23 40" w={6} /></>),
  ban: (id) => (<><Shadow id={id} rx={17} /><Ball id={id} cx={32} cy={31} r={23} t="red" /><circle cx={32} cy={31} r={13.5} fill="none" stroke="#FFFFFF" strokeWidth="5" /><W d="M 22.5 40.5 L 41.5 21.5" w={5} /></>),
  search: (id) => (
    <>
      <Shadow id={id} rx={22} />
      <g transform="rotate(-45 46 46)"><Block id={id} x={36} y={42} w={26} h={9} r={4.5} t="navy" dz={2.5} /></g>
      <circle cx={27} cy={27.5} r={19} fill={side('blue')} />
      <circle cx={27} cy={26} r={19} fill={R(id, 'blue')} />
      <circle cx={27} cy={26} r={13} fill={`url(#${id}glass)`} />
      <ellipse cx={22} cy={20} rx={5.5} ry={3.2} fill="#FFFFFF" opacity="0.8" transform="rotate(-30 22 20)" />
    </>
  ),
  alert: (id) => (
    <>
      <Shadow id={id} rx={22} />
      <Solid id={id} t="orange" d="M 14 8 H 50 Q 58 8 58 16 V 36 Q 58 44 50 44 H 30 L 18 54 V 44 H 14 Q 6 44 6 36 V 16 Q 6 8 14 8 Z" gloss="M 14 11 H 50 Q 55 11 55 16 V 19 C 40 15 24 15 9 19 V 16 Q 9 11 14 11 Z" />
      <rect x={29} y={15} width={6} height={15} rx={3} fill="#FFFFFF" />
      <circle cx={32} cy={36} r={3.4} fill="#FFFFFF" />
    </>
  ),
  log: (id) => (
    <>
      <Shadow id={id} rx={18} />
      <Block id={id} x={12} y={9} w={40} h={47} r={6} t="paper" dz={3.5} />
      <Block id={id} x={23} y={5} w={18} h={9} r={3} t="blue" dz={2} />
      {[22, 31, 40].map((y, i) => (
        <g key={y}>
          <circle cx={20} cy={y + 1.5} r={2.6} fill={i === 2 ? T.orange[1] : T.blue[1]} />
          <rect x={26} y={y} width={i === 1 ? 14 : 19} height={3.4} rx={1.7} fill="#B7C6E4" />
        </g>
      ))}
    </>
  ),
  gear: (id) => (
    <>
      <Shadow id={id} rx={18} />
      <path d={gearPath(32, 31, 24, 18.5, 9)} fill={side('blue')} transform="translate(0 3)" />
      <path d={gearPath(32, 31, 24, 18.5, 9)} fill={L(id, 'blue')} />
      <circle cx={32} cy={31} r={8.5} fill={L(id, 'steel')} />
      <circle cx={32} cy={31} r={4} fill={side('blue')} />
    </>
  ),
  wrench: (id) => (
    <>
      <Shadow id={id} rx={20} />
      <g transform="rotate(45 32 32)">
        <Block id={id} x={28} y={22} w={8} h={38} r={4} t="steel" dz={2.5} />
        <path d="M 22 6 A 13 13 0 1 0 42 6 V 16 H 36 V 4 H 28 V 16 H 22 Z" fill={side('steel')} transform="translate(0 2.5)" />
        <path d="M 22 6 A 13 13 0 1 0 42 6 V 16 H 36 V 4 H 28 V 16 H 22 Z" fill={L(id, 'steel')} />
      </g>
      <Ball id={id} cx={48} cy={48} r={6.5} t="blue" />
    </>
  ),
  plus: (id) => (<><Shadow id={id} rx={17} /><Ball id={id} cx={32} cy={31} r={23} t="green" /><W d="M 32 20 V 42 M 21 31 H 43" w={6} /></>),
  minus: (id) => (<><Shadow id={id} rx={17} /><Ball id={id} cx={32} cy={31} r={23} t="orange" /><W d="M 21 31 H 43" w={6} /></>),
  globe: (id) => (
    <>
      <Shadow id={id} rx={17} />
      <Ball id={id} cx={32} cy={31} r={23} t="blue" />
      <g fill="none" stroke="#FFFFFF" strokeOpacity="0.75" strokeWidth="2">
        <ellipse cx={32} cy={31} rx={10} ry={23} />
        <path d="M 9 31 H 55 M 13 19 H 51 M 13 43 H 51 M 32 8 V 54" />
      </g>
    </>
  ),
  clock: (id) => (
    <>
      <Shadow id={id} rx={17} />
      <Ball id={id} cx={32} cy={31} r={24} t="blue" />
      <circle cx={32} cy={31} r={17.5} fill={L(id, 'paper')} />
      <W d="M 32 31 V 19 M 32 31 L 40 35" w={3.5} c={T.navy[1]} />
      <circle cx={32} cy={31} r={2.6} fill={T.orange[1]} />
    </>
  ),
  tag: (id) => (
    <>
      <Shadow id={id} rx={20} />
      <Solid id={id} t="orange" d="M 8 12 Q 8 8 12 8 H 30 Q 32 8 34 10 L 56 32 Q 58 34 56 36 L 36 56 Q 34 58 32 56 L 10 34 Q 8 32 8 30 Z" gloss="M 12 11 H 29 L 34 16 C 25 14 18 15 11 19 Z" />
      <circle cx={20} cy={20} r={5} fill={side('orange')} />
      <circle cx={20} cy={19.4} r={3.5} fill="#FFFFFF" />
    </>
  ),
  filter: (id) => (
    <>
      <Shadow id={id} rx={14} />
      <Solid id={id} t="blue" d="M 7 10 Q 7 7 10 7 H 54 Q 57 7 57 10 Q 57 12 55.5 13.5 L 38 31 V 50 Q 38 52 36 53 L 29 56 Q 26 57 26 54 V 31 L 8.5 13.5 Q 7 12 7 10 Z" gloss="M 11 9.5 H 53 L 50 13 C 38 11 26 11 14 13 Z" />
      <ellipse cx={32} cy={10} rx={21} ry={2.2} fill="#FFFFFF" opacity="0.35" />
    </>
  ),
  play: (id) => (<><Shadow id={id} rx={17} /><Ball id={id} cx={32} cy={31} r={23} t="blue" /><path d="M 26 19 L 44 31 L 26 43 Z" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="3" strokeLinejoin="round" /></>),
  bolt: (id) => (<><Shadow id={id} rx={17} /><Ball id={id} cx={32} cy={31} r={23} t="blue" /><path d="M 35 12 L 21 34 H 31 L 28 50 L 43 27 H 33 Z" fill={L(id, 'gold')} stroke="#FFFFFF" strokeWidth="1.5" strokeLinejoin="round" /></>),
  toggle: (id) => (
    <>
      <Shadow id={id} rx={25} />
      <Block id={id} x={4} y={18} w={56} h={28} r={14} t="green" dz={4} />
      <Ball id={id} cx={45} cy={32} r={11} t="paper" />
    </>
  ),
  target: (id) => (
    <>
      <Shadow id={id} rx={17} />
      <Ball id={id} cx={32} cy={31} r={23} t="red" />
      <circle cx={32} cy={31} r={16} fill={L(id, 'paper')} />
      <circle cx={32} cy={31} r={10} fill={R(id, 'red')} />
      <circle cx={32} cy={31} r={4.5} fill={L(id, 'paper')} />
    </>
  ),
  building: (id) => (
    <>
      <Shadow id={id} rx={22} />
      <Block id={id} x={10} y={20} w={22} h={36} r={3} t="sky" dz={3} />
      <Block id={id} x={26} y={6} w={28} h={50} r={3} t="blue" dz={3} />
      {[13, 23, 33].map((y) => [31, 41].map((x) => <rect key={`${x}${y}`} x={x + 1} y={y} width={7} height={6} rx={1.2} fill="#DCE8FF" />))}
      <rect x={36} y={44} width={8} height={12} rx={1.5} fill={T.navy[1]} />
      {[26, 36].map((y) => <rect key={y} x={14} y={y} width={8} height={5} rx={1} fill="#F1F5FF" />)}
    </>
  ),
  fingerprint: (id) => (
    <>
      <Shadow id={id} rx={17} />
      <Ball id={id} cx={32} cy={31} r={23} t="blue" />
      <g fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round">
        <path d="M 20 26 a 12 12 0 0 1 24 0 v 4" />
        <path d="M 24.5 44 c 1.5 -3 2 -7 2 -13 a 5.5 5.5 0 0 1 11 0 c 0 6 -0.5 10 -2.5 14" />
        <path d="M 32 31 c 0 7 -1 11 -3.5 15" />
        <path d="M 19.5 33 c 0 4 -0.5 6.5 -1.5 8.5" />
        <path d="M 44 36 c -0.3 3 -1 6 -2 8" />
      </g>
    </>
  ),
  server: (id) => (
    <>
      <Shadow id={id} rx={22} />
      {[6, 22, 38].map((y) => (
        <g key={y}>
          <Block id={id} x={9} y={y} w={46} h={14} r={4} t="navy" dz={3} />
          <circle cx={46} cy={y + 7} r={2.2} fill="#3BE68A" />
          <rect x={15} y={y + 5.5} width={18} height={3} rx={1.5} fill="#5E7AAE" />
        </g>
      ))}
    </>
  ),
  code: (id) => (
    <>
      <Shadow id={id} rx={22} />
      <Block id={id} x={6} y={10} w={52} h={42} r={7} t="navy" dz={4} />
      <circle cx={13} cy={17} r={2} fill="#FF6B6B" /><circle cx={19} cy={17} r={2} fill="#FFC53A" /><circle cx={25} cy={17} r={2} fill="#3BE68A" />
      <W d="M 24 27 L 17 34 L 24 41 M 40 27 L 47 34 L 40 41" w={3.6} c={T.orange[1]} />
      <W d="M 35 25 L 29 43" w={3} c="#8DB0FF" />
    </>
  ),
  list: (id) => (
    <>
      <Shadow id={id} rx={18} />
      <Block id={id} x={10} y={7} w={44} h={48} r={7} t="paper" dz={3.5} />
      {[18, 30, 42].map((y, i) => (
        <g key={y}>
          <Ball id={id} cx={20} cy={y} r={3.8} t={i === 0 ? 'blue' : 'sky'} />
          <rect x={28} y={y - 2} width={i === 2 ? 14 : 19} height={4} rx={2} fill="#B7C6E4" />
        </g>
      ))}
    </>
  ),
  version: (id) => (
    <>
      <Shadow id={id} rx={20} />
      <g transform="translate(6 -3)"><Block id={id} x={16} y={8} w={32} h={40} r={5} t="sky" dz={2} /></g>
      <Block id={id} x={12} y={12} w={34} h={42} r={5} t="paper" dz={3.5} />
      {[22, 29, 36].map((y, i) => <rect key={y} x={18} y={y} width={i === 2 ? 12 : 20} height={3.4} rx={1.7} fill="#B7C6E4" />)}
      <Ball id={id} cx={44} cy={46} r={9} t="blue" />
      <W d="M 44 41.5 V 46 L 47.5 48" w={2.4} />
    </>
  ),
  receipt: (id) => (
    <>
      <Shadow id={id} rx={18} />
      <Solid id={id} t="paper" d="M 14 6 H 50 V 56 L 45 52 L 40 56 L 35 52 L 30 56 L 25 52 L 20 56 L 14 52 Z" />
      {[16, 23, 30].map((y, i) => <rect key={y} x={20} y={y} width={i === 0 ? 24 : 16} height={3.4} rx={1.7} fill="#B7C6E4" />)}
      <Ball id={id} cx={40} cy={41} r={7.5} t="gold" />
      <text x={40} y={44.5} textAnchor="middle" fontFamily="DM Sans, sans-serif" fontWeight={800} fontSize="10" fill="#8A5A00">$</text>
    </>
  ),
  door: (id) => (
    <>
      <Shadow id={id} rx={20} />
      <Block id={id} x={14} y={5} w={36} h={51} r={4} t="steel" dz={3} />
      <Block id={id} x={18} y={9} w={28} h={47} r={3} t="blue" dz={0} />
      <rect x={22} y={14} width={20} height={14} rx={2} fill="#FFFFFF" opacity="0.18" />
      <Ball id={id} cx={40} cy={35} r={2.8} t="gold" />
    </>
  ),
  laptop: (id) => (
    <>
      <Shadow id={id} rx={26} />
      <Block id={id} x={11} y={9} w={42} h={30} r={4} t="navy" dz={2} />
      <rect x={14} y={12} width={36} height={24} rx={2} fill={`url(#${id}glass)`} />
      <rect x={18} y={17} width={18} height={3} rx={1.5} fill={T.blue[1]} /><rect x={18} y={23} width={24} height={3} rx={1.5} fill="#7FA2E8" />
      <Solid id={id} t="steel" dz={2.5} d="M 5 43 H 59 L 56 51 Q 55 53 52 53 H 12 Q 9 53 8 51 Z" />
    </>
  ),
  asterisk: (id) => (<><Shadow id={id} rx={17} /><Ball id={id} cx={32} cy={31} r={23} t="orange" /><W d="M 32 18 V 44 M 20.7 24.5 L 43.3 37.5 M 43.3 24.5 L 20.7 37.5" w={5} /></>),
  link: (id) => (
    <>
      <Shadow id={id} rx={22} />
      <g transform="rotate(-40 32 32)">
        <rect x={6} y={24} width={28} height={16} rx={8} fill="none" stroke={side('blue')} strokeWidth="7" transform="translate(0 2.5)" />
        <rect x={6} y={24} width={28} height={16} rx={8} fill="none" stroke={L(id, 'blue')} strokeWidth="6" />
        <rect x={30} y={24} width={28} height={16} rx={8} fill="none" stroke={side('steel')} strokeWidth="7" transform="translate(0 2.5)" />
        <rect x={30} y={24} width={28} height={16} rx={8} fill="none" stroke={L(id, 'steel')} strokeWidth="6" />
      </g>
    </>
  ),
  cloud: (id) => (
    <>
      <Shadow id={id} rx={24} />
      <Solid id={id} t="blue" d="M 17 50 A 12 12 0 0 1 15 26 A 15 15 0 0 1 43 21 A 12 12 0 0 1 49 50 Z" gloss="M 18 30 A 12 12 0 0 1 40 22 C 32 23 24 26 18 30 Z" />
    </>
  ),
  eye: (id) => (
    <>
      <Shadow id={id} rx={24} />
      <Solid id={id} t="paper" d="M 4 32 C 12 18 22 12 32 12 C 42 12 52 18 60 32 C 52 46 42 52 32 52 C 22 52 12 46 4 32 Z" />
      <Ball id={id} cx={32} cy={32} r={12} t="blue" />
      <circle cx={32} cy={32} r={5} fill={T.navy[2]} />
      <circle cx={28.5} cy={28.5} r={2.4} fill="#FFFFFF" />
    </>
  ),
  trash: (id) => (
    <>
      <Shadow id={id} rx={17} />
      <Solid id={id} t="red" d="M 15 20 H 49 L 46 53 Q 45.6 56 42.6 56 H 21.4 Q 18.4 56 18 53 Z" gloss="M 19 23 H 25 L 26 50 H 22 Z" />
      <Block id={id} x={11} y={12} w={42} h={8} r={3} t="red" dz={2.5} />
      <Block id={id} x={26} y={7} w={12} h={6} r={2} t="red" dz={1.5} gloss={false} />
      <W d="M 27 28 V 47 M 37 28 V 47" w={2.8} o={0.8} />
    </>
  ),
  idcard: (id) => (
    <>
      <Shadow id={id} rx={25} />
      <Block id={id} x={5} y={13} w={54} h={38} r={6} t="paper" dz={4} />
      <rect x={5} y={13} width={54} height={9} rx={4} fill={L(id, 'blue')} />
      <Ball id={id} cx={20} cy={32} r={5} t="blue" />
      <path d="M 12 46 C 12 40 16 38 20 38 C 24 38 28 40 28 46 Z" fill={L(id, 'blue')} />
      {[30, 37].map((y, i) => <rect key={y} x={33} y={y} width={i ? 14 : 20} height={3.4} rx={1.7} fill="#B7C6E4" />)}
    </>
  ),
  merge: (id) => (
    <>
      <Shadow id={id} rx={22} />
      {[[10, 'blue'], [26, 'sky'], [42, 'blue']].map(([y, t]) => <Block key={String(y)} id={id} x={6} y={Number(y)} w={20} h={12} r={4} t={t as Tone} dz={2} />)}
      <W d="M 27 16 H 34 V 32 H 40 M 27 32 H 40 M 27 48 H 34 V 32" w={3} c={T.blue[1]} />
      <Ball id={id} cx={48} cy={32} r={9} t="blue" />
    </>
  ),
  gavel: (id) => (
    <>
      <Shadow id={id} rx={24} />
      <Block id={id} x={10} y={48} w={34} h={7} r={3} t="navy" dz={2} />
      <g transform="rotate(-40 32 30)">
        <Block id={id} x={28} y={22} w={30} h={6} r={3} t="gold" dz={2} />
        <Block id={id} x={14} y={12} w={16} h={26} r={4} t="blue" dz={3} />
      </g>
    </>
  ),
  scale: (id) => (
    <>
      <Shadow id={id} rx={22} />
      <Block id={id} x={29} y={12} w={6} h={40} r={3} t="steel" dz={2} />
      <Block id={id} x={18} y={50} w={28} h={6} r={3} t="navy" dz={2} />
      <W d="M 10 18 H 54" w={3.6} c={T.steel[2]} />
      <path d="M 4 34 Q 10 44 16 34 Z M 48 34 Q 54 44 60 34 Z" fill={L(id, 'blue')} />
      <W d="M 10 18 L 4 34 M 10 18 L 16 34 M 54 18 L 48 34 M 54 18 L 60 34" w={1.4} c={T.steel[2]} />
      <Ball id={id} cx={32} cy={11} r={4} t="gold" />
    </>
  ),
  trail: (id) => (
    <>
      <Shadow id={id} rx={22} />
      <Block id={id} x={6} y={10} w={52} h={44} r={7} t="pink" dz={4} />
      <path d="M 18 34 A 7 7 0 0 1 20 21 A 10 10 0 0 1 38 19 A 8 8 0 0 1 46 34 Z" fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinejoin="round" />
      <W d="M 14 41 H 30 M 14 47 H 40" w={2.6} />
      <circle cx={46} cy={44} r={4} fill="#FFFFFF" />
    </>
  ),
  flag: (id) => (
    <>
      <Shadow id={id} rx={14} cx={22} />
      <Block id={id} x={14} y={6} w={5} h={50} r={2.5} t="steel" dz={1.5} />
      <Solid id={id} t="orange" d="M 19 9 H 52 L 44 20 L 52 31 H 19 Z" />
    </>
  ),
  token: (id) => (
    <>
      <Shadow id={id} rx={20} />
      <ellipse cx={32} cy={36} rx={22} ry={22} fill={side('gold')} />
      <circle cx={32} cy={32} r={22} fill={R(id, 'gold')} />
      <circle cx={32} cy={32} r={15.5} fill="none" stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="2" />
      <path d="M 32 21 L 41 26 V 33 C 41 38.5 37 42 32 44 C 27 42 23 38.5 23 33 V 26 Z" fill={L(id, 'blue')} />
      <W d="M 28 32.5 l 3 3 l 5.5 -5.5" w={2.4} />
    </>
  ),
}

function BadgeMark({ id, b }: { id: string; b: Badge }) {
  const t: Tone = b === 'check' ? 'green' : b === 'cross' ? 'red' : b === 'plus' ? 'green' : b === 'minus' ? 'orange' : b === 'alert' ? 'orange' : b === 'star' ? 'gold' : 'blue'
  return (
    <g>
      <circle cx={51} cy={51} r={11.5} fill="#FFFFFF" />
      <Ball id={id} cx={51} cy={51} r={9.5} t={t} />
      {b === 'check' && <W d="M 46.5 51 l 3 3 l 6 -6" w={2.8} />}
      {b === 'cross' && <W d="M 47.5 47.5 l 7 7 m 0 -7 l -7 7" w={2.8} />}
      {b === 'plus' && <W d="M 51 46.5 v 9 m -4.5 -4.5 h 9" w={2.8} />}
      {b === 'minus' && <W d="M 46.5 51 h 9" w={2.8} />}
      {b === 'alert' && <W d="M 51 46 v 5.5 M 51 55.5 v 0.1" w={2.8} />}
      {b === 'clock' && <W d="M 51 46.5 v 4.5 l 3.2 2" w={2.4} />}
      {b === 'lock' && <><rect x={46.5} y={50} width={9} height={6.5} rx={1.6} fill="#FFFFFF" /><path d="M 48.5 50 v -2 a 2.5 2.5 0 0 1 5 0 v 2" fill="none" stroke="#FFFFFF" strokeWidth="1.8" /></>}
      {b === 'star' && <path d="M 51 45.5 l 1.7 3.6 3.9 .5 -2.9 2.7 .8 3.9 -3.5 -2 -3.5 2 .8 -3.9 -2.9 -2.7 3.9 -.5 Z" fill="#FFFFFF" />}
    </g>
  )
}

export type Loop = 'bob' | 'float' | 'pulse' | 'tilt' | 'spin' | 'glint' | 'beat' | 'swing' | 'none'

/** a 3D-style icon. `loop` = its quiet micro-animation, `d` = a phase offset in seconds, `t` = its period. */
export function Ico3D({ name, size = 48, loop = 'bob', d = 0, t, badge, style, title }: { name: Ico3DName; size?: number; loop?: Loop; d?: number; t?: number; badge?: Badge; style?: CSSProperties; title?: string }) {
  const id = 'i3' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const draw = DRAW[name] ?? DRAW.doc
  return (
    <span
      className={loop !== 'none' ? `i3d i3d-${loop}` : undefined}
      style={{ display: 'inline-grid', placeItems: 'center', width: size, height: size, flexShrink: 0, ['--i3d-d' as string]: `${-d}s`, ...(t ? { ['--i3d-t' as string]: `${t}s` } : {}), ...style } as CSSProperties}
      aria-hidden={title ? undefined : true}
      title={title}
    >
      <svg viewBox="0 0 64 64" width={size} height={size} style={{ display: 'block', overflow: 'visible' }}>
        <Defs id={id} />
        {draw(id)}
        {badge && <BadgeMark id={id} b={badge} />}
      </svg>
    </span>
  )
}

/** a 3D icon on a soft white plinth tile, for places that had a tile before */
export function Tile3D({ name, size = 56, k = 0.78, loop = 'bob', d = 0, t, badge, ring, bg }: { name: Ico3DName; size?: number; k?: number; loop?: Loop; d?: number; t?: number; badge?: Badge; ring?: string; bg?: string }) {
  const r = Math.round(size * 0.28)
  return (
    <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: size, height: size, flexShrink: 0, borderRadius: r, background: bg ?? 'linear-gradient(180deg, #FFFFFF 0%, #EEF3FF 100%)', boxShadow: ring ?? 'inset 0 0 0 1.5px #D3DEF6, 0 10px 20px -12px rgba(31,64,140,0.5)' }}>
      <Ico3D name={name} size={Math.round(size * k)} loop={loop} d={d} t={t} badge={badge} />
    </span>
  )
}

export const css = `
.i3d { animation-delay: var(--i3d-d, 0s); will-change: transform; }
@keyframes i3d-bob { 0%, 100% { transform: translateY(-1.5px) } 50% { transform: translateY(1.5px) } }
.i3d-bob { animation: i3d-bob var(--i3d-t, 2.6s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes i3d-float { 0%, 100% { transform: translateY(0) rotate(-2deg) } 50% { transform: translateY(-3px) rotate(2deg) } }
.i3d-float { animation: i3d-float var(--i3d-t, 3.4s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes i3d-pulse { 0%, 100% { transform: scale(0.95) } 50% { transform: scale(1.05) } }
.i3d-pulse { animation: i3d-pulse var(--i3d-t, 2.2s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes i3d-tilt { 0%, 100% { transform: rotate(-6deg) } 50% { transform: rotate(6deg) } }
.i3d-tilt { animation: i3d-tilt var(--i3d-t, 3s) cubic-bezier(0.45,0,0.55,1) infinite; transform-origin: 50% 85%; }
@keyframes i3d-spin { 0% { transform: rotate(0deg) } 100% { transform: rotate(360deg) } }
.i3d-spin { animation: i3d-spin var(--i3d-t, 8s) linear infinite; }
@keyframes i3d-glint { 0%, 72%, 100% { transform: rotate(0deg) scale(1) } 80% { transform: rotate(-9deg) scale(1.07) } 88% { transform: rotate(5deg) scale(1.03) } }
.i3d-glint { animation: i3d-glint var(--i3d-t, 3.4s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes i3d-beat { 0%, 60%, 100% { transform: scale(1) } 70% { transform: scale(1.1) } 80% { transform: scale(0.98) } 90% { transform: scale(1.04) } }
.i3d-beat { animation: i3d-beat var(--i3d-t, 2.4s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes i3d-swing { 0%, 100% { transform: rotate(-10deg) } 50% { transform: rotate(10deg) } }
.i3d-swing { animation: i3d-swing var(--i3d-t, 2.8s) cubic-bezier(0.45,0,0.55,1) infinite; transform-origin: 50% 10%; }
.cc-still .i3d, .deck-thumb .i3d { animation: none !important; transform: none !important; }
@media (prefers-reduced-motion: reduce) { .i3d { animation: none !important; } }
`

export const ICO3D_NAMES = Object.keys(DRAW) as Ico3DName[]
