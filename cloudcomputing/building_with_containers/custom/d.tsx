import type { CSSProperties, ReactNode } from 'react'
import { colors, fonts } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, Frame, Show, Plinth, MarkTile, Panel, Wire, Token, keyframes, tag, heading, useHeld, useHot, type Pt } from '@/engine/figkit'
import dockerMark from '../images/tech-docker.svg'
import nodeMark from '../images/tech-nodejs.svg'
import nginxMark from '../images/tech-nginx.svg'
import pgMark from '../images/tech-postgresql.svg'

/*
 * SESSION 19 · Building with Containers · builder D: the two code walks and the configuration figures.
 * Built to generate-slides standing corrections 13-18 and cloud course R7-R15: 3D icons on plinth tiles, official marks
 * on white tiles (never moving), >= 20 px equal padding, orthogonal wires computed from the same constants as the
 * boxes, a flow dot on every live wire, the lit item walking after the build (starting on the LAST item). Code is the
 * TR's, verbatim, in Fira Code with ligatures off (rule 40), one DOM block per line, lit lines tinted blue (rule 55).
 * Loops are transform / opacity on HTML elements only. Held (?still): the full final picture, nothing lit, nothing
 * moving. Class prefix `s19d-`.
 *
 *   slide 25 D_T10   586 x 380  the multi-stage Dockerfile (TR lines 1-7): lines 1-4 lit with the Node.js mark (1),
 *                               lines 6-7 lit with the NGINX mark (2); a scan band over the lit block
 *   slide 26 D_T10B  586 x 380  a heavy Build Stage (source, packages, tools, output) and a light Final Stage; the
 *                               COPY --from step (replica) between them: only the output rides across, source and tools
 *                               bounce off with an orange cross (1)
 *   slide 32 D_T13   526 x 400  one container fed by four levers from outside: env vars (1), volume (2), port (3),
 *                               secret (4), a dot riding each wire in turn
 *   slide 33 D_T14   566 x 380  image with its ENV default, the -e flag, the running container's value slot and its
 *                               app: the ENV default fills the slot (1), -e overrides it and the app reads it through
 *                               getenv (2), nothing set and the app falls back to its coded default (3)
 *   slide 48 D_T21   566 x 420  the TR's two-service compose.yaml (lines 1-11): lines 2-7 lit with the depends_on arrow
 *                               to the db block (1), lines 8-11 lit with the PostgreSQL mark and the key (2)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('s19d')
const BLUE = colors.brand
const MONO = fonts.mono
const NOLIG: CSSProperties = { fontVariantLigatures: 'none', fontFeatureSettings: '"liga" 0, "calt" 0' }
const RAIL = '#D3DEF6'
const LIT_BG = '#E3ECFF'
const GREEN = colors.success

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)
const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })
const mono = (size = 14, color: string = colors.ink): CSSProperties => ({ fontFamily: MONO, ...NOLIG, fontSize: size, fontWeight: 600, lineHeight: 1.2, color, whiteSpace: 'nowrap' })

/** the build: the step, the lit item, held. The walk after the build starts on the LAST item (S18 fix). */
function useBuild(p: Record<string, unknown>, period: number) {
  const cnt = Number(p.steps ?? 1)
  const held = useHeld()
  const step = held ? cnt : stepOf(p)
  const raw = useHot(cnt, stepOf(p), period)
  const hot = raw >= 0 && stepOf(p) >= cnt ? (raw + cnt - 1) % cnt : raw
  return { step, hot, held, s: (n: number) => step >= n, done: !held && stepOf(p) >= cnt }
}

