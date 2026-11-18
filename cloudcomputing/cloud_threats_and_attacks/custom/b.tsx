import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Badge } from '@/engine/icons3d'
import {
  EASE, ORANGE, Frame, Plinth, MarkTile, Panel, Wire, Junction, Show, Token, keyframes, useHeld, useHot, tag, body, loopCls, loopVars, type Pt,
} from '@/engine/figkit'
import secretsMark from '../images/aws-secrets-manager.svg'
import guarddutyMark from '../images/aws-guardduty.svg'
import apigwMark from '../images/aws-api-gateway.svg'
import wafMark from '../images/aws-waf.svg'
import hubMark from '../images/aws-security-hub.svg'
import trailMark from '../images/aws-cloudtrail.svg'
import bucketMark from '../images/res-s3-bucket.svg'
import objectMark from '../images/res-s3-object.svg'

/*
 * Session 16 · Cloud Threats & Attacks · builder B: Section 2 (Data Breaches) and Section 3 (Misconfiguration).
 * B_T08 (slide 18), B_T09 (19), B_T10 (20), B_T11B (22), B_T12 (24), B_T13 (25).
 *
 * Built to generate-slides standing correction 17 (Session 13 visual standard): 3D icons from @/engine/icons3d on
 * white plinth tiles, official marks on the same tile, >= 20 px padding inside every stage, orthogonal wires whose
 * tips sit on the target's edge (every point computed from the same constants as the boxes), flow dots on wires, a lit
 * item walking first -> last -> first after the build (useHot), held frames complete with nothing lit and nothing moving.
 * Loops: transform / opacity on HTML elements or root svgs only. Class prefix `t16b-`.
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('t16b')
const N = (n: string) => n as Ico3DName
const GOLD = '#F2B321'

/** a 3D icon on its plinth, `lit` rings it orange */
const Tile = ({ name, size = 60, k = 0.74, loop = 'bob', d = 0, t, lit = false, badge }: { name: string; size?: number; k?: number; loop?: 'bob' | 'float' | 'pulse' | 'tilt' | 'spin' | 'glint' | 'beat' | 'swing' | 'none'; d?: number; t?: number; lit?: boolean; badge?: Badge }) => (
  <Plinth size={size} lit={lit}>
    <Ico3D name={N(name)} size={Math.round(size * k)} loop={loop} d={d} t={t} badge={badge} />
  </Plinth>
)

/** a 3D icon with a second one on its lower-right corner, on a plinth */
const PairTile = ({ main, over, size = 60, lit = false, d = 0, loop = 'bob' as const }: { main: string; over: string; size?: number; lit?: boolean; d?: number; loop?: 'bob' | 'float' | 'tilt' }) => {
  const m = Math.round(size * 0.66)
  const o = Math.round(size * 0.36)
  return (
    <Plinth size={size} lit={lit}>
      <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: m, height: m }}>
        <Ico3D name={N(main)} size={m} loop={loop} d={d} />
        <span style={{ position: 'absolute', right: -Math.round(o * 0.5), bottom: -Math.round(o * 0.4), width: o + 4, height: o + 4, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6)', display: 'grid', placeItems: 'center' }}>
          <Ico3D name={N(over)} size={o} loop="pulse" d={d + 0.4} t={2.4} />
        </span>
      </span>
    </Plinth>
  )
}

