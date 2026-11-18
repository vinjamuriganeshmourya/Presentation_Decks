import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Badge, type Loop } from '@/engine/icons3d'
import { EASE, FONT, ORANGE, Frame, Show, Plinth, MarkTile, Panel, Wire, Junction, Token, keyframes, loopCls, loopVars, tag, heading, useHeld, useHot, type Pt } from '@/engine/figkit'
import kmsMark from '../images/aws-kms.svg'
import s3Mark from '../images/aws-s3.svg'
import ebsMark from '../images/aws-ebs.svg'
import rdsMark from '../images/aws-rds.svg'
import trailMark from '../images/aws-cloudtrail.svg'
import hsmMark from '../images/aws-cloudhsm.svg'
import bucketMark from '../images/res-s3-bucket.svg'
import dekMark from '../images/res-iam-data-encryption-key.svg'
import encMark from '../images/res-iam-encrypted-data.svg'
import xksMark from '../images/res-kms-external-key-store.svg'

/*
 * SESSION 15 · SECTION 5 (Key Management) technical figures, builder D.
 * Built to generate-slides standing correction 17 (Sessions 13, 14, 16): 3D icons on plinth tiles, official marks on
 * white tiles, >= 20 px equal padding, orthogonal wires computed from the same constants as the boxes, a flow dot on
 * every wire, a lit item walking first -> last -> first after the build. Loops are transform / opacity on HTML elements
 * (or a root svg) only. Held (?still): the full final state, nothing lit, nothing moving. Class prefix `t15d-`.
 *
 *   slide 34 D_T20   546 x 330  Application -> KMS card (vault, AWS / Customer keys, data key, rotation / HSM / import) -> S3, EBS, RDS (4)
 *   slide 35 D_T21   546 x 330  drawn KMS key list; key policy; wires to S3, EBS, RDS; the key's boundary; CloudTrail log (4)
 *   slide 38 D_T22B 1080 x 420  AWS-Owned and Customer KMS Key padlocks feeding one S3 bucket; the customer's controls (2)
 *   slide 39 D_T23   546 x 330  envelope encryption: KMS key -> data key + encrypted copy; the 2 GB file encrypted locally (3)
 *   slide 40 D_T23   546 x 330 in 566 x 380, from 3: stored alongside, the decrypt round trip (2)
 *   slide 41 D_T24   546 x 330  yearly rotation timeline, older versions on a key ring opening earlier data (2)
 *   slide 42 D_T24B  526 x 340  the HSM box with the key that never leaves; CloudHSM single-tenant rack (2)
 *   slide 43 D_T25   546 x 330  on-premises HSM -> import token (+ wrapping key) -> KMS vault (2)
 *   slide 44 D_T25B  526 x 340  imported key with key policy and a hand-turned rotation dial; deletion, request bounces (2)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('t15d')
const BLUE = colors.brand
const MONO = "'JetBrains Mono', ui-monospace, monospace"
const NOLIG: CSSProperties = { fontVariantLigatures: 'none', fontFeatureSettings: "'liga' 0, 'calt' 0" }
const RIM = 'inset 0 0 0 1.5px #D3DEF6, 0 10px 20px -12px rgba(31,64,140,0.5)'
const LIT = `inset 0 0 0 2.5px ${ORANGE}, 0 10px 22px -12px rgba(255,138,61,0.7)`

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)
const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })
const cv = (name: string, v: string) => ({ [name]: v }) as CSSProperties

/** the build of a figure that may be split over two slides (`from`): the global step, the lit item, held */
function useBuild(p: Record<string, unknown>, period: number) {
  const off = Number(p.from ?? 0)
  const cnt = Number(p.steps ?? 1)
  const held = useHeld()
  const step = held ? off + cnt : stepOf(p) + off
  const local = useHot(cnt, stepOf(p), period)
  const hot = local < 0 ? -1 : local + off
  return { step, hot, held, s: (n: number) => step >= n, live: !held }
}

/** a 3D icon (or an official mark) on its plinth with its tag under (or above) it; the TILE is centred on (x, y) */
function Node({ x, y, label, icon, mark, size = 52, k = 0.74, on = true, lit = false, warm = false, loop = 'bob', d = 0, t, badge, w = 120, tagSize = 13.5, dim = false, up = false, delay = 0, z = 3, wrap, children }: { x: number; y: number; label?: string; icon?: Ico3DName; mark?: string; size?: number; k?: number; on?: boolean; lit?: boolean; warm?: boolean; loop?: Loop; d?: number; t?: number; badge?: Badge; w?: number; tagSize?: number; dim?: boolean; up?: boolean; delay?: number; z?: number; wrap?: number; children?: ReactNode }) {
  const instant = useInstant()
  const tile = mark ? <MarkTile src={mark} size={size} lit={lit} /> : (
    <Plinth size={size} lit={lit} warm={warm}>
      <Ico3D name={icon ?? 'doc'} size={Math.round(size * k)} loop={loop} d={d} t={t} badge={badge} />
    </Plinth>
  )
  const lab = label ? <span style={{ ...tag(tagSize), ...(wrap ? { whiteSpace: 'normal', width: wrap } : {}), [up ? 'marginBottom' : 'marginTop']: 6 }}>{label}</span> : null
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, width: w, zIndex: z, display: 'flex', flexDirection: up ? 'column-reverse' : 'column', alignItems: 'center', ...(up ? { bottom: `calc(100% - ${y + size / 2}px)` } : { top: y - size / 2 }) }}>
      <div style={{ position: 'relative', width: size, height: size, display: 'grid', placeItems: 'center', opacity: dim ? 0.4 : 1, filter: dim ? 'grayscale(1)' : undefined, transition: instant ? 'none' : `opacity 520ms ${EASE}, filter 520ms ${EASE}` }}>
        {tile}
        {children}
      </div>
      {lab}
    </Show>
  )
}

/** a small white disc on a tile's corner holding a 3D icon (or a mark); centred on (x, y) of the frame */
function Corner({ x, y, on = true, size = 28, icon, mark, loop = 'beat', d = 0 }: { x: number; y: number; on?: boolean; size?: number; icon?: Ico3DName; mark?: string; loop?: Loop; d?: number }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: 6, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6', display: 'grid', placeItems: 'center', opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}` }}>
      {mark ? <img src={mark} alt="" aria-hidden draggable={false} style={{ width: size - 9, height: size - 9, display: 'block' }} /> : <Ico3D name={icon ?? 'check'} size={size - 7} loop={loop} d={d} t={2.4} />}
    </span>
  )
}

/** a white disc carrying a mini 3D icon along a `ride` class (placed from the frame's 0,0); nothing on held frames */
function Rider({ cls, icon, size = 24, on = true, tone }: { cls: string; icon: Ico3DName; size?: number; on?: boolean; tone?: string }) {
  const held = useHeld()
  if (held || !on) return null
  return (
    <span aria-hidden style={{ position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, zIndex: 7, pointerEvents: 'none' }}>
      <span className={cls} style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: tone ? `0 0 0 2.5px ${tone}, 0 4px 10px -4px rgba(31,64,140,0.55)` : '0 4px 10px -4px rgba(31,64,140,0.55)', opacity: 0 }}>
        <Ico3D name={icon} size={size - 6} loop="none" />
      </span>
    </span>
  )
}

