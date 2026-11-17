import type { CSSProperties, ReactNode } from 'react'
import { ArrowDownToLine, ArrowUpFromLine, Check, Lock, Search, ShieldCheck, Table2 } from 'lucide-react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { TILE_SKIN } from '../card'
import { Arrow, At, Label, STILL, Traveller } from '../scene'
import { BulletLine, fx } from './fx'
import { Gateway, LockBadge, NET, NoMark, Resource, SubnetBox, litRing } from './frames'

/**
 * THE LAB'S FIGURES (T24-1, T24-2, T29-1), visual pass 2026-11-04.
 *
 *   StepTiles   Session 4's Part A step design (`cv/docker.tsx` `BPoints`):
 *               raised tiles, a G7 bullet per step (ring waiting, arrow now,
 *               tick done), the step's own glyph on the tile's right
 *   LabVpc      the network the practical builds, drawn with the deck's pieces
 *               in the Mumbai Region: the VPC, the two subnets (their address
 *               blocks as dots), the gateway docking on the VPC's edge, then the
 *               route tables, the security controls and the console check
 *   SecurityFig the two filtering layers: an inbound packet stopped at the
 *               security group with no inbound rules, the network ACL's inbound
 *               and outbound rule lists read by a magnifier
 *
 * No new words: a label inside a picture is a string already on its slide.
 * Every timed change is a `useBuild` step in the slide (one per press with auto
 * animation off); the ambient loops are `fx` / `LAB_CSS` classes, held on
 * harness URLs.
 */

const EASE = 'cubic-bezier(0.22,1,0.36,1)'
const POP = 'cubic-bezier(0.34,1.56,0.64,1)'

