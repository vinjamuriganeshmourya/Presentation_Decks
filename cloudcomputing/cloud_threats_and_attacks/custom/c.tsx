import type { ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Loop, type Badge } from '@/engine/icons3d'
import {
  Frame, Plinth, IconTile, MarkTile, Panel, Wire, Junction, Show, useHot, useHeld, keyframes, Token,
  tag, heading, loopCls, loopVars, EASE, ORANGE, PAD, type Pt,
} from '@/engine/figkit'
import ctMark from '../images/aws-cloudtrail.svg'
import gdMark from '../images/aws-guardduty.svg'
import ecrMark from '../images/aws-ecr.svg'
import ecrImage from '../images/res-ecr-image.svg'
import smMark from '../images/aws-secrets-manager.svg'
import aaMark from '../images/res-iam-access-analyzer.svg'

/*
 * SESSION 16 · SECTION 4 (Insider & Supply-Chain Threats) · builder C
 * C_T16 (slide 29), C_T17 (30), C_T17B (31), C_T18 (33), C_T18B (34), C_T19 (35), C_T19B (36).
 * Standing correction 17: 3D icons on plinth tiles, PAD (20) on all four sides of every stage and card, orthogonal
 * wires computed from the box constants (tips on target edges), flow dots / riders on every wire, the lit item walking
 * first -> last -> first after the build, held frames complete with nothing lit and nothing moving.
 * Stage sizes are the points-layout boxes: 1110 - pointsW - 24 wide by figH. Class prefix `t16c-`.
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('t16c')

/** a 3D icon riding a `ride` class (placed from the frame's 0,0); nothing on held frames */
function Rider({ cls, name, size = 30, on = true, dim = false, badge }: { cls: string; name: Ico3DName; size?: number; on?: boolean; dim?: boolean; badge?: Badge }) {
  const held = useHeld()
  if (held || !on) return null
  return (
    <span aria-hidden style={{ position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, zIndex: 6, pointerEvents: 'none', opacity: dim ? 0.4 : 1 }}>
      <span className={cls} style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 10, background: '#FFFFFF', boxShadow: '0 6px 14px -8px rgba(31,64,140,0.7), inset 0 0 0 1.5px #D3DEF6', opacity: 0 }}>
        <Ico3D name={name} size={Math.round(size * 0.8)} loop="none" badge={badge} />
      </span>
    </span>
  )
}

/** a tile centred on (x, y) with its one-word tag under it */
function Node({ x, y, label, size = 64, on = true, delay = 0, children, w = 140, label2, tagColor }: { x: number; y: number; label: string; size?: number; on?: boolean; delay?: number; children: ReactNode; w?: number; label2?: string; tagColor?: string }) {
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, top: y - size / 2, width: w, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ width: size, height: size, display: 'grid', placeItems: 'center' }}>{children}</div>
      <span style={tag(15, tagColor)}>{label}</span>
      {label2 && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: -4 }}>
          <Ico3D name="flag" size={24} loop="swing" t={2.4} />
          <span style={tag(14, '#C2541C')}>{label2}</span>
        </span>
      )}
    </Show>
  )
}

const tile = (name: Ico3DName, o: { size?: number; lit?: boolean; warm?: boolean; loop?: Loop; d?: number; t?: number; badge?: Badge; k?: number } = {}) => (
  <IconTile name={name} size={o.size ?? 64} k={o.k ?? 0.74} lit={o.lit} warm={o.warm} loop={o.loop ?? 'bob'} d={o.d ?? 0} t={o.t} badge={o.badge} />
)

/* ================================================================== 29 · C_T16 · three trust-based threats, one account */

/* 566 x 330: three cards on the left (PAD all round), wires merging at one junction, one arrow into the account */
const A = { W: 566, H: 330, BW: 252, BH: 82, BUS: 334, CX: 462, CY: 165, R: 80 }
const A_BY = [PAD, (A.H - A.BH) / 2, A.H - PAD - A.BH]
const A_YC = A_BY.map((y) => y + A.BH / 2)
const A_X1 = PAD + A.BW
const A_TIP = A.CX - A.R
const A_IN: Pt[][] = [
  [[A_X1, A_YC[0]], [A.BUS, A_YC[0]], [A.BUS, A.CY]],
  [[A_X1, A_YC[1]], [A.BUS, A.CY]],
  [[A_X1, A_YC[2]], [A.BUS, A_YC[2]], [A.BUS, A.CY]],
]
const A_RIDE = A_IN.map((pts, i) => K.ride(`a${i}`, [...pts, [A_TIP - 6, A.CY]], 0.15 + i * 1.1, 1.75 + i * 1.1, 3.6))
const A_ITEMS: [string, Ico3DName, Badge | undefined][] = [
  ['Insider', 'idcard', undefined],
  ['Supply Chain', 'package', undefined],
  ['Credential Theft', 'key', 'alert'],
]

