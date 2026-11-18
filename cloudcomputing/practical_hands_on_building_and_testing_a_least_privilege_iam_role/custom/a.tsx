import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, Frame, Plinth, MarkTile, Panel, Wire, Junction, Show, Token, useHot, useHeld, keyframes, tag, heading, type Pt } from '@/engine/figkit'
import roleMark from '../images/res-iam-role.svg'
import stsMark from '../images/res-iam-aws-sts.svg'
import tempMark from '../images/res-iam-temporary-security-credential.svg'
import longMark from '../images/res-iam-long-term-security-credential.svg'
import permMark from '../images/res-iam-permissions.svg'
import ec2Mark from '../images/aws-ec2.svg'

/*
 * SESSION 14 · SECTION 1 (Roles & Temporary Credentials) technical figures, builder A.
 * Built to generate-slides standing correction 17: 3D icons on plinth tiles, official marks on white tiles, >= 20 px
 * equal padding, orthogonal wires computed from the same constants as the boxes, a flow dot on every wire, a lit item
 * walking first -> last -> first after the build. Loops are transform / opacity on HTML elements only. Held (?still):
 * the full final state, nothing lit, nothing moving. Class prefix `t14a-`.
 *
 *   slide 6  A_T01   546 x 330  IAM User card (padlock, keys that stay) beside the Role card (clock, keys that fade) (4)
 *   slide 7  A_T02   546 x 330  visitor badge on its hook, its two policies, its borrowers; the IAM User ID card (4)
 *   slide 9  A_T03   546 x 330  AssumeRole flow, stages 1-3: request, trust policy check, own permission (3)
 *   slide 10 A_T03B  546 x 330 in 566 x 380  the same flow, stages 4-5: credentials back, role permissions (2)
 *   slide 11 A_T04   506 x 330  three credential pieces into one signed request, expiry clock, duration dial (4)
 *   slide 13 A_T05B 1080 x 420  two timeline bars, a leak marker on each (2)
 *
 * The countdown ring (Countdown) is two clipped half rings ROTATED over a full ring: transform only, no dash offset.
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('t14a')
const BLUE = colors.brand
const TRACK = '#DCE5F7'

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)
const tr = (instant: boolean, what = 'opacity', ms = 520) => (instant ? 'none' : `${what} ${ms}ms ${EASE}`)
const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })
const tv = (t: number, d = 0) => ({ ['--t14a-t' as string]: `${t}s`, ['--t14a-d' as string]: `${-d}s` }) as CSSProperties

/** a tile + tag group whose TILE centre is (x, y); `up` puts the tag above the tile; `wrap` lets a two-word tag break */
function Node({ x, y, size, label, children, w = 130, on = true, delay = 0, tagSize = 13.5, up = false, wrap, z = 3 }: { x: number; y: number; size: number; label?: string; children: ReactNode; w?: number; on?: boolean; delay?: number; tagSize?: number; up?: boolean; wrap?: number; z?: number }) {
  const t = label ? <span style={{ ...tag(tagSize), ...(wrap ? { whiteSpace: 'normal', width: wrap } : {}), [up ? 'marginBottom' : 'marginTop']: 5 }}>{label}</span> : null
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, width: w, zIndex: z, display: 'flex', flexDirection: up ? 'column-reverse' : 'column', alignItems: 'center', ...(up ? { bottom: `calc(100% - ${y + size / 2}px)` } : { top: y - size / 2 }) }}>
      <div style={{ width: size, height: size, display: 'grid', placeItems: 'center', position: 'relative' }}>{children}</div>
      {t}
    </Show>
  )
}

/** a 3D icon on its plinth */
const Tile = ({ name, size = 52, k = 0.72, loop = 'bob', d = 0, lit = false, warm = false }: { name: Ico3DName; size?: number; k?: number; loop?: Loop; d?: number; lit?: boolean; warm?: boolean }) => (
  <Plinth size={size} lit={lit} warm={warm}><Ico3D name={name} size={Math.round(size * k)} loop={loop} d={d} /></Plinth>
)

/** a small round badge holding a 3D icon, on a tile's lower-right (or upper-right) corner; fades in with `on` */
function Corner({ name, size = 22, on = true, loop = 'pulse', d = 0, top = false }: { name: Ico3DName; size?: number; on?: boolean; loop?: Loop; d?: number; top?: boolean }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'absolute', right: -size * 0.34, ...(top ? { top: -size * 0.3 } : { bottom: -size * 0.3 }), width: size + 4, height: size + 4, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6)', display: 'grid', placeItems: 'center', opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}`, zIndex: 4 }}>
      <Ico3D name={name} size={size} loop={loop} d={d} t={2.4} />
    </span>
  )
}

/**
 * A CLOCK WITH A COUNTDOWN RING on a plinth tile. While `run`, the blue ring empties clockwise from twelve over
 * `period` seconds and refills at once (two half rings in the track colour rotate in, each clipped to its half).
 * Held or not running: a full ring.
 */
