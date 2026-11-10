import { useId, type CSSProperties, type ReactNode } from 'react'
import { Cpu, HardDrive, MemoryStick, Network as NetworkIcon, Server as ServerIcon } from 'lucide-react'
import { colors } from '@/design/tokens'
import { DataTable } from '@/ui'
import { Arrow, At, BOX_W, Card, Label, Stage, useCycle, useLoop } from '../scene'
import { ClayBar, ClayMonitor, ClayOsWindow, ClayServerUnit, Icon3D, LAB, RichCloud } from '../d3/kit'
import { TILE_SKIN } from '../card'
import { PointsFigure, lead } from '../iso/frames'
import { Logo } from './frames'

/**
 * SECTION 1 · VIRTUALIZATION BASICS, first half (reference frames 6 to 10).
 *
 * Session 2's current style (session 1's 3D finish): library renders and clay
 * objects on soft shadows, layers as raised rounded chips (brand blue for the
 * hypervisor, brandDeep for hardware), labels as HTML. Each figure runs one
 * loop whose motion is the slide's claim: one physical server feeds five
 * kinds of virtual resource in turn (6), utilization rises once VMs share the
 * host (7), user requests reach the VMs of one server over the internet (8),
 * one VM is opened up layer by layer (9), four disks pour into one volume that
 * the application reads (10). Every string is the reference's.
 */

const EASE = 'cubic-bezier(0.22,1,0.36,1)'
const ease = (ms = 420) => `all ${ms}ms ${EASE}`

/** 0 before a, 1 after b, eased between. */
function within(t: number, a: number, b: number) {
  if (t <= a) return 0
  if (t >= b) return 1
  const x = (t - a) / (b - a)
  return x * x * (3 - 2 * x)
}

/** A packet on a polyline at phase `u` (0..1): moved by transform only, fading at both ends. */
const MOVING_DOTS = false

function Pkt({ path, u, tone = colors.brand, size = 12 }: { path: [number, number][]; u: number; tone?: string; size?: number }) {
  /* moving dots off deck-wide (user, 2026-10-28: "remove the moving dots") */
  if (!MOVING_DOTS) return null
  const segs = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1]))
  const total = segs.reduce((a, b) => a + b, 0) || 1
  let d = Math.max(0, Math.min(1, u)) * total
  let x = path[0][0]
  let y = path[0][1]
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const k = segs[i] ? Math.min(1, d / segs[i]) : 0
      x = path[i][0] + (path[i + 1][0] - path[i][0]) * k
      y = path[i][1] + (path[i + 1][1] - path[i][1]) * k
      break
    }
    d -= segs[i]
  }
  const fade = u <= 0 || u >= 1 ? 0 : Math.max(0, Math.min(1, u * 8, (1 - u) * 8))
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 rounded-full"
      style={{ width: size, height: size, background: tone, boxShadow: `0 0 0 4px ${tone}40`, transform: `translate(${x - size / 2}px, ${y - size / 2}px)`, opacity: fade }}
    />
  )
}

