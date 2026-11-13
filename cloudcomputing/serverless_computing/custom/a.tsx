import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { TILE_SKIN } from '@/decks/figures/card'
import { Arrow } from '@/decks/figures/scene'
import { MOTION, motionHeld } from '@/motion/tokens'
import { litRing } from '@/decks/figures/net/frames'
import * as K from '@/decks/figures/d3/kit'
import { Icon } from '@/engine/icon'
import lambdaMark from '../images/aws-lambda.svg'
import lambdaFn from '../images/aws-lambda-function.svg'
import apigwMark from '../images/aws-api-gateway.svg'
import s3Mark from '../images/aws-s3.svg'
import ec2Mark from '../images/aws-ec2.svg'
import ec2Inst from '../images/aws-ec2-instance.svg'

/*
 * BUILDER A · Serverless Computing (Session 10), sections 1 and 2: slides 6, 8, 9, 12, 14, 15, 17, 18, 19.
 *
 * Built to Session 9's final review state from the first draft (generate-slides standing corrections 13-14, cloud
 * course R10-R11): icon-first visuals with no chips, number badges or connector-line labels (a 1-3 word TR label only
 * where an icon alone is ambiguous), a quiet loop or micro-animation on every visual after its build, official AWS marks
 * on white tiles that never move, equal padding on all four sides, no wrapper card round a card pair, straight arrows.
 *
 * Each figure takes the slide's `step` (0 = nothing pressed, n = whole; on a points slide step i is the part of point
 * i, lit while it is the current press). Loops are CSS (`.ax` classes in `css` below, transform / opacity only) or a
 * small rAF clock (`useClock`, wall-clock seconds, never paused); both hold still on `?still` (`.cc-still`), in picker
 * thumbnails / instant renders and under prefers-reduced-motion, where the frame shows the meaningful end state with
 * nothing lit. Labels are DOM text in TR words.
 */

const EASE = MOTION.ease
const useHeld = () => motionHeld(useInstant())

/* ------------------------------------------------------------------ loop vocabulary */

const lc = (kind: string) => `ax ax-${kind}`
const lv = (d = 0, t?: number, extra: Record<string, string | number> = {}): CSSProperties => ({ ['--ax-d' as string]: `${-d}s`, ...(t ? { ['--ax-t' as string]: `${t}s` } : {}), ...extra }) as CSSProperties

/** a rAF clock in seconds, frozen at `hold` on held frames */
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

/* ------------------------------------------------------------------ shared pieces */

function Show({ on, children, style, delay = 0 }: { on: boolean; children: ReactNode; style?: CSSProperties; delay?: number }) {
  const instant = useInstant()
  return (
    <div
      style={{
        opacity: on ? 1 : 0,
        transform: on ? 'none' : 'translateY(6px)',
        transition: instant ? 'none' : `opacity ${MOTION.reveal}ms ${EASE} ${on ? delay : 0}ms, transform ${MOTION.reveal}ms ${EASE} ${on ? delay : 0}ms`,
        pointerEvents: on ? undefined : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** a zero-size anchor at (x, y) that centres its child on that point */
const C = ({ x, y, children, z = 6 }: { x: number; y: number; children: ReactNode; z?: number }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: 0, height: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: z }}>{children}</div>
)

/** the figure's own w x h box, centred in the stage */
const Frame = ({ w, h, children, bare = false }: { w: number; h: number; children: ReactNode; bare?: boolean }) => (
  <div className={bare ? 'ax-bare' : undefined} style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
    <div style={{ position: 'relative', width: w, height: h }}>{children}</div>
  </div>
)

const flex = (gap: number, dir: 'row' | 'column' = 'row', extra: CSSProperties = {}): CSSProperties => ({ display: 'flex', flexDirection: dir, alignItems: 'center', gap, ...extra })
const heading = (size: number, color: string = colors.ink): CSSProperties => ({ fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 600, fontSize: size, lineHeight: 1.2, color })
const small = (color: string = colors.muted, size = 14): CSSProperties => ({ fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 600, fontSize: size, lineHeight: 1.15, color, whiteSpace: 'nowrap' })
const mono = (size = 14, color: string = '#1D3FD6'): CSSProperties => ({ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontWeight: 600, fontSize: size, lineHeight: 1.2, color, whiteSpace: 'nowrap' })

/** an official AWS mark on its white tile (rule 54); marks never animate */
function MarkTile({ src, size = 56 }: { src: string; size?: number }) {
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: Math.round(size * 0.27), ...TILE_SKIN, flexShrink: 0 }}>
      <img src={src} alt="" aria-hidden draggable={false} style={{ width: Math.round(size * 0.74), height: 'auto', display: 'block' }} />
    </span>
  )
}

/** a lucide glyph on a soft clay tile; `loop` puts a CSS loop on the glyph only */
function GlyphTile({ icon, size = 40, tone = colors.brand, bg, loop, d = 0, t }: { icon: string; size?: number; tone?: string; bg?: string; loop?: string; d?: number; t?: number }) {
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: Math.round(size * 0.27), ...TILE_SKIN, ...(bg ? { background: bg } : {}), color: tone, flexShrink: 0 }}>
      <span className={loop ? lc(loop) : undefined} style={{ display: 'grid', placeItems: 'center', ...lv(d, t) }}>
        <Icon name={icon} size={Math.round(size * 0.5)} />
      </span>
    </span>
  )
}

/** a white card that rings while it is the part being explained */
function Panel({ x, y, w, h, lit = false, on = true, radius = 16, children, style, delay = 0 }: { x: number; y: number; w: number; h: number; lit?: boolean; on?: boolean; radius?: number; children?: ReactNode; style?: CSSProperties; delay?: number }) {
  const instant = useInstant()
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: radius, ...TILE_SKIN, boxShadow: litRing(lit, TILE_SKIN.boxShadow as string), transition: instant ? 'none' : `box-shadow 420ms ${EASE}`, ...style }} />
      <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
    </Show>
  )
}

/** a radar ping ring behind a centred element */
const Ping = ({ size, c = colors.brand, d = 0, t = 2.4 }: { size: number; c?: string; d?: number; t?: number }) => (
  <span aria-hidden className={lc('ping')} style={{ position: 'absolute', left: '50%', top: '50%', width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, borderRadius: 999, boxShadow: `0 0 0 2px ${c}`, ...lv(d, t) }} />
)

/** a status LED that blinks on its own phase */
const Led = ({ c = colors.success, d = 0, s = 7 }: { c?: string; d?: number; s?: number }) => (
  <span className={lc('blink')} style={{ display: 'block', width: s, height: s, borderRadius: 99, background: c, boxShadow: `0 0 6px ${c}`, ...lv(d) }} />
)

/** a small server box: chassis with LEDs and a vent line */
function MiniServer({ w = 46, tone = colors.brand, leds = true, d = 0, dim = false }: { w?: number; tone?: string; leds?: boolean; d?: number; dim?: boolean }) {
  const h = Math.round(w * 0.42)
  return (
    <span style={{ position: 'relative', display: 'block', width: w, height: h, borderRadius: 6, background: dim ? '#C9D3E6' : `linear-gradient(180deg, ${tone} 0%, ${colors.brandDark} 100%)`, boxShadow: `inset 0 2px 0 rgba(255,255,255,0.35), 0 6px 10px -6px rgba(16,32,58,0.5)` }}>
      <span style={{ position: 'absolute', left: 6, top: '50%', marginTop: -1.5, width: w * 0.42, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.45)' }} />
      {leds && (
        <span style={{ position: 'absolute', right: 6, top: '50%', marginTop: -3, ...flex(3) }}>
          <Led d={d} s={5} />
          <Led d={d + 0.7} c="#7FD3FF" s={5} />
        </span>
      )}
    </span>
  )
}

/** the point at fraction k along a polyline */
function along(points: [number, number][], k: number): [number, number] {
  const seg = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]))
  const total = seg.reduce((a, b) => a + b, 0)
  let d = Math.max(0, Math.min(1, k)) * total
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i]) {
      const tt = seg[i] ? d / seg[i] : 0
      return [points[i][0] + (points[i + 1][0] - points[i][0]) * tt, points[i][1] + (points[i + 1][1] - points[i][1]) * tt]
    }
    d -= seg[i]
  }
  return points[points.length - 1]
}