/** a wire on its own layer above the cards (a Panel is z 2 and would hide a wire drawn inside it); tiles (z 3) stay on top */
const W = (props: Parameters<typeof Wire>[0]) => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}><Wire {...props} /></div>
)

/** a card title row: an official mark (or a 3D icon) and the heading beside it, the row's left edge at x, centred on y */
function TitleRow({ x, y, mark, icon, text, size = 34 }: { x: number; y: number; mark?: string; icon?: Ico3DName; text: string; size?: number }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y - size / 2, height: size, display: 'flex', alignItems: 'center', gap: 10, zIndex: 3 }}>
      {mark ? <MarkTile src={mark} size={size} /> : <Plinth size={size}><Ico3D name={icon ?? 'doc'} size={Math.round(size * 0.74)} loop="bob" /></Plinth>}
      <span style={{ ...heading(16), whiteSpace: 'nowrap' }}>{text}</span>
    </div>
  )
}

/* ================================================================== slide 34 · D_T20 · the key management landscape */

/*
 * 546 x 330. Application (58, 104) sends to the KMS card (x 132..372, y 20..310); the data key comes back wrapped to the
 * envelope tile (58, 226). Inside the card: the title row, the vault (252, 140) with the AWS and Customer keys either
 * side (182 / 322), and the row of rotation, HSM and import (y 246). The card's right edge (372, 165) fans out at a
 * junction (412) to S3, EBS and RDS (x 482; y 70, 165, 260). Press 1 the vault and its key, 2 the two key owners,
 * 3 the wrapped data key, 4 rotation / HSM / import.
 */
const A = { W: 546, H: 330, AX: 58, AY: 104, EY: 226, NS: 52, KX: 132, KR: 372, KY: 20, KH: 290, J: 412, SX: 482, TY: 165, VX: 252, VY: 140, VS: 72, RY: 246, PER: 3.2 }
const A_SY = [70, 165, 260]
const A_SVC: { mark: string; label: string }[] = [{ mark: s3Mark, label: 'S3' }, { mark: ebsMark, label: 'EBS' }, { mark: rdsMark, label: 'RDS' }]
const aBranch = (y: number): Pt[] => (y === A.TY ? [[A.J, y], [A.SX - A.NS / 2, y]] : [[A.J, A.TY], [A.J, y], [A.SX - A.NS / 2, y]])
const A_KEYS = A_SY.map((y, i) => K.ride(`t20k${i}`, [[A.KR, A.TY], ...aBranch(y)], 0.2 + i * 0.9, 1.3 + i * 0.9, A.PER))
const A_REQ = K.ride('t20q', [[A.AX + A.NS / 2, A.AY], [A.KX, A.AY]], 0.1, 0.8, A.PER)
const A_RET = K.ride('t20e', [[A.KX, A.EY], [A.AX + A.NS / 2, A.EY]], 1.4, 2.2, A.PER)
const A_ROW: { x: number; icon: Ico3DName; label: string; loop: Loop }[] = [
  { x: 196, icon: 'refresh', label: 'Rotation', loop: 'spin' },
  { x: 252, icon: 'hsm', label: 'HSM', loop: 'pulse' },
  { x: 308, icon: 'upload', label: 'Import', loop: 'bob' },
]

const D_T20: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 4 }, 1700)
  return (
    <Frame w={A.W} h={A.H}>
      <Panel x={A.KX} y={A.KY} w={A.KR - A.KX} h={A.KH} />
      <TitleRow x={A.KX + 20} y={58} mark={kmsMark} text="KMS" size={36} />

      {/* the application asks, the wrapped data key comes back */}
      <W pts={[[A.AX + A.NS / 2, A.AY], [A.KX, A.AY]]} lit={hot === 0} head={9} />
      <W pts={[[A.KX, A.EY], [A.AX + A.NS / 2, A.EY]]} on={s(3)} lit={hot === 2} head={9} />
      <Node x={A.AX} y={A.AY} icon="webpage" label="Application" lit={hot === 0} d={0.2} />
      <Node x={A.AX} y={A.EY} icon="envelope" label="Data Key" on={s(3)} lit={hot === 2} loop="float" d={0.5} />

      {/* the vault and the key it creates and holds */}
      <Node x={A.VX} y={A.VY} icon="vault" size={A.VS} label="Vault" lit={hot === 0} loop="pulse" t={3} />
      <Corner x={A.VX + A.VS / 2 - 4} y={A.VY - A.VS / 2 + 6} icon="key" on={s(1)} loop="tilt" />
      <Node x={182} y={A.VY} icon="key" size={36} w={70} label="AWS" tagSize={12.5} on={s(2)} lit={hot === 1} loop="tilt" d={0.3} />
      <Node x={322} y={A.VY} icon="key" size={36} w={70} label="Customer" tagSize={12.5} on={s(2)} lit={hot === 1} loop="tilt" d={0.9} delay={120} />

      {/* rotation, hardware custody, imported key material */}
      {A_ROW.map((r, i) => (
        <Node key={r.label} x={r.x} y={A.RY} icon={r.icon} size={36} w={64} label={r.label} tagSize={12.5} on={s(4)} lit={hot === 3} loop={r.loop} t={r.loop === 'spin' ? 6 : undefined} d={i * 0.4} delay={i * 120} />
      ))}

      {/* out to the storage services */}
      <W pts={[[A.KR, A.TY], [A.J, A.TY]]} head={0} />
      {A_SY.map((y) => <W key={y} pts={aBranch(y)} />)}
      <Junction x={A.J} y={A.TY} />
      {A_SY.map((y, i) => <Node key={y} x={A.SX} y={y} mark={A_SVC[i].mark} label={A_SVC[i].label} w={80} />)}

      <Token cls={A_REQ} />
      <Rider cls={A_RET} icon="envelope" on={s(3)} size={22} />
      {A_KEYS.map((c, i) => <Rider key={i} cls={c} icon="key" on={s(1)} size={22} />)}
    </Frame>
  )
}

/* ================================================================== slide 35 · D_T21 · the KMS key list */

/*
 * 546 x 330. The console panel full width on top (x 20..526, y 20..118): title bar, the Alias / Key ID / Rotation header
 * and one key row (alias blurred, the TR's key ID, rotation Enabled). Below: the Key Policy (60, 196) wired up into the
 * row; the boundary (x 112..262, y 138..310) round the key material (187, 222); a junction (296) fanning the results out
 * to S3, EBS, RDS (x 352; y 158, 222, 286, tags to the right); CloudTrail (482, 166) fed from the panel, its log card
 * under it (x 438..526, y 220..310) adding a line per use.
 */
