import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, Frame, Show, Plinth, MarkTile, Panel, Wire, Junction, Token, keyframes, loopCls, loopVars, tag, heading, useHeld, useHot, type Pt } from '@/engine/figkit'
import deployMark from '../images/k8s-deploy.svg'
import rsMark from '../images/k8s-rs.svg'
import podMark from '../images/k8s-pod.svg'
import cpMark from '../images/k8s-control-plane.svg'
import nodeMark from '../images/k8s-node.svg'
import schedMark from '../images/k8s-sched.svg'
import kubeletMark from '../images/k8s-kubelet.svg'
import eksMark from '../images/aws-eks.svg'

/*
 * SESSION 20 · SECTION 4 (Deployments & ReplicaSets) technical figures, builder D.
 * Built to generate-slides standing correction 17: 3D icons on plinth tiles, the Kubernetes project's own marks on white
 * tiles, >= 20 px equal padding, orthogonal wires computed from the same constants as the boxes, a flow dot on every
 * live wire, a lit item walking first -> last -> first after the build (the walk starts on the LAST item). Loops are
 * transform / opacity on HTML elements only. Held (?still): the full final state, nothing lit, nothing moving.
 * A pair of slides that shares one picture (T14/T14-B, T15/T15-B, T16/T16-B) is ONE component with a `from` offset:
 * the B slide opens on the A slide's final state and goes on from there. Class prefix `s20d-`.
 *
 *   slide 31 D_T14   566 x 360  deployment.yaml -> Deployment -> pods, Continuously Enforced loop; 1 replica and image
 *                               lines light, 2 the kubectl apply terminal submits it
 *   slide 32 D_T14B  566 x 360  same: 3 the one-time command fades, the declared state stays; 4 the ReplicaSet appears
 *   slide 34 D_T15   566 x 360  Control Plane (Deployment) | ReplicaSet with its Reconcile loop | Node (pods); 1 labels
 *                               match the selector, 2 desired vs actual (one pod missing), 3 the pod made from the template
 *   slide 35 D_T15B  566 x 360  same: 4 an extra matching pod terminated, 5 Deployment -> ReplicaSet -> pods, the direct
 *                               path blocked
 *   slide 36 D_T16   546 x 320  timeline strip T0..T3 under web-deployment: 1 three pods, 2 T0 x4k2p deleted, 3 T1 2 vs 3
 *   slide 37 D_T16B  546 x 320  same strip: 4 T2 scheduled within 5 seconds, 5 T3 q8z1n runs, count back at 3
 *   slide 38 D_T17   586 x 360  drawn EKS console Workloads tab + the kubectl scale terminal; 1 the counts climb to 5,
 *                               2 the Desired and Current columns lit
 *   slide 39 D_T17B  566 x 320  Deployment -> old / new ReplicaSet rows; 1 the rolling swap, 2 scale down / scale up
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('s20d')
const BLUE = colors.brand
const MONO = "'Fira Code', ui-monospace, monospace"
const NOLIG: CSSProperties = { fontVariantLigatures: 'none', fontFeatureSettings: "'liga' 0, 'calt' 0" }
const SLOT = '#B7C8EE'
const nm = (n: string) => n as Ico3DName

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)
const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })
const mono = (size = 13, color: string = colors.ink, weight = 600): CSSProperties => ({ fontFamily: MONO, ...NOLIG, fontSize: size, fontWeight: weight, lineHeight: 1.2, color, whiteSpace: 'nowrap' })

/** the build of a figure that may run over two slides (`from`): the global step, the lit item (global), held */
function useBuild(p: Record<string, unknown>, period: number) {
  const off = Number(p.from ?? 0)
  const cnt = Number(p.steps ?? 1)
  const held = useHeld()
  const step = held ? off + cnt : stepOf(p) + off
  /* figkit's walk starts at item 0 the moment the build ends, so the last press would light the FIRST item; start the
     walk on the last item instead, so the final press lights what it built */
  const raw = useHot(cnt, stepOf(p), period)
  const local = raw >= 0 && stepOf(p) >= cnt ? (raw + cnt - 1) % cnt : raw
  const hot = local < 0 ? -1 : local + off
  return { step, hot, held, s: (n: number) => step >= n, live: !held }
}

/** a 3D icon or an official mark on its white tile; the TILE is centred on (x, y); the tag under it, `up` above, `side` right */
function Node({ x, y, label, icon, mark, size = 52, k = 0.74, on = true, lit = false, loop = 'bob', d = 0, t, w = 120, tagSize = 14, dim = false, up = false, side = false, delay = 0, z = 3, children }: { x: number; y: number; label?: string; icon?: string; mark?: string; size?: number; k?: number; on?: boolean; lit?: boolean; loop?: Loop; d?: number; t?: number; w?: number; tagSize?: number; dim?: boolean; up?: boolean; side?: boolean; delay?: number; z?: number; children?: ReactNode }) {
  const instant = useInstant()
  const tile = mark ? <MarkTile src={mark} size={size} lit={lit} /> : (
    <Plinth size={size} lit={lit}>
      <Ico3D name={nm(icon ?? 'doc')} size={Math.round(size * k)} loop={loop} d={d} t={t} />
    </Plinth>
  )
  const tileBox = (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0, display: 'grid', placeItems: 'center' }}>
      <div style={{ opacity: dim ? 0.4 : 1, filter: dim ? 'grayscale(1)' : undefined, transition: instant ? 'none' : `opacity 520ms ${EASE}, filter 520ms ${EASE}` }}>{tile}</div>
      {children}
    </div>
  )
  const lab = label ? <span style={{ ...tag(tagSize), ...(side ? { textAlign: 'left' } : {}) }}>{label}</span> : null
  if (side) {
    return (
      <Show on={on} delay={delay} style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, height: size, zIndex: z, display: 'flex', alignItems: 'center', gap: 10 }}>
        {tileBox}
        {lab}
      </Show>
    )
  }
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, width: w, zIndex: z, display: 'flex', flexDirection: up ? 'column-reverse' : 'column', alignItems: 'center', gap: 6, ...(up ? { bottom: `calc(100% - ${y + size / 2}px)` } : { top: y - size / 2 }) }}>
      {tileBox}
      {lab}
    </Show>
  )
}

/** a small white disc holding a 3D icon, centred on (x, y) of the frame (a badge on a tile's corner, or on a wire) */
function Disc({ x, y, on = true, size = 26, icon, loop = 'pulse', d = 0, t = 2.4, z = 6 }: { x: number; y: number; on?: boolean; size?: number; icon: string; loop?: Loop; d?: number; t?: number; z?: number }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: z, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6', display: 'grid', placeItems: 'center', opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}` }}>
      <Ico3D name={nm(icon)} size={size - 7} loop={loop} d={d} t={t} />
    </span>
  )
}

