import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { AppWindow, Bug, Check, Coins, Container as ContainerIco, Cpu, Eye, Hourglass, Layers, Lock, MemoryStick, Monitor, Power, Rocket, Cog, ShieldCheck, Server, TrendingDown, TriangleAlert, User, Zap, CloudDownload, Database, Timer } from 'lucide-react'
import { At, BOX_W, Card, Label, STILL, useCycle, useLoop, Arrow } from '../scene'
import { Badge, CvIcon, fx, LitFigure, LitPoints, NeedleGauge, Ripple } from './fx'
import instructor from './icons/instructor-icon.png' // slide 44's figure (user, 2026-11-04), from assets/icons/Icons/Female Teacher
import { VisualTable } from './vtable'
import { lead } from '../iso/frames'
import { ContainerHost, LockGlyph, MARK, Slab, STACK, Tile, VmHost } from './frames'

/**
 * SECTION 3, "Containers vs Virtual Machines" compared (T12-1 to T16-1).
 * Every stack is the session's ONE drawing (`VmHost`, `ContainerHost` from
 * `frames.tsx`, design note 3). Every string is the spec's; figure labels use
 * only words the card already has. One self-running loop per figure; on
 * harness URLs each holds its most complete state.
 */

const EASE = 'cubic-bezier(0.22,1,0.36,1)'

/** A stack's name over it, in the heading face. */
function Head({ children }: { children: ReactNode }) {
  return (
    <span className="font-heading text-[17px] font-bold leading-tight" style={{ color: colors.brandDark }}>
      {children}
    </span>
  )
}

/* ================================================================== T12-1 · two stacks (the TR image, redrawn) */

/**
 * The TR's slide-12 image in the deck's style, its words exactly (user,
 * 2026-10-28): LEFT "Containerized Applications", App A to App F on Docker,
 * on Host Operating System, on Infrastructure; RIGHT three "Virtual Machine"
 * columns, each its app on its own Guest Operating System, on Hypervisor, on
 * Infrastructure.
 * The loop lights the one Host Operating System under all six apps, then the
 * three Guest Operating Systems, one per VM; still: nothing lit.
 */
const TS_W = 1110
const TS_H = 352

/** A white pill on a dark slab, holding the slab's icon or logo. */
function Pill({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden className="grid h-[28px] min-w-[28px] place-items-center rounded-full px-1.5" style={{ background: colors.white, color: colors.brandDark, boxShadow: '0 4px 10px -6px rgba(16,32,58,0.6)' }}>
      {children}
    </span>
  )
}

/** A server's three status lights, blinking: the infrastructure is running. */
function Lights() {
  return (
    <span aria-hidden className="flex gap-1.5">
      {[0, 1, 2].map((i) => (
        <span key={i} className={`block h-[7px] w-[7px] rounded-full ${fx('blink', i * 0.3, 1.2).className}`} style={{ ...fx('blink', i * 0.3, 1.2).style, background: i === 2 ? colors.accent : '#4ADE80' }} />
      ))}
    </span>
  )
}

/**
 * THE TWO STACKS, ONE SIDE PER PRESS (slide 43, corrections 2026-11-03: "text only, add
 * icons and micro-animations on both sides"). Every layer carries its icon or logo
 * (app windows, the Docker whale, Linux for the host OS, a gear per guest OS, layers for
 * the hypervisor, a server with its lights for the infrastructure).
 *   0 both stacks at rest
 *   1 LEFT lit, right faded: the six apps hop in a wave and their calls drip down
 *     through Docker to the edge of the ONE Host Operating System, which lights
 *   2 RIGHT lit, left faded: each VM's own Guest Operating System lights, its gear
 *     turning, three copies over the hypervisor
 *   3 both lit side by side (the complete state, held on harness URLs)
 */