/**
 * A flow dot riding a polyline on the wall clock: one ride per `period` seconds, `ride` of it moving, then gone until
 * the next cycle (no rest beat longer than the gap the action needs). Nothing on held frames.
 */
function LoopDot({ points, t, period, phase = 0, ride = 0.6, tone = colors.brand, size = MOTION.flow.dot + 2, icon, square = false }: { points: [number, number][]; t: number; period: number; phase?: number; ride?: number; tone?: string; size?: number; icon?: string; square?: boolean }) {
  const held = useHeld()
  if (held) return null
  const u = (((t - phase) % period) + period) % period / period
  if (u > ride) return null
  const k = u / ride
  const [x, y] = along(points, k)
  const op = k < 0.1 ? k / 0.1 : k > 0.9 ? (1 - k) / 0.1 : 1
  const s = icon ? size + 10 : size
  return (
    <span aria-hidden style={{ position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, borderRadius: square ? 4 : 99, background: tone, opacity: op, display: 'grid', placeItems: 'center', color: colors.white, boxShadow: `0 0 0 4px ${tone}33, 0 6px 12px -6px ${tone}`, zIndex: 8 }}>
      {icon && <Icon name={icon} size={Math.round(s * 0.6)} />}
    </span>
  )
}

/** a 0..1 pulse that peaks at `at` seconds into each `period` and lasts `len` seconds */
const flash = (t: number, period: number, at: number, len = 0.7) => {
  const u = (((t - at) % period) + period) % period
  return u < len ? Math.sin((u / len) * Math.PI) : 0
}

/** a coin dropping into a slot on a loop (CSS) */
function CoinDrop({ d = 0, t = 1.8, w = 18 }: { d?: number; t?: number; w?: number }) {
  return (
    <span style={{ position: 'relative', display: 'block', width: w + 8, height: 40 }}>
      <span className={lc('drop')} style={{ position: 'absolute', left: 4, top: 0, ...lv(d, t) }}>
        <K.ClayCoin w={w} />
      </span>
    </span>
  )
}

/* ================================================================== T01 · the serverless umbrella (580 x 310) */

function A_T01({ step }: { step: number }) {
  const held = useHeld()
  const lit = (i: number) => step === i && !held
  const t = useClock(0)
  const W = 580
  const H = 310
  /* two service boxes under the canopy, then the shared strip under both */
  const BW = 236
  const BH = 124
  const BX = [20, W - 20 - BW]
  const BY = 100
  return (
    <Frame w={W} h={H}>
      {/* the canopy: a domed umbrella that sways slightly, the word on it */}
      <div className={lc('sway')} style={{ position: 'absolute', left: W / 2 - 150, top: 8, width: 300, height: 74, transformOrigin: '50% 100%', ...lv(0, 4) }}>
        <svg width={300} height={74} viewBox="0 0 300 74" style={{ position: 'absolute', inset: 0 }} aria-hidden>
          <defs>
            <linearGradient id="a01-can" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#5B86FF" />
              <stop offset="1" stopColor={colors.brandDark} />
            </linearGradient>
          </defs>
          <path d="M6 68 Q 150 -36 294 68 Q 270 58 246 68 Q 222 58 198 68 Q 174 58 150 68 Q 126 58 102 68 Q 78 58 54 68 Q 30 58 6 68 Z" fill="url(#a01-can)" />
          <path d="M150 6 L 150 68" stroke="rgba(255,255,255,0.28)" strokeWidth={2} />
          <path d="M78 22 Q 100 44 102 68 M222 22 Q 200 44 198 68" stroke="rgba(255,255,255,0.22)" strokeWidth={2} fill="none" />
        </svg>
        <span style={{ position: 'absolute', left: 0, right: 0, top: 30, textAlign: 'center', ...heading(20, colors.white) }}>Serverless</span>
      </div>
      {/* the shaft from the canopy down between the two boxes, branching into each */}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }} aria-hidden>
        <path d={`M ${W / 2} 80 L ${W / 2} 90 M ${BX[0] + BW / 2} ${BY} L ${BX[0] + BW / 2} 90 L ${BX[1] + BW / 2} 90 L ${BX[1] + BW / 2} ${BY}`} stroke={colors.line} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* FaaS: an event bolt drops into the Lambda function, which lights while it runs */}
      <Panel x={BX[0]} y={BY} w={BW} h={BH} lit={lit(1)} on={step >= 1}>
        <div style={{ position: 'absolute', left: 18, top: 16, ...flex(10) }}>
          <MarkTile src={lambdaMark} size={44} />
          <span style={heading(19)}>FaaS</span>
        </div>
        <div style={{ position: 'absolute', left: 18, bottom: 14, right: 18, ...flex(10, 'row', { justifyContent: 'space-between' }) }}>
          <span style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
            <GlyphTile icon="Zap" size={40} tone={colors.accent} loop="pop" t={2.4} />
          </span>
          <span style={{ flex: 1, height: 3, borderRadius: 3, background: colors.line, position: 'relative', overflow: 'hidden' }}>
            <span className={lc('sweep')} style={{ position: 'absolute', left: 0, top: 0, width: 40, height: 3, background: colors.accent, ...lv(0, 2.4, { '--ax-x': '120px' }) }} />
          </span>
          <span style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
            <GlyphTile icon="Code" size={40} loop="pulse" t={1.2} />
          </span>
        </div>
        {step >= 4 && (
          <C x={BW - 38} y={38} z={9}>
            <span className={lc('bob')} style={{ display: 'grid', ...lv(0, 2) }}>
              <GlyphTile icon="FileCode" size={36} tone={colors.brandDark} />
            </span>
          </C>
        )}
      </Panel>

      {/* BaaS: database, lock and folder, each breathing on its own phase */}
      <Panel x={BX[1]} y={BY} w={BW} h={BH} lit={lit(2)} on={step >= 2}>
        <div style={{ position: 'absolute', left: 18, top: 16, ...flex(10) }}>
          <GlyphTile icon="Boxes" size={44} tone={colors.brandDark} />
          <span style={heading(19)}>BaaS</span>
        </div>
        <div style={{ position: 'absolute', left: 18, bottom: 14, right: 18, ...flex(10, 'row', { justifyContent: 'space-between' }) }}>
          <GlyphTile icon="Database" size={40} loop="bob" d={0} />
          <GlyphTile icon="Lock" size={40} loop="pulse" d={0.5} />
          <GlyphTile icon="Folder" size={40} loop="bob" d={1.1} />
        </div>
        {step >= 4 && (
          <C x={BW - 38} y={38} z={9}>
            <span className={lc('bob')} style={{ display: 'grid', ...lv(0.8, 2) }}>
              <GlyphTile icon="Settings2" size={36} tone={colors.brandDark} />
            </span>
          </C>
        )}
      </Panel>

      {/* the shared strip under both: no server to manage, the provider owning provisioning, patching and capacity */}
      <Show on={step >= 1} style={{ position: 'absolute', left: 20, top: 240, width: W - 40, height: 60 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 16, background: 'linear-gradient(180deg, #F2F6FF 0%, #E3EBFD 100%)', boxShadow: litRing(lit(3), 'inset 0 0 0 1.5px #CFDCF5') }} />
        <div style={{ position: 'absolute', left: 16, top: 0, bottom: 0, ...flex(12) }}>
          <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 40, height: 40, borderRadius: 11, background: colors.white, color: colors.muted, boxShadow: 'inset 0 0 0 1.5px #CFDCF5' }}>
            <span className={lc('pulse')} style={{ display: 'grid', ...lv(0, 2.2) }}>
              <Icon name="ServerOff" size={21} />
            </span>
          </span>
          <span style={heading(17, colors.brandDark)}>No Server To Manage</span>
        </div>
        <Show on={step >= 3} style={{ position: 'absolute', right: 14, top: 0, bottom: 0, ...flex(10) }}>
          <span style={{ display: 'grid', placeItems: 'center', color: colors.brand }}>
            <Icon name="Cloud" size={26} />
          </span>
          <GlyphTile icon="ServerCog" size={38} loop="pulse" d={0.2} />
          <GlyphTile icon="RefreshCw" size={38} loop="turn" t={3} />
          <GlyphTile icon="Gauge" size={38} loop="rock" d={0.6} />
        </Show>
      </Show>
      {/* an event riding into the function on a loop (always after point 1) */}
      {step >= 1 && <LoopDot t={t} period={2.4} phase={0} ride={0.55} tone={colors.accent} points={[[BX[0] + 70, BY + BH - 34], [BX[0] + BW - 70, BY + BH - 34]]} size={9} />}
    </Frame>
  )
}

