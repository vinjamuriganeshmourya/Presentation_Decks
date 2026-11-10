import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { Arrow, At, Label, Traveller, useLoop } from '../scene'
import { ClaySvg } from '../art'
import { useFx, Slab } from '../clay-a'
import { Shadow } from '../depth'
import { ClayBar, ClayHouse, ClayLaptop, ClayMonitor, ClayParcel, ClayPhone, ClayRack, ClayTicket, ClayTruck, GroundShadow, Icon3D, LAB, RichCloud } from '../d3/kit'
import { Chips, FigureOnly, IsoAnalogy, PointsFigure } from './frames'
import { Posed } from '../Cast'
import type { CharacterConfig } from '../cast/skins/config'
import vpcMark from '../d3/aws/virtual-private-cloud-vpc.svg'
import publicSubnetMark from '../d3/aws/public-subnet.svg'
import privateSubnetMark from '../d3/aws/private-subnet.svg'
import ec2Mark from '../d3/aws/ec2-instance.svg'

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

/* ================================================================== 25 · three stacks */

const LAYERS = ['Virtualization, servers, storage, network', 'Operating system', 'Runtime & middleware', 'Data & access configuration', 'Application'] // bottom to top
const MODELS: { name: string; owners: Owner[]; split: number }[] = [
  { name: 'IaaS', owners: ['P', 'C', 'C', 'C', 'C'], split: 1 },
  { name: 'PaaS', owners: ['P', 'P', 'P', 'C', 'C'], split: 3 },
  { name: 'SaaS', owners: ['P', 'P', 'P', 'C', 'P'], split: 3 },
]

/**
 * Three stacks of five front-facing slabs, each in the TR table's owner
 * colour with the cell word on it, laid out as the TR's table: `Stack layer`
 * and the layer names in a left-aligned column, the three model heads centred
 * over their columns in the same style, even rows, the legend under the grid.
 * Each column's ownership line is drawn once, in the gap at its split (static:
 * 2026-10-27 the gliding line read as a glitch); the loop lights one column at
 * a time, IaaS, PaaS, SaaS.
 */
