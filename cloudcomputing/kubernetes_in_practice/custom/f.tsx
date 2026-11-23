import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, Frame, Show, Plinth, MarkTile, Panel, Wire, Junction, Token, keyframes, tag, heading, useHeld, useHot, type Pt } from '@/engine/figkit'
import apiMark from '../images/k8s-api.svg'
import etcdMark from '../images/k8s-etcd.svg'
import schedMark from '../images/k8s-sched.svg'
import cmMark from '../images/k8s-c-m.svg'
import cpMark from '../images/k8s-control-plane.svg'
import nodeMark from '../images/k8s-node.svg'
import podMark from '../images/k8s-pod.svg'
import eksMark from '../images/aws-eks.svg'
import aksMark from '../images/azure-aks.svg'
import gkeMark from '../images/gcp-gke.svg'
import fargateMark from '../images/aws-fargate.svg'

/*
 * SESSION 21 · SECTION 5 (Managed Kubernetes) technical figures, builder F.
 * Built to generate-slides standing correction 17: 3D icons on plinth tiles, official marks on white tiles (the
 * Kubernetes marks never move, their tile halo breathes), >= 20 px equal padding, orthogonal wires computed from the
 * same constants as the boxes, a flow dot on every live wire, a lit item walking last -> first -> ... after the build.
 * Loops are transform / opacity on HTML elements only. Held (?still): the full final state, nothing lit, nothing
 * moving. Class prefix `s21f-`.
 *
 *   slide 47 F_T19   566 x 360  Self-Managed | Managed columns: the Team rail feeds BOTH layers (control plane, nodes),
 *                               the Provider rail only the control plane; EKS, AKS, GKE beside the provider; workloads
 *                               on the nodes in both columns (4)
 *   slide 48 F_T20   546 x 380  Control-plane card (API server, etcd, scheduler, controller manager) tagged
 *                               Provider-Managed, wired both ways to the worker card tagged Customer-Managed; patching and
 *                               HA badges; manifests, add-ons and the Fargate option on the customer side (2)
 *   slide 49 F_T20B  566 x 380  the same control-plane card; a kubectl terminal wired to the one API server; a drawn EKS
 *                               cluster panel whose endpoint field holds a blurred placeholder, never a URL (2)
 *   slide 53 F_T22B 1080 x 440  two stacked bars on one floor: Self-Managed tall in Effort, Managed tall in Cost; the
 *                               bars grow and settle in a loop (2)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('s21f')
const BLUE = colors.brand
const MONO = "'JetBrains Mono', ui-monospace, monospace"
const NOLIG: CSSProperties = { fontVariantLigatures: 'none', fontFeatureSettings: "'liga' 0, 'calt' 0" }
const nm = (n: string) => n as Ico3DName

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)
const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })
const mono = (size = 13, color: string = colors.ink): CSSProperties => ({ fontFamily: MONO, ...NOLIG, fontSize: size, fontWeight: 600, lineHeight: 1.2, color, whiteSpace: 'nowrap' })

/** the build of a figure: the step, the lit item (the walk starts on the LAST item, S18), held */
function useBuild(p: Record<string, unknown>, period: number) {
  const cnt = Number(p.steps ?? 1)
  const held = useHeld()
  const step = held ? cnt : stepOf(p)
  const raw = useHot(cnt, stepOf(p), period)
  const hot = raw >= 0 && stepOf(p) >= cnt ? (raw + cnt - 1) % cnt : raw
  return { step, hot, held, s: (n: number) => step >= n, live: !held }
}

