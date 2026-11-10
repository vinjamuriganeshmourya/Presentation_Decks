import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { Arrow, At, Label, Traveller, useLoop } from '../scene'
import { ClaySvg } from '../art'
import { Slab, drop, lift, useFx } from '../clay-a'
import { Shadow } from '../depth'
import { ClayClock, ClayLaptop, ClayMeter, ClayParkedCar, ClayRack, ClayTaxi, Icon3D, LAB } from '../d3/kit'
import { pulse, within } from './iso'
import { AN_W, Chips, FigureOnly, IsoAnalogy, PointsFigure, TableCard } from './frames'

/**
 * SECTION 4 · BEYOND THE BIG THREE (reference frames 34 to 41).
 *
 * The two models past SaaS, in session 1's 3D finish (2026-10-26): a
 * staircase of glossy split slabs whose amber (the user's share) shrinks as
 * the steps rise; four trigger sources firing at a platform where an amber
 * function block exists only while it runs; a function's life as five
 * pedestals with the billing bracket across two of them; a taxi whose meter
 * runs only for the trip; a model service (GPU racks and an AI brain) behind
 * an API; the round trip of an API call; a consultation with no hospital of
 * your own; and the full responsibility table. Every word is the reference's;
 * provider things are brand blue, the user's are amber.
 */

const LAP = 8000
const EASE = 'cubic-bezier(0.22,1,0.36,1)'
/** the customer's amber, `ISO.customer` in iso.tsx */
const AMBER = '#F5A623'
const PROVIDER = colors.brand

/* ------------------------------------------------------------------ local drawings (session 1's finish) */

/** A raised plate an object stands on: a lit top, a graded front, a soft shadow. `on` rings it in brand blue. */
/* review 2026-10-26 (edges): the plate's tone was #F3F6FC, so its top face (lifted toward white) vanished
   into the stage and only the dark end cap showed, as if detached; one step darker, every face reads */
function Plinth({ w, h = 24, tone = '#DCE5F6', on = false }: { w: number; h?: number; tone?: string; on?: boolean }) {
  const fx = useFx({ p: tone })
  const d = 10
  return (
    <ClaySvg w={w} vw={w} vh={h + 12}>
      {fx.defs}
      <Shadow id={fx.id} cx={w / 2} cy={h + 8} rx={w * 0.46} ry={4} o={0.22} />
      <g>
        <Slab x={2} y={d * 0.55 + 1} w={w - d - 4} h={h - 2} rx={8} d={d} hue={tone} fill={fx.g('p')} />
        <rect x={2} y={d * 0.55 + 1} width={w - d - 4} height={h - 2} rx={8} fill="none" stroke={PROVIDER} strokeWidth={2} style={{ opacity: on ? 1 : 0, transition: `opacity 420ms ${EASE}` }} />
      </g>
    </ClaySvg>
  )
}

/**
 * A function instance: an amber block with a lit top, a code mark on its
 * front and a specular; when `on` is 0 only its dashed outline (the empty
 * slot, nothing running) is left. It drops in as it appears.
 */
function FnCube({ w, on }: { w: number; on: number }) {
  const fx = useFx({ c: AMBER })
  return (
    <ClaySvg w={w} vw={84} vh={88}>
      {fx.defs}
      <Shadow id={fx.id} cx={40} cy={82} rx={32} ry={4} o={0.24 * on} />
      <rect x={6} y={18} width={64} height={62} rx={11} fill="none" stroke={colors.muted} strokeWidth={2} strokeDasharray="6 5" data-flat style={{ opacity: (1 - on) * 0.8, transition: `opacity 420ms ${EASE}` }} />
      <g style={{ opacity: on, transform: `translateY(${(1 - on) * -12}px)`, transition: `opacity 420ms ${EASE}, transform 420ms ${EASE}` }}>
        <Slab x={6} y={18} w={64} h={62} rx={11} d={12} hue={AMBER} fill={fx.g('c')} />
        <path d="M 28 38 L 19 49 L 28 60 M 48 38 L 57 49 L 48 60 M 42 36 L 34 62" fill="none" stroke="#FFFFFF" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.92} />
        <ellipse cx={24} cy={26} rx={12} ry={4} fill="#FFFFFF" opacity={0.3} />
      </g>
    </ClaySvg>
  )
}

