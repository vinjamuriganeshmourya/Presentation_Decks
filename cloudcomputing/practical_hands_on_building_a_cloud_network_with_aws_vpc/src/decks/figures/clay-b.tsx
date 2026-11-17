import { useId, type ReactNode } from 'react'
import { ClaySvg, useEase } from './art'
import { mo } from './motion'
import { R, Shadow } from './depth'
import { useFx, Slab, Led, drop, lift, type Fx } from './clay-a'

/**
 * SECTION 2's DRAWINGS IN THE REFERENCE RENDER'S STYLE (user, 2026-10-16,
 * "slide 5 is the image style reference, same style for all"): every object
 * is a solid the way slide 5's rack, cloud, tiles and meter are, built with
 * the finish kit in `clay-a.tsx` (`useFx` for per-instance gradients, glows
 * and the shadow blur; `Slab` for a boxy solid with a lit top and a shaded
 * side; `Led` for a light with its glow). Fronts are graded lit to shaded,
 * tops carry a thin white inner edge, rounded forms a specular bloom on the
 * upper left, and anything that stands casts a soft blurred shadow.
 *
 * The clay structure stays: `ClaySvg` turns each top-level part with its
 * rim, small details sit inside their part's `<g>`, connector lines carry
 * `data-flat`, no outlines. Object colours are the Lab palette (`LAB`) and
 * the render's (`R`); slide chrome stays on the tokens. Labels are never
 * drawn inside an object (content rule 17).
 *
 * MOTION (the motion layer, same day): every loop and seed is where it was,
 * on an inner part or on each top-level part with one shared phase
 * (`useSeed` gives each copy of a drawing its own), never on an element
 * whose transform a state change drives.
 */

/** A per-instance phase seed, so two copies of one drawing never move in step. */
function useSeed(): number {
  let h = 0
  for (const c of useId()) h = (h * 31 + c.charCodeAt(0)) % 97
  return h
}

/* the Lab's Library palette: objects' own colours. COLOURS (user, 2026-10-22, "washed out"): the pastel members
   (sky, lavender, paper, sage, green) sit on the reference render's hues now, cool blues rather than grey-violets. */
export const LAB = {
  cobalt: '#0055E8',
  sky: '#6DAAFF',
  periwinkle: '#5856DC',
  lavender: '#D3E1FB',
  lavDeep: '#A6BBE8',
  paper: '#EDF3FD',
  yellow: '#FCC82B',
  orange: '#FC963C',
  red: '#D8352F',
  sage: '#6E9A72',
  navy: '#283A8E',
  charcoal: '#3E3D45',
  green: '#3DDC84',
  wood: '#C98A55',
}

/** The soft ground shadow under an object (the render's cool blurred pool). */
function Floor({ fx, cx, cy, rx, ry = 5, o = 0.2 }: { fx: Fx; cx: number; cy: number; rx: number; ry?: number; o?: number }) {
  return <Shadow id={fx.id} cx={cx} cy={cy} rx={rx} ry={ry} o={o} />
}

/** A screen's glass: the graded pane and a diagonal sheen across its upper left. */
function Glass({ x, y, w, h, rx, fill }: { x: number; y: number; w: number; h: number; rx: number; fill: string }) {
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={fill} />
      <path d={`M ${x + 2} ${y + 2} L ${x + w * 0.45} ${y + 2} L ${x + 2} ${y + h * 0.7} Z`} fill="#FFFFFF" opacity={0.22} />
    </>
  )
}

/* ------------------------------------------------------------------ computers */

/** The mainframe: two tape cabinets and a console of lights, lavender and navy. */
export function ClayMainframe({ w, busy = true }: { w: number; busy?: boolean }) {
  const ease = useEase()
  const fx = useFx({ cab: LAB.lavender, cobalt: LAB.cobalt, navy: LAB.navy, paper: LAB.paper, bar: LAB.lavDeep })
  const LIGHTS = [LAB.yellow, LAB.green, LAB.orange, LAB.green, LAB.red, LAB.yellow, LAB.green, LAB.orange, LAB.yellow]
  const TONES: Record<string, 'yellow' | 'green' | 'orange' | 'red'> = { [LAB.yellow]: 'yellow', [LAB.green]: 'green', [LAB.orange]: 'orange', [LAB.red]: 'red' }
  return (
    <ClaySvg w={w} vw={220} vh={160} large={w > 200}>
      {fx.defs}
      <Floor fx={fx} cx={110} cy={154} rx={104} ry={6} />
      {[0, 1].map((k) => (
        <g key={k}>
          <Slab x={8 + k * 70} y={14} w={64} h={134} rx={12} d={5} hue={LAB.lavender} fill={fx.g('cab')} spec={false} />
          <rect x={8 + k * 70} y={14} width={64} height={16} rx={8} fill={fx.g('cobalt')} />
          <rect x={16 + k * 70} y={15} width={48} height={1.5} fill="#FFFFFF" opacity={0.35} />
          <rect x={16 + k * 70} y={38} width={48} height={64} rx={8} fill={fx.g('navy')} />
          {[0, 1].map((r) => (
            <g key={r} transform={`translate(${40 + k * 70} ${54 + r * 32})`}>
              <g {...(busy ? mo(r ? 'spin-ccw' : 'spin', r + k * 2, { dur: 6 }) : {})}>
                <circle r={12} fill={fx.g('paper')} />
                <circle r={12} fill={fx.spec} opacity={0.5} />
                <circle r={4.5} fill={LAB.charcoal} />
                <rect x={-1.5} y={-11} width={3} height={6} rx={1.5} fill={LAB.lavDeep} transform={`rotate(${busy ? 40 + r * 70 : 0})`} style={{ transition: ease }} />
              </g>
            </g>
          ))}
          <rect x={18 + k * 70} y={112} width={44} height={6} rx={3} fill={fx.g('bar')} />
          <rect x={18 + k * 70} y={124} width={30} height={6} rx={3} fill={fx.g('bar')} />
        </g>
      ))}
      <g>
        <Slab x={150} y={14} w={62} h={134} rx={12} d={5} hue={LAB.navy} fill={fx.g('navy')} spec={false} />
        <rect x={150} y={14} width={62} height={16} rx={8} fill={fx.g('cobalt')} />
        <rect x={158} y={15} width={46} height={1.5} fill="#FFFFFF" opacity={0.35} />
        {LIGHTS.map((c, i) => (
          <Led key={i} cx={164 + (i % 3) * 17} cy={46 + Math.floor(i / 3) * 16} r={5} tone={TONES[c]} fill={busy ? c : LAB.lavDeep} fx={fx} on={busy} motion={busy ? mo('blink', i) : undefined} style={{ transition: ease }} />
        ))}
        <rect x={160} y={100} width={42} height={8} rx={4} fill={LAB.sky} {...mo('glow', 3)} />
        <rect x={160} y={116} width={30} height={8} rx={4} fill={LAB.sky} opacity={0.7} {...mo('glow', 4)} />
      </g>
    </ClaySvg>
  )
}

