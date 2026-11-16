import { type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { TILE_SKIN } from '@/decks/figures/card'
import { MOTION, motionHeld } from '@/motion/tokens'
import { litRing } from '@/decks/figures/net/frames'
import { Icon } from '@/engine/icon'
import { Ico3D, type Ico3DName, type Loop as Loop3D } from './icons3d'
import awsWord from '../images/aws-logo.png'
import iamMark from '../images/aws-iam.svg'
import mfaMark from '../images/res-iam-mfa-token.svg'
import keyMark from '../images/res-iam-long-term-security-credential.svg'
import stsMark from '../images/res-iam-temporary-security-credential.svg'
import bucketMark from '../images/res-s3-bucket.svg'

/*
 * BUILDER A · IAM Fundamentals (Session 13), sections 1-2:
 *   slide 6 A_T01 (identity tree + four TR rows), 7 A_T02 (master key, locked cabinet), 9 A_T03 (one Developers
 *   group), 11 A_T04B (the IAM console, drawn: Users and User groups ringed), 13 A_T05 (credential → two gates),
 *   14 A_T06 (the authentication gate + four TR rows), 16 A_T07 (the authorization gate + four TR rows),
 *   19 A_T09 (the IAM console menu joined to the credential each item manages).
 *
 * Built to Sessions 9-12 as reviewed (standing corrections 1-16, cloud R10-R13): icon-first, one Title Case tag per
 * untagged icon, no chips / badges / connector labels, official AWS marks on still white tiles, every glyph carries a
 * quiet loop, a sequential orange highlight loops first → last → first after the build, straight arrows from
 * constants, equal padding, nothing overlapping. `step` 0 = nothing pressed; step i lights point / row i while it is
 * the current press. Every loop is a CSS animation of transform / opacity on an HTML element (low-end PCs: never an
 * element inside an svg); held still on ?still, thumbnails and reduced motion, showing the full end state, nothing lit.
 */

const EASE = MOTION.ease
const useHeld = () => motionHeld(useInstant())
const font = "'DM Sans', system-ui, sans-serif"
const lc = (kind: string) => `a13 a13-${kind}`
const lv = (d = 0, t?: number, extra: Record<string, string | number> = {}): CSSProperties =>
  ({ ['--a13-d' as string]: `${-d}s`, ...(t ? { ['--a13-t' as string]: `${t}s` } : {}), ...extra }) as CSSProperties
const src = (n: string) => (n.startsWith('img:') ? n.slice(4) : n)
const WALK = 1.4 // seconds per item of a sequential highlight

/* ------------------------------------------------------------------ shared pieces */

function Show({ on, children, style, delay = 0, from = 'translateY(6px)' }: { on: boolean; children: ReactNode; style?: CSSProperties; delay?: number; from?: string }) {
  const instant = useInstant()
  return (
    <div
      style={{
        opacity: on ? 1 : 0,
        transform: on ? 'none' : from,
        transition: instant ? 'none' : `opacity 520ms ${EASE} ${on ? delay : 0}ms, transform 520ms ${EASE} ${on ? delay : 0}ms`,
        pointerEvents: on ? undefined : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

const Frame = ({ w, h, children }: { w: number; h: number; children: ReactNode }) => (
  <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
    <div style={{ position: 'relative', width: w, height: h }}>{children}</div>
  </div>
)

const tagStyle = (color: string = colors.ink, size = 14): CSSProperties => ({ fontFamily: font, fontWeight: 600, fontSize: size, lineHeight: 1.15, color, whiteSpace: 'nowrap', textAlign: 'center' })

/** a lucide glyph on a soft white tile, the loop on the glyph only */
function GlyphTile({ icon, size = 44, tone = colors.brand, loop, d = 0, t, lit = false, bg }: { icon: string; size?: number; tone?: string; loop?: string; d?: number; t?: number; lit?: boolean; bg?: string }) {
  const instant = useInstant()
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: Math.round(size * 0.27), ...TILE_SKIN, ...(bg ? { background: bg } : {}), boxShadow: litRing(lit, TILE_SKIN.boxShadow as string), transition: instant ? 'none' : `box-shadow 420ms ${EASE}`, color: tone, flexShrink: 0 }}>
      <span className={loop ? lc(loop) : undefined} style={{ display: 'grid', placeItems: 'center', ...lv(d, t) }}>
        <Icon name={icon} size={Math.round(size * 0.5)} />
      </span>
    </span>
  )
}

/** an official AWS mark on a still white tile (rule 54); a soft halo behind breathes so the tile is not frozen */
function MarkTile({ src: s, size = 48, lit = false, d = 0 }: { src: string; size?: number; lit?: boolean; d?: number }) {
  const instant = useInstant()
  const r = Math.round(size * 0.26)
  return (
    <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: size, height: size, flexShrink: 0 }}>
      <span aria-hidden className={lc('halo')} style={{ position: 'absolute', inset: -5, borderRadius: r + 5, background: `radial-gradient(closest-side, ${colors.brand}2e, ${colors.brand}00)`, ...lv(d, 3.6) }} />
      <span style={{ position: 'absolute', inset: 0, borderRadius: r, background: '#FFFFFF', boxShadow: litRing(lit, `inset 0 0 0 1.5px ${colors.brand}2e, 0 8px 18px -12px rgba(31,64,140,0.45)`), transition: instant ? 'none' : `box-shadow 420ms ${EASE}`, display: 'grid', placeItems: 'center' }}>
        <img src={s} alt="" aria-hidden draggable={false} style={{ display: 'block', width: Math.round(size * 0.66), height: Math.round(size * 0.66), objectFit: 'contain' }} />
      </span>
    </span>
  )
}

/** either kind of icon by its deck name: an official mark (`img:`) on its white tile, a lucide glyph on a glyph tile */
function AnyTile({ icon, size = 40, lit = false, loop = 'bob', d = 0, tone }: { icon: string; size?: number; lit?: boolean; loop?: string; d?: number; tone?: string }) {
  if (icon.startsWith('img:')) return <MarkTile src={src(icon)} size={size} lit={lit} d={d} />
  const n = ROW3D[icon]
  if (n) return <T3 name={n[0]} size={size} lit={lit} loop={n[1]} d={d} flip={icon === 'Split'} />
  return <GlyphTile icon={icon} size={size} lit={lit} loop={loop} d={d} t={2.6} tone={tone} />
}

/* ------------------------------------------------------------------ 3D pieces (correction round 2026-11-16) */

/** the lucide names the TR rows use, drawn as 3D icons (Split = the merge drawing mirrored: one in, two out) */
const ROW3D: Record<string, [Ico3DName, Loop3D]> = {
  Crown: ['crown', 'glint'], User: ['user', 'bob'], Users: ['users', 'bob'], OctagonX: ['cross', 'pulse'],
  ListOrdered: ['list', 'bob'], Ban: ['ban', 'pulse'], Split: ['merge', 'bob'],
}

const T3_RIM = 'inset 0 0 0 1.5px #D3DEF6, 0 10px 20px -12px rgba(31,64,140,0.5)'
/** a 3D icon on a soft white plinth tile, ringed blue while lit */
function T3({ name, size = 48, k = 0.76, lit = false, loop = 'bob', d = 0, t, badge, flip = false }: { name: Ico3DName; size?: number; k?: number; lit?: boolean; loop?: Loop3D; d?: number; t?: number; badge?: 'check' | 'cross' | 'plus' | 'minus'; flip?: boolean }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: size, height: size, flexShrink: 0, borderRadius: Math.round(size * 0.28), background: 'linear-gradient(180deg, #FFFFFF 0%, #EEF3FF 100%)', boxShadow: litRing(lit, T3_RIM), transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
      <span style={{ display: 'grid', placeItems: 'center', transform: flip ? 'scaleX(-1)' : undefined }}>
        <Ico3D name={name} size={Math.round(size * k)} loop={loop} d={d} t={t} badge={badge} />
      </span>
    </span>
  )
}

/**
 * AN ORTHOGONAL CONNECTOR (user 2026-11-16, G5): every segment horizontal or vertical, corners rounded, starting on
 * the source edge and ending with the arrowhead's tip exactly on the target edge. Points come from the same
 * constants as the boxes they join.
 */
