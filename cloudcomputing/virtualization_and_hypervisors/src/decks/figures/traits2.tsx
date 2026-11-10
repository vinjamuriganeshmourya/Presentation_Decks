import { colors } from '@/design/tokens'
import { useBeats } from '@/ui'
import { Card, Stage, Fade, Label, Note, Slider, LeadLines, useLoop, useCycle, STILL, BOX_W, isNow } from './scene'
import { Bell, Bill, MeterDial, ServerUnit, useEase } from './art'
import { useGo, PointColumn } from './traits1'
import { mo } from './motion'
import { tile, WELL, solid } from './basics'
import { usePrefix } from './depth'

/**
 * SECTION 4, ESSENTIAL CHARACTERISTICS - II (Merrill): elasticity,
 * scalability and metering, each shown moving with demand. Every string is
 * the reference's; the step lines are whole numbers on purpose (the reference's
 * note: "a server either exists or does not").
 *
 * Review 2026-10-16 (global rules): no hand needed. Demand and time run on
 * `useLoop` (a lap every 8s, rising and falling, no reset), the scalability
 * mode and the meters step on `useCycle` (2400ms), the sliders are `auto`
 * and only show the level; every button is gone. The lane lines draw in the
 * direction of flow once the entrances settle (`useGo`). Every ease is the
 * house curve at the deck's one state duration (`useEase`).
 */

/* ================================================================== 31 · Elasticity Scalability Metering */