/** A trigger event: a glossy lightning bolt; `burst` swells it with a glow. */
function Bolt({ w, burst = 0 }: { w: number; burst?: number }) {
  const fx = useFx({ b: LAB.yellow })
  return (
    <ClaySvg w={w} vw={60} vh={80}>
      {fx.defs}
      <Shadow id={fx.id} cx={30} cy={76} rx={18} ry={3} o={0.22} />
      <g style={{ transformBox: 'view-box', transformOrigin: '30px 40px', transform: `scale(${1 + burst * 0.18})`, transition: `transform 360ms ${EASE}` }}>
        <circle cx={30} cy={38} r={28} fill={fx.gl('yellow')} opacity={burst} />
        <path d="M 36 4 L 10 42 H 27 L 21 72 L 50 30 H 33 L 42 4 Z" fill={fx.g('b')} stroke={drop(LAB.yellow, 0.12)} strokeWidth={1.5} strokeLinejoin="round" />
        <path d="M 35 8 L 15 39 H 22 L 37 10 Z" fill="#FFFFFF" opacity={0.42} />
      </g>
    </ClaySvg>
  )
}

/** One step of the staircase: a glossy slab split provider blue / user amber at `p`. */
function StepBar({ w, h, p }: { w: number; h: number; p: number }) {
  const fx = useFx({ a: PROVIDER, b: AMBER })
  const d = 9
  const top = d * 0.55 + 1
  const fw = w - d - 2
  const pw = Math.max(0, fw * p)
  return (
    <ClaySvg w={w} vw={w} vh={h + top + 4}>
      {fx.defs}
      <Shadow id={fx.id} cx={w / 2} cy={h + top + 1} rx={w * 0.46} ry={3} o={0.18} />
      <g>
        <Slab x={1} y={top} w={pw} h={h} rx={7} d={d} hue={PROVIDER} fill={fx.g('a')} />
        {fw - pw > 1 && <Slab x={1 + pw - 1} y={top} w={fw - pw + 1} h={h} rx={7} d={d} hue={AMBER} fill={fx.g('b')} />}
        <ellipse cx={1 + fw * 0.22} cy={top + 6} rx={fw * 0.16} ry={2.5} fill="#FFFFFF" opacity={0.3} />
      </g>
    </ClaySvg>
  )
}

/** A road seen from the front: a graded slate band with a dashed centre line. */
function Road({ w }: { w: number }) {
  const fx = useFx({ r: '#6B7F99' })
  return (
    <ClaySvg w={w} vw={w} vh={30}>
      {fx.defs}
      <g>
        <rect x={0} y={2} width={w} height={26} rx={9} fill={fx.g('r')} />
        <rect x={9} y={2} width={w - 18} height={1.5} fill="#FFFFFF" opacity={0.3} />
        <path d={`M 14 16 H ${w - 14}`} stroke="#FFFFFF" strokeWidth={2.5} strokeDasharray="14 12" opacity={0.75} />
      </g>
    </ClaySvg>
  )
}

/** Something never built: a dashed outline of a building with a cross on its front (the hospital). */
function GhostHospital({ w }: { w: number }) {
  const s = colors.muted
  return (
    <ClaySvg w={w} vw={100} vh={120}>
      <g fill="none" stroke={s} strokeWidth={2} strokeDasharray="6 5" strokeLinejoin="round" opacity={0.85} data-flat>
        <rect x={6} y={30} width={88} height={86} rx={8} />
        <path d="M 22 30 V 12 H 78 V 30" />
        <path d="M 44 50 h 12 v 12 h 12 v 12 h -12 v 12 h -12 v -12 h -12 v -12 h 12 z" />
      </g>
    </ClaySvg>
  )
}

/** Racks never bought: two dashed outlines of cabinets with their unit lines. */
function GhostRacks({ w }: { w: number }) {
  const s = colors.muted
  return (
    <ClaySvg w={w} vw={110} vh={90}>
      <g fill="none" stroke={s} strokeWidth={2} strokeDasharray="6 5" opacity={0.85} data-flat>
        {[4, 60].map((x) => (
          <g key={x}>
            <rect x={x} y={4} width={46} height={82} rx={7} />
            <path d={`M ${x + 8} 26 H ${x + 38} M ${x + 8} 46 H ${x + 38} M ${x + 8} 66 H ${x + 38}`} />
          </g>
        ))}
      </g>
    </ClaySvg>
  )
}

/** A soft brand glow laid behind a working object (opacity only). */
function Glow({ w, h, on, style }: { w: number; h: number; on: number; style?: CSSProperties }) {
  return <div aria-hidden className="pointer-events-none absolute" style={{ width: w, height: h, borderRadius: '50%', background: `radial-gradient(closest-side, ${PROVIDER}55, ${PROVIDER}00)`, opacity: on, transition: `opacity 420ms ${EASE}`, ...style }} />
}

/** A stack: children centred in a column. */
function Col({ children, gap = 8, style }: { children: ReactNode; gap?: number; style?: CSSProperties }) {
  return (
    <div className="flex flex-col items-center" style={{ gap, ...style }}>
      {children}
    </div>
  )
}

/* ================================================================== 34 · the staircase */

