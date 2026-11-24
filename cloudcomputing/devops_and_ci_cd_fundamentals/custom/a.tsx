import { useId, type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Badge, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, Frame, Show, Plinth, MarkTile, Wire, Junction, Token, keyframes, tag, heading, useHeld, useHot, type Pt } from '@/engine/figkit'
import pipelineMark from '../images/aws-codepipeline.svg'
import deployMark from '../images/aws-codedeploy.svg'

/*
 * SESSION 22 · SECTION 1 (DevOps Principles) technical figures, builder A.
 * Built to generate-slides standing corrections 13-17 and cloud course R7-R14: 3D icons on plinth tiles, official marks
 * on white tiles (the marks never move), >= 20 px equal padding, orthogonal wires computed from the same constants as
 * the boxes, a flow dot on every live wire, a lit item walking first -> last -> first after the build (starting on the
 * last item). Loops are transform / opacity on HTML elements or a root svg only. Held (?still): the full final state,
 * nothing lit, nothing moving. Class prefix `s22a-`.
 *
 *   slide 6  A_T01   566 x 380  Dev and Ops circles overlapping into one DevOps zone; a two-way collaboration route
 *                               into a shared plan (1); the production server in the overlap, owned by both (2)
 *   slide 7  A_T01B  566 x 380  the same zone: production feeds straight back to the developer (1); a shared pipeline
 *                               replaces the manual handoff from Dev to Ops (2)
 *   slide 9  A_T02   566 x 380  Dev | brick wall | Ops, a code package stuck on the wall (No Context Passed): speed and
 *                               stability pulling apart (1); the wall of confusion (2)
 *   slide 10 A_T02B  566 x 380  the same wall: blame thrown across it, bad infra and bad code (1); manual approvals
 *                               queuing at the wall while the clock runs (2)
 *   slide 11 A_T03   526 x 400  one shared dashboard watched by Dev and Ops: postmortem (1), on-call rotation (2), both
 *                               teams on the same metrics (3), CodePipeline and CodeDeploy on its header (4)
 *   slide 12 A_T04   566 x 380  the shared-ownership circle feeding a faint outline of the eight lifecycle stages: one
 *                               team (1), the stages fill in (2), the handoff gaps close (3)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('s22a')
const BLUE = colors.brand
const RIM = 'inset 0 0 0 1.5px #D3DEF6, 0 12px 24px -16px rgba(31,64,140,0.34)'
const LIT = `inset 0 0 0 2.5px ${ORANGE}, 0 10px 22px -12px rgba(255,138,61,0.7)`

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)
const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })

/** the build: the step, the lit item, held. The walk after the build starts on the LAST item (S18 fix). */
function useBuild(p: Record<string, unknown>, period: number) {
  const cnt = Number(p.steps ?? 1)
  const held = useHeld()
  const step = held ? cnt : stepOf(p)
  const raw = useHot(cnt, stepOf(p), period)
  const hot = raw >= 0 && stepOf(p) >= cnt ? (raw + cnt - 1) % cnt : raw
  return { step, hot, held, s: (n: number) => step >= n, done: !held && stepOf(p) >= cnt }
}

/* ------------------------------------------------------------------ pieces */