const C_T16: Fig = ({ step = 0 }) => {
  const s = step as number
  const hot = useHot(3, s, 1800)
  const held = useHeld()
  return (
    <Frame w={A.W} h={A.H}>
      {A_ITEMS.map(([title, ico, badge], i) => (
        <div key={title}>
          <Panel x={PAD} y={A_BY[i]} w={A.BW} h={A.BH} on={s >= i + 1} lit={hot === i}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 16, padding: '0 13px' }}>
              <Plinth size={56}><Ico3D name={ico} size={42} loop={i === 1 ? 'float' : 'bob'} d={i * 0.7} badge={badge} /></Plinth>
              <span style={{ ...heading(18), whiteSpace: 'nowrap' }}>{title}</span>
            </div>
          </Panel>
          <Wire pts={A_IN[i]} on={s >= i + 1} lit={hot === i} head={0} delay={200} />
          <Token cls={A_RIDE[i]} on={s >= 3} size={10} />
        </div>
      ))}
      <Junction x={A.BUS} y={A.CY} on={s >= 1} lit={hot >= 0} />
      <Wire pts={[[A.BUS, A.CY], [A_TIP, A.CY]]} on={s >= 1} head={11} lit={hot >= 0} delay={600} />
      <Show on={s >= 1} style={{ position: 'absolute', left: A.CX - A.R, top: A.CY - A.R, width: A.R * 2, height: A.R * 2, zIndex: 2 }}>
        {!held && <span aria-hidden className={loopCls('ripple')} style={{ position: 'absolute', inset: -8, borderRadius: 999, border: `2px solid ${colors.brand}55`, ...loopVars(0, 2.8) }} />}
        <div style={{ position: 'absolute', inset: 0, borderRadius: 999, background: 'radial-gradient(circle at 40% 32%, #FFFFFF 0%, #EAF1FF 70%, #D7E3FF 100%)', boxShadow: 'inset 0 0 0 2px #C9D7F6, 0 16px 30px -16px rgba(31,64,140,0.55)', display: 'grid', placeItems: 'center' }}>
          <Ico3D name="cloud" size={96} loop="bob" t={3.2} badge="lock" />
        </div>
      </Show>
      <Show on={s >= 1} style={{ position: 'absolute', left: A.CX - 80, top: A.CY + A.R + 12, width: 160 }}>
        <div style={tag(17, colors.brandDark)}>Cloud Account</div>
      </Show>
    </Frame>
  )
}

/* ================================================================== 30 · C_T17 · malicious vs accidental, one split card */

/* 586 x 330: two cards side by side, PAD outside and a 20 px gutter; each card: its title, the insider, the data */
const B = { W: 586, H: 330, GAP: 20 }
const B_CW = (B.W - PAD * 2 - B.GAP) / 2 // 263
const B_CH = B.H - PAD * 2 // 290
const B_TY = 160 // tile centre, card coordinates
const B_UX = 66
const B_DX = B_CW - 66
const B_RIDE = [0, 1].map((i) => K.ride(`b${i}`, [[B_UX + 36, B_TY], [B_DX - 40, B_TY]], 0.2, 1.4, 2.4))

