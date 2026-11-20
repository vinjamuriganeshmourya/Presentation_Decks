import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Badge } from '@/engine/icons3d'
import { EASE, ORANGE, Frame, Plinth, MarkTile, Panel, Wire, Junction, Show, Token, useHeld, useCycle, keyframes, loopCls, loopVars, tag, heading } from '@/engine/figkit'
import elbMark from '../images/aws-elastic-load-balancing.svg'
import ec2Mark from '../images/res-ec2-instance.svg'
import rdsMark from '../images/res-rds-instance.svg'
import s3Mark from '../images/res-s3-bucket.svg'
import wafMark from '../images/aws-waf.svg'
import roleMark from '../images/res-iam-role.svg'
import kmsMark from '../images/aws-kms.svg'
import trailMark from '../images/aws-cloudtrail.svg'
import flowMark from '../images/res-vpc-flow-logs.svg'
import hubMark from '../images/aws-security-hub.svg'
import inspMark from '../images/aws-inspector.svg'
import ecrMark from '../images/res-ecr-image.svg'
import lambdaMark from '../images/res-lambda-function.svg'
import configMark from '../images/aws-config.svg'

/*
 * SESSION 17 · SECTIONS 1-2 (Defense in Depth in Practice, Configuration Hygiene) technical figures, builder A.
 * Generate-slides standing correction 17: 3D icons on plinth tiles, official marks on white tiles, >= 20 px equal
 * padding, orthogonal wires from the same constants as the boxes, a flow dot on every wire, a lit item walking
 * first -> last -> first after the build. Loops: transform / opacity on HTML elements or root svgs only. Held (?still):
 * the slide's full end state, nothing lit, nothing moving. Class prefix `t17a-`.
 *
 *   slides 6, 7    A_T01   546 x 330  the deployment and its five layer controls (part 1: 3 steps, part 2: 2)
 *   slides 9, 10   A_T02B  526 x 330  a stolen EC2 credential contained (part 1: 2 steps, part 2: 1)
 *   slide 12       A_T03   546 x 330  the four hygiene practices as a loop (4)
 *   slides 13, 14  A_T04   546 x 330  the hardened-baseline checklist (2 + 2)
 *   slides 16, 17  A_T05   546 x 330  the CSPM dashboard (2 + 2)
 *   slides 19, 20  A_T06   526 x 330  the scanning pipeline (2 + 3)
 *
 * `part` 2 draws part 1's items as already shown, then builds its own.
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('t17a')
const BLUE = colors.brand
const MUTED = colors.muted
const GREEN = colors.success

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)
const partOf = (p: Record<string, unknown>) => Number(p.part ?? 1)
const tr = (instant: boolean, what = 'opacity', ms = 520) => (instant ? 'none' : `${what} ${ms}ms ${EASE}`)

/**
 * The lit item of a split figure: `base` items were built by the earlier part, this part builds `steps` more.
 * While building, the item of the current press; once built, a walk over every item shown; -1 when held.
 */
function useSplitHot(base: number, steps: number, step: number, period = 1700) {
  const held = useHeld()
  const cyc = useCycle(base + steps, step >= steps, period)
  if (held) return -1
  if (step < steps) return step > 0 ? base + step - 1 : -1
  return cyc
}

/** an absolutely placed tile + tag group whose TILE centre is (x, y) */
function Node({ x, y, size, label, children, w = 130, on = true, delay = 0, tagSize = 14, lit = false, z = 3, tagColor }: { x: number; y: number; size: number; label?: string; children: ReactNode; w?: number; on?: boolean; delay?: number; tagSize?: number; lit?: boolean; z?: number; tagColor?: string }) {
  const instant = useInstant()
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, top: y - size / 2, width: w, zIndex: z, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: size, height: size, display: 'grid', placeItems: 'center', position: 'relative' }}>{children}</div>
      {label && <span style={{ ...tag(tagSize, lit ? ORANGE : tagColor), marginTop: 6, transition: tr(instant, 'color', 420) }}>{label}</span>}
    </Show>
  )
}

