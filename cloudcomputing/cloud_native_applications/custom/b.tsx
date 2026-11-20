import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Badge, type Loop } from '@/engine/icons3d'
import { EASE, FONT, ORANGE, Frame, Show, Plinth, MarkTile, Panel, Wire, Junction, Token, keyframes, tag, heading, useHeld, useHot, useCycle, type Pt } from '@/engine/figkit'
import herokuMark from '../images/tech-heroku.svg'
import k8sMark from '../images/tech-kubernetes.svg'
import beanstalkMark from '../images/aws-elastic-beanstalk.svg'
import rdsMark from '../images/aws-rds.svg'
import sqsMark from '../images/aws-sqs.svg'
import cacheMark from '../images/aws-elasticache.svg'
import mysqlMark from '../images/tech-mysql.svg'
import usersMark from '../images/res-users.svg'
import asgMark from '../images/aws-ec2-auto-scaling.svg'
import cwLogsMark from '../images/res-cloudwatch-logs.svg'

/*
 * SESSION 18 · SECTION 2 (The Twelve-Factor App) technical figures, builder B.
 * Built to generate-slides standing correction 17 (Sessions 14-16): 3D icons on plinth tiles, official marks on white
 * tiles, >= 20 px equal padding, orthogonal wires computed from the same constants as the boxes, a flow dot on every
 * flow wire, a lit item walking after the build. Loops are transform / opacity on HTML elements only. Held (?still):
 * the full final state, nothing lit, nothing moving. Class prefix `s18b-`.
 *
 *   slide 14 B_T05   546 x 330  the twelve factors, two columns of six; the five that matter in three boxes (2)
 *   slide 15 B_T05B  586 x 380  a factor mends a failing server; one app lands on Heroku, Elastic Beanstalk, Kubernetes (2)
 *   slide 17 B_T06   546 x 330  App Code card apart from the Config card; Secret Store; Dev / Staging / Production (2)
 *   slide 18 B_T06B  586 x 400  App Code -> Config rows -> MySQL / RDS, SQS, ElastiCache, SMTP; RDS Endpoint, SQS Queue URL (3)
 *   slide 19 B_T07   586 x 360  users -> three identical stateless processes; session state in a backing service (2)
 *   slide 20 B_T07B  586 x 400  start and signal into a process; in-flight requests drain; Auto Scaling adds processes (3)
 *   slide 21 B_T08   566 x 330  local log file crossed out; stdout -> runtime -> log router (several hosts) -> storage (3)
 *   slide 22 B_T08B  586 x 380  a container destroyed, its lines kept; the storage becomes CloudWatch Logs (2)
 *   slide 23 B_T10   566 x 330  a funnel narrowing three factors into one Disposable, Scalable Unit; replaced; many (3)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('s18b')
const BLUE = colors.brand
const MONO = "'JetBrains Mono', ui-monospace, monospace"
const NOLIG: CSSProperties = { fontVariantLigatures: 'none', fontFeatureSettings: "'liga' 0, 'calt' 0" }
const ROWBG = '#F4F7FE'
const ROWRIM = 'inset 0 0 0 1px #DCE4F4'
const BLUR = '#C3CEE0'

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)
const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })

/** the build of a figure (a split's second frame passes `from`): the global step, the lit item, held */
function useBuild(p: Record<string, unknown>, period: number) {
  const off = Number(p.from ?? 0)
  const cnt = Number(p.steps ?? 1)
  const held = useHeld()
  const step = held ? off + cnt : stepOf(p) + off
  /* figkit's walk starts at item 0 the moment the build ends; start it on the last item instead, so the final press
     lights what it built (last -> first -> ... -> last) */
  const raw = useHot(cnt, stepOf(p), period)
  const local = raw >= 0 && stepOf(p) >= cnt ? (raw + cnt - 1) % cnt : raw
  const hot = local < 0 ? -1 : local + off
  return { step, hot, held, s: (n: number) => step >= n, live: !held }
}

/** a 3D icon (or an official mark) on its plinth with its tag under (or above) it; the TILE is centred on (x, y) */
function Node({ x, y, label, icon, mark, size = 52, k = 0.74, on = true, lit = false, warm = false, loop = 'bob', d = 0, t, badge, w = 120, tagSize = 14, dim = false, up = false, delay = 0, z = 3, wrap, children }: { x: number; y: number; label?: string; icon?: Ico3DName; mark?: string; size?: number; k?: number; on?: boolean; lit?: boolean; warm?: boolean; loop?: Loop; d?: number; t?: number; badge?: Badge; w?: number; tagSize?: number; dim?: boolean; up?: boolean; delay?: number; z?: number; wrap?: number; children?: ReactNode }) {
  const instant = useInstant()
  const tile = mark ? <MarkTile src={mark} size={size} lit={lit} /> : (
    <Plinth size={size} lit={lit} warm={warm}>
      <Ico3D name={icon ?? 'doc'} size={Math.round(size * k)} loop={loop} d={d} t={t} badge={badge} />
    </Plinth>
  )
  const lab = label ? <span style={{ ...tag(tagSize), ...(wrap ? { whiteSpace: 'normal', width: wrap } : {}), [up ? 'marginBottom' : 'marginTop']: 6 }}>{label}</span> : null
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, width: w, zIndex: z, display: 'flex', flexDirection: up ? 'column-reverse' : 'column', alignItems: 'center', ...(up ? { bottom: `calc(100% - ${y + size / 2}px)` } : { top: y - size / 2 }) }}>
      <div style={{ position: 'relative', width: size, height: size, display: 'grid', placeItems: 'center', opacity: dim ? 0.38 : 1, transition: instant ? 'none' : `opacity 520ms ${EASE}` }}>
        {tile}
        {children}
      </div>
      {lab}
    </Show>
  )
}

/** a small white disc on a tile's corner holding a 3D icon; centred on (x, y) of the frame */
function Corner({ x, y, on = true, size = 28, icon, loop = 'beat', d = 0, ring }: { x: number; y: number; on?: boolean; size?: number; icon: Ico3DName; loop?: Loop; d?: number; ring?: string }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: 6, borderRadius: 99, background: '#FFFFFF', boxShadow: `0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 ${ring ? 2 : 1}px ${ring ?? '#D3DEF6'}`, display: 'grid', placeItems: 'center', opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}` }}>
      <Ico3D name={icon} size={size - 7} loop={loop} d={d} t={2.4} />
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

/** a wire on its own layer above the cards (a Panel is z 2); tiles (z 3) stay on top */
const W = (props: Parameters<typeof Wire>[0]) => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}><Wire {...props} /></div>
)

/** a card title row: an official mark (or a 3D icon) and the heading beside it, the row's left edge at x, centred on y */
function TitleRow({ x, y, mark, icon, text, size = 34, lit = false, font = 16, wrap, loop = 'bob' }: { x: number; y: number; mark?: string; icon?: Ico3DName; text: string; size?: number; lit?: boolean; font?: number; wrap?: number; loop?: Loop }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y - size / 2, height: size, display: 'flex', alignItems: 'center', gap: 10, zIndex: 3 }}>
      {mark ? <MarkTile src={mark} size={size} lit={lit} /> : <Plinth size={size} lit={lit}><Ico3D name={icon ?? 'doc'} size={Math.round(size * 0.74)} loop={loop} /></Plinth>}
      <span style={{ ...heading(font), whiteSpace: wrap ? 'normal' : 'nowrap', ...(wrap ? { width: wrap, lineHeight: 1.12 } : {}) }}>{text}</span>
    </div>
  )
}

/** a value the TR does not give, blurred as a capture would be (rule 53) */
const Blur = ({ w, h = 12 }: { w: number; h?: number }) => <span aria-hidden style={{ display: 'block', width: w, height: h, borderRadius: h / 2, background: BLUR, filter: 'blur(2px)' }} />

/** an orange cross: where a path that never arrives stops */
const XMark = ({ x, y, size = 14, on = true }: { x: number; y: number; size?: number; on?: boolean }) => {
  const instant = useInstant()
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 14 14" style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, zIndex: 4, opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE} 300ms` }}>
      <path d="M 2 2 L 12 12 M 12 2 L 2 12" stroke={ORANGE} strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/** a failed / destroyed mark on a tile's corner: an orange cross on a white disc (template orange, never red) */
