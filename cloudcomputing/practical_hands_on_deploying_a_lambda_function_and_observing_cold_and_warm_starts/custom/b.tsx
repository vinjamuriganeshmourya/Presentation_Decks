import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { TILE_SKIN } from '@/decks/figures/card'
import { STILL } from '@/decks/figures/scene'
import { MOTION, motionHeld } from '@/motion/tokens'
import { Icon } from '@/engine/icon'
import dynamoMark from '../images/aws-dynamodb.svg'
import s3Mark from '../images/aws-s3.svg'

/*
 * BUILDER B · Serverless Computing (Session 10), sections 3 and 4:
 *   B_T10  cold path above warm path, one shared Response          (slide 21, TR 10)
 *   B_T11  four causes into one New Environment Built box          (slide 22, TR 11)
 *   B_T12B one bar split Init | Invoke, the warm start line        (slide 25, TR 12)
 *   B_T12C what a warm start carries over                          (slide 26, TR 12 second slide)
 *   B_T13  five mitigations shrinking the init latency bar         (slide 27, TR 13)
 *   B_T14  the four limit boxes                                     (slide 29, TR 14)
 *   B_T15  the timeout timeline with its red cutoff                 (slide 30, TR 15)
 *   B_T16B the memory slider driving CPU and the cost rate          (slide 33, TR 16)
 *   B_T17  /tmp inside an environment, wiped on teardown            (slide 34, TR 17)
 *
 * Built in from the first draft (generate-slides standing corrections 13-14, cloud course R7/R8/R10/R11, Session 9's
 * review): icon-first pictures with 1-3 word Title Case labels (TR words only), no chips, number badges or connector
 * labels; every visual keeps a quiet continuous loop after its build (CSS keyframes `bz*`, no rest between cycles),
 * held still on `?still`, in thumbnails and under reduced motion; equal padding (P) on every side of every card; no
 * wrapper card round a pair; straight arrows that land on their target; blue the only text highlight; the TR's red only
 * on the timeout cutoff. Each figure follows its slide's build track: `step` 0 = nothing yet, n = whole; the part a
 * press brings in is ringed in brand blue for that press only (never on `?still`).
 */

const EASE = MOTION.ease
const MONO = "'Fira Code', ui-monospace, monospace"
const HEAD = "'DM Sans', system-ui, sans-serif"
const GOOD = colors.success
const BAD = colors.danger
const P = 20

/* ------------------------------------------------------------------ shared parts */

function useHeld() {
  return motionHeld(useInstant())
}

/** a CSS loop for an element, or nothing when motion is held */
const loop = (held: boolean, name: string, dur: number, delay = 0, timing = 'ease-in-out') => (held ? undefined : `${name} ${dur}s ${timing} ${delay}s infinite`)

/** a part is lit for the press that brings it in, never on `?still` */
const litAt = (step: number, k: number) => !STILL && step === k

/** shown from its step on: one move from (dx, dy), then it rests */
function Show({ on, children, style, delay = 0, dx = 0, dy = 6, dur = MOTION.reveal }: { on: boolean; children: ReactNode; style?: CSSProperties; delay?: number; dx?: number; dy?: number; dur?: number }) {
  const held = useHeld()
  return (
    <div
      style={{
        opacity: on ? 1 : 0,
        transform: on ? 'none' : `translate(${dx}px, ${dy}px)`,
        transition: held ? 'none' : `opacity ${dur}ms ${EASE} ${on ? delay : 0}ms, transform ${dur}ms ${EASE} ${on ? delay : 0}ms`,
        pointerEvents: on ? undefined : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

const Frame = ({ w, h, children }: { w: number; h: number; children: ReactNode }) => (
  <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
    <div style={{ position: 'relative', width: w, height: h }}>{children}</div>
  </div>
)

const flex = (gap: number, dir: 'row' | 'column' = 'row', extra: CSSProperties = {}): CSSProperties => ({ display: 'flex', flexDirection: dir, alignItems: 'center', gap, ...extra })
const heading = (size: number, color: string = colors.ink): CSSProperties => ({ fontFamily: HEAD, fontWeight: 600, fontSize: size, lineHeight: 1.2, color })

/** a white card in the deck's tile skin; `lit` rings it in brand blue */
const card = (lit = false, r = 16): CSSProperties => ({
  borderRadius: r,
  ...TILE_SKIN,
  ...(lit ? { boxShadow: `inset 0 0 0 2.5px ${colors.brand}, 0 12px 24px -16px rgba(31,64,140,0.4)` } : {}),
  transition: `box-shadow 360ms ${EASE}`,
})

/** an absolutely placed card: shown from `on`, lit on `lit` */
function Card({ x, y, w, h, on, lit = false, children, r = 16, pad = 12, style, inner }: { x: number; y: number; w: number; h: number; on: boolean; lit?: boolean; children?: ReactNode; r?: number; pad?: number; style?: CSSProperties; inner?: CSSProperties }) {
  return (
    <Show on={on} style={{ position: 'absolute', left: x, top: y, width: w, height: h, zIndex: 4, ...style }}>
      <div style={{ ...card(lit, r), position: 'absolute', inset: 0, padding: pad, boxSizing: 'border-box', ...flex(8, 'column', { justifyContent: 'center' }), ...inner }}>{children}</div>
    </Show>
  )
}

/** an official mark in its white tile (rule 54); marks never move */
function Tile({ src, size }: { src: string; size: number }) {
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: Math.round(size * 0.27), flexShrink: 0, ...TILE_SKIN }}>
      <img src={src} alt="" aria-hidden draggable={false} style={{ display: 'block', width: Math.round(size * 0.76), height: 'auto', userSelect: 'none' }} />
    </span>
  )
}

/** a lucide icon on a soft tile, with a quiet loop on the glyph */
function Glyph({ name, size = 44, tone = colors.brand, bg, kind = 'bzFloat', dur = 2.8, delay = 0 }: { name: string; size?: number; tone?: string; bg?: string; kind?: string; dur?: number; delay?: number }) {
  const held = useHeld()
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: Math.round(size * 0.27), background: bg ?? `${tone}16`, color: tone, flexShrink: 0 }}>
      <span className="bz" style={{ display: 'grid', animation: loop(held, kind, dur, delay) }}>
        <Icon name={name} size={Math.round(size * 0.52)} />
      </span>
    </span>
  )
}

const Label = ({ children, size = 14, color = colors.ink, style }: { children: ReactNode; size?: number; color?: string; style?: CSSProperties }) => (
  <span style={{ ...heading(size, color), textAlign: 'center', ...style }}>{children}</span>
)

const Mono = ({ children, size = 14, color = colors.ink, style }: { children: ReactNode; size?: number; color?: string; style?: CSSProperties }) => (
  <span style={{ fontFamily: MONO, fontSize: size, color, whiteSpace: 'nowrap', fontVariantLigatures: 'none', ...style }}>{children}</span>
)

/** a straight horizontal arrow from x1 to x2 at y (head at x2) */
function HArrow({ x1, x2, y, on = true, color = colors.brand, w = 2.5 }: { x1: number; x2: number; y: number; on?: boolean; color?: string; w?: number }) {
  const held = useHeld()
  const head = 9
  return (
    <svg aria-hidden width={Math.abs(x2 - x1)} height={20} style={{ position: 'absolute', left: Math.min(x1, x2), top: y - 10, overflow: 'visible', zIndex: 3, opacity: on ? 1 : 0, transition: held ? 'none' : `opacity ${MOTION.reveal}ms ${EASE}` }}>
      <line x1={x2 > x1 ? 0 : x1 - x2} y1={10} x2={x2 > x1 ? x2 - x1 - head + 1 : head - 1} y2={10} stroke={color} strokeWidth={w} strokeLinecap="round" />
      {x2 > x1 ? <path d={`M ${x2 - x1 - head} 4.5 L ${x2 - x1} 10 L ${x2 - x1 - head} 15.5 Z`} fill={color} /> : <path d={`M ${head} 4.5 L 0 10 L ${head} 15.5 Z`} fill={color} />}
    </svg>
  )
}

