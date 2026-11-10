import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { Arrow, At, Label, useLoop } from '../scene'
import { ClaySvg } from '../art'
import { Slab, drop, lift, useFx } from '../clay-a'
import { Shadow } from '../depth'
import { TILE_SKIN } from '../card'
import { ClayBill, ClayCalculator, ClayClipboard, ClayCoin, ClayCoins, ClayDataCentre, ClayFlats, ClayHouse, ClayInstitution, ClayPhone, ClayRack, Icon3D, LAB, RichCloud } from '../d3/kit'
import type { UnitState } from '../art'
import { pulse, within } from './iso'
import { AN_W, FIG_W, FigureOnly, IsoAnalogy, MARKS, Mark, PointsFigure, TableCard, Tiles } from './frames'

/**
 * SECTION 5 · CLOUD ECONOMICS & PROVIDERS (reference frames 43 to 54).
 *
 * Rebuilt 2026-10-26 in session 1's 3D look (the user: the flat isometric
 * look is retired): front-facing solids with a lit top, a graded front, a
 * specular and a soft cool ground shadow, library renders and session 1's
 * drawn objects, HTML labels. Every scene keeps its clock and what its
 * motion says: a CapEx stack loses a slice a year while OpEx blocks arrive
 * month by month, the board's tick lands after the department's, coins and
 * invoices arrive monthly, hidden costs stack on a sticker price, the spot
 * tag is snatched back, the standby ticket steps aside when the train fills,
 * bars grow to the TR's own numbers, and a packet circles inside the
 * in-country zone and never leaves it. Labels are the reference's strings.
 */

const LAP = 8000
/** What the customer owns or brings: the deck's amber (`ISO.customer`). */
const CUSTOMER = '#F5A623'

/* ------------------------------------------------------------------ local objects, in session 1's finish */

/** Places a child by its bottom centre (an object standing on a baseline). */
function Foot({ x, y, children, style }: { x: number; y: number; children: ReactNode; style?: CSSProperties }) {
  return (
    <At x={x} y={y} style={{ transform: 'translate(-50%, -100%)', ...style }}>
      {children}
    </At>
  )
}

/** A glossy front-facing block: a graded front, a lit top face, a shaded side, a soft shadow. */
function Block({ w, h, hue, d = 12 }: { w: number; h: number; hue: string; d?: number }) {
  const fx = useFx({ b: hue })
  const dy = d * 0.55
  const VW = w + d + 4
  const VH = h + dy + 12
  return (
    <ClaySvg w={VW} vw={VW} vh={VH}>
      {fx.defs}
      <Shadow id={fx.id} cx={2 + (w + d) / 2} cy={dy + h + 4} rx={(w + d) * 0.5} ry={3.5} o={0.22} />
      <g>
        <Slab x={2} y={dy + 1} w={w} h={h} rx={Math.min(8, w / 6)} d={d} hue={hue} fill={fx.g('b')} />
      </g>
    </ClaySvg>
  )
}

type Layer = { h: number; hue: string; o?: number; ty?: number }

/** A rectangle with only the chosen corners rounded (a stack's outer corners; its joints stay square). */
function rectPath(x: number, y: number, w: number, h: number, rTop: number, rBot: number): string {
  return `M ${x} ${y + rTop} Q ${x} ${y} ${x + rTop} ${y} H ${x + w - rTop} Q ${x + w} ${y} ${x + w} ${y + rTop} V ${y + h - rBot} Q ${x + w} ${y + h} ${x + w - rBot} ${y + h} H ${x + rBot} Q ${x} ${y + h} ${x} ${y + h - rBot} Z`
}

/**
 * Slabs stacked bottom-up into one bar; each layer can fade (`o`) and move (`ty`) on its own; `ghost`
 * outlines the full stack. Review 2026-10-26 (joints): the layers meet edge to edge with square
 * corners, only the stack's outer corners are rounded, and each layer's side face is one strip of the
 * stack's side, so no notch opens at a joint; the ghost traces the stack's whole silhouette, front, top
 * and side, so it fits the slabs exactly.
 */
function Stack({ w, layers, d = 14, ghost = 0 }: { w: number; layers: Layer[]; d?: number; ghost?: number }) {
  const fx = useFx(Object.fromEntries(layers.map((l, i) => [`l${i}`, l.hue])))
  const dy = d * 0.55
  const total = layers.reduce((s, l) => s + l.h, 0)
  const VW = w + d + 4
  const VH = total + dy + 12
  const base = dy + 1 + total
  const top = base - total
  const x = 2
  const R = 5
  const last = layers.length - 1
  let y = base
  return (
    <ClaySvg w={VW} vw={VW} vh={VH}>
      {fx.defs}
      <Shadow id={fx.id} cx={2 + (w + d) / 2} cy={base + 3} rx={(w + d) * 0.52} ry={4} o={0.22 * (layers[0]?.o ?? 1)} />
      <path
        d={`M ${x} ${base} V ${top} L ${x + d} ${top - dy} H ${x + w + d} V ${base - dy} L ${x + w} ${base} Z`}
        fill="none"
        stroke={colors.brand}
        strokeWidth={1.6}
        strokeDasharray="6 5"
        strokeLinejoin="round"
        opacity={ghost * 0.55}
        data-flat
      />
      {layers.map((l, i) => {
        y -= l.h
        const rTop = i === last ? R : 0
        const rBot = i === 0 ? R : 0
        return (
          <g key={i} style={{ opacity: l.o ?? 1, transform: `translateY(${l.ty ?? 0}px)` }}>
            <path d={`M ${x + w} ${y} L ${x + w + d} ${y - dy} L ${x + w + d} ${y + l.h - dy} L ${x + w} ${y + l.h} Z`} fill={drop(l.hue, 0.3)} />
            <path d={`M ${x} ${y} L ${x + d} ${y - dy} L ${x + w + d} ${y - dy} L ${x + w} ${y} Z`} fill={lift(l.hue, 0.48)} />
            <path d={rectPath(x, y, w, l.h, rTop, rBot)} fill={fx.g(`l${i}`)} />
            <rect x={x} y={y} width={w} height={1.2} fill="#FFFFFF" opacity={i === last ? 0 : 0.28} />
            <ellipse cx={x + w * 0.3} cy={y + Math.min(l.h * 0.16, 10)} rx={w * 0.2} ry={Math.min(l.h * 0.07, 5)} fill="#FFFFFF" opacity={0.14} />
          </g>
        )
      })}
    </ClaySvg>
  )
}