/** a small round white badge on a tile's corner, holding a 3D icon or an official mark */
function Corner({ name, src, size = 22, on = true, d = 0, pos = 'br', loop = 'pulse' }: { name?: Ico3DName; src?: string; size?: number; on?: boolean; d?: number; pos?: 'br' | 'tr' | 'tl' | 'bl'; loop?: 'pulse' | 'bob' | 'beat' }) {
  const instant = useInstant()
  const o = -size * 0.32
  const place: CSSProperties = { ...(pos[0] === 't' ? { top: o } : { bottom: o }), ...(pos[1] === 'l' ? { left: o } : { right: o }) }
  return (
    <span style={{ position: 'absolute', ...place, width: size + 6, height: size + 6, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6)', display: 'grid', placeItems: 'center', opacity: on ? 1 : 0, transform: on ? 'none' : 'scale(0.7)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 420ms ${EASE}`, zIndex: 4 }}>
      {src ? <img src={src} alt="" aria-hidden draggable={false} style={{ width: size - 2, height: size - 2, display: 'block' }} /> : <Ico3D name={name!} size={size} loop={loop} d={d} t={2.4} />}
    </span>
  )
}

/** two icons in one place, crossfading on `alt` */
function Swap({ a, b, alt, size, d = 0, badgeA, badgeB }: { a: Ico3DName; b: Ico3DName; alt: boolean; size: number; d?: number; badgeA?: Badge; badgeB?: Badge }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: size, height: size }}>
      <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: alt ? 0 : 1, transition: tr(instant) }}><Ico3D name={a} size={size} loop="bob" d={d} badge={badgeA} /></span>
      <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: alt ? 1 : 0, transition: tr(instant) }}><Ico3D name={b} size={size} loop="bob" d={d} badge={badgeB} /></span>
    </span>
  )
}

/** a dashed vertical tie between a marker and the control it names */
function Tie({ x, y0, y1, on, lit }: { x: number; y0: number; y1: number; on: boolean; lit: boolean }) {
  return <Wire pts={[[x, y0], [x, y1]]} on={on} head={0} dash="4 5" width={2} color={lit ? ORANGE : '#9DB4E8'} />
}

/* ================================================================== slides 6, 7 · A_T01 · five layers on one deployment */

/*
 * 546 x 330. The deployment runs along y 165: Users -> Load Balancer -> EC2 -> RDS, EC2 also reading S3 below RDS
 * (a junction at x 318). The five layer markers (the points' own 3D icons) stand over or under the control they name,
 * each tied to it by a short dashed line: Network (bottom) -> the security-group ring round the load balancer and EC2;
 * Identity -> the IAM role on EC2; Data -> locks on RDS and S3; Application -> the WAF in front of the load balancer;
 * Monitoring -> CloudTrail with VPC Flow Logs. Part 1 builds Network, Identity, Data; part 2 Application, Monitoring.
 */
const L1 = { W: 546, H: 330, Y: 165, T: 54, UX: 40, LB: 145, EC: 255, RD: 375, MON: 486, JX: 318, S3Y: 262, MY: 50, NX: 200, NY: 262 }
const RING = { x0: 80, x1: 294, y0: 126, y1: 218 }
type Layer = { name: string; icon: Ico3DName; x: number; y: number }
const LAYERS: Layer[] = [
  { name: 'Network', icon: 'firewall', x: L1.NX, y: L1.NY },
  { name: 'Identity', icon: 'idcard', x: L1.EC, y: L1.MY },
  { name: 'Data', icon: 'lock', x: L1.RD, y: L1.MY },
  { name: 'Application', icon: 'webpage', x: L1.LB, y: L1.MY },
  { name: 'Monitoring', icon: 'eye', x: L1.MON, y: L1.MY },
]
const T01_REQ = [
  K.ride('t1a', [[L1.UX + 24, L1.Y], [L1.LB - 27, L1.Y]], 0.0, 0.45, 2.6),
  K.ride('t1b', [[L1.LB + 27, L1.Y], [L1.EC - 27, L1.Y]], 0.6, 1.05, 2.6),
  K.ride('t1c', [[L1.EC + 27, L1.Y], [L1.RD - 27, L1.Y]], 1.2, 1.65, 2.6),
  K.ride('t1d', [[L1.EC + 27, L1.Y], [L1.JX, L1.Y], [L1.JX, L1.S3Y], [L1.RD - 25, L1.S3Y]], 1.2, 1.95, 2.6),
]

const A_T01: Fig = (p) => {
  const step = stepOf(p)
  const part = partOf(p)
  const held = useHeld()
  const instant = useInstant()
  const base = part === 1 ? 0 : 3
  const steps = part === 1 ? 3 : 2
  const built = held ? base + steps : base + Math.min(step, steps)
  const hot = useSplitHot(base, steps, step, 1700)
  const on = (k: number) => k < built
  const lit = (k: number) => hot === k
  const ringC = lit(0) ? ORANGE : '#8FA8E0'
  return (
    <Frame w={L1.W} h={L1.H}>
      {/* the security-group ring (Network) round the load balancer and EC2 */}
      <svg aria-hidden width={L1.W} height={L1.H} style={{ position: 'absolute', inset: 0, overflow: 'visible', zIndex: 1, opacity: on(0) ? 1 : 0, transition: tr(instant) }}>
        <rect x={RING.x0} y={RING.y0} width={RING.x1 - RING.x0} height={RING.y1 - RING.y0} rx={18} fill={lit(0) ? 'rgba(255,138,61,0.06)' : 'rgba(45,99,251,0.04)'} stroke={ringC} strokeWidth={2} strokeDasharray="7 6" style={{ transition: tr(instant, 'stroke', 420) }} />
      </svg>

      {/* the deployment's wires */}
      <Wire pts={[[L1.UX + 24, L1.Y], [L1.LB - 27, L1.Y]]} />
      <Wire pts={[[L1.LB + 27, L1.Y], [L1.EC - 27, L1.Y]]} />
      <Wire pts={[[L1.EC + 27, L1.Y], [L1.RD - 27, L1.Y]]} />
      <Wire pts={[[L1.JX, L1.Y], [L1.JX, L1.S3Y], [L1.RD - 25, L1.S3Y]]} />
      <Junction x={L1.JX} y={L1.Y} />

      {/* the deployment */}
      <Node x={L1.UX} y={L1.Y} size={48} label="Users" w={80}><Plinth size={48}><Ico3D name="users" size={36} loop="bob" /></Plinth></Node>
      <Node x={L1.LB} y={L1.Y} size={L1.T} label="Load Balancer" w={120}>
        <MarkTile src={elbMark} size={L1.T} lit={lit(3)} />
        <Corner src={wafMark} on={on(3)} pos="tl" />
      </Node>
      <Node x={L1.EC} y={L1.Y} size={L1.T} label="EC2" w={90}>
        <MarkTile src={ec2Mark} size={L1.T} lit={lit(1)} />
        <Corner src={roleMark} on={on(1)} pos="tr" />
      </Node>
      <Node x={L1.RD} y={L1.Y} size={L1.T} label="RDS" w={90}>
        <MarkTile src={rdsMark} size={L1.T} lit={lit(2)} />
        <Corner name="lock" on={on(2)} pos="tr" />
      </Node>
      <Node x={L1.RD} y={L1.S3Y} size={50} label="S3" w={90}>
        <MarkTile src={s3Mark} size={50} lit={lit(2)} />
        <Corner name="lock" on={on(2)} pos="tr" d={0.5} />
      </Node>
      <Node x={L1.MON} y={L1.Y} size={L1.T} label="CloudTrail" w={100} on={on(4)}>
        <MarkTile src={trailMark} size={L1.T} lit={lit(4)} />
        <Corner src={flowMark} on={on(4)} pos="br" />
      </Node>

      {/* the five layer markers, tied to their controls */}
      {LAYERS.map((l, k) => {
        const top = l.y < L1.Y
        return (
          <div key={l.name}>
            {top ? <Tie x={l.x} y0={l.y + 50} y1={L1.Y - L1.T / 2 - 4} on={on(k)} lit={lit(k)} /> : <Tie x={l.x} y0={RING.y1 + 2} y1={l.y - 25} on={on(k)} lit={lit(k)} />}
            <Node x={l.x} y={l.y} size={46} label={l.name} w={110} on={on(k)} lit={lit(k)} z={4}>
              <Plinth size={46} lit={lit(k)}><Ico3D name={l.icon} size={36} loop="bob" d={k * 0.45} /></Plinth>
            </Node>
          </div>
        )
      })}

      {T01_REQ.map((c, i) => <Token key={i} cls={c} />)}
    </Frame>
  )
}

/* ================================================================== slides 9, 10 · A_T02B · a stolen credential contained */

/*
 * 526 x 330. A stolen key (masked attacker) passes the Identity check at the EC2 role (orange cross on the role: the
 * layer that fell). From the role a bus at x 248 fans to three rows: S3 (y 60), RDS (y 160), unrelated resources
 * (y 260). Press 1: the scoped role reaches only its bucket and database; the unrelated row is blocked (orange, ban).
 * Press 2: data layer holds: S3 objects need the KMS key (`kms:Decrypt`), RDS reads transparently but a snapshot copy
 * still needs the key. Part 2: CloudTrail (under the attacker) and VPC Flow Logs (under EC2) record it and flag it.
 */
const L2 = { W: 526, H: 330, Y: 160, AX: 52, EX: 180, BUS: 250, CA: 322, CB: 452, R: [60, 160, 260], MY: 262 }
const T02_IN = K.ride('t2in', [[L2.AX + 27, L2.Y], [L2.EX - 27, L2.Y]], 0, 0.5, 2.8)
const T02_OUT = [0, 1].map((r) => K.ride(`t2o${r}`, [[L2.EX + 27, L2.Y], [L2.BUS, L2.Y], [L2.BUS, L2.R[r]], [L2.CA - 26, L2.R[r]]], 0.6, 1.3, 2.8))
const T02_KEY = [0, 1].map((r) => K.ride(`t2k${r}`, [[L2.CA + 26, L2.R[r]], [L2.CB - 26, L2.R[r]]], 1.45, 1.9, 2.8))
const T02_LOG = [L2.AX, L2.EX].map((x, i) => K.ride(`t2l${i}`, [[x, L2.Y + 52], [x, L2.MY - 24]], 0.3 + i * 0.4, 0.9 + i * 0.4, 2.4))

const A_T02B: Fig = (p) => {
  const step = stepOf(p)
  const part = partOf(p)
  const held = useHeld()
  const base = part === 1 ? 0 : 2
  const steps = part === 1 ? 2 : 1
  const built = held ? base + steps : base + Math.min(step, steps)
  const hot = useSplitHot(base, steps, step, 1900)
  const s1 = built >= 1
  const s2 = built >= 2
  const s3 = built >= 3
  const lit = (k: number) => hot === k
  return (
    <Frame w={L2.W} h={L2.H}>
      <Wire pts={[[L2.AX + 27, L2.Y], [L2.EX - 27, L2.Y]]} color={ORANGE} />
      <Wire pts={[[L2.EX + 27, L2.Y], [L2.BUS, L2.Y], [L2.BUS, L2.R[0]], [L2.CA - 26, L2.R[0]]]} on={s1} lit={lit(0)} />
      <Wire pts={[[L2.BUS, L2.Y], [L2.CA - 26, L2.Y]]} on={s1} lit={lit(0)} />
      <Wire pts={[[L2.BUS, L2.Y], [L2.BUS, L2.R[2]], [L2.CA - 26, L2.R[2]]]} on={s1} dash="6 6" color={ORANGE} head={0} />
      <Junction x={L2.BUS} y={L2.Y} on={s1} />
      <Wire pts={[[L2.CA + 26, L2.R[0]], [L2.CB - 26, L2.R[0]]]} on={s2} lit={lit(1)} />
      <Wire pts={[[L2.CA + 26, L2.R[1]], [L2.CB - 26, L2.R[1]]]} on={s2} lit={lit(1)} />

      {/* the stolen key, and the identity layer it passed */}
      <Node x={L2.AX} y={L2.Y} size={54} label="Stolen Key" w={110}>
        <Plinth size={54} warm><Ico3D name="mask" size={40} loop="bob" /></Plinth>
        <Corner name="key" pos="br" loop="beat" />
      </Node>
      <Node x={L2.EX} y={L2.Y} size={54} label="EC2 Role" w={110}>
        <MarkTile src={ec2Mark} size={54} lit={lit(0)} />
        <Corner src={roleMark} pos="tl" />
        <Corner name="cross" pos="tr" loop="beat" />
      </Node>

      {/* what the scoped role can reach */}
      <Node x={L2.CA} y={L2.R[0]} size={52} label="One Bucket" w={110} on={s1}>
        <MarkTile src={s3Mark} size={52} lit={lit(0)} />
        <Corner name="lock" on={s2} pos="tr" />
      </Node>
      <Node x={L2.CA} y={L2.R[1]} size={52} label="RDS" w={110} on={s1}>
        <MarkTile src={rdsMark} size={52} lit={lit(0)} />
        <Corner name="check" on={s2} pos="tr" />
      </Node>
      <Node x={L2.CA} y={L2.R[2]} size={50} label="Unrelated" w={110} on={s1}>
        <Plinth size={50} warm><span style={{ display: 'grid', opacity: 0.55 }}><Ico3D name="server" size={36} loop="none" /></span></Plinth>
        <Corner name="ban" pos="tr" loop="beat" />
      </Node>

      {/* the data layer still holds */}
      <Node x={L2.CB} y={L2.R[0]} size={52} label="KMS Key" w={110} on={s2}>
        <MarkTile src={kmsMark} size={52} lit={lit(1)} />
        <Corner name="key" pos="tr" />
      </Node>
      <Node x={L2.CB} y={L2.R[1]} size={52} label="Snapshot" w={110} on={s2}>
        <Plinth size={52} lit={lit(1)}><Ico3D name="snapshot" size={38} loop="bob" d={0.4} /></Plinth>
        <Corner name="lock" pos="tr" d={0.3} />
      </Node>

      {/* monitoring: part 2 */}
      <Tie x={L2.AX} y0={L2.Y + 52} y1={L2.MY - 26} on={s3} lit={lit(2)} />
      <Tie x={L2.EX} y0={L2.Y + 52} y1={L2.MY - 26} on={s3} lit={lit(2)} />
      <Node x={L2.AX} y={L2.MY} size={46} label="CloudTrail" w={110} on={s3} tagSize={13}>
        <MarkTile src={trailMark} size={46} lit={lit(2)} />
        <Corner name="eye" on={s3} pos="tr" />
      </Node>
      <Node x={L2.EX} y={L2.MY} size={46} label="Flow Logs" w={110} on={s3} tagSize={13}>
        <MarkTile src={flowMark} size={46} lit={lit(2)} />
        <Corner name="alert" on={s3} pos="tr" loop="beat" d={0.4} />
      </Node>

      <Token cls={T02_IN} tone={ORANGE} />
      {T02_OUT.map((c, i) => <Token key={i} cls={c} tone={ORANGE} on={s1} />)}
      {T02_KEY.map((c, i) => <Token key={i} cls={c} tone={ORANGE} on={s2} size={9} />)}
      {T02_LOG.map((c, i) => <Token key={i} cls={c} on={s3} size={8} square />)}
    </Frame>
  )
}

/* ================================================================== slide 12 · A_T03 · the four practices as a loop */

/*
 * 546 x 330. Four cards (210 x 120) in a clockwise loop: Baseline (top left) -> Defaults (top right) -> CSPM (bottom
 * right) -> Scanning (bottom left) -> back to Baseline. Cards at x 20 / 316, y 20 / 190; wires through the 86 px and
 * 50 px gaps, from each card's edge midpoint to the next. A refresh icon turns in the centre; one dot walks the loop.
 */
const L3 = { W: 546, H: 330, CW: 210, CH: 120, X: [20, 316], Y: [20, 190] }
const T03_CARDS: { name: string; icon: Ico3DName; over?: Ico3DName; col: number; row: number }[] = [
  { name: 'Baseline', icon: 'shield', over: 'wrench', col: 0, row: 0 },
  { name: 'Defaults', icon: 'toggle', col: 1, row: 0 },
  { name: 'CSPM', icon: 'radar', col: 1, row: 1 },
  { name: 'Scanning', icon: 'scan', col: 0, row: 1 },
]
const mx = (c: number) => L3.X[c] + L3.CW / 2
const my = (r: number) => L3.Y[r] + L3.CH / 2
const T03_W: [number, number][][] = [
  [[L3.X[0] + L3.CW, my(0)], [L3.X[1], my(0)]],
  [[mx(1), L3.Y[0] + L3.CH], [mx(1), L3.Y[1]]],
  [[L3.X[1], my(1)], [L3.X[0] + L3.CW, my(1)]],
  [[mx(0), L3.Y[1]], [mx(0), L3.Y[0] + L3.CH]],
]
const T03_DOT = T03_W.map((w, i) => K.ride(`t3w${i}`, w, i * 1.2, i * 1.2 + 0.7, 4.8))

const A_T03: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const hot = useSplitHot(0, 4, step, 1600)
  return (
    <Frame w={L3.W} h={L3.H}>
      {T03_W.map((w, i) => <Wire key={i} pts={w} on={held || step >= i + 1} lit={hot === i} />)}
      <div style={{ position: 'absolute', left: L3.W / 2 - 22, top: L3.H / 2 - 22, width: 44, height: 44, display: 'grid', placeItems: 'center', zIndex: 2 }}>
        <Ico3D name="refresh" size={40} loop="spin" t={9} />
      </div>
      {T03_CARDS.map((c, k) => {
        const reached = held || step === 0 || step >= k + 1
        return (
          <Panel key={c.name} x={L3.X[c.col]} y={L3.Y[c.row]} w={L3.CW} h={L3.CH} lit={hot === k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: reached ? 1 : 0.4, transition: `opacity 520ms ${EASE}` }}>
            <Plinth size={58} lit={hot === k}>
              {c.over ? (
                <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 44, height: 44 }}>
                  <Ico3D name={c.icon} size={44} loop="bob" d={k * 0.5} />
                  <span style={{ position: 'absolute', right: -8, bottom: -6 }}><Ico3D name={c.over} size={24} loop="tilt" d={k * 0.5} /></span>
                </span>
              ) : (
                <Ico3D name={c.icon} size={44} loop={c.icon === 'radar' ? 'pulse' : 'bob'} d={k * 0.5} />
              )}
            </Plinth>
            <span style={heading(18, hot === k ? ORANGE : colors.ink)}>{c.name}</span>
          </Panel>
        )
      })}
      {T03_DOT.map((c, i) => <Token key={i} cls={c} on={step >= 4} />)}
    </Frame>
  )
}

/* ================================================================== slides 13, 14 · A_T04 · the hardened-baseline checklist */

/*
 * 546 x 330. One checklist board (x 20..526, y 20..310, 20 px inner padding): a header (checklist icon, `Hardened
 * Baseline`, a shield that lights once all four are ticked), then four rows 46 tall, 8 apart, from y 82. Each row shows
 * the thing hardened (its icon swaps to the safe state) and a tick that pops in on its press. Part 1 ticks rows 1-2,
 * part 2 rows 3-4, then the four ticks glow together.
 */
const L4 = { W: 546, H: 330, X0: 20, X1: 526, Y0: 20, Y1: 310, RY: 82, RH: 46, RG: 8 }
const T04_ROWS: { label: string; a: Ico3DName; b: Ico3DName; ba?: Badge; bb?: Badge }[] = [
  { label: 'Ports Closed', a: 'door', b: 'door', bb: 'lock' },
  { label: 'Default Accounts Removed', a: 'user', b: 'user-x' },
  { label: 'Golden Image Chosen', a: 'image', b: 'image', bb: 'star' },
  { label: 'Public Access Blocked', a: 'bucket', b: 'bucket', bb: 'lock' },
]

const A_T04: Fig = (p) => {
  const step = stepOf(p)
  const part = partOf(p)
  const held = useHeld()
  const instant = useInstant()
  const base = part === 1 ? 0 : 2
  const built = held ? base + 2 : base + Math.min(step, 2)
  const hot = useSplitHot(base, 2, step, 1500)
  const all = built >= 4
  return (
    <Frame w={L4.W} h={L4.H}>
      <Panel x={L4.X0} y={L4.Y0} w={L4.X1 - L4.X0} h={L4.Y1 - L4.Y0} lit={all && !held && step >= 2}>
        <div style={{ position: 'absolute', left: 20, top: 16, right: 20, height: 40, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Plinth size={40}><Ico3D name="checklist" size={30} loop="bob" /></Plinth>
          <span style={heading(19)}>Hardened Baseline</span>
          <span style={{ marginLeft: 'auto', display: 'grid', opacity: all ? 1 : 0.25, transition: tr(instant) }}>
            <Ico3D name="shield" size={36} loop={all ? 'pulse' : 'none'} badge={all ? 'check' : undefined} />
          </span>
        </div>
        {T04_ROWS.map((r, k) => {
          const done = k < built
          const lit = hot === k
          const top = L4.RY - L4.Y0 + k * (L4.RH + L4.RG)
          return (
            <div key={r.label} style={{ position: 'absolute', left: 20, right: 20, top, height: L4.RH, borderRadius: 14, background: lit ? '#FFF6EF' : '#F6F9FF', boxShadow: lit ? `inset 0 0 0 2px ${ORANGE}` : 'inset 0 0 0 1.5px #DCE6FA', display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px 0 6px', transition: instant ? 'none' : `box-shadow 420ms ${EASE}, background 420ms ${EASE}` }}>
              <Plinth size={36}><Swap a={r.a} b={r.b} alt={done} size={28} d={k * 0.4} badgeA={r.ba} badgeB={r.bb} /></Plinth>
              <span style={{ ...heading(16, done ? colors.ink : MUTED), transition: tr(instant, 'color', 420) }}>{r.label}</span>
              <span style={{ marginLeft: 'auto', width: 32, height: 32, borderRadius: 99, display: 'grid', placeItems: 'center', boxShadow: done ? 'none' : 'inset 0 0 0 2px #C9D6F2', background: done ? 'transparent' : '#FFFFFF' }}>
                <span style={{ display: 'grid', opacity: done ? 1 : 0, transform: done ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}` }}>
                  <Ico3D name="check" size={32} loop={all ? 'pulse' : 'none'} d={k * 0.25} />
                </span>
              </span>
            </div>
          )
        })}
      </Panel>
    </Frame>
  )
}

