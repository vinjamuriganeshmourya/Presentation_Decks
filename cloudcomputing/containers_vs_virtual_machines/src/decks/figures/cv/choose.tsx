import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { Arrow, At, B, BOX_W, Card, Fade, Label, Stage, STILL, useCycle, useLoop } from '../scene'
import { ClayPadlock, ClayTools, LAB } from '../d3/kit'
import { AppWindow, Boxes, Feather, History, Layers, Link2, ListChecks, Monitor, MonitorCog, Container as ContainerIco, RefreshCw, Scale, Server, Share2, ShieldCheck, Users, Weight } from 'lucide-react'
import { Badge, CvIcon, fx, LitFigure } from './fx'
import { VisualTable } from './vtable'
import { lead } from '../iso/frames'
import { Chip, Logo, STACK } from './frames'

/**
 * SECTION 4 · CHOOSING BETWEEN THEM (TR slides 17 to 20), cards T17-1 to T20-2.
 *
 * Every figure runs ONE loop whose motion is the spec's press sequence, and
 * holds its most complete state on harness URLs (`STILL`):
 *   T17-1  the fork: the four criteria are tagged as pairs, container half on
 *          the left, VM half on the right, one pair per step
 *   T18-1  the five container use cases, each tile lifted in turn
 *   T19-1  the five VM use cases, each tile lifted in turn
 *   T20-1  the kit table (it builds itself, a row at a time, every column at once)
 *   T20-2  one VM box, filled with containers one by one
 */

const EASE = 'cubic-bezier(0.22,1,0.36,1)'

/* ------------------------------------------------------------------ small drawings */

/** A container as an icon: a ribbed box (a shipping container seen from the side). */
function Box({ w = 34, h = 24, tone = LAB.cobalt, style }: { w?: number; h?: number; tone?: string; style?: CSSProperties }) {
  return (
    <span
      aria-hidden
      className="block rounded-[5px]"
      style={{
        width: w,
        height: h,
        background: `repeating-linear-gradient(90deg, rgba(255,255,255,0) 0 5px, rgba(255,255,255,0.28) 5px 7px), linear-gradient(180deg, ${tone} 0%, ${tone}D0 100%)`,
        boxShadow: `inset 0 2px 0 rgba(255,255,255,0.35), inset 0 -3px 0 rgba(0,0,0,0.14), 0 6px 12px -8px rgba(16,32,58,0.6)`,
        ...style,
      }}
    />
  )
}

/* ------------------------------------------------------------------ the two subjects, drawn as what they are */

/**
 * A SHIPPING CONTAINER, side on (slide 54, user 2026-11-03: "replace abstract icons with
 * visually accurate icons"): corrugated steel walls, the corner castings, the double doors
 * at the end with their locking bars. The deck's word "container" is this object.
 */
function ShippingContainer({ w = 120, tone = LAB.orange }: { w?: number; tone?: string }) {
  const h = w * 0.5
  return (
    <svg width={w} height={h} viewBox="0 0 120 60" aria-hidden>
      <ellipse cx="60" cy="57" rx="54" ry="3" fill="#1F408C" opacity="0.18" />
      <rect x="4" y="6" width="112" height="46" rx="3" fill={tone} />
      {Array.from({ length: 13 }, (_, i) => (
        <rect key={i} x={10 + i * 6.4} y="9" width="3" height="40" rx="1" fill="#000" opacity="0.13" />
      ))}
      <rect x="4" y="6" width="112" height="5" fill="#FFFFFF" opacity="0.28" />
      {/* the doors at the right end, two locking bars each */}
      <rect x="90" y="9" width="23" height="40" rx="1.5" fill="#000" opacity="0.08" />
      <line x1="101.5" y1="9" x2="101.5" y2="49" stroke="#000" strokeOpacity="0.25" strokeWidth="1" />
      {[95, 99, 104, 108].map((x) => (
        <rect key={x} x={x} y="11" width="1.6" height="36" rx="0.8" fill="#FFFFFF" opacity="0.6" />
      ))}
      {[[4, 6], [110, 6], [4, 46], [110, 46]].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="6" height="6" rx="1" fill="#000" opacity="0.28" />
      ))}
    </svg>
  )
}

/** A whole machine for the VM: the library's desktop computer render, its screen a running OS. */
function VmMachine({ w = 104 }: { w?: number }) {
  return <CvIcon name="desktop" w={w} />
}

/* ------------------------------------------------------------------ T17-1 four criteria */

/*
 * The fork's tags are icons only (user, 2026-11-04: the words repeated the points on the left), each
 * picture its half of the criterion: microservices = small boxes, full-stack legacy = a stack and a
 * clock; process-level sharing = a share glyph, hardware-level separation = two servers with a wall
 * between; same kernel = one Linux, mixed operating systems = Windows and Linux; many light instances
 * = three feathers, fewer heavier ones = one weight.
 */