/** A terminal: a rounded CRT with green text lines and a keyboard. `lit` lights the lines. */
export function ClayTerminal({ w, lit = false }: { w: number; lit?: boolean }) {
  const ease = useEase()
  const seed = useSeed()
  const fx = useFx({ case: LAB.lavender, screen: LAB.charcoal, key: LAB.lavDeep })
  return (
    <ClaySvg w={w} vw={110} vh={100}>
      {fx.defs}
      <Floor fx={fx} cx={55} cy={97} rx={50} ry={4} />
      <rect x={46} y={66} width={18} height={12} rx={3} fill={fx.g('key')} />
      <g {...mo('hover', seed)}>
        <Slab x={10} y={4} w={90} h={66} rx={16} d={0} hue={LAB.lavender} fill={fx.g('case')} />
        <Glass x={19} y={12} w={72} h={48} rx={9} fill={fx.g('screen')} />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={27} y={21 + i * 11} width={i === 1 ? 26 : 42} height={5} rx={2.5} fill={LAB.green} opacity={lit ? 1 : 0.3} className={lit ? mo('type', i + seed).className : undefined} style={{ transition: ease, ...(lit ? mo('type', i + seed).style : {}) }} />
        ))}
        {lit && <rect x={71} y={43} width={2.5} height={5} rx={1} fill={LAB.green} {...mo('cursor', seed)} />}
      </g>
      <g>
        <Slab x={6} y={78} w={98} h={16} rx={7} d={0} hue={LAB.lavender} fill={fx.g('case')} spec={false} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={14 + i * 14} y={83} width={10} height={5} rx={2} fill={fx.g('key')} />
        ))}
      </g>
    </ClaySvg>
  )
}

/** A desktop: charcoal monitor with a sky screen, a navy tower beside it. */
export function ClayDesktop({ w, lit = true }: { w: number; lit?: boolean }) {
  const ease = useEase()
  const seed = useSeed()
  const fx = useFx({ frame: LAB.charcoal, stand: LAB.lavender, tower: LAB.navy, paper: LAB.paper, cobalt: LAB.cobalt })
  return (
    <ClaySvg w={w} vw={150} vh={116}>
      {fx.defs}
      <Floor fx={fx} cx={75} cy={111} rx={70} ry={4} />
      <rect x={50} y={76} width={16} height={16} rx={3} fill={LAB.lavDeep} />
      <rect x={32} y={90} width={52} height={10} rx={5} fill={fx.g('stand')} />
      <g {...mo('hover', seed)}>
        <Slab x={4} y={4} w={108} h={74} rx={12} d={0} hue={LAB.charcoal} fill={fx.g('frame')} spec={false} />
        <rect x={12} y={12} width={92} height={58} rx={6} fill={lit ? fx.cloudSky : fx.g('stand')} style={{ transition: ease }} />
        <path d="M 14 14 L 54 14 L 14 50 Z" fill="#FFFFFF" opacity={0.2} />
        <rect x={20} y={20} width={36} height={22} rx={4} fill={fx.g('paper')} opacity={lit ? 1 : 0.5} />
        <rect x={62} y={22} width={34} height={5} rx={2.5} fill={LAB.cobalt} opacity={lit ? 1 : 0.3} {...(lit ? mo('type', seed) : {})} />
        <rect x={62} y={32} width={24} height={5} rx={2.5} fill={LAB.cobalt} opacity={lit ? 0.6 : 0.2} {...(lit ? mo('type', seed + 1) : {})} />
        {lit && <rect x={88} y={32} width={2} height={5} rx={1} fill={LAB.cobalt} {...mo('cursor', seed)} />}
        <rect x={20} y={50} width={76} height={10} rx={4} fill={fx.g('cobalt')} opacity={lit ? 0.9 : 0.25} />
      </g>
      <g>
        <Slab x={118} y={30} w={28} h={74} rx={8} d={4} hue={LAB.navy} fill={fx.g('tower')} spec={false} />
        <Led cx={132} cy={44} r={4} tone="green" fill={lit ? LAB.green : LAB.lavDeep} fx={fx} on={lit} motion={lit ? mo('blink', seed + 2) : undefined} />
        <rect x={124} y={56} width={16} height={4} rx={2} fill={LAB.lavDeep} opacity={0.6} />
      </g>
    </ClaySvg>
  )
}

