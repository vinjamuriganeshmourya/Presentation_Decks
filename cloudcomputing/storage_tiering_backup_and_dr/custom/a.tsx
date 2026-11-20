import type { ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { Label } from '@/decks/figures/scene'
import { Icon } from '@/engine/icon'
import { At, EASE, Frame, Glyph, Lines, Mark, Mark2, Panel, Sheen, Show, SvgArrow, Tag, Zone, flex, heading, sm, useHeld, useLap } from './k'
import mObject from '../images/aws-s3-object.svg'
import mS3 from '../images/aws-s3.svg'
import mEbs from '../images/aws-ebs.svg'
import mRds from '../images/aws-rds.svg'
import mBucket from '../images/aws-s3-bucket.svg'
import mRegion from '../images/aws-region.svg'
import dataStore from '../images/data-storage-3d.png'
import dataRep from '../images/data-replication-3d.png'

/*
 * Builder A · Storage Tiering, Backup & DR, sections 1 and 2: the figures the diagram renderer cannot draw.
 *   A_T01   the vault and the clock, and the two scenarios that separate them (TR 1)
 *   A_T02   one object split into fragments across three AZs, checksum ticks, eleven nines (TR 2, left half)
 *   A_T02B  a year bar with a small red downtime slice, the SLA and its credits (TR 2, right half)
 *   A_T05   the SLA pages and a mock of the S3 Properties tab, the Storage Class field circled (TR 5)
 *   A_T07   synchronous Multi-AZ pair vs asynchronous cross-region pair, each with its order of events (TR 7)
 *   A_T08   the timeline: a write at time zero, a strong copy at once, an eventual copy later, the lag (TR 8)
 * Every other section 1-2 figure is a `diagram` in deck.json.
 */

/* ───────────────────────── T01 · the vault and the clock ───────────────────────── */

/** a bank vault: a squat body, a round door, a wheel that turns slowly (physical, rule 59) */
function VaultArt({ size = 92 }: { size?: number }) {
  const held = useHeld()
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden style={{ overflow: 'visible', filter: 'drop-shadow(0 8px 8px rgba(16,32,58,0.18))' }}>
      <defs>
        <linearGradient id="s8-vault" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5B86FF" />
          <stop offset="1" stopColor={colors.brandDark} />
        </linearGradient>
        <radialGradient id="s8-door" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#D5E1FA" />
        </radialGradient>
      </defs>
      <rect x="8" y="10" width="84" height="78" rx="16" fill="url(#s8-vault)" />
      <rect x="14" y="88" width="14" height="7" rx="3" fill={colors.brandDeep} />
      <rect x="72" y="88" width="14" height="7" rx="3" fill={colors.brandDeep} />
      <circle cx="50" cy="49" r="29" fill="url(#s8-door)" stroke="#B9CBF2" strokeWidth="2" />
      <g className={held ? undefined : 's8-spin-slow'} style={{ transformOrigin: '50px 49px' }}>
        {[0, 60, 120].map((a) => (
          <line key={a} x1="50" y1="31" x2="50" y2="67" stroke={colors.brand} strokeWidth="4.5" strokeLinecap="round" transform={`rotate(${a} 50 49)`} />
        ))}
        <circle cx="50" cy="49" r="7" fill={colors.brand} />
      </g>
      <rect x="84" y="40" width="6" height="18" rx="3" fill="#FFFFFF" opacity="0.65" />
    </svg>
  )
}

/** a wall clock whose hands turn continuously */
function ClockArt({ size = 92 }: { size?: number }) {
  const held = useHeld()
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden style={{ overflow: 'visible', filter: 'drop-shadow(0 8px 8px rgba(16,32,58,0.18))' }}>
      <circle cx="50" cy="50" r="44" fill={colors.brand} />
      <circle cx="50" cy="50" r="36" fill="#FFFFFF" />
      {Array.from({ length: 12 }, (_, i) => (
        <line key={i} x1="50" y1="17" x2="50" y2={i % 3 ? 21 : 24} stroke={colors.brandDeep} strokeWidth={i % 3 ? 2 : 3} strokeLinecap="round" transform={`rotate(${i * 30} 50 50)`} />
      ))}
      <g className={held ? undefined : 's8-spin-hour'} style={{ transformOrigin: '50px 50px' }}>
        <line x1="50" y1="50" x2="50" y2="31" stroke={colors.brandDeep} strokeWidth="4.5" strokeLinecap="round" transform="rotate(300 50 50)" />
      </g>
      <g className={held ? undefined : 's8-spin-min'} style={{ transformOrigin: '50px 50px' }}>
        <line x1="50" y1="50" x2="50" y2="22" stroke={colors.brand} strokeWidth="3" strokeLinecap="round" transform="rotate(60 50 50)" />
      </g>
      <circle cx="50" cy="50" r="4" fill={colors.accent} />
    </svg>
  )
}

