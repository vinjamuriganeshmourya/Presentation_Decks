import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { TILE_SKIN } from '@/decks/figures/card'
import { MOTION, motionHeld } from '@/motion/tokens'
import { litRing } from '@/decks/figures/net/frames'
import { Icon } from '@/engine/icon'
import awsWord from '../images/a-aws.png'
import azureWord from '../images/azure-wordmark.png'
import gcpWord from '../images/google-cloud-wordmark.svg'
import ibmWord from '../images/a-ibm-cloud.png'
import oracleWord from '../images/oracle.svg'
import boyLaptop from '../images/a-boy-laptop.png'
import boyPhone from '../images/a-boy-phone.png'
import womanLaptop from '../images/a-woman-laptop.png'
import awsMark from '../images/a-aws.png'
import azureMark from '../images/azure.svg'
import gcpMark from '../images/google-cloud.svg'

/*
 * BUILDER A · Cloud Provider Comparison (Session 11), section 1: slides 6 (A_T01), 8 (A_T02B), 9 (A_T03), 11 (A_T05).
 *
 * Built to the Sessions 9 / 10 review state (generate-slides standing corrections 13-16, cloud course R10-R13):
 * official marks on still white tiles, icon-first visuals with one-word Title Case tags, no chips / badges / connector
 * labels, a quiet loop on every visual after its build, straight arrows from the parts' own constants, equal padding,
 * nothing overlapping. Each figure takes the slide's `step` (0 = nothing pressed; on a points slide step i is point
 * i's part, lit while it is the current press). Loops are CSS (`a11-*` classes, transform / opacity only) or a small
 * wall-clock rAF clock, both held still on `?still`, thumbnails and reduced motion (full picture, nothing lit).
 */

const EASE = MOTION.ease
const useHeld = () => motionHeld(useInstant())

const lc = (kind: string) => `a11 a11-${kind}`
const lv = (d = 0, t?: number, extra: Record<string, string | number> = {}): CSSProperties =>
  ({ ['--a11-d' as string]: `${-d}s`, ...(t ? { ['--a11-t' as string]: `${t}s` } : {}), ...extra }) as CSSProperties

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

const font = "'DM Sans', system-ui, sans-serif"
const tagStyle = (color: string = colors.ink, size = 14): CSSProperties => ({ fontFamily: font, fontWeight: 600, fontSize: size, lineHeight: 1.15, color, whiteSpace: 'nowrap' })

/**
 * A provider's official logo on a still white tile (rule 54). The mark never moves; a soft halo behind the tile breathes
 * on its own phase so the tile is not frozen. `lit` puts the deck's lit ring round the tile.
 */
function LogoTile({ x, y, w, h, src, logoW, logoH, lit = false, on = true, delay = 0, d = 0, radius = 18, pad = 14 }: { x: number; y: number; w: number; h: number; src: string; logoW?: number; logoH?: number; lit?: boolean; on?: boolean; delay?: number; d?: number; radius?: number; pad?: number }) {
  const instant = useInstant()
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
      <span aria-hidden className={lc('halo')} style={{ position: 'absolute', inset: -6, borderRadius: radius + 6, background: `radial-gradient(closest-side, ${colors.brand}26, ${colors.brand}00)`, ...lv(d, 3.6) }} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: radius, ...TILE_SKIN, boxShadow: litRing(lit, TILE_SKIN.boxShadow as string), transition: instant ? 'none' : `box-shadow 420ms ${EASE}`, display: 'grid', placeItems: 'center' }}>
        <img src={src} alt="" aria-hidden draggable={false} style={{ display: 'block', width: logoW ?? 'auto', height: logoH ?? 'auto', maxWidth: w - 2 * pad, maxHeight: h - 2 * pad, objectFit: 'contain' }} />
      </div>
    </Show>
  )
}

/** a lucide glyph on a soft tile, with a CSS loop on the glyph only, and an optional one-word tag under it */
function GlyphTile({ icon, size = 44, tone = colors.brand, loop, d = 0, t, lit = false }: { icon: string; size?: number; tone?: string; loop?: string; d?: number; t?: number; lit?: boolean }) {
  const instant = useInstant()
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: Math.round(size * 0.27), ...TILE_SKIN, boxShadow: litRing(lit, TILE_SKIN.boxShadow as string), transition: instant ? 'none' : `box-shadow 420ms ${EASE}`, color: tone, flexShrink: 0 }}>
      <span className={loop ? lc(loop) : undefined} style={{ display: 'grid', placeItems: 'center', ...lv(d, t) }}>
        <Icon name={icon} size={Math.round(size * 0.5)} />
      </span>
    </span>
  )
}

/** a glyph tile with its tag centred under it, the pair centred on (x, y) of the tile */
function Tagged({ x, y, icon, tag, size = 44, tone, loop, d, t, lit, on = true, delay = 0 }: { x: number; y: number; icon: string; tag: string; size?: number; tone?: string; loop?: string; d?: number; t?: number; lit?: boolean; on?: boolean; delay?: number }) {
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - 50, top: y - size / 2, width: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <GlyphTile icon={icon} size={size} tone={tone} loop={loop} d={d} t={t} lit={lit} />
      <span style={tagStyle(colors.ink, 13)}>{tag}</span>
    </Show>
  )
}

/** a straight arrow from (x1, y) to (x2, y): shaft and a filled head whose tip lands exactly on x2 */
function HArrow({ x1, x2, y, color = colors.brand, w = 3, head = 12, on = true, delay = 0 }: { x1: number; x2: number; y: number; color?: string; w?: number; head?: number; on?: boolean; delay?: number }) {
  const dir = x2 > x1 ? 1 : -1
  const hb = x2 - dir * head
  return (
    <Show on={on} delay={delay} from="none" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <svg aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'visible' }} width="100%" height="100%">
        <line x1={x1} y1={y} x2={hb} y2={y} stroke={color} strokeWidth={w} strokeLinecap="round" />
        <path d={`M ${x2} ${y} L ${hb} ${y - head * 0.55} L ${hb} ${y + head * 0.55} Z`} fill={color} />
      </svg>
    </Show>
  )
}