/** a glossy ORANGE cross ball (failure is orange in this course, never red; the engine's `cross` is red) */
function XBall({ size = 22, d = 0 }: { size?: number; d?: number }) {
  const r = size / 2
  return (
    <span aria-hidden className="i3d i3d-beat" style={{ display: 'grid', placeItems: 'center', width: size, height: size, flexShrink: 0, borderRadius: 99, background: 'radial-gradient(circle at 34% 28%, #FFD9BC 0%, #FF9A55 32%, #FF8A3D 55%, #E8642A 82%, #B4461A 100%)', boxShadow: '0 0 0 2px #FFFFFF, 0 4px 8px -3px rgba(180,70,26,0.6)', ['--i3d-d' as string]: `${-d}s`, ['--i3d-t' as string]: '2.2s' } as CSSProperties}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
        <path d={`M ${r * 0.62} ${r * 0.62} L ${r * 1.38} ${r * 1.38} M ${r * 1.38} ${r * 0.62} L ${r * 0.62} ${r * 1.38}`} stroke="#FFFFFF" strokeWidth={Math.max(2.4, size * 0.13)} strokeLinecap="round" />
      </svg>
    </span>
  )
}

/** an XBall placed with its centre on (x, y) of the frame */
function XAt({ x, y, on = true, size = 22, d = 0 }: { x: number; y: number; on?: boolean; size?: number; d?: number }) {
  const instant = useInstant()
  return (
    <span aria-hidden style={{ ...box(x - size / 2, y - size / 2, size, size), zIndex: 6, display: 'grid', placeItems: 'center', opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE} 300ms` }}>
      <XBall size={size} d={d} />
    </span>
  )
}

/** a white disc carrying a mini 3D icon (or a mark) along a `ride` class; nothing on held frames */
function Rider({ cls, icon, mark, size = 24, on = true }: { cls: string; icon?: string; mark?: string; size?: number; on?: boolean }) {
  const held = useHeld()
  if (held || !on) return null
  return (
    <span aria-hidden style={{ position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, zIndex: 7, pointerEvents: 'none' }}>
      <span className={cls} style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -4px rgba(31,64,140,0.55)', opacity: 0 }}>
        {mark ? <img src={mark} alt="" draggable={false} style={{ width: size - 7, height: size - 7, display: 'block' }} /> : <Ico3D name={nm(icon ?? 'doc')} size={size - 6} loop="none" />}
      </span>
    </span>
  )
}

/** a wire on its own layer above the cards (a Panel is z 2 and would hide a wire drawn inside it); tiles (z 3) stay on top */
const W = (props: Parameters<typeof Wire>[0]) => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}><Wire {...props} /></div>
)

/** an empty dashed slot where a pod was (or will be), centred on (x, y) */
function Slot({ x, y, size, on = true }: { x: number; y: number; size: number; on?: boolean }) {
  const instant = useInstant()
  return <span aria-hidden style={{ ...box(x - size / 2, y - size / 2, size, size), zIndex: 2, borderRadius: Math.round(size * 0.28), border: `2px dashed ${SLOT}`, background: '#F7F9FF', opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE}` }} />
}

/** a title row: an official mark on its tile and the heading beside it, the row's left edge at x, centred on y */
function TitleRow({ x, y, mark, text, size = 30, lit = false }: { x: number; y: number; mark: string; text: string; size?: number; lit?: boolean }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y - size / 2, height: size, display: 'flex', alignItems: 'center', gap: 10, zIndex: 3 }}>
      <MarkTile src={mark} size={size} lit={lit} />
      <span style={{ ...heading(15), whiteSpace: 'nowrap' }}>{text}</span>
    </div>
  )
}

/** a terminal window (dark, three window dots, Fira Code), the command typed after a `$` prompt; a cursor blinks */
function Term({ x, y, w, h, lines, on = true, lit = false, dim = false, delay = 0, size = 13 }: { x: number; y: number; w: number; h: number; lines: string[]; on?: boolean; lit?: boolean; dim?: boolean; delay?: number; size?: number }) {
  const instant = useInstant()
  const held = useHeld()
  return (
    <Show on={on} delay={delay} style={{ ...box(x, y, w, h), zIndex: 3 }}>
      <div data-fk="card" style={{ position: 'absolute', inset: 0, borderRadius: 14, background: 'linear-gradient(180deg, #13244F 0%, #0C1A3A 100%)', boxShadow: lit ? `inset 0 0 0 2.5px ${ORANGE}, 0 12px 24px -14px rgba(8,16,38,0.7)` : 'inset 0 0 0 1.5px #263C73, 0 12px 24px -14px rgba(8,16,38,0.7)', padding: 20, display: 'flex', flexDirection: 'column', gap: 12, opacity: dim ? 0.38 : 1, filter: dim ? 'grayscale(0.8)' : undefined, transition: instant ? 'none' : `opacity 620ms ${EASE}, filter 620ms ${EASE}, box-shadow 420ms ${EASE}` }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['#FF8A3D', '#FFC53A', '#25BC6E'].map((c) => <span key={c} style={{ width: 8, height: 8, borderRadius: 99, background: c, opacity: 0.9 }} />)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {lines.map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={mono(size, i === 0 ? '#7FA8FF' : 'transparent')}>$</span>
              <span style={mono(size, '#E8F0FF', 500)}>{l}</span>
              {i === lines.length - 1 && <span aria-hidden className={held || dim ? undefined : loopCls('blink')} style={{ width: 7, height: size + 2, background: '#7FA8FF', borderRadius: 1, opacity: held ? 0.9 : undefined, ...loopVars(0, 1.1) }} />}
            </div>
          ))}
        </div>
      </div>
    </Show>
  )
}

/* ================================================================== slides 31-32 · D_T14 / D_T14B · the Deployment */

/*
 * 566 x 360. The deployment.yaml card (x 20..220, y 20..184: the file name row, four YAML lines) feeds the Deployment
 * (mark, 380, 76) along y 76. Under the Deployment the trunk drops to a junction (380, 226) and fans to three pods
 * (x 300 / 380 / 460, y 282). The Continuously Enforced loop leaves the last pod's right edge, runs up x 530 and enters
 * the Deployment's right edge; its turning disc sits on x 530. The kubectl apply terminal (x 20..220, y 222..340) joins
 * the feed at (254, 76). Global presses: 1 the replica and image lines, 2 the terminal submits | 3 the terminal fades
 * (one-time) while the file keeps feeding, 4 the ReplicaSet (380, 166) appears on the trunk.
 */