const MODELS = ['IaaS', 'PaaS', 'SaaS', 'FaaS / Serverless', 'AI/ML-as-a-Service']
/** The provider's share of each step's slab, the reference's proportions. */
const PROVIDER_SHARE = [0.22, 0.42, 0.62, 0.8, 0.94]

/**
 * Five glossy slabs stacked as a staircase rising to the right, each split
 * provider blue / user amber, the amber shrinking as the steps rise. The
 * steps rise one after another, hold, and sink back in reverse (ping-pong).
 */
function StairScene() {
  const t = useLoop(10000, { mode: 'pingpong', still: 0.95 })
  const rise = (i: number) => within(t, 0.04 + i * 0.13, 0.2 + i * 0.13)
  const X0 = 160
  const STEP = 40
  const XR = 600
  const H = 32
  const rowY = (i: number) => 78 + (4 - i) * 44
  return (
    <>
      <At x={80} y={22}>
        <Chips items={[{ text: 'Provider', color: PROVIDER }, { text: 'User', color: AMBER }]} />
      </At>
      {MODELS.map((m, i) => {
        const r = rise(i)
        const x = X0 + i * STEP
        const move: CSSProperties = { opacity: r, transform: `translateY(${(1 - r) * 14}px)`, transition: `opacity 300ms ${EASE}` }
        return (
          <div key={m}>
            <At x={x} y={rowY(i) - 6} style={move}>
              <StepBar w={XR - x} h={H} p={PROVIDER_SHARE[i]} />
            </At>
            <At x={x - 14 - 200} y={rowY(i) + H / 2} w={200} cy style={{ opacity: r > 0.4 ? 1 : 0, transition: `opacity 300ms ${EASE}` }}>
              <div className="flex justify-end">
                <Label size={15} strong tone={i >= 3 ? 'brand' : 'plain'}>
                  {m}
                </Label>
              </div>
            </At>
          </div>
        )
      })}
      {/* the two axes; the vertical chip has equal padding on all four sides (review 2026-10-26: the chip's own
          px/py padding, turned on its side, left only 3px above and below the words) */}
      <Arrow x1={36} y1={292} x2={36} y2={74} tone={PROVIDER} />
      <At x={50} y={183} cy>
        <Label tone="brand" size={14} strong mono style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', padding: 10 }}>
          RISING ABSTRACTION
        </Label>
      </At>
      <Arrow x1={X0} y1={306} x2={XR} y2={306} tone={PROVIDER} />
      <At x={(X0 + XR) / 2} y={318} cx>
        <Label tone="brand" size={14} strong mono>
          USER RESPONSIBILITY SHRINKS
        </Label>
      </At>
    </>
  )
}

export function Beyond({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="beyond"
      kicker="Beyond The Big Three"
      title="New Service Models"
      lead={['Cloud service models did not stop at IaaS, PaaS and SaaS', 'Two further models push abstraction higher, changing what the provider manages and what the developer retains']}
      lesson={lesson}
      points={['Function as a Service (FaaS): runs code per trigger, no visible server', 'Serverless: broader term covering FaaS plus managed databases and queues', 'AI/ML-as-a-Service: consumes pre-built AI and ML models via API', 'Both shift most infrastructure responsibility onto the cloud provider']}
      figure={<StairScene />}
    />
  )
}

/* ================================================================== 35 · triggers */

/**
 * Four trigger sources either side of an empty platform. One fires: a dot
 * runs to the platform, an amber function block appears, the meter under it
 * sweeps while it runs, and the block is gone again. The queue message and
 * the file upload fire together and make two blocks at once (scaling out).
 */
