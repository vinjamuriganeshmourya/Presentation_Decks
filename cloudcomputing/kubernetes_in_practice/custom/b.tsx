import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, TILE_BG, TILE_RIM, Frame, Show, Plinth, MarkTile, Panel, Wire, Junction, Token, keyframes, loopCls, loopVars, tag, heading, useHeld, useHot, type Pt } from '@/engine/figkit'
import ingMark from '../images/k8s-ing.svg'
import nsMark from '../images/k8s-ns.svg'
import svcMark from '../images/k8s-svc.svg'
import podMark from '../images/k8s-pod.svg'
import nodeMark from '../images/k8s-node.svg'
import volMark from '../images/k8s-vol.svg'
import quotaMark from '../images/k8s-quota.svg'
import k8sMark from '../images/tech-kubernetes.svg'
import internetMark from '../images/res-internet.svg'
import clientMark from '../images/res-client.svg'
import elbMark from '../images/aws-elastic-load-balancing.svg'
import albMark from '../images/aws-application-load-balancer.svg'
import haproxyLogo from '../images/tech-haproxy.png'
import traefikLogo from '../images/tech-traefik.png'
import linuxMark from '../images/tech-linux.png'
import corednsMark from '../images/tech-coredns.svg'

/*
 * SESSION 21 · SECTION 2 (Ingress & Namespaces) technical figures, builder B.
 * Built to generate-slides standing correction 17 (Sessions 13-18): 3D icons on plinth tiles, official marks on white
 * tiles (Kubernetes marks for every Kubernetes object, never moving: their motion is the tile's halo or a badge),
 * >= 20 px padding inside every stage and card, orthogonal wires computed from the same constants as the boxes, a flow
 * dot on every live wire, a lit item walking first -> last -> first after the build (starting on the last).
 * Loops are transform / opacity on HTML elements or a root svg only. Held (?still): the full final state, nothing lit,
 * nothing moving. Class prefix `s21b-`.
 *
 *   slide 16 B_T05   546 x 360  three cards: Ingress (mark + traffic into a funnel), Namespaces (mark + fenced
 *                               partitions of pods), Requests / Limits (gauge + a dial whose needle stays under the
 *                               limit); press N builds card N's picture (3)
 *   slide 17 B_T06   566 x 360  Internet -> Ingress (Host / Path rules) -> three Services; press 1 the rules, press 2
 *                               three balancers collapse into one ELB, press 3 the controller switches the routes on (3)
 *   slide 19 B_T07   546 x 380  Client -> Ingress controller -> the Ingress routing table -> Service -> Pod, the
 *                               controller options (AWS Load Balancer Controller, HAProxy, Traefik) in a strip; press 2
 *                               the host rows, press 3 the path rows (3)
 *   slide 20 B_T07B  546 x 380  the same flow: press 1 HTTPS locked to the controller, plain HTTP onward; press 2 the
 *                               Application Load Balancer at the front (2)
 *   slide 21 B_T08   566 x 360  a cluster with dev / staging / prod namespaces, each a Pod and a Service; press 1 Linux
 *                               kernel namespaces set aside (processes); press 2 default / kube-system / kube-public tabs (2)
 *   slide 22 B_T08B  566 x 380  the same cluster: press 1 the Pods and Services light; press 2 Node and Persistent Volume
 *                               on the cluster edge, outside every namespace (2)
 *   slide 24 B_T09   546 x 360  dev and prod namespaces: press 1 a team in each; press 2 the dashed DNS wire via CoreDNS,
 *                               tagged name.namespace.svc.cluster.local, a request riding it; press 3 a quota on each (3)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('s21b')
const MONO = "'JetBrains Mono', ui-monospace, monospace"
const NOLIG: CSSProperties = { fontVariantLigatures: 'none', fontFeatureSettings: "'liga' 0, 'calt' 0" }
const LIT = `inset 0 0 0 2.5px ${ORANGE}, 0 10px 22px -12px rgba(255,138,61,0.7)`
const ROW_RIM = 'inset 0 0 0 1.5px #D3DEF6'

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)
const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })
const mono = (size = 13, color: string = colors.ink): CSSProperties => ({ fontFamily: MONO, ...NOLIG, fontSize: size, fontWeight: 600, lineHeight: 1.2, color, whiteSpace: 'nowrap' })

/** the build of a figure: the step, the lit item (the walk starts on the LAST item when the build ends), held */
function useBuild(p: Record<string, unknown>, period: number) {
  const cnt = Number(p.steps ?? 1)
  const held = useHeld()
  const step = held ? cnt : stepOf(p)
  const raw = useHot(cnt, stepOf(p), period)
  const hot = raw >= 0 && stepOf(p) >= cnt ? (raw + cnt - 1) % cnt : raw
  return { step, hot, held, s: (n: number) => step >= n, live: !held }
}

/** an official mark on its white tile or a 3D icon on its plinth; the TILE is centred on (x, y); tag under, above or beside */
function Node({ x, y, label, icon, mark, size = 52, k = 0.74, scale, on = true, lit = false, loop = 'bob', d = 0, t, w = 120, tagSize = 14, up = false, side, wrap, delay = 0, children }: { x: number; y: number; label?: string; icon?: Ico3DName; mark?: string; size?: number; k?: number; scale?: number; on?: boolean; lit?: boolean; loop?: Loop; d?: number; t?: number; w?: number; tagSize?: number; up?: boolean; side?: 'right' | 'left'; wrap?: number; delay?: number; children?: ReactNode }) {
  const tile = mark ? <MarkTile src={mark} size={size} lit={lit} scale={scale} /> : (
    <Plinth size={size} lit={lit}>
      <Ico3D name={icon ?? 'doc'} size={Math.round(size * k)} loop={loop} d={d} t={t} />
    </Plinth>
  )
  const tileBox = <div style={{ position: 'relative', width: size, height: size, flexShrink: 0, display: 'grid', placeItems: 'center' }}>{tile}{children}</div>
  const lab = label ? <span style={{ ...tag(tagSize), ...(wrap ? { whiteSpace: 'normal', width: wrap, textAlign: side === 'left' ? 'right' : side === 'right' ? 'left' : 'center' } : {}) }}>{label}</span> : null
  if (side) {
    return (
      <Show on={on} delay={delay} style={{ position: 'absolute', top: y - size / 2, height: size, zIndex: 3, display: 'flex', alignItems: 'center', gap: 8, flexDirection: side === 'right' ? 'row' : 'row-reverse', ...(side === 'right' ? { left: x - size / 2 } : { right: `calc(100% - ${x + size / 2}px)` }) }}>
        {tileBox}
        {lab}
      </Show>
    )
  }
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, width: w, zIndex: 3, display: 'flex', flexDirection: up ? 'column-reverse' : 'column', alignItems: 'center', gap: 6, ...(up ? { bottom: `calc(100% - ${y + size / 2}px)` } : { top: y - size / 2 }) }}>
      {tileBox}
      {lab}
    </Show>
  )
}

