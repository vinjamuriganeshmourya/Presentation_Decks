import type { ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Loop } from '@/engine/icons3d'
import {
  Frame, Plinth, MarkTile, Panel, Wire, Junction, Show, Pair, useHot, useHeld, keyframes, Token,
  tag, heading, loopCls, loopVars, EASE, ORANGE, PAD, type Pt,
} from '@/engine/figkit'
import smMark from '../images/aws-secrets-manager.svg'
import kmsMark from '../images/aws-kms.svg'
import lambdaMark from '../images/res-lambda-function.svg'

/*
 * SESSION 17 · SECTION 4 (Secrets Management) · builder C
 * C_T13 (slides 31, 32), C_T14B (35), C_T15 (36, 37).
 * Standing correction 17: 3D icons on plinth tiles, PAD (20) on all four sides of every stage and card, orthogonal
 * wires computed from the box constants (tips on target edges), flow dots on every wire, the lit item walking
 * first -> last -> first after the build, held frames complete with nothing lit and nothing moving.
 * Stage sizes are the points-layout boxes: 1110 - pointsW - 24 wide by figH (546 x 330; C_T15 526 x 330 so the
 * 560-wide points of T15-B fit the same drawing). Class prefix `t17c-`.
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('t17c')
const MONO = "'JetBrains Mono', ui-monospace, monospace"

/** a secret value the slide must never show: a blurred field, as a capture would be blurred (rule 53) */
const Blurred = ({ w, h = 14 }: { w: number; h?: number }) => (
  <span aria-hidden style={{ display: 'inline-block', width: w, height: h, borderRadius: 7, background: '#C3CEE0', filter: 'blur(2.5px)', verticalAlign: 'middle', flexShrink: 0 }} />
)

/** a round white badge on a corner, centred on (x, y) */
function Corner({ x, y, on = true, size = 30, children }: { x: number; y: number; on?: boolean; size?: number; children: ReactNode }) {
  return (
    <Show on={on} lift={0} style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: 6 }}>
      <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6' }}>{children}</span>
    </Show>
  )
}

/** a tile centred on (x, y) with its tag under it (or beside it, `side`) */
function Node({ x, y, label, size = 60, on = true, delay = 0, children, w = 130, side, lit }: { x: number; y: number; label: string; size?: number; on?: boolean; delay?: number; children: ReactNode; w?: number; side?: 'left' | 'top'; lit?: boolean }) {
  if (side === 'left')
    return (
      <Show on={on} delay={delay} style={{ position: 'absolute', left: x + size / 2 - w, top: y - size / 2, width: w, height: size, zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
        <span style={{ ...tag(15, lit ? '#C2541C' : undefined), transition: `color 420ms ${EASE}` }}>{label}</span>
        <div style={{ width: size, height: size, display: 'grid', placeItems: 'center' }}>{children}</div>
      </Show>
    )
  if (side === 'top')
    return (
      <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, top: y - size / 2 - 26, width: w, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <span style={tag(15)}>{label}</span>
        <div style={{ width: size, height: size, display: 'grid', placeItems: 'center' }}>{children}</div>
      </Show>
    )
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, top: y - size / 2, width: w, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ width: size, height: size, display: 'grid', placeItems: 'center' }}>{children}</div>
      <span style={tag(15)}>{label}</span>
    </Show>
  )
}

/* ------------------------------------------------------------------ the code window (the hardcoded secret) */

