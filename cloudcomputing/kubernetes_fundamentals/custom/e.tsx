import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, Frame, Show, Plinth, MarkTile, Panel, Wire, Junction, Token, keyframes, tag, heading, useHeld, useHot, type Pt } from '@/engine/figkit'
import podMark from '../images/k8s-pod.svg'
import svcMark from '../images/k8s-svc.svg'
import nodeMark from '../images/k8s-node.svg'
import epMark from '../images/k8s-ep.svg'
import proxyMark from '../images/k8s-k-proxy.svg'
import k8sMark from '../images/tech-kubernetes.svg'
import dnsMark from '../images/tech-coredns.svg'
import elbMark from '../images/aws-elastic-load-balancing.svg'
import eksMark from '../images/aws-eks.svg'
import clientMark from '../images/res-client.svg'
import usersMark from '../images/res-users.svg'

/*
 * SESSION 20 · SECTION 5 (Services) technical figures, builder E. Built to generate-slides standing correction 17
 * (3D icons on plinth tiles, official marks on white tiles, >= 20 px equal padding, orthogonal wires computed from the
 * same constants as the boxes, a flow dot on every live wire, a lit item walking first -> last -> first after the build).
 * Loops are transform / opacity on HTML elements only. Held (?still): the full final state, nothing lit, nothing moving.
 * Class prefix `s20e-`. Example addresses: pods 10.0.1.x, the Service's ClusterIP 10.100.0.10 (generic private ranges,
 * the same on every slide).
 *
 *   slide 41 E_T18   566 x 360  Node: a stable Service in front of a pod set whose IPs churn; ClusterIP (a pod inside
 *                               calls it), NodePort (a door on the node edge), LoadBalancer (ELB outside), Selector (4)
 *   slide 42 E_T19   566 x 360  Cluster: one ClusterIP with a fixed IP fanning to three pods; Manifest, pin, Database +
 *                               Cache callers inside, an outside Client stopped at the cluster edge (4)
 *   slide 44 E_T20   566 x 360  Client -> NodeIP:Port doors on two nodes -> the same Service (ClusterIP) -> pods; no
 *                               balancing between nodes; Node 2 down, its path dashed (4)
 *   slide 45 E_T21   566 x 360  Internet -> Elastic Load Balancing (Amazon EKS beside) -> NodePort doors on three nodes ->
 *                               Service; a health check stops traffic to the unhealthy node (4)
 *   slide 46 E_T22   546 x 360  Pod asks CoreDNS service-name.namespace.svc.cluster.local, gets the ClusterIP; the
 *                               EndpointSlice lists the pod IPs behind the selector (2)
 *   slide 47 E_T22B  546 x 360  the same picture; kube-proxy's iptables / IPVS rule routes the ClusterIP to one pod;
 *                               environment variables injected at pod start (2)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('s20e')
const MONO = "'JetBrains Mono', ui-monospace, monospace"
const NOLIG: CSSProperties = { fontVariantLigatures: 'none', fontFeatureSettings: "'liga' 0, 'calt' 0" }
const code = (size = 13, color: string = colors.brandDeep): CSSProperties => ({ fontFamily: MONO, fontWeight: 600, fontSize: size, lineHeight: 1.2, color, whiteSpace: 'nowrap', textAlign: 'center', ...NOLIG })
const ORANGE_TINT = 'hue-rotate(28deg) saturate(1.15) brightness(1.06)'
const SVC_IP = '10.100.0.10'

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)
const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })

/** the build of a figure: the step, the lit item, held (walk starts on the LAST item, S18 builder C's fix) */
function useBuild(p: Record<string, unknown>, period: number) {
  const cnt = Number(p.steps ?? 1)
  const held = useHeld()
  const step = held ? cnt : stepOf(p)
  const raw = useHot(cnt, stepOf(p), period)
  const hot = raw >= 0 && stepOf(p) >= cnt ? (raw + cnt - 1) % cnt : raw
  return { step, hot, held, s: (n: number) => step >= n, live: !held }
}

/** a 3D icon (or an official mark) on its plinth with its tag under / above / right of it; the TILE is centred on (x, y) */
function Node({ x, y, label, sub, subOn = true, subLit = false, icon, mark, size = 52, k = 0.74, on = true, lit = false, loop = 'bob', d = 0, t, w = 130, tagSize = 14, dim = false, up = false, right = false, delay = 0, z = 3, children }: { x: number; y: number; label?: string; sub?: string; subOn?: boolean; subLit?: boolean; icon?: Ico3DName; mark?: string; size?: number; k?: number; on?: boolean; lit?: boolean; loop?: Loop; d?: number; t?: number; w?: number; tagSize?: number; dim?: boolean; up?: boolean; right?: boolean; delay?: number; z?: number; children?: ReactNode }) {
  const instant = useInstant()
  const tile = mark ? <MarkTile src={mark} size={size} lit={lit} /> : (
    <Plinth size={size} lit={lit}>
      <Ico3D name={icon ?? 'doc'} size={Math.round(size * k)} loop={loop} d={d} t={t} />
    </Plinth>
  )
  const fade: CSSProperties = { opacity: dim ? 0.4 : 1, filter: dim ? 'grayscale(1)' : undefined, transition: instant ? 'none' : `opacity 520ms ${EASE}, filter 520ms ${EASE}` }
  const inner = (
    <div style={{ position: 'relative', width: size, height: size, display: 'grid', placeItems: 'center' }}>
      <div style={{ display: 'grid', placeItems: 'center', ...fade }}>{tile}</div>
      {children}
    </div>
  )
  const words = (label || sub) ? (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: right ? 'flex-start' : 'center', gap: 2, ...fade, opacity: dim ? 0.5 : 1 }}>
      {label && <span style={tag(tagSize)}>{label}</span>}
      {sub && <span style={{ ...code(13), color: subLit ? ORANGE : colors.brandDeep, opacity: subOn ? 1 : 0, transition: instant ? 'none' : `opacity 520ms ${EASE} 300ms, color 420ms ${EASE}` }}>{sub}</span>}
    </div>
  ) : null
  if (right) {
    return (
      <Show on={on} delay={delay} style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, height: size, zIndex: z, display: 'flex', alignItems: 'center', gap: 10 }}>
        {inner}
        {words}
      </Show>
    )
  }
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, width: w, zIndex: z, display: 'flex', flexDirection: up ? 'column-reverse' : 'column', alignItems: 'center', gap: 6, ...(up ? { bottom: `calc(100% - ${y + size / 2}px)` } : { top: y - size / 2 }) }}>
      {inner}
      {words}
    </Show>
  )
}