/** a small white disc holding a 3D icon, centred on (x, y) of its parent (a badge on a tile corner) */
function Disc({ x, y, on = true, size = 26, icon, loop = 'pulse', d = 0, t = 2.4 }: { x: number; y: number; on?: boolean; size?: number; icon: Ico3DName; loop?: Loop; d?: number; t?: number }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: 6, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6', display: 'grid', placeItems: 'center', opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}` }}>
      <Ico3D name={icon} size={size - 6} loop={loop} d={d} t={t} />
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

/** a wire on its own layer above the cards (a Panel is z 2 and would hide a wire drawn inside it); tiles (z 3) stay on top */
const W = (props: Parameters<typeof Wire>[0]) => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}><Wire {...props} /></div>
)

/** a wide vendor logo (HAProxy) on the same white tile, its own aspect kept; the halo breathes, the logo never moves */
function WideMark({ x, y, w, h, src, lw, on = true, lit = false }: { x: number; y: number; w: number; h: number; src: string; lw: number; on?: boolean; lit?: boolean }) {
  const instant = useInstant()
  const r = Math.round(h * 0.28)
  return (
    <Show on={on} style={{ ...box(x - w / 2, y - h / 2, w, h), zIndex: 3 }}>
      <span aria-hidden className={loopCls('halo')} style={{ position: 'absolute', inset: -5, borderRadius: r + 5, background: `radial-gradient(closest-side, ${colors.brand}30, ${colors.brand}00)`, ...loopVars(0.8, 3.6) }} />
      <span style={{ position: 'absolute', inset: 0, borderRadius: r, background: TILE_BG, boxShadow: lit ? LIT : TILE_RIM, display: 'grid', placeItems: 'center', transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
        <img src={src} alt="" aria-hidden draggable={false} style={{ width: lw, height: 'auto', display: 'block' }} />
      </span>
    </Show>
  )
}

/** a soft ripple ring round a tile of `size` centred on (x, y): the breathing of a Pod, never the mark itself */
function Breath({ x, y, size, d = 0, on = true }: { x: number; y: number; size: number; d?: number; on?: boolean }) {
  const held = useHeld()
  if (held || !on) return null
  const r = Math.round(size * 0.28)
  return <span aria-hidden className={loopCls('ripple')} style={{ ...box(x - size / 2, y - size / 2, size, size), borderRadius: r, boxShadow: `0 0 0 2px ${colors.brand}55`, zIndex: 2, pointerEvents: 'none', ...loopVars(d, 3) }} />
}

/* ================================================================== slide 16 · B_T05 · three cluster controls */

/*
 * 546 x 360. Three cards (w 158, gap 16: x 20, 194, 368; y 20..340). In each the identity tile (56) and its tag at the
 * top (tile centre 48 down the card), the picture below it (y 118..300 of the card). Ingress: three users' requests drop
 * through elbow wires into a funnel. Namespaces: a cluster tray split by picket fences into three partitions, two Pods
 * in each. Requests / Limits: a dial whose needle swings under the limit tick, over the Pod it measures.
 * Press 0 the three identity tiles (the lead names all three questions); press N draws card N's picture.
 */
const A = { W: 546, H: 360, CW: 158, CY: 20, CH: 320, TS: 56, PER: 2.7 }
const A_X = [20, 194, 368]
const A_MID = A.CW / 2 // 79
/* card 1 (card-local): three request sources (tiles 30 at y 150) and the funnel (76, centre 242) */
const A_SRC = [44, 79, 114]
const A_FUN = { y: 242, s: 76 }
const A_FT = A_FUN.y - A_FUN.s / 2 // 204, funnel top edge
const A_IN: Pt[][] = [
  [[A_SRC[0], 165], [A_SRC[0], 182], [61, 182], [61, A_FT]],
  [[A_SRC[1], 165], [A_SRC[1], A_FT]],
  [[A_SRC[2], 165], [A_SRC[2], 182], [97, 182], [97, A_FT]],
]
const A_RIDE = A_IN.map((pts, i) => K.ride(`t05in${i}`, pts.map(([x, y]) => [x + A_X[0], y + A.CY] as Pt), 0.1 + i * 0.8, 0.8 + i * 0.8, A.PER))
/* card 2: the tray (x 20..138, y 124..300), lanes 44 high, picket fences 12 high between them */
const A_TRAY = { x: 20, y: 124, w: 118, h: 176 }
const A_LANE = [134, 190, 246]
const A_LH = 44
/* card 3: the dial (a 240-degree arc, pivot (79, 194), radius 50), the Pod it measures under it */
const A_DIAL = { cx: 79, cy: 194, r: 50, th: 12, a0: -120, req: -25, lim: 78, a1: 120 }
const A_POD = { y: 256, s: 40 }
const polar = (cx: number, cy: number, r: number, deg: number): Pt => [cx + r * Math.sin((deg * Math.PI) / 180), cy - r * Math.cos((deg * Math.PI) / 180)]
const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const [x0, y0] = polar(cx, cy, r, a0)
  const [x1, y1] = polar(cx, cy, r, a1)
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
}

function Fence({ x, y, w }: { x: number; y: number; w: number }) {
  const n = Math.floor((w - 4) / 9)
  const held = useHeld()
  return (
    <svg aria-hidden className={held ? undefined : loopCls('breathe')} width={w} height={12} viewBox={`0 0 ${w} 12`} style={{ position: 'absolute', left: x, top: y, overflow: 'visible', ...loopVars(0, 2.6) }}>
      <rect x={0} y={4.5} width={w} height={3} rx={1.5} fill="#7FA0EA" />
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={4 + i * 9} y={0} width={4} height={12} rx={2} fill="#2D63FB" />
      ))}
    </svg>
  )
}

