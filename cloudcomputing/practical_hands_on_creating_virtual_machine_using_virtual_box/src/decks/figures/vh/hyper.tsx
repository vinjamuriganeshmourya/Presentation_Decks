import type { CSSProperties, ReactNode } from 'react'
import { Cpu, HardDrive, MemoryStick, Network } from 'lucide-react'
import { colors } from '@/design/tokens'
import { Callout, DataTable } from '@/ui'
import { Arrow, At, BOX_W, Card, Stage, Traveller, useCycle, useLoop } from '../scene'
import { TILE_SKIN } from '../card'
import { Idling, FACE_WHOLE } from '../Cast'
import { ARJUN, TENANTS } from '../people'
import { ClayBar, ClayMeter, ClayMonitor, ClayNo, ClayOsWindow, ElectricMeter, Icon3D, LAB } from '../d3/kit'
import { lead, PointsFigure } from '../iso/frames'
import { Logo, Marker, PA_H, PA_W, PairAnalogy } from './frames'
import apartmentCutaway from './img/apartment-isometric-cutaway.png'
import { CpuChip } from './tech'

/**
 * SECTION 2 · HYPERVISORS (reference frames 19 to 24), in session 2's 3D
 * finish: glossy library renders and session 1's clay objects on their ground
 * shadows, the layers as raised slabs (`ClayBar`): brand blue for the
 * hypervisor, the template's deep navy for the hardware, teal for the host OS
 * that only the hosted stack has. Labels are DOM.
 *
 * Every figure runs ONE loop whose motion is the claim:
 *   19  a request leaves the hardware, passes the hypervisor's gears, and
 *       reaches each OS screen in turn
 *   20  the hypervisor hands out CPU, memory, storage and network, one at a time
 *   21  the three pairs light in turn; the office, the meters, the leak held in
 *       one flat, beside the hypervisor, the VM meters, the crash held in one VM
 *   22  a call drops from an App straight through the hypervisor to the hardware
 *   23  the same call, but it passes the host OS on the way
 *   24  both calls side by side on one clock, so the hosted one arrives later
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

/** A small raised chip with centred words: an `App` or an `OS` box inside a VM. */
function Chip({ children, tone = 'app', h = 34, size = 16, lit = false }: { children: ReactNode; tone?: 'app' | 'os'; h?: number; size?: number; lit?: boolean }) {
  const look: CSSProperties =
    tone === 'app'
      ? { background: 'linear-gradient(180deg, #FFFFFF 0%, #F4F7FE 100%)', boxShadow: `inset 0 0 0 ${lit ? 2 : 1}px ${lit ? colors.accent : '#CFDCF5'}, 0 4px 10px -8px rgba(31,64,140,0.5)` }
      : { background: 'linear-gradient(180deg, #E9F0FF 0%, #D6E3FB 100%)', boxShadow: `inset 0 0 0 ${lit ? 2 : 1}px ${lit ? colors.accent : '#B9CCF2'}, 0 4px 10px -8px rgba(31,64,140,0.5)` }
  return (
    <div className="grid place-items-center rounded-[10px] font-heading font-semibold leading-none" style={{ height: h, fontSize: size, color: colors.ink, transition: `box-shadow 300ms ${EASE}`, ...look }}>
      {children}
    </div>
  )
}

/** A VM: a raised tile holding its App on its OS, with an optional name on top. */
function VmBox({ w, name, app = 'App', os = 'OS', lit = false, litRow = -1, chipH = 34, size = 16 }: { w: number; name?: string; app?: string; os?: string; lit?: boolean; litRow?: number; chipH?: number; size?: number }) {
  return (
    <div
      className="flex flex-col gap-1.5 rounded-[14px] p-2"
      style={{
        width: w,
        ...TILE_SKIN,
        boxShadow: `${TILE_SKIN.boxShadow}${lit ? `, 0 0 0 3px ${colors.brand}55` : ''}`,
        transform: lit ? 'translateY(-3px)' : 'none',
        transition: `all 420ms ${EASE}`,
      }}
    >
      {name && (
        <div className="text-center font-heading text-[16px] font-bold leading-tight" style={{ color: colors.brandDark }}>
          {name}
        </div>
      )}
      <Chip h={chipH} size={size} lit={litRow === 0}>{app}</Chip>
      <Chip h={chipH} size={size} tone="os" lit={litRow === 1}>{os}</Chip>
    </div>
  )
}

/** A layer slab with its name: a raised `ClayBar` in the layer's colour, ringed when a call passes through it. */
function Layer({ w, h = 40, fill, text, lit = false, size = 17 }: { w: number; h?: number; fill: string; text: string; lit?: boolean; size?: number }) {
  return (
    <div className="rounded-[16px]" style={{ width: w, boxShadow: lit ? `0 0 0 3px ${colors.accent}, 0 10px 22px -12px ${colors.accent}` : '0 10px 20px -14px rgba(16,32,58,0.55)', transition: `box-shadow 300ms ${EASE}` }}>
      <ClayBar w={w} h={h} fill={fill}>
        <span className="font-heading font-semibold" style={{ fontSize: size, color: colors.white }}>
          {text}
        </span>
      </ClayBar>
    </div>
  )
}