function Head({ x, on, active, art, title, sub }: { x: number; on: boolean; active: boolean; art: ReactNode; title: string; sub: string }) {
  return (
    <Show on={on}>
      <Panel active={active} style={{ left: x, top: 0, width: 250, height: 160 }}>
        <At x={125} y={50}>
          {art}
        </At>
        <At x={125} y={110}>
          <Tag tone="solid">{title}</Tag>
        </At>
        <At x={125} y={140}>
          <Tag>{sub}</Tag>
        </At>
      </Panel>
    </Show>
  )
}

function Scenario({ y, on, active, caption, left, right }: { y: number; on: boolean; active: boolean; caption: string; left: [boolean, string]; right: [boolean, string] }) {
  return (
    <Show on={on}>
      <div style={{ position: 'absolute', left: 0, top: y, width: 536, height: 68, borderRadius: 14, background: active ? `${colors.brand}10` : 'transparent', boxShadow: active ? `inset 0 0 0 1.5px ${colors.brand}55` : undefined, transition: `all 420ms ${EASE}` }} />
      <At x={268} y={y}>
        <Tag tone="lift" icon="CircleHelp">
          {caption}
        </Tag>
      </At>
      {[left, right].map(([ok, text], i) => (
        <At key={i} x={i ? 411 : 145} y={y + 40}>
          <span style={flex(8)}>
            <Mark2 ok={ok} pulse delay={i * 0.9} />
            <Tag tone={ok ? 'good' : 'bad'}>{text}</Tag>
          </span>
        </At>
      ))}
    </Show>
  )
}

function A_T01({ step }: { step: number }) {
  return (
    <Frame w={536} h={336}>
      <Head x={10} on={step >= 1} active={step === 1} art={<VaultArt size={76} />} title="Durability" sub="Data Survives" />
      <Head x={276} on={step >= 2} active={step === 2} art={<ClockArt size={76} />} title="Availability" sub="Service Responds Now" />
      <Scenario y={186} on={step >= 3} active={step === 3} caption="During Maintenance Or An Outage" left={[true, 'Perfectly Durable']} right={[false, 'Briefly Unreachable']} />
      <Scenario y={266} on={step >= 4} active={step === 4} caption="If Durability Safeguards Fail" left={[false, 'Data Lost Permanently']} right={[true, 'Highly Available']} />
    </Frame>
  )
}

/* ───────────────────────── T02 · fragments across three AZs ───────────────────────── */

const T2_ZONES = [10, 183, 356]
const T2_ZW = 160

function Fragment({ k, size = 30 }: { k: number; size?: number }) {
  const tint = ['#2D63FB', '#5B86FF', '#0146C7', '#86A6FF', '#2D63FB', '#5B86FF'][k % 6]
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 8, background: `linear-gradient(160deg, ${tint} 0%, ${colors.brandDark} 100%)`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 8px -4px rgba(16,32,58,0.45)' }}>
      <span style={{ width: size * 0.5, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.75)' }} />
    </span>
  )
}

/* 2026-11-09 (user, slide 8): one point per press, in the order of the text: 1 checksums on the object, 2 erasure
   coding spreads the fragments to three AZs, 3 eleven nines, 4 a loss probability (was two points per press).
   2026-11-10 (user, slide 9): fewer words, more picture. The checksum is a shield on the object and a tick on every
   fragment (the word once, not four times); the eleven nines are the number; the loss probability is a field of
   objects with one missing, so "not zero" is seen rather than read. */
const T2_TINT = ['#2D63FB', '#0146C7', '#86A6FF']

