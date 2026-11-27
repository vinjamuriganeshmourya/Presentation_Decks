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
 * TR's identifiers, verbatim, in the mono face with ligatures off (rule 40).
 * Loops are transform / opacity on HTML elements only. Held (?still): the full final picture, nothing lit, nothing
 * moving. Class prefix `s19d-`.
 *
 *   slide 25 D_T10   586 x 380  the TR's Dockerfile on a code card, each band bracketed into the image it makes: lines 1-4
 *                               build the heavy layer stack (1); lines 6-7 make the light NGINX image, only the Output
 *                               riding the COPY --from arrow into it (2)
 *   slide 26 D_T10B  586 x 380  a heavy Build Stage (source, packages, tools, output) and a light Final Stage; the
 *                               COPY --from step (replica) between them: only the output rides across, source and tools
 *                               bounce off with an orange cross (1)
 *   slide 32 D_T13   526 x 400  one container fed by four levers from outside: env vars (1), volume (2), port (3),
 *                               secret (4), a dot riding each wire in turn
 *   slide 33 D_T14   566 x 380  image with its ENV default, the -e flag, the running container's value slot and its
 *                               app: the ENV default fills the slot (1), -e overrides it and the app reads it through
 *                               getenv (2), nothing set and the app falls back to its coded default (3)
 *   slide 47 D_T21   566 x 420  the TR's compose.yaml on a code card with its depends_on arrow to the db block, each band
 *                               bracketed into its service: web built from the Dockerfile, 80 -> 5000, waiting (1); db
 *                               from postgres:16 with the key from DB_PASSWORD, db up, then web up (2)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('s19d')
const BLUE = colors.brand
const MONO = fonts.mono
const NOLIG: CSSProperties = { fontVariantLigatures: 'none', fontFeatureSettings: '"liga" 0, "calt" 0' }
const GREEN = colors.success

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)
const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })
const mono = (size = 14, color: string = colors.ink): CSSProperties => ({ fontFamily: MONO, ...NOLIG, fontSize: size, fontWeight: 600, lineHeight: 1.2, color, whiteSpace: 'nowrap' })

/** the build: the step, the lit item, held. The walk after the build starts on the LAST item (S18 fix).
 *  `pin`: no own walk; the lit item always matches the lit point (the engine's `pointsLoop` cycles it, as `litAt`) (review round 5: 25 and 47, the code band must follow
 *  the point, never cycle back to the first band while the last point is lit). */
