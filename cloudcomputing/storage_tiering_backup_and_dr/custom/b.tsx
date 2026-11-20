import type { ReactNode } from 'react'
import type * as React from 'react'
import { colors } from '@/design/tokens'
import { BOX_W, Card, Label, useBuild } from '@/decks/figures/scene'
import { NoteBox } from '@/decks/figures/net/frames'
import { VisualTable } from '@/decks/figures/net/vtable'
import { Icon, Rich } from '@/engine/icon'
import { At, Coins, EASE, Frame, Glyph, Lines, Mark, Mark2, Panel, Sheen, Show, SvgArrow, Tag, flex, heading, sm, useHeld, useLap } from './k'
import mStd from '../images/aws-s3-standard.svg'
import mIa from '../images/aws-s3-standard-ia.svg'
import mOz from '../images/aws-s3-one-zone-ia.svg'
import mGlacier from '../images/aws-s3-glacier.svg'
import mGfr from '../images/aws-s3-glacier-flexible-retrieval.svg'
import mGda from '../images/aws-s3-glacier-deep-archive.svg'
import mObject from '../images/aws-s3-object.svg'
import mSnap from '../images/aws-ebs-snapshot.svg'
import mVault from '../images/aws-aws-backup-backup-vault.svg'
import mBackup from '../images/aws-aws-backup.svg'
import mRpo from '../images/aws-aws-backup-recovery-point-objective.svg'
import mRto from '../images/aws-aws-backup-recovery-time-objective.svg'
import mRds from '../images/aws-rds.svg'
import mAsg from '../images/aws-ec2-auto-scaling.svg'

/*
 * Builder B · Storage Tiering, Backup & DR, sections 3 to 5: the figures the diagram renderer cannot draw.
 *   B_Tiers  three stacked tiers (TR 10, `mode: landscape`), and the same graphic with the trade-off arrows (TR 11,
 *            `mode: tradeoff`: "No new diagram; reuse the tier landscape graphic")
 *   B_T12    the table-style graphic: Standard, Standard-IA, One Zone-IA against retrieval time and relative cost
 *   B_T16    the timeline bar: day 0 Standard, day 30 Standard-IA, day 90 Glacier, cost falling left to right
 *   B_T17    current, noncurrent and incomplete upload, each with its bin and age; expiration vs transition cost
 *   B_T19    four backup types, the blocks each one copies at every cycle
 *   B_T20    last backup, disaster, restore point; the RPO gap and the RTO gap
 *   B_T21    the DR spectrum: backup-restore, pilot light, warm standby; cost rising, RTO falling
 *   B_TargetTable (slide) TR 25: the pattern table with the 5-minute RPO and 10-minute RTO targets highlighted
 * Relative cost is drawn as coins, never a price: the TR gives none.
 */

/* ───────────────────────── T10 / T11 · the tiers ───────────────────────── */

const TIERS = [
  { name: 'Hot Tier', cls: 'S3 Standard', mark: mStd, icon: 'Flame', tint: colors.danger, coins: 3, speed: 'Instantly Available' },
  { name: 'Cool Tier', cls: 'S3 Standard-IA', mark: mIa, icon: 'Snowflake', tint: colors.info, coins: 2, speed: 'Small Retrieval Fee' },
  { name: 'Archive Tier', cls: 'S3 Glacier', mark: mGlacier, icon: 'Archive', tint: colors.muted, coins: 1, speed: 'Minutes To Hours' },
] as const

function TierRow({ i, y, w, h, on, active, wide }: { i: number; y: number; w: number; h: number; on: boolean; active: boolean; wide: boolean }) {
  const t = TIERS[i]
  return (
    <Show on={on}>
      <Panel active={active} style={{ left: 0, top: y, width: w, height: h, overflow: 'hidden' }}>
        <Sheen delay={i * 1.4} />
        <div style={{ position: 'absolute', left: 0, top: 10, bottom: 10, width: 5, borderRadius: 4, background: t.tint }} />
        <div style={{ position: 'absolute', left: 18, top: 0, bottom: 0, ...flex(12) }}>
          <span className="s8-bob" style={{ display: 'grid', animationDelay: `${i * 0.6}s` }}>
            <Mark src={t.mark} size={wide ? 58 : 50} />
          </span>
          <span style={flex(4, 'column', { alignItems: 'flex-start' })}>
            <span style={{ ...flex(6), ...heading(wide ? 19 : 17) }}>
              <span style={{ color: t.tint, display: 'grid' }}>
                <Icon name={t.icon} size={18} />
              </span>
              {t.name}
            </span>
            <Label tone="lift" strong>
              {t.cls}
            </Label>
          </span>
        </div>
        {wide && (
          <div style={{ position: 'absolute', right: 16, top: 0, bottom: 0, ...flex(16) }}>
            <span style={flex(4, 'column')}>
              <span style={heading(14, colors.muted, 600)}>Relative Cost</span>
              <span className="s8-pulse" style={{ display: 'grid', animationDelay: `${i * 0.5}s` }}>
                <Coins n={t.coins} />
              </span>
            </span>
            <span style={flex(4, 'column', { width: 150 })}>
              <span style={heading(14, colors.muted, 600)}>Retrieval</span>
              <Label strong tone={i === 0 ? 'good' : i === 1 ? 'brand' : 'warn'}>
                {t.speed}
              </Label>
              {/* 2026-11-10: the retrieval itself, a runner on a track: quick for hot, slower for cool, slowest for archive */}
              <span style={{ position: 'relative', width: 120, height: 6, borderRadius: 3, background: colors.surface2, boxShadow: `inset 0 0 0 1px ${colors.line}` }}>
                <span className="s8-run" style={{ width: 10, height: 10, borderRadius: 10, background: t.tint, boxShadow: `0 0 0 3px ${t.tint}33`, animationDuration: `${[0.9, 2.4, 5.5][i]}s` }} />
              </span>
            </span>
          </div>
        )}
      </Panel>
    </Show>
  )
}

