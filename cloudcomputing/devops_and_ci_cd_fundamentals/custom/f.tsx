import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, Frame, Show, Plinth, MarkTile, Panel, Wire, Token, keyframes, tag, heading, useHeld, useHot, type Pt } from '@/engine/figkit'
import ghMark from '../images/tech-github.png'
import actionsMark from '../images/tech-githubactions.svg'

/*
 * SESSION 22 · SECTION 4 (Continuous Integration), TR 18 and TR 19 technical figures, builder F.
 * Built to generate-slides standing corrections 13-17: 3D icons on plinth tiles, official marks on white tiles, >= 20 px
 * equal padding, orthogonal wires from the same constants as the boxes, a flow dot on every live wire, the lit item
 * walking first -> last -> first after the build (S21 `useBuild`: the walk starts on the LAST item). Loops animate
 * transform / opacity on HTML elements only. Held (?still): the full picture, nothing lit, nothing moving. Failure is
 * the template orange (rule 51), never red. Class prefix `s22f-`.
 *
 *   slide 40 F_T18   566 x 380  GitHub repo -> Checkout -> Build (dependencies drop in) -> Test (Unit first) -> PR card,
 *                               a clock across the flow (Minutes) (3)
 *   slide 41 F_T18B  526 x 380  the same flow; the pass / fail badge lands on the PR card; Minutes vs Hours, the result
 *                               riding back to the developer (2)
 *   slide 42 F_T19   566 x 380  the broken main bar (orange, cracked), three teammates blocked, the CI cross; deploy held
 *                               at a gate; fix-forward and revert repairing the bar (3)
 *   slide 43 F_T19B  566 x 330  branch protection: a padlock on the merge until the CI badge turns to a tick; the GitHub
 *                               Actions status checks with the failing row (2)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('s22f')
const BLUE = colors.brand
const MONO = "'Fira Code', ui-monospace, monospace"
const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })
const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)

/** the build of a figure: the step, the lit item, held (S21 e.tsx: the walk starts on the LAST item) */
function useBuild(p: Record<string, unknown>, period: number) {
  const cnt = Number(p.steps ?? 1)
  const held = useHeld()
  const step = held ? cnt : stepOf(p)
  const raw = useHot(cnt, stepOf(p), period)
  const hot = raw >= 0 && stepOf(p) >= cnt ? (raw + cnt - 1) % cnt : raw
  return { step, hot, held, s: (n: number) => step >= n }
}

/* ------------------------------------------------------------------ loop keyframes (transform / opacity only) */

const KF: string[] = []
/** a keyframed loop on an HTML element: frames are [percent, css declarations] */
function loop(name: string, period: number, frames: [number, string][], ease = 'cubic-bezier(0.45,0,0.55,1)') {
  const cls = `s22f-${name}`
  KF.push(`@keyframes ${cls} { ${frames.map(([at, d]) => `${at}% { ${d} }`).join(' ')} }\n.${cls} { animation: ${cls} ${period}s ${ease} infinite; }`)
  return `${cls} s22f-a`
}
const op = (o: number) => `opacity: ${o}`

/* ------------------------------------------------------------------ pieces */

/** the engine's 3D cross turned to the template orange (blocked = orange, never red) */
const OrangeCross = ({ size }: { size: number }) => (
  <span style={{ display: 'grid', filter: 'hue-rotate(28deg) saturate(1.15) brightness(1.06)' }}>
    <Ico3D name="cross" size={size} loop="none" />
  </span>
)