/* ================================================================== T02 · the Lambda function page: what disappears (580 x 320) */

function ConsoleRow({ icon, label, struck, children, y }: { icon: string; label: string; struck?: boolean; children?: ReactNode; y: number }) {
  return (
    <div style={{ position: 'absolute', left: 16, right: 16, top: y, height: 44, borderRadius: 10, background: struck ? '#F6F8FC' : colors.white, boxShadow: 'inset 0 0 0 1.5px #E1E8F5', ...flex(10, 'row', { padding: '0 12px', boxSizing: 'border-box' }) }}>
      <span style={{ color: struck ? colors.muted : colors.brand, display: 'grid' }}>
        <Icon name={icon} size={18} />
      </span>
      <span style={{ position: 'relative', ...small(struck ? colors.muted : colors.ink, 15) }}>
        {label}
        {struck && <span aria-hidden style={{ position: 'absolute', left: -2, right: -2, top: '52%', height: 2, borderRadius: 2, background: colors.danger }} />}
      </span>
      <span style={{ marginLeft: 'auto', ...flex(6) }}>{children}</span>
    </div>
  )
}

function A_T02({ step }: { step: number }) {
  const held = useHeld()
  const lit = (i: number) => step === i && !held
  const t = useClock(0)
  const W = 580
  const H = 320
  const CW = 330
  /* three invocations a cycle: each one gets its capacity block, which leaves when it ends */
  const P = 4.2
  const ev = [0.3, 1.7, 2.9]
  const blk = ev.map((a) => (held ? 1 : flash(t, P, a, 1.1)))
  return (
    <Frame w={W} h={H}>
      {/* the console page sketch */}
      <div style={{ position: 'absolute', left: 16, top: 16, width: CW, height: H - 32, borderRadius: 16, ...TILE_SKIN, overflow: 'hidden' }}>
        <div style={{ height: 30, background: '#232F3E', ...flex(5, 'row', { paddingLeft: 12 }) }}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
            <span key={c} style={{ width: 7, height: 7, borderRadius: 9, background: c }} />
          ))}
        </div>
        <div style={{ position: 'absolute', left: 16, top: 44, ...flex(10) }}>
          <MarkTile src={lambdaMark} size={40} />
          <span style={mono(15, colors.ink)}>s10-serverless-demo</span>
        </div>
        <ConsoleRow y={100} icon="FileCode" label="Code">
          <span className={lc('blink')} style={{ width: 8, height: 16, borderRadius: 2, background: colors.brand, ...lv(0, 1.2) }} />
        </ConsoleRow>
        <ConsoleRow y={152} icon="Server" label="No Instance Type" struck>
          <span style={{ color: colors.danger, display: 'grid' }}>
            <Icon name="Ban" size={18} />
          </span>
        </ConsoleRow>
        <ConsoleRow y={204} icon="Wrench" label="No OS To Patch" struck>
          <span style={{ color: colors.danger, display: 'grid' }}>
            <Icon name="Ban" size={18} />
          </span>
        </ConsoleRow>
      </div>

      {/* the provider side: three tiles, one per point */}
      {[
        { y: 16, on: step >= 1, l: lit(1) },
        { y: 16 + 96, on: step >= 2, l: lit(2) },
        { y: 16 + 192, on: step >= 3, l: lit(3) },
      ].map((r, i) => (
        <Panel key={i} x={CW + 32} y={r.y} w={W - CW - 48} h={80} lit={r.l} on={r.on}>
          {i === 0 && (
            <div style={{ position: 'absolute', inset: 0, ...flex(12, 'row', { justifyContent: 'center' }) }}>
              <span style={{ display: 'grid', placeItems: 'center', color: colors.brand }}>
                <Icon name="Cloud" size={28} />
              </span>
              <GlyphTile icon="RefreshCw" size={42} loop="turn" t={3} />
              <span style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
                <Ping size={42} c={colors.success} t={3} d={-1.5} />
                <GlyphTile icon="ShieldCheck" size={42} tone={colors.success} />
              </span>
            </div>
          )}
          {i === 1 && (
            <div style={{ position: 'absolute', inset: 0, ...flex(10, 'row', { justifyContent: 'center' }) }}>
              {ev.map((a, j) => (
                <span key={j} style={{ ...flex(4, 'column') }}>
                  <span style={{ color: colors.accent, display: 'grid', opacity: held ? 1 : 0.35 + 0.65 * blk[j] }}>
                    <Icon name="Zap" size={18} />
                  </span>
                  <span style={{ width: 34, height: 22, borderRadius: 6, background: `linear-gradient(180deg, #5B86FF 0%, ${colors.brandDark} 100%)`, transform: `scaleY(${held ? 1 : 0.15 + 0.85 * blk[j]})`, transformOrigin: 'bottom', boxShadow: '0 6px 10px -6px rgba(31,69,200,0.8)' }} />
                </span>
              ))}
            </div>
          )}
          {i === 2 && (
            <div style={{ position: 'absolute', inset: 0, ...flex(14, 'row', { justifyContent: 'center' }) }}>
              <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 44, height: 44 }}>
                <GlyphTile icon="Coins" size={44} tone={colors.muted} />
                <span aria-hidden style={{ position: 'absolute', left: 4, right: 4, top: '50%', height: 3, borderRadius: 3, background: colors.danger, transform: 'rotate(-35deg)' }} />
              </span>
              <span className={lc('rest')} style={{ display: 'grid', color: colors.muted, ...lv(0, 3) }}>
                <Icon name="Moon" size={26} />
              </span>
            </div>
          )}
        </Panel>
      ))}
      {/* the provider's patch reaching the OS row it removed from the page */}
      {step >= 1 && <LoopDot t={t} period={3} ride={0.5} tone={colors.success} points={[[CW + 32, 56], [CW + 6, 56], [CW + 6, 245], [CW - 20, 245]]} size={9} />}
    </Frame>
  )
}

/* ================================================================== T03 · always-on bar vs spikes on events (560 x 320) */