/** a wedge running down the three rows: `grow` widens toward the archive row */
function Wedge({ x, y0, y1, grow, color, on, active }: { x: number; y0: number; y1: number; grow: boolean; color: string; on: boolean; active: boolean }) {
  const a = grow ? 6 : 30
  const b = grow ? 30 : 6
  return (
    <g opacity={on ? (active ? 1 : 0.55) : 0} style={{ transition: `opacity 420ms ${EASE}` }}>
      <polygon points={`${x - a},${y0} ${x + a},${y0} ${x + b},${y1 - 16} ${x - b},${y1 - 16}`} fill={color} opacity={0.22} />
      <polygon points={`${x - b - 6},${y1 - 18} ${x + b + 6},${y1 - 18} ${x},${y1}`} fill={color} />
      <line x1={x} y1={y0 + 4} x2={x} y2={y1 - 20} stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeDasharray="9 4" className="s8-dash" />
      {on && <circle cx={x} cy={y0 + 6} r={7} fill={color} stroke="#FFFFFF" strokeWidth={2} className="s8-fall" style={{ ['--fall' as string]: `${y1 - y0 - 34}px`, animationDuration: '2.8s', animationDelay: `${(x % 3) * 0.6}s` } as React.CSSProperties} />}
    </g>
  )
}

function B_Tiers({ step, mode }: { step: number; mode: 'landscape' | 'tradeoff' }) {
  if (mode === 'landscape') {
    return (
      <Frame w={580} h={366}>
        {[0, 1, 2].map((i) => (
          <TierRow key={i} i={i} y={8 + i * 120} w={580} h={104} on={step >= i + 1} active={step === i + 1} wide />
        ))}
      </Frame>
    )
  }
  const COLS = [
    { x: 400, label: 'Retrieval Time', grow: true, color: colors.accent, ends: ['Milliseconds', 'Hours'] },
    { x: 494, label: 'Storage Price', grow: false, color: colors.brand, ends: ['Highest', 'Lowest'] },
    { x: 588, label: 'Retrieval Fees', grow: true, color: colors.accent, ends: ['None', 'Highest'] },
  ]
  return (
    <Frame w={616} h={366}>
      {[0, 1, 2].map((i) => (
        <TierRow key={i} i={i} y={40 + i * 110} w={330} h={94} on active={false} wide={false} />
      ))}
      <Lines w={616} h={366}>
        {COLS.map((c, k) => (
          <Wedge key={k} x={c.x} y0={70} y1={334} grow={c.grow} color={c.color} on={step >= k + 1} active={step === k + 1} />
        ))}
      </Lines>
      {COLS.map((c, k) => (
        <Show key={k} on={step >= k + 1}>
          <At x={c.x} y={22}>
            <span style={{ display: 'block', width: 90, textAlign: 'center', ...heading(14, step === k + 1 ? colors.brandDark : colors.ink, 700) }}>{c.label}</span>
          </At>
          <At x={c.x} y={56}>
            <Label strong tone="lift" size={14}>
              {c.ends[0]}
            </Label>
          </At>
          <At x={c.x} y={352}>
            <Label strong tone="lift" size={14}>
              {c.ends[1]}
            </Label>
          </At>
        </Show>
      ))}
    </Frame>
  )
}

/* ───────────────────────── T12 · Standard, Standard-IA, One Zone-IA ───────────────────────── */

const T12_COLS = [196, 132, 124, 128]
const T12_HEAD = ['Storage Class', 'Retrieval Time', 'Retrieval Fee', 'Relative Cost']
const T12_ROWS = [
  { mark: mStd, name: 'S3 Standard', time: 'Milliseconds', fee: 'No Fee', coins: 3 },
  { mark: mIa, name: 'S3 Standard-IA', time: 'Milliseconds', fee: 'Per Gigabyte', coins: 2 },
  { mark: mOz, name: 'S3 One Zone-IA', time: 'Milliseconds', fee: 'Per Gigabyte', coins: 1 },
]

