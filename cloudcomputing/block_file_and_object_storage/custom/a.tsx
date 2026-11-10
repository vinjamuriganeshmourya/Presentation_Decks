import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { TILE_SKIN } from '@/decks/figures/card'
import { Arrow, Label, REDUCED, STILL, useLoop } from '@/decks/figures/scene'
import { MOTION, motionHeld } from '@/motion/tokens'
import { litRing } from '@/decks/figures/net/frames'
import * as K from '@/decks/figures/d3/kit'
import { Diagram } from '@/engine/Diagram'
import { Icon } from '@/engine/icon'
import type { DiagramSpec } from '@/engine/types'
import volMark from '../images/aws-ebs-volume.svg'

/*
 * Builder A · Block, File & Object Storage, sections 1 and 2: the three figures the diagram renderer cannot draw
 * (T02 speedometers, T02-B the size-vs-IOPS sketch, T07-B the four NFS cards). Every other section 1-2 figure is
 * a `diagram` in deck.json. Each figure takes the slide's `step` (0 = nothing yet, n = whole) and holds its final
 * frame on `?still`. Loops are CSS (class `ax-loop`) or `useLoop`, stopped by `.cc-still` / `.deck-thumb` /
 * reduced motion. Styling is inline: an arbitrary Tailwind class written here would not be generated.
 */

const EASE = MOTION.ease
const held = () => STILL || REDUCED

/** shown from its step on: fade and a 6px rise, the diagram's own reveal */
function Show({ on, children, style, delay = 0 }: { on: boolean; children: ReactNode; style?: CSSProperties; delay?: number }) {
  const instant = useInstant()
  return (
    <div
      style={{
        opacity: on ? 1 : 0,
        transform: on ? 'none' : 'translateY(6px)',
        transition: instant ? 'none' : `opacity 360ms ${EASE} ${on ? delay : 0}ms, transform 360ms ${EASE} ${on ? delay : 0}ms`,
        pointerEvents: on ? undefined : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** absolute, centred on (x, y) */
const At = ({ x, y, children, z = 6, style }: { x: number; y: number; children: ReactNode; z?: number; style?: CSSProperties }) => (
  <div style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', zIndex: z, ...style }}>{children}</div>
)

/** a w x h frame centred in the stage; children are placed in figure px */
const Frame = ({ w, h, children }: { w: number; h: number; children: ReactNode }) => (
  <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
    <div style={{ position: 'relative', width: w, height: h }}>{children}</div>
  </div>
)

const flex = (gap: number, dir: 'row' | 'column' = 'row', extra: CSSProperties = {}): CSSProperties => ({ display: 'flex', flexDirection: dir, alignItems: 'center', gap, ...extra })
const heading = (size: number, color: string = colors.ink): CSSProperties => ({ fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 600, fontSize: size, lineHeight: 1.25, color })

/** the official EBS volume mark on its white tile (rule 54: r 0.27 x size, mark 76 %) */
function VolTile({ size = 64 }: { size?: number }) {
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: Math.round(size * 0.27), ...TILE_SKIN }}>
      <img src={volMark} alt="" aria-hidden draggable={false} style={{ width: Math.round(size * 0.76), display: 'block' }} />
    </span>
  )
}

/** a lucide glyph on a soft tile, as the diagram's `tile` node draws one */
function GlyphTile({ icon, size = 40, tone = colors.brand }: { icon: string; size?: number; tone?: string }) {
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: Math.round(size * 0.27), ...TILE_SKIN, color: tone, flexShrink: 0 }}>
      <Icon name={icon} size={Math.round(size * 0.5)} />
    </span>
  )
}

/* ───────────────────────── T02 · two separate speedometers ───────────────────────── */

/** a needle that rides the flow: two incommensurate sways, so it never repeats a visible beat (rule 59) */
function SwayMeter({ base, on, period, w = 96 }: { base: number; on: boolean; period: number; w?: number }) {
  const p = useLoop(period, { mode: 'sawtooth', still: 0, on, steps: 180 })
  const v = held() ? base : base + 0.05 * Math.sin(2 * Math.PI * p) + 0.02 * Math.sin(2 * Math.PI * 3 * p + 1.1)
  return <K.ClayMeter w={w} value={v} />
}

