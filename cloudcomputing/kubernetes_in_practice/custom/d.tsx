import type { CSSProperties, ReactNode } from 'react'
import { colors, fonts } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, Frame, Show, Plinth, MarkTile, Panel, Wire, Token, keyframes, tag, heading, useHeld, useHot, type Pt } from '@/engine/figkit'
import podMark from '../images/k8s-pod.svg'
import svcMark from '../images/k8s-svc.svg'
import epMark from '../images/k8s-ep.svg'
import kubeletMark from '../images/k8s-kubelet.svg'

/*
 * SESSION 21 · SECTION 3 (Health & Self-Healing) technical figures, builder D.
 * Built to generate-slides standing correction 17 and the Session 18 reference: 3D icons on plinth tiles, official
 * Kubernetes marks on white tiles (never moving), >= 20 px equal padding, orthogonal wires computed from the same
 * constants as the boxes, a flow dot on every live wire, a lit item walking first -> last -> first after the build
 * (starting on the last item). Loops are transform / opacity on HTML elements only. Held (?still): the full final
 * state, nothing lit, nothing moving. Class prefix `s21d-`.
 *
 *   slide 32 D_T12   566 x 360  a time axis with the startup gate on it; three probe cards in timeline order (Startup,
 *                               Liveness, Readiness): a hung container restarted (1), a not-ready pod with its Service
 *                               traffic held back (2), the slow start and the gate holding the other two (3)
 *   slide 35 D_T13B  566 x 368  the pod manifest's livenessProbe block (real YAML, Fira Code) beside the kubelet's
 *                               check pulse; point N lights its field blue (periodSeconds, failureThreshold,
 *                               initialDelaySeconds) and adds its icon (clock, alert, hourglass) (3)
 *   slide 36 D_T14   546 x 320  one timeline t=0s -> t=40s, lanes Container, Liveness, Endpoints: the start on 8080 and
 *                               the startup gate (1), three timed-out checks at 10s, 20s, 30s (2), the restart of the
 *                               container only (3)
 *   slide 37 D_T14B  546 x 320  the same timeline continued: the pod leaves the endpoints, no restart (4), passes and
 *                               rejoins (5)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('s21d')
const BLUE = colors.brand
const MONO = fonts.mono
const NOLIG: CSSProperties = { fontVariantLigatures: 'none', fontFeatureSettings: '"liga" 0, "calt" 0' }
const RAIL = '#D3DEF6'
const nm = (n: string) => n as Ico3DName

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)
const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })
const mono = (size = 14, color: string = colors.ink): CSSProperties => ({ fontFamily: MONO, ...NOLIG, fontSize: size, fontWeight: 600, lineHeight: 1.2, color, whiteSpace: 'nowrap' })

/** the build of a figure that may be split over two slides (`from`): the global step, the lit item, held */
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
  return { step, hot, held, s: (n: number) => step >= n }
}

/** a 3D icon (or an official mark) on its plinth; the TILE is centred on (x, y); its tag to the right */
function Node({ x, y, label, alt, icon, mark, size = 44, k = 0.74, on = true, lit = false, loop = 'bob', d = 0, t, dim = false, swap = false, delay = 0, tagSize = 14, children }: { x: number; y: number; label?: string; alt?: string; icon?: string; mark?: string; size?: number; k?: number; on?: boolean; lit?: boolean; loop?: Loop; d?: number; t?: number; dim?: boolean; swap?: boolean; delay?: number; tagSize?: number; children?: ReactNode }) {
  const instant = useInstant()
  const tile = mark ? <MarkTile src={mark} size={size} lit={lit} /> : (
    <Plinth size={size} lit={lit}>
      <Ico3D name={nm(icon ?? 'doc')} size={Math.round(size * k)} loop={dim ? 'none' : loop} d={d} t={t} />
    </Plinth>
  )
  const fade = (v: boolean): CSSProperties => ({ opacity: v ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE}` })
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, height: size, zIndex: 3, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0, display: 'grid', placeItems: 'center' }}>
        <div style={{ opacity: dim ? 0.5 : 1, filter: dim ? 'grayscale(1)' : undefined, transition: instant ? 'none' : `opacity 520ms ${EASE}, filter 520ms ${EASE}` }}>{tile}</div>
        {children}
      </div>
      {label && (
        <span style={{ position: 'relative', display: 'grid' }}>
          <span style={{ ...tag(tagSize), textAlign: 'left', gridArea: '1 / 1', ...fade(!swap || !alt) }}>{label}</span>
          {alt && <span style={{ ...tag(tagSize), textAlign: 'left', gridArea: '1 / 1', ...fade(swap) }}>{alt}</span>}
        </span>
      )}
    </Show>
  )
}

/** a small white disc holding a 3D icon, centred on (x, y) of the frame; `ring` orange for a failed check */
function Disc({ x, y, on = true, size = 26, icon, loop = 'pulse', d = 0, t = 2.4, ring = false, z = 6 }: { x: number; y: number; on?: boolean; size?: number; icon: string; loop?: Loop; d?: number; t?: number; ring?: boolean; z?: number }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: z, borderRadius: 99, background: '#FFFFFF', boxShadow: ring ? `0 4px 10px -5px rgba(255,138,61,0.7), inset 0 0 0 2px ${ORANGE}` : '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6', display: 'grid', placeItems: 'center', opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}` }}>
      <Ico3D name={nm(icon)} size={size - 8} loop={loop} d={d} t={t} />
    </span>
  )
}