const B = { W: 546, H: 330, PX: 20, PY: 20, PW: 506, TB: 32, HR: 26, RR: 40, KX: 187, KY: 222, KS: 56, BX0: 112, BX1: 262, BY0: 138, BY1: 310, J: 296, SX: 352, SS: 44, CX: 482, CY: 166, CS: 44, LX: 438, LY: 222, LW: 88, LH: 88, PO: 60, POY: 196, PER: 3.2 }
const B_PB = B.PY + B.TB + B.HR + B.RR // 118, the panel's bottom
const B_SY = [158, 222, 286]
const B_COL = [{ x: 34, w: 104 }, { x: 146, w: 274 }, { x: 428, w: 84 }]
const bBranch = (y: number): Pt[] => (y === B.KY ? [[B.J, y], [B.SX - B.SS / 2, y]] : [[B.J, B.KY], [B.J, y], [B.SX - B.SS / 2, y]])
const B_OUT = B_SY.map((y, i) => K.ride(`t21o${i}`, [[B.KX + B.KS / 2, B.KY], ...bBranch(y)], 0.1 + i * 1.0, 1.1 + i * 1.0, B.PER))
const B_POL = K.ride('t21p', [[B.PO, B.POY - 22], [B.PO, B_PB]], 0.2, 0.9, B.PER)
const B_LOG = K.ride('t21l', [[B.CX, B_PB], [B.CX, B.CY - B.CS / 2]], 0.4, 0.8, 0.8)
const KEY_ID = '1a2b3c4d-5e6f-7890-abcd-ef1234567890'

function KmsConsole({ lit }: { lit: boolean }) {
  const instant = useInstant()
  const head: CSSProperties = { ...tag(12, colors.muted), textAlign: 'left', fontWeight: 700, letterSpacing: 0.2 }
  return (
    <div data-fk="card" style={{ ...box(B.PX, B.PY, B.PW, B_PB - B.PY), zIndex: 3, borderRadius: 14, background: '#FFFFFF', boxShadow: lit ? LIT : RIM, overflow: 'hidden', transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
      <div style={{ height: B.TB, background: `linear-gradient(180deg, ${colors.brandDeep} 0%, ${colors.night2} 100%)`, display: 'flex', alignItems: 'center', gap: 9, paddingLeft: 12 }}>
        <span style={{ display: 'grid', placeItems: 'center', width: 22, height: 22, borderRadius: 6, background: '#FFFFFF' }}>
          <img src={kmsMark} alt="" aria-hidden draggable={false} style={{ width: 17, height: 17, display: 'block' }} />
        </span>
        <span style={{ ...tag(13, '#FFFFFF'), fontWeight: 700 }}>Key Management Service</span>
      </div>
      <div style={{ position: 'relative', height: B.HR, background: colors.surface, borderBottom: `1px solid ${colors.line}` }}>
        {['Alias', 'Key ID', 'Rotation'].map((h, i) => (
          <span key={h} style={{ ...head, position: 'absolute', left: B_COL[i].x - B.PX, top: 6 }}>{h}</span>
        ))}
      </div>
      <div style={{ position: 'relative', height: B.RR }}>
        {/* the alias: the TR gives none, so it is blurred as a capture would be (rule 53) */}
        <span aria-hidden style={{ position: 'absolute', left: B_COL[0].x - B.PX, top: 13, width: 86, height: 14, borderRadius: 7, background: '#C3CEE0', filter: 'blur(2.5px)' }} />
        <span data-keyid style={{ position: 'absolute', left: B_COL[1].x - B.PX, top: 11, fontFamily: MONO, ...NOLIG, fontSize: 12, fontWeight: 600, lineHeight: '18px', color: colors.ink, whiteSpace: 'nowrap' }}>{KEY_ID}</span>
        <span style={{ position: 'absolute', left: B_COL[2].x - B.PX, top: 9, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Ico3D name="check" size={20} loop="pulse" t={2.6} />
          <span style={{ ...tag(13, colors.ink), fontWeight: 600 }}>Enabled</span>
        </span>
      </div>
    </div>
  )
}

/** CloudTrail's log card: one line per key use; the lines add in turn on the loop, all shown when held */
function LogCard({ on, lit, live }: { on: boolean; lit: boolean; live: boolean }) {
  const instant = useInstant()
  const widths = [40, 30, 47, 36]
  return (
    <Show on={on} delay={120} style={{ ...box(B.LX, B.LY, B.LW, B.LH), zIndex: 3 }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 12, background: '#FFFFFF', boxShadow: lit ? LIT : RIM, transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }} />
      {widths.map((w, i) => (
        <span key={i} className={live ? `t15d-l t15d-log${i}` : undefined} style={{ position: 'absolute', left: 14, top: 14 + i * 16, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: BLUE }} />
          <span style={{ width: w, height: 6, borderRadius: 3, background: '#BFD0F5' }} />
        </span>
      ))}
    </Show>
  )
}

const D_T21: Fig = (p) => {
  const { hot, s, live } = useBuild({ ...p, steps: p.steps ?? 4 }, 1700)
  const instant = useInstant()
  return (
    <Frame w={B.W} h={B.H}>
      <KmsConsole lit={false} />

      {/* point 1: the key policy governs the key in the row */}
      <W pts={[[B.PO, B.POY - 22], [B.PO, B_PB]]} on={s(1)} lit={hot === 0} head={9} />
      <Node x={B.PO} y={B.POY} icon="policy" size={44} w={90} label="Key Policy" on={s(1)} lit={hot === 0} d={0.2} />

      {/* point 3: the boundary the key material never leaves */}
      <Show on={s(3)} style={{ ...box(B.BX0, B.BY0, B.BX1 - B.BX0, B.BY1 - B.BY0), zIndex: 2 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 18, background: 'rgba(45,99,251,0.05)', border: `2px dashed ${hot === 2 ? ORANGE : '#9DB6EE'}`, transition: instant ? 'none' : `border-color 420ms ${EASE}` }} />
        <span style={{ position: 'absolute', left: 0, right: 0, top: 14, ...tag(12.5, colors.brandDark) }}>Boundary</span>
      </Show>
      <Node x={B.KX} y={B.KY} icon="key" size={B.KS} w={110} label="Key Material" tagSize={12.5} lit={hot === 2} loop="tilt">
        <span aria-hidden className={loopCls('halo')} style={{ position: 'absolute', inset: -8, borderRadius: 24, background: `radial-gradient(closest-side, ${BLUE}33, ${BLUE}00)`, zIndex: -1, ...loopVars(0, 2.8) }} />
      </Node>

      {/* point 2: S3, EBS and RDS use it; only results leave */}
      <W pts={[[B.KX + B.KS / 2, B.KY], [B.J, B.KY]]} on={s(2)} head={0} lit={hot === 1} />
      {B_SY.map((y) => <W key={y} pts={bBranch(y)} on={s(2)} lit={hot === 1} delay={150} />)}
      <Junction x={B.J} y={B.KY} on={s(2)} lit={hot === 1} />
      {B_SY.map((y, i) => (
        <Show key={y} on={s(2)} delay={i * 120} style={{ position: 'absolute', left: B.SX - B.SS / 2, top: y - B.SS / 2, height: B.SS, display: 'flex', alignItems: 'center', gap: 8, zIndex: 3 }}>
          <MarkTile src={A_SVC[i].mark} size={B.SS} lit={hot === 1} />
          <span style={tag(13.5)}>{A_SVC[i].label}</span>
        </Show>
      ))}

      {/* point 4: every use written to CloudTrail */}
      <W pts={[[B.CX, B_PB], [B.CX, B.CY - B.CS / 2]]} on={s(4)} lit={hot === 3} head={8} />
      <Node x={B.CX} y={B.CY} mark={trailMark} size={B.CS} w={96} label="CloudTrail" tagSize={12.5} on={s(4)} lit={hot === 3} />
      <LogCard on={s(4)} lit={hot === 3} live={live} />

      <Token cls={B_POL} on={s(1)} size={9} />
      {B_OUT.map((c, i) => <Rider key={i} cls={c} icon="doc" size={22} on={s(2)} />)}
      <Token cls={B_LOG} on={s(4)} size={8} />
    </Frame>
  )
}

/* ================================================================== slide 38 · D_T22B · two padlocks, one bucket */

/*
 * 1080 x 420. AWS-Owned card (x 140..440) and Customer KMS Key card (x 640..940), y 20..250; the S3 bucket (540, 330).
 * Each card's bottom centre drops to y 330 and turns into the bucket's side. The customer card's lower row carries
 * Rotation, Disable and Key Policy (x 710 / 790 / 870); the AWS card has three empty slots in their place.
 */
const C = { W: 1080, H: 420, AX: 140, CX: 640, CW: 300, Y: 20, CH: 230, LY: 92, LS: 92, RY: 194, BX: 540, BY: 330, BS: 84, PER: 3.4 }
const C_AC = C.AX + C.CW / 2
const C_CC = C.CX + C.CW / 2
const C_CB = C.Y + C.CH
const C_WA: Pt[] = [[C_AC, C_CB], [C_AC, C.BY], [C.BX - C.BS / 2, C.BY]]
const C_WC: Pt[] = [[C_CC, C_CB], [C_CC, C.BY], [C.BX + C.BS / 2, C.BY]]
const C_RA = K.ride('t22a', C_WA, 0.1, 1.5, C.PER)
const C_RC = K.ride('t22c', C_WC, 1.8, 3.2, C.PER)
const C_CTL: { icon: Ico3DName; label: string; loop: Loop }[] = [
  { icon: 'refresh', label: 'Rotation', loop: 'spin' },
  { icon: 'ban', label: 'Disable', loop: 'beat' },
  { icon: 'policy', label: 'Key Policy', loop: 'bob' },
]

const D_T22B: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 2 }, 2400)
  return (
    <Frame w={C.W} h={C.H}>
      {/* AWS-Owned: the padlock alone, nothing for the account to turn */}
      <Panel x={C.AX} y={C.Y} w={C.CW} h={C.CH} on={s(1)} lit={hot === 0} />
      <Node x={C_AC} y={C.LY} icon="lock" size={C.LS} k={0.7} w={200} label="AWS-Owned" tagSize={16} on={s(1)} loop="glint" />
      <Corner x={C_AC + C.LS / 2 - 6} y={C.LY - C.LS / 2 + 6} icon="cloud" size={34} on={s(1)} loop="float" />
      {[-80, 0, 80].map((dx, i) => (
        <Show key={dx} on={s(1)} delay={i * 100} style={{ ...box(C_AC + dx - 20, C.RY - 20, 40, 40), zIndex: 3 }}>
          <span style={{ display: 'block', width: 40, height: 40, borderRadius: 11, border: '2px dashed #C5D3EE' }} />
        </Show>
      ))}
      <W pts={C_WA} on={s(1)} lit={hot === 0} />

      {/* Customer KMS Key: the same padlock, with the owner's controls */}
      <Panel x={C.CX} y={C.Y} w={C.CW} h={C.CH} on={s(2)} lit={hot === 1} />
      <Node x={C_CC} y={C.LY} icon="lock" size={C.LS} k={0.7} w={220} label="Customer KMS Key" tagSize={16} on={s(2)} loop="glint" d={0.8} />
      <Corner x={C_CC + C.LS / 2 - 6} y={C.LY - C.LS / 2 + 6} mark={kmsMark} size={34} on={s(2)} />
      {C_CTL.map((c, i) => (
        <Node key={c.label} x={C_CC + (i - 1) * 80} y={C.RY} icon={c.icon} size={40} w={80} label={c.label} tagSize={13} on={s(2)} lit={hot === 1} loop={c.loop} t={c.loop === 'spin' ? 6 : undefined} d={i * 0.5} delay={200 + i * 120} />
      ))}
      <W pts={C_WC} on={s(2)} lit={hot === 1} />

      <Node x={C.BX} y={C.BY} mark={bucketMark} size={C.BS} w={160} label="S3 Bucket" tagSize={16} />
      <Rider cls={C_RA} icon="doc" size={26} on={s(1)} />
      <Rider cls={C_RC} icon="doc" size={26} on={s(2)} />
    </Frame>
  )
}

