import { useId, type CSSProperties, type ReactNode } from 'react'
import { AppWindow, HardDrive, Monitor, Network as NetworkIcon, Server } from 'lucide-react'
import { colors } from '@/design/tokens'
import { At, Label, useLoop } from '../scene'
import { ClayAtm, ClayCoins, ClayInstitution, ClayOsWindow, ClayPadlock, ClayRack, ElectricMeter, GroundShadow, Icon3D, LAB, RichCloud } from '../d3/kit'
import { TILE_SKIN } from '../card'
import { FIG_W, FigureOnly, PointsFigure, TableCard } from '../iso/frames'
import { MARK, Marker, PairAnalogy, type MarkName } from './frames'
import apartmentUtility from './img/apartment-utility.jpg'

/**
 * SECTION "VIRTUALIZATION BASICS", second half (reference frames 11 to 17):
 * storage, network, desktop and app virtualization, their analogies, and the
 * five types compared. Session 2's current finish: raised plates and chips,
 * session 1's clay objects and the library's glossy renders, each on its
 * ground shadow, HTML labels, one self-running loop per figure whose motion is
 * the claim (data gathers into one pool, a packet crosses from a VM through
 * the physical network, each logical network keeps its traffic in its own
 * loop, a remote host streams to the screens). Every string is the reference's.
 */

const EASE = 'cubic-bezier(0.22,1,0.36,1)'
const NETS = [colors.brand, colors.accent, colors.teal]
type Pt = [number, number]

/* ------------------------------------------------------------------ local pieces */

/** An object placed by its bottom centre (`x`, `b`), so a row of things shares one ground line. */
function Put({ x, b, children, style }: { x: number; b: number; children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="absolute" style={{ left: x, top: b, transform: 'translate(-50%, -100%)', transition: `transform 420ms ${EASE}, opacity 420ms ${EASE}, filter 420ms ${EASE}`, ...style }}>
      {children}
    </div>
  )
}

/** Lift for the lit object of an analogy pair: up a little and brighter. */
const up = (on: boolean): CSSProperties => ({ transform: `translate(-50%, calc(-100% - ${on ? 8 : 0}px))`, filter: on ? 'drop-shadow(0 10px 14px rgba(45,99,251,0.35))' : 'none' })

/** The point a fraction `t` (0..1) along a polyline. */
function along(pts: Pt[], t: number): Pt {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]))
  const total = seg.reduce((a, b) => a + b, 0)
  let d = Math.max(0, Math.min(1, t)) * total
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i] || i === seg.length - 1) {
      const u = seg[i] ? Math.min(1, d / seg[i]) : 0
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u]
    }
    d -= seg[i]
  }
  return pts[pts.length - 1]
}

/** The point at `t` on a cubic bezier. */
function bez(a: Pt, b: Pt, c: Pt, d: Pt, t: number): Pt {
  const m = 1 - t
  const f = (i: 0 | 1) => m * m * m * a[i] + 3 * m * m * t * b[i] + 3 * m * t * t * c[i] + t * t * t * d[i]
  return [f(0), f(1)]
}

/** The outline of a rounded rectangle as points, clockwise from the top left, for a packet to run round. */
function ringPts(x: number, y: number, w: number, h: number, r: number): Pt[] {
  const pts: Pt[] = []
  const arc = (cx: number, cy: number, a0: number) => {
    for (let k = 0; k <= 6; k++) {
      const a = a0 + (k / 6) * (Math.PI / 2)
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
    }
  }
  arc(x + w - r, y + r, -Math.PI / 2)
  arc(x + w - r, y + h - r, 0)
  arc(x + r, y + h - r, Math.PI / 2)
  arc(x + r, y + r, Math.PI)
  pts.push(pts[0])
  return pts
}

/** A packet at a point, moved by transform only. */
function Pkt({ at, tone = colors.accent, size = 12, on = true, square = false }: { at: Pt; tone?: string; size?: number; on?: boolean; square?: boolean }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute left-0 top-0 ${square ? 'rounded-[4px]' : 'rounded-full'}`}
      style={{ width: size, height: size, background: tone, boxShadow: square ? `0 0 0 2px ${colors.white}, 0 4px 10px -2px ${tone}` : `0 0 0 4px ${tone}40`, transform: `translate(${at[0] - size / 2}px, ${at[1] - size / 2}px)`, opacity: on ? 1 : 0, transition: 'opacity 240ms linear' }}
    />
  )
}

/** Plain connector lines on a stage (no heads), one svg under everything else. */
function Wires({ w, h, paths }: { w: number; h: number; paths: { d: string; tone?: string; width?: number; dash?: string; on?: boolean }[] }) {
  return (
    <svg aria-hidden className="pointer-events-none absolute left-0 top-0" width={w} height={h} style={{ overflow: 'visible' }}>
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill="none" stroke={p.tone ?? colors.line} strokeWidth={p.width ?? 2.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={p.dash} style={{ opacity: p.on === false ? 0.45 : 1, transition: `stroke 420ms ${EASE}, opacity 420ms ${EASE}` }} />
      ))}
    </svg>
  )
}

/** A raised chip on a stage: a box the TR's diagram names (`VM`, `Hypervisor kernel`). */
function Box({ x, y, w, h, children, tone = 'plain', lit = false, r = 12, size = 15 }: { x: number; y: number; w: number; h: number; children?: ReactNode; tone?: 'plain' | 'brand' | 'pill'; lit?: boolean; r?: number; size?: number }) {
  const skin: CSSProperties =
    tone === 'brand'
      ? { background: `linear-gradient(180deg, #4A7BFF 0%, ${colors.brand} 55%, ${colors.brandDark} 100%)`, color: colors.white, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 12px 22px -12px ${colors.brand}` }
      : tone === 'pill'
        ? { background: `linear-gradient(180deg, #FFFFFF 0%, ${colors.surface2} 100%)`, color: colors.brandDark, boxShadow: `inset 0 0 0 2px ${colors.brand}, inset 0 1px 0 #FFFFFF, 0 10px 18px -12px rgba(16,32,58,0.45)` }
        : { ...TILE_SKIN, color: colors.brandDark, boxShadow: `inset 0 0 0 ${lit ? 2 : 1.5}px ${lit ? colors.accent : '#B9CBEF'}, inset 0 1px 0 #FFFFFF, 0 10px 18px -12px rgba(16,32,58,0.45)` }
  return (
    <div className="absolute grid place-items-center px-2 text-center font-heading font-semibold leading-tight" style={{ left: x, top: y, width: w, height: h, borderRadius: r, fontSize: size, transition: `box-shadow 420ms ${EASE}`, ...skin }}>
      {children}
    </div>
  )
}

/** A raised plate grouping part of a scene (a server, a building, a desk). */
function Plate({ x, y, w, h, tint, ring, r = 18, children }: { x: number; y: number; w: number; h: number; tint?: string; ring?: string; r?: number; children?: ReactNode }) {
  return (
    <div
      aria-hidden={children ? undefined : true}
      className="pointer-events-none absolute"
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: r,
        ...TILE_SKIN,
        ...(tint ? { background: tint } : {}),
        ...(ring ? { boxShadow: `inset 0 0 0 2px ${ring}, inset 0 1px 0 #FFFFFF, 0 14px 28px -18px rgba(16,32,58,0.45)` } : {}),
      }}
    >
      {children}
    </div>
  )
}

