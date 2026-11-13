import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { animate } from 'framer-motion'
import { useSpring, animated } from '@react-spring/web'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { SPEED } from '@/deck/autoAnim'
import { TILE_SKIN } from '@/decks/figures/card'
import { Arrow } from '@/decks/figures/scene'
import { MOTION, motionHeld } from '@/motion/tokens'
import { litRing } from '@/decks/figures/net/frames'
import * as K from '@/decks/figures/d3/kit'
import { Icon } from '@/engine/icon'
import ec2Inst from '../images/aws-ec2-instance.svg'
import ec2Mark from '../images/aws-ec2.svg'
import ebsVol from '../images/aws-ebs-volume.svg'
import { useCycle, IconTag, Tagged } from './r4'

/*
 * BUILDER A · Elastic Compute Instances, sections 1 and 2 (Session 9). ROUND 2, 2026-11-10: rebuilt to the user's
 * GLOBAL RULES (standing correction 13 / cloud course R10): icons instead of chips and explanatory text (a 1-3 word
 * label only where an icon alone is ambiguous), a loop or micro-animation on every visual, equal padding on all four
 * sides of every inner card, visuals centred, arrows straight.
 *
 * Each figure takes the slide's `step` (0 = start, n = whole; on a points slide step i is the part of point i).
 * Loops are CSS (`.ax` classes below, transform / opacity / stroke only) or a small rAF clock (`useClock`); both stop on
 * `?still` (`.cc-still`), in picker thumbnails (`.deck-thumb` / instant renders) and under prefers-reduced-motion,
 * and the resting frame is the meaningful end state. Labels are DOM text in TR words. Styling is inline.
 */

const EASE = MOTION.ease
const EASE_ARR = MOTION.ease.replace(/[^0-9.,]/g, '').split(',').map(Number) as [number, number, number, number]
const useHeld = () => motionHeld(useInstant())

/**
 * ROUND 4 (A4): the orange highlight of an n-step figure follows the step while the build runs; once every step is
 * in, it keeps walking 1 → n → 1 for ever (holds the last item one beat, then wraps to the first), never parking.
 * Returns the current item (1-based; 0 = none) and `lit(i)`.
 */
function useLit(step: number, n: number) {
  const held = useHeld()
  const cyc = useCycle(n, step >= n)
  const cur = held ? -1 : cyc >= 0 ? ((cyc + n - 1) % n) + 1 : step
  return { cur, lit: (i: number) => cur === i }
}

/* ------------------------------------------------------------------ loop vocabulary */

/** class list for a CSS loop */
const lc = (kind: string) => `ax ax-${kind}`
/** its phase (seconds of negative delay) and optional duration */
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
const small = (color: string = colors.muted): CSSProperties => ({ fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 600, fontSize: 14, lineHeight: 1.15, color, whiteSpace: 'nowrap' })

/** an official AWS mark on its white tile (rule 54) */
function MarkTile({ src, size = 56 }: { src: string; size?: number }) {
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: Math.round(size * 0.27), ...TILE_SKIN, flexShrink: 0 }}>
      <img src={src} alt="" aria-hidden draggable={false} style={{ width: Math.round(size * 0.76), display: 'block' }} />
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
function Panel({ x, y, w, h, lit = false, on = true, radius = 16, children, style }: { x: number; y: number; w: number; h: number; lit?: boolean; on?: boolean; radius?: number; children?: ReactNode; style?: CSSProperties }) {
  const instant = useInstant()
  return (
    <Show on={on} style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: radius, ...TILE_SKIN, boxShadow: litRing(lit, TILE_SKIN.boxShadow as string), transition: instant ? 'none' : `box-shadow 420ms ${EASE}`, ...style }} />
      <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
    </Show>
  )
}

function useOnce(on: boolean, ms: number) {
  const held = useHeld()
  const [k, setK] = useState(0)
  useEffect(() => {
    if (!on) {
      setK(0)
      return
    }
    if (held) {
      setK(1)
      return
    }
    const c = animate(0, 1, { duration: (ms * SPEED) / 1000, ease: EASE_ARR, onUpdate: setK })
    return () => c.stop()
  }, [on, held, ms])
  return !on ? 0 : held ? 1 : k
}

/** a dot that rides once along a polyline while `on`, fading out at its end */
function RideDot({ points, on, ms = MOTION.flow.dur * 1000, tone = colors.accent, size = MOTION.flow.dot + 2 }: { points: [number, number][]; on: boolean; ms?: number; tone?: string; size?: number }) {
  const k = useOnce(on, ms)
  const held = useHeld()
  if (!on || held) return null
  const seg = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]))
  const total = seg.reduce((a, b) => a + b, 0)
  let d = k * total
  let x = points[0][0]
  let y = points[0][1]
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i]) {
      const tt = seg[i] ? d / seg[i] : 0
      x = points[i][0] + (points[i + 1][0] - points[i][0]) * tt
      y = points[i][1] + (points[i + 1][1] - points[i][1]) * tt
      break
    }
    d -= seg[i]
    x = points[i + 1][0]
    y = points[i + 1][1]
  }
  const op = k < 0.08 ? k / 0.08 : k > 0.9 ? (1 - k) / 0.1 : 1
  return <span aria-hidden style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: 99, background: tone, opacity: op, boxShadow: `0 0 0 4px ${tone}33, 0 6px 12px -6px ${tone}`, zIndex: 8 }} />
}

/** a status LED that blinks on its own phase */
const Led = ({ c = colors.success, d = 0, s = 7 }: { c?: string; d?: number; s?: number }) => (
  <span className={lc('blink')} style={{ display: 'block', width: s, height: s, borderRadius: 99, background: c, boxShadow: `0 0 6px ${c}`, ...lv(d) }} />
)

/** a radar ping ring behind a centred element */
const Ping = ({ size, c = colors.brand, d = 0, t = 2.4 }: { size: number; c?: string; d?: number; t?: number }) => (
  <span aria-hidden className={lc('ping')} style={{ position: 'absolute', left: '50%', top: '50%', width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, borderRadius: 999, boxShadow: `0 0 0 2px ${c}`, ...lv(d, t) }} />
)

/** a small server box: chassis with LEDs and vent lines */
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

/* ------------------------------------------------------------------ T01 · host, hypervisor, one instance (616 x 340) */

const RES = [
  { icon: 'Cpu', loop: 'pulse', tag: 'vCPU' },
  { icon: 'MemoryStick', loop: 'bob', tag: 'Memory' },
  { icon: 'Network', loop: 'pulse', tag: 'Network' },
  { icon: 'HardDrive', loop: 'bob', tag: 'Storage' },
] as const

const LIFE = [
  { t: 'Pending', icon: 'Hourglass', c: '#F29A2E' },
  { t: 'Running', icon: 'Play', c: '#1E9E5A' },
  { t: 'Stopped', icon: 'Pause', c: '#7F8BA6' },
  { t: 'Terminated', icon: 'Power', c: '#D9434E' },
] as const

function SideVm({ x, d }: { x: number; d: number }) {
  return (
    <div style={{ position: 'absolute', left: x, top: 60, width: 104, height: 122, borderRadius: 14, background: 'linear-gradient(180deg, #FFFFFF 0%, #F1F5FD 100%)', boxShadow: 'inset 0 0 0 1.5px #D9E3F6', display: 'grid', placeItems: 'center' }}>
      <Tagged tag="VM" size={12}>
        <span className={lc('bob')} style={{ display: 'grid', placeItems: 'center', ...lv(d) }}>
          <GlyphTile icon="Monitor" size={50} tone={colors.muted} />
        </span>
      </Tagged>
    </div>
  )
}

