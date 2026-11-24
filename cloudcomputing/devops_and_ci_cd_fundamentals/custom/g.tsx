import { type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, Frame, Show, Plinth, Panel, Wire, Token, Pair, keyframes, tag, useHeld, useHot, type Pt } from '@/engine/figkit'

/*
 * SESSION 22 · SECTION 5 (Delivery & Artifacts), TR 20 and TR 21 technical figures, builder G.
 * Generate-slides standing corrections 13-17: 3D icons on plinth tiles, >= 20 px padding inside every card, orthogonal
 * wires from the same constants as the boxes, a flow dot on every live wire, the lit item walking first -> last ->
 * first after the build, starting on the LAST item (S21 `useBuild`). Loops are transform / opacity on HTML elements
 * only. Held (?still): the full picture, nothing lit, nothing moving. Class prefix `s22g-`.
 *
 *   slide 45 G_T20   540 x 360  one artifact walking Dev -> Staging -> gate -> Production; point 1 the gate waits for
 *                               a person's release button (Manual), point 2 it passes on its own (Automatic, rocket) (2)
 *   slide 46 G_T20B  540 x 360  the same row; point 1 one Build gear makes the one artifact, a struck-out Rebuild;
 *                               point 2 the same artifact badge on all three environments, Promotion (2)
 *   slide 47 G_T21   520 x 360  two lanes: Delivery (Build, Test, Approval, Production) over Deployment (Build, Test,
 *                               Production); point 1 the top token waits at Approval, point 2 the bottom flows (2)
 *   slide 48 G_T21B  520 x 360  the lanes; point 1 one Same Tests tile feeding both Test stages; point 2 a Coverage meter
 *                               on the Deployment lane (2)
 *   slide 49 G_T21C  520 x 360  the lanes; point 1 Frequency: the top Production releases once, the bottom three times
 *                               a cycle (rockets); point 2 Set-Up: Approval on top, None below (2)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('s22g')
const GREEN = colors.success
const EZ = 'cubic-bezier(0.45,0,0.55,1)'
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

/* ------------------------------------------------------------------ keyframe helpers (all transform / opacity) */

const KF: string[] = []
/** translateX keyframes ([percent, x px, opacity]) on a `period`-second loop */
function moveX(name: string, period: number, frames: [number, number, number][]) {
  const cls = `s22g-${name}`
  KF.push(`@keyframes ${cls} { ${frames.map(([a, x, o]) => `${a}% { transform: translateX(${x}px); opacity: ${o} }`).join(' ')} }\n.${cls} { animation: ${cls} ${period}s ${EZ} infinite; }`)
  return `${cls} s22g-a`
}
function fade(name: string, period: number, frames: [number, number][]) {
  const cls = `s22g-${name}`
  KF.push(`@keyframes ${cls} { ${frames.map(([a, o]) => `${a}% { opacity: ${o} }`).join(' ')} }\n.${cls} { animation: ${cls} ${period}s ${EZ} infinite; }`)
  return `${cls} s22g-a`
}
function pop(name: string, period: number, frames: [number, number, number][]) {
  const cls = `s22g-${name}`
  KF.push(`@keyframes ${cls} { ${frames.map(([a, k, o]) => `${a}% { transform: scale(${k}); opacity: ${o} }`).join(' ')} }\n.${cls} { animation: ${cls} ${period}s ${EZ} infinite; }`)
  return `${cls} s22g-a`
}

/* ------------------------------------------------------------------ pieces */

/** the engine's 3D cross turned to the template's orange (refused = orange, never red; S21 e.tsx) */
const OrangeCross = ({ size }: { size: number }) => (
  <span style={{ display: 'grid', filter: 'hue-rotate(28deg) saturate(1.15) brightness(1.06)' }}>
    <Ico3D name="cross" size={size} loop="none" />
  </span>
)