/* ================================================================== slides 39-40 · D_T23 · envelope encryption */

/*
 * One 546 x 330 stage for both frames. KMS card x 20..170 (the KMS Key at (95, 96), the Key ID tag at (95, 214)); the
 * Application frame x 210..526. Lanes from the KMS card's right edge: E y 84 (the encrypted copy, out), R y 108 (the
 * encrypted data key, back: decrypt), D y 168 (the plaintext data key, out, down into the data key's top). The file row
 * y 236: 2 GB File (262) -> Data Key (365) -> Ciphertext (468), forward on y 224, back on y 250. The Encrypted Key sits
 * at (468, 96); press 4 bundles it with the ciphertext (x 422..514).
 * Global presses: 1 data key + copy, 2 key ID, 3 the file encrypted locally | 4 stored alongside, 5 the decrypt.
 */
const E = { W: 546, H: 330, KX: 20, KW: 150, Y: 20, H2: 290, AX: 210, AW: 316, MX: 95, MY: 96, MS: 60, EX: 460, EY: 96, NS: 52, LE: 84, LR: 108, LD: 168, RY: 236, FX: 262, DX: 365, CX: 460, F1: 224, F2: 250, PER: 3.4 }
const E_KR = E.KX + E.KW
const E_H = E.NS / 2
const E_W_E: Pt[] = [[E_KR, E.LE], [E.EX - E_H, E.LE]]
const E_W_R: Pt[] = [[E.EX - E_H, E.LR], [E_KR, E.LR]]
const E_W_D: Pt[] = [[E_KR, E.LD], [E.DX, E.LD], [E.DX, E.RY - E_H]]
const E_F1: Pt[][] = [[[E.FX + E_H, E.F1], [E.DX - E_H, E.F1]], [[E.DX + E_H, E.F1], [E.CX - E_H, E.F1]]]
const E_F2: Pt[][] = [[[E.CX - E_H, E.F2], [E.DX + E_H, E.F2]], [[E.DX - E_H, E.F2], [E.FX + E_H, E.F2]]]
const E_RE = K.ride('t23e', E_W_E, 0.1, 1.2, E.PER)
const E_RD = K.ride('t23d', E_W_D, 0.3, 1.4, E.PER)
const E_RF = [K.ride('t23f0', [E_F1[0][0], E_F1[0][1]], 1.6, 2.2, E.PER), K.ride('t23f1', [E_F1[1][0], E_F1[1][1]], 2.4, 3.0, E.PER)]
const E_RR = K.ride('t23r', E_W_R, 0.1, 1.1, E.PER)
const E_RD2 = K.ride('t23d2', E_W_D, 1.2, 2.2, E.PER)
const E_RB = [K.ride('t23b0', [E_F2[0][0], E_F2[0][1]], 2.3, 2.75, E.PER), K.ride('t23b1', [E_F2[1][0], E_F2[1][1]], 2.8, 3.25, E.PER)]