function Elbow({ pts, on = true, color = '#9FB3D6', width = 2.5, head = true, dashed = false, r = 9 }: { pts: [number, number][]; on?: boolean; color?: string; width?: number; head?: boolean; dashed?: boolean; r?: number }) {
  const instant = useInstant()
  const n = pts.length - 1
  const dir = (a: [number, number], b: [number, number]) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / L, (b[1] - a[1]) / L, L] }
  const HL = 10
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < n; i++) {
    const [ix, iy, il] = dir(pts[i - 1], pts[i])
    const [ox, oy, ol] = dir(pts[i], pts[i + 1])
    const rr = Math.min(r, il / 2, ol / 2)
    d += ` L ${pts[i][0] - ix * rr} ${pts[i][1] - iy * rr} Q ${pts[i][0]} ${pts[i][1]} ${pts[i][0] + ox * rr} ${pts[i][1] + oy * rr}`
  }
  const [lx, ly] = dir(pts[n - 1], pts[n])
  const [ex, ey] = pts[n]
  d += ` L ${head ? ex - lx * (HL - 1) : ex} ${head ? ey - ly * (HL - 1) : ey}`
  const p1 = [ex - lx * HL - ly * 5.5, ey - ly * HL + lx * 5.5]
  const p2 = [ex - lx * HL + ly * 5.5, ey - ly * HL - lx * 5.5]
  return (
    <g style={{ opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 520ms ${EASE}` }}>
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dashed ? '6 6' : undefined} />
      {head && <path d={`M ${ex} ${ey} L ${p1[0]} ${p1[1]} L ${p2[0]} ${p2[1]} Z`} fill={color} />}
    </g>
  )
}

/** THE GATE: two pillars with the check's icon between them, centred on (x, y); a lane joins a pillar's OUTER edge
 *  at x ± GATE_HALF, so an arrow ends on the pillar and never crosses it. Its one-word tag sits under the pillars. */
const GATE_HALF = 34
const GATE_BAR_H = 84
function Gate3({ x, y, name, tag, lit = false, d = 0, z = 3 }: { x: number; y: number; name: Ico3DName; tag: string; lit?: boolean; d?: number; z?: number }) {
  const bar: CSSProperties = { position: 'absolute', top: 0, width: 9, height: GATE_BAR_H, borderRadius: 5, background: 'linear-gradient(90deg, #6F92D8 0%, #2D4E8F 60%, #1E3A73 100%)', boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.45), 0 6px 10px -6px rgba(16,32,58,0.6)' }
  return (
    <div style={{ position: 'absolute', left: x - 70, top: y - GATE_BAR_H / 2, width: 140, height: GATE_BAR_H + 26, zIndex: z }}>
      <span style={{ ...bar, left: 70 - GATE_HALF }} />
      <span style={{ ...bar, left: 70 + GATE_HALF - 9 }} />
      <span style={{ position: 'absolute', left: 70 - 21, top: GATE_BAR_H / 2 - 21 }}>
        <T3 name={name} size={42} lit={lit} loop="pulse" d={d} t={2.6} />
      </span>
      <span style={{ position: 'absolute', left: 0, right: 0, top: GATE_BAR_H + 8, ...tagStyle(colors.ink, 13) }}>{tag}</span>
    </div>
  )
}

/**
 * THE SEQUENTIAL HIGHLIGHT (cloud R13): once the build is complete an orange ring walks the items, the last one
 * (just pressed) first, then first → last → first, WALK s each, forever; never on a held frame. One element per item,
 * its opacity animated by CSS (composited), placed exactly over the item's box.
 */
function SeqRing({ i, n, on, radius = 14, inset = -4 }: { i: number; n: number; on: boolean; radius?: number; inset?: number }) {
  if (!on) return null
  const order = (i + 1) % n // the last item leads
  return (
    <span
      aria-hidden
      className={lc(`seq${n}`)}
      style={{ position: 'absolute', inset, borderRadius: radius, pointerEvents: 'none', boxShadow: `0 0 0 3px ${colors.accent}, 0 10px 22px -12px ${colors.accent}`, ...lv(-order * WALK, n * WALK, { ['--a13-n' as string]: n }) }}
    />
  )
}

/** a straight arrow from (x1, y1) to (x2, y2), its head on the target */
function Arrow({ x1, y1, x2, y2, on = true, color = '#9FB3D6', width = 2.5, head = true, dashed = false }: { x1: number; y1: number; x2: number; y2: number; on?: boolean; color?: string; width?: number; head?: boolean; dashed?: boolean }) {
  const instant = useInstant()
  const a = Math.atan2(y2 - y1, x2 - x1)
  const hl = 10
  const ex = head ? x2 - Math.cos(a) * (hl - 1) : x2
  const ey = head ? y2 - Math.sin(a) * (hl - 1) : y2
  const p1 = [x2 - Math.cos(a) * hl - Math.sin(a) * 5.5, y2 - Math.sin(a) * hl + Math.cos(a) * 5.5]
  const p2 = [x2 - Math.cos(a) * hl + Math.sin(a) * 5.5, y2 - Math.sin(a) * hl - Math.cos(a) * 5.5]
  return (
    <g style={{ opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 520ms ${EASE}` }}>
      <line x1={x1} y1={y1} x2={ex} y2={ey} stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={dashed ? '6 6' : undefined} />
      {head && <path d={`M ${x2} ${y2} L ${p1[0]} ${p1[1]} L ${p2[0]} ${p2[1]} Z`} fill={color} />}
    </g>
  )
}

/** a flow dot riding a fixed path (keyframes named in `css`), composited; only after the build, never held */
const Dot = ({ kf, on, d = 0, t = 3.2, color = colors.brand }: { kf: string; on: boolean; d?: number; t?: number; color?: string }) =>
  on ? <span aria-hidden className={lc(kf)} style={{ position: 'absolute', left: -6, top: -6, width: 12, height: 12, borderRadius: 99, background: color, boxShadow: `0 0 0 3px #FFFFFF, 0 4px 10px -2px ${color}`, ...lv(d, t) }} /> : null

/** one TR bullet as a card row: icon + the exact words; lit while its press is current, then walked (R13) */
function TrRow({ i, n, text, icon, on, lit, walk, h, top, w }: { i: number; n: number; text: string; icon: string; on: boolean; lit: boolean; walk: boolean; h: number; top: number; w: number }) {
  const instant = useInstant()
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top,
        width: w,
        height: h,
        borderRadius: 14,
        background: '#FFFFFF',
        boxShadow: litRing(lit, `inset 0 0 0 1px ${colors.line}, 0 8px 18px -14px rgba(31,64,140,0.5)`),
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '0 16px 0 12px',
        opacity: on ? 1 : 0,
        transform: on ? 'none' : 'translateX(14px)',
        transition: instant ? 'none' : `opacity 480ms ${EASE}, transform 480ms ${EASE}, box-shadow 420ms ${EASE}`,
      }}
    >
      <AnyTile icon={icon} size={40} loop={['bob', 'pulse', 'turn', 'bob'][i % 4]} d={i * 0.45} />
      <span style={{ fontFamily: font, fontSize: 16, fontWeight: 500, lineHeight: 1.28, color: colors.ink }}>{text}</span>
      <SeqRing i={i} n={n} on={walk} radius={16} />
    </div>
  )
}

/** the rows column of a lead-layout figure */
function TrRows({ rows, step, held, x, w, H, y = 0 }: { rows: [string, string][]; step: number; held: boolean; x: number; w: number; H: number; y?: number }) {
  const n = rows.length
  const gap = 12
  const h = Math.floor((H - gap * (n - 1)) / n)
  const walk = step >= n && !held
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: H }}>
      {rows.map(([text, icon], i) => (
        <TrRow key={i} i={i} n={n} text={text} icon={icon} on={step >= i + 1 || held} lit={step === i + 1 && !held && !walk} walk={walk} h={h} top={i * (h + gap)} w={w} />
      ))}
    </div>
  )
}


/* ================================================================== A_T01 · identity tree + four TR rows (1080 x 330, the stage) */

/* every box sits P inside its parent on all four sides (G1, 2026-11-16) */
const T01 = { W: 1080, H: 330, P: 20, PW: 500, IN: 18, GY: 140, GW: 214, BUS: 116, RS: 54 }
const T01_GX = [T01.IN, T01.PW - T01.IN - T01.GW]
const T01_GC = T01_GX.map((x) => x + T01.GW / 2)
const T01_ROOT = T01.PW / 2