function OCross({ x, y, on = true, size = 26 }: { x: number; y: number; on?: boolean; size?: number }) {
  const instant = useInstant()
  return (
    <span aria-hidden style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: 6, borderRadius: 99, background: '#FFFFFF', boxShadow: `0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 2px ${ORANGE}`, display: 'grid', placeItems: 'center', opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}` }}>
      <svg width={size * 0.46} height={size * 0.46} viewBox="0 0 14 14" style={{ display: 'block' }}><path d="M 2 2 L 12 12 M 12 2 L 2 12" stroke={ORANGE} strokeWidth="3" strokeLinecap="round" /></svg>
    </span>
  )
}

/** a box ring that turns orange while lit */
const ringOf = (lit: boolean, base: string) => (lit ? `inset 0 0 0 2.5px ${ORANGE}, 0 10px 22px -12px rgba(255,138,61,0.7)` : base)

/* ================================================================== slide 14 · B_T05 · the twelve factors */

/*
 * 546 x 330. One panel (x 20..526, y 20..310): a title row (list icon, `Twelve-Factor App`; the Heroku mark and 2011 at
 * the right), then the twelve factors in TR order, two columns of six (x 40 and 283, rows from y 96 every 32 px).
 * Press 1 the twelve names fill the numbered rows; press 2 the five that matter most get a box each, in three groups:
 * Config + Backing Services (one box, adjacent rows), Processes + Disposability (two boxes in two columns, joined by
 * one link in the gutter so they read as one group), Logs. After the build the three groups light in turn.
 */
const FACTORS = ['Codebase', 'Dependencies', 'Config', 'Backing Services', 'Build-Release-Run', 'Processes', 'Port Binding', 'Concurrency', 'Disposability', 'Dev/Prod Parity', 'Logs', 'Admin Processes']
const A = { W: 546, H: 330, PX: 20, PY: 20, PW: 506, PH: 290, RY: 96, RP: 32, RH: 28, BW: 196 }
const A_COL = [40, 283]
const aTop = (i: number) => A.RY + (i % 6) * A.RP
const aX = (i: number) => A_COL[i < 6 ? 0 : 1]
/** the group boxes: [first index, last index, group] (a box spans adjacent rows of one column) */
const A_BOX: [number, number, number][] = [[2, 3, 0], [5, 5, 1], [8, 8, 1], [10, 10, 2]]
const A_GROUP = new Set([2, 3, 5, 8, 10])
const aRect = ([a, b]: [number, number, number]) => ({ x: aX(a) - 6, y: aTop(a) - 4, w: A.BW, h: (b - a) * A.RP + A.RH + 8 })
const A_LINK: Pt[] = (() => {
  const p = aRect(A_BOX[1])
  const q = aRect(A_BOX[2])
  const gx = (p.x + p.w + q.x) / 2
  return [[p.x + p.w, aTop(5) + A.RH / 2], [gx, aTop(5) + A.RH / 2], [gx, aTop(8) + A.RH / 2], [q.x, aTop(8) + A.RH / 2]]
})()
const A_PH = [62, 96, 54, 112, 128, 80, 100, 88, 104, 110, 46, 120]

const B_T05: Fig = (p) => {
  const { step, held, s } = useBuild({ ...p, steps: p.steps ?? 2 }, 1600)
  const instant = useInstant()
  const cyc = useCycle(3, step >= 2, 1600)
  const headLit = !held && step === 1
  const tr = (ms: number) => (instant ? 'none' : `opacity ${ms}ms ${EASE}, box-shadow 420ms ${EASE}, border-color 420ms ${EASE}`)
  return (
    <Frame w={A.W} h={A.H}>
      <Panel x={A.PX} y={A.PY} w={A.PW} h={A.PH} />
      <TitleRow x={40} y={56} icon="list" text="Twelve-Factor App" size={36} lit={headLit} font={17} />
      <div style={{ position: 'absolute', right: A.W - 506, top: 56 - 17, height: 34, display: 'flex', alignItems: 'center', gap: 9, zIndex: 3 }}>
        <MarkTile src={herokuMark} size={34} />
        <span style={{ fontFamily: MONO, ...NOLIG, fontSize: 15, fontWeight: 600, color: colors.ink }}>2011</span>
      </div>

      {/* press 2: the boxes behind the five rows, and the link that pairs Processes with Disposability */}
      {A_BOX.map((b, i) => {
        const r = aRect(b)
        const lit = cyc === b[2]
        return (
          <div key={i} style={{ ...box(r.x, r.y, r.w, r.h), zIndex: 3, borderRadius: 10, background: 'rgba(45,99,251,0.07)', border: `2px solid ${lit ? ORANGE : '#9DB6EE'}`, opacity: s(2) ? 1 : 0, transition: tr(520) }} />
        )
      })}
      <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none', opacity: s(2) ? 1 : 0, transition: instant ? 'none' : `opacity 520ms ${EASE} 200ms` }}>
        <Wire pts={A_LINK} head={0} width={2} color={cyc === 1 ? ORANGE : '#9DB6EE'} />
      </div>

      {FACTORS.map((f, i) => {
        const x = aX(i)
        const y = aTop(i)
        const dimmed = s(2) && !A_GROUP.has(i)
        return (
          <div key={f} style={{ ...box(x, y, 210, A.RH), zIndex: 4, display: 'flex', alignItems: 'center', gap: 10, opacity: dimmed ? 0.42 : 1, transition: tr(520) }}>
            <span style={{ width: 24, height: 24, flexShrink: 0, borderRadius: 99, display: 'grid', placeItems: 'center', background: A_GROUP.has(i) && s(2) ? BLUE : '#EAF0FF', boxShadow: 'inset 0 0 0 1px #C9D7F7', fontFamily: MONO, ...NOLIG, fontSize: 14, fontWeight: 700, color: A_GROUP.has(i) && s(2) ? '#FFFFFF' : colors.brandDark, transition: instant ? 'none' : `background 420ms ${EASE}, color 420ms ${EASE}` }}>{i + 1}</span>
            <span style={{ position: 'relative', height: A.RH, flex: 1 }}>
              <span style={{ position: 'absolute', left: 0, top: 9, width: A_PH[i], height: 10, borderRadius: 5, background: '#E3EAF8', opacity: s(1) ? 0 : 1, transition: tr(300) }} />
              <span style={{ position: 'absolute', left: 0, top: 3, ...heading(16), fontWeight: 600, whiteSpace: 'nowrap', opacity: s(1) ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE} ${s(1) ? i * 45 : 0}ms` }}>{f}</span>
            </span>
          </div>
        )
      })}

      {/* the checklist mark on each box of the five */}
      {A_BOX.map((b, i) => {
        const r = aRect(b)
        return <Corner key={i} x={r.x + r.w - 2} y={r.y + 2} size={26} icon="checklist" on={s(2)} loop="pulse" d={i * 0.4} ring={cyc === b[2] ? ORANGE : undefined} />
      })}
    </Frame>
  )
}

