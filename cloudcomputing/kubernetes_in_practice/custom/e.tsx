import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, TILE_BG, TILE_RIM, Frame, Show, Plinth, MarkTile, Panel, Wire, Junction, Token, keyframes, loopCls, loopVars, tag, heading, useHeld, useHot, type Pt } from '@/engine/figkit'
import podMark from '../images/k8s-pod.svg'
import rsMark from '../images/k8s-rs.svg'
import deployMark from '../images/k8s-deploy.svg'
import svcMark from '../images/k8s-svc.svg'
import eksMark from '../images/aws-eks.svg'
import clientMark from '../images/res-client.svg'

/*
 * SESSION 21 · SECTION 4 (Rolling Updates & Rollback) technical figures, builder E.
 * Built to generate-slides standing corrections 13-17: 3D icons on plinth tiles, official marks on white tiles, >= 20 px
 * equal padding, orthogonal wires computed from the same constants as the boxes, a flow dot on every live wire, a lit
 * item walking first -> last -> first after the build (S18 `useBuild`). Loops are transform / opacity on HTML elements
 * only. Held (?still): the full picture, nothing lit, nothing moving. Class prefix `s21e-`.
 *
 * ONE traffic-split bar chart (TR 15 and 17 Visual Guidance): an `Old` bar (blue) and a `New` bar (green, the TR's own
 * version colour from TR 16), each a track whose fill slides in or out (translateX inside a clipped track). Rollout:
 * old shrinks while new grows; Recreate: old drops to zero, an orange gap, then new rises; rollback: the same staircase
 * reversed. Every loop is 7 s and restarts with a 0.28 s crossfade.
 *
 *   slide 39 E_T15   566 x 360  Recreate lane | RollingUpdate lane, each the chart + the Service it feeds (2)
 *   slide 40 E_T15B  566 x 380  the Deployment's EKS console panel with the chart and its progress | Client -> Service
 *                               -> pods, the request line kept green throughout (2)
 *   slide 42 E_T16B 1080 x 280  6 replicas, 2 surge slots (maxSurge), 1 pod down at a time (maxUnavailable); the
 *                               walk until all 6 are new (3)
 *   slide 44 E_T17   566 x 360  the chart reversed | `kubectl rollout history` terminal + revision column; undo back one (2)
 *   slide 45 E_T17B  566 x 380  `kubectl rollout undo deployment/web-deployment --to-revision=N` terminal | Old / Bad ReplicaSet pods scaling;
 *                               revision column jump to an older revision (2)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('s21e')
const BLUE = colors.brand
const GREEN = colors.success
const MONO = "'Fira Code', ui-monospace, monospace"
const TERM = "'Ubuntu Mono', ui-monospace, monospace"
const NOLIG: CSSProperties = { fontVariantLigatures: 'none', fontFeatureSettings: "'liga' 0, 'calt' 0" }
const P = 7 // every chart loop, seconds
const EZ = 'cubic-bezier(0.45,0,0.55,1)'

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)
const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })

/** the build of a figure: the step, the lit item, held (S18 c.tsx: the walk starts on the LAST item) */
function useBuild(p: Record<string, unknown>, period: number) {
  const cnt = Number(p.steps ?? 1)
  const held = useHeld()
  const step = held ? cnt : stepOf(p)
  const raw = useHot(cnt, stepOf(p), period)
  const hot = raw >= 0 && stepOf(p) >= cnt ? (raw + cnt - 1) % cnt : raw
  return { step, hot, held, s: (n: number) => step >= n, live: !held }
}

/* ------------------------------------------------------------------ shared keyframes (the chart and its companions) */

type F = [number, number, number] // percent, translateX %, opacity
const KF: string[] = []
function anim(name: string, frames: F[], scale = false) {
  const cls = `s21e-${name}`
  const body = frames.map(([at, v, o]) => `${at}% { transform: ${scale ? `scale(${v})` : `translateX(${v}%)`}; opacity: ${o} }`).join(' ')
  KF.push(`@keyframes ${cls} { ${body} }\n.${cls} { animation: ${cls} ${P}s ${EZ} infinite; }`)
  return `${cls} s21e-a`
}
function fade(name: string, frames: [number, number][]) {
  const cls = `s21e-${name}`
  KF.push(`@keyframes ${cls} { ${frames.map(([at, o]) => `${at}% { opacity: ${o} }`).join(' ')} }\n.${cls} { animation: ${cls} ${P}s ${EZ} infinite; }`)
  return `${cls} s21e-a`
}
const SIXTH = 100 / 6
const r2 = (v: number) => Math.round(v * 100) / 100
/* the staircase: the growing bar steps up first (a surge pod), the shrinking one steps down half a beat later */
const GROW_AT = [0, 1, 2, 3, 4, 5].map((i) => 8 + 13 * i)
const SHRINK_AT = GROW_AT.map((t) => t + 6)
const growF: F[] = [[0, -100, 1], ...GROW_AT.flatMap((t, i): F[] => [[t, r2(-100 + i * SIXTH), 1], [t + 4, r2(-100 + (i + 1) * SIXTH), 1]]), [94, 0, 1], [98, 0, 0], [98.1, -100, 0], [100, -100, 1]]
const shrinkF: F[] = [[0, 0, 1], ...SHRINK_AT.flatMap((t, i): F[] => [[t, r2(-i * SIXTH), 1], [t + 4, r2(-(i + 1) * SIXTH), 1]]), [93.9, -100, 1], [94, 0, 0], [98, 0, 1], [100, 0, 1]]
const CH = {
  /* Recreate: old drops to zero (8-30 %), the gap (30-52 %), new rises (52-74 %) */
  recOld: anim('rec-old', [[0, 0, 1], [8, 0, 1], [30, -100, 1], [93.9, -100, 1], [94, 0, 0], [98, 0, 1], [100, 0, 1]]),
  recNew: anim('rec-new', [[0, -100, 1], [52, -100, 1], [74, 0, 1], [94, 0, 1], [98, 0, 0], [98.1, -100, 0], [100, -100, 1]]),
  gap: fade('gap', [[0, 0], [30, 0], [33, 1], [50, 1], [53, 0], [100, 0]]),
  up: fade('up', [[0, 1], [29, 1], [31, 0], [52, 0], [55, 1], [100, 1]]),
  /* RollingUpdate (and the rollback, with the roles swapped): six beats, no gap */
  grow: anim('grow', growF),
  shrink: anim('shrink', shrinkF),
  /* the console's progress: the spinner while the rollout runs, a tick when it is done */
  spin: fade('spin', [[0, 1], [84, 1], [87, 0], [95, 0], [98, 1], [100, 1]]),
  done: fade('done', [[0, 0], [84, 0], [87, 1], [95, 1], [98, 0], [100, 0]]),
}
/* pods joining (one per grow beat, left to right) and leaving (one per shrink beat, right to left) a ReplicaSet */
const POD_IN = GROW_AT.map((t, i) => anim(`pin${i}`, [[0, 0.6, 0], [t, 0.6, 0], [t + 4, 1, 1], [94, 1, 1], [98, 0.6, 0], [100, 0.6, 0]], true))
const POD_OUT = [0, 1, 2, 3, 4, 5].map((j) => {
  const t = SHRINK_AT[5 - j]
  return anim(`pout${j}`, [[0, 1, 1], [t, 1, 1], [t + 4, 0.6, 0], [94, 0.6, 0], [98, 1, 1], [100, 1, 1]], true)
})

