import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { TILE_SKIN } from '@/decks/figures/card'
import { MOTION, motionHeld } from '@/motion/tokens'
import { litRing } from '@/decks/figures/net/frames'
import { Icon } from '@/engine/icon'
import awsEc2 from '../images/aws-ec2.svg'
import awsRds from '../images/aws-rds.svg'
import awsConnect from '../images/aws-connect.svg'
import awsTa from '../images/aws-trusted-advisor.svg'
import awsWa from '../images/aws-well-architected-tool.svg'
import resAnalyzer from '../images/res-iam-access-analyzer.svg'
import resBucket from '../images/res-s3-bucket.svg'
import resEbs from '../images/res-ebs-volume.svg'
import resPolicy from '../images/res-iam-permissions.svg'
import boyLaptop from './b-boy-laptop.png'

/*
 * BUILDER B · Cloud Security & Shared Responsibility (Session 12), sections 3 and 4:
 *   B_T07   slide 17  duty x service-model grid, each cell owned by Customer (blue) or Provider (grey), Shared half/half
 *   B_STACK slides 18-20  one layered stack in three states (model 'iaas' | 'paas' | 'saas'); the provider zone's edge
 *           rises to its state as the slide opens, so the state change IS the motion
 *   B_T12   slide 23  provider and customer each assuming the other did it: two straight arrows stopping at an open gap
 *   B_T14   slide 25  the six TR steps as six cards left to right, step 3 ringed orange (the TR's turning point)
 *   B_T15   slide 26  two drawn console screens (Trusted Advisor security checks, an IAM Access Analyzer finding) and
 *           the Well-Architected Tool mark
 *
 * Built to Sessions 9-11's final review state (generate-slides standing corrections 1-16, cloud course R10-R13):
 * icon-first, one Title Case tag under or beside an icon that is not self-evident, official marks on white tiles that
 * never move, customer = blue and provider = grey (the same tints as slide 21's table), equal padding, straight arrows
 * computed from constants, a quiet loop after every build, a sequential highlight that walks first → last → first and
 * never parks. Held frames (?still, thumbnails, reduced motion): the full end state, nothing lit, nothing moving
 * (B_T14's step-3 ring is the TR's own and stays).
 */

type Fig = (p: Record<string, unknown>) => ReactNode

const EASE = MOTION.ease
const FONT = "'DM Sans', system-ui, sans-serif"
const useHeld = () => motionHeld(useInstant())

/* the owner palette, matching the engine's table tints (vtable TONE_BG) */
const CUST_BG = 'linear-gradient(135deg, #E9F0FF 0%, #DCE7FF 100%)'
const CUST_RIM = `inset 0 0 0 1px ${colors.brand}38`
const PROV_BG = 'linear-gradient(135deg, #F2F4F7 0%, #E6E9EF 100%)'
const PROV_RIM = 'inset 0 0 0 1px #C9D0DBb3'
const PROV_INK = '#5B6B82'
const SHARED_BG = 'linear-gradient(90deg, #E2EBFF 0%, #E2EBFF 50%, #E9ECF1 50%, #E9ECF1 100%)'
const BLUE_RING = (on: boolean, base = '') => `${base}${base && on ? ', ' : ''}${on ? `0 0 0 2.5px ${colors.brand}, 0 10px 22px -12px ${colors.brand}` : ''}`

const lc = (kind: string) => `sb sb-${kind}`
const lv = (d = 0, t?: number): CSSProperties => ({ ['--sb-d' as string]: `${-d}s`, ...(t ? { ['--sb-t' as string]: `${t}s` } : {}) }) as CSSProperties

/** wall-clock seconds, frozen at `hold` on held frames */
function useClock(hold = 0) {
  const held = useHeld()
  const [t, setT] = useState(0)
  useEffect(() => {
    if (held) return
    let r = 0
    const t0 = performance.now()
    const f = (n: number) => {
      setT((n - t0) / 1000)
      r = requestAnimationFrame(f)
    }
    r = requestAnimationFrame(f)
    return () => cancelAnimationFrame(r)
  }, [held])
  return held ? hold : t
}

/** after the build: starts on the part the last press lit (no jump back), then walks first → last → first forever */
function useWalk(n: number, done: boolean, ms = 1400): number {
  const held = useHeld()
  const [i, setI] = useState(n - 1)
  useEffect(() => {
    setI(n - 1)
    if (!done || held || n < 1) return
    const id = window.setInterval(() => setI((v) => (v + 1) % n), ms)
    return () => window.clearInterval(id)
  }, [n, done, held, ms])
  return done && !held ? i : -1
}

/** build state for a figure of `n` parts: part i shows from press i, lit while it is the current press */
function useParts(step: number, n: number) {
  const held = useHeld()
  const s = held ? n : step
  return {
    held,
    shown: (i: number) => held || s >= i,
    lit: (i: number) => !held && s === i && s < n,
    done: !held && s >= n,
  }
}

function Show({ on, children, style, delay = 0, rise = 6 }: { on: boolean; children: ReactNode; style?: CSSProperties; delay?: number; rise?: number }) {
  const instant = useInstant()
  return (
    <div
      style={{
        opacity: on ? 1 : 0,
        transform: on ? 'none' : `translateY(${rise}px)`,
        transition: instant ? 'none' : `opacity ${MOTION.reveal}ms ${EASE} ${on ? delay : 0}ms, transform ${MOTION.reveal}ms ${EASE} ${on ? delay : 0}ms`,
        pointerEvents: on ? undefined : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** the figure's own w x h box, centred in the stage */
const Frame = ({ w, h, children }: { w: number; h: number; children: ReactNode }) => (
  <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
    <div style={{ position: 'relative', width: w, height: h }}>{children}</div>
  </div>
)

const tagStyle = (size = 13, color: string = colors.brandDeep): CSSProperties => ({ fontFamily: FONT, fontWeight: 600, fontSize: size, lineHeight: 1.15, color, whiteSpace: 'nowrap', textAlign: 'center' })

/** a zero-size anchor at (x, y) centring its child */
const At = ({ x, y, children, z = 4 }: { x: number; y: number; children: ReactNode; z?: number }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: 0, height: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: z }}>
    {/* flex-shrink 0: inside a zero-width flex box a child would otherwise shrink to its min-content width */}
    <div style={{ flexShrink: 0 }}>{children}</div>
  </div>
)

/** an official mark on its white tile (rule 54); the mark never moves */
function MarkTile({ src, size = 44, k = 0.66, ring }: { src: string; size?: number; k?: number; ring?: string }) {
  const instant = useInstant()
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: Math.round(size * 0.26), background: '#FFFFFF', boxShadow: `inset 0 0 0 1px #CFDCF5, 0 8px 18px -12px rgba(31,64,140,0.5)${ring ? `, ${ring}` : ''}`, transition: instant ? 'none' : `box-shadow 420ms ${EASE}`, flexShrink: 0 }}>
      <img src={src} alt="" aria-hidden draggable={false} style={{ width: Math.round(size * k), height: 'auto', display: 'block' }} />
    </span>
  )
}

