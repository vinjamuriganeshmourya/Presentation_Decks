import type { CSSProperties, ReactNode } from 'react'
import { colors, fonts } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, Frame, Show, Plinth, MarkTile, Panel, Wire, Junction, Token, keyframes, tag, heading, useHeld, useHot, type Pt } from '@/engine/figkit'
import schedMark from '../images/k8s-sched.svg'
import podMark from '../images/k8s-pod.svg'
import nodeMark from '../images/k8s-node.svg'
import ingMark from '../images/k8s-ing.svg'
import nsMark from '../images/k8s-ns.svg'
import quotaMark from '../images/k8s-quota.svg'
import k8sMark from '../images/tech-kubernetes.svg'
import usersMark from '../images/res-users.svg'

/*
 * SESSION 21 · SECTION 2 (compute) technical figures, builder C. Class prefix `s21c-`.
 * Built to generate-slides standing correction 17: official Kubernetes marks on white tiles, glossy 3D icons on plinths,
 * >= 20 px equal padding, orthogonal wires from the box constants, a flow dot on every live wire, the lit item walking
 * last -> first -> ... after the build. Loops are transform / opacity on HTML elements only. Held (?still): the full
 * final state, nothing lit, nothing moving.
 *
 *   slide 25 C_T10   566 x 360  the Scheduler with a new Pod; two Node panels, each a capacity bar with pods stacked
 *                               (Request dark, Limit light); press 1 the full node refused (orange cross), the pod placed
 *                               in the free slot; press 2 a pod's CPU pinned at its ceiling, squeezed: Throttled (2)
 *   slide 26 C_T10B  546 x 380  the same bars for CPU and Memory; press 1 memory crosses its limit: OOMKilled (orange
 *                               cross), restarted; press 2 the units `500m` and `256Mi` tag the requests (2)
 *   slide 29 C_T11B 1080 x 360  Users -> the cluster door -> Ingress; namespaces `dev` `staging` `prod` inside; a
 *                               ResourceQuota gauge on each; presses light reach, share, use (3)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('s21c')
const BLUE = colors.brand
const MONO = fonts.mono

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)
const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })
const code = (size = 14, color: string = colors.brandDeep): CSSProperties => ({ fontFamily: MONO, fontWeight: 500, fontSize: size, lineHeight: 1.15, color, whiteSpace: 'nowrap' })

/** the build of a figure: the step, the lit item (walk starts on the LAST item so the final press lights what it built), held */
function useBuild(p: Record<string, unknown>, period: number) {
  const cnt = Number(p.steps ?? 1)
  const held = useHeld()
  const step = held ? cnt : stepOf(p)
  const raw = useHot(cnt, stepOf(p), period)
  const hot = raw >= 0 && stepOf(p) >= cnt ? (raw + cnt - 1) % cnt : raw
  return { step, hot, held, s: (n: number) => step >= n }
}

/** a 3D icon (or an official mark) on its tile with its tag under (or above) it; the TILE is centred on (x, y) */
function Node({ x, y, label, icon, mark, size = 52, k = 0.74, on = true, lit = false, loop = 'bob', d = 0, t, w = 120, tagSize = 14, up = false, delay = 0, z = 3, children }: { x: number; y: number; label?: string; icon?: Ico3DName; mark?: string; size?: number; k?: number; on?: boolean; lit?: boolean; loop?: Loop; d?: number; t?: number; w?: number; tagSize?: number; up?: boolean; delay?: number; z?: number; children?: ReactNode }) {
  const tile = mark ? <MarkTile src={mark} size={size} lit={lit} /> : (
    <Plinth size={size} lit={lit}>
      <Ico3D name={icon ?? 'doc'} size={Math.round(size * k)} loop={loop} d={d} t={t} />
    </Plinth>
  )
  const lab = label ? <span style={{ ...tag(tagSize), [up ? 'marginBottom' : 'marginTop']: 6 }}>{label}</span> : null
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, width: w, zIndex: z, display: 'flex', flexDirection: up ? 'column-reverse' : 'column', alignItems: 'center', ...(up ? { bottom: `calc(100% - ${y + size / 2}px)` } : { top: y - size / 2 }) }}>
      <div style={{ position: 'relative', width: size, height: size, display: 'grid', placeItems: 'center' }}>
        {tile}
        {children}
      </div>
      {lab}
    </Show>
  )
}