function Countdown({ size = 64, period = 6, run, lit = false, k = 0.5, warm = false }: { size?: number; period?: number; run: boolean; lit?: boolean; k?: number; warm?: boolean }) {
  const held = useHeld()
  const on = run && !held
  const D = size - 12
  const th = Math.max(3, Math.round(size / 16))
  const cover = (side: 'R' | 'L') => (
    <span style={{ position: 'absolute', top: 0, height: D, width: D / 2, left: side === 'R' ? D / 2 : 0, overflow: 'hidden' }}>
      <span
        className={on ? `t14a-l t14a-cd${side}` : undefined}
        style={{
          position: 'absolute', top: -1, left: side === 'R' ? -D / 2 - 1 : -1, width: D + 2, height: D + 2, boxSizing: 'border-box', borderRadius: '50%',
          border: `${th + 2}px solid transparent`,
          ...(side === 'R' ? { borderTopColor: TRACK, borderRightColor: TRACK } : { borderBottomColor: TRACK, borderLeftColor: TRACK }),
          transform: 'rotate(-135deg)', ...tv(period),
        }}
      />
    </span>
  )
  return (
    <Plinth size={size} lit={lit} warm={warm}>
      <span style={{ position: 'relative', width: D, height: D, display: 'grid', placeItems: 'center' }}>
        <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `${th}px solid ${BLUE}`, boxSizing: 'border-box' }} />
        {cover('R')}
        {cover('L')}
        <Ico3D name="clock" size={Math.round(size * k)} loop="pulse" t={2} />
      </span>
    </Plinth>
  )
}

/** fades with the countdown of the same period: present, then gone as the ring runs out, back on refill */
const fadeCls = (on: boolean) => (on ? 't14a-l t14a-fd' : undefined)

/* ================================================================== slide 6 · A_T01 · IAM User vs Role */

/*
 * 546 x 330: two cards, IAM User (x 20, w 184) and Role (x 222, w 304), y 20..310, 18 apart. Three rows inside both
 * cards at the same heights: the identity row (y 66), the time row (y 159: padlock / countdown clock), the keys row
 * (y 248: the user's two keys / the role's three credential pieces). Row 1 of the role card is Caller -> Role, with
 * the Trust Policy dropping onto that wire as the gate at press 4. Every card keeps 20 px inside on all sides.
 */
const UR = { W: 546, H: 330, UX: 20, UW: 184, RX: 222, RW: 304, Y: 20, CH: 290, R1: 66, R2: 159, R3: 248, T: 6 }
const UR_UC = UR.UX + UR.UW / 2
const UR_ROW1 = [UR.RX + 62, UR.RX + 152, UR.RX + 242] // caller, trust policy, role
const UR_KEYS = [UR.UX + 56, UR.UX + 128]
const UR_PIECES = [UR.RX + 64, UR.RX + 152, UR.RX + 240]
const UR_CALL_A = K.ride('t01a', [[UR_ROW1[0] + 26, UR.R1], [UR_ROW1[2] - 26, UR.R1]], 0.1, 1.3, 2.2)
const UR_CALL_B1 = K.ride('t01b1', [[UR_ROW1[0] + 26, UR.R1], [UR_ROW1[1] - 26, UR.R1]], 0.1, 0.6, 2.2)
const UR_CALL_B2 = K.ride('t01b2', [[UR_ROW1[1] + 26, UR.R1], [UR_ROW1[2] - 26, UR.R1]], 0.9, 1.4, 2.2)
const UR_PIECE: [Ico3DName, string][] = [['key', 'Access Key'], ['key', 'Secret Key'], ['token', 'Session Token']]

const A_T01: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const hot = useHot(4, step, 1700)
  const s = (n: number) => held || step >= n
  const run = s(3) && !held
  return (
    <Frame w={UR.W} h={UR.H}>
      <Panel x={UR.UX} y={UR.Y} w={UR.UW} h={UR.CH} />
      <Panel x={UR.RX} y={UR.Y} w={UR.RW} h={UR.CH} />

      {/* IAM User: the person, the shut padlock, the key pair that stays */}
      <Node x={UR_UC} y={UR.R1} size={52} label="IAM User"><Tile name="user" d={0.2} /></Node>
      <Node x={UR_UC} y={UR.R2} size={64} label="Permanent"><Tile name="lock" size={64} k={0.66} loop="glint" /></Node>
      {UR_KEYS.map((x, i) => (
        <Node key={i} x={x} y={UR.R3} size={44} w={72} label={UR_PIECE[i][1]} tagSize={12.5}><Tile name="key" size={44} d={0.3 + i * 0.5} /></Node>
      ))}

      {/* Role: the caller steps onto it, through its trust policy */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
        <Wire pts={[[UR_ROW1[0] + 26, UR.R1], [UR_ROW1[2] - 26, UR.R1]]} on={s(1)} lit={hot === 0} />
      </div>
      <Node x={UR_ROW1[0]} y={UR.R1} size={52} label="Caller" on={s(1)}><Tile name="laptop" lit={hot === 0} d={0.5} /></Node>
      <Node x={UR_ROW1[1]} y={UR.R1} size={52} label="Trust Policy" w={100} on={s(4)} z={4}><Tile name="policy" lit={hot === 3} d={0.8} /></Node>
      <Node x={UR_ROW1[2]} y={UR.R1} size={52} label="Role"><MarkTile src={roleMark} size={52} /></Node>
      <Node x={UR_ROW1[1]} y={UR.R2} size={64} label="Expiring"><Countdown size={64} period={UR.T} run={run} lit={hot === 2} /></Node>
      {UR_PIECES.map((x, i) => (
        <Node key={i} x={x} y={UR.R3} size={44} w={88} label={UR_PIECE[i][1]} tagSize={12.5} on={s(2)} delay={i * 120}>
          <span className={fadeCls(run)} style={{ display: 'grid', ...tv(UR.T) }}><Tile name={UR_PIECE[i][0]} size={44} lit={hot === 1} d={i * 0.4} /></span>
        </Node>
      ))}
      {s(4) ? (
        <>
          <Token cls={UR_CALL_B1} on={s(1)} />
          <Token cls={UR_CALL_B2} on={s(1)} />
        </>
      ) : (
        <Token cls={UR_CALL_A} on={s(1)} />
      )}
    </Frame>
  )
}

/* ================================================================== slide 7 · A_T02 · the visitor badge */

