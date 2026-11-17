import type { CSSProperties, ReactNode } from 'react'
import { Tag } from 'lucide-react'
import { colors } from '@/design/tokens'
import { DataTable, type TableColumn } from '@/ui'
import { Arrow, At, BOX_W, Card, Label, STILL, useCycle, useLoop } from '../scene'
import { ClayPadlock, ClayTerminal, Icon3D, LAB } from '../d3/kit'
import { IsoAnalogy, PointsFigure, lead } from '../iso/frames'
import { Logo, Mono, Tile, type MarkName } from './frames'

/**
 * SECTION 6 · TOOLING (TR slides 21 to 26, and the heads-up block): the tool
 * map, the two comparison tables, containerd and Podman, the two analogies,
 * registries and tagging. Every figure runs ONE loop whose motion is the
 * card's press sequence:
 *   55  an image travels down from each column into the one Registry box
 *   57  a start request runs Docker, then containerd, then runc
 *   58  the same request beside Podman's one straight arrow to its container
 *   59  the bus leaves the depot / the command passes the daemon; the
 *       auto-rickshaw reaches the passenger / Podman reaches the container
 *   61  a pull from each registry reaches the one `docker pull` arrow
 *   62  the visitor walks in / the image leaves the public registry; the key
 *       opens the cupboard / authentication opens the private registry
 *   63  pushes land one by one and `latest` jumps to the newest
 * On harness URLs (`STILL`) every loop holds its most complete frame.
 */

const EASE = 'cubic-bezier(0.22,1,0.36,1)'

/** 0 before a, 1 after b, eased between. */
function within(t: number, a: number, b: number) {
  if (t <= a) return 0
  if (t >= b) return 1
  const x = (t - a) / (b - a)
  return x * x * (3 - 2 * x)
}

/* ------------------------------------------------------------------ shared pieces */

/** Logo heights that give the wide wordmarks and the square marks a similar weight. */
const LOGO_H: Record<MarkName, number> = {
  docker: 34, podman: 36, containerd: 40, ubuntu: 34, windows: 34, macos: 34, linux: 34, vscode: 34,
  virtualbox: 36, kvm: 24, hyperv: 36, vmware: 14, aws: 34, azure: 22, gcp: 13, ec2: 34,
}

/** One logo in a fixed-height slot, its name under it (rule 12). */
function LogoCell({ name, caption, slot = 42, scale = 1 }: { name: MarkName; caption: string; slot?: number; scale?: number }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="grid place-items-center" style={{ height: slot }}>
        <Logo name={name} h={Math.round(LOGO_H[name] * scale)} />
      </div>
      <span className="whitespace-nowrap font-heading text-[15px] font-semibold leading-tight" style={{ color: colors.ink }}>
        {caption}
      </span>
    </div>
  )
}

/** A raised box in a chain: a logo beside its name. */
function ToolBox({ mark, name, w = 220, h = 72, lit = false, children }: { mark?: MarkName; name: ReactNode; w?: number; h?: number; lit?: boolean; children?: ReactNode }) {
  return (
    <Tile w={w} h={h} lit={lit} className="flex flex-col items-center justify-center gap-1.5">
      <div className="flex items-center justify-center gap-3">
        {mark && <Logo name={mark} h={Math.round(LOGO_H[mark] * 0.95)} />}
        <span className="font-heading text-[20px] font-semibold leading-none" style={{ color: colors.ink }}>
          {name}
        </span>
      </div>
      {children}
    </Tile>
  )
}

/** A dot riding a straight segment; hidden on harness URLs, where the picture holds still. */
function Dot({ a, b, t, on = true, tone = colors.accent, size = 14 }: { a: [number, number]; b: [number, number]; t: number; on?: boolean; tone?: string; size?: number }) {
  if (STILL) return null
  const x = a[0] + (b[0] - a[0]) * t
  const y = a[1] + (b[1] - a[1]) * t
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute rounded-full"
      style={{ left: x - size / 2, top: y - size / 2, width: size, height: size, background: tone, boxShadow: `0 0 0 3px ${colors.white}, 0 0 14px ${tone}`, opacity: on ? 1 : 0, transition: 'opacity 200ms' }}
    />
  )
}

/** A dot along a polyline, `t` 0 to 1 over the whole path. */
function PathDot({ path, t, on = true, tone }: { path: [number, number][]; t: number; on?: boolean; tone?: string }) {
  const seg = path.length - 1
  const f = Math.min(seg - 1e-6, Math.max(0, t * seg))
  const i = Math.floor(f)
  return <Dot a={path[i]} b={path[i + 1]} t={f - i} on={on} tone={tone} />
}

/* ------------------------------------------------------------------ T21-1 · slide 55 */

const VM_TOOLS: [MarkName, string][] = [['virtualbox', 'VirtualBox'], ['kvm', 'KVM'], ['hyperv', 'Hyper-V'], ['vmware', 'VMware']]
const CT_TOOLS: [MarkName, string][] = [['docker', 'Docker'], ['podman', 'Podman'], ['containerd', 'containerd']]