/** a 3D icon (or an official mark) on its plinth; the TILE is centred on (x, y); its tag under it (or to the right) */
function Node({ x, y, label, icon, mark, size = 52, k = 0.74, on = true, lit = false, loop = 'bob', d = 0, t, w = 120, side = false, tagMono = false, dim = false, delay = 0, z = 3 }: { x: number; y: number; label?: string; icon?: Ico3DName; mark?: string; size?: number; k?: number; on?: boolean; lit?: boolean; loop?: Loop; d?: number; t?: number; w?: number; side?: boolean; tagMono?: boolean; dim?: boolean; delay?: number; z?: number }) {
  const instant = useInstant()
  const tile = mark ? <MarkTile src={mark} size={size} lit={lit} /> : (
    <Plinth size={size} lit={lit}>
      <Ico3D name={icon ?? 'doc'} size={Math.round(size * k)} loop={dim ? 'none' : loop} d={d} t={t} />
    </Plinth>
  )
  const inner = <div style={{ width: size, height: size, flexShrink: 0, display: 'grid', placeItems: 'center', opacity: dim ? 0.45 : 1, transition: instant ? 'none' : `opacity 520ms ${EASE}` }}>{tile}</div>
  const lab = label ? <span style={tagMono ? mono(14, colors.brandDeep) : tag(14)}>{label}</span> : null
  if (side) {
    return (
      <Show on={on} delay={delay} style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, height: size, zIndex: z, display: 'flex', alignItems: 'center', gap: 10 }}>
        {inner}
        {lab}
      </Show>
    )
  }
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, width: w, top: y - size / 2, zIndex: z, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      {inner}
      {lab}
    </Show>
  )
}

/** a small 3D icon riding a `ride` class (an HTML span, transform / opacity only); nothing on held frames */
function Rider({ cls, icon, size = 26, on = true }: { cls: string; icon: Ico3DName; size?: number; on?: boolean }) {
  const held = useHeld()
  if (held || !on) return null
  return (
    <span aria-hidden style={{ position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, zIndex: 6, pointerEvents: 'none' }}>
      <span className={cls} style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 9, background: '#FFFFFF', boxShadow: '0 0 0 1.5px #D3DEF6, 0 6px 12px -6px rgba(31,64,140,0.6)', opacity: 0 }}>
        <Ico3D name={icon} size={Math.round(size * 0.78)} loop="none" />
      </span>
    </span>
  )
}

/** an orange cross disc (a refused path, rule 51) */
const Cross = ({ size = 24 }: { size?: number }) => (
  <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: `inset 0 0 0 2px ${ORANGE}, 0 4px 10px -4px rgba(255,138,61,0.8)` }}>
    <svg viewBox="0 0 20 20" width={size * 0.55} height={size * 0.55} aria-hidden><path d="M5 5 L15 15 M15 5 L5 15" stroke={ORANGE} strokeWidth={3} strokeLinecap="round" /></svg>
  </span>
)

/* ------------------------------------------------------------------ the code panel (T10, T21) */

/** scan-band keyframes per travel distance (a soft band moving down over the lit block, transform only) */
const SCAN: Record<number, string> = {}
function scanCls(dist: number) {
  const d = Math.round(dist)
  if (!SCAN[d]) SCAN[d] = `@keyframes s19d-scan${d} { 0% { transform: translateY(0); opacity: 0 } 12% { opacity: 1 } 88% { opacity: 1 } 100% { transform: translateY(${d}px); opacity: 0 } }\n.s19d-scan${d} { animation: s19d-scan${d} 2.4s ease-in-out infinite; }`
  return `s19d-scan${d}`
}

type Tok = { t: string; c?: string; b?: boolean }
type CodeSpec = { x: number; y: number; w: number; h: number; top: number; fs: number; lh: number; gutter: number; lines: Tok[][]; blocks: { from: number; to: number }[] }

