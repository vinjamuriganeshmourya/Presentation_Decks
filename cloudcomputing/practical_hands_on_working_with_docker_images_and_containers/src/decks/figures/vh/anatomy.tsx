import { useId, type CSSProperties, type ReactNode } from 'react'
import { ArrowLeftRight, CalendarClock, Cpu, FileBox, HardDrive, Layers, MemoryStick, Network, Router, type LucideIcon } from 'lucide-react'
import { colors } from '@/design/tokens'
import { Arrow, At, B, BOX_W, Card, Label, Num, useCycle, useLoop } from '../scene'
import { ClayBar, GroundShadow, LAB } from '../d3/kit'
import { TILE_SKIN } from '../card'
import { FigureOnly, PointsFigure, TableCard, lead } from '../iso/frames'
import { ImportantNote } from './frames'

/**
 * SECTION 4 · VIRTUAL MACHINE ANATOMY (reference frames 37 to 41), in session
 * 2's current style (session 1's 3D finish): hardware and the hypervisor are
 * session 1's glossy slabs (`ClayBar`, brandDeep for hardware, brand for the
 * hypervisor layer), the VM's parts are raised tiles, labels are HTML.
 *
 * One loop per figure, and the motion is the claim: a request runs from each
 * physical part through the hypervisor to its virtual part in turn (37); the
 * scheduler hands the four cores to the six vCPUs one slice at a time (38); a
 * block is written from the virtual disk into its host file while a packet
 * runs from the vNIC down to the physical network (39); the five steps light
 * in order (41). The table (40) is a static exhibit.
 */

const EASE = 'cubic-bezier(0.22,1,0.36,1)'
const VM_TONES = [colors.brand, colors.accent, colors.teal]

/* ------------------------------------------------------------------ local pieces */

/** A glyph on a small tile: frosted on a dark slab, pale blue on a light tile. */
function Glyph({ icon: I, dark = false, size = 34 }: { icon: LucideIcon; dark?: boolean; size?: number }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-[10px]" style={{ width: size, height: size, background: dark ? 'rgba(255,255,255,0.16)' : colors.surface2, color: dark ? colors.white : colors.brand, boxShadow: dark ? 'inset 0 1px 0 rgba(255,255,255,0.25)' : `inset 0 0 0 1px #CFDCF5` }} aria-hidden>
      <I size={Math.round(size * 0.56)} strokeWidth={2} />
    </span>
  )
}