/** A laptop: charcoal lid, sky screen, lavender base. */
export function ClayLaptop({ w }: { w: number }) {
  const seed = useSeed()
  const fx = useFx({ lid: LAB.charcoal, base: LAB.lavender, paper: LAB.paper, cobalt: LAB.cobalt })
  const idle = mo('hover', seed)
  return (
    <ClaySvg w={w} vw={160} vh={110}>
      {fx.defs}
      <Floor fx={fx} cx={80} cy={105} rx={74} ry={4} />
      <g {...idle}>
        <Slab x={20} y={4} w={120} h={80} rx={11} d={0} hue={LAB.charcoal} fill={fx.g('lid')} spec={false} />
        <rect x={28} y={12} width={104} height={64} rx={6} fill={fx.cloudSky} />
        <path d="M 30 14 L 76 14 L 30 54 Z" fill="#FFFFFF" opacity={0.2} />
        <rect x={36} y={20} width={40} height={26} rx={4} fill={fx.g('paper')} />
        <rect x={84} y={22} width={38} height={5} rx={2.5} fill={LAB.cobalt} {...mo('type', seed)} />
        <rect x={84} y={32} width={26} height={5} rx={2.5} fill={LAB.cobalt} opacity={0.6} {...mo('type', seed + 1)} />
        <rect x={112} y={32} width={2} height={5} rx={1} fill={LAB.cobalt} {...mo('cursor', seed)} />
        <rect x={36} y={56} width={86} height={10} rx={4} fill={fx.g('cobalt')} opacity={0.9} />
      </g>
      <g {...idle}>
        <path d="M 4 86 H 156 Q 156 98 146 98 H 14 Q 4 98 4 86 Z" fill={fx.g('base')} />
        <rect x={12} y={86} width={136} height={1.5} fill="#FFFFFF" opacity={0.35} />
        <rect x={64} y={86} width={32} height={4} rx={2} fill={LAB.lavDeep} />
      </g>
    </ClaySvg>
  )
}

/** A server: a navy box of `n` lavender units, each with a green light. */
export function ClayServerBox({ w, n = 4 }: { w: number; n?: number }) {
  const H = 22 + n * 26
  const fx = useFx({ navy: LAB.navy, unit: LAB.lavender })
  return (
    <ClaySvg w={w} vw={90} vh={H + 8}>
      {fx.defs}
      <Floor fx={fx} cx={45} cy={H + 5} rx={42} ry={4} />
      <g>
        <Slab x={4} y={4} w={82} h={H - 4} rx={12} d={5} hue={LAB.navy} fill={fx.g('navy')} spec={false} />
        {Array.from({ length: n }, (_, i) => (
          <g key={i}>
            <rect x={13} y={14 + i * 26} width={64} height={19} rx={6} fill={fx.g('unit')} />
            <rect x={18} y={14 + i * 26} width={54} height={1.2} fill="#FFFFFF" opacity={0.6} />
            <rect x={20} y={21 + i * 26} width={26} height={5} rx={2.5} fill={LAB.cobalt} />
            <Led cx={67} cy={23.5 + i * 26} r={4} tone={i % 3 === 2 ? 'yellow' : 'green'} fill={i % 3 === 2 ? LAB.yellow : LAB.green} fx={fx} motion={mo('blink', i + 2)} />
          </g>
        ))}
      </g>
    </ClaySvg>
  )
}

/* ------------------------------------------------------------------ places and things */

/** The cloud: two layers of soft puffs, sky behind and cobalt in front, graded crown to base. */
export function ClayCloud({ w }: { w: number }) {
  const seed = useSeed()
  const fx = useFx({})
  return (
    <ClaySvg w={w} vw={200} vh={124} large={w > 180} {...mo('hover', seed)}>
      {fx.defs}
      <Floor fx={fx} cx={100} cy={120} rx={70} ry={4} o={0.16} />
      <path d="M 52 104 C 26 104 14 86 20 70 C 26 56 40 52 50 54 C 52 34 70 20 92 22 C 108 23 120 32 126 44 C 134 30 156 26 170 38 C 184 50 184 70 174 80 C 190 86 190 104 172 104 Z" fill={fx.cloudSky} />
      <g>
        <path d="M 44 116 C 20 116 8 98 14 84 C 20 70 34 66 46 68 C 48 46 68 34 90 36 C 108 37 120 48 124 60 C 134 50 154 50 164 62 C 174 72 172 86 166 92 C 182 96 182 116 160 116 Z" transform="translate(0 4)" fill={R.cloudUnder} />
        <path d="M 44 116 C 20 116 8 98 14 84 C 20 70 34 66 46 68 C 48 46 68 34 90 36 C 108 37 120 48 124 60 C 134 50 154 50 164 62 C 174 72 172 86 166 92 C 182 96 182 116 160 116 Z" fill={fx.cloud} />
        <path d="M 44 116 C 20 116 8 98 14 84 C 20 70 34 66 46 68 C 48 46 68 34 90 36 C 108 37 120 48 124 60 C 134 50 154 50 164 62 C 174 72 172 86 166 92 C 182 96 182 116 160 116 Z" fill={fx.spec} opacity={0.55} />
        <ellipse cx={82} cy={50} rx={18} ry={6} fill="#FFFFFF" opacity={0.28} />
      </g>
    </ClaySvg>
  )
}

/**
 * The richer cloud for a statement: a two-layer cloud with the three things
 * it delivers hanging from it on links (a server, a database, a laptop).
 */
