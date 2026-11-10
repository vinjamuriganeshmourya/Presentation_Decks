import { useEffect, useState, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useBeats } from '@/ui'
import { useInstant } from '@/motion/instant'
import { Card, Stage, At, Label, Note, Arrow, Statement, Traveller, B, useLoop, useCycle, useTicker, STILL, BOX_W, isNow } from './scene'
import { VmStack } from './analogy'
import { CloudShape, Storefront, useEase } from './art'
import { ClayBar, ClayClock, ClayCloud, ClayCloudScene, ClayDataCentre, ClayDesktop, ClayInstitution, ClayJobTray, ClayMainframe, ClayMeter, ClayOsWindow, ClayPadlock, ClayServerBox, ClayTerminal, LAB } from './clay-b'
import { mo } from './motion'
import { tile, WELL } from './basics'

/**
 * SECTION 2, HISTORY & EVOLUTION (STAR): four eras, each solving the
 * resource-sharing problem of its own time, then the table of what cloud
 * inherited. Every string is the reference's.
 *
 * Review 2026-10-16 (global rules): nothing needs a hand (the era timeline
 * runs on `useLoop`, turns on `useCycle`); motion only where it explains the
 * content (a connector draws from source to target, a request is a dot on
 * its path, a timeline reveals in order); every ease on the house curve with
 * the deck's fixed durations.
 */

/** A connector's `on`, false at mount and true after `delay`, so it draws itself source to target; already on under harness URLs and in a thumbnail. */
function useDrawn(delay = 1100): boolean {
  const instant = useInstant()
  const [on, setOn] = useState(STILL || instant)
  useEffect(() => {
    if (STILL || instant) {
      setOn(true)
      return
    }
    const t = window.setTimeout(() => setOn(true), delay)
    return () => window.clearTimeout(t)
  }, [instant, delay])
  return on
}

/* ================================================================== 14 · Four eras */

const ERAS = [
  { period: '1960s-70s', label: 'Mainframes & time-sharing' },
  { period: '1980s-2000s', label: 'Client-server & x86 virtualization' },
  { period: '1990s-2000s', label: 'Grid & utility computing' },
  { period: '2006 onward', label: 'The public cloud era' },
]

/** The timeline strip: the line runs from LINE_X0 to LINE_X1; era i's dot sits at ERA_DOT(i). */
const LINE_X0 = 40
const LINE_X1 = BOX_W - 40
const ERA_DOT = (i: number) => 132 + i * 281
/** The lap holds the finished timeline for its last 14%, so the room sees all four eras before it runs again. */
const LAP_RUN = 0.86

/**
 * Each era's picture, in clay (review 2026-10-16: no operator, the data centre
 * lost its stray door box), animated the way its era worked once the timeline
 * reaches it: terminals light on the mainframe, a request runs from the
 * client to the server, the grid's links join, the data centre comes on.
 */
function EraPicture({ i, on }: { i: number; on: boolean }): ReactNode {
  const ease = useEase(420)
  const draw = useEase(680)
  if (i === 0)
    return (
      <div className="flex items-end gap-1.5">
        <ClayTerminal w={46} lit={on} />
        <ClayMainframe w={132} busy={on} />
        <ClayTerminal w={46} lit={on} />
      </div>
    )
  if (i === 1)
    return (
      <div className="relative flex items-end gap-3">
        <ClayDesktop w={100} />
        <ClayServerBox w={52} n={3} />
        <Traveller path={[[50, 36], [138, 40]]} run={on} k="req" size={12} />
      </div>
    )
  if (i === 2)
    return (
      <div className="relative" style={{ width: 210, height: 112 }}>
        <svg data-flat className="absolute inset-0" width={210} height={112} aria-hidden>
          <path d="M 44 76 L 105 30 L 166 76" fill="none" stroke={colors.line} strokeWidth={3} strokeDasharray="5 5" strokeLinecap="round" />
          <path d="M 44 76 L 105 30 L 166 76" fill="none" stroke={colors.brand} strokeWidth={3} strokeLinecap="round" pathLength={1} strokeDasharray="1" style={{ strokeDashoffset: on ? 0 : 1, transition: draw }} />
          {/* motion layer: the joined links carry a flow dash */}
          <path d="M 44 76 L 105 30 L 166 76" fill="none" stroke={colors.white} strokeWidth={1.5} strokeLinecap="round" strokeDasharray="5 9" className={mo('dash', 3).className} style={{ opacity: on ? 0.75 : 0, transition: ease, ...mo('dash', 3).style }} />
        </svg>
        {[0, 1, 2].map((k) => (
          <div key={k} className="absolute" style={{ left: k * 74, top: k === 1 ? 0 : 52 }}>
            <ClayDesktop w={62} lit={on} />
          </div>
        ))}
      </div>
    )
  return (
    <div style={{ opacity: on ? 1 : 0.6, transition: ease }}>
      <ClayDataCentre w={160} />
    </div>
  )
}