function TriggerScene() {
  const t = useLoop(LAP, { mode: 'sawtooth', still: 0.8 })
  const fire = (s: number) => ({
    moving: t > s && t < s + 0.1,
    hot: t >= s - 0.02 && t < s + 0.3,
    on: pulse(t, s + 0.09, s + 0.13, s + 0.26, s + 0.3),
    run: within(t, s + 0.13, s + 0.26),
  })
  const http = fire(0.02)
  const timer = fire(0.34)
  const queue = fire(0.66)
  const file = fire(0.66)
  /* the left block serves the left sources, the right block the right ones */
  const slotA = { on: Math.max(http.on, queue.on), run: Math.max(http.run, queue.run) }
  const slotB = { on: Math.max(timer.on, file.on), run: Math.max(timer.run, file.run) }
  const hand = (t - 0.34 + 1) % 1
  const LX = 98
  const RX = 536
  const ROW = [44, 214]
  const sources: { name: string; f: ReturnType<typeof fire>; x: number; y: number; art: ReactNode; from: [number, number]; to: [number, number] }[] = [
    { name: 'HTTP request', f: http, x: LX, y: ROW[0], art: <Icon3D name="beyond-www" w={64} dim={!http.hot} />, from: [136, 84], to: [196, 192] },
    { name: 'Queue message', f: queue, x: LX, y: ROW[1], art: <Icon3D name="beyond-envelope" w={66} dim={!queue.hot} />, from: [138, 238], to: [196, 214] },
    {
      name: 'Scheduled timer',
      f: timer,
      x: RX,
      y: ROW[0],
      art: (
        <div style={{ opacity: timer.hot ? 1 : 0.4, transition: `opacity 420ms ${EASE}` }}>
          <ClayClock w={62} turn={hand} />
        </div>
      ),
      from: [498, 84],
      to: [438, 192],
    },
    { name: 'File upload', f: file, x: RX, y: ROW[1], art: <Icon3D name="beyond-upload" w={66} dim={!file.hot} />, from: [498, 238], to: [438, 214] },
  ]
  return (
    <>
      {sources.map((s) => (
        <div key={s.name}>
          <Arrow x1={s.from[0]} y1={s.from[1]} x2={s.to[0]} y2={s.to[1]} tone={s.f.hot ? PROVIDER : colors.line} dashed={!s.f.hot} />
          <Traveller path={[s.from, s.to]} run={s.f.moving} k={s.name} size={12} tone={AMBER} dur={0.8} />
          <At x={s.x} y={s.y} cx>
            <Col gap={10}>
              <div className="flex h-[66px] items-end">{s.art}</div>
              <Label size={14} strong tone={s.f.hot ? 'brand' : 'plain'}>
                {s.name}
              </Label>
            </Col>
          </At>
        </div>
      ))}
      <At x={317} y={118} cx>
        <Col gap={0}>
          <div className="flex items-end" style={{ gap: 36 }}>
            <FnCube w={74} on={slotA.on} />
            <FnCube w={74} on={slotB.on} />
          </div>
          <Plinth w={236} />
          <div className="flex items-end" style={{ gap: 60, marginTop: 10 }}>
            {[slotA, slotB].map((s, i) => (
              <div key={i} style={{ opacity: 0.35 + s.on * 0.65, transition: `opacity 420ms ${EASE}` }}>
                <ClayMeter w={50} value={s.run} />
              </div>
            ))}
          </div>
        </Col>
      </At>
    </>
  )
}

export function Faas({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="faas"
      kicker="FaaS And Serverless"
      title="Pay Per Execution"
      lead="Function as a Service (FaaS) runs a single function only when triggered, removing any need to provision or manage a server"
      lesson={lesson}
      points={['Triggers: HTTP request, scheduled timer, queue message, file upload', 'Scales automatically from zero to many parallel invocations', 'Billed per invocation and execution time, not idle time', 'Runs on AWS Lambda; cold start delay if idle first']}
      figure={<TriggerScene />}
    />
  )
}

/* ================================================================== 36 · a function's life */

const STATIONS = ['Idle', 'Trigger event', 'Function instantiated', 'Executes', 'Torn down']

/**
 * Five pedestals in a row; a marker runs from one to the next. The bolt
 * flashes at the second, the block appears at the third, runs at the fourth
 * with a meter sweeping beside it, and is torn down at the fifth. The billing
 * bracket lights only while the marker is on the third and fourth.
 */
