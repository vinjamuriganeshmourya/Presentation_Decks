import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { Arrow, At, Label, useLoop } from '../scene'
import { ClaySvg } from '../art'
import { R, Shadow, BlurDef, usePrefix } from '../depth'
import { ClayBalance, ClayBill, ClayBook, ClayCoins, ClayDataCentre, ClayInstitution, ClayLaptop, ClayPadlock, ClayTools, Icon3D, LAB, TenantTile } from '../d3/kit'
import { pulse, within } from './iso'
import { FigureOnly, IsoAnalogy, MARKS, Mark, PointsFigure, Tiles } from './frames'

/**
 * SECTION 2 · MULTI-CLOUD (reference frames 18 to 22), in session 1's 3D look
 * (2026-10-26: the isometric drawings retired).
 *
 * The TR's branching diagram (one company, three providers' data centres, each
 * connector carrying its workload), multi-cloud against hybrid side by side,
 * two banks for your savings against two providers, three motivations that
 * lift in turn, and the duplicated-marker grid whose rows stamp into all three
 * provider columns at once. Every object is a session 1 drawing or a library
 * render; labels are HTML chips; packets are dots riding the connectors.
 */

/** The customer's colour (the reference's amber, `ISO.customer`). */
const CUSTOMER = '#F5A623'
const EASE = 'all 420ms cubic-bezier(0.22,1,0.36,1)'

type Pt = [number, number]
type MarkKey = keyof typeof MARKS
const MARK_H: Record<MarkKey, number> = { aws: 32, azure: 24, gcp: 18 }

/** A point a fraction `t` (0..1) of the way along a polyline. */
function along(pts: Pt[], t: number): Pt {
  const segs = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]))
  let d = Math.max(0, Math.min(1, t)) * segs.reduce((a, b) => a + b, 0)
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const f = segs[i] ? Math.min(1, d / segs[i]) : 0
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f]
    }
    d -= segs[i]
  }
  return pts[pts.length - 1]
}

/** A packet: a dot riding a connector, placed by transform only. */
function Packet({ pts, t, tone = colors.brand, size = 10, on = true }: { pts: Pt[]; t: number; tone?: string; size?: number; on?: boolean }) {
  const [x, y] = along(pts, t)
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute rounded-full"
      style={{ left: -size / 2, top: -size / 2, width: size, height: size, background: tone, boxShadow: `0 0 0 4px ${tone}40`, transform: `translate(${x}px, ${y}px)`, opacity: on ? 1 : 0, transition: 'opacity 240ms' }}
    />
  )
}

/** Plain connector lines (no head) on the stage: a trunk, a split. */
function Lines({ segs, tone = colors.brand, width = 2.5, dashed = false, opacity = 1 }: { segs: Pt[][]; tone?: string; width?: number; dashed?: boolean; opacity?: number }) {
  return (
    <svg aria-hidden className="pointer-events-none absolute left-0 top-0" width={1} height={1} style={{ overflow: 'visible' }}>
      {segs.map((s, i) => (
        <polyline key={i} points={s.map((p) => p.join(',')).join(' ')} fill="none" stroke={tone} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dashed ? '6 7' : undefined} style={{ opacity, transition: EASE }} />
      ))}
    </svg>
  )
}

/** A provider's mark on a white pill (the mark is the name: AWS, Azure, Google Cloud). */
function MarkPill({ m, scale = 1, opacity = 1 }: { m: MarkKey; scale?: number; opacity?: number }) {
  return (
    <span className="inline-flex items-center rounded-xl px-2.5 py-1.5" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #EEF3FD 100%)', boxShadow: 'inset 0 0 0 1.5px #C3D3F0, 0 8px 16px -10px rgba(16,32,58,0.35)', opacity, transition: EASE }}>
      <img src={MARKS[m].src} alt={MARKS[m].alt} draggable={false} className="w-auto select-none" style={{ height: MARK_H[m] * scale }} />
    </span>
  )
}

/* ================================================================== 18 · multi-cloud defined */

const WORK: { m: MarkKey; line: string }[] = [
  { m: 'aws', line: 'AWS handles general-purpose compute and storage workloads' },
  { m: 'azure', line: 'Azure serves Microsoft-integrated enterprise applications' },
  { m: 'gcp', line: 'GCP powers data analytics and AI/ML pipelines' },
]