/* ================================================================== slide 15 · B_T05B · a fix, and any platform */

/*
 * 586 x 380. Left card (x 20..196): the Factor (wrench, tag above) at y 135, a wire down to the server at y 285 whose
 * corner shows the operational failure (alert) until press 1 mends it (tick). Right card (x 216..566): the title row
 * (cloud, `Platforms`), the App (package, tag above) at (391, 130), a junction at y 200 and three marks at y 268:
 * Heroku, Elastic Beanstalk, Kubernetes (press 2). The loop: the same app rides to each platform in turn.
 */
const B = { W: 586, H: 380, LX: 20, LW: 176, RX: 216, RW: 350, Y: 20, H2: 340, FX: 108, FY: 135, SY: 285, TS: 60, AX: 391, AY: 130, AS: 56, J: 200, PY: 268, PS: 56, PER: 4.5 }
const B_PX = [286, 391, 496]
const B_PLAT = [{ mark: herokuMark, label: 'Heroku' }, { mark: beanstalkMark, label: 'Elastic Beanstalk' }, { mark: k8sMark, label: 'Kubernetes' }]
const bBranch = (x: number): Pt[] => (x === B.AX ? [[B.AX, B.AY + B.AS / 2], [x, B.PY - B.PS / 2]] : [[B.AX, B.AY + B.AS / 2], [B.AX, B.J], [x, B.J], [x, B.PY - B.PS / 2]])
const B_HOP = B_PX.map((x, i) => K.ride(`t5hop${i}`, bBranch(x), i * 1.5, i * 1.5 + 1.1, B.PER, 1))
const B_FIX = K.ride('t5fix', [[B.FX, B.FY + B.TS / 2], [B.FX, B.SY - B.TS / 2]], 0.2, 1.2, 2.6)

const B_T05B: Fig = (p) => {
  const { hot, s, held } = useBuild({ ...p, steps: p.steps ?? 2 }, 2000)
  const fixed = s(1)
  return (
    <Frame w={B.W} h={B.H}>
      <Panel x={B.LX} y={B.Y} w={B.LW} h={B.H2} lit={false} />
      <Panel x={B.RX} y={B.Y} w={B.RW} h={B.H2} />

      {/* point 1: a factor fixes one operational failure */}
      <W pts={[[B.FX, B.FY + B.TS / 2], [B.FX, B.SY - B.TS / 2]]} on={fixed} lit={hot === 0} head={10} />
      <Node x={B.FX} y={B.FY} icon="wrench" size={B.TS} label="Factor" up on={fixed} lit={hot === 0} loop="swing" t={3} />
      <Node x={B.FX} y={B.SY} icon="server" size={B.TS} lit={hot === 0} d={0.4} />
      <Corner x={B.FX + B.TS / 2 - 4} y={B.SY - B.TS / 2 + 4} icon="alert" on={!fixed} size={30} />
      <Corner x={B.FX + B.TS / 2 - 4} y={B.SY - B.TS / 2 + 4} icon="check" on={fixed} size={30} loop="pulse" />
      <Token cls={B_FIX} on={fixed} />

      {/* point 2: one app, unchanged, on each platform */}
      <TitleRow x={B.RX + 20} y={56} icon="cloud" text="Platforms" size={36} lit={hot === 1} />
      <Node x={B.AX} y={B.AY} icon="package" size={B.AS} label="App" up lit={hot === 1} loop="float" />
      {B_PX.map((x) => <W key={x} pts={bBranch(x)} on={s(2)} lit={hot === 1} head={x === B.AX ? 10 : 9} />)}
      <Junction x={B.AX} y={B.J} on={s(2)} lit={hot === 1} />
      {B_PX.map((x, i) => (
        <Node key={x} x={x} y={B.PY} mark={B_PLAT[i].mark} size={B.PS} label={B_PLAT[i].label} w={104} wrap={i === 1 ? 96 : undefined} on={s(2)} delay={i * 140} />
      ))}
      {B_PX.map((x, i) => <Corner key={x} x={x + B.PS / 2 - 2} y={B.PY - B.PS / 2 + 2} icon="package" size={26} on={s(2)} loop="bob" d={i * 0.5} />)}
      {!held && B_HOP.map((c, i) => <Rider key={i} cls={c} icon="package" on={s(2)} size={26} />)}
    </Frame>
  )
}

/* ================================================================== slide 17 · B_T06 · App Code apart from Config */

/*
 * 546 x 330. App Code card (x 20..136, y 20..196): the code tile, its tag, a few code lines. Under it the Secret Store
 * (vault) at (78, 254). Config card (x 170..526, y 20..310): title row (gear, `Config`), and from press 2 the
 * Dev / Staging / Production tabs at its right; rows at y 118 (Database URLs), 186 (Feature Flags), 254 (the secrets:
 * key and password, masked). Wires: the two variable rows into the App Code card's right edge; the Secret Store into
 * the Config card's left edge. Press 2: the tab cycles, the values change, the code does not.
 */
const C = { W: 546, H: 330, AX: 20, AW: 110, AY: 20, AH: 176, CX: 160, CW: 366, CY: 20, CH: 290, VX: 75, VY: 254, VS: 52, RX: 180, RW: 326, RH: 44, PER: 3 }
const C_RY = [118, 186, 254]
const C_ENV = ['Dev', 'Staging', 'Production']
/** the blurred value widths per environment, per row */
const C_VAL = [[132, 108, 150], [70, 92, 58], [0, 0, 0]]
const C_IN = [0, 1].map((i) => K.ride(`t6in${i}`, [[C.CX, C_RY[i]], [C.AX + C.AW, C_RY[i]]], 0.2 + i * 1.2, 0.9 + i * 1.2, C.PER))
const C_KEY = K.ride('t6key', [[C.VX + C.VS / 2, C.VY], [C.CX, C.VY]], 0.4, 1.5, C.PER)

function MaskDots({ n = 8 }: { n?: number }) {
  return (
    <span aria-hidden style={{ display: 'flex', gap: 5 }}>
      {Array.from({ length: n }, (_, i) => <span key={i} style={{ width: 7, height: 7, borderRadius: 99, background: colors.brandDeep, opacity: 0.75 }} />)}
    </span>
  )
}