/** a lucide glyph (or an `img:` mark) on a soft tile; the glyph carries the loop */
function GlyphTile({ icon, size = 40, tone = colors.brand, loop = 'float', d = 0, t, bg, rim, style }: { icon: string; size?: number; tone?: string; loop?: string; d?: number; t?: number; bg?: string; rim?: string; style?: CSSProperties }) {
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: Math.round(size * 0.27), ...TILE_SKIN, ...(bg ? { background: bg } : {}), ...(rim ? { boxShadow: rim } : {}), color: tone, flexShrink: 0, ...style }}>
      <span className={loop ? lc(loop) : undefined} style={{ display: 'grid', placeItems: 'center', ...lv(d, t) }}>
        <Icon name={icon} size={Math.round(size * (icon.startsWith('img:') ? 0.62 : 0.5))} />
      </span>
    </span>
  )
}

/** a bare glyph with a loop (no tile) */
const Glyph = ({ icon, size = 18, tone = colors.brand, loop = 'float', d = 0, t }: { icon: string; size?: number; tone?: string; loop?: string; d?: number; t?: number }) => (
  <span className={loop ? lc(loop) : undefined} style={{ display: 'grid', placeItems: 'center', color: tone, ...lv(d, t) }}>
    <Icon name={icon} size={size} />
  </span>
)

/**
 * A straight arrow from (x1, y1) to (x2, y2): the shaft stops at the head's base, the filled head's tip lands exactly
 * on (x2, y2). It draws itself along its length when it appears.
 */
