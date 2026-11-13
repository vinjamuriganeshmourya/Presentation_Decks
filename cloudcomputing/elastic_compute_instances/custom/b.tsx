import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { animated, useSpring } from '@react-spring/web'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { TILE_SKIN } from '@/decks/figures/card'
import { Arrow, Label, STILL, Traveller } from '@/decks/figures/scene'
import { MOTION, motionHeld } from '@/motion/tokens'
import { NoMark } from '@/decks/figures/net/frames'
import { Icon } from '@/engine/icon'
import { IconTag, Tagged } from './r4'
import ec2Mark from '../images/aws-ec2-instance.svg'
import ebsMark from '../images/aws-ebs-volume.svg'
import optimizerMark from '../images/aws-compute-optimizer.svg'
import cloudwatchMark from '../images/aws-cloudwatch.svg'

/*
 * BUILDER B · Elastic Compute Instances, section 3 (Sizing & Selection): T11 four axes, T12 vCPU and memory bars,
 * T13 network and EBS lanes, T14 the right-sizing gauge, T15 two GPU cards and the model bar, T16-B the worked case.
 * Built on Session 7's builder B parts (Show, card, Tile, Flow), so the two decks read alike.
 * Every figure takes the slide's `step` (0 = nothing yet, n = whole) and holds its final frame on `?still`.
 * The part a press brings in is ringed in brand blue for that press only (never on `?still`).
 * Official marks (rule 54) sit in the white tile (radius 0.27 x size, mark 76 %). Labels are DOM text, Title Case,
 * TR words only. Motion: one-shot reveals on the shared MOTION tokens; the T14 needle is a react-spring that
 * overshoots and settles (physical motion, content rule 59); flow dots ride the T13 lanes.
 */

const EASE = MOTION.ease
const MONO = "'Fira Code', ui-monospace, monospace"
const HEAD = "'DM Sans', system-ui, sans-serif"
const GOOD = colors.success
const BAD = colors.danger

/* ------------------------------------------------------------------ shared parts */

function useHeld() {
  return motionHeld(useInstant())
}

/** a flow dot riding a lane while its step is shown; held still on `?still`, thumbnails and reduced motion */
function Flow({ on, path, k, dur = MOTION.flow.dur, tone = colors.brand }: { on: boolean; path: [number, number][]; k: string; dur?: number; tone?: string }) {
  const held = useHeld()
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 9, pointerEvents: 'none' }}>
      <Traveller path={path} run={on && !held} k={k} tone={tone} size={MOTION.flow.dot} dur={dur} />
    </div>
  )
}

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

const At = ({ x, y, children, z = 6, style }: { x: number; y: number; children: ReactNode; z?: number; style?: CSSProperties }) => (
  <div style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', zIndex: z, ...style }}>{children}</div>
)

const Box = ({ x, y, w, h, children, z = 4, style }: { x: number; y: number; w?: number; h?: number; children?: ReactNode; z?: number; style?: CSSProperties }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, zIndex: z, ...style }}>{children}</div>
)

const Frame = ({ w, h, children }: { w: number; h: number; children: ReactNode }) => (
  <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
    <div style={{ position: 'relative', width: w, height: h }}>{children}</div>
  </div>
)

const flex = (gap: number, dir: 'row' | 'column' = 'row', extra: CSSProperties = {}): CSSProperties => ({ display: 'flex', flexDirection: dir, alignItems: 'center', gap, ...extra })
const heading = (size: number, color: string = colors.ink): CSSProperties => ({ fontFamily: HEAD, fontWeight: 600, fontSize: size, lineHeight: 1.25, color })

/** a white card in the deck's tile skin; `lit` rings it in brand blue */
const card = (lit = false, r = 16): CSSProperties => ({
  borderRadius: r,
  ...TILE_SKIN,
  ...(lit ? { boxShadow: `inset 0 0 0 2.5px ${colors.brand}, 0 12px 24px -16px rgba(31,64,140,0.4)` } : {}),
  transition: `box-shadow 360ms ${EASE}`,
})

/** an official mark in its white tile (rule 54) */
function Tile({ src, size }: { src: string; size: number }) {
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: Math.round(size * 0.27), flexShrink: 0, ...TILE_SKIN }}>
      <img src={src} alt="" aria-hidden draggable={false} style={{ display: 'block', width: Math.round(size * 0.76), height: 'auto', userSelect: 'none' }} />
    </span>
  )
}

/** a lucide icon on the deck's soft tile */
function IconTile({ name, size = 40, tone = colors.brand, bg = colors.surface2 }: { name: string; size?: number; tone?: string; bg?: string }) {
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: Math.round(size * 0.27), background: bg, color: tone, flexShrink: 0 }}>
      <Icon name={name} size={Math.round(size * 0.5)} />
    </span>
  )
}

const Mono = ({ children, size = 16, color = colors.ink, style }: { children: ReactNode; size?: number; color?: string; style?: CSSProperties }) => (
  <span style={{ fontFamily: MONO, fontSize: size, color, whiteSpace: 'nowrap', fontVariantLigatures: 'none', ...style }}>{children}</span>
)

/** a part is lit for the press that brings it in, never on `?still` */
const litAt = (step: number, k: number) => !STILL && step === k

/** a green tick disc (the fitting choice) */
function YesMark({ size = 26, on = true }: { size?: number; on?: boolean }) {
  const held = useHeld()
  return (
    <span aria-hidden style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 999, background: GOOD, color: colors.white, boxShadow: `0 0 0 3px ${colors.white}, 0 8px 16px -8px rgba(16,32,58,0.5)`, opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: held ? 'none' : `all 360ms ${EASE}`, flexShrink: 0 }}>
      <Icon name="Check" size={Math.round(size * 0.62)} style={{ strokeWidth: 3 }} />
    </span>
  )
}