/** a small white disc holding a 3D icon (or a mark), centred on (x, y) of the frame; `warn` = the orange cross */
function Disc({ x, y, on = true, size = 26, icon, mark, loop = 'pulse', d = 0, t = 2.4, warn = false, lit = false, z = 6 }: { x: number; y: number; on?: boolean; size?: number; icon?: Ico3DName; mark?: string; loop?: Loop; d?: number; t?: number; warn?: boolean; lit?: boolean; z?: number }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: z, borderRadius: 99, background: '#FFFFFF', boxShadow: lit ? `0 0 0 2.5px ${ORANGE}, 0 4px 10px -5px rgba(255,138,61,0.7)` : '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6', display: 'grid', placeItems: 'center', opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}, box-shadow 420ms ${EASE}` }}>
      {mark ? <img src={mark} alt="" aria-hidden draggable={false} style={{ width: size - 8, height: size - 8, display: 'block', objectFit: 'contain' }} />
        : warn ? <OrangeCross size={size - 6} /> : <Ico3D name={icon ?? 'check'} size={size - 6} loop={loop} d={d} t={t} />}
    </span>
  )
}

/** the engine's 3D cross turned to the template's orange (blocked = orange, never red) */
const OrangeCross = ({ size }: { size: number }) => (
  <span style={{ display: 'grid', filter: ORANGE_TINT }}>
    <Ico3D name="cross" size={size} loop="pulse" t={2.2} />
  </span>
)

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

/** a wire on its own layer above the cards (a Panel is z 2 and would hide a wire drawn inside it); tiles (z 3) stay on top */
const W = (props: Parameters<typeof Wire>[0]) => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}><Wire {...props} /></div>
)

/** a title row: an official mark on its tile and the heading beside it, the row's left edge at x, centred on y */
function TitleRow({ x, y, mark, text, size = 32, on = true, lit = false, dim = false }: { x: number; y: number; mark: string; text: string; size?: number; on?: boolean; lit?: boolean; dim?: boolean }) {
  const instant = useInstant()
  return (
    <Show on={on} style={{ position: 'absolute', left: x, top: y - size / 2, height: size, display: 'flex', alignItems: 'center', gap: 10, zIndex: 3 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: dim ? 0.45 : 1, filter: dim ? 'grayscale(1)' : undefined, transition: instant ? 'none' : `opacity 520ms ${EASE}, filter 520ms ${EASE}` }}>
        <MarkTile src={mark} size={size} lit={lit} scale={0.74} />
        <span style={{ ...heading(16), whiteSpace: 'nowrap' }}>{text}</span>
      </div>
    </Show>
  )
}

/** a NodePort door: the 3D door on its plinth, centred on (x, y) (it sits ON the node's edge) */
const Door = ({ x, y, size = 38, on = true, lit = false, dim = false, d = 0, delay = 0 }: { x: number; y: number; size?: number; on?: boolean; lit?: boolean; dim?: boolean; d?: number; delay?: number }) => (
  <Node x={x} y={y} icon="door" size={size} k={0.76} on={on} lit={lit} dim={dim} loop="swing" d={d} t={3.2} delay={delay} z={4} w={size} />
)

/* ------------------------------------------------------------------ pod IP churn */

/*
 * Each pod's addresses cycle through three generic examples. One layer per change shows the replaced address struck
 * out in orange above the new one; the three layers take turns (one fades out, then the next fades in; opacity only), so the old address is visibly
 * crossed out and replaced, and the loop is seamless (layer 3 hands back to layer 1). Held: layer 1, still.
 */
const CHURN = 9 // seconds for one pod's three changes
const IPS: [string, string, string][] = [
  ['10.0.1.12', '10.0.1.37', '10.0.1.54'],
  ['10.0.1.18', '10.0.1.41', '10.0.1.63'],
  ['10.0.1.25', '10.0.1.46', '10.0.1.71'],
]
const churnCss = `
@keyframes s20e-churn { 0% { opacity: 0 } 2.2% { opacity: 1 } 31.1% { opacity: 1 } 33.3% { opacity: 0 } 100% { opacity: 0 } }
.s20e-churn { animation: s20e-churn ${CHURN}s linear infinite; }
.cc-still .s20e-churn, .deck-thumb .s20e-churn { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .s20e-churn { animation: none !important; } }
`
/** a struck-out line of code (the replaced address) */
const Struck = ({ text, size = 13 }: { text: string; size?: number }) => (
  <span style={{ position: 'relative', display: 'inline-block', ...code(size, '#8A9BC4') }}>
    {text}
    <span aria-hidden style={{ position: 'absolute', left: -2, right: -2, top: '52%', height: 2, marginTop: -1, borderRadius: 2, background: ORANGE }} />
  </span>
)
/**
 * the IP lines of pod `i`, centred on y, left edge x (align 'left') or centred on x ('center'). `pair`: the struck old
 * address above the new one (T18); otherwise one address that changes (T19). `live`: the churn runs.
 */
function PodIps({ x, y, i, live, pair = true, align = 'left', w = 96 }: { x: number; y: number; i: number; live: boolean; pair?: boolean; align?: 'left' | 'center'; w?: number }) {
  const held = useHeld()
  const run = live && !held
  const h = pair ? 36 : 18
  const left = align === 'left' ? x : x - w / 2
  return (
    <div style={{ ...box(left, y - h / 2, w, h), zIndex: 3 }}>
      {[0, 1, 2].map((k) => {
        const delay = (k * CHURN) / 3 - CHURN - i * 1.1
        return (
          <div
            key={k}
            className={run ? 's20e-churn' : undefined}
            style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: align === 'left' ? 'flex-start' : 'center', justifyContent: 'center', gap: 2, opacity: run ? 0 : k === 0 ? 1 : 0, animationDelay: run ? `${delay}s` : undefined }}
          >
            {pair ? <><Struck text={IPS[i][k]} /><span style={code(13)}>{IPS[i][(k + 1) % 3]}</span></> : <span style={code(13)}>{IPS[i][k]}</span>}
          </div>
        )
      })}
    </div>
  )
}
/** the restart badge on a pod tile's corner; it turns as the pod restarts (the mark itself never moves) */
const Restart = ({ x, y, on = true, d = 0 }: { x: number; y: number; on?: boolean; d?: number }) => (
  <Disc x={x} y={y} icon="refresh" size={22} loop="spin" t={CHURN / 3} d={d} on={on} />
)

/* ================================================================== slide 41 · E_T18 · why Services exist, the types map */

/*
 * 566 x 360. Outside the node (left column, x 64): Users (y 110, tag above) over Elastic Load Balancing (y 214).
 * The Node card x 150..546, y 20..340, its title row at (170, 56). The main line y 214: ELB -> the NodePort door ON the
 * node's left edge (150) -> the Service (300) -> the pod set card (x 366..526, y 80..316; pods at x 406, y 152/214/276,
 * their IPs crossed out and replaced beside them). A pod inside the node (215, 128) calls the Service from above.
 * Press 0 the node, the Service and its selector wire to the pod set, IPs churning; 1 ClusterIP: the inside pod's call;
 * 2 NodePort: the door; 3 LoadBalancer: ELB and Users outside; 4 Selector: the label on the wire and the set's `app: web`.
 */
const A = { W: 566, H: 360, NX: 150, NY: 20, NR: 546, NB: 340, Y: 214, LX: 64, UY: 110, SX: 300, SS: 56, CX: 215, CY: 128, CS: 44, PX: 366, PY: 80, PR: 526, PB: 316, PODX: 406, PS: 40, IPX: 436, PER: 3.6 }
const A_PODY = [152, 214, 276]
const A_CALL: Pt[] = [[A.CX + A.CS / 2, A.CY], [A.SX, A.CY], [A.SX, A.Y - A.SS / 2]]
const A_DOOR: Pt[] = [[A.NX + 19, A.Y], [A.SX - A.SS / 2, A.Y]]
const A_LB: Pt[] = [[A.LX + 24, A.Y], [A.NX - 19, A.Y]]
const A_USR: Pt[] = [[A.LX, A.UY + 22], [A.LX, A.Y - 24]]
const A_SEL: Pt[] = [[A.SX + A.SS / 2, A.Y], [A.PX, A.Y]]
const A_RC = K.ride('t18c', A_CALL, 0.2, 1.3, A.PER)
const A_RIN = K.ride('t18in', [...A_USR, [A.LX, A.Y], ...A_LB.slice(1)], 0.1, 1.2, A.PER)
const A_RD = K.ride('t18d', A_DOOR, 1.35, 2.1, A.PER)
const A_RD2 = K.ride('t18d2', A_DOOR, 2.3, 3.05, A.PER)
const A_RS = K.ride('t18s', A_SEL, 2.2, 2.8, A.PER)
const A_RS2 = K.ride('t18s2', A_SEL, 0.4, 1.0, A.PER)

const E_T18: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 4 }, 2000)
  return (
    <Frame w={A.W} h={A.H}>
      {/* the node */}
      <Panel x={A.NX} y={A.NY} w={A.NR - A.NX} h={A.NB - A.NY} />
      <TitleRow x={A.NX + 20} y={A.NY + 36} mark={nodeMark} text="Node" lit={hot === 1} />

      {/* the pod set whose addresses keep changing */}
      <Panel x={A.PX} y={A.PY} w={A.PR - A.PX} h={A.PB - A.PY} lit={hot === 3}>
        <span style={{ position: 'absolute', left: 20, top: 20, ...heading(15), whiteSpace: 'nowrap' }}>Pods</span>
        <Show on={s(4)} style={{ position: 'absolute', right: 20, top: 21, display: 'flex' }}>
          <span style={{ ...code(13), color: hot === 3 ? ORANGE : colors.brand, transition: `color 420ms ${EASE}` }}>app: web</span>
        </Show>
      </Panel>
      {A_PODY.map((y, i) => (
        <div key={y}>
          <Node x={A.PODX} y={y} mark={podMark} size={A.PS} w={A.PS}>
            <Restart x={2} y={A.PS - 2} d={i * 1.1} />
          </Node>
          <PodIps x={A.IPX} y={y} i={i} live w={80} />
        </div>
      ))}

      {/* the stable Service in front, its selector wire to the set */}
      <W pts={A_SEL} lit={hot === 3} head={9} />
      <Node x={A.SX} y={A.Y} mark={svcMark} size={A.SS} label="Service" sub={SVC_IP} lit={hot === 0} w={120} />
      <Disc x={(A.SX + A.SS / 2 + A.PX) / 2} y={A.Y - 22} icon="tag" size={26} on={s(4)} lit={hot === 3} loop="swing" t={2.6} />
      <Token cls={A_RS} size={8} />
      <Token cls={A_RS2} size={8} />

      {/* 1 ClusterIP: a pod inside the cluster calls the Service */}
      <W pts={A_CALL} on={s(1)} lit={hot === 0} head={9} />
      <Node x={A.CX} y={A.CY} mark={podMark} size={A.CS} label="Pod" on={s(1)} lit={hot === 0} w={80} />
      <Token cls={A_RC} on={s(1)} size={8} />

      {/* 2 NodePort: one port, a door on the node's edge */}
      <W pts={A_DOOR} on={s(2)} lit={hot === 1} head={9} />
      <Door x={A.NX} y={A.Y} on={s(2)} lit={hot === 1} />
      <Show on={s(2)} style={{ ...box(A.NX - 19, A.Y + 26, 100, 18), zIndex: 3, display: 'flex', alignItems: 'center' }}>
        <span style={tag(14)}>NodePort</span>
      </Show>
      <Token cls={A_RD} on={s(2)} size={8} />
      <Token cls={A_RD2} on={s(2) && !s(3)} size={8} />

      {/* 3 LoadBalancer: an external cloud load balancer, outside */}
      <W pts={A_USR} on={s(3)} lit={hot === 2} head={9} />
      <W pts={A_LB} on={s(3)} lit={hot === 2} head={9} delay={200} />
      <Node x={A.LX} y={A.UY} mark={usersMark} size={44} label="Users" up on={s(3)} lit={hot === 2} w={100} />
      <Node x={A.LX} y={A.Y} mark={elbMark} size={48} label="Load Balancer" on={s(3)} lit={hot === 2} w={120} delay={150} />
      <Token cls={A_RIN} on={s(3)} size={8} />
    </Frame>
  )
}

/* ================================================================== slide 42 · E_T19 · ClusterIP */

/*
 * 566 x 360. An outside Client (60, 190) left of the Cluster card (x 150..546, y 20..340, title row at (170, 56)).
 * The ClusterIP Service (340, 190) with its fixed IP under it, wires fanning from a junction (410) to three pods
 * (x 480; y 110, 190, 270), each pod's own address changing under it. Press 1 a Manifest (340, 86) feeds the Service:
 * no type named, ClusterIP made; 2 the pin on the fixed IP while the pods' addresses change; 3 Database and Cache tiles
 * inside (x 226; y 130, 250) call it; 4 the Client's dashed path stops at the cluster edge, an orange cross ON the edge.
 */
const B = { W: 566, H: 360, CLX: 60, NX: 150, NY: 20, NR: 546, NB: 340, Y: 190, SX: 340, SS: 56, J: 410, PX: 480, PS: 44, MY: 86, MS: 40, TX: 226, TS: 44, TV: 278, PER: 3.6 }
const B_PODY = [110, 190, 270]
const B_TY = [130, 250]
const B_FAN: Pt[][] = B_PODY.map((y) => (y === B.Y ? [[B.J, y], [B.PX - B.PS / 2, y]] : [[B.J, B.Y], [B.J, y], [B.PX - B.PS / 2, y]]))
const B_OUT: Pt[] = [[B.SX + B.SS / 2, B.Y], [B.J, B.Y]]
const B_MAN: Pt[] = [[B.SX, B.MY + B.MS / 2], [B.SX, B.Y - B.SS / 2]]
const B_TIER: Pt[][] = B_TY.map((y, i) => [[B.TX + B.TS / 2, y], [B.TV, y], [B.TV, B.Y + (i ? 10 : -10)], [B.SX - B.SS / 2, B.Y + (i ? 10 : -10)]])
const B_BLOCK: Pt[] = [[B.CLX + 24, B.Y], [B.NX - 16, B.Y]]
const B_RF = B_PODY.map((_, i) => K.ride(`t19f${i}`, [...B_OUT, ...B_FAN[i].slice(1)], 0.9 + i * 0.7, 1.9 + i * 0.7, B.PER))
const B_RM = K.ride('t19m', B_MAN, 0.1, 0.8, B.PER)
const B_RT = B_TIER.map((pts, i) => K.ride(`t19t${i}`, pts, 0.1 + i * 0.5, 0.9 + i * 0.5, B.PER))
const B_RB = K.ride('t19b', B_BLOCK, 1.6, 2.4, B.PER, 0.4)

const E_T19: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 4 }, 2000)
  return (
    <Frame w={B.W} h={B.H}>
      <Panel x={B.NX} y={B.NY} w={B.NR - B.NX} h={B.NB - B.NY} lit={hot === 3} />
      <TitleRow x={B.NX + 20} y={B.NY + 36} mark={k8sMark} text="Cluster" />

      {/* the ClusterIP and its pods */}
      <W pts={B_OUT} head={0} />
      {B_FAN.map((pts, i) => <W key={i} pts={pts} head={9} delay={i * 100} />)}
      <Junction x={B.J} y={B.Y} />
      <Node x={B.SX} y={B.Y} mark={svcMark} size={B.SS} label="ClusterIP" sub={SVC_IP} lit={hot === 0 || hot === 1} w={120}>
        <Disc x={B.SS - 2} y={2} icon="pin" size={26} on={s(2)} lit={hot === 1} loop="bob" />
      </Node>
      {B_PODY.map((y, i) => (
        <div key={y}>
          <Node x={B.PX} y={y} mark={podMark} size={B.PS} w={B.PS} lit={hot === 1}>
            <Restart x={B.PS - 2} y={2} d={i * 1.1} on={s(2)} />
          </Node>
          <PodIps x={B.PX} y={y + B.PS / 2 + 14} i={i} live={s(2)} pair={false} align="center" w={90} />
        </div>
      ))}
      {B_RF.map((c, i) => <Token key={i} cls={c} size={8} />)}

      {/* 1 the default: a manifest that names no type */}
      <W pts={B_MAN} on={s(1)} lit={hot === 0} head={9} />
      <Node x={B.SX} y={B.MY} icon="doc" size={B.MS} label="Manifest" right on={s(1)} lit={hot === 0} loop="float" />
      <Rider cls={B_RM} icon="doc" size={20} on={s(1)} />

      {/* 3 internal tiers call it from inside */}
      {B_TIER.map((pts, i) => <W key={i} pts={pts} on={s(3)} lit={hot === 2} head={9} delay={i * 120} />)}
      <Node x={B.TX} y={B_TY[0]} icon="database" size={B.TS} label="Database" on={s(3)} lit={hot === 2} loop="pulse" t={3} w={100} />
      <Node x={B.TX} y={B_TY[1]} icon="bolt" size={B.TS} label="Cache" on={s(3)} lit={hot === 2} loop="pulse" t={2.6} d={0.6} w={100} delay={120} />
      {B_RT.map((c, i) => <Token key={i} cls={c} on={s(3)} size={8} />)}

      {/* 4 never routable from outside */}
      <Node x={B.CLX} y={B.Y} mark={clientMark} size={48} label="Client" on={s(4)} lit={hot === 3} w={90} />
      <W pts={B_BLOCK} on={s(4)} color={ORANGE} head={0} width={2.2} dash="6 6" opacity={0.55} />
      <Disc x={B.NX} y={B.Y} warn size={30} on={s(4)} z={7} />
      <Token cls={B_RB} on={s(4)} size={8} tone={ORANGE} />
    </Frame>
  )
}

/* ================================================================== slide 44 · E_T20 · NodePort */

/*
 * 566 x 360. Client (52, 180) forks at a junction (96) to the NodePort doors ON the left edges of Node 1 (x 150..300,
 * y 20..170, door y 112) and Node 2 (y 190..340, door y 282), each door tagged `NodeIP:Port` under it. Both nodes
 * forward along their door's line, out of the node, down / up at x 330 into the same Service (392, 180), whose tags
 * (Service, its ClusterIP from press 2) sit above it; the Service fans (junction 450) to three pods (x 500).
 * Press 0 (the lead) the two nodes, their doors and the Service; 1 the client reaches either door; 2 the ClusterIP inside; 3 no balancing: the scale on the fork, every request
 * to Node 1; 4 Node 2 down (orange cross), the client's path to it dashed, the client's heartbeat watching.
 */
const C = { W: 566, H: 360, CX: 52, J: 96, NX: 150, NR: 300, NW: 150, Y: 180, V: 330, SX: 392, SS: 56, FJ: 450, PX: 500, PS: 40, DS: 36, PER: 3.6 }
const C_NY = [20, 190]
const C_NH = 150
const C_DY = [112, 282]
const C_PODY = [100, 180, 260]
const C_IN: Pt[] = [[C.CX + 24, C.Y], [C.J, C.Y]]
const C_BR: Pt[][] = C_DY.map((y) => [[C.J, C.Y], [C.J, y], [C.NX - C.DS / 2, y]])
const C_FW: Pt[][] = C_DY.map((y, i) => [[C.NX + C.DS / 2, y], [C.V, y], [C.V, C.Y + (i ? 10 : -10)], [C.SX - C.SS / 2, C.Y + (i ? 10 : -10)]])
const C_OUT: Pt[] = [[C.SX + C.SS / 2, C.Y], [C.FJ, C.Y]]
const C_FAN: Pt[][] = C_PODY.map((y) => (y === C.Y ? [[C.FJ, y], [C.PX - C.PS / 2, y]] : [[C.FJ, C.Y], [C.FJ, y], [C.PX - C.PS / 2, y]]))
/* the whole trip, client -> door -> Service -> one pod, per node */
const cTrip = (n: number): Pt[] => [...C_IN, ...C_BR[n].slice(1), ...C_FW[n]]
const C_R = [
  K.ride('t20a', cTrip(0), 0.1, 1.5, C.PER),
  K.ride('t20b', cTrip(1), 1.8, 3.2, C.PER),
]
const C_RA2 = K.ride('t20a2', cTrip(0), 1.8, 3.2, C.PER)
const C_RP = C_PODY.map((_, i) => K.ride(`t20p${i}`, [...C_OUT, ...C_FAN[i].slice(1)], 1.4 + i * 0.6, 2.2 + i * 0.6, C.PER))
const C_RF = C_FW.map((pts, i) => K.ride(`t20f${i}`, pts, 0.1 + i * 1.7, 1.2 + i * 1.7, C.PER))
const C_RDEAD = K.ride('t20x', [...C_IN, ...C_BR[1].slice(1, 2), [C.J, C_DY[1] - 30]], 1.8, 2.6, C.PER, 0.4)

const E_T20: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 4 }, 2000)
  const down = s(4)
  return (
    <Frame w={C.W} h={C.H}>
      {/* two nodes, a NodePort door on each */}
      {C_NY.map((y, i) => (
        <div key={y}>
          <Panel x={C.NX} y={y} w={C.NW} h={C_NH} lit={hot === 0 && !(down && i === 1)} />
          <TitleRow x={C.NX + 20} y={y + 36} mark={nodeMark} text={`Node ${i + 1}`} dim={down && i === 1} />
        </div>
      ))}
      <Disc x={C.NX + 20 + 30} y={C_NY[1] + 22} warn size={24} on={down} z={7} />

      {/* the Service (its ClusterIP from press 2) and its pods */}
      <W pts={C_OUT} head={0} />
      {C_FAN.map((pts, i) => <W key={i} pts={pts} head={9} delay={i * 100} />)}
      <Junction x={C.FJ} y={C.Y} />
      <Node x={C.SX} y={C.Y} mark={svcMark} size={C.SS} label="Service" up lit={hot === 1} w={120} />
      <Show on={s(2)} style={{ ...box(C.SX - 60, C.Y - C.SS / 2 - 52, 120, 18), zIndex: 3, display: 'grid', placeItems: 'center' }}>
        <span style={{ ...code(13), color: hot === 1 ? ORANGE : colors.brandDeep, transition: `color 420ms ${EASE}` }}>{SVC_IP}</span>
      </Show>
      {C_PODY.map((y) => <Node key={y} x={C.PX} y={y} mark={podMark} size={C.PS} label="Pod" tagSize={13} w={60} />)}
      {C_RP.map((c, i) => <Token key={i} cls={c} size={8} />)}

      {/* 1 any node's IP plus that port */}
      <W pts={C_IN} on={s(1)} lit={hot === 0 || hot === 2} head={0} />
      <W pts={C_BR[0]} on={s(1)} lit={hot === 0 || hot === 2} head={9} delay={200} />
      <W pts={C_BR[1]} on={s(1) && !down} lit={hot === 0} head={9} delay={200} />
      <W pts={C_BR[1]} on={down} color={ORANGE} head={0} width={2.2} dash="6 6" opacity={0.55} />
      {C_FW.map((pts, i) => <W key={i} pts={pts} lit={hot === 1 && !(down && i === 1)} head={9} delay={400} opacity={down && i === 1 ? 0.35 : 1} />)}
      <Node x={C.CX} y={C.Y} mark={clientMark} size={48} label="Client" on={s(1)} lit={hot === 0 || hot === 3} w={90}>
        <Disc x={44} y={4} icon="heartbeat" size={26} on={down} lit={hot === 3} loop="beat" t={1.4} />
      </Node>
      <Junction x={C.J} y={C.Y} on={s(1) && !s(3)} />
      <Disc x={C.J} y={C.Y} icon="scale" size={28} on={s(3)} lit={hot === 2} loop="tilt" t={2.4} />
      {C_DY.map((y, i) => (
        <div key={y}>
          <Door x={C.NX} y={y} size={C.DS} lit={hot === 0 && !(down && i === 1)} dim={down && i === 1} d={i * 0.8} />
          <Show on style={{ ...box(C.NX - 50, y + C.DS / 2 + 6, 100, 18), zIndex: 3, display: 'grid', placeItems: 'center' }}>
            <span style={{ ...code(13), opacity: down && i === 1 ? 0.5 : 1, transition: `opacity 520ms ${EASE}` }}>NodeIP:Port</span>
          </Show>
        </div>
      ))}
      <Token cls={C_R[0]} on={s(1)} size={9} />
      <Token cls={C_R[1]} on={s(1) && !s(3)} size={9} />
      <Token cls={C_RA2} on={s(3)} size={9} />
      {C_RF.map((c, i) => <Token key={`f${i}`} cls={c} on={!s(1)} size={9} />)}
      <Token cls={C_RDEAD} on={down} size={8} tone={ORANGE} />
    </Frame>
  )
}

/* ================================================================== slide 45 · E_T21 · LoadBalancer */

/*
 * 566 x 360. Top row y 68, tags above: Internet (globe, x 80) -> Elastic Load Balancing (270) <- Amazon EKS (460) (its
 * controller provisions the load balancer: a gear on that wire). The load balancer fans from a junction (y 112) down
 * into the NodePort door (y 150) above each node (x 90, 270, 450; y 222, tags right), and each node's wire meets at a
 * junction (270, 264) above the Service (270, 302). Press 1 EKS provisions it; 2 internet traffic rides in; 3 the
 * NodePorts underneath (what remains outside managed clouds); 4 a health check marks Node 3 unhealthy, no traffic to it.
 */
const D = { W: 566, H: 360, TY: 68, IX: 80, LX: 270, EX: 460, LS: 52, J1: 112, DY: 150, DS: 34, NY: 222, NS: 48, J2: 264, SY: 302, SS: 44, PER: 3.6 }
const D_X = [90, 270, 450]
const D_INET: Pt[] = [[D.IX + 24, D.TY], [D.LX - D.LS / 2, D.TY]]
const D_EKS: Pt[] = [[D.EX - 24, D.TY], [D.LX + D.LS / 2, D.TY]]
const D_DOWN: Pt[] = [[D.LX, D.TY + D.LS / 2], [D.LX, D.J1]]
const D_BR: Pt[][] = D_X.map((x) => (x === D.LX ? [[x, D.J1], [x, D.DY - D.DS / 2]] : [[D.LX, D.J1], [x, D.J1], [x, D.DY - D.DS / 2]]))
const D_IN: Pt[][] = D_X.map((x) => [[x, D.DY + D.DS / 2], [x, D.NY - D.NS / 2]])
const D_UP: Pt[][] = D_X.map((x) => (x === D.LX ? [[x, D.NY + D.NS / 2], [x, D.J2]] : [[x, D.NY + D.NS / 2], [x, D.J2], [D.LX, D.J2]]))
const D_SVC: Pt[] = [[D.LX, D.J2], [D.LX, D.SY - D.SS / 2]]
const dTrip = (i: number): Pt[] => [...D_INET, [D.LX, D.TY], ...D_DOWN.slice(1), ...D_BR[i].slice(1), ...D_IN[i], ...D_UP[i].slice(1), ...D_SVC.slice(1)]
const D_R = D_X.map((_, i) => K.ride(`t21r${i}`, dTrip(i), 0.1 + i * 0.9, 2.3 + i * 0.9, D.PER + 1.2))
const D_RE = K.ride('t21e', D_EKS, 0.2, 1.0, D.PER)
const D_RH = K.ride('t21h', [[D.LX, D.J1], [D_X[2], D.J1], [D_X[2], D.DY - D.DS / 2]], 1.2, 2.2, D.PER, 0.4)

const E_T21: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 4 }, 2000)
  const sick = s(4)
  return (
    <Frame w={D.W} h={D.H}>
      {/* the load balancer fanning into the NodePort on each node, down to the Service */}
      <W pts={D_DOWN} head={0} lit={hot === 3} />
      {D_BR.map((pts, i) => (i === 2 && sick
        ? <W key={i} pts={pts} color={ORANGE} head={0} width={2.2} dash="6 6" opacity={0.55} />
        : <W key={i} pts={pts} head={9} lit={hot === 3 && i < 2} delay={i * 100} />))}
      <Junction x={D.LX} y={D.J1} lit={hot === 3} />
      {D_IN.map((pts, i) => <W key={i} pts={pts} head={9} lit={hot === 2} opacity={sick && i === 2 ? 0.35 : 1} />)}
      {D_UP.map((pts, i) => <W key={i} pts={pts} head={0} opacity={sick && i === 2 ? 0.35 : 1} />)}
      <W pts={D_SVC} head={9} />
      <Junction x={D.LX} y={D.J2} />
      {D_X.map((x, i) => (
        <div key={x}>
          <Door x={x} y={D.DY} size={D.DS} lit={hot === 2} dim={sick && i === 2} d={i * 0.7} />
          <Show on style={{ position: 'absolute', left: x + D.DS / 2 + 8, top: D.DY - 9, height: 18, zIndex: 3, display: 'flex', alignItems: 'center', opacity: sick && i === 2 ? 0.5 : 1 }}>
            <span style={tag(13)}>NodePort</span>
          </Show>
          <Node x={x} y={D.NY} mark={nodeMark} size={D.NS} label={`Node ${i + 1}`} right lit={hot === 2} dim={sick && i === 2} tagSize={13}>
            {i === 2 && <Disc x={D.NS - 2} y={2} warn size={26} on={sick} />}
          </Node>
        </div>
      ))}
      <Node x={D.LX} y={D.SY} mark={svcMark} size={D.SS} label="Service" right />

      {/* the top row: internet traffic, the load balancer, EKS beside it */}
      <W pts={D_INET} on={s(2)} lit={hot === 1} head={9} />
      <Node x={D.IX} y={D.TY} icon="globe" size={48} label="Internet" up on={s(2)} lit={hot === 1} loop="spin" t={8} w={100} />
      <Node x={D.LX} y={D.TY} mark={elbMark} size={D.LS} label="Load Balancer" up lit={hot === 0 || hot === 3} w={130}>
        <Disc x={D.LS - 2} y={D.LS - 2} icon="health" size={26} on={sick} lit={hot === 3} loop="beat" t={1.6} />
      </Node>
      <W pts={D_EKS} on={s(1)} lit={hot === 0} head={9} />
      <Disc x={(D.EX - 24 + D.LX + D.LS / 2) / 2} y={D.TY} icon="gear" size={26} on={s(1)} lit={hot === 0} loop="spin" t={5} />
      <Node x={D.EX} y={D.TY} mark={eksMark} size={48} label="Amazon EKS" up on={s(1)} lit={hot === 0} w={120} />
      <Token cls={D_RE} on={s(1)} size={8} />

      {D_R.map((c, i) => <Token key={i} cls={c} on={s(2) && !(sick && i === 2)} size={9} />)}
      <Token cls={D_RH} on={sick} size={8} tone={ORANGE} />
    </Frame>
  )
}

/* ================================================================== slides 46-47 · E_T22 / E_T22B · service discovery */

/*
 * 546 x 360, one picture over two slides. Top: the app Pod (64, 68) asks CoreDNS (482, 68) for
 * service-name.namespace.svc.cluster.local (the query wire y 58, the name above it) and gets the Service's ClusterIP
 * back (the answer wire y 78, the address under it). Below: the Service (202, 211) -> its EndpointSlice (card x 262..526,
 * y 160..262: the mark and name, then one cell per pod IP) -> the three pods under the cells (x 323, 397, 471; y 300).
 * kube-proxy (64, 300) sits under the app Pod, tagged on its right; in T22B its rule (`iptables / IPVS` under the tag)
 * runs under the pods (y 338) and up into the first pod.
 * T22: press 1 the DNS question and answer; 2 the EndpointSlice and the pods it lists.
 * T22B (all of T22 drawn): press 1 kube-proxy's iptables / IPVS rule: the Pod's traffic to the ClusterIP goes down to
 * kube-proxy and on to ONE pod endpoint (its cell lit); 2 environment variables injected at pod start (card beside the Pod).
 */
const E = { W: 546, H: 360, PX: 64, TY: 62, TS: 40, DX: 482, QY: 54, AY: 72, SX: 202, SY: 211, SS: 48, CX: 262, CY: 160, CR: 526, CB: 262, CELLY: 231, CELLW: 70, PY: 300, PS: 40, KY: 300, KS: 44, RY: 338, EX: 88, EY: 100, EW: 190, EH: 52, PER: 4.2 }
const E_PX = [323, 397, 471]
const E_Q: Pt[] = [[E.PX + E.TS / 2, E.QY], [E.DX - E.TS / 2, E.QY]]
const E_A: Pt[] = [[E.DX - E.TS / 2, E.AY], [E.PX + E.TS / 2, E.AY]]
const E_SE: Pt[] = [[E.SX + E.SS / 2, E.SY], [E.CX, E.SY]]
const E_CP: Pt[][] = E_PX.map((x) => [[x, E.CB], [x, E.PY - E.PS / 2]])
const E_K: Pt[] = [[E.PX, E.TY + E.TS / 2], [E.PX, E.KY - E.KS / 2]]
const E_RULE: Pt[] = [[E.PX, E.KY + E.KS / 2], [E.PX, E.RY], [E_PX[0], E.RY], [E_PX[0], E.PY + E.PS / 2]]
const E_RQ = K.ride('t22q', E_Q, 0.1, 1.2, E.PER)
const E_RA = K.ride('t22a', E_A, 1.5, 2.6, E.PER)
const E_RS = K.ride('t22s', E_SE, 0.6, 1.2, E.PER)
const E_RC = E_CP.map((pts, i) => K.ride(`t22c${i}`, pts, 1.4 + i * 0.4, 1.9 + i * 0.4, E.PER))
const E_RK = K.ride('t22k', E_K, 2.6, 3.3, E.PER)
const E_RR = K.ride('t22r', E_RULE, 3.4, 4.1, E.PER)
const E_ENV = ['{SVCNAME}_SERVICE_HOST', '{SVCNAME}_SERVICE_PORT']

function Discovery({ p, phase }: { p: Record<string, unknown>; phase: 'a' | 'b' }) {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 2 }, 2400)
  const instant = useInstant()
  const b = phase === 'b'
  /* the T22 parts: built in T22, all there in T22B; the T22B parts: never in T22 */
  const dns = b || s(1)
  const eps = b || s(2)
  const rule = b && s(1)
  const env = b && s(2)
  const hDns = !b && hot === 0
  const hEps = !b && hot === 1
  const hRule = b && hot === 0
  const hEnv = b && hot === 1
  const cellLit = (i: number) => (hEps) || (hRule && i === 0)
  return (
    <Frame w={E.W} h={E.H}>
      {/* the DNS question and answer */}
      <W pts={E_Q} on={dns} lit={hDns} head={9} />
      <W pts={E_A} on={dns} lit={hDns} head={9} delay={300} />
      <Show on={dns} style={{ ...box(E.PX + E.TS / 2, E.QY - 28, E.DX - E.PX - E.TS, 18), zIndex: 3, display: 'grid', placeItems: 'center' }}>
        <span style={{ ...code(13), color: hDns ? ORANGE : colors.brand, transition: instant ? 'none' : `color 420ms ${EASE}` }}>service-name.namespace.svc.cluster.local</span>
      </Show>
      <Show on={dns} delay={300} style={{ ...box(300, E.AY + 8, 160, 18), zIndex: 3, display: 'grid', placeItems: 'center' }}>
        <span style={{ ...code(13), color: hDns ? ORANGE : colors.brand, transition: instant ? 'none' : `color 420ms ${EASE}` }}>{SVC_IP}</span>
      </Show>
      <Node x={E.PX} y={E.TY} mark={podMark} size={E.TS} label="Pod" up lit={hDns || hEnv} w={80}>
        <Disc x={2} y={E.TS - 2} icon="code" size={24} on={env} lit={hEnv} loop="pulse" />
      </Node>
      <Node x={E.DX} y={E.TY} mark={dnsMark} size={E.TS} label="CoreDNS" up lit={hDns} w={100} />
      <Token cls={E_RQ} on={dns} size={8} />
      <Token cls={E_RA} on={dns} size={8} />

      {/* the Service and its EndpointSlice */}
      <W pts={E_SE} on={eps} lit={hEps} head={9} />
      <Node x={E.SX} y={E.SY} mark={svcMark} size={E.SS} label="Service" lit={hDns} w={120} />
      <Panel x={E.CX} y={E.CY} w={E.CR - E.CX} h={E.CB - E.CY} on={eps} lit={hEps}>
        <div style={{ position: 'absolute', left: 20, top: 20, height: 30, display: 'flex', alignItems: 'center', gap: 10 }}>
          <MarkTile src={epMark} size={30} scale={0.74} lit={hEps} />
          <span style={{ ...heading(15), whiteSpace: 'nowrap' }}>EndpointSlice</span>
        </div>
        {E_PX.map((x, i) => (
          <div key={x} style={{ ...box(x - E.CX - E.CELLW / 2, E.CELLY - E.CY - 11, E.CELLW, 22), borderRadius: 7, background: '#F2F6FF', boxShadow: cellLit(i) ? `inset 0 0 0 2px ${ORANGE}` : 'inset 0 0 0 1.5px #D3DEF6', display: 'grid', placeItems: 'center', transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
            <span style={code(12)}>{IPS[i][0]}</span>
          </div>
        ))}
      </Panel>
      {E_CP.map((pts, i) => <W key={i} pts={pts} on={eps} lit={hEps || (hRule && i === 0)} head={9} delay={300 + i * 100} />)}
      {E_PX.map((x, i) => <Node key={x} x={x} y={E.PY} mark={podMark} size={E.PS} w={E.PS} lit={hEps || (hRule && i === 0)} />)}
      <Token cls={E_RS} on={eps} size={8} />
      {E_RC.map((c, i) => <Token key={i} cls={c} on={eps} size={8} />)}

      {/* kube-proxy on the node: its rule sends the ClusterIP to one pod endpoint (T22B) */}
      <W pts={E_K} on={rule} lit={hRule} head={9} />
      <W pts={E_RULE} on={rule} lit={hRule} head={9} delay={300} />
      <Node x={E.PX} y={E.KY} mark={proxyMark} size={E.KS} label="kube-proxy" sub="iptables / IPVS" subOn={rule} subLit={hRule} right lit={hRule}>
        <Disc x={2} y={2} mark={nodeMark} size={24} />
      </Node>
      <Token cls={E_RK} on={rule} size={9} />
      <Token cls={E_RR} on={rule} size={9} />

      {/* environment variables injected at pod start (T22B) */}
      <Panel x={E.EX} y={E.EY} w={E.EW} h={E.EH} on={env} lit={hEnv} radius={14}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', gap: 4, padding: '0 14px' }}>
          {E_ENV.map((v) => <span key={v} style={{ ...code(12), textAlign: 'left' }}>{v}</span>)}
        </div>
      </Panel>
    </Frame>
  )
}

const E_T22: Fig = (p) => <Discovery p={p} phase="a" />
const E_T22B: Fig = (p) => <Discovery p={p} phase="b" />

export const figures: Record<string, Fig> = { E_T18, E_T19, E_T20, E_T21, E_T22, E_T22B }
export const css = [K.css(), churnCss].join('\n')
