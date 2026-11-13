import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { TILE_SKIN } from '@/decks/figures/card'
import { MOTION, motionHeld } from '@/motion/tokens'
import { litRing } from '@/decks/figures/net/frames'
import { Icon } from '@/engine/icon'
import awsWord from '../images/aws-logo.png'
import s3Bucket from '../images/res-s3-bucket.svg'
import ec2Mark from '../images/aws-ec2.svg'
import rdsMark from '../images/aws-rds.svg'
import s3Mark from '../images/aws-s3.svg'

/*
 * BUILDER A · Cloud Security & Shared Responsibility (Session 12), sections 1-2:
 *   slide 6 A_T01 (CIA circles on a cloud), 9 A_T03 (three risks in one cloud), 11 A_T04 (provider | customer line),
 *   13 A_T05 (the TR table inside the boundary diagram), 14 A_T05B (split per service, ISO 27001, open bucket),
 *   15 A_T06 (the public bucket, a customer-side gap).
 *
 * Built to Sessions 9-11 as reviewed (standing corrections 1-16, cloud R10-R13): icon-first, one Title Case tag per
 * untagged icon, no chips / badges / connector labels, official AWS marks on still white tiles, every glyph carries a
 * quiet loop after its build, a sequential highlight loops first → last → first, straight arrows, equal padding,
 * nothing overlapping. Provider = grey, customer = blue, the same two tints as the T11 table and the T08-T10 stacks.
 * `step` 0 = nothing pressed; step i lights point i's part while it is the current press. Loops are CSS (`a12-*`,
 * transform / opacity only) or a wall-clock rAF clock; held still on ?still, thumbnails and reduced motion (the full
 * end state, nothing lit).
 */

const EASE = MOTION.ease
const useHeld = () => motionHeld(useInstant())
const font = "'DM Sans', system-ui, sans-serif"
const lc = (kind: string) => `a12 a12-${kind}`
const lv = (d = 0, t?: number, extra: Record<string, string | number> = {}): CSSProperties =>
  ({ ['--a12-d' as string]: `${-d}s`, ...(t ? { ['--a12-t' as string]: `${t}s` } : {}), ...extra }) as CSSProperties

const PROV = { fill: 'linear-gradient(180deg, #F4F6F9 0%, #E7EAF0 100%)', edge: '#CBD2DD', ink: '#3E4C63', solid: 'linear-gradient(180deg, #E3E7EE 0%, #D3D9E3 100%)' }
const CUST = { fill: 'linear-gradient(180deg, #EEF3FF 0%, #DDE7FF 100%)', edge: '#B7CBFA', ink: colors.brandDark, solid: 'linear-gradient(180deg, #CFDDFF 0%, #B9CDFF 100%)' }

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
function MarkTile({ src, size = 48, lit = false, d = 0 }: { src: string; size?: number; lit?: boolean; d?: number }) {
  const instant = useInstant()
  const r = Math.round(size * 0.26)
  return (
    <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: size, height: size, flexShrink: 0 }}>
      <span aria-hidden className={lc('halo')} style={{ position: 'absolute', inset: -5, borderRadius: r + 5, background: `radial-gradient(closest-side, ${colors.brand}2e, ${colors.brand}00)`, ...lv(d, 3.6) }} />
      <span style={{ position: 'absolute', inset: 0, borderRadius: r, background: '#FFFFFF', boxShadow: litRing(lit, `inset 0 0 0 1.5px ${colors.brand}2e, 0 8px 18px -12px rgba(31,64,140,0.45)`), transition: instant ? 'none' : `box-shadow 420ms ${EASE}`, display: 'grid', placeItems: 'center' }}>
        <img src={src} alt="" aria-hidden draggable={false} style={{ display: 'block', width: Math.round(size * 0.66), height: Math.round(size * 0.66), objectFit: 'contain' }} />
      </span>
    </span>
  )
}

/** a soft cloud built from overlapping shapes of one fill (no stroke, so the union reads as one silhouette) */
function CloudShape({ x, y, w, h, bumps, id, fill = ['#F3F7FF', '#DCE7FD'] }: { x: number; y: number; w: number; h: number; bumps: [number, number, number][]; id: string; fill?: [string, string] }) {
  return (
    <svg aria-hidden width={w} height={h} style={{ position: 'absolute', left: x, top: y, overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={fill[0]} />
          <stop offset="1" stopColor={fill[1]} />
        </linearGradient>
        <filter id={`${id}-s`} x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#1F408C" floodOpacity="0.16" />
        </filter>
      </defs>
      <g fill={`url(#${id}-g)`} filter={`url(#${id}-s)`}>
        <rect x={0} y={h * 0.42} width={w} height={h * 0.58} rx={h * 0.29} />
        {bumps.map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} />
        ))}
      </g>
    </svg>
  )
}

/* ================================================================== A_T01 · CIA circles on a cloud (600 x 330) */

const CIA = [
  { cx: 235, cy: 112, icon: 'Lock', tag: 'Confidentiality', tx: 192, ty: 52, loop: 'shackle', col: '#2D63FB' },
  { cx: 365, cy: 112, icon: 'FileCheck', tag: 'Integrity', tx: 408, ty: 52, loop: 'pulse', col: '#4F86FF' },
  { cx: 300, cy: 210, icon: 'Activity', tag: 'Availability', tx: 300, ty: 238, loop: 'beat', col: '#0146C7' },
] as const