function ToolMapFigure() {
  const t = useLoop(4800, { mode: 'sawtooth', still: 0.5 })
  const A: [[number, number], [number, number]] = [[162, 224], [272, 268]]
  const B: [[number, number], [number, number]] = [[472, 224], [362, 268]]
  return (
    <>
      <At x={22} y={18}>
        <Tile w={280} h={198} className="flex flex-col items-center gap-3 !p-3">
          <Label tone="brand" strong size={16}>VM tools</Label>
          <div className="grid w-full grid-cols-2 gap-x-2 gap-y-3">
            {VM_TOOLS.map(([m, n]) => (
              <LogoCell key={n} name={m} caption={n} slot={40} scale={0.95} />
            ))}
          </div>
        </Tile>
      </At>
      <At x={332} y={18}>
        <Tile w={280} h={198} className="flex flex-col items-center gap-3 !p-3">
          <Label tone="brand" strong size={16}>Container tools</Label>
          <div className="grid w-full flex-1 grid-cols-3 items-center gap-x-1">
            {CT_TOOLS.map(([m, n]) => (
              <LogoCell key={n} name={m} caption={n} slot={48} />
            ))}
          </div>
        </Tile>
      </At>
      <Arrow x1={A[0][0]} y1={A[0][1]} x2={A[1][0]} y2={A[1][1]} />
      <Arrow x1={B[0][0]} y1={B[0][1]} x2={B[1][0]} y2={B[1][1]} />
      <Dot a={A[0]} b={A[1]} t={within(t, 0.05, 0.42)} on={t > 0.03 && t < 0.45} />
      <Dot a={B[0]} b={B[1]} t={within(t, 0.55, 0.92)} on={t > 0.53 && t < 0.95} />
      <At x={317} y={272} cx>
        <Tile w={210} h={50} className="flex items-center justify-center gap-2.5">
          <Icon3D name="database" w={30} shadow={false} />
          <span className="font-heading text-[20px] font-semibold leading-none" style={{ color: colors.ink }}>
            Registry
          </span>
        </Tile>
      </At>
      <At x={317} y={334} cx>
        <Label tone="lift" strong size={16} icon={<Tag />} raised>
          Tagging
        </Label>
      </At>
    </>
  )
}

export function ToolingMap({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="T21-1"
      kicker="Tooling Landscape"
      title="Four Areas Mapped"
      lead="Running virtual machines or containers in production means picking a hypervisor or engine, then a registry to distribute the resulting images"
      lesson={lesson}
      points={['Virtualization tools: VirtualBox, KVM, Hyper-V, VMware', 'Container engines: Docker, Podman, containerd', 'Registries: public vs private', 'Tagging: naming scheme for image versions']}
      figure={<ToolMapFigure />}
    />
  )
}

/* ------------------------------------------------------------------ T22-1 · slide 56 */

/**
 * The kit table sets its header in capitals by CSS; the spec's column heads are
 * mixed case (`Typical Use`, `containerd`) and every string stays the spec's, so
 * these two tables keep the heads as written.
 */
const HEAD_CASE_CSS = `.cv-tbl > div:first-child > div { text-transform: none; letter-spacing: 0.01em; }`

/** A tool's name with its vendor logo beside it. */
function ToolName({ mark, name }: { mark: MarkName; name: string }) {
  const h = { virtualbox: 26, kvm: 16, hyperv: 26, vmware: 10 }[mark as string] ?? 24
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="grid w-[64px] shrink-0 place-items-center">
        <Logo name={mark} h={h} />
      </span>
      <span>{name}</span>
    </span>
  )
}