const D_T23: Fig = (p) => {
  const { hot, s, held } = useBuild({ ...p, steps: p.steps ?? 3 }, 1800)
  const instant = useInstant()
  const back = s(5)
  return (
    <Frame w={E.W} h={E.H}>
      <Panel x={E.KX} y={E.Y} w={E.KW} h={E.H2} />
      <Panel x={E.AX} y={E.Y} w={E.AW} h={E.H2} />
      <TitleRow x={E.AX + 20} y={44} icon="webpage" text="Application" size={28} />

      {/* the KMS key, its ID (press 2) and, on decrypt, the unwrap (press 5) */}
      <Node x={E.MX} y={E.MY} mark={kmsMark} size={E.MS} w={110} label="KMS Key" lit={hot === 1} />
      <Corner x={E.MX + E.MS / 2 - 4} y={E.MY + E.MS / 2 - 6} icon="unlock" on={s(5)} loop="beat" />
      <Node x={E.MX} y={214} icon="idcard" size={40} w={100} label="Key ID" tagSize={12.5} on={s(2)} lit={hot === 1} loop="swing" />

      {/* press 1: the plaintext data key and its encrypted copy come out of KMS */}
      <W pts={E_W_E} on={s(1)} lit={hot === 0} />
      <W pts={E_W_D} on={s(1)} lit={hot === 0 || hot === 4} delay={150} />
      <W pts={E_W_R} on={s(5)} lit={hot === 4} />
      <Node x={E.EX} y={E.EY} mark={encMark} size={E.NS} w={110} label="Encrypted Key" wrap={70} tagSize={12.5} on={s(1)} lit={hot === 0 || hot === 3 || hot === 4} />
      <Node x={E.DX} y={E.RY} mark={dekMark} size={E.NS} w={100} label="Data Key" on={s(1)} lit={hot === 0 || hot === 2} />

      {/* press 3: the 2 GB file goes through the data key, locally */}
      {E_F1.map((pts, i) => <W key={i} pts={pts} on={s(3)} lit={hot === 2} head={8} delay={i * 150} />)}
      {E_F2.map((pts, i) => <W key={i} pts={pts} on={back} lit={hot === 4} head={8} delay={i * 150} />)}
      <Node x={E.FX} y={E.RY} icon="doc" w={96} label="2 GB File" on={s(3)} lit={hot === 2 || hot === 4} d={0.3} />
      <Corner x={E.FX + E_H - 4} y={E.RY - E_H + 4} icon="unlock" on={back} loop="beat" d={0.5} />
      <Node x={E.CX} y={E.RY} icon="doc" badge="lock" w={96} label="Ciphertext" tagSize={12.5} on={s(3)} lit={hot === 2 || hot === 3} d={0.7} />

      {/* press 4: the encrypted data key is stored with the ciphertext */}
      <Show on={s(4)} style={{ ...box(E.EX - 50, 62, 100, 228), zIndex: 2 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 16, background: 'rgba(45,99,251,0.05)', border: `2px dashed ${hot === 3 ? ORANGE : '#9DB6EE'}`, transition: instant ? 'none' : `border-color 420ms ${EASE}` }} />
      </Show>
      <Corner x={E.CX} y={(E.EY + E.RY) / 2 + 12} icon="link" on={s(4)} size={30} loop="pulse" />

      {!held && (back ? (
        <>
          <Rider cls={E_RR} icon="lock" size={22} />
          <Rider cls={E_RD2} icon="key" size={22} />
          {E_RB.map((c, i) => <Token key={i} cls={c} size={9} />)}
        </>
      ) : (
        <>
          <Rider cls={E_RE} icon="lock" size={22} on={s(1)} />
          <Rider cls={E_RD} icon="key" size={22} on={s(1)} />
          {E_RF.map((c, i) => <Token key={i} cls={c} size={9} on={s(3)} />)}
        </>
      ))}
    </Frame>
  )
}

/* ================================================================== slide 41 · D_T24 · yearly rotation */

/*
 * 546 x 330. Rotation (52, 46) at the head of a timeline track (y 46, x 96..510) with four year ticks (150 / 260 / 370 /
 * 480; no years are named). Under each tick the period's key hangs (y 96); in the loop the year marker moves tick to
 * tick and a new key slides in at each (held: the latest key at the last tick). Press 2: the older versions kept on a
 * key ring (205, 220), wired from the track, opening the Earlier Data (420, 220).
 */
const G = { W: 546, H: 330, RX: 52, TY: 46, T0: 96, T1: 510, KY: 96, KS: 40, WX: 205, RCX: 205, RCY: 220, RR: 40, DX: 420, DS: 52, PER: 6 }
const G_TICK = [150, 260, 370, 480]
const G_DROP = K.ride('t24w', [[G.WX, G.TY + 4], [G.WX, G.RCY - G.RR - 4]], 0.2, 1.1, 1.5)
const G_OPEN = K.ride('t24o', [[G.RCX + G.RR + 4, G.RCY], [G.DX - G.DS / 2, G.RCY]], 0.3, 1.5, 2.4)
const G_RING: [number, number][] = [150, 90, 30].map((a) => [G.RCX + Math.cos((a * Math.PI) / 180) * G.RR, G.RCY + Math.sin((a * Math.PI) / 180) * G.RR])

function YearKey({ x, k, live, held, lit }: { x: number; k: number; live: boolean; held: boolean; lit: boolean }) {
  const last = k === G_TICK.length - 1
  if (!live && !(held && last)) return null
  return (
    <div className={live ? `t15d-l t15d-yk${k}` : undefined} style={{ position: 'absolute', left: x - 50, top: G.TY + 4, width: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3, opacity: live ? 0 : 1 }}>
      <span style={{ width: 2, height: G.KY - G.KS / 2 - G.TY - 4, background: '#9DB6EE' }} />
      <Plinth size={G.KS} lit={lit}><Ico3D name="key" size={30} loop="tilt" d={k * 0.3} /></Plinth>
      <span style={{ ...tag(12.5), marginTop: 6 }}>Key Material</span>
    </div>
  )
}