export function ClayCloudScene({ w }: { w: number }) {
  const lev = mo('levitate', 0)
  const fx = useFx({ navy: LAB.navy, unit: LAB.lavender, peri: LAB.periwinkle, sky: LAB.sky, lid: LAB.charcoal, paper: LAB.paper, base: LAB.lavender })
  const BACK = 'M 70 98 C 40 98 26 76 34 58 C 42 42 58 38 70 41 C 74 18 96 4 122 6 C 142 8 156 18 163 32 C 174 16 202 14 218 30 C 234 46 230 70 218 78 C 238 84 236 98 216 98 Z'
  const FRONT = 'M 60 118 C 30 118 16 96 24 78 C 32 62 50 58 62 61 C 66 36 90 22 116 24 C 138 26 152 38 158 52 C 170 40 194 40 206 56 C 218 70 214 86 208 92 C 228 98 226 118 200 118 Z'
  return (
    <ClaySvg w={w} vw={260} vh={230} large>
      {fx.defs}
      <Floor fx={fx} cx={130} cy={226} rx={110} ry={5} o={0.16} />
      <g data-flat>
        {[70, 130, 190].map((x, i) => (
          <path key={x} d={`M 130 112 Q ${(x + 130) / 2} 140 ${x} 158`} fill="none" stroke={R.cable} strokeWidth={3} strokeDasharray="5 6" strokeLinecap="round" {...mo('dash', i)} />
        ))}
      </g>
      <path d={BACK} fill={fx.cloudSky} {...lev} />
      <g {...lev}>
        <path d={FRONT} transform="translate(0 5)" fill={R.cloudUnder} />
        <path d={FRONT} fill={fx.cloud} />
        <path d={FRONT} fill={fx.spec} opacity={0.55} />
        <ellipse cx={104} cy={40} rx={20} ry={7} fill="#FFFFFF" opacity={0.28} />
      </g>
      <g transform="translate(70 186)">
        <Slab x={-24} y={-30} w={48} h={60} rx={10} d={4} hue={LAB.navy} fill={fx.g('navy')} spec={false} />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={-16} y={-22 + i * 17} width={32} height={11} rx={4} fill={fx.g('unit')} />
            <Led cx={9} cy={-16.5 + i * 17} r={2.6} tone="green" fill={LAB.green} fx={fx} motion={mo('blink', i + 1)} />
          </g>
        ))}
      </g>
      <g transform="translate(130 188)">
        <g {...mo('pulse', 4)}>
          <rect x={-22} y={-24} width={44} height={50} rx={8} fill={fx.g('peri')} />
          <ellipse cx={0} cy={-24} rx={22} ry={8} fill={fx.g('sky')} />
          <ellipse cx={-6} cy={-26} rx={9} ry={2.5} fill="#FFFFFF" opacity={0.45} />
          <rect x={-22} y={-4} width={44} height={3} fill={LAB.navy} opacity={0.35} />
          <rect x={-22} y={10} width={44} height={3} fill={LAB.navy} opacity={0.35} />
        </g>
      </g>
      <g transform="translate(190 186)">
        <g {...mo('hover', 5)}>
          <Slab x={-26} y={-26} w={52} h={36} rx={7} d={0} hue={LAB.charcoal} fill={fx.g('lid')} spec={false} />
          <rect x={-21} y={-21} width={42} height={26} rx={4} fill={fx.cloudSky} />
          <path d="M -19 -19 L 0 -19 L -19 -2 Z" fill="#FFFFFF" opacity={0.22} />
          <rect x={-15} y={-15} width={18} height={10} rx={2} fill={fx.g('paper')} />
          <path d="M -32 12 H 32 Q 32 22 24 22 H -24 Q -32 22 -32 12 Z" fill={fx.g('base')} />
        </g>
      </g>
    </ClaySvg>
  )
}

/** The cloud provider's data centre: a long building, a cloud on the roof, rows of lit windows. */
export function ClayDataCentre({ w }: { w: number }) {
  const fx = useFx({ wall: LAB.lavender, roof: LAB.navy, pane: LAB.sky })
  const CLOUD = 'M 82 50 C 70 50 64 42 66 34 C 68 26 75 23 82 24 C 85 13 94 8 104 9 C 113 10 119 16 121 23 C 131 20 142 27 142 37 C 142 45 136 50 128 50 Z'
  return (
    <ClaySvg w={w} vw={220} vh={160} large={w > 200}>
      {fx.defs}
      <Floor fx={fx} cx={110} cy={154} rx={104} ry={6} />
      <g {...mo('hover', 1)}>
        <path d={CLOUD} transform="translate(0 3)" fill={R.cloudUnder} />
        <path d={CLOUD} fill={fx.cloud} />
        <path d={CLOUD} fill={fx.spec} opacity={0.5} />
      </g>
      <g>
        <Slab x={10} y={56} w={200} h={92} rx={14} d={7} hue={LAB.lavender} fill={fx.g('wall')} spec={false} top={lift(LAB.navy, 0.3)} />
        {/* the roof band, square where it meets the top and side faces (review 2026-10-26: it was rounded, leaving a notch at the corner) */}
        <path d="M 10 70 Q 10 56 24 56 H 210 V 74 H 10 Z" fill={fx.g('roof')} />
        <path d={`M 210 56 L 217 52.15 L 217 70.15 L 210 74 Z`} fill={drop(LAB.navy, 0.2)} />
        <rect x={20} y={57} width={180} height={1.5} fill="#FFFFFF" opacity={0.3} />
        {Array.from({ length: 12 }, (_, i) => (
          <g key={i} {...mo('glow', i)}>
            <rect x={24 + (i % 6) * 31} y={84 + Math.floor(i / 6) * 28} width={22} height={18} rx={4} fill={i % 5 === 3 ? '#FFFFFF' : fx.g('pane')} />
            <rect x={25 + (i % 6) * 31} y={85 + Math.floor(i / 6) * 28} width={9} height={6} rx={2} fill="#FFFFFF" opacity={0.4} />
          </g>
        ))}
      </g>
    </ClaySvg>
  )
}

/** An institution (a university building): a cobalt pediment, four columns, two steps. */
export function ClayInstitution({ w, tone = LAB.cobalt }: { w: number; tone?: string }) {
  const idle = mo('hover', useSeed())
  const fx = useFx({ tone, wall: LAB.lavender, column: LAB.paper, step: LAB.lavDeep })
  return (
    <ClaySvg w={w} vw={120} vh={100}>
      {fx.defs}
      <Floor fx={fx} cx={60} cy={97} rx={56} ry={4} />
      <g {...idle}>
        <path d="M 8 32 L 60 6 L 112 32 Z" fill={fx.g('tone')} />
        <path d="M 8 32 L 60 6 L 64 9 L 16 32 Z" fill="#FFFFFF" opacity={0.3} />
      </g>
      <g {...idle}>
        <Slab x={14} y={34} w={92} h={50} rx={6} d={0} hue={LAB.lavender} fill={fx.g('wall')} spec={false} />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect x={22 + i * 22} y={40} width={10} height={40} rx={4} fill={fx.g('column')} />
            <rect x={23 + i * 22} y={41} width={3} height={38} rx={1.5} fill="#FFFFFF" opacity={0.6} />
          </g>
        ))}
      </g>
      <g {...idle}>
        <rect x={8} y={84} width={104} height={10} rx={4} fill={fx.g('step')} />
        <rect x={14} y={84} width={92} height={1.5} fill="#FFFFFF" opacity={0.4} />
      </g>
    </ClaySvg>
  )
}

