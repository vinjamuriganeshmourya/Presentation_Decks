import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Badge, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, Frame, Show, Plinth, MarkTile, Panel, Wire, Junction, Token, keyframes, loopCls, loopVars, tag, heading, useHeld, useHot, type Pt } from '@/engine/figkit'
import elbMark from '../images/aws-elastic-load-balancing.svg'
import alarmMark from '../images/res-cloudwatch-alarm.svg'
import asgMark from '../images/grp-auto-scaling-group.svg'
import regionMark from '../images/grp-region.svg'
import fisMark from '../images/aws-fault-injection-service.svg'

/*
 * SESSION 18 · SECTION 1 (Cloud-Native Principles) technical figures, builder A.
 * Built to generate-slides standing correction 17 (Sessions 14, 15, 16): 3D icons on plinth tiles, official marks on
 * white tiles, >= 20 px equal padding, orthogonal wires computed from the same constants as the boxes, a flow dot on
 * every wire, a lit item walking first -> last -> first after the build. Loops are transform / opacity on HTML elements
 * (or a root svg) only. Held (?still): the full final state, nothing lit, nothing moving. Class prefix `t18a-`.
 *
 *   slide 6  A_T01   546 x 350  three principle cards wired into the Cloud-Native Application (3)
 *   slide 8  A_T02   546 x 320  demand curve over an Auto Scaling group behind Elastic Load Balancing (3)
 *   slide 9  A_T02B  566 x 320  stateless copies against a stateful database whose copy waits on sync (2)
 *   slide 10 A_T03   546 x 340  a Region, two Availability Zones, failover and bulkhead compartments (2)
 *   slide 11 A_T03B  566 x 340  a component map, the blast radius, Fault Injection Service (2)
 *   slide 12 A_T04   546 x 300  the replace cycle, Infrastructure as Code, independent deploys (3)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('t18a')
const BLUE = colors.brand
const TEAL = '#00A4A6'
const TEAL_INK = '#00787A'
const ASG = '#ED7100'
const ASG_INK = '#B45200'
const RIM = 'inset 0 0 0 1.5px #D3DEF6, 0 10px 20px -12px rgba(31,64,140,0.5)'
const LIT = `inset 0 0 0 2.5px ${ORANGE}, 0 10px 22px -12px rgba(255,138,61,0.7)`

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)
const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })
const cv = (name: string, v: string) => ({ [name]: v }) as CSSProperties
const tr = (instant: boolean, what = 'opacity', ms = 520) => (instant ? 'none' : `${what} ${ms}ms ${EASE}`)

/** the build: the step, the lit item, held */
function useBuild(p: Record<string, unknown>, period: number) {
  const off = Number(p.from ?? 0)
  const cnt = Number(p.steps ?? 1)
  const held = useHeld()
  const step = held ? off + cnt : stepOf(p) + off
  /* figkit's walk starts at item 0 the moment the build ends, so the last press would light the FIRST item; start the
     walk on the last item instead (last -> first -> ... -> last), so the final press lights what it built */
  const raw = useHot(cnt, stepOf(p), period)
  const local = raw >= 0 && stepOf(p) >= cnt ? (raw + cnt - 1) % cnt : raw
  const hot = local < 0 ? -1 : local + off
  return { step, hot, held, s: (n: number) => step >= n, live: !held, done: step >= off + cnt }
}

/** a 3D icon (or an official mark) on its plinth with its tag under (or above) it; the TILE is centred on (x, y) */
function Node({ x, y, label, icon, mark, size = 52, k = 0.74, on = true, lit = false, warm = false, loop = 'bob', d = 0, t, badge, w = 120, tagSize = 14, dim = false, up = false, delay = 0, z = 3, wrap, cls, children }: { x: number; y: number; label?: string; icon?: Ico3DName; mark?: string; size?: number; k?: number; on?: boolean; lit?: boolean; warm?: boolean; loop?: Loop; d?: number; t?: number; badge?: Badge; w?: number; tagSize?: number; dim?: boolean; up?: boolean; delay?: number; z?: number; wrap?: number; cls?: string; children?: ReactNode }) {
  const instant = useInstant()
  const tile = mark ? <MarkTile src={mark} size={size} lit={lit} /> : (
    <Plinth size={size} lit={lit} warm={warm}>
      <Ico3D name={icon ?? 'doc'} size={Math.round(size * k)} loop={loop} d={d} t={t} badge={badge} />
    </Plinth>
  )
  const lab = label ? <span style={{ ...tag(tagSize), ...(wrap ? { whiteSpace: 'normal', width: wrap } : {}), [up ? 'marginBottom' : 'marginTop']: 6 }}>{label}</span> : null
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, width: w, zIndex: z, display: 'flex', flexDirection: up ? 'column-reverse' : 'column', alignItems: 'center', ...(up ? { bottom: `calc(100% - ${y + size / 2}px)` } : { top: y - size / 2 }) }}>
      <div className={cls} style={{ position: 'relative', width: size, height: size, display: 'grid', placeItems: 'center' }}>
        <div style={{ display: 'grid', placeItems: 'center', opacity: dim ? 0.42 : 1, filter: dim ? 'grayscale(1)' : undefined, transition: instant ? 'none' : `opacity 520ms ${EASE}, filter 520ms ${EASE}` }}>{tile}</div>
        {children}
      </div>
      {lab}
    </Show>
  )
}

/** the orange cross (failed / blocked): an orange disc with a white cross, never the red engine one */
function XMark({ size = 24, style, cls }: { size?: number; style?: CSSProperties; cls?: string }) {
  return (
    <span aria-hidden className={cls} style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: 'radial-gradient(circle at 35% 30%, #FFC9A0 0%, #FF8A3D 48%, #E8642A 100%)', boxShadow: '0 0 0 2.5px #FFFFFF, 0 4px 10px -4px rgba(180,70,26,0.8)', ...style }}>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 10 10" style={{ display: 'block' }}>
        <path d="M 2 2 L 8 8 M 8 2 L 2 8" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" />
      </svg>
    </span>
  )
}