function Dial({ live }: { live: boolean }) {
  const { cx, cy, r, th, a0, req, lim, a1 } = A_DIAL
  const S = (r + th) * 2
  const o = cx - S / 2
  const oy = cy - S / 2
  const c = S / 2
  const L = r - 8
  const [lx0, ly0] = polar(c, c, r - th / 2 - 3, lim)
  const [lx1, ly1] = polar(c, c, r + th / 2 + 3, lim)
  return (
    <>
      <svg aria-hidden width={S} height={S} style={{ position: 'absolute', left: o, top: oy, overflow: 'visible' }}>
        <path d={arc(c, c, r, a0, a1)} fill="none" stroke="#E3EBFB" strokeWidth={th} strokeLinecap="round" />
        <path d={arc(c, c, r, a0, lim)} fill="none" stroke="#B5CAFF" strokeWidth={th} strokeLinecap="round" />
        <path d={arc(c, c, r, a0, req)} fill="none" stroke="#2D63FB" strokeWidth={th} strokeLinecap="round" />
        <line x1={lx0} y1={ly0} x2={lx1} y2={ly1} stroke="#00254B" strokeWidth={4} strokeLinecap="round" />
      </svg>
      {/* the needle: its own root svg, turned about its foot (the pivot); it swings up to just under the limit */}
      <svg aria-hidden className={live ? 's21b-needle' : undefined} width={14} height={L + 6} style={{ position: 'absolute', left: cx - 7, top: cy - L, overflow: 'visible', transformOrigin: `7px ${L}px`, transform: live ? undefined : 'rotate(30deg)' }}>
        <path d={`M 7 2 L 11 ${L} L 3 ${L} Z`} fill="#00254B" />
      </svg>
      <span aria-hidden style={{ ...box(cx - 9, cy - 9, 18, 18), borderRadius: 99, background: 'radial-gradient(circle at 35% 30%, #8DB0FF, #1640C8)', boxShadow: '0 0 0 3px #FFFFFF, 0 3px 6px -2px rgba(13,42,140,0.6)' }} />
    </>
  )
}

const B_T05: Fig = (p) => {
  const { hot, s, live } = useBuild({ ...p, steps: p.steps ?? 3 }, 2000)
  const head = [
    { mark: ingMark, label: 'Ingress' },
    { mark: nsMark, label: 'Namespaces' },
    { icon: 'gauge' as Ico3DName, label: 'Requests / Limits' },
  ]
  return (
    <Frame w={A.W} h={A.H}>
      {A_X.map((x, i) => (
        <Panel key={x} x={x} y={A.CY} w={A.CW} h={A.CH} lit={hot === i}>
          <Node x={A_MID} y={48} w={150} mark={head[i].mark} icon={head[i].icon} size={A.TS} label={head[i].label} lit={hot === i} loop="tilt" t={3.2} />
        </Panel>
      ))}

      {/* card 1: requests drop into the funnel */}
      <Show on={s(1)} style={{ ...box(A_X[0], A.CY, A.CW, A.CH), zIndex: 3 }}>
        {A_IN.map((pts, i) => <Wire key={i} pts={pts} on={s(1)} lit={hot === 0} head={8} width={2.2} delay={i * 120} />)}
        {A_SRC.map((x, i) => (
          <div key={x} style={{ ...box(x - 15, 135, 30, 30), zIndex: 3 }}>
            <Plinth size={30}><Ico3D name="user" size={23} loop="bob" d={i * 0.5} /></Plinth>
          </div>
        ))}
        <div style={{ ...box(A_MID - A_FUN.s / 2, A_FUN.y - A_FUN.s / 2, A_FUN.s, A_FUN.s), zIndex: 3 }}>
          <Plinth size={A_FUN.s} lit={hot === 0}><Ico3D name="filter" size={56} loop="pulse" t={2.7} /></Plinth>
        </div>
      </Show>
      {A_RIDE.map((c, i) => <Token key={i} cls={c} on={s(1)} size={8} />)}

      {/* card 2: fenced partitions, two Pods in each */}
      <Show on={s(2)} style={{ ...box(A_X[1], A.CY, A.CW, A.CH), zIndex: 3 }}>
        <div style={{ ...box(A_TRAY.x, A_TRAY.y, A_TRAY.w, A_TRAY.h), borderRadius: 14, background: '#F7F9FF', boxShadow: ROW_RIM }} />
        {A_LANE.map((y, i) => (
          <div key={y}>
            <div style={{ ...box(A_TRAY.x + 8, y, A_TRAY.w - 16, A_LH), borderRadius: 10, background: hot === 1 ? '#FFF4EC' : '#EAF0FF', transition: `background 420ms ${EASE}` }} />
            {[55, 103].map((x, j) => (
              <div key={x} style={{ ...box(x - 14, y + A_LH / 2 - 14, 28, 28) }}>
                <MarkTile src={podMark} size={28} scale={0.78} />
              </div>
            ))}
            {i < 2 && <Fence x={A_TRAY.x + 6} y={y + A_LH} w={A_TRAY.w - 12} />}
          </div>
        ))}
      </Show>

      {/* card 3: the gauge, its needle swinging under the limit, over the Pod it measures */}
      <Show on={s(3)} style={{ ...box(A_X[2], A.CY, A.CW, A.CH), zIndex: 3 }}>
        <Dial live={live} />
        <Breath x={A_MID} y={A_POD.y} size={A_POD.s} />
        <div style={{ ...box(A_MID - A_POD.s / 2, A_POD.y - A_POD.s / 2, A_POD.s, A_POD.s) }}>
          <MarkTile src={podMark} size={A_POD.s} scale={0.72} lit={hot === 2} />
        </div>
      </Show>
    </Frame>
  )
}

/* ================================================================== slide 17 · B_T06 · one entry, many services */

