import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Badge, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, Frame, Show, Plinth, MarkTile, Panel, Wire, Junction, Token, keyframes, tag, heading, useHeld, useHot, type Pt } from '@/engine/figkit'
import cmMark from '../images/k8s-cm.svg'
import secretMark from '../images/k8s-secret.svg'
import podMark from '../images/k8s-pod.svg'
import volMark from '../images/k8s-vol.svg'
import nsMark from '../images/k8s-ns.svg'
import etcdMark from '../images/k8s-etcd.svg'
import kubeletMark from '../images/k8s-kubelet.svg'
import smMark from '../images/aws-secrets-manager.svg'
import psMark from '../images/aws-systems-manager-parameter-store.svg'
import dockerMark from '../images/tech-docker.svg'

/*
 * SESSION 21 · SECTION 1 (Configuration & Secrets) technical figures, builder A.
 * Built to generate-slides standing corrections 13-17 and cloud course R7-R14: 3D icons on plinth tiles, official marks
 * on white tiles (the marks never move), >= 20 px equal padding, orthogonal wires computed from the same constants as
 * the boxes, a flow dot on every live wire, a lit item walking first -> last -> first after the build (starting on the
 * last item). Loops are transform / opacity on HTML elements (or a root svg) only. Held (?still): the full final state,
 * nothing lit, nothing moving. Class prefix `s21a-`.
 *
 *   slide 6  A_T01   566 x 380  Container Image + ConfigMap + Secret wired into one Pod; the ConfigMap opens to its
 *                               keys (1), the Secret to its padlocked rows (2)
 *   slide 7  A_T01B  566 x 380  the same objects, now fed by Literals / Files / YAML Manifests (1); the pod's wires
 *                               carry `By Name` while a value hardcoded into the image is refused (2)
 *   slide 10 A_T02B  566 x 380  ConfigMap and Secret columns, each with its padlock; etcd encryption closes the Secret's
 *                               padlock (1), `kubectl describe` hides the values (2), the ConfigMap stays open (3)
 *   slide 11 A_T03   566 x 360  one ConfigMap / Secret source split into env vars inside a container (1) and a volume
 *                               mount, one file per key in a directory (2)
 *   slide 12 A_T03B  566 x 380  the same split: the source changes, the env vars stay frozen until a restart (1); the
 *                               kubelet syncs the mounted files at once (2); loop: change, sync, restart
 *   slide 13 A_T04   546 x 360  Secrets Manager (Parameter Store below) -> CSI Driver -> a volume in a Pod; rotation and
 *                               audit on the AWS side (1); the namespace-scoped SecretProviderClass refuses a pod in
 *                               another namespace (2)
 *   slide 14 A_T04B  546 x 274  the same flow: rotation on, the CSI Driver polls and refreshes the mounted file while
 *                               the pod keeps running (1)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('s21a')
const BLUE = colors.brand
const GREEN = '#25BC6E'
const MONO = "'JetBrains Mono', ui-monospace, monospace"
const NOLIG: CSSProperties = { fontVariantLigatures: 'none', fontFeatureSettings: "'liga' 0, 'calt' 0" }
const RIM = 'inset 0 0 0 1.5px #D3DEF6, 0 12px 24px -16px rgba(31,64,140,0.34)'
const LIT = `inset 0 0 0 2.5px ${ORANGE}, 0 10px 22px -12px rgba(255,138,61,0.7)`
const I = (n: string) => n as Ico3DName

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)
const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })
const mono = (size = 13, color: string = colors.ink): CSSProperties => ({ fontFamily: MONO, ...NOLIG, fontSize: size, fontWeight: 600, lineHeight: 1.2, color, whiteSpace: 'nowrap' })

/** the build: the step, the lit item, held. The walk after the build starts on the LAST item (S18 fix). */
function useBuild(p: Record<string, unknown>, period: number) {
  const cnt = Number(p.steps ?? 1)
  const held = useHeld()
  const step = held ? cnt : stepOf(p)
  const raw = useHot(cnt, stepOf(p), period)
  const hot = raw >= 0 && stepOf(p) >= cnt ? (raw + cnt - 1) % cnt : raw
  return { step, hot, held, s: (n: number) => step >= n, done: !held && stepOf(p) >= cnt }
}

/** a 3D icon (or an official mark) on its plinth with its tag under (or beside) it; the TILE is centred on (x, y) */
function Node({ x, y, label, icon, mark, size = 52, k = 0.74, on = true, lit = false, loop = 'bob', d = 0, t, badge, w = 130, tagSize = 14, side = false, delay = 0, z = 3, dim = false, children }: { x: number; y: number; label?: string; icon?: Ico3DName; mark?: string; size?: number; k?: number; on?: boolean; lit?: boolean; loop?: Loop; d?: number; t?: number; badge?: Badge; w?: number; tagSize?: number; side?: boolean; delay?: number; z?: number; dim?: boolean; children?: ReactNode }) {
  const instant = useInstant()
  const tile = mark ? <MarkTile src={mark} size={size} lit={lit} /> : (
    <Plinth size={size} lit={lit}>
      <Ico3D name={icon ?? 'doc'} size={Math.round(size * k)} loop={loop} d={d} t={t} badge={badge} />
    </Plinth>
  )
  const inner = (
    <div style={{ position: 'relative', width: size, height: size, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
      <div style={{ display: 'grid', placeItems: 'center', opacity: dim ? 0.45 : 1, transition: instant ? 'none' : `opacity 520ms ${EASE}` }}>{tile}</div>
      {children}
    </div>
  )
  if (side) {
    return (
      <Show on={on} delay={delay} style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, height: size, zIndex: z, display: 'flex', alignItems: 'center', gap: 8 }}>
        {inner}
        {label && <span style={tag(tagSize)}>{label}</span>}
      </Show>
    )
  }
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, width: w, top: y - size / 2, zIndex: z, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {inner}
      {label && <span style={{ ...tag(tagSize), marginTop: 6 }}>{label}</span>}
    </Show>
  )
}