/*
 * 546 x 330. Centre: a hook (BX, 20) with a lanyard to the visitor badge (x 162..262, y 46..196): Visitor strip, the
 * IAM Role mark, `Role` and a clock. Left: Trust Policy (y 84) and Permissions (y 172) documents clipped to the badge's
 * left edge. Right: a junction at x 340 fans the badge out to People, Applications and AWS Services (x 470). Bottom
 * left: the Employee with the permanent IAM User ID card. Press 1 the trust policy, 2 the permissions, 3 the three
 * borrowers take the badge in turn, 4 the employee and the ID card leave while the badge stays on its hook.
 */
const BD = { W: 546, H: 330, BX: 212, BY: 46, BW: 100, BH: 150, DX: 66, D1: 84, D2: 172, J: 340, MY: 142, RX: 470, EY: 262, EX: 66, IX: 150, TURN: 4.2 }
const BD_RY = [62, 142, 222]
const BD_BR = BD.BX + BD.BW / 2
const BD_BL = BD.BX - BD.BW / 2
const bdPath = (y: number): Pt[] => (y === BD.MY ? [[BD_BR, BD.MY], [BD.RX - 23, y]] : [[BD_BR, BD.MY], [BD.J, BD.MY], [BD.J, y], [BD.RX - 23, y]])
const BD_RIDE = BD_RY.map((y, k) => K.ride(`t02r${k}`, bdPath(y), k * 1.4, k * 1.4 + 0.9, BD.TURN))
const BD_DOC = [BD.D1, BD.D2].map((y, k) => K.ride(`t02d${k}`, [[BD.DX + 23, y], [BD_BL, y]], 0.2 + k * 0.5, 1.0 + k * 0.5, 2.6))

const A_T02: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const hot = useHot(4, step, 1700)
  const s = (n: number) => held || step >= n
  const turning = s(3) && !held
  const leaving = s(4) && !held
  const borrowers: { label: string; node: (lit: boolean) => ReactNode }[] = [
    { label: 'People', node: (lit) => <Tile name="user" size={46} lit={lit} d={0.2} /> },
    { label: 'Applications', node: (lit) => <Tile name="webpage" size={46} lit={lit} d={0.6} /> },
    { label: 'AWS Services', node: (lit) => <MarkTile src={ec2Mark} size={46} lit={lit} /> },
  ]
  return (
    <Frame w={BD.W} h={BD.H}>
      {/* the hook and the lanyard */}
      <svg aria-hidden width={BD.W} height={BD.H} style={{ position: 'absolute', inset: 0, overflow: 'visible', zIndex: 1 }}>
        <path d={`M ${BD.BX - 4} 28 L ${BD.BX - 30} ${BD.BY + 4} M ${BD.BX + 4} 28 L ${BD.BX + 30} ${BD.BY + 4}`} stroke={colors.brandDark} strokeWidth={5} strokeLinecap="round" fill="none" />
      </svg>
      <span aria-hidden style={box(BD.BX - 14, 20, 28, 12, { borderRadius: 6, background: 'linear-gradient(180deg, #F5F7FB 0%, #95A2B8 100%)', boxShadow: '0 3px 6px -3px rgba(31,64,140,0.6)', zIndex: 2 })} />

      {/* the documents clipped to the badge */}
      <Wire pts={[[BD.DX + 23, BD.D1], [BD_BL, BD.D1]]} on={s(1)} lit={hot === 0} />
      <Wire pts={[[BD.DX + 23, BD.D2], [BD_BL, BD.D2]]} on={s(2)} lit={hot === 1} />
      <Node x={BD.DX} y={BD.D1} size={46} label="Trust Policy" w={100} on={s(1)}><Tile name="policy" size={46} lit={hot === 0} d={0.3} /></Node>
      <Node x={BD.DX} y={BD.D2} size={46} label="Permissions" w={100} on={s(2)}><MarkTile src={permMark} size={46} lit={hot === 1} /></Node>
      <Token cls={BD_DOC[0]} on={s(1)} />
      <Token cls={BD_DOC[1]} on={s(2)} />

      {/* the visitor badge: it never moves, it stays on its hook */}
      <div style={box(BD_BL, BD.BY, BD.BW, BD.BH, { zIndex: 3, borderRadius: 14, background: '#FFFFFF', boxShadow: `inset 0 0 0 1.5px #D3DEF6, 0 14px 24px -14px rgba(31,64,140,0.55)`, overflow: 'hidden' })}>
        <div style={{ height: 30, background: `linear-gradient(180deg, ${BLUE} 0%, ${colors.brandDark} 100%)`, display: 'grid', placeItems: 'center' }}>
          <span style={{ ...tag(13, '#FFFFFF'), letterSpacing: 0.4 }}>Visitor</span>
        </div>
        <div style={{ display: 'grid', placeItems: 'center', marginTop: 12 }}><MarkTile src={roleMark} size={52} /></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 }}>
          <span style={heading(17)}>Role</span>
          <Ico3D name="clock" size={22} loop="pulse" t={2} />
        </div>
      </div>

      {/* the badge lent out: People, Applications, AWS Services, each in turn */}
      <Wire pts={[[BD_BR, BD.MY], [BD.J, BD.MY]]} head={0} on lit={hot === 2} />
      {BD_RY.map((y, k) => (y === BD.MY ? <Wire key={k} pts={[[BD.J, y], [BD.RX - 23, y]]} lit={hot === 2} /> : <Wire key={k} pts={[[BD.J, BD.MY], [BD.J, y], [BD.RX - 23, y]]} lit={hot === 2} />))}
      <Junction x={BD.J} y={BD.MY} lit={hot === 2} />
      {borrowers.map((b, k) => (
        <Node key={b.label} x={BD.RX} y={BD_RY[k]} size={46} label={b.label} w={110}>
          {b.node(hot === 2)}
          <span className={turning ? `t14a-l t14a-turn${k}` : undefined} style={{ position: 'absolute', right: -9, bottom: -8, width: 26, height: 26, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6)', display: 'grid', placeItems: 'center', opacity: 0, zIndex: 4 }}>
            <img src={roleMark} alt="" aria-hidden draggable={false} style={{ width: 18, height: 18, display: 'block' }} />
          </span>
        </Node>
      ))}
      {BD_RIDE.map((c, k) => <Token key={k} cls={c} on={turning} />)}

      {/* the permanent ID card goes wherever its employee goes */}
      <div className={leaving ? 't14a-l t14a-leave' : undefined} style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}>
        <Node x={BD.EX} y={BD.EY} size={44} label="Employee" w={90}><Tile name="user" size={44} lit={hot === 3} d={0.4} /></Node>
        <Node x={BD.IX} y={BD.EY} size={44} label="IAM User" w={90}><Tile name="idcard" size={44} lit={hot === 3} d={0.9} /></Node>
      </div>
    </Frame>
  )
}

