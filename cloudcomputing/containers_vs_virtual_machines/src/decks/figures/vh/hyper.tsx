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
import { Logo, Marker, PairAnalogy } from './frames'

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
function VmmScene() {
  const k = useCycle(3, 2400, 1)
  const HX = 92 // hardware centre
  const GX = 300 // gears centre
  const MX = 520 // monitors centre
  const MY = [64, 166, 268] // monitor centres
  const CY = 166
  return (
    <>
      <At x={HX} y={96} cx>
        <Icon3D name="server-stack" w={104} alt="Hardware" />
      </At>
      <At x={HX} y={232} cx>
        <span className="font-heading text-[18px] font-bold" style={{ color: colors.ink }}>Hardware</span>
      </At>
      <Arrow x1={152} y1={CY} x2={222} y2={CY} tone={colors.ink} />
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

const AN = { x: 60, y: 24, w: 380, roof: 24, pad: 8, rowH: 38, rowGap: 7, baseH: 42 }
const RISER_X = 9
const ROW_L = 18
const rowTop = (i: number) => AN.pad + i * (AN.rowH + AN.rowGap)
const BASE_TOP = rowTop(3) + 3
const BODY_H = BASE_TOP + AN.baseH + AN.pad
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

/** One row of either scene: a raised tile with its own stripe, contents, and the meter at its right end. */
function Row({ i, stripe, children, meter, ring }: { i: number; stripe: string; children: ReactNode; meter: ReactNode; ring: boolean }) {
  return (
    <div
      className="absolute flex items-center gap-2.5 rounded-[10px] pl-3 pr-1.5"
      style={{
        left: ROW_L,
        top: rowTop(i),
        width: AN.w - ROW_L - AN.pad,
        height: AN.rowH,
        background: 'linear-gradient(180deg, #FFFFFF 0%, #EDF3FD 100%)',
        boxShadow: `inset 4px 0 0 ${stripe}, inset 0 0 0 ${ring ? 2.5 : 1}px ${ring ? colors.accent : '#CFDCF5'}, 0 6px 12px -10px rgba(16,32,58,0.6)`,
        transition: `box-shadow 420ms ${EASE}`,
      }}
    >
      {children}
      <div className="ml-auto">{meter}</div>
    </div>
  )
}

/** The riser from the bottom row to every row; a bead climbs it while pair 1 is lit. */
function Riser({ on, t, tone }: { on: boolean; t: number; tone: string }) {
  const y0 = BASE_TOP + AN.baseH / 2
  const y1 = rowTop(0) + AN.rowH / 2
  const y = y0 - (y0 - y1) * t
  return (
    <svg aria-hidden className="absolute" style={{ left: 0, top: 0, overflow: 'visible' }} width={ROW_L} height={BODY_H}>
      <path d={`M ${RISER_X} ${y0} V ${y1}`} stroke={tone} strokeWidth={3} strokeLinecap="round" opacity={0.75} />
      {[0, 1, 2].map((r) => (
        <path key={r} d={`M ${RISER_X} ${rowTop(r) + AN.rowH / 2} H ${ROW_L}`} stroke={tone} strokeWidth={3} strokeLinecap="round" opacity={0.75} />
      ))}
      {on && <circle cx={RISER_X} cy={y} r={5.5} fill={colors.accent} stroke="#FFFFFF" strokeWidth={2} />}
    </svg>
  )
}

const STRIPES = [LAB.sky, LAB.periwinkle, LAB.sage]
const meterValue = (lit: number, t: number, i: number) => (lit === 1 ? 0.2 + 0.6 * ((t + i * 0.37) % 1) : 0.3 + i * 0.18)

function ApartmentScene({ lit }: { lit: number }) {
  const t = useLoop(2400, { mode: 'sawtooth', still: 0.6 })
  return (
    <>
      <At x={AN.x} y={AN.y}>
        <div className="relative" style={{ width: AN.w, height: AN.roof + BODY_H }}>
          <svg aria-hidden width={AN.w} height={AN.roof} viewBox={`0 0 ${AN.w} ${AN.roof}`} style={{ display: 'block' }}>
            <defs>
              <linearGradient id="vh21-roof" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#FFB067" />
                <stop offset="1" stopColor="#E9782A" />
              </linearGradient>
            </defs>
            <path d={`M 4 ${AN.roof} L ${AN.w / 2} 2 L ${AN.w - 4} ${AN.roof} Z`} fill="url(#vh21-roof)" />
            <path d={`M 4 ${AN.roof} L ${AN.w / 2} 2 L ${AN.w / 2 + 8} 5 L 22 ${AN.roof} Z`} fill="#FFFFFF" opacity={0.3} />
          </svg>
          <div className="relative rounded-b-[14px] rounded-t-[4px]" style={{ width: AN.w, height: BODY_H, background: 'linear-gradient(180deg, #E2B386 0%, #C98A55 100%)', boxShadow: '0 16px 26px -16px rgba(16,32,58,0.55), inset 0 1px 0 rgba(255,255,255,0.35)' }}>
            <Riser on={lit === 0} t={t} tone="#8A5A33" />
            {[0, 1, 2].map((i) => (
              <Row key={i} i={i} stripe={STRIPES[i]} ring={lit === 2 && i === 1} meter={<ElectricMeter w={27} value={meterValue(lit, t, i)} />}>
                <FaceDisc cfg={TENANT_CFG[i]} seed={70 + i} />
                <span aria-hidden className="h-[18px] w-[26px] rounded-[4px]" style={{ background: `linear-gradient(135deg, #CFE2FF 0%, ${LAB.sky} 100%)` }} />
                <span aria-hidden className="h-[18px] w-[26px] rounded-[4px]" style={{ background: `linear-gradient(135deg, #CFE2FF 0%, ${LAB.sky} 100%)` }} />
                {i === 1 && (
                  <div className="ml-6">
                    <Leak fall={lit === 2 ? t : 0} on={lit === 2} />
                  </div>
                )}
              </Row>
            ))}
            <div
              className="absolute flex items-center gap-3 rounded-[10px] px-3"
              style={{
                left: ROW_L,
                top: BASE_TOP,
                width: AN.w - ROW_L - AN.pad,
                height: AN.baseH,
                background: 'linear-gradient(180deg, #E4ECFC 0%, #C9D8F5 100%)',
                boxShadow: `inset 0 0 0 ${lit === 0 ? 2.5 : 1}px ${lit === 0 ? colors.accent : '#B9CCF2'}, 0 6px 12px -10px rgba(16,32,58,0.6)`,
                transition: `box-shadow 420ms ${EASE}`,
              }}
            >
              <FaceDisc cfg={ARJUN} d={34} seed={74} />
              <span aria-hidden className="h-[16px] w-[96px] rounded-[5px]" style={{ background: `linear-gradient(180deg, #4A5EB8 0%, ${LAB.navy} 100%)`, boxShadow: '0 5px 8px -5px rgba(16,32,58,0.6)' }} />
              <span aria-hidden className="ml-auto mr-2 h-[34px] w-[22px] rounded-t-[6px] rounded-b-[2px]" style={{ background: `linear-gradient(180deg, #4A5EB8 0%, ${LAB.navy} 100%)` }} />
            </div>
          </div>
        </div>
      </At>
      <At x={24} y={AN.y + AN.roof + BASE_TOP + 6}>
        <Marker n={1} on={lit === 0} />
      </At>
      <At x={AN.x + AN.w + 8} y={AN.y + AN.roof + rowTop(0) + 4}>
        <Marker n={2} on={lit === 1} />
      </At>
      <At x={24} y={AN.y + AN.roof + rowTop(1) + 4}>
        <Marker n={3} on={lit === 2} />
      </At>
    </>
  )
}

function HypervisorScene({ lit }: { lit: number }) {
  const t = useLoop(2400, { mode: 'sawtooth', still: 0.6 })
  const top = AN.y + AN.roof
  return (
    <>
      <At x={AN.x} y={top}>
        <div className="relative rounded-[14px]" style={{ width: AN.w, height: BODY_H, background: `linear-gradient(180deg, #1B4A7E 0%, ${HW} 100%)`, boxShadow: '0 16px 26px -16px rgba(16,32,58,0.65), inset 0 1px 0 rgba(255,255,255,0.22)' }}>
          <Riser on={lit === 0} t={t} tone={LAB.sky} />
          {[0, 1, 2].map((i) => (
            <Row key={i} i={i} stripe={STRIPES[i]} ring={lit === 2 && i === 1} meter={<ClayMeter w={30} value={meterValue(lit, t, i)} />}>
              <ClayOsWindow w={40} k={i} />
              <span aria-hidden className="h-[8px] w-[70px] rounded-full" style={{ background: '#D6E3FB' }} />
              {i === 1 && (
                <div className="ml-4" style={{ transform: lit === 2 ? 'scale(1.12)' : 'none', transition: `transform 420ms ${EASE}` }}>
                  <ClayNo w={26} />
                </div>
              )}
            </Row>
          ))}
          <div className="absolute" style={{ left: ROW_L, top: BASE_TOP, borderRadius: 12, boxShadow: lit === 0 ? `0 0 0 2.5px ${colors.accent}` : 'none', transition: `box-shadow 420ms ${EASE}` }}>
            <ClayBar w={AN.w - ROW_L - AN.pad} h={AN.baseH} fill={HYP} />
          </div>
        </div>
      </At>
      <At x={24} y={top + BASE_TOP + 6}>
        <Marker n={1} on={lit === 0} />
      </At>
      <At x={AN.x + AN.w + 8} y={top + rowTop(0) + 4}>
        <Marker n={2} on={lit === 1} />
      </At>
      <At x={24} y={top + rowTop(1) + 4}>
        <Marker n={3} on={lit === 2} />
      </At>
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
      everyday={{ label: 'An apartment building', scene: (lit) => <ApartmentScene lit={lit} /> }}
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
      points={['Examples: VMware ESXi, Microsoft Hyper-V, KVM', 'AWS EC2 runs on the Nitro hypervisor (KVM-based)', 'Direct hardware access gives near-native performance', 'Standard choice for production data centres and cloud platforms', 'Requires dedicated server hardware, not a desktop OS']}
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