function TwoStacksDiagram() {
  const k = useCycle(4, 2600, 3, 3)
  const leftOn = k === 1 || k === 3
  const rightOn = k === 2 || k === 3
  const PW = 535
  const pad = 22
  const inner = PW - pad * 2
  const apps = ['App A', 'App B', 'App C', 'App D', 'App E', 'App F']
  const ag = 10
  const aw = (inner - ag * 5) / 6
  const vg = 14
  const vw = (inner - vg * 2) / 3
  /* the left column's rows: heading 26, gap 10, apps, then three 42px slabs with 10px gaps */
  const appsH = TS_H - pad * 2 - 26 - 10 - (42 + 10) * 3
  const appsBottom = 26 + 10 + appsH
  const hostTop = appsBottom + 10 + 42 + 10
  const panel = (on: boolean, children: ReactNode) => (
    <div style={{ opacity: k === 0 || on ? 1 : 0.32, transition: `opacity 480ms ${EASE}` }}>
      <Tile w={PW} h={TS_H} style={{ padding: pad, borderRadius: 20 }}>
        {children}
      </Tile>
    </div>
  )
  const block = (text: string, fill: string, h: number, icon: ReactNode, lit = false, tail?: ReactNode) => (
    <div className="relative" style={{ borderRadius: 14, boxShadow: lit ? `0 0 0 3px ${colors.accent}, 0 10px 22px -10px ${colors.accent}` : undefined, transition: `box-shadow 420ms ${EASE}` }}>
      <Slab w={inner} h={h} fill={fill}>
        <span className="inline-flex items-center gap-2.5">
          <Pill>{icon}</Pill>
          {text}
        </span>
      </Slab>
      {tail && <span className="absolute" style={{ right: 18, top: '50%', transform: 'translateY(-50%)' }}>{tail}</span>}
    </div>
  )
  return (
    <div className="flex justify-between" style={{ width: TS_W }}>
      {panel(
        leftOn,
        <div className="relative flex h-full flex-col" style={{ gap: 10 }}>
          <div className="text-center font-heading text-[18px] font-semibold" style={{ color: colors.ink, height: 26 }}>
            Containerized Applications
          </div>
          <div className="flex" style={{ gap: ag, height: appsH }}>
            {apps.map((a, i) => (
              <div
                key={a}
                className="flex flex-col items-center justify-center gap-1.5 rounded-[12px] font-heading text-[16px] font-semibold"
                style={{ width: aw, background: STACK.layer, color: colors.white, boxShadow: leftOn ? `0 0 0 2.5px ${colors.accent}, 0 8px 16px -12px rgba(16,32,58,0.55)` : '0 8px 16px -12px rgba(16,32,58,0.55)', transition: `box-shadow 420ms ${EASE} ${i * 70}ms` }}
              >
                <span aria-hidden className={leftOn ? fx('hop', i * 0.12, 1.6).className : ''} style={{ ...(leftOn ? fx('hop', i * 0.12, 1.6).style : {}), display: 'grid' }}>
                  <AppWindow size={20} />
                </span>
                {a}
              </div>
            ))}
          </div>
          {block('Docker', STACK.engine, 42, <img src={MARK.docker} alt="" className="block h-[18px] w-auto" draggable={false} />)}
          {block('Host Operating System', STACK.kernel, 42, <img src={MARK.linux} alt="" className="block h-[20px] w-auto" draggable={false} />, leftOn)}
          {block('Infrastructure', STACK.hardware, 42, <Server size={16} />, false, <Lights />)}
          {/* each app's calls drip down through Docker into the one host OS */}
          {leftOn &&
            apps.map((a, i) => (
              <span
                key={a}
                aria-hidden
                className={`absolute block h-[8px] w-[8px] rounded-full ${fx('flow', i * 0.18, 1.5).className}`}
                style={{ ...fx('flow', i * 0.18, 1.5).style, left: i * (aw + ag) + aw / 2 - 4, top: appsBottom - 2, background: colors.accent, boxShadow: '0 0 0 2px #fff', ['--dy' as string]: `${hostTop - appsBottom - 12}px` }}
              />
            ))}
        </div>,
      )}
      {panel(
        rightOn,
        <div className="flex h-full flex-col" style={{ gap: 10 }}>
          <div className="flex flex-1" style={{ gap: vg }}>
            {['App A', 'App B', 'App C'].map((a, i) => (
              <div key={a} className="flex flex-col overflow-hidden rounded-[14px]" style={{ width: vw, boxShadow: `inset 0 0 0 2px ${colors.brandDark}33, 0 8px 16px -12px rgba(16,32,58,0.5)`, background: colors.white }}>
                <div className="grid place-items-center font-heading text-[16px] font-bold" style={{ height: 44, color: colors.ink }}>
                  Virtual Machine
                </div>
                <div className="flex items-center justify-center gap-2 font-heading text-[16px] font-semibold" style={{ height: 44, background: STACK.layer, color: colors.white }}>
                  <AppWindow size={18} aria-hidden />
                  {a}
                </div>
                <div
                  className="flex flex-1 flex-col items-center justify-center gap-1 px-2 text-center font-heading text-[16px] font-semibold leading-snug"
                  style={{ background: rightOn ? '#FFF1D6' : '#E3ECFD', color: colors.ink, boxShadow: rightOn ? `inset 0 0 0 3px ${colors.accent}` : undefined, transition: `all 420ms ${EASE} ${i * 140}ms` }}
                >
                  <span aria-hidden className={rightOn ? fx('spin', 0, 3).className : ''} style={{ ...(rightOn ? fx('spin', 0, 3).style : {}), display: 'grid', color: rightOn ? '#B4650A' : colors.brand, transition: 'color 420ms' }}>
                    <Cog size={20} />
                  </span>
                  Guest Operating System
                </div>
              </div>
            ))}
          </div>
          {block('Hypervisor', STACK.hypervisor, 48, <Layers size={16} />)}
          {block('Infrastructure', STACK.hardware, 48, <Server size={16} />, false, <Lights />)}
        </div>,
      )}
    </div>
  )
}

export function TwoStacks({ lesson }: { lesson: string }) {
  return (
    <Card
      id="T12-1"
      kicker={'Four Comparison Dimensions'}
      title={'Boot Memory Size Security'}
      lead={lead('Containers and virtual machines isolate workloads differently, and that difference shows up in four measurable areas before any use case is chosen')}
      lesson={lesson}
    >
      <TwoStacksDiagram />
    </Card>
  )
}

/**
 * THE FOUR DIMENSIONS, ONE PER PRESS (slide 44, corrections 2026-11-03: "add a human
 * illustration on the right"): each point carries its subject's icon and lights in
 * turn, while the presenter on the right points back at the list.
 */
export function TwoStacksPoints({ lesson }: { lesson: string }) {
  const k = useCycle(6, 1700, 5, 5)
  const items: [ReactNode, string][] = [
    [<Timer key="0" />, 'Boot time: how quickly each starts and becomes usable'],
    [<MemoryStick key="1" />, 'Memory footprint: RAM consumed per workload at idle'],
    [<Layers key="2" />, 'Image size and density: how many instances fit per host'],
    [<ShieldCheck key="3" />, 'Isolation strength: kernel-level sharing versus hardware-level separation'],
    [<TriangleAlert key="4" />, 'Security trade-offs: what fails if the boundary is breached'],
  ]
  return (
    <Card id="T12-1b" kicker={'Four Comparison Dimensions'} title={'Boot Memory Size Security'} lesson={lesson}>
      <div className="flex items-center justify-between" style={{ width: BOX_W }}>
        <LitPoints width={800} items={items.map(([icon, text]) => ({ icon, text }))} lit={k - 1} />
        <div className="relative grid place-items-center" style={{ width: 280 }}>
          <span aria-hidden className="absolute rounded-full" style={{ width: 250, height: 250, background: 'radial-gradient(circle, #E3ECFD 0%, rgba(227,236,253,0) 70%)' }} />
          <span className={fx('lift', 0, 3).className} style={{ ...fx('lift', 0, 3).style, display: 'block' }}>
            <img src={instructor} alt="" draggable={false} className="relative block select-none" style={{ height: 320, width: 'auto' }} />
          </span>
        </div>
      </div>
    </Card>
  )
}

/* ================================================================== T13-1 · boot time and memory */

/** The two sides' icons, the same on every table and figure of this section: a VM is a whole machine, a container a box. */
const VM_ICO = <Monitor size={16} />
const CT_ICO = <ContainerIco size={16} />

/**
 * A pair of horizontal bars, VM and container, in the TR's proportion (tens
 * of seconds against under a few; hundreds of MB to GB against a few to tens
 * of MB). No numbers: the table carries the words. `g` is the grow phase.
 */