/** A gold price tag on its string: a graded tag with a punched hole, two printed lines and a specular. */
function PriceTag({ w, hue = LAB.yellow }: { w: number; hue?: string }) {
  const fx = useFx({ tag: hue })
  return (
    <ClaySvg w={w} vw={60} vh={88}>
      {fx.defs}
      <Shadow id={fx.id} cx={30} cy={85} rx={24} ry={2.5} o={0.2} />
      <g>
        <path d="M 30 18 L 52 36 Q 55 39 55 43 V 76 Q 55 82 49 82 H 11 Q 5 82 5 76 V 43 Q 5 39 8 36 Z" fill={fx.g('tag')} />
        <path d="M 12 40 L 30 24 L 34 27" fill="none" stroke="#FFFFFF" strokeWidth={1.4} strokeLinecap="round" opacity={0.5} />
        <ellipse cx={18} cy={50} rx={8} ry={4.5} fill={fx.spec} />
        <circle cx={30} cy={38} r={5} fill={drop(hue, 0.3)} />
        <circle cx={30} cy={38.6} r={3.6} fill="#FFFFFF" />
        <rect x={15} y={54} width={30} height={5} rx={2.5} fill="#FFFFFF" opacity={0.85} />
        <rect x={15} y={65} width={20} height={5} rx={2.5} fill="#FFFFFF" opacity={0.6} />
      </g>
      <path d="M 30 37 C 29 22 38 9 52 3" fill="none" stroke={LAB.charcoal} strokeWidth={2.2} strokeLinecap="round" />
    </ClaySvg>
  )
}

/**
 * A wallet with banknotes (slide 43, 2026-10-27: the user asked for a wallet or a stack of banknotes in
 * place of the book): two green notes standing out of a graded blue wallet, a flap with a clasp, a
 * specular on the upper left, a soft ground shadow.
 */
function ClayWallet({ w }: { w: number }) {
  const fx = useFx({ wal: LAB.cobalt, flap: LAB.navy, note: '#3FAE6A', note2: '#5CC487', clasp: LAB.yellow })
  return (
    <ClaySvg w={w} vw={140} vh={112}>
      {fx.defs}
      <Shadow id={fx.id} cx={70} cy={106} rx={60} ry={5} o={0.24} />
      <g>
        <g transform="rotate(-8 50 40)">
          <rect x={22} y={12} width={78} height={44} rx={5} fill={fx.g('note')} />
          <circle cx={61} cy={34} r={10} fill="none" stroke="#FFFFFF" strokeWidth={2.4} opacity={0.75} />
          <rect x={28} y={18} width={14} height={4} rx={2} fill="#FFFFFF" opacity={0.6} />
        </g>
        <g transform="rotate(6 80 36)">
          <rect x={40} y={8} width={78} height={44} rx={5} fill={fx.g('note2')} />
          <circle cx={79} cy={30} r={10} fill="none" stroke="#FFFFFF" strokeWidth={2.4} opacity={0.8} />
          <rect x={98} y={14} width={14} height={4} rx={2} fill="#FFFFFF" opacity={0.6} />
        </g>
        <rect x={8} y={38} width={124} height={64} rx={14} fill={fx.g('wal')} />
        <rect x={14} y={39} width={112} height={1.6} rx={0.8} fill="#FFFFFF" opacity={0.4} />
        <ellipse cx={40} cy={50} rx={24} ry={6} fill={fx.spec} />
        <path d="M 72 52 H 132 V 84 H 72 Q 62 84 62 74 V 62 Q 62 52 72 52 Z" fill={fx.g('flap')} />
        <circle cx={80} cy={68} r={7} fill={fx.g('clasp')} />
        <circle cx={78} cy={66} r={2.4} fill="#FFFFFF" opacity={0.7} />
      </g>
    </ClaySvg>
  )
}

/** A green approval tick: a turned disc with a white check. */
function Tick({ w }: { w: number }) {
  const fx = useFx({ ok: colors.success })
  return (
    <ClaySvg w={w} vw={40} vh={40}>
      {fx.defs}
      <g>
        <circle cx={20} cy={20} r={17} fill={fx.g('ok')} />
        <ellipse cx={14} cy={12} rx={7} ry={4} fill={fx.spec} />
        <path d="M 12 20.5 L 18 26.5 L 28.5 14.5" fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </ClaySvg>
  )
}

/** A train ticket, the ClayTicket shape in any hue; `dashed` is the standby: frosted, a dashed rim. */
function TrainTicket({ w, hue, dashed = false }: { w: number; hue: string; dashed?: boolean }) {
  const fx = useFx({ t: dashed ? '#E9F0FD' : hue })
  const shape = 'M 10 6 H 82 Q 88 6 88 12 V 22 A 9 9 0 0 0 88 40 V 50 Q 88 56 82 56 H 10 Q 4 56 4 50 V 40 A 9 9 0 0 0 4 22 V 12 Q 4 6 10 6 Z'
  const ink = dashed ? hue : '#FFFFFF'
  return (
    <ClaySvg w={w} vw={92} vh={62}>
      {fx.defs}
      <Shadow id={fx.id} cx={46} cy={59} rx={40} ry={3} o={0.2} />
      <g>
        <path d={shape} fill={fx.g('t')} stroke={dashed ? hue : 'none'} strokeWidth={dashed ? 2 : 0} strokeDasharray={dashed ? '5 4' : undefined} />
        <ellipse cx={22} cy={14} rx={12} ry={4} fill={fx.spec} />
        <line x1={64} y1={10} x2={64} y2={52} stroke={ink} strokeWidth={1.6} strokeDasharray="3 3" opacity={0.7} />
        <rect x={14} y={18} width={38} height={6} rx={3} fill={dashed ? hue : LAB.charcoal} opacity={dashed ? 0.6 : 0.55} />
        <rect x={14} y={30} width={42} height={4.5} rx={2.2} fill={ink} opacity={0.8} />
        <rect x={14} y={39} width={30} height={4.5} rx={2.2} fill={ink} opacity={0.8} />
      </g>
    </ClaySvg>
  )
}