function Arrow({ x1, y1, x2, y2, on = true, color = colors.brand, width = 2.5, head = 10, delay = 0 }: { x1: number; y1: number; x2: number; y2: number; on?: boolean; color?: string; width?: number; head?: number; delay?: number }) {
  const instant = useInstant()
  const len = Math.hypot(x2 - x1, y2 - y1)
  const ux = (x2 - x1) / len
  const uy = (y2 - y1) / len
  const bx = x2 - ux * head
  const by = y2 - uy * head
  const hw = head * 0.55
  const shaft = Math.max(0.1, len - head)
  const tr = instant ? 'none' : `stroke-dashoffset 760ms ${EASE} ${on ? delay : 0}ms`
  return (
    <svg aria-hidden style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', zIndex: 2 }} width={1} height={1}>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={shaft} strokeDashoffset={on ? 0 : shaft} style={{ transition: tr }} />
      <polygon points={`${x2},${y2} ${bx - uy * hw},${by + ux * hw} ${bx + uy * hw},${by - ux * hw}`} fill={color} style={{ opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 240ms ${EASE} ${on ? delay + 520 : 0}ms` }} />
    </svg>
  )
}

/** a flow dot riding a straight segment on the wall clock; `ride` of each period moving, eased; gone on held frames */
function Dot({ x1, y1, x2, y2, t, period, phase = 0, ride = 0.8, tone = colors.brand, size = 10 }: { x1: number; y1: number; x2: number; y2: number; t: number; period: number; phase?: number; ride?: number; tone?: string; size?: number }) {
  const held = useHeld()
  if (held) return null
  const u = ((((t - phase) % period) + period) % period) / period
  if (u > ride) return null
  const k = u / ride
  const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
  const x = x1 + (x2 - x1) * e
  const y = y1 + (y2 - y1) * e
  const op = k < 0.12 ? k / 0.12 : k > 0.82 ? Math.max(0, (1 - k) / 0.18) : 1
  return <span aria-hidden style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: 99, background: tone, opacity: op, boxShadow: `0 0 0 4px ${tone}2e, 0 4px 10px -4px ${tone}`, zIndex: 3 }} />
}

/* ═════════════════════════════════════════ B_T07 · slide 17 · duty x model ownership grid (424 x 298) */

type Owner = 'c' | 'p' | 's'
const T07_ROWS: { tag: string; icon: string; own: Owner[] }[] = [
  { tag: 'OS Patching', icon: 'Wrench', own: ['c', 'p', 'p'] },
  { tag: 'Network Rules', icon: 'Network', own: ['c', 's', 'p'] },
  { tag: 'Encryption Keys', icon: 'KeyRound', own: ['c', 'c', 'p'] },
  { tag: 'Access Setup', icon: 'UserCheck', own: ['c', 'c', 'c'] },
]
const MODELS = [
  { tag: 'IaaS', icon: 'Server' },
  { tag: 'PaaS', icon: 'Layers' },
  { tag: 'SaaS', icon: 'AppWindow' },
]

/** one owner tile: the owner's glyph on the owner's tint (shared: both glyphs on the split tint) */
function OwnerTile({ own, w, h, d = 0 }: { own: Owner; w: number; h: number; d?: number }) {
  const bg = own === 'c' ? CUST_BG : own === 'p' ? PROV_BG : SHARED_BG
  const rim = own === 'c' ? CUST_RIM : own === 's' ? `inset 0 0 0 1px ${colors.brand}26` : PROV_RIM
  return (
    <div style={{ width: w, height: h, borderRadius: 10, background: bg, boxShadow: rim, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
      {own !== 'p' && <Glyph icon="User" size={18} tone={colors.brand} d={d} />}
      {own !== 'c' && <Glyph icon="Building2" size={18} tone={PROV_INK} d={d + 0.6} />}
    </div>
  )
}

function B_T07({ step = 0 }: { step?: number }) {
  const W = 424
  const H = 298
  const P = useParts(step, 4)
  const walk = useWalk(4, P.done)
  const instant = useInstant()
  const LABEL_W = 148 // label column; cells start here
  const PAD = 6 // the row panel's inner padding, on every side of the cells
  const GAP = 6
  const CELL_W = (W - LABEL_W - PAD - 2 * GAP) / 3
  const cellX = (c: number) => LABEL_W + c * (CELL_W + GAP)
  const ROW_H = 48
  const rowY = (r: number) => 50 + r * 54
  return (
    <Frame w={W} h={H}>
      {/* model heads */}
      {MODELS.map((m, c) => (
        <div key={m.tag} style={{ position: 'absolute', left: cellX(c), top: 6, width: CELL_W, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <GlyphTile icon={m.icon} size={28} d={c * 0.5} />
          <span style={tagStyle(14)}>{m.tag}</span>
        </div>
      ))}
      {T07_ROWS.map((row, r) => {
        const on = P.shown(r + 1)
        const lit = P.lit(r + 1) || walk === r
        return (
          <div key={row.tag} style={{ position: 'absolute', left: 0, top: rowY(r), width: W, height: ROW_H, borderRadius: 14, ...TILE_SKIN, boxShadow: litRing(lit, TILE_SKIN.boxShadow as string), transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
            <div style={{ position: 'absolute', left: 8, top: 0, height: ROW_H, display: 'flex', alignItems: 'center', gap: 8 }}>
              <GlyphTile icon={row.icon} size={32} d={r * 0.4} />
              <span style={{ ...tagStyle(13), textAlign: 'left' }}>{row.tag}</span>
            </div>
            {row.own.map((o, c) => (
              <div key={c} style={{ position: 'absolute', left: cellX(c), top: PAD, width: CELL_W, height: ROW_H - 2 * PAD, borderRadius: 10, boxShadow: on ? undefined : 'inset 0 0 0 1px #D9E2F2' }}>
                <Show on={on} delay={c * 170} rise={0} style={{ position: 'absolute', inset: 0 }}>
                  <OwnerTile own={o} w={CELL_W} h={ROW_H - 2 * PAD} d={r * 0.7 + c * 0.35} />
                </Show>
              </div>
            ))}
          </div>
        )
      })}
      {/* legend */}
      <div style={{ position: 'absolute', left: 0, top: 272, width: W, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
        {[
          { bg: CUST_BG, rim: CUST_RIM, tag: 'Customer' },
          { bg: PROV_BG, rim: PROV_RIM, tag: 'Provider' },
          { bg: SHARED_BG, rim: `inset 0 0 0 1px ${colors.brand}26`, tag: 'Shared' },
        ].map((l) => (
          <span key={l.tag} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 22, height: 14, borderRadius: 4, background: l.bg, boxShadow: l.rim, display: 'block' }} />
            <span style={tagStyle(13)}>{l.tag}</span>
          </span>
        ))}
      </div>
    </Frame>
  )
}

/* ═════════════════════════════════════════ B_STACK · slides 18-20 · one stack, three states (514 x 308) */

/* top to bottom; index 5 (Hardware) is the bottom layer */
const LAYERS = [
  { tag: 'Data & Access', icon: 'KeyRound' },
  { tag: 'Application', icon: 'AppWindow' },
  { tag: 'Runtime', icon: 'Cpu' },
  { tag: 'Guest OS', icon: 'MonitorCog' },
  { tag: 'Hypervisor', icon: 'Layers' },
  { tag: 'Hardware', icon: 'Server' },
]
type Duty = { at: number; icons: string[] } // icons placed on layer `at`'s right end
type Target = { duties?: Duty[]; zone?: 'c' | 'p'; mark?: boolean }
const STACK: Record<string, { from: number; to: number; mark: string; markTag: string; targets: Target[] }> = {
  /* from / to: provider layers counted from the bottom, before and after the edge rises */
  iaas: {
    from: 0,
    to: 2,
    mark: awsEc2,
    markTag: 'EC2',
    targets: [
      { duties: [{ at: 3, icons: ['Wrench'] }, { at: 2, icons: ['Wrench'] }] },
      { zone: 'c', duties: [{ at: 1, icons: ['Shield'] }] },
      { duties: [{ at: 0, icons: ['KeyRound', `img:${resEbs}`] }] },
      { duties: [{ at: 0, icons: ['UserCheck'] }] },
    ],
  },
  paas: {
    from: 2,
    to: 4,
    mark: awsRds,
    markTag: 'RDS',
    targets: [
      { duties: [{ at: 3, icons: ['RefreshCw'] }, { at: 2, icons: ['RefreshCw'] }] },
      { duties: [{ at: 1, icons: ['Code', 'Shield'] }] },
      { duties: [{ at: 0, icons: ['KeyRound'] }] },
      { mark: true },
    ],
  },
  saas: {
    from: 4,
    to: 5,
    mark: awsConnect,
    markTag: 'Connect',
    targets: [
      { zone: 'p', duties: [{ at: 1, icons: ['ShieldCheck'] }] },
      { duties: [{ at: 0, icons: ['Tags'] }] },
      { duties: [{ at: 0, icons: ['UserCog', 'Smartphone'] }] },
      { mark: true },
    ],
  },
}

function B_STACK({ step = 0, model = 'iaas' }: { step?: number; model?: string }) {
  const W = 514
  const H = 308
  const cfg = STACK[model] ?? STACK.iaas
  const P = useParts(step, 4)
  const walk = useWalk(4, P.done)
  const instant = useInstant()
  const held = P.held
  /* the provider zone's edge rises from `from` to `to` as the slide opens (held: already there) */
  const [edge, setEdge] = useState(held ? cfg.to : cfg.from)
  useEffect(() => {
    if (held) return setEdge(cfg.to)
    setEdge(cfg.from)
    const id = window.setTimeout(() => setEdge(cfg.to), 450)
    return () => window.clearTimeout(id)
  }, [held, cfg.from, cfg.to])
  const RISE_MS = 1100
  const LH = 44
  const LG = 8
  const ly = (i: number) => 2 + i * (LH + LG)
  const SX = 98 // stack left
  const SW = 286 // stack width
  const ZX = SX + SW + 14 // zone column
  /* layer i (top-down) is provider-owned when its bottom-up index is below the edge */
  const isProv = (i: number) => 5 - i < edge
  const lineY = edge >= 6 ? 0 : ly(5 - edge) + LH + LG / 2 - LG
  const custTop = 0
  const custH = edge >= 6 ? 0 : lineY - custTop - LG / 2 + 2
  const provTop = edge <= 0 ? H : lineY + LG / 2 + 2
  const provH = H - provTop
  const tgtLit = (k: number) => P.lit(k + 1) || walk === k
  /* the layer delay: each layer's tint changes as the edge passes it */
  const layerDelay = (i: number) => {
    const b = 5 - i // bottom-up index
    if (b < cfg.from || b >= cfg.to) return 0
    return 450 + ((b - cfg.from + 0.5) / Math.max(1, cfg.to - cfg.from)) * RISE_MS
  }
  return (
    <Frame w={W} h={H}>
      {/* the service's official mark, beside the stack */}
      {(() => {
        const k = cfg.targets.findIndex((tg) => tg.mark)
        const lit = k >= 0 && tgtLit(k)
        const on = k < 0 || P.shown(k + 1)
        return (
          <div style={{ position: 'absolute', left: 0, top: H / 2 - 44, width: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
            <MarkTile src={cfg.mark} size={58} k={0.7} ring={lit ? `0 0 0 3px ${colors.accent}` : undefined} />
            <span style={{ ...tagStyle(14), opacity: on ? 1 : 0.55, transition: instant ? 'none' : `opacity 420ms ${EASE}` }}>{cfg.markTag}</span>
          </div>
        )
      })()}
      {/* the layers */}
      {LAYERS.map((L, i) => {
        const prov = isProv(i)
        const dl = instant ? 0 : layerDelay(i)
        const tr = instant ? 'none' : `background 600ms ${EASE} ${dl}ms, color 600ms ${EASE} ${dl}ms, box-shadow 420ms ${EASE}`
        const duties = cfg.targets.flatMap((tg, k) => (tg.duties ?? []).filter((du) => du.at === i).map((du) => ({ ...du, k })))
        return (
          <div key={L.tag} style={{ position: 'absolute', left: SX, top: ly(i), width: SW, height: LH, borderRadius: 12, background: prov ? PROV_BG : CUST_BG, boxShadow: prov ? PROV_RIM : CUST_RIM, color: prov ? PROV_INK : colors.brand, transition: tr }}>
            <div style={{ position: 'absolute', left: 8, top: 0, height: LH, display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 8, background: '#FFFFFFcc', boxShadow: 'inset 0 0 0 1px #FFFFFF' }}>
                <Glyph icon={L.icon} size={16} tone="currentColor" d={i * 0.45} />
              </span>
              <span style={{ ...tagStyle(14, prov ? '#3E4C61' : colors.brandDeep), textAlign: 'left', transition: tr }}>{L.tag}</span>
            </div>
            {/* the duty icons this slide's points place on the layer */}
            <div style={{ position: 'absolute', right: 8, top: 0, height: LH, display: 'flex', alignItems: 'center', gap: 5 }}>
              {duties.flatMap((du) =>
                du.icons.map((ic, j) => {
                  const on = P.shown(du.k + 1)
                  const isImg = ic.startsWith('img:')
                  return (
                    <Show key={`${du.k}-${j}`} on={on} delay={j * 140} rise={4}>
                      <span style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 8, background: '#FFFFFF', boxShadow: `inset 0 0 0 1px ${prov ? '#C9D0DB' : `${colors.brand}40`}, 0 4px 10px -6px rgba(31,64,140,0.5)${tgtLit(du.k) ? `, 0 0 0 2.5px ${colors.accent}` : ''}`, transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
                        {isImg ? <Icon name={ic} size={20} /> : <Glyph icon={ic} size={16} tone={prov ? PROV_INK : colors.brand} loop="pulse" d={j * 0.4 + du.k * 0.3} t={2.4} />}
                      </span>
                    </Show>
                  )
                }),
              )}
            </div>
          </div>
        )
      })}
      {/* the shared-responsibility line between the zones */}
      {edge > 0 && edge < 6 && (
        <div aria-hidden style={{ position: 'absolute', left: SX - 6, top: lineY - 1.5, width: SW + 12, height: 3, borderRadius: 3, background: colors.brandDeep, transition: instant ? 'none' : `top ${RISE_MS}ms ${EASE} 450ms`, zIndex: 3 }}>
          <span className={lc('glow')} style={{ position: 'absolute', inset: -2, borderRadius: 4, boxShadow: `0 0 8px 1px ${colors.brand}`, display: 'block' }} />
        </div>
      )}
      {/* zone outlines a point may ring (security groups round the customer zone; the provider block on SaaS) */}
      {cfg.targets.map((tg, k) =>
        tg.zone ? (
          <Show key={k} on={P.shown(k + 1)} rise={0} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <div
              style={{
                position: 'absolute',
                left: SX - 5,
                top: tg.zone === 'c' ? custTop - 2 + 0 : provTop - 3,
                width: SW + 10,
                height: tg.zone === 'c' ? custH + 2 : provH + 1,
                borderRadius: 15,
                boxShadow: tgtLit(k) ? `0 0 0 3px ${colors.accent}` : `0 0 0 2px ${tg.zone === 'c' ? colors.brand : '#97A3B6'}`,
                transition: instant ? 'none' : `box-shadow 420ms ${EASE}, top ${RISE_MS}ms ${EASE} 450ms, height ${RISE_MS}ms ${EASE} 450ms`,
              }}
            />
          </Show>
        ) : null,
      )}
      {/* zone brackets: a bar spanning each zone, its owner glyph and tag beside it */}
      {(
        [
          { z: 'c', top: custTop, h: custH, tag: 'Customer', icon: 'User', bar: colors.brand, bg: CUST_BG, rim: CUST_RIM, tone: colors.brand },
          { z: 'p', top: provTop, h: provH, tag: 'Provider', icon: 'Building2', bar: '#97A3B6', bg: PROV_BG, rim: PROV_RIM, tone: PROV_INK },
        ] as const
      ).map((zb) => (
        <div key={zb.z} style={{ position: 'absolute', left: ZX, top: zb.top, width: W - ZX, height: Math.max(0, zb.h), opacity: zb.h > 8 ? 1 : 0, transition: instant ? 'none' : `top ${RISE_MS}ms ${EASE} 450ms, height ${RISE_MS}ms ${EASE} 450ms, opacity 300ms ${EASE}` }}>
          <span style={{ position: 'absolute', left: 0, top: 4, bottom: 4, width: 4, borderRadius: 4, background: zb.bar, display: 'block' }} />
          <div style={{ position: 'absolute', left: 12, top: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: 7 }}>
            <GlyphTile icon={zb.icon} size={30} tone={zb.tone} bg={zb.bg} rim={zb.rim} d={zb.z === 'c' ? 0 : 1.1} />
            <span style={tagStyle(13, zb.z === 'c' ? colors.brandDeep : '#3E4C61')}>{zb.tag}</span>
          </div>
        </div>
      ))}
    </Frame>
  )
}

/* ═════════════════════════════════════════ B_T12 · slide 23 · two assumptions, one gap (424 x 298) */

function B_T12({ step = 0 }: { step?: number }) {
  const W = 424
  const H = 298
  const P = useParts(step, 4)
  const walk = useWalk(4, P.done)
  const t = useClock()
  const instant = useInstant()
  const lit = (k: number) => P.lit(k) || walk === k - 1
  const AY = 138 // the arrows' line, through both actors' middles
  const GX = W / 2 // the gap
  const LX = 66 // provider centre
  const RX = 358 // customer centre
  const thought = (x: number, icon: string, k: number, side: 'l' | 'r') => (
    <Show on={P.shown(k)} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, pointerEvents: 'none' }}>
      <At x={x} y={34}>
        <span style={{ display: 'grid', placeItems: 'center', width: 58, height: 52, borderRadius: 18, ...TILE_SKIN, boxShadow: litRing(lit(k), `inset 0 0 0 1.5px ${colors.brand}40, 0 10px 20px -14px rgba(31,64,140,0.5)`), transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
          <span style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
            <Glyph icon={icon} size={26} d={k * 0.5} />
            <span style={{ position: 'absolute', right: -9, bottom: -7, color: colors.success, background: '#FFFFFF', borderRadius: 99, display: 'grid', placeItems: 'center' }}>
              <Glyph icon="CircleCheck" size={14} tone={colors.success} loop="pulse" d={k * 0.3} t={2.2} />
            </span>
          </span>
        </span>
      </At>
      {/* the thought's two small bubbles, down toward the actor */}
      <span className={lc('bob')} style={{ position: 'absolute', left: x + (side === 'l' ? 6 : -14), top: 66, width: 8, height: 8, borderRadius: 99, ...TILE_SKIN, display: 'block', ...lv(k * 0.3) }} />
      <span className={lc('bob')} style={{ position: 'absolute', left: x + (side === 'l' ? 12 : -16), top: 78, width: 5, height: 5, borderRadius: 99, ...TILE_SKIN, display: 'block', ...lv(k * 0.3 + 0.4) }} />
    </Show>
  )
  /* the mini stacks of point 3: blue over grey, the line higher on each model */
  const minis = [
    { tag: 'IaaS', prov: 0.34 },
    { tag: 'PaaS', prov: 0.66 },
    { tag: 'SaaS', prov: 0.86 },
  ]
  return (
    <Frame w={W} h={H}>
      {thought(LX, 'Settings', 2, 'l')}
      {thought(RX, 'ShieldCheck', 1, 'r')}
      {/* the provider */}
      <At x={LX} y={AY}>
        <div style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
          <GlyphTile icon="Building2" size={64} tone={PROV_INK} bg={PROV_BG} rim={`${PROV_RIM}, 0 12px 24px -16px rgba(31,64,140,0.34)`} d={0.3} />
          <span style={{ position: 'absolute', top: '100%', marginTop: 7, ...tagStyle(14) }}>Provider</span>
        </div>
      </At>
      {/* the customer: the boy with a laptop, mirrored to face the gap */}
      <At x={RX} y={AY}>
        <div style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 76, height: 104 }}>
          <img src={boyLaptop} alt="" aria-hidden draggable={false} className={lc('breathe')} style={{ width: 77, minWidth: 77, height: 104, display: 'block', transform: 'scaleX(-1)', transformOrigin: '50% 100%' }} />
          <span style={{ position: 'absolute', top: '100%', marginTop: 3, ...tagStyle(14) }}>Customer</span>
        </div>
      </At>
      {/* two straight arrows that stop short at the gap */}
      <Arrow x1={RX - 46} y1={AY} x2={GX + 30} y2={AY} on={P.shown(1)} color={lit(1) ? colors.accent : colors.brand} />
      <Arrow x1={LX + 40} y1={AY} x2={GX - 30} y2={AY} on={P.shown(2)} color={lit(2) ? colors.accent : PROV_INK} />
      {P.shown(1) && <Dot x1={RX - 46} y1={AY} x2={GX + 30} y2={AY} t={t} period={2.6} tone={colors.brand} />}
      {P.shown(2) && <Dot x1={LX + 40} y1={AY} x2={GX - 30} y2={AY} t={t} period={2.6} phase={1.3} tone={PROV_INK} />}
      {/* the gap: an open padlock, nobody's */}
      <Show on={P.shown(4)} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, pointerEvents: 'none' }}>
        <At x={GX} y={AY}>
          <div style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
            <span style={{ display: 'grid', placeItems: 'center', width: 42, height: 42, borderRadius: 12, background: '#FFF4EA', boxShadow: lit(4) ? `inset 0 0 0 1px ${colors.accent}55, 0 0 0 3px ${colors.accent}` : `inset 0 0 0 1.5px ${colors.accent}80`, color: colors.accentDark, transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
              <Glyph icon="LockOpen" size={21} tone={colors.accentDark} loop="pulse" t={2} />
            </span>
            <span style={{ position: 'absolute', top: '100%', marginTop: 6, ...tagStyle(14) }}>Gap</span>
          </div>
        </At>
      </Show>
      {/* point 3: the line moves model to model */}
      <Show on={P.shown(3)} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, pointerEvents: 'none' }}>
        {minis.map((m, i) => {
          const cx = GX + (i - 1) * 86
          return (
            <At key={m.tag} x={cx} y={250}>
              <div style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
                <span style={{ position: 'relative', width: 44, height: 38, borderRadius: 9, overflow: 'hidden', display: 'block', background: 'linear-gradient(180deg, #C9DAFF 0%, #B3CBFF 100%)', boxShadow: litRing(lit(3), `inset 0 0 0 1px ${colors.brand}55`), transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
                  <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${m.prov * 100}%`, background: 'linear-gradient(180deg, #DCE1E9 0%, #CDD4DF 100%)', display: 'block' }} />
                  <span className={lc('shift')} style={{ position: 'absolute', left: 0, right: 0, bottom: `${m.prov * 100}%`, height: 2, background: colors.brandDeep, display: 'block', ...lv(i * 0.5) }} />
                </span>
                <span style={{ position: 'absolute', top: '100%', marginTop: 4, ...tagStyle(13) }}>{m.tag}</span>
              </div>
            </At>
          )
        })}
        <Arrow x1={GX - 86 + 28} y1={250} x2={GX - 28} y2={250} on={P.shown(3)} width={2} head={8} color={colors.brand} />
        <Arrow x1={GX + 28} y1={250} x2={GX + 86 - 28} y2={250} on={P.shown(3)} width={2} head={8} color={colors.brand} delay={200} />
      </Show>
    </Frame>
  )
}