/** the Internet globe on its plinth with a soft blue glow breathing around it (no spin) */
const GlowGlobe = ({ size, k = 0.76, d = 0 }: { size: number; k?: number; d?: number }) => {
  const g = Math.round(size * 1.7)
  const inner = Math.round(size * k * 1.05)
  return (
    <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: size, height: size }}>
      <span className="t16b-glow" style={{ position: 'absolute', left: (size - g) / 2, top: (size - g) / 2, width: g, height: g, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,124,248,0.42) 0%, rgba(79,124,248,0.2) 38%, rgba(79,124,248,0) 68%)', pointerEvents: 'none', ['--t16b-gd' as string]: `${-d}s` } as CSSProperties} />
      <span style={{ position: 'relative' }}>
        <Plinth size={size}>
          <span style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
            <span className="t16b-glow" style={{ position: 'absolute', left: (size * k - inner) / 2, top: (size * k - inner) / 2, width: inner, height: inner, borderRadius: '50%', background: 'radial-gradient(circle, rgba(140,180,255,0.75) 0%, rgba(140,180,255,0) 70%)', pointerEvents: 'none', ['--t16b-gd' as string]: `${-d}s` } as CSSProperties} />
            <Ico3D name={N('globe')} size={Math.round(size * k)} loop="none" style={{ position: 'relative' }} />
          </span>
        </Plinth>
      </span>
    </span>
  )
}
const GLOW_CSS = `
@keyframes t16b-glow { 0%, 100% { opacity: 0.35; transform: scale(0.9) } 50% { opacity: 1; transform: scale(1.06) } }
.t16b-glow { animation: t16b-glow 3s cubic-bezier(0.45,0,0.55,1) infinite; animation-delay: var(--t16b-gd, 0s); will-change: transform, opacity; }
.cc-still .t16b-glow, .deck-thumb .t16b-glow { animation: none !important; opacity: 0.7 !important; transform: none !important; }
@media (prefers-reduced-motion: reduce) { .t16b-glow { animation: none !important; } }
`

/** an absolutely placed node whose centre is (x, y) */
const At = ({ x, y, s, children, z = 3, style }: { x: number; y: number; s: number; children: ReactNode; z?: number; style?: CSSProperties }) => (
  <div style={{ position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, display: 'grid', placeItems: 'center', zIndex: z, ...style }}>{children}</div>
)

