import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { Arrow, At, Label, Traveller, useLoop } from '../scene'
import { ClaySvg } from '../art'
import { useFx, Slab } from '../clay-a'
import { Shadow } from '../depth'
import { ClayBar, ClayHouse, ClayLaptop, ClayParcel, ClayPhone, ClayRack, ClayTicket, ClayTruck, GroundShadow, Icon3D, LAB, RichCloud } from '../d3/kit'
import { Chips, FigureOnly, IsoAnalogy, PointsFigure } from './frames'
import { Posed } from '../Cast'
import type { CharacterConfig } from '../cast/skins/config'

/**
 * SECTION 3 · SERVICE MODELS (reference frames 25 to 32), in session 1's 3D
 * look (2026-10-26): front-facing glossy slabs (`ClayBar`, slide 19 of
 * session 1's hypervisor stack), the rich cloud, library renders and session
 * 1's drawn devices, each on a soft ground shadow; labels are DOM chips.
 *
 * Every figure runs one loop whose motion is the claim: the ownership line
 * glides across the three stacks from IaaS to SaaS, the TR's two examples
 * light on the deployment x service grid, packets drip from the IaaS cloud
 * into raw compute, storage and network, the customer's application is
 * lowered onto the PaaS platform, the SaaS cloud lights three devices'
 * screens. The three pizza analogies share one four-layer stack
 * (Infrastructure, Operating system, Runtime, Application) and the everyday
 * scene and the stack run on one clock, so what the customer carries in
 * arrives on both sides at the same moment. Blue is the provider's, amber the
 * customer's.
 */

const EASE = 'cubic-bezier(0.22,1,0.36,1)'
const PROVIDER = colors.brand
const CUSTOMER = '#F5A623' // the iso engine's customer amber (ISO.customer)
const CUSTOMER_INK = '#5E3700'

type Owner = 'P' | 'C'
const ownerColor = (o: Owner) => (o === 'P' ? PROVIDER : CUSTOMER)

/** 0 before a, 1 after b, eased between. */
function within(t: number, a: number, b: number) {
  if (t <= a) return 0
  if (t >= b) return 1
  const x = (t - a) / (b - a)
  return x * x * (3 - 2 * x)
}
/** rises a to b, holds, falls c to d. */
const pulse = (t: number, a: number, b: number, c: number, d: number) => within(t, a, b) * (1 - within(t, c, d))

/** A labelled slab in an owner's colour: the session 1 hypervisor bar. */
function OwnerSlab({ w, h, owner, children, size = 15 }: { w: number; h: number; owner: Owner; children?: ReactNode; size?: number }) {
  return (
    <ClayBar w={w} h={h} fill={ownerColor(owner)}>
      {children !== undefined && (
        <span className="font-heading font-semibold" style={{ fontSize: size, color: owner === 'P' ? colors.white : CUSTOMER_INK }}>
          {children}
        </span>
      )}
    </ClayBar>
  )
}

/* ------------------------------------------------------------------ local drawings, session 1's finish */

/** An oven: a provider-blue body lit from the upper left, a dark window that glows warm while it bakes, two knobs. */
function ClayOven({ w, on = false }: { w: number; on?: boolean }) {
  const fx = useFx({ body: LAB.cobalt, glass: LAB.navy, knob: LAB.lavender, warm: LAB.orange })
  return (
    <ClaySvg w={w} vw={120} vh={124}>
      {fx.defs}
      <Shadow id={fx.id} cx={60} cy={119} rx={54} ry={4} o={0.24} />
      <g>
        <Slab x={4} y={8} w={108} h={106} rx={14} d={6} hue={LAB.cobalt} fill={fx.g('body')} />
      </g>
      <g>
        <rect x={16} y={20} width={84} height={14} rx={7} fill={LAB.navy} opacity={0.35} />
        <circle cx={30} cy={27} r={5} fill={fx.g('knob')} />
        <circle cx={48} cy={27} r={5} fill={fx.g('knob')} />
        <circle cx={28.5} cy={25.5} r={1.6} fill="#FFFFFF" opacity={0.8} />
        <circle cx={46.5} cy={25.5} r={1.6} fill="#FFFFFF" opacity={0.8} />
        <rect x={64} y={24} width={28} height={6} rx={3} fill={LAB.lavender} opacity={0.8} />
      </g>
      <g>
        <rect x={16} y={44} width={84} height={58} rx={10} fill={fx.g('glass')} />
        <rect x={16} y={44} width={84} height={58} rx={10} fill={fx.g('warm')} style={{ opacity: on ? 0.85 : 0, transition: `opacity 520ms ${EASE}` }} />
        <path d="M 22 48 L 58 48 L 22 84 Z" fill="#FFFFFF" opacity={0.16} />
        <rect x={30} y={40} width={56} height={5} rx={2.5} fill={LAB.lavender} />
      </g>
    </ClaySvg>
  )
}

const DOUGH = '#F3D29A'
const SAUCE = '#D8352F'
const CHEESE = '#FCC82B'
const BASIL = '#6E9A72'

