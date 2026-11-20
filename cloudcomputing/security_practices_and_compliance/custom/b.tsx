import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Badge } from '@/engine/icons3d'
import { EASE, ORANGE, Frame, Plinth, MarkTile, Panel, Wire, Junction, Show, Token, keyframes, useHeld, useHot, tag, type Pt } from '@/engine/figkit'
import trailMark from '../images/aws-cloudtrail.svg'
import bucketMark from '../images/res-s3-bucket.svg'
import logsMark from '../images/res-cloudwatch-logs.svg'
import alarmMark from '../images/res-cloudwatch-alarm.svg'
import ruleMark from '../images/res-eventbridge-rule.svg'
import snsMark from '../images/aws-sns.svg'
import flowMark from '../images/res-vpc-flow-logs.svg'
import gdMark from '../images/aws-guardduty.svg'

/*
 * Session 17 · Security Practices & Compliance · builder B: Section 3 (Logging, Auditing & Detection).
 * B_T08 (slide 22), B_T09 (23), B_T10 (24 part 1, 25 part 2), B_T11 (26 part 1, 27 part 2).
 *
 * Built to generate-slides standing correction 17: 3D icons from @/engine/icons3d on white plinth tiles, official marks
 * on the same tile, >= 20 px padding inside every stage, orthogonal wires whose tips sit on the target's edge (every
 * point computed from the same constants as the boxes), flow dots on wires, a lit item walking first -> last -> first
 * after the build (useHot), held frames complete with nothing lit and nothing moving. Every figure is 546 x 330 (the
 * points layout's box at pointsW 540, figH 330). `part` 2 draws part 1's end state, then builds its own points.
 * Loops: transform / opacity on HTML elements or root svgs only. Class prefix `t17b-`.
 */

type Fig = (p: Record<string, unknown>) => ReactNode
type LoopName = 'bob' | 'float' | 'pulse' | 'tilt' | 'spin' | 'glint' | 'beat' | 'swing' | 'none'
const K = keyframes('t17b')
const N = (n: string) => n as Ico3DName
const W = 546
const H = 330
const MONO = "'JetBrains Mono', ui-monospace, monospace"

/** a 3D icon on its plinth, `lit` rings it orange */
const Tile = ({ name, size = 56, k = 0.74, loop = 'bob', d = 0, t, lit = false, badge }: { name: string; size?: number; k?: number; loop?: LoopName; d?: number; t?: number; lit?: boolean; badge?: Badge }) => (
  <Plinth size={size} lit={lit}>
    <Ico3D name={N(name)} size={Math.round(size * k)} loop={loop} d={d} t={t} badge={badge} />
  </Plinth>
)

/** an absolutely placed node whose centre is (x, y) */
const At = ({ x, y, s, children, z = 3, style }: { x: number; y: number; s: number; children: ReactNode; z?: number; style?: CSSProperties }) => (
  <div style={{ position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, display: 'grid', placeItems: 'center', zIndex: z, ...style }}>{children}</div>
)

