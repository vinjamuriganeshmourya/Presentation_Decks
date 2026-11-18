import { useId, type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Badge, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, PAD, Frame, Show, Plinth, MarkTile, Panel, Wire, Junction, Token, keyframes, loopCls, loopVars, tag, heading, useHeld, useHot, type Pt } from '@/engine/figkit'
import roleMark from '../images/res-iam-role.svg'
import bucketMark from '../images/res-s3-bucket.svg'
import aaMark from '../images/res-iam-access-analyzer.svg'
import ctMark from '../images/aws-cloudtrail.svg'

/*
 * SESSION 14 · SECTION 2 (Principle of Least Privilege) · builder B
 *   slide 15 B_T06   546 x 330  the four tightening levers as rings of a funnel, Broad Access -> Exact Need (4 steps)
 *   slide 16 B_T07   566 x 330  broad vs scoped policy snippets, separate statements, blast-radius rings (4)
 *   slide 17 B_T08   546 x 330  `*` / `*` snippet ringed, unlocked padlock, a row of doors, a leaked key (4)
 *   slide 19 B_T09   546 x 330  identity policy and permission boundary discs, only the overlap Effective (4)
 *   slide 22 B_T10B 1080 x 360  the four passes as a shrinking funnel of rows, Start -> Observe -> Narrow -> Cap (4)
 *
 * Standing correction 17: 3D icons on plinth tiles, official marks on white tiles, >= 20 px padding (PAD), orthogonal
 * wires computed from the same constants as the shapes, a flow dot on every wire, the lit item walking first -> last ->
 * first after the build (useHot). Loops are transform / opacity on HTML elements or root <svg>s only. Held (?still):
 * the full final state, nothing lit, nothing moving. Code values only from the TR (TR 7, 8, 10). Class prefix `t14b-`.
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('t14b')
const BLUE = colors.brand
const INK = colors.ink
const MUTED = colors.muted
const PALE = '#C3D3F5'
const MONO = "'Fira Code', ui-monospace, monospace"
const NOLIG: CSSProperties = { fontVariantLigatures: 'none', fontFeatureSettings: '"liga" 0, "calt" 0' }

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)
const tr = (instant: boolean, what = 'opacity', ms = 520, delay = 0) => (instant ? 'none' : `${what} ${ms}ms ${EASE} ${delay}ms`)

/** a tile whose centre is (x, y), its Title Case tag under it (or beside it, `side`) */
function Node({ x, y, size, label, children, w = 130, on = true, delay = 0, tagSize = 14, side = false }: { x: number; y: number; size: number; label: string; children: ReactNode; w?: number; on?: boolean; delay?: number; tagSize?: number; side?: boolean }) {
  if (side)
    return (
      <Show on={on} delay={delay} style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, height: size, zIndex: 3, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: size, height: size, display: 'grid', placeItems: 'center' }}>{children}</div>
        <span style={{ ...tag(tagSize), textAlign: 'left' }}>{label}</span>
      </Show>
    )
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, top: y - size / 2, width: w, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ width: size, height: size, display: 'grid', placeItems: 'center' }}>{children}</div>
      <span style={tag(tagSize)}>{label}</span>
    </Show>
  )
}

const tile = (name: Ico3DName, o: { size?: number; lit?: boolean; warm?: boolean; loop?: Loop; d?: number; t?: number; badge?: Badge; k?: number } = {}) => (
  <Plinth size={o.size ?? 56} lit={o.lit} warm={o.warm}>
    <Ico3D name={name} size={Math.round((o.size ?? 56) * (o.k ?? 0.74))} loop={o.loop ?? 'bob'} d={o.d ?? 0} t={o.t} badge={o.badge} />
  </Plinth>
)

/** a small 3D icon riding a `ride` class (placed from the frame's 0,0); nothing on held frames */
function Rider({ cls, name, size = 26, on = true, badge }: { cls: string; name: Ico3DName; size?: number; on?: boolean; badge?: Badge }) {
  const held = useHeld()
  if (held || !on) return null
  return (
    <span aria-hidden style={{ position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, zIndex: 6, pointerEvents: 'none' }}>
      <span className={cls} style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 8, background: '#FFFFFF', boxShadow: `0 6px 14px -8px rgba(31,64,140,0.7), inset 0 0 0 1.5px ${ORANGE}`, opacity: 0 }}>
        <Ico3D name={name} size={Math.round(size * 0.78)} loop="none" badge={badge} />
      </span>
    </span>
  )
}

/** one line of policy JSON: keys blue, strings ink, punctuation muted; `hi` gives it the blue text highlight */
function Json({ text, hi = false, size = 12, children }: { text: string; hi?: boolean; size?: number; children?: ReactNode }) {
  const instant = useInstant()
  const out: ReactNode[] = []
  const re = /("[^"]*")(\s*:)?/g
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(<span key={k++} style={{ color: MUTED }}>{text.slice(last, m.index)}</span>)
    out.push(<span key={k++} style={{ color: m[2] ? BLUE : INK, fontWeight: m[2] ? 600 : 500 }}>{m[1]}</span>)
    if (m[2]) out.push(<span key={k++} style={{ color: MUTED }}>{m[2]}</span>)
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(<span key={k++} style={{ color: MUTED }}>{text.slice(last)}</span>)
  return (
    <div style={{ fontFamily: MONO, fontSize: size, lineHeight: 1.55, whiteSpace: 'pre', ...NOLIG }}>
      <span style={{ display: 'inline-block', padding: '0 4px', margin: '0 -4px', borderRadius: 5, background: hi ? '#E3ECFF' : 'rgba(227,236,255,0)', boxShadow: hi ? `inset 0 0 0 1.5px ${BLUE}55` : 'none', transition: tr(instant, 'background', 420) }}>
        {out}
        {children}
      </span>
    </div>
  )
}

