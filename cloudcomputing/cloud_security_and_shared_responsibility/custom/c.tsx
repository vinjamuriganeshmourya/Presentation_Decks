import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { MOTION, motionHeld } from '@/motion/tokens'
import { TILE_SKIN } from '@/decks/figures/card'
import { litRing } from '@/decks/figures/net/frames'
import { Icon } from '@/engine/icon'

/*
 * BUILDER C · Cloud Security & Shared Responsibility (Session 12), section 5 Defense in Depth:
 *   slide 28 C_T16 (five-ring fort + the five TR layer rows), 30 C_T17 (network and identity pipeline),
 *   31 C_T18 (data and application), 32 C_T19 (monitoring and detection), 34 C_T21 (the fort again, identity lit).
 *
 * Built to Sessions 9-11's final review state (generate-slides standing corrections 1-16, cloud course R7-R13):
 * icon-first visuals, one-word Title Case tags under icons that carry no text, no chips, badges or connector labels;
 * official marks on white tiles that never move; every icon micro-animated; a quiet loop after the build; the orange
 * highlight follows the build, then walks first → last → first forever and is gone on held frames (C_T21's identity
 * ring is the one standing orange: the TR asks for it); equal padding on all four sides of every frame and card;
 * straight arrows computed from the boxes' constants, heads on their target; nothing overlapping at any step.
 * Every figure takes the slide's `step` (0 = nothing pressed, n = whole). On `?still`, thumbnails and reduced motion:
 * everything shown, nothing lit (except that identity ring), nothing moving. TR text arrives in `props` and is printed
 * exactly as given. Classes are prefixed `cz-` so this file's CSS never meets another builder's.
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const EASE = MOTION.ease
const useHeld = () => motionHeld(useInstant())
const FONT = "'DM Sans', system-ui, sans-serif"
const GREY = '#8792A8'

/* ------------------------------------------------------------------ loop vocabulary */

const lc = (kind: string) => `cz cz-${kind}`
const lv = (d = 0, t?: number, extra: Record<string, string | number> = {}): CSSProperties =>
  ({ ['--cz-d' as string]: `${-d}s`, ...(t ? { ['--cz-t' as string]: `${t}s` } : {}), ...extra }) as CSSProperties

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

/** an index walking 0 → n-1 → 0 forever once the build is done; -1 (nothing lit) on held frames (R13 looping highlight) */
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

/** the lit item: the current press while building, then the walking cycle; -1 on held frames */
function useHot(n: number, step: number) {
  const held = useHeld()
  const cyc = useCycle(n, step >= n)
  if (held) return -1
  return cyc >= 0 ? cyc : step - 1
}

const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2)
/** 0..1 progress of a window [a, a+d) inside a looping period; -1 outside it */
const win = (t: number, period: number, a: number, d: number) => {
  const u = ((t % period) + period) % period
  return u >= a && u < a + d ? (u - a) / d : -1
}

/* ------------------------------------------------------------------ type */

const heading = (size: number, color: string = colors.ink): CSSProperties => ({ fontFamily: FONT, fontWeight: 700, fontSize: size, lineHeight: 1.2, color })
const body = (size: number, color: string = colors.body): CSSProperties => ({ fontFamily: FONT, fontWeight: 500, fontSize: size, lineHeight: 1.32, color })
const tag = (size = 13, color: string = colors.brandDeep): CSSProperties => ({ fontFamily: FONT, fontWeight: 600, fontSize: size, lineHeight: 1.15, color, whiteSpace: 'nowrap', textAlign: 'center' })

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

/** the figure's own w x h box, centred in the stage (the stage leaves equal padding on all four sides) */
const Frame = ({ w, h, children }: { w: number; h: number; children: ReactNode }) => (
  <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
    <div style={{ position: 'relative', width: w, height: h }}>{children}</div>
  </div>
)

