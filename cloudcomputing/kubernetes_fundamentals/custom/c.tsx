import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, Frame, Show, Plinth, MarkTile, Panel, Wire, Junction, keyframes, tag, heading, useHeld, useHot, type Pt } from '@/engine/figkit'
import podMark from '../images/k8s-pod.svg'
import volMark from '../images/k8s-vol.svg'
import schedMark from '../images/k8s-sched.svg'
import nodeMark from '../images/k8s-node.svg'
import internetMark from '../images/res-internet.svg'

/*
 * SESSION 20 · SECTION 3 (Pods) technical figures, builder C.
 * Built to generate-slides standing correction 17: 3D icons on plinth tiles, the Kubernetes project's own marks on white
 * tiles (they never move: their tile's halo breathes), >= 20 px equal padding, orthogonal wires computed from the same
 * constants as the boxes, a flow dot on every live wire, a lit item walking first -> last -> first after the build
 * (starting on the last item). Loops are transform / opacity on HTML elements only. Held (?still): the full final
 * state, nothing lit, nothing moving. Class prefix `s20c-`.
 *
 *   slide 22 C_T09   566 x 360  two containers; press 1 the Pod wraps them; press 2 the shared network interface, one IP (2)
 *   slide 23 C_T09B  566 x 360  the same Pod; press 1 a shared volume both containers mount (data rides it); press 2 the
 *                               scheduler places the whole Pod on a Node, a bare container is refused (2)
 *   slide 25 C_T10   566 x 360  Pod: App Container; press 1 Volume -> Sidecar -> Logs; press 2 Init Container runs and
 *                               finishes (tick) before the app; press 3 Ambassador proxies the app's calls out (3)
 *   slide 27 C_T11B 1080 x 360  myapp-7f9c6d8b45-k2p9q -> Pending (180 MB image pull bar) -> Running -> Succeeded /
 *                               Failed, Unknown below Running (4)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('s20c')
const BLUE = colors.brand
const MONO = "'JetBrains Mono', ui-monospace, monospace"
const NOLIG: CSSProperties = { fontVariantLigatures: 'none', fontFeatureSettings: "'liga' 0, 'calt' 0" }
const mono = (size = 14, color: string = colors.ink): CSSProperties => ({ fontFamily: MONO, ...NOLIG, fontSize: size, fontWeight: 600, lineHeight: 1.2, color, whiteSpace: 'nowrap' })
const CONT_TINT = 'linear-gradient(180deg, #F7F9FF 0%, #EAF0FF 100%)'

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)
const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })

/** the build of a figure: the step, the lit item, held (S18: the walk starts on the LAST item, so the last press lights what it built) */
function useBuild(p: Record<string, unknown>, period: number) {
  const cnt = Number(p.steps ?? 1)
  const held = useHeld()
  const step = held ? cnt : stepOf(p)
  const raw = useHot(cnt, stepOf(p), period)
  const hot = raw >= 0 && stepOf(p) >= cnt ? (raw + cnt - 1) % cnt : raw
  return { step, hot, held, s: (n: number) => step >= n }
}

/** a 3D icon (or an official mark) on its plinth with its tag under (or above) it; the TILE is centred on (x, y) */
function Node({ x, y, label, icon, mark, size = 52, k = 0.74, on = true, lit = false, warm = false, loop = 'bob', d = 0, t, w = 120, tagSize = 14, up = false, gap = 6, delay = 0, z = 3, fade = 1, children }: { x: number; y: number; label?: string; icon?: Ico3DName; mark?: string; size?: number; k?: number; on?: boolean; lit?: boolean; warm?: boolean; loop?: Loop; d?: number; t?: number; w?: number; tagSize?: number; up?: boolean; gap?: number; delay?: number; z?: number; fade?: number; children?: ReactNode }) {
  const tile = mark ? <MarkTile src={mark} size={size} lit={lit} /> : (
    <Plinth size={size} lit={lit} warm={warm}>
      <Ico3D name={icon ?? 'doc'} size={Math.round(size * k)} loop={loop} d={d} t={t} />
    </Plinth>
  )
  const lab = label ? <span style={{ ...tag(tagSize), [up ? 'marginBottom' : 'marginTop']: gap }}>{label}</span> : null
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, width: w, zIndex: z, display: 'flex', flexDirection: up ? 'column-reverse' : 'column', alignItems: 'center', ...(up ? { bottom: `calc(100% - ${y + size / 2}px)` } : { top: y - size / 2 }) }}>
      <div style={{ position: 'relative', width: size, height: size, display: 'grid', placeItems: 'center', opacity: fade }}>
        {tile}
        {children}
      </div>
      {lab}
    </Show>
  )
}