const D_T24: Fig = (p) => {
  const { hot, s, held, live } = useBuild({ ...p, steps: p.steps ?? 2 }, 2400)
  const run = s(1) && live
  return (
    <Frame w={G.W} h={G.H}>
      <Node x={G.RX} y={G.TY} icon="refresh" label="Rotation" w={90} lit={hot === 0} loop="spin" t={6} />
      {/* the timeline: a track, four year ticks, the marker moving along */}
      <div aria-hidden style={{ ...box(G.T0, G.TY - 3, G.T1 - G.T0, 6), borderRadius: 3, background: '#C9D7F2', zIndex: 2 }} />
      {G_TICK.map((x) => <span key={x} aria-hidden style={{ ...box(x - 7, G.TY - 7, 14, 14), borderRadius: 99, background: '#FFFFFF', boxShadow: `inset 0 0 0 3px ${BLUE}`, zIndex: 2 }} />)}
      {run && <span aria-hidden className="t15d-l t15d-yr" style={{ ...box(G_TICK[0] - 9, G.TY - 9, 18, 18), borderRadius: 99, background: BLUE, boxShadow: `0 0 0 5px ${BLUE}30`, zIndex: 4 }} />}
      <Show on={s(1)}>
        {G_TICK.map((x, k) => <YearKey key={k} x={x} k={k} live={run} held={held} lit={hot === 0} />)}
      </Show>

      {/* press 2: the older versions kept on a ring; an older one opens the data it encrypted */}
      <W pts={[[G.WX, G.TY + 4], [G.WX, G.RCY - G.RR - 4]]} on={s(2)} lit={hot === 1} />
      <Show on={s(2)} style={{ ...box(G.RCX - 80, G.RCY - G.RR - 4, 160, 2 * G.RR + 72), zIndex: 3 }}>
        <svg aria-hidden width={160} height={2 * G.RR + 8} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
          <circle cx={80} cy={G.RR + 4} r={G.RR} fill="none" stroke={hot === 1 ? ORANGE : '#95A2B8'} strokeWidth={5} />
          <circle cx={80} cy={G.RR + 4} r={G.RR} fill="none" stroke="#F5F7FB" strokeWidth={1.5} strokeDasharray="10 14" />
        </svg>
        <span style={{ position: 'absolute', left: 0, right: 0, top: 2 * G.RR + 32, ...tag(12.5) }}>Older Versions</span>
      </Show>
      {G_RING.map(([x, y], i) => (
        <Show key={i} on={s(2)} delay={150 + i * 120} style={{ ...box(x - 16, y - 16, 32, 32), zIndex: 4 }}>
          <Ico3D name="key" size={32} loop="swing" d={i * 0.6} />
        </Show>
      ))}
      <W pts={[[G.RCX + G.RR + 4, G.RCY], [G.DX - G.DS / 2, G.RCY]]} on={s(2)} lit={hot === 1} delay={200} />
      <Node x={G.DX} y={G.RCY} icon="doc" badge="lock" size={G.DS} w={110} label="Earlier Data" on={s(2)} lit={hot === 1} d={0.4} />
      <Corner x={G.DX + G.DS / 2 - 4} y={G.RCY - G.DS / 2 + 4} icon="unlock" on={s(2)} />

      <Rider cls={G_DROP} icon="key" size={22} on={s(2)} />
      <Rider cls={G_OPEN} icon="key" size={22} on={s(2)} />
    </Frame>
  )
}

/* ================================================================== slide 42 · D_T24B · hardware custody */

/*
 * 526 x 340 (centred in 566 x 380). Application (56, 165) sends requests into the HSM box (x 124..324, y 72..250) on
 * y 150 and gets results back on y 180. The box: a navy band (Tamper-Resistant seal), a window with the glowing key
 * that never leaves, a padlock on its right. Press 2: the CloudHSM card (x 352..506, y 20..320): the official mark,
 * a single-tenant rack, its one owner.
 */
const H = { W: 526, H: 340, AX: 56, AY: 165, AS: 52, BX: 124, BW: 200, BY: 72, BH: 178, LI: 150, LO: 180, PX: 352, PW: 154, PY: 20, PH: 300, PER: 2.8 }
const H_PC = H.PX + H.PW / 2
const H_IN = K.ride('t24bi', [[H.AX + H.AS / 2, H.LI], [H.BX, H.LI]], 0.1, 0.8, H.PER)
const H_OUT = K.ride('t24bo', [[H.BX, H.LO], [H.AX + H.AS / 2, H.LO]], 1.4, 2.1, H.PER)

function HsmBox({ lit }: { lit: boolean }) {
  const instant = useInstant()
  const wx = 20
  const wy = 50
  return (
    <div style={{ ...box(H.BX, H.BY, H.BW, H.BH), zIndex: 3 }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 16, background: 'linear-gradient(180deg, #F5F7FB 0%, #DCE3EE 100%)', boxShadow: lit ? LIT : `inset 0 0 0 1.5px #C8D1DF, 0 14px 26px -14px rgba(31,64,140,0.55)`, overflow: 'hidden', transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
        {/* the lid band and its tamper seal */}
        <div style={{ height: 34, background: `linear-gradient(180deg, ${colors.brandDeep} 0%, ${colors.night2} 100%)`, display: 'flex', alignItems: 'center', gap: 7, paddingLeft: 14 }}>
          <Ico3D name="shield" size={22} loop="beat" t={2.8} />
          <span style={{ ...tag(12.5, '#FFFFFF') }}>Tamper-Resistant</span>
        </div>
      </div>
      {/* the window and the key inside it */}
      <div style={{ position: 'absolute', left: wx, top: wy, width: 100, height: 108, borderRadius: 12, background: `linear-gradient(180deg, ${colors.night3} 0%, ${colors.night} 100%)`, boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 56, height: 56 }}>
          <span aria-hidden className={loopCls('halo')} style={{ position: 'absolute', inset: -10, borderRadius: 99, background: 'radial-gradient(closest-side, rgba(255,214,90,0.6), rgba(255,214,90,0))', ...loopVars(0, 2.4) }} />
          <Ico3D name="key" size={50} loop="tilt" t={3.2} />
        </span>
        <span style={tag(12.5, '#FFFFFF')}>Key</span>
      </div>
      {/* the padlock on the box */}
      <span style={{ position: 'absolute', left: 140, top: 82, width: 40, height: 40, display: 'grid', placeItems: 'center' }}>
        <Ico3D name="lock" size={40} loop="glint" />
      </span>
    </div>
  )
}

function Rack({ live }: { live: boolean }) {
  return (
    <div style={{ ...box(H_PC - 48, 126, 96, 84), zIndex: 3, borderRadius: 10, background: `linear-gradient(180deg, ${colors.brandDeep} 0%, ${colors.night2} 100%)`, boxShadow: '0 12px 22px -12px rgba(31,64,140,0.7)', padding: 9, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ height: 18, borderRadius: 4, background: '#2A3C66', display: 'flex', alignItems: 'center', gap: 4, padding: '0 6px' }}>
          {[0, 1, 2, 3].map((j) => <span key={j} style={{ width: 9, height: 4, borderRadius: 2, background: '#5D739E' }} />)}
          <span style={{ flex: 1 }} />
          <span className={live ? 't15d-l t15d-led' : undefined} style={{ width: 6, height: 6, borderRadius: 99, background: '#4ADE80', ...cv('--t15d-d', `${-i * 0.5}s`) }} />
        </div>
      ))}
    </div>
  )
}