/** a 3D icon (or an official mark) on its plinth; the TILE is centred on (x, y); the tag under it, or `side` beside it */
function Node({ x, y, label, icon, mark, ms = 0.68, size = 52, k = 0.74, on = true, lit = false, loop = 'bob', d = 0, t, w = 120, tagSize = 14, side, delay = 0, children }: { x: number; y: number; label?: string; icon?: string; mark?: string; ms?: number; size?: number; k?: number; on?: boolean; lit?: boolean; loop?: Loop; d?: number; t?: number; w?: number; tagSize?: number; side?: 'right'; delay?: number; children?: ReactNode }) {
  const tile = mark ? <MarkTile src={mark} size={size} scale={ms} lit={lit} /> : (
    <Plinth size={size} lit={lit}>
      <Ico3D name={nm(icon ?? 'doc')} size={Math.round(size * k)} loop={loop} d={d} t={t} />
    </Plinth>
  )
  const tileBox = <div style={{ position: 'relative', width: size, height: size, flexShrink: 0, display: 'grid', placeItems: 'center' }}>{tile}{children}</div>
  const lab = label ? <span style={{ ...tag(tagSize), ...(side ? { textAlign: 'left' } : {}) }}>{label}</span> : null
  if (side) {
    return (
      <Show on={on} delay={delay} style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, height: size, zIndex: 3, display: 'flex', alignItems: 'center', gap: 10 }}>
        {tileBox}
        {lab}
      </Show>
    )
  }
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, top: y - size / 2, width: w, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      {tileBox}
      {lab}
    </Show>
  )
}

/** a small white disc holding a 3D icon, centred on (x, y) of the frame (a badge on a card's edge) */
function Disc({ x, y, on = true, size = 28, icon, loop = 'swing', d = 0, t = 2.6 }: { x: number; y: number; on?: boolean; size?: number; icon: string; loop?: Loop; d?: number; t?: number }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: 6, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6', display: 'grid', placeItems: 'center', opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}` }}>
      <Ico3D name={nm(icon)} size={size - 7} loop={loop} d={d} t={t} />
    </span>
  )
}

/** the Kubernetes project marks carry their own label inside the hexagon: drawn larger on the tile so it reads */
const KS = 0.84

/** a wire on its own layer above the cards (a Panel is z 2 and would hide a wire drawn inside it); tiles (z 3) stay on top */
const W = (props: Parameters<typeof Wire>[0]) => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}><Wire {...props} /></div>
)

/** a card title row: an official mark on its tile and the heading beside it, the row's left edge at x, centred on y */
function MarkTitle({ x, y, mark, text, size = 28, ms = KS, on = true, lit = false }: { x: number; y: number; mark: string; text: string; size?: number; ms?: number; on?: boolean; lit?: boolean }) {
  return (
    <Show on={on} style={{ position: 'absolute', left: x, top: y - size / 2, height: size, display: 'flex', alignItems: 'center', gap: 10, zIndex: 3 }}>
      <MarkTile src={mark} size={size} scale={ms} lit={lit} />
      <span style={{ ...heading(16), whiteSpace: 'nowrap' }}>{text}</span>
    </Show>
  )
}

/* ================================================================== slide 47 · F_T19 · who runs the control plane */

/*
 * 566 x 360. Two columns (x 20..273 and 293..546), the heading on y 20..44. In each, the owner row (tile centred on
 * x CX + 19, y 76) and two layer cards stacked on the right (x CX + 54 .. CX + 253): Control Plane (y 122..222: the
 * API server, etcd, scheduler and controller manager marks) and Nodes (y 238..338: two node marks, and from press 4
 * two pods tagged Workloads). The owner's rail runs down x CX + 19 and turns into a card's left edge at its centre:
 * the Team's rail into BOTH cards (press 1), the Provider's only into the control plane (press 2). Press 3 the EKS,
 * AKS and GKE marks beside the provider; press 4 the workloads in both columns.
 */