function A_T03({ step }: { step: number }) {
  const held = useHeld()
  const lit = (i: number) => step === i && !held
  const W = 560
  const H = 320
  const t = useClock(0)
  const X0 = 112
  const X1 = W - 20
  const SPAN = X1 - X0
  const PERIOD = 6
  const head = held ? 1 : (t % PERIOD) / PERIOD
  const hx = X0 + head * SPAN
  const EV = [0.12, 0.38, 0.57, 0.84]
  const SW = 28
  const L1 = 70
  const L2 = 196
  return (
    <Frame w={W} h={H}>
      {/* lane labels: the two compute shapes */}
      <div style={{ position: 'absolute', left: 16, top: L1 - 30, width: 84, ...flex(4, 'column') }}>
        <MarkTile src={ec2Inst} size={38} />
        <span style={small(colors.ink)}>Server</span>
      </div>
      <div style={{ position: 'absolute', left: 16, top: L2 - 34, width: 84, ...flex(4, 'column') }}>
        <MarkTile src={lambdaFn} size={38} />
        <span style={small(colors.ink)}>Function</span>
      </div>

      {/* lane 1: one flat continuous bar, busy or idle */}
      <div style={{ position: 'absolute', left: X0, top: L1 - 14, width: SPAN, height: 28, borderRadius: 9, background: `linear-gradient(180deg, #5B86FF 0%, ${colors.brandDark} 100%)`, overflow: 'hidden', boxShadow: litRing(lit(1), '0 8px 14px -10px rgba(31,69,200,0.8)') }}>
        <span className={lc('sweep')} style={{ position: 'absolute', left: 0, top: 0, width: 80, height: 28, background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0) 100%)', ...lv(0, 3, { '--ax-x': `${SPAN}px` }) }} />
      </div>
      {/* lane 2: an empty baseline between events */}
      <div style={{ position: 'absolute', left: X0, top: L2 + 20, width: SPAN, height: 3, borderRadius: 3, background: lit(1) ? colors.brand : colors.line }} />
      {/* the spikes: one short run per event, with a faint warm tail after it (point 4) */}
      {EV.map((e, i) => {
        const x = X0 + e * SPAN - SW / 2
        const pass = held ? 0 : Math.max(0, 1 - Math.abs(head - e) * SPAN / 26)
        return (
          <Show key={i} on={step >= 2} delay={i * 80}>
            {step >= 4 && <span aria-hidden style={{ position: 'absolute', left: x + SW - 2, top: L2 - 2, width: 30, height: 22, borderRadius: '0 8px 8px 0', background: 'linear-gradient(90deg, rgba(45,99,251,0.22), rgba(45,99,251,0))' }} />}
            <span style={{ position: 'absolute', left: x, top: L2 - 34, width: SW, height: 54, borderRadius: 8, background: `linear-gradient(180deg, #FFB37A 0%, ${colors.accent} 100%)`, transform: `scaleY(${0.75 + 0.25 * pass})`, transformOrigin: 'bottom', boxShadow: litRing(lit(2), `0 8px 14px -10px ${colors.accent}`) }} />
            <span style={{ position: 'absolute', left: x + SW / 2 - 9, top: L2 - 64, color: colors.accent, display: 'grid', transform: `translateY(${-4 * pass}px)` }}>
              <Icon name="Zap" size={18} />
            </span>
          </Show>
        )
      })}

      {/* the cost line: coins under the always-on bar fall all the time, under the function only at its spikes */}
      <Show on={step >= 3} style={{ position: 'absolute', left: X0, top: 248, width: SPAN, height: 56 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 12, background: '#FFF8EC', boxShadow: litRing(lit(3), 'inset 0 0 0 1.5px #F6DFB5') }} />
        {EV.map((e, i) => {
          const pass = held ? 1 : flash(t, PERIOD, e * PERIOD - 0.1, 0.9)
          return (
            <span key={i} style={{ position: 'absolute', left: e * SPAN - 10, top: 14, opacity: held ? 1 : 0.25 + 0.75 * pass, transform: `translateY(${held ? 0 : (1 - pass) * -6}px)` }}>
              <K.ClayCoin w={22} />
            </span>
          )
        })}
      </Show>
      <div style={{ position: 'absolute', left: 16, top: 256, width: 84, ...flex(4, 'column') }}>
        <Show on={step >= 3}>
          <span style={{ display: 'grid', placeItems: 'center', color: '#C98A12' }}>
            <Icon name="Receipt" size={24} />
          </span>
        </Show>
      </div>
      {/* the time axis playhead */}
      {!held && step >= 1 && <span aria-hidden style={{ position: 'absolute', left: hx - 1, top: L1 - 24, width: 2, height: 230, borderRadius: 2, background: 'rgba(0,42,75,0.22)' }} />}
    </Frame>
  )
}

/* ================================================================== T04-B · one instance always running vs functions flashing on events (1060 x 380) */

function A_T04B({ step }: { step: number }) {
  const held = useHeld()
  const t = useClock(0)
  const W = 1060
  const H = 380
  const CW = 480
  const CH = 340
  const L = 20
  const R = W - 20 - CW
  const P = 6
  const EV = [0.4, 1.6, 2.5, 3.9, 4.8]
  const FN = [0, 2, 1, 3, 0]
  const hits = [0, 1, 2, 3].map((b) => (held ? 0 : Math.max(...EV.map((a, i) => (FN[i] === b ? flash(t, P, a, 0.9) : 0)))))
  return (
    <Frame w={W} h={H} bare>
      {/* the instance: running every second, busy or idle */}
      <Panel x={L} y={20} w={CW} h={CH} lit={step === 1 && !held} on={step >= 1} radius={20}>
        <div style={{ position: 'absolute', left: 24, top: 22, ...flex(12) }}>
          <MarkTile src={ec2Mark} size={48} />
          <span style={heading(20)}>Elastic Compute Instance</span>
        </div>
        <div style={{ position: 'absolute', left: 24, right: 24, top: 96, height: 120, borderRadius: 16, background: 'linear-gradient(180deg, #F2F6FF 0%, #E3EBFD 100%)', boxShadow: 'inset 0 0 0 1.5px #CFDCF5', ...flex(18, 'row', { justifyContent: 'center' }) }}>
          <span style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
            <MarkTile src={ec2Inst} size={72} />
          </span>
          <span style={{ ...flex(8, 'column') }}>
            <MiniServer w={150} d={0} />
            <MiniServer w={150} d={0.6} />
          </span>
        </div>
        {/* the meter: always running */}
        <div style={{ position: 'absolute', left: 24, right: 24, top: 236, height: 80, borderRadius: 16, background: '#FFF8EC', boxShadow: 'inset 0 0 0 1.5px #F6DFB5', ...flex(14, 'row', { justifyContent: 'center' }) }}>
          <span className={lc('turn')} style={{ display: 'grid', color: '#C98A12', ...lv(0, 4) }}>
            <Icon name="Timer" size={30} />
          </span>
          {[0, 1, 2, 3, 4].map((i) => (
            <CoinDrop key={i} d={i * 0.36} t={1.8} w={22} />
          ))}
        </div>
      </Panel>

      {/* the functions: each exists only while an event runs it */}
      <Panel x={R} y={20} w={CW} h={CH} lit={step === 2 && !held} on={step >= 2} radius={20}>
        <div style={{ position: 'absolute', left: 24, top: 22, ...flex(12) }}>
          <MarkTile src={lambdaMark} size={48} />
          <span style={heading(20)}>FaaS Function</span>
        </div>
        <div style={{ position: 'absolute', left: 24, right: 24, top: 96, height: 120, borderRadius: 16, background: 'linear-gradient(180deg, #F2F6FF 0%, #E3EBFD 100%)', boxShadow: 'inset 0 0 0 1.5px #CFDCF5', ...flex(22, 'row', { justifyContent: 'center' }) }}>
          {[0, 1, 2, 3].map((b) => {
            const k = held ? 1 : hits[b]
            return (
              <span key={b} style={{ ...flex(6, 'column') }}>
                <span style={{ color: colors.accent, display: 'grid', opacity: held ? 1 : 0.15 + 0.85 * k, transform: `translateY(${held ? 0 : (1 - k) * -8}px)` }}>
                  <Icon name="Zap" size={20} />
                </span>
                <span style={{ display: 'grid', placeItems: 'center', width: 64, height: 64, borderRadius: 16, background: colors.white, boxShadow: `inset 0 0 0 ${1.5 + 1.5 * k}px ${k > 0.1 ? colors.accent : '#D9E3F6'}, 0 10px 18px -12px rgba(31,64,140,0.5)`, opacity: held ? 1 : 0.35 + 0.65 * k, transform: `scale(${0.92 + 0.08 * k})` }}>
                  <img src={lambdaFn} alt="" aria-hidden draggable={false} style={{ width: 40, height: 'auto' }} />
                </span>
              </span>
            )
          })}
        </div>
        {/* the meter: a coin only while a function runs */}
        <div style={{ position: 'absolute', left: 24, right: 24, top: 236, height: 80, borderRadius: 16, background: '#FFF8EC', boxShadow: 'inset 0 0 0 1.5px #F6DFB5', ...flex(22, 'row', { justifyContent: 'center' }) }}>
          <span style={{ display: 'grid', color: '#C98A12' }}>
            <Icon name="Timer" size={30} />
          </span>
          {[0, 1, 2, 3].map((b) => {
            const k = held ? 1 : hits[b]
            return (
              <span key={b} style={{ width: 64, display: 'grid', placeItems: 'center', opacity: held ? 1 : 0.2 + 0.8 * k, transform: `translateY(${held ? 0 : (1 - k) * -10}px)` }}>
                <K.ClayCoin w={24} />
              </span>
            )
          })}
        </div>
      </Panel>
    </Frame>
  )
}