/** A raised tile (the card's finish without the hill), lit with a brand ring. */
function Tile({ x, y, w, h, lit = false, children, style, className = '' }: { x: number; y: number; w: number; h: number; lit?: boolean; children?: ReactNode; style?: CSSProperties; className?: string }) {
  return (
    <div
      className={`absolute rounded-[14px] ${className}`}
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
        ...TILE_SKIN,
        ...(lit ? { boxShadow: `inset 0 0 0 2px ${colors.brand}, inset 0 1px 0 #FFFFFF, 0 14px 28px -16px rgba(45,99,251,0.5)` } : {}),
        transition: `box-shadow 420ms ${EASE}`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** A heading over a group, in the reference's small caps (its CSS uppercases the source string). */
function Head({ children, tone = colors.ink, className = '' }: { children: string; tone?: string; className?: string }) {
  return (
    <span className={`whitespace-nowrap font-heading text-[16px] font-bold uppercase tracking-[0.08em] ${className}`} style={{ color: tone }}>
      {children}
    </span>
  )
}

/** A packet on a straight link from `a` to `b` at phase `t` (0..1), fading at both ends. */
function Pkt({ a, b, t, tone = colors.brand, size = 12, square = false }: { a: [number, number]; b: [number, number]; t: number; tone?: string; size?: number; square?: boolean }) {
  const x = a[0] + (b[0] - a[0]) * t
  const y = a[1] + (b[1] - a[1]) * t
  const fade = Math.max(0, Math.min(1, t * 6, (1 - t) * 6))
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute left-0 top-0 ${square ? 'rounded-[4px]' : 'rounded-full'}`}
      style={{ width: size, height: size, background: tone, boxShadow: square ? `0 0 0 2px ${colors.white}, 0 4px 10px -2px ${tone}` : `0 0 0 4px ${tone}40`, transform: `translate(${x - size / 2}px, ${y - size / 2}px)`, opacity: fade }}
    />
  )
}

/** 0 before a, 1 after b, eased between. */
function within(t: number, a: number, b: number) {
  if (t <= a) return 0
  if (t >= b) return 1
  const x = (t - a) / (b - a)
  return x * x * (3 - 2 * x)
}

/* ================================================================== 37 · VM anatomy map */

const AN_ROWS: { physical: string; virtual: string; text: string; icon: LucideIcon }[] = [
  { physical: 'CPU', virtual: 'vCPU', text: 'virtual processor core scheduled onto physical cores', icon: Cpu },
  { physical: 'RAM', virtual: 'Virtual memory', text: 'guest RAM carved from host physical memory', icon: MemoryStick },
  { physical: 'Disk', virtual: 'Virtual disk', text: 'file-backed storage acting as a physical drive', icon: HardDrive },
  { physical: 'NIC', virtual: 'Virtual NIC', text: 'software network adapter for guest connectivity', icon: Network },
]
const AN_Y0 = 58
const AN_RH = 50
const AN_GAP = 8
const anY = (i: number) => AN_Y0 + i * (AN_RH + AN_GAP)
const AN_PX = 30 // physical bars
const AN_PW = 250
const AN_HX = 340 // hypervisor slab
const AN_HW = 96
const AN_VX = 500 // VM region
const AN_VW = 580
const AN_BOTTOM = anY(3) + AN_RH

function AnatomyScene() {
  /* one lap visits the four parts in turn: a request runs from the hardware, through the hypervisor, to its virtual part */
  const t = useLoop(9600, { mode: 'sawtooth', still: 0.1 })
  const lit = Math.min(3, Math.floor(t * 4))
  const f = within(t * 4 - lit, 0.08, 0.92)
  const cy = (i: number) => anY(i) + AN_RH / 2
  return (
    <>
      <At x={AN_PX + 4} y={22}>
        <Head>Physical machine</Head>
      </At>
      <At x={AN_VX + 14} y={22}>
        <Head tone={colors.brand}>Inside one VM</Head>
      </At>
      {/* the VM's own boundary, dashed as the reference draws it */}
      <div aria-hidden className="pointer-events-none absolute rounded-[18px]" style={{ left: AN_VX, top: AN_Y0 - 10, width: AN_VW, height: AN_BOTTOM - AN_Y0 + 20, background: 'linear-gradient(180deg, rgba(45,99,251,0.05), rgba(45,99,251,0.02))', outline: `2px dashed ${LAB.lavDeep}`, outlineOffset: -2 }} />
      {/* the four links: solid from the hardware into the hypervisor, dashed out to the VM */}
      {AN_ROWS.map((r, i) => (
        <div key={`l-${r.physical}`}>
          <div aria-hidden className="absolute rounded-full" style={{ left: AN_PX + AN_PW, top: cy(i) - 1.5, width: AN_HX - AN_PX - AN_PW, height: 3, background: colors.brandDeep }} />
          <Arrow x1={AN_HX + AN_HW + 2} y1={cy(i)} x2={AN_VX + 14} y2={cy(i)} dashed tone={colors.brand} />
        </div>
      ))}
      {AN_ROWS.map((r, i) => (
        <At key={`p-${r.physical}`} x={AN_PX} y={anY(i)} style={{ transform: lit === i ? 'translateY(-3px)' : 'none', transition: `transform 420ms ${EASE}` }}>
          <ClayBar w={AN_PW} h={AN_RH} fill={colors.brandDeep}>
            <div className="flex w-full items-center gap-3 px-4">
              <Glyph icon={r.icon} dark />
              <span className="font-heading text-[19px] font-bold" style={{ color: colors.white }}>
                {r.physical}
              </span>
            </div>
          </ClayBar>
        </At>
      ))}
      {/* the hypervisor: one tall brand slab every part passes through */}
      <At x={AN_HX} y={AN_Y0}>
        <ClayBar w={AN_HW} h={AN_BOTTOM - AN_Y0} fill={colors.brand}>
          <span className="font-heading text-[20px] font-bold" style={{ color: colors.white, transform: 'rotate(-90deg)', whiteSpace: 'nowrap' }}>
            Hypervisor
          </span>
        </ClayBar>
        <GroundShadow w={AN_HW} style={{ marginTop: 2 }} />
      </At>
      {AN_ROWS.map((r, i) => (
        <Tile key={`v-${r.virtual}`} x={AN_VX + 14} y={anY(i)} w={AN_VW - 28} h={AN_RH} lit={lit === i}>
          <div className="flex h-full items-center gap-3 px-3">
            <Glyph icon={r.icon} />
            <span className="w-[150px] shrink-0 font-heading text-[18px] font-bold leading-tight" style={{ color: colors.ink }}>
              {r.virtual}
            </span>
            <span className="min-w-0 text-[15px] leading-snug" style={{ color: colors.muted }}>
              {r.text}
            </span>
          </div>
        </Tile>
      ))}
      <Pkt a={[AN_PX + AN_PW, cy(lit)]} b={[AN_VX + 8, cy(lit)]} t={f} tone={colors.accent} size={14} />
      {/* the packaging strip, under the map */}
      <div className="absolute flex items-center justify-center gap-3 rounded-[14px]" style={{ left: AN_PX, top: AN_BOTTOM + 20, width: AN_VX + AN_VW - AN_PX, height: 44, ...TILE_SKIN }}>
        <Glyph icon={Layers} size={30} />
        <span className="font-heading text-[18px] font-semibold" style={{ color: colors.ink }}>
          Images, templates, snapshots: how VMs are packaged and reused
        </span>
      </div>
    </>
  )
}

export function Anatomy({ lesson }: { lesson: string }) {
  return (
    <FigureOnly
      id="Anatomy"
      kicker={'VM Anatomy Map'}
      title={'Hardware And Packaging'}
      lead="A VM presents four virtualized hardware components to its guest OS, while a separate set of artifacts package and manage the VM itself."
      lesson={lesson}
      h={AN_BOTTOM + 20 + 44 + 20}
      figure={<AnatomyScene />}
    />
  )
}

/* ================================================================== 38 · vCPU and memory */

const VC_CORES = ['Core 1', 'Core 2', 'Core 3', 'Core 4']
const VC_VMS = ['VM 1', 'VM 1', 'VM 2', 'VM 2', 'VM 3', 'VM 3']
const VC_TONE = [0, 0, 1, 1, 2, 2]
const CORE = { x: 24, y: 52, w: 102, h: 62, gap: 8 }
const coreXY = (i: number): [number, number] => [CORE.x + (i % 2) * (CORE.w + CORE.gap), CORE.y + Math.floor(i / 2) * (CORE.h + CORE.gap)]
const VCPU = { x: 404, y: 52, w: 98, h: 48, gap: 8 }
const vcpuXY = (i: number): [number, number] => [VCPU.x + (i % 2) * (VCPU.w + VCPU.gap), VCPU.y + Math.floor(i / 2) * (VCPU.h + VCPU.gap)]
const SCHED: [number, number] = [318, 118]
const VC_FIG_W = 634

function VcpuScene() {
  /* one time slice every 900ms: slice k runs vCPU k mod 6 on core k mod 4, so six vCPUs share four cores */
  const lap = useLoop(10800, { mode: 'sawtooth', still: 0.38 })
  const k = Math.min(11, Math.floor(lap * 12))
  const f = within(lap * 12 - k, 0.1, 0.9)
  const core = k % 4
  const vcpu = k % 6
  const [cx, cy] = coreXY(core)
  const [vx, vy] = vcpuXY(vcpu)
  const ramW = CORE.w * 2 + CORE.gap
  const ramY = 212
  return (
    <>
      <At x={CORE.x + ramW / 2} y={20} cx>
        <Head>Physical host</Head>
      </At>
      <At x={VCPU.x + VCPU.w + VCPU.gap / 2} y={20} cx>
        <Head tone={colors.brand}>Three VMs</Head>
      </At>
      {VC_CORES.map((name, i) => {
        const [x, y] = coreXY(i)
        const on = i === core
        return (
          <At key={name} x={x} y={y} style={{ transform: on ? 'translateY(-3px)' : 'none', transition: `transform 360ms ${EASE}` }}>
            <div style={{ opacity: on ? 1 : 0.55, transition: `opacity 360ms ${EASE}` }}>
              <ClayBar w={CORE.w} h={CORE.h} fill={colors.brandDeep}>
                <div className="flex flex-col items-center gap-0.5">
                  <Cpu size={18} color={colors.white} strokeWidth={2} aria-hidden />
                  <span className="font-heading text-[16px] font-semibold" style={{ color: colors.white }}>
                    {name}
                  </span>
                </div>
              </ClayBar>
            </div>
          </At>
        )
      })}
      {/* cores to the scheduler, the scheduler out to the VMs */}
      <div aria-hidden className="absolute rounded-full" style={{ left: CORE.x + ramW, top: SCHED[1] - 1.5, width: SCHED[0] - 30 - CORE.x - ramW, height: 3, background: colors.brandDeep }} />
      <Arrow x1={SCHED[0] + 30} y1={SCHED[1]} x2={VCPU.x - 6} y2={SCHED[1]} dashed />
      <At x={SCHED[0]} y={SCHED[1]} cx cy>
        <span className="grid place-items-center rounded-full" style={{ width: 58, height: 58, background: `radial-gradient(circle at 32% 28%, ${LAB.sky}, ${colors.brand} 62%, ${colors.brandDark})`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.4), 0 10px 20px -10px ${colors.brand}` }} aria-hidden>
          <CalendarClock size={26} color={colors.white} strokeWidth={2} />
        </span>
      </At>
      <At x={SCHED[0]} y={SCHED[1] + 36} cx w={110}>
        <span className="block text-center font-heading text-[14px] font-semibold leading-tight" style={{ color: colors.brandDark }}>
          Hypervisor scheduler
        </span>
      </At>
      {VC_VMS.map((vm, i) => {
        const [x, y] = vcpuXY(i)
        const tone = VM_TONES[VC_TONE[i]]
        const on = i === vcpu
        return (
          <div key={i} className="absolute flex flex-col items-center justify-center rounded-[12px]" style={{ left: x, top: y, width: VCPU.w, height: VCPU.h, background: on ? `linear-gradient(180deg, #FFFFFF, ${tone}22)` : 'linear-gradient(180deg, #FFFFFF 0%, #F4F7FD 100%)', boxShadow: `inset 0 0 0 ${on ? 2.5 : 1.5}px ${tone}, inset 0 1px 0 #FFFFFF, 0 ${on ? 12 : 6}px ${on ? 22 : 14}px -12px rgba(31,64,140,0.45)`, transition: `all 360ms ${EASE}` }}>
            <span className="font-heading text-[15px] font-semibold leading-tight" style={{ color: colors.ink }}>
              vCPU
            </span>
            <span className="font-heading text-[14px] font-semibold leading-tight" style={{ color: tone }}>
              {vm}
            </span>
          </div>
        )
      })}
      {/* the slice: from the vCPU through the scheduler onto its core */}
      {f < 0.5 ? <Pkt a={[vx - 4, vy + VCPU.h / 2]} b={[SCHED[0], SCHED[1]]} t={f * 2} tone={VM_TONES[VC_TONE[vcpu]]} /> : <Pkt a={[SCHED[0], SCHED[1]]} b={[cx + CORE.w + 4, cy + CORE.h / 2]} t={f * 2 - 1} tone={VM_TONES[VC_TONE[vcpu]]} />}
      {/* memory: host pages, each VM's pages in its own colour, mapped to its virtual memory */}
      <div className="absolute rounded-[14px] px-3 py-2.5" style={{ left: CORE.x, top: ramY, width: ramW, height: 88, background: `linear-gradient(180deg, #13406F 0%, ${colors.brandDeep} 100%)`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 14px 24px -14px rgba(0,37,75,0.6)' }}>
        <div className="flex items-center gap-2">
          <MemoryStick size={18} color={colors.white} strokeWidth={2} aria-hidden />
          <span className="font-heading text-[16px] font-semibold" style={{ color: colors.white }}>
            Host RAM pages
          </span>
        </div>
        <div className="mt-2 grid grid-cols-8 gap-1.5">
          {Array.from({ length: 16 }, (_, i) => (
            <span key={i} className="block h-[16px] rounded-[4px]" style={{ background: i < 12 ? VM_TONES[Math.floor(i / 4)] : 'rgba(255,255,255,0.18)', boxShadow: i < 12 ? 'inset 0 1px 0 rgba(255,255,255,0.45)' : undefined }} />
          ))}
        </div>
      </div>
      <Arrow x1={CORE.x + ramW + 8} y1={ramY + 44} x2={VCPU.x - 6} y2={ramY + 44} dashed />
      <div className="absolute rounded-[14px] px-3 py-2.5" style={{ left: VCPU.x, top: ramY, width: VCPU.w * 2 + VCPU.gap, height: 88, ...TILE_SKIN, boxShadow: `inset 0 0 0 2px ${colors.brand}, inset 0 1px 0 #FFFFFF, 0 12px 24px -16px rgba(31,64,140,0.34)` }}>
        <span className="font-heading text-[16px] font-semibold" style={{ color: colors.ink }}>
          Virtual memory
        </span>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {VM_TONES.map((t) => (
            <span key={t} className="block h-[30px] rounded-[8px]" style={{ background: `${t}2E`, boxShadow: `inset 0 0 0 2px ${t}` }} />
          ))}
        </div>
      </div>
      <div className="absolute grid place-items-center rounded-[12px]" style={{ left: CORE.x, top: 316, width: VC_FIG_W - CORE.x * 2, height: 38, background: '#FFF4E0', boxShadow: `inset 0 0 0 1.5px ${colors.warning}` }}>
        <span className="font-heading text-[17px] font-semibold" style={{ color: '#7A4600' }}>
          6 vCPUs on 4 physical cores: oversubscription
        </span>
      </div>
    </>
  )
}

export function Vcpu({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="Vcpu"
      kicker={'vCPU And Memory'}
      title={'Compute Allocation'}
      lead="A vCPU is a logical processor the hypervisor time-slices onto physical cores; virtual memory is the guest's RAM window mapped to host physical pages."
      lesson={lesson}
      pointsW={BOX_W - VC_FIG_W - 24}
      pointSize={17}
      figH={378}
      points={[
        'Total vCPUs across all VMs on a host can exceed its physical cores (oversubscription)',
        'Oversubscription risks contention when guests demand cycles simultaneously',
        'Memory overcommit achieved through ballooning or host-side swapping',
        'Swapping under overcommit degrades guest performance sharply',
      ]}
      figure={<VcpuScene />}
    />
  )
}

/* ================================================================== 39 · virtual disk and virtual NIC */

const DN = { vmX: 24, vmY: 16, vmW: 586, vmH: 96 }
const DN_TILE_Y = DN.vmY + 40
const DN_TILE_H = 46
const DN_DISK_X = DN.vmX + 16
const DN_NIC_X = DN.vmX + DN.vmW / 2 + 6
const DN_TILE_W = DN.vmW / 2 - 22
const DN_HS = { x: 24, y: 150, w: 270, h: 194 }
const DN_COL = { x: 340, w: 250 }
const DN_SW_Y = 150
const DN_PN_Y = 206
const DN_NET_Y = 262
const DN_BAR_H = 42

function ModeChip({ children }: { children: string }) {
  return (
    <span className="whitespace-nowrap rounded-pill px-2.5 py-[3px] font-heading text-[14px] font-bold uppercase tracking-[0.04em]" style={{ background: '#E6FAF7', color: colors.tealDark, boxShadow: `inset 0 0 0 1.5px ${colors.teal}` }}>
      {children}
    </span>
  )
}

function DiskNicScene() {
  const t = useLoop(5200, { mode: 'sawtooth', still: 0.55 })
  const diskX = DN_DISK_X + DN_TILE_W / 2
  const nicX = DN_COL.x + DN_COL.w / 2
  const fileY = DN_HS.y + 66
  /* the write: a block falls from the virtual disk into its host file (first half of the lap) */
  const w = within(t, 0.05, 0.45)
  /* the packet: vNIC, virtual switch, physical NIC, physical network (the whole lap) */
  const p = within(t, 0.1, 0.9) * 3
  const legs: [number, number][] = [
    [DN_TILE_Y + DN_TILE_H, DN_SW_Y],
    [DN_SW_Y + DN_BAR_H, DN_PN_Y],
    [DN_PN_Y + DN_BAR_H, DN_NET_Y],
  ]
  const leg = Math.min(2, Math.floor(p))
  const f = p - leg
  const litBar = t > 0.1 && t < 0.95 ? leg : -1
  const bar = (i: number): CSSProperties => ({ transform: litBar === i ? 'translateY(-2px)' : 'none', transition: `transform 360ms ${EASE}` })
  return (
    <>
      {/* one VM: its two parts are nested in its box, so their icons sit inside the ring they belong to */}
      <div className="absolute rounded-[18px]" style={{ left: DN.vmX, top: DN.vmY, width: DN.vmW, height: DN.vmH, ...TILE_SKIN, boxShadow: `inset 0 0 0 2px ${colors.brand}, inset 0 1px 0 #FFFFFF, 0 14px 28px -18px rgba(31,64,140,0.4)` }}>
        <div className="absolute inset-x-0 flex justify-center" style={{ top: 10 }}>
          <Head tone={colors.brand}>One VM</Head>
        </div>
        <div className="absolute flex items-center justify-center gap-2.5 rounded-[12px]" style={{ left: DN_DISK_X - DN.vmX, top: DN_TILE_Y - DN.vmY, width: DN_TILE_W, height: DN_TILE_H, background: colors.surface2 }}>
          <Glyph icon={HardDrive} size={30} />
          <span className="font-heading text-[18px] font-semibold" style={{ color: colors.ink }}>
            Virtual disk
          </span>
        </div>
        <div className="absolute flex flex-col items-center justify-center rounded-[12px]" style={{ left: DN_NIC_X - DN.vmX, top: DN_TILE_Y - DN.vmY, width: DN_TILE_W, height: DN_TILE_H, background: colors.surface2 }}>
          <span className="flex items-center gap-2">
            <Network size={18} color={colors.brand} strokeWidth={2} aria-hidden />
            <span className="font-heading text-[18px] font-semibold leading-tight" style={{ color: colors.ink }}>
              Virtual NIC
            </span>
          </span>
          <span className="font-mono text-[14px] leading-tight" style={{ color: colors.muted }}>
            its own MAC address
          </span>
        </div>
      </div>
      {/* disk to its file; NIC to the switch: each starts and ends in the gap between boxes */}
      <Arrow x1={diskX} y1={DN.vmY + DN.vmH + 6} x2={diskX} y2={DN_HS.y - 6} dashed />
      <Arrow x1={nicX} y1={DN.vmY + DN.vmH + 6} x2={nicX} y2={DN_SW_Y - 6} dashed />
      {/* host storage: the file and the format chips nested in its box */}
      <div className="absolute rounded-[16px]" style={{ left: DN_HS.x, top: DN_HS.y, width: DN_HS.w, height: DN_HS.h, ...TILE_SKIN, boxShadow: `inset 0 0 0 2px ${colors.brandDeep}, inset 0 1px 0 #FFFFFF, 0 12px 24px -16px rgba(31,64,140,0.34)` }}>
        <div className="absolute" style={{ left: 18, top: 14 }}>
          <Head>Host storage</Head>
        </div>
        <div className="absolute flex items-center gap-2.5 rounded-[10px] px-3" style={{ left: 16, top: fileY - 20 - DN_HS.y, width: DN_HS.w - 32, height: 42, background: colors.white, boxShadow: `inset 0 0 0 2px ${colors.brand}, 0 ${w > 0.9 ? 10 : 4}px 16px -10px rgba(45,99,251,0.6)`, transition: `box-shadow 300ms ${EASE}` }}>
          <FileBox size={20} color={colors.brand} strokeWidth={2} aria-hidden />
          <span className="font-mono text-[16px] font-semibold" style={{ color: colors.ink }}>
            Ubuntu-Demo.vdi
          </span>
        </div>
        <div className="absolute flex flex-wrap gap-2" style={{ left: 16, top: 104, width: DN_HS.w - 32 }}>
          {['VMDK', 'VHD/VHDX', 'QCOW2', 'VDI'].map((f2) => (
            <Label key={f2} tone="brand" size={14} strong>
              {f2}
            </Label>
          ))}
        </div>
      </div>
      {w > 0 && w < 1 && <Pkt a={[diskX, DN_TILE_Y + DN_TILE_H]} b={[diskX, fileY - 22]} t={w} square size={14} />}
      {/* the network column */}
      <At x={DN_COL.x} y={DN_SW_Y} style={bar(0)}>
        <ClayBar w={DN_COL.w} h={DN_BAR_H} fill={colors.brand}>
          <ArrowLeftRight size={20} color={colors.white} strokeWidth={2.2} aria-hidden />
          <span className="font-heading text-[18px] font-bold" style={{ color: colors.white }}>
            Virtual switch
          </span>
        </ClayBar>
      </At>
      <div aria-hidden className="absolute rounded-full" style={{ left: nicX - 1.5, top: DN_SW_Y + DN_BAR_H, width: 3, height: DN_PN_Y - DN_SW_Y - DN_BAR_H, background: colors.brandDeep }} />
      <At x={DN_COL.x} y={DN_PN_Y} style={bar(1)}>
        <ClayBar w={DN_COL.w} h={DN_BAR_H} fill={colors.brandDeep}>
          <Network size={20} color={colors.white} strokeWidth={2.2} aria-hidden />
          <span className="font-heading text-[18px] font-bold" style={{ color: colors.white }}>
            Physical NIC
          </span>
        </ClayBar>
      </At>
      <div aria-hidden className="absolute rounded-full" style={{ left: nicX - 1.5, top: DN_PN_Y + DN_BAR_H, width: 3, height: DN_NET_Y - DN_PN_Y - DN_BAR_H, background: colors.brandDeep }} />
      <div className="absolute flex items-center justify-center gap-2 rounded-[14px]" style={{ left: DN_COL.x, top: DN_NET_Y, width: DN_COL.w, height: DN_BAR_H, ...TILE_SKIN, boxShadow: `inset 0 0 0 2px ${colors.brandDeep}, inset 0 1px 0 #FFFFFF, 0 ${litBar === 2 ? 14 : 8}px 20px -14px rgba(31,64,140,0.5)`, transition: `box-shadow 360ms ${EASE}` }}>
        <Router size={20} color={colors.brandDeep} strokeWidth={2} aria-hidden />
        <span className="font-heading text-[18px] font-bold" style={{ color: colors.ink }}>
          Physical network
        </span>
      </div>
      {t > 0.1 && t < 0.9 && <Pkt a={[nicX, legs[leg][0]]} b={[nicX, legs[leg][1]]} t={f} tone={colors.accent} />}
      <At x={DN_COL.x - 30} y={DN_NET_Y + DN_BAR_H + 14} w={DN_COL.w + 60}>
        <div className="flex justify-center gap-2">
          {['NAT', 'Bridged', 'Host-only'].map((m) => (
            <ModeChip key={m}>{m}</ModeChip>
          ))}
        </div>
      </At>
    </>
  )
}

export function DiskNic({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="DiskNic"
      kicker={'Disk And NIC'}
      title={'Storage And Network'}
      lead="A virtual disk is a single host file the guest treats as a raw physical drive; a virtual NIC is a software adapter wired to a virtual switch."
      lesson={lesson}
      pointsW={BOX_W - VC_FIG_W - 24}
      pointSize={17}
      figH={372}
      points={[
        'Common virtual disk formats: VMDK, VHD/VHDX, QCOW2, VDI (VirtualBox native)',
        'Disk modes: fixed-size pre-allocated or dynamically growing',
        'Virtual NIC is assigned its own virtual MAC address',
        'Virtual switch or bridge connects vNIC to the physical network. Common vNIC modes: NAT, bridged, host-only',
      ]}
      figure={<DiskNicScene />}
    />
  )
}

/* ================================================================== 40 · images, templates and snapshots */

/** A stack of three glossy discs: the machine image (the TR's disk-stack icon). */
function DiskStackIcon({ w = 40 }: { w?: number }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg width={w} height={w} viewBox="0 0 40 40" aria-hidden style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${id}-d`} x1="0" x2="1">
          <stop offset="0" stopColor={LAB.sky} />
          <stop offset="1" stopColor={LAB.cobalt} />
        </linearGradient>
        <linearGradient id={`${id}-t`} x1="0" x2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor={LAB.lavender} />
        </linearGradient>
      </defs>
      <ellipse cx={20} cy={37} rx={15} ry={2.5} fill="rgba(31,64,140,0.22)" />
      {[24, 16, 8].map((y) => (
        <g key={y}>
          <path d={`M 5 ${y} L 5 ${y + 6} A 15 5 0 0 0 35 ${y + 6} L 35 ${y} Z`} fill={`url(#${id}-d)`} />
          <ellipse cx={20} cy={y} rx={15} ry={5} fill={`url(#${id}-t)`} stroke={LAB.lavDeep} strokeWidth={0.8} />
        </g>
      ))}
      <ellipse cx={14} cy={7} rx={4} ry={1.3} fill="#FFFFFF" opacity={0.8} />
    </svg>
  )
}