/* ------------------------------------------------------------------ pieces */

const OLD_FILL = 'linear-gradient(180deg, #7FA4FF 0%, #2D63FB 100%)'
const NEW_FILL = 'linear-gradient(180deg, #5EDB8E 0%, #16A34A 100%)'
const NEW_BG = 'linear-gradient(180deg, #FFFFFF 0%, #E3F6EA 100%)'
const NEW_RIM = 'inset 0 0 0 1.5px #A6DDBA, 0 10px 20px -12px rgba(20,110,60,0.5)'
const LIT_RIM = `inset 0 0 0 2.5px ${ORANGE}, 0 10px 22px -12px rgba(255,138,61,0.7)`

/** the engine's 3D cross turned to the template's orange (blocked = orange, never red) */
const OrangeCross = ({ size }: { size: number }) => (
  <span style={{ display: 'grid', filter: 'hue-rotate(28deg) saturate(1.15) brightness(1.06)' }}>
    <Ico3D name="cross" size={size} loop="none" />
  </span>
)

/** a small white disc holding a 3D icon, centred on (x, y); `cls` runs an opacity loop on it */
function Disc({ x, y, on = true, size = 26, icon, loop = 'pulse', d = 0, t = 2.4, warn = false, cls, z = 6 }: { x: number; y: number; on?: boolean; size?: number; icon: Ico3DName; loop?: Loop; d?: number; t?: number; warn?: boolean; cls?: string; z?: number }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: z, opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}` }}>
      <span className={cls} style={{ position: 'absolute', inset: 0, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6', display: 'grid', placeItems: 'center' }}>
        {warn ? <OrangeCross size={size - 6} /> : <Ico3D name={icon} size={size - 6} loop={loop} d={d} t={t} />}
      </span>
    </span>
  )
}

/** a wire on its own layer above the cards (a Panel is z 2 and would hide a wire drawn inside it) */
const W = (props: Parameters<typeof Wire>[0]) => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}><Wire {...props} /></div>
)

/** an official mark (or a 3D icon) on its tile with a tag under (or above, or right of) it; the TILE centred on (x, y) */
function Node({ x, y, label, icon, mark, size = 52, on = true, lit = false, loop = 'bob', d = 0, t, w = 120, tagSize = 14, up = false, delay = 0, children }: { x: number; y: number; label?: string; icon?: Ico3DName; mark?: string; size?: number; on?: boolean; lit?: boolean; loop?: Loop; d?: number; t?: number; w?: number; tagSize?: number; up?: boolean; delay?: number; children?: ReactNode }) {
  const tile = mark ? <MarkTile src={mark} size={size} lit={lit} /> : (
    <Plinth size={size} lit={lit}><Ico3D name={icon ?? 'doc'} size={Math.round(size * 0.74)} loop={loop} d={d} t={t} /></Plinth>
  )
  const lab = label ? <span style={{ ...tag(tagSize), [up ? 'marginBottom' : 'marginTop']: 6 }}>{label}</span> : null
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, width: w, zIndex: 4, display: 'flex', flexDirection: up ? 'column-reverse' : 'column', alignItems: 'center', ...(up ? { bottom: `calc(100% - ${y + size / 2}px)` } : { top: y - size / 2 }) }}>
      <div style={{ position: 'relative', width: size, height: size, display: 'grid', placeItems: 'center' }}>
        {tile}
        {children}
      </div>
      {lab}
    </Show>
  )
}

/** a Pod (the Kubernetes mark) on a tile tinted by its version: old blue, new green (TR 16); the mark never moves */
function PodTile({ size, ver, lit = false, dim = false, d = 0 }: { size: number; ver: 'old' | 'new'; lit?: boolean; dim?: boolean; d?: number }) {
  const instant = useInstant()
  const r = Math.round(size * 0.28)
  const tint = ver === 'old' ? BLUE : GREEN
  return (
    <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: size, height: size, flexShrink: 0 }}>
      <span aria-hidden className={loopCls('halo')} style={{ position: 'absolute', inset: -5, borderRadius: r + 5, background: `radial-gradient(closest-side, ${tint}33, ${tint}00)`, opacity: dim ? 0 : undefined, ...loopVars(d, 3.6) }} />
      <span style={{ position: 'absolute', inset: 0, borderRadius: r, background: ver === 'old' ? TILE_BG : NEW_BG, boxShadow: lit ? LIT_RIM : ver === 'old' ? TILE_RIM : NEW_RIM, opacity: dim ? 0.42 : 1, display: 'grid', placeItems: 'center', transition: instant ? 'none' : `box-shadow 420ms ${EASE}, opacity 420ms ${EASE}` }}>
        <img src={podMark} alt="" aria-hidden draggable={false} style={{ width: Math.round(size * 0.66), height: Math.round(size * 0.66), objectFit: 'contain', display: 'block', filter: dim ? 'grayscale(0.7)' : undefined }} />
        <span aria-hidden style={{ position: 'absolute', bottom: Math.max(3, Math.round(size * 0.07)), left: '32%', right: '32%', height: Math.max(3, Math.round(size * 0.06)), borderRadius: 9, background: tint }} />
      </span>
    </span>
  )
}

/** a 3D icon on its plinth with a heading beside it, the row's left edge at x, centred on y */
function TitleRow({ x, y, icon, mark, text, size = 34, on = true, lit = false, loop = 'bob' }: { x: number; y: number; icon?: Ico3DName; mark?: string; text: string; size?: number; on?: boolean; lit?: boolean; loop?: Loop }) {
  return (
    <Show on={on} style={{ position: 'absolute', left: x, top: y - size / 2, height: size, display: 'flex', alignItems: 'center', gap: 10, zIndex: 4 }}>
      {mark ? <MarkTile src={mark} size={size} lit={lit} /> : <Plinth size={size} lit={lit}><Ico3D name={icon ?? 'doc'} size={Math.round(size * 0.76)} loop={loop} t={loop === 'spin' ? 5 : undefined} /></Plinth>}
      <span style={{ ...heading(17), whiteSpace: 'nowrap' }}>{text}</span>
    </Show>
  )
}

/**
 * ONE ROW OF THE TRAFFIC-SPLIT CHART: a pod tile in the version's colour, its tag, and the track (x0..x1) whose fill
 * slides in or out. `k` is the fill when nothing runs (and the held value); `cls` the running loop; `gap` an orange
 * ring on the track while it runs (Recreate's outage).
 */
const TRACK_H = 22
function Bar({ x, y, x1, ver, k, cls, gapCls, lit = false, tile = 30, tagW = 42 }: { x: number; y: number; x1: number; ver: 'old' | 'new'; k: number; cls?: string; gapCls?: string; lit?: boolean; tile?: number; tagW?: number }) {
  const instant = useInstant()
  const t0 = x + tile + 8 + tagW + 6
  return (
    <>
      <div style={{ ...box(x, y - tile / 2, tile, tile), zIndex: 4 }}><PodTile size={tile} ver={ver} lit={lit} d={ver === 'old' ? 0 : 1.2} /></div>
      <div style={{ ...box(x + tile + 8, y - 10, tagW, 20), zIndex: 4, display: 'flex', alignItems: 'center' }}>
        <span style={{ ...tag(15), textAlign: 'left' }}>{ver === 'old' ? 'Old' : 'New'}</span>
      </div>
      <div data-track style={{ ...box(t0, y - TRACK_H / 2, x1 - t0, TRACK_H), zIndex: 4, borderRadius: TRACK_H / 2, overflow: 'hidden', background: '#EEF3FF', boxShadow: lit ? `inset 0 0 0 2px ${ORANGE}` : 'inset 0 0 0 1.5px #D3DEF6', transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
        <span className={cls} style={{ position: 'absolute', inset: 0, borderRadius: TRACK_H / 2, background: ver === 'old' ? OLD_FILL : NEW_FILL, transform: `translateX(${(k - 1) * 100}%)`, boxShadow: 'inset 0 -3px 6px -3px rgba(0,0,0,0.18)' }}>
          <span aria-hidden style={{ position: 'absolute', left: 8, right: 8, top: 3, height: 5, borderRadius: 9, background: 'rgba(255,255,255,0.45)' }} />
        </span>
      </div>
      {gapCls !== undefined && (
        <span aria-hidden className={gapCls} style={{ ...box(t0 - 3, y - TRACK_H / 2 - 3, x1 - t0 + 6, TRACK_H + 6), zIndex: 5, borderRadius: TRACK_H / 2 + 3, boxShadow: `inset 0 0 0 2.5px ${ORANGE}`, opacity: gapCls ? 0 : 1 }} />
      )}
    </>
  )
}

/** a terminal panel (VS Code's integrated terminal look: tab strip, dark ground); `lines` appear by step */
type TLine = { text: string; cmd?: boolean; on: boolean; key?: string }
function TerminalPanel({ x, y, w, h, lines, caretOn = true, lit = false, icon = true, size = 14, lh = 22, children }: { x: number; y: number; w: number; h: number; lines: TLine[]; caretOn?: boolean; lit?: boolean; icon?: boolean; size?: number; lh?: number; children?: ReactNode }) {
  const instant = useInstant()
  const held = useHeld()
  const last = lines.filter((l) => l.on).length - 1
  return (
    <div style={{ ...box(x, y, w, h), zIndex: 2, borderRadius: 14, background: '#1E1E1E', boxShadow: lit ? `0 0 0 2.5px ${ORANGE}, 0 14px 28px -16px rgba(0,20,60,0.6)` : '0 14px 28px -16px rgba(0,20,60,0.6)', overflow: 'hidden', transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
      <div style={{ ...box(0, 0, w, 32), background: '#252526', borderBottom: '1px solid #3C3C3C', display: 'flex', alignItems: 'center', gap: 16, padding: '0 14px', boxSizing: 'border-box' }}>
        {['PROBLEMS', 'OUTPUT', 'TERMINAL'].map((t) => (
          <span key={t} style={{ fontFamily: TERM, fontSize: 13, letterSpacing: 0.4, color: t === 'TERMINAL' ? '#E7E7E7' : '#8B8B8B', borderBottom: t === 'TERMINAL' ? '1.5px solid #E7E7E7' : '1.5px solid transparent', paddingBottom: 2 }}>{t}</span>
        ))}
        {icon && (
          <span style={{ marginLeft: 'auto', display: 'grid' }}><Plinth size={24}><Ico3D name="terminal" size={18} loop="pulse" t={2.6} /></Plinth></span>
        )}
      </div>
      {lines.map((l, i) => (
        <div key={l.key ?? i} style={{ ...box(14, 32 + 12 + i * lh, w - 28, lh), display: 'flex', alignItems: 'center', opacity: l.on ? 1 : 0, transform: l.on ? 'none' : 'translateX(-6px)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 420ms ${EASE}` }}>
          <span style={{ fontFamily: MONO, ...NOLIG, fontSize: size, fontWeight: 500, whiteSpace: 'pre', color: l.cmd ? '#E7E7E7' : '#BDBDBD' }}>
            {l.cmd && <span style={{ color: '#6FC3A0' }}>$ </span>}{l.text}
          </span>
          {i === last && caretOn && !held && l.cmd && <span aria-hidden className={loopCls('blink')} style={{ display: 'inline-block', width: 8, height: size + 2, marginLeft: 3, background: '#E7E7E7', ...loopVars(0, 1.1) }} />}
        </div>
      ))}
      {children}
    </div>
  )
}

