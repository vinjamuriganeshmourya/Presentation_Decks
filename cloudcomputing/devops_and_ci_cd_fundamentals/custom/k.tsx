import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, TILE_BG, TILE_RIM, Frame, Show, Plinth, MarkTile, Panel, Wire, Junction, Token, keyframes, loopCls, loopVars, tag, useHeld, useHot, type Pt } from '@/engine/figkit'
import s3Mark from '../images/aws-s3.svg'
import ecrMark from '../images/aws-ecr.svg'
import pipeMark from '../images/aws-codepipeline.svg'

/*
 * SESSION 22 · SECTION 5 (Delivery & Artifacts), builder K: TR 23 (build once and promote) and TR 24 (dev, staging and
 * production roles). Standing corrections 13-17: 3D icons on plinth tiles, official marks on white tiles, >= 20 px
 * padding, orthogonal wires from the same constants as the boxes, flow dots on live wires, the lit item walking
 * first -> last -> first after the build (S21 `useBuild`: the walk starts on the LAST item). Loops are transform /
 * opacity on HTML elements only. Held (?still): the full picture, nothing lit, nothing moving. Class prefix `s22k-`.
 *
 *   T23  K_T23   568 x 280  Dev / Staging / Production, ONE unbroken arrow through all three, the same `app:a1b2c3d`
 *                            box in each; (1) the build gear stamps the tag once, (2) the box tested in Staging
 *   T23B K_T23B  568 x 364  same row; (1) a copy tile on the Staging -> Production stretch, a rebuild gear struck out;
 *                            (2) the artifact store under the row: Amazon S3 and Amazon ECR
 *   T23C K_T23C  568 x 336  same row; (1) a config card (URL, credentials) plugging into each environment;
 *                            (2) a bracket from the tested box to the released box, a match tick
 *   T24  K_T24   580 x 302  Dev -> Staging -> gate -> Production boxes; (1) Dev's frequent deploys; (2) Staging's
 *                            configuration mirroring Production's (bracket + mirror icon)
 *   T24B K_T24B  580 x 374  same row with T24's parts; (1) Production's users and the gate (approval or tests);
 *                            (2) the CodePipeline mark over the row, one stage per box
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('s22k')
const MONO = "'Fira Code', ui-monospace, monospace"
const NOLIG: CSSProperties = { fontVariantLigatures: 'none', fontFeatureSettings: "'liga' 0, 'calt' 0" }
const LIT_RIM = `inset 0 0 0 2.5px ${ORANGE}, 0 10px 22px -12px rgba(255,138,61,0.7)`
const KF: string[] = []

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)

/** the build of a figure: the step, the lit item, held (S21 e.tsx: the walk starts on the LAST item) */
function useBuild(p: Record<string, unknown>, period: number) {
  const cnt = Number(p.steps ?? 2)
  const held = useHeld()
  const step = held ? cnt : stepOf(p)
  const raw = useHot(cnt, stepOf(p), period)
  const hot = raw >= 0 && stepOf(p) >= cnt ? (raw + cnt - 1) % cnt : raw
  return { step, hot, held, s: (n: number) => step >= n }
}

/** an opacity loop (period P seconds), held off on ?still */
function blink(name: string, P: number, frames: [number, number][]) {
  const cls = `s22k-${name}`
  KF.push(`@keyframes ${cls} { ${frames.map(([a, o]) => `${a}% { opacity: ${o} }`).join(' ')} }\n.${cls} { animation: ${cls} ${P}s ease-in-out infinite; }`)
  return `${cls} s22k-a`
}

/** the engine's 3D cross turned to the template's orange (refused = orange, never red) */
const OrangeCross = ({ size }: { size: number }) => (
  <span style={{ display: 'grid', filter: 'hue-rotate(28deg) saturate(1.15) brightness(1.06)' }}>
    <Ico3D name="cross" size={size} loop="none" />
  </span>
)

/** a wire on its own layer above the cards (a Panel is z 2) */
const W = (props: Parameters<typeof Wire>[0]) => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}><Wire {...props} /></div>
)