/** the engine's 3D cross turned to the template's orange (blocked = orange, never red); S18 OrangeCross */
const OrangeCross = ({ size }: { size: number }) => (
  <span style={{ display: 'grid', filter: 'hue-rotate(28deg) saturate(1.15) brightness(1.06)' }}>
    <Ico3D name="cross" size={size} loop="none" />
  </span>
)

/** a small white disc holding a 3D icon (or the orange cross), centred on (x, y) of the frame */
function Disc({ x, y, on = true, size = 26, icon = 'check', loop = 'pulse', d = 0, t = 2.4, cross = false, z = 9, cls }: { x: number; y: number; on?: boolean; size?: number; icon?: Ico3DName; loop?: Loop; d?: number; t?: number; cross?: boolean; z?: number; cls?: string }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: z, opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}` }}>
      <span className={cls} style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6' }}>
        {cross ? <OrangeCross size={size - 4} /> : <Ico3D name={icon} size={size - 6} loop={cls ? 'none' : loop} d={d} t={t} />}
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

/** a wire on its own layer above the panels (a Panel is z 2); tiles (z 3) and cards stay on top */
const W = (props: Parameters<typeof Wire>[0]) => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}><Wire {...props} /></div>
)

/** a white card above the wires and riders (z 8), ringing while it is the part being explained */
function Card({ x, y, w, h, on = true, lit = false, delay = 0, z = 8, tint, children }: { x: number; y: number; w: number; h: number; on?: boolean; lit?: boolean; delay?: number; z?: number; tint?: string; children?: ReactNode }) {
  const instant = useInstant()
  return (
    <Show on={on} delay={delay} style={{ ...box(x, y, w, h), zIndex: z }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 14, background: tint ?? 'linear-gradient(180deg, #FFFFFF 0%, #F6F9FF 100%)', boxShadow: lit ? LIT : RIM, transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }} />
      <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
    </Show>
  )
}

/** one row inside a card: a small 3D icon, its tag, and (optionally) a value bar; placed in the card's coordinates */
function Row({ x, y, w, h = 26, icon, label, on = true, delay = 0, d = 0, bar, tagSize = 14 }: { x: number; y: number; w: number; h?: number; icon: Ico3DName; label: string; on?: boolean; delay?: number; d?: number; bar?: ReactNode; tagSize?: number }) {
  return (
    <Show on={on} delay={delay} lift={4} style={{ ...box(x, y, w, h), borderRadius: 9, background: '#F2F6FF', boxShadow: 'inset 0 0 0 1.2px #D3DEF6', display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px 0 6px', boxSizing: 'border-box' }}>
      <Ico3D name={icon} size={h - 6} loop="bob" d={d} t={2.8} />
      <span style={{ ...tag(tagSize), textAlign: 'left' }}>{label}</span>
      {bar && <span style={{ marginLeft: 'auto', display: 'grid' }}>{bar}</span>}
    </Show>
  )
}

/** a value bar: blue = the value in use, green overlay = the new value (its opacity driven by `fresh` or a loop class) */
function ValueBar({ w = 40, fresh = false, cls }: { w?: number; fresh?: boolean; cls?: string }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'relative', display: 'block', width: w, height: 8 }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: 99, background: `linear-gradient(90deg, ${BLUE}, #7FA0F7)` }} />
      <span className={cls} style={{ position: 'absolute', inset: 0, borderRadius: 99, background: `linear-gradient(90deg, #128A4E, ${GREEN})`, opacity: cls ? undefined : fresh ? 1 : 0, transition: instant || cls ? 'none' : `opacity 520ms ${EASE}` }} />
    </span>
  )
}

/** the Pod panel shared by slides 6 and 7: the Pod mark over the container the image runs as */
const POD = { X: 396, R: 546, Y: 30, B: 350 }
const POD_CX = (POD.X + POD.R) / 2 // 471
function PodBox({ lit = false, cm = false, sec = false }: { lit?: boolean; cm?: boolean; sec?: boolean }) {
  return (
    <>
      <Panel x={POD.X} y={POD.Y} w={POD.R - POD.X} h={POD.B - POD.Y} lit={lit} />
      <Node x={POD_CX} y={112} mark={podMark} size={46} label="Pod" />
      <Node x={POD_CX} y={238} icon="container" size={58} label="Container" loop="bob" t={3} />
      {/* the values the pod has taken in: the ConfigMap's keys and the Secret's key, on the container's corners */}
      <Disc x={POD_CX - 29} y={209} icon="list" on={cm} d={0.3} />
      <Disc x={POD_CX + 29} y={209} icon="key" on={sec} d={0.9} />
    </>
  )
}

/* ================================================================== slide 6 · A_T01 · the image, ConfigMap, Secret, Pod */

/*
 * 566 x 380. Left column (x 76): Container Image (y 60: the sealed package, Docker mark on its corner), ConfigMap (180),
 * Secret (300); each wired straight right into the Pod panel's left edge (x 396). Press 1 the ConfigMap opens to its
 * key rows (card x 130..310 over its wire), press 2 the Secret opens to its padlocked rows. Values ride into the pod.
 */
const A = { W: 566, H: 380, TX: 76, TS: 52, CX: 130, CW: 180, PER: 3.6 }
const A_Y = [60, 180, 300]
const A_WIRE: Pt[][] = A_Y.map((y) => [[A.TX + A.TS / 2, y], [POD.X, y]])
const A_R = A_WIRE.map((pts, i) => K.ride(`t01r${i}`, pts, 0.1 + i * 0.7, 1.4 + i * 0.7, A.PER))
const A_CM = { rows: 2, rh: 26, gap: 5, pad: 12 }
const A_CMH = A_CM.pad * 2 + A_CM.rows * A_CM.rh + (A_CM.rows - 1) * A_CM.gap // 81
const A_SH = A_CM.pad * 2 + 3 * A_CM.rh + 2 * A_CM.gap // 112
const CM_ROWS: { icon: Ico3DName; label: string }[] = [{ icon: 'log', label: 'Log Level' }, { icon: 'link', label: 'API URL' }]
const SEC_ROWS: { icon: Ico3DName; label: string }[] = [{ icon: 'password', label: 'Passwords' }, { icon: 'token', label: 'Tokens' }, { icon: 'certificate', label: 'Certificates' }]

