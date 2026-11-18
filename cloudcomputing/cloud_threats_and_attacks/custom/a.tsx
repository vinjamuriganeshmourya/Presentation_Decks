import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName } from '@/engine/icons3d'
import {
  EASE, ORANGE, Frame, Plinth, MarkTile, Panel, Wire, Junction, Show, Token, useHot, useHeld, keyframes, loopCls, loopVars, tag, heading, type Pt,
} from '@/engine/figkit'
import shieldMark from '../images/aws-shield.svg'
import wafMark from '../images/aws-waf.svg'
import ec2Mark from '../images/aws-ec2.svg'
import edgeMark from '../images/res-cloudfront-edge-location.svg'

/*
 * SESSION 16 · SECTION 1 (Denial of Service) technical figures, builder A.
 * Built to generate-slides standing correction 17 (Session 13 visual standard): 3D icons on plinth tiles, official marks
 * on white tiles, >= 20 px equal padding, orthogonal wires computed from the same constants as the boxes, flow dots on
 * every wire, a lit item walking first -> last -> first after the build. Loops are transform / opacity on HTML elements
 * or root <svg>s only. Held (?still): the full final state, nothing lit, nothing moving. Class prefix `t16a-`.
 *
 *   slide 6  A_T01   526 x 330  pyramid of attack layers (3 steps)
 *   slide 7  A_T01B 1080 x 380  DoS vs DDoS, the TR's two pictures redrawn (2)
 *   slide 8  A_T02   566 x 370  botnet, reflection, amplification, IoT (4)
 *   slide 11 A_T04   566 x 330  volumetric: traffic chart, pipe, upstream defence (4)
 *   slide 12 A_T05   546 x 330  protocol: connection table, malformed packet (2)
 *   slide 13 A_T05B  566 x 380  application: CPU gauge, connection slots, Slowloris, normal traffic (3)
 *   slide 15 A_T06B 1080 x 420  rate limit, scrubbing, CDN edge into one origin (3)
 *   slide 16 A_T07   546 x 330  CloudFront edges, Shield, WAF, origin (4)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('t16a')
const BLUE = colors.brand
const INK = colors.ink
const MUTED = colors.muted

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)
const tr = (instant: boolean, what = 'opacity', ms = 520) => (instant ? 'none' : `${what} ${ms}ms ${EASE}`)

/** an absolutely placed tile + tag group whose TILE centre is (x, y) */
function Node({ x, y, size, label, children, w = 130, on = true, delay = 0, tagSize = 14, sub, z = 3 }: { x: number; y: number; size: number; label?: string; children: ReactNode; w?: number; on?: boolean; delay?: number; tagSize?: number; sub?: string; z?: number }) {
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, top: y - size / 2, width: w, zIndex: z, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: size, height: size, display: 'grid', placeItems: 'center' }}>{children}</div>
      {label && <span style={{ ...tag(tagSize), marginTop: 6 }}>{label}</span>}
      {sub && <span style={{ ...tag(tagSize - 1, MUTED), fontWeight: 500, marginTop: 2 }}>{sub}</span>}
    </Show>
  )
}

/** a small round badge holding a 3D icon, laid on a tile's lower-right corner */
function Corner({ name, size = 22, on = true, loop = 'pulse' as const, d = 0, top = false }: { name: Ico3DName; size?: number; on?: boolean; loop?: 'pulse' | 'bob' | 'beat'; d?: number; top?: boolean }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'absolute', right: -size * 0.32, ...(top ? { top: -size * 0.28 } : { bottom: -size * 0.28 }), width: size + 4, height: size + 4, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6)', display: 'grid', placeItems: 'center', opacity: on ? 1 : 0, transition: tr(instant), zIndex: 4 }}>
      <Ico3D name={name} size={size} loop={loop} d={d} t={2.4} />
    </span>
  )
}

/** two icons in one tile, crossfading on `alt` */
function Swap({ a, b, alt, size, d = 0 }: { a: Ico3DName; b: Ico3DName; alt: boolean; size: number; d?: number }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: size, height: size }}>
      <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: alt ? 0 : 1, transition: tr(instant) }}><Ico3D name={a} size={size} loop="bob" d={d} /></span>
      <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: alt ? 1 : 0, transition: tr(instant) }}><Ico3D name={b} size={size} loop="bob" d={d} /></span>
    </span>
  )
}

const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })

/* ================================================================== slide 6 · A_T01 · attack-layer pyramid */

/*
 * Three extruded tiers in a 526 x 330 stage, base to top: Volumetric (bandwidth, layers 3 and 4), Protocol (connection
 * state, layers 3 and 4), Application (compute, layer 7). The pyramid runs y 29..301 (3 x 84 + 2 x 10), centre x 263,
 * 200 wide at the top and 486 at the base (20 px each side). Press N builds tier N from the base up and lights it.
 */
const PY = { W: 526, H: 330, CX: 263, TOP: 29, TH: 84, GAP: 10, W0: 200, W1: 486 }
const pyW = (y: number) => PY.W0 + ((PY.W1 - PY.W0) * (y - PY.TOP)) / (PY.TH * 3 + PY.GAP * 2)
const TIERS: { name: string; res: string; layer: string; icon: Ico3DName }[] = [
  { name: 'Volumetric', res: 'Bandwidth', layer: 'Layer 3 · Layer 4', icon: 'pipe' },
  { name: 'Protocol', res: 'Connection State', layer: 'Layer 3 · Layer 4', icon: 'conntable' },
  { name: 'Application', res: 'Compute', layer: 'Layer 7', icon: 'cpu' },
]