/** a glossy ORANGE cross ball (failure is orange in this course, never red; the engine's `cross` is red) */
function XBall({ size = 22, loop = true, d = 0 }: { size?: number; loop?: boolean; d?: number }) {
  const r = size / 2
  return (
    <span aria-hidden className={loop ? 'i3d i3d-beat' : undefined} style={{ display: 'grid', placeItems: 'center', width: size, height: size, flexShrink: 0, borderRadius: 99, background: 'radial-gradient(circle at 34% 28%, #FFD9BC 0%, #FF9A55 32%, #FF8A3D 55%, #E8642A 82%, #B4461A 100%)', boxShadow: '0 0 0 2px #FFFFFF, 0 4px 8px -3px rgba(180,70,26,0.6)', ['--i3d-d' as string]: `${-d}s`, ['--i3d-t' as string]: '2.2s' } as CSSProperties}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
        <path d={`M ${r * 0.62} ${r * 0.62} L ${r * 1.38} ${r * 1.38} M ${r * 1.38} ${r * 0.62} L ${r * 0.62} ${r * 1.38}`} stroke="#FFFFFF" strokeWidth={Math.max(2.4, size * 0.13)} strokeLinecap="round" />
      </svg>
    </span>
  )
}

/** an XBall placed with its centre on (x, y), fading in */
function XAt({ x, y, on = true, size = 22, z = 6, delay = 0 }: { x: number; y: number; on?: boolean; size?: number; z?: number; delay?: number }) {
  const instant = useInstant()
  return (
    <span aria-hidden style={{ ...box(x - size / 2, y - size / 2, size, size), zIndex: z, display: 'grid', placeItems: 'center', opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE} ${on ? delay : 0}ms, transform 520ms ${EASE} ${on ? delay : 0}ms` }}>
      <XBall size={size} />
    </span>
  )
}

/** a white disc carrying a mini 3D icon along a `ride` class (placed from the frame's 0,0); nothing on held frames */
function Rider({ cls, icon, size = 24, on = true }: { cls: string; icon: string; size?: number; on?: boolean }) {
  const held = useHeld()
  if (held || !on) return null
  return (
    <span aria-hidden style={{ position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, zIndex: 7, pointerEvents: 'none' }}>
      <span className={cls} style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -4px rgba(31,64,140,0.55), inset 0 0 0 1px #D3DEF6', opacity: 0 }}>
        <Ico3D name={nm(icon)} size={size - 6} loop="none" />
      </span>
    </span>
  )
}

/** a wire on its own layer above the cards (a Panel is z 2 and would hide a wire drawn inside it); tiles (z 3) stay on top */
const W = (props: Parameters<typeof Wire>[0]) => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}><Wire {...props} /></div>
)

/** a card title row: a 3D icon on its plinth and the heading beside it, the row's left edge at x, centred on y */
function TitleRow({ x, y, icon, text, size = 36, lit = false, loop = 'bob' }: { x: number; y: number; icon: string; text: string; size?: number; lit?: boolean; loop?: Loop }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y - size / 2, height: size, display: 'flex', alignItems: 'center', gap: 8, zIndex: 3 }}>
      <Plinth size={size} lit={lit}><Ico3D name={nm(icon)} size={Math.round(size * 0.76)} loop={loop} t={loop === 'beat' ? 1.6 : undefined} /></Plinth>
      <span style={{ ...heading(15), whiteSpace: 'nowrap' }}>{text}</span>
    </div>
  )
}

/* ================================================================== slide 32 · D_T12 · three probes on a timeline */

/*
 * 566 x 360. A time axis across the top (y 38, x 20 -> 546). Three cards under it in timeline order, x 20 / 200 / 380,
 * 166 wide, y 66..340: Startup (hourglass), Liveness (heartbeat), Readiness (gate), each a title row (y 104) over two
 * tiles in a column at card x + 42 (y 164 and 298, tags to the right) joined by a vertical wire. The startup gate sits
 * on the axis between the Startup card and the other two (x 193).
 *   press 1 Liveness: the container hangs (greyed, orange cross), a restart wire to a fresh container
 *   press 2 Readiness: the Service below the pod; its traffic up to the pod is held back (dashed, orange cross)
 *   press 3 Startup: the slow start (the hourglass on its wire), the started container, the gate on the axis holding the
 *           Liveness and Readiness half of the timeline
 * Loop: a time dot runs the axis; once the gate is shown it waits at the gate, the gate opens, it runs on.
 */
const A = { W: 566, H: 360, AX: 38, CY0: 66, CY1: 340, CW: 166, TY: 104, Y1: 164, Y2: 298, TS: 44, GX: 193, PER: 3.4, PERG: 4.2 }
const A_X = [20, 200, 380]
const A_CX = A_X.map((x) => x + 42)
const A_WIRE = (cx: number): Pt[] => [[cx, A.Y1 + A.TS / 2], [cx, A.Y2 - A.TS / 2]]
const A_UP = (cx: number): Pt[] => [[cx, A.Y2 - A.TS / 2], [cx, A.Y1 + A.TS / 2]]
const A_RS = K.ride('t12s', A_WIRE(A_CX[0]), 0.3, 1.3, 2.6)
const A_RL = K.ride('t12l', A_WIRE(A_CX[1]), 0.3, 1.3, 2.6)
const A_RR = K.ride('t12r', [[A_CX[2], A.Y2 - A.TS / 2], [A_CX[2], 212]], 0.2, 1.0, 2.6, 0.4)
const A_AXIS = K.ride('t12ax', [[24, A.AX], [534, A.AX]], 0.1, 3.0, A.PER)

const D_T12: Fig = (p) => {
  const { hot, s, held } = useBuild({ ...p, steps: p.steps ?? 3 }, 1800)
  const instant = useInstant()
  const gate = s(3)
  return (
    <Frame w={A.W} h={A.H}>
      {/* the time axis: Startup first, then Liveness and Readiness behind the gate */}
      <W pts={[[20, A.AX], [546, A.AX]]} head={10} width={2.4} />
      <Token cls={A_AXIS} on={!gate} size={10} />
      {gate && !held && (
        <span aria-hidden style={{ position: 'absolute', left: -5, top: -5, width: 10, height: 10, zIndex: 5 }}>
          <span className="s21d-gcur" style={{ display: 'block', width: 10, height: 10, borderRadius: 99, background: BLUE, boxShadow: `0 0 0 4px ${BLUE}2e, 0 4px 10px -4px ${BLUE}`, opacity: 0 }} />
        </span>
      )}
      {/* the startup gate: a bar across the axis with the hourglass on it; it opens in the loop */}
      <span aria-hidden style={{ ...box(A.GX - 4, A.AX - 22, 8, 44), zIndex: 4, opacity: gate ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE}` }}>
        <span className={gate && !held ? 's21d-gbar' : undefined} style={{ display: 'block', width: 8, height: 44, borderRadius: 4, background: hot === 2 ? ORANGE : colors.brandDark, transition: instant ? 'none' : `background 420ms ${EASE}` }} />
      </span>
      <span style={{ ...box(A.GX - 14, A.AX - 14, 28, 28), zIndex: 6 }}>
        <span className={gate && !held ? 's21d-gdisc' : undefined} style={{ display: 'block', width: 28, height: 28 }}>
          <Disc x={14} y={14} icon="hourglass" size={28} loop="tilt" t={2.4} on={gate} />
        </span>
      </span>

      {/* the three probe cards */}
      {(['Startup', 'Liveness', 'Readiness'] as const).map((name, i) => (
        <Panel key={name} x={A_X[i]} y={A.CY0} w={A.CW} h={A.CY1 - A.CY0} lit={(i === 0 && hot === 2) || (i === 1 && hot === 0) || (i === 2 && hot === 1)} />
      ))}
      <TitleRow x={A_X[0] + 20} y={A.TY} icon="hourglass" text="Startup" loop="tilt" lit={hot === 2} />
      <TitleRow x={A_X[1] + 20} y={A.TY} icon="heartbeat" text="Liveness" loop="beat" lit={hot === 0} />
      <TitleRow x={A_X[2] + 20} y={A.TY} icon="gate" text="Readiness" lit={hot === 1} />

      {/* Startup (point 3): the slow start, then the started container */}
      <Node x={A_CX[0]} y={A.Y1} icon="container" label="Container" d={0.2} />
      <W pts={A_WIRE(A_CX[0])} on={s(3)} lit={hot === 2} head={8} />
      <Disc x={A_CX[0]} y={(A.Y1 + A.Y2) / 2} icon="hourglass" size={28} loop="tilt" on={s(3)} />
      <Node x={A_CX[0]} y={A.Y2} icon="container" label="Started" on={s(3)} delay={300} d={0.6}>
        <Disc x={A.TS - 3} y={3} icon="check" size={24} on={s(3)} />
      </Node>
      <Token cls={A_RS} on={s(3)} size={8} />

      {/* Liveness (point 1): the hung container (still running, not responding), restarted */}
      <Node x={A_CX[1]} y={A.Y1} icon="container" label="Container" alt="Hung" swap={s(1)} dim={s(1)} d={0.4}>
        <span style={{ position: 'absolute', left: A.TS - 3 - 11, top: 3 - 11, width: 22, height: 22 }}>
          <XAt x={11} y={11} on={s(1)} />
        </span>
      </Node>
      <W pts={A_WIRE(A_CX[1])} on={s(1)} lit={hot === 0} head={8} />
      <Disc x={A_CX[1]} y={(A.Y1 + A.Y2) / 2} icon="refresh" size={28} loop="spin" t={3.2} on={s(1)} />
      <Node x={A_CX[1]} y={A.Y2} icon="container" label="Restarted" on={s(1)} delay={300} d={0.8} />
      <Token cls={A_RL} on={s(1)} size={8} />

      {/* Readiness (point 2): the pod is not ready, so the Service's traffic is held back */}
      <Node x={A_CX[2]} y={A.Y1} mark={podMark} label="Pod" />
      <W pts={A_UP(A_CX[2])} on={s(2)} head={0} dash="5 6" opacity={0.55} lit={hot === 1} />
      <XAt x={A_CX[2]} y={208} on={s(2)} delay={300} />
      <Node x={A_CX[2]} y={A.Y2} mark={svcMark} label="Service" on={s(2)} delay={200} />
      <Token cls={A_RR} on={s(2)} size={8} />
    </Frame>
  )
}