/** a 3D icon (or a mark, or any node) on its plinth with its tag under (or beside) it; the TILE is centred on (x, y) */
function Node({ x, y, label, icon, mark, node, size = 52, k = 0.74, on = true, lit = false, loop = 'bob', d = 0, t, badge, w = 130, tagSize = 14, side, delay = 0, z = 3, dim = false, children }: { x: number; y: number; label?: string; icon?: Ico3DName; mark?: string; node?: ReactNode; size?: number; k?: number; on?: boolean; lit?: boolean; loop?: Loop; d?: number; t?: number; badge?: Badge; w?: number; tagSize?: number; side?: 'right' | 'left'; delay?: number; z?: number; dim?: boolean; children?: ReactNode }) {
  const instant = useInstant()
  const tile = mark ? <MarkTile src={mark} size={size} lit={lit} /> : (
    <Plinth size={size} lit={lit}>{node ?? <Ico3D name={icon ?? 'doc'} size={Math.round(size * k)} loop={loop} d={d} t={t} badge={badge} />}</Plinth>
  )
  const inner = (
    <div style={{ position: 'relative', width: size, height: size, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
      <div style={{ display: 'grid', placeItems: 'center', opacity: dim ? 0.42 : 1, transition: instant ? 'none' : `opacity 520ms ${EASE}` }}>{tile}</div>
      {children}
    </div>
  )
  if (side) {
    return (
      <Show on={on} delay={delay} style={{ position: 'absolute', top: y - size / 2, height: size, zIndex: z, display: 'flex', flexDirection: side === 'right' ? 'row' : 'row-reverse', alignItems: 'center', gap: 8, ...(side === 'right' ? { left: x - size / 2 } : { right: `calc(100% - ${x + size / 2}px)` }) }}>
        {inner}
        {label && <span style={tag(tagSize)}>{label}</span>}
      </Show>
    )
  }
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, width: w, top: y - size / 2, zIndex: z, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {inner}
      {label && <span style={{ ...tag(tagSize), marginTop: 6 }}>{label}</span>}
    </Show>
  )
}

/** a person: the 3D bust with what they work on (a laptop for the developer, a server for operations) on its corner */
function Person({ x, y, role, label, lit = false, size = 58, d = 0, on = true, tagSize = 15 }: { x: number; y: number; role: 'dev' | 'ops'; label: string; lit?: boolean; size?: number; d?: number; on?: boolean; tagSize?: number }) {
  const o = Math.round(size * 0.46)
  return (
    <Node x={x} y={y} size={size} lit={lit} on={on} label={label} tagSize={tagSize} w={110} node={<Ico3D name="user" size={Math.round(size * 0.7)} loop="bob" d={d} t={3} />}>
      <span style={{ position: 'absolute', right: -Math.round(o * 0.35), bottom: -Math.round(o * 0.3), width: o + 4, height: o + 4, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6', display: 'grid', placeItems: 'center', zIndex: 4 }}>
        <Ico3D name={role === 'dev' ? 'laptop' : 'server'} size={o - 2} loop="pulse" d={d + 0.6} t={2.6} />
      </span>
    </Node>
  )
}

/** the engine's 3D cross turned to the template's orange (blocked = orange, never red); S18 OrangeCross */
const OrangeCross = ({ size }: { size: number }) => (
  <span style={{ display: 'grid', filter: 'hue-rotate(28deg) saturate(1.15) brightness(1.06)' }}>
    <Ico3D name="cross" size={size} loop="none" />
  </span>
)

/** a small white disc holding a 3D icon, centred on (x, y) of the frame */
function Disc({ x, y, on = true, size = 26, icon = 'check', loop = 'pulse', d = 0, t = 2.4, cross = false, z = 9 }: { x: number; y: number; on?: boolean; size?: number; icon?: Ico3DName; loop?: Loop; d?: number; t?: number; cross?: boolean; z?: number }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: z, opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}` }}>
      <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6' }}>
        {cross ? <OrangeCross size={size - 4} /> : <Ico3D name={icon} size={size - 6} loop={loop} d={d} t={t} />}
      </span>
    </span>
  )
}

/** a white disc carrying a mini 3D icon along a `ride` class (placed from the frame's 0,0); nothing on held frames */
function Rider({ cls, icon, size = 24, on = true }: { cls: string; icon: Ico3DName; size?: number; on?: boolean }) {
  const held = useHeld()
  if (held || !on) return null
  return (
    <span aria-hidden style={{ position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, zIndex: 7, pointerEvents: 'none' }}>
      <span className={cls} style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -4px rgba(31,64,140,0.55)', opacity: 0 }}>
        <Ico3D name={icon} size={size - 6} loop="none" />
      </span>
    </span>
  )
}

/** a wire on its own layer (z 2), under the tiles (z 3) */
const W = (props: Parameters<typeof Wire>[0]) => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}><Wire {...props} /></div>
)

/** a heading pill (white, rim) centred on (x, y) */
function Pill({ x, y, text, on = true, lit = false, w = 104 }: { x: number; y: number; text: string; on?: boolean; lit?: boolean; w?: number }) {
  const instant = useInstant()
  return (
    <Show on={on} style={{ ...box(x - w / 2, y - 14, w, 28), zIndex: 4 }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: 99, background: '#FFFFFF', boxShadow: lit ? LIT : RIM, display: 'grid', placeItems: 'center', transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
        <span style={{ ...heading(15, colors.brandDeep) }}>{text}</span>
      </span>
    </Show>
  )
}

/* ================================================================== slides 6-7 · the Dev / Ops overlap */

/*
 * 566 x 380. Dev circle centre (210, 190), Ops circle (356, 190), r 130: they overlap from x 226 to 340, the lens at
 * x 283 running y 82..298. Dev (130, 212) and Ops (436, 212) sit in their own parts. In the lens: the shared plan
 * (calendar, y 128, tag Collaboration) and the production server (y 212, shield, tag Production). `DevOps` pill under
 * the lens (y 340). Slide 7 adds a feedback wire (the left ownership wire reversed) and the shared pipeline at the top
 * (y 40), wired Dev -> Pipeline -> Ops over the circles.
 */
const V = { W: 566, H: 380, C1: 210, C2: 356, CY: 190, R: 130, LX: 283, PS: 58, DX: 130, OX: 436, PY: 212, TS: 46, CALY: 128, SRVY: 212, PIPY: 40, PIPS: 42, PER: 3.6 }
const V_JX = [190, 376] // the junctions where the plan route leaves each person's wire
const V_CAL: Pt[][] = [
  [[V.DX + V.PS / 2, V.PY], [V_JX[0], V.PY], [V_JX[0], V.CALY], [V.LX - V.TS / 2, V.CALY]],
  [[V.OX - V.PS / 2, V.PY], [V_JX[1], V.PY], [V_JX[1], V.CALY], [V.LX + V.TS / 2, V.CALY]],
]
const V_OWN: Pt[][] = [
  [[V.DX + V.PS / 2, V.PY], [V.LX - V.TS / 2, V.SRVY]],
  [[V.OX - V.PS / 2, V.PY], [V.LX + V.TS / 2, V.SRVY]],
]
const V_FEED: Pt[] = [[V.LX - V.TS / 2, V.SRVY], [V.DX + V.PS / 2, V.PY]]
const V_PIPE: Pt[][] = [
  [[V.DX, V.PY - V.PS / 2], [V.DX, V.PIPY], [V.LX - V.PIPS / 2, V.PIPY]],
  [[V.LX + V.PIPS / 2, V.PIPY], [V.OX, V.PIPY], [V.OX, V.PY - V.PS / 2]],
]
/* collaboration: tokens leave both people for the plan at once (two-way, both sides plan together) */
const V_RC = V_CAL.map((pts, i) => K.ride(`t01c${i}`, pts, 0.1, 1.5, V.PER))
const V_RO = V_OWN.map((pts, i) => K.ride(`t01o${i}`, pts, 1.8 + i * 0.2, 2.9 + i * 0.2, V.PER))
const V_RF = K.ride('t01f', V_FEED, 0.3, 1.5, 2.6)
const V_RP = [K.ride('t01p0', V_PIPE[0], 0.1, 1.5, V.PER), K.ride('t01p1', V_PIPE[1], 1.7, 3.1, V.PER)]

/** the two circles and the lens they share; the lens glows (a loop on its own root svg) while `glow` */
function Venn({ glow, litDev = false, litOps = false }: { glow: boolean; litDev?: boolean; litOps?: boolean }) {
  const id = 's22a' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const held = useHeld()
  const instant = useInstant()
  const circ = (cx: number, lit: boolean, fill: string) => (
    <circle cx={cx} cy={V.CY} r={V.R} fill={fill} stroke={lit ? ORANGE : '#B9CBF5'} strokeWidth={lit ? 2.5 : 1.6} style={{ transition: instant ? 'none' : `stroke 420ms ${EASE}` }} />
  )
  return (
    <>
      <svg aria-hidden width={V.W} height={V.H} style={{ position: 'absolute', left: 0, top: 0, zIndex: 0, overflow: 'visible' }}>
        <defs>
          <radialGradient id={`${id}d`} cx="0.4" cy="0.35" r="0.75"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#E6EEFF" /></radialGradient>
          <radialGradient id={`${id}o`} cx="0.6" cy="0.35" r="0.75"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#E3F3FF" /></radialGradient>
        </defs>
        {circ(V.C1, litDev, `url(#${id}d)`)}
        {circ(V.C2, litOps, `url(#${id}o)`)}
      </svg>
      {/* the shared zone: the lens, tinted, its glow a loop on this root svg (opacity only) */}
      <svg aria-hidden width={V.W} height={V.H} className={glow && !held ? 's22a-lens' : undefined} style={{ position: 'absolute', left: 0, top: 0, zIndex: 0, overflow: 'visible', opacity: glow ? undefined : 0.75 }}>
        <defs>
          <clipPath id={`${id}c`}><circle cx={V.C1} cy={V.CY} r={V.R} /></clipPath>
          <linearGradient id={`${id}l`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#C9D9FF" /><stop offset="1" stopColor="#9DB8FF" /></linearGradient>
        </defs>
        <circle cx={V.C2} cy={V.CY} r={V.R} fill={`url(#${id}l)`} opacity={0.55} clipPath={`url(#${id}c)`} />
      </svg>
    </>
  )
}

/** the parts both slides share: circles, people, the plan, the production server, the DevOps pill */
function DevOpsZone({ hotPlan = false, hotProd = false, plan, prod, glow }: { hotPlan?: boolean; hotProd?: boolean; plan: boolean; prod: boolean; glow: boolean }) {
  return (
    <>
      <Venn glow={glow} />
      <Person x={V.DX} y={V.PY} role="dev" label="Dev" lit={hotPlan || hotProd} />
      <Person x={V.OX} y={V.PY} role="ops" label="Ops" lit={hotPlan || hotProd} d={0.8} />
      <Node x={V.LX} y={V.CALY} icon="calendar" size={V.TS} label="Collaboration" tagSize={13} on={plan} lit={hotPlan} loop="bob" d={0.3} />
      <Node x={V.LX} y={V.SRVY} icon="server" badge="check" size={V.TS} label="Production" tagSize={13} on={prod} lit={hotProd} loop="pulse" t={2.8} />
      {V_JX.map((x) => <Junction key={x} x={x} y={V.PY} on={plan && prod} lit={hotPlan || hotProd} />)}
      <Pill x={V.LX} y={340} text="DevOps" />
    </>
  )
}

const A_T01: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 2 }, 2200)
  return (
    <Frame w={V.W} h={V.H}>
      <DevOpsZone plan={s(1)} prod={s(2)} hotPlan={hot === 0} hotProd={hot === 1} glow={s(2)} />
      {/* point 1: the two sides plan releases together */}
      {V_CAL.map((pts, i) => <W key={i} pts={pts} head={9} on={s(1)} lit={hot === 0} delay={i * 120} />)}
      {V_RC.map((c, i) => <Token key={i} cls={c} size={9} on={s(1)} />)}
      {/* point 2: production reliability, owned by both */}
      {V_OWN.map((pts, i) => <W key={i} pts={pts} head={9} on={s(2)} lit={hot === 1} delay={i * 120} />)}
      {V_RO.map((c, i) => <Rider key={i} cls={c} icon="shield" size={22} on={s(2)} />)}
    </Frame>
  )
}