/** A raised rounded chip: `plain` white, `soft` pale blue, `dark` hardware navy; `lit` rings it in brand blue. */
function Chip({ children, tone = 'plain', lit = false, h, w, style, className = '' }: { children?: ReactNode; tone?: 'plain' | 'soft' | 'dark'; lit?: boolean; h: number; w: number | string; style?: CSSProperties; className?: string }) {
  const skin: CSSProperties =
    tone === 'dark'
      ? { background: 'linear-gradient(180deg, #123A68 0%, #00254B 100%)', color: colors.white, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 10px 20px -12px rgba(0,37,75,0.6)' }
      : tone === 'soft'
        ? { background: 'linear-gradient(180deg, #EEF3FE 0%, #DCE6FB 100%)', color: colors.ink, boxShadow: 'inset 0 0 0 1px #C3D3F0, inset 0 1px 0 #FFFFFF, 0 8px 16px -12px rgba(31,64,140,0.4)' }
        : { ...TILE_SKIN, color: colors.ink }
  const ring = lit ? { boxShadow: `inset 0 0 0 2px ${colors.brand}, inset 0 1px 0 #FFFFFF, 0 12px 22px -12px rgba(45,99,251,0.55)` } : {}
  return (
    <div className={`flex items-center justify-center gap-2 rounded-[12px] ${className}`} style={{ width: w, height: h, transition: ease(), ...skin, ...ring, ...style }}>
      {children}
    </div>
  )
}

/** A soft glow behind the thing that is being talked about. */
function Glow({ on, w, h, tone = colors.brand }: { on: boolean; w: number; h: number; tone?: string }) {
  return <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 rounded-full" style={{ width: w, height: h, transform: 'translate(-50%,-50%)', background: `radial-gradient(closest-side, ${tone}55, ${tone}00)`, opacity: on ? 1 : 0, transition: `opacity 420ms ${EASE}` }} />
}

/* ================================================================== 6 · physical to virtual */

const LAND = [
  { label: 'Server', sub: 'Multiple virtual machines run on one physical server', art: <Icon3D name="server-stack" w={52} /> },
  { label: 'Storage', sub: 'Virtual storage is created from shared physical disks', art: <Icon3D name="data-storage" w={54} /> },
  { label: 'Network', sub: 'Virtual networks are created over shared physical network hardware', art: <Icon3D name="network" w={54} /> },
  { label: 'Desktop', sub: 'Virtual desktops can be accessed remotely from different devices', art: <Icon3D name="desktop" w={60} /> },
  { label: 'Application', sub: 'Applications can run in isolated virtual environments', art: <ClayOsWindow w={64} k={0} /> },
]
const L_W = 198
const L_X = (i: number) => 24 + i * (L_W + 18)
const L_CX = (i: number) => L_X(i) + L_W / 2
const L_TOP = 20
const L_H = 180
const HYP_Y = 222
const HW_Y = 278

/**
 * The TR's picture: the physical server block at the bottom, the hypervisor
 * layer on it, five branches on top, each to its virtual icon. One packet at a
 * time leaves the physical server, crosses the hypervisor and reaches a
 * branch, which lifts as it lands: one host, five kinds of virtual resource.
 */
function LandscapeScene() {
  const N = LAND.length
  const t = useLoop(N * 2200, { mode: 'sawtooth', still: 0.14 })
  const k = Math.min(N - 1, Math.floor(t * N))
  const u = t * N - k
  const lit = u > 0.55 ? k : -1
  return (
    <>
      {LAND.map((it, i) => (
        <At key={it.label} x={L_X(i)} y={L_TOP} w={L_W}>
          <Chip w={L_W} h={L_H} lit={lit === i} style={{ flexDirection: 'column', justifyContent: 'flex-start', padding: '10px 10px 0', gap: 2, transform: lit === i ? 'translateY(-4px)' : 'none', borderRadius: 18 }}>
            <div className="relative flex h-[64px] items-end justify-center">
              <Glow on={lit === i} w={120} h={90} />
              <div className="relative">{it.art}</div>
            </div>
            <span className="font-heading text-[18px] font-semibold leading-tight" style={{ color: colors.ink }}>
              {it.label}
            </span>
            <span className="text-center text-[15px] leading-snug" style={{ color: colors.muted }}>
              {it.sub}
            </span>
          </Chip>
        </At>
      ))}
      {LAND.map((it, i) => (
        <Arrow key={`a-${it.label}`} x1={L_CX(i)} y1={HYP_Y - 2} x2={L_CX(i)} y2={L_TOP + L_H + 4} dashed={lit !== i} tone={lit === i ? colors.brand : '#9DB4E8'} width={2} />
      ))}
      <At x={24} y={HYP_Y}>
        <ClayBar w={1062} h={46} fill={colors.brand}>
          <span className="font-heading text-[20px] font-semibold" style={{ color: colors.white }}>
            Hypervisor
          </span>
          <span className="ml-2 text-[16px]" style={{ color: colors.white, opacity: 0.92 }}>
            the software layer that creates and manages VMs
          </span>
        </ClayBar>
      </At>
      <At x={24} y={HW_Y}>
        <ClayBar w={1062} h={46} fill={colors.brandDeep}>
          <ServerIcon size={20} color={colors.white} aria-hidden />
          <span className="ml-1 mr-3 font-heading text-[19px] font-semibold" style={{ color: colors.white }}>
            Physical server
          </span>
          {[Cpu, MemoryStick, HardDrive, NetworkIcon].map((I, j) => (
            <I key={j} size={18} color="#A9C2F5" aria-hidden />
          ))}
        </ClayBar>
      </At>
      <Pkt path={[[L_CX(k), HW_Y + 23], [L_CX(k), HYP_Y + 23], [L_CX(k), L_TOP + L_H + 8]]} u={u / 0.6} />
    </>
  )
}

export function Landscape({ lesson }: { lesson: string }) {
  return (
    <Card id="Landscape" kicker="Virtualization Landscape" title="Physical To Virtual" lead={lead('Virtualization uses software to create virtual versions of computing resources, allowing physical hardware to be shared efficiently while keeping workloads isolated.')} lesson={lesson}>
      <Stage w={BOX_W} h={344} active={false}>
        <LandscapeScene />
      </Stage>
    </Card>
  )
}

/* ================================================================== 7 · three core benefits */

/** A glass tube with a level in it, session 1's way: lit left edge, specular, a rounded column scaled from the foot. */
function Tube({ level, tone, w = 62, h = 158 }: { level: number; tone: [string, string]; w?: number; h?: number }) {
  const id = useId().replace(/:/g, '')
  const foot = h - 10
  const run = h - 20
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" x2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#DCE6FA" />
        </linearGradient>
        <linearGradient id={`${id}-f`} x1="0" x2="1">
          <stop offset="0" stopColor={tone[0]} />
          <stop offset="1" stopColor={tone[1]} />
        </linearGradient>
        <radialGradient id={`${id}-s`}>
          <stop offset="0" stopColor="rgba(31,64,140,0.28)" />
          <stop offset="1" stopColor="rgba(31,64,140,0)" />
        </radialGradient>
      </defs>
      <ellipse cx={w / 2} cy={h - 2} rx={w * 0.55} ry={5} fill={`url(#${id}-s)`} />
      <rect x={2} y={2} width={w - 4} height={h - 7} rx={18} fill={`url(#${id}-g)`} stroke="#C3D3F0" strokeWidth={1.5} />
      <g style={{ transformOrigin: `${w / 2}px ${foot}px`, transform: `scaleY(${level})` }}>
        <rect x={8} y={foot - run} width={w - 16} height={run} rx={13} fill={`url(#${id}-f)`} />
      </g>
      <rect x={10} y={12} width={6} height={h * 0.42} rx={3} fill="#FFFFFF" opacity={0.6} />
    </svg>
  )
}