const D_T24B: Fig = (p) => {
  const { hot, s, live } = useBuild({ ...p, steps: p.steps ?? 2 }, 2400)
  return (
    <Frame w={H.W} h={H.H}>
      <W pts={[[H.AX + H.AS / 2, H.LI], [H.BX, H.LI]]} on={s(1)} lit={hot === 0} head={9} />
      <W pts={[[H.BX, H.LO], [H.AX + H.AS / 2, H.LO]]} on={s(1)} lit={hot === 0} head={9} />
      <Node x={H.AX} y={H.AY} icon="webpage" label="Application" w={100} d={0.2} />
      <Show on={s(1)}>
        <HsmBox lit={hot === 0} />
        <span style={{ position: 'absolute', left: H.BX, width: H.BW, top: H.BY + H.BH + 8, ...tag(14) }}>HSM</span>
      </Show>

      <Panel x={H.PX} y={H.PY} w={H.PW} h={H.PH} on={s(2)} lit={hot === 1} />
      <Node x={H_PC} y={68} mark={hsmMark} size={48} w={120} label="CloudHSM" on={s(2)} />
      <Show on={s(2)} delay={120}>
        <Rack live={live} />
        <span style={{ position: 'absolute', left: H.PX, width: H.PW, top: 218, zIndex: 3, ...tag(12.5) }}>Dedicated</span>
      </Show>
      <Node x={H_PC} y={262} icon="user" size={40} w={120} label="Single-Tenant" tagSize={12.5} on={s(2)} delay={240} d={0.4} />

      <Token cls={H_IN} on={s(1)} />
      <Token cls={H_OUT} on={s(1)} tone={colors.brandDark} />
    </Frame>
  )
}

/* ================================================================== slide 43 · D_T25 · bring your own key */

/*
 * 546 x 330. On-premises card x 20..170 (the HSM (95, 120), the Key Material (95, 222)); the KMS card x 376..526 (the
 * KMS mark (451, 120), the vault (451, 222)). The lane y 222 runs Key Material -> Import Token (273) -> Vault; the
 * Wrapping Key (273, 112, tag above) drops into the token. Press 1 the material forms, press 2 the sealed transfer.
 */
const I = { W: 546, H: 330, LX: 20, RX: 376, CW: 150, Y: 30, CH: 270, LC: 95, RC: 451, TY: 120, LY: 222, TX: 273, TS: 56, WY: 112, VS: 72, PER: 3.2 }
const I_W1: Pt[] = [[I.LC + 22, I.LY], [I.TX - I.TS / 2, I.LY]]
const I_W2: Pt[] = [[I.TX + I.TS / 2, I.LY], [I.RC - I.VS / 2, I.LY]]
const I_WK: Pt[] = [[I.TX, I.WY + 22], [I.TX, I.LY - I.TS / 2]]
const I_R1 = K.ride('t25a', I_W1, 0.1, 1.1, I.PER)
const I_R2 = K.ride('t25b', I_W2, 1.4, 2.4, I.PER)
const I_RK = K.ride('t25k', I_WK, 0.5, 1.2, I.PER)

const D_T25: Fig = (p) => {
  const { hot, s, held } = useBuild({ ...p, steps: p.steps ?? 2 }, 2400)
  return (
    <Frame w={I.W} h={I.H}>
      <Panel x={I.LX} y={I.Y} w={I.CW} h={I.CH} />
      <Panel x={I.RX} y={I.Y} w={I.CW} h={I.CH} />
      <Node x={I.LC} y={I.TY} icon="hsm" size={64} w={140} label="On-Premises HSM" tagSize={13} lit={hot === 0} loop="pulse" t={2.8} />
      <Node x={I.LC} y={I.LY} icon="key" size={44} w={110} label="Key Material" tagSize={12.5} on={s(1)} lit={hot === 0} loop="tilt">
        {s(1) && !held && <span aria-hidden className={loopCls('ripple')} style={{ position: 'absolute', inset: -6, borderRadius: 18, boxShadow: `0 0 0 2px ${BLUE}66`, ...loopVars(0, 2.4) }} />}
      </Node>
      <Node x={I.RC} y={I.TY} mark={kmsMark} size={56} w={100} label="KMS" />
      <Node x={I.RC} y={I.LY} icon="vault" size={I.VS} w={100} label="Vault" loop="pulse" t={3} lit={hot === 1} />
      <Corner x={I.RC + I.VS / 2 - 4} y={I.LY - I.VS / 2 + 6} icon="key" on={s(2)} loop="tilt" />

      {/* press 2: the import token and the wrapping key seal the material in transit */}
      <W pts={I_W1} on={s(2)} lit={hot === 1} />
      <W pts={I_W2} on={s(2)} lit={hot === 1} delay={200} />
      <W pts={I_WK} on={s(2)} lit={hot === 1} head={8} />
      <Node x={I.TX} y={I.LY} icon="token" size={I.TS} w={110} label="Import Token" on={s(2)} lit={hot === 1} />
      <Node x={I.TX} y={I.WY} icon="key" badge="lock" size={44} w={110} label="Wrapping Key" tagSize={12.5} up on={s(2)} lit={hot === 1} loop="tilt" d={0.6} delay={120} />

      <Rider cls={I_R1} icon="key" size={22} on={s(2)} />
      <Rider cls={I_R2} icon="envelope" size={24} on={s(2)} />
      <Token cls={I_RK} on={s(2)} size={8} />
    </Frame>
  )
}

/* ================================================================== slide 44 · D_T25B · imported key, owner's control */

/*
 * 526 x 340 (centred in 566 x 380). KMS card x 20..290: title row; the Key Policy (72, 140) -> the Imported Key
 * (190, 140, the KMS external key store mark); the Manual hand (72, 244) -> the Rotation dial (190, 244). Right: a
 * Request (452, 120) into the key's right edge on y 120; the Owner (452, 240) on y 160 through x 320. Press 2 the owner
 * deletes the material: the key greys out and a new request bounces back (orange).
 */
const J = { W: 526, H: 340, CX: 20, CW: 270, Y: 20, CH: 300, PX: 72, KX: 190, R2: 140, R3: 244, KS: 64, QX: 452, QY: 120, OY: 240, OL: 160, BUS: 320, DR: 32, PER: 3 }
const J_KR = J.KX + J.KS / 2
const J_WQ: Pt[] = [[J.QX - 26, J.QY], [J_KR, J.QY]]
const J_WO: Pt[] = [[J.QX - 26, J.OY], [J.BUS, J.OY], [J.BUS, J.OL], [J_KR, J.OL]]
const J_RQ = K.ride('t25q', J_WQ, 0.2, 1.4, J.PER)
const J_RB = K.ride('t25x', [J_WQ[0], [J_KR + 6, J.QY], [J.QX - 70, J.QY]], 0.2, 2.2, J.PER, 0.9)
const J_RO = K.ride('t25o', J_WO, 0.4, 1.8, J.PER)
const J_RP = K.ride('t25p', [[J.PX + 26, J.R2], [J.KX - J.KS / 2, J.R2]], 0.2, 0.9, J.PER)
const J_RH = K.ride('t25h', [[J.PX + 24, J.R3], [J.KX - J.DR, J.R3]], 0.2, 0.9, J.PER)