const A_T01B: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 2 }, 2200)
  return (
    <Frame w={V.W} h={V.H}>
      <DevOpsZone plan prod glow />
      {V_CAL.map((pts, i) => <W key={i} pts={pts} head={9} />)}
      {/* point 3: the left wire turns round: production issues flow straight back to the developer */}
      <W pts={V_OWN[0]} head={9} on={!s(1)} />
      <W pts={V_FEED} head={9} on={s(1)} lit={hot === 0} />
      <W pts={V_OWN[1]} head={9} />
      <Rider cls={V_RF} icon="alert" size={24} on={s(1)} />
      {/* point 4: the manual handoff replaced by one shared pipeline */}
      {V_PIPE.map((pts, i) => <W key={i} pts={pts} head={i === 1 ? 9 : 9} on={s(2)} lit={hot === 1} delay={i * 260} />)}
      <Node x={V.LX} y={V.PIPY} icon="pipeline" size={V.PIPS} k={0.78} label="Pipeline" tagSize={13} on={s(2)} lit={hot === 1} loop="pulse" t={2.4} />
      <Rider cls={V_RP[0]} icon="code" size={22} on={s(2)} />
      <Rider cls={V_RP[1]} icon="package" size={22} on={s(2)} />
    </Frame>
  )
}

/* ================================================================== slides 9-10 · the wall between Dev and Ops */

