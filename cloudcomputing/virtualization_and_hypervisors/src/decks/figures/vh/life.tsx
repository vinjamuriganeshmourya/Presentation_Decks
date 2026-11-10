import { useId, type CSSProperties, type ReactNode } from 'react'
import { Camera, Copy, Pause, Play, Power, Rocket } from 'lucide-react'
import { colors } from '@/design/tokens'
import { Arrow, At, Label, Note, useLoop } from '../scene'
import { ClayClock, ClayOsWindow, ClayPhone, ClayRack, ClayServer, LAB } from '../d3/kit'
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
const MOVING_DOTS = false

function Pkt({ a, b, t, tone = colors.warning, size = 14, on = true }: { a: [number, number]; b: [number, number]; t: number; tone?: string; size?: number; on?: boolean }) {
  /* moving dots off deck-wide (user, 2026-10-28: "remove the moving dots") */
  if (!MOVING_DOTS) return null
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

/* everything sits 12px lower than first built, so the Start to Terminate line clears Suspend across the top (review 2026-10-28) */
const MID = 165
const BR_Y = [32, 124, 216]
const BR_H = 82
const STAGES: Stage53[] = [
  { key: 'Provision', line: 'Allocate vCPU, memory, disk, NIC', icon: <Rocket />, tone: colors.brand, bg: colors.surface2, x: 24, y: MID - 44, w: 222, h: 88 },
  { key: 'Start', line: 'Boot guest OS on virtual hardware', icon: <Play />, tone: colors.success, bg: '#E9F8EF', x: 292, y: MID - 44, w: 222, h: 88 },
  { key: 'Suspend', line: 'Pause execution; save state to disk', icon: <Pause />, tone: colors.brand, bg: colors.surface2, x: 566, y: BR_Y[0], w: 278, h: BR_H },
  { key: 'Snapshot', line: 'Capture point-in-time disk/state image', icon: <Camera />, tone: colors.brand, bg: colors.surface2, x: 566, y: BR_Y[1], w: 278, h: BR_H },
  { key: 'Clone', line: 'Duplicate VM as new independent instance', icon: <Copy />, tone: colors.brand, bg: colors.surface2, x: 566, y: BR_Y[2], w: 278, h: BR_H },
  { key: 'Terminate', line: 'Shut down guest; release resources', icon: <Power />, tone: colors.danger, bg: '#FDECEC', x: 890, y: MID - 44, w: 196, h: 88 },
]
const RET_Y = 328
const OVER_Y = 12 // the Start to Terminate line, over the three branches
const P_X = STAGES[0].x + STAGES[0].w / 2
const T_X = STAGES[5].x + STAGES[5].w / 2
const LBL_L = 372
const LBL_R = 738

type Seg = { card: number } | { pts: [number, number][] }

/** One lap of the token: Provision, Start, branch `k` and back to Start (the two-way link), Start to Terminate over the top, and back along the return line. */
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
    { seg: { pts: [[b.x, bc], [s1.x + s1.w, MID]] }, w: 0.7 },
    { seg: { card: 1 }, w: 0.8 },
    { seg: { pts: [[s1.x + s1.w / 2, s1.y], [s1.x + s1.w / 2, OVER_Y], [T_X, OVER_Y], [T_X, t.y]] }, w: 1.4 },
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
      h={356}
    >
      <Arrow x1={s0.x + s0.w} y1={MID} x2={s1.x - 2} y2={MID} />
      {/* Start and each of Suspend, Snapshot, Clone: two-way, the VM goes there and comes back to running (review 2026-10-28) */}
      {STAGES.slice(2, 5).map((b, i) => (
        <Arrow key={b.key} both x1={s1.x + s1.w + 2} y1={MID} x2={b.x - 2} y2={b.y + b.h / 2} dashed tone={k === i ? colors.brand : GREY_LINK} />
      ))}
      {/* one line from Start to Terminate, over the top; nothing runs from the three boxes to Terminate */}
      <svg aria-hidden className="pointer-events-none absolute left-0 top-0" width={1110} height={350}>
        <path d={`M ${s1.x + s1.w / 2} ${s1.y - 2} V ${OVER_Y} H ${T_X} V ${term.y - 11}`} stroke={colors.danger} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M ${T_X} ${term.y - 2} l -6 -10 h 12 z`} fill={colors.danger} />
      </svg>
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

/**
 * The two AWS resource icons drawn inline (user, 2026-10-29: "embed as inline SVG"), path for path from the
 * official AWS Architecture Icons package, release 07312026 (https://aws.amazon.com/architecture/icons/, the
 * asset package `Icon-package_07312026.5846e92413caa21490223536cc97f1269e44fa92.zip`):
 *   ebsSnapshot  Resource-Icons_07312026/Res_Storage/Res_Amazon-Elastic-Block-Store_Snapshot_48.svg
 *                ("Amazon Elastic Block Store: Snapshot", fill #7AA116, the package's Storage green)
 *   ec2Ami       Resource-Icons_07312026/Res_Compute/Res_Amazon-EC2_AMI_48.svg
 *                ("Amazon EC2: AMI", fill #ED7100, the package's Compute orange)
 * `marks/ebs-snapshot.svg` and `marks/ec2-ami.svg` are byte-identical copies of those two files (checked with cmp on
 * 2026-10-29); this draws the same shapes as `<svg>` in the document instead of behind an `<img>`.
 */
const AWS_RES = {
  ebsSnapshot: { title: 'Amazon Elastic Block Store: Snapshot', fill: '#7AA116', d: 'M36.1992,30.791 L36.2782,30.208 C36.7902,30.537 37.1402,30.802 37.3492,30.991 C37.0482,30.971 36.6542,30.899 36.1992,30.791 L36.1992,30.791 Z M22.7372,26.535 C22.7372,26.429 22.8232,26.342 22.9292,26.342 C22.9602,26.342 22.9822,26.362 23.0082,26.375 L22.8612,26.674 C22.7952,26.653 22.7372,26.614 22.7372,26.535 L22.7372,26.535 Z M32.7042,41.835 C32.7032,41.839 32.5272,42.208 31.3422,42.676 C30.8032,42.889 30.1622,43.082 29.4352,43.249 C27.5532,43.684 25.2412,43.924 22.9282,43.924 C17.1472,43.924 13.4392,42.544 13.1622,41.882 C13.1622,41.837 13.1592,41.793 13.1532,41.749 L10.3892,21.228 C10.4372,21.252 10.4972,21.271 10.5462,21.294 C10.8732,21.451 11.2192,21.601 11.5912,21.738 C11.6202,21.749 11.6452,21.761 11.6762,21.771 C12.0802,21.917 12.5132,22.05 12.9602,22.174 C13.0822,22.208 13.2062,22.24 13.3302,22.272 C13.7052,22.37 14.0882,22.461 14.4822,22.545 C14.5772,22.565 14.6692,22.587 14.7642,22.607 C15.2432,22.704 15.7322,22.79 16.2282,22.868 C16.3492,22.887 16.4712,22.903 16.5942,22.921 C16.9992,22.98 17.4062,23.034 17.8142,23.082 C17.9382,23.096 18.0612,23.111 18.1852,23.124 C18.6872,23.179 19.1862,23.225 19.6802,23.261 C19.7662,23.268 19.8492,23.271 19.9352,23.277 C20.3552,23.306 20.7682,23.329 21.1752,23.346 C21.3032,23.351 21.4292,23.356 21.5562,23.36 C22.0272,23.376 22.4902,23.386 22.9282,23.386 C23.3672,23.386 23.8302,23.376 24.3012,23.36 C24.4282,23.356 24.5542,23.351 24.6832,23.346 C25.0912,23.329 25.5052,23.306 25.9272,23.277 C26.0112,23.271 26.0922,23.268 26.1772,23.261 C26.6702,23.225 27.1682,23.179 27.6692,23.125 C27.7972,23.111 27.9242,23.095 28.0522,23.081 C28.4572,23.034 28.8592,22.98 29.2622,22.921 C29.3862,22.903 29.5092,22.887 29.6322,22.867 C30.1272,22.79 30.6162,22.704 31.0952,22.607 C31.1912,22.587 31.2832,22.565 31.3792,22.544 C31.7722,22.461 32.1552,22.37 32.5302,22.272 C32.6542,22.24 32.7772,22.208 32.8982,22.174 C33.3452,22.049 33.7782,21.917 34.1832,21.771 C34.2152,21.76 34.2412,21.748 34.2712,21.736 C34.6422,21.6 34.9872,21.451 35.3142,21.294 C35.3632,21.271 35.4232,21.252 35.4702,21.228 L34.2622,30.228 C31.6532,29.365 28.0762,27.877 24.7122,26.283 C24.5882,25.406 23.8402,24.728 22.9292,24.728 C21.9322,24.728 21.1222,25.539 21.1222,26.535 C21.1222,27.532 21.9322,28.342 22.9292,28.342 C23.2622,28.342 23.5712,28.246 23.8392,28.088 C28.0672,30.116 31.4522,31.501 33.9912,32.249 L32.7042,41.835 Z M22.9282,14.922 C30.5962,14.922 35.7142,17.326 35.8562,18.354 L35.8442,18.451 C35.8332,18.485 35.8092,18.521 35.7892,18.557 C35.7712,18.588 35.7572,18.619 35.7312,18.651 C35.7032,18.687 35.6632,18.725 35.6262,18.762 C35.5912,18.797 35.5592,18.832 35.5162,18.868 C35.4712,18.906 35.4162,18.944 35.3632,18.983 C35.3102,19.021 35.2622,19.059 35.2002,19.099 C35.1412,19.136 35.0712,19.175 35.0052,19.213 C34.9332,19.254 34.8662,19.295 34.7862,19.337 C34.7142,19.375 34.6302,19.414 34.5502,19.452 C34.4602,19.495 34.3742,19.538 34.2752,19.581 C34.1902,19.618 34.0942,19.655 34.0032,19.692 C33.8942,19.737 33.7892,19.781 33.6712,19.825 C33.5722,19.862 33.4632,19.898 33.3572,19.935 C33.2312,19.978 33.1102,20.022 32.9752,20.065 C32.8632,20.102 32.7392,20.136 32.6222,20.171 C32.4792,20.214 32.3412,20.257 32.1892,20.298 C32.0622,20.333 31.9242,20.366 31.7902,20.4 C31.6342,20.44 31.4822,20.481 31.3172,20.519 C31.1742,20.552 31.0192,20.583 30.8702,20.616 C30.7002,20.652 30.5362,20.689 30.3582,20.724 C30.1992,20.755 30.0272,20.784 29.8612,20.813 C29.6802,20.845 29.5052,20.879 29.3172,20.909 C29.1372,20.938 28.9452,20.963 28.7582,20.989 C28.5702,21.016 28.3882,21.045 28.1942,21.069 C27.9902,21.095 27.7732,21.116 27.5612,21.14 C27.3722,21.16 27.1872,21.183 26.9922,21.202 C26.7622,21.223 26.5202,21.239 26.2822,21.257 C26.0922,21.272 25.9072,21.289 25.7112,21.301 C25.4462,21.318 25.1682,21.328 24.8942,21.339 C24.7142,21.347 24.5402,21.358 24.3562,21.364 C23.8922,21.378 23.4162,21.386 22.9282,21.386 C22.4402,21.386 21.9652,21.378 21.5012,21.364 C21.3232,21.359 21.1552,21.348 20.9792,21.34 C20.7002,21.328 20.4172,21.318 20.1452,21.301 C19.9652,21.29 19.7952,21.274 19.6192,21.261 C19.3652,21.242 19.1072,21.224 18.8632,21.201 C18.6882,21.185 18.5252,21.164 18.3552,21.146 C18.1232,21.121 17.8862,21.097 17.6612,21.069 C17.4882,21.047 17.3272,21.021 17.1592,20.998 C16.9502,20.968 16.7372,20.94 16.5362,20.908 C16.3712,20.881 16.2172,20.852 16.0562,20.823 C15.8682,20.791 15.6762,20.758 15.4962,20.723 C15.3382,20.692 15.1922,20.659 15.0412,20.626 C14.8712,20.59 14.6972,20.555 14.5362,20.518 C14.3912,20.484 14.2602,20.448 14.1222,20.414 C13.9682,20.375 13.8092,20.336 13.6632,20.296 C13.5292,20.26 13.4072,20.222 13.2802,20.184 C13.1452,20.144 13.0062,20.104 12.8792,20.064 C12.7592,20.025 12.6512,19.986 12.5382,19.947 C12.4182,19.906 12.2942,19.865 12.1812,19.823 C12.0772,19.784 11.9852,19.744 11.8872,19.705 C11.7842,19.663 11.6762,19.621 11.5802,19.579 C11.4902,19.54 11.4122,19.5 11.3302,19.461 C11.2422,19.419 11.1492,19.377 11.0692,19.335 C10.9962,19.297 10.9342,19.259 10.8692,19.221 C10.7962,19.18 10.7202,19.138 10.6562,19.097 C10.5992,19.06 10.5532,19.024 10.5042,18.988 C10.4472,18.947 10.3882,18.906 10.3422,18.867 C10.3012,18.833 10.2702,18.799 10.2372,18.766 C10.1982,18.727 10.1562,18.688 10.1282,18.65 C10.1022,18.619 10.0892,18.589 10.0712,18.559 C10.0502,18.522 10.0262,18.485 10.0152,18.45 L10.0032,18.354 C10.1452,17.326 15.2622,14.922 22.9282,14.922 L22.9282,14.922 Z M39.6692,31.017 C39.4982,30.1 38.5532,29.194 36.5692,28.043 L37.8122,18.817 L37.8122,18.816 L37.8122,18.816 L37.8502,18.529 C37.8562,18.485 37.8592,18.441 37.8592,18.397 C37.8592,15.123 30.1392,12.922 22.9282,12.922 C15.7192,12.922 8.0002,15.123 8.0002,18.397 C8.0002,18.441 8.0032,18.485 8.0092,18.529 L8.0472,18.816 L8.0472,18.816 L8.0472,18.817 L11.1642,41.962 C11.2892,44.867 18.2412,45.924 22.9282,45.924 C25.3882,45.924 27.8592,45.666 29.8862,45.198 C30.7082,45.008 31.4452,44.787 32.0772,44.537 C33.7722,43.866 34.6532,42.999 34.6952,41.961 L35.9382,32.731 C36.5532,32.846 37.0972,32.907 37.5592,32.907 C38.4092,32.907 38.9982,32.712 39.3252,32.322 C39.6352,31.954 39.7572,31.491 39.6692,31.017 L39.6692,31.017 Z M12.6212,13.481 L10.6212,13.481 L10.6212,10.861 C10.6212,10.309 11.0682,9.861 11.6212,9.861 L34.3302,9.861 C34.8832,9.861 35.3302,10.309 35.3302,10.861 L35.3302,13.481 L33.3302,13.481 L33.3302,11.861 L12.6212,11.861 L12.6212,13.481 Z M16.0952,4 L29.8552,4 L32.0442,6.367 L13.9072,6.367 L16.0952,4 Z M11.6212,8.367 L34.3302,8.367 C34.7272,8.367 35.0872,8.132 35.2462,7.768 C35.4052,7.404 35.3342,6.98 35.0642,6.688 L31.0272,2.321 C30.8382,2.116 30.5722,2 30.2932,2 L15.6582,2 C15.3792,2 15.1132,2.116 14.9242,2.321 L10.8872,6.688 C10.6172,6.98 10.5462,7.404 10.7052,7.768 C10.8642,8.132 11.2232,8.367 11.6212,8.367 L11.6212,8.367 Z' },
  ec2Ami: { title: 'Amazon EC2: AMI', fill: '#ED7100', d: 'M30.143,37.727 L38.599,37.727 L38.599,26.656 L30.143,26.656 L30.143,37.727 Z M9.229,37.727 L17.686,37.727 L17.686,26.656 L9.229,26.656 L9.229,37.727 Z M19.686,37.727 L28.143,37.727 L28.143,26.656 L19.686,26.656 L19.686,37.727 Z M39.599,24.656 L8.229,24.656 C7.676,24.656 7.229,25.104 7.229,25.656 L7.229,38.727 C7.229,39.279 7.676,39.727 8.229,39.727 L39.599,39.727 C40.151,39.727 40.599,39.279 40.599,38.727 L40.599,25.656 C40.599,25.104 40.151,24.656 39.599,24.656 L39.599,24.656 Z M30.143,19.428 L38.599,19.428 L38.599,10.971 L30.143,10.971 L30.143,19.428 Z M9.229,19.428 L17.686,19.428 L17.686,10.971 L9.229,10.971 L9.229,19.428 Z M19.686,19.428 L28.143,19.428 L28.143,10.971 L19.686,10.971 L19.686,19.428 Z M39.599,8.971 L8.229,8.971 C7.676,8.971 7.229,9.419 7.229,9.971 L7.229,20.428 C7.229,20.98 7.676,21.428 8.229,21.428 L39.599,21.428 C40.151,21.428 40.599,20.98 40.599,20.428 L40.599,9.971 C40.599,9.419 40.151,8.971 39.599,8.971 L39.599,8.971 Z M43.827,39.379 C43.827,41.832 41.832,43.827 39.38,43.827 L8.448,43.827 C5.995,43.827 4,41.832 4,39.379 L4,8.448 C4,5.995 5.995,4 8.448,4 L39.38,4 C41.832,4 43.827,5.995 43.827,8.448 L43.827,39.379 Z M39.38,2 L8.448,2 C4.893,2 2,4.892 2,8.448 L2,39.379 C2,42.934 4.893,45.827 8.448,45.827 L39.38,45.827 C42.935,45.827 45.827,42.934 45.827,39.379 L45.827,8.448 C45.827,4.892 42.935,2 39.38,2 L39.38,2 Z' },
} as const

function AwsResIcon({ name, h }: { name: keyof typeof AWS_RES; h: number }) {
  const { title, fill, d } = AWS_RES[name]
  return (
    <svg role="img" aria-label={title} width={h} height={h} viewBox="0 0 48 48" className="block shrink-0">
      <path d={d} fill={fill} fillRule="evenodd" />
    </svg>
  )
}

function OnAws({ mark, children }: { mark: 'ec2' | 'ebsSnapshot' | 'ec2Ami'; children: string }) {
  return (
    <span className="inline-flex items-center gap-3">
      {mark === 'ec2' ? (
        <Logo name={mark} h={40} style={{ flexShrink: 0 }} />
      ) : mark === 'ebsSnapshot' ? (
        /* the user's own EBS service icon (2026-10-30: "replace the icon of ebs slide 54 ... this is the only change"), `marks/ebs-service.png` */
        <Logo name="ebsService" h={40} style={{ flexShrink: 0 }} />
      ) : (
        <AwsResIcon name={mark} h={40} />
      )}
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

/* the three step rows under the hosts were removed (review 2026-10-28): the points beside the figure already say it */

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
        </>
      }
      figH={226}
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
      {/* the call (the phone) moves from tower A's cell into tower B's; the car was removed (review 2026-10-28) */}
      <div className="absolute" style={{ left: CAR_X[lit], top: 104, transform: 'translateX(-50%)', transition: `left 2200ms ${EASE}` }}>
        <div className="flex flex-col items-center">
          <Marker n={2} on={lit === 1} />
          <div className="mt-1.5" style={{ transform: lit === 1 ? 'translateY(-3px) scale(1.06)' : 'none', transition: `transform 420ms ${EASE}` }}>
            <ClayPhone w={20} lit />
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

function Plate({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="absolute inset-x-5 flex items-center justify-center rounded-[14px]" style={{ top: 22, height: 150, background: 'rgba(232,240,255,0.55)', boxShadow: 'inset 0 0 0 1px #DCE6F8', ...style }}>
      {/* the header icons were removed (review 2026-10-28); the plate takes their place and its picture grows to fill it */}
      <div style={{ transform: 'scale(1.12)' }}>{children}</div>
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
          <Plate>
            <div className="flex items-center gap-3">
              <ClayClock w={52} turn={t} />
              <span aria-hidden className="relative h-[12px] w-[112px] overflow-hidden rounded-full" style={{ background: colors.line }}>
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