/* the gated time dot: to the gate, a wait while the gate opens, then on to the end of the axis */
const gcur = (() => {
  const t = (x: number) => `translate(${x}px, ${A.AX}px)`
  const g0 = A.GX - 22
  const g1 = A.GX + 22
  return `@keyframes s21d-gcur {
  0% { transform: ${t(24)}; opacity: 0 } 3% { opacity: 1; transform: ${t(28)} }
  28% { transform: ${t(g0)}; opacity: 1 } 46% { transform: ${t(g0)}; opacity: 1 } 49% { transform: ${t(g0)}; opacity: 0 }
  49.5% { transform: ${t(g1)}; opacity: 0 } 52% { transform: ${t(g1)}; opacity: 1 }
  88% { transform: ${t(534)}; opacity: 1 } 94% { transform: ${t(534)}; opacity: 0 } 100% { transform: ${t(534)}; opacity: 0 } }
.s21d-gcur { animation: s21d-gcur ${A.PERG}s linear infinite; }
@keyframes s21d-gbar { 0%, 44% { opacity: 1; transform: scaleY(1) } 50%, 90% { opacity: 0.22; transform: scaleY(0.55) } 97%, 100% { opacity: 1; transform: scaleY(1) } }
.s21d-gbar { animation: s21d-gbar ${A.PERG}s ease-in-out infinite; }
@keyframes s21d-gdisc { 0%, 30%, 52%, 100% { transform: scale(1) } 38% { transform: scale(1.12) } 46% { transform: scale(0.96) } }
.s21d-gdisc { animation: s21d-gdisc ${A.PERG}s ease-in-out infinite; }`
})()