/* ================================================================== slides 16, 17 · A_T05 · the CSPM dashboard */

/*
 * 546 x 330. Accounts row on top (three account tiles, y 42, wired down into the dashboard's top edge at y 96), shown
 * from part 1 press 2. The dashboard (x 20..526, y 96..310): a header (dashboard icon, `CSPM`, and in part 2 the
 * Security Hub mark), the Baseline column (x 40..226: Ports, Policy, Defaults, all ticked) and the live Resources
 * column (x 262..506: Bucket, Instance, Security Group). Part 1 press 1: the security group's port opens and the
 * bucket's policy is edited, each gets an orange flag. Part 2 press 1: Security Hub gathers the findings; press 2: the
 * rows take severity bars and re-sort High, Medium, Low. A scan line sweeps the resources.
 */
const L5 = { W: 546, H: 330, DX0: 20, DX1: 526, DY0: 96, DY1: 310, AY: 42, AX: [210, 273, 336], RY: [188, 230, 272], RH: 36, CX0: 40, CX1: 226, RX0: 262, RX1: 506 }
type Res = { label: string; icon: Ico3DName; drift?: Ico3DName; sev: 'High' | 'Medium' | 'Low'; order: number }
const T05_RES: Res[] = [
  { label: 'Bucket', icon: 'bucket', drift: 'policy', sev: 'Medium', order: 1 },
  { label: 'Instance', icon: 'server', sev: 'Low', order: 2 },
  { label: 'Security Group', icon: 'firewall', drift: 'unlock', sev: 'High', order: 0 },
]
const SEV_C = { High: ORANGE, Medium: '#F2B33D', Low: BLUE }
const T05_IN = L5.AX.map((x, i) => K.ride(`t5a${i}`, [[x, L5.AY + 22], [x, L5.DY0 - 2]], i * 0.35, i * 0.35 + 0.5, 2.6))

