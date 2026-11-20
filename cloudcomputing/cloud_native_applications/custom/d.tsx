import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Badge, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, Frame, Show, Plinth, MarkTile, Panel, Wire, Junction, Token, keyframes, loopCls, loopVars, tag, heading, body, useHeld, useHot, type Pt } from '@/engine/figkit'
import { NoteBox } from '@/decks/figures/net/frames'
import lambdaMark from '../images/aws-lambda.svg'
import rdsMark from '../images/aws-rds.svg'
import sqsMark from '../images/aws-sqs.svg'
import cacheMark from '../images/aws-elasticache.svg'
import dynamoMark from '../images/aws-dynamodb.svg'
import s3Mark from '../images/aws-s3.svg'
import asgMark from '../images/aws-ec2-auto-scaling.svg'
import redisMark from '../images/res-elasticache-for-redis.svg'

/*
 * SESSION 18 · SECTION 4 (Statelessness) technical figures, builder D.
 * Built to generate-slides standing correction 17 (Sessions 14-16): 3D icons on plinth tiles, official marks on white
 * tiles, >= 20 px equal padding, orthogonal wires computed from the same constants as the boxes, a flow dot on every
 * wire, a lit item walking first -> last -> first after the build. Loops are transform / opacity on HTML elements only.
 * Held (?still): the full final state of the frame, nothing lit, nothing moving. Class prefix `s18d-`.
 *
 *   slide 33 D_T15   566 x 320  Users -> any stateless instance (Web Front End, API Tier, Lambda) -> one stateful store
 *                               with its identity badge (RDS, SQS, Session Store) (2)
 *   slide 34 D_T15B  566 x 380  stateless: an instance removed, another serves, a replacement launched | stateful:
 *                               the primary restarts, the replica with the same identity takes over (2)
 *   slide 36 D_T16   546 x 340  instances in the centre, wires out to ElastiCache, DynamoDB + RDS, S3; config pulled in (4)
 *   slide 37 D_T17   566 x 360  timeline A (fails 8080) -> Auto Scaling -> B, both wired to one Redis cache (2)
 *   slide 38 D_T17   566 x 360, from 2: the session key and its TTL, B reads it, the user stays logged in (3)
 *   slide 39 D_T18  1080 x 340  Stateless Tier | dimension spine | Stateful Component, one row per press, the TR's
 *                               closing line in a note box under the cards with the last row (4)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('s18d')
const BLUE = colors.brand
const MONO = "'JetBrains Mono', ui-monospace, monospace"
const NOLIG: CSSProperties = { fontVariantLigatures: 'none', fontFeatureSettings: "'liga' 0, 'calt' 0" }
const RIM = 'inset 0 0 0 1.5px #D3DEF6, 0 10px 20px -12px rgba(31,64,140,0.5)'
const LIT = `inset 0 0 0 2.5px ${ORANGE}, 0 10px 22px -12px rgba(255,138,61,0.7)`
const nm = (n: string) => n as Ico3DName

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)
const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })
const mono = (size = 14, color: string = colors.ink): CSSProperties => ({ fontFamily: MONO, ...NOLIG, fontSize: size, fontWeight: 600, lineHeight: 1.2, color, whiteSpace: 'nowrap' })

/** the build of a figure that may be split over two slides (`from`): the global step, the lit item, held */
function useBuild(p: Record<string, unknown>, period: number) {
  const off = Number(p.from ?? 0)
  const cnt = Number(p.steps ?? 1)
  const held = useHeld()
  const step = held ? off + cnt : stepOf(p) + off
  /* figkit's walk starts at item 0 the moment the build ends, so the last press would light the FIRST item; start the
     walk on the last item instead (last -> first -> ... -> last), so the final press lights what it built */
  const raw = useHot(cnt, stepOf(p), period)
  const local = raw >= 0 && stepOf(p) >= cnt ? (raw + cnt - 1) % cnt : raw
  const hot = local < 0 ? -1 : local + off
  return { step, hot, held, s: (n: number) => step >= n, live: !held }
}