/** a tag centred under (x, top y) */
const TagAt = ({ x, y, text, w = 150, size = 15, on = true, color }: { x: number; y: number; text: string; w?: number; size?: number; on?: boolean; color?: string }) => {
  const instant = useInstant()
  return <div style={{ position: 'absolute', left: x - w / 2, top: y, width: w, ...tag(size, color), opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 520ms ${EASE}`, zIndex: 3 }}>{text}</div>
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

/* ================================================================== 18 · B_T08 · two entry paths, one cost */

/*
 * 546 x 330. Attacker on the left; two orthogonal paths through a Credential (key) and an API (code) tile, merging into
 * the Data Store; the Cost (receipt) hangs under it. Steps: 1 the credential path, 2 the API path, 3 the cost tag.
 */
const A8 = { W: 546, H: 330, AX: 72, CY: 132, MX: 262, Y1: 58, Y2: 206, DX: 448, B1: 152, B2: 358, T: 60, DS: 76 }
const A8_IN = (y: number): Pt[] => [[A8.AX + 34, A8.CY], [A8.B1, A8.CY], [A8.B1, y], [A8.MX - A8.T / 2, y]]
const A8_OUT = (y: number): Pt[] => [[A8.MX + A8.T / 2, y], [A8.B2, y], [A8.B2, A8.CY], [A8.DX - A8.DS / 2, A8.CY]]
const A8_RIDE = [A8.Y1, A8.Y2].flatMap((y, i) => [
  K.ride(`8-in${i}`, A8_IN(y), 0.1 + i * 1.3, 0.9 + i * 1.3, 2.8),
  K.ride(`8-out${i}`, A8_OUT(y), 1.0 + i * 1.3, 1.8 + i * 1.3, 2.8),
])
/* the second pair runs 1.3 s later; the loop restarts at 2.8 s with no rest beyond the ride */

const B_T08: Fig = ({ step = 0 }) => {
  const s = step as number
  const held = useHeld()
  const hot = useHot(3, s, 1600)
  const full = held || s >= 3
  const paths: [number, string, string][] = [[A8.Y1, 'key', 'Credential'], [A8.Y2, 'code', 'API']]
  return (
    <Frame w={A8.W} h={A8.H}>
      <At x={A8.AX} y={A8.CY} s={64}><Tile name="user" size={64} badge="alert" /></At>
      <TagAt x={A8.AX} y={A8.CY + 40} text="Attacker" w={120} />
      {paths.map(([y, icon, label], i) => (
        <div key={label}>
          <Wire pts={A8_IN(y)} on={held || s >= i + 1} lit={hot === i} delay={0} />
          <Wire pts={A8_OUT(y)} on={held || s >= i + 1} lit={hot === i} delay={500} />
          <Show on={held || s >= i + 1} style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
            <At x={A8.MX} y={y} s={A8.T}><Tile name={icon} size={A8.T} lit={hot === i} d={i * 0.7} loop={i === 0 ? 'glint' : 'bob'} /></At>
            <TagAt x={A8.MX} y={y + A8.T / 2 + 8} text={label} w={130} />
          </Show>
          <Token cls={A8_RIDE[i * 2]} on={full} tone={i === 0 ? GOLD : colors.brand} />
          <Token cls={A8_RIDE[i * 2 + 1]} on={full} tone={i === 0 ? GOLD : colors.brand} />
        </div>
      ))}
      <Junction x={A8.B1} y={A8.CY} on={held || s >= 1} />
      <Junction x={A8.B2} y={A8.CY} on={held || s >= 1} />
      <At x={A8.DX} y={A8.CY} s={A8.DS}><Tile name="database" size={A8.DS} loop="pulse" t={3} /></At>
      <TagAt x={A8.DX} y={A8.CY + A8.DS / 2 + 8} text="Data Store" w={130} />
      {/* the cost tag hangs under the store */}
      <Wire pts={[[A8.DX, A8.CY + A8.DS / 2 + 30], [A8.DX, A8.CY + A8.DS / 2 + 50]]} on={full} lit={hot === 2} head={8} delay={0} />
      <Show on={full} lift={-10} style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
        <At x={A8.DX} y={A8.CY + A8.DS / 2 + 50 + 27} s={54}><Tile name="receipt" size={54} lit={hot === 2} loop="swing" t={3.2} /></At>
        <TagAt x={A8.DX} y={A8.CY + A8.DS / 2 + 50 + 54 + 8} text="Cost" w={80} />
      </Show>
    </Frame>
  )
}

/* ================================================================== 19 · B_T09 · a leaked key's journey */

/*
 * 526 x 330. Row A: Repository -> Attacker -> Console. The key rides straight from the Repository to the Attacker on a
 * wire labelled "Leaked key", then on to the Console. GuardDuty sits on the second wire and flags the login. Secrets
 * Manager is NOT on the key's path: it sits under the Repository as the place the key should have been stored. Row B,
 * the leak vectors under the station where each shows: public exposure under the repository, one key opening three
 * locks under the attacker, the missing MFA shield under the console. Steps: 1 the key in the code, 2 the locks,
 * 3 no MFA, 4 public exposure. Done (and held): Secrets Manager and GuardDuty (the TR note).
 */
const A9 = { W: 526, H: 330, Y: 90, X: [80, 258, 456], T: 62, BY: 258, M: 48, TY: 286, SY: 176, SM: 44 }
const A9_W1: Pt[] = [[A9.X[0] + A9.T / 2, A9.Y], [A9.X[1] - A9.T / 2, A9.Y]]
const A9_W2: Pt[] = [[A9.X[1] + A9.T / 2, A9.Y], [A9.X[2] - A9.T / 2, A9.Y]]
const A9_KEY = (A9.X[0] + A9.X[1]) / 2
const A9_GD = (A9.X[1] + A9.X[2]) / 2
const A9_RIDE_ALL = [
  K.ride('9-a', [A9_W1[0], A9_W1[1]], 0.1, 1.0, 2.6),
  K.ride('9-b', [A9_W2[0], A9_W2[1]], 1.25, 2.15, 2.6),
]

const B_T09: Fig = ({ step = 0 }) => {
  const s = step as number
  const held = useHeld()
  const hot = useHot(4, s, 1500)
  const done = held || s >= 4
  const on = (k: number) => held || s >= k
  const stations: [string, ReactNode][] = [
    ['Repository', on(1) ? <PairTile main="code" over="key" size={A9.T} lit={hot === 0} /> : <Tile name="code" size={A9.T} />],
    ['Attacker', <Tile key="l" name="laptop" size={A9.T} d={0.5} />],
    ['Console', <Tile key="c" name="webpage" size={A9.T} d={1.0} />],
  ]
  const lockX = [A9.X[1] - 40, A9.X[1], A9.X[1] + 40]
  const pubX = [A9.X[0] - 38, A9.X[0], A9.X[0] + 38]
  return (
    <Frame w={A9.W} h={A9.H}>
      <Wire pts={A9_W1} on head={10} color={on(1) ? ORANGE : colors.brand} />
      <Wire pts={A9_W2} on head={10} delay={300} />
      <TagAt x={A9_KEY} y={A9.Y - 30} text="Leaked key" w={130} size={14} on={on(1)} color={ORANGE} />
      {stations.map(([label, node], i) => (
        <div key={label}>
          <At x={A9.X[i]} y={A9.Y} s={A9.T}>{node}</At>
          <TagAt x={A9.X[i]} y={A9.Y + A9.T / 2 + 8} text={label} w={130} />
        </div>
      ))}
      {/* the key rides straight from the repository to the attacker, then on to the console */}
      {on(1) && A9_RIDE_ALL.map((c) => <Rider key={c} cls={c} size={26}><Ico3D name="key" size={26} loop="none" /></Rider>)}

      {/* 2 · reused: one key opens three locks */}
      <Show on={on(2)} style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
        {lockX.map((x, k) => (
          <At key={k} x={x} y={A9.BY} s={36}><Tile name={on(2) ? 'unlock' : 'lock'} size={36} k={0.78} lit={hot === 1} d={k * 0.3} loop="pulse" t={2.4} /></At>
        ))}
        <TagAt x={A9.X[1]} y={A9.TY} text="Reused" w={120} />
      </Show>
      {/* 3 · missing MFA: the shield is not there, only its dashed place */}
      <Show on={on(3)} style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
        <At x={A9.X[2]} y={A9.BY} s={48}>
          <span style={{ position: 'relative', width: 48, height: 48, borderRadius: 14, display: 'grid', placeItems: 'center', boxShadow: hot === 2 ? `inset 0 0 0 2.5px ${ORANGE}` : 'none', transition: `box-shadow 420ms ${EASE}` }}>
            <svg aria-hidden width={48} height={48} style={{ position: 'absolute', inset: 0 }}><rect x={2} y={2} width={44} height={44} rx={13} fill="#FFFFFF" stroke="#9AAACB" strokeWidth={1.6} strokeDasharray="5 4" /></svg>
            <span style={{ opacity: 0.4, position: 'relative' }}><Ico3D name="shield" size={34} loop="none" badge="cross" /></span>
          </span>
        </At>
        <TagAt x={A9.X[2]} y={A9.TY} text="Missing MFA" w={140} />
      </Show>
      {/* 4 · public exposure: forum, repository, log */}
      <Show on={on(4)} style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
        {(['chat', 'code', 'log'] as const).map((n, k) => (
          <At key={n} x={pubX[k]} y={A9.BY} s={36}><Tile name={n} size={36} k={0.78} lit={hot === 3} d={k * 0.4} /></At>
        ))}
        <TagAt x={A9.X[0]} y={A9.TY} text="Public" w={120} />
      </Show>

      {/* the note: Secrets Manager under the repository (where the key belongs), GuardDuty on the login wire */}
      <Show on={done} style={{ position: 'absolute', inset: 0, zIndex: 4 }}>
        <At x={A9.X[0]} y={A9.SY} s={A9.SM}><MarkTile src={secretsMark} size={A9.SM} /></At>
        <div style={{ position: 'absolute', left: A9.X[0] + A9.SM / 2 + 12, top: A9.SY - 19, width: 150, ...tag(14), whiteSpace: 'normal', textAlign: 'left', lineHeight: 1.2 }}>Store keys here instead of in code</div>
        <At x={A9_GD} y={A9.Y} s={A9.M}><MarkTile src={guarddutyMark} size={A9.M} /></At>
        <div style={{ position: 'absolute', left: A9_GD - 80, top: A9.Y - A9.M / 2 - 44, width: 160, ...tag(14), whiteSpace: 'normal', lineHeight: 1.2 }}>GuardDuty<br />(flags anomalous use)</div>
        <At x={A9.X[2] + A9.T / 2 - 4} y={A9.Y - A9.T / 2 + 4} s={28} z={5}><Ico3D name="flag" size={28} loop="swing" t={2.6} /></At>
      </Show>
    </Frame>
  )
}

/* ================================================================== 20 · B_T10 · the API's four gaps */

/*
 * 546 x 330. Client -> WAF -> API Gateway -> Database on a request lane (top, left to right) and a response lane
 * (bottom, right to left). Each gap sits under the station where it shows: 1 authentication under the gateway, 2 the
 * over-full response under the client, 3 unlimited automated requests under the WAF, 4 the malformed request under the
 * database. Done (the TR note): each gap's cross turns to a tick, the gateway and WAF marks breathe.
 */
const A10 = { W: 546, H: 330, X: [66, 204, 342, 480], Y: 86, T: 64, RQ: 74, RS: 98, BY: 232, D: 46 }
const A10_REQ = [0, 1, 2].map((i) => [[A10.X[i] + A10.T / 2, A10.RQ], [A10.X[i + 1] - A10.T / 2, A10.RQ]] as Pt[])
const A10_RES = [2, 1, 0].map((i) => [[A10.X[i + 1] - A10.T / 2, A10.RS], [A10.X[i] + A10.T / 2, A10.RS]] as Pt[])
const A10_PERIOD = 3.0
const A10_RQ_RIDE = [0, 1, 2].map((k) => K.ride(`10-q${k}`, [[A10.X[0] + A10.T / 2, A10.RQ], [A10.X[3] - A10.T / 2, A10.RQ]], 0.1 + k * 0.25, 1.3 + k * 0.25, A10_PERIOD))
const A10_RS_RIDE = K.ride('10-s', [[A10.X[3] - A10.T / 2, A10.RS], [A10.X[0] + A10.T / 2, A10.RS]], 1.5, 2.7, A10_PERIOD)

const B_T10: Fig = ({ step = 0 }) => {
  const s = step as number
  const held = useHeld()
  const hot = useHot(4, s, 1500)
  const done = held || s >= 4
  const on = (k: number) => held || s >= k
  const stations: [string, ReactNode][] = [
    ['Client', <Tile key="c" name="laptop" size={A10.T} />],
    ['WAF', <MarkTile key="w" src={wafMark} size={A10.T} />],
    ['API Gateway', <MarkTile key="g" src={apigwMark} size={A10.T} />],
    ['Database', <Tile key="d" name="database" size={A10.T} d={0.8} loop="pulse" t={3} />],
  ]
  /* [station index, icon, tag, which point] */
  const gaps: [number, string, string, number][] = [
    [2, 'user-x', 'Authentication', 1],
    [0, 'list', 'Exposure', 2],
    [1, 'gauge', 'Rate Limiting', 3],
    [3, 'alert', 'Validation', 4],
  ]
  return (
    <Frame w={A10.W} h={A10.H}>
      {A10_REQ.map((p, i) => <Wire key={'q' + i} pts={p} on head={9} delay={i * 200} />)}
      {A10_RES.map((p, i) => <Wire key={'s' + i} pts={p} on head={9} delay={300 + i * 200} color="#7FA0F5" />)}
      {stations.map(([label, node], i) => (
        <div key={label}>
          <At x={A10.X[i]} y={A10.Y} s={A10.T}>{node}</At>
          <TagAt x={A10.X[i]} y={A10.Y + A10.T / 2 + 8} text={label} w={130} />
        </div>
      ))}
      {/* requests go right, responses come back left; 3 makes the request stream dense, 2 makes the response fat */}
      {A10_RQ_RIDE.map((c, k) => <Token key={c} cls={c} on={k === 0 || on(3)} size={9} />)}
      <Token cls={A10_RS_RIDE} on size={on(2) ? 16 : 9} tone="#5C82F2" square={on(2)} />
      {gaps.map(([si, icon, label, k]) => (
        <Show key={label} on={on(k)} style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
          <At x={A10.X[si]} y={A10.BY} s={A10.D + 6}><Tile name={icon} size={A10.D + 6} k={0.72} lit={hot === k - 1} badge={done ? 'check' : 'cross'} d={k * 0.4} /></At>
          <TagAt x={A10.X[si]} y={A10.BY + (A10.D + 6) / 2 + 8} text={label} w={134} />
        </Show>
      ))}
    </Frame>
  )
}

/* ================================================================== 22 · B_T11B · cost rises with time to detect */

/*
 * 1080 x 340, under a one-sentence lead (the note moved here from slide 21). Cost on the y axis, Time to Detect on the x axis; four stacked bars rise left to right, each
 * adding the TR's next cost category on top, tagged above its bar with its icon (the breach timeline of the table).
 * Security Hub and CloudTrail sit at the short-detection end. Steps 1-4: one bar each. Loop: the lit bar walks, the
 * marks' halos breathe, a dot runs the time axis.
 */
const A11 = { W: 1080, H: 340, OX: 140, OY: 280, TOP: 40, END: 1020, BW: 116, SEG: 44, BX: [410, 590, 770, 950] }
const A11_CATS: [string, string][] = [
  ['Detection & Containment', 'search'],
  ['Legal & Regulatory', 'gavel'],
  ['Notification', 'mail'],
  ['Business Impact', 'users'],
]
const A11_SEG = ['#B9CCFF', '#86A6F7', '#4F7CF8', '#2D63FB']
const A11_TIME = K.ride('11-t', [[A11.OX + 8, A11.OY], [A11.END - 16, A11.OY]], 0.1, 3.0, 3.2)

const B_T11B: Fig = ({ step = 0 }) => {
  const s = step as number
  const held = useHeld()
  const instant = useInstant()
  const hot = useHot(4, s, 1500)
  const on = (k: number) => held || s >= k
  return (
    <Frame w={A11.W} h={A11.H}>
      {/* axes */}
      <Wire pts={[[A11.OX, A11.OY], [A11.OX, A11.TOP]]} on head={11} color={colors.brandDeep} width={2.4} />
      <Wire pts={[[A11.OX, A11.OY], [A11.END, A11.OY]]} on head={11} color={colors.brandDeep} width={2.4} delay={200} />
      <div style={{ position: 'absolute', left: A11.OX - 100, top: A11.TOP - 4, width: 84, ...tag(17), textAlign: 'right' }}>Cost</div>
      <div style={{ position: 'absolute', left: A11.END - 190, top: A11.OY + 16, width: 190, ...tag(17), textAlign: 'right' }}>Time to Detect</div>
      <Token cls={A11_TIME} on size={10} />

      {/* the short-detection end: continuous monitoring and investigation */}
      <At x={240} y={120} s={58}><MarkTile src={hubMark} size={58} /></At>
      <TagAt x={240} y={120 + 29 + 8} text="Security Hub" w={140} />
      <At x={240} y={214} s={58}><MarkTile src={trailMark} size={58} /></At>
      <TagAt x={240} y={214 + 29 + 8} text="CloudTrail" w={140} />

      {A11.BX.map((x, b) => {
        const h = (b + 1) * A11.SEG
        const top = A11.OY - 3 - h /* bars stand on the axis line, clear of it */
        const lit = hot === b
        return (
          <div key={b}>
            <div
              style={{
                position: 'absolute', left: x - A11.BW / 2, top, width: A11.BW, height: h, zIndex: 2, transformOrigin: '50% 100%',
                transform: on(b + 1) ? 'scaleY(1)' : 'scaleY(0.02)', opacity: on(b + 1) ? 1 : 0,
                transition: instant ? 'none' : `transform 860ms ${EASE}, opacity 320ms ${EASE}`,
                borderRadius: '12px 12px 4px 4px', overflow: 'hidden', display: 'flex', flexDirection: 'column-reverse',
                boxShadow: lit ? `0 0 0 3px ${ORANGE}, 0 14px 26px -14px rgba(31,64,140,0.55)` : '0 14px 26px -14px rgba(31,64,140,0.55)',
              }}
            >
              {Array.from({ length: b + 1 }, (_, k) => (
                <div key={k} style={{ height: A11.SEG, flexShrink: 0, background: `linear-gradient(90deg, ${A11_SEG[k]} 0%, ${A11_SEG[k]}DD 70%, ${A11_SEG[k]}AA 100%)`, borderTop: k < b ? '2px solid #FFFFFF' : 'none', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 8, right: 8, top: 5, height: 10, borderRadius: 6, background: 'linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0))' }} />
                </div>
              ))}
            </div>
            {/* the category this bar adds, tagged on top of it */}
            <Show on={on(b + 1)} delay={400} style={{ position: 'absolute', left: x - 90, width: 180, bottom: A11.H - top + 10, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <Tile name={A11_CATS[b][1]} size={50} lit={lit} d={b * 0.5} />
              <span style={{ ...tag(15), whiteSpace: 'normal' }}>{A11_CATS[b][0]}</span>
            </Show>
          </div>
        )
      })}
    </Frame>
  )
}

/* ================================================================== 24 · B_T12 · three common mistakes */

/*
 * 566 x 330. Three cards, PAD on every side and between: each a small scene, top icon wired down into the main one:
 * Internet -> open bucket (Public Bucket), Internet -> wide-open gate (Open Rule), vendor -> padlock with the factory
 * key still in it (Default Key). Step N shows card N; the lit card then walks 1 -> 3; dots ride each card's wire.
 */
const A12 = { W: 566, H: 330, PAD: 20, CW: 162, TY: 96, MY: 200, TS: 56, MS: 96 }
const A12_X = [0, 1, 2].map((i) => A12.PAD + i * (A12.CW + A12.PAD))
const A12_WIRE = (i: number): Pt[] => [[A12_X[i] + A12.CW / 2, A12.TY + A12.TS / 2 + 4], [A12_X[i] + A12.CW / 2, A12.MY - A12.MS / 2]]
const A12_RIDE = [0, 1, 2].map((i) => K.ride(`12-${i}`, A12_WIRE(i), 0.1 + i * 0.5, 0.9 + i * 0.5, 2.4))

const B_T12: Fig = ({ step = 0 }) => {
  const s = step as number
  const held = useHeld()
  const hot = useHot(3, s, 1600)
  const cards: [string, string, ReactNode][] = [
    ['Public Bucket', 'globe', <Tile key="b" name="bucket" size={A12.MS} loop="float" />],
    ['Open Rule', 'globe', <Tile key="g" name="gate" size={A12.MS} d={0.6} />],
    ['Default Key', 'building', <PairTile key="k" main="lock" over="key" size={A12.MS} d={1.1} />],
  ]
  return (
    <Frame w={A12.W} h={A12.H}>
      {cards.map(([label, top, main], i) => {
        const on = held || s >= i + 1
        const cx = A12_X[i] + A12.CW / 2
        return (
          <div key={label}>
            <Panel x={A12_X[i]} y={A12.PAD} w={A12.CW} h={A12.H - A12.PAD * 2} on={on} lit={hot === i} />
            <Show on={on} delay={150} style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
              <At x={cx} y={A12.TY} s={A12.TS}>{top === 'globe' ? <GlowGlobe size={A12.TS} d={i * 0.7} /> : <Tile name={top} size={A12.TS} k={0.76} />}</At>
              <At x={cx} y={A12.MY} s={A12.MS}>{main}</At>
              <TagAt x={cx} y={A12.MY + A12.MS / 2 + 12} text={label} w={A12.CW - 24} size={16} />
            </Show>
            <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}><Wire pts={A12_WIRE(i)} on={on} head={9} delay={350} /></div>
            <Token cls={A12_RIDE[i]} on={held || s >= 3} size={9} />
          </div>
        )
      })}
    </Frame>
  )
}

/* ================================================================== 25 · B_T13 · a public bucket */

/*
 * 486 x 330. Row A: Internet -> Bucket (official S3 bucket mark), its policy document beside it with the TR's
 * "Principal": "*" line. Row B: the automated scanners under the internet, the two Block Public Access switches
 * (bucket, account) under the bucket and the policy. Steps: 1 the policy line lights; 2 both switches turn off;
 * 3 objects list out and download to the internet on the lower lane; 4 the scanners find the bucket.
 */
const A13 = { W: 486, H: 330, GX: 56, BX: 210, Y: 90, GT: 60, BT: 72, PX: 282, PW: 184, PY: 40, PH: 100, IN: 79, OUT: 101, RY: 232, TX: [210, 374], TA: 134, TB: 266 }
const A13_IN: Pt[] = [[A13.GX + A13.GT / 2, A13.IN], [A13.BX - A13.BT / 2, A13.IN]]
const A13_OUT: Pt[] = [[A13.BX - A13.BT / 2, A13.OUT], [A13.GX + A13.GT / 2, A13.OUT]]
const A13_RIN = K.ride('13-in', A13_IN, 0.1, 1.0, 2.4)
const A13_ROUT = [0, 1].map((k) => K.ride(`13-out${k}`, A13_OUT, 1.1 + k * 0.45, 2.0 + k * 0.45, 2.4))

function Switch({ off, lit }: { off: boolean; lit: boolean }) {
  const instant = useInstant()
  const tr = instant ? 'none' : `transform 620ms ${EASE}, opacity 420ms ${EASE}, box-shadow 420ms ${EASE}`
  return (
    <span style={{ position: 'relative', display: 'block', width: 64, height: 34, borderRadius: 99, background: '#C9D2E3', boxShadow: lit ? `0 0 0 2.5px ${ORANGE}, inset 0 2px 4px rgba(0,37,75,0.18)` : 'inset 0 2px 4px rgba(0,37,75,0.18), 0 8px 16px -10px rgba(31,64,140,0.5)', transition: tr }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: 99, background: `linear-gradient(180deg, #5C86FF, ${colors.brand})`, opacity: off ? 0 : 1, transition: tr }} />
      <span style={{ position: 'absolute', top: 4, left: 4, width: 26, height: 26, borderRadius: 99, background: 'radial-gradient(circle at 35% 30%, #FFFFFF, #E4EAF6)', boxShadow: '0 3px 6px rgba(0,37,75,0.3)', transform: off ? 'translateX(0)' : 'translateX(30px)', transition: tr }} />
    </span>
  )
}

const B_T13: Fig = ({ step = 0 }) => {
  const s = step as number
  const held = useHeld()
  const instant = useInstant()
  const hot = useHot(4, s, 1500)
  const on = (k: number) => held || s >= k
  return (
    <Frame w={A13.W} h={A13.H}>
      <Wire pts={A13_IN} on head={9} />
      <Wire pts={A13_OUT} on={on(3)} lit={hot === 2} head={9} />
      <At x={A13.GX} y={A13.Y} s={A13.GT}><GlowGlobe size={A13.GT} /></At>
      <TagAt x={A13.GX} y={A13.TA} text="Internet" w={100} />
      <At x={A13.BX} y={A13.Y} s={A13.BT}><MarkTile src={bucketMark} size={A13.BT} /></At>
      <TagAt x={A13.BX} y={A13.TA} text="Bucket" w={100} />
      <Token cls={A13_RIN} on size={9} />
      {A13_ROUT.map((c) => (
        <Rider key={c} cls={c} on={on(3)} size={22}><img src={objectMark} alt="" aria-hidden style={{ width: 22, height: 22, display: 'block', background: '#FFFFFF', borderRadius: 6, boxShadow: '0 3px 8px -4px rgba(31,64,140,0.6)' }} /></Rider>
      ))}
      {/* the bucket policy, attached to the bucket */}
      <Wire pts={[[A13.BX + A13.BT / 2, A13.Y], [A13.PX, A13.Y]]} on head={0} color="#9DB8FF" />
      <Panel x={A13.PX} y={A13.PY} w={A13.PW} h={A13.PH} lit={hot === 0}>
        <div style={{ position: 'absolute', inset: 0, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 10 }}>
          <Ico3D name="policy" size={34} loop="float" />
          <span
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontVariantLigatures: 'none', fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', padding: '3px 7px', borderRadius: 7,
              color: on(1) ? colors.brandDark : colors.ink, background: on(1) ? '#EAF0FF' : 'transparent', transition: instant ? 'none' : `background 420ms ${EASE}, color 420ms ${EASE}`,
            }}
          >
            {'"Principal": "*"'}
          </span>
        </div>
      </Panel>
      {/* 2 · Block Public Access turned off, for the bucket and the account */}
      {A13.TX.map((x, k) => (
        <div key={x}>
          <At x={x} y={A13.RY} s={64}><Switch off={on(2)} lit={hot === 1} /></At>
          <TagAt x={x} y={A13.TB} text={k === 0 ? 'Bucket' : 'Account'} w={110} />
        </div>
      ))}
      <TagAt x={(A13.TX[0] + A13.TX[1]) / 2} y={A13.RY - 58} text="S3 Block Public Access: OFF" w={300} size={15} on={on(2)} />
      {/* 4 · automated scanners find it within minutes */}
      <Show on={on(4)} style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
        <At x={A13.GX} y={A13.RY} s={52}><PairTile main="radar" over="clock" size={52} lit={hot === 3} loop="tilt" /></At>
        <TagAt x={A13.GX} y={A13.TB} text="Scanners" w={100} />
      </Show>
      <Show on={on(4)} style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
        {!held && <span aria-hidden className={loopCls('ripple')} style={{ position: 'absolute', left: A13.GX - 34, top: A13.RY - 34, width: 68, height: 68, borderRadius: 99, border: `2px solid ${colors.brand}55`, ...loopVars(0, 2.4) }} />}
      </Show>
    </Frame>
  )
}

void body

export const figures: Record<string, Fig> = { B_T08, B_T09, B_T10, B_T11B, B_T12, B_T13 }
export const css = K.css() + GLOW_CSS