/** The call: an amber bead that a stack's loop places by hand (rAF-driven, so no transition). */
function Bead({ x, y, on = true }: { x: number; y: number; on?: boolean }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute rounded-full"
      style={{ left: x - 8, top: y - 8, width: 16, height: 16, background: colors.accent, boxShadow: `0 0 0 4px ${colors.accent}40, 0 4px 10px -2px ${colors.accentDark}`, opacity: on ? 1 : 0, transition: 'opacity 200ms' }}
    />
  )
}

/* ------------------------------------------------------------------ the stack diagram (22, 23, 24) */

type StackLayer = { text: string; fill: string }

/**
 * The TR's stack, bottom to top: `layers` (listed top to bottom), then `vms`
 * VM tiles of App on OS. A call (the bead) drops from the active VM's App to
 * the hardware, lighting each row it passes; `u` is its progress, 0 to 1,
 * at constant speed, so a taller stack takes longer.
 */
const VM_H = 98
const ROW_H = 40
const ROW_GAP = 10
function stackHeight(nLayers: number) {
  return VM_H + ROW_GAP + nLayers * (ROW_H + ROW_GAP) - ROW_GAP
}
function StackDiagram({ w, vms, layers, active, u, size = 17, appSize = 16 }: { w: number; vms: number; layers: StackLayer[]; active: number; u: number; size?: number; appSize?: number }) {
  const gap = 10
  const vw = (w - gap * (vms - 1)) / vms
  /* the stops the call passes, top to bottom: the App chip, the OS chip, then each layer's middle */
  const appY = 8 + 17
  const osY = 8 + 34 + 6 + 17
  const layerY = layers.map((_, i) => VM_H + ROW_GAP + i * (ROW_H + ROW_GAP) + ROW_H / 2)
  const stops = [appY, osY, ...layerY]
  const pos = u * (stops.length - 1)
  const seg = Math.min(stops.length - 2, Math.floor(pos))
  const f = pos - seg
  const y = stops[seg] + (stops[seg + 1] - stops[seg]) * f
  const at = Math.round(pos) // the row the bead is on
  const x = active * (vw + gap) + vw * 0.22
  return (
    <div className="relative" style={{ width: w, height: stackHeight(layers.length) }}>
      <div className="flex" style={{ gap }}>
        {Array.from({ length: vms }, (_, i) => (
          <VmBox key={i} w={vw} chipH={34} size={appSize} lit={i === active} litRow={i === active ? at : -1} />
        ))}
      </div>
      <div className="flex flex-col" style={{ marginTop: ROW_GAP, gap: ROW_GAP }}>
        {layers.map((l, i) => (
          <Layer key={l.text} w={w} h={ROW_H} fill={l.fill} text={l.text} size={size} lit={at === i + 2} />
        ))}
      </div>
      <Bead x={x} y={y} />
    </div>
  )
}

const HYP = colors.brand
const HW = colors.brandDeep
const HOST = colors.teal

/**
 * One call per VM in turn: the loop's lap is cut in three, and in each third
 * the bead drops from that VM's App to the hardware and rests there a moment.
 * Held on harness URLs with the bead resting on the hardware under VM 1.
 */
function useStackCall(n = 3, lapMs = 3000, still = 0.3) {
  const t = useLoop(lapMs * n, { mode: 'sawtooth', still, steps: 90 * n })
  const k = Math.min(n - 1, Math.floor(t * n))
  const local = t * n - k
  return { active: k, u: within(local, 0.08, 0.72) }
}

/* ================================================================== 19 · role and function */

const L19 = 'A hypervisor, also called a Virtual Machine Monitor (VMM), is a thin layer of software that sits between physical hardware and one or more virtual machines (VMs).'

/**
 * The TR's own diagram, redrawn: the hardware (a server stack), an arrow into
 * the hypervisor's gears, three arrows out to three OS screens. A call runs
 * the path and lights each screen in turn.
 */
/**
 * The physical hardware, drawn (review 2026-10-28: a new hardware visual, the
 * server-stack render left as it was): a board carrying the CPU, two memory
 * sticks and a disk, the three things a hypervisor hands out.
 */
function HardwareBoard() {
  const ram = (
    <span aria-hidden className="relative block rounded-[3px]" style={{ width: 13, height: 58, background: 'linear-gradient(90deg, #2FA36B 0%, #1E7A4F 100%)', boxShadow: '0 4px 8px -4px rgba(16,32,58,0.6)' }}>
      {[8, 20, 32, 44].map((y) => (
        <span key={y} className="absolute rounded-[1.5px]" style={{ left: 3, top: y, width: 7, height: 7, background: '#1B2A4A' }} />
      ))}
      <span className="absolute inset-x-0 bottom-0 h-[4px] rounded-b-[3px]" style={{ background: LAB.yellow }} />
    </span>
  )
  return (
    <div className="flex flex-col items-center">
      <div className="relative rounded-[14px]" style={{ width: 136, height: 104, background: `linear-gradient(160deg, #2C4FA8 0%, ${colors.brandDeep} 100%)`, boxShadow: '0 16px 24px -14px rgba(16,32,58,0.7), inset 0 1px 0 rgba(255,255,255,0.25)' }}>
        <svg aria-hidden className="absolute inset-0" width={136} height={104} viewBox="0 0 136 104">
          <path d="M 12 20 H 30 V 34 M 12 84 H 30 V 70 M 76 52 H 88 M 100 88 H 124" stroke="#5B7FD6" strokeWidth={1.6} fill="none" opacity={0.7} />
        </svg>
        <div className="absolute" style={{ left: 12, top: 18 }}>
          <CpuChip s={64} lit />
        </div>
        <div className="absolute flex gap-[5px]" style={{ left: 88, top: 12 }}>
          {ram}
          {ram}
        </div>
        <span aria-hidden className="absolute rounded-[5px]" style={{ left: 86, top: 78, width: 40, height: 16, background: 'linear-gradient(180deg, #E4ECFC 0%, #AFC0DE 100%)', boxShadow: '0 3px 6px -3px rgba(16,32,58,0.6)' }}>
          <span className="absolute rounded-full" style={{ right: 5, top: 5, width: 6, height: 6, background: colors.success }} />
        </span>
      </div>
    </div>
  )
}