function A_T02({ step }: { step: number }) {
  const held = useHeld()
  const on1 = step >= 2
  const t = useLap(on1, 2600, 0.7)
  const from: [number, number] = [263, 72]
  const to = T2_ZONES.map((x) => [x + T2_ZW / 2, 122] as [number, number])
  const fade = { transition: `opacity 420ms ${EASE}` }
  return (
    <Frame w={526} h={346}>
      <Lines w={526} h={346}>
        {to.map(([x, y], i) => (
          <g key={i} opacity={on1 ? 1 : 0} style={fade}>
            <SvgArrow x1={from[0]} y1={from[1]} x2={x} y2={y} color={colors.brand} width={2.2} />
            {on1 && (
              <rect x={from[0] + (x - from[0]) * sm(t) - 7} y={from[1] + (y - from[1]) * sm(t) - 7} width={14} height={14} rx={4} fill={T2_TINT[i]} stroke="#FFFFFF" strokeWidth={1.5} opacity={t < 0.92 ? 1 : (1 - t) / 0.08} />
            )}
          </g>
        ))}
      </Lines>
      {/* the object, a checksum shield on its corner */}
      <At x={263} y={38}>
        <span style={{ position: 'relative', display: 'grid' }}>
          <Mark src={mObject} size={60} ring={step === 1 ? colors.success : undefined} />
          <span style={{ position: 'absolute', right: -14, top: -12, opacity: step >= 1 ? 1 : 0, ...fade }}>
            <Glyph icon="ShieldCheck" size={30} tone={colors.success} cls={held ? undefined : 's8-pulse'} />
          </span>
        </span>
      </At>
      <Show on={step >= 1}>
        <At x={140} y={38}>
          <Tag tone="good" icon="ScanSearch">
            Checksum
          </Tag>
        </At>
      </Show>
      <Show on={on1}>
        <At x={394} y={38}>
          <Tag tone="brand" icon="Split">
            Erasure Coding
          </Tag>
        </At>
        {T2_ZONES.map((x, i) => (
          <Zone key={i} x={x} y={122} w={T2_ZW} h={112} label={`AZ ${i + 1}`} img={mRegion}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 50, ...flex(14, 'row', { justifyContent: 'center' }) }}>
              {[0, 1].map((k) => (
                <span key={k} style={{ position: 'relative', display: 'grid' }}>
                  <Fragment k={i * 2 + k} size={38} />
                  <span style={{ position: 'absolute', right: -8, bottom: -8 }}>
                    <Mark2 ok size={18} />
                  </span>
                </span>
              ))}
            </div>
          </Zone>
        ))}
      </Show>
      {/* eleven nines: the number itself */}
      <Show on={step >= 3}>
        <Panel active={step === 3} style={{ left: 10, top: 252, width: 250, height: 90 }}>
          <div style={{ position: 'absolute', inset: 0, ...flex(4, 'column', { justifyContent: 'center' }) }}>
            <span style={heading(28, colors.brandDark, 800)}>99.999999999%</span>
            <span style={{ ...flex(6), ...heading(14, colors.muted, 700) }}>
              <Icon name="Vault" size={15} /> Eleven Nines · Yearly
            </span>
          </div>
        </Panel>
      </Show>
      {/* a loss probability: a field of objects, one of them missing */}
      <Show on={step >= 4}>
        <Panel active={step === 4} style={{ left: 276, top: 252, width: 240, height: 90 }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 14, display: 'grid', gridTemplateColumns: 'repeat(14, 10px)', gap: 4, justifyContent: 'center' }}>
            {Array.from({ length: 42 }, (_, k) => {
              const gone = k === 31
              return <span key={k} className={gone && !held ? 's8-blink' : undefined} style={{ width: 10, height: 10, borderRadius: 3, background: gone ? 'transparent' : k % 5 ? `${colors.brand}cc` : `${colors.brand}88`, boxShadow: gone ? `inset 0 0 0 1.5px ${colors.danger}` : undefined }} />
            })}
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 12, ...flex(6, 'row', { justifyContent: 'center' }), ...heading(14, colors.accentDark, 700) }}>
            <Icon name="Percent" size={15} /> Probability, Not Zero Loss
          </div>
        </Panel>
      </Show>
    </Frame>
  )
}

/* ───────────────────────── T02-B · a year bar with a small downtime slice ───────────────────────── */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** an icon on its tile with a small status mark on its corner, a short caption under it */
function Step2({ icon, tone, caption, ok, dim = false }: { icon: string; tone: string; caption: string; ok?: boolean; dim?: boolean }) {
  return (
    <span style={flex(8, 'column')}>
      <span style={{ position: 'relative', display: 'grid', opacity: dim ? 0.6 : 1 }}>
        <Glyph icon={icon} size={54} tone={tone} />
        {ok !== undefined && (
          <span style={{ position: 'absolute', right: -8, bottom: -8 }}>
            <Mark2 ok={ok} size={22} />
          </span>
        )}
      </span>
      <span style={{ ...heading(14, dim ? colors.muted : colors.ink, 700), textDecoration: dim ? 'line-through' : undefined }}>{caption}</span>
    </span>
  )
}

