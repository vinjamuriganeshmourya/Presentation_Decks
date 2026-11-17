import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Badge } from '@/engine/icons3d'
import { EASE, FONT, ORANGE, Frame, Show, Plinth, MarkTile, Panel, Wire, Token, keyframes, loopCls, loopVars, tag, useHeld, useHot, type Pt } from '@/engine/figkit'
import bedrockMark from '../images/aws-bedrock.svg'

/*
 * BUILDER D · Session 16 Cloud Threats & Attacks, Section 5 (AI-Specific Threats): technical figures for
 *   slide 38 D_T20 (546 x 330, 4 steps)  the AI pipeline with one threat on each stage
 *   slide 39 D_T21 (1080 x 310, 3 steps) the chat window with the hidden instruction + the three TR rows
 *   slide 41 D_T22 (546 x 330, 3 steps)  three private sources into the model, one snippet out in the response
 *   slide 43 D_T23 (546 x 330, 4 steps)  documents -> embeddings -> vector DB, an attacker probing the store
 *   slide 44 D_T24 (546 x 330, 3 steps)  API calls and cloud bill climbing; one long output; users waiting
 *   slide 46 D_T25 (546 x 330, 4 steps)  the defended request flow, Bedrock Guardrails first
 *
 * Session 13 visual standard (generate-slides correction 17): 3D icons on plinth tiles, >= 20 px equal padding,
 * orthogonal wires computed from the same constants as the tiles, flow dots, a lit item that walks first -> last ->
 * first after the build (useHot), all loops transform / opacity on HTML elements. Held (?still): everything shown,
 * nothing lit, nothing moving. Orange means one thing per slide: the threat (or, on T25, the control being explained).
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('t16d')
const nm = (n: string) => n as Ico3DName
const PERIOD = 3 // seconds: flow-dot loop and the walking highlight share one beat

/** a 3D icon on its plinth, its single-word tag under it (or above, `tagUp`), the TILE centred on (x, y) */
function Node({ x, y, label, icon, size = 56, k = 0.74, on = true, lit = false, warm = false, loop = 'bob', d = 0, badge, tagUp = false, mark, w = 120 }: { x: number; y: number; label: string; icon?: string; size?: number; k?: number; on?: boolean; lit?: boolean; warm?: boolean; loop?: 'bob' | 'float' | 'pulse' | 'tilt' | 'glint' | 'beat' | 'swing'; d?: number; badge?: Badge; tagUp?: boolean; mark?: string; w?: number }) {
  const tile = mark ? <MarkTile src={mark} size={size} lit={lit} /> : (
    <Plinth size={size} lit={lit} warm={warm}>
      <Ico3D name={nm(icon ?? 'doc')} size={Math.round(size * k)} loop={loop} d={d} badge={badge} />
    </Plinth>
  )
  const t = <span style={tag(14)}>{label}</span>
  return (
    <Show on={on} style={{ position: 'absolute', left: x - w / 2, top: tagUp ? y - size / 2 - 24 : y - size / 2, width: w, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {tagUp && t}
      {tile}
      {!tagUp && t}
    </Show>
  )
}

/** a grey text bar (the TR gives no words for chat or document text, so none are invented) */
const Bar = ({ w, lit = false, h = 9 }: { w: number; lit?: boolean; h?: number }) => (
  <span style={{ display: 'block', width: w, height: h, borderRadius: 99, background: lit ? `linear-gradient(90deg, #FFB37A, ${ORANGE})` : '#DCE4F4' }} />
)

const held0 = (step: number, n: number, held: boolean) => held || step >= n

/* ================================================================== slide 38 · D_T20 · the AI pipeline map */

/* Prompt -> Model -> Vector DB -> Response on one row; a threat tile above each stage, its arrow tip on the stage's top */
const A = { W: 546, H: 330, S: 64, T: 56, CY: 226, TY: 70 }
const A_X = [70, 205, 340, 475]
const A_STAGE: [string, string][] = [['Prompt', 'chat'], ['Model', 'model'], ['Vector DB', 'database'], ['Response', 'doc']]
/* the four TR threats in the TR's order, each on the stage it attacks */
const A_THREAT: { stage: number; label: string; icon: string; badge?: Badge }[] = [
  { stage: 0, label: 'Injection', icon: 'bug' },
  { stage: 3, label: 'Disclosure', icon: 'eye', badge: 'alert' },
  { stage: 2, label: 'Embedding', icon: 'vector', badge: 'alert' },
  { stage: 1, label: 'Consumption', icon: 'meter' },
]
const A_RIDE = [0, 1, 2].map((i) => K.ride(`a-${i}`, [[A_X[i] + A.S / 2 + 4, A.CY], [A_X[i + 1] - A.S / 2 - 6, A.CY]], 0.1 + i * 0.9, 0.85 + i * 0.9, PERIOD))

const D_T20: Fig = (p) => {
  const step = Number(p.step ?? 0)
  const held = useHeld()
  const hot = useHot(4, step, PERIOD * 1000)
  const litStage = hot >= 0 ? A_THREAT[hot].stage : -1
  return (
    <Frame w={A.W} h={A.H}>
      {A_X.slice(0, 3).map((x, i) => (
        <Wire key={i} pts={[[x + A.S / 2, A.CY], [A_X[i + 1] - A.S / 2, A.CY]]} head={9} />
      ))}
      {A_RIDE.map((c, i) => <Token key={i} cls={c} size={10} />)}
      {A_STAGE.map(([label, icon], i) => (
        <Node key={label} x={A_X[i]} y={A.CY} label={label} icon={icon} size={A.S} lit={litStage === i} d={i * 0.5} loop={i === 1 ? 'pulse' : 'bob'} />
      ))}
      {A_THREAT.map((t, i) => {
        const on = held || step >= i + 1
        const x = A_X[t.stage]
        return (
          <div key={t.label}>
            <Wire pts={[[x, A.TY + A.T / 2 + 30], [x, A.CY - A.S / 2]]} on={on} lit={hot === i} head={9} color="#9FB3D6" />
            <Node x={x} y={A.TY} label={t.label} icon={t.icon} size={A.T} warm on={on} lit={hot === i} badge={t.badge} loop={i % 2 ? 'tilt' : 'beat'} d={i * 0.4} />
          </div>
        )
      })}
    </Frame>
  )
}

/* ================================================================== slide 39 · D_T21 · prompt injection */

/* left: a chat window (title bar, the pasted document with ONE hidden line lit, the model's reply, the input box);
   right: the three TR rows. Row N lights its part of the window: 1 the input box, 2 the document, 3 the reply. */
const B = { W: 1080, H: 310, P: 20, CW: 470, RX: 514, RG: 12 }
const B_ROW_ICON: Record<string, string> = { Keyboard: 'laptop', FileText: 'doc', Target: 'target' }

function Row({ text, icon, i, on, lit, top, h, w }: { text: string; icon: string; i: number; on: boolean; lit: boolean; top: number; h: number; w: number }) {
  return (
    <Panel x={0} y={top} w={w} h={h} on={on} lit={lit} radius={16} delay={0} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 20px' }}>
      <Plinth size={52} lit={false}>
        <Ico3D name={nm(B_ROW_ICON[icon] ?? 'doc')} size={38} loop={(['bob', 'float', 'pulse'] as const)[i % 3]} d={i * 0.45} />
      </Plinth>
      <span style={{ fontFamily: FONT, fontSize: 17, fontWeight: 500, lineHeight: 1.3, color: colors.ink }}>{text}</span>
    </Panel>
  )
}

const D_T21: Fig = (p) => {
  const step = Number(p.step ?? 0)
  const held = useHeld()
  const instant = useInstant()
  const rows = (p.rows as [string, string][]) ?? []
  const n = rows.length || 3
  const hot = useHot(n, step, PERIOD * 1000)
  const { W, H, P, CW, RX, RG } = B
  const IH = H - 2 * P // 270
  const rh = Math.floor((IH - RG * (n - 1)) / n)
  const ring = (lit: boolean, base: string) => (lit ? `inset 0 0 0 2.5px ${ORANGE}, 0 10px 22px -14px rgba(255,138,61,0.8)` : base)
  const tr = instant ? 'none' : `box-shadow 420ms ${EASE}`
  const box = (x: number, y: number, w: number, h: number, lit: boolean, extra?: CSSProperties): CSSProperties => ({
    position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 14, background: '#FFFFFF', boxShadow: ring(lit, `inset 0 0 0 1.5px ${colors.line}, 0 8px 18px -14px rgba(31,64,140,0.45)`), transition: tr, ...extra,
  })
  /* inside the window (coordinates relative to it): 20 px padding on every side */
  const TB = 46 // title bar height
  const DOC = { x: 20, y: TB + 16, w: 220, h: 142 }
  const REP = { x: 256, y: TB + 16, w: CW - 256 - 20, h: 142 }
  const INP = { x: 20, y: DOC.y + DOC.h + 14, w: CW - 40, h: IH - (DOC.y + DOC.h + 14) - 20 }
  return (
    <Frame w={W} h={H}>
      {/* the chat window */}
      <div style={{ position: 'absolute', left: P, top: P, width: CW, height: IH, borderRadius: 18, background: 'linear-gradient(180deg, #F6F9FF 0%, #EAF1FF 100%)', boxShadow: `inset 0 0 0 1.5px ${colors.line}, 0 14px 28px -20px rgba(31,64,140,0.5)` }}>
        <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: TB, borderBottom: `1.5px solid ${colors.line}`, display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px' }}>
          {['#F04A5E', '#FFC53A', '#25BC6E'].map((c) => <span key={c} style={{ width: 10, height: 10, borderRadius: 99, background: c, opacity: 0.85 }} />)}
          <span style={{ width: 8 }} />
          <Ico3D name={nm('chat')} size={26} loop="bob" />
          <span style={{ ...tag(15, colors.ink), textAlign: 'left' }}>Chat</span>
        </div>
        {/* the pasted document: grey lines, ONE hidden instruction lit orange */}
        <div style={box(DOC.x, DOC.y, DOC.w, DOC.h, hot === 1)}>
          <div style={{ position: 'absolute', left: 16, top: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Ico3D name="doc" size={26} loop="float" d={0.3} />
            <span style={{ ...tag(14, colors.ink), textAlign: 'left' }}>Document</span>
          </div>
          <div style={{ position: 'absolute', left: 16, top: 50, display: 'flex', flexDirection: 'column', gap: 9 }}>
            <Bar w={170} />
            <Bar w={140} />
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={loopCls('glow')} style={{ display: 'block', ...loopVars(0, 2.2) }}><Bar w={128} lit /></span>
              <Ico3D name="alert" size={22} loop="beat" t={2.2} />
            </span>
            <Bar w={156} />
          </div>
        </div>
        {/* the model's reply: instructions overridden, hidden data out */}
        <div style={box(REP.x, REP.y, REP.w, REP.h, hot === 2)}>
          <div style={{ position: 'absolute', left: 16, top: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Ico3D name={nm('model')} size={26} loop="pulse" t={2.6} />
            <span style={{ ...tag(14, colors.ink), textAlign: 'left' }}>Model</span>
          </div>
          <div style={{ position: 'absolute', left: 16, top: 50, display: 'flex', flexDirection: 'column', gap: 9 }}>
            <Bar w={REP.w - 60} />
            <Bar w={REP.w - 90} />
          </div>
          <div style={{ position: 'absolute', left: 16, right: 16, bottom: 14, display: 'flex', justifyContent: 'center', gap: 22 }}>
            <Ico3D name="policy" size={36} loop="tilt" badge="cross" d={0.2} />
            <Ico3D name="doc" size={36} loop="float" badge="alert" d={0.9} />
          </div>
        </div>
        {/* the chat input box: what an attacker types directly */}
        <div style={box(INP.x, INP.y, INP.w, INP.h, hot === 0, { display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px' })}>
          <Ico3D name="user" size={26} loop="bob" d={0.6} />
          <Bar w={150} />
          <span className={loopCls('blink')} style={{ display: 'block', width: 2, height: 18, background: colors.brand, borderRadius: 2, ...loopVars(0, 1.1) }} />
          <span style={{ flex: 1 }} />
          <Ico3D name="play" size={24} loop="pulse" t={2.4} />
        </div>
      </div>
      {/* the three TR rows */}
      <div style={{ position: 'absolute', left: RX, top: P, width: W - RX - P, height: IH }}>
        {rows.map(([text, icon], i) => (
          <Row key={i} text={text} icon={icon} i={i} on={held || step >= i + 1} lit={hot === i} top={i * (rh + RG)} h={rh} w={W - RX - P} />
        ))}
      </div>
    </Frame>
  )
}

/* ================================================================== slide 41 · D_T22 · sensitive information disclosure */

/* three private sources (cards) -> one bus -> the model -> the response, where an unrelated private snippet comes out */
const C = { W: 546, H: 330, P: 20, CW: 150, CH: 66, GAP: 20, BUS: 196, MX: 262, MY: 165, MS: 72, RX: 334, RW: 192, RY: 99, RH: 132 }
const C_TOP = (C.H - (3 * C.CH + 2 * C.GAP)) / 2
const C_CY = [0, 1, 2].map((i) => C_TOP + i * (C.CH + C.GAP) + C.CH / 2)
const C_SRC: { label: string; icon: string; badge?: Badge }[] = [
  { label: 'Training', icon: 'doc' },
  { label: 'Context', icon: 'users' },
  { label: 'Retrieval', icon: 'doc', badge: 'lock' },
]
const C_IN: Pt[][] = C_CY.map((y) => (Math.abs(y - C.MY) < 1 ? [[C.P + C.CW, y], [C.MX - C.MS / 2, y]] : [[C.P + C.CW, y], [C.BUS, y], [C.BUS, C.MY], [C.MX - C.MS / 2, C.MY]]))
const C_OUT: Pt[] = [[C.MX + C.MS / 2, C.MY], [C.RX, C.MY]]
const C_RIDE = C_IN.map((pts, i) => K.ride(`c-in-${i}`, [...pts.slice(0, -1), [pts[pts.length - 1][0] - 8, pts[pts.length - 1][1]]], 0.1, 1.4, PERIOD))
const C_RIDE_OUT = K.ride('c-out', [[C_OUT[0][0] + 6, C.MY], [C_OUT[1][0] - 8, C.MY]], 1.6, 2.3, PERIOD)

const D_T22: Fig = (p) => {
  const step = Number(p.step ?? 0)
  const held = useHeld()
  const hot = useHot(3, step, PERIOD * 1000)
  const done = held0(step, 1, held)
  return (
    <Frame w={C.W} h={C.H}>
      {[0, 1, 2].filter((i) => i !== hot).concat(hot >= 0 ? [hot] : []).map((i) => <Wire key={i} pts={C_IN[i]} on={held || step >= i + 1} lit={hot === i} head={9} />)}
      <Wire pts={C_OUT} on={done} head={9} />
      {hot >= 0 && <Token key={`in${hot}`} cls={C_RIDE[hot]} tone={ORANGE} />}
      {hot >= 0 && <Token key={`out${hot}`} cls={C_RIDE_OUT} tone={ORANGE} />}
      {C_SRC.map((s, i) => (
        <Panel key={s.label} x={C.P} y={C_CY[i] - C.CH / 2} w={C.CW} h={C.CH} on={held || step >= i + 1} lit={hot === i} radius={16} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px' }}>
          <Plinth size={46}><Ico3D name={nm(s.icon)} size={34} loop={(['float', 'bob', 'tilt'] as const)[i]} d={i * 0.5} badge={s.badge} /></Plinth>
          <span style={{ ...tag(15, colors.ink), textAlign: 'left' }}>{s.label}</span>
        </Panel>
      ))}
      <Node x={C.MX} y={C.MY} label="Model" icon="model" size={C.MS} loop="pulse" />
      {/* the response box: ordinary lines, and one private snippet that should not be there */}
      <Panel x={C.RX} y={C.RY} w={C.RW} h={C.RH} on radius={16}>
        <div style={{ position: 'absolute', left: 20, top: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Ico3D name="chat" size={26} loop="bob" d={0.4} />
          <span style={{ ...tag(14, colors.ink), textAlign: 'left' }}>Response</span>
        </div>
        <div style={{ position: 'absolute', left: 20, top: 56, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Bar w={C.RW - 40} />
          <Show on={done} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className={loopCls('glow')} style={{ display: 'block', ...loopVars(0, 2.4) }}><Bar w={C.RW - 78} lit /></span>
            <Ico3D name="doc" size={24} loop="beat" badge="alert" t={2.4} />
          </Show>
          <Bar w={C.RW - 70} />
        </div>
      </Panel>
    </Frame>
  )
}

/* ================================================================== slide 43 · D_T23 · vector store attacks */

/* top row: Documents -> Embeddings -> Vector DB. Bottom: the attacker, whose probe runs along the bottom and up the
   right side into the database's right edge (it never touches the model). Three attack tiles stand over the probe;
   point 4 puts a lock on the source documents and an open lock on the vector DB. */
const E = { W: 546, H: 330, S: 64, TY: 82, BY: 252, AX: 64, PX: 512 }
const E_X = [70, 263, 456]
const E_ROW: [string, string][] = [['Documents', 'doc'], ['Embeddings', 'vector'], ['Vector DB', 'database']]
const E_ATK: { label: string; icon: string; x: number; badge?: Badge; back: boolean }[] = [
  { label: 'Inversion', icon: 'doc', x: 196, back: true },
  { label: 'Poisoning', icon: 'bug', x: 310, back: false },
  { label: 'Retrieval', icon: 'doc', x: 424, badge: 'lock', back: true },
]
const E_PROBE: Pt[] = [[E.AX + 30, E.BY], [E.PX, E.BY], [E.PX, E.TY], [E_X[2] + E.S / 2, E.TY]]
const E_IN = K.ride('e-in', [[E.AX + 34, E.BY], [E.PX, E.BY], [E.PX, E.TY], [E_X[2] + E.S / 2 + 8, E.TY]], 0.1, 2.3, PERIOD)
const E_BACK = K.ride('e-back', [[E_X[2] + E.S / 2 + 8, E.TY], [E.PX, E.TY], [E.PX, E.BY], [E.AX + 34, E.BY]], 0.1, 2.3, PERIOD)

const D_T23: Fig = (p) => {
  const step = Number(p.step ?? 0)
  const held = useHeld()
  const hot = useHot(4, step, PERIOD * 1000)
  const on4 = held || step >= 4
  return (
    <Frame w={E.W} h={E.H}>
      {[0, 1].map((i) => <Wire key={i} pts={[[E_X[i] + E.S / 2, E.TY], [E_X[i + 1] - E.S / 2, E.TY]]} head={9} />)}
      <Wire pts={E_PROBE} head={9} lit={hot >= 0 && hot < 3} color="#9FB3D6" />
      {hot >= 0 && hot < 3 && <Token key={`t${hot}`} cls={E_ATK[hot].back ? E_BACK : E_IN} tone={ORANGE} />}
      {E_ROW.map(([label, icon], i) => (
        <div key={label}>
          <Node x={E_X[i]} y={E.TY} label={label} icon={icon} size={E.S} lit={hot === 3 && i !== 1} d={i * 0.5} loop={i === 1 ? 'pulse' : 'bob'} />
          {/* point 4: the source files carry a lock, the vector DB does not */}
          {i !== 1 && (
            <Show on={on4} style={{ position: 'absolute', left: E_X[i] + E.S / 2 - 16, top: E.TY - E.S / 2 - 14, zIndex: 4 }}>
              <span style={{ display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6)' }}>
                <Ico3D name={i === 0 ? 'lock' : 'unlock'} size={26} loop="pulse" d={i * 0.7} t={2.4} />
              </span>
            </Show>
          )}
        </div>
      ))}
      {E_ATK.map((a, i) => (
        <Node key={a.label} x={a.x} y={E.BY - 58} label={a.label} icon={a.icon} size={48} k={0.74} warm on={held || step >= i + 1} lit={hot === i} badge={a.badge} loop={i === 1 ? 'tilt' : 'float'} d={i * 0.4} />
      ))}
      <Node x={E.AX} y={E.BY} label="Attacker" icon="mask" size={56} warm loop="bob" />
    </Frame>
  )
}

/* ================================================================== slide 44 · D_T24 · unbounded consumption */

/* left: a two-line chart, API Calls (blue) and Cloud Bill (orange, the damage), no numbers (the TR gives none);
   right: the model, one very long output bar, other users waiting */
const G = { W: 546, H: 330, P: 20, CW: 314, X0: 60, X1: 278, Y0: 92, Y1: 270, RX: 354 }
/* chart points in the chart card's coordinates; the bill jumps where large prompts arrive */
const G_API: Pt[] = [[60, 248], [96, 240], [132, 228], [168, 210], [204, 188], [240, 160], [278, 132]]
const G_BILL: Pt[] = [[60, 258], [96, 253], [132, 244], [168, 176], [204, 152], [240, 124], [278, 98]]
const polyD = (pts: Pt[]) => pts.map((q, i) => `${i ? 'L' : 'M'} ${q[0]} ${q[1]}`).join(' ')
const polyLen = (pts: Pt[]) => pts.slice(1).reduce((a, q, i) => a + Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]), 0)

function Line({ pts, color, frac, width = 3.2 }: { pts: Pt[]; color: string; frac: number; width?: number }) {
  const instant = useInstant()
  const len = polyLen(pts) + 2
  return <path d={polyD(pts)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - frac)} style={{ transition: instant ? 'none' : `stroke-dashoffset 1100ms ${EASE}` }} />
}

function EndPulse({ x, y, color, on }: { x: number; y: number; color: string; on: boolean }) {
  const held = useHeld()
  return (
    <Show on={on} style={{ position: 'absolute', left: x - 7, top: y - 7, width: 14, height: 14, zIndex: 3 }}>
      {!held && <span className={loopCls('ripple')} style={{ position: 'absolute', inset: -6, borderRadius: 99, boxShadow: `0 0 0 2px ${color}`, ...loopVars(0, 1.8) }} />}
      <span style={{ position: 'absolute', inset: 0, borderRadius: 99, background: color, boxShadow: '0 0 0 3px #FFFFFF' }} />
    </Show>
  )
}

const D_T24: Fig = (p) => {
  const step = Number(p.step ?? 0)
  const held = useHeld()
  const instant = useInstant()
  const hot = useHot(3, step, PERIOD * 1000)
  const s = held ? 3 : step
  const frac = s >= 1 ? 1 : 0.38
  const cardH = G.H - 2 * G.P
  const RW = G.W - G.P - G.RX // 172
  const RC = G.RX + RW / 2
  const swatch = (c: string) => <span style={{ display: 'block', width: 18, height: 4, borderRadius: 99, background: c }} />
  return (
    <Frame w={G.W} h={G.H}>
      <Panel x={G.P} y={G.P} w={G.CW} h={cardH} lit={hot === 0} radius={18}>
        {/* the two axis names, each beside its own axis, with its line's colour */}
        <div style={{ position: 'absolute', left: 20, top: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          {swatch(colors.brand)}
          <span style={{ ...tag(14, colors.ink), textAlign: 'left' }}>API Calls</span>
        </div>
        <div style={{ position: 'absolute', right: 20, top: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ ...tag(14, colors.ink), textAlign: 'right' }}>Cloud Bill</span>
          {swatch(ORANGE)}
        </div>
        <div style={{ position: 'absolute', left: 20, top: 46, display: 'flex', gap: 8 }}>
          <Ico3D name={nm('chart')} size={30} loop="bob" />
        </div>
        <div style={{ position: 'absolute', right: 20, top: 46 }}>
          <Ico3D name={nm('coin')} size={30} loop="glint" t={3} />
        </div>
        <svg aria-hidden width={G.CW} height={cardH} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {/* axes: left for API calls, right for the bill, a shared base */}
          <path d={`M ${G.X0 - 16} ${G.Y0} V ${G.Y1} H ${G.X1 + 16} V ${G.Y0}`} fill="none" stroke="#B9C6E0" strokeWidth={2} strokeLinejoin="round" />
          <Line pts={G_API} color={colors.brand} frac={frac} />
          <Line pts={G_BILL} color={ORANGE} frac={frac} width={3.6} />
        </svg>
        <EndPulse x={G_API[6][0]} y={G_API[6][1]} color={colors.brand} on={s >= 1} />
        <EndPulse x={G_BILL[6][0]} y={G_BILL[6][1]} color={ORANGE} on={s >= 1} />
      </Panel>

      {/* the model */}
      <Node x={RC} y={60} label="Model" icon="model" size={60} loop="pulse" lit={hot === 1} />
      {/* one request, a very long output */}
      <Show on={s >= 2} style={{ position: 'absolute', left: G.RX, top: 140, width: RW, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ position: 'relative', width: RW, height: 22, borderRadius: 99, background: '#E8EEFB', boxShadow: hot === 1 ? `inset 0 0 0 2.5px ${ORANGE}` : `inset 0 0 0 1.5px ${colors.line}`, transition: instant ? 'none' : `box-shadow 420ms ${EASE}`, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 3, top: 3, bottom: 3, width: RW - 6, borderRadius: 99, background: `linear-gradient(90deg, #8DB0FF, ${colors.brand})`, transformOrigin: '0 50%', transform: s >= 2 ? 'scaleX(1)' : 'scaleX(0.08)', transition: instant ? 'none' : `transform 1400ms ${EASE}` }} />
          {!held && <div className={loopCls('glow')} style={{ position: 'absolute', inset: 3, borderRadius: 99, background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 100%)', ...loopVars(0, 1.8) }} />}
        </div>
        <span style={tag(14)}>Output</span>
      </Show>
      {/* other users, waiting */}
      <Show on={s >= 3} style={{ position: 'absolute', left: G.RX, top: 216, width: RW, height: 94, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', gap: 8, padding: '6px 10px', borderRadius: 16, boxShadow: hot === 2 ? `inset 0 0 0 2.5px ${ORANGE}` : 'none', transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
          {[0, 1, 2].map((i) => <Ico3D key={i} name="user" size={42} loop="bob" d={i * 0.5} badge="clock" />)}
        </div>
        <span style={tag(14)}>Users</span>
      </Show>
    </Frame>
  )
}

/* ================================================================== slide 46 · D_T25 · defending AI workloads */

/* a snake: row 1 Prompt -> Guardrails -> Model, the Vector DB beside the model; down to row 2: Output Filter ->
   Rate Limit -> Response. Row-1 tags sit above their tiles and row-2 tags below, so the vertical wire is clear.
   Point N lights its control in the TR's order: guardrails, output filter, vector store access, rate limit. */
const F = { W: 546, H: 330, S: 60, Y1: 104, Y2: 226 }
const F_X = [70, 220, 370, 482]
const F_R2 = [370, 220, 70]
const F_PATH: Pt[] = [
  [F_X[0] + F.S / 2, F.Y1], [F_X[1] - F.S / 2, F.Y1],
]
const F_SEG: Pt[][] = [
  [[F_X[0] + F.S / 2, F.Y1], [F_X[1] - F.S / 2, F.Y1]],
  [[F_X[1] + F.S / 2, F.Y1], [F_X[2] - F.S / 2, F.Y1]],
  [[F_X[2], F.Y1 + F.S / 2], [F_X[2], F.Y2 - F.S / 2]],
  [[F_R2[0] - F.S / 2, F.Y2], [F_R2[1] + F.S / 2, F.Y2]],
  [[F_R2[1] - F.S / 2, F.Y2], [F_R2[2] + F.S / 2, F.Y2]],
]
const F_RIDE = F_SEG.map((pts, i) => K.ride(`f-${i}`, [[pts[0][0] + (pts[1][0] - pts[0][0]) * 0.06, pts[0][1] + (pts[1][1] - pts[0][1]) * 0.06], [pts[1][0] - Math.sign(pts[1][0] - pts[0][0]) * 8, pts[1][1] - Math.sign(pts[1][1] - pts[0][1]) * 8]], 0.05 + i * 0.58, 0.55 + i * 0.58, PERIOD))
void F_PATH

const D_T25: Fig = (p) => {
  const step = Number(p.step ?? 0)
  const held = useHeld()
  const hot = useHot(4, step, PERIOD * 1000)
  const on = (i: number) => held || step >= i + 1
  return (
    <Frame w={F.W} h={F.H}>
      {F_SEG.map((pts, i) => <Wire key={i} pts={pts} head={9} />)}
      {/* the model reads the vector store: a two-way link (no head; a dot runs each way) */}
      <Wire pts={[[F_X[2] + F.S / 2, F.Y1], [F_X[3] - F.S / 2, F.Y1]]} head={0} lit={hot === 2} />
      {F_RIDE.map((c, i) => <Token key={i} cls={c} size={10} />)}
      {/* row 1 (tags above) */}
      <Node x={F_X[0]} y={F.Y1} label="Prompt" icon="chat" size={F.S} tagUp loop="bob" />
      <Node x={F_X[1]} y={F.Y1} label="Guardrails" mark={bedrockMark} size={F.S} tagUp on={on(0)} lit={hot === 0} />
      <Node x={F_X[2]} y={F.Y1} label="Model" icon="model" size={F.S} tagUp loop="pulse" d={0.3} />
      <Node x={F_X[3]} y={F.Y1} label="Vector DB" icon="database" size={F.S} tagUp loop="bob" d={0.8} lit={hot === 2} w={100} />
      {/* point 3: the vector store carries the same identity policy as its source data */}
      <Show on={on(2)} style={{ position: 'absolute', left: F_X[3] + F.S / 2 - 18, top: F.Y1 + F.S / 2 - 18, zIndex: 4 }}>
        <span style={{ display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6)' }}>
          <Ico3D name="lock" size={26} loop="pulse" t={2.4} />
        </span>
      </Show>
      {/* row 2 (tags below) */}
      <Node x={F_R2[0]} y={F.Y2} label="Output Filter" icon="scan" size={F.S} on={on(1)} lit={hot === 1} loop="float" d={0.5} />
      <Node x={F_R2[1]} y={F.Y2} label="Rate Limit" icon="gate" size={F.S} on={on(3)} lit={hot === 3} loop="tilt" d={0.2} />
      <Node x={F_R2[2]} y={F.Y2} label="Response" icon="doc" size={F.S} loop="bob" d={1.1} badge="check" />
    </Frame>
  )
}

export const figures: Record<string, Fig> = { D_T20, D_T21, D_T22, D_T23, D_T24, D_T25 }
export const css = `
${K.css()}
.cc-still [class*="t16d-"], .deck-thumb [class*="t16d-"] { animation: none !important; opacity: 0 !important; }
`
