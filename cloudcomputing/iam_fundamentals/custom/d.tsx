import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { colors, fonts } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { MOTION, motionHeld } from '@/motion/tokens'
import { TILE_SKIN } from '@/decks/figures/card'
import { litRing } from '@/decks/figures/net/frames'
import { Icon } from '@/engine/icon'
import cloudtrailMark from '../images/aws-cloudtrail.svg'

/*
 * BUILDER D · IAM Fundamentals (Session 13), section 5 Reading a Denial:
 *   slide 39 C_T20 (three pieces of evidence converging on Root Cause), 40 C_T21 (the denial message, its parts boxed),
 *   42 C_T22 (a drawn CloudTrail Event History entry), 43 C_T23 (error → CloudTrail → policy → Sid, the TR bullets
 *   inside the cards), 45 C_T24 (evidence → statement → corrected policy, the three fix options).
 *
 * Built to Sessions 9-12 as reviewed (standing corrections 1-16, cloud R10-R13): icon-first, Title Case tags, no
 * chips / badges / connector labels, official marks on still white tiles, every glyph carries a quiet loop after its
 * build, the orange highlight follows the build then walks first → last → first forever and is gone on held frames,
 * straight arrows computed from the boxes' constants, equal padding, nothing overlapping. TR words arrive in `props`
 * or are the TR's own field names, printed exactly. Rules 49 and 55 on C_T21: the message parts are soft BLUE boxes
 * with a one-word tag under each, never an underline or a second colour.
 * Every loop is a CSS animation of `transform` / `opacity` on an HTML element (perf rule: compositor only), no
 * per-frame React state. Held (?still, thumbnails, reduced motion): the full end state, nothing lit, nothing moving.
 * Classes are prefixed `d13-`.
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const EASE = MOTION.ease
const useHeld = () => motionHeld(useInstant())
const FONT = "'DM Sans', system-ui, sans-serif"
const MONO = fonts.mono
const GOOD = '#1F9D63'

/* ------------------------------------------------------------------ loop vocabulary */

const lc = (kind: string) => `d13 d13-${kind}`
const lv = (d = 0, t?: number, extra: Record<string, string | number> = {}): CSSProperties =>
  ({ ['--d13-d' as string]: `${-d}s`, ...(t ? { ['--d13-t' as string]: `${t}s` } : {}), ...extra }) as CSSProperties

/** an index walking 0 → n-1 → 0 forever once the build is done; -1 on held frames (R13 looping highlight) */
function useCycle(n: number, done: boolean, periodMs = 1400) {
  const held = useHeld()
  const [i, setI] = useState(0)
  useEffect(() => {
    setI(0)
    if (!done || held || n < 1) return
    const id = window.setInterval(() => setI((v) => (v + 1) % n), periodMs)
    return () => window.clearInterval(id)
  }, [n, done, held, periodMs])
  return done && !held ? i : -1
}

/** the lit item: the current press while building, then the walking cycle; -1 on held frames */
function useHot(n: number, step: number) {
  const held = useHeld()
  const cyc = useCycle(n, step >= n)
  if (held) return -1
  return cyc >= 0 ? cyc : step - 1
}

/* ------------------------------------------------------------------ type */

const heading = (size: number, color: string = colors.ink): CSSProperties => ({ fontFamily: FONT, fontWeight: 700, fontSize: size, lineHeight: 1.2, color })
const body = (size: number, color: string = colors.ink): CSSProperties => ({ fontFamily: FONT, fontWeight: 500, fontSize: size, lineHeight: 1.36, color })
const tag = (size = 14, color: string = colors.brandDark): CSSProperties => ({ fontFamily: FONT, fontWeight: 600, fontSize: size, lineHeight: 1.15, color, whiteSpace: 'nowrap', textAlign: 'center' })
const mono = (size: number, color: string = colors.ink): CSSProperties => ({ fontFamily: MONO, fontSize: size, lineHeight: 1.4, color, fontVariantLigatures: 'none', fontFeatureSettings: '"liga" 0, "calt" 0' })

/* ------------------------------------------------------------------ pieces */