/* 2026-11-10 (user, slide 10): fewer words, more picture. Twelve month tiles, each ticked (uptime promised month by
   month); the SLA as a flow of icons: the contract, a missed month, service credits ticked, a refund crossed; the
   two numbers side by side, each with its icon; the downtime the red slice on the year. */
function A_T02B({ step }: { step: number }) {
  const held = useHeld()
  /* 2026-11-10 (user: dynamic animations): a cursor walks the twelve months; each lights as it passes */
  const ty = useLap(step >= 1, 6000, 0.99)
  const cur = held || step < 1 ? -1 : Math.min(11, Math.floor(ty * 12))
  const W = 540
  const x0 = 13
  const mw = W / 12
  const slice = x0 + mw * 9 + mw * 0.55
  return (
    <Frame w={566} h={376}>
      {/* the year: twelve months, each a promise of monthly uptime, ticked */}
      {MONTHS.map((m, i) => (
        <div key={m}>
          <div style={{ position: 'absolute', left: x0 + i * mw + 2, top: 6, width: mw - 4, height: 50, borderRadius: 8, display: 'grid', placeItems: 'center', background: step >= 1 ? (cur === i ? 'linear-gradient(180deg, #D3F5E1 0%, #9FE3BC 100%)' : 'linear-gradient(180deg, #E9F8EF 0%, #C9EFD8 100%)') : colors.surface, boxShadow: `inset 0 0 0 ${cur === i ? 2.5 : 1.5}px ${step >= 1 ? (cur === i ? colors.success : '#8FD9AE') : colors.line}`, transform: cur === i ? 'translateY(-4px) scale(1.06)' : 'none', transition: `all 260ms ${EASE}` }}>
            <span style={{ opacity: step >= 1 ? 1 : 0, color: colors.success, display: 'grid', transition: `opacity 420ms ${EASE} ${i * 40}ms` }}>
              <Icon name="CircleCheck" size={18} />
            </span>
          </div>
          <span style={{ position: 'absolute', left: x0 + i * mw, width: mw, top: 60, textAlign: 'center', ...heading(14, colors.muted, 600) }}>{m}</span>
        </div>
      ))}
      {/* the downtime: a thin red slice, its yearly total */}
      <Show on={step >= 2}>
        <div style={{ position: 'absolute', left: slice - 3, top: 2, width: 6, height: 58, borderRadius: 3, background: colors.danger, boxShadow: `0 0 0 3px ${colors.danger}33` }} className={held ? undefined : 's8-blink'} />
        <svg width={566} height={376} style={{ position: 'absolute', left: 0, top: 0 }} aria-hidden>
          <line x1={slice} y1={80} x2={slice} y2={94} stroke={colors.danger} strokeWidth={2} />
        </svg>
        <At x={Math.min(slice, 460)} y={108}>
          <span className={held ? undefined : 's8-pop'} style={{ display: 'grid' }}>
            <Tag tone="bad" icon="Clock">
              About 8.76 Hours Of Downtime A Year
            </Tag>
          </span>
        </At>
      </Show>
      {/* the SLA: the contract, a missed month, credits yes, refund no */}
      <Show on={step >= 1}>
        <Panel active={step === 1} style={{ left: 13, top: 134, width: 540, height: 116 }}>
          <div style={{ position: 'absolute', inset: 0, ...flex(0, 'row', { justifyContent: 'space-evenly' }) }}>
            <span className={held ? undefined : 's8-bob'} style={{ display: 'grid' }}>
              <Step2 icon="FileText" tone={colors.brand} caption="SLA" />
            </span>
            <span className={held ? undefined : 's8-nudge'} style={{ color: colors.brand, display: 'grid', marginBottom: 24 }}>
              <Icon name="ArrowRight" size={22} />
            </span>
            <span className={held ? undefined : 's8-shake'} style={{ display: 'grid' }}>
              <Step2 icon="CalendarX" tone={colors.danger} caption="Missed" />
            </span>
            <span className={held ? undefined : 's8-nudge'} style={{ color: colors.brand, display: 'grid', marginBottom: 24, animationDelay: '0.4s' }}>
              <Icon name="ArrowRight" size={22} />
            </span>
            <span className={held ? undefined : 's8-pop'} style={{ display: 'grid', animationDelay: '0.6s' }}>
              <Step2 icon="Coins" tone={colors.accentDark} caption="Service Credits" ok />
            </span>
            <span className={held ? undefined : 's8-shake'} style={{ display: 'grid', animationDelay: '1.1s' }}>
              <Step2 icon="Banknote" tone={colors.muted} caption="Refund" ok={false} dim />
            </span>
          </div>
        </Panel>
      </Show>
      {/* the two numbers */}
      <Show on={step >= 2}>
        <Panel active={step === 2} style={{ left: 13, top: 266, width: 540, height: 104 }}>
          <div style={{ position: 'absolute', inset: 0, ...flex(0, 'row', { justifyContent: 'space-evenly' }) }}>
            {[
              ['Ruler', 'Designed For', '99.99%'],
              ['FileText', 'SLA Promises', '99.9%'],
            ].map(([icon, k, v], i) => (
              <span key={k} style={flex(12)}>
                <span className={held ? undefined : 's8-pulse'} style={{ display: 'grid', animationDelay: `${i * 1.2}s` }}>
                  <Glyph icon={icon} size={50} tone={i ? colors.accentDark : colors.brand} />
                </span>
                <span style={flex(0, 'column', { alignItems: 'flex-start' })}>
                  <span style={heading(28, colors.brandDark, 800)}>{v}</span>
                  <span style={heading(14, colors.muted, 700)}>{k}</span>
                </span>
              </span>
            ))}
          </div>
        </Panel>
      </Show>
    </Frame>
  )
}