/** A passenger carriage seen from the side: a graded body, a roof, five windows that light as it fills (`lit` 0..5), four wheels. */
function Train({ w, lit }: { w: number; lit: number }) {
  const fx = useFx({ body: colors.brand, roof: LAB.lavender, win: '#BFD6FF', on: LAB.yellow, wheel: LAB.charcoal })
  return (
    <ClaySvg w={w} vw={300} vh={98}>
      {fx.defs}
      <Shadow id={fx.id} cx={150} cy={94} rx={140} ry={3.5} o={0.22} />
      <g>
        <rect x={22} y={4} width={256} height={12} rx={6} fill={fx.g('roof')} />
      </g>
      <g>
        <rect x={6} y={12} width={288} height={66} rx={18} fill={fx.g('body')} />
        <ellipse cx={46} cy={20} rx={30} ry={5} fill={fx.spec} />
        <rect x={20} y={13} width={260} height={1.6} rx={0.8} fill="#FFFFFF" opacity={0.4} />
        {Array.from({ length: 5 }, (_, i) => (
          <g key={i}>
            <rect x={26 + i * 52} y={24} width={40} height={26} rx={7} fill={fx.g('win')} />
            <rect x={26 + i * 52} y={24} width={40} height={26} rx={7} fill={fx.g('on')} style={{ opacity: i < lit ? 1 : 0, transition: 'opacity 360ms cubic-bezier(0.22,1,0.36,1)' }} />
            <path d={`M ${28 + i * 52} ${26} L ${46 + i * 52} ${26} L ${28 + i * 52} ${42} Z`} fill="#FFFFFF" opacity={0.3} />
          </g>
        ))}
        <rect x={10} y={58} width={280} height={5} rx={2.5} fill="#FFFFFF" opacity={0.45} />
      </g>
      {[52, 92, 208, 248].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={80} r={10} fill={fx.g('wheel')} />
          <circle cx={cx} cy={80} r={3.5} fill={LAB.lavDeep} />
        </g>
      ))}
    </ClaySvg>
  )
}

/** A round white pedestal: a lit top disc, a turned body, a cool shadow; `glow` tints its top blue. */
function Pedestal({ w, glow = 0 }: { w: number; glow?: number }) {
  const fx = useFx({ side: '#D3DDF2', top: '#F6F9FF' })
  return (
    <ClaySvg w={w} vw={170} vh={62}>
      {fx.defs}
      <Shadow id={fx.id} cx={85} cy={52} rx={80} ry={5} o={0.24} />
      <g>
        <path d="M 6 16 V 34 A 79 14 0 0 0 164 34 V 16 Z" fill={fx.g('side')} />
        <ellipse cx={85} cy={16} rx={79} ry={14} fill={fx.g('top')} />
        <ellipse cx={85} cy={16} rx={79} ry={14} fill={colors.brand} style={{ opacity: glow * 0.22 }} />
        <ellipse cx={52} cy={10} rx={30} ry={4} fill={fx.spec} />
        <ellipse cx={85} cy={16} rx={78} ry={13.2} fill="none" stroke="#FFFFFF" strokeWidth={1.4} opacity={0.8} />
      </g>
    </ClaySvg>
  )
}

/* ================================================================== 43 · the map */

/** One tile's scene: one object on its shadow, lifting in its turn of the shared lap. */
function EconTile({ i, children }: { i: number; children: ReactNode }) {
  const t = useLoop(LAP, { mode: 'sawtooth', still: 0.1 })
  const a = i * 0.25
  const up = pulse(t, a + 0.02, a + 0.1, a + 0.16, a + 0.24)
  return (
    <Foot x={131} y={126}>
      <div style={{ transform: `translateY(${-10 * up}px)` }}>{children}</div>
    </Foot>
  )
}

export function EconMap({ lesson }: { lesson: string }) {
  return (
    <Tiles
      id="econ-map"
      kicker="Cloud Economics Map"
      title="Costs And Providers"
      lead="Cloud adoption decisions turn on how spending is structured and who supplies the infrastructure"
      lesson={lesson}
      tiles={[
        { title: 'CapEx vs OpEx', sub: 'How spend is classified', scene: <EconTile i={0}><ClayWallet w={120} /></EconTile> },
        { title: 'TCO', sub: 'True multi-year cost of a choice', scene: <EconTile i={1}><ClayCalculator w={92} /></EconTile> },
        { title: 'Pricing models', sub: 'On-demand, committed use, spot', scene: <EconTile i={2}><PriceTag w={64} /></EconTile> },
        { title: 'Providers', sub: 'Global hyperscalers and Indian regional players', scene: <EconTile i={3}><Icon3D name="globe-network" w={140} /></EconTile> },
      ]}
    />
  )
}

/* ================================================================== 44 · two ledgers */

/** The balance sheet's one tall stack loses a slice year by year; the income statement's equal blocks arrive month by month. */
function LedgersScene() {
  const t = useLoop(LAP, { mode: 'sawtooth', still: 0.55 })
  const gone = (k: number) => within(t, 0.08 + k * 0.17, 0.14 + k * 0.17)
  const shown = (i: number) => within(t, 0.06 + i * 0.14, 0.1 + i * 0.14)
  const L = 180
  const R = 454
  /* bottom-up: a base, then five year-slices; the top slice goes first */
  const layers: Layer[] = [{ h: 20, hue: colors.brand }, ...[1, 2, 3, 4, 5].map((j) => {
    const r = gone(5 - j)
    return { h: 32, hue: colors.brand, o: 1 - r, ty: -r * 18 }
  })]
  return (
    <>
      <At x={L} y={36} cx>
        <span className="inline-flex items-center gap-2">
          <Label size={15} strong>Balance sheet</Label>
          <Label tone="brand" size={14} strong mono>CAPEX</Label>
        </span>
      </At>
      <At x={R} y={36} cx>
        <span className="inline-flex items-center gap-2">
          <Label size={15} strong>Income statement</Label>
          <Label tone="good" size={14} strong mono>OPEX</Label>
        </span>
      </At>
      <Foot x={L} y={296}>
        <Stack w={110} layers={layers} ghost={gone(0) > 0.02 ? 1 : 0} />
      </Foot>
      <Foot x={R} y={296}>
        <div className="flex items-end gap-1.5">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} style={{ opacity: shown(i), transform: `translateY(${-(1 - shown(i)) * 24}px)` }}>
              <Block w={30} h={56} d={8} hue={colors.teal} />
            </div>
          ))}
        </div>
      </Foot>
      <At x={L} y={308} cx>
        <Label tone="muted" size={14} strong mono>DEPRECIATED OVER TIME</Label>
      </At>
      <At x={R} y={308} cx>
        <Label tone="muted" size={14} strong mono>THE SAME EACH MONTH</Label>
      </At>
    </>
  )
}