/** a small white disc holding a 3D icon, centred on (x, y); `cls` runs an opacity loop on its outer span */
function Disc({ x, y, on = true, size = 28, icon = 'check', loop: lp = 'pulse', d = 0, t = 2.4, warn = false, cls, z = 6, style }: { x: number; y: number; on?: boolean; size?: number; icon?: Ico3DName; loop?: Loop; d?: number; t?: number; warn?: boolean; cls?: string; z?: number; style?: CSSProperties }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: z, opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}` }}>
      <span className={cls} style={{ position: 'absolute', inset: 0, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6', display: 'grid', placeItems: 'center', ...style }}>
        {warn ? <OrangeCross size={size - 6} /> : <Ico3D name={icon} size={size - 6} loop={lp} d={d} t={t} />}
      </span>
    </span>
  )
}

/** a wire on its own layer above the cards */
const W = (props: Parameters<typeof Wire>[0]) => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}><Wire {...props} /></div>
)

/** a 3D icon (or an official mark) on its tile with a tag under it; the TILE centred on (x, y) */
function Node({ x, y, label, icon, mark, size = 56, on = true, lit = false, loop: lp = 'bob', d = 0, t, w = 110, tagSize = 14, flip = false, delay = 0, children }: { x: number; y: number; label?: string; icon?: Ico3DName; mark?: string; size?: number; on?: boolean; lit?: boolean; loop?: Loop; d?: number; t?: number; w?: number; tagSize?: number; flip?: boolean; delay?: number; children?: ReactNode }) {
  const tile = mark ? <MarkTile src={mark} size={size} lit={lit} /> : (
    <Plinth size={size} lit={lit}>
      <span style={{ display: 'grid', transform: flip ? 'scaleX(-1)' : undefined }}><Ico3D name={icon ?? 'doc'} size={Math.round(size * 0.74)} loop={lp} d={d} t={t} /></span>
    </Plinth>
  )
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, top: y - size / 2, width: w, zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size, display: 'grid', placeItems: 'center' }}>
        {tile}
        {children}
      </div>
      {label && <span style={{ ...tag(tagSize), marginTop: 6 }}>{label}</span>}
    </Show>
  )
}

/** a grey placeholder line (a drawn page never carries invented text) */
const Bar = ({ x, y, w, tone = '#DCE4F4', h = 7 }: { x: number; y: number; w: number; tone?: string; h?: number }) => (
  <span aria-hidden style={{ ...box(x, y - h / 2, w, h), borderRadius: 9, background: tone, zIndex: 4 }} />
)

/** a drawn pull-request card: the GitHub mark and its tag, two line bars, a badge slot at the lower right */
function PrCard({ x, y, w, h, lit = false, children }: { x: number; y: number; w: number; h: number; lit?: boolean; children?: ReactNode }) {
  return (
    <>
      <Panel x={x} y={y} w={w} h={h} lit={lit} radius={16} />
      <div style={{ ...box(x + 14, y + 14, w - 28, 30), zIndex: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
        <MarkTile src={ghMark} size={30} scale={0.7} />
        <span style={{ ...heading(14), whiteSpace: 'nowrap' }}>Pull Request</span>
      </div>
      <Bar x={x + 16} y={y + 62} w={w - 32} />
      <Bar x={x + 16} y={y + 80} w={(w - 32) * 0.55} />
      {children}
    </>
  )
}

/** the crack in the main bar: a jagged orange-white split in its own small root svg (the svg itself pulses) */
const Crack = ({ x, y, cls }: { x: number; y: number; cls?: string }) => (
  <svg aria-hidden className={cls} width={26} height={34} viewBox="0 0 26 34" style={{ position: 'absolute', left: x - 13, top: y - 17, zIndex: 5, overflow: 'visible' }}>
    <path d="M14 0 L8 11 L16 15 L9 25 L13 34" fill="none" stroke="#FFFFFF" strokeWidth={4.2} strokeLinejoin="round" strokeLinecap="round" />
    <path d="M14 0 L8 11 L16 15 L9 25 L13 34" fill="none" stroke="#B4461A" strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
  </svg>
)

/** the main branch bar: orange and cracked while broken; a blue bar laid over it fades in when repaired */
function MainBar({ x, y, w, h = 22, broken = true, fixCls, crackCls, crackX, hideCls, lit = false }: { x: number; y: number; w: number; h?: number; broken?: boolean; fixCls?: string; crackCls?: string; crackX?: number; hideCls?: string; lit?: boolean }) {
  const instant = useInstant()
  const ORANGE_FILL = 'linear-gradient(180deg, #FFB27D 0%, #FF8A3D 55%, #E8642A 100%)'
  const BLUE_FILL = 'linear-gradient(180deg, #7FA4FF 0%, #2D63FB 100%)'
  return (
    <>
      <div style={{ ...box(x, y - h / 2, w, h), zIndex: 4, borderRadius: h / 2, background: broken ? ORANGE_FILL : BLUE_FILL, boxShadow: lit ? `0 0 0 3px #FFFFFF, 0 0 0 5px ${ORANGE}` : 'inset 0 -3px 6px -3px rgba(0,0,0,0.2), 0 8px 18px -10px rgba(31,64,140,0.5)', transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
        <span aria-hidden style={{ position: 'absolute', left: 12, right: 12, top: 3, height: 5, borderRadius: 9, background: 'rgba(255,255,255,0.45)' }} />
      </div>
      {broken && fixCls !== undefined && (
        <div aria-hidden className={fixCls} style={{ ...box(x, y - h / 2, w, h), zIndex: 4, borderRadius: h / 2, background: BLUE_FILL, opacity: 0 }}>
          <span aria-hidden style={{ position: 'absolute', left: 12, right: 12, top: 3, height: 5, borderRadius: 9, background: 'rgba(255,255,255,0.45)' }} />
        </div>
      )}
      {broken && <div className={hideCls} style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none' }}><Crack x={crackX ?? x + w / 2} y={y} cls={crackCls} /></div>}
    </>
  )
}

