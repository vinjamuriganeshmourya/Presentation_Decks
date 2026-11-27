import { type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Badge, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, Frame, Show, Plinth, MarkTile, Wire, Junction, Token, keyframes, tag, useHeld, useHot, type Pt } from '@/engine/figkit'
import ecrMark from '../images/aws-ecr.svg'
import ubuntuMark from '../images/tech-ubuntu.png'
import debianMark from '../images/tech-debian.svg'
import alpineMark from '../images/tech-alpinelinux.svg'
import pythonMark from '../images/tech-python.svg'

/*
 * SESSION 19 · SECTION 3 (Image Optimization) technical figures, builder C.
 * Built to generate-slides standing corrections 13-18 and cloud course R7-R15: glossy 3D icons on plinth tiles, official
 * marks on white tiles (the marks never move), >= 20 px equal padding, orthogonal wires computed from the same constants
 * as the boxes, a flow dot on every live wire, the lit item walking last -> first -> ... after the build. Loops are
 * transform / opacity on HTML elements only. Held (?still): the full final picture, nothing lit, nothing moving.
 * Class prefix `s19c-`.
 *
 *   slide 21 C_T08   566 x 380  a bulky image (app + many packages) over three levers joined by a bus into it:
 *                               minimal base (1), multi-stage, the toolchain gear dropping off (2), the attack-surface
 *                               shield, bug badges dropping off (3); the image shrinks a notch at every press
 *   slide 22 C_T09   526 x 380  four base boxes shrinking: Full OS (Ubuntu), Slim (Debian), Alpine, Distroless; the
 *                               full OS's shell, editor and compiler greyed as unused (1); Alpine with musl libc and
 *                               busybox (2)
 *   slide 23 C_T09B  526 x 380  the same boxes: distroless without shell and package manager (1); the trade-off scale,
 *                               size against debugging, an alert on Alpine (2)
 *   slide 27 C_T11  1000 x 340  bar chart of relative sizes, one row per press: python:3.12, python:3.12-slim,
 *                               alpine:3.22, distroless, each with its size tier and a shrinking row of bug badges
 *   slide 29 C_T12   566 x 380  an ECR scan report: the scan flags CVEs in both images (1); the minimal image with few
 *                               findings (2); a cluster of three nodes pulling, the small image fast, the large slow (3)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('s19c')
const BLUE = colors.brand
const MONO = "'JetBrains Mono', ui-monospace, monospace"
const RIM = 'inset 0 0 0 1.5px #D3DEF6, 0 12px 24px -16px rgba(31,64,140,0.34)'
const LIT = `inset 0 0 0 2.5px ${ORANGE}, 0 10px 22px -12px rgba(255,138,61,0.7)`
const CARD_BG = 'linear-gradient(180deg, #FFFFFF 0%, #F3F7FF 100%)'

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)
const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })

/** the build: the step, the lit item, held. The walk after the build starts on the LAST item (S18 fix). */
function useBuild(p: Record<string, unknown>, period = 2000) {
  const cnt = Number(p.steps ?? 1)
  const held = useHeld()
  const step = held ? cnt : stepOf(p)
  const raw = useHot(cnt, stepOf(p), period)
  const hot = raw >= 0 && stepOf(p) >= cnt ? (raw + cnt - 1) % cnt : raw
  return { step, hot, held, s: (n: number) => step >= n }
}

/* ------------------------------------------------------------------ pieces */