/* ================================================================== slide 15 · B_T06 · the funnel of four levers */

/*
 * 546 x 330. A funnel seen a little from above, axis x = F.CX: the wide Broad Access disc at its mouth (y 40), four
 * lever rings on its wall (Scoping, Wildcards, Boundaries, Tightening), a spout, and the small Exact Need disc. Every
 * ring sits ON the wall line (rx from the same linear map), each row tagged in a tile column at F.TX. Press N pulls
 * lever N: its ring lights and the grant (the blue stream) flows down through it, narrower. Loop: dots fall through.
 */
const F = { W: 546, H: 330, CX: 180, R0: 150, R4: 40, SP: 16, SPY: 252, SPB: 278, DY: 285, DR: 34, TX: 376, TS: 40, Q: 0.13 }
const F_Y = [40, 88, 136, 184, 232]
const fRx = (y: number) => F.R0 - ((F.R0 - F.R4) * (y - F_Y[0])) / (F_Y[4] - F_Y[0])
const F_RX = F_Y.map(fRx)
const F_ROWS: { label: string; icon: Ico3DName; y: number; edge: number }[] = [
  { label: 'Broad Access', icon: 'unlock', y: F_Y[0], edge: F.CX + F.R0 },
  { label: 'Scoping', icon: 'target', y: F_Y[1], edge: F.CX + F_RX[1] },
  { label: 'Wildcards', icon: 'asterisk', y: F_Y[2], edge: F.CX + F_RX[2] },
  { label: 'Boundaries', icon: 'shield', y: F_Y[3], edge: F.CX + F_RX[3] },
  { label: 'Tightening', icon: 'filter', y: F_Y[4], edge: F.CX + F_RX[4] },
  { label: 'Exact Need', icon: 'check', y: F.DY, edge: F.CX + F.DR },
]
const fSeg = (k: number) => {
  const a = F_Y[k - 1]
  const b = F_Y[k]
  return `${F.CX - F_RX[k - 1]},${a} ${F.CX + F_RX[k - 1]},${a} ${F.CX + F_RX[k]},${b} ${F.CX - F_RX[k]},${b}`
}
const F_SPOUT = `${F.CX - F.R4},${F_Y[4]} ${F.CX + F.R4},${F_Y[4]} ${F.CX + F.SP},${F.SPY} ${F.CX + F.SP},${F.SPB} ${F.CX - F.SP},${F.SPB} ${F.CX - F.SP},${F.SPY}`
const F_WALL = `${F.CX - F.R0},${F_Y[0]} ${F.CX + F.R0},${F_Y[0]} ${F.CX + F.R4},${F_Y[4]} ${F.CX + F.SP},${F.SPY} ${F.CX + F.SP},${F.SPB} ${F.CX - F.SP},${F.SPB} ${F.CX - F.SP},${F.SPY} ${F.CX - F.R4},${F_Y[4]}`
const F_DROPS = [-0.62, -0.2, 0.22, 0.6].map((o, i) =>
  K.ride(`f${i}`, [...F_Y.map((y, k): Pt => [F.CX + o * F_RX[k] * 0.8, k === 0 ? y + 8 : y]), [F.CX + o * F.SP * 0.6, F.SPY], [F.CX + o * F.SP * 0.6, F.SPB]], i * 0.6, i * 0.6 + 1.7, 2.4),
)

