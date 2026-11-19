import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { Ico3D, type Ico3DName, type Loop, type Badge } from '@/engine/icons3d'
import {
  Frame, Plinth, MarkTile, Panel, Wire, Junction, Show, useHot, useHeld, keyframes, Token,
  tag, heading, loopCls, loopVars, EASE, ORANGE, PAD, type Pt,
} from '@/engine/figkit'
import ec2Mark from '../images/aws-ec2.svg'
import ec2Inst from '../images/res-ec2-instance.svg'
import lambdaMark from '../images/aws-lambda.svg'
import lambdaFn from '../images/res-lambda-function.svg'
import ecsMark from '../images/aws-ecs.svg'
import ecsTask from '../images/res-ecs-task.svg'
import roleMark from '../images/res-iam-role.svg'
import iamMark from '../images/aws-iam.svg'
import icMark from '../images/aws-iam-identity-center.svg'
import mfaMark from '../images/res-iam-mfa-token.svg'
import raMark from '../images/res-iam-roles-anywhere.svg'
import dcMark from '../images/grp-corporate-data-center.svg'
import acctMark from '../images/grp-aws-account.svg'
import tempCred from '../images/res-iam-temporary-security-credential.svg'

/*
 * SESSION 14 · SECTIONS 3-4 (Federation & SSO, Service & Machine Identity) · builder C
 * C_T11 (slide 24), C_T13 (27), C_T14 (29), C_T15 (30), C_T16 (32), C_T18 (34).
 * Standing correction 17: 3D icons and official marks on white plinth tiles, PAD (20) inside every stage and card,
 * orthogonal wires computed from the box constants (tips on target edges), a flow dot or rider on every wire, the lit
 * item walking first -> last -> first after the build, held frames complete with nothing lit and nothing moving.
 * Stage sizes are the points-layout boxes (1110 - pointsW - 24 wide by figH). Class prefix `t14c-`.
 * Every loop animates transform / opacity on an HTML element or a ROOT svg only (low-end PCs).
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('t14c')
const MONO = "'Fira Code', ui-monospace, monospace"
const mono = (size: number, color: string = colors.ink): CSSProperties => ({ fontFamily: MONO, fontSize: size, lineHeight: 1.5, color, fontWeight: 500, whiteSpace: 'pre', fontVariantLigatures: 'none', fontFeatureSettings: "'liga' 0, 'calt' 0" })

/** anything riding a `ride` class (placed from the frame's 0,0) on a small white tile; nothing on held frames */
function Rider({ cls, size = 30, on = true, children }: { cls: string; size?: number; on?: boolean; children: ReactNode }) {
  const held = useHeld()
  if (held || !on) return null
  return (
    <span aria-hidden style={{ position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, zIndex: 6, pointerEvents: 'none' }}>
      <span className={cls} style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: Math.round(size * 0.3), background: '#FFFFFF', boxShadow: '0 6px 14px -8px rgba(31,64,140,0.7), inset 0 0 0 1.5px #D3DEF6', opacity: 0 }}>
        {children}
      </span>
    </span>
  )
}

const RideIco = ({ cls, name, on, size = 30, badge }: { cls: string; name: Ico3DName; on?: boolean; size?: number; badge?: Badge }) => (
  <Rider cls={cls} on={on} size={size}><Ico3D name={name} size={Math.round(size * 0.8)} loop="none" badge={badge} /></Rider>
)
const RideMark = ({ cls, src, on, size = 30 }: { cls: string; src: string; on?: boolean; size?: number }) => (
  <Rider cls={cls} on={on} size={size}><img src={src} alt="" draggable={false} style={{ width: Math.round(size * 0.7), height: Math.round(size * 0.7), display: 'block' }} /></Rider>
)

/** a tile centred on (x, y) with its Title Case tag under it */
function Node({ x, y, label, size = 52, on = true, delay = 0, children, w = 140, ts = 13 }: { x: number; y: number; label?: string; size?: number; on?: boolean; delay?: number; children: ReactNode; w?: number; ts?: number }) {
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, top: y - size / 2, width: w, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: size, height: size, display: 'grid', placeItems: 'center' }}>{children}</div>
      {label && <span style={tag(ts)}>{label}</span>}
    </Show>
  )
}

const tile = (name: Ico3DName, o: { size?: number; lit?: boolean; warm?: boolean; loop?: Loop; d?: number; t?: number; badge?: Badge; k?: number } = {}) => (
  <Plinth size={o.size ?? 52} lit={o.lit} warm={o.warm}>
    <Ico3D name={name} size={Math.round((o.size ?? 52) * (o.k ?? 0.74))} loop={o.loop ?? 'bob'} d={o.d ?? 0} t={o.t} badge={o.badge} />
  </Plinth>
)