/** the sealed container image: a package (padlock badge) with the Docker mark on its corner */
function ImageNode({ x, y, size = 52, label = 'Container Image', lit = false }: { x: number; y: number; size?: number; label?: string; lit?: boolean }) {
  return (
    <Node x={x} y={y} icon="package" badge="lock" size={size} label={label} lit={lit} w={140}>
      <span style={{ position: 'absolute', right: -14, top: -12, zIndex: 4 }}><MarkTile src={dockerMark} size={26} scale={0.72} /></span>
    </Node>
  )
}

const A_T01: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 2 }, 2200)
  const cmY = A_Y[1] - A_CMH / 2
  const secY = A_Y[2] - A_SH / 2
  return (
    <Frame w={A.W} h={A.H}>
      <PodBox cm={s(1)} sec={s(2)} />
      {A_WIRE.map((pts, i) => <W key={i} pts={pts} head={9} lit={i > 0 && hot === i - 1} />)}
      <ImageNode x={A.TX} y={A_Y[0]} />
      <Node x={A.TX} y={A_Y[1]} mark={cmMark} size={A.TS} label="ConfigMap" lit={hot === 0} />
      <Node x={A.TX} y={A_Y[2]} mark={secretMark} size={A.TS} label="Secret" lit={hot === 1} />
      <Token cls={A_R[0]} size={9} />
      <Rider cls={A_R[1]} icon="list" />
      <Rider cls={A_R[2]} icon="key" />

      {/* point 1: the ConfigMap opens to its key-value rows */}
      <Card x={A.CX} y={cmY} w={A.CW} h={A_CMH} on={s(1)} lit={hot === 0}>
        {CM_ROWS.map((r, i) => <Row key={r.label} x={A_CM.pad} y={A_CM.pad + i * (A_CM.rh + A_CM.gap)} w={A.CW - 2 * A_CM.pad} h={A_CM.rh} icon={r.icon} label={r.label} on={s(1)} delay={200 + i * 140} d={i * 0.5} />)}
      </Card>
      {/* point 2: the Secret opens to its padlocked rows */}
      <Card x={A.CX} y={secY} w={A.CW} h={A_SH} on={s(2)} lit={hot === 1}>
        {SEC_ROWS.map((r, i) => <Row key={r.label} x={A_CM.pad} y={A_CM.pad + i * (A_CM.rh + A_CM.gap)} w={A.CW - 2 * A_CM.pad} h={A_CM.rh} icon={r.icon} label={r.label} on={s(2)} delay={200 + i * 140} d={i * 0.5} />)}
      </Card>
      <Disc x={A.CX + A.CW - 4} y={secY + 4} icon="lock" on={s(2)} loop="beat" size={28} />
    </Frame>
  )
}

/* ================================================================== slide 7 · A_T01B · created three ways, referenced by name */

/*
 * 566 x 380, the same Pod (x 396..546) and the same three objects, now in a column at x 206 (y 60 / 180 / 300). Press 1:
 * three sources at x 76 (Literals 140, Files 220, YAML Manifests 300) join a bus at x 134 that feeds the ConfigMap (180)
 * and the Secret (300). Press 2: a `By Name` tag sits on the ConfigMap's and the Secret's wires into the pod, and a
 * value hardcoded into the image (x 76, y 60) is refused: a dashed faded wire, an orange cross before the image.
 */
const B = { W: 566, H: 380, OX: 206, TS: 52, SX: 76, SS: 40, BUS: 134, HX: 76, PER: 3.6 }
const B_SY = [140, 220, 300]
const B_OL = B.OX - B.TS / 2 // 180
const B_WIRE: Pt[][] = A_Y.map((y) => [[B.OX + B.TS / 2, y], [POD.X, y]])
const B_IN: Pt[][] = B_SY.map((y, i) => (i === 2 ? [[B.SX + B.SS / 2, y], [B_OL, y]] : [[B.SX + B.SS / 2, y], [B.BUS, y]]))
const B_BUS: Pt[] = [[B.BUS, B_SY[0]], [B.BUS, B_SY[2]]]
const B_OUT: Pt[] = [[B.BUS, A_Y[1]], [B_OL, A_Y[1]]]
const B_SRC: Pt[][] = [
  [[B.SX + B.SS / 2, B_SY[0]], [B.BUS, B_SY[0]], [B.BUS, A_Y[1]], [B_OL, A_Y[1]]], // Literals -> ConfigMap
  [[B.SX + B.SS / 2, B_SY[1]], [B.BUS, B_SY[1]], [B.BUS, A_Y[2]], [B_OL, A_Y[2]]], // Files -> Secret
  [[B.SX + B.SS / 2, B_SY[2]], [B.BUS, B_SY[2]], [B.BUS, A_Y[1]], [B_OL, A_Y[1]]], // YAML Manifests -> ConfigMap
]
const B_RS = B_SRC.map((pts, i) => K.ride(`t01bs${i}`, pts, 0.1 + i * 0.6, 1.2 + i * 0.6, B.PER))
const B_RP = B_WIRE.map((pts, i) => K.ride(`t01bp${i}`, pts, 1.3 + i * 0.5, 2.5 + i * 0.5, B.PER))
const B_HARD: Pt[] = [[B.HX + 20, A_Y[0]], [B_OL, A_Y[0]]]
const B_HX = (B.HX + 20 + B_OL) / 2 // 138, the orange cross
const B_RH = K.ride('t01bh', [[B.HX + 20, A_Y[0]], [B_HX - 14, A_Y[0]]], 0.4, 1.2, B.PER, 0.5)
const B_SRCS: { icon: Ico3DName; label: string }[] = [{ icon: 'terminal', label: 'Literals' }, { icon: 'doc', label: 'Files' }, { icon: 'code', label: 'YAML Manifests' }]