/** a straight vertical arrow from y1 down to y2 at x (head at y2) */
function VArrow({ x, y1, y2, on = true, color = colors.brand, w = 2.5 }: { x: number; y1: number; y2: number; on?: boolean; color?: string; w?: number }) {
  const held = useHeld()
  const head = 9
  const L = y2 - y1
  return (
    <svg aria-hidden width={20} height={L} style={{ position: 'absolute', left: x - 10, top: y1, overflow: 'visible', zIndex: 3, opacity: on ? 1 : 0, transition: held ? 'none' : `opacity ${MOTION.reveal}ms ${EASE}` }}>
      <line x1={10} y1={0} x2={10} y2={L - head + 1} stroke={color} strokeWidth={w} strokeLinecap="round" />
      <path d={`M 4.5 ${L - head} L 10 ${L} L 15.5 ${L - head} Z`} fill={color} />
    </svg>
  )
}

/** dots riding a straight line, one after another, forever (none on a held frame) */
function Ride({ x1, y1, x2, y2, n = 2, dur = MOTION.flow.dur, color = colors.brand, size = 10, on = true, delay = 0, z = 9 }: { x1: number; y1: number; x2: number; y2: number; n?: number; dur?: number; color?: string; size?: number; on?: boolean; delay?: number; z?: number }) {
  const held = useHeld()
  if (held || !on) return null
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className="bz bz-dot"
          style={
            {
              position: 'absolute',
              left: x1 - size / 2,
              top: y1 - size / 2,
              width: size,
              height: size,
              borderRadius: 999,
              background: color,
              boxShadow: `0 0 0 3px ${colors.white}, 0 4px 10px -4px ${color}`,
              zIndex: z,
              pointerEvents: 'none',
              '--dx': `${x2 - x1}px`,
              '--dy': `${y2 - y1}px`,
              animation: `bzRide ${dur}s linear ${delay + (i * dur) / n}s infinite`,
            } as CSSProperties
          }
        />
      ))}
    </>
  )
}

/** a soft ring that keeps pulsing out from a part */
function Pulse({ r = 16, color = colors.brand, delay = 0, dur = 2.2 }: { r?: number; color?: string; delay?: number; dur?: number }) {
  const held = useHeld()
  if (held) return null
  return <span aria-hidden className="bz" style={{ position: 'absolute', inset: 0, borderRadius: r, animation: `bzRing ${dur}s ease-out ${delay}s infinite`, color, pointerEvents: 'none' }} />
}

/** an icon tile + a 1-3 word label, stacked, centred in its card */
function Stage({ icon, label, tone = colors.brand, kind = 'bzFloat', dur = 2.8, delay = 0, size = 40, fs = 14 }: { icon: string; label: ReactNode; tone?: string; kind?: string; dur?: number; delay?: number; size?: number; fs?: number }) {
  return (
    <>
      <Glyph name={icon} size={size} tone={tone} kind={kind} dur={dur} delay={delay} />
      <Label size={fs}>{label}</Label>
    </>
  )
}

/* ───────────────────────── T10 · cold path above warm path (slide 21) ─────────────────────────
 * Cold: New Environment → Init → Invoke → Response. Warm: Reused Environment → Invoke → Response (the Init column is
 * empty on the warm row: a warm start skips a whole stage). One tall Response card is the shared end point. A request
 * dot rides each row; the cold dot takes longer. Step 4: an idle environment fades away (reclaimed).
 */
function B_T10({ step }: { step: number }) {
  const W = 606
  const H = 330
  const LX = P // lane icon column
  const TW = 92
  const C = [70, 192, 314] // tile columns (left edges)
  const RX = 446 // response card
  const RW = W - P - RX
  const TH = 104
  const CY = P // cold row top
  const WY = H - P - TH // warm row top
  const cy = CY + TH / 2
  const wy = WY + TH / 2
  const lane = (y: number, icon: string, tone: string, label: string, on: boolean, lit: boolean) => (
    <Show on={on} style={{ position: 'absolute', left: LX, top: y, width: 44, height: TH, zIndex: 4, ...flex(6, 'column', { justifyContent: 'center' }) }}>
      <Glyph name={icon} size={38} tone={tone} kind={icon === 'Flame' ? 'bzFlicker' : 'bzFloat'} dur={icon === 'Flame' ? 1.4 : 3} />
      <Label size={13} color={lit ? colors.brand : colors.ink}>{label}</Label>
    </Show>
  )
  return (
    <Frame w={W} h={H}>
      {/* cold row */}
      {lane(CY, 'Snowflake', colors.info, 'Cold', step >= 1, litAt(step, 1))}
      <HArrow x1={C[0] + TW} x2={C[1]} y={cy} on={step >= 1} />
      <HArrow x1={C[1] + TW} x2={C[2]} y={cy} on={step >= 1} />
      <HArrow x1={C[2] + TW} x2={RX} y={cy} on={step >= 1} />
      <Ride x1={C[0] + TW / 2} y1={cy} x2={RX - 6} y2={cy} n={1} dur={3.6} on={step >= 1} z={2} />
      <Card x={C[0]} y={CY} w={TW} h={TH} on={step >= 1} lit={litAt(step, 1)} pad={8}>
        <Stage icon="PackagePlus" label="New Environment" kind="bzDrop" dur={2.4} size={38} fs={13} />
      </Card>
      <Card x={C[1]} y={CY} w={TW} h={TH} on={step >= 1} lit={litAt(step, 1) || litAt(step, 3)} pad={8}>
        <Stage icon="Hourglass" label="Init" kind="bzTip" dur={2.4} size={38} fs={13} />
      </Card>
      <Card x={C[2]} y={CY} w={TW} h={TH} on={step >= 1} lit={litAt(step, 1) || litAt(step, 3)} pad={8}>
        <Stage icon="Play" label="Invoke" kind="bzPulse" dur={1.6} size={38} fs={13} />
      </Card>

      {/* warm row: no Init stage */}
      {lane(WY, 'Flame', colors.accent, 'Warm', step >= 2, litAt(step, 2))}
      <HArrow x1={C[0] + TW} x2={C[2]} y={wy} on={step >= 2} />
      <HArrow x1={C[2] + TW} x2={RX} y={wy} on={step >= 2} />
      <Ride x1={C[0] + TW / 2} y1={wy} x2={RX - 6} y2={wy} n={1} dur={1.8} on={step >= 2} z={2} />
      <Card x={C[0]} y={WY} w={TW} h={TH} on={step >= 2} lit={litAt(step, 2)} pad={8}>
        <Stage icon="Recycle" label="Reused Environment" kind="bzPulse" dur={2.2} size={38} fs={13} />
      </Card>
      <Card x={C[2]} y={WY} w={TW} h={TH} on={step >= 2} lit={litAt(step, 2)} pad={8}>
        <Stage icon="Play" label="Invoke" kind="bzPulse" dur={1.6} delay={0.4} size={38} fs={13} />
      </Card>

      {/* step 4: an idle environment is reclaimed (between the rows, under the empty Init slot) */}
      <Show on={step >= 4} style={{ position: 'absolute', left: C[1] - 26, top: CY + TH + 12, width: TW + 52, height: WY - CY - TH - 24, zIndex: 4, ...flex(8, 'row', { justifyContent: 'center' }) }}>
        <Glyph name="Clock" size={32} tone={colors.muted} kind="bzTick" dur={2} />
        <span style={{ position: 'relative', display: 'inline-grid' }}>
          <IdleEnv />
        </span>
        <Glyph name="Recycle" size={32} tone={litAt(step, 4) ? colors.brand : colors.muted} kind="bzPulse" dur={2} />
      </Show>

      {/* shared end point */}
      <Card x={RX} y={CY} w={RW} h={H - 2 * P} on={step >= 1} pad={P}>
        <div style={{ position: 'relative', ...flex(10, 'column') }}>
          <Glyph name="Reply" size={52} tone={GOOD} kind="bzPulse" dur={1.8} />
          <Label size={15}>Response</Label>
        </div>
      </Card>
    </Frame>
  )
}