function VmmScene() {
  const k = useCycle(3, 2400, 1)
  const HX = 92 // hardware centre
  const GX = 300 // gears centre
  const MX = 520 // monitors centre
  const MY = [64, 166, 268] // monitor centres
  const CY = 166
  return (
    <>
      <At x={HX} y={92} cx>
        <HardwareBoard />
      </At>
      <At x={HX} y={232} cx>
        <span className="font-heading text-[18px] font-bold" style={{ color: colors.ink }}>Hardware</span>
      </At>
      <Arrow x1={166} y1={CY} x2={226} y2={CY} tone={colors.ink} />
      <At x={GX} y={100} cx>
        <div className="relative" style={{ width: 130, height: 126 }}>
          <div className="absolute" style={{ left: 0, top: 10 }}>
            <Icon3D name="gear" w={92} alt="Hypervisor" shadow={false} />
          </div>
          <div className="absolute" style={{ left: 78, top: 0 }}>
            <Icon3D name="gear" w={52} shadow={false} />
          </div>
          <div className="absolute" style={{ left: 70, top: 64 }}>
            <Icon3D name="gear" w={56} shadow={false} />
          </div>
        </div>
      </At>
      <At x={GX} y={232} cx>
        <span className="font-heading text-[18px] font-bold" style={{ color: colors.ink }}>Hypervisor</span>
      </At>
      {MY.map((y, i) => (
        <Arrow key={i} x1={378} y1={CY} x2={MX - 58} y2={y} tone={colors.ink} />
      ))}
      {MY.map((y, i) => (
        <div key={i}>
          <At x={MX} y={y - 40} cx style={{ transform: `translateX(-50%) ${i === k ? 'translateY(-3px)' : ''}`, transition: `transform 420ms ${EASE}` }}>
            <ClayMonitor w={92} lit={i === k} />
          </At>
          <At x={MX + 58} y={y - 14}>
            <span className="font-heading text-[18px] font-bold" style={{ color: i === k ? colors.brandDark : colors.ink, transition: `color 300ms ${EASE}` }}>OS</span>
          </At>
        </div>
      ))}
      <Traveller k={k} run path={[[156, CY], [222, CY], [GX, CY], [378, CY], [MX - 62, MY[k]]]} dur={1.6} />
    </>
  )
}

export function Vmm({ lesson }: { lesson: string }) {
  const FW = 640
  return (
    <Card id="Vmm" kicker={'Hypervisor And VMM'} title={'Role And Function'} lead={lead(L19)} lesson={lesson}>
      <div className="flex items-center" style={{ width: BOX_W, gap: 24 }}>
        <Stage w={FW} h={330} active={false}>
          <VmmScene />
        </Stage>
        <div className="flex flex-col gap-3" style={{ width: BOX_W - FW - 24 }}>
          <Callout kind="info" title="A VM" asStep={false} className="!p-4 [&_p]:text-[17px] [&>div>div]:text-[17px]">
            A software-based emulation of a physical computer, running its own guest OS and applications
          </Callout>
          <Callout kind="note" title="The hypervisor" asStep={false} className="!p-4 [&_p]:text-[17px] [&>div>div]:text-[17px]">
            Creates each VM and controls how it accesses the underlying physical hardware
          </Callout>
        </div>
      </div>
    </Card>
  )
}

/* ================================================================== 20 · what a hypervisor does */

const RES = [
  { name: 'CPU', Icon: Cpu },
  { name: 'Memory', Icon: MemoryStick },
  { name: 'Storage', Icon: HardDrive },
  { name: 'Network', Icon: Network },
]

/**
 * The TR's single diagram: three VMs (App on Guest OS n) on the hypervisor,
 * arrows from the hypervisor to each resource type, the physical hardware
 * under them. The hypervisor hands out one resource at a time.
 */