/** An electricity-style utility meter: a periwinkle tile with its underside, a round dial, a row of digits. */
export function ClayMeter({ w, value = 0.6 }: { w: number; value?: number }) {
  const ease = useEase(700)
  const fx = useFx({ tile: LAB.periwinkle, digits: LAB.charcoal })
  const a = -110 + Math.max(0, Math.min(1, value)) * 220
  return (
    <ClaySvg w={w} vw={100} vh={124}>
      {fx.defs}
      <Floor fx={fx} cx={50} cy={121} rx={44} ry={4} />
      <g>
        <rect x={8} y={10} width={84} height={108} rx={16} fill={drop(LAB.periwinkle, 0.3)} />
        <rect x={8} y={4} width={84} height={112} rx={16} fill={fx.g('tile')} />
        <rect x={14} y={7} width={72} height={30} rx={14} fill="#FFFFFF" opacity={0.14} />
        <rect x={16} y={5} width={68} height={1.5} rx={0.75} fill="#FFFFFF" opacity={0.35} />
        <rect x={20} y={86} width={60} height={18} rx={6} fill={fx.g('digits')} />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={26 + i * 13} y={91} width={8} height={8} rx={2} fill={i === 3 ? LAB.orange : LAB.yellow} {...(i === 3 ? mo('glow', 1) : {})} />
        ))}
      </g>
      <g {...mo('pulse', 2)}>
        <circle cx={50} cy={44} r={30} fill={fx.dial} />
        <path d="M 29 59 A 26 26 0 1 1 71 59" fill="none" stroke={R.arcGrey} strokeWidth={5} strokeLinecap="round" />
        <path d="M 29 59 A 26 26 0 1 1 71 59" fill="none" stroke={LAB.cobalt} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray="1" style={{ strokeDashoffset: 1 - value, transition: ease }} />
        <g style={{ transformBox: 'view-box', transformOrigin: '50px 44px', transform: `rotate(${a}deg)`, transition: ease }}>
          <path d="M 50 44 L 47.5 26 L 50 20 L 52.5 26 Z" fill={LAB.red} />
        </g>
        <circle cx={50} cy={44} r={4.5} fill={R.needle} />
        <circle cx={49} cy={43} r={1.5} fill="#FFFFFF" opacity={0.8} />
      </g>
    </ClaySvg>
  )
}

/** A wall clock: a paper face in a cobalt rim, the hand at `turn` (0 to 1). */
export function ClayClock({ w, turn }: { w: number; turn: number }) {
  const ease = useEase(700)
  const fx = useFx({ rim: LAB.cobalt })
  return (
    <ClaySvg w={w} vw={64} vh={64}>
      {fx.defs}
      <g>
        <circle cx={32} cy={32} r={29} fill={fx.g('rim')} />
        <circle cx={32} cy={32} r={29} fill={fx.spec} opacity={0.5} />
      </g>
      <g>
        <circle cx={32} cy={32} r={22} fill={fx.dial} />
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={32 + 16 * Math.sin((i * Math.PI) / 2)} cy={32 - 16 * Math.cos((i * Math.PI) / 2)} r={2} fill={LAB.lavDeep} />
        ))}
        <path d="M 32 32 L 32 16" stroke={R.needle} strokeWidth={3.5} strokeLinecap="round" style={{ transformBox: 'view-box', transformOrigin: '32px 32px', transform: `rotate(${turn * 360}deg)`, transition: ease }} />
        <path d="M 32 32 L 41 32" stroke={R.needle} strokeWidth={3.5} strokeLinecap="round" className={mo('tick').className} style={{ ...mo('tick', 0, { dur: 60 }).style, transformBox: 'view-box', transformOrigin: '32px 32px' }} />
        <circle cx={32} cy={32} r={3.5} fill={LAB.red} />
        <circle cx={31} cy={31} r={1} fill="#FFFFFF" opacity={0.8} />
      </g>
    </ClaySvg>
  )
}

/** A padlock: yellow body, a lavender shackle. */
/**
 * A padlock that reads as one at 15px (user 2026-10-22, "icons are not completely
 * in shape, for example the lock"): a thick navy shackle, a tall arch standing
 * clear of the body, on a gold body with a bold keyhole. The shackle used to
 * be pale lavender and thin, so at the VM-card size it vanished into the card
 * and the lock was a yellow blob with a dot.
 */
export function ClayPadlock({ w }: { w: number }) {
  const fx = useFx({ shackle: LAB.navy, body: LAB.yellow })
  return (
    <ClaySvg w={w} vw={40} vh={48}>
      {fx.defs}
      <path d="M 7 24 V 15 A 13 13 0 0 1 33 15 V 24 H 26 V 15 A 6 6 0 0 0 14 15 V 24 Z" fill={fx.g('shackle')} />
      <g>
        <rect x={2} y={22} width={36} height={25} rx={7} fill={fx.g('body')} />
        <rect x={9} y={22.5} width={22} height={1.5} fill="#FFFFFF" opacity={0.5} />
        <ellipse cx={11} cy={28} rx={4.5} ry={2.2} fill="#FFFFFF" opacity={0.35} />
        <circle cx={20} cy={32} r={4.2} fill={LAB.charcoal} />
        <rect x={18} y={33} width={4} height={8.5} rx={2} fill={LAB.charcoal} />
      </g>
    </ClaySvg>
  )
}