/** a bar that grows from its foot to `h` once it is shown */
function Grow({ on, h, w, full, color, delay = 0, children }: { on: boolean; h: number; w: number; full: number; color: string; delay?: number; children?: ReactNode }) {
  const held = useHeld()
  return (
    <div style={{ position: 'relative', width: w, height: full, display: 'flex', alignItems: 'flex-end' }}>
      <div
        style={{
          width: w,
          height: on ? h : 0,
          borderRadius: '10px 10px 4px 4px',
          background: `linear-gradient(180deg, ${color} 0%, ${color}CC 100%)`,
          boxShadow: `inset 0 2px 0 rgba(255,255,255,0.45), 0 10px 18px -12px ${color}`,
          transition: held ? 'none' : `height 620ms ${EASE} ${on ? delay : 0}ms`,
        }}
      />
      {children}
    </div>
  )
}

/* ───────────────────────── round 2 (user, 2026-11-10): loops, icons over text, equal padding ─────────────────────────
 * Standing correction 13 / cloud course R10: every visual carries a quiet continuous loop (CSS keyframes `bx*`, held
 * still on `?still`, in thumbnails and under reduced motion), icons replace chips and explanatory labels, every inner
 * card sits P px from its parent on all four sides, arrows are straight and land.
 */

const P = 20

/** a CSS loop for an element, or nothing when motion is held */
const loop = (held: boolean, name: string, dur: number, delay = 0, timing = 'ease-in-out') => (held ? undefined : `${name} ${dur}s ${timing} ${delay}s infinite`)

/** a short plain label: icon + 1-3 words, no pill */
function Tag({ icon, children, color = colors.ink, size = 15, iconColor = colors.brand }: { icon?: string; children?: ReactNode; color?: string; size?: number; iconColor?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: HEAD, fontWeight: 600, fontSize: size, color, whiteSpace: 'nowrap', lineHeight: 1.2 }}>
      {icon && <Icon name={icon} size={size + 2} style={{ color: iconColor }} />}
      {children}
    </span>
  )
}

/** dots riding a straight line, one after another, forever (none left on a held frame) */
function Ride({ x1, y1, x2, y2, n = 3, dur = MOTION.flow.dur, color = colors.brand, size = 10, on = true, delay = 0 }: { x1: number; y1: number; x2: number; y2: number; n?: number; dur?: number; color?: string; size?: number; on?: boolean; delay?: number }) {
  const held = useHeld()
  if (held || !on) return null
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className="bx bx-dot"
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
              zIndex: 9,
              pointerEvents: 'none',
              '--dx': `${x2 - x1}px`,
              '--dy': `${y2 - y1}px`,
              animation: `bxRide ${dur}s linear ${delay + (i * dur) / n}s infinite`,
            } as CSSProperties
          }
        />
      ))}
    </>
  )
}

/** a dot riding an svg path forever (offset-path), in the path's own coordinates */
function PathDot({ d, dur = 3.2, color = colors.brand, size = 10, delay = 0 }: { d: string; dur?: number; color?: string; size?: number; delay?: number }) {
  const held = useHeld()
  if (held) return null
  return (
    <span
      aria-hidden
      className="bx bx-dot"
      style={{ position: 'absolute', left: 0, top: 0, width: size, height: size, borderRadius: 999, background: color, boxShadow: `0 0 0 3px ${colors.white}`, offsetPath: `path('${d}')`, offsetRotate: '0deg', animation: `bxPath ${dur}s linear ${delay}s infinite`, zIndex: 9 } as CSSProperties}
    />
  )
}

/** an icon tile that keeps a quiet loop */
function LoopTile({ name, size = 44, kind = 'bxFloat', dur = 2.6, delay = 0, tone = colors.brand, bg = colors.surface2 }: { name: string; size?: number; kind?: string; dur?: number; delay?: number; tone?: string; bg?: string }) {
  const held = useHeld()
  return (
    <span className="bx" style={{ display: 'inline-grid', animation: loop(held, kind, dur, delay) }}>
      <IconTile name={name} size={size} tone={tone} bg={bg} />
    </span>
  )
}

/** a soft ring that keeps pulsing out from a part */
function Pulse({ r = 12, color = colors.brand, delay = 0, dur = 2.2 }: { r?: number; color?: string; delay?: number; dur?: number }) {
  const held = useHeld()
  if (held) return null
  return <span aria-hidden className="bx" style={{ position: 'absolute', inset: 0, borderRadius: r, animation: `bxRing ${dur}s ease-out ${delay}s infinite`, color, pointerEvents: 'none' }} />
}

/* ───────────────────────── T11 · four sizing axes around one instance (slide 24, a lead layout now) ───────────────────────── */

type Axis = { title: string; text: string; icon: string }

/** round 4 (A1): a one-word tag under each axis picture, TR words */
const AXIS_TAGS = ['Threads', 'RAM', 'Gbps', 'IOPS']

/** a small picture of each axis: threads on a core, RAM cells, packets on a link, disk operations */
function AxisMini({ i }: { i: number }) {
  const held = useHeld()
  const box: CSSProperties = { position: 'relative', width: 92, height: 44, flexShrink: 0 }
  if (i === 0)
    return (
      <div style={box}>
        {/* one physical core running two threads */}
        <div style={{ position: 'absolute', left: 22, top: 0, width: 48, height: 44, borderRadius: 10, background: colors.surface2, boxShadow: `inset 0 0 0 2px ${colors.brand}`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, padding: '0 0 8px', boxSizing: 'border-box' }}>
          {[0, 1].map((k) => (
            <span key={k} className="bx" style={{ width: 9, height: 26, borderRadius: 4, background: colors.brand, transformOrigin: '50% 100%', animation: loop(held, 'bxBar', 1.4, k * 0.7) }} />
          ))}
        </div>
      </div>
    )
  if (i === 1)
    return (
      <div style={{ ...box, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, alignContent: 'center' }}>
        {Array.from({ length: 8 }, (_, k) => (
          <span key={k} className="bx" style={{ height: 16, borderRadius: 4, background: colors.teal, animation: loop(held, 'bxBlink', 2.4, (k % 4) * 0.3 + Math.floor(k / 4) * 0.15) }} />
        ))}
      </div>
    )
  if (i === 2)
    return (
      <div style={box}>
        <span style={{ position: 'absolute', left: 4, right: 4, top: 21, height: 3, borderRadius: 2, background: colors.line }} />
        <Ride x1={8} y1={22.5} x2={84} y2={22.5} n={3} dur={1.8} size={9} />
      </div>
    )
  return (
    <div style={{ ...box, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 5 }}>
      {[0, 1, 2, 3, 4].map((k) => (
        <span key={k} className="bx" style={{ width: 10, height: 34, borderRadius: 3, background: k % 2 ? colors.teal : colors.brand, transformOrigin: '50% 100%', animation: loop(held, 'bxBar', 1.2, k * 0.18) }} />
      ))}
    </div>
  )
}

