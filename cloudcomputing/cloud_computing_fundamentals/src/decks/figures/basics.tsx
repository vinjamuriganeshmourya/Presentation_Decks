import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { TILE_SKIN } from './card'
import { useBeats } from '@/ui'
import { Card, Stage, At, Fade, Label, Note, Arrow, Caption, Num, useCycle, BOX_W, type StatementPart } from './scene'
import { Coins, Laptop, Rack, ServerUnit, useEase } from './art'
import { BackEndBuilding, ClayCalendar, ClayStopwatch, CloudBuildingIcon, CloudDataCentre, ConsoleIcon, LayersIcon, NistPool, OnPremRoom, PayGoMeter, StarBadge } from './clay-a'
import { mo } from './motion'

/*
 * THE TILE, THE WELL AND THE SOLID (user, 2026-10-16, "same style for all"):
 * slide 5's finish for every box and every drawn block in the section files
 * (basics, history, traits1, traits2, benefits, closing import these). They
 * belong in `card.tsx` beside `TILE_SKIN`; they sit here so the section files
 * share one copy without touching the kit-side file.
 */
export const TILE_DROP = '0 12px 24px -16px rgba(31,64,140,0.30), 0 2px 6px rgba(31,64,140,0.05)'
/** The tile finish with a state ring kept inside it (`2px ${colors.brand}`), and anything to lay over it. */
export const tile = (ring?: string, over: CSSProperties = {}): CSSProperties => ({ ...TILE_SKIN, ...(ring ? { boxShadow: `inset 0 0 0 ${ring}, ${TILE_DROP}` } : {}), ...over })
/** The tile's surface alone, for a box that keeps a border of its own. */
export const TILE_SKIN_BG = TILE_SKIN.background as string
/** A picture's well inside a tile: recessed, no shadow of its own. */
export const WELL: CSSProperties = { background: 'linear-gradient(180deg, #E3EBFA 0%, #F2F6FE 100%)', boxShadow: 'inset 0 0 0 1px #C4D4F2, inset 0 2px 4px rgba(31,64,140,0.08)' }
/** A six-digit hex mixed toward white (amt > 0) or black (amt < 0). */
export function mix(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1, 7), 16)
  const ch = (s: number) => {
    const v = (n >> s) & 255
    const t = amt > 0 ? v + (255 - v) * amt : v * (1 + amt)
    return Math.round(Math.max(0, Math.min(255, t))).toString(16).padStart(2, '0')
  }
  return `#${ch(16)}${ch(8)}${ch(0)}`
}
/** A drawn block as one of the render's solids: lit at the top, shaded at the foot, a soft shadow under it. */
export const solid = (tone: string, over: CSSProperties = {}): CSSProperties => ({
  background: `linear-gradient(180deg, ${mix(tone, 0.22)} 0%, ${tone} 55%, ${mix(tone, -0.12)} 100%)`,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -2px 0 rgba(0,0,0,0.10), 0 8px 16px -10px rgba(31,64,140,0.40)',
  ...over,
})

/**
 * SECTION 1, CLOUD COMPUTING BASICS (SCQA): the need (slide 5, in `why.tsx`), the definition, its three branches, the analogy, the five contrasts,
 * the architecture, and the three drivers. Every string is the reference's.
 */

/* ================================================================== 6 · NIST Formal View (review 2026-10-15: the definition, then the points) */

/** The definition the review supplied, word for word, cut at the phrases the points lean on. */
/* RE-SYNC 2026-10-22: the TR PDF's exact SP 800-145 sentence (the review's paraphrase dropped "a model for enabling anywhere",
   "shared pool of configurable" and "or service provider interaction", and the TR note asks for the precise wording) */
const DEF: StatementPart[] = [
  { t: 'The National Institute of Standards and Technology (NIST) defines cloud computing as a model for enabling anywhere, convenient, ' },
  { t: 'on-demand network access', hi: true },
  { t: ' to a ' },
  { t: 'shared pool of configurable computing resources', hi: true },
  { t: ' (networks, servers, storage, applications, and services) that can be ' },
  { t: 'rapidly provisioned and released', hi: true },
  { t: ' with minimal management effort or service provider interaction' },
]