const B_T06: Fig = (p) => {
  const { hot, s, held } = useBuild({ ...p, steps: p.steps ?? 2 }, 2000)
  const instant = useInstant()
  const cyc = useCycle(3, s(2) && !held, 1800)
  const env = cyc < 0 ? 0 : cyc
  return (
    <Frame w={C.W} h={C.H}>
      <Panel x={C.AX} y={C.AY} w={C.AW} h={C.AH} lit={hot === 1} />
      <Panel x={C.CX} y={C.CY} w={C.CW} h={C.CH} />

      {/* the App Code card: the code, unchanged in every environment */}
      <Node x={C.AX + C.AW / 2} y={70} icon="code" size={52} label="App Code" w={C.AW - 8} lit={hot === 1} />
      <div style={{ ...box(C.AX + 20, 136, C.AW - 40, 44), zIndex: 3, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {[[0, 52], [10, 46], [10, 30], [0, 40]].map(([ind, w], i) => (
          <span key={i} style={{ marginLeft: ind, width: w, height: 6, borderRadius: 3, background: i % 2 ? '#9DB8FF' : '#C9D7F7' }} />
        ))}
      </div>

      {/* the Config card */}
      <TitleRow x={C.CX + 18} y={54} icon="gear" text="Config" size={34} lit={hot === 0} />
      <Show on={s(2)} style={{ position: 'absolute', right: C.W - (C.CX + C.CW - 20), top: 54 - 16, height: 32, zIndex: 3, display: 'flex', gap: 2, padding: 3, borderRadius: 10, background: ROWBG, boxShadow: ROWRIM }}>
        {C_ENV.map((e, i) => (
          <span key={e} style={{ ...tag(14, env === i && !held ? '#FFFFFF' : env === i ? '#FFFFFF' : colors.brandDeep), padding: '0 8px', display: 'grid', placeItems: 'center', borderRadius: 8, background: env === i ? (hot === 1 ? ORANGE : BLUE) : 'transparent', transition: instant ? 'none' : `background 360ms ${EASE}, color 360ms ${EASE}` }}>{e}</span>
        ))}
      </Show>
      {['Database URLs', 'Feature Flags', ''].map((name, r) => (
        <Show key={r} on={s(1)} delay={r * 120} style={{ ...box(C.RX, C_RY[r] - C.RH / 2, C.RW, C.RH), zIndex: 3 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 10, background: ROWBG, boxShadow: ringOf(hot === 0, ROWRIM), transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }} />
          {name ? (
            <span style={{ position: 'absolute', left: 14, top: 12, ...heading(15), fontWeight: 600, whiteSpace: 'nowrap' }}>{name}</span>
          ) : (
            <span style={{ position: 'absolute', left: 10, top: 6, display: 'flex', gap: 6 }}>
              <Ico3D name="key" size={32} loop="tilt" d={0.3} />
              <Ico3D name="password" size={32} loop="bob" d={0.8} />
            </span>
          )}
          {name ? C_VAL[r].map((w, e) => (
            <span key={e} style={{ position: 'absolute', right: 16, top: 16, opacity: env === e ? 1 : 0, transition: instant ? 'none' : `opacity 360ms ${EASE}` }}><Blur w={w} /></span>
          )) : <span style={{ position: 'absolute', right: 16, top: 18 }}><MaskDots /></span>}
        </Show>
      ))}

      {/* environment variables into the code; the secrets from the store */}
      {[0, 1].map((i) => <W key={i} pts={[[C.CX, C_RY[i]], [C.AX + C.AW, C_RY[i]]]} on={s(1)} lit={hot === 0} head={9} delay={i * 120} />)}
      <W pts={[[C.VX + C.VS / 2, C.VY], [C.CX, C.VY]]} on={s(1)} lit={hot === 0} head={9} />
      <Node x={C.VX} y={C.VY} icon="vault" size={C.VS} label="Secret Store" w={110} on={s(1)} lit={hot === 0} loop="pulse" t={3} />
      {C_IN.map((c, i) => <Token key={i} cls={c} on={s(1)} />)}
      <Rider cls={C_KEY} icon="key" on={s(1)} size={22} />
    </Frame>
  )
}

/* ================================================================== slide 18 · B_T06B · backing services through config */

/*
 * 586 x 400. App Code card (x 20..136, full height), Config card (x 172..382) with four rows at y 112, 182, 252, 322,
 * and the backing services at x 438 on the same rows (tags to the right): the database (MySQL, then RDS from press 2),
 * SQS, ElastiCache, SMTP. Each request leaves the App Code card's right edge, enters its config row and leaves it for
 * its service: the wires pass through the config. Press 2: MySQL swaps for RDS (refresh), the code card untouched
 * (tick). Press 3: the rows name the two environment variables, `RDS Endpoint` and `SQS Queue URL`, and their wires light.
 */
const D = { W: 586, H: 400, AX: 20, AW: 116, Y: 20, H2: 360, CX: 172, CW: 210, SX: 438, SS: 48, RH: 44, PER: 4.8 }
const D_RY = [112, 182, 252, 322]
const D_RX = D.CX + 16
const D_RW = D.CW - 32
const D_SV = [{ mark: sqsMark, label: 'SQS' }, { mark: cacheMark, label: 'ElastiCache' }]
const D_A = (y: number): Pt[] => [[D.AX + D.AW, y], [D.CX, y]]
const D_B = (y: number): Pt[] => [[D.CX + D.CW, y], [D.SX - D.SS / 2, y]]
/* the request rides into its config row, then out of it to the service (never over the row's text) */
const D_REQ = D_RY.flatMap((y, i) => [K.ride(`t6req${i}`, D_A(y), i * 1.2, i * 1.2 + 0.45, D.PER), K.ride(`t6out${i}`, D_B(y), i * 1.2 + 0.55, i * 1.2 + 1.0, D.PER)])

function DName({ text, on }: { text: string; on: boolean }) {
  const instant = useInstant()
  return (
    <>
      <span style={{ position: 'absolute', left: 14, top: 16, opacity: on ? 0 : 1, transition: instant ? 'none' : `opacity 360ms ${EASE}` }}><Blur w={96} /></span>
      <span style={{ position: 'absolute', left: 10, top: 6, display: 'flex', alignItems: 'center', gap: 6, opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE} 120ms` }}>
        <Ico3D name="link" size={30} loop="tilt" />
        <span style={{ ...heading(15), fontWeight: 600, whiteSpace: 'nowrap' }}>{text}</span>
      </span>
    </>
  )
}

const B_T06B: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 3 }, 2000)
  const instant = useInstant()
  const swapped = s(2)
  const named = s(3)
  const rowLit = (r: number) => (hot === 2 && r < 2) || (hot === 1 && r === 0)
  return (
    <Frame w={D.W} h={D.H}>
      <Panel x={D.AX} y={D.Y} w={D.AW} h={D.H2} />
      <Panel x={D.CX} y={D.Y} w={D.CW} h={D.H2} />

      <Node x={D.AX + D.AW / 2} y={D.H / 2 - 12} icon="code" size={56} label="App Code" w={D.AW - 8} lit={hot === 1} />
      <Corner x={D.AX + D.AW / 2 + 24} y={D.H / 2 - 36} icon="check" on={swapped} size={28} loop="pulse" />
      <div style={{ ...box(D.AX + 20, D.H / 2 + 50, D.AW - 40, 44), zIndex: 3, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {[[0, 52], [10, 46], [10, 30], [0, 40]].map(([ind, w], i) => (
          <span key={i} style={{ marginLeft: ind, width: w, height: 6, borderRadius: 3, background: i % 2 ? '#9DB8FF' : '#C9D7F7' }} />
        ))}
      </div>
      <TitleRow x={D.CX + 20} y={54} icon="gear" text="Config" size={34} />
      <TitleRow x={D.SX - D.SS / 2} y={54} icon="database" text="Backing Services" size={34} font={15} wrap={78} lit={hot === 0} />

      {D_RY.map((y, r) => (
        <Show key={y} on={s(1)} delay={r * 110} style={{ ...box(D_RX, y - D.RH / 2, D_RW, D.RH), zIndex: 3 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 10, background: ROWBG, boxShadow: ringOf(rowLit(r), ROWRIM), transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }} />
          {r === 0 && <DName text="RDS Endpoint" on={named} />}
          {r === 1 && <DName text="SQS Queue URL" on={named} />}
          {r > 1 && <span style={{ position: 'absolute', left: 14, top: 16 }}><Blur w={r === 2 ? 110 : 84} /></span>}
        </Show>
      ))}

      {D_RY.map((y, r) => (
        <div key={y}>
          <W pts={D_A(y)} on={s(1)} lit={rowLit(r)} head={8} delay={r * 110} />
          <W pts={D_B(y)} on={s(1)} lit={rowLit(r)} head={8} delay={r * 110 + 200} />
        </div>
      ))}

      {/* the database row: local MySQL until press 2, then Amazon RDS; only that row's value changes */}
      <Node x={D.SX} y={D_RY[0]} mark={mysqlMark} size={D.SS} on={s(1) && !swapped} w={60} />
      <Node x={D.SX} y={D_RY[0]} mark={rdsMark} size={D.SS} on={swapped} lit={hot === 1 || hot === 2} w={60} />
      <span style={{ position: 'absolute', left: D.SX + D.SS / 2 + 10, top: D_RY[0] - 9, zIndex: 3, ...tag(14), textAlign: 'left', opacity: s(1) && !swapped ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE}` }}>MySQL</span>
      <span style={{ position: 'absolute', left: D.SX + D.SS / 2 + 10, top: D_RY[0] - 9, zIndex: 3, ...tag(14), textAlign: 'left', opacity: swapped ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE} 200ms` }}>RDS</span>
      <Corner x={D.SX - D.SS / 2 + 2} y={D_RY[0] + D.SS / 2 - 2} icon="refresh" on={swapped} size={26} loop="spin" />
      {D_SV.map((v, i) => (
        <div key={v.label}>
          <Node x={D.SX} y={D_RY[i + 1]} mark={v.mark} size={D.SS} on={s(1)} lit={hot === 2 && i === 0} w={60} delay={(i + 1) * 110} />
          <span style={{ position: 'absolute', left: D.SX + D.SS / 2 + 10, top: D_RY[i + 1] - 9, zIndex: 3, ...tag(14), textAlign: 'left', opacity: s(1) ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE}` }}>{v.label}</span>
        </div>
      ))}
      <Node x={D.SX} y={D_RY[3]} icon="mail" size={D.SS} on={s(1)} w={60} delay={330} d={0.6} />
      <span style={{ position: 'absolute', left: D.SX + D.SS / 2 + 10, top: D_RY[3] - 9, zIndex: 3, ...tag(14), textAlign: 'left', opacity: s(1) ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE}` }}>SMTP</span>

      {D_REQ.map((c, i) => <Token key={i} cls={c} on={s(1)} size={9} />)}
    </Frame>
  )
}

/* ================================================================== slide 19 · B_T07 · stateless processes */

/*
 * 586 x 360. Users (mark) at (293, 44) -> a junction at y 90 -> three identical process cards (x 30 / 213 / 396,
 * 160 x 88, y 112..200): a cube, `Process`, and `Stateless` from press 1. Press 2: the session state leaves for a
 * backing service below (x 30..556, y 248..340: database tile, `Session State`, three session rows), wired up into
 * every process. The loop: a request reaches one process, which reads the session from the store; then the next.
 */
const E = { W: 586, H: 360, UX: 293, UY: 44, US: 48, J: 90, PY: 112, PH: 88, PW: 160, SY: 248, SH: 92, SX: 30, SW: 526, PER: 6 }
const E_PX = [30, 213, 396]
const eMid = (i: number) => E_PX[i] + E.PW / 2
const eIn = (i: number): Pt[] => (i === 1 ? [[E.UX, E.UY + E.US / 2], [E.UX, E.PY]] : [[E.UX, E.UY + E.US / 2], [E.UX, E.J], [eMid(i), E.J], [eMid(i), E.PY]])
const eUp = (i: number): Pt[] => [[eMid(i), E.SY], [eMid(i), E.PY + E.PH]]
const E_REQ = [0, 1, 2].map((i) => K.ride(`t7req${i}`, eIn(i), i * 2, i * 2 + 0.9, E.PER))
const E_SES = [0, 1, 2].map((i) => K.ride(`t7ses${i}`, eUp(i), i * 2 + 0.9, i * 2 + 1.6, E.PER))
const E_CHIP = [250, 351, 452]

const B_T07: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 2 }, 2000)
  const instant = useInstant()
  return (
    <Frame w={E.W} h={E.H}>
      {/* the users and their requests */}
      <Node x={E.UX} y={E.UY} mark={usersMark} size={E.US} w={60} />
      <span style={{ position: 'absolute', left: E.UX + E.US / 2 + 10, top: E.UY - 9, ...tag(14), zIndex: 3 }}>Users</span>
      {[0, 1, 2].map((i) => <W key={i} pts={eIn(i)} head={9} lit={hot === 0} />)}
      <Junction x={E.UX} y={E.J} lit={hot === 0} />

      {/* three identical, share-nothing processes */}
      {E_PX.map((x, i) => (
        <Panel key={x} x={x} y={E.PY} w={E.PW} h={E.PH} lit={hot === 0}>
          <div style={{ position: 'absolute', left: 20, top: (E.PH - 46) / 2 }}>
            <Plinth size={46}><Ico3D name="cube" size={34} loop="bob" d={i * 0.5} /></Plinth>
          </div>
          <span style={{ position: 'absolute', left: 76, top: 22, ...heading(15) }}>Process</span>
          <span style={{ position: 'absolute', left: 76, top: 46, ...tag(14, BLUE), textAlign: 'left', opacity: s(1) ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE} ${i * 120}ms` }}>Stateless</span>
        </Panel>
      ))}

      {/* press 2: the session state lives in a backing service, read by any process */}
      <Panel x={E.SX} y={E.SY} w={E.SW} h={E.SH} on={s(2)} lit={hot === 1} />
      <Show on={s(2)} style={{ ...box(0, 0, E.W, E.H), zIndex: 3, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', left: E.SX + 20, top: E.SY + (E.SH - 50) / 2 }}>
          <Plinth size={50} lit={hot === 1}><Ico3D name="database" size={37} loop="bob" d={0.3} /></Plinth>
        </div>
        <span style={{ position: 'absolute', left: E.SX + 82, top: E.SY + E.SH / 2 - 10, ...heading(16) }}>Session State</span>
      </Show>
      {E_CHIP.map((x, i) => (
        <Show key={x} on={s(2)} delay={150 + i * 120} lift={-44} style={{ ...box(x, E.SY + (E.SH - 44) / 2, 84, 44), zIndex: 3 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 10, background: ROWBG, boxShadow: ROWRIM }} />
          <span style={{ position: 'absolute', left: 8, top: 7 }}><Ico3D name="user" size={30} loop="bob" d={i * 0.6} /></span>
          <span style={{ position: 'absolute', left: 42, top: 16 }}><Blur w={30} /></span>
        </Show>
      ))}
      {[0, 1, 2].map((i) => <W key={i} pts={eUp(i)} on={s(2)} lit={hot === 1} head={9} delay={i * 120} />)}

      {E_REQ.map((c, i) => <Token key={i} cls={c} />)}
      {E_SES.map((c, i) => <Token key={i} cls={c} on={s(2)} tone={colors.brandDeep} square size={10} />)}
    </Frame>
  )
}