/** a white disc on a tile's corner holding a 3D icon, or the orange cross; centred on (x, y) of the frame */
function Corner({ x, y, on = true, size = 26, icon, cross = false, loop = 'beat', d = 0, cls, z = 6 }: { x: number; y: number; on?: boolean; size?: number; icon?: Ico3DName; cross?: boolean; loop?: Loop; d?: number; cls?: string; z?: number }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: z, opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}` }}>
      <span className={cls} style={{ display: 'grid', placeItems: 'center', width: size, height: size }}>
        {cross ? <XMark size={size} /> : (
          <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6' }}>
            <Ico3D name={icon ?? 'check'} size={size - 6} loop={loop} d={d} t={2.4} />
          </span>
        )}
      </span>
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

/* ================================================================== slide 6 · A_T01 · three core principles */

/*
 * 546 x 350. Three cards on the left (x 20..290, h 94, 14 apart from y 20): Elasticity (server, a fleet of slabs that
 * grows and shrinks), Failure Tolerance (shield with a heartbeat, a pulse trace), Ease Of Change (refresh, a rolling
 * update across four slabs). Each card's right edge (290, cy) runs on an elbow through x 320 into the Cloud-Native
 * Application card (x 350..526, y 80..270) at y 125 / 175 / 225. Point N builds and lights card N and its wire.
 */
const A = { W: 546, H: 350, CX: 20, CR: 290, CH: 94, G: 14, Y0: 20, BX: 350, BR: 526, BY: 80, BH: 190, BUS: 320, PER: 3.6 }
const A_CY = [0, 1, 2].map((i) => A.Y0 + i * (A.CH + A.G) + A.CH / 2)
const A_EY = [125, 175, 225]
const aWire = (i: number): Pt[] => (A_CY[i] === A_EY[i] ? [[A.CR, A_CY[i]], [A.BX, A_EY[i]]] : [[A.CR, A_CY[i]], [A.BUS, A_CY[i]], [A.BUS, A_EY[i]], [A.BX, A_EY[i]]])
const A_DOTS = [0, 1, 2].map((i) => K.ride(`t01w${i}`, aWire(i), 0.2 + i * 1.1, 1.2 + i * 1.1, A.PER))
const A_CARDS: { icon: Ico3DName; label: string; loop: Loop; corner?: Ico3DName }[] = [
  { icon: 'server', label: 'Elasticity', loop: 'bob' },
  { icon: 'shield', label: 'Failure Tolerance', loop: 'pulse', corner: 'heartbeat' },
  { icon: 'refresh', label: 'Ease Of Change', loop: 'spin' },
]
/* the pulse trace inside card 2 (card-local, then offset into the frame for its dot) */
const ECG_X = A.CX + 86
const ECG_Y = A_CY[1] + 6
const ECG: Pt[] = [[0, 12], [30, 12], [38, 4], [46, 22], [54, 0], [62, 18], [70, 12], [134, 12]]
const ECG_RIDE = K.ride('t01ecg', ECG.map(([x, y]) => [ECG_X + x, ECG_Y + y] as Pt), 0.1, 1.9, 2.4, 1)

/** card 1's fleet: five slabs, the last three come and go */
function Fleet({ live }: { live: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[0, 1, 2, 3, 4].map((k) => (
        <span key={k} className={live && k >= 2 ? `t18a-l t18a-g${k}` : undefined} style={{ width: 22, height: 18, borderRadius: 5, background: 'linear-gradient(180deg, #5C8BFF 0%, #2D63FB 100%)', boxShadow: '0 4px 8px -5px rgba(31,64,140,0.8)', display: 'flex', alignItems: 'center', gap: 2, padding: '0 4px' }}>
          <span style={{ width: 4, height: 4, borderRadius: 99, background: '#7CF0B0' }} />
          <span style={{ flex: 1, height: 3, borderRadius: 2, background: '#BFD3FF' }} />
        </span>
      ))}
    </div>
  )
}

/** card 3's rolling update: four slabs turn from the old grey to the new blue one after another */
function Rolling({ live }: { live: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {[0, 1, 2, 3].map((k) => (
        <span key={k} style={{ position: 'relative', width: 28, height: 18, borderRadius: 5, background: '#C9D3E3', boxShadow: '0 4px 8px -5px rgba(31,64,140,0.6)' }}>
          <span className={live ? `t18a-l t18a-r${k}` : undefined} style={{ position: 'absolute', inset: 0, borderRadius: 5, background: 'linear-gradient(180deg, #5C8BFF 0%, #2D63FB 100%)' }} />
        </span>
      ))}
    </div>
  )
}

/** the cloud holding an app window */
function CloudApp({ live }: { live: boolean }) {
  return (
    <svg aria-hidden className={live ? 't18a-l t18a-float' : undefined} width={150} height={100} viewBox="0 0 150 100" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="t18a-cl" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F4F8FF" />
          <stop offset="1" stopColor="#CFDFFF" />
        </linearGradient>
        <linearGradient id="t18a-bar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4F7FFF" />
          <stop offset="1" stopColor="#2D63FB" />
        </linearGradient>
      </defs>
      <path d="M 34 92 C 14 92 4 80 6 66 C 8 54 18 47 30 48 C 30 28 46 14 66 16 C 80 6 104 8 114 24 C 132 22 146 36 144 54 C 152 62 150 92 120 92 Z" transform="translate(0 4)" fill="#B9CEFB" opacity={0.55} />
      <path d="M 34 92 C 14 92 4 80 6 66 C 8 54 18 47 30 48 C 30 28 46 14 66 16 C 80 6 104 8 114 24 C 132 22 146 36 144 54 C 152 62 150 92 120 92 Z" fill="url(#t18a-cl)" stroke="#B9CEFB" strokeWidth={1.5} />
      <rect x={42} y={38} width={68} height={46} rx={6} fill="#FFFFFF" stroke="#C5D5F5" strokeWidth={1.2} />
      <path d="M 42 44 a 6 6 0 0 1 6 -6 h 56 a 6 6 0 0 1 6 6 v 6 h -68 Z" fill="url(#t18a-bar)" />
      {[49, 55, 61].map((x) => <circle key={x} cx={x} cy={44} r={1.8} fill="#FFFFFF" />)}
      <rect x={49} y={56} width={22} height={21} rx={3} fill="#DDE8FF" />
      <rect x={76} y={57} width={27} height={4} rx={2} fill="#9DB6EE" />
      <rect x={76} y={65} width={20} height={4} rx={2} fill="#C5D5F5" />
      <rect x={76} y={73} width={24} height={4} rx={2} fill="#C5D5F5" />
    </svg>
  )
}

const A_T01: Fig = (p) => {
  const { hot, s, live } = useBuild({ ...p, steps: p.steps ?? 3 }, 1800)
  return (
    <Frame w={A.W} h={A.H}>
      {A_CARDS.map((c, i) => {
        const y0 = A.Y0 + i * (A.CH + A.G)
        return (
          <div key={c.label}>
            <Panel x={A.CX} y={y0} w={A.CR - A.CX} h={A.CH} on={s(i + 1)} lit={hot === i} />
            <Show on={s(i + 1)} delay={120} style={{ ...box(A.CX + 20, y0 + 21, 52, 52), zIndex: 3 }}>
              <Plinth size={52} lit={hot === i}><Ico3D name={c.icon} size={38} loop={c.loop} t={c.loop === 'spin' ? 6 : undefined} d={i * 0.4} /></Plinth>
            </Show>
            {c.corner && <Corner x={A.CX + 20 + 48} y={y0 + 21 + 4} icon={c.corner} size={24} on={s(i + 1)} loop="beat" />}
            <Show on={s(i + 1)} delay={180} style={{ ...box(A.CX + 86, y0 + 20, 164, 54), zIndex: 3, display: 'flex', flexDirection: 'column', gap: 9 }}>
              <span style={{ ...heading(16), whiteSpace: 'nowrap' }}>{c.label}</span>
              {i === 0 && <Fleet live={live} />}
              {i === 1 && (
                <svg aria-hidden width={134} height={24} style={{ display: 'block', overflow: 'visible' }}>
                  <polyline points={ECG.map(([x, y]) => `${x},${y}`).join(' ')} fill="none" stroke={BLUE} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
                </svg>
              )}
              {i === 2 && <Rolling live={live} />}
            </Show>
            <W pts={aWire(i)} on={s(i + 1)} lit={hot === i} delay={200} />
          </div>
        )
      })}

      <Panel x={A.BX} y={A.BY} w={A.BR - A.BX} h={A.BH} />
      <div style={{ ...box(A.BX, A.BY + 20, A.BR - A.BX, A.BH - 40), zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <CloudApp live={live} />
        <span style={{ ...heading(16), textAlign: 'center' }}>Cloud-Native<br />Application</span>
      </div>

      {A_DOTS.map((c, i) => <Token key={i} cls={c} on={s(i + 1)} size={9} />)}
      <Token cls={ECG_RIDE} on={s(2)} size={8} />
    </Frame>
  )
}

/* ================================================================== slide 8 · A_T02 · scaling as default */

/*
 * 546 x 320. Top: the traffic timeline (x 20..526, y 20..140): the demand curve across the plot (x 44..440, baseline
 * 120), the alarm threshold (y 74) ending at the CloudWatch alarm mark (484, 74), and (press 3) the forecast, the same
 * curve 40 px ahead, dashed. Bottom: Elastic Load Balancing (70, 214) on a bus along y 214 into the Auto Scaling group
 * (orange dashed frame x 134..526, y 164..300, its mark in the corner) dropping into five instances (y 256). Two run at
 * the start; press 1 attaches the third, press 2 the alarm adds the fourth, press 3 the forecast adds the fifth.
 * After the build a dot rides the demand curve and the fourth and fifth instances come and go with it.
 */
const B = { W: 546, H: 320, PX: 20, PY: 20, PW: 506, PH: 120, X0: 44, X1: 440, BASE: 120, TH: 74, AX: 484, LX: 70, LY: 214, LS: 52, FX: 134, FY: 164, FR: 526, FB: 300, IY: 256, IS: 48, AHEAD: 40, PER: 6 }
const B_IX = [178, 254, 330, 406, 482]
const B_SEG: [Pt, Pt, Pt, Pt][] = [
  [[44, 112], [120, 112], [150, 110], [190, 100]],
  [[190, 100], [230, 88], [240, 50], [290, 44]],
  [[290, 44], [330, 40], [350, 70], [380, 96]],
  [[380, 96], [400, 110], [420, 112], [440, 112]],
]
const bez = (s: [Pt, Pt, Pt, Pt], t: number): Pt => {
  const u = 1 - t
  const f = (k: 0 | 1) => u * u * u * s[0][k] + 3 * u * u * t * s[1][k] + 3 * u * t * t * s[2][k] + t * t * t * s[3][k]
  return [f(0), f(1)]
}
const B_PTS: Pt[] = B_SEG.flatMap((s, i) => Array.from({ length: 24 }, (_, k) => bez(s, (k + (i === 0 ? 0 : 1)) / 24)).slice(0, i === 0 ? 25 : 24))
const B_D = `M ${B_SEG[0][0].join(' ')} ` + B_SEG.map((s) => `C ${s[1].join(' ')}, ${s[2].join(' ')}, ${s[3].join(' ')}`).join(' ')
/** x where the demand curve crosses the threshold going up and coming down */
const B_UP = B_PTS.find((q, i) => i > 0 && q[1] <= B.TH && B_PTS[i - 1][1] > B.TH)?.[0] ?? 236
const B_DOWN = B_PTS.find((q, i) => i > 0 && q[1] >= B.TH && B_PTS[i - 1][1] < B.TH)?.[0] ?? 352
const B_RUN = 0.86 // the dot rides the curve over this share of the period
const frac = (x: number) => ((x - B.X0) / (B.X1 - B.X0)) * B_RUN
const bWire = (x: number): Pt[] => [[B.LX + B.LS / 2, B.LY], [x, B.LY], [x, B.IY - B.IS / 2]]
const B_REQ = B_IX.map((x, i) => K.ride(`t02r${i}`, bWire(x), 0.3 + i * 0.5, 1.5 + i * 0.5, 3.6))

const B_T02: Fig = (p) => {
  const { hot, s, live, done } = useBuild({ ...p, steps: p.steps ?? 3 }, 2000)
  const instant = useInstant()
  const run = live && done
  return (
    <Frame w={B.W} h={B.H}>
      {/* the traffic timeline */}
      <Panel x={B.PX} y={B.PY} w={B.PW} h={B.PH} />
      <svg aria-hidden width={B.W} height={B.H} style={{ position: 'absolute', left: 0, top: 0, zIndex: 3, overflow: 'visible', pointerEvents: 'none' }}>
        <defs>
          <linearGradient id="t18a-dem" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={BLUE} stopOpacity={0.22} />
            <stop offset="1" stopColor={BLUE} stopOpacity={0.02} />
          </linearGradient>
          <clipPath id="t18a-plot"><rect x={B.X0} y={B.PY + 10} width={B.X1 - B.X0} height={B.BASE - B.PY - 10} /></clipPath>
        </defs>
        <line x1={B.X0} y1={B.BASE} x2={B.X1} y2={B.BASE} stroke="#C9D7F2" strokeWidth={2} strokeLinecap="round" />
        <path d={`${B_D} L ${B.X1} ${B.BASE} L ${B.X0} ${B.BASE} Z`} fill="url(#t18a-dem)" />
        <path d={B_D} fill="none" stroke={BLUE} strokeWidth={3} strokeLinecap="round" />
        <g clipPath="url(#t18a-plot)" style={{ opacity: s(3) ? 1 : 0, transition: tr(instant) }}>
          <path d={B_D} transform={`translate(${-B.AHEAD} 0)`} fill="none" stroke={hot === 2 ? ORANGE : colors.brandDark} strokeWidth={2.4} strokeDasharray="7 6" strokeLinecap="round" opacity={0.75} />
          <path d={`M ${B.X1 - B.AHEAD} 112 L ${B.X1} 112`} fill="none" stroke={hot === 2 ? ORANGE : colors.brandDark} strokeWidth={2.4} strokeDasharray="7 6" strokeLinecap="round" opacity={0.75} />
        </g>
        <line x1={B.X0} y1={B.TH} x2={B.AX - 22} y2={B.TH} stroke={hot === 1 ? ORANGE : '#8FA3C4'} strokeWidth={2} strokeDasharray="5 5" style={{ opacity: s(2) ? 1 : 0.55, transition: tr(instant) }} />
        <circle cx={B_UP} cy={B.TH} r={5.5} fill={ORANGE} stroke="#FFFFFF" strokeWidth={2} style={{ opacity: s(2) ? 1 : 0, transition: tr(instant) }} />
      </svg>
      <span style={{ ...box(372, B.TH - 24, 80, 18), ...tag(14, colors.muted), zIndex: 3, textAlign: 'right' }}>Threshold</span>
      <Show on={s(3)} style={{ ...box(B.X0, 34, 150, 32), zIndex: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Plinth size={32} lit={hot === 2}><Ico3D name="chart" size={24} loop="bob" /></Plinth>
        <span style={tag(14, colors.brandDark)}>Forecast</span>
      </Show>
      <div style={{ ...box(B.AX - 22, B.TH - 22, 44, 44), zIndex: 4 }}>
        {s(2) && live && <span aria-hidden className={loopCls('ripple')} style={{ position: 'absolute', inset: -6, borderRadius: 20, boxShadow: `0 0 0 2.5px ${ORANGE}88`, ...loopVars(0, 2.2) }} />}
        <MarkTile src={alarmMark} size={44} lit={hot === 1} />
      </div>
      {run && <span aria-hidden className="t18a-l t18a-dot" style={{ position: 'absolute', left: -7, top: -7, width: 14, height: 14, borderRadius: 99, background: BLUE, boxShadow: `0 0 0 4px ${BLUE}30, 0 0 0 2px #FFFFFF inset`, zIndex: 5 }} />}

      {/* the Auto Scaling group, as AWS draws it */}
      <div aria-hidden style={{ ...box(B.FX, B.FY, B.FR - B.FX, B.FB - B.FY), zIndex: 1, borderRadius: 4, border: `2px dashed ${ASG}`, background: 'rgba(237,113,0,0.035)' }} />
      <img src={asgMark} alt="" aria-hidden draggable={false} style={{ ...box(B.FX, B.FY, 32, 32), zIndex: 3, display: 'block' }} />
      <span style={{ ...box(B.FX + 40, B.FY + 7, 200, 18), ...tag(14, ASG_INK), textAlign: 'left', zIndex: 3 }}>Auto Scaling Group</span>

      {/* Elastic Load Balancing on its bus into the group's target group */}
      {B_IX.map((x, i) => {
        const on = i < 2 || s(i - 1)
        return <W key={i} pts={bWire(x)} on={on} lit={hot === i - 2} head={8} delay={i >= 2 ? 150 : 0} />
      })}
      {B_IX.slice(0, 4).map((x, i) => <Junction key={x} x={x} y={B.LY} on={i < 1 || s(i)} lit={hot === i - 1} />)}
      <Node x={B.LX} y={B.LY} mark={elbMark} size={B.LS} w={110} label="Load Balancer" lit={hot === 0} />
      {B_IX.map((x, i) => (
        <Node key={x} x={x} y={B.IY} icon="server" size={B.IS} on={i < 2 || s(i - 1)} lit={hot === i - 2} d={i * 0.3} badge={i >= 2 ? 'plus' : undefined} cls={run && i >= 3 ? `t18a-l t18a-i${i}` : undefined} delay={150} />
      ))}

      {B_REQ.map((c, i) => <Token key={i} cls={c} on={(i < 2 || s(i - 1)) && !(run && i >= 3)} size={9} />)}
    </Frame>
  )
}

