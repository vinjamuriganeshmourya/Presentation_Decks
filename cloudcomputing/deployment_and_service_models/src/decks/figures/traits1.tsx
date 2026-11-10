import { useEffect, useState, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useBeats } from '@/ui'
import { useInstant } from '@/motion/instant'
import { Card, Stage, At, Label, Arrow, Rail, Statement, Traveller, useCycle, useTicker, STILL, BOX_W } from './scene'
import { useEase } from './art'
import {
  ClayCalculator, ClayCalendar, ClayClipboard, ClayItDesk, ClayLaptop, ClayMonitor, ClayPhone, ClayRack, ClayServer, ClayTerminal, ClayTicket,
  ElectricMeter, RichCloud, TenantTile, TENANT_TONES, ClayLockIcon,
} from './clay-c'
import { mo } from './motion'
import { tile, solid } from './basics'

/**
 * SECTION 3, ESSENTIAL CHARACTERISTICS - I (Merrill): the five traits named,
 * then the first three shown working. Every string is the reference's.
 *
 * Review 2026-10-16: every picture in the Character Lab's clay look
 * (`clay-c.tsx`), no people and no faces (a tenant is a badge, a request comes
 * from a device), and the two crowded slides split: points first, picture next.
 *
 * Review 2026-10-16 (global rules): nothing on these slides needs a hand. The
 * trait ring, the self-service tabs and Launch, the device requests all run
 * by themselves on `useCycle` (one step every 2400ms) and hold still on
 * harness URLs; the buttons are gone. A connecting arrow draws from source to
 * target once the entrances have settled (`useGo`), in reading order. Every
 * ease is the house curve at the deck's one state duration (`useEase`).
 */

/**
 * True once the slide has been on screen `ms`: a connection draws on after
 * the element entrances (which end by 1.5s) have settled, so the room sees
 * the line travel from its source to its target. True at once on harness
 * URLs and in a picker thumbnail, where nothing may be mid-flight.
 */
export function useGo(ms = 1200): boolean {
  const instant = useInstant()
  const held = STILL || instant
  const [go, setGo] = useState(held)
  useEffect(() => {
    if (held) return
    const t = window.setTimeout(() => setGo(true), ms)
    return () => window.clearTimeout(t)
  }, [ms, held])
  return held || go
}

/* a slice or a hypervisor bar is one of the render's solids now (`solid` in basics.tsx): lit top, shaded foot, soft shadow */

/** A point on its own card, its small clay picture above it (a split slide's points half). */
function PointCard({ text, art, w, h }: { text: ReactNode; art: ReactNode; w: number; h: number }) {
  return (
    <Stage w={w} h={h} active={false} pad={22}>
      <div className="flex h-full flex-col gap-4">
        <div className="flex h-[100px] items-end gap-3">{art}</div>
        <p className="text-[22px] font-medium leading-snug" style={{ color: colors.ink }}>{text}</p>
      </div>
    </Stage>
  )
}

/* ================================================================== 24 · Five NIST Traits (reference 27 + 28) */

const TRAITS = [
  { name: 'On-Demand Self-Service', gloss: 'On-demand self-service: provisioning without human intervention' },
  { name: 'Broad Network Access', gloss: 'Broad network access: reachable over standard protocols' },
  { name: 'Resource Pooling', gloss: 'Resource pooling: shared infrastructure across multiple tenants' },
  { name: 'Rapid Elasticity', gloss: 'Rapid elasticity: capacity scales automatically with demand' },
  { name: 'Measured Service', gloss: 'Measured service: usage metered and billed per consumption' },
]