/** a small white disc holding a 3D icon, centred on (x, y) */
function Disc({ x, y, size = 26, icon, loop = 'pulse', d = 0, cls, cross = false, z = 6, style }: { x: number; y: number; size?: number; icon?: Ico3DName; loop?: Loop; d?: number; cls?: string; cross?: boolean; z?: number; style?: CSSProperties }) {
  return (
    <span className={cls} style={{ ...box(x - size / 2, y - size / 2, size, size), zIndex: z, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6', display: 'grid', placeItems: 'center', ...style }}>
      {cross ? <OrangeCross size={size - 6} /> : icon ? <Ico3D name={icon} size={size - 6} loop={loop} d={d} /> : null}
    </span>
  )
}

/** a 3D icon on its plinth with a one-word tag under it, the TILE centred on (x, y) */
function Node({ x, y, icon, label, size = 52, lit = false, loop = 'bob', d = 0, t, w = 100, on = true, delay = 0, dim = false, children, pair }: { x: number; y: number; icon: Ico3DName; label?: string; size?: number; lit?: boolean; loop?: Loop; d?: number; t?: number; w?: number; on?: boolean; delay?: number; dim?: boolean; children?: ReactNode; pair?: Ico3DName }) {
  const instant = useInstant()
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, top: y - size / 2, width: w, zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: size, height: size, opacity: dim ? 0.45 : 1, transition: instant ? 'none' : `opacity 420ms ${EASE}` }}>
        <Plinth size={size} lit={lit}>
          {pair ? <Pair main={icon} over={pair} size={Math.round(size * 0.66)} k={0.48} loop={loop} d={d} /> : <Ico3D name={icon} size={Math.round(size * 0.74)} loop={loop} d={d} t={t} />}
        </Plinth>
        {children}
      </div>
      {label && <span style={{ ...tag(14), opacity: dim ? 0.6 : 1 }}>{label}</span>}
    </Show>
  )
}

/** a wire on its own layer above the cards (a Panel is z 2 and would hide a wire drawn inside it) */
const W = (props: Parameters<typeof Wire>[0]) => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}><Wire {...props} /></div>
)

/* ================================================================== TR 20 · the environment row (G_T20, G_T20B) */

/*
 * 540 x 360. The artifact lane (y 64) above the row; environment tiles (76) centred on y 168 with their tags under;
 * the gate tile (52) between Staging and Production, its tag ABOVE it (the manual wire arrives from below); the point
 * row (tiles 52) on y 296. The artifact is one package tile moving along the lane (translateX on an HTML element),
 * hovering over the environment it is in. One cycle is 5 s, the same as the lit walk, so each lit item plays its
 * own cycle: Manual waits at the gate for the release button, Automatic passes straight through.
 */
const R = { W: 540, H: 360, LANE: 64, ROW: 168, ES: 76, GS: 52, PROW: 296, PS: 52, DEV: 80, STG: 225, GATE: 340, PROD: 455, PKG: 44, CYC: 5 }
const ENVS: { x: number; icon: Ico3DName; label: string }[] = [
  { x: R.DEV, icon: 'code', label: 'Dev' },
  { x: R.STG, icon: 'replica', label: 'Staging' },
  { x: R.PROD, icon: 'users', label: 'Production' },
]
const R_WIRES: Pt[][] = [
  [[R.DEV + R.ES / 2, R.ROW], [R.STG - R.ES / 2, R.ROW]],
  [[R.STG + R.ES / 2, R.ROW], [R.GATE - R.GS / 2, R.ROW]],
  [[R.GATE + R.GS / 2, R.ROW], [R.PROD - R.ES / 2, R.ROW]],
]
const R_RIDES = R_WIRES.map((w, i) => K.ride(`rw${i}`, w, 0.1, 1.2, 2.4))
/* the release button's wire, from the Manual group up to the gate's bottom edge */
const R_BTN_X = R.GATE + 34
const R_UP: Pt[] = [[R_BTN_X, R.PROW - R.PS / 2], [R_BTN_X, R.PROW - 60], [R.GATE, R.PROW - 60], [R.GATE, R.ROW + R.GS / 2]]
const R_UPR = K.ride('rup', R_UP, 2.55, 3.05, R.CYC)
const ART = R.PKG / 2
/* Manual (continuous delivery): Dev, Staging, wait at the gate for the press, Production */
const ART_MAN = moveX('art-man', R.CYC, [[0, R.DEV - ART, 0], [5, R.DEV - ART, 1], [20, R.STG - ART, 1], [28, R.STG - ART, 1], [40, R.GATE - ART, 1], [64, R.GATE - ART, 1], [78, R.PROD - ART, 1], [93, R.PROD - ART, 1], [97, R.PROD - ART, 0], [100, R.DEV - ART, 0]])
/* Automatic (continuous deployment): no stop at the gate */
const ART_AUTO = moveX('art-auto', R.CYC, [[0, R.DEV - ART, 0], [5, R.DEV - ART, 1], [20, R.STG - ART, 1], [28, R.STG - ART, 1], [54, R.PROD - ART, 1], [93, R.PROD - ART, 1], [97, R.PROD - ART, 0], [100, R.DEV - ART, 0]])
const GATE_LOCK = fade('lock', R.CYC, [[0, 1], [60, 1], [63, 0], [96, 0], [99, 1], [100, 1]])
const GATE_OPEN = fade('open', R.CYC, [[0, 0], [60, 0], [63, 1], [96, 1], [99, 0], [100, 0]])
const BTN_PRESS = pop('press', R.CYC, [[0, 1, 1], [48, 1, 1], [52, 0.86, 1], [57, 1, 1], [100, 1, 1]])
const ROCKET_POP = pop('launch', R.CYC, [[0, 0.6, 0], [54, 0.6, 0], [60, 1.12, 1], [66, 1, 1], [90, 1, 1], [96, 0.6, 0], [100, 0.6, 0]])
/* T20-B: the artifact leaves the Build gear (above Dev's left) first */
const R_GEAR_X = 34
const ART_BUILD = moveX('art-build', R.CYC, [[0, R_GEAR_X - ART, 0], [6, R_GEAR_X - ART, 1], [14, R.DEV - ART, 1], [24, R.DEV - ART, 1], [36, R.STG - ART, 1], [46, R.STG - ART, 1], [70, R.PROD - ART, 1], [93, R.PROD - ART, 1], [97, R.PROD - ART, 0], [100, R_GEAR_X - ART, 0]])
const BADGE_AT = [R.DEV, R.STG, R.PROD]

