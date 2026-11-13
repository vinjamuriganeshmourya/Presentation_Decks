import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { MOTION, motionHeld } from '@/motion/tokens'
import { TILE_SKIN } from '@/decks/figures/card'
import { litRing } from '@/decks/figures/net/frames'
import { Icon } from '@/engine/icon'
import rekognition from '../images/aws-rekognition.svg'
import azVision from '../images/azure-computer-vision.svg'
import gcVision from '../images/gcp-cloud-vision-api.svg'
import awsMark from '../images/aws.png'
import azureMark from '../images/azure.svg'
import gcMark from '../images/google-cloud.svg'

/*
 * BUILDER C · Cloud Provider Comparison (Session 11): slides 26 (B_T15B), 27 (B_T16), 33 (C_T21), 34 (C_T22),
 * 35 (C_T23), 36 (C_T23B).
 *
 * Built to Sessions 9 and 10's final review state (generate-slides standing corrections 13-16, cloud course R10-R13):
 * icon-first visuals with one-word Title Case tags, no chips, badges or connector labels; official marks on white
 * tiles that never move; a quiet loop on every visual after its build; an orange highlight that walks and loops and is
 * gone on held frames; equal padding on all four sides; straight arrows computed from the boxes' constants; nothing
 * overlapping at any step. Every figure takes the slide's `step` (0 = nothing pressed, n = whole; on a points slide
 * part i is lit while it is the current press). On `?still`, thumbnails and reduced motion: everything shown, nothing
 * lit, nothing moving. Classes are prefixed `cq-` so this file's CSS never meets another builder's.
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const EASE = MOTION.ease
const useHeld = () => motionHeld(useInstant())
const FONT = "'DM Sans', system-ui, sans-serif"

/* ------------------------------------------------------------------ loop vocabulary */

const lc = (kind: string) => `cq cq-${kind}`
const lv = (d = 0, t?: number, extra: Record<string, string | number> = {}): CSSProperties =>
  ({ ['--cq-d' as string]: `${-d}s`, ...(t ? { ['--cq-t' as string]: `${t}s` } : {}), ...extra }) as CSSProperties

/** wall-clock seconds, frozen at `hold` on held frames */
function useClock(hold = 0) {
  const held = useHeld()
  const [t, setT] = useState(0)
  useEffect(() => {
    if (held) return
    let r = 0
    const t0 = performance.now()
    const f = (n: number) => {
      setT((n - t0) / 1000)
      r = requestAnimationFrame(f)
    }
    r = requestAnimationFrame(f)
    return () => cancelAnimationFrame(r)
  }, [held])
  return held ? hold : t
}

/** an index walking 0 → n-1 → 0 forever once the build is done; -1 (nothing lit) on held frames */
function useCycle(n: number, done: boolean, periodMs = 1400) {
  const held = useHeld()
  const [i, setI] = useState(0)
  useEffect(() => {
    setI(0)
    if (!done || held || n < 1) return
    const id = window.setInterval(() => setI((v) => (v + 1) % n), periodMs)
    return () => window.clearInterval(id)
  }, [n, done, held, periodMs])
  return done && !held ? i : -1
}

/* ------------------------------------------------------------------ type */

const heading = (size: number, color: string = colors.ink): CSSProperties => ({ fontFamily: FONT, fontWeight: 700, fontSize: size, lineHeight: 1.2, color })
const body = (size: number, color: string = colors.body): CSSProperties => ({ fontFamily: FONT, fontWeight: 500, fontSize: size, lineHeight: 1.35, color })
const tag = (size = 14, color: string = colors.brandDeep): CSSProperties => ({ fontFamily: FONT, fontWeight: 600, fontSize: size, lineHeight: 1.15, color, whiteSpace: 'nowrap', textAlign: 'center' })

/* ------------------------------------------------------------------ pieces */

function Show({ on, children, style, delay = 0, lift = 6 }: { on: boolean; children: ReactNode; style?: CSSProperties; delay?: number; lift?: number }) {
  const instant = useInstant()
  return (
    <div
      style={{
        opacity: on ? 1 : 0,
        transform: on ? 'none' : `translateY(${lift}px)`,
        transition: instant ? 'none' : `opacity 520ms ${EASE} ${on ? delay : 0}ms, transform 520ms ${EASE} ${on ? delay : 0}ms`,
        pointerEvents: on ? undefined : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** the figure's own w x h box, centred in the stage; `bare` drops the stage's card (its children are the cards) */
const Frame = ({ w, h, children, bare = false }: { w: number; h: number; children: ReactNode; bare?: boolean }) => (
  <div className={bare ? 'cq-bare' : undefined} style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
    <div style={{ position: 'relative', width: w, height: h }}>{children}</div>
  </div>
)

/** absolute box at x, y */
const Abs = ({ x, y, w, h, children, style }: { x: number; y: number; w?: number; h?: number; children?: ReactNode; style?: CSSProperties }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, ...style }}>{children}</div>
)

/** an official mark on its white tile (rule 54); the mark never moves */
function MarkTile({ src, size = 52, scale = 0.72 }: { src: string; size?: number; scale?: number }) {
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: Math.round(size * 0.26), ...TILE_SKIN, flexShrink: 0 }}>
      <img src={src} alt="" aria-hidden draggable={false} style={{ width: Math.round(size * scale), height: Math.round(size * scale), objectFit: 'contain', display: 'block' }} />
    </span>
  )
}