const A = { W: 566, H: 360, CW: 253, OY: 76, OS: 38, CPY: 122, NY: 238, LH: 100, MS: 32, PER: 3.2 }
const A_CX = [20, 293]
const A_RAIL = A_CX.map((x) => x + A.OS / 2) // 39, 312
const A_X0 = A_CX.map((x) => x + 54) // 74, 347 (the layer cards' left edge)
const A_CPC = A.CPY + A.LH / 2 // 172
const A_NC = A.NY + A.LH / 2 // 288
const A_ROW = 23 + A.MS / 2 // the tile row's centre below a card's top (161 / 277)
const A_CPW = A_CX.map((x, i): Pt[] => [[A_RAIL[i], A.OY + A.OS / 2], [A_RAIL[i], A_CPC], [A_X0[i], A_CPC]])
const A_NW: Pt[] = [[A_RAIL[0], A_CPC], [A_RAIL[0], A_NC], [A_X0[0], A_NC]]
const A_R1 = K.ride('t19a', A_CPW[0], 0.1, 1.0, A.PER)
const A_R2 = K.ride('t19b', [A_CPW[0][0], A_NW[1], A_NW[2]], 0.9, 2.2, A.PER)
const A_R3 = K.ride('t19c', A_CPW[1], 1.6, 2.5, A.PER)
const A_CP = [apiMark, etcdMark, schedMark, cmMark]
const A_CPX = [38, 79, 120, 161] // tile centres from a card's left edge
const A_MK: { mark: string; label: string; x: number }[] = [
  { mark: eksMark, label: 'EKS', x: 446 },
  { mark: aksMark, label: 'AKS', x: 488 },
  { mark: gkeMark, label: 'GKE', x: 530 },
]

const F_T19: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 4 }, 1800)
  const heads = ['Self-Managed', 'Managed']
  return (
    <Frame w={A.W} h={A.H}>
      {A_CX.map((cx, i) => {
        const x0 = A_X0[i]
        const own = hot === i
        return (
          <div key={cx}>
            <span style={{ ...box(cx, 20, A.CW, 24), ...heading(18, colors.brandDeep), textAlign: 'center', zIndex: 3 }}>{heads[i]}</span>
            {/* the control plane: API server, etcd, scheduler, controller manager */}
            <Panel x={x0} y={A.CPY} w={A.CW - 54} h={A.LH} lit={own} />
            {A_CP.map((m, j) => (
              <span key={j} style={{ ...box(x0 + A_CPX[j] - A.MS / 2, A.CPY + A_ROW - A.MS / 2, A.MS, A.MS), zIndex: 3 }}><MarkTile scale={KS} src={m} size={A.MS} /></span>
            ))}
            <span style={{ ...box(x0, A.CPY + A_ROW + A.MS / 2 + 6, A.CW - 54, 17), ...tag(14), zIndex: 3 }}>Control Plane</span>
            {/* the nodes, and (press 4) the customer's workloads on them */}
            <Panel x={x0} y={A.NY} w={A.CW - 54} h={A.LH} lit={i === 0 ? own || hot === 3 : hot === 3} />
            {[36, 74].map((dx, j) => (
              <span key={dx} style={{ ...box(x0 + dx - A.MS / 2, A.NY + A_ROW - A.MS / 2, A.MS, A.MS), zIndex: 3 }}><MarkTile scale={KS} src={nodeMark} size={A.MS} lit={false} /></span>
            ))}
            <span style={{ ...box(x0 + 20, A.NY + A_ROW + A.MS / 2 + 6, 70, 17), ...tag(14), zIndex: 3 }}>Nodes</span>
            <Show on={s(4)} delay={i * 140} style={{ ...box(x0 + 106, A.NY + A_ROW - A.MS / 2, 76, A.MS + 6 + 17), zIndex: 3 }}>
              {[19, 57].map((dx) => (
                <span key={dx} style={{ ...box(dx - A.MS / 2, 0, A.MS, A.MS) }}><MarkTile scale={KS} src={podMark} size={A.MS} lit={hot === 3} /></span>
              ))}
              <span style={{ ...box(-4, A.MS + 6, 84, 17), ...tag(14) }}>Workloads</span>
            </Show>
          </div>
        )
      })}

      {/* press 1: the team owns every layer, its rail feeds the control plane AND the nodes */}
      <Node x={A_RAIL[0]} y={A.OY} icon="users" size={A.OS} label="Team" side="right" on={s(1)} lit={hot === 0} d={0.2} />
      <W pts={A_CPW[0]} on={s(1)} lit={hot === 0} head={9} />
      <W pts={A_NW} on={s(1)} lit={hot === 0} head={9} delay={200} />
      <Junction x={A_RAIL[0]} y={A_CPC} on={s(1)} lit={hot === 0} />
      <Disc x={A_X0[0] + 24} y={A.CPY} icon="wrench" on={s(1)} />
      <Token cls={A_R1} on={s(1)} size={8} />
      <Token cls={A_R2} on={s(1)} size={8} />

      {/* press 2: the provider owns only the control plane */}
      <Node x={A_RAIL[1]} y={A.OY} icon="cloud" size={A.OS} label="Provider" side="right" on={s(2)} lit={hot === 1} loop="float" d={0.5} />
      <W pts={A_CPW[1]} on={s(2)} lit={hot === 1} head={9} />
      <Disc x={A_X0[1] + 24} y={A.CPY} icon="wrench" on={s(2)} d={0.7} />
      <Token cls={A_R3} on={s(2)} size={8} />

      {/* press 3: the three managed services */}
      {A_MK.map((m, i) => (
        <Node key={m.label} x={m.x} y={A.OY} mark={m.mark} size={A.MS} label={m.label} w={44} on={s(3)} delay={i * 120} lit={hot === 2} />
      ))}
    </Frame>
  )
}