const RED: [string, string] = ['#FF8A80', colors.danger]
const GREEN: [string, string] = ['#4ADE80', colors.success]

/** The TR's small bar beside the table: Before stays low, After fills to high as the VMs move in, holds, and drains for the next lap. */
function UtilScene() {
  const t = useLoop(7000, { mode: 'sawtooth', still: 0.7 })
  const after = 0.18 + 0.64 * within(t, 0.12, 0.5) * (1 - within(t, 0.88, 0.99))
  const bars = [
    { label: 'Before', sub: 'one app per server', word: 'Low', level: 0.18, tone: RED, ink: colors.danger },
    { label: 'After', sub: 'many VMs per server', word: 'High', level: after, tone: GREEN, ink: colors.success },
  ]
  return (
    <>
      <At x={150} y={22} cx>
        <span className="block whitespace-nowrap font-heading text-[18px] font-semibold" style={{ color: colors.ink }}>
          Server utilization
        </span>
      </At>
      {bars.map((b, i) => (
        <At key={b.label} x={i === 0 ? 84 : 216} y={56} cx>
          <div className="flex flex-col items-center" style={{ width: 120 }}>
            <span className="font-heading text-[18px] font-semibold" style={{ color: b.ink }}>
              {b.word}
            </span>
            <div className="mt-2">
              <Tube level={b.level} tone={b.tone} />
            </div>
            <span className="mt-2 font-heading text-[17px] font-semibold" style={{ color: colors.ink }}>
              {b.label}
            </span>
            <span className="text-center text-[15px] leading-tight" style={{ color: colors.muted }}>
              {b.sub}
            </span>
          </div>
        </At>
      ))}
    </>
  )
}