function TowersScene() {
  const t = useLoop(9000, { mode: 'sawtooth', still: 0.4 })
  const lit = Math.min(2, Math.floor(t * 3))
  const SW = 196
  const SH = 44
  const GAP = 10
  const LX = 52 // the layer column's left edge
  const LW = 330
  const C0 = 418 // the first model column's left edge
  const CG = 24
  const HEAD = 46
  const Y0 = 76
  const colX = (i: number) => C0 + i * (SW + CG)
  const rowTop = (k: number) => Y0 + (4 - k) * (SH + GAP) // k counts from the bottom
  const gridBottom = rowTop(0) + SH
  const head = 'font-heading text-[18px] font-semibold'
  return (
    <>
      <At x={LX} y={HEAD} cy w={LW}>
        <div className={head} style={{ color: colors.brandDark }}>
          Stack layer
        </div>
      </At>
      {LAYERS.map((name, k) => (
        <At key={name} x={LX} y={rowTop(k) + SH / 2} cy w={LW}>
          <div className="font-heading text-[17px] font-medium leading-tight" style={{ color: colors.ink }}>
            {name}
          </div>
        </At>
      ))}
      {MODELS.map((m, i) => (
        <div key={`g-${m.name}`} aria-hidden className="pointer-events-none absolute rounded-2xl" style={{ left: colX(i) - 10, top: HEAD - 22, width: SW + 20, height: gridBottom - HEAD + 34, background: colors.brand, opacity: lit === i ? 0.08 : 0, transition: `opacity 420ms ${EASE}` }} />
      ))}
      {MODELS.map((m, i) => (
        <At key={m.name} x={colX(i) + SW / 2} y={HEAD} cx cy>
          <div className={head} style={{ color: lit === i ? colors.brand : colors.brandDark, transition: `color 420ms ${EASE}` }}>
            {m.name}
          </div>
        </At>
      ))}
      {MODELS.map((m, i) => (
        <At key={`s-${m.name}`} x={colX(i)} y={Y0}>
          <div className="flex flex-col" style={{ gap: GAP }}>
            {[...m.owners].reverse().map((o, j) => (
              <OwnerSlab key={j} w={SW} h={SH} owner={o} size={16}>
                {o === 'P' ? 'Provider' : 'Customer'}
              </OwnerSlab>
            ))}
          </div>
        </At>
      ))}
      {MODELS.map((m, i) => (
        <div key={`l-${m.name}`} aria-hidden className="pointer-events-none absolute rounded-full" style={{ left: colX(i) - 6, top: rowTop(m.split - 1) - GAP / 2 - 1.5, width: SW + 12, height: 3, background: colors.brandDark, opacity: lit === i ? 1 : 0.35, transition: `opacity 420ms ${EASE}` }} />
      ))}
      <At x={555} y={gridBottom + 42} cx cy>
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
  return <FigureOnly id="stack" kicker="Service Model Spectrum" title="Stack Ownership Map" lead="The three service models share one technology stack; each shifts the line dividing provider-managed layers from customer-managed layers" lesson={lesson} figure={<TowersScene />} h={410} />
}

/* ================================================================== 26 · any service model on any deployment model */

const DEPLOY = ['Public', 'Private', 'Hybrid', 'Community']
const SERVICE = ['IaaS', 'PaaS', 'SaaS']

/**
 * 2026-10-27 (the user: replace the grid with an illustration): the service
 * models as one layer stack (the library's layers render, IaaS PaaS SaaS under
 * it) fanning out to the four deployment clouds; the TR's two examples light in
 * turn, a packet riding out to Private with IaaS lit, then to Public with SaaS.
 */
function GridScene() {
  const t = useLoop(9000, { mode: 'sawtooth', still: 0.25 })
  const examples = [
    { name: 'Private-cloud IaaS', d: 1, sv: 0 },
    { name: 'Public-cloud SaaS', d: 0, sv: 2 },
  ]
  const which = t < 0.5 ? 0 : 1
  const ex = examples[which]
  const u = (t % 0.5) / 0.5
  const going = u > 0.04 && u < 0.36
  const on = u >= 0.36 && u < 0.96
  const LCX = 250
  const HUB: [number, number] = [372, 150]
  const CLX = 668 // the clouds' centre
  const ROWS = [62, 136, 210, 284]
  const CW = 78
  return (
    <>
      <At x={LCX} y={34} cx>
        <Icon3D name="layers" w={176} />
      </At>
      <At x={LCX} y={262} cx>
        <div className="flex items-center gap-2.5">
          {SERVICE.map((name, j) => (
            <Label key={name} size={16} strong tone={on && ex.sv === j ? 'solid' : 'brand'}>
              {name}
            </Label>
          ))}
        </div>
      </At>
      {DEPLOY.map((name, i) => (
        <Arrow key={`a-${name}`} x1={HUB[0]} y1={HUB[1]} x2={CLX - CW / 2 - 10} y2={ROWS[i]} dashed tone={ex.d === i && (going || on) ? colors.brand : colors.line} />
      ))}
      <Traveller path={[HUB, [CLX - CW / 2 - 14, ROWS[ex.d]]]} run={going} k={`g-${which}`} size={12} tone={colors.brand} dur={2.2} />
      {DEPLOY.map((name, i) => {
        const lit = on && ex.d === i
        return (
          <At key={name} x={CLX - CW / 2} y={ROWS[i]} cy>
            <div className="flex items-center gap-4">
              <div className="relative" style={{ width: CW }}>
                <Glow on={lit} w={CW + 50} h={CW + 20} />
                <div className="relative">
                  <RichCloud w={CW} />
                </div>
              </div>
              <span className="font-heading text-[18px] font-semibold" style={{ color: lit ? colors.brand : colors.ink, width: 112, transition: `color 420ms ${EASE}` }}>
                {name}
              </span>
              {examples.map((e) =>
                e.d === i ? (
                  <Label key={e.name} size={16} strong tone={lit ? 'solid' : 'plain'}>
                    {e.name}
                  </Label>
                ) : null,
              )}
            </div>
          </At>
        )
      })}
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

/**
 * 2026-10-27 (the user: the router icon becomes a virtual network diagram): a
 * VPC drawn the AWS way (the official marks, slide-kit/assets/aws: VPC purple,
 * solid; a public subnet green and a private subnet teal), an instance in each,
 * linked.
 */
function VirtualNetwork({ on }: { on: boolean }) {
  const sub = (mark: string, tone: string) => (
    <div className="relative grid place-items-center rounded-[5px] bg-white" style={{ width: 52, height: 56, boxShadow: `inset 0 0 0 2px ${tone}` }}>
      <img src={mark} alt="" draggable={false} className="absolute left-0 top-0" style={{ width: 15, height: 15 }} />
      <img src={ec2Mark} alt="" draggable={false} style={{ width: 28, height: 28, marginTop: 8 }} />
    </div>
  )
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center rounded-[8px] bg-white" style={{ width: 138, height: 92, padding: '22px 8px 8px', gap: 18, boxShadow: `inset 0 0 0 2px #8C4FFF, 0 12px 22px -14px rgba(16,32,58,0.5)` }}>
        <img src={vpcMark} alt="" draggable={false} className="absolute left-0 top-0" style={{ width: 20, height: 20 }} />
        {sub(publicSubnetMark, '#7AA116')}
        {sub(privateSubnetMark, '#00A4A6')}
        <div aria-hidden className="pointer-events-none absolute" style={{ left: 54, right: 54, top: 63, height: 2.5, background: on ? colors.brand : '#8C4FFF', transition: `background 420ms ${EASE}` }} />
      </div>
      <GroundShadow w={138} />
    </div>
  )
}

/** The TR's diagram: a cloud labelled IaaS over a rack, a database and a virtual network; packets drip down three arrows in turn and each block lights as one lands. */
function IaasScene() {
  const t = useLoop(7200, { mode: 'sawtooth', still: 0.3 })
  const start = (i: number) => i * 0.22 + 0.04
  const dripping = (i: number) => t >= start(i) && t < start(i) + 0.26
  const landed = (i: number) => (t - (start(i) + 0.26) + 1) % 1 < 0.3
  const items: { name: string; x: number; top: number; art: (on: boolean) => ReactNode }[] = [
    { name: 'Compute', x: 147, top: 204, art: (on) => <ClayRack w={86} units={on ? ['run', 'run', 'run'] : ['run', 'idle', 'idle']} /> },
    { name: 'Storage', x: 317, top: 204, art: () => <Icon3D name="database" w={80} /> },
    { name: 'Network', x: 487, top: 196, art: (on) => <VirtualNetwork on={on} /> },
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

/** The chef who brings the customer's part (a Character Lab figure with the baker's cap and apron). */
const CHEF: CharacterConfig = {
  name: 'Chef',
  gender: 'male',
  art: 'soft',
  shading: 'clay',
  skinTone: '#E0A87E',
  hair: { style: 'short', color: '#1B1E2E' },
  face: { jaw: 'round', brows: 'medium', eyes: 'big', mouth: 'full' },
  outfit: { top: 'shirt', topColor: '#FFFFFF', bottom: 'trousers', bottomColor: '#3E3D45', shoeColor: '#2A2A30' },
  accessories: {},
  build: { height: 0.95, shoulders: 1 },
}
/* x1 widened (2026-10-28, the user: the hand clipped at the crop's right edge) */
const CHEF_CROP = { x0: -30, y0: -40, x1: 400, y1: 595 }
const CHEF_S = 0.29

/**
 * The everyday kitchen, to the TR's guidance (2026-10-27): the provider's
 * equipment (counter, oven and its gas line) under one `Infrastructure` or
 * `Platform` label; the chef on the left brings the customer's part as amber
 * recipe cards (`cards`, each flying from his hand at its phase to a row above
 * the counter), and the pizza advances as each lands, then bakes.
 */
function Kitchen({ cards, stageAt, doughReady, equipment }: { cards: { text: string; at: number }[]; stageAt: [number, 0 | 1 | 2 | 3][]; doughReady: boolean; equipment: string }) {
  const t = useLoop(AN_LAP, { mode: 'sawtooth', still: 0.75 })
  let stage: number = doughReady ? 0 : -1
  for (const [a, st] of stageAt) if (t >= a) stage = st
  const fo = fadeOut(t)
  const baked = t > 0.66 && t < 0.92
  const FLOOR = 222
  void cards
  const COUNTER_X = 236
  const OVEN_X = 368
  return (
    <>
      <At x={18} y={FLOOR}>
        <div style={{ transform: 'translateY(-100%)' }}>
          {/* a subtle reach (2026-10-28, the user: the hand moved too much): a third of the gesture's amplitude */}
          <Posed cfg={CHEF} props scale={CHEF_S} crop={CHEF_CROP} gesture="presentRight" amplitude={0.3} at={0.9} expression="happy" />
        </div>
      </At>
      {/* the recipe-card chips above the counter were removed (2026-10-28, the user); `cards` still times the pizza */}
      {/* the gas line: out of the oven's back, down to the floor and away */}
      <div aria-hidden className="absolute rounded-full" style={{ left: OVEN_X + 50, top: FLOOR - 40, width: 6, height: 40, background: 'linear-gradient(90deg, #8A94A8, #5A6378)' }} />
      <div aria-hidden className="absolute rounded-full" style={{ left: OVEN_X + 50, top: FLOOR - 6, width: 446 - OVEN_X - 50, height: 6, background: 'linear-gradient(180deg, #8A94A8, #5A6378)' }} />
      <div aria-hidden className="absolute rounded-[3px]" style={{ left: 428, top: FLOOR - 14, width: 14, height: 14, background: LAB.yellow, boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.18)' }} />
      <At x={COUNTER_X} y={FLOOR} cx>
        <div className="flex flex-col items-center" style={{ transform: 'translateY(-100%)' }}>
          <div style={{ marginBottom: -16 }}>
            {/* the dough is the provider's when it comes ready; the rest arrives with the customer */}
            <ClayPizza w={112} stage={stage} tray={doughReady ? colors.brand : LAB.lavDeep} opacity={doughReady ? 1 : fo} />
          </div>
          <ClayCounter w={140} />
        </div>
      </At>
      <At x={OVEN_X} y={FLOOR} cx>
        <div style={{ transform: 'translateY(-100%)' }}>
          <ClayOven w={108} on={baked} />
        </div>
      </At>
      <div aria-hidden className="absolute" style={{ left: COUNTER_X - 70, top: FLOOR + 10, width: 446 - COUNTER_X + 70, height: 2, background: colors.brand, opacity: 0.4 }} />
      <At x={(COUNTER_X - 70 + 446) / 2} y={FLOOR + 30} cx cy>
        <Label size={15} strong tone="lift">
          {equipment}
        </Label>
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
      text="You use Domino’s kitchen space and oven, but you are responsible for choosing and preparing the ingredients and making the pizza. Similarly, with IaaS, the provider manages the physical infrastructure, while the customer manages the operating system, runtime, applications, and data."
      everyday={{ label: 'Kitchen space only', scene: <Kitchen equipment="Infrastructure" cards={[{ text: 'OS', at: IAAS_IN[0] }, { text: 'Runtime', at: IAAS_IN[1] }, { text: 'App', at: IAAS_IN[2] }]} doughReady={false} stageAt={[[IAAS_IN[0] + 0.14, 0], [IAAS_IN[1] + 0.14, 1], [IAAS_IN[2] + 0.14, 2], [IAAS_IN[2] + 0.18, 3]]} /> }}
      cloud={{ label: 'IaaS', scene: <Stack4 owners={['P', 'C', 'C', 'C']} arrive={[null, ...IAAS_IN]} /> }}
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
      text="Domino's kitchen, oven and ready dough are already set up, so only assembling and baking the pizza on that setup remains, just as the PaaS provider manages infrastructure, operating system and runtime while the customer manages only the application & data."
      everyday={{ label: 'Kitchen and dough ready', scene: <Kitchen equipment="Platform" cards={[{ text: 'Application Code', at: PAAS_IN }]} doughReady stageAt={[[PAAS_IN + 0.14, 1], [PAAS_IN + 0.18, 2], [PAAS_IN + 0.22, 3]]} /> }}
      cloud={{ label: 'PaaS', scene: <Stack4 owners={['P', 'P', 'P', 'C']} arrive={[null, null, null, PAAS_IN]} /> }}
    />
  )
}

/* ================================================================== 31 · SaaS */

/**
 * The TR's own diagram (2026-10-27, redrawn to it): a cloud labelled SaaS at
 * the top, three dashed connectors dropping onto one soft panel of devices, a
 * desktop showing a folder, a phone with a check badge, a laptop showing
 * connected users with a download beside it. The application rides down each
 * connector in turn and the device's screen fills as it lands.
 */
function SaasScene() {
  const t = useLoop(8000, { mode: 'sawtooth', still: 0.62 })
  const start = (i: number) => 0.06 + i * 0.13
  const going = (i: number) => t >= start(i) && t < start(i) + 0.26
  const lit = (i: number) => t > start(i) + 0.26 && t < 0.94
  const pop = (i: number) => within(t, start(i) + 0.26, start(i) + 0.34) * (1 - within(t, 0.92, 0.98))
  const BASE = 344
  const MON = { x: 150, w: 170 }
  const PH = { x: 326, w: 56 }
  const LAP = { x: 482, w: 176 }
  const monH = (MON.w * 124) / 150
  const phH = (PH.w * 114) / 56
  const lapH = (LAP.w * 110) / 160
  const tops = [BASE - monH, BASE - phH, BASE - lapH]
  const xs = [MON.x, PH.x, LAP.x]
  const SRC: [number, number][] = [[282, 160], [PH.x, 166], [352, 160]] /* the phone's connector drops straight: it starts at the phone's own x (2026-10-30) */
  const ms = MON.w / 150
  const ls = LAP.w / 160
  const fill = (i: number): CSSProperties => ({ opacity: pop(i), transform: `scale(${0.85 + 0.15 * pop(i)})`, transition: `opacity 300ms ${EASE}` })
  return (
    <>
      <div aria-hidden className="absolute rounded-[22px]" style={{ left: 34, top: 226, width: 566, height: 130, background: `linear-gradient(180deg, ${LAB.lavender}, rgba(45,99,251,0.10))`, boxShadow: 'inset 0 0 0 1px rgba(45,99,251,0.12)' }} />
      <At x={317} y={24} cx>
        <Label size={18} strong tone="solid">
          SaaS
        </Label>
      </At>
      <At x={317} y={58} cx>
        <RichCloud w={156} />
      </At>
      {xs.map((x, i) => (
        <Arrow key={`a-${i}`} x1={SRC[i][0]} y1={SRC[i][1]} x2={x} y2={tops[i] - 4} dashed tone={going(i) || lit(i) ? colors.brand : colors.line} />
      ))}
      {xs.map((x, i) => (
        <Traveller key={`t-${i}`} path={[SRC[i], [x, tops[i] - 10]]} run={going(i)} k={i} size={12} tone={colors.brand} dur={2.1} />
      ))}
      {/* the desktop, a folder on its screen */}
      <At x={MON.x} y={BASE} cx>
        <div style={{ transform: 'translateY(-100%)' }}>
          <ClayMonitor w={MON.w} lit={lit(0)} />
        </div>
      </At>
      <At x={MON.x - MON.w / 2 + 12 * ms} y={tops[0] + 27 * ms}>
        <div className="grid place-items-center rounded-[5px] bg-white" style={{ width: 126 * ms, height: 59 * ms }}>
          <div style={fill(0)}>
            <Icon3D name="folder" w={66} shadow={false} />
          </div>
        </div>
      </At>
      {/* the phone, a check badge on it */}
      <At x={PH.x} y={BASE} cx>
        <div style={{ transform: 'translateY(-100%)' }}>
          <ClayPhone w={PH.w} lit={lit(1)} />
        </div>
      </At>
      <At x={PH.x + 24} y={tops[1] + phH * 0.62} cx cy>
        <div className="grid place-items-center rounded-full" style={{ width: 32, height: 32, background: colors.brand, boxShadow: `0 0 0 3px ${colors.white}, 0 8px 16px -8px ${colors.brand}`, ...fill(1) }}>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
            <path d="M3 8.5 L6.5 12 L13 4.5" fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </At>
      {/* the laptop, connected users on its screen, a download beside it */}
      <At x={LAP.x} y={BASE} cx>
        <div style={{ transform: 'translateY(-100%)' }}>
          <ClayLaptop w={LAP.w} lit={lit(2)} />
        </div>
      </At>
      <At x={LAP.x - LAP.w / 2 + 26 * ls} y={tops[2] + 12 * ls}>
        <div className="grid place-items-center rounded-[6px] bg-white" style={{ width: 108 * ls, height: 68 * ls }}>
          <div style={fill(2)}>
            <Icon3D name="teamwork" w={86} shadow={false} />
          </div>
        </div>
      </At>
      <At x={LAP.x + 64} y={tops[2] - 18} cx>
        <div style={fill(2)}>
          <Icon3D name="download" w={42} shadow={false} />
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

/** The finished pizza in its box (2026-10-27, the TR: a finished pizza box handed over): a flat box, the lid's front lip, a round seal. */
function PizzaBox({ w }: { w: number }) {
  const h = w * 0.34
  return (
    <div className="relative" style={{ width: w, height: h, borderRadius: 4, background: `linear-gradient(180deg, #5C8BFF 0%, ${colors.brand} 55%, ${colors.brandDark} 100%)`, boxShadow: '0 8px 14px -8px rgba(16,32,58,0.55), inset 0 1.5px 0 rgba(255,255,255,0.55)' }}>
      <div className="absolute inset-x-0" style={{ top: h * 0.42, height: 1.5, background: 'rgba(255,255,255,0.45)' }} />
      <div className="absolute rounded-full" style={{ left: w / 2 - h * 0.2, top: h * 0.1, width: h * 0.4, height: h * 0.25, background: '#FFFFFF', opacity: 0.85 }} />
    </div>
  )
}

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
      <At x={HAND[0] - 30} y={HAND[1] - 22}>
        <div style={{ opacity: inCab ? 0 : fo, transform: `translate(${bx}px, ${by}px)` }}>
          <PizzaBox w={60} />
        </div>
      </At>
      <At x={HAND[0] - 36} y={HAND[1] - 50} cx cy style={{ opacity: hand > 0.95 ? fo : 0, transition: `opacity 300ms ${EASE}` }}>
        <Label size={15} strong tone="brand">
          Application
        </Label>
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
      text="A ready-made pizza is ordered directly from Domino's with no kitchen work at all, just as the SaaS provider manages the entire stack while the customer only uses the finished application."
      cloud={{ label: 'SaaS', scene: <Stack4 owners={['P', 'P', 'P', 'P']} arrive={[SAAS_IN, SAAS_IN + 0.03, SAAS_IN + 0.06, SAAS_IN + 0.09]} data /> }}
    />
  )
}