/* ═════════════════════════════════════════ B_T14 · slide 25 · the six steps of the bucket incident (1068 x 328) */

function B_T14({ step = 0, items = [], ring = 2 }: { step?: number; items?: [string, string][]; ring?: number }) {
  const W = 1068
  const H = 328
  const n = items.length || 6
  const P = useParts(step, n)
  const walk = useWalk(n, P.done, 1300)
  const t = useClock()
  const instant = useInstant()
  const GAP = 26
  const CW = (W - GAP * (n - 1)) / n
  const CH = 214
  const CY = 37 // cards' top: cards + rail centred in the frame
  const RAIL = CY + CH + 34 // the rail under the cards
  const cx = (i: number) => i * (CW + GAP) + CW / 2
  /* the travelling dot along the rail, card 1 → card 6, restarting at once */
  const period = 7.2
  return (
    <Frame w={W} h={H}>
      {items.map(([text, icon], i) => {
        const on = P.shown(i + 1)
        const isRing = i === ring
        const hot = P.lit(i + 1) || walk === i
        const base = '0 0 0 1px #CFDCF5, 0 14px 26px -18px rgba(31,64,140,0.45), 0 2px 6px rgba(31,64,140,0.06)'
        const shadow = isRing ? `${base}, 0 0 0 3px ${colors.accent}${hot ? `, 0 0 0 7px ${colors.brand}40` : ''}` : BLUE_RING(hot, base)
        return (
          <Show key={i} on={on} style={{ position: 'absolute', left: i * (CW + GAP), top: CY, width: CW, height: CH }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 16,
                background: isRing ? 'linear-gradient(180deg, #FFFFFF 0%, #FFF6EE 100%)' : 'linear-gradient(180deg, #FFFFFF 0%, #F1F6FF 100%)',
                boxShadow: shadow,
                transform: hot ? 'translateY(-3px)' : 'none',
                transition: instant ? 'none' : `box-shadow 420ms ${EASE}, transform 420ms ${EASE}`,
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}
            >
              {icon.startsWith('img:') ? (
                <span style={{ display: 'grid', placeItems: 'center', width: 46, height: 46, borderRadius: 12, background: '#FFFFFF', boxShadow: 'inset 0 0 0 1px #CFDCF5, 0 8px 18px -12px rgba(31,64,140,0.5)' }}>
                  <Icon name={icon} size={30} />
                </span>
              ) : (
                <GlyphTile icon={icon} size={46} d={i * 0.45} loop={isRing ? 'pulse' : 'float'} tone={isRing ? colors.accentDark : colors.brand} bg={isRing ? '#FFF1E4' : undefined} rim={isRing ? `inset 0 0 0 1px ${colors.accent}66` : undefined} />
              )}
              <span style={{ fontFamily: FONT, fontSize: 16, fontWeight: 500, lineHeight: 1.32, color: colors.ink, textAlign: 'center' }}>{text}</span>
            </div>
          </Show>
        )
      })}
      {/* straight arrows between the cards, at mid-card */}
      {items.slice(0, -1).map((_, i) => {
        const x1 = (i + 1) * (CW + GAP) - GAP + 4
        return <Arrow key={i} x1={x1} y1={CY + CH / 2} x2={x1 + GAP - 8} y2={CY + CH / 2} on={P.shown(i + 2)} width={2.5} head={9} delay={0} />
      })}
      {/* the rail: a node under each card, the incident travelling along it */}
      <Show on={P.shown(1)} rise={0} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, pointerEvents: 'none' }}>
        <span style={{ position: 'absolute', left: cx(0), top: RAIL - 1, width: cx(n - 1) - cx(0), height: 2, borderRadius: 2, background: '#CFDCF5', display: 'block' }} />
        {items.map((_, i) => (
          <span key={i} style={{ position: 'absolute', left: cx(i) - 6, top: RAIL - 6, width: 12, height: 12, borderRadius: 99, background: i === ring ? colors.accent : P.shown(i + 1) ? colors.brand : '#CFDCF5', boxShadow: '0 0 0 3px #FFFFFF', display: 'block', transition: instant ? 'none' : `background 420ms ${EASE}` }} />
        ))}
        {P.done && <Dot x1={cx(0)} y1={RAIL} x2={cx(n - 1)} y2={RAIL} t={t} period={period} ride={0.96} tone={colors.brand} size={12} />}
      </Show>
    </Frame>
  )
}