/** a lucide glyph on a tile; `loop` moves the glyph only */
function Glyph({ icon, size = 44, tone = colors.brand, bg, loop, d = 0, t, lit = false }: { icon: string; size?: number; tone?: string; bg?: string; loop?: string; d?: number; t?: number; lit?: boolean }) {
  const instant = useInstant()
  return (
    <span
      style={{
        display: 'grid',
        placeItems: 'center',
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.27),
        ...TILE_SKIN,
        ...(bg ? { background: bg } : {}),
        boxShadow: litRing(lit, (TILE_SKIN.boxShadow as string) ?? ''),
        transition: instant ? 'none' : `box-shadow 420ms ${EASE}`,
        color: tone,
        flexShrink: 0,
      }}
    >
      <span className={loop ? lc(loop) : undefined} style={{ display: 'grid', placeItems: 'center', ...lv(d, t) }}>
        <Icon name={icon} size={Math.round(size * 0.5)} />
      </span>
    </span>
  )
}

/** an icon with its one-word tag under it, centred on (cx, top) */
function Tagged({ cx, top, w = 120, children, label, size = 14, color }: { cx: number; top: number; w?: number; children: ReactNode; label: string; size?: number; color?: string }) {
  return (
    <div style={{ position: 'absolute', left: cx - w / 2, top, width: w, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
      {children}
      <span style={tag(size, color)}>{label}</span>
    </div>
  )
}

/** a white card that rings while it is the part being explained */
function Panel({ x, y, w, h, lit = false, on = true, radius = 18, children, delay = 0, tint }: { x: number; y: number; w: number; h: number; lit?: boolean; on?: boolean; radius?: number; children?: ReactNode; delay?: number; tint?: string }) {
  const instant = useInstant()
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: radius, ...TILE_SKIN, ...(tint ? { background: tint } : {}), boxShadow: litRing(lit, TILE_SKIN.boxShadow as string), transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }} />
      <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
    </Show>
  )
}

/**
 * A STRAIGHT ARROW between two computed points, a filled head landing exactly on (x2, y2). It draws itself along its
 * path when `on` turns true (explanatory tier, 860 ms), held drawn on held frames.
 */
function Arrow({ x1, y1, x2, y2, on = true, color = colors.brand, width = 2.5, head = 10, delay = 0, both = false, lit = false }: { x1: number; y1: number; x2: number; y2: number; on?: boolean; color?: string; width?: number; head?: number; delay?: number; both?: boolean; lit?: boolean }) {
  const instant = useInstant()
  const len = Math.hypot(x2 - x1, y2 - y1)
  const ux = (x2 - x1) / len
  const uy = (y2 - y1) / len
  const c = lit ? colors.accent : color
  const tip = (x: number, y: number, dx: number, dy: number) => `${x},${y} ${x - dx * head - dy * head * 0.55},${y - dy * head + dx * head * 0.55} ${x - dx * head + dy * head * 0.55},${y - dy * head - dx * head * 0.55}`
  const s0 = both ? head * 0.85 : 0
  const lineLen = len - head * 0.85 - s0
  const tr = instant ? 'none' : `stroke-dashoffset 860ms ${EASE} ${on ? delay : 0}ms, stroke 420ms ${EASE}`
  return (
    <svg aria-hidden style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }} width={1} height={1}>
      <line
        x1={x1 + ux * s0}
        y1={y1 + uy * s0}
        x2={x2 - ux * head * 0.85}
        y2={y2 - uy * head * 0.85}
        stroke={c}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={lineLen}
        strokeDashoffset={on ? 0 : lineLen}
        style={{ transition: tr }}
      />
      <polygon points={tip(x2, y2, ux, uy)} fill={c} style={{ opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 300ms ${EASE} ${on ? delay + 700 : 0}ms, fill 420ms ${EASE}` }} />
      {both && <polygon points={tip(x1, y1, -ux, -uy)} fill={c} style={{ opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 300ms ${EASE} ${on ? delay + 700 : 0}ms` }} />}
    </svg>
  )
}

/** a flow dot riding a straight segment on the wall clock; nothing on held frames */
function Dot({ x1, y1, x2, y2, t, period, phase = 0, ride = 0.7, tone = colors.brand, size = 12, icon }: { x1: number; y1: number; x2: number; y2: number; t: number; period: number; phase?: number; ride?: number; tone?: string; size?: number; icon?: string }) {
  const held = useHeld()
  if (held) return null
  const u = ((((t - phase) % period) + period) % period) / period
  if (u > ride) return null
  const k = u / ride
  const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
  const x = x1 + (x2 - x1) * e
  const y = y1 + (y2 - y1) * e
  const op = k < 0.12 ? k / 0.12 : k > 0.88 ? (1 - k) / 0.12 : 1
  const s = icon ? size + 12 : size
  return (
    <span aria-hidden style={{ position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, borderRadius: 99, background: tone, opacity: op, display: 'grid', placeItems: 'center', color: colors.white, boxShadow: `0 0 0 4px ${tone}2e, 0 6px 12px -6px ${tone}`, zIndex: 8 }}>
      {icon && <Icon name={icon} size={Math.round(s * 0.58)} />}
    </span>
  )
}

/* ================================================================== slide 26 · B_T15B */

