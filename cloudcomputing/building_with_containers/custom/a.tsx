import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Badge, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, Frame, Show, Plinth, MarkTile, Panel, Wire, keyframes, tag, useHeld, useHot, type Pt } from '@/engine/figkit'
import dockerMark from '../images/tech-docker.svg'
import ubuntuMark from '../images/tech-ubuntu.png'
import debianMark from '../images/tech-debian.svg'
import alpineMark from '../images/tech-alpinelinux.svg'
import pythonMark from '../images/tech-python.svg'
import nodeMark from '../images/tech-nodejs.svg'

/*
 * SESSION 19 · SECTION 1 (Writing a Dockerfile) technical figures, builder A.
 * Built to generate-slides standing corrections 13-18 and cloud course R7-R15: glossy 3D icons on plinth tiles,
 * official marks on white tiles (the marks never move), >= 20 px equal padding, orthogonal wires computed from the same
 * constants as the boxes, a flow dot on every live wire, the lit item walking after the build (starting on the LAST
 * item). Loops are transform / opacity on HTML elements only. Held (?still): the full final state, nothing lit,
 * nothing moving. Class prefix `s19a-`.
 *
 *   slide 6  A_T01   546 x 380  Dockerfile panel -> docker build (Docker mark, turning gear) -> Image panel: the base
 *                               layer arrives with the FROM line (1); the other instruction lines and their layers (2);
 *                               the build-context folder feeding the build from below (3)
 *   slide 7  A_T02   566 x 380  four base-image cards with size bars shrinking left to right (ubuntu, python:slim,
 *                               alpine, scratch: the TR's own size tiers of Slide 11): Ubuntu lit with the Debian mark
 *                               and its bar full of pre-installed tools (1); Alpine lit, one minimal shell (2)
 *   slide 8  A_T02B  566 x 380  the same cards: Python lit with the Node.js mark, a version tag and its runtime (1);
 *                               the empty scratch base, one self-contained package dropping in (2)
 *   slide 11 A_T04   526 x 380  project folder -> Docker daemon (build context tray): every file rides across while
 *                               the build waits (1); .dockerignore filters .git and node_modules out (2)
 *   slide 12 A_T04B  526 x 380  the same drawing: a file outside the context is refused at the project's border (1); the trailing
 *                               dot of `docker build .` sets the context root (2)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('s19a')
const BLUE = colors.brand
const MONO = "'JetBrains Mono', ui-monospace, monospace"
const LIT = `inset 0 0 0 2.5px ${ORANGE}, 0 10px 22px -12px rgba(255,138,61,0.7)`

const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })

/** the build: the step, the lit item, held. The walk after the build starts on the LAST item (S18 fix). */
function useBuild(p: Record<string, unknown>, period = 1700) {
  const cnt = Number(p.steps ?? 1)
  const raw0 = Number(p.step ?? 0)
  const held = useHeld()
  const step = held ? cnt : raw0
  const raw = useHot(cnt, raw0, period)
  const hot = raw >= 0 && raw0 >= cnt ? (raw + cnt - 1) % cnt : raw
  return { step, hot, held, s: (n: number) => step >= n, done: !held && raw0 >= cnt }
}

/* ------------------------------------------------------------------ pieces */

/** a wire on its own layer (z 2), under the tiles (z 3) */
const W = (props: Parameters<typeof Wire>[0]) => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}><Wire {...props} /></div>
)