function T17Card({ i, on, lit }: { i: number; on: boolean; lit: boolean }) {
  const held = useHeld()
  const mal = i === 0
  const x = PAD + i * (B_CW + B.GAP)
  return (
    <Panel x={x} y={PAD} w={B_CW} h={B_CH} on={on} lit={lit}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 22, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
        <Ico3D name={mal ? 'target' : 'alert'} size={30} loop={mal ? 'pulse' : 'tilt'} t={2.6} />
        <span style={heading(21)}>{mal ? 'Malicious' : 'Accidental'}</span>
      </div>
      {/* the insider: already inside, with a badge that opens the door */}
      <div style={{ position: 'absolute', left: B_UX - 36, top: B_TY - 36 }}>
        <Plinth size={72}><Ico3D name="user" size={54} loop="bob" d={i * 0.8} badge={mal ? 'alert' : 'check'} /></Plinth>
      </div>
      <div style={{ position: 'absolute', left: B_UX - 50, top: B_TY + 44, width: 100, ...tag(15) }}>Insider</div>
      {/* the data: on the left card a deliberate arrow reaches it, on the right it is left behind an open padlock */}
      <div style={{ position: 'absolute', left: B_DX - 36, top: B_TY - 36 }}>
        <Plinth size={72} warm={!mal}><Ico3D name="database" size={52} loop="float" d={0.5 + i} /></Plinth>
      </div>
      <div style={{ position: 'absolute', left: B_DX - 50, top: B_TY + 44, width: 100, ...tag(15) }}>Data</div>
      {mal ? (
        <>
          <Wire pts={[[B_UX + 36, B_TY], [B_DX - 36, B_TY]]} on={on} head={11} lit={lit} delay={300} width={3} />
          <Token cls={B_RIDE[0]} on={on && !held} size={11} tone={ORANGE} />
          {/* the data carried away: a document lifting off the store */}
          <div style={{ position: 'absolute', left: B_DX - 17, top: B_TY - 88, width: 34, height: 34 }}>
            <Ico3D name="doc" size={34} loop="float" t={2.4} />
          </div>
        </>
      ) : (
        <>
          {/* the shutter left open: a swinging open padlock on the data, no wire (nobody reached for it) */}
          <div style={{ position: 'absolute', left: B_DX - 22, top: B_TY - 98, width: 44, height: 44 }}>
            <Ico3D name="unlock" size={44} loop="swing" t={2.8} />
          </div>
          <div style={{ position: 'absolute', left: (B_UX + B_DX) / 2 - 18, top: B_TY - 18, width: 36, height: 36 }}>
            <Ico3D name="gear" size={36} loop="tilt" t={3} badge="alert" />
          </div>
        </>
      )}
      <div style={{ position: 'absolute', left: 20, right: 20, bottom: 20, display: 'flex', justifyContent: 'center', gap: 10, alignItems: 'center' }}>
        <Ico3D name={mal ? 'trash' : 'globe'} size={34} loop="bob" d={0.3 + i} />
        <span style={tag(15)}>{mal ? 'Steals' : 'Exposes'}</span>
      </div>
    </Panel>
  )
}

const C_T17: Fig = ({ step = 0 }) => {
  const s = step as number
  const hot = useHot(2, s, 2200)
  return (
    <Frame w={B.W} h={B.H}>
      <T17Card i={0} on={s >= 1} lit={hot === 0} />
      <T17Card i={1} on={s >= 2} lit={hot === 1} />
    </Frame>
  )
}

/* ================================================================== 31 · C_T17B · behaviour, not the perimeter */

/*
 * 566 x 380: left column, the perimeter firewall (passed untouched) over two insiders; centre, the CloudTrail log
 * filling with their calls (rows scroll); right, GuardDuty reading the log and raising its flag on the unusual entry.
 */
const E = { W: 566, H: 380, LX: 64, LOGX: 140, LOGW: 256, GX: 494 }
const E_UY = [196, 302]
const E_LOGY = PAD
const E_LOGH = E.H - PAD * 2
const E_GY = 120
const E_FY = 268
const E_RIDE = E_UY.map((y, i) => K.ride(`e${i}`, [[E.LX + 30, y], [E.LOGX - 4, y]], 0.1 + i * 0.9, 0.9 + i * 0.9, 2.4))
const E_RIDE_G = K.ride('eg', [[E.LOGX + E.LOGW + 2, E_GY], [E.GX - 34, E_GY]], 0.4, 1.3, 2.4)
const E_ROWS: [Ico3DName, Ico3DName, boolean][] = [
  ['user', 'doc', false],
  ['user', 'bucket', false],
  ['user', 'key', false],
  ['user', 'trash', true],
  ['user', 'gear', false],
  ['user', 'object', false],
]

function LogRows({ flagged }: { flagged: boolean }) {
  const row = (r: [Ico3DName, Ico3DName, boolean], k: number) => (
    <div key={k} style={{ height: 50, margin: '0 0 8px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px', background: r[2] && flagged ? '#FFF1E6' : '#F5F8FF', boxShadow: r[2] && flagged ? `inset 0 0 0 2px ${ORANGE}` : 'inset 0 0 0 1px #DCE5F7', transition: `box-shadow 420ms ${EASE}, background 420ms ${EASE}` }}>
      <Ico3D name={r[0]} size={28} loop="none" />
      <span style={{ width: 22, height: 3, borderRadius: 3, background: '#B9C9EE' }} />
      <Ico3D name={r[1]} size={28} loop="none" badge={r[2] ? 'alert' : undefined} />
      <Ico3D name="clock" size={22} loop="none" style={{ marginLeft: 'auto', opacity: 0.8 }} />
    </div>
  )
  return (
    <>
      {E_ROWS.map(row)}
      {E_ROWS.map((r, k) => row(r, k + 10))}
    </>
  )
}