function B_T11({ step, items = [] }: { step: number; items?: Axis[] }) {
  const held = useHeld()
  const W = 1060 - 2 * P
  const H = 360 - 2 * P
  const CW = 404
  const CH = 150
  const pos: [number, number][] = [
    [0, 0],
    [W - CW, 0],
    [0, H - CH],
    [W - CW, H - CH],
  ]
  const cx = W / 2
  const cy = H / 2
  const IB = 124
  /* each card's inner corner joins the instance with a straight line; the dots ride card → instance */
  const ends = pos.map(([x, y], i) => {
    const px = i % 2 === 0 ? x + CW : x
    const py = i < 2 ? y + CH : y
    const dx = px - cx
    const dy = py - cy
    const k = (IB / 2 + 6) / Math.max(Math.abs(dx), Math.abs(dy))
    return { px, py, ex: cx + dx * k, ey: cy + dy * k }
  })
  return (
    <Frame w={W} h={H}>
      <svg aria-hidden width={W} height={H} style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
        {ends.map((e, i) => (
          <line key={i} x1={e.px} y1={e.py} x2={e.ex} y2={e.ey} stroke={colors.line} strokeWidth={2.5} strokeLinecap="round" style={{ opacity: step >= i + 1 ? 1 : 0, transition: held ? 'none' : `opacity 360ms ${EASE}` }} />
        ))}
      </svg>
      {ends.map((e, i) => (
        <Ride key={i} x1={e.px} y1={e.py} x2={e.ex} y2={e.ey} n={2} dur={2.2} on={step >= i + 1} color={i % 2 ? colors.teal : colors.brand} delay={i * 0.3} />
      ))}
      {/* the instance at the centre */}
      <At x={cx} y={cy} z={8}>
        <div style={{ ...card(false, 24), ...flex(8, 'column'), width: IB, height: IB, justifyContent: 'center', position: 'relative' }}>
          <Pulse r={24} dur={2.6} />
          <span className="bx" style={{ display: 'inline-grid', animation: loop(held, 'bxFloat', 3) }}>
            <Tile src={ec2Mark} size={64} />
          </span>
          <span style={heading(16)}>Instance</span>
        </div>
      </At>
      {items.slice(0, 4).map((a, i) => (
        <Show key={a.title} on={step >= i + 1} dx={i % 2 ? 18 : -18} dy={i < 2 ? -12 : 12} style={{ position: 'absolute', left: pos[i][0], top: pos[i][1], width: CW, height: CH, zIndex: 6 }}>
          <div style={{ ...card(litAt(step, i + 1), 18), position: 'absolute', inset: 0, padding: P, boxSizing: 'border-box', ...flex(10, 'column', { alignItems: 'stretch', justifyContent: 'center' }) }}>
            <span style={flex(12)}>
              <LoopTile name={a.icon} size={40} kind="bxPulse" dur={2.4} delay={i * 0.35} />
              <span style={{ ...heading(19), flex: 1 }}>{a.title}</span>
              <Tagged tag={AXIS_TAGS[i]} gap={3} size={13}>
                <AxisMini i={i} />
              </Tagged>
            </span>
            <span style={{ fontSize: 16, lineHeight: 1.35, color: colors.ink }}>{a.text}</span>
          </div>
        </Show>
      ))}
    </Frame>
  )
}

/* ───────────────────────── T12 · vCPU and memory, two sizes side by side; T-family credits ───────────────────────── */

const SIZES = [
  { name: 'm6i.xlarge', vcpu: 4, mem: 16, memText: '16 GiB' },
  { name: 'c5.large', vcpu: 2, mem: 4, memText: '4 GB' },
] as const

/** a bar that grows to `h`, then keeps a light sheen travelling up it */
function SheenBar({ on, h, w, full, color, icon, delay = 0, sheenDelay = 0 }: { on: boolean; h: number; w: number; full: number; color: string; icon: string; delay?: number; sheenDelay?: number }) {
  const held = useHeld()
  return (
    <div style={{ position: 'relative', width: w, height: full, display: 'flex', alignItems: 'flex-end' }}>
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          width: w,
          height: on ? h : 0,
          borderRadius: '10px 10px 4px 4px',
          background: `linear-gradient(180deg, ${color} 0%, ${color}CC 100%)`,
          boxShadow: `inset 0 2px 0 rgba(255,255,255,0.45), 0 10px 18px -12px ${color}`,
          transition: held ? 'none' : `height 620ms ${EASE} ${on ? delay : 0}ms`,
          display: 'flex',
          justifyContent: 'center',
          paddingTop: 6,
          boxSizing: 'border-box',
          color: colors.white,
        }}
      >
        {h >= 26 && <Icon name={icon} size={16} />}
        {!held && <span aria-hidden className="bx" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '100%', background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.38) 50%, rgba(255,255,255,0) 100%)', animation: `bxSheen 2.8s ease-in-out ${sheenDelay}s infinite` }} />}
      </div>
    </div>
  )
}

/** a CPU line under and over its baseline: credits earned below are spent above; a dot keeps riding it */
function CreditLine({ on }: { on: boolean }) {
  const held = useHeld()
  const W = 300
  const H = 74
  const base = 46
  const d = `M 0 ${base + 12} C 34 ${base + 16}, 60 ${base + 8}, 92 ${base + 10} S 132 ${base + 14}, 156 ${base + 6} C 176 ${base - 30}, 210 ${base - 34}, 230 ${base - 6} S 270 ${base + 12}, ${W} ${base + 10}`
  return (
    <div style={{ position: 'relative', width: W, height: H, flexShrink: 0 }}>
      <svg aria-hidden width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <line x1={0} y1={base} x2={W} y2={base} stroke={colors.muted} strokeWidth={1.5} strokeDasharray="6 6" />
        <path d={d} fill="none" stroke={colors.brand} strokeWidth={3} strokeLinecap="round" pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: on ? 0 : 1, transition: held ? 'none' : `stroke-dashoffset 1100ms ${EASE} 200ms` }} />
      </svg>
      {on && <PathDot d={d} dur={3.4} color={colors.accent} />}
      <div style={{ position: 'absolute', left: 192, top: -8, display: 'flex', alignItems: 'center', gap: 4 }}>
        <span className="bx" style={{ display: 'inline-grid', color: colors.accent, animation: loop(held, 'bxFloat', 1.8) }}>
          <Icon name="ArrowUp" size={18} />
        </span>
        <IconTag size={13}>Burst</IconTag>
      </div>
      <IconTag size={13} style={{ position: 'absolute', left: 0, top: base - 19, color: colors.muted }}>Baseline</IconTag>
    </div>
  )
}