/** the engine's 3D cross turned to the template's orange (blocked = orange, never red) */
const OrangeCross = ({ size }: { size: number }) => (
  <span style={{ display: 'grid', filter: 'hue-rotate(28deg) saturate(1.15) brightness(1.06)' }}>
    <Ico3D name="cross" size={size} loop="none" />
  </span>
)

/** a small white disc holding a 3D icon, centred on (x, y) of its parent (a badge on a tile's corner or on a wire) */
function Disc({ x, y, on = true, size = 26, icon, loop = 'pulse', d = 0, t = 2.4, warn = false, delay = 0 }: { x: number; y: number; on?: boolean; size?: number; icon: Ico3DName; loop?: Loop; d?: number; t?: number; warn?: boolean; delay?: number }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: 6, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6', display: 'grid', placeItems: 'center', opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE} ${on ? delay : 0}ms, transform 520ms ${EASE} ${on ? delay : 0}ms` }}>
      {warn ? <OrangeCross size={size - 6} /> : <Ico3D name={icon} size={size - 6} loop={loop} d={d} t={t} />}
    </span>
  )
}

/**
 * A flow dot / a white disc carrying a mini 3D icon along a `ride` class. Unlike figkit's Token it is mounted from the
 * figure's first frame and only faded in by `on`, so every dot of a figure runs on ONE clock (a later press does not
 * start its dot out of step with the rest). Nothing on held frames.
 */