/** a `By Name` tag sitting on a wire (centred on x, y), above the riders */
function ByName({ x, y, on, lit }: { x: number; y: number; on: boolean; lit: boolean }) {
  const instant = useInstant()
  return (
    <Show on={on} style={{ ...box(x - 50, y - 14, 100, 28), zIndex: 8 }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: 99, background: '#FFFFFF', boxShadow: lit ? LIT : RIM, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
        <Ico3D name="tag" size={20} loop="swing" t={2.6} />
        <span style={tag(14)}>By Name</span>
      </span>
    </Show>
  )
}

const A_T01B: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 2 }, 2200)
  return (
    <Frame w={B.W} h={B.H}>
      <PodBox cm sec lit={hot === 1} />
      {B_WIRE.map((pts, i) => <W key={i} pts={pts} head={9} lit={hot === 1 && i > 0} />)}
      <ImageNode x={B.OX} y={A_Y[0]} />
      <Node x={B.OX} y={A_Y[1]} mark={cmMark} size={B.TS} label="ConfigMap" lit={hot === 0} />
      <Node x={B.OX} y={A_Y[2]} mark={secretMark} size={B.TS} label="Secret" lit={hot === 0} />
      <Token cls={B_RP[0]} size={9} />
      <Rider cls={B_RP[1]} icon="list" />
      <Rider cls={B_RP[2]} icon="key" />

      {/* point 1: created from literals, files or YAML manifests */}
      {B_IN.map((pts, i) => <W key={i} pts={pts} head={i === 2 ? 9 : 0} on={s(1)} lit={hot === 0} delay={i * 120} />)}
      <W pts={B_BUS} head={0} on={s(1)} lit={hot === 0} delay={300} />
      <W pts={B_OUT} head={9} on={s(1)} lit={hot === 0} delay={450} />
      {[A_Y[1], B_SY[1], B_SY[2]].map((y) => <Junction key={y} x={B.BUS} y={y} on={s(1)} lit={hot === 0} />)}
      {B_SRCS.map((c, i) => <Node key={c.label} x={B.SX} y={B_SY[i]} icon={c.icon} size={B.SS} label={c.label} tagSize={13} w={110} on={s(1)} delay={i * 140} lit={hot === 0} d={i * 0.4} />)}
      {B_RS.map((c, i) => <Rider key={i} cls={c} icon={B_SRCS[i].icon} size={22} on={s(1)} />)}

      {/* point 2: referenced by name, not hardcoded into the image */}
      <ByName x={(B.OX + B.TS / 2 + POD.X) / 2} y={A_Y[1]} on={s(2)} lit={hot === 1} />
      <ByName x={(B.OX + B.TS / 2 + POD.X) / 2} y={A_Y[2]} on={s(2)} lit={hot === 1} />
      <W pts={B_HARD} head={8} on={s(2)} dash="5 6" width={2} opacity={0.5} color="#7FA0EA" />
      <Node x={B.HX} y={A_Y[0]} icon="password" size={40} label="Hardcoded" tagSize={13} w={100} on={s(2)} dim lit={hot === 1} />
      <Disc x={B_HX} y={A_Y[0]} cross on={s(2)} size={24} />
      <Token cls={B_RH} on={s(2)} size={8} tone="#7FA0EA" />
    </Frame>
  )
}

/* ================================================================== slide 10 · A_T02B · padlocks, etcd, kubectl describe */

/*
 * 566 x 380. Two columns (centres x 150 and 416): the ConfigMap and Secret marks (y 62), their padlocks (y 170: the
 * ConfigMap's open, `Plain Text`; the Secret's open, `Base64, Not Encrypted`). Press 1 etcd (283, 170) with an
 * encryption shield wires into the Secret's padlock, which closes (`Encrypted At Rest`). Press 2 a `kubectl describe
 * secret` terminal under the Secret column, its values hidden. Press 3 the ConfigMap's padlock stays open and its plain
 * values card (Log Level, URLs, Flags) is readable. Loop: the padlocks pulse, a shield rides etcd's wire.
 */
const C = { W: 566, H: 380, MY: 62, LY: 170, LS: 64, EX: 283, CY0: 248, CH: 106, CW: 220, PER: 2.8 }
const C_X = [150, 416]
const C_EW: Pt[] = [[C.EX + 26, C.LY], [C_X[1] - C.LS / 2, C.LY]]
const C_RE = K.ride('t02be', C_EW, 0.2, 1.3, C.PER)
const CM_VALS: { icon: Ico3DName; label: string }[] = [{ icon: 'log', label: 'Log Level' }, { icon: 'link', label: 'URLs' }, { icon: 'flag', label: 'Flags' }]