function TraitMini({ i }: { i: number }): ReactNode {
  const tick = useTicker(true, 1200, 2)
  const ease = useEase()
  if (i === 0)
    return (
      <div className="flex items-center gap-2">
        <ClayLaptop w={70} lit />
        <div className="flex flex-col gap-1">{[0, 1].map((k) => <div key={k} style={{ opacity: k <= tick % 2 ? 1 : 0.2, transition: ease }}><ClayServer w={44} /></div>)}</div>
      </div>
    )
  if (i === 1)
    return (
      <div className="flex items-end gap-2">
        <ClayLaptop w={56} lit={tick % 3 === 0} />
        <ClayPhone w={22} lit={tick % 3 === 1} />
        <ClayTerminal w={44} lit={tick % 3 === 2} />
      </div>
    )
  if (i === 2)
    return (
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-1">{TENANT_TONES.map((t) => <TenantTile key={t} w={24} tone={t} />)}</div>
        <ClayRack w={40} units={['run', 'run', 'run']} />
      </div>
    )
  if (i === 3)
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 4 }, (_, k) => <div key={k} style={{ opacity: k < 1 + (tick % 4) ? 1 : 0.15, transition: ease }}><ClayServer w={32} /></div>)}
      </div>
    )
  return <ElectricMeter w={64} value={((tick % 5) + 1) / 6} />
}

/**
 * A column of points beside a picture, level with it (user, 2026-10-22: bigger points, even
 * padding): the tiles share the column's slack with `justify-between`, so the first sits on the
 * stage's top edge and the last on its bottom edge, whatever the picture's height.
 */
export function PointColumn({ items, width, height, size = 18 }: { items: ReactNode[]; width: number; height: number; size?: number }) {
  return (
    <div className="flex shrink-0 flex-col justify-between" style={{ width, height }}>
      {items.map((text, i) => (
        <div key={i} className="flex items-start gap-3 rounded-2xl px-4 py-3" style={tile()}>
          <span className="mt-[7px] grid h-[14px] w-[14px] shrink-0 place-items-center rounded-full" style={{ background: colors.surface2, boxShadow: `inset 0 0 0 1.5px ${colors.brand}` }}>
            <span className="block h-[5px] w-[5px] rounded-full" style={{ background: colors.brand }} />
          </span>
          <span className="min-w-0 leading-snug" style={{ fontSize: size, color: colors.ink }}>{text}</span>
        </div>
      ))}
    </div>
  )
}

/** The lead, alone (review 2026-10-15: the ring and its points get the next frame). */
export function TraitStatement({ lesson }: { lesson: string }) {
  return (
    <Statement
      id="five-traits"
      kicker="Essential Characteristics"
      title="Five NIST Traits"
      label="Essential Characteristics"
      parts={[{ t: 'NIST formally defines cloud computing through ' }, { t: 'five essential characteristics', hi: true }, { t: ', the standard checklist that ' }, { t: 'distinguishes cloud from traditional IT', hi: true }]}
      lesson={lesson}
      art={<RichCloud w={260} />}
    />
  )
}

export function TraitRing({ lesson }: { lesson: string }) {
  const beat = useBeats(6)
  /* the ring walks its five traits by itself, one every step, round and round (global rule 3) */
  const lit = useCycle(5, 2400, 0)
  const ease = useEase()
  /* REVIEW 2026-10-22 (slide 30): the ring a size smaller on a 480px stage, the bullets up to 20px in the 614px that frees */
  const R = { cx: 260, cy: 200, rx: 182, ry: 140 }
  const pos = TRAITS.map((_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5
    return { x: R.cx + R.rx * Math.cos(a), y: R.cy + R.ry * Math.sin(a) }
  })
  const items = TRAITS.map((t, i) => ({ text: t.gloss, at: i + 2 }))
  return (
    <Card id="five-traits-ring" kicker="Essential Characteristics" title="Five NIST Traits" lesson={lesson} beat={beat} total={6}>
      <div className="flex gap-4">
        <Stage w={520} h={396} active={beat === 1}>
          <svg className="absolute inset-0" width={520} height={396} aria-hidden>
            <ellipse cx={R.cx} cy={R.cy} rx={R.rx - 40} ry={R.ry - 30} fill="none" stroke={colors.line} strokeWidth={2} strokeDasharray="6 8" className={mo('dash', 0, { dur: 2.4 }).className} style={mo('dash', 0, { dur: 2.4 }).style} />
          </svg>
          <At x={R.cx} y={R.cy} cx cy>
            <div className="relative h-[116px] w-[170px] rounded-full" style={tile(`2px ${colors.brand}`)}>
              {/* the five small pictures stacked, the lit trait's shown, so a change is a cross-fade and never a cut */}
              {TRAITS.map((_, i) => (
                <div key={i} className="absolute inset-0 grid place-items-center" style={{ opacity: lit === i ? 1 : 0, transition: ease }} aria-hidden={lit !== i}>
                  <TraitMini i={i} />
                </div>
              ))}
            </div>
          </At>
          {TRAITS.map((t, i) => {
            const on = lit === i
            return (
              <At key={t.name} x={pos[i].x} y={pos[i].y} cx cy>
                <div
                  className="grid h-[48px] w-[138px] place-items-center rounded-xl px-2 text-center font-heading text-[14px] font-semibold leading-tight"
                  style={{ ...(on ? solid(colors.brand) : tile(`1.5px ${colors.brand}`, { background: 'linear-gradient(180deg, #F3F7FF 0%, #E8F0FF 100%)' })), color: on ? colors.white : colors.brandDark, transition: ease }}
                >
                  {t.name}
                </div>
              </At>
            )
          })}
        </Stage>
        <Rail items={items} beat={beat} width={574} size={18} gap={12} />
      </div>
    </Card>
  )
}