function LifeScene() {
  const t = useLoop(10000, { mode: 'sawtooth', still: 0.78 })
  const arrive = [0.1, 0.3, 0.5, 0.7, 0.9]
  const reached = (i: number) => within(t, arrive[i] - 0.06, arrive[i])
  const pos = arrive.slice(1).reduce((acc, a) => acc + within(t, a - 0.08, a), 0)
  const here = Math.round(pos)
  const moving = arrive.findIndex((a, j) => j > 0 && t > a - 0.08 && t < a)
  const burst = pulse(t, 0.28, 0.31, 0.36, 0.44)
  const run = within(t, 0.72, 0.88)
  const torn = 1 - within(t, 0.92, 0.97)
  const billed = t >= 0.47 && t < 0.88
  const cx = (i: number) => 555 + (i - 2) * 210
  const PW = 150
  const TOP = 70
  const RAIL = TOP + 108 + 13
  const art = (i: number) => {
    if (i === 0) return <FnCube w={84} on={0} />
    if (i === 1)
      return (
        <div style={{ opacity: 0.4 + reached(1) * 0.6, transition: `opacity 420ms ${EASE}` }}>
          <Bolt w={62} burst={burst} />
        </div>
      )
    if (i === 2) return <FnCube w={84} on={reached(2)} />
    if (i === 3)
      return (
        <div className="flex items-end gap-2">
          <FnCube w={76} on={reached(3)} />
          <div style={{ opacity: 0.35 + reached(3) * 0.65, transition: `opacity 420ms ${EASE}` }}>
            <ClayMeter w={52} value={run} />
          </div>
        </div>
      )
    return <FnCube w={84} on={reached(4) * torn} />
  }
  return (
    <>
      <At x={555} y={24} cx>
        <Label tone="brand" size={15} strong mono>
          AWS LAMBDA
        </Label>
      </At>
      {[1, 2, 3, 4].map((j) => (
        <Arrow key={j} x1={cx(j - 1) + PW / 2 + 8} y1={RAIL} x2={cx(j) - PW / 2 - 8} y2={RAIL} tone={here >= j ? PROVIDER : colors.line} />
      ))}
      {moving > 0 && <Traveller path={[[cx(moving - 1) + PW / 2 + 8, RAIL], [cx(moving) - PW / 2 - 8, RAIL]]} run k={moving} size={12} tone={colors.brandDark} dur={0.7} />}
      {STATIONS.map((s, i) => (
        <At key={s} x={cx(i)} y={TOP} cx>
          <Col gap={10}>
            <div className="flex flex-col items-center justify-end" style={{ height: 108 + 26 }}>
              <div className="flex items-end" style={{ marginBottom: -2 }}>
                {art(i)}
              </div>
              <Plinth w={PW} on={here === i} />
            </div>
            <Label size={16} strong tone={here === i ? 'brand' : i === 0 || i === 4 ? 'muted' : 'plain'}>
              {s}
            </Label>
          </Col>
        </At>
      ))}
      {/* the billing bracket, across the third and fourth stations */}
      <At x={cx(2) - 100} y={256}>
        <div style={{ width: cx(3) - cx(2) + 200, height: 12, borderLeft: `2.5px solid ${billed ? AMBER : colors.muted}`, borderRight: `2.5px solid ${billed ? AMBER : colors.muted}`, borderBottom: `2.5px solid ${billed ? AMBER : colors.muted}`, borderRadius: '0 0 10px 10px', opacity: billed ? 1 : 0.3, transition: `all 420ms ${EASE}` }} />
      </At>
      <At x={(cx(2) + cx(3)) / 2} y={280} cx>
        <Label tone={billed ? 'warn' : 'muted'} size={14} strong mono>
          BILLED ONLY WHILE IT RUNS
        </Label>
      </At>
    </>
  )
}

export function FaasTimeline({ lesson }: { lesson: string }) {
  return <FigureOnly id="faas-timeline" kicker="FaaS And Serverless" title="Pay Per Execution" lesson={lesson} figure={<LifeScene />} h={360} />
}

/* ================================================================== 37 · a cab for one trip */

/**
 * The TR's analogy (2026-10-27): an owned car stands idle in its bay; the traveller books a cab only when
 * travel is needed, it arrives, the meter over its roof runs only for that ride, the cab leaves.
 */
function OneTripScene() {
  const t = useLoop(LAP, { mode: 'sawtooth', still: 0.62 })
  const LANE = AN_W - 48
  const CAB = 140
  const STOP = (LANE - CAB) / 2
  const cabX = within(t, 0.05, 0.3) * STOP + within(t, 0.46, 0.86) * STOP
  const cabOn = within(t, 0.0, 0.1) * (1 - within(t, 0.86, 0.95))
  const boarded = within(t, 0.32, 0.42)
  const trip = within(t, 0.46, 0.86)
  const running = t > 0.46 && t < 0.86
  return (
    <>
      <At x={100} y={26} cx>
        <Col gap={6}>
          <div style={{ opacity: 0.55 }}>
            <ClayParkedCar w={112} />
          </div>
          <Label size={14} tone="muted">
            Owned car, idle
          </Label>
        </Col>
      </At>
      <At x={340} y={22} cx>
        <Col gap={4}>
          <div style={{ opacity: 1 - boarded * 0.6 }}>
            <Icon3D name="student-bag" w={40} />
          </div>
          <Label size={14} tone="brand" strong>
            Booked only when needed
          </Label>
        </Col>
      </At>
      <At x={24} y={138}>
        <div className="relative" style={{ width: LANE, height: 128 }}>
          <div style={{ position: 'absolute', left: 0, bottom: 0 }}>
            <Road w={LANE} />
          </div>
          <div style={{ position: 'absolute', left: 0, bottom: 14, transform: `translateX(${cabX}px)`, opacity: cabOn }}>
            <Col gap={2}>
              <div className="flex items-center" style={{ gap: 6, opacity: running ? 1 : 0.5, transition: `opacity 420ms ${EASE}` }}>
                <ClayMeter w={34} value={trip} />
                <Label size={14} tone={running ? 'brand' : 'muted'} strong={running}>
                  Pay just for that ride
                </Label>
              </div>
              <ClayTaxi w={CAB} />
            </Col>
          </div>
        </div>
      </At>
    </>
  )
}