/** a small environment cube that fades away and comes back (reclaimed after idling) */
function IdleEnv() {
  const held = useHeld()
  return (
    <span className="bz" style={{ display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: 9, background: colors.surface2, color: colors.brandDark, animation: loop(held, 'bzFade', 3) }}>
      <Icon name="Box" size={18} />
    </span>
  )
}

/* ───────────────────────── T11 · four causes into one New Environment Built box (slide 22) ───────────────────────── */
function B_T11({ step }: { step: number }) {
  const W = 606
  const H = 330
  const TW = 196
  const TH = 62
  const GAP = (H - 2 * P - 4 * TH) / 3
  const BX = 380
  const BW = W - P - BX
  const causes = [
    { icon: 'MousePointerClick', label: 'First-Ever Invocation', kind: 'bzPress', dur: 1.6 },
    { icon: 'TrendingUp', label: 'Scale-Out', kind: 'bzRise', dur: 1.8 },
    { icon: 'Clock', label: 'Idle Reclaim', kind: 'bzTick', dur: 2 },
    { icon: 'Upload', label: 'New Deployment', kind: 'bzFloat', dur: 2.2 },
  ]
  return (
    <Frame w={W} h={H}>
      {causes.map((c, i) => {
        const y = P + i * (TH + GAP)
        const on = step >= i + 1
        return (
          <div key={c.label}>
            <Card x={P} y={y} w={TW} h={TH} on={on} lit={litAt(step, i + 1)} pad={12} inner={{ ...flex(12), justifyContent: 'flex-start' }}>
              <Glyph name={c.icon} size={38} kind={c.kind} dur={c.dur} />
              <Label size={14} style={{ textAlign: 'left' }}>{c.label}</Label>
            </Card>
            <HArrow x1={P + TW} x2={BX} y={y + TH / 2} on={on} />
            <Ride x1={P + TW + 6} y1={y + TH / 2} x2={BX - 8} y2={y + TH / 2} n={1} dur={1.6} delay={i * 0.4} on={on} />
          </div>
        )
      })}
      <Card x={BX} y={P} w={BW} h={H - 2 * P} on={step >= 1} lit={step >= 1 && step <= 4 && !STILL} pad={P}>
        <Builder />
        <Label size={16}>New Environment Built</Label>
      </Card>
    </Frame>
  )
}

/** three blocks dropping into place, over and over: an environment being built */
function Builder() {
  const held = useHeld()
  const blk = (x: number, y: number, d: number, tone: string): CSSProperties => ({ position: 'absolute', left: x, top: y, width: 34, height: 26, borderRadius: 7, background: tone, boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.4)', animation: loop(held, 'bzStack', 3, d, 'linear') })
  return (
    <div style={{ position: 'relative', width: 100, height: 80 }}>
      <span style={{ position: 'absolute', left: 4, right: 4, bottom: 0, height: 4, borderRadius: 2, background: colors.line }} />
      <span className="bz" style={blk(12, 50, 0, colors.brand)} />
      <span className="bz" style={blk(54, 50, 0.25, colors.brandDark)} />
      <span className="bz" style={blk(33, 22, 0.5, colors.teal)} />
      <span className="bz" style={{ position: 'absolute', right: -6, top: -4, color: colors.accent, display: 'grid', animation: loop(held, 'bzHammer', 0.75, 0) }}>
        <Icon name="Hammer" size={26} />
      </span>
    </div>
  )
}

/* ───────────────────────── T12-B · Init | Invoke, and where a warm call starts (slide 25) ─────────────────────────
 * Cold row: one bar split Init | Invoke, ending at the environment, which freezes (snowflake) ready for reuse.
 * Warm row: only the Invoke block, starting at the dashed line. Two playheads ride the rows at the same speed, so the
 * warm call finishes first. Step 3: Init lit, its loading sheen, the handler waiting at the line.
 */
function B_T12B({ step }: { step: number }) {
  const held = useHeld()
  const W = 616
  const H = 340
  const X0 = P
  const XS = 236 // the dashed line: where a warm call starts
  const XE = 488 // end of the invoke block
  const EX = 508 // environment card
  const EW = W - P - EX
  const AY = 52
  const BY = 170
  const BH = 70
  const blk = (x: number, w: number, y: number, tone: string, lit: boolean): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: BH, borderRadius: 14, background: `linear-gradient(180deg, ${tone} 0%, ${tone}DD 100%)`, boxShadow: lit ? `inset 0 0 0 3px ${colors.white}, 0 0 0 3px ${colors.brand}` : 'inset 0 2px 0 rgba(255,255,255,0.35), 0 10px 18px -12px rgba(16,32,58,0.5)', color: colors.white, overflow: 'hidden', transition: `box-shadow 360ms ${EASE}`, ...flex(8, 'row', { justifyContent: 'center' }) })
  return (
    <Frame w={W} h={H}>
      {/* the dashed warm-start line */}
      <Show on={step >= 2} style={{ position: 'absolute', left: XS - 1, top: 20, width: 2, height: BY + BH + 16 - 20, zIndex: 6 }}>
        <span style={{ display: 'block', width: 0, height: '100%', borderLeft: `2px dashed ${colors.accent}` }} />
      </Show>

      {/* cold row */}
      <Show on={step >= 1} style={{ position: 'absolute', inset: 0, zIndex: 4 }}>
        <div style={blk(X0, XS - X0 - 4, AY, colors.teal, litAt(step, 3))}>
          {!held && step >= 3 && <span aria-hidden className="bz" style={{ position: 'absolute', top: 0, bottom: 0, width: 60, left: -60, background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0) 100%)', animation: 'bzSweep 1.6s linear 0s infinite' }} />}
          <span className="bz" style={{ display: 'grid', animation: loop(held, 'bzTip', 2.4) }}>
            <Icon name="Hourglass" size={24} />
          </span>
          <span style={heading(17, colors.white)}>Init</span>
        </div>
        <div style={blk(XS + 4, XE - XS - 4, AY, colors.brand, false)}>
          <Icon name="Play" size={22} />
          <span style={heading(17, colors.white)}>Invoke</span>
        </div>
        <Playhead x1={X0 + 6} x2={XE - 6} y={AY + BH + 6} dur={4.2} />
      </Show>

      {/* warm row */}
      <Show on={step >= 2} style={{ position: 'absolute', inset: 0, zIndex: 4 }}>
        <div style={{ position: 'absolute', left: X0, top: BY, width: XS - X0 - 16, height: BH, ...flex(8, 'row', { justifyContent: 'flex-end' }) }}>
          <Glyph name="Flame" size={36} tone={colors.accent} kind="bzFlicker" dur={1.4} />
          <Label size={15}>Warm Start</Label>
        </div>
        <div style={blk(XS + 4, XE - XS - 4, BY, colors.brand, litAt(step, 2))}>
          <span className="bz" style={{ display: 'grid', animation: loop(held, 'bzPulse', 1.6) }}>
            <Icon name="SkipForward" size={22} />
          </span>
          <span style={heading(17, colors.white)}>Invoke</span>
        </div>
        <Playhead x1={XS + 10} x2={XE - 6} y={BY + BH + 6} dur={4.2} span={(XE - XS - 16) / (XE - X0 - 12)} />
      </Show>

      {/* step 3: the handler waits at the line while init runs */}
      <Show on={step >= 3} style={{ position: 'absolute', left: XS - 22, top: 6, width: 44, height: 40, zIndex: 7, display: 'grid', placeItems: 'center' }}>
        <span className="bz" style={{ display: 'grid', placeItems: 'center', width: 36, height: 36, borderRadius: 10, background: colors.white, color: colors.brandDark, boxShadow: `inset 0 0 0 2px ${litAt(step, 3) ? colors.brand : colors.line}`, animation: loop(held, 'bzBlink', 1.4) }}>
          <Icon name="FileCode" size={20} />
        </span>
      </Show>

      {/* the environment freezes after invoke, ready for reuse */}
      <Card x={EX} y={AY} w={EW} h={BY + BH - AY} on={step >= 1} lit={litAt(step, 1)} pad={10}>
        <div style={{ position: 'relative', width: 54, height: 54 }}>
          <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', borderRadius: 14, background: colors.surface2, color: colors.brandDark }}>
            <Icon name="Box" size={30} />
          </span>
          <span className="bz" style={{ position: 'absolute', right: -10, top: -10, display: 'grid', placeItems: 'center', width: 28, height: 28, borderRadius: 99, background: colors.white, color: colors.info, boxShadow: `0 0 0 2px ${colors.surface2}`, animation: loop(held, 'bzFrost', 3) }}>
            <Icon name="Snowflake" size={18} />
          </span>
        </div>
        <Label size={13}>Ready For Reuse</Label>
      </Card>

      {/* time runs left to right */}
      <Show on={step >= 1} style={{ position: 'absolute', left: X0, top: H - P - 34, width: XE - X0, height: 34, zIndex: 3 }}>
        <span style={{ position: 'absolute', left: 30, right: 0, top: 16, height: 2.5, borderRadius: 2, background: colors.line }} />
        <span style={{ position: 'absolute', right: -1, top: 11.5, width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: `10px solid ${colors.line}` }} />
        <span style={{ position: 'absolute', left: 0, top: 3, color: colors.muted, display: 'grid' }}>
          <Icon name="Clock" size={26} />
        </span>
      </Show>
    </Frame>
  )
}