/** a padlock tile: open, or (closed) a cross-fade to the shut padlock; its tag cross-fades too */
function Padlock({ x, y, closed, lit, a, b, d = 0 }: { x: number; y: number; closed: boolean; lit: boolean; a: string; b?: string; d?: number }) {
  const instant = useInstant()
  const fade = (on: boolean): CSSProperties => ({ gridArea: '1 / 1', opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.8)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}` })
  return (
    <div style={{ position: 'absolute', left: x - 90, top: y - C.LS / 2, width: 180, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Plinth size={C.LS} lit={lit}>
        <span style={{ display: 'grid' }}>
          <span style={fade(!closed)}><Ico3D name="unlock" size={46} loop="beat" d={d} t={2.6} /></span>
          <span style={fade(closed)}><Ico3D name="lock" size={46} loop="beat" d={d} t={2.6} /></span>
        </span>
      </Plinth>
      <span style={{ display: 'grid', marginTop: 6, justifyItems: 'center' }}>
        <span style={{ ...tag(14), ...fade(!closed || !b) }}>{a}</span>
        {b && <span style={{ ...tag(14), ...fade(closed) }}>{b}</span>}
      </span>
    </div>
  )
}

const A_T02B: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 3 }, 2000)
  return (
    <Frame w={C.W} h={C.H}>
      <Node x={C_X[0]} y={C.MY} mark={cmMark} size={52} label="ConfigMap" lit={hot === 2} />
      <Node x={C_X[1]} y={C.MY} mark={secretMark} size={52} label="Secret" lit={hot === 0 || hot === 1} />
      <Padlock x={C_X[0]} y={C.LY} closed={false} lit={hot === 2} a="Plain Text" d={0} />
      <Padlock x={C_X[1]} y={C.LY} closed={s(1)} lit={hot === 0} a="Base64, Not Encrypted" b="Encrypted At Rest" d={1.3} />

      {/* point 1: etcd encryption at rest closes the Secret's padlock */}
      <W pts={C_EW} head={9} on={s(1)} lit={hot === 0} />
      <Node x={C.EX} y={C.LY} mark={etcdMark} size={52} label="etcd" on={s(1)} lit={hot === 0} />
      <Disc x={C.EX + 26} y={C.LY - 26} icon="shield" on={s(1)} loop="beat" size={28} />
      <Rider cls={C_RE} icon="shield" size={22} on={s(1)} />

      {/* point 2: kubectl describe shows the Secret's keys, never their values */}
      <Card x={C_X[1] - C.CW / 2} y={C.CY0} w={C.CW} h={C.CH} on={s(2)} lit={hot === 1} z={3} tint="linear-gradient(180deg, #13244D 0%, #0C1A3A 100%)">
        <div style={{ ...box(0, 0, C.CW, 26), borderRadius: '14px 14px 0 0', background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 5, padding: '0 12px', boxSizing: 'border-box' }}>
          {['#FF6B5E', '#FFC53A', '#25BC6E'].map((c) => <span key={c} style={{ width: 8, height: 8, borderRadius: 99, background: c }} />)}
          <span style={{ marginLeft: 'auto', display: 'grid' }}><Ico3D name="terminal" size={18} loop="bob" t={2.8} /></span>
        </div>
        <div style={{ ...box(12, 34, C.CW - 24, 18), ...mono(13, '#E8EEFF') }}><span style={{ color: '#7FA0F7' }}>$ </span>kubectl describe secret</div>
        {['password', 'token'].map((k, i) => (
          <div key={k} style={{ ...box(12, 58 + i * 22, C.CW - 24, 18), display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ ...mono(13, '#9DB8FF'), width: 76 }}>{k}</span>
            <span style={{ flex: 1, height: 9, borderRadius: 99, background: 'rgba(200,214,240,0.5)', filter: 'blur(2.2px)' }} />
          </div>
        ))}
      </Card>

      {/* point 3: the ConfigMap stays unencrypted: its plain values are readable */}
      <Card x={C_X[0] - C.CW / 2} y={C.CY0} w={C.CW} h={C.CH} on={s(3)} lit={hot === 2} z={3}>
        {CM_VALS.map((r, i) => <Row key={r.label} x={12} y={12 + i * 29} w={C.CW - 24} h={25} icon={r.icon} label={r.label} on={s(3)} delay={150 + i * 120} d={i * 0.4} bar={<ValueBar w={46} />} />)}
      </Card>
      <Disc x={C_X[0] + C.CW / 2 - 4} y={C.CY0 + 4} icon="eye" on={s(3)} loop="pulse" size={28} />
    </Frame>
  )
}

/* ================================================================== slides 11-12 · A_T03 / A_T03B · env vars vs volumes */

/*
 * 566 x 360 (slide 12: 566 x 380, the panels 20 px lower so the kubelet sits on the right branch). The source card
 * (ConfigMap + Secret marks, x 141..425, y 20..80) feeds a trunk to a junction (283, 104) that splits: left into the
 * Container panel (x 20..262), its Env Vars list (Log Level, API URL, each with its value); right into the Volume Mount
 * panel (x 304..546), its Directory with one file per key.
 */
const D = { W: 566, SX: 141, SR: 425, SY: 20, SB: 80, J: 104, LX: 20, RX: 304, PW: 242, IN: 20, IW: 202, IH: 108, PER: 3.2 }
const D_CX = [D.LX + D.PW / 2, D.RX + D.PW / 2] // 141, 425
const dGeo = (py: number) => {
  const trunk: Pt[] = [[(D.SX + D.SR) / 2, D.SB], [(D.SX + D.SR) / 2, D.J]]
  const left: Pt[] = [[(D.SX + D.SR) / 2, D.J], [D_CX[0], D.J], [D_CX[0], py]]
  const right: Pt[] = [[(D.SX + D.SR) / 2, D.J], [D_CX[1], D.J], [D_CX[1], py]]
  return { trunk, left, right, py, hy: py + 38, iy: py + 76, ph: 204 }
}
const D3 = dGeo(136)
const D3B = dGeo(156)
const D_RL = K.ride('t03l', [...D3.trunk, ...D3.left.slice(1)], 0.1, 1.4, D.PER)
const D_RR = K.ride('t03r', [...D3.trunk, ...D3.right.slice(1)], 1.7, 3.0, D.PER)

/** the source card: the ConfigMap and Secret marks side by side */
function SourceCard({ lit = false }: { lit?: boolean }) {
  return (
    <Card x={D.SX} y={D.SY} w={D.SR - D.SX} h={D.SB - D.SY} lit={lit} z={3}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
        {[{ m: cmMark, l: 'ConfigMap' }, { m: secretMark, l: 'Secret' }].map((o) => (
          <span key={o.l} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <MarkTile src={o.m} size={38} />
            <span style={heading(16)}>{o.l}</span>
          </span>
        ))}
      </div>
    </Card>
  )
}

/** one side of the split: a panel with its header (icon tile + heading) and an inner card (header icon + tag, two rows) */
function SidePanel({ x, g, lit, head, inner, rows, corner, innerOn = true }: { x: number; g: ReturnType<typeof dGeo>; lit: boolean; head: ReactNode; inner: { icon: Ico3DName; label: string }; rows: ReactNode; corner?: ReactNode; innerOn?: boolean }) {
  return (
    <>
      <Panel x={x} y={g.py} w={D.PW} h={g.ph} lit={lit} />
      <div style={{ ...box(x + D.IN, g.hy - 18, D.PW - 2 * D.IN, 36), zIndex: 3, display: 'flex', alignItems: 'center', gap: 10 }}>{head}</div>
      <Card x={x + D.IN} y={g.iy} w={D.IW} h={D.IH} z={3} on={innerOn}>
        <div style={{ ...box(12, 12, D.IW - 24, 22), display: 'flex', alignItems: 'center', gap: 8 }}>
          <Ico3D name={inner.icon} size={22} loop="bob" t={3} />
          <span style={tag(14)}>{inner.label}</span>
        </div>
        {rows}
      </Card>
      {corner}
    </>
  )
}

const KEYS = ['Log Level', 'API URL']

const A_T03: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 2 }, 2200)
  const g = D3
  return (
    <Frame w={D.W} h={360}>
      <SourceCard />
      <W pts={g.trunk} head={0} />
      <Junction x={(D.SX + D.SR) / 2} y={D.J} />
      <W pts={g.left} head={9} lit={hot === 0} />
      <W pts={g.right} head={9} lit={hot === 1} />
      <SidePanel x={D.LX} g={g} lit={hot === 0} innerOn={s(1)}
          head={<><Plinth size={36}><Ico3D name="container" size={28} loop="bob" t={3} /></Plinth><span style={heading(16)}>Container</span></>}
          inner={{ icon: 'list', label: 'Env Vars' }}
          rows={KEYS.map((k, i) => <Row key={k} x={12} y={42 + i * 30} w={D.IW - 24} h={25} icon="key" label={k} on={s(1)} delay={200 + i * 140} d={i * 0.5} bar={<ValueBar w={40} />} />)} />
      <SidePanel x={D.RX} g={g} lit={hot === 1} innerOn={s(2)}
          head={<><MarkTile src={volMark} size={36} /><span style={heading(16)}>Volume Mount</span></>}
          inner={{ icon: I('folder'), label: 'Directory' }}
          rows={KEYS.map((k, i) => <Row key={k} x={12} y={42 + i * 30} w={D.IW - 24} h={25} icon="doc" label={k} on={s(2)} delay={200 + i * 140} d={i * 0.5 + 0.3} bar={<ValueBar w={40} />} />)} />
      <Rider cls={D_RL} icon="key" size={22} />
      <Rider cls={D_RR} icon="key" size={22} />
    </Frame>
  )
}

/*
 * slide 12. Press 1 (point 3): the source changes (a fixed doc on the source card), the env vars keep the old value
 * (a padlock on their card) and the container needs a restart (power on the container tile). Press 2 (point 4): the
 * kubelet on the right branch syncs the change into the mounted files at once (their values turn green, refresh on the
 * Directory card). Loop after the build (6 s, starting from the built state, the walk in step with it: the Volume Mount
 * lit for 0-3 s, the Container for 3-6 s): the files settle back to blue, a new change (0.4 s), the key rides through
 * the kubelet and the files turn green (1.7 s); then the restart (3.1 s), the key rides into the env vars, they turn
 * green and the padlock opens (4.0 s); at 5.6 s the env vars settle back under the padlock, which is the start state.
 */
const DB = { H: 380, PER: 6 }
const DB_KX = D_CX[1] // the kubelet on the right branch's vertical
const DB_KY = 128
const DB_RR = K.ride('t03br', [...D3B.trunk, ...D3B.right.slice(1)], 0.6, 1.6, DB.PER)
const DB_RL = K.ride('t03bl', [...D3B.trunk, ...D3B.left.slice(1)], 3.2, 3.9, DB.PER)
/* before the build ends: slide 11's loop, keys riding both branches */
const DB_L0 = K.ride('t03bl0', [...D3B.trunk, ...D3B.left.slice(1)], 0.1, 1.4, D.PER)
const DB_R0 = K.ride('t03br0', [...D3B.trunk, ...D3B.right.slice(1)], 1.7, 3.0, D.PER)
const pc = (t: number) => `${((t / DB.PER) * 100).toFixed(2)}%`
const kickAt = (t: number) => `animation: s21a-kick ${DB.PER}s ${EASE} infinite; animation-delay: -${(DB.PER - t).toFixed(2)}s;`
const DB_CSS = `
@keyframes s21a-filenew { 0%, ${pc(0.3)} { opacity: 1 } ${pc(0.5)}, ${pc(1.6)} { opacity: 0 } ${pc(1.75)}, 100% { opacity: 1 } }
.s21a-filenew { animation: s21a-filenew ${DB.PER}s linear infinite; }
@keyframes s21a-envnew { 0%, ${pc(3.9)} { opacity: 0 } ${pc(4.05)}, ${pc(5.6)} { opacity: 1 } ${pc(5.9)}, 100% { opacity: 0 } }
.s21a-envnew { animation: s21a-envnew ${DB.PER}s linear infinite; }
@keyframes s21a-frozen { 0%, ${pc(3.9)} { opacity: 1; transform: scale(1) } ${pc(4.1)}, ${pc(5.6)} { opacity: 0; transform: scale(0.6) } ${pc(5.9)}, 100% { opacity: 1; transform: scale(1) } }
.s21a-frozen { animation: s21a-frozen ${DB.PER}s ${EASE} infinite; }
@keyframes s21a-kick { 0%, 100% { transform: scale(1) } 4% { transform: scale(1.22) } 9% { transform: scale(1) } }
.s21a-change { ${kickAt(0.35)} }
.s21a-sync { ${kickAt(1.55)} }
.s21a-restart { ${kickAt(3.05)} }
.cc-still .s21a-envnew, .cc-still .s21a-filenew, .cc-still .s21a-frozen, .cc-still .s21a-restart, .cc-still .s21a-change, .cc-still .s21a-sync { animation: none !important; }
`

const A_T03B: Fig = (p) => {
  const { hot, s, done } = useBuild({ ...p, steps: p.steps ?? 2 }, (DB.PER / 2) * 1000)
  const g = D3B
  const loop = (c: string) => (done ? c : undefined)
  return (
    <Frame w={D.W} h={DB.H}>
      <SourceCard />
      <Disc x={D.SR - 6} y={D.SB - 4} icon="docfix" on={s(1)} cls={loop('s21a-change')} loop="beat" size={28} />
      <W pts={g.trunk} head={0} />
      <Junction x={(D.SX + D.SR) / 2} y={D.J} />
      <W pts={g.left} head={9} lit={hot === 0} />
      <W pts={g.right} head={9} lit={hot === 1} />
      <SidePanel x={D.LX} g={g} lit={hot === 0}
        head={<><span style={{ position: 'relative', display: 'grid' }}><Plinth size={36}><Ico3D name="container" size={28} loop="bob" t={3} /></Plinth></span><span style={heading(16)}>Container</span></>}
        inner={{ icon: 'list', label: 'Env Vars' }}
        rows={KEYS.map((k, i) => <Row key={k} x={12} y={42 + i * 30} w={D.IW - 24} h={25} icon="key" label={k} d={i * 0.5} bar={<ValueBar w={40} cls={loop('s21a-envnew')} />} />)}
        corner={<>
          <Disc x={D.LX + D.IN + D.IW - 4} y={g.iy + 4} icon="lock" on={s(1)} cls={loop('s21a-frozen')} loop="beat" size={28} />
          <Disc x={D.LX + D.IN + 36} y={g.hy - 18} icon="power" on={s(1)} cls={loop('s21a-restart')} loop="pulse" size={24} />
        </>} />
      <SidePanel x={D.RX} g={g} lit={hot === 1}
        head={<><MarkTile src={volMark} size={36} /><span style={heading(16)}>Volume Mount</span></>}
        inner={{ icon: I('folder'), label: 'Directory' }}
        rows={KEYS.map((k, i) => <Row key={k} x={12} y={42 + i * 30} w={D.IW - 24} h={25} icon="doc" label={k} d={i * 0.5 + 0.3} bar={<ValueBar w={40} fresh={s(2)} cls={loop('s21a-filenew')} />} />)}
        corner={<Disc x={D.RX + D.IN + D.IW - 4} y={g.iy + 4} icon="refresh" on={s(2)} cls={loop('s21a-sync')} loop="spin" t={4} size={28} />} />
      {/* point 4: the kubelet syncs the mounted files */}
      <Node x={DB_KX} y={DB_KY} mark={kubeletMark} size={34} label="Kubelet" side on={s(2)} lit={hot === 1} z={8} />
      <Rider cls={DB_RL} icon="key" size={22} on={done} />
      <Rider cls={DB_RR} icon="key" size={22} on={done} />
      <Rider cls={DB_L0} icon="key" size={22} on={!done} />
      <Rider cls={DB_R0} icon="key" size={22} on={!done} />
    </Frame>
  )
}

/* ================================================================== slides 13-14 · A_T04 / A_T04B · Secrets Manager bridge */

/*
 * 546 x 360 (slide 14: 546 x 274, the same coordinates without the other namespace, centred in its 320 box). Secrets Manager (72, 96) and Parameter Store (72, 226) join at (146, 160) into the
 * CSI Driver (186, 160), which mounts into the Volume (451, 160) inside the Pod panel (x 396..506) inside a Namespace
 * (x 240..526). Slide 13 press 1: rotation (clock) and audit (log) on the Secrets Manager tile; press 2: the
 * SecretProviderClass (318, 196) in the namespace, and a pod in another namespace (y 270..340) refused by it (dashed,
 * orange cross). Slide 14 press 1: rotation on, the CSI Driver's poll clock, the mounted file refreshed, the pod running.
 */
const E = { W: 546, SMX: 72, SMY: 96, PSY: 226, TS: 48, J: 146, CX: 186, Y: 160, NX: 240, NR: 526, PX: 396, PR: 506, VX: 451, VS: 44, SPX: 318, SPY: 196, SPS: 36, PER: 4 }
const E_SM: Pt[] = [[E.SMX + E.TS / 2, E.SMY], [E.J, E.SMY], [E.J, E.Y], [E.CX - E.TS / 2, E.Y]]
const E_PS: Pt[] = [[E.SMX + E.TS / 2, E.PSY], [E.J, E.PSY], [E.J, E.Y]]
const E_MNT: Pt[] = [[E.CX + E.TS / 2, E.Y], [E.VX - E.VS / 2, E.Y]]
const E_BX = 384 // the refused path's vertical
const E_BY = 305 // the other namespace's row
const E_BAD: Pt[] = [[E.SPX + E.SPS / 2, E.SPY], [E_BX, E.SPY], [E_BX, E_BY], [E.VX - 16, E_BY]]
const E_XX = 414 // the orange cross, before the other pod
/* a secret from each store reaches the driver, then rides on into the volume (hidden while it crosses the driver) */
const E_R1 = K.ride('t04a', E_SM, 0.1, 1.0, E.PER)
const E_R1M = K.ride('t04am', E_MNT, 1.2, 2.0, E.PER)
const E_R2 = K.ride('t04b', [...E_PS, [E.CX - E.TS / 2, E.Y]], 2.0, 2.8, E.PER)
const E_R2M = K.ride('t04bm2', E_MNT, 3.0, 3.8, E.PER)
const E_RB = K.ride('t04x', [[E.SPX + E.SPS / 2, E.SPY], [E_BX, E.SPY], [E_BX, E_BY], [E_XX - 16, E_BY]], 0.6, 1.9, E.PER, 0.5)

/** the shared part of slides 13 and 14: AWS sources, CSI Driver, the namespace with its Pod and Volume, the SPC */
function EksFlow({ nsB, lit, spcOn, podLit = false, riders = true, children }: { nsB: number; lit: (k: string) => boolean; spcOn: boolean; podLit?: boolean; riders?: boolean; children?: ReactNode }) {
  return (
    <>
      <Panel x={E.NX} y={20} w={E.NR - E.NX} h={nsB - 20} lit={lit('ns')} />
      <Node x={E.NX + 34} y={52} mark={nsMark} size={30} label="Namespace" side tagSize={13} />
      <Panel x={E.PX} y={40} w={E.PR - E.PX} h={194} lit={podLit} />
      <Node x={E.VX} y={78} mark={podMark} size={36} label="Pod" />
      <W pts={E_SM} head={9} lit={lit('sm')} />
      <W pts={E_PS} head={0} lit={lit('sm')} />
      <Junction x={E.J} y={E.Y} lit={lit('sm')} />
      <W pts={E_MNT} head={9} />
      <Node x={E.SMX} y={E.SMY} mark={smMark} size={E.TS} label="Secrets Manager" lit={lit('sm')} />
      <Node x={E.SMX} y={E.PSY} mark={psMark} size={E.TS} label="Parameter Store" />
      <Node x={E.CX} y={E.Y} icon="pipe" size={E.TS} label="CSI Driver" loop="pulse" t={2.8} />
      <Node x={E.VX} y={E.Y} mark={volMark} size={E.VS} label="Volume" />
      <Node x={E.SPX} y={E.SPY} icon="code" size={E.SPS} label="SecretProviderClass" tagSize={13} w={140} on={spcOn} lit={lit('ns')} />
      <Rider cls={E_R1} icon="key" size={22} on={riders} />
      <Rider cls={E_R1M} icon="key" size={22} on={riders} />
      <Rider cls={E_R2} icon="key" size={22} on={riders} />
      <Rider cls={E_R2M} icon="key" size={22} on={riders} />
      {children}
    </>
  )
}

const A_T04: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 2 }, 2200)
  const lit = (k: string) => (k === 'sm' ? hot === 0 : hot === 1)
  return (
    <Frame w={E.W} h={360}>
      <EksFlow nsB={254} lit={lit} spcOn={s(2)}>
        {/* point 1: rotation and audit logging, outside the cluster */}
        <Disc x={E.SMX - E.TS / 2} y={E.SMY - E.TS / 2} icon="clock" on={s(1)} loop="pulse" size={28} />
        <Disc x={E.SMX + E.TS / 2} y={E.SMY - E.TS / 2} icon="log" on={s(1)} loop="bob" d={0.5} size={28} />
        {/* point 2: a pod in another namespace cannot use this namespace's SecretProviderClass */}
        <Panel x={E.NX} y={270} w={E.NR - E.NX} h={70} on={s(2)} lit={hot === 1} />
        <Node x={E.NX + 34} y={E_BY} mark={nsMark} size={30} label="Namespace" side tagSize={13} on={s(2)} />
        <Node x={E.VX} y={E_BY} mark={podMark} size={30} label="Pod" side on={s(2)} dim />
        <W pts={E_BAD} head={8} on={s(2)} dash="5 6" width={2} opacity={0.5} color="#7FA0EA" />
        <Disc x={E_XX} y={E_BY} cross on={s(2)} size={24} />
        <Token cls={E_RB} on={s(2)} size={8} tone="#7FA0EA" />
      </EksFlow>
    </Frame>
  )
}

/* slide 14: rotation on, the poll clock on the CSI Driver refreshes the mounted file, the pod keeps running */
const EB = { PER: 4.8 }
const EB_R1 = K.ride('t04bs', E_SM, 0.3, 1.3, EB.PER)
const EB_R2 = K.ride('t04bm', E_MNT, 1.9, 2.9, EB.PER)
const EB_RP = K.ride('t04bp', [...E_PS, [E.CX - E.TS / 2, E.Y]], 3.3, 4.2, EB.PER)
/* beat phases for Ico3D `beat` (peak at 70% of the period): d = 0.7 * PER - when */
const beatAt = (when: number) => ((0.7 * EB.PER - when + EB.PER) % EB.PER)

const A_T04B: Fig = (p) => {
  const { hot, s, done } = useBuild({ ...p, steps: p.steps ?? 1 }, 2400)
  const on = s(1)
  return (
    <Frame w={E.W} h={274}>
      <EksFlow nsB={254} lit={() => false} spcOn podLit={on && hot === 0} riders={!(on && done)}>
        <Disc x={E.SMX - E.TS / 2} y={E.SMY - E.TS / 2} icon="clock" loop={on ? 'beat' : 'pulse'} t={on ? EB.PER : 2.4} d={on ? beatAt(0.1) : 0} size={28} />
        <Disc x={E.SMX + E.TS / 2} y={E.SMY - E.TS / 2} icon="log" loop="bob" d={0.5} size={28} />
        {/* point 3: rotation on, a poll clock on the driver, the mounted file refreshed, no pod restart */}
        <Disc x={E.CX + E.TS / 2} y={E.Y - E.TS / 2} icon="stopwatch" on={on} loop="beat" t={EB.PER} d={beatAt(1.5)} size={28} />
        <Disc x={E.VX + E.VS / 2} y={E.Y - E.VS / 2} icon="refresh" on={on} loop="beat" t={EB.PER} d={beatAt(3.0)} size={28} />
        <Disc x={E.VX + 18} y={78 - 18} icon="heartbeat" on={on} loop="pulse" t={1.2} size={26} />
        <Rider cls={EB_R1} icon="key" size={22} on={on && done} />
        <Rider cls={EB_R2} icon="key" size={22} on={on && done} />
        <Token cls={EB_RP} size={8} on={on && done} />
      </EksFlow>
    </Frame>
  )
}

export const figures: Record<string, Fig> = { A_T01, A_T01B, A_T02B, A_T03, A_T03B, A_T04, A_T04B }
export const css = K.css() + DB_CSS