function RoleScene() {
  const k = useCycle(4, 2400, 1)
  const W = 586
  const X0 = 24
  const vw = (W - 2 * 14) / 3
  const rw = (W - 3 * 14) / 4
  const HY = 154
  const RY = 252
  const rx = (i: number) => X0 + i * (rw + 14) + rw / 2
  return (
    <>
      <At x={X0} y={22}>
        <div className="flex" style={{ gap: 14 }}>
          {[1, 2, 3].map((n) => (
            <VmBox key={n} w={vw} name={`VM ${n}`} os={`Guest OS ${n}`} chipH={30} />
          ))}
        </div>
      </At>
      <At x={X0} y={HY}>
        <Layer w={W} h={44} fill={HYP} text="Hypervisor (VMM)" size={18} />
      </At>
      {RES.map((_, i) => (
        <Arrow key={i} x1={rx(i)} y1={HY + 50} x2={rx(i)} y2={RY - 6} dashed tone={colors.brand} />
      ))}
      {RES.map(({ name, Icon }, i) => (
        <At key={name} x={X0 + i * (rw + 14)} y={RY}>
          <div
            className="flex flex-col items-center justify-center gap-1 rounded-[14px]"
            style={{
              width: rw,
              height: 70,
              background: `linear-gradient(180deg, #123A66 0%, ${HW} 100%)`,
              boxShadow: i === k ? `0 0 0 3px ${colors.accent}, 0 12px 22px -12px ${colors.accent}` : '0 12px 22px -14px rgba(16,32,58,0.7), inset 0 1px 0 rgba(255,255,255,0.18)',
              transform: i === k ? 'translateY(-4px)' : 'none',
              transition: `all 420ms ${EASE}`,
            }}
          >
            <Icon size={20} color={colors.white} strokeWidth={2} aria-hidden />
            <span className="font-heading text-[17px] font-semibold" style={{ color: colors.white }}>{name}</span>
          </div>
        </At>
      ))}
      <At x={X0 + W / 2} y={RY + 82} cx>
        <span className="font-heading text-[17px] font-bold tracking-[0.06em]" style={{ color: colors.ink }}>PHYSICAL HARDWARE</span>
      </At>
      <Traveller k={k} run path={[[rx(k), HY + 46], [rx(k), RY - 4]]} dur={1.2} />
    </>
  )
}

export function VmmRole({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="VmmRole"
      kicker={'Hypervisor And VMM'}
      title={'What Does A Hypervisor Do?'}
      lesson={lesson}
      points={['Creates and manages VMs', 'Allocates CPU, memory, storage, and network resources', 'Controls how VMs access physical hardware', 'Keeps VMs isolated from one another']}
      figure={<RoleScene />}
      figH={380}
    />
  )
}

/* ================================================================== 21 · the apartment analogy */

/*
 * User, 2026-10-27: Character Lab tenants, head and face only, in small round
 * frames, one in each unit; the scene must read at a glance. Both scenes share
 * ONE plan so the mapping is visible: three rows (flats / VMs) on a frame
 * (building / server), the bottom row is the allocator (management office /
 * hypervisor), a riser runs from it to every row, each row has its own meter on
 * the right, and the middle row holds the leak / the crash inside its walls.
 *   lit 0  a bead climbs the riser from the allocator to each row; the
 *          allocator row rings
 *   lit 1  every row's meter needle sweeps on its own
 *   lit 2  the middle row rings amber: the drop falls into its tray, the crash
 *          stays in its window; the other rows stay as they are
 * The characters hold one frame always (`Idling` without `alive`), so harness
 * URLs and thumbnails never stall.
 */

/*
 * Review 2026-10-28: the everyday side redrawn as an actual apartment building
 * (roof, facade, windows, balconies, the management office on the ground floor
 * with its door and sign, a meter on the wall of every flat), and the cloud
 * side drawn to match it floor for floor: the same three storeys are three VMs
 * in one server, the ground floor is the hypervisor, the wall meters are the
 * VM meters, the supply pipe is the hypervisor's allocation line.
 */

const BX = 96 // building / server left
const BW = 308 // building / server width
const ROOF_Y = 14
const WALL_Y = 30
const FL_H = 48
const flTop = (i: number) => WALL_Y + 8 + i * (FL_H + 6)
const GF_Y = flTop(3) + 2 // ground floor top
const GF_H = 50
const BASE_Y = GF_Y + GF_H // pavement / feet
const TENANT_CFG = [TENANTS[0], TENANTS[1], TENANTS[3]]

/** A tenant's face in a small round frame: white ring, soft shadow, head and hair whole. */
function FaceDisc({ cfg, d = 34, seed = 0, ring = colors.white }: { cfg: (typeof TENANTS)[number]; d?: number; seed?: number; ring?: string }) {
  const s = d / 128
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full"
      style={{ width: d, height: d, background: 'linear-gradient(180deg, #EAF1FF 0%, #CFDDF8 100%)', boxShadow: `0 0 0 2.5px ${ring}, 0 6px 12px -6px rgba(16,32,58,0.55)` }}
    >
      <div className="absolute" style={{ left: (d - 140 * s) / 2, top: -(180 * s - d) * 0.62 }}>
        <Idling cfg={cfg} scale={s} crop={FACE_WHOLE} seed={seed} breathe={false} />
      </div>
    </div>
  )
}

/** A water drop and the tray under it, drawn in the unit it sits in; `fall` 0 at the ceiling to 1 in the tray. */
function Leak({ fall, on }: { fall: number; on: boolean }) {
  return (
    <svg aria-hidden width={26} height={34} viewBox="0 0 26 34" style={{ display: 'block', overflow: 'visible' }}>
      <path d={`M 13 ${3 + 16 * fall} c -4 6 -6 9 -6 12 a 6 6 0 0 0 12 0 c 0 -3 -2 -6 -6 -12 Z`} fill={LAB.cobalt} style={{ opacity: on ? 1 - 0.6 * Math.max(0, fall - 0.85) / 0.15 : 0.85 }} />
      <ellipse cx={10} cy={8 + 16 * fall} rx={1.6} ry={2.4} fill="#FFFFFF" opacity={0.6} />
      <rect x={1} y={28} width={24} height={5} rx={2.5} fill={LAB.sky} />
      <rect x={3} y={28} width={20} height={1.5} rx={0.75} fill="#FFFFFF" opacity={0.6} />
    </svg>
  )
}