/** a flow dot on the wall clock, riding (x1, y) → (x2, y) once per `period`, fading in and out at the ends */
function FlowDot({ x1, x2, y, t, period = 2.4, phase = 0, ride = 0.7, tone = colors.brand, size = 11 }: { x1: number; x2: number; y: number; t: number; period?: number; phase?: number; ride?: number; tone?: string; size?: number }) {
  const held = useHeld()
  if (held) return null
  const u = ((((t - phase) % period) + period) % period) / period
  if (u > ride) return null
  const k = u / ride
  const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
  const x = x1 + (x2 - x1) * e
  const op = k < 0.12 ? k / 0.12 : k > 0.88 ? (1 - k) / 0.12 : 1
  return <span aria-hidden style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: 99, background: tone, opacity: op, boxShadow: `0 0 0 4px ${tone}2e, 0 6px 12px -6px ${tone}`, zIndex: 8 }} />
}

/* ================================================================== A_T01 · five providers sized by market position (616 x 340) */

/** the five tiles' boxes, shared by A_T01 (k = 1) and A_T05 (a smaller copy), so the two slides show the same picture */
const FIVE = {
  /* wordmarks sized by visual weight, not by box (coordinator, 2026-11-11): the Google Cloud svg is wide and short,
     so it takes the full tile width on a smaller pad, and Azure is held a little lower, so the three letterforms read
     at a comparable height */
  aws: { x: 0, y: 0, w: 200, h: 210, logoW: 140 },
  azure: { x: 216, y: 6, w: 206, h: 94, logoH: 36 },
  gcp: { x: 216, y: 116, w: 206, h: 94, logoW: 186 },
  ibm: { x: 438, y: 13, w: 146, h: 84, logoH: 64 },
  oci: { x: 438, y: 113, w: 146, h: 84, logoH: 17 },
} as const
const FIVE_W = 584
const FIVE_H = 210
const SRC = { aws: awsWord, azure: azureWord, gcp: gcpWord, ibm: ibmWord, oci: oracleWord }
type Key = keyof typeof FIVE

function Five({ ox, oy, k, lit, show, delay }: { ox: number; oy: number; k: number; lit: (key: Key) => boolean; show: (key: Key) => boolean; delay?: (key: Key) => number }) {
  return (
    <>
      {(Object.keys(FIVE) as Key[]).map((key, i) => {
        const b = FIVE[key]
        return (
          <LogoTile
            key={key}
            x={ox + b.x * k}
            y={oy + b.y * k}
            w={b.w * k}
            h={b.h * k}
            src={SRC[key]}
            logoW={'logoW' in b ? b.logoW * k : undefined}
            logoH={'logoH' in b ? b.logoH * k : undefined}
            lit={lit(key)}
            on={show(key)}
            delay={delay ? delay(key) : 0}
            d={i * 0.7}
            radius={Math.round(18 * k)}
            pad={key === 'ibm' || key === 'gcp' ? 10 * k : 14 * k}
          />
        )
      })}
    </>
  )
}

/** a tapering wedge, wide on the left (the largest provider) and thin on the right (the niche ones), with a sheen loop */
function Wedge({ x, y, w, h, lit = false, on = true }: { x: number; y: number; w: number; h: number; lit?: boolean; on?: boolean }) {
  const instant = useInstant()
  const id = `a11-wedge-${w}-${h}`
  const tip = Math.max(4, h * 0.16)
  const path = `M ${h / 2} 0 L ${w - tip / 2} ${(h - tip) / 2} Q ${w} ${h / 2} ${w - tip / 2} ${(h + tip) / 2} L ${h / 2} ${h} A ${h / 2} ${h / 2} 0 0 1 ${h / 2} 0 Z`
  return (
    <Show on={on} from="scaleX(0.6)" style={{ position: 'absolute', left: x, top: y, width: w, height: h, transformOrigin: '0 50%' }}>
      <svg aria-hidden width={w} height={h} style={{ position: 'absolute', inset: 0, overflow: 'visible', filter: lit ? `drop-shadow(0 0 0 ${colors.accent})` : undefined }}>
        <defs>
          <linearGradient id={`${id}-g`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor={colors.brandDark} />
            <stop offset="1" stopColor="#8FB0FF" />
          </linearGradient>
          <clipPath id={`${id}-c`}>
            <path d={path} />
          </clipPath>
        </defs>
        <path d={path} fill={`url(#${id}-g)`} stroke={lit ? colors.accent : 'none'} strokeWidth={lit ? 3 : 0} style={{ transition: instant ? 'none' : `stroke 420ms ${EASE}` }} />
        <g clipPath={`url(#${id}-c)`}>
          <rect className={lc('wsheen')} x={-80} y={-4} width={70} height={h + 8} fill="rgba(255,255,255,0.45)" style={{ ...lv(0, 3.2, { '--a11-x': `${w + 100}px` }) }} />
        </g>
      </svg>
    </Show>
  )
}

function A_T01({ step }: { step: number }) {
  const held = useHeld()
  const lit = (i: number) => step === i && !held
  const W = 616
  const H = 340
  const k = 0.95
  const WH = 28
  const WG = 30
  const ox = (W - FIVE_W * k) / 2
  const oy = (H - (FIVE_H * k + WG + WH)) / 2
  const isHyper = (k: Key) => k === 'aws' || k === 'azure' || k === 'gcp'
  return (
    <Frame w={W} h={H}>
      <Five
        ox={ox}
        oy={oy}
        k={k}
        show={(k) => (isHyper(k) ? step >= 1 : k === 'ibm' ? step >= 2 : step >= 3)}
        lit={(k) => (isHyper(k) ? lit(1) : k === 'ibm' ? lit(2) : k === 'oci' ? lit(3) : false)}
        delay={(k) => (k === 'azure' ? 130 : k === 'gcp' ? 260 : 0)}
      />
      {/* the size ruler: one wedge running from the largest to the niche providers, under the row */}
      <Wedge x={ox} y={oy + FIVE_H * k + WG} w={FIVE_W * k} h={WH} on={step >= 4} lit={lit(4)} />
    </Frame>
  )
}

/* ================================================================== A_T01D · what a cloud provider is (1000 x 360) */

/*
 * Rebuilt 2026-11-11 on the user's review of slide 6: the stage is filled edge to edge, the cloud is one smooth
 * silhouette with a crisp rim, each resource is a drawn object with its own micro-animation, three consumers receive
 * resources over the internet, the globe glows (no rotation, this slide only), and the meter is a gauge plus coins
 * dropping into a bill that move only while resources flow.
 */

/** the flow clock shared by the packets, the gauge and the coins: resources ride for FLOW s, nothing for the rest */
const T01D_PERIOD = 3.3
const T01D_FLOW = 2.8
/** one resource packet rides the trunk every PK s (one at a time, never two touching), then a dot rides a branch */
const PK = 0.55

/** a rack of three 1U servers whose LEDs blink on their own phases */
function RackArt() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 96 }}>
      {[0, 1, 2].map((r) => (
        <div key={r} style={{ position: 'relative', height: 18, borderRadius: 6, background: `linear-gradient(180deg, ${colors.brand} 0%, ${colors.brandDark} 100%)`, boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.35), 0 4px 8px -5px rgba(16,32,58,0.55)' }}>
          <span style={{ position: 'absolute', left: 8, top: 7.5, width: 34, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.45)' }} />
          <span style={{ position: 'absolute', right: 8, top: 5.5, display: 'flex', gap: 4 }}>
            {[0, 1, 2].map((l) => (
              <span key={l} className={lc('led')} style={{ display: 'block', width: 7, height: 7, borderRadius: 99, background: l === 2 ? '#FFC24A' : '#5BE38F', boxShadow: `0 0 6px ${l === 2 ? '#FFC24A' : '#5BE38F'}`, ...lv(r * 0.37 + l * 0.61, 1.6 + l * 0.35) }} />
            ))}
          </span>
        </div>
      ))}
    </div>
  )
}