/* ================================================================== slide 20 · B_T07B · start fast, stop gracefully */

/*
 * 586 x 400. Top: Start (stopwatch) at (60, 108) -> the process card (x 128..458, y 20..196) <- Signal (power) at
 * (526, 108). In the card: the title row (cube, `Process`), three in-flight requests and, from press 2, the hourglass:
 * the requests drain before the process exits. Bottom card (x 20..566, y 216..380, press 3): Auto Scaling (mark) ->
 * a dashed group of three processes, each with a rocket (fast startup), and the idle cost staying low (coin, minus).
 */
const G = { W: 586, H: 400, SX: 60, SY: 108, TS: 56, PX: 128, PY: 20, PW: 330, PH: 176, GX: 526, BY: 216, BH: 164, MX: 96, MY: 290, FX: 170, FW: 234, FY: 244, FH: 92, CX: 488, PER: 6 }
const G_REQ = [172, 216, 260]
const G_CUBE = [216, 287, 358]
const G_START = K.ride('t7start', [[G.SX + G.TS / 2, G.SY], [G.PX, G.SY]], 0.2, 0.9, 3)
const G_SIG = K.ride('t7sig', [[G.GX - G.TS / 2, G.SY], [G.PX + G.PW, G.SY]], 1.6, 2.3, 3)
const G_ADD = K.ride('t7add', [[G.MX + 28, G.MY], [G.FX, G.MY]], 0.2, 0.9, 2.5)