/* ================================================================== slide 35 · D_T13B · the probe's manifest fields */

/*
 * 566 x 368. Left: the code panel (x 20..350, y 20..348): a title row (the Pod mark, `Pod Manifest`), a hairline, then
 * the livenessProbe block, 16 px Fira Code, ligatures off (rule 40), 32 px lines from y 104. Point N lights its own
 * field line blue and brings its icon tile in at the panel's right end (clock, alert, hourglass, the point icons).
 * `initialDelaySeconds` is shown with no value (YAML null, i.e. left at the default): the TR gives no number.
 * Right: the check itself: the kubelet (x 418, y 104) sends the HTTP GET (the globe, T13's HTTP GET row icon) down to
 * the container (y 264); a check pops on
 * the container every period, the loop the plan asks for.
 */
const B = { W: 566, H: 368, PX: 20, PY: 20, PW: 330, PH: 328, LY: 104, LH: 32, FS: 16, IT: 30, KX: 418, KY: 104, CY: 264, TS: 48, PER: 2.4 }
const B_LINES: { indent: number; key: string; val?: string; field?: number }[] = [
  { indent: 0, key: 'livenessProbe' },
  { indent: 1, key: 'httpGet' },
  { indent: 2, key: 'path', val: '/healthz' },
  { indent: 2, key: 'port', val: '8080' },
  { indent: 1, key: 'periodSeconds', val: '10', field: 0 },
  { indent: 1, key: 'failureThreshold', val: '3', field: 1 },
  { indent: 1, key: 'initialDelaySeconds', field: 2 },
]
const B_ICON = ['clock', 'alert', 'hourglass']
const B_WIRE: Pt[] = [[B.KX, B.KY + B.TS / 2], [B.KX, B.CY - B.TS / 2]]
const B_RIDE = K.ride('t13', B_WIRE, 0.05, 0.85, B.PER, 0.6)