/* ───────────────────────── T05 · the SLA pages and the Properties tab ───────────────────────── */

function SlaCard({ y, mark, name, on, active }: { y: number; mark: string; name: string; on: boolean; active: boolean }) {
  return (
    <Show on={on}>
      <Panel active={active} style={{ left: 0, top: y, width: 236, height: 148, overflow: 'hidden' }}>
        <Sheen delay={y > 100 ? 2.1 : 0} />
        <div style={{ position: 'absolute', left: 14, top: 14, ...flex(10) }}>
          <Mark src={mark} size={40} />
          <span style={heading(15)}>
            {name}
            <br />
            <span style={heading(14, colors.muted, 600)}>Service Level Agreement</span>
          </span>
        </div>
        <div style={{ position: 'absolute', left: 14, top: 76, ...flex(8, 'column', { alignItems: 'flex-start' }) }}>
          <Label tone="lift" icon={<Icon name="CalendarClock" size={14} />}>
            Uptime Commitment
          </Label>
          <Label tone="lift" icon={<Icon name="Percent" size={14} />}>
            Credit Percentages
          </Label>
        </div>
      </Panel>
    </Show>
  )
}

function Field({ k, v, ring }: { k: string; v: string; ring?: boolean }) {
  const held = useHeld()
  return (
    <div style={{ position: 'relative', padding: '8px 12px', borderRadius: 10, background: colors.white, boxShadow: `inset 0 0 0 1px ${colors.line}` }}>
      <div style={heading(14, colors.muted, 600)}>{k}</div>
      <div style={heading(16, colors.ink, 600)}>{v}</div>
      {ring !== undefined && (
        <span
          className={ring && !held ? 's8-pulse' : undefined}
          style={{ position: 'absolute', inset: -5, borderRadius: 14, boxShadow: `0 0 0 3px ${colors.accent}`, opacity: ring ? 1 : 0, transition: `opacity 420ms ${EASE}` }}
        />
      )}
    </div>
  )
}