const B_T07B: Fig = (p) => {
  const { hot, s, live } = useBuild({ ...p, steps: p.steps ?? 3 }, 2000)
  const drain = s(2) && live
  return (
    <Frame w={G.W} h={G.H}>
      {/* point 1: start within seconds, shut down on signal */}
      <Panel x={G.PX} y={G.PY} w={G.PW} h={G.PH} lit={hot === 1} />
      <div className={drain ? 's18b-l s18b-exit' : undefined} style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}>
        <TitleRow x={G.PX + 20} y={56} icon="cube" text="Process" size={36} />
      </div>
      <W pts={[[G.SX + G.TS / 2, G.SY], [G.PX, G.SY]]} on={s(1)} lit={hot === 0} head={9} />
      <W pts={[[G.GX - G.TS / 2, G.SY], [G.PX + G.PW, G.SY]]} on={s(1)} lit={hot === 0} head={9} />
      <Node x={G.SX} y={G.SY} icon="stopwatch" size={G.TS} label="Start" w={80} on={s(1)} lit={hot === 0} loop="pulse" />
      <Node x={G.GX} y={G.SY} icon="power" size={G.TS} label="Signal" w={80} on={s(1)} lit={hot === 0} loop="beat" delay={140} />
      <Token cls={G_START} on={s(1)} />
      <Token cls={G_SIG} on={s(1)} tone={ORANGE} />

      {/* point 2: in-flight requests drain before the process exits */}
      {G_REQ.map((x, i) => (
        <span key={x} style={{ position: 'absolute', left: x - 15, top: 128 - 15, width: 30, height: 30, zIndex: 3 }}>
          <span className={drain ? `s18b-l s18b-dr${i}` : undefined} style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 99, background: '#FFFFFF', boxShadow: `inset 0 0 0 2px ${hot === 1 ? ORANGE : '#B9CEFB'}, 0 4px 10px -5px rgba(31,64,140,0.5)` }}>
            <span style={{ width: 12, height: 12, borderRadius: 99, background: BLUE }} />
          </span>
        </span>
      ))}
      <span style={{ position: 'absolute', left: G_REQ[0] - 30, top: 152, ...tag(14), zIndex: 3 }}>In-Flight Requests</span>
      <Node x={400} y={128} icon="hourglass" size={50} on={s(2)} lit={hot === 1} loop="tilt" t={3} />

      {/* point 3: autoscaling adds processes quickly; idle cost stays low */}
      <Panel x={20} y={G.BY} w={G.W - 40} h={G.BH} on={s(3)} />
      <W pts={[[G.MX + 28, G.MY], [G.FX, G.MY]]} on={s(3)} lit={hot === 2} head={9} delay={200} />
      <Node x={G.MX} y={G.MY} mark={asgMark} size={56} label="Auto Scaling" w={120} on={s(3)} lit={hot === 2} />
      <Show on={s(3)} delay={150} style={{ ...box(G.FX, G.FY, G.FW, G.FH), zIndex: 3 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 14, border: `2px dashed ${hot === 2 ? ORANGE : '#9DB6EE'}`, background: 'rgba(45,99,251,0.04)' }} />
      </Show>
      {G_CUBE.map((x, i) => (
        <div key={x} className={live && s(3) && i > 0 ? `s18b-l s18b-up${i}` : undefined} style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none', transformOrigin: `${x}px ${G.MY}px` }}>
          <Node x={x} y={G.MY} icon="cube" size={48} on={s(3)} delay={250 + i * 120} d={i * 0.4} z={4} />
          <Corner x={x + 20} y={G.MY - 20} icon="rocket" size={26} on={s(3)} loop="bob" d={i * 0.3} />
        </div>
      ))}
      <Node x={G.CX} y={G.MY} icon="coin" size={56} label="Idle Cost" w={100} on={s(3)} lit={hot === 2} badge="minus" loop="pulse" delay={400} />
      <Token cls={G_ADD} on={s(3)} />
    </Frame>
  )
}

/* ================================================================== slide 21 · B_T08 · logs as a stream */

/*
 * 566 x 330. Lanes at y 70 / 165 / 260. The local log file (50, 165) <- the stdout terminal card (x 116..250,
 * y 95..235); press 1 that path is crossed out (dashed, faded, orange cross) and lines stream in the terminal. Press 2
 * the runtime (container) at (310, 165) captures the stream. Press 3 two more hosts (y 70, 260) join at a junction
 * (356) into the log router (merge) at (405, 165), which feeds the centralised storage (log) at (496, 165).
 */
const H = { W: 566, H: 330, FX: 50, LY: 165, TX: 116, TW: 134, TY: 95, TH: 140, RX: 310, RS: 52, J: 356, OX: 405, SX: 496, SS: 56, PER: 3.6 }
const H_UP = [70, 260]
const H_MAIN: Pt[] = [[H.TX + H.TW, H.LY], [H.RX - H.RS / 2, H.LY]]
const H_TO_R: Pt[] = [[H.RX + H.RS / 2, H.LY], [H.OX - H.RS / 2, H.LY]]
const hHost = (y: number): Pt[] => [[H.RX + H.RS / 2, y], [H.J, y], [H.J, H.LY]]
const H_OUT: Pt[] = [[H.OX + H.RS / 2, H.LY], [H.SX - H.SS / 2, H.LY]]
const H_LOG = K.ride('t8log', [...H_MAIN, ...H_TO_R, ...H_OUT], 0, 2.2, H.PER)
const H_CAP = K.ride('t8cap', H_MAIN, 0, 0.8, 2.4)
const H_HOST = H_UP.map((y, i) => K.ride(`t8host${i}`, [...hHost(y), [H.OX - H.RS / 2, H.LY], ...H_OUT], 0.6 + i * 1.2, 2.4 + i * 1.2, H.PER))
const H_BARS: [number, string][] = [[62, '#8DB0FF'], [44, '#FFC9A0'], [70, '#8DB0FF'], [36, '#9AF0C2'], [58, '#8DB0FF'], [48, '#FFC9A0'], [66, '#8DB0FF'], [40, '#9AF0C2']]