/**
 * The definition beside its picture (review 2026-10-16, slide 6: the statement
 * alone was a wall of text). The Statement frame's own markup, the words at
 * 24px so the picture gets 380px; the picture's fifth tile is provisioned and
 * released on the deck's step loop (2400ms), the one motion that explains a
 * phrase of the definition.
 */
export function NistReader({ lesson }: { lesson: string }) {
  const on = useCycle(2, 2400, 1) === 1
  return (
    <Card id="nist" kicker="Cloud Computing Defined" title="NIST Formal View" lesson={lesson}>
      <Stage w={BOX_W} h={420} active={false} pad={34} raised>
        <div className="flex h-full items-center gap-9">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <span className={`grid h-8 w-8 place-items-center rounded-full ${mo('pulse', 1).className}`} style={{ background: colors.brand, ...mo('pulse', 1).style }} aria-hidden>
                <svg width={14} height={18} viewBox="0 0 14 18"><circle cx={7} cy={3} r={2.2} fill={colors.white} /><rect x={5.2} y={7} width={3.6} height={10} rx={1.8} fill={colors.white} /></svg>
              </span>
              <span className="font-heading text-[20px] font-semibold" style={{ color: colors.brandDark }}>NIST Definition</span>
            </div>
            <p className="mt-4 text-[24px] font-medium leading-[1.5]" style={{ color: colors.ink }}>
              {DEF.map((p, i) => (
                <span key={i} style={p.hi ? { color: colors.brand, fontWeight: 600 } : undefined}>
                  {p.t}
                </span>
              ))}
            </p>
          </div>
          <div className="grid w-[380px] shrink-0 place-items-center">
            <NistPool w={380} on={on} />
          </div>
        </div>
      </Stage>
    </Card>
  )
}