/** a tag centred under (x, top y) */
const TagAt = ({ x, y, text, w = 120, size = 15, on = true, color, wrap = false }: { x: number; y: number; text: string; w?: number; size?: number; on?: boolean; color?: string; wrap?: boolean }) => {
  const instant = useInstant()
  return (
    <div style={{ position: 'absolute', left: x - w / 2, top: y, width: w, ...tag(size, color), ...(wrap ? { whiteSpace: 'normal' } : {}), opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 520ms ${EASE}`, zIndex: 3 }}>
      {text}
    </div>
  )
}

/** a rider carrying any node along a `ride` class (placed from the frame's 0,0); nothing on held frames */
function Rider({ cls, on = true, size = 24, children }: { cls: string; on?: boolean; size?: number; children: ReactNode }) {
  const held = useHeld()
  if (held || !on) return null
  return (
    <span aria-hidden style={{ position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, zIndex: 6, pointerEvents: 'none' }}>
      <span className={cls} style={{ display: 'grid', placeItems: 'center', width: size, height: size, opacity: 0 }}>{children}</span>
    </span>
  )
}

/** a tiny log line (a white strip with a blue head) that rides a wire */
const LogChip = ({ tone = colors.brand }: { tone?: string }) => (
  <span style={{ display: 'flex', alignItems: 'center', gap: 3, width: 26, height: 14, padding: '0 4px', borderRadius: 4, background: '#FFFFFF', boxShadow: `inset 0 0 0 1.5px ${tone}66, 0 3px 8px -4px rgba(31,64,140,0.6)` }}>
    <span style={{ width: 4, height: 4, borderRadius: 99, background: tone, flexShrink: 0 }} />
    <span style={{ flex: 1, height: 3, borderRadius: 2, background: '#B9C9EE' }} />
  </span>
)

/** a value that steps 0 .. max on a wall clock while running; `held` shows max */
function useTicker(max: number, run: boolean, stepMs: number, restMs: number) {
  const held = useHeld()
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!run || held) return
    const start = performance.now()
    const period = max * stepMs + restMs
    const id = window.setInterval(() => {
      const t = (performance.now() - start) % period
      setV(Math.min(max, Math.floor(t / stepMs) + 1))
    }, 60)
    return () => window.clearInterval(id)
  }, [run, held, max, stepMs, restMs])
  if (held) return max
  return run ? v : 0
}

/* ================================================================== 22 · B_T08 · the four pillars */

/*
 * 546 x 330. A Logs source (CloudWatch Logs mark) at the top centre feeds a bus that drops into four cards left to
 * right: Audit Trail (trail), Retention (hourglass), Alerting (bell), Threat Detection (radar); the cards are chained
 * left to right by short wires. Step N shows card N with its drop wire; the lit card then walks 1 -> 4; log chips ride
 * the drops into every shown card.
 */
const A8 = { CW: 106, GAP: 24, CY: 142, CH: 168, SY: 52, ST: 60, BUS: 108 }
const A8_X0 = (W - (4 * A8.CW + 3 * A8.GAP)) / 2
const A8_CX = [0, 1, 2, 3].map((i) => A8_X0 + i * (A8.CW + A8.GAP) + A8.CW / 2)
const A8_SX = W / 2
const A8_DROP = (i: number): Pt[] => [[A8_SX, A8.SY + A8.ST / 2], [A8_SX, A8.BUS], [A8_CX[i], A8.BUS], [A8_CX[i], A8.CY]]
const A8_LINK = (i: number): Pt[] => [[A8_CX[i] + A8.CW / 2, A8.CY + A8.CH / 2], [A8_CX[i + 1] - A8.CW / 2, A8.CY + A8.CH / 2]]
const A8_RIDE = [0, 1, 2, 3].map((i) => K.ride(`8-${i}`, A8_DROP(i), 0.1 + i * 0.55, 1.1 + i * 0.55, 3.0))
const A8_CARDS: [string, string, LoopName][] = [
  ['Audit Trail', 'trail', 'bob'],
  ['Retention', 'hourglass', 'tilt'],
  ['Alerting', 'bell', 'swing'],
  ['Threat Detection', 'radar', 'pulse'],
]

const B_T08: Fig = ({ step = 0 }) => {
  const s = step as number
  const held = useHeld()
  const hot = useHot(4, s, 1500)
  const on = (k: number) => held || s >= k
  return (
    <Frame w={W} h={H}>
      <At x={A8_SX} y={A8.SY} s={A8.ST}><MarkTile src={logsMark} size={A8.ST} /></At>
      <div style={{ position: 'absolute', left: A8_SX + A8.ST / 2 + 12, top: A8.SY - 10, ...tag(15), textAlign: 'left' }}>Logs</div>
      <Junction x={A8_SX} y={A8.BUS} on={on(1)} />
      {A8_CARDS.map(([label, icon, loop], i) => {
        const x = A8_CX[i] - A8.CW / 2
        return (
          <div key={label}>
            <Wire pts={A8_DROP(i)} on={on(i + 1)} lit={hot === i} head={9} />
            {i < 3 && <Wire pts={A8_LINK(i)} on={on(i + 2)} head={8} delay={300} />}
            <Panel x={x} y={A8.CY} w={A8.CW} h={A8.CH} on={on(i + 1)} lit={hot === i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 12, padding: '30px 20px 20px' }}>
              <Tile name={icon} size={60} loop={loop} d={i * 0.45} lit={hot === i} />
              <span style={{ ...tag(15), whiteSpace: 'normal', lineHeight: 1.2 }}>{label}</span>
            </Panel>
            <Rider cls={A8_RIDE[i]} on={on(i + 1)} size={26}><LogChip /></Rider>
          </div>
        )
      })}
    </Frame>
  )
}

/* ================================================================== 23 · B_T09 · 90 days, then years */

/*
 * 546 x 330. Two time bars on one time scale. Row 1: the CloudTrail mark, then a short `90 Days` Event History bar
 * that fades out where its window ends. Row 2: the S3 bucket mark (Trail Storage), its bar running on to `Years`,
 * log files collecting in it. Steps: 1 the 90-day window; 2 the trail (wire from CloudTrail down to the bucket, log
 * chips riding it every few minutes, a clock beside it) and the long bar; 3 the lifecycle end (calendar) caps the bar;
 * 4 the integrity check: a digest seal over the files, one tampered file turns orange.
 */
const A9 = { TX: 54, T: 60, R1: 78, R2: 236, BX: 112, B1E: 222, BH: 34, B2E: 440, B2H: 48, LX: 488, LS: 52, SX: 330, SY: 150, SS: 48 }
const A9_TRAIL: Pt[] = [[A9.TX, A9.R1 + A9.T / 2], [A9.TX, A9.R2 - A9.T / 2]]
const A9_RIDE = [0, 1].map((k) => K.ride(`9-t${k}`, A9_TRAIL, 0.1 + k * 1.2, 1.0 + k * 1.2, 2.4))
const A9_SEAL: Pt[] = [[A9.SX, A9.SY + A9.SS / 2], [A9.SX, A9.R2 - A9.B2H / 2]]
const A9_FILES = [152, 196, 240, 284, 328]

function Bar({ x, y, w, h, on, lit, grow = true, children, fade = false }: { x: number; y: number; w: number; h: number; on: boolean; lit: boolean; grow?: boolean; children?: ReactNode; fade?: boolean }) {
  const instant = useInstant()
  return (
    <div
      style={{
        position: 'absolute', left: x, top: y - h / 2, width: w, height: h, borderRadius: 12, zIndex: 2, transformOrigin: '0% 50%',
        transform: on || !grow ? 'scaleX(1)' : 'scaleX(0.02)', opacity: on ? 1 : 0,
        transition: instant ? 'none' : `transform 860ms ${EASE}, opacity 320ms ${EASE}, box-shadow 420ms ${EASE}`,
        background: fade ? 'linear-gradient(90deg, #4F7CF8 0%, #4F7CF8 72%, rgba(79,124,248,0.15) 100%)' : 'linear-gradient(180deg, #6E95FF 0%, #2D63FB 100%)',
        boxShadow: lit ? `0 0 0 3px ${ORANGE}, 0 12px 22px -14px rgba(31,64,140,0.6)` : '0 12px 22px -14px rgba(31,64,140,0.6)',
      }}
    >
      <span style={{ position: 'absolute', left: 10, right: 10, top: 5, height: 8, borderRadius: 6, background: 'linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0))' }} />
      {children}
    </div>
  )
}

const B_T09: Fig = ({ step = 0 }) => {
  const s = step as number
  const held = useHeld()
  const hot = useHot(4, s, 1500)
  const on = (k: number) => held || s >= k
  const files = useTicker(A9_FILES.length, on(2) && !on(4), 700, 500)
  const shown = on(4) ? A9_FILES.length : files
  return (
    <Frame w={W} h={H}>
      {/* row 1 · Event History, 90 days */}
      <At x={A9.TX} y={A9.R1} s={A9.T}><MarkTile src={trailMark} size={A9.T} lit={hot === 0} /></At>
      <div style={{ position: 'absolute', left: A9.BX, top: A9.R1 - A9.BH / 2 - 26, ...tag(15), textAlign: 'left' }}>Event History</div>
      <Bar x={A9.BX} y={A9.R1} w={A9.B1E - A9.BX} h={A9.BH} on={on(1)} lit={hot === 0} fade>
        <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', ...tag(15, '#FFFFFF') }}>90 Days</span>
      </Bar>
      {/* the window ends: a dashed tail, nothing kept past it */}
      <Show on={on(1)} delay={500} style={{ position: 'absolute', left: A9.B1E + 10, top: A9.R1 - 1, width: A9.B2E - A9.B1E - 10, height: 2, zIndex: 1 }}>
        <span style={{ display: 'block', width: '100%', height: 2, backgroundImage: 'linear-gradient(90deg, #B9C9EE 0 8px, transparent 8px 14px)', backgroundSize: '14px 2px' }} />
      </Show>

      {/* the trail: CloudTrail delivers to the bucket every few minutes */}
      <Wire pts={A9_TRAIL} on={on(2)} lit={hot === 1} head={9} />
      {A9_RIDE.map((c) => <Rider key={c} cls={c} on={on(2)} size={26}><LogChip /></Rider>)}
      <Show on={on(2)} delay={300} style={{ position: 'absolute', left: A9.TX + 18, top: (A9.R1 + A9.R2) / 2 - 17, zIndex: 3 }}>
        <Ico3D name="clock" size={34} loop="pulse" t={2.4} />
      </Show>

      {/* row 2 · Trail Storage, years */}
      <Show on={on(2)} style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
        <At x={A9.TX} y={A9.R2} s={A9.T}><MarkTile src={bucketMark} size={A9.T} lit={hot === 1} /></At>
        <div style={{ position: 'absolute', left: A9.BX, top: A9.R2 - A9.B2H / 2 - 26, ...tag(15), textAlign: 'left' }}>Trail Storage</div>
        <TagAt x={A9.TX} y={A9.R2 + A9.T / 2 + 8} text="S3" w={80} />
      </Show>
      <Bar x={A9.BX} y={A9.R2} w={A9.B2E - A9.BX} h={A9.B2H} on={on(2)} lit={hot === 1 || hot === 2}>
        <span style={{ position: 'absolute', right: 12, top: 0, bottom: 0, display: 'grid', placeItems: 'center', ...tag(15, '#FFFFFF') }}>Years</span>
      </Bar>
      {A9_FILES.map((x, k) => {
        const tampered = k === 3 && on(4)
        return (
          <At key={x} x={x} y={A9.R2} s={34} z={4} style={{ opacity: k < shown ? 1 : 0, transition: held ? 'none' : `opacity 320ms ${EASE}` }}>
            <span style={{ display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: 8, background: tampered ? '#FFF1E6' : '#FFFFFF', boxShadow: tampered ? `inset 0 0 0 2px ${ORANGE}` : '0 4px 10px -5px rgba(13,42,140,0.7)', transition: held ? 'none' : `background 420ms ${EASE}, box-shadow 420ms ${EASE}` }}>
              <Ico3D name="log" size={24} loop={tampered ? 'beat' : 'none'} badge={on(4) ? (tampered ? 'alert' : 'check') : undefined} />
            </span>
          </At>
        )
      })}

      {/* 3 · the lifecycle rule sets where retention ends */}
      <Show on={on(3)} style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
        <At x={A9.LX} y={A9.R2} s={A9.LS}><Tile name="calendar" size={A9.LS} lit={hot === 2} loop="tilt" /></At>
        <TagAt x={A9.LX} y={A9.R2 + A9.LS / 2 + 8} text="Lifecycle" w={96} />
      </Show>
      <Wire pts={[[A9.B2E, A9.R2], [A9.LX - A9.LS / 2, A9.R2]]} on={on(3)} lit={hot === 2} head={0} />

      {/* 4 · integrity validation over the stored files */}
      <Wire pts={A9_SEAL} on={on(4)} lit={hot === 3} head={9} />
      <Show on={on(4)} style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
        <At x={A9.SX} y={A9.SY} s={A9.SS}><Tile name="digest" size={A9.SS} lit={hot === 3} loop="glint" /></At>
        <div style={{ position: 'absolute', left: A9.SX + A9.SS / 2 + 12, top: A9.SY - 10, ...tag(15), textAlign: 'left' }}>Integrity</div>
      </Show>
    </Frame>
  )
}

/* ================================================================== 24-25 · B_T10 · from log line to alert */

/*
 * 546 x 330, two lanes into one notifier. Lane A (top): Log Entry (CloudWatch Logs mark) -> Metric Filter -> Metric
 * (a live counter, n / 5) -> CloudWatch Alarm. Lane B (bottom, part 2): CloudTrail (an API call) -> EventBridge Rule.
 * Both lanes merge at a junction into SNS, which delivers to Email and Chat. Part 1 steps: 1 the filter catches a
 * matching line, 2 the counter climbs, 3 the alarm fires at 5. Part 2 steps: 1 the API call reaches the rule directly,
 * 2 SNS delivers to email and chat.
 */
const A10 = { X: [46, 138, 230, 322, 420, 504], YA: 82, YB: 236, T: 52, MERGE: 372, SY: 159, E1: 104, E2: 214, OUTX: 466 }
const A10_HALF = A10.T / 2
/* part 1 (slide 24) has its own, larger layout: the chain spans the stage at B_T08's card scale (84 px plinths, 64 px
   icons), the 5 Minutes window drawn large under the Metric counter. Part 2 (slide 25) keeps A10. */
const P1 = { T: 84, X: [62, 203, 343, 484], Y: 74, WX: 193, WY: 196, WW: 300, WH: 72, WP: 24, WS: 52, CHIP: 1.7 }
const P1_HALF = P1.T / 2
const P1_A = [0, 1, 2].map((i) => [[P1.X[i] + P1_HALF, P1.Y], [P1.X[i + 1] - P1_HALF, P1.Y]] as Pt[])
const P1_RA = K.ride('10-a1', P1_A[0], 0.1, 0.7, 1.0)
const A10_A = [0, 1, 2].map((i) => [[A10.X[i] + A10_HALF, A10.YA], [A10.X[i + 1] - A10_HALF, A10.YA]] as Pt[])
const A10_B: Pt[] = [[A10.X[0] + A10_HALF, A10.YB], [A10.X[3] - A10_HALF, A10.YB]]
const A10_TO_SNS = (y: number): Pt[] => [[A10.X[3] + A10_HALF, y], [A10.MERGE, y], [A10.MERGE, A10.SY], [A10.X[4] - A10_HALF, A10.SY]]
const A10_OUT = (y: number): Pt[] => [[A10.X[4] + A10_HALF, A10.SY], [A10.OUTX, A10.SY], [A10.OUTX, y], [A10.X[5] - A10_HALF, y]]
const A10_RA = K.ride('10-a', [[A10.X[0] + A10_HALF, A10.YA], [A10.X[1] - A10_HALF, A10.YA]], 0.1, 0.6, 0.9)
const A10_RB = K.ride('10-b', A10_B, 0.1, 1.4, 2.6)
const A10_RS = [A10.E1, A10.E2].map((y, k) => K.ride(`10-s${k}`, [...A10_TO_SNS(k === 0 ? A10.YA : A10.YB), ...A10_OUT(y).slice(1)], 0.1 + k * 1.3, 1.3 + k * 1.3, 2.6))

function Counter({ value, max, lit, size = A10.T }: { value: number; max: number; lit: boolean; size?: number }) {
  const held = useHeld()
  const full = value >= max && !held
  const k = size / A10.T
  return (
    <Plinth size={size} lit={lit || full}>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 1, fontFamily: MONO, fontVariantLigatures: 'none', fontWeight: 700, color: full ? ORANGE : colors.brandDeep }}>
        <span style={{ fontSize: Math.round(22 * k) }}>{value}</span>
        <span style={{ fontSize: Math.round(13 * k), color: '#8DA0C8' }}>/{max}</span>
      </span>
    </Plinth>
  )
}

function B_T10Part1({ s }: { s: number }) {
  const held = useHeld()
  const hot = useHot(3, s, 1500)
  const on = (k: number) => held || s >= k
  const count = useTicker(5, on(2), 560, 900)
  const shown = on(2) ? count : 0
  const fired = on(3) && shown >= 5 && !held
  const h = (k: number) => hot === k - 1
  const nodes: [string, ReactNode, number][] = [
    ['Log Entry', <MarkTile key="l" src={logsMark} size={P1.T} lit={h(1)} />, 0],
    ['Metric Filter', <Tile key="f" name="filter" size={P1.T} k={0.76} lit={h(1)} loop="pulse" t={1.8} />, 1],
    ['Metric', <Counter key="m" value={shown} max={5} lit={h(2)} size={P1.T} />, 2],
    ['Alarm', <span key="a" className={fired && !held ? 't17b-ring' : undefined} style={{ display: 'grid' }}><MarkTile src={alarmMark} size={P1.T} lit={h(3) || fired} /></span>, 3],
  ]
  return (
    <Frame w={W} h={H}>
      {nodes.map(([label, node, k], i) => (
        <Show key={label} on={on(k)} style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
          <At x={P1.X[i]} y={P1.Y} s={P1.T}>{node}</At>
          <TagAt x={P1.X[i]} y={P1.Y + P1_HALF + 8} text={label} w={120} size={16} />
        </Show>
      ))}
      {P1_A.map((pts, i) => <Wire key={i} pts={pts} on={on(i + 1)} lit={h(i + 1)} head={9} />)}
      <Rider cls={P1_RA} on={on(1)} size={30}><LogChip /></Rider>
      {/* the count window: one chip per matching hit, the alarm fires at 5 in 5 minutes */}
      <Wire pts={[[P1.X[2], P1.Y + P1_HALF + 34], [P1.X[2], P1.WY]]} on={on(2)} head={0} dash="4 5" color="#9DB8FF" />
      <Show on={on(2)} style={{ position: 'absolute', left: P1.WX, top: P1.WY, width: P1.WW, height: P1.WH, zIndex: 3 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 18, background: 'linear-gradient(180deg, #FFFFFF 0%, #EEF3FF 100%)', boxShadow: fired ? `inset 0 0 0 2.5px ${ORANGE}, 0 12px 24px -16px rgba(31,64,140,0.4)` : 'inset 0 0 0 1.5px #D3DEF6, 0 12px 24px -16px rgba(31,64,140,0.4)', transition: held ? 'none' : `box-shadow 320ms ${EASE}` }} />
        {[0, 1, 2, 3, 4].map((k) => (
          <span key={k} style={{ position: 'absolute', left: P1.WP + k * P1.WS, top: (P1.WH - 14 * P1.CHIP) / 2, width: 26 * P1.CHIP, height: 14 * P1.CHIP, opacity: k < shown ? 1 : 0.2, transition: held ? 'none' : `opacity 240ms ${EASE}` }}>
            <span style={{ display: 'block', transform: `scale(${P1.CHIP})`, transformOrigin: '0 0' }}>
              <LogChip tone={k < shown && fired ? ORANGE : colors.brand} />
            </span>
          </span>
        ))}
      </Show>
      <TagAt x={P1.WX + P1.WW / 2} y={P1.WY + P1.WH + 10} text="5 Minutes" w={140} size={16} on={on(2)} />
    </Frame>
  )
}

const B_T10: Fig = ({ step = 0, part = 1 }) => {
  const s = step as number
  const p2 = (part as number) === 2
  if (!p2) return <B_T10Part1 s={s} />
  const held = useHeld()
  const n = p2 ? 2 : 3
  const hot = useHot(n, s, 1500)
  const onA = (k: number) => p2 || held || s >= k
  const onB = (k: number) => p2 && (held || s >= k)
  const count = useTicker(5, onA(3) || (onA(2) && !onA(3)), 560, 900)
  const shownCount = onA(2) ? count : 0
  const fired = onA(3) && shownCount >= 5 && !held
  const hA = (k: number) => !p2 && hot === k - 1
  const hB = (k: number) => p2 && hot === k - 1
  const nodesA: [string, ReactNode, number][] = [
    ['Log Entry', <MarkTile key="l" src={logsMark} size={A10.T} lit={hA(1)} />, 0],
    ['Metric Filter', <Tile key="f" name="filter" size={A10.T} lit={hA(1)} loop="pulse" t={1.8} />, 1],
    ['Metric', <Counter key="m" value={shownCount} max={5} lit={hA(2)} />, 2],
    ['Alarm', <span key="a" className={fired && !held ? 't17b-ring' : undefined} style={{ display: 'grid' }}><MarkTile src={alarmMark} size={A10.T} lit={hA(3) || fired} /></span>, 3],
  ]
  return (
    <Frame w={W} h={H}>
      {/* lane A */}
      {nodesA.map(([label, node, k], i) => (
        <Show key={label} on={onA(k)} style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
          <At x={A10.X[i]} y={A10.YA} s={A10.T}>{node}</At>
          <TagAt x={A10.X[i]} y={A10.YA + A10_HALF + 8} text={label} w={96} />
        </Show>
      ))}
      {A10_A.map((pts, i) => <Wire key={i} pts={pts} on={onA(i === 0 ? 1 : i + 1)} lit={hA(i === 0 ? 1 : i + 1)} head={8} />)}
      <Rider cls={A10_RA} on={onA(1) && !held} size={26}><LogChip /></Rider>

      {/* lane B (part 2) */}
      <Show on={onB(1)} style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
        <At x={A10.X[0]} y={A10.YB} s={A10.T}><MarkTile src={trailMark} size={A10.T} lit={hB(1)} /></At>
        <TagAt x={A10.X[0]} y={A10.YB + A10_HALF + 8} text="CloudTrail" w={96} />
        <At x={A10.X[3]} y={A10.YB} s={A10.T}><MarkTile src={ruleMark} size={A10.T} lit={hB(1)} /></At>
        <TagAt x={A10.X[3]} y={A10.YB + A10_HALF + 8} text="Rule" w={96} />
      </Show>
      <Wire pts={A10_B} on={onB(1)} lit={hB(1)} head={9} />
      <Token cls={A10_RB} on={onB(1)} size={10} />

      {/* SNS, fed by both lanes, out to email and chat */}
      <Wire pts={A10_TO_SNS(A10.YA)} on={onB(2)} lit={hB(2)} head={9} />
      <Wire pts={A10_TO_SNS(A10.YB)} on={onB(2)} lit={hB(2)} head={9} />
      <Junction x={A10.MERGE} y={A10.SY} on={onB(2)} lit={hB(2)} />
      <Wire pts={A10_OUT(A10.E1)} on={onB(2)} lit={hB(2)} head={8} delay={400} />
      <Wire pts={A10_OUT(A10.E2)} on={onB(2)} lit={hB(2)} head={8} delay={400} />
      <Show on={onB(2)} style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
        <At x={A10.X[4]} y={A10.SY} s={A10.T}><MarkTile src={snsMark} size={A10.T} lit={hB(2)} /></At>
        <TagAt x={A10.X[4]} y={A10.SY + A10_HALF + 8} text="SNS" w={70} />
        <At x={A10.X[5]} y={A10.E1} s={44}><Tile name="mail" size={44} d={0.3} loop="bob" /></At>
        <TagAt x={A10.X[5]} y={A10.E1 + 22 + 6} text="Email" w={70} size={14} />
        <At x={A10.X[5]} y={A10.E2} s={44}><Tile name="chat" size={44} d={0.9} loop="bob" /></At>
        <TagAt x={A10.X[5]} y={A10.E2 + 22 + 6} text="Chat" w={70} size={14} />
      </Show>
      {A10_RS.map((c) => <Rider key={c} cls={c} on={onB(2)} size={22}><Ico3D name="bell" size={22} loop="none" /></Rider>)}
    </Frame>
  )
}

/* ================================================================== 26-27 · B_T11 · GuardDuty reads three logs */

/*
 * 546 x 330. Three log sources on the left (CloudTrail, VPC Flow Logs, DNS Logs) on orthogonal wires merging into the
 * GuardDuty mark; GuardDuty's findings list on the right, each finding an icon, its name and a severity bar. Part 1
 * steps: 1 Anomaly (a spike above the learned normal), 2 Credentials (unusual API calls), 3 Cryptomining and
 * Reconnaissance. Part 2 steps: 1 the list ranks itself by severity, 2 an agentless badge under GuardDuty (a server
 * with a cross: no agents, no servers). Loop: log chips ride into GuardDuty.
 */
const A11 = { SX: 52, ST: 52, SY: [58, 160, 262], MX: 124, GX: 206, GT: 72, GY: 160, PX: 278, PY: 30, PW: 248, PH: 280, RH: 48, NX: 206, NY: 270, NS: 44 }
const A11_IN = (i: number): Pt[] => (i === 1 ? [[A11.SX + A11.ST / 2, A11.GY], [A11.GX - A11.GT / 2, A11.GY]] : [[A11.SX + A11.ST / 2, A11.SY[i]], [A11.MX, A11.SY[i]], [A11.MX, A11.GY], [A11.GX - A11.GT / 2, A11.GY]])
const A11_RIDE = [0, 1, 2].map((i) => K.ride(`11-${i}`, A11_IN(i), 0.1 + i * 0.6, 1.1 + i * 0.6, 2.4))
/* [name, icon, severity 0..1, part-1 step] */
const A11_FIND: [string, string, number, number][] = [
  ['Anomaly', 'chart', 0.5, 1],
  ['Credentials', 'key', 1.0, 2],
  ['Cryptomining', 'coin', 0.8, 3],
  ['Reconnaissance', 'radar', 0.3, 3],
]
const A11_RANK = [...A11_FIND.keys()].sort((a, b) => A11_FIND[b][2] - A11_FIND[a][2])

function SourceTile({ i, lit }: { i: number; lit: boolean }) {
  if (i === 0) return <MarkTile src={trailMark} size={A11.ST} lit={lit} />
  if (i === 1) return <MarkTile src={flowMark} size={A11.ST} lit={lit} />
  return <Tile name="log" size={A11.ST} lit={lit} d={0.6} />
}

const B_T11: Fig = ({ step = 0, part = 1 }) => {
  const s = step as number
  const p2 = (part as number) === 2
  const held = useHeld()
  const instant = useInstant()
  const hot = useHot(p2 ? 2 : 3, s, 1500)
  const onA = (k: number) => p2 || held || s >= k
  const onB = (k: number) => p2 && (held || s >= k)
  const ranked = onB(1)
  const hA = (k: number) => !p2 && hot === k - 1
  const hB = (k: number) => p2 && hot === k - 1
  const rowTop = (i: number) => A11.PY + 48 + (ranked ? A11_RANK.indexOf(i) : i) * (A11.RH + 6)
  return (
    <Frame w={W} h={H}>
      {['CloudTrail', 'Flow Logs', 'DNS Logs'].map((label, i) => (
        <div key={label}>
          <At x={A11.SX} y={A11.SY[i]} s={A11.ST}><SourceTile i={i} lit={false} /></At>
          <TagAt x={A11.SX} y={A11.SY[i] + A11.ST / 2 + 6} text={label} w={96} size={14} />
          <Wire pts={A11_IN(i)} on head={i === 1 ? 9 : 0} delay={i * 150} />
          <Rider cls={A11_RIDE[i]} size={26}><LogChip /></Rider>
        </div>
      ))}
      <Junction x={A11.MX} y={A11.GY} />
      <At x={A11.GX} y={A11.GY} s={A11.GT}><MarkTile src={gdMark} size={A11.GT} /></At>
      <TagAt x={A11.GX} y={A11.GY + A11.GT / 2 + 8} text="GuardDuty" w={110} />
      <Wire pts={[[A11.GX + A11.GT / 2, A11.GY], [A11.PX, A11.GY]]} on={onA(1)} head={9} />

      {/* the findings list */}
      <Panel x={A11.PX} y={A11.PY} w={A11.PW} h={A11.PH} lit={hB(1)}>
        <div style={{ position: 'absolute', left: 20, top: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Ico3D name="list" size={24} loop="none" />
          <span style={{ ...tag(15), textAlign: 'left' }}>Findings</span>
        </div>
      </Panel>
      {A11_FIND.map(([name, icon, sev, k], i) => {
        const on = onA(k)
        const lit = (!p2 && hot === k - 1) || (hB(1) && A11_RANK.indexOf(i) === 0)
        return (
          <div
            key={name}
            style={{
              position: 'absolute', left: A11.PX + 16, top: rowTop(i), width: A11.PW - 32, height: A11.RH, zIndex: 4, borderRadius: 12,
              display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', background: lit ? '#FFF6EE' : '#F5F8FF',
              boxShadow: lit ? `inset 0 0 0 2px ${ORANGE}` : 'inset 0 0 0 1.5px #DCE5F8',
              opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(6px)',
              transition: instant ? 'none' : `top 760ms ${EASE}, opacity 520ms ${EASE}, transform 520ms ${EASE}, background 420ms ${EASE}, box-shadow 420ms ${EASE}`,
            }}
          >
            <Ico3D name={N(icon)} size={32} loop="bob" d={i * 0.5} />
            <span style={{ ...tag(14), textAlign: 'left', flex: 1 }}>{name}</span>
            <span style={{ width: 34, height: 10, borderRadius: 99, background: '#E3EAF8', overflow: 'hidden', flexShrink: 0 }}>
              <span style={{ display: 'block', width: `${sev * 100}%`, height: '100%', borderRadius: 99, background: sev > 0.7 ? ORANGE : sev > 0.4 ? '#FFB27A' : '#7FA0F5' }} />
            </span>
          </div>
        )
      })}

      {/* part 2 · 2 · no agents, no servers */}
      <Show on={onB(2)} style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
        <At x={A11.NX} y={A11.NY} s={A11.NS}><Tile name="server" size={A11.NS} badge="cross" lit={hB(2)} loop="none" /></At>
        <TagAt x={A11.NX} y={A11.NY + A11.NS / 2 + 4} text="No Agents" w={100} size={14} />
      </Show>
    </Frame>
  )
}

const RING_CSS = `
@keyframes t17b-ring { 0%, 100% { transform: rotate(0deg) } 15% { transform: rotate(-8deg) } 30% { transform: rotate(7deg) } 45% { transform: rotate(-5deg) } 60% { transform: rotate(0deg) } }
.t17b-ring { animation: t17b-ring 0.9s ease-in-out infinite; }
.cc-still .t17b-ring, .deck-thumb .t17b-ring { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .t17b-ring { animation: none !important; } }
`

export const figures: Record<string, Fig> = { B_T08, B_T09, B_T10, B_T11 }
export const css = K.css() + RING_CSS