/** a 3D icon (or a mark) on its plinth with its tag under it; the TILE is centred on (x, y) */
function Node({ x, y, label, icon, mark, size = 52, k = 0.74, on = true, lit = false, loop = 'bob', d = 0, t, badge, w = 130, tagSize = 14, mono = false, dim = false, delay = 0, z = 3, children }: { x: number; y: number; label?: string; icon?: Ico3DName; mark?: string; size?: number; k?: number; on?: boolean; lit?: boolean; loop?: Loop; d?: number; t?: number; badge?: Badge; w?: number; tagSize?: number; mono?: boolean; dim?: boolean; delay?: number; z?: number; children?: ReactNode }) {
  const instant = useInstant()
  const tile = mark ? <MarkTile src={mark} size={size} lit={lit} /> : (
    <Plinth size={size} lit={lit}><Ico3D name={icon ?? 'doc'} size={Math.round(size * k)} loop={loop} d={d} t={t} badge={badge} /></Plinth>
  )
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, width: w, top: y - size / 2, zIndex: z, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size, display: 'grid', placeItems: 'center' }}>
        <div style={{ display: 'grid', placeItems: 'center', opacity: dim ? 0.5 : 1, filter: dim ? 'saturate(0.35)' : undefined, transition: instant ? 'none' : `opacity 520ms ${EASE}` }}>{tile}</div>
        {children}
      </div>
      {label && <span style={{ ...tag(tagSize), marginTop: 6, ...(mono ? { fontFamily: MONO, fontVariantLigatures: 'none', fontWeight: 500 } : {}) }}>{label}</span>}
    </Show>
  )
}