function B_T12({ step }: { step: number }) {
  const held = useHeld()
  const W = 586 - 2 * P
  const H = 380 - 2 * P
  const BAR = 112
  const FLOOR = 158
  const VC = colors.brand
  const MC = colors.teal
  const CHART_H = 214
  return (
    <Frame w={W} h={H}>
      {/* the bar chart */}
      <Box x={0} y={0} w={W} h={CHART_H}>
        <div style={{ ...card(), position: 'absolute', inset: 0 }} />
        <Box x={P} y={FLOOR} w={W - 2 * P} h={2} z={5} style={{ background: colors.line, borderRadius: 2 }} />
        {SIZES.map((s, g) => {
          const gx = g === 0 ? 92 : 322
          const lit = litAt(step, 3) && g === 0
          return (
            <div key={s.name}>
              {lit && <Box x={gx - 20} y={P - 4} w={172} h={CHART_H - 2 * P + 8} z={4} style={{ borderRadius: 16, boxShadow: `inset 0 0 0 2.5px ${colors.brand}`, background: `${colors.surface2}80` }} />}
              {[
                { on: step >= 1, h: (s.vcpu / 4) * BAR, c: VC, v: `${s.vcpu} vCPU`, x: gx, icon: 'Cpu' },
                { on: step >= 2, h: (s.mem / 16) * BAR, c: MC, v: s.memText, x: gx + 76, icon: 'MemoryStick' },
              ].map((b, i) => (
                <div key={i}>
                  <Box x={b.x} y={FLOOR - BAR} w={56} h={BAR} z={6}>
                    <SheenBar on={b.on} h={b.h} w={56} full={BAR} color={b.c} icon={b.icon} delay={g * 160} sheenDelay={g * 0.6 + i * 0.3} />
                  </Box>
                  <Box x={b.x - 22} y={FLOOR - b.h - 28} w={100} z={7} style={{ display: 'flex', justifyContent: 'center' }}>
                    <Show on={b.on} delay={g * 160 + 420}>
                      <span style={{ ...heading(14), whiteSpace: 'nowrap' }}>{b.v}</span>
                    </Show>
                  </Box>
                </div>
              ))}
              <Box x={gx - 10} y={FLOOR + 12} w={152} z={7} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                <span className="bx" style={{ display: 'inline-grid', animation: loop(held, 'bxFloat', 3, g * 0.5) }}>
                  <Tile src={ec2Mark} size={26} />
                </span>
                <Mono size={16} color={colors.brandDark}>
                  {s.name}
                </Mono>
              </Box>
            </div>
          )
        })}
      </Box>

      {/* T-family: credits earned below the baseline, spent above it */}
      <Show on={step >= 4} style={{ position: 'absolute', left: 0, top: CHART_H + P, width: W, height: H - CHART_H - P }}>
        <div style={{ ...card(litAt(step, 4)), position: 'absolute', inset: 0, padding: `0 ${P}px`, boxSizing: 'border-box', ...flex(16, 'row', { justifyContent: 'space-between' }) }}>
          <span style={flex(8, 'column', { alignItems: 'flex-start' })}>
            <Tag icon="TrendingUp">T-Family</Tag>
            <span style={flex(6)}>
              <span className="bx" style={{ display: 'inline-grid', color: colors.accent, animation: loop(held, 'bxBob', 1.6) }}>
                <Icon name="Coins" size={22} />
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: colors.muted }}>CPU Credits</span>
            </span>
          </span>
          <CreditLine on={step >= 4} />
        </div>
      </Show>
    </Frame>
  )
}

/* ───────────────────────── T13 · network and EBS, two separate lanes ───────────────────────── */

/** the network line holding its baseline, then bursting higher for a short period; a dot keeps riding it */
function BurstSpark({ on, lit }: { on: boolean; lit: boolean }) {
  const held = useHeld()
  const W = 220
  const base = 44
  const d = `M 0 ${base} L 66 ${base} C 82 ${base}, 84 ${base - 30}, 100 ${base - 30} L 122 ${base - 30} C 138 ${base - 30}, 140 ${base}, 156 ${base} L ${W} ${base}`
  return (
    <div style={{ position: 'relative', width: W, height: 60, borderRadius: 12, boxShadow: lit ? `inset 0 0 0 2.5px ${colors.brand}` : undefined, transition: `box-shadow 360ms ${EASE}` }}>
      <svg aria-hidden width={W} height={60} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <line x1={0} y1={base} x2={W} y2={base} stroke={colors.muted} strokeWidth={1.5} strokeDasharray="6 6" />
        <path d={d} fill="none" stroke={colors.accent} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: on ? 0 : 1, transition: held ? 'none' : `stroke-dashoffset 900ms ${EASE} 160ms` }} />
      </svg>
      {on && <PathDot d={d} dur={2.8} color={colors.accent} size={9} />}
      <div style={{ position: 'absolute', left: 101, top: -6, display: 'flex', alignItems: 'center', gap: 4 }}>
        <span className="bx" style={{ display: 'inline-grid', color: colors.accent, animation: loop(held, 'bxPulse', 1.4) }}>
          <Icon name="Zap" size={18} />
        </span>
        <IconTag size={13}>Burst</IconTag>
      </div>
    </div>
  )
}