export function EraWalk({ lesson }: { lesson: string }) {
  const beat = useBeats(4)
  const ease = useEase(420)
  /* the timeline runs by itself (global rule 3): one lap every 4.8s (user 2026-10-22, twice: it was 8s, then 6s), the line reaching each era in order, held complete on a harness frame */
  const t = useLoop(4800, { mode: 'sawtooth', still: 1 })
  const p = Math.min(1, t / LAP_RUN)
  const head = LINE_X0 + p * (LINE_X1 - LINE_X0)
  const reached = (i: number) => head >= ERA_DOT(i) - 1
  return (
    <Card id="four-eras" kicker="Four Eras Of Computing" title="From Mainframes To Cloud" lead="Cloud computing did not appear overnight; it inherited ideas from four earlier eras, each solving the resource-sharing problem of its own time" lesson={lesson} beat={beat} total={4}>
      <div className="flex gap-[16px]">
        {ERAS.map((e, i) => {
          const now = isNow(beat, i + 1)
          const seen = reached(i)
          return (
            <Stage key={e.period} w={265} h={236} active={now}>
              {/* opacity only (user 2026-10-22, 60fps rule): the grayscale filter no longer transitions */}
              <div className="absolute inset-x-0 top-[10px] grid h-[150px] place-items-center" style={{ opacity: seen ? 1 : 0.28, transition: ease }}>
                <EraPicture i={i} on={seen} />
              </div>
              <div className="absolute inset-x-0 bottom-[14px] flex flex-col items-center gap-1.5">
                <Label tone={seen ? 'brand' : 'muted'} strong size={15}>{e.period}</Label>
                <span className="text-[16px] font-medium" style={{ color: colors.ink, opacity: seen ? 1 : 0.45, transition: ease }}>{e.label}</span>
              </div>
            </Stage>
          )
        })}
      </div>
      <div className="relative mt-3" style={{ width: BOX_W, height: 40 }}>
        <div className="absolute top-[18px] h-[4px] rounded-full" style={{ left: LINE_X0, width: LINE_X1 - LINE_X0, background: colors.line }} />
        {/* the fill is a scaleX transform of the full line, not an animated width (user 2026-10-22: transform and opacity only) */}
        <div className="absolute top-[18px] h-[4px] rounded-full" style={{ left: LINE_X0, width: LINE_X1 - LINE_X0, background: colors.brand, transformOrigin: 'left center', transform: `scaleX(${(head - LINE_X0) / (LINE_X1 - LINE_X0)})`, transition: ease }} />
        {ERAS.map((e, i) => (
          <span key={e.period} className={`absolute top-[11px] h-[18px] w-[18px] rounded-full ${reached(i) ? mo('pulse', i).className : ''}`} style={{ left: ERA_DOT(i) - 9, background: reached(i) ? colors.brand : colors.white, boxShadow: `inset 0 0 0 3px ${colors.brand}`, transition: ease, ...mo('pulse', i).style }} />
        ))}
      </div>
    </Card>
  )
}

/* ================================================================== 15 · One Machine Many Users (reference 14 + 15; split by the review 2026-10-16: the points, then the picture) */