/** a small white disc holding a 3D icon, centred on (x, y); `drop` makes it fall away in a loop (nothing on held frames) */
function Disc({ x, y, on = true, size = 26, icon = 'check', loop = 'pulse', d = 0, t = 2.4, cross = false, drop, z = 9 }: { x: number; y: number; on?: boolean; size?: number; icon?: Ico3DName; loop?: Loop; d?: number; t?: number; cross?: boolean; drop?: number; z?: number }) {
  const instant = useInstant()
  const held = useHeld()
  if (drop !== undefined && held) return null
  return (
    <span style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: z, opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}` }}>
      <span className={drop !== undefined && on ? 's19c-drop' : undefined} style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6', animationDelay: drop !== undefined ? `${-drop}s` : undefined }}>
        {cross ? <OrangeCross size={size - 4} /> : <Ico3D name={icon} size={size - 6} loop={drop !== undefined ? 'none' : loop} d={d} t={t} />}
      </span>
    </span>
  )
}

/** the engine's 3D cross turned to the template's orange (blocked = orange, never red) */
const OrangeCross = ({ size }: { size: number }) => (
  <span style={{ display: 'grid', filter: 'hue-rotate(28deg) saturate(1.15) brightness(1.06)' }}>
    <Ico3D name="cross" size={size} loop="none" />
  </span>
)

/** a white disc carrying a mini 3D icon along a `ride` class; nothing on held frames */
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

/** a wire on its own layer (z 2), under the tiles (z 3) */
const W = (props: Parameters<typeof Wire>[0]) => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}><Wire {...props} /></div>
)

/** a white card at (x, y, w, h) that rings while lit; its children are placed in the frame's coordinates */
function Card({ x, y, w, h, lit = false, on = true, radius = 18 }: { x: number; y: number; w: number; h: number; lit?: boolean; on?: boolean; radius?: number }) {
  const instant = useInstant()
  return (
    <div style={{ ...box(x, y, w, h), zIndex: 1, borderRadius: radius, background: CARD_BG, boxShadow: lit ? LIT : RIM, opacity: on ? 1 : 0, transition: instant ? 'none' : `box-shadow 420ms ${EASE}, opacity 520ms ${EASE}, left 620ms ${EASE}, width 620ms ${EASE}` }} />
  )
}

/** a plain DOM tag centred on (x, y) */
const Tag = ({ x, y, text, w = 160, size = 14, on = true, mono = false, color }: { x: number; y: number; text: string; w?: number; size?: number; on?: boolean; mono?: boolean; color?: string }) => (
  <Show on={on} style={{ ...box(x - w / 2, y - size * 0.6, w, size * 1.2), zIndex: 4, display: 'grid', placeItems: 'center' }}>
    <span style={{ ...tag(size, color), ...(mono ? { fontFamily: MONO, fontVariantLigatures: 'none', fontWeight: 500 } : {}) }}>{text}</span>
  </Show>
)

/* ================================================================== slide 21 · C_T08 · three levers */

/*
 * 566 x 380. The image card is centred at x 283, y 20..180; its width steps 360 -> 280 -> 200 -> 120 with the presses
 * (8, 6, 4, then 2 columns of slots). Slots: 2 rows (y 96, 138) x 8 columns (x 283 +- 20, 60, 100, 140), tiles 34; the
 * two centre columns hold the app (code) and three packages that stay, the outer columns the packages trimmed away.
 * Header: image icon + Image at y 52. Levers at y 292 (tiles 60): Minimal Base (103), Multi-Stage (283), Attack Surface
 * (463), tags under. Bus: lever 1 and 3 rise to y 222 and meet at the junction (283, 222); lever 2 rises straight into
 * the image's bottom edge (y 180).
 */
const L8 = { W: 566, H: 380, CX: 283, TOP: 20, CH: 160, ROW: [96, 138], SL: 34, LY: 292, LS: 60, BUS: 222, PER: 3.2 }
const L8_W = [360, 280, 200, 120]
const L8_X = [103, 283, 463]
const L8_COLS = [-140, -100, -60, -20, 20, 60, 100, 140]
const L8_SLOTS = L8_COLS.flatMap((dx) => L8.ROW.map((y, r) => ({ dx, y, icon: (dx === -20 && r === 0 ? 'code' : 'package') as Ico3DName })))
const L8_BOT = L8.TOP + L8.CH
const L8_WIRES: Pt[][] = [
  [[L8_X[0], L8.LY - L8.LS / 2], [L8_X[0], L8.BUS], [L8.CX, L8.BUS]],
  [[L8.CX, L8.LY - L8.LS / 2], [L8.CX, L8.BUS]],
  [[L8_X[2], L8.LY - L8.LS / 2], [L8_X[2], L8.BUS], [L8.CX, L8.BUS]],
]
/* the trunk from the junction into the image's bottom edge, lit whichever lever is being explained */
const L8_TRUNK: Pt[] = [[L8.CX, L8.BUS], [L8.CX, L8_BOT]]
const L8_RIDE = [
  K.ride('t08a', [...L8_WIRES[0], [L8.CX, L8_BOT + 4]], 0.1, 1.5, L8.PER),
  K.ride('t08b', [...L8_WIRES[1], [L8.CX, L8_BOT + 4]], 1.2, 2.0, L8.PER),
  K.ride('t08c', [...L8_WIRES[2], [L8.CX, L8_BOT + 4]], 1.7, 3.1, L8.PER),
]
const L8_LEVER: { label: string; icon: Ico3DName; loop: Loop }[] = [
  { label: 'Minimal Base', icon: 'cube', loop: 'bob' },
  { label: 'Multi-Stage', icon: 'layers', loop: 'float' },
  { label: 'Attack Surface', icon: 'shield', loop: 'pulse' },
]

const C_T08: Fig = (p) => {
  const { step, hot, s } = useBuild({ ...p, steps: p.steps ?? 3 }, 2200)
  const instant = useInstant()
  const w = L8_W[Math.min(step, 3)]
  const half = w / 2
  return (
    <Frame w={L8.W} h={L8.H}>
      {/* the image, trimmed a notch per press */}
      <Card x={L8.CX - half} y={L8.TOP} w={w} h={L8.CH} />
      <div style={{ ...box(L8.CX - 60, L8.TOP + 20, 120, 28), zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Ico3D name="image" size={26} loop="bob" t={3.2} />
        <span style={tag(15)}>Image</span>
      </div>
      {L8_SLOTS.map((sl, i) => {
        const vis = Math.abs(sl.dx) + L8.SL / 2 <= half - 20
        return (
          <div key={i} style={{ ...box(L8.CX + sl.dx - L8.SL / 2, sl.y - L8.SL / 2, L8.SL, L8.SL), zIndex: 3, opacity: vis ? 1 : 0, transform: vis ? 'scale(1)' : 'scale(0.55)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}` }}>
            <Plinth size={L8.SL}><Ico3D name={sl.icon} size={24} loop="bob" d={i * 0.23} t={3} /></Plinth>
          </div>
        )
      })}
      {/* the bus from the three levers into the image */}
      {L8_WIRES.map((pts, i) => <W key={i} pts={pts} head={0} on={s(i + 1)} lit={hot === i} />)}
      <W pts={L8_TRUNK} head={9} on={s(1)} lit={hot >= 0} />
      <Junction x={L8.CX} y={L8.BUS} on={s(1)} lit={hot >= 0} />
      {L8_RIDE.map((c, i) => <Token key={i} cls={c} size={9} on={s(i + 1)} />)}
      {/* the three levers */}
      {L8_LEVER.map((lv, i) => (
        <Node key={lv.label} x={L8_X[i]} y={L8.LY} icon={lv.icon} size={L8.LS} label={lv.label} on={s(i + 1)} lit={hot === i} loop={lv.loop} d={i * 0.4} t={3}>
          {i === 1 && <Disc x={L8.LS - 6} y={4} icon="gear" size={26} on={s(2)} drop={0} />}
          {i === 2 && <Disc x={2} y={6} icon="bug" size={24} on={s(3)} drop={0.4} />}
          {i === 2 && <Disc x={L8.LS - 2} y={10} icon="bug" size={24} on={s(3)} drop={1.5} />}
        </Node>
      ))}
    </Frame>
  )
}

