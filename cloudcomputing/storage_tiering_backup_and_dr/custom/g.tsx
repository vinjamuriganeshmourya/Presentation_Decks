import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { Label } from '@/decks/figures/scene'
import { Icon } from '@/engine/icon'
import { At, Coins, EASE, Frame, Glyph, Lines, Mark, Mark2, Panel, Ring, Sheen, Show, SvgArrow, Tag, Zone, flex, heading, sm, useHeld, useLap } from './k'
import { figures as A } from './a'
import iClock from '@/decks/figures/net/icons/clock.png'
import iDb from '@/decks/figures/net/icons/database.png'
import iData from '@/decks/figures/net/icons/data-storage.png'
import iServer from '@/decks/figures/net/icons/server-stack.png'
import iShield from '@/decks/figures/net/icons/shield-closed.png'
import iTools from '@/decks/figures/net/icons/gear-wrench.png'
import iWarn from '@/decks/figures/net/icons/warning.png'
import iHour from '@/decks/figures/net/icons/hourglass.png'
import iFiles from '@/decks/figures/net/icons/files.png'
import iGlobe from '@/decks/figures/net/icons/globe-www.png'
import iNet from '@/decks/figures/net/icons/network.png'
import iMeter from '@/decks/figures/net/icons/meter.png'
import pUser from './ppl/userboy.png'
import pUserGirl from './ppl/usergirl.png'
import mS3 from '../images/aws-s3.svg'
import mEbs from '../images/aws-ebs.svg'
import mGlacier from '../images/aws-s3-glacier.svg'
import mStd from '../images/aws-s3-standard.svg'
import mIa from '../images/aws-s3-standard-ia.svg'
import mOz from '../images/aws-s3-one-zone-ia.svg'
import mGfr from '../images/aws-s3-glacier-flexible-retrieval.svg'
import mGda from '../images/aws-s3-glacier-deep-archive.svg'
import mSnap from '../images/aws-ebs-snapshot.svg'
import mVault from '../images/aws-aws-backup-backup-vault.svg'
import mBackup from '../images/aws-aws-backup.svg'
import mRestore from '../images/aws-aws-backup-backup-restore.svg'
import mRpo from '../images/aws-aws-backup-recovery-point-objective.svg'
import mRto from '../images/aws-aws-backup-recovery-time-objective.svg'
import mEc2 from '../images/aws-ec2.svg'
import mServer from '../images/custom-server.svg'
import mRds from '../images/aws-rds.svg'
import mRegion from '../images/aws-region.svg'

/*
 * Builder G · Storage Tiering, Backup & DR, review of 2026-11-09 (user: "most of the visuals are text-based rather
 * than actual visual demonstrations"; slides 6, 11, 15, 27, 32, 37, 38, 40, 41, 43). Each figure SHOWS the idea with
 * the real thing (official AWS marks on their white tile, the library's 3D renders, people) and quiet motion that
 * says what happens (a request travels, a hazard bounces off, a coin drops, a copy is lost); the only words are
 * short Title Case tags (rule 56). Every figure takes the slide's `step` and holds a readable final frame on
 * `?still`, in thumbnails and under reduced motion (useLap's `still` phase).
 *
 *   G_T01A / G_T01B   slide 6 split: the two guarantees; the two scenarios that separate them
 *   G_T05             slide 11: the SLA documents and the console's Storage Class field
 *   G_T07Big          slide 15's sync/async figure, moved to its own slide and enlarged
 *   G_T12A / G_T12B   slide 27 split: reading from Standard vs Standard-IA; One Zone-IA and the tier examples
 *   G_T16A / G_T16B   slide 32 split: an object ageing through the classes; the early-move penalty and the chain
 *   G_T19             slide 37 split: the four backup types (two per slide), what each cycle copies, what a restore needs
 *   G_T20             slide 38: RPO and RTO on one timeline, cost, the two kinds of data
 *   G_T21A            slide 40 split: what runs in the DR region under each pattern
 *   G_T22B            slide 41 split: why backup-restore takes hours, and what it costs meanwhile
 *   G_T24B            slide 43 split: warm standby against pilot light on RTO, RPO and running cost
 */

/* ───────────────────────── shared ───────────────────────── */

/** a 3D library render, standing on its own soft contact shadow */
function Img({ src, size, style, cls }: { src: string; size: number; style?: CSSProperties; cls?: string }) {
  return (
    <span className={cls} style={{ position: 'relative', display: 'grid', placeItems: 'center', width: size, height: size, ...style }}>
      <span aria-hidden style={{ position: 'absolute', left: '18%', right: '18%', bottom: -2, height: Math.max(6, size * 0.1), borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(16,32,58,0.22), rgba(16,32,58,0))' }} />
      <img src={src} alt="" aria-hidden draggable={false} style={{ position: 'relative', width: size, height: size, objectFit: 'contain', display: 'block' }} />
    </span>
  )
}

/** a moving dot (a request, a response, a copy): fades in and out at the ends of its run */
function Dot({ x, y, c = colors.brand, r = 7, o = 1 }: { x: number; y: number; c?: string; r?: number; o?: number }) {
  return <circle cx={x} cy={y} r={r} fill={c} stroke="#FFFFFF" strokeWidth={2} opacity={o} />
}
const fadeEnds = (t: number, k = 0.08) => Math.max(0, Math.min(1, Math.min(t, 1 - t) / k))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** a dashed outline standing for something that does not run (yet) */
function Ghost({ w, h, icon, size = 22, strong = false }: { w: number; h: number; icon: string; size?: number; /** darker and bolder (slide 45, 2026-11-09: icons not clearly visible) */ strong?: boolean }) {
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: w, height: h, borderRadius: Math.round(w * 0.27), border: `2px dashed ${strong ? `${colors.brandDark}88` : `${colors.muted}88`}`, color: strong ? colors.brandDark : colors.muted, background: strong ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.55)' }}>
      <Icon name={icon} size={size} stroke={strong ? 2.4 : undefined} />
    </span>
  )
}

/* ───────────────────────── slide 6 · the two guarantees ───────────────────────── */

const HAZ = [
  { icon: 'Zap', a: -150, c: colors.warning },
  { icon: 'Bug', a: -90, c: colors.danger },
  { icon: 'Flame', a: -30, c: colors.accentDark },
]

/** durability: hardware failure, corruption and disasters fly at the stored data and bounce off its shield, over and over */
function Durable({ on, active }: { on: boolean; active: boolean }) {
  const t = useLap(on, 2600, 0.42)
  const cx = 130
  const cy = 150
  return (
    <Show on={on}>
      <Panel active={active} style={{ left: 0, top: 0, width: 260, height: 330 }} />
      {HAZ.map((h, i) => {
        const ph = (t + i / 3) % 1
        const r = 116 - 52 * Math.sin(Math.PI * ph)
        const a = (h.a * Math.PI) / 180
        return (
          <At key={h.icon} x={cx + r * Math.cos(a)} y={cy + 14 + r * Math.sin(a) * 0.8} z={7}>
            <span style={{ display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: 34, background: colors.white, color: h.c, boxShadow: `0 6px 12px -6px rgba(16,32,58,0.35), inset 0 0 0 1.5px ${h.c}66` }}>
              <Icon name={h.icon} size={18} />
            </span>
          </At>
        )
      })}
      <At x={cx} y={cy + 6}>
        <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 132, height: 132, borderRadius: 132, background: `radial-gradient(circle at 40% 35%, ${colors.white} 0%, ${colors.surface2} 70%)`, boxShadow: `inset 0 0 0 3px ${colors.brand}55` }}>
          <Ring color={colors.brand} />
          <Img src={iData} size={86} />
          <span style={{ position: 'absolute', right: 2, bottom: 6 }}>
            <Img src={iShield} size={44} />
          </span>
        </span>
      </At>
      <At x={cx} y={262}>
        <Tag tone="solid" icon="Vault">
          Durability
        </Tag>
      </At>
      <At x={cx} y={298}>
        <Tag icon="CalendarRange">Data Survives Over Time</Tag>
      </At>
    </Show>
  )
}