/* ================================================================== slides 9-10 · A_T03 / A_T03B · AssumeRole flow */

/*
 * One 546 x 330 stage for both frames (T03B centres it in its 566 x 380 box), so every part keeps its place.
 * Caller (64, 196). The request lane y 176 runs Caller -> `sts:AssumeRole` card (x 116..244) -> STS (364, 196); STS
 * forks at a junction (420) up to the Trust Policy (472, 110) and down to the caller's Own Permission (472, 258).
 * T03B adds the return lane y 216, STS -> Temporary Credentials (270, 216) -> Caller, and the caller's signed requests
 * up its top edge to Role Permissions (200, 66).
 */
const AF0 = { W: 546, H: 330, CX: 64, CY: 196, CS: 64, UP: 176, LO: 216, QX0: 116, QX1: 244, QY0: 152, QY1: 200, SX: 364, J: 420, PX: 472, TPY: 110, OPY: 258, TCX: 270, TCS: 48, RPX: 200, RPY: 66 }
const AF_X = ['CX', 'QX0', 'QX1', 'SX', 'J', 'PX', 'TCX', 'RPX'] as const
const AF_Y = ['CY', 'UP', 'LO', 'QY0', 'QY1', 'TPY', 'OPY', 'RPY'] as const
/** the flow's coordinates moved by (dx, dy), with its flow-dot classes (T03 sits lifted 29 and left 5, as stages 4-5 are not drawn yet) */
function afLayout(name: string, dx: number, dy: number) {
  const AF = { ...AF0 }
  AF_X.forEach((k) => (AF[k] += dx))
  AF_Y.forEach((k) => (AF[k] += dy))
  const CR = AF.CX + AF.CS / 2
  const SL = AF.SX - AF.CS / 2
  const SR = AF.SX + AF.CS / 2
  return {
    AF, CR, SL, SR,
    REQ: K.ride(`${name}q`, [[AF.QX1, AF.UP], [SL, AF.UP]], 0.2, 1.0, 2.4),
    REQ0: K.ride(`${name}q0`, [[CR, AF.UP], [AF.QX0, AF.UP]], 0, 0.25, 2.4),
    TP: K.ride(`${name}tp`, [[SR, AF.CY], [AF.J, AF.CY], [AF.J, AF.TPY], [AF.PX - 26, AF.TPY]], 1.1, 1.9, 2.4),
    OP: K.ride(`${name}op`, [[SR, AF.CY], [AF.J, AF.CY], [AF.J, AF.OPY], [AF.PX - 26, AF.OPY]], 1.1, 1.9, 2.4),
    RET1: K.ride(`${name}r1`, [[SL, AF.LO], [AF.TCX + AF.TCS / 2, AF.LO]], 0.1, 0.5, 2.8),
    RET2: K.ride(`${name}r2`, [[AF.TCX - AF.TCS / 2, AF.LO], [CR, AF.LO]], 0.8, 1.7, 2.8),
    USE: K.ride(`${name}u`, [[AF.CX, AF.CY - AF.CS / 2], [AF.CX, AF.RPY], [AF.RPX - 26, AF.RPY]], 1.8, 2.7, 2.8),
  }
}
type AfL = ReturnType<typeof afLayout>
const AF_A = afLayout('t03', -5, -29)
const AF_B = afLayout('t03b', -5, -7)