/* ================================================================== T05 · the four core pieces, TR text in each card (1060 x 340) */

type Item = { title: string; text: string; icon: string }

/* the four card icons share ONE micro-animation (user, Session 10 slide 14: no wave on only two of them) */
function PieceArt({ i }: { i: number }) {
  const float = (child: ReactNode) => (
    <span className={lc('tfloat')} style={{ display: 'grid', placeItems: 'center', ...lv(i * 0.9, 3.6) }}>
      {child}
    </span>
  )
  if (i === 0) return float(<GlyphTile icon="Zap" size={64} tone={colors.accent} />)
  if (i === 1) return float(<GlyphTile icon="FileSignature" size={64} />)
  if (i === 2) return float(<GlyphTile icon="Eraser" size={64} />)
  return float(<GlyphTile icon="Layers" size={64} />)
}

/** once every card is shown, the orange ring walks 1 -> 2 -> 3 -> 4 -> 1 forever (Session 10 slide 14) */
function useCycle(n: number, on: boolean, start: number, period = 1800) {
  const [k, setK] = useState(start)
  useEffect(() => {
    if (!on) return
    setK(start)
    const id = window.setInterval(() => setK((v) => (v + 1) % n), period)
    return () => window.clearInterval(id)
  }, [on, n, start, period])
  return k
}

function A_T05({ step, items = [] }: { step: number; items?: Item[] }) {
  const held = useHeld()
  const W = 1060
  const H = 340
  const P = 20
  const G = 20
  const CW = (W - 2 * P - (items.length - 1) * G) / Math.max(1, items.length)
  const n = items.length
  const full = n > 0 && step >= n && !held
  const cyc = useCycle(Math.max(1, n), full, n - 1)
  return (
    <Frame w={W} h={H} bare>
      {items.map((it, i) => {
        const lit = !held && (full ? cyc === i : step === i + 1)
        const on = step >= i + 1
        return (
          <Panel key={it.title} x={P + i * (CW + G)} y={P} w={CW} h={H - 2 * P} lit={lit} on={on} radius={18}>
            <div style={{ ...flex(14, 'column', { justifyContent: 'flex-start' }), height: '100%', padding: '26px 22px', boxSizing: 'border-box', textAlign: 'center' }}>
              <div style={{ display: 'grid', placeItems: 'center', height: 76 }}>
                <PieceArt i={i} />
              </div>
              <span style={heading(20, colors.brandDark)}>{it.title}</span>
              <span style={{ width: 40, height: 4, borderRadius: 4, background: colors.brand }} />
              <span style={{ fontSize: 18, lineHeight: 1.4, color: colors.ink }}>{it.text}</span>
            </div>
          </Panel>
        )
      })}
    </Frame>
  )
}

/* ================================================================== T06 · event and context in, return value out (540 x 320) */

function A_T06({ step }: { step: number }) {
  const held = useHeld()
  const lit = (i: number) => step === i && !held
  const t = useClock(0)
  const W = 540
  const H = 320
  /* the handler box in the middle; inputs on the left, the response on the right, all arrows level */
  const HX = 200
  const HW = 156
  const HY = 60
  const HH = 200
  const EY = 112
  const CY = 208
  const RY = 160
  const TW = 108
  return (
    <Frame w={W} h={H}>
      {/* event: the trigger's payload, a JSON document */}
      <Panel x={16} y={EY - 44} w={TW} h={88} lit={lit(1)} on={step >= 1}>
        <div style={{ ...flex(4, 'column', { justifyContent: 'center' }), height: '100%' }}>
          <GlyphTile icon="FileJson" size={42} loop="bob" t={2.2} />
          <span style={mono(14)}>event</span>
        </div>
      </Panel>
      {/* context: metadata about the run, an ID tag and a timer */}
      <Panel x={16} y={CY - 44} w={TW} h={88} lit={lit(2)} on={step >= 2}>
        <div style={{ ...flex(4, 'column', { justifyContent: 'center' }), height: '100%' }}>
          <span style={{ ...flex(4) }}>
            <GlyphTile icon="Fingerprint" size={34} loop="pulse" t={1.8} />
            <GlyphTile icon="Timer" size={34} loop="turn" t={4} />
          </span>
          <span style={mono(14)}>context</span>
        </div>
      </Panel>
      <Arrow x1={16 + TW + 6} y1={EY} x2={HX - 6} y2={EY} on={step >= 1} />
      <Arrow x1={16 + TW + 6} y1={CY} x2={HX - 6} y2={CY} on={step >= 2} />
      <Arrow x1={HX + HW + 6} y1={RY} x2={W - 16 - TW - 6} y2={RY} on={step >= 3} tone={colors.success} />

      {/* the handler */}
      <div style={{ position: 'absolute', left: HX, top: HY, width: HW, height: HH, borderRadius: 18, ...TILE_SKIN, boxShadow: `inset 0 0 0 2px ${colors.brand}, 0 16px 28px -16px rgba(31,64,140,0.5)`, ...flex(10, 'column', { justifyContent: 'center' }) }}>
        <span style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
          <Ping size={60} t={2.4} />
          <MarkTile src={lambdaFn} size={60} />
        </span>
        <span style={heading(18)}>Handler</span>
        <Show on={step >= 4}>
          <span style={{ display: 'inline-flex', ...flex(6), padding: '5px 10px', borderRadius: 9, background: lit(4) ? colors.brand : colors.surface2, boxShadow: `inset 0 0 0 1.5px ${colors.brand}` }}>
            <span style={mono(13, lit(4) ? colors.white : '#1D3FD6')}>file.function</span>
            <span className={lc('pop')} style={{ display: 'grid', color: lit(4) ? colors.white : colors.success, ...lv(0, 2.2) }}>
              <Icon name="Check" size={14} />
            </span>
          </span>
        </Show>
      </div>

      {/* the response: the return value handed back */}
      <Panel x={W - 16 - TW} y={RY - 44} w={TW} h={88} lit={lit(3)} on={step >= 3}>
        <div style={{ ...flex(4, 'column', { justifyContent: 'center' }), height: '100%' }}>
          <GlyphTile icon="CornerDownLeft" size={42} tone={colors.success} loop="nudge" t={2.2} />
          <span style={small(colors.ink)}>Response</span>
        </div>
      </Panel>

      {/* one call a cycle: event and context ride in together, the reply rides out */}
      {step >= 1 && <LoopDot t={t} period={3.2} ride={0.3} points={[[16 + TW + 8, EY], [HX - 10, EY]]} />}
      {step >= 2 && <LoopDot t={t} period={3.2} ride={0.3} tone={colors.brandDark} points={[[16 + TW + 8, CY], [HX - 10, CY]]} />}
      {step >= 3 && <LoopDot t={t} period={3.2} phase={1.4} ride={0.3} tone={colors.success} points={[[HX + HW + 8, RY], [W - 16 - TW - 10, RY]]} />}
    </Frame>
  )
}

/* ================================================================== T07 · sync waits, async queued (566 x 320) */

