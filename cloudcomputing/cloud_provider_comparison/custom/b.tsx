import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { TILE_SKIN } from '@/decks/figures/card'
import { MOTION, motionHeld } from '@/motion/tokens'
import { litRing } from '@/decks/figures/net/frames'
import { Icon } from '@/engine/icon'
import awsMark from '../images/aws.png'
import azureMark from '../images/azure.svg'
import gcMark from '../images/google-cloud.svg'
import awsEc2 from '../images/aws-ec2.svg'
import awsS3 from '../images/aws-s3.svg'
import awsRds from '../images/aws-rds.svg'
import awsVpc from '../images/aws-vpc.svg'
import azVm from '../images/azure-virtual-machine.svg'
import azSt from '../images/azure-storage-accounts.svg'
import azSql from '../images/azure-sql-database.svg'
import azVnet from '../images/azure-virtual-networks.svg'
import gcCe from '../images/gcp-compute-engine.svg'
import gcSt from '../images/gcp-cloud-storage.svg'
import gcSql from '../images/gcp-cloud-sql.svg'
import gcVpc from '../images/gcp-vpc-network.svg'

/*
 * BUILDER B · Cloud Provider Comparison (Session 11): slides 13 (A_T06), 14 (A_T07), 19 (A_T10B), 22 (B_T13).
 *
 * Built to Sessions 9 and 10's final review state (generate-slides standing corrections 13-16, cloud course R10-R13):
 * icon-first visuals, one single-word Title Case tag under an icon that is not self-evident, product names only where
 * the TR names them, official marks on white tiles that never move, equal padding, straight arrows computed from the
 * boxes' constants, a quiet loop on every visual after its build, an orange highlight that walks first → last → first
 * and is never parked. Every coordinate is a constant so nothing can overlap.
 *
 * Step contract: step 0 = nothing pressed; on a points slide, part i shows from press i and is lit (orange ring) while
 * it is the current press. Held frames (`?still`, thumbnails, reduced motion): everything shown, nothing lit or moving.
 */

type Fig = (p: Record<string, unknown>) => ReactNode

const EASE = MOTION.ease
const FONT = "'DM Sans', system-ui, sans-serif"
const useHeld = () => motionHeld(useInstant())

const lc = (kind: string) => `bx bx-${kind}`
const lv = (d = 0, t?: number): CSSProperties => ({ ['--bx-d' as string]: `${-d}s`, ...(t ? { ['--bx-t' as string]: `${t}s` } : {}) }) as CSSProperties

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

/**
 * The walking highlight after the build: starts on the part the last press lit (no jump back), then walks
 * first → last → first forever, `ms` per part. -1 while building or on held frames.
 */
function useWalk(n: number, done: boolean, ms = 1400): number {
  const held = useHeld()
  const [i, setI] = useState(n - 1)
  useEffect(() => {
    setI(n - 1)
    if (!done || held || n < 1) return
    const id = window.setInterval(() => setI((v) => (v + 1) % n), ms)
    return () => window.clearInterval(id)
  }, [n, done, held, ms])
  return done && !held ? i : -1
}

/** build state for a figure of `n` parts */
function useParts(step: number, n: number) {
  const held = useHeld()
  const s = held ? n : step
  return {
    held,
    shown: (i: number) => held || s >= i,
    /* the press's own ring; once the build is done the walking highlight takes over (never two at once) */
    lit: (i: number) => !held && s === i && s < n,
    done: !held && s >= n,
  }
}

