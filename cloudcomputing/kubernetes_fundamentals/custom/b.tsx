import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Badge, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, Frame, Show, Plinth, MarkTile, Panel, Wire, Junction, Token, keyframes, tag, heading, useHeld, useHot, type Pt } from '@/engine/figkit'
import apiMark from '../images/k8s-api.svg'
import schedMark from '../images/k8s-sched.svg'
import cmMark from '../images/k8s-c-m.svg'
import etcdMark from '../images/k8s-etcd.svg'
import kubeletMark from '../images/k8s-kubelet.svg'
import proxyMark from '../images/k8s-k-proxy.svg'
import nodeMark from '../images/k8s-node.svg'
import cpMark from '../images/k8s-control-plane.svg'
import podMark from '../images/k8s-pod.svg'
import svcMark from '../images/k8s-svc.svg'
import containerdMark from '../images/tech-containerd.png'

/*
 * SESSION 20 · SECTION 2 (Kubernetes Architecture) technical figures, builder B.
 * Built to generate-slides standing correction 17 (Sessions 14-18): the Kubernetes project's own component icons on
 * white mark tiles, glossy 3D icons on plinth tiles, >= 20 px equal padding, orthogonal wires computed from the same
 * constants as the boxes, a flow dot on every live wire, a lit item walking first -> last -> first after the build
 * (starting on the LAST item). Loops are transform / opacity on HTML elements (or a root svg) only. Held (?still): the
 * full final state, nothing lit, nothing moving. Class prefix `s20b-`.
 *
 *   slide 13 B_T03   566 x 380  Control Plane (API Server, Scheduler, Controller Manager, etcd) | Node (Kubelet,
 *                               Container Runtime, Kube-proxy); press 1 wires into the node box and lights API Server,
 *                               press 2 lights Scheduler (2)
 *   slide 14 B_T03B  566 x 380  the same diagram, whole; lights Controller Manager, etcd, the three node rows (3)
 *   slide 16 B_T04   566 x 360  API Server at the centre of the control plane; Operator on HTTPS 6443, the identity
 *                               check, the write into etcd, Scheduler and Kubelet only through it (4)
 *   slide 17 B_T05   566 x 360  New Pod -> API Server -> Scheduler -> three nodes; scored on resources, affinity and
 *                               taints, Node 2 chosen (2)
 *   slide 18 B_T05B  566 x 360  Controller Manager turning its loop between Desired and Actual; Node 3 fails and its
 *                               pods come back on Node 1 and Node 2 (2)
 *   slide 19 B_T06   566 x 360  etcd at the centre of the control plane, wired to the API Server only; objects, three
 *                               members (Raft), ports 2379 / 2380, the loss (4)
 *   slide 20 B_T07   566 x 360  API Server over the Node: Kubelet, containerd launching containers in a Pod,
 *                               Kube-proxy and its Network Rules, the health heartbeat (4)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('s20b')
const BLUE = colors.brand
const I = (n: string) => n as Ico3DName
const LIT = `inset 0 0 0 2.5px ${ORANGE}, 0 10px 22px -12px rgba(255,138,61,0.7)`
const RIM = 'inset 0 0 0 1.5px #D3DEF6'

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)
const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })
const rev = (pts: Pt[]) => [...pts].reverse() as Pt[]

/** the build of a figure: the step, the lit item (the walk starts on the LAST item, S18), held */
function useBuild(p: Record<string, unknown>, period: number) {
  const cnt = Number(p.steps ?? 1)
  const held = useHeld()
  const step = held ? cnt : stepOf(p)
  const raw = useHot(cnt, stepOf(p), period)
  const hot = raw >= 0 && stepOf(p) >= cnt ? (raw + cnt - 1) % cnt : raw
  return { step, hot, held, s: (n: number) => step >= n, live: !held }
}

/** a dimmed (greyed) wrapper, a step change, never a loop */
function Dim({ dim, children, style }: { dim: boolean; children: ReactNode; style?: CSSProperties }) {
  const instant = useInstant()
  return <div style={{ opacity: dim ? 0.4 : 1, filter: dim ? 'grayscale(1)' : undefined, transition: instant ? 'none' : `opacity 520ms ${EASE}, filter 520ms ${EASE}`, ...style }}>{children}</div>
}

/** a 3D icon (or an official mark) on its tile with its tag under (or beside) it; the TILE is centred on (x, y) */
function Node({ x, y, label, icon, mark, ms = 0.74, size = 52, k = 0.74, on = true, lit = false, loop = 'bob', d = 0, t, badge, w = 120, tagSize = 14, side = false, delay = 0, z = 3, dim = false, children }: { x: number; y: number; label?: string; icon?: Ico3DName; mark?: string; ms?: number; size?: number; k?: number; on?: boolean; lit?: boolean; loop?: Loop; d?: number; t?: number; badge?: Badge; w?: number; tagSize?: number; side?: boolean; delay?: number; z?: number; dim?: boolean; children?: ReactNode }) {
  const tile = mark ? <MarkTile src={mark} size={size} scale={ms} lit={lit} /> : (
    <Plinth size={size} lit={lit}>
      <Ico3D name={icon ?? 'doc'} size={Math.round(size * k)} loop={loop} d={d} t={t} badge={badge} />
    </Plinth>
  )
  const lab = label ? <span style={{ ...tag(tagSize), ...(side ? { marginLeft: 10, textAlign: 'left' } : { marginTop: 6 }) }}>{label}</span> : null
  const pos: CSSProperties = side
    ? { left: x - size / 2, top: y - size / 2, height: size, flexDirection: 'row' }
    : { left: x - w / 2, width: w, top: y - size / 2, flexDirection: 'column' }
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', zIndex: z, display: 'flex', alignItems: 'center', ...pos }}>
      <Dim dim={dim} style={{ position: 'relative', width: size, height: size, display: 'grid', placeItems: 'center' }}>
        {tile}
        {children}
      </Dim>
      {lab && <Dim dim={dim}>{lab}</Dim>}
    </Show>
  )
}

