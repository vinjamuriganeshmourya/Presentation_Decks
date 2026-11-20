import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Badge, type Loop } from '@/engine/icons3d'
import { EASE, FONT, ORANGE, Frame, Show, Plinth, MarkTile, Panel, Wire, Junction, Token, keyframes, loopCls, loopVars, tag, heading, useHeld, useHot, type Pt } from '@/engine/figkit'
import elbMark from '../images/aws-elastic-load-balancing.svg'
import cacheMark from '../images/aws-elasticache.svg'
import sqsMark from '../images/aws-sqs.svg'
import asgMark from '../images/aws-ec2-auto-scaling.svg'
import grpMark from '../images/grp-auto-scaling-group.svg'
import ec2Mark from '../images/res-ec2-instance.svg'

/*
 * SESSION 18 · SECTION 5 (Scalability & Resilience Patterns) technical figures, builder E (T19-T21; T22-T25 are in f.tsx,
 * which imports the shared pieces below). Built to generate-slides standing correction 17 (Sessions 14-16): 3D icons on
 * plinth tiles, official marks on white tiles, >= 20 px equal padding, orthogonal wires computed from the same constants
 * as the boxes, a flow dot on every wire, a lit item walking first -> last -> first after the build. Loops are
 * transform / opacity on HTML elements only. Held (?still): the full final state, nothing lit, nothing moving.
 * Class prefix `s18e-`.
 *
 *   slide 41 E_T19   626 x 360  client -> Load Balancer -> Cache -> Queue -> Service (instances; Retry, Circuit Breaker, Fallback slots) (2)
 *   slide 42 E_T19   626 x 400, from 2: Retry, Circuit Breaker, Fallback fill their slots (3)
 *   slide 43 E_T20   586 x 360  one large server -> three behind a load balancer; one fails, a new one beside it; shared state (3)
 *   slide 44 E_T20B  606 x 380  Elastic Load Balancing + Auto Scaling group adding an instance; instance-hour coins beside a shield (2)
 *   slide 45 E_T21   606 x 360  cache-aside lane (Hit back, Miss from the application to the database, Store into the cache) over a producer -> queue -> consumer lane (2)
 *   slide 46 E_T21   606 x 380, from 2: ElastiCache and SQS marks on the cache and queue; backend reads drop (2)
 */

export type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('s18e')
export const BLUE = colors.brand
export const MONO = "'JetBrains Mono', ui-monospace, monospace"
export const NOLIG: CSSProperties = { fontVariantLigatures: 'none', fontFeatureSettings: "'liga' 0, 'calt' 0" }
export const RIM = 'inset 0 0 0 1.5px #D3DEF6, 0 10px 20px -12px rgba(31,64,140,0.5)'
export const LIT = `inset 0 0 0 2.5px ${ORANGE}, 0 10px 22px -12px rgba(255,138,61,0.7)`
/** the 12 icon names the ICONS builder adds to the engine (typed loosely until they are in the union) */
export const I = (n: string) => n as Ico3DName
/** the engine's red 3D icons (ban) tinted to the template orange: failure and blocked are orange, never red (lead, builder c) */
export const ORANGE_TINT = 'hue-rotate(28deg) saturate(1.15) brightness(1.06)'

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)
export const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })

/** the build of a figure that may be split over two slides (`from`): the global step, the lit item, held */
export function useBuild(p: Record<string, unknown>, period: number) {
  const off = Number(p.from ?? 0)
  const cnt = Number(p.steps ?? 1)
  const held = useHeld()
  const step = held ? off + cnt : stepOf(p) + off
  /* figkit's walk starts at item 0 the moment the build ends, so the last press would light the FIRST item; start the
     walk on the last item instead (last -> first -> ... -> last), so the final press lights what it built (lead, builder c) */
  const raw = useHot(cnt, stepOf(p), period)
  const local = raw >= 0 && stepOf(p) >= cnt ? (raw + cnt - 1) % cnt : raw
  const hot = local < 0 ? -1 : local + off
  return { step, hot, held, s: (n: number) => step >= n, live: !held, done: held || stepOf(p) >= cnt }
}