/** an editor window: three dots, a few grey code lines, and the two secret lines with blurred values */
function CodeWindow({ w, h, lit, big }: { w: number; h: number; lit: boolean; big: boolean }) {
  const instant = useInstant()
  const held = useHeld()
  const fs = big ? 15 : 14
  const bar = (bw: number, k: number) => <span key={k} style={{ display: 'block', width: bw, height: 8, borderRadius: 4, background: '#DCE5F7', margin: big ? '0 0 13px' : '0 0 9px' }} />
  const secret = (name: string, bw: number) => (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, height: big ? 30 : 26, margin: big ? '0 0 13px' : '0 0 9px', padding: '0 8px', marginLeft: -8, marginRight: -8, borderRadius: 8, background: '#FFF1E6', boxShadow: `inset 0 0 0 1.5px #FFD2B0` }}>
      <span style={{ fontFamily: MONO, fontVariantLigatures: 'none', fontSize: fs, fontWeight: 600, color: colors.ink, whiteSpace: 'nowrap' }}>{name}</span>
      <span style={{ fontFamily: MONO, fontSize: fs, fontWeight: 600, color: colors.muted }}>=</span>
      <Blurred w={bw} />
    </div>
  )
  return (
    <div style={{ position: 'absolute', inset: 0, borderRadius: 16, background: '#FFFFFF', boxShadow: lit ? `inset 0 0 0 2.5px ${ORANGE}, 0 12px 24px -16px rgba(31,64,140,0.34)` : 'inset 0 0 0 1.5px #CFDCF5, 0 12px 24px -16px rgba(31,64,140,0.34)', transition: instant ? 'none' : `box-shadow 420ms ${EASE}`, overflow: 'hidden' }}>
      <div style={{ height: big ? 40 : 34, display: 'flex', alignItems: 'center', gap: 7, padding: '0 16px', background: 'linear-gradient(180deg, #F4F7FE 0%, #E9EFFC 100%)', boxShadow: 'inset 0 -1px 0 #DCE4F4' }}>
        {['#FF8A3D', '#FFC53A', '#25BC6E'].map((c) => <span key={c} style={{ width: 10, height: 10, borderRadius: 99, background: c, opacity: 0.9 }} />)}
        <span style={{ marginLeft: 'auto' }}><Ico3D name="code" size={big ? 26 : 22} loop="none" /></span>
      </div>
      <div style={{ padding: big ? '20px 20px 0' : '14px 18px 0' }}>
        {bar(w * 0.42, 1)}
        {bar(w * 0.62, 2)}
        {secret('password', big ? 92 : 40)}
        {secret('api_key', big ? 104 : 52)}
        {big && bar(w * 0.5, 3)}
        {big && bar(w * 0.34, 4)}
      </div>
      {/* a slow highlight sweeping the secret lines: the eye goes where the leak is */}
      {!held && big && <span aria-hidden className="t17c-sweep" style={{ position: 'absolute', left: 0, top: 0, width: 60, height: h, background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.65) 50%, rgba(255,255,255,0) 100%)' }} />}
    </div>
  )
}

/* ================================================================== 31, 32 · C_T13 · hardcoded secrets vs a store */

/* part 1 (546 x 330): the code window on the left; the secret line leaks along a bus into three rows (git history,
   image layers, the scanner), one per press. Part 2: the same code window shrunk to the left card with its cross, the
   three leaks as a row of small tiles under it, and the secret store on the right, called by the application. */
const T = { W: 546, H: 330 }
/* part 1 */
const T1 = { CX: PAD, CY: PAD, CW: 236, CH: T.H - PAD * 2, BUS: 280, RX: 304, RW: T.W - PAD - 304, RH: 82 }
const T1_RY = [PAD, (T.H - T1.RH) / 2, T.H - PAD - T1.RH]
const T1_RC = T1_RY.map((y) => y + T1.RH / 2)
const T1_SY = PAD + 40 + 20 + 21 + 21 + 15 // the db_password line's centre in the big window
const T1_WIRES: Pt[][] = T1_RC.map((y) => (Math.abs(y - T1_SY) < 1 ? [[T1.CX + T1.CW, T1_SY], [T1.RX, y]] : [[T1.CX + T1.CW, T1_SY], [T1.BUS, T1_SY], [T1.BUS, y], [T1.RX, y]]))
const T1_RIDE = T1_WIRES.map((pts, i) => K.ride(`t1${i}`, [...pts.slice(0, -1), [T1.RX - 8, pts[pts.length - 1][1]]], 0.2 + i * 0.9, 1.1 + i * 0.9, 3.4))
const T1_ROWS: { title: string; main: Ico3DName; over: Ico3DName; loop: Loop }[] = [
  { title: 'Git History', main: 'branch', over: 'key', loop: 'bob' },
  { title: 'Image Layers', main: 'layers', over: 'key', loop: 'float' },
  { title: 'Scanner', main: 'radar', over: 'bug', loop: 'bob' },
]