function Dial({ lit, live }: { lit: boolean; live: boolean }) {
  const instant = useInstant()
  const D = J.DR * 2
  const ticks = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4)
  return (
    <div style={{ ...box(J.KX - J.DR, J.R3 - J.DR, D, D), zIndex: 3 }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: 99, background: 'linear-gradient(180deg, #FFFFFF 0%, #EEF3FF 100%)', boxShadow: lit ? LIT : RIM, transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }} />
      <svg aria-hidden width={D} height={D} style={{ position: 'absolute', inset: 0 }}>
        {ticks.map((a, i) => <line key={i} x1={J.DR + Math.cos(a) * (J.DR - 6)} y1={J.DR + Math.sin(a) * (J.DR - 6)} x2={J.DR + Math.cos(a) * (J.DR - 11)} y2={J.DR + Math.sin(a) * (J.DR - 11)} stroke="#9DB6EE" strokeWidth={2.5} strokeLinecap="round" />)}
      </svg>
      <span aria-hidden className={live ? 't15d-l t15d-dial' : undefined} style={{ position: 'absolute', left: J.DR - 3, top: 12, width: 6, height: J.DR - 12, borderRadius: 3, background: colors.brandDeep, transformOrigin: '50% 100%' }} />
      <span aria-hidden style={{ position: 'absolute', left: J.DR - 8, top: J.DR - 8, width: 16, height: 16, borderRadius: 99, background: BLUE, boxShadow: '0 0 0 3px #FFFFFF' }} />
    </div>
  )
}

const D_T25B: Fig = (p) => {
  const { hot, s, live } = useBuild({ ...p, steps: p.steps ?? 2 }, 2400)
  const gone = s(2)
  return (
    <Frame w={J.W} h={J.H}>
      <Panel x={J.CX} y={J.Y} w={J.CW} h={J.CH} />
      <TitleRow x={J.CX + 20} y={56} mark={kmsMark} text="KMS" size={32} />

      {/* point 1: the imported key keeps its key policy; rotation only turns by hand */}
      <W pts={[[J.PX + 26, J.R2], [J.KX - J.KS / 2, J.R2]]} on={s(1)} lit={hot === 0} head={8} />
      <Node x={J.PX} y={J.R2} icon="policy" w={100} label="Key Policy" on={s(1)} lit={hot === 0} d={0.3} />
      <Node x={J.KX} y={J.R2} mark={xksMark} size={J.KS} w={120} label="Imported Key" dim={gone} lit={hot === 1} />
      <Corner x={J.KX - J.KS / 2 + 4} y={J.R2 - J.KS / 2 + 4} icon="ban" on={gone} loop="beat" size={30} />
      <W pts={[[J.PX + 24, J.R3], [J.KX - J.DR, J.R3]]} on={s(1)} lit={hot === 0} head={8} />
      <Node x={J.PX} y={J.R3} icon="wrench" size={48} w={100} label="Manual" on={s(1)} lit={hot === 0} loop="swing" t={3} />
      <Show on={s(1)} delay={150}>
        <Dial lit={hot === 0} live={live} />
        <span style={{ position: 'absolute', left: J.KX - 60, width: 120, top: J.R3 + J.DR + 6, ...tag(13.5) }}>Rotation</span>
      </Show>

      {/* requests, and the owner who can delete the material (press 2) */}
      <W pts={J_WQ} lit={gone ? hot === 1 : false} color={gone ? ORANGE : BLUE} />
      <Node x={J.QX} y={J.QY} icon="laptop" w={100} label="Request" d={0.2} />
      <W pts={J_WO} on={gone} lit={hot === 1} />
      <Node x={J.QX} y={J.OY} icon="user" w={100} label="Owner" lit={hot === 1} d={0.6} />
      <Corner x={J.QX + 22} y={J.OY - 22} icon="trash" on={gone} loop="swing" size={30} />

      {gone ? <Token cls={J_RB} tone={ORANGE} /> : <Token cls={J_RQ} />}
      <Rider cls={J_RO} icon="trash" size={22} on={gone} />
      <Token cls={J_RP} on={s(1)} size={8} />
      <Token cls={J_RH} on={s(1)} size={8} />
    </Frame>
  )
}

export const figures: Record<string, Fig> = { D_T20, D_T21, D_T22B, D_T23, D_T24, D_T24B, D_T25, D_T25B }

/* loop keyframes (transform / opacity only, on HTML elements) */
const P24 = G.PER
const pc = (v: number) => `${v.toFixed(2)}%`
const YK = G_TICK.map((_, k) => {
  const a = k * 25 // the marker arrives at the tick
  const b = k === G_TICK.length - 1 ? 95 : (k + 1) * 25 // the next one replaces it
  return `@keyframes t15d-yk${k} { 0%, ${pc(Math.max(0, a))} { opacity: 0; transform: translateX(-22px) } ${pc(a + 6)} { opacity: 1; transform: translateX(0) } ${pc(b)} { opacity: 1; transform: translateY(0) } ${pc(Math.min(100, b + 5))}, 100% { opacity: 0; transform: translateY(14px) } }
.t15d-yk${k} { animation: t15d-yk${k} ${P24}s cubic-bezier(0.45,0,0.55,1) infinite; }`
}).join('\n')
const LOG = [0, 1, 2, 3].map((i) => `@keyframes t15d-log${i} { 0%, ${pc(2 + i * 20)} { opacity: 0; transform: translateX(-6px) } ${pc(8 + i * 20)}, 90% { opacity: 1; transform: translateX(0) } 97%, 100% { opacity: 0; transform: translateX(0) } }
.t15d-log${i} { animation: t15d-log${i} 4s ease-out infinite; }`).join('\n')
const DX = G_TICK.map((x) => x - G_TICK[0])

export const css = `
.t15d-l { animation-delay: var(--t15d-d, 0s); }
${YK}
@keyframes t15d-yr { 0% { transform: translateX(0); opacity: 0 } 3% { opacity: 1 } 18% { transform: translateX(0) } 25% { transform: translateX(${DX[1]}px) } 43% { transform: translateX(${DX[1]}px) } 50% { transform: translateX(${DX[2]}px) } 68% { transform: translateX(${DX[2]}px) } 75% { transform: translateX(${DX[3]}px) } 96% { transform: translateX(${DX[3]}px); opacity: 1 } 100% { transform: translateX(${DX[3]}px); opacity: 0 } }
.t15d-yr { animation: t15d-yr ${P24}s cubic-bezier(0.45,0,0.55,1) infinite; }
${LOG}
@keyframes t15d-led { 0%, 100% { opacity: 1 } 50% { opacity: 0.25 } }
.t15d-led { animation: t15d-led 1.4s ease-in-out infinite; }
@keyframes t15d-dial { 0%, 14% { transform: rotate(-60deg) } 26%, 46% { transform: rotate(0deg) } 58%, 78% { transform: rotate(60deg) } 92%, 100% { transform: rotate(-60deg) } }
.t15d-dial { animation: t15d-dial ${J.PER * 2}s cubic-bezier(0.45,0,0.55,1) infinite; transform-origin: 50% 100%; }
${K.css()}
.cc-still .t15d-l, .deck-thumb .t15d-l { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .t15d-l { animation: none !important; } }
`
void FONT