/* ================================================================== slides 22-23 · minimal base images */

/*
 * 526 x 380. Four base-image boxes on one baseline (y 214), shrinking left to right: Full OS 130 x 170 (Ubuntu),
 * Slim 112 x 136 (Debian), Alpine 96 x 108 (Alpine Linux), Distroless 84 x 84 (cube: no mark exists); each box holds its
 * mark on a white tile, name above the box, size tier under the baseline. Below (tiles at y 300, tags under):
 *   slide 22: Shell / Editor / Compiler greyed under the Full OS box (1); musl libc / busybox under Alpine (2)
 *   slide 23: Package Manager / Shell with a ban disc under Distroless (1); Size (cube) - scale - Debugging (terminal,
 *             orange cross) on the left, an alert disc on the Alpine box (2)
 */
const MB = { W: 526, H: 380, BASE: 214, TY: 300, TS: 46 }
const MB_BOX: { name: string; tier: string; mark?: string; icon?: Ico3DName; x: number; w: number; h: number; tile: number }[] = [
  { name: 'Full OS', tier: 'Large', mark: ubuntuMark, x: 20, w: 130, h: 170, tile: 56 },
  { name: 'Slim', tier: 'Medium', mark: debianMark, x: 171, w: 112, h: 136, tile: 52 },
  { name: 'Alpine', tier: 'Small', mark: alpineMark, x: 304, w: 96, h: 108, tile: 48 },
  { name: 'Distroless', tier: 'Minimal', icon: 'cube', x: 422, w: 84, h: 84, tile: 44 },
]
const mbCx = (i: number) => MB_BOX[i].x + MB_BOX[i].w / 2