/** many small, separate requests: short arrows on staggered lanes */
function SmallArrows() {
  const still = held()
  const lanes = [-48, -24, 0, 24, 48]
  return (
    <div style={{ position: 'absolute', left: 24, top: 0, width: 300, height: 120 }}>
      {lanes.flatMap((dy, li) =>
        [0, 1, 2].map((k) => {
          const phase = (li * 0.37 + k / 3) % 1
          return (
            <span
              key={`${li}-${k}`}
              className={still ? undefined : 'ax-loop ax-req'}
              style={{
                position: 'absolute',
                left: 0,
                top: 60 + dy - 5,
                width: 30,
                height: 10,
                animationDelay: `${-phase * 2.4}s`,
                transform: still ? `translateX(${40 + phase * 200}px)` : undefined,
              }}
            >
              <svg width={30} height={10} viewBox="0 0 30 10" style={{ display: 'block', overflow: 'visible' }}>
                <line x1={1} y1={5} x2={22} y2={5} stroke={colors.brand} strokeWidth={2.4} strokeLinecap="round" />
                <path d="M 29 5 L 21 1.2 L 21 8.8 Z" fill={colors.brand} />
              </svg>
            </span>
          )
        }),
      )}
    </div>
  )
}

/** one wide, continuous transfer: a broad band with its chevrons moving, ending in one head */
function WideArrow() {
  const still = held()
  return (
    <div style={{ position: 'absolute', left: 24, top: 0, width: 300, height: 120 }}>
      <div
        className={still ? undefined : 'ax-loop ax-band'}
        style={{
          position: 'absolute',
          left: 0,
          top: 32,
          width: 262,
          height: 56,
          borderRadius: '14px 0 0 14px',
          background: `repeating-linear-gradient(90deg, ${colors.brand} 0 26px, #5B86FF 26px 40px)`,
          boxShadow: '0 12px 24px -16px rgba(29,63,214,0.7)',
        }}
      />
      <svg width={40} height={96} viewBox="0 0 40 96" style={{ position: 'absolute', left: 260, top: 12 }}>
        <path d="M 0 0 L 38 48 L 0 96 Z" fill={colors.brand} />
      </svg>
    </div>
  )
}

function MetricPanel({ x, on, title, icon, gauge, caption, children, period, base }: { x: number; on: boolean; title: string; icon: string; gauge: string; caption: string; children: ReactNode; period: number; base: number }) {
  return (
    <Show on={on} style={{ position: 'absolute', left: x, top: 8, width: 480, height: 314 }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 18, ...TILE_SKIN }} />
      <div style={{ position: 'absolute', left: 18, top: 16 }}>
        <Label strong tone="brand" icon={<Icon name={icon} size={14} />}>
          {title}
        </Label>
      </div>
      <At x={240} y={64}>
        <span style={flex(6, 'column')}>
          <SwayMeter base={base} on={on} period={period} w={84} />
          <Label strong>{gauge}</Label>
        </span>
      </At>
      <div style={{ position: 'absolute', left: 0, top: 152, width: 480, height: 120 }}>
        {children}
        <At x={412} y={60}>
          <span style={flex(6, 'column')}>
            <VolTile size={62} />
            <Label strong>Volume</Label>
          </span>
        </At>
      </div>
      <At x={178} y={290}>
        <Label strong tone="plain">
          {caption}
        </Label>
      </At>
    </Show>
  )
}

function A_T02({ step }: { step: number }) {
  return (
    <Frame w={1000} h={330}>
      <MetricPanel x={10} on={step >= 1} title="IOPS" icon="Shuffle" gauge="Requests Per Second" caption="Individual Read/Write Requests" period={4300} base={0.72}>
        <SmallArrows />
      </MetricPanel>
      <MetricPanel x={510} on={step >= 2} title="Throughput" icon="MoveRight" gauge="Megabytes Per Second" caption="Total Data Moved Per Second" period={5900} base={0.58}>
        <WideArrow />
      </MetricPanel>
    </Frame>
  )
}

/* ───────────────────────── T02-B · which metric fits, and how the two SSD families scale ───────────────────────── */

const FIT: DiagramSpec = {
  type: 'diagram',
  w: 526,
  h: 400,
  boxes: [{ id: 'chart', label: 'IOPS And Volume Size', kind: 'plain', icon: 'ChartLine', x: 6, y: 168, w: 514, h: 226 }],
  nodes: [
    { id: 't1', x: 36, y: 46, icon: 'ScrollText', shape: 'tile', size: 50, label: 'Transaction Logs', labelPos: 'right' },
    { id: 't2', x: 36, y: 124, icon: 'Clapperboard', shape: 'tile', size: 50, label: 'Video Streaming Or Backups', labelPos: 'right' },
  ],
  chips: [
    { id: 'm1', x: 466, y: 46, text: 'IOPS', icon: 'Shuffle', tone: 'brand' },
    { id: 'm2', x: 456, y: 124, text: 'Throughput', icon: 'MoveRight', tone: 'brand' },
  ],
  arrows: [
    { from: 't1', to: 'm1' },
    { from: 't2', to: 'm2' },
  ],
  packets: [
    { path: ['t1', 'm1'], dur: 2.4 },
    { path: ['t2', 'm2'], dur: 2.4 },
  ],
  steps: [
    { show: ['t1', 'm1', 't1>m1', 'packet:0'], lit: ['t1', 'm1'] },
    { show: ['t2', 'm2', 't2>m2', 'packet:1'], lit: ['t2', 'm2'] },
    { show: [], lit: [] },
    { show: [], lit: [] },
  ],
}