/* ================================================================== slide 9 · A_T02B · stateless against stateful */

/*
 * 566 x 320. Two cards (y 20..300): Stateless (x 20..273) and Stateful (x 293..546). Each: the heading, Users at the
 * top (y 108) on a wire down to its row (y 226). Stateless: one bus at y 164 into three identical instances, copied
 * freely (the second and third come and go). Stateful: the Database (366) and its Copy (486); the copy needs the shared
 * state brought along a sync link (y 226) with an hourglass on it, and waits, dimmed, until the state arrives.
 */
const C = { W: 566, H: 320, LX: 20, RX: 293, CW: 253, Y: 20, CH: 280, HY: 50, UY: 108, US: 44, BUS: 164, RY: 226, NS: 48, DX: 352, CX2: 500, PER: 4.2 }
const C_LC = C.LX + C.CW / 2
const C_RC = C.RX + C.CW / 2
const C_IX = [C_LC - 78, C_LC, C_LC + 78]
const cWire = (x: number): Pt[] => (x === C_LC ? [[C_LC, C.UY + C.US / 2], [x, C.RY - C.NS / 2]] : [[C_LC, C.UY + C.US / 2], [C_LC, C.BUS], [x, C.BUS], [x, C.RY - C.NS / 2]])
const C_REQ = C_IX.map((x, i) => K.ride(`t02bq${i}`, cWire(x), 0.2 + i * 1.1, 1.3 + i * 1.1, C.PER))
const C_WDB: Pt[] = [[C_RC, C.UY + C.US / 2], [C_RC, C.BUS], [C.DX, C.BUS], [C.DX, C.RY - C.NS / 2]]
const C_WSYNC: Pt[] = [[C.DX + C.NS / 2, C.RY], [C.CX2 - C.NS / 2, C.RY]]
const C_RDB = K.ride('t02bd', C_WDB, 0.1, 1.0, C.PER)
const C_RSYNC = K.ride('t02bs', C_WSYNC, 1.0, 2.6, C.PER, 0.9)

