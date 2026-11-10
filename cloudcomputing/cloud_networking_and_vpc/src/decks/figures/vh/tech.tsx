import { useId, type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { Callout, DataTable } from '@/ui'
import { Arrow, At, B, BOX_W, Card, Stage, Traveller, useCycle, useLoop } from '../scene'
import { ClayBar, ClayBell, ClayOsWindow, GroundShadow, Icon3D, LAB } from '../d3/kit'
import { PointsFigure, Points, lead } from '../iso/frames'
import { Logo, Marker, PairAnalogy } from './frames'

/**
 * SECTION · VIRTUALIZATION TECHNIQUES (reference frames 27 to 35), in session
 * 1's 3D finish: raised chips and glossy slabs for the TR's boxes, session 1's
 * OS window for a guest, a drawn CPU package for the physical CPU, library
 * renders for people, every object on its soft ground shadow; labels are DOM.
 *
 * The arrow grammar the reference fixes on frame 27 holds for the section:
 * a dashed amber arrow is a software trap, a solid blue one a hypercall, a
 * teal one through a CPU a CPU trap. Every figure runs one loop whose motion
 * is the slide's claim: the trapped instruction travels from the guest to the
 * hypervisor, the hypercall goes straight there, the CPU exits to root mode
 * and enters the guest again.
 */

const EASE = 'cubic-bezier(0.22,1,0.36,1)'
const TRAP = colors.warning
const TRAP_INK = '#9A5B00'
const TEAL = colors.teal

/** 0 before a, 1 after b, eased between. */
function within(t: number, a: number, b: number) {
  if (t <= a) return 0
  if (t >= b) return 1
  const x = (t - a) / (b - a)
  return x * x * (3 - 2 * x)
}

/** A point `u` (0..1) of the way along a polyline. */
function along(pts: [number, number][], u: number): [number, number] {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]))
  const total = seg.reduce((a, b) => a + b, 0)
  let d = Math.max(0, Math.min(1, u)) * total
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i] || i === seg.length - 1) {
      const f = seg[i] ? Math.min(1, d / seg[i]) : 0
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f]
    }
    d -= seg[i]
  }
  return pts[pts.length - 1]
}

/** A travelling dot placed by the scene's own loop (never keyed, so it never jumps). */
function Dot({ at, tone, size = 14, on = true }: { at: [number, number]; tone: string; size?: number; on?: boolean }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 rounded-full"
      style={{ width: size, height: size, background: tone, boxShadow: `0 0 0 4px ${tone}40`, transform: `translate(${at[0] - size / 2}px, ${at[1] - size / 2}px)`, opacity: on ? 1 : 0, transition: `opacity 260ms ${EASE}` }}
    />
  )
}

/* ------------------------------------------------------------------ the drawn objects */