/** A point with its own small picture beside it (review 2026-10-16: the points shown visually, the full scene stays on the next slide). */
function PointRow({ text, art, h = 62, artW = 150 }: { text: ReactNode; art: ReactNode; h?: number; artW?: number }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl pr-5" style={{ height: h, ...tile() }}>
      <div className="grid h-full shrink-0 place-items-center rounded-2xl" style={{ width: artW, ...WELL }}>
        {art}
      </div>
      <span className="min-w-0 text-[18px] font-medium leading-snug" style={{ color: colors.ink }}>
        {text}
      </span>
    </div>
  )
}

export function MainframeScene({ lesson }: { lesson: string }) {
  const beat = useBeats(5)
  /* the scheduler's turn passes terminal to terminal by itself: one step every 2.4s; the raw count drives the clock so its hand only ever goes forward */
  const count = useTicker(true, 2400, 0)
  const turn = count % 4
  const ease = useEase()
  const rows: { text: string; art: ReactNode }[] = [
    { text: 'Mainframes: centralised, costly machines run by dedicated operators', art: <ClayMainframe w={74} busy /> },
    { text: 'Batch processing: jobs queued and run without interaction', art: <ClayJobTray w={92} /> },
    {
      text: 'Time-sharing (1960s): CPU scheduled across simultaneous terminal users',
      art: (
        <div className="flex items-center gap-2">
          <ClayClock w={38} turn={count / 4} />
          <div className="flex items-end gap-1">
            {[0, 1, 2, 3].map((k) => (
              <div key={k} style={{ opacity: k === turn ? 1 : 0.55, transition: ease }}>
                <ClayTerminal w={22} lit={k === turn} />
              </div>
            ))}
          </div>
        </div>
      ),
    },
    /* two further rows, "Each user experienced an illusion of a private computer" (a lit terminal, "Mine") and "IBM's CP-40/CP-67 (1960s) pioneered mainframe virtualization: the earliest form of the concept" (three VM bars), were removed on the user's word (2026-10-23); the picture slide after this one is unchanged */
  ]
  return (
    <Card id="mainframes" kicker="Mainframes & Time-Sharing" title="One Machine Many Users" lead="Early mainframes were too costly for one user alone, so time-sharing let many users access the same machine at once" lesson={lesson} beat={beat} total={5}>
      <div className="flex flex-col gap-[10px]" style={{ width: BOX_W }}>
        {rows.map((r) => (
          <PointRow key={r.text} text={r.text} art={r.art} />
        ))}
      </div>
    </Card>
  )
}

/** The picture half: one mainframe, its batch tray, four terminals taking scheduled turns. No operator (review 2026-10-16). */
export function MainframePicture({ lesson }: { lesson: string }) {
  /* the turn passes by itself, one step every 1.8s (user 2026-10-22: a little quicker; it was 2.4s); the user's job is the dot that runs up to the machine. The raw count drives the clock so its hand only ever goes forward */
  const count = useTicker(true, 1800, 0)
  const turn = count % 4
  const ease = useEase()
  const TX = [210, 440, 670, 900]
  const top = (i: number) => 555 + (i - 1.5) * 44
  return (
    <Card id="mainframes-2" kicker="Mainframes & Time-Sharing" title="One Machine Many Users" lesson={lesson}>
      <Stage w={BOX_W} h={392} active={false}>
        {/* the batch tray and the scheduler's clock, left of the machine */}
        <At x={70} y={30} w={330}>
          <div className="flex items-center gap-3">
            <ClayJobTray w={140} />
            <Label tone="warn" size={16}>Jobs queued</Label>
          </div>
        </At>
        <At x={70} y={130} w={330}>
          <div className="flex items-center gap-3">
            <ClayClock w={60} turn={count / 4} />
            <Label tone="brand" size={16}>Scheduled turns</Label>
          </div>
        </At>
        <At x={555} y={14} cx>
          <ClayMainframe w={250} />
        </At>
        {/* what the machine is, and its first virtual machines */}
        <At x={706} y={26} w={390}>
          <div className="flex flex-col items-start gap-2.5">
            <Label strong tone="dark" size={16}>Mainframe</Label>
            <Note size={16} className="whitespace-nowrap">CPU scheduled across simultaneous terminal users</Note>
            <div className="flex items-center gap-2">
              {[0, 1, 2].map((k) => (
                <ClayBar key={k} w={50} h={34} fill={LAB.cobalt}>
                  <span className="font-heading text-[14px] font-semibold text-white">VM</span>
                </ClayBar>
              ))}
              <Label tone="brand" size={16}>CP-40/CP-67</Label>
            </div>
          </div>
        </At>
        {TX.map((x, i) => (
          <Arrow key={i} x1={x} y1={246} x2={top(i)} y2={204} tone={i === turn ? colors.brand : colors.line} />
        ))}
        <Traveller path={[[TX[turn], 246], [top(turn), 206]]} run k={turn} size={12} dur={0.9} />
        {TX.map((x, i) => {
          const lit = i === turn
          return (
            <At key={i} x={x} y={252} cx>
              <div className="flex flex-col items-center gap-2">
                <div style={{ opacity: lit ? 1 : 0.7, transition: ease }}>
                  <ClayTerminal w={96} lit={lit} />
                </div>
                <div className="flex items-center gap-1.5">
                  <Label size={15} tone={lit ? 'brand' : 'plain'}>Terminal</Label>
                  <Label size={15} tone="good">My computer</Label>
                </div>
              </div>
            </At>
          )
        })}
      </Stage>
    </Card>
  )
}