/** three storage drives standing in a bay, each with an activity light and a read bar */
function DrivesArt() {
  return (
    <div style={{ display: 'flex', gap: 6, padding: 6, borderRadius: 10, background: '#DCE6FA', boxShadow: 'inset 0 0 0 1.5px #C3D3F2' }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ position: 'relative', width: 24, height: 52, borderRadius: 5, background: 'linear-gradient(180deg, #FFFFFF 0%, #E7EEFB 100%)', boxShadow: 'inset 0 0 0 1.5px #BFD0F0', overflow: 'hidden' }}>
          <span style={{ position: 'absolute', left: 5, right: 5, top: 7, height: 3, borderRadius: 2, background: '#C9D7F2' }} />
          <span style={{ position: 'absolute', left: 5, right: 5, top: 13, height: 3, borderRadius: 2, background: '#C9D7F2' }} />
          <span className={lc('read')} style={{ position: 'absolute', left: 5, top: 21, width: 14, height: 20, borderRadius: 3, background: `${colors.brand}`, transformOrigin: '50% 100%', ...lv(i * 0.55, 1.8) }} />
          <span className={lc('led')} style={{ position: 'absolute', left: 9, bottom: 5, width: 6, height: 6, borderRadius: 99, background: '#5BE38F', boxShadow: '0 0 5px #5BE38F', ...lv(i * 0.45, 1.1) }} />
        </div>
      ))}
    </div>
  )
}

/** a database: a stack of three discs with a glowing band moving down through it */
function DbArt() {
  const w = 66
  const disc = (y: number, top = false) => (
    <g key={y}>
      <path d={`M 0 ${y} L 0 ${y + 18} A ${w / 2} 8 0 0 0 ${w} ${y + 18} L ${w} ${y} Z`} fill="url(#a11-db)" />
      {top && <ellipse cx={w / 2} cy={y} rx={w / 2} ry={8} fill="#7FA2FF" />}
      {top && <ellipse cx={w / 2} cy={y} rx={w / 2 - 6} ry={5} fill="#A9C1FF" />}
    </g>
  )
  return (
    <svg aria-hidden width={w * 0.86} height={84 * 0.86} viewBox={`0 -9 ${w} 84`} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="a11-db" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={colors.brandDark} />
          <stop offset="0.55" stopColor={colors.brand} />
          <stop offset="1" stopColor={colors.brandDark} />
        </linearGradient>
      </defs>
      {disc(44)}
      {disc(22)}
      {disc(0, true)}
      <path d={`M 0 22 A ${w / 2} 8 0 0 0 ${w} 22 M 0 44 A ${w / 2} 8 0 0 0 ${w} 44`} stroke="rgba(255,255,255,0.55)" strokeWidth={2} fill="none" />
      <g className={lc('scan')} style={{ ...lv(0, 2.6) }}>
        <path d={`M 2 8 A ${w / 2 - 2} 7 0 0 0 ${w - 2} 8`} stroke="#FFFFFF" strokeOpacity={0.85} strokeWidth={3} fill="none" strokeLinecap="round" />
      </g>
    </svg>
  )
}