const A_T01: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const instant = useInstant()
  const hot = useHot(3, step, 1800)
  return (
    <Frame w={PY.W} h={PY.H}>
      {TIERS.map((t, k) => {
        const row = 2 - k // 0 = top tier
        const y0 = PY.TOP + row * (PY.TH + PY.GAP)
        const y1 = y0 + PY.TH
        const a = pyW(y0) / 2
        const b = pyW(y1) / 2
        const on = held || step >= k + 1
        const lit = hot === k
        const pts = `${PY.CX - a},${y0} ${PY.CX + a},${y0} ${PY.CX + b},${y1} ${PY.CX - b},${y1}`
        return (
          <div key={t.name} style={{ position: 'absolute', inset: 0, transform: lit ? 'translateY(-4px)' : 'none', transition: tr(instant, 'transform', 420), zIndex: lit ? 3 : 2 }}>
            <svg aria-hidden width={PY.W} height={PY.H} viewBox={`0 0 ${PY.W} ${PY.H}`} style={{ position: 'absolute', inset: 0, overflow: 'visible', opacity: on ? 1 : 0.3, transition: tr(instant) }}>
              <defs>
                <linearGradient id={`t16a-py${k}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#FFFFFF" />
                  <stop offset="1" stopColor={['#D9E4FF', '#E2EAFF', '#EAF0FF'][k]} />
                </linearGradient>
              </defs>
              <polygon points={pts} transform="translate(0 5)" fill="#B8C8EE" />
              <polygon points={pts} fill={`url(#t16a-py${k})`} stroke={lit ? ORANGE : '#C3D3F5'} strokeWidth={lit ? 2.6 : 1.5} strokeLinejoin="round" style={{ transition: tr(instant, 'stroke', 420) }} />
            </svg>
            <Show on={on} delay={120} style={{ position: 'absolute', left: PY.CX - 150, top: y0, width: 300, height: PY.TH, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <Plinth size={50} lit={lit}><Ico3D name={t.icon} size={38} loop="bob" d={k * 0.5} /></Plinth>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={heading(17)}>{t.name}</span>
                <span style={{ ...tag(13.5, colors.brandDeep), textAlign: 'left' }}>{t.res}</span>
                <span style={{ ...tag(13, MUTED), fontWeight: 500, textAlign: 'left' }}>{t.layer}</span>
              </div>
            </Show>
          </div>
        )
      })}
    </Frame>
  )
}

/* ================================================================== slide 7 · A_T01B · DoS vs DDoS */

/*
 * The TR's two pictures (page 2-3) redrawn: two 520 x 380 cards, 20 apart. In each card (local coordinates, content
 * centred vertically by OY): the title, the source row (one Attacker, or Bot 1 to Bot 5 on a bus), the Target Server,
 * and User A / User B joined by the TR's dashed lines, each Blocked. Press 1 shows DoS, press 2 DDoS.
 */
const DD = { W: 1080, H: 380, CW: 540, OY: 6, SRC: 84, BUS: 146, SV: 194, US: 288, SX: 270, UX: [160, 380] }
const DD_BX = [78, 174, 270, 366, 462]
const DD_PANEL_X = [0, 540]
const ddPts = (px: number, pts: Pt[]): Pt[] => pts.map(([x, y]) => [x + px, y + DD.OY])
const DD_DOS = K.ride('dos', ddPts(DD_PANEL_X[0], [[DD.SX, DD.SRC + 46], [DD.SX, DD.SV - 28]]), 0, 0.9, 1.4)
const DD_DDOS = DD_BX.map((bx, i) => K.ride(`ddos${i}`, ddPts(DD_PANEL_X[1], [[bx, DD.SRC + 46], [bx, DD.BUS], [DD.SX, DD.BUS], [DD.SX, DD.SV - 28]]), i * 0.24, i * 0.24 + 1.1, 1.6))

function DdCard({ which, on, lit }: { which: 0 | 1; on: boolean; lit: boolean }) {
  const held = useHeld()
  const instant = useInstant()
  const px = DD_PANEL_X[which]
  const Y = (y: number) => y + DD.OY
  return (
    <Show on={on} style={{ position: 'absolute', left: px, top: 0, width: DD.CW, height: DD.H, zIndex: 2 }}>
      {/* no card inside the stage's own card: the half is open, and rings orange only while it is the part explained */}
      <div aria-hidden style={{ position: 'absolute', inset: 12, borderRadius: 18, boxShadow: lit ? `inset 0 0 0 2.5px ${ORANGE}` : 'inset 0 0 0 2.5px rgba(255,138,61,0)', transition: tr(instant, 'box-shadow', 420) }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: Y(20), textAlign: 'center', ...heading(21) }}>{which === 0 ? 'DoS' : 'DDoS'}</div>
      {which === 0 ? (
        <>
          <Node x={DD.SX} y={Y(DD.SRC)} size={46} label="Attacker"><Plinth size={46}><Ico3D name="laptop" size={34} loop="bob" /></Plinth></Node>
          <Wire pts={[[DD.SX, Y(DD.SRC + 46)], [DD.SX, Y(DD.SV - 28)]]} on={on} color={ORANGE} />
        </>
      ) : (
        <>
          {DD_BX.map((bx, i) => (
            <Node key={i} x={bx} y={Y(DD.SRC)} size={46} label={`Bot ${i + 1}`} w={90}>
              <span style={{ position: 'relative', display: 'grid' }}>
                <Plinth size={46}><Ico3D name="bot" size={34} loop="bob" d={i * 0.35} /></Plinth>
                <Corner name="alert" size={16} d={i * 0.3} />
              </span>
            </Node>
          ))}
          {DD_BX.map((bx, i) => (bx === DD.SX ? null : <Wire key={i} pts={[[bx, Y(DD.SRC + 46)], [bx, Y(DD.BUS)], [DD.SX, Y(DD.BUS)]]} on={on} head={0} color={ORANGE} delay={i * 80} />))}
          <Wire pts={[[DD.SX, Y(DD.SRC + 46)], [DD.SX, Y(DD.SV - 28)]]} on={on} color={ORANGE} />
          <Junction x={DD.SX} y={Y(DD.BUS)} on={on} lit />
        </>
      )}
      {/* the target: overwhelmed, it shakes */}
      <div style={{ position: 'absolute', left: DD.SX - 60, top: Y(DD.SV - 28), width: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3 }}>
        <span className={held ? undefined : loopCls('shake')} style={{ display: 'grid', position: 'relative', ...loopVars(0, which === 0 ? 1.4 : 0.8) }}>
          <Plinth size={56} warm><Ico3D name="server" size={42} loop="none" /></Plinth>
          <Corner name="alert" size={18} loop="beat" />
        </span>
        <span style={{ ...tag(14), marginTop: 6 }}>Target Server</span>
      </div>
      {/* the TR's dashed lines to the two users, each blocked */}
      <Wire pts={[[DD.SX - 28, Y(DD.SV)], [DD.UX[0], Y(DD.SV)], [DD.UX[0], Y(DD.US - 24)]]} on={on} head={0} dash="5 6" color="#9AAACB" width={2} />
      <Wire pts={[[DD.SX + 28, Y(DD.SV)], [DD.UX[1], Y(DD.SV)], [DD.UX[1], Y(DD.US - 24)]]} on={on} head={0} dash="5 6" color="#9AAACB" width={2} />
      {DD.UX.map((ux, i) => (
        <Node key={i} x={ux} y={Y(DD.US)} size={46} label={i === 0 ? 'User A' : 'User B'} sub="Blocked" w={110}>
          <span style={{ position: 'relative', display: 'grid' }}>
            <Plinth size={46}><Ico3D name="user" size={34} loop="bob" d={0.6 + i * 0.4} /></Plinth>
            <Corner name="cross" size={16} loop="beat" d={i * 0.5} />
          </span>
        </Node>
      ))}
    </Show>
  )
}

const A_T01B: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const hot = useHot(2, step, 2600)
  return (
    <Frame w={DD.W} h={DD.H}>
      <div aria-hidden style={box(DD.CW - 1, 36, 2, DD.H - 72, { background: '#D3DEF6', borderRadius: 1 })} />
      <DdCard which={0} on={held || step >= 1} lit={hot === 0} />
      <DdCard which={1} on={held || step >= 2} lit={hot === 1} />
      <Token cls={DD_DOS} tone={ORANGE} on={step >= 1} />
      {DD_DDOS.map((c, i) => <Token key={i} cls={c} tone={ORANGE} on={step >= 2} />)}
    </Frame>
  )
}

/* ================================================================== slide 8 · A_T02 · botnet and amplification */

/*
 * 566 x 330, left to right: Attacker -> C2 Server -> four bots -> three Open Servers -> Target, every wire orthogonal.
 * Press 1 the C2 sends its orders down the fan (blue dots); press 2 the Open Servers appear, each bot's query carries a
 * mask (spoofed address) and small replies reach the target; press 3 every reply leaves far larger than its query
 * (amplification); press 4 the bots turn into IoT devices.
 */
const BN = { W: 566, H: 370, Y: 195, AX: 56, CX: 150, BX: 268, SX: 392, TX: 506, FAN: 212, BUS: 330, TBUS: 450 }
const BN_BY = [88, 158, 228, 298]
const BN_SY = [120, 195, 270]
const BN_MAP = [0, 1, 1, 2]
const BN_IOT: Ico3DName[] = ['camera', 'router', 'phone', 'laptop']
const BN_ORDER = BN_BY.map((by, i) => K.ride(`order${i}`, [[176, BN.Y], [BN.FAN, BN.Y], [BN.FAN, by], [246, by]], 0.1 + i * 0.18, 0.9 + i * 0.18, 2.2))
const BN_QUERY = BN_BY.map((by, i) => K.ride(`query${i}`, [[290, by], [BN.BUS, by], [BN.BUS, BN_SY[BN_MAP[i]]], [368, BN_SY[BN_MAP[i]]]], 0.1 + i * 0.22, 0.9 + i * 0.22, 2.4))
const BN_REPLY = BN_SY.map((sy, j) => K.ride(`reply${j}`, [[416, sy], [BN.TBUS, sy], [BN.TBUS, BN.Y], [478, BN.Y]], 1.1 + j * 0.25, 1.9 + j * 0.25, 2.4))

const A_T02: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const hot = useHot(4, step, 1600)
  const s1 = held || step >= 1
  const s2 = held || step >= 2
  const s3 = held || step >= 3
  const s4 = held || step >= 4
  return (
    <Frame w={BN.W} h={BN.H}>
      {/* attacker -> C2 -> the fan */}
      <Wire pts={[[82, BN.Y], [124, BN.Y]]} />
      {BN_BY.map((by, i) => <Wire key={i} pts={[[176, BN.Y], [BN.FAN, BN.Y], [BN.FAN, by], [246, by]]} lit={hot === 0} delay={i * 90} />)}
      {/* bots -> open servers (spoofed queries) */}
      {/* bots -> open servers: small spoofed requests, thin */}
      {BN_BY.map((by, i) => <Wire key={`q${i}`} pts={[[290, by], [BN.BUS, by]]} on={s2} head={0} color={ORANGE} width={1.5} />)}
      <Wire pts={[[BN.BUS, BN_BY[0]], [BN.BUS, BN_BY[3]]]} on={s2} head={0} color={ORANGE} width={1.5} />
      {BN_SY.map((sy, j) => <Wire key={`s${j}`} pts={[[BN.BUS, sy], [368, sy]]} on={s2} color={ORANGE} width={1.5} head={7} delay={300} />)}
      {/* open servers -> target: large replies, thick */}
      {BN_SY.map((sy, j) => <Wire key={`r${j}`} pts={sy === BN.Y ? [[416, sy], [478, sy]] : [[416, sy], [BN.TBUS, sy], [BN.TBUS, BN.Y]]} on={s2} head={sy === BN.Y ? 15 : 0} color={ORANGE} width={6} delay={500} />)}
      {/* the two arrow labels: each a callout whose leader ends ON the arrow it names, at the top open server:
          the thin request going INTO it (x 349) and the thick reply coming OUT of it (x 433) */}
      {[
        { x: 349, cx: 300, w: 196, top: 12, text: <>Small request<br />(spoofed source: Target IP)</>, d: 400 },
        { x: 433, cx: 452, w: 104, top: 29, text: <>Large reply</>, d: 600 },
      ].map((l) => (
        <div key={l.x}>
          <Wire pts={[[l.x, l.top + (l.w > 150 ? 42 : 25)], [l.x, BN_SY[0] - 5]]} on={s2} head={0} width={1.4} color="#E9A774" dash="3 3" />
          <Show on={s2} delay={l.d + 300} style={{ position: 'absolute', left: l.x - 4, top: BN_SY[0] - 4, width: 8, height: 8, borderRadius: 99, background: '#C2541C', boxShadow: '0 0 0 2px #FFFFFF', zIndex: 4 }}><span /></Show>
          <Show on={s2} delay={l.d} style={{ position: 'absolute', left: l.cx - l.w / 2, top: l.top, width: l.w, padding: '3px 8px', borderRadius: 9, background: '#FFF6EE', boxShadow: 'inset 0 0 0 1.5px #FFD2B0', ...tag(13, '#C2541C'), whiteSpace: 'normal', lineHeight: 1.2, zIndex: 3 }}>{l.text}</Show>
        </div>
      ))}
      <Junction x={BN.TBUS} y={BN.Y} on={s2} lit />

      <Node x={BN.AX} y={BN.Y} size={52} label="Attacker" w={100}><Plinth size={52}><Ico3D name="laptop" size={38} loop="bob" /></Plinth></Node>
      <Node x={BN.CX} y={BN.Y} size={52} label="C2 Server" w={100}>
        <span style={{ position: 'relative', display: 'grid' }}>
          <Plinth size={52} lit={hot === 0}><Ico3D name="server" size={38} loop="bob" d={0.4} /></Plinth>
          <Corner name="megaphone" size={20} loop={s1 ? 'beat' : 'pulse'} top />
        </span>
      </Node>
      {BN_BY.map((by, i) => (
        <div key={i} style={{ position: 'absolute', left: BN.BX - 22, top: by - 22, width: 44, height: 44, zIndex: 3 }}>
          <Plinth size={44} lit={hot === 3}><Swap a="bot" b={BN_IOT[i]} alt={s4} size={32} d={i * 0.3} /></Plinth>
          <Corner name="mask" size={18} on={s2} d={i * 0.3} top />
        </div>
      ))}
      <div style={{ position: 'absolute', left: BN.BX - 60, top: 328, width: 120, height: 18, ...tag(14), zIndex: 3 }}>
        <span style={{ position: 'absolute', inset: 0, opacity: s4 ? 0 : 1, transition: 'opacity 520ms' }}>Bots</span>
        <span style={{ position: 'absolute', inset: 0, opacity: s4 ? 1 : 0, transition: 'opacity 520ms' }}>IoT Devices</span>
      </div>
      {BN_SY.map((sy, j) => (
        <Show key={j} on={s2} delay={200 + j * 90} style={{ position: 'absolute', left: BN.SX - 24, top: sy - 24, zIndex: 3 }}>
          <Plinth size={48} lit={hot === 1}><Ico3D name="server" size={34} loop="bob" d={j * 0.4} /></Plinth>
        </Show>
      ))}
      <Show on={s2} delay={300} style={{ position: 'absolute', left: BN.SX - 60, top: 300, width: 120, ...tag(14), zIndex: 3 }}>Open Servers</Show>
      <Node x={BN.TX} y={BN.Y} size={56} label="Target" w={90}>
        <span className={s3 && !held ? loopCls('shake') : undefined} style={{ display: 'grid', position: 'relative', ...loopVars(0, 1.1) }}>
          <Plinth size={56} lit={hot === 2} warm={s3}><Ico3D name="server" size={42} loop="none" /></Plinth>
        </span>
      </Node>

      {BN_ORDER.map((c, i) => <Token key={i} cls={c} tone={BLUE} size={9} on={s1} />)}
      {BN_QUERY.map((c, i) => <Token key={`q${i}`} cls={c} tone={ORANGE} size={6} on={s2} />)}
      {BN_REPLY.map((c, j) => <Token key={`r${j}`} cls={c} tone={ORANGE} size={s3 ? 18 : 14} on={s2} />)}
    </Frame>
  )
}