/*
 * 566 x 360, main row y 172. Internet (52) -> the balancer slot (148) -> the Ingress card (x 214..364, y 82..262: its
 * mark and tag at the top, the Host and Path rule rows under them) -> a junction (420) -> three Services (510; y 64, 172,
 * 280). The controller (gear, 289, 312) sits under the card, its wire up into the card's bottom edge.
 * Press 1 the rule rows; press 2 three balancers (one per Service) slide together into ONE Elastic Load Balancing tile;
 * press 3 the controller arrives, the power badge comes on and the dashed routes turn solid with requests split across
 * them. Before press 3 requests reach the Ingress and stop there.
 */
const B = { W: 566, H: 360, Y: 172, IX: 52, IS: 52, EX: 148, ES: 48, CL: 214, CR: 364, CT: 82, CB: 262, CX: 289, J: 420, SX: 510, SS: 48, GY: 312, GS: 40, PER: 4.2 }
const B_SY = [64, 172, 280]
const B_IN: Pt[] = [[B.IX + B.IS / 2, B.Y], [B.CL, B.Y]]
const B_INA: Pt[] = [[B.IX + B.IS / 2, B.Y], [B.EX - B.ES / 2, B.Y]]
const B_INB: Pt[] = [[B.EX + B.ES / 2, B.Y], [B.CL, B.Y]]
const B_OUT: Pt[] = [[B.CR, B.Y], [B.J, B.Y]]
const bBranch = (y: number): Pt[] => (y === B.Y ? [[B.J, y], [B.SX - B.SS / 2, y]] : [[B.J, B.Y], [B.J, y], [B.SX - B.SS / 2, y]])
const B_CTL: Pt[] = [[B.CX, B.GY - B.GS / 2], [B.CX, B.CB]]
const B_T0 = [0, 1.2, 2.4]
const B_RW = B_T0.map((t, i) => K.ride(`t06w${i}`, B_IN, t + 0.1, t + 0.9, B.PER))
const B_RA = B_T0.map((t, i) => K.ride(`t06a${i}`, B_INA, t + 0.1, t + 0.45, B.PER))
const B_RB = B_T0.map((t, i) => K.ride(`t06b${i}`, B_INB, t + 0.55, t + 0.85, B.PER))
const B_RS = B_T0.map((t, i) => K.ride(`t06s${i}`, [...B_OUT, ...bBranch(B_SY[i]).slice(1)], t + 1.0, t + 1.7, B.PER))
const B_RC = K.ride('t06c', B_CTL, 0.3, 0.9, 2.4)