/** the row both TR 20 frames share: three environments, the gate, the wires and their flow dots */
function EnvRow({ lit = [] as number[], badges = false, gate, held }: { lit?: number[]; badges?: boolean; gate: 'cycle' | 'open'; held: boolean }) {
  const cycle = gate === 'cycle' && !held
  return (
    <>
      {ENVS.map((e, i) => (
        <Node key={e.label} x={e.x} y={R.ROW} icon={e.icon} label={e.label} size={R.ES} lit={lit.includes(i)} d={i * 0.6} w={120}>
          <Show on={badges} delay={i * 180} style={{ position: 'absolute', right: -9, top: -9, width: 28, height: 28, zIndex: 6 }}>
            <Disc x={14} y={14} size={28} icon="package" d={0.2} />
          </Show>
        </Node>
      ))}
      {/* the gate: tag above, a padlock disc while closed and a check disc once open */}
      <div style={{ ...box(R.GATE - 50, R.ROW - R.GS / 2 - 26, 100, 20), zIndex: 4, display: 'grid', placeItems: 'center' }}><span style={tag(14)}>Gate</span></div>
      <div style={{ ...box(R.GATE - R.GS / 2, R.ROW - R.GS / 2, R.GS, R.GS), zIndex: 4 }}>
        <Plinth size={R.GS} lit={lit.includes(3)}><Ico3D name="gate" size={38} loop="tilt" /></Plinth>
        {gate === 'cycle' && <Disc x={R.GS - 2} y={2} size={24} icon="lock" cls={cycle ? GATE_LOCK : undefined} loop="none" />}
        {(cycle || gate === 'open') && <Disc x={R.GS - 2} y={2} size={24} icon="check" cls={cycle ? GATE_OPEN : undefined} style={{ opacity: cycle ? 0 : 1 }} loop="none" />}
      </div>
      {R_WIRES.map((w, i) => <W key={i} pts={w} head={9} />)}
      {R_RIDES.map((c, i) => <Token key={i} cls={c} size={8} />)}
    </>
  )
}

/** the artifact: one package tile on the lane; `cls` moves it, held it stands over Staging */
function Artifact({ cls, held, lit = false, x = R.STG }: { cls?: string; held: boolean; lit?: boolean; x?: number }) {
  return (
    <div className={held ? undefined : cls} style={{ ...box(0, R.LANE - R.PKG / 2, R.PKG, R.PKG), zIndex: 7, transform: `translateX(${x - ART}px)` }}>
      <Plinth size={R.PKG} lit={lit}><Ico3D name="package" size={32} loop="bob" t={2.6} /></Plinth>
      <span style={{ ...tag(13), position: 'absolute', left: -28, width: R.PKG + 56, top: R.PKG + 4 }}>Artifact</span>
    </div>
  )
}