/* ═════════════════════════════════════════ B_T15 · slide 26 · the checking tools, drawn (602 x 222) */

/** the browser's own frame: three dots and the tab title */
function BrowserBar({ title }: { title: string }) {
  return (
    <div style={{ height: 22, display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', background: '#EEF2F8', borderBottom: '1px solid #DCE3EF', flexShrink: 0 }}>
      <span style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {['#F26B5B', '#F5BE4F', '#5BC46A'].map((c) => (
          <span key={c} style={{ width: 6, height: 6, borderRadius: 9, background: c, display: 'block' }} />
        ))}
      </span>
      <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 10.5, color: '#3B4A63', whiteSpace: 'nowrap', background: '#FFFFFF', borderRadius: '6px 6px 0 0', padding: '2px 8px 1px', alignSelf: 'flex-end', boxShadow: 'inset 0 1px 0 #DCE3EF' }}>{title}</span>
    </div>
  )
}

/** the AWS console's dark top bar with the service mark on its white tile and the page name */
function ConsoleBar({ mark, page }: { mark: string; page: string }) {
  return (
    <div style={{ height: 32, background: '#232F3E', display: 'flex', alignItems: 'center', gap: 8, padding: '0 9px', flexShrink: 0 }}>
      <MarkTile src={mark} size={22} k={0.74} />
      <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: '#FFFFFF', whiteSpace: 'nowrap' }}>{page}</span>
    </div>
  )
}