function YamlLine({ indent, k, v, hi }: { indent: number; k: string; v?: string; hi: boolean }) {
  const instant = useInstant()
  return (
    <div style={{ fontFamily: MONO, ...NOLIG, fontSize: B.FS, lineHeight: `${B.LH}px`, height: B.LH, whiteSpace: 'pre', display: 'flex', alignItems: 'center' }}>
      <span style={{ color: colors.muted }}>{'  '.repeat(indent)}</span>
      <span style={{ display: 'inline-block', lineHeight: '24px', padding: '0 6px', margin: '0 -6px', borderRadius: 6, background: hi ? '#E3ECFF' : 'rgba(227,236,255,0)', boxShadow: hi ? `inset 0 0 0 1.5px ${BLUE}66` : 'inset 0 0 0 1.5px rgba(45,99,251,0)', transition: instant ? 'none' : `background 420ms ${EASE}, box-shadow 420ms ${EASE}` }}>
        <span style={{ color: hi ? colors.brandDark : BLUE, fontWeight: 600 }}>{k}</span>
        <span style={{ color: colors.muted }}>:</span>
        {v !== undefined && <span style={{ color: colors.ink, fontWeight: 500 }}>{' ' + v}</span>}
      </span>
    </div>
  )
}

const D_T13B: Fig = (p) => {
  const { hot, s, held } = useBuild({ ...p, steps: p.steps ?? 3 }, 1800)
  return (
    <Frame w={B.W} h={B.H}>
      {/* the pod manifest snippet */}
      <Panel x={B.PX} y={B.PY} w={B.PW} h={B.PH} radius={16} />
      <div style={{ ...box(B.PX + 20, B.PY + 20, B.PW - 40, 36), zIndex: 3, display: 'flex', alignItems: 'center', gap: 10 }}>
        <MarkTile src={podMark} size={36} />
        <span style={{ ...heading(15), whiteSpace: 'nowrap' }}>Pod Manifest</span>
      </div>
      <span aria-hidden style={{ ...box(B.PX + 20, B.PY + 70, B.PW - 40, 1.5), zIndex: 3, background: RAIL, borderRadius: 1 }} />
      <div style={{ ...box(B.PX + 20, B.LY, B.PW - 40 - B.IT - 12, B_LINES.length * B.LH), zIndex: 3 }}>
        {B_LINES.map((l) => (
          <YamlLine key={l.key} indent={l.indent} k={l.key} v={l.val} hi={l.field !== undefined && hot === l.field} />
        ))}
      </div>
      {B_LINES.map((l, i) => l.field === undefined ? null : (
        <Show key={l.key} on={s(l.field + 1)} style={{ ...box(B.PX + B.PW - 20 - B.IT, B.LY + i * B.LH + (B.LH - B.IT) / 2, B.IT, B.IT), zIndex: 3 }}>
          <Plinth size={B.IT} lit={hot === l.field}>
            <Ico3D name={nm(B_ICON[l.field])} size={23} loop={l.field === 0 ? 'beat' : l.field === 1 ? 'swing' : 'tilt'} t={l.field === 0 ? B.PER : undefined} d={l.field * 0.4} />
          </Plinth>
        </Show>
      ))}

      {/* the check: the kubelet calls the URL path on the container, every period */}
      <Node x={B.KX} y={B.KY} mark={kubeletMark} size={B.TS} label="Kubelet" />
      <W pts={B_WIRE} head={9} />
      <Rider cls={B_RIDE} icon="globe" size={26} />
      <Node x={B.KX} y={B.CY} icon="container" size={B.TS} label="Container" d={0.3}>
        <span aria-hidden className={held ? undefined : 's21d-tick'} style={{ position: 'absolute', left: B.TS - 3 - 13, top: 3 - 13, width: 26, height: 26, zIndex: 6, opacity: held ? 1 : undefined }}>
          <Disc x={13} y={13} icon="check" size={26} loop="none" />
        </span>
      </Node>
    </Frame>
  )
}