const A_T02B: Fig = (p) => {
  const { hot, s, live, done } = useBuild({ ...p, steps: p.steps ?? 2 }, 2400)
  const run = live && done
  return (
    <Frame w={C.W} h={C.H}>
      <Panel x={C.LX} y={C.Y} w={C.CW} h={C.CH} lit={hot === 0} />
      <Panel x={C.RX} y={C.Y} w={C.CW} h={C.CH} lit={hot === 1} />
      <span style={{ ...box(C.LX, C.HY - 11, C.CW, 22), ...heading(17), textAlign: 'center', zIndex: 3 }}>Stateless</span>
      <span style={{ ...box(C.RX, C.HY - 11, C.CW, 22), ...heading(17), textAlign: 'center', zIndex: 3 }}>Stateful</span>

      {/* stateless: any copy serves */}
      <Node x={C_LC} y={C.UY} icon="users" size={C.US} on={s(1)} d={0.2} />
      {C_IX.map((x, i) => <W key={x} pts={cWire(x)} on={s(1)} lit={hot === 0} head={8} delay={i * 120} />)}
      <Junction x={C_LC} y={C.BUS} on={s(1)} lit={hot === 0} />
      {C_IX.map((x, i) => (
        <Node key={x} x={x} y={C.RY} icon="server" size={C.NS} on={s(1)} lit={hot === 0} d={i * 0.3} delay={150 + i * 150} cls={run && i > 0 ? `t18a-l t18a-c${i}` : undefined} />
      ))}

      {/* stateful: the copy needs the state brought along */}
      <Node x={C_RC} y={C.UY} icon="users" size={C.US} on={s(2)} d={0.5} />
      <W pts={C_WDB} on={s(2)} lit={hot === 1} head={8} />
      <W pts={C_WSYNC} on={s(2)} lit={hot === 1} head={8} delay={200} />
      <Node x={C.DX} y={C.RY} icon="database" size={C.NS} w={100} label="Database" on={s(2)} lit={hot === 1} d={0.2} />
      <Node x={C.CX2} y={C.RY} icon="database" size={C.NS} w={100} label="Copy" on={s(2)} lit={hot === 1} d={0.7} delay={150} cls={run ? 't18a-l t18a-wait' : undefined} />
      <Corner x={(C.DX + C.CX2) / 2} y={C.RY} icon="hourglass" size={30} on={s(2)} loop="tilt" />

      {C_REQ.map((c, i) => <Token key={i} cls={c} on={s(1) && !(run && i > 0)} size={9} />)}
      {run && C_REQ.slice(1).map((c, i) => <span key={i} className={`t18a-l t18a-c${i + 1}`} style={{ position: 'absolute', left: 0, top: 0, zIndex: 5 }}><Token cls={c} size={9} /></span>)}
      <Token cls={C_RDB} on={s(2)} size={9} />
      <Rider cls={C_RSYNC} icon="database" size={22} on={s(2)} />
    </Frame>
  )
}