const B_T08: Fig = (p) => {
  const { hot, s, live } = useBuild({ ...p, steps: p.steps ?? 3 }, 2000)
  const crossed = s(1)
  return (
    <Frame w={H.W} h={H.H}>
      {/* point 1: no local log file; events go to standard output */}
      {!crossed && <W pts={[[H.TX, H.LY], [H.FX + 27, H.LY]]} head={9} />}
      {crossed && <W pts={[[H.TX, H.LY], [H.FX + 44, H.LY]]} head={0} dash="5 6" opacity={0.5} />}
      <XMark x={H.FX + 37} y={H.LY} on={crossed} />
      <Node x={H.FX} y={H.LY} icon="doc" size={52} label="Log File" w={76} dim={crossed} />

      <Panel x={H.TX} y={H.TY} w={H.TW} h={H.TH} lit={hot === 0} />
      <TitleRow x={H.TX + 16} y={H.TY + 26} icon="terminal" text="stdout" size={32} font={15} />
      <div style={{ ...box(H.TX + 16, H.TY + 52, H.TW - 32, H.TH - 68), zIndex: 3, borderRadius: 10, background: `linear-gradient(180deg, ${colors.night3} 0%, ${colors.night2} 100%)`, overflow: 'hidden' }}>
        <div className={crossed && live ? 's18b-l s18b-stream' : undefined} style={{ position: 'absolute', left: 10, top: 9, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...H_BARS, ...H_BARS].map(([w, c], i) => <span key={i} style={{ width: w, height: 6, borderRadius: 3, background: c, opacity: 0.9 }} />)}
        </div>
      </div>

      {/* point 2: the runtime captures the stream */}
      <W pts={H_MAIN} on={s(2)} lit={hot === 1} head={9} />
      <Node x={H.RX} y={H.LY} icon="container" size={H.RS} label="Runtime" w={80} on={s(2)} lit={hot === 1} />
      <Token cls={H_CAP} on={s(2) && !s(3)} square size={9} />

      {/* point 3: streams from several hosts merge at the router, then central storage */}
      {H_UP.map((y, i) => (
        <div key={y}>
          <Node x={H.RX} y={y} icon="container" size={H.RS} on={s(3)} lit={hot === 2} delay={i * 140} d={0.4 + i * 0.4} />
          <Corner x={H.RX - H.RS / 2 + 2} y={y - H.RS / 2 + 2} icon="terminal" size={26} on={s(3)} loop="none" />
          <W pts={hHost(y)} on={s(3)} lit={hot === 2} head={0} delay={200 + i * 140} />
        </div>
      ))}
      <W pts={H_TO_R} on={s(3)} lit={hot === 2} head={9} />
      <Junction x={H.J} y={H.LY} on={s(3)} lit={hot === 2} />
      <Node x={H.OX} y={H.LY} icon="merge" size={H.RS} label="Log Router" w={84} on={s(3)} lit={hot === 2} loop="pulse" />
      <W pts={H_OUT} on={s(3)} lit={hot === 2} head={9} delay={300} />
      <Node x={H.SX} y={H.LY} icon="log" size={H.SS} label="Centralised Storage" w={90} wrap={86} on={s(3)} delay={300} />
      <Token cls={H_LOG} on={s(3)} square size={9} />
      {H_HOST.map((c, i) => <Token key={i} cls={c} on={s(3)} square size={9} />)}
    </Frame>
  )
}

/* ================================================================== slide 22 · B_T08B · logs outlive the process */

/*
 * 586 x 380. Three containers at x 64 (y 120 / 205 / 290) wired into the storage card (x 170..566, y 20..360), one row
 * of time-ordered events per container. Press 1: the top container is destroyed (faded, orange cross) and its events
 * stay in the store. Press 2: the store is Amazon CloudWatch Logs, its rows the log groups. The loop: containers come
 * and go while the rows keep filling.
 */
const L = { W: 586, H: 380, CX: 64, CS: 56, PX: 170, PY: 20, PW: 396, PH: 340, RX: 190, RW: 356, RH: 60, PER: 4.8 }
const L_Y = [120, 205, 290]
const L_EV = 8
const L_TOK = L_Y.map((y, i) => K.ride(`t8b${i}`, [[L.CX + L.CS / 2, y], [L.PX, y]], i * 1.2, i * 1.2 + 0.8, 3.6))