function A_T01({ step }: { step: number }) {
  const held = useHeld()
  const { lit } = useLit(step, 4)
  const instant = useInstant()
  const clock = useClock(0)
  /* the lifecycle marker walks Pending → Running → Stopped → Terminated, 1.2 s a state, for ever */
  const at = held ? 1 : Math.floor(clock / 1.2) % 4
  const W = 616
  const HX = 20
  const HW = W - 2 * HX
  const DX = (HW - 4 * 112) / 3
  return (
    <Frame w={W} h={340}>
      {/* the physical host: 20 px inside the stage on every side of the group */}
      <div style={{ position: 'absolute', left: HX, top: 20, width: HW, height: 210, borderRadius: 18, background: 'linear-gradient(180deg, #F7FAFF 0%, #EAF1FE 100%)', boxShadow: 'inset 0 0 0 1.5px #CFDCF5, 0 14px 28px -20px rgba(31,64,140,0.4)' }} />
      <div style={{ position: 'absolute', left: HX + 14, top: 30, ...flex(8) }}>
        <MiniServer w={40} />
        <span style={small(colors.brandDark)}>Physical Server</span>
      </div>
      <SideVm x={HX + 18} d={0} />
      <SideVm x={HX + HW - 18 - 104} d={1.3} />
      {/* the instance */}
      <div
        style={{
          position: 'absolute',
          left: 190,
          top: 60,
          width: 236,
          height: 122,
          borderRadius: 16,
          ...TILE_SKIN,
          boxShadow: `inset 0 0 0 2px ${colors.brand}, 0 16px 28px -16px rgba(31,64,140,0.5)`,
          transition: instant ? 'none' : `box-shadow 420ms ${EASE}`,
        }}
      />
      {step >= 4 && (
        <div style={{ position: 'absolute', left: 190, top: 60, width: 236, height: 122 }}>
          <span aria-hidden className={lc('halo')} style={{ position: 'absolute', inset: -6, borderRadius: 20, boxShadow: `0 0 0 3px ${colors.brand}`, ...lv(0, 2.4) }} />
        </div>
      )}
      <div style={{ position: 'absolute', left: 204, top: 70, ...flex(10) }}>
        <MarkTile src={ec2Inst} size={34} />
        <span style={heading(17)}>Instance</span>
      </div>
      {/* instance ID: a tag with a barcode */}
      <div style={{ position: 'absolute', left: 326, top: 76 }}>
        <Show on={step >= 2}>
          <span style={{ ...flex(4), padding: '5px 8px', borderRadius: 9, background: lit(2) ? colors.brand : colors.surface2, color: lit(2) ? colors.white : colors.brand, boxShadow: `inset 0 0 0 1.5px ${colors.brand}`, transition: instant ? 'none' : `background 420ms ${EASE}` }}>
            <span className={lc('swing')} style={{ display: 'grid', ...lv(0, 3) }}>
              <Icon name="Tag" size={15} />
            </span>
            {[3, 1, 2, 1, 3].map((bw, i) => (
              <span key={i} style={{ width: bw, height: 14, borderRadius: 1, background: 'currentColor', opacity: 0.85 }} />
            ))}
            <IconTag size={12} color="currentColor">ID</IconTag>
          </span>
        </Show>
      </div>
      {/* the four resources bundled into it */}
      <div style={{ position: 'absolute', left: 200, top: 116, width: 216, ...flex(4, 'row', { justifyContent: 'space-between' }) }}>
        {RES.map((r, i) => (
          <Show key={r.icon} on={step >= 1} delay={i * 90}>
            <Tagged tag={r.tag} size={11} gap={3}>
              <span style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
                {lit(1) && <Ping size={36} d={i * 0.3} />}
                <GlyphTile icon={r.icon} size={36} loop={r.loop} d={i * 0.45} tone={colors.brand} />
              </span>
            </Tagged>
          </Show>
        ))}
      </div>
      {step >= 4 && (
        <C x={426} y={33} z={9}>
          <IconTag size={12}>Isolated</IconTag>
        </C>
      )}
      {step >= 4 && (
        <C x={426} y={60} z={9}>
          <span style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 99, background: colors.brand, color: colors.white, boxShadow: `0 0 0 3px ${colors.white}` }}>
            <span className={lc('pulse')} style={{ display: 'grid', ...lv(0) }}>
              <Icon name="ShieldCheck" size={17} />
            </span>
          </span>
        </C>
      )}
      {/* the hypervisor layer: a light sweeps along it */}
      <div style={{ position: 'absolute', left: HX + 14, top: 192, width: HW - 28, height: 28, borderRadius: 9, overflow: 'hidden', background: `linear-gradient(180deg, ${colors.brand} 0%, ${colors.brandDark} 100%)`, ...flex(8, 'row', { justifyContent: 'center' }), color: colors.white }}>
        <span aria-hidden className={lc('sweep')} style={{ position: 'absolute', left: 0, top: 0, width: 90, height: 28, background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0) 100%)', ...lv(0, 3.2, { '--ax-x': `${HW - 28}px` }) }} />
        <Icon name="Layers" size={15} />
        <span style={heading(14, colors.white)}>Hypervisor</span>
      </div>
      {/* the lifecycle: four state discs, a marker walking through them */}
      <Show on={step >= 3} style={{ position: 'absolute', left: HX, top: 244, width: HW, height: 76 }}>
        {LIFE.map((s, i) => {
          const x = i * (112 + DX)
          const here = at === i
          return (
            <div key={s.t} style={{ position: 'absolute', left: x, top: 0, width: 112, ...flex(6, 'column') }}>
              <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 44, height: 44 }}>
                {here && !held && <Ping size={44} c={s.c} t={1.2} />}
                <span style={{ display: 'grid', placeItems: 'center', width: 44, height: 44, borderRadius: 99, background: here || held ? s.c : '#E3EBFB', color: here || held ? colors.white : s.c, transform: here && !held ? 'scale(1.08)' : 'none', transition: instant || held ? 'none' : `background 300ms ${EASE}, transform 300ms ${EASE}, color 300ms ${EASE}`, boxShadow: `0 8px 14px -10px ${s.c}` }}>
                  <Icon name={s.icon} size={20} />
                </span>
              </span>
              <span style={small(lit(3) || here ? colors.ink : colors.muted)}>{s.t}</span>
            </div>
          )
        })}
        {[0, 1, 2].map((i) => {
          const x1 = i * (112 + DX) + 56 + 30
          const x2 = (i + 1) * (112 + DX) + 56 - 30
          return <Arrow key={i} x1={x1} y1={22} x2={x2} y2={22} on tone={colors.muted} width={2} />
        })}
      </Show>
    </Frame>
  )
}

/* ------------------------------------------------------------------ the five animated stage icons (slides 8, 9) */

/** Request: a console window; the cursor travels to the launch button and clicks it, on a loop */
function ReqIcon({ s = 1 }: { s?: number }) {
  return (
    <span style={{ position: 'relative', display: 'block', width: 104 * s, height: 78 * s }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: 10 * s, background: colors.white, boxShadow: `inset 0 0 0 1.5px #C9D7F2, 0 10px 18px -12px rgba(31,64,140,0.5)` }} />
      <span style={{ position: 'absolute', left: 0, top: 0, right: 0, height: 16 * s, borderRadius: `${10 * s}px ${10 * s}px 0 0`, background: '#232F3E', ...flex(3 * s, 'row', { paddingLeft: 7 * s }) }}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
          <span key={c} style={{ width: 5 * s, height: 5 * s, borderRadius: 9, background: c }} />
        ))}
      </span>
      <span style={{ position: 'absolute', left: 10 * s, top: 24 * s, width: 50 * s, height: 5 * s, borderRadius: 3, background: '#DCE5F7' }} />
      <span style={{ position: 'absolute', left: 10 * s, top: 34 * s, width: 34 * s, height: 5 * s, borderRadius: 3, background: '#DCE5F7' }} />
      <span className={lc('press')} style={{ position: 'absolute', left: 52 * s, top: 48 * s, width: 42 * s, height: 18 * s, borderRadius: 9 * s, background: '#FF9900', display: 'grid', placeItems: 'center', color: '#16191F', ...lv(0, 2.6) }}>
        <Icon name="Rocket" size={Math.round(11 * s)} />
      </span>
      <span className={lc('cursor')} style={{ position: 'absolute', left: 72 * s, top: 58 * s, color: colors.ink, ...lv(0, 2.6, { '--ax-cx': `${-40 * s}px`, '--ax-cy': `${-26 * s}px` }) }}>
        <Icon name="MousePointer2" size={Math.round(18 * s)} />
      </span>
    </span>
  )
}

/** Scheduler: three hosts; the selector sweeps and settles on the one with free capacity */
function SchedIcon({ s = 1 }: { s?: number }) {
  const w = 30 * s
  const g = 8 * s
  return (
    <span style={{ position: 'relative', display: 'block', width: 3 * w + 2 * g, height: 74 * s }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ position: 'absolute', left: i * (w + g), top: 10 * s, width: w, height: 56 * s, borderRadius: 6 * s, background: 'linear-gradient(180deg, #F3F7FF 0%, #E2EAFA 100%)', boxShadow: 'inset 0 0 0 1.5px #C9D7F2', overflow: 'hidden' }}>
          {/* used capacity (blue) and free capacity (green on the last host) */}
          <span style={{ position: 'absolute', left: 4 * s, right: 4 * s, bottom: 4 * s, height: (i === 2 ? 16 : 40) * s, borderRadius: 3 * s, background: i === 2 ? '#BFE8CF' : '#8FB0F7' }} />
          {i === 2 && <span className={lc('fill')} style={{ position: 'absolute', left: 4 * s, right: 4 * s, bottom: 4 * s, height: 16 * s, borderRadius: 3 * s, background: '#1E9E5A', transformOrigin: 'bottom', ...lv(0, 2.8) }} />}
        </span>
      ))}
      <span className={lc('sched')} style={{ position: 'absolute', left: -3 * s, top: 6 * s, width: w + 6 * s, height: 64 * s, borderRadius: 8 * s, boxShadow: `0 0 0 2.5px ${colors.accent}`, ...lv(0, 2.8, { '--ax-step': `${w + g}px` }) }} />
    </span>
  )
}

/** Hypervisor boot: a power button inside a ring that fills, on a loop */
function BootIcon({ s = 1 }: { s?: number }) {
  const r = 30 * s
  return (
    <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 2 * r + 12 * s, height: 2 * r + 12 * s }}>
      <svg width={2 * r + 12 * s} height={2 * r + 12 * s} viewBox="0 0 72 72" style={{ position: 'absolute', inset: 0 }} aria-hidden>
        <circle cx={36} cy={36} r={30} fill="none" stroke="#DCE5F7" strokeWidth={6} />
        <circle className={lc('ring')} cx={36} cy={36} r={30} fill="none" stroke={colors.brand} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray="1" transform="rotate(-90 36 36)" style={{ strokeDashoffset: 0, ...lv(0, 2.6) }} />
      </svg>
      <span style={{ display: 'grid', placeItems: 'center', width: 40 * s, height: 40 * s, borderRadius: 99, background: `linear-gradient(160deg, #5B86FF 0%, ${colors.brandDark} 100%)`, color: colors.white, boxShadow: '0 8px 14px -8px rgba(31,69,200,0.9)' }}>
        <span className={lc('pulse')} style={{ display: 'grid', ...lv(0, 1.3) }}>
          <Icon name="Power" size={Math.round(20 * s)} />
        </span>
      </span>
    </span>
  )
}

/** Running: a live server with blinking LEDs and a scrolling activity trace */
function RunIcon({ s = 1 }: { s?: number }) {
  const w = 96 * s
  return (
    <span style={{ position: 'relative', display: 'block', width: w, height: 70 * s }}>
      <span style={{ position: 'absolute', left: 0, top: 0, width: w, height: 30 * s, borderRadius: 7 * s, background: `linear-gradient(180deg, #2B3F7A 0%, #16244F 100%)`, ...flex(4 * s, 'row', { paddingLeft: 8 * s }) }}>
        <Led d={0} s={6 * s} />
        <Led d={0.5} s={6 * s} />
        <Led d={1.1} c="#7FD3FF" s={6 * s} />
        <span style={{ marginLeft: 6 * s, width: 34 * s, height: 3 * s, borderRadius: 2, background: 'rgba(255,255,255,0.35)' }} />
      </span>
      <span style={{ position: 'absolute', left: 0, top: 36 * s, width: w, height: 32 * s, borderRadius: 7 * s, overflow: 'hidden', background: '#EAF7EF', boxShadow: 'inset 0 0 0 1.5px #BFE8CF' }}>
        <svg className={lc('scroll')} width={w * 2} height={32 * s} viewBox="0 0 192 32" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, top: 0, display: 'block', ...lv(0, 2.4) }} aria-hidden>
          <path d="M0 22 L12 22 L18 10 L26 26 L34 14 L44 22 L60 22 L66 8 L74 24 L84 16 L96 22 L108 22 L114 10 L122 26 L130 14 L140 22 L156 22 L162 8 L170 24 L180 16 L192 22" fill="none" stroke="#1E9E5A" strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </span>
    </span>
  )
}