/* ================================================================== slide 39 · E_T15 · Recreate vs RollingUpdate */

/*
 * 566 x 360. Two lanes (x 20..546, h 150): Recreate (y 20) and RollingUpdate (y 190). In each: the title row (the point's
 * own icon: power / refresh) at L+37, the Old bar (L+77) and the New bar (L+115), tracks to x 380; on the right the
 * Service (466, L+96, its tile spanning both bar heights) feeding each bar by a straight wire, tag above it, its
 * status disc on the tile's corner.
 * Press 0: both lanes before the update (old full). Press 1 runs Recreate: old drops to zero, the gap rings orange and
 * the Service shows an orange cross, then new rises. Press 2 runs RollingUpdate: new steps up while old steps down, the
 * Service never loses a pod. Held: Recreate in its gap, RollingUpdate half and half.
 */
const A = { W: 566, H: 360, X0: 20, X1: 546, LH: 150, RX: 40, TX1: 380, SVX: 466, SV: 52, J: 410, TIP: 392 }
const A_L = [20, 190]
const aOld = (L: number) => L + 77
const aNew = (L: number) => L + 115
const aSvc = (L: number) => L + 96
/* the Service's tile spans both bar heights, so each request leaves its left edge level with the bar it feeds */
const aBranch = (_L: number, y: number): Pt[] => [[A.SVX - A.SV / 2, y], [A.TIP, y]]
/* Recreate: requests reach the old pods while they last, none in the gap, then the new pods */
const A_REC = [
  ...[0.1, 0.9].map((t, i) => ({ cls: K.ride(`t15ro${i}`, aBranch(A_L[0], aOld(A_L[0])), t, t + 0.6, P), y: 0 })),
  ...[3.9, 4.8, 5.7].map((t, i) => ({ cls: K.ride(`t15rn${i}`, aBranch(A_L[0], aNew(A_L[0])), t, t + 0.6, P), y: 1 })),
]
/* RollingUpdate: old pods get requests until the last one goes (83 %), new ones from the first surge (12 %) */
const A_ROL = [
  ...[0.1, 1.3, 2.5, 3.7, 4.9].map((t, i) => ({ cls: K.ride(`t15lo${i}`, aBranch(A_L[1], aOld(A_L[1])), t, t + 0.6, P) })),
  ...[1.0, 2.2, 3.4, 4.6, 5.8].map((t, i) => ({ cls: K.ride(`t15ln${i}`, aBranch(A_L[1], aNew(A_L[1])), t, t + 0.6, P) })),
]