function A_T07({ step }: { step: number }) {
  const held = useHeld()
  const lit = (i: number) => step === i && !held
  const t = useClock(0)
  const W = 566
  const H = 320
  const CX = 16
  const CWd = 104
  const HX = W - 16 - 116
  const SY = 92
  const AY = 236
  const QX = 250
  const QW = 112
  return (
    <Frame w={W} h={H}>
      {/* one caller box: API Gateway (sync) above, an S3 upload (async) below */}
      <div style={{ position: 'absolute', left: CX, top: 30, width: CWd, height: 270, borderRadius: 18, ...TILE_SKIN }} />
      <div style={{ position: 'absolute', left: CX, top: SY - 44, width: CWd, ...flex(4, 'column') }}>
        <MarkTile src={apigwMark} size={52} />
        <Show on={step >= 1}>
          <span className={lc('turn')} style={{ display: 'grid', color: lit(1) ? colors.accent : colors.muted, ...lv(0, 2.4) }}>
            <Icon name="Hourglass" size={22} />
          </span>
        </Show>
      </div>
      <div style={{ position: 'absolute', left: CX, top: AY - 44, width: CWd, ...flex(4, 'column') }}>
        <MarkTile src={s3Mark} size={52} />
        <Show on={step >= 2}>
          <span className={lc('pop')} style={{ display: 'grid', color: colors.success, ...lv(0.9, 2.8) }}>
            <Icon name="CircleCheck" size={22} />
          </span>
        </Show>
      </div>

      {/* the handler */}
      <div style={{ position: 'absolute', left: HX, top: 30, width: 116, height: 270, borderRadius: 18, ...TILE_SKIN, boxShadow: `inset 0 0 0 2px ${colors.brand}, 0 16px 28px -16px rgba(31,64,140,0.5)`, ...flex(10, 'column', { justifyContent: 'center' }) }}>
        <span style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
          <Ping size={56} t={2.4} />
          <MarkTile src={lambdaFn} size={56} />
        </span>
        <span style={heading(17)}>Handler</span>
      </div>

      {/* sync: one arrow straight in, the reply straight back to the waiting caller */}
      <Arrow x1={CX + CWd + 8} y1={SY - 10} x2={HX - 8} y2={SY - 10} on={step >= 1} />
      <Arrow x1={HX - 8} y1={SY + 10} x2={CX + CWd + 8} y2={SY + 10} on={step >= 1} tone={colors.success} delay={300} />
      <C x={(CX + CWd + HX) / 2} y={SY - 38}>
        <Show on={step >= 1}>
          <span style={{ ...small(lit(1) ? colors.brandDark : colors.ink, 15) }}>Sync</span>
        </Show>
      </C>

      {/* async: into a queue, the caller gets its acknowledgement at once, the queue feeds the handler */}
      <Arrow x1={CX + CWd + 8} y1={AY} x2={QX - 8} y2={AY} on={step >= 2} />
      <Arrow x1={QX + QW + 8} y1={AY} x2={HX - 8} y2={AY} on={step >= 2} delay={300} />
      <Panel x={QX} y={AY - 34} w={QW} h={68} lit={lit(2) || lit(4)} on={step >= 2}>
        <div style={{ position: 'absolute', inset: 0, ...flex(5, 'row', { justifyContent: 'center' }) }}>
          {[0, 1, 2].map((k) => (
            <span key={k} className={step >= 4 ? lc('gather') : undefined} style={{ display: 'grid', placeItems: 'center', width: 26, height: 34, borderRadius: 6, background: colors.surface2, color: colors.brand, boxShadow: 'inset 0 0 0 1.5px #CFDCF5', ...lv(0, 3, { '--ax-gx': `${(1 - k) * 31}px` }) }}>
              <Icon name="Mail" size={14} />
            </span>
          ))}
        </div>
      </Panel>
      <C x={QX + QW / 2} y={AY - 52}>
        <Show on={step >= 2}>
          <span style={{ ...small(lit(2) ? colors.brandDark : colors.ink, 15) }}>Async</span>
        </Show>
      </C>
      {step >= 4 && (
        <C x={QX + QW / 2} y={AY + 50}>
          <span className={lc('bob')} style={{ display: 'grid', color: colors.brandDark, ...lv(0, 2.4) }}>
            <Icon name="Layers" size={22} />
          </span>
        </C>
      )}

      {/* the events: each trigger's own shape (point 3), round on the sync path and square on the async path */}
      {step >= 1 && <LoopDot t={t} period={3.6} ride={0.28} points={[[CX + CWd + 10, SY - 10], [HX - 12, SY - 10]]} size={step >= 3 ? 14 : 11} />}
      {step >= 1 && <LoopDot t={t} period={3.6} phase={1.3} ride={0.28} tone={colors.success} points={[[HX - 12, SY + 10], [CX + CWd + 10, SY + 10]]} />}
      {step >= 2 && <LoopDot t={t} period={3.6} phase={0.2} ride={0.2} tone={colors.accent} square={step >= 3} size={step >= 3 ? 14 : 11} points={[[CX + CWd + 10, AY], [QX - 10, AY]]} />}
      {step >= 2 && <LoopDot t={t} period={3.6} phase={1.9} ride={0.24} tone={step >= 4 ? colors.brandDark : colors.accent} square={step >= 3} size={step >= 4 ? 18 : step >= 3 ? 14 : 11} points={[[QX + QW + 10, AY], [HX - 12, AY]]} />}
    </Frame>
  )
}

/* ================================================================== T08 · two environments, nothing shared (566 x 320) */

function EnvBox({ x, y, w, h, lit, on, count, wiped, d }: { x: number; y: number; w: number; h: number; lit: boolean; on: boolean; count: string; wiped: number; d: number }) {
  return (
    <Panel x={x} y={y} w={w} h={h} lit={lit} on={on} radius={18}>
      <div style={{ position: 'absolute', left: 16, top: 14, ...flex(8) }}>
        <MarkTile src={lambdaFn} size={36} />
        <span style={{ display: 'grid', color: colors.brand }}>
          <Icon name="Box" size={18} />
        </span>
      </div>
      {/* inside: a variable register and a scratch folder, which a fresh environment does not have */}
      <div style={{ position: 'absolute', left: 16, right: 16, bottom: 16, height: 66, borderRadius: 12, background: 'linear-gradient(180deg, #F2F6FF 0%, #E3EBFD 100%)', boxShadow: 'inset 0 0 0 1.5px #CFDCF5', ...flex(14, 'row', { justifyContent: 'center' }) }}>
        <span style={{ ...flex(6), padding: '6px 10px', borderRadius: 9, background: colors.white, boxShadow: 'inset 0 0 0 1.5px #CFDCF5' }}>
          <span style={{ display: 'grid', color: colors.brand }}>
            <Icon name="Variable" size={16} />
          </span>
          <span style={mono(16, colors.ink)}>{count}</span>
        </span>
        <span style={{ position: 'relative', display: 'grid', placeItems: 'center', opacity: 1 - 0.7 * wiped }}>
          <GlyphTile icon="Folder" size={38} loop="bob" d={d} />
        </span>
      </div>
    </Panel>
  )
}