export function Benefits({ lesson }: { lesson: string }) {
  return (
    <Card id="Benefits" kicker="Three Core Benefits" title="Mechanism And Effect" lead={lead('Before virtualization, each physical server typically ran one operating system and one application, leaving most capacity idle.')} lesson={lesson}>
      <div className="flex items-start" style={{ width: BOX_W, gap: 24 }}>
        <div style={{ width: BOX_W - 300 - 24 }}>
          <DataTable
            columns={[
              { label: 'Benefit', weight: 0.75 },
              { label: 'How Achieved', weight: 1.15 },
              { label: 'Effect', weight: 1.15 },
            ]}
            rows={[
              [<b key="c">Consolidation</b>, 'Multiple VMs share one physical host', 'Fewer physical servers needed for same workload'],
              [<b key="i">Isolation</b>, 'Hypervisor enforces separate memory and CPU for each VM', 'A fault in one VM cannot affect others'],
              [<b key="u">Utilization</b>, 'Idle CPU/memory cycles reassigned across VMs on demand', 'Average server utilization rises sharply versus one-app-per-server'],
            ]}
          />
        </div>
        <Stage w={300} h={360} active={false}>
          <UtilScene />
        </Stage>
      </div>
    </Card>
  )
}

/* ================================================================== 8 · the TR's server diagram */

const SV_X = 24
const SV_Y = 42
const SV_W = 736
const VM_W = 166
const VM_GAP = 12
const VM_X = (i: number) => SV_X + 14 + i * (VM_W + VM_GAP)
const VM_Y = SV_Y + 12
const USERS_Y = [52, 132, 212]
const USER_X = 1036
/* the cloud's centre sits on the SERVER frame's centre line (SV_Y + 238 / 2), so the link between them is level */
const CLOUD: [number, number] = [902, 42 + 119]

/**
 * The TR's own diagram, same boxes, places and names: one SERVER holding four
 * VMs (three APPs on an OS each), on one Hypervisor, on Storage, CPU, RAM and
 * Network; the server reaches three Users over the Internet, which is Cloud
 * Computing. A request travels from a user through the internet into the
 * server and the VM that serves it lights, one VM after another.
 */