function A_T05({ step }: { step: number }) {
  return (
    <Frame w={616} h={356}>
      <SlaCard y={4} mark={mS3} name="Amazon S3" on={step >= 1} active={step === 1} />
      <SlaCard y={172} mark={mEbs} name="Amazon EBS" on={step >= 2} active={step === 2} />
      {/* a mock of the console's object page, Properties tab (TR 5 Visual Guidance: "screenshot-style mock") */}
      <Panel style={{ left: 256, top: 4, width: 360, height: 300, overflow: 'hidden' }}>
        <div style={{ height: 44, background: colors.brandDeep, ...flex(10, 'row', { padding: '0 14px' }) }}>
          <Mark src={mS3} size={28} />
          <span style={heading(14, colors.white, 600)}>Amazon S3 · Object</span>
        </div>
        <div style={{ padding: '12px 14px 0', ...flex(8) }}>
          {['Properties', 'Permissions', 'Versions'].map((t, i) => (
            <span key={t} style={{ padding: '4px 12px', borderRadius: 999, ...heading(14, i ? colors.muted : colors.brandDark, 600), background: i ? 'transparent' : colors.surface2, boxShadow: i ? undefined : `inset 0 0 0 1.5px ${colors.brand}` }}>
              {t}
            </span>
          ))}
        </div>
        <div style={{ padding: '12px 14px', ...flex(8, 'column', { alignItems: 'stretch' }) }}>
          <Field k="Key" v="monthly-report.pdf" />
          <Field k="Type" v="PDF" />
          <Field k="Storage Class" v="Standard" ring={step >= 3} />
        </div>
      </Panel>
      <Show on={step >= 3}>
        <At x={436} y={334}>
          <Tag tone="brand" icon="SearchCheck">
            Check The Written Guarantee First
          </Tag>
        </At>
      </Show>
    </Frame>
  )
}

/* ───────────────────────── T07 · sync vs async, in the order things happen ───────────────────────── */

/**
 * The sphere rides the ARROWS themselves (user, 2026-11-07, slide 15: "the sphere doesn't travel correctly along
 * the arrow path"): each segment is one drawn arrow, from its tail to just short of its head, in the order the
 * events happen; it fades out at a head and in at the next tail, so it never cuts across a node or between lines.
 * `w` is the segment's share of the lap (the long cross-region copy takes longer).
 */
type Seg = { a: [number, number]; b: [number, number]; c: string; w?: number }
function ride(segs: Seg[], t: number): { x: number; y: number; c: string; o: number } {
  const tot = segs.reduce((q, s) => q + (s.w ?? 1), 0)
  let u = Math.min(0.9999, Math.max(0, t)) * tot
  let i = 0
  while (i < segs.length - 1 && u > (segs[i].w ?? 1)) u -= segs[i++].w ?? 1
  const s = segs[i]
  const f = u / (s.w ?? 1)
  const e = sm(f)
  return { x: s.a[0] + (s.b[0] - s.a[0]) * e, y: s.a[1] + (s.b[1] - s.a[1]) * e, c: s.c, o: Math.min(1, Math.min(f, 1 - f) / 0.1) }
}

function Order({ n }: { n: number }) {
  return <span style={{ display: 'grid', placeItems: 'center', width: 22, height: 22, borderRadius: 22, background: colors.brand, color: colors.white, ...heading(13, colors.white, 800) }}>{n}</span>
}