function Show({ on, children, style, delay = 0, lift = 6 }: { on: boolean; children: ReactNode; style?: CSSProperties; delay?: number; lift?: number }) {
  const instant = useInstant()
  return (
    <div
      style={{
        opacity: on ? 1 : 0,
        transform: on ? 'none' : `translateY(${lift}px)`,
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

/** an official mark on its white tile (rule 54); the mark never moves */
function MarkTile({ src, size = 44, scale = 0.74 }: { src: string; size?: number; scale?: number }) {
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: Math.round(size * 0.26), ...TILE_SKIN, flexShrink: 0 }}>
      <img src={src} alt="" aria-hidden draggable={false} style={{ width: Math.round(size * scale), height: Math.round(size * scale), objectFit: 'contain', display: 'block' }} />
    </span>
  )
}

/** a lucide glyph on a tile; `loop` moves the glyph only */
function Glyph({ icon, size = 44, tone = colors.brand, bg, loop = 'breathe', d = 0, t, lit = false }: { icon: string; size?: number; tone?: string; bg?: string; loop?: string; d?: number; t?: number; lit?: boolean }) {
  const instant = useInstant()
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: Math.round(size * 0.27), ...TILE_SKIN, ...(bg ? { background: bg } : {}), boxShadow: litRing(lit, TILE_SKIN.boxShadow as string), transition: instant ? 'none' : `box-shadow 420ms ${EASE}`, color: tone, flexShrink: 0 }}>
      <span className={loop ? lc(loop) : undefined} style={{ display: 'grid', placeItems: 'center', ...lv(d, t) }}>
        <Icon name={icon} size={Math.round(size * 0.5)} />
      </span>
    </span>
  )
}

/** an official mark (`img:`) or a lucide glyph, by the item's icon string */
const MarkOrGlyph = ({ icon, size = 44, loop = 'breathe', d = 0, tone }: { icon: string; size?: number; loop?: string; d?: number; tone?: string }) =>
  icon.startsWith('img:') ? <MarkTile src={icon.slice(4).replace(/^images\//, '../images/')} size={size} /> : <Glyph icon={icon} size={size} loop={loop} d={d} t={3.2} tone={tone} />

/** a white card that rings while it is the part being explained */
function Panel({ x, y, w, h, lit = false, on = true, radius = 18, children, delay = 0, tint, edge }: { x: number; y: number; w: number; h: number; lit?: boolean; on?: boolean; radius?: number; children?: ReactNode; delay?: number; tint?: string; edge?: string }) {
  const instant = useInstant()
  const base = edge ? `inset 0 0 0 2px ${edge}, 0 12px 24px -16px rgba(31,64,140,0.34)` : (TILE_SKIN.boxShadow as string)
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: radius, ...TILE_SKIN, ...(tint ? { background: tint } : {}), boxShadow: litRing(lit, base), transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }} />
      <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
    </Show>
  )
}

/** A STRAIGHT ARROW between two computed points, a filled head landing exactly on (x2, y2); draws itself when shown. */
function Arrow({ x1, y1, x2, y2, on = true, color = colors.brand, width = 2.5, head = 10, delay = 0, lit = false }: { x1: number; y1: number; x2: number; y2: number; on?: boolean; color?: string; width?: number; head?: number; delay?: number; lit?: boolean }) {
  const instant = useInstant()
  const len = Math.hypot(x2 - x1, y2 - y1)
  const ux = (x2 - x1) / len
  const uy = (y2 - y1) / len
  const c = lit ? colors.accent : color
  const tip = `${x2},${y2} ${x2 - ux * head - uy * head * 0.55},${y2 - uy * head + ux * head * 0.55} ${x2 - ux * head + uy * head * 0.55},${y2 - uy * head - ux * head * 0.55}`
  const lineLen = len - head * 0.85
  return (
    <svg aria-hidden style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }} width={1} height={1}>
      <line x1={x1} y1={y1} x2={x2 - ux * head * 0.85} y2={y2 - uy * head * 0.85} stroke={c} strokeWidth={width} strokeLinecap="round" strokeDasharray={lineLen} strokeDashoffset={on ? 0 : lineLen} style={{ transition: instant ? 'none' : `stroke-dashoffset 860ms ${EASE} ${on ? delay : 0}ms, stroke 420ms ${EASE}` }} />
      <polygon points={tip} fill={c} style={{ opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 300ms ${EASE} ${on ? delay + 700 : 0}ms, fill 420ms ${EASE}` }} />
    </svg>
  )
}

/** a dot that travels a straight segment forever (an HTML element moved by transform only); nothing on held frames */
function Traveller({ x1, y1, x2, y2, on = true, size = 10, t = 2.2, d = 0, tone = colors.brand }: { x1: number; y1: number; x2: number; y2: number; on?: boolean; size?: number; t?: number; d?: number; tone?: string }) {
  const held = useHeld()
  if (held || !on) return null
  return (
    <span aria-hidden className={lc('travel')} style={{ position: 'absolute', left: x1 - size / 2, top: y1 - size / 2, width: size, height: size, borderRadius: 99, background: tone, boxShadow: `0 0 0 3px ${tone}2e`, pointerEvents: 'none', zIndex: 6, ...lv(d, t, { '--d13-dx': `${x2 - x1}px`, '--d13-dy': `${y2 - y1}px` }) }} />
  )
}

/** a ring drawn round a field the TR names (orange, R4 / rule 51), standing once shown */
function FieldRing({ on }: { on: boolean }) {
  const instant = useInstant()
  return (
    <span aria-hidden style={{ position: 'absolute', inset: -3, borderRadius: 7, border: `2px solid ${colors.accent}`, boxShadow: `0 0 0 3px ${colors.accent}22`, opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE}`, pointerEvents: 'none' }} />
  )
}