const IC = 22
const Wall = () => <span aria-hidden className="block self-stretch rounded-full" style={{ width: 2.5, background: colors.brand }} />
const CRITERIA: { head: string; c: string; v: string; ci: ReactNode; vi: ReactNode }[] = [
  { head: 'Workload type:', c: 'stateless microservices', v: 'full-stack legacy apps', ci: <Boxes size={IC} />, vi: <><Layers size={IC} /><History size={IC} /></> },
  { head: 'Isolation need:', c: 'process-level sharing', v: 'hardware-level separation', ci: <Share2 size={IC} />, vi: <><Server size={IC} /><Wall /><Server size={IC} /></> },
  { head: 'OS requirement:', c: 'same kernel', v: 'mixed operating systems', ci: <Logo name="linux" h={22} />, vi: <><Logo name="windows" h={20} /><Logo name="linux" h={22} /></> },
  { head: 'Scale and density:', c: 'many light instances', v: 'fewer, heavier ones', ci: <><Feather size={IC} /><Feather size={IC} /><Feather size={IC} /></>, vi: <Weight size={IC} /> },
]

const FIG17_W = BOX_W - 452 - 24 // 634, the PointsFigure stage

/** A tag on one side of the fork: one half of a criterion as its icon(s) only, no words (user, 2026-11-04). */
function Tag({ label, icon, lit }: { label: string; icon: ReactNode; lit: boolean }) {
  return (
    <div
      role="img"
      aria-label={label}
      className="flex w-full items-center justify-center gap-2 rounded-[10px] px-2.5 py-[5px]"
      style={{
        background: lit ? 'linear-gradient(180deg, #FFF8EE 0%, #FFE9CF 100%)' : 'linear-gradient(180deg, #FFFFFF 0%, #EEF3FD 100%)',
        color: colors.ink,
        boxShadow: `inset 0 0 0 ${lit ? 2 : 1.5}px ${lit ? colors.accent : '#C3D3F0'}, 0 8px 16px -12px rgba(16,32,58,0.45)`,
        transition: `all 300ms ${EASE}`,
      }}
    >
      <span aria-hidden className="flex h-[22px] items-center gap-1.5" style={{ color: colors.brand }}>
        {icon}
      </span>
    </div>
  )
}

/**
 * THE FORK (slide 54, corrections 2026-11-03). One step at a time:
 *   0 the open question · 1 both arrows draw (line, then head) · 2..5 a token rides EACH arrow
 *   along its own line (the same geometry as the arrow), and when it reaches the tip the
 *   criterion lands as a pair and both pictures nod · 6, 7 rest on the full fork.
 * On the loop's reset the tags leave first, then each arrow (head first, then line).
 */
const ARROW_L = (W: number, lc: number) => ({ x1: W / 2 - 32, y1: 50, x2: lc + 70, y2: 92 })
const ARROW_R = (W: number, rc: number) => ({ x1: W / 2 + 32, y1: 50, x2: rc - 70, y2: 92 })
const RIDE_MS = 900

/** A token riding an arrow from its tail to its tip: the same two points the arrow is drawn between. */
function Rider({ a }: { a: { x1: number; y1: number; x2: number; y2: number } }) {
  const ang = Math.atan2(a.y2 - a.y1, a.x2 - a.x1)
  const ex = a.x2 - Math.cos(ang) * 4
  const ey = a.y2 - Math.sin(ang) * 4
  return (
    <span
      aria-hidden
      className="ch-ride pointer-events-none absolute h-[12px] w-[12px] rounded-full"
      style={{ left: a.x1 - 6, top: a.y1 - 6, background: colors.accent, boxShadow: `0 0 0 3px ${colors.white}`, ['--dx' as string]: `${ex - a.x1}px`, ['--dy' as string]: `${ey - a.y1}px` } as CSSProperties}
    />
  )
}