/* ================================================================== 25 · No Human Intervention (split 2026-10-16: points, then the picture) */

export function SelfService({ lesson }: { lesson: string }) {
  const beat = useBeats(3)
  const points: { text: string; art: ReactNode }[] = [
    {
      text: 'Choose the resources you need using a cloud console, command, or API',
      art: (
        <>
          <ClayMonitor w={104} />
          <ClayTerminal w={96} />
          <ClayPhone w={42} />
        </>
      ),
    },
    {
      text: 'No need to wait for IT staff or lengthy hardware-procurement processes',
      art: (
        <>
          <ClayTicket w={124} struck />
          <ClayCalendar w={92} />
        </>
      ),
    },
    {
      text: 'For example, AWS lets you launch a virtual server (EC2) with a few clicks',
      art: (
        <>
          <img src="/assets/tech/aws.png" alt="" className="mb-2 h-[30px] w-auto" draggable={false} />
          <div className="flex flex-col gap-1">
            <ClayServer w={120} />
            <ClayServer w={120} />
          </div>
        </>
      ),
    },
  ]
  return (
    <Card id="self-service" kicker="On-Demand Self-Service" title="No Human Intervention" lead="On-demand self-service lets a customer provision computing resources automatically, without requiring a phone call or ticket to the provider's staff" lesson={lesson} beat={beat} total={3}>
      <div className="flex gap-[18px]">
        {points.map((p) => (
          <PointCard key={p.text} text={p.text} art={p.art} w={358} h={250} />
        ))}
      </div>
    </Card>
  )
}

const DESKS = [
  { label: 'Manager', art: <ClayClipboard w={64} /> },
  { label: 'Finance', art: <ClayCalculator w={84} /> },
  { label: 'IT desk', art: <ClayItDesk w={90} /> },
]

/** The picture: the old path's three desks and a weeks-long ticket, then the cloud path's one call. */
const TABS = ['Console', 'CLI', 'API'] as const