export function ControlBoard({ lesson }: { lesson: string }) {
  const beat = useBeats(4)
  /* demand rises and falls by itself; the scalability card alternates its two ways to grow, two steps each */
  const demand = useLoop(8000, { still: 0.7 })
  const vertical = useCycle(2, 4800, 1) === 0
  const n = 1 + Math.round(demand * 5)
  const ease = useEase()
  const cards = [
    { title: 'Rapid elasticity', body: 'Automatic scale-out and scale-in with demand', at: 1 },
    { title: 'Scalability', body: 'Capacity to grow, vertically or horizontally', at: 2 },
    { title: 'Measured service', body: 'Usage tracked and billed per resource consumed', at: 3 },
  ]
  return (
    <Card
      id="three-overview"
      kicker="Three Characteristics Overview"
      title="Elasticity Scalability Metering"
      lead={<LeadLines lines={['Cloud platforms must absorb changing demand and charge only for what gets used', 'Three characteristics make that possible: rapid elasticity, scalability, and measured service']} />}
      lesson={lesson}
      beat={beat}
      total={4}
    >
      <div className="flex gap-[18px]">
        {cards.map((c, i) => (
          <Stage key={c.title} w={358} h={262} active={beat === c.at} pad={14}>
            <Fade on={beat >= c.at}>
              <span className="block font-heading text-[18px] font-semibold" style={{ color: colors.ink }}>{c.title}</span>
              <Note size={16} className="mt-1">{c.body}</Note>
            </Fade>
            <div className="absolute inset-x-3 bottom-3 top-[100px] grid place-items-center rounded-xl" style={{ ...WELL, opacity: beat >= c.at ? 1 : 0, transition: ease }}>
              {i === 0 && (
                <div className="grid grid-cols-3 gap-1.5">
                  {Array.from({ length: 6 }, (_, k) => (
                    <div key={k} style={{ opacity: k < n ? 1 : 0.12, transition: ease }}>
                      <ServerUnit w={70} />
                    </div>
                  ))}
                </div>
              )}
              {i === 1 && (
                <div className="flex flex-col items-center gap-2">
                  {vertical ? (
                    /* the block grows by a transform, never by width or height (user 2026-10-22: transform and opacity only); its size label is a chip, so no text is scaled */
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="grid place-items-center" style={{ width: 180, height: 84 }}>
                        <div className="h-full w-full rounded-lg" style={{ ...solid(colors.brandDeep), transform: `scale(${(60 + n * 20) / 180}, ${(30 + n * 9) / 84})`, transformOrigin: 'center', transition: ease }} />
                      </div>
                      <Label tone="solid" size={14} strong>{`Size ${n}`}</Label>
                    </div>
                  ) : (
                    <div className="flex flex-wrap justify-center gap-1.5" style={{ width: 240 }}>
                      {Array.from({ length: n }, (_, k) => (
                        <ServerUnit key={k} w={64} />
                      ))}
                    </div>
                  )}
                  <div className="flex gap-1.5">
                    <Label tone={vertical ? 'solid' : 'brand'} size={14} strong>Vertically</Label>
                    <Label tone={!vertical ? 'solid' : 'brand'} size={14} strong>Horizontally</Label>
                  </div>
                </div>
              )}
              {i === 2 && (
                <div className="flex items-center gap-4">
                  <MeterDial w={92} value={n / 6} spin={!STILL} />
                  <Bill w={58} rows={Math.min(n, 5)} />
                </div>
              )}
            </div>
          </Stage>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4" style={{ width: BOX_W }}>
        <Slider value={demand} onChange={() => undefined} label="Demand" width={420} auto fill />
        <span className="text-[14px] font-medium" style={{ color: colors.ink }}>{`${n} of 6 servers in use`}</span>
      </div>
    </Card>
  )
}

/* ================================================================== 32 · Auto-Scaling Mechanism */

const DEMAND = [0.16, 0.18, 0.55, 0.92, 0.88, 0.45, 0.2, 0.18]
const COUNT = [0.14, 0.14, 0.3, 0.78, 0.78, 0.3, 0.16, 0.16]
const ALARM = 0.5

/** A smooth line through the points, the demand curve. */
function smooth(pts: [number, number][]) {
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const mx = (x0 + x1) / 2
    d += ` C ${mx} ${y0} ${mx} ${y1} ${x1} ${y1}`
  }
  return d
}

/** A step line, the instance count: a server either exists or does not. */
function steps(pts: [number, number][]) {
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) d += ` H ${pts[i][0]} V ${pts[i][1]}`
  return d
}

function sample(arr: number[], t: number) {
  const x = t * (arr.length - 1)
  const i = Math.min(arr.length - 2, Math.floor(x))
  const f = x - i
  return arr[i] * (1 - f) + arr[i + 1] * f
}

export function ElasticChart({ lesson }: { lesson: string }) {
  const beat = useBeats(5)
  /* time sweeps the surge forward and back by itself: out under load, in after (global rule 3) */
  const t = useLoop(8000, { still: 0.6 })
  const id = usePrefix()
  const ease = useEase(900)
  const stateEase = useEase()
  const W = 614
  const H = 210
  const X = (i: number, n: number) => 20 + (i / (n - 1)) * (W - 40)
  const Y = (v: number) => H - 14 - v * (H - 30)
  const dPts = DEMAND.map((v, i) => [X(i, DEMAND.length), Y(v)] as [number, number])
  const cPts = COUNT.map((v, i) => [X(i, COUNT.length), Y(v)] as [number, number])
  const demandNow = sample(DEMAND, t)
  const countNow = COUNT[Math.min(COUNT.length - 1, Math.round(t * (COUNT.length - 1)))]
  const servers = Math.max(1, Math.round(countNow * 10))
  const over = demandNow > ALARM
  const reveal = [0.0, 0.5, 0.5, 1, 1][beat - 1]
  const items = [
    { text: 'Triggered by real-time metrics, such as CloudWatch alarms', at: 2 },
    { text: 'Auto Scaling Groups add or remove instances within minutes', at: 3 },
    { text: 'Scales in both directions: out under load, in after', at: 4 },
    { text: 'Cost: extra capacity billed only while it actually runs', at: 5 },
  ]
  return (
    <Card id="elasticity" kicker="Rapid Elasticity" title="Auto-Scaling Mechanism" lead="Rapid elasticity is the cloud's ability to provision and release resources - in most cases automatically, almost instantly, as demand rises or falls" lesson={lesson} beat={beat} total={5}>
      <div className="flex gap-4">
        {/* user, 2026-10-22: points 16 to 18px in a column level with the stage; the chart on a 642px stage */}
        <PointColumn items={items.map((it) => it.text)} width={452} height={360} size={18} />
        <Stage w={642} h={360} active={false} pad={14}>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[14px] font-semibold" style={{ color: colors.ink }}><span className="block h-[3px] w-[18px] rounded-full" style={{ background: colors.brand }} />Demand</span>
            <span className="flex items-center gap-1.5 text-[14px] font-semibold" style={{ color: colors.ink }}><span className="block h-[3px] w-[18px] rounded-full" style={{ background: colors.teal }} />Instance count</span>
          </div>
          <div className="relative mt-1" style={{ width: W, height: H }}>
            <svg width={W} height={H} aria-hidden className="absolute inset-0">
              <defs>
                <linearGradient id={`${id}-bg`} x1={0} y1={0} x2={0} y2={1}><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#F1F5FD" /></linearGradient>
                <linearGradient id={`${id}-area`} x1={0} y1={0} x2={0} y2={1}><stop offset="0" stopColor={colors.brand} stopOpacity={0.24} /><stop offset="1" stopColor={colors.brand} stopOpacity={0.02} /></linearGradient>
              </defs>
              <rect x={0} y={0} width={W} height={H} rx={12} fill={`url(#${id}-bg)`} stroke="#D9E3F7" strokeWidth={1} />
              <line x1={20} x2={W - 20} y1={Y(ALARM)} y2={Y(ALARM)} stroke={colors.danger} strokeWidth={2} strokeDasharray="6 6" style={{ opacity: beat >= 2 ? 1 : 0, transition: ease }} />
              <g>
                <path d={smooth(dPts) + ` L ${W - 20} ${H - 14} L 20 ${H - 14} Z`} fill={`url(#${id}-area)`} />
                <path d={smooth(dPts)} fill="none" stroke={colors.brand} strokeWidth={9} opacity={0.16} strokeLinecap="round" />
                <path d={smooth(dPts)} fill="none" stroke={colors.brand} strokeWidth={3} />
                <path d={steps(cPts)} fill="none" stroke={colors.teal} strokeWidth={3.5} pathLength={1} strokeDasharray="1" style={{ strokeDashoffset: 1 - reveal, transition: ease }} />
                {/* the cursor rides a transform, not an attribute: no layout per frame, so the sweep stays on the compositor */}
                <g style={{ transform: `translateX(${20 + t * (W - 40)}px)` }}>
                  <line x1={0} x2={0} y1={8} y2={H - 8} stroke={colors.ink} strokeWidth={1.5} strokeDasharray="3 4" />
                </g>
                <g style={{ transform: `translate(${20 + t * (W - 40)}px, ${Y(demandNow)}px)` }}>
                  <circle cx={0} cy={0} r={6} fill={over ? colors.danger : colors.brand} style={{ transition: stateEase }} />
                </g>
              </g>
            </svg>
            <div className="absolute" style={{ left: 30, top: Y(ALARM) - 28 }}>
              <Fade on={beat >= 2}><Label tone="bad" size={12}>CloudWatch alarm</Label></Fade>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Slider value={t} onChange={() => undefined} label="Time" width={224} auto fill />
            <div className="flex items-center gap-1.5">
              <Bell w={20} ringing={over && !STILL} />
              <div className="flex gap-1">
                {Array.from({ length: 8 }, (_, k) => (
                  <div key={k} style={{ opacity: k < servers ? 1 : 0.12, transition: stateEase }}>
                    <ServerUnit w={34} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <Fade on={beat >= 3}><Label tone="brand" size={13}>CloudWatch alarm triggers the Auto Scaling Group</Label></Fade>
            <Fade on={beat >= 5}><Label tone={servers > 2 ? 'warn' : 'good'} size={13}>{`Billing ${servers} instance${servers === 1 ? '' : 's'} now`}</Label></Fade>
          </div>
        </Stage>
      </div>
    </Card>
  )
}

/* ================================================================== 34 · Traffic Spike Traced (reference 38 + 39) */

const ELASTIC = [0.15, 0.15, 0.4, 0.85, 0.85, 0.4, 0.15, 0.15]
const SCALE = [0.25, 0.25, 0.25, 0.8, 0.8, 0.8, 0.8, 0.8]
const LANE_ROWS: [string, string, string][] = [
  ['Trigger', 'Real-time demand (CloudWatch alarm)', 'Planned capacity growth'],
  ['Timescale', 'Minutes, fully automatic', 'Hours to days, manual or automated'],
  ['Direction', 'Scales out and back in', 'Mostly one-directional growth'],
  ['Worked case', '2→10 instances in ~3 min, back to 2', 'm5.large resized to m5.4xlarge in advance'],
]

function Lane({ title, series, values, on, tone, delay = 0 }: { title: string; series: string; values: number[]; on: boolean; tone: string; delay?: number }) {
  const ease = useEase(860)
  const id = usePrefix()
  const W = 520
  const H = 240
  const pts = values.map((v, i) => [10 + (i / (values.length - 1)) * (W - 20), H - 8 - v * (H - 20)] as [number, number])
  return (
    <Stage w={540} h={292} active={on} pad={8}>
      <div className="flex items-center gap-3 px-1">
        <span className="font-heading text-[18px] font-semibold" style={{ color: colors.ink }}>{title}</span>
        <span className="flex items-center gap-1.5 text-[16px] font-medium" style={{ color: colors.ink }}><span className="block h-[3px] w-[16px] rounded-full" style={{ background: tone }} />{series}</span>
      </div>
      <svg width={W} height={H} className="mt-1" aria-hidden>
        <defs>
          <linearGradient id={`${id}-bg`} x1={0} y1={0} x2={0} y2={1}><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#F1F5FD" /></linearGradient>
          <linearGradient id={`${id}-area`} x1={0} y1={0} x2={0} y2={1}><stop offset="0" stopColor={tone} stopOpacity={0.26} /><stop offset="1" stopColor={tone} stopOpacity={0.02} /></linearGradient>
        </defs>
        <rect width={W} height={H} rx={10} fill={`url(#${id}-bg)`} stroke="#D9E3F7" strokeWidth={1} />
        <g>
          <path d={steps(pts) + ` V ${H - 8} H 10 Z`} fill={`url(#${id}-area)`} opacity={on ? 1 : 0} style={{ transition: ease, transitionDelay: `${delay}ms` }} />
          <path d={steps(pts)} fill="none" stroke={tone} strokeWidth={3} pathLength={1} strokeDasharray="1" style={{ strokeDashoffset: on ? 0 : 1, transition: ease, transitionDelay: `${delay}ms` }} />
        </g>
      </svg>
    </Stage>
  )
}

/* split by the review, 2026-10-15: the two lanes with the lead, then the table on its own frame */
export function TwoLanes({ lesson }: { lesson: string }) {
  const beat = useBeats(2)
  /* each lane's line travels left to right, the elastic one first, once the entrances settle (global rule 4) */
  const go = useGo()
  return (
    <Card id="elasticity-scalability" kicker="Elasticity Vs Scalability" title="Traffic Spike Traced" lead="During a demand surge, elasticity reacts automatically to the moment; scalability asks whether the underlying architecture can absorb growth at all" lesson={lesson} beat={beat} total={2}>
      <div className="flex gap-[30px]">
        <Lane title="Elasticity" series="Instance count" values={ELASTIC} on={go && beat >= 1} tone={colors.brand} />
        <Lane title="Scalability" series="Instance size" values={SCALE} on={go && beat >= 2} tone={colors.teal} delay={700} />
      </div>
    </Card>
  )
}

export function LaneTable({ lesson }: { lesson: string }) {
  const beat = useBeats(4)
  const ease = useEase()
  return (
    <Card id="elasticity-table" kicker="Elasticity Vs Scalability" title="Traffic Spike Traced" lesson={lesson} beat={beat} total={4}>
      <div className="overflow-hidden rounded-xl" style={{ width: BOX_W, ...tile() }}>
        <div className="grid" style={{ gridTemplateColumns: '200px 1fr 1fr' }}>
          {['Aspect', 'Elasticity', 'Scalability'].map((h) => (
            <span key={h} className="px-5 py-3 font-heading text-[19px] font-semibold" style={{ background: colors.surface2, color: colors.brandDark }}>{h}</span>
          ))}
          {LANE_ROWS.map((r, i) =>
            r.map((c, k) => (
              <span key={`${i}${k}`} className={`px-5 py-5 text-[19px] leading-snug ${k === 0 ? 'font-heading font-semibold' : 'font-medium'}`} style={{ color: colors.ink, borderTop: `1px solid ${colors.line}`, background: isNow(beat, i + 1) ? 'rgba(45,99,251,0.09)' : 'transparent', opacity: beat >= i + 1 ? 1 : 0, transition: ease }}>
                {c}
              </span>
            )),
          )}
        </div>
      </div>
    </Card>
  )
}

/* ================================================================== 35 · Pay-Per-Use Metering */

const METRICS = ['Compute-seconds', 'Storage-GB', 'Data transfer', 'API calls']

export function MeterBank({ lesson }: { lesson: string }) {
  const beat = useBeats(5)
  /* the meters come into use one by one, then drop out one by one, round and round; a still frame shows all four metered */
  /* user, 2026-10-22: the box's switching a third faster (step 2400 to 1500ms, state ease 520 to 360ms); 2026-10-23: quicker again (1000ms, 240ms) */
  const k = useCycle(8, 1000, 4)
  const live = k <= 4 ? k : 8 - k
  const on = METRICS.map((_, i) => i < live)
  const ease = useEase(240)
  const items = [
    { text: 'Metrics tracked: compute-seconds, storage-GB, data transfer, API calls', at: 2 },
    { text: 'CloudWatch collects usage; Billing and Cost Explorer compute charges', at: 3 },
    { text: 'Granular units: EC2 per-second, S3 per-GB-month, Lambda per-request', at: 4 },
    { text: 'No usage recorded means no charge: true pay-per-use pricing', at: 5 },
  ]
  return (
    <Card id="measured-service" kicker="Measured Service" title="Pay-Per-Use Metering" lead="Measured service means cloud providers automatically monitor, meter and report resource usage, so bills map directly to actual consumption" lesson={lesson} beat={beat} total={5}>
      <div className="flex gap-4">
        {/* user, 2026-10-22: points 16 to 18px in a column level with the stage; the picture a size smaller on a 642px stage */}
        <PointColumn items={items.map((it) => it.text)} width={452} height={360} size={18} />
        <Stage w={642} h={360} active={false} pad={14}>
          <div className="grid grid-cols-4 gap-2.5">
            {METRICS.map((m, i) => (
              <div key={m} className="flex flex-col items-center gap-1 rounded-xl py-2" style={{ ...tile(`${on[i] ? 2 : 1}px ${on[i] ? colors.brand : colors.line}`), opacity: beat >= 2 ? 1 : 0.35, transition: ease }}>
                <MeterDial w={54} value={on[i] ? 0.25 + i * 0.17 : 0} spin={on[i] && !STILL} />
                <span className="text-[14px] font-semibold" style={{ color: colors.ink }}>{m}</span>
                <Label tone={on[i] ? 'solid' : 'muted'} size={14} strong>{on[i] ? 'In use' : 'Off'}</Label>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Fade on={beat >= 3}>
              <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={tile(`1.5px ${colors.line}`)}>
                <span className="font-heading text-[14px] font-semibold" style={{ color: colors.brandDark }}>CloudWatch</span>
              </div>
            </Fade>
            <Fade on={beat >= 3}>
              <svg width={40} height={3} aria-hidden style={{ display: 'block', overflow: 'visible' }}>
                <line x1={1.5} x2={38.5} y1={1.5} y2={1.5} stroke={colors.brand} strokeWidth={3} strokeLinecap="round" />
                <line x1={1.5} x2={38.5} y1={1.5} y2={1.5} stroke={colors.white} strokeWidth={1.5} strokeLinecap="round" strokeDasharray="5 9" opacity={0.75} className={mo('dash', 5).className} style={mo('dash', 5).style} />
              </svg>
            </Fade>
            <Fade on={beat >= 3}>
              <div className="rounded-xl px-3 py-2" style={{ ...tile(`1.5px ${colors.brand}`), width: 300 }}>
                <span className="block font-heading text-[14px] font-semibold" style={{ color: colors.brandDark }}>Billing and Cost Explorer</span>
                {METRICS.map((m, i) => (
                  <div key={m} className="mt-1 flex items-center justify-between text-[14px]" style={{ color: colors.ink }}>
                    <span>{m}</span>
                    <span className="font-mono" style={{ color: on[i] ? colors.success : colors.muted }}>{on[i] ? 'metered' : '0'}</span>
                  </div>
                ))}
              </div>
            </Fade>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Fade on={beat >= 4}>
              <div className="flex gap-1.5">
                <Label tone="brand" size={12} mono>EC2 per-second</Label>
                <Label tone="brand" size={12} mono>S3 per-GB-month</Label>
                <Label tone="brand" size={12} mono>Lambda per-request</Label>
              </div>
            </Fade>
            <Fade on={beat >= 5}><Label tone={live === 0 ? 'good' : 'plain'} size={13} strong>{live === 0 ? 'No usage, no charge' : `${live} metered`}</Label></Fade>
          </div>
        </Stage>
      </div>
    </Card>
  )
}