/** a 3D icon on a plinth, the TILE centred on (x, y); an optional one-word tag beside or under it */
function Tile({ x, y, icon, size = 52, lit = false, on = true, loop = 'bob', d = 0, t, label, side = 'under', dim = false, cross = false, children }: { x: number; y: number; icon: Ico3DName; size?: number; lit?: boolean; on?: boolean; loop?: Loop; d?: number; t?: number; label?: string; side?: 'under' | 'right' | 'left'; dim?: boolean; cross?: boolean; children?: ReactNode }) {
  const lab = label ? <span style={{ ...tag(14), position: 'absolute', ...(side === 'under' ? { left: '50%', top: size + 6, transform: 'translateX(-50%)' } : side === 'right' ? { left: size + 10, top: '50%', transform: 'translateY(-50%)' } : { right: size + 10, top: '50%', transform: 'translateY(-50%)' }) }}>{label}</span> : null
  return (
    <Show on={on} style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: 4 }}>
      <div style={{ opacity: dim ? 0.5 : 1, filter: dim ? 'grayscale(0.6)' : undefined }}>
        <Plinth size={size} lit={lit}>{children ?? <Ico3D name={icon} size={Math.round(size * 0.74)} loop={dim ? 'none' : loop} d={d} t={t} />}</Plinth>
      </div>
      {cross && <span style={{ position: 'absolute', right: -8, bottom: -8, width: 26, height: 26, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6)', display: 'grid', placeItems: 'center' }}><OrangeCross size={20} /></span>}
      {lab}
    </Show>
  )
}

/** a small white disc holding a 3D icon, centred on (x, y) */
function Disc({ x, y, icon, size = 26, on = true, loop = 'pulse', d = 0, cls, z = 5 }: { x: number; y: number; icon: Ico3DName; size?: number; on?: boolean; loop?: Loop; d?: number; cls?: string; z?: number }) {
  return (
    <Show on={on} style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: z }}>
      <span className={cls} style={{ position: 'absolute', inset: 0, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6', display: 'grid', placeItems: 'center' }}>
        <Ico3D name={icon} size={size - 6} loop={loop} d={d} t={2.6} />
      </span>
    </Show>
  )
}

/** an environment box: a white panel with its icon and name centred on the top row */
function Env({ x, y, w, h, icon, name, lit, loop = 'bob', d = 0 }: { x: number; y: number; w: number; h: number; icon: Ico3DName; name: string; lit: boolean; loop?: Loop; d?: number }) {
  return (
    <Panel x={x} y={y} w={w} h={h} lit={lit}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 13, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Plinth size={30}><Ico3D name={icon} size={22} loop={loop} d={d} /></Plinth>
        <span style={{ ...tag(15, colors.ink), fontWeight: 700 }}>{name}</span>
      </div>
    </Panel>
  )
}

/* ================================================================== TR 23: the one artifact, promoted */

const A = {
  W: 568,
  PW: 152,
  X: [40, 208, 376],
  PY: 120,
  PH: 140,
  PILL_W: 116,
  PILL_H: 34,
  ZA: 50, // zone A tile centre
}
const ACX = A.X.map((x) => x + A.PW / 2) // 116, 284, 452
const AGAP = [A.X[0] + A.PW + (A.X[1] - A.X[0] - A.PW) / 2, A.X[1] + A.PW + (A.X[2] - A.X[1] - A.PW) / 2] // 200, 368
const PILL_Y = A.PY + 88 // 208, the arrow's line
const ENVS: { name: string; icon: Ico3DName; loop: Loop }[] = [
  { name: 'Dev', icon: 'code', loop: 'bob' },
  { name: 'Staging', icon: 'replica', loop: 'pulse' },
  { name: 'Production', icon: 'users', loop: 'bob' },
]
const ARROW: Pt[] = [[24, PILL_Y], [A.W - 24, PILL_Y]]
const A_FLOW = K.ride('a-flow', [[24, PILL_Y], [A.W - 36, PILL_Y]], 0.2, 4.6, 5)