function A_T07({ step }: { step: number }) {
  const sync = step >= 1
  const async = step >= 3
  const ta = useLap(sync, 3600, 0.99)
  const tb = useLap(async, 4400, 0.99)
  /* row A, on its four arrows: 1 write, 2 copy, then the confirmation back along both green arrows */
  const pa = ride(
    [
      { a: [92, 98], b: [209, 98], c: colors.brand },
      { a: [282, 98], b: [439, 98], c: colors.brand },
      { a: [448, 122], b: [291, 122], c: colors.success },
      { a: [218, 122], b: [101, 122], c: colors.success },
    ],
    ta,
  )
  /* row B, on its three arrows: 1 write, 2 confirm at once, THEN 3 the copy rides to the other region */
  const pb = ride(
    [
      { a: [92, 292], b: [169, 292], c: colors.brand },
      { a: [178, 316], b: [101, 316], c: colors.success },
      { a: [246, 304], b: [457, 304], c: colors.brand, w: 2 },
    ],
    tb,
  )
  return (
    <Frame w={616} h={396}>
      {/* ── synchronous: one region, the AZ named on each copy ── */}
      <Show on={sync}>
        <Zone x={110} y={22} w={500} h={170} label={step >= 2 ? 'Amazon RDS Multi-AZ' : 'One Region'} img={step >= 2 ? mRds : mRegion} />
        <Lines w={616} h={396}>
          <SvgArrow x1={92} y1={98} x2={218} y2={98} />
          <SvgArrow x1={282} y1={98} x2={448} y2={98} />
          <SvgArrow x1={448} y1={122} x2={282} y2={122} color={colors.success} />
          <SvgArrow x1={218} y1={122} x2={92} y2={122} color={colors.success} />
          {ta < 0.99 && <circle cx={pa.x} cy={pa.y} r={6.5} fill={pa.c} stroke="#FFFFFF" strokeWidth={2} opacity={pa.o} />}
        </Lines>
        <At x={46} y={110}>
          <span style={flex(4, 'column')}>
            <Glyph icon="AppWindow" size={50} />
            <Label strong>App</Label>
          </span>
        </At>
        <At x={250} y={128}>
          <span style={flex(4, 'column')}>
            <Mark src={mRds} size={56} />
            <Label strong>Primary In AZ 1</Label>
          </span>
        </At>
        <At x={480} y={128}>
          <span style={flex(4, 'column')}>
            <Mark src={mRds} size={56} />
            <Label strong>Standby Copy In AZ 2</Label>
          </span>
        </At>
        <At x={154} y={76}>
          <span style={flex(4)}><Order n={1} /><Label strong>Write</Label></span>
        </At>
        <At x={366} y={76}>
          <span style={flex(4)}><Order n={2} /><Label strong>Copy</Label></span>
        </At>
        <At x={146} y={146}>
          <span style={flex(4)}><Order n={3} /><Label strong tone="good">Confirm</Label></span>
        </At>
        <At x={540} y={44}>
          <Tag tone="solid">Synchronous</Tag>
        </At>
      </Show>
      {/* ── asynchronous: two regions ── */}
      <Show on={async}>
        <Zone x={110} y={226} w={192} h={162} label="Region A" img={mRegion} />
        <Zone x={410} y={226} w={200} h={162} label="Region B" img={mRegion} />
        <Lines w={616} h={396}>
          <SvgArrow x1={92} y1={292} x2={178} y2={292} />
          <SvgArrow x1={178} y1={316} x2={92} y2={316} color={colors.success} />
          <SvgArrow x1={246} y1={304} x2={466} y2={304} dashed color={colors.brand} />
          {tb < 0.99 && <circle cx={pb.x} cy={pb.y} r={6.5} fill={pb.c} stroke="#FFFFFF" strokeWidth={2} opacity={pb.o} />}
        </Lines>
        <At x={46} y={304}>
          <span style={flex(4, 'column')}>
            <Glyph icon="AppWindow" size={50} />
            <Label strong>App</Label>
          </span>
        </At>
        <At x={226} y={330}>
          <span style={flex(4, 'column')}>
            <Mark src={mBucket} size={56} />
            <Label strong>Source</Label>
          </span>
        </At>
        <At x={510} y={330}>
          <span style={flex(4, 'column')}>
            <Mark src={mBucket} size={56} />
            <Label strong>Replica</Label>
          </span>
        </At>
        <At x={150} y={274}>
          <span style={flex(4)}><Order n={1} /><Label strong>Write</Label></span>
        </At>
        <At x={150} y={346}>
          <span style={flex(4)}><Order n={2} /><Label strong tone="good">Confirm</Label></span>
        </At>
        <At x={356} y={282}>
          <span style={flex(4)}><Order n={3} /><Label strong>Copy</Label></span>
        </At>
        <At x={548} y={208}>
          <Tag tone="solid">Asynchronous</Tag>
        </At>
      </Show>
      <Show on={step >= 4}>
        <At x={356} y={340}>
          <Tag tone="warn" icon="Hourglass">
            Short Lag
          </Tag>
        </At>
        <At x={392} y={208}>
          <Tag tone="brand" icon={`img:${dataRep}`}>
            Amazon S3 CRR
          </Tag>
        </At>
      </Show>
    </Frame>
  )
}

/* ───────────────────────── T08 · strong and eventual on one timeline ───────────────────────── */

const TL = { x0: 130, x1: 626, tw: 250, te: 470 } as const