/* ================================================================== 18 · Hardware Gets Abstracted (copy replaced by the review, 2026-10-15, word for word; split by the review 2026-10-16) */

/** Clients to a server, the request a dot on its path: a scene small enough for a point row. */
function ClientServerMini({ k }: { k: number }) {
  const on = useDrawn()
  return (
    <div className="relative" style={{ width: 196, height: 84 }}>
      <div className="absolute" style={{ left: 0, top: 8 }}><ClayDesktop w={78} /></div>
      <div className="absolute" style={{ left: 142, top: 6 }}><ClayServerBox w={44} n={2} /></div>
      <Arrow x1={82} y1={44} x2={138} y2={44} on={on} />
      <Traveller path={[[84, 44], [136, 44]]} run k={k} size={11} dur={1.2} />
    </div>
  )
}

/** One server, its hypervisor, three VMs with their own OS: the stack, small. */
function HypervisorMini() {
  return (
    /* 2026-10-22: 82px tall, so the One server bar is no longer cut by the 88px well */
    <div className="flex flex-col items-center" style={{ gap: 3 }}>
      <div className="flex" style={{ gap: 6 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="grid place-items-center rounded-lg" style={{ width: 54, height: 36, ...tile() }}>
            <ClayOsWindow w={38} k={i} />
          </div>
        ))}
      </div>
      <ClayBar w={174} h={20} fill={LAB.cobalt}>
        <span className="font-heading text-[14px] font-semibold text-white">Hypervisor</span>
      </ClayBar>
      <ClayBar w={174} h={20} fill={LAB.lavender}>
        <span className="text-[14px] font-medium" style={{ color: colors.ink }}>One server</span>
      </ClayBar>
    </div>
  )
}

/** The benefit: a meter high on use, and one VM that can sit on either of two machines. */
function BenefitMini() {
  const k = useCycle(2)
  const ease = useEase()
  return (
    <div className="flex items-center gap-4">
      <ClayMeter w={50} value={0.9} />
      <div className="relative" style={{ width: 118, height: 84 }}>
        <div className="absolute" style={{ left: 0, top: 34 }}><ClayServerBox w={44} n={1} /></div>
        <div className="absolute" style={{ left: 74, top: 34 }}><ClayServerBox w={44} n={1} /></div>
        <div className="absolute" style={{ left: 4, top: 0, transform: `translateX(${74 * k}px)`, transition: ease }}><ClayOsWindow w={36} k={0} /></div>
      </div>
    </div>
  )
}