/** The TR's branching diagram: your company on the left, a trunk that splits three ways, each branch carrying its workload line to its provider's data centre; packets on all three at once. */
function MultiScene() {
  const t = useLoop(6000, { mode: 'sawtooth', still: 0.42 })
  const rows = [68, 190, 312]
  const CX = 140
  const CY = 190
  const TRUNK = 205
  const SPLIT = 265
  const END = 788
  const DC = 850
  const path = (y: number): Pt[] => [[TRUNK, CY], [SPLIT, CY], [SPLIT, y], [END, y]]
  return (
    <>
      <Lines segs={[[[TRUNK, CY], [SPLIT, CY]], [[SPLIT, rows[0]], [SPLIT, rows[2]]]]} />
      {rows.map((y) => (
        <Arrow key={y} x1={SPLIT} y1={y} x2={END} y2={y} />
      ))}
      {rows.map((y) => [0, 0.5].map((o) => <Packet key={`${y}-${o}`} pts={path(y)} t={(t + o) % 1} />))}
      <At x={CX} y={CY} cx cy>
        <TenantTile w={110} tone={CUSTOMER} />
      </At>
      <At x={CX} y={CY + 66} cx>
        <Label size={16} strong>
          Your company
        </Label>
      </At>
      {WORK.map((w, i) => (
        <At key={w.m} x={(SPLIT + END) / 2} y={rows[i] - 22} cx cy>
          <Label size={15} strong tone="brand">
            {w.line}
          </Label>
        </At>
      ))}
      {rows.map((y) => (
        <At key={y} x={DC} y={y} cx cy>
          <ClayDataCentre w={110} />
        </At>
      ))}
      {WORK.map((w, i) => (
        <At key={w.m} x={DC + 75} y={rows[i]} cy>
          <MarkPill m={w.m} />
        </At>
      ))}
    </>
  )
}

export function MultiCloud({ lesson }: { lesson: string }) {
  return <FigureOnly id="multicloud" kicker="Multi-Cloud Defined" title="Multiple Providers Together" lead="Multi-cloud means running workloads across two or more independent public providers at once, unlike hybrid cloud, which mixes public with private infrastructure" lesson={lesson} figure={<MultiScene />} h={380} />
}

/* ================================================================== 19 · multi-cloud against hybrid */

const HALF = 555
const VS_H = 420

/** Left: one company linked to three distinct providers' data centres, each with its own mark. */
function MultiSide({ t }: { t: number }) {
  const rows = [140, 245, 350]
  const CY = 245
  const TRUNK = 147
  const SPLIT = 195
  const END = 266
  const DC = 320
  const path = (y: number): Pt[] => [[TRUNK, CY], [SPLIT, CY], [SPLIT, y], [END, y]]
  return (
    <>
      <At x={HALF / 2} y={28} cx>
        <Label size={17} strong>
          Multi-Cloud Strategy
        </Label>
      </At>
      <Lines segs={[[[TRUNK, CY], [SPLIT, CY]], [[SPLIT, rows[0]], [SPLIT, rows[2]]]]} />
      {rows.map((y) => (
        <Arrow key={y} x1={SPLIT} y1={y} x2={END} y2={y} />
      ))}
      {rows.map((y) => (
        <Packet key={y} pts={path(y)} t={t} size={9} />
      ))}
      <At x={95} y={CY} cx cy>
        <TenantTile w={96} tone={CUSTOMER} />
      </At>
      {rows.map((y) => (
        <At key={y} x={DC} y={y} cx cy>
          <ClayDataCentre w={96} />
        </At>
      ))}
      {(['aws', 'azure', 'gcp'] as MarkKey[]).map((m, i) => (
        <At key={m} x={DC + 64} y={rows[i]} cy>
          <MarkPill m={m} scale={0.92} />
        </At>
      ))}
    </>
  )
}

/** Right: a locked private site bridged both ways to one public data centre. */
function HybridSide({ t }: { t: number }) {
  const PX = 690
  const PUB = 960
  const CY = 235
  const there: Pt[] = [[786, CY - 16], [877, CY - 16]]
  const back: Pt[] = [[877, CY + 16], [786, CY + 16]]
  return (
    <>
      <At x={HALF + HALF / 2} y={28} cx>
        <Label size={17} strong>
          Hybrid Cloud Strategy
        </Label>
      </At>
      <At x={PX} y={CY} cx cy>
        <div className="relative grid place-items-center" style={{ width: 176, height: 140, borderRadius: 22, background: `linear-gradient(180deg, #FFFFFF 0%, ${CUSTOMER}14 100%)`, boxShadow: `inset 0 0 0 2px ${CUSTOMER}, 0 14px 26px -18px rgba(16,32,58,0.45)` }}>
          <TenantTile w={84} tone={CUSTOMER} />
          <div className="absolute" style={{ left: 14, bottom: 12 }}>
            <ClayPadlock w={30} />
          </div>
        </div>
      </At>
      <At x={PX} y={CY + 82} cx>
        <Label size={15} strong>
          Private Cloud
        </Label>
      </At>
      <Arrow x1={there[0][0]} y1={there[0][1]} x2={there[1][0]} y2={there[1][1]} />
      <Arrow x1={back[0][0]} y1={back[0][1]} x2={back[1][0]} y2={back[1][1]} />
      <Packet pts={there} t={t} size={9} />
      <Packet pts={back} t={(t + 0.5) % 1} size={9} />
      <At x={PUB} y={CY} cx cy>
        <ClayDataCentre w={150} />
      </At>
      <At x={PUB} y={CY + 68} cx>
        <Label size={15} strong tone="brand">
          Public Cloud
        </Label>
      </At>
    </>
  )
}