export function CapexOpex({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="capex-opex"
      kicker="CapEx vs OpEx"
      title="Balance Sheet Impact"
      lead="Cloud does not just change how much is paid; it changes which financial statement absorbs the cost, reshaping approvals and tax treatment"
      lesson={lesson}
      points={['CapEx: capitalised, depreciated over asset life, sits on balance sheet', 'OpEx: expensed immediately, hits the income statement same period']}
      figure={<LedgersScene />}
    />
  )
}

/* ================================================================== 45 · approvals and tax timing */

/** CapEx on the left, OpEx on the right: the board's tick lands after a long wait, the department signs quickly; one deduction spreads over years, the other is taken now; the report below. */
function ApprovalsScene() {
  const t = useLoop(10000, { mode: 'sawtooth', still: 0.9 })
  const approved = within(t, 0.38, 0.44)
  const signed = within(t, 0.12, 0.2)
  const dep = (i: number) => within(t, 0.5 + i * 0.08, 0.54 + i * 0.08)
  const now = within(t, 0.62, 0.66)
  const L = 165
  const R = 469
  const tick = (k: number) => (
    <div className="absolute" style={{ right: -14, top: -6, opacity: k, transform: `scale(${0.6 + 0.4 * k})` }}>
      <Tick w={30} />
    </div>
  )
  return (
    <>
      <At x={L} y={24} cx>
        <Label tone="brand" size={15} strong>Board-level capital approval</Label>
      </At>
      <At x={R} y={24} cx>
        <Label size={15} strong>Departmental budgets</Label>
      </At>
      <Foot x={L} y={158}>
        <div className="relative">
          <ClayInstitution w={112} />
          {tick(approved)}
        </div>
      </Foot>
      <Foot x={R} y={158}>
        <div className="relative">
          <ClayClipboard w={64} />
          {tick(signed)}
        </div>
      </Foot>
      <Foot x={L} y={246}>
        <div className="flex items-end gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} style={{ opacity: dep(i), transform: `translateY(${-(1 - dep(i)) * 16}px)` }}>
              <ClayCoin w={30} />
            </div>
          ))}
        </div>
      </Foot>
      <Foot x={R} y={246}>
        <div style={{ opacity: now, transform: `translateY(${-(1 - now) * 16}px)` }}>
          <ClayCoins w={54} n={4} />
        </div>
      </Foot>
      <At x={L} y={256} cx>
        <Label tone="muted" size={14}>Depreciation deductions</Label>
      </At>
      <At x={R} y={256} cx>
        <Label tone="muted" size={14}>Immediate deduction</Label>
      </At>
      <At x={FIG_W / 2} y={300} cx>
        <div className="flex items-center gap-2.5">
          <ClayBill w={32} />
          <img src={MARKS.aws.src} alt={MARKS.aws.alt} draggable={false} className="h-[18px] w-auto select-none" />
          <Label size={14}>AWS Cost and Usage Report</Label>
        </div>
      </At>
    </>
  )
}

export function CapexOpexMore({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="capex-opex-more"
      kicker="CapEx vs OpEx"
      title="Balance Sheet Impact"
      lesson={lesson}
      points={['CapEx typically needs board-level capital approval', 'OpEx approval sits within departmental budgets', "Depreciation deductions (CapEx) shift tax timing versus OpEx's immediate deduction", 'AWS Cost and Usage Report classifies spend for finance systems']}
      figure={<ApprovalsScene />}
    />
  )
}

/* ================================================================== 46 · a house on a loan, or rent */

const MONTHS = 6
const landedAt = (t: number, i: number) => within(t, 0.08 + i * 0.15, 0.16 + i * 0.15)

function useMonthly() {
  const t = useLoop(LAP, { mode: 'sawtooth', still: 0.95 })
  const stacked = Array.from({ length: MONTHS }, (_, i) => landedAt(t, i)).filter((k) => k >= 1).length
  const falling = stacked < MONTHS ? landedAt(t, stacked) : 0
  return { stacked, falling }
}

/** Left: a house with a loan tag (an asset) and a block of rented flats where a coin lands each month. */
function HouseRentScene() {
  const { stacked, falling } = useMonthly()
  const s = 48 / 70
  return (
    <>
      <Foot x={128} y={196}>
        <div className="flex items-start gap-1.5">
          <ClayHouse w={116} />
          <div className="mt-2">
            <PriceTag w={32} hue={CUSTOMER} />
          </div>
        </div>
      </Foot>
      <Foot x={340} y={196}>
        <div className="flex items-end gap-2.5">
          <ClayFlats w={124} />
          <div className="relative" style={{ width: 48, height: (20 + MONTHS * 13) * s }}>
            <div className="absolute inset-x-0 bottom-0">{stacked > 0 && <ClayCoins w={48} n={stacked} />}</div>
            <div className="absolute inset-x-0" style={{ bottom: stacked * 13 * s, opacity: falling > 0 ? Math.min(1, falling * 2) : 0, transform: `translateY(${-(1 - falling) * 18}px)` }}>
              <ClayCoins w={48} n={1} />
            </div>
          </div>
        </div>
      </Foot>
      <At x={128} y={210} cx>
        <Label size={14} tone="muted">On a loan</Label>
      </At>
      <At x={340} y={210} cx>
        <Label size={14} tone="muted">Rent, each month</Label>
      </At>
    </>
  )
}

/** Right: an owned rack with an asset tag, and a cloud whose invoice lands on the pile each month. */
function RackInvoiceScene() {
  const { stacked, falling } = useMonthly()
  return (
    <>
      <Foot x={140} y={196}>
        <div className="flex items-start gap-1.5">
          <ClayRack w={84} units={['run', 'run', 'run']} />
          <div className="mt-2">
            <PriceTag w={32} hue={CUSTOMER} />
          </div>
        </div>
      </Foot>
      <At x={340} y={30} cx>
        <RichCloud w={120} />
      </At>
      <Foot x={340} y={196}>
        <div className="relative" style={{ width: 58, height: 66 }}>
          {Array.from({ length: stacked }, (_, i) => (
            <div key={i} className="absolute" style={{ left: i * 3, bottom: i * 2.5 }}>
              <ClayBill w={40} />
            </div>
          ))}
          {stacked < MONTHS && (
            <div className="absolute" style={{ left: stacked * 3, bottom: stacked * 2.5, opacity: falling > 0 ? Math.min(1, falling * 2) : 0, transform: `translateY(${-(1 - falling) * 14}px)` }}>
              <ClayBill w={40} />
            </div>
          )}
        </div>
      </Foot>
      <At x={140} y={210} cx>
        <Label size={14} tone="brand" strong>CapEx</Label>
      </At>
      <At x={340} y={210} cx>
        <Label size={14} tone="brand" strong>OpEx</Label>
      </At>
    </>
  )
}