/** A framed window: white frame, sky glass, a sill under it. */
function Window({ w = 54, h = 36, children }: { w?: number; h?: number; children?: ReactNode }) {
  return (
    <div className="relative" style={{ width: w, height: h + 4 }}>
      <div className="relative grid place-items-center overflow-hidden rounded-[5px]" style={{ width: w, height: h, background: 'linear-gradient(160deg, #DDEBFF 0%, #9CC1F5 100%)', boxShadow: 'inset 0 0 0 3px #FFFFFF, 0 3px 6px -3px rgba(16,32,58,0.5)' }}>
        <span aria-hidden className="absolute" style={{ left: 5, top: 4, width: w * 0.35, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.7)' }} />
        {children}
      </div>
      <span aria-hidden className="absolute rounded-[2px]" style={{ left: -3, right: -3, bottom: 0, height: 4, background: '#B98A5E' }} />
    </div>
  )
}

/** The supply line up the left wall, from the ground floor into every storey; a bead climbs it while pair 1 is lit. */
function Supply({ on, t, tone, w = 4 }: { on: boolean; t: number; tone: string; w?: number }) {
  const x = 14
  const y0 = GF_Y + GF_H / 2
  const y1 = flTop(0) + FL_H / 2
  const y = y0 - (y0 - y1) * t
  return (
    <svg aria-hidden className="pointer-events-none absolute" style={{ left: 0, top: 0, overflow: 'visible' }} width={x + 14} height={BASE_Y}>
      <path d={`M ${x} ${y0} V ${y1}`} stroke={tone} strokeWidth={w} strokeLinecap="round" />
      {[0, 1, 2].map((r) => (
        <path key={r} d={`M ${x} ${flTop(r) + FL_H / 2} H ${x + 12}`} stroke={tone} strokeWidth={w} strokeLinecap="round" />
      ))}
      {on && <circle cx={x} cy={y} r={6} fill={colors.accent} stroke="#FFFFFF" strokeWidth={2} />}
    </svg>
  )
}

const meterValue = (lit: number, t: number, i: number) => (lit === 1 ? 0.2 + 0.6 * ((t + i * 0.37) % 1) : 0.3 + i * 0.18)
const ring = (on: boolean, tone = colors.accent) => ({ boxShadow: on ? `0 0 0 3px ${tone}` : '0 0 0 0 transparent', transition: `box-shadow 420ms ${EASE}` })

/** The drawn apartment building (replaced on slide 21 by the user's picture, 2026-10-29; kept, not mounted). */
export function ApartmentScene({ lit }: { lit: number }) {
  const t = useLoop(2400, { mode: 'sawtooth', still: 0.6 })
  return (
    <>
      {/* the pavement and two shrubs */}
      <div aria-hidden className="absolute rounded-full" style={{ left: BX - 40, top: BASE_Y, width: BW + 80, height: 8, background: 'linear-gradient(180deg, #CBD6EA, #AFC0DE)' }} />
      {[BX - 30, BX + BW + 2].map((x) => (
        <span key={x} aria-hidden className="absolute rounded-full" style={{ left: x, top: BASE_Y - 24, width: 28, height: 26, background: `radial-gradient(circle at 35% 30%, #8FD19E, ${LAB.sage} 60%, #3E8A57)` }} />
      ))}
      <At x={BX} y={0}>
        <div className="relative" style={{ width: BW, height: BASE_Y }}>
          {/* roof: parapet and a water tank */}
          <span aria-hidden className="absolute rounded-[3px]" style={{ left: BW - 78, top: ROOF_Y - 12, width: 34, height: 14, background: `linear-gradient(180deg, #9AA9C9, #5E6E94)` }} />
          <span aria-hidden className="absolute rounded-[4px]" style={{ left: -8, top: ROOF_Y, width: BW + 16, height: WALL_Y - ROOF_Y, background: 'linear-gradient(180deg, #E9782A 0%, #C45F1C 100%)', boxShadow: '0 6px 10px -6px rgba(16,32,58,0.6)' }} />
          {/* the facade */}
          <div className="absolute rounded-b-[6px]" style={{ left: 0, top: WALL_Y, width: BW, height: BASE_Y - WALL_Y, background: 'linear-gradient(180deg, #F6E3CC 0%, #E9C9A4 100%)', boxShadow: '0 18px 26px -16px rgba(16,32,58,0.55)' }} />
          {/* floor slabs between storeys */}
          {[0, 1, 2, 3].map((i) => (
            <span key={i} aria-hidden className="absolute" style={{ left: 0, top: flTop(i) - 4, width: BW, height: 3, background: '#D7B188' }} />
          ))}
          <Supply on={lit === 0} t={t} tone="#B4683A" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="absolute rounded-[8px]" style={{ left: 30, top: flTop(i), width: BW - 40, height: FL_H, ...ring(lit === 2 && i === 1) }}>
              <div className="absolute" style={{ left: 4, top: 4 }}>
                <Window>
                  <FaceDisc cfg={TENANT_CFG[i]} d={30} seed={70 + i} ring="#FFFFFF" />
                </Window>
              </div>
              <div className="absolute" style={{ left: 72, top: 4 }}>
                <Window>
                  <span aria-hidden className="absolute inset-y-[3px] left-[3px] w-[14px] rounded-[2px]" style={{ background: i === 1 ? '#F4B8C4' : '#FFE29A' }} />
                </Window>
              </div>
              {/* the flat's balcony rail */}
              <span aria-hidden className="absolute" style={{ left: 66, top: FL_H - 10, width: 70, height: 8, borderTop: '2.5px solid #8A5A33', backgroundImage: 'repeating-linear-gradient(90deg, #8A5A33 0 2px, transparent 2px 9px)' }} />
              {i === 1 ? (
                <div className="absolute" style={{ left: 150, top: 8 }}>
                  <Leak fall={lit === 2 ? t : 0} on={lit === 2} />
                </div>
              ) : (
                <div className="absolute" style={{ left: 146, top: 4 }}>
                  <Window w={44} />
                </div>
              )}
              {/* the flat's own meter, on the wall */}
              <div className="absolute rounded-[6px] p-[3px]" style={{ right: 4, top: 6, background: '#FFFFFF', boxShadow: '0 3px 6px -3px rgba(16,32,58,0.5)' }}>
                <ElectricMeter w={30} value={meterValue(lit, t, i)} />
              </div>
            </div>
          ))}
          {/* the ground floor: the management office */}
          <div className="absolute rounded-[8px]" style={{ left: 30, top: GF_Y, width: BW - 40, height: GF_H - 2, background: 'linear-gradient(180deg, #E4ECFC 0%, #C9D8F5 100%)', ...ring(lit === 0) }}>
            <div className="absolute" style={{ left: 4, top: 6 }}>
              <Window w={54} h={34}>
                <FaceDisc cfg={ARJUN} d={28} seed={74} ring="#FFFFFF" />
              </Window>
            </div>
            <span className="absolute rounded-[4px] px-2 font-heading text-[11px] font-bold tracking-[0.1em]" style={{ left: 92, top: 4, background: colors.brandDeep, color: '#FFFFFF' }}>
              OFFICE
            </span>
            <span aria-hidden className="absolute rounded-t-[6px]" style={{ left: 104, top: 22, width: 40, height: GF_H - 24, background: `linear-gradient(180deg, #4A5EB8 0%, ${LAB.navy} 100%)`, boxShadow: 'inset 0 0 0 3px #FFFFFF' }}>
              <span className="absolute rounded-full" style={{ right: 7, top: 12, width: 5, height: 5, background: LAB.yellow }} />
            </span>
            <span aria-hidden className="absolute rounded-[4px]" style={{ right: 10, top: 10, width: 74, height: 26, background: 'repeating-linear-gradient(180deg, #FFFFFF 0 4px, #DCE6FA 4px 8px)', boxShadow: '0 3px 6px -3px rgba(16,32,58,0.5)' }} />
          </div>
        </div>
      </At>
      <At x={BX - 50} y={GF_Y + 10}>
        <Marker n={1} on={lit === 0} />
      </At>
      <At x={BX + BW + 10} y={flTop(0) + 8}>
        <Marker n={2} on={lit === 1} />
      </At>
      <At x={BX - 50} y={flTop(1) + 8}>
        <Marker n={3} on={lit === 2} />
      </At>
    </>
  )
}