/** availability: a request goes to the service and an answer comes straight back, now */
function Responds({ on, active }: { on: boolean; active: boolean }) {
  const t = useLap(on, 2200, 0.3)
  const x0 = 70
  const x1 = 196
  const y = 182
  const go = t < 0.5
  const k = go ? sm(t / 0.5) : sm((t - 0.5) / 0.5)
  return (
    <Show on={on}>
      <Panel active={active} style={{ left: 280, top: 0, width: 260, height: 330 }} />
      <div style={{ position: 'absolute', left: 280, top: 0, width: 260, height: 330 }}>
        <At x={130} y={58}>
          <Img src={iClock} size={70} />
        </At>
        <At x={x0} y={y + 8}>
          <Img src={pUser} size={84} />
        </At>
        <At x={x1} y={y}>
          <Img src={iServer} size={78} />
        </At>
        <Lines w={260} h={330}>
          <line x1={x0 + 34} y1={y - 22} x2={x1 - 34} y2={y - 22} stroke={colors.line} strokeWidth={2} strokeDasharray="5 5" />
          <Dot x={go ? lerp(x0 + 36, x1 - 36, k) : lerp(x1 - 36, x0 + 36, k)} y={y - 22} c={go ? colors.brand : colors.success} o={fadeEnds(go ? t / 0.5 : (t - 0.5) / 0.5, 0.12)} />
        </Lines>
        <At x={x0 + 18} y={y - 52}>
          <span style={{ opacity: !go || t > 0.97 ? 1 : 0.25, transition: `opacity 200ms ${EASE}` }}>
            <Mark2 ok size={22} />
          </span>
        </At>
        <At x={130} y={262}>
          <Tag tone="solid" icon="Clock">
            Availability
          </Tag>
        </At>
        <At x={130} y={298}>
          <Tag icon="Zap">Service Responds Now</Tag>
        </At>
      </div>
    </Show>
  )
}

function G_T01A({ step }: { step: number }) {
  return (
    <Frame w={540} h={330}>
      <Durable on={step >= 1} active={step === 1} />
      <Responds on={step >= 2} active={step === 2} />
    </Frame>
  )
}

/** one scenario: the service on top (answers or not), the stored data underneath (kept or lost) */
function Scenario({ x, on, active, title, icon, serves, keeps }: { x: number; on: boolean; active: boolean; title: string; icon: string; serves: boolean; keeps: boolean }) {
  const t = useLap(on, 2400, 0.46)
  const held = useHeld()
  const ux = 62
  const sx = 186
  const y = 108
  /* a request goes out; served, it comes back green; refused, it bounces back red from the closed service */
  const go = t < 0.5
  const reach = serves ? sx - 38 : sx - 70
  const k = go ? sm(t / 0.5) : sm((t - 0.5) / 0.5)
  const px = go ? lerp(ux + 34, reach, k) : lerp(reach, ux + 34, k)
  return (
    <Show on={on}>
      <Panel active={active} style={{ left: x, top: 0, width: 260, height: 330 }} />
      <div style={{ position: 'absolute', left: x, top: 0, width: 260, height: 330 }}>
        <At x={130} y={26}>
          <Tag tone="lift" icon={icon}>
            {title}
          </Tag>
        </At>
        <At x={ux} y={y + 8}>
          <Img src={pUserGirl} size={76} />
        </At>
        <At x={sx} y={y}>
          <span style={{ position: 'relative', display: 'grid', filter: serves ? undefined : 'grayscale(0.7)', opacity: serves ? 1 : 0.8 }}>
            <Img src={iServer} size={70} />
            {!serves && (
              <span className={held ? undefined : 's8-bob'} style={{ position: 'absolute', right: -14, top: -12 }}>
                <Img src={iTools} size={40} />
              </span>
            )}
          </span>
        </At>
        <Lines w={260} h={330}>
          <Dot x={px} y={y - 6} c={go ? colors.brand : serves ? colors.success : colors.danger} o={fadeEnds(go ? t / 0.5 : (t - 0.5) / 0.5, 0.12)} />
          {!serves && <line x1={sx - 60} y1={y - 26} x2={sx - 60} y2={y + 14} stroke={colors.danger} strokeWidth={3} strokeLinecap="round" />}
        </Lines>
        <At x={130} y={y + 58}>
          <span style={flex(6)}>
            <Mark2 ok={serves} size={20} pulse={!serves} />
            <Label strong tone={serves ? 'good' : 'bad'}>
              {serves ? 'Highly Available' : 'Briefly Unreachable'}
            </Label>
          </span>
        </At>
        {/* the stored data, kept or gone */}
        <At x={130} y={226}>
          <span style={{ position: 'relative', display: 'grid', opacity: keeps ? 1 : 0.35, filter: keeps ? undefined : 'grayscale(1)' }}>
            <Img src={iDb} size={70} />
            {keeps && (
              <span style={{ position: 'absolute', right: -18, bottom: 2 }}>
                <Img src={iShield} size={34} />
              </span>
            )}
          </span>
        </At>
        {!keeps && (
          <At x={130} y={222}>
            <span className={held ? undefined : 's8-pulse'} style={{ display: 'grid' }}>
              <Mark2 ok={false} size={38} />
            </span>
          </At>
        )}
        <At x={130} y={296}>
          <span style={flex(6)}>
            <Mark2 ok={keeps} size={20} pulse={!keeps} delay={0.6} />
            <Label strong tone={keeps ? 'good' : 'bad'}>
              {keeps ? 'Perfectly Durable' : 'Data Lost Permanently'}
            </Label>
          </span>
        </At>
      </div>
    </Show>
  )
}

function G_T01B({ step }: { step: number }) {
  return (
    <Frame w={540} h={330}>
      <Scenario x={0} on={step >= 1} active={step === 1} title="Maintenance Or An Outage" icon="Wrench" serves={false} keeps />
      <Scenario x={280} on={step >= 2} active={step === 2} title="Durability Safeguards Fail" icon="ShieldOff" serves keeps={false} />
    </Frame>
  )
}

/* ───────────────────────── slide 11 · the documents and the console ───────────────────────── */

/** a published SLA page: the service's mark, an uptime gauge, a credit coin, lines of terms */
function SlaDoc({ mark, name, rot = 0, active = false }: { mark: string; name: string; rot?: number; active?: boolean }) {
  return (
    <div style={{ position: 'relative', width: 156, height: 204, borderRadius: 12, background: colors.white, transform: `rotate(${rot}deg)`, boxShadow: `0 16px 28px -16px rgba(16,32,58,0.45), inset 0 0 0 ${active ? 2 : 1.5}px ${active ? colors.brand : colors.line}`, overflow: 'hidden', transition: `box-shadow 420ms ${EASE}` }}>
      <span aria-hidden style={{ position: 'absolute', right: 0, top: 0, width: 26, height: 26, background: `linear-gradient(225deg, ${colors.surface2} 50%, ${colors.line} 50%)` }} />
      <div style={{ position: 'absolute', left: 12, top: 12, ...flex(8) }}>
        <Mark src={mark} size={34} />
        <span style={{ ...heading(14), lineHeight: 1.1 }}>
          {name}
          <br />
          <span style={heading(14, colors.brand, 800)}>SLA</span>
        </span>
      </div>
      <div style={{ position: 'absolute', left: 12, right: 12, top: 62, ...flex(10, 'row', { justifyContent: 'space-between' }) }}>
        <span style={flex(2, 'column')}>
          <Img src={iMeter} size={52} />
          <span style={heading(14, colors.brandDark, 700)}>Uptime</span>
        </span>
        <span style={flex(4, 'column')}>
          <span style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
            <Coins n={1} of={1} size={38} />
            <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#7A4E0B' }}>
              <Icon name="Percent" size={18} />
            </span>
          </span>
          <span style={heading(14, colors.brandDark, 700)}>Credits</span>
        </span>
      </div>
      {[140, 154, 168, 182].map((y, i) => (
        <span key={y} style={{ position: 'absolute', left: 14, top: y, width: [128, 110, 122, 84][i], height: 6, borderRadius: 3, background: colors.surface2 }} />
      ))}
    </div>
  )
}