export function HypervisorScene({ lesson }: { lesson: string }) {
  const beat = useBeats(3)
  const k = useCycle(2)
  const rows: { text: ReactNode; art: ReactNode; key: string }[] = [
    /* the TR PDF's four bullets (re-synced 2026-10-22); the third, "Each virtual machine runs its own OS, isolated from others", was removed on the user's word (2026-10-23) */
    { key: 'a', text: <><B>1980s-90s:</B> client-server split desktop and network-server roles</>, art: <ClientServerMini k={k} /> },
    { key: 'b', text: <><B>Commodity x86 virtualization</B> (late 1990s onward, for example VMware): a hypervisor, the software layer that creates and manages VMs, partitions one server</>, art: <HypervisorMini /> },
    { key: 'd', text: <>Decouples software from physical hardware, enabling resource pooling</>, art: <BenefitMini /> },
  ]
  return (
    <Card id="virtualization" kicker="Client-Server & Virtualization" title="Hardware Gets Abstracted" lead="Clients request services from servers. Virtualization allows one physical server to run multiple isolated virtual machines (VMs), each with its own OS." lesson={lesson} beat={beat} total={3}>
      <div className="flex flex-col gap-[12px]" style={{ width: BOX_W }}>
        {rows.map((r) => (
          <PointRow key={r.key} text={r.text} art={r.art} h={88} artW={232} />
        ))}
      </div>
    </Card>
  )
}

/** The picture half: client desktops ask one server, inside which a hypervisor runs isolated VMs, each with its own OS. No faces (review 2026-10-16). */
export function HypervisorPicture({ lesson }: { lesson: string }) {
  const on = useDrawn()
  /* a request runs to the server, a response runs back: one step every 2.4s */
  const k = useCycle(2)
  const path: [number, number][] = k === 0 ? [[264, 172], [460, 172]] : [[460, 172], [264, 172]]
  return (
    <Card id="virtualization-2" kicker="Client-Server & Virtualization" title="Hardware Gets Abstracted" lesson={lesson}>
      <Stage w={BOX_W} h={372} active={false}>
        {/* clients on the left */}
        <At x={180} y={22} cx>
          <div className="flex flex-col items-center gap-3">
            <ClayDesktop w={100} />
            <ClayDesktop w={100} />
            <Label size={16}>Client: the desktop</Label>
          </div>
        </At>
        <At x={24} y={262} w={320}>
          <div className="flex flex-col gap-1">
            <Note size={15}><b className="font-semibold">Clients:</b> computers people use to access applications and services</Note>
            <Note size={15}><b className="font-semibold">Servers:</b> computers that provide data, applications, or services</Note>
          </div>
        </At>
        <At x={362} y={132} cx><Label size={15} tone="muted">{k === 0 ? 'Requests' : 'Services'}</Label></At>
        <Arrow x1={262} y1={172} x2={462} y2={172} both on={on} />
        <Traveller path={path} run k={k} size={12} dur={1.2} />
        {/* the one server: the hypervisor and its VMs */}
        <VmStack top={24} cx={760} w={560} />
        <At x={760} y={290} cx>
          <div className="flex flex-col items-center gap-2.5">
            <div className="flex items-center gap-2">
              <ClayPadlock w={20} />
              <span className="text-[17px] font-medium" style={{ color: colors.ink }}>Isolated virtual machines</span>
            </div>
            <div className="flex items-center gap-2">
              <Label tone="good" size={16}>Better resource utilization</Label>
              <Label tone="good" size={16}>Hardware independence</Label>
            </div>
          </div>
        </At>
      </Stage>
    </Card>
  )
}

/* ================================================================== 21 · Pooling And Metering Power (reference 20 + 21; split by the review, 2026-10-15) */