/* ================================================================== C_T20 · three pieces of evidence */

const T20: Fig = ({ step = 0 }) => {
  const s = step as number
  const hot = useHot(3, s)
  const W = 610
  const H = 316
  const BX = 6
  const BW = 272
  const BH = 80
  const BY = [14, 118, 222]
  const cx = 512
  const cy = 158
  const r = 66
  const items: [string, string][] = [
    ['Error Message', 'MessageSquareWarning'],
    ['Audit Log', `img:${cloudtrailMark}`],
    ['Policy Statement', 'FileText'],
  ]
  return (
    <Frame w={W} h={H}>
      {items.map(([title, icon], i) => {
        const y = BY[i] + BH / 2
        const x1 = BX + BW + 8
        const dx = cx - x1
        const dy = cy - y
        const L = Math.hypot(dx, dy)
        const x2 = cx - (dx / L) * (r + 6)
        const y2 = cy - (dy / L) * (r + 6)
        return (
          <div key={title}>
            <Panel x={BX} y={BY[i]} w={BW} h={BH} on={s >= i + 1} lit={hot === i}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 16, padding: '0 18px' }}>
                {icon.startsWith('img:') ? <MarkTile src={icon.slice(4)} size={48} /> : <Glyph icon={icon} size={48} loop="bob" d={i * 0.7} />}
                <span style={{ ...heading(18), whiteSpace: 'nowrap' }}>{title}</span>
              </div>
            </Panel>
            <Arrow x1={x1} y1={y} x2={x2} y2={y2} on={s >= i + 1} lit={hot === i} delay={200} />
            <Traveller x1={x1} y1={y} x2={x2 - (dx / L) * 6} y2={y2 - (dy / L) * 6} on={s >= 3} t={2.4} d={i * 0.8} />
          </div>
        )
      })}
      <Show on={s >= 1} style={{ position: 'absolute', left: cx - r, top: cy - r, width: r * 2, height: r * 2 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 999, ...TILE_SKIN, display: 'grid', placeItems: 'center', color: colors.brand }}>
          <span className={lc('scan')} style={{ display: 'grid', placeItems: 'center', ...lv(0, 3.6) }}>
            <Icon name="Search" size={62} />
          </span>
        </div>
      </Show>
      <Show on={s >= 1} style={{ position: 'absolute', left: cx - 80, top: cy + r + 12, width: 160 }}>
        <div style={tag(16)}>Root Cause</div>
      </Show>
    </Frame>
  )
}

/* ================================================================== C_T21 · the denial message, its parts boxed */

type Seg = { text: string; part?: number }
const PART_TAGS = ['Principal', 'Action', 'Resource', 'Reason']