function G_T05({ step }: { step: number }) {
  const held = useHeld()
  const t = useLap(step >= 3, 3600, 0.5)
  /* the magnifier sweeps the S3 page and settles over its uptime gauge */
  const mx = 84 + 34 * Math.sin(t * Math.PI * 2)
  const my = 236 + 10 * Math.cos(t * Math.PI * 2)
  return (
    <Frame w={600} h={356}>
      <Show on={step >= 2} style={{ position: 'absolute', left: 184, top: 26 }}>
        <div style={{ position: 'absolute', left: 30, top: 6, opacity: 0.85 }}>
          <SlaDoc mark={mGlacier} name="S3 Glacier" rot={9} />
        </div>
        <div style={{ position: 'absolute', left: 0, top: 18 }}>
          <SlaDoc mark={mEbs} name="Amazon EBS" rot={4} active={step === 2} />
        </div>
      </Show>
      <Show on={step >= 1} style={{ position: 'absolute', left: 6, top: 40 }}>
        <SlaDoc mark={mS3} name="Amazon S3" rot={-3} active={step === 1} />
      </Show>
      <Show on={step >= 3}>
        <At x={mx} y={my} z={9}>
          <span className={held ? undefined : 's8-bob'} style={{ display: 'grid', placeItems: 'center', width: 64, height: 64, borderRadius: 64, background: 'rgba(255,255,255,0.35)', boxShadow: `inset 0 0 0 5px ${colors.brandDark}, 0 10px 18px -8px rgba(16,32,58,0.5)`, color: colors.brandDark, backdropFilter: 'blur(0.5px)' }}>
            <Icon name="Check" size={26} />
          </span>
        </At>
        <div style={{ position: 'absolute', left: mx + 18, top: my + 18, width: 34, height: 9, borderRadius: 5, background: colors.brandDark, transform: 'rotate(45deg)', transformOrigin: '0 50%', zIndex: 9 }} />
      </Show>
      {/* the console's object page: the one field that names the storage class */}
      <Panel style={{ left: 382, top: 40, width: 214, height: 236, overflow: 'hidden' }}>
        <div style={{ height: 40, background: colors.brandDeep, ...flex(8, 'row', { padding: '0 12px' }) }}>
          <Mark src={mS3} size={26} />
          <span style={heading(14, colors.white, 600)}>S3 Console</span>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 52, ...flex(6, 'column') }}>
          <Img src={iFiles} size={64} />
        </div>
        <div style={{ position: 'absolute', left: 14, right: 14, top: 146 }}>
          <div style={{ position: 'relative', padding: '8px 12px', borderRadius: 10, background: colors.white, boxShadow: `inset 0 0 0 1px ${colors.line}` }}>
            <div style={heading(14, colors.muted, 600)}>Storage Class</div>
            <div style={{ ...flex(6), ...heading(16, colors.ink, 700) }}>
              <Mark src={mStd} size={24} /> Standard
            </div>
            <span className={step >= 3 && !held ? 's8-pulse' : undefined} style={{ position: 'absolute', inset: -5, borderRadius: 14, boxShadow: `0 0 0 3px ${colors.accent}`, opacity: step >= 3 ? 1 : 0, transition: `opacity 420ms ${EASE}` }} />
          </div>
        </div>
      </Panel>
      <Show on={step >= 3}>
        <At x={300} y={330}>
          <Tag tone="brand" icon="SearchCheck">
            Check The Written Guarantee First
          </Tag>
        </At>
      </Show>
    </Frame>
  )
}

/* ───────────────────────── slide 15-B · the sync/async figure on its own slide ───────────────────────── */

function G_T07Big({ step, scale = 1.12 }: { step: number; scale?: number }) {
  return (
    <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
      <div style={{ width: 616 * scale, height: 396 * scale, display: 'grid', placeItems: 'center' }}>
        <div style={{ width: 616, height: 396, transform: `scale(${scale})` }}>{A.A_T07({ step })}</div>
      </div>
    </div>
  )
}

/* ───────────────────────── slide 27 · reading from the hot and the cool class ───────────────────────── */

/** one class: a reader asks, the object comes back in milliseconds; a fee coin drops on every read where one applies */
function ReadLane({ y, on, active, mark, name, fee }: { y: number; on: boolean; active: boolean; mark: string; name: string; fee: boolean }) {
  /* 2026-11-10 (user: "too fast"): one read every 4.6 s, so the out, back and fee can be followed */
  const t = useLap(on, 4600, 0.62)
  const ux = 58
  const bx = 338
  const go = t < 0.45
  const k = go ? sm(t / 0.45) : sm(Math.min(1, (t - 0.45) / 0.45))
  const px = go ? lerp(ux + 40, bx - 40, k) : lerp(bx - 40, ux + 40, k)
  const coinT = t > 0.5 ? Math.min(1, (t - 0.5) / 0.35) : 0
  return (
    <Show on={on}>
      <Panel active={active} style={{ left: 0, top: y, width: 560, height: 150 }} />
      <div style={{ position: 'absolute', left: 0, top: y, width: 560, height: 150 }}>
        <At x={ux} y={78}>
          <Img src={pUser} size={84} />
        </At>
        <Lines w={560} h={150}>
          <line x1={ux + 40} y1={60} x2={bx - 40} y2={60} stroke={colors.line} strokeWidth={2} strokeDasharray="5 5" />
          <Dot x={px} y={60} c={go ? colors.brand : colors.success} o={fadeEnds(go ? t / 0.45 : Math.min(1, (t - 0.45) / 0.45), 0.12)} />
        </Lines>
        <At x={(ux + bx) / 2} y={96}>
          <span style={flex(5)}>
            <span className="s8-blink" style={{ display: 'grid', color: colors.brand }}>
              <Icon name="Zap" size={16} />
            </span>
            <Label strong tone="brand">
              Milliseconds
            </Label>
          </span>
        </At>
        <At x={bx} y={62}>
          <Mark src={mark} size={64} ring={active ? colors.brand : undefined} />
        </At>
        <At x={bx} y={116}>
          <span style={heading(15)}>{name}</span>
        </At>
        {/* the fee jar */}
        <At x={478} y={70}>
          <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 86, height: 70 }}>
            {fee ? (
              <>
                <span style={{ position: 'absolute', left: 31, top: -6 + 40 * sm(coinT), opacity: coinT > 0 && coinT < 1 ? 1 : 0 }}>
                  <Coins n={1} of={1} size={22} />
                </span>
                <span style={{ position: 'absolute', bottom: 0, ...flex(2) }}>
                  <Coins n={3} of={3} size={20} />
                </span>
              </>
            ) : (
              <span style={{ display: 'grid', placeItems: 'center', width: 52, height: 52, borderRadius: 52, background: `${colors.success}14`, color: colors.success, boxShadow: `inset 0 0 0 2px ${colors.success}55` }}>
                <Icon name="BadgeCheck" size={28} />
              </span>
            )}
          </span>
        </At>
        <At x={478} y={124}>
          <Label strong tone={fee ? 'warn' : 'good'}>
            {fee ? 'Per-GB Retrieval Fee' : 'No Retrieval Fee'}
          </Label>
        </At>
      </div>
    </Show>
  )
}

function G_T12A({ step }: { step: number }) {
  return (
    <Frame w={560} h={320}>
      <ReadLane y={0} on={step >= 1} active={step === 1} mark={mStd} name="S3 Standard" fee={false} />
      <ReadLane y={170} on={step >= 2} active={step === 2} mark={mIa} name="S3 Standard-IA" fee />
    </Frame>
  )
}