function ServerScene() {
  const t = useLoop(4 * 2600, { mode: 'sawtooth', still: 0.2 })
  const k = Math.min(3, Math.floor(t * 4))
  const u = t * 4 - k
  const user = k % 3
  const lit = u > 0.62 ? k : -1
  const hw = [
    { name: 'Storage', I: HardDrive },
    { name: 'CPU', I: Cpu },
    { name: 'RAM', I: MemoryStick },
    { name: 'Network', I: NetworkIcon },
  ]
  return (
    <>
      <At x={SV_X} y={10}>
        <span className="block font-heading text-[18px] font-semibold" style={{ color: colors.ink }}>
          Server Virtualization
        </span>
      </At>
      {/* the SERVER frame */}
      <At x={SV_X} y={SV_Y}>
        {/* everything the server holds is nested in its frame (overlap-check, rule 42: a ringed box only overlaps its own descendants) */}
        <div className="relative rounded-[18px]" style={{ width: SV_W, height: 238, ...TILE_SKIN, boxShadow: `inset 0 0 0 2px ${colors.brandDeep}, 0 14px 28px -18px rgba(0,37,75,0.45)` }}>
      {[0, 1, 2, 3].map((i) => (
        <At key={i} x={VM_X(i) - SV_X} y={VM_Y - SV_Y}>
          <Chip w={VM_W} h={106} lit={lit === i} style={{ flexDirection: 'column', gap: 5, padding: '4px 8px 6px', borderRadius: 14, transform: lit === i ? 'translateY(-3px)' : 'none' }}>
            <span className="font-heading text-[16px] font-semibold" style={{ color: colors.brandDark }}>
              VM
            </span>
            <div className="flex w-full gap-1.5">
              {[0, 1, 2].map((a) => (
                <Chip key={a} w="33.3%" h={27} style={{ borderRadius: 8 }}>
                  <span className="font-heading text-[14px] font-semibold">APP</span>
                </Chip>
              ))}
            </div>
            <Chip w="100%" h={27} tone="soft" style={{ borderRadius: 8 }}>
              <span className="font-heading text-[15px] font-semibold">OS</span>
            </Chip>
          </Chip>
        </At>
      ))}
      <At x={14} y={VM_Y - SV_Y + 114}>
        <ClayBar w={SV_W - 28} h={34} fill={colors.brand}>
          <span className="font-heading text-[17px] font-semibold" style={{ color: colors.white }}>
            Hypervisor
          </span>
        </ClayBar>
      </At>
      <At x={14} y={VM_Y - SV_Y + 156}>
        <div className="flex" style={{ width: SV_W - 28, gap: 10 }}>
          {hw.map(({ name, I }) => (
            <Chip key={name} w="25%" h={36} tone="dark">
              <I size={17} color="#A9C2F5" aria-hidden />
              <span className="font-heading text-[16px] font-semibold">{name}</span>
            </Chip>
          ))}
        </div>
      </At>
      <At x={SV_W / 2} y={VM_Y - SV_Y + 199} cx>
        <span className="block font-heading text-[15px] font-semibold tracking-[0.14em]" style={{ color: colors.brandDeep }}>
          SERVER
        </span>
      </At>
        </div>
      </At>
      {/* the internet */}
      <Arrow x1={SV_X + SV_W + 12} y1={CLOUD[1]} x2={CLOUD[0] - 74} y2={CLOUD[1]} tone={colors.brand} width={2.5} both />
      <At x={CLOUD[0]} y={CLOUD[1]} cx cy>
        <RichCloud w={130} />
      </At>
      <At x={CLOUD[0]} y={CLOUD[1] + 52} cx>
        <Label strong size={16} tone="brand">
          Internet
        </Label>
      </At>
      <At x={USER_X - 30} y={18} cx>
        <span className="block whitespace-nowrap font-heading text-[18px] font-semibold" style={{ color: colors.ink }}>
          Cloud Computing
        </span>
      </At>
      {USERS_Y.map((y, i) => (
        <Arrow key={`u-${i}`} x1={CLOUD[0] + 64} y1={CLOUD[1] - 6 + (i - 1) * 14} x2={USER_X - 34} y2={y + 20} tone={user === i && u < 0.62 ? colors.brand : '#9DB4E8'} dashed width={2} both />
      ))}
      {USERS_Y.map((y, i) => (
        <At key={`m-${i}`} x={USER_X} y={y} cx>
          <div className="flex flex-col items-center gap-1">
            <ClayMonitor w={52} lit={user === i && u < 0.62} />
            <span className="font-heading text-[15px] font-semibold leading-none" style={{ color: colors.ink }}>
              User
            </span>
          </div>
        </At>
      ))}
      <Pkt path={[[USER_X - 30, USERS_Y[user] + 20], [CLOUD[0], CLOUD[1]], [SV_X + SV_W + 12, CLOUD[1]]]} u={u / 0.62} tone={colors.brand} />
    </>
  )
}

export function Server({ lesson }: { lesson: string }) {
  return (
    <Card
      id="Server"
      kicker="Server Virtualization"
      title="Full OS For Each VM"
      lead={lead(['Server virtualization means running multiple virtual servers on a single physical server, so its CPU, memory, and storage are shared instead of sitting idle.', 'Each virtual server is called a virtual machine (VM) and works like an independent computer.'])}
      lesson={lesson}
    >
      <Stage w={BOX_W} h={302} active={false}>
        <ServerScene />
      </Stage>
    </Card>
  )
}