/* ================================================================== slide 11 · A_T04 · volumetric */

/*
 * 566 x 330. Top: the traffic chart card (20..546 x 20..148): Gbps up the side, the dashed Link Capacity line, the
 * incoming line climbing past it, the excess above it shaded orange. Bottom row (centre y 238): UDP and the DNS / NTP
 * open servers feed one wire into the Link (a pipe) and on to the Application, which sits idle: no dot reaches it.
 * Press 1 UDP packets stream in; 2 DNS and NTP send oversized replies; 3 the pipe fills and the excess shows;
 * 4 a defence shield drops in UPSTREAM of the pipe.
 */
const VL = { W: 566, H: 330, Y: 238, CAP: 58, PL: 214, PR: 426, AX: 506, JX: 124, SHX: 170 }
const VL_LINE: Pt[] = [[56, 104], [120, 98], [180, 92], [240, 80], [300, 62], [360, 46], [420, 32], [470, 24], [506, 20]]
const VL_LEN = VL_LINE.slice(1).reduce((a, q, i) => a + Math.hypot(q[0] - VL_LINE[i][0], q[1] - VL_LINE[i][1]), 0)
const VL_UDP = [0, 1, 2].map((i) => K.ride(`udp${i}`, [[74, 196], [VL.JX, 196], [VL.JX, VL.Y], [VL.PR - 12, VL.Y]], i * 0.5, i * 0.5 + 1.2, 1.5))
const VL_AMP = [0, 1].map((i) => K.ride(`amp${i}`, [[102, 270], [VL.JX, 270], [VL.JX, VL.Y], [VL.PR - 16, VL.Y]], 0.3 + i * 0.9, 1.5 + i * 0.9, 1.8))