function Lane({ y, on, update, label, model, tone }: { y: number; on: boolean; update: number; label: string; model: string; tone: 'good' | 'warn' }) {
  return (
    <Show on={on}>
      <At x={70} y={y}>
        <span style={flex(6, 'column')}>
          <img src={dataStore} alt="" aria-hidden draggable={false} style={{ width: 46, height: 'auto', display: 'block' }} />
          <Label strong>{label}</Label>
        </span>
      </At>
      <div style={{ position: 'absolute', left: TL.x0, top: y - 16, width: update - TL.x0, height: 32, borderRadius: '10px 0 0 10px', background: colors.surface, boxShadow: `inset 0 0 0 1.5px ${colors.line}`, ...flex(0, 'row', { justifyContent: 'center' }) }}>
        <span style={heading(14, colors.muted, 600)}>Old Value</span>
      </div>
      <div style={{ position: 'absolute', left: update, top: y - 16, width: TL.x1 - update, height: 32, borderRadius: '0 10px 10px 0', background: `linear-gradient(90deg, ${colors.brand}30 0%, ${colors.brand}18 100%)`, boxShadow: `inset 0 0 0 1.5px ${colors.brand}66`, overflow: 'hidden', ...flex(0, 'row', { justifyContent: 'center' }) }}>
        <Sheen delay={y > 150 ? 1.6 : 0} />
        <span style={{ position: 'relative', ...heading(14, colors.brandDark, 700) }}>Latest Value</span>
      </div>
      <At x={TL.x1 - 2} y={y - 34} style={{ transform: 'translate(-100%, -50%)' }}>
        <Tag tone={tone}>{model}</Tag>
      </At>
    </Show>
  )
}

function A_T08({ step }: { step: number }) {
  const t = useLap(step >= 1, 5200, 0.98)
  const px = TL.x0 + (TL.x1 - TL.x0) * t
  return (
    <Frame w={636} h={356}>
      {/* the write at time zero */}
      <Show on={step >= 1}>
        <At x={TL.tw} y={30}>
          <span style={flex(6)}>
            <Glyph icon="PenLine" size={40} />
            <Label strong tone="brand">
              Write
            </Label>
          </span>
        </At>
        <Lines w={636} h={356}>
          <line x1={TL.tw} y1={50} x2={TL.tw} y2={262} stroke={colors.brand} strokeWidth={2} strokeDasharray="5 5" />
          <line x1={TL.x0} y1={262} x2={TL.x1} y2={262} stroke={colors.muted} strokeWidth={2} />
          <line x1={px} y1={64} x2={px} y2={262} stroke={colors.accent} strokeWidth={2} opacity={step >= 1 && t < 0.97 ? 0.9 : 0} />
        </Lines>
        <At x={TL.tw} y={284}>
          <Label strong>Time Zero</Label>
        </At>
      </Show>
      <Lane y={110} on={step >= 1} update={TL.tw} label="Copy 1" model="Strong Read" tone="good" />
      <Lane y={206} on={step >= 2} update={TL.te} label="Copy 2" model="Eventual Read" tone="warn" />
      <Show on={step >= 2}>
        <Lines w={636} h={356}>
          <line x1={TL.te} y1={226} x2={TL.te} y2={262} stroke={colors.warning} strokeWidth={2} strokeDasharray="5 5" />
          <SvgArrow x1={TL.tw + 4} y1={244} x2={TL.te - 4} y2={244} color={colors.warning} width={2} head={8} both />
        </Lines>
        <At x={(TL.tw + TL.te) / 2} y={244}>
          <Tag tone="warn" icon="Hourglass" size={14}>
            Replication Lag
          </Tag>
        </At>
        <At x={TL.te} y={284}>
          <Label strong>A Few Seconds Later</Label>
        </At>
      </Show>
      <Show on={step >= 3}>
        <At x={318} y={330}>
          <span style={flex(10)}>
            <Tag tone="plain" icon="Zap">
              Instant Freshness
            </Tag>
            <Icon name="ArrowLeftRight" size={20} />
            <Tag tone="brand" icon="Globe">
              Lower Latency And Wider Reach
            </Tag>
          </span>
        </At>
      </Show>
    </Frame>
  )
}

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  A_T01: (p) => <A_T01 step={p.step as number} />,
  A_T02: (p) => <A_T02 step={p.step as number} />,
  A_T02B: (p) => <A_T02B step={p.step as number} />,
  A_T05: (p) => <A_T05 step={p.step as number} />,
  A_T07: (p) => <A_T07 step={p.step as number} />,
  A_T08: (p) => <A_T08 step={p.step as number} />,
}
export const slides = {}
export const css = `
@keyframes s8-spin-a { to { transform: rotate(360deg) } }
.s8-spin-hour { animation: s8-spin-a 72s linear infinite; }
.s8-spin-min { animation: s8-spin-a 6s linear infinite; }
.cc-still .s8-spin-hour, .deck-thumb .s8-spin-hour, .cc-still .s8-spin-min, .deck-thumb .s8-spin-min { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .s8-spin-hour, .s8-spin-min { animation: none !important; } }
`