/** an icon or mark tile centred on (x, y), its tag under it (or beside it) */
function Node({ x, y, label, icon, mark, size = 52, k = 0.74, on = true, lit = false, loop = 'bob', d = 0, t, badge, w = 130, tagSize = 14, mono = false, side, dim = false, delay = 0, children }: { x: number; y: number; label?: string; icon?: Ico3DName; mark?: string; size?: number; k?: number; on?: boolean; lit?: boolean; loop?: Loop; d?: number; t?: number; badge?: Badge; w?: number; tagSize?: number; mono?: boolean; side?: 'right'; dim?: boolean; delay?: number; children?: ReactNode }) {
  const instant = useInstant()
  const tile = mark ? <MarkTile src={mark} size={size} lit={lit} /> : <Plinth size={size} lit={lit}><Ico3D name={icon ?? 'doc'} size={Math.round(size * k)} loop={loop} d={d} t={t} badge={badge} /></Plinth>
  const tg = label ? <span style={{ ...tag(tagSize), ...(mono ? { fontFamily: MONO, fontWeight: 600, fontVariantLigatures: 'none' } : {}), opacity: dim ? 0.45 : 1, transition: instant ? 'none' : `opacity 520ms ${EASE}` }}>{label}</span> : null
  const inner = (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{ display: 'grid', placeItems: 'center', width: size, height: size, opacity: dim ? 0.4 : 1, filter: dim ? 'grayscale(0.85)' : undefined, transition: instant ? 'none' : `opacity 520ms ${EASE}, filter 520ms ${EASE}` }}>{tile}</div>
      {children}
    </div>
  )
  if (side) {
    return (
      <Show on={on} delay={delay} style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, height: size, zIndex: 3, display: 'flex', alignItems: 'center', gap: 10 }}>
        {inner}
        {tg}
      </Show>
    )
  }
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, width: w, top: y - size / 2, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      {inner}
      {tg}
    </Show>
  )
}

/** the engine's 3D cross turned to the template's orange (blocked = orange, never red) */
const OrangeCross = ({ size }: { size: number }) => (
  <span style={{ display: 'grid', filter: 'hue-rotate(28deg) saturate(1.15) brightness(1.06)' }}>
    <Ico3D name="cross" size={size} loop="none" />
  </span>
)