const tickCss = `@keyframes s21d-tick { 0%, 30% { opacity: 0; transform: scale(0.6) } 40% { opacity: 1; transform: scale(1.1) } 48%, 86% { opacity: 1; transform: scale(1) } 96%, 100% { opacity: 0; transform: scale(0.8) } }
.s21d-tick { animation: s21d-tick ${B.PER}s ease-out infinite; }`

/* ================================================================== slides 36-37 · D_T14 / D_T14B · the restart trace */

/*
 * One 546 x 320 stage for both frames (T14 sits centred in its 380 box). Lanes, each a label tile (x 38) with its tag
 * and a rail from x 146: Container (y 54), Liveness (y 136), Endpoints (y 218); the time axis at y 262 with ticks every
 * 10 s from t=0s (x 160) to t=40s (x 512), 8.8 px a second. The startup gate: a bar at 5 s (x 204) across the Liveness
 * and Endpoints lanes with the hourglass on its top end (y 95). Event times without their own TR number sit between
 * the TR's ticks: the restart just after 30 s (x 442), the readiness removal between 10 s and 20 s (x 292), the pass
 * and the rejoin before 40 s (x 486).
 *   T14  press 1 the start (play, `8080`), the container bar, the gate, both probe lanes live behind it
 *        press 2 three timed-out checks at 10s, 20s, 30s (stopwatch, orange)
 *        press 3 the restart: the container bar breaks, refresh (the container only; the other lanes run on)
 *   T14B press 4 the pod leaves the endpoints: dashed, faded, orange cross; no restart on the container lane
 *        press 5 the check passes, the pod rejoins (ticks); the endpoints bar is solid again
 * Loop: a playhead sweeps t=0s -> t=40s; each event it crosses pulses.
 */
const C = { W: 546, H: 320, LX: 38, LT: 36, RAIL0: 146, T0: 160, T40: 512, LANE: [54, 136, 218], AXY: 262, GX: 204, GY: 95, RX: 442, OUT: 292, BACK: 486, BAR: 8, PER: 5.6, SWEEP: 5.2 }
const tx = (sec: number) => C.T0 + ((C.T40 - C.T0) * sec) / 40
const C_TICKS = [0, 10, 20, 30, 40]
const C_FAILS = [10, 20, 30].map(tx)
/** the moment (in % of the loop) the playhead crosses x */
const at = (x: number) => (((x - C.T0) / (C.T40 - C.T0)) * C.SWEEP * 100) / C.PER
const C_EVENTS: { id: string; x: number; y: number }[] = [
  { id: 'go', x: C.T0, y: C.LANE[0] },
  { id: 'gate', x: C.GX, y: C.GY },
  ...C_FAILS.map((x, i) => ({ id: `f${i}`, x, y: C.LANE[1] })),
  { id: 'rs', x: C.RX, y: C.LANE[0] },
  { id: 'out', x: C.OUT, y: C.LANE[2] },
  { id: 'ok', x: C.BACK, y: C.LANE[1] },
  { id: 'in', x: C.BACK, y: C.LANE[2] },
]

/** a bar on a lane from x0 to x1 (centred on y), growing from its left end */
function Bar({ x0, x1, y, on, dashed = false, delay = 0, dim = false, rl = true, rr = true }: { x0: number; x1: number; y: number; on: boolean; dashed?: boolean; delay?: number; dim?: boolean; rl?: boolean; rr?: boolean }) {
  const instant = useInstant()
  const h = dashed ? 0 : C.BAR
  return (
    <span aria-hidden style={{ ...box(x0, y - (dashed ? 1.5 : h / 2), x1 - x0, dashed ? 3 : h), zIndex: 2, borderRadius: `${rl ? 99 : 0}px ${rr ? 99 : 0}px ${rr ? 99 : 0}px ${rl ? 99 : 0}px`, transformOrigin: 'left center', transform: on ? 'scaleX(1)' : 'scaleX(0)', opacity: on ? (dim ? 0.55 : 1) : 0, transition: instant ? 'none' : `transform 720ms ${EASE} ${on ? delay : 0}ms, opacity 420ms ${EASE} ${on ? delay : 0}ms`, ...(dashed ? { backgroundImage: `linear-gradient(90deg, ${colors.brand} 0 55%, transparent 55% 100%)`, backgroundSize: '11px 3px' } : { background: `linear-gradient(180deg, #5C86FF 0%, ${colors.brand} 55%, ${colors.brandDark} 100%)`, boxShadow: '0 3px 8px -4px rgba(31,64,140,0.6)' }) }} />
  )
}

