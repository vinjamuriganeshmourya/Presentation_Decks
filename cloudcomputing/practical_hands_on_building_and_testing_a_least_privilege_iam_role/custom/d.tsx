import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Badge, type Loop } from '@/engine/icons3d'
import { EASE, FONT, ORANGE, Frame, Show, Plinth, MarkTile, Panel, Wire, Token, keyframes, loopCls, loopVars, tag, useHeld, useHot, type Pt } from '@/engine/figkit'
import ec2Mark from '../images/aws-ec2.svg'
import s3Mark from '../images/aws-s3.svg'
import lambdaMark from '../images/aws-lambda.svg'
import roleMark from '../images/res-iam-role.svg'
import accountMark from '../images/grp-aws-account.svg'
import ssoMark from '../images/aws-iam-identity-center.svg'

/*
 * BUILDER D · Session 14 IAM Roles & Least Privilege, Section 5 (Identity for AI Agents) and the practical's close:
 *   slide 36 D_T19  (546 x 330, 3 steps)  AI Agent -> token -> Cloud API; Scoped / Short-Lived / Revocable on the token
 *   slide 38 D_T20  (546 x 330, 4 steps)  two lanes: the broad-role agent reaches Delete, the scoped agent is blocked
 *   slide 48 D_P25E (566 x 380, 2 steps)  the ec2:* grant never attached; the trust relationship with sts:AssumeRole
 *   slide 49 D_P26  (546 x 330, 3 steps)  the finished role, cleanup in order, federation and AI agents Conceptual
 *
 * Session 13 visual standard (generate-slides correction 17): 3D icons and official marks on white plinth tiles,
 * >= 20 px equal padding, orthogonal wires computed from the same constants as the boxes, a flow dot on every wire,
 * a lit item that walks first -> last -> first after the build (useHot). Every loop is transform / opacity on an HTML
 * element or a root <svg>. Held (?still): the full final state, nothing lit, nothing moving.
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('t14d')
const PERIOD = 3 // seconds: flow dots and the walking highlight share one beat
const MONO = "'JetBrains Mono', ui-monospace, monospace"
const GREY = '#9FB3D6'
const ringOf = (lit: boolean, base: string) => (lit ? `inset 0 0 0 2.5px ${ORANGE}, 0 10px 22px -14px rgba(255,138,61,0.8)` : base)

/** a 3D icon (or an official mark) on its plinth with its tag under it; the TILE is centred on (x, y) */
function Node({ x, y, label, icon, mark, size = 56, k = 0.74, on = true, lit = false, warm = false, loop = 'bob', d = 0, t, badge, w = 120, tagW, tagSize = 14, dim = false }: { x: number; y: number; label?: string; icon?: Ico3DName; mark?: string; size?: number; k?: number; on?: boolean; lit?: boolean; warm?: boolean; loop?: Loop; d?: number; t?: number; badge?: Badge; w?: number; tagW?: number; tagSize?: number; dim?: boolean }) {
  const instant = useInstant()
  const tile = mark ? <MarkTile src={mark} size={size} lit={lit} /> : (
    <Plinth size={size} lit={lit} warm={warm}>
      <Ico3D name={icon ?? 'doc'} size={Math.round(size * k)} loop={loop} d={d} t={t} badge={badge} />
    </Plinth>
  )
  return (
    <Show on={on} style={{ position: 'absolute', left: x - w / 2, top: y - size / 2, width: w, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ opacity: dim ? 0.42 : 1, filter: dim ? 'grayscale(0.7)' : undefined, transition: instant ? 'none' : `opacity 520ms ${EASE}`, display: 'grid', placeItems: 'center' }}>{tile}</div>
      {label && <span style={{ ...tag(tagSize), ...(tagW ? { whiteSpace: 'normal', width: tagW } : {}) }}>{label}</span>}
    </Show>
  )
}

/** a small white disc laid on a tile's corner, holding a 3D icon or a mark */
function Corner({ x, y, on = true, size = 30, children }: { x: number; y: number; on?: boolean; size?: number; children: ReactNode }) {
  return (
    <Show on={on} lift={0} style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: 6 }}>
      <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6' }}>{children}</span>
    </Show>
  )
}