/** A stack of job cards waiting in a batch tray. */
export function ClayJobTray({ w }: { w: number }) {
  const TONES = [LAB.orange, LAB.yellow, LAB.sky, LAB.periwinkle]
  const fx = useFx({ card: LAB.paper, orange: LAB.orange, yellow: LAB.yellow, sky: LAB.sky, peri: LAB.periwinkle, tray: LAB.navy })
  const KEYS = ['orange', 'yellow', 'sky', 'peri']
  return (
    <ClaySvg w={w} vw={160} vh={90}>
      {fx.defs}
      <Floor fx={fx} cx={80} cy={87} rx={74} ry={4} />
      {TONES.map((_, i) => (
        <g key={i} {...mo('hover', i * 3)}>
          <rect x={12 + i * 34} y={8} width={30} height={46} rx={6} fill={fx.g('card')} />
          <rect x={12 + i * 34} y={8} width={30} height={10} rx={5} fill={fx.g(KEYS[i])} />
          <rect x={16 + i * 34} y={9} width={22} height={1.2} fill="#FFFFFF" opacity={0.4} />
          <rect x={18 + i * 34} y={26} width={18} height={4} rx={2} fill={LAB.lavDeep} />
          <rect x={18 + i * 34} y={35} width={12} height={4} rx={2} fill={LAB.lavDeep} />
        </g>
      ))}
      <g>
        <path d="M 4 50 H 156 V 66 Q 156 80 142 80 H 18 Q 4 80 4 66 Z" fill={fx.g('tray')} />
        <rect x={10} y={50} width={140} height={1.5} fill="#FFFFFF" opacity={0.25} />
      </g>
    </ClaySvg>
  )
}

/** A long reading-room table, wooden. */
export function ClayTable({ w }: { w: number }) {
  const fx = useFx({ wood: LAB.wood, leg: LAB.navy })
  return (
    <ClaySvg w={w} vw={420} vh={44} {...mo('hover', 0, { dur: 6 })}>
      {fx.defs}
      <rect x={30} y={14} width={14} height={28} rx={4} fill={fx.g('leg')} />
      <rect x={376} y={14} width={14} height={28} rx={4} fill={fx.g('leg')} />
      <g>
        <rect x={0} y={2} width={420} height={18} rx={9} fill={fx.g('wood')} />
        <rect x={12} y={3} width={396} height={2} rx={1} fill="#FFFFFF" opacity={0.3} />
      </g>
    </ClaySvg>
  )
}

/** An open book, for the reading room. */
export function ClayBook({ w }: { w: number }) {
  const fx = useFx({ cover: LAB.red, page: LAB.paper })
  return (
    <ClaySvg w={w} vw={60} vh={36} {...mo('hover', useSeed())}>
      {fx.defs}
      <path d="M 4 8 Q 18 2 30 8 Q 42 2 56 8 V 32 Q 42 26 30 32 Q 18 26 4 32 Z" fill={fx.g('cover')} />
      <g>
        <path d="M 8 6 Q 19 1 29 6 V 28 Q 19 23 8 28 Z" fill={fx.g('page')} />
        <path d="M 31 6 Q 41 1 52 6 V 28 Q 41 23 31 28 Z" fill={fx.g('page')} />
        <path d="M 9 7 Q 19 3 28 7 L 28 9 Q 19 5 9 9 Z" fill="#FFFFFF" opacity={0.6} />
      </g>
    </ClaySvg>
  )
}

/* ------------------------------------------------------------------ virtualization */

const OS_TONES = [LAB.cobalt, LAB.orange, LAB.sage]

/**
 * One VM's own operating system: a window whose title bar, icons and panel
 * differ by `k`, so three VMs read as three different systems.
 */
export function ClayOsWindow({ w, k }: { w: number; k: number }) {
  const tone = OS_TONES[k % 3]
  const fx = useFx({ page: LAB.paper, tone, screen: LAB.charcoal, panel: LAB.lavender, sky: LAB.sky, gold: LAB.yellow, sage: LAB.sage, orange: LAB.orange })
  return (
    <ClaySvg w={w} vw={100} vh={72}>
      {fx.defs}
      <Floor fx={fx} cx={50} cy={70} rx={40} ry={3} o={0.16} />
      <g>
        <rect x={4} y={4} width={92} height={64} rx={10} fill={fx.g('page')} />
        <rect x={4} y={4} width={92} height={15} rx={7} fill={fx.g('tone')} />
        <rect x={12} y={5} width={76} height={1.5} fill="#FFFFFF" opacity={0.35} />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={14 + i * 8} cy={11.5} r={2.4} fill={LAB.paper} opacity={0.85} />
        ))}
        {k % 3 === 0 && (
          <>
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={14 + (i % 2) * 22} y={26 + Math.floor(i / 2) * 19} width={16} height={14} rx={4} fill={i === 0 ? fx.g('gold') : fx.g('sky')} {...mo('pulse', i)} />
            ))}
            <rect x={62} y={28} width={26} height={30} rx={4} fill={fx.g('panel')} />
          </>
        )}
        {k % 3 === 1 && (
          <>
            <Glass x={12} y={26} w={76} h={34} rx={5} fill={fx.g('screen')} />
            <rect x={18} y={32} width={30} height={4} rx={2} fill={LAB.green} {...mo('type', 0)} />
            <rect x={18} y={40} width={44} height={4} rx={2} fill={LAB.green} opacity={0.7} {...mo('type', 1)} />
            <rect x={18} y={48} width={20} height={4} rx={2} fill={LAB.yellow} {...mo('type', 2)} />
            <rect x={40} y={48} width={2} height={4} rx={1} fill={LAB.green} {...mo('cursor')} />
          </>
        )}
        {k % 3 === 2 && (
          <>
            {[14, 24, 34, 18].map((h, i) => (
              <rect key={i} x={16 + i * 14} y={60 - h} width={9} height={h} rx={3} fill={i === 2 ? fx.g('orange') : fx.g('sage')} {...mo('breathe', i)} />
            ))}
            <g {...mo('pulse', 5)}>
              <circle cx={78} cy={40} r={11} fill={fx.g('sky')} />
              <circle cx={78} cy={40} r={11} fill={fx.spec} opacity={0.5} />
            </g>
          </>
        )}
      </g>
    </ClaySvg>
  )
}