/** the artifact: ONE box, the same version tag `app:a1b2c3d` wherever it stands */
function Pill({ cx, lit = false, d = 0 }: { cx: number; lit?: boolean; d?: number }) {
  const instant = useInstant()
  return (
    <div style={{ position: 'absolute', left: cx - A.PILL_W / 2, top: PILL_Y - A.PILL_H / 2, width: A.PILL_W, height: A.PILL_H, zIndex: 4 }}>
      <span aria-hidden className={loopCls('halo')} style={{ position: 'absolute', inset: -5, borderRadius: 15, background: `radial-gradient(closest-side, ${colors.brand}26, ${colors.brand}00)`, ...loopVars(d, 3.6) }} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: 10, background: TILE_BG, boxShadow: lit ? LIT_RIM : TILE_RIM, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
        <Ico3D name="container" size={20} loop="bob" d={d} />
        <span style={{ fontFamily: MONO, ...NOLIG, fontSize: 12, fontWeight: 600, color: colors.brandDeep, whiteSpace: 'nowrap' }}>app:a1b2c3d</span>
      </div>
    </div>
  )
}

/** the shared row: three environments, the unbroken arrow through them, the same box in each */
function PromoteRow({ lit = [], pillLit = [] }: { lit?: number[]; pillLit?: number[] }) {
  return (
    <>
      {ENVS.map((e, i) => <Env key={e.name} x={A.X[i]} y={A.PY} w={A.PW} h={A.PH} icon={e.icon} name={e.name} lit={lit.includes(i)} loop={e.loop} d={i * 0.5} />)}
      <W pts={ARROW} head={11} width={2.8} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}><Token cls={A_FLOW} size={9} /></div>
      {ACX.map((cx, i) => <Pill key={cx} cx={cx} lit={pillLit.includes(i)} d={i * 0.6} />)}
    </>
  )
}

const K_T23: Fig = (p) => {
  const { hot, s } = useBuild(p, 2800)
  return (
    <Frame w={A.W} h={280}>
      <PromoteRow lit={hot === 1 ? [1] : []} pillLit={hot === 0 ? [0] : []} />
      {/* (1) built once: the build gear stamps the version tag, once, into the box in Dev */}
      <Tile x={ACX[0]} y={A.ZA} icon="gear" on={s(1)} lit={hot === 0} label="Build" side="right">
        <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 52, height: 52 }}>
          <Ico3D name="gear" size={34} loop="spin" t={6} />
          <span style={{ position: 'absolute', right: -6, bottom: -6, width: 26, height: 26, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6)', display: 'grid', placeItems: 'center' }}>
            <Ico3D name="tag" size={20} loop="tilt" t={2.4} />
          </span>
        </span>
      </Tile>
      <W pts={[[ACX[0], A.ZA + 26], [ACX[0], A.PY]]} on={s(1)} lit={hot === 0} head={9} width={2.4} />
      {/* (2) the same box tested in Staging, then promoted */}
      <Tile x={ACX[1]} y={A.ZA} icon="checklist" on={s(2)} lit={hot === 1} label="Test" side="right" loop="pulse" d={0.4} />
      <W pts={[[ACX[1], A.ZA + 26], [ACX[1], A.PY]]} on={s(2)} lit={hot === 1} head={9} width={2.4} />
      <Disc x={ACX[1] + A.PILL_W / 2 - 2} y={PILL_Y - A.PILL_H / 2 - 2} icon="check" size={24} on={s(2)} z={6} />
    </Frame>
  )
}