function B_T12({ step }: { step: number }) {
  const grid = T12_COLS.map((w) => `${w}px`).join(' ')
  return (
    <Frame w={580} h={376}>
      <Panel style={{ left: 0, top: 0, width: 580, height: 262, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: grid, height: 46, alignItems: 'center', background: `linear-gradient(135deg, ${colors.brand}0a 0%, ${colors.brand}18 100%)`, boxShadow: `inset 0 -1px 0 ${colors.brand}29` }}>
          {T12_HEAD.map((h, i) => (
            <span key={h} style={{ ...heading(15, colors.brand), paddingLeft: i ? 10 : 16 }}>
              {h}
            </span>
          ))}
        </div>
        {T12_ROWS.map((r, i) => (
          <div
            key={r.name}
            style={{
              display: 'grid',
              gridTemplateColumns: grid,
              height: 72,
              alignItems: 'center',
              borderTop: `1px solid ${colors.line}`,
              position: 'relative',
              overflow: 'hidden',
              background: step === i + 1 ? `${colors.brand}10` : undefined,
              opacity: step >= i + 1 ? 1 : 0,
              transform: step >= i + 1 ? 'none' : 'translateX(-14px)',
              transition: `all 420ms ${EASE}`,
            }}
          >
            <Sheen delay={i * 1.2} dur={5} />
            <span style={{ paddingLeft: 14, ...flex(10) }}>
              <Mark src={r.mark} size={44} />
              <span style={heading(16)}>{r.name}</span>
            </span>
            <span style={{ paddingLeft: 10, ...flex(6) }}>
              <span className="s8-blink" style={{ display: 'grid', color: colors.brand, animationDelay: `${i * 0.45}s` }}>
                <Icon name="Zap" size={16} />
              </span>
              <span style={heading(15, colors.ink, 600)}>{r.time}</span>
            </span>
            <span style={{ paddingLeft: 10 }}>
              <Label strong tone={i === 0 ? 'good' : 'warn'}>
                {r.fee}
              </Label>
            </span>
            <span style={{ paddingLeft: 10 }}>
              <Coins n={r.coins} />
            </span>
          </div>
        ))}
      </Panel>
      <Show on={step >= 3}>
        <At x={290} y={290}>
          <span style={flex(8)}>
            <Tag tone="lift" icon="MapPin">
              Single AZ
            </Tag>
            <Tag tone="bad" icon="TriangleAlert">
              Losing That AZ Means Losing The Data
            </Tag>
          </span>
        </At>
      </Show>
      <Show on={step >= 4}>
        <At x={290} y={344}>
          <span style={flex(12)}>
            <Tag tone="brand" icon="Globe">
              Hot: Active Website Asset
            </Tag>
            <Tag tone="brand" icon="FileText">
              Cool: Monthly Report
            </Tag>
          </span>
        </At>
      </Show>
    </Frame>
  )
}

/* ───────────────────────── T16 · the timeline bar ───────────────────────── */

const T16 = { x0: 24, d30: 172, d90: 330, xg: 470, x1: 590, bar: 176 } as const