/** a small marker riding under a bar at constant speed; `span` (0-1) of the cycle is spent moving, the rest hidden */
function Playhead({ x1, x2, y, dur, span = 1 }: { x1: number; x2: number; y: number; dur: number; span?: number }) {
  const held = useHeld()
  if (held) return null
  const pct = Math.round(span * 100)
  return (
    <span
      aria-hidden
      className="bz"
      style={
        {
          position: 'absolute',
          left: x1 - 7,
          top: y,
          width: 0,
          height: 0,
          borderLeft: '7px solid transparent',
          borderRight: '7px solid transparent',
          borderBottom: `10px solid ${colors.brandDark}`,
          '--dx': `${x2 - x1}px`,
          animation: `${pct >= 99 ? 'bzHead' : 'bzHeadShort'} ${dur}s linear 0s infinite`,
          zIndex: 8,
        } as CSSProperties
      }
    />
  )
}

/* ───────────────────────── T12-C · what a warm start carries over (slide 26) ───────────────────────── */
function B_T12C({ step }: { step: number }) {
  const held = useHeld()
  const W = 606
  const H = 340
  const MX = P + 16
  const MY = 72
  const MW = 262
  const MH = H - P - 16 - MY
  const HX = MX + MW + 46
  const HW = W - P - 16 - HX
  const HH = 124
  const items = [
    { icon: 'Variable', label: 'Global Variables', kind: 'bzFloat' },
    { icon: 'Plug', label: 'SDK Clients', kind: 'bzPulse' },
    { icon: 'DatabaseZap', label: 'DB Connections', kind: 'bzFloat' },
    { icon: 'FolderOpen', label: <>Files In <Mono size={13}>/tmp</Mono></>, kind: 'bzPulse' },
  ]
  const cellW = (MW - 2 * 12 - 10) / 2
  const cellH = (MH - 24 - 46 - 10) / 2
  return (
    <Frame w={W} h={H}>
      {/* the execution environment */}
      <Show on={step >= 1} style={{ position: 'absolute', left: P, top: P, width: W - 2 * P, height: H - 2 * P, zIndex: 2 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 20, background: colors.surface, boxShadow: `inset 0 0 0 2px ${colors.line}` }} />
        <div style={{ position: 'absolute', left: 16, top: 12, ...flex(8) }}>
          <span style={{ color: colors.brandDark, display: 'grid' }}>
            <Icon name="Box" size={20} />
          </span>
          <Label size={15}>Execution Environment</Label>
        </div>
      </Show>

      {/* memory kept from init, outside the handler */}
      <Show on={step >= 1} style={{ position: 'absolute', left: MX, top: MY, width: MW, height: MH, zIndex: 4 }}>
        <div style={{ ...card(litAt(step, 1) || litAt(step, 2), 16), position: 'absolute', inset: 0, padding: 12, boxSizing: 'border-box' }}>
          <div style={{ ...flex(8), height: 34, justifyContent: 'center' }}>
            <span style={{ color: litAt(step, 2) ? colors.brand : colors.muted, display: 'grid' }}>
              <Icon name="Lightbulb" size={18} />
            </span>
            <Label size={14} color={step >= 2 ? colors.brand : colors.muted}>{step >= 2 ? 'Outside the Handler' : 'Memory'}</Label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
            {items.map((it, i) => (
              <div key={i} style={{ height: cellH, borderRadius: 12, background: colors.surface2, ...flex(6, 'column', { justifyContent: 'center' }), padding: 6, boxSizing: 'border-box', width: cellW }}>
                <span className="bz" style={{ display: 'grid', color: colors.brandDark, animation: loop(held, it.kind, 2.6, i * 0.35) }}>
                  <Icon name={it.icon} size={24} />
                </span>
                <Label size={13}>{it.label}</Label>
              </div>
            ))}
          </div>
        </div>
      </Show>

      {/* reused by the next invocation */}
      <HArrow x1={MX + MW} x2={HX} y={MY + HH / 2} on={step >= 1} />
      <Ride x1={MX + MW + 4} y1={MY + HH / 2} x2={HX - 8} y2={MY + HH / 2} n={1} dur={1.4} on={step >= 1} />

      {/* the handler: invocations arriving one after another */}
      <Card x={HX} y={MY} w={HW} h={HH} on={step >= 1} lit={litAt(step, 1)} pad={12}>
        <div style={flex(8)}>
          <Glyph name="FileCode" size={36} kind="bzFloat" dur={3} />
          <Label size={15}>Handler</Label>
        </div>
        <div style={flex(10)}>
          {[0, 1, 2].map((k) => (
            <span key={k} className="bz" style={{ display: 'grid', placeItems: 'center', width: 28, height: 28, borderRadius: 8, background: colors.brand, color: colors.white, animation: loop(held, 'bzSeq', 2.4, k * 0.8, 'linear') }}>
              <Icon name="Zap" size={16} />
            </span>
          ))}
        </div>
      </Card>

      {/* step 3: a fresh environment starts empty: never rely on reuse */}
      <Card x={HX} y={MY + HH + 16} w={HW} h={MY + MH - (MY + HH + 16)} on={step >= 3} lit={litAt(step, 3)} pad={10}>
        <div style={flex(10)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {[0, 1, 2, 3].map((k) => (
              <span key={k} style={{ width: 16, height: 16, borderRadius: 4, boxShadow: `inset 0 0 0 1.5px ${colors.line}` }} />
            ))}
          </div>
          <span className="bz" style={{ display: 'grid', color: colors.warning, animation: loop(held, 'bzBlink', 1.6) }}>
            <Icon name="TriangleAlert" size={26} />
          </span>
        </div>
        <Label size={13}>Fresh Environment</Label>
      </Card>
    </Frame>
  )
}

/* ───────────────────────── T13 · five mitigations shrink the init latency bar (slide 27) ───────────────────────── */
const LAT = [100, 84, 71, 60, 51, 44]
function B_T13({ step }: { step: number }) {
  const held = useHeld()
  const W = 586
  const H = 340
  const N = 5
  const GAP = 10
  const BW = (W - 2 * P - (N - 1) * GAP) / N
  const BH = 120
  const BY = P
  const LY = 228
  const boxes = [
    { icon: 'BatteryCharging', label: 'Provisioned Concurrency', kind: 'bzPulse' },
    { icon: 'Package', label: 'Smaller Package', kind: 'bzSquash' },
    { icon: 'Feather', label: 'Lighter Dependencies', kind: 'bzFloat' },
    { icon: 'CalendarClock', label: 'Warm-Up Calls', kind: 'bzTick' },
    { icon: 'Rocket', label: 'Faster Runtimes', kind: 'bzRise' },
  ]
  const pct = STILL ? LAT[N] : LAT[Math.max(0, Math.min(N, step))]
  return (
    <Frame w={W} h={H}>
      {boxes.map((b, i) => {
        const x = P + i * (BW + GAP)
        return (
          <div key={b.label}>
            <Card x={x} y={BY} w={BW} h={BH} on={step >= i + 1} lit={litAt(step, i + 1)} pad={8}>
              <Glyph name={b.icon} size={40} kind={b.kind} dur={2.4} delay={i * 0.3} />
              <Label size={13}>{b.label}</Label>
            </Card>
            <VArrow x={x + BW / 2} y1={BY + BH + 6} y2={LY - 4} on={step >= i + 1} />
          </div>
        )
      })}
      {/* the latency bar, shrinking with each practice */}
      <Card x={P} y={LY} w={W - 2 * P} h={H - P - LY} on={step >= 1} pad={14} inner={{ alignItems: 'stretch', gap: 10 }}>
        <div style={{ ...flex(8), justifyContent: 'flex-start' }}>
          <span className="bz" style={{ display: 'grid', color: colors.brand, animation: loop(held, 'bzSink', 2) }}>
            <Icon name="TrendingDown" size={20} />
          </span>
          <Label size={15}>Lowers Init Time</Label>
        </div>
        <div style={{ position: 'relative', height: 24, borderRadius: 12, background: colors.surface2 }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, borderRadius: 12, background: `linear-gradient(90deg, ${colors.teal} 0%, ${colors.brand} 100%)`, transition: held ? 'none' : `width 900ms ${EASE}`, overflow: 'hidden' }}>
            {!held && <span aria-hidden className="bz" style={{ position: 'absolute', top: 0, bottom: 0, width: 50, left: -50, background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0) 100%)', animation: 'bzSweep 2s linear 0s infinite' }} />}
          </div>
          <span style={{ position: 'absolute', top: -3, left: `calc(${pct}% - 15px)`, width: 30, height: 30, borderRadius: 99, background: colors.white, color: colors.brandDark, display: 'grid', placeItems: 'center', boxShadow: `0 0 0 2px ${colors.brand}`, transition: held ? 'none' : `left 900ms ${EASE}` }}>
            <Icon name="Hourglass" size={16} />
          </span>
        </div>
      </Card>
    </Frame>
  )
}

/* ───────────────────────── T14 · the four limit boxes (slide 29) ─────────────────────────
 * Timeout always shown; step 1 Ephemeral Storage, 2 Memory, 3 Payload (the slide's points, in order). Each box: its
 * icon and a gauge that keeps filling up to its limit line and starting again.
 */
function B_T14({ step }: { step: number }) {
  const W = 586
  const H = 320
  const GAP = 16
  const CW = (W - 2 * P - GAP) / 2
  const CH = (H - 2 * P - GAP) / 2
  const boxes = [
    { icon: 'Timer', label: 'Timeout', on: step >= 0, lit: false, kind: 'bzTick', d: 0 },
    { icon: 'MemoryStick', label: 'Memory', on: step >= 2, lit: litAt(step, 2), kind: 'bzPulse', d: 0.5 },
    { icon: 'Mail', label: 'Payload', on: step >= 3, lit: litAt(step, 3), kind: 'bzFloat', d: 1 },
    { icon: 'HardDrive', label: 'Ephemeral Storage', on: step >= 1, lit: litAt(step, 1) || litAt(step, 4), kind: 'bzFloat', d: 1.5 },
  ]
  return (
    <Frame w={W} h={H}>
      {boxes.map((b, i) => (
        <Card key={b.label} x={P + (i % 2) * (CW + GAP)} y={P + Math.floor(i / 2) * (CH + GAP)} w={CW} h={CH} on={b.on} lit={b.lit} pad={16} inner={{ alignItems: 'stretch', gap: 12 }}>
          <div style={{ ...flex(12), justifyContent: 'flex-start' }}>
            <Glyph name={b.icon} size={44} kind={b.kind} dur={2.4} delay={b.d} />
            <Label size={16} style={{ textAlign: 'left' }}>{b.label}</Label>
          </div>
          <LimitGauge delay={b.d} />
        </Card>
      ))}
    </Frame>
  )
}

/** a gauge that fills up to its limit line and stops there, then starts again */
function LimitGauge({ delay = 0 }: { delay?: number }) {
  const held = useHeld()
  return (
    <div style={{ position: 'relative', height: 18, borderRadius: 9, background: colors.surface2 }}>
      <div className="bz" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '82%', borderRadius: 9, background: `linear-gradient(90deg, ${colors.teal} 0%, ${colors.brand} 100%)`, transformOrigin: '0 50%', animation: loop(held, 'bzFill', 3.2, delay, 'linear') }} />
      <span style={{ position: 'absolute', left: '82%', top: -6, width: 3, height: 30, marginLeft: -1.5, borderRadius: 2, background: colors.brandDeep }} />
    </div>
  )
}