function RuleRow({ x, y, w, h, text, lit }: { x: number; y: number; w: number; h: number; text: string; lit: boolean }) {
  const instant = useInstant()
  return (
    <div style={{ ...box(x, y, w, h), borderRadius: 9, background: '#F2F6FF', boxShadow: lit ? LIT : ROW_RIM, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
      <Ico3D name="filter" size={20} loop="pulse" t={2.6} />
      <span style={{ ...heading(14), fontWeight: 600 }}>{text}</span>
    </div>
  )
}

const B_T06: Fig = (p) => {
  const { hot, s, live } = useBuild({ ...p, steps: p.steps ?? 3 }, 2200)
  const instant = useInstant()
  const ghosts = s(2) && live && !instant
  return (
    <Frame w={B.W} h={B.H}>
      <Node x={B.IX} y={B.Y} mark={internetMark} size={B.IS} label="Internet" w={90} />

      {/* the entry: one straight wire until the balancer lands on it (press 2) */}
      <W pts={B_IN} on={!s(2)} head={9} />
      <W pts={B_INA} on={s(2)} lit={hot === 1} head={9} />
      <W pts={B_INB} on={s(2)} lit={hot === 1} head={9} delay={200} />
      {/* press 2: three balancers, one per Service, slide together into one */}
      {ghosts && [-1, 0, 1].map((k) => (
        <div key={k} aria-hidden className={k < 0 ? 's21b-gu' : k > 0 ? 's21b-gd' : 's21b-gc'} style={{ ...box(B.EX - B.ES / 2, B.Y - B.ES / 2, B.ES, B.ES), zIndex: 4, opacity: 0 }}>
          <MarkTile src={elbMark} size={B.ES} />
        </div>
      ))}
      <Node x={B.EX} y={B.Y} mark={elbMark} size={B.ES} label="Load Balancer" w={110} on={s(2)} lit={hot === 1} delay={ghosts ? 1700 : 0} />

      {/* the Ingress card */}
      <Panel x={B.CL} y={B.CT} w={B.CR - B.CL} h={B.CB - B.CT} lit={hot === 2}>
        <Node x={B.CX - B.CL} y={42} mark={ingMark} size={44} label="Ingress" w={120} />
        <Show on={s(1)} style={{ ...box(20, 98, B.CR - B.CL - 40, 26) }}>
          <RuleRow x={0} y={0} w={B.CR - B.CL - 40} h={26} text="Host" lit={hot === 0} />
        </Show>
        <Show on={s(1)} delay={150} style={{ ...box(20, 134, B.CR - B.CL - 40, 26) }}>
          <RuleRow x={0} y={0} w={B.CR - B.CL - 40} h={26} text="Path" lit={hot === 0} />
        </Show>
      </Panel>
      <Disc x={B.CR - 4} y={B.CT + 4} icon="power" size={28} on={s(3)} loop="pulse" />

      {/* the routes to the Services: dashed and faded until a controller runs (press 3) */}
      <W pts={B_OUT} on={!s(3)} head={0} dash="5 6" opacity={0.45} />
      {B_SY.map((y) => <W key={`d${y}`} pts={bBranch(y)} on={!s(3)} head={0} dash="5 6" opacity={0.45} />)}
      <W pts={B_OUT} on={s(3)} lit={hot === 2} head={0} />
      {B_SY.map((y, i) => <W key={y} pts={bBranch(y)} on={s(3)} lit={hot === 2} head={9} delay={200 + i * 100} />)}
      <Junction x={B.J} y={B.Y} on={s(3)} lit={hot === 2} />
      {B_SY.map((y, i) => <Node key={y} x={B.SX} y={y} mark={svcMark} size={B.SS} label="Service" w={90} />)}

      {/* press 3: the controller */}
      <W pts={B_CTL} on={s(3)} lit={hot === 2} head={8} />
      <Node x={B.CX} y={B.GY} icon="gear" size={B.GS} side="right" label="Controller" on={s(3)} lit={hot === 2} loop="spin" t={6} />

      {/* requests: before press 2 straight into the Ingress; after, through the balancer; after press 3, on to a Service */}
      {B_RW.map((c, i) => <Token key={i} cls={c} on={!s(2)} size={9} />)}
      {B_RA.map((c, i) => <Token key={`a${i}`} cls={c} on={s(2)} size={9} />)}
      {B_RB.map((c, i) => <Token key={`b${i}`} cls={c} on={s(2)} size={9} />)}
      {B_RS.map((c, i) => <Token key={`s${i}`} cls={c} on={s(3)} size={9} />)}
      <Token cls={B_RC} on={s(3)} size={7} />
    </Frame>
  )
}

/* ================================================================== slides 19-20 · B_T07 / B_T07B · controller and rules */

/*
 * 546 x 380. Left: the Client (44, 52; tag beside), a wire down to y 200 and right into the Ingress controller (a Pod,
 * 112, 200; a gear badge on its top-left corner, an unlock badge in T07-B; tag under). On that wire, T07-B's Application Load Balancer slot (44, 128). Centre: the Ingress
 * routing table (x 176..381, y 20..262): the Ingress mark and heading (y 55), four rule rows (centres 99, 141, 183, 225):
 * `shop.example.com`, `api.example.com` (host, globe), `/orders`, `/cart` (path, branch). Right: each row's Service (416)
 * and Pod (488), headed `Service` / `Pod` on the heading line. Bottom: the controller options strip (y 282..360): AWS Load
 * Balancer Controller (Elastic Load Balancing mark), HAProxy, Traefik, a thin link up to the controller.
 */
const C = { W: 546, H: 380, CLX: 44, CLY: 52, CS: 40, ALY: 128, AS: 36, KX: 112, KY: 200, KS: 48, PL: 176, PR: 381, PT: 20, PB: 262, HY: 55, RL: 190, RR: 367, RH: 34, SV: 416, PD: 488, TS: 34, ST: 282, SB: 360, PER: 4 }
const C_RY = [99, 141, 183, 225]
const C_ROWS: { text: string; icon: Ico3DName }[] = [
  { text: 'shop.example.com', icon: 'globe' },
  { text: 'api.example.com', icon: 'globe' },
  { text: '/orders', icon: 'branch' },
  { text: '/cart', icon: 'branch' },
]
const C_IN: Pt[] = [[C.CLX, C.CLY + C.CS / 2], [C.CLX, C.KY], [C.KX - C.KS / 2, C.KY]]
const C_INA: Pt[] = [[C.CLX, C.CLY + C.CS / 2], [C.CLX, C.ALY - C.AS / 2]]
const C_INB: Pt[] = [[C.CLX, C.ALY + C.AS / 2], [C.CLX, C.KY], [C.KX - C.KS / 2, C.KY]]
const C_KP: Pt[] = [[C.KX + C.KS / 2, C.KY], [C.PL, C.KY]]
const C_RS: Pt[][] = C_RY.map((y) => [[C.RR, y], [C.SV - C.TS / 2, y]])
const C_SP: Pt[][] = C_RY.map((y) => [[C.SV + C.TS / 2, y], [C.PD - C.TS / 2, y]])
const C_LINK: Pt[] = [[C.KX, 250], [C.KX, C.ST]]
/* a request every second: into the controller, into the table, then out of row i to its Service and Pod */
const C_R_IN = K.ride('t07in', C_IN, 0.05, 0.75, 1)
const C_R_KP = K.ride('t07kp', C_KP, 0.8, 0.98, 1)
const C_R_INA = K.ride('t07ia', C_INA, 0.05, 0.3, 1)
const C_R_INB = K.ride('t07ib', C_INB, 0.4, 0.75, 1)
const C_R_ROW = C_RY.map((_, i) => K.ride(`t07r${i}`, [...C_RS[i], [C.SV - C.TS / 2 + 0.1, C_RY[i]]], i * 1.0 + 0.1, i * 1.0 + 0.45, C.PER))
const C_R_POD = C_RY.map((_, i) => K.ride(`t07p${i}`, C_SP[i], i * 1.0 + 0.5, i * 1.0 + 0.85, C.PER))
/* T07-B: HTTPS locked to the controller (3 s), plain HTTP onward */
const C_L_IN = K.ride('t07bl', C_IN, 0.1, 1.3, 3)
const C_L_INA = K.ride('t07bla', C_INA, 0.1, 0.55, 3)
const C_L_INB = K.ride('t07blb', C_INB, 0.75, 1.3, 3)
const C_L_KP = K.ride('t07bh', C_KP, 1.55, 2.1, 3)

function CRow({ i, on, lit, delay = 0 }: { i: number; on: boolean; lit: boolean; delay?: number }) {
  const instant = useInstant()
  const r = C_ROWS[i]
  const y = C_RY[i]
  return (
    <Show on={on} delay={delay} style={{ ...box(C.RL, y - C.RH / 2, C.RR - C.RL, C.RH), zIndex: 3 }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 10, background: '#F2F6FF', boxShadow: lit ? LIT : ROW_RIM, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
        <span style={{ width: 24, height: 24, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 3px 8px -4px rgba(31,64,140,0.55)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Ico3D name={r.icon} size={19} loop={r.icon === 'globe' ? 'spin' : 'pulse'} t={r.icon === 'globe' ? 8 : 2.6} d={i * 0.4} />
        </span>
        <span style={mono(13)}>{r.text}</span>
      </div>
    </Show>
  )
}

function IngressFlow({ p, b }: { p: Record<string, unknown>; b: boolean }) {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? (b ? 2 : 3) }, 2400)
  /* T07: everything up to the press; T07-B: T07's final state, then its own two presses */
  const at = (n: number) => (b ? true : s(n))
  const rowOn = (i: number) => (b ? true : s(i < 2 ? 2 : 3))
  const rowLit = (i: number) => !b && ((hot === 1 && i < 2) || (hot === 2 && i >= 2))
  const ctlLit = !b && hot === 0
  const tls = b && s(1)
  const alb = b && s(2)
  const albLit = b && hot === 1
  const tlsLit = b && hot === 0
  return (
    <Frame w={C.W} h={C.H}>
      {/* the client */}
      <Node x={C.CLX} y={C.CLY} mark={clientMark} size={C.CS} label="Client" side="right" />

      {/* the entry wire, split round the ALB in T07-B press 2 */}
      <W pts={C_IN} on={!alb} lit={tlsLit} head={9} />
      <W pts={C_INA} on={alb} lit={tlsLit || albLit} head={8} />
      <W pts={C_INB} on={alb} lit={tlsLit} head={9} delay={200} />
      <Node x={C.CLX} y={C.ALY} mark={albMark} size={C.AS} label="Application Load Balancer" side="right" wrap={96} tagSize={13} on={alb} lit={albLit} />

      {/* the Ingress controller: a Pod running the controller */}
      <Node x={C.KX} y={C.KY} mark={podMark} size={C.KS} label="Ingress Controller" w={130} tagSize={13} lit={ctlLit || tlsLit}>
        <Disc x={2} y={2} icon={tls ? 'unlock' : 'gear'} size={24} loop={tls ? 'pulse' : 'spin'} t={tls ? 2.4 : 6} />
      </Node>
      <W pts={C_KP} lit={tlsLit} head={9} />

      {/* HTTPS / HTTP, T07-B press 1: what flows on each side of the controller */}
      <Show on={tls} style={{ ...box(C.CLX + 10, 80, 60, 18), zIndex: 3, display: 'flex', alignItems: 'center' }}>
        <span style={tag(13)}>HTTPS</span>
      </Show>
      <Show on={tls} delay={200} style={{ ...box(C.KX + C.KS / 2, C.KY - 24, C.PL - C.KX - C.KS / 2, 18), zIndex: 3, display: 'grid', placeItems: 'center' }}>
        <span style={tag(13)}>HTTP</span>
      </Show>

      {/* the routing table: the Ingress object's rules */}
      <Panel x={C.PL} y={C.PT} w={C.PR - C.PL} h={C.PB - C.PT} lit={albLit}>
        <div style={{ position: 'absolute', left: 20, top: C.HY - C.PT - 15, height: 30, display: 'flex', alignItems: 'center', gap: 10 }}>
          <MarkTile src={ingMark} size={30} lit={albLit} />
          <span style={heading(16)}>Ingress</span>
        </div>
      </Panel>
      {C_ROWS.map((_, i) => <CRow key={i} i={i} on={rowOn(i)} lit={rowLit(i)} delay={(i % 2) * 150} />)}

      {/* each rule's Service and Pod */}
      <Show on={at(2)} style={{ ...box(C.SV - 40, C.HY - 10, 80, 20), zIndex: 3, display: 'grid', placeItems: 'center' }}><span style={tag(14)}>Service</span></Show>
      <Show on={at(2)} style={{ ...box(C.PD - 30, C.HY - 10, 60, 20), zIndex: 3, display: 'grid', placeItems: 'center' }}><span style={tag(14)}>Pod</span></Show>
      {C_RY.map((y, i) => (
        <div key={y}>
          <W pts={C_RS[i]} on={rowOn(i)} lit={rowLit(i)} head={8} delay={200 + (i % 2) * 150} />
          <W pts={C_SP[i]} on={rowOn(i)} lit={rowLit(i)} head={8} delay={350 + (i % 2) * 150} />
          <Node x={C.SV} y={y} mark={svcMark} size={C.TS} on={rowOn(i)} lit={rowLit(i)} delay={250 + (i % 2) * 150} />
          <Node x={C.PD} y={y} mark={podMark} size={C.TS} on={rowOn(i)} lit={rowLit(i)} delay={400 + (i % 2) * 150} />
          <Breath x={C.PD} y={y} size={C.TS} d={i * 0.7} on={rowOn(i)} />
        </div>
      ))}

      {/* the controller options: AWS Load Balancer Controller, HAProxy, Traefik */}
      <W pts={C_LINK} on={at(1)} lit={ctlLit} head={0} width={1.8} />
      <Panel x={20} y={C.ST} w={C.W - 40} h={C.SB - C.ST} on={at(1)} lit={ctlLit} />
      <Node x={100} y={321} mark={elbMark} size={40} label="AWS Load Balancer Controller" side="right" wrap={132} tagSize={13} on={at(1)} lit={ctlLit || albLit} delay={100} />
      <WideMark x={336} y={321} w={112} h={40} src={haproxyLogo} lw={94} on={at(1)} />
      <Node x={442} y={321} mark={traefikLogo} size={40} scale={1.2} on={at(1)} delay={250} />

      {/* requests */}
      {!b && <Token cls={C_R_IN} size={9} />}
      {!b && <Token cls={C_R_KP} size={9} />}
      {!b && C_R_ROW.map((c, i) => <Token key={i} cls={c} on={rowOn(i)} size={8} />)}
      {!b && C_R_POD.map((c, i) => <Token key={`p${i}`} cls={c} on={rowOn(i)} size={8} />)}
      {b && !tls && <Token cls={C_R_IN} size={9} />}
      {b && !tls && <Token cls={C_R_KP} size={9} />}
      {b && tls && !alb && <Rider cls={C_L_IN} icon="lock" size={24} />}
      {b && alb && <Rider cls={C_L_INA} icon="lock" size={24} />}
      {b && alb && <Rider cls={C_L_INB} icon="lock" size={24} />}
      {b && tls && <Rider cls={C_L_KP} icon="doc" size={24} />}
      {b && C_R_ROW.map((c, i) => <Token key={i} cls={c} size={8} />)}
      {b && C_R_POD.map((c, i) => <Token key={`p${i}`} cls={c} size={8} />)}
    </Frame>
  )
}

const B_T07: Fig = (p) => <IngressFlow p={p} b={false} />
const B_T07B: Fig = (p) => <IngressFlow p={p} b />

/* ================================================================== slides 21-22 · B_T08 / B_T08B · namespaces */

/*
 * T08 566 x 360: the cluster (x 20..396, y 48..340; the Kubernetes mark and `Cluster` at its top) holding three
 * namespace boxes (w 104, gap 12: x 40, 156, 272; y 106..320), each its Namespace mark, name, a Pod and a Service; dev
 * and staging's Pods wear the same name badge. Press 1 Linux kernel namespaces set aside in their own card (x 416..546):
 * the Linux mark over two processes. Press 2 the built-in namespaces as tabs on the cluster's top edge.
 * T08-B 566 x 380: the same cluster widened to x 20..546 (y 58..350, tabs above); press 1 the Pods and Services light;
 * press 2 Node and Persistent Volume on the cluster's right edge, outside every namespace.
 */
const N = { BW: 104, BG: 12, BH: 214, POD: 92, SVC: 152, TS: 32 }
const N_X = [40, 156, 272]
const N_NAMES = ['dev', 'staging', 'prod']
const N_TABS = [{ t: 'default', w: 75 }, { t: 'kube-system', w: 106 }, { t: 'kube-public', w: 106 }]

function NsBox({ x, y, i, podLit, lit }: { x: number; y: number; i: number; podLit: boolean; lit: boolean }) {
  const cx = N.BW / 2
  return (
    <Panel x={x} y={y} w={N.BW} h={N.BH} lit={lit} tint="#F7F9FF">
      <div style={{ ...box(cx - 12, 20, 24, 24) }}><MarkTile src={nsMark} size={24} scale={0.78} /></div>
      <div style={{ ...box(0, 48, N.BW, 18), display: 'grid', placeItems: 'center' }}><span style={mono(14, colors.ink)}>{N_NAMES[i]}</span></div>
      <Breath x={cx} y={N.POD} size={N.TS} d={i * 0.8} />
      <Node x={cx} y={N.POD} mark={podMark} size={N.TS} label="Pod" w={N.BW} lit={podLit}>
        {/* dev and staging's Pods carry the same name: one identical name badge (the engine's tag, turned to blue) */}
        {i < 2 && <span style={{ position: 'absolute', inset: 0, filter: 'hue-rotate(200deg) saturate(1.1)' }}><Disc x={N.TS - 1} y={1} icon="tag" size={22} loop="tilt" t={2.8} /></span>}
      </Node>
      <Node x={cx} y={N.SVC} mark={svcMark} size={N.TS} label="Service" w={N.BW} lit={podLit} />
    </Panel>
  )
}

function Cluster({ y, w, lit = false, tabsOn, tabsLit, podLit }: { y: number; w: number; lit?: boolean; tabsOn: boolean; tabsLit: boolean; podLit: boolean }) {
  const instant = useInstant()
  let tx = 40
  return (
    <>
      {N_TABS.map((t, i) => {
        const x = tx
        tx += t.w + 8
        return (
          <Show key={t.t} on={tabsOn} delay={i * 120} style={{ ...box(x, y - 26, t.w, 28), zIndex: 1 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '10px 10px 0 0', background: tabsLit ? '#FFF4EC' : TILE_BG, boxShadow: tabsLit ? `inset 0 0 0 2px ${ORANGE}` : 'inset 0 0 0 1.5px #D3DEF6', display: 'grid', placeItems: 'center', paddingBottom: 2, transition: instant ? 'none' : `box-shadow 420ms ${EASE}, background 420ms ${EASE}` }}>
              <span style={mono(13)}>{t.t}</span>
            </div>
          </Show>
        )
      })}
      <Panel x={20} y={y} w={w} h={292} lit={lit}>
        <div style={{ position: 'absolute', left: 20, top: 20, height: 26, display: 'flex', alignItems: 'center', gap: 10 }}>
          <MarkTile src={k8sMark} size={26} scale={0.8} />
          <span style={heading(15)}>Cluster</span>
        </div>
      </Panel>
      {N_X.map((x, i) => <NsBox key={x} x={x} y={y + 58} i={i} podLit={podLit} lit={false} />)}
    </>
  )
}

const B_T08: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 2 }, 2400)
  const LX = 416
  const LW = 130
  return (
    <Frame w={566} h={360}>
      <Cluster y={48} w={376} tabsOn={s(2)} tabsLit={hot === 1} podLit={false} />
      {/* press 1: Linux kernel namespaces, set aside: they group processes, not objects */}
      <Panel x={LX} y={106} w={LW} h={N.BH} on={s(1)} lit={hot === 0} tint="#F7F9FF">
        <Node x={LW / 2} y={40} mark={linuxMark} size={40} scale={0.78} label="Linux Kernel Namespaces" wrap={90} w={LW} tagSize={13} lit={hot === 0} />
        <Node x={LW / 2 - 20} y={144} icon="gear" size={32} loop="spin" t={6} />
        <Node x={LW / 2 + 20} y={144} icon="gear" size={32} loop="spin" t={6} d={3} />
        <div style={{ ...box(0, 166, LW, 18), display: 'grid', placeItems: 'center' }}><span style={tag(14)}>Processes</span></div>
      </Panel>
    </Frame>
  )
}