const A_T04: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const instant = useInstant()
  const hot = useHot(4, step, 1600)
  const s1 = held || step >= 1
  const s2 = held || step >= 2
  const s3 = held || step >= 3
  const s4 = held || step >= 4
  const fill = s3 ? 1 : s2 ? 0.7 : s1 ? 0.4 : 0
  const area = `${VL_LINE.map((q) => q.join(',')).join(' ')} 506,110 56,110`
  return (
    <Frame w={VL.W} h={VL.H}>
      {/* the chart */}
      <Panel x={20} y={20} w={526} h={128}>
        <svg aria-hidden width={526} height={128} viewBox="0 0 526 128" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <defs>
            <clipPath id="t16a-cap"><rect x={0} y={0} width={526} height={VL.CAP} /></clipPath>
          </defs>
          <path d="M 56 14 V 110 H 506" fill="none" stroke="#B9C7E6" strokeWidth={1.5} />
          <line x1={56} x2={506} y1={VL.CAP} y2={VL.CAP} stroke={MUTED} strokeWidth={1.6} strokeDasharray="6 5" />
          <polyline points={VL_LINE.map((q) => q.join(',')).join(' ')} fill="none" stroke={BLUE} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={VL_LEN} strokeDashoffset={s1 ? 0 : VL_LEN} style={{ transition: instant ? 'none' : `stroke-dashoffset 1100ms ${EASE}` }} />
        </svg>
        {/* the excess above capacity, its own svg so its breathing is composited */}
        <div style={{ position: 'absolute', inset: 0, opacity: s3 ? 1 : 0, transition: tr(instant) }}>
          <svg aria-hidden width={526} height={128} viewBox="0 0 526 128" className={loopCls('glow')} style={{ position: 'absolute', inset: 0, overflow: 'visible', ...loopVars(0, 2.4) }}>
            <polygon points={area} fill={ORANGE} opacity={0.42} clipPath="url(#t16a-cap)" />
          </svg>
        </div>
        <span style={{ position: 'absolute', left: 12, top: 8, ...tag(13, MUTED) }}>Gbps</span>
        <span style={{ position: 'absolute', left: 66, top: VL.CAP - 22, ...tag(13, MUTED) }}>Link Capacity</span>
      </Panel>

      {/* the bottom row: sources, one wire, defence, pipe, application */}
      <Wire pts={[[74, 196], [VL.JX, 196], [VL.JX, VL.Y]]} head={0} on={s1} color={ORANGE} />
      <Wire pts={[[102, 270], [VL.JX, 270], [VL.JX, VL.Y]]} head={0} on={s2} color={ORANGE} />
      <Wire pts={[[VL.JX, VL.Y], [VL.PL, VL.Y]]} on={s1} color={ORANGE} />
      <Junction x={VL.JX} y={VL.Y} on={s1} lit />
      <Wire pts={[[VL.PR, VL.Y], [VL.AX - 28, VL.Y]]} />

      <Node x={52} y={196} size={44} label="UDP" w={70}><Plinth size={44} lit={hot === 0}><Ico3D name="wave" size={32} loop="bob" /></Plinth></Node>
      {[['DNS', 38], ['NTP', 84]].map(([n, x], i) => (
        <Node key={n} x={x as number} y={270} size={36} label={n as string} w={52} on={s2} delay={i * 100} tagSize={13}>
          <span style={{ position: 'relative', display: 'grid' }}>
            <Plinth size={36} lit={hot === 1}><Ico3D name="server" size={26} loop="bob" d={i * 0.5} /></Plinth>
            <Corner name="mask" size={14} d={i * 0.4} />
          </span>
        </Node>
      ))}
      <Node x={VL.SHX} y={VL.Y} size={44} label="Defence" w={84} on={s4} z={6}><Plinth size={44} lit={hot === 3}><Ico3D name="shield" size={32} loop="pulse" /></Plinth></Node>

      {/* the link: a pipe that fills */}
      <div style={box(VL.PL, VL.Y - 17, VL.PR - VL.PL, 34, { borderRadius: 17, background: 'linear-gradient(180deg, #F4F7FF 0%, #DCE5FA 100%)', boxShadow: hot === 2 ? `inset 0 0 0 2.5px ${ORANGE}` : 'inset 0 0 0 1.5px #C3D3F5, inset 0 3px 6px rgba(31,64,140,0.12)', overflow: 'hidden', zIndex: 2, transition: tr(instant, 'box-shadow', 420) })}>
        <div style={{ position: 'absolute', left: 4, top: 4, bottom: 4, width: VL.PR - VL.PL - 8, borderRadius: 13, transformOrigin: '0 50%', transform: `scaleX(${fill})`, background: s3 ? `linear-gradient(90deg, #FFB37A, ${ORANGE})` : 'linear-gradient(90deg, #9DB8FF, #5E86FA)', transition: instant ? 'none' : `transform 900ms ${EASE}, background 520ms ${EASE}` }} />
        {s3 && !held && <div className={loopCls('glow')} style={{ position: 'absolute', inset: 4, borderRadius: 13, background: 'rgba(255,255,255,0.28)', ...loopVars(0, 1.6) }} />}
      </div>
      <span style={{ position: 'absolute', left: (VL.PL + VL.PR) / 2 - 40, top: VL.Y + 24, width: 80, ...tag(14), zIndex: 3 }}>Link</span>
      <Node x={VL.AX} y={VL.Y} size={56} label="Application" w={110}><Plinth size={56}><Ico3D name="webpage" size={42} loop="bob" d={0.8} /></Plinth></Node>

      {VL_UDP.map((c, i) => <Token key={i} cls={c} tone={ORANGE} size={8} on={s1} />)}
      {VL_AMP.map((c, i) => <Token key={`a${i}`} cls={c} tone={ORANGE} size={17} on={s2} />)}
    </Frame>
  )
}