/** a small white disc holding a 3D icon or a mark, centred on (x, y) */
function Disc({ x, y, on = true, size = 28, icon = 'check', mark, loop = 'pulse', d = 0, t = 2.4, cross = false, z = 6 }: { x: number; y: number; on?: boolean; size?: number; icon?: Ico3DName; mark?: string; loop?: Loop; d?: number; t?: number; cross?: boolean; z?: number }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: z, opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}` }}>
      <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6' }}>
        {cross ? <OrangeCross size={size - 4} /> : mark ? <img src={mark} alt="" draggable={false} style={{ width: size * 0.66, height: size * 0.66, objectFit: 'contain' }} /> : <Ico3D name={icon} size={size - 6} loop={loop} d={d} t={t} />}
      </span>
    </span>
  )
}

/** a white disc carrying a mini 3D icon along a `ride` class (placed from the frame's 0,0); nothing on held frames */
function Rider({ cls, icon, size = 26, on = true }: { cls: string; icon: Ico3DName; size?: number; on?: boolean }) {
  const held = useHeld()
  if (held || !on) return null
  return (
    <span aria-hidden style={{ position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, zIndex: 7, pointerEvents: 'none' }}>
      <span className={cls} style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -4px rgba(31,64,140,0.55)', opacity: 0 }}>
        <Ico3D name={icon} size={size - 7} loop="none" />
      </span>
    </span>
  )
}

/** a panel header: a small 3D icon and its tag, top-left of a panel */
const Header = ({ icon, label, d = 0 }: { icon: Ico3DName; label: string; d?: number }) => (
  <div style={{ position: 'absolute', left: 20, right: 20, top: 16, height: 30, display: 'flex', alignItems: 'center', gap: 8 }}>
    <Ico3D name={icon} size={28} loop="bob" d={d} t={3.2} />
    <span style={tag(15)}>{label}</span>
  </div>
)

/* ================================================================== 6 · A_T01 · Dockerfile -> build -> image */

const T1 = { W: 546, H: 380, PY: 56, PH: 248, PW: 170, DX: 20, IX: 356, BX: 273, BY: 180, BS: 64, FY: 330, FS: 52 }
const T1_LINES = ['FROM', 'WORKDIR', 'COPY', 'RUN', 'EXPOSE', 'CMD']
const T1_SLABS = [198, 160, 122, 84] // rel tops, base first
const T1_W1: Pt[] = [[T1.DX + T1.PW, T1.BY], [T1.BX - T1.BS / 2, T1.BY]]
const T1_W2: Pt[] = [[T1.BX + T1.BS / 2, T1.BY], [T1.IX, T1.BY]]
const T1_W3: Pt[] = [[T1.BX, T1.FY - T1.FS / 2], [T1.BX, T1.BY + T1.BS / 2]]
const T1_RIDE = K.ride('t1doc', [[T1.DX + T1.PW - 4, T1.BY], [T1.IX + 4, T1.BY]], 0.3, 2.4, 3.6)
const T1_RIDE2 = K.ride('t1ctx', [[T1.BX, T1.FY - T1.FS / 2 - 2], [T1.BX, T1.BY + T1.BS / 2 + 4]], 1.8, 3.0, 3.6)

const A_T01: Fig = (p) => {
  const { hot, s } = useBuild(p)
  const instant = useInstant()
  return (
    <Frame w={T1.W} h={T1.H}>
      {/* the Dockerfile */}
      <Panel x={T1.DX} y={T1.PY} w={T1.PW} h={T1.PH} lit={hot === 1}>
        <Header icon="doc" label="Dockerfile" />
        {T1_LINES.map((ln, i) => {
          const on = i === 0 ? s(1) : s(2)
          const lit = i === 0 ? hot === 0 : hot === 1
          return (
            <div key={ln} style={{ ...box(14, 64 + i * 28, T1.PW - 28, 24), borderRadius: 6, display: 'flex', alignItems: 'center', paddingLeft: 10, boxSizing: 'border-box', background: lit ? '#DCE7FF' : 'transparent', opacity: on ? 1 : 0, transform: on ? 'none' : 'translateX(-6px)', transition: instant ? 'none' : `opacity 420ms ${EASE} ${on && i > 0 ? (i - 1) * 120 : 0}ms, transform 520ms ${EASE} ${on && i > 0 ? (i - 1) * 120 : 0}ms, background 420ms ${EASE}` }}>
              <span style={{ fontFamily: MONO, fontVariantLigatures: 'none', fontSize: 14, fontWeight: 600, color: colors.brandDeep }}>{ln}</span>
            </div>
          )
        })}
      </Panel>
      {/* docker build */}
      <div style={{ ...box(T1.BX - 70, T1.BY - T1.BS / 2 - 30, 140, 20), zIndex: 3, display: 'grid', placeItems: 'center' }}>
        <span style={{ ...tag(14), fontFamily: MONO, fontVariantLigatures: 'none' }}>docker build</span>
      </div>
      <div style={{ ...box(T1.BX - T1.BS / 2, T1.BY - T1.BS / 2, T1.BS, T1.BS), zIndex: 3 }}>
        <MarkTile src={dockerMark} size={T1.BS} lit={false} />
      </div>
      <Disc x={T1.BX + T1.BS / 2 - 2} y={T1.BY + T1.BS / 2 - 2} icon="gear" loop="spin" t={4} size={30} />
      <W pts={T1_W1} head={9} on={s(1)} />
      <W pts={T1_W2} head={9} on={s(1)} delay={200} />
      {/* the image: layers stack up, the base first */}
      <Panel x={T1.IX} y={T1.PY} w={T1.PW} h={T1.PH}>
        <Header icon="image" label="Image" d={0.6} />
        {T1_SLABS.map((top, i) => {
          const on = i === 0 ? s(1) : s(2)
          const lit = i === 0 && hot === 0
          return (
            <div key={i} style={{ ...box(20, top, T1.PW - 40, 30), borderRadius: 9, background: i === 0 ? 'linear-gradient(180deg, #4C7DFF 0%, #2147C8 100%)' : 'linear-gradient(180deg, #F4F8FF 0%, #D8E4FF 100%)', boxShadow: lit ? LIT : i === 0 ? '0 8px 16px -10px rgba(33,71,200,0.8)' : 'inset 0 0 0 1.5px #BFD0F6, 0 6px 12px -10px rgba(31,64,140,0.6)', display: 'grid', placeItems: 'center', opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(-14px)', transition: instant ? 'none' : `opacity 420ms ${EASE} ${on && i > 0 ? (i - 1) * 160 + 200 : 0}ms, transform 520ms ${EASE} ${on && i > 0 ? (i - 1) * 160 + 200 : 0}ms, box-shadow 420ms ${EASE}` }}>
              {i === 0 && <Ico3D name="layers" size={22} loop="none" />}
            </div>
          )
        })}
      </Panel>
      {/* the build context, feeding the build from below */}
      <W pts={T1_W3} head={9} on={s(3)} lit={hot === 2} />
      <Node x={T1.BX} y={T1.FY} size={T1.FS} icon="folder" label="Build Context" side="right" on={s(3)} lit={hot === 2} loop="bob" d={0.4} />
      <Rider cls={T1_RIDE} icon="doc" on={s(2)} />
      <Rider cls={T1_RIDE2} icon="code" size={24} on={s(3)} />
    </Frame>
  )
}

/* ================================================================== 7, 8 · A_T02 / A_T02B · four base images */

/* Order: ubuntu, python:slim, alpine, scratch, so the bars truly shrink left to right (the TR's own size tiers on
   Slide 11: Large, Medium, Small, Minimal); the Visual Guidance lists alpine before python:slim. */
const T2 = { W: 566, H: 380, CW: 118, GAP: 12, Y: 30, CH: 320, TS: 64 }
const T2_X0 = (T2.W - (4 * T2.CW + 3 * T2.GAP)) / 2
const T2_BAR_MAX = 172
const T2_CARDS = [
  { key: 'ubuntu', label: 'ubuntu', mark: ubuntuMark, bar: 1 },
  { key: 'python', label: 'python:slim', mark: pythonMark, bar: 0.78 },
  { key: 'alpine', label: 'alpine', mark: alpineMark, bar: 0.36 },
  { key: 'scratch', label: 'scratch', bar: 0 },
] as const
const T2_TOOLS: Ico3DName[] = ['terminal', 'code', 'gear', 'wrench']

function BaseImages({ p, part }: { p: Record<string, unknown>; part: 'a' | 'b' }) {
  const { hot, s, held } = useBuild(p)
  const instant = useInstant()
  const a = part === 'a'
  /* what each step shows, per frame (the B frame starts from the A frame's final state) */
  const debian = a ? s(1) : true
  const tools = a ? s(1) : true
  const shell = a ? s(2) : true
  const runtime = !a && s(1)
  const pkg = !a && s(2)
  const litKey = a ? (hot === 0 ? 'ubuntu' : hot === 1 ? 'alpine' : '') : hot === 0 ? 'python' : hot === 1 ? 'scratch' : ''
  return (
    <Frame w={T2.W} h={T2.H}>
      {T2_CARDS.map((c, i) => {
        const x = T2_X0 + i * (T2.CW + T2.GAP)
        const cx = T2.CW / 2
        const bh = c.key === 'scratch' ? 14 : Math.round(T2_BAR_MAX * c.bar)
        const barTop = 300 - bh
        return (
          <Panel key={c.key} x={x} y={T2.Y} w={T2.CW} h={T2.CH} lit={litKey === c.key}>
            {/* the image's tile */}
            <div style={box(cx - T2.TS / 2, 20, T2.TS, T2.TS)}>
              {'mark' in c ? <MarkTile src={c.mark} size={T2.TS} /> : <Plinth size={T2.TS}><Ico3D name="cube" size={46} loop="float" d={0.9} t={3.4} /></Plinth>}
            </div>
            <div style={{ ...box(0, 94, T2.CW, 18), display: 'grid', placeItems: 'center' }}>
              <span style={{ ...tag(14), fontFamily: MONO, fontVariantLigatures: 'none' }}>{c.label}</span>
            </div>
            {/* the size bar, from the card's floor */}
            {c.key === 'scratch' ? (
              <div style={{ ...box(cx - 27, barTop, 54, bh), borderRadius: 6, border: '1.6px dashed #9DB4E6', boxSizing: 'border-box' }} />
            ) : (
              <div className={held ? undefined : `s19a-bar s19a-bar${i}`} style={{ ...box(cx - 27, barTop, 54, bh), borderRadius: 10, background: 'linear-gradient(180deg, #6E97FF 0%, #2D63FB 100%)', boxShadow: '0 8px 16px -10px rgba(45,99,251,0.9)', transformOrigin: '50% 100%' }} />
            )}
            {/* Ubuntu: many pre-installed tools inside its bar */}
            {c.key === 'ubuntu' && T2_TOOLS.map((t, k) => (
              <div key={t} style={{ ...box(cx - 15, barTop + 12 + k * 40, 30, 30), display: 'grid', placeItems: 'center', borderRadius: 9, background: '#FFFFFF', boxShadow: '0 4px 10px -6px rgba(0,37,75,0.7)', opacity: tools ? 1 : 0, transform: tools ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE} ${tools ? k * 110 : 0}ms, transform 520ms ${EASE} ${tools ? k * 110 : 0}ms`, zIndex: 2 }}>
                <Ico3D name={t} size={22} loop="bob" d={k * 0.4} t={3} />
              </div>
            ))}
            {/* Python: its runtime pre-installed inside its bar */}
            {c.key === 'python' && (['code', 'package'] as Ico3DName[]).map((t, k) => (
              <div key={t} style={{ ...box(cx - 15, barTop + 14 + k * 42, 30, 30), display: 'grid', placeItems: 'center', borderRadius: 9, background: '#FFFFFF', boxShadow: '0 4px 10px -6px rgba(0,37,75,0.7)', opacity: runtime ? 1 : 0, transform: runtime ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE} ${runtime ? k * 110 : 0}ms, transform 520ms ${EASE} ${runtime ? k * 110 : 0}ms`, zIndex: 2 }}>
                <Ico3D name={t} size={22} loop="bob" d={k * 0.5} t={3} />
              </div>
            ))}
            {/* Alpine: one minimal shell */}
            {c.key === 'alpine' && (
              <div style={{ ...box(cx - 15, barTop + 16, 30, 30), display: 'grid', placeItems: 'center', borderRadius: 9, background: '#FFFFFF', boxShadow: '0 4px 10px -6px rgba(0,37,75,0.7)', opacity: shell ? 1 : 0, transform: shell ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}`, zIndex: 2 }}>
                <Ico3D name="terminal" size={22} loop="bob" t={3} />
              </div>
            )}
            {/* scratch: one self-contained package drops onto the empty base */}
            {c.key === 'scratch' && (
              <div style={{ ...box(cx - 22, barTop - 50, 44, 44), display: 'grid', placeItems: 'center', opacity: pkg ? 1 : 0, transform: pkg ? 'none' : 'translateY(-60px)', transition: instant ? 'none' : `opacity 380ms ${EASE}, transform 760ms cubic-bezier(0.3,0,0.2,1)`, zIndex: 2 }}>
                <Plinth size={44}><Ico3D name="package" size={32} loop="bob" t={3.2} /></Plinth>
              </div>
            )}
          </Panel>
        )
      })}
      {/* the marks' companions: Debian beside Ubuntu, Node.js and a version tag beside Python */}
      <Disc x={T2_X0 + T2.CW / 2 + T2.TS / 2} y={T2.Y + 12 + T2.TS} mark={debianMark} size={30} on={debian} />
      <Disc x={T2_X0 + (T2.CW + T2.GAP) + T2.CW / 2 + T2.TS / 2} y={T2.Y + 12 + T2.TS} mark={nodeMark} size={30} on={runtime} />
      <Disc x={T2_X0 + (T2.CW + T2.GAP) + T2.CW / 2 - T2.TS / 2} y={T2.Y + 12 + T2.TS} icon="tag" size={30} on={runtime} loop="swing" />
    </Frame>
  )
}
const A_T02: Fig = (p) => <BaseImages p={p} part="a" />
const A_T02B: Fig = (p) => <BaseImages p={p} part="b" />