function B_T13({ step }: { step: number }) {
  const held = useHeld()
  const W = 606 - 2 * P
  const H = 380 - 2 * P
  const IW = 140
  const L1 = 82
  const L2 = 262
  const X0 = IW + 14
  const X1 = W - 104
  const RX = X1 + 52
  return (
    <Frame w={W} h={H}>
      {/* the instance, tall enough to feed both lanes */}
      <Box x={0} y={0} w={IW} h={H} z={6}>
        <div style={{ ...card(false, 20), position: 'absolute', inset: 0, ...flex(12, 'column', { justifyContent: 'center' }) }}>
          <span className="bx" style={{ display: 'inline-grid', animation: loop(held, 'bxFloat', 3) }}>
            <Tile src={ec2Mark} size={62} />
          </span>
          <span style={heading(17)}>Instance</span>
          <span style={flex(10, 'row', { alignItems: 'flex-start' })}>
            <Tagged tag="vCPU" size={13}>
              <LoopTile name="Cpu" size={34} kind="bxPulse" dur={2.2} />
            </Tagged>
            <Tagged tag="Memory" size={13}>
              <LoopTile name="MemoryStick" size={34} kind="bxPulse" dur={2.2} delay={1.1} tone={colors.teal} />
            </Tagged>
          </span>
        </div>
      </Box>

      {/* lane 1: network bandwidth to the internet, both ways */}
      <Arrow x1={X0} y1={L1} x2={X1} y2={L1} on={step >= 1} both width={3} />
      <Ride x1={X0 + 14} y1={L1} x2={X1 - 14} y2={L1} n={3} dur={2.4} on={step >= 1} />
      <Box x={X0} y={L1 - 40} w={X1 - X0} z={7} style={{ display: 'flex', justifyContent: 'center' }}>
        <Show on={step >= 1}>
          <span style={{ borderRadius: 10, padding: '2px 8px', boxShadow: litAt(step, 1) ? `inset 0 0 0 2px ${colors.brand}` : undefined }}>
            <Tag icon="Network">Gbps</Tag>
          </span>
        </Show>
      </Box>
      {/* the burst: a short rise above the baseline */}
      <Show on={step >= 2} style={{ position: 'absolute', left: X0 + (X1 - X0 - 220) / 2, top: L1 + 30, width: 220, height: 60, zIndex: 7 }}>
        <BurstSpark on={step >= 2} lit={litAt(step, 2)} />
      </Show>
      <At x={RX} y={L1} z={8}>
        <div style={{ ...flex(6, 'column') }}>
          <LoopTile name="Globe" size={56} kind="bxFloat" dur={3.2} />
          <span style={heading(15)}>Internet</span>
        </div>
      </At>

      {/* lane 2: EBS throughput to the volume */}
      <Arrow x1={X0} y1={L2} x2={X1} y2={L2} on={step >= 3} both width={3} />
      <Ride x1={X0 + 14} y1={L2} x2={X1 - 14} y2={L2} n={3} dur={2.4} on={step >= 3} color={colors.teal} />
      <Box x={X0} y={L2 - 40} w={X1 - X0} z={7} style={{ display: 'flex', justifyContent: 'center' }}>
        <Show on={step >= 3}>
          <span style={{ borderRadius: 10, padding: '2px 8px', boxShadow: litAt(step, 3) ? `inset 0 0 0 2px ${colors.brand}` : undefined }}>
            <Tag icon="HardDrive" iconColor={colors.teal}>
              MB/s
            </Tag>
          </span>
        </Show>
      </Box>
      <At x={RX} y={L2 - 8} z={8}>
        <div style={{ ...flex(6, 'column'), whiteSpace: 'nowrap' }}>
          <span className="bx" style={{ display: 'inline-grid', animation: loop(held, 'bxFloat', 3.2, 0.8) }}>
            <Tile src={ebsMark} size={56} />
          </span>
          <span style={heading(15)}>EBS Volume</span>
        </div>
      </At>
      {/* IOPS: the operations a volume sustains each second */}
      <At x={RX} y={L2 + 60} z={8}>
        <Show on={step >= 4}>
          <span style={{ ...flex(8), borderRadius: 10, padding: '2px 8px', boxShadow: litAt(step, 4) ? `inset 0 0 0 2px ${colors.brand}` : undefined }}>
            <Tag icon="Gauge">IOPS</Tag>
            <span style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 18 }}>
              {[0, 1, 2].map((k) => (
                <span key={k} className="bx" style={{ width: 5, height: 18, borderRadius: 2, background: colors.brand, transformOrigin: '50% 100%', animation: loop(held, 'bxBar', 0.9, k * 0.2) }} />
              ))}
            </span>
          </span>
        </Show>
      </At>
    </Frame>
  )
}

/* ───────────────────────── T14 · the right-sizing gauge ───────────────────────── */