/** a 3D icon (or an official mark) on its plinth with its tag under (or above, or right of) it; the TILE is centred on (x, y) */
export function Node({ x, y, label, icon, mark, size = 52, k = 0.74, on = true, lit = false, warm = false, loop = 'bob', d = 0, t, badge, w = 120, tagSize = 14, dim = false, up = false, right = false, delay = 0, z = 3, children, cls }: { x: number; y: number; label?: string; icon?: Ico3DName; mark?: string; size?: number; k?: number; on?: boolean; lit?: boolean; warm?: boolean; loop?: Loop; d?: number; t?: number; badge?: Badge; w?: number; tagSize?: number; dim?: boolean; up?: boolean; right?: boolean; delay?: number; z?: number; children?: ReactNode; cls?: string }) {
  const instant = useInstant()
  const tile = mark ? <MarkTile src={mark} size={size} lit={lit} /> : (
    <Plinth size={size} lit={lit} warm={warm}>
      <Ico3D name={icon ?? 'doc'} size={Math.round(size * k)} loop={loop} d={d} t={t} badge={badge} />
    </Plinth>
  )
  const inner = (
    <div style={{ position: 'relative', width: size, height: size, display: 'grid', placeItems: 'center', opacity: dim ? 0.38 : 1, filter: dim ? 'grayscale(1)' : undefined, transition: instant ? 'none' : `opacity 520ms ${EASE}, filter 520ms ${EASE}` }}>
      {tile}
      {children}
    </div>
  )
  if (right) {
    return (
      <Show on={on} delay={delay} style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, height: size, zIndex: z, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className={cls}>{inner}</div>
        {label && <span style={{ ...tag(tagSize), opacity: dim ? 0.5 : 1 }}>{label}</span>}
      </Show>
    )
  }
  const lab = label ? <span style={{ ...tag(tagSize), opacity: dim ? 0.5 : 1, [up ? 'marginBottom' : 'marginTop']: 6 }}>{label}</span> : null
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, width: w, zIndex: z, display: 'flex', flexDirection: up ? 'column-reverse' : 'column', alignItems: 'center', ...(up ? { bottom: `calc(100% - ${y + size / 2}px)` } : { top: y - size / 2 }) }}>
      <div className={cls}>{inner}</div>
      {lab}
    </Show>
  )
}

/** a small white disc on a tile's corner holding a 3D icon (or a mark); centred on (x, y) of the frame */
export function Corner({ x, y, on = true, size = 28, icon, mark, loop = 'beat', d = 0, z = 6, orange = false }: { x: number; y: number; on?: boolean; size?: number; icon?: Ico3DName; mark?: string; loop?: Loop; d?: number; z?: number; orange?: boolean }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: z, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6', display: 'grid', placeItems: 'center', opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}` }}>
      {mark ? <img src={mark} alt="" aria-hidden draggable={false} style={{ width: size - 8, height: size - 8, display: 'block' }} /> : (orange ? <span style={{ display: 'grid', filter: ORANGE_TINT }}><Ico3D name={icon ?? 'check'} size={size - 6} loop={loop} d={d} t={2.4} /></span> : <Ico3D name={icon ?? 'check'} size={size - 6} loop={loop} d={d} t={2.4} />)}
    </span>
  )
}

/** a white disc carrying a mini 3D icon along a `ride` class (placed from the frame's 0,0); nothing on held frames */
export function Rider({ cls, icon, size = 24, on = true, tone }: { cls: string; icon: Ico3DName; size?: number; on?: boolean; tone?: string }) {
  const held = useHeld()
  if (held || !on) return null
  return (
    <span aria-hidden style={{ position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, zIndex: 7, pointerEvents: 'none' }}>
      <span className={cls} style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: tone ? `0 0 0 2.5px ${tone}, 0 4px 10px -4px rgba(31,64,140,0.55)` : '0 4px 10px -4px rgba(31,64,140,0.55)', opacity: 0 }}>
        <Ico3D name={icon} size={size - 6} loop="none" />
      </span>
    </span>
  )
}

/** a wire on its own layer above the cards (a Panel is z 2 and would hide a wire drawn inside it); tiles (z 3) stay on top */
export const W = (props: Parameters<typeof Wire>[0] & { cls?: string }) => {
  const { cls, ...rest } = props
  return <div className={cls} style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}><Wire {...rest} /></div>
}