function BarPair({ title, icon, vm, ct, g, w }: { title: string; icon: ReactNode; vm: number; ct: number; g: number; w: number }) {
  const labW = 170
  const track = w - labW - 40
  const bar = (frac: number, fill: string) => (
    <span className="block h-[22px] origin-left rounded-full" style={{ width: Math.max(6, track * frac), transform: `scaleX(${Math.max(0.03, g)})`, background: fill, boxShadow: '0 6px 12px -8px rgba(16,32,58,0.5)' }} />
  )
  return (
    <Tile w={w} style={{ padding: '12px 20px' }}>
      <div className="mb-2 flex items-center gap-2 font-heading text-[16px] font-semibold" style={{ color: colors.ink }}>
        <span aria-hidden className="grid h-[26px] w-[26px] place-items-center rounded-[8px]" style={{ background: colors.surface2, color: colors.brand }}>
          {icon}
        </span>
        {title}
      </div>
      <div className="flex flex-col gap-2.5">
        {[
          ['Virtual Machine', vm, STACK.hypervisor, VM_ICO],
          ['Container', ct, STACK.engine, CT_ICO],
        ].map(([name, frac, fill, ico]) => (
          <div key={name as string} className="flex items-center gap-3">
            <span className="flex shrink-0 items-center gap-2 text-[15px] font-medium" style={{ width: labW, color: colors.muted }}>
              <span aria-hidden style={{ color: fill as string }}>{ico as ReactNode}</span>
              {name as string}
            </span>
            {bar(frac as number, fill as string)}
          </div>
        ))}
      </div>
    </Tile>
  )
}

export function BootMemory({ lesson }: { lesson: string }) {
  /* the bars grow once the rows are in (one press, auto animation off); the hourglass turns while a boot is timed */
  const t = useLoop(5200, { mode: 'sawtooth', still: 1, beats: [0.45] })
  const g = t < 0.45 ? 1 - Math.pow(1 - t / 0.45, 3) : t > 0.92 && t < 1 ? 1 - (t - 0.92) / 0.08 : 1
  const half = (BOX_W - 24) / 2
  return (
    <Card id="T13-1" kicker={'Boot Time And Memory'} title={'Startup Speed Compared'} lead={lead('Starting a virtual machine boots a full guest operating system; starting a container launches one process on a kernel already running')} lesson={lesson}>
      <div className="flex flex-col gap-4" style={{ width: BOX_W }}>
        <VisualTable
          compact
          columns={[{ label: 'Metric', weight: 0.8 }, { label: 'Virtual Machine', icon: VM_ICO }, { label: 'Container', icon: CT_ICO }]}
          rows={[
            { icon: <span className={fx('flip', 0, 3).className} style={fx('flip', 0, 3).style}><Hourglass size={18} /></span>, cells: ['Boot time', 'Tens of seconds (full OS boot)', 'Under a few seconds (process start)'] },
            { icon: <span className={fx('glow', 0, 1.6).className} style={fx('glow', 0, 1.6).style}><MemoryStick size={18} /></span>, cells: ['Memory footprint (idle)', 'Several hundred MB to a few GB (guest OS overhead)', 'A few MB to tens of MB (app plus runtime)'] },
          ]}
        />
        <div className="flex" style={{ gap: 24 }}>
          <BarPair title="Boot time" icon={<Timer size={15} />} vm={1} ct={0.09} g={g} w={half} />
          <BarPair title="Memory footprint (idle)" icon={<MemoryStick size={15} />} vm={1} ct={0.05} g={g} w={half} />
        </div>
      </div>
    </Card>
  )
}

/* ================================================================== T13-2 · why the gap */

const STEPS = ['bootloader', 'kernel init', 'service startup', 'application process']
const STEP_ICO = [<Power key="p" size={18} />, <Cpu key="c" size={18} />, <Cog key="g" size={18} />, <AppWindow key="a" size={18} />]
const GAP_POINTS = [
  'Cause: VM repeats bootloader, kernel init and service startup',
  'Container skips straight to launching the application process',
  'Lower per-instance memory lets more workloads run concurrently',
]

/**
 * THE TWO STARTS, SIDE BY SIDE (slide 46, user 2026-11-03: "currently text only,
 * build the visual"). The VM walks its four stages one press at a time, each lit
 * as it runs with its icon (power, chip, gear turning, app window), an hourglass
 * turning beside the VM until its application is up; the container's rocket
 * launches straight to its application process on the FIRST press and gets its
 * check at once. The last press lights the memory each start holds: four RAM
 * sticks for the VM, one for the container.
 *   0 idle · 1 bootloader / container launched · 2 kernel init · 3 service startup ·
 *   4 VM application process · 5 memory
 */