/** a class laid across Availability Zones: a copy in each; a struck zone loses its copy */
function AzRow({ x, name, mark, azs, coins, lost, on, active }: { x: number; name: string; mark: string; azs: number; coins: number; lost: boolean; on: boolean; active: boolean }) {
  const held = useHeld()
  const w = 270
  return (
    <Show on={on}>
      <Panel active={active} style={{ left: x, top: 0, width: w, height: 214 }} />
      <div style={{ position: 'absolute', left: x, top: 0, width: w, height: 214 }}>
        <div style={{ position: 'absolute', left: 12, top: 12, ...flex(8) }}>
          <Mark src={mark} size={36} />
          <span style={heading(15)}>{name}</span>
        </div>
        <div style={{ position: 'absolute', right: 12, top: 22 }}>
          <Coins n={coins} />
        </div>
        <div style={{ position: 'absolute', left: 12, right: 12, top: 62, height: 118, ...flex(8, 'row', { justifyContent: 'center' }) }}>
          {Array.from({ length: azs }, (_, i) => {
            const struck = lost && i === 0
            return (
              <div key={i} className={struck && !held ? 's8-glow' : undefined} style={{ position: 'relative', width: 74, height: 112, borderRadius: 12, background: struck ? `${colors.danger}14` : `${colors.brand}0b`, border: `${struck ? 2 : 1.5}px solid ${struck ? colors.danger : colors.brand}${struck ? 'aa' : '55'}`, transition: `all 420ms ${EASE}` }}>
                <div style={{ position: 'absolute', left: 0, right: 0, top: 6, textAlign: 'center', ...heading(14, struck ? colors.danger : colors.brandDark, 700) }}>AZ {i + 1}</div>
                <div style={{ position: 'absolute', left: 0, right: 0, top: 36, display: 'grid', placeItems: 'center', opacity: struck ? 0.25 : 1, filter: struck ? 'grayscale(1)' : undefined, transition: `all 420ms ${EASE}` }}>
                  <span className={held ? undefined : struck ? 's8-shake' : lost ? 's8-pulse' : undefined} style={{ display: 'grid', animationDelay: `${i * 0.4}s` }}>
                    <Img src={iFiles} size={44} />
                  </span>
                </div>
                {lost && !struck && (
                  <span className={held ? undefined : 's8-pop'} style={{ position: 'absolute', right: 6, bottom: 8, display: 'grid', animationDelay: `${i * 0.3}s` }}>
                    <Mark2 ok size={18} />
                  </span>
                )}
                {struck && (
                  <>
                    <span className={held ? undefined : 's8-pulse'} style={{ position: 'absolute', left: 25, top: 40, display: 'grid' }}>
                      <Mark2 ok={false} size={24} />
                    </span>
                    <span className={held ? undefined : 's8-pop'} style={{ position: 'absolute', left: 19, top: -24, color: colors.warning, display: 'grid', filter: 'drop-shadow(0 2px 4px rgba(242,161,0,0.6))' }}>
                      <Icon name="Zap" size={34} stroke={2.6} />
                    </span>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Show>
  )
}

function G_T12B({ step }: { step: number }) {
  const held = useHeld()
  /* 2026-11-10 (user): the tier examples are their own row, set apart from the Availability Zone panels by a gap
     and a "Tier Examples" label, and each card names its S3 class */
  const CARD_Y = 282
  return (
    <Frame w={560} h={CARD_Y + 92}>
      <AzRow x={0} name="S3 Standard-IA" mark={mIa} azs={3} coins={2} lost={step >= 2} on={step >= 1} active={false} />
      <AzRow x={290} name="S3 One Zone-IA" mark={mOz} azs={1} coins={1} lost={step >= 2} on={step >= 1} active={step <= 2} />
      <Show on={step >= 1}>
        <At x={425} y={196} z={8}>
          <Tag tone="lift" icon="MapPin">
            Single AZ
          </Tag>
        </At>
      </Show>
      <Show on={step >= 2}>
        <At x={136} y={234}>
          <span className={held ? undefined : 's8-pop'} style={flex(6)}>
            <Mark2 ok size={20} pulse />
            <Label strong tone="good">
              Copies Survive
            </Label>
          </span>
        </At>
        <At x={425} y={234}>
          <span className={held ? undefined : 's8-pop'} style={{ ...flex(6), animationDelay: '0.9s' }}>
            <Mark2 ok={false} size={20} pulse />
            <Label strong tone="bad">
              Data Lost
            </Label>
          </span>
        </At>
      </Show>
      <Show on={step >= 3}>
        <div style={{ position: 'absolute', left: 0, width: 560, top: CARD_Y - 26, ...flex(10) }}>
          <span style={{ flex: 1, height: 1.5, background: `${colors.brand}33` }} />
          <span style={{ ...flex(6), ...heading(14, colors.brandDark, 700) }}>
            <Icon name="Layers" size={15} /> Tier Examples
          </span>
          <span style={{ flex: 1, height: 1.5, background: `${colors.brand}33` }} />
        </div>
        {[
          { x: 0, img: iGlobe, tier: 'Hot', icon: 'Flame', tone: colors.danger, cls: 'S3 Standard', what: 'Active Website Asset' },
          { x: 290, img: iFiles, tier: 'Cool', icon: 'Snowflake', tone: colors.info, cls: 'S3 Standard-IA / One Zone-IA', what: 'Monthly Report' },
        ].map((e, i) => (
          <Panel key={e.tier} active={step === 3} style={{ left: e.x, top: CARD_Y, width: 270, height: 92 }}>
            <div style={{ position: 'absolute', left: 10, right: 6, top: 0, bottom: 0, ...flex(8) }}>
              <span className={held ? undefined : 's8-pop'} style={{ display: 'grid', flex: 'none', animationDelay: `${i * 0.9}s`, animationDuration: '2.2s' }}>
                <Img src={e.img} size={42} />
              </span>
              <span style={flex(3, 'column', { alignItems: 'flex-start', minWidth: 0 })}>
                {/* 2026-11-10 (user: the bottom labels' motion was not clearly visible): the tier is a coloured chip whose
                    icon moves at a size that reads, the flame flickering, the snowflake turning */}
                <span className={held ? undefined : 's8-pulse'} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px 3px 6px', borderRadius: 999, background: i ? '#E3EEFF' : '#FFE4E0', boxShadow: `inset 0 0 0 1.5px ${e.tone}`, ...heading(15, e.tone, 800), animationDelay: `${i * 1.1}s` }}>
                  <span className={held ? undefined : i ? 's8-spin' : 's8-flash'} style={{ display: 'grid', animationDuration: i ? '4s' : '0.9s' }}>
                    <Icon name={e.icon} size={20} stroke={2.6} />
                  </span>
                  {e.tier}
                </span>
                <span style={{ ...heading(14, colors.brandDark, 700), whiteSpace: 'nowrap' }}>{e.cls}</span>
                <span style={heading(15)}>{e.what}</span>
              </span>
            </div>
          </Panel>
        ))}
      </Show>
    </Frame>
  )
}

/* ───────────────────────── slide 32 · an object ageing through the classes ───────────────────────── */

const AGE = [
  { x: 70, day: 'Day 0', name: 'S3 Standard', mark: mStd, coins: 4 },
  { x: 220, day: 'Day 30', name: 'Standard-IA', mark: mIa, coins: 3 },
  { x: 370, day: 'Day 90', name: 'Glacier Flexible Retrieval', mark: mGfr, coins: 2 },
  { x: 510, day: 'Or Later', name: 'Deep Archive', mark: mGda, coins: 1 },
]

/* slide 35 (2026-11-09): the object rides the road from class to class, pausing at each, its key with it; step 1
   reaches Standard-IA at day 30, step 2 goes on to Glacier Flexible Retrieval, with Deep Archive drawn as the
   alternative ("or", TR 16), so no day is invented for it */
function G_T16A({ step }: { step: number }) {
  const t = useLap(step >= 1, step >= 2 ? 6400 : 4200, 0.98)
  const last = step >= 2 ? 2 : 1
  const seg = Math.min(last - 1e-6, t * last)
  const i0 = Math.floor(seg)
  const move = sm(Math.min(1, (seg - i0) / 0.55))
  const ox = lerp(AGE[i0].x, AGE[i0 + 1].x, move)
  const atIdx = move > 0.98 ? i0 + 1 : i0
  const road = 156
  return (
    <Frame w={580} h={330}>
      {AGE.map((s, i) => {
        const on = step >= 1 && (i <= 1 || step >= 2)
        const alt = i === 3
        return (
          <Show key={s.name} on={on} delay={i > 1 ? (i - 2) * 160 : 0}>
            <At x={s.x} y={22}>
              <span style={{ display: 'block', width: 136, textAlign: 'center', ...heading(14, colors.ink, 700), lineHeight: 1.15 }}>{s.name}</span>
            </At>
            <At x={s.x} y={72}>
              <Mark src={s.mark} size={50} ring={atIdx === i ? colors.brand : undefined} dim={alt} />
            </At>
            <At x={s.x} y={road + 50}>
              <Label strong tone={alt ? 'muted' : 'lift'} icon={<Icon name="CalendarDays" size={14} />}>
                {s.day}
              </Label>
            </At>
            <At x={s.x} y={road + 86}>
              <Coins n={s.coins} of={4} size={16} />
            </At>
          </Show>
        )
      })}
      <Show on={step >= 1}>
        <Lines w={580} h={330}>
          <line x1={AGE[0].x} y1={road} x2={AGE[last].x} y2={road} stroke={colors.brand} strokeWidth={6} strokeLinecap="round" opacity={0.25} />
          {step >= 2 && <line x1={AGE[2].x + 12} y1={road} x2={AGE[3].x - 12} y2={road} stroke={colors.muted} strokeWidth={2.5} strokeDasharray="6 6" />}
          {AGE.slice(0, last + 1).map((s) => (
            <circle key={s.x} cx={s.x} cy={road} r={7} fill={colors.white} stroke={colors.brand} strokeWidth={3} />
          ))}
          {step >= 2 && <circle cx={AGE[3].x} cy={road} r={7} fill={colors.white} stroke={colors.muted} strokeWidth={2.5} strokeDasharray="3 3" />}
          <polygon points={`24,292 556,306 556,310 24,324`} fill={colors.brand} opacity={0.12} />
        </Lines>
        <At x={ox} y={road} z={9}>
          <span style={{ display: 'grid', placeItems: 'center', width: 44, height: 44, borderRadius: 12, background: colors.white, boxShadow: `0 8px 14px -8px rgba(16,32,58,0.45), inset 0 0 0 2px ${colors.brand}` }}>
            <Img src={iFiles} size={34} />
          </span>
        </At>
        <At x={Math.max(60, ox)} y={road - 38} z={9}>
          <Label strong tone="solid" size={14}>
            Same Key
          </Label>
        </At>
        <At x={470} y={308}>
          <Tag tone="brand" icon="TrendingDown">
            Cost Decreases
          </Tag>
        </At>
      </Show>
    </Frame>
  )
}

function G_T16B({ step }: { step: number }) {
  const held = useHeld()
  const t = useLap(step >= 1, 4200, 0.99)
  const tc = useLap(step >= 2, 3200, 0.99)
  /* the minimum-duration strip: 30 days in Standard-IA, the object leaves at day 10, days 11-30 still billed */
  const leave = 10
  const cells = 30
  const cw = 15
  const x0 = 52
  const dayNow = Math.min(cells, Math.floor(t * 34))
  const chain = [mStd, mIa, mGfr, mGda]
  const lit = Math.min(3, Math.floor(tc * 4.2))
  return (
    <Frame w={580} h={340}>
      <Show on={step >= 1}>
        <Panel active={step === 1} style={{ left: 0, top: 0, width: 580, height: 176 }} />
        <div style={{ position: 'absolute', left: 14, top: 14, ...flex(8) }}>
          <Mark src={mIa} size={34} />
          <Tag tone="lift" icon="CalendarClock">
            Minimum Storage Duration
          </Tag>
        </div>
        {Array.from({ length: cells }, (_, i) => {
          const d = i + 1
          const kept = d <= leave
          const billed = !kept && d <= dayNow
          return (
            <span key={i} style={{ position: 'absolute', left: x0 + i * cw, top: 70, width: cw - 3, height: 30, borderRadius: 4, background: kept ? colors.brand : billed ? colors.warning : colors.surface2, boxShadow: kept || billed ? 'inset 0 1px 0 rgba(255,255,255,0.4)' : `inset 0 0 0 1px ${colors.line}`, transition: `background 260ms ${EASE}` }} />
          )
        })}
        <Lines w={580} h={176}>
          <line x1={x0 + leave * cw - 1.5} y1={60} x2={x0 + leave * cw - 1.5} y2={112} stroke={colors.ink} strokeWidth={2} strokeDasharray="4 3" />
        </Lines>
        <At x={x0 + leave * cw - 40} y={132}>
          <span style={flex(4)}>
            <Mark src={mGfr} size={30} />
            <Label strong>Moved Early</Label>
          </span>
        </At>
        <At x={x0 + 20 * cw + 34} y={132}>
          <span style={{ ...flex(6), opacity: dayNow > leave + 2 || held ? 1 : 0.3, transition: `opacity 300ms ${EASE}` }}>
            <span className={held ? undefined : 's8-bob'} style={{ display: 'grid' }}>
              <Coins n={2} of={2} size={18} />
            </span>
            <Label strong tone="warn">
              Billed At The Old Class&apos;s Rate
            </Label>
          </span>
        </At>
        <At x={x0 + 22} y={56}>
          <span style={heading(14, colors.brandDark, 700)}>Day 0</span>
        </At>
        <At x={x0 + cells * cw - 26} y={56}>
          <span style={heading(14, colors.brandDark, 700)}>Day 30</span>
        </At>
      </Show>
      <Show on={step >= 2}>
        <Panel active={step === 2} style={{ left: 0, top: 192, width: 580, height: 146 }} />
        <div style={{ position: 'absolute', left: 14, top: 206, ...flex(8) }}>
          <Glyph icon="Filter" size={34} />
          <Tag tone="solid" icon="Link">
            One Rule, One Filter
          </Tag>
        </div>
        <Lines w={580} h={340}>
          {chain.slice(0, 3).map((_, i) => (
            <SvgArrow key={i} x1={118 + i * 124} y1={288} x2={176 + i * 124} y2={288} color={i < lit ? colors.brand : colors.line} width={2.6} />
          ))}
        </Lines>
        {chain.map((m, i) => (
          <At key={i} x={84 + i * 124} y={288}>
            <span style={{ position: 'relative', display: 'grid' }}>
              <Mark src={m} size={52} ring={i === lit ? colors.brand : undefined} dim={i > lit} />
            </span>
          </At>
        ))}
      </Show>
    </Frame>
  )
}

/* ───────────────────────── slides 37 / 37-B · the backup types ───────────────────────── */

const BK: { name: string; sub: string; icon: string; copies: number[][] | 'snap'; restore: number; speed: string; coins: number }[] = [
  { name: 'Full', sub: 'All Data Every Time', icon: 'Database', copies: [[0, 1, 2, 3], [0, 1, 2, 3], [0, 1, 2, 3]], restore: 1, speed: 'Fastest Restore', coins: 3 },
  { name: 'Incremental', sub: 'Changed Since Last Backup', icon: 'Plus', copies: [[0, 1, 2, 3], [1], [3]], restore: 3, speed: 'Slower Restore', coins: 1 },
  { name: 'Differential', sub: 'Changes Since Last Full', icon: 'Layers', copies: [[0, 1, 2, 3], [1], [1, 3]], restore: 2, speed: 'Balanced', coins: 2 },
  { name: 'Snapshot', sub: 'Point-In-Time Image', icon: 'Camera', copies: 'snap', restore: 1, speed: 'Near-Instant Recovery', coins: 0 },
]

function Blocks({ copied, fresh }: { copied: number[]; fresh: boolean }) {
  return (
    <span style={flex(3)}>
      {[0, 1, 2, 3].map((b) => {
        const on = copied.includes(b)
        return <span key={b} style={{ width: 13, height: 20, borderRadius: 4, background: on ? (fresh ? colors.brand : '#86A6FF') : 'transparent', boxShadow: on ? 'inset 0 1px 0 rgba(255,255,255,0.4)' : `inset 0 0 0 1.5px ${colors.line}`, transform: on && fresh ? 'translateY(-2px)' : 'none', transition: `all 300ms ${EASE}` }} />
      })}
    </span>
  )
}

/** one backup type: three cycles (each copying its blocks in turn), then what a restore has to read back */
function BackupRow({ y, k, on, active }: { y: number; k: number; on: boolean; active: boolean }) {
  const r = BK[k]
  const held = useHeld()
  const t = useLap(on, 3600, 0.99)
  const cyc = held ? 3 : Math.min(3, Math.floor(t * 3.6))
  const x0 = 170
  const cw = 92
  return (
    <Show on={on}>
      <Panel active={active} style={{ left: 0, top: y, width: 580, height: 150 }} />
      <div style={{ position: 'absolute', left: 0, top: y, width: 580, height: 150 }}>
        <div style={{ position: 'absolute', left: 16, top: 18, ...flex(8, 'column', { alignItems: 'flex-start' }) }}>
          <span style={flex(8)}>
            <Glyph icon={r.icon} size={36} tone={colors.brandDark} ring={`${colors.brand}55`} />
            <span style={heading(18)}>{r.name}</span>
          </span>
          <span style={{ ...heading(14, colors.muted, 600), maxWidth: 150 }}>{r.sub}</span>
          {r.coins > 0 && <Coins n={r.coins} size={16} />}
        </div>
        {[0, 1, 2].map((c) => (
          <div key={c} style={{ position: 'absolute', left: x0 + c * cw, top: 0, width: cw, height: 150, ...flex(8, 'column', { justifyContent: 'center' }) }}>
            <Label strong tone="lift" size={14}>{`Cycle ${c + 1}`}</Label>
            <span style={{ display: 'grid', placeItems: 'center', height: 44, opacity: c < cyc ? 1 : 0.25, transition: `opacity 300ms ${EASE}` }}>
              {r.copies === 'snap' ? <Mark src={mSnap} size={46} ring={c === cyc - 1 ? colors.brand : undefined} /> : <Blocks copied={r.copies[c]} fresh={c === cyc - 1} />}
            </span>
          </div>
        ))}
        {/* the restore: how many backups it must read back */}
        <div style={{ position: 'absolute', left: 452, top: 12, width: 116, height: 126, borderRadius: 12, background: `${colors.brand}0b`, boxShadow: `inset 0 0 0 1.5px ${colors.brand}33`, ...flex(6, 'column', { justifyContent: 'center' }) }}>
          <span style={{ ...flex(4), ...heading(14, colors.brandDark, 800) }}>
            <Icon name="RotateCcw" size={17} stroke={2.6} /> Restore
          </span>
          <span style={flex(3)}>
            {r.copies === 'snap' ? (
              <span className={held ? undefined : 's8-pulse'} style={{ display: 'grid', color: colors.success }}>
                <Icon name="Zap" size={34} stroke={2.6} />
              </span>
            ) : (
              Array.from({ length: r.restore }, (_, i) => (
                <span key={i} style={{ display: 'grid', placeItems: 'center', width: 24, height: 30, borderRadius: 6, background: i === 0 ? colors.brand : '#86A6FF', color: colors.white, ...heading(14, colors.white, 800) }}>
                  {i + 1}
                </span>
              ))
            )}
          </span>
          <span style={{ textAlign: 'center', ...heading(14, colors.ink, 700), lineHeight: 1.15 }}>{r.speed}</span>
        </div>
      </div>
    </Show>
  )
}

function G_T19({ step, rows }: { step: number; rows: number[] }) {
  return (
    <Frame w={580} h={316}>
      {rows.map((k, i) => (
        <BackupRow key={k} y={i * 166} k={k} on={step >= i + 1} active={step === i + 1} />
      ))}
    </Frame>
  )
}

/* ───────────────────────── slide 38 · RPO and RTO on one timeline ───────────────────────── */

function G_T20({ step }: { step: number }) {
  const held = useHeld()
  const t = useLap(step >= 2, 3000, 0.66)
  const tk = useLap(step >= 3, 3600, 0.25)
  const ax = 112
  const xb0 = 50
  const xb = 196
  const xd = 356
  const xr = 500
  const hand = t * 360
  const shrink = 0.5 + 0.5 * Math.cos(tk * Math.PI * 2)
  return (
    <Frame w={540} h={350}>
      <Lines w={540} h={350}>
        <line x1={16} y1={ax} x2={530} y2={ax} stroke={colors.muted} strokeWidth={2} />
        {step >= 1 && <rect x={xb} y={ax - 16} width={xd - xb} height={32} rx={8} fill={colors.danger} opacity={0.12} />}
        {step >= 2 && <rect x={xd} y={ax - 16} width={xr - xd} height={32} rx={8} fill={colors.warning} opacity={0.16} />}
        {[xb0, xb].map((x) => (
          <circle key={x} cx={x} cy={ax} r={6} fill={colors.white} stroke={colors.brand} strokeWidth={2.5} />
        ))}
      </Lines>
      {[xb0, xb].map((x, i) => (
        <At key={x} x={x} y={ax - 46}>
          <Mark src={mVault} size={i ? 44 : 36} dim={!i} />
        </At>
      ))}
      <At x={xd} y={ax - 48}>
        <span className={held ? undefined : 's8-pulse'} style={{ display: 'grid' }}>
          <Img src={iWarn} size={50} />
        </span>
      </At>
      <Show on={step >= 1}>
        <Lines w={540} h={350}>
          <SvgArrow x1={xb0 + 6} y1={ax + 28} x2={xb - 6} y2={ax + 28} color={colors.brandDark} width={2} head={8} both />
        </Lines>
        <At x={(xb0 + xb) / 2} y={ax + 52}>
          <Label strong tone="lift">
            Every Four Hours
          </Label>
        </At>
        <At x={(xb + xd) / 2} y={ax}>
          <span style={flex(4)}>
            {[0, 1, 2].map((i) => (
              <span key={i} className={held ? undefined : 's8-blink'} style={{ display: 'grid', color: colors.danger, animationDelay: `${i * 0.3}s` }}>
                <Icon name="FileX" size={18} />
              </span>
            ))}
          </span>
        </At>
        <At x={(xb + xd) / 2} y={ax + 40}>
          <span style={flex(6)}>
            <Tag tone="bad">RPO: Data Loss</Tag>
          </span>
        </At>
      </Show>
      <Show on={step >= 2}>
        <At x={(xd + xr) / 2} y={ax}>
          <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 30, background: colors.white, boxShadow: `inset 0 0 0 2.5px ${colors.accentDark}` }}>
            <span style={{ position: 'absolute', left: 14, top: 5, width: 2.5, height: 11, borderRadius: 2, background: colors.accentDark, transformOrigin: '50% 100%', transform: `rotate(${hand}deg)` }} />
          </span>
        </At>
        <At x={(xd + xr) / 2} y={ax + 40}>
          <span style={flex(6)}>
            <Tag tone="warn">RTO: Downtime</Tag>
          </span>
        </At>
        <At x={(xd + xr) / 2} y={ax + 76}>
          <Label strong tone="lift" icon={<Icon name="Timer" size={14} />}>
            Within One Hour
          </Label>
        </At>
        <At x={xr} y={ax - 46}>
          <span style={{ position: 'relative', display: 'grid' }}>
            <Img src={iServer} size={50} />
            <span style={{ position: 'absolute', right: -6, top: -4 }}>
              <Mark2 ok size={20} />
            </span>
          </span>
        </At>
      </Show>
      <Show on={step >= 3}>
        <Panel active={step === 3} style={{ left: 0, top: 222, width: 250, height: 124 }}>
          <div style={{ position: 'absolute', left: 16, top: 20, ...flex(10) }}>
            <span style={{ display: 'block', width: 100, height: 16, borderRadius: 8, background: colors.surface2, boxShadow: `inset 0 0 0 1px ${colors.line}`, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${20 + 80 * shrink}%`, borderRadius: 8, background: `linear-gradient(90deg, ${colors.danger}aa, ${colors.warning}aa)` }} />
            </span>
            <span style={heading(14, colors.ink, 700)}>RPO / RTO</span>
          </div>
          <div style={{ position: 'absolute', left: 16, top: 50, ...flex(4), height: 28 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} style={{ opacity: i < 1 + Math.round((1 - shrink) * 4) ? 1 : 0.15, transition: `opacity 200ms ${EASE}` }}>
                <Coins n={1} of={1} size={20} />
              </span>
            ))}
          </div>
          <div style={{ position: 'absolute', left: 16, bottom: 12 }}>
            <Label strong tone="warn" icon={<Icon name="TrendingUp" size={14} />}>
              Lower Values Cost More
            </Label>
          </div>
        </Panel>
      </Show>
      <Show on={step >= 4}>
        {[
          { x: 262, icon: 'CreditCard', name: 'Payments And Orders', need: 'Near-Zero', tone: 'brand' as const, needle: -70 },
          { x: 404, icon: 'Archive', name: 'Archives', need: 'Higher', tone: 'lift' as const, needle: 40 },
        ].map((d) => (
          <Panel key={d.name} active={step === 4} style={{ left: d.x, top: 222, width: 134, height: 124 }}>
            <div style={{ position: 'absolute', inset: 0, ...flex(4, 'column', { justifyContent: 'center' }) }}>
              <span style={flex(6)}>
                <Glyph icon={d.icon} size={34} />
                <svg width={46} height={28} viewBox="0 0 46 28" aria-hidden>
                  <path d="M4 26 A19 19 0 0 1 42 26" fill="none" stroke={colors.line} strokeWidth={5} strokeLinecap="round" />
                  <line x1={23} y1={26} x2={23 + 16 * Math.sin((d.needle * Math.PI) / 180)} y2={26 - 16 * Math.cos((d.needle * Math.PI) / 180)} stroke={colors.brandDark} strokeWidth={2.5} strokeLinecap="round" />
                </svg>
              </span>
              <span style={{ textAlign: 'center', ...heading(14, colors.ink, 700), lineHeight: 1.15 }}>{d.name}</span>
              <Label strong tone={d.tone}>
                {d.need}
              </Label>
            </div>
          </Panel>
        ))}
      </Show>
    </Frame>
  )
}

/* ───────────────────────── slide 40 · what runs in the DR region ───────────────────────── */

const DR3 = [
  { name: 'Backup-Restore', run: [false, false, false], vault: true, small: false },
  { name: 'Pilot Light', run: [false, false, true], vault: false, small: false },
  { name: 'Warm Standby', run: [true, true, true], vault: false, small: true },
]

/** a DR region with its three tiers: running ones solid (and gently alive), the rest dashed outlines */
function DrRegion({ x, k, on, active, w = 182 }: { x: number; k: number; on: boolean; active: boolean; w?: number }) {
  const d = DR3[k]
  const held = useHeld()
  /* 2026-11-10 (user: dynamic animations): backup-restore pulls each tier back out of the vault in turn; pilot light's
     database beats; warm standby's tiers pass traffic down the stack, web to app to database */
  const t = useLap(on, k === 0 ? 4200 : 2400, 0.99)
  const cx = x + w / 2
  const ty = (i: number) => 98 + i * 66
  const tiers = [
    { mark: mServer, icon: 'Globe', name: 'Web' },
    { mark: mServer, icon: 'Cpu', name: 'App' },
    { mark: mRds, icon: 'Database', name: 'Database' },
  ]
  return (
    <Show on={on}>
      <Zone x={x} y={34} w={w} h={264} label="DR Region" img={mRegion} />
      <div style={{ position: 'absolute', left: x, top: 34, width: w, height: 264, borderRadius: 14, boxShadow: active ? `0 0 0 2px ${colors.brand}` : undefined, transition: `box-shadow 420ms ${EASE}` }} />
      <At x={x + w / 2} y={12}>
        <Tag tone={active ? 'solid' : 'lift'}>{d.name}</Tag>
      </At>
      {tiers.map((tr, i) => {
        const run = d.run[i]
        const s = d.small ? 46 : 54
        return (
          <At key={i} x={x + w / 2} y={98 + i * 66}>
            {run ? (
              <span style={{ position: 'relative', display: 'grid' }}>
                <span className={held ? undefined : 's8-pulse'} style={{ display: 'grid', animationDelay: `${i * 0.5}s` }}>
                  <Mark src={tr.mark} size={s} />
                </span>
                {k === 1 && (
                  <span className={held ? undefined : 's8-blink'} style={{ position: 'absolute', right: -16, top: -10, color: colors.accentDark, display: 'grid' }}>
                    <Icon name="Flame" size={26} stroke={2.4} />
                  </span>
                )}
              </span>
            ) : (
              <span style={{ display: 'grid', transition: 'transform 200ms ease-out, filter 200ms', transform: k === 0 && !held && Math.min(2, Math.floor(t * 3)) === i && (t * 3) % 1 > 0.78 ? 'scale(1.12)' : 'none', filter: k === 0 && !held && Math.min(2, Math.floor(t * 3)) === i && (t * 3) % 1 > 0.78 ? 'drop-shadow(0 0 6px rgba(61,214,140,0.8))' : 'none' }}>
                <Ghost w={50} h={50} icon={tr.icon} size={26} strong />
              </span>
            )}
          </At>
        )
      })}
      {d.vault && (
        <At x={x + w / 2 + 52} y={232}>
          <span className={held ? undefined : 's8-bob'} style={{ display: 'grid' }}>
            <Mark src={mVault} size={44} />
          </span>
        </At>
      )}
      {on && !held && (
        <Lines w={600} h={300}>
          {k === 0 &&
            (() => {
              const i = Math.min(2, Math.floor(t * 3))
              const q = sm((t * 3 - i) / 0.8)
              const fx = cx + 52
              const fy = 232
              const px = fx + (cx + 26 - fx) * q
              const py = fy + (ty(i) - fy) * q
              return <circle cx={px} cy={py} r={6} fill={colors.success} stroke="#FFFFFF" strokeWidth={2} opacity={q < 0.98 ? 1 : 0} />
            })()}
          {k === 1 && <circle cx={cx} cy={ty(2)} r={30 + 10 * sm((t % 1) / 0.7)} fill="none" stroke={colors.accent} strokeWidth={2.5} opacity={Math.max(0, 0.7 - (t % 1))} />}
          {k === 2 && (
            <>
              <line x1={cx - 40} y1={ty(0)} x2={cx - 40} y2={ty(2)} stroke={colors.brand} strokeWidth={2} strokeDasharray="5 6" className="s8-dash" opacity={0.6} />
              {[0, 0.5].map((o) => {
                const q = (t + o) % 1
                return <circle key={o} cx={cx - 40} cy={ty(0) + (ty(2) - ty(0)) * q} r={6} fill={colors.brand} stroke="#FFFFFF" strokeWidth={2} opacity={Math.min(1, Math.min(q, 1 - q) / 0.1)} />
              })}
            </>
          )}
        </Lines>
      )}
      {d.small && (
        <At x={x + w / 2 + 50} y={164}>
          <span className={held ? undefined : 's8-pop'} style={{ display: 'grid', color: colors.brand }}>
            <Icon name="Minimize2" size={22} stroke={2.6} />
          </span>
        </At>
      )}
    </Show>
  )
}

function G_T21A({ step }: { step: number }) {
  return (
    <Frame w={586} h={300}>
      {[0, 1, 2].map((k) => (
        <DrRegion key={k} x={k * 202} k={k} on={step >= k + 1} active={step === k + 1} />
      ))}
    </Frame>
  )
}

/* ───────────────────────── slide 41-B · hours to rebuild, cost meanwhile ───────────────────────── */

const BUILD = [
  { img: mEc2, name: 'Compute', mark: true },
  { img: iNet, name: 'Network', mark: false },
  { img: iTools, name: 'App Setup', mark: false },
  { img: mRestore, name: 'Restore', mark: true },
]

function G_T22B({ step }: { step: number }) {
  const held = useHeld()
  const t = useLap(step >= 1, 6400, 0.99)
  const done = held ? 5 : Math.min(5, Math.floor(t * 5.6))
  const tm = useLap(step >= 2, 4000, 0.99)
  const month = held ? 6 : Math.min(6, Math.floor(tm * 6.6))
  const x = (i: number) => 120 + i * 96
  return (
    <Frame w={590} h={350}>
      <Show on={step >= 1}>
        <Panel active={step === 1} style={{ left: 0, top: 0, width: 590, height: 192 }} />
        <At x={46} y={92}>
          <span className={held ? undefined : 's8-pulse'} style={{ display: 'grid' }}>
            <Img src={iWarn} size={52} />
          </span>
        </At>
        <At x={46} y={146}>
          <Label strong tone="bad">
            Failure
          </Label>
        </At>
        <Lines w={590} h={192}>
          <line x1={78} y1={92} x2={x(4) - 20} y2={92} stroke={colors.line} strokeWidth={4} strokeLinecap="round" />
          <line x1={78} y1={92} x2={78 + (x(4) - 98) * Math.min(1, done / 4)} y2={92} stroke={colors.accent} strokeWidth={4} strokeLinecap="round" style={{ transition: `all 500ms ${EASE}` }} />
        </Lines>
        {BUILD.map((b, i) => (
          <div key={b.name}>
            <At x={x(i)} y={92}>
              <span style={{ display: 'grid', opacity: i < done ? 1 : 0.28, transform: i < done ? 'none' : 'scale(0.9)', transition: `all 420ms ${EASE}` }}>
                {b.mark ? <Mark src={b.img} size={48} /> : <Img src={b.img} size={50} />}
              </span>
            </At>
            <At x={x(i)} y={146}>
              <span style={{ ...heading(14, i < done ? colors.ink : colors.muted, 700), whiteSpace: 'nowrap' }}>{b.name}</span>
            </At>
          </div>
        ))}
        <At x={x(4) + 26} y={92}>
          <span style={{ position: 'relative', display: 'grid', opacity: done >= 5 ? 1 : 0.28, transition: `opacity 420ms ${EASE}` }}>
            <Img src={iServer} size={54} />
            <span style={{ position: 'absolute', right: -6, top: -6 }}>
              <Mark2 ok size={20} />
            </span>
          </span>
        </At>
        <At x={x(4) + 26} y={146}>
          <Label strong tone="good">
            Back Online
          </Label>
        </At>
        <At x={300} y={30}>
          <span style={flex(8)}>
            <span className={held ? undefined : 's8-bob'} style={{ display: 'grid' }}>
              <Img src={iHour} size={40} />
            </span>
            <Tag tone="warn">RTO: Often Hours</Tag>
          </span>
        </At>
      </Show>
      <Show on={step >= 2}>
        <Panel active={step === 2} style={{ left: 0, top: 208, width: 590, height: 140 }} />
        <div style={{ position: 'absolute', left: 16, top: 226, ...flex(8) }}>
          <Mark src={mBackup} size={42} />
          <Mark src={mS3} size={42} />
        </div>
        <div style={{ position: 'absolute', left: 140, top: 222, ...flex(8) }}>
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((m, i) => (
            <span key={m} style={flex(4, 'column')}>
              <span style={{ opacity: i < month ? 1 : 0.15, transform: i < month ? 'none' : 'translateY(-8px)', transition: `all 300ms ${EASE}` }}>
                <Coins n={1} of={1} size={20} />
              </span>
              <span style={heading(14, colors.muted, 600)}>{m}</span>
            </span>
          ))}
        </div>
        <div style={{ position: 'absolute', left: 140, top: 290, ...flex(6) }}>
          <Mark2 ok size={20} />
          <Label strong tone="good">
            Costs Run Even Without Failures
          </Label>
        </div>
        <div style={{ position: 'absolute', right: 16, top: 228, ...flex(8, 'column') }}>
          <Coins n={1} />
          <Tag tone="good" icon="Wallet">
            Cheapest Pattern
          </Tag>
        </div>
      </Show>
    </Frame>
  )
}

/* ───────────────────────── slide 43-B · warm standby against pilot light ───────────────────────── */

function G_T24B({ step }: { step: number }) {
  const held = useHeld()
  const t = useLap(step >= 1, 3000, 0.99)
  const tr = useLap(step >= 2, 1600, 0.5)
  const cols = [
    { x: 190, name: 'Pilot Light', run: [false, false, true], rto: 0.9, coins: 2 },
    { x: 372, name: 'Warm Standby', run: [true, true, true], rto: 0.38, coins: 3 },
  ]
  const rows = [
    { y: 150, icon: 'Timer', name: 'RTO', on: step >= 1 },
    { y: 216, icon: 'RefreshCw', name: 'RPO', on: step >= 2 },
    { y: 282, icon: 'Wallet', name: 'Running Cost', on: step >= 3 },
  ]
  return (
    <Frame w={552} h={320}>
      {cols.map((c, ci) => (
        <div key={c.name}>
          <At x={c.x} y={16}>
            <Tag tone={ci ? 'solid' : 'lift'}>{c.name}</Tag>
          </At>
          <At x={c.x} y={72}>
            <span style={flex(8)}>
              {[mServer, mServer, mRds].map((m, i) =>
                c.run[i] ? (
                  <span key={i} className={held ? undefined : 's8-pulse'} style={{ display: 'grid', animationDelay: `${i * 0.4}s` }}>
                    <Mark src={m} size={42} />
                  </span>
                ) : (
                  <Ghost key={i} w={40} h={40} icon={i ? 'Cpu' : 'Globe'} size={18} />
                ),
              )}
            </span>
          </At>
        </div>
      ))}
      {rows.map((r, ri) => (
        <Show key={r.name} on={r.on}>
          <Panel active={step === ri + 1} style={{ left: 0, top: r.y - 30, width: 552, height: 60 }} />
          <At x={62} y={r.y}>
            <span style={{ ...flex(6), ...heading(15) }}>
              <Icon name={r.icon} size={16} /> {r.name}
            </span>
          </At>
          {cols.map((c, ci) => (
            <At key={c.name} x={c.x} y={r.y}>
              {ri === 0 ? (
                <span style={flex(8)}>
                  <span style={{ position: 'relative', display: 'block', width: 120, height: 16, borderRadius: 8, background: colors.surface2, boxShadow: `inset 0 0 0 1px ${colors.line}` }}>
                    <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${100 * c.rto * (held ? 1 : sm(t))}%`, borderRadius: 8, background: ci ? colors.success : colors.accent }} />
                  </span>
                  <span style={{ display: 'grid', color: ci ? colors.success : colors.accentDark }}>
                    <Icon name="Hourglass" size={18} />
                  </span>
                </span>
              ) : ri === 1 ? (
                <span style={{ position: 'relative', display: 'block', width: 140, height: 26 }}>
                  <svg width={140} height={26} viewBox="0 0 140 26" aria-hidden style={{ position: 'absolute', inset: 0 }}>
                    <line x1={10} y1={13} x2={130} y2={13} stroke={colors.brand} strokeWidth={2.4} strokeDasharray="6 5" className={held ? undefined : 's8-dash'} />
                    <circle cx={10 + 120 * tr} cy={13} r={5} fill={colors.brand} stroke="#FFFFFF" strokeWidth={1.5} />
                  </svg>
                </span>
              ) : (
                <span style={flex(8)}>
                  <Coins n={c.coins} />
                  {ci === 1 && (
                    <span className={held ? undefined : 's8-spin'} style={{ display: 'grid', color: colors.brand }}>
                      <Icon name="Cog" size={18} />
                    </span>
                  )}
                </span>
              )}
            </At>
          ))}
          <At x={506} y={r.y}>
            {ri === 0 ? (
              <Label strong tone="good">
                Lower
              </Label>
            ) : ri === 1 ? (
              <Label strong tone="brand">
                Similar
              </Label>
            ) : (
              <Label strong tone="warn">
                Higher
              </Label>
            )}
          </At>
        </Show>
      ))}
    </Frame>
  )
}

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  G_T01A: (p) => <G_T01A step={p.step as number} />,
  G_T01B: (p) => <G_T01B step={p.step as number} />,
  G_T05: (p) => <G_T05 step={p.step as number} />,
  G_T07Big: (p) => <G_T07Big step={p.step as number} scale={(p.scale as number) ?? 1.12} />,
  G_T12A: (p) => <G_T12A step={p.step as number} />,
  G_T12B: (p) => <G_T12B step={p.step as number} />,
  G_T16A: (p) => <G_T16A step={p.step as number} />,
  G_T16B: (p) => <G_T16B step={p.step as number} />,
  G_T19: (p) => <G_T19 step={p.step as number} rows={(p.rows as number[]) ?? [0, 1]} />,
  G_T20: (p) => <G_T20 step={p.step as number} />,
  G_T21A: (p) => <G_T21A step={p.step as number} />,
  G_T22B: (p) => <G_T22B step={p.step as number} />,
  G_T24B: (p) => <G_T24B step={p.step as number} />,
}
