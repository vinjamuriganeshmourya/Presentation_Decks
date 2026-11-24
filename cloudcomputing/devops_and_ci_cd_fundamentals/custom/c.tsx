import type { ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, Frame, Show, Plinth, MarkTile, Panel, Wire, Junction, Token, keyframes, tag, heading, useHeld, useHot, type Pt } from '@/engine/figkit'
import ecrMark from '../images/aws-ecr.svg'
import codedeployMark from '../images/aws-codedeploy.svg'
import ec2Mark from '../images/aws-ec2.svg'
import ecsMark from '../images/aws-ecs.svg'
import lambdaMark from '../images/aws-lambda.svg'
import cloudwatchMark from '../images/aws-cloudwatch.svg'
import alarmMark from '../images/aws-cloudwatch-alarm.svg'

/*
 * SESSION 22 · SECTION 2 (The Cloud SDLC), release / deploy and operate / monitor figures, builder C.
 * Standing corrections 13-17: 3D icons and official marks on white plinth tiles, >= 20 px padding (each frame sits
 * 20 px inside the slide's white figure card), orthogonal wires from the same constants as the boxes, a flow token on
 * every live wire, the lit item walking first -> last -> first after the build, starting on the LAST item (S21
 * `useBuild`). Loops are transform / opacity on HTML elements only. Held (?still): full picture, nothing lit, nothing
 * moving. Class prefix `s22c-`.
 *
 *   slide 21 C_T08   500 x 336  Artifact -> Release (tag) -> Deploy (rocket) -> Dev / Staging / Production;
 *                               1 the tag stamps and the artifact drops into Amazon ECR, 2 deploy lands it on a server
 *                               and a container (2)
 *   slide 22 C_T08B  500 x 336  same row; 1 the environments light Dev -> Staging -> Production (layers hub),
 *                               2 CodeDeploy under Deploy, wired to EC2, ECS and Lambda (2)
 *   slide 23 C_T09   520 x 336  Operate panel (production server, patching / capacity / incident) -> Monitor panel
 *                               (metrics chart, logs, alert bell); 1 operate, 2 monitor (2)
 *   slide 24 C_T09B  520 x 336  the faint eight-stage row (T05 icons) over production -> Monitor dashboard;
 *                               1 CloudWatch on the dashboard, an alarm firing, 2 the feedback loop Monitor -> Plan (2)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('s22c')
const P8 = 7 // T08 loops, seconds
const P9 = 6 // T09 loops, seconds
const KF: string[] = []

/** the build of a figure: the step, the lit item, held (S21 e.tsx: the walk starts on the LAST item) */
function useBuild(p: Record<string, unknown>, period = 1600) {
  const cnt = Number(p.steps ?? 1)
  const raw0 = Number(p.step ?? 0)
  const held = useHeld()
  const step = held ? cnt : raw0
  const raw = useHot(cnt, raw0, period)
  const hot = raw >= 0 && raw0 >= cnt ? (raw + cnt - 1) % cnt : raw
  return { step, hot, held, s: (n: number) => step >= n }
}

/** a looping opacity class (percent, opacity), held on ?still */
function fade(name: string, period: number, frames: [number, number][]) {
  const cls = `s22c-${name}`
  KF.push(`@keyframes ${cls} { ${frames.map(([a, o]) => `${a}% { opacity: ${o} }`).join(' ')} }\n.${cls} { animation: ${cls} ${period}s ease-in-out infinite; }`)
  return `${cls} s22c-a`
}

/* ------------------------------------------------------------------ pieces */