/** Status check: a shield with a tick, two check pings rippling out */
function CheckIcon({ s = 1 }: { s?: number }) {
  return (
    <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 76 * s, height: 76 * s }}>
      <Ping size={52 * s} c="#1E9E5A" t={2.2} />
      <Ping size={52 * s} c="#1E9E5A" t={2.2} d={1.1} />
      <span style={{ display: 'grid', placeItems: 'center', width: 52 * s, height: 52 * s, borderRadius: 16 * s, background: 'linear-gradient(160deg, #4CC383 0%, #1E9E5A 100%)', color: colors.white, boxShadow: '0 10px 16px -10px rgba(30,158,90,0.9)' }}>
        <span className={lc('pop')} style={{ display: 'grid', ...lv(0, 2.2) }}>
          <Icon name="ShieldCheck" size={Math.round(28 * s)} />
        </span>
      </span>
    </span>
  )
}

/* ------------------------------------------------------------------ T02 · request to running, five stages (1080 x 330) */

const STAGES = [
  { t: 'Request', art: () => <ReqIcon /> },
  { t: 'Scheduler', art: () => <SchedIcon /> },
  { t: 'Hypervisor Boot', art: () => <BootIcon /> },
  { t: 'Running', art: () => <RunIcon /> },
  { t: 'Status Check', art: () => <CheckIcon /> },
] as const

function A_T02({ step }: { step: number }) {
  /* equal padding: 48 px from every card to the stage edge, 40 px between cards */
  const W = 1080
  const H = 330
  const P = 48
  const GAP = 40
  const CW = (W - 2 * P - 4 * GAP) / 5
  const CH = H - 2 * P
  const { cur, lit } = useLit(step, 5)
  const cx = (i: number) => P + i * (CW + GAP) + CW / 2
  const cy = P + CH / 2
  return (
    <Frame w={W} h={H}>
      {STAGES.map((s, i) => (
        <Panel key={s.t} x={P + i * (CW + GAP)} y={P} w={CW} h={CH} on={step >= i + 1} lit={lit(i + 1)}>
          <div style={{ ...flex(16, 'column', { justifyContent: 'center' }), height: '100%', padding: 16, boxSizing: 'border-box' }}>
            <div style={{ height: 96, display: 'grid', placeItems: 'center' }}>{s.art()}</div>
            <span style={heading(16, colors.brandDark)}>{s.t}</span>
          </div>
        </Panel>
      ))}
      {[0, 1, 2, 3].map((i) => (
        <Arrow key={i} x1={cx(i) + CW / 2 + 5} y1={cy} x2={cx(i + 1) - CW / 2 - 5} y2={cy} on={step >= i + 2} />
      ))}
      {[1, 2, 3, 4].map((i) => (
        <RideDot key={i} points={[[cx(i - 1) + CW / 2 + 5, cy], [cx(i) - CW / 2 - 5, cy]]} on={cur === i + 1} ms={900} />
      ))}
    </Frame>
  )
}

/* ------------------------------------------------------------------ T02-B · each stage with its point (456 x 400) */

function MiniTile({ icon, tone = colors.brand, loop, d = 0, bg }: { icon: string; tone?: string; loop?: string; d?: number; bg?: string }) {
  return <GlyphTile icon={icon} size={32} tone={tone} loop={loop} d={d} bg={bg} />
}

function A_T02B({ step }: { step: number }) {
  const held = useHeld()
  const lit = (i: number) => step === i && !held
  const W = 456
  const P = 16
  const RW = W - 2 * P
  const RH = 54
  const G = 8
  const TOPH = 62
  const rows: { title: string; at: number; icon: ReactNode; parts: ReactNode }[] = [
    {
      title: 'Request',
      at: 1,
      icon: <MiniTile icon="FileText" loop="bob" />,
      parts: (
        <>
          <MiniTile icon="Disc3" loop="spin" d={0} />
          <MiniTile icon="Cpu" loop="pulse" d={0.4} />
          <MiniTile icon="Network" loop="pulse" d={0.8} />
        </>
      ),
    },
    {
      title: 'Scheduler',
      at: 2,
      icon: <MiniTile icon="Server" loop="bob" d={0.3} />,
      parts: <SchedIcon s={0.62} />,
    },
    {
      title: 'Hypervisor Boot',
      at: 3,
      icon: <MiniTile icon="Power" loop="pulse" />,
      parts: (
        <>
          <MiniTile icon="Disc3" loop="spin" />
          <svg width={30} height={12} viewBox="0 0 30 12" aria-hidden style={{ display: 'block' }}>
            <line className={lc('dash')} x1={2} y1={6} x2={21} y2={6} stroke={colors.brand} strokeWidth={2.2} strokeDasharray="4 4" strokeLinecap="round" />
            <path d="M 29 6 L 21 2 L 21 10 Z" fill={colors.brand} />
          </svg>
          <MiniTile icon="Monitor" loop="pulse" d={0.6} />
        </>
      ),
    },
    {
      title: 'Running',
      at: 4,
      icon: <MiniTile icon="Play" tone="#1E9E5A" loop="pulse" />,
      parts: <RunIcon s={0.62} />,
    },
    {
      title: 'Status Check',
      at: 4,
      icon: <MiniTile icon="CircleCheck" tone="#1E9E5A" loop="pop" />,
      parts: (
        <>
          <MiniTile icon="Check" tone="#1E9E5A" loop="pop" d={0} />
          <MiniTile icon="Check" tone="#1E9E5A" loop="pop" d={0.5} />
        </>
      ),
    },
  ]
  const y0 = P + TOPH + 12
  return (
    <Frame w={W} h={400}>
      {/* point 5: where it is triggered in AWS */}
      <Panel x={P} y={P} w={RW} h={TOPH} on={step >= 5} lit={lit(5)} radius={14}>
        <div style={{ ...flex(10, 'row', { justifyContent: 'center' }), height: '100%', padding: 12, boxSizing: 'border-box' }}>
          <MarkTile src={ec2Mark} size={36} />
          <span style={flex(6)}>
            <MiniTile icon="MousePointerClick" loop="press" />
            <span style={small(colors.brandDark)}>EC2 Console</span>
          </span>
          <span style={small()}>Or</span>
          <span style={flex(6)}>
            <MiniTile icon="Code" loop="pulse" />
            <span style={small(colors.brandDark)}>RunInstances API</span>
          </span>
        </div>
      </Panel>
      {rows.map((r, i) => (
        <Panel key={r.title} x={P} y={y0 + i * (RH + G)} w={RW} h={RH} lit={lit(r.at)} radius={14}>
          <div style={{ ...flex(10), height: '100%', padding: '0 11px', boxSizing: 'border-box' }}>
            {r.icon}
            <span style={{ ...heading(15), width: 124, whiteSpace: 'nowrap' }}>{r.title}</span>
            <Show on={step >= r.at} style={{ flex: 1, ...flex(8, 'row', { justifyContent: 'flex-end' }) }}>
              {r.parts}
            </Show>
          </div>
        </Panel>
      ))}
    </Frame>
  )
}

/* ------------------------------------------------------------------ T03 · where billing begins (616 x 340) */