function Fork({ k }: { k: number }) {
  const W = FIG17_W
  const colW = 262
  const lx = 30
  const rx = W - 30 - colW
  const lc = lx + colW / 2
  const rc = rx + colW / 2
  const arrows = k >= 1
  const pairs = Math.max(0, Math.min(4, k - 1))
  const riding = !STILL && k >= 2 && k <= 5
  const L = ARROW_L(W, lc)
  const R = ARROW_R(W, rc)
  const nod = (d: number) => (riding ? fx('hop', RIDE_MS / 1000 + d, 1.2) : null)
  return (
    <div className="absolute inset-0">
      <At x={W / 2} y={12} cx>
        <span className="relative grid place-items-center" style={{ width: 54, height: 54 }}>
          <span aria-hidden className={`absolute inset-0 rounded-full ${fx('ripple', 0, 2.4).className}`} style={{ ...fx('ripple', 0, 2.4).style, border: `2px solid ${colors.brand}` }} />
          <span className="grid place-items-center rounded-full font-heading text-[30px] font-bold leading-none" style={{ width: 54, height: 54, background: colors.brand, color: colors.white, boxShadow: `0 12px 24px -12px ${colors.brand}, inset 0 2px 0 rgba(255,255,255,0.3)` }}>
            ?
          </span>
        </span>
      </At>
      <Arrow {...L} on={arrows} />
      <Arrow {...R} on={arrows} />
      {riding && (
        <div key={k}>
          <Rider a={L} />
          <Rider a={R} />
        </div>
      )}
      <At x={lc} y={84} cx>
        <div className="flex flex-col items-center gap-1.5">
          <div key={`c${k}`} className={nod(0)?.className ?? ''} style={{ ...(nod(0)?.style ?? {}), animationIterationCount: 1 }}>
            <ShippingContainer w={118} />
          </div>
          <Label strong size={16} tone="brand" icon={<ContainerIco />}>Container</Label>
        </div>
      </At>
      <At x={rc} y={72} cx>
        <div className="flex flex-col items-center gap-1">
          <div key={`v${k}`} className={nod(0.05)?.className ?? ''} style={{ ...(nod(0.05)?.style ?? {}), animationIterationCount: 1 }}>
            <VmMachine w={92} />
          </div>
          <Label strong size={16} tone="brand" icon={<Monitor />}>VM</Label>
        </div>
      </At>
      {CRITERIA.map((p, i) => {
        const on = pairs > i
        const landing = on && !STILL && k === i + 2
        const lit = landing
        const y = 196 + i * 36
        const d = landing ? RIDE_MS - 60 : 0
        return (
          <div key={p.head}>
            <At x={lx} y={y} w={colW}>
              <Fade on={on} lift={8} delay={d}>
                <Tag lit={lit} icon={p.ci} label={p.c} />
              </Fade>
            </At>
            <At x={rx} y={y} w={colW}>
              <Fade on={on} lift={8} delay={d}>
                <Tag lit={lit} icon={p.vi} label={p.v} />
              </Fade>
            </At>
          </div>
        )
      })}
    </div>
  )
}

/* the points' icon bullets (G7): each criterion's own subject */
const CRITERIA_ICONS: ReactNode[] = [<Layers key="0" />, <ShieldCheck key="1" />, <MonitorCog key="2" />, <Scale key="3" />]

export function FourCriteria({ lesson }: { lesson: string }) {
  const k = useCycle(8, 1900, 5, 5)
  return (
    <LitFigure
      id="T17-1"
      kicker={'Choosing Between Them'}
      title={'Use Cases And Criteria'}
      lead={'Container and virtual machine strengths point to different workloads; matching the right one to the job is the real skill, not finding one universal winner'}
      lesson={lesson}
      points={CRITERIA.map((p, i) => ({
        icon: CRITERIA_ICONS[i],
        text: (
          <>
            <B>{p.head}</B> {p.c} vs {p.v}
          </>
        ),
      }))}
      lit={k >= 2 && k <= 5 ? k - 2 : -1}
      figure={<Fork k={k} />}
      figH={352}
    />
  )
}

/* ------------------------------------------------------------------ use-case tiles (T18-1, T19-1) */

type UseCase = { head: string; rest: string; icon: ReactNode | ((lit: boolean) => ReactNode) }

/**
 * Five raised tiles in a row: the icon on top, the whole point under it (its head bold).
 * Every icon runs its own loop that acts out the use case; the tiles light one at a time
 * (one per press with auto animation off).
 */
function UseTiles({ id, kicker, title, lead: l, lesson, items }: { id: string; kicker: string; title: string; lead: string; lesson: string; items: UseCase[] }) {
  const k = useCycle(items.length + 1, 2200, 0, items.length)
  const gap = 16
  const w = Math.floor((BOX_W - gap * (items.length - 1)) / items.length)
  return (
    <Card id={id} kicker={kicker} title={title} lead={lead(l)} lesson={lesson}>
      <div className="flex items-stretch" style={{ width: BOX_W, gap, paddingTop: 6 }}>
        {items.map((it, i) => {
          const lit = !STILL && k === i + 1
          return (
            <Stage key={it.head} w={w} h={292} active={false} style={{ transform: lit ? 'translateY(-6px)' : 'none', boxShadow: lit ? `0 0 0 3px ${colors.brand}55, 0 22px 36px -22px ${colors.brand}` : undefined, transition: `transform 420ms ${EASE}, box-shadow 420ms ${EASE}`, overflow: 'visible' }}>
              <div className="absolute inset-x-0 top-0 grid place-items-center" style={{ height: 128 }}>
                {typeof it.icon === 'function' ? it.icon(lit) : it.icon}
              </div>
              <div className="absolute inset-x-0 px-4 text-center text-[17px] leading-snug" style={{ top: 134, color: colors.ink }}>
                <B>{it.head}</B> {it.rest}
              </div>
            </Stage>
          )
        })}
      </div>
    </Card>
  )
}