export function GridStatement({ lesson }: { lesson: string }) {
  return (
    <Statement
      id="grid-utility"
      kicker="Grid & Utility Computing"
      title="Pooling And Metering Power"
      label="Grid & Utility Computing"
      parts={[{ t: 'Grid computing', hi: true }, { t: ' pooled processing power across many organisations for one large task, while ' }, { t: 'utility computing', hi: true }, { t: ' proposed billing that powers the way electricity is billed' }]}
      lesson={lesson}
      art={
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-end gap-2">{[0, 1, 2].map((k) => <ClayInstitution key={k} w={88} tone={[LAB.cobalt, LAB.orange, LAB.periwinkle][k]} />)}</div>
          <ClayMeter w={96} value={0.6} />
        </div>
      }
    />
  )
}

/** The points stay on the rail; the picture's own words sit under it, one line each (review 2026-10-16). */
export function GridScene({ lesson }: { lesson: string }) {
  const beat = useBeats(4)
  const on = useDrawn()
  /* each institution's idle CPUs go to the grid in turn, and the grid's use runs to the meter: one step every 2.4s */
  const k = useCycle(3)
  const items = [
    /* the TR PDF's own bullets (re-synced 2026-10-22; the PDF is the later revision) */
    { text: <><B>Grid computing:</B> Combines unused processing power from many computers for large tasks</>, at: 1 },
    { text: <><B>Example:</B> Scientific projects use processing power from many participating computers</>, at: 2 },
    { text: <><B>Utility computing:</B> Pay for the computing capacity you actually use, rather than owning it</>, at: 3 },
    { text: <><B>Key idea:</B> Both concepts separate resource usage from hardware ownership, paving the way for cloud computing</>, at: 4 },
  ]
  const INST = [14, 88, 162]
  const TONES = [LAB.cobalt, LAB.orange, LAB.periwinkle]
  const NOTES = [
    { t: 'Idle CPUs combined for shared jobs', dot: colors.brand },
    { t: 'Metered billing', dot: colors.success },
    { t: 'Owned: stays with each institution', dot: colors.muted },
    { t: 'Consumed: paid by use', dot: colors.brand },
  ]
  return (
    <Card id="grid-points" kicker="Grid & Utility Computing" title="Pooling And Metering Power" lesson={lesson} beat={beat} total={4}>
      {/*
        REVIEW 2026-10-22 (slide 22): the bullets up from 16px to 20px in a wider
        column that stretches to the stage's height (the four tiles share the
        slack), the picture a size smaller (institutions 70, the cloud 156, the
        meter 84) so the stage can give the bullets 48px, and the four notes
        under the picture at 17px, two columns, wrapping instead of nowrap.
      */}
      <div className="flex gap-4">
        <div className="flex shrink-0 flex-col justify-between" style={{ width: 452, height: 392 }}>
          {items.map((it) => (
            <div key={it.at} className="flex items-start gap-3 rounded-2xl px-4 py-3" style={tile()}>
              <span className="mt-[8px] grid h-[14px] w-[14px] shrink-0 place-items-center rounded-full" style={{ background: colors.surface2, boxShadow: `inset 0 0 0 1.5px ${colors.brand}` }}>
                <span className="block h-[5px] w-[5px] rounded-full" style={{ background: colors.brand }} />
              </span>
              <span className="min-w-0 text-[18px] leading-snug" style={{ color: colors.ink }}>{it.text}</span>
            </div>
          ))}
        </div>
        <Stage w={642} h={392} active={false}>
          {INST.map((y, i) => (
            <At key={i} x={22} y={y}>
              <div className="flex items-center gap-2.5">
                <ClayInstitution w={70} tone={TONES[i]} />
                <Label size={16}>Institution</Label>
              </div>
            </At>
          ))}
          {INST.map((y, i) => (
            <Arrow key={i} x1={200} y1={y + 30} x2={266} y2={100 + (i - 1) * 22} on={on} delay={i * 120} />
          ))}
          <Traveller path={[[202, INST[k] + 30], [264, 100 + (k - 1) * 22]]} run k={k} size={12} tone={TONES[k]} dur={1.2} />
          <At x={352} y={40} cx>
            <div className="flex flex-col items-center gap-2">
              <ClayCloud w={156} />
              <Label strong tone="brand" size={15}>One grid</Label>
            </div>
          </At>
          <Arrow x1={438} y1={94} x2={494} y2={94} on={on} delay={360} />
          <Traveller path={[[440, 94], [492, 94]]} run k={`m${k}`} size={10} tone={colors.success} dur={1.2} />
          <At x={504} y={48}>
            <ClayMeter w={84} value={0.62} />
          </At>
          {/* the picture's words, out of the picture: a tile each, two columns, wrapping */}
          <At x={22} y={238} w={598}>
            <div className="grid grid-cols-2 gap-2.5">
              {NOTES.map((n) => (
                <div key={n.t} className="flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-[17px] font-medium leading-snug" style={{ ...tile(), color: colors.ink }}>
                  <span className="mt-[7px] block h-[10px] w-[10px] shrink-0 rounded-full" style={{ background: n.dot }} />
                  <span className="min-w-0">{n.t}</span>
                </div>
              ))}
            </div>
          </At>
        </Stage>
      </div>
    </Card>
  )
}