function A_T01({ step }: { step: number }) {
  const held = useHeld()
  const instant = useInstant()
  const W = 600
  const H = 330
  const R = 110
  const lit = (i: number) => step === i + 1 && !held
  const built = step >= 3 || held
  return (
    <Frame w={W} h={H}>
      <svg aria-hidden width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {CIA.map((c, i) => {
          const on = step >= i + 1 || held
          return (
            <g key={c.tag} style={{ opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 520ms ${EASE}` }}>
              <circle cx={c.cx} cy={c.cy} r={R} fill={c.col} fillOpacity={lit(i) ? 0.2 : 0.1} stroke={lit(i) ? colors.accent : c.col} strokeOpacity={lit(i) ? 1 : 0.55} strokeWidth={lit(i) ? 3 : 2} style={{ transition: instant ? 'none' : `all 420ms ${EASE}` }} />
              {/* after the build the three circles breathe in turn, first → last → first, forever */}
              {built && !held && <circle className={lc('seq')} cx={c.cx} cy={c.cy} r={R} fill={c.col} style={{ ...lv(-i * 1.4, 4.2), transformOrigin: `${c.cx}px ${c.cy}px` }} />}
            </g>
          )
        })}
      </svg>
      {CIA.map((c, i) => (
        <Show key={c.tag} on={step >= i + 1 || held} delay={120} style={{ position: 'absolute', left: c.tx - 70, top: c.ty - 22, width: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <GlyphTile icon={c.icon} size={44} loop={c.loop} d={i * 0.5} t={2.4} lit={lit(i)} />
          <span style={tagStyle(colors.ink, 15)}>{c.tag}</span>
        </Show>
      ))}
      {/* the shared infrastructure in the middle: one cloud holding three tenants' blocks */}
      <div style={{ position: 'absolute', left: 300 - 40, top: 132, width: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div style={{ position: 'relative', width: 70, height: 46 }}>
          <CloudShape x={0} y={0} w={70} h={46} id="a12-c1" bumps={[[22, 22, 15], [40, 15, 17], [55, 25, 12]]} fill={['#FFFFFF', '#CFDCFB']} />
          {[0, 1, 2].map((k) => (
            <span key={k} className={lc('tenant')} style={{ position: 'absolute', left: 16 + k * 14, top: 22, width: 10, height: 14, borderRadius: 3, background: ['#2D63FB', '#FF8A3D', '#0146C7'][k], boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45)', transformOrigin: '50% 100%', ...lv(k * 0.6, 2.4) }} />
          ))}
        </div>
        <span style={tagStyle(colors.ink, 13)}>Shared</span>
      </div>
    </Frame>
  )
}

/* ================================================================== A_T03 · three risks in one cloud (600 x 330) */

/** a straight drift of small files from (x1, y1) to (x2, y2), one leaving every `gap` s, on the wall clock */
function Drift({ x1, y1, x2, y2, t, n = 3, period = 3, ride = 0.85 }: { x1: number; y1: number; x2: number; y2: number; t: number; n?: number; period?: number; ride?: number }) {
  return (
    <>
      {Array.from({ length: n }, (_, k) => {
        const u = ((((t - (k * period) / n) % period) + period) % period) / period
        if (u > ride) return null
        const q = u / ride
        const op = q < 0.15 ? q / 0.15 : q > 0.8 ? (1 - q) / 0.2 : 1
        return (
          <span key={k} aria-hidden style={{ position: 'absolute', left: x1 + (x2 - x1) * q - 8, top: y1 + (y2 - y1) * q - 10, width: 16, height: 20, opacity: op, color: colors.brandDark, display: 'grid', placeItems: 'center', borderRadius: 4, background: '#FFFFFF', boxShadow: '0 4px 8px -5px rgba(16,32,58,0.5), inset 0 0 0 1px #CFDCF5' }}>
            <Icon name="FileText" size={12} />
          </span>
        )
      })}
    </>
  )
}

/** a warning glyph that bobs above its target, with a short straight arrow down to it */
function Warn({ x, y, on, lit }: { x: number; y: number; on: boolean; lit: boolean }) {
  return (
    <Show on={on} from="translateY(-8px)" style={{ position: 'absolute', left: x - 18, top: y, width: 36, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <span className={lc('bob')} style={{ display: 'grid', placeItems: 'center', ...lv(x / 200, 2.2) }}>
        <GlyphTile icon="TriangleAlert" size={36} tone={colors.accent} lit={lit} />
      </span>
      <svg aria-hidden width={14} height={22} style={{ display: 'block', marginTop: 2 }}>
        <line x1={7} y1={0} x2={7} y2={13} stroke={colors.accent} strokeWidth={2.5} strokeLinecap="round" />
        <path d="M 7 22 L 1.5 12 L 12.5 12 Z" fill={colors.accent} />
      </svg>
    </Show>
  )
}

function Rack({ hot }: { hot: boolean }) {
  return (
    <div style={{ width: 92, padding: 7, borderRadius: 12, background: 'linear-gradient(180deg, #3F5A86 0%, #24395E 100%)', boxShadow: '0 10px 18px -10px rgba(16,32,58,0.6), inset 0 1.5px 0 rgba(255,255,255,0.25)', display: 'flex', flexDirection: 'column', gap: 5 }}>
      {[0, 1].map((k) => (
        <div key={k} style={{ position: 'relative', height: 26, borderRadius: 6, background: k === 0 ? 'linear-gradient(180deg, #5B8CFF, #2D63FB)' : 'linear-gradient(180deg, #8FA6CC, #61789F)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)' }}>
          {/* each tenant's load bar: the neighbour's spikes to full, the other's is squeezed */}
          <span style={{ position: 'absolute', left: 7, right: 7, bottom: 5, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.28)' }} />
          <span className={hot ? lc(k === 0 ? 'spike' : 'squeeze') : undefined} style={{ position: 'absolute', left: 7, width: 64, bottom: 5, height: 5, borderRadius: 3, background: k === 0 ? '#FFC24A' : '#FFFFFF', transformOrigin: '0 50%', transform: hot ? undefined : 'scaleX(0.45)', ...lv(0, 2.8) }} />
          <span className={lc('led')} style={{ position: 'absolute', right: 8, top: 6, width: 6, height: 6, borderRadius: 99, background: '#5BE38F', boxShadow: '0 0 5px #5BE38F', ...lv(k * 0.7, 1.4) }} />
        </div>
      ))}
    </div>
  )
}

function A_T03({ step }: { step: number }) {
  const held = useHeld()
  const t = useClock(0)
  const W = 600
  const H = 330
  const lit = (i: number) => step === i && !held
  const on = (i: number) => step >= i || held
  const OY = 205 // the objects' centre line
  const TY = 258 // their tags
  const st = [140, 300, 450]
  const fan = [158, 198, 238]
  return (
    <Frame w={W} h={H}>
      <CloudShape x={14} y={58} w={572} h={268} id="a12-c3" bumps={[[140, 80, 74], [286, 64, 96], [436, 82, 76]]} />
      {/* the internet, outside the cloud: where the public bucket's files go */}
      <div style={{ position: 'absolute', left: 30, top: 6, width: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <GlyphTile icon="Globe" size={40} loop="spin" t={9} />
        <span style={tagStyle(colors.ink, 13)}>Internet</span>
      </div>
      {on(1) && !held && <Drift x1={st[0] - 40} y1={OY - 10} x2={96} y2={30} t={t} />}

      {/* 1 · the public bucket */}
      <div style={{ position: 'absolute', left: st[0] - 60, top: OY - 34, width: 120, display: 'flex', justifyContent: 'center' }}>
        <MarkTile src={s3Bucket} size={68} lit={lit(1)} />
      </div>
      <span style={{ position: 'absolute', left: st[0] - 70, top: TY, width: 140, ...tagStyle(colors.ink, 14) }}>Public Bucket</span>
      <Warn x={st[0]} y={OY - 100} on={on(1)} lit={lit(1)} />

      {/* 2 · the noisy neighbour: one rack, two tenants */}
      <div style={{ position: 'absolute', left: st[1] - 53, top: OY - 37, borderRadius: 14, boxShadow: litRing(lit(2)), transition: `box-shadow 420ms ${EASE}` }}>
        <Rack hot={on(2) && !held} />
      </div>
      <span style={{ position: 'absolute', left: st[1] - 80, top: TY, width: 160, ...tagStyle(colors.ink, 14) }}>Noisy Neighbour</span>
      <Warn x={st[1]} y={OY - 100} on={on(2)} lit={lit(2)} />

      {/* 3 · the leaked key reaching many resources through APIs */}
      <div style={{ position: 'absolute', left: st[2] - 34, top: OY - 22 }}>
        <GlyphTile icon="KeyRound" size={44} tone={colors.accentDark} loop="turn" t={2.8} lit={lit(3)} />
      </div>
      <Show on={on(3)} from="none" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <svg aria-hidden width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {fan.map((fy, k) => (
            <line key={k} className={lc('dash')} x1={st[2] - 12 + 22} y1={OY} x2={520 - 15} y2={fy} stroke={colors.accent} strokeWidth={2} strokeDasharray="5 6" strokeLinecap="round" style={lv(k * 0.3, 1.2)} />
          ))}
        </svg>
        {fan.map((fy, k) => (
          <span key={k} style={{ position: 'absolute', left: 520 - 15, top: fy - 15 }}>
            <GlyphTile icon={['Database', 'Server', 'Archive'][k]} size={30} loop="bob" d={k * 0.5} t={2.4} />
          </span>
        ))}
      </Show>
      <span style={{ position: 'absolute', left: st[2] - 90 + 20, top: TY, width: 140, ...tagStyle(colors.ink, 14) }}>Leaked Credential</span>
      <Warn x={st[2] - 12} y={OY - 100} on={on(3)} lit={lit(3)} />
    </Frame>
  )
}

/* ================================================================== A_T04 · the provider | customer line (600 x 300) */

function SideRow({ icon, tag, tone, loop, d }: { icon: string; tag: string; tone: string; loop: string; d: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <GlyphTile icon={icon} size={44} tone={tone} loop={loop} d={d} t={2.6} />
      <span style={{ ...tagStyle(colors.ink, 15), textAlign: 'left' }}>{tag}</span>
    </div>
  )
}

function A_T04({ step }: { step: number }) {
  const held = useHeld()
  const instant = useInstant()
  const t = useClock(0)
  const W = 600
  const H = 300
  const lit = (i: number) => step === i && !held
  /* point 3: the line slides once to each side and comes back, then rests (3 s after the press) */
  const t3 = useRef<number | null>(null)
  if (step >= 3 && !held && t3.current === null) t3.current = t
  if (step < 3) t3.current = null
  const s = t3.current === null ? 1 : Math.min(1, (t - t3.current) / 3)
  const off = held ? 0 : Math.sin(s * Math.PI * 2) * 34 * (1 - s * 0.3)
  const X = 300 + off
  const G = 18 // panel to line gap
  const panel = (left: boolean, on: boolean, l: boolean): CSSProperties => ({
    position: 'absolute',
    top: 8,
    bottom: 8,
    left: left ? 8 : X + G,
    width: left ? X - G - 8 : W - 8 - (X + G),
    borderRadius: 18,
    background: left ? PROV.fill : CUST.fill,
    boxShadow: litRing(l, `inset 0 0 0 1.5px ${left ? PROV.edge : CUST.edge}, 0 12px 24px -18px rgba(31,64,140,0.4)`),
    opacity: on ? 1 : 0.35,
    transition: instant ? 'none' : `opacity 520ms ${EASE}, box-shadow 420ms ${EASE}`,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    overflow: 'hidden',
  })
  return (
    <Frame w={W} h={H}>
      <div style={panel(true, step >= 1 || held, lit(1))}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: PROV.ink }}>
          <Icon name="Building2" size={20} />
          <span style={{ ...tagStyle(PROV.ink, 18), fontWeight: 700 }}>Provider</span>
        </div>
        <SideRow icon="Warehouse" tag="Data Centre" tone={PROV.ink} loop="bob" d={0} />
        <SideRow icon="Server" tag="Hardware" tone={PROV.ink} loop="led" d={0.6} />
        <SideRow icon="Layers" tag="Hypervisor" tone={PROV.ink} loop="pulse" d={1.2} />
      </div>
      <div style={panel(false, step >= 2 || held, lit(2))}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: CUST.ink }}>
          <Icon name="UserCog" size={20} />
          <span style={{ ...tagStyle(CUST.ink, 18), fontWeight: 700 }}>Customer</span>
        </div>
        <SideRow icon="Database" tag="Data" tone={colors.brand} loop="bob" d={0.3} />
        <SideRow icon="Settings" tag="Settings" tone={colors.brand} loop="spin" d={0} />
        <SideRow icon="KeyRound" tag="Access" tone={colors.brand} loop="turn" d={0.9} />
      </div>
      {/* the boundary: one straight line with a grip in its middle */}
      <svg aria-hidden width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <line x1={X} y1={8} x2={X} y2={H - 8} stroke={lit(3) ? colors.accent : colors.brandDeep} strokeWidth={3} strokeLinecap="round" style={{ transition: instant ? 'none' : `stroke 420ms ${EASE}` }} />
      </svg>
      <span style={{ position: 'absolute', left: X - 13, top: H / 2 - 13, width: 26, height: 26, borderRadius: 99, background: '#FFFFFF', boxShadow: litRing(lit(3), `inset 0 0 0 2.5px ${colors.brandDeep}, 0 6px 12px -6px rgba(16,32,58,0.6)`), display: 'grid', placeItems: 'center', color: colors.brandDeep }}>
        <Icon name="ArrowLeftRight" size={14} />
      </span>
    </Frame>
  )
}

/* ================================================================== A_T05 · the TR table inside the boundary diagram (1080 x 320) */

type Rows = { title: string; rows: [string, string][] }

function A_T05({ step, left, right, logo }: { step: number; left: Rows; right: Rows; logo?: string }) {
  const held = useHeld()
  const instant = useInstant()
  const t = useClock(0)
  const W = 1080
  const H = 320
  const PW = 470 // each panel
  const RX = 610 // the right panel's left edge
  const RY0 = 64
  const RH = 52
  const RG = 6
  /* the pair of the current press is lit; once the four are built the orange highlight walks the pairs, the last
     (just pressed) first, then top → bottom → top, 1.4 s each, forever: it never parks on the last pair (R13) */
  const tb = useRef<number | null>(null)
  if (step >= 4 && !held && tb.current === null) tb.current = t
  if (step < 4) tb.current = null
  const walk = tb.current === null ? -1 : (3 + Math.floor((t - tb.current) / 1.4)) % 4
  const lit = (i: number) => !held && (walk >= 0 ? walk === i : step === i + 1)
  const side = (rs: Rows, x: number, prov: boolean) => (
    <div style={{ position: 'absolute', left: x, top: 0, width: PW, height: H, borderRadius: 18, background: prov ? PROV.fill : CUST.fill, boxShadow: `inset 0 0 0 1.5px ${prov ? PROV.edge : CUST.edge}, 0 12px 24px -18px rgba(31,64,140,0.4)` }}>
      <div style={{ position: 'absolute', left: 18, top: 16, display: 'flex', alignItems: 'center', gap: 10, color: prov ? PROV.ink : CUST.ink }}>
        <Icon name={prov ? 'Building2' : 'UserCog'} size={20} />
        <span style={{ ...tagStyle(prov ? PROV.ink : CUST.ink, 18), fontWeight: 700, textAlign: 'left' }}>{rs.title}</span>
      </div>
      {rs.rows.map(([text, icon], i) => {
        const on = step >= i + 1 || held
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 14,
              right: 14,
              top: RY0 + i * (RH + RG),
              height: RH,
              borderRadius: 12,
              background: '#FFFFFF',
              boxShadow: litRing(lit(i), `inset 0 0 0 1px ${prov ? PROV.edge : CUST.edge}, 0 6px 14px -12px rgba(31,64,140,0.5)`),
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '0 14px 0 8px',
              opacity: on ? 1 : 0,
              transform: on ? 'none' : `translateX(${prov ? -14 : 14}px)`,
              transition: instant ? 'none' : `opacity 480ms ${EASE}, transform 480ms ${EASE}, box-shadow 420ms ${EASE}`,
            }}
          >
            <GlyphTile icon={icon} size={36} tone={prov ? PROV.ink : colors.brand} loop={['bob', 'pulse', 'led', 'turn'][i]} d={i * 0.4 + (prov ? 0 : 0.2)} t={2.6} bg={prov ? '#F4F6F9' : '#EEF3FF'} />
            <span style={{ fontFamily: font, fontSize: 16, fontWeight: 500, lineHeight: 1.25, color: colors.ink }}>{text}</span>
          </div>
        )
      })}
    </div>
  )
  const lineX = W / 2
  return (
    <Frame w={W} h={H}>
      {side(left, 0, true)}
      {side(right, RX, false)}
      {/* the AWS Shared Responsibility Model page: the AWS mark heads the line */}
      <div style={{ position: 'absolute', left: lineX - 48, top: 6, width: 96, height: 48, borderRadius: 12, background: '#FFFFFF', boxShadow: `inset 0 0 0 1.5px ${colors.brand}2e, 0 8px 18px -12px rgba(31,64,140,0.45)`, display: 'grid', placeItems: 'center' }}>
        <img src={logo ? logo.replace(/^img:/, '') : awsWord} alt="" aria-hidden draggable={false} style={{ display: 'block', height: 28, width: 'auto' }} />
      </div>
      <svg aria-hidden width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <line x1={lineX} y1={62} x2={lineX} y2={H - 6} stroke={colors.brandDeep} strokeWidth={3} strokeLinecap="round" />
        {left.rows.map((_, i) => {
          const y = RY0 + i * (RH + RG) + RH / 2
          const on = step >= i + 1 || held
          const hot = lit(i)
          return (
            <g key={i} style={{ opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 480ms ${EASE}` }}>
              <line x1={PW + 6} y1={y} x2={lineX - 12} y2={y} stroke={hot ? colors.brand : '#B9C6DE'} strokeWidth={2} strokeLinecap="round" />
              <line x1={lineX + 12} y1={y} x2={RX - 6} y2={y} stroke={hot ? colors.brand : '#B9C6DE'} strokeWidth={2} strokeLinecap="round" />
              <circle cx={lineX} cy={y} r={hot ? 8 : 6} fill="#FFFFFF" stroke={lit(i) ? colors.accent : colors.brandDeep} strokeWidth={2.5} style={{ transition: instant ? 'none' : `all 360ms ${EASE}` }} />
            </g>
          )
        })}
      </svg>
    </Frame>
  )
}