/** A rolled blueprint sheet with a drawn plan: the template. */
function BlueprintIcon({ w = 40 }: { w?: number }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg width={w} height={w} viewBox="0 0 40 40" aria-hidden style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={LAB.sky} />
          <stop offset="1" stopColor={LAB.cobalt} />
        </linearGradient>
      </defs>
      <ellipse cx={20} cy={37} rx={15} ry={2.5} fill="rgba(31,64,140,0.22)" />
      <rect x={4} y={5} width={32} height={28} rx={4} fill={`url(#${id}-b)`} />
      <path d="M 9 10 H 31 M 9 28 H 31 M 9 10 V 28 M 31 10 V 28 M 9 19 H 21 V 28 M 21 14 V 19" stroke="#FFFFFF" strokeWidth={1.4} fill="none" opacity={0.9} />
      <rect x={4} y={5} width={4} height={28} rx={2} fill={LAB.navy} opacity={0.5} />
      <path d="M 6 7 L 18 7 L 6 20 Z" fill="#FFFFFF" opacity={0.22} />
    </svg>
  )
}

/** A camera with a lit lens: the snapshot. */
function CameraIcon({ w = 40 }: { w?: number }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg width={w} height={w} viewBox="0 0 40 40" aria-hidden style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${id}-c`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3B52B0" />
          <stop offset="1" stopColor={LAB.navy} />
        </linearGradient>
        <radialGradient id={`${id}-l`} cx="0.35" cy="0.35" r="0.7">
          <stop offset="0" stopColor={LAB.sky} />
          <stop offset="1" stopColor={LAB.cobalt} />
        </radialGradient>
      </defs>
      <ellipse cx={20} cy={37} rx={15} ry={2.5} fill="rgba(31,64,140,0.22)" />
      <rect x={13} y={7} width={14} height={6} rx={2} fill={LAB.charcoal} />
      <rect x={4} y={11} width={32} height={22} rx={6} fill={`url(#${id}-c)`} />
      <circle cx={20} cy={22} r={8} fill="#E8EEFC" />
      <circle cx={20} cy={22} r={6} fill={`url(#${id}-l)`} />
      <circle cx={18} cy={20} r={1.8} fill="#FFFFFF" opacity={0.85} />
      <circle cx={31} cy={15.5} r={1.6} fill={LAB.yellow} />
      <path d="M 7 13 L 16 13 L 7 21 Z" fill="#FFFFFF" opacity={0.18} />
    </svg>
  )
}