const B_T08B: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 2 }, 2400)
  const CX = 461
  return (
    <Frame w={566} h={380}>
      <Cluster y={58} w={526} tabsOn podLit={hot === 0} tabsLit={false} />
      {/* press 2: cluster-scoped objects on the cluster's edge, outside every namespace */}
      <Node x={CX} y={186} mark={nodeMark} size={48} label="Node" w={120} on={s(2)} lit={hot === 1} />
      <Node x={CX} y={274} mark={volMark} size={48} label="Persistent Volume" w={130} on={s(2)} lit={hot === 1} delay={150} />
    </Frame>
  )
}

/* ================================================================== slide 24 · B_T09 · namespaces in practice */

/*
 * 546 x 360. Two namespace boxes (w 225: dev x 20..245, prod x 301..526; y 20..250), each its Namespace mark and name
 * (y 54), a Quota mark at the top right (press 3). dev: its team (77, 150) and two Pods (x 190; y 122, 196, tags to
 * the left). prod: a Pod and a Service (x 356; y 122, 196, tags to the right) and its team (476, 150). The DNS wire
 * (press 2), dashed: out of dev's lower Pod, down to y 288, across through CoreDNS (273, 288), up into prod's Service;
 * its tag `name.namespace.svc.cluster.local` under CoreDNS. A request rides it.
 */