function A_T01({ step, rows }: { step: number; rows: [string, string][] }) {
  const held = useHeld()
  const instant = useInstant()
  const { W, H, P, PW, GY, GW, BUS, RS } = T01
  const PH = H - 2 * P
  const GH = PH - T01.IN - GY
  const lit = (i: number) => step === i + 1 && !held && step < 4
  const on = (i: number) => step >= i + 1 || held
  const walk = step >= 4 && !held
  const groups = ['Developers', 'Group']
  return (
    <Frame w={W} h={H}>
      {/* the tree panel, headed by IAM: the service that manages all three layers */}
      <div style={{ position: 'absolute', left: P, top: P, width: PW, height: PH, borderRadius: 18, background: 'linear-gradient(180deg, #F6F9FF 0%, #EAF1FF 100%)', boxShadow: litRing(lit(0), `inset 0 0 0 1.5px ${colors.line}`), transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
        <div style={{ position: 'absolute', left: 16, top: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <MarkTile src={iamMark} size={40} lit={lit(0)} />
          <span style={{ ...tagStyle(colors.ink, 15), textAlign: 'left' }}>IAM</span>
          <Ico3D name="shield" size={24} loop="pulse" t={2.8} />
        </div>
        <SeqRing i={0} n={4} on={walk} radius={20} />
        {/* root → the two groups: down, across, down, ending on each group's top edge */}
        <svg aria-hidden width={PW} height={PH} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {T01_GC.map((gx, gi) => (
            <Elbow key={gi} pts={[[T01_ROOT, 16 + RS + 26], [T01_ROOT, BUS], [gx, BUS], [gx, GY]]} on={on(3)} />
          ))}
        </svg>
        <Dot kf="t01a" on={walk} t={4.4} />
        <Dot kf="t01b" on={walk} d={2.2} t={4.4} />
        {/* root at the top */}
        <Show on={on(1)} style={{ position: 'absolute', left: T01_ROOT - 60, top: 16, width: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span style={{ position: 'relative' }}>
            <T3 name="crown" size={RS} lit={lit(1)} loop="glint" t={3.4} />
            <SeqRing i={1} n={4} on={walk} radius={16} />
          </span>
          <span style={tagStyle(colors.ink, 14)}>Root</span>
        </Show>
        {/* groups holding the users; each group carries its one shared permission set */}
        {groups.map((tag, gi) => (
          <Show key={tag} on={on(3)} style={{ position: 'absolute', left: T01_GX[gi], top: GY, width: GW, height: GH, borderRadius: 16, background: '#FFFFFF', boxShadow: litRing(lit(3), `inset 0 0 0 1.5px #B7CBFA, 0 10px 20px -16px rgba(31,64,140,0.5)`) }}>
            <span style={{ position: 'absolute', left: 14, top: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
              <Ico3D name="users" size={24} loop="bob" d={gi * 0.6} />
              <span style={{ ...tagStyle(colors.brandDark, 13), textAlign: 'left' }}>{tag}</span>
            </span>
            <span style={{ position: 'absolute', right: 14, top: 10 }}>
              <Ico3D name="policy" size={26} loop="tilt" d={gi * 0.8} t={3.2} />
            </span>
            <SeqRing i={3} n={4} on={walk} radius={18} />
          </Show>
        ))}
        {T01_GX.flatMap((gx) => [gx + GW * 0.28, gx + GW * 0.72]).map((ux, k) => (
          <Show key={k} on={on(2)} delay={k * 90} style={{ position: 'absolute', left: ux - 34, top: GY + 46, width: 68, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <span style={{ position: 'relative' }}>
              <T3 name="user" size={46} lit={lit(2)} d={k * 0.6} loop="bob" />
              <SeqRing i={2} n={4} on={walk} radius={13} />
            </span>
            <span style={tagStyle(colors.ink, 13)}>User</span>
          </Show>
        ))}
      </div>
      <TrRows rows={rows} step={step} held={held} x={P + PW + 24} w={W - P - (P + PW + 24)} H={PH} y={P} />
    </Frame>
  )
}

/* ================================================================== A_T02 · the root account as a locked vault (496 x 330, the stage) */

const T02 = { W: 496, H: 330, VX: 206, VY: 86, VW: 112, VH: 196, CX: 18, CY: 26, CW: 160, CH: 98, TX: 440 }
const T02_VC = T02.VX + T02.VW / 2
/* the vault's three drawers */
const T02_DR = (() => {
  const pad = 10
  const gap = 8
  const h = (T02.VH - 2 * pad - 2 * gap) / 3
  return [0, 1, 2].map((k) => ({ y: T02.VY + pad + k * (h + gap), h }))
})()
const T02_LOCK = { x: T02_VC - 20, y: T02_DR[1].y + T02_DR[1].h / 2 } // the lock's centre on the middle drawer
const T02_SLOT = { x: T02_VC + 24, y: T02_LOCK.y } // where the stored key rests, beside the lock
const T02_TASK_Y = [T02.VY + 20, T02.VY + T02.VH / 2, T02.VY + T02.VH - 20] // task tiles' centres
const T02_SIGN: [number, number][] = [[T02.CX + T02.CW, T02.CY + T02.CH / 2], [192, T02.CY + T02.CH / 2], [192, T02_DR[0].y + T02_DR[0].h / 2], [T02.VX, T02_DR[0].y + T02_DR[0].h / 2]]

function Vault() {
  return (
    <div style={{ position: 'absolute', left: T02.VX, top: T02.VY, width: T02.VW, height: T02.VH, borderRadius: 16, background: 'linear-gradient(160deg, #5A79B4 0%, #2B4473 55%, #1D3159 100%)', boxShadow: '0 7px 0 #142443, 0 22px 30px -14px rgba(16,32,58,0.65), inset 0 1.5px 0 rgba(255,255,255,0.3)' }}>
      {T02_DR.map((dr, k) => (
        <div key={k} style={{ position: 'absolute', left: 10, right: 10, top: dr.y - T02.VY, height: dr.h, borderRadius: 9, background: 'linear-gradient(180deg, #7C9AD2 0%, #4E6CA3 100%)', boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.4), inset 0 -3px 0 rgba(16,32,58,0.25)', display: 'grid', placeItems: 'center' }}>
          {k === 0 && <Ico3D name="crown" size={34} loop="glint" t={3.6} />}
          {k === 2 && <span style={{ width: 38, height: 7, borderRadius: 4, background: 'linear-gradient(180deg, #F5F7FB, #95A2B8)', boxShadow: '0 2px 0 rgba(16,32,58,0.35)' }} />}
        </div>
      ))}
      <span style={{ position: 'absolute', left: T02_LOCK.x - T02.VX - 15, top: T02_LOCK.y - T02.VY - 15 }}>
        <Ico3D name="lock" size={30} loop="pulse" t={2.6} />
      </span>
    </div>
  )
}

function A_T02({ step }: { step: number }) {
  const held = useHeld()
  const instant = useInstant()
  const { W, H, VX, VW, VY, VH, CX, CY, CW, CH, TX } = T02
  const lit = (i: number) => step === i && !held && step < 3
  const on = (i: number) => step >= i || held
  const walk = step >= 3 && !held
  const stored = step >= 3 || held // the key goes into the vault with its MFA token
  const KS = 54 // the key tile, before it is stored
  const KX = CX + CW / 2
  const KY = 214
  return (
    <Frame w={W} h={H}>
      <svg aria-hidden width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {/* the email sign-in opens the root account */}
        <Elbow pts={T02_SIGN} on={on(1)} />
        {/* the root-only tasks, out of the vault */}
        {T02_TASK_Y.map((y, k) => (
          <Elbow key={k} pts={[[VX + VW, y], [TX - 20, y]]} on={on(2)} color="#B9C6DE" width={2} dashed />
        ))}
        {/* MFA guards the root sign-in */}
        <Elbow pts={[[T02_VC, 75], [T02_VC, VY]]} on={on(3)} color="#B9C6DE" width={2} />
      </svg>
      <Dot kf="t02" on={walk} t={3.6} />

      {/* 1 · the sign-in card: an email, no username */}
      <Show on={on(1)} from="translateX(-12px)" style={{ position: 'absolute', left: CX, top: CY, width: CW }}>
        <div style={{ position: 'relative', height: CH, boxSizing: 'border-box', borderRadius: 14, background: '#FFFFFF', boxShadow: litRing(lit(1), `inset 0 0 0 1px ${colors.line}, 0 10px 20px -16px rgba(31,64,140,0.5)`), transition: instant ? 'none' : `box-shadow 420ms ${EASE}`, padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Ico3D name="mail" size={30} loop="bob" t={2.4} />
            <span style={{ flex: 1, height: 10, borderRadius: 5, background: '#DCE6FA' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Ico3D name="password" size={30} loop="pulse" d={0.5} t={2.4} />
            <span style={{ flex: 1, display: 'flex', gap: 5 }}>
              {[0, 1, 2, 3, 4].map((k) => <span key={k} style={{ width: 7, height: 7, borderRadius: 4, background: colors.ink, opacity: 0.75 }} />)}
            </span>
          </div>
          <SeqRing i={0} n={3} on={walk} radius={18} />
        </div>
        <div style={{ ...tagStyle(colors.ink, 14), marginTop: 6 }}>Email</div>
      </Show>

      {/* the locked vault: the whole account */}
      <Vault />
      <span style={{ position: 'absolute', left: VX - 30, top: VY + VH + 14, width: VW + 60, ...tagStyle(colors.ink, 15) }}>Root Account</span>

      {/* the master key: in the left column, then in the vault beside its lock */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          zIndex: 4,
          transform: stored ? `translate(${T02_SLOT.x - 16}px, ${T02_SLOT.y - 16}px) scale(${32 / KS})` : `translate(${KX - KS / 2}px, ${KY}px)`,
          transformOrigin: '0 0',
          transition: instant ? 'none' : `transform 900ms ${EASE}`,
        }}
      >
        <T3 name="key" size={KS} loop="glint" t={3.2} />
      </div>
      <Show on={!stored} style={{ position: 'absolute', left: KX - 60, top: KY + KS + 6, width: 120, ...tagStyle(colors.ink, 14) }}>
        Master Key
      </Show>

      {/* 3 · the MFA device guards the sign-in */}
      <Show on={on(3)} from="translateY(-10px)" style={{ position: 'absolute', left: T02_VC - 60, top: 8, width: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <span style={{ position: 'relative' }}>
          <T3 name="phone" size={40} lit={lit(3)} loop="beat" t={2.4} />
          <SeqRing i={2} n={3} on={walk} radius={14} />
        </span>
        <span style={tagStyle(colors.ink, 13)}>MFA</span>
      </Show>

      {/* 2 · the root-only tasks beside the vault */}
      {[
        { name: 'door' as const, tag: 'Closure', loop: 'tilt' as const },
        { name: 'key' as const, tag: 'Credentials', loop: 'glint' as const },
        { name: 'receipt' as const, tag: 'Billing', loop: 'bob' as const },
      ].map((r, k) => (
        <Show key={r.tag} on={on(2)} delay={k * 110} from="translateX(10px)" style={{ position: 'absolute', left: TX - 50, top: T02_TASK_Y[k] - 20, width: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span style={{ position: 'relative' }}>
            <T3 name={r.name} size={40} loop={r.loop} d={k * 0.5} t={2.8} lit={lit(2)} />
            <SeqRing i={1} n={3} on={walk} radius={13} />
          </span>
          <span style={tagStyle(colors.ink, 13)}>{r.tag}</span>
        </Show>
      ))}
    </Frame>
  )
}

/* ================================================================== A_T03 · one Developers group (634 x 330, the stage) */

const T03 = { W: 634, H: 330, BX: 100, BY: 66, BW: 434, BH: 226, MY: 196, US: 52, PY: 80, BUS: 168 }
const T03_PX = T03.BX + T03.BW / 2 // the permission sheet's centre
const T03_SLOT = [0, 1, 2, 3].map((k) => T03.BX + 20 + 49 + k * 98.5)
const T03_OUT = [50, 584] // outside the group, left (leaver) and right (joiner)
const T03_LINK = (x: number): [number, number][] => [[T03_PX, T03.PY + 44 + 22], [T03_PX, T03.BUS], [x, T03.BUS], [x, T03.MY]]

/** the message state. Built: shown while its press is current. After the build it follows the walking highlight
 *  (Granted while the joiner is ringed, Revoked while the leaver is), one composited opacity loop on a wrapper. */
function StatePill({ on, ok, walkI }: { on: boolean; ok: boolean; walkI?: number }) {
  const instant = useInstant()
  return (
    <div className={walkI !== undefined ? lc('seq3') : undefined} style={{ position: 'absolute', left: T03_PX - 70, top: 18, width: 140, height: 36, ...(walkI !== undefined ? lv(-((walkI + 1) % 3) * WALK, 3 * WALK) : {}) }}>
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(-6px) scale(0.96)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 420ms ${EASE}` }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 16px 0 8px', borderRadius: 18, background: '#FFFFFF', boxShadow: `inset 0 0 0 1.5px ${ok ? '#9FE3BD' : '#FFC9A0'}, 0 10px 18px -12px rgba(31,64,140,0.5)` }}>
        <Ico3D name={ok ? 'check' : 'minus'} size={24} loop="beat" t={2.4} />
        <span style={{ ...tagStyle(ok ? '#128A4E' : colors.accentDark, 15) }}>{ok ? 'Granted' : 'Revoked'}</span>
      </span>
    </div>
    </div>
  )
}

function A_T03({ step }: { step: number }) {
  const held = useHeld()
  const instant = useInstant()
  const { W, H, BX, BY, BW, BH, MY, US, PY } = T03
  const lit = (i: number) => step === i && !held && step < 3
  const walk = step >= 3 && !held
  /* user 0 leaves at step 3; users 1-2 stay; user 3 enters at step 2 */
  const in3 = step >= 2 || held
  const out0 = step >= 3 || held
  const perm = step >= 1 || held
  const users = [
    { x: out0 ? T03_OUT[0] : T03_SLOT[0], inside: !out0, name: (out0 ? 'user-minus' : 'user') as Ico3DName },
    { x: T03_SLOT[1], inside: true, name: 'user' as Ico3DName },
    { x: T03_SLOT[2], inside: true, name: 'user' as Ico3DName },
    { x: in3 ? T03_SLOT[3] : T03_OUT[1], inside: in3, name: 'user-plus' as Ico3DName },
  ]
  const litUser = (k: number) => (step === 1 && k < 3) || (step === 2 && k === 3) || (step === 3 && k === 0)
  return (
    <Frame w={W} h={H}>
      {/* the message state: what the last change did to that user's access */}
      {walk ? (
        <>
          <StatePill on ok walkI={1} />
          <StatePill on ok={false} walkI={2} />
        </>
      ) : (
        <>
          <StatePill on={step === 2 && !held} ok />
          <StatePill on={step >= 3 || held} ok={false} />
        </>
      )}
      {/* the group box */}
      <div style={{ position: 'absolute', left: BX, top: BY, width: BW, height: BH, borderRadius: 20, background: 'linear-gradient(180deg, #F3F7FF 0%, #E4EDFF 100%)', boxShadow: `inset 0 0 0 1.5px #B7CBFA, 0 14px 26px -20px rgba(31,64,140,0.5)` }}>
        <div style={{ position: 'absolute', left: 16, top: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Ico3D name="users" size={28} loop="bob" t={2.8} />
          <span style={{ ...tagStyle(colors.brandDark, 15), textAlign: 'left' }}>Developers</span>
        </div>
      </div>
      {/* the place the leaver held stays visible, empty */}
      <div aria-hidden style={{ position: 'absolute', left: T03_SLOT[0] - US / 2, top: MY, width: US, height: US, borderRadius: Math.round(US * 0.28), boxShadow: 'inset 0 0 0 2px #B7CBFA', background: 'repeating-linear-gradient(135deg, #FFFFFF00 0 6px, #DCE6FA88 6px 9px)', opacity: out0 ? 1 : 0, transition: instant ? 'none' : `opacity 600ms ${EASE} 300ms` }} />
      {/* the shared permission set, linked to every member and only to members */}
      <svg aria-hidden width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {users.map((u, k) => (
          <Elbow key={k} pts={T03_LINK(T03_SLOT[k])} on={perm && u.inside} color={litUser(k) && !held ? colors.brand : '#9FB3D6'} />
        ))}
      </svg>
      <Dot kf="t03a" on={walk} t={3.6} />
      <Dot kf="t03b" on={walk} d={1.8} t={3.6} />
      <div style={{ position: 'absolute', left: T03_PX - 60, top: PY, width: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <span style={{ position: 'relative' }}>
          <T3 name="policy" size={44} lit={lit(1)} loop="tilt" t={3.2} />
          <SeqRing i={0} n={3} on={walk} radius={15} />
        </span>
        <span style={tagStyle(colors.ink, 13)}>Permissions</span>
      </div>
      {users.map((u, k) => (
        <div
          key={k}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            zIndex: 3,
            transform: `translate(${u.x - 40}px, ${MY}px)`,
            width: 80,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            transition: instant ? 'none' : `transform 900ms ${EASE}`,
          }}
        >
          <span style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
            {/* the group's permission glows on every member, and only on members */}
            <span aria-hidden className={perm && u.inside ? lc('halo') : undefined} style={{ position: 'absolute', inset: -9, borderRadius: 20, background: `radial-gradient(closest-side, ${colors.brand}55, ${colors.brand}00)`, opacity: perm && u.inside ? 1 : 0, transition: instant ? 'none' : `opacity 520ms ${EASE}`, ...lv(k * 0.4, 3) }} />
            <span style={{ display: 'grid', opacity: u.inside ? 1 : 0.6, filter: u.inside ? 'none' : 'grayscale(0.85)', transition: instant ? 'none' : `opacity 600ms ${EASE}, filter 600ms ${EASE}` }}>
              <T3 name={u.name} size={US} lit={litUser(k) && !held && !walk} d={k * 0.5} loop="bob" />
            </span>
            {k === 0 && <SeqRing i={2} n={3} on={walk} radius={16} />}
            {k === 3 && <SeqRing i={1} n={3} on={walk} radius={16} />}
          </span>
          <span style={tagStyle(colors.ink, 13)}>User</span>
        </div>
      ))}
    </Frame>
  )
}

/* ================================================================== A_T04B · the IAM console, drawn (980 x 420) */

const NAV: { t: string; head?: boolean; sub?: boolean; ring?: boolean; on?: boolean }[] = [
  { t: 'Dashboard' },
  { t: 'Access management', head: true },
  { t: 'User groups', sub: true, ring: true },
  { t: 'Users', sub: true, ring: true, on: true },
  { t: 'Roles', sub: true },
  { t: 'Policies', sub: true },
  { t: 'Identity providers', sub: true },
  { t: 'Account settings', sub: true },
  { t: 'Access reports', head: true },
  { t: 'Resource analysis', sub: true },
  { t: 'Credential report', sub: true },
]

function A_T04B({ step }: { step: number }) {
  const held = useHeld()
  const instant = useInstant()
  const W = 980
  const H = 420
  const ringOn = step >= 1 || held
  const NX = 0
  const NW = 236
  const IY = 104 // first nav item's top
  const IH = 27
  const grey = (w: number | string, h = 9, c = '#DCE3EE') => <span style={{ display: 'block', width: w, height: h, borderRadius: 5, background: c }} />
  return (
    <Frame w={W} h={H}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 14, overflow: 'hidden', background: '#FFFFFF', boxShadow: '0 22px 40px -26px rgba(16,32,58,0.55), inset 0 0 0 1px #D5DEEC' }}>
        {/* the console's top bar */}
        <div style={{ height: 44, background: '#232F3E', display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px' }}>
          <span style={{ display: 'grid', placeItems: 'center', height: 26, padding: '0 6px', borderRadius: 4, background: '#FFFFFF' }}>
            <img src={awsWord} alt="" aria-hidden draggable={false} style={{ display: 'block', height: 18, width: 'auto' }} />
          </span>
          <span style={{ color: '#D5DBDB' }}><Icon name="Grid3x3" size={16} /></span>
          <span style={{ flex: '0 0 360px', height: 26, borderRadius: 6, background: '#3B4A5D', display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', color: '#AEB8C4' }}>
            <Icon name="Search" size={14} />
            {grey(120, 7, '#56677C')}
          </span>
          <span style={{ flex: 1 }} />
          {['Bell', 'CircleHelp', 'Settings'].map((n) => (
            <span key={n} style={{ color: '#D5DBDB', display: 'grid' }}><Icon name={n} size={16} /></span>
          ))}
          {/* the account name dropdown (blurred, rule 53): root settings live here, not in IAM */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#D5DBDB' }}>
            <span style={{ width: 70, height: 9, borderRadius: 5, background: '#8C99A8', filter: 'blur(2.5px)' }} />
            <Icon name="ChevronDown" size={14} />
          </span>
        </div>
        {/* the left navigation */}
        <div style={{ position: 'absolute', left: NX, top: 44, bottom: 0, width: NW, background: '#FAFBFC', boxShadow: 'inset -1px 0 0 #E3E8EF' }}>
          <div style={{ padding: '16px 18px 0', fontFamily: font, fontSize: 15, fontWeight: 700, color: '#16191F', lineHeight: 1.25 }}>Identity and Access Management (IAM)</div>
        </div>
        {NAV.map((it, k) => (
          <div key={it.t} style={{ position: 'absolute', left: it.sub ? 34 : 18, top: IY + k * IH, height: IH, display: 'flex', alignItems: 'center', gap: 6, fontFamily: font, fontSize: it.head ? 14 : 14, fontWeight: it.head || it.on ? 700 : 500, color: it.on ? '#0972D3' : '#16191F' }}>
            {it.head && <Icon name="ChevronDown" size={13} />}
            {it.t}
          </div>
        ))}
        {/* the Users page */}
        <div style={{ position: 'absolute', left: NW + 26, top: 64, right: 26, bottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: font, fontSize: 13, color: '#5F6B7A' }}>
            IAM <Icon name="ChevronRight" size={12} /> <span style={{ color: '#0972D3', fontWeight: 600 }}>Users</span>
          </div>
          <div style={{ marginTop: 14, borderRadius: 12, boxShadow: 'inset 0 0 0 1px #E3E8EF', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: font, fontSize: 18, fontWeight: 700, color: '#16191F' }}>Users</span>
              <span style={{ flex: 1 }} />
              <span style={{ height: 28, padding: '0 14px', borderRadius: 14, boxShadow: 'inset 0 0 0 1.5px #5F6B7A', display: 'grid', placeItems: 'center', fontFamily: font, fontSize: 13, fontWeight: 700, color: '#5F6B7A' }}>Delete</span>
              <span style={{ height: 28, padding: '0 14px', borderRadius: 14, background: '#FF9900', display: 'grid', placeItems: 'center', fontFamily: font, fontSize: 13, fontWeight: 700, color: '#16191F' }}>Create user</span>
            </div>
            <div style={{ marginTop: 12, height: 28, borderRadius: 6, boxShadow: 'inset 0 0 0 1px #C6CED9', display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', color: '#8D99A8' }}>
              <Icon name="Search" size={14} />
              {grey(140, 7)}
            </div>
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '24px 1.3fr 1fr 1fr 0.8fr', columnGap: 14, rowGap: 0, alignItems: 'center', fontFamily: font, fontSize: 13, fontWeight: 700, color: '#16191F' }}>
              <span />
              <span>User name</span>
              <span>Groups</span>
              <span>Last activity</span>
              <span>MFA</span>
            </div>
            {[0, 1, 2, 3, 4].map((r) => (
              <div key={r} style={{ marginTop: 10, paddingTop: 10, boxShadow: 'inset 0 1px 0 #E9EDF2', display: 'grid', gridTemplateColumns: '24px 1.3fr 1fr 1fr 0.8fr', columnGap: 14, alignItems: 'center' }}>
                <span style={{ width: 14, height: 14, borderRadius: 3, boxShadow: 'inset 0 0 0 1.5px #8D99A8' }} />
                {/* identifiers blurred (rule 53): a drawn screen carries no names */}
                <span style={{ display: 'block', width: `${62 - r * 6}%`, height: 9, borderRadius: 5, background: '#7FA8DD', filter: 'blur(2px)' }} />
                {grey(`${50 + (r % 3) * 10}%`)}
                {grey(`${40 + (r % 2) * 18}%`)}
                {grey(`${30 + (r % 3) * 12}%`)}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* the TR's highlight: Users and Groups in the left-hand menu, orange, on their lines only */}
      {NAV.map((it, k) =>
        it.ring ? (
          <span
            key={it.t}
            aria-hidden
            style={{
              position: 'absolute',
              left: 26,
              top: IY + k * IH + 2,
              width: it.t === 'Users' ? 70 : 112,
              height: IH - 4,
              borderRadius: 8,
              boxShadow: `0 0 0 2.5px ${colors.accent}`,
              opacity: ringOn ? 1 : 0,
              transform: ringOn ? 'scale(1)' : 'scale(1.08)',
              transition: instant ? 'none' : `opacity ${MOTION.ring}ms ${EASE}, transform ${MOTION.ring}ms ${EASE}`,
            }}
          >
            <span aria-hidden className={ringOn && !held ? lc('ringglow') : undefined} style={{ position: 'absolute', inset: 0, borderRadius: 8, boxShadow: `0 0 10px 1px ${colors.accent}88`, opacity: 0, ...lv(k * 0.3, 2.8) }} />
          </span>
        ) : null,
      )}
    </Frame>
  )
}

/* ================================================================== A_T05 · credential → two gates → allowed / denied (496 x 330, the stage) */

const T05 = { W: 496, H: 330, LY: 146, CL: 16, CW: 84, CT: 38, CH: 216, G1: 154, G2: 266, JX: 322, EX: 374, ES: 40, AY: 92, DY: 202, RX: 448, RS: 44 }
const T05_A: [number, number][] = [[T05.G2 + GATE_HALF, T05.LY], [T05.JX, T05.LY], [T05.JX, T05.AY], [T05.EX - T05.ES / 2, T05.AY]]
const T05_D: [number, number][] = [[T05.G2 + GATE_HALF, T05.LY], [T05.JX, T05.LY], [T05.JX, T05.DY], [T05.EX - T05.ES / 2, T05.DY]]

function A_T05({ step }: { step: number }) {
  const held = useHeld()
  const { W, H, LY, CL, CW, CT, CH, G1, G2, EX, ES, AY, DY, RX, RS } = T05
  const lit = (i: number) => step === i && !held && step < 3
  const on = (i: number) => step >= i || held
  const built = step >= 3 && !held
  return (
    <Frame w={W} h={H}>
      <svg aria-hidden width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {/* the lane: card → first pillar, pillar → pillar; each arrow ends on a pillar's outer edge */}
        <Elbow pts={[[CL + CW, LY], [G1 - GATE_HALF, LY]]} />
        <Elbow pts={[[G1 + GATE_HALF, LY], [G2 - GATE_HALF, LY]]} />
        <Elbow pts={T05_A} />
        <Elbow pts={T05_D} />
        <Elbow pts={[[EX + ES / 2, AY], [RX - RS / 2, AY]]} on={on(3)} />
      </svg>
      {/* a request rides the lane: once to the resource, once refused (behind the pillars and tiles) */}
      <Dot kf="t05a" on={built} t={5.2} />
      <Dot kf="t05b" on={built} d={2.6} t={5.2} color={colors.accent} />
      {/* the credential card: the three kinds of proof */}
      <div style={{ position: 'absolute', left: CL, top: CT, width: CW, height: CH, borderRadius: 16, background: '#FFFFFF', boxShadow: litRing(lit(1), `inset 0 0 0 1.5px ${colors.line}, 0 12px 22px -16px rgba(31,64,140,0.5)`), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-evenly', zIndex: 3 }}>
        {[
          ['password', 'Password', 'pulse'],
          ['key', 'Key', 'glint'],
          ['token', 'Token', 'bob'],
        ].map(([ic, tg, lp], k) => (
          <Show key={tg} on={on(1)} delay={k * 110} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Ico3D name={ic as Ico3DName} size={40} loop={lp as Loop3D} d={k * 0.4} t={2.8} />
            <span style={tagStyle(colors.ink, 12)}>{tg}</span>
          </Show>
        ))}
        <SeqRing i={0} n={3} on={built} radius={20} />
      </div>
      <span style={{ position: 'absolute', left: CL + CW / 2 - 60, top: CT + CH + 8, width: 120, ...tagStyle(colors.ink, 14) }}>Credential</span>
      {/* the two gates */}
      <Gate3 x={G1} y={LY} name="fingerprint" tag="Authentication" lit={lit(2)} />
      <Gate3 x={G2} y={LY} name="policy" tag="Authorization" lit={lit(2)} d={0.6} />
      {/* 2 · each gate fails with its own kind of error */}
      {[
        { x: G1, name: 'user-x' as Ico3DName, tag: 'Identity' },
        { x: G2, name: 'ban' as Ico3DName, tag: 'Permission' },
      ].map((e, k) => (
        <Show key={e.tag} on={on(2)} delay={k * 120} style={{ position: 'absolute', left: e.x - 50, top: LY + GATE_BAR_H / 2 + 34, width: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span style={{ position: 'relative' }}>
            <T3 name={e.name} size={38} loop="bob" d={k * 0.6} t={2.4} lit={lit(2)} />
            <SeqRing i={1} n={3} on={built} radius={12} />
          </span>
          <span style={tagStyle(colors.ink, 12)}>{e.tag}</span>
        </Show>
      ))}
      {/* the two exits */}
      <div style={{ position: 'absolute', left: EX - 50, top: AY - ES / 2, width: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 3 }}>
        <T3 name="check" size={ES} loop="pulse" t={2.4} />
        <span style={tagStyle(colors.ink, 13)}>Allowed</span>
      </div>
      <div style={{ position: 'absolute', left: EX - 50, top: DY - ES / 2, width: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 3 }}>
        <T3 name="cross" size={ES} loop="pulse" d={1.2} t={2.4} />
        <span style={tagStyle(colors.ink, 13)}>Denied</span>
      </div>
      {/* 3 · a protected resource: both checks run again on every access */}
      <Show on={on(3)} from="translateX(10px)" style={{ position: 'absolute', left: RX - 40, top: AY - RS / 2, width: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 3 }}>
        <span style={{ position: 'relative' }}>
          <MarkTile src={bucketMark} size={RS} lit={lit(3)} />
          <SeqRing i={2} n={3} on={built} radius={16} />
        </span>
        <span style={tagStyle(colors.ink, 13)}>Resource</span>
      </Show>
    </Frame>
  )
}

/* ================================================================== A_T06 · the authentication gate + four TR rows (1080 x 330, the stage) */

/* panel-local geometry (the panel sits P inside the stage) */
const T06 = { W: 1080, H: 330, P: 20, PW: 520, LY: 145, RC: 46, RS: 46, RY: [86, 204], BL: 98, BW: 140, BT: 30, BH: 232, GX: 304, JX: 380, EX: 450, ES: 44, TY: 70, XY: 220 }
const T06_UP: [number, number][] = [[T06.GX + GATE_HALF, T06.LY], [T06.JX, T06.LY], [T06.JX, T06.TY], [T06.EX - T06.ES / 2, T06.TY]]
const T06_DN: [number, number][] = [[T06.GX + GATE_HALF, T06.LY], [T06.JX, T06.LY], [T06.JX, T06.XY], [T06.EX - T06.ES / 2, T06.XY]]

function A_T06({ step, rows }: { step: number; rows: [string, string][] }) {
  const held = useHeld()
  const { W, H, P, PW, LY, RC, RS, RY, BL, BW, BT, BH, GX, EX, ES, TY, XY } = T06
  const PH = H - 2 * P
  const lit = (i: number) => step === i + 1 && !held && step < 4
  const walk = step >= 4 && !held
  return (
    <Frame w={W} h={H}>
      <div style={{ position: 'absolute', left: P, top: P, width: PW, height: PH, borderRadius: 18, background: 'linear-gradient(180deg, #F6F9FF 0%, #EAF1FF 100%)', boxShadow: `inset 0 0 0 1.5px ${colors.line}` }}>
        <svg aria-hidden width={PW} height={PH} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {RY.map((y) => <Elbow key={y} pts={[[RC + RS / 2, y], [BL, y]]} />)}
          <Elbow pts={[[BL + BW, LY], [GX - GATE_HALF, LY]]} />
          <Elbow pts={T06_UP} />
          <Elbow pts={T06_DN} />
        </svg>
        <Dot kf="t06a" on={walk} t={5.2} />
        <Dot kf="t06b" on={walk} d={2.6} t={5.2} color={colors.accent} />
        {/* who is asking: root and an IAM user, each through the gate on its own */}
        {[
          { name: 'crown' as Ico3DName, tag: 'Root', loop: 'glint' as Loop3D },
          { name: 'user' as Ico3DName, tag: 'User', loop: 'bob' as Loop3D },
        ].map((c, k) => (
          <div key={c.tag} style={{ position: 'absolute', left: RC - 40, top: RY[k] - RS / 2, width: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 3 }}>
            <span style={{ position: 'relative' }}>
              <T3 name={c.name} size={RS} lit={lit(2)} loop={c.loop} d={k * 0.7} t={3} />
              <SeqRing i={2} n={4} on={walk} radius={14} />
            </span>
            <span style={tagStyle(colors.ink, 13)}>{c.tag}</span>
          </div>
        ))}
        {/* the credential box: a password with MFA, an access key pair */}
        <div style={{ position: 'absolute', left: BL, top: BT, width: BW, height: BH, borderRadius: 16, background: '#FFFFFF', boxShadow: `inset 0 0 0 1.5px ${colors.line}, 0 12px 22px -16px rgba(31,64,140,0.5)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-evenly', zIndex: 3 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <span style={{ position: 'relative', display: 'flex', gap: 8 }}>
              <T3 name="password" size={44} lit={lit(0)} loop="pulse" t={2.4} />
              <T3 name="phone" size={44} lit={lit(0)} loop="beat" d={0.6} t={2.4} />
              <SeqRing i={0} n={4} on={walk} radius={14} />
            </span>
            <span style={tagStyle(colors.ink, 13)}>Password</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <span style={{ position: 'relative', display: 'flex' }}>
              <T3 name="key" size={48} lit={lit(1)} loop="glint" d={0.8} t={3.2} />
              <SeqRing i={1} n={4} on={walk} radius={14} />
            </span>
            <span style={tagStyle(colors.ink, 13)}>Access Key</span>
          </div>
        </div>
        {/* the gate */}
        <Gate3 x={GX} y={LY} name="fingerprint" tag="Authentication" />
        {/* the two exits; 4 · a failure stops the request here */}
        <div style={{ position: 'absolute', left: EX - 55, top: TY - ES / 2, width: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 3 }}>
          <T3 name="check" size={ES} loop="pulse" t={2.4} />
          <span style={tagStyle(colors.ink, 13)}>Confirmed</span>
        </div>
        <div style={{ position: 'absolute', left: EX - 55, top: XY - ES / 2, width: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 3 }}>
          <span style={{ position: 'relative' }}>
            <T3 name="cross" size={ES} loop="pulse" d={1.2} t={2.4} lit={lit(3)} />
            <SeqRing i={3} n={4} on={walk} radius={14} />
          </span>
          <span style={tagStyle(colors.ink, 13)}>Failure</span>
        </div>
      </div>
      <TrRows rows={rows} step={step} held={held} x={P + PW + 24} w={W - P - (P + PW + 24)} H={PH} y={P} />
    </Frame>
  )
}

/* ================================================================== A_T07 · the authorization gate + four TR rows (1080 x 330, the stage) */

const T07 = { W: 1080, H: 330, P: 20, PW: 520, LY: 150, VC: 50, VS: 56, G2: 178, JX: 246, BR: 294, BS: 44, AY: 76, DY: 224, OX: 362, OS: 40, KX: 420, BKX: 470, BKS: 46 }
const T07_UP: [number, number][] = [[T07.G2 + GATE_HALF, T07.LY], [T07.JX, T07.LY], [T07.JX, T07.AY], [T07.BR - T07.BS / 2, T07.AY]]
const T07_DN: [number, number][] = [[T07.G2 + GATE_HALF, T07.LY], [T07.JX, T07.LY], [T07.JX, T07.DY], [T07.BR - T07.BS / 2, T07.DY]]
const T07_RB: [number, number][] = [[T07.OX + T07.OS / 2, T07.AY], [T07.KX, T07.AY], [T07.KX, T07.LY], [T07.BKX - T07.BKS / 2, T07.LY]]

function A_T07({ step, rows }: { step: number; rows: [string, string][] }) {
  const held = useHeld()
  const { W, H, P, PW, LY, VC, VS, G2, BR, BS, AY, DY, OX, OS, BKX, BKS } = T07
  const PH = H - 2 * P
  const lit = (i: number) => step === i + 1 && !held && step < 4
  const walk = step >= 4 && !held
  const PT = 14 // the policy tile's top
  return (
    <Frame w={W} h={H}>
      <div style={{ position: 'absolute', left: P, top: P, width: PW, height: PH, borderRadius: 18, background: 'linear-gradient(180deg, #F6F9FF 0%, #EAF1FF 100%)', boxShadow: `inset 0 0 0 1.5px ${colors.line}` }}>
        <svg aria-hidden width={PW} height={PH} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <Elbow pts={[[VC + VS / 2, LY], [G2 - GATE_HALF, LY]]} />
          {/* the policy is read by the gate: down between the pillars onto the gate's icon */}
          <Elbow pts={[[G2, PT + 44 + 24], [G2, LY - 21]]} color="#B9C6DE" width={2} dashed />
          <Elbow pts={T07_UP} />
          <Elbow pts={T07_DN} />
          <Elbow pts={[[BR + BS / 2, AY], [OX - OS / 2, AY]]} />
          <Elbow pts={[[BR + BS / 2, DY], [OX - OS / 2, DY]]} />
          {/* only the allowed read reaches the bucket; the denied delete stops at Deny (no line onward) */}
          <Elbow pts={T07_RB} />
        </svg>
        <Dot kf="t07a" on={walk} t={5.2} />
        <Dot kf="t07b" on={walk} d={2.6} t={5.2} color={colors.accent} />
        {/* 1 · authentication already passed: identity first, permission second */}
        <div style={{ position: 'absolute', left: VC - 50, top: LY - VS / 2, width: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, zIndex: 3 }}>
          <span style={{ position: 'relative' }}>
            <span aria-hidden className={lc('halo')} style={{ position: 'absolute', inset: -8, borderRadius: 24, background: `radial-gradient(closest-side, ${colors.success}40, ${colors.success}00)`, ...lv(0, 3.2) }} />
            <T3 name="fingerprint" size={VS} k={0.8} lit={lit(0)} loop="pulse" t={2.6} badge="check" />
            <SeqRing i={0} n={4} on={walk} radius={16} />
          </span>
          <span style={tagStyle(colors.ink, 13)}>Verified</span>
        </div>
        {/* 2 · the authorization gate reads the policy attached to the identity */}
        <div style={{ position: 'absolute', left: G2 - 50, top: PT, width: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 3 }}>
          <span style={{ position: 'relative' }}>
            <T3 name="policy" size={44} lit={lit(1)} loop="tilt" t={3.2} />
            <SeqRing i={1} n={4} on={walk} radius={13} />
          </span>
          <span style={tagStyle(colors.ink, 13)}>Policy</span>
        </div>
        <Gate3 x={G2} y={LY} name="shield" tag="Authorization" />
        {/* branch exits */}
        <div style={{ position: 'absolute', left: BR - 45, top: AY - BS / 2, width: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 3 }}>
          <T3 name="check" size={BS} loop="pulse" t={2.4} />
          <span style={tagStyle(colors.ink, 13)}>Allow</span>
        </div>
        <div style={{ position: 'absolute', left: BR - 45, top: DY - BS / 2, width: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 3 }}>
          <span style={{ position: 'relative' }}>
            <T3 name="ban" size={BS} loop="pulse" d={1.2} t={2.4} lit={lit(3)} />
            <SeqRing i={3} n={4} on={walk} radius={14} />
          </span>
          <span style={tagStyle(colors.ink, 13)}>Deny</span>
        </div>
        {/* 3 · one identity, one bucket: read allowed here, delete denied there */}
        <div style={{ position: 'absolute', left: OX - 35, top: AY - OS / 2, width: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 3 }}>
          <T3 name="eye" size={OS} loop="bob" t={2.6} lit={lit(2)} />
          <span style={tagStyle(colors.ink, 13)}>Read</span>
        </div>
        <div style={{ position: 'absolute', left: OX - 35, top: DY - OS / 2, width: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 3 }}>
          <T3 name="trash" size={OS} loop="tilt" d={0.8} t={2.6} lit={lit(2)} />
          <span style={tagStyle(colors.ink, 13)}>Delete</span>
        </div>
        <div style={{ position: 'absolute', left: BKX - 40, top: LY - BKS / 2, width: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 3 }}>
          <span style={{ position: 'relative' }}>
            <MarkTile src={bucketMark} size={BKS} lit={lit(2)} d={0.4} />
            <SeqRing i={2} n={4} on={walk} radius={14} />
          </span>
          <span style={tagStyle(colors.ink, 13)}>Bucket</span>
        </div>
      </div>
      <TrRows rows={rows} step={step} held={held} x={P + PW + 24} w={W - P - (P + PW + 24)} H={PH} y={P} />
    </Frame>
  )
}

/* ================================================================== A_T09 · the IAM menu joined to its credentials (440 x 250) */

function A_T09({ step }: { step: number }) {
  const held = useHeld()
  const instant = useInstant()
  const W = 440
  const H = 250
  const lit = (i: number) => step === i && !held && step < 4
  const on = (i: number) => step >= i || held
  const walk = step >= 4 && !held
  const MW = 200 // the menu panel
  const items = [
    { t: 'Users', y: 52, x: 18 },
    { t: 'Security Credentials', y: 94, x: 34 },
    { t: 'Account Settings', y: 190, x: 18 },
  ]
  const TX = 326 // the credential tiles' centre
  /* point order: 1 STS token, 2 password policy, 3 MFA, 4 access keys; tiles top → bottom so no lines cross */
  const creds = [
    { y: 34, src: mfaMark, icon: '', tag: 'MFA', from: 1, point: 3 },
    { y: 94, src: keyMark, icon: '', tag: 'Access Keys', from: 1, point: 4 },
    { y: 158, src: '', icon: 'RectangleEllipsis', tag: 'Password', from: 2, point: 2 },
    { y: 218, src: stsMark, icon: '', tag: 'STS Token', from: 2, point: 1 },
  ]
  return (
    <Frame w={W} h={H}>
      {/* the IAM console menu, drawn */}
      <div style={{ position: 'absolute', left: 0, top: 6, width: MW, height: H - 12, borderRadius: 14, background: '#FAFBFC', boxShadow: '0 14px 26px -20px rgba(16,32,58,0.55), inset 0 0 0 1px #D5DEEC', overflow: 'hidden' }}>
        <div style={{ height: 26, background: '#232F3E', display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px' }}>
          <span style={{ display: 'grid', placeItems: 'center', height: 16, padding: '0 3px', borderRadius: 3, background: '#FFFFFF' }}>
            <img src={awsWord} alt="" aria-hidden draggable={false} style={{ display: 'block', height: 11, width: 'auto' }} />
          </span>
          <span style={{ fontFamily: font, fontSize: 11, fontWeight: 700, color: '#D5DBDB' }}>IAM</span>
        </div>
      </div>
      {items.map((it, k) => {
        const hot = (k === 1 && (lit(3) || lit(4))) || (k === 2 && (lit(1) || lit(2)))
        return (
          <div key={it.t} style={{ position: 'absolute', left: it.x - 6, top: it.y - 14, height: 28, display: 'flex', alignItems: 'center', gap: 6, padding: '0 6px', borderRadius: 7, boxShadow: litRing(hot, ''), transition: instant ? 'none' : `box-shadow 420ms ${EASE}`, fontFamily: font, fontSize: 13, fontWeight: 600, color: k === 0 ? '#0972D3' : '#16191F', whiteSpace: 'nowrap' }}>
            <Icon name={['Users', 'IdCard', 'Settings'][k]} size={15} />
            {it.t}
          </div>
        )
      })}
      <svg aria-hidden width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {/* Security Credentials sits under Users */}
        <line x1={28} y1={66} x2={28} y2={94} stroke="#B9C6DE" strokeWidth={2} />
        <line x1={28} y1={94} x2={32} y2={94} stroke="#B9C6DE" strokeWidth={2} />
        {creds.map((c, k) => {
          const fy = items[c.from].y
          const hot = lit(c.point)
          return <Arrow key={k} x1={MW + 8} y1={fy} x2={TX - 28} y2={c.y} on={on(c.point)} color={hot ? colors.brand : '#9FB3D6'} width={hot ? 3 : 2.5} />
        })}
      </svg>
      {creds.map((c, k) => (
        <Show key={c.tag} on={on(c.point)} from="translateX(10px)" style={{ position: 'absolute', left: TX - 22, top: c.y - 22, height: 44, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ position: 'relative' }}>
            {c.src ? <MarkTile src={c.src} size={44} lit={lit(c.point)} d={k * 0.5} /> : <GlyphTile icon={c.icon} size={44} lit={lit(c.point)} loop="pulse" t={2.4} />}
            <SeqRing i={c.point - 1} n={4} on={walk} radius={14} />
            {c.point === 4 && (
              <span className={walk || held ? undefined : lc('spin')} style={{ position: 'absolute', right: -9, bottom: -9, width: 22, height: 22, borderRadius: 99, background: '#FFFFFF', color: colors.brandDark, display: 'grid', placeItems: 'center', boxShadow: '0 3px 8px -3px rgba(16,32,58,0.5)', ...lv(0, 5) }}>
                <Icon name="RefreshCw" size={13} />
              </span>
            )}
          </span>
          <span style={{ ...tagStyle(colors.ink, 13), textAlign: 'left' }}>{c.tag}</span>
        </Show>
      ))}
    </Frame>
  )
}

/* ------------------------------------------------------------------ exports */

type Fig = (p: Record<string, unknown>) => ReactNode
export const figures: Record<string, Fig> = {
  A_T01: A_T01 as unknown as Fig,
  A_T02: A_T02 as unknown as Fig,
  A_T03: A_T03 as unknown as Fig,
  A_T04B: A_T04B as unknown as Fig,
  A_T05: A_T05 as unknown as Fig,
  A_T06: A_T06 as unknown as Fig,
  A_T07: A_T07 as unknown as Fig,
  A_T09: A_T09 as unknown as Fig,
}

export const slides = {}

/* flow-dot routes, in the dot's own box (the Frame, or the panel it sits in); timed by length so the dot moves at one
   speed round every corner; fades in at the start and out at the end */
const route = (name: string, pts: [number, number][]) => {
  const seg = pts.slice(1).map((q, k) => Math.hypot(q[0] - pts[k][0], q[1] - pts[k][1]))
  const tot = seg.reduce((x, y) => x + y, 0) || 1
  let acc = 0
  const stops = pts.map(([x, y], k) => {
    if (k > 0) acc += seg[k - 1]
    return `${(6 + (acc / tot) * 80).toFixed(2)}% { transform: translate(${x}px, ${y}px); opacity: 1 }`
  }).join(' ')
  const [fx, fy] = pts[0]
  const [lx, ly] = pts[pts.length - 1]
  return `@keyframes a13-${name} { 0% { transform: translate(${fx}px, ${fy}px); opacity: 0 } ${stops} 93% { transform: translate(${lx}px, ${ly}px); opacity: 0 } 100% { transform: translate(${lx}px, ${ly}px); opacity: 0 } }
.a13-${name} { animation: a13-${name} var(--a13-t, 5s) linear infinite; opacity: 0; }`
}

export const css = `
.a13 { animation-delay: var(--a13-d, 0s); }
@keyframes a13-halo { 0%, 100% { opacity: 0.35; transform: scale(0.985) } 50% { opacity: 0.9; transform: scale(1.015) } }
.a13-halo { animation: a13-halo var(--a13-t, 3.6s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes a13-bob { 0%, 100% { transform: translateY(-2px) } 50% { transform: translateY(2px) } }
.a13-bob { animation: a13-bob var(--a13-t, 2.4s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes a13-pulse { 0%, 100% { transform: scale(0.93) } 50% { transform: scale(1.07) } }
.a13-pulse { animation: a13-pulse var(--a13-t, 2s) cubic-bezier(0.45,0,0.55,1) infinite; transform-origin: center; }
@keyframes a13-breathe { 0%, 100% { transform: translateY(0) scale(1) } 50% { transform: translateY(-1.5px) scale(1.04) } }
.a13-breathe { animation: a13-breathe var(--a13-t, 3.2s) cubic-bezier(0.45,0,0.55,1) infinite; transform-origin: 50% 80%; }
@keyframes a13-turn { 0%, 100% { transform: rotate(-8deg) } 50% { transform: rotate(8deg) } }
.a13-turn { animation: a13-turn var(--a13-t, 2.8s) cubic-bezier(0.45,0,0.55,1) infinite; transform-origin: center; }
@keyframes a13-shackle { 0%, 100% { transform: translateY(0) } 40% { transform: translateY(-2.5px) } 55% { transform: translateY(0.5px) } 70% { transform: translateY(0) } }
.a13-shackle { animation: a13-shackle var(--a13-t, 2.4s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes a13-spin { 0% { transform: rotate(0deg) } 100% { transform: rotate(360deg) } }
.a13-spin { animation: a13-spin var(--a13-t, 6s) linear infinite; transform-origin: center; }
@keyframes a13-glint { 0%, 70%, 100% { transform: rotate(0deg) scale(1) } 78% { transform: rotate(-10deg) scale(1.08) } 86% { transform: rotate(6deg) scale(1.03) } }
.a13-glint { animation: a13-glint var(--a13-t, 3.2s) cubic-bezier(0.45,0,0.55,1) infinite; transform-origin: center; }
@keyframes a13-ringglow { 0%, 100% { opacity: 0 } 50% { opacity: 1 } }
.a13-ringglow { animation: a13-ringglow var(--a13-t, 2.8s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes a13-seq3 { 0% { opacity: 0 } 4% { opacity: 1 } 29% { opacity: 1 } 33.3% { opacity: 0 } 100% { opacity: 0 } }
.a13-seq3 { animation: a13-seq3 var(--a13-t, 4.2s) linear infinite; opacity: 0; }
@keyframes a13-seq4 { 0% { opacity: 0 } 3% { opacity: 1 } 22% { opacity: 1 } 25% { opacity: 0 } 100% { opacity: 0 } }
.a13-seq4 { animation: a13-seq4 var(--a13-t, 5.6s) linear infinite; opacity: 0; }
.a13-seq3, .a13-seq4 { animation-delay: var(--a13-d, 0s); }
${route('t01a', [[T01_ROOT, 16 + T01.RS + 26], [T01_ROOT, T01.BUS], [T01_GC[0], T01.BUS], [T01_GC[0], T01.GY]])}
${route('t01b', [[T01_ROOT, 16 + T01.RS + 26], [T01_ROOT, T01.BUS], [T01_GC[1], T01.BUS], [T01_GC[1], T01.GY]])}
${route('t02', T02_SIGN)}
${route('t03a', T03_LINK(T03_SLOT[1]))}
${route('t03b', T03_LINK(T03_SLOT[2]))}
${route('t05a', [[T05.CL + T05.CW, T05.LY], [T05.JX, T05.LY], [T05.JX, T05.AY], [T05.RX - T05.RS / 2, T05.AY]])}
${route('t05b', [[T05.CL + T05.CW, T05.LY], [T05.JX, T05.LY], [T05.JX, T05.DY], [T05.EX - T05.ES / 2, T05.DY]])}
${route('t06a', [[T06.RC + T06.RS / 2, T06.RY[0]], [T06.BL + T06.BW / 2, T06.RY[0]], [T06.BL + T06.BW / 2, T06.LY], [T06.JX, T06.LY], [T06.JX, T06.TY], [T06.EX - T06.ES / 2, T06.TY]])}
${route('t06b', [[T06.RC + T06.RS / 2, T06.RY[1]], [T06.BL + T06.BW / 2, T06.RY[1]], [T06.BL + T06.BW / 2, T06.LY], [T06.JX, T06.LY], [T06.JX, T06.XY], [T06.EX - T06.ES / 2, T06.XY]])}
${route('t07a', [[T07.VC + T07.VS / 2, T07.LY], [T07.JX, T07.LY], [T07.JX, T07.AY], [T07.KX, T07.AY], [T07.KX, T07.LY - 8], [T07.BKX - T07.BKS / 2, T07.LY - 8]])}
${route('t07b', [[T07.VC + T07.VS / 2, T07.LY], [T07.JX, T07.LY], [T07.JX, T07.DY], [T07.OX - T07.OS / 2, T07.DY]])}
.cc-still .a13, .deck-thumb .a13 { animation: none !important; }
.cc-still .a13-halo, .deck-thumb .a13-halo { opacity: 0.5 !important; transform: none !important; }
.cc-still .a13-seq3, .deck-thumb .a13-seq3, .cc-still .a13-seq4, .deck-thumb .a13-seq4, .cc-still .a13-ringglow, .deck-thumb .a13-ringglow { opacity: 0 !important; }
@media (prefers-reduced-motion: reduce) { .a13 { animation: none !important; } }
`