/* ================================================================== slide 12 · A_T05 · protocol: SYN flood, malformed packets */

/*
 * 546 x 330. Left: SYN Requests (y 110) and a User (y 238). Middle: the server's Connection Table card (150..400 x
 * 20..312) with five slots. Right: Malformed Packets (y 70) feeding the Parser (y 236) straight down; the table has
 * no wire to the parser (they are two separate attacks). Press 1: SYN entries fill every slot and never complete
 * (each with a blinking hourglass); the user's request bounces off the full table. Press 2: a malformed packet
 * reaches the parser, which cracks.
 */
const SY = { W: 546, H: 330, LX: 64, RY: 110, UY: 238, TX: 152, TW: 250, TY: 19, TH: 292, PX: 476, PY: 236, MY: 70 }
const SY_SYN = [0, 1, 2].map((i) => K.ride(`syn${i}`, [[90, SY.RY], [SY.TX - 4, SY.RY]], i * 0.5, i * 0.5 + 0.8, 1.5))
const SY_USER = K.ride('user', [[90, SY.UY], [SY.TX - 6, SY.UY], [94, SY.UY]], 0.2, 1.8, 2.4)
const SY_PKT = K.ride('pkt', [[SY.PX, SY.MY + 74], [SY.PX, SY.PY - 34]], 0.2, 1.2, 2.2, 1.1)

const A_T05: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const instant = useInstant()
  const hot = useHot(2, step, 2200)
  const s1 = held || step >= 1
  const s2 = held || step >= 2
  return (
    <Frame w={SY.W} h={SY.H}>
      <Wire pts={[[90, SY.RY], [SY.TX, SY.RY]]} color={ORANGE} />
      <Wire pts={[[90, SY.UY], [SY.TX, SY.UY]]} />
      <Wire pts={[[SY.PX, SY.MY + 70], [SY.PX, SY.PY - 28]]} on={s2} color={ORANGE} />

      <Node x={SY.PX} y={SY.MY} size={52} w={100} on={s2}><Plinth size={52} lit={hot === 1}><Ico3D name="package" size={38} loop="bob" badge="alert" /></Plinth></Node>
      <Show on={s2} style={{ position: 'absolute', left: SY.PX - 50, top: SY.MY + 32, width: 100, ...tag(14), whiteSpace: 'normal', zIndex: 3 }}>Malformed<br />Packets</Show>
      <Node x={SY.LX} y={SY.RY} size={52} label="SYN Requests" w={120}><Plinth size={52}><Ico3D name="bot" size={38} loop="bob" /></Plinth></Node>
      <Node x={SY.LX} y={SY.UY} size={52} label="User" w={100}>
        <span style={{ position: 'relative', display: 'grid' }}>
          <Plinth size={52}><Ico3D name="user" size={38} loop="bob" d={0.5} /></Plinth>
          <Corner name="cross" size={18} on={s1} loop="beat" />
        </span>
      </Node>

      <Panel x={SY.TX} y={SY.TY} w={SY.TW} h={SY.TH} lit={hot === 0}>
        <div style={{ position: 'absolute', left: 20, right: 20, top: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Plinth size={40}><Ico3D name="conntable" size={30} loop="bob" /></Plinth>
          <span style={heading(16)}>Connection Table</span>
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ position: 'absolute', left: 20, right: 20, top: 72 + i * 42, height: 34, borderRadius: 9, boxShadow: s1 ? 'inset 0 0 0 1.5px #FFC9A0' : 'inset 0 0 0 1.5px #D3DEF6', background: s1 ? 'linear-gradient(180deg, #FFFFFF 0%, #FFF1E6 100%)' : '#F7F9FE', transition: instant ? 'none' : `background 420ms ${EASE} ${i * 140}ms, box-shadow 420ms ${EASE} ${i * 140}ms` }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', opacity: s1 ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE} ${i * 140}ms` }}>
              <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontWeight: 700, fontSize: 15, color: colors.brandDeep, fontVariantLigatures: 'none' }}>SYN</span>
              <span className={held ? undefined : loopCls('blink')} style={{ display: 'grid', ...loopVars(i * 0.3, 1.8) }}><Ico3D name="hourglass" size={24} loop="none" /></span>
            </div>
          </div>
        ))}
      </Panel>

      <Node x={SY.PX} y={SY.PY} size={56} label="Parser" w={90} on={s2}>
        <span className={held ? undefined : loopCls('shake')} style={{ display: 'grid', position: 'relative', ...loopVars(0, 1.2) }}>
          <Plinth size={56} lit={hot === 1}><Ico3D name="gear" size={42} loop="none" /></Plinth>
          <Corner name="cross" size={18} loop="beat" />
        </span>
      </Node>

      {SY_SYN.map((c, i) => <Token key={i} cls={c} tone={ORANGE} size={9} on={s1} />)}
      <Token cls={SY_USER} tone={BLUE} size={10} on={s1} />
      <Token cls={SY_PKT} tone={ORANGE} size={14} square on={s2} />
    </Frame>
  )
}