/** On the same clock: a trigger fires, the function block appears on the provider's platform, its meter runs, it is torn down. */
function OneRunScene() {
  const t = useLoop(LAP, { mode: 'sawtooth', still: 0.62 })
  const flash = pulse(t, 0.28, 0.31, 0.38, 0.46)
  const instance = pulse(t, 0.32, 0.42, 0.86, 0.92)
  const run = within(t, 0.46, 0.86)
  const running = t > 0.46 && t < 0.86
  return (
    <>
      <At x={150} y={24} cx>
        <div style={{ opacity: 0.25 + flash * 0.75, transition: `opacity 300ms ${EASE}` }}>
          <Bolt w={50} burst={flash} />
        </div>
      </At>
      <At x={186} y={56} cy>
        <Label size={14} tone="plain" strong>
          Trigger
        </Label>
      </At>
      <At x={AN_W / 2} y={104} cx>
        <Col gap={0}>
          <div className="flex items-end" style={{ gap: 40, marginBottom: -2 }}>
            <FnCube w={88} on={instance} />
            <div style={{ opacity: running ? 1 : 0.5, transition: `opacity 420ms ${EASE}` }}>
              <ClayMeter w={56} value={run} />
            </div>
          </div>
          <Plinth w={250} h={26} tone={PROVIDER} />
        </Col>
      </At>
      <At x={AN_W / 2} y={236} cx>
        <Label size={14} tone="brand" strong>
          Billing counts only execution time
        </Label>
      </At>
    </>
  )
}

export function FaasAnalogy({ lesson }: { lesson: string }) {
  return <IsoAnalogy id="faas-analogy" kicker="FaaS And Serverless" lesson={lesson} text="Booking a cab only when travel is needed and paying just for that ride, instead of owning an idle car, mirrors FaaS: code runs only on a trigger and billing counts only execution time." everyday={{ label: 'A cab only when travel is needed', scene: <OneTripScene /> }} cloud={{ label: 'FaaS: code runs only on a trigger', scene: <OneRunScene /> }} />
}

/* ================================================================== 38 · the model service */

/** The provider's model service as one block: GPU racks and the model's brain on a raised plate, glowing while they work. */
function ModelService({ rackW, brainW, busy, plinth }: { rackW: number; brainW: number; busy: number; plinth: number }) {
  return (
    <Col gap={0}>
      <div className="relative flex items-end" style={{ gap: 14, marginBottom: -4 }}>
        <Glow w={brainW * 1.5} h={brainW * 1.2} on={busy} style={{ right: -brainW * 0.25, top: -brainW * 0.12 }} />
        {[0, 1].map((i) => (
          <ClayRack key={i} w={rackW} units={['run', 'run', 'run', 'run']} />
        ))}
        <Icon3D name="ai-brain" w={brainW} shadow={false} />
      </div>
      <Plinth w={plinth} h={26} />
    </Col>
  )
}

/**
 * The model service on the left (GPU racks and a trained model, the
 * provider's), its API at its right edge; the user's input data on the right.
 * A request runs in to the API, the service works, a result runs back.
 */
function ModelServiceScene() {
  const t = useLoop(LAP, { mode: 'sawtooth', still: 0.3 })
  const reqOn = t > 0.08 && t < 0.36
  const busy = pulse(t, 0.3, 0.38, 0.58, 0.66)
  const resOn = t > 0.6 && t < 0.88
  const API_R = 410
  const USER_L = 506
  const req: [number, number][] = [[USER_L, 206], [API_R, 206]]
  const res: [number, number][] = [[API_R, 236], [USER_L, 236]]
  return (
    <>
      <At x={100} y={122} cx>
        <Label tone="brand" size={14} strong mono>
          GPUs
        </Label>
      </At>
      <At x={30} y={152}>
        <ModelService rackW={64} brainW={128} busy={busy} plinth={312} />
      </At>
      <At x={364} y={221} cx cy>
        <Label tone="solid" size={14} strong mono>
          API
        </Label>
      </At>
      <Arrow x1={req[0][0]} y1={req[0][1]} x2={req[1][0]} y2={req[1][1]} tone={PROVIDER} on />
      <Arrow x1={res[0][0]} y1={res[0][1]} x2={res[1][0]} y2={res[1][1]} tone={PROVIDER} dashed />
      <Traveller path={req} run={reqOn} k="req" size={12} tone={AMBER} dur={2.2} />
      <Traveller path={res} run={resOn} k="res" size={12} tone={PROVIDER} dur={2.2} />
      <At x={556} y={70} cx>
        <Icon3D name="woman-pro" w={54} />
      </At>
      <At x={556} y={190} cx>
        <Col gap={10}>
          <Icon3D name="folder" w={86} />
          <Label tone="warn" size={14} strong>
            Input data
          </Label>
        </Col>
      </At>
    </>
  )
}