function VsScene() {
  const t = useLoop(6000, { mode: 'sawtooth', still: 0.4 })
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute" style={{ left: HALF - 1, top: 24, bottom: 24, borderLeft: `2px dashed ${colors.line}` }} />
      <MultiSide t={t} />
      <HybridSide t={t} />
    </>
  )
}

export function MultiVsHybrid({ lesson }: { lesson: string }) {
  return <FigureOnly id="multi-vs-hybrid" kicker="Multi-Cloud Defined" title="Multiple Providers Together" lesson={lesson} figure={<VsScene />} h={VS_H} />
}

/* ================================================================== 20 · two banks for your savings */

const BANK_LAP = 9000
const BANK_STILL = 0.7

/** Shut 0..1 over the lap: comes down at 0.3..0.42, stays, lifts at the lap's end. */
const shutOf = (t: number) => pulse(t, 0.3, 0.42, 0.93, 0.99)

/** A bank's roller shutter over the institution's columns (its wall is x 14..106, y 34..84 of a 120-wide drawing), rolled down by scaleY from the top. */
function Shutter({ k }: { k: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: 14,
        top: 34,
        width: 92,
        height: 50,
        borderRadius: 5,
        background: `linear-gradient(160deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0) 55%), repeating-linear-gradient(180deg, ${LAB.red} 0px, ${LAB.red} 6px, #A9241F 6px, #A9241F 8px)`,
        boxShadow: '0 6px 12px -8px rgba(26,44,92,0.6)',
        transformOrigin: '50% 0%',
        transform: `scaleY(${k})`,
      }}
    />
  )
}

/** Savings go into both banks; one bank's shutter comes down; the person still withdraws from the other. */
function BanksScene() {
  const t = useLoop(BANK_LAP, { mode: 'sawtooth', still: BANK_STILL })
  const k = shutOf(t)
  const B = [100, 370]
  /* review 2026-10-26 (connections): the saver's paths run from his hands to each bank's coins; they ended in
     the empty space under the banks */
  const toBank: Pt[][] = [
    [[208, 200], [122, 170]],
    [[262, 200], [348, 170]],
  ]
  const deposit = within(t, 0.03, 0.25)
  const draw = within(t, 0.52, 0.88)
  return (
    <div className="relative h-full w-full">
      <Lines segs={[toBank[0]]} tone={R.shadow} width={1.8} dashed opacity={0.4 - 0.25 * k} />
      <Lines segs={[toBank[1]]} tone={R.shadow} width={1.8} dashed opacity={0.4} />
      {toBank.map((p, i) => (
        <Packet key={i} pts={p} t={deposit} tone={LAB.yellow} size={12} on={t < 0.27} />
      ))}
      <Packet pts={[...toBank[1]].reverse()} t={draw} tone={LAB.yellow} size={12} on={t > 0.5 && t < 0.9} />
      {B.map((x, i) => (
        <At key={x} x={x} y={40} cx>
          <div className="relative" style={{ opacity: i === 0 ? 1 - 0.3 * k : 1, transition: 'opacity 200ms' }}>
            <ClayInstitution w={120} tone={LAB.cobalt} />
            {i === 0 && <Shutter k={k} />}
          </div>
        </At>
      ))}
      {B.map((x, i) => (
        <At key={x} x={x} y={150} cx>
          <div style={{ opacity: i === 0 ? 1 - 0.45 * k : 1 }}>
            <ClayCoins w={40} n={3} />
          </div>
        </At>
      ))}
      <At x={235} y={162} cx>
        <Icon3D name="man-pro" w={62} />
      </At>
    </div>
  )
}