function Tok({ cls, on = true, tone = BLUE, size = 9, icon }: { cls: string; on?: boolean; tone?: string; size?: number; icon?: Ico3DName }) {
  const held = useHeld()
  const instant = useInstant()
  if (held) return null
  const dot: CSSProperties = icon
    ? { display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -4px rgba(31,64,140,0.55)', opacity: 0 }
    : { display: 'block', width: size, height: size, borderRadius: 99, background: tone, boxShadow: `0 0 0 4px ${tone}2e, 0 4px 10px -4px ${tone}`, opacity: 0 }
  return (
    <span aria-hidden style={{ position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, zIndex: 7, pointerEvents: 'none', opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 300ms ${EASE}` }}>
      <span className={cls} style={dot}>{icon ? <Ico3D name={icon} size={size - 6} loop="none" /> : null}</span>
    </span>
  )
}

/** a wire on its own layer above the cards (a Panel is z 2 and would hide a wire drawn inside it); tiles (z 3) stay on top */
const W = (props: Parameters<typeof Wire>[0]) => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}><Wire {...props} /></div>
)

/** a title row: an official mark (or a 3D icon) on its tile and the heading beside it, the row's left edge at x, centred on y */
function TitleRow({ x, y, mark, icon, text, size = 36, on = true, lit = false, warm = false, hs = 17, delay = 0 }: { x: number; y: number; mark?: string; icon?: Ico3DName; text: string; size?: number; on?: boolean; lit?: boolean; warm?: boolean; hs?: number; delay?: number }) {
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x, top: y - size / 2, height: size, display: 'flex', alignItems: 'center', gap: 10, zIndex: 3 }}>
      {mark ? <MarkTile src={mark} size={size} lit={lit} /> : <Plinth size={size} lit={lit} warm={warm}><Ico3D name={icon ?? 'doc'} size={Math.round(size * 0.74)} loop="bob" /></Plinth>}
      <span style={{ ...heading(hs), whiteSpace: 'nowrap' }}>{text}</span>
    </Show>
  )
}

/** a container drawn as a tinted inner box holding the container tile and its tag (a Panel, so it rings when lit) */
function ContBox({ x, y, w, h, on = true, lit = false, delay = 0 }: { x: number; y: number; w: number; h: number; on?: boolean; lit?: boolean; delay?: number }) {
  return <Panel x={x} y={y} w={w} h={h} on={on} lit={lit} delay={delay} radius={14} tint={CONT_TINT} />
}

/* ================================================================== slide 22 · C_T09 · the Pod wraps containers, one IP */

/*
 * 566 x 360. Two container boxes (w 200, h 120: x 60 and 306, y 92..212), each a container tile (56) at y 140 tagged
 * `Container`. Press 1: the Pod card (x 20..546, y 20..340) wraps them, its title row (pod mark, `Pod`) at y 58.
 * Press 2: the shared network interface, a rail (x 110..456, y 262..274) joined to both container boxes by a wire
 * (box bottom 212 to rail top 262), with ONE IP on it: the network tile (router, 44) at (283, 268) tagged `Shared IP`.
 * Loop: traffic for the one IP reaches either container along the rail.
 */
const P = { W: 566, H: 360, PX: 20, PY: 20, PW: 526, PH: 320, BX: [60, 306], BY: 92, BW: 200, BH: 120, TY: 140, RX0: 110, RX1: 456, RY: 268, NX: 283, NS: 44, PER: 3.4 }
const P_CX = P.BX.map((x) => x + P.BW / 2) // 160, 406
const P_DROP: Pt[][] = P_CX.map((x) => [[x, P.BY + P.BH], [x, P.RY - 6]])
const P_IN: Pt[][] = [
  [[P.NX - P.NS / 2, P.RY], [P_CX[0], P.RY], [P_CX[0], P.BY + P.BH]],
  [[P.NX + P.NS / 2, P.RY], [P_CX[1], P.RY], [P_CX[1], P.BY + P.BH]],
]
const P_OUT: Pt[][] = P_IN.map((pts) => [...pts].reverse())
const P_R = [K.ride('t09a', P_IN[0], 0.1, 1.0, P.PER), K.ride('t09b', P_IN[1], 1.8, 2.7, P.PER)]
const P_RB = [K.ride('t09c', P_OUT[0], 1.1, 1.8, P.PER, 0.5), K.ride('t09d', P_OUT[1], 2.8, 3.35, P.PER, 0.5)]

/** the shared network interface rail */
function Rail({ x0, x1, y, on, lit }: { x0: number; x1: number; y: number; on: boolean; lit: boolean }) {
  const instant = useInstant()
  return (
    <Show on={on} style={{ ...box(x0, y - 6, x1 - x0, 12), zIndex: 2 }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 6, background: 'linear-gradient(180deg, #D6E3FF 0%, #9DB8FF 100%)', boxShadow: lit ? `inset 0 0 0 2px ${ORANGE}, 0 6px 14px -8px rgba(255,138,61,0.8)` : 'inset 0 0 0 1.5px #7FA0EA, 0 6px 14px -8px rgba(31,64,140,0.5)', transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }} />
    </Show>
  )
}

const C_T09: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 2 }, 2200)
  return (
    <Frame w={P.W} h={P.H}>
      {/* point 1: the Pod wraps the containers */}
      <Panel x={P.PX} y={P.PY} w={P.PW} h={P.PH} on={s(1)} lit={hot === 0} />
      <TitleRow x={P.PX + 20} y={58} mark={podMark} text="Pod" on={s(1)} lit={hot === 0} />
      {P.BX.map((x) => <ContBox key={x} x={x} y={P.BY} w={P.BW} h={P.BH} />)}
      {P_CX.map((x, i) => <Node key={x} x={x} y={P.TY} icon="container" size={56} label="Container" d={i * 0.5} />)}

      {/* point 2: one shared network interface, one IP */}
      <Rail x0={P.RX0} x1={P.RX1} y={P.RY} on={s(2)} lit={hot === 1} />
      {P_DROP.map((pts, i) => <W key={i} pts={pts} on={s(2)} lit={hot === 1} head={0} width={3} delay={200 + i * 100} />)}
      <Node x={P.NX} y={P.RY} icon="router" size={P.NS} w={140} on={s(2)} lit={hot === 1} loop="pulse" t={2.6} delay={150}>
        <span style={{ position: 'absolute', top: P.NS + 6, left: '50%', transform: 'translateX(-50%)', ...tag(14) }}>Shared IP</span>
      </Node>
      {P_R.map((c, i) => <Tok key={i} cls={c} on={s(2)} />)}
      {P_RB.map((c, i) => <Tok key={`b${i}`} cls={c} on={s(2)} size={8} tone={colors.brandDark} />)}
    </Frame>
  )
}

/* ================================================================== slide 23 · C_T09B · shared volume, the whole Pod scheduled */

/*
 * 566 x 360. Left: the Pod card (x 20..300, y 20..340), title row at y 58, two container boxes (w 110, h 112: x 40 and
 * 170, y 92..204), container tiles (48) at y 136. Press 1: the shared Volume (vol mark, 48) at (160, 272); container 1
 * writes into it (down from its box, right into the volume's left edge), container 2 reads from it (out of the volume's
 * right edge, up into its box); a data card rides that path. Press 2: the Scheduler (sched mark) at (355, 140) between
 * the Pod's right edge and the Node card (x 410..546, y 20..210: node mark + `Node`, the placed Pod inside at y 136);
 * a bare container (y 292) below the scheduler: its dashed, faded orange path to the Node stops at an orange cross.
 */
const Q = { W: 566, H: 360, PX: 20, PR: 300, BX: [40, 170], BY: 92, BW: 110, BH: 112, TY: 136, VX: 160, VY: 272, VS: 48, SX: 355, SS: 48, NX0: 410, NX1: 546, NY0: 20, NY1: 210, PODY: 140, BCY: 292, BCS: 44, PER: 3.4 }
const Q_CX = Q.BX.map((x) => x + Q.BW / 2) // 95, 225
const Q_NC = (Q.NX0 + Q.NX1) / 2 // 478
const Q_WRITE: Pt[] = [[Q_CX[0], Q.BY + Q.BH], [Q_CX[0], Q.VY], [Q.VX - Q.VS / 2, Q.VY]]
const Q_READ: Pt[] = [[Q.VX + Q.VS / 2, Q.VY], [Q_CX[1], Q.VY], [Q_CX[1], Q.BY + Q.BH]]
const Q_TO_S: Pt[] = [[Q.PR, Q.PODY], [Q.SX - Q.SS / 2, Q.PODY]]
const Q_TO_N: Pt[] = [[Q.SX + Q.SS / 2, Q.PODY], [Q.NX0, Q.PODY]]
const Q_BARE: Pt[] = [[Q.SX + Q.BCS / 2, Q.BCY], [Q_NC, Q.BCY], [Q_NC, Q.NY1 + 2]]
const Q_XY = 248 // the orange cross, on the bare path before the Node's bottom edge
const Q_RW = K.ride('t09bw', Q_WRITE, 0.1, 1.0, Q.PER)
const Q_RR = K.ride('t09br', Q_READ, 1.3, 2.2, Q.PER)
const Q_RP = K.ride('t09bp', [...Q_TO_S, ...Q_TO_N], 0.3, 1.6, Q.PER)
const Q_RB = K.ride('t09bb', [[Q.SX + Q.BCS / 2, Q.BCY], [Q_NC, Q.BCY], [Q_NC, Q_XY + 18]], 1.6, 2.7, Q.PER, 0.4)

const C_T09B: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 2 }, 2200)
  return (
    <Frame w={Q.W} h={Q.H}>
      {/* the same Pod */}
      <Panel x={Q.PX} y={20} w={Q.PR - Q.PX} h={320} />
      <TitleRow x={Q.PX + 20} y={58} mark={podMark} text="Pod" />
      {Q.BX.map((x) => <ContBox key={x} x={x} y={Q.BY} w={Q.BW} h={Q.BH} />)}
      {Q_CX.map((x, i) => <Node key={x} x={x} y={Q.TY} icon="container" size={48} label="Container" d={i * 0.5} />)}

      {/* point 3: one volume both containers mount */}
      <W pts={Q_WRITE} on={s(1)} lit={hot === 0} head={9} />
      <W pts={Q_READ} on={s(1)} lit={hot === 0} head={9} delay={250} />
      <Node x={Q.VX} y={Q.VY} mark={volMark} size={Q.VS} label="Volume" w={100} on={s(1)} lit={hot === 0} delay={100} />
      <Tok cls={Q_RW} on={s(1)} size={24} icon="doc" />
      <Tok cls={Q_RR} on={s(1)} size={24} icon="doc" />

      {/* point 4: the scheduler places the whole Pod on a Node; a bare container is refused */}
      <W pts={Q_TO_S} on={s(2)} lit={hot === 1} head={9} />
      <W pts={Q_TO_N} on={s(2)} lit={hot === 1} head={9} delay={200} />
      <Node x={Q.SX} y={Q.PODY} mark={schedMark} size={Q.SS} label="Scheduler" tagSize={13} w={90} on={s(2)} lit={hot === 1} />
      <Panel x={Q.NX0} y={Q.NY0} w={Q.NX1 - Q.NX0} h={Q.NY1 - Q.NY0} on={s(2)} lit={hot === 1} delay={150} />
      <TitleRow x={Q.NX0 + 20} y={Q.NY0 + 38} mark={nodeMark} text="Node" size={32} hs={16} on={s(2)} delay={150} />
      <Node x={Q_NC} y={Q.PODY} mark={podMark} size={48} label="Pod" w={90} on={s(2)} delay={450} />
      <Tok cls={Q_RP} on={s(2)} size={10} />

      <W pts={Q_BARE} on={s(2)} color={ORANGE} head={0} width={2.2} dash="6 6" opacity={0.55} delay={300} />
      <Node x={Q.SX} y={Q.BCY} icon="container" size={Q.BCS} label="Container" w={90} on={s(2)} delay={250} fade={0.7} loop="bob" d={0.3} />
      <Disc x={Q_NC} y={Q_XY} icon="cross" warn size={28} on={s(2)} delay={500} />
      <Tok cls={Q_RB} on={s(2)} size={8} tone={ORANGE} />
    </Frame>
  )
}

/* ================================================================== slide 25 · C_T10 · sidecar, init, ambassador */

/*
 * 566 x 360. The Pod card (x 20..430, y 20..340), title row at y 58. Row A (y 150, tags above): Init Container (90),
 * App Container (230, the main one, tile 60), Ambassador (360), and outside the Pod the Internet (500). Row B (y 272,
 * tags below): Volume (230), Sidecar (360, smaller), and outside the Pod the Logs it ships to (500).
 * Press 1: the app writes its log into the Volume, the Sidecar (log shipper) reads it and ships it out; log lines ride.
 * Press 2: the Init Container runs, finishes (tick), then the app starts (wire into the app).
 * Press 3: the Ambassador proxies the app's outbound calls to the Internet.
 */
const R = { W: 566, H: 360, PR: 430, AY: 150, BY: 272, IX: 90, AX: 230, MX: 360, OX: 500, AS: 60, NS: 46, PER: 3.6 }
const R_APPV: Pt[] = [[R.AX, R.AY + R.AS / 2], [R.AX, R.BY - R.NS / 2]]
const R_VS: Pt[] = [[R.AX + R.NS / 2, R.BY], [R.MX - R.NS / 2, R.BY]]
const R_SL: Pt[] = [[R.MX + R.NS / 2, R.BY], [R.OX - R.NS / 2, R.BY]]
const R_IA: Pt[] = [[R.IX + R.NS / 2, R.AY], [R.AX - R.AS / 2, R.AY]]
const R_AM: Pt[] = [[R.AX + R.AS / 2, R.AY], [R.MX - R.NS / 2, R.AY]]
const R_MO: Pt[] = [[R.MX + R.NS / 2, R.AY], [R.OX - R.NS / 2, R.AY]]
const R_LOG = [K.ride('t10l1', R_APPV, 0.1, 0.8, R.PER), K.ride('t10l2', R_VS, 1.0, 1.7, R.PER)]
const R_SHIP = K.ride('t10s', R_SL, 1.9, 2.6, R.PER)
const R_INIT = K.ride('t10i', R_IA, 0.4, 1.2, R.PER)
const R_OUT = [K.ride('t10o1', R_AM, 1.4, 2.0, R.PER), K.ride('t10o2', R_MO, 2.2, 2.9, R.PER)]

const C_T10: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 3 }, 2000)
  return (
    <Frame w={R.W} h={R.H}>
      <Panel x={20} y={20} w={R.PR - 20} h={320} />
      <TitleRow x={40} y={58} mark={podMark} text="Pod" />
      <Node x={R.AX} y={R.AY} icon="container" size={R.AS} label="App Container" tagSize={13} w={110} up />

      {/* point 1: the sidecar reads the app's log through the shared volume and ships it */}
      <W pts={R_APPV} on={s(1)} lit={hot === 0} head={9} />
      <W pts={R_VS} on={s(1)} lit={hot === 0} head={9} delay={200} />
      <W pts={R_SL} on={s(1)} lit={hot === 0} head={9} delay={400} />
      <Node x={R.AX} y={R.BY} mark={volMark} size={R.NS} label="Volume" w={90} on={s(1)} lit={hot === 0} delay={100} />
      <Node x={R.MX} y={R.BY} icon="log" size={R.NS} label="Sidecar" w={90} on={s(1)} lit={hot === 0} delay={250} d={0.3} />
      <Node x={R.OX} y={R.BY} icon="database" size={R.NS} label="Logs" w={80} on={s(1)} delay={400} loop="pulse" t={3} />
      {R_LOG.map((c, i) => <Tok key={i} cls={c} on={s(1)} size={22} icon="log" />)}
      <Tok cls={R_SHIP} on={s(1)} size={22} icon="log" />

      {/* point 2: the init container runs once and finishes before the app starts */}
      <Node x={R.IX} y={R.AY} icon="play" size={R.NS} label="Init Container" tagSize={13} w={110} up gap={6 + (R.AS - R.NS) / 2} on={s(2)} lit={hot === 1} loop="pulse" t={2.4}>
        <Disc x={R.NS - 4} y={R.NS - 4} icon="check" size={24} on={s(2)} delay={700} />
      </Node>
      <W pts={R_IA} on={s(2)} lit={hot === 1} head={9} delay={900} />
      <Tok cls={R_INIT} on={s(2)} />

      {/* point 3: the ambassador proxies the app's outbound network calls */}
      <W pts={R_AM} on={s(3)} lit={hot === 2} head={9} />
      <W pts={R_MO} on={s(3)} lit={hot === 2} head={9} delay={250} />
      <Node x={R.MX} y={R.AY} icon="router" size={R.NS} label="Ambassador" tagSize={13} w={100} up gap={6 + (R.AS - R.NS) / 2} on={s(3)} lit={hot === 2} loop="pulse" t={2.6} />
      <Node x={R.OX} y={R.AY} mark={internetMark} size={R.NS} label="Internet" tagSize={13} w={80} up gap={6 + (R.AS - R.NS) / 2} on={s(3)} delay={250} />
      {R_OUT.map((c, i) => <Tok key={i} cls={c} on={s(3)} />)}
    </Frame>
  )
}

/* ================================================================== slide 27 · C_T11B · the pod walks its phases */

/*
 * 1080 x 360, main axis y 150. The Pod card (x 20..240, y 90..210): pod mark and `myapp-7f9c6d8b45-k2p9q`.
 * Press 1: Pending (x 296..556, y 70..230): hourglass + `Pending`, and the image pull: a download tile and a bar that
 * fills, `180 MB` under it. Press 2: Running (x 612..802, y 110..190). Press 3: from Running through a junction (832)
 * up to Succeeded (x 862..1060, y 40..120) and down to Failed (y 180..260, orange). Press 4: Unknown below Running
 * (y 260..340), a side branch. Loop (6 s, the TR's "about 6 seconds"): the pod (a white disc carrying a cube, the
 * pod's glyph; the official mark itself never moves) rides into Pending, the bar fills, it rides on to Running and
 * Succeeded; dots run the Failed and Unknown branches.
 */
const S = { W: 1080, H: 360, Y: 150, PDX0: 20, PDX1: 240, PDY0: 90, PDY1: 210, PNX0: 296, PNX1: 556, PNY0: 70, PNY1: 230, RX0: 612, RX1: 802, RY0: 110, RY1: 190, J: 832, OX0: 862, OX1: 1060, SY: 80, FY: 220, OH: 80, UY0: 260, UY1: 340, PL_MID: 26, PL_OUT: 21, PER: 6 }
const S_RC = (S.RX0 + S.RX1) / 2 // 707
const S_IN: Pt[] = [[S.PDX1, S.Y], [S.PNX0, S.Y]]
const S_PR: Pt[] = [[S.PNX1, S.Y], [S.RX0, S.Y]]
const S_RJ: Pt[] = [[S.RX1, S.Y], [S.J, S.Y]]
const S_JS: Pt[] = [[S.J, S.Y], [S.J, S.SY], [S.OX0, S.SY]]
const S_JF: Pt[] = [[S.J, S.Y], [S.J, S.FY], [S.OX0, S.FY]]
const S_RU: Pt[] = [[S_RC, S.RY1], [S_RC, S.UY0]]
const S_R1 = K.ride('t11p1', S_IN, 0.05, 0.6, S.PER, 0.8)
const S_R2 = K.ride('t11p2', S_PR, 3.5, 4.05, S.PER, 0.8)
const S_R3 = K.ride('t11p3', [...S_RJ, ...S_JS.slice(1)], 4.35, 5.25, S.PER, 0.8)
const S_RF = K.ride('t11f', [...S_RJ, ...S_JF.slice(1)], 1.0, 1.9, S.PER)
const S_RU2 = K.ride('t11u', S_RU, 2.2, 2.9, S.PER)
/* the image pull: the bar fills while the pod sits in Pending (0.7 s .. 3.3 s of the 6 s loop), resets as the loop restarts */
const PULL_CSS = `@keyframes s20c-pull { 0%, 11% { transform: scaleX(0.02) } 55% { transform: scaleX(1) } 98% { transform: scaleX(1) } 100% { transform: scaleX(0.02) } }
.s20c-pull { animation: s20c-pull ${S.PER}s cubic-bezier(0.45,0,0.55,1) infinite; transform-origin: 0 50%; }`

/** a phase card: a Panel with its icon tile and the TR's phase name, the row centred on the card */
function Phase({ x0, x1, y0, y1, icon, name, on, lit, warm = false, delay = 0, loop = 'bob', t, padL }: { x0: number; x1: number; y0: number; y1: number; icon: Ico3DName; name: string; on: boolean; lit: boolean; warm?: boolean; delay?: number; loop?: Loop; t?: number; padL: number }) {
  return (
    <Panel x={x0} y={y0} w={x1 - x0} h={y1 - y0} on={on} lit={lit} delay={delay} edge={warm ? '#FFB98A' : undefined} tint={warm ? 'linear-gradient(180deg, #FFFFFF 0%, #FFF5EC 100%)' : undefined} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: padL, gap: 14 }}>
      <Plinth size={44} lit={lit} warm={warm}><Ico3D name={icon} size={33} loop={loop} t={t} /></Plinth>
      <span style={{ ...heading(18), whiteSpace: 'nowrap' }}>{name}</span>
    </Panel>
  )
}

/** the image pull bar in Pending */
function PullBar({ x, y, w, on }: { x: number; y: number; w: number; on: boolean }) {
  const held = useHeld()
  return (
    <Show on={on} delay={200} style={{ ...box(x, y - 6, w, 12), zIndex: 3 }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 6, background: '#E3EBFD', boxShadow: 'inset 0 0 0 1px #C9D7F7', overflow: 'hidden' }}>
        <div className={held ? undefined : 's20c-pull'} style={{ position: 'absolute', inset: 0, borderRadius: 6, background: `linear-gradient(90deg, #6E93F5 0%, ${BLUE} 100%)`, transformOrigin: '0 50%' }} />
      </div>
    </Show>
  )
}

const C_T11B: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 4 }, 1800)
  const pullY = 176
  return (
    <Frame w={S.W} h={S.H}>
      {/* the pod (the lead names it) */}
      <Panel x={S.PDX0} y={S.PDY0} w={S.PDX1 - S.PDX0} h={S.PDY1 - S.PDY0} />
      <Node x={(S.PDX0 + S.PDX1) / 2} y={S.PDY0 + 46} mark={podMark} size={48} w={200}>
        <span style={{ position: 'absolute', top: 48 + 10, left: '50%', transform: 'translateX(-50%)', ...mono(13) }}>myapp-7f9c6d8b45-k2p9q</span>
      </Node>

      {/* press 1: Pending, the 180 MB image pull */}
      <W pts={S_IN} on={s(1)} lit={hot === 0} head={9} />
      <Panel x={S.PNX0} y={S.PNY0} w={S.PNX1 - S.PNX0} h={S.PNY1 - S.PNY0} on={s(1)} lit={hot === 0} delay={100} />
      <TitleRow x={S.PNX0 + 20} y={S.PNY0 + 42} icon="hourglass" text="Pending" size={44} hs={18} on={s(1)} lit={hot === 0} delay={100} />
      <Node x={S.PNX0 + 20 + 18} y={pullY} icon="download" size={36} w={36} on={s(1)} delay={200} loop="bob" t={1.8} />
      <PullBar x={S.PNX0 + 70} y={pullY} w={S.PNX1 - 20 - (S.PNX0 + 70)} on={s(1)} />
      <Show on={s(1)} delay={300} style={{ ...box(S.PNX0 + 70, pullY + 12, S.PNX1 - 20 - (S.PNX0 + 70), 18), zIndex: 3, display: 'grid', placeItems: 'center' }}>
        <span style={mono(14, colors.brandDeep)}>180 MB</span>
      </Show>
      <Tok cls={S_R1} on={s(1)} size={28} icon="cube" />

      {/* press 2: Running */}
      <W pts={S_PR} on={s(2)} lit={hot === 1} head={9} />
      <Phase x0={S.RX0} x1={S.RX1} y0={S.RY0} y1={S.RY1} icon="play" name="Running" padL={S.PL_MID} on={s(2)} lit={hot === 1} delay={100} loop="pulse" t={2.2} />
      <Tok cls={S_R2} on={s(2)} size={28} icon="cube" />

      {/* press 3: Succeeded / Failed */}
      <W pts={S_RJ} on={s(3)} lit={hot === 2} head={0} />
      <W pts={S_JS} on={s(3)} lit={hot === 2} head={9} delay={200} />
      <W pts={S_JF} on={s(3)} color={ORANGE} head={9} delay={300} />
      <Junction x={S.J} y={S.Y} on={s(3)} lit={hot === 2} />
      <Phase x0={S.OX0} x1={S.OX1} y0={S.SY - S.OH / 2} y1={S.SY + S.OH / 2} icon="check" name="Succeeded" padL={S.PL_OUT} on={s(3)} lit={hot === 2} delay={200} loop="pulse" t={2.6} />
      <Phase x0={S.OX0} x1={S.OX1} y0={S.FY - S.OH / 2} y1={S.FY + S.OH / 2} icon="alert" name="Failed" padL={S.PL_OUT} warm on={s(3)} lit={hot === 2} delay={300} loop="tilt" t={2.4} />
      <Tok cls={S_R3} on={s(3)} size={28} icon="cube" />
      <Tok cls={S_RF} on={s(3)} size={9} tone={ORANGE} />

      {/* press 4: Unknown, a side branch from Running */}
      <W pts={S_RU} on={s(4)} lit={hot === 3} head={9} width={2.2} />
      <Phase x0={S.RX0} x1={S.RX1} y0={S.UY0} y1={S.UY1} icon="search" name="Unknown" padL={S.PL_MID} on={s(4)} lit={hot === 3} delay={150} loop="tilt" t={3} />
      <Tok cls={S_RU2} on={s(4)} size={9} />
    </Frame>
  )
}

export const figures: Record<string, Fig> = { C_T09, C_T09B, C_T10, C_T11B }
export const css = [K.css(), PULL_CSS].join('\n')