const E_T15: Fig = (p) => {
  const { hot, s, held } = useBuild({ ...p, steps: p.steps ?? 2 }, 2800)
  const lanes = [
    { name: 'Recreate', icon: 'power' as Ico3DName, loop: 'pulse' as Loop },
    { name: 'RollingUpdate', icon: 'refresh' as Ico3DName, loop: 'spin' as Loop },
  ]
  return (
    <Frame w={A.W} h={A.H}>
      {lanes.map((ln, i) => {
        const L = A_L[i]
        const run = s(i + 1) && !held
        const rec = i === 0
        /* the held picture: Recreate in its gap, RollingUpdate half and half */
        const kOld = held ? (rec ? 0 : 0.5) : 1
        const kNew = held ? (rec ? 0 : 0.5) : 0
        return (
          <div key={ln.name}>
            <Panel x={A.X0} y={L} w={A.X1 - A.X0} h={A.LH} lit={hot === i} />
            <TitleRow x={A.RX} y={L + 37} icon={ln.icon} text={ln.name} loop={ln.loop} />
            <Bar x={A.RX} y={aOld(L)} x1={A.TX1} ver="old" k={kOld} cls={run ? (rec ? CH.recOld : CH.shrink) : undefined} gapCls={rec && s(1) ? (held ? '' : CH.gap) : undefined} />
            <Bar x={A.RX} y={aNew(L)} x1={A.TX1} ver="new" k={kNew} cls={run ? (rec ? CH.recNew : CH.grow) : undefined} gapCls={rec && s(1) ? (held ? '' : CH.gap) : undefined} />
            {[aOld(L), aNew(L)].map((y) => <W key={y} pts={aBranch(L, y)} head={8} width={2.2} lit={hot === i} />)}
            <Node x={A.SVX} y={aSvc(L)} mark={svcMark} size={A.SV} label="Service" up w={90}>
              {rec ? (
                <>
                  <Disc x={A.SV - 2} y={2} icon="check" size={24} on={s(1) && !held} cls={run ? CH.up : undefined} />
                  <Disc x={A.SV - 2} y={2} icon="cross" warn size={24} on={s(1) && (held || run)} cls={run ? CH.gap : undefined} z={7} />
                </>
              ) : (
                <Disc x={A.SV - 2} y={2} icon="check" size={24} on={s(2)} />
              )}
            </Node>
          </div>
        )
      })}
      {A_REC.map((r, i) => <Token key={`r${i}`} cls={r.cls} on={s(1)} size={8} />)}
      {A_ROL.map((r, i) => <Token key={`l${i}`} cls={r.cls} on={s(2)} size={8} />)}
    </Frame>
  )
}