function GapScene({ k }: { k: number }) {
  const colW = 250
  const rowH = 58
  const top = 66
  const xVm = 52
  const xCt = 52 + colW + 62
  const vmUp = k >= 4
  const ctUp = k >= 1
  const chip = (i: number, text: string, on: boolean, now: boolean, app: boolean) => (
    <div
      className="flex items-center gap-2.5 rounded-[12px] px-3 font-heading text-[16px] font-semibold"
      style={{
        width: colW,
        height: 44,
        background: on ? (app ? colors.brand : '#E3ECFD') : colors.white,
        color: on && app ? colors.white : colors.ink,
        boxShadow: `inset 0 0 0 ${now ? 2.5 : 1.5}px ${now ? colors.accent : on ? colors.brand : '#CFDCF5'}, 0 8px 16px -12px rgba(16,32,58,0.5)`,
        transition: `all 420ms ${EASE}`,
      }}
    >
      <span aria-hidden className={`grid place-items-center ${now && i === 2 ? fx('spin', 0, 2).className : ''}`} style={{ color: on && app ? colors.white : on ? colors.brand : colors.muted, ...(now && i === 2 ? fx('spin', 0, 2).style : {}) }}>
        {STEP_ICO[i]}
      </span>
      {text}
    </div>
  )
  const ram = (lit: number, x: number) => (
    <At x={x + colW / 2} y={top + 4 * rowH + 12} cx>
      <div className="flex gap-2" style={{ opacity: k >= 5 ? 1 : 0.18, transition: `opacity 420ms ${EASE}` }}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} aria-hidden className="grid h-[34px] w-[48px] place-items-center rounded-[8px]" style={{ background: i < lit && k >= 5 ? '#FFF1D6' : colors.surface, color: i < lit && k >= 5 ? '#B4650A' : '#B8C4D9', boxShadow: `inset 0 0 0 1.5px ${i < lit && k >= 5 ? colors.accent : '#D5DCE8'}`, transition: `all 420ms ${EASE} ${i * 90}ms` }}>
            <MemoryStick size={20} />
          </span>
        ))}
      </div>
    </At>
  )
  return (
    <>
      <At x={xVm + colW / 2} y={18} cx>
        <span className="inline-flex items-center gap-2">
          <Monitor size={18} color={colors.brandDark} aria-hidden />
          <Head>VM</Head>
          <span className="relative grid h-[26px] w-[26px] place-items-center">
            <span className={`absolute grid place-items-center ${k >= 1 && !vmUp ? fx('flip', 0, 1.6).className : ''}`} style={{ color: colors.accent, opacity: k >= 1 && !vmUp ? 1 : 0, transition: 'opacity 300ms', ...(k >= 1 && !vmUp ? fx('flip', 0, 1.6).style : {}) }}>
              <Hourglass size={18} aria-hidden />
            </span>
            <span className="absolute">
              <Badge on={vmUp} size={24} ring={colors.success}><Check size={14} color={colors.success} strokeWidth={3} /></Badge>
            </span>
          </span>
        </span>
      </At>
      <At x={xCt + colW / 2} y={18} cx>
        <span className="inline-flex items-center gap-2">
          <ContainerIco size={18} color={colors.brandDark} aria-hidden />
          <Head>Container</Head>
          <Badge on={ctUp} size={24} ring={colors.success}><Check size={14} color={colors.success} strokeWidth={3} /></Badge>
        </span>
      </At>
      {STEPS.map((s, i) => (
        <At key={s} x={xVm} y={top + i * rowH}>
          {chip(i, s, k > i, !STILL && k === i + 1 && i < 3, i === 3)}
        </At>
      ))}
      {STEPS.slice(0, 3).map((s, i) => (
        <Arrow key={s} x1={xVm + colW / 2} y1={top + i * rowH + 46} x2={xVm + colW / 2} y2={top + (i + 1) * rowH - 2} on={k > i + 1} />
      ))}
      <Arrow x1={xCt + colW / 2} y1={top} x2={xCt + colW / 2} y2={top + 3 * rowH - 2} on={ctUp} />
      {/* the rocket rides the container's one arrow to its application process */}
      <At x={xCt + colW / 2 + 22} y={top - 6} style={{ transform: `translateY(${ctUp ? 3 * rowH - 40 : 0}px)`, transition: `transform 700ms cubic-bezier(0.65,0,0.35,1)` }}>
        <span aria-hidden className="grid h-[32px] w-[32px] place-items-center rounded-full" style={{ background: colors.white, color: colors.accent, boxShadow: `inset 0 0 0 1.5px ${colors.accent}55, 0 6px 12px -8px rgba(16,32,58,0.5)`, transform: 'rotate(135deg)' }}>
          <Rocket size={17} />
        </span>
      </At>
      <At x={xCt} y={top + 3 * rowH}>
        {chip(3, 'application process', ctUp, false, true)}
      </At>
      {ram(4, xVm)}
      {ram(1, xCt)}
    </>
  )
}

export function WhyGap({ lesson }: { lesson: string }) {
  const k = useCycle(7, 1300, 5, 5)
  return (
    <LitFigure
      id="T13-2"
      kicker={'Boot Time And Memory'}
      title={'Startup Speed Compared'}
      lesson={lesson}
      pointsW={420}
      lit={k >= 1 && k <= 3 ? 0 : k === 4 ? 1 : k === 5 ? 2 : -1}
      points={GAP_POINTS.map((t, i) => ({ icon: [<Power key="0" />, <Rocket key="1" />, <MemoryStick key="2" />][i], text: t }))}
      figure={<GapScene k={k} />}
      figH={380}
    />
  )
}

/* ================================================================== T14-1 · image size and density */

/**
 * One host packed with blocks: `n` per side, `shown` placed so far. The host is a
 * server plate (its rack ears and status lights) and every block is drawn as what
 * it is: a VM a small monitor, a container a ribbed box. The blocks drop in one by
 * one, so the room watches the container host fill sixteen times as many.
 */
function HostGrid({ side, n, shown, kind, label }: { side: number; n: number; shown: number; kind: 'vm' | 'ct'; label: string }) {
  const pad = 12
  const gap = n > 3 ? 4 : 10
  const cell = (side - pad * 2 - gap * (n - 1)) / n
  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="relative rounded-[16px]" style={{ width: side, height: side + 14, background: 'linear-gradient(180deg, #F7F9FE 0%, #E9EFFA 100%)', boxShadow: `inset 0 0 0 2px ${STACK.hardware}, 0 14px 24px -16px rgba(16,32,58,0.6)` }}>
        {/* the server's status lights along its foot: it is a running host */}
        <div className="absolute flex gap-1.5" style={{ left: 12, bottom: 6 }}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={`block h-[5px] w-[5px] rounded-full ${fx('blink', i * 0.33, 1.2).className}`} style={{ ...fx('blink', i * 0.33, 1.2).style, background: i === 2 ? colors.accent : colors.success }} />
          ))}
        </div>
        {Array.from({ length: n * n }, (_, i) => {
          const r = Math.floor(i / n)
          const c = i % n
          const on = i < shown
          return (
            <span
              key={i}
              className="absolute grid place-items-center"
              style={{
                left: pad + c * (cell + gap),
                top: pad + r * (cell + gap),
                width: cell,
                height: cell,
                borderRadius: n > 3 ? 3 : 10,
                background: kind === 'vm' ? `linear-gradient(180deg, ${STACK.hypervisor} 0%, #1D4FD8 100%)` : `repeating-linear-gradient(90deg, rgba(255,255,255,0) 0 2px, rgba(255,255,255,0.3) 2px 3px), ${STACK.engine}`,
                opacity: on ? 1 : 0,
                transform: on ? 'none' : 'translateY(-10px) scale(0.7)',
                transition: `opacity 260ms ${EASE}, transform 340ms cubic-bezier(0.34,1.5,0.64,1)`,
              }}
            >
              {kind === 'vm' && <Monitor size={cell * 0.5} color={colors.white} aria-hidden />}
            </span>
          )
        })}
      </div>
      <span className="font-heading text-[16px] font-semibold" style={{ color: colors.ink }}>
        {label}
      </span>
    </div>
  )
}

export function SizeDensity({ lesson }: { lesson: string }) {
  /* one press fills the hosts (auto animation off); in auto the hosts fill on a loop */
  const t = useLoop(6400, { mode: 'sawtooth', still: 1, beats: [0.7] })
  const fill = Math.min(1, t / 0.7)
  return (
    <Card id="T14-1" kicker={'Image Size Density'} title={'Packing Workloads Tighter'} lead={lead('Containers fit more workloads per host by sharing the host kernel and avoiding separate guest operating systems')} lesson={lesson}>
      <div className="flex flex-col items-center gap-4" style={{ width: BOX_W }}>
        <div style={{ width: BOX_W }}>
          <VisualTable
            compact
            columns={[{ label: 'Metric', weight: 0.8 }, { label: 'Virtual Machine', icon: VM_ICO }, { label: 'Container', icon: CT_ICO }]}
            rows={[
              { icon: <Layers size={18} />, cells: ['Image size', 'Several GB (full guest OS plus app)', 'Tens of MB to a few hundred MB (app layers only)'] },
              { icon: <NeedleGauge size={18} color="currentColor" />, cells: ['Typical density per host', 'Tens of VMs', 'Hundreds of containers'] },
            ]}
          />
        </div>
        <div className="flex items-start" style={{ gap: 90 }}>
          <HostGrid side={140} n={2} shown={Math.ceil(fill * 4)} kind="vm" label="Tens of VMs" />
          <HostGrid side={140} n={8} shown={Math.ceil(fill * 64)} kind="ct" label="Hundreds of containers" />
        </div>
      </div>
    </Card>
  )
}