/** a 3D icon (or an official mark) on its plinth; the TILE is centred on (x, y); the tag under it, or `side` to its right / left */
function Node({ x, y, label, icon, mark, size = 52, k = 0.74, on = true, lit = false, loop = 'bob', d = 0, t, badge, w = 120, tagSize = 14, dim = false, side, wrap, delay = 0, children }: { x: number; y: number; label?: string; icon?: string; mark?: string; size?: number; k?: number; on?: boolean; lit?: boolean; loop?: Loop; d?: number; t?: number; badge?: Badge; w?: number; tagSize?: number; dim?: boolean; side?: 'right' | 'left'; wrap?: number; delay?: number; children?: ReactNode }) {
  const instant = useInstant()
  const tile = mark ? <MarkTile src={mark} size={size} lit={lit} /> : (
    <Plinth size={size} lit={lit}>
      <Ico3D name={nm(icon ?? 'doc')} size={Math.round(size * k)} loop={loop} d={d} t={t} badge={badge} />
    </Plinth>
  )
  const tileBox = (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0, display: 'grid', placeItems: 'center' }}>
      <div style={{ opacity: dim ? 0.42 : 1, filter: dim ? 'grayscale(1)' : undefined, transition: instant ? 'none' : `opacity 520ms ${EASE}, filter 520ms ${EASE}` }}>{tile}</div>
      {children}
    </div>
  )
  const lab = label ? <span style={{ ...tag(tagSize), ...(wrap ? { whiteSpace: 'normal', width: wrap, textAlign: side === 'left' ? 'right' : side === 'right' ? 'left' : 'center' } : side ? { textAlign: side === 'left' ? 'right' : 'left' } : {}) }}>{label}</span> : null
  if (side) {
    return (
      <Show on={on} delay={delay} style={{ position: 'absolute', top: y - size / 2, height: size, zIndex: 3, display: 'flex', alignItems: 'center', gap: 10, flexDirection: side === 'right' ? 'row' : 'row-reverse', ...(side === 'right' ? { left: x - size / 2 } : { right: `calc(100% - ${x + size / 2}px)` }) }}>
        {tileBox}
        {lab}
      </Show>
    )
  }
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, top: y - size / 2, width: w, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      {tileBox}
      {lab}
    </Show>
  )
}

/** a small white disc on a tile's corner holding a 3D icon; centred on (x, y) of the frame */
function Corner({ x, y, on = true, size = 28, icon, loop = 'beat', d = 0, t = 2.4 }: { x: number; y: number; on?: boolean; size?: number; icon: string; loop?: Loop; d?: number; t?: number }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: 6, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6', display: 'grid', placeItems: 'center', opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}` }}>
      <Ico3D name={nm(icon)} size={size - 7} loop={loop} d={d} t={t} />
    </span>
  )
}

/** a glossy ORANGE cross ball (failure is orange in this course, never red; the engine's `cross` is red) */
function XBall({ size = 22, loop = true, d = 0 }: { size?: number; loop?: boolean; d?: number }) {
  const r = size / 2
  return (
    <span aria-hidden className={loop ? 'i3d i3d-beat' : undefined} style={{ display: 'grid', placeItems: 'center', width: size, height: size, flexShrink: 0, borderRadius: 99, background: 'radial-gradient(circle at 34% 28%, #FFD9BC 0%, #FF9A55 32%, #FF8A3D 55%, #E8642A 82%, #B4461A 100%)', boxShadow: '0 0 0 2px #FFFFFF, 0 4px 8px -3px rgba(180,70,26,0.6)', ['--i3d-d' as string]: `${-d}s`, ['--i3d-t' as string]: '2.2s' } as CSSProperties}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
        <path d={`M ${r * 0.62} ${r * 0.62} L ${r * 1.38} ${r * 1.38} M ${r * 1.38} ${r * 0.62} L ${r * 0.62} ${r * 1.38}`} stroke="#FFFFFF" strokeWidth={Math.max(2.4, size * 0.13)} strokeLinecap="round" />
      </svg>
    </span>
  )
}

/** a white disc carrying a mini 3D icon along a `ride` class; nothing on held frames */
function Rider({ cls, icon, size = 24, on = true }: { cls: string; icon: string; size?: number; on?: boolean }) {
  const held = useHeld()
  if (held || !on) return null
  return (
    <span aria-hidden style={{ position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, zIndex: 7, pointerEvents: 'none' }}>
      <span className={cls} style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -4px rgba(31,64,140,0.55)', opacity: 0 }}>
        <Ico3D name={nm(icon)} size={size - 6} loop="none" />
      </span>
    </span>
  )
}

/** a wire on its own layer above the cards (a Panel is z 2 and would hide a wire drawn inside it); tiles (z 3) stay on top */
const W = (props: Parameters<typeof Wire>[0]) => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}><Wire {...props} /></div>
)