/*
 * 566 x 380. Dev (90, 232) | a brick wall x 253..313, y 150..330 | Ops (476, 232). A code package rests on the wall
 * (283, 126), tagged No Context Passed above it; a dashed throw arc from the developer ends on it, a package rides the
 * arc and stalls. Slide 9: the speed gauge over Dev and the stability shield over Ops (y 135) with two arrows pulling
 * apart (y 305) (1); the wall rings orange, tagged Wall Of Confusion, and the package wobbles (2). Slide 10: blame
 * thrown at the wall from both sides (y 232: Bad Infra from Dev, Bad Code from Ops) (1); manual approvals queue at the
 * foot of the wall while an hourglass runs (2).
 */
const WL = { W: 566, H: 380, DX: 90, OX: 476, PY: 232, PS: 60, X0: 253, X1: 313, Y0: 150, Y1: 330, PKY: 126, PKS: 44, GY: 135, GS: 44, PULLY: 305 }
const WL_CX = (WL.X0 + WL.X1) / 2 // 283
/* the throw: a quadratic arc from the developer's tile to the package's left side */
const ARC0: Pt = [WL.DX + 28, WL.PY - 26]
const ARC1: Pt = [200, 60]
const ARC2: Pt = [WL_CX - WL.PKS / 2 - 4, WL.PKY - 6]
const bez = (t: number): Pt => [
  Math.round((1 - t) ** 2 * ARC0[0] + 2 * t * (1 - t) * ARC1[0] + t * t * ARC2[0]),
  Math.round((1 - t) ** 2 * ARC0[1] + 2 * t * (1 - t) * ARC1[1] + t * t * ARC2[1]),
]
const ARC_PTS: Pt[] = Array.from({ length: 11 }, (_, i) => bez(i / 10))
const ARC_D = `M ${ARC0[0]} ${ARC0[1]} Q ${ARC1[0]} ${ARC1[1]} ${ARC2[0]} ${ARC2[1]}`
const WL_RT = K.ride('t02throw', ARC_PTS, 0.2, 1.4, 3.2, 0.9)
const WL_PULL: Pt[][] = [[[230, WL.PULLY], [40, WL.PULLY]], [[336, WL.PULLY], [526, WL.PULLY]]]
const WL_RPULL = WL_PULL.map((pts, i) => K.ride(`t02pull${i}`, pts, 0.1, 1.6, 2.8))
const WL_BLAME: Pt[][] = [[[WL.DX + WL.PS / 2, WL.PY], [WL.X0, WL.PY]], [[WL.OX - WL.PS / 2, WL.PY], [WL.X1, WL.PY]]]
const WL_RB = WL_BLAME.map((pts, i) => K.ride(`t02blame${i}`, pts, 0.1 + i * 1.4, 1.1 + i * 1.4, 2.8, 0.9))

/** the brick wall: glossy blue bricks in offset rows (HTML spans), ringed orange while it is the point */
function BrickWall({ lit = false }: { lit?: boolean }) {
  const instant = useInstant()
  const rows = 8
  const rh = (WL.Y1 - WL.Y0) / rows // 22.5
  const ww = WL.X1 - WL.X0
  const bricks: ReactNode[] = []
  for (let r = 0; r < rows; r++) {
    const off = r % 2 === 0 ? 0 : -ww / 4
    for (let c = 0; c < 3; c++) {
      const x0 = Math.max(0, off + c * (ww / 2))
      const x1 = Math.min(ww, off + (c + 1) * (ww / 2))
      if (x1 - x0 < 6) continue
      bricks.push(
        <span key={`${r}-${c}`} style={{ position: 'absolute', left: x0 + 1.5, top: r * rh + 1.5, width: x1 - x0 - 3, height: rh - 3, borderRadius: 4, background: 'linear-gradient(180deg, #8DB0FF 0%, #2D63FB 55%, #1640C8 100%)', boxShadow: 'inset 0 -2px 0 #0D2A8C, inset 0 2px 0 rgba(255,255,255,0.45)' }} />,
      )
    }
  }
  return (
    <div style={{ ...box(WL.X0, WL.Y0, ww, WL.Y1 - WL.Y0), zIndex: 3 }}>
      <div style={{ position: 'absolute', inset: -4, borderRadius: 8, background: '#DCE6FB', boxShadow: lit ? `inset 0 0 0 2.5px ${ORANGE}, 0 14px 26px -14px rgba(255,138,61,0.7)` : '0 14px 26px -16px rgba(31,64,140,0.55)', transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }} />
      <div style={{ position: 'absolute', inset: 0 }}>{bricks}</div>
    </div>
  )
}