/** an empty dashed slot where a tile will arrive (the deck's "not yet" mark) */
export function Slot({ x, y, size = 52, on = true }: { x: number; y: number; size?: number; on?: boolean }) {
  const instant = useInstant()
  return <span aria-hidden style={{ ...box(x - size / 2, y - size / 2, size, size), zIndex: 2, borderRadius: Math.round(size * 0.28), border: '2px dashed #C5D3EE', opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE}` }} />
}

/** the deck's failure mark: an orange disc with a white cross (the template accent, never red), centred on (x, y) */
export function XMark({ x, y, size = 24, on = true, z = 6, d = 0 }: { x: number; y: number; size?: number; on?: boolean; z?: number; d?: number }) {
  const instant = useInstant()
  const k = size * 0.26
  return (
    <span aria-hidden style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: z, opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}` }}>
      <span className={loopCls('glow')} style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: `radial-gradient(circle at 34% 28%, #FFC49B 0%, ${ORANGE} 52%, #E5661F 100%)`, boxShadow: '0 0 0 2.5px #FFFFFF, 0 5px 10px -4px rgba(229,102,31,0.7)', ...loopVars(d, 2.2) }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
          <path d={`M ${size / 2 - k} ${size / 2 - k} L ${size / 2 + k} ${size / 2 + k} M ${size / 2 + k} ${size / 2 - k} L ${size / 2 - k} ${size / 2 + k}`} stroke="#FFFFFF" strokeWidth={Math.max(2.4, size * 0.13)} strokeLinecap="round" />
        </svg>
      </span>
    </span>
  )
}

/* ================================================================== slides 41-42 · E_T19 · the resilience patterns map */

/*
 * 626 wide; H = the slide's figure box (360 on T19, 400 on T19-B). Row 1 (tags above, tiles centred on y 68): Client 70,
 * Load Balancer 210, Cache 350, Queue 490; the queue drops into the Service card (x 20..606, y 134..H-20). In the card:
 * the title, the Retry / Circuit Breaker / Fallback slots (x 90, 210, 330) and the three instances (430, 490, 550).
 * Presses: 1 load balancer + instances, 2 cache + queue | 3 Retry, 4 Circuit Breaker, 5 Fallback.
 */
const A = { W: 626, RY: 68, NS: 52, PY: 134, PER: 4.4 }
const A_X = { cl: 70, lb: 210, ca: 350, qu: 490 }
const A_INST = [426, 490, 554]
const A_PAT: { x: number; icon: Ico3DName; label: string; loop: Loop }[] = [
  { x: 92, icon: I('stopwatch'), label: 'Retry', loop: 'tilt' },
  { x: 212, icon: I('breaker'), label: 'Circuit Breaker', loop: 'beat' },
  { x: 332, icon: 'webpage', label: 'Fallback', loop: 'float' },
]
const A_H = A.NS / 2
const A_WIRES: Pt[][] = [
  [[A_X.cl + A_H, A.RY], [A_X.lb - A_H, A.RY]],
  [[A_X.lb + A_H, A.RY], [A_X.ca - A_H, A.RY]],
  [[A_X.ca + A_H, A.RY], [A_X.qu - A_H, A.RY]],
  [[A_X.qu, A.RY + A_H], [A_X.qu, A.PY]],
]
const A_RIDE = A_WIRES.map((pts, i) => K.ride(`t19w${i}`, pts, 0.15 + i * 0.95, 0.85 + i * 0.95, A.PER))

const E_T19: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 2 }, 1700)
  const H = Number(p.h) || (p.from ? 400 : 360) // the slide's figH (the points layout does not pass it)
  const panelB = H - 20
  const rowY = Math.round((A.PY + 44 + panelB) / 2) - 8 // the card's content row, below its title
  const litLB = hot === 0
  const litCQ = hot === 1
  return (
    <Frame w={A.W} h={H}>
      {A_WIRES.map((pts, i) => <W key={i} pts={pts} head={9} lit={(i === 0 && litLB) || (i > 0 && litCQ)} />)}
      <Node x={A_X.cl} y={A.RY} icon="laptop" label="Client" up d={0.1} />
      <Node x={A_X.lb} y={A.RY} mark={elbMark} label="Load Balancer" up lit={litLB} />
      <Node x={A_X.ca} y={A.RY} icon="bolt" label="Cache" up lit={litCQ} loop="pulse" d={0.4} />
      <Node x={A_X.qu} y={A.RY} icon={I('queue')} label="Queue" up lit={litCQ} loop="float" d={0.8} />

      {/* the service: its instances, and the three patterns attached to it */}
      <Panel x={20} y={A.PY} w={A.W - 40} h={panelB - A.PY} />
      <div style={{ ...box(40, A.PY + 20, 200, 24), zIndex: 3, display: 'flex', alignItems: 'center' }}>
        <span style={{ ...heading(16) }}>Service</span>
      </div>
      {A_INST.map((x, i) => (
        <Node key={x} x={x} y={rowY} icon="server" size={52} label={i === 1 ? 'Instances' : undefined} lit={litLB} d={i * 0.35} />
      ))}
      {A_PAT.map((pt, i) => (
        <div key={pt.label}>
          <Slot x={pt.x} y={rowY} on={!s(3 + i)} />
          <Node x={pt.x} y={rowY} icon={pt.icon} label={pt.label} on={s(3 + i)} lit={hot === 2 + i} loop={pt.loop} d={i * 0.4} />
        </div>
      ))}

      {A_RIDE.map((c, i) => <Token key={i} cls={c} />)}
    </Frame>
  )
}