function A_T08({ step }: { step: number }) {
  const held = useHeld()
  const lit = (i: number) => step === i && !held
  const t = useClock(0)
  const W = 566
  const H = 320
  const EW = 200
  const EH = 150
  const EX = [16, W - 16 - EW]
  const EY = 16
  const DBY = 248
  /* one invocation a beat, landing alternately in the fresh and the reused environment (point 2) */
  const P = 4
  const wiped = held ? 0 : flash(t, 8, 1.2, 1.4)
  return (
    <Frame w={W} h={H}>
      <EnvBox x={EX[0]} y={EY} w={EW} h={EH} lit={lit(1) || lit(2)} on={step >= 1} count="1" wiped={step >= 1 ? wiped : 0} d={0} />
      <EnvBox x={EX[1]} y={EY} w={EW} h={EH} lit={lit(2)} on={step >= 1} count="1" wiped={0} d={0.7} />
      {/* no shared memory: a struck arrow between them */}
      <Show on={step >= 1} style={{ position: 'absolute', left: EX[0] + EW, top: EY, width: EX[1] - EX[0] - EW, height: EH }}>
        <Arrow x1={14} y1={EH / 2 - 8} x2={EX[1] - EX[0] - EW - 14} y2={EH / 2 - 8} on tone={colors.muted} both />
        <C x={(EX[1] - EX[0] - EW) / 2} y={EH / 2 - 8} z={9}>
          <span className={lc('pulse')} style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 99, background: colors.white, color: colors.danger, boxShadow: `inset 0 0 0 2px ${colors.danger}`, ...lv(0, 1.8) }}>
            <Icon name="X" size={18} />
          </span>
        </C>
        <div style={{ position: 'absolute', left: 0, right: 0, top: EH / 2 + 18, textAlign: 'center', ...small(colors.ink, 14), whiteSpace: 'normal' }}>No Shared Memory</div>
      </Show>
      {/* invocations arriving from above into each environment */}
      {step >= 2 && <LoopDot t={t} period={P} ride={0.25} tone={colors.accent} points={[[EX[0] + EW / 2, -6], [EX[0] + EW / 2, EY + 20]]} />}
      {step >= 2 && <LoopDot t={t} period={P} phase={P / 2} ride={0.25} tone={colors.accent} points={[[EX[1] + EW / 2, -6], [EX[1] + EW / 2, EY + 20]]} />}

      {/* durable data goes out to an external database: one wide strip under both, a straight arrow down from each */}
      <Panel x={16} y={DBY} w={W - 32} h={56} lit={lit(3) || lit(4)} on={step >= 3}>
        <div style={{ position: 'absolute', inset: 0, ...flex(12, 'row', { justifyContent: 'center' }) }}>
          <GlyphTile icon="Database" size={38} loop="bob" t={2.4} />
          <Show on={step >= 4}>
            <span className={lc('pop')} style={{ display: 'grid', color: colors.success, ...lv(0, 2.8) }}>
              <Icon name="ShieldCheck" size={24} />
            </span>
          </Show>
        </div>
      </Panel>
      <Arrow x1={EX[0] + EW / 2} y1={EY + EH + 8} x2={EX[0] + EW / 2} y2={DBY - 6} on={step >= 3} />
      <Arrow x1={EX[1] + EW / 2} y1={EY + EH + 8} x2={EX[1] + EW / 2} y2={DBY - 6} on={step >= 3} />
      {step >= 3 && <LoopDot t={t} period={P} phase={1} ride={0.22} points={[[EX[0] + EW / 2, EY + EH + 10], [EX[0] + EW / 2, DBY - 10]]} />}
      {step >= 3 && <LoopDot t={t} period={P} phase={1 + P / 2} ride={0.22} points={[[EX[1] + EW / 2, EY + EH + 10], [EX[1] + EW / 2, DBY - 10]]} />}
      {/* point 4: a retried duplicate rides in right behind the first, and the database still records one */}
      {step >= 4 && <LoopDot t={t} period={P} phase={0.35} ride={0.25} tone={colors.accent} points={[[EX[0] + EW / 2, -6], [EX[0] + EW / 2, EY + 20]]} />}
    </Frame>
  )
}

/* ================================================================== T09 · three environments under a limit, the fourth throttled (566 x 320) */

function A_T09({ step }: { step: number }) {
  const held = useHeld()
  const lit = (i: number) => step === i && !held
  const t = useClock(0)
  const W = 566
  const H = 320
  const BX = 152
  const BW = 260
  const BH = 50
  const ROWS = [16, 78, 140]
  const LY = 206
  const FY = 222
  const CXc = 52
  const CYc = 120
  const P = 3.6
  return (
    <Frame w={W} h={H}>
      {/* the incoming invocations */}
      <div style={{ position: 'absolute', left: CXc - 34, top: CYc - 34, ...flex(0, 'column') }}>
        <span style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
          <Ping size={68} c={colors.accent} t={1.8} />
          <GlyphTile icon="Zap" size={68} tone={colors.accent} loop="pop" t={1.8} />
        </span>
      </div>
      {ROWS.map((y, i) => (
        <Panel key={i} x={BX} y={y} w={BW} h={BH} lit={(lit(2) && i === 0) || (lit(3) && i > 0)} on={step >= 1} delay={i * 80} radius={14}>
          <div style={{ position: 'absolute', inset: 0, ...flex(10, 'row', { padding: '0 12px', boxSizing: 'border-box' }) }}>
            <img src={lambdaFn} alt="" aria-hidden draggable={false} style={{ width: 30, height: 'auto' }} />
            <span style={{ flex: 1, height: 10, borderRadius: 6, background: '#E3EBFD', overflow: 'hidden', position: 'relative' }}>
              <span className={lc('fillx')} style={{ position: 'absolute', inset: 0, borderRadius: 6, background: i === 0 && step >= 2 ? colors.brandDark : colors.brand, transformOrigin: 'left', ...lv(i * 0.7, 2.4) }} />
            </span>
            <span style={{ width: 22, display: 'grid', placeItems: 'center', color: i === 0 ? colors.brandDark : colors.brand }}>
              {i === 0 && step >= 2 ? <Icon name="Lock" size={18} /> : step >= 3 ? <Icon name="Share2" size={18} /> : null}
            </span>
          </div>
        </Panel>
      ))}
      {/* the reserved slice and the shared pool, as two brackets at the right */}
      <Show on={step >= 2} style={{ position: 'absolute', left: BX + BW + 12, top: ROWS[0], width: 6, height: BH }}>
        <span style={{ display: 'block', width: 6, height: BH, borderRadius: 4, background: colors.brandDark }} />
      </Show>
      <Show on={step >= 3} style={{ position: 'absolute', left: BX + BW + 12, top: ROWS[1], width: 6, height: ROWS[2] + BH - ROWS[1] }}>
        <span style={{ display: 'block', width: 6, height: ROWS[2] + BH - ROWS[1], borderRadius: 4, background: '#8FB0F7' }} />
      </Show>

      {/* the concurrency limit line */}
      <Show on={step >= 1} style={{ position: 'absolute', left: BX - 16, top: LY - 14, width: W - BX + 16 - 16, height: 28 }}>
        <span style={{ position: 'absolute', left: 0, right: 44, top: 13, height: 3, borderRadius: 2, background: `repeating-linear-gradient(90deg, ${colors.accent} 0 12px, transparent 12px 18px)`, boxShadow: lit(1) ? `0 0 0 3px ${colors.accent}33` : 'none' }} />
        <span className={lc('rock')} style={{ position: 'absolute', right: 6, top: -2, display: 'grid', color: colors.accent, ...lv(0, 2.6) }}>
          <Icon name="Gauge" size={30} />
        </span>
      </Show>

      {/* the fourth attempt, over the limit: throttled */}
      <Show on={step >= 4} style={{ position: 'absolute', left: BX, top: FY, width: BW, height: BH }}>
        <div className={lc('shake')} style={{ position: 'absolute', inset: 0, borderRadius: 14, background: '#FFF5F5', boxShadow: litRing(lit(4), `inset 0 0 0 2px ${colors.danger}55`), ...flex(10, 'row', { padding: '0 12px', boxSizing: 'border-box' }), ...lv(0, 3.6) }}>
          <img src={lambdaFn} alt="" aria-hidden draggable={false} style={{ width: 30, height: 'auto', opacity: 0.45 }} />
          <span style={{ display: 'grid', color: colors.danger }}>
            <Icon name="Ban" size={22} />
          </span>
          <span style={mono(16, colors.danger)}>429</span>
          <span style={{ marginLeft: 'auto', ...flex(6) }}>
            <span className={lc('turnback')} style={{ display: 'grid', color: colors.brand, ...lv(0, 3.6) }}>
              <Icon name="RotateCcw" size={20} />
            </span>
          </span>
        </div>
      </Show>
      {ROWS.map((y, i) => (
        <Arrow key={i} x1={CXc + 40} y1={CYc + (i - 1) * 12} x2={BX - 8} y2={y + BH / 2} on={step >= 1} tone={colors.line} width={2} delay={i * 80} />
      ))}
      <Arrow x1={CXc + 40} y1={CYc + 24} x2={BX - 8} y2={FY + BH / 2} on={step >= 4} tone={`${colors.danger}88`} width={2} />
      {/* invocation dots: three land in their environments, the fourth bounces off the limit */}
      {step >= 1 &&
        ROWS.map((y, i) => <LoopDot key={i} t={t} period={P} phase={i * 0.35} ride={0.3} tone={colors.accent} points={[[CXc + 40, CYc + (i - 1) * 12], [BX - 12, y + BH / 2]]} />)}
      {step >= 4 && <LoopDot t={t} period={P} phase={1.3} ride={0.3} tone={colors.danger} points={[[CXc + 40, CYc + 24], [BX - 12, FY + BH / 2], [BX - 40, FY + BH / 2 + 30]]} />}
    </Frame>
  )
}