/** the branch name as code: `main` keeps its own form (mono, R8.4 identifiers) */
const CodeTag = ({ x, y, text }: { x: number; y: number; text: string }) => (
  <span style={{ position: 'absolute', left: x, top: y, zIndex: 4, fontFamily: MONO, fontVariantLigatures: 'none', fontSize: 14, fontWeight: 600, color: colors.brandDeep, whiteSpace: 'nowrap' }}>{text}</span>
)

/* ================================================================== slide 40 · F_T18 · checkout, build, test, PR, minutes */

/*
 * 566 x 380. The flow row at y 150 (tiles 60): Checkout x 80, Build x 210, Test x 340, the PR card x 410..546 (y 92..208).
 * The GitHub repo (y 50) feeds Checkout (press 1: a commit rides down). Two dependency packages drop into Build (press
 * 2). Under Test a rows card (x 270..410, y 214..294): Unit (stopwatch, first) then Integration (press 3). The clock
 * band at y 340: a bracket from Checkout's left edge to the PR card's right edge, the clock tile and `Minutes` on it.
 * Loop (6 s): the commit rides repo -> Checkout -> Build -> Test -> the PR card, wire by wire.
 */
const A = { W: 566, H: 380, Y: 150, T: 60, CX: 80, BX: 210, TX: 340, PRX: 410, PRY: 92, PRW: 136, PRH: 116, RY: 50, RC: [270, 214, 140, 80], CY: 340 }
const aL = (x: number) => x - A.T / 2
const aR = (x: number) => x + A.T / 2
const A_IN: Pt[] = [[A.CX, A.RY + 22], [A.CX, A.Y - A.T / 2]]
const A_W1: Pt[] = [[aR(A.CX), A.Y], [aL(A.BX), A.Y]]
const A_W2: Pt[] = [[aR(A.BX), A.Y], [aL(A.TX), A.Y]]
const A_W3: Pt[] = [[aR(A.TX), A.Y], [A.PRX, A.Y]]
const AP = 6
const A_R = [K.ride('t18a0', A_IN, 0.1, 0.9, AP), K.ride('t18a1', A_W1, 1.4, 2.1, AP), K.ride('t18a2', A_W2, 2.6, 3.3, AP), K.ride('t18a3', A_W3, 3.8, 4.5, AP)]
/* dependency packages dropping into the gear, one after the other */
const DROP = [0, 1].map((i) => loop(`drop${i}`, 3.2, [[0, 'transform: translateY(-6px); opacity: 0'], [10 + i * 30, 'transform: translateY(-6px); opacity: 1'], [36 + i * 30, 'transform: translateY(22px); opacity: 0'], [100, 'transform: translateY(22px); opacity: 0']]))
/* the Unit row runs first: its lamp blinks, then the Integration row's */
const RUN = [0, 1].map((i) => loop(`run${i}`, 3, [[0, op(0.25)], [i * 45 + 5, op(0.25)], [i * 45 + 15, op(1)], [i * 45 + 40, op(1)], [i * 45 + 50, op(0.25)], [100, op(0.25)]]))