/** the official IAM Role mark on a small white disc, laid over a tile's lower-right corner */
function RoleBadge({ size = 22, dim = false, d = 0 }: { size?: number; dim?: boolean; d?: number }) {
  const instant = useHeld()
  return (
    <span aria-hidden style={{ position: 'absolute', right: -Math.round(size * 0.32), bottom: -Math.round(size * 0.32), width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.7), inset 0 0 0 1.2px #D3DEF6', display: 'grid', placeItems: 'center', zIndex: 4, opacity: dim ? 0.35 : 1, filter: dim ? 'grayscale(1)' : undefined, transition: instant ? 'none' : `opacity 520ms ${EASE}, filter 520ms ${EASE}` }}>
      <span className={dim ? undefined : loopCls('glow')} style={{ display: 'grid', placeItems: 'center', ...loopVars(d, 2.4) }}>
        <img src={roleMark} alt="" draggable={false} style={{ width: Math.round(size * 0.72), height: Math.round(size * 0.72), display: 'block' }} />
      </span>
    </span>
  )
}

/** a card with an icon tile on the left and its name (and an optional second line) on the right */
function Card({ x, y, w, h, on, lit, delay = 0, icon, title, sub, subOn = true, size = 15 }: { x: number; y: number; w: number; h: number; on: boolean; lit: boolean; delay?: number; icon: ReactNode; title: string; sub?: ReactNode; subOn?: boolean; size?: number }) {
  return (
    <Panel x={x} y={y} w={w} h={h} on={on} lit={lit} delay={delay}>
      <div style={{ position: 'absolute', inset: 0, padding: '0 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        {icon}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ ...heading(size), whiteSpace: 'nowrap' }}>{title}</span>
          {sub && <Show on={subOn} lift={3}>{sub}</Show>}
        </div>
      </div>
    </Panel>
  )
}

/* ================================================================== 24 · C_T11 · federation: the proof rides the loop */

/*
 * 546 x 330. A loop of four cards: Employee (top left) -> Company IdP (top middle) -> Signed Proof (bottom middle)
 * -> AWS (bottom left) -> back up to the Employee, now logged in. Inside the loop, the trust link drawn beforehand
 * between AWS and the IdP (dashed, a link tile on it). Right: the IdP fans out to Other Clouds and On-Premise.
 */
const F = { W: 546, H: 330, CW: 174, CH: 76, X1: PAD, X2: 240, Y1: 26, Y3: 228, TX: 480, BUS: 434, R2: 165 }
const F_C1 = F.Y1 + F.CH / 2 // 64
const F_C3 = F.Y3 + F.CH / 2 // 266
const F_R1 = F.X1 + F.CW // 194
const F_R2 = F.X2 + F.CW // 414
const F_LX = 60 // the loop's left leg (AWS -> Employee)
const F_RX = 360 // the loop's right leg (IdP -> Proof)
const F_TA = 150 // trust leg out of AWS
const F_TB = 280 // trust leg into the IdP
const F_TT = 44 // the fan-out tiles
const F_W1: Pt[] = [[F_R1, F_C1], [F.X2, F_C1]]
const F_W2: Pt[] = [[F_RX, F.Y1 + F.CH], [F_RX, F.Y3]]
const F_W3: Pt[] = [[F.X2, F_C3], [F_R1, F_C3]]
const F_W4: Pt[] = [[F_LX, F.Y3], [F_LX, F.Y1 + F.CH]]
const F_TRUST: Pt[] = [[F_TA, F.Y3], [F_TA, F.R2], [F_TB, F.R2], [F_TB, F.Y1 + F.CH]]
const F_TRX = (F_TA + F_TB) / 2
const F_FAN: Pt[][] = [[[F_R2, F_C1], [F.TX - F_TT / 2, F_C1]], [[F.BUS, F_C1], [F.BUS, F.R2], [F.TX - F_TT / 2, F.R2]]]
const F_P = 5.2
const F_RIDE = {
  req: K.ride('f-req', [[F_R1 + 4, F_C1], [F.X2 - 10, F_C1]], 0.1, 0.8, F_P),
  w2: K.ride('f-w2', [[F_RX, F.Y1 + F.CH + 18], [F_RX, F.Y3 - 20]], 0.9, 1.8, F_P),
  w3: K.ride('f-w3', [[F.X2 - 8, F_C3], [F_R1 + 14, F_C3]], 1.9, 2.4, F_P),
  w4: K.ride('f-w4', [[F_LX, F.Y3 - 18], [F_LX, F.Y1 + F.CH + 20]], 2.5, 3.4, F_P),
  t1: K.ride('f-t1', [[F_TA, F.Y3 - 6], [F_TA, F.R2], [F_TRX - 26, F.R2]], 3.5, 4.1, F_P),
  t2: K.ride('f-t2', [[F_TRX + 26, F.R2], [F_TB, F.R2], [F_TB, F.Y1 + F.CH + 8]], 4.1, 4.7, F_P),
  f1: K.ride('f-f1', [[F_R2 + 4, F_C1], [F.TX - F_TT / 2 - 10, F_C1]], 3.5, 4.2, F_P),
  f2: K.ride('f-f2', [[F_R2 + 4, F_C1], [F.BUS, F_C1], [F.BUS, F.R2], [F.TX - F_TT / 2 - 10, F.R2]], 3.5, 4.6, F_P),
}

const C_T11: Fig = ({ step = 0 }) => {
  const s = step as number
  const hot = useHot(4, s, 1600)
  const held = useHeld()
  return (
    <Frame w={F.W} h={F.H}>
      <Card x={F.X1} y={F.Y1} w={F.CW} h={F.CH} on={s >= 1} lit={hot === 1} size={15}
        icon={<Plinth size={36}><Ico3D name="user" size={28} loop="bob" badge={s >= 2 ? 'check' : undefined} /></Plinth>}
        title="Employee" subOn={s >= 2} sub={<span style={{ ...tag(13, colors.brandDark), textAlign: 'left' }}>Logged In</span>} />
      <Card x={F.X2} y={F.Y1} w={F.CW} h={F.CH} on={s >= 1} lit={hot === 0 || hot === 3} delay={150}
        icon={<Plinth size={36}><Ico3D name="building" size={28} loop="float" d={0.4} badge="check" /></Plinth>} title="Company IdP" />
      <Card x={F.X1} y={F.Y3} w={F.CW} h={F.CH} on={s >= 1} lit={hot === 1} delay={300}
        icon={<Plinth size={36}><Ico3D name="cloud" size={28} loop="bob" d={0.9} /></Plinth>} title="AWS" />
      <Card x={F.X2} y={F.Y3} w={F.CW} h={F.CH} on={s >= 2} lit={hot === 1}
        icon={<Plinth size={36}><Ico3D name="docfix" size={28} loop="tilt" d={0.2} /></Plinth>} title="Signed Proof" />

      {/* 1 · the login request lands at the company IdP */}
      <Wire pts={F_W1} on={s >= 1} lit={hot === 0} head={10} delay={300} />
      <Token cls={F_RIDE.req} on={s >= 1} size={10} />
      {/* 2 · the signed proof rides the loop: IdP -> proof -> AWS -> employee (no password crosses) */}
      <Wire pts={F_W2} on={s >= 2} lit={hot === 1} head={10} delay={100} />
      <Wire pts={F_W3} on={s >= 2} lit={hot === 1} head={10} delay={400} />
      <Wire pts={F_W4} on={s >= 2} lit={hot === 1} head={10} delay={700} />
      <RideIco cls={F_RIDE.w2} name="docfix" on={s >= 2} size={28} />
      <RideIco cls={F_RIDE.w3} name="docfix" on={s >= 2} size={28} />
      <RideIco cls={F_RIDE.w4} name="docfix" on={s >= 2} size={28} />
      {/* 3 · the trust link, configured beforehand between AWS and the IdP */}
      <Wire pts={F_TRUST} on={s >= 3} lit={hot === 2} head={0} dash="6 7" width={2.4} />
      <Node x={F_TRX} y={F.R2} label="Trust" size={40} on={s >= 3} delay={200} w={80}>
        {tile('link', { size: 40, lit: hot === 2, loop: 'tilt', t: 2.8 })}
      </Node>
      <Token cls={F_RIDE.t1} on={s >= 3} size={9} />
      <Token cls={F_RIDE.t2} on={s >= 3} size={9} />
      {/* 4 · one IdP serves other clouds and on-premise apps too */}
      <Wire pts={F_FAN[0]} on={s >= 4} lit={hot === 3} head={9} />
      <Wire pts={F_FAN[1]} on={s >= 4} lit={hot === 3} head={9} delay={250} />
      <Junction x={F.BUS} y={F_C1} on={s >= 4} lit={hot === 3} />
      <Node x={F.TX} y={F_C1} label="Other Clouds" size={F_TT} on={s >= 4} delay={300} w={100}>
        {tile('cloud', { size: F_TT, lit: hot === 3, loop: 'float', d: 0.5 })}
      </Node>
      <Node x={F.TX} y={F.R2} label="On-Premise" size={F_TT} on={s >= 4} delay={500} w={100}>
        {tile('server', { size: F_TT, lit: hot === 3, loop: 'bob', d: 1.2 })}
      </Node>
      <Token cls={F_RIDE.f1} on={s >= 4} size={9} />
      <Token cls={F_RIDE.f2} on={s >= 4} size={9} />
      {void held}
    </Frame>
  )
}

/* ================================================================== 27 · C_T13 · MFA condition, terminate denied, SSO */

/*
 * 526 x 330. Top: the policy's Condition block (mono, the MFA line lit at press 1), an arrow from it to the
 * TerminateInstances action on an EC2 instance, marked Denied (orange cross). Loop: a request without the MFA token
 * hits the deny, one carrying the token passes (a check replaces the cross for that moment).
 * Bottom: IdP -> MFA Token <- Identity Center; Identity Center fans out over a rail to three account tiles.
 */
const M = { W: 526, H: 330, PX: PAD, PY: 22, PW: 348, LH: 19.5, AX: 440, AT: 56, BY: 260, BT: 52, RAIL: 204, AC: 44 }
const M_LINES = ['"Condition": {', '  "Bool": {', '    "aws:MultiFactorAuthPresent": "true"', '  }', '}']
const M_PH = M_LINES.length * M.LH + PAD * 2
const M_CY = M.PY + PAD + 2 * M.LH + M.LH / 2 // the MFA line
const M_ARROW: Pt[] = [[M.PX + M.PW, M_CY], [M.AX - M.AT / 2, M_CY]]
const M_X = { idp: 56, mfa: 148, ic: 240 }
const M_ACC = [330, 400, 470]
const M_FAN: Pt[][] = M_ACC.map((x) => [[M_X.ic, M.BY - M.BT / 2], [M_X.ic, M.RAIL], [x, M.RAIL], [x, M.BY - M.AC / 2]])
const M_MFA: Pt[][] = [[[M_X.idp + M.BT / 2, M.BY], [M_X.mfa - M.BT / 2, M.BY]], [[M_X.ic - M.BT / 2, M.BY], [M_X.mfa + M.BT / 2, M.BY]]]
const M_P = 4.4
const M_RIDE = {
  bad: K.ride('m-bad', [[M.PX + M.PW + 10, M_CY], [M.AX - M.AT / 2 - 18, M_CY]], 0.2, 1.1, M_P, 0.5),
  good: K.ride('m-good', [[M.PX + M.PW + 10, M_CY], [M.AX - M.AT / 2 - 18, M_CY]], 2.4, 3.3, M_P, 0.5),
  fan: M_FAN.map((pts, i) => K.ride(`m-f${i}`, [[pts[0][0], pts[0][1] - 4], ...pts.slice(1, -1), [pts[3][0], pts[3][1] - 8]], 0.4 + i * 0.25, 1.6 + i * 0.25, M_P)),
  mfa: M_MFA.map((pts, i) => K.ride(`m-m${i}`, [pts[0], [pts[1][0] + (i ? 8 : -8), pts[1][1]]], 2.0 + i * 0.3, 2.6 + i * 0.3, M_P)),
}

const C_T13: Fig = ({ step = 0 }) => {
  const s = step as number
  const hot = useHot(4, s, 1700)
  const held = useHeld()
  return (
    <Frame w={M.W} h={M.H}>
      {/* the policy's Condition block */}
      <Panel x={M.PX} y={M.PY} w={M.PW} h={M_PH} on={s >= 1} lit={false}>
        <div style={{ position: 'absolute', left: PAD, right: PAD, top: PAD }}>
          {M_LINES.map((l, i) => (
            <div key={i} style={{ position: 'relative', height: M.LH, display: 'flex', alignItems: 'center' }}>
              {i === 2 && (
                <span aria-hidden style={{ position: 'absolute', left: -8, right: -8, top: -1, bottom: -1, borderRadius: 7, background: hot === 0 ? '#FFF1E6' : '#EEF3FF', boxShadow: hot === 0 ? `inset 0 0 0 2px ${ORANGE}` : 'inset 0 0 0 1px #D3DEF6', transition: held ? 'none' : `background 420ms ${EASE}, box-shadow 420ms ${EASE}` }} />
              )}
              <span style={{ position: 'relative', ...mono(12, i === 2 ? colors.brandDark : colors.ink) }}>{l}</span>
            </div>
          ))}
        </div>
      </Panel>
      {/* the protected action: TerminateInstances, denied without MFA */}
      <Wire pts={M_ARROW} on={s >= 2} lit={hot === 1} head={10} delay={150} />
      <Show on={s >= 2} delay={300} style={{ position: 'absolute', left: M.AX - 70, top: M_CY - M.AT / 2, width: 140, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ position: 'relative', width: M.AT, height: M.AT }}>
          <MarkTile src={ec2Inst} size={M.AT} lit={hot === 1} />
          <span className={held ? undefined : 't14c-deny'} style={{ position: 'absolute', right: -10, top: -10, zIndex: 4 }}><Ico3D name="cross" size={26} loop="none" /></span>
          {!held && <span className="t14c-pass" style={{ position: 'absolute', right: -10, top: -10, zIndex: 5, opacity: 0 }}><Ico3D name="check" size={26} loop="none" /></span>}
        </div>
        <span style={tag(13)}>TerminateInstances</span>
        <span style={tag(13, colors.ink)}>Allowed (MFA present)</span>
      </Show>
      <RideIco cls={M_RIDE.bad} name="key" on={s >= 2} size={28} />
      <Rider cls={M_RIDE.good} on={s >= 2} size={28}>
        <span style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
          <Ico3D name="key" size={20} loop="none" />
          <img src={mfaMark} alt="" draggable={false} style={{ position: 'absolute', right: -9, bottom: -8, width: 14, height: 14, background: '#FFFFFF', borderRadius: 4 }} />
        </span>
      </Rider>
      {/* single sign-on: Identity Center fans out to many accounts */}
      <Node x={M_X.ic} y={M.BY} label="Identity Center" size={M.BT} on={s >= 3} w={110}>
        <MarkTile src={icMark} size={M.BT} lit={hot === 2 || hot === 3} />
      </Node>
      {M_FAN.map((pts, i) => <Wire key={i} pts={pts} on={s >= 3} lit={hot === 2} head={9} delay={250 + i * 150} />)}
      <Junction x={M_X.ic} y={M.RAIL} on={s >= 3} lit={hot === 2} />
      {M_ACC.map((x, i) => (
        <Node key={x} x={x} y={M.BY} label="Account" size={M.AC} on={s >= 3} delay={450 + i * 150} w={64}>
          <MarkTile src={acctMark} size={M.AC} lit={hot === 2} scale={0.56} />
        </Node>
      ))}
      {M_RIDE.fan.map((c) => <Token key={c} cls={c} on={s >= 3} size={9} />)}
      {/* MFA from the IdP or from Identity Center */}
      <Node x={M_X.idp} y={M.BY} label="IdP" size={M.BT} on={s >= 4} w={70}>
        {tile('building', { size: M.BT, lit: hot === 3, loop: 'float', badge: 'check' })}
      </Node>
      <Node x={M_X.mfa} y={M.BY} label="MFA Token" size={M.BT} on={s >= 4} delay={200} w={90}>
        <MarkTile src={mfaMark} size={M.BT} lit={hot === 3} />
      </Node>
      {M_MFA.map((pts, i) => <Wire key={i} pts={pts} on={s >= 4} lit={hot === 3} head={9} delay={300 + i * 150} />)}
      {M_RIDE.mfa.map((c) => <Token key={c} cls={c} on={s >= 4} size={9} />)}
    </Frame>
  )
}

/* ================================================================== 29 · C_T14 · the machine identity map */

/*
 * 546 x 330. Left: EC2, Lambda and ECS, each wired to its own small IAM Role mark (Instance Role, Workload Role).
 * Right top: the anti-pattern, a code file with a crossed-out key beside it (Embedded Key).
 * Right bottom (press 4): the three become many, a grid of services each with its own role.
 */
const N = { W: 546, H: 330, SX: 62, RX: 196, ST: 52, RT: 40, CX: 280, CW: 246, CY: 22, CH: 116, GY: 154 }
const N_Y = [54, 154, 254]
const N_ROWS: [string, string, string][] = [[ec2Mark, 'EC2', 'Instance Role'], [lambdaMark, 'Lambda', 'Workload Role'], [ecsMark, 'ECS', 'Workload Role']]
const N_W: Pt[][] = N_Y.map((y) => [[N.SX + N.ST / 2, y], [N.RX - N.RT / 2, y]])
const N_RIDE = N_W.map((pts, i) => K.ride(`n${i}`, [[pts[0][0] + 6, pts[0][1]], [pts[1][0] - 10, pts[1][1]]], 0.2 + i * 0.6, 1.0 + i * 0.6, 3.0))
const N_GRID: [string | null, Ico3DName | null][] = [
  [ec2Mark, null], [lambdaMark, null], [ecsMark, null], [null, 'server'],
  [ec2Inst, null], [lambdaFn, null], [ecsTask, null], [null, 'container'],
]

const C_T14: Fig = ({ step = 0 }) => {
  const s = step as number
  const hot = useHot(4, s, 1600)
  const rowLit = (i: number) => (i === 0 ? hot === 0 : hot === 1)
  return (
    <Frame w={N.W} h={N.H}>
      {N_ROWS.map(([src, label, role], i) => {
        const on = i === 0 ? s >= 1 : s >= 2
        return (
          <div key={label}>
            <Node x={N.SX} y={N_Y[i]} label={label} size={N.ST} on={on} delay={i === 2 ? 200 : 0} w={90}>
              <MarkTile src={src} size={N.ST} lit={rowLit(i)} />
            </Node>
            <Wire pts={N_W[i]} on={on} lit={rowLit(i)} head={9} delay={i === 2 ? 450 : 250} />
            <Token cls={N_RIDE[i]} on={on} size={9} />
            <Node x={N.RX} y={N_Y[i]} label={role} size={N.RT} on={on} delay={i === 2 ? 600 : 400} w={110}>
              <span className={loopCls('glow')} style={{ display: 'grid', ...loopVars(i * 0.8, 2.4) }}>
                <MarkTile src={roleMark} size={N.RT} lit={rowLit(i)} />
              </span>
            </Node>
          </div>
        )
      })}
      {/* the anti-pattern: a long-lived key embedded beside the code */}
      <Panel x={N.CX} y={N.CY} w={N.CW} h={N.CH} on={s >= 3} lit={hot === 2}>
        <div style={{ position: 'absolute', inset: 0, padding: PAD, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
            {tile('code', { size: 52, loop: 'bob' })}
            <span style={{ position: 'relative', display: 'grid' }}>
              {tile('key', { size: 52, warm: true, loop: 'tilt', t: 2.6 })}
              <span aria-hidden className={loopCls('glow')} style={{ position: 'absolute', left: -4, right: -4, top: '50%', height: 5, marginTop: -2.5, borderRadius: 4, background: ORANGE, transform: 'rotate(-45deg)', boxShadow: '0 0 0 2px #FFFFFF', ...loopVars(0, 1.8) }} />
            </span>
          </div>
          <span style={tag(14)}>Embedded Key</span>
        </div>
      </Panel>
      {/* the scale challenge: many services, each with its own role */}
      <Panel x={N.CX} y={N.GY} w={N.CW} h={N.H - PAD - N.GY} on={s >= 4} lit={hot === 3}>
        <div style={{ position: 'absolute', inset: 0, padding: PAD, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 40px)', columnGap: 16, rowGap: 14 }}>
            {N_GRID.map(([src, ico], k) => (
              <Show key={k} on={s >= 4} delay={k * 70} style={{ position: 'relative', width: 40, height: 40 }}>
                {src ? <MarkTile src={src} size={40} /> : tile(ico as Ico3DName, { size: 40, d: k * 0.3 })}
                <RoleBadge size={20} d={k * 0.3} />
              </Show>
            ))}
          </div>
          <span style={tag(14)}>Many Services</span>
        </div>
      </Panel>
    </Frame>
  )
}

/* ================================================================== 30 · C_T15 · a role on the machine */

/*
 * 546 x 330. Three lanes: a service card (EC2 with its code, Lambda, ECS) -> an arrow -> its own role card:
 * Instance Profile (the role inside it swaps while the code card holds still), Execution Role (function + role),
 * Task Role (ECS task + role).
 */
const R = { W: 546, H: 330, SW: 160, RX: 264, CH: 80, GAP: 25 }
const R_Y = [0, 1, 2].map((i) => PAD + i * (R.CH + R.GAP))
const R_CY = R_Y.map((y) => y + R.CH / 2)
const R_RW = R.W - PAD - R.RX
const R_W: Pt[][] = R_CY.map((y) => [[PAD + R.SW, y], [R.RX, y]])
const R_RIDE = R_W.map((pts, i) => K.ride(`r${i}`, [[pts[0][0] + 6, pts[0][1]], [pts[1][0] - 12, pts[1][1]]], 0.2 + i * 0.7, 1.1 + i * 0.7, 3.2))

/** the role inside the instance profile: two roles take turns (the swap), the first one on held frames */
function SwapRole({ lit }: { lit: boolean }) {
  const held = useHeld()
  const face = (b: Ico3DName) => (
    <span style={{ position: 'relative', display: 'grid' }}>
      <MarkTile src={roleMark} size={40} lit={lit} />
      <span style={{ position: 'absolute', right: -8, bottom: -8, width: 22, height: 22, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.7)', display: 'grid', placeItems: 'center' }}>
        <Ico3D name={b} size={16} loop="none" />
      </span>
    </span>
  )
  if (held) return face('bucket')
  return (
    <span style={{ position: 'relative', display: 'grid', width: 40, height: 40 }}>
      <span className="t14c-swapA" style={{ position: 'absolute', inset: 0 }}>{face('bucket')}</span>
      <span className="t14c-swapB" style={{ position: 'absolute', inset: 0, opacity: 0 }}>{face('database')}</span>
    </span>
  )
}

const C_T15: Fig = ({ step = 0 }) => {
  const s = step as number
  const hot = useHot(3, s, 1800)
  const mark = (src: string, lit: boolean) => <MarkTile src={src} size={40} lit={lit} />
  const services: [string, string][] = [[ec2Mark, 'EC2'], [lambdaMark, 'Lambda'], [ecsMark, 'ECS']]
  return (
    <Frame w={R.W} h={R.H}>
      {services.map(([src, label], i) => (
        <div key={label}>
          <Panel x={PAD} y={R_Y[i]} w={R.SW} h={R.CH} on={s >= i + 1} lit={hot === i}>
            <div style={{ position: 'absolute', inset: 0, padding: `0 ${PAD}px`, display: 'flex', alignItems: 'center', gap: 10 }}>
              {mark(src, false)}
              <span style={heading(15)}>{label}</span>
              {i === 0 && (
                <span style={{ marginLeft: 'auto', position: 'relative', display: 'grid' }}>
                  <span aria-hidden className={loopCls('halo')} style={{ position: 'absolute', inset: -4, borderRadius: 10, background: `radial-gradient(closest-side, ${colors.brand}30, ${colors.brand}00)`, ...loopVars(0, 3.2) }} />
                  <Ico3D name="code" size={30} loop="none" style={{ position: 'relative' }} />
                </span>
              )}
            </div>
          </Panel>
          <Wire pts={R_W[i]} on={s >= i + 1} lit={hot === i} head={10} delay={250} />
          <Token cls={R_RIDE[i]} on={s >= i + 1} size={10} />
          <Panel x={R.RX} y={R_Y[i]} w={R_RW} h={R.CH} on={s >= i + 1} lit={hot === i} delay={400}>
            <div style={{ position: 'absolute', inset: 0, padding: `0 ${PAD}px`, display: 'flex', alignItems: 'center', gap: 10 }}>
              {i === 0 ? <SwapRole lit={false} /> : <>{mark(i === 1 ? lambdaFn : ecsTask, false)}<span className={loopCls('glow')} style={{ display: 'grid', ...loopVars(i * 0.6, 2.4) }}>{mark(roleMark, false)}</span></>}
              <span style={{ ...heading(15), whiteSpace: 'nowrap', marginLeft: 4 }}>{i === 0 ? 'Instance Profile' : i === 1 ? 'Execution Role' : 'Task Role'}</span>
            </div>
          </Panel>
        </div>
      ))}
    </Frame>
  )
}

/* ================================================================== 32 · C_T16 · credentials, delivered and refreshed */

/*
 * 546 x 330. Top: Instance -> Metadata Service -> Temporary Credentials (a refresh ring turning round them, a clock on
 * the ring) -> AWS API Call; the credentials ride to the API. Bottom left: Lambda, the credentials appearing inside its
 * execution environment. Bottom right: a config file and a code file, each with an empty key slot.
 */
const D = { W: 546, H: 330, Y: 56, T: 52, CT: 48, RING: 36, TAGY: 102, BY: 132, GAP: 16 }
const D_X = [64, 202, 342, 478]
const D_W: Pt[][] = [
  [[D_X[0] + D.T / 2, D.Y], [D_X[1] - D.T / 2, D.Y]],
  [[D_X[1] + D.T / 2, D.Y], [D_X[2] - D.RING - 2, D.Y]],
  [[D_X[2] + D.RING + 2, D.Y], [D_X[3] - D.T / 2, D.Y]],
]
const D_P = 3.6
const D_RIDE = [
  K.ride('d0', [[D_W[0][0][0] + 6, D.Y], [D_W[0][1][0] - 12, D.Y]], 0.1, 0.9, D_P),
  K.ride('d1', [[D_W[1][0][0] + 6, D.Y], [D_W[1][1][0] - 12, D.Y]], 0.9, 1.7, D_P),
]
const D_RIDE_C = K.ride('d2', [[D_W[2][0][0] + 12, D.Y], [D_W[2][1][0] - 18, D.Y]], 1.9, 3.0, D_P, 0.6)
const D_BW = (D.W - PAD * 2 - D.GAP) / 2
const D_BH = D.H - PAD - D.BY
const D_BH2 = D_BH - 30 // the right panel: room under it for its "No keys stored" label

/** a root svg ring turning round the credentials: the refresh loop (rotation on the root svg only) */
function RefreshRing({ on, lit }: { on: boolean; lit: boolean }) {
  const held = useHeld()
  const r = D.RING
  const c = lit ? ORANGE : colors.brand
  return (
    <Show on={on} style={{ position: 'absolute', left: D_X[2] - r - 4, top: D.Y - r - 4, width: r * 2 + 8, height: r * 2 + 8, zIndex: 2 }}>
      <svg aria-hidden className={held ? undefined : 't14c-spin'} width={r * 2 + 8} height={r * 2 + 8} viewBox={`${-r - 4} ${-r - 4} ${r * 2 + 8} ${r * 2 + 8}`} style={{ display: 'block', overflow: 'visible' }}>
        <path d={`M ${r} 0 A ${r} ${r} 0 0 1 ${-r * 0.5} ${r * 0.866}`} fill="none" stroke={c} strokeWidth={2.6} strokeLinecap="round" />
        <path d={`M ${-r} 0 A ${r} ${r} 0 0 1 ${r * 0.5} ${-r * 0.866}`} fill="none" stroke={c} strokeWidth={2.6} strokeLinecap="round" />
        <polygon points={`${-r * 0.5 - 6},${r * 0.866 - 2} ${-r * 0.5 + 3},${r * 0.866 + 7} ${-r * 0.5 + 4},${r * 0.866 - 5}`} fill={c} transform={`rotate(0)`} />
        <polygon points={`${r * 0.5 + 6},${-r * 0.866 + 2} ${r * 0.5 - 3},${-r * 0.866 - 7} ${r * 0.5 - 4},${-r * 0.866 + 5}`} fill={c} />
      </svg>
    </Show>
  )
}

/** a file tile with its key badge crossed out on its corner (the strike as on C_T14's Embedded Key, review 2026-11-19;
    turned the other way here: the small key lies along -45deg and a strike on that diagonal hid it) */
function KeySlotFile({ name, label, d }: { name: Ico3DName; label: string; d: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <span style={{ position: 'relative', display: 'grid' }}>
        {tile(name, { size: 56, d })}
        <span style={{ position: 'absolute', right: -14, bottom: -12, width: 30, height: 30, borderRadius: 9, background: '#FFFFFF', border: `2px dashed ${colors.brand}88`, display: 'grid', placeItems: 'center' }}>
          <span style={{ display: 'grid' }}><Ico3D name="key" size={18} loop="none" /></span>
          <span aria-hidden className={loopCls('glow')} style={{ position: 'absolute', left: -3, right: -3, top: '50%', height: 4, marginTop: -2, borderRadius: 4, background: ORANGE, transform: 'rotate(45deg)', boxShadow: '0 0 0 2px #FFFFFF', ...loopVars(d, 1.8) }} />
        </span>
      </span>
      <span style={tag(14)}>{label}</span>
    </div>
  )
}

const C_T16: Fig = ({ step = 0 }) => {
  const s = step as number
  const hot = useHot(4, s, 1700)
  const held = useHeld()
  const labels = ['Instance', 'Metadata Service', 'Temporary Credentials', 'AWS API Call']
  const lit0 = hot === 0
  return (
    <Frame w={D.W} h={D.H}>
      {/* the flow: the instance asks its local metadata service, which hands out temporary credentials for the API call */}
      {D_X.map((x, i) => (
        <Show key={i} on={s >= 1} delay={i * 150} style={{ position: 'absolute', left: x - 75, top: D.Y - (i === 2 ? D.CT : D.T) / 2, width: 150, zIndex: 3, display: 'flex', justifyContent: 'center' }}>
          {i === 0 && <MarkTile src={ec2Inst} size={D.T} lit={lit0} />}
          {i === 1 && tile('list', { size: D.T, lit: lit0, loop: 'bob', d: 0.4 })}
          {i === 2 && <MarkTile src={tempCred} size={D.CT} lit={lit0 || hot === 1} />}
          {i === 3 && tile('cloud', { size: D.T, loop: 'float', d: 0.8 })}
        </Show>
      ))}
      {D_X.map((x, i) => (
        <Show key={`t${i}`} on={s >= 1} delay={i * 150} style={{ position: 'absolute', left: x - 75, top: D.TAGY, width: 150, zIndex: 3, display: 'flex', justifyContent: 'center' }}>
          <span style={tag(13)}>{labels[i]}</span>
        </Show>
      ))}
      {D_W.map((pts, i) => <Wire key={i} pts={pts} on={s >= 1} lit={i < 2 ? lit0 : false} head={9} delay={200 + i * 200} />)}
      {D_RIDE.map((c) => <Token key={c} cls={c} on={s >= 1} size={9} />)}
      <RideMark cls={D_RIDE_C} src={tempCred} on={s >= 1} size={26} />
      {/* 2 · the refresh loop and its clock */}
      <RefreshRing on={s >= 2} lit={hot === 1} />
      <Show on={s >= 2} delay={200} style={{ position: 'absolute', left: D_X[2] + 20, top: D.Y + 12, width: 30, height: 30, zIndex: 4, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.7)', display: 'grid', placeItems: 'center' }}>
        <Ico3D name="clock" size={24} loop="pulse" t={1.8} />
      </Show>
      {/* 3 · Lambda: the credentials appear inside the execution environment */}
      <Panel x={PAD} y={D.BY} w={D_BW} h={D_BH} on={s >= 3} lit={hot === 2}>
        <div style={{ position: 'absolute', left: PAD, top: PAD, display: 'flex', alignItems: 'center', gap: 12 }}>
          <MarkTile src={lambdaMark} size={40} />
          <span style={heading(16)}>Lambda</span>
        </div>
        <div style={{ position: 'absolute', left: PAD, right: PAD, bottom: PAD, height: 80, borderRadius: 14, border: `2px dashed ${colors.line}`, background: '#F7F9FF', display: 'flex', alignItems: 'center', gap: 12, padding: '0 18px' }}>
          <span className={held ? undefined : 't14c-inject'} style={{ display: 'grid' }}><MarkTile src={tempCred} size={40} /></span>
          <span style={tag(14)}>Environment</span>
        </div>
      </Panel>
      {/* 4 · no long-lived keys in code or config files: their key slots stay empty */}
      <Panel x={PAD + D_BW + D.GAP} y={D.BY} w={D_BW} h={D_BH2} on={s >= 4} lit={hot === 3}>
        <div style={{ position: 'absolute', inset: 0, padding: PAD, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 46 }}>
          <KeySlotFile name="doc" label="Config" d={0} />
          <KeySlotFile name="code" label="Code" d={0.8} />
        </div>
      </Panel>
      <Show on={s >= 4} delay={250} style={{ position: 'absolute', left: PAD + D_BW + D.GAP, top: D.BY + D_BH2 + 8, width: D_BW, zIndex: 3, display: 'flex', justifyContent: 'center' }}>
        <span style={tag(14)}>No keys stored</span>
      </Show>
    </Frame>
  )
}

/* ================================================================== 34 · C_T18 · governing many machine identities */

/*
 * 546 x 330. Left: EC2, Lambda and ECS, each with its own role badge, wired into the central IAM tile. Top right: an
 * on-premises data center joins through IAM Roles Anywhere (an elbow down into IAM). Bottom right: two account frames,
 * a service in one assuming a role in the other (the cross-account wire). Press 4: IAM tracks every identity and
 * revokes one (the ECS role greys out, its wire goes dashed).
 */
const G = { W: 546, H: 330, SX: 58, ST: 44, BUS: 136, IX: 214, IY: 155, IT: 72, RAX: 372, OPX: 482, TY: 62, AY: 196, AW: 114, AH: 110 }
const G_Y = [52, 155, 258]
const G_IN: Pt[][] = G_Y.map((y) => (y === G.IY ? [[G.SX + G.ST / 2, y], [G.IX - G.IT / 2, y]] : [[G.SX + G.ST / 2, y], [G.BUS, y], [G.BUS, G.IY], [G.IX - G.IT / 2, G.IY]]))
const G_OP: Pt[] = [[G.OPX - G.ST / 2, G.TY], [G.RAX + G.ST / 2, G.TY]]
const G_RA: Pt[] = [[G.RAX - G.ST / 2, G.TY], [G.IX, G.TY], [G.IX, G.IY - G.IT / 2]]
const G_AX = [G.W - PAD - G.AW * 2 - 22, G.W - PAD - G.AW]
const G_ACX = G_AX.map((x) => x + G.AW / 2)
const G_ATY = G.AY + 50
const G_X: Pt[] = [[G_ACX[0] + 20, G_ATY], [G_ACX[1] - 20, G_ATY]]
const G_P = 3.6
const G_RIDE = {
  svc: G_IN.map((pts, i) => K.ride(`g${i}`, [[pts[0][0] + 6, pts[0][1]], ...pts.slice(1, -1), [pts[pts.length - 1][0] - 12, pts[pts.length - 1][1]]], 0.1 + i * 0.5, 1.3 + i * 0.5, G_P)),
  op: K.ride('g-op', [[G_OP[0][0] - 6, G.TY], [G_OP[1][0] + 12, G.TY]], 0.2, 0.9, G_P),
  ra: K.ride('g-ra', [[G_RA[0][0] - 6, G.TY], G_RA[1], [G.IX, G.IY - G.IT / 2 - 12]], 1.0, 2.2, G_P),
  x: K.ride('g-x', [[G_X[0][0] + 6, G_ATY], [G_X[1][0] - 12, G_ATY]], 2.2, 3.2, G_P),
}

const C_T18: Fig = ({ step = 0 }) => {
  const s = step as number
  const hot = useHot(4, s, 1700)
  const revoked = s >= 4
  const svcs: [string, string][] = [[ec2Mark, 'EC2'], [lambdaMark, 'Lambda'], [ecsMark, 'ECS']]
  return (
    <Frame w={G.W} h={G.H}>
      {/* 1 · every service its own scoped role, all governed by IAM */}
      {svcs.map(([src, label], i) => {
        const gone = revoked && i === 2
        return (
          <div key={label}>
            <Node x={G.SX} y={G_Y[i]} label={label} size={G.ST} on={s >= 1} delay={i * 120} w={80}>
              <MarkTile src={src} size={G.ST} lit={hot === 0 || (hot === 3 && i === 2)} />
              <RoleBadge size={22} dim={gone} d={i * 0.7} />
            </Node>
            <Wire pts={G_IN[i]} on={s >= 1} lit={hot === 0} head={i === 1 ? 10 : 0} delay={250} dash={gone ? '5 7' : undefined} opacity={gone ? 0.5 : 1} />
            <Token cls={G_RIDE.svc[i]} on={s >= 1 && !gone} size={9} />
          </div>
        )
      })}
      <Junction x={G.BUS} y={G.IY} on={s >= 1} lit={hot === 0} />
      <Node x={G.IX} y={G.IY} label="IAM" size={G.IT} on={s >= 1} w={80} ts={14}>
        <MarkTile src={iamMark} size={G.IT} lit={hot === 3} />
        <Show on={revoked} style={{ position: 'absolute', right: -12, top: -12, width: 32, height: 32, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.7)', display: 'grid', placeItems: 'center', zIndex: 4 }}>
          <Ico3D name="eye" size={24} loop="pulse" t={2} />
        </Show>
      </Node>
      {/* 2 · an on-premises server joins through IAM Roles Anywhere */}
      <Node x={G.OPX} y={G.TY} label="On-Premises" size={G.ST} on={s >= 2} w={90}>
        <MarkTile src={dcMark} size={G.ST} lit={hot === 1} scale={0.56} />
      </Node>
      <Wire pts={G_OP} on={s >= 2} lit={hot === 1} head={9} delay={200} />
      <Node x={G.RAX} y={G.TY} label="Roles Anywhere" size={G.ST} on={s >= 2} delay={300} w={110}>
        <MarkTile src={raMark} size={G.ST} lit={hot === 1} />
      </Node>
      <Wire pts={G_RA} on={s >= 2} lit={hot === 1} head={10} delay={500} />
      <Token cls={G_RIDE.op} on={s >= 2} size={9} />
      <Token cls={G_RIDE.ra} on={s >= 2} size={9} />
      {/* 3 · a service in one account assumes a role in another */}
      {G_AX.map((x, i) => (
        <Show key={i} on={s >= 3} delay={i * 200} style={{ position: 'absolute', left: x, top: G.AY, width: G.AW, height: G.AH, zIndex: 2 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 14, border: `1.5px solid ${hot === 2 ? ORANGE : '#E7157B'}`, transition: `border-color 420ms ${EASE}` }} />
          <img src={acctMark} alt="" draggable={false} style={{ position: 'absolute', left: 0, top: 0, width: 24, height: 24, borderTopLeftRadius: 13, display: 'block' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            {i === 0 ? tile('gear', { size: 40, lit: hot === 2, loop: 'tilt' }) : <MarkTile src={roleMark} size={40} lit={hot === 2} />}
            <span style={tag(13)}>{i === 0 ? 'Service' : 'Role'}</span>
          </div>
        </Show>
      ))}
      <Wire pts={G_X} on={s >= 3} lit={hot === 2} head={9} delay={400} />
      <Token cls={G_RIDE.x} on={s >= 3} size={9} />
    </Frame>
  )
}

export const figures: Record<string, Fig> = { C_T11, C_T13, C_T14, C_T15, C_T16, C_T18 }

export const css = `
${K.css()}
@keyframes t14c-deny { 0%, 22%, 72%, 100% { opacity: 1; transform: scale(1) } 27% { opacity: 1; transform: scale(1.25) } 33% { opacity: 1; transform: scale(1) } 76%, 96% { opacity: 0; transform: scale(0.8) } }
.t14c-deny { animation: t14c-deny ${M_P}s ease-in-out infinite; }
@keyframes t14c-pass { 0%, 72%, 100% { opacity: 0; transform: scale(0.8) } 76% { opacity: 1; transform: scale(1.2) } 82%, 94% { opacity: 1; transform: scale(1) } }
.t14c-pass { animation: t14c-pass ${M_P}s ease-in-out infinite; }
@keyframes t14c-swapA { 0%, 40% { opacity: 1; transform: translateY(0) } 48%, 92% { opacity: 0; transform: translateY(-10px) } 100% { opacity: 1; transform: translateY(0) } }
@keyframes t14c-swapB { 0%, 40% { opacity: 0; transform: translateY(10px) } 48%, 92% { opacity: 1; transform: translateY(0) } 100% { opacity: 0; transform: translateY(10px) } }
.t14c-swapA { animation: t14c-swapA 4.4s cubic-bezier(0.45,0,0.55,1) infinite; }
.t14c-swapB { animation: t14c-swapB 4.4s cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes t14c-spin { 0% { transform: rotate(0deg) } 100% { transform: rotate(360deg) } }
.t14c-spin { animation: t14c-spin ${D_P}s linear infinite; transform-origin: 50% 50%; }
@keyframes t14c-inject { 0%, 12% { opacity: 0; transform: scale(0.6) } 26%, 86% { opacity: 1; transform: scale(1) } 100% { opacity: 0; transform: scale(0.6) } }
.t14c-inject { animation: t14c-inject ${D_P}s cubic-bezier(0.45,0,0.55,1) infinite; }
.cc-still .t14c-deny, .cc-still .t14c-pass, .cc-still .t14c-swapA, .cc-still .t14c-swapB, .cc-still .t14c-spin, .cc-still .t14c-inject,
.deck-thumb .t14c-deny, .deck-thumb .t14c-pass, .deck-thumb .t14c-swapA, .deck-thumb .t14c-swapB, .deck-thumb .t14c-spin, .deck-thumb .t14c-inject { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .t14c-deny, .t14c-pass, .t14c-swapA, .t14c-swapB, .t14c-spin, .t14c-inject { animation: none !important; } }
`