function ArtifactCell({ icon, children }: { icon: ReactNode; children: string }) {
  return (
    <span className="inline-flex items-center gap-3">
      <span className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[12px]" style={TILE_SKIN}>
        {icon}
      </span>
      <span className="font-heading font-semibold" style={{ color: colors.ink }}>
        {children}
      </span>
    </span>
  )
}

export function Artifacts({ lesson }: { lesson: string }) {
  return (
    <TableCard
      id="Artifacts"
      kicker={'VM Packaging Artifacts'}
      title={'Three Reuse Types'}
      lead="Machine images, templates and snapshots all preserve VM state but differ in what they capture and when each is used."
      lesson={lesson}
      columns={[
        { label: 'Artifact', weight: 0.9 },
        { label: 'Captures', weight: 1.3 },
        { label: 'Typical Use', weight: 1.1 },
      ]}
      rows={[
        [<ArtifactCell key="i" icon={<DiskStackIcon w={32} />}>Machine image</ArtifactCell>, 'OS plus base software; no runtime state', 'Launch new VM instances'],
        [<ArtifactCell key="t" icon={<BlueprintIcon w={32} />}>Template</ArtifactCell>, 'Image plus fixed hardware spec', 'Standardise repeated VM deployments'],
        [<ArtifactCell key="s" icon={<CameraIcon w={32} />}>Snapshot</ArtifactCell>, 'Point-in-time state of a running VM', 'Rollback or pre-change backup'],
      ]}
    />
  )
}