export function SelfServicePicture({ lesson }: { lesson: string }) {
  const beat = useBeats(2)
  /* each path in turn: the request shown, then sent and provisioned; a still frame shows the console's call landed */
  const k = useCycle(6, 2400, 1)
  const tab = TABS[Math.floor(k / 2)]
  const launched = k % 2 === 1
  const go = useGo()
  const ease = useEase()
  return (
    <Card id="self-service-2" kicker="On-Demand Self-Service" title="No Human Intervention" lesson={lesson} beat={beat} total={2}>
      <div className="flex flex-col gap-3">
        <Stage w={BOX_W} h={168} active={false}>
          {DESKS.map((d, k) => (
            <At key={d.label} x={110 + k * 190} y={18} cx>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-[92px] items-end">{d.art}</div>
                <Label size={16} strong>{d.label}</Label>
              </div>
            </At>
          ))}
          {[0, 1].map((k) => (
            <Arrow key={k} x1={170 + k * 190} y1={64} x2={240 + k * 190} y2={64} on={go} delay={k * 700} />
          ))}
          <Arrow x1={550} y1={64} x2={640} y2={64} dashed tone={colors.danger} on={go} delay={1400} />
          <At x={660} y={30}><ClayTicket w={104} struck /></At>
          <At x={800} y={14}><ClayCalendar w={84} /></At>
          <At x={900} y={44}><Label tone="bad" size={16} strong>Week 6</Label></At>
          <At x={660} y={124}><Label tone="bad" size={16}>Weeks-long procurement ticket</Label></At>
        </Stage>
        <Stage w={BOX_W} h={236} active={false}>
          <At x={30} y={20} w={420}>
            <div className="flex gap-1.5">
              {TABS.map((t) => (
                <Label key={t} tone={tab === t ? 'solid' : 'brand'} size={14} strong>{t}</Label>
              ))}
            </div>
          </At>
          <At x={30} y={66} w={300}>
            <div className="flex h-[148px] items-center justify-center">
              {tab === 'Console' ? <ClayMonitor w={170} lit={launched} /> : tab === 'CLI' ? <ClayTerminal w={170} lit={launched} /> : <ClayLaptop w={180} lit={launched} />}
            </div>
          </At>
          <At x={320} y={66} w={300}>
            <div className="flex h-[148px] flex-col justify-center gap-3 rounded-xl px-5" style={{ ...(tab === 'Console' ? tile(`1.5px ${colors.line}`) : { background: `linear-gradient(180deg, ${colors.night3} 0%, ${colors.night} 100%)`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 12px 24px -16px rgba(31,64,140,0.45)' }), transition: ease }}>
              {tab === 'Console' ? (
                <>
                  <div className="flex items-center gap-2">
                    <img src="/assets/tech/aws.png" alt="" className="h-[18px] w-auto" draggable={false} />
                    <span className="text-[16px] font-semibold" style={{ color: colors.ink }}>EC2</span>
                  </div>
                  <div style={{ transform: launched ? 'scale(0.95)' : 'none', transformOrigin: 'left center', transition: ease }}><Label tone="solid" size={14} strong>Launch Instance</Label></div>
                </>
              ) : (
                <>
                  <span className="font-mono text-[16px]" style={{ color: colors.white }}>{tab === 'CLI' ? 'run-instances' : 'RunInstances'}</span>
                  <div style={{ transform: launched ? 'scale(0.95)' : 'none', transformOrigin: 'left center', transition: ease }}><Label tone="solid" size={14} strong>{tab === 'CLI' ? 'Run' : 'Send'}</Label></div>
                </>
              )}
            </div>
          </At>
          {/* drawn once and kept: toggling it off every step left its head hanging alone for the 700ms its fade waits (seen live, 2026-10-22) */}
          <Arrow x1={636} y1={140} x2={706} y2={140} on={go} />
          <At x={720} y={26} w={140}>
            <div className="flex flex-col items-center gap-2">
              {[0, 1, 2].map((k) => (
                <div key={k} style={{ opacity: launched ? 1 : 0.15, transition: ease, transitionDelay: `${k * 160}ms` }}>
                  <ClayServer w={130} />
                </div>
              ))}
            </div>
          </At>
          <At x={880} y={92} w={200}>
            <div className="flex flex-col items-start gap-2" style={{ opacity: launched ? 1 : 0, transition: ease }}>
              <Label tone="good" size={16} strong>Resources provisioned</Label>
              <span className="text-[16px] font-medium leading-snug" style={{ color: colors.ink }}>Without human intervention</span>
            </div>
          </At>
        </Stage>
      </div>
    </Card>
  )
}

/* ================================================================== 27 · Ubiquitous Standard Access */

const DEVICES = [
  { label: 'Laptop', x: 96, y: 92 },
  { label: 'Mobile app', x: 604, y: 92 },
  { label: 'Browser console', x: 96, y: 262 },
  { label: 'CLI', x: 604, y: 262 },
]
/** Slide 34's four points, the TR PDF's (re-synced 2026-10-22: the slide had none). */
const ACCESS_POINTS = [
  'Uses standard protocols: HTTPS APIs, SDKs, browser console',
  'Same service reachable from laptop, mobile app, CLI',
  'No proprietary client software required, unlike legacy systems',
  'AWS: identical API reachable through Console, CLI, SDK, mobile app',
]
const SW34 = 700
const DX = 86
const HX = 96

function DeviceArt({ i, lit }: { i: number; lit: boolean }) {
  if (i === 0) return <ClayLaptop w={120} lit={lit} />
  if (i === 1) return <ClayPhone w={42} lit={lit} />
  if (i === 2) return <ClayMonitor w={104} lit={lit} />
  return <ClayTerminal w={112} lit={lit} />
}

export function DeviceRing({ lesson }: { lesson: string }) {
  const beat = useBeats(3)
  /* the four devices send in turn, one every step, each request a dot to the API and back (global rules 3 and 4) */
  const tick = useTicker(true, 2400, 0)
  const active = tick % 4
  const go = useGo()
  const ease = useEase()
  const hub = { x: SW34 / 2, y: 170 }
  return (
    <Card id="network-access" kicker="Broad Network Access" title="Ubiquitous Standard Access" lead="Broad network access means cloud resources are reachable over standard network protocols from heterogeneous client devices, laptops, phones or thin clients alike" lesson={lesson} beat={beat} total={3}>
      <div className="flex gap-4">
      <Stage w={SW34} h={360} active={false}>
        {DEVICES.map((d, i) => {
          const left = d.x < hub.x
          const top = d.y < hub.y
          return <Arrow key={d.label} x1={left ? d.x + DX : d.x - DX} y1={d.y - 10} x2={left ? hub.x - HX : hub.x + HX} y2={hub.y + (top ? -28 : 28)} tone={active === i ? colors.accent : colors.brand} both on={go} delay={i * 300} />
        })}
        {DEVICES.map((d, i) => {
          const left = d.x < hub.x
          const top = d.y < hub.y
          return (
            <At key={`t${d.label}`} x={((left ? d.x + DX : d.x - DX) + (left ? hub.x - HX : hub.x + HX)) / 2 + (left ? 12 : -12)} y={top ? 50 : 252} cx>
              <Label size={14} tone={active === i ? 'warn' : 'brand'} mono>HTTPS/API</Label>
            </At>
          )
        })}
        <At x={hub.x} y={hub.y} cx cy>
          <div className="relative grid place-items-center" style={{ width: 190, height: 130 }}>
            <div className="absolute inset-0"><RichCloud w={190} /></div>
            <div className="relative mt-4 flex flex-col items-center gap-1.5">
              <div className="rounded-lg px-2 py-1" style={tile()}><img src="/assets/tech/aws.png" alt="" className="h-[22px] w-auto" draggable={false} /></div>
              <span className="font-heading text-[18px] font-semibold text-white">AWS API</span>
            </div>
          </div>
        </At>
        {DEVICES.map((d, i) => (
          <At key={`d${d.label}`} x={d.x} y={d.y} cx cy>
            <div
              className="flex w-[160px] flex-col items-center gap-2 rounded-2xl px-3 py-2"
              style={{ background: active === i ? colors.surface2 : 'transparent', boxShadow: active === i ? `inset 0 0 0 2px ${colors.accent}` : 'inset 0 0 0 2px transparent', transition: ease }}
            >
              <div className="flex h-[92px] items-end"><DeviceArt i={i} lit={active === i} /></div>
              <Label size={15} strong tone={active === i ? 'brand' : 'plain'}>{d.label}</Label>
            </div>
          </At>
        ))}
        <Traveller k={tick} run path={[[DEVICES[active].x, DEVICES[active].y - 10], [hub.x, hub.y], [DEVICES[active].x, DEVICES[active].y - 10]]} dur={1.4} />
      </Stage>
      <PointColumn items={ACCESS_POINTS} width={BOX_W - SW34 - 16} height={360} size={18} />
      </div>
    </Card>
  )
}

/* ================================================================== 28 · Shared Infrastructure Model (split 2026-10-16: points, then the picture) */

export function TenantRack({ lesson }: { lesson: string }) {
  const beat = useBeats(4)
  const points: { text: string; art: ReactNode }[] = [
    {
      text: 'Multi-tenancy: multiple customers share same physical hardware',
      art: (
        <>
          {TENANT_TONES.map((t) => <TenantTile key={t} w={38} tone={t} />)}
          <ClayServer w={64} />
        </>
      ),
    },
    {
      text: 'Hypervisor: virtualization software splitting one server into isolated tenants',
      art: (
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-1.5">
            {TENANT_TONES.map((t) => <span key={t} className="block h-[16px] w-[40px] rounded-md" style={solid(t)} />)}
          </div>
          <span className="block h-[12px] w-[132px] rounded-md" style={solid(colors.brandDark)} />
          <ClayServer w={132} />
        </div>
      ),
    },
    {
      text: 'Location independence: customer unaware of physical resource',
      art: <RichCloud w={136} />,
    },
    {
      text: 'AWS: EC2 hosts run multiple tenants via shared hypervisor',
      art: (
        <>
          <img src="/assets/tech/aws.png" alt="" className="mb-2 h-[30px] w-auto" draggable={false} />
          <ClayRack w={64} units={['run', 'run', 'run']} />
        </>
      ),
    },
  ]
  return (
    <Card id="pooling" kicker="Pooling And Multi-Tenancy" title="Shared Infrastructure Model" lead="Resource pooling means provider infrastructure is shared across customers, with capacity assigned dynamically rather than dedicated per customer" lesson={lesson} beat={beat} total={4}>
      <div className="grid grid-cols-4 gap-[14px]">
        {points.map((p) => (
          <PointCard key={p.text} text={p.text} art={p.art} w={267} h={300} />
        ))}
      </div>
    </Card>
  )
}

/** The picture: three tenants take slices of one host through the hypervisor; capacity moves between them. */
export function TenantRackTwo({ lesson }: { lesson: string }) {
  const beat = useBeats(2)
  const tick = useTicker(true, 2400, 0)
  const ease = useEase()
  /* capacity assigned dynamically: each tenant's slice count changes every step */
  const shares = [
    [2, 3, 1],
    [3, 1, 2],
    [1, 2, 3],
    [2, 2, 2],
  ][tick % 4]
  const slots: number[] = []
  shares.forEach((s, t) => {
    for (let k = 0; k < s; k++) slots.push(t)
  })
  return (
    <Card id="pooling-2" kicker="Pooling And Multi-Tenancy" title="Shared Infrastructure Model" lesson={lesson} beat={beat} total={2}>
      <Stage w={BOX_W} h={410} active={false}>
        <At x={30} y={22} w={1050}>
          <div className="grid grid-cols-3 gap-4">
            {['Tenant A', 'Tenant B', 'Tenant C'].map((t, i) => (
              <div key={t} className="flex items-center gap-3 rounded-xl px-3 py-2" style={tile(`2px ${TENANT_TONES[i]}`)}>
                <TenantTile w={46} tone={TENANT_TONES[i]} />
                <div className="flex flex-col">
                  <span className="font-heading text-[17px] font-semibold" style={{ color: colors.ink }}>{t}</span>
                  <span className="text-[16px]" style={{ color: colors.ink }}>{`${shares[i]} slice${shares[i] === 1 ? '' : 's'} now`}</span>
                </div>
              </div>
            ))}
          </div>
        </At>
        <At x={30} y={112} w={1050}>
          <div className="grid grid-cols-6 gap-2.5">
            {slots.map((t, k) => (
              <div key={k} className="relative grid h-[66px] place-items-center rounded-xl" style={{ ...solid(TENANT_TONES[t]), transition: ease }}>
                <span className="text-[17px] font-semibold text-white">{['A', 'B', 'C'][t]}</span>
                <span className="absolute right-2 top-2"><ClayLockIcon w={18} /></span>
              </div>
            ))}
          </div>
        </At>
        <At x={30} y={192} w={1050}>
          <div className="grid h-[44px] place-items-center rounded-xl font-heading text-[17px] font-semibold text-white" style={solid(colors.brandDark)}>Hypervisor</div>
        </At>
        <At x={30} y={248} w={1050}>
          <div className="flex h-[96px] items-center gap-8 rounded-xl px-6" style={tile()}>
            <div className="flex gap-3">
              {[0, 1, 2].map((k) => <ClayServer key={k} w={130} />)}
            </div>
            <span className="text-[17px] font-semibold" style={{ color: colors.ink }}>Shared physical hardware</span>
          </div>
        </At>
        <At x={30} y={360} w={1050}>
          <div className="flex items-center gap-2">
            <img src="/assets/tech/aws.png" alt="" className="h-[20px] w-auto" draggable={false} />
            <Label tone="brand" size={15}>EC2 host: many tenants</Label>
          </div>
        </At>
      </Stage>
    </Card>
  )
}