const A = { W: 566, H: 360, YX0: 20, YX1: 220, YY0: 20, YY1: 184, TY0: 222, TY1: 340, DX: 380, DY: 76, DS: 56, JX: 254, RY: 166, RS: 48, FJ: 226, PY: 282, PS: 46, LX: 530, PER: 3.6 }
const A_PX = [300, 380, 460]
const A_TCY = (A.TY0 + A.TY1) / 2 // 281
const A_FEED: Pt[] = [[A.YX1, A.DY], [A.DX - A.DS / 2, A.DY]]
const A_TW: Pt[] = [[A.YX1, A_TCY], [A.JX, A_TCY], [A.JX, A.DY]]
const A_TRUNK: Pt[] = [[A.DX, A.DY + A.DS / 2], [A.DX, A.FJ]]
const A_TOP: Pt[] = [[A.DX, A.DY + A.DS / 2], [A.DX, A.RY - A.RS / 2]]
const A_LOW: Pt[] = [[A.DX, A.RY + A.RS / 2], [A.DX, A.FJ]]
const aBranch = (x: number): Pt[] => (x === A.DX ? [[A.DX, A.FJ], [x, A.PY - A.PS / 2]] : [[A.DX, A.FJ], [x, A.FJ], [x, A.PY - A.PS / 2]])
const A_LOOP: Pt[] = [[A_PX[2] + A.PS / 2, A.PY], [A.LX, A.PY], [A.LX, A.DY], [A.DX + A.DS / 2, A.DY]]
const A_RFILE = K.ride('t14f', A_FEED, 0.15, 0.95, A.PER)
const A_RTERM = K.ride('t14t', [...A_TW, [A.DX - A.DS / 2, A.DY]], 0.1, 1.15, A.PER)
const A_RPOD = A_PX.map((x, i) => K.ride(`t14p${i}`, [A_TRUNK[0], ...aBranch(x)], 1.15 + i * 0.12, 2.0 + i * 0.12, A.PER))
const A_RPODR = A_PX.map((x, i) => K.ride(`t14q${i}`, [[A.DX, A.RY + A.RS / 2], ...aBranch(x)], 1.3 + i * 0.12, 2.0 + i * 0.12, A.PER))
const A_RLOOP = K.ride('t14l', A_LOOP, 2.25, 3.45, A.PER)
const A_YAML = ['kind: Deployment', 'spec:', '  replicas: 3', '  image: web:v1']