const C_T17B: Fig = ({ step = 0 }) => {
  const s = step as number
  const hot = useHot(3, s, 2000)
  const held = useHeld()
  const instant = useInstant()
  return (
    <Frame w={E.W} h={E.H}>
      {/* the perimeter: on duty, and never crossed by an insider (they are already inside) */}
      <Node x={E.LX} y={62} label="Perimeter" size={60} on={s >= 1} w={110}>
        <Plinth size={60} lit={hot === 0}><Ico3D name="firewall" size={44} loop="pulse" t={3} badge="check" /></Plinth>
      </Node>
      {E_UY.map((y, i) => (
        <div key={i}>
          <Node x={E.LX} y={y} label="Insider" size={60} on={s >= 1} delay={150 + i * 150} w={110}>
            <Plinth size={60} lit={hot === 0}><Ico3D name="user" size={44} loop="bob" d={i * 0.9} badge={i === 0 ? 'alert' : undefined} /></Plinth>
          </Node>
          <Wire pts={[[E.LX + 30, y], [E.LOGX, y]]} on={s >= 2} head={9} lit={hot === 1} delay={150} />
          <Token cls={E_RIDE[i]} on={s >= 2} size={9} />
        </div>
      ))}
      {/* the log: every call either insider makes, kept */}
      <Panel x={E.LOGX} y={E_LOGY} w={E.LOGW} h={E_LOGH} on={s >= 2} lit={hot === 1}>
        <div style={{ position: 'absolute', left: 20, right: 20, top: 22, display: 'flex', alignItems: 'center', gap: 12 }}>
          <MarkTile src={ctMark} size={48} />
          <span style={heading(18)}>CloudTrail</span>
        </div>
        <div style={{ position: 'absolute', left: 20, right: 20, top: 90, height: 224, overflow: 'hidden', borderRadius: 12, ...(held || instant ? {} : { WebkitMaskImage: 'linear-gradient(180deg, transparent 0, #000 18px, #000 206px, transparent 224px)', maskImage: 'linear-gradient(180deg, transparent 0, #000 18px, #000 206px, transparent 224px)' }) }}>
          <div className={held || instant ? undefined : 't16c-scroll'}>
            <LogRows flagged={s >= 3 && !held ? true : s >= 3} />
          </div>
        </div>
      </Panel>
      {/* GuardDuty reads the log and flags the unusual call */}
      <Wire pts={[[E.LOGX + E.LOGW, E_GY], [E.GX - 32, E_GY]]} on={s >= 3} head={9} lit={hot === 2} delay={150} />
      <Token cls={E_RIDE_G} on={s >= 3} size={9} />
      <Node x={E.GX} y={E_GY} label="GuardDuty" size={64} on={s >= 3} w={130}>
        <MarkTile src={gdMark} size={64} lit={hot === 2} />
      </Node>
      <Wire pts={[[E.GX, E_GY + 62], [E.GX, E_FY - 32]]} on={s >= 3} head={9} lit={hot === 2} delay={500} />
      <Node x={E.GX} y={E_FY} label="Unusual" size={64} on={s >= 3} delay={700} w={130}>
        <Plinth size={64} warm lit={hot === 2}><Ico3D name="flag" size={46} loop="swing" t={2.6} /></Plinth>
      </Node>
    </Frame>
  )
}

/* ================================================================== 33 · C_T18 · registry -> build pipeline -> container */

/*
 * 566 x 330. Top row: the supply chain, three tiles on one line, the registry carrying the TR's orange flag
 * (Tampered). Bottom row: the three threats, one card each; at its press each threat rides the chain into the running
 * container; after the build all three ride in turn while their cards light.
 */