function HypervisorScene({ lit }: { lit: number }) {
  const t = useLoop(2400, { mode: 'sawtooth', still: 0.6 })
  return (
    <>
      <div aria-hidden className="absolute rounded-full" style={{ left: BX - 40, top: BASE_Y, width: BW + 80, height: 8, background: 'linear-gradient(180deg, #CBD6EA, #AFC0DE)' }} />
      <At x={BX} y={0}>
        <div className="relative" style={{ width: BW, height: BASE_Y }}>
          {/* the server's top bezel, vents where the roof is */}
          <div aria-hidden className="absolute flex items-center gap-[5px] rounded-[4px] px-3" style={{ left: -8, top: ROOF_Y, width: BW + 16, height: WALL_Y - ROOF_Y, background: 'linear-gradient(180deg, #34477E 0%, #1B2A4A 100%)', boxShadow: '0 6px 10px -6px rgba(16,32,58,0.6)' }}>
            {Array.from({ length: 22 }, (_, i) => (
              <span key={i} className="block h-[4px] w-[8px] rounded-full" style={{ background: 'rgba(255,255,255,0.22)' }} />
            ))}
            <span className="ml-auto block h-[7px] w-[7px] rounded-full" style={{ background: colors.success, boxShadow: `0 0 6px ${colors.success}` }} />
          </div>
          {/* the chassis */}
          <div className="absolute rounded-b-[8px]" style={{ left: 0, top: WALL_Y, width: BW, height: BASE_Y - WALL_Y, background: `linear-gradient(180deg, #1B4A7E 0%, ${HW} 100%)`, boxShadow: '0 18px 26px -16px rgba(16,32,58,0.65)' }} />
          <Supply on={lit === 0} t={t} tone={LAB.sky} />
          {[0, 1, 2].map((i) => (
            <div key={i} className="absolute flex items-center gap-2.5 rounded-[8px] pl-2 pr-1" style={{ left: 30, top: flTop(i), width: BW - 40, height: FL_H, background: 'linear-gradient(180deg, #FFFFFF 0%, #EDF3FD 100%)', ...ring(lit === 2 && i === 1) }}>
              <ClayOsWindow w={40} k={i} />
              <span className="font-heading text-[14px] font-bold" style={{ color: colors.ink }}>
                VM {i + 1}
              </span>
              <span className="flex flex-col gap-[5px]">
                <span aria-hidden className="block h-[6px] w-[54px] rounded-full" style={{ background: '#D6E3FB' }} />
                <span aria-hidden className="block h-[6px] w-[38px] rounded-full" style={{ background: '#D6E3FB' }} />
              </span>
              {i === 1 && (
                <div style={{ transform: lit === 2 ? 'scale(1.12)' : 'none', transition: `transform 420ms ${EASE}` }}>
                  <ClayNo w={24} />
                </div>
              )}
              <div className="ml-auto rounded-[6px] p-[3px]" style={{ background: '#FFFFFF', boxShadow: '0 3px 6px -3px rgba(16,32,58,0.5)' }}>
                <ClayMeter w={30} value={meterValue(lit, t, i)} />
              </div>
            </div>
          ))}
          <div className="absolute rounded-[12px]" style={{ left: 30, top: GF_Y, ...ring(lit === 0) }}>
            <ClayBar w={BW - 40} h={GF_H - 2} fill={HYP}>
              <span className="font-heading text-[16px] font-bold text-white">Hypervisor</span>
            </ClayBar>
          </div>
        </div>
      </At>
      <At x={BX - 50} y={GF_Y + 10}>
        <Marker n={1} on={lit === 0} />
      </At>
      <At x={BX + BW + 10} y={flTop(0) + 8}>
        <Marker n={2} on={lit === 1} />
      </At>
      <At x={BX - 50} y={flTop(1) + 8}>
        <Marker n={3} on={lit === 2} />
      </At>
    </>
  )
}