/* ================================================================== A_T05B · split per service, ISO 27001, open bucket (600 x 360) */

const SERVICES = [
  { mark: ec2Mark, tag: 'EC2', split: 0.3 },
  { mark: rdsMark, tag: 'RDS', split: 0.6 },
  { mark: s3Mark, tag: 'S3', split: 0.78 },
]

function A_T05B({ step }: { step: number }) {
  const held = useHeld()
  const instant = useInstant()
  const t = useClock(0)
  const W = 600
  const H = 360
  const lit = (i: number) => step === i && !held
  const on = (i: number) => step >= i || held
  const CX = [72, 182, 292] // column centres
  const CW = 64
  const CT = 92 // column top
  const CB = 300 // column bottom
  const CH = CB - CT
  return (
    <Frame w={W} h={H}>
      {/* 1 · the split is drawn per service: each column has its own line */}
      {SERVICES.map((s, i) => {
        const bob = held ? 0 : Math.sin(t * 1.6 + i * 1.3) * 3
        const yLine = CB - CH * s.split + bob
        return (
          <div key={s.tag}>
            <div style={{ position: 'absolute', left: CX[i] - 50, top: 4, width: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <MarkTile src={s.mark} size={46} lit={lit(1)} d={i * 0.8} />
              <span style={tagStyle(colors.ink, 14)}>{s.tag}</span>
            </div>
            <div style={{ position: 'absolute', left: CX[i] - CW / 2, top: CT, width: CW, height: CH, borderRadius: 14, overflow: 'hidden', boxShadow: `inset 0 0 0 1.5px ${CUST.edge}, 0 12px 22px -16px rgba(31,64,140,0.5)` }}>
              <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: yLine - CT, background: CUST.solid }} />
              <div style={{ position: 'absolute', left: 0, right: 0, top: yLine - CT, bottom: 0, background: PROV.solid, boxShadow: lit(2) ? `inset 0 0 0 3px ${colors.accent}` : undefined, transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }} />
              {/* the ISO 27001 stamp sits on the provider part only */}
              <Show on={on(2)} from="scale(0.6)" style={{ position: 'absolute', left: CW / 2 - 14, top: (yLine - CT + CH) / 2 - 14, width: 28, height: 28, color: '#3E4C63', display: 'grid', placeItems: 'center' }}>
                <span className={lc('pulse')} style={{ display: 'grid', placeItems: 'center', ...lv(i * 0.5, 2.4) }}>
                  <Icon name="BadgeCheck" size={22} />
                </span>
              </Show>
            </div>
            <svg aria-hidden width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
              <line x1={CX[i] - CW / 2 - 8} y1={yLine} x2={CX[i] + CW / 2 + 8} y2={yLine} stroke={lit(1) ? colors.accent : colors.brandDeep} strokeWidth={3} strokeLinecap="round" />
            </svg>
          </div>
        )
      })}
      {/* the two tints, named once */}
      <div style={{ position: 'absolute', left: 16, top: 318, width: 340, display: 'flex', justifyContent: 'center', gap: 26 }}>
        {[CUST, PROV].map((c, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 18, height: 18, borderRadius: 5, background: c.solid, boxShadow: `inset 0 0 0 1.5px ${c.edge}` }} />
            <span style={tagStyle(colors.ink, 14)}>{i === 0 ? 'Customer' : 'Provider'}</span>
          </span>
        ))}
      </div>

      {/* 2 · the certificate: proves the provider's side */}
      <Show on={on(2)} style={{ position: 'absolute', left: 384, top: 26, width: 200, height: 140, borderRadius: 18, background: PROV.fill, boxShadow: litRing(lit(2), `inset 0 0 0 1.5px ${PROV.edge}, 0 12px 24px -18px rgba(31,64,140,0.45)`), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 64, height: 64, borderRadius: 18, background: '#FFFFFF', boxShadow: 'inset 0 0 0 1.5px #CBD2DD, 0 8px 16px -10px rgba(16,32,58,0.45)', color: '#3E4C63' }}>
          <span className={lc('sway')} style={{ display: 'grid', placeItems: 'center', ...lv(0, 3.2) }}>
            <Icon name="Award" size={34} />
          </span>
        </span>
        <span style={tagStyle(PROV.ink, 16)}>ISO 27001</span>
      </Show>

      {/* 3 · the open bucket on the customer's side: the customer's liability */}
      <Show on={on(3)} style={{ position: 'absolute', left: 384, top: 184, width: 200, height: 160, borderRadius: 18, background: CUST.fill, boxShadow: litRing(lit(3), `inset 0 0 0 1.5px ${CUST.edge}, 0 12px 24px -18px rgba(31,64,140,0.45)`) }}>
        <div style={{ position: 'absolute', left: 30, top: 30 }}>
          <MarkTile src={s3Bucket} size={62} d={0.4} />
        </div>
        <span style={{ position: 'absolute', left: 108, top: 30, display: 'grid', placeItems: 'center' }}>
          <span className={lc('bob')} style={{ display: 'grid', placeItems: 'center', ...lv(0, 2.2) }}>
            <GlyphTile icon="TriangleAlert" size={40} tone={colors.accent} />
          </span>
        </span>
        <span className={lc('unlock')} style={{ position: 'absolute', left: 115, top: 80, color: colors.brandDark, display: 'grid', placeItems: 'center', ...lv(0, 2.8) }}>
          <Icon name="LockOpen" size={26} />
        </span>
        <span style={{ position: 'absolute', left: 0, right: 0, top: 124, ...tagStyle(CUST.ink, 15) }}>Open Bucket</span>
      </Show>
    </Frame>
  )
}