/** split the TR's sample at the four parts it names (principal ARN, action, resource ARN, reason clause) */
function splitSample(sample: string): Seg[] {
  const finds: [number, RegExp][] = [
    [0, /arn:aws:iam::\S+/],
    [1, /\bs3:[A-Za-z]+/],
    [2, /arn:aws:s3:::\S+/],
    [3, /with an explicit deny.*$/],
  ]
  const hits: { a: number; b: number; part: number }[] = []
  for (const [part, re] of finds) {
    const m = re.exec(sample)
    if (m) hits.push({ a: m.index, b: m.index + m[0].length, part })
  }
  hits.sort((p, q) => p.a - q.a)
  const out: Seg[] = []
  let at = 0
  for (const h of hits) {
    if (h.a > at) out.push({ text: sample.slice(at, h.a) })
    out.push({ text: sample.slice(h.a, h.b), part: h.part })
    at = h.b
  }
  if (at < sample.length) out.push({ text: sample.slice(at) })
  return out
}

function PartBox({ text, label, lit, on }: { text: string; label: string; lit: boolean; on: boolean }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'relative', display: 'inline-block', margin: '0 2px', verticalAlign: 'baseline', lineHeight: 1.6 }}>
      <span
        style={{
          display: 'inline-block',
          padding: '1px 7px',
          borderRadius: 7,
          background: on ? '#E3ECFF' : 'transparent',
          boxShadow: litRing(lit, on ? 'inset 0 0 0 1.5px #A9C1F7' : ''),
          color: on ? colors.brandDark : colors.ink,
          fontWeight: on ? 600 : 400,
          transition: instant ? 'none' : `background 420ms ${EASE}, box-shadow 420ms ${EASE}, color 420ms ${EASE}`,
        }}
      >
        {text}
      </span>
      <span style={{ position: 'absolute', left: 0, right: 0, top: '100%', marginTop: 4, zIndex: 2, lineHeight: 1, display: 'flex', justifyContent: 'center', opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE}` }}>
        <span style={{ ...tag(12.5, colors.brandDark), fontFamily: FONT }}>{label}</span>
      </span>
    </span>
  )
}

const T21: Fig = ({ step = 0, sample = '' }) => {
  const s = step as number
  const hot = useHot(4, s)
  const segs = splitSample(sample as string)
  const W = 620
  const H = 318
  return (
    <Frame w={W} h={H}>
      <Panel x={0} y={0} w={W} h={H} radius={16}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 52, display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', borderBottom: '1px solid #DCE5F7' }}>
          <span style={{ display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: 9, background: '#FFF1E6', color: colors.accent }}>
            <span className={lc('pulse')} style={{ display: 'grid', placeItems: 'center', ...lv(0, 2) }}>
              <Icon name="OctagonX" size={19} />
            </span>
          </span>
          <span style={heading(18)}>Access Denied</span>
        </div>
        <div style={{ position: 'absolute', left: 20, right: 20, top: 62, ...mono(15.5), lineHeight: '56px' }}>
          {segs.map((g, i) =>
            g.part === undefined ? (
              <span key={i}>{g.text}</span>
            ) : (
              <PartBox key={i} text={g.text} label={PART_TAGS[g.part]} on={s >= g.part + 1} lit={hot === g.part} />
            ),
          )}
        </div>
      </Panel>
    </Frame>
  )
}

/* ================================================================== C_T22 · a drawn CloudTrail event entry */

const T22: Fig = ({ step = 0 }) => {
  const s = step as number
  const hot = useHot(4, s)
  const instant = useInstant()
  const W = 620
  const H = 322
  const CH = 236 // console height
  /* the list is wider for PutBucketPolicy (Session 13 review, T22), taken from the menu and the record */
  const NAV = 98
  const LIST = 158
  const events: [string, boolean][] = [
    ['DeleteBucket', false],
    ['CreateUser', true],
    ['PutBucketPolicy', true],
    ['DeleteBucket', false],
  ]
  const filtered = s >= 2
  const fields: [string, string, boolean][] = [
    ['eventName', '"DeleteBucket"', true],
    ['errorCode', '"AccessDenied"', true],
    ['sourceIPAddress', '"203.0.113.5"', false],
    ['userIdentity', '{\n  "arn": "arn:aws:iam::123456789012:user/alice"\n}', true],
  ]
  return (
    <Frame w={W} h={H}>
      <Panel x={0} y={0} w={W} h={CH} radius={14} on={s >= 1}>
        {/* title bar */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 40, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', borderBottom: '1px solid #DCE5F7', background: 'linear-gradient(180deg,#F7FAFF,#EEF3FD)', borderRadius: '14px 14px 0 0' }}>
          <img src={cloudtrailMark} alt="" aria-hidden style={{ width: 24, height: 24, display: 'block' }} />
          <span style={heading(15)}>CloudTrail</span>
        </div>
        {/* nav */}
        <div style={{ position: 'absolute', left: 0, top: 40, width: NAV, bottom: 0, borderRight: '1px solid #DCE5F7', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {['Dashboard', 'Event History', 'Trails'].map((n) => {
            const me = n === 'Event History'
            const on = me && s >= 3
            return (
              <div key={n} style={{ position: 'relative', ...body(13, me ? colors.brandDark : '#5B6780'), fontWeight: me ? 700 : 500, padding: '5px 8px', borderRadius: 7, background: on ? '#E3ECFF' : 'transparent', boxShadow: litRing(me && hot === 2), transition: instant ? 'none' : `background 420ms ${EASE}, box-shadow 420ms ${EASE}` }}>
                {n}
              </div>
            )
          })}
        </div>
        {/* event list */}
        <div style={{ position: 'absolute', left: NAV, top: 40, width: LIST, bottom: 0, borderRight: '1px solid #DCE5F7', padding: '10px 10px', boxShadow: litRing(hot === 1), borderRadius: 4, transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 26, padding: '0 8px', borderRadius: 7, boxShadow: 'inset 0 0 0 1px #CFDCF5', background: '#fff', ...mono(12, filtered ? colors.brandDark : '#97A3BA') }}>
            <Icon name="Filter" size={13} />
            <span style={{ opacity: filtered ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE}` }}>AccessDenied</span>
          </div>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {events.map(([name, ok], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 30, padding: '0 6px', borderRadius: 7, background: i === 0 ? '#EEF3FF' : 'transparent', opacity: filtered && ok ? 0.28 : 1, transition: instant ? 'none' : `opacity 420ms ${EASE}` }}>
                <span style={{ display: 'grid', placeItems: 'center', color: ok ? GOOD : colors.accent }}>
                  <Icon name={ok ? 'CircleCheck' : 'CircleX'} size={15} />
                </span>
                <span style={mono(11.5)}>{name}</span>
              </div>
            ))}
          </div>
        </div>
        {/* record */}
        <div style={{ position: 'absolute', left: NAV + LIST, top: 40, right: 0, bottom: 0, padding: '14px 12px', boxShadow: litRing(hot === 0), borderRadius: '0 0 14px 0', transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {fields.map(([k, v, ring]) => (
              <div key={k} style={{ position: 'relative', padding: '3px 6px', ...mono(11.5) }}>
                <span style={{ color: colors.brandDark, fontWeight: 600 }}>{k}</span>
                <span style={{ color: '#5B6780' }}>: </span>
                <span style={{ color: colors.ink, whiteSpace: 'pre' }}>{v}</span>
                {ring && <FieldRing on={s >= 1} />}
              </div>
            ))}
          </div>
        </div>
      </Panel>
      {/* retention strip */}
      <Show on={s >= 4} style={{ position: 'absolute', left: 0, top: CH + 18, width: W, height: H - CH - 18 }}>
        <div style={{ position: 'relative', height: '100%', borderRadius: 12, boxShadow: litRing(hot === 3), transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
          <div style={{ position: 'absolute', left: 12, top: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Glyph icon="CalendarDays" size={36} loop="bob" t={2.8} />
          </div>
          <div style={{ position: 'absolute', left: 60, top: 14, width: 250, height: 22, borderRadius: 99, background: 'linear-gradient(90deg,#CFDDFF,#9FB9F5)', boxShadow: 'inset 0 0 0 1px #A9C1F7' }} />
          <div style={{ position: 'absolute', left: 60, top: 42, width: 250, ...tag(13) }}>90 Days</div>
          <div style={{ position: 'absolute', left: 318, top: 14, width: 290, height: 22, borderRadius: 99, overflow: 'hidden', boxShadow: 'inset 0 0 0 1px #A9C1F7', background: '#F1F5FE' }}>
            <span className={lc('fill')} style={{ position: 'absolute', inset: 0, borderRadius: 99, background: 'linear-gradient(90deg,#9FB9F5,#6E95EE)', transformOrigin: '0 50%', ...lv(0, 3.4) }} />
          </div>
          <div style={{ position: 'absolute', left: 318, top: 42, width: 290, ...tag(13) }}>Trail</div>
        </div>
      </Show>
    </Frame>
  )
}

/* ================================================================== C_T23 · from the error to the one rule */

type Card23 = [string, string, string[]]

const T23: Fig = ({ step = 0, cards = [], w = 1100, h = 320 }) => {
  const s = step as number
  const cs = cards as Card23[]
  const hot = useHot(cs.length, s)
  /* laid out from the stage it is given: the same padding on all four sides, so a stage of any size frames it evenly */
  const PAD = 16
  const W = Math.min(w as number, 1110) - PAD * 2
  const H = (h as number) - PAD * 2
  const GAP = 38
  const share = [215, 145, 330, 270]
  const k = (W - GAP * (cs.length - 1)) / share.reduce((x, y) => x + y, 0)
  const widths = share.map((v) => Math.floor(v * k))
  const xs: number[] = []
  let acc = 0
  for (const cw of widths) {
    xs.push(acc)
    acc += cw + GAP
  }
  const AY = 20 + 22
  return (
    <Frame w={W} h={H}>
      {cs.map(([title, icon, bullets], i) => {
        const sid = i === cs.length - 1
        const empty = bullets.length === 0
        return (
          <div key={title}>
            <Panel x={xs[i]} y={0} w={widths[i]} h={H} on={s >= i + 1} lit={hot === i} tint={sid ? 'linear-gradient(180deg,#FFF8F2 0%,#FFEBDC 100%)' : undefined} edge={sid ? colors.accent : undefined}>
              <div style={{ position: 'absolute', inset: 0, padding: 20, display: 'flex', flexDirection: 'column', gap: 10, alignItems: empty ? 'center' : 'flex-start', justifyContent: empty ? 'center' : 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: empty || sid ? 'column' : 'row', alignItems: empty ? 'center' : sid ? 'flex-start' : 'center', gap: 12, marginBottom: empty ? 0 : 4 }}>
                  <MarkOrGlyph icon={icon} size={empty ? 64 : 44} d={i * 0.6} tone={sid ? colors.accent : undefined} loop={sid ? 'pulse' : 'breathe'} />
                  <span style={{ ...heading(sid ? 15.5 : 17), whiteSpace: empty ? 'normal' : 'nowrap', textAlign: empty ? 'center' : 'left' }}>{title}</span>
                </div>
                {bullets.map((b, k2) => (
                  <div key={k2} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                    <span style={{ width: 7, height: 7, borderRadius: 99, background: sid ? colors.accent : colors.brand, marginTop: 8, flexShrink: 0 }} />
                    <span style={{ ...body(15), overflowWrap: 'break-word' }}>{b}</span>
                  </div>
                ))}
              </div>
            </Panel>
            {i < cs.length - 1 && (
              <>
                <Arrow x1={xs[i] + widths[i] + 6} y1={AY} x2={xs[i + 1] - 6} y2={AY} on={s >= i + 2} lit={hot === i + 1} />
                <Traveller x1={xs[i] + widths[i] + 8} y1={AY} x2={xs[i + 1] - 18} y2={AY} on={s >= cs.length} t={1.8} d={i * 0.6} size={9} />
              </>
            )}
          </div>
        )
      })}
    </Frame>
  )
}

/* ================================================================== C_T24 · evidence → statement → corrected policy */

const T24: Fig = ({ step = 0 }) => {
  const s = step as number
  const hot = useHot(3, s)
  const W = 610
  const H = 320
  const BW = 176
  const BH = 124
  const GAP = 41
  const BY = 10
  const xs = [0, BW + GAP, 2 * (BW + GAP)]
  const boxes: [string, string][] = [
    ['Evidence Gathered', 'ClipboardList'],
    ['Statement Identified', 'FileSearch'],
    ['Policy Corrected', 'FileCheck'],
  ]
  const fixes: [string, string][] = [
    ['Add Allow', 'CirclePlus'],
    ['Remove Deny', 'CircleMinus'],
    ['Satisfy Condition', 'CircleCheck'],
  ]
  const FY = 226
  const fx = [300, 430, 548]
  const b3x = xs[2] + BW / 2
  return (
    <Frame w={W} h={H}>
      {boxes.map(([title, icon], i) => (
        <div key={title}>
          <Panel x={xs[i]} y={BY} w={BW} h={BH} on={s >= i + 1} lit={hot === i}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 14 }}>
              <Glyph icon={icon} size={50} loop="bob" d={i * 0.7} />
              <span style={{ ...heading(16), textAlign: 'center' }}>{title}</span>
            </div>
          </Panel>
          {i < 2 && (
            <>
              <Arrow x1={xs[i] + BW + 5} y1={BY + BH / 2} x2={xs[i + 1] - 5} y2={BY + BH / 2} on={s >= i + 2} lit={hot === i + 1} />
              <Traveller x1={xs[i] + BW + 6} y1={BY + BH / 2} x2={xs[i + 1] - 16} y2={BY + BH / 2} on={s >= 3} t={1.8} d={i * 0.9} size={9} />
            </>
          )}
        </div>
      ))}
      {fixes.map(([label, icon], k) => (
        <div key={label}>
          <Arrow x1={b3x} y1={BY + BH + 6} x2={fx[k]} y2={FY - 6} on={s >= 3} lit={hot === 2} delay={150 * k} />
          <Show on={s >= 3} delay={300 + 150 * k} style={{ position: 'absolute', left: fx[k] - 60, top: FY, width: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Glyph icon={icon} size={46} loop="pulse" d={k * 0.6} t={2.6} lit={hot === 2} />
            <span style={tag(14)}>{label}</span>
          </Show>
        </div>
      ))}
    </Frame>
  )
}

export const figures: Record<string, Fig> = { C_T20: T20, C_T21: T21, C_T22: T22, C_T23: T23, C_T24: T24 }

export const css = `
.d13 { animation-delay: var(--d13-d, 0s); }
@keyframes d13-breathe { 0%, 100% { transform: translateY(0) scale(1) } 50% { transform: translateY(-1.5px) scale(1.08) } }
.d13-breathe { animation: d13-breathe var(--d13-t, 3.2s) cubic-bezier(0.45,0,0.55,1) infinite; transform-origin: center; }
@keyframes d13-bob { 0%, 100% { transform: translateY(-2px) } 50% { transform: translateY(2px) } }
.d13-bob { animation: d13-bob var(--d13-t, 2.4s) ease-in-out infinite; }
@keyframes d13-pulse { 0%, 100% { transform: scale(0.94) } 50% { transform: scale(1.08) } }
.d13-pulse { animation: d13-pulse var(--d13-t, 1.8s) ease-in-out infinite; transform-origin: center; }
@keyframes d13-scan { 0%, 100% { transform: translate(-8px, -6px) rotate(-8deg) } 33% { transform: translate(6px, 0) rotate(4deg) } 66% { transform: translate(-6px, 7px) rotate(-2deg) } }
.d13-scan { animation: d13-scan var(--d13-t, 3.6s) ease-in-out infinite; transform-origin: center; }
@keyframes d13-travel { 0% { transform: translate(0, 0); opacity: 0 } 12% { opacity: 1 } 88% { opacity: 1 } 100% { transform: translate(var(--d13-dx), var(--d13-dy)); opacity: 0 } }
.d13-travel { animation: d13-travel var(--d13-t, 2.2s) linear infinite; opacity: 0; }
@keyframes d13-fill { 0% { transform: scaleX(0.04) } 70%, 100% { transform: scaleX(1) } }
.d13-fill { animation: d13-fill var(--d13-t, 3.4s) cubic-bezier(0.45,0,0.55,1) infinite; }
.cc-still .d13, .deck-thumb .d13 { animation: none !important; }
.cc-still .d13-travel, .deck-thumb .d13-travel { opacity: 0 !important; }
@media (prefers-reduced-motion: reduce) {
  .d13 { animation: none !important; }
  .d13-travel { opacity: 0 !important; }
}
`