function DeployPicture(p: Record<string, unknown>) {
  const { hot, s } = useBuild(p, 2200)
  const instant = useInstant()
  const termOn = s(2) && !s(3) // the command is being submitted
  const rs = s(4)
  return (
    <Frame w={A.W} h={A.H}>
      {/* the declared state: deployment.yaml */}
      <Panel x={A.YX0} y={A.YY0} w={A.YX1 - A.YX0} h={A.YY1 - A.YY0} lit={hot === 0 || hot === 2} radius={16}>
        <div style={{ position: 'absolute', left: 20, top: 20, height: 28, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plinth size={28}><Ico3D name="doc" size={20} loop="bob" /></Plinth>
          <span style={mono(13, colors.ink, 600)}>deployment.yaml</span>
        </div>
        {A_YAML.map((l, i) => {
          const key = i >= 2
          const on = key && hot === 0
          return (
            <div key={l} style={{ ...box(14, 60 + i * 21, A.YX1 - A.YX0 - 28, 21), borderRadius: 6, display: 'flex', alignItems: 'center', paddingLeft: 6, background: on ? `${BLUE}1F` : 'transparent', transition: instant ? 'none' : `background 420ms ${EASE}` }}>
              <span style={{ ...mono(13, on ? colors.brandDark : key ? colors.ink : colors.muted, key ? 600 : 500), whiteSpace: 'pre', transition: instant ? 'none' : `color 420ms ${EASE}` }}>{l}</span>
            </div>
          )
        })}
      </Panel>
      <W pts={A_FEED} lit={hot === 0 || hot === 2} head={9} />

      {/* the Deployment and its pods */}
      <Node x={A.DX} y={A.DY} mark={deployMark} size={A.DS} label="Deployment" up w={110} lit={hot === 2} />
      {rs ? (
        <>
          <W pts={A_TOP} lit={hot === 3} head={8} />
          <W pts={A_LOW} lit={hot === 3} head={0} />
        </>
      ) : <W pts={A_TRUNK} head={0} />}
      {A_PX.map((x) => <W key={x} pts={aBranch(x)} lit={hot === 3} head={8} />)}
      <Junction x={A.DX} y={A.FJ} lit={hot === 3} />
      {A_PX.map((x) => <Node key={x} x={x} y={A.PY} mark={podMark} size={A.PS} label="Pod" w={70} />)}
      <Node x={A.DX} y={A.RY} mark={rsMark} size={A.RS} label="ReplicaSet" side on={rs} lit={hot === 3} />

      {/* the loop that keeps the pods matching the file */}
      <W pts={A_LOOP} lit={hot === 2} head={9} />
      <Disc x={A.LX} y={(A.PY + A.DY) / 2} icon="refresh" loop="spin" t={4} size={28} />
      <Show on style={{ ...box(A.DX + A.DS / 2 + 4, A.DY + 16, A.LX - A.DX - A.DS / 2 - 18, 40), zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <span style={tag(14)}>Continuously</span>
        <span style={tag(14)}>Enforced</span>
      </Show>

      {/* the kubectl apply terminal: a one-time command */}
      <Term x={A.YX0} y={A.TY0} w={A.YX1 - A.YX0} h={A.TY1 - A.TY0} lines={['kubectl apply', '-f deployment.yaml']} on={s(2)} lit={hot === 1} dim={s(3)} />
      <W pts={A_TW} on={s(2)} lit={hot === 1} head={0} dash={s(3) ? '5 6' : undefined} opacity={s(3) ? 0.45 : 1} />
      <Junction x={A.JX} y={A.DY} on={s(2)} lit={hot === 1} />

      {/* flow: the file (or the command carrying it) into the Deployment, down to the pods, round the loop */}
      {termOn ? <Rider cls={A_RTERM} icon="doc" size={22} /> : <Rider cls={A_RFILE} icon="doc" size={22} />}
      {(rs ? A_RPODR : A_RPOD).map((c, i) => <Token key={i} cls={c} size={8} />)}
      <Token cls={A_RLOOP} size={9} />
    </Frame>
  )
}

const D_T14: Fig = (p) => <DeployPicture {...p} steps={p.steps ?? 2} from={0} />
const D_T14B: Fig = (p) => <DeployPicture {...p} steps={p.steps ?? 2} from={2} />

/* ================================================================== slides 34-35 · D_T15 / D_T15B · the reconciliation loop */

/*
 * 566 x 360. The architecture picture, small: the Control Plane card (x 20..206) holding the Deployment (113, 166), the
 * Node card (x 330..546) holding the pods (x 370; rows y 104 / 166 / 228, a fourth slot at 290), and the ReplicaSet
 * (268, 166) between them, its Reconcile loop under it (x 252..284 down to y 236, the turning disc inside). The fan
 * leaves the ReplicaSet's right edge to a junction (318, 166) and each pod's left edge. Global presses: 1 the selector
 * `app: web` under the loop and each pod's label, 2 Desired 3 against Actual 2 (the third pod missing), 3 the pod made
 * again from the pod template (plus) | 4 an extra matching pod terminated (minus), 5 the chain lit and the direct
 * Deployment-to-pods path blocked (dashed, an orange cross before the Node card).
 */
const B = { W: 566, H: 360, CX0: 20, CX1: 206, NX0: 330, NX1: 546, Y0: 20, Y1: 340, TY: 48, DX: 113, RX: 268, Y: 166, MS: 52, JX: 318, PX: 370, PS: 40, LB: 236, BY: 84, PER: 3.4 }
const B_PY = [104, 166, 228, 290]
const B_DR: Pt[] = [[B.DX + B.MS / 2, B.Y], [B.RX - B.MS / 2, B.Y]]
const B_TRUNK: Pt[] = [[B.RX + B.MS / 2, B.Y], [B.JX, B.Y]]
const bBranch = (y: number): Pt[] => (y === B.Y ? [[B.JX, y], [B.PX - B.PS / 2, y]] : [[B.JX, B.Y], [B.JX, y], [B.PX - B.PS / 2, y]])
const B_LOOP: Pt[] = [[B.RX + 16, B.Y + B.MS / 2], [B.RX + 16, B.LB], [B.RX - 16, B.LB], [B.RX - 16, B.Y + B.MS / 2]]
const B_BLOCK: Pt[] = [[B.DX, B.Y - B.MS / 2], [B.DX, B.BY], [289, B.BY]]
const B_RDR = K.ride('t15d', B_DR, 0.1, 0.8, B.PER)
const B_RPOD = B_PY.map((y, i) => K.ride(`t15p${i}`, [...B_TRUNK, ...bBranch(y).slice(1)], 0.9 + i * 0.12, 1.6 + i * 0.12, B.PER))
const B_RLOOP = K.ride('t15l', B_LOOP, 1.9, 3.0, B.PER)
const B_RTPL = K.ride('t15t', [...B_TRUNK, ...bBranch(B_PY[2]).slice(1)], 0.9, 1.9, B.PER)

/** a pod row in the Node card: the pod mark, `Pod`, and (from press 1) its label `app: web` */
function PodRow({ y, on = true, labels, lit, dim = false, delay = 0 }: { y: number; on?: boolean; labels: boolean; lit: boolean; dim?: boolean; delay?: number }) {
  const instant = useInstant()
  return (
    <Show on={on} delay={delay} style={{ ...box(B.PX - B.PS / 2, y - B.PS / 2, B.NX1 - 20 - (B.PX - B.PS / 2), B.PS), zIndex: 3, display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: dim ? 0.4 : 1, filter: dim ? 'grayscale(1)' : undefined, transition: instant ? 'none' : `opacity 620ms ${EASE}, filter 620ms ${EASE}` }}>
        <MarkTile src={podMark} size={B.PS} lit={lit} />
        <span style={{ ...tag(14), width: 28, textAlign: 'left' }}>Pod</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: labels ? 1 : 0, transform: labels ? 'none' : 'translateX(-6px)', transition: instant ? 'none' : `opacity 520ms ${EASE}, transform 520ms ${EASE}` }}>
          <Ico3D name="tag" size={20} loop="tilt" d={y / 100} />
          <span style={mono(12, lit ? colors.brandDark : colors.ink)}>app: web</span>
        </span>
      </div>
    </Show>
  )
}

function ReconcilePicture(p: Record<string, unknown>) {
  const { hot, s, step } = useBuild(p, 2200)
  const missing = step === 2 // press 2: the third pod has gone, the loop sees 2 against 3
  const chain = hot === 4
  return (
    <Frame w={B.W} h={B.H}>
      {/* the architecture, small: Control Plane | Node */}
      <Panel x={B.CX0} y={B.Y0} w={B.CX1 - B.CX0} h={B.Y1 - B.Y0} />
      <TitleRow x={B.CX0 + 20} y={B.TY} mark={cpMark} text="Control Plane" />
      <Panel x={B.NX0} y={B.Y0} w={B.NX1 - B.NX0} h={B.Y1 - B.Y0} />
      <TitleRow x={B.NX0 + 20} y={B.TY} mark={nodeMark} text="Node" />

      {/* Deployment -> ReplicaSet -> pods */}
      <Node x={B.DX} y={B.Y} mark={deployMark} size={B.MS} label="Deployment" w={110} lit={chain} />
      <W pts={B_DR} lit={chain} head={9} />
      <Node x={B.RX} y={B.Y} mark={rsMark} size={B.MS} label="ReplicaSet" up w={100} lit={hot === 0 || hot === 1 || chain} />
      <W pts={B_TRUNK} lit={chain} head={0} />
      {B_PY.slice(0, 3).map((y, i) => <W key={y} pts={bBranch(y)} lit={chain || (hot === 2 && i === 2)} head={8} dash={missing && i === 2 ? '5 6' : undefined} opacity={missing && i === 2 ? 0.45 : 1} />)}
      <W pts={bBranch(B_PY[3])} on={s(4)} lit={hot === 3} head={8} dash="5 6" opacity={0.55} />
      <Junction x={B.JX} y={B.Y} lit={chain} />

      {/* the Reconcile loop under the ReplicaSet, its disc turning inside it */}
      <W pts={B_LOOP} lit={hot === 1} head={8} />
      <Disc x={B.RX} y={B.LB - 22} icon="refresh" loop="spin" t={3.6} size={24} on={s(2)} />
      <Show on style={{ ...box(B.RX - 50, B.LB + 8, 100, 18), zIndex: 3, display: 'grid', placeItems: 'center' }}><span style={tag(14)}>Reconcile</span></Show>
      {/* press 1: the selector */}
      <Show on={s(1)} style={{ ...box(B.RX - 46, B.LB + 34, 92, 22), zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <Ico3D name="tag" size={20} loop="tilt" />
        <span style={mono(12, hot === 0 ? colors.brandDark : colors.ink)}>app: web</span>
      </Show>

      {/* the pods */}
      {B_PY.slice(0, 3).map((y, i) => (
        <div key={y}>
          <Slot x={B.PX} y={y} size={B.PS} on={i === 2 && missing} />
          <PodRow y={y} on={!(i === 2 && missing)} labels={s(1)} lit={hot === 0 || (hot === 2 && i === 2)} />
        </div>
      ))}
      <Disc x={B.PX + B.PS / 2 - 2} y={B_PY[2] - B.PS / 2 + 2} icon="plus" size={24} on={s(3)} loop="beat" />
      <PodRow y={B_PY[3]} on={s(4)} labels lit={hot === 3} dim />
      <Disc x={B.PX + B.PS / 2 - 2} y={B_PY[3] - B.PS / 2 + 2} icon="minus" size={24} on={s(4)} loop="beat" />

      {/* press 2: what is declared against what is running */}
      <Show on={s(2)} style={{ ...box(B.DX - 70, 236, 140, 26), zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Ico3D name="target" size={22} loop="pulse" t={3} />
        <span style={tag(14)}>Desired</span>
        <span style={mono(18, hot === 1 ? colors.brandDark : colors.ink, 700)}>3</span>
      </Show>
      <Show on={s(2)} style={{ ...box(B.NX1 - 20 - 90, B.TY - 13, 90, 26), zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
        <span style={tag(14)}>Actual</span>
        <span style={mono(18, hot === 1 ? colors.brandDark : colors.ink, 700)}>{missing ? 2 : 3}</span>
      </Show>

      {/* press 5: never Deployment straight to pods */}
      <W pts={B_BLOCK} on={s(5)} head={0} dash="5 6" opacity={0.5} />
      <XAt x={300} y={B.BY} on={s(5)} />

      {/* flow */}
      <Token cls={B_RDR} size={8} />
      {B_RPOD.slice(0, 3).map((c, i) => (i === 2 && (missing || s(3)) ? null : <Token key={i} cls={c} size={8} />))}
      <Rider cls={B_RTPL} icon="doc" size={22} on={s(3)} />
      <Token cls={B_RLOOP} size={8} />
    </Frame>
  )
}

const D_T15: Fig = (p) => <ReconcilePicture {...p} steps={p.steps ?? 3} from={0} />
const D_T15B: Fig = (p) => <ReconcilePicture {...p} steps={p.steps ?? 2} from={3} />

/* ================================================================== slides 36-37 · D_T16 / D_T16B · self-healing traced */

/*
 * 546 x 320 (centred in the 546 x 380 box of slide 36). The header (y 20..64): the Deployment mark, `web-deployment`,
 * Desired 3 and its three pods. Under it the strip: four stops T0..T3 (column centres 83 / 209 / 335 / 461, 126 apart),
 * each a T tag (y 100), the stop tile (y 144) on a faint rail, its value (y 190) and the three pod slots as they stand
 * after it (y 234). The pod names run under the two halves (y 280): the deleted one under T0-T1, the new one under T2-T3. A stop not yet
 * reached is a dashed slot. Global presses: 1 Desired 3 and the three pods, 2 T0 (deleted at 42 seconds, by kubectl),
 * 3 T1 (the ReplicaSet sees 2) | 4 T2 (the scheduler, healthy node, within 5 seconds), 5 T3 (kubelet pulls, runs, 3).
 */
const C = { W: 546, H: 320, HY: 42, HS: 44, TY: 100, SY: 144, SS: 54, UY: 190, PY: 234, PS: 32, PG: 38, NY: 280, PER: 3.2 }
const C_X = [83, 209, 335, 461]
const C_WIRES: Pt[][] = [0, 1, 2].map((i) => [[C_X[i] + C.SS / 2, C.SY], [C_X[i + 1] - C.SS / 2, C.SY]])
const C_RIDE = C_WIRES.map((pts, i) => K.ride(`t16w${i}`, pts, 0.2 + i * 0.9, 0.9 + i * 0.9, C.PER))
const C_NAMES = ['web-deployment-7d9f8c7b67-x4k2p', 'web-deployment-7d9f8c7b67-q8z1n']

/** the three pod slots of one stop; `third` is what the third one is at that moment */
function PodTrio({ cx, on, third, lit, delay = 0 }: { cx: number; on: boolean; third: 'gone' | 'slot' | 'new' | 'run'; lit: boolean; delay?: number }) {
  const xs = [cx - C.PG, cx, cx + C.PG]
  return (
    <>
      {xs.map((x, i) => (
        i < 2 || third !== 'slot' ? (
          <Show key={x} on={on} delay={delay + i * 80} style={{ ...box(x - C.PS / 2, C.PY - C.PS / 2, C.PS, C.PS), zIndex: 3 }}>
            <div style={{ opacity: i === 2 && (third === 'gone' || third === 'new') ? 0.42 : 1, filter: i === 2 && third === 'gone' ? 'grayscale(1)' : undefined }}>
              <MarkTile src={podMark} size={C.PS} lit={lit && i === 2} />
            </div>
          </Show>
        ) : <Slot key={x} x={x} y={C.PY} size={C.PS} on={on} />
      ))}
    </>
  )
}

/** one stop of the strip: its T tag, its tile (or a dashed slot until reached), its value, its pods */
function Stop({ i, on, lit, tile, value, third, children }: { i: number; on: boolean; lit: boolean; tile: ReactNode; value: ReactNode; third: 'gone' | 'slot' | 'new' | 'run'; children?: ReactNode }) {
  const x = C_X[i]
  return (
    <>
      <span style={{ ...box(x - 30, C.TY - 10, 60, 20), ...mono(16, colors.ink, 600), textAlign: 'center', zIndex: 3 }}>{`T${i}`}</span>
      <Slot x={x} y={C.SY} size={C.SS} on={!on} />
      <Show on={on} style={{ ...box(x - C.SS / 2, C.SY - C.SS / 2, C.SS, C.SS), zIndex: 3 }}>
        <div style={{ position: 'relative', width: C.SS, height: C.SS }}>
          {tile}
          {children}
        </div>
      </Show>
      <Show on={on} delay={150} style={{ ...box(x - 62, C.UY - 11, 124, 22), zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>{value}</Show>
      <PodTrio cx={x} on={on} third={third} lit={lit} delay={250} />
    </>
  )
}

/** a corner disc inside a stop tile (placed in the tile's own box) */
const corner = (icon: string, on: boolean, loop: Loop = 'beat') => <Disc x={C.SS - 3} y={3} icon={icon} size={26} on={on} loop={loop} />

function HealPicture(p: Record<string, unknown>) {
  const { hot, s } = useBuild(p, 2000)
  const num = (v: number, hi: boolean) => <span style={mono(17, hi ? colors.brandDark : colors.ink, 700)}>{v}</span>
  return (
    <Frame w={C.W} h={C.H}>
      {/* web-deployment, desired three, its three pods */}
      <div style={{ ...box(20, C.HY - C.HS / 2, 300, C.HS), zIndex: 3, display: 'flex', alignItems: 'center', gap: 12 }}>
        <MarkTile src={deployMark} size={C.HS} lit={hot === 0} />
        <span style={mono(15)}>web-deployment</span>
      </div>
      <Show on={s(1)} style={{ ...box(222, C.HY - 13, 96, 26), zIndex: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={tag(14)}>Desired</span>
        {num(3, hot === 0 || hot === 2)}
      </Show>
      {[0, 1, 2].map((i) => (
        <Show key={i} on={s(1)} delay={120 + i * 100} style={{ ...box(330 + i * 44, C.HY - 17, 34, 34), zIndex: 3 }}>
          <MarkTile src={podMark} size={34} lit={hot === 0} />
        </Show>
      ))}

      {/* the strip */}
      <span aria-hidden style={{ ...box(C_X[0], C.SY - 1, C_X[3] - C_X[0], 2), background: '#DCE6FA', borderRadius: 2, zIndex: 1 }} />
      {C_WIRES.map((pts, i) => <W key={i} pts={pts} on={s(i + 3)} lit={hot === i + 2} head={8} />)}
      <Stop i={0} on={s(2)} lit={hot === 1} third="gone"
        tile={<Plinth size={C.SS} lit={hot === 1}><Ico3D name="trash" size={40} loop="tilt" /></Plinth>}
        value={<span style={tag(14)}>42 Seconds</span>}>
        {corner('terminal', s(2), 'bob')}
      </Stop>
      <Stop i={1} on={s(3)} lit={hot === 2} third="slot"
        tile={<MarkTile src={rsMark} size={C.SS} lit={hot === 2} />}
        value={<><span style={tag(14)}>Actual</span>{num(2, hot === 2)}</>} />
      <Stop i={2} on={s(4)} lit={hot === 3} third="new"
        tile={<MarkTile src={schedMark} size={C.SS} lit={hot === 3} />}
        value={<span style={tag(14)}>Within 5 Seconds</span>}>
        {corner('health', s(4), 'pulse')}
      </Stop>
      <Stop i={3} on={s(5)} lit={hot === 4} third="run"
        tile={<MarkTile src={kubeletMark} size={C.SS} lit={hot === 4} />}
        value={<><span style={tag(14)}>Actual</span>{num(3, hot === 4)}</>}>
        {corner('download', s(5), 'bob')}
      </Stop>
      {/* the deleted pod crossed, the new pod ticked */}
      <XAt x={C_X[0] + C.PG + C.PS / 2 - 2} y={C.PY - C.PS / 2 + 2} size={20} on={s(2)} />
      <Disc x={C_X[3] + C.PG + C.PS / 2 - 2} y={C.PY - C.PS / 2 + 2} icon="check" size={22} on={s(5)} />

      {/* the pod names, one under each half */}
      <Show on={s(2)} delay={300} style={{ ...box(20, C.NY - 10, 252, 20), zIndex: 3, display: 'grid', placeItems: 'center' }}>
        <span style={mono(12, hot === 1 ? colors.brandDark : colors.ink)}>{C_NAMES[0]}</span>
      </Show>
      <Show on={s(5)} delay={300} style={{ ...box(274, C.NY - 10, 252, 20), zIndex: 3, display: 'grid', placeItems: 'center' }}>
        <span style={mono(12, hot === 4 ? colors.brandDark : colors.ink)}>{C_NAMES[1]}</span>
      </Show>

      {C_RIDE.map((c, i) => <Token key={i} cls={c} on={s(i + 3)} size={8} />)}
    </Frame>
  )
}

const D_T16: Fig = (p) => <HealPicture {...p} steps={p.steps ?? 3} from={0} />
const D_T16B: Fig = (p) => <HealPicture {...p} steps={p.steps ?? 2} from={3} />

/* ================================================================== slide 38 · D_T17 · the EKS Workloads tab */

/*
 * 586 x 360. A drawn Amazon EKS console card (x 20..566, y 20..214): the title bar (EKS mark, `Amazon EKS`), the tabs
 * (Workloads active), a table with Name / Type / Desired / Current and one row, web-deployment. Under it the terminal
 * (x 20..566, y 250..340) with `kubectl scale deployment web-deployment --replicas=5`, wired up into the console card.
 * Press 1: the terminal and its command ride up; Desired reads 5 at once, Current climbs 3, 4, 5. Press 2: the two
 * columns ringed.
 */
const E = { W: 586, H: 360, X0: 20, X1: 566, Y0: 20, Y1: 214, TY0: 250, TY1: 340, HY0: 120, HY1: 148, RY0: 152, RY1: 192, CD: 366, CC: 456, CW: 80, PER: 2.8 }
const E_WIRE: Pt[] = [[(E.X0 + E.X1) / 2, E.TY0], [(E.X0 + E.X1) / 2, E.Y1]]
const E_RIDE = K.ride('t17c', E_WIRE, 0.2, 1.0, E.PER)

function ConsoleFig(p: Record<string, unknown>) {
  const { hot, s, held, step } = useBuild(p, 2200)
  const instant = useInstant()
  const [cur, setCur] = useState(3)
  useEffect(() => {
    if (held || instant || step < 1) { setCur(step >= 1 ? 5 : 3); return }
    setCur(3)
    const a = window.setTimeout(() => setCur(4), 900)
    const b = window.setTimeout(() => setCur(5), 1700)
    return () => { window.clearTimeout(a); window.clearTimeout(b) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step >= 1, held])
  const desired = s(1) ? 5 : 3
  const cell = (v: number, k: string, hi: boolean) => (
    <span key={k} className={held || instant ? undefined : 's20d-pop'} style={mono(18, hi ? colors.brandDark : colors.ink, 700)}>{v}</span>
  )
  const ring = (x: number, on: boolean) => (
    <span aria-hidden style={{ ...box(x, E.HY0 - 6, E.CW, E.RY1 - E.HY0 + 12), zIndex: 4, borderRadius: 10, boxShadow: `inset 0 0 0 2.5px ${ORANGE}`, opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE}` }} />
  )
  const head = (x: number, w: number, text: string) => <span style={{ ...box(x, E.HY0, w, E.HY1 - E.HY0), ...tag(13, colors.muted), display: 'flex', alignItems: 'center', zIndex: 3 }}>{text}</span>
  return (
    <Frame w={E.W} h={E.H}>
      <Panel x={E.X0} y={E.Y0} w={E.X1 - E.X0} h={E.Y1 - E.Y0} radius={16} lit={false} />
      {/* title bar */}
      <div style={{ ...box(E.X0 + 20, E.Y0 + 14, 300, 34), zIndex: 3, display: 'flex', alignItems: 'center', gap: 10 }}>
        <MarkTile src={eksMark} size={34} />
        <span style={heading(16)}>Amazon EKS</span>
      </div>
      <span style={{ ...box(E.X1 - 20 - 26, E.Y0 + 18, 26, 26), zIndex: 3, display: 'grid', placeItems: 'center' }}><Ico3D name="refresh" size={22} loop="spin" t={6} /></span>
      <span aria-hidden style={{ ...box(E.X0 + 20, E.Y0 + 58, E.X1 - E.X0 - 40, 1), background: '#DCE6FA', zIndex: 3 }} />
      {/* tabs */}
      <div style={{ ...box(E.X0 + 20, E.Y0 + 66, 400, 28), zIndex: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ ...tag(14, colors.muted), padding: '5px 10px' }}>Overview</span>
        <span style={{ ...tag(14, colors.brandDark), padding: '5px 12px', borderRadius: 8, background: '#E6EEFF', boxShadow: 'inset 0 0 0 1px #C8D8FA' }}>Workloads</span>
        <span style={{ ...tag(14, colors.muted), padding: '5px 10px' }}>Compute</span>
      </div>
      {/* the table */}
      <span aria-hidden style={{ ...box(E.X0 + 20, E.HY0, E.X1 - E.X0 - 40, E.HY1 - E.HY0), borderRadius: 8, background: '#F2F6FF', boxShadow: 'inset 0 0 0 1px #DCE6FA', zIndex: 3 }} />
      {head(52, 150, 'Name')}
      {head(250, 100, 'Type')}
      {head(E.CD + 14, 60, 'Desired')}
      {head(E.CC + 14, 60, 'Current')}
      <div style={{ ...box(52, E.RY0, 190, E.RY1 - E.RY0), zIndex: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
        <MarkTile src={deployMark} size={26} scale={0.78} />
        <span style={mono(13)}>web-deployment</span>
      </div>
      <span style={{ ...box(250, E.RY0, 100, E.RY1 - E.RY0), ...tag(14), display: 'flex', alignItems: 'center', zIndex: 3 }}>Deployment</span>
      <span style={{ ...box(E.CD + 14, E.RY0, 60, E.RY1 - E.RY0), display: 'flex', alignItems: 'center', zIndex: 3 }}>{cell(desired, `d${desired}`, hot === 1)}</span>
      <span style={{ ...box(E.CC + 14, E.RY0, 60, E.RY1 - E.RY0), display: 'flex', alignItems: 'center', zIndex: 3 }}>{cell(cur, `c${cur}`, hot === 1)}</span>
      {ring(E.CD, hot === 1)}
      {ring(E.CC, hot === 1)}

      {/* the scale command */}
      <Term x={E.X0} y={E.TY0} w={E.X1 - E.X0} h={E.TY1 - E.TY0} lines={['kubectl scale deployment web-deployment --replicas=5']} on={s(1)} lit={hot === 0} />
      <W pts={E_WIRE} on={s(1)} lit={hot === 0} head={9} delay={200} />
      <Token cls={E_RIDE} on={s(1)} size={9} />
    </Frame>
  )
}

const D_T17: Fig = (p) => <ConsoleFig {...p} steps={p.steps ?? 2} />

/* ================================================================== slide 39 · D_T17B · the rolling update */

/*
 * 566 x 320. The Deployment (mark, 64, 160) wired through a junction (118, 160) into two ReplicaSet rows (x 140..546):
 * Old (y 20..146, image `web:v1`) and New (y 174..300, image `web:v2`). In each row: the mark and name, the image at the
 * right, five pod slots (x 177 + 46 i) and the replica count. Press 1: the new image applied (the turning disc on the
 * Deployment), the New row appears and the swap runs: column by column a new pod comes up, then the old one goes
 * (7.2 s, the two rows cross back in the last 0.3 s). Press 2: minus on Old, plus on New. Held: Old 0, New 5.
 */
const F = { W: 566, H: 320, DX: 64, DY: 160, DS: 48, JX: 118, RX0: 140, RX1: 546, RH: 126, PS: 34, PER: 7.2 }
const F_RY = [20, 174]
const F_CY = F_RY.map((y) => y + F.RH / 2) // 83, 237
const F_PX = [0, 1, 2, 3, 4].map((i) => 177 + i * 46)
const F_TRUNK: Pt[] = [[F.DX + F.DS / 2, F.DY], [F.JX, F.DY]]
const F_BR = F_CY.map((y): Pt[] => [[F.JX, F.DY], [F.JX, y], [F.RX0, y]])
const F_RIDE = F_BR.map((pts, i) => K.ride(`t17r${i}`, [F_TRUNK[0], ...pts], 0.3 + i * 0.5, 1.2 + i * 0.5, 3.0))
const tNew = (k: number) => 0.6 + k * 1.2
const tOld = (k: number) => tNew(k) + 0.5
const FADE = 0.3
const RESET = F.PER - 0.3
const pc = (t: number) => `${((t / F.PER) * 100).toFixed(2)}%`
/* the swap: new pod k comes up at tNew(k), old pod k goes at tOld(k); in the last 0.4 s both rows cross back */
const ROLL_CSS = [0, 1, 2, 3, 4].map((k) => `
@keyframes s20d-n${k} { 0%, ${pc(tNew(k))} { opacity: 0; transform: scale(0.6) } ${pc(tNew(k) + FADE)}, ${pc(RESET)} { opacity: 1; transform: scale(1) } 100% { opacity: 0; transform: scale(0.6) } }
.s20d-n${k} { animation: s20d-n${k} ${F.PER}s ease-in-out infinite; }
@keyframes s20d-o${k} { 0%, ${pc(tOld(k))} { opacity: 1; transform: scale(1) } ${pc(tOld(k) + FADE)}, ${pc(RESET)} { opacity: 0; transform: scale(0.6) } 100% { opacity: 1; transform: scale(1) } }
.s20d-o${k} { animation: s20d-o${k} ${F.PER}s ease-in-out infinite; }`).join('\n')
/* the counts: Old shows v while 5 - v old pods have gone; New shows v while v new pods are up */
const countKf = (name: string, old: boolean) => {
  /* visible window [a, b) for one value; wrap = also visible over the reset */
  const show = (a: number, b: number, wrap: boolean) => {
    const e = 0.08
    const L: string[] = []
    if (wrap) L.push(`0%, ${pc(Math.max(0, b - e))} { opacity: 1 }`, `${pc(b)} { opacity: 0 }`, `${pc(RESET)} { opacity: 0 }`, `${pc(RESET + 0.15)}, 100% { opacity: 1 }`)
    else if (b >= F.PER) L.push(`0%, ${pc(Math.max(0, a - e))} { opacity: 0 }`, `${pc(a)}, ${pc(RESET)} { opacity: 1 }`, `${pc(RESET + 0.15)}, 100% { opacity: 0 }`)
    else L.push(`0%, ${pc(Math.max(0, a - e))} { opacity: 0 }`, `${pc(a)}, ${pc(b - e)} { opacity: 1 }`, `${pc(b)}, 100% { opacity: 0 }`)
    return L.join(' ')
  }
  const out: string[] = []
  for (let v = 0; v <= 5; v++) {
    /* the time this value starts and ends */
    const idxStart = old ? 5 - v - 1 : v - 1 // the event that brings this value in (-1 = the start)
    const idxEnd = old ? 5 - v : v
    const at = (k: number) => (old ? tOld(k) : tNew(k)) + FADE / 2
    const a = idxStart < 0 ? 0 : at(idxStart)
    const b = idxEnd > 4 ? F.PER : at(idxEnd)
    out.push(`@keyframes ${name}${v} { ${show(a, b, idxStart < 0)} }\n.${name}${v} { animation: ${name}${v} ${F.PER}s linear infinite; }`)
  }
  return out.join('\n')
}

function RsRow({ i, on, lit, image, title, live, held }: { i: number; on: boolean; lit: boolean; image: string; title: string; live: boolean; held: boolean }) {
  const old = i === 0
  const y0 = F_RY[i]
  const py = y0 + 88
  /* static state when not rolling: old row full before press 1, empty when held; new row full */
  const podOn = old ? !held : true
  const count = old ? (held ? 0 : 5) : 5
  return (
    <>
      <Panel x={F.RX0} y={y0} w={F.RX1 - F.RX0} h={F.RH} on={on} lit={lit} />
      <Show on={on} style={{ ...box(F.RX0 + 20, y0 + 20, 260, 36), zIndex: 3, display: 'flex', alignItems: 'center', gap: 10 }}>
        <MarkTile src={rsMark} size={36} lit={lit} />
        <span style={heading(15)}>{title}</span>
      </Show>
      <Show on={on} style={{ ...box(F.RX1 - 20 - 100, y0 + 20, 100, 36), zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
        <Ico3D name="package" size={22} loop="bob" d={i * 0.6} />
        <span style={tag(13, lit ? colors.brandDark : colors.ink)}>{image}</span>
      </Show>
      {F_PX.map((x, k) => (
        <div key={x}>
          <Slot x={x} y={py} size={F.PS} on={on} />
          <Show on={on} delay={k * 60} style={{ ...box(x - F.PS / 2, py - F.PS / 2, F.PS, F.PS), zIndex: 3 }}>
            <div className={live ? `s20d-${old ? 'o' : 'n'}${k}` : undefined} style={{ opacity: live ? undefined : podOn ? 1 : 0 }}>
              <MarkTile src={podMark} size={F.PS} />
            </div>
          </Show>
        </div>
      ))}
      <Show on={on} style={{ ...box(F.RX1 - 20 - 110, py - 14, 110, 28), zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
        <span style={tag(14)}>Replicas</span>
        <span style={{ position: 'relative', display: 'inline-block', width: 14, height: 22 }}>
          {live ? [0, 1, 2, 3, 4, 5].map((v) => (
            <span key={v} className={`s20d-${old ? 'co' : 'cn'}${v}`} style={{ position: 'absolute', inset: 0, ...mono(18, lit ? colors.brandDark : colors.ink, 700), opacity: 0 }}>{v}</span>
          )) : <span style={{ position: 'absolute', inset: 0, ...mono(18, colors.ink, 700) }}>{count}</span>}
        </span>
      </Show>
    </>
  )
}

function RollFig(p: Record<string, unknown>) {
  const { hot, s, held } = useBuild(p, 2400)
  const rolling = s(1) && !held
  return (
    <Frame w={F.W} h={F.H}>
      <Node x={F.DX} y={F.DY} mark={deployMark} size={F.DS} label="Deployment" w={100} lit={hot === 0}>
        <Disc x={F.DS - 3} y={3} icon="refresh" size={24} on={s(1)} loop="spin" t={3} />
      </Node>
      <W pts={F_TRUNK} lit={hot === 0} head={0} />
      <W pts={F_BR[0]} lit={hot === 0 || hot === 1} head={8} />
      <W pts={F_BR[1]} on={s(1)} lit={hot === 0 || hot === 1} head={8} />
      <Junction x={F.JX} y={F.DY} lit={hot === 0 || hot === 1} />
      <RsRow i={0} on lit={hot === 1} image="Old Image" title="Old ReplicaSet" live={rolling} held={held} />
      <RsRow i={1} on={s(1)} lit={hot === 1} image="New Image" title="New ReplicaSet" live={rolling} held={held} />
      {/* press 2: one scales down as the other scales up */}
      <Disc x={F_PX[4] + 52} y={F_RY[0] + 88} icon="minus" size={26} on={s(2)} loop="beat" />
      <Disc x={F_PX[4] + 52} y={F_RY[1] + 88} icon="plus" size={26} on={s(2)} loop="beat" />
      <Token cls={F_RIDE[0]} size={8} />
      <Token cls={F_RIDE[1]} on={s(1)} size={8} />
    </Frame>
  )
}

const D_T17B: Fig = (p) => <RollFig {...p} steps={p.steps ?? 2} />

export const figures: Record<string, Fig> = { D_T14, D_T14B, D_T15, D_T15B, D_T16, D_T16B, D_T17, D_T17B }
export const css = `
${K.css()}
${ROLL_CSS}
${countKf('s20d-co', true)}
${countKf('s20d-cn', false)}
@keyframes s20d-pop { 0% { opacity: 0; transform: translateY(6px) scale(0.85) } 100% { opacity: 1; transform: none } }
.s20d-pop { display: inline-block; animation: s20d-pop 520ms cubic-bezier(0.22,1,0.36,1) both; }
.cc-still [class*="s20d-"], .deck-thumb [class*="s20d-"] { animation: none !important; }
@media (prefers-reduced-motion: reduce) { [class*="s20d-"] { animation: none !important; } }
`