/* part 2 */
const T2 = { LX: PAD, LW: 230, GAP: 20, Y: PAD, HH: T.H - PAD * 2 }
const T2_RX = T2.LX + T2.LW + T2.GAP // 270
const T2_RW = T.W - PAD - T2_RX // 256
const T2_COL = T2_RX + 90 // the application / store column
const T2_APP_Y = 96
const T2_ST_Y = 232
const T2_TS = 60
const T2_DOWN: Pt[] = [[T2_COL - 14, T2_APP_Y + T2_TS / 2], [T2_COL - 14, T2_ST_Y - T2_TS / 2]]
const T2_UP: Pt[] = [[T2_COL + 14, T2_ST_Y - T2_TS / 2], [T2_COL + 14, T2_APP_Y + T2_TS / 2]]
const T2_RIDE_D = K.ride('t2d', [T2_DOWN[0], [T2_DOWN[1][0], T2_DOWN[1][1] - 8]], 0.2, 1.3, 2.8)
const T2_RIDE_U = K.ride('t2u', [T2_UP[0], [T2_UP[1][0], T2_UP[1][1] + 8]], 1.5, 2.6, 2.8)

function T13Part1({ s }: { s: number }) {
  const hot = useHot(3, s, 1900)
  return (
    <Frame w={T.W} h={T.H}>
      <Show on style={{ position: 'absolute', left: T1.CX, top: T1.CY, width: T1.CW, height: T1.CH, zIndex: 2 }}>
        <CodeWindow w={T1.CW} h={T1.CH} lit={false} big />
      </Show>
      <Corner x={T1.CX + T1.CW - 6} y={T1.CY + T1.CH - 6} size={40}><Ico3D name="cross" size={28} loop="pulse" t={2.4} /></Corner>
      {s >= 1 && <Junction x={T1.BUS} y={T1_SY} on={s >= 1} lit={hot >= 0} />}
      {T1_ROWS.map((r, i) => (
        <div key={r.title}>
          <Wire pts={T1_WIRES[i]} on={s >= i + 1} lit={hot === i} head={9} delay={150} color={ORANGE} />
          <Token cls={T1_RIDE[i]} on={s >= i + 1} size={10} tone={ORANGE} />
          <Panel x={T1.RX} y={T1_RY[i]} w={T1.RW} h={T1.RH} on={s >= i + 1} lit={hot === i} delay={250}>
            <div style={{ position: 'absolute', inset: '0 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <Plinth size={56} warm={i === 2}><Pair main={r.main} over={r.over} size={40} k={0.5} loop={r.loop} d={i * 0.6} /></Plinth>
              <span style={{ ...heading(18), whiteSpace: 'nowrap' }}>{r.title}</span>
            </div>
          </Panel>
        </div>
      ))}
    </Frame>
  )
}

function T13Part2({ s }: { s: number }) {
  const hot = useHot(2, s, 2200)
  return (
    <Frame w={T.W} h={T.H}>
      {/* left: the hardcoded secret, crossed out, with its three leaks under it (all from the previous frame) */}
      <Panel x={T2.LX} y={T2.Y} w={T2.LW} h={T2.HH} on>
        <div style={{ position: 'absolute', left: 20, top: 20, width: T2.LW - 40, height: 156 }}>
          <CodeWindow w={T2.LW - 40} h={156} lit={false} big={false} />
        </div>
        <div style={{ position: 'absolute', left: 20, right: 20, top: 196, display: 'flex', justifyContent: 'space-between' }}>
          {T1_ROWS.map((r, i) => (
            <div key={r.title} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, width: 52 }}>
              <Plinth size={44} warm={i === 2}><Pair main={r.main} over={r.over} size={32} k={0.5} loop={r.loop} d={i * 0.6} /></Plinth>
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', left: 20, right: 20, top: 248, display: 'flex', justifyContent: 'space-between' }}>
          {['History', 'Layers', 'Scanner'].map((t) => <span key={t} style={{ ...tag(14), width: 52, display: 'flex', justifyContent: 'center' }}>{t}</span>)}
        </div>
      </Panel>
      <Corner x={T2.LX + T2.LW - 26} y={T2.Y + 20 + 156 - 6} size={40}><Ico3D name="cross" size={28} loop="pulse" t={2.4} /></Corner>

      {/* right: the secret store holds the value; the application fetches it at runtime through an IAM check */}
      <Panel x={T2_RX} y={T2.Y} w={T2_RW} h={T2.HH} on={s >= 1} lit={false} />
      <Node x={T2_COL} y={T2_APP_Y} label="Application" size={T2_TS} on={s >= 1} w={120} side="top">
        <Plinth size={T2_TS} lit={hot === 1}><Ico3D name="code" size={44} loop="bob" badge="check" /></Plinth>
      </Node>
      <Node x={T2_COL} y={T2_ST_Y} label="Secret Store" size={T2_TS} on={s >= 1} w={120} delay={150}>
        <span style={{ position: 'relative', display: 'grid' }}>
          <MarkTile src={smMark} size={T2_TS} lit={hot === 0} />
          <span style={{ position: 'absolute', right: -14, bottom: -10 }}><Ico3D name="password" size={30} loop="pulse" t={2.6} /></span>
        </span>
      </Node>
      <div style={{ position: 'absolute', left: 0, top: 0, zIndex: 4 }}>
        <Wire pts={T2_DOWN} on={s >= 2} head={9} lit={hot === 1} delay={150} />
        <Wire pts={T2_UP} on={s >= 2} head={9} lit={hot === 1} delay={450} />
      </div>
      <Token cls={T2_RIDE_D} on={s >= 2} size={9} />
      <RideIcon cls={T2_RIDE_U} on={s >= 2} name="key" />
      <Show on={s >= 2} delay={600} style={{ position: 'absolute', left: T2_COL + 34, top: (T2_APP_Y + T2_ST_Y) / 2 - 19, width: T.W - PAD - 16 - (T2_COL + 34), zIndex: 3 }}>
        <div style={{ ...tag(15), whiteSpace: 'normal', textAlign: 'left', lineHeight: 1.25 }}>IAM-Checked Request</div>
      </Show>
    </Frame>
  )
}

/** a small 3D icon on a white chip riding a `ride` class (a value carried along a wire); nothing on held frames */
function RideIcon({ cls, on, name, size = 26 }: { cls: string; on: boolean; name: Ico3DName; size?: number }) {
  const held = useHeld()
  if (held || !on) return null
  return (
    <span aria-hidden style={{ position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, zIndex: 6, pointerEvents: 'none' }}>
      <span className={cls} style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 8, background: '#FFFFFF', boxShadow: '0 6px 14px -8px rgba(31,64,140,0.7), inset 0 0 0 1.5px #D3DEF6', opacity: 0 }}>
        <Ico3D name={name} size={Math.round(size * 0.78)} loop="none" />
      </span>
    </span>
  )
}

const C_T13: Fig = (p) => {
  const s = Number(p.step ?? 0)
  return Number(p.part ?? 1) === 2 ? <T13Part2 s={s} /> : <T13Part1 s={s} />
}

/* ================================================================== 35 · C_T14B · application -> IAM check -> store */

/*
 * 546 x 330. Left: the application (code) with the plaintext file it never reads (crossed). Middle: the request wire
 * through the IAM policy check gate into the store; the return wire carrying the current version back. Right: the
 * store card (Secrets Manager mark, KMS padlock beside it), holding the version stack: Current on top, Prior under it.
 */
const B = { W: 546, H: 330, AX: 72, AY: 133, AS: 80, SX: 300, GX: 202, REQ: 100, RET: 166 }
const B_SW = B.W - PAD - B.SX // 226
const B_SH = B.H - PAD * 2
const B_REQ: Pt[] = [[B.AX + B.AS / 2, B.REQ], [B.SX, B.REQ]]
const B_RET: Pt[] = [[B.SX, B.RET], [B.AX + B.AS / 2, B.RET]]
const B_RIDE_REQ = K.ride('breq', [B_REQ[0], [B.SX - 8, B.REQ]], 0.1, 1.2, 3.2)
const B_RIDE_RET = K.ride('bret', [B_RET[0], [B.AX + B.AS / 2 + 10, B.RET]], 1.5, 2.7, 3.2)
const B_ROW_Y = [120, 184] // version rows, card coordinates
const B_ROW_H = 50

function VersionRow({ y, label, current, lit, on, delay = 0 }: { y: number; label: string; current: boolean; lit: boolean; on: boolean; delay?: number }) {
  const instant = useInstant()
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: 20, right: 20, top: y, height: B_ROW_H }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 12, background: current ? '#FFFFFF' : '#F5F8FF', boxShadow: lit ? `inset 0 0 0 2.5px ${ORANGE}` : `inset 0 0 0 1.5px ${current ? '#BFD0F3' : '#DCE5F7'}`, transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }} />
      <div style={{ position: 'absolute', inset: '0 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ opacity: current ? 1 : 0.7, display: 'grid' }}><Ico3D name="version" size={30} loop={current ? 'bob' : 'none'} /></span>
        <span style={{ ...heading(16, current ? colors.ink : colors.muted) }}>{label}</span>
        <span style={{ marginLeft: 'auto', display: 'grid' }}>
          {current ? <Ico3D name="check" size={26} loop="pulse" t={2.4} /> : <Ico3D name="refresh" size={26} loop={lit ? 'spin' : 'none'} t={3} />}
        </span>
      </div>
    </Show>
  )
}