const B_T06: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const instant = useInstant()
  const hot = useHot(4, step, 1600)
  const gid = 't14b-f' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const on = (k: number) => held || step >= k
  const full = (children: ReactNode, style?: CSSProperties) => (
    <svg aria-hidden width={F.W} height={F.H} viewBox={`0 0 ${F.W} ${F.H}`} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', ...style }}>
      {children}
    </svg>
  )
  return (
    <Frame w={F.W} h={F.H}>
      {/* the funnel wall */}
      {full(
        <>
          <defs>
            <linearGradient id={`${gid}w`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#E3EBFF" />
              <stop offset="0.5" stopColor="#F7F9FF" />
              <stop offset="1" stopColor="#DCE6FF" />
            </linearGradient>
          </defs>
          <polygon points={F_WALL} fill={`url(#${gid}w)`} stroke={PALE} strokeWidth={1.6} strokeLinejoin="round" />
        </>,
        { zIndex: 1 },
      )}
      {/* the stream: one segment per lever, each flowing in from the top when its lever is pulled */}
      {[1, 2, 3, 4, 5].map((k) => {
        const top = k === 5 ? F_Y[4] : F_Y[k - 1]
        const shown = on(Math.min(k, 4))
        return (
          <svg key={k} aria-hidden width={F.W} height={F.H} viewBox={`0 0 ${F.W} ${F.H}`} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', zIndex: 2, opacity: shown ? 1 : 0, transform: shown ? 'none' : 'scaleY(0.2)', transformOrigin: `${F.CX}px ${top}px`, transition: instant ? 'none' : `opacity 520ms ${EASE} ${k === 5 ? 320 : 0}ms, transform 620ms ${EASE} ${k === 5 ? 320 : 0}ms` }}>
            <defs>
              <linearGradient id={`${gid}s${k}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#5C86FF" />
                <stop offset="0.45" stopColor="#8DB0FF" />
                <stop offset="1" stopColor={BLUE} />
              </linearGradient>
            </defs>
            <polygon points={k === 5 ? F_SPOUT : fSeg(k)} fill={`url(#${gid}s${k})`} opacity={0.82} />
          </svg>
        )
      })}
      {/* the four lever rings, on the wall */}
      {full(
        <>
          {[1, 2, 3, 4].map((k) => {
            const lit = hot === k - 1
            return <ellipse key={k} cx={F.CX} cy={F_Y[k]} rx={F_RX[k]} ry={Math.max(5, F_RX[k] * F.Q)} fill="none" stroke={lit ? ORANGE : on(k) ? colors.brandDark : PALE} strokeWidth={lit ? 4 : 3} style={{ transition: tr(instant, 'stroke', 420) }} />
          })}
        </>,
        { zIndex: 3 },
      )}
      {/* the two discs: Broad Access at the mouth, Exact Need under the spout */}
      {full(
        <>
          <defs>
            <linearGradient id={`${gid}d`} x1="0" y1="0" x2="0.3" y2="1">
              <stop offset="0" stopColor="#8DB0FF" />
              <stop offset="0.5" stopColor={BLUE} />
              <stop offset="1" stopColor="#1640C8" />
            </linearGradient>
          </defs>
          <ellipse cx={F.CX} cy={F_Y[0] + 5} rx={F.R0} ry={F.R0 * F.Q} fill="#0D2A8C" />
          <ellipse cx={F.CX} cy={F_Y[0]} rx={F.R0} ry={F.R0 * F.Q} fill={`url(#${gid}d)`} />
          <ellipse cx={F.CX - 30} cy={F_Y[0] - 6} rx={F.R0 * 0.5} ry={F.R0 * F.Q * 0.3} fill="#FFFFFF" opacity={0.35} />
        </>,
        { zIndex: 4 },
      )}
      {full(
        <>
          <ellipse cx={F.CX} cy={F.DY + 5} rx={F.DR} ry={F.DR * 0.27} fill="#0D2A8C" />
          <ellipse cx={F.CX} cy={F.DY} rx={F.DR} ry={F.DR * 0.27} fill={`url(#${gid}d)`} stroke={hot === 3 ? ORANGE : 'none'} strokeWidth={3} />
          <ellipse cx={F.CX - 8} cy={F.DY - 3} rx={F.DR * 0.45} ry={F.DR * 0.07} fill="#FFFFFF" opacity={0.4} />
        </>,
        { zIndex: 4, opacity: on(4) ? 1 : 0.28, transition: tr(instant, 'opacity', 520, 420) },
      )}
      {/* dashed leaders from each ring's right edge to its tile, computed from the same rows */}
      {F_ROWS.map((r, i) => (
        <Wire key={r.label} pts={[[r.edge + 6, r.y], [F.TX - F.TS / 2 - 6, r.y]]} head={0} dash="3 5" width={1.6} color={PALE} on={i === 0 || i === 5 ? true : on(i)} />
      ))}
      {/* the tile column */}
      {F_ROWS.map((r, i) => {
        const lever = i >= 1 && i <= 4
        const lit = lever && hot === i - 1
        const shown = i === 0 || (lever ? on(i) : on(4))
        return (
          <div key={r.label} style={{ opacity: shown ? 1 : 0.35, transition: tr(instant) }}>
            <Node x={F.TX} y={r.y} size={F.TS} label={r.label} side tagSize={15}>
              {tile(r.icon, { size: F.TS, lit, loop: i === 2 ? 'spin' : i === 0 ? 'glint' : 'bob', d: i * 0.4, t: i === 2 ? 9 : undefined, k: 0.78 })}
            </Node>
          </div>
        )
      })}
      {F_DROPS.map((c) => (
        <Token key={c} cls={c} size={9} on={step >= 4} tone="#FFFFFF" />
      ))}
    </Frame>
  )
}

/* ================================================================== slide 16 · B_T07 · scoping Action and Resource */

/*
 * 566 x 330. Left: the broad statement (TR 7's "broad Action/Resource pair": s3:* on *). Right: the same statement
 * scoped to one call and one ARN (TR 10's s3:GetObject on arn:aws:s3:::finance-reports-2024/*); press 3 splits a
 * second statement out (s3:PutObject, TR 10's other observed call). An arrow from the broad card to the scoped one.
 * Press 4: the blast radius under each, every bucket inside a wide ring on the left, one bucket in a tight ring on the
 * right. Cards: PAD inside; code at 12 px Fira Code, ligatures off (rule 40); widths from the longest line (0.6 em).
 */
const S = { W: 566, H: 330, FS: 12, LH: 18.6, LX: PAD, LW: 160, RW: 322, CY: PAD, CH: 96, GAP: 10, RY: 236, RH: 44, BT: 32 }
const S_RX = S.W - PAD - S.RW
const S_C2 = S.CY + S.CH + S.GAP
const S_AY = S.CY + S.CH / 2
const S_AY2 = S_C2 + S.CH / 2
const S_LH = S_C2 + S.CH - S.CY
const S_ARROW: Pt[] = [[S.LX + S.LW, S_AY], [S_RX, S_AY]]
const S_ARROW2: Pt[] = [[S.LX + S.LW, S_AY2], [S_RX, S_AY2]]
const S_RIDE = K.ride('s', S_ARROW, 0.2, 1.2, 2.4)
const S_RIDE2 = K.ride('s2', S_ARROW2, 1.4, 2.4, 2.4)
const S_LCX = S.LX + S.LW / 2
const S_RCX = S_RX + S.RW / 2
const ARN = '  "arn:aws:s3:::finance-reports-2024/*"'

function Snippet({ x, y, w, h, lines, lit = false, on = true, delay = 0 }: { x: number; y: number; w: number; h: number; lines: { t: string; hi: boolean }[]; lit?: boolean; on?: boolean; delay?: number }) {
  return (
    <Panel x={x} y={y} w={w} h={h} lit={lit} on={on} delay={delay} radius={16} style={{ padding: PAD, display: 'flex', flexDirection: 'column', justifyContent: 'center', boxSizing: 'border-box' }}>
      {lines.map((l, i) => (
        <Json key={i} text={l.t} hi={l.hi} size={S.FS} />
      ))}
    </Panel>
  )
}

const B_T07: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const instant = useInstant()
  const hot = useHot(4, step, 1600)
  const on = (k: number) => held || step >= k
  const A = hot === 0
  const R = hot === 1
  const ring = (lit: boolean): CSSProperties => ({
    position: 'absolute', inset: 0, borderRadius: 99, border: `2.5px dashed ${lit ? ORANGE : BLUE}`, background: lit ? 'rgba(255,138,61,0.10)' : 'rgba(45,99,251,0.07)',
    transition: tr(instant, 'border-color', 420),
  })
  const LBW = 4 * S.BT + 3 * 4 + 16
  return (
    <Frame w={S.W} h={S.H}>
      {/* the broad statement: one policy document, the full height of the two scoped statements beside it */}
      <Panel x={S.LX} y={S.CY} w={S.LW} h={S_LH} radius={16} style={{ padding: PAD, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          {tile('policy', { size: 48, loop: 'float', k: 0.78 })}
          <span style={tag(14)}>Broad</span>
        </div>
        <div>
          <Json text={'"Action": "s3:*"'} hi={A} size={S.FS} />
          <Json text={'"Resource": "*"'} hi={R} size={S.FS} />
        </div>
      </Panel>
      <Wire pts={S_ARROW} head={10} />
      <Token cls={S_RIDE} size={9} />
      <Wire pts={S_ARROW2} head={10} on={on(3)} lit={hot === 2} />
      <Token cls={S_RIDE2} size={9} on={on(3)} />
      <Snippet x={S_RX} y={S.CY} w={S.RW} h={S.CH} lines={[{ t: '"Action": "s3:GetObject"', hi: A }, { t: '"Resource":', hi: R }, { t: ARN, hi: R }]} />
      <Snippet x={S_RX} y={S_C2} w={S.RW} h={S.CH} on={on(3)} lit={hot === 2} lines={[{ t: '"Action": "s3:PutObject"', hi: A }, { t: '"Resource":', hi: R }, { t: ARN, hi: R }]} />
      {/* 4 · the blast radius: wide on the left, tight on the right */}
      <Show on={on(4)} style={{ position: 'absolute', left: S_LCX - LBW / 2, top: S.RY, width: LBW, height: S.RH, zIndex: 2 }}>
        <div className={held ? undefined : 't14b-breathe'} style={ring(hot === 3)} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          {[0, 1, 2, 3].map((i) => (
            <MarkTile key={i} src={bucketMark} size={S.BT} scale={0.7} />
          ))}
        </div>
      </Show>
      <Show on={on(4)} style={{ position: 'absolute', left: S_LCX - 80, top: S.RY + S.RH + 6, width: 160, zIndex: 2, textAlign: 'center' }}>
        <span style={tag(14)}>Every Resource</span>
      </Show>
      <Show on={on(4)} delay={120} style={{ position: 'absolute', left: S_RCX - S.RH / 2, top: S.RY, width: S.RH, height: S.RH, zIndex: 2 }}>
        <div className={held ? undefined : 't14b-breathe'} style={{ ...ring(hot === 3), animationDelay: '-1.3s' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <MarkTile src={bucketMark} size={S.BT} scale={0.7} />
        </div>
      </Show>
      <Show on={on(4)} delay={120} style={{ position: 'absolute', left: S_RCX - 80, top: S.RY + S.RH + 6, width: 160, zIndex: 2, textAlign: 'center' }}>
        <span style={tag(14)}>One ARN</span>
      </Show>
    </Frame>
  )
}

/* ================================================================== slide 17 · B_T08 · the asterisk danger */

/*
 * 546 x 330. Top row: the TR 8 snippet ("Action": "*", "Resource": "*") with each asterisk ringed orange (TR's red,
 * rule 51) -> an unlocked padlock; the leaked Credential (press 4) on the right. Both join one trunk at D.TX that drops
 * onto a bus over a row of five doors, one short drop into each door. Press 3 swings every door open, showing the
 * resource inside; press 4 sends the key down the same path to every open door. Loop: the doors swing in a wave.
 */
const D = { W: 546, H: 330, PX: PAD, PW: 210, PY: PAD, PH: 90, FS: 16, LX: 300, KX: 466, TS: 60, TX: 383, BUS: 148, DT: 166, DW: 60, DH: 96 }
const D_RY = D.PY + D.PH / 2
const D_DX = [81, 177, 273, 369, 465]
const D_RES: Ico3DName[] = ['bucket', 'database', 'server', 'object', 'vault']
const D_IN: Pt[] = [[D.PX + D.PW, D_RY], [D.LX - D.TS / 2, D_RY]]
const dPath = (from: number, cx: number): Pt[] => [[from, D_RY], [D.TX, D_RY], [D.TX, D.BUS], [cx, D.BUS], [cx, D.DT]]
const D_IN_RIDE = K.ride('d-in', D_IN, 0.1, 0.9, 2.4)
const D_LOCK_RIDE = D_DX.map((cx, i) => K.ride(`d-l${i}`, dPath(D.LX + D.TS / 2, cx), i * 0.5, i * 0.5 + 1.5, 3.6))
const D_KEY_RIDE = D_DX.map((cx, i) => K.ride(`d-k${i}`, dPath(D.KX - D.TS / 2, cx), i * 0.5 + 0.25, i * 0.5 + 1.85, 3.6))

function Star({ ring, lit }: { ring: boolean; lit: boolean }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'relative', display: 'inline-block', margin: '0 7px' }}>
      *
      <span aria-hidden className={lit ? 't14b-pulse' : undefined} style={{ position: 'absolute', left: '50%', top: '50%', width: 20, height: 20, marginLeft: -10, marginTop: -10, borderRadius: 99, boxShadow: `0 0 0 ${lit ? 3 : 2.5}px ${ORANGE}`, opacity: ring ? 1 : 0, transform: ring ? 'none' : 'scale(1.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}` }} />
    </span>
  )
}

function Door({ cx, open, wave, lit, icon, i }: { cx: number; open: boolean; wave: boolean; lit: boolean; icon: Ico3DName; i: number }) {
  const instant = useInstant()
  return (
    <div style={{ position: 'absolute', left: cx - D.DW / 2, top: D.DT, width: D.DW, height: D.DH, zIndex: 3, perspective: 320 }}>
      {/* the frame and the room behind it */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: '10px 10px 3px 3px', background: 'linear-gradient(180deg, #FFF4EA 0%, #FFE2CB 100%)', boxShadow: lit ? `inset 0 0 0 4px ${ORANGE}, 0 10px 20px -12px rgba(255,138,61,0.8)` : 'inset 0 0 0 4px #9DB8FF, 0 10px 20px -12px rgba(31,64,140,0.5)', transition: tr(instant, 'box-shadow', 420), display: 'grid', placeItems: 'center' }}>
        <Ico3D name={icon} size={30} loop="bob" d={i * 0.4} />
      </div>
      {/* the leaf, hinged on its left edge */}
      <div
        className={wave ? 't14b-wave' : undefined}
        style={{
          position: 'absolute', left: 4, top: 4, right: 4, bottom: 0, borderRadius: '7px 7px 2px 2px', transformOrigin: '0% 50%',
          background: 'linear-gradient(180deg, #5C86FF 0%, #2D63FB 55%, #1640C8 100%)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.35)',
          transform: open ? 'rotateY(-70deg)' : 'rotateY(0deg)', transition: instant ? 'none' : `transform 720ms ${EASE} ${open ? i * 110 : 0}ms`,
          animationDelay: `${-i * 0.32}s`,
        }}
      >
        <span style={{ position: 'absolute', left: 7, right: 7, top: 8, height: 30, borderRadius: 4, boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.4)' }} />
        <span style={{ position: 'absolute', left: 7, right: 7, top: 46, height: 36, borderRadius: 4, boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.4)' }} />
        <span style={{ position: 'absolute', right: 7, top: 44, width: 7, height: 7, borderRadius: 99, background: '#FFC53A', boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }} />
      </div>
    </div>
  )
}

const B_T08: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const hot = useHot(4, step, 1600)
  const on = (k: number) => held || step >= k
  return (
    <Frame w={D.W} h={D.H}>
      <Panel x={D.PX} y={D.PY} w={D.PW} h={D.PH} radius={16} style={{ padding: PAD, display: 'flex', flexDirection: 'column', justifyContent: 'center', boxSizing: 'border-box' }}>
        <Json text={'"Action": "'} hi={hot === 0} size={D.FS}>
          <span style={{ color: INK, fontWeight: 600 }}><Star ring={on(1)} lit={hot === 0} /></span>
          <span style={{ color: INK, fontWeight: 500 }}>"</span>
        </Json>
        <Json text={'"Resource": "'} hi={hot === 1} size={D.FS}>
          <span style={{ color: INK, fontWeight: 600 }}><Star ring={on(2)} lit={hot === 1} /></span>
          <span style={{ color: INK, fontWeight: 500 }}>"</span>
        </Json>
      </Panel>
      <Wire pts={D_IN} head={10} />
      <Token cls={D_IN_RIDE} size={9} />
      <Node x={D.LX} y={D_RY} size={D.TS} label="Unlocked" w={110}>
        {tile('unlock', { size: D.TS, loop: 'swing', t: 2.6 })}
      </Node>
      {/* trunk and bus: padlock (and, at 4, the key) to every door */}
      <Wire pts={[[D.LX + D.TS / 2, D_RY], [D.TX, D_RY], [D.TX, D.BUS]]} head={0} lit={hot === 2} />
      <Wire pts={[[D_DX[0], D.BUS], [D_DX[4], D.BUS]]} head={0} lit={hot === 2} />
      <Junction x={D.TX} y={D.BUS} lit={hot === 2} />
      {D_DX.map((cx, i) => (
        <Wire key={cx} pts={[[cx, D.BUS], [cx, D.DT]]} head={9} delay={i * 60} lit={hot === 2} />
      ))}
      <Wire pts={[[D.KX - D.TS / 2, D_RY], [D.TX, D_RY]]} head={0} on={on(4)} color={ORANGE} />
      <Junction x={D.TX} y={D_RY} on={on(4)} />
      <Node x={D.KX} y={D_RY} size={D.TS} label="Credential" w={110} on={on(4)}>
        {tile('key', { size: D.TS, loop: 'glint', badge: 'alert', lit: hot === 3, warm: true })}
      </Node>
      {D_DX.map((cx, i) => (
        <Door key={cx} cx={cx} i={i} icon={D_RES[i]} open={on(3)} wave={!held && step >= 4} lit={hot === 2} />
      ))}
      <Show on style={{ position: 'absolute', left: 0, right: 0, top: D.DT + D.DH + 10, textAlign: 'center', zIndex: 2 }}>
        <span style={tag(14)}>Every Resource</span>
      </Show>
      {D_LOCK_RIDE.map((c) => (
        <Token key={c} cls={c} size={8} on={step >= 3 && step < 4} />
      ))}
      {D_KEY_RIDE.map((c) => (
        <Rider key={c} cls={c} name="key" size={24} on={step >= 4} />
      ))}
    </Frame>
  )
}

/* ================================================================== slide 19 · B_T09 · the boundary as a ceiling */

/*
 * 546 x 330. Two real discs, Identity Policy (centre B.IX) and Permission Boundary (B.BX), radius B.R; only their
 * intersection (a clip of one by the other) is shaded Effective. 1: the boundary appears alone, empty, a ban sign in its
 * own part. 2: the identity disc's outer part greys, the overlap fills. 3: a Team Lead tile pushes its disc wider
 * (scaled from its left edge); the overlap stops at the boundary line. 4: the boundary attaches to a User tile and a
 * Role tile (official IAM Role mark). Loop: the overlap glows.
 */
const B = { W: 546, H: 330, R: 90, IX: 205, BX: 305, Y: 160, ST: 1.12, LX: 56, TS: 56, JX: 418, UX: 466, UY: 100, OY: 220 }
const B_IL = B.IX - B.R
const B_BR = B.BX + B.R
const B_LEAD: Pt[] = [[B.LX + B.TS / 2, B.Y], [B_IL, B.Y]]
const B_ATT = [B.UY, B.OY].map((y): Pt[] => [[B_BR, B.Y], [B.JX, B.Y], [B.JX, y], [B.UX - B.TS / 2, y]])
const B_LEAD_RIDE = K.ride('b-lead', B_LEAD, 0.1, 0.9, 2.4)
const B_ATT_RIDE = B_ATT.map((pts, i) => K.ride(`b-att${i}`, pts, 0.2 + i * 1.2, 1.2 + i * 1.2, 2.4))

const B_T09: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const instant = useInstant()
  const hot = useHot(4, step, 1600)
  const id = 't14b-c' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const on = (k: number) => held || step >= k
  const grey = on(2)
  const stretch = on(3)
  const sc: CSSProperties = { transform: stretch ? `scale(${B.ST})` : 'scale(1)', transformOrigin: `${B_IL}px ${B.Y}px`, transition: tr(instant, 'transform', 720) }
  const svg = (children: ReactNode, style?: CSSProperties, cls?: string) => (
    <svg aria-hidden className={cls} width={B.W} height={B.H} viewBox={`0 0 ${B.W} ${B.H}`} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', ...style }}>
      {children}
    </svg>
  )
  return (
    <Frame w={B.W} h={B.H}>
      {/* the identity disc (root svg scaled for the stretch) */}
      {svg(
        <circle cx={B.IX} cy={B.Y} r={B.R} fill={grey ? '#E7EAF0' : '#DCE6FF'} stroke={hot === 1 ? ORANGE : grey ? '#AEB9CC' : BLUE} strokeWidth={hot === 1 ? 3.5 : 2.5} style={{ transition: tr(instant, 'fill', 520) + ', ' + tr(instant, 'stroke', 420) }} />,
        { ...sc, zIndex: 1 },
      )}
      {/* the effective overlap: the identity disc clipped by the boundary disc; the overlap glows */}
      {svg(
        <>
          <defs>
            <clipPath id={`${id}k`}>
              <circle cx={B.BX} cy={B.Y} r={B.R} />
            </clipPath>
            <linearGradient id={`${id}g`} x1="0" y1="0" x2="0.3" y2="1">
              <stop offset="0" stopColor="#8DB0FF" />
              <stop offset="0.55" stopColor={BLUE} />
              <stop offset="1" stopColor="#1640C8" />
            </linearGradient>
          </defs>
          <g clipPath={`url(#${id}k)`}>
            <circle cx={B.IX} cy={B.Y} r={B.R} fill={`url(#${id}g)`} style={sc} />
          </g>
        </>,
        { zIndex: 2, opacity: grey ? 1 : 0, transition: tr(instant, 'opacity', 620) },
        grey && !held && step >= 4 ? 't14b-glow' : undefined,
      )}
      {/* the boundary ring: empty, it grants nothing itself */}
      {svg(
        <circle cx={B.BX} cy={B.Y} r={B.R} fill="none" stroke={hot === 0 || hot === 2 ? ORANGE : colors.brandDark} strokeWidth={hot === 0 || hot === 2 ? 4 : 3} style={{ transition: tr(instant, 'stroke', 420) }} />,
        { zIndex: 3, opacity: on(1) ? 1 : 0, transition: tr(instant, 'opacity', 520) },
      )}
      {/* inside the shapes */}
      <div style={{ position: 'absolute', left: B.IX - 45 - 16, top: B.Y - 16, width: 32, height: 32, zIndex: 4, opacity: grey ? 0.55 : 1, transition: tr(instant) }}>
        <Ico3D name="policy" size={32} loop="float" />
      </div>
      <Show on={on(1)} style={{ position: 'absolute', left: B.BX + 50 - 16, top: B.Y - 16, width: 32, height: 32, zIndex: 4 }}>
        <Ico3D name="ban" size={32} loop="pulse" />
      </Show>
      <Show on={grey} delay={200} style={{ position: 'absolute', left: (B.IX + B.BX) / 2 - 40, top: B.Y - 28, width: 80, zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <Ico3D name="check" size={28} loop="beat" />
        <span style={tag(13.5, '#FFFFFF')}>Effective</span>
      </Show>
      {/* the two names */}
      <div style={{ position: 'absolute', left: B.IX - 80, top: PAD + 8, width: 160, textAlign: 'center', zIndex: 4 }}>
        <span style={tag(15)}>Identity Policy</span>
      </div>
      <Show on={on(1)} style={{ position: 'absolute', left: B.BX - 90, top: 268, width: 180, textAlign: 'center', zIndex: 4 }}>
        <span style={tag(15)}>Permission Boundary</span>
      </Show>
      {/* 3 · the team lead pushes the identity disc */}
      <Node x={B.LX} y={B.Y} size={B.TS} label="Team Lead" w={76} on={on(3)} tagSize={13.5}>
        {tile('user', { size: B.TS, badge: 'plus', lit: hot === 2, loop: 'bob' })}
      </Node>
      <Wire pts={B_LEAD} head={9} on={on(3)} lit={hot === 2} />
      <Token cls={B_LEAD_RIDE} size={8} on={on(3)} />
      {/* 4 · attached per user or role */}
      {B_ATT.map((pts, i) => (
        <Wire key={i} pts={pts} head={10} on={on(4)} delay={i * 120} lit={hot === 3} />
      ))}
      <Junction x={B.JX} y={B.Y} on={on(4)} lit={hot === 3} />
      {B_ATT_RIDE.map((c) => (
        <Token key={c} cls={c} size={8} on={on(4)} />
      ))}
      <Node x={B.UX} y={B.UY} size={B.TS} label="User" w={90} on={on(4)}>
        {tile('user', { size: B.TS, lit: hot === 3, d: 0.3 })}
      </Node>
      <Node x={B.UX} y={B.OY} size={B.TS} label="Role" w={90} on={on(4)} delay={120}>
        <MarkTile src={roleMark} size={B.TS} lit={hot === 3} />
      </Node>
    </Frame>
  )
}

/* ================================================================== slide 22 · B_T10B · four passes, a shrinking funnel */

/*
 * 1080 x 360. Four rows, each narrower than the last, centred on x 540: Start 960, Observe 800, Narrow 640, Cap 480
 * wide, 62 tall, 24 apart, PAD above and below. An orthogonal arrow joins each row to the next, alternating sides so a
 * row's arrow in and arrow out never share an edge: right, left, right. Each arrow leaves the source edge, steps 20 out,
 * runs down and enters the next row's edge. The Observe row carries the IAM Access Analyzer and CloudTrail marks; the
 * code values are the TR 10 table's own. Press N lights row N; then the light walks Start -> Cap -> Start.
 */
const T = { W: 1080, H: 360, CX: 540, RH: 62, GAP: 24, OUT: 20, TS: 42 }
const T_W = [960, 800, 640, 480]
const T_Y = T_W.map((_, k) => PAD + k * (T.RH + T.GAP))
const T_CY = T_Y.map((y) => y + T.RH / 2)
const T_L = T_W.map((w) => T.CX - w / 2)
const T_R = T_W.map((w) => T.CX + w / 2)
const T_ARROWS: Pt[][] = [
  [[T_R[0], T_CY[0]], [T_R[0] + T.OUT, T_CY[0]], [T_R[0] + T.OUT, T_CY[1]], [T_R[1], T_CY[1]]],
  [[T_L[1], T_CY[1]], [T_L[1] - T.OUT, T_CY[1]], [T_L[1] - T.OUT, T_CY[2]], [T_L[2], T_CY[2]]],
  [[T_R[2], T_CY[2]], [T_R[2] + T.OUT, T_CY[2]], [T_R[2] + T.OUT, T_CY[3]], [T_R[3], T_CY[3]]],
]
const T_RIDE = T_ARROWS.map((pts, i) => K.ride(`t${i}`, pts, i * 1.0, i * 1.0 + 1.0, 3.2))

const Code = ({ children, size = 14 }: { children: ReactNode; size?: number }) => (
  <span style={{ fontFamily: MONO, fontSize: size, lineHeight: 1.3, color: colors.brandDeep, fontWeight: 500, whiteSpace: 'pre', ...NOLIG }}>{children}</span>
)

const B_T10B: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const instant = useInstant()
  const hot = useHot(4, step, 1600)
  const on = (k: number) => held || step >= k
  const rows: { name: string; icon: Ico3DName; body: ReactNode }[] = [
    { name: 'Start', icon: 'play', body: <Code size={15}>Action: s3:*, Resource: *</Code> },
    {
      name: 'Observe',
      icon: 'eye',
      body: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><MarkTile src={aaMark} size={T.TS} /><span style={tag(15)}>IAM Access Analyzer</span></span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><MarkTile src={ctMark} size={T.TS} /><span style={tag(15)}>CloudTrail</span></span>
        </div>
      ),
    },
    {
      name: 'Narrow',
      icon: 'filter',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Code size={14}>Action: [s3:GetObject, s3:PutObject]</Code>
          <Code size={14}>Resource: arn:aws:s3:::finance-reports-2024/*</Code>
        </div>
      ),
    },
    {
      name: 'Cap',
      icon: 'shield',
      body: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <Code size={15}>s3:GetObject</Code>
          <Code size={15}>s3:PutObject</Code>
        </div>
      ),
    },
  ]
  return (
    <Frame w={T.W} h={T.H}>
      {rows.map((r, k) => {
        const lit = hot === k
        return (
          <div key={r.name} style={{ opacity: on(k + 1) ? 1 : 0.3, transition: tr(instant, 'opacity', 520) }}>
            <Panel x={T_L[k]} y={T_Y[k]} w={T_W[k]} h={T.RH} lit={lit} radius={16} tint={`linear-gradient(180deg, #FFFFFF 0%, ${['#F3F7FF', '#ECF2FF', '#E5EDFF', '#DEE8FF'][k]} 100%)`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              {tile(r.icon, { size: T.TS, lit, d: k * 0.4, loop: k === 1 ? 'pulse' : 'bob', k: 0.78 })}
              <span style={{ ...heading(18), minWidth: 72 }}>{r.name}</span>
              <span aria-hidden style={{ width: 1.5, height: 30, background: PALE }} />
              {r.body}
            </Panel>
          </div>
        )
      })}
      {T_ARROWS.map((pts, i) => (
        <Wire key={i} pts={pts} head={10} on={on(i + 2)} lit={hot === i + 1} />
      ))}
      {T_RIDE.map((c, i) => (
        <Token key={c} cls={c} size={9} on={step >= 4 || (step >= i + 2 && step < 4)} />
      ))}
    </Frame>
  )
}

void loopCls
void loopVars

export const figures: Record<string, Fig> = { B_T06, B_T07, B_T08, B_T09, B_T10B }
export const css =
  K.css() +
  `
@keyframes t14b-breathe { 0%, 100% { transform: scale(0.97) } 50% { transform: scale(1.04) } }
.t14b-breathe { animation: t14b-breathe 2.6s cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes t14b-pulse { 0%, 100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.18); opacity: 0.7 } }
.t14b-pulse { animation: t14b-pulse 1.4s cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes t14b-wave { 0%, 100% { transform: rotateY(-70deg) } 50% { transform: rotateY(-34deg) } }
.t14b-wave { animation: t14b-wave 2.4s cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes t14b-glow { 0%, 100% { opacity: 1 } 50% { opacity: 0.72 } }
.t14b-glow { animation: t14b-glow 2.4s ease-in-out infinite; }
.cc-still .t14b-breathe, .cc-still .t14b-pulse, .cc-still .t14b-wave, .cc-still .t14b-glow,
.deck-thumb .t14b-breathe, .deck-thumb .t14b-pulse, .deck-thumb .t14b-wave, .deck-thumb .t14b-glow { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .t14b-breathe, .t14b-pulse, .t14b-wave, .t14b-glow { animation: none !important; } }
`