/* ================================================================== slide 10 · A_T03 · assume it breaks */

/*
 * 546 x 340. Elastic Load Balancing (273, 46) over a Region (teal dashed, x 20..526, y 104..320, its mark in the corner)
 * holding Availability Zone A (x 40..263) and B (x 283..506), y 144..300, teal dashed, no icon; each zone's label row
 * (a data-centre building and the zone's name) at its foot. The wires leave the load balancer's foot, split at a
 * junction (273, 88) and end on each zone's top edge at its centre. Press 1: zone A greys out, its
 * instances crossed in orange; its wire turns dashed and faded and stops in an orange cross before the zone; all the
 * traffic rides to zone B. Press 2: zone B's two services stand in bulkhead compartments either side of a brick wall
 * (the firewall icon on it); the right one fails, its compartment turns orange, the wall holds and the left stays healthy.
 */
const D = { W: 546, H: 340, LX: 273, LY: 46, LS: 52, J: 88, RX: 20, RR: 526, RY: 104, RB: 320, AY: 144, AB: 300, CW: 79, WG: 25, TY: 198, TS: 40, CY0: 164, CY1: 232, PER: 2.6 }
const D_AZ = [40, 283]
const D_AW = 223
const dComp = (az: number, k: number) => D_AZ[az] + 20 + k * (D.CW + D.WG)
const dMid = (az: number) => D_AZ[az] + D_AW / 2
const dWire = (az: number, short = false): Pt[] => [[D.LX, D.LY + D.LS / 2], [D.LX, D.J], [dMid(az), D.J], [dMid(az), short ? D.AY - 30 : D.AY]]
const D_REQ = [0, 1].map((az) => K.ride(`t03q${az}`, dWire(az), 0.1 + az * 1.3, 1.2 + az * 1.3, D.PER))
const D_ALL = [K.ride('t03b0', dWire(1), 0.1, 1.2, 1.3), K.ride('t03b1', dWire(1), 0.75, 1.85, 1.3)]

/** a bulkhead wall: a narrow brick strip between compartments */
function Bricks({ x, y, h, lit }: { x: number; y: number; h: number; lit: boolean }) {
  const rows = Math.floor(h / 8)
  return (
    <svg aria-hidden width={12} height={h} style={{ position: 'absolute', left: x - 6, top: y, zIndex: 3, overflow: 'visible' }}>
      <rect x={0} y={0} width={12} height={h} rx={2.5} fill={lit ? '#C9622A' : '#8C99B0'} />
      {Array.from({ length: rows }, (_, r) => (
        <g key={r}>
          <line x1={0} y1={r * 8 + 8} x2={12} y2={r * 8 + 8} stroke="#F2F5FA" strokeWidth={1.2} />
          <line x1={r % 2 ? 4 : 8} y1={r * 8} x2={r % 2 ? 4 : 8} y2={r * 8 + 8} stroke="#F2F5FA" strokeWidth={1.2} />
        </g>
      ))}
    </svg>
  )
}