/** the parts both wall slides share: the people, the wall, the stuck package and its throw */
function WallScene({ wallLit = false, wobble = false, goals, hotGoals = false }: { wallLit?: boolean; wobble?: boolean; goals: boolean; hotGoals?: boolean }) {
  const held = useHeld()
  return (
    <>
      <Person x={WL.DX} y={WL.PY} role="dev" label="Dev" size={WL.PS} />
      <Person x={WL.OX} y={WL.PY} role="ops" label="Ops" size={WL.PS} d={0.8} />
      <BrickWall lit={wallLit} />
      <svg aria-hidden width={WL.W} height={WL.H} style={{ position: 'absolute', left: 0, top: 0, zIndex: 1, overflow: 'visible' }}>
        <path d={ARC_D} fill="none" stroke="#9DB4EA" strokeWidth={2} strokeDasharray="5 6" strokeLinecap="round" />
      </svg>
      <Rider cls={WL_RT} icon="package" size={26} />
      <div style={{ ...box(WL_CX - 90, WL.PKY - WL.PKS / 2 - 26, 180, 20), zIndex: 4, display: 'grid', placeItems: 'center' }}>
        <span style={tag(14)}>No Context Passed</span>
      </div>
      <div className={wobble && !held ? 'fk fk-shake' : undefined} style={{ ...box(WL_CX - WL.PKS / 2, WL.PKY - WL.PKS / 2, WL.PKS, WL.PKS), zIndex: 4, ['--fk-t' as string]: '1.6s' } as CSSProperties}>
        <Plinth size={WL.PKS} lit={wallLit}><Ico3D name="package" size={34} loop={wobble ? 'none' : 'tilt'} t={3.2} /></Plinth>
      </div>
      {/* the goals pulling the two sides apart */}
      <Node x={WL.DX} y={WL.GY} icon="gauge" size={WL.GS} label="Speed" tagSize={13} on={goals} lit={hotGoals} loop="pulse" />
      <Node x={WL.OX} y={WL.GY} icon="shield" size={WL.GS} label="Stability" tagSize={13} on={goals} lit={hotGoals} loop="bob" d={0.5} />
    </>
  )
}

const A_T02: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 2 }, 2200)
  return (
    <Frame w={WL.W} h={WL.H}>
      <WallScene goals={s(1)} hotGoals={hot === 0} wallLit={hot === 1} wobble={s(2)} />
      {/* point 1: speed for developers, stability for operations, pulling in opposite directions */}
      {WL_PULL.map((pts, i) => <W key={i} pts={pts} head={10} on={s(1)} lit={hot === 0} delay={i * 140} />)}
      {WL_RPULL.map((c, i) => <Token key={i} cls={c} size={9} on={s(1)} />)}
      {/* point 2: the wall of confusion */}
      <Show on={s(2)} style={{ ...box(WL_CX - 90, WL.Y1 + 10, 180, 20), zIndex: 4, display: 'grid', placeItems: 'center' }}>
        <span style={tag(14)}>Wall Of Confusion</span>
      </Show>
    </Frame>
  )
}

/* the approvals queue at the foot of the wall: three documents arrive one by one, the pile resets every 4.5 s */
const QX = [165, 199, 233]
const QY = 318
const QS = 30

const A_T02B: Fig = (p) => {
  const { hot, s, held } = useBuild({ ...p, steps: p.steps ?? 2 }, 2200)
  return (
    <Frame w={WL.W} h={WL.H}>
      <WallScene goals />
      {/* point 3: blame thrown across the wall from both sides */}
      {WL_BLAME.map((pts, i) => <W key={i} pts={pts} head={10} on={s(1)} lit={hot === 0} delay={i * 140} />)}
      <Node x={186} y={WL.PY} icon="server" badge="alert" size={40} label="Bad Infra" tagSize={13} on={s(1)} lit={hot === 0} loop="pulse" z={4} />
      <Node x={380} y={WL.PY} icon="code" badge="alert" size={40} label="Bad Code" tagSize={13} on={s(1)} lit={hot === 0} loop="pulse" d={0.6} z={4} />
      <Token cls={WL_RB[0]} size={9} tone={ORANGE} on={s(1)} />
      <Token cls={WL_RB[1]} size={9} tone={ORANGE} on={s(1)} />
      {/* point 4: manual handoffs and approvals queue at the wall; the clock runs */}
      {QX.map((x, i) => (
        <Show key={x} on={s(2)} delay={i * 160} style={{ ...box(x - QS / 2, QY - QS / 2, QS, QS), zIndex: 4 }}>
          <span className={!held ? `s22a-q s22a-q${i}` : undefined} style={{ display: 'grid' }}>
            <Plinth size={QS} lit={hot === 1}><Ico3D name="doc" size={22} loop="none" /></Plinth>
          </span>
        </Show>
      ))}
      <Show on={s(2)} style={{ ...box(QX[1] - 60, QY + QS / 2 + 6, 120, 18), zIndex: 4, display: 'grid', placeItems: 'center' }}>
        <span style={tag(13)}>Approvals</span>
      </Show>
      <Node x={390} y={QY} icon="hourglass" size={40} label="Delayed" tagSize={13} on={s(2)} lit={hot === 1} loop="swing" t={3} />
    </Frame>
  )
}