/** A pizza on its tray, seen from the front and above: `stage` -1 none, 0 dough, 1 sauce, 2 cheese, 3 toppings. */
function ClayPizza({ w, stage, tray = LAB.lavDeep, opacity = 1 }: { w: number; stage: number; tray?: string; opacity?: number }) {
  const fx = useFx({ tray, dough: DOUGH, sauce: SAUCE, cheese: CHEESE })
  const show = (s: number): CSSProperties => ({ opacity: stage >= s ? opacity : 0, transition: `opacity 420ms ${EASE}` })
  return (
    <ClaySvg w={w} vw={110} vh={50}>
      {fx.defs}
      <Shadow id={fx.id} cx={55} cy={44} rx={50} ry={4} o={0.2} />
      <g>
        <ellipse cx={55} cy={30} rx={52} ry={15} fill={drop2(tray)} />
        <ellipse cx={55} cy={27} rx={52} ry={15} fill={fx.g('tray')} />
        <ellipse cx={42} cy={21} rx={20} ry={4} fill="#FFFFFF" opacity={0.25} />
      </g>
      <g style={show(0)}>
        <ellipse cx={55} cy={27} rx={42} ry={11} fill={fx.g('dough')} />
        <ellipse cx={46} cy={23} rx={16} ry={3} fill="#FFFFFF" opacity={0.35} />
      </g>
      <g style={show(1)}>
        <ellipse cx={55} cy={27} rx={35} ry={8.5} fill={fx.g('sauce')} />
      </g>
      <g style={show(2)}>
        {[[40, 25], [55, 23], [70, 26], [48, 30], [63, 31]].map(([x, y], i) => (
          <ellipse key={i} cx={x} cy={y} rx={8} ry={3.4} fill={fx.g('cheese')} />
        ))}
      </g>
      <g style={show(3)}>
        {[[36, 27, SAUCE], [52, 26, BASIL], [66, 23, SAUCE], [74, 29, BASIL], [58, 31, SAUCE], [45, 22, BASIL]].map(([x, y, c], i) => (
          <circle key={i} cx={x as number} cy={y as number} r={2.8} fill={c as string} />
        ))}
      </g>
    </ClaySvg>
  )
}
const drop2 = (c: string) => (c === LAB.lavDeep ? '#8EA3D6' : '#1C4FD6')

/** A kitchen counter: a wooden top with a lit edge over pale cupboard doors. */
function ClayCounter({ w }: { w: number }) {
  const fx = useFx({ wood: LAB.wood, door: LAB.paper })
  return (
    <ClaySvg w={w} vw={170} vh={78}>
      {fx.defs}
      <Shadow id={fx.id} cx={85} cy={74} rx={80} ry={4} o={0.22} />
      <g>
        <Slab x={10} y={20} w={150} h={52} rx={8} d={0} hue={LAB.lavDeep} fill={fx.g('door')} spec={false} />
        <rect x={20} y={28} width={62} height={36} rx={6} fill={LAB.lavender} />
        <rect x={88} y={28} width={62} height={36} rx={6} fill={LAB.lavender} />
        <rect x={70} y={40} width={4} height={12} rx={2} fill={LAB.navy} opacity={0.6} />
        <rect x={96} y={40} width={4} height={12} rx={2} fill={LAB.navy} opacity={0.6} />
      </g>
      <g>
        <Slab x={4} y={8} w={162} h={14} rx={6} d={4} hue={LAB.wood} fill={fx.g('wood')} />
      </g>
    </ClaySvg>
  )
}

/** A tablet held landscape: a navy body with a lit edge, a screen that fades to cobalt when lit. */
function ClayTablet({ w, lit = false }: { w: number; lit?: boolean }) {
  const fx = useFx({ body: LAB.navy, off: LAB.lavender, on: LAB.cobalt })
  return (
    <ClaySvg w={w} vw={120} vh={86}>
      {fx.defs}
      <Shadow id={fx.id} cx={60} cy={82} rx={52} ry={3.5} o={0.22} />
      <g>
        <Slab x={4} y={6} w={112} h={72} rx={12} d={0} hue={LAB.navy} fill={fx.g('body')} />
        <rect x={11} y={13} width={98} height={58} rx={7} fill={fx.g('off')} />
        <rect x={11} y={13} width={98} height={58} rx={7} fill={fx.g('on')} style={{ opacity: lit ? 1 : 0, transition: `opacity 520ms ${EASE}` }} />
        <rect x={19} y={21} width={50} height={7} rx={3.5} fill="#FFFFFF" opacity={0.85} />
        <rect x={19} y={34} width={36} height={28} rx={5} fill="#FFFFFF" opacity={0.6} />
        <rect x={61} y={34} width={40} height={6} rx={3} fill="#FFFFFF" opacity={0.6} />
        <rect x={61} y={46} width={30} height={6} rx={3} fill="#FFFFFF" opacity={0.45} />
        <path d="M 14 16 L 52 16 L 14 52 Z" fill="#FFFFFF" opacity={0.14} />
      </g>
    </ClaySvg>
  )
}