/** Traffic goes to two providers; one goes dark; the traffic reroutes to the other. */
function TwoProvidersScene() {
  const t = useLoop(BANK_LAP, { mode: 'sawtooth', still: BANK_STILL })
  const k = shutOf(t)
  const dark = k > 0.5
  const plats: { x: number; m: MarkKey }[] = [
    { x: 115, m: 'aws' },
    { x: 355, m: 'gcp' },
  ]
  /* review 2026-10-26 (connections): from the laptop's top corners (y 206) to each data centre's foot (y 175) */
  const links: Pt[][] = [
    [[212, 208], [150, 174]],
    [[258, 208], [320, 174]],
  ]
  const flow = (t * 5) % 1
  return (
    <div className="relative h-full w-full">
      <Arrow x1={links[0][0][0]} y1={links[0][0][1]} x2={links[0][1][0]} y2={links[0][1][1]} tone={dark ? colors.line : colors.brand} />
      <Arrow x1={links[1][0][0]} y1={links[1][0][1]} x2={links[1][1][0]} y2={links[1][1][1]} width={dark ? 3.2 : 2.5} />
      <Packet pts={links[0]} t={flow} size={9} on={!dark} />
      <Packet pts={links[1]} t={flow} size={9} />
      <Packet pts={links[1]} t={(flow + 0.5) % 1} size={9} on={dark} />
      {plats.map((p, i) => (
        <At key={p.m} x={p.x} y={48} cx cy>
          <MarkPill m={p.m} scale={0.85} opacity={i === 0 ? 1 - 0.65 * k : 1} />
        </At>
      ))}
      {plats.map((p, i) => (
        <At key={p.m} x={p.x} y={80} cx>
          <div style={{ opacity: i === 0 ? 1 - 0.65 * k : 1, transition: 'opacity 200ms' }}>
            <ClayDataCentre w={130} />
          </div>
        </At>
      ))}
      <At x={235} y={206} cx>
        <ClayLaptop w={96} />
      </At>
    </div>
  )
}

export function MultiAnalogy({ lesson }: { lesson: string }) {
  return <IsoAnalogy id="multicloud-analogy" kicker="Multi-Cloud Defined" lesson={lesson} everyday={{ label: 'Two banks for your savings', scene: <BanksScene /> }} cloud={{ label: 'Multi-cloud', scene: <TwoProvidersScene /> }} claim="One fails, the work carries on" />
}

/* ================================================================== 21 · motivations */

/** A shield with a tick (resilience), in session 1's clay: a cobalt volume lit from the upper left, a specular, a white tick, a cool ground shadow. */
function ClayShield({ w }: { w: number }) {
  const id = usePrefix()
  const d = 'M 40 6 L 70 17 V 42 C 70 62 57 76 40 84 C 23 76 10 62 10 42 V 17 Z'
  return (
    <ClaySvg w={w} vw={80} vh={96}>
      <defs>
        <linearGradient id={`${id}-body`} x1={0} y1={0} x2={0.2} y2={1}>
          <stop offset="0" stopColor={R.cloudMid} />
          <stop offset="1" stopColor={R.cloudUnder} />
        </linearGradient>
        <linearGradient id={`${id}-lit`} x1={0} y1={0} x2={0.4} y2={1}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.45} />
          <stop offset="0.55" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        <radialGradient id={`${id}-spec`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.85} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
        <BlurDef id={id} sd={3} />
      </defs>
      <Shadow id={id} cx={40} cy={91} rx={28} ry={3.2} o={0.26} />
      <g>
        <path d={d} fill={R.cloudUnder} transform="translate(2.5 3)" />
        <path d={d} fill={`url(#${id}-body)`} />
        <path d={d} fill={`url(#${id}-lit)`} />
        <path d="M 40 13 L 63 22 V 42 C 63 58 53 69 40 76 Z" fill="#000000" opacity={0.08} />
        <ellipse cx={25} cy={24} rx={10} ry={6} fill={`url(#${id}-spec)`} />
        <path d="M 27 44 L 36 53 L 54 34" fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </ClaySvg>
  )
}

const TILE_W = Math.floor((1110 - 20 * 2) / 3)
const TILE_SCENE_H = 160