function AssumeFlow({ L, s1, s2, s3, s4, s5, hotA, hotB }: { L: AfL; s1: boolean; s2: boolean; s3: boolean; s4: boolean; s5: boolean; hotA: number; hotB: number }) {
  const { AF, CR: AF_CR, SL: AF_SL, SR: AF_SR } = L
  const instant = useInstant()
  const held = useHeld()
  return (
    <>
      {/* stage 1: the request */}
      <Wire pts={[[AF_CR, AF.UP], [AF.QX0, AF.UP]]} on={s1} lit={hotA === 0} head={8} />
      <Wire pts={[[AF.QX1, AF.UP], [AF_SL, AF.UP]]} on={s1} lit={hotA === 0} delay={200} />
      <Show on={s1} style={box(AF.QX0, AF.QY0, AF.QX1 - AF.QX0, AF.QY1 - AF.QY0, { zIndex: 3 })}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 12, background: '#FFFFFF', boxShadow: hotA === 0 ? `inset 0 0 0 2.5px ${ORANGE}, 0 10px 22px -12px rgba(255,138,61,0.7)` : 'inset 0 0 0 1.5px #D3DEF6, 0 10px 20px -12px rgba(31,64,140,0.5)', transition: tr(instant, 'box-shadow', 420), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
          <code className="font-mono" style={{ fontSize: 13.5, fontWeight: 600, color: colors.brandDeep }}>sts:AssumeRole</code>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <img src={roleMark} alt="" aria-hidden draggable={false} style={{ width: 16, height: 16, display: 'block' }} />
            <span style={{ ...tag(12.5, BLUE) }}>Role ARN</span>
          </span>
        </div>
      </Show>

      {/* STS checks the trust policy and the caller's own permission */}
      <Wire pts={[[AF_SR, AF.CY], [AF.J, AF.CY]]} on={s2} head={0} lit={hotA === 1 || hotA === 2} />
      <Wire pts={[[AF.J, AF.CY], [AF.J, AF.TPY], [AF.PX - 26, AF.TPY]]} on={s2} lit={hotA === 1} delay={150} />
      <Wire pts={[[AF.J, AF.CY], [AF.J, AF.OPY], [AF.PX - 26, AF.OPY]]} on={s3} lit={hotA === 2} delay={150} />
      <Junction x={AF.J} y={AF.CY} on={s2} lit={hotA === 1 || hotA === 2} />
      <Node x={AF.PX} y={AF.TPY} size={52} label="Trust Policy" w={100} on={s2}>
        <Tile name="policy" lit={hotA === 1} d={0.3} />
        <Corner name="check" on={s2} loop="beat" />
      </Node>
      <Node x={AF.PX} y={AF.OPY} size={52} label="Own Permission" w={104} on={s3}>
        <Tile name="idcard" lit={hotA === 2} d={0.7} />
        <Corner name="check" on={s3} loop="beat" d={0.6} />
      </Node>

      {/* stages 4-5: the credentials come back, the caller works with the role's permissions */}
      <Wire pts={[[AF_SL, AF.LO], [AF.TCX + AF.TCS / 2, AF.LO]]} on={s4} lit={hotB === 1} head={8} />
      <Wire pts={[[AF.TCX - AF.TCS / 2, AF.LO], [AF_CR, AF.LO]]} on={s4} lit={hotB === 1} delay={200} />
      <Node x={AF.TCX} y={AF.LO} size={AF.TCS} label="Temporary Credentials" w={100} wrap={90} on={s4}>
        <span className={fadeCls(s5 && !held)} style={{ display: 'grid', ...tv(2.8) }}><MarkTile src={tempMark} size={AF.TCS} lit={hotB === 1} /></span>
        <Corner name="clock" on={s5} loop="pulse" />
      </Node>
      <Wire pts={[[AF.CX, AF.CY - AF.CS / 2], [AF.CX, AF.RPY], [AF.RPX - 26, AF.RPY]]} on={s4} lit={hotB === 0} />
      <Node x={AF.RPX} y={AF.RPY} size={52} label="Role Permissions" w={130} on={s4}><MarkTile src={permMark} size={52} lit={hotB === 0} /></Node>

      {/* the two parts always there: the caller and STS */}
      <Node x={AF.CX} y={AF.CY} size={AF.CS} label="Caller" w={90}><Tile name="laptop" size={AF.CS} lit={hotB === 0} /></Node>
      <Node x={AF.SX} y={AF.CY} size={AF.CS} label="STS" w={90} z={4}><MarkTile src={stsMark} size={AF.CS} lit={hotA === 1 || hotA === 2} /></Node>
    </>
  )
}

const A_T03: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const hot = useHot(3, step, 1800)
  const s = (n: number) => held || step >= n
  const L = AF_A
  return (
    <Frame w={AF0.W} h={AF0.H}>
      <AssumeFlow L={L} s1={s(1)} s2={s(2)} s3={s(3)} s4={false} s5={false} hotA={hot} hotB={-1} />
      <Token cls={L.REQ0} on={s(1)} size={8} />
      <Token cls={L.REQ} on={s(1)} />
      <Token cls={L.TP} on={s(2)} size={9} />
      <Token cls={L.OP} on={s(3)} size={9} />
    </Frame>
  )
}

const A_T03B: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const hot = useHot(2, step, 2200)
  const s = (n: number) => held || step >= n
  const L = AF_B
  return (
    <Frame w={AF0.W} h={AF0.H}>
      <AssumeFlow L={L} s1 s2 s3 s4={s(1)} s5={s(2)} hotA={-1} hotB={hot} />
      <Token cls={L.REQ} />
      <Token cls={L.RET1} on={s(1)} />
      <Token cls={L.RET2} on={s(1)} />
      <Token cls={L.USE} on={s(1)} />
    </Frame>
  )
}

/* ================================================================== slide 11 · A_T04 · token and expiry */

/*
 * 506 x 330. Left column x 66: Access Key (58), Secret Key (160), Session Token (262), joined on a bus at x 132 into
 * the Signed API Request (210, 160), which goes on to AWS (400, 160). Top: the Expiry clock (210, 58) and AssumeRole
 * (400, 58). Bottom: the session duration dial, 1 h to 12 h, the role mark at its hub (centre 270, 296).
 * Press 1 the two keys light and their requests flow; 2 the session token rides with every request; 3 the dial;
 * 4 the clock runs out, the set fades, and the arrow goes back to AssumeRole.
 */