/* ================================================================== T14-2 · what density buys */

const DENSITY_POINTS = [
  'Smaller images pull and deploy faster across a cluster',
  'Higher density lowers infrastructure cost per workload on identical hardware',
  'Shared base layers cut total storage across many container images',
]

/**
 * WHAT DENSITY BUYS, ONE POINT PER PRESS (slide 48, user 2026-11-03: "self-explanatory,
 * not text-heavy"): the three images arrive from the registry cloud on a flowing pull
 * line and land on the ONE shared base (point 1: small images pull fast); the coins of
 * cost per workload fall as the third lands (point 2); the storage drum fills only by
 * the thin top layers, its dashed ghost showing the height three full copies would take
 * (point 3).
 *   0 the base alone · 1 image 1 pulled · 2 images 2 and 3, cost falls · 3 storage
 */
function SharedBaseScene({ k }: { k: number }) {
  const W = 330
  const X = 150
  const iw = 96
  const gap = (W - iw * 3) / 2
  const landed = k >= 2 ? 3 : k >= 1 ? 1 : 0
  return (
    <>
      {/* the registry the images are pulled from */}
      <At x={70} y={30} cx>
        <CvIcon name="cloud" w={86} />
      </At>
      {/* the pull line: dots flowing from the cloud to the images while a pull runs */}
      <svg aria-hidden className="pointer-events-none absolute" style={{ left: 0, top: 0 }} width={634} height={330}>
        <path d={`M 112 70 C 150 70, ${X + 20} 70, ${X + 40} 112`} fill="none" stroke={colors.brand} strokeWidth={2.5} strokeDasharray="6 7" className="mo mo-dash" opacity={k >= 1 ? 0.9 : 0.2} style={{ transition: 'opacity 400ms' }} />
      </svg>
      {k >= 1 && k <= 2 && !STILL && (
        <span aria-hidden className={`absolute grid h-[22px] w-[22px] place-items-center rounded-full ${fx('flow', 0, 1.1).className}`} style={{ ...fx('flow', 0, 1.1).style, left: 104, top: 60, background: colors.white, color: colors.brand, boxShadow: `inset 0 0 0 1.5px ${colors.brand}`, ['--dx' as string]: `${X + 30 - 104}px`, ['--dy' as string]: '50px' }}>
          <CloudDownload size={13} />
        </span>
      )}
      <At x={X} y={110}>
        <div className="flex flex-col" style={{ width: W, gap: 10 }}>
          <div className="flex" style={{ gap }}>
            {[0, 1, 2].map((i) => {
              const on = i < landed
              return (
                <div key={i} className="flex flex-col" style={{ width: iw, gap: 7, opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(-40px)', transition: `opacity 420ms ${EASE} ${i * 120}ms, transform 620ms cubic-bezier(0.34,1.4,0.64,1) ${i * 120}ms` }}>
                  {[0, 1].map((j) => (
                    <div key={j} className="grid place-items-center rounded-[10px]" style={{ height: 30, background: j === 0 ? LAYER_TOP[i] : STACK.layer, boxShadow: '0 8px 16px -12px rgba(16,32,58,0.55)' }}>
                      <LockGlyph />
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
          <Slab w={W} h={44} fill={STACK.kernel} lit={!STILL && k === 3}>
            <span className="inline-flex items-center gap-2">
              <LockGlyph />
              Shared base layers
            </span>
          </Slab>
        </div>
      </At>
      {/* cost per workload: the coins and the falling graph side by side; the coins fall away as the host packs tighter */}
      <At x={524} y={30} cx>
        <div className="flex items-end gap-3 rounded-[16px] px-3 py-2.5" style={{ background: colors.white, boxShadow: `inset 0 0 0 1.5px ${k >= 2 ? colors.success + '66' : '#E1E8F5'}, 0 10px 20px -14px rgba(16,32,58,0.5)`, opacity: k >= 2 ? 1 : 0.3, transition: `all 420ms ${EASE}` }}>
          <div className="relative h-[52px] w-[32px]">
            {[0, 1, 2].map((i) => (
              <span key={i} aria-hidden className="absolute left-0 grid h-[30px] w-[30px] place-items-center rounded-full" style={{ bottom: i * 11, zIndex: i, background: 'linear-gradient(180deg, #FFD567 0%, #F5A623 100%)', color: '#8A5300', boxShadow: '0 4px 8px -4px rgba(140,80,0,0.6)', opacity: k >= 2 && i > 0 ? 0 : 1, transform: k >= 2 && i > 0 ? 'translateY(16px) scale(0.6)' : 'none', transition: `all 520ms ${EASE} ${i * 140}ms` }}>
                <Coins size={16} />
              </span>
            ))}
          </div>
          <span aria-hidden className={`grid h-[36px] w-[36px] place-items-center rounded-[10px] ${k >= 2 ? fx('hop', 0, 1.4).className : ''}`} style={{ ...(k >= 2 ? fx('hop', 0, 1.4).style : {}), background: '#E7F8EE', color: colors.success }}>
            <TrendingDown size={24} />
          </span>
        </div>
      </At>
      {/* storage: the drum fills by the thin top layers only; the dashed ghost is three full copies */}
      <At x={560} y={170} cx>
        <div className="flex items-end gap-2.5" style={{ opacity: k >= 3 ? 1 : 0.25, transition: `opacity 420ms ${EASE}` }}>
          <span aria-hidden style={{ color: STACK.kernel }}>
            <Database size={34} />
          </span>
          <div className="relative h-[110px] w-[26px] overflow-hidden rounded-[8px]" style={{ background: colors.surface, boxShadow: 'inset 0 0 0 1.5px #CFDCF5' }}>
            <span aria-hidden className="absolute inset-x-0 bottom-0 origin-bottom" style={{ height: '100%', border: `2px dashed ${colors.muted}66`, borderRadius: 8 }} />
            <span aria-hidden className="absolute inset-x-0 bottom-0 origin-bottom" style={{ height: '100%', background: `linear-gradient(180deg, ${STACK.engine} 0%, ${STACK.kernel} 100%)`, transform: `scaleY(${k >= 3 ? 0.42 : 0})`, transition: `transform 900ms ${EASE}` }} />
          </div>
        </div>
      </At>
    </>
  )
}
const LAYER_TOP = [STACK.engine, STACK.guest, STACK.layer]

export function DensityBuys({ lesson }: { lesson: string }) {
  const k = useCycle(5, 1700, 3, 3)
  return (
    <LitFigure
      id="T14-2"
      kicker={'Image Size Density'}
      title={'Packing Workloads Tighter'}
      lesson={lesson}
      lit={k >= 1 && k <= 3 ? k - 1 : -1}
      points={DENSITY_POINTS.map((t, i) => ({ icon: [<Zap key="0" />, <Coins key="1" />, <Database key="2" />][i], text: t }))}
      figure={<SharedBaseScene k={k} />}
      figH={330}
    />
  )
}

/* ================================================================== T15-1 · isolation strength */

/** The height of a host's tile row (the first row of `VmHost` / `ContainerHost`), measured once. */
function useRowH(fallback: number) {
  const ref = useRef<HTMLDivElement>(null)
  const [h, setH] = useState(fallback)
  useLayoutEffect(() => {
    const row = ref.current?.firstElementChild?.firstElementChild as HTMLElement | null | undefined
    if (row) setH(row.offsetHeight)
  }, [])
  return [ref, h] as const
}

/** A dashed boundary drawn around a box when `on`. */
function Boundary({ x, y, w, h, on, tone = colors.brand, delay = 0 }: { x: number; y: number; w: number; h: number; on: boolean; tone?: string; delay?: number }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute rounded-[14px]"
      style={{ left: x, top: y, width: w, height: h, border: `2.5px dashed ${tone}`, opacity: on ? 1 : 0, transform: on ? 'none' : 'scale(1.06)', transition: `all 520ms ${EASE} ${delay}ms` }}
    />
  )
}

/* split (user, 2026-10-28): the VM side with its two points on T15-1, the container side with its two on T15-1b */

const ISO_W = 440
const ISO_GAP = 20
const ISO_CW = (ISO_W - ISO_GAP * 2) / 3
const ISO_X = (634 - ISO_W) / 2

/**
 * THE VMs (slide 49): 1 a boundary draws round each VM, one after another, down to the
 * hardware, a shield on each (the hypervisor enforces it); 2 the middle VM's guest OS
 * crashes: an alert shakes over it and it greys out; 3 its two siblings get their
 * green checks: still running.
 */
function IsolationVmScene({ k }: { k: number }) {
  const [vmRef, vmRow] = useRowH(76)
  const crashed = k >= 2
  return (
    <>
      <At x={317} y={26} cx>
        <span className="inline-flex items-center gap-2">
          <Monitor size={18} color={colors.brandDark} aria-hidden />
          <Head>VMs</Head>
        </span>
      </At>
      <At x={ISO_X} y={104}>
        <div ref={vmRef} className="relative">
          <VmHost w={ISO_W} gap={ISO_GAP} guest="Guest kernel" dim={crashed ? 1 : -1} hypervisor="Hypervisor" />
          {[0, 1, 2].map((i) => (
            <Boundary key={i} x={i * (ISO_CW + ISO_GAP) - 5} y={-7} w={ISO_CW + 10} h={vmRow + 10 + 40 + 10 + 40 + 14} on={k >= 1} delay={i * 160} />
          ))}
          {/* the shield over each boundary: the hypervisor enforcing it */}
          {[0, 1, 2].map((i) => (
            <span key={i} className="absolute" style={{ left: i * (ISO_CW + ISO_GAP) + ISO_CW / 2 - 15, top: -40 }}>
              {i === 1 && crashed ? (
                <span className={`grid h-[32px] w-[32px] place-items-center rounded-full ${fx('shake', 0, 1.4).className}`} style={{ ...fx('shake', 0, 1.4).style, background: '#FDECEC', color: colors.danger, boxShadow: `inset 0 0 0 2px ${colors.danger}` }}>
                  <TriangleAlert size={17} aria-hidden />
                </span>
              ) : k >= 3 ? (
                <Badge on size={30} ring={colors.success}><Check size={16} color={colors.success} strokeWidth={3} /></Badge>
              ) : (
                <Badge on={k >= 1} size={30} style={{ transitionDelay: `${i * 160}ms` }}><ShieldCheck size={16} color={colors.brand} /></Badge>
              )}
            </span>
          ))}
          <Ripple x={ISO_CW + ISO_GAP + ISO_CW / 2} y={vmRow / 2} r={44} on={k === 2} />
          <span aria-hidden className="absolute" style={{ left: ISO_CW / 2 - 9, top: vmRow + 10 + 40 + 10 + 11 }}>
            <Cpu size={18} color={colors.white} />
          </span>
        </div>
      </At>
    </>
  )
}

/**
 * THE CONTAINERS (slide 50): 1 a boundary draws round each container at the process
 * layer, each getting the eye (namespaces: its own view) and the gauge (cgroups: its
 * cap); 2 a bug lands in the ONE shared kernel, which lights and ripples; 3 the alert
 * climbs into every container above it.
 */
function IsolationCtScene({ k }: { k: number }) {
  const [ctRef, ctRow] = useRowH(44)
  return (
    <>
      <At x={317} y={30} cx>
        <span className="inline-flex items-center gap-2">
          <ContainerIco size={18} color={colors.brandDark} aria-hidden />
          <Head>Containers</Head>
        </span>
      </At>
      <At x={ISO_X} y={120}>
        <div ref={ctRef} className="relative">
          <ContainerHost w={ISO_W} gap={ISO_GAP} kernel="Shared kernel" hardware="Hardware" litKernel={k >= 2} />
          {[0, 1, 2].map((i) => (
            <Boundary key={i} x={i * (ISO_CW + ISO_GAP) - 5} y={-7} w={ISO_CW + 10} h={ctRow + 14} on={k >= 1} delay={i * 160} tone={k >= 3 ? colors.danger : colors.brand} />
          ))}
          {[0, 1, 2].map((i) => (
            <span key={i} className="absolute flex gap-1.5" style={{ left: i * (ISO_CW + ISO_GAP) + ISO_CW / 2 - 31, top: -44 }}>
              {k >= 3 ? (
                <span className={`mx-auto grid h-[30px] w-[30px] place-items-center rounded-full ${fx('shake', i * 0.2, 1.4).className}`} style={{ ...fx('shake', i * 0.2, 1.4).style, marginLeft: 16, background: '#FDECEC', color: colors.danger, boxShadow: `inset 0 0 0 2px ${colors.danger}` }}>
                  <TriangleAlert size={16} aria-hidden />
                </span>
              ) : (
                <>
                  <Badge on={k >= 1} size={30} style={{ transitionDelay: `${i * 160}ms` }}><Eye size={16} color={colors.brand} /></Badge>
                  <Badge on={k >= 1} size={30} ring={colors.accent} style={{ transitionDelay: `${i * 160 + 80}ms` }}>
                    <NeedleGauge size={16} delay={i * 0.3} />
                  </Badge>
                </>
              )}
            </span>
          ))}
          {/* the bug in the one shared kernel */}
          <span className="absolute" style={{ left: ISO_W - 34, top: ctRow + 10 + 4 }}>
            <Badge on={k >= 2} size={32} tone="#FDECEC" ring={colors.danger}>
              <span className={k >= 2 ? fx('shake', 0, 1.2).className : ''} style={{ ...(k >= 2 ? fx('shake', 0, 1.2).style : {}), display: 'grid' }}><Bug size={17} color={colors.danger} /></span>
            </Badge>
          </span>
          <Ripple x={ISO_W - 18} y={ctRow + 10 + 20} r={40} on={k >= 2} />
        </div>
      </At>
    </>
  )
}

export function Isolation({ lesson }: { lesson: string }) {
  const k = useCycle(5, 1700, 3, 3)
  return (
    <LitFigure
      id="T15-1"
      kicker={'Isolation Strength Compared'}
      title={'Kernel Versus Hardware'}
      lead={'A virtual machine isolates at the hardware boundary with its own kernel; a container isolates at the process boundary on one shared kernel'}
      lesson={lesson}
      lit={k === 1 ? 0 : k >= 2 && k <= 3 ? 1 : -1}
      points={[
        { icon: <ShieldCheck />, text: 'VM: separate guest kernel per instance, hypervisor enforces the boundary' },
        { icon: <TriangleAlert />, text: 'VM: A guest OS crash usually does not affect sibling VMs' },
      ]}
      figure={<IsolationVmScene k={k} />}
      figH={330}
    />
  )
}

export function Isolation2({ lesson }: { lesson: string }) {
  const k = useCycle(5, 1700, 3, 3)
  return (
    <LitFigure
      id="T15-1b"
      kicker={'Isolation Strength Compared'}
      title={'Kernel Versus Hardware'}
      lesson={lesson}
      lit={k === 1 ? 0 : k >= 2 && k <= 3 ? 1 : -1}
      points={[
        { icon: <Eye />, text: 'Container: namespaces separate the view, cgroups cap the resources' },
        { icon: <Bug />, text: 'Shared kernel means one kernel vulnerability can reach every container' },
      ]}
      figure={<IsolationCtScene k={k} />}
      figH={320}
    />
  )
}

/* ================================================================== T16-1 · blast radius */

/** A blast-radius circle, centred on (cx, cy), radius r in stage pixels (both circles share the scale). */
function Blast({ cx, cy, r, on }: { cx: number; cy: number; r: number; on: boolean }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute rounded-full"
      style={{
        left: cx - r,
        top: cy - r,
        width: r * 2,
        height: r * 2,
        background: `${colors.danger}14`,
        border: `2.5px dashed ${colors.danger}`,
        opacity: on ? 1 : 0,
        transform: on ? 'scale(1)' : 'scale(0.2)',
        transition: `all 700ms ${EASE}`,
      }}
    />
  )
}

/** A bug that has broken out: shaking, in a red disc. */
function Breakout({ on, size = 32 }: { on: boolean; size?: number }) {
  return (
    <Badge on={on} size={size} tone="#FDECEC" ring={colors.danger}>
      <span className={on ? fx('shake', 0, 1.2).className : ''} style={{ ...(on ? fx('shake', 0, 1.2).style : {}), display: 'grid' }}>
        <Bug size={size * 0.55} color={colors.danger} />
      </span>
    </Badge>
  )
}

/**
 * SLIDE 51: 1 a bug breaks out of VM 2 and its blast ripples out, stopped by the
 * hypervisor at a small circle round that one VM; 2 a bug breaks out through the
 * shared kernel and its blast ripples over the whole container host; 3 the shields
 * of seccomp, SELinux and non-root users rise round the container host (point 2's
 * mitigation). Both circles at one scale, so their sizes compare.
 */
function BlastScene({ figW, k }: { figW: number; k: number }) {
  const VW = 270
  const CW = 250
  const gap = 10
  const vcw = (VW - gap * 2) / 3
  const [vmRef, vmRow] = useRowH(76)
  const [ctRef, ctRow] = useRowH(44)
  const vx = 14
  const vy = 128
  const cy0 = 124
  const ctH = ctRow + 50 + 50
  const sR = Math.ceil(Math.hypot(vcw / 2, vmRow / 2)) + 6
  const lR = Math.ceil(Math.hypot(CW / 2, ctH / 2)) + 8
  const cx0 = figW - 14 - lR - CW / 2
  const vmC: [number, number] = [vx + vcw + gap + vcw / 2, vy + vmRow / 2]
  const ctC: [number, number] = [cx0 + CW / 2, cy0 + ctH / 2]
  return (
    <>
      <At x={vx + VW / 2} y={20} cx>
        <span className="inline-flex items-center gap-2"><Monitor size={18} color={colors.brandDark} aria-hidden /><Head>VMs</Head></span>
      </At>
      <At x={cx0 + CW / 2} y={20} cx>
        <span className="inline-flex items-center gap-2"><ContainerIco size={18} color={colors.brandDark} aria-hidden /><Head>Containers</Head></span>
      </At>
      <Blast cx={vmC[0]} cy={vmC[1]} r={sR} on={k >= 1} />
      <Blast cx={ctC[0]} cy={ctC[1]} r={lR} on={k >= 2} />
      <Ripple x={vmC[0]} y={vmC[1]} r={sR} on={k === 1} />
      <Ripple x={ctC[0]} y={ctC[1]} r={lR * 0.8} on={k === 2} />
      <At x={vx} y={vy}>
        <div ref={vmRef}>
          <VmHost w={VW} gap={gap} lit={k >= 1 ? 1 : -1} />
        </div>
      </At>
      <At x={cx0} y={cy0}>
        <div ref={ctRef}>
          <ContainerHost w={CW} gap={8} kernel="Shared kernel" hardware="Hardware" litKernel={k >= 2} />
        </div>
      </At>
      <At x={vmC[0] + vcw / 2 - 2} y={vy - 14} cx>
        <Breakout on={k >= 1} size={28} />
      </At>
      <At x={cx0 + CW - 10} y={cy0 + ctRow + 12} cx>
        <Breakout on={k >= 2} size={28} />
      </At>
      <At x={vmC[0]} y={vmC[1] - sR - 34} cx>
        <div style={{ opacity: k >= 1 ? 1 : 0, transition: `opacity 420ms ${EASE}` }}>
          <Label tone="bad" strong size={15}>blast radius</Label>
        </div>
      </At>
      <At x={ctC[0]} y={ctC[1] + lR - 40} cx>
        <div style={{ opacity: k >= 2 ? 1 : 0, transition: `opacity 420ms ${EASE}` }}>
          <Label tone="bad" strong size={15}>blast radius</Label>
        </div>
      </At>
      {/* the mitigations: three shields rise round the container host */}
      {[-1, 0, 1].map((d, i) => (
        <At key={d} x={ctC[0] + d * 62} y={cy0 - 30} cx>
          <Badge on={k >= 3} size={30} ring={colors.success} style={{ transitionDelay: `${i * 140}ms` }}>
            <ShieldCheck size={16} color={colors.success} />
          </Badge>
        </At>
      ))}
    </>
  )
}

export function BlastRadius({ lesson }: { lesson: string }) {
  const pointsW = 452
  const figW = BOX_W - pointsW - 24
  const k = useCycle(5, 2000, 3, 3)
  return (
    <LitFigure
      id="T16-1"
      kicker={'Security Trade-offs'}
      title={'Blast Radius Differs'}
      lead={'Stronger isolation does not mean fewer attacks; it changes how far a successful attack can spread once the boundary is crossed'}
      lesson={lesson}
      pointsW={pointsW}
      lit={k === 1 ? 0 : k >= 2 && k <= 3 ? 1 : -1}
      points={[
        { icon: <Monitor />, text: 'VM breakout may exploit a hypervisor vulnerability and can affect isolation between VMs' },
        { icon: <ShieldCheck />, text: 'Container breakout exploits the shared kernel: mitigated by seccomp, SELinux, non-root users' },
      ]}
      figure={<BlastScene figW={figW} k={k} />}
      figH={364}
    />
  )
}

/**
 * T16-1b (slide 52): the same two hosts, each under the workload its point gives it.
 * 1 the VMs take untrusted, multi-tenant code: each VM gets a different tenant, a
 * lock on each, the hypervisor's shield; 2 the containers take trusted internal
 * services: a check on each and a rocket for their speed, the packed row for density.
 */
function VerdictScene({ k }: { k: number }) {
  const W = 270
  const TENANT = ['#E5732A', '#2D63FB', '#16A34A']
  return (
    <>
      <At x={20 + W / 2} y={22} cx>
        <Label tone={STILL || k === 1 ? 'solid' : 'brand'} strong size={15}>Untrusted or multi-tenant code</Label>
      </At>
      <At x={634 - 20 - W / 2} y={22} cx>
        <Label tone={STILL || k === 2 ? 'solid' : 'brand'} strong size={15}>Trusted internal services</Label>
      </At>
      <At x={20 + W / 2} y={58} cx>
        <span className="inline-flex items-center gap-2"><Monitor size={18} color={colors.brandDark} aria-hidden /><Head>VMs</Head></span>
      </At>
      <At x={634 - 20 - W / 2} y={58} cx>
        <span className="inline-flex items-center gap-2"><ContainerIco size={18} color={colors.brandDark} aria-hidden /><Head>Containers</Head></span>
      </At>
      <At x={20} y={136}>
        <VmHost
          w={W}
          gap={10}
          top={(i) => (
            <div className="flex items-center justify-center gap-1" style={{ height: 22 }}>
              <span aria-hidden style={{ color: TENANT[i], opacity: k >= 1 ? 1 : 0, transform: k >= 1 ? 'none' : 'translateY(-6px)', transition: `all 420ms ${EASE} ${i * 120}ms` }}>
                <User size={17} strokeWidth={2.4} />
              </span>
              <span aria-hidden style={{ color: colors.brandDark, opacity: k >= 1 ? 1 : 0, transition: `opacity 420ms ${EASE} ${i * 120 + 200}ms` }}>
                <Lock size={14} strokeWidth={2.4} />
              </span>
            </div>
          )}
        />
      </At>
      <At x={634 - 20 - W} y={136}>
        <ContainerHost
          w={W}
          gap={10}
          kernel="Shared kernel"
          hardware="Hardware"
          top={(i) => (
            <div className="flex items-center justify-center" style={{ height: 22 }}>
              <Badge on={k >= 2} size={22} ring={colors.success} style={{ transitionDelay: `${i * 120}ms` }}><Check size={13} color={colors.success} strokeWidth={3} /></Badge>
            </div>
          )}
        />
      </At>
      <At x={634 - 20 - W / 2} y={94} cx>
        <span aria-hidden className={k >= 2 ? fx('hop', 0, 1.2).className : ''} style={{ ...(k >= 2 ? fx('hop', 0, 1.2).style : {}), display: 'grid', color: colors.accent, opacity: k >= 2 ? 1 : 0, transition: 'opacity 400ms' }}>
          <Rocket size={22} />
        </span>
      </At>
      <At x={20 + W / 2} y={92} cx>
        <Badge on={k >= 1} size={30}><ShieldCheck size={16} color={colors.brand} /></Badge>
      </At>
    </>
  )
}

export function BlastRadius2({ lesson }: { lesson: string }) {
  const k = useCycle(4, 2000, 2, 2)
  return (
    <LitFigure
      id="T16-1b"
      kicker={'Security Trade-offs'}
      title={'Blast Radius Differs'}
      lesson={lesson}
      lit={k === 1 ? 0 : k === 2 ? 1 : -1}
      points={[
        { icon: <Lock />, text: 'Untrusted or multi-tenant code favours VM-grade isolation' },
        { icon: <Rocket />, text: 'Trusted internal services accept container isolation for speed and density' },
      ]}
      figure={<VerdictScene k={k} />}
      figH={372}
    />
  )
}

/** This section's own keyframes (corrections pass 2026-11-03), appended to the deck's CSS by cvDeck.tsx. */
export const COMPARE_CSS = ``