function ClockBand({ x0, x1, y, cx, on = true, lit = false, label = 'Minutes' }: { x0: number; x1: number; y: number; cx: number; on?: boolean; lit?: boolean; label?: string }) {
  const c = lit ? ORANGE : '#9DB8FF'
  return (
    <Show on={on} style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
      <span aria-hidden style={{ ...box(x0, y - 1, x1 - x0, 2), background: c, borderRadius: 2 }} />
      <span aria-hidden style={{ ...box(x0, y - 9, 2, 18), background: c, borderRadius: 2 }} />
      <span aria-hidden style={{ ...box(x1 - 2, y - 9, 2, 18), background: c, borderRadius: 2 }} />
      <div style={{ position: 'absolute', left: cx - 22, top: y - 20, height: 40, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px 0 0', background: '#FFFFFF', borderRadius: 22, zIndex: 4 }}>
        <Plinth size={40} lit={lit}><Ico3D name="clock" size={30} loop="pulse" t={2.6} /></Plinth>
        <span style={tag(15)}>{label}</span>
      </div>
    </Show>
  )
}

const F_T18: Fig = (p) => {
  const { hot, s, held } = useBuild({ ...p, steps: p.steps ?? 3 }, 2600)
  const live = !held
  const [rx, ry, rw, rh] = A.RC
  return (
    <Frame w={A.W} h={A.H}>
      {/* the repository the commit is checked out from */}
      <Node x={A.CX} y={A.RY} mark={ghMark} size={44} />
      <W pts={A_IN} head={9} width={2.4} />
      {/* the flow */}
      <Node x={A.CX} y={A.Y} icon="download" size={A.T} label="Checkout" lit={hot === 0} loop="bob" />
      <W pts={A_W1} head={9} width={2.4} />
      <Node x={A.BX} y={A.Y} icon="gear" size={A.T} label="Build" lit={hot === 1} loop="spin" t={6} />
      <W pts={A_W2} head={9} width={2.4} />
      <Node x={A.TX} y={A.Y} icon="checklist" size={A.T} label="Test" lit={hot === 2} loop="bob" d={0.6} />
      <W pts={A_W3} head={9} width={2.4} />
      <PrCard x={A.PRX} y={A.PRY} w={A.PRW} h={A.PRH}>
        <Disc x={A.PRX + A.PRW - 30} y={A.PRY + A.PRH - 22} icon="hourglass" loop="swing" size={30} t={2.2} />
      </PrCard>
      {live && A_R.map((c) => <Token key={c} cls={c} size={10} />)}

      {/* point 2: dependencies installed fresh, dropping into the gear */}
      {[0, 1].map((i) => (
        <div key={i} style={{ ...box(A.BX - 34 + i * 40, 26, 28, 28), zIndex: 5, opacity: s(2) ? 1 : 0, transition: held ? 'none' : `opacity 420ms ${EASE}` }}>
          <span className={live ? DROP[i] : undefined} style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <Disc x={14} y={14} icon="package" size={28} loop="none" />
          </span>
        </div>
      ))}

      {/* point 3: unit tests first, then integration */}
      <Panel x={rx} y={ry} w={rw} h={rh} on={s(3)} lit={hot === 2} radius={14} />
      {[['stopwatch', 'Unit'], ['checklist', 'Integration']].map(([ic, t], i) => {
        const yy = ry + 22 + i * 36
        return (
          <Show key={t} on={s(3)} delay={i * 160} style={{ position: 'absolute', left: rx + 14, top: yy - 14, height: 28, zIndex: 5, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ position: 'relative', width: 26, height: 26 }}><Disc x={13} y={13} icon={ic as Ico3DName} size={26} loop={i === 0 ? 'pulse' : 'none'} t={1.6} /></span>
            <span style={{ ...tag(14), textAlign: 'left' }}>{t}</span>
            <span aria-hidden className={live && s(3) ? RUN[i] : undefined} style={{ width: 8, height: 8, borderRadius: 9, background: colors.success, opacity: held ? 1 : 0.25 }} />
          </Show>
        )
      })}

      {/* the clock: the whole loop takes minutes */}
      <ClockBand x0={aL(A.CX)} x1={A.PRX + A.PRW} y={A.CY} cx={250} />
    </Frame>
  )
}

/* ================================================================== slide 41 · F_T18B · the badge lands, minutes not hours */

/*
 * 526 x 380. The flow row at y 110 (tiles 56): Checkout x 60, Build x 165, Test x 270, the PR card x 330..506 (y 50..170).
 * Press 1: the badge lands on the card, a pass (tick) and, every second run, a fail (orange cross). Press 2: the result
 * rides back down the card's wire to the developer (x 60, y 312), and the Minutes / Hours panel (x 120..400, y 190..290)
 * lights: a short blue bar beside the clock, a long faded bar beside the hourglass. Loop (9 s): two runs, pass then fail.
 */
const B = { W: 526, H: 380, Y: 96, T: 56, CX: 60, BX: 165, TX: 270, PRX: 330, PRY: 36, PRW: 176, PRH: 120, DX: 60, DY: 298, FX: 466, PX: 120, PY: 176, PW: 280, PH: 100 }
const bL = (x: number) => x - B.T / 2
const bR = (x: number) => x + B.T / 2
const B_W1: Pt[] = [[bR(B.CX), B.Y], [bL(B.BX), B.Y]]
const B_W2: Pt[] = [[bR(B.BX), B.Y], [bL(B.TX), B.Y]]
const B_W3: Pt[] = [[bR(B.TX), B.Y], [B.PRX, B.Y]]
const B_BACK: Pt[] = [[B.FX, B.PRY + B.PRH], [B.FX, B.DY], [B.DX + 26, B.DY]]
const BP = 9
const B_R = [0, 4.5].flatMap((o, k) => [
  K.ride(`t18b1${k}`, B_W1, o + 0.1, o + 0.6, BP),
  K.ride(`t18b2${k}`, B_W2, o + 0.8, o + 1.3, BP),
  K.ride(`t18b3${k}`, B_W3, o + 1.5, o + 2.0, BP),
])
const B_BACKR = [K.ride('t18bb0', B_BACK, 2.4, 3.8, BP), K.ride('t18bb1', B_BACK, 6.9, 8.3, BP)]
/* the badge: pass for the first run, fail for the second */
const PASS = loop('pass', BP, [[0, 'opacity: 0; transform: scale(0.6)'], [23, 'opacity: 0; transform: scale(0.6)'], [27, 'opacity: 1; transform: scale(1)'], [47, 'opacity: 1; transform: scale(1)'], [50, 'opacity: 0; transform: scale(0.6)'], [100, 'opacity: 0; transform: scale(0.6)']])
const WAIT = loop('wait', BP, [[0, op(1)], [22, op(1)], [25, op(0)], [48, op(0)], [51, op(1)], [72, op(1)], [75, op(0)], [97.5, op(0)], [99.5, op(1)], [100, op(1)]])
const FAIL = loop('fail', BP, [[0, 'opacity: 0; transform: scale(0.6)'], [73, 'opacity: 0; transform: scale(0.6)'], [77, 'opacity: 1; transform: scale(1)'], [97, 'opacity: 1; transform: scale(1)'], [99.5, 'opacity: 0; transform: scale(0.6)'], [100, 'opacity: 0; transform: scale(0.6)']])
/* the short bar fills fast; the long one fills slowly and stays faded */
const FAST = loop('fast', 4, [[0, 'transform: scaleX(0.05)'], [25, 'transform: scaleX(1)'], [92, 'transform: scaleX(1)'], [100, 'transform: scaleX(0.05)']])
const SLOW = loop('slow', 4, [[0, 'transform: scaleX(0.05)'], [88, 'transform: scaleX(1)'], [94, 'transform: scaleX(1)'], [100, 'transform: scaleX(0.05)']], 'linear')

function SpanBar({ x, y, w, fill, cls, dim = false }: { x: number; y: number; w: number; fill: string; cls?: string; dim?: boolean }) {
  return (
    <div style={{ ...box(x, y - 8, w, 16), zIndex: 4, borderRadius: 9, background: '#EEF3FF', boxShadow: 'inset 0 0 0 1.5px #D3DEF6', overflow: 'hidden', opacity: dim ? 0.55 : 1 }}>
      <span className={cls} style={{ position: 'absolute', inset: 0, borderRadius: 9, background: fill, transformOrigin: '0 50%' }} />
    </div>
  )
}

const F_T18B: Fig = (p) => {
  const { hot, s, held } = useBuild({ ...p, steps: p.steps ?? 2 }, 2600)
  const live = !held
  const badgeX = B.PRX + B.PRW - 30
  const badgeY = B.PRY + B.PRH - 24
  return (
    <Frame w={B.W} h={B.H}>
      <Node x={B.CX} y={B.Y} icon="download" size={B.T} label="Checkout" />
      <W pts={B_W1} head={9} width={2.4} />
      <Node x={B.BX} y={B.Y} icon="gear" size={B.T} label="Build" loop="spin" t={6} />
      <W pts={B_W2} head={9} width={2.4} />
      <Node x={B.TX} y={B.Y} icon="checklist" size={B.T} label="Test" d={0.6} />
      <W pts={B_W3} head={9} width={2.4} />
      {live && B_R.map((c) => <Token key={c} cls={c} size={10} />)}

      {/* point 4: the result posted on the pull request, pass or fail */}
      <PrCard x={B.PRX} y={B.PRY} w={B.PRW} h={B.PRH} lit={hot === 0}>
        {!s(1) && <Disc x={badgeX} y={badgeY} icon="hourglass" loop="swing" size={32} t={2.2} />}
        {s(1) && held && <Disc x={badgeX} y={badgeY} icon="check" size={32} />}
        {s(1) && live && (
          <>
            <Disc x={badgeX} y={badgeY} icon="check" size={32} cls={PASS} style={{ opacity: 0 }} />
            <Disc x={badgeX} y={badgeY} warn size={32} cls={FAIL} style={{ opacity: 0 }} />
            <Disc x={badgeX} y={badgeY} icon="hourglass" loop="none" size={32} cls={WAIT} />
          </>
        )}
      </PrCard>

      {/* point 5: back to the developer in minutes, not hours */}
      <W pts={B_BACK} on={s(2)} head={9} width={2.4} lit={hot === 1} />
      {live && s(2) && B_BACKR.map((c) => <Token key={c} cls={c} size={10} />)}
      <Node x={B.DX} y={B.DY} icon="laptop" size={48} label="Developer" lit={hot === 1} d={0.3} />
      <Panel x={B.PX} y={B.PY} w={B.PW} h={B.PH} on={s(2)} lit={hot === 1} radius={16} />
      {[['clock', 'Minutes', 62, 'linear-gradient(90deg, #7FA4FF, #2D63FB)', FAST, false], ['hourglass', 'Hours', 128, 'linear-gradient(90deg, #DCE4F4, #B9C6E0)', SLOW, true]].map(([ic, t, bw, fill, cls, dim], i) => {
        const yy = B.PY + 28 + i * 44
        return (
          <Show key={t as string} on={s(2)} delay={i * 160} style={{ position: 'absolute', inset: 0, zIndex: 5, opacity: s(2) ? (dim ? 0.7 : 1) : 0 }}>
            <Disc x={B.PX + 34} y={yy} icon={ic as Ico3DName} size={32} loop={dim ? 'none' : 'pulse'} t={2.4} />
            <span style={{ ...tag(15), position: 'absolute', left: B.PX + 58, top: yy - 9, textAlign: 'left' }}>{t as string}</span>
            <SpanBar x={B.PX + 134} y={yy} w={bw as number} fill={fill as string} cls={live ? (cls as string) : undefined} dim={dim as boolean} />
          </Show>
        )
      })}
    </Frame>
  )
}

/* ================================================================== slide 42 · F_T19 · the broken main branch */

/*
 * 566 x 380. The main bar (x 90..526, y 190, orange and cracked) with the CI cross at its left (x 52). Three teammates
 * (y 52, x 150 / 308 / 466), each a dashed blocked wire down to the bar with an orange cross on it. Press 1: each
 * teammate's pull inherits the break (an orange alert on each tile). Press 2: the deploy wire from the bar to the gate
 * (x 400, y 300), the rocket (x 500) held behind it. Press 3: fix-forward (wrench, x 130) and revert (x 250) wires up
 * into the bar; loop (8 s): the repair token rides, the bar turns blue and the crack closes, then it breaks again.
 */
const C = { W: 566, H: 380, BX: 90, BW: 436, BY: 190, BH: 22, DY: 52, DXS: [150, 308, 466], GX: 400, RX: 500, LY: 300, FX: 130, VX: 250, CIX: 50 }
const cTop = C.BY - C.BH / 2
const cBot = C.BY + C.BH / 2
const C_FIX: Pt[] = [[C.FX, C.LY - 28], [C.FX, cBot]]
const C_REV: Pt[] = [[C.VX, C.LY - 28], [C.VX, cBot]]
const C_DEP: Pt[] = [[C.GX, cBot], [C.GX, C.LY - 28]]
const C_HOLD: Pt[] = [[C.GX + 28, C.LY], [C.RX - 28, C.LY]]
const CP = 8
const C_FIXR = K.ride('t19fix', C_FIX, 1.6, 2.6, CP)
const C_REVR = K.ride('t19rev', C_REV, 2.0, 3.0, CP)
const C_DEPR = K.ride('t19dep', C_DEP, 0.1, 0.9, 3.2)
const C_PULL = C.DXS.map((x, i) => K.ride(`t19pull${i}`, [[x, cTop - 4], [x, C.DY + 34]], 0.2 + i * 0.35, 1.0 + i * 0.35, 3.2))
/* the repair: the blue bar over the orange one, the crack and the CI cross fading while repaired */
const FIXED = loop('fixed', CP, [[0, op(0)], [34, op(0)], [40, op(1)], [82, op(1)], [88, op(0)], [100, op(0)]])
const BROKEN = loop('broken', CP, [[0, op(1)], [34, op(1)], [40, op(0)], [82, op(0)], [88, op(1)], [100, op(1)]])
const CRACK = loop('crack', 2.4, [[0, 'transform: scale(0.94)'], [50, 'transform: scale(1.08)'], [100, 'transform: scale(0.94)']])
const ALERT = C.DXS.map((_, i) => loop(`alert${i}`, 3.2, [[0, 'transform: scale(0.85)'], [12 + i * 11, 'transform: scale(0.85)'], [20 + i * 11, 'transform: scale(1.12)'], [32 + i * 11, 'transform: scale(1)'], [100, 'transform: scale(0.85)']]))

const F_T19: Fig = (p) => {
  const { hot, s, held } = useBuild({ ...p, steps: p.steps ?? 3 }, 2600)
  const live = !held
  const cycle = live && s(3)
  return (
    <Frame w={C.W} h={C.H}>
      {/* the broken main bar and the CI cross */}
      <MainBar x={C.BX} y={C.BY} w={C.BW} h={C.BH} fixCls={cycle ? FIXED : undefined} crackCls={live ? CRACK : undefined} crackX={352} hideCls={cycle ? BROKEN : undefined} />
      <CodeTag x={C.BX + C.BW - 44} y={cBot + 8} text="main" />
      <div className={cycle ? BROKEN : undefined} style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none' }}>
        <Disc x={C.CIX} y={C.BY} warn size={34} />
      </div>
      {cycle && (
        <div className={FIXED} style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none', opacity: 0 }}>
          <Disc x={C.CIX} y={C.BY} icon="check" size={34} />
        </div>
      )}
      <span style={{ ...tag(14), position: 'absolute', left: C.CIX - 20, width: 40, top: C.BY + 22, zIndex: 4 }}>CI</span>

      {/* three teammates, each blocked from merging; point 1: each pull inherits the break */}
      {C.DXS.map((x, i) => (
        <div key={x}>
          <Node x={x} y={C.DY} icon="user" size={48} label="Teammate" lit={hot === 0} d={i * 0.5}>
            <span className={cycle ? BROKEN : undefined} style={{ position: 'absolute', right: -10, top: -10, width: 24, height: 24, zIndex: 7 }}>
            <span className={live && s(1) ? ALERT[i] : undefined} style={{ position: 'absolute', inset: 0, opacity: s(1) ? 1 : 0, transition: held ? 'none' : `opacity 420ms ${EASE}` }}>
              <span style={{ position: 'absolute', inset: 0, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6)', display: 'grid', placeItems: 'center' }}>
                <Ico3D name="alert" size={18} loop="none" />
              </span>
            </span>
            </span>
          </Node>
          <W pts={[[x, C.DY + 52], [x, cTop - 2]]} head={8} width={2.2} dash="5 6" opacity={0.55} />
          <div className={cycle ? BROKEN : undefined} style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none' }}><Disc x={x} y={(C.DY + 52 + cTop) / 2 + 2} warn size={26} /></div>
          {live && s(1) && <div className={cycle ? BROKEN : undefined} style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none' }}><Token cls={C_PULL[i]} tone={ORANGE} size={9} /></div>}
        </div>
      ))}

      {/* point 2: deployments pause, the rocket held at a gate */}
      <W pts={C_DEP} on={s(2)} head={9} width={2.4} lit={hot === 1} />
      {live && s(2) && <Token cls={C_DEPR} tone={ORANGE} size={9} />}
      <Node x={C.GX} y={C.LY} icon="gate" size={56} label="Gate" on={s(2)} lit={hot === 1} />
      <W pts={C_HOLD} on={s(2)} head={8} width={2.2} dash="5 6" opacity={0.55} />
      <div className={cycle ? BROKEN : undefined} style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none' }}><Disc x={(C.GX + C.RX) / 2} y={C.LY} warn size={24} on={s(2)} /></div>
      <Node x={C.RX} y={C.LY} icon="rocket" size={56} label="Deploy" on={s(2)} lit={hot === 1} loop="float" />

      {/* point 3: fix-forward or revert, the bar repaired */}
      <W pts={C_FIX} on={s(3)} head={9} width={2.4} lit={hot === 2} />
      <W pts={C_REV} on={s(3)} head={9} width={2.4} lit={hot === 2} />
      {cycle && <Token cls={C_FIXR} size={10} />}
      {cycle && <Token cls={C_REVR} size={10} />}
      <Node x={C.FX} y={C.LY} icon="wrench" size={56} label="Fix-Forward" on={s(3)} lit={hot === 2} loop="tilt" />
      <Node x={C.VX} y={C.LY} icon="refresh" size={56} label="Revert" on={s(3)} lit={hot === 2} flip loop="pulse" />
    </Frame>
  )
}

/* ================================================================== slide 43 · F_T19B · branch protection, failing check */

/*
 * 566 x 330. A feature branch (x 80, y 76) whose merge wire runs right to x 200 and down into the main bar (x 40..526,
 * y 262). On the wire a padlock (x 200, y 170) beside the CI badge (x 246). Press 1: the protection: the padlock holds
 * while the badge shows the cross; loop (7 s): the badge turns to a tick, the padlock opens, the merge rides into main,
 * then the next change locks it again. Press 2: the GitHub Actions status checks panel (x 300..546, y 30..214): three
 * check rows, the middle one failing (orange cross), turning to a tick with the badge.
 */
const D = { W: 566, H: 330, FX: 80, FY: 76, MX: 200, LY: 160, CIX: 250, BX: 40, BW: 486, BY: 262, BH: 20, PX: 300, PY: 30, PW: 246, PH: 184 }
const dTop = D.BY - D.BH / 2
const D_MERGE: Pt[] = [[D.FX + 28, D.FY], [D.MX, D.FY], [D.MX, dTop]]
const DP = 7
const D_MERGER = K.ride('t19bm', D_MERGE, 3.9, 5.6, DP)
const SHUT = loop('shut', DP, [[0, op(1)], [46, op(1)], [52, op(0)], [90, op(0)], [96, op(1)], [100, op(1)]])
const OPEN = loop('open', DP, [[0, op(0)], [46, op(0)], [52, op(1)], [90, op(1)], [96, op(0)], [100, op(0)]])

const F_T19B: Fig = (p) => {
  const { hot, s, held } = useBuild({ ...p, steps: p.steps ?? 2 }, 2800)
  const live = !held
  const cyc = live && s(1)
  const swap = (a: ReactNode, b: ReactNode) => (
    cyc ? (
      <>
        <div className={SHUT} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>{a}</div>
        <div className={OPEN} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0 }}>{b}</div>
      </>
    ) : a
  )
  return (
    <Frame w={D.W} h={D.H}>
      {/* the change and the protected merge into main */}
      <Node x={D.FX} y={D.FY} icon="branch" size={56} label="Branch" />
      <W pts={D_MERGE} head={9} width={2.4} lit={hot === 0} />
      {cyc && <Token cls={D_MERGER} size={10} />}
      <MainBar x={D.BX} y={D.BY} w={D.BW} h={D.BH} broken={false} />
      <CodeTag x={D.BX + 4} y={D.BY + D.BH / 2 + 8} text="main" />

      {/* point 4: the padlock holds until CI passes */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none' }}>
        {swap(
          <>
            <Disc x={D.MX} y={D.LY} icon="lock" size={44} on={s(1)} loop="pulse" />
            <Disc x={D.CIX} y={D.LY} warn size={34} on={s(1)} />
          </>,
          <>
            <Disc x={D.MX} y={D.LY} icon="unlock" size={44} loop="pulse" />
            <Disc x={D.CIX} y={D.LY} icon="check" size={34} />
          </>,
        )}
      </div>
      <Show on={s(1)} style={{ position: 'absolute', left: D.CIX - 20, width: 40, top: D.LY + 22, zIndex: 4 }}>
        <span style={{ ...tag(14), display: 'block' }}>CI</span>
      </Show>

      {/* point 5: the failing status check on GitHub Actions */}
      <Panel x={D.PX} y={D.PY} w={D.PW} h={D.PH} on={s(2)} lit={hot === 1} radius={16} />
      <Show on={s(2)} style={{ position: 'absolute', inset: 0, zIndex: 5 }}>
        <div style={{ ...box(D.PX + 16, D.PY + 16, D.PW - 32, 34), display: 'flex', alignItems: 'center', gap: 10 }}>
          <MarkTile src={actionsMark} size={34} scale={0.82} />
          <span style={{ ...heading(15), whiteSpace: 'nowrap' }}>GitHub Actions</span>
        </div>
        {[0, 1, 2].map((i) => {
          const yy = D.PY + 82 + i * 40
          const failing = i === 1
          return (
            <div key={i}>
              {failing ? swap(
                <>
                  <span aria-hidden style={{ ...box(D.PX + 16, yy - 16, D.PW - 32, 32), borderRadius: 10, background: '#FFF4EC', boxShadow: 'inset 0 0 0 1.5px #FFD2B0' }} />
                  <Disc x={D.PX + 36} y={yy} warn size={24} />
                  <Bar x={D.PX + 58} y={yy} w={120} tone="#FFD2B0" />
                </>,
                <>
                  <span aria-hidden style={{ ...box(D.PX + 16, yy - 16, D.PW - 32, 32), borderRadius: 10, background: '#F5F8FF', boxShadow: 'inset 0 0 0 1.5px #E3EAF8' }} />
                  <Disc x={D.PX + 36} y={yy} icon="check" size={24} />
                  <Bar x={D.PX + 58} y={yy} w={120} />
                </>,
              ) : (
                <>
                  <span aria-hidden style={{ ...box(D.PX + 16, yy - 16, D.PW - 32, 32), borderRadius: 10, background: '#F5F8FF', boxShadow: 'inset 0 0 0 1.5px #E3EAF8' }} />
                  <Disc x={D.PX + 36} y={yy} icon="check" size={24} d={i * 0.7} />
                  <Bar x={D.PX + 58} y={yy} w={i === 0 ? 150 : 100} />
                </>
              )}
            </div>
          )
        })}
      </Show>
    </Frame>
  )
}

export const figures: Record<string, Fig> = { F_T18, F_T18B, F_T19, F_T19B }
export const css = [
  K.css(),
  KF.join('\n'),
  '.cc-still .s22f-a, .deck-thumb .s22f-a { animation: none !important; }',
  '@media (prefers-reduced-motion: reduce) { .s22f-a { animation: none !important; } }',
].join('\n')