/* ================================================================== 21 · the everyday card: the supplied picture */

/**
 * The user's own picture for slide 21's EVERYDAY card (2026-10-30, replacing the 2026-10-29 leak picture on the
 * user's word: "replace the left side image ... don't add anything else"): `Isometric Smart Apartment Utilities
 * Cutaway.png`, its white margin trimmed (`img/apartment-isometric-cutaway.png`, 1513 x 1001), fitted to the card box
 * at its own shape (contained, never stretched; its white ground multiplied into the plate), imported so the single
 * file inlines it. The three markers sit on the picture where the pairs point: 1 the management office, 2 the meters
 * on the wall of every flat, 3 one flat (this picture draws no leak, so the marker sits inside one flat).
 */
const AL_RATIO = 1513 / 1001
const AL_W = Math.min(PA_W, PA_H * AL_RATIO)
const AL_H = AL_W / AL_RATIO

function ApartmentPictureScene({ lit }: { lit: number }) {
  /* whole pixels: a fractional offset drifts under Firefox's zoom at 1.5x (fit-check, 2026-10-29) */
  const at = (fx: number, fy: number) => ({ left: Math.round((PA_W - AL_W) / 2 + fx * AL_W - 15), top: Math.round((PA_H - AL_H) / 2 + fy * AL_H - 15) })
  return (
    <>
      <img src={apartmentCutaway} alt="An apartment building cutaway with its management office, an electricity meter and a water meter for each flat, and the mains outside" draggable={false} className="absolute inset-0 block h-full w-full select-none" style={{ objectFit: 'contain', mixBlendMode: 'multiply' }} />
      <div className="absolute" style={at(0.05, 0.38)}><Marker n={1} on={lit === 0} /></div>
      <div className="absolute" style={at(0.64, 0.12)}><Marker n={2} on={lit === 1} /></div>
      <div className="absolute" style={at(0.5, 0.4)}><Marker n={3} on={lit === 2} /></div>
    </>
  )
}

const PAIRS: [string, string][] = [
  ['Management office', 'Hypervisor'],
  ['A meter for each flat', 'CPU and memory for each VM'],
  ['A leak stays in one flat', 'A crash stays in one VM'],
]

export function VmmAnalogy({ lesson }: { lesson: string }) {
  return (
    <PairAnalogy
      id="VmmAnalogy"
      kicker={'Hypervisor And VMM'}
      title={'An Apartment Management Office'}
      lesson={lesson}
      everyday={{ label: 'An apartment building', scene: (lit) => <ApartmentPictureScene lit={lit} /> }}
      cloud={{ label: 'A hypervisor', scene: (lit) => <HypervisorScene lit={lit} /> }}
      pairs={PAIRS}
    />
  )
}

/* ================================================================== 22 · type 1 */

const L22 = 'A Type 1 hypervisor runs directly on physical hardware, with no host operating system beneath it, and behaves as a thin operating system itself.'

function Type1Scene() {
  const { active, u } = useStackCall()
  const W = 420
  return (
    <>
      <At x={(586 - W) / 2} y={24}>
        <StackDiagram w={W} vms={3} active={active} u={u} layers={[{ text: 'Hypervisor (VMM)', fill: HYP }, { text: 'Hardware', fill: HW }]} />
      </At>
      <At x={24} y={24 + stackHeight(2) + 24} w={586 - 48}>
        <div className="flex items-end justify-center" style={{ gap: 34 }}>
          <Logo name="vmware" h={20} caption="ESXi" />
          <Logo name="hyperv" h={28} caption="Hyper-V" />
          <Logo name="kvm" h={28} caption="KVM" />
          <Logo name="aws" h={24} caption="Nitro" />
        </div>
      </At>
    </>
  )
}