/** a code panel: title row, hairline, numbered lines (each one DOM block); block i tinted while `lit === i` */
function Code({ c, title, lit, held }: { c: CodeSpecW; title: ReactNode; lit: number; held: boolean }) {
  const instant = useInstant()
  const tx = c.x + 20
  const tw = c.w - 40
  return (
    <>
      <Panel x={c.x} y={c.y} w={c.w} h={c.h} radius={16} />
      <div style={{ ...box(tx, c.y + 18, tw, 36), zIndex: 3, display: 'flex', alignItems: 'center', gap: 10 }}>{title}</div>
      <span aria-hidden style={{ ...box(tx, c.top - 12, tw, 1.5), zIndex: 3, background: RAIL, borderRadius: 1 }} />
      {/* the lit block's tint and its scan band, under the text */}
      {c.blocks.map((b, i) => {
        const on = lit === i
        const y = c.top + (b.from - 1) * c.lh
        const h = (b.to - b.from + 1) * c.lh
        return (
          <div key={i} aria-hidden style={{ ...box(tx - 8, y, c.textW + c.gutter + 16, h), zIndex: 2, borderRadius: 8, overflow: 'hidden', background: on ? LIT_BG : 'rgba(227,236,255,0)', boxShadow: on ? `inset 0 0 0 1.5px ${BLUE}55` : 'inset 0 0 0 1.5px rgba(45,99,251,0)', transition: instant ? 'none' : `background 420ms ${EASE}, box-shadow 420ms ${EASE}` }}>
            {on && !held && <span className={scanCls(h - 14)} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 14, background: `linear-gradient(180deg, ${BLUE}00, ${BLUE}26, ${BLUE}00)`, opacity: 0 }} />}
          </div>
        )
      })}
      <div style={{ ...box(tx, c.top, c.textW + c.gutter, c.lines.length * c.lh), zIndex: 3 }}>
        {c.lines.map((l, i) => (
          <div key={i} style={{ height: c.lh, display: 'flex', alignItems: 'center', fontFamily: MONO, ...NOLIG, fontSize: c.fs, whiteSpace: 'pre' }}>
            <span style={{ width: c.gutter, flexShrink: 0, color: colors.muted, fontWeight: 500, fontSize: c.fs - 1 }}>{i + 1}</span>
            <span>{l.map((tk, j) => <span key={j} style={{ color: tk.c ?? colors.ink, fontWeight: tk.b ? 700 : 500 }}>{tk.t}</span>)}</span>
          </div>
        ))}
      </div>
    </>
  )
}
// textW is computed per panel from the longest line (Fira Code advance 0.6 em)
type CodeSpecW = CodeSpec & { textW: number }
const withW = (c: CodeSpec): CodeSpecW => ({ ...c, textW: Math.ceil(Math.max(...c.lines.map((l) => l.reduce((a, t) => a + t.t.length, 0))) * c.fs * 0.6) })