const C = { W: 566, H: 330, RY: 66, T: 64, CW: 160, CH: 120 }
const C_X = [94, 283, 472]
const C_SEG: Pt[][] = [[[C_X[0] + C.T / 2, C.RY], [C_X[1] - C.T / 2, C.RY]], [[C_X[1] + C.T / 2, C.RY], [C_X[2] - C.T / 2, C.RY]]]
/* a rider runs each wire between tiles (never across a tile): out of the registry, then out of the build */
const C_SEGS: Pt[][] = [[[C_X[0] + C.T / 2 + 18, C.RY], [C_X[1] - C.T / 2 - 30, C.RY]], [[C_X[1] + C.T / 2 + 18, C.RY], [C_X[2] - C.T / 2 - 30, C.RY]]]
const C_PER = 4.5
const C_RIDE = [0, 1, 2].map((i) => C_SEGS.map((seg, k) => K.ride(`c${i}${k}`, seg, 0.1 + i * 1.5 + k * 0.75, 0.75 + i * 1.5 + k * 0.75, C_PER)))
const C_RIDE1 = [0, 1, 2].map((i) => C_SEGS.map((seg, k) => K.ride(`c1${i}${k}`, seg, 0.1 + k * 0.8, 0.8 + k * 0.8, 2.2)))
const C_CARDY = C.H - PAD - C.CH
const C_CARDX = [PAD, (C.W - C.CW) / 2, C.W - PAD - C.CW]
const C_THREATS: [string, Ico3DName, Badge][] = [
  ['Dependency', 'package', 'alert'],
  ['Image', 'container', 'alert'],
  ['Typosquatting', 'package', 'alert'],
]

/** the chain row, shared by T18 and T18-B (T18-B draws it smaller and dims the threats) */
function Chain({ s, on, dimFlag = false, lit = -1 }: { s: number; on: boolean; dimFlag?: boolean; lit?: number }) {
  return (
    <>
      <Node x={C_X[0]} y={C.RY} label="Registry" label2={dimFlag ? undefined : 'Tampered'} on={on} w={130}>
        {tile('server', { lit: lit === 0, loop: 'bob' })}
      </Node>
      <Node x={C_X[1]} y={C.RY} label="Build Pipeline" on={on} delay={200} w={150}>
        {tile('pipeline', { lit: lit === 1, loop: 'float', d: 0.6 })}
      </Node>
      <Node x={C_X[2]} y={C.RY} label="Container" on={on} delay={400} w={130}>
        {tile('container', { lit: lit === 2, loop: 'bob', d: 1.1 })}
      </Node>
      {C_SEG.map((pts, i) => <Wire key={i} pts={pts} on={on} head={10} delay={300 + i * 300} />)}
      {void s}
    </>
  )
}

