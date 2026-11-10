import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { DataTable } from '@/ui'
import { At, BOX_W, Card, Label, STILL, useCycle, useLoop, Arrow } from '../scene'
import { lead, Points, PointsFigure } from '../iso/frames'
import { ContainerHost, LockGlyph, Slab, STACK, Tile, VmHost } from './frames'

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

function TwoStacksDiagram() {
  const k = useCycle(3, 2400, 2)
  const PW = 535
  const pad = 22
  const inner = PW - pad * 2
  const apps = ['App A', 'App B', 'App C', 'App D', 'App E', 'App F']
  const ag = 10
  const aw = (inner - ag * 5) / 6
  const vg = 14
  const vw = (inner - vg * 2) / 3
  const panel = (children: ReactNode) => (
    <Tile w={PW} h={TS_H} style={{ padding: pad, borderRadius: 20 }}>
      {children}
    </Tile>
  )
  const block = (text: string, fill: string, h: number, lit = false) => (
    <div style={{ borderRadius: 14, boxShadow: lit ? `0 0 0 3px ${colors.accent}` : undefined, transition: `box-shadow 420ms ${EASE}` }}>
      <Slab w={inner} h={h} fill={fill}>
        {text}
      </Slab>
    </div>
  )
  return (
    <div className="flex justify-between" style={{ width: TS_W }}>
      {panel(
        <div className="flex h-full flex-col" style={{ gap: 10 }}>
          <div className="text-center font-heading text-[18px] font-semibold" style={{ color: colors.ink, height: 26 }}>
            Containerized Applications
          </div>
          <div className="flex flex-1" style={{ gap: ag }}>
            {apps.map((a) => (
              <div key={a} className="grid place-items-center rounded-[12px] font-heading text-[16px] font-semibold" style={{ width: aw, background: STACK.layer, color: colors.white, boxShadow: '0 8px 16px -12px rgba(16,32,58,0.55)' }}>
                {a}
              </div>
            ))}
          </div>
          {block('Docker', STACK.engine, 42)}
          {block('Host Operating System', STACK.kernel, 42, k === 0)}
          {block('Infrastructure', STACK.hardware, 42)}
        </div>,
      )}
      {panel(
        <div className="flex h-full flex-col" style={{ gap: 10 }}>
          <div className="flex flex-1" style={{ gap: vg }}>
            {['App A', 'App B', 'App C'].map((a) => (
              <div key={a} className="flex flex-col overflow-hidden rounded-[14px]" style={{ width: vw, boxShadow: `inset 0 0 0 2px ${colors.brandDark}33, 0 8px 16px -12px rgba(16,32,58,0.5)`, background: colors.white }}>
                <div className="grid place-items-center font-heading text-[16px] font-bold" style={{ height: 44, color: colors.ink }}>
                  Virtual Machine
                </div>
                <div className="grid place-items-center font-heading text-[16px] font-semibold" style={{ height: 44, background: STACK.layer, color: colors.white }}>
                  {a}
                </div>
                <div
                  className="grid flex-1 place-items-center px-2 text-center font-heading text-[16px] font-semibold leading-snug"
                  style={{ background: k === 1 ? '#FFF1D6' : '#E3ECFD', color: colors.ink, boxShadow: k === 1 ? `inset 0 0 0 3px ${colors.accent}` : undefined, transition: `all 420ms ${EASE}` }}
                >
                  Guest Operating System
                </div>
              </div>
            ))}
          </div>
          {block('Hypervisor', STACK.hypervisor, 48)}
          {block('Infrastructure', STACK.hardware, 48)}
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

export function TwoStacksPoints({ lesson }: { lesson: string }) {
  return (
    <Card id="T12-1b" kicker={'Four Comparison Dimensions'} title={'Boot Memory Size Security'} lesson={lesson}>
      <div style={{ width: BOX_W }}>
        <Points
          width={820}
          items={[
            'Boot time: how quickly each starts and becomes usable',
            'Memory footprint: RAM consumed per workload at idle',
            'Image size and density: how many instances fit per host',
            'Isolation strength: kernel-level sharing versus hardware-level separation',
            'Security trade-offs: what fails if the boundary is breached',
          ]}
        />
      </div>
    </Card>
  )
}

/* ================================================================== T13-1 · boot time and memory */

/**
 * A pair of horizontal bars, VM and container, in the TR's proportion (tens
 * of seconds against under a few; hundreds of MB to GB against a few to tens
 * of MB). No numbers: the table carries the words. `g` is the grow phase.
 */
function BarPair({ title, vm, ct, g, w }: { title: string; vm: number; ct: number; g: number; w: number }) {
  const labW = 150
  const track = w - labW - 40
  const bar = (frac: number, fill: string) => (
    <span className="block rounded-full" style={{ height: 22, width: Math.max(6, track * frac * g), background: fill, boxShadow: '0 6px 12px -8px rgba(16,32,58,0.5)' }} />
  )
  return (
    <Tile w={w} style={{ padding: '12px 20px' }}>
      <div className="mb-2 font-heading text-[16px] font-semibold" style={{ color: colors.ink }}>
        {title}
      </div>
      <div className="flex flex-col gap-2.5">
        {[
          ['Virtual Machine', vm, STACK.hypervisor],
          ['Container', ct, STACK.engine],
        ].map(([name, frac, fill]) => (
          <div key={name as string} className="flex items-center gap-3">
            <span className="shrink-0 text-[15px] font-medium" style={{ width: labW, color: colors.muted }}>
              {name}
            </span>
            {bar(frac as number, fill as string)}
          </div>
        ))}
      </div>
    </Tile>
  )
}

export function BootMemory({ lesson }: { lesson: string }) {
  const t = useLoop(5200, { mode: 'sawtooth', still: 1 })
  /* grow over the first 45% of the lap, hold, then a quick fall at the end */
  const g = t < 0.45 ? 1 - Math.pow(1 - t / 0.45, 3) : t > 0.92 && t < 1 ? 1 - (t - 0.92) / 0.08 : 1
  const half = (BOX_W - 24) / 2
  return (
    <Card id="T13-1" kicker={'Boot Time And Memory'} title={'Startup Speed Compared'} lead={lead('Starting a virtual machine boots a full guest operating system; starting a container launches one process on a kernel already running')} lesson={lesson}>
      <div className="flex flex-col gap-4" style={{ width: BOX_W }}>
        <DataTable
          compact
          columns={[{ label: 'Metric', weight: 0.8 }, { label: 'Virtual Machine' }, { label: 'Container' }]}
          rows={[
            ['Boot time', 'Tens of seconds (full OS boot)', 'Under a few seconds (process start)'],
            ['Memory footprint (idle)', 'Several hundred MB to a few GB (guest OS overhead)', 'A few MB to tens of MB (app plus runtime)'],
          ]}
        />
        <div className="flex" style={{ gap: 24 }}>
          <BarPair title="Boot time" vm={1} ct={0.09} g={g} w={half} />
          <BarPair title="Memory footprint (idle)" vm={1} ct={0.05} g={g} w={half} />
        </div>
      </div>
    </Card>
  )
}

/* ================================================================== T13-2 · why the gap */

const STEPS = ['bootloader', 'kernel init', 'service startup', 'application process']

/**
 * The VM walks bootloader, kernel init and service startup before the
 * application process; the container goes straight to it. One clock: the
 * container reaches its process on the first step, the VM on the fourth.
 */
function GapScene() {
  const k = useCycle(6, 1300, 5)
  const colW = 250
  const rowH = 62
  const top = 70
  const xVm = 50
  const xCt = 50 + colW + 70
  const chip = (text: string, on: boolean, app: boolean) => (
    <div
      className="grid place-items-center rounded-[12px] font-heading text-[16px] font-semibold"
      style={{
        width: colW,
        height: 44,
        background: on ? (app ? colors.brand : '#E3ECFD') : colors.white,
        color: on && app ? colors.white : colors.ink,
        boxShadow: `inset 0 0 0 1.5px ${on ? colors.brand : '#CFDCF5'}, 0 8px 16px -12px rgba(16,32,58,0.5)`,
        transition: `all 420ms ${EASE}`,
      }}
    >
      {text}
    </div>
  )
  return (
    <>
      <At x={xVm + colW / 2} y={24} cx>
        <Head>VM</Head>
      </At>
      <At x={xCt + colW / 2} y={24} cx>
        <Head>Container</Head>
      </At>
      {STEPS.map((s, i) => (
        <At key={s} x={xVm} y={top + i * rowH}>
          {chip(s, k > i, i === 3)}
        </At>
      ))}
      {STEPS.slice(0, 3).map((s, i) => (
        <Arrow key={s} x1={xVm + colW / 2} y1={top + i * rowH + 46} x2={xVm + colW / 2} y2={top + (i + 1) * rowH - 2} on={k > i + 1} />
      ))}
      <Arrow x1={xCt + colW / 2} y1={top} x2={xCt + colW / 2} y2={top + 3 * rowH - 2} on={k > 0} />
      <At x={xCt} y={top + 3 * rowH}>
        {chip('application process', k > 0, true)}
      </At>
    </>
  )
}

export function WhyGap({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="T13-2"
      kicker={'Boot Time And Memory'}
      title={'Startup Speed Compared'}
      lesson={lesson}
      pointsW={420}
      points={[
        'Cause: VM repeats bootloader, kernel init and service startup',
        'Container skips straight to launching the application process',
        'Lower per-instance memory lets more workloads run concurrently',
      ]}
      figure={<GapScene />}
      figH={340}
    />
  )
}

/* ================================================================== T14-1 · image size and density */

/** One host square packed with blocks: `n` per side, `shown` placed so far. */
function HostGrid({ side, n, shown, fill, label }: { side: number; n: number; shown: number; fill: string; label: string }) {
  const pad = 10
  const gap = n > 3 ? 4 : 8
  const cell = (side - pad * 2 - gap * (n - 1)) / n
  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="relative rounded-[16px]" style={{ width: side, height: side, background: '#F3F6FC', boxShadow: `inset 0 0 0 2px ${STACK.hardware}` }}>
        {Array.from({ length: n * n }, (_, i) => {
          const r = Math.floor(i / n)
          const c = i % n
          const on = i < shown
          return (
            <span
              key={i}
              className="absolute"
              style={{
                left: pad + c * (cell + gap),
                top: pad + r * (cell + gap),
                width: cell,
                height: cell,
                borderRadius: n > 3 ? 4 : 10,
                background: fill,
                opacity: on ? 1 : 0,
                transform: on ? 'none' : 'scale(0.6)',
                transition: `all 320ms ${EASE}`,
              }}
            />
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
  const t = useLoop(6400, { mode: 'sawtooth', still: 1 })
  const fill = Math.min(1, t / 0.7)
  return (
    <Card id="T14-1" kicker={'Image Size Density'} title={'Packing Workloads Tighter'} lead={lead('Containers fit more workloads per host by sharing the host kernel and avoiding separate guest operating systems')} lesson={lesson}>
      <div className="flex flex-col items-center gap-4" style={{ width: BOX_W }}>
        <div style={{ width: BOX_W }}>
          <DataTable
            compact
            columns={[{ label: 'Metric', weight: 0.8 }, { label: 'Virtual Machine' }, { label: 'Container' }]}
            rows={[
              ['Image size', 'Several GB (full guest OS plus app)', 'Tens of MB to a few hundred MB (app layers only)'],
              ['Typical density per host', 'Tens of VMs', 'Hundreds of containers'],
            ]}
          />
        </div>
        <div className="flex items-start" style={{ gap: 90 }}>
          <HostGrid side={150} n={2} shown={Math.ceil(fill * 4)} fill={STACK.hypervisor} label="Tens of VMs" />
          <HostGrid side={150} n={8} shown={Math.ceil(fill * 64)} fill={STACK.engine} label="Hundreds of containers" />
        </div>
      </div>
    </Card>
  )
}

/* ================================================================== T14-2 · what density buys */

/**
 * Point 3's picture: three container images, each its own small top layer,
 * standing on ONE shared base layer that is stored once. The images arrive
 * one by one; the base never grows.
 */
function SharedBaseScene() {
  const k = useCycle(5, 1600, 4)
  const W = 520
  const iw = 150
  const gap = (W - iw * 3) / 2
  return (
    <>
      <At x={57 + W / 2} y={44} cx>
        <Head>container images</Head>
      </At>
      <At x={57} y={110}>
        <div className="flex flex-col" style={{ width: W, gap: 12 }}>
          <div className="flex" style={{ gap }}>
            {[0, 1, 2].map((i) => {
              const on = k > i
              return (
                <div key={i} className="flex flex-col" style={{ width: iw, gap: 8, opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(-14px)', transition: `all 520ms ${EASE}` }}>
                  {[0, 1].map((j) => (
                    <div key={j} className="grid place-items-center rounded-[12px]" style={{ height: 34, background: j === 0 ? LAYER_TOP[i] : STACK.layer, boxShadow: '0 8px 16px -12px rgba(16,32,58,0.55)' }}>
                      <LockGlyph />
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
          <Slab w={W} h={46} fill={STACK.kernel}>
            <span className="inline-flex items-center gap-2">
              <LockGlyph />
              Shared base layers
            </span>
          </Slab>
        </div>
      </At>
    </>
  )
}
const LAYER_TOP = [STACK.engine, STACK.guest, STACK.layer]

export function DensityBuys({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="T14-2"
      kicker={'Image Size Density'}
      title={'Packing Workloads Tighter'}
      lesson={lesson}
      points={[
        'Smaller images pull and deploy faster across a cluster',
        'Higher density lowers infrastructure cost per workload on identical hardware',
        'Shared base layers cut total storage across many container images',
      ]}
      figure={<SharedBaseScene />}
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
function Boundary({ x, y, w, h, on, tone = colors.brand }: { x: number; y: number; w: number; h: number; on: boolean; tone?: string }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute rounded-[14px]"
      style={{ left: x, top: y, width: w, height: h, border: `2.5px dashed ${tone}`, opacity: on ? 1 : 0, transform: on ? 'none' : 'scale(1.06)', transition: `all 520ms ${EASE}` }}
    />
  )
}


/* split (user, 2026-10-28): the VM side with its two points on T15-1, the container side with its two on T15-1b */

const ISO_W = 440
const ISO_GAP = 20
const ISO_CW = (ISO_W - ISO_GAP * 2) / 3
const ISO_X = (634 - ISO_W) / 2

/** The VMs: a boundary around each, down to the hardware; then one VM crossed out while its siblings stay. */
function IsolationVmScene() {
  const k = useCycle(3, 2400, 2)
  const [vmRef, vmRow] = useRowH(76)
  const crossed = k >= 2
  return (
    <>
      <At x={317} y={30} cx>
        <Head>VMs</Head>
      </At>
      <At x={ISO_X} y={86}>
        <div ref={vmRef} className="relative">
          <VmHost w={ISO_W} gap={ISO_GAP} guest="Guest kernel" dim={crossed ? 1 : -1} />
          {[0, 1, 2].map((i) => (
            <Boundary key={i} x={i * (ISO_CW + ISO_GAP) - 5} y={-7} w={ISO_CW + 10} h={vmRow + 10 + 40 + 10 + 40 + 14} on={k >= 1} />
          ))}
          <span
            aria-hidden
            className="pointer-events-none absolute"
            style={{ left: ISO_CW + ISO_GAP + ISO_CW / 2 - 30, top: vmRow / 2 - 30, width: 60, height: 60, opacity: crossed ? 1 : 0, transform: crossed ? 'none' : 'scale(0.5)', transition: `all 420ms ${EASE}` }}
          >
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
              <path d="M10 10L50 50M50 10L10 50" stroke={colors.danger} strokeWidth="6" strokeLinecap="round" />
            </svg>
          </span>
        </div>
      </At>
    </>
  )
}

/** The containers: a boundary around each at the process layer, the ONE shared kernel line beneath all, then that line lit. */
function IsolationCtScene() {
  const k = useCycle(3, 2400, 2)
  const [ctRef, ctRow] = useRowH(44)
  return (
    <>
      <At x={317} y={40} cx>
        <Head>Containers</Head>
      </At>
      <At x={ISO_X} y={100}>
        <div ref={ctRef} className="relative">
          <ContainerHost w={ISO_W} gap={ISO_GAP} kernel="Shared kernel" hardware="Hardware" litKernel={k >= 2} />
          {[0, 1, 2].map((i) => (
            <Boundary key={i} x={i * (ISO_CW + ISO_GAP) - 5} y={-7} w={ISO_CW + 10} h={ctRow + 14} on={k >= 1} />
          ))}
        </div>
      </At>
    </>
  )
}

export function Isolation({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="T15-1"
      kicker={'Isolation Strength Compared'}
      title={'Kernel Versus Hardware'}
      lead={'A virtual machine isolates at the hardware boundary with its own kernel; a container isolates at the process boundary on one shared kernel'}
      lesson={lesson}
      points={['VM: separate guest kernel per instance, hypervisor enforces the boundary', 'VM: A guest OS crash usually does not affect sibling VMs']}
      figure={<IsolationVmScene />}
      figH={330}
    />
  )
}

export function Isolation2({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="T15-1b"
      kicker={'Isolation Strength Compared'}
      title={'Kernel Versus Hardware'}
      lesson={lesson}
      points={['Container: namespaces separate the view, cgroups cap the resources', 'Shared kernel means one kernel vulnerability can reach every container']}
      figure={<IsolationCtScene />}
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

function BlastScene({ figW }: { figW: number }) {
  /* 0 two hosts; 1 a small circle round one VM; 2 a large circle round the whole container host */
  const k = useCycle(4, 2200, 3)
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
  /* small: round VM 2's tile; large: round the whole container host */
  const sR = Math.ceil(Math.hypot(vcw / 2, vmRow / 2)) + 6
  const lR = Math.ceil(Math.hypot(CW / 2, ctH / 2)) + 8
  const cx0 = figW - 14 - lR - CW / 2
  return (
    <>
      <At x={vx + VW / 2} y={20} cx>
        <Head>VMs</Head>
      </At>
      <At x={cx0 + CW / 2} y={20} cx>
        <Head>Containers</Head>
      </At>
      <Blast cx={vx + vcw + gap + vcw / 2} cy={vy + vmRow / 2} r={sR} on={k >= 1} />
      <Blast cx={cx0 + CW / 2} cy={cy0 + ctH / 2} r={lR} on={k >= 2} />
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
      <At x={vx + vcw + gap + vcw / 2} y={vy + vmRow / 2 - sR - 34} cx>
        <div style={{ opacity: k >= 1 ? 1 : 0, transition: `opacity 420ms ${EASE}` }}>
          <Label tone="bad" strong size={15}>blast radius</Label>
        </div>
      </At>
      <At x={cx0 + CW / 2} y={cy0 + ctH / 2 + lR - 40} cx>
        <div style={{ opacity: k >= 2 ? 1 : 0, transition: `opacity 420ms ${EASE}` }}>
          <Label tone="bad" strong size={15}>blast radius</Label>
        </div>
      </At>
    </>
  )
}

export function BlastRadius({ lesson }: { lesson: string }) {
  const pointsW = 452
  const figW = BOX_W - pointsW - 24
  return (
    <PointsFigure
      id="T16-1"
      kicker={'Security Trade-offs'}
      title={'Blast Radius Differs'}
      lead={'Stronger isolation does not mean fewer attacks; it changes how far a successful attack can spread once the boundary is crossed'}
      lesson={lesson}
      pointsW={pointsW}
      points={[
        'VM breakout may exploit a hypervisor vulnerability and can affect isolation between VMs',
        'Container breakout exploits the shared kernel: mitigated by seccomp, SELinux, non-root users',
      ]}
      figure={<BlastScene figW={figW} />}
      figH={364}
    />
  )
}


/**
 * T16-1b: the same two hosts, each under the workload its point gives it
 * (the points' own words): untrusted or multi-tenant code on the VMs, trusted
 * internal services on the containers. The loop lights one label, then the other.
 */
function VerdictScene() {
  const k = useCycle(2, 2400, 0)
  const still = STILL
  const W = 270
  return (
    <>
      <At x={20 + W / 2} y={36} cx>
        <Label tone={still || k === 0 ? 'solid' : 'brand'} strong size={15}>Untrusted or multi-tenant code</Label>
      </At>
      <At x={634 - 20 - W / 2} y={36} cx>
        <Label tone={still || k === 1 ? 'solid' : 'brand'} strong size={15}>Trusted internal services</Label>
      </At>
      <At x={20 + W / 2} y={82} cx>
        <Head>VMs</Head>
      </At>
      <At x={634 - 20 - W / 2} y={82} cx>
        <Head>Containers</Head>
      </At>
      <At x={20} y={124}>
        <VmHost w={W} gap={10} />
      </At>
      <At x={634 - 20 - W} y={124}>
        <ContainerHost w={W} gap={10} kernel="Shared kernel" hardware="Hardware" />
      </At>
    </>
  )
}

export function BlastRadius2({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="T16-1b"
      kicker={'Security Trade-offs'}
      title={'Blast Radius Differs'}
      lesson={lesson}
      points={['Untrusted or multi-tenant code favours VM-grade isolation', 'Trusted internal services accept container isolation for speed and density']}
      figure={<VerdictScene />}
      figH={340}
    />
  )
}

