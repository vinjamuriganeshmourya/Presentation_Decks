import { useId, type CSSProperties, type ReactNode } from 'react'
import { Camera, Clock, Copy, Gauge, Pause, Play, Power, Rocket, Server, ShoppingBag } from 'lucide-react'
import { colors } from '@/design/tokens'
import { Arrow, At, Label, Note, Num, useLoop } from '../scene'
import { ClayClock, ClayOsWindow, ClayPhone, ClayRack, ClayServer, ClayTaxi, LAB } from '../d3/kit'
import { TILE_SKIN } from '../card'
import { FigureOnly, PointsFigure, TableCard, Tiles } from '../iso/frames'
import { Logo, Marker, PairAnalogy } from './frames'

/**
 * SLIDES 53 TO 57: the VM lifecycle, state capture, live migration and the
 * cost of full VMs. Every string is the reference's. Each figure runs one
 * loop whose motion is the slide's claim: a token walks the six stages and
 * back round the return line (53); memory pages cross the link while the VM
 * keeps running, a brief pause, then the VM runs on Host B (55); the call and
 * the VM cross from A to B together (56); the boot bar fills slowly, the host
 * keeps empty slots, the idle VM still draws (57).
 */

const EASE = 'cubic-bezier(0.22,1,0.36,1)'
const RING = '#C3D3F0'
const GREY_LINK = '#9FB3D9'

/** A packet at phase `t` on the straight link `a` to `b`, moved by transform, fading at both ends. */
function Pkt({ a, b, t, tone = colors.warning, size = 14, on = true }: { a: [number, number]; b: [number, number]; t: number; tone?: string; size?: number; on?: boolean }) {
  const x = a[0] + (b[0] - a[0]) * t
  const y = a[1] + (b[1] - a[1]) * t
  const fade = Math.max(0, Math.min(1, t * 6, (1 - t) * 6))
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 rounded-[4px]"
      style={{ width: size, height: size, background: tone, boxShadow: `0 0 0 2px ${colors.white}, 0 4px 10px -2px ${tone}`, transform: `translate(${x - size / 2}px, ${y - size / 2}px)`, opacity: on ? fade : 0 }}
    />
  )
}

/** A small icon on a tinted tile, the head of a stage card or a table cell. */
function Glyph({ children, tone = colors.brand, bg = colors.surface2, size = 34 }: { children: ReactNode; tone?: string; bg?: string; size?: number }) {
  return (
    <span aria-hidden className="grid shrink-0 place-items-center rounded-[10px] [&>svg]:h-[18px] [&>svg]:w-[18px]" style={{ width: size, height: size, background: bg, color: tone, boxShadow: `inset 0 0 0 1px ${tone}22` }}>
      {children}
    </span>
  )
}

/* ================================================================== 53 · six lifecycle stages */

type Stage53 = { key: string; line: string; icon: ReactNode; tone: string; bg: string; x: number; y: number; w: number; h: number }

const MID = 153
const BR_Y = [20, 112, 204]
const BR_H = 82
const STAGES: Stage53[] = [
  { key: 'Provision', line: 'Allocate vCPU, memory, disk, NIC', icon: <Rocket />, tone: colors.brand, bg: colors.surface2, x: 24, y: MID - 44, w: 222, h: 88 },
  { key: 'Start', line: 'Boot guest OS on virtual hardware', icon: <Play />, tone: colors.success, bg: '#E9F8EF', x: 292, y: MID - 44, w: 222, h: 88 },
  { key: 'Suspend', line: 'Pause execution; save state to disk', icon: <Pause />, tone: colors.brand, bg: colors.surface2, x: 566, y: BR_Y[0], w: 278, h: BR_H },
  { key: 'Snapshot', line: 'Capture point-in-time disk/state image', icon: <Camera />, tone: colors.brand, bg: colors.surface2, x: 566, y: BR_Y[1], w: 278, h: BR_H },
  { key: 'Clone', line: 'Duplicate VM as new independent instance', icon: <Copy />, tone: colors.brand, bg: colors.surface2, x: 566, y: BR_Y[2], w: 278, h: BR_H },
  { key: 'Terminate', line: 'Shut down guest; release resources', icon: <Power />, tone: colors.danger, bg: '#FDECEC', x: 890, y: MID - 44, w: 196, h: 88 },
]
const RET_Y = 316
const P_X = STAGES[0].x + STAGES[0].w / 2
const T_X = STAGES[5].x + STAGES[5].w / 2
const LBL_L = 372
const LBL_R = 738