const TK = { W: 506, H: 330, KX: 76, KS: 52, BUS: 142, QX: 222, QY: 160, QS: 60, AX: 432, AS: 56, TY: 59, DX: 272, DY: 300, DR: 54, T: 5 }
const TK_KY = [58, 160, 262]
const TK_IN = TK_KY.map((y): Pt[] => [[TK.KX + TK.KS / 2, y], [TK.BUS, y], [TK.BUS, TK.QY], [TK.QX - TK.QS / 2, TK.QY]])
const TK_RIDE = TK_IN.map((pts, k) => K.ride(`t04k${k}`, pts, 0.1 + k * 0.08, 0.9 + k * 0.08, 2.4))
const TK_OUT = K.ride('t04o', [[TK.QX + TK.QS / 2, TK.QY], [TK.AX - TK.AS / 2, TK.QY]], 1.1, 1.9, 2.4)
const TK_BACK = K.ride('t04b', [[TK.QX + 32, TK.TY], [TK.AX - TK.AS / 2, TK.TY]], 0.86 * TK.T, 0.98 * TK.T, TK.T)
const TK_NAME: [Ico3DName, string][] = [['key', 'Access Key'], ['key', 'Secret Key'], ['token', 'Session Token']]

function Dial({ on, run, lit }: { on: boolean; run: boolean; lit: boolean }) {
  const instant = useInstant()
  const W = TK.DR * 2 + 24
  const ticks = Array.from({ length: 12 }, (_, i) => Math.PI - (i * Math.PI) / 11)
  return (
    <Show on={on} style={box(TK.DX - W / 2, TK.DY - TK.DR - 12, W, TK.DR + 12, { zIndex: 3 })}>
      <svg aria-hidden width={W} height={TK.DR + 12} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <path d={`M 12 ${TK.DR + 12} A ${TK.DR} ${TK.DR} 0 0 1 ${W - 12} ${TK.DR + 12}`} fill="none" stroke={lit ? ORANGE : TRACK} strokeWidth={10} strokeLinecap="round" style={{ transition: tr(instant, 'stroke', 420) }} />
        {ticks.map((a, i) => (
          <line key={i} x1={W / 2 + Math.cos(a) * (TK.DR - 12)} y1={TK.DR + 12 - Math.sin(a) * (TK.DR - 12)} x2={W / 2 + Math.cos(a) * (TK.DR - 18)} y2={TK.DR + 12 - Math.sin(a) * (TK.DR - 18)} stroke={BLUE} strokeWidth={2} strokeLinecap="round" />
        ))}
      </svg>
      {/* the needle: an HTML bar turning about the hub */}
      <span aria-hidden className={run ? 't14a-l t14a-needle' : undefined} style={{ position: 'absolute', left: W / 2 - 2, top: TK.DR + 12 - (TK.DR - 20), width: 4, height: TK.DR - 20, borderRadius: 2, background: colors.brandDeep, transformOrigin: '50% 100%', transform: 'rotate(40deg)' }} />
      <span style={{ position: 'absolute', left: W / 2 - 14, top: TK.DR + 12 - 14, width: 28, height: 28, borderRadius: 99, background: '#FFFFFF', boxShadow: 'inset 0 0 0 1.5px #D3DEF6, 0 6px 12px -6px rgba(31,64,140,0.6)', display: 'grid', placeItems: 'center' }}>
        <img src={roleMark} alt="" aria-hidden draggable={false} style={{ width: 18, height: 18, display: 'block' }} />
      </span>
      <span style={{ position: 'absolute', left: -32, top: TK.DR - 4, width: 36, ...tag(13) }}>1 h</span>
      <span style={{ position: 'absolute', right: -38, top: TK.DR - 4, width: 40, ...tag(13) }}>12 h</span>
    </Show>
  )
}

/* `from` / `steps` let the slide be split in two (2026-11-18): the second half starts the build at `from` and its lit
   item walks only its own parts; a held frame shows the build as it stands at the end of that half. */
const A_T04: Fig = (p) => {
  const off = Number(p.from ?? 0)
  const cnt = Number(p.steps ?? 4)
  const held = useHeld()
  const step = held ? off + cnt : stepOf(p) + off
  const local = useHot(cnt, stepOf(p), 1700)
  const hot = local < 0 ? -1 : local + off
  const s = (n: number) => step >= n
  const live = !held
  const expiring = s(4) && live
  return (
    <Frame w={TK.W} h={TK.H}>
      {TK_IN.map((pts, k) => <Wire key={k} pts={k === 1 ? [pts[0], pts[3]] : pts.slice(0, 3)} head={k === 1 ? 10 : 0} lit={(hot === 0 && k < 2) || (hot === 1 && k === 2)} />)}
      <Junction x={TK.BUS} y={TK.QY} lit={hot === 0 || hot === 1} />
      <Wire pts={[[TK.QX + TK.QS / 2, TK.QY], [TK.AX - TK.AS / 2, TK.QY]]} lit={hot === 1} />
      <Wire pts={[[TK.QX + 32, TK.TY], [TK.AX - TK.AS / 2, TK.TY]]} on={s(4)} lit={hot === 3} />

      {TK_KY.map((y, k) => (
        <Node key={k} x={TK.KX} y={y} size={TK.KS} label={TK_NAME[k][1]} w={100}>
          <span key={expiring ? 'x' : 'n'} className={fadeCls(expiring)} style={{ display: 'grid', ...tv(TK.T) }}>
            <Tile name={TK_NAME[k][0]} size={TK.KS} lit={(hot === 0 && k < 2) || (hot === 1 && k === 2)} d={k * 0.4} />
          </span>
        </Node>
      ))}
      <Node x={TK.QX} y={TK.QY} size={TK.QS} label="Signed API Request" w={150}>
        <Tile name="mail" size={TK.QS} lit={hot === 1} d={0.2} />
        <Corner name="check" size={20} loop="beat" />
      </Node>
      <Node x={TK.AX} y={TK.QY} size={TK.AS} label="AWS" w={80}><Tile name="cloud" size={TK.AS} loop="float" /></Node>
      <Node x={TK.QX} y={TK.TY} size={64} label="Expiry" w={80}>
        <span key={expiring ? 'x' : 'n'} style={{ display: 'grid' }}><Countdown size={64} period={TK.T} run={s(1) && live} lit={hot === 3} /></span>
      </Node>
      <Node x={TK.AX} y={TK.TY} size={TK.AS} label="AssumeRole" w={100}><MarkTile src={roleMark} size={TK.AS} lit={hot === 3} /></Node>
      <Dial on={s(3)} run={s(3) && live} lit={hot === 2} />
      <span style={{ position: 'absolute', left: TK.DX + TK.DR + 62, top: TK.DY - 24, ...tag(13.5), zIndex: 3, opacity: s(3) ? 1 : 0, transition: 'opacity 520ms' }}>Duration</span>

      {[0, 1].map((k) => <Token key={k} cls={TK_RIDE[k]} on={s(1)} />)}
      <Token cls={TK_RIDE[2]} on={s(2)} tone={ORANGE} square size={9} />
      <Token cls={TK_OUT} on={s(1)} />
      <Token cls={TK_BACK} on={expiring} />
    </Frame>
  )
}