/* ================================================================== 25 · three stacks */

const LAYERS = ['Virtualization, servers, storage, network', 'Operating system', 'Runtime & middleware', 'Data & access configuration', 'Application'] // bottom to top
const MODELS: { name: string; owners: Owner[]; split: number }[] = [
  { name: 'IaaS', owners: ['P', 'C', 'C', 'C', 'C'], split: 1 },
  { name: 'PaaS', owners: ['P', 'P', 'P', 'C', 'C'], split: 3 },
  { name: 'SaaS', owners: ['P', 'P', 'P', 'C', 'P'], split: 3 },
]

/**
 * Three stacks of five front-facing slabs, each in the TR table's owner
 * colour with the cell word on it; the layer names in a column on the left
 * under `Stack layer`; the ownership line sits at each stack's split and
 * glides from stack to stack and back.
 */
function TowersScene() {
  const t = useLoop(12000, { mode: 'pingpong', still: 0.5 })
  const SW = 200
  const SH = 40
  const GAP = 8
  const Y0 = 70
  const CX = [490, 720, 950]
  const rowTop = (k: number) => Y0 + (4 - k) * (SH + GAP) // k counts from the bottom
  const splitY = (i: number) => rowTop(MODELS[i].split - 1) - GAP / 2
  const pos = within(t, 0.12, 0.38) + within(t, 0.62, 0.88)
  const near = Math.round(pos)
  const lo = Math.floor(pos)
  const hi = Math.min(2, lo + 1)
  const f = pos - lo
  const lx = CX[lo] + (CX[hi] - CX[lo]) * f
  const ly = splitY(lo) + (splitY(hi) - splitY(lo)) * f
  const LW = SW + 44
  return (
    <>
      <At x={24} y={40} cy w={350}>
        <div className="text-right font-heading text-[15px] font-semibold uppercase tracking-[0.08em]" style={{ color: colors.brandDark }}>
          Stack layer
        </div>
      </At>
      {LAYERS.map((name, k) => (
        <At key={name} x={24} y={rowTop(k) + SH / 2} cy w={350}>
          <div className="text-right font-heading text-[16px] font-semibold leading-tight" style={{ color: colors.ink }}>
            {name}
          </div>
        </At>
      ))}
      {MODELS.map((m, i) => (
        <At key={m.name} x={CX[i]} y={40} cx cy>
          <Label size={18} strong tone={near === i ? 'solid' : 'plain'}>
            {m.name}
          </Label>
        </At>
      ))}
      {MODELS.map((m, i) => (
        <At key={`s-${m.name}`} x={CX[i] - SW / 2} y={Y0}>
          <div className="flex flex-col" style={{ gap: GAP }}>
            {[...m.owners].reverse().map((o, j) => (
              <OwnerSlab key={j} w={SW} h={SH} owner={o}>
                {o === 'P' ? 'Provider' : 'Customer'}
              </OwnerSlab>
            ))}
            <GroundShadow w={SW} style={{ marginTop: 2 - GAP }} />
          </div>
        </At>
      ))}
      {/* the ownership line: provider below it, customer above */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 rounded-full"
        style={{ width: LW, height: 4, background: colors.brandDark, boxShadow: `0 0 0 3px ${colors.brand}33, 0 0 14px ${colors.brand}`, transform: `translate(${lx - LW / 2}px, ${ly - 2}px)`, opacity: 1 - 0.65 * Math.sin(Math.PI * f) }}
      />
      <At x={720} y={342} cx cy>
        <Chips
          items={[
            { text: 'Provider manages', color: PROVIDER },
            { text: 'Customer manages', color: CUSTOMER },
          ]}
        />
      </At>
    </>
  )
}

export function StackMap({ lesson }: { lesson: string }) {
  return <FigureOnly id="stack" kicker="Service Model Spectrum" title="Stack Ownership Map" lead="The three service models share one technology stack; each shifts the line dividing provider-managed layers from customer-managed layers" lesson={lesson} figure={<TowersScene />} h={392} />
}

/* ================================================================== 26 · any service model on any deployment model */

const DEPLOY = ['Public', 'Private', 'Hybrid', 'Community']
const SERVICE = ['IaaS', 'PaaS', 'SaaS']

/** A front-facing grid: deployment models across, service models down, a pale slab in every cell; the TR's two examples light in turn. */
function GridScene() {
  const t = useLoop(9000, { mode: 'sawtooth', still: 0.25 })
  const examples = [
    { name: 'Private-cloud IaaS', dx: 1, sy: 0 },
    { name: 'Public-cloud SaaS', dx: 0, sy: 2 },
  ]
  const which = t < 0.5 ? 0 : 1
  const lit = examples[which]
  const glow = pulse(t % 0.5, 0.02, 0.1, 0.42, 0.49)
  const CW = 190
  const CH = 56
  const GX = 16
  const GY = 18
  const X0 = 190
  const Y0 = 82
  const cx = (i: number) => X0 + i * (CW + GX) + CW / 2
  const cy = (j: number) => Y0 + j * (CH + GY) + CH / 2
  const gridW = DEPLOY.length * CW + (DEPLOY.length - 1) * GX
  const gridH = SERVICE.length * CH + (SERVICE.length - 1) * GY
  return (
    <>
      {/* the lit example's column and row, faint */}
      <div aria-hidden className="pointer-events-none absolute rounded-2xl" style={{ left: cx(lit.dx) - CW / 2 - 8, top: Y0 - 8, width: CW + 16, height: gridH + 16, background: colors.brand, opacity: 0.08 * glow }} />
      <div aria-hidden className="pointer-events-none absolute rounded-2xl" style={{ left: X0 - 8, top: cy(lit.sy) - CH / 2 - 8, width: gridW + 16, height: CH + 16, background: colors.brand, opacity: 0.08 * glow }} />
      {DEPLOY.map((name, i) => (
        <At key={name} x={cx(i)} y={44} cx cy>
          <Label size={16} strong tone={lit.dx === i && glow > 0.5 ? 'brand' : 'plain'}>
            {name}
          </Label>
        </At>
      ))}
      {SERVICE.map((name, j) => (
        <At key={name} x={X0 - 24} y={cy(j)} cy>
          <div style={{ transform: 'translateX(-100%)' }}>
            <Label size={16} strong tone={lit.sy === j && glow > 0.5 ? 'brand' : 'plain'}>
              {name}
            </Label>
          </div>
        </At>
      ))}
      {SERVICE.map((_, j) =>
        DEPLOY.map((__, i) => {
          const on = examples.findIndex((e) => e.dx === i && e.sy === j)
          const k = on >= 0 && on === which ? glow : 0
          return (
            <At key={`${i}-${j}`} x={cx(i) - CW / 2} y={cy(j) - CH / 2}>
              <div className="relative" style={{ width: CW, height: CH }}>
                <div className="absolute inset-0">
                  <ClayBar w={CW} h={CH} fill={LAB.lavender} />
                </div>
                <div className="absolute inset-0" style={{ opacity: k, transition: `opacity 420ms ${EASE}` }}>
                  <ClayBar w={CW} h={CH} fill={colors.brand} />
                </div>
                {on >= 0 && (
                  <span className="absolute inset-0 flex items-center justify-center font-heading text-[16px] font-semibold" style={{ color: k > 0.5 ? colors.white : colors.brandDark, transition: `color 420ms ${EASE}` }}>
                    {examples[on].name}
                  </span>
                )}
              </div>
            </At>
          )
        }),
      )}
      <At x={X0} y={Y0 + gridH + 2}>
        <GroundShadow w={gridW} style={{ marginTop: 0 }} />
      </At>
    </>
  )
}

export function StackGrid({ lesson }: { lesson: string }) {
  return (
    <FigureOnly
      id="stack-grid"
      kicker="Service Model Spectrum"
      title="Stack Ownership Map"
      lead={['Deployment models say where the infrastructure sits and who owns it; service models say what is abstracted', 'Any service model can run on any deployment model (for example, private-cloud IaaS, public-cloud SaaS)']}
      lesson={lesson}
      figure={<GridScene />}
      h={340}
    />
  )
}

/* ================================================================== 27 · IaaS */

/** A soft glow behind an object that lights while `on`. */
function Glow({ on, w, h, tone = colors.brand }: { on: boolean; w: number; h: number; tone?: string }) {
  return <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 rounded-full" style={{ width: w, height: h, transform: 'translate(-50%,-50%)', background: `radial-gradient(closest-side, ${tone}55, ${tone}00)`, opacity: on ? 1 : 0, transition: `opacity 420ms ${EASE}` }} />
}

/** The TR's diagram: a cloud labelled IaaS over a rack, a database and a router; packets drip down three arrows in turn and each block lights as one lands. */
function IaasScene() {
  const t = useLoop(7200, { mode: 'sawtooth', still: 0.3 })
  const start = (i: number) => i * 0.22 + 0.04
  const dripping = (i: number) => t >= start(i) && t < start(i) + 0.26
  const landed = (i: number) => (t - (start(i) + 0.26) + 1) % 1 < 0.3
  const items: { name: string; x: number; top: number; art: (on: boolean) => ReactNode }[] = [
    { name: 'Compute', x: 147, top: 204, art: (on) => <ClayRack w={86} units={on ? ['run', 'run', 'run'] : ['run', 'idle', 'idle']} /> },
    { name: 'Storage', x: 317, top: 204, art: () => <Icon3D name="database" w={80} /> },
    { name: 'Network', x: 487, top: 220, art: () => <Icon3D name="router" w={104} /> },
  ]
  /* review 2026-10-26 (connections): out of the cloud's underside, onto each object's top */
  const SRC: [number, number][] = [[278, 158], [317, 162], [356, 158]]
  return (
    <>
      <At x={317} y={24} cx>
        <Label size={18} strong tone="solid">
          IaaS
        </Label>
      </At>
      <At x={317} y={62} cx>
        <RichCloud w={160} />
      </At>
      {items.map((it, i) => (
        <Arrow key={`a-${i}`} x1={SRC[i][0]} y1={SRC[i][1]} x2={it.x} y2={it.top - 2} tone={landed(i) || dripping(i) ? colors.brand : colors.line} />
      ))}
      {items.map((it, i) => (
        <Traveller key={`t-${i}`} path={[SRC[i], [it.x, it.top - 8]]} run={dripping(i)} k={i} size={12} tone={colors.brand} dur={1.8} />
      ))}
      {items.map((it, i) => (
        <At key={it.name} x={it.x} y={300} cx>
          <div className="flex flex-col items-center gap-2" style={{ transform: 'translateY(-100%)' }}>
            <div className="relative flex items-end">
              <Glow on={landed(i)} w={150} h={120} />
              <div className="relative">{it.art(landed(i))}</div>
            </div>
          </div>
        </At>
      ))}
      {items.map((it, i) => (
        <At key={`l-${it.name}`} x={it.x} y={312} cx>
          <Label size={15} strong tone={landed(i) ? 'brand' : 'plain'}>
            {it.name}
          </Label>
        </At>
      ))}
    </>
  )
}

export function Iaas({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="iaas"
      kicker="IaaS Explained"
      title="Raw Infrastructure Rental"
      lead="Infrastructure as a Service rents compute, storage and network as raw building blocks, leaving the operating system and everything above it to the customer"
      lesson={lesson}
      points={['Abstracts physical hardware, racking and data-centre wiring', 'Customer installs OS, runtime, middleware and application', 'Representative services: AWS (Amazon Web Services) EC2, EBS, VPC', 'Azure Virtual Machines, GCP Compute Engine offer same layer']}
      figure={<IaasScene />}
    />
  )
}

/* ================================================================== the shared four-layer stack (28, 30, 32) */

const STACK4 = ['Infrastructure', 'Operating system', 'Runtime', 'Application'] // bottom to top
const AN_LAP = 9000
const fadeOut = (t: number) => 1 - within(t, 0.9, 0.98)

/**
 * The analogy's cloud side: four front-facing slabs, bottom to top, in their
 * owners' colours. `arrive[k]` is the phase at which slab k drops in (null:
 * there from the start); arrived slabs fade out at the end of the lap so it
 * loops. `data` adds the customer's one amber parcel under the stack.
 */
function Stack4({ owners, arrive, data = false, dataArrive = null }: { owners: Owner[]; arrive: (number | null)[]; data?: boolean; dataArrive?: number | null }) {
  const t = useLoop(AN_LAP, { mode: 'sawtooth', still: 0.75 })
  const SW = 180
  const SH = 42
  const GAP = 8
  const X = 64
  const Y0 = data ? 30 : 50
  const inK = (a: number | null) => (a === null ? 1 : within(t, a, a + 0.14) * fadeOut(t))
  const rowTop = (k: number) => Y0 + (3 - k) * (SH + GAP)
  const dataK = data ? inK(dataArrive) : 0
  return (
    <>
      {STACK4.map((_, k) => {
        const a = inK(arrive[k])
        return (
          <At key={`s-${k}`} x={X} y={rowTop(k)}>
            <div style={{ opacity: a, transform: `translateY(${-(1 - a) * 28}px)` }}>
              <OwnerSlab w={SW} h={SH} owner={owners[k]} />
            </div>
          </At>
        )
      })}
      <At x={X} y={rowTop(0) + SH + 2}>
        <GroundShadow w={SW} style={{ marginTop: 0 }} />
      </At>
      {STACK4.map((name, k) => (
        <At key={name} x={X + SW + 16} y={rowTop(k) + SH / 2} cy style={{ opacity: Math.max(0.35, inK(arrive[k])), transition: `opacity 420ms ${EASE}` }}>
          <Label size={14} strong tone={owners[k] === 'P' ? 'lift' : 'warn'}>
            {name}
          </Label>
        </At>
      ))}
      {data && (
        <At x={X + SW / 2} y={rowTop(0) + SH + 20} cx style={{ opacity: Math.max(0.35, dataK) }}>
          <div className="flex items-center gap-3">
            <div style={{ transform: `translateY(${-(1 - dataK) * 20}px)` }}>
              <ClayParcel w={40} tone={CUSTOMER} />
            </div>
            <Label size={14} strong tone="warn">
              Your data
            </Label>
          </div>
        </At>
      )}
    </>
  )
}

/** The everyday kitchen: the oven (provider blue), a counter with the pizza tray, and amber crates the customer carries in at `crates`. */
function Kitchen({ crates, stageAt, doughReady }: { crates: number[]; stageAt: [number, 0 | 1 | 2 | 3][]; doughReady: boolean }) {
  const t = useLoop(AN_LAP, { mode: 'sawtooth', still: 0.75 })
  let stage: number = doughReady ? 0 : -1
  for (const [a, s] of stageAt) if (t >= a) stage = s
  const fo = fadeOut(t)
  const baked = t > 0.66 && t < 0.92
  const FLOOR = 216
  const C = 48
  // the crates the customer carries in, stacked by the counter: two on the floor, one on top
  const slots: [number, number][] = crates.length === 1 ? [[28, 50]] : [[0, 50], [56, 50], [28, 14]]
  return (
    <>
      <At x={29} y={FLOOR - 98}>
        <div className="relative" style={{ width: 104, height: 98 }}>
          {crates.map((a, i) => {
            const k = within(t, a, a + 0.12)
            return (
              <div key={i} className="absolute" style={{ left: slots[i][0], top: slots[i][1], opacity: t >= a ? fo * Math.min(1, k * 2) : 0, transform: `translateX(${-(1 - k) * 16}px)` }}>
                <ClayParcel w={C} tone={CUSTOMER} />
              </div>
            )
          })}
        </div>
      </At>
      <At x={225} y={FLOOR} cx>
        <div className="flex flex-col items-center" style={{ transform: 'translateY(-100%)' }}>
          <div style={{ marginBottom: -16 }}>
            {/* the dough is the provider's when it comes ready; the rest arrives with the customer */}
            <ClayPizza w={126} stage={stage} tray={doughReady ? colors.brand : LAB.lavDeep} opacity={doughReady ? 1 : fo} />
          </div>
          <ClayCounter w={160} />
        </div>
      </At>
      <At x={379} y={FLOOR} cx>
        <div style={{ transform: 'translateY(-100%)' }}>
          <ClayOven w={124} on={baked} />
        </div>
      </At>
    </>
  )
}

/* ================================================================== 28 · kitchen space only */

const IAAS_IN = [0.1, 0.28, 0.46]

export function IaasAnalogy({ lesson }: { lesson: string }) {
  return (
    <IsoAnalogy
      id="iaas-analogy"
      kicker="IaaS Explained"
      lesson={lesson}
      everyday={{ label: 'Kitchen space only', scene: <Kitchen crates={IAAS_IN} doughReady={false} stageAt={[[IAAS_IN[0] + 0.14, 0], [IAAS_IN[1] + 0.14, 1], [IAAS_IN[2] + 0.14, 2], [IAAS_IN[2] + 0.18, 3]]} /> }}
      cloud={{ label: 'IaaS', scene: <Stack4 owners={['P', 'C', 'C', 'C']} arrive={[null, ...IAAS_IN]} /> }}
      claim="You bring everything above the oven"
    />
  )
}

/* ================================================================== 29 · PaaS */

/** The TR's diagram: a cloud labelled PaaS over the managed platform (Operating system, Runtime, blue); the customer's application slab is lowered onto it. */
function PaasScene() {
  const t = useLoop(8000, { mode: 'sawtooth', still: 0.7 })
  const slide = within(t, 0.08, 0.3)
  const drop = within(t, 0.3, 0.55)
  const fo = fadeOut(t)
  const landed = drop > 0.98
  const SW = 240
  const SH = 44
  const X = 317 - SW / 2
  const APP_W = 160
  const APP_Y = 178
  const RT_Y = 236
  const OS_Y = 288
  const show = fo * Math.min(1, slide * 3)
  const move = `translate(${(1 - slide) * 60}px, ${-(1 - drop) * 22}px)`
  return (
    <>
      <At x={317} y={24} cx>
        <Label size={18} strong tone="solid">
          PaaS
        </Label>
      </At>
      <At x={317} y={60} cx>
        <RichCloud w={140} />
      </At>
      <At x={317 - APP_W / 2} y={APP_Y}>
        <div className="flex items-center gap-[14px]" style={{ opacity: show, transform: move }}>
          <div className="relative">
            <Glow on={landed && fo > 0.5} w={APP_W + 40} h={SH + 30} tone={CUSTOMER} />
            <div className="relative">
              <OwnerSlab w={APP_W} h={SH} owner="C" />
            </div>
          </div>
          <Label size={15} strong tone="warn">
            Your application
          </Label>
        </div>
      </At>
      <At x={X} y={RT_Y}>
        <OwnerSlab w={SW} h={SH} owner="P" />
      </At>
      <At x={X + SW + 14} y={RT_Y + SH / 2} cy>
        <Label size={15} strong tone="lift">
          Runtime
        </Label>
      </At>
      <At x={X} y={OS_Y}>
        <div className="flex flex-col">
          <OwnerSlab w={SW} h={SH} owner="P" />
          <GroundShadow w={SW} style={{ marginTop: 2 }} />
        </div>
      </At>
      <At x={X - 14} y={OS_Y + SH / 2} cy>
        <div style={{ transform: 'translateX(-100%)' }}>
          <Label size={15} strong tone="lift">
            Operating system
          </Label>
        </div>
      </At>
    </>
  )
}

export function Paas({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="paas"
      kicker="PaaS Explained"
      title="Ready-Made Platform"
      lead="Platform as a Service adds a managed operating system and runtime atop infrastructure, so the customer only builds, deploys and runs application code"
      lesson={lesson}
      points={['Abstracts OS patching, runtime setup and server scaling', 'Less control over OS-level tuning than IaaS allows', 'Representative services: AWS Elastic Beanstalk, AWS App Runner', 'Azure App Service, GCP App Engine offer same layer']}
      figure={<PaasScene />}
    />
  )
}

/* ================================================================== 30 · kitchen and dough ready */

const PAAS_IN = 0.3

export function PaasAnalogy({ lesson }: { lesson: string }) {
  return (
    <IsoAnalogy
      id="paas-analogy"
      kicker="PaaS Explained"
      lesson={lesson}
      everyday={{ label: 'Kitchen and dough ready', scene: <Kitchen crates={[PAAS_IN]} doughReady stageAt={[[PAAS_IN + 0.14, 1], [PAAS_IN + 0.18, 2], [PAAS_IN + 0.22, 3]]} /> }}
      cloud={{ label: 'PaaS', scene: <Stack4 owners={['P', 'P', 'P', 'C']} arrive={[null, null, null, PAAS_IN]} /> }}
      claim="You bring only the toppings"
    />
  )
}

/* ================================================================== 31 · SaaS */

/** The TR's diagram: a cloud labelled SaaS sends the finished application down to a laptop, a tablet and a phone, whose screens light as it lands; an update badge pulses by the cloud; the customer's data is the one amber parcel. */
function SaasScene() {
  const t = useLoop(8000, { mode: 'sawtooth', still: 0.5 })
  const start = (i: number) => 0.06 + i * 0.12
  const going = (i: number) => t >= start(i) && t < start(i) + 0.28
  const lit = (i: number) => t > start(i) + 0.28 && t < 0.92
  const badge = 1 + 0.16 * (pulse(t, 0.0, 0.08, 0.12, 0.2) + pulse(t, 0.5, 0.58, 0.62, 0.7))
  const BASE = 296
  const dev: { x: number; top: number; art: (on: boolean) => ReactNode }[] = [
    { x: 140, top: BASE - 88, art: (on) => <ClayLaptop w={128} lit={on} /> },
    { x: 296, top: BASE - 74, art: (on) => <ClayTablet w={104} lit={on} /> },
    { x: 432, top: BASE - 92, art: (on) => <ClayPhone w={46} lit={on} /> },
  ]
  /* review 2026-10-26 (connections): out of the cloud's underside, onto each device's top */
  const SRC: [number, number][] = [[288, 158], [317, 162], [346, 158]]
  return (
    <>
      <At x={317} y={24} cx>
        <Label size={18} strong tone="solid">
          SaaS
        </Label>
      </At>
      <At x={317} y={60} cx>
        <RichCloud w={156} />
      </At>
      <At x={136} y={112} cx cy>
        <Label size={15} strong tone="brand">
          Finished application
        </Label>
      </At>
      <At x={502} y={64} cx>
        <div className="flex flex-col items-center gap-2">
          <div style={{ transform: `scale(${badge})` }}>
            <Icon3D name="update" w={44} shadow={false} />
          </div>
          <Label size={15} strong tone="good">
            Automatic updates
          </Label>
        </div>
      </At>
      {dev.map((d, i) => (
        <Arrow key={`a-${i}`} x1={SRC[i][0]} y1={SRC[i][1]} x2={d.x} y2={d.top - 2} tone={going(i) || lit(i) ? colors.brand : colors.line} />
      ))}
      {dev.map((d, i) => (
        <Traveller key={`t-${i}`} path={[SRC[i], [d.x, d.top - 8]]} run={going(i)} k={i} size={12} tone={colors.brand} dur={2.1} />
      ))}
      {dev.map((d, i) => (
        <At key={`d-${i}`} x={d.x} y={BASE} cx>
          <div style={{ transform: 'translateY(-100%)' }}>{d.art(lit(i))}</div>
        </At>
      ))}
      <At x={548} y={BASE} cx>
        <div className="flex flex-col items-center gap-2" style={{ transform: 'translateY(-58px)' }}>
          <ClayParcel w={56} tone={CUSTOMER} />
          <Label size={15} strong tone="warn">
            Your data
          </Label>
        </div>
      </At>
    </>
  )
}

export function Saas({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="saas"
      kicker="SaaS Explained"
      title="Complete Application Delivered"
      lead="Software as a Service delivers a finished application; the provider manages every layer beneath it, leaving the customer only account setup and data"
      lesson={lesson}
      points={['Abstracts the entire stack below the application', 'Provider pushes feature updates automatically, no customer action', 'Representative services: Gmail/Google Workspace, Salesforce, Microsoft 365', 'Customer effort and control both fall sharply toward SaaS']}
      figure={<SaasScene />}
    />
  )
}

/* ================================================================== 32 · a ready-made pizza */

const SAAS_IN = 0.36

/**
 * The customer, drawn from the Character Lab (review 2026-10-26: the library render could not take the
 * pizza): the same look as that render, curly dark hair, a blue hoodie, dark jeans.
 */
const PIZZA_BOY: CharacterConfig = {
  name: 'Customer',
  gender: 'male',
  art: 'soft',
  shading: 'clay',
  skinTone: '#F2C29B',
  hair: { style: 'curly', color: '#1B1E2E' },
  face: { jaw: 'round', brows: 'thick', eyes: 'big', mouth: 'full' },
  outfit: { top: 'hoodie', topColor: '#2D63FB', bottom: 'jeans', bottomColor: '#1B2238', shoeColor: '#2A2A30' },
  accessories: {},
  build: { height: 0.9, shoulders: 0.92 },
}
/** the whole figure, with room on the left for the arm that reaches out */
const BOY_CROP = { x0: -30, y0: 10, x1: 360, y1: 595 }
const BOY_S = 0.28
/** where the rig's hands are in the held reach, on the lab's canvas (measured): the reaching hand and the hand at the side */
const toStage = (x: number, cx: number, cy: number, floor: number): [number, number] => [x + (cx - BOY_CROP.x0) * BOY_S, floor - (BOY_CROP.y1 - cy) * BOY_S]

/**
 * A delivery truck (provider blue) drives up the road with the boxed pizza; the customer, holding only
 * an order slip (amber), reaches out and the box comes into his hand.
 */
function DeliveryScene() {
  const t = useLoop(AN_LAP, { mode: 'sawtooth', still: 0.62 })
  const arrive = within(t, 0.04, 0.3)
  const leave = within(t, 0.7, 0.88)
  const hand = within(t, SAAS_IN, SAAS_IN + 0.18)
  const reach = t >= SAAS_IN - 0.06
  const fo = fadeOut(t)
  const inCab = t < SAAS_IN
  const FLOOR = 226
  const BOY_X = 188
  /* the truck's own parcel sits at (41, FLOOR - 52); the box comes to rest in the reaching hand */
  const HAND = toStage(BOY_X, 4, 349, FLOOR)
  const SIDE = toStage(BOY_X, 262, 420, FLOOR)
  const FROM: [number, number] = [41, FLOOR - 52]
  const bx = (1 - hand) * (FROM[0] - HAND[0])
  const by = (1 - hand) * (FROM[1] - HAND[1])
  return (
    <>
      {/* the road the truck stands on: its tyres meet the road's top edge */}
      <div className="absolute rounded-full" style={{ left: 24, top: FLOOR - 8, width: 172, height: 10, background: 'linear-gradient(180deg, #5A6378 0%, #3E3D45 100%)', boxShadow: '0 4px 8px -4px rgba(31,64,140,0.35)' }} />
      <div className="absolute" style={{ left: 34, top: FLOOR - 4, width: 152, height: 2, backgroundImage: 'linear-gradient(90deg, #FFFFFF 0 10px, transparent 10px 20px)', backgroundSize: '20px 2px', opacity: 0.6 }} />
      <At x={30} y={FLOOR - 1}>
        <div style={{ transform: `translate(${-(1 - arrive) * 30 - leave * 30}px, -100%)`, opacity: arrive * (1 - leave) }}>
          <ClayTruck w={140} parcels={inCab ? [colors.brand] : []} />
        </div>
      </At>
      <At x={BOY_X} y={FLOOR}>
        <div style={{ transform: 'translateY(-100%)' }}>
          <Posed key={reach ? 'reach' : 'wait'} cfg={PIZZA_BOY} scale={BOY_S} crop={BOY_CROP} gesture={reach ? 'presentLeft' : undefined} at={0.9} expression="happy" />
        </div>
      </At>
      {/* the order slip, in the hand that stays down */}
      <At x={SIDE[0] - 14} y={SIDE[1] - 9}>
        <ClayTicket w={30} />
      </At>
      <At x={HAND[0] - 20} y={HAND[1] - 30}>
        <div style={{ opacity: inCab ? 0 : fo, transform: `translate(${bx}px, ${by}px)` }}>
          <ClayParcel w={40} tone={colors.brand} />
        </div>
      </At>
      <At x={378} y={FLOOR} cx>
        <div style={{ transform: 'translateY(-100%)' }}>
          <ClayHouse w={120} />
        </div>
      </At>
    </>
  )
}

export function SaasAnalogy({ lesson }: { lesson: string }) {
  return (
    <IsoAnalogy
      id="saas-analogy"
      kicker="SaaS Explained"
      lesson={lesson}
      everyday={{ label: 'A ready-made pizza', scene: <DeliveryScene /> }}
      cloud={{ label: 'SaaS', scene: <Stack4 owners={['P', 'P', 'P', 'P']} arrive={[SAAS_IN, SAAS_IN + 0.03, SAAS_IN + 0.06, SAAS_IN + 0.09]} data /> }}
      claim="You bring nothing but an order"
    />
  )
}