type Seg = { card: number } | { pts: [number, number][] }

/** One lap of the token: Provision, Start, branch `k`, Terminate, and back along the return line. */
function lap(k: number): { seg: Seg; w: number }[] {
  const b = STAGES[2 + k]
  const bc = b.y + b.h / 2
  const s0 = STAGES[0]
  const s1 = STAGES[1]
  const t = STAGES[5]
  return [
    { seg: { card: 0 }, w: 1.1 },
    { seg: { pts: [[s0.x + s0.w, MID], [s1.x, MID]] }, w: 0.6 },
    { seg: { card: 1 }, w: 1.1 },
    { seg: { pts: [[s1.x + s1.w, MID], [b.x, bc]] }, w: 0.7 },
    { seg: { card: 2 + k }, w: 1.4 },
    { seg: { pts: [[b.x + b.w, bc], [t.x, MID]] }, w: 0.6 },
    { seg: { card: 5 }, w: 1.1 },
    { seg: { pts: [[T_X, t.y + t.h], [T_X, RET_Y], [P_X, RET_Y], [P_X, s0.y + s0.h]] }, w: 2.2 },
  ]
}

function along(pts: [number, number][], u: number): [number, number] {
  const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]))
  let d = u * lens.reduce((a, b) => a + b, 0)
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) {
      const f = lens[i] ? Math.min(1, d / lens[i]) : 0
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f]
    }
    d -= lens[i]
  }
  return pts[pts.length - 1]
}

function StageCard({ s, lit }: { s: Stage53; lit: boolean }) {
  return (
    <div
      className="absolute flex items-start gap-2.5 rounded-[16px] px-3 py-2.5"
      style={{
        left: s.x,
        top: s.y,
        width: s.w,
        height: s.h,
        ...TILE_SKIN,
        boxShadow: `inset 0 0 0 ${lit ? 2.5 : 1.5}px ${s.tone}, inset 0 1px 0 #FFFFFF, 0 ${lit ? 18 : 12}px ${lit ? 28 : 24}px -16px ${lit ? s.tone : 'rgba(31,64,140,0.34)'}`,
        transform: lit ? 'translateY(-3px)' : 'none',
        transition: `all 420ms ${EASE}`,
      }}
    >
      <Glyph tone={s.tone} bg={s.bg}>
        {s.icon}
      </Glyph>
      <div className="min-w-0">
        <div className="font-heading text-[17px] font-semibold leading-tight" style={{ color: colors.ink }}>
          {s.key}
        </div>
        <div className="mt-1 text-[15px] leading-snug" style={{ color: colors.muted }}>
          {s.line}
        </div>
      </div>
    </div>
  )
}