/** Microservices: five services in a mesh, requests running along their API links. */
function MeshIcon() {
  const nodes: [number, number, string][] = [
    [70, 16, LAB.cobalt],
    [22, 48, LAB.sky],
    [118, 48, LAB.periwinkle],
    [44, 92, LAB.orange],
    [98, 92, LAB.cobalt],
  ]
  const links: [number, number][] = [[0, 1], [0, 2], [1, 3], [2, 4], [3, 4], [0, 3], [0, 4], [1, 2]]
  const calls: [number, number][] = [[1, 0], [0, 4], [3, 4], [2, 0]]
  return (
    <div className="relative" style={{ width: 140, height: 108 }} aria-hidden>
      <svg className="absolute inset-0" width={140} height={108}>
        {links.map(([a, b]) => (
          <line key={`${a}-${b}`} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke={LAB.lavDeep} strokeWidth={2.5} strokeLinecap="round" />
        ))}
      </svg>
      {/* the API calls: a packet travelling from one service to another */}
      {calls.map(([a, b], i) => (
        <span key={i} className={`absolute h-[8px] w-[8px] rounded-full ${fx('flow', i * 0.55, 2.2).className}`} style={{ ...fx('flow', i * 0.55, 2.2).style, left: nodes[a][0] - 4, top: nodes[a][1] - 4, background: colors.accent, boxShadow: `0 0 0 2px ${colors.white}`, ['--dx' as string]: `${nodes[b][0] - nodes[a][0]}px`, ['--dy' as string]: `${nodes[b][1] - nodes[a][1]}px` } as CSSProperties} />
      ))}
      {nodes.map(([x, y, t], i) => (
        <Box key={i} w={30} h={22} tone={t} style={{ position: 'absolute', left: x - 15, top: y - 11 }} />
      ))}
    </div>
  )
}

/** CI/CD: ONE image (the same box) carried along build, test and production, never rebuilt. */
function PipelineIcon() {
  const seg = (tone: string, first: boolean): CSSProperties => ({
    width: 50,
    height: 30,
    background: tone,
    clipPath: first ? 'polygon(0 0, 78% 0, 100% 50%, 78% 100%, 0 100%)' : 'polygon(0 0, 78% 0, 100% 50%, 78% 100%, 0 100%, 22% 50%)',
  })
  return (
    <div className="flex flex-col items-center gap-2" aria-hidden>
      <div className="relative" style={{ width: 126, height: 22 }}>
        {[0, 1, 2].map((i) => (
          <span key={i} className="absolute" style={{ left: 8 + i * 42, top: 2, opacity: 0.2 }}>
            <Box w={26} h={18} tone={LAB.orange} />
          </span>
        ))}
        <span className={`absolute ${fx('flow', 0, 2.6).className}`} style={{ ...fx('flow', 0, 2.6).style, left: 8, top: 2, ['--dx' as string]: '84px', ['--dy' as string]: '0px' } as CSSProperties}>
          <Box w={26} h={18} tone={LAB.orange} />
        </span>
      </div>
      <div className="flex" style={{ gap: 0 }}>
        <span className="block" style={{ ...seg(LAB.sky, true) }} />
        <span className="block" style={{ ...seg(LAB.cobalt, false), marginLeft: -8 }} />
        <span className="block" style={{ ...seg(LAB.navy, false), marginLeft: -8 }} />
      </div>
    </div>
  )
}

/** Stateless, short-lived tasks: a queue of jobs on a tray, each lifting off, finishing and gone, the next one after. */
function JobQueueIcon() {
  const tones = [LAB.orange, LAB.yellow, LAB.sky, LAB.periwinkle]
  return (
    <div className="relative" style={{ width: 150, height: 86 }} aria-hidden>
      {tones.map((t, i) => (
        <span key={i} className={`absolute ${fx('job', i * 0.8, 3.2).className}`} style={{ ...fx('job', i * 0.8, 3.2).style, left: 10 + i * 34, top: 8 }}>
          <span className="block h-[44px] w-[30px] overflow-hidden rounded-[6px]" style={{ background: LAB.paper, boxShadow: '0 6px 10px -6px rgba(16,32,58,0.5)' }}>
            <span className="block h-[10px]" style={{ background: t }} />
            <span className="mx-auto mt-[7px] block h-[4px] w-[18px] rounded" style={{ background: LAB.lavDeep }} />
            <span className="ml-[6px] mt-[5px] block h-[4px] w-[12px] rounded" style={{ background: LAB.lavDeep }} />
          </span>
        </span>
      ))}
      <span className="absolute block rounded-b-[14px] rounded-t-[3px]" style={{ left: 4, top: 46, width: 142, height: 30, background: `linear-gradient(180deg, ${LAB.navy} 0%, #1E2C6E 100%)`, boxShadow: '0 10px 18px -12px rgba(16,32,58,0.7)' }} />
    </div>
  )
}