const D = { W: 546, H: 360, BY: 20, BW: 225, BH: 230, HY: 54, R1: 122, R2: 196, TS: 40, WY: 288, DS: 40, PER: 3.2 }
const D_X = [20, 301]
const D_DEV = 190
const D_PRD = 356
const D_DNS = 273
const D_W1: Pt[] = [[D_DEV, D.R2 + D.TS / 2], [D_DEV, D.WY], [D_DNS - D.DS / 2, D.WY]]
const D_W2: Pt[] = [[D_DNS + D.DS / 2, D.WY], [D_PRD, D.WY], [D_PRD, D.R2 + D.TS / 2]]
const D_RQ1 = K.ride('t09a', D_W1, 0.1, 1.1, D.PER)
const D_RQ2 = K.ride('t09b', D_W2, 1.5, 2.5, D.PER)

function NsHead({ x, name, quota, qLit }: { x: number; name: string; quota: boolean; qLit: boolean }) {
  return (
    <>
      <div style={{ ...box(x + 20, D.HY - 14, 160, 28), zIndex: 3, display: 'flex', alignItems: 'center', gap: 10 }}>
        <MarkTile src={nsMark} size={28} scale={0.78} />
        <span style={mono(16)}>{name}</span>
      </div>
      <Node x={x + D.BW - 36} y={D.HY} mark={quotaMark} size={32} label="Quota" w={70} tagSize={13} on={quota} lit={qLit} />
    </>
  )
}