/* ------------------------------------------------------------------ exports */

type Fig = (p: Record<string, unknown>) => ReactNode
export const figures: Record<string, Fig> = {
  A_T01: A_T01 as unknown as Fig,
  A_T02: A_T02 as unknown as Fig,
  A_T03: A_T03 as unknown as Fig,
  A_T04B: A_T04B as unknown as Fig,
  A_T05: A_T05 as unknown as Fig,
  A_T06: A_T06 as unknown as Fig,
  A_T07: A_T07 as unknown as Fig,
  A_T08: A_T08 as unknown as Fig,
  A_T09: A_T09 as unknown as Fig,
}

export const slides = {}

/* the loop vocabulary (transform / opacity only), held still on ?still, thumbnails and reduced motion */
export const css = `
.ax { animation-delay: var(--ax-d, 0s); }
@keyframes ax-tfloat { 0%, 100% { transform: translateY(0) scale(1) } 50% { transform: translateY(-3px) scale(1.06) } }
.ax-tfloat { animation: ax-tfloat var(--ax-t, 3.6s) cubic-bezier(0.45,0,0.55,1) infinite; transform-origin: center; }
@keyframes ax-bob { from { transform: translateY(-3px) } to { transform: translateY(3px) } }
.ax-bob { animation: ax-bob var(--ax-t, 2.2s) ease-in-out infinite alternate; }
@keyframes ax-pulse { from { transform: scale(0.94) } to { transform: scale(1.06) } }
.ax-pulse { animation: ax-pulse var(--ax-t, 1.6s) ease-in-out infinite alternate; transform-origin: center; }
@keyframes ax-ping { 0% { transform: scale(0.8); opacity: 0.75 } 100% { transform: scale(1.55); opacity: 0 } }
.ax-ping { animation: ax-ping var(--ax-t, 2.4s) ease-out infinite; opacity: 0; }
@keyframes ax-blink { 0%, 62% { opacity: 1 } 72% { opacity: 0.25 } 82%, 100% { opacity: 1 } }
.ax-blink { animation: ax-blink var(--ax-t, 1.8s) ease-in-out infinite; }
@keyframes ax-sweep { from { transform: translateX(-90px) } to { transform: translateX(var(--ax-x, 200px)) } }
.ax-sweep { animation: ax-sweep var(--ax-t, 3s) ease-in-out infinite; transform: translateX(-120px); }
@keyframes ax-rock { from { transform: rotate(-7deg) } to { transform: rotate(7deg) } }
.ax-rock { animation: ax-rock var(--ax-t, 3s) ease-in-out infinite alternate; transform-origin: center; }
@keyframes ax-sway { from { transform: rotate(-1.6deg) } to { transform: rotate(1.6deg) } }
.ax-sway { animation: ax-sway var(--ax-t, 4s) ease-in-out infinite alternate; }
@keyframes ax-pop { 0%, 70%, 100% { transform: scale(1) } 80% { transform: scale(1.18) } }
.ax-pop { animation: ax-pop var(--ax-t, 2.2s) ease-in-out infinite; transform-origin: center; }
@keyframes ax-turn { 0%, 20% { transform: rotate(0deg) } 60%, 100% { transform: rotate(180deg) } }
.ax-turn { animation: ax-turn var(--ax-t, 3s) cubic-bezier(0.65,0,0.35,1) infinite; transform-origin: center; }
@keyframes ax-turnback { 0%, 30% { transform: rotate(0deg) } 70%, 100% { transform: rotate(-360deg) } }
.ax-turnback { animation: ax-turnback var(--ax-t, 3.6s) cubic-bezier(0.65,0,0.35,1) infinite; transform-origin: center; }
@keyframes ax-nudge { 0%, 100% { transform: translateX(0) } 50% { transform: translateX(-4px) } }
.ax-nudge { animation: ax-nudge var(--ax-t, 2.2s) ease-in-out infinite; }
@keyframes ax-wipe { 0%, 100% { transform: translateX(-4px) rotate(-6deg) } 50% { transform: translateX(4px) rotate(6deg) } }
.ax-wipe { animation: ax-wipe var(--ax-t, 2.6s) ease-in-out infinite; }
@keyframes ax-rest { 0%, 100% { transform: translateY(0) rotate(-6deg); opacity: 0.75 } 50% { transform: translateY(-3px) rotate(6deg); opacity: 1 } }
.ax-rest { animation: ax-rest var(--ax-t, 3s) ease-in-out infinite; }
@keyframes ax-drop { 0% { transform: translateY(-4px); opacity: 0 } 15% { opacity: 1 } 70% { transform: translateY(16px); opacity: 1 } 85%, 100% { transform: translateY(18px); opacity: 0 } }
.ax-drop { animation: ax-drop var(--ax-t, 1.8s) cubic-bezier(0.45,0,0.55,1) infinite; transform: translateY(16px); }
@keyframes ax-fillx { 0% { transform: scaleX(0.06) } 80%, 100% { transform: scaleX(1) } }
.ax-fillx { animation: ax-fillx var(--ax-t, 2.4s) cubic-bezier(0.22,1,0.36,1) infinite; }
@keyframes ax-gather { 0%, 25% { transform: translateX(0) } 60%, 80% { transform: translateX(var(--ax-gx, 0px)) } 100% { transform: translateX(0) } }
.ax-gather { animation: ax-gather var(--ax-t, 3s) cubic-bezier(0.65,0,0.35,1) infinite; }
@keyframes ax-shake { 0%, 30%, 100% { transform: translateX(0) } 36% { transform: translateX(-5px) } 42% { transform: translateX(5px) } 48% { transform: translateX(-3px) } 54% { transform: translateX(0) } }
.ax-shake { animation: ax-shake var(--ax-t, 3.6s) ease-in-out infinite; }
.cc-still .ax, .deck-thumb .ax { animation: none !important; }
.cc-still .ax-ping, .deck-thumb .ax-ping { opacity: 0 !important; }
.cc-still .ax-drop, .deck-thumb .ax-drop { opacity: 1 !important; transform: none !important; }
.cc-still .ax-sweep, .deck-thumb .ax-sweep { opacity: 0 !important; }
.cc-still .ax-fillx, .deck-thumb .ax-fillx { transform: none !important; }
@media (prefers-reduced-motion: reduce) {
  .ax { animation: none !important; }
  .ax-ping, .ax-sweep { opacity: 0 !important; }
  .ax-drop, .ax-fillx { opacity: 1 !important; transform: none !important; }
}
/* card-pair figures (slides 12, 14) stand on their own, no background card behind them (Session 9 rule) */
[data-group]:has(> .ax-bare) { background: none !important; box-shadow: none !important; border-color: transparent !important; }
`