/* ================================================================== A_T06 · the public bucket: a customer-side gap (520 x 290) */

function A_T06({ step, caption }: { step: number; caption?: string }) {
  const held = useHeld()
  const instant = useInstant()
  const t = useClock(0)
  const W = 520
  const H = 290
  const lit = (i: number) => step === i && !held
  const on = (i: number) => step >= i || held
  const BX = 200 // the bucket's centre
  const BY = 96
  const open = on(1)
  return (
    <Frame w={W} h={H}>
      {/* 1 · a port opened, the bucket made public */}
      <Show on={on(1)} style={{ position: 'absolute', left: 14, top: BY - 34, width: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <GlyphTile icon="EthernetPort" size={46} loop="pulse" t={2.2} lit={lit(1)} />
        <span style={tagStyle(colors.ink, 14)}>Port</span>
      </Show>
      <div style={{ position: 'absolute', left: BX - 48, top: BY - 48 }}>
        <MarkTile src={s3Bucket} size={96} lit={lit(1)} />
      </div>
      {open && !held && <Drift x1={BX} y1={BY - 30} x2={BX} y2={16} t={t} n={3} period={3.2} />}
      {/* the bucket's lock: closed, then opened by the customer's setting */}
      <span style={{ position: 'absolute', left: BX + 56, top: BY + 14, width: 34, height: 34, borderRadius: 10, background: '#FFFFFF', boxShadow: `inset 0 0 0 1.5px ${colors.brand}38, 0 6px 12px -8px rgba(16,32,58,0.5)`, display: 'grid', placeItems: 'center', color: open ? colors.accentDark : colors.brandDark, transition: instant ? 'none' : `color 420ms ${EASE}` }}>
        <span className={open ? lc('unlock') : undefined} style={{ display: 'grid', placeItems: 'center', ...lv(0, 2.8) }}>
          <Icon name={open ? 'LockOpen' : 'Lock'} size={18} />
        </span>
      </span>
      {/* the flag planted beside the bucket */}
      <Show on={on(1)} delay={200} from="translateY(-10px)" style={{ position: 'absolute', left: BX + 104, top: BY - 50, width: 60, height: 104 }}>
        <svg aria-hidden width={60} height={104} style={{ overflow: 'visible' }}>
          <rect x={6} y={2} width={4} height={100} rx={2} fill="#5A6B86" />
          <g className={lc('flag')} style={{ transformOrigin: '10px 10px', ...lv(0, 2.6) }}>
            <path d="M 10 4 L 52 14 L 10 30 Z" fill={colors.accent} />
            <path d="M 10 4 L 52 14 L 10 16 Z" fill="#FFFFFF" fillOpacity={0.25} />
          </g>
          <ellipse cx={8} cy={102} rx={12} ry={3} fill="#1F408C" fillOpacity={0.18} />
        </svg>
      </Show>
      {/* 2 · the provider's SLA covers only the base under the bucket */}
      <div style={{ position: 'absolute', left: 96, top: 166, width: 246, height: 42, borderRadius: 12, background: PROV.fill, boxShadow: litRing(lit(2), `inset 0 0 0 1.5px ${PROV.edge}, 0 10px 18px -14px rgba(31,64,140,0.5)`), transition: instant ? 'none' : `box-shadow 420ms ${EASE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <span style={{ display: 'flex', gap: 8, color: PROV.ink }}>
          {['Server', 'Cpu', 'HardDrive'].map((ic, k) => (
            <span key={ic} className={lc('led')} style={{ display: 'grid', placeItems: 'center', ...lv(k * 0.5, 1.8) }}>
              <Icon name={ic} size={18} />
            </span>
          ))}
        </span>
        <Show on={on(2)} from="scale(0.7)" style={{ display: 'flex', alignItems: 'center', gap: 6, color: PROV.ink }}>
          <span className={lc('pulse')} style={{ display: 'grid', placeItems: 'center', ...lv(0, 2.4) }}>
            <Icon name="ShieldCheck" size={20} />
          </span>
          <span style={tagStyle(PROV.ink, 15)}>SLA</span>
        </Show>
      </div>
      {/* 3 · the split checked per service */}
      <Show on={on(3)} style={{ position: 'absolute', left: 406, top: BY - 34, width: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <span style={{ display: 'grid', placeItems: 'center', width: 52, height: 52, borderRadius: 14, ...TILE_SKIN, boxShadow: litRing(lit(3), TILE_SKIN.boxShadow as string), color: colors.brand }}>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[0, 1, 2].map((k) => (
              <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className={lc('tick')} style={{ display: 'grid', placeItems: 'center', width: 10, height: 10, borderRadius: 3, background: colors.brand, color: '#FFFFFF', ...lv(-k * 0.5, 3) }}>
                  <Icon name="Check" size={8} />
                </span>
                <span style={{ width: 18, height: 3, borderRadius: 2, background: '#B7CBFA' }} />
              </span>
            ))}
          </span>
        </span>
        <span style={tagStyle(colors.ink, 14)}>Checklist</span>
      </Show>
      <Show on={on(1)} delay={320} style={{ position: 'absolute', left: 0, right: 0, top: 236, display: 'flex', justifyContent: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, background: '#FFFFFF', boxShadow: `inset 0 0 0 1.5px ${colors.accent}66, 0 8px 18px -14px rgba(31,64,140,0.5)` }}>
          <span style={{ color: colors.accent, display: 'grid', placeItems: 'center' }}>
            <Icon name="Flag" size={16} />
          </span>
          <span style={tagStyle(colors.ink, 15)}>{caption ?? 'Customer-Side Gap, Not A Provider Failure'}</span>
        </span>
      </Show>
    </Frame>
  )
}

/* ------------------------------------------------------------------ exports */

type Fig = (p: Record<string, unknown>) => ReactNode
export const figures: Record<string, Fig> = {
  A_T01: A_T01 as unknown as Fig,
  A_T03: A_T03 as unknown as Fig,
  A_T04: A_T04 as unknown as Fig,
  A_T05: A_T05 as unknown as Fig,
  A_T05B: A_T05B as unknown as Fig,
  A_T06: A_T06 as unknown as Fig,
}

export const slides = {}

/* the loop vocabulary (transform / opacity only), held still on ?still, thumbnails and reduced motion */
export const css = `
.a12 { animation-delay: var(--a12-d, 0s); }
@keyframes a12-halo { 0%, 100% { opacity: 0.35; transform: scale(0.985) } 50% { opacity: 0.9; transform: scale(1.015) } }
.a12-halo { animation: a12-halo var(--a12-t, 3.6s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes a12-bob { 0%, 100% { transform: translateY(-2.5px) } 50% { transform: translateY(2.5px) } }
.a12-bob { animation: a12-bob var(--a12-t, 2.4s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes a12-pulse { 0%, 100% { transform: scale(0.93) } 50% { transform: scale(1.07) } }
.a12-pulse { animation: a12-pulse var(--a12-t, 2s) cubic-bezier(0.45,0,0.55,1) infinite; transform-origin: center; }
@keyframes a12-beat { 0%, 100% { transform: scale(1) } 12% { transform: scale(1.12) } 24% { transform: scale(0.98) } 36% { transform: scale(1.08) } 50% { transform: scale(1) } }
.a12-beat { animation: a12-beat var(--a12-t, 2.4s) ease-in-out infinite; transform-origin: center; }
@keyframes a12-shackle { 0%, 100% { transform: translateY(0) } 40% { transform: translateY(-2.5px) } 55% { transform: translateY(0.5px) } 70% { transform: translateY(0) } }
.a12-shackle { animation: a12-shackle var(--a12-t, 2.4s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes a12-led { 0%, 55%, 100% { opacity: 1 } 65% { opacity: 0.35 } 78% { opacity: 1 } }
.a12-led { animation: a12-led var(--a12-t, 1.6s) ease-in-out infinite; }
@keyframes a12-spin { 0% { transform: rotate(0deg) } 100% { transform: rotate(360deg) } }
.a12-spin { animation: a12-spin var(--a12-t, 6s) linear infinite; transform-origin: center; }
@keyframes a12-turn { 0%, 100% { transform: rotate(-8deg) } 50% { transform: rotate(8deg) } }
.a12-turn { animation: a12-turn var(--a12-t, 2.8s) cubic-bezier(0.45,0,0.55,1) infinite; transform-origin: center; }
@keyframes a12-sway { 0%, 100% { transform: rotate(-5deg) } 50% { transform: rotate(5deg) } }
.a12-sway { animation: a12-sway var(--a12-t, 3.2s) cubic-bezier(0.45,0,0.55,1) infinite; transform-origin: 50% 20%; }
@keyframes a12-tenant { 0%, 100% { transform: scaleY(0.75) } 50% { transform: scaleY(1.05) } }
.a12-tenant { animation: a12-tenant var(--a12-t, 2.4s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes a12-seq { 0% { opacity: 0; transform: scale(0.97) } 16% { opacity: 0.16; transform: scale(1.015) } 33%, 100% { opacity: 0; transform: scale(0.97) } }
.a12-seq { animation: a12-seq var(--a12-t, 4.2s) cubic-bezier(0.45,0,0.55,1) infinite; opacity: 0; }
@keyframes a12-spike { 0%, 100% { transform: scaleX(0.5) } 30%, 70% { transform: scaleX(1) } }
.a12-spike { animation: a12-spike var(--a12-t, 2.8s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes a12-squeeze { 0%, 100% { transform: scaleX(0.5) } 30%, 70% { transform: scaleX(0.15) } }
.a12-squeeze { animation: a12-squeeze var(--a12-t, 2.8s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes a12-dash { 0% { stroke-dashoffset: 22 } 100% { stroke-dashoffset: 0 } }
.a12-dash { animation: a12-dash var(--a12-t, 1.2s) linear infinite; }
@keyframes a12-unlock { 0%, 100% { transform: translateY(0) rotate(0deg) } 50% { transform: translateY(-2px) rotate(-6deg) } }
.a12-unlock { animation: a12-unlock var(--a12-t, 2.8s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes a12-flag { 0%, 100% { transform: skewY(0deg) scaleX(1) } 50% { transform: skewY(-5deg) scaleX(0.94) } }
.a12-flag { animation: a12-flag var(--a12-t, 2.6s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes a12-tick { 0%, 100% { transform: scale(1); opacity: 1 } 45% { transform: scale(1); opacity: 1 } 55% { transform: scale(0.4); opacity: 0.25 } 70% { transform: scale(1.15); opacity: 1 } 80% { transform: scale(1) } }
.a12-tick { animation: a12-tick var(--a12-t, 3s) cubic-bezier(0.45,0,0.55,1) infinite; }
.cc-still .a12, .deck-thumb .a12 { animation: none !important; }
.cc-still .a12-halo, .deck-thumb .a12-halo { opacity: 0.5 !important; transform: none !important; }
.cc-still .a12-seq, .deck-thumb .a12-seq { opacity: 0 !important; }
@media (prefers-reduced-motion: reduce) { .a12 { animation: none !important; } }
`