function B_T15B({ step }: { step: number }) {
  const held = useHeld()
  const t = useClock(0)
  const all = held || step >= 3
  const lit = (i: number) => step === i && !held
  const W = 610
  const H = 340
  const TX = 62 // task centre x
  const TY = 170
  const TS = 64
  const SX = 168 // service tile left
  const ST = 52
  const ROWS = [64, 170, 276]
  const SERV: [string, string][] = [
    [rekognition, 'Rekognition'],
    [azVision, 'Azure Vision'],
    [gcVision, 'Cloud Vision AI'],
  ]
  const JX = 474
  const JW = 128
  const JY = 104
  const JH = 172
  const BX = 404 // brain badge centre x
  const cyc = useCycle(3, all && !held, 1400)
  return (
    <Frame w={W} h={H}>
      {/* the one task */}
      <Tagged cx={TX} top={TY - TS / 2} label="Image Analysis">
        <Glyph icon="Image" size={TS} loop="breathe" t={3.2} lit={lit(1)} />
      </Tagged>

      {/* three providers, one task each */}
      {ROWS.map((y, i) => (
        <Arrow key={i} x1={TX + TS / 2 + 10} y1={TY} x2={SX - 10} y2={y} on={held || step >= 1} delay={i * 130} lit={cyc === i} />
      ))}
      {ROWS.map((y, i) => (
        <Dot key={`d${i}`} x1={TX + TS / 2 + 10} y1={TY} x2={SX - 10} y2={y} t={t} period={4.2} phase={i * 1.4} ride={0.32} />
      ))}
      {SERV.map(([src, name], i) => (
        <Show key={name} on={held || step >= 1} delay={i * 130} style={{ position: 'absolute', left: SX, top: ROWS[i] - ST / 2, height: ST, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ borderRadius: 14, boxShadow: litRing(cyc === i || lit(1), ''), transition: `box-shadow 420ms ${EASE}` }}>
            <MarkTile src={src} size={ST} scale={0.78} />
          </span>
          <span style={{ ...heading(16), whiteSpace: 'nowrap' }}>{name}</span>
        </Show>
      ))}

      {/* step 2: each model is already trained */}
      {ROWS.map((y, i) => (
        <Show key={`b${i}`} on={held || step >= 2} delay={i * 130} style={{ position: 'absolute', left: BX - 17, top: y - 17 }}>
          <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: 99, background: lit(2) ? colors.success : '#E7F6EE', color: lit(2) ? colors.white : colors.success, boxShadow: lit(2) ? `0 0 0 3px ${colors.success}33` : 'inset 0 0 0 1.5px #BFE6CF', transition: `all 420ms ${EASE}` }}>
            <span className={lc('pop')} style={{ display: 'grid', ...lv(i * 0.5, 3) }}>
              <Icon name="BrainCircuit" size={18} />
            </span>
          </span>
        </Show>
      ))}
      <Show on={held || step >= 2} style={{ position: 'absolute', left: BX - 40, top: ROWS[2] + 26, width: 80 }}>
        <span style={{ ...tag(13, colors.success), display: 'block' }}>Trained</span>
      </Show>

      {/* step 3: one REST call out, a structured JSON response back */}
      <Show on={all} style={{ position: 'absolute', left: BX + 24, top: TY - 66, width: JX - BX - 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span style={{ color: lit(3) ? colors.accent : colors.brand, display: 'grid' }}>
          <span className={lc('bob')} style={{ display: 'grid', ...lv(0, 2.2) }}>
            <Icon name="Globe" size={20} />
          </span>
        </span>
        <span style={tag(13)}>REST</span>
      </Show>
      <Arrow x1={BX + 26} y1={TY - 10} x2={JX - 8} y2={TY - 10} on={all} lit={lit(3)} />
      <Arrow x1={JX - 8} y1={TY + 12} x2={BX + 26} y2={TY + 12} on={all} delay={260} color={colors.success} />
      {all && <Dot x1={BX + 26} y1={TY - 10} x2={JX - 8} y2={TY - 10} t={t} period={2.8} ride={0.42} size={10} />}
      {all && <Dot x1={JX - 8} y1={TY + 12} x2={BX + 26} y2={TY + 12} t={t} period={2.8} phase={1.3} ride={0.42} size={10} tone={colors.success} />}
      <Panel x={JX} y={JY} w={JW} h={JH} on={all} lit={lit(3)} radius={16}>
        <div style={{ position: 'absolute', left: 16, right: 16, top: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: colors.brand, display: 'grid' }}>
            <Icon name="Braces" size={20} />
          </span>
          <span style={heading(15, colors.brandDeep)}>JSON</span>
        </div>
        {[0, 1, 2, 3].map((r) => (
          <div key={r} style={{ position: 'absolute', left: 16 + (r === 0 || r === 3 ? 0 : 10), top: 58 + r * 24, display: 'flex', gap: 6, alignItems: 'center' }}>
            <span className={lc('shim')} style={{ display: 'block', width: r === 0 || r === 3 ? 10 : 28, height: 8, borderRadius: 4, background: colors.brand, opacity: 0.55, ...lv(r * 0.35, 2.4) }} />
            {r !== 0 && r !== 3 && <span className={lc('shim')} style={{ display: 'block', width: 36 + (r % 2) * 10, height: 8, borderRadius: 4, background: colors.accent, opacity: 0.5, ...lv(r * 0.35 + 0.2, 2.4) }} />}
          </div>
        ))}
      </Panel>
    </Frame>
  )
}

/* ================================================================== slide 27 · B_T16 */