export function AiMl({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="aiml"
      kicker="AI ML As Service"
      title="Pre-Built Intelligence APIs"
      lead="AI/ML-as-a-Service (Artificial Intelligence, Machine Learning as a Service) exposes pre-trained vision, language and forecasting models through a plain API call"
      lesson={lesson}
      points={['Representative services: Amazon Rekognition, Comprehend (pre-built APIs)', 'Provider manages model training, GPUs (Graphics Processing Units) and hosting', 'User manages input data and API integration only', 'Used in vision, chatbots, fraud and forecasting']}
      figure={<ModelServiceScene />}
      pointSize={17}
    />
  )
}

/* ================================================================== 39 · the round trip */

/** The application's laptop on the left, the model service on the right; the API call runs along the upper lane, the prediction comes back along the lower one. */
function RoundTripScene() {
  const t = useLoop(LAP, { mode: 'sawtooth', still: 0.22 })
  const callOn = t > 0.04 && t < 0.4
  const think = pulse(t, 0.36, 0.42, 0.56, 0.64)
  const retOn = t > 0.58 && t < 0.94
  const L = 352
  const R = 664
  const fwd: [number, number][] = [[L, 160], [R, 160]]
  const back: [number, number][] = [[R, 210], [L, 210]]
  return (
    <>
      <At x={240} y={104} cx>
        <Col gap={0}>
          <div style={{ marginBottom: -6 }}>
            <ClayLaptop w={180} lit={callOn || retOn} />
          </div>
          <Plinth w={220} h={24} tone={lift(AMBER, 0.55)} />
        </Col>
      </At>
      <At x={240} y={268} cx>
        <Label size={16} strong tone="warn">
          Application
        </Label>
      </At>
      <Arrow x1={fwd[0][0]} y1={fwd[0][1]} x2={fwd[1][0]} y2={fwd[1][1]} tone={PROVIDER} on />
      <Arrow x1={back[0][0]} y1={back[0][1]} x2={back[1][0]} y2={back[1][1]} tone={PROVIDER} dashed />
      <Traveller path={fwd} run={callOn} k="call" size={13} tone={AMBER} dur={2.8} />
      <Traveller path={back} run={retOn} k="ret" size={13} tone={PROVIDER} dur={2.8} />
      <At x={(L + R) / 2} y={118} cx>
        <Label size={15} strong tone={callOn ? 'brand' : 'plain'}>
          API call
        </Label>
      </At>
      <At x={(L + R) / 2} y={226} cx>
        <Label size={15} strong tone={retOn ? 'brand' : 'plain'}>
          Prediction returned
        </Label>
      </At>
      <At x={858} y={28} cx>
        <Label size={16} strong tone="brand">
          Pre-trained model service
        </Label>
      </At>
      <At x={858} y={76} cx>
        <ModelService rackW={78} brainW={166} busy={think} plinth={384} />
      </At>
      <At x={858} y={282} cx>
        <div className="flex justify-center gap-2">
          <Label size={14} strong mono tone="brand">
            AMAZON SAGEMAKER
          </Label>
          <Label size={14} strong mono tone="brand">
            REKOGNITION
          </Label>
        </div>
      </At>
    </>
  )
}

export function AiMlFlow({ lesson }: { lesson: string }) {
  return <FigureOnly id="aiml-flow" kicker="AI ML As Service" title="Pre-Built Intelligence APIs" lesson={lesson} figure={<RoundTripScene />} h={360} />
}

/* ================================================================== 40 · one consultation, no hospital */

/** The patient walks up to the specialist, asks, is answered, leaves; the hospital behind is a dashed outline, never built. */
function ConsultScene() {
  const t = useLoop(LAP, { mode: 'sawtooth', still: 0.44 })
  const walk = within(t, 0.05, 0.3)
  const leave = within(t, 0.74, 0.96)
  const askOn = t > 0.36 && t < 0.5
  const ansOn = t > 0.54 && t < 0.68
  const px = (walk - leave) * 44
  const ask: [number, number][] = [[156, 150], [204, 144]]
  const ans: [number, number][] = [[204, 164], [156, 170]]
  return (
    <>
      <At x={36} y={118}>
        <div style={{ transform: `translateX(${px}px)` }}>
          <Icon3D name="student-bag" w={70} />
        </div>
      </At>
      <Traveller path={ask} run={askOn} k="ask" size={11} tone={AMBER} dur={1} />
      <Traveller path={ans} run={ansOn} k="ans" size={11} tone={PROVIDER} dur={1} />
      <At x={256} y={76} cx>
        <Col gap={8}>
          <Icon3D name="beyond-scientist" w={112} />
          <Label size={14} tone="brand" strong>
            Specialist doctor
          </Label>
        </Col>
      </At>
      <At x={392} y={104} cx>
        <Col gap={12}>
          <GhostHospital w={92} />
          <Label size={14} tone="muted">
            No hospital built
          </Label>
        </Col>
      </At>
    </>
  )
}