export function Lifecycle({ lesson }: { lesson: string }) {
  /* three laps, one through each branch */
  const t = useLoop(27000, { mode: 'sawtooth', still: 0.12 })
  const k = Math.min(2, Math.floor(t * 3))
  const u = t * 3 - k
  const segs = lap(k)
  const total = segs.reduce((a, s) => a + s.w, 0)
  let acc = 0
  let litCard = -1
  let dot: [number, number] | null = null
  for (const s of segs) {
    const f = s.w / total
    if (u <= acc + f) {
      const v = (u - acc) / f
      if ('card' in s.seg) litCard = s.seg.card
      else dot = along(s.seg.pts, v)
      break
    }
    acc += f
  }
  const s0 = STAGES[0]
  const s1 = STAGES[1]
  const term = STAGES[5]
  return (
    <FigureOnly
      id="lifecycle"
      kicker="Lifecycle Stages Map"
      title="Six Lifecycle Stages"
      lead="A virtual machine moves through a defined lifecycle from creation to teardown, with administrator or platform actions triggering each transition."
      lesson={lesson}
      h={350}
    >
      <Arrow x1={s0.x + s0.w} y1={MID} x2={s1.x - 2} y2={MID} />
      {STAGES.slice(2, 5).map((b, i) => (
        <Arrow key={b.key} x1={s1.x + s1.w + 2} y1={MID} x2={b.x - 2} y2={b.y + b.h / 2} dashed tone={k === i ? colors.brand : GREY_LINK} />
      ))}
      {STAGES.slice(2, 5).map((b, i) => (
        <Arrow key={b.key + '-t'} x1={b.x + b.w + 2} y1={b.y + b.h / 2} x2={term.x - 2} y2={MID} dashed tone={k === i ? colors.brand : GREY_LINK} />
      ))}
      {/* the return line: what makes it a cycle */}
      <svg aria-hidden className="pointer-events-none absolute left-0 top-0" width={1110} height={350}>
        <path d={`M ${T_X} ${term.y + term.h + 2} V ${RET_Y} H ${LBL_R}`} stroke={colors.brandDeep} strokeWidth={2.5} strokeDasharray="7 7" fill="none" strokeLinecap="round" />
        <path d={`M ${LBL_L} ${RET_Y} H ${P_X} V ${s0.y + s0.h + 12}`} stroke={colors.brandDeep} strokeWidth={2.5} strokeDasharray="7 7" fill="none" strokeLinecap="round" />
        <path d={`M ${P_X} ${s0.y + s0.h + 2} l -6 10 h 12 z`} fill={colors.brandDeep} />
      </svg>
      <At x={(LBL_L + LBL_R) / 2} y={RET_Y} cx cy>
        <Label raised strong size={15}>
          Released resources go back to the host for the next VM
        </Label>
      </At>
      {STAGES.map((s, i) => (
        <StageCard key={s.key} s={s} lit={litCard === i} />
      ))}
      {dot && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 rounded-full"
          style={{ width: 16, height: 16, background: colors.accent, boxShadow: `0 0 0 4px ${colors.accent}40, 0 0 0 2px ${colors.white} inset`, transform: `translate(${dot[0] - 8}px, ${dot[1] - 8}px)` }}
        />
      )}
    </FigureOnly>
  )
}

/* ================================================================== 54 · state capture compared */

function Op({ icon, name }: { icon: ReactNode; name: string }) {
  return (
    <span className="inline-flex items-center gap-3">
      <Glyph>{icon}</Glyph>
      <span className="font-heading font-semibold" style={{ color: colors.ink }}>
        {name}
      </span>
    </span>
  )
}

function OnAws({ mark, children }: { mark: 'ec2' | 'ebsSnapshot' | 'ec2Ami'; children: string }) {
  return (
    <span className="inline-flex items-center gap-3">
      <Logo name={mark} h={30} style={{ flexShrink: 0 }} />
      <span>{children}</span>
    </span>
  )
}

export function SuspendSnapshotClone({ lesson }: { lesson: string }) {
  return (
    <TableCard
      id="suspend-snapshot-clone"
      kicker="Suspend Snapshot Clone"
      title="State-Capture Compared"
      lead="Suspend, snapshot and clone all preserve VM state, but differ in what they capture and how the VM resumes, a frequent interview distinction."
      lesson={lesson}
      columns={[
        { label: 'Operation', weight: 0.75 },
        { label: 'Captures', weight: 1.2 },
        { label: 'Resumes As', weight: 1 },
        { label: 'On AWS', weight: 1.25 },
      ]}
      rows={[
        [<Op key="o" icon={<Pause />} name="Suspend" />, 'RAM and CPU state, paused to disk', 'Same VM, same execution point', <OnAws key="a" mark="ec2">EC2 hibernate: stop with RAM saved to EBS</OnAws>],
        [<Op key="o" icon={<Camera />} name="Snapshot" />, 'Point-in-time disk (and optional memory) image', 'Rollback point for that VM', <OnAws key="a" mark="ebsSnapshot">EBS snapshot: backup and disaster-recovery point</OnAws>],
        [<Op key="o" icon={<Copy />} name="Clone" />, 'Full copy of disk and configuration', 'New, independent VM booting fresh', <OnAws key="a" mark="ec2Ami">AMI clone: launch identical new instances at scale</OnAws>],
      ]}
    />
  )
}

/* ================================================================== 55 · live migration */