/* ================================================================== slide 11 · A_T03 · the shared dashboard */

/*
 * 526 x 400. One dashboard screen (x 108..418, y 24..214): a header strip (dashboard icon, `Dashboard`, and at press 4
 * the CodePipeline and CodeDeploy marks), a bar chart, a gauge and an alert bell. Dev (150, 320) and Ops (376, 320)
 * both face it, a sight wire from each up to the screen. Postmortem (56, 118) at its left (1), the on-call phone
 * (470, 118) at its right (2), both teams lit on the same metrics (3), the marks on the header (4).
 */
const DB = { W: 526, H: 400, X0: 108, X1: 418, Y0: 24, Y1: 214, HH: 40, DX: 150, OX: 376, PY: 320, PS: 58, SIDE: 56, SY: 118, PER: 3.2 }
const DB_EYE: Pt[][] = [[[DB.DX, DB.PY - DB.PS / 2], [DB.DX, DB.Y1 + 2]], [[DB.OX, DB.PY - DB.PS / 2], [DB.OX, DB.Y1 + 2]]]
const DB_RE = DB_EYE.map((pts, i) => K.ride(`t03eye${i}`, [...pts].reverse() as Pt[], 0.2 + i * 0.4, 1.2 + i * 0.4, DB.PER))
const BARS = [0.42, 0.7, 0.55, 0.86, 0.62, 0.78]