const Bar = ({ w, h = 7, c = '#DCE4F2' }: { w: number | string; h?: number; c?: string }) => <span style={{ display: 'block', width: w, height: h, borderRadius: 4, background: c, flexShrink: 0 }} />

/** a console window that rings orange while lit */
function Window({ x, w, h, lit, on, children, tab }: { x: number; w: number; h: number; lit: boolean; on: boolean; children: ReactNode; tab: string }) {
  const instant = useInstant()
  const base = '0 0 0 1px #CFDCF5, 0 14px 28px -18px rgba(31,64,140,0.45), 0 2px 6px rgba(31,64,140,0.06)'
  return (
    <Show on={on} style={{ position: 'absolute', left: x, top: 0, width: w, height: h }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 11, background: '#FFFFFF', boxShadow: litRing(lit, base), transition: instant ? 'none' : `box-shadow 420ms ${EASE}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <BrowserBar title={tab} />
        {children}
      </div>
    </Show>
  )
}

function B_T15({ step = 0 }: { step?: number }) {
  const W = 602
  const H = 222
  const P = useParts(step, 3)
  const walk = useWalk(3, P.done)
  const lit = (k: number) => P.lit(k) || walk === k - 1
  const WW = 244
  const row = (children: ReactNode, key: string, flag?: 'warn' | 'ok') => (
    <div key={key} style={{ height: 30, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', borderTop: '1px solid #EEF2F8' }}>
      {children}
      <span style={{ marginLeft: 'auto', display: 'grid', placeItems: 'center' }}>
        {flag === 'warn' ? <Glyph icon="TriangleAlert" size={15} tone={colors.accentDark} loop="pulse" t={1.8} d={key.length * 0.2} /> : <Glyph icon="CircleCheck" size={15} tone={colors.success} loop="float" d={key.length * 0.3} />}
      </span>
    </div>
  )
  const label = (s: string) => <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 12.5, color: colors.ink, whiteSpace: 'nowrap' }}>{s}</span>
  const heading = (s: string) => (
    <div style={{ height: 26, display: 'flex', alignItems: 'center', padding: '0 10px' }}>
      <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: colors.brandDeep }}>{s}</span>
    </div>
  )
  const WH = H
  return (
    <Frame w={W} h={H}>
      {/* Trusted Advisor: the security checks list */}
      <Window x={0} w={WW} h={WH} lit={lit(1)} on={P.shown(1)} tab="Trusted Advisor">
        <ConsoleBar mark={awsTa} page="Trusted Advisor" />
        <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
          {heading('Security Checks')}
          {row(
            <>
              <img src={resBucket} alt="" aria-hidden draggable={false} style={{ width: 18, height: 'auto', display: 'block' }} />
              {label('Public Buckets')}
            </>,
            'pb',
            'warn',
          )}
          {row(
            <>
              <Glyph icon="Shield" size={17} tone={colors.brand} />
              {label('Open Security Groups')}
            </>,
            'osg',
            'warn',
          )}
          {row(
            <>
              <Bar w={18} h={14} />
              <Bar w={96} />
            </>,
            'r3',
            'ok',
          )}
          {row(
            <>
              <Bar w={18} h={14} />
              <Bar w={72} />
            </>,
            'r4',
            'ok',
          )}
          <span aria-hidden className={lc('scan')} style={{ position: 'absolute', left: 0, right: 0, top: 26, height: 30, background: `linear-gradient(180deg, ${colors.brand}00 0%, ${colors.brand}1f 50%, ${colors.brand}00 100%)`, display: 'block', pointerEvents: 'none' }} />
        </div>
      </Window>
      {/* IAM Access Analyzer: one finding, a bucket reachable from outside */}
      <Window x={WW + 12} w={WW} h={WH} lit={lit(2)} on={P.shown(2)} tab="IAM Access Analyzer">
        <ConsoleBar mark={resAnalyzer} page="Access Analyzer" />
        <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
          {heading('Findings')}
          <div style={{ position: 'relative', height: 72, margin: '0 10px', borderRadius: 10, background: '#FFF8F1', boxShadow: `inset 0 0 0 1px ${colors.accent}55` }}>
            {/* resource → outside world */}
            <span style={{ position: 'absolute', left: 14, top: 10, display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: 9, background: '#FFFFFF', boxShadow: 'inset 0 0 0 1px #CFDCF5' }}>
              <img src={resBucket} alt="" aria-hidden draggable={false} style={{ width: 22, height: 'auto', display: 'block' }} />
            </span>
            <Arrow x1={52} y1={26} x2={98} y2={26} on={P.shown(2)} width={2} head={8} color={colors.accentDark} delay={300} />
            <span style={{ position: 'absolute', left: 102, top: 10, display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: 9, background: '#FFFFFF', boxShadow: 'inset 0 0 0 1px #CFDCF5', color: colors.brand }}>
              <Glyph icon="Globe" size={18} loop="spin" t={9} />
            </span>
            <span style={{ position: 'absolute', left: 14, top: 48, ...tagStyle(12.5, colors.ink), textAlign: 'left' }}>External Access</span>
            <span style={{ position: 'absolute', right: 12, top: 18, display: 'grid', placeItems: 'center' }}>
              <Glyph icon="TriangleAlert" size={16} tone={colors.accentDark} loop="pulse" t={1.8} />
            </span>
          </div>
          <div style={{ height: 8 }} />
          {row(
            <>
              <img src={resPolicy} alt="" aria-hidden draggable={false} style={{ width: 18, height: 'auto', display: 'block' }} />
              <Bar w={92} />
            </>,
            'pol',
            'ok',
          )}
          {row(
            <>
              <Bar w={18} h={14} />
              <Bar w={70} />
            </>,
            'r2',
            'ok',
          )}
          <span aria-hidden className={lc('scan2')} style={{ position: 'absolute', left: 0, right: 0, top: 26, height: 30, background: `linear-gradient(180deg, ${colors.brand}00 0%, ${colors.brand}1c 50%, ${colors.brand}00 100%)`, display: 'block', pointerEvents: 'none' }} />
        </div>
      </Window>
      {/* the Well-Architected Tool: the security pillar's checklist */}
      <Show on={P.shown(3)} style={{ position: 'absolute', left: 2 * WW + 24, top: 0, width: W - 2 * WW - 24, height: H }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <MarkTile src={awsWa} size={58} k={0.7} ring={lit(3) ? `0 0 0 3px ${colors.accent}` : undefined} />
          <span style={{ ...tagStyle(13), whiteSpace: 'normal', width: 80 }}>Security Pillar</span>
          <GlyphTile icon="ListChecks" size={38} loop="pulse" t={2.4} />
        </div>
      </Show>
    </Frame>
  )
}

export const figures: Record<string, Fig> = {
  B_T07: B_T07 as unknown as Fig,
  B_STACK: B_STACK as unknown as Fig,
  B_T12: B_T12 as unknown as Fig,
  B_T14: B_T14 as unknown as Fig,
  B_T15: B_T15 as unknown as Fig,
}

/* builder b's loop vocabulary (transform / opacity only, `sb` prefix), held still on ?still, thumbnails and reduced motion */
export const css = `
.sb { animation-delay: var(--sb-d, 0s); }
@keyframes sb-float { 0%, 100% { transform: translateY(0) scale(1) } 50% { transform: translateY(-2.5px) scale(1.06) } }
.sb-float { animation: sb-float var(--sb-t, 3.6s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes sb-bob { 0%, 100% { transform: translateY(-2px) } 50% { transform: translateY(2px) } }
.sb-bob { animation: sb-bob var(--sb-t, 2.4s) ease-in-out infinite; }
@keyframes sb-pulse { 0%, 100% { transform: scale(0.92) } 50% { transform: scale(1.08) } }
.sb-pulse { animation: sb-pulse var(--sb-t, 1.8s) ease-in-out infinite; }
@keyframes sb-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
.sb-spin { animation: sb-spin var(--sb-t, 9s) linear infinite; }
@keyframes sb-glow { 0%, 100% { opacity: 0.25 } 50% { opacity: 0.9 } }
.sb-glow { animation: sb-glow var(--sb-t, 2.6s) ease-in-out infinite; }
@keyframes sb-breathe { 0%, 100% { transform: scaleX(-1) scaleY(1) } 50% { transform: scaleX(-1) scaleY(1.015) } }
.sb-breathe { animation: sb-breathe var(--sb-t, 3.4s) ease-in-out infinite; }
/* the line on each mini stack nudges up and back, one after another */
@keyframes sb-shift { 0%, 100% { transform: translateY(0) } 40%, 60% { transform: translateY(-5px) } }
.sb-shift { animation: sb-shift var(--sb-t, 3s) cubic-bezier(0.45,0,0.55,1) infinite; }
/* a console scan band sweeping down the list, restarting at once */
@keyframes sb-scan { 0% { transform: translateY(0); opacity: 0 } 8% { opacity: 1 } 92% { opacity: 1 } 100% { transform: translateY(120px); opacity: 0 } }
.sb-scan { animation: sb-scan 3.2s linear infinite; }
.sb-scan2 { animation: sb-scan 3.2s linear infinite; animation-delay: -1.6s; }
.cc-still .sb, .deck-thumb .sb, .cc-still .sb-scan, .cc-still .sb-scan2, .deck-thumb .sb-scan, .deck-thumb .sb-scan2 { animation: none !important; }
.cc-still .sb-scan, .cc-still .sb-scan2, .deck-thumb .sb-scan, .deck-thumb .sb-scan2 { opacity: 0 !important; }
.cc-still .sb-breathe, .deck-thumb .sb-breathe { transform: scaleX(-1) !important; }
@media (prefers-reduced-motion: reduce) { .sb, .sb-scan, .sb-scan2 { animation: none !important; } .sb-scan, .sb-scan2 { opacity: 0 !important; } .sb-breathe { transform: scaleX(-1) !important; } }
`