function Show({ on, children, style, delay = 0, rise = 6 }: { on: boolean; children: ReactNode; style?: CSSProperties; delay?: number; rise?: number }) {
  const instant = useInstant()
  return (
    <div
      style={{
        opacity: on ? 1 : 0,
        transform: on ? 'none' : `translateY(${rise}px)`,
        transition: instant ? 'none' : `opacity 520ms ${EASE} ${on ? delay : 0}ms, transform 520ms ${EASE} ${on ? delay : 0}ms`,
        pointerEvents: on ? undefined : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** the figure's own w x h box, centred in the stage */
const Frame = ({ w, h, children }: { w: number; h: number; children: ReactNode }) => (
  <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
    <div style={{ position: 'relative', width: w, height: h }}>{children}</div>
  </div>
)

const tagStyle = (size = 13, color: string = colors.brandDeep): CSSProperties => ({ fontFamily: FONT, fontWeight: 600, fontSize: size, lineHeight: 1.15, color, whiteSpace: 'nowrap', textAlign: 'center' })

/** an official mark on its white tile (rule 54); the mark never moves */
function MarkTile({ src, size = 44, k = 0.66 }: { src: string; size?: number; k?: number }) {
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: Math.round(size * 0.26), ...TILE_SKIN, flexShrink: 0 }}>
      <img src={src} alt="" aria-hidden draggable={false} style={{ width: Math.round(size * k), height: 'auto', display: 'block' }} />
    </span>
  )
}

/** a lucide glyph on a soft tile; `loop` moves the glyph only */
function GlyphTile({ icon, size = 40, tone = colors.brand, loop = 'float', d = 0, t, fill }: { icon: string; size?: number; tone?: string; loop?: string; d?: number; t?: number; fill?: boolean }) {
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: Math.round(size * 0.27), ...TILE_SKIN, ...(fill ? { background: `linear-gradient(180deg, ${colors.brand} 0%, ${colors.brandDark} 100%)`, boxShadow: `0 10px 20px -12px ${colors.brandDark}` } : {}), color: fill ? colors.white : tone, flexShrink: 0 }}>
      <span className={loop ? lc(loop) : undefined} style={{ display: 'grid', placeItems: 'center', ...lv(d, t) }}>
        <Icon name={icon} size={Math.round(size * 0.5)} />
      </span>
    </span>
  )
}

/** a white panel at (x, y) that rings orange while lit */
function Panel({ x, y, w, h, lit = false, on = true, radius = 16, children, delay = 0, tint }: { x: number; y: number; w: number; h: number; lit?: boolean; on?: boolean; radius?: number; children?: ReactNode; delay?: number; tint?: string }) {
  const instant = useInstant()
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: radius, ...TILE_SKIN, ...(tint ? { background: tint } : {}), boxShadow: litRing(lit, TILE_SKIN.boxShadow as string), transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }} />
      <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
    </Show>
  )
}

/** a zero-size anchor at (x, y) centring its child */
const At = ({ x, y, children, z = 4 }: { x: number; y: number; children: ReactNode; z?: number }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: 0, height: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: z }}>{children}</div>
)

/** an icon with its one-word tag under it, centred on (x, y) of the icon */
function Tagged({ x, y, gap = 6, tag, tagSize = 13, children, tagColor }: { x: number; y: number; gap?: number; tag: string; tagSize?: number; children: ReactNode; tagColor?: string }) {
  return (
    <At x={x} y={y}>
      <div style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
        {children}
        <span style={{ position: 'absolute', top: '100%', marginTop: gap, ...tagStyle(tagSize, tagColor) }}>{tag}</span>
      </div>
    </At>
  )
}

/**
 * A straight arrow from (x1, y1) to (x2, y2): the shaft stops at the head's base, the filled head's tip lands
 * exactly on (x2, y2). It draws itself along its length when it appears.
 */