const A_T03: Fig = (p) => {
  const { hot, s, held } = useBuild({ ...p, steps: p.steps ?? 4 }, 2200)
  const instant = useInstant()
  const scrLit = hot === 2
  const bw = 16
  const chartX = 22
  const chartY = DB.HH + 26
  const chartH = 106
  return (
    <Frame w={DB.W} h={DB.H}>
      {/* the screen */}
      <div style={{ ...box(DB.X0, DB.Y0, DB.X1 - DB.X0, DB.Y1 - DB.Y0), zIndex: 3 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 16, background: 'linear-gradient(180deg, #FFFFFF 0%, #F4F8FF 100%)', boxShadow: scrLit ? LIT : RIM, transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }} />
        {/* header strip */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: DB.HH, borderRadius: '16px 16px 0 0', background: 'linear-gradient(180deg, #EAF0FF 0%, #DDE7FF 100%)', boxShadow: 'inset 0 -1px 0 #CFDBF6', display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', boxSizing: 'border-box' }}>
          <Ico3D name="dashboard" size={26} loop="pulse" t={3} />
          <span style={heading(15, colors.brandDeep)}>Dashboard</span>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Show on={s(4)}><MarkTile src={pipelineMark} size={28} lit={hot === 3} /></Show>
            <Show on={s(4)} delay={140}><MarkTile src={deployMark} size={28} lit={hot === 3} /></Show>
          </span>
        </div>
        {/* the bar chart: the bars breathe (scaleY on HTML spans) */}
        <div style={{ ...box(chartX - 8, chartY - 10, BARS.length * (bw + 8) + 8, chartH + 20), borderRadius: 12, background: '#F0F5FF', boxShadow: 'inset 0 0 0 1.2px #D3DEF6' }} />
        {BARS.map((v, i) => (
          <span key={i} style={{ ...box(chartX + i * (bw + 8), chartY + chartH * (1 - v), bw, chartH * v), display: 'block' }}>
            <span className={held ? undefined : `s22a-bar s22a-bar${i}`} style={{ display: 'block', width: '100%', height: '100%', borderRadius: 5, transformOrigin: '50% 100%', background: i === 3 ? 'linear-gradient(180deg, #8DB0FF, #2D63FB)' : 'linear-gradient(180deg, #C6D6FF, #6E93F5)' }} />
          </span>
        ))}
        <div style={{ ...box(184, DB.HH + 20, 56, 56), display: 'grid', placeItems: 'center' }}><Plinth size={56}><Ico3D name="gauge" size={42} loop="pulse" t={2.8} /></Plinth></div>
        <div style={{ ...box(184, DB.HH + 22 + 56 + 12, 56, 18), display: 'grid', placeItems: 'center' }}><span style={tag(13)}>Health</span></div>
        <div style={{ ...box(250, DB.HH + 20, 48, 56), display: 'grid', placeItems: 'center' }}><Plinth size={48}><Ico3D name="bell" size={36} loop="swing" t={3.2} /></Plinth></div>
        <div style={{ ...box(244, DB.HH + 22 + 56 + 12, 60, 18), display: 'grid', placeItems: 'center' }}><span style={tag(13)}>Alerts</span></div>
      </div>
      {/* both teams watch the same screen */}
      {DB_EYE.map((pts, i) => <W key={i} pts={pts} head={9} lit={scrLit} />)}
      {DB_RE.map((c, i) => <Token key={i} cls={c} size={8} on={s(3)} />)}
      <Person x={DB.DX} y={DB.PY} role="dev" label="Dev" lit={scrLit} />
      <Person x={DB.OX} y={DB.PY} role="ops" label="Ops" lit={scrLit} d={0.8} />
      {/* point 1: the blameless postmortem, a checklist about the process */}
      <Node x={52} y={DB.SY} icon="checklist" size={DB.SIDE} label="Postmortem" tagSize={13} w={96} on={s(1)} lit={hot === 0} loop="bob" />
      {/* point 2: the on-call rotation, the phone passing between the two sides */}
      <Node x={474} y={DB.SY} icon="phone" size={DB.SIDE} label="On-Call" tagSize={13} w={96} on={s(2)} lit={hot === 1} loop="tilt" t={2.6}>
        <span style={{ position: 'absolute', right: -10, bottom: -8, width: 26, height: 26, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6', display: 'grid', placeItems: 'center', zIndex: 4 }}>
          <Ico3D name="refresh" size={20} loop="spin" t={4} />
        </span>
      </Node>
    </Frame>
  )
}

/* ================================================================== slide 12 · A_T04 · culture into the lifecycle */

/*
 * 566 x 380. The shared-ownership circle (centre 100, 190, r 80) holding Dev and Ops; an arrow from its right edge into
 * a faint outline of the eight lifecycle stages, two rows of four boxes (60 x 60, x 230 / 312 / 394 / 476), row 1 left
 * to right at y 112 (tags above), row 2 right to left at y 222 (tags below). Press 1 the circle lights (one team), press
 * 2 the outlines fill in left to right, press 3 the dashed handoff gaps between them close into solid wires; a token
 * then rides from the circle through every stage.
 */
const LC = { W: 566, H: 380, CX: 100, CY: 190, R: 80, B: 60, R1: 112, R2: 222, PER: 6 }
const LC_X = [230, 312, 394, 476]
const STAGES: { icon: Ico3DName; label: string; x: number; y: number }[] = [
  { icon: 'doc', label: 'Plan', x: LC_X[0], y: LC.R1 },
  { icon: 'code', label: 'Code', x: LC_X[1], y: LC.R1 },
  { icon: 'gear', label: 'Build', x: LC_X[2], y: LC.R1 },
  { icon: 'checklist', label: 'Test', x: LC_X[3], y: LC.R1 },
  { icon: 'tag', label: 'Release', x: LC_X[3], y: LC.R2 },
  { icon: 'rocket', label: 'Deploy', x: LC_X[2], y: LC.R2 },
  { icon: 'server', label: 'Operate', x: LC_X[1], y: LC.R2 },
  { icon: 'dashboard', label: 'Monitor', x: LC_X[0], y: LC.R2 },
]
const MID1 = LC.R1 + LC.B / 2 // 142
const MID2 = LC.R2 + LC.B / 2 // 252
const LC_IN: Pt[] = [[LC.CX + LC.R, LC.CY], [205, LC.CY], [205, MID1], [LC_X[0], MID1]]
const LC_GAPS: Pt[][] = [
  [[LC_X[0] + LC.B, MID1], [LC_X[1], MID1]],
  [[LC_X[1] + LC.B, MID1], [LC_X[2], MID1]],
  [[LC_X[2] + LC.B, MID1], [LC_X[3], MID1]],
  [[LC_X[3] + LC.B / 2, LC.R1 + LC.B], [LC_X[3] + LC.B / 2, LC.R2]],
  [[LC_X[3], MID2], [LC_X[2] + LC.B, MID2]],
  [[LC_X[2], MID2], [LC_X[1] + LC.B, MID2]],
  [[LC_X[1], MID2], [LC_X[0] + LC.B, MID2]],
]
const LC_TOUR: Pt[] = [...LC_IN.slice(0, 3), [LC_X[3] + LC.B / 2, MID1], [LC_X[3] + LC.B / 2, MID2], [LC_X[0] + LC.B / 2, MID2]]
const LC_RT = K.ride('t04tour', LC_TOUR, 0.1, 5.6, LC.PER, 0.8)

const A_T04: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 3 }, 2400)
  const instant = useInstant()
  const held = useHeld()
  const team = hot === 0
  return (
    <Frame w={LC.W} h={LC.H}>
      {/* the shared-ownership circle */}
      <div style={{ ...box(LC.CX - LC.R, LC.CY - LC.R, LC.R * 2, LC.R * 2), zIndex: 1 }}>
        <span className={s(1) && !held ? 'fk fk-halo' : undefined} style={{ position: 'absolute', inset: -10, borderRadius: 999, background: `radial-gradient(closest-side, ${BLUE}33, ${BLUE}00)`, opacity: s(1) ? undefined : 0, ['--fk-t' as string]: '3.4s' } as CSSProperties} />
        <span style={{ position: 'absolute', inset: 0, borderRadius: 999, background: 'radial-gradient(circle at 40% 35%, #FFFFFF 0%, #DFE9FF 100%)', boxShadow: team ? `inset 0 0 0 2.5px ${ORANGE}, 0 14px 26px -14px rgba(255,138,61,0.6)` : 'inset 0 0 0 1.6px #B9CBF5, 0 14px 26px -16px rgba(31,64,140,0.45)', transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }} />
      </div>
      <Person x={LC.CX - 30} y={LC.CY - 6} role="dev" label="" size={46} />
      <Person x={LC.CX + 30} y={LC.CY - 6} role="ops" label="" size={46} d={0.8} />
      <div style={{ ...box(LC.CX - 90, LC.CY + LC.R + 10, 180, 18), zIndex: 3, display: 'grid', placeItems: 'center' }}><span style={tag(14)}>Shared Ownership</span></div>
      <Disc x={LC.CX} y={LC.CY - LC.R} icon="target" size={30} on={s(1)} loop="pulse" />
      {/* the arrow into the lifecycle */}
      <W pts={LC_IN} head={9} lit={hot === 1} />
      <Disc x={205} y={LC.CY} icon="layers" size={28} on={s(2)} loop="bob" />
      {/* the eight stages: faint outlines that fill in at press 2 */}
      {STAGES.map((st, i) => {
        const full = s(2)
        return (
          <div key={st.label} style={{ ...box(st.x, st.y, LC.B, LC.B), zIndex: 3 }}>
            <span style={{ position: 'absolute', inset: 0, borderRadius: 16, border: '1.6px dashed #A9BEEB', boxSizing: 'border-box', opacity: full ? 0 : 1, transition: instant ? 'none' : `opacity 420ms ${EASE} ${full ? i * 110 : 0}ms` }} />
            <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: full ? 1 : 0, transform: full ? 'scale(1)' : 'scale(0.86)', transition: instant ? 'none' : `opacity 420ms ${EASE} ${full ? i * 110 : 0}ms, transform 520ms ${EASE} ${full ? i * 110 : 0}ms` }}>
              <Plinth size={LC.B} lit={hot === 1}><Ico3D name={st.icon} size={44} loop="bob" d={i * 0.3} t={3} /></Plinth>
            </span>
            <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: full ? 0 : 0.32, transition: instant ? 'none' : `opacity 420ms ${EASE}` }}>
              <Ico3D name={st.icon} size={36} loop="none" />
            </span>
            <span style={{ position: 'absolute', left: -20, right: -20, ...(st.y === LC.R1 ? { bottom: LC.B + 7 } : { top: LC.B + 7 }), textAlign: 'center', ...tag(13), opacity: full ? 1 : 0.5, transition: instant ? 'none' : `opacity 420ms ${EASE}` }}>{st.label}</span>
          </div>
        )
      })}
      {/* the handoff gaps: dashed and faint, closing into solid wires at press 3 */}
      {LC_GAPS.map((pts, i) => <W key={`d${i}`} pts={pts} head={0} dash="3 5" width={2} opacity={s(3) ? 0 : 0.55} color="#8FA8E0" />)}
      {LC_GAPS.map((pts, i) => <W key={`s${i}`} pts={pts} head={7} on={s(3)} lit={hot === 2} delay={i * 110} />)}
      <Disc x={LC_X[3] + LC.B / 2} y={(LC.R1 + LC.B + LC.R2) / 2} icon="link" size={26} on={s(3)} loop="pulse" z={4} />
      <Rider cls={LC_RT} icon="package" size={22} on={s(3)} />
    </Frame>
  )
}