function B_T16({ step }: { step: number }) {
  const t = useLap(step >= 1, 7000, 0.62)
  const seg = [
    { x: T16.x0, w: T16.d30 - T16.x0, name: 'S3 Standard', mark: mStd, on: step >= 1, dashed: false },
    { x: T16.d30, w: T16.d90 - T16.d30, name: 'Standard-IA', mark: mIa, on: step >= 1, dashed: false },
    { x: T16.d90, w: T16.xg - T16.d90, name: 'Glacier Flexible Retrieval', mark: mGfr, on: step >= 2, dashed: false },
    { x: T16.xg, w: T16.x1 - T16.xg, name: 'Deep Archive', mark: mGda, on: step >= 2, dashed: true },
  ]
  const reach = step >= 2 ? T16.x1 - 20 : T16.d90 - 20
  const tx = T16.x0 + 18 + (reach - T16.x0 - 18) * sm(t)
  const shades = ['#2D63FB', '#5B86FF', '#86A6FF', '#B7C9FF']
  return (
    <Frame w={606} h={356}>
      <Show on={step >= 4}>
        <Lines w={606} h={356}>
          <path d={`M ${T16.d30} 26 V 14 H ${T16.xg} V 26`} fill="none" stroke={colors.brand} strokeWidth={2} />
        </Lines>
        <At x={(T16.d30 + T16.xg) / 2} y={14}>
          <Tag tone="solid" icon="Link">
            One Rule, One Filter, Chained Transitions
          </Tag>
        </At>
      </Show>
      {seg.map((s, i) => (
        <Show key={i} on={s.on}>
          <At x={s.x + s.w / 2} y={58}>
            <span style={{ display: 'block', width: s.w - 6, textAlign: 'center', ...heading(14, colors.ink, 700) }}>{s.name}</span>
          </At>
          <At x={s.x + s.w / 2} y={112}>
            <Mark src={s.mark} size={46} />
          </At>
          <div style={{ position: 'absolute', left: s.x + 2, top: T16.bar - 17, width: s.w - 4, height: 34, borderRadius: 10, background: s.dashed ? 'transparent' : shades[i], border: s.dashed ? `2px dashed ${shades[2]}` : undefined }} />
        </Show>
      ))}
      {/* the object rides the bar, keeping its key */}
      <Show on={step >= 1}>
        <At x={tx} y={T16.bar} z={8}>
          <Mark src={mObject} size={30} />
        </At>
        {[
          [T16.x0, 'Day 0'],
          [T16.d30, 'Day 30'],
        ].map(([x, d]) => (
          <At key={d as string} x={(x as number) + (x === T16.x0 ? 26 : 0)} y={T16.bar + 34}>
            <Label strong tone="lift">
              {d}
            </Label>
          </At>
        ))}
      </Show>
      <Show on={step >= 2}>
        <At x={T16.d90} y={T16.bar + 34}>
          <Label strong tone="lift">
            Day 90
          </Label>
        </At>
      </Show>
      <Show on={step >= 3}>
        <Lines w={606} h={356}>
          <path d={`M ${T16.d30 + 4} ${T16.bar + 58} H ${T16.d30 + 92}`} stroke={colors.warning} strokeWidth={3} strokeLinecap="round" />
        </Lines>
        <At x={T16.d30 + 150} y={T16.bar + 80}>
          <Tag tone="warn" icon="TriangleAlert">
            Early Move: Billed At The Old Class&apos;s Rate
          </Tag>
        </At>
      </Show>
      {/* the cost arrow, decreasing left to right */}
      <Show on={step >= 1}>
        <Lines w={606} h={356}>
          <polygon points={`${T16.x0},${300} ${T16.x1 - 26},${318} ${T16.x1 - 26},${322} ${T16.x0},${340}`} fill={colors.brand} opacity={0.18} />
          <line x1={T16.x0 + 200} y1={320} x2={T16.x1 - 34} y2={320} stroke={colors.brand} strokeWidth={2} strokeDasharray="9 6" className="s8-dash" opacity={0.7} />
          <polygon points={`${T16.x1 - 28},${306} ${T16.x1},${320} ${T16.x1 - 28},${334}`} fill={colors.brand} />
        </Lines>
        <At x={130} y={320}>
          <Tag tone="brand" icon="TrendingDown">
            Cost Decreases
          </Tag>
        </At>
      </Show>
      <Show on={step >= 1}>
        <At x={Math.max(T16.x0 + 60, Math.min(tx, T16.x1 - 60))} y={T16.bar - 42} z={9}>
          <Label strong tone="solid" size={14}>
            Same Key
          </Label>
        </At>
      </Show>
    </Frame>
  )
}

/* ───────────────────────── T17 · three things expire ───────────────────────── */

const T17_CARDS = [
  { icon: 'FileClock', title: 'Current Version', age: 'Well Beyond The Last Planned Transition' },
  { icon: 'History', title: 'Noncurrent Version', age: 'Older Versions Kept By Versioning' },
  { icon: 'FileX', title: 'Incomplete Upload', age: 'After A Few Days' },
]