/** a ring that flashes when the playhead crosses an event (centred on x, y) */
function Pulse({ id, x, y, on, size = 34 }: { id: string; x: number; y: number; on: boolean; size?: number }) {
  const held = useHeld()
  if (held || !on) return null
  return <span aria-hidden className={`s21d-p-${id}`} style={{ ...box(x - size / 2, y - size / 2, size, size), zIndex: 5, borderRadius: 99, boxShadow: `0 0 0 2px ${BLUE}88`, opacity: 0, pointerEvents: 'none' }} />
}

function Trace(p: Record<string, unknown>) {
  const { hot, s, held } = useBuild(p, 2000)
  const instant = useInstant()
  const out = s(4)
  const back = s(5)
  const lanes: { label: string; icon?: string; mark?: string; loop: Loop }[] = [
    { label: 'Container', icon: 'container', loop: 'bob' },
    { label: 'Liveness', icon: 'heartbeat', loop: 'beat' },
    { label: 'Endpoints', mark: epMark, loop: 'none' },
  ]
  const shown: Record<string, boolean> = { go: s(1), gate: s(1), f0: s(2), f1: s(2), f2: s(2), rs: s(3), out, ok: back, in: back }
  return (
    <Frame w={C.W} h={C.H}>
      {/* lanes: label tile + tag, a pale rail the full span */}
      {lanes.map((l, i) => (
        <div key={l.label}>
          <Node x={C.LX} y={C.LANE[i]} size={C.LT} icon={l.icon} mark={l.mark} label={l.label} loop={l.loop} t={l.loop === 'beat' ? 1.6 : undefined} d={i * 0.3}
            lit={(i === 0 && (hot === 0 || hot === 2)) || (i === 1 && (hot === 1 || hot === 4)) || (i === 2 && (hot === 3 || hot === 4))} />
          <span aria-hidden style={{ ...box(C.RAIL0, C.LANE[i] - 1.5, C.T40 + 14 - C.RAIL0, 3), zIndex: 1, borderRadius: 2, background: RAIL }} />
        </div>
      ))}

      {/* the time axis */}
      <span aria-hidden style={{ ...box(C.RAIL0, C.AXY - 1, C.T40 + 14 - C.RAIL0, 2), zIndex: 1, background: colors.brandDeep, opacity: 0.55, borderRadius: 1 }} />
      {C_TICKS.map((sec) => (
        <div key={sec}>
          <span aria-hidden style={{ ...box(tx(sec) - 1, C.AXY - 5, 2, 10), zIndex: 1, background: colors.brandDeep, opacity: 0.7, borderRadius: 1 }} />
          <span aria-hidden style={{ ...box(tx(sec), C.LANE[0] - 20, 0, C.AXY - C.LANE[0] + 15), zIndex: 0, borderLeft: `1px dashed ${RAIL}`, opacity: sec === 0 || sec === 40 ? 0 : 0.9 }} />
          <span style={{ ...box(tx(sec) - 30, C.AXY + 10, 60, 18), ...mono(13, colors.brandDeep), textAlign: 'center', zIndex: 2 }}>{sec === 0 || sec === 40 ? `t=${sec}s` : `${sec}s`}</span>
        </div>
      ))}

      {/* Container lane: starts on 8080 at t=0s (1); breaks for the restart (3) */}
      <Bar x0={C.T0} x1={C.RX - 10} y={C.LANE[0]} on={s(1)} delay={200} rr={false} />
      <span style={{ ...box(C.RX - 11, C.LANE[0] - C.BAR / 2, 22, C.BAR), zIndex: 2, background: `linear-gradient(180deg, #5C86FF 0%, ${colors.brand} 55%, ${colors.brandDark} 100%)`, opacity: s(1) && !s(3) ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE} ${s(1) && !s(3) ? 700 : 0}ms` }} />
      <Bar x0={C.RX + 10} x1={C.T40} y={C.LANE[0]} on={s(1)} delay={700} rl={false} />
      <Disc x={C.T0} y={C.LANE[0]} icon="play" size={28} loop="pulse" on={s(1)} />
      <Show on={s(1)} delay={200} style={{ ...box(C.T0 - 30, C.LANE[0] + 18, 60, 18), ...mono(13, colors.brandDark), textAlign: 'center', zIndex: 3 }}>8080</Show>
      <Disc x={C.RX} y={C.LANE[0]} icon="refresh" size={28} loop="spin" t={3.2} on={s(3)} />

      {/* the startup gate across the two probe lanes */}
      <span aria-hidden style={{ ...box(C.GX - 2, C.GY, 4, C.LANE[2] + 22 - C.GY), zIndex: 2, borderRadius: 2, background: hot === 0 ? ORANGE : colors.brandDark, opacity: s(1) ? 1 : 0, transformOrigin: 'top center', transform: s(1) ? 'scaleY(1)' : 'scaleY(0)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 620ms ${EASE}, background 420ms ${EASE}` }} />
      <Disc x={C.GX} y={C.GY} icon="hourglass" size={28} loop="tilt" on={s(1)} />

      {/* Liveness lane: live from the gate (1); three timed-out checks (2); the passing check (5) */}
      <Bar x0={C.GX + 2} x1={C.T40} y={C.LANE[1]} on={s(1)} delay={400} />
      {C_FAILS.map((x, i) => (
        <Disc key={i} x={x} y={C.LANE[1]} icon="stopwatch" size={30} ring loop="beat" d={i * 0.35} t={2.4} on={s(2)} />
      ))}
      <Disc x={C.BACK} y={C.LANE[1]} icon="check" size={28} on={back} />

      {/* Endpoints lane: in from the gate (1); removed, no restart (4); rejoined (5) */}
      <Bar x0={C.GX + 2} x1={C.OUT + 1} y={C.LANE[2]} on={s(1)} delay={400} rr={false} />
      <Bar x0={C.OUT} x1={C.BACK + 1} y={C.LANE[2]} on={s(1) && !out} delay={600} rl={false} rr={false} />
      <Bar x0={C.BACK} x1={C.T40} y={C.LANE[2]} on={(s(1) && !out) || back} delay={back ? 300 : 700} rl={false} />
      <Bar x0={C.OUT + 14} x1={C.BACK} y={C.LANE[2]} on={out} dashed dim delay={200} />
      <Bar x0={C.BACK} x1={C.T40} y={C.LANE[2]} on={out && !back} dashed dim delay={200} />
      <XAt x={C.OUT} y={C.LANE[2]} size={24} on={out} />
      <Disc x={C.BACK} y={C.LANE[2]} icon="check" size={28} on={back} d={0.4} />

      {/* the playhead and the pulses it sets off */}
      {s(1) && !held && (
        <span aria-hidden style={{ ...box(0, C.LANE[0] - 26, 2, C.AXY - C.LANE[0] + 26), zIndex: 4, pointerEvents: 'none' }}>
          <span className="s21d-head" style={{ display: 'block', width: 2, height: '100%', borderRadius: 1, background: `linear-gradient(180deg, ${BLUE}00 0%, ${BLUE}aa 30%, ${BLUE}aa 100%)`, opacity: 0 }} />
        </span>
      )}
      {C_EVENTS.map((e) => <Pulse key={e.id} id={e.id} x={e.x} y={e.y} on={shown[e.id]} />)}
    </Frame>
  )
}