/* ================================================================== slide 48 · F_T20 · what the provider operates */

/*
 * 546 x 380. The control-plane card (x 20..526, y 20..170): its title row (the control-plane mark, `Provider-Managed`,
 * y 54) and the four component marks (y 106, tags under), centres spaced so the widest tag (Controller Manager) keeps
 * clear of its neighbour and of the card's padding. Two wires under the API server join it to the worker card
 * (x 20..526, y 210..360; title row `Customer-Managed` on y 244): down (x 63) and up (x 87), a dot riding each. Worker
 * card row (y 296): Manifests, Add-Ons, the worker nodes, then after a hairline the Fargate option. Press 1 the
 * patching and high-availability badges in the control-plane title row; press 2 the customer's manifests, add-ons and
 * the Fargate mark.
 */
const B = { W: 546, H: 380, X0: 20, X1: 526, CY0: 20, CY1: 170, WY0: 210, WY1: 360, TS: 44, PER: 2.8 }
const B_CP: { mark: string; label: string; x: number }[] = [
  { mark: apiMark, label: 'API Server', x: 75 },
  { mark: etcdMark, label: 'etcd', x: 197 },
  { mark: schedMark, label: 'Scheduler', x: 318 },
  { mark: cmMark, label: 'Controller Manager', x: 440 },
]
const B_MY = 106
const B_WY = 296
const B_DN: Pt[] = [[63, B.CY1], [63, B.WY0]]
const B_UP: Pt[] = [[87, B.WY0], [87, B.CY1]]
const B_RD = K.ride('t20d', B_DN, 0.1, 0.9, B.PER)
const B_RU = K.ride('t20u', B_UP, 1.4, 2.2, B.PER)

/** the step-1 badges: a 3D icon on a small plinth with its tag beside */
function Badge({ icon, label, loop, lit, d = 0 }: { icon: string; label: string; loop: Loop; lit: boolean; d?: number }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Plinth size={28} lit={lit}><Ico3D name={nm(icon)} size={21} loop={loop} d={d} t={loop === 'spin' ? 6 : undefined} /></Plinth>
      <span style={tag(14)}>{label}</span>
    </span>
  )
}