const B_T09: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 3 }, 2400)
  return (
    <Frame w={D.W} h={D.H}>
      {D_X.map((x, i) => <Panel key={x} x={x} y={D.BY} w={D.BW} h={D.BH} lit={hot === 0} tint="#F7F9FF" />)}
      <NsHead x={D_X[0]} name="dev" quota={s(3)} qLit={hot === 2} />
      <NsHead x={D_X[1]} name="prod" quota={s(3)} qLit={hot === 2} />

      {/* press 1: each team inside its own namespace */}
      <Node x={77} y={150} icon="users" size={54} label="Team" w={90} on={s(1)} lit={hot === 0} />
      <Node x={476} y={150} icon="users" size={54} label="Team" w={90} on={s(1)} lit={hot === 0} d={0.6} delay={150} />

      {/* the namespaced objects */}
      <Breath x={D_DEV} y={D.R1} size={D.TS} />
      <Node x={D_DEV} y={D.R1} mark={podMark} size={D.TS} label="Pod" side="left" />
      <Breath x={D_DEV} y={D.R2} size={D.TS} d={1} />
      <Node x={D_DEV} y={D.R2} mark={podMark} size={D.TS} label="Pod" side="left" lit={hot === 1} />
      <Breath x={D_PRD} y={D.R1} size={D.TS} d={0.5} />
      <Node x={D_PRD} y={D.R1} mark={podMark} size={D.TS} label="Pod" side="right" />
      <Node x={D_PRD} y={D.R2} mark={svcMark} size={D.TS} label="Service" side="right" lit={hot === 1} />

      {/* press 2: the cross-namespace DNS name, through CoreDNS */}
      <W pts={D_W1} on={s(2)} lit={hot === 1} head={8} dash="6 6" />
      <W pts={D_W2} on={s(2)} lit={hot === 1} head={9} dash="6 6" />
      <Node x={D_DNS} y={D.WY} mark={corednsMark} size={D.DS} on={s(2)} lit={hot === 1} delay={200} />
      <Show on={s(2)} delay={300} style={{ ...box(D_DNS - 150, D.WY + D.DS / 2 + 7, 300, 20), zIndex: 3, display: 'grid', placeItems: 'center' }}>
        <span style={mono(13, colors.brandDeep)}>name.namespace.svc.cluster.local</span>
      </Show>
      <Rider cls={D_RQ1} icon="search" size={24} on={s(2)} />
      <Rider cls={D_RQ2} icon="search" size={24} on={s(2)} />
    </Frame>
  )
}

export const figures: Record<string, Fig> = { B_T05, B_T06, B_T07, B_T07B, B_T08, B_T08B, B_T09 }

export const css = [
  K.css(),
  `@keyframes s21b-gu { 0% { opacity: 0; transform: translateY(-90px) scale(0.86) } 18% { opacity: 1; transform: translateY(-90px) scale(1) } 48% { opacity: 1; transform: translateY(-90px) scale(1) } 86% { opacity: 1; transform: translateY(0) scale(0.96) } 100% { opacity: 0; transform: translateY(0) scale(0.9) } }
.s21b-gu { animation: s21b-gu 2.2s cubic-bezier(0.45,0,0.55,1) forwards; }
@keyframes s21b-gd { 0% { opacity: 0; transform: translateY(90px) scale(0.86) } 18% { opacity: 1; transform: translateY(90px) scale(1) } 48% { opacity: 1; transform: translateY(90px) scale(1) } 86% { opacity: 1; transform: translateY(0) scale(0.96) } 100% { opacity: 0; transform: translateY(0) scale(0.9) } }
.s21b-gd { animation: s21b-gd 2.2s cubic-bezier(0.45,0,0.55,1) forwards; }
@keyframes s21b-gc { 0% { opacity: 0; transform: scale(0.86) } 18% { opacity: 1; transform: scale(1) } 82% { opacity: 1; transform: scale(1) } 100% { opacity: 0; transform: scale(1) } }
.s21b-gc { animation: s21b-gc 2.2s cubic-bezier(0.45,0,0.55,1) forwards; }
@keyframes s21b-needle { 0%, 100% { transform: rotate(-95deg) } 50% { transform: rotate(68deg) } }
.s21b-needle { animation: s21b-needle 3.4s cubic-bezier(0.45,0,0.55,1) infinite; }
.cc-still .s21b-needle, .deck-thumb .s21b-needle, .cc-still .s21b-gu, .deck-thumb .s21b-gu, .cc-still .s21b-gd, .deck-thumb .s21b-gd, .cc-still .s21b-gc, .deck-thumb .s21b-gc { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .s21b-needle { animation: none !important; } }`,
].join('\n')