/* ================================================================== slide 13 · A_T05B · application: HTTP flood, Slowloris */

/*
 * 566 x 380. Left: HTTP (y 128) and Slowloris (y 256). Middle: the Web Server card (176..400 x 30..350): the server at
 * the top, a Connection Slots box (four slots) on the left, the CPU gauge on the right. Right: the Traffic meter,
 * reading inside its normal band. Press 1 page requests run in past the server and down into the CPU gauge, which
 * pegs; press 2 four thin, slow connections each take one slot and lock it; press 3 the traffic meter appears, still
 * normal.
 */
const AP = { W: 566, H: 380, LX: 66, HY: 128, LY: 256, SX: 176, SW: 224, SY: 30, SH: 320, MX: 488, MY: 160, FAN: 122 }
/* the slots box, in card coordinates; its four rows' centres in figure coordinates */
const CS = { X: 14, Y: 112, W: 78, H: 188, R0: 48, RH: 26, RG: 8 }
const AP_FAN = [0, 1, 2, 3].map((k) => AP.SY + CS.Y + CS.R0 + k * (CS.RH + CS.RG) + CS.RH / 2)
const G = { CX: 158, CY: 236, R: 42 }
const AP_HX = AP.SX + G.CX
const AP_HTIP = AP.SY + G.CY - G.R - 10
const AP_HTTP = [0, 1, 2, 3].map((i) => K.ride(`http${i}`, [[92, AP.HY], [AP_HX, AP.HY], [AP_HX, AP_HTIP - 4]], i * 0.3, i * 0.3 + 0.9, 1.4))
const AP_SLOW = AP_FAN.map((y, i) => K.ride(`slow${i}`, [[88, AP.LY], [AP.FAN, AP.LY], [AP.FAN, y], [AP.SX + CS.X + 2, y]], i * 1.4, i * 1.4 + 5, 7))