/** the engine's 3D cross turned to the template's orange (failure = orange, never red) */
const OrangeCross = ({ size }: { size: number }) => (
  <span style={{ display: 'grid', filter: 'hue-rotate(28deg) saturate(1.15) brightness(1.06)' }}>
    <Ico3D name="cross" size={size} loop="none" />
  </span>
)

/** a small white disc holding a 3D icon, centred on (x, y); `cls` adds a loop on an inner wrapper */
function Disc({ x, y, on = true, size = 26, icon, loop = 'pulse', d = 0, t = 2.4, warn = false, cls }: { x: number; y: number; on?: boolean; size?: number; icon: Ico3DName; loop?: Loop; d?: number; t?: number; warn?: boolean; cls?: string }) {
  const instant = useInstant()
  const held = useHeld()
  return (
    <span style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: 6, opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}` }}>
      <span className={held ? undefined : cls} style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6' }}>
        {warn ? <OrangeCross size={size - 6} /> : <Ico3D name={icon} size={size - 6} loop={cls ? 'none' : loop} d={d} t={t} />}
      </span>
    </span>
  )
}

/** a white disc carrying a mini official mark along a `ride` class; nothing on held frames */
function RiderMark({ cls, src, size = 26, on = true }: { cls: string; src: string; size?: number; on?: boolean }) {
  const held = useHeld()
  if (held || !on) return null
  return (
    <span aria-hidden style={{ position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, zIndex: 7, pointerEvents: 'none' }}>
      <span className={cls} style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -4px rgba(31,64,140,0.55), inset 0 0 0 1px #D3DEF6', opacity: 0 }}>
        <img src={src} alt="" draggable={false} style={{ width: size - 8, height: size - 8, objectFit: 'contain', display: 'block' }} />
      </span>
    </span>
  )
}

/** a wire on its own layer above the cards (a Panel is z 2); tiles (z 3) stay on top */
const W = (props: Parameters<typeof Wire>[0]) => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}><Wire {...props} /></div>
)

/* ------------------------------------------------------------------ the capacity bar and its pods */

const DARK = 'linear-gradient(180deg, #5C88FF 0%, #2D63FB 48%, #1E4FE0 100%)'
const LIGHT = 'linear-gradient(180deg, #EEF3FF 0%, #D2DFFF 100%)'

/** the node-capacity track (a rounded trough), frame coords */
const Track = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) => (
  <div style={{ ...box(x, y, w, h), zIndex: 3, borderRadius: 12, background: 'linear-gradient(180deg, #E9EFFC 0%, #F6F9FF 100%)', boxShadow: 'inset 0 0 0 1.5px #D3DEF6, inset 0 3px 6px -3px rgba(31,64,140,0.25)' }} />
)

type Use = 'a' | 'b' | 'thr' | 'oom'
const USE_HELD: Record<Use, number> = { a: 0.62, b: 0.7, thr: 1, oom: 1.16 }

/** one pod on a bar: the request part dark (guaranteed), the limit part light (ceiling), the usage strip along its foot */
function Pod({ x, y, r, l, h, on = true, delay = 0, use = 'a', d = 0, kill = false }: { x: number; y: number; r: number; l: number; h: number; on?: boolean; delay?: number; use?: Use; d?: number; kill?: boolean }) {
  const held = useHeld()
  const tx: CSSProperties = { ...tag(13), position: 'absolute', top: 0, bottom: 10, display: 'grid', placeItems: 'center' }
  const words = r >= 70 // a narrow pod (Node 2 on slide 25) shows the colours only; Node 1 above it names them
  return (
    <Show on={on} delay={delay} lift={0} style={{ ...box(x, y, r + l, h), zIndex: 4 }}>
      <div className={!held && kill ? 's21c-kill' : undefined} style={{ position: 'absolute', inset: 0 }}>
        <div style={{ ...box(0, 0, r, h), borderRadius: '9px 2px 2px 9px', background: DARK, boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.35)' }}>
          {words && <span style={{ ...tx, left: 0, right: 0, color: '#FFFFFF' }}>Request</span>}
        </div>
        <div style={{ ...box(r, 0, l, h), borderRadius: '2px 9px 9px 2px', background: LIGHT, boxShadow: 'inset 0 0 0 1.5px #B9CCF6' }}>
          {words && <span style={{ ...tx, left: 0, right: 0 }}>Limit</span>}
        </div>
      </div>
      <span
        aria-hidden
        className={held ? undefined : `s21c-u s21c-${use}`}
        style={{ ...box(3, h - 9, r + l - 6, 5), zIndex: 1, borderRadius: 3, background: '#0B2A6B', boxShadow: '0 0 0 1.5px rgba(255,255,255,0.85)', transformOrigin: 'left center', ['--d' as string]: `${-d}s`, transform: held ? `scaleX(${USE_HELD[use]})` : undefined } as CSSProperties}
      />
    </Show>
  )
}

/* ================================================================== slide 25 · C_T10 · requests, limits, scheduling, CPU throttle */

/*
 * 566 x 360. Left column (x 56): the new Pod (y 86, tag above) handed down to the Scheduler (y 186). A junction (104, 186)
 * fans to two Node panels (x 146..546, h 150; y 20 and 190). In each: the Node mark (186, bar centre) and a capacity bar
 * (x 226..526, top = panel + 58, h 46), pod marks above their pods. Node 1 is full (two wide pods), Node 2 has two pods
 * and a free slot. Press 1: the path to Node 1 is dashed and faded with an orange cross before it; the pod rides to Node 2
 * and fills the free slot. Press 2: Node 1's first pod pins its CPU at the ceiling and is squeezed: Throttled, still
 * running (heartbeat). Loop: every pod's usage rises and falls under its ceiling.
 */
const A = { W: 566, H: 360, SX: 56, SY: 186, SS: 52, PY: 86, PS: 40, JX: 104, PX0: 146, PX1: 546, PH: 150, BX: 226, BX1: 526, BH: 46, MS: 30, PER: 3.2 }
const A_PY = [20, 190]
const A_BY = A_PY.map((y) => y + 58) // 78, 248
const A_CY = A_BY.map((y) => y + A.BH / 2) // 101, 271
const A_MY = A_PY.map((y) => y + 35) // pod-mark centres 55, 225
const A_IN = A.BX + 4 // 230
const A_N1 = [{ x: A_IN, r: 88, l: 56 }, { x: A_IN + 148, r: 88, l: 56 }] // 230..374, 378..522
const A_N2 = [0, 1, 2].map((i) => ({ x: A_IN + i * 99, r: 58, l: 36 })) // 230..324, 329..423, 428..522
const A_FEED: Pt[] = [[A.SX, A.PY + A.PS / 2], [A.SX, A.SY - A.SS / 2]]
const A_TO2: Pt[] = [[A.SX + A.SS / 2, A.SY], [A.JX, A.SY], [A.JX, A_CY[1]], [A.PX0, A_CY[1]]]
const A_TO1: Pt[] = [[A.JX, A.SY], [A.JX, A_CY[0]], [A.PX0, A_CY[0]]]
const A_XX = 126 // the orange cross, before Node 1's panel edge (146)
const A_RF = K.ride('t10f', A_FEED, 0.0, 0.6, A.PER)
const A_RX = K.ride('t10x', [...A_TO1.slice(0, -1), [A_XX - 12, A_CY[0]]], 0.75, 1.45, A.PER, 0.4)
const A_RP = K.ride('t10p', A_TO2, 1.6, 2.8, A.PER)

const C_T10: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 2 }, 2200)
  const thr = s(2)
  return (
    <Frame w={A.W} h={A.H}>
      {/* the new pod and the scheduler */}
      <Node x={A.SX} y={A.PY} mark={podMark} size={A.PS} label="Pod" up w={80} />
      <W pts={A_FEED} head={8} />
      <Token cls={A_RF} size={8} />
      <Node x={A.SX} y={A.SY} mark={schedMark} size={A.SS} label="Scheduler" w={110} lit={hot === 0} />

      {/* the two nodes */}
      {A_PY.map((y, n) => (
        <div key={y}>
          <Panel x={A.PX0} y={y} w={A.PX1 - A.PX0} h={A.PH} lit={(n === 1 && hot === 0) || (n === 0 && hot === 1)} />
          <Node x={186} y={A_CY[n]} mark={nodeMark} size={40} label="Node" w={80} />
          <Track x={A.BX} y={A_BY[n]} w={A.BX1 - A.BX} h={A.BH} />
        </div>
      ))}

      {/* node 1: full, two pods; the first one throttled at press 2 */}
      {A_N1.map((q, i) => (
        <div key={q.x}>
          <Pod x={q.x} y={A_BY[0] + 4} r={q.r} l={q.l} h={A.BH - 8} use={i === 0 && thr ? 'thr' : 'a'} d={i * 1.1} />
          <Node x={q.x + (q.r + q.l) / 2} y={A_MY[0]} mark={podMark} size={A.MS} />
        </div>
      ))}
      <Disc x={A_N1[0].x + A_N1[0].r + A_N1[0].l} y={A_BY[0]} icon="cpu" size={26} on={thr} loop="pulse" />
      <Disc x={A_N1[0].x + (A_N1[0].r + A_N1[0].l) / 2 + 13} y={A_MY[0] - 13} icon="heartbeat" size={20} on={thr} loop="beat" />
      <Show on={thr} style={{ ...box(A_N1[0].x, A_BY[0] + A.BH + 8, A_N1[0].r + A_N1[0].l, 18), zIndex: 3, display: 'grid', placeItems: 'center' }}>
        <span style={tag(14)}>Throttled</span>
      </Show>

      {/* node 2: two pods and a free slot; the new pod lands there at press 1 */}
      {A_N2.map((q, i) => (
        <div key={q.x}>
          <Pod x={q.x} y={A_BY[1] + 4} r={q.r} l={q.l} h={A.BH - 8} use={i === 1 ? 'b' : 'a'} d={i * 0.8 + 0.4} on={i < 2 || s(1)} delay={i === 2 ? 900 : 0} />
          <Node x={q.x + (q.r + q.l) / 2} y={A_MY[1]} mark={podMark} size={A.MS} on={i < 2 || s(1)} delay={i === 2 ? 900 : 0} />
        </div>
      ))}
      <Show on={!s(1)} style={{ ...box(A_N2[2].x, A_BY[1] + 4, A_N2[2].r + A_N2[2].l, A.BH - 8), zIndex: 4, borderRadius: 9, border: '1.5px dashed #9DB6EE', display: 'grid', placeItems: 'center' }}>
        <span style={tag(13, colors.muted)}>Free</span>
      </Show>

      {/* press 1: the scheduler's two paths */}
      <W pts={A_TO1} on={s(1)} color={ORANGE} head={0} width={2.2} dash="6 6" opacity={0.5} />
      <Disc x={A_XX} y={A_CY[0]} icon="cross" warn size={24} on={s(1)} />
      <W pts={A_TO2} on={s(1)} lit={hot === 0} head={9} />
      <Junction x={A.JX} y={A.SY} on={s(1)} lit={hot === 0} />
      <Token cls={A_RX} on={s(1)} size={8} tone={ORANGE} />
      <RiderMark cls={A_RP} src={podMark} size={24} on={s(1)} />
    </Frame>
  )
}

/* ================================================================== slide 26 · C_T10B · memory OOMKilled, units */

/*
 * 546 x 380. Two panels (x 20..526, h 160; y 20 CPU and y 200 Memory). In each: the resource icon on its plinth (62,
 * bar centre) tagged CPU / Memory, a capacity bar (x 104..506, top = panel + 60, h 44) with two pods (Request dark,
 * Limit light) and free room after them, the pod marks above. Press 1: Memory's second pod runs past its limit: the pod
 * blinks out, an orange cross in the free room, `OOMKilled` under it, the refresh disc turns as it restarts. Press 2: a
 * bracket under each first pod's request, the gauge and the unit: `500m` (CPU), `256Mi` (Memory).
 */
const B = { W: 546, H: 380, X0: 20, X1: 526, PH: 160, IX: 62, IS: 44, BX: 104, BX1: 506, BH: 44, MS: 30 }
const B_PY = [20, 200]
const B_BY = B_PY.map((y) => y + 60) // 80, 260
const B_CY = B_BY.map((y) => y + B.BH / 2) // 102, 282
const B_MY = B_PY.map((y) => y + 35) // 55, 235
const B_PODS = [{ x: 108, r: 92, l: 60 }, { x: 264, r: 92, l: 60 }] // 108..260, 264..416, free 416..502
const B_RES: { icon: Ico3DName; name: string; unit: string }[] = [
  { icon: 'cpu', name: 'CPU', unit: '500m' },
  { icon: 'chip', name: 'Memory', unit: '256Mi' },
]

const C_T10B: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 2 }, 2400)
  const instant = useInstant()
  const end2 = B_PODS[1].x + B_PODS[1].r + B_PODS[1].l // 416
  return (
    <Frame w={B.W} h={B.H}>
      {B_RES.map((res, n) => (
        <div key={res.name}>
          <Panel x={B.X0} y={B_PY[n]} w={B.X1 - B.X0} h={B.PH} lit={n === 1 && hot === 0} />
          <Node x={B.IX} y={B_CY[n]} icon={res.icon} size={B.IS} label={res.name} w={90} lit={hot === 1} loop="pulse" t={3} d={n * 0.6} />
          <Track x={B.BX} y={B_BY[n]} w={B.BX1 - B.BX} h={B.BH} />
          {B_PODS.map((q, i) => {
            const oom = n === 1 && i === 1 && s(1)
            return (
              <div key={q.x}>
                <Pod x={q.x} y={B_BY[n] + 4} r={q.r} l={q.l} h={B.BH - 8} use={oom ? 'oom' : i === 0 ? 'a' : 'b'} d={n * 0.9 + i * 1.3} kill={oom} />
                <Node x={q.x + (q.r + q.l) / 2} y={B_MY[n]} mark={podMark} size={B.MS} />
              </div>
            )
          })}

          {/* press 2: the unit on the first pod's request */}
          <Show on={s(2)} style={{ ...box(B_PODS[0].x, B_BY[n] + B.BH + 6, B_PODS[0].r, 36), zIndex: 3 }}>
            <div style={{ ...box(2, 0, B_PODS[0].r - 4, 6), borderLeft: `2px solid ${hot === 1 ? ORANGE : BLUE}`, borderRight: `2px solid ${hot === 1 ? ORANGE : BLUE}`, borderBottom: `2px solid ${hot === 1 ? ORANGE : BLUE}`, borderRadius: '0 0 4px 4px', transition: instant ? 'none' : `border-color 420ms ${EASE}` }} />
            <div style={{ ...box(0, 12, B_PODS[0].r, 22), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span style={{ display: 'grid', placeItems: 'center', width: 22, height: 22, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6' }}>
                <Ico3D name="gauge" size={16} loop="pulse" d={n * 0.5} t={2.6} />
              </span>
              <span style={code(15, colors.brandDeep)}>{res.unit}</span>
            </div>
          </Show>
        </div>
      ))}

      {/* press 1: memory past its limit, OOMKilled, restarted */}
      <Disc x={end2 + 42} y={B_CY[1]} icon="cross" warn size={30} on={s(1)} cls="s21c-pop" />
      <Disc x={B_PODS[1].x + (B_PODS[1].r + B_PODS[1].l) / 2 + 15} y={B_MY[1] - 13} icon="refresh" size={22} on={s(1)} cls="s21c-turn" />
      <Show on={s(1)} style={{ ...box(B_PODS[1].x, B_BY[1] + B.BH + 18, B_PODS[1].r + B_PODS[1].l, 22), zIndex: 3, display: 'grid', placeItems: 'center' }}>
        <span style={code(15, colors.brandDeep)}>OOMKilled</span>
      </Show>
    </Frame>
  )
}

/* ================================================================== slide 29 · C_T11B · reach, share, use */

/*
 * 1080 x 360. Users (86, 180) -> the cluster's door (a door disc on its left edge, x 230) -> Ingress (330, 180). The
 * cluster panel (x 230..1060, y 20..340) carries its title (Kubernetes mark + Cluster) and three namespace rows (x
 * 440..1040, h 80; y 40, 140, 240), fed from Ingress through a junction (400). In each row: the Namespace mark and its
 * name, its pods, then the ResourceQuota mark with a used-versus-hard gauge. Press 0 the cluster and its pods; press 1
 * (reach) Ingress at the door; press 2 (share) the namespaces; press 3 (use) the quotas. The lit part then walks.
 */
const C = { W: 1080, H: 360, UX: 86, UY: 180, US: 56, CX0: 230, CX1: 1060, CY0: 20, CY1: 340, IX: 330, IS: 60, JX: 400, RX0: 440, RX1: 1040, RH: 80, NSX: 480, QX: 810, MX: 846, MW: 174, PER: 3.6 }
const C_RY = [40, 140, 240]
const C_RC = C_RY.map((y) => y + C.RH / 2) // 80, 180, 280
const C_NS: { name: string; pods: number; met: 'm1' | 'm2' | 'm3' }[] = [
  { name: 'dev', pods: 2, met: 'm1' },
  { name: 'staging', pods: 3, met: 'm2' },
  { name: 'prod', pods: 3, met: 'm3' },
]
const C_MET_HELD = { m1: 0.5, m2: 0.68, m3: 0.82 }
const C_IN: Pt[] = [[C.UX + C.US / 2, C.UY], [C.IX - C.IS / 2, C.UY]]
const C_JN: Pt[] = [[C.IX + C.IS / 2, C.UY], [C.JX, C.UY]]
const cBranch = (y: number): Pt[] => (y === C.UY ? [[C.JX, y], [C.RX0, y]] : [[C.JX, C.UY], [C.JX, y], [C.RX0, y]])
const C_RIN = K.ride('t11in', C_IN, 0.1, 1.2, C.PER)
const C_RFAN = C_RC.map((y, i) => K.ride(`t11f${i}`, [...C_JN, ...cBranch(y).slice(1)], 1.3 + i * 0.25, 2.4 + i * 0.25, C.PER))

const C_T11B: Fig = (p) => {
  const { hot, s, held } = useBuild({ ...p, steps: p.steps ?? 3 }, 2200)
  return (
    <Frame w={C.W} h={C.H}>
      <Node x={C.UX} y={C.UY} mark={usersMark} size={C.US} label="Users" w={100} />

      {/* the cluster */}
      <Panel x={C.CX0} y={C.CY0} w={C.CX1 - C.CX0} h={C.CY1 - C.CY0} />
      <Show style={{ ...box(C.CX0 + 20, C.CY0 + 20, 150, 36), zIndex: 3, display: 'flex', alignItems: 'center', gap: 10 }} on>
        <MarkTile src={k8sMark} size={36} />
        <span style={heading(17)}>Cluster</span>
      </Show>

      {/* press 1 · reach: Ingress at the door */}
      <W pts={C_IN} on={s(1)} lit={hot === 0} head={10} />
      <Disc x={C.CX0} y={C.UY} icon="door" size={32} on={s(1)} loop="tilt" t={3} />
      <Node x={C.IX} y={C.UY} mark={ingMark} size={C.IS} label="Ingress" w={110} on={s(1)} lit={hot === 0} delay={200} />
      <Token cls={C_RIN} on={s(1)} size={9} />

      {/* press 2 · share: the namespaces */}
      <W pts={C_JN} on={s(2)} lit={hot === 1} head={0} />
      {C_RC.map((y, i) => <W key={y} pts={cBranch(y)} on={s(2)} lit={hot === 1} head={9} delay={150 + i * 100} />)}
      <Junction x={C.JX} y={C.UY} on={s(2)} lit={hot === 1} />
      {C_RFAN.map((c, i) => <Token key={i} cls={c} on={s(2)} size={8} />)}

      {C_NS.map((ns, i) => {
        const y = C_RC[i]
        return (
          <div key={ns.name}>
            <Panel x={C.RX0} y={C_RY[i]} w={C.RX1 - C.RX0} h={C.RH} on={s(2)} delay={i * 100} lit={hot === 1} tint="linear-gradient(180deg, #FFFFFF 0%, #F4F7FF 100%)" />
            <Node x={C.NSX} y={y} mark={nsMark} size={40} on={s(2)} delay={i * 100 + 100} />
            <Show on={s(2)} delay={i * 100 + 150} style={{ ...box(C.NSX + 32, y - 11, 90, 22), zIndex: 3, display: 'flex', alignItems: 'center' }}>
              <span style={code(16, colors.brandDeep)}>{ns.name}</span>
            </Show>
            {Array.from({ length: ns.pods }, (_, k) => (
              <Node key={k} x={640 + k * 48} y={y} mark={podMark} size={36} />
            ))}

            {/* press 3 · use: the quota gauge */}
            <Node x={C.QX} y={y} mark={quotaMark} size={40} on={s(3)} delay={i * 120} lit={hot === 2} />
            <Show on={s(3)} delay={i * 120 + 100} style={{ ...box(C.MX, y - 20, C.MW, 40), zIndex: 3 }}>
              <span style={{ ...tag(14), position: 'absolute', left: 0, top: 0, textAlign: 'left' }}>ResourceQuota</span>
              <div style={{ ...box(0, 26, C.MW, 12), borderRadius: 99, background: 'linear-gradient(180deg, #E9EFFC 0%, #F6F9FF 100%)', boxShadow: 'inset 0 0 0 1.5px #D3DEF6' }}>
                <span
                  aria-hidden
                  className={held ? undefined : `s21c-u s21c-${ns.met}`}
                  style={{ ...box(2, 2, C.MW - 4, 8), borderRadius: 99, background: DARK, transformOrigin: 'left center', ['--d' as string]: `${-i * 0.9}s`, transform: held ? `scaleX(${C_MET_HELD[ns.met]})` : undefined } as CSSProperties}
                />
                <span aria-hidden style={{ ...box(C.MW - 3, -3, 3, 18), borderRadius: 2, background: colors.brandDeep }} />
              </div>
            </Show>
          </div>
        )
      })}
    </Frame>
  )
}

export const figures: Record<string, Fig> = { C_T10, C_T10B, C_T11B }
export const css = [
  K.css(),
  `.s21c-u { animation-duration: 3.2s; animation-timing-function: cubic-bezier(0.45,0,0.55,1); animation-iteration-count: infinite; animation-delay: var(--d, 0s); }
@keyframes s21c-a { 0%, 100% { transform: scaleX(0.34) } 50% { transform: scaleX(0.8) } }
.s21c-a { animation-name: s21c-a; }
@keyframes s21c-b { 0%, 100% { transform: scaleX(0.5) } 50% { transform: scaleX(0.9) } }
.s21c-b { animation-name: s21c-b; animation-duration: 3.8s; }
@keyframes s21c-thr { 0%, 100% { transform: scaleX(0.55) scaleY(1) } 26% { transform: scaleX(1) scaleY(1) } 36% { transform: scaleX(1) scaleY(0.45) } 46% { transform: scaleX(1) scaleY(1) } 56% { transform: scaleX(1) scaleY(0.45) } 66% { transform: scaleX(1) scaleY(1) } 80% { transform: scaleX(1) scaleY(1) } }
.s21c-thr { animation-name: s21c-thr; animation-duration: 3.6s; animation-delay: 0s; }
@keyframes s21c-oom { 0% { transform: scaleX(0.12); opacity: 1 } 40% { transform: scaleX(1.16); opacity: 1 } 46% { transform: scaleX(1.16); opacity: 0 } 62% { transform: scaleX(0.02); opacity: 0 } 66% { transform: scaleX(0.02); opacity: 1 } 100% { transform: scaleX(0.12); opacity: 1 } }
.s21c-oom { animation-name: s21c-oom; animation-duration: 4s; animation-timing-function: linear; animation-delay: 0s; }
@keyframes s21c-kill { 0%, 41%, 64%, 100% { opacity: 1 } 46%, 58% { opacity: 0.28 } }
.s21c-kill { animation: s21c-kill 4s linear infinite; }
@keyframes s21c-pop { 0%, 39%, 64%, 100% { transform: scale(1) } 45% { transform: scale(1.28) } 52% { transform: scale(0.96) } 58% { transform: scale(1) } }
.s21c-pop { animation: s21c-pop 4s ease-in-out infinite; }
@keyframes s21c-turn { 0%, 58% { transform: rotate(0deg) } 76%, 100% { transform: rotate(360deg) } }
.s21c-turn { animation: s21c-turn 4s cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes s21c-m1 { 0%, 100% { transform: scaleX(0.38) } 50% { transform: scaleX(0.66) } }
.s21c-m1 { animation-name: s21c-m1; animation-duration: 3.6s; }
@keyframes s21c-m2 { 0%, 100% { transform: scaleX(0.52) } 50% { transform: scaleX(0.8) } }
.s21c-m2 { animation-name: s21c-m2; animation-duration: 4.2s; }
@keyframes s21c-m3 { 0%, 100% { transform: scaleX(0.66) } 50% { transform: scaleX(0.93) } }
.s21c-m3 { animation-name: s21c-m3; animation-duration: 3.9s; }
.cc-still .s21c-u, .cc-still .s21c-kill, .cc-still .s21c-pop, .cc-still .s21c-turn, .deck-thumb .s21c-u, .deck-thumb .s21c-kill, .deck-thumb .s21c-pop, .deck-thumb .s21c-turn { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .s21c-u, .s21c-kill, .s21c-pop, .s21c-turn { animation: none !important; } }`,
].join('\n')