export function CapexAnalogy({ lesson }: { lesson: string }) {
  return <IsoAnalogy id="capex-analogy" kicker="CapEx vs OpEx" lesson={lesson} text="Buying a house needs a large loan and years of EMIs (equated monthly instalments) recorded as an asset, while renting is a monthly expense with nothing recorded, just as CapEx locks value on the balance sheet while OpEx flows straight through the income statement." everyday={{ label: 'A house on a loan, or rent', scene: <HouseRentScene /> }} cloud={{ label: 'CapEx and OpEx', scene: <RackInvoiceScene /> }} />
}

/* ================================================================== 47 · the layered bar */

const TCO_LAYERS = [
  { name: 'Sticker price', h: 84, color: colors.brand, a: 0, b: 0 },
  { name: 'Staffing', h: 52, color: CUSTOMER, a: 0.12, b: 0.3 },
  { name: 'Power', h: 52, color: LAB.yellow, a: 0.38, b: 0.56 },
  { name: 'Downtime', h: 52, color: LAB.red, a: 0.64, b: 0.82 },
]

/** The TR's layered bar: the sticker price at the base, the hidden costs dropping on one by one, the bracket growing with them. */
function TcoScene() {
  const t = useLoop(LAP, { mode: 'sawtooth', still: 0.92 })
  const grown = TCO_LAYERS.map((l, i) => (i === 0 ? 1 : within(t, l.a, l.b)))
  const D = 16
  const BX = 352 /* the bar's foot centre */
  const FOOT = 330
  const base = FOOT - 10 /* the front's bottom edge on the stage */
  const full = TCO_LAYERS.reduce((s, l) => s + l.h, 0)
  const now = TCO_LAYERS.reduce((s, l, i) => s + l.h * grown[i], 0)
  const W = 150
  const left = BX - (W + D + 4) / 2 + 2
  const mids = TCO_LAYERS.map((_, i) => base - TCO_LAYERS.slice(0, i).reduce((s, q) => s + q.h, 0) - TCO_LAYERS[i].h / 2)
  const bx = left - 22
  return (
    <>
      <Foot x={BX} y={FOOT}>
        <Stack w={W} d={D} layers={TCO_LAYERS.map((l, i) => ({ h: l.h, hue: l.color, o: Math.min(1, grown[i] * 2), ty: -(1 - grown[i]) * 36 }))} />
      </Foot>
      <svg aria-hidden className="pointer-events-none absolute" style={{ left: bx - 8, top: base - full, overflow: 'visible' }} width={12} height={full}>
        <g style={{ transformOrigin: `0px ${full}px`, transform: `scaleY(${now / full})` }}>
          <path d={`M 10 0 H 4 V ${full} H 10`} fill="none" stroke={colors.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </g>
      </svg>
      <At x={bx - 16} y={base - full / 2} cy style={{ transform: 'translate(-100%, -50%)' }}>
        <Label tone="brand" size={16} strong>True TCO</Label>
      </At>
      {/* the base is the price tag itself: a tag hangs on its front (2026-10-27, TR: sticker price at the base) */}
      <At x={left + W / 2} y={mids[0]} cx cy>
        <PriceTag w={34} />
      </At>
      {TCO_LAYERS.map((l, i) => (
        <At key={l.name} x={left + W + D + 18} y={mids[i]} cy style={{ opacity: grown[i] > 0.4 ? 1 : 0, transition: 'opacity 420ms cubic-bezier(0.22,1,0.36,1)' }}>
          <Label size={15} strong tone={i === 0 ? 'brand' : 'plain'}>{l.name}</Label>
        </At>
      ))}
    </>
  )
}

export function Tco({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="tco"
      kicker="Total Cost Ownership"
      title="Beyond The Price Tag"
      lead="Total cost of ownership (TCO) totals every direct and indirect cost of running a workload across its life, not only the sticker price"
      lesson={lesson}
      points={['Direct costs: compute, storage, licensing, network transfer', 'Indirect costs: staffing, training, downtime, migration effort', 'On-premise adds power, cooling, floor space, hardware refresh', 'AWS Pricing Calculator estimates cloud cost', 'Migration Evaluator builds the on-premise vs cloud business case']}
      figure={<TcoScene />}
      pointSize={16}
    />
  )
}

/* ================================================================== 48 · a phone's price tag */

const dropAt = (t: number, k: number) => within(t, 0.15 + k * 0.2, 0.28 + k * 0.2)

/** Three hidden-cost slabs drop one after another beside the thing with the price tag. */
function DropStack({ t, hues }: { t: number; hues: string[] }) {
  return <Stack w={70} d={10} layers={hues.map((hue, k) => ({ h: 36, hue, o: dropAt(t, k) > 0 ? Math.min(1, dropAt(t, k) * 3) : 0, ty: -(1 - dropAt(t, k)) * 40 }))} />
}

function PhoneTagScene() {
  const t = useLoop(LAP, { mode: 'sawtooth', still: 0.75 })
  return (
    <>
      <Foot x={140} y={200}>
        <div className="flex items-start gap-1.5">
          <ClayPhone w={60} />
          <div className="mt-2">
            <PriceTag w={34} />
          </div>
        </div>
      </Foot>
      <Foot x={318} y={200}>
        <DropStack t={t} hues={[CUSTOMER, CUSTOMER, CUSTOMER]} />
      </Foot>
      <At x={140} y={214} cx>
        <Label size={14} tone="muted">Price tag</Label>
      </At>
      <At x={318} y={214} cx>
        <Label size={14} tone="muted">Data plan, repairs, accessories</Label>
      </At>
    </>
  )
}

function ServerTcoScene() {
  const t = useLoop(LAP, { mode: 'sawtooth', still: 0.75 })
  return (
    <>
      <Foot x={140} y={200}>
        <div className="flex items-start gap-1.5">
          <ClayRack w={84} units={['run', 'run', 'run']} />
          <div className="mt-2">
            <PriceTag w={34} />
          </div>
        </div>
      </Foot>
      <Foot x={318} y={200}>
        <DropStack t={t} hues={[CUSTOMER, LAB.yellow, LAB.red]} />
      </Foot>
      <At x={140} y={214} cx>
        <Label size={14} tone="brand" strong>Purchase price</Label>
      </At>
      <At x={318} y={214} cx>
        <Label size={14} tone="brand" strong>Staffing, power, downtime</Label>
      </At>
    </>
  )
}

export function TcoAnalogy({ lesson }: { lesson: string }) {
  return <IsoAnalogy id="tco-analogy" kicker="Total Cost Ownership" lesson={lesson} text="The price of a smartphone is not its total cost: you may also spend money on data, repairs, and accessories over time. Similarly, the purchase price of a server does not show its total cost of ownership, which also includes power, maintenance, staffing, and downtime." everyday={{ label: "A phone's price tag", scene: <PhoneTagScene /> }} cloud={{ label: 'Server TCO', scene: <ServerTcoScene /> }} />
}

/* ================================================================== 49 · the steps */

const STEPS = [
  { name: 'On-Demand', h: 150 },
  { name: 'Committed Use', h: 100 },
  { name: 'Spot', h: 50 },
]
const STEP_W = 124
const STEP_D = 14
const STEP_VW = STEP_W + STEP_D + 4

/** Three price tags on three descending white steps; the price falls along the arrow; the spot tag is snatched back and returns. */
function RampScene() {
  const t = useLoop(LAP, { mode: 'sawtooth', still: 0.5 })
  const gone = pulse(t, 0.3, 0.42, 0.62, 0.74)
  const FOOT = 300
  const cx = (i: number) => FIG_W / 2 + (i - 1) * (STEP_VW + 6)
  /* the front's centre sits left of the drawing's centre by half the side face */
  const fx = (i: number) => cx(i) - (STEP_D + 4) / 2 + 2
  const top = (h: number) => FOOT - 11 - h - STEP_D * 0.55 - 3
  return (
    <>
      <At x={40} y={38}>
        <Label tone="brand" size={14} strong mono>PRICE FALLS</Label>
      </At>
      <Arrow x1={190} y1={50} x2={545} y2={150} tone={colors.brand} dashed />
      {STEPS.map((s, i) => (
        <Foot key={s.name} x={cx(i)} y={FOOT}>
          <Block w={STEP_W} h={s.h} d={STEP_D} hue="#DCE5F7" />
        </Foot>
      ))}
      {STEPS.map((s, i) => {
        const snatched = i === 2 ? gone : 0
        return (
          <Foot key={s.name} x={fx(i)} y={top(s.h)} style={{ opacity: 1 - snatched * 0.65 }}>
            <div style={{ transform: `translateY(${-snatched * 26}px)` }}>
              <PriceTag w={i === 0 ? 46 : i === 1 ? 42 : 38} />
            </div>
          </Foot>
        )
      })}
      {STEPS.map((s, i) => (
        <At key={s.name} x={fx(i)} y={FOOT + 2} cx>
          <Label size={15} strong tone={s.name === 'Spot' && gone > 0.5 ? 'bad' : 'plain'}>
            {s.name}
          </Label>
        </At>
      ))}
    </>
  )
}

export function Pricing({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="pricing"
      kicker="Three Pricing Models"
      title="On-Demand To Spot"
      lead="Providers meter usage but let buyers trade commitment for discount; three payment patterns cover most cloud spend"
      lesson={lesson}
      points={['On-demand: metered pay-as-used rate, zero commitment', 'Committed use: longer-term commitment for lower rates, depending on the provider and plan.', 'Spot: spare capacity at a steep discount; can be reclaimed at short notice', 'Trade-off across all three: flexibility versus price']}
      figure={<RampScene />}
    />
  )
}

/* ================================================================== 50 · three kinds of train ticket */

const COLS = [95, AN_W / 2, AN_W - 95]

/** A dot moving from one point to another by `k` (0..1), shown only in flight. */
function Hop({ from, to, k, tone }: { from: [number, number]; to: [number, number]; k: number; tone: string }) {
  const x = from[0] + (to[0] - from[0]) * k
  const y = from[1] + (to[1] - from[1]) * k
  return <span aria-hidden className="pointer-events-none absolute rounded-full" style={{ left: -6, top: -6, width: 12, height: 12, background: tone, boxShadow: `0 0 0 4px ${tone}40`, transform: `translate(${x}px, ${y}px)`, opacity: k > 0 && k < 1 ? 1 : 0 }} />
}

/** A short line of plain text under a label, wrapped to a column (the TR clause the label stands for). */
function Sub({ x, y, w = 128, children }: { x: number; y: number; w?: number; children: ReactNode }) {
  return (
    <At x={x} y={y} w={w} style={{ transform: 'translateX(-50%)' }}>
      <span className="block text-center text-[14px] font-medium leading-snug" style={{ color: colors.muted }}>
        {children}
      </span>
    </At>
  )
}

/** The train pulls in, the general and season-pass holders board, the train fills, the standby holder's seat is given away, the train leaves. */
function StationScene() {
  const t = useLoop(10000, { mode: 'sawtooth', still: 0.72 })
  const trainX = (within(t, 0.02, 0.28) - 1) * 520 + within(t, 0.8, 1) * 520
  const boarded = [within(t, 0.34, 0.44), within(t, 0.46, 0.56)]
  const filled = 2 * (boarded[1] > 0.99 ? 1 : 0) + within(t, 0.58, 0.6) + within(t, 0.61, 0.63) + within(t, 0.64, 0.66)
  const lit = boarded[0] > 0.99 ? (boarded[1] > 0.99 ? Math.round(filled) : 1) : 0
  const aside = within(t, 0.66, 0.76)
  const RIDERS = [
    { name: 'General ticket', sub: 'Full fare, no planning', hue: LAB.yellow },
    { name: 'Season pass', sub: 'Costs less, fixed daily route', hue: colors.brand },
    { name: 'Standby ticket', sub: 'Cheapest, seat can be given away', hue: colors.teal },
  ]
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute rounded-full" style={{ left: 24, right: 24, top: 112, height: 4, background: colors.line }} />
      <At x={AN_W / 2} y={24} cx>
        <div style={{ transform: `translateX(${trainX}px)` }}>
          <Train w={280} lit={lit} />
        </div>
      </At>
      {boarded.map((b, i) => (
        <Hop key={i} from={[COLS[i], 140]} to={[COLS[i] + 20, 76]} k={b} tone={RIDERS[i].hue} />
      ))}
      {RIDERS.map((r, i) => (
        <At key={r.name} x={COLS[i]} y={126} cx style={i === 2 ? { opacity: 1 - aside * 0.5 } : undefined}>
          <div style={i === 2 ? { transform: `translateY(${aside * 6}px)` } : undefined}>
            <TrainTicket w={76} hue={r.hue} dashed={i === 2} />
          </div>
        </At>
      ))}
      {RIDERS.map((r, i) => (
        <At key={r.name} x={COLS[i]} y={186} cx>
          <Label size={14} strong>{r.name}</Label>
        </At>
      ))}
      {RIDERS.map((r, i) => (
        <Sub key={r.name} x={COLS[i]} y={214}>{r.sub}</Sub>
      ))}
    </>
  )
}