/** the engine's 3D cross turned to the template's orange (blocked / failed = orange, never red) */
const OrangeCross = ({ size }: { size: number }) => (
  <span style={{ display: 'grid', filter: 'hue-rotate(28deg) saturate(1.15) brightness(1.06)' }}>
    <Ico3D name="cross" size={size} loop="none" />
  </span>
)

/** a small white disc holding a 3D icon, centred on (x, y) of the frame (or of the tile it sits in) */
function Disc({ x, y, on = true, size = 26, icon, loop = 'pulse', d = 0, t = 2.4, warn = false, badge }: { x: number; y: number; on?: boolean; size?: number; icon: Ico3DName; loop?: Loop; d?: number; t?: number; warn?: boolean; badge?: Badge }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: 6, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6', display: 'grid', placeItems: 'center', opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}` }}>
      {warn ? <OrangeCross size={size - 6} /> : <Ico3D name={icon} size={size - 6} loop={loop} d={d} t={t} badge={badge} />}
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

/** a wire on its own layer above the cards; tiles (z 3) stay on top. `fade` dims it (a step change) */
function W({ fade = false, ...props }: Parameters<typeof Wire>[0] & { fade?: boolean }) {
  const instant = useInstant()
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', opacity: fade ? 0.3 : 1, transition: instant ? 'none' : `opacity 520ms ${EASE}` }}><Wire {...props} /></div>
  )
}

/** a two-way wire: the same line drawn both ways, so a head sits on each end */
const W2 = (props: Parameters<typeof W>[0]) => (
  <>
    <W {...props} />
    <W {...props} pts={rev(props.pts)} />
  </>
)

/** a title row: an official mark on its tile and the heading beside it, the row's left edge at x, centred on y */
function TitleRow({ x, y, mark, text, size = 34, on = true, lit = false, right = false, fs = 17 }: { x: number; y: number; mark: string; text: string; size?: number; on?: boolean; lit?: boolean; right?: boolean; fs?: number }) {
  return (
    <Show on={on} style={{ position: 'absolute', ...(right ? { right: 566 - x } : { left: x }), top: y - size / 2, height: size, display: 'flex', alignItems: 'center', gap: 10, zIndex: 3 }}>
      <MarkTile src={mark} size={size} scale={0.8} lit={lit} />
      <span style={{ ...heading(fs), whiteSpace: 'nowrap' }}>{text}</span>
    </Show>
  )
}

/** one component row inside a box: its mark on the white tile, its name beside it (T03) */
function Row({ x, y, w, h, mark, ms = 0.8, name, lit = false }: { x: number; y: number; w: number; h: number; mark: string; ms?: number; name: string; lit?: boolean }) {
  const instant = useInstant()
  const ts = h - 14
  return (
    <div style={{ ...box(x, y, w, h), zIndex: 3, borderRadius: 14, background: '#F2F6FF', boxShadow: lit ? LIT : RIM, display: 'flex', alignItems: 'center', gap: 12, padding: '0 10px 0 7px', transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
      <MarkTile src={mark} size={ts} scale={ms} />
      <span style={{ ...heading(15), fontWeight: 600, lineHeight: 1.15 }}>{name}</span>
    </div>
  )
}

/* ================================================================== slides 13 + 14 · B_T03 / B_T03B · the architecture */

/*
 * 566 x 380. Control Plane box (x 20..290, y 20..356): its title row (y 57) and four stacked component rows (x 40..270,
 * h 54; y 90, 154, 218, 282). Node box (x 346..546): its title row and three rows (x 366..526; y 90, 186, 282), the
 * first and last level with API Server and etcd. Wires from the API Server row, out of the control-plane box, into the
 * node box: straight into Kubelet, and through a junction in the gap (x 318) down into Kube-proxy; inside the node,
 * Kubelet hands work to the Container Runtime. Both slides draw this one diagram; T03 builds the wires at press 1.
 */
const A = { W: 566, H: 380, CX: 20, CR: 290, NX: 346, NR: 546, Y0: 20, Y1: 356, RH: 54, J: 318, PER: 3.6 }
const A_CY = [90, 154, 218, 282]
const A_NY = [90, 186, 282]
const A_CM = A_CY.map((y) => y + A.RH / 2) // 117, 181, 245, 309
const A_NM = A_NY.map((y) => y + A.RH / 2) // 117, 213, 309
const A_RX0 = A.CX + 20 // 40
const A_RW0 = A.CR - A.CX - 40 // 230
const A_RX1 = A.NX + 20 // 366
const A_RW1 = A.NR - A.NX - 40 // 160
const A_KL: Pt[] = [[A_RX0 + A_RW0, A_CM[0]], [A_RX1, A_NM[0]]]
const A_KP: Pt[] = [[A.J, A_CM[0]], [A.J, A_NM[2]], [A_RX1, A_NM[2]]]
const A_KR: Pt[] = [[A_RX1 + A_RW1 / 2, A_NY[0] + A.RH], [A_RX1 + A_RW1 / 2, A_NY[1]]]
const A_R1 = K.ride('t03kl', A_KL, 0.1, 0.9, A.PER)
const A_R2 = K.ride('t03kp', [A_KL[0], ...A_KP], 1.0, 2.3, A.PER)
const A_R3 = K.ride('t03kr', A_KR, 1.2, 1.7, A.PER)

const CP_ROWS = [
  { mark: apiMark, name: 'API Server' },
  { mark: schedMark, name: 'Scheduler' },
  { mark: cmMark, name: 'Controller Manager' },
  { mark: etcdMark, name: 'etcd', ms: 0.74 },
]
const N_ROWS = [
  { mark: kubeletMark, name: 'Kubelet' },
  { mark: containerdMark, name: 'Container Runtime', ms: 0.6 },
  { mark: proxyMark, name: 'Kube-proxy' },
]

/** the one architecture diagram; `litCp` lights control-plane rows by index, `litNode` the node box */
function Arch({ wires, litCp, litNode }: { wires: boolean; litCp: number; litNode: boolean }) {
  const wl = litCp === 0
  return (
    <Frame w={A.W} h={A.H}>
      <Panel x={A.CX} y={A.Y0} w={A.CR - A.CX} h={A.Y1 - A.Y0} />
      <Panel x={A.NX} y={A.Y0} w={A.NR - A.NX} h={A.Y1 - A.Y0} lit={litNode} />
      <TitleRow x={A.CX + 20} y={57} mark={cpMark} text="Control Plane" />
      <TitleRow x={A.NX + 20} y={57} mark={nodeMark} text="Node" lit={litNode} />
      {CP_ROWS.map((r, i) => <Row key={r.name} x={A_RX0} y={A_CY[i]} w={A_RW0} h={A.RH} mark={r.mark} ms={r.ms} name={r.name} lit={litCp === i} />)}
      {N_ROWS.map((r, i) => <Row key={r.name} x={A_RX1} y={A_NY[i]} w={A_RW1} h={A.RH} mark={r.mark} ms={r.ms} name={r.name} lit={litNode} />)}
      <W pts={A_KL} on={wires} lit={wl} head={9} />
      <W pts={A_KP} on={wires} lit={wl} head={9} delay={200} />
      <Junction x={A.J} y={A_CM[0]} on={wires} lit={wl} />
      <W pts={A_KR} on={wires} lit={litNode} head={8} delay={400} />
      <Token cls={A_R1} on={wires} size={8} />
      <Token cls={A_R2} on={wires} size={8} />
      <Token cls={A_R3} on={wires} size={7} />
    </Frame>
  )
}

const B_T03: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 2 }, 1800)
  return <Arch wires={s(1)} litCp={hot} litNode={false} />
}