/** The four points that sat beside the definition: each a row led by its clay icon (review 2026-10-16: icons, not counts). */
export function NistPoints({ lesson }: { lesson: string }) {
  const beat = useBeats(4)
  const ease = useEase()
  const rows: { mark: ReactNode; text: string }[] = [
    { mark: <StarBadge w={52} />, text: 'Five essential characteristics govern shared resource access' },
    { mark: <LayersIcon w={52} />, text: 'Three service models: IaaS, PaaS, SaaS' },
    { mark: <CloudBuildingIcon w={52} />, text: 'Four deployment models: public, private, hybrid, community' },
    { mark: <ConsoleIcon w={52} />, text: 'AWS Management Console exposes this self-service resource catalog' },
  ]
  return (
    <Card id="nist-points" kicker="Cloud Computing Defined" title="NIST Formal View" lesson={lesson} beat={beat} total={4}>
      <div className="flex flex-col gap-4">
        {rows.map((r, i) => {
          const shown = beat >= i + 1
          return (
            <div
              key={r.text}
              className="flex items-center gap-6 rounded-2xl px-6 py-4"
              style={{ width: BOX_W, ...tile(), opacity: shown ? 1 : 0, transform: shown ? 'none' : 'translateY(8px)', transition: ease }}
            >
              <span className="grid h-[64px] w-[64px] shrink-0 place-items-center rounded-2xl" style={{ background: colors.surface2 }}>
                {r.mark}
              </span>
              <span className="text-[22px] font-medium leading-snug" style={{ color: colors.ink }}>{r.text}</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

/* ================================================================== 8 · NIST three branches */

/** The tree's geometry, on its stage: the root's foot, the elbow's height, and the boxes' tops. */
const ROOT_FOOT = 86
const ELBOW_Y = 118
const BOX_TOP = 150
const BOX_WIDE = 330
const LINE = 2.5

/**
 * One connector, root to branch box: its own svg sized to the line (decision
 * 4), drawn by the deck's entrance (`data-draw`) after the root and before the
 * boxes, because it sits between them. It starts on the root's bottom edge and
 * stops on the box's top edge with butt caps, so it meets both exactly.
 */
function Connector({ x1, x2 }: { x1: number; x2: number }) {
  const left = Math.min(x1, x2) - LINE / 2
  const width = Math.abs(x2 - x1) + LINE
  const d = x1 === x2 ? `M ${x1 - left} 0 V ${BOX_TOP - ROOT_FOOT}` : `M ${x1 - left} 0 V ${ELBOW_Y - ROOT_FOOT} H ${x2 - left} V ${BOX_TOP - ROOT_FOOT}`
  return (
    <svg aria-hidden className="pointer-events-none absolute" style={{ left, top: ROOT_FOOT, overflow: 'visible' }} width={width} height={BOX_TOP - ROOT_FOOT}>
      <path data-draw d={d} fill="none" stroke={colors.brand} strokeWidth={LINE} strokeLinejoin="round" strokeLinecap="butt" />
      {/* motion layer: a lighter dash rides the connector root to branch, drawn on in the same entrance slot as the line under it */}
      <path data-draw d={d} fill="none" stroke={colors.white} strokeWidth={LINE * 0.5} strokeLinejoin="round" strokeLinecap="round" strokeDasharray="5 9" opacity={0.75} className={mo('dash', Math.round(x2 / 50)).className} style={mo('dash', Math.round(x2 / 50)).style} />
    </svg>
  )
}

export function NistTree({ lesson }: { lesson: string }) {
  const beat = useBeats(4)
  const branches = [
    { label: 'Essential Characteristics', body: 'Five of them', leaves: ['On-demand self-service', 'Broad network access', 'Resource pooling', 'Rapid elasticity', 'Measured service'], x: 30, today: true },
    { label: 'Service Models', body: 'IaaS, PaaS, SaaS', leaves: ['IaaS', 'PaaS', 'SaaS'], x: 390, today: false },
    { label: 'Deployment Models', body: 'Public, private, hybrid, community', leaves: ['Public', 'Private', 'Hybrid', 'Community'], x: 750, today: false },
  ]
  /* review 2026-10-16: no builds here; the deck's entrance reads it top down (root, connectors, boxes, chips) */
  return (
    <Card id="nist-branches" kicker="Cloud Computing Defined" title="NIST Formal View" lesson={lesson} beat={beat} total={4}>
      <Stage w={BOX_W} h={432} active={false}>
        <At x={BOX_W / 2} y={22} cx>
          <div className="grid h-[64px] w-[250px] place-items-center rounded-2xl font-heading text-[20px] font-semibold text-white" style={{ background: colors.brand, boxShadow: `0 14px 30px -16px ${colors.brand}` }}>
            NIST Definition
          </div>
        </At>
        {branches.map((b) => (
          <Connector key={b.label} x1={BOX_W / 2} x2={b.x + BOX_WIDE / 2} />
        ))}
        {branches.map((b) => (
          <At key={b.label} x={b.x} y={BOX_TOP} w={BOX_WIDE}>
            {/* audit 2026-10-22: one height for the three boxes, so the tree's feet line up instead of three ragged bottoms */}
            <div className="rounded-2xl p-4" style={{ ...tile(`2px ${b.today ? colors.brand : colors.line}`), height: 208 }}>
              <span className="block font-heading text-[18px] font-semibold" style={{ color: colors.ink }}>{b.label}</span>
              <span className="mt-0.5 block text-[16px]" style={{ color: colors.ink }}>{b.body}</span>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {b.leaves.map((l) => (
                  <Label key={l} size={15} tone={b.today ? 'brand' : 'plain'}>{l}</Label>
                ))}
              </div>
            </div>
          </At>
        ))}
        <At x={30} y={392} w={1050}>
          <div className="flex items-center gap-2">
            <span className={`block h-[12px] w-[12px] rounded-full ${mo('pulse', 2).className}`} style={{ background: colors.brand, ...mo('pulse', 2).style }} />
            <span className="text-[15px] font-medium" style={{ color: colors.ink }}>Opened in this session</span>
          </div>
        </At>
      </Stage>
    </Card>
  )
}


/* ================================================================== 10 · Ownership and Delivery */

const ROWS: [string, string, string][] = [
  ['Ownership', 'Organisation owns hardware', 'Provider owns infrastructure'],
  ['Cost model', 'Capital expenditure (CapEx)', 'Operating expenditure (OpEx)'],
  ['Provisioning time', 'Weeks to months', 'Minutes'],
  ['Scaling', 'Manual hardware upgrade', 'On-demand, software-driven'],
  ['Maintenance', 'In-house IT team', 'Provider-managed'],
]

/** One side's picture (review 2026-10-16: a technical drawing per side, no people, no per-row props). */
function SidePicture({ title, tone, art, note }: { title: string; tone: 'dark' | 'brand'; art: ReactNode; note: string }) {
  return (
    <Stage w={360} h={170} active={false}>
      <At x={14} y={12}><Label strong size={14} tone={tone}>{title}</Label></At>
      <At x={180} y={44} cx>{art}</At>
      <At x={180} y={140} cx><Label size={14} tone={tone === 'brand' ? 'brand' : 'plain'}>{note}</Label></At>
    </Stage>
  )
}

export function OwnershipSplit({ lesson }: { lesson: string }) {
  const beat = useBeats(6)
  const ease = useEase()
  return (
    <Card id="onprem-vs-cloud" kicker="On-Premise vs Cloud" title="Ownership and Delivery" lead="On-premise IT keeps hardware, software and staff inside the organisation; cloud shifts ownership and operation to a provider, delivered over the network" lesson={lesson} beat={beat} total={6}>
      <div className="flex gap-4">
        <div className="flex flex-col gap-3" style={{ width: 360 }}>
          <SidePicture title="On-Premise IT" tone="dark" art={<OnPremRoom w={230} />} note="A locked data centre" />
          <SidePicture title="Cloud" tone="brand" art={<CloudDataCentre w={230} />} note="Reachable from anywhere over the internet" />
        </div>
        <Stage w={734} h={352} active={false} pad={14}>
          <div className="grid overflow-hidden rounded-xl" style={{ gridTemplateColumns: '170px 1fr 1fr', ...tile() }}>
            {['Aspect', 'On-Premise IT', 'Cloud'].map((h) => (
              <span key={h} className="px-4 py-2.5 font-heading text-[16px] font-semibold" style={{ background: colors.surface2, color: colors.brandDark }}>{h}</span>
            ))}
            {ROWS.map((r, i) => {
              const shown = beat >= i + 2
              return r.map((c, k) => (
                <span key={`${i}${k}`} className={`px-4 py-2.5 text-[16px] ${k === 0 ? 'font-heading font-semibold' : 'font-medium'}`} style={{ color: colors.ink, borderTop: `1px solid ${colors.line}`, opacity: shown ? 1 : 0.0, transition: ease }}>
                  {c}
                </span>
              ))
            })}
          </div>
        </Stage>
      </div>
    </Card>
  )
}


/* ================================================================== 11 · Cloud Computing Architecture */

const LAYERS = [
  { n: 2, label: 'Application' },
  { n: 3, label: 'Service' },
  { n: 4, label: 'Runtime Cloud' },
  { n: 5, label: 'Storage' },
  { n: 6, label: 'Infrastructure' },
]

/** Slide 11's front-end row: the pill's fixed width, the laptop's box and the one line the arrow runs on. */
const PILL_W = 224
const LAPTOP_X = 160
const LAPTOP_W = 110
const LAPTOP_H = 70
const LINE_Y = 52

export function ArchitectureWalk({ lesson }: { lesson: string }) {
  const beat = useBeats(5)
  const ease = useEase()
  const cx = 470
  /* review 2026-10-16: no travelling dot (removed), and the back end's building has no window boxes */
  return (
    <Card id="architecture" kicker="On-Premise vs Cloud" title="Cloud Computing Architecture" lesson={lesson} beat={beat} total={5}>
      <Stage w={BOX_W} h={432} active={false}>
        {/*
          ARROW-TO-LABEL ALIGNMENT (user, 2026-10-22, slide 11 fix, and the rule for any slide with
          the same pattern): the pill has a FIXED width, so its left edge is a number the arrow can
          use, the laptop is placed so its vertical centre is the pill's centre line, and the arrow
          runs horizontally from the laptop's right edge to the pill's left edge on that one line.
          Nothing is eyeballed, so a regeneration cannot drift.
        */}
        <At x={cx} y={30} cx w={PILL_W}>
          <div className="flex h-[44px] items-center justify-center gap-2 rounded-pill bg-white px-4" style={{ boxShadow: `inset 0 0 0 2px ${colors.brand}` }}>
            <Num n={1} />
            <span className="font-heading text-[16px] font-semibold" style={{ color: colors.ink }}>Client Infrastructure</span>
          </div>
        </At>
        <At x={cx + 150} y={42}><span className="font-heading text-[15px] font-semibold tracking-[0.02em]" style={{ color: colors.muted }}>Front end</span></At>
        <At x={LAPTOP_X} y={LINE_Y - LAPTOP_H / 2}><Laptop w={LAPTOP_W} glow={beat >= 2} /></At>
        <Arrow x1={LAPTOP_X + LAPTOP_W + 6} y1={LINE_Y} x2={cx - PILL_W / 2 - 8} y2={LINE_Y} dashed />
        <At x={cx} y={118} cx>
          <Fade on={beat >= 2}>
            <div className="flex h-[40px] items-center gap-2 rounded-pill px-4" style={{ background: colors.surface2, boxShadow: `inset 0 0 0 1.5px ${colors.brand}` }}>
              <Num n={9} />
              <span className="font-heading text-[16px] font-semibold" style={{ color: colors.brandDark }}>Internet</span>
            </div>
          </Fade>
        </At>
        <Arrow x1={cx} y1={78} x2={cx} y2={114} on={beat >= 2} both />
        <Arrow x1={cx} y1={162} x2={cx} y2={202} on={beat >= 3} both />
        <At x={cx - 200} y={206} w={400}>
          <Fade on={beat >= 3}>
            <div className="relative rounded-2xl p-2.5" style={tile(`1.5px ${colors.line}`)}>
              <div className="flex flex-col gap-1.5 px-[52px]">
                {LAYERS.map((l, i) => {
                  const lit = beat >= 4 || (beat === 3 && i <= 1)
                  return (
                    <div key={l.label} className="flex h-[34px] items-center gap-2 rounded-lg px-3" style={{ ...solid(lit ? colors.brand : colors.surface2), color: lit ? colors.white : colors.brandDark, transition: ease }}>
                      <Num n={l.n} size={22} on={!lit} />
                      <span className="font-heading text-[16px] font-semibold">{l.label}</span>
                    </div>
                  )
                })}
              </div>
              <div className="absolute bottom-2.5 left-2.5 top-2.5 flex w-[40px] flex-col items-center justify-between rounded-lg py-2" style={{ background: beat >= 5 ? colors.surface2 : colors.surface, boxShadow: `inset 0 0 0 1.5px ${beat >= 5 ? colors.brand : colors.line}`, transition: ease }}>
                <span className="text-[15px] font-semibold" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', color: colors.ink }}>Management</span>
                <Num n={7} size={22} on={beat >= 5} />
              </div>
              <div className="absolute bottom-2.5 right-2.5 top-2.5 flex w-[40px] flex-col items-center justify-between rounded-lg py-2" style={{ background: beat >= 5 ? colors.surface2 : colors.surface, boxShadow: `inset 0 0 0 1.5px ${beat >= 5 ? colors.brand : colors.line}`, transition: ease }}>
                <span className="text-[15px] font-semibold" style={{ writingMode: 'vertical-rl', color: colors.ink }}>Security</span>
                <Num n={8} size={22} on={beat >= 5} />
              </div>
            </div>
          </Fade>
        </At>
        <At x={cx + 222} y={262}><Fade on={beat >= 3}><span className="font-heading text-[15px] font-semibold tracking-[0.02em]" style={{ color: colors.muted }}>Back end</span></Fade></At>
        <At x={cx + 222} y={292} w={300}>
          <Fade on={beat >= 3}>
            <BackEndBuilding w={160} />
          </Fade>
        </At>
        <Caption
          k={beat}
          w={228}
          x={24}
          y={200}
          size={16}
          text={
            [
              'The front end: what the client uses',
              'The internet joins the two halves',
              'The request reaches the back end',
              'Five back-end layers, top down',
              'Management and security run down both sides',
            ][beat - 1]
          }
        />
      </Stage>
    </Card>
  )
}

/* ================================================================== 12 · Cost, Scale and Speed (copy replaced by the review, 2026-10-15, word for word) */

function Driver({ title, body, on, flip, before, after }: { title: string; body: string[]; on: boolean; flip: boolean; before: ReactNode; after: ReactNode }) {
  const ease = useEase()
  /* RE-SYNC 2026-10-22: the TR's bullets, one line each under the driver's name (the Cost card carries two), 16px (user 2026-10-22: points a little bigger), still above the wells */
  return (
    <Stage w={354} h={284} active={on && !flip ? false : on} pad={14}>
      <div className="flex items-center gap-2">
        <span className="font-heading text-[18px] font-semibold" style={{ color: colors.ink }}>{title}:</span>
      </div>
      {body.map((line) => (
        <Note key={line} size={16} className="mt-0.5">{line}</Note>
      ))}
      {/* review 2026-10-26: the wells start right under each card's own text (142 under two points, 96 under one), so no card keeps an empty band; the picture is centred above a bottom-aligned label */}
      <div className="absolute inset-x-3 bottom-3 grid grid-cols-2 gap-2" style={{ top: body.length > 1 ? 142 : 96 }}>
        <div className="flex flex-col items-center gap-1.5 rounded-xl py-2" style={WELL}>
          <div className="grid min-h-0 flex-1 place-items-center">{before}</div>
          <Label size={14} tone="muted">Before</Label>
        </div>
        <div className="flex flex-col items-center gap-1.5 rounded-xl py-2" style={{ ...WELL, ...(flip ? { background: 'linear-gradient(180deg, #E8F0FF 0%, #F0F5FF 100%)', boxShadow: `inset 0 0 0 1.5px ${colors.brand}` } : {}), opacity: flip ? 1 : 0.35, transition: ease }}>
          <div className="grid min-h-0 flex-1 place-items-center">{after}</div>
          <Label size={14} tone={flip ? 'brand' : 'muted'}>Cloud</Label>
        </div>
      </div>
    </Stage>
  )
}

export function Drivers({ lesson }: { lesson: string }) {
  const beat = useBeats(5)
  /* review 2026-10-16: the before and cloud pictures in the clay look (clay-a.tsx, art.tsx) */
  return (
    <Card id="drivers" kicker="Adoption Drivers" title="Cost, Scale and Speed" lead="Organisations adopt cloud computing to reduce infrastructure costs, handle changing demand, and provision resources faster." lesson={lesson} beat={beat} total={5}>
      <div className="flex gap-[24px]">
        {/* RE-SYNC 2026-10-22: the TR PDF's five bullets (its "pEx to pay-per-use OpEx" line is the source build's "Converts CapEx to pay-per-use OpEx, cuts idle capacity", printed cut) */}
        <Driver title="Cost" body={['Pay for what you use instead of maintaining unused hardware', 'Converts CapEx to pay-per-use OpEx, cuts idle capacity']} on={beat >= 1} flip={beat >= 2} before={<Coins w={40} n={8} />} after={<PayGoMeter w={80} value={0.5} />} />
        <Driver title="Scale" body={['Resources added or removed as demand shifts']} on={beat >= 1} flip={beat >= 3} before={<Rack w={44} units={['run', 'run', 'idle']} />} after={<div className="flex flex-col gap-1">{[0, 1, 2].map((i) => <ServerUnit key={i} w={66} />)}</div>} />
        <Driver title="Speed" body={['Servers provisioned in minutes, not procurement cycles']} on={beat >= 1} flip={beat >= 4} before={<ClayCalendar w={56} page="6" />} after={<ClayStopwatch w={50} turn={0.15} />} />
      </div>
      <div className="relative mt-2" style={{ width: BOX_W, height: 22 }}>
        {[177, 555, 933].map((x) => (
          <Arrow key={x} x1={x} y1={0} x2={x} y2={20} on={beat >= 5} />
        ))}
      </div>
      <Fade on={beat >= 5}>
        <div className="grid h-[38px] place-items-center rounded-pill font-heading text-[17px] font-semibold text-white" style={{ background: colors.brand, width: BOX_W }}>
          Cloud Adoption
        </div>
      </Fade>
      <Fade on={beat >= 5} className="mt-2">
        <div className="flex items-center gap-2" style={{ width: BOX_W }}>
          <img src="/assets/tech/aws.png" alt="" className="h-[16px] w-auto" draggable={false} />
          <span className="text-[17px] font-medium" style={{ color: colors.ink }}>Reflected in tools like AWS Cost Explorer, Pricing Calculator</span>
        </div>
      </Fade>
    </Card>
  )
}