/** A VM as a raised chip: `solid` running, `ghost` the dashed slot filling as pages land, `paused` the brief stop. */
function VmChip({ state, fill = 0 }: { state: 'run' | 'ghost' | 'paused' | 'empty'; fill?: number }) {
  const solid = state === 'run' || state === 'paused'
  return (
    <div
      className="relative grid place-items-center overflow-hidden rounded-[14px]"
      style={{
        width: 150,
        height: 62,
        background: solid ? 'linear-gradient(180deg, #F3F7FF 0%, #DCE7FF 100%)' : 'rgba(255,255,255,0.6)',
        boxShadow: solid ? `inset 0 0 0 2px ${state === 'paused' ? colors.warning : colors.brand}, 0 12px 22px -14px ${colors.brand}` : 'none',
        outline: solid ? 'none' : `2px dashed ${state === 'empty' ? LAB.lavDeep : colors.brand}`,
        outlineOffset: -2,
        transition: `all 420ms ${EASE}`,
      }}
    >
      {state === 'ghost' && <span aria-hidden className="absolute inset-x-0 bottom-0 origin-bottom" style={{ height: '100%', background: 'rgba(45,99,251,0.16)', transform: `scaleY(${fill})` }} />}
      <span className="relative font-heading text-[20px] font-bold" style={{ color: state === 'empty' ? LAB.lavDeep : colors.brandDark, transition: `color 420ms ${EASE}` }}>
        VM
      </span>
      {solid && (
        <span aria-hidden className="absolute right-2.5 top-2.5 grid h-[16px] w-[16px] place-items-center rounded-full" style={{ background: state === 'paused' ? colors.warning : colors.success, boxShadow: `0 0 0 3px ${state === 'paused' ? colors.warning : colors.success}33` }}>
          {state === 'paused' && <Pause size={9} color="#fff" strokeWidth={3} />}
        </span>
      )}
    </div>
  )
}

function Host({ x, name, vm, live }: { x: number; name: string; vm: ReactNode; live: boolean }) {
  return (
    <>
      <div className="absolute rounded-[18px]" style={{ left: x, top: 20, width: 196, height: 184, ...TILE_SKIN, boxShadow: `inset 0 0 0 ${live ? 2 : 1.5}px ${live ? colors.brandDeep : RING}, inset 0 1px 0 #FFFFFF, 0 14px 26px -16px rgba(31,64,140,0.4)`, transition: `all 420ms ${EASE}` }} />
      <At x={x + 98} y={32} cx>
        {vm}
      </At>
      <At x={x + 98} y={104} cx>
        <ClayServer w={140} state={live ? 'run' : 'idle'} />
      </At>
      <At x={x + 98} y={166} cx>
        <Label strong size={16} tone="dark">
          {name}
        </Label>
      </At>
    </>
  )
}

const PHASES = ['Pages copied while the VM keeps running', 'Brief pause: the last state is synced', 'VM resumes on Host B']

export function LiveMigration({ lesson }: { lesson: string }) {
  const t = useLoop(10000, { mode: 'sawtooth', still: 0.3 })
  const phase = t < 0.56 ? 0 : t < 0.74 ? 1 : 2
  const copied = Math.min(1, t / 0.56)
  const A: [number, number] = [220, 130]
  const B: [number, number] = [414, 130]
  return (
    <PointsFigure
      id="live-migration"
      kicker="Live Migration"
      title="Moving A Running VM"
      lead="Live migration transfers a running VM's memory and execution state to another physical host with near-zero downtime, unlike suspend which pauses the guest."
      lesson={lesson}
      points={['Why: host maintenance, hardware-failure avoidance, load balancing', 'How: memory pages copied over network while VM keeps running', 'Final step: brief pause syncs last state, then resume', 'Transparent to guest OS and its running applications']}
      figure={
        <>
          {/* the network link */}
          <div aria-hidden className="absolute rounded-full" style={{ left: A[0], top: A[1] - 2.5, width: B[0] - A[0], height: 5, background: colors.brandDeep }} />
          {phase === 0 && [0, 1, 2].map((i) => <Pkt key={i} a={A} b={B} t={(t * 5.4 + i / 3) % 1} />)}
          {phase === 1 && <Pkt a={A} b={B} t={(t - 0.56) / 0.18} />}
          <At x={(A[0] + B[0]) / 2} y={146} cx w={180}>
            <Note size={15} tone="#9A5B00" className="text-center font-semibold">
              memory pages, over the network
            </Note>
          </At>
          <Host x={24} name="Host A" live={phase < 2} vm={<VmChip state={phase === 0 ? 'run' : phase === 1 ? 'paused' : 'empty'} />} />
          <Host x={414} name="Host B" live={phase === 2} vm={<VmChip state={phase === 2 ? 'run' : 'ghost'} fill={phase === 0 ? copied * 0.85 : 1} />} />
          {PHASES.map((p, i) => (
            <div
              key={p}
              className="absolute flex items-center gap-3 rounded-xl px-3"
              style={{
                left: 24,
                top: 222 + i * 36,
                width: 586,
                height: 30,
                background: phase === i ? colors.surface2 : colors.white,
                boxShadow: `inset 0 0 0 ${phase === i ? 2 : 1}px ${phase === i ? colors.brand : '#D5E1F7'}`,
                transition: `all 420ms ${EASE}`,
              }}
            >
              <Num n={i + 1} size={22} on={phase === i} />
              <span className="font-heading text-[15px] font-semibold" style={{ color: colors.ink }}>
                {p}
              </span>
            </div>
          ))}
        </>
      }
      figH={342}
    />
  )
}