const B_T03B: Fig = (p) => {
  const { hot } = useBuild({ ...p, steps: p.steps ?? 3 }, 1800)
  return <Arch wires litCp={hot === 0 ? 2 : hot === 1 ? 3 : -1} litNode={hot === 2} />
}

/* ================================================================== slide 16 · B_T04 · the API server */

/*
 * 566 x 360. Operator (50, 180) outside, left; `HTTPS` / `6443` over the wire in the gap (x 74..130). The Control Plane
 * box (x 130..410, y 20..340): API Server (220, 180) at its centre; through a bus at x 300 two-way wires to Scheduler
 * (360, 100) and etcd (360, 260). A small Node box (x 436..546, y 96..248) on the right holds Kubelet (491, 180), wired
 * two-way to the API Server straight across. Press 1 the request rides in on 6443; press 2 the identity check on the API
 * Server; press 3 the spec written into etcd; press 4 Scheduler and Kubelet wired only through the API Server.
 */
const B = { W: 566, H: 360, OX: 50, Y: 180, CX: 130, CR: 410, AX: 220, AS: 60, BUS: 300, SX: 360, SY: 100, EY: 260, TS: 48, NX: 436, NR: 546, NY0: 96, NY1: 248, KX: 491, PER: 3.6 }
const B_OP: Pt[] = [[B.OX + 24, B.Y], [B.AX - B.AS / 2, B.Y]]
const B_SC: Pt[] = [[B.AX + B.AS / 2, B.Y - 18], [B.BUS, B.Y - 18], [B.BUS, B.SY], [B.SX - B.TS / 2, B.SY]]
const B_ET: Pt[] = [[B.AX + B.AS / 2, B.Y + 18], [B.BUS, B.Y + 18], [B.BUS, B.EY], [B.SX - B.TS / 2, B.EY]]
const B_KL: Pt[] = [[B.AX + B.AS / 2, B.Y], [B.KX - B.TS / 2, B.Y]]
const B_ROP = K.ride('t04op', B_OP, 0.1, 1.0, B.PER)
const B_ROB = K.ride('t04ob', rev(B_OP), 2.2, 3.1, B.PER)
const B_RET = K.ride('t04et', B_ET, 1.1, 2.0, B.PER)
const B_RSC = [K.ride('t04sa', rev(B_SC), 0.3, 1.1, B.PER), K.ride('t04sb', B_SC, 1.9, 2.7, B.PER)]
const B_RKL = [K.ride('t04ka', B_KL, 0.6, 1.5, B.PER), K.ride('t04kb', rev(B_KL), 2.3, 3.2, B.PER)]