/** a network switch whose port lights chase along the front, three cables rising from it */
function SwitchArt() {
  return (
    <div style={{ position: 'relative', width: 100, height: 64 }}>
      <svg aria-hidden width={100} height={30} style={{ position: 'absolute', left: 0, top: 0 }}>
        {[22, 50, 78].map((x) => (
          <path key={x} d={`M ${x} 30 L ${x} 8`} stroke={colors.brand} strokeWidth={3} strokeLinecap="round" />
        ))}
        {[22, 50, 78].map((x, i) => (
          <circle key={x} className={lc('blinkled')} cx={x} cy={6} r={5} fill="#FFFFFF" stroke={colors.brand} strokeWidth={2.5} style={{ ...lv(i * 0.5, 1.8) }} />
        ))}
      </svg>
      <div style={{ position: 'absolute', left: 0, top: 28, width: 100, height: 34, borderRadius: 8, background: `linear-gradient(180deg, ${colors.brand} 0%, ${colors.brandDark} 100%)`, boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.35), 0 6px 10px -6px rgba(16,32,58,0.55)', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', alignItems: 'center', padding: '0 8px', gap: 4 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span key={i} style={{ display: 'grid', placeItems: 'center', height: 14, borderRadius: 3, background: 'rgba(255,255,255,0.22)' }}>
            <span className={lc('chase')} style={{ display: 'block', width: 6, height: 6, borderRadius: 99, background: '#5BE38F', boxShadow: '0 0 5px #5BE38F', ...lv(-i * 0.2, 1.2) }} />
          </span>
        ))}
      </div>
    </div>
  )
}

/** the usage gauge: its needle sweeps up while resources flow and settles back while nothing flows */
function Gauge({ k }: { k: number }) {
  const ang = -66 + 132 * k
  return (
    <svg aria-hidden width={56} height={40} viewBox="0 0 56 40" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="a11-gauge" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#5BE38F" />
          <stop offset="0.6" stopColor="#FFC24A" />
          <stop offset="1" stopColor={colors.accent} />
        </linearGradient>
      </defs>
      <path d="M 6 36 A 22 22 0 0 1 50 36" stroke="#DCE6FA" strokeWidth={7} fill="none" strokeLinecap="round" />
      <path d="M 6 36 A 22 22 0 0 1 50 36" stroke="url(#a11-gauge)" strokeWidth={7} fill="none" strokeLinecap="round" strokeDasharray={`${69.1 * k} 200`} />
      <g transform={`rotate(${ang} 28 36)`}>
        <path d="M 28 36 L 28 17" stroke={colors.ink} strokeWidth={3} strokeLinecap="round" />
      </g>
      <circle cx={28} cy={36} r={4} fill={colors.ink} />
    </svg>
  )
}