/* ================================================================== 41 · creating a VM */

const STEPS: [string, string][] = [
  ['Create the VM', 'Give it a name and select the guest OS and ISO image'],
  ['Allocate resources', 'Assign RAM and virtual CPUs'],
  ['Create virtual storage', 'Choose the virtual disk size, format, and allocation type'],
  ['Configure networking', 'Select how the VM connects to the network, such as NAT'],
  ['Start the VM', 'Boot the guest OS from the selected ISO image'],
]
const NOTE_W = 340

export function CreateVm({ lesson }: { lesson: string }) {
  const lit = useCycle(STEPS.length, 2400, 0)
  return (
    <Card id="CreateVm" kicker={'Creating A VM'} title={'Basic Steps'} lead={lead('Creating a VM involves choosing the operating system, allocating virtual resources, and configuring how it connects to the network.')} lesson={lesson}>
      <div className="flex items-start gap-7" style={{ width: BOX_W }}>
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          {STEPS.map(([head, text], i) => (
            <div
              key={head}
              className="flex items-center gap-3.5 rounded-[14px] px-4 py-2.5"
              style={{
                ...TILE_SKIN,
                ...(lit === i ? { boxShadow: `inset 0 0 0 2px ${colors.brand}, inset 0 1px 0 #FFFFFF, 0 14px 26px -16px rgba(45,99,251,0.5)` } : {}),
                transition: `all 420ms ${EASE}`,
              }}
            >
              <Num n={i + 1} size={32} />
              <span className="text-[17px] leading-snug" style={{ color: colors.ink }}>
                <B>{head}:</B> {text}
              </span>
            </div>
          ))}
        </div>
        <ImportantNote width={NOTE_W} vbox>VirtualBox is used here only to build a basic understanding of how a VM is created. Creating Virtual Machines on a Cloud Platform will be covered in later sessions.</ImportantNote>
      </div>
    </Card>
  )
}