/* ================================================================== 11, 12 · A_T04 / A_T04B · the build context */

const T4 = { W: 526, H: 380, PX: 20, PW: 220, PH: 240, DX: 356, DW: 150, DH: 200, FS: 44, FL: 44 }
const T4_FILES: { icon: Ico3DName; label: string; mono: boolean; out: boolean }[] = [
  { icon: 'code', label: 'Code', mono: false, out: false },
  { icon: 'doc', label: 'Dockerfile', mono: false, out: false },
  { icon: 'branch', label: '.git', mono: true, out: true },
  { icon: 'package', label: 'node_modules', mono: true, out: true },
]
const T4_FX = [82, 178]
const T4_FY = [92, 172] // rel to the panel top
const T4_MID = T4.DX - (T4.DX - (T4.PX + T4.PW)) / 2 // 283, the filter
const t4Rides = (top: number) => {
  const y = top + 120
  const full: Pt[] = [[T4.PX + T4.PW + 2, y], [T4.DX + 6, y]]
  const stop: Pt[] = [[T4.PX + T4.PW + 2, y], [T4_MID - T4.FL / 2 - 4, y]]
  return {
    all: T4_FILES.map((f, i) => K.ride(`t4all${top}-${i}`, full, 0.2 + i * 1.0, 1.1 + i * 1.0, 4.4)),
    some: T4_FILES.map((f, i) => K.ride(`t4some${top}-${i}`, f.out ? stop : full, 0.2 + i * 1.0, (f.out ? 0.75 : 1.1) + i * 1.0, 4.4, f.out ? 0.4 : 0.7)),
  }
}
const T4_R = { 70: t4Rides(70), 20: t4Rides(20) } as Record<number, ReturnType<typeof t4Rides>>