/* ───────────────────────── T15 · the timeout timeline (slide 30) ─────────────────────────
 * Start → running → the red cutoff line (the TR's red) at the timeout. The run keeps filling up to the line and is cut
 * there; the work beyond the line never runs. Cards: the 15-minute maximum (step 1), the 3-second default (step 2),
 * the timed-out error (step 3, on the line), a different compute model for long jobs (step 4).
 */
function B_T15({ step }: { step: number }) {
  const held = useHeld()
  const W = 606
  const H = 330
  const TY = 66 // track centre
  const TX0 = P + 50
  const CUT = 430
  const TX1 = W - P - 20
  const CY = 168
  const CH = H - P - CY
  const CW = (W - 2 * P - 2 * 16) / 3
  return (
    <Frame w={W} h={H}>
      {/* timeline */}
      <Show on={step >= 1} style={{ position: 'absolute', inset: 0, zIndex: 4 }}>
        <span style={{ position: 'absolute', left: P, top: TY - 20, display: 'grid', placeItems: 'center', width: 40, height: 40, borderRadius: 12, background: `${GOOD}18`, color: GOOD }}>
          <Icon name="Play" size={22} />
        </span>
        {/* work the run would still need: never runs */}
        <span style={{ position: 'absolute', left: CUT, top: TY - 13, width: TX1 - CUT, height: 26, borderRadius: '0 13px 13px 0', background: colors.surface2, boxShadow: `inset 0 0 0 1.5px ${colors.line}` }} />
        <span style={{ position: 'absolute', left: TX0, top: TY - 13, width: CUT - TX0, height: 26, borderRadius: '13px 0 0 13px', background: colors.surface2 }} />
        <span className="bz" style={{ position: 'absolute', left: TX0, top: TY - 13, width: CUT - TX0, height: 26, borderRadius: '13px 0 0 13px', background: `linear-gradient(90deg, ${colors.teal} 0%, ${colors.brand} 100%)`, transformOrigin: '0 50%', animation: loop(held, 'bzRun', 3, 0, 'linear') }} />
        <span style={{ position: 'absolute', left: TX0 + 12, top: TY + 22, ...flex(6) }}>
          <span className="bz" style={{ display: 'grid', color: colors.brand, animation: loop(held, 'bzPulse', 1.2) }}>
            <Icon name="Cog" size={18} />
          </span>
          <Label size={13} color={colors.muted}>Running</Label>
        </span>
      </Show>
      {/* the red cutoff */}
      <Show on={step >= 1} style={{ position: 'absolute', left: CUT - 2, top: TY - 44, width: 4, height: 88, zIndex: 6 }}>
        <span style={{ display: 'block', width: 4, height: '100%', borderRadius: 2, background: BAD }} />
      </Show>
      <Show on={step >= 1} style={{ position: 'absolute', left: CUT + 10, top: TY - 50, zIndex: 6, ...flex(6) }}>
        <span style={{ color: BAD, display: 'grid' }}>
          <Icon name="Timer" size={18} />
        </span>
        <Label size={13} color={BAD}>Timeout</Label>
      </Show>
      {/* step 3: the run is stopped at the line */}
      <Show on={step >= 3} style={{ position: 'absolute', left: CUT - 17, top: TY + 22, width: 34, height: 34, zIndex: 7 }}>
        <span className="bz" style={{ display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: 99, background: BAD, color: colors.white, boxShadow: litAt(step, 3) ? `0 0 0 4px ${colors.white}, 0 0 0 6.5px ${colors.brand}` : `0 0 0 3px ${colors.white}`, animation: loop(held, 'bzStop', 3, 0, 'linear') }}>
          <Icon name="X" size={20} />
        </span>
      </Show>
      <Show on={step >= 3} style={{ position: 'absolute', left: CUT + 24, top: TY + 26, zIndex: 7 }}>
        <Label size={13} color={BAD}>Task Timed Out</Label>
      </Show>

      {/* the three facts */}
      <Card x={P} y={CY} w={CW} h={CH} on={step >= 1} lit={litAt(step, 1)} pad={10}>
        <Glyph name="Timer" size={40} kind="bzTick" dur={2} />
        <Label size={18}>15 Minutes</Label>
        <Label size={13} color={colors.muted}>Maximum</Label>
      </Card>
      <Card x={P + CW + 16} y={CY} w={CW} h={CH} on={step >= 2} lit={litAt(step, 2)} pad={10}>
        <Glyph name="Clock3" size={40} kind="bzTick" dur={2} delay={0.5} />
        <Label size={18}>3 Seconds</Label>
        <Label size={13} color={colors.muted}>Default</Label>
      </Card>
      <Card x={P + 2 * (CW + 16)} y={CY} w={CW} h={CH} on={step >= 4} lit={litAt(step, 4)} pad={10}>
        <div style={flex(8)}>
          <Glyph name="Layers" size={36} tone={colors.muted} kind="bzFloat" dur={2.6} />
          <span style={{ color: colors.muted, display: 'grid' }}>
            <Icon name="ArrowRight" size={18} />
          </span>
          <Glyph name="Server" size={36} kind="bzPulse" dur={2} />
        </div>
        <Label size={13}>Different Compute Model</Label>
      </Card>
    </Frame>
  )
}