const arcPath = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  /* angles in degrees, 0 = straight up, negative = left */
  const p = (a: number) => [cx + r * Math.sin((a * Math.PI) / 180), cy - r * Math.cos((a * Math.PI) / 180)]
  const [x0, y0] = p(a0)
  const [x1, y1] = p(a1)
  return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`
}

function Needle({ angle, cx, cy, len }: { angle: number; cx: number; cy: number; len: number }) {
  const held = useHeld()
  const [sp, api] = useSpring(() => ({ a: held ? angle : -84, config: { tension: 120, friction: 9 } }))
  useEffect(() => {
    if (held) api.set({ a: angle })
    else api.start({ a: angle })
  }, [angle, held, api])
  return (
    <animated.div
      aria-hidden
      style={{ position: 'absolute', left: cx - 5, top: cy - len, width: 10, height: len, transformOrigin: '50% 100%', transform: sp.a.to((a) => `rotate(${a}deg)`), zIndex: 8 }}
    >
      {/* a live reading: the needle keeps trembling a few degrees around its value */}
      <div className="bx" style={{ width: 10, height: len, transformOrigin: '50% 100%', animation: loop(held, 'bxTremble', 1.6) }}>
        <div style={{ width: 10, height: len, borderRadius: '6px 6px 3px 3px', background: `linear-gradient(180deg, ${colors.brandDeep} 0%, ${colors.brandDark} 100%)`, clipPath: 'polygon(50% 0, 100% 100%, 0 100%)' }} />
      </div>
    </animated.div>
  )
}

function B_T14({ step }: { step: number }) {
  const held = useHeld()
  const W = 606 - 2 * P
  const H = 380 - 2 * P
  const cx = W / 2
  const cy = 156
  const R = 106
  /* the needle tells the story of each press: it settles in Right-Sized, swings over, swings under, settles back */
  const angle = step >= 4 ? 0 : step === 3 ? -60 : step === 2 ? 60 : 0
  const zones = [
    { a0: -90, a1: -32, c: BAD },
    { a0: -30, a1: 30, c: GOOD },
    { a0: 32, a1: 90, c: colors.accent },
  ]
  const CT = 196
  const CHt = H - CT
  const CW1 = 274
  return (
    <Frame w={W} h={H}>
      <svg aria-hidden width={W} height={CT} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <path d={arcPath(cx, cy, R, -90, 90)} fill="none" stroke={colors.surface2} strokeWidth={32} strokeLinecap="round" />
        {zones.map((z, i) => (
          <path key={i} d={arcPath(cx, cy, R, z.a0, z.a1)} fill="none" stroke={z.c} strokeWidth={20} strokeLinecap="round" opacity={0.85} />
        ))}
        <circle cx={cx} cy={cy} r={13} fill={colors.brandDeep} />
        <circle cx={cx} cy={cy} r={5} fill={colors.white} />
      </svg>
      <Needle angle={step >= 1 ? angle : -84} cx={cx} cy={cy} len={R - 24} />
      <At x={cx} y={18}>
        <Tag icon="CircleCheck" iconColor={GOOD} color={GOOD}>
          Right-Sized
        </Tag>
      </At>
      <At x={74} y={cy - 6}>
        <span style={flex(6, 'column')}>
          <span style={{ borderRadius: 8, padding: '1px 6px', boxShadow: litAt(step, 3) ? `inset 0 0 0 2px ${colors.brand}` : undefined }}>
            <Tag size={14}>Under-Provisioned</Tag>
          </span>
          <Show on={step >= 3}>
            <span className="bx" style={{ display: 'inline-grid', color: BAD, animation: loop(held, 'bxBlink', 1.6) }}>
              <Icon name="TriangleAlert" size={22} />
            </span>
          </Show>
        </span>
      </At>
      <At x={W - 74} y={cy - 6}>
        <span style={flex(6, 'column')}>
          <span style={{ borderRadius: 8, padding: '1px 6px', boxShadow: litAt(step, 2) ? `inset 0 0 0 2px ${colors.brand}` : undefined }}>
            <Tag size={14}>Over-Provisioned</Tag>
          </span>
          <Show on={step >= 2}>
            <span className="bx" style={{ display: 'inline-grid', color: colors.accent, animation: loop(held, 'bxBob', 1.8) }}>
              <Icon name="Wallet" size={22} />
            </span>
          </Show>
        </span>
      </At>

      {/* Compute Optimizer reading CloudWatch metrics: two marks, a straight arrow with riding dots, the recommendation bulb */}
      <Show on={step >= 1} style={{ position: 'absolute', left: 0, top: CT, width: CW1, height: CHt }}>
        <div style={{ ...card(litAt(step, 1)), position: 'absolute', inset: 0, padding: P, boxSizing: 'border-box', ...flex(10, 'column', { justifyContent: 'center' }) }}>
          <span style={flex(0, 'row', { alignItems: 'flex-start' })}>
            <span style={flex(4, 'column', { width: 76 })}>
              <span className="bx" style={{ display: 'inline-grid', animation: loop(held, 'bxFloat', 3) }}>
                <Tile src={cloudwatchMark} size={44} />
              </span>
              <span style={{ ...heading(13), whiteSpace: 'nowrap' }}>CloudWatch</span>
            </span>
            <span style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
              <svg aria-hidden width={44} height={44} style={{ position: 'absolute', inset: 0 }}>
                <line x1={2} y1={22} x2={34} y2={22} stroke={colors.brand} strokeWidth={2.5} strokeLinecap="round" />
                <path d="M 42 22 L 33 17 L 33 27 Z" fill={colors.brand} />
              </svg>
              <Ride x1={4} y1={22} x2={32} y2={22} n={2} dur={1.6} size={7} on={step >= 1} />
            </span>
            <span style={flex(4, 'column', { width: 116 })}>
              <span className="bx" style={{ display: 'inline-grid', animation: loop(held, 'bxFloat', 3, 1.2) }}>
                <Tile src={optimizerMark} size={44} />
              </span>
              <span style={{ ...heading(13), whiteSpace: 'nowrap' }}>Compute Optimizer</span>
            </span>
          </span>
          <Show on={step >= 1} delay={700}>
            <span style={flex(6)}>
              <span className="bx" style={{ display: 'inline-grid', color: colors.accent, animation: loop(held, 'bxPulse', 1.8) }}>
                <Icon name="Lightbulb" size={26} />
              </span>
              <IconTag size={13}>Recommendation</IconTag>
            </span>
          </Show>
        </div>
      </Show>

      {/* resize: stop, change the instance type, restart */}
      <Show on={step >= 4} style={{ position: 'absolute', left: CW1 + P, top: CT, width: W - CW1 - P, height: CHt }}>
        <div style={{ ...card(litAt(step, 4)), position: 'absolute', inset: 0, ...flex(10, 'row', { justifyContent: 'center', padding: P, boxSizing: 'border-box' }) }}>
          {[
            ['Square', 'Stop'],
            ['Replace', 'Instance Type'],
            ['Play', 'Restart'],
          ].map(([ic, t], i) => (
            <span key={ic} style={flex(8)}>
              {i > 0 && <Icon name="ArrowRight" size={16} style={{ color: colors.brand }} />}
              <span style={{ position: 'relative', display: 'inline-grid', borderRadius: 11 }}>
                <IconTile name={ic} size={40} />
                <Pulse r={11} delay={i * 0.8} dur={2.4} />
                {t && <span style={{ position: 'absolute', left: '50%', top: 46, transform: 'translateX(-50%)', fontSize: 13, fontWeight: 600, color: colors.ink, whiteSpace: 'nowrap' }}>{t}</span>}
              </span>
            </span>
          ))}
        </div>
      </Show>
    </Frame>
  )
}

/* ───────────────────────── T15 · two GPU cards and the model bar ───────────────────────── */

const GPUS = [
  { name: 'g5.xlarge', gpu: 'NVIDIA A10G', vram: 24 },
  { name: 'g4dn.xlarge', gpu: 'NVIDIA T4', vram: 16 },
] as const

function B_T15({ step }: { step: number }) {
  const held = useHeld()
  const W = 606 - 2 * P
  const H = 380 - 2 * P
  const CW = (W - P) / 2
  const FOOT = H - P
  const PX = 8.4 /* px per GB of VRAM: 24 GB = 202 px */
  const MODEL = 168 /* the model's height: between the two wells, no number on it */
  return (
    <Frame w={W} h={H}>
      {GPUS.map((g, i) => {
        const x = i === 0 ? 0 : CW + P
        const well = g.vram * PX
        const fits = MODEL <= well
        const shown = i === 0 ? step >= 1 : step >= 2
        const lit = litAt(step, i + 3) || litAt(step, i + 1)
        return (
          <div key={g.name}>
            <div style={{ ...card(lit, 18), position: 'absolute', left: x, top: 0, width: CW, height: H }} />
            <Box x={x + P} y={P} w={CW - 2 * P} z={6}>
              <span style={flex(10)}>
                <LoopTile name="CircuitBoard" size={40} kind="bxPulse" dur={2.4} delay={i * 0.6} />
                <span style={flex(2, 'column', { alignItems: 'flex-start', flex: 1 })}>
                  <Mono size={16} color={colors.brandDark}>
                    {g.name}
                  </Mono>
                  <span style={{ fontSize: 13, fontWeight: 600, color: colors.muted }}>{`One ${g.gpu} GPU`}</span>
                </span>
                <Tagged tag="Speed" gap={1} size={12}>
                  <span className="bx" style={{ display: 'inline-grid', color: colors.accent, animation: loop(held, 'bxBlink', 1.2, i * 0.4) }}>
                    <Icon name="Zap" size={18} />
                  </span>
                </Tagged>
              </span>
            </Box>
            {/* the VRAM well, its height set by its capacity */}
            <Box x={x + P + 4} y={FOOT - well} w={110} h={well} z={5} style={{ borderRadius: 12, background: colors.surface2, boxShadow: `inset 0 0 0 2px ${colors.brand}` }} />
            <Box x={x + P + 124} y={FOOT - well - 2} z={6}>
              <Tag icon="MemoryStick" size={14} color={colors.brandDark}>{`${g.vram} GB VRAM`}</Tag>
            </Box>
            {/* the model, loaded into the well; it keeps settling in a fitting well, and its spill keeps flashing where it does not fit */}
            <Box x={x + P + 13} y={FOOT - MODEL - 8} w={92} h={MODEL} z={7}>
              <div style={{ opacity: shown ? 1 : 0, transform: shown ? 'none' : 'translateY(-60px)', transition: held ? 'none' : `opacity 360ms ${EASE}, transform 620ms cubic-bezier(0.34,1.4,0.64,1)` }}>
                <div className="bx" style={{ animation: fits ? loop(held, 'bxSettle', 2.6) : undefined }}>
                  <div
                    style={{
                      position: 'relative',
                      width: 92,
                      height: MODEL,
                      borderRadius: 10,
                      overflow: 'hidden',
                      background: fits ? `linear-gradient(180deg, ${colors.brand} 0%, ${colors.brandDark} 100%)` : `linear-gradient(180deg, ${BAD} 0%, #C93636 100%)`,
                      boxShadow: '0 12px 22px -14px rgba(16,32,58,0.6), inset 0 2px 0 rgba(255,255,255,0.35)',
                      ...flex(4, 'column', { justifyContent: 'center' }),
                      color: colors.white,
                    }}
                  >
                    <Icon name="BrainCircuit" size={26} />
                    <span style={{ fontFamily: HEAD, fontWeight: 600, fontSize: 15 }}>Model</span>
                    {!fits && <span aria-hidden className="bx" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: MODEL - well + 8, background: 'rgba(255,255,255,0.28)', animation: loop(held, 'bxBlink', 1.2) }} />}
                  </div>
                </div>
              </div>
            </Box>
            {fits ? (
              <At x={x + CW - P - 14} y={FOOT - 40} z={8}>
                <span style={flex(4, 'column')}>
                  <span style={{ position: 'relative', display: 'inline-grid', borderRadius: 999 }}>
                    <YesMark on={shown} />
                    {shown && <Pulse r={999} color={GOOD} dur={2} />}
                  </span>
                  <Show on={shown} delay={400} dy={0}>
                    <IconTag size={13} color={GOOD}>Fits</IconTag>
                  </Show>
                </span>
              </At>
            ) : (
              <>
                <At x={x + P + 59} y={FOOT - well - 8} z={9}>
                  <Show on={shown} delay={500} dy={0}>
                    <div style={{ width: 118, height: 3, borderRadius: 2, background: BAD }} />
                  </Show>
                </At>
                <At x={x + CW - P - 50} y={FOOT - 64} z={8}>
                  <span style={flex(6, 'column')}>
                    <span className="bx" style={{ display: 'inline-grid', animation: shown ? loop(held, 'bxPulse', 1.2) : undefined }}>
                      <NoMark size={26} on={shown} />
                    </span>
                    <Show on={shown} delay={500}>
                      <span style={{ ...heading(13, BAD), whiteSpace: 'nowrap' }}>Out-Of-Memory</span>
                    </Show>
                  </span>
                </At>
              </>
            )}
          </div>
        )
      })}
    </Frame>
  )
}