const C_T18: Fig = ({ step = 0 }) => {
  const s = step as number
  const hot = useHot(3, s, 1500)
  const done = s >= 3
  return (
    <Frame w={C.W} h={C.H}>
      <Chain s={s} on={s >= 1} />
      {/* while building, the threat of this press rides; once built, all three take turns (their period lines up with the walk) */}
      {C_THREATS.map(([, ico], i) => (
        [0, 1].map((k) => <Rider key={`${i}${k}`} cls={(done ? C_RIDE[i] : C_RIDE1[i])[k]} name={ico} size={32} on={done ? true : s === i + 1} badge="alert" />)
      ))}
      {C_THREATS.map(([label, ico, badge], i) => (
        <Panel key={label} x={C_CARDX[i]} y={C_CARDY} w={C.CW} h={C.CH} on={s >= i + 1} lit={hot === i}>
          <div style={{ position: 'absolute', inset: 0, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {i === 2 ? (
              <div style={{ display: 'flex', gap: 10, height: 56, alignItems: 'center' }}>
                <Plinth size={50}><Ico3D name="package" size={36} loop="bob" badge="check" /></Plinth>
                <Plinth size={50} warm><Ico3D name="package" size={36} loop="bob" d={0.5} badge="alert" /></Plinth>
              </div>
            ) : (
              <Plinth size={56}><Ico3D name={ico} size={42} loop={i === 0 ? 'float' : 'bob'} d={i * 0.5} badge={badge} /></Plinth>
            )}
            <span style={tag(15)}>{label}</span>
          </div>
        </Panel>
      ))}
    </Frame>
  )
}

/* ================================================================== 34 · C_T18B · the two defences on the same chain */

/*
 * 586 x 380. The same chain across the top, smaller, its threats now dimmed and its flag faded: the room sees the
 * pipeline it just watched being attacked. Under it two defence cards: Amazon ECR scanning an image (a scan line
 * sweeps the image, a known vulnerability is caught), and dependency pinning (an exact version locked, 'latest' refused).
 */
const D = { W: 586, H: 380, RY: 62, CARDY: 150 }
const D_X = [100, 293, 486]
const D_CW = (D.W - PAD * 2 - 20) / 2 // 263
const D_CH = D.H - PAD - D.CARDY // 192
const D_SEGS: Pt[][] = [[[D_X[0] + 28 + 16, D.RY], [D_X[1] - 28 - 28, D.RY]], [[D_X[1] + 28 + 16, D.RY], [D_X[2] - 28 - 28, D.RY]]]
const D_RIDE = [0, 1, 2].map((i) => D_SEGS.map((seg, k) => K.ride(`d${i}${k}`, seg, 0.1 + i * 1.5 + k * 0.75, 0.75 + i * 1.5 + k * 0.75, 4.5)))

function SmallChain({ on, lit }: { on: boolean; lit: number }) {
  const n = (x: number, label: string, ico: Ico3DName, i: number, extra?: ReactNode) => (
    <Node x={x} y={D.RY} label={label} size={56} on={on} delay={i * 150} w={150}>
      <span style={{ position: 'relative', display: 'grid' }}>
        <IconTile name={ico} size={56} lit={lit === i} loop="bob" d={i * 0.5} />
        {extra}
      </span>
    </Node>
  )
  return (
    <>
      {n(D_X[0], 'Registry', 'server', 0)}
      {n(D_X[1], 'Build Pipeline', 'pipeline', 1)}
      {n(D_X[2], 'Container', 'container', 2)}
      <Wire pts={[[D_X[0] + 28, D.RY], [D_X[1] - 28, D.RY]]} on={on} head={10} delay={200} />
      <Wire pts={[[D_X[1] + 28, D.RY], [D_X[2] - 28, D.RY]]} on={on} head={10} delay={400} />
    </>
  )
}

const C_T18B: Fig = ({ step = 0 }) => {
  const s = step as number
  const hot = useHot(2, s, 2200)
  const held = useHeld()
  const instant = useInstant()
  const scanning = !held && !instant
  return (
    <Frame w={D.W} h={D.H}>
      <SmallChain on lit={hot === 0 ? 0 : hot === 1 ? 1 : -1} />
      {(['package', 'container', 'package'] as Ico3DName[]).map((ico, i) => (
        [0, 1].map((k) => <Rider key={`${i}${k}`} cls={D_RIDE[i][k]} name={ico} size={28} dim badge="alert" />)
      ))}
      {/* ECR: the image under a sweeping scan line, the known vulnerability caught */}
      <Panel x={PAD} y={D.CARDY} w={D_CW} h={D_CH} on={s >= 1} lit={hot === 0}>
        <div style={{ position: 'absolute', left: 20, top: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <MarkTile src={ecrMark} size={48} />
          <span style={heading(18)}>Amazon ECR</span>
        </div>
        <div style={{ position: 'absolute', left: 20, right: 20, top: 84, bottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative', width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(180deg,#FFFFFF 0%,#EEF3FF 100%)', boxShadow: 'inset 0 0 0 1.5px #D3DEF6, 0 10px 20px -12px rgba(31,64,140,0.5)', overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
              <img src={ecrImage} alt="" aria-hidden draggable={false} style={{ width: 38, height: 38, display: 'block' }} />
              {scanning && <span aria-hidden className="t16c-scanline" style={{ position: 'absolute', left: 5, right: 5, top: 0, height: 3, borderRadius: 3, background: colors.brand, boxShadow: `0 0 10px 2px ${colors.brand}66` }} />}
            </div>
            <span style={tag(14)}>Image</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Plinth size={56}><Ico3D name="scan" size={40} loop="pulse" t={2.4} /></Plinth>
            <span style={tag(14)}>Scan</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Plinth size={56} warm><Ico3D name="bug" size={40} loop="beat" t={2.6} badge="alert" /></Plinth>
            <span style={tag(14)}>Vulnerability</span>
          </div>
        </div>
      </Panel>
      {/* pinning: one exact version locked; 'latest' is refused */}
      <Panel x={PAD + D_CW + 20} y={D.CARDY} w={D_CW} h={D_CH} on={s >= 2} lit={hot === 1}>
        <div style={{ position: 'absolute', left: 20, top: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Plinth size={48}><Ico3D name="pin" size={36} loop="tilt" t={2.8} /></Plinth>
          <span style={heading(18)}>Pinning</span>
        </div>
        {[
          ['Exact Version', 'lock' as Badge, false],
          ['Latest', 'cross' as Badge, true],
        ].map(([label, badge, off], k) => (
          <div key={label as string} style={{ position: 'absolute', left: 20, right: 20, top: 96 + k * 50, height: 40, borderRadius: 11, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', background: off ? '#F6F7FA' : '#EEF4FF', boxShadow: off ? 'inset 0 0 0 1px #E1E5EE' : `inset 0 0 0 1.5px ${colors.brand}55`, opacity: off ? 0.75 : 1 }}>
            <Ico3D name="version" size={26} loop={off ? 'none' : 'bob'} badge={badge as Badge} />
            <span style={{ ...tag(15, off ? '#7B869C' : colors.brandDeep), textAlign: 'left' }}>{label as string}</span>
          </div>
        ))}
      </Panel>
    </Frame>
  )
}

/* ================================================================== 35 · C_T19 · three credential paths into the account */

/* 566 x 330: three cards across the top (PAD all round), each with an elbow into the account below */
const F = { W: 566, H: 330, CW: 150, CH: 116, AY: 248, AT: 72 }
const F_CX = [PAD + F.CW / 2, F.W / 2, F.W - PAD - F.CW / 2]
const F_CB = PAD + F.CH
const F_IN: Pt[][] = [
  [[F_CX[0], F_CB], [F_CX[0], F.AY], [F.W / 2 - F.AT / 2, F.AY]],
  [[F_CX[1], F_CB], [F_CX[1], F.AY - F.AT / 2]],
  [[F_CX[2], F_CB], [F_CX[2], F.AY], [F.W / 2 + F.AT / 2, F.AY]],
]
const F_TRIM = (pts: Pt[]): Pt[] => {
  const [ex, ey] = pts[pts.length - 1]
  const [px, py] = pts[pts.length - 2]
  const L = Math.hypot(ex - px, ey - py)
  return [...pts.slice(0, -1), [ex - ((ex - px) / L) * 8, ey - ((ey - py) / L) * 8]]
}
const F_RIDE = F_IN.map((pts, i) => K.ride(`f${i}`, F_TRIM(pts), 0.15 + i * 1.2, 1.35 + i * 1.2, 3.6))
const F_ITEMS: [string, ReactNode, Ico3DName][] = [
  ['Phishing', <Ico3D key="a" name="webpage" size={44} loop="bob" badge="alert" />, 'password'],
  ['Leaked Keys', <span key="b" style={{ position: 'relative', display: 'grid' }}><Ico3D name="code" size={44} loop="float" d={0.4} /><span style={{ position: 'absolute', right: -10, bottom: -8 }}><Ico3D name="key" size={26} loop="glint" t={2.8} /></span></span>, 'key'],
  ['Token Theft', <Ico3D key="c" name="token" size={44} loop="tilt" d={0.8} badge="alert" />, 'token'],
]

const C_T19: Fig = ({ step = 0 }) => {
  const s = step as number
  const hot = useHot(3, s, 1800)
  return (
    <Frame w={F.W} h={F.H}>
      {F_ITEMS.map(([label, icon, rider], i) => (
        <div key={label}>
          <Panel x={F_CX[i] - F.CW / 2} y={PAD} w={F.CW} h={F.CH} on={s >= i + 1} lit={hot === i}>
            <div style={{ position: 'absolute', inset: 0, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <Plinth size={60}>{icon}</Plinth>
              <span style={tag(15)}>{label}</span>
            </div>
          </Panel>
          <Wire pts={F_IN[i]} on={s >= i + 1} head={10} lit={hot === i} delay={250} />
          <Rider cls={F_RIDE[i]} name={rider} size={28} on={s >= 3} />
        </div>
      ))}
      <Node x={F.W / 2} y={F.AY} label="Account" size={F.AT} on={s >= 1} delay={300} w={130}>
        <Plinth size={F.AT} lit={hot >= 0}><Ico3D name="cloud" size={54} loop="bob" t={3.2} badge="lock" /></Plinth>
      </Node>
    </Frame>
  )
}

/* ================================================================== 36 · C_T19B · the vault that rotates, the analyzer that flags */

/*
 * 586 x 330, two cards side by side (PAD outside, 20 px gutter). Left: Secrets Manager; the vault takes the new key
 * in while the old one leaves (continuous). Right: IAM Access Analyzer; a policy that grants everything (`*`) and the
 * flag it raises.
 */
const G = { W: 586, H: 330 }
const G_CW = (G.W - PAD * 2 - 20) / 2 // 263
const G_CH = G.H - PAD * 2 // 290

const G_TY = 172 // tile centre, card coordinates
const G_T = 76
const G_LX = 20 + 52
const G_RX = G_CW - 20 - 52
const G_WIRE: Pt[] = [[G_LX + G_T / 2, G_TY], [G_RX - G_T / 2, G_TY]]
const G_RIDE = [0, 1].map((i) => K.ride(`g${i}`, [[G_LX + G_T / 2 + 4, G_TY], [G_RX - G_T / 2 - 12, G_TY]], 0.2, 1.3, 2.4))

/** one tile of a T19-B card, centred at (x, G_TY), its tag under it */
const GTile = ({ x, label, children }: { x: number; label: string; children: ReactNode }) => (
  <div style={{ position: 'absolute', left: x - 60, top: G_TY - G_T / 2, width: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
    {children}
    <span style={tag(15)}>{label}</span>
  </div>
)

const C_T19B: Fig = ({ step = 0 }) => {
  const s = step as number
  const hot = useHot(2, s, 2200)
  const held = useHeld()
  const instant = useInstant()
  const live = !held && !instant
  const head = (mark: string, label: string) => (
    <div style={{ position: 'absolute', left: 20, right: 20, top: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
      <MarkTile src={mark} size={52} />
      <span style={{ ...heading(18), whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  )
  return (
    <Frame w={G.W} h={G.H}>
      <Panel x={PAD} y={PAD} w={G_CW} h={G_CH} on={s >= 1} lit={hot === 0}>
        {head(smMark, 'Secrets Manager')}
        <GTile x={G_LX} label="Stores">
          <Plinth size={G_T}><Ico3D name="vault" size={58} loop="pulse" t={3.2} /></Plinth>
        </GTile>
        <Wire pts={G_WIRE} on={s >= 1} head={9} delay={400} />
        <Token cls={G_RIDE[0]} on={s >= 1} size={9} />
        <GTile x={G_RX} label="Rotates">
          <div style={{ position: 'relative', width: G_T, height: G_T }}>
            <Plinth size={G_T}>
              <span />
            </Plinth>
            {/* the rotation: the old key leaves (fades and drops), the new key arrives (rises in); held frames show the new key only */}
            <span className={live ? 't16c-keyout' : undefined} style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: live ? undefined : 0 }}>
              <Ico3D name="key" size={48} loop="none" badge="cross" />
            </span>
            <span className={live ? 't16c-keyin' : undefined} style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
              <Ico3D name="key" size={48} loop="none" badge="check" />
            </span>
          </div>
        </GTile>
      </Panel>
      <Panel x={PAD + G_CW + 20} y={PAD} w={G_CW} h={G_CH} on={s >= 2} lit={hot === 1}>
        {head(aaMark, 'Access Analyzer')}
        <GTile x={G_LX} label="Permissions">
          <Plinth size={G_T}>
            <span style={{ position: 'relative', display: 'grid' }}>
              <Ico3D name="policy" size={54} loop="float" />
              <span style={{ position: 'absolute', right: -12, bottom: -8 }}><Ico3D name="asterisk" size={30} loop="pulse" t={2.4} /></span>
            </span>
          </Plinth>
        </GTile>
        <Wire pts={G_WIRE} on={s >= 2} head={9} delay={400} />
        <Token cls={G_RIDE[1]} on={s >= 2} size={9} />
        <GTile x={G_RX} label="Broad">
          <Plinth size={G_T} warm><Ico3D name="flag" size={54} loop="swing" t={2.6} /></Plinth>
        </GTile>
      </Panel>
    </Frame>
  )
}

export const figures: Record<string, Fig> = { C_T16, C_T17, C_T17B, C_T18, C_T18B, C_T19, C_T19B }

export const css = `
@keyframes t16c-scroll { 0% { transform: translateY(0) } 100% { transform: translateY(-${E_ROWS.length * 58}px) } }
.t16c-scroll { animation: t16c-scroll 9s linear infinite; will-change: transform; }
@keyframes t16c-scanline { 0%, 100% { transform: translateY(7px) } 50% { transform: translateY(46px) } }
.t16c-scanline { animation: t16c-scanline 2.2s cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes t16c-keyout { 0%, 8% { opacity: 1; transform: translateY(0) } 40%, 100% { opacity: 0; transform: translateY(18px) scale(0.85) } }
.t16c-keyout { animation: t16c-keyout 3.2s cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes t16c-keyin { 0%, 30% { opacity: 0; transform: translateY(-18px) scale(0.85) } 62%, 92% { opacity: 1; transform: translateY(0) } 100% { opacity: 0; transform: translateY(0) } }
.t16c-keyin { animation: t16c-keyin 3.2s cubic-bezier(0.45,0,0.55,1) infinite; }
.cc-still .t16c-scroll, .deck-thumb .t16c-scroll, .cc-still .t16c-scanline, .deck-thumb .t16c-scanline,
.cc-still .t16c-keyout, .deck-thumb .t16c-keyout, .cc-still .t16c-keyin, .deck-thumb .t16c-keyin { animation: none !important; }
.cc-still .t16c-keyout, .deck-thumb .t16c-keyout { opacity: 0 !important; }
@media (prefers-reduced-motion: reduce) { .t16c-scroll, .t16c-scanline, .t16c-keyout, .t16c-keyin { animation: none !important; } }
${K.css()}
`