/* ───────────────────────── T16-B · memory drives CPU and the cost rate (slide 33) ─────────────────────────
 * The memory slider runs 128 MB to 10,240 MB. Its handle glides back and forth on a smooth cosine (no overshoot, no
 * rest), and the presenter may drag it (clamped to the track; the loop pauses while it is held and picks up again
 * 1.2 s after release, from where the handle was left). The CPU cells light with memory (CPU scales up with memory, to
 * several vCPUs) and the per-millisecond cost needle rises with it. Held frames show one fixed position, nothing moving.
 */
const T16 = { W: 1000, H: 380, SX: 20, SW: 560, TX: 56, TY: 194, KNOB: 28, PER: 7 }
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const HOLD_V = 0.72

/** the handle's position, 0-1: a full-range cosine on wall-clock time, or the presenter's drag */
function useGlide(held: boolean) {
  const [v, setV] = useState(held ? HOLD_V : 0)
  const st = useRef<{ on: boolean; resumeAt: number; phase0: number; t0: number }>({ on: false, resumeAt: 0, phase0: 0, t0: performance.now() })
  useEffect(() => {
    if (held) {
      setV(HOLD_V)
      return
    }
    let raf = 0
    const tick = (now: number) => {
      const d = st.current
      if (!d.on && now >= d.resumeAt) {
        const t = (now - d.t0) / 1000 + d.phase0
        setV(0.5 - 0.5 * Math.cos((2 * Math.PI * t) / T16.PER))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [held])
  /** hold where the handle was left for 1.2 s, then glide on from that exact place (rising branch): no jump */
  const release = (cur: number) => {
    const theta = Math.acos(Math.min(1, Math.max(-1, 1 - 2 * cur)))
    const resumeAt = performance.now() + 1200
    st.current = { ...st.current, on: false, resumeAt, phase0: (theta * T16.PER) / (2 * Math.PI) - (resumeAt - st.current.t0) / 1000 }
    setV(cur)
  }
  return { v, setV, st, release }
}

function B_T16B({ step }: { step: number }) {
  const held = useHeld()
  const { v, setV, st, release } = useGlide(held)
  const trackRef = useRef<HTMLDivElement>(null)
  const [holding, setHolding] = useState(false)
  const TW = T16.SW - 2 * (T16.TX - T16.SX)
  const fromEvent = (x: number) => {
    const r = trackRef.current?.getBoundingClientRect()
    return r ? clamp01((x - r.left) / r.width) : v
  }
  const stop = (e: React.SyntheticEvent) => e.stopPropagation()
  const cpu = 6
  const lit = (k: number) => clamp01(v * cpu - k + 0.35)
  const ang = -90 + 180 * v
  const RX = T16.SX + T16.SW + 20
  const RW = T16.W - 20 - RX
  const RH = (T16.H - 2 * 20 - 20) / 2
  return (
    <Frame w={T16.W} h={T16.H}>
      {/* memory slider */}
      <Card x={T16.SX} y={20} w={T16.SW} h={T16.H - 40} on={step >= 1} lit={litAt(step, 1)} pad={P} inner={{ justifyContent: 'flex-start', alignItems: 'stretch' }}>
        <div style={{ ...flex(12), justifyContent: 'flex-start' }}>
          <Glyph name="MemoryStick" size={46} kind="bzPulse" dur={2.4} />
          <Label size={20}>Memory</Label>
        </div>
      </Card>
      <Show on={step >= 1} style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none' }}>
        {/* RAM sticks filling with the setting */}
        <div style={{ position: 'absolute', left: T16.TX, top: 120, width: TW, height: 30, display: 'flex', gap: 6 }}>
          {Array.from({ length: 12 }, (_, k) => (
            <span key={k} style={{ flex: 1, borderRadius: 5, background: colors.brand, opacity: 0.14 + 0.86 * clamp01(v * 12 - k + 0.5) }} />
          ))}
        </div>
        <div ref={trackRef} style={{ position: 'absolute', left: T16.TX, top: T16.TY - 5, width: TW, height: 10, borderRadius: 5, background: colors.surface2 }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${v * 100}%`, borderRadius: 5, background: `linear-gradient(90deg, ${colors.teal} 0%, ${colors.brand} 100%)` }} />
        </div>
        <span
          role="slider"
          aria-label="Memory"
          aria-valuemin={128}
          aria-valuemax={10240}
          aria-valuenow={Math.round(128 + v * (10240 - 128))}
          tabIndex={0}
          onPointerDown={(e) => {
            e.stopPropagation()
            e.preventDefault()
            e.currentTarget.setPointerCapture(e.pointerId)
            st.current.on = true
            setHolding(true)
            setV(fromEvent(e.clientX))
          }}
          onPointerMove={(e) => {
            e.stopPropagation()
            if (st.current.on) setV(fromEvent(e.clientX))
          }}
          onPointerUp={(e) => {
            e.stopPropagation()
            setHolding(false)
            release(fromEvent(e.clientX))
          }}
          onPointerCancel={() => {
            setHolding(false)
            release(v)
          }}
          onClick={stop}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
              e.stopPropagation()
              e.preventDefault()
              const n = clamp01(v + (e.key === 'ArrowRight' ? 0.05 : -0.05))
              release(n)
            }
          }}
          style={{
            position: 'absolute',
            left: 0,
            top: T16.TY - T16.KNOB / 2,
            width: T16.KNOB,
            height: T16.KNOB,
            transform: `translateX(${T16.TX + v * TW - T16.KNOB / 2}px)`,
            borderRadius: 99,
            background: colors.white,
            boxShadow: `inset 0 0 0 3px ${colors.brand}, 0 6px 14px -6px rgba(31,64,140,0.55)${holding ? `, 0 0 0 7px ${colors.brand}22` : ''}`,
            cursor: holding ? 'grabbing' : 'grab',
            touchAction: 'none',
            userSelect: 'none',
            pointerEvents: step >= 1 ? 'auto' : 'none',
            zIndex: 8,
          }}
        />
        <div style={{ position: 'absolute', left: T16.TX, top: T16.TY + 24, width: TW, display: 'flex', justifyContent: 'space-between' }}>
          <Mono size={15} color={colors.muted}>128 MB</Mono>
          <Mono size={15} color={colors.muted}>10,240 MB</Mono>
        </div>
        <div style={{ position: 'absolute', left: T16.TX, top: 284, width: TW, ...flex(14), justifyContent: 'center' }}>
          <span style={{ color: colors.muted, display: 'grid' }}>
            <Icon name="MemoryStick" size={22} />
          </span>
          <span style={{ color: colors.brand, display: 'grid' }}>
            <Icon name="ArrowRight" size={20} />
          </span>
          <span style={{ color: colors.brandDark, display: 'grid' }}>
            <Icon name="Cpu" size={22} />
          </span>
          <span style={{ color: colors.brand, display: 'grid' }}>
            <Icon name="ArrowRight" size={20} />
          </span>
          <span style={{ color: colors.accentDark, display: 'grid' }}>
            <Icon name="Coins" size={22} />
          </span>
        </div>
      </Show>

      {/* CPU rising with memory */}
      <Card x={RX} y={20} w={RW} h={RH} on={step >= 1} lit={litAt(step, 1)} pad={P} inner={{ gap: 12 }}>
        <div style={flex(10)}>
          <span style={{ color: colors.brandDark, display: 'grid' }}>
            <Icon name="Cpu" size={24} />
          </span>
          <Label size={17}>CPU</Label>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 70 }}>
          {Array.from({ length: cpu }, (_, k) => (
            <span key={k} style={{ width: 30, height: 22 + k * 9, borderRadius: '8px 8px 4px 4px', background: colors.brand, opacity: 0.14 + 0.86 * lit(k), boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.35)' }} />
          ))}
        </div>
      </Card>

      {/* the per-millisecond cost rate */}
      <Card x={RX} y={20 + RH + 20} w={RW} h={RH} on={step >= 2} lit={litAt(step, 2)} pad={P} inner={{ gap: 10 }}>
        <div style={{ position: 'relative', width: 150, height: 78 }}>
          <svg width={150} height={78} viewBox="0 0 150 78" aria-hidden style={{ position: 'absolute', inset: 0 }}>
            <path d="M 12 75 A 63 63 0 0 1 138 75" fill="none" stroke={colors.surface2} strokeWidth={14} strokeLinecap="round" />
            <path d="M 12 75 A 63 63 0 0 1 138 75" fill="none" stroke={colors.accent} strokeWidth={14} strokeLinecap="round" pathLength={1} strokeDasharray={`${v} 1`} />
          </svg>
          <span style={{ position: 'absolute', left: 75 - 2, top: 75 - 54, width: 4, height: 54, borderRadius: 2, background: colors.brandDeep, transformOrigin: '50% 100%', transform: `rotate(${ang}deg)` }} />
          <span style={{ position: 'absolute', left: 75 - 8, top: 75 - 8, width: 16, height: 16, borderRadius: 99, background: colors.brandDeep }} />
        </div>
        <div style={flex(8)}>
          <span style={{ color: colors.accentDark, display: 'grid' }}>
            <Icon name="Coins" size={20} />
          </span>
          <Label size={16}>Per-Millisecond Cost</Label>
        </div>
      </Card>
    </Frame>
  )
}

/* ───────────────────────── T17 · /tmp inside an environment, wiped on teardown (slide 34) ───────────────────────── */
function B_T17({ step }: { step: number }) {
  const held = useHeld()
  const W = 606
  const H = 330
  const EX = P
  const EW = 360
  const DX = EX + EW + 56
  const DW = W - P - DX
  const wipe = step >= 3
  return (
    <Frame w={W} h={H}>
      {/* the environment */}
      <Show on={step >= 1} style={{ position: 'absolute', left: EX, top: P, width: EW, height: H - 2 * P, zIndex: 2 }}>
        <div className="bz" style={{ position: 'absolute', inset: 0, borderRadius: 20, background: colors.surface, boxShadow: `inset 0 0 0 2px ${litAt(step, 3) ? colors.brand : colors.line}`, animation: wipe ? loop(held, 'bzTear', 4.2, 0, 'linear') : undefined }} />
        <div style={{ position: 'absolute', left: 16, top: 12, ...flex(8) }}>
          <span style={{ color: colors.brandDark, display: 'grid' }}>
            <Icon name="Box" size={20} />
          </span>
          <Label size={15}>Execution Environment</Label>
        </div>
        {wipe && (
          <span className="bz" style={{ position: 'absolute', right: 14, top: 10, color: colors.muted, display: 'grid', animation: loop(held, 'bzPulse', 2.1) }}>
            <Icon name="Recycle" size={22} />
          </span>
        )}
      </Show>

      {/* /tmp: scratch files land in it; on teardown it is wiped */}
      <Card x={EX + 16} y={68} w={EW - 32} h={128} on={step >= 1} lit={litAt(step, 1)} pad={14} inner={{ flexDirection: 'row', gap: 16 }}>
        <div style={{ position: 'relative', ...flex(4, 'column') }}>
          <span className="bz" style={{ display: 'grid', color: colors.brand, animation: loop(held, 'bzFloat', 3) }}>
            <Icon name="FolderOpen" size={46} />
          </span>
          <Mono size={15} color={colors.brandDark}>/tmp</Mono>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['FileArchive', 'FileText', 'FileSearch'].map((f, k) => (
            <span key={f} className="bz" style={{ display: 'grid', placeItems: 'center', width: 40, height: 48, borderRadius: 9, background: colors.surface2, color: colors.brandDark, animation: wipe ? loop(held, 'bzScratch', 4.2, 0, 'linear') : loop(held, 'bzFloat', 2.6, k * 0.3), animationDelay: wipe ? `${k * 0.2}s` : undefined }}>
              <Icon name={f} size={22} />
            </span>
          ))}
        </div>
      </Card>

      {/* 512 MB default, configurable up to 10,240 MB */}
      <Card x={EX + 16} y={210} w={EW - 32} h={H - P - 16 - 210} on={step >= 1} lit={litAt(step, 2)} pad={14} inner={{ alignItems: 'stretch', gap: 8 }}>
        <div style={{ ...flex(10), justifyContent: 'flex-start' }}>
          <span style={{ color: colors.brandDark, display: 'grid' }}>
            <Icon name="HardDrive" size={20} />
          </span>
          <div style={{ position: 'relative', flex: 1, height: 14, borderRadius: 7, background: colors.surface2 }}>
            <div className="bz" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%', borderRadius: 7, background: `linear-gradient(90deg, ${colors.teal} 0%, ${colors.brand} 100%)`, transformOrigin: '0 50%', transform: step >= 2 ? undefined : 'scaleX(0.08)', animation: step >= 2 ? loop(held, 'bzExtend', 4, 0) : undefined }} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 30 }}>
          <Mono size={13} color={colors.muted}>512 MB</Mono>
          <Mono size={13} color={step >= 2 ? colors.brandDark : colors.muted} style={{ opacity: step >= 2 ? 1 : 0.35 }}>10,240 MB</Mono>
        </div>
      </Card>

      {/* durable data goes elsewhere */}
      <HArrow x1={EX + EW + 6} x2={DX - 4} y={H / 2} on={step >= 4} />
      <Ride x1={EX + EW + 10} y1={H / 2} x2={DX - 10} y2={H / 2} n={1} dur={1.4} on={step >= 4} />
      <Card x={DX} y={70} w={DW} h={H - 140} on={step >= 4} lit={litAt(step, 4)} pad={14} inner={{ gap: 14 }}>
        <Tile src={dynamoMark} size={54} />
        <Tile src={s3Mark} size={54} />
      </Card>
    </Frame>
  )
}

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  B_T10: B_T10 as (p: Record<string, unknown>) => ReactNode,
  B_T11: B_T11 as (p: Record<string, unknown>) => ReactNode,
  B_T12B: B_T12B as (p: Record<string, unknown>) => ReactNode,
  B_T12C: B_T12C as (p: Record<string, unknown>) => ReactNode,
  B_T13: B_T13 as (p: Record<string, unknown>) => ReactNode,
  B_T14: B_T14 as (p: Record<string, unknown>) => ReactNode,
  B_T15: B_T15 as (p: Record<string, unknown>) => ReactNode,
  B_T16B: B_T16B as (p: Record<string, unknown>) => ReactNode,
  B_T17: B_T17 as (p: Record<string, unknown>) => ReactNode,
}
export const slides = {}

/* the loops; every one is held still on harness URLs, in picker thumbnails and under reduced motion */
export const css = `
@keyframes bzFloat { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
@keyframes bzPulse { 0%, 100% { transform: scale(1) } 50% { transform: scale(1.08) } }
@keyframes bzBlink { 0%, 100% { opacity: 1 } 50% { opacity: 0.45 } }
@keyframes bzFlicker { 0%, 100% { transform: scale(1) rotate(0deg) } 30% { transform: scale(1.06, 1.1) rotate(-3deg) } 65% { transform: scale(0.97, 1.03) rotate(2deg) } }
@keyframes bzTip { 0%, 40% { transform: rotate(0deg) } 50%, 90% { transform: rotate(180deg) } 100% { transform: rotate(360deg) } }
@keyframes bzTick { 0%, 100% { transform: rotate(-8deg) } 50% { transform: rotate(8deg) } }
@keyframes bzDrop { 0% { transform: translateY(-5px) } 45% { transform: translateY(1px) } 55% { transform: translateY(0) } 100% { transform: translateY(-5px) } }
@keyframes bzPress { 0%, 100% { transform: translate(0, 0) } 40% { transform: translate(2px, 2px) scale(0.94) } 60% { transform: translate(0, 0) } }
@keyframes bzRise { 0%, 100% { transform: translate(0, 2px) } 50% { transform: translate(2px, -3px) } }
@keyframes bzSink { 0%, 100% { transform: translate(0, -2px) } 50% { transform: translate(2px, 3px) } }
@keyframes bzSquash { 0%, 100% { transform: scale(1) } 50% { transform: scale(0.88) } }
@keyframes bzFade { 0%, 100% { opacity: 1; transform: scale(1) } 50% { opacity: 0.25; transform: scale(0.82) } }
@keyframes bzFrost { 0%, 100% { transform: rotate(0deg) scale(1) } 50% { transform: rotate(30deg) scale(1.1) } }
@keyframes bzRing { 0% { box-shadow: 0 0 0 0 currentColor; opacity: 0.5 } 100% { box-shadow: 0 0 0 12px currentColor; opacity: 0 } }
@keyframes bzRide { 0% { transform: translate(0, 0); opacity: 0 } 12% { opacity: 1 } 88% { opacity: 1 } 100% { transform: translate(var(--dx), var(--dy)); opacity: 0 } }
@keyframes bzHead { 0% { transform: translateX(0); opacity: 0 } 6% { opacity: 1 } 94% { opacity: 1 } 100% { transform: translateX(var(--dx)); opacity: 0 } }
@keyframes bzHeadShort { 0% { transform: translateX(0); opacity: 0 } 3% { opacity: 1 } 44% { opacity: 1; transform: translateX(var(--dx)) } 47%, 100% { opacity: 0; transform: translateX(var(--dx)) } }
@keyframes bzSweep { 0% { transform: translateX(0) } 100% { transform: translateX(900px) } }
@keyframes bzStack { 0% { transform: translateY(-26px); opacity: 0 } 18% { transform: translateY(0); opacity: 1 } 88% { transform: translateY(0); opacity: 1 } 100% { transform: translateY(0); opacity: 0 } }
@keyframes bzHammer { 0%, 100% { transform: rotate(-18deg) } 50% { transform: rotate(14deg) } }
@keyframes bzSeq { 0% { transform: scale(0.85); opacity: 0.35 } 15% { transform: scale(1.12); opacity: 1 } 35% { transform: scale(1); opacity: 1 } 60%, 100% { transform: scale(0.85); opacity: 0.35 } }
@keyframes bzFill { 0% { transform: scaleX(0.05) } 75% { transform: scaleX(1) } 100% { transform: scaleX(1) } }
@keyframes bzRun { 0% { transform: scaleX(0.04) } 82% { transform: scaleX(1) } 100% { transform: scaleX(1) } }
@keyframes bzStop { 0%, 78% { transform: scale(0.9) } 86% { transform: scale(1.18) } 100% { transform: scale(1) } }
@keyframes bzTear { 0%, 60% { opacity: 1 } 72% { opacity: 0.35 } 84%, 100% { opacity: 1 } }
@keyframes bzScratch { 0% { transform: translateY(-10px); opacity: 0 } 12% { transform: translateY(0); opacity: 1 } 62% { transform: translateY(0); opacity: 1 } 74% { transform: translateY(0) scale(0.6); opacity: 0 } 100% { transform: translateY(-10px); opacity: 0 } }
@keyframes bzExtend { 0%, 100% { transform: scaleX(0.08) } 50% { transform: scaleX(1) } }
.bz-dot { opacity: 0 }
.cc-still .bz, .deck-thumb .bz { animation: none !important }
@media (prefers-reduced-motion: reduce) { .bz { animation: none !important } }
`