/**
 * High density (slide 55, corrections 2026-11-03): app instances packed onto ONE host. When its
 * tile is the lit one (its step), the nine instances land one by one, row by row from the host
 * up, left to right, all inside about one second; otherwise the host stands packed.
 */
function DensityIcon({ play }: { play: boolean }) {
  const tones = [LAB.sky, LAB.cobalt, LAB.orange, LAB.cobalt, LAB.periwinkle, LAB.sky, LAB.orange, LAB.sky, LAB.cobalt]
  const run = play && !STILL
  return (
    <div className="flex flex-col items-center gap-1.5" aria-hidden>
      <div key={run ? 'run' : 'rest'} className="grid grid-cols-3 gap-1.5">
        {tones.map((t, i) => {
          const order = (2 - Math.floor(i / 3)) * 3 + (i % 3)
          return (
            <span key={i} className={run ? 'ch-pop block' : 'block'} style={{ animationDelay: `${order * 90}ms` }}>
              <Box w={30} h={20} tone={t} />
            </span>
          )
        })}
      </div>
      <span className="block rounded-[6px]" style={{ width: 112, height: 14, background: STACK.kernel, boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.25)' }} />
    </div>
  )
}

/**
 * Cloud-native at scale (slide 55, corrections 2026-11-03: the moving AWS smile read oddly). The AWS
 * mark stands still over its cloud; container tasks are scheduled onto it, one more column after
 * another (scaling out), each landing with a small ripple on the cloud's floor.
 */
function CloudScaleIcon() {
  const cols = [0, 1, 2, 3]
  return (
    <div className="flex flex-col items-center gap-1" aria-hidden>
      <Logo name="aws" h={36} />
      <div className="relative" style={{ width: 150, height: 66 }}>
        <svg className="absolute inset-0" width={150} height={66} viewBox="0 0 150 66">
          <path d="M22 60 C6 60 4 40 20 38 C18 22 40 16 50 28 C56 12 86 10 92 28 C100 18 124 22 122 38 C140 38 144 60 126 60 Z" fill="#EAF1FF" stroke="#B9CBEF" strokeWidth="2" />
          <rect x="24" y="52" width="102" height="5" rx="2.5" fill="#232F3E" opacity="0.85" />
        </svg>
        {cols.map((c) => (
          <span key={c} className="absolute" style={{ left: 30 + c * 23, top: 31 }}>
            <span className={`block ${fx('drop', c * 0.45, 3.6).className}`} style={fx('drop', c * 0.45, 3.6).style}>
              <Box w={20} h={20} tone={c % 2 ? LAB.orange : LAB.cobalt} />
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

const CONTAINER_USES: UseCase[] = [
  { head: 'Microservices:', rest: 'independently deployable services communicating over APIs', icon: <MeshIcon /> },
  { head: 'CI/CD pipelines:', rest: 'identical images carried from build to production', icon: <PipelineIcon /> },
  { head: 'Cloud-native apps:', rest: 'run at scale on AWS ECS, EKS or Fargate', icon: <CloudScaleIcon /> },
  { head: 'Stateless, short-lived tasks:', rest: 'batch jobs and queue workers', icon: <JobQueueIcon /> },
  { head: 'High-density hosting:', rest: 'many app instances packed onto one host', icon: (lit) => <DensityIcon play={lit} /> },
]

export function ContainerUses({ lesson }: { lesson: string }) {
  return (
    <UseTiles
      id="T18-1"
      kicker={'Container Use Cases'}
      title={'Where Containers Fit Best'}
      lead={'Containers suit workloads that restart often, scale horizontally, and ship as small, repeatable units, the opposite of a slow-booting, heavyweight guest'}
      lesson={lesson}
      items={CONTAINER_USES}
    />
  )
}

/** Mixed operating systems: Windows and Linux taking turns on ONE host. */
function MixedOsIcon() {
  return (
    <div className="flex flex-col items-center gap-1.5" aria-hidden>
      <div className="flex items-end gap-5">
        <span className={fx('lift', 0, 2.6).className} style={fx('lift', 0, 2.6).style}><Logo name="windows" h={40} caption="Windows" /></span>
        <span className={fx('lift', -1.3, 2.6).className} style={fx('lift', -1.3, 2.6).style}><Logo name="linux" h={40} caption="Linux" /></span>
      </div>
      <span className="block rounded-[6px]" style={{ width: 120, height: 10, background: STACK.hypervisor, boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3)' }} />
    </div>
  )
}

/** Strong multi-tenant isolation: the padlock's shackle closing, again and again. */
function ClosingLock() {
  const t = useLoop(3000, { mode: 'sawtooth', still: 0.9 })
  return <ClayPadlock w={76} open={t < 0.35} />
}

/**
 * Full-stack test labs (slide 56, corrections 2026-11-03: no animation on EC2): the EC2 instance and
 * its exact clone standing beside it, still, the clone drawn as a copy (dashed outline).
 */
function CloneIcon() {
  return (
    <span className="inline-flex items-start gap-3" aria-hidden>
      <Logo name="ec2" h={52} caption="EC2" />
      <span className="rounded-[10px] p-[3px]" style={{ outline: `2px dashed ${colors.brand}80`, outlineOffset: 1, opacity: 0.8 }}>
        <Logo name="ec2" h={46} />
      </span>
    </span>
  )
}

/**
 * Legacy applications (slide 56, corrections 2026-11-03: a real picture, not a terminal): an old
 * beige CRT and tower running a classic desktop OS, a grey old-style app window open on it, chained
 * to that machine (the link badge): the app is tied to that OS version.
 */
function LegacyPcIcon() {
  return (
    <span className="relative inline-block" style={{ width: 140, height: 112 }} aria-hidden>
      <svg width={140} height={112} viewBox="0 0 140 112">
        <ellipse cx="68" cy="106" rx="62" ry="4" fill="#1F408C" opacity="0.14" />
        {/* the tower: floppy slot, CD tray, power light, vents */}
        <rect x="102" y="18" width="32" height="86" rx="3" fill="#E6DEC6" stroke="#BFB394" strokeWidth="1.5" />
        <rect x="107" y="27" width="22" height="7" rx="1.5" fill="#D3C9AC" />
        <rect x="107" y="40" width="22" height="3.5" rx="1" fill="#4A4A4A" />
        <rect x="117" y="46" width="8" height="2" rx="1" fill="#8D8468" />
        <circle cx="111" cy="95" r="2.2" fill="#35CB4B" />
        {[60, 65, 70, 75].map((y) => (
          <rect key={y} x="108" y={y} width="20" height="1.6" rx="0.8" fill="#BFB394" />
        ))}
        {/* the CRT monitor: deep beige case, curved glass */}
        <rect x="4" y="6" width="92" height="74" rx="7" fill="#EAE3CC" stroke="#BFB394" strokeWidth="1.5" />
        <rect x="12" y="13" width="76" height="56" rx="6" fill="#008080" stroke="#7A7158" strokeWidth="2" />
        {/* the old desktop: a grey window, navy title bar, its form fields and a raised button */}
        <rect x="19" y="18" width="62" height="40" fill="#C0C0C0" stroke="#FFFFFF" strokeWidth="1" />
        <rect x="20" y="19" width="60" height="7" fill="#000080" />
        <rect x="21" y="19" width="60" height="7" fill="url(#ch-tb)" />
        {[66, 71, 76].map((x) => (
          <rect key={x} x={x} y="20.5" width="4" height="4" fill="#C0C0C0" stroke="#7B7B7B" strokeWidth="0.6" />
        ))}
        <rect x="24" y="30" width="14" height="3" fill="#7B7B7B" />
        <rect x="40" y="29" width="36" height="5" fill="#FFFFFF" stroke="#7B7B7B" strokeWidth="0.8" />
        <rect x="24" y="38" width="14" height="3" fill="#7B7B7B" />
        <rect x="40" y="37" width="36" height="5" fill="#FFFFFF" stroke="#7B7B7B" strokeWidth="0.8" />
        <rect x="56" y="47" width="20" height="7" fill="#C0C0C0" stroke="#4A4A4A" strokeWidth="0.8" />
        <line x1="56.5" y1="47.5" x2="75.5" y2="47.5" stroke="#FFFFFF" strokeWidth="1" />
        {/* the taskbar and its start button */}
        <rect x="13" y="62" width="74" height="6" fill="#C0C0C0" />
        <rect x="14.5" y="63" width="12" height="4" fill="#C0C0C0" stroke="#4A4A4A" strokeWidth="0.6" />
        <rect x="16" y="64" width="3" height="2" fill="#2F8A2F" />
        {/* the monitor's neck and foot */}
        <path d="M40 80 L60 80 L64 92 L36 92 Z" fill="#DCD3B8" />
        <rect x="26" y="92" width="48" height="7" rx="3" fill="#E6DEC6" stroke="#BFB394" strokeWidth="1.2" />
        <rect x="78" y="73" width="10" height="3" rx="1.5" fill="#35CB4B" />
        <defs>
          <linearGradient id="ch-tb" x1="0" x2="1">
            <stop offset="0" stopColor="#000080" />
            <stop offset="1" stopColor="#1084D0" />
          </linearGradient>
        </defs>
      </svg>
      {/* the text cursor in the old form: the app is running */}
      <span className={`absolute block ${fx('blink', 0, 1.1).className}`} style={{ ...fx('blink', 0, 1.1).style, left: 43, top: 30, width: 1.5, height: 3.5, background: '#000' }} />
      {/* tied to this machine: the link between the app and its OS */}
      <span className="absolute grid place-items-center rounded-full" style={{ left: 86, top: 34, width: 26, height: 26, background: colors.white, color: colors.accent, boxShadow: `inset 0 0 0 2px ${colors.accent}, 0 6px 12px -8px rgba(16,32,58,0.6)` }}>
        <Link2 size={15} />
      </span>
    </span>
  )
}

const VM_USES: UseCase[] = [
  { head: 'Legacy applications:', rest: 'tied to a specific OS version or kernel module', icon: <LegacyPcIcon /> },
  { head: 'Mixed operating systems:', rest: 'Windows and Linux guests on one host', icon: <MixedOsIcon /> },
  { head: 'Strong multi-tenant isolation:', rest: 'separate kernels for untrusted workloads', icon: <ClosingLock /> },
  {
    head: 'Kernel-level or driver work:',
    rest: 'isolated environments for kernel development and driver testing',
    icon: (
      <span className={fx('wrench', 0, 2.2).className} style={{ ...fx('wrench', 0, 2.2).style, display: 'inline-block' }}>
        <ClayTools w={104} />
      </span>
    ),
  },
  { head: 'Full-stack test labs:', rest: 'AWS EC2 instances cloning a production server exactly', icon: <CloneIcon /> },
]

export function VmUses({ lesson }: { lesson: string }) {
  return (
    <UseTiles
      id="T19-1"
      kicker={'VM Use Cases'}
      title={'Where VMs Fit Best'}
      lead={'Virtual machines earn their heavier footprint when a workload needs a full, isolated operating system or hardware access the host runtime cannot provide'}
      lesson={lesson}
      items={VM_USES}
    />
  )
}

/* ------------------------------------------------------------------ T20-1 decision table */

const ROWS: [string, string, string][] = [
  ['Isolation strength', 'Process-level, shared kernel', 'Hardware-level, separate kernel'],
  ['OS diversity', 'Same kernel for all apps', 'Multiple OS types on one host'],
  ['Density / footprint', 'Many instances per host', 'Fewer, heavier instances per host'],
  ['Deployment and management', 'Frequent, consistent redeployment', 'Full OS control or legacy environment requirements'],
  ['Tenant isolation', 'Lower guarantee, shared kernel', 'Strict guarantee for untrusted tenants'],
]

/* each criterion's subject, its icon moving the way the criterion works */
const ROW_ICONS: ReactNode[] = [
  <ShieldCheck key="0" size={18} />,
  <AppWindow key="1" size={18} />,
  <span key="2" className={fx('glow', 0, 1.6).className} style={{ ...fx('glow', 0, 1.6).style, display: 'grid' }}><Boxes size={18} /></span>,
  <span key="3" className={fx('spin', 0, 4).className} style={{ ...fx('spin', 0, 4).style, display: 'grid' }}><RefreshCw size={17} /></span>,
  <Users key="4" size={18} />,
]

export function DecisionTable({ lesson }: { lesson: string }) {
  return (
    <Card id="T20-1" kicker={'Decision Criteria Map'} title={'Workload Fit Checklist'} lead={lead('No single criterion decides the choice; the table weighs isolation, OS diversity, density and workload lifetime side by side')} lesson={lesson}>
      <div style={{ width: BOX_W }}>
        <VisualTable
          compact
          columns={[
            { label: 'Criterion', icon: <ListChecks size={16} />, weight: 1 },
            { label: 'Favours Container', icon: <ContainerIco size={16} />, weight: 1.15 },
            { label: 'Favours VM', icon: <Monitor size={16} />, weight: 1.35 },
          ]}
          rows={ROWS.map(([c, a, b], i) => ({ icon: ROW_ICONS[i], cells: [<b key="c" className="font-heading font-semibold">{c}</b>, a, b] }))}
        />
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ T20-2 both together */

const NOTE = 'Production systems often combine both, containers scheduled onto VM-based hosts, using the VM as the security boundary and containers for density within it'

/**
 * SLIDE 58, IN DETAIL: a VM drawn as a running machine window (its title bar and
 * controls), standing on its physical host (the library's server stack); one press
 * raises the VM's security boundary (the shield, the boundary glowing round the
 * window); then the containers are scheduled into it one by one, each a shipping
 * container dropping into its slot, the host's lights blinking as they land.
 *   0 the empty VM · 1 the boundary · 2..7 a container each
 */
function NestedBox({ k }: { k: number }) {
  const N = 6
  const shown = Math.max(0, Math.min(N, k - 1))
  const guarded = k >= 1
  const boxW = 392
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <div
        className="relative flex flex-col items-center rounded-[18px] pb-4"
        style={{ width: boxW, background: 'linear-gradient(180deg, #F4F7FE 0%, #E3ECFB 100%)', boxShadow: `inset 0 0 0 2.5px ${colors.brand}, 0 0 0 ${guarded ? 7 : 0}px ${colors.brand}22, 0 18px 34px -22px rgba(16,32,58,0.55)`, transition: `box-shadow 600ms ${EASE}` }}
      >
        {/* the VM's title bar: it is a machine of its own */}
        <div className="flex w-full items-center gap-1.5 rounded-t-[16px] px-3" style={{ height: 34, background: `linear-gradient(180deg, ${colors.brand} 0%, #1D4FD8 100%)` }}>
          {['#FF6B5F', '#FFC23D', '#35CB4B'].map((c) => (
            <span key={c} className="block h-[9px] w-[9px] rounded-full" style={{ background: c }} />
          ))}
          <span className="ml-auto mr-auto inline-flex items-center gap-1.5 font-heading text-[16px] font-bold" style={{ color: colors.white }}>
            <Monitor size={15} aria-hidden />
            VM
          </span>
          <span className="w-[39px]" />
        </div>
        {/* the security boundary's shield, on the VM's corner */}
        <span className="absolute" style={{ right: -14, top: 18 }}>
          <Badge on={guarded} size={36} ring={colors.brand}>
            <ShieldCheck size={20} color={colors.brand} />
          </Badge>
        </span>
        <div className="mt-3.5 grid grid-cols-3 gap-2.5">
          {Array.from({ length: N }, (_, i) => (
            <div key={i} className="grid h-[58px] w-[104px] place-items-center rounded-[12px]" style={{ background: 'rgba(255,255,255,0.7)', boxShadow: `inset 0 0 0 1.5px ${i < shown ? '#CFDCF5' : '#CFDCF5'}`, borderStyle: 'dashed' }}>
              <div style={{ opacity: i < shown ? 1 : 0, transform: i < shown ? 'none' : 'translateY(-26px)', transition: `opacity 360ms ${EASE}, transform 520ms cubic-bezier(0.34,1.5,0.64,1)` }}>
                <ShippingContainer w={84} tone={i % 3 === 1 ? LAB.orange : i % 3 === 2 ? LAB.sky : LAB.cobalt} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <Chip tone="tag" size={16}>containers</Chip>
        </div>
      </div>
      {/* the VM-based host it runs on */}
      <div className="relative mt-2 flex items-center gap-2">
        <CvIcon name="server-stack" w={74} />
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`block h-[7px] w-[7px] rounded-full ${fx('blink', i * 0.3, 0.9).className}`} style={{ ...fx('blink', i * 0.3, 0.9).style, background: colors.success }} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function BothTogether({ lesson }: { lesson: string }) {
  const noteW = 452
  const figW = BOX_W - noteW - 24
  const k = useCycle(10, 950, 7, 7)
  return (
    <Card id="T20-2" kicker={'Decision Criteria Map'} title={'Workload Fit Checklist'} lesson={lesson}>
      <div className="flex items-center" style={{ width: BOX_W, gap: 24 }}>
        <div className="rounded-card border-l-[5px] p-6 text-[20px] leading-relaxed" style={{ width: noteW, background: '#EAF1FF', borderColor: colors.brand, color: colors.ink }}>
          {NOTE}
        </div>
        <Stage w={figW} h={420} active={false}>
          <NestedBox k={k} />
        </Stage>
      </div>
    </Card>
  )
}

/** This section's own keyframes (corrections pass 2026-11-03), appended to the deck's CSS by cvDeck.tsx. */
export const CHOOSE_CSS = `
@keyframes ch-ride { 0% { transform: translate(0, 0); opacity: 0 } 10% { opacity: 1 } 88% { opacity: 1 } 100% { transform: translate(var(--dx, 0px), var(--dy, 0px)); opacity: 0 } }
.ch-ride { animation: ch-ride ${RIDE_MS}ms cubic-bezier(0.45,0,0.55,1) both; }
@keyframes ch-pop { 0% { transform: translateY(-14px); opacity: 0 } 100% { transform: none; opacity: 1 } }
.ch-pop { animation: ch-pop 300ms cubic-bezier(0.34,1.4,0.64,1) both; }
.cc-still .ch-ride, .deck-thumb .ch-ride { animation: none !important; opacity: 0 !important; }
.cc-still .ch-pop, .deck-thumb .ch-pop { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .ch-ride { animation: none !important; opacity: 0 !important; } .ch-pop { animation: none !important; } }
`