/* ================================================================== slide 13 · A_T05B · two timelines */

/*
 * 1080 x 420. Row 1 (y 130): the Temporary credential (official mark) and its bar, x 160..560, ending at a clock
 * end cap (600). Row 2 (y 300): the Long-Lived user key and its bar, x 160 to the right, fading out with no end.
 * A leak at x 320 on both rows: an orange exposure band grows from it (scaleX) with a leaked key riding above; on
 * row 1 the cap closes it at the bar's end, on row 2 it never stops. Press 1 row 1, press 2 row 2.
 */
const TL = { W: 1080, H: 420, LX: 84, Y1: 144, Y2: 312, B0: 160, B1: 560, CAP: 600, END: 1060, BH: 28, LEAK: 320, T: 6 }

function Bar({ y, x1, fade, on, lit, delay = 0 }: { y: number; x1: number; fade?: boolean; on: boolean; lit: boolean; delay?: number }) {
  const instant = useInstant()
  return (
    <div style={box(TL.B0, y - TL.BH / 2, x1 - TL.B0, TL.BH, { zIndex: 2, transformOrigin: '0 50%', transform: on ? 'scaleX(1)' : 'scaleX(0)', transition: instant ? 'none' : `transform 820ms ${EASE} ${delay}ms` })}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: fade ? `${TL.BH / 2}px 0 0 ${TL.BH / 2}px` : TL.BH / 2,
        background: fade ? `linear-gradient(90deg, ${BLUE} 0%, ${BLUE} 70%, rgba(45,99,251,0) 100%)` : `linear-gradient(180deg, #5A86FF 0%, ${BLUE} 55%, ${colors.brandDark} 100%)`,
        boxShadow: lit && !fade ? `0 0 0 3px ${ORANGE}` : 'none', transition: tr(instant, 'box-shadow', 420),
      }} />
    </div>
  )
}