function BaseBoxes({ lit = [], alert = false }: { lit?: number[]; alert?: boolean }) {
  return (
    <>
      {MB_BOX.map((b, i) => {
        const top = MB.BASE - b.h
        const cx = mbCx(i)
        return (
          <div key={b.name}>
            <Card x={b.x} y={top} w={b.w} h={b.h} lit={lit.includes(i)} radius={16} />
            <div style={{ ...box(b.x, top, b.w, b.h), zIndex: 3, display: 'grid', placeItems: 'center' }}>
              {b.mark ? <MarkTile src={b.mark} size={b.tile} /> : <Plinth size={b.tile}><Ico3D name={b.icon ?? 'cube'} size={Math.round(b.tile * 0.74)} loop="bob" t={3.4} /></Plinth>}
            </div>
            <Tag x={cx} y={top - 16} text={b.name} w={b.w + 20} size={14} />
            <Tag x={cx} y={MB.BASE + 16} text={b.tier} w={b.w + 20} size={13} color="#5B6B8C" />
            {i === 2 && <Disc x={b.x + b.w - 4} y={top + 4} icon="alert" size={28} on={alert} loop="pulse" />}
          </div>
        )
      })}
    </>
  )
}

const C_T09: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 2 }, 2200)
  const unused: { x: number; icon: Ico3DName; label: string }[] = [
    { x: 44, icon: 'terminal', label: 'Shell' },
    { x: 110, icon: 'code', label: 'Editor' },
    { x: 176, icon: 'gear', label: 'Compiler' },
  ]
  const alp: { x: number; icon: Ico3DName; label: string }[] = [
    { x: 312, icon: 'chip', label: 'musl libc' },
    { x: 398, icon: 'terminal', label: 'busybox' },
  ]
  return (
    <Frame w={MB.W} h={MB.H}>
      <BaseBoxes lit={hot === 0 ? [0] : hot === 1 ? [2] : []} />
      {/* point 1: what a full distribution carries, unused at runtime (greyed) */}
      {unused.map((u, i) => <Node key={u.label} x={u.x} y={MB.TY} icon={u.icon} size={MB.TS} label={u.label} on={s(1)} lit={hot === 0} dim delay={i * 90} d={i * 0.4} loop="bob" w={70} />)}
      {/* point 2: Alpine's small parts */}
      {alp.map((u, i) => <Node key={u.label} x={u.x} y={MB.TY} icon={u.icon} size={MB.TS} label={u.label} mono on={s(2)} lit={hot === 1} delay={i * 90} d={i * 0.5} loop={i === 0 ? 'pulse' : 'bob'} w={90} />)}
    </Frame>
  )
}

const C_T09B: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 2 }, 2200)
  return (
    <Frame w={MB.W} h={MB.H}>
      <BaseBoxes lit={hot === 0 ? [3] : hot === 1 ? [2] : []} alert={s(2)} />
      {/* point 1: distroless has no shell and no package manager */}
      <Node x={380} y={MB.TY} icon="package" size={MB.TS} label="Package Manager" tagSize={13} on={s(1)} lit={hot === 0} dim w={120}>
        <Disc x={MB.TS - 4} y={4} icon="ban" size={26} loop="pulse" />
      </Node>
      <Node x={470} y={MB.TY} icon="terminal" size={MB.TS} label="Shell" tagSize={13} on={s(1)} lit={hot === 0} dim delay={90} w={70}>
        <Disc x={MB.TS - 4} y={4} icon="ban" size={26} loop="pulse" d={0.6} />
      </Node>
      {/* point 2: the trade-off, a smaller image against debugging with a shell */}
      <Node x={58} y={MB.TY} icon="cube" size={MB.TS} label="Size" tagSize={13} on={s(2)} lit={hot === 1} w={70} />
      <Node x={150} y={MB.TY} icon="scale" size={MB.TS} k={0.8} label="Trade-Off" tagSize={13} on={s(2)} lit={hot === 1} loop="tilt" t={3.2} delay={90} w={90} />
      <Node x={242} y={MB.TY} icon="terminal" size={MB.TS} label="Debugging" tagSize={13} on={s(2)} lit={hot === 1} delay={180} w={90}>
        <Disc x={MB.TS - 4} y={4} size={26} cross />
      </Node>
    </Frame>
  )
}

/* ================================================================== slide 27 · C_T11 · relative sizes */