/** a state card that keeps flipping: the state on the front, what it costs on the back */
function FlipCard({ w, h, front, back, d, lit }: { w: number; h: number; front: ReactNode; back: ReactNode; d: number; lit: boolean }) {
  const face: CSSProperties = { position: 'absolute', inset: 0, borderRadius: 14, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', display: 'grid', placeItems: 'center', padding: 10, boxSizing: 'border-box' }
  return (
    <span style={{ position: 'relative', display: 'block', width: w, height: h, perspective: 600, borderRadius: 14, boxShadow: lit ? `0 0 0 3px ${colors.accent}` : 'none' }}>
      <span className={lc('flip')} style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', ...lv(d, 6) }}>
        <span style={{ ...face, ...TILE_SKIN }}>{front}</span>
        <span style={{ ...face, ...TILE_SKIN, background: 'linear-gradient(180deg, #F2F6FF 0%, #E2EBFD 100%)', transform: 'rotateY(180deg)' }}>{back}</span>
      </span>
    </span>
  )
}

/** coins that drop into a meter, on a loop */
function CoinDrop({ d = 0 }: { d?: number }) {
  return (
    <span style={{ position: 'relative', display: 'block', width: 30, height: 44 }}>
      {[0, 1].map((i) => (
        <span key={i} className={lc('drop')} style={{ position: 'absolute', left: 4, top: 0, ...lv(d + i * 0.9, 1.8) }}>
          <K.ClayCoin w={20} />
        </span>
      ))}
    </span>
  )
}

function A_T03({ step }: { step: number }) {
  const { lit } = useLit(step, 4)
  const W = 616
  const P = 24
  const CW = 128
  const G = (W - 2 * P - 4 * CW) / 3
  const cxs = [0, 1, 2, 3].map((i) => P + i * (CW + G) + CW / 2)
  const CY = 118
  const CH = 86
  const back = (tag: string, art: ReactNode) => (
    <span style={flex(4, 'column')}>
      <span style={flex(6)}>{art}</span>
      <IconTag size={12}>{tag}</IconTag>
    </span>
  )
  const backs: ReactNode[] = [
    back('Free', <>
      <GlyphTile icon="Hourglass" size={30} tone="#F29A2E" loop="swing" />
      <GlyphTile icon="CircleSlash" size={30} tone={colors.muted} />
    </>),
    back('Billed', <span style={{ ...flex(6), height: 36, overflow: 'hidden' }}>
      <K.ClayMeter w={34} value={0.6} />
      <span style={{ transform: 'scale(0.82)', transformOrigin: 'center', display: 'grid' }}><CoinDrop /></span>
    </span>),
    back('Storage', <>
      <GlyphTile icon="Cpu" size={30} tone={colors.muted} />
      <MarkTile src={ebsVol} size={30} />
    </>),
    back('Released', <>
      <GlyphTile icon="Undo2" size={30} tone="#D9434E" loop="swing" />
      <MiniServer w={40} />
    </>),
  ]
  return (
    <Frame w={W} h={340}>
      {/* the console's Launch Instance button, clicked on a loop */}
      <div style={{ position: 'absolute', left: P, top: P, ...flex(10) }}>
        <span className={lc('press')} style={{ ...flex(8), padding: '9px 18px', borderRadius: 999, background: '#FF9900', boxShadow: '0 8px 16px -10px rgba(255,153,0,0.9)', ...heading(16, '#16191F'), ...lv(0, 2.6) }}>
          <Icon name="Rocket" size={16} />
          Launch Instance
        </span>
        <span className={lc('cursor')} style={{ marginLeft: -26, marginTop: 26, color: colors.ink, ...lv(0, 2.6, { '--ax-cx': '-30px', '--ax-cy': '-18px' }) }}>
          <Icon name="MousePointer2" size={20} />
        </span>
      </div>
      {/* point 4: no fee for provisioning */}
      <div style={{ position: 'absolute', right: P, top: P }}>
        <Show on={step >= 4}>
          <span style={{ ...flex(8), padding: '6px 12px', borderRadius: 999, background: lit(4) ? colors.brand : colors.surface2, color: lit(4) ? colors.white : '#1E9E5A', boxShadow: `inset 0 0 0 1.5px ${lit(4) ? colors.brand : '#BFE8CF'}` }}>
            <span className={lc('pop')} style={{ display: 'grid', ...lv(0, 2.4) }}>
              <Icon name="BadgeCheck" size={18} />
            </span>
            <span style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
              <Icon name="Coins" size={18} />
              <span style={{ position: 'absolute', width: 24, height: 2.5, borderRadius: 2, background: 'currentColor', transform: 'rotate(-40deg)' }} />
            </span>
            <IconTag size={13} color="currentColor">Free</IconTag>
          </span>
        </Show>
      </div>
      <Arrow x1={cxs[0]} y1={P + 46} x2={cxs[0]} y2={CY - CH / 2 - 6} tone={colors.muted} width={2} />
      {/* the four lifecycle states, each card flipping between the state and what it bills */}
      {LIFE.map((s, i) => (
        <div key={s.t} style={{ position: 'absolute', left: cxs[i] - CW / 2, top: CY - CH / 2 }}>
          <FlipCard
            w={CW}
            h={CH}
            d={i * 1.1}
            lit={(i === 1 && lit(1)) || (i === 3 && lit(2)) || (i === 2 && lit(3))}
            front={
              <span style={flex(6, 'column')}>
                <span style={{ display: 'grid', placeItems: 'center', width: 36, height: 36, borderRadius: 99, background: s.c, color: colors.white }}>
                  <Icon name={s.icon} size={18} />
                </span>
                <span style={small(colors.ink)}>{s.t}</span>
              </span>
            }
            back={backs[i]}
          />
        </div>
      ))}
      {[0, 1, 2].map((i) => (
        <Arrow key={i} x1={cxs[i] + CW / 2 + 3} y1={CY} x2={cxs[i + 1] - CW / 2 - 3} y2={CY} tone={colors.muted} width={2} />
      ))}
      {/* what each point adds under its state */}
      <C x={cxs[1]} y={258}>
        <Show on={step >= 1}>
          <span style={{ ...flex(6), padding: 10, borderRadius: 14, ...TILE_SKIN, boxShadow: litRing(lit(1), TILE_SKIN.boxShadow as string) }}>
            <K.ClayMeter w={46} value={0.55} />
            <CoinDrop d={0.4} />
          </span>
          <IconTag size={12} style={{ display: 'block', marginTop: 5 }}>Billing</IconTag>
        </Show>
      </C>
      <C x={cxs[2]} y={258}>
        <Show on={step >= 3}>
          <span style={{ ...flex(6), padding: 10, borderRadius: 14, ...TILE_SKIN, boxShadow: litRing(lit(3), TILE_SKIN.boxShadow as string) }}>
            <span style={{ position: 'relative', display: 'grid' }}>
              <GlyphTile icon="Cpu" size={38} tone={colors.muted} />
              <span style={{ position: 'absolute', right: -4, top: -4, display: 'grid', placeItems: 'center', width: 18, height: 18, borderRadius: 99, background: colors.muted, color: colors.white }}>
                <Icon name="Pause" size={11} />
              </span>
            </span>
            <span className={lc('bob')} style={{ display: 'grid', ...lv(0.6) }}>
              <MarkTile src={ebsVol} size={38} />
            </span>
            <CoinDrop d={1} />
          </span>
          <IconTag size={12} style={{ display: 'block', marginTop: 5 }}>Storage</IconTag>
        </Show>
      </C>
      <C x={cxs[3]} y={258}>
        <Show on={step >= 2}>
          <span style={{ ...flex(8), padding: 10, borderRadius: 14, ...TILE_SKIN, boxShadow: litRing(lit(2), TILE_SKIN.boxShadow as string) }}>
            <span className={lc('rise')} style={{ display: 'grid', color: colors.brand, ...lv(0, 1.8) }}>
              <Icon name="ArrowUp" size={20} />
            </span>
            <span style={flex(3, 'column')}>
              <MiniServer w={46} d={0.2} />
              <MiniServer w={46} d={0.9} />
            </span>
          </span>
          <IconTag size={12} style={{ display: 'block', marginTop: 5 }}>Pool</IconTag>
        </Show>
      </C>
    </Frame>
  )
}

/* ------------------------------------------------------------------ T04-B · burstable credits vs full CPU (1000 x 360) */

/** a path that draws once; `run` adds a dot that rides it on a loop (offset-path) */
function DrawPath({ d, on, color, width = 3.4, ms = 1400 }: { d: string; on: boolean; color: string; width?: number; ms?: number }) {
  const instant = useInstant()
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray="1"
      style={{ strokeDashoffset: on ? 0 : 1, opacity: on ? 1 : 0, transition: instant ? 'none' : `stroke-dashoffset ${ms}ms cubic-bezier(0.65,0,0.35,1), opacity 200ms` }}
    />
  )
}

const PX0 = 34
const PX1 = 420
const PY0 = 24
const PY1 = 178