function Arrow({ x1, y1, x2, y2, on = true, color = colors.brand, width = 2.5, head = 11, delay = 0 }: { x1: number; y1: number; x2: number; y2: number; on?: boolean; color?: string; width?: number; head?: number; delay?: number }) {
  const instant = useInstant()
  const len = Math.hypot(x2 - x1, y2 - y1)
  const ux = (x2 - x1) / len
  const uy = (y2 - y1) / len
  const bx = x2 - ux * head
  const by = y2 - uy * head
  const hw = head * 0.55
  const shaft = len - head
  const tr = instant ? 'none' : `stroke-dashoffset 860ms ${EASE} ${on ? delay : 0}ms`
  return (
    <svg aria-hidden style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', zIndex: 2 }} width={1} height={1}>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={shaft} strokeDashoffset={on ? 0 : shaft} style={{ transition: tr }} />
      <polygon
        points={`${x2},${y2} ${bx - uy * hw},${by + ux * hw} ${bx + uy * hw},${by - ux * hw}`}
        fill={color}
        style={{ opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 240ms ${EASE} ${on ? delay + 620 : 0}ms` }}
      />
    </svg>
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

/** a flow dot riding a polyline on the wall clock: `ride` of each `period` moving, eased in and out; gone on held frames */
function Dot({ points, t, period, phase = 0, ride = 0.8, tone = colors.brand, size = 11 }: { points: [number, number][]; t: number; period: number; phase?: number; ride?: number; tone?: string; size?: number }) {
  const held = useHeld()
  if (held) return null
  const u = ((((t - phase) % period) + period) % period) / period
  if (u > ride) return null
  const k = u / ride
  const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
  const [x, y] = along(points, e)
  const op = k < 0.12 ? k / 0.12 : k > 0.88 ? (1 - k) / 0.12 : 1
  return <span aria-hidden style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: 99, background: tone, opacity: op, boxShadow: `0 0 0 4px ${tone}2e, 0 4px 10px -4px ${tone}`, zIndex: 3 }} />
}

/* ═════════════════════════════════════════ A_T06 · slide 13 · four-row service map (646 x 360) */

const T06_ROWS = [
  { icon: 'Cpu', tag: 'Compute', cells: [[awsEc2, 'EC2'], [azVm, 'Virtual Machines'], [gcCe, 'Compute Engine']] },
  { icon: 'Archive', tag: 'Storage', cells: [[awsS3, 'S3'], [azSt, 'Blob Storage'], [gcSt, 'Cloud Storage']] },
  { icon: 'Database', tag: 'Database', cells: [[awsRds, 'RDS'], [azSql, 'Azure SQL'], [gcSql, 'Cloud SQL']] },
  { icon: 'Network', tag: 'Networking', cells: [[awsVpc, 'VPC'], [azVnet, 'VNet'], [gcVpc, 'VPC Network']] },
] as const

function A_T06({ step = 0 }: { step?: number }) {
  const W = 606
  const H = 334
  const P = useParts(step, 4)
  const walk = useWalk(4, P.done)
  const t = useClock()
  const LABEL_W = 100 // the row-label column
  const COL0 = LABEL_W + 8
  const COL_W = (W - COL0) / 3
  const cx = (c: number) => COL0 + COL_W * c + COL_W / 2
  const HEAD_H = 46
  const ROW_H = 64
  const GAP = 8
  const ry = (r: number) => HEAD_H + 8 + r * (ROW_H + GAP)
  const heads = [awsMark, azureMark, gcMark]
  return (
    <Frame w={W} h={H}>
      {/* provider marks head the three columns */}
      {heads.map((src, c) => (
        <At key={c} x={cx(c)} y={HEAD_H / 2}>
          <MarkTile src={src} size={40} k={c === 0 ? 0.7 : 0.62} />
        </At>
      ))}
      {T06_ROWS.map((row, r) => {
        const y = ry(r)
        const lit = P.lit(r + 1) || walk === r
        const iconY = 23 // panel-relative: a 32 px tile at 7..39, its name at 43..57, 7 px under it
        return (
          <Panel key={r} x={0} y={y} w={W} h={ROW_H} on={P.shown(r + 1)} lit={lit} radius={14}>
            {/* row label: the category icon and its tag, centred in the label column */}
            <div style={{ position: 'absolute', left: 0, top: 0, width: LABEL_W, height: ROW_H, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <GlyphTile icon={row.icon} size={30} fill d={r * 0.6} />
              <span style={tagStyle(12.5)}>{row.tag}</span>
            </div>
            <div style={{ position: 'absolute', left: LABEL_W, top: 10, bottom: 10, width: 1.5, background: colors.line }} />
            {/* the "same capability" line through the three service tiles, behind them */}
            <div style={{ position: 'absolute', left: cx(0), top: iconY - 1, width: cx(2) - cx(0), height: 2, borderRadius: 2, background: `${colors.brand}33` }} />
            <Dot points={[[cx(0), iconY], [cx(2), iconY]]} t={t} period={3.2} phase={r * 0.8} ride={0.85} size={9} tone={lit ? colors.accent : colors.brand} />
            {row.cells.map(([src, name], c) => (
              <At key={c} x={cx(c)} y={iconY}>
                <div style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
                  <MarkTile src={src} size={32} k={0.7} />
                  <span style={{ position: 'absolute', top: '100%', marginTop: 4, ...tagStyle(12.5, colors.ink) }}>{name}</span>
                </div>
              </At>
            ))}
          </Panel>
        )
      })}
    </Frame>
  )
}

/* ═════════════════════════════════════════ A_T07 · slide 14 · one capability, three names (646 x 330) */

function A_T07({ step = 0 }: { step?: number }) {
  const W = 596
  const H = 300
  const P = useParts(step, 2)
  const walk = useWalk(2, P.done, 1800)
  const t = useClock()
  const lit1 = P.lit(1) || walk === 0
  const lit2 = P.lit(2) || walk === 1
  /* the capability box */
  const BX = 0
  const BW = 172
  const BY = 40
  const BH = 150
  const bcx = BX + BW / 2
  const bcy = BY + BH / 2
  /* the three name tags */
  const TW = 222
  const TX = W - TW
  const TH = 64
  const tys = [0, 118, 236] // tops; centres at +32
  const tagC = tys.map((y) => y + TH / 2)
  const tags = [
    { src: awsMark, name: 'EC2', color: '#232F3E', k: 0.7 },
    { src: azureMark, name: 'Virtual Machines', color: '#0078D4', k: 0.62 },
    { src: gcMark, name: 'Compute Engine', color: '#1E8E3E', k: 0.62 },
  ]
  /* arrows: from the box's right edge (fanned start points) to each tag's left edge, straight */
  const ax1 = BX + BW + 10
  const starts = [bcy - 36, bcy, bcy + 36]
  const ax2 = TX - 10
  const on1 = P.shown(1)
  return (
    <Frame w={W} h={H}>
      {/* capability: one grey box */}
      <Panel x={BX} y={BY} w={BW} h={BH} lit={lit1} tint="linear-gradient(180deg, #F4F6FA 0%, #E4E9F1 100%)" radius={18}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <span className={lc('float')} style={{ display: 'grid', placeItems: 'center', width: 70, height: 70, borderRadius: 20, background: 'linear-gradient(180deg, #8C98AC 0%, #5F6B80 100%)', color: colors.white, boxShadow: '0 12px 22px -12px rgba(40,52,74,0.7)', ...lv(0, 3.6) }}>
            <Icon name="Server" size={34} />
          </span>
          <span style={tagStyle(15, '#3D4A60')}>Capability</span>
        </div>
      </Panel>
      {tags.map((g, i) => (
        <Arrow key={i} x1={ax1} y1={starts[i]} x2={ax2} y2={tagC[i]} on={on1} color={g.color} delay={i * 130} />
      ))}
      {on1 && tags.map((g, i) => (
        <Dot key={i} points={[[ax1, starts[i]], [ax2 - 24, tagC[i] - ((tagC[i] - starts[i]) * 24) / (ax2 - ax1)]]} t={t} period={3.3} phase={i * 1.1} ride={0.32} tone={g.color} size={10} />
      ))}
      {tags.map((g, i) => (
        <Panel key={i} x={TX} y={tys[i]} w={TW} h={TH} on={on1} lit={lit1} delay={180 + i * 130} radius={14}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px' }}>
            <MarkTile src={g.src} size={40} k={g.k} />
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 18, color: colors.ink, whiteSpace: 'nowrap' }}>{g.name}</span>
          </div>
        </Panel>
      ))}
      {/* point 2: learning one provider makes the others faster to learn */}
      <Show on={P.shown(2)} style={{ position: 'absolute', left: BX, top: BY + BH + 14, width: BW }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 22 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, borderRadius: 14, boxShadow: lit2 ? `0 0 0 3px ${colors.accent}` : undefined, padding: 6, transition: `box-shadow 420ms ${EASE}` }}>
            <GlyphTile icon="GraduationCap" size={40} loop="bob" />
            <span style={tagStyle(12.5)}>Learning</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, borderRadius: 14, boxShadow: lit2 ? `0 0 0 3px ${colors.accent}` : undefined, padding: 6, transition: `box-shadow 420ms ${EASE}` }}>
            <GlyphTile icon="FastForward" size={40} loop="nudge" d={0.4} />
            <span style={tagStyle(12.5)}>Faster</span>
          </div>
        </div>
      </Show>
    </Frame>
  )
}

/* ═════════════════════════════════════════ A_T10B · slide 19 · relational tables vs NoSQL documents (646 x 380) */

/** a small table: a header strip and rows of cells; `keyRow` marks the joined row's key cell */
function MiniTable({ w, rows = 4, keyRow = 2, keyCol = 0, lit = false, d = 0 }: { w: number; rows?: number; keyRow?: number; keyCol?: number; lit?: boolean; d?: number }) {
  const cols = 3
  return (
    <div style={{ width: w, borderRadius: 10, overflow: 'hidden', background: colors.white, boxShadow: `inset 0 0 0 1.5px ${colors.line}, 0 8px 16px -12px rgba(31,64,140,0.4)` }}>
      <div style={{ height: 18, background: `linear-gradient(180deg, ${colors.brand} 0%, ${colors.brandDark} 100%)` }} />
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 5, padding: '5px 7px', borderTop: r ? `1px solid ${colors.line}` : undefined }}>
          {Array.from({ length: cols }, (_, c) => (
            <span
              key={c}
              className={c === keyCol && r === keyRow ? lc('glow') : undefined}
              style={{ height: 8, borderRadius: 3, background: c === keyCol && r === keyRow ? (lit ? colors.accent : colors.brand) : '#D9E3F5', ...lv(d, 2.4) }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/** a schema-less document card: braces and key lines of varying length */
function DocCard({ lines, d = 0 }: { lines: number[]; d?: number }) {
  return (
    <span className={lc('bob')} style={{ display: 'block', width: 64, padding: '6px 7px', borderRadius: 9, background: colors.white, boxShadow: `inset 0 0 0 1.5px ${colors.line}, 0 6px 12px -8px rgba(31,64,140,0.45)`, ...lv(d, 2.6) }}>
      <span style={{ display: 'block', fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontWeight: 700, fontSize: 10, lineHeight: 1, color: colors.brand }}>{'{ }'}</span>
      {lines.map((l, i) => (
        <span key={i} style={{ display: 'block', marginTop: 4, height: 5, width: `${l}%`, borderRadius: 3, background: i % 2 ? '#C7D6F3' : '#9DB6EA' }} />
      ))}
    </span>
  )
}

/** one storage node: a server slab under its documents */
function StoreNode({ d = 0 }: { d?: number }) {
  return (
    <span style={{ position: 'relative', display: 'block', width: 70, height: 24, borderRadius: 7, background: `linear-gradient(180deg, ${colors.brand} 0%, ${colors.brandDark} 100%)`, boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.35), 0 8px 14px -8px rgba(1,70,199,0.7)' }}>
      <span style={{ position: 'absolute', left: 8, top: 10.5, width: 26, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.5)' }} />
      <span className={lc('blink')} style={{ position: 'absolute', right: 9, top: 9, width: 6, height: 6, borderRadius: 9, background: '#7DF0A8', boxShadow: '0 0 6px #7DF0A8', ...lv(d, 1.9) }} />
    </span>
  )
}

function A_T10B({ step = 0 }: { step?: number }) {
  const W = 600
  const H = 334
  const P = useParts(step, 3)
  const walk = useWalk(3, P.done, 1600)
  const t = useClock()
  /* the deciding data shape on top, two panels below */
  const DY = 28 // centre of the data tile
  const PY = 100
  const PH = H - PY
  const LW = 286
  const RX = W - LW
  const litL = P.lit(1) || walk === 0
  const litR = P.lit(2) || walk === 1
  const litD = P.lit(3) || walk === 2
  /* table geometry inside the left panel */
  const TW = 104
  const TA = 24
  const TB = LW - 24 - TW
  const TY = 28
  const keyY = TY + 18 + 2 * 19 + 9 // header + two rows + half a row
  return (
    <Frame w={W} h={H}>
      {/* step 3: the data decides: arrows from the data tile down to each panel's top centre */}
      <Show on={P.shown(3)} style={{ position: 'absolute', inset: 0 }}>
        <At x={W / 2} y={DY}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px 8px 8px', borderRadius: 16, ...TILE_SKIN, boxShadow: litRing(litD, TILE_SKIN.boxShadow as string), transition: `box-shadow 420ms ${EASE}` }}>
            <GlyphTile icon="Shapes" size={40} loop="turn" t={4} />
            <span style={{ ...tagStyle(15), fontWeight: 700 }}>Data</span>
            <span className={lc('pulse')} style={{ display: 'grid', placeItems: 'center', color: colors.brand, ...lv(0, 1.8) }}>
              <Icon name="Split" size={20} />
            </span>
          </div>
        </At>
      </Show>
      <Arrow x1={W / 2 - 40} y1={DY + 30} x2={LW / 2 + 40} y2={PY - 8} on={P.shown(3)} />
      <Arrow x1={W / 2 + 40} y1={DY + 30} x2={RX + LW / 2 - 40} y2={PY - 8} on={P.shown(3)} delay={130} />
      {/* left: relational */}
      <Panel x={0} y={PY} w={LW} h={PH} on={P.shown(1)} lit={litL}>
        <div style={{ position: 'absolute', left: TA, top: TY }}>
          <MiniTable w={TW} keyCol={2} lit={litL} />
        </div>
        <div style={{ position: 'absolute', left: TB, top: TY }}>
          <MiniTable w={TW} keyCol={0} lit={litL} d={0.3} />
        </div>
        {/* the join between the two key cells */}
        <div style={{ position: 'absolute', left: TA + TW - 10, top: keyY - 1.5, width: TB + 10 - (TA + TW - 10), height: 3, borderRadius: 2, background: litL ? colors.accent : colors.brand, zIndex: 2 }} />
        <Dot points={[[TA + TW - 6, keyY], [TB + 6, keyY]]} t={t} period={2.4} ride={0.7} size={9} tone={litL ? colors.accent : colors.brand} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <GlyphTile icon="Table2" size={38} loop="float" />
          <span style={tagStyle(14)}>Relational</span>
        </div>
      </Panel>
      {/* right: NoSQL, documents across nodes that keep scaling out */}
      <Panel x={RX} y={PY} w={LW} h={PH} on={P.shown(2)} lit={litR}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 14, display: 'flex', justifyContent: 'center', gap: 16 }}>
          {[
            [[80, 55, 70], [60, 85]],
            [[70, 90], [85, 50, 65]],
            [[55, 75, 90], [80, 60]],
          ].map((docs, n) => (
            <div key={n} className={n === 2 ? lc('scale') : undefined} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, ...lv(0, 4.8) }}>
              <DocCard lines={docs[0]} d={n * 0.5} />
              <DocCard lines={docs[1]} d={n * 0.5 + 1.1} />
              <StoreNode d={n * 0.6} />
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <GlyphTile icon="FileJson" size={38} loop="float" d={0.8} />
          <span style={tagStyle(14)}>NoSQL</span>
        </div>
      </Panel>
    </Frame>
  )
}

/* ═════════════════════════════════════════ B_T13 · slide 22 · pre-built API vs ML platform (646 x 330) */

function B_T13({ step = 0 }: { step?: number }) {
  const W = 606
  const H = 296
  const P = useParts(step, 4)
  const walk = useWalk(4, P.done)
  const t = useClock()
  /* left box: the pre-built API, a short vertical flow */
  const AX = 0
  const AW = 160
  /* right box: the ML platform */
  const MX = 176
  const MW = W - MX
  const BY = 0
  const BH = H
  const HEAD = 42 // box title band
  /* API flow */
  const acx = AX + AW / 2
  const aY = [HEAD + 38, HEAD + 122, HEAD + 206] // 38 px tiles, tags under them, 21 px clear at the foot
  /* platform pipeline: four stages across */
  const pY = HEAD + 40
  /* four equal columns across the platform: pipeline stages and their tools share the centres */
  const px = (i: number) => MX + (MW / 8) * (2 * i + 1)
  /* the four feature tiles under the pipeline, lit per point */
  const fY = HEAD + 170
  const feats = [
    { icon: 'NotebookPen', icon2: 'Cpu', tag: 'Notebooks' },
    { icon: 'ChartLine', tag: 'Tracking' },
    { icon: 'Rocket', tag: 'Endpoint' },
    { icon: 'WandSparkles', tag: 'AutoML' },
  ]
  const stages = [
    { icon: 'Database', tag: 'Data' },
    { icon: 'Dumbbell', tag: 'Train' },
    { icon: 'SlidersHorizontal', tag: 'Tune' },
    { icon: 'Rocket', tag: 'Deploy' },
  ]
  const title = (s: string) => <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: colors.brandDeep, whiteSpace: 'nowrap' }}>{s}</span>
  return (
    <Frame w={W} h={H}>
      <Panel x={AX} y={BY} w={AW} h={BH} radius={18}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: HEAD, display: 'grid', placeItems: 'center', borderBottom: `1.5px solid ${colors.line}` }}>{title('Pre-Built API')}</div>
      </Panel>
      <Tagged x={acx} y={aY[0]} tag="Input">
        <GlyphTile icon="Image" size={38} loop="float" />
      </Tagged>
      <Tagged x={acx} y={aY[1]} tag="Model">
        <GlyphTile icon="BrainCircuit" size={38} loop="pulse" fill />
      </Tagged>
      <Tagged x={acx} y={aY[2]} tag="Output">
        <GlyphTile icon="Tag" size={38} loop="float" d={0.8} />
      </Tagged>
      <Arrow x1={acx} y1={aY[0] + 44} x2={acx} y2={aY[1] - 25} />
      <Arrow x1={acx} y1={aY[1] + 44} x2={acx} y2={aY[2] - 25} />
      {/* the API answers at once: one quick dot per cycle */}
      <Dot points={[[acx, aY[0] + 22], [acx, aY[2] - 22]]} t={t} period={4.8} ride={0.22} size={10} />

      <Panel x={MX} y={BY} w={MW} h={BH} radius={18}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: HEAD, display: 'grid', placeItems: 'center', borderBottom: `1.5px solid ${colors.line}` }}>{title('ML Platform')}</div>
      </Panel>
      {stages.map((s, i) => (
        <Tagged key={i} x={px(i)} y={pY} tag={s.tag}>
          <GlyphTile icon={s.icon} size={40} loop={i === 2 ? 'rock' : 'float'} d={i * 0.5} fill={i === 3} />
        </Tagged>
      ))}
      {stages.slice(0, 3).map((_, i) => (
        <Arrow key={i} x1={px(i) + 28} y1={pY} x2={px(i + 1) - 28} y2={pY} />
      ))}
      {/* the platform takes its time: one slow dot through all four stages */}
      <Dot points={[[px(0), pY], [px(3), pY]]} t={t} period={4.8} ride={0.92} size={10} />
      {/* a hairline between the pipeline and its tools */}
      <div style={{ position: 'absolute', left: MX + 22, width: MW - 44, top: HEAD + 98, height: 1.5, background: colors.line }} />
      {feats.map((f, i) => {
        const lit = P.lit(i + 1) || walk === i
        return (
          <Show key={i} on={P.shown(i + 1)} style={{ position: 'absolute', left: px(i), top: fY, width: 0, height: 0 }}>
            <div style={{ position: 'absolute', left: -41, top: -36, width: 82, height: 82, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7, background: lit ? '#FFF6EE' : '#F6F9FE', boxShadow: lit ? `inset 0 0 0 2.5px ${colors.accent}` : `inset 0 0 0 1.5px ${colors.line}`, transition: `box-shadow 420ms ${EASE}, background 420ms ${EASE}` }}>
              {f.icon2 ? (
                <span style={{ display: 'flex', gap: 4 }}>
                  <GlyphTile icon={f.icon} size={30} loop="float" />
                  <GlyphTile icon={f.icon2} size={30} loop="pulse" d={0.6} />
                </span>
              ) : (
                <GlyphTile icon={f.icon} size={34} loop={i === 3 ? 'rock' : i === 2 ? 'bob' : 'pulse'} d={i * 0.4} />
              )}
              <span style={tagStyle(12.5)}>{f.tag}</span>
            </div>
          </Show>
        )
      })}
    </Frame>
  )
}

export const figures: Record<string, Fig> = {
  A_T06: A_T06 as unknown as Fig,
  A_T07: A_T07 as unknown as Fig,
  A_T10B: A_T10B as unknown as Fig,
  B_T13: B_T13 as unknown as Fig,
}

/* builder b's loop vocabulary (transform / opacity only, `bx` prefix), held still on ?still, thumbnails and reduced motion */
export const css = `
.bx { animation-delay: var(--bx-d, 0s); }
@keyframes bx-float { 0%, 100% { transform: translateY(0) scale(1) } 50% { transform: translateY(-2.5px) scale(1.06) } }
.bx-float { animation: bx-float var(--bx-t, 3.6s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes bx-bob { 0%, 100% { transform: translateY(-2px) } 50% { transform: translateY(2px) } }
.bx-bob { animation: bx-bob var(--bx-t, 2.4s) ease-in-out infinite; }
@keyframes bx-pulse { 0%, 100% { transform: scale(0.94) } 50% { transform: scale(1.07) } }
.bx-pulse { animation: bx-pulse var(--bx-t, 1.8s) ease-in-out infinite; }
@keyframes bx-rock { 0%, 100% { transform: rotate(-8deg) } 50% { transform: rotate(8deg) } }
.bx-rock { animation: bx-rock var(--bx-t, 3s) ease-in-out infinite; }
@keyframes bx-nudge { 0%, 100% { transform: translateX(-2px) } 50% { transform: translateX(3px) } }
.bx-nudge { animation: bx-nudge var(--bx-t, 1.6s) ease-in-out infinite; }
@keyframes bx-turn { 0%, 25% { transform: rotate(0deg) } 75%, 100% { transform: rotate(180deg) } }
.bx-turn { animation: bx-turn var(--bx-t, 4s) cubic-bezier(0.65,0,0.35,1) infinite; }
@keyframes bx-blink { 0%, 60%, 100% { opacity: 1 } 75% { opacity: 0.25 } }
.bx-blink { animation: bx-blink var(--bx-t, 1.9s) ease-in-out infinite; }
@keyframes bx-glow { 0%, 100% { opacity: 1 } 50% { opacity: 0.55 } }
.bx-glow { animation: bx-glow var(--bx-t, 2.4s) ease-in-out infinite; }
/* the third node scales out: it slides in from the right, holds, and slides back to come in again */
@keyframes bx-scale { 0% { opacity: 0; transform: translateX(16px) } 18%, 82% { opacity: 1; transform: translateX(0) } 100% { opacity: 0; transform: translateX(16px) } }
.bx-scale { animation: bx-scale var(--bx-t, 4.8s) cubic-bezier(0.45,0,0.55,1) infinite; }
.cc-still .bx, .deck-thumb .bx { animation: none !important; }
.cc-still .bx-scale, .deck-thumb .bx-scale { opacity: 1 !important; transform: none !important; }
@media (prefers-reduced-motion: reduce) { .bx { animation: none !important; } .bx-scale { opacity: 1 !important; transform: none !important; } }
`