/* ================================================================== slide 40 · E_T15B · console progress, service reachable */

/*
 * 566 x 380. The Deployment's EKS console page (panel x 20..546, y 20..200): a breadcrumb row (Amazon EKS mark,
 * `Amazon EKS`, chevron, Deployment mark, `Deployment`) with the rollout spinner at the right (a tick when done), a
 * rule, then the same chart (Old y 120, New y 162, tracks to x 506) running the RollingUpdate. Under it (y 220..360) the
 * request line: Client (60, 296) -> Service (283, 296) -> junction (392) -> the Old pod (470, 272) and the New pod
 * (470, 320), drawn green and kept flowing the whole rollout, a tick on it. Press 1 runs the console; press 2 the
 * request line. Held: the chart half and half (the spinner: still rolling out), the request line drawn.
 */
const B = { W: 566, H: 380, PX: 20, PY: 20, PW: 526, PH: 180, HY: 57, RULE: 88, OY: 120, NY: 162, RX: 40, TX1: 506, LY: 296, CX: 60, SX: 283, NS: 52, J: 392, PODX: 470, PO: 272, PN: 320, PS: 36 }
const B_IN: Pt[] = [[B.CX + B.NS / 2, B.LY], [B.SX - B.NS / 2, B.LY]]
const bBranch = (y: number): Pt[] => [[B.SX + B.NS / 2, B.LY], [B.J, B.LY], [B.J, y], [B.PODX - B.PS / 2, y]]
const B_RIDE = [0, 1, 2, 3].map((i) => K.ride(`t15bi${i}`, B_IN, i * 1.75, i * 1.75 + 0.8, P))
const B_ROUT = [0, 1, 2, 3].map((i) => K.ride(`t15bb${i}`, bBranch(i % 2 ? B.PN : B.PO), i * 1.75 + 0.85, i * 1.75 + 1.6, P))