/* ================================================================== 9 · one VM, zoomed */

const ZB_X = 290
const ZB_Y = 24
const ZB_W = 320
const ZB_H = 346
const ST_X = 30
const ST_VM = (i: number) => ST_X + i * 70

/**
 * The overview diagram reused, zoomed into one VM (the TR's guidance): a small
 * Hardware and Hypervisor stack with three VMs, the middle one lit, and dashed
 * lines out to the large box that is that VM opened up. Its layers light in
 * turn from the App down to the virtual hardware and the EC2 instance.
 */
function ZoomScene() {
  const step = useCycle(6, 1700, 1)
  const on = (i: number) => step === i
  const parts = ['Its own kernel', 'Its own drivers', 'Its own system files']
  return (
    <>
      {/* the small stack */}
      {[0, 1, 2].map((i) => (
        <At key={i} x={ST_VM(i)} y={84}>
          <Chip w={58} h={116} tone={i === 2 ? 'soft' : 'plain'} lit={i === 2} style={{ borderRadius: 12, flexDirection: 'column', gap: 6, padding: '10px 8px' }}>
            {[0, 1, 2].map((r) => (
              <span key={r} aria-hidden className="block h-[6px] w-full rounded-full" style={{ background: i === 2 ? colors.brand : '#C3D3F0', opacity: i === 2 ? 0.55 : 1 }} />
            ))}
          </Chip>
        </At>
      ))}
      <At x={ST_X} y={212}>
        <ClayBar w={198} h={42} fill={colors.brand}>
          <span className="font-heading text-[16px] font-semibold" style={{ color: colors.white }}>
            Hypervisor
          </span>
        </ClayBar>
      </At>
      <At x={ST_X} y={264}>
        <ClayBar w={198} h={42} fill={colors.brandDeep}>
          <span className="font-heading text-[16px] font-semibold" style={{ color: colors.white }}>
            Hardware
          </span>
        </ClayBar>
      </At>
      {/* the zoom lines */}
      <svg aria-hidden className="pointer-events-none absolute left-0 top-0" width={600} height={370}>
        {[
          [ST_VM(2) + 58, 86, ZB_X, ZB_Y + 6],
          [ST_VM(2) + 58, 198, ZB_X, ZB_Y + 270],
        ].map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={colors.brand} strokeWidth={2} strokeDasharray="6 6" className="mo mo-dash" />
        ))}
      </svg>
      {/* the VM, opened up */}
      <At x={ZB_X} y={ZB_Y}>
        <div className="flex flex-col items-center rounded-[20px]" style={{ width: ZB_W, height: ZB_H, padding: '10px 14px', gap: 6, ...TILE_SKIN, boxShadow: `inset 0 0 0 2px ${colors.brand}, inset 0 1px 0 #FFFFFF, 0 18px 32px -18px rgba(45,99,251,0.5)` }}>
          <span className="font-heading text-[17px] font-semibold uppercase tracking-[0.08em]" style={{ color: colors.brandDark }}>
            One VM
          </span>
          <Chip w="100%" h={36} lit={on(0)}>
            <span className="font-heading text-[17px] font-semibold">App</span>
          </Chip>
          <div className="flex w-full flex-col items-center rounded-[14px]" style={{ padding: '8px 10px 10px', gap: 6, background: 'linear-gradient(180deg, #EEF3FE 0%, #DCE6FB 100%)', boxShadow: 'inset 0 0 0 1.5px #A9C2F5' }}>
            <span className="font-heading text-[17px] font-semibold" style={{ color: colors.ink }}>
              Full guest OS
            </span>
            {parts.map((p, i) => (
              <Chip key={p} w="100%" h={32} lit={on(i + 1)} style={{ borderRadius: 9 }}>
                <span className="text-[15px] font-medium">{p}</span>
              </Chip>
            ))}
          </div>
          <Chip w="100%" h={34} tone="soft" lit={on(4)}>
            <span className="font-heading text-[16px] font-semibold" style={{ color: colors.brandDark }}>
              Virtual CPU, memory, disk
            </span>
          </Chip>
          <div className="flex items-center gap-2 rounded-pill px-3 py-1" style={{ transition: ease(), boxShadow: on(5) ? `inset 0 0 0 2px ${colors.brand}` : 'inset 0 0 0 2px transparent' }}>
            <Logo name="ec2" h={26} />
            <span className="text-[15px] font-medium" style={{ color: colors.ink }}>
              Amazon EC2 instance
            </span>
          </div>
        </div>
      </At>
    </>
  )
}