const B_T08B: Fig = (p) => {
  const { hot, s, live } = useBuild({ ...p, steps: p.steps ?? 2 }, 2200)
  const instant = useInstant()
  const cyc = useCycle(3, s(2) && live, 2400)
  const gone = (i: number) => (cyc >= 0 ? cyc === i : s(1) && i === 0)
  const cw = s(2)
  return (
    <Frame w={L.W} h={L.H}>
      <Panel x={L.PX} y={L.PY} w={L.PW} h={L.PH} lit={hot === 1} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 3, opacity: cw ? 0 : 1, transition: instant ? 'none' : `opacity 420ms ${EASE}`, pointerEvents: 'none' }}>
        <TitleRow x={L.PX + 20} y={58} icon="log" text="Centralised Storage" size={36} lit={hot === 0} />
      </div>
      <div style={{ position: 'absolute', inset: 0, zIndex: 3, opacity: cw ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE} 120ms`, pointerEvents: 'none' }}>
        <TitleRow x={L.PX + 20} y={58} mark={cwLogsMark} text="CloudWatch Logs" size={36} lit={hot === 1} />
        <span style={{ position: 'absolute', right: L.W - (L.PX + L.PW - 20), top: 58 - 9, ...tag(14, BLUE) }}>Log Groups</span>
      </div>

      {L_Y.map((y, i) => (
        <div key={y}>
          <W pts={[[L.CX + L.CS / 2, y], [L.PX, y]]} head={9} opacity={gone(i) ? 0.3 : 1} lit={hot === 0 && i === 0} />
          <Node x={L.CX} y={y} icon="container" size={L.CS} dim={gone(i)} lit={hot === 0 && i === 0} d={i * 0.4} />
          <OCross x={L.CX + L.CS / 2 - 4} y={y - L.CS / 2 + 4} on={gone(i)} />
          {!gone(i) && <Token cls={L_TOK[i]} square size={9} />}
          {/* the log group row: its events stay after its container has gone */}
          <div style={{ ...box(L.RX, y - L.RH / 2, L.RW, L.RH), zIndex: 3 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 12, background: ROWBG, boxShadow: ringOf(hot === 0 && i === 0, ROWRIM), transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }} />
            <span style={{ position: 'absolute', left: 12, top: 12 }}><Ico3D name="log" size={36} loop="bob" d={i * 0.5} /></span>
            {Array.from({ length: L_EV }, (_, e) => (
              <span key={e} className={live && e >= L_EV - 3 ? `s18b-l s18b-ev${e - (L_EV - 3)}` : undefined} style={{ position: 'absolute', left: 62 + e * 34, top: 25, width: 26, height: 10, borderRadius: 5, background: e % 3 === 1 ? '#FFC9A0' : '#9DB8FF', ['--s18b-d' as string]: `${-i * 0.6}s` } as CSSProperties} />
            ))}
          </div>
        </div>
      ))}
    </Frame>
  )
}

/* ================================================================== slide 23 · B_T10 · the funnel to one unit */

/*
 * 566 x 330. Three factor tiles on top (x 80 / 260 / 440, y 46: Config, Processes / Disposability, Logs) above a
 * funnel (top y 106, x 30..490, neck x 230..290 at y 176, spout to y 196) with the twelve-factor checklist inside
 * (press 1). Under the spout the unit (cube) at (260, 252), tagged `Disposable, Scalable Unit`. Press 2: an old unit
 * (faded, cross) at (90, 252) and a refresh between: replaced by an identical one. Press 3: a wire to a dashed group
 * of three identical units (x 372..544). The loop: units drop out of the funnel; the group grows and shrinks.
 */
const M = { W: 566, H: 330, TY: 44, TS: 52, FT: 114, FL: 30, FR: 490, NL: 230, NR: 290, NY: 176, SB: 196, UX: 260, UY: 252, US: 56, OX: 90, RX: 175, GX: 372, GW: 172, GY: 212, GH: 80, PER: 3 }
const M_F: { x: number; icon: Ico3DName; label: string }[] = [
  { x: 80, icon: 'gear', label: 'Config' },
  { x: 260, icon: 'stopwatch', label: 'Processes / Disposability' },
  { x: 440, icon: 'log', label: 'Logs' },
]
const M_G = [412, 458, 504]
const M_DROP = M_F.map((f, i) => K.ride(`t10f${i}`, [[f.x, M.FT - 8], [f.x, M.FT + 12]], i * 0.4, i * 0.4 + 0.6, M.PER))
const M_OUT = K.ride('t10out', [[M.UX, M.NY + 2], [M.UX, M.UY - M.US / 2]], 1.4, 2.4, M.PER)
const M_TO_G = K.ride('t10g', [[M.UX + M.US / 2, M.UY], [M.GX, M.UY]], 0.3, 1.1, M.PER)

function Funnel({ lit }: { lit: boolean }) {
  const instant = useInstant()
  const d = `M ${M.FL} ${M.FT} L ${M.FR} ${M.FT} L ${M.NR} ${M.NY} L ${M.NR} ${M.SB} L ${M.NL} ${M.SB} L ${M.NL} ${M.NY} Z`
  return (
    <svg aria-hidden width={M.W} height={M.H} style={{ position: 'absolute', left: 0, top: 0, zIndex: 2, overflow: 'visible' }}>
      <defs>
        <linearGradient id="s18b-fun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F3F7FF" />
          <stop offset="1" stopColor="#D9E5FF" />
        </linearGradient>
      </defs>
      <path d={d} fill="url(#s18b-fun)" stroke={lit ? ORANGE : '#9DB6EE'} strokeWidth={2.5} strokeLinejoin="round" style={{ transition: instant ? 'none' : `stroke 420ms ${EASE}` }} />
      <ellipse cx={(M.FL + M.FR) / 2} cy={M.FT} rx={(M.FR - M.FL) / 2} ry={7} fill="#FFFFFF" stroke={lit ? ORANGE : '#9DB6EE'} strokeWidth={2} style={{ transition: instant ? 'none' : `stroke 420ms ${EASE}` }} />
    </svg>
  )
}

const B_T10: Fig = (p) => {
  const { hot, s, live } = useBuild({ ...p, steps: p.steps ?? 3 }, 2000)
  return (
    <Frame w={M.W} h={M.H}>
      {M_F.map((f, i) => <Node key={f.label} x={f.x} y={M.TY} icon={f.icon} size={M.TS} label={f.label} w={200} lit={hot === 0} d={i * 0.4} loop={f.icon === 'gear' ? 'spin' : 'bob'} t={f.icon === 'gear' ? 8 : undefined} />)}
      <Funnel lit={hot === 0} />
      <Node x={M.UX} y={146} icon="checklist" size={44} on={s(1)} lit={hot === 0} z={3} />
      {M_DROP.map((c, i) => <Token key={i} cls={c} />)}

      {/* the unit, out of the spout */}
      <W pts={[[M.UX, M.SB], [M.UX, M.UY - M.US / 2]]} head={8} />
      <Node x={M.UX} y={M.UY} icon="cube" size={M.US} label="Disposable, Scalable Unit" w={220} lit={hot === 1 || hot === 2} />
      <Rider cls={M_OUT} icon="cube" size={24} />

      {/* point 2: replaced safely by an identical one */}
      <Node x={M.OX} y={M.UY} icon="cube" size={48} dim on={s(2)} loop="none" />
      <OCross x={M.OX + 20} y={M.UY - 20} size={24} on={s(2)} />
      <Node x={M.RX} y={M.UY} icon="refresh" size={40} on={s(2)} lit={hot === 1} loop="spin" t={6} delay={150} />

      {/* point 3: one service or many */}
      <W pts={[[M.UX + M.US / 2, M.UY], [M.GX, M.UY]]} on={s(3)} lit={hot === 2} head={9} />
      <Show on={s(3)} delay={150} style={{ ...box(M.GX, M.GY, M.GW, M.GH), zIndex: 3 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 14, border: `2px dashed ${hot === 2 ? ORANGE : '#9DB6EE'}`, background: 'rgba(45,99,251,0.04)' }} />
      </Show>
      {M_G.map((x, i) => (
        <div key={x} className={live && s(3) && i > 0 ? `s18b-l s18b-up${i}` : undefined} style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none', transformOrigin: `${x}px ${M.UY}px` }}>
          <Node x={x} y={M.UY} icon="cube" size={40} on={s(3)} delay={250 + i * 120} d={i * 0.4} z={4} />
        </div>
      ))}
      <Token cls={M_TO_G} on={s(3)} />
    </Frame>
  )
}

export const figures: Record<string, Fig> = { B_T05, B_T05B, B_T06, B_T06B, B_T07, B_T07B, B_T08, B_T08B, B_T10 }

/* loop keyframes (transform / opacity only, on HTML elements) */
const DR = [0, 1, 2].map((i) => {
  const a = 8 + i * 14
  return `@keyframes s18b-dr${i} { 0%, ${a}% { opacity: 1; transform: scale(1) } ${a + 10}%, 74% { opacity: 0; transform: scale(0.5) } 86%, 100% { opacity: 1; transform: scale(1) } }
.s18b-dr${i} { animation: s18b-dr${i} ${G.PER}s cubic-bezier(0.45,0,0.55,1) infinite; }`
}).join('\n')
const UP = [1, 2].map((i) => `@keyframes s18b-up${i} { 0%, ${10 + i * 8}% { opacity: 0; transform: scale(0.7) } ${18 + i * 8}%, 72% { opacity: 1; transform: scale(1) } 84%, 100% { opacity: 0; transform: scale(0.7) } }
.s18b-up${i} { animation: s18b-up${i} 5s cubic-bezier(0.45,0,0.55,1) infinite; }`).join('\n')

/* the three newest events of a log group arrive one after another, hold, and the row starts filling again */
const EV = [0, 1, 2].map((k) => `@keyframes s18b-ev${k} { 0%, ${8 + k * 22}% { opacity: 0; transform: translateX(-8px) } ${16 + k * 22}%, 90% { opacity: 1; transform: translateX(0) } 97%, 100% { opacity: 0; transform: translateX(0) } }
.s18b-ev${k} { animation: s18b-ev${k} ${L.PER}s ease-out infinite; }`).join('\n')

export const css = `
.s18b-l { animation-delay: var(--s18b-d, 0s); }
${DR}
@keyframes s18b-exit { 0%, 56% { opacity: 1 } 66%, 82% { opacity: 0.35 } 94%, 100% { opacity: 1 } }
.s18b-exit { animation: s18b-exit ${G.PER}s ease-in-out infinite; }
${UP}
@keyframes s18b-stream { 0% { transform: translateY(0) } 100% { transform: translateY(-112px) } }
.s18b-stream { animation: s18b-stream 4.2s linear infinite; }
${EV}
${K.css()}
.cc-still .s18b-l, .deck-thumb .s18b-l { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .s18b-l { animation: none !important; } }
`
void FONT