/* ================================================================== slide 43 · E_T20 · horizontal scaling */

/*
 * 586 x 360. Load Balancer (293, 46), its tag to the right. The fan-out bus y 100 drops to the servers (y 160): first
 * the one large server (233), then three identical ones (113, 233, 353) and, after the failure, the new one (473). The
 * state bus y 228 gathers the live servers into the shared database (293, 284).
 * Presses: 1 the large server gives way to three, 2 server 353 fails (grey, orange cross) and 473 arrives, 3 shared state.
 */
const B = { W: 586, H: 360, LX: 293, LY: 46, NS: 52, BUS: 100, SY: 160, SS: 52, DB: 228, DX: 293, DY: 284, PER: 3.6 }
const B_SX = [113, 233, 353, 473]
const bDrop = (x: number, endY = B.SY - B.SS / 2): Pt[] => (x === B.LX ? [[B.LX, B.LY + B.NS / 2], [x, endY]] : [[B.LX, B.LY + B.NS / 2], [B.LX, B.BUS], [x, B.BUS], [x, endY]])
const bUp = (x: number): Pt[] => (x === B.DX ? [[x, B.SY + B.SS / 2], [x, B.DY - 28]] : [[x, B.SY + B.SS / 2], [x, B.DB], [B.DX, B.DB], [B.DX, B.DY - 28]])
const B_BIG = 92
const B_REQ_OLD = [0, 1, 2].map((i) => K.ride(`t20o${i}`, bDrop(B_SX[i]), 0.1 + i * 1.1, 1.0 + i * 1.1, B.PER))
const B_REQ_NEW = [0, 1, 3].map((k, i) => K.ride(`t20n${i}`, bDrop(B_SX[k]), 0.1 + i * 1.1, 1.0 + i * 1.1, B.PER))
const B_REQ_BIG = K.ride('t20b', bDrop(B.LX, B.SY - B_BIG / 2), 0.2, 1.0, 1.8)
const B_STATE = [0, 1, 3].map((k, i) => K.ride(`t20s${i}`, bUp(B_SX[k]), 0.6 + i * 1.1, 1.5 + i * 1.1, B.PER))