export function Type1({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="Type1"
      kicker={'Type 1 Bare-Metal'}
      title={'Runs On Hardware'}
      lead={L22}
      lesson={lesson}
      pointsW={500}
      points={['Examples: VMware ESXi, Microsoft Hyper-V, KVM', 'AWS EC2 runs on the Nitro hypervisor (KVM-based)', 'Direct hardware access gives near-native performance', 'Standard choice for production data centres and cloud platforms', 'Installed directly on the machine, not on top of an existing operating system']}
      figure={<Type1Scene />}
      figH={340}
    />
  )
}

/* ================================================================== 23 · type 2 */

const L23 = 'A Type 2 hypervisor runs as an application on top of an existing host operating system, relying on it for device drivers and scheduling.'

function Type2Scene() {
  const { active, u } = useStackCall()
  const W = 420
  return (
    <>
      <At x={(586 - W) / 2} y={22}>
        <StackDiagram w={W} vms={3} active={active} u={u} layers={[{ text: 'Hypervisor application', fill: HYP }, { text: 'Host OS', fill: HOST }, { text: 'Hardware', fill: HW }]} />
      </At>
      <At x={24} y={22 + stackHeight(3) + 22} w={586 - 48}>
        <div className="flex items-end justify-center" style={{ gap: 38 }}>
          <Logo name="virtualbox" h={30} caption="VirtualBox" />
          <Logo name="vmware" h={20} caption="Workstation" />
          <Logo name="parallels" h={24} caption="Parallels Desktop" />
        </div>
      </At>
    </>
  )
}

export function Type2({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="Type2"
      kicker={'Type 2 Hosted'}
      title={'Runs On Host OS'}
      lead={L23}
      lesson={lesson}
      pointsW={500}
      points={['Examples: Oracle VirtualBox, VMware Workstation, Parallels Desktop', 'Every I/O call passes through host OS first', 'Extra translation layer adds performance overhead', 'Simple to install, common for desktops and testing']}
      figure={<Type2Scene />}
      figH={370}
    />
  )
}

/* ================================================================== 24 · type 1 vs type 2 */

const L24 = 'Both types embed a VMM to virtualize hardware; they differ in what layer sits between that VMM and the physical machine.'

/**
 * The TR's "Types of Hypervisor" image, redrawn: two stacks side by side, the
 * hosted one with its Operating System layer, the TR's captions under them.
 * One clock drives a call down each at the same speed: the bare-metal call
 * reaches the hardware first, the hosted one passes the extra layer.
 */
function CompareScene() {
  const t = useLoop(4200, { mode: 'sawtooth', still: 0.95, steps: 240 })
  const W = 200
  const u1 = within(t, 0.06, 0.06 + 0.56 * (3 / 4))
  const u2 = within(t, 0.06, 0.62)
  const caption = (a: string, b: string) => (
    <div className="text-center font-heading text-[17px] font-bold leading-snug" style={{ color: colors.ink, width: W + 20 }}>
      {a}
      <br />
      {b}
    </div>
  )
  return (
    <>
      <At x={24} y={22}>
        <StackDiagram w={W} vms={2} active={0} u={u1} size={16} appSize={15} layers={[{ text: 'Hypervisor', fill: HYP }, { text: 'Hardware', fill: HW }]} />
      </At>
      <At x={24 + W / 2} y={22 + stackHeight(2) + 14} cx>
        {caption('Type 1 (Bare Metal)', 'Virtualization')}
      </At>
      <At x={24 + W + 32} y={22}>
        <StackDiagram w={W} vms={2} active={0} u={u2} size={16} appSize={15} layers={[{ text: 'Hypervisor', fill: HYP }, { text: 'Operating System', fill: HOST }, { text: 'Hardware', fill: HW }]} />
      </At>
      <At x={24 + W + 32 + W / 2} y={22 + stackHeight(3) + 14} cx>
        {caption('Type 2 (Hosted)', 'Virtualization')}
      </At>
    </>
  )
}

export function TypeCompare({ lesson }: { lesson: string }) {
  const SW = 480
  return (
    <Card id="TypeCompare" kicker={'Bare-Metal Vs Hosted'} title={'Stack And Trade-Offs'} lead={lead(L24)} lesson={lesson}>
      <div className="flex items-start" style={{ width: BOX_W, gap: 20 }}>
        <Stage w={SW} h={352} active={false}>
          <CompareScene />
        </Stage>
        <div style={{ width: BOX_W - SW - 20 }}>
          <DataTable
            compact
            columns={[{ label: 'Aspect', weight: 0.7 }, { label: 'Type 1 (Bare-Metal)' }, { label: 'Type 2 (Hosted)' }]}
            rows={[
              [<b key="a">Host layer</b>, 'None: runs on hardware', 'Full host OS underneath'],
              [<b key="a">Performance</b>, 'Near-native, low overhead', 'Added translation overhead'],
              [<b key="a">Examples</b>, 'VMware ESXi, Hyper-V, KVM', 'VirtualBox, VMware Workstation'],
              [<b key="a">Typical use</b>, 'Data centres, cloud platforms', 'Desktop, dev and test'],
            ]}
          />
        </div>
      </div>
    </Card>
  )
}