/* ================================================================== 24 · 2006 Onward Milestones */

const MILES = [
  { period: '2006', label: 'Amazon Web Services launches S3 storage, then EC2 compute', logo: '/assets/companies/amazon.png' },
  { period: '2008', label: 'Google App Engine offers a managed application platform', logo: '/assets/companies/google.png' },
  { period: '2010', label: 'Microsoft launches Windows Azure commercially', logo: '/assets/companies/microsoft.png' },
  { period: 'By the 2010s', label: 'Public cloud becomes the default for new IT', logo: '' },
]

export function Milestones({ lesson }: { lesson: string }) {
  const beat = useBeats(4)
  const ease = useEase(900)
  return (
    <Card id="public-cloud" kicker="Public Cloud Emerges" title="2006 Onward Milestones" lead="The public cloud era began when providers started selling the pooled, virtualized, metered resources of earlier eras directly over the internet, on demand" lesson={lesson} beat={beat} total={4}>
      <Stage w={BOX_W} h={360} active={false}>
        {MILES.map((m, i) => {
          const open = beat >= i + 1
          return (
            <At key={m.period} x={40 + i * 270} y={18} w={240}>
              <div className="flex flex-col items-center gap-2">
                <Label tone={open ? 'brand' : 'muted'} strong size={16}>{m.period}</Label>
                <Storefront w={130} open={open}>
                  {m.logo ? <img src={m.logo} alt="" className="h-[30px] w-auto" draggable={false} /> : <CloudShape w={56} />}
                </Storefront>
                <span className="text-center text-[16px] font-medium leading-snug" style={{ color: colors.ink, opacity: open ? 1 : 0.3, transition: ease }}>{m.label}</span>
              </div>
            </At>
          )
        })}
        {/* the adoption curve draws itself from 2006 to the 2010s, in its slot after the milestones (entrance.ts `data-draw`) */}
        <svg className="absolute" style={{ left: 30, top: 236 }} width={1050} height={110} aria-hidden>
          <defs>
            <linearGradient id="adopt-area" x1={0} y1={0} x2={0} y2={1}>
              <stop offset="0" stopColor={colors.brand} stopOpacity={0.2} />
              <stop offset="1" stopColor={colors.brand} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {/* the render's style: the curve stands on a graded fill and carries a soft glow */}
          <path d="M 0 100 C 260 98 420 92 560 80 C 740 64 900 34 1040 6 V 110 H 0 Z" fill="url(#adopt-area)" />
          <path d="M 0 100 C 260 98 420 92 560 80 C 740 64 900 34 1040 6" fill="none" stroke={colors.line} strokeWidth={3} />
          <path data-draw d="M 0 100 C 260 98 420 92 560 80 C 740 64 900 34 1040 6" fill="none" stroke={colors.brand} strokeWidth={10} strokeLinecap="round" opacity={0.16} />
          <path data-draw d="M 0 100 C 260 98 420 92 560 80 C 740 64 900 34 1040 6" fill="none" stroke={colors.brand} strokeWidth={4} strokeLinecap="round" />
          {/* motion layer: adoption keeps flowing along the curve, drawn on in the same slot */}
          <path data-draw d="M 0 100 C 260 98 420 92 560 80 C 740 64 900 34 1040 6" fill="none" stroke={colors.white} strokeWidth={2} strokeLinecap="round" strokeDasharray="5 9" opacity={0.75} className={mo('dash', 4).className} style={mo('dash', 4).style} />
        </svg>
        <At x={1000} y={318}><Label tone="brand" size={14}>Adoption</Label></At>
      </Stage>
    </Card>
  )
}