const E_T20: Fig = (p) => {
  const { hot, s, held } = useBuild({ ...p, steps: p.steps ?? 3 }, 1700)
  const failed = s(2)
  return (
    <Frame w={B.W} h={B.H}>
      <Node x={B.LX} y={B.LY} mark={elbMark} label="Load Balancer" right />

      {/* step 0: one large server; press 1: it gives way to three identical ones */}
      <W pts={bDrop(B.LX, B.SY - B_BIG / 2)} on={!s(1)} head={9} />
      <Node x={B.LX} y={B.SY} icon="server" size={B_BIG} k={0.7} on={!s(1)} loop="bob" />
      {[0, 1].map((i) => <W key={i} pts={bDrop(B_SX[i])} on={s(1)} head={9} lit={hot === 0} delay={i * 120} />)}
      <W pts={bDrop(B_SX[2])} on={s(1) && !failed} head={9} lit={hot === 0} delay={240} />
      <W pts={bDrop(B_SX[2], B.SY - B.SS / 2 - 18)} on={failed} head={0} dash="5 6" opacity={0.6} />
      <W pts={bDrop(B_SX[3])} on={failed} head={9} lit={hot === 1} />
      <Junction x={B.LX} y={B.BUS} on={s(1)} lit={hot === 0} />
      {B_SX.slice(0, 3).map((x, i) => (
        <Node key={x} x={x} y={B.SY} icon="server" size={B.SS} on={s(1)} lit={hot === 0 && !(i === 2 && failed)} dim={i === 2 && failed} delay={i * 120} d={i * 0.4}>
        </Node>
      ))}
      <XMark x={B_SX[2]} y={B.SY - B.SS / 2 - 14} on={failed} size={22} />
      <Node x={B_SX[3]} y={B.SY} icon="server" size={B.SS} on={failed} lit={hot === 1} d={1.2}>
        <Corner x={B.SS - 4} y={4} icon="refresh" size={26} loop="spin" />
      </Node>

      {/* press 3: the shared state every instance reads and writes */}
      {[0, 1, 3].map((k, i) => <W key={k} pts={bUp(B_SX[k])} on={s(3)} head={9} lit={hot === 2} delay={i * 120} />)}
      <Junction x={B.DX} y={B.DB} on={s(3)} lit={hot === 2} />
      <Node x={B.DX} y={B.DY} icon="database" size={56} w={180} label="Externalized State" on={s(3)} lit={hot === 2} loop="pulse" t={3} />

      {!held && (s(1) ? (failed ? B_REQ_NEW : B_REQ_OLD).map((c, i) => <Token key={c} cls={c} on={i >= 0} />) : <Token cls={B_REQ_BIG} />)}
      {B_STATE.map((c) => <Token key={c} cls={c} on={s(3)} size={8} />)}
    </Frame>
  )
}

/* ================================================================== slide 44 · E_T20B · Auto Scaling group */

/*
 * 606 x 380. Left column: Auto Scaling (76, 70) and Elastic Load Balancing (76, 192). The Auto Scaling group frame
 * (AWS convention: orange dashed, its icon top-left) x 160..586, y 20..230; four instance slots (250, 340, 430, 520) at
 * y 128, fed from below by the load balancer's bus (y 192). The cost card x 20..586, y 250..360: the instance-hour coin
 * stack and the fault-isolation shield. Presses: 1 the group adds an instance, 2 cost and isolation.
 * Loop: the fourth instance (and its coin) scale out and back in.
 */
const C = { W: 606, H: 380, LX: 76, AY: 70, EY: 192, NS: 52, FX: 160, FY: 20, FR: 586, FB: 230, IY: 128, IS: 52, CY: 250, CB: 360, PER: 6 }
const C_IX = [250, 340, 430, 520]
const cBus = (x: number): Pt[] => [[C.LX + C.NS / 2, C.EY], [x, C.EY], [x, C.IY + C.IS / 2]]
const C_REQ = C_IX.map((x, i) => K.ride(`t20bq${i}`, cBus(x), 0.1 + i * 1.4, 1.2 + i * 1.4, C.PER))
const C_ADD = K.ride('t20ba', [[C.LX + C.NS / 2, C.AY], [C.FX, C.AY]], 0.3, 1.0, C.PER / 2)

/** the instance-hour coin stack: four coins, the top one comes and goes with the fourth instance */
function CoinStack({ lit, live }: { lit: boolean; live: boolean }) {
  return (
    <Plinth size={64} lit={lit}>
      <span style={{ position: 'relative', width: 40, height: 50, display: 'block' }}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i === 3 && live ? 's18e-out' : undefined} style={{ position: 'absolute', left: 4, top: 26 - i * 8, width: 32, height: 24, display: 'grid', placeItems: 'center' }}>
            <Ico3D name="coin" size={26} loop="none" />
          </span>
        ))}
      </span>
    </Plinth>
  )
}