/* ───────────────────────── T16-B · the worked case, two cards ───────────────────────── */

function Choice({ name, spec, ok, on, delay = 0, note }: { name: string; spec: string; ok: boolean; on: boolean; delay?: number; note?: ReactNode }) {
  const held = useHeld()
  return (
    <Show on={on} delay={delay}>
      <div style={{ ...flex(12), height: 62, padding: '0 16px', borderRadius: 14, background: colors.white, boxShadow: `inset 0 0 0 ${ok ? 2 : 1.5}px ${ok ? GOOD : colors.line}`, opacity: ok ? 1 : 0.92 }}>
        <span className="bx" style={{ display: 'inline-grid', animation: loop(held, 'bxFloat', 3, ok ? 0 : 1) }}>
          <Tile src={ec2Mark} size={38} />
        </span>
        <span style={flex(2, 'column', { alignItems: 'flex-start', flex: 1 })}>
          <Mono size={17} color={colors.brandDark}>
            {name}
          </Mono>
          <span style={{ fontSize: 14, fontWeight: 600, color: colors.muted }}>{spec}</span>
        </span>
        {note}
        <span style={{ position: 'relative', display: 'inline-grid', borderRadius: 999 }}>
          {ok ? <YesMark size={28} on={on} /> : <NoMark size={28} on={on} />}
          {on && <Pulse r={999} color={ok ? GOOD : BAD} dur={ok ? 2.2 : 1.4} />}
        </span>
      </div>
    </Show>
  )
}