/* ================================================================== 56 · a call between towers */

/** A lattice phone tower, front-facing, lit from the upper left; rings at the top while it carries the call. */
function Tower({ on, h = 170 }: { on: boolean; h?: number }) {
  const id = useId().replace(/:/g, '')
  const w = (h * 70) / 170
  return (
    <div className="relative" style={{ width: w, height: h }}>
      {[0, 1].map((r) => (
        <span
          key={r}
          aria-hidden
          className="absolute rounded-full"
          style={{ left: w / 2 - 30 - r * 18, top: 14 - 30 - r * 18, width: 60 + r * 36, height: 60 + r * 36, boxShadow: `inset 0 0 0 2px ${colors.brand}`, opacity: on ? 0.5 - r * 0.2 : 0, transition: `opacity 520ms ${EASE}` }}
        />
      ))}
      <svg width={w} height={h} viewBox="0 0 70 170" aria-hidden style={{ display: 'block', overflow: 'visible', position: 'relative' }}>
        <defs>
          <linearGradient id={`${id}-leg`} x1="0" x2="1">
            <stop offset="0" stopColor={on ? LAB.sky : '#8FA3C8'} />
            <stop offset="1" stopColor={on ? LAB.cobalt : '#56688F'} />
          </linearGradient>
          <radialGradient id={`${id}-tip`} cx="0.35" cy="0.35" r="0.7">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.4" stopColor={on ? LAB.sky : '#AFC0DE'} />
            <stop offset="1" stopColor={on ? LAB.cobalt : '#56688F'} />
          </radialGradient>
        </defs>
        <ellipse cx={35} cy={167} rx={30} ry={3.5} fill="rgba(31,64,140,0.2)" />
        <g stroke={`url(#${id}-leg)`} strokeWidth={5} strokeLinecap="round" fill="none" style={{ transition: `all 520ms ${EASE}` }}>
          <path d="M 35 18 L 10 164 M 35 18 L 60 164" />
          <path d="M 23 88 L 47 88 M 16 126 L 54 126 M 23 88 L 54 126 M 47 88 L 16 126 M 29 52 L 41 52 M 29 52 L 47 88 M 41 52 L 23 88" strokeWidth={3} />
        </g>
        <circle cx={35} cy={14} r={9} fill={`url(#${id}-tip)`} />
      </svg>
    </div>
  )
}

const CAR_X = [205, 250, 295]
const VM_X = [118, 250, 382]

function PhoneScene(lit: number) {
  return (
    <>
      <div aria-hidden className="absolute rounded-full" style={{ left: 24, top: 222, width: 452, height: 12, background: 'linear-gradient(180deg, #C9D5EC, #AFC0DE)' }} />
      <div aria-hidden className="absolute" style={{ left: 36, top: 227, width: 428, height: 2, backgroundImage: 'repeating-linear-gradient(90deg, #FFFFFF 0 14px, transparent 14px 26px)' }} />
      <At x={72} y={48}>
        <div style={{ transform: lit === 0 ? 'translateY(-4px)' : 'none', opacity: lit === 2 ? 0.55 : 1, transition: `all 520ms ${EASE}` }}>
          <Tower on={lit === 0 || lit === 1} />
        </div>
      </At>
      <At x={358} y={48}>
        <div style={{ transform: lit === 2 ? 'translateY(-4px)' : 'none', opacity: lit === 0 ? 0.55 : 1, transition: `all 520ms ${EASE}` }}>
          <Tower on={lit === 2} />
        </div>
      </At>
      <At x={128} y={30}>
        <Marker n={1} on={lit === 0} />
      </At>
      <At x={414} y={30}>
        <Marker n={3} on={lit === 2} />
      </At>
      {/* the car with the call on board drives from tower A's cell into tower B's */}
      <div className="absolute" style={{ left: CAR_X[lit], top: 104, transform: 'translateX(-50%)', transition: `left 2200ms ${EASE}` }}>
        <div className="flex flex-col items-center">
          <Marker n={2} on={lit === 1} />
          <div className="mt-1.5" style={{ transform: lit === 1 ? 'translateY(-3px) scale(1.06)' : 'none', transition: `transform 420ms ${EASE}` }}>
            <ClayPhone w={20} lit />
          </div>
          <div className="mt-1">
            <ClayTaxi w={116} />
          </div>
        </div>
      </div>
    </>
  )
}