const traceCss = [
  `@keyframes s21d-head { 0% { transform: translateX(${C.T0 - 1}px); opacity: 0 } 2% { opacity: 1 } ${((C.SWEEP / C.PER) * 100).toFixed(2)}% { transform: translateX(${C.T40 - 1}px); opacity: 1 } ${((C.SWEEP / C.PER) * 100 + 4).toFixed(2)}%, 100% { transform: translateX(${C.T40 - 1}px); opacity: 0 } }
.s21d-head { animation: s21d-head ${C.PER}s linear infinite; }`,
  ...C_EVENTS.map((e) => {
    const a = at(e.x)
    const a0 = Math.max(0, a - 0.5)
    return `@keyframes s21d-p-${e.id} { 0%, ${a0.toFixed(2)}% { transform: scale(0.8); opacity: 0 } ${(a0 + 1).toFixed(2)}% { transform: scale(0.85); opacity: 1 } ${Math.min(99, a0 + 12).toFixed(2)}%, 100% { transform: scale(1.45); opacity: 0 } }
.s21d-p-${e.id} { animation: s21d-p-${e.id} ${C.PER}s linear infinite; }`
  }),
].join('\n')

const D_T14: Fig = (p) => <Trace {...p} steps={p.steps ?? 3} />
const D_T14B: Fig = (p) => <Trace {...p} steps={p.steps ?? 2} from={3} />

export const figures: Record<string, Fig> = { D_T12, D_T13B, D_T14, D_T14B }

export const css = `
${K.css()}
${gcur}
${tickCss}
${traceCss}
.cc-still .s21d-gcur, .cc-still .s21d-gbar, .cc-still .s21d-gdisc, .cc-still .s21d-tick, .cc-still .s21d-head,
.deck-thumb .s21d-gcur, .deck-thumb .s21d-gbar, .deck-thumb .s21d-gdisc, .deck-thumb .s21d-tick, .deck-thumb .s21d-head { animation: none !important; }
.cc-still .s21d-tick, .deck-thumb .s21d-tick { opacity: 1 !important; transform: none !important; }
@media (prefers-reduced-motion: reduce) { .s21d-gcur, .s21d-gbar, .s21d-gdisc, .s21d-tick, .s21d-head { animation: none !important; } }
`