/**
 * A wide rounded bar drawn in the render's finish with DOM text over it (a
 * hypervisor slab, a server shelf), so its words stay real text.
 */
export function ClayBar({ w, h, fill, children }: { w: number; h: number; fill: string; children?: ReactNode }) {
  const fx = useFx({ bar: fill })
  const rx = Math.min(16, h / 2)
  return (
    <div className="relative" style={{ width: w, height: h }}>
      <ClaySvg w={w} vw={w} vh={h} large={h > 40} style={{ position: 'absolute', inset: 0 }}>
        {fx.defs}
        <g>
          <rect x={0} y={0} width={w} height={h} rx={rx} fill={fx.g('bar')} />
          <rect x={rx} y={0} width={Math.max(0, w - 2 * rx)} height={1.5} fill="#FFFFFF" opacity={0.3} />
          <rect x={rx} y={h - 2} width={Math.max(0, w - 2 * rx)} height={2} fill={drop(fill, 0.3)} opacity={0.5} />
        </g>
      </ClaySvg>
      <div className="absolute inset-0 flex items-center justify-center gap-2">{children}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ the plot of flats */

/**
 * One plot, three locked flats: a building cut open on a grass plot, each
 * flat furnished its own way (a sofa and lamp, a bed and window, a table and
 * plant), each door with its own padlock. Door numbers are DOM, laid over by
 * the caller at `FLAT_DOORS`.
 */
export const FLAT_W = 420
export const FLAT_H = 250
export const FLAT_DOORS = [0, 1, 2].map((i) => ({ x: 30 + i * 124 + 95, y: 143 }))
export function ClayFlats({ w }: { w: number }) {
  const fx = useFx({ grass: LAB.sage, roof: LAB.orange, wall: LAB.lavDeep, flat: LAB.paper, door: LAB.navy, cobalt: LAB.cobalt, peri: LAB.periwinkle, wood: LAB.wood, gold: LAB.yellow, orange: LAB.orange, sage: LAB.sage, sky: LAB.sky })
  return (
    <ClaySvg w={w} vw={FLAT_W} vh={FLAT_H} large>
      {fx.defs}
      <rect x={0} y={222} width={420} height={26} rx={13} fill={fx.g('grass')} />
      <g>
        <path d="M 10 70 L 210 8 L 410 70 Z" fill={fx.g('roof')} />
        <path d="M 10 70 L 210 8 L 216 12 L 24 70 Z" fill="#FFFFFF" opacity={0.28} />
      </g>
      <Slab x={20} y={70} w={380} h={160} rx={12} d={0} hue={LAB.lavDeep} fill={fx.g('wall')} spec={false} />
      {[0, 1, 2].map((i) => {
        const x = 30 + i * 124
        return (
          <g key={i}>
            <rect x={x} y={80} width={112} height={140} rx={8} fill={fx.g('flat')} />
            <rect x={x + 6} y={80} width={100} height={1.5} fill="#FFFFFF" />
            {/* the flat's own door, with its padlock */}
            <rect x={x + 84} y={140} width={22} height={80} rx={4} fill={fx.g('door')} />
            <rect x={x + 89} y={176} width={12} height={10} rx={2.5} fill={fx.g('gold')} />
            <path d={`M ${x + 91} 176 V 172 A 4 4 0 0 1 ${x + 99} 172 V 176`} fill="none" stroke={LAB.yellow} strokeWidth={2.2} {...mo('shackle', i * 2)} />
            {i === 0 && (
              <>
                <rect x={x + 8} y={182} width={58} height={22} rx={8} fill={fx.g('cobalt')} />
                <rect x={x + 8} y={172} width={14} height={32} rx={6} fill={fx.g('cobalt')} />
                <rect x={x + 18} y={186} width={40} height={10} rx={4} fill={fx.g('sky')} />
                <rect x={x + 72} y={140} width={3} height={78} fill={LAB.charcoal} />
                <g {...mo('glow', 1)}>
                  <ellipse cx={x + 73} cy={136} rx={16} ry={8} fill={fx.gl('yellow')} />
                  <path d={`M ${x + 64} 140 L ${x + 82} 140 L ${x + 78} 124 L ${x + 68} 124 Z`} fill={fx.g('gold')} />
                </g>
              </>
            )}
            {i === 1 && (
              <>
                <rect x={x + 14} y={96} width={40} height={32} rx={5} fill={fx.cloudSky} />
                <path d={`M ${x + 16} 98 L ${x + 34} 98 L ${x + 16} 118 Z`} fill="#FFFFFF" opacity={0.3} />
                <rect x={x + 33} y={96} width={2} height={32} fill={LAB.paper} />
                <rect x={x + 8} y={182} width={64} height={22} rx={6} fill={fx.g('peri')} />
                <rect x={x + 8} y={170} width={16} height={34} rx={5} fill={fx.g('peri')} />
                <rect x={x + 26} y={178} width={42} height={10} rx={4} fill={fx.g('flat')} />
              </>
            )}
            {i === 2 && (
              <>
                <rect x={x + 10} y={176} width={50} height={8} rx={3} fill={fx.g('wood')} />
                <rect x={x + 16} y={184} width={5} height={30} fill={fx.g('wood')} />
                <rect x={x + 49} y={184} width={5} height={30} fill={fx.g('wood')} />
                <rect x={x + 26} y={164} width={14} height={12} rx={3} fill={fx.g('orange')} />
                <path d={`M ${x + 33} 164 C ${x + 22} 150 ${x + 26} 136 ${x + 33} 132 C ${x + 40} 136 ${x + 44} 150 ${x + 33} 164 Z`} fill={fx.g('sage')} {...mo('pulse', 7, { base: true })} />
                <rect x={x + 14} y={98} width={30} height={24} rx={4} fill={fx.g('gold')} />
                <rect x={x + 17} y={99} width={24} height={1.5} fill="#FFFFFF" opacity={0.45} />
              </>
            )}
          </g>
        )
      })}
    </ClaySvg>
  )
}

/* ------------------------------------------------------------------ shipping */

/** A small shop, a sender of parcels: an awning in `tone`, a window and a door. */
export function ClayShop({ w, tone }: { w: number; tone: string }) {
  const idle = mo('hover', useSeed())
  const fx = useFx({ wall: LAB.lavender, door: LAB.navy, awning: tone })
  return (
    <ClaySvg w={w} vw={80} vh={74}>
      {fx.defs}
      <Floor fx={fx} cx={40} cy={71} rx={36} ry={3} />
      <g {...idle}>
        <Slab x={8} y={22} w={64} h={46} rx={6} d={0} hue={LAB.lavender} fill={fx.g('wall')} spec={false} />
        <rect x={16} y={36} width={26} height={18} rx={3} fill={fx.cloudSky} />
        <path d="M 18 38 L 30 38 L 18 50 Z" fill="#FFFFFF" opacity={0.3} />
        <rect x={48} y={36} width={16} height={32} rx={3} fill={fx.g('door')} />
      </g>
      <g {...idle}>
        <rect x={4} y={8} width={72} height={18} rx={6} fill={fx.g('awning')} />
        <rect x={10} y={9} width={60} height={1.5} fill="#FFFFFF" opacity={0.4} />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={16 + i * 20} y={8} width={10} height={18} fill={LAB.paper} opacity={0.55} />
        ))}
      </g>
    </ClaySvg>
  )
}