const K_T23B: Fig = (p) => {
  const { hot, s } = useBuild(p, 2800)
  const STORE_Y = 290
  return (
    <Frame w={A.W} h={364}>
      <PromoteRow pillLit={hot === 0 ? [1, 2] : []} />
      {/* (1) promotion copies the box forward: a copy tile tethered to the Staging -> Production stretch; no rebuild */}
      <Tile x={AGAP[1]} y={A.ZA} icon="upload" on={s(1)} lit={hot === 0} label="Copy" side="left" loop="bob" />
      <W pts={[[AGAP[1], A.ZA + 26], [AGAP[1], PILL_Y]]} on={s(1)} lit={hot === 0} head={0} width={2.4} />
      <Junction x={AGAP[1]} y={PILL_Y} on={s(1)} lit={hot === 0} />
      <Tile x={ACX[2]} y={A.ZA} icon="gear" size={44} on={s(1)} dim cross label="Rebuild" side="under" />
      {/* (2) the artifact store under the row: Amazon S3 or Amazon ECR, feeding every environment */}
      <Panel x={A.X[0]} y={STORE_Y} w={A.X[2] + A.PW - A.X[0]} h={60} lit={hot === 1} on={s(2)}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 56 }}>
          {[{ src: s3Mark, name: 'Amazon S3' }, { src: ecrMark, name: 'Amazon ECR' }].map((m) => (
            <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <MarkTile src={m.src} size={40} />
              <span style={{ ...tag(15, colors.ink), fontWeight: 700 }}>{m.name}</span>
            </div>
          ))}
        </div>
      </Panel>
      {ACX.map((cx) => <W key={cx} pts={[[cx, STORE_Y], [cx, A.PY + A.PH]]} on={s(2)} lit={hot === 1} head={9} width={2.4} />)}
    </Frame>
  )
}