/** a worker-card item: a tile (or a pair of node marks) with its tag under it, centred on x */
const F_T20: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 2 }, 2400)
  return (
    <Frame w={B.W} h={B.H}>
      {/* the control plane, provider-managed */}
      <Panel x={B.X0} y={B.CY0} w={B.X1 - B.X0} h={B.CY1 - B.CY0} lit={hot === 0} />
      <MarkTitle x={B.X0 + 20} y={54} mark={cpMark} text="Provider-Managed" />
      <Show on={s(1)} style={{ ...box(B.X0 + 220, 54 - 14, B.X1 - B.X0 - 240, 28), zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 18 }}>
        <Badge icon="wrench" label="Patching" loop="swing" lit={hot === 0} />
        <Badge icon="replica" label="High Availability" loop="pulse" lit={hot === 0} d={0.4} />
      </Show>
      {B_CP.map((m) => <Node key={m.label} x={m.x} y={B_MY} mark={m.mark} ms={KS} size={B.TS} label={m.label} w={150} />)}

      {/* the API server and the worker nodes talk both ways */}
      <W pts={B_DN} head={9} lit={hot === 1} />
      <W pts={B_UP} head={9} lit={hot === 1} />
      <Token cls={B_RD} size={8} />
      <Token cls={B_RU} size={8} />

      {/* the worker nodes, customer-managed */}
      <Panel x={B.X0} y={B.WY0} w={B.X1 - B.X0} h={B.WY1 - B.WY0} lit={hot === 1} />
      <MarkTitle x={B.X0 + 20} y={244} mark={nodeMark} text="Customer-Managed" />
      <Node x={78} y={B_WY} icon="doc" size={B.TS} label="Manifests" on={s(2)} lit={hot === 1} d={0.1} />
      <Node x={180} y={B_WY} icon="package" size={B.TS} label="Add-Ons" on={s(2)} lit={hot === 1} delay={120} d={0.5} />
      <div style={{ ...box(252, B_WY - B.TS / 2, 96, B.TS + 6 + 17), zIndex: 3 }}>
        {[22, 74].map((dx) => (
          <span key={dx} style={{ ...box(dx - B.TS / 2, 0, B.TS, B.TS) }}><MarkTile scale={KS} src={nodeMark} size={B.TS} /></span>
        ))}
        <span style={{ ...box(-12, B.TS + 6, 120, 17), ...tag(14) }}>Worker Nodes</span>
      </div>
      <Show on={s(2)} delay={240} style={{ ...box(385, B_WY - 30, 2, 60), zIndex: 3, borderRadius: 1, background: colors.line }} />
      <Node x={446} y={B_WY} mark={fargateMark} size={B.TS} label="Fargate" on={s(2)} delay={300} lit={hot === 1} />
    </Frame>
  )
}

/* ================================================================== slide 49 · F_T20B · one API server endpoint */

/*
 * 566 x 380. The control-plane card (x 250..546, y 20..213): title row (y 54), the API server (308, 140, 48 px, tag
 * under) and the three internal components in a column (x 375; y 102 / 140 / 178; tags beside). Press 1 the kubectl
 * terminal (x 20..214, y 85..195) wired from its right edge to the API server's left edge (y 140) only. Press 2 the
 * drawn EKS cluster panel (x 20..546, y 236..360): title row, the API Server Endpoint field with a blurred placeholder
 * value (never a real or invented URL), wired from the control-plane card's foot under the API server.
 */
const C = { W: 566, H: 380, CX0: 250, CX1: 546, CY0: 20, CY1: 213, AX: 308, AY: 140, AS: 48, IX: 375, IS: 30, TX0: 20, TX1: 214, TY0: 85, TY1: 195, PY0: 236, PY1: 360, PER: 2.6 }
const C_IN: { mark: string; label: string; y: number }[] = [
  { mark: etcdMark, label: 'etcd', y: 102 },
  { mark: schedMark, label: 'Scheduler', y: 140 },
  { mark: cmMark, label: 'Controller Manager', y: 178 },
]
const C_REQ: Pt[] = [[C.TX1, C.AY], [C.AX - C.AS / 2, C.AY]]
const C_SHOW: Pt[] = [[C.AX, C.CY1], [C.AX, C.PY0]]
const C_RQ = K.ride('t20bq', C_REQ, 0.1, 0.9, C.PER)
const C_RS = K.ride('t20bs', C_SHOW, 1.2, 1.7, C.PER)