const B_T04: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 4 }, 1800)
  return (
    <Frame w={B.W} h={B.H}>
      <Panel x={B.CX} y={20} w={B.CR - B.CX} h={320} />
      <Panel x={B.NX} y={B.NY0} w={B.NR - B.NX} h={B.NY1 - B.NY0} lit={hot === 3} />
      <TitleRow x={B.CX + 20} y={50} mark={cpMark} text="Control Plane" size={30} />
      <TitleRow x={B.NX + 20} y={B.NY0 + 32} mark={nodeMark} text="Node" size={24} fs={15} />

      <Node x={B.OX} y={B.Y} icon="user" size={48} label="Operator" w={90}>
        <Disc x={42} y={42} icon="terminal" size={24} loop="none" />
      </Node>
      <Node x={B.AX} y={B.Y} mark={apiMark} ms={0.8} size={B.AS} label="API Server" w={110} lit={hot === 1}>
        <Disc x={2} y={2} icon="idcard" badge="check" size={30} on={s(2)} loop="pulse" />
      </Node>
      <Node x={B.SX} y={B.SY} mark={schedMark} ms={0.8} size={B.TS} label="Scheduler" w={100} lit={hot === 3} />
      <Node x={B.SX} y={B.EY} mark={etcdMark} size={B.TS} label="etcd" w={80} lit={hot === 2} />
      <Node x={B.KX} y={B.Y} mark={kubeletMark} ms={0.8} size={B.TS} label="Kubelet" w={90} lit={hot === 3} />

      {/* point 1: the request on HTTPS, port 6443 */}
      <W pts={B_OP} on={s(1)} lit={hot === 0} head={10} />
      <Show on={s(1)} delay={300} style={{ ...box(B.OX + 24, B.Y - 46, B.CX - B.OX - 24, 38), zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <span style={tag(13)}>HTTPS</span>
        <span style={tag(13)}>6443</span>
      </Show>
      <Rider cls={B_ROP} icon={I('api')} size={24} on={s(1)} />
      <Token cls={B_ROB} on={s(1)} size={8} tone={colors.brandDark} />

      {/* point 3: validated and persisted into etcd */}
      <W2 pts={B_ET} on={s(3)} lit={hot === 2} head={8} />
      <Rider cls={B_RET} icon="doc" size={22} on={s(3)} />

      {/* point 4: every other component only through the API Server */}
      <W2 pts={B_SC} on={s(4)} lit={hot === 3} head={8} />
      <W2 pts={B_KL} on={s(4)} lit={hot === 3} head={8} />
      {B_RSC.map((c, i) => <Token key={i} cls={c} on={s(4)} size={8} />)}
      {B_RKL.map((c, i) => <Token key={i} cls={c} on={s(4)} size={8} />)}
    </Frame>
  )
}

/* ================================================================== slide 17 · B_T05 · the scheduler */

/*
 * 566 x 360. Top row (y 62): New Pod (70) -> API Server (208) -> Scheduler (346). Three node cards (w 124, x 146, 284,
 * 422; y 146..338), each with its mark and name, under a fan from the Scheduler (junction y 120). Press 2 the score rows
 * (resources bar, affinity, taints) with their legend at the left (x 20..130), the side branches fade and Node 2, the
 * best one, is chosen (tick); the Scheduler shows its scale.
 */
const C = { W: 566, H: 360, Y: 62, PX: 70, AX: 208, SX: 346, TS: 52, J: 120, CY0: 146, CY1: 338, CW: 124, PER: 3.6 }
const C_X = [146, 284, 422]
const C_C = C_X.map((x) => x + C.CW / 2) // 208, 346, 484
const C_RY = [224, 264, 304]
const C_IN: Pt[] = [[C.PX + C.TS / 2, C.Y], [C.AX - C.TS / 2, C.Y]]
const C_WA: Pt[] = [[C.AX + C.TS / 2, C.Y], [C.SX - C.TS / 2, C.Y]]
const C_FAN: Pt[][] = C_C.map((x) => (x === C.SX ? [[C.SX, C.Y + C.TS / 2], [x, C.CY0]] : [[C.SX, C.J], [x, C.J], [x, C.CY0]]))
const C_TOP: Pt[] = [[C.SX, C.Y + C.TS / 2], [C.SX, C.J]]
const C_RIN = [0, 1, 2].map((i) => K.ride(`t05in${i}`, [...C_IN, ...C_WA.slice(0)], 0.1 + i * 1.2, 1.1 + i * 1.2, C.PER))
const C_RF = C_C.map((x, i) => K.ride(`t05f${i}`, x === C.SX ? C_FAN[1] : [C_TOP[0], ...C_FAN[i]], 1.4 + i * 0.5, 2.3 + i * 0.5, C.PER))
const C_RW = [0, 1].map((i) => K.ride(`t05w${i}`, C_FAN[1], 1.3 + i * 1.6, 1.9 + i * 1.6, C.PER))
const SCORE = [
  { free: 0.3, aff: 'minus' as Ico3DName, taint: false },
  { free: 0.82, aff: 'check' as Ico3DName, taint: false },
  { free: 0.56, aff: 'check' as Ico3DName, taint: true },
]
const LEGEND: { icon: Ico3DName; name: string }[] = [
  { icon: 'cpu', name: 'Resources' },
  { icon: 'target', name: 'Affinity' },
  { icon: 'flag', name: 'Taints' },
]

const B_T05: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 2 }, 2400)
  const instant = useInstant()
  const scored = s(2)
  return (
    <Frame w={C.W} h={C.H}>
      <Node x={C.PX} y={C.Y} mark={podMark} size={C.TS} label="New Pod" w={100} />
      <Node x={C.AX} y={C.Y} mark={apiMark} ms={0.8} size={C.TS} label="API Server" w={110} />
      <Node x={C.SX} y={C.Y} mark={schedMark} ms={0.8} size={C.TS} label="Scheduler" side lit={hot === 0}>
        <Disc x={4} y={4} icon="scale" size={30} on={scored} loop="tilt" />
      </Node>

      {/* the node cards */}
      {C_X.map((x, i) => (
        <Panel key={x} x={x} y={C.CY0} w={C.CW} h={C.CY1 - C.CY0} lit={(hot === 0 && i === 1) || (hot === 1 && i === 1)} />
      ))}
      {C_X.map((x, i) => (
        <Show key={x} on style={{ ...box(x + 16, C.CY0 + 18, C.CW - 32, 36), zIndex: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
          <MarkTile src={nodeMark} size={34} scale={0.8} />
          <span style={tag(14, colors.ink)}>{`Node ${i + 1}`}</span>
        </Show>
      ))}

      {/* point 1: saved via the API Server, watched by the Scheduler, matched to a node */}
      <W pts={C_IN} on={s(1)} lit={hot === 0} head={9} />
      <W pts={C_WA} on={s(1)} lit={hot === 0} head={9} delay={200} />
      <W pts={C_TOP} on={s(1)} lit={hot === 0} head={0} delay={400} />
      {C_FAN.map((pts, i) => (i === 1 ? <W key={i} pts={pts} on={s(1)} lit={hot === 0 || hot === 1} head={9} delay={400} /> : <W key={i} pts={pts} on={s(1)} head={9} delay={500} fade={scored} />))}
      <Junction x={C.SX} y={C.J} on={s(1)} lit={hot === 0 || hot === 1} />
      {C_RIN.map((c, i) => <Token key={i} cls={c} on={s(1)} size={8} />)}
      {C_RF.map((c, i) => <Token key={i} cls={c} on={s(1) && !scored} size={8} />)}
      {C_RW.map((c, i) => <Token key={i} cls={c} on={scored} size={8} />)}

      {/* point 2: scored on resources, affinity and taints; the best node chosen */}
      {LEGEND.map((l, r) => (
        <Show key={l.name} on={scored} delay={r * 120} style={{ ...box(20, C_RY[r] - 15, 112, 30), zIndex: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plinth size={30}><Ico3D name={l.icon} size={22} loop="bob" d={r * 0.4} /></Plinth>
          <span style={tag(14, colors.ink)}>{l.name}</span>
        </Show>
      ))}
      {C_X.map((x, i) => {
        const sc = SCORE[i]
        const cx = C_C[i]
        return (
          <div key={x}>
            <Show on={scored} delay={i * 120} style={{ ...box(x + 16, C_RY[0] - 6, C.CW - 32, 12), zIndex: 3, borderRadius: 6, background: '#E4ECFC', boxShadow: 'inset 0 0 0 1px #D3DEF6', overflow: 'hidden' }}>
              <span style={{ display: 'block', height: '100%', width: '100%', borderRadius: 6, background: `linear-gradient(90deg, ${BLUE}, #6E93F5)`, transformOrigin: 'left center', transform: `scaleX(${scored ? sc.free : 0})`, transition: instant ? 'none' : `transform 820ms ${EASE} ${200 + i * 120}ms` }} />
            </Show>
            <Show on={scored} delay={150 + i * 120} style={{ ...box(cx - 14, C_RY[1] - 14, 28, 28), zIndex: 3, display: 'grid', placeItems: 'center' }}>
              <Ico3D name={sc.aff} size={26} loop="pulse" d={i * 0.4} t={2.6} />
            </Show>
            <Show on={scored} delay={300 + i * 120} style={{ ...box(cx - 14, C_RY[2] - 14, 28, 28), zIndex: 3, display: 'grid', placeItems: 'center' }}>
              {sc.taint ? <OrangeCross size={26} /> : <Ico3D name="check" size={26} loop="pulse" d={i * 0.4 + 0.2} t={2.6} />}
            </Show>
          </div>
        )
      })}
      <Disc x={C_X[1] + C.CW} y={C.CY0} icon="check" size={32} on={scored} loop="pulse" />
    </Frame>
  )
}

/* ================================================================== slide 18 · B_T05B · the controller manager */

/*
 * 566 x 360. Controller Manager (283, 82) inside its turning reconcile loop (r 40), tag above it; Desired (x 20..206) and
 * Actual (x 360..546) cards (y 34..130) wired into it. A fan from the loop (junction y 142) down into three node cards
 * (w 160; x 20, 203, 386; y 178..330), each with its pods. Press 1 the loop turns and compares; press 2 Node 3 fails
 * (orange cross, greyed), its two pods leave (ghost slots) and come back on Node 1 and Node 2.
 */
const D = { W: 566, H: 360, CX: 283, CY: 84, R: 40, TS: 52, DX: 20, AX: 360, CW: 186, CT: 30, CB: 138, J: 158, NY0: 190, NY1: 334, NW: 160, PS: 30, PER: 4 }
const D_NX = [20, 203, 386]
const D_NC = D_NX.map((x) => x + D.NW / 2) // 100, 283, 466
const D_DES: Pt[] = [[D.DX + D.CW, D.CY], [D.CX - D.R - 4, D.CY]]
const D_ACT: Pt[] = [[D.AX, D.CY], [D.CX + D.R + 4, D.CY]]
const D_TOP: Pt[] = [[D.CX, D.CY + D.R + 4], [D.CX, D.J]]
const D_FAN: Pt[][] = D_NC.map((x) => (x === D.CX ? [[D.CX, D.CY + D.R + 4], [x, D.NY0]] : [[D.CX, D.J], [x, D.J], [x, D.NY0]]))
const D_RD = K.ride('t05bd', D_DES, 0.1, 0.8, D.PER)
const D_RA = K.ride('t05ba', D_ACT, 0.1, 0.8, D.PER)
const D_RF = [0, 1, 2].map((i) => K.ride(`t05bf${i}`, i === 1 ? D_FAN[1] : [D_TOP[0], ...D_FAN[i]], 1.2 + i * 0.4, 2.1 + i * 0.4, D.PER))
const D_PODY = 290
/** pod slots per node: x centres; `born` pods arrive at press 2, `lost` pods are Node 3's */
const D_PODS: { node: number; dx: number; born?: boolean; lost?: boolean }[] = [
  { node: 0, dx: -20 }, { node: 0, dx: 20, born: true },
  { node: 1, dx: -20 }, { node: 1, dx: 20, born: true },
  { node: 2, dx: -20, lost: true }, { node: 2, dx: 20, lost: true },
]

/** the reconcile loop: two arcs with heads round the Controller Manager, turning (a root svg, transform only) */
function Loop({ lit, live }: { lit: boolean; live: boolean }) {
  const instant = useInstant()
  const r = D.R
  const S = 2 * r + 16
  const c = S / 2
  const c1 = lit ? ORANGE : BLUE
  const arc = (a0: number, a1: number) => {
    const p = (a: number) => [c + r * Math.cos((a * Math.PI) / 180), c + r * Math.sin((a * Math.PI) / 180)]
    const [x0, y0] = p(a0)
    const [x1, y1] = p(a1)
    return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`
  }
  const head = (a: number) => {
    const rad = (a * Math.PI) / 180
    const [x, y] = [c + r * Math.cos(rad), c + r * Math.sin(rad)]
    const tx = -Math.sin(rad)
    const ty = Math.cos(rad)
    const nx = Math.cos(rad)
    const ny = Math.sin(rad)
    const h = 9
    return `${x + tx * h},${y + ty * h} ${x + nx * h * 0.6},${y + ny * h * 0.6} ${x - nx * h * 0.6},${y - ny * h * 0.6}`
  }
  return (
    <svg aria-hidden className={live ? 's20b-turn' : undefined} width={S} height={S} viewBox={`0 0 ${S} ${S}`} style={{ position: 'absolute', left: D.CX - c, top: D.CY - c, zIndex: 2, overflow: 'visible' }}>
      {[[200, 330], [20, 150]].map(([a0, a1]) => (
        <g key={a0}>
          <path d={arc(a0, a1)} fill="none" stroke={c1} strokeWidth={3.4} strokeLinecap="round" style={{ transition: instant ? 'none' : `stroke 420ms ${EASE}` }} />
          <polygon points={head(a1)} fill={c1} style={{ transition: instant ? 'none' : `fill 420ms ${EASE}` }} />
        </g>
      ))}
    </svg>
  )
}

/** a row of pod marks on white tiles inside a card */
const PodRow = ({ x, y, n, lost = 0 }: { x: number; y: number; n: number; lost?: number }) => (
  <div style={{ ...box(x, y - D.PS / 2, n * D.PS + (n - 1) * 8, D.PS), zIndex: 3, display: 'flex', gap: 8 }}>
    {Array.from({ length: n }, (_, i) => (
      <Dim key={i} dim={i >= n - lost}><MarkTile src={podMark} size={D.PS} scale={0.78} /></Dim>
    ))}
  </div>
)

const B_T05B: Fig = (p) => {
  const { hot, s, live } = useBuild({ ...p, steps: p.steps ?? 2 }, 2400)
  const failed = s(2)
  const cardW = D.CW
  const rowW = 4 * D.PS + 3 * 8
  return (
    <Frame w={D.W} h={D.H}>
      {/* Desired and Actual, compared by the loop */}
      {[{ x: D.DX, name: 'Desired', icon: 'doc' as Ico3DName }, { x: D.AX, name: 'Actual', icon: 'eye' as Ico3DName }].map((c, i) => (
        <Panel key={c.name} x={c.x} y={D.CT} w={cardW} h={D.CB - D.CT}>
          <div style={{ position: 'absolute', left: 20, top: 20, height: 28, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plinth size={28}><Ico3D name={c.icon} size={21} loop="bob" d={i * 0.5} /></Plinth>
            <span style={heading(16)}>{c.name}</span>
          </div>
        </Panel>
      ))}
      <PodRow x={D.DX + (cardW - rowW) / 2} y={D.CB - 20 - D.PS / 2} n={4} />
      <PodRow x={D.AX + (cardW - rowW) / 2} y={D.CB - 20 - D.PS / 2} n={4} />

      <Show on style={{ ...box(D.CX - 90, 14, 180, 20), zIndex: 3, display: 'grid', placeItems: 'center' }}>
        <span style={tag(14)}>Controller Manager</span>
      </Show>
      <Node x={D.CX} y={D.CY} mark={cmMark} ms={0.8} size={D.TS} lit={hot === 0} />
      <Show on={s(1)} style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
        <Loop lit={hot === 0} live={live && s(1)} />
      </Show>
      <W pts={D_DES} on={s(1)} lit={hot === 0} head={9} />
      <W pts={D_ACT} on={s(1)} lit={hot === 0} head={9} delay={200} />
      <Token cls={D_RD} on={s(1)} size={8} />
      <Token cls={D_RA} on={s(1)} size={8} />

      {/* the nodes and their pods */}
      <W pts={D_TOP} on={s(1)} head={0} delay={400} />
      {D_FAN.map((pts, i) => <W key={i} pts={pts} on={s(1)} head={9} delay={500} fade={i === 2 && failed} dash={i === 2 && failed ? '6 6' : undefined} color={i === 2 && failed ? ORANGE : undefined} />)}
      <Junction x={D.CX} y={D.J} on={s(1)} />
      {D_RF.map((c, i) => <Token key={i} cls={c} on={s(1) && !(i === 2 && failed)} size={8} />)}
      <Disc x={D_NC[2]} y={(D.J + D.NY0) / 2} icon="cross" warn size={28} on={failed} />

      {D_NX.map((x, i) => (
        <Panel key={x} x={x} y={D.NY0} w={D.NW} h={D.NY1 - D.NY0} lit={hot === 1 && i === 2} />
      ))}
      {D_NX.map((x, i) => (
        <Dim key={x} dim={i === 2 && failed} style={{ ...box(x + 20, D.NY0 + 20, D.NW - 40, 36), zIndex: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
          <MarkTile src={nodeMark} size={36} scale={0.8} />
          <span style={tag(14, colors.ink)}>{`Node ${i + 1}`}</span>
        </Dim>
      ))}
      {D_PODS.map((pd, k) => {
        const cx = D_NC[pd.node] + pd.dx
        const show = pd.born ? failed : true
        const gone = pd.lost && failed
        return (
          <Show key={k} on={show} delay={pd.born ? 600 + pd.node * 200 : 0} style={{ ...box(cx - D.PS / 2, D_PODY - D.PS / 2, D.PS, D.PS), zIndex: 3 }}>
            <Dim dim={!!gone}>
              <MarkTile src={podMark} size={D.PS} scale={0.78} lit={hot === 1 && !!pd.born} />
            </Dim>
            {pd.born && <Disc x={D.PS - 2} y={2} icon="plus" size={18} on={failed} loop="none" />}
          </Show>
        )
      })}
    </Frame>
  )
}

/* ================================================================== slide 19 · B_T06 · etcd */

/*
 * 566 x 360. The Control Plane box (x 20..546, y 20..340). API Server (90, 196) on the left, wired two-way to the etcd
 * store card (x 190..370, y 70..320) and to nothing else. The store: the etcd mark and name, then four object rows
 * (Pods, Services, Configs, Secrets). Two more etcd members (454; y 120, 270) wired two-way to the store and to each
 * other (Raft). Press 3 the ports (`2379` client, `2380` peer) with a port icon on each wire; press 4 the store empties
 * and the cluster greys.
 */
const E = { W: 566, H: 360, AX: 90, AY: 196, AS: 52, SX: 190, SR: 370, ST: 70, SB: 320, MX: 454, MS: 44, PER: 3.6 }
const E_MY = [120, 270]
const E_ROWY = [150, 190, 230, 270]
const E_API: Pt[] = [[E.AX + E.AS / 2, E.AY], [E.SX, E.AY]]
const E_P: Pt[][] = E_MY.map((y) => [[E.SR, y], [E.MX - E.MS / 2, y]])
const E_MM: Pt[] = [[E.MX, E_MY[0] + E.MS / 2 + 26], [E.MX, E_MY[1] - E.MS / 2]]
const E_RW = K.ride('t06w', E_API, 0.1, 0.8, E.PER)
const E_RR = K.ride('t06r', rev(E_API), 2.4, 3.1, E.PER)
const E_RP = E_P.map((pts, i) => K.ride(`t06p${i}`, pts, 1.0 + i * 0.2, 1.7 + i * 0.2, E.PER))
const E_RM = K.ride('t06m', E_MM, 2.0, 2.8, E.PER)
const OBJ: { name: string; mark?: string; icon?: Ico3DName }[] = [
  { name: 'Pods', mark: podMark },
  { name: 'Services', mark: svcMark },
  { name: 'Configs', icon: 'doc' },
  { name: 'Secrets', icon: 'key' },
]

const B_T06: Fig = (p) => {
  const { hot, s, held } = useBuild({ ...p, steps: p.steps ?? 4 }, 1800)
  const lost = s(4) && !held && (hot === 3 || hot === -1)
  return (
    <Frame w={E.W} h={E.H}>
      <Panel x={20} y={20} w={526} h={320} />
      <TitleRow x={40} y={48} mark={cpMark} text="Control Plane" size={30} />
      <Node x={E.AX} y={E.AY} mark={apiMark} ms={0.8} size={E.AS} label="API Server" w={110} dim={lost} />

      {/* the store, at the centre: etcd and the objects it holds */}
      <Panel x={E.SX} y={E.ST} w={E.SR - E.SX} h={E.SB - E.ST} lit={hot === 0 || hot === 3} />
      <Show on style={{ ...box(E.SX + 20, E.ST + 20, E.SR - E.SX - 40, 44), zIndex: 3, display: 'flex', alignItems: 'center', gap: 10 }}>
        <MarkTile src={etcdMark} size={44} scale={0.74} lit={hot === 0} />
        <span style={heading(17)}>etcd</span>
      </Show>
      {OBJ.map((o, r) => (
        <Show key={o.name} on={s(1) && !lost} delay={r * 120} style={{ ...box(E.SX + 20, E_ROWY[r], E.SR - E.SX - 40, 30), zIndex: 3, display: 'flex', alignItems: 'center', gap: 10 }}>
          {o.mark ? <MarkTile src={o.mark} size={30} scale={0.78} /> : <Plinth size={30}><Ico3D name={o.icon ?? 'doc'} size={22} loop="bob" d={r * 0.4} /></Plinth>}
          <span style={tag(14, colors.ink)}>{o.name}</span>
        </Show>
      ))}
      {/* the store emptied */}
      <Show on={lost} style={{ ...box(E.SX + 20, E_ROWY[0], E.SR - E.SX - 40, E_ROWY[3] + 30 - E_ROWY[0]), zIndex: 3, borderRadius: 14, border: '2px dashed #C9D6F2', display: 'grid', placeItems: 'center' }}>
        <OrangeCross size={44} />
      </Show>
      <Disc x={E.SR - 4} y={E.ST + 4} icon="alert" size={32} on={lost} loop="pulse" />

      {/* the only wire into etcd: the API Server's */}
      <W2 pts={E_API} lit={hot === 2} head={8} fade={lost} />
      <Token cls={E_RW} on={!lost} size={8} />
      <Token cls={E_RR} on={!lost} size={8} tone={colors.brandDark} />

      {/* point 2: two more members, replicating (Raft) */}
      {E_MY.map((y, i) => <Node key={y} x={E.MX} y={y} mark={etcdMark} size={E.MS} label="etcd" w={70} on={s(2)} delay={i * 150} lit={hot === 1} dim={lost} />)}
      {E_P.map((pts, i) => <W2 key={i} pts={pts} on={s(2)} lit={hot === 1 || hot === 2} head={8} delay={300} fade={lost} />)}
      <W2 pts={E_MM} on={s(2)} lit={hot === 1} head={8} delay={400} fade={lost} />
      <Disc x={E.MX} y={(E_MM[0][1] + E_MM[1][1]) / 2} icon="replica" size={30} on={s(2)} loop="bob" />
      {E_RP.map((c, i) => <Token key={i} cls={c} on={s(2) && !lost} size={8} />)}
      <Token cls={E_RM} on={s(2) && !lost} size={8} />

      {/* point 3: the ports */}
      {[{ x: (E_API[0][0] + E_API[1][0]) / 2, y: E.AY, t: '2379' }, ...E_MY.map((y) => ({ x: (E.SR + E.MX - E.MS / 2) / 2, y, t: '2380' }))].map((q, i) => (
        <div key={i}>
          <Disc x={q.x} y={q.y} icon="router" size={26} on={s(3)} loop="pulse" d={i * 0.4} />
          <Show on={s(3)} delay={150} style={{ ...box(q.x - 30, q.y - 36, 60, 18), zIndex: 3, display: 'grid', placeItems: 'center' }}>
            <span style={tag(14)}>{q.t}</span>
          </Show>
        </div>
      ))}
    </Frame>
  )
}

/* ================================================================== slide 20 · B_T07 · the node components */

/*
 * 566 x 360. API Server (96, 46) above the Node box (x 20..546, y 96..340, its title top right). Lane 1 (y 170):
 * Kubelet (96) -> containerd (246) -> a Pod card (x 320..526, y 130..210) holding the pod mark and three containers.
 * Lane 2 (y 272): Kube-proxy (96) -> Network Rules (246) -> up into the Pod card. Kubelet is wired two-way up to the
 * API Server (pods assigned down, health up).
 */
const F = { W: 566, H: 360, KX: 96, AY: 44, TS: 44, NY0: 92, NY1: 340, L1: 192, L2: 276, RX: 246, PX: 320, PR: 526, PT: 152, PB: 232, UP: 415, PER: 3.6 }
const F_UP: Pt[] = [[F.KX, F.L1 - F.TS / 2], [F.KX, F.AY + F.TS / 2]]
const F_KC: Pt[] = [[F.KX + F.TS / 2, F.L1], [F.RX - F.TS / 2, F.L1]]
const F_CP: Pt[] = [[F.RX + F.TS / 2, F.L1], [F.PX, F.L1]]
const F_KR: Pt[] = [[F.KX + F.TS / 2, F.L2], [F.RX - F.TS / 2, F.L2]]
const F_RP: Pt[] = [[F.RX + F.TS / 2, F.L2], [F.UP, F.L2], [F.UP, F.PB]]
const F_RD = K.ride('t07d', rev(F_UP), 0.1, 0.8, F.PER)
const F_RK = K.ride('t07k', F_KC, 0.9, 1.5, F.PER)
const F_RC = K.ride('t07c', F_CP, 1.6, 2.0, F.PER)
const F_RX = K.ride('t07x', F_KR, 0.4, 1.0, F.PER)
const F_RR = K.ride('t07r', F_RP, 1.2, 2.2, F.PER)
const F_RH = K.ride('t07h', F_UP, 2.2, 3.1, F.PER)
const F_CX = [407, 447, 487]

const B_T07: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 4 }, 1800)
  return (
    <Frame w={F.W} h={F.H}>
      <Node x={F.KX} y={F.AY} mark={apiMark} ms={0.8} size={F.TS} label="API Server" side lit={hot === 3} />
      <Panel x={20} y={F.NY0} w={526} h={F.NY1 - F.NY0} />
      <TitleRow x={526} y={F.NY0 + 34} mark={nodeMark} text="Node" size={28} right />

      <Node x={F.KX} y={F.L1} mark={kubeletMark} ms={0.8} size={F.TS} label="Kubelet" w={90} lit={hot === 0}>
        <Disc x={F.TS - 4} y={4} icon="heartbeat" size={26} on={s(4)} loop="beat" />
      </Node>
      <Node x={F.RX} y={F.L1} mark={containerdMark} ms={0.58} size={F.TS} label="containerd" w={100} lit={hot === 1}>
        <Disc x={F.TS - 4} y={4} icon="download" size={26} on={s(2)} loop="bob" />
      </Node>
      <Node x={F.KX} y={F.L2} mark={proxyMark} ms={0.8} size={F.TS} label="Kube-proxy" w={100} lit={hot === 2} />

      {/* point 1: the kubelet runs the pods it is assigned */}
      <W2 pts={F_UP} on={s(1)} lit={hot === 0 || hot === 3} head={8} />
      <W pts={F_KC} on={s(1)} lit={hot === 0} head={9} delay={200} />
      <Rider cls={F_RD} icon="doc" size={22} on={s(1)} />
      <Token cls={F_RK} on={s(1)} size={8} />
      <Panel x={F.PX} y={F.PT} w={F.PR - F.PX} h={F.PB - F.PT} on={s(1)} delay={300} lit={hot === 1}>
        <div style={{ position: 'absolute', left: 23, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <MarkTile src={podMark} size={34} scale={0.78} />
          <span style={tag(13)}>Pod</span>
        </div>
      </Panel>

      {/* point 2: containerd pulls images and starts containers */}
      <W pts={F_CP} on={s(2)} lit={hot === 1} head={9} />
      <Token cls={F_RC} on={s(2)} size={8} />
      {F_CX.map((x, i) => (
        <Show key={x} on={s(2)} delay={300 + i * 180} style={{ ...box(x - 16, F.L1 - 16, 32, 32), zIndex: 3 }}>
          <Plinth size={32}><Ico3D name="container" size={24} loop="bob" d={i * 0.4} /></Plinth>
        </Show>
      ))}

      {/* point 3: kube-proxy keeps the network rules that route service traffic to the pod */}
      <Node x={F.RX} y={F.L2} icon="conntable" size={F.TS} label="Network Rules" w={110} on={s(3)} lit={hot === 2} loop="pulse" t={3} />
      <W pts={F_KR} on={s(3)} lit={hot === 2} head={9} />
      <W pts={F_RP} on={s(3)} lit={hot === 2} head={9} delay={200} />
      <Token cls={F_RX} on={s(3)} size={8} />
      <Token cls={F_RR} on={s(3)} size={8} />

      {/* point 4: the health report rides up to the API Server */}
      <Rider cls={F_RH} icon="heartbeat" size={24} on={s(4)} />
    </Frame>
  )
}

export const figures: Record<string, Fig> = { B_T03, B_T03B, B_T04, B_T05, B_T05B, B_T06, B_T07 }
export const css = [
  K.css(),
  '@keyframes s20b-turn { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }',
  '.s20b-turn { animation: s20b-turn 6s linear infinite; transform-origin: 50% 50%; }',
  '.cc-still .s20b-turn, .deck-thumb .s20b-turn { animation: none !important; }',
  '@media (prefers-reduced-motion: reduce) { .s20b-turn { animation: none !important; } }',
].join('\n')