/** One motivation's object on its shadow; it lifts and lights during its third of the lap. */
function LiftScene({ i, art }: { i: number; art: (lift: number) => ReactNode }) {
  const t = useLoop(9000, { mode: 'sawtooth', still: 0.17 })
  const a = i / 3
  const lift = pulse(t, a + 0.02, a + 0.08, a + 0.25, a + 0.31)
  const glow: CSSProperties = { left: TILE_W / 2 - 90, top: 30, width: 180, height: 120, borderRadius: '50%', background: `radial-gradient(closest-side, ${colors.brand}24, ${colors.brand}00)`, opacity: lift }
  return (
    <div className="relative h-full w-full">
      <div aria-hidden className="pointer-events-none absolute" style={glow} />
      <At x={TILE_W / 2} y={140} cx style={{ transform: 'translate(-50%, -100%)' }}>
        <div style={{ transform: `translateY(${-lift * 12}px)`, opacity: 0.78 + 0.22 * lift }}>{art(lift)}</div>
      </At>
    </div>
  )
}

export function Motivations({ lesson }: { lesson: string }) {
  return (
    <Tiles
      id="motivations"
      kicker="Multi-Cloud Motivations"
      title="Resilience Negotiation Regulation"
      lead="Three business pressures push organizations toward multiple providers even though it adds complexity"
      lesson={lesson}
      sceneH={TILE_SCENE_H}
      h={300}
      tiles={[
        { title: 'Resilience', sub: 'A second provider keeps services running during an outage', scene: <LiftScene i={0} art={() => <ClayShield w={80} />} /> },
        { title: 'Negotiation leverage', sub: 'Comparing quotes across vendors avoids one-sided pricing', scene: <LiftScene i={1} art={(l) => <ClayBalance w={150} tilt={-7 * l} />} /> },
        { title: 'Regulation', sub: 'In-country hosting or concentration-risk rules may require a compliant region or a second provider', scene: <LiftScene i={2} art={() => <ClayInstitution w={116} tone={LAB.cobalt} />} /> },
      ]}
    />
  )
}

/* ================================================================== 22 · operational overhead */

const ROWS = ['Skills', 'Tooling', 'Billing', 'Security'] as const
const COLS: MarkKey[] = ['aws', 'azure', 'gcp']
const COL_X = [230, 375, 520]
const ROW_Y = [110, 178, 246, 314]
const CELL_W = 104
const CELL_H = 60

/** Each row's marker: a book (skills), tools (tooling), a bill (billing), a padlock (security). */
const MARKER: ReactNode[] = [<ClayBook w={50} />, <ClayTools w={40} />, <ClayBill w={32} />, <ClayPadlock w={36} />]

/** The TR's duplicated-marker grid: four rows by three providers; each row's marker stamps into all three cells together, row by row. */
function OverheadScene() {
  const t = useLoop(9000, { mode: 'sawtooth', still: 0.86 })
  return (
    <>
      {COLS.map((m, j) => (
        <At key={m} x={COL_X[j]} y={46} cx cy>
          <Mark src={MARKS[m].src} alt={MARKS[m].alt} h={MARK_H[m] * 0.85} />
        </At>
      ))}
      {ROWS.map((name, r) => (
        <At key={name} x={24} y={ROW_Y[r]} cy>
          <Label size={15} strong>
            {name}
          </Label>
        </At>
      ))}
      {ROWS.map((name, r) => {
        const a = 0.05 + r * 0.18
        const vis = within(t, a, a + 0.07) * (1 - within(t, 0.93, 0.99))
        const flash = pulse(t, a + 0.03, a + 0.07, a + 0.1, a + 0.16)
        return COLS.map((m, j) => (
          <At key={`${name}-${m}`} x={COL_X[j]} y={ROW_Y[r]} cx cy>
            <div
              className="grid place-items-center"
              style={{
                width: CELL_W,
                height: CELL_H,
                borderRadius: 16,
                background: `linear-gradient(180deg, #FFFFFF 0%, ${flash > 0.3 ? colors.surface2 : '#EEF3FD'} 100%)`,
                boxShadow: `inset 0 0 0 1.5px ${flash > 0.3 ? colors.brand : '#C3D3F0'}, 0 10px 18px -14px rgba(16,32,58,0.45)`,
                transition: EASE,
              }}
            >
              <div style={{ opacity: vis, transform: `translateY(${-(1 - vis) * 14}px)` }}>{MARKER[r]}</div>
            </div>
          </At>
        ))
      })}
    </>
  )
}

export function Overhead({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="overhead"
      kicker="Operational Overhead Cost"
      title="Managing Multiple Platforms"
      lead="Multi-cloud earns its resilience and leverage at a real operational price: every added provider multiplies what must be learned, managed and paid for"
      lesson={lesson}
      points={['Separate consoles, APIs and billing dashboards per provider', "Distinct certifications and skill sets needed for each platform's staff", 'Cross-cloud data transfer (egress) charges between providers', 'Duplicate monitoring, security and IAM (identity and access management) policies to maintain']}
      figure={<OverheadScene />}
    />
  )
}