function MigrationScene(lit: number) {
  const A: [number, number] = [166, 186]
  const B: [number, number] = [334, 186]
  const t = useLoop(2400, { mode: 'sawtooth', still: 0.5 })
  return (
    <>
      <div aria-hidden className="absolute rounded-full" style={{ left: A[0], top: A[1] - 2.5, width: B[0] - A[0], height: 5, background: colors.brandDeep }} />
      {lit === 1 && [0, 1].map((i) => <Pkt key={i} a={A} b={B} t={(t + i / 2) % 1} size={12} />)}
      {/* the empty slots the VM leaves and arrives at */}
      {[VM_X[0], VM_X[2]].map((x) => (
        <div key={x} aria-hidden className="absolute rounded-[12px]" style={{ left: x - 42, top: 46, width: 84, height: 66, outline: `2px dashed ${LAB.lavDeep}`, outlineOffset: -2, opacity: 0.8 }} />
      ))}
      <At x={VM_X[0]} y={138} cx>
        <div style={{ transform: lit === 0 ? 'translateY(-4px)' : 'none', opacity: lit === 2 ? 0.6 : 1, transition: `all 520ms ${EASE}`, transformOrigin: 'bottom' }}>
          <div>
            <ClayRack w={96} units={['run', lit === 2 ? 'idle' : 'run', 'idle']} />
          </div>
        </div>
      </At>
      <At x={VM_X[2]} y={138} cx>
        <div style={{ transform: lit === 2 ? 'translateY(-4px)' : 'none', opacity: lit === 0 ? 0.6 : 1, transition: `all 520ms ${EASE}` }}>
          <div>
            <ClayRack w={96} units={['run', lit === 2 ? 'run' : 'idle', 'idle']} />
          </div>
        </div>
      </At>
      <At x={VM_X[0] - 72} y={136}>
        <Marker n={1} on={lit === 0} />
      </At>
      <At x={VM_X[2] + 44} y={136}>
        <Marker n={3} on={lit === 2} />
      </At>
      {/* the running VM, a guest OS window, crosses with the call */}
      <div className="absolute" style={{ left: VM_X[lit], top: 40, transform: 'translateX(-50%)', transition: `left 2200ms ${EASE}` }}>
        <div className="relative" style={{ transform: lit === 1 ? 'translateY(-3px) scale(1.05)' : 'none', transition: `transform 420ms ${EASE}` }}>
          <ClayOsWindow w={78} k={0} />
          <span className="absolute" style={{ left: 24, top: 18 }}>
            <Marker n={2} on={lit === 1} />
          </span>
        </div>
      </div>
    </>
  )
}

export function LiveAnalogy({ lesson }: { lesson: string }) {
  return (
    <PairAnalogy
      id="live-analogy"
      kicker="Live Migration"
      title="A Call Between Towers"
      lesson={lesson}
      everyday={{ label: 'A phone call on the move', scene: (lit) => PhoneScene(lit) }}
      cloud={{ label: 'Live migration', scene: (lit) => <MigrationSceneHost lit={lit} /> }}
      pairs={[
        ['Tower A', 'Host A'],
        ['The call never drops', 'The VM keeps running'],
        ['Tower B', 'Host B'],
      ]}
    />
  )
}

/** A component wrapper, so the scene's own loop hook has a stable home. */
function MigrationSceneHost({ lit }: { lit: number }) {
  return MigrationScene(lit)
}

/* ================================================================== 57 · cost of full VMs */