export function ServerZoom({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="ServerZoom"
      kicker="Server Virtualization"
      title="Full OS For Each VM"
      lesson={lesson}
      figH={396}
      points={['Introduced to end one-app-per-server hardware waste', 'Each guest OS runs independently, isolated from other VMs on the same hardware', 'Common use: dev/test environments, legacy app hosting', 'AWS example: Amazon EC2 (Elastic Compute Cloud) launches VM instances']}
      figure={<ZoomScene />}
    />
  )
}

/* ================================================================== 10 · pooled virtual volumes */

const SF_W = 586
const DISK_X = (i: number) => SF_W / 2 + (i - 1.5) * 132
const DISK_Y = 22
const DISK_H = 84
const CYL_CX = SF_W / 2
const CYL_Y = 146
const CYL_W = 290
const CYL_H = 104
const APP_Y = 278

/** The pooled cylinder, session 1's finish: a brand-tinted glossy drum, a lit lip, a specular on the left, a soft shadow. */
function Cylinder({ w, h, fill }: { w: number; h: number; fill: number }) {
  const id = useId().replace(/:/g, '')
  const ry = 18
  const top = ry + 2
  const bot = h - ry - 4
  const lvl = bot - (bot - top) * fill
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${id}-b`} x1="0" x2="1">
          <stop offset="0" stopColor="#F3F7FF" />
          <stop offset="0.55" stopColor="#DCE6FB" />
          <stop offset="1" stopColor="#B9CCF4" />
        </linearGradient>
        <linearGradient id={`${id}-l`} x1="0" x2="1">
          <stop offset="0" stopColor="#8FB0FF" />
          <stop offset="1" stopColor={colors.brand} />
        </linearGradient>
        <radialGradient id={`${id}-s`}>
          <stop offset="0" stopColor="rgba(31,64,140,0.28)" />
          <stop offset="1" stopColor="rgba(31,64,140,0)" />
        </radialGradient>
        <clipPath id={`${id}-c`}>
          <path d={`M 2 ${top} L 2 ${bot} A ${w / 2 - 2} ${ry} 0 0 0 ${w - 2} ${bot} L ${w - 2} ${top} Z`} />
        </clipPath>
      </defs>
      <ellipse cx={w / 2} cy={h - 2} rx={w * 0.48} ry={6} fill={`url(#${id}-s)`} />
      <path d={`M 2 ${top} L 2 ${bot} A ${w / 2 - 2} ${ry} 0 0 0 ${w - 2} ${bot} L ${w - 2} ${top} Z`} fill={`url(#${id}-b)`} stroke={colors.brand} strokeWidth={2} />
      <g clipPath={`url(#${id}-c)`}>
        <rect x={0} y={lvl} width={w} height={h} fill={`url(#${id}-l)`} opacity={0.22} />
      </g>
      <ellipse cx={w / 2} cy={top} rx={w / 2 - 2} ry={ry} fill="#C9D8FA" stroke={colors.brand} strokeWidth={2} />
      <ellipse cx={w / 2} cy={top + 3} rx={w / 2 - 22} ry={ry - 7} fill="#AFC5F7" opacity={0.7} />
      <rect x={14} y={top + 14} width={8} height={bot - top - 20} rx={4} fill="#FFFFFF" opacity={0.55} />
    </svg>
  )
}

/**
 * The TR's picture: several physical disks feeding one pooled cylinder
 * labelled Virtual Volume, an application drawing from it. Blocks leave the
 * four disks in turn and drop into the pool; the pool hands one down to the
 * Application, which never sees which disk it came from.
 */