/** a 3D icon (or an official mark) on its plinth, the TILE centred on (x, y), a one-word tag under it */
function Node({ x, y, label, icon, mark, size = 58, on = true, lit = false, loop = 'bob', d = 0, t, w = 110, tagSize = 14, delay = 0, dim = false }: { x: number; y: number; label?: string; icon?: Ico3DName; mark?: string; size?: number; on?: boolean; lit?: boolean; loop?: Loop; d?: number; t?: number; w?: number; tagSize?: number; delay?: number; dim?: boolean }) {
  const instant = useInstant()
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, top: y - size / 2, width: w, zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: dim ? 0.42 : 1, transition: instant ? 'none' : `opacity 520ms ${EASE}` }}>
        <div style={{ width: size, height: size, display: 'grid', placeItems: 'center' }}>
          {mark ? <MarkTile src={mark} size={size} lit={lit} /> : <Plinth size={size} lit={lit}><Ico3D name={icon ?? 'doc'} size={Math.round(size * 0.74)} loop={loop} d={d} t={t} /></Plinth>}
        </div>
        {label && <span style={{ ...tag(tagSize), marginTop: 6 }}>{label}</span>}
      </div>
    </Show>
  )
}

/** a white disc holding a 3D icon, centred on (x, y) (a hub on a wire) */
function Disc({ x, y, icon, size = 30, on = true, lit = false, loop = 'pulse' }: { x: number; y: number; icon: Ico3DName; size?: number; on?: boolean; lit?: boolean; loop?: Loop }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: 6, opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE}` }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: 99, background: '#FFFFFF', boxShadow: lit ? `inset 0 0 0 2.5px ${ORANGE}, 0 4px 10px -5px rgba(255,138,61,0.7)` : '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6', display: 'grid', placeItems: 'center', transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
        <Ico3D name={icon} size={size - 8} loop={loop} t={2.4} />
      </span>
    </span>
  )
}

/** a wire on its own layer above the panels (a Panel is z 2) */
const W = (props: Parameters<typeof Wire>[0]) => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}><Wire {...props} /></div>
)

/** a small 3D icon carried by a `ride` class (the artifact on its way); nothing on held frames */
function Rider({ cls, icon = 'package', size = 26, on = true }: { cls: string; icon?: Ico3DName; size?: number; on?: boolean }) {
  const held = useHeld()
  if (held || !on) return null
  return (
    <span aria-hidden style={{ position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, zIndex: 7, pointerEvents: 'none' }}>
      <span className={cls} style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -4px rgba(31,64,140,0.55), inset 0 0 0 1px #D3DEF6', opacity: 0 }}>
        <Ico3D name={icon} size={size - 6} loop="none" />
      </span>
    </span>
  )
}

/** an orange ring laid over a box, its opacity driven by a loop class (a highlight walking a sequence) */
function RingLoop({ x, y, w, h, r = 16, cls, on }: { x: number; y: number; w: number; h: number; r?: number; cls: string; on: boolean }) {
  const held = useHeld()
  if (held || !on) return null
  return <span aria-hidden className={cls} style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: r, boxShadow: `inset 0 0 0 2.5px ${ORANGE}, 0 10px 22px -14px rgba(255,138,61,0.8)`, opacity: 0, zIndex: 5, pointerEvents: 'none' }} />
}

/* ================================================================== T08 · RELEASE AND DEPLOY */

const F8 = { w: 500, h: 336 }
const ROW = 58 // the stage row's centre line
const TS = 58 // a stage tile
const AX = 40 // Artifact
const RX = 151 // Release
const DX = 262 // Deploy
const TAG_END = ROW + TS / 2 + 6 + 18 // under a stage tag
const TRUNK = 356 // the environments' wire trunk
const ENV = { x: 386, w: 114, h: 100, ys: [8, 120, 232] }
const envCy = (i: number) => ENV.ys[i] + ENV.h / 2
const ENVS: { label: string; icon: Ico3DName }[] = [
  { label: 'Dev', icon: 'code' },
  { label: 'Staging', icon: 'replica' },
  { label: 'Production', icon: 'users' },
]
const ECR = { x: RX, y: 196, s: 54 }
/* T08 targets: a server and a container under Deploy */
const TG = { y: 268, s: 52, xs: [DX - 34, DX + 34] }
const TG_J = 168
/* T08-B: CodeDeploy under Deploy, wired to EC2 / ECS / Lambda */
const CD = { x: DX, y: 172, s: 50 }
const AWS = { y: 290, s: 42, xs: [DX - 58, DX, DX + 58] }
const AWS_J = 246

const W_AR: Pt[] = [[AX + TS / 2, ROW], [RX - TS / 2, ROW]]
const W_RD: Pt[] = [[RX + TS / 2, ROW], [DX - TS / 2, ROW]]
const W_RE: Pt[] = [[RX, TAG_END], [RX, ECR.y - ECR.s / 2]]
const wEnv = (i: number): Pt[] => (i === 0 ? [[DX + TS / 2, ROW], [ENV.x, ROW]] : [[DX + TS / 2, ROW], [TRUNK, ROW], [TRUNK, envCy(i)], [ENV.x, envCy(i)]])
const wTg = (i: number): Pt[] => [[DX, TAG_END], [DX, TG_J], [TG.xs[i], TG_J], [TG.xs[i], TG.y - TG.s / 2]]
const W_DC: Pt[] = [[DX, TAG_END], [DX, CD.y - CD.s / 2]]
const CD_END = CD.y + CD.s / 2 + 6 + 18
const wAws = (i: number): Pt[] => (AWS.xs[i] === DX ? [[DX, CD_END], [DX, AWS.y - AWS.s / 2]] : [[DX, CD_END], [DX, AWS_J], [AWS.xs[i], AWS_J], [AWS.xs[i], AWS.y - AWS.s / 2]])

/* the artifact's trip, as flow-token keyframes (centres of the tiles' edges, so a rider never covers a tile) */
const R8 = {
  ar: K.ride('t8ar', W_AR, 0.2, 1.1, P8),
  re: K.ride('t8re', W_RE, 1.4, 2.1, P8),
  rd: K.ride('t8rd', W_RD, 2.4, 3.2, P8),
  tg0: K.ride('t8tg0', wTg(0), 3.5, 4.5, P8),
  tg1: K.ride('t8tg1', wTg(1), 3.6, 4.6, P8),
  env: [0, 1, 2].map((i) => K.ride(`t8env${i}`, wEnv(i), 3.4 + i * 1.1, 4.2 + i * 1.1, P8)),
  aws: [0, 1, 2].map((i) => K.ride(`t8aws${i}`, [...W_DC, ...wAws(i)], 2.2 + i * 1.4, 3.3 + i * 1.4, P8)),
}
/* T08-B point 3: the environments light in order Dev -> Staging -> Production, 4.2 s round */
const ENV_RING = [0, 1, 2].map((i) => fade(`envring${i}`, 4.2, [[0, 0], [i * 33.3, 0], [i * 33.3 + 4, 1], [i * 33.3 + 29, 1], [i * 33.3 + 33.3, 0], [100, 0]]))
/* the tag stamping the version on Release, once a loop */
const STAMP = fade('stamp', P8, [[0, 0], [15, 0], [18, 1], [30, 1], [34, 0], [100, 0]])

function EnvPanel({ i, lit, dim = false }: { i: number; lit: boolean; dim?: boolean }) {
  const e = ENVS[i]
  return (
    <Panel x={ENV.x} y={ENV.ys[i]} w={ENV.w} h={ENV.h} lit={lit} radius={16}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: dim ? 0.55 : 1 }}>
        <Plinth size={38}><Ico3D name={e.icon} size={28} loop="bob" d={i * 0.5} /></Plinth>
        <span style={tag(14)}>{e.label}</span>
      </div>
    </Panel>
  )
}

/** the Artifact -> Release -> Deploy row and the environment column, shared by T08 and T08-B */
function ReleaseRow({ litRel = false, litDep = false, stamp = false }: { litRel?: boolean; litDep?: boolean; stamp?: boolean }) {
  const held = useHeld()
  return (
    <>
      <Node x={AX} y={ROW} size={TS} icon="package" label="Artifact" loop="bob" />
      <Node x={RX} y={ROW} size={TS} icon="tag" label="Release" loop="swing" d={0.4} lit={litRel} />
      <Node x={DX} y={ROW} size={TS} icon="rocket" label="Deploy" loop="float" d={0.8} lit={litDep} />
      {/* the version stamp: a tiny check badge popping on the Release tile once a loop */}
      {stamp && !held && (
        <span aria-hidden className={STAMP} style={{ position: 'absolute', left: RX + TS / 2 - 14, top: ROW - TS / 2 - 8, width: 22, height: 22, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 3px 8px -3px rgba(31,64,140,0.6)', display: 'grid', placeItems: 'center', zIndex: 6, opacity: 0 }}>
          <Ico3D name="check" size={16} loop="none" />
        </span>
      )}
      <W pts={W_AR} />
      <W pts={W_RD} />
      {[0, 1, 2].map((i) => <W key={i} pts={wEnv(i)} />)}
      {[0, 1, 2].map((i) => <EnvPanel key={i} i={i} lit={false} />)}
    </>
  )
}

const C_T08: Fig = (p) => {
  const { hot, s } = useBuild(p)
  return (
    <Frame w={F8.w} h={F8.h}>
      <ReleaseRow litRel={hot === 0} litDep={hot === 1} stamp={s(1)} />
      {/* point 1: the tagged artifact stored in the registry, Amazon ECR */}
      <W pts={W_RE} on={s(1)} />
      <Node x={ECR.x} y={ECR.y} size={ECR.s} mark={ecrMark} label="Amazon ECR" on={s(1)} lit={hot === 0} w={120} />
      {/* point 2: deploy installs the released artifact on servers or containers */}
      {[0, 1].map((i) => <W key={i} pts={wTg(i)} on={s(2)} />)}
      <Junction x={DX} y={TG_J} on={s(2)} />
      <Node x={TG.xs[0]} y={TG.y} size={TG.s} icon="server" label="Server" on={s(2)} lit={hot === 1} loop="pulse" />
      <Node x={TG.xs[1]} y={TG.y} size={TG.s} icon="container" label="Container" on={s(2)} lit={hot === 1} loop="bob" d={0.6} />
      <Rider cls={R8.ar} />
      <Rider cls={R8.re} on={s(1)} />
      <Rider cls={R8.rd} on={s(2)} />
      <Rider cls={R8.tg0} on={s(2)} size={22} />
      <Rider cls={R8.tg1} on={s(2)} size={22} />
    </Frame>
  )
}

const C_T08B: Fig = (p) => {
  const { hot, s } = useBuild(p)
  return (
    <Frame w={F8.w} h={F8.h}>
      <ReleaseRow litDep={hot === 1} />
      <W pts={W_RE} />
      <Node x={ECR.x} y={ECR.y} size={ECR.s} mark={ecrMark} label="Amazon ECR" w={120} />
      {/* point 3: development, staging and production, in that order (the layers hub on the trunk) */}
      <Disc x={TRUNK} y={(ROW + envCy(1)) / 2} icon="layers" on lit={hot === 0} />
      {[0, 1, 2].map((i) => <RingLoop key={i} x={ENV.x} y={ENV.ys[i]} w={ENV.w} h={ENV.h} cls={ENV_RING[i]} on={s(1) && hot === 0} />)}
      {[0, 1, 2].map((i) => <Rider key={i} cls={R8.env[i]} on={s(1)} size={22} />)}
      {/* point 4: CodeDeploy automates deployment to EC2, ECS or Lambda */}
      <W pts={W_DC} on={s(2)} />
      <Node x={CD.x} y={CD.y} size={CD.s} mark={codedeployMark} label="CodeDeploy" on={s(2)} lit={hot === 1} w={120} />
      {[0, 1, 2].map((i) => <W key={i} pts={wAws(i)} on={s(2)} delay={200} />)}
      <Junction x={DX} y={AWS_J} on={s(2)} />
      {[ec2Mark, ecsMark, lambdaMark].map((m, i) => (
        <Node key={i} x={AWS.xs[i]} y={AWS.y} size={AWS.s} mark={m} label={['EC2', 'ECS', 'Lambda'][i]} on={s(2)} delay={250 + i * 130} w={64} />
      ))}
      {[0, 1, 2].map((i) => <Rider key={i} cls={R8.aws[i]} on={s(2)} size={20} />)}
    </Frame>
  )
}

/* ================================================================== T09 · OPERATE AND MONITOR */

const F9 = { w: 520, h: 336 }
const OP = { x: 0, y: 0, w: 236, h: 336 }
const MO = { x: 284, y: 0, w: 236, h: 336 }
const HEAD = 46 // header row centre inside a panel
const SRV = { x: OP.x + OP.w / 2, y: 146, s: 72 }
const OPS: { label: string; icon: Ico3DName; loop: Loop }[] = [
  { label: 'Patching', icon: 'docfix', loop: 'tilt' },
  { label: 'Capacity', icon: 'plus', loop: 'pulse' },
  { label: 'Incident', icon: 'phone', loop: 'swing' },
]
const OPS_Y = 262
const OPS_X = [OP.x + 42, OP.x + OP.w / 2, OP.x + OP.w - 42]
const W_METRIC: Pt[] = [[OP.x + OP.w, SRV.y], [MO.x, SRV.y]]
const R9 = { metric: [0, 1, 2].map((i) => K.ride(`t9m${i}`, W_METRIC, i * 2, i * 2 + 0.9, P9)) }
const BELL_RING = fade('bell', P9, [[0, 0], [58, 0], [62, 1], [80, 1], [86, 0], [100, 0]])
const LOG_SCAN = fade('logscan', 2.4, [[0, 0.25], [50, 1], [100, 0.25]])

/** a panel header: a 3D icon on its plinth and the stage word */
function Head({ x, y, w, icon, text, lit = false, loop = 'bob', right }: { x: number; y: number; w: number; icon: Ico3DName; text: string; lit?: boolean; loop?: Loop; right?: ReactNode }) {
  return (
    <div style={{ position: 'absolute', left: x + 20, top: y + HEAD - 20, width: w - 40, height: 40, display: 'flex', alignItems: 'center', gap: 10, zIndex: 4 }}>
      <Plinth size={40} lit={lit}><Ico3D name={icon} size={30} loop={loop} /></Plinth>
      <span style={{ ...heading(18), whiteSpace: 'nowrap' }}>{text}</span>
      {right && <span style={{ marginLeft: 'auto' }}>{right}</span>}
    </div>
  )
}

/** a drawn metrics chart: a line that keeps moving (an svg strip sliding inside its window, compositor only) */
function Chart({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const held = useHeld()
  const seg = (o: number) => `M ${o} ${h * 0.62} C ${o + w * 0.15} ${h * 0.2}, ${o + w * 0.3} ${h * 0.85}, ${o + w * 0.5} ${h * 0.45} S ${o + w * 0.8} ${h * 0.2}, ${o + w} ${h * 0.62}`
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 12, background: 'linear-gradient(180deg,#F5F8FF,#EAF0FF)', boxShadow: 'inset 0 0 0 1px #D3DEF6', overflow: 'hidden', zIndex: 4 }}>
      <svg className={held ? undefined : 's22c-chart s22c-a'} width={w * 2} height={h} style={{ position: 'absolute', left: 0, top: 0, display: 'block' }} aria-hidden>
        <defs>
          <linearGradient id="s22c-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={colors.brand} stopOpacity="0.28" /><stop offset="1" stopColor={colors.brand} stopOpacity="0" /></linearGradient>
        </defs>
        {[0, w].map((o) => (
          <g key={o}>
            <path d={`${seg(o)} L ${o + w} ${h} L ${o} ${h} Z`} fill="url(#s22c-area)" />
            <path d={seg(o)} fill="none" stroke={colors.brand} strokeWidth={3} strokeLinecap="round" />
          </g>
        ))}
      </svg>
    </div>
  )
}
KF.push(`@keyframes s22c-chart { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }\n.s22c-chart { animation: s22c-chart 6s linear infinite; }`)

/** drawn log lines (bars, no invented text) with a soft scan */
function Logs({ x, y, w }: { x: number; y: number; w: number }) {
  const held = useHeld()
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 4 }}>
      {[0.9, 0.7, 0.82].map((k, i) => (
        <span key={i} style={{ position: 'relative', display: 'block', height: 7, width: `${k * 100}%`, borderRadius: 9, background: '#D9E3FA' }}>
          <span className={held ? undefined : LOG_SCAN} style={{ position: 'absolute', inset: 0, borderRadius: 9, background: colors.brand, opacity: held ? 0.35 : undefined, animationDelay: `${-i * 0.8}s` }} />
        </span>
      ))}
    </div>
  )
}

/** the alert bell with an orange pulse ring firing once a loop */
function Bell({ x, y, size = 40, mark, cls = BELL_RING }: { x: number; y: number; size?: number; mark?: string; cls?: string }) {
  const held = useHeld()
  return (
    <div style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: 4 }}>
      {!held && <span aria-hidden className={cls} style={{ position: 'absolute', inset: -6, borderRadius: Math.round(size * 0.36), boxShadow: `0 0 0 2.5px ${ORANGE}, 0 0 16px 2px rgba(255,138,61,0.45)`, opacity: 0 }} />}
      {mark ? <MarkTile src={mark} size={size} /> : <Plinth size={size}><Ico3D name="bell" size={Math.round(size * 0.74)} loop="swing" t={1.8} /></Plinth>}
    </div>
  )
}

const C_T09: Fig = (p) => {
  const { hot, s } = useBuild(p)
  return (
    <Frame w={F9.w} h={F9.h}>
      {/* Operate: the live system, kept healthy */}
      <Panel x={OP.x} y={OP.y} w={OP.w} h={OP.h} lit={hot === 0} />
      <Head x={OP.x} y={OP.y} w={OP.w} icon="wrench" text="Operate" loop="tilt" />
      <Node x={SRV.x} y={SRV.y} size={SRV.s} icon="server" label="Production" loop="pulse" w={140} />
      {OPS.map((o, i) => <Node key={i} x={OPS_X[i]} y={OPS_Y} size={44} icon={o.icon} label={o.label} loop={o.loop} d={i * 0.5} on={s(1)} delay={i * 130} w={84} tagSize={13} />)}
      {/* the metrics stream into Monitor */}
      <W pts={W_METRIC} on={s(2)} />
      {R9.metric.map((c, i) => <Token key={i} cls={c} on={s(2)} />)}
      {/* Monitor: metrics, logs and alerts */}
      <Panel x={MO.x} y={MO.y} w={MO.w} h={MO.h} lit={hot === 1} />
      <Head x={MO.x} y={MO.y} w={MO.w} icon="dashboard" text="Monitor" loop="pulse" />
      <Show on={s(2)} style={{ position: 'absolute', inset: 0 }}>
        <Chart x={MO.x + 20} y={92} w={MO.w - 40} h={92} />
        <span style={{ ...tag(13), position: 'absolute', zIndex: 4, left: MO.x + 20, top: 190, width: MO.w - 40 }}>Metrics</span>
        <Logs x={MO.x + 20} y={242} w={110} />
        <span style={{ ...tag(13), position: 'absolute', zIndex: 4, left: MO.x + 20, top: 278, width: 110 }}>Logs</span>
        <Bell x={MO.x + MO.w - 20 - 34} y={258} size={44} />
        <span style={{ ...tag(13), position: 'absolute', zIndex: 4, left: MO.x + MO.w - 20 - 34 - 40, top: 288, width: 80 }}>Alerts</span>
      </Show>
    </Frame>
  )
}

/* ------------------------------------------------------------------ T09-B: CloudWatch, and the loop back to Plan */

const STG: { label: string; icon: Ico3DName }[] = [
  { label: 'Plan', icon: 'doc' }, { label: 'Code', icon: 'code' }, { label: 'Build', icon: 'gear' }, { label: 'Test', icon: 'checklist' },
  { label: 'Release', icon: 'tag' }, { label: 'Deploy', icon: 'rocket' }, { label: 'Operate', icon: 'server' }, { label: 'Monitor', icon: 'dashboard' },
]
const ST = { s: 40, y: 22, x0: 20, dx: (520 - 40) / 7 }
const stX = (i: number) => ST.x0 + i * ST.dx
const ST_TAG_END = ST.y + ST.s / 2 + 5 + 15
const LOOP_Y = 104
const W_LOOP: Pt[] = [[stX(7), ST_TAG_END + 2], [stX(7), LOOP_Y], [stX(0), LOOP_Y], [stX(0), ST_TAG_END + 2]]
const R9B = { loop: K.ride('t9bloop', W_LOOP, 0.3, 3.3, P9) }
const DASH = { x: 196, y: 132, w: 324, h: 204 }
const PROD = { x: 74, y: 234, s: 64 }
const W_PD: Pt[] = [[PROD.x + PROD.s / 2, PROD.y], [DASH.x, PROD.y]]
const R9B2 = { metric: [0, 1, 2].map((i) => K.ride(`t9bm${i}`, W_PD, i * 2 + 0.2, i * 2 + 1, P9)) }
const ALARM = fade('alarm', P9, [[0, 0], [40, 0], [44, 1], [64, 1], [70, 0], [100, 0]])

const C_T09B: Fig = (p) => {
  const { hot, s } = useBuild(p)
  const instant = useInstant()
  return (
    <Frame w={F9.w} h={F9.h}>
      {/* the eight-stage row from T05, faint until the loop closes it */}
      <div style={{ position: 'absolute', inset: 0, opacity: s(2) ? 1 : 0.45, transition: instant ? 'none' : `opacity 620ms ${EASE}`, zIndex: 3 }}>
        {STG.map((g, i) => <Node key={i} x={stX(i)} y={ST.y} size={ST.s} icon={g.icon} label={g.label} tagSize={12} w={66} loop="bob" d={i * 0.3} />)}
        {STG.slice(0, -1).map((_, i) => <W key={i} pts={[[stX(i) + ST.s / 2 + 2, ST.y], [stX(i + 1) - ST.s / 2 - 2, ST.y]]} head={7} width={2} />)}
      </div>
      {/* point 4: monitoring signals feed back into planning */}
      <W pts={W_LOOP} on={s(2)} lit={hot === 1} />
      <Disc x={(stX(0) + stX(7)) / 2} y={LOOP_Y} icon="refresh" size={32} on={s(2)} lit={hot === 1} loop="spin" />
      <Token cls={R9B.loop} on={s(2)} />
      {/* the production system streaming into the Monitor dashboard */}
      <Node x={PROD.x} y={PROD.y} size={PROD.s} icon="server" label="Production" loop="pulse" w={120} />
      <W pts={W_PD} />
      {R9B2.metric.map((c, i) => <Token key={i} cls={c} />)}
      <Panel x={DASH.x} y={DASH.y} w={DASH.w} h={DASH.h} lit={hot === 0} />
      <div style={{ position: 'absolute', left: DASH.x + 20, top: DASH.y + 20, width: DASH.w - 40, height: 40, display: 'flex', alignItems: 'center', gap: 10, zIndex: 4 }}>
        <Plinth size={40}><Ico3D name="dashboard" size={30} loop="pulse" /></Plinth>
        <span style={{ ...heading(18), whiteSpace: 'nowrap' }}>Monitor</span>
        {/* point 3: CloudWatch collects the metrics and triggers the alerts */}
        <Show on={s(1)} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={tag(14)}>CloudWatch</span>
          <MarkTile src={cloudwatchMark} size={40} lit={hot === 0} />
        </Show>
      </div>
      <Chart x={DASH.x + 20} y={DASH.y + 76} w={196} h={108} />
      <Show on={s(1)} style={{ position: 'absolute', left: DASH.x + 236, top: DASH.y + 76, width: 68, height: 108, zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <div style={{ position: 'relative', width: 46, height: 46 }}>
          <Bell x={23} y={23} size={46} mark={alarmMark} cls={ALARM} />
        </div>
        <span style={tag(13)}>Alarm</span>
      </Show>
    </Frame>
  )
}

/* ------------------------------------------------------------------ exports */

export const figures: Record<string, Fig> = { C_T08, C_T08B, C_T09, C_T09B }
export const css = [
  K.css(),
  ...KF,
  '.cc-still .s22c-a, .deck-thumb .s22c-a { animation: none !important; }',
  '@media (prefers-reduced-motion: reduce) { .s22c-a { animation: none !important; } }',
].join('\n')