/** a line that draws itself from left to right when it arrives */
function DrawLine({ d, on, color, width = 4, dash }: { d: string; on: boolean; color: string; width?: number; dash?: string }) {
  const instant = useInstant()
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      pathLength={dash ? undefined : 1}
      strokeDasharray={dash ?? '1'}
      style={{ strokeDashoffset: dash ? undefined : on ? 0 : 1, opacity: on ? 1 : 0, transition: instant ? 'none' : `stroke-dashoffset 1100ms cubic-bezier(0.65,0,0.35,1), opacity 240ms` }}
    />
  )
}

const OX = 62
const OY = 362
const XE = 488
const GP = `M ${OX} 352 C 200 340, 340 316, ${XE} 300`
const IO = `M ${OX} 266 L ${XE} 266`

function A_T02B({ step }: { step: number }) {
  const s3 = step >= 3
  const s4 = step >= 4
  const lit3 = step === 3 && !held()
  const lit4 = step === 4 && !held()
  return (
    <Frame w={526} h={400}>
      <Diagram spec={FIT} step={Math.min(step, 2)} />
      <svg width={526} height={400} viewBox="0 0 526 400" style={{ position: 'absolute', inset: 0, zIndex: 5, overflow: 'visible' }} aria-hidden>
        {/* the axes */}
        <path d={`M ${OX} 236 L ${OX} ${OY} L ${XE + 10} ${OY}`} fill="none" stroke={colors.line} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M ${XE + 16} ${OY} L ${XE + 8} ${OY - 4.5} L ${XE + 8} ${OY + 4.5} Z`} fill={colors.line} />
        <path d={`M ${OX} 230 L ${OX - 4.5} 238 L ${OX + 4.5} 238 Z`} fill={colors.line} />
        {/* General Purpose SSD: a baseline that rises somewhat with size */}
        <DrawLine d={GP} on={s3} color={colors.brand} />
        {/* Provisioned IOPS: guaranteed, the same at every size */}
        <DrawLine d={IO} on={s4} color={colors.teal} />
      </svg>
      <At x={OX + 30} y={238} z={6}>
        <Label strong>IOPS</Label>
      </At>
      <At x={450} y={380} z={6}>
        <Label strong>Volume Size</Label>
      </At>
      <At x={268} y={294} z={6}>
        <Show on={s3} delay={500}>
          <Label strong tone={lit3 ? 'solid' : 'brand'} icon={<Icon name="TrendingUp" size={14} />}>
            General Purpose SSD Baseline
          </Label>
        </Show>
      </At>
      <At x={300} y={242} z={6}>
        <Show on={s4} delay={500}>
          <Label strong tone={lit4 ? 'solid' : 'brand'} icon={<Icon name="Gauge" size={14} />}>
            Guaranteed Provisioned IOPS
          </Label>
        </Show>
      </At>
    </Frame>
  )
}

/* ───────────────────────── T07-B · four NFS facts, one card each ───────────────────────── */

/**
 * The card's own picture (user, 2026-11-06, slide 18: "add relevant icons ... Session 6 layout as inspiration"):
 * one 3D clay render per card, prominent in the header as Session 6's deployment cards lead with theirs. It
 * settles in ONCE when its card arrives (a small scale-up on the deck's reveal ease), never loops, and is held
 * whole on harness URLs, thumbnails and reduced motion.
 */
function CardArt({ on, delay = 140, children }: { on: boolean; delay?: number; children: ReactNode }) {
  const still = motionHeld(useInstant())
  const t = Math.round(MOTION.reveal * 1.5)
  return (
    <span
      style={{
        display: 'grid',
        placeItems: 'center',
        width: 60,
        height: 56,
        flexShrink: 0,
        opacity: on ? 1 : 0,
        transform: on ? 'none' : 'scale(0.82) translateY(4px)',
        transition: still ? 'none' : `opacity ${t}ms ${EASE} ${on ? delay : 0}ms, transform ${t}ms ${EASE} ${on ? delay : 0}ms`,
      }}
    >
      {children}
    </span>
  )
}

function NfsCard({ x, y, on, lit, art, title, children }: { x: number; y: number; on: boolean; lit: boolean; art: ReactNode; title: string; children: ReactNode }) {
  const instant = useInstant()
  return (
    <Show on={on} style={{ position: 'absolute', left: x, top: y, width: 279, height: 188 }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 16, ...TILE_SKIN, boxShadow: litRing(lit, TILE_SKIN.boxShadow as string), transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }} />
      <div style={{ position: 'absolute', left: 12, top: 10, right: 14, ...flex(10) }}>
        <CardArt on={on}>{art}</CardArt>
        <span style={heading(17)}>{title}</span>
      </div>
      <div style={{ position: 'absolute', left: 14, right: 14, top: 76, bottom: 12 }}>{children}</div>
    </Show>
  )
}

const Request = () => (
  <span style={flex(8)}>
    <span style={{ color: colors.brand, display: 'grid', placeItems: 'center' }}>
      <Icon name="Mail" size={20} />
    </span>
    <Label strong tone="brand">
      File Handle
    </Label>
    <Label strong tone="brand">
      Offset
    </Label>
  </span>
)

function A_T07B({ step }: { step: number }) {
  const still = held()
  const lit = (i: number) => step === i && !still
  return (
    <Frame w={586} h={400}>
      <NfsCard x={6} y={6} on={step >= 1} lit={lit(1)} art={<K.Icon3D name="beyond-envelope" w={56} shadow={false} />} title="NFSv3 Stateless">
        <div style={flex(8, 'column', { alignItems: 'flex-start' })}>
          <Label strong tone="muted" icon={<Icon name="Repeat" size={14} />}>
            Each Request Carries
          </Label>
          <Request />
          <Request />
        </div>
      </NfsCard>
      <NfsCard x={301} y={6} on={step >= 2} lit={lit(2)} art={<Icon name="lib:shield-lock" size={50} />} title="NFSv4 Stateful">
        <div style={flex(8, 'column', { alignItems: 'flex-start' })}>
          <Label strong tone="brand" icon={<Icon name="Lock" size={14} />}>
            Built-In Locking
          </Label>
          <Label strong tone="brand" icon={<Icon name="Handshake" size={14} />}>
            Delegation
          </Label>
          <Label strong tone="brand" icon={<Icon name="ShieldCheck" size={14} />}>
            Improved Security Over TCP
          </Label>
        </div>
      </NfsCard>
      <NfsCard x={6} y={206} on={step >= 3} lit={lit(3)} art={<Icon name="lib:data-storage" size={56} />} title="Exports">
        <div style={flex(10, 'column', { alignItems: 'flex-start', paddingTop: 4 })}>
          <Label strong tone="brand" icon={<Icon name="FolderTree" size={14} />}>
            Shared Directories
          </Label>
          <Label strong tone="brand" icon={<Icon name="KeyRound" size={14} />}>
            Permissions
          </Label>
        </div>
      </NfsCard>
      <NfsCard x={301} y={206} on={step >= 4} lit={lit(4)} art={<Icon name="lib:files" size={56} />} title="Concurrent Writers">
        <div style={{ position: 'relative', width: 251, height: 100 }}>
          <At x={34} y={26}>
            <GlyphTile icon="PenLine" size={40} />
          </At>
          <At x={217} y={26}>
            <GlyphTile icon="PenLine" size={40} />
          </At>
          <At x={125} y={26}>
            <span style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
              <GlyphTile icon="File" size={46} tone={colors.ink} />
              <span style={{ position: 'absolute', right: -9, bottom: -7, display: 'grid', placeItems: 'center', width: 24, height: 24, borderRadius: 99, background: colors.brand, color: colors.white, boxShadow: `0 0 0 2px ${colors.white}` }}>
                <Icon name="Lock" size={13} />
              </span>
            </span>
          </At>
          <Arrow x1={59} y1={26} x2={97} y2={26} on={step >= 4} tone={colors.brand} />
          <Arrow x1={192} y1={26} x2={153} y2={26} on={step >= 4} tone={colors.muted} dashed />
          <At x={125} y={80}>
            <Label strong tone="brand" icon={<Icon name="Lock" size={14} />}>
              Explicit Locking
            </Label>
          </At>
        </div>
      </NfsCard>
    </Frame>
  )
}

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  A_T02: A_T02 as unknown as (p: Record<string, unknown>) => ReactNode,
  A_T02B: A_T02B as unknown as (p: Record<string, unknown>) => ReactNode,
  A_T07B: A_T07B as unknown as (p: Record<string, unknown>) => ReactNode,
}

export const slides = {}

export const css = `
@keyframes ax-req { 0% { transform: translateX(0); opacity: 0 } 12% { opacity: 1 } 84% { opacity: 1 } 100% { transform: translateX(262px); opacity: 0 } }
.ax-req { animation: ax-req 2.4s linear infinite; }
@keyframes ax-band { from { background-position: 0 0 } to { background-position: 40px 0 } }
.ax-band { animation: ax-band 0.9s linear infinite; }
@keyframes ax-lock { 0%, 100% { transform: scale(1) } 50% { transform: scale(1.12) } }
.ax-lock { animation: ax-lock 2.2s ease-in-out infinite; }
.cc-still .ax-loop, .deck-thumb .ax-loop { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .ax-loop { animation: none !important; } }
`