/** an official mark on its white tile (rule 54); the mark never moves, the tile does not either */
function MarkTile({ src, size = 44, scale = 0.74 }: { src: string; size?: number; scale?: number }) {
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

/** an official mark (`img:`) or a lucide glyph, by the item's icon string */
const MarkOrGlyph = ({ icon, size = 44, loop = 'breathe', d = 0 }: { icon: string; size?: number; loop?: string; d?: number }) =>
  icon.startsWith('img:') ? <MarkTile src={icon.slice(4)} size={size} /> : <Glyph icon={icon} size={size} loop={loop} d={d} t={3.2} />

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

/** A STRAIGHT ARROW between two computed points, a filled head landing exactly on (x2, y2); draws itself when shown. */
function Arrow({ x1, y1, x2, y2, on = true, color = colors.brand, width = 2.5, head = 10, delay = 0, lit = false }: { x1: number; y1: number; x2: number; y2: number; on?: boolean; color?: string; width?: number; head?: number; delay?: number; lit?: boolean }) {
  const instant = useInstant()
  const len = Math.hypot(x2 - x1, y2 - y1)
  const ux = (x2 - x1) / len
  const uy = (y2 - y1) / len
  const c = lit ? colors.accent : color
  const tip = `${x2},${y2} ${x2 - ux * head - uy * head * 0.55},${y2 - uy * head + ux * head * 0.55} ${x2 - ux * head + uy * head * 0.55},${y2 - uy * head - ux * head * 0.55}`
  const lineLen = len - head * 0.85
  return (
    <svg aria-hidden style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }} width={1} height={1}>
      <line
        x1={x1}
        y1={y1}
        x2={x2 - ux * head * 0.85}
        y2={y2 - uy * head * 0.85}
        stroke={c}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={lineLen}
        strokeDashoffset={on ? 0 : lineLen}
        style={{ transition: instant ? 'none' : `stroke-dashoffset 860ms ${EASE} ${on ? delay : 0}ms, stroke 420ms ${EASE}` }}
      />
      <polygon points={tip} fill={c} style={{ opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 300ms ${EASE} ${on ? delay + 700 : 0}ms, fill 420ms ${EASE}` }} />
    </svg>
  )
}

/** a token at (x, y): a round dot, optionally carrying a glyph; nothing on held frames */
function Token({ x, y, size = 12, tone = colors.brand, icon, opacity = 1, scale = 1 }: { x: number; y: number; size?: number; tone?: string; icon?: string; opacity?: number; scale?: number }) {
  const held = useHeld()
  if (held) return null
  return (
    <span aria-hidden style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: 99, background: tone, opacity, transform: `scale(${scale})`, display: 'grid', placeItems: 'center', color: colors.white, boxShadow: `0 0 0 4px ${tone}2e, 0 6px 12px -6px ${tone}`, zIndex: 8, pointerEvents: 'none' }}>
      {icon && <Icon name={icon} size={Math.round(size * 0.58)} />}
    </span>
  )
}

/** a token riding a straight segment during window [a, a+d) of a looping period; fades in and out at the ends */
function Ride({ x1, y1, x2, y2, t, period, a, d, ...rest }: { x1: number; y1: number; x2: number; y2: number; t: number; period: number; a: number; d: number; size?: number; tone?: string; icon?: string }) {
  const k = win(t, period, a, d)
  if (k < 0) return null
  const e = ease(k)
  const op = k < 0.1 ? k / 0.1 : 1
  return <Token x={x1 + (x2 - x1) * e} y={y1 + (y2 - y1) * e} opacity={op} {...rest} />
}

/** a "stopped here" pop at (x, y) during window [a, a+d) */
function Stop({ x, y, t, period, a, d = 0.6 }: { x: number; y: number; t: number; period: number; a: number; d?: number }) {
  const k = win(t, period, a, d)
  if (k < 0) return null
  const s = k < 0.3 ? 0.6 + (k / 0.3) * 0.5 : 1.1 - (k - 0.3) * 0.15
  const op = k > 0.7 ? (1 - k) / 0.3 : 1
  return (
    <span aria-hidden style={{ position: 'absolute', left: x - 13, top: y - 13, width: 26, height: 26, borderRadius: 99, background: colors.white, color: GREY, display: 'grid', placeItems: 'center', boxShadow: `inset 0 0 0 2px ${GREY}`, opacity: op, transform: `scale(${s})`, zIndex: 9 }}>
      <Icon name="Ban" size={16} />
    </span>
  )
}

/* ================================================================== the fort (C_T16, C_T21) */

const RING_ICON = ['Network', 'FingerprintPattern', 'Database', 'AppWindow', 'Cctv']
const RING_NAME = ['Network', 'Identity', 'Data', 'Application', 'Monitoring']
/* outside in, light → deep: one family, the outer wall palest */
const RING_TONE = ['#BCCDFB', '#97B1FA', '#7092F6', '#4C72EC', '#2F53D3']
const RING_INK = ['#2F53D3', '#2F53D3', '#FFFFFF', '#FFFFFF', '#FFFFFF']
/* where each ring's icon sits on its wall (degrees, 0 = 3 o'clock); the top-left quarter stays clear for C_T21's key */
const RING_ANGLE = [-90, -45, 0, 45, 90]

/**
 * FIVE CONCENTRIC WALLS around the resource, Network outermost and Monitoring innermost (the TR's order, outside in).
 * `shown` walls are drawn (outside first), `lit` rings in orange while explained, `hot` stays orange, `dim` is a failed
 * wall (faint, dashed). Labels are DOM text; the walls are svg.
 */
function Fort({ x, y, core = 40, band = 20, shown = 5, lit = -1, hot = -1, dim = -1 }: { x: number; y: number; core?: number; band?: number; shown?: number; lit?: number; hot?: number; dim?: number }) {
  const instant = useInstant()
  const R = core + band * 5
  const S = R * 2
  const rc = (k: number) => core + band * (4 - k) + band / 2
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: S, height: S }}>
      <svg aria-hidden width={S} height={S} viewBox={`0 0 ${S} ${S}`} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {[0, 1, 2, 3, 4].map((k) => {
          const on = shown > k
          const orange = k === lit || k === hot
          const failed = k === dim
          return (
            <circle
              key={k}
              cx={R}
              cy={R}
              r={rc(k)}
              fill="none"
              stroke={orange ? colors.accent : RING_TONE[k]}
              strokeWidth={band - 3}
              strokeDasharray={failed ? '6 7' : undefined}
              style={{ opacity: on ? (failed ? 0.28 : 1) : 0, transition: instant ? 'none' : `opacity 520ms ${EASE}, stroke 420ms ${EASE}` }}
            />
          )
        })}
        <defs>
          <radialGradient id="cz-core" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#4F7BFF" />
            <stop offset="1" stopColor={colors.brandDeep} />
          </radialGradient>
        </defs>
        <circle cx={R} cy={R} r={core - 3} fill="url(#cz-core)" />
      </svg>
      {/* the resource, at the centre */}
      <div style={{ position: 'absolute', left: R - core, top: R - core, width: core * 2, height: core * 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, color: colors.white }}>
        <span className={lc('breathe')} style={{ display: 'grid', ...lv(0, 3.4) }}>
          <Icon name="Server" size={18} />
        </span>
        <span style={tag(11, colors.white)}>Resource</span>
      </div>
      {/* each wall's icon on its wall */}
      {[0, 1, 2, 3, 4].map((k) => {
        const a = (RING_ANGLE[k] * Math.PI) / 180
        const cx = R + rc(k) * Math.cos(a)
        const cy = R + rc(k) * Math.sin(a)
        const s = band
        const orange = k === lit || k === hot
        return (
          <span
            key={k}
            aria-hidden
            style={{
              position: 'absolute',
              left: cx - s / 2,
              top: cy - s / 2,
              width: s,
              height: s,
              borderRadius: 99,
              display: 'grid',
              placeItems: 'center',
              background: orange ? colors.white : RING_TONE[k],
              color: orange ? colors.accent : RING_INK[k],
              opacity: shown > k ? (k === dim ? 0.35 : 1) : 0,
              transition: instant ? 'none' : `opacity 520ms ${EASE}, background 420ms ${EASE}, color 420ms ${EASE}`,
            }}
          >
            <span className={lc('breathe')} style={{ display: 'grid', ...lv(k * 0.5, 3.2) }}>
              <Icon name={RING_ICON[k]} size={Math.round(s * 0.62)} />
            </span>
          </span>
        )
      })}
    </div>
  )
}

/* ================================================================== slide 28 · C_T16 */

function C_T16({ step, items }: { step: number; items: [string, string, string][] }) {
  const held = useHeld()
  const hot = useHot(5, step)
  const on = (i: number) => held || step >= i
  const W = 1070
  const H = 290
  const S = 288 // core 34 + five 22 px walls
  const RX = S + 40
  const RW = W - RX
  const RH = 48
  const RG = (H - 5 * RH) / 4
  return (
    <Frame w={W} h={H}>
      <Fort x={0} y={(H - S) / 2} core={34} band={22} shown={held ? 5 : step} lit={hot} />
      {items.map(([, text], i) => (
        <Panel key={i} x={RX} y={i * (RH + RG)} w={RW} h={RH} on={on(i + 1)} lit={hot === i} radius={14}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px 0 9px' }}>
            <span style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 9, background: RING_TONE[i], color: RING_INK[i], flexShrink: 0 }}>
              <span className={lc('breathe')} style={{ display: 'grid', ...lv(i * 0.5, 3.2) }}>
                <Icon name={RING_ICON[i]} size={17} />
              </span>
            </span>
            <span style={{ ...body(17, colors.ink), whiteSpace: 'nowrap' }}>{text}</span>
          </div>
        </Panel>
      ))}
    </Frame>
  )
}

/* ================================================================== slide 34 · C_T21 */

/** the fort with the identity wall lit (TR 21), a legend naming the walls, prevention / detection brackets, the stolen key */
function C_T21({ step }: { step: number }) {
  const held = useHeld()
  const t = useClock(0)
  const lit = (i: number) => step === i && !held
  const on = (i: number) => held || step >= i
  const W = 520
  const H = 330
  const PAD = 16
  const core = 36
  const band = 18
  const R = core + band * 5
  const S = R * 2
  const FX = PAD + 30 // room up-left for the stolen key's approach
  const FY = PAD + 39
  const rId = core + band * 3 + band / 2 // identity wall centre radius
  /* the legend, right of the fort, and the two brackets right of the legend */
  const LX = FX + S + 14
  const ROW = 40
  const LY = (H - 5 * ROW) / 2 + 4
  const BX = LX + 114
  /* the stolen key: rests outside the top-left of the fort, glides along the -135° radius to the identity wall */
  const ang = (-135 * Math.PI) / 180
  const ca = Math.cos(ang)
  const sa = Math.sin(ang)
  const cx = FX + R
  const cy = FY + R
  const K0 = { x: cx + (R + 68) * ca, y: cy + (R + 68) * sa }
  const K1 = { x: cx + rId * ca, y: cy + rId * sa }
  const KS = 30
  /* key loop, 2.4 s: glide 0 → 1.6, fade at the wall 1.6 → 2.1, back at its rest 2.1 → 2.4 (no rest beat, R8.1) */
  const live = !held && step >= 3
  const kk = win(t, 2.4, 0, 1.6)
  const kf = win(t, 2.4, 1.6, 0.5)
  const kb = win(t, 2.4, 2.1, 0.3)
  let k = { x: K0.x, y: K0.y, op: 1 }
  if (live && kk >= 0) {
    const e = ease(kk)
    k = { x: K0.x + (K1.x - K0.x) * e, y: K0.y + (K1.y - K0.y) * e, op: 1 }
  } else if (live && kf >= 0) k = { x: K1.x, y: K1.y, op: 1 - kf }
  else if (live && kb >= 0) k = { x: K0.x, y: K0.y, op: kb }
  return (
    <Frame w={W} h={H}>
      <Fort x={FX} y={FY} core={core} band={band} hot={1} dim={lit(1) ? 2 : -1} />
      {RING_NAME.map((name, i) => (
        <div key={name} style={{ position: 'absolute', left: LX, top: LY + i * ROW, height: ROW - 8, display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ display: 'grid', placeItems: 'center', width: 24, height: 24, borderRadius: 99, background: i === 1 ? colors.accent : RING_TONE[i], color: i === 1 ? colors.white : RING_INK[i], opacity: i === 2 && lit(1) ? 0.35 : 1, transition: `opacity 420ms ${EASE}` }}>
            <span className={lc('breathe')} style={{ display: 'grid', ...lv(i * 0.5, 3.2) }}>
              <Icon name={RING_ICON[i]} size={14} />
            </span>
          </span>
          <span style={{ ...tag(14, colors.ink), textAlign: 'left' }}>{name}</span>
        </div>
      ))}
      {/* point 2: Network + Identity prevent, Monitoring detects */}
      {[
        { a: 0, b: 1, label: 'Prevention', icon: 'ShieldCheck' },
        { a: 4, b: 4, label: 'Detection', icon: 'ScanEye' },
      ].map(({ a, b, label, icon }) => {
        const y0 = LY + a * ROW + 2
        const y1 = LY + b * ROW + ROW - 10
        return (
          <Show key={label} on={on(2)} style={{ position: 'absolute', left: BX, top: y0, width: W - PAD - BX, height: y1 - y0 }}>
            <span aria-hidden style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, borderRadius: 2, background: lit(2) ? colors.accent : colors.brand, transition: `background 420ms ${EASE}` }} />
            <div style={{ position: 'absolute', left: 8, right: 0, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <span style={{ color: lit(2) ? colors.accent : colors.brand, display: 'grid', transition: `color 420ms ${EASE}` }}>
                <span className={lc('pulse')} style={{ display: 'grid', ...lv(a * 0.4, 2.2) }}>
                  <Icon name={icon} size={18} />
                </span>
              </span>
              <span style={tag(13)}>{label}</span>
            </div>
          </Show>
        )
      })}
      {/* point 3: a stolen key aimed at the identity wall (the arrow stops at the outer wall) */}
      <Arrow x1={K0.x - (KS / 2 + 4) * ca} y1={K0.y - (KS / 2 + 4) * sa} x2={cx + (R + 3) * ca} y2={cy + (R + 3) * sa} on={on(3)} lit={lit(3)} color={GREY} width={2} head={8} />
      <Show on={on(3)} style={{ position: 'absolute', left: k.x - KS / 2, top: k.y - KS / 2, width: KS, height: KS, zIndex: 9 }}>
        <span style={{ display: 'grid', placeItems: 'center', width: KS, height: KS, borderRadius: 99, background: colors.white, color: lit(3) ? colors.accent : '#4A5468', opacity: k.op, boxShadow: `inset 0 0 0 1.5px ${GREY}66, 0 6px 12px -8px rgba(16,32,58,0.5)` }}>
          <span className={lc('rock')} style={{ display: 'grid', ...lv(0, 2.4) }}>
            <Icon name="KeyRound" size={16} />
          </span>
        </span>
      </Show>
    </Frame>
  )
}

/* ================================================================== slide 30 · C_T17 */

function C_T17({ step, items }: { step: number; items: [string, string, string][] }) {
  const held = useHeld()
  const t = useClock(0)
  const hot = useHot(5, step)
  const on = (i: number) => held || step >= i
  const done = held || step >= 5
  const W = 1070
  const H = 290
  const CW = 196
  const CG = (W - 5 * CW) / 4
  const CY = 30
  const CH = 172
  const cx = (i: number) => i * (CW + CG) + CW / 2
  const LY = 252 // the request lane
  const SX = 20 // source centre
  const RX = W - 20 // resource centre
  const P = 6
  const gate = (i: number) => cx(i)
  return (
    <Frame w={W} h={H}>
      {/* the two layers: Network over the first three stages, Identity over the last two */}
      {[
        { a: 0, b: 2, label: 'Network', at: 1 },
        { a: 3, b: 4, label: 'Identity', at: 4 },
      ].map(({ a, b, label, at }) => (
        <Show key={label} on={on(at)} style={{ position: 'absolute', left: a * (CW + CG), top: 0, width: (b - a) * (CW + CG) + CW, height: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 22 }}>
            <span aria-hidden style={{ flex: 1, height: 2, borderRadius: 2, background: `${colors.brand}55` }} />
            <span style={tag(14)}>{label}</span>
            <span aria-hidden style={{ flex: 1, height: 2, borderRadius: 2, background: `${colors.brand}55` }} />
          </div>
        </Show>
      ))}
      {/* the five stages, each with its TR bullet */}
      {items.map(([text, icon, name], i) => (
        <Panel key={i} x={i * (CW + CG)} y={CY} w={CW} h={CH} on={on(i + 1)} lit={hot === i} radius={16}>
          <div style={{ position: 'absolute', left: 14, right: 14, top: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <MarkOrGlyph icon={icon} size={42} />
            <span style={heading(15, colors.brandDeep)}>{name}</span>
          </div>
          <div style={{ position: 'absolute', left: 14, right: 14, top: 66, ...body(15) }}>{text}</div>
        </Panel>
      ))}
      {/* the lane: internet → five checkpoints → resource */}
      <Show on={on(1)} style={{ position: 'absolute', inset: 0 }}>
        <div style={{ position: 'absolute', left: SX - 18, top: LY - 18 }}>
          <Glyph icon="Globe" size={36} loop="spin" t={14} />
        </div>
        <span style={{ position: 'absolute', left: SX - 30, width: 60, top: LY + 22, ...tag(12) }}>Internet</span>
      </Show>
      <Arrow x1={SX + 24} y1={LY} x2={RX - 24} y2={LY} on={on(1)} color={`${colors.brand}66`} width={2} head={9} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Show key={i} on={on(i + 1)} style={{ position: 'absolute', left: gate(i) - 4, top: LY - 16, width: 8, height: 32 }}>
          <span aria-hidden style={{ display: 'block', width: 8, height: 32, borderRadius: 4, background: hot === i ? colors.accent : colors.brand, transition: `background 420ms ${EASE}` }} />
        </Show>
      ))}
      <Show on={done} style={{ position: 'absolute', inset: 0 }}>
        <div style={{ position: 'absolute', left: RX - 18, top: LY - 18 }}>
          <Glyph icon="Server" size={36} loop="breathe" t={3} />
        </div>
        <span style={{ position: 'absolute', left: RX - 34, width: 68, top: LY + 22, ...tag(12) }}>Resource</span>
      </Show>
      {/* the loop, 6 s: a flood stopped at Shield, a malformed request stopped at WAF, a clean request through to the resource */}
      {done && !held && (
        <>
          {[-9, 0, 9].map((dy, j) => (
            <Ride key={j} x1={SX + 24} y1={LY + dy} x2={gate(0) - 10} y2={LY + dy} t={t} period={P} a={j * 0.12} d={0.8} size={9} tone={GREY} />
          ))}
          <Stop x={gate(0) - 18} y={LY - 26} t={t} period={P} a={1.05} />
          <Ride x1={SX + 24} y1={LY} x2={gate(1) - 12} y2={LY} t={t} period={P} a={1.6} d={1.1} size={18} tone={GREY} icon="FileWarning" />
          <Stop x={gate(1) - 18} y={LY - 26} t={t} period={P} a={2.7} />
          <Ride x1={SX + 24} y1={LY} x2={RX - 26} y2={LY} t={t} period={P} a={3.4} d={2.3} size={18} tone={colors.brand} icon="Check" />
        </>
      )}
    </Frame>
  )
}

/* ================================================================== slide 31 · C_T18 */

function C_T18({ step, items, groups }: { step: number; items: [string, string, number][]; groups: string[] }) {
  const held = useHeld()
  const t = useClock(0)
  const hot = useHot(5, step)
  const on = (i: number) => held || step >= i
  const done = held || step >= 5
  const W = 1070
  const H = 290
  const PAD = 16
  const GAP = 50
  const PW = (W - GAP) / 2 // each group panel
  const AX = PW + GAP
  const RW = PW - 2 * PAD // a row
  const RH = 56
  const RG = 6
  const TOP = PAD + 30 + 10 // rows start under the group header
  const AREA = 3 * RH + 2 * RG // the row band, same in both panels
  const LY = TOP + AREA + 20 // the lane, under the rows
  /* rows: Data holds items 0-1 (spread evenly over the band), Application holds 2-4 */
  const rowX = (i: number) => (i < 2 ? PAD : AX + PAD)
  const rowY = (i: number) => (i < 2 ? TOP + ((AREA - 2 * RH) / 3) * (i + 1) + RH * i : TOP + (i - 2) * (RH + RG))
  /* lane checkpoints: Data's two at 1/3 and 2/3 of its panel, Application's three at quarters */
  const cx = (i: number) => (i < 2 ? PAD + ((PW - 2 * PAD) * (i + 1)) / 3 : AX + PAD + ((PW - 2 * PAD) * (i - 1)) / 4)
  const STATION = ['Lock', '', 'ListFilter', 'RefreshCw', 'Code']
  const P = 7
  /* the clean packet: 0 → 4.6 s along the whole lane */
  const x0 = PAD + 12
  const x1 = W - PAD - 16
  const kc = win(t, P, 0, 4.6)
  const px = kc >= 0 ? x0 + (x1 - x0) * kc : -1
  const passed = (i: number) => px >= 0 && px > cx(i) - 4
  const near = (i: number) => px >= 0 && Math.abs(px - cx(i)) < 22
  const inTunnel = px >= 0 && Math.abs(px - cx(1)) < 46
  return (
    <Frame w={W} h={H}>
      {/* the two layers, each a group with its name */}
      {[
        { x: 0, at: 1, gi: 0, icon: 'Database' },
        { x: AX, at: 3, gi: 1, icon: 'AppWindow' },
      ].map(({ x, at, gi, icon }) => (
        <Panel key={gi} x={x} y={0} w={PW} h={H} on={on(at)} radius={20} tint="linear-gradient(180deg, #FFFFFF 0%, #F4F7FD 100%)">
          <div style={{ position: 'absolute', left: PAD, top: PAD, height: 30, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Glyph icon={icon} size={30} loop="breathe" t={3.4} d={gi} />
            <span style={heading(17, colors.brandDeep)}>{groups[gi]}</span>
          </div>
        </Panel>
      ))}
      {/* one row per TR bullet: the mark on the left, the bullet beside it (two lines at most) */}
      {items.map(([text, icon], i) => (
        <Panel key={i} x={rowX(i)} y={rowY(i)} w={RW} h={RH} on={on(i + 1)} lit={hot === i} radius={14}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px 0 9px' }}>
            <MarkOrGlyph icon={icon} size={40} d={i * 0.4} />
            <span style={body(16)}>{text}</span>
          </div>
        </Panel>
      ))}
      {/* the lane: data through the KMS lock and the TLS tunnel, across into the application's checks */}
      <Arrow x1={PAD + 6} y1={LY} x2={PW - 8} y2={LY} on={on(1)} color={`${colors.brand}55`} width={2} head={0.01} />
      <Arrow x1={PW + 6} y1={LY} x2={AX - 6} y2={LY} on={on(3)} color={colors.brand} width={2.5} head={9} />
      <Arrow x1={AX + 8} y1={LY} x2={W - 10} y2={LY} on={on(3)} color={`${colors.brand}55`} width={2} head={0.01} />
      {[0, 2, 3, 4].map((i) => (
        <Show key={i} on={on(i + 1)} style={{ position: 'absolute', left: cx(i) - 14, top: LY - 14 }}>
          <span style={{ display: 'grid', placeItems: 'center', width: 28, height: 28, borderRadius: 9, background: near(i) ? colors.success : colors.white, color: near(i) ? colors.white : hot === i ? colors.accent : colors.brand, boxShadow: `inset 0 0 0 1.5px ${hot === i ? colors.accent : colors.brand}55`, transition: `background 260ms ${EASE}, color 260ms ${EASE}` }}>
            <span className={lc(i === 3 ? 'spin' : 'breathe')} style={{ display: 'grid', ...lv(i * 0.3, i === 3 ? 6 : 3) }}>
              <Icon name={STATION[i]} size={15} />
            </span>
          </span>
        </Show>
      ))}
      {/* the TLS tunnel: a capsule the packet passes inside */}
      <Show on={on(2)} style={{ position: 'absolute', left: cx(1) - 46, top: LY - 13, width: 92, height: 26, zIndex: 9 }}>
        <span aria-hidden style={{ display: 'block', width: 92, height: 26, borderRadius: 13, background: 'linear-gradient(180deg, rgba(47,91,234,0.18) 0%, rgba(47,91,234,0.32) 100%)', boxShadow: `inset 0 0 0 2px ${hot === 1 ? colors.accent : colors.brand}`, transition: `box-shadow 420ms ${EASE}` }} />
      </Show>
      {done && !held && (
        <>
          {px >= 0 && !inTunnel && <Token x={px} y={LY} size={18} tone={colors.brand} icon={passed(0) ? 'Lock' : 'FileText'} />}
          {px >= 0 && inTunnel && <Token x={px} y={LY} size={12} tone={colors.brand} opacity={0.75} />}
          {(() => {
            const k = win(t, P, 4.6, 0.6)
            return k >= 0 ? <Token x={x1 - 14} y={LY} size={20} tone={colors.success} icon="Check" scale={0.7 + 0.3 * Math.min(1, k * 3)} opacity={k > 0.7 ? (1 - k) / 0.3 : 1} /> : null
          })()}
          <Ride x1={PW + 6} y1={LY} x2={cx(2) - 20} y2={LY} t={t} period={P} a={4.9} d={1.2} size={18} tone={GREY} icon="FileWarning" />
          <Stop x={cx(2) - 20} y={LY} t={t} period={P} a={6.1} d={0.6} />
        </>
      )}
    </Frame>
  )
}

/* ================================================================== slide 32 · C_T19 */

function C_T19({ step, items }: { step: number; items: [string, string][] }) {
  const held = useHeld()
  const t = useClock(0)
  const hot = useHot(4, step)
  const on = (i: number) => held || step >= i
  const done = held || step >= 4
  const W = 1070
  const H = 290
  const RH = 130
  const R2 = H - RH
  const C1 = { x: 0, w: 336 }
  const C2 = { x: 386, w: 300 }
  const C3 = { x: 736, w: W - 736 }
  const AL = { cx: C2.x + C2.w / 2, cy: R2 + RH / 2 } // the alarm bell, on its arrow's line
  const P = 6
  const y1 = RH / 2
  const y2 = R2 + RH / 2
  /* the CloudWatch metric: rises over 0 → 3 s, crosses the threshold at ~2.6 s, settles back 5 → 6 s */
  const u = ((t % P) + P) % P
  const lvl = held ? 0.55 : u < 3 ? u / 3 : u < 5 ? 1 : 1 - (u - 5)
  const over = !held && done && lvl > 0.86
  const alarmK = win(t, P, 3.4, 1.0)
  const siren = !held && done && (win(t, P, 2.9, 0.5) >= 0 || win(t, P, 5.2, 0.6) >= 0)
  const card = (i: number, x: number, y: number, w: number, strip: ReactNode) => {
    const [text, icon] = items[i]
    return (
      <Panel x={x} y={y} w={w} h={RH} on={on(i + 1)} lit={hot === i} radius={16}>
        <div style={{ position: 'absolute', left: 14, top: 14 }}>
          <MarkOrGlyph icon={icon} size={44} />
        </div>
        <div style={{ position: 'absolute', left: 70, right: 14, top: 12, ...body(15) }}>{text}</div>
        <div style={{ position: 'absolute', left: 70, right: 14, bottom: 12, height: 26, overflow: 'hidden', borderRadius: 7, background: '#F1F5FD', boxShadow: 'inset 0 0 0 1px #DCE5F7' }}>{strip}</div>
      </Panel>
    )
  }
  /* CloudTrail: log lines scrolling up (who · what · when) */
  const logs = (
    <div className={lc('scroll')} style={{ position: 'absolute', left: 8, right: 8, top: 0, ...lv(0, 4.8) }}>
      {[0, 1, 2, 3, 0, 1, 2, 3].map((r, j) => (
        <div key={j} style={{ height: 26, display: 'flex', alignItems: 'center', gap: 6, color: colors.brand }}>
          <Icon name="User" size={12} />
          <span style={{ display: 'block', height: 6, width: [70, 54, 86, 62][r], borderRadius: 3, background: `${colors.brand}66` }} />
          <span style={{ display: 'block', height: 6, width: [40, 60, 34, 48][r], borderRadius: 3, background: `${colors.brand}33` }} />
          <span style={{ marginLeft: 'auto', display: 'grid' }}>
            <Icon name="Clock" size={12} />
          </span>
        </div>
      ))}
    </div>
  )
  /* CloudWatch: a metric line and its threshold */
  const SW = C1.w - 84
  const pts = Array.from({ length: 13 }, (_, k) => {
    const x = (k / 12) * SW
    const base = 18 - k * 1.05 * lvl - (k % 2 ? 2 : 0)
    return `${x.toFixed(1)},${Math.max(3, Math.min(23, base)).toFixed(1)}`
  }).join(' ')
  const metric = (
    <svg aria-hidden width={SW} height={26} style={{ position: 'absolute', left: 0, top: 0 }}>
      <line x1={0} x2={SW} y1={7} y2={7} stroke={GREY} strokeWidth={1.2} strokeDasharray="4 4" />
      <polyline points={pts} fill="none" stroke={over ? colors.accent : colors.brand} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
  /* GuardDuty: a scanner sweeping the logs */
  const scan = (
    <>
      {[0, 1, 2].map((r) => (
        <span key={r} style={{ position: 'absolute', left: 10 + r * 66, top: 10, display: 'block', height: 6, width: 52, borderRadius: 3, background: `${colors.brand}40` }} />
      ))}
      <span className={lc('sweep')} style={{ position: 'absolute', left: 0, top: 3, color: colors.brand, display: 'grid', ...lv(0, 2.6, { '--cz-x': `${C2.w - 104}px` }) }}>
        <Icon name="ScanSearch" size={18} />
      </span>
    </>
  )
  const [irText] = items[3]
  return (
    <Frame w={W} h={H}>
      {card(0, C1.x, 0, C1.w, logs)}
      {card(1, C1.x, R2, C1.w, metric)}
      {card(2, C2.x, 0, C2.w, scan)}
      {/* the alarm CloudWatch triggers */}
      <Show on={on(2)} style={{ position: 'absolute', left: AL.cx - 28, top: AL.cy - 28, width: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <span style={{ display: 'grid', placeItems: 'center', width: 56, height: 56, borderRadius: 16, ...TILE_SKIN, color: alarmK >= 0 ? colors.accent : colors.brand, transition: `color 260ms ${EASE}` }}>
          <span style={{ display: 'grid', transform: alarmK >= 0 ? `rotate(${Math.sin(alarmK * Math.PI * 6) * 16}deg)` : undefined, transformOrigin: '50% 15%' }}>
            <Icon name="BellRing" size={28} />
          </span>
        </span>
        <span style={tag(13)}>Alarm</span>
      </Show>
      {/* incident response: where both alerts land */}
      <Panel x={C3.x} y={0} w={C3.w} h={H} on={on(4)} lit={hot === 3} radius={18}>
        <div style={{ position: 'absolute', inset: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 68, height: 68, borderRadius: 20, background: siren ? colors.accent : colors.brand, color: colors.white, transition: `background 260ms ${EASE}` }}>
            <span aria-hidden className={lc('ping')} style={{ position: 'absolute', inset: 0, borderRadius: 20, boxShadow: `0 0 0 2px ${colors.brand}`, ...lv(0, 2) }} />
            <span className={lc('pulse')} style={{ display: 'grid', ...lv(0, 1.6) }}>
              <Icon name="Siren" size={34} />
            </span>
          </span>
          <span style={{ ...body(16, colors.ink), textAlign: 'center' }}>{irText}</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <span style={{ display: 'grid', placeItems: 'center', width: 40, height: 40, borderRadius: 12, ...TILE_SKIN, color: colors.brand }}>
              <span className={lc('bob')} style={{ display: 'grid', ...lv(0, 2.2) }}>
                <Icon name="Search" size={20} />
              </span>
            </span>
            <span style={tag(13)}>Investigate</span>
          </div>
        </div>
      </Panel>
      {/* the flows */}
      <Arrow x1={C1.w + 6} y1={y1} x2={C2.x - 6} y2={y1} on={on(3)} lit={hot === 2} />
      <Arrow x1={C1.w + 6} y1={y2} x2={AL.cx - 36} y2={y2} on={on(2)} lit={hot === 1} />
      <Arrow x1={C2.x + C2.w + 6} y1={y1} x2={C3.x - 6} y2={y1} on={on(4)} lit={hot === 3} />
      <Arrow x1={AL.cx + 36} y1={y2} x2={C3.x - 6} y2={y2} on={on(4)} lit={hot === 3} />
      {done && !held && (
        <>
          <Ride x1={C1.w + 6} y1={y1} x2={C2.x - 10} y2={y1} t={t} period={P} a={0.3} d={0.9} size={18} icon="ScrollText" />
          <Ride x1={C2.x + C2.w + 6} y1={y1} x2={C3.x - 10} y2={y1} t={t} period={P} a={2.2} d={0.7} size={18} tone={colors.accent} icon="TriangleAlert" />
          <Ride x1={C1.w + 6} y1={y2} x2={AL.cx - 40} y2={y2} t={t} period={P} a={2.6} d={0.8} size={18} icon="Activity" />
          <Ride x1={AL.cx + 36} y1={y2} x2={C3.x - 10} y2={y2} t={t} period={P} a={4.5} d={0.7} size={18} tone={colors.accent} icon="TriangleAlert" />
        </>
      )}
    </Frame>
  )
}

/* ------------------------------------------------------------------ exports */

export const figures: Record<string, Fig> = {
  C_T16: C_T16 as unknown as Fig,
  C_T17: C_T17 as unknown as Fig,
  C_T18: C_T18 as unknown as Fig,
  C_T19: C_T19 as unknown as Fig,
  C_T21: C_T21 as unknown as Fig,
}

/* the loop vocabulary (transform / opacity only), held still on ?still, thumbnails and reduced motion */
export const css = `
.cz { animation-delay: var(--cz-d, 0s); }
@keyframes cz-breathe { 0%, 100% { transform: translateY(0) scale(1) } 50% { transform: translateY(-1.5px) scale(1.08) } }
.cz-breathe { animation: cz-breathe var(--cz-t, 3.2s) cubic-bezier(0.45,0,0.55,1) infinite; transform-origin: center; }
@keyframes cz-bob { 0%, 100% { transform: translateY(-2px) } 50% { transform: translateY(2px) } }
.cz-bob { animation: cz-bob var(--cz-t, 2.2s) ease-in-out infinite; }
@keyframes cz-pulse { 0%, 100% { transform: scale(0.94) } 50% { transform: scale(1.07) } }
.cz-pulse { animation: cz-pulse var(--cz-t, 1.8s) ease-in-out infinite; transform-origin: center; }
@keyframes cz-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
.cz-spin { animation: cz-spin var(--cz-t, 8s) linear infinite; transform-origin: center; }
@keyframes cz-rock { 0%, 100% { transform: rotate(-10deg) } 50% { transform: rotate(10deg) } }
.cz-rock { animation: cz-rock var(--cz-t, 2.4s) ease-in-out infinite; transform-origin: 50% 50%; }
@keyframes cz-ping { 0% { transform: scale(0.9); opacity: 0.6 } 100% { transform: scale(1.4); opacity: 0 } }
.cz-ping { animation: cz-ping var(--cz-t, 2s) ease-out infinite; opacity: 0; }
@keyframes cz-sweep { 0%, 100% { transform: translateX(0) } 50% { transform: translateX(var(--cz-x, 200px)) } }
.cz-sweep { animation: cz-sweep var(--cz-t, 2.6s) ease-in-out infinite; }
@keyframes cz-scroll { from { transform: translateY(0) } to { transform: translateY(-104px) } }
.cz-scroll { animation: cz-scroll var(--cz-t, 4.8s) linear infinite; }
.cc-still .cz, .deck-thumb .cz { animation: none !important; }
.cc-still .cz-ping, .deck-thumb .cz-ping { opacity: 0 !important; }
@media (prefers-reduced-motion: reduce) {
  .cz { animation: none !important; }
  .cz-ping { opacity: 0 !important; }
}
`