const G_T20: Fig = (p) => {
  const { hot, held, s } = useBuild(p, R.CYC * 1000)
  const auto = hot === 1
  return (
    <Frame w={R.W} h={R.H}>
      {/* in Automatic the gate stands open the whole cycle */}
      <EnvRow held={held} lit={hot === 0 ? [3] : []} gate={auto ? 'open' : 'cycle'} />
      <Artifact key={auto ? 'a' : 'm'} cls={auto ? ART_AUTO : ART_MAN} held={held} />

      {/* point 1: a person with the release button, wired up to the gate */}
      <Node x={R.GATE - 34} y={R.PROW} icon="user" size={R.PS} w={70} lit={hot === 0} dim={auto} d={0.3} />
      <div style={{ ...box(R_BTN_X - R.PS / 2, R.PROW - R.PS / 2, R.PS, R.PS), zIndex: 4, opacity: auto ? 0.45 : 1, transition: `opacity 420ms ${EASE}` }}>
        <div className={held || auto ? undefined : BTN_PRESS} style={{ width: R.PS, height: R.PS }}>
          <Plinth size={R.PS} lit={hot === 0}><Ico3D name="play" size={36} loop="none" /></Plinth>
        </div>
      </div>
      <div style={{ ...box(R.GATE - 60, R.PROW + R.PS / 2 + 6, 120, 18), zIndex: 4, display: 'grid', placeItems: 'center', opacity: auto ? 0.6 : 1 }}><span style={tag(14)}>Manual</span></div>
      <W pts={R_UP} head={8} width={2.2} opacity={auto ? 0.4 : 1} />
      {!auto && <Token cls={R_UPR} size={8} tone={ORANGE} />}

      {/* point 2: Automatic, the rocket under Production launches as the artifact arrives */}
      <Show on={s(2)} style={{ ...box(R.PROD - 50, R.PROW - R.PS / 2, 100, R.PS + 26), zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ position: 'relative', width: R.PS, height: R.PS }}>
          <Plinth size={R.PS} lit={hot === 1}><Ico3D name="rocket" size={38} loop="bob" t={2.2} /></Plinth>
          {auto && !held && <span className={ROCKET_POP} style={{ position: 'absolute', inset: -6, borderRadius: 20, boxShadow: `0 0 0 3px ${GREEN}66`, opacity: 0 }} />}
        </div>
        <span style={tag(14)}>Automatic</span>
      </Show>
    </Frame>
  )
}