function useBuild(p: Record<string, unknown>, period: number, pin = false) {
  const cnt = Number(p.steps ?? 1)
  const held = useHeld()
  const step = held ? cnt : stepOf(p)
  const cyc = useHot(cnt, stepOf(p), period)
  const raw = pin ? (held ? -1 : Number(p.litAt ?? Math.min(stepOf(p), cnt)) - 1) : cyc
  const hot = pin ? raw : raw >= 0 && stepOf(p) >= cnt ? (raw + cnt - 1) % cnt : raw
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

/* ------------------------------------------------------------------ the code card (T10, T21) */

/** one code token: plain, keyword (bold dark blue), punctuation (muted), a YAML string (teal) */
type Tok = { t: string; c?: string; b?: boolean }
const KW = (t: string): Tok => ({ t, c: colors.brandDark, b: true })
const TX = (t: string): Tok => ({ t })
const PU = (t: string): Tok => ({ t, c: colors.muted })
const ST = (t: string): Tok => ({ t, c: '#0E7A6E' })
/** a display row: the TR line number (none on a wrapped continuation) and its tokens */
type Row = { n?: number; t: Tok[] }
type CodeCardSpec = { x: number; y: number; w: number; h: number; top: number; lh: number; fs: number; gutter: number; rows: Row[]; bands: { from: number; to: number }[] }
const LIT_BG = '#E3ECFF'

/** the code card: title row, hairline, one DOM block per row; band i tinted blue while it is the lit one (rule 55) */
function CodeCard({ c, title, lit }: { c: CodeCardSpec; title: ReactNode; lit: number }) {
  const instant = useInstant()
  const tx = c.x + 20
  return (
    <>
      <Panel x={c.x} y={c.y} w={c.w} h={c.h} radius={16} />
      <div style={{ ...box(tx, c.y + 14, c.w - 40, 36), zIndex: 3, display: 'flex', alignItems: 'center', gap: 10 }}>{title}</div>
      <span aria-hidden style={{ ...box(tx, c.top - 10, c.w - 40, 1.5), zIndex: 3, background: '#D3DEF6', borderRadius: 1 }} />
      {c.bands.map((b, i) => (
        <span key={i} aria-hidden style={{ ...box(tx - 8, c.top + b.from * c.lh, c.w - 24, (b.to - b.from + 1) * c.lh), zIndex: 2, borderRadius: 8, background: lit === i ? LIT_BG : 'rgba(227,236,255,0)', boxShadow: lit === i ? `inset 0 0 0 1.5px ${BLUE}55` : 'inset 0 0 0 1.5px rgba(45,99,251,0)', transition: instant ? 'none' : `background 420ms ${EASE}, box-shadow 420ms ${EASE}` }} />
      ))}
      <div style={{ ...box(tx, c.top, c.w - 40, c.rows.length * c.lh), zIndex: 3 }}>
        {c.rows.map((r, i) => (
          <div key={i} style={{ height: c.lh, display: 'flex', alignItems: 'center', fontFamily: MONO, ...NOLIG, fontSize: c.fs, whiteSpace: 'pre' }}>
            <span style={{ width: c.gutter, flexShrink: 0, color: colors.muted, fontWeight: 500, fontSize: c.fs - 1.5 }}>{r.n ?? ''}</span>
            <span>{r.t.map((tk, j) => <span key={j} style={{ color: tk.c ?? colors.ink, fontWeight: tk.b ? 700 : 500 }}>{tk.t}</span>)}</span>
          </div>
        ))}
      </div>
    </>
  )
}

/** a band's bracket just outside the card's right edge (rows from..to), and the connector from its middle-ish y to the picture */
function BandLink({ c, band, cy, toX, on, lit }: { c: CodeCardSpec; band: { from: number; to: number }; cy: number; toX: number; on: boolean; lit: boolean }) {
  const instant = useInstant()
  const y0 = c.top + band.from * c.lh + 4
  const h = (band.to - band.from + 1) * c.lh - 8
  const bx = c.x + c.w + 6
  return (
    <>
      <span aria-hidden style={{ ...box(bx, y0, 8, h), zIndex: 3, borderRight: `2.5px solid ${lit ? ORANGE : BLUE}`, borderTop: `2.5px solid ${lit ? ORANGE : BLUE}`, borderBottom: `2.5px solid ${lit ? ORANGE : BLUE}`, borderRadius: '0 8px 8px 0', opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE}, border-color 420ms ${EASE}` }} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none' }}>
        <Wire pts={[[bx + 8, cy], [toX, cy]]} on={on} lit={lit} head={8} width={2.4} delay={250} />
      </div>
    </>
  )
}

/* ================================================================== slide 25 · D_T10 · the Dockerfile and the two images it makes */

/*
 * 586 x 380. Left: the TR's Dockerfile (lines 1-7, 12.5 px, 30 px rows from y 92; line 7 wraps once after /app/dist so
 * the card stays 316 wide) on a card x 20..336, y 20..352. Two bands: lines 1-4 (rows 0-3) and lines 6-7 (rows 5-7),
 * each with a bracket outside the card (x 342) and a connector into the picture (x 366).
 * Right (x 366..506): the HEAVY build image beside lines 1-4: five slabs 140 x 24, 5 px apart, y 70..210 (Node.js
 * base, Toolchain, Dependencies, Source, Output on top), `Build Stage` above it. The LIGHT final image beside lines
 * 6-7: the NGINX base (y 288..312) and the empty slot (y 259..283), `Final Stage` under it. The TR's arrow labelled
 * `COPY --from`: from the heavy Output's right edge out to x 530, down, and back into the slot's right edge; its label
 * between the two stacks.
 * Press 1: band 1-4 tints, its bracket and connector, the heavy stack builds layer by layer (Output last, glowing).
 * Press 2: band 6-7 tints, the light stack appears, a copy of Output rides COPY --from into the slot, the heavy stack
 * dims (it stays behind). Walk: lines 1-4 + the heavy stack (Output ringed), then lines 6-7 + the light stack (a dot
 * rides COPY --from, the landed Output ringed). Held: the final picture, nothing lit.
 */
const L = { W: 586, H: 380, SX: 366, SW: 140, SH: 24, GAP: 5, HB: 210, AX: 530, PER: 2.6 }
const A_CODE: CodeCardSpec = {
  x: 20, y: 20, w: 316, h: 332, top: 92, lh: 30, fs: 12.5, gutter: 26,
  rows: [
    { n: 1, t: [KW('FROM'), TX(' node:24-alpine '), KW('AS'), TX(' build')] },
    { n: 2, t: [KW('WORKDIR'), TX(' /app')] },
    { n: 3, t: [KW('COPY'), TX(' . .')] },
    { n: 4, t: [KW('RUN'), TX(' npm install && npm run build')] },
    { n: 5, t: [] },
    { n: 6, t: [KW('FROM'), TX(' nginx:alpine')] },
    { n: 7, t: [KW('COPY'), TX(' --from=build /app/dist')] },
    { t: [TX('     /usr/share/nginx/html')] },
  ],
  bands: [{ from: 0, to: 3 }, { from: 5, to: 7 }],
}
const hY = (i: number) => L.HB - L.SH - i * (L.SH + L.GAP)          // heavy stack: top of layer i (0 = base)
const OUT_Y = hY(4)
const BASE_Y = 288
const SLOT_Y = BASE_Y - L.SH - L.GAP
const L_ARROW: Pt[] = [[L.SX + L.SW, OUT_Y + L.SH / 2], [L.AX, OUT_Y + L.SH / 2], [L.AX, SLOT_Y + L.SH / 2], [L.SX + L.SW, SLOT_Y + L.SH / 2]]
const L_RIDE = K.ride('t10-copy', [[L.SX + L.SW + 6, OUT_Y + L.SH / 2], [L.AX, OUT_Y + L.SH / 2], [L.AX, SLOT_Y + L.SH / 2], [L.SX + L.SW + 12, SLOT_Y + L.SH / 2]], 0.2, 1.8, L.PER)
const FLY_X = 26
const FLY_Y = SLOT_Y - OUT_Y
const L_FLY = `@keyframes s19d-t10-fly { 0% { transform: translate(0px, 0px) } 18% { transform: translate(${FLY_X}px, 0px) } 78% { transform: translate(${FLY_X}px, ${FLY_Y}px) } 100% { transform: translate(0px, ${FLY_Y}px) } }
.s19d-t10-fly { animation: s19d-t10-fly 1600ms ${EASE} 450ms both; }`

type Layer = { label: string; icon?: Ico3DName; mark?: string; bg: string }
const NAVY = 'linear-gradient(180deg, #2B4FA8 0%, #1E3A86 100%)'
const L_LAYERS: Layer[] = [
  { label: 'Node.js', mark: nodeMark, bg: NAVY },
  { label: 'Toolchain', icon: 'wrench', bg: 'linear-gradient(180deg, #3A63D0 0%, #2C51B5 100%)' },
  { label: 'Dependencies', icon: 'package', bg: 'linear-gradient(180deg, #4C78EC 0%, #3B66D8 100%)' },
  { label: 'Source', icon: 'code', bg: 'linear-gradient(180deg, #6A93FF 0%, #5480F2 100%)' },
]
const OUTPUT: Layer = { label: 'Output', icon: 'folder', bg: 'linear-gradient(180deg, #23C79C 0%, #13A57F 100%)' }

/** one image layer: a slab with its icon chip (a 3D icon or an official mark) and its name */
function Slab({ x, y, layer, glow = false, lit = false }: { x: number; y: number; layer: Layer; glow?: boolean; lit?: boolean }) {
  const instant = useInstant()
  const ring = lit ? `inset 0 0 0 2.5px ${ORANGE}, ` : ''
  const halo = glow ? '0 0 0 3px rgba(35,199,156,0.18), 0 8px 20px -6px rgba(19,165,127,0.75)' : '0 8px 14px -10px rgba(20,40,100,0.65)'
  return (
    <div style={{ ...box(x, y, L.SW, L.SH), borderRadius: 8, background: layer.bg, boxShadow: `${ring}inset 0 1.5px 0 rgba(255,255,255,0.28), inset 0 -2px 0 rgba(0,0,0,0.16), ${halo}`, display: 'flex', alignItems: 'center', gap: 7, padding: '0 8px', transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
      {layer.mark ? <MarkTile src={layer.mark} size={18} scale={0.74} /> : (
        <span style={{ display: 'grid', placeItems: 'center', width: 18, height: 18, borderRadius: 5, background: '#FFFFFF', flexShrink: 0 }}>
          <Ico3D name={layer.icon ?? 'doc'} size={14} loop="none" />
        </span>
      )}
      <span style={{ ...heading(12, '#FFFFFF'), whiteSpace: 'nowrap' }}>{layer.label}</span>
    </div>
  )
}

const D_T10: Fig = (p) => {
  const { hot, s, held, done } = useBuild({ ...p, steps: p.steps ?? 2 }, L.PER * 1000, true)
  const instant = useInstant()
  const dim = s(2) && hot !== 0
  const c = A_CODE
  return (
    <Frame w={L.W} h={L.H}>
      <CodeCard c={c} lit={hot} title={<><MarkTile src={dockerMark} size={32} /><span style={{ ...heading(15), whiteSpace: 'nowrap' }}>Dockerfile</span></>} />
      <BandLink c={c} band={c.bands[0]} cy={hY(2) + L.SH / 2} toX={L.SX} on={s(1)} lit={hot === 0} />
      <BandLink c={c} band={c.bands[1]} cy={BASE_Y + L.SH / 2} toX={L.SX} on={s(2)} lit={hot === 1} />

      {/* the heavy build image, layer by layer */}
      <Show on={s(1)} style={{ ...box(L.SX, 40, L.SW, 18), ...tag(14, colors.ink), zIndex: 3 }}>Build Stage</Show>
      <div style={{ position: 'absolute', inset: 0, zIndex: 3, opacity: dim ? 0.38 : 1, transition: instant ? 'none' : `opacity 620ms ${EASE}` }}>
        {[...L_LAYERS, OUTPUT].map((ly, i) => (
          <Show key={ly.label} on={s(1)} delay={300 + i * 200} lift={10} style={{ position: 'absolute', inset: 0 }}>
            <Slab x={L.SX} y={hY(i)} layer={ly} glow={i === 4} lit={i === 4 && hot === 0} />
          </Show>
        ))}
      </div>

      {/* the light final image: its base and the slot the output lands in */}
      <Show on={s(2)} style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
        <Slab x={L.SX} y={BASE_Y} layer={{ label: 'NGINX', mark: nginxMark, bg: NAVY }} />
        <span aria-hidden style={{ ...box(L.SX, SLOT_Y, L.SW, L.SH), borderRadius: 8, border: '2px dashed #A9BEEA', background: 'rgba(237,243,255,0.7)', boxSizing: 'border-box' }} />
        <span style={{ ...box(L.SX, BASE_Y + L.SH + 12, L.SW, 18), ...tag(14, colors.ink) }}>Final Stage</span>
      </Show>

      {/* the TR's arrow labelled COPY --from, and what rides it */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none' }}>
        <Wire pts={L_ARROW} on={s(2)} lit={hot === 1} head={9} delay={200} />
        <Token cls={L_RIDE} on={done && hot === 1} />
      </div>
      <Show on={s(2)} delay={300} style={{ ...box(L.AX - 12 - 110, (hY(0) + L.SH + SLOT_Y) / 2 - 9, 110, 18), zIndex: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <span style={mono(13, hot === 1 ? ORANGE : colors.brandDeep)}>COPY --from</span>
      </Show>
      {s(2) && (
        <div className={held || instant ? undefined : 's19d-t10-fly'} style={{ position: 'absolute', left: 0, top: 0, zIndex: 5, transform: held || instant ? `translate(0px, ${FLY_Y}px)` : undefined }}>
          <Slab x={L.SX} y={OUT_Y} layer={OUTPUT} glow lit={hot === 1} />
        </div>
      )}
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

/* ================================================================== slide 47 · D_T21 · the compose file and what it starts */

/*
 * 566 x 420. Left: the TR's compose.yaml (lines 1-11, indentation kept, 12 px, 24 px rows from y 82; line 11 wraps
 * once after `=`) on a card x 20..276, y 20..390. Bands: web = lines 2-7 (rows 1-6), db = lines 8-11 (rows 7-10),
 * each with a bracket outside the card and a connector into its service card (x 304). The TR's own arrow: from the
 * end of line 6 `depends_on:` round to the `db:` key on line 8.
 * Right: the web card x 304..454, y 124..236 (webpage tile, `web`, its status, and the 80 → 5000 port pair: host port
 * 80 into the container's 5000); the local Dockerfile (doc + turning gear) at (506, 162) building into it. The db card
 * x 304..454, y 252..328 (database tile, `db`, its light); the official `postgres:16` image (PostgreSQL mark + Docker
 * mark) at (506, 290) into it; the DB_PASSWORD variable (key) at (330, 380) under it, the key riding up into db.
 * Press 1: band 2-7, the depends_on arrow, the Dockerfile builds into web, the ports; web waits (hourglass).
 * Press 2: band 8-11, postgres:16 and the key come in; db's light goes green, then web's hourglass gives way to green.
 * Walk: web (dot down the depends_on arrow, dot from the Dockerfile), then db (dot from postgres:16, the key riding).
 * Held: everything up, both lights green, nothing lit.
 */
const Q = { W: 566, H: 420, CX: 304, CW: 150, WY: 124, WH: 112, DY: 252, DH: 76, SX: 506, TS: 40, VX: 330, VY: 380, PER: 2.8 }
const D_CODE: CodeCardSpec = {
  x: 20, y: 20, w: 256, h: 370, top: 82, lh: 24, fs: 12, gutter: 24,
  rows: [
    { n: 1, t: [KW('services'), PU(':')] },
    { n: 2, t: [PU('  '), KW('web'), PU(':')] },
    { n: 3, t: [PU('    '), KW('build'), PU(':'), TX(' .')] },
    { n: 4, t: [PU('    '), KW('ports'), PU(':')] },
    { n: 5, t: [PU('      - '), ST('"80:5000"')] },
    { n: 6, t: [PU('    '), KW('depends_on'), PU(':')] },
    { n: 7, t: [PU('      - '), TX('db')] },
    { n: 8, t: [PU('  '), KW('db'), PU(':')] },
    { n: 9, t: [PU('    '), KW('image'), PU(':'), TX(' postgres:16')] },
    { n: 10, t: [PU('    '), KW('environment'), PU(':')] },
    { n: 11, t: [PU('      - '), TX('POSTGRES_PASSWORD=')] },
    { t: [TX('        ${DB_PASSWORD}')] },
  ],
  bands: [{ from: 1, to: 6 }, { from: 7, to: 11 }],
}
const CH = D_CODE.fs * 0.65   // the mono face advance, measured
const rowY = (r: number) => D_CODE.top + r * D_CODE.lh + D_CODE.lh / 2
const TX0 = D_CODE.x + 20 + D_CODE.gutter
const Q_DEP: Pt[] = [[TX0 + 15 * CH + 8, rowY(5)], [TX0 + 15 * CH + 30, rowY(5)], [TX0 + 15 * CH + 30, rowY(7)], [TX0 + 5 * CH + 10, rowY(7)]]
const Q_R_DEP = K.ride('t21-dep', [...Q_DEP.slice(0, -1), [Q_DEP[3][0] + 8, rowY(7)]], 0.1, 1.3, Q.PER)
const Q_WMID = Q.WY + 20 + 18
const Q_DMID = Q.DY + Q.DH / 2
const Q_DOCK: Pt[] = [[Q.SX - Q.TS / 2, Q_WMID], [Q.CX + Q.CW, Q_WMID]]
const Q_PG: Pt[] = [[Q.SX - Q.TS / 2, Q_DMID], [Q.CX + Q.CW, Q_DMID]]
const Q_KEY: Pt[] = [[Q.VX, Q.VY - 17], [Q.VX, Q.DY + Q.DH]]
const Q_R_DOCK = K.ride('t21-dock', [Q_DOCK[0], [Q_DOCK[1][0] + 10, Q_WMID]], 0.2, 1.2, Q.PER)
const Q_R_PG = K.ride('t21-pg', [Q_PG[0], [Q_PG[1][0] + 10, Q_DMID]], 0.15, 1.1, Q.PER)
const Q_R_KEY = K.ride('t21-key', [[Q.VX, Q.VY - 17], [Q.VX, Q.DY + Q.DH + 14]], 1.2, 2.2, Q.PER, 0.6)
/* the port pair inside the web card */
const P_Y = Q.WY + Q.WH - 20 - 13
const P80 = { x: Q.CX + 20, w: 34 }
const P5000 = { x: Q.CX + Q.CW - 20 - 50, w: 50 }

/** a status light: off (grey) or up (green); colour on a press, no loop */
function Light({ x, y, up, delay }: { x: number; y: number; up: boolean; delay: number }) {
  const instant = useInstant()
  return <span aria-hidden style={{ ...box(x - 7, y - 7, 14, 14), zIndex: 3, borderRadius: 99, background: up ? GREEN : '#C5CFE2', boxShadow: up ? `0 0 0 4px ${GREEN}2e, 0 0 12px ${GREEN}` : 'inset 0 1px 2px rgba(0,0,0,0.25)', transition: instant ? 'none' : `background 420ms ${EASE} ${up ? delay : 0}ms, box-shadow 420ms ${EASE} ${up ? delay : 0}ms` }} />
}
const Port = ({ x, w, label }: { x: number; w: number; label: string }) => (
  <span style={{ ...box(x, P_Y - 13, w, 26), zIndex: 3, display: 'grid', placeItems: 'center', borderRadius: 8, background: '#FFFFFF', boxShadow: '0 0 0 1.5px #B9CEFB, 0 6px 12px -8px rgba(31,64,140,0.6)', ...mono(13, colors.brandDeep), fontWeight: 700 }}>{label}</span>
)

const D_T21: Fig = (p) => {
  const { hot, s, held, done } = useBuild({ ...p, steps: p.steps ?? 2 }, Q.PER * 1000, true)
  const live = done && !held
  const c = D_CODE
  const head = (tile: ReactNode, name: string) => (
    <div style={{ position: 'absolute', left: 20, top: 20, height: 36, display: 'flex', alignItems: 'center', gap: 10 }}>
      {tile}
      <span style={{ ...mono(16, colors.ink), fontWeight: 700 }}>{name}</span>
    </div>
  )
  return (
    <Frame w={Q.W} h={Q.H}>
      <CodeCard c={c} lit={hot} title={<><MarkTile src={dockerMark} size={30} /><span style={{ ...mono(15, colors.ink), fontWeight: 700 }}>compose.yaml</span></>} />
      {/* the TR's arrow: depends_on → the db block */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none' }}>
        <Wire pts={Q_DEP} on={s(1)} lit={hot === 0} head={8} width={2.4} delay={300} />
        <Token cls={Q_R_DEP} on={live && hot === 0} />
      </div>
      <BandLink c={c} band={c.bands[0]} cy={Q_WMID + 20} toX={Q.CX} on={s(1)} lit={hot === 0} />
      <BandLink c={c} band={c.bands[1]} cy={Q_DMID + 8} toX={Q.CX} on={s(2)} lit={hot === 1} />

      {/* web: built from the Dockerfile, its port pair, waiting until db is up */}
      <Panel x={Q.CX} y={Q.WY} w={Q.CW} h={Q.WH} radius={16} lit={hot === 0}>
        {head(<Plinth size={36}><Ico3D name="webpage" size={26} loop="bob" /></Plinth>, 'web')}
      </Panel>
      <Show on={s(1) && !s(2)} style={{ ...box(Q.CX + Q.CW - 20 - 22, Q.WY + 20 + 7, 22, 22), zIndex: 3 }}>
        <Ico3D name="hourglass" size={22} loop={held ? 'none' : 'pulse'} />
      </Show>
      {(s(2) || !s(1)) && <Light x={Q.CX + Q.CW - 20 - 9} y={Q.WY + 20 + 18} up={s(2)} delay={1500} />}
      <Show on={s(1)} delay={300} style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
        <Port x={P80.x} w={P80.w} label="80" />
        <Port x={P5000.x} w={P5000.w} label="5000" />
      </Show>
      <div style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none' }}>
        <Wire pts={[[P80.x + P80.w + 6, P_Y], [P5000.x - 4, P_Y]]} on={s(1)} lit={hot === 0} head={8} width={2.2} delay={500} />
      </div>
      <Node x={Q.SX} y={Q_WMID} label="Dockerfile" on={s(1)} lit={hot === 0} icon="doc" loop="none" size={Q.TS} />
      <Show on={s(1)} style={{ ...box(Q.SX + 4, Q_WMID + 2, 22, 22), zIndex: 4 }}>
        <span style={{ display: 'grid', placeItems: 'center', width: 22, height: 22, borderRadius: 7, background: '#FFFFFF', boxShadow: '0 0 0 1.5px #D3DEF6, 0 4px 8px -4px rgba(31,64,140,0.5)' }}><Ico3D name="gear" size={17} loop={held ? 'none' : 'spin'} t={6} /></span>
      </Show>

      {/* db: the official postgres:16 image, the password from the variable */}
      <Panel x={Q.CX} y={Q.DY} w={Q.CW} h={Q.DH} radius={16} lit={hot === 1}>
        {head(<Plinth size={36}><Ico3D name="database" size={26} loop="bob" d={0.4} /></Plinth>, 'db')}
      </Panel>
      <Light x={Q.CX + Q.CW - 20 - 9} y={Q.DY + 20 + 18} up={s(2)} delay={500} />
      <Node x={Q.SX} y={Q_DMID} label="postgres:16" tagMono mark={pgMark} on={s(2)} lit={hot === 1} size={Q.TS} />
      <Show on={s(2)} style={{ ...box(Q.SX + 4, Q_DMID + 2, 22, 22), zIndex: 4 }}>
        <MarkTile src={dockerMark} size={22} scale={0.72} />
      </Show>
      <Node x={Q.VX} y={Q.VY} icon="key" label="DB_PASSWORD" tagMono side on={s(2)} lit={hot === 1} loop="swing" size={34} delay={200} />

      <div style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none' }}>
        <Wire pts={Q_DOCK} on={s(1)} lit={hot === 0} head={9} delay={300} />
        <Wire pts={Q_PG} on={s(2)} lit={hot === 1} head={9} delay={200} />
        <Wire pts={Q_KEY} on={s(2)} lit={hot === 1} head={9} delay={300} />
        <Token cls={Q_R_DOCK} on={live && hot === 0} />
        <Token cls={Q_R_PG} on={live && hot === 1} />
        <Rider cls={Q_R_KEY} icon="key" size={22} on={live && hot === 1} />
      </div>
    </Frame>
  )
}

export const figures: Record<string, Fig> = { D_T10, D_T10B, D_T13, D_T14, D_T21 }
export const css = [K.css(), B_CSS, L_FLY].join('\n')