function Leak({ y, x1, row, run, held }: { y: number; x1: number; row: 1 | 2; run: boolean; held: boolean }) {
  const show = run || held
  if (!show) return null
  const len = x1 - TL.LEAK
  return (
    <>
      {/* the exposure: from the leak to wherever the credential still works */}
      <div aria-hidden className={run ? `t14a-l t14a-ex${row}` : undefined} style={box(TL.LEAK, y - TL.BH / 2 + 5, len, TL.BH - 10, { zIndex: 3, borderRadius: 9, transformOrigin: '0 50%', background: row === 1 ? 'rgba(255,138,61,0.95)' : `linear-gradient(90deg, rgba(255,138,61,0.95) 0%, rgba(255,138,61,0.95) 66%, rgba(255,138,61,0) 100%)` })} />
      {/* the leaked key rides above the bar */}
      <div className={run ? `t14a-l t14a-mk${row}` : undefined} style={box(TL.LEAK - 40, y - TL.BH / 2 - 76, 80, 66, { zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' })}>
        <span style={tag(13.5)}>Leak</span>
        <span style={{ marginTop: 4 }}><Plinth size={40} warm><Ico3D name="key" size={28} loop="tilt" /></Plinth></span>
      </div>
    </>
  )
}

const A_T05B: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const hot = useHot(2, step, 2600)
  const s = (n: number) => held || step >= n
  const run = s(2) && !held
  return (
    <Frame w={TL.W} h={TL.H}>
      {/* row 1: the role's temporary credentials end on their own */}
      <Show on={s(1)}>
        <Node x={TL.LX} y={TL.Y1} size={64} label="Temporary" w={120}><MarkTile src={tempMark} size={64} lit={hot === 0} /></Node>
        <Node x={TL.CAP} y={TL.Y1} size={64} label="Expires" w={100}>
          {run && <span aria-hidden className="t14a-l t14a-close" style={{ position: 'absolute', inset: -6, borderRadius: 24, boxShadow: `0 0 0 3px ${ORANGE}`, opacity: 0 }} />}
          <Countdown size={64} period={TL.T} run={false} lit={hot === 0} />
          <Corner name="lock" size={22} on={run || held} loop="beat" />
        </Node>
      </Show>
      <Bar y={TL.Y1} x1={TL.B1} on={s(1)} lit={hot === 0} />

      {/* row 2: the user's long-lived keys run on with no end */}
      <Show on={s(2)}>
        <Node x={TL.LX} y={TL.Y2} size={64} label="Long-Lived" w={120}><MarkTile src={longMark} size={64} lit={hot === 1} /></Node>
      </Show>
      <Bar y={TL.Y2} x1={TL.END} fade on={s(2)} lit={hot === 1} />

      <Leak y={TL.Y1} x1={TL.B1} row={1} run={run} held={held} />
      <Leak y={TL.Y2} x1={TL.END} row={2} run={run} held={held} />
    </Frame>
  )
}

export const figures: Record<string, Fig> = { A_T01, A_T02, A_T03, A_T03B, A_T04, A_T05B }

/* loop keyframes (transform / opacity only) */
const TURN = [0, 1, 2].map((k) => {
  const per = 4.2
  const a = ((k * 1.4 + 0.85) / per) * 100
  const b = ((k * 1.4 + 1.4 + 0.75) / per) * 100
  const pc = (v: number) => `${Math.min(100, v).toFixed(2)}%`
  const wrap = b > 100
  return wrap
    ? `@keyframes t14a-turn${k} { 0% { opacity: 1; transform: scale(1) } ${pc(b - 100)} { opacity: 1; transform: scale(1) } ${pc(b - 100 + 4)} { opacity: 0; transform: scale(0.6) } ${pc(a - 2)} { opacity: 0; transform: scale(0.6) } ${pc(a)} { opacity: 1; transform: scale(1) } 100% { opacity: 1; transform: scale(1) } }
.t14a-turn${k} { animation: t14a-turn${k} ${per}s linear infinite; }`
    : `@keyframes t14a-turn${k} { 0%, ${pc(a - 2)} { opacity: 0; transform: scale(0.6) } ${pc(a)} { opacity: 1; transform: scale(1) } ${pc(b)} { opacity: 1; transform: scale(1) } ${pc(b + 4)}, 100% { opacity: 0; transform: scale(0.6) } }
.t14a-turn${k} { animation: t14a-turn${k} ${per}s linear infinite; }`
}).join('\n')

/* T05B: the marker moves 140 px/s from the leak; row 1 stops at its cap (240 px), row 2 runs 640 px before fading */
const MK1 = 240
const MK2 = 640
const t5 = (s: number) => `${((s / TL.T) * 100).toFixed(2)}%`

export const css = `
.t14a-l { animation-delay: var(--t14a-d, 0s); }
@keyframes t14a-cdR { 0% { transform: rotate(-135deg) } 50%, 100% { transform: rotate(45deg) } }
.t14a-cdR { animation: t14a-cdR var(--t14a-t, 6s) linear infinite; }
@keyframes t14a-cdL { 0%, 50% { transform: rotate(-135deg) } 100% { transform: rotate(45deg) } }
.t14a-cdL { animation: t14a-cdL var(--t14a-t, 6s) linear infinite; }
@keyframes t14a-fd { 0% { opacity: 0.16 } 5% { opacity: 1 } 82% { opacity: 1 } 95%, 100% { opacity: 0.16 } }
.t14a-fd { animation: t14a-fd var(--t14a-t, 6s) linear infinite; }
${TURN}
@keyframes t14a-leave { 0% { transform: translateX(0); opacity: 0 } 6%, 34% { transform: translateX(0); opacity: 1 } 78% { transform: translateX(60px); opacity: 0 } 100% { transform: translateX(60px); opacity: 0 } }
.t14a-leave { animation: t14a-leave 4.4s cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes t14a-needle { 0%, 100% { transform: rotate(-78deg) } 50% { transform: rotate(78deg) } }
.t14a-needle { animation: t14a-needle 5.2s cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes t14a-mk1 { 0%, ${t5(0.3)} { transform: translateX(0); opacity: 0 } ${t5(0.5)} { transform: translateX(0); opacity: 1 } ${t5(0.5 + MK1 / 140)} { transform: translateX(${MK1}px); opacity: 1 } ${t5(0.5 + MK1 / 140 + 0.6)}, 100% { transform: translateX(${MK1}px); opacity: 0 } }
.t14a-mk1 { animation: t14a-mk1 ${TL.T}s linear infinite; }
@keyframes t14a-mk2 { 0%, ${t5(0.3)} { transform: translateX(0); opacity: 0 } ${t5(0.5)} { transform: translateX(0); opacity: 1 } ${t5(0.5 + MK2 / 140 - 0.8)} { opacity: 1 } ${t5(0.5 + MK2 / 140)}, 100% { transform: translateX(${MK2}px); opacity: 0 } }
.t14a-mk2 { animation: t14a-mk2 ${TL.T}s linear infinite; }
@keyframes t14a-ex1 { 0%, ${t5(0.5)} { transform: scaleX(0); opacity: 1 } ${t5(0.5 + MK1 / 140)} { transform: scaleX(1); opacity: 1 } 92% { transform: scaleX(1); opacity: 1 } 100% { transform: scaleX(1); opacity: 0 } }
.t14a-ex1 { animation: t14a-ex1 ${TL.T}s linear infinite; }
@keyframes t14a-ex2 { 0%, ${t5(0.5)} { transform: scaleX(0); opacity: 1 } ${t5(0.5 + (TL.END - TL.LEAK) / 140)} { transform: scaleX(1); opacity: 1 } 92% { transform: scaleX(1); opacity: 1 } 100% { transform: scaleX(1); opacity: 0 } }
.t14a-ex2 { animation: t14a-ex2 ${TL.T}s linear infinite; }
@keyframes t14a-close { 0%, ${t5(0.5 + MK1 / 140 - 0.1)} { opacity: 0; transform: scale(0.9) } ${t5(0.5 + MK1 / 140 + 0.15)} { opacity: 1; transform: scale(1) } ${t5(0.5 + MK1 / 140 + 1.4)}, 100% { opacity: 0; transform: scale(1.1) } }
.t14a-close { animation: t14a-close ${TL.T}s linear infinite; }
${K.css()}
.cc-still .t14a-l, .deck-thumb .t14a-l { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .t14a-l { animation: none !important; } }
`