/** The same three bargains as compute: the on-demand and committed blocks each send their work to a rack, the racks fill, and the spot block is reclaimed; the price falls left to right. */
function TokensScene() {
  const t = useLoop(10000, { mode: 'sawtooth', still: 0.72 })
  const sent = [within(t, 0.34, 0.44), within(t, 0.46, 0.56)]
  const fill = within(t, 0.58, 0.66)
  const reclaimed = pulse(t, 0.66, 0.76, 0.9, 1)
  const names = ['On-demand', 'Committed use', 'Spot']
  const prices = ['Full price', 'Lower price', 'Lowest price']
  const units = (i: number): UnitState[] => [i < 2 && sent[i] > 0.99 ? 'run' : 'idle', fill > 0.5 ? 'run' : 'idle', fill > 0.5 ? 'run' : 'idle']
  return (
    <>
      {COLS.map((x, i) => (
        <At key={i} x={x} y={24} cx>
          <ClayRack w={64} units={units(i)} />
        </At>
      ))}
      {[0, 1].map((i) => (
        <Arrow key={i} x1={COLS[i]} y1={138} x2={COLS[i]} y2={108} tone={sent[i] > 0 ? colors.brand : colors.line} />
      ))}
      {[0, 1].map((i) => (
        <Hop key={i} from={[COLS[i], 138]} to={[COLS[i], 110]} k={sent[i]} tone={colors.brand} />
      ))}
      {names.map((n, i) => (
        <Foot key={n} x={COLS[i]} y={192} style={i === 2 ? { opacity: 1 - reclaimed * 0.65 } : undefined}>
          <div style={i === 2 ? { transform: `translateY(${-reclaimed * 18}px)` } : undefined}>
            <Block w={44} h={38} d={10} hue={i === 2 ? colors.teal : colors.brand} />
          </div>
        </Foot>
      ))}
      {names.map((n, i) => (
        <At key={n} x={COLS[i]} y={200} cx>
          <Label size={14} tone={i === 2 && reclaimed > 0.5 ? 'bad' : 'brand'} strong>
            {n}
          </Label>
        </At>
      ))}
      {prices.map((p, i) => (
        <Sub key={p} x={COLS[i]} y={228}>{p}</Sub>
      ))}
      <Arrow x1={COLS[0] - 30} y1={262} x2={COLS[1] + 50} y2={262} tone={colors.brand} dashed />
      <At x={COLS[1] + 62} y={262} cy>
        <Label size={14} tone="brand" strong>Price falls</Label>
      </At>
    </>
  )
}