const A_T05: Fig = (p) => {
  const step = stepOf(p)
  const part = partOf(p)
  const held = useHeld()
  const instant = useInstant()
  const base = part === 1 ? 0 : 2
  const built = held ? base + 2 : base + Math.min(step, 2)
  const hot = useSplitHot(base, 2, step, 1700)
  const drift = built >= 1
  const accounts = built >= 2
  const hub = built >= 3
  const sorted = built >= 4
  const lit = (k: number) => hot === k
  return (
    <Frame w={L5.W} h={L5.H}>
      {/* the accounts feeding the one dashboard */}
      <Show on={accounts} style={{ position: 'absolute', left: 0, top: L5.AY - 10, width: 160, height: 20, zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <span style={tag(15, lit(1) ? ORANGE : colors.brandDeep)}>Accounts</span>
      </Show>
      {L5.AX.map((x, i) => (
        <div key={i}>
          <Wire pts={[[x, L5.AY + 22], [x, L5.DY0 - 2]]} on={accounts} lit={lit(1)} delay={i * 90} />
          <Node x={x} y={L5.AY} size={42} on={accounts} delay={i * 90} w={60}>
            <Plinth size={42} lit={lit(1)}><Ico3D name="cloud" size={30} loop="bob" d={i * 0.4} /></Plinth>
          </Node>
        </div>
      ))}
      <Show on={accounts} style={{ position: 'absolute', left: 372, top: L5.AY - 10, width: 160, height: 20, zIndex: 3, display: 'flex', alignItems: 'center' }}>
        <span style={tag(15, lit(1) ? ORANGE : colors.brandDeep)}>Services</span>
      </Show>

      <Panel x={L5.DX0} y={L5.DY0} w={L5.DX1 - L5.DX0} h={L5.DY1 - L5.DY0} lit={lit(2)}>
        {/* header */}
        <div style={{ position: 'absolute', left: 20, right: 20, top: 8, height: 32, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Ico3D name="dashboard" size={30} loop="bob" />
          <span style={heading(18)}>CSPM</span>
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, opacity: hub ? 1 : 0, transform: hub ? 'none' : 'translateY(4px)', transition: instant ? 'none' : `opacity 520ms ${EASE}, transform 520ms ${EASE}` }}>
            <img src={hubMark} alt="" aria-hidden style={{ width: 28, height: 28, display: 'block', borderRadius: 6 }} />
            <span style={tag(15, lit(2) ? ORANGE : colors.brandDeep)}>Security Hub</span>
          </span>
        </div>
        <div aria-hidden style={{ position: 'absolute', left: 20, right: 20, top: 46, height: 1.5, background: '#DCE6FA' }} />
        <span style={{ position: 'absolute', left: L5.CX0 - L5.DX0, top: 52, ...tag(14, MUTED) }}>Baseline</span>
        <span style={{ position: 'absolute', left: L5.RX0 - L5.DX0, top: 52, ...tag(14, MUTED) }}>Resources</span>
        <div aria-hidden style={{ position: 'absolute', left: 244 - L5.DX0, top: 54, width: 1.5, height: 140, background: '#DCE6FA' }} />

        {/* the baseline rules */}
        {([['firewall', 'Ports'], ['policy', 'Policy'], ['toggle', 'Defaults']] as [Ico3DName, string][]).map(([ic, label], i) => (
          <div key={label} style={{ position: 'absolute', left: L5.CX0 - L5.DX0, top: L5.RY[i] - L5.DY0 - L5.RH / 2, width: L5.CX1 - L5.CX0, height: L5.RH, borderRadius: 10, background: '#F6F9FF', boxShadow: 'inset 0 0 0 1.5px #DCE6FA', display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px' }}>
            <Ico3D name={ic} size={24} loop="bob" d={i * 0.4} />
            <span style={heading(15)}>{label}</span>
            <span style={{ marginLeft: 'auto', display: 'grid' }}><Ico3D name="check" size={22} loop="none" /></span>
          </div>
        ))}

        {/* the live resources; a scan line sweeps them */}
        <div aria-hidden style={{ position: 'absolute', left: L5.RX0 - L5.DX0, top: L5.RY[0] - L5.DY0 - L5.RH / 2, width: L5.RX1 - L5.RX0, height: L5.RY[2] - L5.RY[0] + L5.RH, overflow: 'hidden', borderRadius: 10, zIndex: 3, pointerEvents: 'none' }}>
          {!held && <span className="t17a-sweep" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 26, background: 'linear-gradient(180deg, rgba(45,99,251,0) 0%, rgba(45,99,251,0.16) 50%, rgba(45,99,251,0) 100%)' }} />}
        </div>
        {T05_RES.map((r, i) => {
          const row = sorted ? r.order : i
          const flagged = drift && !!r.drift
          return (
            <div key={r.label} style={{ position: 'absolute', left: L5.RX0 - L5.DX0, top: L5.RY[0] - L5.DY0 - L5.RH / 2, width: L5.RX1 - L5.RX0, height: L5.RH, transform: `translateY(${row * (L5.RY[1] - L5.RY[0])}px)`, transition: instant ? 'none' : `transform 720ms ${EASE}, box-shadow 420ms ${EASE}, background 420ms ${EASE}`, borderRadius: 10, background: flagged ? '#FFF6EF' : '#F6F9FF', boxShadow: flagged ? (lit(0) ? `inset 0 0 0 2px ${ORANGE}` : 'inset 0 0 0 1.5px #FFD2B0') : 'inset 0 0 0 1.5px #DCE6FA', display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', zIndex: 2 }}>
              {r.drift ? <Swap a={r.icon} b={r.drift} alt={flagged} size={24} d={i * 0.4} /> : <Ico3D name={r.icon} size={24} loop="bob" d={i * 0.4} />}
              <span style={heading(15)}>{r.label}</span>
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ ...tag(13, '#FFFFFF'), padding: '3px 8px', borderRadius: 99, background: SEV_C[r.sev], opacity: sorted ? 1 : 0, transition: tr(instant) }}>{r.sev}</span>
                <span style={{ position: 'relative', display: 'grid', width: 24, height: 24 }}>
                  <span style={{ position: 'absolute', inset: 0, display: 'grid', opacity: flagged ? 0 : 1, transition: tr(instant) }}><Ico3D name="check" size={22} loop="none" /></span>
                  <span style={{ position: 'absolute', inset: 0, display: 'grid', opacity: flagged ? 1 : 0, transform: flagged ? 'none' : 'translateY(6px)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}` }}><Ico3D name="flag" size={24} loop="swing" d={i * 0.3} /></span>
                </span>
              </span>
            </div>
          )
        })}
      </Panel>
      {T05_IN.map((c, i) => <Token key={i} cls={c} on={accounts} size={9} />)}
    </Frame>
  )
}

/* ================================================================== slides 19, 20 · A_T06 · the scanning pipeline */

/*
 * 526 x 330. The pipeline along y 84: Commit -> Image Scan (Inspector) -> Deploy -> Runtime Scan (Inspector) -> AWS
 * Config, nodes at x 50 / 156 / 263 / 370 / 476. Under them (y 186): the ECR image under the static scan, EC2 and
 * Lambda under the runtime scan, Config's history under Config. Part 1: press 1 the pre-deploy scan, press 2 the
 * runtime scan. Part 2: press 1 Config and its history, press 2 schedule and event triggers on both scans, press 3
 * the findings wire returns from Config along y 262 into the Baseline tile under Commit.
 */
const L6 = { W: 526, H: 330, Y: 84, T: 52, X: [48, 152, 258, 364, 468], SY: 186, ST: 40, FY: 262 }
const T06_SEG = [0, 1, 2, 3].map((i) => K.ride(`t6s${i}`, [[L6.X[i] + 27, L6.Y], [L6.X[i + 1] - 27, L6.Y]], i * 0.7, i * 0.7 + 0.5, 3.2))
const T06_BACK = K.ride('t6b', [[L6.X[4], L6.SY + 30], [L6.X[4], L6.FY], [L6.X[0] + 24, L6.FY]], 0.2, 1.8, 2.8)

const A_T06: Fig = (p) => {
  const step = stepOf(p)
  const part = partOf(p)
  const held = useHeld()
  const instant = useInstant()
  const base = part === 1 ? 0 : 2
  const steps = part === 1 ? 2 : 3
  const built = held ? base + steps : base + Math.min(step, steps)
  const hot = useSplitHot(base, steps, step, 1600)
  const lit = (k: number) => hot === k
  const on = (k: number) => built > k
  /* part 1 shows part 2's History and Baseline already placed, dimmed and unlit (no wire), so slide 19 reads as one
     diagram instead of leaving the card's lower half empty */
  const ghost = part === 1
  const dim = (k: number): CSSProperties => ({ opacity: on(k) ? 1 : ghost ? 0.32 : 0, transition: tr(instant) })
  const sx = L6.X[1]
  const rx = L6.X[3]
  const cx = L6.X[4]
  return (
    <Frame w={L6.W} h={L6.H}>
      {[0, 1, 2, 3].map((i) => <Wire key={i} pts={[[L6.X[i] + 27, L6.Y], [L6.X[i + 1] - 27, L6.Y]]} />)}

      <Node x={L6.X[0]} y={L6.Y} size={L6.T} label="Commit" w={96}><Plinth size={L6.T}><Ico3D name="code" size={38} loop="bob" /></Plinth></Node>
      <Node x={sx} y={L6.Y} size={L6.T} label="Image Scan" w={104} lit={lit(0)}>
        <MarkTile src={inspMark} size={L6.T} lit={lit(0)} />
        <Corner name="clock" on={on(3)} pos="tl" />
        <Corner name="bolt" on={on(3)} pos="tr" d={0.4} />
      </Node>
      <Node x={L6.X[2]} y={L6.Y} size={L6.T} label="Deploy" w={96}><Plinth size={L6.T}><Ico3D name="package" size={38} loop="bob" d={0.5} /></Plinth></Node>
      <Node x={rx} y={L6.Y} size={L6.T} label="Runtime Scan" w={110} lit={lit(1)}>
        <MarkTile src={inspMark} size={L6.T} lit={lit(1)} />
        <Corner name="clock" on={on(3)} pos="tl" />
        <Corner name="bolt" on={on(3)} pos="tr" d={0.4} />
      </Node>
      <Node x={cx} y={L6.Y} size={L6.T} label="AWS Config" w={100} lit={lit(2)}>
        <MarkTile src={configMark} size={L6.T} lit={lit(2)} />
      </Node>

      {/* trigger ripples on both scans (part 2 press 2) */}
      {on(3) && !held && [sx, rx].map((x, i) => (
        <span key={i} aria-hidden className={loopCls('ripple')} style={{ position: 'absolute', left: x - L6.T / 2 - 4, top: L6.Y - L6.T / 2 - 4, width: L6.T + 8, height: L6.T + 8, borderRadius: 20, boxShadow: `0 0 0 2.5px ${lit(3) ? ORANGE : BLUE}`, zIndex: 2, ...loopVars(i * 0.6, 2.4) }} />
      ))}

      {/* what each scan looks at */}
      <Tie x={sx} y0={L6.Y + 52} y1={L6.SY - L6.ST / 2 - 4} on={on(0)} lit={lit(0)} />
      <Node x={sx} y={L6.SY} size={L6.ST} label="ECR Image" w={100} on={on(0)} tagSize={13}>
        <MarkTile src={ecrMark} size={L6.ST} lit={lit(0)} />
        {!held && on(0) && <span aria-hidden className="t17a-beam" style={{ position: 'absolute', left: 2, right: 2, top: 4, height: 3, borderRadius: 2, background: ORANGE, boxShadow: `0 0 8px ${ORANGE}`, zIndex: 5 }} />}
      </Node>
      <Wire pts={[[rx, L6.Y + 52], [rx, L6.SY - 40], [rx - 26, L6.SY - 40], [rx - 26, L6.SY - L6.ST / 2 - 4]]} on={on(1)} head={0} dash="4 5" width={2} color={lit(1) ? ORANGE : '#9DB4E8'} />
      <Wire pts={[[rx, L6.SY - 40], [rx + 26, L6.SY - 40], [rx + 26, L6.SY - L6.ST / 2 - 4]]} on={on(1)} head={0} dash="4 5" width={2} color={lit(1) ? ORANGE : '#9DB4E8'} />
      <Node x={rx - 26} y={L6.SY} size={L6.ST} label="EC2" w={54} on={on(1)} tagSize={13}><MarkTile src={ec2Mark} size={L6.ST} lit={lit(1)} /></Node>
      <Node x={rx + 26} y={L6.SY} size={L6.ST} label="Lambda" w={58} on={on(1)} tagSize={13}><MarkTile src={lambdaMark} size={L6.ST} lit={lit(1)} /></Node>

      {/* Config's recorded history */}
      <Tie x={cx} y0={L6.Y + 52} y1={L6.SY - 22} on={on(2)} lit={lit(2)} />
      <Show on={on(2) || ghost} style={{ ...dim(2), position: 'absolute', left: cx - 36, top: L6.SY - 18, width: 72, height: 36, borderRadius: 10, background: '#F6F9FF', boxShadow: lit(2) ? `inset 0 0 0 2px ${ORANGE}` : 'inset 0 0 0 1.5px #DCE6FA', zIndex: 3 }}>
        <svg aria-hidden width={72} height={36} style={{ display: 'block' }}>
          <line x1={12} y1={18} x2={60} y2={18} stroke="#9DB4E8" strokeWidth={2} />
          {[12, 28, 44, 60].map((x, i) => <circle key={i} cx={x} cy={18} r={5} fill={i === 3 ? ORANGE : BLUE} />)}
        </svg>
      </Show>
      <Show on={on(2) || ghost} style={{ ...dim(2), position: 'absolute', left: cx - 50, top: L6.SY + 24, width: 100, zIndex: 3 }}>
        <span style={{ ...tag(13, lit(2) ? ORANGE : colors.brandDeep), display: 'block' }}>History</span>
      </Show>

      {/* findings return to the baseline */}
      <Wire pts={[[cx, L6.SY + 44], [cx, L6.FY], [L6.X[0] + 24, L6.FY]]} on={on(4)} lit={lit(4)} />
      <div style={{ ...dim(4), position: 'absolute', inset: 0, zIndex: 3 }}>
      <Node x={L6.X[0]} y={L6.FY} size={44} label="Baseline" w={96} on={on(4) || ghost} tagSize={13} lit={lit(4)}>
        <Plinth size={44} lit={lit(4)}>
          <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 32, height: 32 }}>
            <Ico3D name="shield" size={32} loop="bob" />
            <span style={{ position: 'absolute', right: -7, bottom: -5 }}><Ico3D name="wrench" size={18} loop="tilt" /></span>
          </span>
        </Plinth>
      </Node>
      </div>

      {T06_SEG.map((c, i) => <Token key={i} cls={c} />)}
      <Token cls={T06_BACK} tone={ORANGE} on={on(4)} />
    </Frame>
  )
}

export const figures: Record<string, Fig> = { A_T01, A_T02B, A_T03, A_T04, A_T05, A_T06 }

export const css = `
@keyframes t17a-sweep { 0% { transform: translateY(-30px) } 100% { transform: translateY(150px) } }
.t17a-sweep { animation: t17a-sweep 2.8s linear infinite; }
@keyframes t17a-beam { 0%, 100% { transform: translateY(0); opacity: 0.2 } 50% { transform: translateY(28px); opacity: 1 } }
.t17a-beam { animation: t17a-beam 1.8s cubic-bezier(0.45,0,0.55,1) infinite; }
${K.css()}
.cc-still .t17a-sweep, .deck-thumb .t17a-sweep, .cc-still .t17a-beam, .deck-thumb .t17a-beam { animation: none !important; opacity: 0 !important; }
@media (prefers-reduced-motion: reduce) { .t17a-sweep, .t17a-beam { animation: none !important; } }
`