/** a path that never arrives: dashed, faded, an orange cross before its target (Session 15 review) */
function Blocked({ pts, on = true, cross }: { pts: Pt[]; on?: boolean; cross: Pt }) {
  const instant = useInstant()
  return (
    <>
      <W pts={pts} on={on} head={0} dash="5 6" opacity={0.5} />
      <span aria-hidden style={{ ...box(cross[0] - 11, cross[1] - 11, 22, 22), zIndex: 4, display: 'grid', placeItems: 'center', opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE} 300ms` }}>
        <XBall size={22} />
      </span>
    </>
  )
}

/** a card title row: a 3D icon on its plinth and the heading beside it, the row's left edge at x, centred on y */
function TitleRow({ x, y, icon, text, size = 36, lit = false }: { x: number; y: number; icon: string; text: string; size?: number; lit?: boolean }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y - size / 2, height: size, display: 'flex', alignItems: 'center', gap: 10, zIndex: 3 }}>
      <Plinth size={size} lit={lit}><Ico3D name={nm(icon)} size={Math.round(size * 0.74)} loop="bob" /></Plinth>
      <span style={{ ...heading(17), whiteSpace: 'nowrap' }}>{text}</span>
    </div>
  )
}

/* ================================================================== slide 33 · D_T15 · two workload types */

/*
 * 566 x 320. Users (46, 182) -> a junction (106) fanning to the three stateless instances in the Stateless card
 * (x 126..326; tiles at x 170, rows y 112 / 182 / 252, tags to their right). The card's right edge (326, 182) feeds
 * the Stateful card (x 366..546) holding RDS, SQS and the Session Store (tiles at x 410), the identity badge in its
 * title row. Press 1 the stateless tier (a request lands on a different instance each time), press 2 the store.
 */
const A = { W: 566, H: 320, UX: 46, Y: 182, US: 52, J: 106, LX: 126, LW: 200, RX: 366, RW: 180, PY: 20, PH: 280, TS: 48, TY: 50, PER: 4.8 }
const A_ROWS = [112, 182, 252]
const A_LT = A.LX + 20 + A.TS / 2 // 170
const A_RT = A.RX + 20 + A.TS / 2 // 410
const A_LR = A.LX + A.LW // 326
const aBranch = (y: number): Pt[] => (y === A.Y ? [[A.J, y], [A_LT - A.TS / 2, y]] : [[A.J, A.Y], [A.J, y], [A_LT - A.TS / 2, y]])
const A_REQ = A_ROWS.map((y, i) => K.ride(`t15r${i}`, [[A.UX + A.US / 2, A.Y], ...aBranch(y)], 0.1 + i * 1.6, 1.0 + i * 1.6, A.PER))
const A_MID = K.ride('t15m', [[A_LR, A.Y], [A.RX, A.Y]], 1.0, 1.5, 1.6)
const A_SL: { icon?: string; mark?: string; label: string; loop?: Loop }[] = [
  { icon: 'webpage', label: 'Web Front End', loop: 'bob' },
  { icon: 'api', label: 'API Tier', loop: 'pulse' },
  { mark: lambdaMark, label: 'Lambda' },
]
const A_SF: { icon?: string; mark?: string; label: string; loop?: Loop }[] = [
  { mark: rdsMark, label: 'Relational Database' },
  { mark: sqsMark, label: 'Message Queue' },
  { icon: 'database', label: 'Session Store', loop: 'pulse' },
]

const D_T15: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 2 }, 2400)
  return (
    <Frame w={A.W} h={A.H}>
      <Panel x={A.LX} y={A.PY} w={A.LW} h={A.PH} lit={hot === 0} />
      <span style={{ ...box(A.LX + 20, A.TY - 11, A.LW - 40, 22), ...heading(17), zIndex: 3 }}>Stateless</span>
      <Panel x={A.RX} y={A.PY} w={A.RW} h={A.PH} lit={hot === 1} />
      <span style={{ ...box(A.RX + 20, A.TY - 11, 90, 22), ...heading(17), zIndex: 3 }}>Stateful</span>
      {/* the persistent identity the stateful store carries */}
      <Corner x={A.RX + A.RW - 20 - 18} y={A.TY} icon="idcard" size={36} on={s(2)} loop="swing" t={3} />

      {/* users: every request may land on any stateless instance */}
      <W pts={[[A.UX + A.US / 2, A.Y], [A.J, A.Y]]} on={s(1)} head={0} lit={hot === 0} />
      {A_ROWS.map((y) => <W key={y} pts={aBranch(y)} on={s(1)} lit={hot === 0} head={9} />)}
      <Junction x={A.J} y={A.Y} on={s(1)} lit={hot === 0} />
      <Node x={A.UX} y={A.Y} icon="users" size={A.US} w={80} label="Users" d={0.2} />
      {A_SL.map((n, i) => (
        <Node key={n.label} x={A_LT} y={A_ROWS[i]} icon={n.icon} mark={n.mark} size={A.TS} label={n.label} side="right" wrap={102} on={s(1)} delay={i * 120} loop={n.loop} d={i * 0.4} />
      ))}

      {/* the stateless tier keeps its state in the stateful store */}
      <W pts={[[A_LR, A.Y], [A.RX, A.Y]]} on={s(2)} lit={hot === 1} head={9} />
      {A_SF.map((n, i) => (
        <Node key={n.label} x={A_RT} y={A_ROWS[i]} icon={n.icon} mark={n.mark} size={A.TS} label={n.label} side="right" wrap={82} on={s(2)} delay={i * 120} loop={n.loop} d={i * 0.4} />
      ))}

      {A_REQ.map((c, i) => <Token key={i} cls={c} on={s(1)} />)}
      <Token cls={A_MID} on={s(2)} size={9} />
    </Frame>
  )
}

/* ================================================================== slide 34 · D_T15B · replace and fail over */

/*
 * 566 x 380. Stateless card x 20..273, Stateful card x 293..546, both y 20..360, a title row each (the point's icon).
 * Left: Users (146, 108) down to a bus (y 160) and three instances (x 76 / 146 / 216, y 214); the third is removed
 * (its drop dashed with a cross, the tile greyed) and its replacement launched under it (216, 300). The request rides
 * to the middle instance. Right: an Instance (419, 116) down to a bus (y 176), the Primary (369, 250) restarting (its
 * drop dashed with a cross) and the Replica (469, 250) taking over, both with the same identity badge; the primary
 * replicates into the replica.
 */
const B = { W: 566, H: 380, LX: 20, RX: 293, CW: 253, Y: 20, CH: 340, TY: 52, TS: 48, PER: 3.2 }
const B_RC = 419 // the right card centre
const B_UY = 108
const B_BUS = 160
const B_IY = 214
const B_NY = 300
const B_IX = [76, 146, 216]
const B_UB = B_UY + 26
const B_DROP = (x: number): Pt[] => (x === B_IX[1] ? [[x, B_UB], [x, B_IY - B.TS / 2]] : [[B_IX[1], B_UB], [B_IX[1], B_BUS], [x, B_BUS], [x, B_IY - B.TS / 2]])
const B_REQ = K.ride('t15br', B_DROP(B_IX[1]), 0.1, 0.9, 1.6)
const B_REQ0 = K.ride('t15b0', B_DROP(B_IX[0]), 0.9, 1.5, 1.6)
const B_NEW: Pt[] = [[B_IX[2], B_IY + B.TS / 2], [B_IX[2], B_NY - B.TS / 2]]
const B_NEWR = K.ride('t15bn', B_NEW, 0.2, 0.9, 1.6)
const B_SY = 120
const B_SB = B_SY + 24
const B_RBUS = 186
const B_DY = 270
const B_DX = [362, 476]
const B_RDROP = (x: number): Pt[] => [[B_RC, B_SB], [B_RC, B_RBUS], [x, B_RBUS], [x, B_DY - B.TS / 2]]
const B_REP: Pt[] = [[B_DX[0] + B.TS / 2, B_DY], [B_DX[1] - B.TS / 2, B_DY]]
const B_RREQ = K.ride('t15bq', B_RDROP(B_DX[1]), 0.1, 1.0, 1.6)
const B_RREP = K.ride('t15bp', B_REP, 0.2, 0.9, 1.6)

const D_T15B: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 2 }, 2400)
  return (
    <Frame w={B.W} h={B.H}>
      <Panel x={B.LX} y={B.Y} w={B.CW} h={B.CH} lit={hot === 0} />
      <TitleRow x={B.LX + 20} y={B.TY} icon="refresh" text="Stateless" />
      <Panel x={B.RX} y={B.Y} w={B.CW} h={B.CH} lit={hot === 1} />
      <TitleRow x={B.RX + 20} y={B.TY} icon="idcard" text="Stateful" />

      {/* point 1: one instance removed, another serves the same request, a replacement launched */}
      <Node x={B_IX[1]} y={B_UY} icon="users" size={B.TS + 4} label="Users" side="right" on={s(1)} d={0.2} />
      <W pts={B_DROP(B_IX[1])} on={s(1)} lit={hot === 0} head={9} />
      <W pts={B_DROP(B_IX[0])} on={s(1)} lit={hot === 0} head={9} />
      <Blocked pts={[[B_IX[1], B_BUS], [B_IX[2], B_BUS], [B_IX[2], B_IY - B.TS / 2 - 2]]} on={s(1)} cross={[B_IX[2], (B_BUS + B_IY - B.TS / 2) / 2]} />
      <Junction x={B_IX[1]} y={B_BUS} on={s(1)} lit={hot === 0} />
      {B_IX.map((x, i) => (
        <Node key={x} x={x} y={B_IY} icon="server" size={B.TS} on={s(1)} delay={i * 100} dim={i === 2} d={i * 0.4} lit={hot === 0 && i < 2} />
      ))}
      <W pts={B_NEW} on={s(1)} lit={hot === 0} head={8} delay={300} />
      <Node x={B_IX[2]} y={B_NY} icon="server" size={B.TS} label="Replacement" side="left" on={s(1)} delay={300} lit={hot === 0} d={0.8}>
        <Corner x={B.TS - 4} y={4} icon="refresh" on={s(1)} size={26} loop="spin" t={6} />
      </Node>

      {/* point 2: the primary restarts, the replica with the same identity takes over */}
      <Node x={B_RC} y={B_SY} icon="server" size={B.TS} label="Instance" side="right" on={s(2)} d={0.3} />
      <W pts={B_RDROP(B_DX[1])} on={s(2)} lit={hot === 1} head={9} />
      <Blocked pts={B_RDROP(B_DX[0]).map(([x, y], i, a) => (i === a.length - 1 ? [x, y - 2] : [x, y])) as Pt[]} on={s(2)} cross={[B_DX[0], B_RBUS + 21]} />
      <Junction x={B_RC} y={B_RBUS} on={s(2)} lit={hot === 1} />
      <W pts={B_REP} on={s(2)} lit={hot === 1} head={8} delay={200} />
      <Node x={B_DX[0]} y={B_DY} mark={rdsMark} size={B.TS} label="Primary" on={s(2)} dim w={96}>
        <Corner x={-2} y={2} icon="refresh" on={s(2)} size={26} loop="spin" t={6} />
        <Corner x={B.TS + 2} y={2} icon="idcard" on={s(2)} size={26} loop="swing" t={3} />
      </Node>
      <Node x={B_DX[1]} y={B_DY} mark={rdsMark} size={B.TS} label="Replica" on={s(2)} delay={150} w={96} lit={hot === 1}>
        <Corner x={B.TS + 2} y={2} icon="idcard" on={s(2)} size={26} loop="swing" t={3} d={0.4} />
      </Node>

      <Token cls={B_REQ} on={s(1)} />
      <Token cls={B_REQ0} on={s(1)} />
      <Token cls={B_NEWR} on={s(1)} size={8} />
      <Token cls={B_RREQ} on={s(2)} />
      <Token cls={B_RREP} on={s(2)} size={8} />
    </Frame>
  )
}

/* ================================================================== slide 36 · D_T16 · where state lives */

/*
 * 546 x 340. The Instances card in the centre (x 203..343, y 110..222). Out of its left edge (y 166) to ElastiCache
 * (80, 166); right edge to S3 (466, 166); bottom edge (273, 222) to a junction (y 246) branching to DynamoDB (200, 292)
 * and RDS (346, 292); the config store (273, 50) feeds the card's top edge (configuration is pulled in). Press N shows
 * and lights service N (the points' order).
 */
const C = { W: 546, H: 340, X0: 203, X1: 343, Y0: 110, Y1: 222, CX: 273, CY: 166, NS: 56, LX: 80, RX: 466, JY: 246, DBY: 292, DX: [200, 346] as const, GY: 50, PER: 4 }
const C_H = C.NS / 2
const C_WL: Pt[] = [[C.X0, C.CY], [C.LX + C_H, C.CY]]
const C_WR: Pt[] = [[C.X1, C.CY], [C.RX - C_H, C.CY]]
const C_WG: Pt[] = [[C.CX, C.GY + C_H], [C.CX, C.Y0]]
const C_WD = C.DX.map((x): Pt[] => [[C.CX, C.Y1], [C.CX, C.JY], [x, C.JY], [x, C.DBY - C_H]])
const C_RL = K.ride('t16l', C_WL, 0.1, 0.9, C.PER)
const C_RD = C_WD.map((pts, i) => K.ride(`t16d${i}`, pts, 1.1, 1.9, C.PER))
const C_RR = K.ride('t16r', C_WR, 2.1, 2.9, C.PER)
const C_RG = K.ride('t16g', C_WG, 3.0, 3.6, C.PER)

const D_T16: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 4 }, 1800)
  return (
    <Frame w={C.W} h={C.H}>
      <Panel x={C.X0} y={C.Y0} w={C.X1 - C.X0} h={C.Y1 - C.Y0} />
      {[C.CX - 32, C.CX + 32].map((x, i) => (
        <span key={x} style={{ ...box(x - 22, C.Y0 + 20, 44, 44), zIndex: 3 }}>
          <Plinth size={44}><Ico3D name="server" size={33} loop="bob" d={i * 0.6} /></Plinth>
        </span>
      ))}
      <span style={{ ...box(C.X0, C.Y0 + 72, C.X1 - C.X0, 18), ...tag(14), zIndex: 3 }}>Instances</span>

      {/* 1 · session and cache data: ElastiCache */}
      <W pts={C_WL} on={s(1)} lit={hot === 0} />
      <Node x={C.LX} y={C.CY} mark={cacheMark} size={C.NS} label="ElastiCache" on={s(1)} lit={hot === 0} />

      {/* 2 · durable records: DynamoDB or RDS */}
      {C_WD.map((pts, i) => <W key={i} pts={pts} on={s(2)} lit={hot === 1} delay={i * 120} />)}
      <Junction x={C.CX} y={C.JY} on={s(2)} lit={hot === 1} />
      <Node x={C.DX[0]} y={C.DBY} mark={dynamoMark} size={C.NS} label="DynamoDB" side="left" on={s(2)} lit={hot === 1} />
      <Node x={C.DX[1]} y={C.DBY} mark={rdsMark} size={C.NS} label="RDS" side="right" on={s(2)} lit={hot === 1} delay={120} />

      {/* 3 · uploaded files and binaries: S3 */}
      <W pts={C_WR} on={s(3)} lit={hot === 2} />
      <Node x={C.RX} y={C.CY} mark={s3Mark} size={C.NS} label="S3" on={s(3)} lit={hot === 2} />

      {/* 4 · configuration and secrets, pulled from a config store */}
      <W pts={C_WG} on={s(4)} lit={hot === 3} />
      <Node x={C.CX} y={C.GY} icon="gear" size={C.NS} label="Config Store" side="right" on={s(4)} lit={hot === 3} loop="spin" t={8} />

      <Rider cls={C_RL} icon="key" size={22} on={s(1)} />
      {C_RD.map((c, i) => <Rider key={i} cls={c} icon="doc" size={22} on={s(2)} />)}
      <Rider cls={C_RR} icon="upload" size={22} on={s(3)} />
      <Token cls={C_RG} on={s(4)} size={9} />
    </Frame>
  )
}

/* ================================================================== slides 37-38 · D_T17 · the session survives the swap */

/*
 * One 566 x 360 stage for both frames. The timeline runs down the left: instance A's card (x 20..310, y 20..120: the
 * server tile, its ID, its IP and the health check on 8080), Auto Scaling (165, 175), instance B's card (x 20..310,
 * y 230..340). Both cards wire out of their right edges to the one Redis cache card (x 340..546, y 108..248): A on
 * y 70 into its top, B on y 272 into its bottom, both at x 448. The user's laptop (500, 304) sends to B on y 304.
 * Global presses: 1 A fails, 2 Auto Scaling launches B | 3 the session key, 4 B reads it, 5 the user stays logged in.
 */
const D = { W: 566, H: 360, CX0: 20, CX1: 310, AY0: 20, AY1: 120, BY0: 230, BY1: 340, TX: 62, TS: 48, TXT: 104, SX: 165, SY: 175, SS: 48, KX0: 340, KX1: 546, KY0: 108, KY1: 248, KW: 448, AW: 70, BW: 272, LX: 500, LY: 304, LS: 48, PER: 3.2 }
const D_WA: Pt[] = [[D.CX1, D.AW], [D.KW, D.AW], [D.KW, D.KY0]]
const D_WB: Pt[] = [[D.CX1, D.BW], [D.KW, D.BW], [D.KW, D.KY1]]
const D_WL: Pt[] = [[D.LX - D.LS / 2, D.LY], [D.CX1, D.LY]]
const D_RA = K.ride('t17a', D_WA, 0.1, 1.0, D.PER)
const D_RB = K.ride('t17b', D_WB, 0.6, 1.3, D.PER)
const D_RK = K.ride('t17k', [...D_WB].reverse() as Pt[], 1.5, 2.4, D.PER)
const D_RL = K.ride('t17l', D_WL, 0.0, 0.55, D.PER)
const D_RS = K.ride('t17s', [[D.SX, D.AY1], [D.SX, D.SY - D.SS / 2]], 0.2, 0.8, 1.6)
const D_RS2 = K.ride('t17s2', [[D.SX, D.SY + D.SS / 2], [D.SX, D.BY0]], 0.9, 1.5, 1.6)

function InstanceCard({ y0, y1, id, lit, dim, children }: { y0: number; y1: number; id: string; lit: boolean; dim?: boolean; children: ReactNode }) {
  const instant = useInstant()
  const cy = (y0 + y1) / 2
  return (
    <>
      <div data-fk="card" style={{ ...box(D.CX0, y0, D.CX1 - D.CX0, y1 - y0), zIndex: 2, borderRadius: 16, background: '#FFFFFF', boxShadow: lit ? LIT : RIM, transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }} />
      <span style={{ ...box(D.TX - D.TS / 2, cy - D.TS / 2, D.TS, D.TS), zIndex: 3, opacity: dim ? 0.42 : 1, filter: dim ? 'grayscale(1)' : undefined, transition: instant ? 'none' : `opacity 520ms ${EASE}, filter 520ms ${EASE}` }}>
        <Plinth size={D.TS}><Ico3D name="server" size={36} loop="bob" /></Plinth>
      </span>
      <span data-id style={{ ...box(D.TXT, cy - 29, D.CX1 - D.TXT - 20, 20), ...mono(14), zIndex: 3 }}>{id}</span>
      <div style={{ ...box(D.TXT, cy + 4, D.CX1 - D.TXT - 20, 26), zIndex: 3, display: 'flex', alignItems: 'center', gap: 8 }}>{children}</div>
    </>
  )
}

const D_T17: Fig = (p) => {
  const { hot, s, held } = useBuild({ ...p, steps: p.steps ?? 2 }, 2000)
  const failed = s(1)
  return (
    <Frame w={D.W} h={D.H}>
      {/* instance A: the health check on 8080 fails (press 1) */}
      <InstanceCard y0={D.AY0} y1={D.AY1} id="i-0a1b2c3d4e5f67890" lit={hot === 0} dim={failed}>
        <span style={mono(14)}>10.0.1.15</span>
        <span style={{ width: 6 }} />
        <Ico3D name={nm('heartbeat')} size={26} loop="beat" t={1.4} />
        <span style={mono(14, failed ? colors.accentDark : colors.ink)}>8080</span>
        <span style={{ display: 'grid', placeItems: 'center', width: 22, height: 22, opacity: failed ? 1 : 0, transition: held ? 'none' : `opacity 420ms ${EASE}` }}>
          <XBall size={22} d={0.3} />
        </span>
      </InstanceCard>
      <span style={{ ...box(D.TX + D.TS / 2 - 4 - 12, (D.AY0 + D.AY1) / 2 - D.TS / 2 + 4 - 12, 24, 24), zIndex: 6, opacity: failed ? 1 : 0, transition: held ? 'none' : `opacity 420ms ${EASE}` }}><XBall size={24} /></span>

      {/* Auto Scaling launches instance B (press 2): the timeline runs down */}
      <W pts={[[D.SX, D.AY1], [D.SX, D.SY - D.SS / 2]]} on={s(2)} lit={hot === 1} head={8} />
      <W pts={[[D.SX, D.SY + D.SS / 2], [D.SX, D.BY0]]} on={s(2)} lit={hot === 1} head={8} delay={200} />
      <Node x={D.SX} y={D.SY} mark={asgMark} size={D.SS} label="Auto Scaling" side="right" on={s(2)} lit={hot === 1} />
      <Show on={s(2)} delay={250} style={{ position: 'absolute', inset: 0 }}>
        <InstanceCard y0={D.BY0} y1={D.BY1} id="i-0f9e8d7c6b5a43210" lit={hot === 1 || hot === 3}>
          <span style={tag(14, colors.brandDeep)}>Replacement</span>
        </InstanceCard>
      </Show>
      <Corner x={D.TX + D.TS / 2 - 4} y={(D.BY0 + D.BY1) / 2 - D.TS / 2 + 4} icon="check" on={s(2)} size={26} loop="pulse" />

      {/* the one shared Redis cache both instances point to */}
      <Panel x={D.KX0} y={D.KY0} w={D.KX1 - D.KX0} h={D.KY1 - D.KY0} />
      {/* until the session key is shown (press 3) the title row sits in the card's middle */}
      <div style={{ ...box(D.KX0 + 20, D.KY0 + 16, D.KX1 - D.KX0 - 40, 40), zIndex: 3, display: 'flex', alignItems: 'center', gap: 10, transform: s(3) ? 'none' : `translateY(${(D.KY1 - D.KY0) / 2 - 36}px)`, transition: held ? 'none' : `transform 520ms ${EASE}` }}>
        <MarkTile src={redisMark} size={38} />
        <span style={{ ...heading(16), whiteSpace: 'nowrap' }}>ElastiCache</span>
      </div>
      <Show on={s(3)} style={{ ...box(D.KX0 + 20, D.KY0 + 74, D.KX1 - D.KX0 - 40, 46), zIndex: 3, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Plinth size={40} lit={hot === 2}><Ico3D name="key" size={30} loop="tilt" /></Plinth>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={mono(14)}>sess_7f3a2b</span>
          <span style={mono(14, colors.brandDark)}>30-minute TTL</span>
        </div>
      </Show>
      <W pts={D_WA} lit={hot === 0} head={9} />
      <W pts={D_WB} on={s(2)} lit={hot === 3} head={9} delay={300} />

      {/* the user's laptop: still logged in through the swap (press 5) */}
      <W pts={D_WL} on={s(5)} lit={hot === 4} head={9} />
      <Node x={D.LX} y={D.LY} icon="laptop" size={D.LS} on={s(5)} lit={hot === 4} d={0.3}>
        <Corner x={D.LS - 2} y={2} icon="check" on={s(5)} size={26} loop="pulse" />
      </Node>
      <Show on={s(5)} style={{ ...box(D.LX - 40, D.LY - D.LS / 2 - 26, 80, 18), ...tag(14), zIndex: 3 }}>User</Show>

      {/* flow: A while it lived; then requests reach B, B reads the key */}
      {!s(2) && <Token cls={D_RA} />}
      <Token cls={D_RS} on={s(2) && !s(3)} size={8} />
      <Token cls={D_RS2} on={s(2) && !s(3)} size={8} />
      <Token cls={D_RB} on={s(2)} />
      <Rider cls={D_RK} icon="key" size={22} on={s(4)} />
      <Token cls={D_RL} on={s(5)} size={9} />
    </Frame>
  )
}

/* ================================================================== slide 39 · D_T18 · trade-offs compared */

/*
 * 1080 x 340 (lead layout). Stateless Tier card x 20..420, the dimension spine x 440..640 (icon tile + name per row,
 * no card), Stateful Component card x 660..1060; both cards y 20..236: a 58 px header (3D icon + title: Stateless
 * `cubes`, Stateful `database` with the `idcard` identity badge), four 38 px rows from y 78.
 * One row per press across all three columns. The TR's closing line in a blue NoteBox (y 252..320) with the last row.
 */
const E = { W: 1080, H: 340, LX: 20, CW: 400, SX: 440, SW: 200, RX: 660, Y: 20, HH: 58, RH: 38, NY: 252 }
const E_ROWS: { icon: string; dim: string; a: string; b: string; loop: Loop }[] = [
  { icon: 'chart', dim: 'Scaling', a: 'Add/remove instances freely', b: 'Needs replication or sharding', loop: 'bob' },
  { icon: 'refresh', dim: 'Failure recovery', a: 'Any instance can be replaced', b: 'Requires data recovery or failover', loop: 'spin' },
  { icon: 'server', dim: 'Typical services', a: 'Web/API servers, Lambda', b: 'Databases, message brokers', loop: 'bob' },
  { icon: 'coin', dim: 'Design cost', a: 'Extra hop to backing store', b: 'Built-in persistence complexity', loop: 'float' },
]
const E_CH = E.HH + E_ROWS.length * E.RH + 6 // 216
const rowY = (i: number) => E.Y + E.HH + i * E.RH + E.RH / 2

function TradeCard({ x, title, icon, cells, s, hot, badge }: { x: number; title: string; icon: string; cells: string[]; s: (n: number) => boolean; hot: number; badge?: string }) {
  const instant = useInstant()
  return (
    <>
      <Panel x={x} y={E.Y} w={E.CW} h={E_CH} />
      {/* the header: the card's 3D icon on its plinth beside the title, centred together */}
      <div style={{ ...box(x + 24, E.Y + 12, E.CW - 48, 34), zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 34, height: 34 }}>
          <Plinth size={34}><Ico3D name={nm(icon)} size={26} loop="bob" d={x > E.SX ? 0.6 : 0} /></Plinth>
          {badge && <Corner x={33} y={3} icon={badge} size={22} loop="swing" t={3} />}
        </span>
        <span style={{ ...heading(19, colors.brandDeep), whiteSpace: 'nowrap' }}>{title}</span>
      </div>
      <span aria-hidden style={{ ...box(x + 24, E.Y + E.HH - 1, E.CW - 48, 2), background: colors.line, borderRadius: 1, zIndex: 3 }} />
      {cells.map((c, i) => (
        <Show key={i} on={s(i + 1)} delay={x > E.SX ? 120 : 0} style={{ ...box(x + 12, rowY(i) - E.RH / 2 + 3, E.CW - 24, E.RH - 6), zIndex: 3 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 12, background: hot === i ? 'rgba(255,138,61,0.10)' : 'transparent', boxShadow: hot === i ? `inset 0 0 0 2px ${ORANGE}` : 'none', transition: instant ? 'none' : `background 420ms ${EASE}, box-shadow 420ms ${EASE}` }} />
          <span style={{ ...body(17), position: 'absolute', left: 12, right: 12, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>{c}</span>
        </Show>
      ))}
    </>
  )
}

const D_T18: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 4 }, 1800)
  return (
    <Frame w={E.W} h={E.H}>
      <TradeCard x={E.LX} title="Stateless Tier" icon="cubes" cells={E_ROWS.map((r) => r.a)} s={s} hot={hot} />
      <TradeCard x={E.RX} title="Stateful Component" icon="database" badge="idcard" cells={E_ROWS.map((r) => r.b)} s={s} hot={hot} />
      {E_ROWS.map((r, i) => (
        <Show key={r.dim} on={s(i + 1)} delay={60} style={{ ...box(E.SX, rowY(i) - 16, E.SW, 32), zIndex: 3, display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 16 }}>
          <Plinth size={32} lit={hot === i}><Ico3D name={nm(r.icon)} size={24} loop={r.loop} t={r.loop === 'spin' ? 6 : undefined} d={i * 0.4} /></Plinth>
          <span style={{ ...heading(16), whiteSpace: 'nowrap' }}>{r.dim}</span>
        </Show>
      ))}
      <Show on={s(4)} delay={300} style={{ ...box(E.LX, E.NY, E.W - 2 * E.LX, E.H - E.NY - 20), zIndex: 3, display: 'flex', alignItems: 'center' }}>
        <NoteBox tone={colors.brand} w="100%" size={16} bg="linear-gradient(135deg, #F0F5FF 0%, #DDE8FF 100%)" rim="#B9CEFB" glow="rgba(45,99,251,0.45)">Removing state from compute lets every instance be treated as interchangeable, the assumption the scaling and resilience patterns build on directly</NoteBox>
      </Show>
    </Frame>
  )
}

export const figures: Record<string, Fig> = { D_T15, D_T15B, D_T16, D_T17, D_T18 }

export const css = `
${K.css()}
`
void loopCls
void loopVars
void BLUE