/*
 * 1000 x 340. Four rows, tile centres y 44 / 128 / 212 / 296 (tiles 48): the mark tile at x 44, the image name in
 * monospace from x 84, the size bar from x 300 (440 / 300 / 170 / 80 long, 24 tall), the size tier 14 px after the bar,
 * a row of bug badges from x 820 (5 / 3 / 2 / 1, pitch 30). One row per press; then the lit row walks.
 */
const SZ = { W: 1000, H: 340, Y: [44, 128, 212, 296], TILE: 48, BX: 300, BH: 24, BUGX: 820 }
const SZ_ROWS: { name: string; tier: string; mark?: string; icon?: Ico3DName; len: number; bugs: number }[] = [
  { name: 'python:3.12', tier: 'Large', mark: pythonMark, len: 440, bugs: 5 },
  { name: 'python:3.12-slim', tier: 'Medium', mark: pythonMark, len: 300, bugs: 3 },
  { name: 'alpine:3.22', tier: 'Small', mark: alpineMark, len: 170, bugs: 2 },
  { name: 'distroless', tier: 'Minimal', icon: 'cube', len: 80, bugs: 1 },
]

const C_T11: Fig = (p) => {
  const { hot, s, held } = useBuild({ ...p, steps: p.steps ?? 4 }, 1800)
  const instant = useInstant()
  return (
    <Frame w={SZ.W} h={SZ.H}>
      {SZ_ROWS.map((r, i) => {
        const y = SZ.Y[i]
        const on = s(i + 1)
        const lit = hot === i
        return (
          <Show key={r.name} on={on} style={{ ...box(0, y - SZ.TILE / 2, SZ.W, SZ.TILE), zIndex: 3 }}>
            <div style={{ ...box(20, 0, SZ.TILE, SZ.TILE), display: 'grid', placeItems: 'center' }}>
              {r.mark ? <MarkTile src={r.mark} size={SZ.TILE} lit={lit} /> : <Plinth size={SZ.TILE} lit={lit}><Ico3D name={r.icon ?? 'cube'} size={36} loop="bob" t={3.2} /></Plinth>}
            </div>
            <div style={{ ...box(84, 0, 200, SZ.TILE), display: 'flex', alignItems: 'center' }}>
              <span style={{ ...tag(17, colors.ink), fontFamily: MONO, fontVariantLigatures: 'none', fontWeight: 500, textAlign: 'left' }}>{r.name}</span>
            </div>
            {/* the bar: grows in on its press (transition), then breathes (a scaleX loop on its own element) */}
            <div style={{ ...box(SZ.BX, (SZ.TILE - SZ.BH) / 2, r.len, SZ.BH), transformOrigin: '0 50%', transform: on ? 'scaleX(1)' : 'scaleX(0.05)', transition: instant ? 'none' : `transform 820ms ${EASE} 120ms` }}>
              <div className={on && !held ? 's19c-bar' : undefined} style={{ position: 'absolute', inset: 0, transformOrigin: '0 50%', borderRadius: 12, background: `linear-gradient(90deg, #8DB0FF 0%, ${BLUE} 100%)`, boxShadow: lit ? `0 0 0 2.5px ${ORANGE}, 0 8px 18px -10px rgba(255,138,61,0.7)` : '0 8px 18px -10px rgba(31,64,140,0.6)', animationDelay: `${-i * 0.5}s`, transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }} />
            </div>
            <div style={{ ...box(SZ.BX + r.len + 14, 0, 110, SZ.TILE), display: 'flex', alignItems: 'center' }}>
              <span style={{ ...tag(15), textAlign: 'left' }}>{r.tier}</span>
            </div>
            {Array.from({ length: r.bugs }, (_, k) => (
              <div key={k} style={{ ...box(SZ.BUGX + k * 30, (SZ.TILE - 28) / 2, 28, 28), display: 'grid', placeItems: 'center', borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6' }}>
                <Ico3D name="bug" size={22} loop="bob" d={k * 0.3 + i * 0.2} t={2.8} />
              </div>
            ))}
          </Show>
        )
      })}
    </Frame>
  )
}

/* ================================================================== slide 29 · C_T12 · ECR scanning */

/*
 * 566 x 380. The scan report card x 20..546, y 20..216: header (ECR mark 40 at x 60, Image Scan tag, the scan tile at
 * x 506), rows at y 116 (Full Image, image icon, 6 bugs, long orange count bar) and y 168 (Minimal Image, layers icon,
 * 1 bug, short bar). A scan line sweeps x 92..526 over the rows after press 1. Press 3: the pull wires from the card's
 * bottom (283, 216) through the download junction (283, 248) to three nodes at y 312 (x 140 / 283 / 426); on each a
 * small image (layers) rides fast and the full image slowly.
 */
const SC = { W: 566, H: 380, X: 20, Y: 20, CW: 526, CH: 196, HY: 60, RA: 116, RB: 168, NY: 312, NS: 48, J: 248, PER: 2.8 }
const SC_BOT = SC.Y + SC.CH
const SC_NX = [140, 283, 426]
const SC_WIRES: Pt[][] = SC_NX.map((x) => (x === 283 ? [[283, SC_BOT], [283, SC.NY - SC.NS / 2]] : [[283, SC_BOT], [283, SC.J], [x, SC.J], [x, SC.NY - SC.NS / 2]]) as Pt[])
const SC_FAST = SC_WIRES.map((pts, i) => K.ride(`t12f${i}`, pts, 0.05 + i * 0.1, 0.85 + i * 0.1, SC.PER))
const SC_SLOW = SC_WIRES.map((pts, i) => K.ride(`t12s${i}`, pts, 0.15 + i * 0.1, 2.45 + i * 0.1, SC.PER))

function ScanRow({ y, icon, label, bugs, bar, lit, on }: { y: number; icon: Ico3DName; label: string; bugs: number; bar: number; lit: boolean; on: boolean }) {
  const instant = useInstant()
  return (
    <>
      <div style={{ ...box(40, y - 20, 40, 40), zIndex: 3 }}>
        <Plinth size={40} lit={lit}><Ico3D name={icon} size={30} loop="bob" t={3.2} /></Plinth>
      </div>
      <div style={{ ...box(92, y - 12, 124, 24), zIndex: 3, display: 'flex', alignItems: 'center' }}>
        <span style={{ ...tag(14), textAlign: 'left' }}>{label}</span>
      </div>
      {Array.from({ length: bugs }, (_, k) => (
        <span key={k} style={{ ...box(222 + k * 30, y - 13, 26, 26), zIndex: 3, display: 'grid', placeItems: 'center', borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6', opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.5)', transition: instant ? 'none' : `opacity 380ms ${EASE} ${on ? 300 + k * 90 : 0}ms, transform 460ms ${EASE} ${on ? 300 + k * 90 : 0}ms` }}>
          <Ico3D name="bug" size={20} loop="bob" d={k * 0.35} t={2.8} />
        </span>
      ))}
      <div style={{ ...box(410, y - 6, bar, 12), zIndex: 3, borderRadius: 99, transformOrigin: '0 50%', background: 'linear-gradient(90deg, #FFC9A0 0%, #FF8A3D 100%)', opacity: on ? 1 : 0, transform: on ? 'scaleX(1)' : 'scaleX(0.1)', transition: instant ? 'none' : `opacity 420ms ${EASE} 500ms, transform 720ms ${EASE} 500ms` }} />
    </>
  )
}

const C_T12: Fig = (p) => {
  const { hot, s, held } = useBuild({ ...p, steps: p.steps ?? 3 }, 2200)
  return (
    <Frame w={SC.W} h={SC.H}>
      <Card x={SC.X} y={SC.Y} w={SC.CW} h={SC.CH} />
      {/* header: the registry and its scan */}
      <div style={{ ...box(40, SC.HY - 20, 40, 40), zIndex: 3 }}><MarkTile src={ecrMark} size={40} lit={hot === 0} /></div>
      <div style={{ ...box(92, SC.HY - 12, 160, 24), zIndex: 3, display: 'flex', alignItems: 'center' }}>
        <span style={{ ...tag(15), textAlign: 'left' }}>Image Scan</span>
      </div>
      <div style={{ ...box(486, SC.HY - 20, 40, 40), zIndex: 3 }}>
        <Plinth size={40} lit={hot === 0}><Ico3D name="scan" size={30} loop="pulse" t={2.8} /></Plinth>
      </div>
      <div style={{ ...box(40, SC.HY + 30, 486, 1.5), zIndex: 2, background: '#DCE5F7' }} />
      <ScanRow y={SC.RA} icon="image" label="Full Image" bugs={6} bar={116} lit={false} on={s(1)} />
      <ScanRow y={SC.RB} icon="layers" label="Minimal Image" bugs={1} bar={22} lit={hot === 1} on={s(1)} />
      {/* the scan line sweeping the rows (transform loop on its own element) */}
      {s(1) && !held && (
        <div aria-hidden style={{ ...box(92, SC.RA - 26, 434, SC.RB - SC.RA + 52), zIndex: 4, pointerEvents: 'none', overflow: 'hidden' }}>
          <span className="s19c-scan" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: 2, background: `linear-gradient(180deg, ${BLUE}00 0%, ${BLUE} 50%, ${BLUE}00 100%)`, boxShadow: `0 0 12px 2px ${BLUE}55` }} />
        </div>
      )}
      {/* point 3: the cluster pulls, the small image fast, the full one slow */}
      {SC_WIRES.map((pts, i) => <W key={i} pts={pts} head={9} on={s(3)} lit={hot === 2} delay={i * 120} />)}
      <Disc x={283} y={SC.J} icon="download" size={30} on={s(3)} loop="bob" z={4} />
      {SC_NX.map((x, i) => <Node key={x} x={x} y={SC.NY} icon="server" size={SC.NS} label="Node" tagSize={13} on={s(3)} lit={hot === 2} loop="pulse" d={i * 0.5} t={2.8} delay={300 + i * 120} w={80} />)}
      {SC_FAST.map((c, i) => <Rider key={`f${i}`} cls={c} icon="layers" size={22} on={s(3)} />)}
      {SC_SLOW.map((c, i) => <Rider key={`s${i}`} cls={c} icon="image" size={22} on={s(3)} />)}
    </Frame>
  )
}

/* ------------------------------------------------------------------ css */

const LOCAL_CSS = `
@keyframes s19c-drop { 0% { opacity: 0; transform: translateY(-6px) } 14%, 58% { opacity: 1; transform: translateY(0) } 80%, 100% { opacity: 0; transform: translateY(18px) } }
.s19c-drop { animation: s19c-drop 3.2s cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes s19c-bar { 0%, 100% { transform: scaleX(1) } 50% { transform: scaleX(0.975) } }
.s19c-bar { animation: s19c-bar 3s cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes s19c-scan { 0% { transform: translateX(0); opacity: 0 } 8% { opacity: 1 } 92% { opacity: 1 } 100% { transform: translateX(431px); opacity: 0 } }
.s19c-scan { animation: s19c-scan 2.6s linear infinite; }
.cc-still .s19c-drop, .deck-thumb .s19c-drop, .cc-still .s19c-bar, .deck-thumb .s19c-bar, .cc-still .s19c-scan, .deck-thumb .s19c-scan { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .s19c-drop, .s19c-bar, .s19c-scan { animation: none !important; } }
`

export const figures: Record<string, Fig> = { C_T08, C_T09, C_T09B, C_T11, C_T12 }
export const css = K.css() + LOCAL_CSS
