import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { Arrow, At, B, BOX_W, Card, Fade, Label, Stage, STILL, useCycle } from '../scene'
import { ClayPadlock, ClayTerminal, ClayTools, ClayJobTray, LAB } from '../d3/kit'
import { lead, PointsFigure, TableCard } from '../iso/frames'
import { Chip, Logo, STACK, Tile } from './frames'

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

/** The container icon of the fork: three boxes on one tile. */
function ContainerIcon() {
  return (
    <Tile w={112} h={62} style={{ display: 'grid', placeItems: 'center' }}>
      <div className="flex flex-col items-center gap-1">
        <Box w={30} h={18} tone={LAB.orange} />
        <div className="flex gap-1.5">
          <Box w={30} h={18} />
          <Box w={30} h={18} tone={LAB.sky} />
        </div>
      </div>
    </Tile>
  )
}

/** The VM icon of the fork: a whole machine, a screen with its own OS bar, on a stand. */
function VmIcon() {
  return (
    <Tile w={112} h={62} style={{ display: 'grid', placeItems: 'center' }}>
      <div className="flex flex-col items-center">
        <div className="flex flex-col gap-[3px] rounded-[6px] p-[4px]" style={{ width: 58, height: 34, background: STACK.kernel, boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.25)' }}>
          <span className="block h-[5px] w-full rounded-[2px]" style={{ background: STACK.guest }} />
          <span className="block flex-1 rounded-[3px]" style={{ background: 'linear-gradient(180deg, #EAF1FF, #C9D9F6)' }} />
        </div>
        <span className="block" style={{ width: 8, height: 6, background: STACK.hardware }} />
        <span className="block rounded-[3px]" style={{ width: 34, height: 5, background: STACK.hardware }} />
      </div>
    </Tile>
  )
}

/** A tag on one side of the fork: one half of a criterion, in the point's own words. */
function Tag({ children, lit }: { children: ReactNode; lit: boolean }) {
  return (
    <div
      className="w-full rounded-[10px] px-3 py-[6px] text-center text-[15px] font-semibold leading-tight"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #EEF3FD 100%)',
        color: colors.ink,
        boxShadow: `inset 0 0 0 ${lit ? 2 : 1.5}px ${lit ? colors.accent : '#C3D3F0'}, 0 8px 16px -12px rgba(16,32,58,0.45)`,
        transition: `box-shadow 300ms ${EASE}`,
      }}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ T17-1 four criteria */

const CRITERIA: { head: string; c: string; v: string }[] = [
  { head: 'Workload type:', c: 'stateless microservices', v: 'full-stack legacy apps' },
  { head: 'Isolation need:', c: 'process-level sharing', v: 'hardware-level separation' },
  { head: 'OS requirement:', c: 'same kernel', v: 'mixed operating systems' },
  { head: 'Scale and density:', c: 'many light instances', v: 'fewer, heavier ones' },
]

const FIG17_W = BOX_W - 452 - 24 // 634, the PointsFigure stage

function Fork() {
  /* 0: the bare fork; 1..4: that many pairs tagged, the newest ringed; harness: all four */
  const k = useCycle(5, 2400, 4)
  const W = FIG17_W
  const colW = 262
  const lx = 30
  const rx = W - 30 - colW
  const lc = lx + colW / 2
  const rc = rx + colW / 2
  return (
    <div className="absolute inset-0">
      <At x={W / 2} y={14} cx>
        <span className="grid place-items-center rounded-full font-heading text-[30px] font-bold leading-none" style={{ width: 52, height: 52, background: colors.brand, color: colors.white, boxShadow: `0 12px 24px -12px ${colors.brand}, inset 0 2px 0 rgba(255,255,255,0.3)` }}>
          ?
        </span>
      </At>
      <Arrow x1={W / 2 - 32} y1={48} x2={lc + 66} y2={96} />
      <Arrow x1={W / 2 + 32} y1={48} x2={rc - 66} y2={96} />
      <At x={lc} y={84} cx>
        <div className="flex flex-col items-center gap-2">
          <ContainerIcon />
          <Label strong size={16} tone="brand">Container</Label>
        </div>
      </At>
      <At x={rc} y={84} cx>
        <div className="flex flex-col items-center gap-2">
          <VmIcon />
          <Label strong size={16} tone="brand">VM</Label>
        </div>
      </At>
      {CRITERIA.map((p, i) => {
        const on = k > i
        const lit = !STILL && k === i + 1
        const y = 196 + i * 34
        return (
          <div key={p.head}>
            <At x={lx} y={y} w={colW}>
              <Fade on={on} lift={8}>
                <Tag lit={lit}>{p.c}</Tag>
              </Fade>
            </At>
            <At x={rx} y={y} w={colW}>
              <Fade on={on} lift={8}>
                <Tag lit={lit}>{p.v}</Tag>
              </Fade>
            </At>
          </div>
        )
      })}
    </div>
  )
}

export function FourCriteria({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="T17-1"
      kicker={'Choosing Between Them'}
      title={'Use Cases And Criteria'}
      lead={'Container and virtual machine strengths point to different workloads; matching the right one to the job is the real skill, not finding one universal winner'}
      lesson={lesson}
      points={CRITERIA.map((p) => (
        <>
          <B>{p.head}</B> {p.c} vs {p.v}
        </>
      ))}
      figure={<Fork />}
      figH={344}
    />
  )
}

/* ------------------------------------------------------------------ use-case tiles (T18-1, T19-1) */

type UseCase = { head: string; rest: string; icon: ReactNode }

/** Five raised tiles in a row: the icon on top, the whole point under it (its head bold). One tile lifts at a time. */
function UseTiles({ id, kicker, title, lead: l, lesson, items }: { id: string; kicker: string; title: string; lead: string; lesson: string; items: UseCase[] }) {
  const k = useCycle(items.length, 2400, -1)
  const gap = 16
  const w = Math.floor((BOX_W - gap * (items.length - 1)) / items.length)
  return (
    <Card id={id} kicker={kicker} title={title} lead={lead(l)} lesson={lesson}>
      <div className="flex items-stretch" style={{ width: BOX_W, gap, paddingTop: 6 }}>
        {items.map((it, i) => {
          const lit = !STILL && k === i
          return (
            <Stage key={it.head} w={w} h={292} active={false} style={{ transform: lit ? 'translateY(-5px)' : 'none', boxShadow: lit ? `0 0 0 3px ${colors.brand}55` : undefined, transition: `transform 420ms ${EASE}, box-shadow 420ms ${EASE}`, overflow: 'visible' }}>
              <div className="absolute inset-x-0 top-0 grid place-items-center" style={{ height: 128 }}>
                {it.icon}
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

/** Microservices: small services joined in a mesh. */
function MeshIcon() {
  const nodes: [number, number, string][] = [
    [70, 16, LAB.cobalt],
    [22, 48, LAB.sky],
    [118, 48, LAB.periwinkle],
    [44, 92, LAB.orange],
    [98, 92, LAB.cobalt],
  ]
  const links: [number, number][] = [[0, 1], [0, 2], [1, 3], [2, 4], [3, 4], [0, 3], [0, 4], [1, 2]]
  return (
    <div className="relative" style={{ width: 140, height: 108 }} aria-hidden>
      <svg className="absolute inset-0" width={140} height={108}>
        {links.map(([a, b]) => (
          <line key={`${a}-${b}`} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke={LAB.lavDeep} strokeWidth={2.5} strokeLinecap="round" />
        ))}
      </svg>
      {nodes.map(([x, y, t], i) => (
        <Box key={i} w={30} h={22} tone={t} style={{ position: 'absolute', left: x - 15, top: y - 11 }} />
      ))}
    </div>
  )
}

/** CI/CD: one box carried along a pipeline arrow, the same box at each stage. */
function PipelineIcon() {
  const seg = (tone: string, first: boolean): CSSProperties => ({
    width: 50,
    height: 30,
    background: tone,
    clipPath: first ? 'polygon(0 0, 78% 0, 100% 50%, 78% 100%, 0 100%)' : 'polygon(0 0, 78% 0, 100% 50%, 78% 100%, 0 100%, 22% 50%)',
  })
  return (
    <div className="flex flex-col items-center gap-2" aria-hidden>
      <div className="flex">
        {[0, 1, 2].map((i) => (
          <div key={i} className="grid place-items-center" style={{ width: 42 }}>
            <Box w={26} h={18} tone={LAB.orange} />
          </div>
        ))}
      </div>
      <div className="flex" style={{ gap: 0 }}>
        <span className="block" style={{ ...seg(LAB.sky, true) }} />
        <span className="block" style={{ ...seg(LAB.cobalt, false), marginLeft: -8 }} />
        <span className="block" style={{ ...seg(LAB.navy, false), marginLeft: -8 }} />
      </div>
    </div>
  )
}

/** High density: many boxes stacked on one host. */
function DensityIcon() {
  const tones = [LAB.sky, LAB.cobalt, LAB.orange, LAB.cobalt, LAB.periwinkle, LAB.sky, LAB.orange, LAB.sky, LAB.cobalt]
  return (
    <div className="flex flex-col items-center gap-1.5" aria-hidden>
      <div className="grid grid-cols-3 gap-1.5">
        {tones.map((t, i) => (
          <Box key={i} w={30} h={20} tone={t} />
        ))}
      </div>
      <span className="block rounded-[6px]" style={{ width: 112, height: 14, background: STACK.kernel, boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.25)' }} />
    </div>
  )
}

const CONTAINER_USES: UseCase[] = [
  { head: 'Microservices:', rest: 'independently deployable services communicating over APIs', icon: <MeshIcon /> },
  { head: 'CI/CD pipelines:', rest: 'identical images carried from build to production', icon: <PipelineIcon /> },
  { head: 'Cloud-native apps:', rest: 'run at scale on AWS ECS, EKS or Fargate', icon: <Logo name="aws" h={46} caption="AWS" /> },
  { head: 'Stateless, short-lived tasks:', rest: 'batch jobs and queue workers', icon: <ClayJobTray w={120} /> },
  { head: 'High-density hosting:', rest: 'many app instances packed onto one host', icon: <DensityIcon /> },
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

const VM_USES: UseCase[] = [
  { head: 'Legacy applications:', rest: 'tied to a specific OS version or kernel module', icon: <ClayTerminal w={110} /> },
  {
    head: 'Mixed operating systems:',
    rest: 'Windows and Linux guests on one host',
    icon: (
      <div className="flex items-end gap-5">
        <Logo name="windows" h={44} caption="Windows" />
        <Logo name="linux" h={44} caption="Linux" />
      </div>
    ),
  },
  { head: 'Strong multi-tenant isolation:', rest: 'separate kernels for untrusted workloads', icon: <ClayPadlock w={84} /> },
  { head: 'Kernel-level or driver work:', rest: 'isolated environments for kernel development and driver testing', icon: <ClayTools w={110} /> },
  { head: 'Full-stack test labs:', rest: 'AWS EC2 instances cloning a production server exactly', icon: <Logo name="ec2" h={50} caption="EC2" /> },
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

export function DecisionTable({ lesson }: { lesson: string }) {
  return (
    <TableCard
      id="T20-1"
      kicker={'Decision Criteria Map'}
      title={'Workload Fit Checklist'}
      lead={'No single criterion decides the choice; the table weighs isolation, OS diversity, density and workload lifetime side by side'}
      lesson={lesson}
      columns={[
        { label: 'Criterion', weight: 1 },
        { label: 'Favours Container', weight: 1.15 },
        { label: 'Favours VM', weight: 1.35 },
      ]}
      rows={ROWS.map(([c, a, b]) => [<b key="c" className="font-heading font-semibold">{c}</b>, a, b])}
      compact
    />
  )
}

/* ------------------------------------------------------------------ T20-2 both together */

const NOTE = 'Production systems often combine both, containers scheduled onto VM-based hosts, using the VM as the security boundary and containers for density within it'

/** One VM box (the security boundary) that fills with containers, one by one, then holds full. */
function NestedBox() {
  const N = 6
  const k = useCycle(N + 3, 900, N + 2)
  const shown = Math.min(N, k)
  const boxW = 380
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div
        className="relative flex flex-col items-center gap-4 rounded-[22px] px-7 pb-6 pt-12"
        style={{ width: boxW, background: 'linear-gradient(180deg, #F4F7FE 0%, #E3ECFB 100%)', boxShadow: `inset 0 0 0 2.5px ${colors.brand}, 0 18px 34px -22px rgba(16,32,58,0.55)` }}
      >
        <div className="absolute left-1/2 top-3 -translate-x-1/2">
          <Label strong size={17} tone="solid">VM</Label>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: N }, (_, i) => (
            <div key={i} style={{ opacity: i < shown ? 1 : 0, transform: i < shown ? 'none' : 'translateY(-16px) scale(0.9)', transition: `all 480ms ${EASE}` }}>
              <Tile w={92} h={64} style={{ display: 'grid', placeItems: 'center' }}>
                <Box w={48} h={30} tone={i % 3 === 1 ? LAB.orange : i % 3 === 2 ? LAB.sky : LAB.cobalt} />
              </Tile>
            </div>
          ))}
        </div>
        <Chip tone="tag" size={16}>containers</Chip>
      </div>
    </div>
  )
}

export function BothTogether({ lesson }: { lesson: string }) {
  const noteW = 452
  const figW = BOX_W - noteW - 24
  return (
    <Card id="T20-2" kicker={'Decision Criteria Map'} title={'Workload Fit Checklist'} lesson={lesson}>
      <div className="flex items-center" style={{ width: BOX_W, gap: 24 }}>
        <div className="rounded-card border-l-[5px] p-6 text-[20px] leading-relaxed" style={{ width: noteW, background: '#EAF1FF', borderColor: colors.brand, color: colors.ink }}>
          {NOTE}
        </div>
        <Stage w={figW} h={360} active={false}>
          <NestedBox />
        </Stage>
      </div>
    </Card>
  )
}