function Axes() {
  return (
    <>
      <path d={`M ${PX0} ${PY0 - 6} L ${PX0} ${PY1} L ${PX1 + 6} ${PY1}`} fill="none" stroke={colors.line} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M ${PX1 + 12} ${PY1} L ${PX1 + 4} ${PY1 - 4.5} L ${PX1 + 4} ${PY1 + 4.5} Z`} fill={colors.line} />
      <path d={`M ${PX0} ${PY0 - 12} L ${PX0 - 4.5} ${PY0 - 4} L ${PX0 + 4.5} ${PY0 - 4} Z`} fill={colors.line} />
    </>
  )
}

const BURST = `M ${PX0} 150 L 80 150 C 92 150 96 66 110 66 C 124 66 126 150 140 150 L 200 150 C 212 150 216 54 232 54 C 248 54 250 150 264 150 L 330 150 C 340 150 344 84 356 84 C 368 84 370 150 382 150 L ${PX1} 150`
const FLAT = `M ${PX0} 52 L ${PX1} 52`

/** a dot riding a path for ever (CSS offset-path), hidden on held frames */
function PathRider({ d, color, t = 4, on }: { d: string; color: string; t?: number; on: boolean }) {
  const held = useHeld()
  if (held || !on) return null
  return <span aria-hidden className={lc('ride')} style={{ position: 'absolute', left: 0, top: 0, width: 12, height: 12, marginLeft: -6, marginTop: -6, borderRadius: 99, background: color, boxShadow: `0 0 0 4px ${color}33`, offsetPath: `path('${d}')`, offsetRotate: '0deg', ...lv(0, t) } as CSSProperties} />
}

function InstanceCard({ x, on, lit, name, role, roleIcon, vcpu, mem, children }: { x: number; on: boolean; lit: boolean; name: string; role: string; roleIcon: string; vcpu: string; mem: string; children: ReactNode }) {
  return (
    <Panel x={x} y={0} w={470} h={360} on={on} lit={lit} radius={18}>
      <div style={{ position: 'absolute', left: 18, top: 18, ...flex(12) }}>
        <MarkTile src={ec2Inst} size={48} />
        <span style={flex(4, 'column', { alignItems: 'flex-start' })}>
          <span style={{ ...heading(20), fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>{name}</span>
          <span style={{ ...flex(6), ...small(colors.brandDark) }}>
            <span className={lc('pulse')} style={{ display: 'grid', color: colors.brand, ...lv(0.3) }}>
              <Icon name={roleIcon} size={15} />
            </span>
            {role}
          </span>
        </span>
      </div>
      <div style={{ position: 'absolute', right: 18, top: 22, ...flex(8, 'column', { alignItems: 'flex-end' }) }}>
        <span style={{ ...flex(6), ...small(colors.ink) }}>
          <Icon name="Cpu" size={15} />
          {vcpu}
        </span>
        <span style={{ ...flex(6), ...small(colors.ink) }}>
          <Icon name="MemoryStick" size={15} />
          {mem}
        </span>
      </div>
      <div style={{ position: 'absolute', left: 18, top: 116, width: 434, height: 226 }}>{children}</div>
    </Panel>
  )
}

function A_T04B({ step }: { step: number }) {
  const { lit } = useLit(step, 2)
  return (
    <Frame w={1000} h={360} bare>
      <InstanceCard x={20} on={step >= 1} lit={lit(1)} name="t3.micro" role="Web App" roleIcon="Globe" vcpu="2 vCPU" mem="1 GB">
        <svg width={434} height={226} viewBox="0 0 434 226" style={{ position: 'absolute', inset: 0 }} aria-hidden>
          <Axes />
          <line className={lc('dash')} x1={PX0} y1={128} x2={PX1} y2={128} stroke={colors.muted} strokeWidth={1.6} strokeDasharray="6 6" style={lv(0, 2.4)} />
          <DrawPath d={BURST} on={step >= 1} color={colors.brand} />
        </svg>
        <PathRider d={BURST} color={colors.brand} on={step >= 1} t={4.6} />
        {[110, 232, 356].map((x, i) => (
          <C key={x} x={x} y={[66, 54, 84][i] - 22}>
            <Show on={step >= 1} delay={500 + i * 220}>
              <span className={lc('coin')} style={{ display: 'grid', ...lv(i * 0.5, 2.2) }}>
                <K.ClayCoin w={22} />
              </span>
            </Show>
          </C>
        ))}
        <div style={{ position: 'absolute', left: PX0 + 6, top: 192, ...flex(14) }}>
          <span style={flex(6)}>
            <GlyphTile icon="TrendingUp" size={38} loop="bob" />
            <IconTag size={13}>Burst</IconTag>
          </span>
          <span style={flex(6)}>
            <GlyphTile icon="Coins" size={38} tone="#E08A12" loop="pulse" d={0.5} />
            <IconTag size={13}>Credits</IconTag>
          </span>
        </div>
      </InstanceCard>
      <InstanceCard x={510} on={step >= 2} lit={lit(2)} name="c5.large" role="Batch Job" roleIcon="Cog" vcpu="2 vCPU" mem="4 GB">
        <svg width={434} height={226} viewBox="0 0 434 226" style={{ position: 'absolute', inset: 0 }} aria-hidden>
          <Axes />
          <rect x={PX0 + 2} y={52} width={PX1 - PX0 - 2} height={PY1 - 52} fill={colors.brand} opacity={step >= 2 ? 0.08 : 0} />
          <DrawPath d={FLAT} on={step >= 2} color={colors.brand} />
          <line className={lc('dash')} x1={PX0 + 4} y1={52} x2={PX1} y2={52} stroke="rgba(255,255,255,0.85)" strokeWidth={1.6} strokeDasharray="5 9" style={{ opacity: step >= 2 ? 1 : 0, ...lv(0, 1.4) }} />
        </svg>
        <PathRider d={FLAT} color={colors.brand} on={step >= 2} t={3} />
        <div style={{ position: 'absolute', left: PX0 + 6, top: 192, ...flex(14) }}>
          <span style={flex(6)}>
            <GlyphTile icon="Gauge" size={38} loop="swing" />
            <IconTag size={13}>Full</IconTag>
          </span>
          <span style={flex(6)}>
            <span className={lc('spin')} style={{ display: 'grid', color: colors.brand, ...lv(0, 4) }}>
              <Icon name="Cog" size={28} />
            </span>
            <IconTag size={13}>Continuous</IconTag>
          </span>
        </div>
      </InstanceCard>
    </Frame>
  )
}

/* ------------------------------------------------------------------ T05 · five families, each card with its TR line (1100 x 380) */

type Item = { title: string; text: string; icon: string }

function FamilyArt({ i }: { i: number }) {
  if (i === 0)
    return (
      <span className={lc('rock')} style={{ display: 'grid', ...lv(0, 3) }}>
        <GlyphTile icon="Scale" size={64} />
      </span>
    )
  if (i === 1) return <GlyphTile icon="Cpu" size={64} loop="pulse" d={0.2} />
  if (i === 2)
    return (
      <span style={{ position: 'relative', display: 'grid' }}>
        <GlyphTile icon="MemoryStick" size={64} loop="bob" d={0.4} />
      </span>
    )
  if (i === 3) return <GlyphTile icon="HardDrive" size={64} loop="bob" d={0.9} />
  return <GlyphTile icon="CircuitBoard" size={64} loop="glow" d={0.3} />
}

function A_T05({ step, items = [] }: { step: number; items?: Item[] }) {
  const held = useHeld()
  const W = 1100
  const H = 380
  const P = 24
  const G = 16
  const CW = (W - 2 * P - (items.length - 1) * G) / Math.max(1, items.length)
  const { lit: litN } = useLit(step, Math.max(1, items.length))
  return (
    <Frame w={W} h={H}>
      {items.map((it, i) => {
        const lit = litN(i + 1)
        const on = step >= i + 1
        return (
          <Panel key={it.title} x={P + i * (CW + G)} y={P} w={CW} h={H - 2 * P} lit={lit} radius={18} style={{ opacity: on || held ? 1 : 0.5, transition: 'opacity 360ms' }}>
            <div style={{ ...flex(14, 'column', { justifyContent: 'center' }), height: '100%', padding: 22, boxSizing: 'border-box', textAlign: 'center' }}>
              <div style={{ position: 'relative', display: 'grid', placeItems: 'center', height: 76 }}>
                {lit && <Ping size={64} />}
                <FamilyArt i={i} />
              </div>
              <span style={heading(20, colors.brandDark)}>{it.title}</span>
              <span style={{ width: 40, height: 4, borderRadius: 4, background: on || held ? colors.brand : colors.line }} />
              <span style={{ fontSize: 18, lineHeight: 1.4, color: colors.ink, minHeight: 100 }}>{it.text}</span>
            </div>
          </Panel>
        )
      })}
    </Frame>
  )
}

/* ------------------------------------------------------------------ T05-B · the TR picture: family tiles (1060 x 440) */

const T05B_COLS = [
  { head: 'Standard Or General Instances', tiles: ['T2', 'M4'], kind: 'gp' },
  { head: 'High CPU Instances', tiles: ['C5', 'C4', 'C3'], kind: 'cpu' },
  { head: 'High Memory Instances', tiles: ['X1', 'R4', 'R3'], kind: 'mem' },
  { head: 'Storage Optimized', tiles: ['I3', 'D2', 'H1'], kind: 'disk' },
  { head: 'GPU & Accelerator', tiles: ['F1', 'P2', 'G2'], kind: 'gpu' },
] as const

/** a storage-optimized family tile: a local disk whose platter spins, the family name on its hub */
function DiskTile({ name, d }: { name: string; d: number }) {
  return (
    <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 66, height: 66, borderRadius: 14, background: 'linear-gradient(160deg, #5FD6C9 0%, #12B5A8 55%, #0E9285 100%)', boxShadow: '0 10px 18px -10px rgba(14,146,133,0.9), inset 0 2px 0 rgba(255,255,255,0.45)' }}>
      <span className={lc('spin')} style={{ position: 'absolute', left: 8, top: 8, width: 50, height: 50, borderRadius: 99, background: 'conic-gradient(from 0deg, rgba(255,255,255,0.55), rgba(255,255,255,0.12) 30%, rgba(255,255,255,0.4) 55%, rgba(255,255,255,0.1) 80%, rgba(255,255,255,0.55))', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.6)', ...lv(d, 3.2) }} />
      <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 36, height: 30, borderRadius: 8, background: '#0B7D72', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.6)', ...heading(16, colors.white) }}>{name}</span>
      <span style={{ position: 'absolute', right: 6, bottom: 6, width: 6, height: 6, borderRadius: 99, background: '#B6F7D0' }} className={lc('blink')} />
    </span>
  )
}

function ChipTile({ name, tone, plate, d }: { name: string; tone: string; plate: string; d: number }) {
  const pins = [0, 1, 2, 3, 4]
  return (
    <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 74, height: 74 }}>
      {pins.map((p) => (
        <span key={`t${p}`} className={lc('blink')} style={{ position: 'absolute', left: 16 + p * 10, top: 0, width: 3, height: 8, borderRadius: 2, background: tone, ...lv(d + p * 0.3, 2.4) }} />
      ))}
      {pins.map((p) => (
        <span key={`b${p}`} style={{ position: 'absolute', left: 16 + p * 10, bottom: 0, width: 3, height: 8, borderRadius: 2, background: tone }} />
      ))}
      {pins.map((p) => (
        <span key={`l${p}`} style={{ position: 'absolute', top: 16 + p * 10, left: 0, width: 8, height: 3, borderRadius: 2, background: tone }} />
      ))}
      {pins.map((p) => (
        <span key={`r${p}`} className={lc('blink')} style={{ position: 'absolute', top: 16 + p * 10, right: 0, width: 8, height: 3, borderRadius: 2, background: tone, ...lv(d + p * 0.3 + 1, 2.4) }} />
      ))}
      <span className={lc('pulse')} style={{ display: 'grid', placeItems: 'center', width: 58, height: 58, borderRadius: 12, background: `linear-gradient(160deg, ${plate} 0%, ${tone} 100%)`, boxShadow: `inset 0 2px 0 rgba(255,255,255,0.45), 0 10px 18px -10px ${tone}`, ...lv(d, 1.8) }}>
        <span style={{ display: 'grid', placeItems: 'center', width: 38, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.22)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.55)', ...heading(16, colors.white) }}>{name}</span>
      </span>
    </span>
  )
}

function RamTile({ name, d }: { name: string; d: number }) {
  return (
    <span style={{ position: 'relative', display: 'block', width: 118, height: 56 }}>
      <span style={{ position: 'absolute', left: 0, top: 4, width: 118, height: 40, borderRadius: 6, overflow: 'hidden', background: 'linear-gradient(180deg, #4FBF73 0%, #2E9A55 100%)', boxShadow: '0 10px 16px -10px rgba(46,154,85,0.8), inset 0 2px 0 rgba(255,255,255,0.35)' }}>
        <span aria-hidden className={lc('sweep')} style={{ position: 'absolute', left: 0, top: 0, width: 34, height: 40, background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0) 100%)', ...lv(d, 2.6, { '--ax-x': '118px' }) }} />
      </span>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} style={{ position: 'absolute', left: 8 + i * 27 + (i > 1 ? 10 : 0), top: 11, width: 18, height: 22, borderRadius: 3, background: '#24324F' }} />
      ))}
      <span style={{ position: 'absolute', left: 6, top: 44, width: 106, height: 8, borderRadius: '0 0 3px 3px', background: 'repeating-linear-gradient(90deg, #F2C14E 0 5px, transparent 5px 8px)' }} />
      <span style={{ position: 'absolute', left: 59, top: 24, width: 0, height: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ padding: '1px 7px', borderRadius: 6, background: colors.white, ...heading(14, '#1E6B3A'), boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>{name}</span>
      </span>
    </span>
  )
}

function GpuTile({ name, d }: { name: string; d: number }) {
  return (
    <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 66, height: 66, borderRadius: 14, background: 'linear-gradient(160deg, #7FD0FF 0%, #2FA5EE 100%)', boxShadow: '0 10px 18px -10px rgba(47,165,238,0.9), inset 0 2px 0 rgba(255,255,255,0.5)' }}>
      <span aria-hidden className={lc('glowbox')} style={{ position: 'absolute', inset: 0, borderRadius: 14, boxShadow: '0 0 0 3px rgba(127,208,255,0.9), 0 0 16px rgba(47,165,238,0.8)', ...lv(d, 2) }} />
      <span style={{ display: 'grid', placeItems: 'center', width: 40, height: 36, borderRadius: 8, background: '#1F8BD6', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.6)', ...heading(16, colors.white) }}>{name}</span>
    </span>
  )
}

function GpTile({ name }: { name: string }) {
  const gauge = name === 'T2'
  return (
    <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 70, height: 70, borderRadius: 14, background: gauge ? 'linear-gradient(160deg, #FFC46B 0%, #F09A2A 100%)' : 'linear-gradient(160deg, #FFAE5C 0%, #F2771F 100%)', boxShadow: '0 10px 18px -10px rgba(240,120,30,0.9), inset 0 2px 0 rgba(255,255,255,0.45)' }}>
      {gauge ? (
        <>
          <span className={lc('swing')} style={{ color: colors.white, marginTop: -10, display: 'grid', ...lv(0, 2.4) }}>
            <Icon name="Gauge" size={34} />
          </span>
          <span style={{ position: 'absolute', right: 6, bottom: 4, ...heading(14, colors.white) }}>{name}</span>
        </>
      ) : (
        <span className={lc('pulse')} style={{ display: 'grid', ...heading(22, colors.white), ...lv(0.7, 1.8) }}>
          {name}
        </span>
      )}
    </span>
  )
}

function A_T05B({ step }: { step: number }) {
  const n = T05B_COLS.length
  const { lit } = useLit(step, n)
  const W = 1060
  const H = 440
  const P = 20
  const G = 16
  const CW = (W - 2 * P - (n - 1) * G) / n
  return (
    <Frame w={W} h={H}>
      {T05B_COLS.map((c, i) => (
        <Panel key={c.head} x={P + i * (CW + G)} y={P} w={CW} h={H - 2 * P} on={step >= i + 1} lit={lit(i + 1)} radius={18}>
          <div style={{ ...flex(0, 'column'), height: '100%', padding: 16, boxSizing: 'border-box' }}>
            <span style={{ ...heading(17, colors.brandDark), textAlign: 'center', minHeight: 64, display: 'grid', placeItems: 'center' }}>{c.head}</span>
            <div style={{ ...flex(c.kind === 'gp' ? 12 : 22, c.kind === 'gp' ? 'row' : 'column', { justifyContent: 'center' }), flex: 1 }}>
              {c.tiles.map((t, k) =>
                c.kind === 'gp' ? <GpTile key={t} name={t} /> : c.kind === 'cpu' ? <ChipTile key={t} name={t} tone="#1F8BD6" plate="#5FC3FF" d={k * 0.6} /> : c.kind === 'mem' ? <RamTile key={t} name={t} d={k * 0.8} /> : c.kind === 'disk' ? <DiskTile key={t} name={t} d={k * 0.7} /> : <GpuTile key={t} name={t} d={k * 0.6} />,
              )}
            </div>
          </div>
        </Panel>
      ))}
    </Frame>
  )
}

/* ------------------------------------------------------------------ T06 / T07 · one balance scale */

/**
 * The balance: a stand, a beam that tilts about its pivot and two pans hanging level from its ends. The tilt is a
 * react-spring settle to `tilt` (degrees, negative drops the LEFT / vCPU pan), plus a small continuous sway from the
 * rAF clock so the scale is never still; a held frame shows the settled tilt.
 */
const BW = 400
const BH = 228
const PIV = { x: 200, y: 54 }
const ARM = 150

function Weights({ n, icon, tone, d }: { n: number; icon: string; tone: string; d: number }) {
  return (
    <span style={flex(4)}>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className={lc('bob')} style={{ display: 'grid', ...lv(d + i * 0.4, 1.6) }}>
          <span style={{ display: 'grid', placeItems: 'center', width: 28, height: 28, borderRadius: 8, background: tone, color: colors.white, boxShadow: `inset 0 2px 0 rgba(255,255,255,0.4), 0 6px 10px -6px ${tone}` }}>
            <Icon name={icon} size={16} />
          </span>
        </span>
      ))}
    </span>
  )
}

function Balance({ tilt, from, left, right, tags }: { tilt: number; from: number; left: number; right: number; tags?: [string, string] }) {
  const held = useHeld()
  const clock = useClock(0)
  const sway = held ? 0 : Math.sin(clock * 1.6) * 1.6
  const { t } = useSpring({ from: { t: from }, to: { t: tilt }, immediate: held, delay: held ? 0 : 450, config: { mass: 2.2, tension: 120, friction: 11 } })
  const end = (side: -1 | 1) => (a: number) => {
    const r = ((a + sway) * Math.PI) / 180
    return { x: PIV.x + side * ARM * Math.cos(r), y: PIV.y + side * ARM * Math.sin(r) }
  }
  const pan = (side: -1 | 1, icon: string, n: number, tone: string) => (
    <animated.div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        transform: t.to((a) => {
          const p = end(side)(a)
          return `translate(${p.x}px, ${p.y}px)`
        }),
      }}
    >
      <svg width={120} height={78} viewBox="0 0 120 78" style={{ position: 'absolute', left: -60, top: 0, overflow: 'visible' }} aria-hidden>
        <path d="M 60 0 L 18 50 M 60 0 L 102 50" stroke="#7F95C4" strokeWidth={2.4} fill="none" strokeLinecap="round" />
        <path d="M 8 50 H 112 C 108 72 12 72 8 50 Z" fill={side < 0 ? '#BFD3FF' : '#CDEBDD'} />
        <path d="M 8 50 H 112" stroke={side < 0 ? colors.brand : '#2E9A55'} strokeWidth={3} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', left: 0, top: 35, width: 0, height: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Weights n={n} icon={icon} tone={tone} d={side < 0 ? 0 : 0.8} />
      </div>
      {tags && (
        <div style={{ position: 'absolute', left: 0, top: 84, width: 0, height: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <IconTag size={15} color={side < 0 ? colors.brandDark : '#1E6B3A'}>{side < 0 ? tags[0] : tags[1]}</IconTag>
        </div>
      )}
    </animated.div>
  )
  return (
    <div style={{ position: 'relative', width: BW, height: BH }}>
      <svg width={BW} height={BH} viewBox={`0 0 ${BW} ${BH}`} style={{ position: 'absolute', inset: 0, overflow: 'visible' }} aria-hidden>
        <defs>
          <linearGradient id="bal-post" x1="0" x2="1">
            <stop offset="0" stopColor="#3D6BF0" />
            <stop offset="1" stopColor="#1F45C8" />
          </linearGradient>
        </defs>
        <ellipse cx={PIV.x} cy={BH - 4} rx={76} ry={6} fill="rgba(31,64,140,0.16)" />
        <rect x={PIV.x - 52} y={BH - 24} width={104} height={18} rx={9} fill={colors.brandDeep} />
        <rect x={PIV.x - 9} y={PIV.y} width={18} height={BH - 24 - PIV.y} rx={9} fill="url(#bal-post)" />
        <animated.g transform={t.to((a) => `rotate(${a + sway} ${PIV.x} ${PIV.y})`)}>
          <rect x={PIV.x - ARM - 8} y={PIV.y - 7} width={2 * ARM + 16} height={14} rx={7} fill={colors.brand} />
          <rect x={PIV.x - ARM - 8} y={PIV.y - 7} width={2 * ARM + 16} height={5} rx={2.5} fill="rgba(255,255,255,0.35)" />
        </animated.g>
        <circle cx={PIV.x} cy={PIV.y} r={13} fill="#F2C14E" />
        <circle cx={PIV.x - 4} cy={PIV.y - 4} r={4} fill="rgba(255,255,255,0.7)" />
      </svg>
      {pan(-1, 'Cpu', left, colors.brand)}
      {pan(1, 'MemoryStick', right, '#2E9A55')}
    </div>
  )
}

/** the memory-per-vCPU ratio as icons: one vCPU tile beside n memory blocks */
function Ratio({ n, lit }: { n: number; lit: boolean }) {
  return (
    <Tagged tag="Ratio" size={13} gap={5}>
    <span style={{ ...flex(8), padding: 12, borderRadius: 14, ...TILE_SKIN, boxShadow: litRing(lit, TILE_SKIN.boxShadow as string) }}>
      <GlyphTile icon="Cpu" size={34} loop="pulse" />
      <span style={{ color: colors.muted, display: 'grid' }}>
        <Icon name="ArrowLeftRight" size={16} />
      </span>
      <span style={flex(3)}>
        {Array.from({ length: n }, (_, i) => (
          <span key={i} className={lc('fill')} style={{ display: 'block', width: 10, height: 30, borderRadius: 3, background: '#2E9A55', transformOrigin: 'bottom', ...lv(i * 0.25, 2.4) }} />
        ))}
      </span>
    </span>
    </Tagged>
  )
}

function A_T06({ step }: { step: number }) {
  const { lit } = useLit(step, 2)
  /* 616 x 360: the balance left, the M & T family and the ratio right, use cases and price below */
  return (
    <Frame w={616} h={360}>
      <div style={{ position: 'absolute', left: 29, top: 24, transform: 'scale(0.9)', transformOrigin: '0 0' }}>
        <Balance tilt={0} from={-7} left={2} right={2} tags={['vCPU', 'Memory']} />
      </div>
      <div style={{ position: 'absolute', left: 436, top: 16, width: 160, ...flex(10, 'column') }}>
        <span style={{ ...flex(8), padding: '8px 12px', borderRadius: 12, ...TILE_SKIN }}>
          <GlyphTile icon="Server" size={30} loop="bob" />
          <span style={heading(16, colors.brandDark)}>M & T</span>
        </span>
        <Ratio n={4} lit={false} />
        <Show on={step >= 2}>
          <Tagged tag="Price" size={13} gap={5}>
            <span style={{ ...flex(8), padding: 12, borderRadius: 14, ...TILE_SKIN, boxShadow: litRing(lit(2), TILE_SKIN.boxShadow as string) }}>
              <GlyphTile icon="Wallet" size={34} loop="bob" />
              <span style={flex(3, 'row', { alignItems: 'flex-end' })}>
                {[14, 22, 14].map((h, i) => (
                  <span key={i} className={lc('fill')} style={{ display: 'block', width: 9, height: h, borderRadius: 3, background: '#F2C14E', transformOrigin: 'bottom', ...lv(i * 0.3, 2.4) }} />
                ))}
              </span>
            </span>
          </Tagged>
        </Show>
      </div>
      {/* point 1: typical uses as icons */}
      <div style={{ position: 'absolute', left: 20, top: 262, width: 400, ...flex(22, 'row', { justifyContent: 'center', alignItems: 'flex-start' }) }}>
        {[['Globe', 'Web'], ['Database', 'Database'], ['Code', 'Dev']].map(([ic, tag], i) => (
          <Show key={ic} on={step >= 1} delay={i * 90}>
            <Tagged tag={tag} size={13} gap={5}>
              <span style={{ position: 'relative', display: 'grid' }}>
                {lit(1) && <Ping size={50} d={i * 0.3} />}
                <GlyphTile icon={ic} size={50} loop={i === 1 ? 'bob' : 'pulse'} d={i * 0.5} />
              </span>
            </Tagged>
          </Show>
        ))}
      </div>
    </Frame>
  )
}

function A_T07({ step }: { step: number }) {
  const { lit } = useLit(step, 4)
  /* 546 x 360: the balance tipped to vCPU; use cases, the ratio, the C-family chip and the lower price as icons */
  return (
    <Frame w={546} h={360}>
      <div style={{ position: 'absolute', left: 28, top: 30, transform: 'scale(0.8)', transformOrigin: '0 0' }}>
        <Balance tilt={-17} from={0} left={3} right={1} tags={['vCPU', 'Memory']} />
      </div>
      <div style={{ position: 'absolute', left: 372, top: 12, width: 154, ...flex(8, 'column') }}>
        <Show on={step >= 2}>
          <Ratio n={2} lit={lit(2)} />
        </Show>
        <Show on={step >= 3}>
          <Tagged tag="C-Family" size={13} gap={5}>
            <span style={{ display: 'grid', placeItems: 'center', padding: 6, borderRadius: 14, ...TILE_SKIN, boxShadow: litRing(lit(3), TILE_SKIN.boxShadow as string) }}>
              <ChipTile name="C" tone="#1F8BD6" plate="#5FC3FF" d={0} />
            </span>
          </Tagged>
        </Show>
        <Show on={step >= 4}>
          <Tagged tag="Price" size={13} gap={5}>
            <span style={{ ...flex(6), padding: 10, borderRadius: 14, ...TILE_SKIN, boxShadow: litRing(lit(4), TILE_SKIN.boxShadow as string) }}>
              <GlyphTile icon="Wallet" size={34} loop="bob" />
              <span className={lc('sink')} style={{ display: 'grid', color: '#1E9E5A', ...lv(0, 1.8) }}>
                <Icon name="ArrowDown" size={22} />
              </span>
            </span>
          </Tagged>
        </Show>
      </div>
      {/* point 1: batch processing, video encoding, gaming servers, scientific simulation */}
      <div style={{ position: 'absolute', left: 14, top: 262, width: 342, ...flex(12, 'row', { justifyContent: 'center', alignItems: 'flex-start' }) }}>
        {[['Layers', 'Batch'], ['Film', 'Video'], ['Gamepad2', 'Gaming'], ['FlaskConical', 'Science']].map(([ic, tag], i) => (
          <Show key={ic} on={step >= 1} delay={i * 90}>
            <Tagged tag={tag} size={13} gap={5} style={{ width: 74 }}>
              <span style={{ position: 'relative', display: 'grid' }}>
                {lit(1) && <Ping size={48} d={i * 0.3} />}
                <GlyphTile icon={ic} size={48} loop={i % 2 ? 'bob' : 'pulse'} d={i * 0.4} />
              </span>
            </Tagged>
          </Show>
        ))}
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ T09 · a CPU beside a GPU (566 x 400) */

function CpuChip({ size = 104, at }: { size?: number; at: number }) {
  return (
    <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: size, height: size }}>
      <span style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 12, width: size - 24, height: size - 24, boxSizing: 'border-box', borderRadius: 16, background: 'linear-gradient(160deg, #5B86FF 0%, #1F45C8 100%)', boxShadow: '0 12px 20px -12px rgba(31,69,200,0.9), inset 0 2px 0 rgba(255,255,255,0.4)' }}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} style={{ borderRadius: 6, background: i === at ? '#F2C14E' : 'rgba(255,255,255,0.85)', transition: 'background 160ms' }} />
        ))}
      </span>
      {[0, 1, 2, 3].map((p) => (
        <span key={p}>
          <span style={{ position: 'absolute', left: 26 + p * 16, top: 2, width: 4, height: 9, borderRadius: 2, background: '#7F95C4' }} />
          <span style={{ position: 'absolute', left: 26 + p * 16, bottom: 2, width: 4, height: 9, borderRadius: 2, background: '#7F95C4' }} />
          <span style={{ position: 'absolute', top: 26 + p * 16, left: 2, width: 9, height: 4, borderRadius: 2, background: '#7F95C4' }} />
          <span style={{ position: 'absolute', top: 26 + p * 16, right: 2, width: 9, height: 4, borderRadius: 2, background: '#7F95C4' }} />
        </span>
      ))}
    </span>
  )
}

const GC = 12
const GR = 8

/** every core lights at once in waves (parallel work), continuously */
function GpuChip({ k, t }: { k: number; t: number }) {
  return (
    <span style={{ position: 'relative', display: 'block', width: 228, height: 160, borderRadius: 18, padding: 14, boxSizing: 'border-box', background: 'linear-gradient(160deg, #2B3F7A 0%, #16244F 100%)', boxShadow: '0 16px 26px -14px rgba(22,36,79,0.9), inset 0 2px 0 rgba(255,255,255,0.18)' }}>
      <span style={{ display: 'grid', gridTemplateColumns: `repeat(${GC}, 1fr)`, gridTemplateRows: `repeat(${GR}, 1fr)`, gap: 4, width: '100%', height: '100%' }}>
        {Array.from({ length: GC * GR }, (_, i) => {
          const r = Math.floor(i / GC)
          const glow = k * (0.5 + 0.5 * Math.sin(t * 3 - r * 0.5))
          return <span key={i} style={{ borderRadius: 3, background: `rgba(110,170,255,${0.3 + 0.65 * glow})` }} />
        })}
      </span>
    </span>
  )
}

function A_T09({ step }: { step: number }) {
  const held = useHeld()
  const { lit } = useLit(step, 3)
  const clock = useClock(0.5)
  const once = useOnce(step >= 1, 900)
  const k = held ? 1 : Math.max(0.35, once)
  const cpuAt = held ? 0 : Math.floor(clock * 2.2) % 4
  const fams = ['P', 'G', 'Trn', 'Inf']
  const W = 566
  const P = 18
  return (
    <Frame w={W} h={400}>
      {/* point 1: training, inference, rendering */}
      <div style={{ position: 'absolute', left: P, top: 36, width: W - 2 * P, ...flex(26, 'row', { justifyContent: 'center', alignItems: 'flex-start' }) }}>
        {[['BrainCircuit', 'Training'], ['Sparkles', 'Inference'], ['Clapperboard', 'Rendering']].map(([ic, tag], i) => (
          <Show key={ic} on={step >= 1} delay={i * 90}>
            <Tagged tag={tag} size={13} gap={5}>
              <span style={{ position: 'relative', display: 'grid' }}>
                {lit(1) && <Ping size={42} d={i * 0.3} />}
                <GlyphTile icon={ic} size={42} loop={i === 1 ? 'glow' : 'pulse'} d={i * 0.4} />
              </span>
            </Tagged>
          </Show>
        ))}
      </div>
      {/* the CPU working through one core at a time, the GPU lighting every core in waves */}
      <C x={104} y={196}>
        <span style={flex(6, 'column')}>
          <CpuChip at={cpuAt} />
          <span style={small(colors.brandDark)}>CPU</span>
        </span>
      </C>
      <svg width={70} height={16} viewBox="0 0 70 16" aria-hidden style={{ position: 'absolute', left: 166, top: 176 }}>
        <line className={lc('dash')} x1={4} y1={8} x2={58} y2={8} stroke={colors.muted} strokeWidth={2.4} strokeDasharray="6 6" strokeLinecap="round" style={lv(0, 1.2)} />
        <path d="M 68 8 L 58 3 L 58 13 Z" fill={colors.muted} />
      </svg>
      <div style={{ position: 'absolute', left: 246, top: 112 }}>
        <GpuChip k={k} t={clock} />
      </div>
      <C x={360} y={288}>
        <span style={small(colors.brandDark)}>GPU</span>
      </C>
      {/* point 2: the P, G, Trn and Inf families as chips; point 3: priced above CPU-only */}
      <div style={{ position: 'absolute', left: P, top: 312, width: W - 2 * P, ...flex(12, 'row', { justifyContent: 'center' }) }}>
        {fams.map((f, i) => (
          <Show key={f} on={step >= 2} delay={i * 90}>
            <span style={{ display: 'grid', placeItems: 'center', borderRadius: 12, boxShadow: lit(2) ? `0 0 0 3px ${colors.accent}` : 'none' }}>
              <span className={lc('pulse')} style={{ display: 'grid', placeItems: 'center', minWidth: 44, height: 40, padding: '0 8px', borderRadius: 10, background: 'linear-gradient(160deg, #7FD0FF 0%, #2FA5EE 100%)', boxShadow: '0 8px 14px -8px rgba(47,165,238,0.9)', ...heading(16, colors.white), ...lv(i * 0.4, 2) }}>{f}</span>
            </span>
          </Show>
        ))}
        <Show on={step >= 3}>
          <span style={{ ...flex(4), padding: '4px 8px', borderRadius: 12, ...TILE_SKIN, boxShadow: litRing(lit(3), TILE_SKIN.boxShadow as string) }}>
            <GlyphTile icon="Wallet" size={34} tone="#E08A12" />
            <span className={lc('rise')} style={{ display: 'grid', color: '#D9434E', ...lv(0, 1.8) }}>
              <Icon name="ArrowUp" size={20} />
            </span>
            <IconTag size={13}>Cost</IconTag>
          </span>
        </Show>
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ exports */

type Fig = (p: Record<string, unknown>) => ReactNode
export const figures: Record<string, Fig> = {
  A_T01: A_T01 as unknown as Fig,
  A_T02: A_T02 as unknown as Fig,
  A_T02B: A_T02B as unknown as Fig,
  A_T03: A_T03 as unknown as Fig,
  A_T04B: A_T04B as unknown as Fig,
  A_T05: A_T05 as unknown as Fig,
  A_T05B: A_T05B as unknown as Fig,
  A_T06: A_T06 as unknown as Fig,
  A_T07: A_T07 as unknown as Fig,
  A_T09: A_T09 as unknown as Fig,
}

export const slides = {}

/* the loop vocabulary (transform / opacity / stroke only), held still on ?still, thumbnails and reduced motion */
export const css = `
.ax { animation-delay: var(--ax-d, 0s); }
@keyframes ax-bob { from { transform: translateY(-3px) } to { transform: translateY(3px) } }
.ax-bob { animation: ax-bob var(--ax-t, 2.2s) ease-in-out infinite alternate; }
@keyframes ax-pulse { from { transform: scale(0.94) } to { transform: scale(1.06) } }
.ax-pulse { animation: ax-pulse var(--ax-t, 1.6s) ease-in-out infinite alternate; transform-origin: center; }
@keyframes ax-ping { 0% { transform: scale(0.8); opacity: 0.75 } 100% { transform: scale(1.55); opacity: 0 } }
.ax-ping { animation: ax-ping var(--ax-t, 2.4s) ease-out infinite; opacity: 0; }
@keyframes ax-halo { 0%, 100% { opacity: 0.25; transform: scale(1) } 50% { opacity: 0.9; transform: scale(1.015) } }
.ax-halo { animation: ax-halo var(--ax-t, 2.4s) ease-in-out infinite; }
@keyframes ax-blink { 0%, 62% { opacity: 1 } 72% { opacity: 0.25 } 82%, 100% { opacity: 1 } }
.ax-blink { animation: ax-blink var(--ax-t, 1.8s) ease-in-out infinite; }
@keyframes ax-spin { to { transform: rotate(360deg) } }
.ax-spin { animation: ax-spin var(--ax-t, 5s) linear infinite; transform-origin: center; }
@keyframes ax-dash { to { stroke-dashoffset: -24 } }
.ax-dash { animation: ax-dash var(--ax-t, 1.2s) linear infinite; }
@keyframes ax-scroll { from { transform: translateX(0) } to { transform: translateX(-50%) } }
.ax-scroll { animation: ax-scroll var(--ax-t, 2.4s) linear infinite; }
@keyframes ax-fill { 0% { transform: scale(1, 0.15) } 55%, 100% { transform: scale(1, 1) } }
.ax-fill { animation: ax-fill var(--ax-t, 2.4s) cubic-bezier(0.22,1,0.36,1) infinite; }
@keyframes ax-ring { 0% { stroke-dashoffset: 1 } 70%, 100% { stroke-dashoffset: 0 } }
.ax-ring { animation: ax-ring var(--ax-t, 2.6s) cubic-bezier(0.65,0,0.35,1) infinite; }
@keyframes ax-flip { 0%, 38% { transform: rotateY(0deg) } 50%, 88% { transform: rotateY(180deg) } 100% { transform: rotateY(360deg) } }
.ax-flip { animation: ax-flip var(--ax-t, 6s) cubic-bezier(0.65,0,0.35,1) infinite; }
@keyframes ax-cursor { 0%, 8% { transform: translate(0, 0) } 38% { transform: translate(var(--ax-cx), var(--ax-cy)) } 46% { transform: translate(var(--ax-cx), var(--ax-cy)) scale(0.82) } 54%, 70% { transform: translate(var(--ax-cx), var(--ax-cy)) } 100% { transform: translate(0, 0) } }
.ax-cursor { animation: ax-cursor var(--ax-t, 2.6s) cubic-bezier(0.45,0,0.25,1) infinite; }
@keyframes ax-press { 0%, 40% { transform: scale(1) } 46% { transform: scale(0.9) } 54%, 100% { transform: scale(1) } }
.ax-press { animation: ax-press var(--ax-t, 2.6s) ease-in-out infinite; transform-origin: center; }
@keyframes ax-sched { 0%, 12% { transform: translateX(0) } 28%, 36% { transform: translateX(var(--ax-step)) } 52%, 100% { transform: translateX(calc(var(--ax-step) * 2)) } }
.ax-sched { animation: ax-sched var(--ax-t, 2.8s) cubic-bezier(0.65,0,0.35,1) infinite; transform: translateX(calc(var(--ax-step) * 2)); }
@keyframes ax-sweep { from { transform: translateX(-90px) } to { transform: translateX(var(--ax-x, 200px)) } }
.ax-sweep { animation: ax-sweep var(--ax-t, 3s) ease-in-out infinite; transform: translateX(-120px); }
@keyframes ax-swing { from { transform: rotate(-12deg) } to { transform: rotate(12deg) } }
.ax-swing { animation: ax-swing var(--ax-t, 2.4s) ease-in-out infinite alternate; transform-origin: center; }
@keyframes ax-rock { from { transform: rotate(-6deg) } to { transform: rotate(6deg) } }
.ax-rock { animation: ax-rock var(--ax-t, 3s) ease-in-out infinite alternate; transform-origin: center; }
@keyframes ax-pop { 0%, 70%, 100% { transform: scale(1) } 80% { transform: scale(1.18) } }
.ax-pop { animation: ax-pop var(--ax-t, 2.2s) ease-in-out infinite; transform-origin: center; }
@keyframes ax-glow { from { opacity: 0.55 } to { opacity: 1 } }
.ax-glow { animation: ax-glow var(--ax-t, 1.4s) ease-in-out infinite alternate; }
@keyframes ax-glowbox { 0%, 100% { opacity: 0 } 50% { opacity: 0.9 } }
.ax-glowbox { animation: ax-glowbox var(--ax-t, 2s) ease-in-out infinite; opacity: 0; }
@keyframes ax-drop { 0% { transform: translateY(-4px); opacity: 0 } 15% { opacity: 1 } 70% { transform: translateY(22px); opacity: 1 } 85%, 100% { transform: translateY(24px); opacity: 0 } }
.ax-drop { animation: ax-drop var(--ax-t, 1.8s) cubic-bezier(0.45,0,0.55,1) infinite; transform: translateY(22px); }
@keyframes ax-coin { 0%, 100% { transform: translateY(0) rotateY(0deg) } 50% { transform: translateY(-5px) rotateY(180deg) } }
.ax-coin { animation: ax-coin var(--ax-t, 2.2s) ease-in-out infinite; }
@keyframes ax-rise { 0% { transform: translateY(6px); opacity: 0 } 30%, 70% { opacity: 1 } 100% { transform: translateY(-6px); opacity: 0 } }
.ax-rise { animation: ax-rise var(--ax-t, 1.8s) ease-in-out infinite; }
@keyframes ax-sink { 0% { transform: translateY(-6px); opacity: 0 } 30%, 70% { opacity: 1 } 100% { transform: translateY(6px); opacity: 0 } }
.ax-sink { animation: ax-sink var(--ax-t, 1.8s) ease-in-out infinite; }
@keyframes ax-ride { from { offset-distance: 0% } to { offset-distance: 100% } }
.ax-ride { animation: ax-ride var(--ax-t, 4s) linear infinite; }
.cc-still .ax, .deck-thumb .ax { animation: none !important; }
.cc-still .ax-ping, .deck-thumb .ax-ping, .cc-still .ax-glowbox, .deck-thumb .ax-glowbox { opacity: 0 !important; }
.cc-still .ax-rise, .deck-thumb .ax-rise, .cc-still .ax-sink, .deck-thumb .ax-sink, .cc-still .ax-drop, .deck-thumb .ax-drop { opacity: 1 !important; transform: none !important; }
.cc-still .ax-sweep, .deck-thumb .ax-sweep { opacity: 0 !important; }
@media (prefers-reduced-motion: reduce) {
  .ax { animation: none !important; }
  .ax-ping, .ax-glowbox, .ax-sweep { opacity: 0 !important; }
  .ax-rise, .ax-sink, .ax-drop { opacity: 1 !important; transform: none !important; }
}
/* slide 12 (user, 2026-11-10): the two cards stand on their own, no background card behind them */
[data-group]:has(> .ax-bare) { background: none !important; box-shadow: none !important; border-color: transparent !important; }
`