/* ------------------------------------------------------------------ css */

const LOCAL_CSS = `
@keyframes s22a-lens { 0%, 100% { opacity: 0.62 } 50% { opacity: 1 } }
.s22a-lens { animation: s22a-lens 3.2s cubic-bezier(0.45,0,0.55,1) infinite; }
${BARS.map((v, i) => `@keyframes s22a-bar${i} { 0%, 100% { transform: scaleY(1) } 50% { transform: scaleY(${(0.72 + ((i * 37) % 23) / 100).toFixed(2)}) } }\n.s22a-bar${i} { animation: s22a-bar${i} ${(2.6 + (i % 3) * 0.5).toFixed(1)}s cubic-bezier(0.45,0,0.55,1) infinite; animation-delay: ${(-i * 0.4).toFixed(1)}s; }`).join('\n')}
${[0, 1, 2].map((i) => `@keyframes s22a-q${i} { 0%, ${8 + i * 22}% { opacity: 0; transform: translateY(-10px) } ${18 + i * 22}%, 88% { opacity: 1; transform: translateY(0) } 96%, 100% { opacity: 0; transform: translateY(0) } }\n.s22a-q${i} { animation: s22a-q${i} 4.5s cubic-bezier(0.45,0,0.55,1) infinite; }`).join('\n')}
.cc-still .s22a-lens, .deck-thumb .s22a-lens, .cc-still .s22a-bar, .deck-thumb .s22a-bar, .cc-still .s22a-q, .deck-thumb .s22a-q { animation: none !important; opacity: 1 !important; transform: none !important; }
@media (prefers-reduced-motion: reduce) { .s22a-lens, .s22a-bar, .s22a-q { animation: none !important; } }
`

export const figures: Record<string, Fig> = { A_T01, A_T01B, A_T02, A_T02B, A_T03, A_T04 }
export const css = K.css() + LOCAL_CSS