const E_T20B: Fig = (p) => {
  const { hot, s, done, live } = useBuild({ ...p, steps: p.steps ?? 2 }, 2200)
  const instant = useInstant()
  const out = done && live ? 's18e-out' : undefined
  return (
    <Frame w={C.W} h={C.H}>
      {/* the Auto Scaling group frame, AWS's orange dashed group */}
      <div style={{ ...box(C.FX, C.FY, C.FR - C.FX, C.FB - C.FY), zIndex: 1, borderRadius: 6, border: `2px dashed ${hot === 0 ? ORANGE : '#ED7100'}`, background: 'rgba(237,113,0,0.035)', transition: instant ? 'none' : `border-color 420ms ${EASE}` }} />
      <div style={{ ...box(C.FX + 20, C.FY + 18, 260, 30), zIndex: 3, display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src={grpMark} alt="" aria-hidden draggable={false} style={{ width: 30, height: 30, display: 'block' }} />
        <span style={{ ...tag(15, colors.ink), fontWeight: 700 }}>Auto Scaling Group</span>
      </div>

      <W pts={[[C.LX + C.NS / 2, C.AY], [C.FX, C.AY]]} head={9} lit={hot === 0} />
      <Node x={C.LX} y={C.AY} mark={asgMark} label="Auto Scaling" w={130} lit={hot === 0} />
      <Node x={C.LX} y={C.EY} mark={elbMark} label="Load Balancer" w={130} />

      {C_IX.slice(0, 3).map((x, i) => <W key={x} pts={cBus(x)} head={9} delay={i * 100} />)}
      {C_IX.slice(0, 2).map((x) => <Junction key={x} x={x} y={C.EY} />)}
      <Junction x={C_IX[2]} y={C.EY} on={s(1)} />
      <W pts={cBus(C_IX[3])} head={9} on={s(1)} lit={hot === 0} cls={out} />
      {C_IX.slice(0, 3).map((x, i) => <Node key={x} x={x} y={C.IY} mark={ec2Mark} size={C.IS} />)}
      <Node x={C_IX[3]} y={C.IY} mark={ec2Mark} size={C.IS} on={s(1)} lit={hot === 0} cls={out}>
        <Corner x={C.IS - 4} y={4} icon="plus" size={24} loop="pulse" />
      </Node>

      {/* press 2: what scaling out costs, and what it buys */}
      <Panel x={20} y={C.CY} w={C.W - 40} h={C.CB - C.CY} on={s(2)} lit={false} />
      <Show on={s(2)} style={{ ...box(96, (C.CY + C.CB) / 2 - 32, 230, 64), zIndex: 3, display: 'flex', alignItems: 'center', gap: 14 }}>
        <CoinStack lit={hot === 1} live={done && live} />
        <span style={tag(15)}>Instance-Hour Cost</span>
      </Show>
      <Show on={s(2)} delay={160} style={{ ...box(356, (C.CY + C.CB) / 2 - 32, 200, 64), zIndex: 3, display: 'flex', alignItems: 'center', gap: 14 }}>
        <Plinth size={64} lit={hot === 1}><Ico3D name="shield" size={46} loop="glint" /></Plinth>
        <span style={tag(15)}>Fault Isolation</span>
      </Show>

      {C_REQ.map((c, i) => <Token key={c} cls={c} on={i < 3 || s(1)} />)}
      <Token cls={C_ADD} on={s(1)} size={9} />
    </Frame>
  )
}

/* ================================================================== slides 45-46 · E_T21 · caching and queues */

/*
 * 606 wide; H = 360 (T21) or 380 (T21-B). Two lane cards x 20..586, each L = (H - 60) / 2 tall. Top: Application (90),
 * Cache (303), Database (516): the request on y c-20, the Hit back on y c, the Store on y c+20; the Miss runs from the
 * Application over the cache to the Database on y MY (review 2026-11-20: the Miss is the application's, not the cache's).
 * Bottom: Producer (90) -> the queue (a tube of message slots, x 196..410) -> Consumer (516), each side at its own pace.
 * Presses: 1 cache-aside, 2 the queue lane | 3 the ElastiCache and SQS marks, 4 backend reads drop, producers keep sending.
 */
const D = { W: 606, NS: 52, AX: 90, CX: 303, DX: 516, TX0: 196, TX1: 410, TH: 56, PER: 4.8, MY: 34, G: 20 }
const D_SLOTS = [0, 1, 2, 3, 4]

const E_T21: Fig = (p) => {
  const { hot, s, held } = useBuild({ ...p, steps: p.steps ?? 2 }, 1800)
  const H = Number(p.h) || (p.from ? 380 : 360) // the slide's figH (the points layout does not pass it)
  const L = (H - 60) / 2
  const tY = 20 + L / 2 - 10
  const qTop = 40 + L
  const qY = qTop + L / 2 - 10
  const h = D.NS / 2
  const { req, hit, store, miss } = cachePaths(tY)
  const prod: Pt[] = [[D.AX + h, qY], [D.TX0, qY]]
  const cons: Pt[] = [[D.TX1, qY], [D.DX - h, qY]]
  const R = rides(H)
  const lit1 = hot === 0
  const lit2 = hot === 1
  const litMk = hot === 2
  const lit4 = hot === 3
  const live = !held
  return (
    <Frame w={D.W} h={H}>
      <Panel x={20} y={20} w={D.W - 40} h={L} />
      <Panel x={20} y={qTop} w={D.W - 40} h={L} />

      {/* cache-aside: check the cache first; a hit comes straight back, on a miss the application reads the database and stores the result in the cache */}
      <W pts={req} head={9} lit={lit1} />
      <W pts={hit} head={9} lit={lit1} />
      <W pts={store} head={9} lit={lit1} />
      <W pts={miss} head={9} lit={lit1} />
      <div style={{ ...box(PILL.hitX - 20, tY - 9, 40, 18), zIndex: 4, ...PILL.style }}>Hit</div>
      <div style={{ ...box(PILL.storeX - 28, tY + D.G - 9, 56, 18), zIndex: 4, ...PILL.style }}>Store</div>
      <div style={{ ...box((D.CX + D.DX) / 2 - 30, D.MY + 5, 60, 18), zIndex: 3, ...tag(14, colors.brandDark) }}>Miss</div>
      <Node x={D.AX} y={tY} icon="webpage" label="Application" lit={lit1} d={0.2}>
        <Corner x={2} y={2} icon="search" size={26} loop="tilt" />
      </Node>
      <Node x={D.CX} y={tY} icon="bolt" label="Cache" lit={lit1 || litMk} loop="pulse" d={0.5}>
        <Corner x={D.NS - 2} y={2} mark={cacheMark} size={30} on={s(3)} />
      </Node>
      <Node x={D.DX} y={tY} icon="database" label="Database" lit={lit1 || lit4} loop="bob" d={0.9}>
        <Corner x={D.NS - 2} y={2} icon="gauge" size={30} on={s(4)} loop="tilt" />
      </Node>

      {/* the queue lane: the producer sends in bursts, the consumer takes one at a time */}
      <W pts={prod} head={9} lit={lit2 || lit4} />
      <W pts={cons} head={9} lit={lit2 || lit4} />
      <Node x={D.AX} y={qY} icon="code" label="Producer" lit={lit2 || lit4} d={0.3} />
      <Node x={D.DX} y={qY} icon="server" label="Consumer" lit={lit2 || lit4} d={0.7} />
      <QueueTube y={qY} lit={lit2 || litMk} live={live} mark={s(3)} />

      {live && (
        <>
          <Token cls={R.req} />
          <Token cls={R.hit} />
          <Token cls={R.req2} />
          <Token cls={R.miss} />
          <Token cls={R.store} />
          {R.prod.map((c) => <Token key={c} cls={c} size={9} />)}
          {R.cons.map((c) => <Token key={c} cls={c} size={9} />)}
        </>
      )}
    </Frame>
  )
}

function QueueTube({ y, lit, live, mark }: { y: number; lit: boolean; live: boolean; mark: boolean }) {
  const instant = useInstant()
  const top = y - D.TH / 2
  return (
    <>
      <div data-fk="card" style={{ ...box(D.TX0, top, D.TX1 - D.TX0, D.TH), zIndex: 3, borderRadius: 16, background: '#FFFFFF', boxShadow: lit ? LIT : RIM, transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
        <span style={{ position: 'absolute', left: 14, top: (D.TH - 40) / 2 }}>
          <Plinth size={40}><Ico3D name={I('queue')} size={30} loop="float" /></Plinth>
        </span>
        {D_SLOTS.map((i) => (
          <span key={i} className={live ? `s18e-q s18e-q${i}` : undefined} style={{ position: 'absolute', left: 70 + i * 26, top: (D.TH - 26) / 2, width: 20, height: 26, borderRadius: 6, background: 'linear-gradient(180deg, #5C8BFF 0%, #2D63FB 100%)', boxShadow: '0 4px 8px -4px rgba(31,64,140,0.6)' }} />
        ))}
      </div>
      <div style={{ ...box(D.TX0, top + D.TH + 6, D.TX1 - D.TX0, 18), zIndex: 3, ...tag(14) }}>Queue</div>
      <Corner x={D.TX0 + 14 + 40 - 2} y={top + (D.TH - 40) / 2 + 2} mark={sqsMark} size={28} on={mark} z={7} />
    </>
  )
}

/* the cache lane's wires for a lane centre tY: request and Store go right, Hit comes back between them; the Miss leaves
   the Application's top, runs over the cache on y MY and drops into the Database's top */
function cachePaths(tY: number) {
  const h = D.NS / 2
  const req: Pt[] = [[D.AX + h, tY - D.G], [D.CX - h, tY - D.G]]
  const hit: Pt[] = [[D.CX - h, tY], [D.AX + h, tY]]
  const store: Pt[] = [[D.AX + h, tY + D.G], [D.CX - h, tY + D.G]]
  const miss: Pt[] = [[D.AX, tY - h], [D.AX, D.MY], [D.DX, D.MY], [D.DX, tY - h]]
  return { req, hit, store, miss }
}
/* the Hit and Store tags sit on their wires as white pills, staggered so the two never touch */
const PILL = { hitX: 168, storeX: 236, style: { ...tag(14, colors.brandDark), background: '#FFFFFF', borderRadius: 6 } as CSSProperties }

/* the rides depend on the lane height, so they are made per height (once each) */
const RIDES: Record<number, ReturnType<typeof makeRides>> = {}
function makeRides(H: number) {
  const L = (H - 60) / 2
  const tY = 20 + L / 2 - 10
  const qY = 40 + L + L / 2 - 10
  const h = D.NS / 2
  const k = `t21h${H}`
  const cp = cachePaths(tY)
  return {
    req: K.ride(`${k}r1`, cp.req, 0.1, 0.8, D.PER),
    hit: K.ride(`${k}h`, cp.hit, 1.0, 1.7, D.PER),
    req2: K.ride(`${k}r2`, cp.req, 2.1, 2.7, D.PER),
    miss: K.ride(`${k}m`, cp.miss, 2.8, 3.9, D.PER),
    store: K.ride(`${k}s`, cp.store, 4.0, 4.6, D.PER),
    prod: [0, 1, 2].map((i) => K.ride(`${k}p${i}`, [[D.AX + h, qY], [D.TX0, qY]], 0.1 + i * 0.45, 0.6 + i * 0.45, D.PER)),
    cons: [0, 1].map((i) => K.ride(`${k}c${i}`, [[D.TX1, qY], [D.DX - h, qY]], 0.6 + i * 2.2, 1.6 + i * 2.2, D.PER)),
  }
}
const rides = (H: number) => (RIDES[H] ??= makeRides(H))
;[360, 380, 400].forEach(rides)

export const figures: Record<string, Fig> = { E_T19, E_T20, E_T20B, E_T21 }

/* loop keyframes (transform / opacity only, on HTML elements) */
const pc = (v: number) => `${v.toFixed(2)}%`
/* the queue's five message slots: fill from the back during the producer's burst, drain from the front at the consumer's pace */
const QK = D_SLOTS.map((i) => {
  const inAt = 4 + (4 - i) * 7 // the front slot (4) fills first
  const outAt = 46 + (4 - i) * 10 // and leaves first
  return `@keyframes s18e-q${i} { 0%, ${pc(inAt)} { opacity: 0.12; transform: scale(0.8) } ${pc(inAt + 5)}, ${pc(outAt)} { opacity: 1; transform: scale(1) } ${pc(outAt + 6)}, 100% { opacity: 0.12; transform: scale(0.8) } }
.s18e-q${i} { animation: s18e-q${i} ${D.PER * 2}s cubic-bezier(0.45,0,0.55,1) infinite; }`
}).join('\n')

export const css = `
${QK}
@keyframes s18e-out { 0%, 42% { opacity: 1; transform: scale(1) } 52%, 78% { opacity: 0; transform: scale(0.86) } 88%, 100% { opacity: 1; transform: scale(1) } }
.s18e-out { animation: s18e-out ${C.PER}s cubic-bezier(0.45,0,0.55,1) infinite; }
${K.css()}
.cc-still .s18e-q, .deck-thumb .s18e-q, .cc-still .s18e-out, .deck-thumb .s18e-out { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .s18e-q, .s18e-out { animation: none !important; } }
`
void FONT