function Head({ icon }: { icon: ReactNode }) {
  return (
    <div className="absolute inset-x-0 flex justify-center" style={{ top: 18 }}>
      <span aria-hidden className="grid h-[44px] w-[44px] place-items-center rounded-[12px] [&>svg]:h-[22px] [&>svg]:w-[22px]" style={{ background: '#FDECEC', color: colors.danger, boxShadow: '0 8px 16px -10px rgba(239,68,68,0.5)' }}>
        {icon}
      </span>
    </div>
  )
}

function Plate({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="absolute inset-x-5 flex items-center justify-center rounded-[14px]" style={{ top: 72, height: 100, background: 'rgba(232,240,255,0.55)', boxShadow: 'inset 0 0 0 1px #DCE6F8', ...style }}>
      {children}
    </div>
  )
}

export function Cost({ lesson }: { lesson: string }) {
  const t = useLoop(8000, { mode: 'sawtooth', still: 0.62 })
  /* the boot bar fills slowly over most of the lap, then holds */
  const boot = Math.min(1, t / 0.8)
  /* VMs drop into the host one by one; four slots stay empty */
  const placed = t < 0.25 ? 0 : t < 0.5 ? 1 : 2
  /* the idle VM's draw wobbles around a third, never falling to zero */
  const idle = 0.36 + Math.sin(t * Math.PI * 4) * 0.05
  const tiles = [
    {
      title: 'Heavy footprint',
      sub: 'Full guest OS for each VM',
      scene: (
        <>
          <Head icon={<ShoppingBag />} />
          <Plate>
            <div className="flex flex-col items-center gap-1.5">
              <Label strong size={15}>
                App
              </Label>
              <span className="rounded-[10px] px-6 py-2 font-heading text-[17px] font-bold text-white" style={{ background: `linear-gradient(180deg, #FF6B6B, ${colors.danger})`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.4), 0 12px 20px -10px ${colors.danger}` }}>
                Full guest OS
              </span>
            </div>
          </Plate>
        </>
      ),
    },
    {
      title: 'Slow to start',
      sub: 'Full OS boot time',
      scene: (
        <>
          <Head icon={<Clock />} />
          <Plate>
            <div className="flex items-center gap-3">
              <ClayClock w={52} turn={t} />
              <span aria-hidden className="relative h-[12px] w-[130px] overflow-hidden rounded-full" style={{ background: colors.line }}>
                <span className="absolute inset-0 origin-left rounded-full" style={{ background: colors.danger, transform: `scaleX(${boot})` }} />
              </span>
            </div>
          </Plate>
        </>
      ),
    },
    {
      title: 'Low density',
      sub: 'Fewer VMs fit on each host',
      scene: (
        <>
          <Head icon={<Server />} />
          <Plate>
            <div className="grid grid-cols-3 gap-1.5 rounded-[12px] p-1.5" style={{ width: 150, background: colors.white, boxShadow: `inset 0 0 0 2.5px ${colors.brandDeep}, 0 10px 18px -12px rgba(16,32,58,0.5)` }}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  aria-hidden
                  className="h-[30px] rounded-[6px]"
                  style={
                    i < placed
                      ? { background: `linear-gradient(180deg, ${LAB.sky}, ${colors.brand})`, transition: `all 420ms ${EASE}` }
                      : { outline: `1.5px dashed ${colors.line}`, outlineOffset: -1.5, transition: `all 420ms ${EASE}` }
                  }
                />
              ))}
            </div>
          </Plate>
        </>
      ),
    },
    {
      title: 'Wastes resources at idle',
      sub: 'Full OS overhead even when idle',
      scene: (
        <>
          <Head icon={<Gauge />} />
          <Plate>
            <div className="flex flex-col items-center gap-2">
              <span className="font-heading text-[15px] font-semibold" style={{ color: colors.ink }}>
                Idle VM, still using
              </span>
              <span aria-hidden className="relative h-[12px] w-[170px] overflow-hidden rounded-full" style={{ background: colors.line }}>
                <span className="absolute inset-0 origin-left rounded-full" style={{ background: colors.danger, transform: `scaleX(${idle})` }} />
              </span>
            </div>
          </Plate>
        </>
      ),
    },
  ]
  return (
    <Tiles
      id="cost"
      kicker="Cost Of Full VMs"
      title="Overhead Across Lifecycle"
      lead="Every lifecycle stage above carries the weight of a complete guest operating system, and that weight is the practical limitation of server virtualization."
      lesson={lesson}
      tiles={tiles}
      sceneH={182}
      h={290}
    />
  )
}