/* ================================================================== 25 · Eras And Their Legacy (split by the review, 2026-10-15: the lead, then the table; the "what cloud inherited" panel is gone, it repeated the Cloud Legacy column) */

export function EraStatement({ lesson }: { lesson: string }) {
  return (
    <Statement
      id="evolution-table"
      kicker="Evolution At A Glance"
      title="Eras And Their Legacy"
      label="Evolution At A Glance"
      parts={[{ t: 'Each era solved a resource problem that cloud computing still answers, from ' }, { t: 'shared access on one machine', hi: true }, { t: ' to ' }, { t: 'metered, on-demand delivery over the internet', hi: true }]}
      lesson={lesson}
      art={<ClayCloudScene w={280} />}
    />
  )
}

const TABLE: [string, string, string, string][] = [
  ['Mainframes & Time-sharing', '1960s-70s', 'Many users share one machine', 'Shared-access roots'],
  ['Client-Server & Virtualization', '1980s-2000s', 'Hardware abstracted into virtual machines', 'Resource pooling'],
  ['Grid & Utility Computing', '1990s-2000s', 'Pooled capacity, pay-per-use billing', 'Metered service model'],
  ['Public Cloud', '2006 onward', 'On-demand delivery over internet', "Today's cloud platforms"],
]

export function EraTable({ lesson }: { lesson: string }) {
  const beat = useBeats(4)
  const ease = useEase()
  return (
    <Card id="evolution-rows" kicker="Evolution At A Glance" title="Eras And Their Legacy" lesson={lesson} beat={beat} total={4}>
      <div className="flex flex-col gap-3" style={{ width: BOX_W }}>
        <div className="relative h-[44px]">
          <div className="absolute left-[20px] right-[20px] top-[10px] h-[3px] rounded-full" style={{ background: colors.line }} />
          {TABLE.map((r, i) => (
            <div key={r[1]} className="absolute flex flex-col items-center" style={{ left: 139 + i * 277, transform: 'translateX(-50%)' }}>
              <span className={`block h-[14px] w-[14px] rounded-full ${mo('pulse', i + 5).className}`} style={{ marginTop: 4, background: beat >= i + 1 ? colors.brand : colors.white, boxShadow: `inset 0 0 0 3px ${colors.brand}`, transition: ease, ...mo('pulse', i + 5).style }} />
              <span className="mt-1 whitespace-nowrap font-heading text-[16px] font-semibold" style={{ color: colors.brandDark }}>{r[1]}</span>
            </div>
          ))}
        </div>
        <Stage w={BOX_W} h={360} active={false} pad={12}>
          <div className="grid overflow-hidden rounded-xl" style={{ gridTemplateColumns: '1.3fr 0.8fr 1.4fr 1fr', ...tile() }}>
            {['Era', 'Period', 'Core Idea', 'Cloud Legacy'].map((h) => (
              <span key={h} className="px-4 py-3 font-heading text-[18px] font-semibold" style={{ background: colors.surface2, color: colors.brandDark }}>{h}</span>
            ))}
            {TABLE.map((r, i) =>
              r.map((c, k) => (
                <span key={`${i}${k}`} className={`px-4 py-4 text-[18px] leading-snug ${k === 0 ? 'font-heading font-semibold' : 'font-medium'}`} style={{ color: colors.ink, borderTop: `1px solid ${colors.line}`, background: isNow(beat, i + 1) ? 'rgba(45,99,251,0.09)' : 'transparent', opacity: beat >= i + 1 ? 1 : 0, transition: ease }}>
                  {c}
                </span>
              )),
            )}
          </div>
        </Stage>
      </div>
    </Card>
  )
}