function StorageScene() {
  const t = useLoop(6400, { mode: 'sawtooth', still: 0.62 })
  const leave = (i: number) => 0.04 + i * 0.1
  const uDisk = (i: number) => (t - leave(i)) / 0.3
  const uApp = (t - 0.62) / 0.22
  const appLit = t > 0.8
  return (
    <>
      {[0, 1, 2, 3].map((i) => {
        const busy = uDisk(i) > 0 && uDisk(i) < 0.5
        return (
          <At key={i} x={DISK_X(i)} y={DISK_Y} cx>
            <Chip w={112} h={DISK_H} lit={busy} style={{ flexDirection: 'column', gap: 6, borderRadius: 16 }}>
              <ClayServerUnit w={58} running />
              <span className="font-heading text-[17px] font-semibold">Disk {i + 1}</span>
            </Chip>
          </At>
        )
      })}
      {[0, 1, 2, 3].map((i) => (
        <Arrow key={`a-${i}`} x1={DISK_X(i)} y1={DISK_Y + DISK_H + 6} x2={CYL_CX + (i - 1.5) * 52} y2={CYL_Y + 8} tone="#7FA0EC" dashed width={2} />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <Pkt key={`p-${i}`} path={[[DISK_X(i), DISK_Y + DISK_H + 6], [CYL_CX + (i - 1.5) * 52, CYL_Y + 12]]} u={uDisk(i)} tone={colors.brand} size={11} />
      ))}
      <At x={CYL_CX} y={CYL_Y} cx>
        <div className="relative" style={{ width: CYL_W, height: CYL_H }}>
          <Cylinder w={CYL_W} h={CYL_H} fill={0.35 + 0.45 * within(t, 0.1, 0.55) * (1 - within(t, 0.62, 0.84))} />
          <div className="absolute inset-x-0 flex flex-col items-center gap-1.5" style={{ top: 38 }}>
            <span className="font-heading text-[19px] font-semibold" style={{ color: colors.brandDark }}>
              Virtual Volume
            </span>
            <span className="inline-flex items-center gap-2">
              <Logo name="ebs" h={22} />
              <span className="text-[15px] font-medium" style={{ color: colors.ink }}>
                Amazon EBS
              </span>
            </span>
          </div>
        </div>
      </At>
      <Arrow x1={CYL_CX} y1={CYL_Y + CYL_H + 2} x2={CYL_CX} y2={APP_Y - 4} tone={colors.success} dashed width={2} />
      <Pkt path={[[CYL_CX, CYL_Y + CYL_H - 10], [CYL_CX, APP_Y + 4]]} u={uApp} tone={colors.success} size={11} />
      <At x={CYL_CX} y={APP_Y} cx>
        <div className="flex items-center gap-2.5 rounded-[14px] px-4 py-1.5" style={{ ...TILE_SKIN, transition: ease(), boxShadow: `inset 0 0 0 2px ${colors.success}, inset 0 1px 0 #FFFFFF, 0 ${appLit ? 14 : 8}px 22px -12px rgba(22,163,74,${appLit ? 0.55 : 0.3})` }}>
          <ClayOsWindow w={40} k={0} />
          <span className="font-heading text-[18px] font-semibold" style={{ color: colors.ink }}>
            Application
          </span>
        </div>
      </At>
    </>
  )
}

export function Storage({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="Storage"
      kicker="Storage Virtualization"
      title="Pooled Virtual Volumes"
      lead="Storage virtualization pools capacity from multiple physical disks into logical volumes, letting applications see storage independent of the hardware beneath."
      lesson={lesson}
      pointsW={BOX_W - SF_W - 24}
      pointSize={17}
      figH={348}
      points={['Applications do not need to know which disk holds their data', 'Volumes can be resized without moving data manually', 'Snapshots: point-in-time copies for quick recovery', 'Replication: copies kept in another location for safety', 'AWS example: Amazon EBS provides virtual disks for EC2']}
      figure={<StorageScene />}
    />
  )
}

/* LAB is re-exported for figures that need the clay palette; keep the import honest. */
void LAB