const C_T14B: Fig = (p) => {
  const s = Number(p.step ?? 0)
  const hot = useHot(4, s, 1900)
  const held = useHeld()
  return (
    <Frame w={B.W} h={B.H}>
      {/* the application, and the plaintext file it never reads */}
      <Node x={B.AX} y={B.AY} label="Application" size={B.AS} on w={130}>
        <Plinth size={B.AS} lit={hot === 0}><Ico3D name="code" size={58} loop="bob" /></Plinth>
      </Node>
      <Node x={B.GX} y={262} label="Plaintext" size={48} on={s >= 1} delay={200} w={110}>
        <span style={{ position: 'relative', display: 'grid', opacity: 0.85 }}>
          <Plinth size={48} warm lit={hot === 0}><Ico3D name="doc" size={34} loop="none" /></Plinth>
          <span style={{ position: 'absolute', right: -12, top: -10 }}><Ico3D name="cross" size={24} loop="pulse" t={2.4} /></span>
        </span>
      </Node>

      {/* the request through the IAM policy check, and the current version coming back */}
      <Wire pts={B_REQ} on={s >= 1} head={10} lit={hot === 1} delay={150} />
      <Token cls={B_RIDE_REQ} on={s >= 1} size={10} />
      <Show on={s >= 2} style={{ position: 'absolute', left: B.GX - 26, top: B.REQ - 26, width: 52, height: 52, zIndex: 4 }}>
        <Plinth size={52} lit={hot === 1}><Ico3D name="gate" size={38} loop="pulse" t={2.6} /></Plinth>
      </Show>
      <Show on={s >= 2} style={{ position: 'absolute', left: B.GX - 80, top: B.REQ - 26 - 30, width: 160, zIndex: 3 }}>
        <div style={tag(15)}>IAM Policy Check</div>
      </Show>
      <Wire pts={B_RET} on={s >= 3} head={10} lit={hot === 2} delay={300} />
      <RideIcon cls={B_RIDE_RET} on={s >= 3} name="key" />
      <Show on={s >= 3} delay={500} style={{ position: 'absolute', left: B.GX - 80, top: B.RET + 12, width: 160, zIndex: 3 }}>
        <div style={tag(15)}>Current Version</div>
      </Show>

      {/* the store: Secrets Manager with its KMS padlock, holding the versions */}
      <Panel x={B.SX} y={PAD} w={B_SW} h={B_SH} on lit={false}>
        <div style={{ position: 'absolute', left: 20, right: 20, top: 20, display: 'flex', justifyContent: 'space-around' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <MarkTile src={smMark} size={52} lit={hot === 2} />
            <span style={tag(14)}>Secrets Manager</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ position: 'relative', display: 'grid', marginTop: 4 }}>
              <MarkTile src={kmsMark} size={44} />
              <span style={{ position: 'absolute', right: -9, bottom: -7 }}><Ico3D name="lock" size={22} loop="pulse" t={2.8} /></span>
            </span>
            <span style={tag(14)}>KMS</span>
          </div>
        </div>
        <VersionRow y={B_ROW_Y[0]} label="Current" current lit={hot === 2} on={s >= 3} />
        <VersionRow y={B_ROW_Y[1]} label="Prior" current={false} lit={hot === 3} on={s >= 3} delay={200} />
        <Show on={s >= 4} style={{ position: 'absolute', left: 20, right: 20, top: B_ROW_Y[1] + B_ROW_H + 10, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          <span className={held ? undefined : 't17c-roll'} style={{ display: 'grid' }}><Ico3D name="snapshot" size={24} loop="none" /></span>
          <span style={tag(14, hot === 3 ? '#C2541C' : colors.brandDeep)}>Rollback</span>
        </Show>
      </Panel>
    </Frame>
  )
}

/* ================================================================== 36, 37 · C_T15 · the rotation timeline */

/*
 * 526 x 330. Top: version A (Day 0) and version B (Day N) cards, the rotation function (Lambda) between them on the
 * wire A -> Lambda -> B. Under them the time axis, Day 0 under A and Day N under B, the rotation tick under Lambda.
 * Bottom: the database Lambda updates; part 2 adds the application fetching the current version (and refreshing its
 * cached copy), then the failed rotation: the store keeps A current while the database already holds B's password.
 */
const R = { W: 526, H: 330, CW: 140, CH: 136, LX: 263, LY: 88, LS: 56, AXY: 182, DBY: 252, DBS: 56, APX: 480, APY: 266, APS: 48 }
const R_AX = PAD
const R_BX = R.W - PAD - R.CW
const R_ACX = R_AX + R.CW / 2
const R_BCX = R_BX + R.CW / 2
const R_W1: Pt[] = [[R_AX + R.CW, R.LY], [R.LX - R.LS / 2, R.LY]]
const R_W2: Pt[] = [[R.LX + R.LS / 2, R.LY], [R_BX, R.LY]]
const R_WDB: Pt[] = [[R.LX, R.LY + R.LS / 2], [R.LX, R.DBY - R.DBS / 2]]
const R_WAPP: Pt[] = [[R.APX, R.APY - R.APS / 2], [R.APX, PAD + R.CH]]
const R_RIDE1 = K.ride('r1', [R_W1[0], R_W1[1], R_W2[0], [R_BX - 8, R.LY]], 0.1, 1.4, 3.6)
const R_RIDEDB = K.ride('rdb', [R_WDB[0], [R.LX, R.DBY - R.DBS / 2 - 8]], 1.5, 2.4, 3.6)
const R_RIDEAPP = K.ride('rapp', [[R.APX, PAD + R.CH], [R.APX, R.APY - R.APS / 2 - 8]], 0.4, 1.4, 2.8)

function VCard({ x, name, status, current, lit, on, warn }: { x: number; name: string; status: string; current: boolean; lit: boolean; on: boolean; warn?: boolean }) {
  const instant = useInstant()
  return (
    <Show on={on} style={{ position: 'absolute', left: x, top: PAD, width: R.CW, height: R.CH, zIndex: 2 }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 18, background: warn ? 'linear-gradient(180deg, #FFFFFF 0%, #FFF1E6 100%)' : current ? 'linear-gradient(180deg, #FFFFFF 0%, #ECF2FD 100%)' : '#F3F5FA', boxShadow: lit ? `inset 0 0 0 2.5px ${ORANGE}, 0 10px 22px -14px rgba(255,138,61,0.8)` : `inset 0 0 0 1px ${warn ? '#FFD2B0' : current ? '#CFDCF5' : '#DFE4EE'}, 0 12px 24px -16px rgba(31,64,140,${current ? 0.34 : 0.12})`, transition: instant ? 'none' : `box-shadow 420ms ${EASE}, background 420ms ${EASE}` }} />
      <div style={{ position: 'absolute', inset: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, filter: current || warn ? 'none' : 'grayscale(0.9)', opacity: current || warn ? 1 : 0.6, transition: instant ? 'none' : `opacity 420ms ${EASE}, filter 420ms ${EASE}` }}>
        <Plinth size={50} warm={warn}><Ico3D name="password" size={36} loop={current ? 'bob' : 'none'} /></Plinth>
        <span style={heading(17)}>{name}</span>
        <span style={{ ...tag(14, warn ? '#C2541C' : current ? '#128A4E' : colors.muted), transition: instant ? 'none' : `color 420ms ${EASE}` }}>{status}</span>
      </div>
    </Show>
  )
}

function T15Fig({ s, part }: { s: number; part: number }) {
  const held = useHeld()
  /* where the story stands: part 1 builds the rotation, part 2 starts from its end */
  const rotated = part === 2 || s >= 1 // B exists, the database has its password
  const marked = part === 2 || s >= 2 // B current, A previous
  const fetch = part === 2 && s >= 1
  const failed = part === 2 && s >= 2
  const hot = useHot(2, s, 2400)
  /* after the build, part 2's walk shows the two outcomes in turn, starting from the one just built (the failure, cycle
     0), then the fetch (cycle 1); held = the end state, the failure, nothing lit */
  const showFail = failed && (held || hot === 0)
  const fetchLit = part === 2 && !held && (s === 1 || (s >= 2 && hot === 1))
  const failLit = part === 2 && !held && showFail
  const aCurrent = !marked || showFail
  return (
    <Frame w={R.W} h={R.H}>
      {/* the time axis: Day 0 under A, the rotation tick under Lambda, Day N under B */}
      <Show on style={{ position: 'absolute', left: 0, top: 0, width: R.W, height: R.H, zIndex: 1 }}>
        <svg aria-hidden width={R.W} height={R.H} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
          <line x1={PAD} y1={R.AXY} x2={R.W - PAD - 10} y2={R.AXY} stroke="#C9D7F2" strokeWidth={3} strokeLinecap="round" />
          <polygon points={`${R.W - PAD},${R.AXY} ${R.W - PAD - 12},${R.AXY - 7} ${R.W - PAD - 12},${R.AXY + 7}`} fill="#C9D7F2" />
          <circle cx={R_ACX} cy={R.AXY} r={7} fill={colors.brand} stroke="#FFFFFF" strokeWidth={2.5} />
          <circle cx={R.LX} cy={R.AXY} r={5} fill={rotated ? (showFail ? ORANGE : colors.brand) : '#C9D7F2'} stroke="#FFFFFF" strokeWidth={2} style={{ transition: `fill 420ms ${EASE}` }} />
          <circle cx={R_BCX} cy={R.AXY} r={7} fill={rotated ? colors.brand : '#C9D7F2'} stroke="#FFFFFF" strokeWidth={2.5} style={{ transition: `fill 420ms ${EASE}` }} />
        </svg>
        <div style={{ position: 'absolute', left: R_ACX - 50, top: R.AXY + 14, width: 100, ...tag(15) }}>Day 0</div>
        <div style={{ position: 'absolute', left: R_BCX - 50, top: R.AXY + 14, width: 100, ...tag(15) }}>Day N</div>
      </Show>

      <VCard x={R_AX} name="Version A" status={aCurrent ? 'Current' : 'Previous'} current={aCurrent} lit={false} on />
      <VCard x={R_BX} name="Version B" status={showFail ? 'New' : marked ? 'Current' : 'New'} current={!aCurrent || !marked} lit={part === 1 ? hot === 1 : fetchLit} on={rotated} warn={showFail} />

      {/* the rotation function between them */}
      <Wire pts={R_W1} on={rotated} head={9} lit={part === 1 && hot === 0} />
      <Wire pts={R_W2} on={rotated} head={9} lit={part === 1 && hot === 0} delay={300} />
      <Token cls={R_RIDE1} on={rotated && !failed} size={10} />
      <Show on style={{ position: 'absolute', left: R.LX - R.LS / 2, top: R.LY - R.LS / 2, width: R.LS, height: R.LS, zIndex: 4 }}>
        <span style={{ position: 'relative', display: 'grid' }}>
          {!held && <span aria-hidden className={loopCls('ripple')} style={{ position: 'absolute', inset: -6, borderRadius: 20, border: `2px solid ${(showFail ? ORANGE : colors.brand) + '55'}`, ...loopVars(0, 2.6) }} />}
          <MarkTile src={lambdaMark} size={R.LS} lit={(part === 1 && hot === 0) || failLit} />
        </span>
      </Show>
      <Corner x={R.LX + R.LS / 2 - 2} y={R.LY - R.LS / 2 + 2} size={30} on={showFail}><Ico3D name="alert" size={22} loop="pulse" t={1.8} /></Corner>
      <div style={{ position: 'absolute', left: R.LX - 60, top: R.LY - R.LS / 2 - 30, width: 120, zIndex: 3, ...tag(15) }}>Rotation</div>

      {/* the database Lambda updates */}
      <Wire pts={R_WDB} on={rotated} head={9} lit={part === 1 && hot === 0} delay={500} color={showFail ? ORANGE : colors.brand} />
      <Token cls={R_RIDEDB} on={rotated && !showFail} size={10} />
      <Node x={R.LX} y={R.DBY} label="Database" size={R.DBS} on={rotated} delay={400} w={120}>
        <span style={{ position: 'relative', display: 'grid' }}>
          <Plinth size={R.DBS} warm={showFail} lit={failLit}><Ico3D name="database" size={40} loop="float" /></Plinth>
          <span style={{ position: 'absolute', right: -12, bottom: -8 }}><Ico3D name="password" size={24} loop="none" /></span>
        </span>
      </Node>

      {/* part 2: the application fetches the current version; its cached copy refreshes */}
      <Wire pts={R_WAPP} on={fetch} head={9} lit={fetchLit} delay={200} opacity={showFail ? 0.35 : 1} />
      <RideIcon cls={R_RIDEAPP} on={fetch && !showFail} name="password" />
      <Node x={R.APX} y={R.APY} label="Application" size={R.APS} on={fetch} side="left" w={150} lit={fetchLit}>
        <Plinth size={R.APS} lit={fetchLit}><Pair main="code" over="refresh" size={34} k={0.55} loop="bob" overLoop="spin" /></Plinth>
      </Node>
    </Frame>
  )
}

const C_T15: Fig = (p) => <T15Fig s={Number(p.step ?? 0)} part={Number(p.part ?? 1)} />

export const figures: Record<string, Fig> = { C_T13, C_T14B, C_T15 }

export const css = `
@keyframes t17c-sweep { 0%, 20% { transform: translateX(-80px) } 70%, 100% { transform: translateX(320px) } }
.t17c-sweep { animation: t17c-sweep 3.4s cubic-bezier(0.45,0,0.55,1) infinite; will-change: transform; }
@keyframes t17c-roll { 0%, 100% { transform: translateY(2px) } 50% { transform: translateY(-3px) } }
.t17c-roll { animation: t17c-roll 2.4s cubic-bezier(0.45,0,0.55,1) infinite; }
.cc-still .t17c-sweep, .deck-thumb .t17c-sweep { display: none; }
.cc-still .t17c-roll, .deck-thumb .t17c-roll { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .t17c-sweep, .t17c-roll { animation: none !important; } }
${K.css()}
`