/** The physical CPU: a front-facing package, navy body lit from the upper left, pins on four sides, a die that glows when it runs. */
function CpuChip({ s, lit = false }: { s: number; lit?: boolean }) {
  const id = useId().replace(/:/g, '')
  const pins = [28, 42, 58, 72]
  return (
    <div className="flex flex-col items-center" style={{ width: s }}>
      <svg width={s} height={s} viewBox="0 0 100 100" aria-hidden>
        <defs>
          <linearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2C4FA8" />
            <stop offset="1" stopColor={colors.brandDeep} />
          </linearGradient>
          <linearGradient id={`${id}d`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#A9C8FF" />
            <stop offset="1" stopColor="#4C82F0" />
          </linearGradient>
          <radialGradient id={`${id}g`}>
            <stop offset="0" stopColor="#7FB0FF" stopOpacity="0.9" />
            <stop offset="1" stopColor="#7FB0FF" stopOpacity="0" />
          </radialGradient>
        </defs>
        {pins.map((p) => (
          <g key={p} fill="#8EA3D6">
            <rect x={p - 2.5} y={4} width={5} height={12} rx={2} />
            <rect x={p - 2.5} y={84} width={5} height={12} rx={2} />
            <rect x={4} y={p - 2.5} width={12} height={5} rx={2} />
            <rect x={84} y={p - 2.5} width={12} height={5} rx={2} />
          </g>
        ))}
        <rect x={14} y={14} width={72} height={72} rx={12} fill={`url(#${id}b)`} />
        <path d="M 18 16 L 62 16 L 18 58 Z" fill="#FFFFFF" opacity={0.12} />
        <circle cx={50} cy={50} r={30} fill={`url(#${id}g)`} style={{ opacity: lit ? 1 : 0, transition: `opacity 420ms ${EASE}` }} />
        <rect x={31} y={31} width={38} height={38} rx={7} fill={`url(#${id}d)`} />
        <rect x={34} y={33} width={18} height={4} rx={2} fill="#FFFFFF" opacity={0.5} />
      </svg>
      <GroundShadow w={s} />
    </div>
  )
}

/** A raised white chip with a blue ring: a box the TR names (a guest, a kernel). */
function Chip({ w, h, children, size = 16, lit = false, style }: { w: number; h: number; children: ReactNode; size?: number; lit?: boolean; style?: CSSProperties }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl text-center font-heading font-semibold leading-tight"
      style={{
        width: w,
        height: h,
        fontSize: size,
        color: colors.ink,
        background: 'linear-gradient(180deg, #FFFFFF 0%, #EEF3FD 100%)',
        boxShadow: `inset 0 0 0 ${lit ? 2.5 : 1.5}px ${lit ? colors.brand : '#C3D3F0'}, 0 10px 18px -12px rgba(16,32,58,0.45)`,
        transform: lit ? 'translateY(-3px)' : 'none',
        transition: `all 420ms ${EASE}`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** The hypervisor: session 1's brand slab with its name on it, glowing while it handles a trap. */
function HvBar({ w, h, glow = false, children = 'Hypervisor', size = 17, fill = colors.brand }: { w: number; h: number; glow?: boolean; children?: ReactNode; size?: number; fill?: string }) {
  return (
    <div className="relative" style={{ width: w, height: h, borderRadius: Math.min(16, h / 2), boxShadow: glow ? `0 0 0 5px ${colors.brand}33, 0 0 22px ${colors.brand}88` : '0 12px 20px -14px rgba(16,32,58,0.6)', transition: `box-shadow 420ms ${EASE}` }}>
      <ClayBar w={w} h={h} fill={fill}>
        <span className="font-heading font-semibold" style={{ fontSize: size, color: colors.white }}>
          {children}
        </span>
      </ClayBar>
    </div>
  )
}

/* ================================================================== 27 · three techniques */

type Kind = 'trap' | 'hypercall' | 'cpu'
const TECHS: { name: string; guest: string; arrow: string; kind: Kind; text: string }[] = [
  { name: 'Full virtualization', guest: 'Unmodified guest', arrow: 'software trap', kind: 'trap', text: 'Unmodified guest; software handles sensitive instructions (trap-and-emulate plus binary translation)' },
  { name: 'Para-virtualization', guest: 'Modified guest', arrow: 'hypercall', kind: 'hypercall', text: 'Modified guest, direct hypercalls to hypervisor' },
  { name: 'Hardware-assisted', guest: 'Unmodified guest', arrow: 'CPU trap', kind: 'cpu', text: 'CPU itself traps sensitive instructions' },
]
const KIND_TONE: Record<Kind, string> = { trap: TRAP, hypercall: colors.brand, cpu: TEAL }
const KIND_LABEL: Record<Kind, CSSProperties> = {
  trap: { background: '#FFF4E0', color: TRAP_INK, boxShadow: `inset 0 0 0 1.5px ${TRAP}` },
  hypercall: { background: colors.surface2, color: colors.brandDark, boxShadow: `inset 0 0 0 1.5px ${colors.brand}` },
  cpu: { background: '#E3F7F5', color: colors.tealDark, boxShadow: `inset 0 0 0 1.5px ${TEAL}` },
}

function TechColumn({ tech, t }: { tech: (typeof TECHS)[number]; t: number }) {
  const W = 356
  const cx = W / 2
  const tone = KIND_TONE[tech.kind]
  const p = within(t, 0.1, 0.62)
  const arrived = t > 0.6 && t < 0.95
  const y0 = 118
  const y1 = 184
  return (
    <Stage w={W} h={340} active={false}>
      <At x={cx} y={20} cx>
        <span className="block whitespace-nowrap font-heading text-[19px] font-semibold" style={{ color: colors.ink }}>
          {tech.name}
        </span>
      </At>
      <At x={48} y={58}>
        <Chip w={260} h={52} size={17} lit={p > 0 && p < 1}>
          {tech.guest}
        </Chip>
      </At>
      {tech.kind === 'cpu' ? (
        <>
          <div aria-hidden className="absolute rounded-full" style={{ left: cx - 1.25, top: y0, width: 2.5, height: 14, background: tone }} />
          <Arrow x1={cx} y1={y0 + 50} x2={cx} y2={y1} tone={tone} />
        </>
      ) : (
        <Arrow x1={cx} y1={y0} x2={cx} y2={y1} tone={tone} dashed={tech.kind === 'trap'} />
      )}
      <Dot at={[cx, y0 + 4 + (y1 - y0 - 12) * p]} tone={tone} size={13} on={p > 0 && p < 1} />
      {tech.kind === 'cpu' && (
        <At x={cx - 19} y={y0 + 12}>
          <CpuMini lit={p > 0.3 && p < 0.75} />
        </At>
      )}
      <At x={cx + 30} y={(y0 + y1) / 2} cy>
        <span className="inline-block whitespace-nowrap rounded-pill px-3 py-1 font-heading text-[16px] font-semibold" style={KIND_LABEL[tech.kind]}>
          {tech.arrow}
        </span>
      </At>
      <At x={48} y={190}>
        <HvBar w={260} h={52} glow={arrived} />
      </At>
      <At x={20} y={258} w={W - 40}>
        <p className="text-center text-[16px] leading-snug" style={{ color: colors.ink }}>
          {tech.text}
        </p>
      </At>
    </Stage>
  )
}

/** A small CPU on the hardware-assisted arrow: the CPU itself is where the trap happens. */
function CpuMini({ lit }: { lit: boolean }) {
  return (
    <div className="grid place-items-center rounded-[9px]" style={{ width: 38, height: 38, background: `linear-gradient(135deg, #1FC7B8 0%, ${colors.tealDark} 100%)`, boxShadow: lit ? `0 0 0 5px ${TEAL}40, 0 0 16px ${TEAL}` : '0 8px 14px -8px rgba(16,32,58,0.5)', transition: `box-shadow 420ms ${EASE}` }}>
      <span className="block rounded-[4px]" style={{ width: 16, height: 16, background: 'rgba(255,255,255,0.85)', gridArea: '1 / 1' }} />
      <span aria-hidden className="block self-start justify-self-start rounded-full" style={{ width: 12, height: 3, marginTop: 5, marginLeft: 6, background: 'rgba(255,255,255,0.45)', gridArea: '1 / 1' }} />
    </div>
  )
}

function TechniquesScene() {
  const t = useLoop(4200, { mode: 'sawtooth', still: 0.4 })
  return (
    <div className="flex" style={{ width: BOX_W, gap: 21 }}>
      {TECHS.map((tech) => (
        <TechColumn key={tech.name} tech={tech} t={t} />
      ))}
    </div>
  )
}

export function Techniques({ lesson }: { lesson: string }) {
  return (
    <Card id="Techniques" kicker={'Techniques Landscape'} title={'Three Core Approaches'} lead={'A guest OS expects to run privileged code directly on hardware, so the hypervisor must intercept or replace those operations. The three techniques differ in how:'} lesson={lesson}>
      <TechniquesScene />
    </Card>
  )
}

/* ================================================================== 28, 31 · the TR's guest / host diagram */

const TR_W = 440
const TR_H = 312
/* bands (x from BX to BX + BW) and the chips inside them */
const BX = 60
const BW = 360
const G = { top: 20, h: 100 }
const H = { top: 132, h: 100 }
const BASE = { top: 244, h: 48 }
const KX = 72
const KW = 160
const SX = 288
const SW = 120
const chipTop = (b: { top: number }) => b.top + 28
const CH = 64

function Band({ top, h, title, fill = colors.brandDark }: { top: number; h: number; title?: string; fill?: string }) {
  return (
    <At x={BX} y={top}>
      <div className="relative" style={{ width: BW, height: h }}>
        <ClayBar w={BW} h={h} fill={fill} />
        {title && (
          <span className="absolute font-heading text-[15px] font-semibold" style={{ left: 12, top: 5, color: colors.white }}>
            {title}
          </span>
        )}
      </div>
    </At>
  )
}

/** A white chip inside a band, its name top-left, with an optional sub-chip under the name. */
function BandChip({ x, top, w, name, sub, subW }: { x: number; top: number; w: number; name: string; sub?: string; subW?: number }) {
  return (
    <At x={x} y={top}>
      <div className="relative rounded-lg" style={{ width: w, height: CH, background: 'linear-gradient(180deg, #FFFFFF 0%, #F1F5FD 100%)', boxShadow: '0 8px 14px -10px rgba(0,37,75,0.6)' }}>
        <span className="absolute font-heading text-[16px] font-semibold leading-none" style={{ left: 10, top: 7, color: colors.ink }}>
          {name}
        </span>
        {sub && (
          <span className="absolute flex items-center rounded-md px-1.5 font-heading text-[14px] font-semibold leading-[1.1]" style={{ left: 8, top: 27, width: subW, height: 33, color: colors.brandDeep, background: colors.white, boxShadow: `inset 0 0 0 1.5px ${colors.brandDeep}` }}>
            {sub}
          </span>
        )}
      </div>
    </At>
  )
}

const INK = colors.brandDeep
/** where the para diagram's joined line runs: clear of the Virtual Environment chip and the Host title */
const JX = KX + 136

/** The amber trap route of full virtualization: out of the guest kernel, down past the host, into the hypervisor. */
const TRAP_PATH: [number, number][] = [
  [KX - 2, chipTop(G) + 22],
  [38, chipTop(G) + 22],
  [38, BASE.top + BASE.h / 2],
  [BX - 4, BASE.top + BASE.h / 2],
]

function TrapRoute({ tone }: { tone: string }) {
  const d = TRAP_PATH.map((p, i) => `${i ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' ')
  const [ex, ey] = TRAP_PATH[TRAP_PATH.length - 1]
  return (
    <svg aria-hidden className="pointer-events-none absolute left-0 top-0" width={TR_W} height={TR_H} style={{ overflow: 'visible' }}>
      <path d={d} fill="none" stroke={tone} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" strokeDasharray="7 6" className="mo mo-dash" />
      <path d={`M ${ex + 2} ${ey} L ${ex - 8} ${ey - 5.5} L ${ex - 8} ${ey + 5.5} Z`} fill={tone} />
    </svg>
  )
}

/**
 * The TR doc's own diagram, redrawn in the 3D finish. `full`: Guest (Kernel,
 * Software), Host (Kernel holding the Virtual Environment, Software holding VM
 * Control), over the Type 1 Hypervisor, the guest kernel's trap route amber.
 * `para`: the Virtual Environment has moved into the guest kernel, which is
 * joined to the host's VM Kernel, over the System Hardware.
 */
function TrDiagram({ variant, dim = false, live = true }: { variant: 'full' | 'para'; dim?: boolean; live?: boolean }) {
  const t = useLoop(3600, { mode: 'sawtooth', still: 0.45, on: live })
  const full = variant === 'full'
  const gc = chipTop(G)
  const hc = chipTop(H)
  /* the moving thing: full, an instruction trapped down to the hypervisor; para, a call down the joined line */
  const p = within(t, 0.08, 0.78)
  const dot: [number, number] = full ? along(TRAP_PATH, p) : [JX, gc + CH + 2 + (hc - gc - CH - 4) * p]
  return (
    <div className="absolute inset-0" style={{ opacity: dim ? 0.5 : 1, filter: dim ? 'saturate(0.55)' : undefined, transition: `opacity 420ms ${EASE}` }}>
      <Band top={G.top} h={G.h} title="Guest" />
      <Band top={H.top} h={H.h} title="Host" />
      <Band top={BASE.top} h={BASE.h} fill={colors.brandDark} />
      <At x={BX + BW / 2} y={BASE.top + BASE.h / 2} cx cy>
        <span className="whitespace-nowrap font-heading text-[18px] font-semibold" style={{ color: colors.white }}>
          {full ? 'Type 1 Hypervisor' : 'System Hardware'}
        </span>
      </At>
      {full ? (
        <>
          <BandChip x={KX} top={gc} w={KW} name="Kernel" />
          <BandChip x={SX} top={gc} w={SW} name="Software" />
          <BandChip x={KX} top={hc} w={KW} name="Kernel" sub="Virtual Environment" subW={104} />
          <BandChip x={SX} top={hc} w={SW} name="Software" sub="VM Control" subW={96} />
          <Arrow x1={KX + KW + 4} y1={gc + 36} x2={SX - 4} y2={gc + 36} tone={INK} both />
          <Arrow x1={KX + 128} y1={gc + CH + 3} x2={KX + 128} y2={hc - 3} tone={INK} both />
          <Arrow x1={KX + 116} y1={hc + 44} x2={SX + 4} y2={hc + 44} tone={INK} both />
          <Arrow x1={KX + 56} y1={hc + CH + 2} x2={KX + 56} y2={BASE.top + 12} tone={INK} />
          <TrapRoute tone={TRAP} />
          {live && <Dot at={dot} tone={TRAP} size={13} on={p > 0 && p < 1} />}
        </>
      ) : (
        <>
          <BandChip x={KX} top={gc} w={KW} name="Kernel" sub="Virtual Environment" subW={104} />
          <BandChip x={SX} top={gc} w={SW} name="Software" />
          <BandChip x={KX} top={hc} w={KW} name="VM Kernel" />
          <BandChip x={SX} top={hc} w={SW} name="Software" sub="VM Control" subW={96} />
          <Arrow x1={KX + 116} y1={gc + 44} x2={SX - 4} y2={gc + 44} tone={INK} both />
          {/* the joined line: the guest kernel talks to the VM kernel directly */}
          <div aria-hidden className="absolute rounded-full" style={{ left: JX - 1.5, top: gc + CH, width: 3, height: hc - gc - CH, background: colors.brand }} />
          <span aria-hidden className="absolute rounded-full" style={{ left: JX - 6, top: gc + CH - 6, width: 12, height: 12, background: colors.white, boxShadow: `inset 0 0 0 3px ${colors.brand}` }} />
          <span aria-hidden className="absolute rounded-full" style={{ left: JX - 6, top: hc - 6, width: 12, height: 12, background: colors.brand, boxShadow: `0 0 0 3px ${colors.white}` }} />
          <Arrow x1={KX + KW + 4} y1={hc + 36} x2={SX + 4} y2={hc + 36} tone={INK} both />
          <Arrow x1={KX + 80} y1={hc + CH + 3} x2={KX + 80} y2={BASE.top + 12} tone={INK} both />
          {live && <Dot at={dot} tone={colors.brand} size={12} on={p > 0 && p < 1} />}
        </>
      )}
    </div>
  )
}

export function Full({ lesson }: { lesson: string }) {
  return (
    <Card id="Full" kicker={'Full Virtualization'} title={'Binary Translation Trap'} lead={lead(['Full virtualization runs an unmodified guest OS.', 'On early x86 CPUs, some sensitive instructions did not trap when executed.'])} lesson={lesson}>
      <div className="flex items-center justify-between" style={{ width: BOX_W }}>
        <div style={{ width: 600 }}>
          <Callout kind="info" title="So the hypervisor used binary translation" asStep={false} className="[&_p]:text-[18px] [&>div>div]:text-[18px]">
            It scans and rewrites guest kernel code as it runs, while normal user-mode code runs directly on the CPU
          </Callout>
        </div>
        <Stage w={TR_W} h={TR_H} active={false}>
          <TrDiagram variant="full" />
        </Stage>
      </div>
    </Card>
  )
}

export function Para({ lesson }: { lesson: string }) {
  return (
    <Card id="Para" kicker={'Para-Virtualization'} title={'Guest-Aware Hypercalls'} lead={'In para-virtualization, the guest operating system is modified to work with the hypervisor directly instead of behaving as if it has complete control of the hardware.'} lesson={lesson}>
      <div className="flex items-start justify-center" style={{ width: BOX_W, gap: 56 }}>
        <div className="flex flex-col items-center gap-2">
          <Stage w={TR_W} h={TR_H} active={false}>
            <TrDiagram variant="full" dim live={false} />
          </Stage>
          <span className="font-heading text-[17px] font-semibold" style={{ color: colors.muted }}>
            Full virtualization
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Stage w={TR_W} h={TR_H} active={false}>
            <TrDiagram variant="para" />
          </Stage>
          <span className="font-heading text-[17px] font-semibold" style={{ color: colors.brandDark }}>
            Para-virtualization
          </span>
        </div>
      </div>
    </Card>
  )
}

/* ================================================================== 29, 32 · the path an instruction takes */

/** Guest OS → (arrow) → Hypervisor → (arrow) → Physical CPU, centred on `cy`, in the 3D finish. */
function PathRow({ cy, guest, a1, a1Kind, a2, a2Tone, t, scale = 1, labelBelow = false, live = true }: { cy: number; guest: string; a1: string; a1Kind: Kind; a2?: string; a2Tone: string; t: number; scale?: number; labelBelow?: boolean; live?: boolean }) {
  const X = [100, 317, 524]
  const winW = 110 * scale
  const winH = winW * 0.72
  const barW = 150 * scale
  const barH = 56 * scale
  const cpu = 92 * scale
  const a1x1 = X[0] + winW / 2 + 6
  const a1x2 = X[1] - barW / 2 - 6
  const a2x1 = X[1] + barW / 2 + 4
  const a2x2 = X[2] - cpu / 2 + 4
  const tone1 = KIND_TONE[a1Kind]
  const p1 = within(t, 0.04, 0.38)
  const glow = live && t > 0.36 && t < 0.6
  const p2 = within(t, 0.56, 0.84)
  const runs = live && t > 0.82
  const labelY = cy + Math.max(winH, cpu) / 2 + 8
  /* the arrow chips sit clear above the tallest object (user 2026-10-27: no chip touching the visual) */
  const chipY = cy - Math.max(winH, cpu) / 2 - 4 - 44
  const labelStyle = a1Kind === 'trap' ? KIND_LABEL.trap : KIND_LABEL.hypercall
  return (
    <>
      <At x={X[0]} y={cy - winH / 2 - 4} cx>
        <ClayOsWindow w={winW} k={0} />
      </At>
      <At x={X[0]} y={labelY} cx>
        <span className="block whitespace-nowrap font-heading text-[16px] font-semibold" style={{ color: colors.ink }}>
          {guest}
        </span>
      </At>
      <At x={X[1] - barW / 2} y={cy - barH / 2}>
        <HvBar w={barW} h={barH} glow={glow} size={scale < 1 ? 16 : 17} />
      </At>
      <At x={X[2]} y={cy - cpu / 2 - 4} cx>
        <CpuChip s={cpu} lit={runs} />
      </At>
      <At x={X[2]} y={labelY} cx>
        <span className="block whitespace-nowrap font-heading text-[16px] font-semibold" style={{ color: colors.ink }}>
          Physical CPU
        </span>
      </At>
      <Arrow x1={a1x1} y1={cy} x2={a1x2} y2={cy} tone={tone1} dashed={a1Kind === 'trap'} />
      <Arrow x1={a2x1} y1={cy} x2={a2x2} y2={cy} tone={a2Tone} />
      {live && <Dot at={[a1x1 + (a1x2 - a1x1 - 8) * p1, cy]} tone={tone1} size={12} on={p1 > 0 && p1 < 1} />}
      {live && <Dot at={[a2x1 + (a2x2 - a2x1 - 8) * p2, cy]} tone={a2Tone} size={12} on={p2 > 0 && p2 < 1} />}
      <At x={(a1x1 + a1x2) / 2} y={labelBelow ? cy + 14 : chipY} cx>
        <span className="inline-block whitespace-nowrap rounded-pill px-2.5 py-0.5 font-heading text-[15px] font-semibold" style={labelStyle}>
          {a1}
        </span>
      </At>
      {a2 && (
        <At x={(a2x1 + a2x2) / 2} y={chipY} cx>
          <span className="inline-block whitespace-nowrap rounded-pill px-2.5 py-0.5 font-heading text-[15px] font-semibold" style={{ background: colors.surface2, color: colors.brandDeep, boxShadow: `inset 0 0 0 1.5px #C3D3F0` }}>
            {a2}
          </span>
        </At>
      )}
    </>
  )
}

function FullPathScene() {
  const t = useLoop(4400, { mode: 'sawtooth', still: 0.3 })
  return (
    <>
      <PathRow cy={128} guest="Guest OS (unmodified)" a1="Trap + Translate" a1Kind="trap" a2="runs" a2Tone={colors.brandDeep} t={t} />
      <At x={24} y={232} w={586}>
        <div className="rounded-xl px-5 py-3 text-[17px] leading-snug" style={{ background: '#FFF4E0', color: colors.ink, boxShadow: `inset 0 0 0 1.5px ${TRAP}66` }}>
          Every trapped instruction costs extra CPU cycles to translate
        </div>
      </At>
      <At x={317} y={300} cx>
        <Logo name="vmware" h={26} caption="ESX and Workstation" />
      </At>
    </>
  )
}

export function FullPath({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="FullPath"
      kicker={'Full Virtualization'}
      title={'Binary Translation Trap'}
      lesson={lesson}
      points={['Instructions that do trap are handled by trap-and-emulate', "Sensitive instructions that don't trap are rewritten by binary translation", 'The guest needs no source or kernel changes', 'Overhead falls mainly on kernel-heavy, privileged operations', 'Used by early VMware ESX and Workstation']}
      figure={<FullPathScene />}
    />
  )
}

function ParaPathScene() {
  const t = useLoop(3600, { mode: 'sawtooth', still: 0.3 })
  return (
    <>
      <At x={24} y={22}>
        <span className="font-heading text-[15px] font-bold tracking-[0.08em]" style={{ color: colors.brandDark }}>
          PARA-VIRTUALIZATION
        </span>
      </At>
      <PathRow cy={92} guest="Guest OS (modified)" a1="hypercall" a1Kind="hypercall" a2Tone={colors.brandDeep} t={t} scale={0.8} labelBelow />
      <At x={24} y={176}>
        <span className="font-heading text-[15px] font-bold tracking-[0.08em]" style={{ color: colors.muted }}>
          FULL VIRTUALIZATION, FOR CONTRAST
        </span>
      </At>
      <div className="absolute inset-0" style={{ opacity: 0.5, filter: 'saturate(0.5)' }}>
        <PathRow cy={248} guest="Guest OS (unmodified)" a1="trap" a1Kind="trap" a2Tone={colors.muted} t={0} scale={0.8} labelBelow live={false} />
      </div>
      <At x={317} y={324} cx>
        <Logo name="xen" h={26} caption="Xen PV guests" />
      </At>
    </>
  )
}

export function ParaPath({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="ParaPath"
      kicker={'Para-Virtualization'}
      title={'Guest-Aware Hypercalls'}
      lesson={lesson}
      figH={392}
      points={['Hypercalls replace trapped instructions, skipping translation', 'Requires a modified guest kernel and paravirtualized drivers', 'Lower overhead than full virtualization for I/O-heavy guests', 'Para-virtual drivers (virtio, VMware Tools) are still used inside modern hardware-assisted VMs for fast I/O', 'Example: Xen paravirtualized (PV) guest mode']}
      figure={<ParaPathScene />}
    />
  )
}

/* ================================================================== 30, 33 · the analogies */

/** A speech bubble with three wavy lines; the middle one in `mid` (a changed word is green, an original one amber). */
function Bubble({ mid, lit }: { mid: string; lit: boolean }) {
  const wave = (y: number) => `M 12 ${y} q 9 -7 18 0 t 18 0 t 18 0 t 18 0`
  return (
    <div className="relative" style={{ width: 100, height: 64 }}>
      <svg width={100} height={64} viewBox="0 0 100 64" aria-hidden style={{ overflow: 'visible' }}>
        <path d="M 10 2 H 90 Q 98 2 98 10 V 42 Q 98 50 90 50 H 56 L 48 60 L 42 50 H 10 Q 2 50 2 42 V 10 Q 2 2 10 2 Z" fill="#FFFFFF" stroke={lit ? colors.brand : '#C3D3F0'} strokeWidth={2} style={{ transition: `stroke 420ms ${EASE}` }} />
        <path d={wave(15)} fill="none" stroke={LAB.sky} strokeWidth={3} strokeLinecap="round" />
        <path d={wave(27)} fill="none" stroke={mid} strokeWidth={3.5} strokeLinecap="round" />
        <path d={wave(39)} fill="none" stroke={LAB.sky} strokeWidth={3} strokeLinecap="round" />
      </svg>
    </div>
  )
}

const lift = (on: boolean): CSSProperties => ({ transform: on ? 'translateY(-6px)' : 'none', transition: `transform 420ms ${EASE}` })

/** Everyday: a visitor speaks as usual, an interpreter changes some words, the shopkeeper behind the counter hears the result. */
function InterpreterScene({ lit }: { lit: number }) {
  return (
    <>
      <At x={30} y={22}>
        <div style={lift(lit === 0)}>
          <Bubble mid={TRAP} lit={lit === 0} />
        </div>
      </At>
      <At x={42} y={104}>
        <div style={lift(lit === 0)}>
          <Icon3D name="man-idea" w={110} />
        </div>
      </At>
      <At x={178} y={22}>
        <div style={lift(lit === 1)}>
          <Bubble mid={colors.success} lit={lit === 1} />
        </div>
      </At>
      <At x={200} y={92}>
        <div style={lift(lit === 1)}>
          <Icon3D name="woman-pro" w={68} />
        </div>
      </At>
      {/* the shop: a shelf of goods, the shopkeeper, the counter in front */}
      <At x={346} y={24}>
        <div className="flex flex-col gap-1" style={{ width: 128 }}>
          <span className="block h-[7px] rounded-full" style={{ background: LAB.lavDeep }} />
          <div className="flex justify-between px-2">
            {[LAB.red, LAB.yellow, LAB.sage, LAB.sky].map((c) => (
              <span key={c} className="block h-[22px] w-[20px] rounded-[4px]" style={{ background: c, boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.12)' }} />
            ))}
          </div>
          <span className="block h-[7px] rounded-full" style={{ background: LAB.lavDeep }} />
        </div>
      </At>
      <At x={380} y={88}>
        <div style={lift(lit === 2)}>
          <Icon3D name="man-pro" w={60} shadow={false} />
        </div>
      </At>
      <At x={346} y={176}>
        <ClayBar w={128} h={56} fill={LAB.wood} />
        <GroundShadow w={128} />
      </At>
      <Arrow x1={146} y1={222} x2={196} y2={222} tone={colors.brandDark} dashed />
      <Arrow x1={282} y1={222} x2={336} y2={222} tone={colors.brandDark} dashed />
      <At x={18} y={14}><Marker n={1} on={lit === 0} /></At>
      <At x={166} y={14}><Marker n={2} on={lit === 1} /></At>
      <At x={452} y={14}><Marker n={3} on={lit === 2} /></At>
    </>
  )
}

/** Cloud: the unmodified guest OS sends its instructions as usual, the hypervisor translates some, the physical CPU runs the result. */
function FullCloudScene({ lit }: { lit: number }) {
  const spin = useLoop(2400, { mode: 'sawtooth', still: 0, on: lit === 1 })
  const a: [number, number][] = [[176, 136], [224, 136]]
  const b: [number, number][] = [[318, 136], [366, 136]]
  return (
    <>
      <At x={28} y={88}>
        <div style={lift(lit === 0)}>
          <ClayOsWindow w={140} k={0} />
        </div>
      </At>
      <At x={226} y={92}>
        <div style={{ ...lift(lit === 1) }}>
          <div style={{ transform: `rotate(${spin * 360}deg)`, width: 88 }}>
            <Icon3D name="gear" w={88} shadow={false} />
          </div>
          <GroundShadow w={88} style={{ marginTop: 6 }} />
        </div>
      </At>
      <At x={372} y={80}>
        <div style={lift(lit === 2)}>
          <CpuChip s={104} lit={lit === 2} />
        </div>
      </At>
      <Arrow x1={a[0][0]} y1={a[0][1]} x2={a[1][0]} y2={a[1][1]} tone={TRAP} dashed />
      <Arrow x1={b[0][0]} y1={b[0][1]} x2={b[1][0]} y2={b[1][1]} tone={colors.success} />
      <Traveller path={lit === 2 ? b : a} run={lit !== 1} k={lit} tone={lit === 2 ? colors.success : TRAP} size={12} dur={1.6} />
      <At x={18} y={60}><Marker n={1} on={lit === 0} /></At>
      <At x={218} y={56}><Marker n={2} on={lit === 1} /></At>
      <At x={452} y={56}><Marker n={3} on={lit === 2} /></At>
    </>
  )
}

export function FullAnalogy({ lesson }: { lesson: string }) {
  return (
    <PairAnalogy
      id="FullAnalogy"
      kicker={'Full Virtualization'}
      title={'A Live Interpreter'}
      lesson={lesson}
      everyday={{ label: 'A live interpreter', scene: (lit) => <InterpreterScene lit={lit} /> }}
      cloud={{ label: 'Full virtualization', scene: (lit) => <FullCloudScene lit={lit} /> }}
      pairs={[
        ['Visitor speaks as usual', 'Unmodified guest OS'],
        ['Interpreter changes some words', 'Hypervisor translates instructions'],
        ['Shopkeeper hears the result', 'Physical CPU runs it'],
      ]}
    />
  )
}

/** A key card: a white card with a brand stripe and a chip, lit from the upper left. */
function KeyCard() {
  return (
    <div className="relative rounded-[5px]" style={{ width: 34, height: 22, background: 'linear-gradient(135deg, #FFFFFF 0%, #DCE6FA 100%)', boxShadow: '0 6px 10px -5px rgba(16,32,58,0.55)' }}>
      <span className="absolute left-0 right-0 rounded-t-[5px]" style={{ top: 0, height: 6, background: colors.brand }} />
      <span className="absolute rounded-[2px]" style={{ left: 5, top: 10, width: 8, height: 7, background: LAB.yellow }} />
    </div>
  )
}

/**
 * Everyday (the TR's analogy, user 2026-10-27): a hotel guest holds a key card,
 * taps it on the room door's reader, and the lock system works behind the
 * scenes, drawn as a ghosted cut-away wall panel beside the door.
 */
function HotelScene({ lit }: { lit: number }) {
  const tap = lit === 1
  const open = lit >= 1
  return (
    <>
      {/* the guest, holding the key card */}
      <At x={26} y={70}>
        <div style={lift(lit === 0)}>
          <Icon3D name="man-idea" w={90} />
        </div>
      </At>
      {/* the room door, its card reader beside the handle */}
      <At x={176} y={24}>
        <div className="relative" style={{ width: 100, height: 150 }}>
          <ClayBar w={100} h={150} fill={LAB.wood} />
          <span aria-hidden className="absolute rounded-md" style={{ left: 14, top: 14, width: 72, height: 48, background: 'rgba(255,255,255,0.14)' }} />
          <span aria-hidden className="absolute rounded-md" style={{ left: 14, top: 76, width: 72, height: 60, background: 'rgba(255,255,255,0.14)' }} />
          <span aria-hidden className="absolute rounded-full" style={{ left: 74, top: 86, width: 16, height: 6, background: LAB.yellow }} />
          <div className="absolute grid place-items-center rounded-[6px]" style={{ left: 40, top: 68, width: 26, height: 40, background: `linear-gradient(180deg, #34477E 0%, ${colors.brandDeep} 100%)`, ...lift(tap) }}>
            <span className="block rounded-full" style={{ width: 8, height: 8, background: open ? colors.success : colors.danger, boxShadow: `0 0 8px ${open ? colors.success : colors.danger}`, transition: `all 420ms ${EASE}` }} />
          </div>
        </div>
        <GroundShadow w={100} />
      </At>
      {/* the key card, in the guest's hand; tapped on the reader while pair 2 is lit */}
      <At x={112} y={104}>
        <div style={{ transform: tap ? 'translate(68px, -2px)' : 'none', transition: `transform 620ms ${EASE}` }}>
          <KeyCard />
        </div>
      </At>
      {/* the wire from the reader into the wall */}
      <div aria-hidden className="absolute" style={{ left: 278, top: 112, width: 56, height: 0, borderTop: `2px dashed ${colors.muted}` }} />
      {/* behind the scenes: the lock system, ghosted in a cut-away wall panel */}
      <At x={336} y={24}>
        <div className="relative rounded-xl" style={{ width: 140, height: 150, background: 'rgba(211,225,251,0.45)', border: `2px dashed ${LAB.lavDeep}`, opacity: lit === 2 ? 1 : 0.6, ...lift(lit === 2), transition: `all 420ms ${EASE}` }}>
          <div className="absolute" style={{ left: 40, top: 14 }}>
            <Icon3D name="gear" w={56} shadow={false} />
          </div>
          <span aria-hidden className="absolute rounded-md" style={{ left: 18, top: 84, width: 100, height: 14, background: LAB.lavDeep }} />
          <span aria-hidden className="absolute rounded-md" style={{ left: 10, top: 108, width: 70, height: 16, background: `linear-gradient(180deg, #9AA9C9 0%, #5E6E94 100%)`, transform: open ? 'translateX(30px)' : 'none', transition: `transform 620ms ${EASE}` }} />
        </div>
      </At>
      <At x={22} y={46}><Marker n={1} on={lit === 0} /></At>
      <At x={244} y={40}><Marker n={2} on={lit === 1} /></At>
      <At x={446} y={14}><Marker n={3} on={lit === 2} /></At>
      <At x={20} y={190} w={460}>
        <p className="text-[15px] leading-[1.3]" style={{ color: colors.ink }}>
          A hotel guest uses the same key card to access their room without knowing how the hotel's locking system works behind the scenes.
        </p>
      </At>
    </>
  )
}

/** Cloud: the modified guest OS (it knows it is virtual) sends a hypercall straight to the hypervisor; the trap route below waits, faded. */
function ParaCloudScene({ lit }: { lit: number }) {
  return (
    <>
      <At x={28} y={70}>
        <div className="relative" style={lift(lit === 0)}>
          <ClayOsWindow w={140} k={0} />
          <span className="absolute grid place-items-center rounded-full" style={{ right: -8, bottom: 2, width: 30, height: 30, background: colors.success, boxShadow: '0 6px 12px -6px rgba(16,32,58,0.6)' }}>
            <svg width={16} height={16} viewBox="0 0 16 16" aria-hidden>
              <path d="M 3 8.5 L 6.5 12 L 13 4.5" fill="none" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </At>
      <svg aria-hidden className="pointer-events-none absolute left-0 top-0" width={500} height={270}>
        <path d="M 150 206 C 230 250, 310 250, 380 212" fill="none" stroke={colors.muted} strokeWidth={3} strokeDasharray="3 7" strokeLinecap="round" opacity={0.5} />
      </svg>
      <Arrow x1={178} y1={124} x2={372} y2={124} tone={colors.brandDeep} width={4} />
      <At x={252} y={66}>
        <div style={lift(lit === 1)}>
          <ClayBell w={44} ringing={lit === 1} />
        </div>
      </At>
      <Traveller path={[[180, 124], [362, 124]]} run={lit === 1} k={lit} tone={TRAP} size={13} dur={1.8} />
      <At x={380} y={50}>
        <div className="relative" style={lift(lit === 2)}>
          <HvBar w={100} h={150} glow={lit === 2}>
            <span className="flex flex-col gap-2.5">
              {[0, 1, 2].map((i) => (
                <span key={i} className="block h-[12px] w-[64px] rounded-[4px]" style={{ background: 'rgba(255,255,255,0.6)' }} />
              ))}
            </span>
          </HvBar>
          <GroundShadow w={100} style={{ marginTop: 4 }} />
        </div>
      </At>
      <At x={154} y={52}><Marker n={1} on={lit === 0} /></At>
      <At x={300} y={68}><Marker n={2} on={lit === 1} /></At>
      <At x={446} y={22}><Marker n={3} on={lit === 2} /></At>
    </>
  )
}

export function ParaAnalogy({ lesson }: { lesson: string }) {
  return (
    <PairAnalogy
      id="ParaAnalogy"
      kicker={'Para-Virtualization'}
      title={'A Service Bell'}
      lesson={lesson}
      everyday={{ label: 'A hotel', scene: (lit) => <HotelScene lit={lit} /> }}
      cloud={{ label: 'Para-virtualization', scene: (lit) => <ParaCloudScene lit={lit} /> }}
      pairs={[
        ['A diner who knows the bell', 'Modified guest OS'],
        ['Pressing the bell', 'A hypercall'],
        ['Staff who answer it', 'Hypervisor'],
      ]}
    />
  )
}

/* ================================================================== 34 · hardware-assisted */

/** The CPU package: non-root mode with three guests over root mode with the hypervisor; the CPU exits to the hypervisor and enters a guest again. */
function CpuModesScene() {
  const k = useCycle(12, 1300, 1)
  const g = Math.floor(k / 4) % 3
  const ph = k % 4
  const PX = 34
  const PW = 498
  const PT = 34
  const PH = 270
  const GX = [PX + 24, PX + 24 + 146, PX + 24 + 292]
  const GW = 134
  const gTop = PT + 66
  const gBot = gTop + 44
  const rootTop = PT + 168
  const hvTop = rootTop + 36
  const gx = GX[g] + GW / 2
  const exitX = PX + 180
  const entryX = PX + PW - 180
  const pins = [0, 1, 2, 3, 4, 5].map((i) => PX + 50 + i * ((PW - 100) / 5))
  return (
    <>
      {pins.map((x) => (
        <span key={`t${x}`} aria-hidden className="absolute rounded-[2px]" style={{ left: x - 3, top: PT - 14, width: 6, height: 14, background: '#8EA3D6' }} />
      ))}
      {pins.map((x) => (
        <span key={`b${x}`} aria-hidden className="absolute rounded-[2px]" style={{ left: x - 3, top: PT + PH, width: 6, height: 14, background: '#8EA3D6' }} />
      ))}
      <At x={PX} y={PT}>
        {/* the exit / entry arrows are the package's own children (overlap-check rule 42: an arrow may cross only a ringed box it belongs to) */}
        <div className="relative rounded-[22px]" style={{ width: PW, height: PH, background: 'linear-gradient(180deg, #FFFFFF 0%, #F3F7FE 100%)', boxShadow: `inset 0 0 0 4px ${colors.brandDeep}, 0 18px 30px -18px rgba(16,32,58,0.55)` }}>
          <Arrow x1={exitX - PX} y1={136} x2={exitX - PX} y2={rootTop - 2 - PT} tone={TEAL} />
          <Arrow x1={entryX - PX} y1={rootTop - 2 - PT} x2={entryX - PX} y2={136} tone={TEAL} />
        </div>
      </At>
      <At x={PX + 14} y={PT + 14}>
        <div className="rounded-2xl" style={{ width: PW - 28, height: 120, background: colors.surface2 }} />
      </At>
      <At x={PX + 26} y={PT + 24}>
        <span className="whitespace-nowrap font-heading text-[16px] font-semibold" style={{ color: colors.brandDark }}>
          Non-root mode: guest OS runs here
        </span>
      </At>
      <At x={PX + PW - 26} y={PT + 22}>
        <span className="flex -translate-x-full items-center gap-1.5 whitespace-nowrap font-heading text-[16px] font-bold" style={{ color: colors.brandDeep }}>
          <span className="grid place-items-center rounded-[5px]" style={{ width: 18, height: 18, background: colors.brandDeep }} aria-hidden>
            <span className="block rounded-[2px]" style={{ width: 8, height: 8, background: '#A9C8FF' }} />
          </span>
          CPU
        </span>
      </At>
      {GX.map((x, i) => (
        <At key={i} x={x} y={gTop}>
          <Chip w={GW} h={44} lit={i === g && (ph === 0 || ph === 3)}>
            Guest OS
          </Chip>
        </At>
      ))}
      <At x={exitX - 14} y={(PT + 134 + rootTop) / 2} cy>
        <span className="block -translate-x-full whitespace-nowrap font-heading text-[16px] font-semibold" style={{ color: colors.tealDark }}>
          VM exit
        </span>
      </At>
      <At x={entryX + 14} y={(PT + 134 + rootTop) / 2} cy>
        <span className="block whitespace-nowrap font-heading text-[16px] font-semibold" style={{ color: colors.tealDark }}>
          VM entry
        </span>
      </At>
      <At x={PX + 14} y={rootTop}>
        <div className="relative rounded-2xl" style={{ width: PW - 28, height: 88, background: `linear-gradient(180deg, #3C78FF 0%, ${colors.brand} 100%)`, boxShadow: '0 12px 20px -14px rgba(16,32,58,0.6)' }}>
          <span className="absolute font-heading text-[16px] font-semibold" style={{ left: 12, top: 7, color: colors.white }}>
            Root mode
          </span>
        </div>
      </At>
      <At x={PX + 26} y={hvTop}>
        <HvBar w={PW - 52} h={40} glow={ph === 1 || ph === 2} fill={colors.brandDark} size={17} />
      </At>
      {ph === 1 && <Traveller path={[[gx, gBot + 2], [exitX, gBot + 22], [exitX, rootTop - 8]]} run k={`x${k}`} tone={TEAL} size={12} dur={1.1} />}
      {ph === 2 && <Traveller path={[[entryX, rootTop - 8], [entryX, gBot + 22], [gx, gBot + 2]]} run k={`n${k}`} tone={TEAL} size={12} dur={1.1} />}
      <At x={PX + PW / 2} y={PT + PH + 32} cx>
        <div className="flex items-start gap-14">
          <Logo name="intel" h={28} caption="VT-x" />
          <Logo name="amd" h={24} caption="AMD-V" />
        </div>
      </At>
    </>
  )
}

export function HwAssisted({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="HwAssisted"
      kicker={'Hardware-Assisted Virtualization'}
      title={'CPU-Level Trapping'}
      lead={'Hardware-assisted virtualization means the CPU has built-in features (Intel VT-x, AMD-V) that help the hypervisor run VMs faster and more safely.'}
      lesson={lesson}
      pointsW={520}
      pointSize={17}
      figH={410}
      points={[
        <>
          <B>CPU support:</B> The hypervisor controls the VM, while the guest OS runs directly on the CPU
        </>,
        <>
          <B>CPU intervention:</B> When the guest OS needs hypervisor control, the CPU pauses the VM and hands control back to the hypervisor
        </>,
        <>
          <B>Memory support:</B> EPT (Intel) and NPT (AMD) help the hardware translate VM memory addresses
        </>,
      ]}
      figure={<CpuModesScene />}
    />
  )
}

/* ================================================================== 35 · compared */

export function TechniquesCompared({ lesson }: { lesson: string }) {
  /* the kit table with the reference's highlighted row (the modern default); `TableCard` takes no `highlight`, so the frame is built here */
  return (
    <Card id="TechniquesCompared" kicker={'Hardware-Assisted Virtualization'} title={'Three Techniques Compared'} lesson={lesson}>
      <div style={{ width: BOX_W }}>
        <div className="mb-4">
          <Points
            width={BOX_W}
            items={[
              <>
                <B>Used by:</B> KVM, VMware ESXi, and Hyper-V
              </>,
              <>
                <B>BIOS/UEFI setting:</B> CPU virtualization must be enabled for many VM tools to work
              </>,
            ]}
          />
        </div>
        <DataTable
          columns={[
            { label: 'Technique', weight: 1.1 },
            { label: 'Guest OS Change', weight: 0.8 },
            { label: 'Trap Mechanism', weight: 1 },
            { label: 'Overhead', weight: 1.4 },
          ]}
          rows={[
            [<b key="a">Full (binary translation)</b>, 'None', 'Software translation', 'Highest for kernel-heavy work'],
            [<b key="b">Para-virtualization</b>, 'Modified kernel', 'Guest-initiated hypercalls', 'Low, especially for I/O'],
            [<b key="c">Hardware-assisted</b>, 'None', 'CPU VM exit / entry', 'Low. Modern default, usually combined with para-virtual I/O drivers'],
          ]}
          highlight={[3]}
        />
      </div>
    </Card>
  )
}