function Needs({ items }: { items: { icon: string; t: string }[] }) {
  return (
    <span style={{ ...flex(18), flexWrap: 'wrap' }}>
      {items.map((n) => (
        <Tag key={n.t} icon={n.icon} size={15}>
          {n.t}
        </Tag>
      ))}
    </span>
  )
}

/** the down arrow from the need to the choice, bobbing */
function Down() {
  const held = useHeld()
  return (
    <div style={{ ...flex(0), justifyContent: 'center', height: 24 }}>
      <span className="bx" style={{ display: 'inline-grid', color: colors.brand, animation: loop(held, 'bxBob', 1.6) }}>
        <Icon name="ArrowDown" size={22} />
      </span>
    </div>
  )
}

function B_T16B({ step }: { step: number }) {
  /* round 4: slide 31's table removed, this visual now sits under the lead in 1060 x 360 */
  const W = 1060 - 2 * P
  const H = 360 - 2 * P
  const CW = (W - P) / 2
  const col = (lit: boolean): CSSProperties => ({ ...card(lit, 20), position: 'absolute', inset: 0, padding: P, boxSizing: 'border-box', ...flex(10, 'column', { alignItems: 'stretch', justifyContent: 'center' }) })
  return (
    <Frame w={W} h={H}>
      {/* the web application: bound by vCPU and memory */}
      <Show on={step >= 1} style={{ position: 'absolute', left: 0, top: 0, width: CW, height: H }}>
        <div style={col(litAt(step, 1))}>
          <span style={flex(12)}>
            <LoopTile name="Globe" size={46} kind="bxFloat" dur={3} />
            <span style={heading(21)}>Web Application</span>
          </span>
          <Needs
            items={[
              { icon: 'Cpu', t: '4 vCPU' },
              { icon: 'MemoryStick', t: '16 GiB RAM' },
              { icon: 'Network', t: 'Moderate Network' },
            ]}
          />
          <Down />
          <Choice name="m6i.xlarge" spec="4 vCPU · 16 GiB" ok on={step >= 1} delay={300} />
          <span style={{ ...flex(18), flexWrap: 'wrap' }}>
            <Tag icon="CircleCheck" iconColor={GOOD} size={14}>
              Matches vCPU And Memory
            </Tag>
            <Tag icon="Wallet" iconColor={GOOD} size={14}>
              Avoids Idle Capacity Cost
            </Tag>
          </span>
        </div>
      </Show>

      {/* the inference job: bound by VRAM */}
      <Show on={step >= 2} style={{ position: 'absolute', left: CW + P, top: 0, width: CW, height: H }}>
        <div style={col(litAt(step, 2))}>
          <span style={flex(12)}>
            <LoopTile name="BrainCircuit" size={46} kind="bxPulse" dur={2.4} />
            <span style={heading(21)}>Model Inference</span>
            <Tag icon="Box" size={15} color={colors.brandDark}>
              18 GB Model
            </Tag>
          </span>
          <Needs items={[{ icon: 'CircuitBoard', t: 'GPU With 18 GB+ VRAM' }]} />
          <Down />
          <Choice name="g4dn.xlarge" spec="16 GB VRAM" ok={false} on={step >= 2} delay={300} note={<span style={{ ...heading(14, BAD) }}>Insufficient</span>} />
          <Choice name="g5.xlarge" spec="24 GB VRAM · NVIDIA A10G" ok on={step >= 2} delay={620} />
        </div>
      </Show>
    </Frame>
  )
}

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  B_T11: B_T11 as unknown as (p: Record<string, unknown>) => ReactNode,
  B_T12: B_T12 as (p: Record<string, unknown>) => ReactNode,
  B_T13: B_T13 as (p: Record<string, unknown>) => ReactNode,
  B_T14: B_T14 as (p: Record<string, unknown>) => ReactNode,
  B_T15: B_T15 as (p: Record<string, unknown>) => ReactNode,
  B_T16B: B_T16B as (p: Record<string, unknown>) => ReactNode,
}
export const slides = {}

/* the loops; every one is held still on harness URLs, in picker thumbnails and under reduced motion */
export const css = `
@keyframes bxFloat { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-5px) } }
@keyframes bxBob { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(4px) } }
@keyframes bxPulse { 0%, 100% { transform: scale(1) } 50% { transform: scale(1.07) } }
@keyframes bxBlink { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }
@keyframes bxBar { 0%, 100% { transform: scaleY(1) } 50% { transform: scaleY(0.45) } }
@keyframes bxSheen { 0% { transform: translateY(100%) } 100% { transform: translateY(-100%) } }
@keyframes bxTremble { 0%, 100% { transform: rotate(-3deg) } 50% { transform: rotate(3deg) } }
@keyframes bxSettle { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
@keyframes bxRing { 0% { box-shadow: 0 0 0 0 currentColor; opacity: 0.5 } 100% { box-shadow: 0 0 0 12px currentColor; opacity: 0 } }
@keyframes bxRide { 0% { transform: translate(0, 0); opacity: 0 } 12% { opacity: 1 } 88% { opacity: 1 } 100% { transform: translate(var(--dx), var(--dy)); opacity: 0 } }
@keyframes bxPath { 0% { offset-distance: 0%; opacity: 0 } 10% { opacity: 1 } 90% { opacity: 1 } 100% { offset-distance: 100%; opacity: 0 } }
.bx-dot { opacity: 0 }
.cc-still .bx, .deck-thumb .bx { animation: none !important }
@media (prefers-reduced-motion: reduce) { .bx { animation: none !important } }
`