export function PricingAnalogy({ lesson }: { lesson: string }) {
  return <IsoAnalogy id="pricing-analogy" kicker="Three Pricing Models" lesson={lesson} text="A general train ticket costs full fare and needs no planning, a season pass costs less for a fixed daily route, and a standby ticket is cheapest but the seat can be given away, just as on-demand, committed use and spot trade flexibility for price." everyday={{ label: 'Three kinds of train ticket', scene: <StationScene /> }} cloud={{ label: 'On-demand, committed use, spot', scene: <TokensScene /> }} />
}

/* ================================================================== 51 · compared */

export function PricingTable({ lesson }: { lesson: string }) {
  return (
    <TableCard
      id="pricing-table"
      kicker="Pricing Models Compared"
      title="Discount And Risk"
      lead="Each pricing model suits a different workload shape; committed-use discounts deepen with longer terms and more upfront payment"
      lesson={lesson}
      columns={[
        { label: 'Model', weight: 0.8 },
        { label: 'Commitment', weight: 0.7 },
        { label: 'Typical discount', weight: 1 },
        { label: 'Key risk', weight: 1.6 },
        { label: 'Best for', weight: 1.3 },
      ]}
      rows={[
        ['On-Demand', 'None', 'Baseline rate', 'Highest unit price; cost runs on if left running', 'Unpredictable, short-lived workloads'],
        ['Committed Use', '1 or 3 years', 'Up to ~70% off on-demand', 'Upfront lock-in, must forecast usage', 'Steady, predictable baseline load'],
        ['Spot', 'None', 'Up to ~90% off on-demand', 'Reclaimed with short notice (~2 min AWS, ~30 sec Azure/GCP)', 'Fault-tolerant batch, stateless jobs'],
      ]}
      compact
    />
  )
}

/* ================================================================== 52 · the bar chart */

const FULL = 230 /* 100% of the scale, in px */
const BARS = [
  { name: 'On-Demand', above: 'Baseline rate', note: 'Highest unit price', h: 12, color: colors.brand },
  { name: 'Committed Use', above: 'Up to ~70% off', note: 'Locked in for 1 or 3 years', h: FULL * 0.7, color: colors.brand },
  { name: 'Spot', above: 'Up to ~90% off', note: 'Can be reclaimed at short notice', h: FULL * 0.9, color: colors.teal },
]

/** The TR's three-column chart: a stub, ~70 and ~90 of a 100 scale, growing in turn. */
function BarsScene() {
  const t = useLoop(LAP, { mode: 'sawtooth', still: 0.9 })
  const BASE = 280
  const D = 18
  return (
    <>
      {BARS.map((b, i) => {
        const x = 555 + (i - 1) * 240
        const g = within(t, 0.06 + i * 0.28, 0.26 + i * 0.28)
        return (
          <div key={b.name}>
            <Foot x={x} y={BASE + 11}>
              <div style={{ transformOrigin: '50% 100%', transform: `scaleY(${Math.max(0.02, g)})` }}>
                <Block w={160} h={b.h} d={D} hue={b.color} />
              </div>
            </Foot>
            <At x={x} y={BASE - b.h - D * 0.55 - 40} cx style={{ opacity: g > 0.95 ? 1 : 0, transition: 'opacity 420ms cubic-bezier(0.22,1,0.36,1)' }}>
              <Label tone="brand" size={16} strong>{b.above}</Label>
            </At>
            <At x={x} y={BASE + 14} cx>
              <Label size={16} strong>{b.name}</Label>
            </At>
            <At x={x} y={BASE + 50} cx>
              <Label size={15} tone="muted">{b.note}</Label>
            </At>
          </div>
        )
      })}
    </>
  )
}

export function PricingBars({ lesson }: { lesson: string }) {
  return <FigureOnly id="pricing-bars" kicker="Pricing Models Compared" title="Discount And Risk" lesson={lesson} figure={<BarsScene />} h={392} />
}