/** Shown or not, popping (scale) in place: a part that just arrived. */
function Pop({ on, children, delay = 0, from = 0.6, style }: { on: boolean; children: ReactNode; delay?: number; from?: number; style?: CSSProperties }) {
  const instant = useInstant()
  return (
    <div style={{ opacity: on ? 1 : 0, transform: on ? 'scale(1)' : `scale(${from})`, transition: instant ? 'none' : `opacity 360ms ${EASE} ${delay}ms, transform 480ms ${POP} ${delay}ms`, ...style }}>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ the step glyphs */

/** A VPC in miniature: a solid brand box with a dashed inner rim. */
function MiniVpc({ w = 30, h = 22 }: { w?: number; h?: number }) {
  return <span aria-hidden className="block rounded-[7px]" style={{ width: w, height: h, border: `2.5px solid ${NET.boundary}`, background: `${NET.boundary}14`, boxShadow: `inset 0 0 0 3px #FFFFFF, inset 0 0 0 4.5px ${NET.boundary}40` }} />
}

/** The two subnets in miniature, public green and private teal. */
function MiniSubnets({ h = 24 }: { h?: number }) {
  return (
    <span aria-hidden className="flex gap-[3px]">
      <SubnetBox w={Math.round(h * 0.62)} h={h} kind="public" />
      <SubnetBox w={Math.round(h * 0.62)} h={h} kind="private" />
    </span>
  )
}

/** A route table's own glyph (no words): the table icon on a tile. */
export function RtGlyph({ size = 30, lit = false }: { size?: number; lit?: boolean }) {
  return (
    <span aria-hidden className="grid place-items-center rounded-[9px]" style={{ width: size, height: size, ...TILE_SKIN, boxShadow: litRing(lit, TILE_SKIN.boxShadow as string), color: NET.gateway }}>
      <Table2 size={Math.round(size * 0.56)} strokeWidth={2.2} />
    </span>
  )
}

/** The done check: a success disc with a tick. */
function CheckDisc({ size = 28 }: { size?: number }) {
  return (
    <span aria-hidden className="grid place-items-center rounded-full" style={{ width: size, height: size, background: NET.public, color: colors.white, boxShadow: `0 0 0 3px ${colors.white}, 0 8px 16px -8px rgba(16,32,58,0.6)` }}>
      <Check size={Math.round(size * 0.56)} strokeWidth={3} />
    </span>
  )
}

/** The glyph of lab step i (0-based): VPC, subnets, gateway, route table, security control, check. */
export function stepGlyph(i: number, size = 30): ReactNode {
  switch (i) {
    case 0: return <MiniVpc w={size} h={Math.round(size * 0.74)} />
    case 1: return <MiniSubnets h={Math.round(size * 0.82)} />
    case 2: return <Gateway kind="igw" size={size} />
    case 3: return <RtGlyph size={size} />
    case 4: return <LockBadge size={Math.round(size * 0.9)} />
    default: return <CheckDisc size={Math.round(size * 0.9)} />
  }
}

/* ------------------------------------------------------------------ the step tiles */

export type StepItem = { text: ReactNode; glyph: ReactNode }

/** The step's bullet (G7): done steps tick, the current one leads on, the rest wait. */
const stepKind = (i: number, k: number) => (STILL || k > i + 1 ? 'tick' : k === i + 1 ? 'arrow' : 'ring') as 'tick' | 'arrow' | 'ring'

/** Session 4's step tiles: the bullet, the step's words, its glyph on the right; `k` is the build (step i is current at k = i + 1). */
export function StepTiles({ items, k, width, size = 18, gap = 10 }: { items: StepItem[]; k: number; width: number; size?: number; gap?: number }) {
  const instant = useInstant()
  const ease = instant ? 'none' : `all 420ms ${EASE}`
  return (
    <div className="flex shrink-0 flex-col" style={{ width, gap }}>
      {items.map((it, i) => {
        const on = !STILL && k === i + 1
        return (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl py-2.5 pl-3.5 pr-2.5"
            style={{
              ...TILE_SKIN,
              boxShadow: on ? `inset 0 0 0 2px ${colors.brand}, 0 12px 24px -14px ${colors.brand}` : TILE_SKIN.boxShadow,
              background: on ? 'linear-gradient(180deg, #F4F8FF 0%, #E3ECFD 100%)' : TILE_SKIN.background,
              transform: on ? 'translateX(4px)' : 'none',
              transition: ease,
            }}
          >
            <BulletLine kind={stepKind(i, k)} size={size} lineH={1.4} className="min-w-0 flex-1">
              {it.text}
            </BulletLine>
            <span aria-hidden className="grid shrink-0 place-items-center rounded-[12px]" style={{ width: 46, height: 40, background: on ? '#FFFFFF' : colors.surface2, boxShadow: on ? `inset 0 0 0 1.5px ${colors.brand}66` : 'none', transition: ease }}>
              <span className={on ? fx('lift', 0, 1.6).className : ''} style={{ ...(on ? fx('lift', 0, 1.6).style : {}), display: 'grid' }}>
                {it.glyph}
              </span>
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ the lab network */

export const LV = {
  W: 486,
  H: 246,
  region: { x: 8, y: 14, w: 470, h: 224 },
  vpc: { x: 26, y: 52, w: 434, h: 174 },
  pub: { x: 46, y: 104, w: 186, h: 104 },
  pri: { x: 254, y: 104, w: 186, h: 104 },
  igw: { cx: 139, cy: 52, r: 21 },
  no: { cx: 347, cy: 52 },
  /** the band over the region that holds the AWS mark on T24-1 */
  awsBand: 50,
} as const

/** A subnet's address block: rows of dots (its addresses), lighting in turn while `live`. */
function Addresses({ tone, live, cols = 6, rows = 3 }: { tone: string; live: boolean; cols?: number; rows?: number }) {
  return (
    <div aria-hidden className="grid" style={{ gridTemplateColumns: `repeat(${cols}, 9px)`, gap: 7 }}>
      {Array.from({ length: cols * rows }, (_, i) => {
        const f = fx('glow', ((i * 7) % (cols * rows)) * 0.11, 2.4)
        return <span key={i} className={`block rounded-full ${live ? f.className : ''}`} style={{ ...(live ? f.style : {}), width: 9, height: 9, background: tone, opacity: 0.55 }} />
      })}
    </div>
  )
}

export type LabParts = {
  vpc: boolean
  subnets: boolean
  igw: boolean
  routes?: boolean
  security?: boolean
  verify?: boolean
  /** the part the build is on, ringed in orange */
  lit?: 'vpc' | 'subnets' | 'igw' | 'routes' | 'security' | 'verify'
}

/**
 * The network the practical builds, on a 486 x 246 stage. The labels are
 * passed in by the slide (strings already on it): the region's, the VPC's and
 * each subnet's.
 */
export function LabVpc({ parts, regionLabel, vpcLabel, pubLabel, priLabel, aws }: { parts: LabParts; regionLabel?: ReactNode; vpcLabel?: ReactNode; pubLabel?: ReactNode; priLabel?: ReactNode; /** the AWS mark and its name over the region (T24-1 names AWS), the drawing moved down by `LV.awsBand` */ aws?: ReactNode }) {
  const instant = useInstant()
  const ease = (ms = 460, d = 0) => (instant ? 'none' : `opacity ${ms}ms ${EASE} ${d}ms, transform ${ms + 80}ms ${EASE} ${d}ms, box-shadow 420ms ${EASE}`)
  const { region: R, vpc: V, pub: P, pri: Q, igw: I } = LV
  const lit = parts.lit
  const rtOn = !!parts.routes
  return (
    <div className="absolute inset-0" style={{ width: LV.W, height: LV.H + (aws ? LV.awsBand : 0) }}>
      {aws && <div className="absolute flex items-center justify-end" style={{ right: 10, top: 6, height: LV.awsBand - 14 }}>{aws}</div>}
      <div className="absolute" style={{ left: 0, top: aws ? LV.awsBand : 0, width: LV.W, height: LV.H }}>
      {/* the region: a thin dashed muted rim (R7.4: few, thin dotted lines), its name on the corner */}
      <span aria-hidden className="absolute rounded-[20px]" style={{ left: R.x, top: R.y, width: R.w, height: R.h, border: `1.5px dashed ${colors.muted}88`, background: 'rgba(255,255,255,0.35)' }} />
      {regionLabel !== undefined && (
        /* inside the region's top-right corner, clear of its rim (R7.2) */
        <div className="absolute" style={{ right: LV.W - (R.x + R.w) + 10, top: R.y + 8 }}>
          <Label size={14} strong mono tone="muted">
            {regionLabel}
          </Label>
        </div>
      )}
      {/* the VPC: lands with a small settle */}
      <div className="absolute rounded-[18px]" style={{ left: V.x, top: V.y, width: V.w, height: V.h, border: `2.5px solid ${NET.boundary}`, background: `${NET.boundary}0D`, boxShadow: litRing(lit === 'vpc'), opacity: parts.vpc ? 1 : 0, transform: parts.vpc ? 'none' : 'scale(0.94)', transition: ease(520) }}>
        {vpcLabel !== undefined && (
          /* inside the VPC's top-right corner, clear of its rim (R7.2) */
          <div className="absolute" style={{ right: 10, top: 8 }}>
            <Label size={14} strong mono={typeof vpcLabel !== 'string'} tone={lit === 'vpc' ? 'solid' : 'brand'}>
              {vpcLabel}
            </Label>
          </div>
        )}
      </div>
      {/* the two subnets drop into the VPC, their address blocks lighting */}
      {[
        { b: P, kind: 'public' as const, label: pubLabel, tone: NET.public, d: 0 },
        { b: Q, kind: 'private' as const, label: priLabel, tone: NET.private, d: 140 },
      ].map(({ b, kind, label, tone, d }) => (
        <div key={kind} className="absolute" style={{ left: b.x, top: b.y, opacity: parts.subnets ? 1 : 0, transform: parts.subnets ? 'none' : 'translateY(-16px)', transition: ease(460, parts.subnets ? d : 0) }}>
          <SubnetBox w={b.w} h={b.h} kind={kind} lit={lit === 'subnets'}>
            {label !== undefined && (
              <span className="absolute inline-flex whitespace-nowrap rounded-pill px-2 py-[2px] font-mono text-[14px] font-semibold leading-tight" style={{ left: 8, top: 8, color: colors.white, background: tone, fontVariantLigatures: 'none' }}>
                {label}
              </span>
            )}
            <div className="absolute" style={{ right: 14, bottom: 12 }}>
              <Addresses tone={tone} live={parts.subnets} />
            </div>
            {/* its route table, docked on the subnet's foot */}
            <div className="absolute" style={{ left: 10, bottom: 10 }}>
              <Pop on={rtOn} delay={kind === 'private' ? 160 : 0}>
                <RtGlyph size={32} lit={lit === 'routes'} />
              </Pop>
            </div>
          </SubnetBox>
        </div>
      ))}
      {/* the local route between the subnets, inside the VPC only */}
      <span aria-hidden className="absolute rounded-full" style={{ left: P.x + P.w + 3, top: P.y + P.h / 2 - 1.5, width: Q.x - (P.x + P.w) - 6, height: 3, background: NET.boundary, opacity: rtOn ? 1 : 0, transition: ease(360, 300) }} />
      {/* the public route table's default route: up through the gateway */}
      <Arrow x1={I.cx} y1={P.y - 3} x2={I.cx} y2={I.cy + I.r + 2} on={rtOn} tone={NET.public} delay={200} />
      <Traveller path={[[I.cx, P.y + 30], [I.cx, I.cy]]} run={rtOn && !STILL} k="lab-route" tone={NET.public} size={11} dur={1.8} />
      {/* the private route table: no route to the internet, stopped at the VPC's edge */}
      <Arrow x1={LV.no.cx} y1={Q.y - 3} x2={LV.no.cx} y2={LV.no.cy + 13} on={rtOn} tone={NET.private} dashed delay={320} />
      <div className="absolute" style={{ left: LV.no.cx, top: LV.no.cy, transform: 'translate(-50%, -50%)' }}>
        <span className={rtOn && !STILL ? 'lab-nudge' : ''} style={{ display: 'grid' }}>
          <NoMark size={24} on={rtOn} />
        </span>
      </div>
      {/* the internet gateway slides in from above and docks on the VPC's top edge; a ripple marks the attach */}
      <div className="absolute" style={{ left: I.cx, top: I.cy, transform: 'translate(-50%, -50%)' }}>
        <div style={{ opacity: parts.igw ? 1 : 0, transform: parts.igw ? 'none' : 'translateY(-22px)', transition: ease(560) }}>
          <div className="relative">
            {parts.igw && !STILL && <span aria-hidden className={`pointer-events-none absolute rounded-full ${fx('ripple', 0.4, 2.4).className}`} style={{ ...fx('ripple', 0.4, 2.4).style, left: -8, top: -8, width: I.r * 2 + 16, height: I.r * 2 + 16, border: `2px solid ${NET.public}` }} />}
            <span className={parts.igw ? fx('spin', 0, 14).className : ''} style={{ ...(parts.igw ? fx('spin', 0, 14).style : {}), display: 'grid' }}>
              <Gateway kind="igw" size={I.r * 2} lit={lit === 'igw'} />
            </span>
          </div>
        </div>
      </div>
      {/* the security controls: a lock inside each subnet's top-right corner */}
      {[P, Q].map((b, i) => (
        <div key={i} className="absolute" style={{ left: b.x + b.w - 20, top: b.y + 20, transform: 'translate(-50%, -50%)' }}>
          <Pop on={!!parts.security} delay={i * 140}>
            <span className={parts.security ? fx('lift', i * 0.4, 2.6).className : ''} style={{ ...(parts.security ? fx('lift', i * 0.4, 2.6).style : {}), display: 'grid' }}>
              <LockBadge size={26} lit={lit === 'security'} />
            </span>
          </Pop>
        </div>
      ))}
      {/* the network ACL inspected: a magnifier runs over the subnets' tops, in the band between the two routes */}
      <div className="absolute" style={{ left: 156, top: 64, width: 178, height: 28 }}>
        <div className={parts.security && !STILL ? 'lab-scan' : ''} style={{ position: 'absolute', left: 0, top: 0, opacity: parts.security ? 1 : 0, transition: ease(360, 300) }}>
          <span className="grid place-items-center rounded-full" style={{ width: 28, height: 28, background: colors.white, color: NET.lit, boxShadow: `inset 0 0 0 2px ${NET.lit}, 0 8px 16px -8px rgba(16,32,58,0.5)` }}>
            <Search size={15} strokeWidth={2.6} />
          </span>
        </div>
      </div>
      {/* the console check: a tick lands on every part in turn */}
      {[
        /* every tick inside its part, clear of rims and of each other (R7.2) */
        [V.x + V.w - 74, V.y + 21],
        [I.cx + I.r + 10, I.cy - I.r - 1],
        [P.x + 18, P.y + 18],
        [Q.x + 18, Q.y + 18],
        [P.x + 64, P.y + P.h - 26],
        [Q.x + 64, Q.y + Q.h - 26],
      ].map(([x, y], i) => (
        <div key={i} className="absolute" style={{ left: x, top: y, transform: 'translate(-50%, -50%)', zIndex: 4 }}>
          <Pop on={!!parts.verify} delay={i * 110} from={0.3}>
            <CheckDisc size={20} />
          </Pop>
        </div>
      ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ the two filtering layers (T29-1) */

export const SF = {
  W: 634,
  H: 330,
  acl: { x: 133, y: 30, w: 368, h: 270 },
  sub: { x: 153, y: 74, w: 328, h: 206 },
  res: { cx: 317, cy: 150, size: 56 },
  sg: { x: 237, y: 108, w: 160, h: 150 },
} as const

/** A ring that turns solid: faint (thin dashed, line grey) until `solid`, ringed in the template orange while `now`. */
function Ring({ x, y, w, h, solid, now, radius = 18 }: { x: number; y: number; w: number; h: number; solid: boolean; now: boolean; radius?: number }) {
  const instant = useInstant()
  return (
    <span
      aria-hidden
      className="absolute"
      style={{
        left: x, top: y, width: w, height: h, borderRadius: radius,
        border: `${solid ? 2 : 1.5}px ${solid ? 'solid' : 'dashed'} ${solid ? NET.lock : colors.line}`,
        boxShadow: litRing(now),
        transition: instant ? 'none' : `border-color 420ms ${EASE}, box-shadow 420ms ${EASE}`,
      }}
    />
  )
}

/** A rule list as a picture (no words): its direction's icon over three rule bars. */
function RuleList({ dir, on, now, locked = false }: { dir: 'in' | 'out'; on: boolean; now: boolean; locked?: boolean }) {
  const instant = useInstant()
  return (
    <div className="relative flex flex-col items-center gap-2 rounded-[14px] px-3 py-3" style={{ width: 92, ...TILE_SKIN, boxShadow: litRing(now, TILE_SKIN.boxShadow as string), opacity: on ? 1 : 0.35, transition: instant ? 'none' : `all 420ms ${EASE}` }}>
      {/* read only: a padlock on the list's corner (inspected without changing them) */}
      <span className="absolute" style={{ right: 6, top: 8 }}>
        <Pop on={locked}>
          <span className="grid place-items-center rounded-full" style={{ width: 18, height: 18, background: NET.lock, color: colors.white }}>
            <Lock size={11} strokeWidth={2.6} />
          </span>
        </Pop>
      </span>
      <span aria-hidden className="grid place-items-center rounded-[10px]" style={{ width: 34, height: 34, background: on ? NET.lock : colors.surface2, color: on ? colors.white : colors.muted, transition: instant ? 'none' : `all 420ms ${EASE}` }}>
        {dir === 'in' ? <ArrowDownToLine size={18} strokeWidth={2.4} /> : <ArrowUpFromLine size={18} strokeWidth={2.4} />}
      </span>
      {[0, 1, 2].map((i) => (
        <span key={i} aria-hidden className="flex w-full items-center gap-1.5">
          <span className="block rounded-full" style={{ width: 8, height: 8, background: i === 2 ? colors.danger : NET.public }} />
          <span className="block h-[6px] flex-1 rounded-full" style={{ background: colors.line }} />
        </span>
      ))}
    </div>
  )
}

/**
 * T29-1's figures, one per half of the split card. `mode` 'sg' (T29-1, the
 * security group): `k` 0 both rings faint; 1 the security group ring turns
 * solid and its shield pops (created in the VPC); 2 an inbound packet stops
 * at it (no inbound rules); 3 the resource it guards is ringed (it applies to
 * resources); 4 held, the packet still trying. `mode` 'acl' (T29-1b, the
 * network ACL, the security group already in place): 1 the network ACL ring
 * turns solid and its inbound and outbound rule lists are read by a magnifier;
 * 2 a padlock on each list (without changing them); 3 the subnet is ringed (a
 * whole subnet); 4 held, the magnifier still reading.
 */
export function SecurityFig({ k, mode }: { k: number; mode: 'sg' | 'acl' }) {
  const isSg = mode === 'sg'
  const sg = isSg ? k >= 1 : true
  const blocked = isSg ? k >= 2 : true
  const resLit = isSg && k === 3
  const acl = !isSg && k >= 1
  const locked = !isSg && k >= 2
  const subLit = !isSg && k === 3
  const { acl: A, sub: S, res: R, sg: G } = SF
  const listY = A.y + A.h / 2
  const LIST_TOP = listY - 62
  return (
    <div className="absolute inset-0" style={{ width: SF.W, height: SF.H }}>
      {/* the network ACL ring on the subnet's boundary, its chip at its corner */}
      <Ring x={A.x} y={A.y} w={A.w} h={A.h} solid={acl} now={!isSg && k === 1} radius={22} />
      <At x={A.x + 12} y={A.y + 9}>
        <Label size={14} strong tone={acl ? 'brand' : 'muted'}>
          Network ACL
        </Label>
      </At>
      {/* the subnet */}
      <At x={S.x} y={S.y}>
        <SubnetBox w={S.w} h={S.h} label="Subnet" lit={subLit} />
      </At>
      {/* the security group ring, tight round the resource, its shield inside its corner */}
      <Ring x={G.x} y={G.y} w={G.w} h={G.h} solid={sg} now={isSg && k === 1} />
      <At x={G.x + G.w - 22} y={G.y + 22} cx cy>
        <Pop on={sg}>
          <span className={sg && isSg ? fx('lift', 0, 2.6).className : ''} style={{ ...(sg && isSg ? fx('lift', 0, 2.6).style : {}), display: 'grid' }}>
            <span className="grid place-items-center rounded-full" style={{ width: 28, height: 28, background: NET.lock, color: colors.white, boxShadow: '0 8px 16px -8px rgba(16,32,58,0.6)' }}>
              <ShieldCheck size={16} strokeWidth={2.4} />
            </span>
          </span>
        </Pop>
      </At>
      <At x={R.cx} y={R.cy} cx cy>
        <Resource size={R.size} lit={resLit} />
      </At>
      <At x={R.cx} y={R.cy + 54} cx cy>
        <Label size={14} strong tone={sg ? 'brand' : 'muted'}>
          Security Group
        </Label>
      </At>
      <At x={R.cx} y={R.cy + 84} cx cy>
        <Label size={14} strong mono tone={sg ? 'brand' : 'muted'}>
          s5-demo-sg
        </Label>
      </At>
      {/* an inbound packet: through the subnet, stopped just outside the security group (no inbound rules) */}
      <Traveller path={[[A.x + 30, R.cy], [G.x - 34, R.cy]]} run={blocked && isSg && !STILL} k="lab-sg-in" tone={NET.lit} size={13} dur={2.2} />
      <At x={G.x - 17} y={R.cy} cx cy>
        <span className={blocked && isSg && !STILL ? 'lab-nudge' : ''} style={{ display: 'grid' }}>
          <NoMark size={22} on={blocked} />
        </span>
      </At>
      {/* the network ACL's inbound and outbound rules, either side of the ring, read by the magnifier */}
      <At x={A.x / 2} y={listY} cx cy>
        <RuleList dir="in" on={acl} now={false} locked={locked} />
      </At>
      <At x={A.x + A.w + (SF.W - A.x - A.w) / 2} y={listY} cx cy>
        <RuleList dir="out" on={acl} now={false} locked={locked} />
      </At>
      <div className={acl && !STILL ? 'lab-read' : ''} style={{ position: 'absolute', left: 0, top: 0, opacity: acl ? 1 : 0, transition: `opacity 360ms ${EASE} 300ms`, ['--lab-x0' as string]: `${A.x / 2 - 15}px`, ['--lab-x1' as string]: `${A.x + A.w + (SF.W - A.x - A.w) / 2 - 15}px`, ['--lab-y' as string]: `${listY + 24}px`, transform: `translate(${A.x / 2 - 15}px, ${LIST_TOP - 40}px)` } as CSSProperties}>
        <span className="grid place-items-center rounded-full" style={{ width: 30, height: 30, background: colors.white, color: NET.lit, boxShadow: `inset 0 0 0 2px ${NET.lit}, 0 8px 16px -8px rgba(16,32,58,0.5)` }}>
          <Search size={16} strokeWidth={2.6} />
        </span>
      </div>
    </div>
  )
}

/** The lab's ambient loops: the magnifier running along the subnets (T24-2) and reading the two rule lists (T29-1). */
export const LAB_FIGS_CSS = `
@keyframes lab-scan { 0%, 100% { transform: translateX(0) } 50% { transform: translateX(150px) } }
.lab-scan { animation: lab-scan 5.2s cubic-bezier(0.65,0,0.35,1) infinite; }
@keyframes lab-read { 0% { transform: translate(var(--lab-x0), calc(var(--lab-y) - 30px)) } 22% { transform: translate(var(--lab-x0), calc(var(--lab-y) + 4px)) } 50% { transform: translate(var(--lab-x1), calc(var(--lab-y) - 30px)) } 72% { transform: translate(var(--lab-x1), calc(var(--lab-y) + 4px)) } 100% { transform: translate(var(--lab-x0), calc(var(--lab-y) - 30px)) } }
.lab-read { animation: lab-read 5.6s ease-in-out infinite; }
/* the stopped mark breathes, no rest between beats (R8.1: loops restart at once) */
@keyframes lab-nudge { 0%, 100% { transform: scale(1) } 50% { transform: scale(1.12) } }
.lab-nudge { animation: lab-nudge 1.4s ease-in-out infinite; }
.cc-still .lab-scan, .deck-thumb .lab-scan, .cc-still .lab-read, .deck-thumb .lab-read, .cc-still .lab-nudge, .deck-thumb .lab-nudge { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .lab-scan, .lab-read, .lab-nudge { animation: none !important; } }
`