const K_T23C: Fig = (p) => {
  const { hot, s } = useBuild(p, 2800)
  const CW = A.PW
  const CY = 18
  const CH = 74
  const BY = 296 // the bracket's floor
  return (
    <Frame w={A.W} h={336}>
      <PromoteRow pillLit={hot === 1 ? [1, 2] : []} />
      {/* (1) each environment's own configuration, URLs and credentials, plugging into the SAME box */}
      {ACX.map((cx, i) => (
        <div key={cx}>
          <Panel x={cx - CW / 2} y={CY} w={CW} h={CH} lit={hot === 0} on={s(1)} delay={i * 130} radius={14}>
            {[{ icon: 'link' as Ico3DName, name: 'URL', dx: -36 }, { icon: 'key' as Ico3DName, name: 'Credentials', dx: 34 }].map((c, j) => (
              <div key={c.name} style={{ position: 'absolute', left: CW / 2 + c.dx - 40, width: 80, top: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <Ico3D name={c.icon} size={28} loop={j ? 'tilt' : 'bob'} d={i * 0.5 + j * 0.3} />
                <span style={tag(12.5)}>{c.name}</span>
              </div>
            ))}
          </Panel>
          <Disc x={cx + CW / 2 - 15} y={CY + 15} icon="gear" size={22} on={s(1)} loop="spin" z={6} />
          <W pts={[[cx, CY + CH], [cx, A.PY]]} on={s(1)} lit={hot === 0} head={9} width={2.4} delay={i * 130} />
        </div>
      ))}
      {/* (2) the box tested is exactly the box released: a bracket from Staging to Production, a match tick */}
      <W pts={[[ACX[1], A.PY + A.PH], [ACX[1], BY], [ACX[2], BY], [ACX[2], A.PY + A.PH]]} on={s(2)} lit={hot === 1} head={0} width={2.6} />
      <Disc x={AGAP[1]} y={BY} icon="check" size={34} on={s(2)} loop="beat" />
      <Show on={s(2)} style={{ position: 'absolute', left: ACX[1] - 60, width: 120, top: BY + 10, textAlign: 'center' }}><span style={tag(14)}>Tested</span></Show>
      <Show on={s(2)} style={{ position: 'absolute', left: ACX[2] - 60, width: 120, top: BY + 10, textAlign: 'center' }}><span style={tag(14)}>Released</span></Show>
    </Frame>
  )
}

/* ================================================================== TR 24: three environments, one promotion gate */

const B = {
  W: 580,
  PW: 132,
  X: [20, 186, 420],
  PY: 92, // with the pipeline zone above (T24-B); T24 draws the row 72 px higher
  PH: 212,
  GATE_X: 369,
  G: 44,
}
const BCX = B.X.map((x) => x + B.PW / 2) // 86, 252, 486
const ROW_DY = (oy: number) => B.PY + oy + B.PH / 2 // the arrows' line
const B_ENVS: { name: string; icon: Ico3DName; loop: Loop }[] = [
  { name: 'Dev', icon: 'code', loop: 'bob' },
  { name: 'Staging', icon: 'replica', loop: 'pulse' },
  { name: 'Production', icon: 'users', loop: 'bob' },
]
/* the artifact walking Dev -> Staging -> gate -> Production, one 6 s loop per layout offset */
function walk(oy: number) {
  const y = ROW_DY(oy)
  return [
    K.ride(`w1-${oy + 100}`, [[B.X[0] + B.PW, y], [B.X[1], y]], 0.2, 1.3, 6),
    K.ride(`w2-${oy + 100}`, [[B.X[1] + B.PW, y], [B.GATE_X - B.G / 2, y]], 2.2, 2.9, 6),
    K.ride(`w3-${oy + 100}`, [[B.GATE_X + B.G / 2, y], [B.X[2], y]], 4.0, 4.7, 6),
  ]
}
const WALK = { t24: walk(-72), t24b: walk(0) }
/** a one-word tag under a body item, its centre at x */
const Under = ({ x, y, text, on }: { x: number; y: number; text: string; on: boolean }) => (
  <Show on={on} style={{ position: 'absolute', left: x - 50, width: 100, top: y, textAlign: 'center', zIndex: 4 }}><span style={tag(13)}>{text}</span></Show>
)
/* Dev's frequent deploys: three ticks lighting one after another, forever */
const TICKS = [0, 1, 2].map((i) => blink(`tick${i}`, 3, [[0, 0.35], [i * 22 + 4, 0.35], [i * 22 + 14, 1], [i * 22 + 40, 1], [i * 22 + 52, 0.35], [100, 0.35]]))

/** the package riding a `ride` class (the token's place), nothing on held frames */
function Rider({ cls }: { cls: string }) {
  const held = useHeld()
  if (held) return null
  return (
    <span aria-hidden style={{ position: 'absolute', left: -12, top: -12, width: 24, height: 24, zIndex: 6, pointerEvents: 'none' }}>
      <span className={cls} style={{ display: 'grid', placeItems: 'center', width: 24, height: 24, borderRadius: 8, background: '#FFFFFF', boxShadow: `inset 0 0 0 1.5px ${colors.brand}55, 0 4px 10px -4px ${colors.brand}`, opacity: 0 }}>
        <Ico3D name="package" size={17} loop="none" />
      </span>
    </span>
  )
}

/** the TR 24 row at vertical offset `oy`: the boxes, their arrows and gate, and every part built so far */
function EnvRow({ oy, walkCls, lit, parts }: { oy: number; walkCls: string[]; lit: { dev?: boolean; stg?: boolean; prod?: boolean; gate?: boolean; mirror?: boolean }; parts: { ticks: boolean; mirror: boolean; users: boolean; gateWhy: boolean } }) {
  const py = B.PY + oy
  const y = ROW_DY(oy)
  const body = py + 116 // Dev's ticks
  const R1 = py + 72 // Configuration
  const R2 = py + 150 // Tests / Users
  const BY = py + B.PH + 34 // the mirror bracket's floor
  return (
    <>
      {B_ENVS.map((e, i) => <Env key={e.name} x={B.X[i]} y={py} w={B.PW} h={B.PH} icon={e.icon} name={e.name} lit={[lit.dev, lit.stg, lit.prod][i] ?? false} loop={e.loop} d={i * 0.5} />)}
      <W pts={[[B.X[0] + B.PW, y], [B.X[1], y]]} head={9} width={2.6} />
      <W pts={[[B.X[1] + B.PW, y], [B.GATE_X - B.G / 2, y]]} head={9} width={2.6} />
      <W pts={[[B.GATE_X + B.G / 2, y], [B.X[2], y]]} head={9} width={2.6} />
      <Tile x={B.GATE_X} y={y} icon="gate" size={B.G} lit={lit.gate} loop="pulse" label="Gate" />
      {/* T24-B (1): the gate opens on approval or tests */}
      <Disc x={B.GATE_X - 15} y={y - B.G / 2 - 16} icon="user" size={26} on={parts.gateWhy} />
      <Disc x={B.GATE_X + 15} y={y - B.G / 2 - 16} icon="checklist" size={26} on={parts.gateWhy} d={0.6} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none' }}>{walkCls.map((c) => <Rider key={c} cls={c} />)}</div>
      {/* T24 (1): Dev's frequent deploys */}
      {[-36, 0, 36].map((dx, i) => <Disc key={dx} x={BCX[0] + dx} y={body} icon="check" size={30} on={parts.ticks} cls={TICKS[i]} loop="none" />)}
      <Under x={BCX[0]} y={body + 28} text="Deploys" on={parts.ticks} />
      {/* T24 (2): Staging's configuration mirrors Production's */}
      <Tile x={BCX[1]} y={R1} icon="gear" size={44} on={parts.mirror} lit={lit.mirror} loop="spin" t={6} />
      <Under x={BCX[1]} y={R1 + 28} text="Configuration" on={parts.mirror} />
      <Tile x={BCX[1]} y={R2} icon="checklist" size={44} on={parts.mirror} loop="pulse" d={0.3} />
      <Under x={BCX[1]} y={R2 + 28} text="Tests" on={parts.mirror} />
      <Tile x={BCX[2]} y={R1} icon="gear" size={44} on={parts.mirror} lit={lit.mirror} loop="spin" t={6} />
      <Under x={BCX[2]} y={R1 + 28} text="Configuration" on={parts.mirror} />
      <W pts={[[BCX[1], py + B.PH], [BCX[1], BY], [BCX[2], BY], [BCX[2], py + B.PH]]} on={parts.mirror} lit={lit.mirror} head={0} width={2.6} />
      <Disc x={B.GATE_X} y={BY} icon="replica" size={32} on={parts.mirror} />
      {/* T24-B (1): Production serves real users */}
      <Tile x={BCX[2]} y={R2} icon="users" size={44} on={parts.users} loop="bob" d={0.2} />
      <Under x={BCX[2]} y={R2 + 28} text="Users" on={parts.users} />
    </>
  )
}

const K_T24: Fig = (p) => {
  const { hot, s } = useBuild(p, 2800)
  return (
    <Frame w={B.W} h={302}>
      <EnvRow oy={-72} walkCls={WALK.t24} lit={{ dev: hot === 0, stg: hot === 1, mirror: hot === 1 }} parts={{ ticks: s(1), mirror: s(2), users: false, gateWhy: false }} />
    </Frame>
  )
}

const K_T24B: Fig = (p) => {
  const { hot, s } = useBuild(p, 2800)
  const MY = 34 // the CodePipeline mark's centre
  const RAIL = 72
  return (
    <Frame w={B.W} h={374}>
      <EnvRow oy={0} walkCls={WALK.t24b} lit={{ prod: hot === 0, gate: hot === 0 }} parts={{ ticks: true, mirror: true, users: s(1), gateWhy: s(1) }} />
      {/* (2) CodePipeline over the row: each environment is one stage */}
      <Show on={s(2)} style={{ position: 'absolute', left: B.W / 2 - 24, top: MY - 24, width: 48, height: 48, zIndex: 4 }}>
        <MarkTile src={pipeMark} size={48} lit={hot === 1} />
        <span style={{ ...tag(15, colors.ink), fontWeight: 700, position: 'absolute', left: 58, top: '50%', transform: 'translateY(-50%)' }}>AWS CodePipeline</span>
      </Show>
      {BCX.map((cx, i) => <W key={cx} pts={[[B.W / 2, MY + 24], [B.W / 2, RAIL], [cx, RAIL], [cx, B.PY]]} on={s(2)} lit={hot === 1} head={9} width={2.4} delay={i * 130} />)}
    </Frame>
  )
}

export const figures: Record<string, Fig> = { K_T23, K_T23B, K_T23C, K_T24, K_T24B }
export const css = [
  K.css(),
  KF.join('\n'),
  '.cc-still .s22k-a, .deck-thumb .s22k-a { animation: none !important; }',
  '@media (prefers-reduced-motion: reduce) { .s22k-a { animation: none !important; } }',
].join('\n')