/* ================================================================== 53 · three hyperscalers */

const PROVIDERS = [
  { mark: MARKS.aws, keyword: 'Breadth', h: 32 },
  { mark: MARKS.azure, keyword: 'Enterprise', h: 26 },
  { mark: MARKS.gcp, keyword: 'Data and AI/ML', h: 26 },
]

/** The TR's three marks in a row, each standing on a white pedestal with its keyword under, lifting in turn. */
function MarksRow() {
  const t = useLoop(LAP, { mode: 'sawtooth', still: 0.1 })
  return (
    <div className="relative" style={{ width: 1110, height: 136 }}>
      {PROVIDERS.map((p, i) => {
        const up = pulse(t, i * 0.33 + 0.02, i * 0.33 + 0.1, i * 0.33 + 0.2, i * 0.33 + 0.3)
        const x = 309 + i * 246
        return (
          <div key={p.keyword}>
            <At x={x} y={40} cx>
              <Pedestal w={170} glow={up} />
            </At>
            <Foot x={x} y={56}>
              <div style={{ transform: `translateY(${-8 * up}px)` }}>
                <Mark src={p.mark.src} alt={p.mark.alt} h={p.h} />
              </div>
            </Foot>
            <At x={x} y={104} cx>
              <Label tone="brand" size={16} strong>{p.keyword}</Label>
            </At>
          </div>
        )
      })}
    </div>
  )
}

export function Providers({ lesson }: { lesson: string }) {
  return (
    <TableCard
      id="providers"
      kicker="Global Cloud Providers"
      title="AWS Azure GCP"
      lead="Three hyperscalers dominate global cloud spend, each with a different platform strength that shapes provider choice"
      lesson={lesson}
      above={<MarksRow />}
      columns={[
        { label: 'Provider', weight: 1 },
        { label: 'Parent company', weight: 1 },
        { label: 'Notable strength', weight: 2.4 },
      ]}
      rows={[
        ['AWS', 'Amazon', 'Broadest service catalog, largest market share'],
        ['Azure', 'Microsoft', 'Strong enterprise and hybrid integration (Active Directory)'],
        ['Google Cloud (GCP)', 'Google', 'Data analytics, AI/ML tooling strength'],
      ]}
      compact
    />
  )
}

/* ================================================================== 54 · the in-country zone */

const ZONE = { x: 24, y: 24, w: 376, h: 296 }
const LOOP = { x: 38, y: 38, w: 348, h: 268 }
const PINS: { name: string; at: [number, number] }[] = [
  { name: 'CtrlS', at: [132, 138] },
  { name: 'Yotta', at: [292, 138] },
  { name: 'E2E Networks', at: [132, 260] },
  { name: 'GI Cloud (MeghRaj)', at: [292, 260] },
]

/** The point a fraction `k` round the loop's perimeter, clockwise from its top-left corner. */
function onLoop(k: number): [number, number] {
  const { x, y, w, h } = LOOP
  const p = 2 * (w + h)
  let s = (((k % 1) + 1) % 1) * p
  if (s < w) return [x + s, y]
  s -= w
  if (s < h) return [x + w, y + s]
  s -= h
  if (s < w) return [x + w - s, y + h]
  s -= w
  return [x, y + h - s]
}

/** An in-country zone with one data centre per provider, packets circling inside it and never leaving; the hyperscalers on their own plate outside. */
function IndiaScene() {
  const t = useLoop(LAP, { mode: 'sawtooth', still: 0.3 })
  const RX = 517
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute rounded-[22px]" style={{ left: ZONE.x, top: ZONE.y, width: ZONE.w, height: ZONE.h, background: 'rgba(45,99,251,0.06)', boxShadow: `inset 0 0 0 2px ${colors.brand}` }} />
      <svg aria-hidden className="pointer-events-none absolute" style={{ left: 0, top: 0, overflow: 'visible' }} width={1} height={1}>
        <rect x={LOOP.x} y={LOOP.y} width={LOOP.w} height={LOOP.h} rx={4} fill="none" stroke={colors.brand} strokeWidth={1.8} strokeDasharray="7 7" opacity={0.45} />
      </svg>
      {[0, 0.5].map((o) => {
        const [x, y] = onLoop(t + o)
        return <span key={o} aria-hidden className="pointer-events-none absolute rounded-full" style={{ left: -6, top: -6, width: 12, height: 12, background: colors.brand, boxShadow: `0 0 0 4px ${colors.brand}40`, transform: `translate(${x}px, ${y}px)` }} />
      })}
      {PINS.map((p) => (
        <Foot key={p.name} x={p.at[0]} y={p.at[1]}>
          <ClayDataCentre w={100} />
        </Foot>
      ))}
      {PINS.map((p) => (
        <At key={p.name} x={p.at[0]} y={p.at[1] + 8} cx>
          <Label size={14} strong>{p.name}</Label>
        </At>
      ))}
      <At x={ZONE.x + ZONE.w / 2} y={ZONE.y + ZONE.h + 10} cx>
        <Label tone="brand" size={14} strong mono>INSIDE INDIA</Label>
      </At>
      <At x={RX} y={36} cx>
        <Label tone="muted" size={14} strong mono>GLOBAL HYPERSCALERS</Label>
      </At>
      <At x={RX} y={84} cx>
        <Icon3D name="globe-network" w={128} />
      </At>
      <At x={RX} y={192} cx>
        <div className="flex flex-col items-center gap-3 rounded-2xl px-6 py-4" style={TILE_SKIN}>
          <Mark src={MARKS.aws.src} alt={MARKS.aws.alt} h={28} />
          <Mark src={MARKS.azure.src} alt={MARKS.azure.alt} h={22} />
          <Mark src={MARKS.gcp.src} alt={MARKS.gcp.alt} h={20} />
        </div>
      </At>
    </>
  )
}

export function India({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="india"
      kicker="Indian Cloud Providers"
      title="Regional Alternatives"
      lead="Alongside global hyperscalers, Indian providers compete on data residency, latency for local users, and rupee-denominated billing"
      lesson={lesson}
      points={['CtrlS, Yotta, E2E Networks: private data-centre players', "Government's GI Cloud (MeghRaj) hosts public-sector workloads", 'BFSI (banking, financial services and insurance) and government workloads often mandate in-country storage', 'Regional providers can undercut hyperscaler pricing for local traffic']}
      figure={<IndiaScene />}
      pointSize={16}
    />
  )
}