/** a dot carrying a mini 3D icon along a `ride` class */
function Rider({ cls, icon, size = 26, on = true }: { cls: string; icon: Ico3DName; size?: number; on?: boolean }) {
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

/** one line of policy JSON: the key in ink, the TR's value in blue (the only text highlight) */
const Code = ({ k, v, size = 13 }: { k: string; v: string; size?: number }) => (
  <div style={{ fontFamily: MONO, fontVariantLigatures: 'none', fontSize: size, lineHeight: 1.5, whiteSpace: 'nowrap', color: colors.ink, fontWeight: 500 }}>
    <span>"{k}": </span>
    <span style={{ color: colors.brand, fontWeight: 700 }}>"{v}"</span>
  </div>
)

/* ================================================================== slide 36 · D_T19 · scoped, short-lived, revocable */

/* AI Agent -> the token card -> one Cloud API tile (EC2); S3 and Lambda carry locks (scoped). The token card holds the
   token with its expiry clock, a session-window bar that drains each beat, and the three marks. Point 1 lights the
   reached API, 2 the draining clock, 3 cuts the wire between the token and the API. */
const A = { W: 546, H: 330, CY: 168, AX: 60, AS: 64, CL: 150, CR: 404, CT: 61, CH: 214, QX: 488, QS: 52 }
const A_API: { mark: string; label: string; y: number }[] = [
  { mark: s3Mark, label: 'S3', y: 88 },
  { mark: ec2Mark, label: 'EC2', y: 168 },
  { mark: lambdaMark, label: 'Lambda', y: 248 },
]
const A_MARK: { icon: Ico3DName; label: string; loop: Loop }[] = [
  { icon: 'target', label: 'Scoped', loop: 'pulse' },
  { icon: 'hourglass', label: 'Short-Lived', loop: 'swing' },
  { icon: 'ban', label: 'Revocable', loop: 'beat' },
]
const A_CUT = (A.CR + A.QX - A.QS / 2) / 2 // the middle of the token -> API wire
const A_W1: Pt[] = [[A.AX + A.AS / 2, A.CY], [A.CL, A.CY]]
const A_W2L: Pt[] = [[A.CR, A.CY], [A_CUT, A.CY]]
const A_W2R: Pt[] = [[A_CUT, A.CY], [A.QX - A.QS / 2, A.CY]]
const A_R1 = K.ride('a-1', [[A_W1[0][0] + 14, A.CY], [A.CL - 14, A.CY]], 0.1, 1.0, PERIOD)
const A_R2 = K.ride('a-2', [[A.CR + 14, A.CY], [A.QX - A.QS / 2 - 14, A.CY]], 1.35, 2.25, PERIOD)
const A_R2CUT = K.ride('a-2c', [[A.CR + 14, A.CY], [A_CUT - 20, A.CY]], 1.35, 1.8, PERIOD)

const D_T19: Fig = (p) => {
  const step = Number(p.step ?? 0)
  const held = useHeld()
  const instant = useInstant()
  const hot = useHot(3, step, PERIOD * 1000)
  const on = (i: number) => held || step >= i + 1
  const cut = hot === 2
  const tr = instant ? 'none' : `transform 520ms ${EASE}`
  const IW = A.CR - A.CL - 40
  return (
    <Frame w={A.W} h={A.H}>
      {/* wires: agent -> token, token -> EC2 (in two halves so the cut can open) */}
      <Wire pts={A_W1} head={9} />
      <div style={{ position: 'absolute', left: 0, top: 0, zIndex: 1, transform: cut ? 'translateX(-12px)' : 'none', transition: tr }}><Wire pts={A_W2L} head={0} lit={hot === 0} /></div>
      <div style={{ position: 'absolute', left: 0, top: 0, zIndex: 1, transform: cut ? 'translateX(12px)' : 'none', transition: tr }}><Wire pts={A_W2R} head={9} lit={hot === 0} /></div>
      <Corner x={A_CUT} y={A.CY} on={cut} size={28}><Ico3D name="ban" size={22} loop="beat" t={1.5} /></Corner>
      <Rider cls={A_R1} icon="token" />
      <Rider cls={cut ? A_R2CUT : A_R2} icon="token" key={cut ? 'c' : 'r'} />

      <Node x={A.AX} y={A.CY} label="AI Agent" icon="bot" size={A.AS} k={0.76} loop="bob" />

      {/* the token card */}
      <Panel x={A.CL} y={A.CT} w={A.CR - A.CL} h={A.CH} radius={18}>
        <div style={{ position: 'absolute', left: 20, top: 20, width: IW, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Plinth size={56}><Ico3D name="token" size={42} loop="glint" t={PERIOD} /></Plinth>
            {/* the small expiry clock on the token's corner */}
            <span style={{ position: 'absolute', right: -22, top: -8, display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 99, background: '#FFFFFF', boxShadow: ringOf(hot === 1, '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6'), transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
              <Ico3D name="clock" size={24} loop="beat" t={1} />
            </span>
          </div>
          <span style={{ ...tag(14), marginTop: 6 }}>Token</span>
          {/* the session window: drains every beat (the clock counts), restarts at once */}
          <div style={{ position: 'relative', width: IW, height: 8, marginTop: 12, borderRadius: 99, background: '#E8EEFB', boxShadow: `inset 0 0 0 1px ${colors.line}`, overflow: 'hidden' }}>
            <div className={held ? undefined : 't14d-drain'} style={{ position: 'absolute', inset: 0, borderRadius: 99, transformOrigin: '0 50%', background: hot === 1 ? `linear-gradient(90deg, #FFB37A, ${ORANGE})` : `linear-gradient(90deg, #8DB0FF, ${colors.brand})`, transition: instant ? 'none' : `background 420ms ${EASE}` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: IW, marginTop: 14 }}>
            {A_MARK.map((m, i) => (
              <Show key={m.label} on={on(i)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <Plinth size={40} lit={hot === i}><Ico3D name={m.icon} size={30} loop={m.loop} d={i * 0.4} /></Plinth>
                <span style={tag(13)}>{m.label}</span>
              </Show>
            ))}
          </div>
        </div>
      </Panel>

      {/* the Cloud API: three services, the token reaches EC2 only */}
      <div style={{ position: 'absolute', left: A.QX - 60, top: A_API[0].y - A.QS / 2 - 30, width: 120, ...tag(14, colors.ink) }}>Cloud API</div>
      {A_API.map((s, i) => (
        <div key={s.label}>
          <Node x={A.QX} y={s.y} label={s.label} mark={s.mark} size={A.QS} lit={hot === 0 && i === 1} w={100} />
          {i !== 1 && (
            <Corner x={A.QX + A.QS / 2 - 2} y={s.y - A.QS / 2 + 2} on={on(0)} size={26}>
              <Ico3D name="lock" size={20} loop="pulse" d={i * 0.6} t={2.4} />
            </Corner>
          )}
        </div>
      ))}
    </Frame>
  )
}

/* ================================================================== slide 38 · D_T20 · excessive agency */

/* two lanes, one above the other, sharing columns: Instruction -> agent -> Delete -> Production Data. The broad-role
   lane runs through to Delete; in the scoped lane the guard card (Scoped, Short-Lived, Revocable) stops the path at
   the same column. Point 4 puts the IAM Role mark on both agents and under them. */
const B = { W: 546, H: 330, S: 44, L1: 56, L2: 198, XC: 57, XA: 141, GL: 196, GR: 336, XD: 398, XP: 484, GH: 116, RY: 290 }
const B_GUARD = A_MARK
const B_W = (y: number) => ({
  in: [[B.XC + B.S / 2, y], [B.XA - B.S / 2, y]] as Pt[],
  act: [[B.XA + B.S / 2, y], [B.XD - B.S / 2, y]] as Pt[],
  hit: [[B.XD + B.S / 2, y], [B.XP - B.S / 2, y]] as Pt[],
  guard: [[B.XA + B.S / 2, y], [B.GL, y]] as Pt[],
  stub: [[B.GR, y], [B.XD - B.S / 2, y]] as Pt[],
})
const B1 = B_W(B.L1)
const B2 = B_W(B.L2)
/* the wide lane: one beat runs Instruction -> Agent -> Delete -> Data */
const B_R1 = K.ride('b-1', [[B1.in[0][0] + 8, B.L1], [B1.in[1][0] - 8, B.L1]], 0.05, 0.6, PERIOD)
const B_R2 = K.ride('b-2', [[B1.act[0][0] + 8, B.L1], [B1.act[1][0] - 8, B.L1]], 0.75, 1.9, PERIOD)
const B_R3 = K.ride('b-3', [[B1.hit[0][0] + 8, B.L1], [B1.hit[1][0] - 8, B.L1]], 2.0, 2.55, PERIOD)
/* the scoped lane: the same instruction, the same step, stopped at the guard */
const B_S1 = K.ride('b-s1', [[B2.in[0][0] + 8, B.L2], [B2.in[1][0] - 8, B.L2]], 0.05, 0.6, PERIOD)
const B_S2 = K.ride('b-s2', [[B2.guard[0][0] + 6, B.L2], [B.GL - 6, B.L2]], 0.75, 1.15, PERIOD, 0.4)

const D_T20: Fig = (p) => {
  const step = Number(p.step ?? 0)
  const held = useHeld()
  const instant = useInstant()
  const hot = useHot(4, step, PERIOD * 1000)
  const on = (i: number) => held || step >= i + 1
  const GT = B.L2 - B.GH / 2
  void instant
  return (
    <Frame w={B.W} h={B.H}>
      {/* the lane divider */}
      <div style={{ position: 'absolute', left: 20, right: 20, top: 129, height: 0, borderTop: `1.5px dashed ${colors.line}` }} />

      {/* lane 1: the broad role */}
      <Wire pts={B1.in} head={9} lit={hot === 0} />
      <Wire pts={B1.act} head={9} lit={hot === 1} />
      <Wire pts={B1.hit} head={9} lit={hot === 0} />
      <Token cls={B_R1} tone={ORANGE} />
      <Token cls={B_R2} tone={ORANGE} />
      <Token cls={B_R3} tone={ORANGE} />
      <Node x={B.XC} y={B.L1} label="Instruction" icon="chat" size={B.S} lit={hot === 0} badge="alert" loop="bob" />
      <Node x={B.XA} y={B.L1} label="Broad Role" icon="bot" size={B.S} k={0.78} lit={hot === 1} loop="pulse" />
      <Node x={B.XD} y={B.L1} label="Delete" icon="trash" size={B.S} warm lit={hot === 1} loop="beat" />
      <Node x={B.XP} y={B.L1} label="Production Data" icon="database" size={B.S} lit={hot === 0} badge={on(0) ? 'cross' : undefined} loop="bob" d={0.5} tagW={86} w={90} />

      {/* lane 2: the scoped agent, stopped at the same step */}
      <Wire pts={B2.in} head={9} />
      <Wire pts={B2.guard} head={8} on={on(2)} lit={hot === 2} />
      <Wire pts={B2.stub} head={0} on={on(2)} color={GREY} dash="4 5" />
      <Token cls={B_S1} />
      <Token cls={B_S2} on={on(2)} tone={hot === 2 ? ORANGE : colors.brand} />
      <Node x={B.XC} y={B.L2} label="Instruction" icon="chat" size={B.S} badge="alert" loop="bob" d={0.3} />
      <Node x={B.XA} y={B.L2} label="Scoped" icon="bot" size={B.S} k={0.78} loop="pulse" d={0.4} />
      <Node x={B.XD} y={B.L2} label="Delete" icon="trash" size={B.S} loop="none" dim={on(2)} />
      <Node x={B.XP} y={B.L2} label="Production Data" icon="database" size={B.S} loop="bob" d={0.9} badge={on(2) ? 'check' : undefined} tagW={86} w={90} />

      {/* the three guards */}
      <Panel x={B.GL} y={GT} w={B.GR - B.GL} h={B.GH} on={on(2)} lit={hot === 2} radius={16} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8, padding: '0 16px' }}>
        {B_GUARD.map((g, i) => (
          <div key={g.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Ico3D name={g.icon} size={26} loop={g.loop} d={i * 0.4} />
            <span style={{ ...tag(13, colors.ink), textAlign: 'left' }}>{g.label}</span>
          </div>
        ))}
      </Panel>

      {/* point 4: both agents are IAM roles */}
      <Corner x={B.XA + B.S / 2 - 2} y={B.L1 - B.S / 2 + 2} on={on(3)} size={26}><img src={roleMark} alt="" style={{ width: 18, height: 18 }} /></Corner>
      <Corner x={B.XA + B.S / 2 - 2} y={B.L2 - B.S / 2 + 2} on={on(3)} size={26}><img src={roleMark} alt="" style={{ width: 18, height: 18 }} /></Corner>
      <Show on={on(3)} style={{ position: 'absolute', left: B.XA - 20, top: B.RY - 20, height: 40, display: 'flex', alignItems: 'center', gap: 10, zIndex: 3 }}>
        <MarkTile src={roleMark} size={40} lit={hot === 3} />
        <span style={{ ...tag(14), textAlign: 'left' }}>IAM Role</span>
      </Show>
    </Frame>
  )
}

/* ================================================================== slide 48 · D_P25E · ec2:* never attached, the trust relationship */

/* two cards on the left, the role on the right. The broad grant's link to the role is broken (dashed, a broken-link
   mark, no arrowhead); the trust relationship names the trusted account and allows sts:AssumeRole, its arrow into
   the role. Point N lights its card. */
const C = { W: 566, H: 380, CX: 20, CW: 372, AY: 20, BY: 200, CH: 160, RX: 496, RY: 190, RS: 64, VX: 432 }
const C_A: Pt[] = [[C.CX + C.CW, C.AY + C.CH / 2], [C.VX, C.AY + C.CH / 2], [C.VX, C.RY - 10], [C.RX - C.RS / 2, C.RY - 10]]
const C_B: Pt[] = [[C.CX + C.CW, C.BY + C.CH / 2], [C.VX, C.BY + C.CH / 2], [C.VX, C.RY + 10], [C.RX - C.RS / 2, C.RY + 10]]
const C_RB = K.ride('c-b', [[C_B[0][0] + 8, C_B[0][1]], C_B[1], C_B[2], [C_B[3][0] - 10, C_B[3][1]]], 0.2, 2.2, PERIOD)
const C_BRK: Pt = [C.VX, (C_A[0][1] + C_A[2][1]) / 2]

function DocCard({ y, lit, on, head, children, left }: { y: number; lit: boolean; on: boolean; head: string; children: ReactNode; left: ReactNode }) {
  const instant = useInstant()
  return (
    <Panel x={C.CX} y={y} w={C.CW} h={C.CH} on={on} lit={lit} radius={18} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 20 }}>
      <div style={{ width: 78, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>{left}</div>
      {/* the policy document: a title strip and the JSON lines */}
      <div style={{ flex: 1, alignSelf: 'stretch', borderRadius: 14, background: 'linear-gradient(180deg, #F6F9FF 0%, #EDF3FF 100%)', boxShadow: `inset 0 0 0 1.5px ${colors.line}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderBottom: `1.5px solid ${colors.line}` }}>
          <Ico3D name="policy" size={24} loop="float" />
          <span style={{ ...tag(14, colors.ink), textAlign: 'left' }}>{head}</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 12px' }}>{children}</div>
      </div>
    </Panel>
  )
}

const D_P25E: Fig = (p) => {
  const step = Number(p.step ?? 0)
  const held = useHeld()
  const hot = useHot(2, step, PERIOD * 1000)
  const on = (i: number) => held || step >= i + 1
  return (
    <Frame w={C.W} h={C.H}>
      {/* the broad grant: never attached (dashed, broken, no head) */}
      <Wire pts={C_A} head={0} on={on(0)} color={GREY} dash="5 6" lit={hot === 0} />
      <Corner x={C_BRK[0]} y={C_BRK[1]} on={on(0)} size={34}><Ico3D name="link" size={26} loop="tilt" badge="cross" /></Corner>
      {/* the trust relationship: the trusted account assumes the role */}
      <Wire pts={C_B} head={9} on={on(1)} lit={hot === 1} />
      <Token cls={C_RB} on={on(1)} tone={hot === 1 ? ORANGE : colors.brand} />

      <DocCard y={C.AY} on={on(0)} lit={hot === 0} head="Policy" left={<>
        <Plinth size={56} warm><Ico3D name="asterisk" size={42} loop="spin" t={9} /></Plinth>
        <span style={{ ...tag(13), whiteSpace: 'normal' }}>Broad Grant</span>
      </>}>
        <Code k="Effect" v="Allow" />
        <Code k="Action" v="ec2:*" />
      </DocCard>

      <DocCard y={C.BY} on={on(1)} lit={hot === 1} head="Trust Relationship" left={<>
        <MarkTile src={accountMark} size={56} />
        <span style={{ ...tag(13), whiteSpace: 'normal', width: 76 }}>Trusted Account</span>
      </>}>
        <Code k="Effect" v="Allow" />
        <Code k="Action" v="sts:AssumeRole" />
      </DocCard>

      <Node x={C.RX} y={C.RY} label="IAM Role" mark={roleMark} size={C.RS} w={100} />
    </Frame>
  )
}

/* ================================================================== slide 49 · D_P26 · scope confirmed, then cleanup */

/* left: the finished role (three action rows); right: its policy, attached by a wire into the role. Point 1 lifts
   the role away first, point 2 the policy once detached, point 3 shows federation and AI agents greyed, Conceptual. */
const E = { W: 546, H: 330, RX: 20, RY: 55, RW: 250, RH: 240, PX: 310, PY: 40, PW: 216, PH: 110, QY: 170, QH: 140 }
const E_ROWS: { action: string; ok: boolean }[] = [
  { action: 'DescribeInstances', ok: true },
  { action: 'StartInstances', ok: true },
  { action: 'TerminateInstances', ok: false },
]
const E_WIRE: Pt[] = [[E.PX, E.PY + E.PH / 2], [E.RX + E.RW, E.PY + E.PH / 2]]
const E_RIDE = K.ride('e-w', [[E.PX - 8, E.PY + E.PH / 2], [E.RX + E.RW + 12, E.PY + E.PH / 2]], 0.3, 1.3, PERIOD)

function Lift({ x, y, w, h, gone, lit, lift, children }: { x: number; y: number; w: number; h: number; gone: boolean; lit: boolean; lift: number; children: ReactNode }) {
  const instant = useInstant()
  const tr = instant ? 'none' : `transform 620ms ${EASE}, opacity 620ms ${EASE}, box-shadow 420ms ${EASE}`
  /* held frame (?still / thumbnails): the cards stay at full strength with their trash badges, so the finished role still
   * reads; the lift-and-fade is the live cleanup motion only (lead's correction, 2026-11-17) */
  const fade = gone && !instant
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, zIndex: 2, transform: fade ? `translateY(${-lift}px)` : 'none', transition: tr }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 18, background: 'linear-gradient(180deg, #FFFFFF 0%, #ECF2FD 100%)', boxShadow: 'inset 0 0 0 1px #CFDCF5, 0 12px 24px -16px rgba(31,64,140,0.34)', opacity: fade ? 0.6 : 1, transition: tr }} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: 18, zIndex: 1, pointerEvents: 'none', boxShadow: lit ? `0 0 0 2.5px ${ORANGE}, 0 10px 22px -14px rgba(255,138,61,0.8)` : 'none', transition: tr }} />
      <div style={{ position: 'absolute', inset: 0, opacity: fade ? 0.55 : 1, transition: tr }}>{children}</div>
      <Corner x={w - 4} y={4} on={gone} size={32}><Ico3D name="trash" size={24} loop="beat" t={2.4} /></Corner>
    </div>
  )
}

const D_P26: Fig = (p) => {
  const step = Number(p.step ?? 0)
  const held = useHeld()
  const hot = useHot(3, step, PERIOD * 1000)
  const on = (i: number) => held || step >= i + 1
  const roleGone = on(0)
  const policyGone = on(1)
  return (
    <Frame w={E.W} h={E.H}>
      {/* the policy is attached to the role until the role is deleted */}
      <Wire pts={E_WIRE} head={9} on={!roleGone} />
      <Token cls={E_RIDE} on={!roleGone} />

      {/* the finished role */}
      <Lift x={E.RX} y={E.RY} w={E.RW} h={E.RH} gone={roleGone} lit={hot === 0} lift={12}>
        <div style={{ position: 'absolute', left: 20, top: 20, right: 20, display: 'flex', alignItems: 'center', gap: 10, height: 40 }}>
          <MarkTile src={roleMark} size={40} />
          <span style={{ ...tag(14, colors.ink), textAlign: 'left' }}>S14-EC2-Demo-Role</span>
        </div>
        <div style={{ position: 'absolute', left: 20, right: 20, top: 76, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {E_ROWS.map((r, i) => (
            <div key={r.action} style={{ position: 'relative', height: 40, borderRadius: 12, background: '#FFFFFF', boxShadow: `inset 0 0 0 1.5px ${colors.line}`, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', overflow: 'hidden' }}>
              {r.ok && !held && <span aria-hidden className="t14d-glint" style={{ animationDelay: `${i * 0.6}s` }} />}
              <Ico3D name={r.ok ? 'check' : 'cross'} size={26} loop={r.ok ? 'pulse' : 'none'} d={i * 0.5} style={{ position: 'relative' }} />
              <span style={{ position: 'relative', fontFamily: MONO, fontVariantLigatures: 'none', fontSize: 13, fontWeight: 600, color: colors.ink, whiteSpace: 'nowrap' }}>{r.action}</span>
            </div>
          ))}
        </div>
      </Lift>

      {/* its policy */}
      <Lift x={E.PX} y={E.PY} w={E.PW} h={E.PH} gone={policyGone} lit={hot === 1} lift={6}>
        <div style={{ position: 'absolute', inset: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Plinth size={44}><Ico3D name="policy" size={33} loop="float" /></Plinth>
          <span style={{ fontFamily: MONO, fontVariantLigatures: 'none', fontSize: 13, fontWeight: 600, color: colors.ink, whiteSpace: 'nowrap' }}>S14-EC2-ReadOnly-Demo</span>
        </div>
      </Lift>

      {/* federation and AI agents: conceptual in this session */}
      <Show on={on(2)} style={{ position: 'absolute', left: E.PX, top: E.QY, width: E.PW, height: E.QH, zIndex: 2 }}>
        <ConceptBox lit={hot === 2} />
      </Show>
    </Frame>
  )
}

function ConceptBox({ lit }: { lit: boolean }) {
  const instant = useInstant()
  const grey: CSSProperties = { filter: 'grayscale(0.85)', opacity: 0.55 }
  return (
    <div style={{ position: 'absolute', inset: 0, borderRadius: 18, border: `1.5px dashed ${GREY}`, boxShadow: lit ? `0 0 0 2.5px ${ORANGE}` : 'none', transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 18, ...tag(14, colors.muted) }}>Conceptual</div>
      <div style={{ position: 'absolute', left: 20, right: 20, top: 48, display: 'flex', justifyContent: 'space-around' }}>
        {[{ label: 'Federation', node: <MarkTile src={ssoMark} size={52} /> }, { label: 'AI Agent', node: <Plinth size={52}><Ico3D name="bot" size={40} loop="bob" /></Plinth> }].map((t) => (
          <div key={t.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={grey}>{t.node}</div>
            <span style={{ ...tag(13, colors.muted) }}>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ================================================================== slide 40 · D_P21 · what the practical builds */

/* The six practical steps as a track of white step cards, three per row, in TR order: each card holds its 3D icon (the
   role step its official mark) on a plinth beside the TR step text (a narrow text column). Orthogonal wires carry a flow
   dot card to card; row 1 turns down into row 2 through the row gap. Each press brings in the next card and its wire;
   after the build the lit card walks 1 -> 6 -> 1. Held: all six cards, nothing lit, no dots. */
const PR = { W: 1080, H: 344, CW: 306, CH: 132, X: [20, 387, 754], Y: [20, 192], TS: 56, T: 5 }
const PR_GAPY = PR.Y[0] + PR.CH + (PR.Y[1] - PR.Y[0] - PR.CH) / 2 // the middle of the row gap
const PR_STEPS: { text: string; icon?: Ico3DName; mark?: string; loop: Loop }[] = [
  { text: 'Explore existing IAM policies, users and roles in the console', icon: 'search', loop: 'swing' },
  { text: 'Write a custom policy allowing only EC2 describe access', icon: 'policy', loop: 'float' },
  { text: 'Create a role and attach that custom policy to it', mark: roleMark, loop: 'none' },
  { text: 'Record Allowed and Denied results for all three actions first', icon: 'checklist', loop: 'bob' },
  { text: 'Add the missing permission and retest to confirm the fix', icon: 'plus', loop: 'pulse' },
  { text: 'Discuss an over-permissive policy, trust relationships and cleanup', icon: 'chat', loop: 'beat' },
]
const prBox = (i: number) => ({ x: PR.X[i % 3], y: PR.Y[Math.floor(i / 3)] })
/* wire i leads INTO card i + 1 */
const PR_WIRES: Pt[][] = [0, 1, 2, 3, 4].map((i) => {
  const a = prBox(i)
  const b = prBox(i + 1)
  if (i === 2) return [[a.x + PR.CW / 2, a.y + PR.CH], [a.x + PR.CW / 2, PR_GAPY], [b.x + PR.CW / 2, PR_GAPY], [b.x + PR.CW / 2, b.y]]
  const cy = a.y + PR.CH / 2
  return [[a.x + PR.CW, cy], [b.x, cy]]
})
const PR_SLOT: [number, number][] = [[0.1, 0.7], [0.85, 1.45], [1.6, 2.9], [3.05, 3.65], [3.8, 4.4]]
const PR_RIDE = PR_WIRES.map((pts, i) => {
  const L = pts.length
  const tip = pts[L - 1]
  const prev = pts[L - 2]
  const back: Pt = prev[0] === tip[0] ? [tip[0], tip[1] - 12] : [tip[0] - 12, tip[1]]
  return K.ride(`p21-${i}`, [...pts.slice(0, -1), back], PR_SLOT[i][0], PR_SLOT[i][1], PR.T)
})

const D_P21: Fig = (p) => {
  const step = Number(p.step ?? 0)
  const held = useHeld()
  const hot = useHot(6, step, 2000)
  const on = (i: number) => held || step >= i + 1
  return (
    <Frame w={PR.W} h={PR.H}>
      {PR_WIRES.map((pts, i) => (
        <Wire key={`w${i}`} pts={pts} head={9} on={on(i + 1)} lit={hot === i + 1} />
      ))}
      {PR_RIDE.map((cls, i) => (
        <Token key={`t${i}`} cls={cls} on={step >= 6} />
      ))}
      {PR_STEPS.map((s, i) => {
        const b = prBox(i)
        return (
          <Panel key={s.text} x={b.x} y={b.y} w={PR.CW} h={PR.CH} on={on(i)} lit={hot === i} radius={18}>
            <div style={{ position: 'absolute', inset: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
              {s.mark ? (
                <MarkTile src={s.mark} size={PR.TS} />
              ) : (
                <Plinth size={PR.TS}><Ico3D name={s.icon ?? 'doc'} size={42} loop={s.loop} d={i * 0.4} /></Plinth>
              )}
              <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 16, lineHeight: 1.36, color: colors.ink }}>{s.text}</span>
            </div>
          </Panel>
        )
      })}
    </Frame>
  )
}

void FONT
void loopCls
void loopVars

export const figures: Record<string, Fig> = { D_T19, D_T20, D_P25E, D_P26, D_P21 }
export const css = `
${K.css()}
@keyframes t14d-drain { 0% { transform: scaleX(1) } 100% { transform: scaleX(0) } }
.t14d-drain { animation: t14d-drain ${PERIOD}s linear infinite; }
@keyframes t14d-glint { 0%, 55% { transform: translateX(-60px); opacity: 0 } 62% { opacity: 1 } 90% { opacity: 1 } 100% { transform: translateX(260px); opacity: 0 } }
.t14d-glint { position: absolute; left: 0; top: 0; bottom: 0; width: 48px; pointer-events: none; background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(214,227,255,0.95) 50%, rgba(255,255,255,0) 100%); animation: t14d-glint 2.6s ease-in-out infinite; opacity: 0; }
.cc-still [class*="t14d-"], .deck-thumb [class*="t14d-"] { animation: none !important; }
.cc-still .t14d-glint, .deck-thumb .t14d-glint, .cc-still [class*="t14d-a-"], .cc-still [class*="t14d-b-"], .cc-still [class*="t14d-c-"], .cc-still [class*="t14d-e-"], .cc-still [class*="t14d-p21-"] { opacity: 0 !important; }
@media (prefers-reduced-motion: reduce) { [class*="t14d-"] { animation: none !important; } }
`