/** A parcel in the sender's colour, tied with a pale band. */
export function ClayParcel({ w, tone }: { w: number; tone: string }) {
  const fx = useFx({ tone })
  return (
    <ClaySvg w={w} vw={40} vh={40}>
      {fx.defs}
      <Floor fx={fx} cx={20} cy={38} rx={16} ry={2.5} o={0.18} />
      <g {...mo('hover', useSeed())}>
        <Slab x={3} y={6} w={34} h={30} rx={6} d={0} hue={tone} fill={fx.g('tone')} />
        <rect x={17} y={6} width={6} height={30} fill={LAB.paper} opacity={0.55} />
      </g>
    </ClaySvg>
  )
}

/** A delivery truck carrying parcels in their senders' colours. */
export function ClayTruck({ w, parcels = [] }: { w: number; parcels?: string[] }) {
  const idle = mo('hover', 2)
  const fx = useFx({ box: LAB.paper, cab: LAB.cobalt, tyre: LAB.charcoal, ...Object.fromEntries(parcels.map((t, i) => [`p${i}`, t])) })
  return (
    <ClaySvg w={w} vw={180} vh={100} large={w > 200}>
      {fx.defs}
      <Floor fx={fx} cx={90} cy={95} rx={86} ry={5} />
      <g {...idle}>
        <Slab x={4} y={8} w={116} h={64} rx={10} d={0} hue="#E8EAF5" fill={fx.g('box')} spec={false} />
        {parcels.map((_, i) => (
          <g key={i}>
            <rect x={14 + i * 34} y={34} width={30} height={32} rx={5} fill={fx.g(`p${i}`)} />
            <rect x={26 + i * 34} y={34} width={6} height={32} fill={LAB.paper} opacity={0.5} />
          </g>
        ))}
      </g>
      <g {...idle}>
        {/* review 2026-10-26 (joints): the cab starts inside the box's back edge; there was a 2px gap between them */}
        <path d="M 116 26 H 150 Q 158 26 162 32 L 174 48 Q 176 52 176 58 V 66 Q 176 72 170 72 H 116 Z" fill={fx.g('cab')} />
        <path d="M 126 26 H 150 Q 154 26 156 28 H 126 Z" fill="#FFFFFF" opacity={0.35} />
        <path d="M 130 32 H 148 L 160 48 H 130 Z" fill={fx.cloudSky} />
        <path d="M 132 34 L 146 34 L 132 44 Z" fill="#FFFFFF" opacity={0.35} />
      </g>
      {/* review 2026-10-26 (deck 2, slide 32): the tyres are drawn still. The CSS spin class on this group,
          under the clay filter, left them unpainted in the live deck (the truck floated); a parked
          delivery truck's wheels do not need to turn. */}
      {[36, 146].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={76} r={13} fill={fx.g('tyre')} />
          <circle cx={cx} cy={76} r={13} fill={fx.spec} opacity={0.35} />
          <circle cx={cx} cy={76} r={5} fill={LAB.lavender} />
          <rect x={cx - 1.5} y={66} width={3} height={7} rx={1.5} fill={LAB.lavender} opacity={0.6} />
        </g>
      ))}
    </ClaySvg>
  )
}

/** A platform scale, its needle at `value` (0 to 1). */
export function ClayScale({ w, value }: { w: number; value: number }) {
  const ease = useEase()
  const fx = useFx({ plate: LAB.lavDeep, body: LAB.navy })
  return (
    <ClaySvg w={w} vw={80} vh={70}>
      {fx.defs}
      <Floor fx={fx} cx={40} cy={67} rx={36} ry={3} />
      <g>
        <rect x={6} y={4} width={68} height={10} rx={5} fill={fx.g('plate')} />
        <rect x={12} y={5} width={56} height={1.5} fill="#FFFFFF" opacity={0.45} />
      </g>
      <rect x={34} y={12} width={12} height={12} rx={2} fill={fx.g('plate')} />
      <g {...mo('pulse', 3)}>
        <Slab x={4} y={22} w={72} h={42} rx={12} d={0} hue={LAB.navy} fill={fx.g('body')} />
        <path d="M 22 54 A 18 18 0 0 1 58 54" fill="none" stroke={LAB.paper} strokeWidth={3} />
        <path d="M 40 54 L 40 40" stroke={LAB.yellow} strokeWidth={3.5} strokeLinecap="round" style={{ transformBox: 'view-box', transformOrigin: '40px 54px', transform: `rotate(${-80 + value * 160}deg)`, transition: ease }} />
      </g>
    </ClaySvg>
  )
}