const G_T20B: Fig = (p) => {
  const { hot, held, s } = useBuild(p, R.CYC * 1000)
  return (
    <Frame w={R.W} h={R.H}>
      <EnvRow held={held} badges={s(2)} lit={hot === 1 ? [0, 1, 2] : []} gate="open" />
      {/* point 1: the ONE Build gear the artifact leaves, at the lane's start */}
      <Show on style={{ ...box(R_GEAR_X - 30, R.LANE - 24, 60, 72), zIndex: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <Plinth size={48} lit={hot === 0}><Ico3D name="gear" size={34} loop="spin" t={6} /></Plinth>
        <span style={tag(13)}>Build</span>
      </Show>
      <Artifact cls={ART_BUILD} held={held} lit={hot === 0} />
      {/* a rebuild per environment never happens: the second gear struck out */}
      <Node x={150} y={R.PROW} icon="gear" label="Rebuild" size={R.PS} on={s(1)} dim loop="none" w={100}>
        <Disc x={R.PS - 2} y={2} size={26} cross z={7} />
      </Node>
      {/* point 2: the same artifact promoted through every environment */}
      <Node x={400} y={R.PROW} icon="layers" label="Promotion" size={R.PS} on={s(2)} lit={hot === 1} d={0.4} w={110} />
    </Frame>
  )
}

/* ================================================================== TR 21 · the two lanes (G_T21, G_T21B, G_T21C) */

/*
 * 520 x 360. Two lane cards (0..520, 120 tall): Delivery on y 14, Deployment on y 226, the 92 px between them holding
 * the frame's shared pieces (Same Tests on T21-B; Set-Up and Frequency on T21-C). In each card: the lane's icon at
 * x 65 (a person for Delivery, a bot for Deployment) (moved from 44, 2026-11-24, so the Deployment tag has padding on the card) with its tag, then the stages Build 150, Test 250, Approval 355
 * (Delivery only), Production 460, tiles 52 on the card's y0 + 48. Every wire runs tile edge to tile edge.
 * One cycle is 6 s: the Delivery token stops at Approval until the check lands, the Deployment token flows straight
 * through (three times a cycle on T21-C, several releases a day).
 */
const L = { W: 520, H: 360, Y: [14, 226], LH: 120, TS: 52, IX: 65, IS: 48, BUILD: 150, TEST: 250, APP: 355, PROD: 460, CYC: 6 }
const ly = (k: number) => L.Y[k] + 48
const LANE_W: Pt[][][] = [
  [[[L.BUILD + 26, ly(0)], [L.TEST - 26, ly(0)]], [[L.TEST + 26, ly(0)], [L.APP - 26, ly(0)]], [[L.APP + 26, ly(0)], [L.PROD - 26, ly(0)]]],
  [[[L.BUILD + 26, ly(1)], [L.TEST - 26, ly(1)]], [[L.TEST + 26, ly(1)], [L.PROD - 26, ly(1)]]],
]
/* Delivery: Build -> Approval (0.2-1.9 s), parked at Approval (1.9-3.6 s), then on to Production (3.6-4.6 s) */
const WAIT_X = L.APP - 26 - 16
const TOP_A = K.ride('top-a', [[L.BUILD, ly(0)], [WAIT_X, ly(0)]], 0.2, 1.9, L.CYC, 1)
const TOP_B = K.ride('top-b', [[WAIT_X, ly(0)], [L.PROD, ly(0)]], 3.6, 4.6, L.CYC)
const TOP_WAIT = fade('wait', L.CYC, [[0, 0], [31, 0], [33, 1], [59, 1], [61, 0], [100, 0]])
const TOP_OK = pop('ok', L.CYC, [[0, 0.6, 0], [52, 0.6, 0], [56, 1.15, 1], [60, 1, 1], [68, 1, 1], [72, 0.6, 0], [100, 0.6, 0]])
/* Deployment: straight through, once (T21, T21-B) or three times a cycle (T21-C) */
const BOT = K.ride('bot', [[L.BUILD, ly(1)], [L.PROD, ly(1)]], 0.2, 2.0, L.CYC)
const BOT3 = [0.1, 2.1, 4.1].map((t, i) => K.ride(`bot3-${i}`, [[L.BUILD, ly(1)], [L.PROD, ly(1)]], t, t + 1.5, L.CYC))
/* a release: the rocket on a Production tile pops (top once after the approval, bottom on each arrival) */
const relPop = (name: string, at: number[]) => {
  const fr: [number, number, number][] = [[0, 0.6, 0]]
  for (const a of at) fr.push([a - 1, 0.6, 0], [a + 3, 1.12, 1], [a + 7, 1, 1], [a + 14, 1, 1], [a + 18, 0.6, 0])
  fr.push([100, 0.6, 0])
  return pop(name, L.CYC, fr)
}
const REL_TOP = relPop('rel-top', [77])
const REL_BOT1 = relPop('rel-bot1', [35])
/* the bottom lane's three-a-cycle releases need a pop at ~27, 60 and 93 %: the third wraps to the cycle's start */
const REL_BOT3 = pop('rel-bot3', L.CYC, [[0, 1, 1], [4, 1, 1], [8, 0.6, 0], [26, 0.6, 0], [30, 1.12, 1], [34, 1, 1], [41, 1, 1], [45, 0.6, 0], [59, 0.6, 0], [63, 1.12, 1], [67, 1, 1], [74, 1, 1], [78, 0.6, 0], [92, 0.6, 0], [96, 1.12, 1], [100, 1, 1]])

/** one lane card with its stages and wires; `approval` adds the Approval stage, `slot` replaces it with a dashed None */
function Lane({ k, lit = [] as string[], approval, slot, meter, meterLit = false, rocket, rocketCls, held, children }: { k: 0 | 1; lit?: string[]; approval?: boolean; slot?: boolean; meter?: boolean; meterLit?: boolean; rocket?: boolean; rocketCls?: string; held: boolean; children?: ReactNode }) {
  const y = ly(k)
  return (
    <>
      <Panel x={0} y={L.Y[k]} w={L.W} h={L.LH} />
      <Node x={L.IX} y={y} icon={k === 0 ? 'user' : 'bot'} label={k === 0 ? 'Delivery' : 'Deployment'} size={L.IS} lit={lit.includes('lane')} d={k * 0.8} w={84} />
      <Node x={L.BUILD} y={y} icon="gear" label="Build" size={L.TS} loop="spin" t={6} w={80} />
      <Node x={L.TEST} y={y} icon="checklist" label="Test" size={L.TS} lit={lit.includes('test')} d={0.5 + k * 0.4} w={80} />
      {approval && <Node x={L.APP} y={y} icon="user" pair="check" label="Approval" size={L.TS} lit={lit.includes('app')} w={90} />}
      {slot && (
        <Show on style={{ ...box(L.APP - 45, y - L.TS / 2, 90, L.TS + 26), zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ width: L.TS, height: L.TS, borderRadius: 15, background: '#FFFFFF', border: `2px dashed ${lit.includes('slot') ? ORANGE : '#B9C9EC'}`, display: 'grid', placeItems: 'center', boxSizing: 'border-box', transition: `border-color 420ms ${EASE}` }}>
            <span style={{ opacity: 0.35, display: 'grid' }}><Pair main="user" over="check" size={32} k={0.48} loop="none" overLoop="none" /></span>
          </div>
          <span style={{ ...tag(14), opacity: 0.75 }}>None</span>
        </Show>
      )}
      {meter && <Node x={L.APP} y={y} icon="meter" label="Coverage" size={L.TS} lit={meterLit} w={90} loop="pulse" />}
      <Node x={L.PROD} y={y} icon="server" label="Production" size={L.TS} d={0.9} w={96}>
        {rocket && <span className={held ? undefined : rocketCls} style={{ position: 'absolute', right: -10, top: -10, width: 28, height: 28, zIndex: 7, opacity: held ? 1 : 0 }}><Disc x={14} y={14} size={28} icon="rocket" loop="none" /></span>}
      </Node>
      {LANE_W[k].map((w, i) => <W key={i} pts={w} head={9} />)}
      {children}
    </>
  )
}

/** the moving parts of both lanes: the Delivery token parks at Approval, the Deployment token flows */
function Flow({ held, bot3 = false }: { held: boolean; bot3?: boolean }) {
  if (held) return null
  return (
    <>
      <Token cls={TOP_A} size={11} square />
      <Token cls={TOP_B} size={11} square />
      <span className={TOP_WAIT} style={{ ...box(WAIT_X - 5.5, ly(0) - 5.5, 11, 11), zIndex: 7, opacity: 0, borderRadius: 3, background: colors.brand, boxShadow: `0 0 0 4px ${colors.brand}2e, 0 4px 10px -4px ${colors.brand}` }} />
      <span className={TOP_OK} style={{ ...box(L.APP - 13, ly(0) - L.TS / 2 - 30, 26, 26), zIndex: 7, opacity: 0 }}><Disc x={13} y={13} size={26} icon="check" loop="none" /></span>
      {(bot3 ? BOT3 : [BOT]).map((c, i) => <Token key={i} cls={c} size={11} square tone={GREEN} />)}
    </>
  )
}

const G_T21: Fig = (p) => {
  const { hot, held } = useBuild(p, L.CYC * 1000)
  return (
    <Frame w={L.W} h={L.H}>
      <Lane k={0} approval lit={hot === 0 ? ['lane', 'app'] : []} rocket rocketCls={REL_TOP} held={held} />
      <Lane k={1} lit={hot === 1 ? ['lane'] : []} rocket rocketCls={REL_BOT1} held={held} />
      <Flow held={held} />
    </Frame>
  )
}

/* T21-B: one Same Tests tile in the gap, wired up and down to the two lanes' Test stages; the Coverage meter in the
   Deployment lane where Delivery has its Approval */
const GAP_Y = (L.Y[0] + L.LH + L.Y[1]) / 2
const SHARED_UP: Pt[] = [[L.TEST, GAP_Y - 20], [L.TEST, L.Y[0] + L.LH]]
const SHARED_DN: Pt[] = [[L.TEST, GAP_Y + 20], [L.TEST, L.Y[1]]]
const SH_R = [K.ride('sh-up', SHARED_UP, 0.2, 0.9, 2.4), K.ride('sh-dn', SHARED_DN, 0.2, 0.9, 2.4)]

const G_T21B: Fig = (p) => {
  const { hot, held, s } = useBuild(p, L.CYC * 1000)
  return (
    <Frame w={L.W} h={L.H}>
      <Lane k={0} approval lit={hot === 0 ? ['test'] : []} rocket rocketCls={REL_TOP} held={held} />
      <Lane k={1} lit={hot === 0 ? ['test'] : []} meter={s(2)} meterLit={hot === 1} rocket rocketCls={REL_BOT1} held={held} />
      <Show on={s(1)} style={{ ...box(0, 0, L.W, L.H), zIndex: 5, pointerEvents: 'none' }}>
        <div style={{ ...box(L.TEST - 20, GAP_Y - 20, 40, 40), zIndex: 6 }}>
          <Plinth size={40} lit={hot === 0}><Ico3D name="checklist" size={28} loop="pulse" /></Plinth>
        </div>
        <div style={{ ...box(L.TEST + 30, GAP_Y - 10, 120, 20), zIndex: 6, display: 'flex', alignItems: 'center' }}><span style={tag(14)}>Same Tests</span></div>
        <W pts={SHARED_UP} head={8} width={2.2} />
        <W pts={SHARED_DN} head={8} width={2.2} />
        {SH_R.map((c, i) => <Token key={i} cls={c} size={8} />)}
      </Show>
      <Flow held={held} />
    </Frame>
  )
}

/* T21-C: Frequency (a calendar in the gap between the two Production tiles; the top releases once a cycle, the bottom
   three times) and Set-Up (a pipeline in the gap between the two lane icons; Approval on top, None below) */
/* the calendar moved left from the Production column (review round 2) so the two frequency tags fit on its right */
const CAL_X = 320
const G_T21C: Fig = (p) => {
  const { hot, held, s } = useBuild(p, L.CYC * 1000)
  return (
    <Frame w={L.W} h={L.H}>
      <Lane k={0} approval lit={hot === 1 ? ['app'] : []} rocket rocketCls={REL_TOP} held={held} />
      <Lane k={1} slot={s(2)} lit={hot === 1 ? ['slot'] : []} rocket rocketCls={REL_BOT3} held={held} />
      <Show on={s(1)} style={{ ...box(CAL_X - 20, GAP_Y - 20, 40, 40), zIndex: 6 }}>
        <Plinth size={40} lit={hot === 0}><Ico3D name="calendar" size={28} loop="bob" /></Plinth>
      </Show>
      <Show on={s(1)} style={{ ...box(CAL_X - 30 - 110, GAP_Y - 10, 110, 20), zIndex: 6, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}><span style={tag(14)}>Frequency</span></Show>
      {/* review round 2 (2026-11-24): each lane's frequency, the upper tag beside Delivery, the lower beside Deployment */}
      <Show on={s(1)} style={{ ...box(CAL_X + 30, GAP_Y - 20, L.W - 20 - CAL_X - 30, 40), zIndex: 6, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <span style={{ ...tag(14), textAlign: 'left', lineHeight: '18px' }}>On Demand</span>
        <span style={{ ...tag(14), textAlign: 'left', lineHeight: '18px' }}>Several Times A Day</span>
      </Show>
      <Show on={s(2)} style={{ ...box(L.IX - 20, GAP_Y - 20, 40, 40), zIndex: 6 }}>
        <Plinth size={40} lit={hot === 1}><Ico3D name="pipeline" size={28} loop="bob" d={0.5} /></Plinth>
      </Show>
      <Show on={s(2)} style={{ ...box(L.IX + 30, GAP_Y - 10, 90, 20), zIndex: 6, display: 'flex', alignItems: 'center' }}><span style={tag(14)}>Set-Up</span></Show>
      <Flow held={held} bot3 />
    </Frame>
  )
}

export const figures: Record<string, Fig> = { G_T20, G_T20B, G_T21, G_T21B, G_T21C }
export const css = [
  K.css(),
  KF.join('\n'),
  '.cc-still .s22g-a, .deck-thumb .s22g-a { animation: none !important; }',
  '@media (prefers-reduced-motion: reduce) { .s22g-a { animation: none !important; } }',
].join('\n')