const A_T03: Fig = (p) => {
  const { hot, s, held } = useBuild({ ...p, steps: p.steps ?? 2 }, 2400)
  const instant = useInstant()
  const down = s(1)
  const walls = s(2)
  return (
    <Frame w={D.W} h={D.H}>
      {/* the Region and its two Availability Zones */}
      <div aria-hidden style={{ ...box(D.RX, D.RY, D.RR - D.RX, D.RB - D.RY), zIndex: 1, borderRadius: 4, border: `2px dashed ${TEAL}`, background: 'rgba(0,164,166,0.03)' }} />
      <img src={regionMark} alt="" aria-hidden draggable={false} style={{ ...box(D.RX, D.RY, 32, 32), zIndex: 3, display: 'block' }} />
      <span style={{ ...box(D.RX + 40, D.RY + 7, 80, 18), ...tag(14, TEAL_INK), textAlign: 'left', zIndex: 3 }}>Region</span>
      {D_AZ.map((x, az) => (
        <div key={x}>
          <div aria-hidden style={{ ...box(x, D.AY, D_AW, D.AB - D.AY), zIndex: 1, borderRadius: 4, border: `2px dashed ${TEAL}`, background: az === 0 && down ? 'rgba(120,130,150,0.08)' : '#FFFFFF', transition: tr(instant, 'background-color') }} />
          <div style={{ ...box(x + 20, D.AB - 44, D_AW - 40, 26), zIndex: 3, display: 'flex', alignItems: 'center', gap: 8, opacity: az === 0 && down ? 0.55 : 1, transition: tr(instant) }}>
            <Ico3D name="building" size={26} loop={az === 0 && down ? 'none' : 'bob'} d={az * 0.6} />
            <span style={tag(14, TEAL_INK)}>Availability Zone {az === 0 ? 'A' : 'B'}</span>
          </div>
        </div>
      ))}

      {/* zone B: bulkhead compartments (press 2) */}
      {[0, 1].map((k) => (
        <Show key={k} on={walls} delay={k * 80} style={{ ...box(dComp(1, k), D.CY0, D.CW, D.CY1 - D.CY0), zIndex: 2 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 10, background: k === 1 ? '#FFF1E6' : '#F3F7FF', boxShadow: k === 1 ? `inset 0 0 0 2px ${ORANGE}` : `inset 0 0 0 1.5px ${hot === 1 ? ORANGE : '#C5D5F5'}`, transition: tr(instant, 'box-shadow', 420) }} />
        </Show>
      ))}
      <Show on={walls} delay={200}>
        <Bricks x={dMid(1)} y={D.CY0 - 6} h={D.CY1 - D.CY0 + 12} lit={hot === 1} />
      </Show>
      <Corner x={dMid(1)} y={(D.CY0 + D.CY1) / 2} icon="firewall" on={walls} size={26} loop="pulse" />

      {/* the instances: two per zone */}
      {[0, 1].map((az) => [0, 1].map((k) => {
        const cx = dComp(az, k) + D.CW / 2
        const failed = az === 0 ? down : walls && k === 1
        const ok = az === 1 && walls && k === 0
        return (
          <div key={`${az}${k}`}>
            <Node x={cx} y={D.TY} icon="server" size={D.TS} dim={failed} lit={(az === 0 && hot === 0) || (az === 1 && hot === 1 && k === 1)} loop={failed ? 'none' : 'bob'} d={az * 0.5 + k * 0.3} />
            <Corner x={cx + D.TS / 2 - 3} y={D.TY - D.TS / 2 + 3} cross on={failed} size={20} />
            <Corner x={cx + D.TS / 2 - 3} y={D.TY - D.TS / 2 + 3} icon="check" on={ok} size={20} loop="pulse" d={k * 0.4} />
          </div>
        )
      }))}

      {/* Elastic Load Balancing and its two paths */}
      <Node x={D.LX} y={D.LY} mark={elbMark} size={D.LS} w={60} />
      <span style={{ ...box(D.LX + D.LS / 2 + 12, D.LY - 9, 120, 18), ...tag(14), textAlign: 'left', zIndex: 3 }}>Load Balancer</span>
      <W pts={dWire(1)} lit={hot === 0} />
      {down ? <W pts={dWire(0, true)} head={0} color="#9AA8BF" dash="6 6" opacity={0.7} /> : <W pts={dWire(0)} />}
      <Corner x={dMid(0)} y={D.AY - 20} cross on={down} size={24} />
      <Junction x={D.LX} y={D.J} lit={hot === 0} />

      {!held && (down ? D_ALL.map((c, i) => <Token key={i} cls={c} size={9} />) : D_REQ.map((c, i) => <Token key={i} cls={c} size={9} />))}
    </Frame>
  )
}

/* ================================================================== slide 11 · A_T03B · blast radius, fault injection */

/*
 * 566 x 340. A component map: a web front (64, 66) -> service (194, 66) -> service (324, 66); the middle service down
 * to a database (194, 250) -> package (324, 250). Press 1: the package fails (orange cross); its Blast Radius (a dashed
 * orange ellipse, centre (259, 250), its target icon and tag above it) reaches only its neighbour the database (alert badge); the rest of the map runs.
 * Press 2: Fault Injection Service (490, 190) sends a fault into the right service (on an elbow through x 440): it is
 * hit (orange cross), then recovers (green tick). Loop: the fault rides, the cross shows, the tick returns; ripples
 * leave the failed package.
 */
const E = { W: 566, H: 340, NS: 52, R1: 66, R2: 250, X1: 64, X2: 194, X3: 324, EX: 259, ERX: 128, ERY: 62, FX: 490, FY: 190, FS: 60, BUS: 440, PER: 4.4 }
const E_H = E.NS / 2
const E_LINKS: Pt[][] = [
  [[E.X1 + E_H, E.R1], [E.X2 - E_H, E.R1]],
  [[E.X2 + E_H, E.R1], [E.X3 - E_H, E.R1]],
  [[E.X2, E.R1 + E_H], [E.X2, E.R2 - E_H]],
  [[E.X2 + E_H, E.R2], [E.X3 - E_H, E.R2]],
]
const E_FAULT: Pt[] = [[E.FX - E.FS / 2, E.FY], [E.BUS, E.FY], [E.BUS, E.R1], [E.X3 + E_H, E.R1]]
const E_RIDES = E_LINKS.map((pts, i) => K.ride(`t03bl${i}`, pts, 0.2 + i * 0.7, 0.9 + i * 0.7, 3.2))
const E_RFAULT = K.ride('t03bf', E_FAULT, 0.1, 1.3, E.PER, 0.9)