const Chevron = ({ x, y }: { x: number; y: number }) => (
  <svg aria-hidden width={10} height={14} viewBox="0 0 10 14" style={{ position: 'absolute', left: x - 5, top: y - 7, zIndex: 4 }}>
    <path d="M2 2 L8 7 L2 12" fill="none" stroke="#9DB6EE" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const E_T15B: Fig = (p) => {
  const { hot, s, held } = useBuild({ ...p, steps: p.steps ?? 2 }, 2800)
  const run = s(1) && !held
  return (
    <Frame w={B.W} h={B.H}>
      {/* point 3: the Deployment's page on the EKS console, the rollout's progress */}
      <Panel x={B.PX} y={B.PY} w={B.PW} h={B.PH} lit={hot === 0} />
      <div style={{ ...box(40, B.HY - 18, 36, 36), zIndex: 4 }}><MarkTile src={eksMark} size={36} /></div>
      <div style={{ ...box(86, B.HY - 11, 110, 22), zIndex: 4, display: 'flex', alignItems: 'center' }}><span style={{ ...heading(16), whiteSpace: 'nowrap' }}>Amazon EKS</span></div>
      <Chevron x={200} y={B.HY} />
      <div style={{ ...box(216, B.HY - 16, 32, 32), zIndex: 4 }}><MarkTile src={deployMark} size={32} /></div>
      <div style={{ ...box(258, B.HY - 11, 110, 22), zIndex: 4, display: 'flex', alignItems: 'center' }}><span style={{ ...heading(16), whiteSpace: 'nowrap' }}>Deployment</span></div>
      <Show on={s(1)} style={{ ...box(B.TX1 - 36, B.HY - 18, 36, 36), zIndex: 4 }}>
        <span className={run ? CH.spin : undefined} style={{ position: 'absolute', inset: 0, opacity: 1 }}>
          <Plinth size={36} lit={hot === 0}><Ico3D name="refresh" size={26} loop="spin" t={2.4} /></Plinth>
        </span>
        <span className={run ? CH.done : undefined} style={{ position: 'absolute', inset: 0, opacity: 0 }}>
          <Plinth size={36} lit={hot === 0}><Ico3D name="check" size={26} loop="pulse" /></Plinth>
        </span>
      </Show>
      <div style={{ ...box(40, B.RULE, B.TX1 - 40, 1.5), zIndex: 4, background: '#DCE5F8' }} />
      <Bar x={B.RX} y={B.OY} x1={B.TX1} ver="old" k={held ? 0.5 : 1} cls={run ? CH.shrink : undefined} />
      <Bar x={B.RX} y={B.NY} x1={B.TX1} ver="new" k={held ? 0.5 : 0} cls={run ? CH.grow : undefined} />

      {/* point 4: the request line, kept green the whole rollout */}
      <Node x={B.CX} y={B.LY} mark={clientMark} size={B.NS} label="Client" w={90} />
      <Node x={B.SX} y={B.LY} mark={svcMark} size={B.NS} label="Service" w={90} lit={hot === 1} />
      {(['old', 'new'] as const).map((v) => (
        <div key={v} style={{ ...box(B.PODX - B.PS / 2, (v === 'old' ? B.PO : B.PN) - B.PS / 2, 80, B.PS), zIndex: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <PodTile size={B.PS} ver={v} d={v === 'old' ? 0.4 : 1.6} />
          <span style={tag(14)}>{v === 'old' ? 'Old' : 'New'}</span>
        </div>
      ))}
      <W pts={B_IN} on={s(2)} color={GREEN} head={9} width={2.8} />
      {[B.PO, B.PN].map((y, i) => <W key={y} pts={bBranch(y)} on={s(2)} color={GREEN} head={8} width={2.4} delay={250 + i * 100} />)}
      <Junction x={B.J} y={B.LY} on={s(2)} />
      <Disc x={(B.CX + B.SX) / 2} y={B.LY - 26} icon="check" size={28} on={s(2)} />
      {B_RIDE.map((c, i) => <Token key={i} cls={c} on={s(2)} size={9} tone={GREEN} />)}
      {B_ROUT.map((c, i) => <Token key={`o${i}`} cls={c} on={s(2)} size={8} tone={GREEN} />)}
    </Frame>
  )
}

/* ================================================================== slide 42 · E_T16B · maxSurge and maxUnavailable */

/*
 * 1080 x 280 (the 440 frame's empty top and bottom trimmed when the intro line joined it on slide 42, 2026-11-23). The Deployment (66, 224) feeds a `6 replicas` window (slots 0-5, pitch 108) and, beside it, a
 * dashed `maxSurge` window (slots 6-7). Pods are Kubernetes Pod marks on tiles, old blue, new green (TR 16); each carries
 * its `Old` / `New` tag. Under slot 0 a dashed outline and the `maxUnavailable` tag mark the one pod that may be down
 * (a power disc on it: taken down, not failed).
 * The walk is a conveyor: 2 new pods appear in the surge slots (8 pods), the old pod in slot 0 is taken down and fades
 * where it stands, every other pod moves one slot left (a surge pod joins the six) and the next new pod appears; until all 6 are new.
 * Press 0: six old pods. Press 1: the two surge pods (8 total). Press 2: one old pod down. Press 3: the walk, looping.
 * Held: mid-walk (two old pods gone, one down, four new pods placed or waiting), nothing lit.
 */
const C = { W: 1080, H: 280, DX: 66, DY: 124, DS: 72, S0: 200, PITCH: 108, SURGE: 36, PS: 80, PANE_Y: 60, PANE_H: 154, TAG_Y: 34, UN_Y: 240 }
const slotX = (pos: number) => C.S0 + pos * C.PITCH + (pos >= 6 ? C.SURGE : 0)
const C_PANE = { x0: slotX(0) - C.PS / 2 - 22, x1: slotX(5) + C.PS / 2 + 22 }
const C_SURGE = { x0: slotX(6) - C.PS / 2 - 18, x1: slotX(7) + C.PS / 2 + 18 }
const C_FEED: Pt[] = [[C.DX + C.DS / 2, C.DY], [C_PANE.x0, C.DY]]
const C_FEEDR = K.ride('t16f', C_FEED, 0.1, 0.9, 2.4)
const C_BEAT = 1300

type PodS = { pos: number; on: boolean; down: boolean }
/** the pods at beat b of the walk (b 0..13); pods 0-5 are old, 6-11 new */
function walk(b: number): PodS[] {
  const shifts = b <= 2 ? 0 : Math.floor((b - 1) / 2)
  const surgeOn = b >= 1
  const downIdx = b >= 2 && b % 2 === 0 && shifts < 6 ? shifts : -1
  const out: PodS[] = []
  for (let i = 0; i < 6; i++) {
    out.push(i < shifts ? { pos: 0, on: false, down: true } : { pos: i - shifts, on: true, down: i === downIdx })
  }
  for (let n = 0; n < 6; n++) {
    const pos = 6 - shifts + n
    const on = surgeOn && pos <= 7
    out.push({ pos: Math.min(pos, 7), on, down: false })
  }
  return out
}
const HELD_BEAT = 6

const E_T16B: Fig = (p) => {
  const held = useHeld()
  const instant = useInstant()
  const step = held ? 3 : stepOf(p)
  const [beat, setBeat] = useState(3)
  useEffect(() => {
    if (held || step < 3) { setBeat(3); return }
    const id = window.setInterval(() => setBeat((b) => (b >= 13 ? 0 : b + 1)), C_BEAT)
    return () => window.clearInterval(id)
  }, [held, step])
  const b = held ? HELD_BEAT : step < 3 ? step : beat
  const raw = walk(b)
  /* a pod that was hidden jumps into place (no slide), so a restart or a new surge pod never sweeps across the row; a
     new pod leaving at a restart fades where it stands */
  const prev = useRef<PodS[]>(raw)
  const was = prev.current
  const pods = raw.map((pd, i) => (!pd.on && i >= 6 && was[i]?.on ? { ...pd, pos: was[i].pos } : pd))
  useEffect(() => { prev.current = pods })
  const surgeLit = !held && (b === 1 || (b >= 3 && b % 2 === 1 && b < 13))
  const downLit = !held && b >= 2 && b % 2 === 0 && b < 13
  const ringT = instant ? 'none' : `border-color 420ms ${EASE}`
  return (
    <Frame w={C.W} h={C.H}>
      {/* the desired count: 6 replicas */}
      <Panel x={C_PANE.x0} y={C.PANE_Y} w={C_PANE.x1 - C_PANE.x0} h={C.PANE_H} />
      <div style={{ ...box(C_PANE.x0, C.TAG_Y - 11, C_PANE.x1 - C_PANE.x0, 22), zIndex: 4, display: 'grid', placeItems: 'center' }}><span style={tag(16)}>6 replicas</span></div>
      {/* maxSurge: two slots above the desired count */}
      <Show on={step >= 1} style={{ ...box(C_SURGE.x0, C.PANE_Y, C_SURGE.x1 - C_SURGE.x0, C.PANE_H), zIndex: 2 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 18, background: 'rgba(227,246,234,0.55)', border: `2px dashed ${surgeLit ? ORANGE : '#86CFA2'}`, transition: ringT }} />
      </Show>
      <Show on={step >= 1} style={{ ...box(C_SURGE.x0 - 10, C.TAG_Y - 11, C_SURGE.x1 - C_SURGE.x0 + 20, 22), zIndex: 4, display: 'grid', placeItems: 'center' }}><span style={tag(16)}>maxSurge</span></Show>
      {/* maxUnavailable: the one slot whose pod may be down */}
      <Show on={step >= 2} style={{ ...box(slotX(0) - C.PS / 2 - 12, C.DY - C.PS / 2 - 12, C.PS + 24, C.PS + 44), zIndex: 3 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 16, border: `2px dashed ${downLit ? ORANGE : '#9DB6EE'}`, transition: ringT }} />
      </Show>
      <Show on={step >= 2} style={{ ...box(slotX(0) - 80, C.UN_Y - 11, 160, 22), zIndex: 4, display: 'grid', placeItems: 'center' }}><span style={tag(16)}>maxUnavailable</span></Show>

      {/* the Deployment that owns them */}
      <Node x={C.DX} y={C.DY} mark={deployMark} size={C.DS} label="Deployment" w={120} tagSize={15} />
      <W pts={C_FEED} head={10} />
      <Token cls={C_FEEDR} size={9} />

      {/* the pods */}
      {pods.map((pd, i) => {
        const ver = i < 6 ? 'old' : 'new'
        /* only a pod visible before and after slides (after the leaving pod has faded where it stood) */
        const slide = was[i]?.on && pd.on && !instant
        const leave = was[i]?.on && !pd.on
        /* a new surge pod waits until the pod before it has left its slot */
        const enter = i >= 6 && !was[i]?.on && pd.on
        return (
          <div key={i} style={{ ...box(0, C.DY - C.PS / 2, C.PS, C.PS + 28), zIndex: 5, opacity: pd.on ? 1 : 0, transform: `translateX(${slotX(pd.pos) - C.PS / 2}px)`, transition: instant ? 'none' : `opacity ${leave ? 220 : 420}ms ${EASE}${enter ? ' 640ms' : ''}${slide ? `, transform 600ms ${EASE} 200ms` : ''}` }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <PodTile size={C.PS} ver={ver} dim={pd.down} d={(i % 6) * 0.5} />
              <span style={{ ...tag(16), opacity: pd.down ? 0.5 : 1 }}>{ver === 'old' ? 'Old' : 'New'}</span>
            </div>
            {pd.down && pd.on && <Disc x={C.PS - 4} y={4} icon="power" size={28} loop="pulse" />}
          </div>
        )
      })}
    </Frame>
  )
}

/* ================================================================== the revision column (T17 and T17-B) */

/** the revision history: a `Revision History` header (the list icon) over three revisions; `cur` has the tick, 3 the cross */
function Revisions({ x, y0, pitch, cur, lit = -1, hdrOn = true }: { x: number; y0: number; pitch: number; cur: number; lit?: number; hdrOn?: boolean }) {
  const S = 34
  return (
    <>
      <Show on={hdrOn} style={{ ...box(x - 15, y0 - 15, 180, 30), zIndex: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Plinth size={30} lit={lit === 0}><Ico3D name="list" size={22} loop="bob" /></Plinth>
        <span style={tag(14)}>Revision History</span>
      </Show>
      {[1, 2, 3].map((r, i) => {
        const y = y0 + 50 + i * pitch
        return (
          <div key={r} style={{ ...box(x - S / 2, y - S / 2, 140, S), zIndex: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ position: 'relative', display: 'grid' }}>
              <Plinth size={S} lit={lit === r}><Ico3D name="version" size={25} loop="bob" d={i * 0.5} /></Plinth>
            </span>
            <span style={{ ...tag(14), opacity: r === cur || r === 3 ? 1 : 0.85 }}>Revision {r}</span>
          </div>
        )
      })}
    </>
  )
}
const revY = (y0: number, pitch: number, r: number) => y0 + 50 + (r - 1) * pitch

/* ================================================================== slide 44 · E_T17 · rollout history, rollout undo */

/*
 * 566 x 360. Top: the chart panel (x 20..546, y 20..130), Old (y 55) and New (y 95), tracks to x 470; the New row's
 * release failed its probes (orange cross at x 500), the Old row gets a tick once restored. Bottom left: the terminal
 * (x 20..310, y 150..340): `kubectl rollout history` and its REVISION rows 1, 2, 3 (press 1), then `kubectl rollout undo`
 * (press 2). Bottom right: the revision column (tiles at x 384; header y 166, revisions y 216 / 264 / 312), the undo
 * wire from Revision 3 back to Revision 2 on the column's left (x 346). Press 2 also runs the chart in reverse: new
 * shrinking back to zero while old grows. Held: the chart half way back, the undo drawn.
 */
const D = { W: 566, H: 360, PX: 20, PY: 20, PW: 526, PH: 110, OY: 55, NY: 95, RX: 40, TX1: 470, ST: 500, TX: 20, TY: 150, TW: 290, TH: 190, CX: 384, CY0: 166, PITCH: 48, LOOP: 346 }
const dRev = (r: number) => revY(D.CY0, D.PITCH, r)
const D_UNDO: Pt[] = [[D.CX - 17, dRev(3)], [D.LOOP, dRev(3)], [D.LOOP, dRev(2)], [D.CX - 17, dRev(2)]]
const D_UNDOR = K.ride('t17u', D_UNDO, 0.2, 1.2, 2.8)

const E_T17: Fig = (p) => {
  const { hot, s, held } = useBuild({ ...p, steps: p.steps ?? 2 }, 2800)
  const run = s(2) && !held
  return (
    <Frame w={D.W} h={D.H}>
      {/* the same chart, reversed: new back to zero, old back to full */}
      <Panel x={D.PX} y={D.PY} w={D.PW} h={D.PH} />
      <Bar x={D.RX} y={D.OY} x1={D.TX1} ver="old" k={held ? 0.5 : 0} cls={run ? CH.grow : undefined} />
      <Bar x={D.RX} y={D.NY} x1={D.TX1} ver="new" k={held ? 0.5 : 1} cls={run ? CH.shrink : undefined} />
      <Disc x={D.ST} y={D.OY} icon="check" size={28} on={s(2)} />
      <Disc x={D.ST} y={D.NY} icon="cross" warn size={28} />

      {/* point 1: rollout history; point 2: rollout undo */}
      <TerminalPanel x={D.TX} y={D.TY} w={D.TW} h={D.TH} lit={hot === 1} lines={[
        { text: 'kubectl rollout history', cmd: true, on: s(1) },
        { text: 'REVISION', on: s(1) },
        { text: '1', on: s(1) },
        { text: '2', on: s(1) },
        { text: '3', on: s(1) },
        { text: 'kubectl rollout undo', cmd: true, on: s(2) },
      ]} />
      <Revisions x={D.CX} y0={D.CY0} pitch={D.PITCH} cur={s(2) ? 2 : 3} lit={hot === 0 ? 0 : hot === 1 ? 2 : -1} />
      <Disc x={D.CX + 15} y={dRev(3) - 14} icon="cross" warn size={22} />
      <Disc x={D.CX + 15} y={dRev(2) - 14} icon="check" size={22} on={s(2)} />
      <W pts={D_UNDO} on={s(2)} head={8} width={2.4} />
      <Token cls={D_UNDOR} on={s(2)} size={8} />
    </Frame>
  )
}

/* ================================================================== slide 45 · E_T17B · --to-revision=N, ReplicaSets scaling */

/*
 * 566 x 380. Top: the terminal (x 20..546, y 20..108): `kubectl rollout undo deployment/web-deployment --to-revision=N` (press 1). Left below: two
 * ReplicaSet cards (x 20..330, h 112, y 124 and 248): the Old ReplicaSet (blue pods) and the Bad ReplicaSet (green
 * pods, the orange cross on its mark); six pod slots each (x 40 + 48 i). Right: the revision column (tiles at x 414;
 * header y 146; revisions 196 / 254 / 312) with the jump from Revision 3 to Revision 1 on its left (x 374), press 1.
 * Press 2: the reversal, the old ReplicaSet's pods coming up one by one while the bad one's go, looping.
 * Held: the jump drawn, three pods in each ReplicaSet.
 */
const E = { W: 566, H: 380, TX: 20, TY: 20, TW: 526, TH: 88, CX: 30, CW: 310, CH: 112, PX0: 40, PP: 48, PSZ: 30, RX: 414, RY0: 146, PITCH: 58, LOOP: 374 }
const E_CARD = [124, 248]
const eRev = (r: number) => revY(E.RY0, E.PITCH, r)
const E_JUMP: Pt[] = [[E.RX - 17, eRev(3)], [E.LOOP, eRev(3)], [E.LOOP, eRev(1)], [E.RX - 17, eRev(1)]]
const E_JUMPR = K.ride('t17bj', E_JUMP, 0.2, 1.4, 2.8)

const E_T17B: Fig = (p) => {
  const { hot, s, held } = useBuild({ ...p, steps: p.steps ?? 2 }, 2800)
  const run = s(2) && !held
  const sets = [
    { name: 'Old ReplicaSet', ver: 'old' as const },
    { name: 'Bad ReplicaSet', ver: 'new' as const },
  ]
  return (
    <Frame w={E.W} h={E.H}>
      {/* point 3: the jump to an older revision */}
      <TerminalPanel x={E.TX} y={E.TY} w={E.TW} h={E.TH} lit={hot === 0} lines={[{ text: 'kubectl rollout undo deployment/web-deployment --to-revision=N', cmd: true, on: s(1) }]} size={12.5} />
      <Revisions x={E.RX} y0={E.RY0} pitch={E.PITCH} cur={s(1) ? 1 : 3} lit={hot === 0 ? 1 : -1} />
      <Disc x={E.RX + 15} y={eRev(3) - 14} icon="cross" warn size={22} />
      <Disc x={E.RX + 15} y={eRev(1) - 14} icon="check" size={22} on={s(1)} />
      <W pts={E_JUMP} on={s(1)} head={8} width={2.4} />
      <Token cls={E_JUMPR} on={s(1)} size={8} />

      {/* point 4: the old ReplicaSet scales up, the bad one scales down */}
      {sets.map((rs, k) => {
        const y = E_CARD[k]
        const py = y + 76
        return (
          <div key={rs.name}>
            <Panel x={E.CX - 10} y={y} w={E.CW} h={E.CH} />
            <TitleRow x={E.CX + 10} y={y + 36} mark={rsMark} text={rs.name} size={32} lit={hot === 1} />
            {k === 1 && <Disc x={E.CX + 10 + 30} y={y + 22} icon="cross" warn size={22} />}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const x = E.PX0 + i * E.PP
              /* the static count: before press 2 the old set is empty and the bad one full; held three each */
              const shown = held ? i < 3 : rs.ver === 'old' ? false : true
              const cls = run ? (rs.ver === 'old' ? POD_IN[i] : POD_OUT[i]) : undefined
              return (
                <div key={i} style={{ ...box(x, py - E.PSZ / 2, E.PSZ, E.PSZ), zIndex: 4 }}>
                  <span aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: 9, boxShadow: 'inset 0 0 0 1.5px #D3DEF6', background: '#F5F8FF' }} />
                  <span className={cls} style={{ position: 'absolute', inset: 0, opacity: shown ? 1 : 0, transform: shown ? 'scale(1)' : 'scale(0.6)' }}>
                    <PodTile size={E.PSZ} ver={rs.ver} d={i * 0.4} />
                  </span>
                </div>
              )
            })}
          </div>
        )
      })}
    </Frame>
  )
}

export const figures: Record<string, Fig> = { E_T15, E_T15B, E_T16B, E_T17, E_T17B }
export const css = [
  K.css(),
  KF.join('\n'),
  '.cc-still .s21e-a, .deck-thumb .s21e-a { animation: none !important; }',
  '@media (prefers-reduced-motion: reduce) { .s21e-a { animation: none !important; } }',
].join('\n')