/** On the same clock: the app's laptop calls the model API on the provider's GPUs; the racks on the user's own side are only a dashed outline. */
function ApiCallScene() {
  const t = useLoop(LAP, { mode: 'sawtooth', still: 0.44 })
  const callOn = t > 0.36 && t < 0.5
  const ansOn = t > 0.54 && t < 0.68
  const busy = pulse(t, 0.48, 0.52, 0.56, 0.6)
  const fwd: [number, number][] = [[184, 196], [256, 164]]
  const back: [number, number][] = [[256, 190], [184, 222]]
  return (
    <>
      <At x={110} y={30} cx>
        <Col gap={10}>
          <GhostRacks w={100} />
          <Label size={14} tone="muted">
            No model built
          </Label>
        </Col>
      </At>
      <At x={110} y={170} cx>
        <Col gap={0}>
          <div style={{ marginBottom: -6 }}>
            <ClayLaptop w={118} lit={callOn || ansOn} />
          </div>
          <Plinth w={150} h={18} tone={lift(AMBER, 0.55)} />
        </Col>
      </At>
      <Arrow x1={fwd[0][0]} y1={fwd[0][1]} x2={fwd[1][0]} y2={fwd[1][1]} tone={callOn ? PROVIDER : colors.line} />
      <Arrow x1={back[0][0]} y1={back[0][1]} x2={back[1][0]} y2={back[1][1]} tone={ansOn ? PROVIDER : colors.line} dashed />
      <Traveller path={fwd} run={callOn} k="call" size={11} tone={AMBER} dur={1} />
      <Traveller path={back} run={ansOn} k="ans" size={11} tone={PROVIDER} dur={1} />
      <At x={350} y={64} cx>
        <Col gap={0}>
          <div className="relative flex items-end" style={{ gap: 12, marginBottom: -4 }}>
            <Glow w={200} h={150} on={busy} style={{ left: -22, top: -20 }} />
            {[0, 1].map((i) => (
              <ClayRack key={i} w={74} units={['run', 'run', 'run', 'run']} />
            ))}
          </div>
          <Plinth w={186} h={24} />
        </Col>
      </At>
      <At x={350} y={226} cx>
        <Label size={14} tone="brand" strong>
          Provider's trained model
        </Label>
      </At>
    </>
  )
}

export function AiMlAnalogy({ lesson }: { lesson: string }) {
  return <IsoAnalogy id="aiml-analogy" kicker="AI ML As Service" lesson={lesson} text="Consulting a specialist doctor for one diagnosis instead of building a hospital, paying only for that consultation, just as AI/ML-as-a-Service delivers intelligence via API without building the model." everyday={{ label: 'One diagnosis, pay only for that consultation', scene: <ConsultScene /> }} cloud={{ label: 'AI/ML-as-a-Service: intelligence via API', scene: <ApiCallScene /> }} />
}

/* ================================================================== 41 · the full spectrum */

/** A `Provider manages` cell: its words on a brand tint that deepens row by row (the TR's "shading intensity rising"). */
function Tint({ k, children }: { k: number; children: ReactNode }) {
  const a = 0.1 + k * 0.12
  return (
    <span className="inline-block rounded-md px-2.5 py-0.5" style={{ background: `rgba(45,99,251,${a.toFixed(2)})`, color: k >= 3 ? colors.white : colors.ink }}>
      {children}
    </span>
  )
}

export function Responsibility({ lesson }: { lesson: string }) {
  return (
    <TableCard
      id="responsibility"
      kicker="Full Responsibility Spectrum"
      title="Provider Vs User"
      lead="Moving from IaaS toward SaaS steadily shifts management from user to provider; FaaS and AI/ML-as-a-Service remove the server concept, but the user still manages function code or input data respectively"
      lesson={lesson}
      columns={[
        { label: 'Model', weight: 0.9 },
        { label: 'Provider manages', weight: 1.4 },
        { label: 'User manages', weight: 1.4 },
      ]}
      rows={[
        ['IaaS', <Tint k={0}>Hardware, virtualization, network</Tint>, 'OS, runtime, applications, data'],
        ['PaaS', <Tint k={1}>+ OS, runtime, middleware</Tint>, 'Application code, data'],
        ['SaaS', <Tint k={2}>Entire application stack</Tint>, 'Configuration, user data'],
        ['FaaS / Serverless', <Tint k={3}>Servers, OS, runtime, scaling</Tint>, 'Function code, triggers, logic'],
        ['AI/ML-as-a-Service', <Tint k={4}>Model training, hosting, GPUs</Tint>, 'Input data, API integration'],
      ]}
      compact
    />
  )
}