const A_T03B: Fig = (p) => {
  const { hot, s, live, done } = useBuild({ ...p, steps: p.steps ?? 2 }, 2400)
  const instant = useInstant()
  const failed = s(1)
  const fis = s(2)
  const run = live && done
  return (
    <Frame w={E.W} h={E.H}>
      {/* the blast radius (press 1) */}
      <Show on={failed} style={{ ...box(E.EX - E.ERX, E.R2 - E.ERY, E.ERX * 2, E.ERY * 2), zIndex: 1 }}>
        <div className={live ? loopCls('breathe') : undefined} style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(255,138,61,0.07)', border: `2px dashed ${ORANGE}`, boxShadow: hot === 0 ? `0 0 0 4px ${ORANGE}33` : 'none', transition: tr(instant, 'box-shadow', 420) }} />
      </Show>
      <Show on={failed} delay={150} style={{ ...box(E.X3 - 32, E.R2 - E.ERY - 50, 130, 32), zIndex: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Plinth size={32} lit={hot === 0}><Ico3D name="target" size={24} loop="pulse" /></Plinth>
        <span style={tag(14, '#C9622A')}>Blast Radius</span>
      </Show>

      {/* the component map */}
      {E_LINKS.map((pts, i) => <W key={i} pts={pts} head={8} color={i === 3 && failed ? '#9AA8BF' : BLUE} lit={hot === 0 && i === 3} />)}
      <Node x={E.X1} y={E.R1} icon="webpage" d={0.1} />
      <Node x={E.X2} y={E.R1} icon="server" d={0.4} />
      <Node x={E.X3} y={E.R1} icon="server" d={0.7} lit={hot === 1} cls={run ? 't18a-l t18a-jolt' : undefined} />
      <Node x={E.X2} y={E.R2} icon="database" d={0.9} badge={failed ? 'alert' : undefined} lit={hot === 0} />
      <Node x={E.X3} y={E.R2} icon="package" dim={failed} loop={failed ? 'none' : 'bob'} lit={hot === 0}>
        {failed && live && <span aria-hidden className={loopCls('ripple')} style={{ position: 'absolute', inset: -10, borderRadius: 22, boxShadow: `0 0 0 2.5px ${ORANGE}99`, ...loopVars(0, 2.4) }} />}
      </Node>
      <Corner x={E.X3 + E_H - 4} y={E.R2 - E_H + 4} cross on={failed} size={24} />

      {/* Fault Injection Service (press 2): a deliberate fault, then recovery */}
      <W pts={E_FAULT} on={fis} lit={hot === 1} head={9} color={ORANGE} />
      <Node x={E.FX} y={E.FY} mark={fisMark} size={E.FS} w={130} wrap={120} label="Fault Injection Service" on={fis} lit={hot === 1} />
      <Corner x={E.X3 + E_H - 4} y={E.R1 - E_H + 4} cross on={fis} size={24} cls={run ? 't18a-l t18a-hit' : 't18a-off'} />
      <Corner x={E.X3 + E_H - 4} y={E.R1 - E_H + 4} icon="check" on={fis} size={24} loop="pulse" cls={run ? 't18a-l t18a-ok' : undefined} z={7} />

      {E_RIDES.map((c, i) => <Token key={i} cls={c} size={9} on={!(failed && i === 3)} />)}
      <Rider cls={E_RFAULT} icon="bolt" size={24} on={fis} />
    </Frame>
  )
}

/* ================================================================== slide 12 · A_T04 · immutable infrastructure */

/*
 * 546 x 300 (the note sits under it). Left card (x 20..276, y 20..280): the replace cycle, Build (a new machine image,
 * 70, 84) -> Test (226, 84) -> Launch (226, 216) -> Load Balancer (148, 216, shifting traffic to the new instance) ->
 * Retire (the old image, dimmed, 70, 216) -> back to Build; tags above the top row and below the bottom row, `Replace,
 * Not Patch` in the middle. Right top card (x 292..526, y 20..160): an Infrastructure as Code Template (344, 90) drawing
 * two identical environments (x 404..506). Right bottom card (y 176..280): three services, linked loosely, one deploying (refresh)
 * while the other two keep running (tick).
 */
const F = { W: 546, H: 300, LX: 20, LR: 276, Y: 20, B: 280, X1: 70, X2: 226, XC: 148, T: 84, BT: 216, NS: 44, RX: 292, RR: 526, IB: 160, DY: 176, CX: 344, CY: 90, EX: 404, EW: 102, EH: 48, E1: 64, E2: 116, EB: 385, PY: 228, PS: 44, PER: 5 }
const F_H = F.NS / 2
const F_CYC: Pt[][] = [
  [[F.X1 + F_H, F.T], [F.X2 - F_H, F.T]],
  [[F.X2, F.T + F_H], [F.X2, F.BT - F_H]],
  [[F.X2 - F_H, F.BT], [F.XC + F_H, F.BT]],
  [[F.XC - F_H, F.BT], [F.X1 + F_H, F.BT]],
  [[F.X1, F.BT - F_H], [F.X1, F.T + F_H]],
]
const F_RIDES = F_CYC.map((pts, i) => K.ride(`t04c${i}`, pts, i * 1.0, i * 1.0 + 0.8, F.PER))
const F_ENV: Pt[][] = [F.E1, F.E2].map((y) => [[F.CX + F_H, F.CY], [F.EB, F.CY], [F.EB, y], [F.EX, y]])
const F_ERIDE = F_ENV.map((pts, i) => K.ride(`t04e${i}`, pts, 0.2 + i * 0.3, 1.1 + i * 0.3, 2.4))
const F_PX = [340, 409, 478]

function Env({ y, on, lit, d }: { y: number; on: boolean; lit: boolean; d: number }) {
  const instant = useInstant()
  return (
    <Show on={on} delay={200} style={{ ...box(F.EX, y - F.EH / 2, F.EW, F.EH), zIndex: 3 }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 10, background: '#F5F8FF', boxShadow: lit ? LIT : RIM, transition: tr(instant, 'box-shadow', 420) }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <Ico3D name="server" size={28} loop="bob" d={d} />
        <Ico3D name="database" size={28} loop="bob" d={d + 0.4} />
      </div>
    </Show>
  )
}

const A_T04: Fig = (p) => {
  const { hot, s, live } = useBuild({ ...p, steps: p.steps ?? 3 }, 2000)
  return (
    <Frame w={F.W} h={F.H}>
      {/* point 1: the replace cycle */}
      <Panel x={F.LX} y={F.Y} w={F.LR - F.LX} h={F.B - F.Y} lit={hot === 0} />
      {F_CYC.map((pts, i) => <W key={i} pts={pts} on={s(1)} head={8} delay={i * 120} />)}
      <Node x={F.X1} y={F.T} icon="image" size={F.NS} w={100} label="Build" up on={s(1)} d={0.1} />
      <Node x={F.X2} y={F.T} icon="check" size={F.NS} w={100} label="Test" up on={s(1)} delay={120} loop="pulse" />
      <Node x={F.X2} y={F.BT} icon="server" size={F.NS} w={100} label="Launch" on={s(1)} delay={240} d={0.5} />
      <Node x={F.XC} y={F.BT} mark={elbMark} size={F.NS} w={120} label="Load Balancer" up on={s(1)} delay={360} />
      <Node x={F.X1} y={F.BT} icon="image" size={F.NS} w={100} label="Retire" on={s(1)} delay={480} dim loop="none" />
      <Corner x={F.X1 + F_H - 2} y={F.BT - F_H + 2} icon="trash" on={s(1)} size={24} loop="swing" />
      <Show on={s(1)} delay={300} style={{ ...box(F.XC - 70, 126, 140, 20), zIndex: 3 }}>
        <span style={{ ...heading(15, colors.brandDark), display: 'block', textAlign: 'center', whiteSpace: 'nowrap' }}>Replace, Not Patch</span>
      </Show>

      {/* point 2: one template, two identical environments */}
      <Panel x={F.RX} y={F.Y} w={F.RR - F.RX} h={F.IB - F.Y} lit={hot === 1} />
      {F_ENV.map((pts, i) => <W key={i} pts={pts} on={s(2)} head={8} delay={150} />)}
      <Junction x={F.EB} y={F.CY} on={s(2)} />
      <Node x={F.CX} y={F.CY} icon="code" size={F.NS} w={100} label="Template" on={s(2)} />
      <Env y={F.E1} on={s(2)} lit={false} d={0} />
      <Env y={F.E2} on={s(2)} lit={false} d={0.5} />

      {/* point 3: one service deploys, the others keep running */}
      <Panel x={F.RX} y={F.DY} w={F.RR - F.RX} h={F.B - F.DY} lit={hot === 2} />
      {[0, 1].map((i) => <W key={i} pts={[[F_PX[i] + F.PS / 2, F.PY], [F_PX[i + 1] - F.PS / 2, F.PY]]} on={s(3)} head={0} width={2} color="#9DB6EE" dash="4 5" />)}
      {F_PX.map((x, i) => (
        <Node key={x} x={x} y={F.PY} icon="package" size={F.PS} on={s(3)} delay={i * 120} d={i * 0.4}>
          {i === 1 && s(3) && live && <span aria-hidden className={loopCls('ripple')} style={{ position: 'absolute', inset: -7, borderRadius: 18, boxShadow: `0 0 0 2.5px ${BLUE}77`, ...loopVars(0, 2.2) }} />}
        </Node>
      ))}
      {F_PX.map((x, i) => <Corner key={x} x={x + F.PS / 2 - 2} y={F.PY - F.PS / 2 + 2} icon={i === 1 ? 'refresh' : 'check'} loop={i === 1 ? 'spin' : 'pulse'} on={s(3)} size={24} d={i * 0.3} />)}

      {F_RIDES.map((c, i) => <Token key={i} cls={c} on={s(1)} size={9} />)}
      {F_ERIDE.map((c, i) => <Token key={i} cls={c} on={s(2)} size={8} />)}
    </Frame>
  )
}

export const figures: Record<string, Fig> = { A_T01, A_T02: B_T02, A_T02B, A_T03, A_T03B, A_T04 }

/* ------------------------------------------------------------------ loop keyframes (transform / opacity, HTML only) */
const pc = (v: number) => `${Math.max(0, Math.min(100, v)).toFixed(2)}%`
/* the dot on the demand curve, linear in x */
const DOT = (() => {
  const lines = [`0% { transform: translate(${B_PTS[0][0]}px, ${B_PTS[0][1]}px); opacity: 0 }`, `2% { opacity: 1 }`]
  B_PTS.forEach(([x, y], i) => i % 3 === 0 && i > 0 && lines.push(`${pc(frac(x) * 100)} { transform: translate(${x}px, ${y}px) }`))
  const [lx, ly] = B_PTS[B_PTS.length - 1]
  lines.push(`${pc(B_RUN * 100)} { transform: translate(${lx}px, ${ly}px); opacity: 1 }`, `${pc(B_RUN * 100 + 4)}, 100% { transform: translate(${lx}px, ${ly}px); opacity: 0 }`)
  return `@keyframes t18a-dot { ${lines.join(' ')} }\n.t18a-dot { animation: t18a-dot ${B.PER}s linear infinite; }`
})()
/* an instance present between two x positions of the dot (fades in 4%, out 4%) */
const span = (name: string, xa: number, xb: number) => {
  const a = frac(xa) * 100
  const b = frac(xb) * 100
  return `@keyframes ${name} { 0%, ${pc(a - 4)} { opacity: 0.12; transform: scale(0.9) } ${pc(a)}, ${pc(b)} { opacity: 1; transform: scale(1) } ${pc(b + 5)}, 100% { opacity: 0.12; transform: scale(0.9) } }\n.${name} { animation: ${name} ${B.PER}s ease-in-out infinite; }`
}
const ROLL = [0, 1, 2, 3].map((k) => `@keyframes t18a-r${k} { 0%, ${pc(6 + k * 16)} { opacity: 0 } ${pc(14 + k * 16)}, 82% { opacity: 1 } 92%, 100% { opacity: 0 } }\n.t18a-r${k} { animation: t18a-r${k} 4.4s ease-in-out infinite; }`).join('\n')
const GROW = [2, 3, 4].map((k) => `@keyframes t18a-g${k} { 0%, ${pc((k - 2) * 12)} { opacity: 0.15; transform: scale(0.8) } ${pc(8 + (k - 2) * 12)}, ${pc(70 - (k - 2) * 10)} { opacity: 1; transform: scale(1) } ${pc(78 - (k - 2) * 10)}, 100% { opacity: 0.15; transform: scale(0.8) } }\n.t18a-g${k} { animation: t18a-g${k} 4.4s ease-in-out infinite; }`).join('\n')
const COPY = [1, 2].map((k) => `@keyframes t18a-c${k} { 0%, ${pc(4 + (k - 1) * 14)} { opacity: 0.15 } ${pc(14 + (k - 1) * 14)}, ${pc(74 - (k - 1) * 12)} { opacity: 1 } ${pc(84 - (k - 1) * 12)}, 100% { opacity: 0.15 } }\n.t18a-c${k} { animation: t18a-c${k} ${C.PER * 2}s ease-in-out infinite; }`).join('\n')
/* the copy waits until the sync rider arrives at 2.6 s of 4.2 */
const WAIT = `@keyframes t18a-wait { 0%, 56% { opacity: 0.45 } 64%, 92% { opacity: 1 } 100% { opacity: 0.45 } }\n.t18a-wait { animation: t18a-wait ${C.PER}s ease-in-out infinite; }`
/* the fault arrives at 1.3 s of 4.4: the service jolts, the cross shows, then the tick returns */
const FAULT = `@keyframes t18a-jolt { 0%, 28% { transform: translateX(0) } 31% { transform: translateX(-3px) } 34% { transform: translateX(3px) } 37% { transform: translateX(-2px) } 40%, 100% { transform: translateX(0) } }
.t18a-jolt { animation: t18a-jolt ${E.PER}s linear infinite; }
@keyframes t18a-hit { 0%, 28% { opacity: 0 } 31%, 60% { opacity: 1 } 66%, 100% { opacity: 0 } }
.t18a-hit { animation: t18a-hit ${E.PER}s ease-in-out infinite; }
@keyframes t18a-ok { 0%, 22% { opacity: 1 } 28%, 62% { opacity: 0 } 68%, 100% { opacity: 1 } }
.t18a-ok { animation: t18a-ok ${E.PER}s ease-in-out infinite; }
.t18a-off { opacity: 0; }`

export const css = `
.t18a-l { animation-delay: var(--t18a-d, 0s); }
${DOT}
${span('t18a-i3', B_UP, B_DOWN + 30)}
${span('t18a-i4', B_UP - B.AHEAD - 30, B_DOWN)}
${ROLL}
${GROW}
${COPY}
${WAIT}
${FAULT}
@keyframes t18a-float { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
.t18a-float { animation: t18a-float 4s ease-in-out infinite; }
${K.css()}
.cc-still .t18a-l, .deck-thumb .t18a-l { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .t18a-l { animation: none !important; } }
`
void cv