function A_T01D({ step }: { step: number }) {
  const held = useHeld()
  const t = useClock(0)
  const W = 1000
  const H = 360
  const P = 24
  /* ---- the provider's cloud: one smooth silhouette, left third */
  const C0 = { x: P, y: P, w: 404, h: H - 2 * P }
  const cx0 = C0.x
  const cy0 = C0.y
  const cb = cy0 + C0.h
  const cr = cx0 + C0.w
  const cloud = [
    `M ${cx0 + 56} ${cb}`,
    `L ${cr - 56} ${cb}`,
    `Q ${cr} ${cb} ${cr} ${cb - 56}`,
    `L ${cr} ${cy0 + 152}`,
    `C ${cr} ${cy0 + 104} ${cr - 34} ${cy0 + 78} ${cr - 82} ${cy0 + 84}`,
    `C ${cr - 96} ${cy0 + 26} ${cr - 156} ${cy0} ${cr - 214} ${cy0 + 4}`,
    `C ${cr - 262} ${cy0 + 8} ${cr - 300} ${cy0 + 38} ${cr - 312} ${cy0 + 74}`,
    `C ${cx0 + 36} ${cy0 + 70} ${cx0} ${cy0 + 104} ${cx0} ${cy0 + 152}`,
    `L ${cx0} ${cb - 56}`,
    `Q ${cx0} ${cb} ${cx0 + 56} ${cb}`,
    'Z',
  ].join(' ')
  const RX = [cx0 + 144, cr - 124]
  const RY = [cy0 + 136, cy0 + 246]
  const res: { tag: string; art: ReactNode }[] = [
    { tag: 'Servers', art: <RackArt /> },
    { tag: 'Storage', art: <DrivesArt /> },
    { tag: 'Databases', art: <DbArt /> },
    { tag: 'Networking', art: <SwitchArt /> },
  ]
  /* ---- the internet: one straight link from the cloud to the globe, then one straight branch to each consumer */
  const G = { x: 590, y: 190, r: 40 }
  const linkY = G.y
  const people = [
    { src: boyLaptop, h: 100, ar: 250 / 342, cy: P + 50 },
    { src: womanLaptop, h: 88, ar: 362 / 270, cy: H / 2 },
    { src: boyPhone, h: 100, ar: 279 / 300, cy: H - P - 50 },
  ]
  const PCX = 884
  const ends = people.map((p) => {
    const w = p.h * p.ar
    return { x: PCX - w / 2 - 14, y: p.cy, w }
  })
  const branch = (i: number) => {
    const e = ends[i]
    const dx = e.x - G.x
    const dy = e.y - G.y
    const L = Math.hypot(dx, dy)
    return { x1: G.x + (dx / L) * (G.r + 8), y1: G.y + (dy / L) * (G.r + 8), x2: e.x, y2: e.y, ux: dx / L, uy: dy / L }
  }
  /* ---- the flow clock */
  const u = held ? 0 : ((t % T01D_PERIOD) + T01D_PERIOD) % T01D_PERIOD
  const flowing = !held && u < T01D_FLOW
  const gk = held ? 0.5 : flowing ? 0.08 + 0.84 * (u / T01D_FLOW) : 0.92 - 0.84 * ((u - T01D_FLOW) / (T01D_PERIOD - T01D_FLOW))
  /* packets: four resource packets ride the trunk (cloud → globe), then a dot rides each branch */
  const trunk = { x1: cr + 10, x2: G.x - G.r - 10 }
  const packetIcons = ['Server', 'HardDrive', 'Database', 'Network']
  /* ---- the meter, top middle: gauge, coins dropping into a bill, the tag under both */
  const M = { cx: 588, y: 34 }
  return (
    <Frame w={W} h={H}>
      {/* step 1: the provider's cloud and its resources */}
      <Show on={step >= 1} style={{ position: 'absolute', inset: 0 }}>
        <svg aria-hidden width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <defs>
            <linearGradient id="a11-cl" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={cy0} y2={cb}>
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#E2EBFD" />
            </linearGradient>
            <filter id="a11-cl-sh" x="-10%" y="-10%" width="120%" height="125%">
              <feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="#1F408C" floodOpacity="0.2" />
            </filter>
          </defs>
          <path d={cloud} fill="url(#a11-cl)" stroke="#BFD0F2" strokeWidth={2} filter="url(#a11-cl-sh)" />
          <path d={`M ${cr - 268} ${cy0 + 40} C ${cr - 240} ${cy0 + 18} ${cr - 196} ${cy0 + 14} ${cr - 166} ${cy0 + 26}`} stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" fill="none" />
        </svg>
        {res.map((r, i) => (
          <Show key={r.tag} on={step >= 1} delay={130 * (i + 1)} style={{ position: 'absolute', left: RX[i % 2] - 75, top: RY[Math.floor(i / 2)] - 52, width: 150, height: 104, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
            <div style={{ flex: 1, display: 'grid', placeItems: 'center', zoom: 1.06 }}>{r.art}</div>
            <span style={tagStyle(colors.ink, 16)}>{r.tag}</span>
          </Show>
        ))}
      </Show>

      {/* step 2: the internet link, the glowing globe, the consumers */}
      <HArrow x1={cr + 10} x2={G.x - G.r - 8} y={linkY} on={step >= 2} />
      {people.map((_, i) => {
        const b = branch(i)
        const hb = 12
        const bx = b.x2 - b.ux * hb
        const by = b.y2 - b.uy * hb
        const nx = -b.uy * hb * 0.55
        const ny = b.ux * hb * 0.55
        return (
          <Show key={i} on={step >= 2} delay={260 + i * 130} from="none" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <svg aria-hidden width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
              <line x1={b.x1} y1={b.y1} x2={bx} y2={by} stroke={colors.brand} strokeWidth={3} strokeLinecap="round" />
              <path d={`M ${b.x2} ${b.y2} L ${bx + nx} ${by + ny} L ${bx - nx} ${by - ny} Z`} fill={colors.brand} />
            </svg>
          </Show>
        )
      })}
      <Show on={step >= 2} delay={130} style={{ position: 'absolute', left: G.x - 60, top: G.y - G.r, width: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: G.r * 2, height: G.r * 2 }}>
          <span aria-hidden className={lc('glow')} style={{ position: 'absolute', inset: -10, borderRadius: 99, background: `radial-gradient(closest-side, ${colors.brand}55, ${colors.brand}00)`, ...lv(0, 2.4) }} />
          <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: G.r * 2, height: G.r * 2, borderRadius: 99, ...TILE_SKIN, color: colors.brand }}>
            <span className={lc('soft')} style={{ display: 'grid', ...lv(0, 2.4) }}>
              <Icon name="Globe" size={42} />
            </span>
          </span>
        </span>
        <span style={tagStyle(colors.ink, 16)}>Internet</span>
      </Show>
      {people.map((p, i) => (
        <Show key={i} on={step >= 2} delay={390 + i * 130} style={{ position: 'absolute', left: PCX - (p.h * p.ar) / 2, top: p.cy - p.h / 2, width: p.h * p.ar, height: p.h }}>
          <img src={p.src} alt="" aria-hidden draggable={false} className={lc('breathe')} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain', transformOrigin: '50% 100%', ...lv(i * 1.1, 4) }} />
        </Show>
      ))}
      {/* packets: resources ride the trunk while they flow, then out along each branch */}
      {step >= 2 &&
        flowing &&
        packetIcons.map((ic, i) => {
          const k = (u - i * PK) / PK
          if (k < 0 || k > 1) return null
          const x = trunk.x1 + 14 + (trunk.x2 - trunk.x1 - 28) * k
          const op = k < 0.12 ? k / 0.12 : k > 0.88 ? (1 - k) / 0.12 : 1
          return (
            <span key={ic} aria-hidden style={{ position: 'absolute', left: x - 13, top: linkY - 13, width: 26, height: 26, borderRadius: 99, background: colors.brand, color: colors.white, display: 'grid', placeItems: 'center', opacity: op, boxShadow: `0 0 0 4px ${colors.brand}2e, 0 6px 12px -6px ${colors.brand}`, zIndex: 8 }}>
              <Icon name={ic} size={14} />
            </span>
          )
        })}
      {step >= 2 &&
        !held &&
        packetIcons.map((_, j) => {
          /* each packet, once at the globe, rides on to one consumer in turn */
          const k = (u - (j + 1) * PK) / 0.6
          if (k < 0 || k > 1) return null
          const i = j % people.length
          const b = branch(i)
          const x = b.x1 + (b.x2 - 16 * b.ux - b.x1) * k
          const y = b.y1 + (b.y2 - 16 * b.uy - b.y1) * k
          const op = k < 0.15 ? k / 0.15 : k > 0.85 ? (1 - k) / 0.15 : 1
          return <span key={j} aria-hidden style={{ position: 'absolute', left: x - 6, top: y - 6, width: 12, height: 12, borderRadius: 99, background: colors.brand, opacity: op, boxShadow: `0 0 0 4px ${colors.brand}2e`, zIndex: 8 }} />
        })}

      {/* step 3: the usage meter: the gauge climbs and coins drop into the bill only while resources flow */}
      <Show on={step >= 3} style={{ position: 'absolute', left: M.cx - 120, top: M.y, width: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <span style={{ display: 'flex', alignItems: 'flex-end', gap: 18 }}>
          <span style={{ display: 'grid', placeItems: 'center', width: 86, height: 72, borderRadius: 18, ...TILE_SKIN }}>
            <span style={{ display: 'grid', zoom: 1.25 }}>
              <Gauge k={gk} />
            </span>
          </span>
          <span style={{ position: 'relative', width: 72, height: 72 }}>
            {[0, 1].map((c) => {
              const k = flowing ? ((u + c * (T01D_FLOW / 2)) % (T01D_FLOW / 2)) / (T01D_FLOW / 2) : 1
              if (!flowing || held) return null
              const y = -18 + 26 * k
              return (
                <span key={c} aria-hidden style={{ position: 'absolute', left: 25, top: y, width: 22, height: 22, borderRadius: 99, background: 'linear-gradient(180deg, #FFD36B 0%, #F2A93B 100%)', boxShadow: 'inset 0 0 0 2px #E59A22', opacity: k < 0.15 ? k / 0.15 : k > 0.8 ? (1 - k) / 0.2 : 1, display: 'grid', placeItems: 'center', color: '#9A5B00', fontFamily: font, fontWeight: 800, fontSize: 11, zIndex: 1 }} />
              )
            })}
            <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', borderRadius: 16, ...TILE_SKIN, color: colors.brand, zIndex: 2 }}>
              <span style={{ display: 'grid', transform: flowing ? `translateY(${-1.5 * Math.sin((u / T01D_FLOW) * Math.PI * 4) ** 2}px)` : 'none' }}>
                <Icon name="ReceiptText" size={34} />
              </span>
            </span>
          </span>
        </span>
        <span style={tagStyle(colors.ink, 16)}>Pay-As-You-Go</span>
      </Show>
    </Frame>
  )
}

/* ================================================================== A_T02B · market-share order as bars (1000 x 400) */

const BARS = [
  { src: awsWord, logoW: 84, len: 620, tag: 'Largest', tone: colors.brandDark, pad: 14 },
  { src: azureWord, logoH: 30, len: 480, tag: 'Second-Largest', tone: colors.brand, pad: 14 },
  { src: gcpWord, logoW: 156, len: 350, tag: 'Third-Largest', tone: '#5C86F2', pad: 10 },
]

function A_T02B({ step }: { step: number }) {
  const instant = useInstant()
  const held = useHeld()
  const t = useClock(0)
  const W = 1000
  const H = 400
  const TILE_W = 176
  const TILE_H = 86
  const GAP = 28
  const ROW = 120
  const top = (H - (BARS.length - 1) * ROW) / 2
  /* content runs from the tile to the longest bar's tag (~90 px): centred in the stage, equal margins */
  const ox = (W - (TILE_W + GAP + BARS[0].len + 18 + 90)) / 2
  const barX = ox + TILE_W + GAP
  const BH = 50
  /* after the build a sheen crosses each bar in turn: 1.4 s per bar, then the first again (no rest) */
  const period = 1.4 * BARS.length
  return (
    <Frame w={W} h={H}>
      {BARS.map((b, i) => {
        const cy = top + i * ROW
        const on = step >= i + 1
        const u = ((t % period) + period) % period
        const sweeping = !held && step >= BARS.length && Math.floor(u / 1.4) === i
        const k = (u % 1.4) / 1.4
        return (
          <div key={i}>
            <LogoTile x={ox} y={cy - TILE_H / 2} w={TILE_W} h={TILE_H} src={b.src} logoW={b.logoW} logoH={b.logoH} pad={b.pad} on={on} d={i * 0.8} />
            <div
              style={{
                position: 'absolute',
                left: barX,
                top: cy - BH / 2,
                width: b.len,
                height: BH,
                borderRadius: 14,
                overflow: 'hidden',
                background: `linear-gradient(90deg, ${b.tone} 0%, ${b.tone}D9 100%)`,
                boxShadow: `inset 0 2px 0 rgba(255,255,255,0.28), 0 12px 22px -14px ${b.tone}`,
                transformOrigin: '0 50%',
                transform: on ? 'scaleX(1)' : 'scaleX(0)',
                transition: instant ? 'none' : `transform 860ms ${EASE} ${on ? 160 : 0}ms`,
              }}
            >
              {sweeping && <span aria-hidden style={{ position: 'absolute', top: 0, bottom: 0, left: -120 + (b.len + 160) * k, width: 110, background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.42) 50%, rgba(255,255,255,0) 100%)' }} />}
            </div>
            <Show on={on} delay={760} style={{ position: 'absolute', left: barX + b.len + 18, top: cy - 14, height: 28, display: 'flex', alignItems: 'center' }}>
              <span style={tagStyle(colors.ink, 20)}>{b.tag}</span>
            </Show>
          </div>
        )
      })}
    </Frame>
  )
}

/* ================================================================== A_T03 · generalists and specialists (616 x 300) */

function A_T03({ step }: { step: number }) {
  const held = useHeld()
  const lit = (i: number) => step === i && !held
  const t = useClock(0)
  const W = 616
  const H = 300
  const P = 26
  /* columns inside a 26 px margin: left generalists, the tapering arrow, right specialists */
  const L = { x: P, w: 216 }
  const R = { x: W - P - 250, w: 250 }
  const TY = 24
  const TS = 56
  const leftMarks = [awsMark, azureMark, gcpMark]
  const lmx = (i: number) => L.x + L.w / 2 + (i - 1) * 74
  const iconY = 162
  const work = [
    { icon: 'Globe', tag: 'Web' },
    { icon: 'Smartphone', tag: 'Mobile' },
    { icon: 'ChartColumn', tag: 'Data' },
    { icon: 'Gamepad2', tag: 'Games' },
  ]
  const wx = (i: number) => L.x + 28 + i * ((L.w - 56) / 3)
  /* right: IBM Cloud and OCI tiles, each with a narrow beam to its own two workloads */
  const RT_W = 104
  const RT_H = 62
  const rcx = [R.x + 66, R.x + 187]
  const spec = [
    [
      { icon: 'Server', tag: 'Mainframe', loop: 'blinkled' },
      { icon: 'Landmark', tag: 'Bank', loop: 'bob' },
    ],
    [
      { icon: 'Database', tag: 'Database', loop: 'bob' },
      { icon: 'Cpu', tag: 'GPU', loop: 'pulse' },
    ],
  ]
  const sx = (c: number, j: number) => R.x + [[34, 98], [156, 218]][c][j]
  const beamTop = TY + RT_H + 10
  const beamBot = iconY - 30
  const ah = { x1: L.x + L.w + 14, x2: R.x - 14, y: 112 }
  return (
    <Frame w={W} h={H}>
      <svg aria-hidden width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          <linearGradient id="a11-beam" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={colors.brand} stopOpacity={0.2} />
            <stop offset="1" stopColor={colors.brand} stopOpacity={0.04} />
          </linearGradient>
          <linearGradient id="a11-taper" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#9DB8FF" />
            <stop offset="1" stopColor={colors.brand} />
          </linearGradient>
        </defs>
        {/* the wide fan: from the three hyperscalers out to many kinds of workload */}
        <path d={`M ${lmx(0) - 22} ${TY + TS + 10} L ${wx(0) - 24} ${beamBot} L ${wx(3) + 24} ${beamBot} L ${lmx(2) + 22} ${TY + TS + 10} Z`} fill="url(#a11-beam)" />
        {/* the narrow beams: each specialist to its own two workloads */}
        {[0, 1].map((c) => (
          <path key={c} d={`M ${rcx[c] - 9} ${beamTop} L ${sx(c, 0) - 20} ${beamBot} L ${sx(c, 1) + 20} ${beamBot} L ${rcx[c] + 9} ${beamTop} Z`} fill="url(#a11-beam)" style={{ opacity: step >= c + 1 ? 1 : 0, transition: 'opacity 520ms' }} />
        ))}
        {/* the tapering arrow: broad on the generalist side, narrow where it lands on the specialists */}
        <path d={`M ${ah.x1} ${ah.y - 24} L ${ah.x2 - 16} ${ah.y - 4} L ${ah.x2 - 16} ${ah.y - 11} L ${ah.x2} ${ah.y} L ${ah.x2 - 16} ${ah.y + 11} L ${ah.x2 - 16} ${ah.y + 4} L ${ah.x1} ${ah.y + 24} Z`} fill="url(#a11-taper)" />
      </svg>
      <FlowDot x1={ah.x1 + 10} x2={ah.x2 - 22} y={ah.y} t={t} period={2.4} size={8} tone={colors.white} />

      {leftMarks.map((src, i) => (
        <LogoTile key={i} x={lmx(i) - TS / 2} y={TY} w={TS} h={TS} src={src} logoW={i === 0 ? 38 : i === 1 ? 31 : 37} radius={14} d={i * 0.6} />
      ))}
      {work.map((w, i) => (
        <Tagged key={w.tag} x={wx(i)} y={iconY} icon={w.icon} tag={w.tag} size={42} loop="bob" d={i * 0.5} t={2.4} />
      ))}

      {/* specialists: IBM Cloud (point 1) and OCI (point 2) */}
      <LogoTile x={rcx[0] - RT_W / 2} y={TY} w={RT_W} h={RT_H} src={ibmWord} logoH={50} pad={6} radius={14} lit={lit(1)} d={0.3} />
      <LogoTile x={rcx[1] - RT_W / 2} y={TY} w={RT_W} h={RT_H} src={oracleWord} logoW={78} radius={14} lit={lit(2)} d={1.1} />
      {spec.map((col, c) =>
        col.map((s, j) => <Tagged key={s.tag} x={sx(c, j)} y={iconY} icon={s.icon} tag={s.tag} size={42} loop={s.loop} d={j * 0.6} t={2.2} on={step >= c + 1} lit={lit(c + 1)} delay={j * 130} />),
      )}

      {/* point 3: chosen for an existing vendor relationship */}
      <Tagged x={R.x + R.w / 2 - 44} y={248} icon="Building2" tag="Vendor" size={40} loop="bob" t={2.6} on={step >= 3} lit={lit(3)} />
      <Tagged x={R.x + R.w / 2 + 44} y={248} icon="Handshake" tag="Relationship" size={40} loop="shake" t={2.6} on={step >= 3} lit={lit(3)} delay={130} />
    </Frame>
  )
}

/* ================================================================== A_T05 · the five come back, and map to the same building blocks (616 x 340) */

function A_T05({ step }: { step: number }) {
  const held = useHeld()
  const lit = (i: number) => step === i && !held
  const t = useClock(0)
  const W = 616
  const H = 340
  const k = 0.72
  const fw = FIVE_W * k
  const fh = FIVE_H * k
  const ox = (W - fw) / 2
  const oy = 22
  const isHyper = (key: Key) => key === 'aws' || key === 'azure' || key === 'gcp'
  const WY = oy + fh + 12
  const WH = 16
  /* the arrow runs straight down from the wedge to the generic building blocks */
  const ay1 = WY + WH + 8
  const ay2 = ay1 + 36
  const PX = 34
  const PY = ay2 + 6
  const PH = H - 22 - PY
  const blocks = [
    { icon: 'Cpu', tag: 'Compute', loop: 'pulse' },
    { icon: 'Archive', tag: 'Storage', loop: 'bob' },
    { icon: 'Database', tag: 'Database', loop: 'bob' },
  ]
  const slot = (W - 2 * PX) / 3
  const dotY = (u: number) => ay1 + (ay2 - 14 - ay1) * u
  const period = 2
  const u = (((t % period) + period) % period) / period
  return (
    <Frame w={W} h={H}>
      <Five ox={ox} oy={oy} k={k} show={() => true} lit={(key) => (isHyper(key) ? lit(1) : lit(2))} />
      {/* point 3: the market position differs: the same wedge as slide 6, under the tiles */}
      <Wedge x={ox} y={WY} w={fw} h={WH} on={step >= 3} lit={lit(3)} />
      {/* point 4: the services underneath map onto one another */}
      <Show on={step >= 4} from="none" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <svg aria-hidden width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <line x1={W / 2} y1={ay1} x2={W / 2} y2={ay2 - 12} stroke={colors.brand} strokeWidth={3} strokeLinecap="round" />
          <path d={`M ${W / 2} ${ay2} L ${W / 2 - 7} ${ay2 - 13} L ${W / 2 + 7} ${ay2 - 13} Z`} fill={colors.brand} />
        </svg>
        {!held && u < 0.75 && <span aria-hidden style={{ position: 'absolute', left: W / 2 - 5, top: dotY(u / 0.75) - 5, width: 10, height: 10, borderRadius: 99, background: colors.brand, opacity: u < 0.1 ? u / 0.1 : u > 0.65 ? (0.75 - u) / 0.1 : 1, boxShadow: `0 0 0 4px ${colors.brand}2e` }} />}
      </Show>
      <Show on={step >= 4} delay={260} style={{ position: 'absolute', left: PX, top: PY, width: W - 2 * PX, height: PH, borderRadius: 18, ...TILE_SKIN, boxShadow: litRing(lit(4), TILE_SKIN.boxShadow as string) }}>
        {blocks.map((b, i) => (
          <div key={b.tag} style={{ position: 'absolute', left: i * slot, width: slot, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <GlyphTile icon={b.icon} size={44} loop={b.loop} d={i * 0.6} t={2.2} />
            <span style={tagStyle(colors.ink, 16)}>{b.tag}</span>
          </div>
        ))}
      </Show>
    </Frame>
  )
}

/* ------------------------------------------------------------------ exports */

type Fig = (p: Record<string, unknown>) => ReactNode
export const figures: Record<string, Fig> = {
  A_T01D: A_T01D as unknown as Fig,
  A_T01: A_T01 as unknown as Fig,
  A_T02B: A_T02B as unknown as Fig,
  A_T03: A_T03 as unknown as Fig,
  A_T05: A_T05 as unknown as Fig,
}

export const slides = {}

/* the loop vocabulary (transform / opacity only), held still on ?still, thumbnails and reduced motion */
export const css = `
.a11 { animation-delay: var(--a11-d, 0s); }
@keyframes a11-halo { 0%, 100% { opacity: 0.35; transform: scale(0.985) } 50% { opacity: 0.9; transform: scale(1.015) } }
.a11-halo { animation: a11-halo var(--a11-t, 3.6s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes a11-bob { 0%, 100% { transform: translateY(-2.5px) } 50% { transform: translateY(2.5px) } }
.a11-bob { animation: a11-bob var(--a11-t, 2.4s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes a11-pulse { 0%, 100% { transform: scale(0.93) } 50% { transform: scale(1.07) } }
.a11-pulse { animation: a11-pulse var(--a11-t, 2s) cubic-bezier(0.45,0,0.55,1) infinite; transform-origin: center; }
@keyframes a11-blinkled { 0%, 60%, 100% { opacity: 1 } 70% { opacity: 0.45 } 80% { opacity: 1 } 88% { opacity: 0.6 } }
.a11-blinkled { animation: a11-blinkled var(--a11-t, 2.2s) ease-in-out infinite; }
@keyframes a11-shake { 0%, 100% { transform: rotate(0deg) } 20% { transform: rotate(-7deg) } 40% { transform: rotate(6deg) } 60% { transform: rotate(-4deg) } 80% { transform: rotate(2deg) } }
.a11-shake { animation: a11-shake var(--a11-t, 2.6s) ease-in-out infinite; transform-origin: 50% 60%; }
@keyframes a11-breathe { 0%, 100% { transform: scale(1) } 50% { transform: scale(1.012) translateY(-1px) } }
.a11-breathe { animation: a11-breathe var(--a11-t, 4s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes a11-led { 0%, 55%, 100% { opacity: 1 } 65% { opacity: 0.25 } 78% { opacity: 1 } }
.a11-led { animation: a11-led var(--a11-t, 1.6s) ease-in-out infinite; }
@keyframes a11-read { 0%, 100% { transform: scaleY(0.25) } 50% { transform: scaleY(1) } }
.a11-read { animation: a11-read var(--a11-t, 1.8s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes a11-scan { 0% { transform: translateY(0); opacity: 0 } 15% { opacity: 1 } 85% { opacity: 1 } 100% { transform: translateY(46px); opacity: 0 } }
.a11-scan { animation: a11-scan var(--a11-t, 2.6s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes a11-chase { 0%, 100% { opacity: 0.25; transform: scale(0.8) } 20% { opacity: 1; transform: scale(1.1) } 45% { opacity: 0.25; transform: scale(0.8) } }
.a11-chase { animation: a11-chase var(--a11-t, 1.2s) linear infinite; }
@keyframes a11-glow { 0%, 100% { opacity: 0.35; transform: scale(0.9) } 50% { opacity: 1; transform: scale(1.12) } }
.a11-glow { animation: a11-glow var(--a11-t, 2.4s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes a11-soft { 0%, 100% { opacity: 0.8 } 50% { opacity: 1 } }
.a11-soft { animation: a11-soft var(--a11-t, 2.4s) cubic-bezier(0.45,0,0.55,1) infinite; }
.cc-still .a11-glow, .deck-thumb .a11-glow { opacity: 0.6 !important; transform: none !important; }
.cc-still .a11-scan, .deck-thumb .a11-scan { opacity: 0 !important; }
.cc-still .a11-read, .deck-thumb .a11-read { transform: scaleY(0.7) !important; }
.cc-still .a11-chase, .deck-thumb .a11-chase { opacity: 1 !important; transform: none !important; }
@keyframes a11-wsheen { 0% { transform: translateX(0) } 100% { transform: translateX(var(--a11-x, 600px)) } }
.a11-wsheen { animation: a11-wsheen var(--a11-t, 3.2s) cubic-bezier(0.45,0,0.55,1) infinite; }
.cc-still .a11, .deck-thumb .a11 { animation: none !important; }
.cc-still .a11-wsheen, .deck-thumb .a11-wsheen { opacity: 0 !important; }
.cc-still .a11-halo, .deck-thumb .a11-halo { opacity: 0.5 !important; transform: none !important; }
@media (prefers-reduced-motion: reduce) {
  .a11 { animation: none !important; }
  .a11-wsheen { opacity: 0 !important; }
}
`