/** a vertical bracket beside a lit block, from the block's top to its bottom */
function Bracket({ x, y, h, on }: { x: number; y: number; h: number; on: boolean }) {
  const instant = useInstant()
  return (
    <span aria-hidden style={{ ...box(x + 2, y + 4, 8, h - 8), zIndex: 3, borderRight: `2.5px solid ${BLUE}`, borderTop: `2.5px solid ${BLUE}`, borderBottom: `2.5px solid ${BLUE}`, borderRadius: '0 8px 8px 0', opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE}` }} />
  )
}

/* ================================================================== slide 25 · D_T10 · the multi-stage Dockerfile */

/*
 * 586 x 380. The panel x 20..566, y 20..360; title row (Docker mark, `Dockerfile`), hairline at y 92, then the seven TR
 * lines (line 5 blank), 14 px Fira Code, 32 px lines from y 104 (to 328). Text 24 px gutter + 49 chars (412 px) from
 * x 40 (to 476). Each lit block has a bracket (x 492..500) and its mark (x 506..546): Node.js beside lines 1-4 (1), NGINX beside
 * lines 6-7 (2).
 */
const KW = (t: string): Tok => ({ t, c: colors.brandDark, b: true })
const TX = (t: string): Tok => ({ t })
const A_CODE = withW({
  x: 20, y: 20, w: 546, h: 340, top: 104, fs: 14, lh: 32, gutter: 24,
  lines: [
    [KW('FROM'), TX(' node:24-alpine '), KW('AS'), TX(' build')],
    [KW('WORKDIR'), TX(' /app')],
    [KW('COPY'), TX(' . .')],
    [KW('RUN'), TX(' npm install && npm run build')],
    [],
    [KW('FROM'), TX(' nginx:alpine')],
    [KW('COPY'), TX(' --from=build /app/dist /usr/share/nginx/html')],
  ],
  blocks: [{ from: 1, to: 4 }, { from: 6, to: 7 }],
})
const A_BX = 500
const A_MX = 526

const D_T10: Fig = (p) => {
  const { hot, s, held } = useBuild({ ...p, steps: p.steps ?? 2 }, 2400)
  const c = A_CODE
  const marks = [nodeMark, nginxMark]
  return (
    <Frame w={586} h={380}>
      <Code c={c} lit={hot} held={held} title={<><MarkTile src={dockerMark} size={36} /><span style={{ ...heading(15), whiteSpace: 'nowrap' }}>Dockerfile</span></>} />
      {c.blocks.map((b, i) => {
        const y = c.top + (b.from - 1) * c.lh
        const h = (b.to - b.from + 1) * c.lh
        return (
          <div key={i}>
            <Bracket x={A_BX - 10} y={y} h={h} on={s(i + 1)} />
            <Show on={s(i + 1)} style={{ ...box(A_MX - 20, y + h / 2 - 20, 40, 40), zIndex: 3 }}>
              <MarkTile src={marks[i]} size={40} lit={hot === i} />
            </Show>
          </div>
        )
      })}
    </Frame>
  )
}

/* ================================================================== slide 26 · D_T10B · build stage → final stage */

/*
 * 586 x 380. Build Stage card x 20..250, y 30..350 (heavy: the Node.js mark and four tiles: Source, Packages, Tools,
 * Output, 2 x 2 at x 85 / 185, y 150 / 262). Final Stage card x 386..566, y 150..350 (light: the NGINX mark and one
 * Output tile at (476, 280)). Between them on y 262 the COPY --from step: the replica tile at (318, 262), wires from the
 * build card's edge into it and from it to the final card's edge. The press draws the copy (1). Loop (4.8 s): a tools
 * chip and then a source chip ride to the copy step and bounce back under an orange cross; then the output chip rides
 * through into the final stage.
 */
const B = { W: 586, H: 380, BX: 20, BY: 30, BW: 230, BH: 320, FX: 386, FY: 150, FW: 180, FH: 200, CY: 262, RX: 318, RT: 52, PER: 4.8 }
const B_W1: Pt[] = [[B.BX + B.BW, B.CY], [B.RX - B.RT / 2, B.CY]]
const B_W2: Pt[] = [[B.RX + B.RT / 2, B.CY], [B.FX, B.CY]]
const B_OUT = K.ride('t10b-out', [[185, B.CY], [B.FX + 30, B.CY], [B.FX + 30, 280], [476 - 40, 280]], 3.0, 4.3, B.PER, 0.8)
const bounceCss = (name: string, x0: number, x1: number, t0: number, t1: number) => {
  const P = (t: number) => `${((t / B.PER) * 100).toFixed(2)}%`
  const mid = (t0 + t1) / 2
  return `@keyframes s19d-${name} { 0%, ${P(t0)} { transform: translate(${x0}px, ${B.CY}px) scale(0.7); opacity: 0 } ${P(t0 + 0.12)} { opacity: 1 } ${P(mid)} { transform: translate(${x1}px, ${B.CY}px) scale(1); opacity: 1 } ${P(mid + 0.18)} { transform: translate(${x1 - 14}px, ${B.CY}px) scale(1); opacity: 1 } ${P(t1)} { transform: translate(${x0 + 30}px, ${B.CY}px) scale(0.8); opacity: 0 } 100% { transform: translate(${x0 + 30}px, ${B.CY}px) scale(0.8); opacity: 0 } }
.s19d-${name} { animation: s19d-${name} ${B.PER}s ease-in-out infinite; }`
}
const crossCss = (name: string, t0: number, t1: number) => {
  const P = (t: number) => `${((t / B.PER) * 100).toFixed(2)}%`
  return `@keyframes s19d-${name} { 0%, ${P(t0)} { opacity: 0; transform: scale(0.6) } ${P(t0 + 0.15)} { opacity: 1; transform: scale(1.1) } ${P(t0 + 0.3)}, ${P(t1)} { opacity: 1; transform: scale(1) } ${P(t1 + 0.2)}, 100% { opacity: 0; transform: scale(0.8) } }
.s19d-${name} { animation: s19d-${name} ${B.PER}s ease-out infinite; }`
}
const B_HIT = B.RX - B.RT / 2 - 16
const B_CSS = [bounceCss('t10b-tool', 200, B_HIT, 0.1, 1.5), bounceCss('t10b-src', 200, B_HIT, 1.5, 2.9), crossCss('t10b-x1', 0.75, 1.2), crossCss('t10b-x2', 2.15, 2.6)].join('\n')

function Bouncer({ cls, icon }: { cls: string; icon: Ico3DName }) {
  const held = useHeld()
  if (held) return null
  return (
    <span aria-hidden style={{ position: 'absolute', left: -13, top: -13, width: 26, height: 26, zIndex: 6, pointerEvents: 'none' }}>
      <span className={cls} style={{ display: 'grid', placeItems: 'center', width: 26, height: 26, borderRadius: 9, background: '#FFFFFF', boxShadow: '0 0 0 1.5px #D3DEF6, 0 6px 12px -6px rgba(31,64,140,0.6)', opacity: 0 }}>
        <Ico3D name={icon} size={20} loop="none" />
      </span>
    </span>
  )
}

const D_T10B: Fig = (p) => {
  const { hot, s, held, done } = useBuild({ ...p, steps: p.steps ?? 1 }, 2400)
  const lit = hot === 0
  const live = done || (!held && s(1))
  const cardTitle = (mark: string, t: string) => (
    <div style={{ position: 'absolute', left: 20, right: 20, top: 20, height: 40, display: 'flex', alignItems: 'center', gap: 10 }}>
      <MarkTile src={mark} size={40} />
      <span style={{ ...heading(16), whiteSpace: 'nowrap' }}>{t}</span>
    </div>
  )
  return (
    <Frame w={B.W} h={B.H}>
      <Panel x={B.BX} y={B.BY} w={B.BW} h={B.BH} radius={18}>{cardTitle(nodeMark, 'Build Stage')}</Panel>
      <Node x={85} y={150} icon="code" label="Source" loop="bob" />
      <Node x={185} y={150} icon="package" label="Packages" loop="float" d={0.4} />
      <Node x={85} y={262} icon="gear" label="Tools" loop="spin" t={9} />
      <Node x={185} y={262} icon="folder" label="Output" loop="bob" d={0.8} />

      <Panel x={B.FX} y={B.FY} w={B.FW} h={B.FH} radius={18}>{cardTitle(nginxMark, 'Final Stage')}</Panel>
      <Node x={476} y={280} icon="folder" label="Output" loop="bob" d={0.2} on={s(1)} delay={500} />

      <Wire pts={B_W1} on={s(1)} head={0} />
      <Wire pts={B_W2} on={s(1)} head={10} delay={300} />
      <Node x={B.RX} y={B.CY} icon="replica" label="COPY --from" tagMono size={B.RT} lit={lit} on={s(1)} loop="pulse" />

      {live && (
        <>
          <Bouncer cls="s19d-t10b-tool" icon="gear" />
          <Bouncer cls="s19d-t10b-src" icon="code" />
          <span aria-hidden className="s19d-t10b-x1" style={{ ...box(B.RX - 12, B.CY - 52 - 12, 24, 24), zIndex: 7, opacity: 0 }}><Cross /></span>
          <span aria-hidden className="s19d-t10b-x2" style={{ ...box(B.RX - 12, B.CY - 52 - 12, 24, 24), zIndex: 7, opacity: 0 }}><Cross /></span>
          <Rider cls={B_OUT} icon="folder" />
        </>
      )}
    </Frame>
  )
}

/* ================================================================== slide 32 · D_T13 · four configuration levers */

/*
 * 526 x 400. The container card x 188..338, y 125..275 (the container icon and its tag). Four lever tiles outside it, each with its tag: env vars (70, 80), volume (70, 320), port (456, 80), secret
 * (456, 320). Each wire leaves the tile's inner edge, runs level, then turns into the card's top or bottom edge
 * (x 225 or 301). Press n brings lever n and its wire; after the build a dot rides each wire in turn (4.8 s).
 */
const C = { W: 526, H: 400, CX: 188, CY: 125, CW: 150, CH: 150, TS: 52, PER: 4.8 }
const C_LEV: { x: number; y: number; icon: Ico3DName; label: string; loop: Loop; wire: Pt[] }[] = [
  { x: 70, y: 80, icon: 'toggle', label: 'Env Vars', loop: 'pulse', wire: [[96, 80], [225, 80], [225, C.CY]] },
  { x: 70, y: 320, icon: 'database', label: 'Volume', loop: 'bob', wire: [[96, 320], [225, 320], [225, C.CY + C.CH]] },
  { x: 456, y: 80, icon: 'router', label: 'Port', loop: 'float', wire: [[430, 80], [301, 80], [301, C.CY]] },
  { x: 456, y: 320, icon: 'key', label: 'Secret', loop: 'swing', wire: [[430, 320], [301, 320], [301, C.CY + C.CH]] },
]
const C_RIDE = C_LEV.map((l, i) => {
  const pts = l.wire
  const [a, b] = pts.slice(-2)
  const back: Pt = [b[0], b[1] + (b[1] > a[1] ? -8 : 8)]
  return K.ride(`t13-${i}`, [...pts.slice(0, -1), back], i * 1.2 + 0.05, i * 1.2 + 1.05, C.PER)
})

const D_T13: Fig = (p) => {
  const { hot, s, done } = useBuild({ ...p, steps: p.steps ?? 4 }, 1800)
  return (
    <Frame w={C.W} h={C.H}>
      <Panel x={C.CX} y={C.CY} w={C.CW} h={C.CH} radius={20} />
      <Show on style={{ ...box(C.CX, C.CY, C.CW, C.CH), zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Plinth size={72}><Ico3D name="container" size={54} loop="bob" /></Plinth>
        <span style={tag(15)}>Container</span>
      </Show>
      {C_LEV.map((l, i) => (
        <div key={l.label}>
          <Wire pts={l.wire} on={s(i + 1)} lit={hot === i} head={10} />
          <Node x={l.x} y={l.y} icon={l.icon} label={l.label} loop={l.loop} d={i * 0.4} lit={hot === i} on={s(i + 1)} size={C.TS} />
          <Token cls={C_RIDE[i]} on={done} />
        </div>
      ))}
    </Frame>
  )
}

/* ================================================================== slide 33 · D_T14 · the -e flag over the ENV default */

/*
 * 566 x 380. Image card x 20..190, y 116..276 (the image icon + `Image`, the ENV default tile at (105, 206)). The `-e`
 * flag tile at (260, 52), its tag under it. Container card x 326..546, y 96..360: header (container icon +
 * `Container`, left), the value slot at (490, 206), the app tile at (490, 300) with `getenv` from the slot down into it,
 * the app's coded default (refresh) at (400, 300), left of the app.
 * Wires: ENV default → slot (level at y 206); -e → slot (right along y 52, down at x 490, clear of the header text);
 * slot → app (down at x 490).
 * The slot shows what the app gets: the ENV default (doc, press 1), the injected -e value (toggle, press 2, the ENV wire
 * fading as it is overridden), nothing (press 3: both sources dashed, the app's own default lit). After the build the
 * walk replays the three cases, a dot riding the live source's wire and on into the app.
 */
const E = { W: 566, H: 380, IX: 20, IY: 116, IW: 170, IH: 160, CX: 326, CY: 96, CW: 220, CH: 264, SX: 490, SY: 206, SS: 56, EX: 260, EY: 52, AX: 490, AY: 300, FX: 400, PER: 2.4 }
const E_ENV: Pt[] = [[105 + 26, E.SY], [E.SX - E.SS / 2, E.SY]]
const E_E: Pt[] = [[E.EX + 26, E.EY], [E.SX, E.EY], [E.SX, E.SY - E.SS / 2]]
const E_GET: Pt[] = [[E.AX, E.SY + E.SS / 2], [E.AX, E.AY - 26]]
const E_RIDE_ENV = K.ride('t14-env', [E_ENV[0], [E_ENV[1][0] - 8, E.SY]], 0.05, 0.9, E.PER)
const E_RIDE_E = K.ride('t14-e', [...E_E.slice(0, -1), [E.SX, E.SY - E.SS / 2 - 8]], 0.05, 0.9, E.PER)
const E_RIDE_GET = K.ride('t14-get', [E_GET[0], [E.AX, E.AY - 34]], 1.1, 1.7, E.PER)

function Slot({ show }: { show: 'doc' | 'toggle' | 'empty' | 'none' }) {
  const instant = useInstant()
  const f = (v: boolean): CSSProperties => ({ gridArea: '1 / 1', opacity: v ? 1 : 0, transform: v ? 'none' : 'scale(0.8)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 420ms ${EASE}` })
  return (
    <div style={{ ...box(E.SX - E.SS / 2, E.SY - E.SS / 2, E.SS, E.SS), zIndex: 3, display: 'grid', placeItems: 'center', borderRadius: 16, background: '#F5F8FF', boxShadow: `inset 0 0 0 1.5px ${show === 'empty' ? ORANGE : '#B9CEFB'}`, transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
      <div style={f(show === 'doc')}><Ico3D name="doc" size={38} loop="none" /></div>
      <div style={f(show === 'toggle')}><Ico3D name="toggle" size={38} loop="none" /></div>
      <div style={{ ...f(show === 'empty'), ...tag(13, ORANGE) }}>Unset</div>
    </div>
  )
}

const D_T14: Fig = (p) => {
  const { hot, s, held } = useBuild({ ...p, steps: p.steps ?? 3 }, E.PER * 1000)
  /* which case the slot shows: the walk's case while building or looping, the injected value on the held frame */
  const scen = held ? 1 : hot >= 0 ? hot : s(2) ? 1 : s(1) ? 0 : -1
  const slot = scen === 0 ? 'doc' : scen === 1 ? 'toggle' : scen === 2 ? 'empty' : 'none'
  const live = !held
  return (
    <Frame w={E.W} h={E.H}>
      {/* the image and its ENV default */}
      <Panel x={E.IX} y={E.IY} w={E.IW} h={E.IH} radius={18}>
        <div style={{ position: 'absolute', left: 20, top: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Ico3D name="image" size={28} loop="none" />
          <span style={{ ...heading(15), whiteSpace: 'nowrap' }}>Image</span>
        </div>
      </Panel>
      <Node x={105} y={E.SY} icon="doc" label="ENV Default" lit={hot === 0} on={s(1)} dim={scen === 1 || scen === 2} />
      {/* wires above the cards (a Wire's own svg sits under a Panel) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none' }}>
      <Wire pts={E_ENV} on={s(1)} lit={hot === 0} head={10} dash={scen === 2 ? '6 6' : undefined} opacity={scen === 1 || scen === 2 ? 0.4 : 1} />

      {/* the -e flag */}
      <Node x={E.EX} y={E.EY} icon="toggle" label="-e" tagMono w={60} lit={hot === 1} on={s(2)} loop="pulse" dim={scen === 2} />
      <Wire pts={E_E} on={s(2)} lit={hot === 1} head={10} dash={scen === 2 ? '6 6' : undefined} opacity={scen === 2 ? 0.4 : 1} />
      <Wire pts={E_GET} on={s(2)} lit={hot === 1} head={9} dash={scen === 2 ? '6 6' : undefined} opacity={scen === 2 ? 0.4 : 1} />
      </div>

      {/* the running container: value slot, app, the app's coded default */}
      <Panel x={E.CX} y={E.CY} w={E.CW} h={E.CH} radius={18}>
        <div style={{ position: 'absolute', left: 20, top: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Ico3D name="container" size={28} loop="none" />
          <span style={{ ...heading(15), whiteSpace: 'nowrap' }}>Container</span>
        </div>
      </Panel>
      <Slot show={slot} />
      <Show on={s(2)} style={{ position: 'absolute', right: E.W - (E.AX - 10), top: (E.SY + E.SS / 2 + E.AY - 26) / 2 - 9, zIndex: 3 }}>
        <span style={mono(13, colors.brandDeep)}>getenv</span>
      </Show>
      <Node x={E.AX} y={E.AY} icon="code" label="App" lit={hot === 1} on={s(2)} w={70} />
      <Node x={E.FX} y={E.AY} icon="refresh" label="Default" lit={hot === 2} on={s(3)} loop={scen === 2 ? 'spin' : 'none'} t={4} w={70} />

      {live && scen === 0 && <Token cls={E_RIDE_ENV} />}
      {live && scen === 1 && <Token cls={E_RIDE_E} />}
      {live && (scen === 0 || scen === 1) && s(2) && <Token cls={E_RIDE_GET} />}
    </Frame>
  )
}

/* ================================================================== slide 48 · D_T21 · the compose file traced */

/*
 * 566 x 420. The panel x 20..546, y 20..400: title row (Docker mark, `compose.yaml`), hairline at y 84, the eleven TR
 * lines, 14 px Fira Code, 26 px lines from y 96 (to 382). Text x 40 (30 px gutter). Press 1 lights lines 2-7 and draws
 * the depends_on arrow from the end of line 6 round to the `db:` key on line 8 (a dot rides it); press 2 lights lines
 * 8-11. Each block's bracket at x 424..432 and its tiles centred on x 483: the webpage (`Web`), the PostgreSQL mark and
 * the key (`Password`, read from the variable).
 */
const YK = (t: string): Tok => ({ t, c: colors.brandDark, b: true })
const YP = (t: string): Tok => ({ t, c: colors.muted })
const YV = (t: string): Tok => ({ t })
const YS = (t: string): Tok => ({ t, c: '#0E7A6E' })
const D_CODE = withW({
  x: 20, y: 20, w: 526, h: 380, top: 96, fs: 14, lh: 26, gutter: 30,
  lines: [
    [YK('services'), YP(':')],
    [YP('  '), YK('web'), YP(':')],
    [YP('    '), YK('build'), YP(':'), YV(' .')],
    [YP('    '), YK('ports'), YP(':')],
    [YP('      - '), YS('"80:5000"')],
    [YP('    '), YK('depends_on'), YP(':')],
    [YP('      - '), YV('db')],
    [YP('  '), YK('db'), YP(':')],
    [YP('    '), YK('image'), YP(':'), YV(' postgres:16')],
    [YP('    '), YK('environment'), YP(':')],
    [YP('      - '), YV('POSTGRES_PASSWORD=${DB_PASSWORD}')],
  ],
  blocks: [{ from: 2, to: 7 }, { from: 8, to: 11 }],
})
const ch = D_CODE.fs * 0.6
const lineY = (n: number) => D_CODE.top + (n - 1) * D_CODE.lh + D_CODE.lh / 2
const TX0 = 40 + D_CODE.gutter
const D_DEP: Pt[] = [[TX0 + 15 * ch + 10, lineY(6)], [TX0 + 15 * ch + 40, lineY(6)], [TX0 + 15 * ch + 40, lineY(8)], [TX0 + 5 * ch + 12, lineY(8)]]
const D_DEP_RIDE = K.ride('t21-dep', [...D_DEP.slice(0, -1), [D_DEP[3][0] + 8, lineY(8)]], 0.1, 1.5, 2.4)
const D_BX = 432
const D_MX = 483

const D_T21: Fig = (p) => {
  const { hot, s, held } = useBuild({ ...p, steps: p.steps ?? 2 }, 2400)
  const c = D_CODE
  const y = (b: { from: number; to: number }) => c.top + (b.from - 1) * c.lh
  const h = (b: { from: number; to: number }) => (b.to - b.from + 1) * c.lh
  const b0 = c.blocks[0]
  const b1 = c.blocks[1]
  return (
    <Frame w={566} h={420}>
      <Code c={c} lit={hot} held={held} title={<><MarkTile src={dockerMark} size={36} /><span style={{ ...mono(15, colors.ink), fontWeight: 700 }}>compose.yaml</span></>} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none' }}>
        <Wire pts={D_DEP} on={s(1)} lit={hot === 0} head={9} width={2.4} />
        <Token cls={D_DEP_RIDE} on={!held && hot === 0} />
      </div>
      <Bracket x={D_BX - 10} y={y(b0)} h={h(b0)} on={s(1)} />
      <Show on={s(1)} style={{ ...box(D_MX - 40, y(b0) + h(b0) / 2 - 32, 80, 64), zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <Plinth size={44} lit={hot === 0}><Ico3D name="webpage" size={32} loop="bob" /></Plinth>
        <span style={tag(13)}>Web</span>
      </Show>
      <Bracket x={D_BX - 10} y={y(b1)} h={h(b1)} on={s(2)} />
      <Show on={s(2)} style={{ ...box(D_MX - 40, y(b1) + h(b1) / 2 - 50, 80, 100), zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <MarkTile src={pgMark} size={38} lit={hot === 1} />
        <Plinth size={36} lit={hot === 1}><Ico3D name="key" size={26} loop="swing" /></Plinth>
        <span style={{ ...tag(13), marginTop: -2 }}>Password</span>
      </Show>
    </Frame>
  )
}

/* every lit block's scan band, registered at module level so the keyframes are in the exported css */
for (const c of [A_CODE, D_CODE]) for (const b of c.blocks) scanCls((b.to - b.from + 1) * c.lh - 14)

export const figures: Record<string, Fig> = { D_T10, D_T10B, D_T13, D_T14, D_T21 }
export const css = [K.css(), B_CSS, ...Object.values(SCAN)].join('\n')