const A_T05B: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const instant = useInstant()
  const hot = useHot(3, step, 2000)
  const s1 = held || step >= 1
  const s2 = held || step >= 2
  const s3 = held || step >= 3
  const angle = s1 ? 78 : -70
  const arc = (a0: number, a1: number) => {
    const P = (a: number) => [G.CX + G.R * Math.cos(((a - 90) * Math.PI) / 180), G.CY + G.R * Math.sin(((a - 90) * Math.PI) / 180)]
    const [x0, y0] = P(a0)
    const [x1, y1] = P(a1)
    return `M ${x0} ${y0} A ${G.R} ${G.R} 0 0 1 ${x1} ${y1}`
  }
  return (
    <Frame w={AP.W} h={AP.H}>

      <Node x={AP.LX} y={AP.HY} size={52} label="HTTP" w={90}><Plinth size={52} lit={hot === 0}><Ico3D name="webpage" size={38} loop="bob" /></Plinth></Node>
      <Node x={AP.LX} y={AP.LY} size={52} label="Slowloris" w={100} on={s2}><Plinth size={52} lit={hot === 1}><Ico3D name="hourglass" size={38} loop="tilt" /></Plinth></Node>

      <Panel x={AP.SX} y={AP.SY} w={AP.SW} h={AP.SH}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 12, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Plinth size={46}><Ico3D name="server" size={34} loop="bob" d={0.3} /></Plinth>
          <span style={{ ...tag(15), marginTop: 6 }}>Web Server</span>
        </div>
        {/* the connection slots: each Slowloris connection holds one open, locked */}
        <div style={box(CS.X, CS.Y, CS.W, CS.H, { borderRadius: 12, background: '#F7F9FE', boxShadow: hot === 1 ? `inset 0 0 0 2px ${ORANGE}` : 'inset 0 0 0 1.5px #D3DEF6', transition: tr(instant, 'box-shadow', 420) })}>
          <div style={{ position: 'absolute', left: 4, right: 4, top: 8, ...tag(12.5), whiteSpace: 'normal', lineHeight: 1.15 }}>Connection Slots</div>
          {[0, 1, 2, 3].map((k) => (
            <div key={k} style={box(8, CS.R0 + k * (CS.RH + CS.RG), CS.W - 16, CS.RH, { borderRadius: 7, overflow: 'hidden', background: '#FFFFFF', boxShadow: 'inset 0 0 0 1.5px #D3DEF6' })}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: 7, background: 'linear-gradient(180deg, #FFFFFF 0%, #FFE9D8 100%)', boxShadow: 'inset 0 0 0 1.5px #FFC9A0', display: 'grid', placeItems: 'center', opacity: s2 ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE} ${600 + k * 160}ms` }}>
                <Ico3D name="lock" size={18} loop="none" />
              </div>
            </div>
          ))}
        </div>
        <svg aria-hidden width={AP.SW} height={AP.SH} viewBox={`0 0 ${AP.SW} ${AP.SH}`} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <defs>
            <linearGradient id="t16a-gauge" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#9DB8FF" />
              <stop offset="0.6" stopColor={BLUE} />
              <stop offset="1" stopColor={ORANGE} />
            </linearGradient>
          </defs>
          <path d={arc(-90, 90)} fill="none" stroke="#E3EAF8" strokeWidth={12} strokeLinecap="round" />
          <path d={arc(-90, 90)} fill="none" stroke="url(#t16a-gauge)" strokeWidth={12} strokeLinecap="round" opacity={0.9} />
        </svg>
        {/* the needle: rotation on one HTML box, its tremble on another (composited) */}
        <div style={box(G.CX - 40, G.CY - 40, 80, 80, { transform: `rotate(${angle}deg)`, transition: instant ? 'none' : `transform 1100ms ${EASE}` })}>
          <div className={s1 && !held ? 't16a-trem' : undefined} style={{ position: 'absolute', inset: 0 }}>
            <svg aria-hidden width={80} height={80} viewBox="0 0 160 160" style={{ position: 'absolute', inset: 0 }}>
              <path d="M 80 16 L 86 80 L 74 80 Z" fill={INK} />
            </svg>
          </div>
        </div>
        <span style={box(G.CX - 7, G.CY - 7, 14, 14, { borderRadius: 99, background: INK, boxShadow: '0 0 0 3px #FFFFFF' })} />
        <span style={{ position: 'absolute', left: G.CX - 50, width: 100, top: G.CY + 16, ...tag(15) }}>CPU</span>
      </Panel>

      {/* the wires run INTO the card, so they are laid over it */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none' }}>
        {/* HTTP: in past the server, then down to the CPU gauge */}
        <Wire pts={[[92, AP.HY], [AP_HX, AP.HY], [AP_HX, AP_HTIP]]} color={ORANGE} on={s1} />
        {/* Slowloris: one thin connection into each slot */}
        {AP_FAN.map((y, i) => <Wire key={i} pts={[[88, AP.LY], [AP.FAN, AP.LY], [AP.FAN, y], [AP.SX + CS.X + 6, y]]} on={s2} color={ORANGE} width={1.5} head={7} delay={i * 120} />)}
      </div>
      {/* traffic meter: still inside its normal band */}
      <Node x={AP.MX} y={AP.MY} size={54} label="Traffic" w={110} on={s3}><Plinth size={54} lit={hot === 2}><Ico3D name="meter" size={40} loop="bob" d={0.5} /></Plinth></Node>
      <Show on={s3} delay={150} style={box(AP.MX - 56, AP.MY + 62, 112, 18, { zIndex: 3 })}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 9, background: '#EEF2FA', boxShadow: 'inset 0 0 0 1.5px #D3DEF6' }} />
        <div style={{ position: 'absolute', left: 4, top: 4, bottom: 4, width: 46, borderRadius: 6, background: '#C9D8FF' }} />
        <div className={held ? undefined : 't16a-level'} style={{ position: 'absolute', left: 28, top: -3, width: 4, height: 24, borderRadius: 2, background: BLUE }} />
      </Show>

      {AP_HTTP.map((c, i) => <Token key={i} cls={c} tone={ORANGE} size={9} on={s1} />)}
      {AP_SLOW.map((c, i) => <Token key={`s${i}`} cls={c} tone={ORANGE} size={6} on={s2} />)}
    </Frame>
  )
}

/* ================================================================== slide 15 · A_T06B · three mitigations, one origin */

/*
 * 1080 x 420. Traffic (x 92) splits at x 210 into three cards (380..640, rows y 90 / 210 / 330, in the table's order:
 * Rate Limit, Scrubbing, CDN Edge); each drops the attack (orange dots stop at the card, a ban icon pulses) and
 * forwards only legitimate traffic (blue dots) to one Origin (x 988). Press N shows branch N; then all run together
 * while the light walks the three.
 */
const MT = { W: 1080, H: 420, SX: 92, Y: 210, J: 210, CX: 380, CW: 260, CH: 100, OB: 760, OX: 988 }
const MT_Y = [90, 210, 330]
const MT_CARD: { label: string; icon: Ico3DName }[] = [
  { label: 'Rate Limit', icon: 'gauge' },
  { label: 'Scrubbing', icon: 'filter' },
  { label: 'CDN Edge', icon: 'globe' },
]
const MT_BAD = MT_Y.map((y, k) => K.ride(`bad${k}`, [[MT.SX + 34, MT.Y], [MT.J, MT.Y], [MT.J, y], [MT.CX + 6, y]], 0.1 + k * 0.3, 1.1 + k * 0.3, 2.4))
const MT_IN = MT_Y.map((y, k) => K.ride(`in${k}`, [[MT.SX + 34, MT.Y], [MT.J, MT.Y], [MT.J, y], [MT.CX + 6, y]], 1.2 + k * 0.3, 2.1 + k * 0.3, 3.6))
const MT_OUT = MT_Y.map((y, k) => K.ride(`out${k}`, y === MT.Y ? [[MT.CX + MT.CW, y], [MT.OX - 38, y]] : [[MT.CX + MT.CW, y], [MT.OB, y], [MT.OB, MT.Y], [MT.OX - 38, MT.Y]], 2.3 + k * 0.3, 3.3 + k * 0.3, 3.6))

const A_T06B: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const hot = useHot(3, step, 1800)
  return (
    <Frame w={MT.W} h={MT.H}>
      <Wire pts={[[MT.SX + 34, MT.Y], [MT.J, MT.Y]]} head={0} />
      <Junction x={MT.J} y={MT.Y} />
      {MT_Y.map((y, k) => {
        const on = held || step >= k + 1
        return (
          <div key={k}>
            <Wire pts={y === MT.Y ? [[MT.J, y], [MT.CX, y]] : [[MT.J, MT.Y], [MT.J, y], [MT.CX, y]]} on={on} lit={hot === k} />
            <Wire pts={y === MT.Y ? [[MT.CX + MT.CW, y], [MT.OB, y]] : [[MT.CX + MT.CW, y], [MT.OB, y], [MT.OB, MT.Y]]} on={on} head={0} delay={300} />
            <Panel x={MT.CX} y={y - MT.CH / 2} w={MT.CW} h={MT.CH} on={on} lit={hot === k}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 14, padding: '0 20px' }}>
                <Plinth size={60}><Ico3D name={MT_CARD[k].icon} size={44} loop="bob" d={k * 0.4} /></Plinth>
                <span style={{ ...heading(19), flex: 1 }}>{MT_CARD[k].label}</span>
                <Ico3D name="ban" size={30} loop="beat" d={k * 0.5} />
              </div>
            </Panel>
          </div>
        )
      })}
      <Junction x={MT.OB} y={MT.Y} on={held || step >= 1} />
      <Wire pts={[[MT.OB, MT.Y], [MT.OX - 36, MT.Y]]} on={held || step >= 1} delay={400} />
      <Node x={MT.SX} y={MT.Y} size={68} label="Traffic" w={110}><Plinth size={68}><Ico3D name="wave" size={50} loop="bob" /></Plinth></Node>
      <Node x={MT.OX} y={MT.Y} size={72} label="Origin" w={110}><Plinth size={72}><Ico3D name="server" size={54} loop="bob" d={0.6} /></Plinth></Node>

      {MT_Y.map((_, k) => {
        const on = step >= k + 1
        return (
          <span key={k}>
            <Token cls={MT_BAD[k]} tone={ORANGE} size={11} on={on} />
            <Token cls={MT_IN[k]} tone={BLUE} size={11} on={on} />
            <Token cls={MT_OUT[k]} tone={BLUE} size={11} on={on} />
          </span>
        )
      })}
    </Frame>
  )
}

/* ================================================================== slide 16 · A_T07 · CloudFront, Shield, WAF */

/*
 * 546 x 330. Left: a globe ringed by six CloudFront edge locations (official resource mark on white tiles, ring centre
 * 122,148, radius 82). The edge at angle 0 feeds Shield -> WAF -> Origin (EC2), y 148. Under Shield and WAF, the
 * Shield Advanced card: application layer, response team, cost protection. Press 1 Shield Standard pulses, always on;
 * 2 the Advanced card; 3 WAF throttles a dense stream to a trickle; 4 the edges absorb a flood.
 */
const AW = { W: 546, H: 330, GX: 122, GY: 128, R: 82, ES: 34, Y: 128, SH: 286, WF: 386, OR: 486 }
const AW_EDGES = [0, 60, 120, 180, 240, 300].map((a) => [AW.GX + AW.R * Math.cos((a * Math.PI) / 180), AW.GY + AW.R * Math.sin((a * Math.PI) / 180), a] as const)
const AW_DENSE = [0, 1, 2, 3, 4].map((i) => K.ride(`dense${i}`, [[221, AW.Y], [AW.WF - 30, AW.Y]], i * 0.24, i * 0.24 + 0.8, 1.2))
const AW_TRICKLE = K.ride('trickle', [[AW.WF + 28, AW.Y], [AW.OR - 30, AW.Y]], 0.3, 1.4, 2.4)
const AW_FLOOD = AW_EDGES.filter((e) => e[2] !== 0).map(([x, y, a], i) => {
  const dx = Math.cos((a * Math.PI) / 180)
  const dy = Math.sin((a * Math.PI) / 180)
  return K.ride(`flood${i}`, [[x + dx * 34, y + dy * 34], [x + dx * 14, y + dy * 14]], i * 0.3, i * 0.3 + 0.7, 1.8, 0.3)
})

const A_T07: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const hot = useHot(4, step, 1700)
  const s1 = held || step >= 1
  const s2 = held || step >= 2
  const s3 = held || step >= 3
  const s4 = held || step >= 4
  return (
    <Frame w={AW.W} h={AW.H}>
      <Wire pts={[[AW.GX + AW.R + AW.ES / 2, AW.Y], [AW.SH - 28, AW.Y]]} />
      <Wire pts={[[AW.SH + 28, AW.Y], [AW.WF - 28, AW.Y]]} lit={hot === 2} />
      <Wire pts={[[AW.WF + 28, AW.Y], [AW.OR - 28, AW.Y]]} />

      {/* the globe and its ring of edge locations */}
      <div style={box(AW.GX - 40, AW.GY - 40, 80, 80, { display: 'grid', placeItems: 'center', zIndex: 2 })}><Ico3D name="globe" size={76} loop="float" /></div>
      {AW_EDGES.map(([x, y], i) => (
        <div key={i} style={box(x - AW.ES / 2, y - AW.ES / 2, AW.ES, AW.ES, { zIndex: 3 })}>
          <span style={{ display: 'grid', placeItems: 'center', width: AW.ES, height: AW.ES, borderRadius: 10, background: 'linear-gradient(180deg, #FFFFFF 0%, #EEF3FF 100%)', boxShadow: hot === 3 ? `inset 0 0 0 2px ${ORANGE}, 0 8px 16px -10px rgba(255,138,61,0.7)` : 'inset 0 0 0 1.5px #D3DEF6, 0 8px 16px -10px rgba(31,64,140,0.5)' }}>
            <span className={held ? undefined : 'i3d i3d-bob'} style={{ display: 'grid', ['--i3d-d' as string]: `${-i * 0.4}s` } as CSSProperties}>
              <img src={edgeMark} alt="" aria-hidden draggable={false} style={{ width: 24, height: 24, display: 'block' }} />
            </span>
          </span>
        </div>
      ))}
      <span style={{ position: 'absolute', left: AW.GX - 60, top: AW.GY + AW.R + AW.ES / 2 + 8, width: 120, ...tag(14), zIndex: 3 }}>CloudFront</span>

      {/* Shield: always on */}
      <div style={{ position: 'absolute', left: AW.SH - 60, top: AW.Y - 28, width: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 6 }}>
        <span style={{ position: 'relative', display: 'grid' }}>
          {s1 && !held && <span aria-hidden className={loopCls('ripple')} style={{ position: 'absolute', inset: -6, borderRadius: 22, boxShadow: `0 0 0 2.5px ${BLUE}`, ...loopVars(0, 2.4) }} />}
          <MarkTile src={shieldMark} size={56} lit={hot === 0 || hot === 1} />
        </span>
        <span style={{ ...tag(14), marginTop: 6 }}>Shield</span>
      </div>
      <Node x={AW.WF} y={AW.Y} size={56} label="WAF" w={90} z={6}><MarkTile src={wafMark} size={56} lit={hot === 2} /></Node>
      <Node x={AW.OR} y={AW.Y} size={56} label="Origin" w={90}><MarkTile src={ec2Mark} size={56} /></Node>

      {/* Shield Advanced */}
      <Panel x={236} y={202} w={290} h={88} on={s2} lit={hot === 1}>
        {([['webpage', 'Application', 50], ['users', 'Response Team', 145], ['coin', 'Cost', 240]] as [Ico3DName, string, number][]).map(([ic, label, cx], i) => (
          <div key={label} style={{ position: 'absolute', left: cx - 55, top: 12, width: 110, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Plinth size={38}><Ico3D name={ic} size={28} loop="bob" d={i * 0.4} /></Plinth>
            <span style={{ ...tag(13), marginTop: 5 }}>{label}</span>
          </div>
        ))}
      </Panel>

      {AW_DENSE.map((c, i) => <Token key={i} cls={c} tone={s3 ? ORANGE : BLUE} size={8} on={s1} />)}
      <Token cls={AW_TRICKLE} tone={BLUE} size={9} on={s1} />
      {AW_FLOOD.map((c, i) => <Token key={`f${i}`} cls={c} tone={ORANGE} size={10} on={s4} />)}
    </Frame>
  )
}

export const figures: Record<string, Fig> = { A_T01, A_T01B, A_T02, A_T04, A_T05, A_T05B, A_T06B, A_T07 }

export const css = `
@keyframes t16a-trem { 0%, 100% { transform: rotate(-2.5deg) } 50% { transform: rotate(1.5deg) } }
.t16a-trem { animation: t16a-trem 0.5s ease-in-out infinite; }
@keyframes t16a-level { 0%, 100% { transform: translateX(-6px) } 50% { transform: translateX(8px) } }
.t16a-level { animation: t16a-level 2.4s cubic-bezier(0.45,0,0.55,1) infinite; }
${K.css()}
.cc-still .t16a-trem, .deck-thumb .t16a-trem, .cc-still .t16a-level, .deck-thumb .t16a-level { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .t16a-trem, .t16a-level { animation: none !important; } }
`