export function Hypervisors({ lesson }: { lesson: string }) {
  const columns: TableColumn[] = [
    { label: 'Tool', weight: 1.15 },
    { label: 'Type', weight: 1.2 },
    { label: 'Platform', weight: 1.6 },
    { label: 'Typical Use', weight: 1.25 },
  ]
  return (
    <Card id="T22-1" kicker="VM Tooling Compared" title="Four Hypervisor Products" lead={lead('Each virtualization product fits a different deployment, from a laptop test lab to a production data centre')} lesson={lesson}>
      <div style={{ width: BOX_W }}>
        <style>{HEAD_CASE_CSS}</style>
        <DataTable
          className="cv-tbl"
          columns={columns}
          rows={[
        [<ToolName mark="virtualbox" name="VirtualBox" />, 'Type 2 hosted', 'Windows macOS Linux', 'Desktop testing, dev labs'],
        [
          <ToolName mark="kvm" name="KVM" />,
          'Type 1, kernel module',
          'Linux hosts',
          <>
            <span className="block">AWS Nitro, Google Cloud,</span>
            <span className="block">OpenStack clouds</span>
          </>,
        ],
        [<ToolName mark="hyperv" name="Hyper-V" />, 'Type 1 bare-metal', 'Windows Server, 10/11 Pro', 'Microsoft Azure, enterprise'],
        [<ToolName mark="vmware" name="VMware" />, 'Type 1 (ESXi) / Type 2 (Workstation)', 'Bare-metal (ESXi); Windows, Linux, macOS (Workstation/Fusion)', 'Enterprise data centres'],
          ]}
        />
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ T23-1 · slide 57 */

function ContainerdFigure() {
  const t = useLoop(4200, { mode: 'sawtooth', still: 0.5 })
  const path: [number, number][] = [[317, 86], [317, 128], [317, 198], [317, 240]]
  const at = within(t, 0.08, 0.85)
  return (
    <>
      <At x={317} y={20} cx>
        <ToolBox mark="docker" name="Docker" w={240} h={66} lit={!STILL && at < 0.2 && t > 0.04} />
      </At>
      <Arrow x1={317} y1={88} x2={317} y2={128} />
      <At x={317} y={132} cx>
        <ToolBox mark="containerd" name="containerd" w={240} h={66} lit={!STILL && at > 0.25 && at < 0.7} />
      </At>
      <Arrow x1={317} y1={200} x2={317} y2={240} />
      <At x={336} y={208}>
        <Label tone="muted" size={14}>OCI Runtime Spec</Label>
      </At>
      <At x={317} y={244} cx>
        <ToolBox name="runc" w={240} h={66} lit={!STILL && at > 0.9} />
      </At>
      <PathDot path={path} t={at} on={t > 0.06 && t < 0.88} />
    </>
  )
}

export function Containerd({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="T23-1"
      kicker="Beneath Docker's Daemon"
      title="Containerd And Podman"
      lead="Docker delegates container execution to containerd. Kubernetes can use containerd through the Container Runtime Interface (CRI), without relying on Docker Engine"
      lesson={lesson}
      points={['containerd: split out of Docker in 2016, now a separate project', 'containerd runs the OCI Runtime Spec through runc underneath']}
      figure={<ContainerdFigure />}
      figH={330}
    />
  )
}

/* ------------------------------------------------------------------ T23-2 · slide 58 */

/** A container tile: the word, and the rootless mark when given. */
function ContainerBox({ rootless = false, lit = false }: { rootless?: boolean; lit?: boolean }) {
  return (
    <Tile w={220} h={92} lit={lit} className="flex flex-col items-center justify-center gap-2">
      <span className="font-heading text-[20px] font-semibold leading-none" style={{ color: colors.ink }}>
        Container
      </span>
      {rootless && (
        <Label tone="good" strong size={15}>
          rootless
        </Label>
      )}
    </Tile>
  )
}

function PodmanFigure() {
  const t = useLoop(4200, { mode: 'sawtooth', still: 0.5 })
  const at = within(t, 0.08, 0.85)
  const L = 162
  const R = 472
  return (
    <>
      <At x={L} y={22} cx>
        <ToolBox mark="docker" name="Docker" w={220} h={76} />
      </At>
      <Arrow x1={L} y1={102} x2={L} y2={144} />
      <At x={L} y={148} cx>
        <ToolBox mark="containerd" name="containerd" w={220} h={76} />
      </At>
      <Arrow x1={L} y1={228} x2={L} y2={266} />
      <At x={L} y={270} cx>
        <ContainerBox lit={!STILL && at > 0.92} />
      </At>
      <PathDot path={[[L, 102], [L, 144], [L, 228], [L, 266]]} t={at} on={t > 0.06 && t < 0.88} />

      <At x={R} y={22} cx>
        <ToolBox mark="podman" name="Podman" w={220} h={76} />
      </At>
      <Arrow x1={R} y1={102} x2={R} y2={266} />
      <At x={R} y={270} cx>
        <ContainerBox rootless lit={!STILL && at > 0.92} />
      </At>
      <PathDot path={[[R, 102], [R, 266]]} t={at} on={t > 0.06 && t < 0.88} />
    </>
  )
}

export function Podman({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="T23-2"
      kicker="Beneath Docker's Daemon"
      title="Containerd And Podman"
      lesson={lesson}
      points={["Podman removes the central daemon altogether; each container is a direct process", "Podman's rootless mode starts containers without any root privilege"]}
      figure={<PodmanFigure />}
    />
  )
}

/* ------------------------------------------------------------------ drawn objects for the two analogies */

/** A bus depot: a shed with a wide open bay. */
function Depot({ w = 120 }: { w?: number }) {
  return (
    <svg width={w} height={w * 0.72} viewBox="0 0 120 86" aria-hidden>
      <ellipse cx="60" cy="83" rx="56" ry="3.5" fill="#1F408C" opacity="0.18" />
      <path d="M6 32 L60 6 L114 32 Z" fill={LAB.navy} />
      <path d="M6 32 L60 6 L60 14 L14 34 Z" fill="#FFFFFF" opacity="0.18" />
      <rect x="12" y="30" width="96" height="52" rx="4" fill={LAB.lavender} />
      <rect x="12" y="30" width="96" height="8" fill={LAB.lavDeep} opacity="0.6" />
      <rect x="26" y="44" width="68" height="38" rx="3" fill={LAB.charcoal} />
      {[50, 58, 66].map((y) => (
        <rect key={y} x="26" y={y} width="68" height="1.6" fill="#FFFFFF" opacity="0.12" />
      ))}
    </svg>
  )
}

/** A city bus, side on. */
function Bus({ w = 132 }: { w?: number }) {
  return (
    <svg width={w} height={w * 0.5} viewBox="0 0 132 66" aria-hidden>
      <ellipse cx="66" cy="63" rx="60" ry="3" fill="#1F408C" opacity="0.18" />
      <rect x="4" y="6" width="124" height="46" rx="10" fill={colors.brand} />
      <rect x="4" y="6" width="124" height="14" rx="10" fill="#FFFFFF" opacity="0.14" />
      {[12, 34, 56, 78, 100].map((x) => (
        <rect key={x} x={x} y="14" width="18" height="14" rx="3" fill="#DCE8FF" />
      ))}
      <rect x="114" y="14" width="10" height="26" rx="3" fill="#DCE8FF" />
      <rect x="4" y="38" width="124" height="4" fill={LAB.yellow} />
      <circle cx="30" cy="52" r="9" fill={LAB.charcoal} />
      <circle cx="30" cy="52" r="3.5" fill="#C8D2E6" />
      <circle cx="104" cy="52" r="9" fill={LAB.charcoal} />
      <circle cx="104" cy="52" r="3.5" fill="#C8D2E6" />
    </svg>
  )
}

/** An auto-rickshaw, side on: a yellow cab under a dark canopy, three wheels. */
function Rickshaw({ w = 96 }: { w?: number }) {
  return (
    <svg width={w} height={w * 0.72} viewBox="0 0 96 69" aria-hidden>
      <ellipse cx="48" cy="66" rx="42" ry="3" fill="#1F408C" opacity="0.18" />
      <path d="M14 10 Q14 4 22 4 L70 4 Q80 4 84 14 L88 30 L14 30 Z" fill={LAB.charcoal} />
      <path d="M10 30 L90 30 Q92 30 92 34 L92 52 L8 52 L8 34 Q8 30 10 30 Z" fill={LAB.yellow} />
      <path d="M8 44 L92 44 L92 52 L8 52 Z" fill={LAB.sage} />
      <rect x="22" y="12" width="26" height="18" rx="3" fill="#DCE8FF" opacity="0.85" />
      <path d="M58 12 L74 12 L82 30 L58 30 Z" fill="#DCE8FF" opacity="0.85" />
      <circle cx="24" cy="56" r="8" fill={LAB.charcoal} />
      <circle cx="24" cy="56" r="3" fill="#C8D2E6" />
      <circle cx="78" cy="56" r="8" fill={LAB.charcoal} />
      <circle cx="78" cy="56" r="3" fill="#C8D2E6" />
    </svg>
  )
}

/** A library: a pediment, columns, a shelf of books in each window, the door standing open. */
function Library({ w = 130 }: { w?: number }) {
  const books = ['#D8352F', LAB.yellow, LAB.cobalt, LAB.sage, LAB.orange]
  return (
    <svg width={w} height={w * 0.8} viewBox="0 0 130 104" aria-hidden>
      <ellipse cx="65" cy="101" rx="60" ry="3.5" fill="#1F408C" opacity="0.18" />
      <path d="M6 30 L65 4 L124 30 Z" fill={LAB.cobalt} />
      <path d="M6 30 L65 4 L65 12 L16 32 Z" fill="#FFFFFF" opacity="0.18" />
      <rect x="10" y="30" width="110" height="64" rx="3" fill={LAB.lavender} />
      {[18, 92].map((x) => (
        <g key={x}>
          <rect x={x} y="44" width="20" height="26" rx="2" fill="#FFFFFF" />
          {books.slice(0, 4).map((c, i) => (
            <rect key={i} x={x + 2 + i * 4.5} y="52" width="3.6" height="16" rx="0.8" fill={c} />
          ))}
        </g>
      ))}
      <rect x="50" y="52" width="30" height="42" rx="2" fill="#3E3D45" />
      <path d="M50 52 L38 58 L38 98 L50 94 Z" fill={LAB.wood} />
      <rect x="4" y="94" width="122" height="6" rx="2" fill={LAB.lavDeep} />
    </svg>
  )
}

/** An office cupboard with two doors and a keyhole; `open` swings the right door out. */
function Cupboard({ w = 100, open = 0 }: { w?: number; open?: number }) {
  return (
    <svg width={w} height={w * 1.0} viewBox="0 0 100 100" aria-hidden>
      <ellipse cx="50" cy="97" rx="46" ry="3" fill="#1F408C" opacity="0.18" />
      <rect x="12" y="6" width="76" height="88" rx="5" fill={LAB.lavDeep} />
      <rect x="16" y="10" width="68" height="80" rx="3" fill={LAB.charcoal} />
      <rect x="22" y="40" width="56" height="3" fill="#FFFFFF" opacity="0.3" />
      <rect x="28" y="28" width="10" height="12" rx="1" fill={LAB.sky} />
      <rect x="40" y="30" width="8" height="10" rx="1" fill={LAB.yellow} />
      <rect x="16" y="10" width="34" height="80" rx="3" fill={LAB.paper} stroke={LAB.lavDeep} />
      <g style={{ transformOrigin: '84px 50px', transform: `scaleX(${1 - open * 0.75})`, transition: `transform 360ms ${EASE}` }}>
        <rect x="50" y="10" width="34" height="80" rx="3" fill={LAB.paper} stroke={LAB.lavDeep} />
        <circle cx="56" cy="50" r="2.6" fill={LAB.charcoal} />
        <rect x="55.2" y="50" width="1.6" height="5" fill={LAB.charcoal} />
      </g>
    </svg>
  )
}

/** A key. */
function Key({ w = 54, tone = LAB.yellow }: { w?: number; tone?: string }) {
  return (
    <svg width={w} height={w * 0.44} viewBox="0 0 54 24" aria-hidden>
      <circle cx="11" cy="12" r="9" fill={tone} />
      <circle cx="11" cy="12" r="3.5" fill="#FFFFFF" />
      <rect x="18" y="9.5" width="34" height="5" rx="2" fill={tone} />
      <rect x="40" y="14" width="4" height="6" rx="1" fill={tone} />
      <rect x="47" y="14" width="4" height="8" rx="1" fill={tone} />
    </svg>
  )
}

/** A small "image" tile that travels out of a registry. */
function ImageChip() {
  return (
    <span className="inline-flex items-center rounded-[8px] px-2 py-1 font-heading text-[14px] font-semibold leading-none" style={{ background: '#FFF1D6', color: '#9A5B00', boxShadow: 'inset 0 0 0 1.5px #F5D9A6' }}>
      Image
    </span>
  )
}

/* ------------------------------------------------------------------ T23-AN · slide 59 */

/*
  Columns shared by both scenes, so every pair lines up (left, mid, right):
    top     depot dispatches the bus      | command, Docker daemon, container
    bottom  auto-rickshaw, passenger      | Podman, container (no daemon)
*/
const COL = { l: 84, m: 234, r: 384 } as const
/** The analogy stages' height (user, 2026-10-28: analogies carry no lead, no captions, so the pictures take the space). */
const AN_STAGE_H = 392
const ROW = { top: 22, bot: 214 } as const

function BusScene() {
  const t = useLoop(6000, { mode: 'sawtooth', still: 0.98 })
  const bus = within(t, 0.08, 0.42)
  const ride = within(t, 0.55, 0.9)
  return (
    <>
      <At x={COL.m} y={ROW.top + 4} cx>
        <Depot w={146} />
      </At>
      <At x={COL.r} y={ROW.top + 38} cx style={{ transform: `translateX(calc(-50% - ${(1 - bus) * 130}px))`, opacity: STILL ? 1 : 0.25 + bus * 0.75 }}>
        <Bus w={150} />
      </At>
      <At x={COL.m} y={ROW.top + 120} cx>
        <Label tone="muted" size={15}>Depot</Label>
      </At>
      <At x={COL.r} y={ROW.top + 120} cx>
        <Label tone="muted" size={15}>City bus</Label>
      </At>

      <At x={COL.l + ride * 136} y={ROW.bot + 40} cx>
        <div className="flex flex-col items-center gap-[12px]">
          <Rickshaw w={114} />
          <Label tone="muted" size={15}>Auto-rickshaw</Label>
        </div>
      </At>
      <At x={COL.r} y={ROW.bot} cx>
        <div className="flex flex-col items-center gap-[6px]">
          <Icon3D name="man-pro" w={74} shadow={false} />
          <Label tone="muted" size={15}>Passenger</Label>
        </div>
      </At>
    </>
  )
}

function DaemonScene() {
  const t = useLoop(6000, { mode: 'sawtooth', still: 0.98 })
  const a = within(t, 0.08, 0.42)
  const b = within(t, 0.55, 0.9)
  const yT = ROW.top + 62
  const yB = ROW.bot + 72
  return (
    <>
      <At x={COL.l} y={yT} cx cy>
        <ClayTerminal w={84} />
      </At>
      <At x={COL.l} y={ROW.top + 120} cx>
        <Label tone="muted" size={15}>Command</Label>
      </At>
      <Arrow x1={COL.l + 46} y1={yT} x2={COL.m - 72} y2={yT} />
      <At x={COL.m} y={yT} cx cy>
        <Tile w={136} h={84} className="flex flex-col items-center justify-center gap-2">
          <Logo name="docker" h={30} />
          <span className="whitespace-nowrap font-heading text-[16px] font-semibold leading-none" style={{ color: colors.ink }}>
            Docker daemon
          </span>
        </Tile>
      </At>
      <Arrow x1={COL.m + 72} y1={yT} x2={COL.r - 60} y2={yT} />
      <At x={COL.r} y={yT} cx cy>
        <Tile w={116} h={64} lit={!STILL && a > 0.98 && t < 0.5} className="grid place-items-center">
          <span className="font-heading text-[17px] font-semibold" style={{ color: colors.ink }}>Container</span>
        </Tile>
      </At>
      <PathDot path={[[COL.l + 46, yT], [COL.m - 72, yT], [COL.m + 72, yT], [COL.r - 60, yT]]} t={a} on={t > 0.06 && t < 0.44} />

      <At x={COL.l} y={yB} cx cy>
        <Tile w={120} h={84} className="flex flex-col items-center justify-center gap-1.5">
          <Logo name="podman" h={38} />
          <span className="font-heading text-[16px] font-semibold leading-none" style={{ color: colors.ink }}>Podman</span>
        </Tile>
      </At>
      <Arrow x1={COL.l + 62} y1={yB} x2={COL.r - 60} y2={yB} />
      <At x={COL.r} y={yB} cx cy>
        <Tile w={116} h={64} lit={!STILL && b > 0.98} className="grid place-items-center">
          <span className="font-heading text-[17px] font-semibold" style={{ color: colors.ink }}>Container</span>
        </Tile>
      </At>
      <PathDot path={[[COL.l + 62, yB], [COL.r - 60, yB]]} t={b} on={t > 0.53 && t < 0.92} />
    </>
  )
}

export function BusAnalogy({ lesson }: { lesson: string }) {
  return (
    <IsoAnalogy
      id="T23-AN"
      kicker="Beneath Docker's Daemon"
      title="A bus depot or an auto-rickshaw"
      text="A city bus needs a central depot dispatching every trip, while an auto-rickshaw driver picks up a passenger directly with no depot involved, exactly as Podman starts a container directly, with no daemon standing between the command and the running process"
      lesson={lesson}
      bare
      h={AN_STAGE_H}
      everyday={{ label: 'A bus depot or an auto-rickshaw', scene: <BusScene /> }}
      cloud={{ label: "Docker's daemon and Podman", scene: <DaemonScene /> }}
    />
  )
}

/* ------------------------------------------------------------------ T24-1 · slide 60 */

/** A header cell: the tool's logo beside its name. */
function Head({ mark, name }: { mark: MarkName; name: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Logo name={mark} h={mark === 'containerd' ? 26 : 22} />
      <span>{name}</span>
    </span>
  )
}

/** The Primary role row lit in the template's orange (the card: "a contrasting colour"). */
const ENGINE_CSS = `
.cv-engines > div:nth-child(2) > div:nth-child(4) {
  background: linear-gradient(135deg, #FFF4E6 0%, #FFE6CC 100%) !important;
  box-shadow: inset 4px 0 0 0 ${colors.accent}, inset 0 1px 0 0 #FFFFFF !important;
}
.cv-engines > div:nth-child(2) > div:nth-child(4) > div { color: ${colors.ink}; font-weight: 600; }
`

export function Engines({ lesson }: { lesson: string }) {
  const columns: TableColumn[] = [
    { label: 'Aspect', weight: 1 },
    { label: <Head mark="docker" name="Docker" />, weight: 1.05 },
    { label: <Head mark="podman" name="Podman" />, weight: 1.2 },
    { label: <Head mark="containerd" name="containerd" />, weight: 1.55 },
  ]
  return (
    <Card id="T24-1" kicker="Engines Compared" title="Architecture And Role" lead={lead('The three tools sit at different layers of one stack, and that layering decides which one fits a given deployment')} lesson={lesson}>
      <div style={{ width: BOX_W }}>
        <style>{HEAD_CASE_CSS + ENGINE_CSS}</style>
        <DataTable
          className="cv-tbl cv-engines"
          columns={columns}
          highlight={[4]}
          rows={[
            ['Daemon required', 'Yes, dockerd', 'No', 'Yes, lower-level service'],
            ['Rootless by default', 'No', 'Yes, when run as a normal user', 'No, root-level service'],
            ['Native CLI', 'Yes, full-featured', 'Yes, Docker-compatible', 'Minimal (ctr, for debugging); nerdctl for Docker-like use'],
            ['Primary role', 'Dev workstation, CI', 'Secure, rootless hosts', 'Kubernetes CRI runtime (EKS, GKE)'],
          ]}
        />
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ T25-1 · slide 61 */

const REG_W = 284
const REG_H = 238

/** A registry box: its padlock and name on top, its contents under. */
function Registry({ open, name, children, style }: { open: boolean; name: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <Tile w={REG_W} h={REG_H} className="flex flex-col items-center gap-2 !p-3" style={style}>
      <div className="flex items-center gap-2.5">
        <ClayPadlock w={26} open={open} />
        <span className="font-heading text-[19px] font-semibold leading-none" style={{ color: colors.ink }}>
          {name}
        </span>
      </div>
      {children}
    </Tile>
  )
}

function RegistriesFigure() {
  const t = useLoop(5200, { mode: 'sawtooth', still: 0.5 })
  const L: [[number, number], [number, number]] = [[160, 256], [282, 300]]
  const R: [[number, number], [number, number]] = [[474, 256], [352, 300]]
  return (
    <>
      <At x={18} y={14}>
        <Registry open name="Public registry">
          <div className="flex flex-1 items-center">
            <LogoCell name="docker" caption="Docker Hub" slot={64} scale={1.6} />
          </div>
        </Registry>
      </At>
      <At x={332} y={14}>
        <Registry open={false} name="Private registry">
          <div className="flex w-full flex-col gap-1.5 pl-2">
            {(
              [
                ['aws', 'Amazon ECR'],
                ['azure', 'Azure Container Registry'],
                ['gcp', 'Google Artifact Registry'],
              ] as [MarkName, string][]
            ).map(([m, n]) => (
              <div key={n} className="flex items-center gap-2.5">
                <span className="grid w-[64px] shrink-0 place-items-center" style={{ height: 30 }}>
                  <Logo name={m} h={{ aws: 26, azure: 16, gcp: 9 }[m as 'aws']} />
                </span>
                <span className="whitespace-nowrap text-[14px] font-medium leading-tight" style={{ color: colors.ink }}>
                  {n}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-auto w-full rounded-[10px] px-3 py-1.5 text-center" style={{ background: colors.surface2, boxShadow: 'inset 0 0 0 1.5px #C3D3F0' }}>
            <span className="font-heading text-[15px] font-semibold" style={{ color: colors.brandDark }}>
              Harbor
            </span>
          </div>
        </Registry>
      </At>
      <Arrow x1={L[0][0]} y1={L[0][1]} x2={L[1][0]} y2={L[1][1]} />
      <Arrow x1={R[0][0]} y1={R[0][1]} x2={R[1][0]} y2={R[1][1]} />
      <Dot a={L[0]} b={L[1]} t={within(t, 0.05, 0.4)} on={t > 0.03 && t < 0.43} />
      <Dot a={R[0]} b={R[1]} t={within(t, 0.55, 0.9)} on={t > 0.53 && t < 0.93} />
      <At x={317} y={304} cx>
        <div className="flex items-center gap-2 rounded-pill px-4 py-2" style={{ background: colors.brand, boxShadow: `0 10px 22px -12px ${colors.brand}` }}>
          <span className="font-mono text-[17px] font-semibold" style={{ color: colors.white, fontVariantLigatures: 'none' }}>
            docker pull
          </span>
          <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden>
            <path d="M1 7 H17 M12 2 L18 7 L12 12" stroke="#FFFFFF" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </At>
    </>
  )
}

export function Registries({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="T25-1"
      kicker="Public Vs Private"
      title="Image Registries"
      lead="A registry stores and distributes container images; which kind is used decides who is able to pull a given image"
      lesson={lesson}
      points={[
        'Public registry: Docker Hub, where public images can generally be pulled by anyone',
        'Private registry: Amazon ECR, Azure Container Registry, Google Artifact Registry',
        "Self-hosted option: Harbor, run inside an organisation's own network",
        'Chosen for security, compliance or protecting proprietary images',
      ]}
      figure={<RegistriesFigure />}
    />
  )
}

/* ------------------------------------------------------------------ T25-AN · slide 62 */

/*
  Two rows in both scenes: the open thing on top, the locked thing below;
  the thing on the left, what reaches it on the right.
    top     library  <- any visitor        | public registry -> image, padlock open
    bottom  cupboard <- employee's key     | private registry <- authentication
*/
const AL = 128
const AR = 352
const LT = 104
const LB = 290

function LibraryScene() {
  const t = useLoop(6400, { mode: 'sawtooth', still: 0.98 })
  const walk = within(t, 0.06, 0.4)
  const key = within(t, 0.52, 0.78)
  const open = STILL ? 1 : within(t, 0.8, 0.88)
  return (
    <>
      <At x={AL} y={22} cx>
        <Library w={168} />
      </At>
      <At x={AL} y={162} cx>
        <Label tone="muted" size={15}>Library</Label>
      </At>
      <At x={AR - walk * 60} y={28} cx style={{ opacity: STILL ? 1 : 1 - within(t, 0.42, 0.5) }}>
        <div className="flex flex-col items-center gap-[8px]">
          <Icon3D name="man-pro" w={76} shadow={false} />
          <Label tone="muted" size={15}>Any visitor</Label>
        </div>
      </At>

      <At x={AL} y={212} cx>
        <Cupboard w={128} open={open} />
      </At>
      <At x={AL} y={350} cx>
        <Label tone="muted" size={15}>Office cupboard</Label>
      </At>
      <At x={AR - key * 80} y={276} cx style={{ opacity: STILL ? 1 : 1 - within(t, 0.8, 0.86) }}>
        <div className="flex flex-col items-center gap-[40px]">
          <Key w={76} />
          <Label tone="muted" size={15}>{"Employee's key"}</Label>
        </div>
      </At>
    </>
  )
}

function RegistryAccessScene() {
  const t = useLoop(6400, { mode: 'sawtooth', still: 0.98 })
  const pub = within(t, 0.06, 0.4)
  const auth = within(t, 0.52, 0.78)
  const unlocked = STILL ? true : t > 0.8
  return (
    <>
      <At x={AL} y={LT} cx cy>
        <Tile w={196} h={104} className="flex flex-col items-center justify-center gap-2">
          <ClayPadlock w={34} open />
          <span className="font-heading text-[18px] font-semibold leading-none" style={{ color: colors.ink }}>Public registry</span>
        </Tile>
      </At>
      <Arrow x1={AL + 104} y1={LT} x2={AR - 46} y2={LT} />
      {!STILL && (
        <At x={AL + 104 + pub * (AR - 46 - AL - 104)} y={LT} cx cy style={{ opacity: t > 0.04 && t < 0.44 ? 1 : 0, transition: 'opacity 200ms' }}>
          <ImageChip />
        </At>
      )}
      <At x={AR + 6} y={LT} cx cy>
        <ImageChip />
      </At>

      <At x={AL} y={LB} cx cy>
        <Tile w={196} h={104} className="flex flex-col items-center justify-center gap-2">
          <ClayPadlock w={34} open={unlocked} />
          <span className="font-heading text-[18px] font-semibold leading-none" style={{ color: colors.ink }}>Private registry</span>
        </Tile>
      </At>
      <Arrow x1={AR - 72} y1={LB} x2={AL + 104} y2={LB} />
      <At x={AR + 10} y={LB} cx cy>
        <Tile w={140} h={68} lit={!STILL && auth > 0.98 && t < 0.9} className="grid place-items-center">
          <Key w={58} tone={colors.brand} />
        </Tile>
      </At>
      <Dot a={[AR - 72, LB]} b={[AL + 104, LB]} t={auth} on={t > 0.5 && t < 0.8} tone={colors.brand} />
      <At x={AR + 10} y={LB + 46} cx>
        <Label tone="muted" size={15}>Authentication</Label>
      </At>
    </>
  )
}

export function LibraryAnalogy({ lesson }: { lesson: string }) {
  return (
    <IsoAnalogy
      id="T25-AN"
      kicker="Public Vs Private"
      title="A library or an office cupboard"
      text="A public registry is like a library open to any visitor, while a private registry is like an office cupboard that opens only with an employee's key, exactly as a private registry demands authentication before an image can be pulled"
      lesson={lesson}
      bare
      h={AN_STAGE_H}
      everyday={{ label: 'A library or an office cupboard', scene: <LibraryScene /> }}
      cloud={{ label: 'Public and private registries', scene: <RegistryAccessScene /> }}
    />
  )
}

/* ------------------------------------------------------------------ T26-1 · slide 63 */

const PUSH_X = [222, 380, 538] as const
const LINE_Y = 132
const TAG_W = 128

/** A tag on a push: the card's tag string in monospace, or a blank tag shape where the card names none. */
function TagSlot({ text, kind = 'tag' }: { text?: string; kind?: 'tag' | 'env' }) {
  const filled = text !== undefined
  return (
    <div
      className="grid h-[30px] place-items-center rounded-[8px] font-mono text-[14px] font-semibold leading-none"
      style={{
        width: TAG_W,
        fontVariantLigatures: 'none',
        background: filled ? (kind === 'env' ? '#E9F8EF' : '#FFF1D6') : 'transparent',
        color: kind === 'env' ? '#137A3A' : '#9A5B00',
        boxShadow: filled ? `inset 0 0 0 1.5px ${kind === 'env' ? colors.success : '#F5D9A6'}` : 'none',
        border: filled ? 'none' : `1.5px dashed ${colors.line}`,
      }}
    >
      {text ?? ''}
    </div>
  )
}

const TAGS: { version?: string; hash?: string; env?: string }[] = [{}, { env: 'app:prod' }, { version: 'app:2.3.1', hash: 'app:a1b2c3d', env: 'app:staging' }]

function TaggingFigure() {
  /* `newest` is the push that just landed; held on the third on harness URLs */
  const newest = useCycle(3, 2400, 2)
  return (
    <>
      <At x={20} y={18}>
        <Label tone="brand" strong size={16} raised>
          Repository
        </Label>
      </At>
      {/* the timeline */}
      <Arrow x1={150} y1={LINE_Y} x2={612} y2={LINE_Y} tone={colors.line} width={3} />
      {/* row names, from the points */}
      <At x={20} y={172}>
        <span className="text-[14px] font-medium" style={{ color: colors.muted }}>Version tag</span>
      </At>
      <At x={20} y={212}>
        <span className="text-[14px] font-medium" style={{ color: colors.muted }}>Immutable tag</span>
      </At>
      <At x={20} y={252}>
        <span className="text-[14px] font-medium" style={{ color: colors.muted }}>Environment tags</span>
      </At>
      {PUSH_X.map((x, i) => {
        const on = i <= newest
        const tg = TAGS[i]
        return (
          <div key={x} style={{ opacity: on ? 1 : 0.18, transition: `opacity 420ms ${EASE}` }}>
            <At x={x} y={LINE_Y} cx cy>
              <span className="block rounded-full" style={{ width: 22, height: 22, background: colors.brand, boxShadow: `0 0 0 4px ${colors.white}, 0 6px 14px -6px ${colors.brand}` }} />
            </At>
            <At x={x} y={166} cx>
              <TagSlot text={tg.version} />
            </At>
            <At x={x} y={206} cx>
              <TagSlot text={tg.hash} />
            </At>
            {tg.env && (
              <At x={x} y={246} cx>
                <TagSlot text={tg.env} kind="env" />
              </At>
            )}
          </div>
        )
      })}
      {/* latest: moves with every push */}
      <At x={PUSH_X[newest]} y={56} cx style={{ transition: `left 620ms ${EASE}` }}>
        <div className="flex flex-col items-center gap-1">
          <Label tone="solid" strong size={15} mono>
            latest
          </Label>
          <svg width="14" height="22" viewBox="0 0 14 22" aria-hidden>
            <path d="M7 1 V16 M2 11 L7 17 L12 11" stroke={colors.brand} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </At>
    </>
  )
}

export function Tagging({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="T26-1"
      kicker="Tagging Strategy"
      title="Naming Image Versions"
      lead="Image tags provide human-readable names for versions, while digests identify exact image content for reliable redeployment"
      lesson={lesson}
      points={[
        <>
          Semantic versioning: major.minor.patch, for example <Mono>app:2.3.1</Mono>
        </>,
        <>
          <Mono>latest</Mono> tag: moves with every push, unsafe for production rollback
        </>,
        <>
          Immutable tag: git-commit hash, for example <Mono>app:a1b2c3d</Mono>, never overwritten
        </>,
        <>
          Environment tags: <Mono>app:staging</Mono>, <Mono>app:prod</Mono> mark the pipeline stage
        </>,
      ]}
      figure={<TaggingFigure />}
      figH={310}
    />
  )
}

/* ------------------------------------------------------------------ X1 · slide 64 */

/* The spec gives X1 no kicker. The header draws its divider whenever `kicker != null`, so an
   empty string would leave a divider struck through the title: pass no kicker at all. */
const NO_KICKER = undefined as unknown as string

export function HeadsUp({ lesson }: { lesson: string }) {
  return (
    <Card id="X1" kicker={NO_KICKER} title="Heads-Up: Start Your AWS Account Setup Now" lesson={lesson}>
      <div className="flex items-center gap-6 rounded-[22px] px-8 py-7" style={{ width: BOX_W, background: 'linear-gradient(135deg, #FFF7EC 0%, #FFEBD4 100%)', boxShadow: `inset 6px 0 0 0 ${colors.accent}, inset 0 0 0 1px #F8D9B4, 0 16px 32px -22px rgba(229,115,42,0.55)` }}>
        <span className="grid h-[84px] w-[84px] shrink-0 place-items-center rounded-[20px]" style={{ background: colors.white, boxShadow: 'inset 0 0 0 1px #F8D9B4, 0 8px 18px -12px rgba(16,32,58,0.4)' }}>
          <Logo name="aws" h={56} />
        </span>
        <p className="m-0 text-[22px] leading-relaxed" style={{ color: colors.ink }}>
          Why now: AWS account setup is required before Practicals. Account verification may take a day or more. A free-tier account is sufficient
        </p>
      </div>
    </Card>
  )
}