function B_T17({ step }: { step: number }) {
  const held = useHeld()
  /* 2026-11-10 (user: "too slow and hard to notice"): a file drops into each bin on a quick, clear beat; the two
     cost bars drain, one to half (transition), one to nothing (expiration) */
  const tf = useLap(step >= 1, 2000, 0.99)
  const tb = useLap(step >= 4, 2600, 0.99)
  return (
    <Frame w={616} h={366}>
      {T17_CARDS.map((c, i) => {
        const x = i * 208
        return (
          <Show key={i} on={step >= i + 1}>
            <Panel active={step === i + 1} style={{ left: x, top: 0, width: 200, height: 236 }}>
              <At x={100} y={42}>
                <Glyph icon={c.icon} size={52} />
              </At>
              <At x={100} y={90}>
                <span style={{ ...heading(16), whiteSpace: 'nowrap' }}>{c.title}</span>
              </At>
              <Lines w={200} h={236}>
                <SvgArrow x1={100} y1={104} x2={100} y2={124} color={colors.danger} />
              </Lines>
              {(() => {
                const ph = (tf + i * 0.33) % 1
                const fall = Math.min(1, ph / 0.55)
                const hit = ph > 0.55 && ph < 0.75
                return (
                  <>
                    {!held && step >= i + 1 && ph < 0.6 && (
                      <At x={100} y={60 + 84 * sm(fall)} z={9}>
                        <span style={{ display: 'grid', color: colors.brandDark, opacity: ph < 0.06 ? ph / 0.06 : ph > 0.5 ? (0.6 - ph) / 0.1 : 1, transform: `rotate(${fall * 25}deg) scale(${1 - fall * 0.35})` }}>
                          <Icon name="File" size={26} stroke={2.4} />
                        </span>
                      </At>
                    )}
                    <At x={100} y={148}>
                      <span style={{ display: 'grid', transform: !held && hit ? 'scale(1.16) rotate(-6deg)' : 'none', transition: 'transform 160ms ease-out' }}>
                        <Glyph icon="Trash2" size={44} tone={colors.danger} ring={!held && hit ? colors.danger : undefined} />
                      </span>
                    </At>
                  </>
                )
              })()}
              <div style={{ position: 'absolute', left: 8, right: 8, top: 180, height: 48, ...flex(6, 'row', { justifyContent: 'center' }), textAlign: 'center', ...heading(14, colors.brandDark, 700) }}>
                <span style={{ display: 'grid', flexShrink: 0 }}>
                  <Icon name="CalendarClock" size={16} />
                </span>
                <span>{c.age}</span>
              </div>
            </Panel>
          </Show>
        )
      })}
      <Show on={step >= 4}>
        <Panel active={step === 4} style={{ left: 0, top: 252, width: 616, height: 112 }}>
          {[
            ['Transition', 'Cost Lowered', 0.5, 'brand'],
            ['Expiration', 'Storage Cost Freed Entirely', 0, 'good'],
          ].map(([k, v, f, tone], j) => (
            <div key={k as string} style={{ position: 'absolute', left: 18, right: 18, top: 16 + j * 46, ...flex(12) }}>
              <span style={{ width: 96, ...heading(15) }}>{k}</span>
              <div style={{ position: 'relative', width: 220, height: 18, borderRadius: 9, background: colors.surface2, boxShadow: `inset 0 0 0 1px ${colors.line}` }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(held ? (f as number) : 1 - (1 - (f as number)) * sm(Math.min(1, tb / 0.6))) * 100}%`, borderRadius: 9, background: j ? colors.success : colors.brand, overflow: 'hidden' }}>
                  <Sheen dur={3.4} />
                </div>
              </div>
              <Label strong tone={tone as 'brand' | 'good'}>
                {v}
              </Label>
            </div>
          ))}
        </Panel>
      </Show>
    </Frame>
  )
}

/* ───────────────────────── T19 · four backup types ───────────────────────── */

const T19_ROWS: { name: string; sub: string; cells: number[][] | 'snap' }[] = [
  { name: 'Full', sub: 'All Data Every Time', cells: [[0, 1, 2, 3], [0, 1, 2, 3], [0, 1, 2, 3]] },
  { name: 'Incremental', sub: 'Changed Since Last Backup', cells: [[0, 1, 2, 3], [1], [3]] },
  { name: 'Differential', sub: 'Changes Since Last Full', cells: [[0, 1, 2, 3], [1], [1, 3]] },
  { name: 'Snapshot', sub: 'Point-In-Time Image', cells: 'snap' },
]

function Blocks({ copied }: { copied: number[] }) {
  return (
    <span style={flex(4)}>
      {[0, 1, 2, 3].map((b) => {
        const on = copied.includes(b)
        return <span key={b} className={on ? 's8-flash' : undefined} style={{ animationDelay: `${b * 0.22}s`, width: 16, height: 20, borderRadius: 4, background: on ? colors.brand : 'transparent', boxShadow: on ? 'inset 0 1px 0 rgba(255,255,255,0.4)' : `inset 0 0 0 1.5px ${colors.line}` }} />
      })}
    </span>
  )
}

function B_T19({ step }: { step: number }) {
  const x0 = 186
  const cw = 124
  return (
    <Frame w={566} h={376}>
      {['Cycle 1', 'Cycle 2', 'Cycle 3'].map((c, k) => (
        <At key={c} x={x0 + cw * k + cw / 2} y={14}>
          <Label strong tone="lift" icon={<Icon name="CalendarDays" size={14} />}>
            {c}
          </Label>
        </At>
      ))}
      {T19_ROWS.map((r, i) => {
        const y = 40 + i * 84
        const on = step >= i + 1
        return (
          <Show key={r.name} on={on}>
            <Panel active={step === i + 1} style={{ left: 0, top: y, width: 566, height: 74 }}>
              <div style={{ position: 'absolute', left: 14, top: 0, bottom: 0, ...flex(3, 'column', { alignItems: 'flex-start', justifyContent: 'center' }) }}>
                <span style={heading(17)}>{r.name}</span>
                <span style={heading(14, colors.muted, 600)}>{r.sub}</span>
              </div>
              {[0, 1, 2].map((k) => (
                <div key={k} style={{ position: 'absolute', left: x0 + cw * k, top: 0, width: cw, bottom: 0, ...flex(6, 'row', { justifyContent: 'center' }) }}>
                  <span style={{ color: colors.brand, display: 'grid' }}>
                    <span className="s8-nudge" style={{ display: 'grid', animationDelay: `${k * 0.3}s` }}>
                      <Icon name="ArrowRight" size={16} />
                    </span>
                  </span>
                  {r.cells === 'snap' ? (
                    <span style={flex(4)}>
                      <Mark src={mSnap} size={40} />
                    </span>
                  ) : (
                    <Blocks copied={r.cells[k]} />
                  )}
                </div>
              ))}
            </Panel>
          </Show>
        )
      })}
    </Frame>
  )
}

/* ───────────────────────── T20 · the RPO gap and the RTO gap ───────────────────────── */

const T20 = { b: 96, d: 316, r: 536, axis: 132 } as const

function Gap({ x0, x1, y, label, mark, on, active, line }: { x0: number; x1: number; y: number; label: string; mark: string; on: boolean; active: boolean; line: string }) {
  return (
    <Show on={on}>
      <Lines w={616} h={366}>
        <SvgArrow x1={x0 + 6} y1={y} x2={x1 - 6} y2={y} color={active ? colors.brand : colors.brandDark} width={2.4} head={9} both />
      </Lines>
      <At x={(x0 + x1) / 2} y={y + 30}>
        <span style={flex(6)}>
          <Mark src={mark} size={34} ring={active ? colors.brand : undefined} />
          <Tag tone="solid">{label}</Tag>
        </span>
      </At>
      <At x={(x0 + x1) / 2} y={y + 76}>
        <span style={{ display: 'block', width: x1 - x0 - 12, textAlign: 'center', ...heading(14, colors.brandDark, 700) }}>{line}</span>
      </At>
    </Show>
  )
}

function B_T20({ step }: { step: number }) {
  const held = useHeld()
  return (
    <Frame w={616} h={366}>
      <Lines w={616} h={366}>
        <line x1={24} y1={T20.axis} x2={594} y2={T20.axis} stroke={colors.muted} strokeWidth={2} />
        {[T20.b, T20.d, T20.r].map((x) => (
          <circle key={x} cx={x} cy={T20.axis} r={6} fill={colors.white} stroke={colors.brand} strokeWidth={2.5} />
        ))}
      </Lines>
      <At x={T20.b} y={58}>
        <span style={flex(4, 'column')}>
          <Mark src={mVault} size={46} />
          <Label strong>Last Backup</Label>
        </span>
      </At>
      <At x={T20.d} y={58}>
        <span style={flex(4, 'column')}>
          <span className={held ? undefined : 's8-pulse'} style={{ display: 'grid' }}>
            <Glyph icon="Zap" size={46} tone={colors.danger} />
          </span>
          <Label strong tone="bad">
            Disaster
          </Label>
        </span>
      </At>
      <At x={T20.r} y={58}>
        <span style={flex(4, 'column')}>
          <Glyph icon="CircleCheck" size={46} tone={colors.success} />
          <Label strong tone="good">
            Restore Point
          </Label>
        </span>
      </At>
      <Gap x0={T20.b} x1={T20.d} y={T20.axis + 30} label="RPO: Data Loss" mark={mRpo} on={step >= 1} active={step === 1} line="Four-Hour RPO: Backups At Least Every Four Hours" />
      <Gap x0={T20.d} x1={T20.r} y={T20.axis + 30} label="RTO: Downtime" mark={mRto} on={step >= 2} active={step === 2} line="One-Hour RTO: Full Recovery Within One Hour" />
      <Show on={step >= 3}>
        <At x={308} y={296}>
          <span style={flex(8)}>
            <Coins n={3} />
            <Tag tone="warn" icon="TrendingUp">
              Lower RPO And RTO Cost More
            </Tag>
          </span>
        </At>
      </Show>
      <Show on={step >= 4}>
        <At x={308} y={340}>
          <span style={flex(10)}>
            <Tag tone="brand" icon="CreditCard">
              Payment And Order Databases: Near-Zero
            </Tag>
            <Tag tone="lift" icon="Archive">
              Archives: Higher Values
            </Tag>
          </span>
        </At>
      </Show>
    </Frame>
  )
}

/* ───────────────────────── T21 · the DR spectrum ───────────────────────── */

const T21_X = [214, 374, 534]
const T21_ST = [
  { name: 'Backup-Restore', mark: mBackup, line: 'Rebuilds From Scratch', cost: 1, rto: 3 },
  { name: 'Pilot Light', mark: mRds, line: 'Minimal Core Always Running', cost: 2, rto: 2 },
  { name: 'Warm Standby', mark: mAsg, line: 'Scaled-Down Full Copy', cost: 3, rto: 1 },
]

function B_T21({ step }: { step: number }) {
  const held = useHeld()
  const t = useLap(step >= 1, 5200, 0.99)
  const mx = 140 + (596 - 140) * t
  return (
    <Frame w={626} h={366}>
      <Lines w={626} h={366}>
        <SvgArrow x1={130} y1={142} x2={616} y2={142} color={colors.brand} width={3} head={12} />
        {!held && step >= 1 && t < 0.99 && (
          <g opacity={Math.min(1, Math.min(t, 1 - t) / 0.08)}>
            <circle cx={mx} cy={142} r={14} fill={colors.accent} opacity={0.22} />
            <circle cx={mx} cy={142} r={8} fill={colors.accent} stroke="#FFFFFF" strokeWidth={2} />
          </g>
        )}
      </Lines>
      <At x={60} y={142}>
        <span style={{ display: 'block', width: 110, textAlign: 'center', ...heading(14, colors.brandDark, 700) }}>Cost Versus Speed</span>
      </At>
      <At x={60} y={214}>
        <span style={{ ...flex(6), ...heading(15) }}>
          <Icon name="Wallet" size={16} /> Standby Cost
        </span>
      </At>
      <At x={60} y={270}>
        <span style={{ ...flex(6), ...heading(15) }}>
          <Icon name="Hourglass" size={16} /> RTO
        </span>
      </At>
      {T21_ST.map((s, i) => (
        <Show key={s.name} on={step >= i + 1}>
          <At x={T21_X[i]} y={26}>
            <Tag tone={step === i + 1 ? 'solid' : 'lift'}>{s.name}</Tag>
          </At>
          <At x={T21_X[i]} y={86}>
            <span className={held ? undefined : 's8-bob'} style={{ display: 'grid', animationDelay: `${i * 0.7}s` }}>
              <Mark src={s.mark} size={58} ring={step === i + 1 ? colors.brand : undefined} />
            </span>
          </At>
          <At x={T21_X[i]} y={142}>
            <span style={{ display: 'block', width: 16, height: 16, borderRadius: 16, background: colors.white, boxShadow: `inset 0 0 0 4px ${colors.brand}` }} />
          </At>
          <At x={T21_X[i]} y={214}>
            <span className={held ? undefined : 's8-pop'} style={{ display: 'grid', animationDelay: `${i * 0.6}s` }}>
              <Coins n={s.cost} />
            </span>
          </At>
          <At x={T21_X[i]} y={270}>
            <span style={{ ...flex(2), color: colors.accentDark }}>
              {Array.from({ length: s.rto }, (_, k) => (
                <span key={k} className={held ? undefined : 's8-flip'} style={{ display: 'grid', animationDelay: `${k * 0.3 + i * 0.5}s` }}>
                  <Icon name="Hourglass" size={20} />
                </span>
              ))}
            </span>
          </At>
          <At x={T21_X[i]} y={330}>
            <span style={{ display: 'block', width: 150, textAlign: 'center', ...heading(14, colors.ink, 700) }}>{s.line}</span>
          </At>
        </Show>
      ))}
      <Show on={step >= 4}>
        <Lines w={626} h={366}>
          <SvgArrow x1={284} y1={190} x2={470} y2={190} color={colors.accent} width={2} head={8} />
          <SvgArrow x1={284} y1={294} x2={470} y2={294} color={colors.success} width={2} head={8} />
          <line x1={284} y1={190} x2={460} y2={190} stroke={colors.accent} strokeWidth={4} strokeDasharray="10 12" className="s8-dash" opacity={0.55} />
          <line x1={284} y1={294} x2={460} y2={294} stroke={colors.success} strokeWidth={4} strokeDasharray="10 12" className="s8-dash" opacity={0.55} />
        </Lines>
        <At x={377} y={190}>
          <Tag tone="warn" size={14}>
            Higher Standby Cost
          </Tag>
        </At>
        <At x={377} y={294}>
          <Tag tone="good" size={14}>
            Lower RTO
          </Tag>
        </At>
      </Show>
    </Frame>
  )
}

/* ───────────────────────── T25 · the table with the targets drawn across it ───────────────────────── */

/* 2026-11-10 (user): all four columns equal in width */
const T25_COLS = [1, 1, 1, 1]
const T25_HEAD = ['Pattern', 'Typical RPO', 'Typical RTO', 'Meets 5-Min/10-Min Target']
const T25_ROWS: { icon: string; cells: string[]; rpo: boolean; rto: boolean; meets: boolean }[] = [
  { icon: mBackup, cells: ['Backup-restore', 'Hours (backup interval)', 'Hours', 'No'], rpo: false, rto: false, meets: false },
  { icon: mRds, cells: ['Pilot light', 'Seconds to minutes (replica lag)', '10-20 minutes', 'No (RTO too long)'], rpo: true, rto: false, meets: false },
  { icon: mAsg, cells: ['Warm standby', 'Seconds to minutes', 'Under 10 minutes', 'Yes'], rpo: true, rto: true, meets: true },
]

function B_TargetTable({ id, kicker, title, lead, note, lesson }: { id: string; kicker: string; title: string; lead: string; note: string; lesson: string }) {
  const s = useBuild(6)
  const grid = T25_COLS.map((w) => `${w}fr`).join(' ')
  const band = (c: number) => c === 1 || c === 2
  return (
    <Card id={id} kicker={kicker} title={title} lead={<Rich text={lead} />} lesson={lesson}>
      <div style={{ width: BOX_W, ...flex(14, 'column', { alignItems: 'stretch' }) }}>
        <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', background: 'radial-gradient(120% 90% at 10% 0%, #FFFFFF 0%, #FFFFFF 52%, #F6F9FE 100%)', boxShadow: `inset 0 0 0 1px ${colors.line}, 0 10px 28px -16px ${colors.brand}66` }}>
          <div style={{ display: 'grid', gridTemplateColumns: grid, alignItems: 'stretch', background: `linear-gradient(135deg, ${colors.brand}0a 0%, ${colors.brand}14 100%)`, boxShadow: `inset 0 -1px 0 ${colors.brand}29` }}>
            {T25_HEAD.map((h, c) => (
              <div key={h} style={{ padding: '12px 12px', ...flex(6), flexWrap: 'nowrap', whiteSpace: 'nowrap', minWidth: 0 }}>
                <span style={heading(17, colors.brand)}>{h}</span>
                {band(c) && (
                  <span style={{ opacity: s >= 1 ? 1 : 0, transition: `opacity 420ms ${EASE}` }}>
                    <Label strong tone="lift">
                      {c === 1 ? 'Target: 5 Minutes' : 'Target: 10 Minutes'}
                    </Label>
                  </span>
                )}
              </div>
            ))}
          </div>
          {T25_ROWS.map((r, i) => {
            const on = s >= i + 2
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: grid, alignItems: 'stretch', borderTop: `1px solid ${colors.line}`, opacity: on ? 1 : 0, transform: on ? 'none' : 'translateX(-14px)', transition: `opacity 360ms ${EASE}, transform 360ms ${EASE}` }}>
                {r.cells.map((cell, c) => (
                  <div key={c} style={{ padding: '12px 16px', ...flex(10) }}>
                    {c === 0 && <Mark src={r.icon} size={36} />}
                    {c === 1 && <Mark2 ok={r.rpo} size={22} />}
                    {c === 2 && <Mark2 ok={r.rto} size={22} />}
                    {c === 3 && <Mark2 ok={r.meets} size={22} />}
                    <span style={heading(17, colors.ink, 700)}>{cell}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
        <div style={{ opacity: s >= 5 ? 1 : 0, transition: `opacity 420ms ${EASE}` }}>
          <NoteBox tone={colors.brand}>
            <span style={flex(12, 'row', { alignItems: 'flex-start' })}>
              <span style={{ color: colors.brand, display: 'grid', marginTop: 2 }}>
                <Icon name="CircleCheck" size={20} />
              </span>
              <span>
                <Rich text={note} />
              </span>
            </span>
          </NoteBox>
        </div>
      </div>
    </Card>
  )
}

/* ───────────────────────── T09 · the replication table, with motion (user, 2026-11-10) ───────────────────────── */

type T09Table = { size?: number; headIcon?: number; rowIcon?: number; columns: { label: string; icon?: string; weight?: number }[]; rows: { icon?: string; cells: string[] }[] }
/** the engine's own table (same component, same data, same look), wrapped so the session CSS can animate its icons and
    sweep a soft band across each row (`.s8-tbl` in k.tsx) */
function B_T09Table({ id, kicker, title, lead, table, lesson }: { id: string; kicker: string; title: string; lead: string; table: T09Table; lesson: string }) {
  const t = table
  return (
    <Card id={id} kicker={kicker} title={title} lead={<Rich text={lead} />} lesson={lesson}>
      <div style={{ width: BOX_W }}>
        <VisualTable
          className="s8-tbl"
          size={t.size ?? 16}
          headIcon={t.headIcon}
          rowIcon={t.rowIcon}
          columns={t.columns.map((c) => ({ label: c.label, weight: c.weight, icon: c.icon ? <Icon name={c.icon} size={t.headIcon ?? 16} /> : undefined }))}
          rows={t.rows.map((rw) => ({ icon: rw.icon ? <Icon name={rw.icon} size={t.rowIcon ?? 18} /> : undefined, cells: rw.cells.map((c, i) => <Rich key={i} text={c} />) }))}
        />
      </div>
    </Card>
  )
}

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  B_Tiers: (p) => <B_Tiers step={p.step as number} mode={(p.mode as 'landscape' | 'tradeoff') ?? 'landscape'} />,
  B_T12: (p) => <B_T12 step={p.step as number} />,
  B_T16: (p) => <B_T16 step={p.step as number} />,
  B_T17: (p) => <B_T17 step={p.step as number} />,
  B_T19: (p) => <B_T19 step={p.step as number} />,
  B_T20: (p) => <B_T20 step={p.step as number} />,
  B_T21: (p) => <B_T21 step={p.step as number} />,
}
export const slides: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  B_T09Table: (p) => <B_T09Table {...(p as Parameters<typeof B_T09Table>[0])} />,
  B_TargetTable: (p) => <B_TargetTable {...(p as { id: string; kicker: string; title: string; lead: string; note: string; lesson: string })} />,
}
export const css = ''