function Context({ p, part }: { p: Record<string, unknown>; part: 'a' | 'b' }) {
  const { hot, s } = useBuild(p)
  const instant = useInstant()
  const a = part === 'a'
  const top = a ? 70 : 20
  const ay = top + 120
  const filter = a ? s(2) : true
  const outside = !a && s(1)
  const root = !a && s(2)
  const R = T4_R[top]
  const arrived = T4_FILES.map((f) => !filter || !f.out)
  const shownIdx = T4_FILES.map((_, i) => i).filter((i) => arrived[i])
  const trayW = 110
  return (
    <Frame w={T4.W} h={T4.H}>
      {/* the project folder: the build context's boundary */}
      <Panel x={T4.PX} y={top} w={T4.PW} h={T4.PH} lit={!a && hot === 1}>
        <Header icon="folder" label="Project" />
      </Panel>
      {T4_FILES.map((f, i) => (
        <Node key={f.label} x={T4_FX[i % 2]} y={top + T4_FY[Math.floor(i / 2)]} size={T4.FS} icon={f.icon} label={f.label} mono={f.mono} w={100} tagSize={12} dim={filter && f.out} loop="bob" d={i * 0.35} t={3.2} />
      ))}
      {/* the arrow into the daemon, and the .dockerignore filter on it */}
      <W pts={[[T4.PX + T4.PW, ay], [T4.DX, ay]]} head={9} />
      <div style={{ ...box(T4_MID - T4.FL / 2, ay - T4.FL / 2, T4.FL, T4.FL), zIndex: 4, opacity: filter ? 1 : 0, transform: filter ? 'none' : 'translateY(-26px)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 620ms ${EASE}` }}>
        <Plinth size={T4.FL} lit={a && hot === 1}><Ico3D name="filter" size={32} loop="tilt" t={3} /></Plinth>
      </div>
      <div style={{ ...box(T4_MID - 70, ay + T4.FL / 2 + 6, 140, 18), zIndex: 4, display: 'grid', placeItems: 'center', opacity: filter ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE}` }}>
        <span style={{ ...tag(12), fontFamily: MONO, fontVariantLigatures: 'none' }}>.dockerignore</span>
      </div>
      {/* the Docker daemon, its build-context tray */}
      <Panel x={T4.DX} y={top + 20} w={T4.DW} h={T4.DH} lit={a && hot === 0}>
        <div style={box(T4.DW / 2 - 26, 18, 52, 52)}><MarkTile src={dockerMark} size={52} /></div>
        <div style={{ ...box(0, 78, T4.DW, 18), display: 'grid', placeItems: 'center' }}><span style={tag(14)}>Docker Daemon</span></div>
        <div style={{ ...box(20, 106, trayW, 44), borderRadius: 12, background: 'linear-gradient(180deg, #EAF0FF 0%, #F7F9FF 100%)', boxShadow: 'inset 0 0 0 1.5px #CBD8F5' }}>
          {T4_FILES.map((f, i) => {
            const k = shownIdx.indexOf(i)
            const n = shownIdx.length
            const on = (a ? s(1) : true) && arrived[i]
            const left = (trayW - (n * 22 + (n - 1) * 6)) / 2 + Math.max(0, k) * 28
            return (
              <span key={f.label} style={{ position: 'absolute', top: 11, left, width: 22, height: 22, opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE}, left 520ms ${EASE}` }}>
                <Ico3D name={f.icon} size={22} loop="bob" d={i * 0.3} t={3} />
              </span>
            )
          })}
        </div>
        <div style={{ ...box(0, 162, T4.DW, 18), display: 'grid', placeItems: 'center' }}><span style={tag(14)}>Build Context</span></div>
      </Panel>
      {/* slow without the filter, quick with it */}
      {a && <Disc x={T4.DX + T4.DW - 6} y={top + 26} icon="hourglass" loop="spin" t={3.2} size={32} on={s(1) && !s(2)} />}
      <Disc x={T4.DX + T4.DW - 6} y={top + 26} icon="check" size={32} on={filter} d={0.3} />
      {/* files riding across: all of them first, then only the ones the filter lets through */}
      {T4_FILES.map((f, i) => <Rider key={`a${i}`} cls={R.all[i]} icon={f.icon} size={26} on={a && s(1) && !s(2)} />)}
      {T4_FILES.map((f, i) => <Rider key={`s${i}`} cls={R.some[i]} icon={f.icon} size={26} on={filter} />)}

      {!a && (
        <>
          {/* COPY path error: a file outside the context is refused at the project's border (up, then left to its edge) */}
          <W pts={[[T4_MID, 300], [T4_MID, top + T4.PH - 14], [T4.PX + T4.PW, top + T4.PH - 14]]} head={0} dash="4 6" width={2.2} color="#9DB4E6" on={outside} opacity={outside ? 1 : 0} />
          <Disc x={T4_MID} y={top + T4.PH + 8} cross size={30} on={outside} z={6} />
          <Node x={T4_MID} y={314} size={T4.FS} icon="doc" badge="alert" label="Outside File" w={120} tagSize={13} on={outside} lit={hot === 0} loop="tilt" t={2.4} />
          {/* the context root: the trailing dot of the build command */}
          <W pts={[[130, 282], [130, top + T4.PH + 1]]} head={8} on={root} lit={hot === 1} />
          <Show on={root} style={{ ...box(T4.PX + 10, 282, 200, 48), zIndex: 3 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 12, background: 'linear-gradient(180deg, #0F2F5C 0%, #0A2447 100%)', boxShadow: hot === 1 ? LIT : '0 10px 20px -12px rgba(0,37,75,0.8)', display: 'flex', alignItems: 'center', paddingLeft: 16, gap: 8, transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
              <span style={{ fontFamily: MONO, fontVariantLigatures: 'none', fontSize: 15, fontWeight: 600, color: '#FFFFFF', whiteSpace: 'nowrap' }}>docker build</span>
              <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: '#FFFFFF', width: 22, height: 26, borderRadius: 6, display: 'grid', placeItems: 'center', background: BLUE }}>.</span>
            </div>
          </Show>
          <Disc x={T4.PX + 10 + 200 - 26} y={306} icon="target" size={32} on={root} loop="pulse" z={7} />
        </>
      )}
    </Frame>
  )
}
const A_T04: Fig = (p) => <Context p={p} part="a" />
const A_T04B: Fig = (p) => <Context p={p} part="b" />

/* ------------------------------------------------------------------ css */

const LOCAL_CSS = `
${[0, 1, 2].map((i) => `@keyframes s19a-bar${i} { 0%, 100% { transform: scaleY(1) } 50% { transform: scaleY(${(0.94 - i * 0.02).toFixed(2)}) } }\n.s19a-bar${i} { animation: s19a-bar${i} ${(3 + i * 0.4).toFixed(1)}s cubic-bezier(0.45,0,0.55,1) infinite; animation-delay: ${(-i * 0.6).toFixed(1)}s; }`).join('\n')}
.cc-still .s19a-bar, .deck-thumb .s19a-bar { animation: none !important; transform: none !important; }
@media (prefers-reduced-motion: reduce) { .s19a-bar { animation: none !important; } }
`

export const figures: Record<string, Fig> = { A_T01, A_T02, A_T02B, A_T04, A_T04B }
export const css = K.css() + LOCAL_CSS