/** A vendor mark inline before its name (the reference's `Amazon VPC`, `AppStream 2.0` lines). */
function MarkLine({ name, text, h = 24, size = 16, tone = colors.ink }: { name: MarkName; text: string; h?: number; size?: number; tone?: string }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <img src={MARK[name]} alt="" draggable={false} className="block w-auto select-none" style={{ height: h }} />
      <span className="font-medium leading-tight" style={{ fontSize: size, color: tone }}>
        {text}
      </span>
    </span>
  )
}

/** A disk or a volume drawn in session 1's way: a glossy cylinder, lit from the upper left, on its soft shadow. */
function Cylinder({ w, h, tone = 'steel' }: { w: number; h: number; tone?: 'steel' | 'brand' }) {
  const id = useId().replace(/:/g, '')
  const ry = Math.round(w * 0.16)
  const [lo, mid, hi, top] = tone === 'brand' ? ['#1E4FD8', '#4A7BFF', '#9CBDFF', '#C9DAFF'] : ['#6C7BA6', '#A3AFD3', '#D3DCF2', '#E6ECFA']
  return (
    <svg width={w} height={h + 10} viewBox={`0 0 ${w} ${h + 10}`} aria-hidden style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${id}-b`} x1="0" x2="1">
          <stop offset="0" stopColor={hi} />
          <stop offset="0.45" stopColor={mid} />
          <stop offset="1" stopColor={lo} />
        </linearGradient>
        <linearGradient id={`${id}-t`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor={top} />
        </linearGradient>
        <radialGradient id={`${id}-s`}>
          <stop offset="0" stopColor="rgba(31,64,140,0.3)" />
          <stop offset="1" stopColor="rgba(31,64,140,0)" />
        </radialGradient>
      </defs>
      <ellipse cx={w / 2} cy={h + 3} rx={w * 0.52} ry={6} fill={`url(#${id}-s)`} />
      <path d={`M 2 ${ry + 2} V ${h - ry - 2} A ${w / 2 - 2} ${ry} 0 0 0 ${w - 2} ${h - ry - 2} V ${ry + 2} Z`} fill={`url(#${id}-b)`} />
      {tone === 'steel' && <path d={`M 2 ${h * 0.55} A ${w / 2 - 2} ${ry} 0 0 0 ${w - 2} ${h * 0.55}`} fill="none" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={1.5} />}
      <ellipse cx={w / 2} cy={ry + 2} rx={w / 2 - 2} ry={ry} fill={`url(#${id}-t)`} />
      <rect x={w * 0.14} y={ry * 2 + 6} width={w * 0.07} height={h - ry * 3 - 12} rx={w * 0.035} fill="#FFFFFF" opacity={0.45} />
    </svg>
  )
}

/**
 * A monitor drawn in session 1's way: a navy bezel graded lit to shaded, a
 * glass pane with a sheen, a stand and a foot. `desktop` is a whole desktop
 * (a dock of icons and two windows), `app` one app window, `channels` the
 * grid of a cable channel guide.
 */
function Screen({ w, kind, lit = false }: { w: number; kind: 'desktop' | 'app' | 'channels'; lit?: boolean }) {
  const h = Math.round(w * 0.62)
  const g = Math.max(5, Math.round(w * 0.045))
  return (
    <div className="flex flex-col items-center" style={{ width: w }}>
      <div
        className="relative"
        style={{
          width: w,
          height: h,
          borderRadius: 12,
          background: `linear-gradient(160deg, #4357B8 0%, ${LAB.navy} 45%, #1A2668 100%)`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 14px 26px -14px rgba(16,32,58,0.6)${lit ? `, 0 0 0 4px ${colors.brand}55` : ''}`,
          transition: `box-shadow 420ms ${EASE}`,
        }}
      >
        <div className="absolute overflow-hidden" style={{ left: g, top: g, right: g, bottom: g, borderRadius: 7, background: 'linear-gradient(180deg, #EAF1FF 0%, #C9DAFA 100%)' }}>
          {kind === 'desktop' && (
            <>
              {[0, 1, 2].map((i) => (
                <span key={i} className="absolute rounded-[4px]" style={{ left: '5%', top: `${10 + i * 26}%`, width: '9%', height: '18%', background: colors.white, boxShadow: '0 2px 4px -2px rgba(16,32,58,0.4)' }} />
              ))}
              <span className="absolute rounded-[5px]" style={{ left: '22%', top: '12%', width: '44%', height: '50%', background: colors.white, boxShadow: `inset 0 6px 0 ${colors.brand}, 0 4px 8px -4px rgba(16,32,58,0.4)` }} />
              <span className="absolute rounded-[5px]" style={{ left: '46%', top: '34%', width: '46%', height: '52%', background: colors.white, boxShadow: `inset 0 6px 0 ${LAB.sky}, 0 4px 8px -4px rgba(16,32,58,0.4)` }} />
              <span className="absolute inset-x-0 bottom-0" style={{ height: '9%', background: LAB.navy, opacity: 0.85 }} />
            </>
          )}
          {kind === 'app' && (
            <span className="absolute rounded-[5px]" style={{ left: '10%', top: '12%', width: '80%', height: '76%', background: colors.white, boxShadow: `inset 0 8px 0 ${colors.teal}, 0 4px 8px -4px rgba(16,32,58,0.4)` }}>
              {[0, 1, 2].map((i) => (
                <span key={i} className="absolute rounded-full" style={{ left: '10%', top: `${34 + i * 20}%`, width: `${70 - i * 18}%`, height: 4, background: '#B9CBEF' }} />
              ))}
            </span>
          )}
          {kind === 'channels' &&
            [0, 1, 2].map((r) =>
              [0, 1, 2].map((c) => (
                <span key={`${r}${c}`} className="absolute rounded-[4px]" style={{ left: `${8 + c * 29}%`, top: `${10 + r * 28}%`, width: '26%', height: '22%', background: [LAB.sky, '#F2726B', '#5CC98C'][(r + c) % 3] }} />
              )),
            )}
          <span className="pointer-events-none absolute left-0 top-0" style={{ width: '55%', height: '70%', background: 'linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0) 60%)' }} />
        </div>
      </div>
      <span style={{ width: w * 0.1, height: Math.max(8, w * 0.07), background: `linear-gradient(90deg, #8E9CC8, ${LAB.navy})` }} />
      <span className="rounded-full" style={{ width: w * 0.42, height: 7, background: `linear-gradient(180deg, #4357B8, ${LAB.navy})` }} />
      <span className="mt-0.5 rounded-full" style={{ width: w * 0.7, height: 7, background: 'radial-gradient(closest-side, rgba(31,64,140,0.26), rgba(31,64,140,0))' }} />
    </div>
  )
}

/** A tablet: `play` shows a show playing, `app` one app window. */
function Tablet({ w, kind, lit = false }: { w: number; kind: 'play' | 'app'; lit?: boolean }) {
  const h = Math.round(w * 1.36)
  return (
    <div className="flex flex-col items-center" style={{ width: w }}>
      <div className="relative" style={{ width: w, height: h, borderRadius: 10, background: `linear-gradient(160deg, #4357B8 0%, ${LAB.navy} 50%, #1A2668 100%)`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 12px 22px -12px rgba(16,32,58,0.6)${lit ? `, 0 0 0 4px ${colors.brand}55` : ''}`, transition: `box-shadow 420ms ${EASE}` }}>
        <div className="absolute overflow-hidden" style={{ left: 5, top: 7, right: 5, bottom: 7, borderRadius: 6, background: 'linear-gradient(180deg, #F4F8FF 0%, #D6E3FB 100%)' }}>
          {kind === 'play' ? (
            <svg viewBox="0 0 20 20" className="absolute" style={{ left: '28%', top: '32%', width: '46%' }} aria-hidden>
              <path d="M 4 2 L 18 10 L 4 18 Z" fill={LAB.red} />
            </svg>
          ) : (
            <span className="absolute rounded-[4px]" style={{ left: '12%', top: '14%', width: '76%', height: '72%', background: colors.white, boxShadow: `inset 0 7px 0 #5CC98C, 0 3px 6px -3px rgba(16,32,58,0.4)` }} />
          )}
        </div>
      </div>
      <span className="mt-0.5 rounded-full" style={{ width: w * 0.9, height: 7, background: 'radial-gradient(closest-side, rgba(31,64,140,0.26), rgba(31,64,140,0))' }} />
    </div>
  )
}

/* ================================================================== 11 · a bank's shared pool */

const ROWS3 = [80, 160, 240]

/** Money from three branches gathers into one pool, which a customer draws from at an ATM. */
function BankScene(lit: number) {
  return <BankSceneBody lit={lit} />
}
function BankSceneBody({ lit }: { lit: number }) {
  const t = useLoop(3200, { mode: 'sawtooth', still: 0.55 })
  const into = (i: number): Pt[] => [[112, ROWS3[i] - 28], [150, ROWS3[i] - 28], [196, 150]]
  return (
    <>
      <Wires
        w={500}
        h={270}
        paths={[...ROWS3.map((y) => ({ d: `M 112 ${y - 28} H 150 L 196 150`, tone: '#B9CBEF', width: 4 })), { d: 'M 300 150 H 350', tone: '#B9CBEF', width: 4 }]}
      />
      {ROWS3.map((y) => (
        <Put key={y} x={70} b={y + 4} style={up(lit === 0)}>
          <ClayInstitution w={78} />
        </Put>
      ))}
      {ROWS3.map((_, i) => (
        <Pkt key={i} at={along(into(i), (t + i * 0.2) % 1)} tone={LAB.yellow} size={13} />
      ))}
      <Put x={250} b={212} style={up(lit === 1)}>
        <ClayCoins w={92} n={6} />
      </Put>
      <Pkt at={along([[300, 150], [350, 150]], t)} tone={LAB.yellow} size={13} />
      <Put x={392} b={226} style={up(lit === 2)}>
        <ClayAtm w={72} cash={lit === 2} lit={lit === 2} />
      </Put>
      <Put x={458} b={226} style={up(lit === 2)}>
        <Icon3D name="man-pro" w={44} />
      </Put>
      <At x={120} y={22}>
        <Marker n={1} on={lit === 0} />
      </At>
      <At x={235} y={40}>
        <Marker n={2} on={lit === 1} />
      </At>
      <At x={446} y={50}>
        <Marker n={3} on={lit === 2} />
      </At>
    </>
  )
}

/** Blocks from three physical disks gather into one virtual volume, which the application reads. */
function StorageScene(lit: number) {
  return <StorageSceneBody lit={lit} />
}
function StorageSceneBody({ lit }: { lit: number }) {
  const t = useLoop(3200, { mode: 'sawtooth', still: 0.55 })
  const into = (i: number): Pt[] => [[112, ROWS3[i] - 30], [150, ROWS3[i] - 30], [196, 150]]
  return (
    <>
      <Wires
        w={500}
        h={270}
        paths={[...ROWS3.map((y) => ({ d: `M 112 ${y - 30} H 150 L 196 150`, tone: '#B9CBEF', width: 4 })), { d: 'M 308 150 H 352', tone: '#B9CBEF', width: 4 }]}
      />
      {ROWS3.map((y) => (
        <Put key={y} x={72} b={y + 2} style={up(lit === 0)}>
          <Cylinder w={76} h={52} />
        </Put>
      ))}
      {ROWS3.map((_, i) => (
        <Pkt key={i} at={along(into(i), (t + i * 0.2) % 1)} tone={colors.brand} size={12} square />
      ))}
      <Put x={252} b={224} style={up(lit === 1)}>
        <Cylinder w={112} h={150} tone="brand" />
      </Put>
      <Pkt at={along([[308, 150], [352, 150]], t)} tone={colors.brand} size={12} square />
      <Put x={418} b={196} style={up(lit === 2)}>
        <ClayOsWindow w={112} k={0} />
      </Put>
      <At x={124} y={22}>
        <Marker n={1} on={lit === 0} />
      </At>
      <At x={237} y={22}>
        <Marker n={2} on={lit === 1} />
      </At>
      <At x={446} y={70}>
        <Marker n={3} on={lit === 2} />
      </At>
    </>
  )
}

export function StorageAnalogy({ lesson }: { lesson: string }) {
  return (
    <PairAnalogy
      id="StorageAnalogy"
      kicker="Storage Virtualization"
      title="A Bank's Shared Pool"
      lesson={lesson}
      everyday={{ label: 'A bank', scene: BankScene }}
      cloud={{ label: 'Storage virtualization', scene: StorageScene }}
      pairs={[
        ['Bank branches', 'Physical disks'],
        ['One shared money pool', 'Virtual volume'],
        ['Customer at any ATM', 'Application'],
      ]}
    />
  )
}

/* ================================================================== 12 · network virtualization in a VDC */

/**
 * The TR's own diagram, redrawn: two physical servers, each with three VMs
 * joined through vNICs to a VM network beside the hypervisor kernel, leaving
 * through its pNIC to one physical network that also reaches a client and a
 * storage array. A packet runs the three routes in turn: VM to the other
 * server's VM, VM to the client, VM to the storage array; its destination lights.
 */
const NW_W = 1110
const NW_H = 340
const SRV_W = 420
const SRV = [24, NW_W - 24 - SRV_W]
const VM_X = [20, 96, 172]
const CLOUD_C: Pt = [555, 222]

function serverPts(ox: number) {
  return {
    vm: (i: number): Pt => [ox + VM_X[i] + 32, 68],
    pillTop: [ox + 141, 102] as Pt,
    pillBot: [ox + 141, 144] as Pt,
    nic: [ox + 190, 178] as Pt,
    drop: [ox + 190, 198] as Pt,
  }
}

function VdcScene() {
  const t = useLoop(9000, { mode: 'sawtooth', still: 0.22 })
  const L = serverPts(SRV[0])
  const R = serverPts(SRV[1])
  const cloudL: Pt = [496, 222]
  const cloudR: Pt = [614, 222]
  const routes: Pt[][] = [
    [L.vm(1), L.pillTop, L.pillBot, L.nic, L.drop, cloudL, CLOUD_C, cloudR, R.drop, R.nic, R.pillBot, R.pillTop, R.vm(1)],
    [L.vm(2), L.pillTop, L.pillBot, L.nic, L.drop, cloudL, CLOUD_C, [496, 244], [384, 262]],
    [R.vm(2), R.pillTop, R.pillBot, R.nic, R.drop, cloudR, CLOUD_C, [555, 280]],
  ]
  const ph = t * 3
  const route = Math.min(2, Math.floor(ph))
  const u = Math.min(1, (ph - route) / 0.85)
  const arrived = ph - route > 0.85
  const server = (ox: number, side: 0 | 1) => {
    const P = serverPts(ox)
    const hot = (i: number) => (route === 0 && side === 1 && i === 1 && arrived) || (route === 0 && side === 0 && i === 1) || (route === 1 && side === 0 && i === 2) || (route === 2 && side === 1 && i === 2)
    return (
      <>
        <At x={ox + SRV_W - 18} y={24} style={{ transform: 'translateX(-100%)' }}>
          <span className="whitespace-nowrap font-heading text-[15px] font-bold tracking-[0.06em]" style={{ color: colors.ink }}>
            PHYSICAL SERVER
          </span>
        </At>
        {VM_X.map((x, i) => (
          <Box key={x} x={ox + x} y={28} w={64} h={40} lit={hot(i)}>
            VM
          </Box>
        ))}
        <At x={ox + 18} y={76}>
          <span className="text-[14px] font-semibold" style={{ color: colors.brand }}>
            vNIC
          </span>
        </At>
        <Box x={ox + 56} y={102} w={170} h={42} tone="pill" r={21}>
          VM network
        </Box>
        <Box x={ox + 270} y={96} w={134} h={54} tone="brand">
          Hypervisor kernel
        </Box>
        <span aria-hidden className="absolute rounded-[5px]" style={{ left: P.nic[0] - 16, top: P.nic[1] - 9, width: 32, height: 16, background: `linear-gradient(180deg, #4357B8, ${colors.brandDeep})`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 6px 10px -6px rgba(16,32,58,0.6)` }} />
        <At x={P.nic[0] + (side === 0 ? -24 : 24)} y={180} style={side === 0 ? { transform: 'translateX(-100%)' } : undefined}>
          <span className="font-heading text-[15px] font-bold" style={{ color: colors.ink }}>
            pNIC
          </span>
        </At>
      </>
    )
  }
  const wire = (P: ReturnType<typeof serverPts>, ox: number) => [
    ...VM_X.map((_, i) => ({ d: `M ${P.vm(i)[0]} ${P.vm(i)[1]} L ${ox + 106 + i * 35} 102`, tone: '#9DB6EA', width: 2 })),
    { d: `M ${ox + 226} 123 H ${ox + 270}`, tone: '#9DB6EA', width: 2 },
    { d: `M ${P.pillBot[0]} ${P.pillBot[1]} L ${P.nic[0]} ${P.nic[1] - 9}`, tone: '#9DB6EA', width: 2 },
  ]
  return (
    <>
      {SRV.map((ox) => (
        <Plate key={ox} x={ox} y={14} w={SRV_W} h={164} />
      ))}
      <Wires
        w={NW_W}
        h={NW_H}
        paths={[
          ...wire(L, SRV[0]),
          ...wire(R, SRV[1]),
          { d: `M ${L.nic[0]} ${L.nic[1]} V ${L.drop[1]} L 496 222`, tone: colors.brand, width: 3, dash: '7 5' },
          { d: `M ${R.nic[0]} ${R.nic[1]} V ${R.drop[1]} L 614 222`, tone: colors.brand, width: 3, dash: '7 5' },
          { d: 'M 384 262 L 496 244', tone: colors.brandDeep, width: 3 },
          { d: 'M 555 262 V 280', tone: colors.brandDeep, width: 3 },
        ]}
      />
      {server(SRV[0], 0)}
      {server(SRV[1], 1)}
      <At x={555} y={44} cx w={200}>
        <span className="block text-center text-[16px] italic leading-snug" style={{ color: colors.muted }}>
          Network virtualization in a virtual data centre (VDC)
        </span>
      </At>
      <At x={555} y={220} cx cy>
        <RichCloud w={140} />
      </At>
      <At x={555} y={155} cx cy>
        <Label tone="solid" size={14} strong raised>
          Physical network
        </Label>
      </At>
      <At x={312} y={236} cx>
        <div className="flex items-center gap-2">
          <Icon3D name="desktop" w={52} style={{ filter: route === 1 && arrived ? 'drop-shadow(0 0 10px rgba(255,138,61,0.8))' : 'none', transition: `filter 420ms ${EASE}` }} />
          <span className="font-heading text-[15px] font-bold" style={{ color: colors.ink }}>
            Client
          </span>
        </div>
      </At>
      <At x={537} y={280}>
        <div className="flex items-center gap-2">
          <Icon3D name="database" w={36} style={{ filter: route === 2 && arrived ? 'drop-shadow(0 0 10px rgba(255,138,61,0.8))' : 'none', transition: `filter 420ms ${EASE}` }} />
          <span className="font-heading text-[15px] font-bold" style={{ color: colors.ink }}>
            Storage array
          </span>
        </div>
      </At>
      <div className="absolute rounded-[14px] px-4 py-2.5" style={{ left: 864, top: 232, ...TILE_SKIN }}>
        <span className="block font-heading text-[16px] font-semibold leading-snug" style={{ color: colors.ink }}>
          pNIC: Physical NIC
        </span>
        <span className="block font-heading text-[16px] font-semibold leading-snug" style={{ color: colors.ink }}>
          vNIC: Virtual NIC
        </span>
      </div>
      <Pkt at={along(routes[route], u)} tone={colors.accent} size={14} />
    </>
  )
}

export function Network({ lesson }: { lesson: string }) {
  return (
    <FigureOnly
      id="Network"
      kicker="Network Virtualization"
      title="Logical Nets Over Physical"
      lead={['Network virtualization uses software to create multiple separate virtual networks on top of one shared physical network.', 'Each virtual network has its own addressing and settings.']}
      lesson={lesson}
      h={NW_H}
      figure={<VdcScene />}
    />
  )
}

/* ================================================================== 13 · logical loops over one cable */

const LOOP_X = [117, 317, 517]
const LOOP_W = 150
const LOOP_TOP = 90
const LOOP_H = 156
const CABLE_Y = 274

function LoopsScene() {
  const t = useLoop(6000, { mode: 'sawtooth', still: 0.3 })
  const nets = [
    { name: 'Network A', range: '10.0.1.0/24' },
    { name: 'Network B', range: '10.0.2.0/24' },
    { name: 'Network C', range: '10.0.3.0/24' },
  ]
  return (
    <>
      <Wires w={FIG_W} h={380} paths={LOOP_X.map((x, i) => ({ d: `M ${x} ${LOOP_TOP + LOOP_H} V ${CABLE_Y}`, tone: NETS[i], width: 4 }))} />
      <div aria-hidden className="absolute rounded-full" style={{ left: 34, top: CABLE_Y - 2, width: FIG_W - 68, height: 16, background: `linear-gradient(180deg, #33476E, ${colors.brandDeep})`, boxShadow: '0 10px 18px -10px rgba(0,37,75,0.6), inset 0 1px 0 rgba(255,255,255,0.25)' }} />
      {/* the three networks' traffic shares the one cable, each packet in its own colour */}
      {NETS.map((c, i) => (
        <Pkt key={c} at={[44 + ((t + i / 3) % 1) * (FIG_W - 88), CABLE_Y + 6]} tone={c} size={10} />
      ))}
      {nets.map((n, i) => {
        const x0 = LOOP_X[i] - LOOP_W / 2
        const ring = ringPts(x0, LOOP_TOP, LOOP_W, LOOP_H, 46)
        return (
          <div key={n.name}>
            <At x={LOOP_X[i]} y={18} cx>
              <div className="flex flex-col items-center gap-1.5">
                <span className="font-heading text-[18px] font-bold" style={{ color: NETS[i] }}>
                  {n.name}
                </span>
                <span className="rounded-md px-2 py-0.5 font-mono text-[15px] font-semibold" style={{ background: `${NETS[i]}1F`, color: colors.ink }}>
                  {n.range}
                </span>
              </div>
            </At>
            <div aria-hidden className="absolute" style={{ left: x0, top: LOOP_TOP, width: LOOP_W, height: LOOP_H, borderRadius: 46, background: `linear-gradient(180deg, ${NETS[i]}14, ${NETS[i]}26)`, boxShadow: `inset 0 0 0 4px ${NETS[i]}, 0 14px 24px -16px ${NETS[i]}` }} />
            {[0, 1].map((k) => (
              <div key={k} className="absolute grid place-items-center rounded-[10px] font-heading text-[15px] font-bold" style={{ left: LOOP_X[i] - 32, top: LOOP_TOP + 38 + k * 46, width: 64, height: 36, color: NETS[i], background: 'linear-gradient(180deg, #FFFFFF, #F3F7FF)', boxShadow: `inset 0 0 0 2px ${NETS[i]}, 0 8px 14px -10px rgba(16,32,58,0.5)` }}>
                VM
              </div>
            ))}
            <Pkt at={along(ring, (t * 2 + i * 0.3) % 1)} tone={NETS[i]} size={13} />
          </div>
        )
      })}
      {[217, 417].map((x) => (
        <At key={x} x={x} y={LOOP_TOP + LOOP_H / 2} cx cy>
          <ClayPadlock w={26} />
        </At>
      ))}
      <At x={FIG_W / 2} y={300} cx>
        <span className="font-heading text-[17px] font-bold" style={{ color: colors.ink }}>
          One physical network cable
        </span>
      </At>
      <At x={FIG_W / 2} y={330} cx>
        <MarkLine name="vpc" text="Amazon VPC" />
      </At>
    </>
  )
}

export function NetworkLoops({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="NetworkLoops"
      kicker="Network Virtualization"
      title="Logical Nets Over Physical"
      lesson={lesson}
      points={['Virtual switches replace physical wiring changes', 'Overlay networks tunnel traffic across shared links', "Isolation prevents one tenant's traffic reaching another's", 'AWS example: Amazon VPC (Virtual Private Cloud) isolated network']}
      figure={<LoopsScene />}
    />
  )
}

/* ================================================================== 14 · a Wi-Fi for each company */

const FLOOR_Y = [42, 108, 174]
const WIFI_TONES = [colors.brand, LAB.periwinkle, '#2FB36B']

/** The drawn office building (replaced on slide 14 by the supplied infographic, 2026-10-27; kept, not mounted). */
export function OfficeScene(lit: number) {
  return <OfficeSceneBody lit={lit} />
}
function OfficeSceneBody({ lit }: { lit: number }) {
  const t = useLoop(4800, { mode: 'sawtooth', still: 0.45 })
  /* the one shared connection: pole insulator, the sagging line, the riser down the building's side */
  const ph = t * 3
  const floor = Math.min(2, Math.floor(ph))
  const u = ph - floor
  const feed: Pt[] = [[64, 47], [108, 60], [150, 52], [150, FLOOR_Y[floor] + 28], [176, FLOOR_Y[floor] + 28]]
  const USE = [0.35, 0.62, 0.86]
  return (
    <>
      <Put x={50} b={248} style={up(lit === 0)}>
        <Pole />
      </Put>
      <Wires w={500} h={270} paths={[{ d: 'M 64 47 Q 108 72 150 52 V 202', tone: lit === 0 ? colors.brandDeep : '#34466B', width: 5 }]} />
      {FLOOR_Y.map((y) => (
        <div key={y} aria-hidden className="absolute" style={{ left: 150, top: y + 25, width: 26, height: 5, borderRadius: 3, background: colors.brandDeep }} />
      ))}
      <Plate x={164} y={28} w={300} h={214}>
        {FLOOR_Y.map((y, i) => (
          <div key={y} className="absolute rounded-[12px]" style={{ left: 12, top: y - 28, width: 276, height: 56, background: `${WIFI_TONES[i]}${lit === 1 ? '33' : '1C'}`, boxShadow: `inset 0 0 0 ${lit === 1 ? 2 : 1.5}px ${WIFI_TONES[i]}${lit === 1 ? '' : '40'}`, transition: `all 420ms ${EASE}` }}>
            <At x={20} y={4} style={{ transform: `translateY(${lit === 1 ? -3 : 0}px)`, transition: `transform 420ms ${EASE}` }}>
              <div className="flex items-end gap-1.5">
                <Icon3D name="man-pro" w={27} shadow={false} />
                <Icon3D name="woman-pro" w={27} shadow={false} />
              </div>
            </At>
            <At x={226} y={28} cx cy style={{ transform: `translate(-50%, calc(-50% - ${lit === 2 ? 4 : 0}px))`, transition: `transform 420ms ${EASE}` }}>
              <ElectricMeter w={38} value={USE[i]} spin={lit === 2} />
            </At>
          </div>
        ))}
      </Plate>
      <Pkt at={along(feed, u)} tone={LAB.yellow} size={12} />
      <At x={74} y={86}>
        <Marker n={1} on={lit === 0} />
      </At>
      <At x={250} y={22}>
        <Marker n={2} on={lit === 1} />
      </At>
      <At x={436} y={60}>
        <Marker n={3} on={lit === 2} />
      </At>
    </>
  )
}

/** A utility pole in session 1's way: a graded wooden post, a crossbar, two glass insulators, on its shadow. */
function Pole() {
  const id = useId().replace(/:/g, '')
  return (
    <svg width={40} height={214} viewBox="0 0 40 214" aria-hidden style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${id}-w`} x1="0" x2="1">
          <stop offset="0" stopColor="#E2B386" />
          <stop offset="1" stopColor="#9A6338" />
        </linearGradient>
        <radialGradient id={`${id}-s`}>
          <stop offset="0" stopColor="rgba(31,64,140,0.3)" />
          <stop offset="1" stopColor="rgba(31,64,140,0)" />
        </radialGradient>
      </defs>
      <ellipse cx={20} cy={208} rx={18} ry={4} fill={`url(#${id}-s)`} />
      <rect x={16} y={6} width={8} height={202} rx={3} fill={`url(#${id}-w)`} />
      <rect x={2} y={16} width={36} height={6} rx={3} fill={`url(#${id}-w)`} />
      {[7, 33].map((cx) => (
        <g key={cx}>
          <rect x={cx - 3.5} y={8} width={7} height={9} rx={2.5} fill={LAB.sky} />
          <circle cx={cx - 1} cy={10} r={1.4} fill="#FFFFFF" opacity={0.8} />
        </g>
      ))}
    </svg>
  )
}

const VLOOP_X = [100, 250, 400]

function VirtualNetsScene(lit: number) {
  return <VirtualNetsBody lit={lit} />
}
function VirtualNetsBody({ lit }: { lit: number }) {
  const t = useLoop(5000, { mode: 'sawtooth', still: 0.3 })
  return (
    <>
      <Wires w={500} h={270} paths={VLOOP_X.map((x, i) => ({ d: `M ${x} 196 V 232`, tone: WIFI_TONES[i], width: 4 }))} />
      <div aria-hidden className="absolute rounded-full" style={{ left: 28, top: 228, width: 444, height: 14, background: `linear-gradient(180deg, #33476E, ${colors.brandDeep})`, boxShadow: `0 10px 18px -10px rgba(0,37,75,0.6)${lit === 0 ? `, 0 0 0 4px ${colors.brand}40` : ''}`, transition: `box-shadow 420ms ${EASE}` }} />
      {VLOOP_X.map((x, i) => {
        const x0 = x - 58
        const ring = ringPts(x0, 52, 116, 144, 34)
        const on = lit === 1
        return (
          <div key={x}>
            <div aria-hidden className="absolute" style={{ left: x0, top: 52, width: 116, height: 144, borderRadius: 34, background: `linear-gradient(180deg, ${WIFI_TONES[i]}12, ${WIFI_TONES[i]}28)`, boxShadow: `inset 0 0 0 ${on ? 4 : 3}px ${WIFI_TONES[i]}, 0 14px 24px -16px ${WIFI_TONES[i]}`, transform: on ? 'translateY(-4px)' : 'none', transition: `all 420ms ${EASE}` }} />
            {[0, 1].map((k) => (
              <div key={k} aria-hidden className="absolute rounded-[9px]" style={{ left: x - 30, top: 82 + k * 44, width: 60, height: 32, background: 'linear-gradient(180deg, #FFFFFF, #F3F7FF)', boxShadow: `inset 0 0 0 2px ${WIFI_TONES[i]}, 0 8px 14px -10px rgba(16,32,58,0.5)` }} />
            ))}
            <Pkt at={along(ring, (t + i * 0.33) % 1)} tone={WIFI_TONES[i]} size={11} />
          </div>
        )
      })}
      {[175, 325].map((x) => (
        <At key={x} x={x} y={124} cx cy style={{ transform: `translate(-50%, calc(-50% - ${lit === 2 ? 4 : 0}px))`, transition: `transform 420ms ${EASE}` }}>
          <ClayPadlock w={lit === 2 ? 26 : 22} />
        </At>
      ))}
      <At x={40} y={200}>
        <Marker n={1} on={lit === 0} />
      </At>
      <At x={85} y={24}>
        <Marker n={2} on={lit === 1} />
      </At>
      <At x={160} y={62}>
        <Marker n={3} on={lit === 2} />
      </At>
    </>
  )
}

/* ================================================================== 14 · the everyday card: the supplied infographic */

/**
 * The user's own picture for slide 14's EVERYDAY card (2026-10-27): `Apartment Utility Management
 * Infographic.png`, its empty margin trimmed, fitted to the whole card box at its own shape (contained,
 * never stretched; its white ground multiplied into the plate). Static, on the user's word: no motion.
 */
const AU_BOX_W = 500
const AU_BOX_H = 270
const AU_RATIO = 1323 / 792
const AU_W = Math.min(AU_BOX_W, AU_BOX_H * AU_RATIO)
const AU_H = AU_W / AU_RATIO

function ApartmentUtilityScene(lit: number) {
  /* markers on the picture, in its own fractions: 1 the supply line into the building, 2 a unit, 3 its meter */
  const at = (fx: number, fy: number) => ({ left: (AU_BOX_W - AU_W) / 2 + fx * AU_W - 15, top: (AU_BOX_H - AU_H) / 2 + fy * AU_H - 15 })
  return (
    <>
      <img src={apartmentUtility} alt="An apartment building with a management office, a power meter and a water meter for each unit, and a plumbing issue kept inside one unit" draggable={false} className="absolute inset-0 block h-full w-full select-none" style={{ objectFit: 'contain', mixBlendMode: 'multiply' }} />
      <div className="absolute" style={at(0.271, 0.38)}><Marker n={1} on={lit === 0} /></div>
      <div className="absolute" style={at(0.657, 0.299)}><Marker n={2} on={lit === 1} /></div>
      <div className="absolute" style={at(0.272, 0.64)}><Marker n={3} on={lit === 2} /></div>
    </>
  )
}

export function NetworkAnalogy({ lesson }: { lesson: string }) {
  return (
    <PairAnalogy
      id="NetworkAnalogy"
      kicker="Network Virtualization"
      title="A Wi-Fi For Each Company"
      lesson={lesson}
      everyday={{ label: 'An office building', scene: ApartmentUtilityScene }}
      cloud={{ label: 'Network virtualization', scene: VirtualNetsScene }}
      pairs={[
        ['One cable into the building', 'One physical network'],
        ["Each company's own Wi-Fi", 'Its own virtual network'],
        ['Its own password', 'No reach into other networks'],
      ]}
    />
  )
}

/* ================================================================== 15 · desktop and app virtualization */

const DA_PW = 404
const DA_FW = 1110 - DA_PW - 24
const DA_H = 340

function DeliveryScene() {
  const t = useLoop(6400, { mode: 'sawtooth', still: 0.3 })
  const k = t < 0.5 ? 0 : 1
  const u = (t % 0.5) / 0.5
  const src: Pt = [176, 150]
  const dst: Pt[] = [
    [300, 84],
    [300, 252],
  ]
  return (
    <>
      <Wires
        w={DA_FW}
        h={DA_H}
        paths={[
          { d: `M ${src[0]} ${src[1]} C 240 150, 240 84, ${dst[0][0]} ${dst[0][1]}`, tone: colors.brand, width: 3, dash: '7 6', on: k === 0 },
          { d: `M ${src[0]} 176 C 240 176, 240 252, ${dst[1][0]} ${dst[1][1]}`, tone: colors.teal, width: 3, dash: '7 6', on: k === 1 },
        ]}
      />
      <At x={110} y={64} cx>
        <div className="flex flex-col items-center gap-2">
          <ClayRack w={104} units={['run', 'run', 'run']} />
          <span className="text-center font-heading text-[17px] font-bold leading-tight" style={{ color: colors.ink }}>
            Remote data centre
          </span>
        </div>
      </At>
      {[0, 1, 2].map((j) => {
        const p = (u + j * 0.33) % 1
        const a: Pt = k === 0 ? bez([176, 150], [240, 150], [240, 84], [300, 84], p) : bez([176, 176], [240, 176], [240, 252], [300, 252], p)
        return <Pkt key={j} at={a} tone={k === 0 ? colors.brand : colors.teal} size={11} square />
      })}
      <At x={318} y={24}>
        <div className="flex items-center gap-4">
          <Screen w={150} kind="desktop" lit={k === 0} />
          <div className="flex flex-col gap-1.5">
            <span className="font-heading text-[18px] font-bold" style={{ color: colors.brand }}>
              Full Desktop
            </span>
            <MarkLine name="workspaces" text="Amazon WorkSpaces" h={22} size={15} />
          </div>
        </div>
      </At>
      <At x={318} y={196}>
        <div className="flex items-center gap-4">
          <Screen w={150} kind="app" lit={k === 1} />
          <div className="flex flex-col gap-1.5">
            <span className="font-heading text-[18px] font-bold" style={{ color: colors.tealDark }}>
              Single App
            </span>
            <MarkLine name="aws" text="AppStream 2.0" h={22} size={15} />
          </div>
        </div>
      </At>
    </>
  )
}

export function DesktopApp({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="DesktopApp"
      kicker="Desktop & App Virtualization"
      title="Remote Access Delivery"
      lead="Desktop virtualization delivers a full desktop from a remote host; application virtualization streams or isolates without local installation."
      lesson={lesson}
      pointsW={DA_PW}
      figH={DA_H}
      points={['Desktop: full OS session streamed remotely', 'Application: only the app runs remotely', 'Both remove dependency on local hardware', 'AWS examples: Amazon WorkSpaces desktops, AppStream 2.0 apps']}
      figure={<DeliveryScene />}
    />
  )
}

/* ================================================================== 16 · a channel or one show */

function StreamDots({ from, to, tone }: { from: Pt; to: Pt; tone: string }) {
  const t = useLoop(2400, { mode: 'sawtooth', still: 0.4 })
  return (
    <>
      {[0, 1, 2].map((j) => (
        <Pkt key={j} at={along([from, to], (t + j / 3) % 1)} tone={tone} size={9} />
      ))}
    </>
  )
}

/** A broadcast mast drawn in session 1's way: a navy lattice, a lit beacon, signal arcs that brighten when `on`. */
function Mast({ w, on }: { w: number; on: boolean }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg width={w} height={w * 1.3} viewBox="0 0 64 84" aria-hidden style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${id}-l`} x1="0" x2="1">
          <stop offset="0" stopColor="#5A6FCB" />
          <stop offset="1" stopColor={LAB.navy} />
        </linearGradient>
        <radialGradient id={`${id}-b`} cx="0.35" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.5" stopColor={LAB.sky} />
          <stop offset="1" stopColor={LAB.cobalt} />
        </radialGradient>
      </defs>
      {[0, 1].map((k) => (
        <g key={k} style={{ opacity: on ? 1 - k * 0.35 : 0.35 - k * 0.12, transition: `opacity 420ms ${EASE}` }}>
          <path d={`M ${18 - k * 8} ${4 - k * 2} Q ${12 - k * 8} 14 ${18 - k * 8} ${24 + k * 2}`} fill="none" stroke={colors.brand} strokeWidth={3} strokeLinecap="round" />
          <path d={`M ${46 + k * 8} ${4 - k * 2} Q ${52 + k * 8} 14 ${46 + k * 8} ${24 + k * 2}`} fill="none" stroke={colors.brand} strokeWidth={3} strokeLinecap="round" />
        </g>
      ))}
      <path d="M 32 16 L 14 84 M 32 16 L 50 84" stroke={`url(#${id}-l)`} strokeWidth={5} strokeLinecap="round" fill="none" />
      <path d="M 26 38 L 41 60 M 38 38 L 23 60 M 20 62 L 47 84 M 44 62 L 17 84 M 25 40 H 39 M 20 61 H 44" stroke={LAB.navy} strokeWidth={2.5} strokeLinecap="round" fill="none" opacity={0.85} />
      <circle cx={32} cy={14} r={7} fill={`url(#${id}-b)`} />
    </svg>
  )
}

function TvScene(lit: number) {
  return (
    <>
      <Wires w={500} h={270} paths={[{ d: 'M 128 214 H 232', tone: colors.brandDeep, width: 4, dash: '8 6' }]} />
      <StreamDots from={[128, 214]} to={[232, 214]} tone={LAB.yellow} />
      <Put x={80} b={248} style={up(lit === 0)}>
        <div className="flex flex-col items-center">
          <Mast w={64} on={lit === 0} />
          <div className="relative rounded-[12px]" style={{ width: 96, height: 76, background: `linear-gradient(180deg, #C9D5F2 0%, ${LAB.lavDeep} 100%)`, boxShadow: 'inset 0 1px 0 #FFFFFF, 0 14px 22px -14px rgba(16,32,58,0.55)' }}>
            <span className="absolute rounded-[4px]" style={{ left: 12, top: 12, width: 28, height: 20, background: '#EEF3FD' }} />
            <span className="absolute rounded-[4px]" style={{ left: 56, top: 12, width: 28, height: 20, background: '#EEF3FD' }} />
            <span className="absolute rounded-t-[5px]" style={{ left: 38, bottom: 0, width: 20, height: 30, background: LAB.navy }} />
          </div>
          <GroundShadow w={96} />
        </div>
      </Put>
      {/* the house: a roof over a warm room, the TV and a tablet in it */}
      <svg aria-hidden className="absolute left-0 top-0" width={500} height={270} style={{ overflow: 'visible' }}>
        <path d="M 236 100 L 354 40 L 472 100" fill="none" stroke={LAB.wood} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <Plate x={248} y={96} w={212} h={150} tint="linear-gradient(180deg, #FFF4E4 0%, #F9E3C6 100%)">
        <Put x={86} b={130} style={up(lit === 1)}>
          <Screen w={124} kind="channels" lit={lit === 1} />
        </Put>
        <Put x={180} b={130} style={up(lit === 2)}>
          <Tablet w={48} kind="play" lit={lit === 2} />
        </Put>
      </Plate>
      <At x={30} y={60}>
        <Marker n={1} on={lit === 0} />
      </At>
      <At x={319} y={60}>
        <Marker n={2} on={lit === 1} />
      </At>
      <At x={440} y={106}>
        <Marker n={3} on={lit === 2} />
      </At>
    </>
  )
}

function RemoteScene(lit: number) {
  return (
    <>
      <Wires w={500} h={270} paths={[{ d: 'M 134 180 H 244', tone: colors.brand, width: 4, dash: '8 6' }]} />
      <StreamDots from={[134, 180]} to={[244, 180]} tone={colors.brand} />
      <Put x={86} b={240} style={up(lit === 0)}>
        <ClayRack w={92} units={['run', 'run', 'run', 'run']} />
      </Put>
      <Plate x={248} y={84} w={212} h={162} tint="linear-gradient(180deg, rgba(232,240,255,0.95), rgba(214,227,251,0.95))" ring="#B9CBEF">
        <Put x={86} b={142} style={up(lit === 1)}>
          <Screen w={128} kind="desktop" lit={lit === 1} />
        </Put>
        <Put x={180} b={142} style={up(lit === 2)}>
          <Tablet w={48} kind="app" lit={lit === 2} />
        </Put>
      </Plate>
      <At x={30} y={40}>
        <Marker n={1} on={lit === 0} />
      </At>
      <At x={319} y={54}>
        <Marker n={2} on={lit === 1} />
      </At>
      <At x={440} y={94}>
        <Marker n={3} on={lit === 2} />
      </At>
    </>
  )
}

export function DesktopAnalogy({ lesson }: { lesson: string }) {
  return (
    <PairAnalogy
      id="DesktopAnalogy"
      kicker="Desktop & App Virtualization"
      title="A Channel Or One Show"
      lesson={lesson}
      everyday={{ label: 'Cable TV', scene: TvScene }}
      cloud={{ label: 'Desktop and app virtualization', scene: RemoteScene }}
      pairs={[
        ['A studio far away', 'A remote host'],
        ['The whole channel', 'A full desktop'],
        ['One show', 'A single app'],
      ]}
    />
  )
}

/* ================================================================== 17 · five types compared */

function TypeCell({ icon, children }: { icon: ReactNode; children: string }) {
  return (
    <span className="inline-flex items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px]" style={{ background: colors.surface2, color: colors.brand, boxShadow: `inset 0 0 0 1px #D5E1F7` }} aria-hidden>
        {icon}
      </span>
      <span className="font-heading font-semibold" style={{ color: colors.ink }}>
        {children}
      </span>
    </span>
  )
}

export function TypesCompared({ lesson }: { lesson: string }) {
  const ic = { size: 20, strokeWidth: 2 }
  return (
    <TableCard
      id="TypesCompared"
      kicker="Virtualization Types Compared"
      title="Side-By-Side Summary"
      lead="Each virtualization type abstracts a different physical resource, but all follow the same pattern of separating logical use from physical ownership."
      lesson={lesson}
      compact
      columns={[
        { label: 'Type', weight: 0.8 },
        { label: 'What Is Virtualized', weight: 1.4 },
        { label: 'Real AWS Example', weight: 1.1 },
      ]}
      rows={[
        [<TypeCell icon={<Server {...ic} />}>Server</TypeCell>, 'Physical machine into VMs', <MarkLine name="ec2" text="Amazon EC2" h={26} />],
        [<TypeCell icon={<HardDrive {...ic} />}>Storage</TypeCell>, 'Physical disks into volumes', <MarkLine name="ebs" text="Amazon EBS" h={26} />],
        [<TypeCell icon={<NetworkIcon {...ic} />}>Network</TypeCell>, 'Physical wiring into virtual nets', <MarkLine name="vpc" text="Amazon VPC" h={26} />],
        [<TypeCell icon={<Monitor {...ic} />}>Desktop</TypeCell>, 'Physical workstation into remote session', <MarkLine name="workspaces" text="Amazon WorkSpaces" h={26} />],
        [<TypeCell icon={<AppWindow {...ic} />}>Application</TypeCell>, 'Remotely streamed or isolated app', <MarkLine name="appstream" text="AWS AppStream 2.0" h={26} />],
      ]}
    />
  )
}