/** the terminal: a dark window, the kubectl command, a blinking cursor */
function Terminal({ lit, live }: { lit: boolean; live: boolean }) {
  const instant = useInstant()
  return (
    <div style={{ position: 'absolute', inset: 0, borderRadius: 14, background: 'linear-gradient(180deg, #13244D 0%, #0C1A3A 100%)', boxShadow: lit ? `0 0 0 2.5px ${ORANGE}, 0 14px 26px -14px rgba(8,16,38,0.7)` : '0 14px 26px -14px rgba(8,16,38,0.7), inset 0 0 0 1px #24386A', overflow: 'hidden', transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
      <div style={{ height: 28, display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', background: 'rgba(255,255,255,0.06)' }}>
        {[0, 1, 2].map((i) => <span key={i} style={{ width: 9, height: 9, borderRadius: 99, background: i === 0 ? '#5B76B8' : '#3E5590' }} />)}
        <span style={{ marginLeft: 8, ...mono(12, '#9FB4E6') }}>kubectl</span>
      </div>
      <div style={{ padding: '18px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={mono(13, '#E6EEFF')}><span style={{ color: '#7FA6FF' }}>$</span> kubectl get nodes</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={mono(13, '#7FA6FF')}>$</span>
          <span className={live ? 's21f-cur' : undefined} style={{ width: 8, height: 15, borderRadius: 2, background: '#E6EEFF' }} />
        </span>
      </div>
    </div>
  )
}

/** the drawn EKS cluster panel: a title row and the endpoint field, its value a blurred placeholder bar */
function EksPanel({ lit }: { lit: boolean }) {
  const instant = useInstant()
  return (
    <>
      <MarkTitle x={20} y={34} mark={eksMark} ms={0.68} text="EKS Cluster" />
      <span style={{ ...box(20, 72, 160, 30), ...tag(14, colors.muted), textAlign: 'left', display: 'flex', alignItems: 'center' }}>API Server Endpoint</span>
      <div style={{ ...box(180, 72, 326, 30), borderRadius: 9, background: '#F2F6FF', boxShadow: lit ? `inset 0 0 0 2.5px ${ORANGE}` : 'inset 0 0 0 1.5px #D3DEF6', overflow: 'hidden', transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
        {/* the value, blurred: a placeholder for the endpoint, never a URL */}
        <div aria-hidden style={{ position: 'absolute', left: 12, right: 44, top: 9, bottom: 9, display: 'flex', gap: 6, filter: 'blur(3.2px)' }}>
          {[38, 18, 30, 22, 26, 34].map((w, i) => <span key={i} style={{ flex: `${w} 0 0`, borderRadius: 4, background: i % 2 ? '#9DB6EE' : '#7FA0EA' }} />)}
        </div>
        <span style={{ position: 'absolute', right: 6, top: 3, width: 24, height: 24, display: 'grid', placeItems: 'center' }}>
          <Ico3D name="link" size={20} loop="pulse" t={2.8} />
        </span>
      </div>
    </>
  )
}

const F_T20B: Fig = (p) => {
  const { hot, s, live } = useBuild({ ...p, steps: p.steps ?? 2 }, 2400)
  return (
    <Frame w={C.W} h={C.H}>
      {/* the provider's control plane: only the API server faces outward */}
      <Panel x={C.CX0} y={C.CY0} w={C.CX1 - C.CX0} h={C.CY1 - C.CY0} />
      <MarkTitle x={C.CX0 + 20} y={54} mark={cpMark} text="Provider-Managed" />
      <Node x={C.AX} y={C.AY} mark={apiMark} ms={KS} size={C.AS} label="API Server" w={100} lit={hot >= 0} />
      {C_IN.map((m) => <Node key={m.label} x={C.IX} y={m.y} mark={m.mark} ms={KS} size={C.IS} label={m.label} side="right" tagSize={13} />)}

      {/* press 1: kubectl talks to that one endpoint */}
      <Show on={s(1)} style={{ ...box(C.TX0, C.TY0, C.TX1 - C.TX0, C.TY1 - C.TY0), zIndex: 3 }}>
        <Terminal lit={hot === 0} live={live && s(1)} />
      </Show>
      <W pts={C_REQ} on={s(1)} lit={hot === 0} head={10} />
      <Token cls={C_RQ} on={s(1)} size={9} />

      {/* press 2: the console shows it as the cluster's endpoint field */}
      <W pts={C_SHOW} on={s(2)} lit={hot === 1} head={8} />
      <Token cls={C_RS} on={s(2)} size={7} />
      <Panel x={20} y={C.PY0} w={C.CX1 - 20} h={C.PY1 - C.PY0} on={s(2)} lit={hot === 1}>
        <EksPanel lit={hot === 1} />
      </Panel>
    </Frame>
  )
}

/* ================================================================== slide 53 · F_T22B · effort against cost */

/*
 * 1080 x 440 (figure-only frame). One floor (y 336, x 120..960) and two stacked bars standing on it (w 300, x 180..480
 * and 600..900, both 282 tall to y 54): Self-Managed is mostly Effort (204) with a little Cost (74); Managed the
 * reverse. Each segment holds its 3D icon on a plinth and its tag (Effort: wrench, Cost: coin, the T22 table's row
 * icons); the column tags with the T22 header icons (Team, Cloud) sit under the floor (y 378). Press 1 the Self-Managed
 * bar grows, press 2 the Managed bar. After the build each bar grows and settles in turn (transform only).
 */
const D = { W: 1080, H: 440, FY: 336, BW: 300, TOP: 54, BIG: 204, GAP: 4, TY: 378 }
const D_X = [180, 600]
const D_SEG = (big: 'effort' | 'cost') => {
  const total = D.FY - D.TOP // 282
  const effort = big === 'effort' ? D.BIG : total - D.BIG
  return { effort, cost: total - effort - D.GAP }
}
const D_BARS: { label: string; icon: Ico3DName; big: 'effort' | 'cost' }[] = [
  { label: 'Self-Managed', icon: 'users', big: 'effort' },
  { label: 'Managed', icon: 'cloud', big: 'cost' },
]
const D_PER = 5.6
/* the loop: the bar dips a little and settles (scaleY from the floor); a segment's content rides with it by the same
   amount (translateY), so its icon and tag are never squashed */
const D_K = [0.965, 1.012, 1]
const D_CSS: string[] = []
function settle(name: string, dist: number) {
  const cls = `s21f-${name}`
  const tr = (k: number) => (dist === 0 ? `scaleY(${k})` : `translateY(${((1 - k) * dist).toFixed(2)}px)`)
  D_CSS.push(`@keyframes ${cls} { 0%, 30%, 100% { transform: ${tr(1)} } 46% { transform: ${tr(D_K[0])} } 62% { transform: ${tr(D_K[1])} } 74% { transform: ${tr(D_K[2])} } }\n.${cls} { animation: ${cls} ${D_PER}s cubic-bezier(0.45,0,0.55,1) infinite; transform-origin: 50% 100%; }`)
  return cls
}
const D_BARCLS = settle('bar', 0)
const D_EFF = D_BARS.map((b, i) => settle(`ef${i}`, D_SEG(b.big).effort / 2))
const D_COS = D_BARS.map((b, i) => { const g = D_SEG(b.big); return settle(`co${i}`, g.effort + D.GAP + g.cost / 2) })

function Segment({ x, y, h, kind, live, cls, d }: { x: number; y: number; h: number; kind: 'effort' | 'cost'; live: boolean; cls: string; d: number }) {
  const eff = kind === 'effort'
  return (
    <div className={live ? cls : undefined} style={{ ...box(x, y, D.BW, h), zIndex: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, animationDelay: `${-d}s` }}>
      <Plinth size={48}><Ico3D name={eff ? 'wrench' : 'coin'} size={36} loop={eff ? 'swing' : 'float'} d={d} /></Plinth>
      <span style={{ ...heading(21, eff ? '#FFFFFF' : colors.brandDeep), whiteSpace: 'nowrap' }}>{eff ? 'Effort' : 'Cost'}</span>
    </div>
  )
}

const F_T22B: Fig = (p) => {
  const { hot, s, live, step } = useBuild({ ...p, steps: p.steps ?? 2 }, 2800)
  const instant = useInstant()
  return (
    <Frame w={D.W} h={D.H}>
      {/* the floor the bars stand on */}
      <span aria-hidden style={{ ...box(120, D.FY, 840, 3), borderRadius: 2, background: '#B9CEFB', zIndex: 2 }} />
      {D_BARS.map((b, i) => {
        const x = D_X[i]
        const g = D_SEG(b.big)
        const on = s(i + 1)
        const lit = hot === i
        const d = i * (D_PER / 2)
        const run = live && on && step >= 2
        return (
          <div key={b.label}>
            {/* the bar: grows from the floor on its press, then dips and settles in a loop */}
            <div style={{ ...box(x, D.TOP, D.BW, D.FY - D.TOP), zIndex: 3, transformOrigin: '50% 100%', transform: on ? 'scaleY(1)' : 'scaleY(0)', opacity: on ? 1 : 0, transition: instant ? 'none' : `transform 820ms ${EASE}, opacity 300ms ${EASE}` }}>
              <div className={run ? D_BARCLS : undefined} style={{ position: 'absolute', inset: 0, animationDelay: `${-d}s` }}>
                <div style={{ ...box(0, 0, D.BW, g.cost), borderRadius: '16px 16px 6px 6px', background: 'linear-gradient(180deg, #EEF3FF 0%, #D6E3FF 100%)', boxShadow: 'inset 0 0 0 1.5px #B9CEFB' }} />
                <div style={{ ...box(0, g.cost + D.GAP, D.BW, g.effort), borderRadius: '6px 6px 2px 2px', background: `linear-gradient(180deg, #4B7BFF 0%, ${BLUE} 45%, ${colors.brandDark} 100%)`, boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.35), 0 16px 28px -18px rgba(1,70,199,0.7)' }} />
                <div aria-hidden style={{ position: 'absolute', inset: -5, borderRadius: 20, boxShadow: `0 0 0 3px ${ORANGE}`, opacity: lit ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE}` }} />
              </div>
            </div>
            {/* the segments' content rides with the bar, never squashed */}
            <Show on={on} delay={420} style={{ position: 'absolute', inset: 0, zIndex: 4 }}>
              <Segment x={x} y={D.TOP} h={g.cost} kind="cost" live={run} cls={D_COS[i]} d={d} />
              <Segment x={x} y={D.TOP + g.cost + D.GAP} h={g.effort} kind="effort" live={run} cls={D_EFF[i]} d={d} />
            </Show>
            {/* the column tag under the floor */}
            <div style={{ ...box(x, D.TY - 21, D.BW, 42), zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <Plinth size={42} lit={lit}><Ico3D name={b.icon} size={31} loop={i ? 'float' : 'bob'} d={i * 0.6} /></Plinth>
              <span style={{ ...heading(21, colors.brandDeep), whiteSpace: 'nowrap' }}>{b.label}</span>
            </div>
          </div>
        )
      })}
    </Frame>
  )
}

export const figures: Record<string, Fig> = { F_T19, F_T20, F_T20B, F_T22B }

export const css = `
${K.css()}
${D_CSS.join('\n')}
@keyframes s21f-cur { 0%, 45% { opacity: 1 } 55%, 100% { opacity: 0 } }
.s21f-cur { animation: s21f-cur 1.1s steps(1, end) infinite; }
.cc-still .s21f-cur, .deck-thumb .s21f-cur, .cc-still .s21f-bar, .deck-thumb .s21f-bar,
.cc-still .s21f-ef0, .deck-thumb .s21f-ef0, .cc-still .s21f-ef1, .deck-thumb .s21f-ef1,
.cc-still .s21f-co0, .deck-thumb .s21f-co0, .cc-still .s21f-co1, .deck-thumb .s21f-co1 { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .s21f-cur, .s21f-bar, .s21f-ef0, .s21f-ef1, .s21f-co0, .s21f-co1 { animation: none !important; } }
`