function B_T16({ step }: { step: number }) {
  const held = useHeld()
  const t = useClock(0)
  const lit = (i: number) => step === i && !held
  const on = (i: number) => held || step >= i
  const W = 600
  const H = 300
  const IX = 66
  const BX = 286
  const BW = 290
  const A = { y: 16, h: 108 } // pre-built API box
  const P = { y: 156, h: 128 } // platform box
  const AY = A.y + A.h / 2
  const PY = P.y + P.h / 2
  return (
    <Frame w={W} h={H}>
      {/* the two needs */}
      <Show on={on(1)} style={{ position: 'absolute', inset: 0 }}>
        <Tagged cx={IX} top={AY - 30} label="Standard Task" w={130}>
          <Glyph icon="ListChecks" size={52} loop="breathe" t={3} lit={lit(1)} />
        </Tagged>
      </Show>
      <Show on={on(2)} style={{ position: 'absolute', inset: 0 }}>
        <Tagged cx={IX} top={PY - 30} label="Custom Data" w={130}>
          <Glyph icon="DatabaseZap" size={52} loop="breathe" d={1.2} t={3} lit={lit(2)} />
        </Tagged>
      </Show>
      <Arrow x1={IX + 42} y1={AY - 4} x2={BX - 10} y2={AY - 4} on={on(1)} lit={lit(1)} />
      <Arrow x1={IX + 42} y1={PY - 4} x2={BX - 10} y2={PY - 4} on={on(2)} lit={lit(2)} />
      {on(1) && <Dot x1={IX + 42} y1={AY - 4} x2={BX - 10} y2={AY - 4} t={t} period={3} ride={0.5} />}
      {on(2) && <Dot x1={IX + 42} y1={PY - 4} x2={BX - 10} y2={PY - 4} t={t} period={3} phase={1.5} ride={0.5} />}

      {/* the ready model: input in, output out */}
      <Panel x={BX} y={A.y} w={BW} h={A.h} on={on(1)} lit={lit(1)}>
        <div style={{ position: 'absolute', left: 20, top: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Glyph icon="Plug" size={34} />
          <span style={heading(18)}>Pre-Built API</span>
        </div>
        <div style={{ position: 'absolute', left: 20, right: 20, bottom: 16, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: colors.muted, display: 'grid' }}>
            <Icon name="FileInput" size={20} />
          </span>
          <span style={{ position: 'relative', flex: 1, height: 3, margin: '0 10px', borderRadius: 3, background: colors.line, overflow: 'hidden' }}>
            <span className={lc('sweep')} style={{ position: 'absolute', left: 0, top: 0, width: 36, height: 3, background: colors.brand, ...lv(0, 2.2, { '--cq-x': '200px' }) }} />
          </span>
          <span style={{ color: colors.success, display: 'grid' }}>
            <span className={lc('pop')} style={{ display: 'grid', ...lv(0, 2.2) }}>
              <Icon name="FileCheck2" size={20} />
            </span>
          </span>
        </div>
      </Panel>

      {/* the workspace: train on private data; AutoML inside it, reaching up toward the ready model */}
      <Panel x={BX} y={P.y} w={BW} h={P.h} on={on(2)} lit={lit(2)}>
        <div style={{ position: 'absolute', left: 20, top: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Glyph icon="FlaskConical" size={34} />
          <span style={heading(18)}>Platform</span>
        </div>
        <div style={{ position: 'absolute', left: 20, bottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
          {['Lock', 'Cpu', 'SlidersHorizontal'].map((ic, i) => (
            <span key={ic} style={{ color: colors.brand, display: 'grid', width: 30, height: 30, placeItems: 'center', borderRadius: 9, background: '#EEF3FF' }}>
              <span className={lc('pulse')} style={{ display: 'grid', ...lv(i * 0.5, 1.8) }}>
                <Icon name={ic} size={16} />
              </span>
            </span>
          ))}
        </div>
        {/* AutoML, on the side of the platform that faces the API */}
        <Show on={on(3)} style={{ position: 'absolute', right: 20, top: 18, width: 96, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'grid', placeItems: 'center', width: 48, height: 48, borderRadius: 14, background: lit(3) ? colors.accent : '#FFF2E5', color: lit(3) ? colors.white : colors.accent, boxShadow: `inset 0 0 0 1.5px ${colors.accent}55`, transition: `all 420ms ${EASE}` }}>
            <span className={lc('wave')} style={{ display: 'grid', ...lv(0, 2.6) }}>
              <Icon name="WandSparkles" size={24} />
            </span>
          </span>
          <span style={tag(14, colors.accent)}>AutoML</span>
        </Show>
      </Panel>
      {/* the bridge: AutoML sits between the two layers */}
      <Show on={on(3)} style={{ position: 'absolute', left: BX + BW - 20 - 48, top: A.y + A.h, width: 1, height: 1 }}>
        <span aria-hidden className={lc('dash')} style={{ position: 'absolute', left: 23, top: 4, width: 3, height: P.y + 18 - (A.y + A.h) - 8, borderRadius: 3, background: `repeating-linear-gradient(180deg, ${colors.accent} 0 6px, transparent 6px 11px)`, ...lv(0, 1.2) }} />
      </Show>
    </Frame>
  )
}

/* ================================================================== slide 33 · C_T21 */

type Side = { tag: string; category: string; items: [string, string][] }
const titleCase = (s: string) => s.replace(/(^|[\s-])([a-z])/g, (_m, a: string, b: string) => a + b.toUpperCase())

function C_T21({ step, left, right }: { step: number; left: Side; right: Side }) {
  const held = useHeld()
  const lit = (i: number) => step === i && !held
  const on = (i: number) => held || step >= i
  const W = 1040
  const H = 330
  const CW = 492
  const GAP = W - 2 * CW
  const PAD = 28
  const card = (side: Side, x: number, real: boolean, i: number) => {
    const n = side.items.length
    const rowH = 40
    const rowGap = real ? 10 : 18
    const listH = n * rowH + (n - 1) * rowGap
    return (
      <Panel x={x} y={0} w={CW} h={H} on={on(i)} lit={lit(i)} radius={22} tint={real ? undefined : 'linear-gradient(180deg, #FFFFFF 0%, #F3F5F9 100%)'}>
        <div style={{ position: 'absolute', left: PAD, right: PAD, top: PAD, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ display: 'grid', placeItems: 'center', width: 52, height: 52, borderRadius: 15, background: real ? colors.brand : '#8792A8', color: colors.white, flexShrink: 0 }}>
            <span className={lc(real ? 'pulse' : 'flip')} style={{ display: 'grid', ...lv(0, real ? 1.8 : 3.6) }}>
              <Icon name={real ? 'Scale' : 'Tags'} size={26} />
            </span>
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={heading(22, real ? colors.brandDeep : '#4A5468')}>{side.tag}</span>
            <span style={body(16, colors.muted)}>{titleCase(side.category)}</span>
          </div>
        </div>
        {/* the list fills the same band in both cards (equal height cards, equal padding): first row at the band's top,
            last row on its bottom padding, the rows evenly spaced between, so neither card has a dead band */}
        <div style={{ position: 'absolute', left: PAD, right: PAD, top: PAD + 52 + 22, bottom: PAD, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, minHeight: listH }}>
            {side.items.map(([label, icon], k) => (
              <div key={label} style={{ height: rowH, display: 'flex', alignItems: 'center', gap: 16, padding: '0 16px', borderRadius: 14, background: real ? '#F2F6FF' : '#F1F3F7', boxShadow: real ? 'inset 0 0 0 1px #DCE6FA' : 'inset 0 0 0 1px #E1E5EC' }}>
                <span style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 9, background: colors.white, color: real ? colors.brand : '#6B7489', boxShadow: '0 4px 10px -6px rgba(16,32,58,0.35)', flexShrink: 0 }}>
                  <span className={lc(real ? 'breathe' : 'flip')} style={{ display: 'grid', ...lv(k * 0.6, real ? 3 : 4.2) }}>
                    <Icon name={icon} size={17} />
                  </span>
                </span>
                <span style={heading(18, real ? colors.ink : '#4A5468')}>{titleCase(label)}</span>
                {real && (
                  <span className={lc('pop')} style={{ marginLeft: 'auto', color: colors.success, display: 'grid', ...lv(k * 0.7, 2.8) }}>
                    <Icon name={['TrendingUp', 'MapPin', 'ShieldCheck', 'UserCheck'][k] ?? 'Check'} size={18} />
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </Panel>
    )
  }
  return (
    <Frame w={W} h={H} bare>
      {card(left, 0, true, 1)}
      {card(right, CW + GAP, false, 2)}
    </Frame>
  )
}

/* ================================================================== slide 34 · C_T22 */

type Pillar = { title: string; text: string; icon: string }

function C_T22({ step, items, check }: { step: number; items: Pillar[]; check: string }) {
  const held = useHeld()
  const lit = (i: number) => step === i && !held
  const on = (i: number) => held || step >= i
  const W = 1090
  const H = 336
  const N = items.length
  const PG = 20
  const PW = (W - (N - 1) * PG) / N
  const BEAM_H = 44
  const STUB = 10
  const PY = BEAM_H + STUB
  const PH = 214
  const SY = PY + PH + 14
  const SH = H - SY
  /* after the build the highlight walks the four pillars and the strip, 1 → 5 → 1, never parking (R13) */
  const cyc = useCycle(N + 1, held ? false : step >= N + 1, 1400)
  return (
    <Frame w={W} h={H} bare>
      {/* the beam the four factors hold up */}
      <Show on={on(1)} style={{ position: 'absolute', left: 0, top: 0, width: W, height: BEAM_H }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 16, background: `linear-gradient(180deg, #3D6BFF 0%, ${colors.brandDark} 100%)`, boxShadow: '0 12px 22px -14px rgba(31,69,200,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: colors.white }}>
          <span className={lc('rock')} style={{ display: 'grid', ...lv(0, 3.2) }}>
            <Icon name="Scale" size={24} />
          </span>
          <span style={heading(21, colors.white)}>Decision Factors</span>
        </div>
      </Show>
      {items.map((p, i) => {
        const x = i * (PW + PG)
        const hot = cyc === i
        return (
          <div key={p.title}>
            <Show on={on(i + 1)} delay={0} style={{ position: 'absolute', left: x + PW / 2 - 4, top: BEAM_H, width: 8, height: STUB }}>
              <span style={{ display: 'block', width: 8, height: STUB, borderRadius: 3, background: '#B9C9F2' }} />
            </Show>
            <Panel x={x} y={PY} w={PW} h={PH} on={on(i + 1)} lit={lit(i + 1)} radius={18}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: 18, boxShadow: hot ? `0 0 0 3px ${colors.accent}` : 'none', transition: `box-shadow 420ms ${EASE}` }} />
              <div style={{ position: 'absolute', left: 22, right: 22, top: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ display: 'grid', placeItems: 'center', width: 42, height: 42, borderRadius: 13, background: hot ? colors.accent : colors.brand, color: colors.white, transition: `background 420ms ${EASE}`, flexShrink: 0 }}>
                  <span className={lc(['pop', 'spin', 'grow', 'bob'][i] ?? 'pop')} style={{ display: 'grid', ...lv(i * 0.4, [2.4, 8, 2.8, 2.2][i] ?? 2.4) }}>
                    <Icon name={p.icon} size={23} />
                  </span>
                </span>
                <span style={heading(21)}>{p.title}</span>
              </div>
              <p style={{ position: 'absolute', left: 22, right: 22, top: 20 + 42 + 14, margin: 0, ...body(16, colors.body) }}>{p.text}</p>
            </Panel>
          </div>
        )
      })}
      {/* where it is checked in practice */}
      <Panel x={0} y={SY} w={W} h={SH} on={on(N + 1)} lit={cyc === N} radius={16} tint="linear-gradient(180deg, #FFFFFF 0%, #F3F7FF 100%)">
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '0 22px' }}>
          {['Calculator', 'Globe'].map((ic, i) => (
            <span key={ic} style={{ display: 'grid', placeItems: 'center', width: 36, height: 36, borderRadius: 11, background: colors.white, color: colors.brand, boxShadow: 'inset 0 0 0 1.5px #CFDCF5', flexShrink: 0 }}>
              <span className={lc(i ? 'spin' : 'pop')} style={{ display: 'grid', ...lv(i * 0.8, i ? 10 : 2.4) }}>
                <Icon name={ic} size={19} />
              </span>
            </span>
          ))}
          <span style={{ ...body(17, colors.ink), fontWeight: 600, whiteSpace: 'nowrap' }}>{check}</span>
        </div>
      </Panel>
    </Frame>
  )
}

/* ================================================================== slide 35 · C_T23 */

function C_T23({ step }: { step: number }) {
  const held = useHeld()
  const lit = (i: number) => step === i && !held
  const on = (i: number) => held || step >= i
  const W = 616
  const H = 316
  const TW = 188
  const TG = (W - 3 * TW) / 2
  const TH = 222
  const CONSOLES: { mark: string; bar: string; ink: string; label: string; layout: 'side' | 'top' | 'rail' }[] = [
    { mark: awsMark, bar: '#232F3E', ink: colors.white, label: 'EC2', layout: 'side' },
    { mark: azureMark, bar: '#0078D4', ink: colors.white, label: 'Virtual Machines', layout: 'top' },
    { mark: gcMark, bar: '#FFFFFF', ink: colors.ink, label: 'Compute Engine', layout: 'rail' },
  ]
  const cyc = useCycle(3, held ? false : step >= 3, 1400)
  const SY = TH + 22
  return (
    <Frame w={W} h={H}>
      {CONSOLES.map((c, i) => {
        const x = i * (TW + TG)
        return (
          <Show key={c.label} on delay={i * 130} style={{ position: 'absolute', left: x, top: 0, width: TW, height: TH }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 14, overflow: 'hidden', background: colors.white, boxShadow: litRing(lit(2), 'inset 0 0 0 1px #D5DEEE, 0 14px 26px -18px rgba(16,32,58,0.5)'), transition: `box-shadow 420ms ${EASE}` }}>
              {/* the console's own top bar with its mark */}
              <div style={{ height: 38, background: c.bar, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', boxShadow: c.bar === '#FFFFFF' ? 'inset 0 -1px 0 #E2E8F2' : undefined }}>
                <span style={{ display: 'grid', placeItems: 'center', width: 26, height: 26, borderRadius: 7, background: colors.white, flexShrink: 0 }}>
                  <img src={c.mark} alt="" aria-hidden draggable={false} style={{ width: 20, height: 20, objectFit: 'contain', display: 'block' }} />
                </span>
                <span style={{ display: 'block', height: 7, width: 54, borderRadius: 4, background: c.ink, opacity: 0.35 }} />
              </div>
              {/* the menu: three different arrangements, lit on step 2 */}
              <Menu layout={c.layout} lit={lit(2)} d={i * 0.7} />
              {/* the same compute icon in every console, under its own label */}
              <div style={{ position: 'absolute', left: c.layout === 'side' ? 52 : 0, right: c.layout === 'rail' ? 40 : 0, top: c.layout === 'top' ? 92 : 70, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <span style={{ display: 'grid', placeItems: 'center', width: 54, height: 54, borderRadius: 15, background: colors.brand, color: colors.white, boxShadow: '0 10px 18px -10px rgba(31,69,200,0.9)' }}>
                  <span className={lc('bob')} style={{ display: 'grid', ...lv(0, 2.4) }}>
                    <Icon name="Server" size={27} />
                  </span>
                </span>
                <span style={{ perspective: 400, display: 'block' }}>
                  <span className={lc('labelflip')} style={{ display: 'block', padding: '5px 10px', borderRadius: 9, background: cyc === i || lit(1) ? '#FFF2E5' : '#EEF3FF', boxShadow: cyc === i || lit(1) ? `inset 0 0 0 2px ${colors.accent}` : 'inset 0 0 0 1px #D3DEF7', transition: `all 420ms ${EASE}`, ...lv(i * 1.4, 4.2) }}>
                    <span style={{ ...tag(14, colors.ink), display: 'block' }}>{c.label}</span>
                  </span>
                </span>
              </div>
            </div>
          </Show>
        )
      })}
      {/* step 3: switching costs relearning; architecture and budget stay */}
      <Show on={on(3)} style={{ position: 'absolute', left: 0, top: SY, width: W, height: H - SY, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 34 }}>
        {[
          ['RefreshCw', 'Relearn', 'spin', colors.accent],
          ['Blocks', 'Architecture', 'breathe', colors.brand],
          ['Wallet', 'Budget', 'breathe', colors.brand],
        ].map(([ic, label, loop, tone], i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 40, height: 40, borderRadius: 12, ...TILE_SKIN, boxShadow: litRing(lit(3), TILE_SKIN.boxShadow as string), color: tone }}>
              <span className={lc(loop)} style={{ display: 'grid', ...lv(i * 0.5, loop === 'spin' ? 4 : 3) }}>
                <Icon name={ic} size={20} />
              </span>
            </span>
            <span style={tag(15, colors.ink)}>{label}</span>
            {i > 0 && (
              <span style={{ display: 'grid', placeItems: 'center', width: 20, height: 20, borderRadius: 99, background: colors.success, color: colors.white }}>
                <Icon name="Check" size={13} />
              </span>
            )}
          </div>
        ))}
      </Show>
    </Frame>
  )
}

/** a console menu sketch in one of three arrangements (sidebar, top tabs, right rail) */
function Menu({ layout, lit, d }: { layout: 'side' | 'top' | 'rail'; lit: boolean; d: number }) {
  const bar = (w: number, k: number) => <span key={k} className={lc('shim')} style={{ display: 'block', width: w, height: 7, borderRadius: 4, background: lit ? colors.accent : '#C9D5EC', transition: `background 420ms ${EASE}`, ...lv(d + k * 0.3, 2.6) }} />
  if (layout === 'side')
    return <div style={{ position: 'absolute', left: 12, top: 52, bottom: 12, width: 32, display: 'flex', flexDirection: 'column', gap: 11, paddingTop: 4 }}>{[28, 22, 26, 18, 24].map(bar)}</div>
  if (layout === 'top')
    return <div style={{ position: 'absolute', left: 14, right: 14, top: 52, height: 24, display: 'flex', alignItems: 'center', gap: 10 }}>{[30, 22, 34, 26].map(bar)}</div>
  return <div style={{ position: 'absolute', right: 12, top: 52, bottom: 12, width: 24, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 11, paddingTop: 4 }}>{[22, 16, 20, 14, 18].map(bar)}</div>
}

/* ================================================================== slide 36 · C_T23B */

function C_T23B({ step }: { step: number }) {
  const held = useHeld()
  const t = useClock(0)
  const lit = (i: number) => step === i && !held
  const on = (i: number) => held || step >= i
  const W = 960
  const H = 300
  const REAL: [string, string][] = [
    ['BadgeDollarSign', 'Pricing'],
    ['Globe', 'Regions'],
    ['Sprout', 'Maturity'],
    ['GraduationCap', 'Skills'],
  ]
  const COS: [string, string][] = [
    ['Tag', 'Naming'],
    ['LayoutDashboard', 'Layout'],
  ]
  /* the real factors: a 2 x 2 grid on the left, top band */
  const GX = [56, 176]
  const GY = [10, 98]
  const TOP_Y = 92 // the band's centre line
  /* the funnel */
  const FX = 330
  const FW = 150
  const FY = 22
  const FH = 140
  /* the choice */
  const CX = 760
  const CW = 180
  /* the cosmetic pair, bottom band */
  const LOW_Y = 252
  const LX = [56, 176]
  const TX = 560
  const TW = 380
  return (
    <Frame w={W} h={H}>
      {/* real factors */}
      {REAL.map(([ic, label], i) => (
        <Show key={label} on={on(1)} delay={i * 130} style={{ position: 'absolute', inset: 0 }}>
          <Tagged cx={GX[i % 2]} top={GY[Math.floor(i / 2)]} label={label} w={110}>
            <Glyph icon={ic} size={48} loop={['pop', 'spin', 'grow', 'bob'][i]} d={i * 0.4} t={[2.4, 9, 2.8, 2.2][i]} lit={lit(1)} />
          </Tagged>
        </Show>
      ))}
      <Arrow x1={238} y1={TOP_Y} x2={FX + 6} y2={TOP_Y} on={on(1)} lit={lit(1)} />
      {/* the funnel: a filter the four pass through */}
      <Show on={on(1)} style={{ position: 'absolute', left: FX, top: FY, width: FW, height: FH }}>
        <svg width={FW} height={FH} viewBox={`0 0 ${FW} ${FH}`} aria-hidden style={{ display: 'block', overflow: 'visible' }}>
          <defs>
            <linearGradient id="cq-funnel" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#5B86FF" />
              <stop offset="1" stopColor={colors.brandDark} />
            </linearGradient>
          </defs>
          <path d={`M 4 6 L ${FW - 40} ${FH / 2 - 16} L ${FW - 4} ${FH / 2 - 16} L ${FW - 4} ${FH / 2 + 16} L ${FW - 40} ${FH / 2 + 16} L 4 ${FH - 6} Z`} fill="url(#cq-funnel)" stroke={lit(1) ? colors.accent : 'none'} strokeWidth={3} strokeLinejoin="round" />
        </svg>
        <span style={{ position: 'absolute', left: 30, top: FH / 2 - 14, color: colors.white, display: 'grid' }}>
          <span className={lc('pulse')} style={{ display: 'grid', ...lv(0, 1.6) }}>
            <Icon name="Filter" size={28} />
          </span>
        </span>
      </Show>
      <Arrow x1={FX + FW + 8} y1={TOP_Y} x2={CX - 10} y2={TOP_Y} on={on(1)} delay={260} lit={lit(1)} />
      {/* the choice */}
      <Panel x={CX} y={TOP_Y - 70} w={CW} h={140} on={on(1)} lit={lit(1)}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 56, height: 56, borderRadius: 99, background: colors.success, color: colors.white }}>
            <span aria-hidden className={lc('ping')} style={{ position: 'absolute', inset: 0, borderRadius: 99, boxShadow: `0 0 0 2px ${colors.success}`, ...lv(0, 2.4) }} />
            <span className={lc('pop')} style={{ display: 'grid', ...lv(0.6, 2.4) }}>
              <Icon name="CircleCheckBig" size={30} />
            </span>
          </span>
          <span style={tag(16, colors.ink)}>Provider Choice</span>
        </div>
      </Panel>
      {/* tokens flowing through: the real factors reach the choice */}
      {on(1) &&
        REAL.map(([ic], i) => <Dot key={`r${i}`} x1={248} y1={TOP_Y} x2={CX - 14} y2={TOP_Y} t={t} period={5.6} phase={i * 1.4} ride={0.4} icon={ic} size={14} />)}

      {/* cosmetic: turned aside into familiarity */}
      {COS.map(([ic, label], i) => (
        <Show key={label} on={on(2)} delay={i * 130} style={{ position: 'absolute', inset: 0 }}>
          <Tagged cx={LX[i]} top={LOW_Y - 52} label={label} w={110}>
            <Glyph icon={ic} size={48} tone="#6B7489" loop="flip" d={i * 1.2} t={3.6} lit={lit(2)} />
          </Tagged>
        </Show>
      ))}
      <Arrow x1={238} y1={LOW_Y - 28} x2={TX - 10} y2={LOW_Y - 28} on={on(2)} color="#8792A8" lit={lit(2)} />
      <Panel x={TX} y={LOW_Y - 70} w={TW} h={84} on={on(2)} lit={lit(2)} tint="linear-gradient(180deg, #FFFFFF 0%, #F3F5F9 100%)">
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <span style={{ display: 'grid', placeItems: 'center', width: 44, height: 44, borderRadius: 13, background: '#8792A8', color: colors.white }}>
            <span className={lc('breathe')} style={{ display: 'grid', ...lv(0, 3) }}>
              <Icon name="BookOpen" size={22} />
            </span>
          </span>
          <span style={tag(17, '#4A5468')}>Familiarity</span>
        </div>
      </Panel>
      {on(2) && COS.map(([ic], i) => <Dot key={`c${i}`} x1={248} y1={LOW_Y - 28} x2={TX - 14} y2={LOW_Y - 28} t={t} period={4.2} phase={i * 2.1} ride={0.45} icon={ic} size={14} tone="#8792A8" />)}
    </Frame>
  )
}

/* ------------------------------------------------------------------ exports */

export const figures: Record<string, Fig> = {
  B_T15B: B_T15B as unknown as Fig,
  B_T16: B_T16 as unknown as Fig,
  C_T21: C_T21 as unknown as Fig,
  C_T22: C_T22 as unknown as Fig,
  C_T23: C_T23 as unknown as Fig,
  C_T23B: C_T23B as unknown as Fig,
}

/* the loop vocabulary (transform / opacity only), held still on ?still, thumbnails and reduced motion */
export const css = `
.cq { animation-delay: var(--cq-d, 0s); }
@keyframes cq-breathe { 0%, 100% { transform: translateY(0) scale(1) } 50% { transform: translateY(-2.5px) scale(1.07) } }
.cq-breathe { animation: cq-breathe var(--cq-t, 3.2s) cubic-bezier(0.45,0,0.55,1) infinite; transform-origin: center; }
@keyframes cq-bob { 0%, 100% { transform: translateY(-2.5px) } 50% { transform: translateY(2.5px) } }
.cq-bob { animation: cq-bob var(--cq-t, 2.2s) ease-in-out infinite; }
@keyframes cq-pulse { 0%, 100% { transform: scale(0.94) } 50% { transform: scale(1.07) } }
.cq-pulse { animation: cq-pulse var(--cq-t, 1.8s) ease-in-out infinite; transform-origin: center; }
@keyframes cq-pop { 0%, 64%, 100% { transform: scale(1) } 76% { transform: scale(1.2) } 88% { transform: scale(0.97) } }
.cq-pop { animation: cq-pop var(--cq-t, 2.4s) ease-in-out infinite; transform-origin: center; }
@keyframes cq-grow { 0%, 100% { transform: translateY(1px) scale(0.92) } 50% { transform: translateY(-1px) scale(1.08) } }
.cq-grow { animation: cq-grow var(--cq-t, 2.8s) ease-in-out infinite; transform-origin: 50% 90%; }
@keyframes cq-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
.cq-spin { animation: cq-spin var(--cq-t, 8s) linear infinite; transform-origin: center; }
@keyframes cq-rock { 0%, 100% { transform: rotate(-7deg) } 50% { transform: rotate(7deg) } }
.cq-rock { animation: cq-rock var(--cq-t, 3.2s) ease-in-out infinite; transform-origin: 50% 30%; }
@keyframes cq-wave { 0%, 100% { transform: rotate(-10deg) } 50% { transform: rotate(12deg) } }
.cq-wave { animation: cq-wave var(--cq-t, 2.6s) ease-in-out infinite; transform-origin: 20% 80%; }
@keyframes cq-flip { 0%, 40%, 100% { transform: rotateY(0deg) } 60%, 80% { transform: rotateY(180deg) } }
.cq-flip { animation: cq-flip var(--cq-t, 3.6s) cubic-bezier(0.65,0,0.35,1) infinite; transform-origin: center; }
@keyframes cq-labelflip { 0%, 72%, 100% { transform: rotateX(0deg) } 82% { transform: rotateX(90deg) } 92% { transform: rotateX(0deg) } }
.cq-labelflip { animation: cq-labelflip var(--cq-t, 4.2s) cubic-bezier(0.65,0,0.35,1) infinite; transform-origin: 50% 50%; }
@keyframes cq-shim { 0%, 100% { opacity: 0.45 } 50% { opacity: 0.95 } }
.cq-shim { animation: cq-shim var(--cq-t, 2.4s) ease-in-out infinite; }
@keyframes cq-ping { 0% { transform: scale(0.85); opacity: 0.7 } 100% { transform: scale(1.6); opacity: 0 } }
.cq-ping { animation: cq-ping var(--cq-t, 2.4s) ease-out infinite; opacity: 0; }
@keyframes cq-sweep { from { transform: translateX(-40px) } to { transform: translateX(var(--cq-x, 200px)) } }
.cq-sweep { animation: cq-sweep var(--cq-t, 2.2s) ease-in-out infinite; }
@keyframes cq-dash { 0%, 100% { opacity: 0.55 } 50% { opacity: 1 } }
.cq-dash { animation: cq-dash var(--cq-t, 1.2s) ease-in-out infinite; }
.cc-still .cq, .deck-thumb .cq { animation: none !important; }
.cc-still .cq-ping, .deck-thumb .cq-ping, .cc-still .cq-sweep, .deck-thumb .cq-sweep { opacity: 0 !important; }
.cc-still .cq-shim, .deck-thumb .cq-shim { opacity: 0.7 !important; }
@media (prefers-reduced-motion: reduce) {
  .cq { animation: none !important; }
  .cq-ping, .cq-sweep { opacity: 0 !important; }
}
/* card-group figures (slides 33, 34) stand on their own, no stage card behind them (Session 9 rule) */
[data-group]:has(> .cq-bare), [data-group]:has(> * > .cq-bare) { background: none !important; box-shadow: none !important; border-color: transparent !important; }
`
