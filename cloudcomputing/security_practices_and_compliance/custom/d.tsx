import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Badge, type Loop } from '@/engine/icons3d'
import { EASE, FONT, ORANGE, Frame, Show, Plinth, MarkTile, Panel, Wire, Junction, Token, keyframes, tag, useHeld, useHot, useCycle, type Pt } from '@/engine/figkit'
import artifactMark from '../images/aws-artifact.svg'

/*
 * BUILDER D · Session 17 Security Practices & Compliance, Section 5 (Compliance Frameworks): technical figures for
 *   slides 39-40 D_T16 (526 x 330; part 1: 3 steps, part 2: 2 steps)  five pillars converging into shared responsibility
 *   slide 41     D_T17 (546 x 330, 4 steps)  ISO 27001 certificate, SOC 2 report (Type I / Type II), AWS Artifact
 *   slides 44-45 D_T19 (546 x 300; part 1: 2 steps, part 2: 3 steps)  EU, India, US flags with their clause lists
 *   slide 47     D_T20 (546 x 330, 4 steps)  EU and India regions, a transfer stopped, then crossing under an SCC lock
 *   slide 48     D_T21 (526 x 330, 4 steps)  Provider Proves | Auditor | Customer Proves
 *
 * Session 13 visual standard (generate-slides correction 17): 3D icons on plinth tiles, >= 20 px padding, orthogonal
 * wires from the same constants as the tiles, a flow dot on every wire, the lit item walks first -> last -> first after
 * the build (useHot). Held (?still): everything of the slide shown, nothing lit, nothing moving. Orange = the part being
 * explained (and, on D_T20, the blocked transfer).
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('s17d')
const PERIOD = 3
const nm = (n: string) => n as Ico3DName

/** a 3D icon (or official mark) on its plinth with its Title Case tag under (or above) it; the TILE centred on (x, y) */
function Node({ x, y, label, icon, node, size = 56, k = 0.74, on = true, lit = false, warm = false, loop = 'bob', d = 0, badge, tagUp = false, mark, w = 120, wrap = false }: { x: number; y: number; label?: string; icon?: string; node?: ReactNode; size?: number; k?: number; on?: boolean; lit?: boolean; warm?: boolean; loop?: Loop; d?: number; badge?: Badge; tagUp?: boolean; mark?: string; w?: number; wrap?: boolean }) {
  const tile = mark ? <MarkTile src={mark} size={size} lit={lit} /> : (
    <Plinth size={size} lit={lit} warm={warm}>
      {node ?? <Ico3D name={nm(icon ?? 'doc')} size={Math.round(size * k)} loop={loop} d={d} badge={badge} />}
    </Plinth>
  )
  const t = label ? <span style={{ ...tag(14), ...(wrap ? { whiteSpace: 'normal', lineHeight: 1.15 } : {}) }}>{label}</span> : null
  const tagH = wrap ? 34 : 17
  return (
    <Show on={on} style={{ position: 'absolute', left: x - w / 2, top: tagUp && t ? y - size / 2 - tagH - 8 : y - size / 2, width: w, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {tagUp && t && <div style={{ height: tagH, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>{t}</div>}
      {tile}
      {!tagUp && t}
    </Show>
  )
}

/** a row inside a card: a small 3D icon and its Title Case tag; rings orange while lit */
function Row({ icon, label, lit = false, on = true, d = 0, badge, h = 28, delay = 0 }: { icon: string; label: string; lit?: boolean; on?: boolean; d?: number; badge?: Badge; h?: number; delay?: number }) {
  const instant = useInstant()
  return (
    <Show on={on} delay={delay} lift={4}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: h, padding: '0 10px', borderRadius: 10, background: lit ? '#FFF3EA' : '#F4F7FF', boxShadow: lit ? `inset 0 0 0 2px ${ORANGE}` : 'inset 0 0 0 1px #DFE7F7', transition: instant ? 'none' : `box-shadow 420ms ${EASE}, background 420ms ${EASE}` }}>
        <Ico3D name={nm(icon)} size={h - 6} loop="bob" d={d} badge={badge} />
        <span style={{ ...tag(14), textAlign: 'left' }}>{label}</span>
      </div>
    </Show>
  )
}

/** a grey placeholder row (a clause still to come: no words before the point that names it) */
const Ghost = ({ h = 28, w = 96 }: { h?: number; w?: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: h, padding: '0 10px', borderRadius: 10, background: '#F6F8FC', boxShadow: 'inset 0 0 0 1px #E6ECF7' }}>
    <span style={{ width: h - 10, height: h - 10, borderRadius: 7, background: '#E3E9F5' }} />
    <span style={{ width: w, height: 8, borderRadius: 99, background: '#E3E9F5' }} />
  </div>
)

const heading = (size: number, color: string = colors.ink): CSSProperties => ({ fontFamily: FONT, fontWeight: 700, fontSize: size, lineHeight: 1.2, color, whiteSpace: 'nowrap' })

/** a white circle holding a small icon, pinned to a corner of a tile */
const Chip = ({ x, y, icon, on = true, size = 32, loop = 'pulse', d = 0 }: { x: number; y: number; icon: string; on?: boolean; size?: number; loop?: Loop; d?: number }) => (
  <Show on={on} style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: 5 }}>
    <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6)' }}>
      <Ico3D name={nm(icon)} size={size - 8} loop={loop} d={d} t={2.4} />
    </span>
  </Show>
)

/* ================================================================== slides 39-40 · D_T16 · five pillars */

/* tags above the five tiles (so no wire crosses a tag), each tile drops to one bus, the bus runs into the shared card */
const P5 = { W: 526, H: 330, S: 56, TY: 98, BUS: 160, CY: 196, CH: 114, CX: 63, CW: 400 }
const P5_X = [66, 164.5, 263, 361.5, 460]
const P5_ITEM: { label: string; icon: string; over?: string }[] = [
  { label: 'ISO 27001', icon: 'certificate' },
  { label: 'SOC 2', icon: 'report' },
  { label: 'GDPR / HIPAA', icon: 'shield', over: 'health' },
  { label: 'DPDP Act', icon: 'gavel' },
  { label: 'Data Residency', icon: 'globe', over: 'pin' },
]
/* which press shows each tile: part 1 = ISO + SOC 2, GDPR / HIPAA, DPDP; part 2 = Data Residency */
const P5_GROUP1 = [1, 1, 2, 3, 0]
const P5_WIRE = (x: number): Pt[] => [[x, P5.TY + P5.S / 2], [x, P5.BUS], [P5.W / 2, P5.BUS]]
const P5_RIDE = P5_X.map((x, i) => K.ride(`p5-${i}`, [...P5_WIRE(x), [P5.W / 2, P5.CY - 4]], 0.1 + i * 0.35, 1.4 + i * 0.35, PERIOD))

/** an icon with a smaller one laid on its lower-right corner, sized for a plinth */
const Duo = ({ main, over, size, d = 0 }: { main: string; over: string; size: number; d?: number }) => {
  const o = Math.round(size * 0.52)
  return (
    <span style={{ position: 'relative', display: 'inline-grid', placeItems: 'center', width: size, height: size }}>
      <Ico3D name={nm(main)} size={size} loop="bob" d={d} />
      <span style={{ position: 'absolute', right: -o * 0.3, bottom: -o * 0.25, display: 'grid', placeItems: 'center', width: o + 4, height: o + 4, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6)' }}>
        <Ico3D name={nm(over)} size={o} loop="pulse" d={d + 0.4} t={2.4} />
      </span>
    </span>
  )
}

const D_T16: Fig = (p) => {
  const step = Number(p.step ?? 0)
  const part = Number(p.part ?? 1)
  const held = useHeld()
  const instant = useInstant()
  const n = part === 1 ? 3 : 2
  const hot = useHot(n, step, PERIOD * 1000)
  const all = held || step >= n
  const tileOn = (i: number) => (part === 1 ? i < 4 && (all || step >= P5_GROUP1[i]) : i < 4 || all || step >= 1)
  const tileLit = (i: number) => (part === 1 ? hot >= 0 && P5_GROUP1[i] === hot + 1 : i === 4 && hot === 0)
  /* the card's two halves stand from the start (no empty card); point 5 lights the card */
  const halves = true
  const cardLit = part === 2 && hot === 1
  const anyTile = P5_X.some((_, i) => tileOn(i))
  const half = (icon: string, label: string, d: number) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Plinth size={44}><Ico3D name={nm(icon)} size={32} loop="bob" d={d} /></Plinth>
      <span style={{ ...tag(15), textAlign: 'left' }}>{label}</span>
    </div>
  )
  return (
    <Frame w={P5.W} h={P5.H}>
      {/* drops and the bus */}
      {P5_X.map((x, i) => <Wire key={i} pts={P5_WIRE(x)} on={tileOn(i)} head={0} lit={tileLit(i)} color="#9FB3D6" />)}
      <Wire pts={[[P5.W / 2, P5.BUS], [P5.W / 2, P5.CY]]} on={anyTile} head={10} lit={cardLit} />
      <Junction x={P5.W / 2} y={P5.BUS} on={anyTile} lit={cardLit} />
      {P5_RIDE.map((c, i) => <Token key={i} cls={c} on={tileOn(i) && !held} size={9} tone={tileLit(i) ? ORANGE : colors.brand} />)}
      {/* the five pillars, tags above */}
      {P5_ITEM.map((it, i) =>
        part === 1 && i === 4 ? (
          /* Data Residency comes with T16-B: its slot waits, empty, so the row stays whole */
          <span key={i} aria-hidden style={{ position: 'absolute', left: P5_X[i] - P5.S / 2, top: P5.TY - P5.S / 2, width: P5.S, height: P5.S, borderRadius: 16, boxShadow: 'inset 0 0 0 2px #DCE4F4', background: '#F8FAFE' }} />
        ) : (
          <Node key={i} x={P5_X[i]} y={P5.TY} label={it.label} tagUp wrap w={96} size={P5.S} on={tileOn(i)} lit={tileLit(i)} d={i * 0.4}
            node={it.over ? <Duo main={it.icon} over={it.over} size={36} d={i * 0.4} /> : undefined} icon={it.icon} loop={i % 2 ? 'tilt' : 'bob'} />
        ),
      )}
      {/* the shared card */}
      <Panel x={P5.CX} y={P5.CY} w={P5.CW} h={P5.CH} lit={cardLit}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
          <Ico3D name="scale" size={30} loop="swing" t={3} />
          <span style={heading(17)}>Shared Responsibility</span>
        </div>
        <div style={{ position: 'absolute', left: 20, right: 20, top: 56, height: 44, display: 'grid', gridTemplateColumns: '1fr 2px 1fr', alignItems: 'center', justifyItems: 'center', opacity: halves ? 1 : 0, transform: halves ? 'none' : 'translateY(6px)', transition: instant ? 'none' : `opacity 520ms ${EASE}, transform 520ms ${EASE}` }}>
          {half('building', 'Provider', 0.2)}
          <span style={{ width: 2, height: 36, borderRadius: 2, background: '#E1E8F6' }} />
          {half('gear', 'Customer', 0.7)}
        </div>
      </Panel>
    </Frame>
  )
}

/* ================================================================== slide 41 · D_T17 · two audit standards */

const A7 = { W: 546, H: 330, PY: 20, PH: 176, PW: 243, LX: 20, RX: 283, AY: 252, AS: 52 }
const A7_LC = A7.LX + A7.PW / 2
const A7_RC = A7.RX + A7.PW / 2
const A7_AL: Pt[] = [[A7_LC, A7.PY + A7.PH], [A7_LC, A7.AY], [A7.W / 2 - A7.AS / 2, A7.AY]]
const A7_AR: Pt[] = [[A7_RC, A7.PY + A7.PH], [A7_RC, A7.AY], [A7.W / 2 + A7.AS / 2, A7.AY]]
const A7_R1 = K.ride('a7-l', A7_AL, 0.1, 1.3, PERIOD)
const A7_R2 = K.ride('a7-r', A7_AR, 0.6, 1.8, PERIOD)

/** a time track: Type I = one marker at a point in time, Type II = a period bar */
function Track({ kind, on }: { kind: 1 | 2; on: boolean }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'relative', display: 'block', flex: 1, height: 18 }}>
      <span style={{ position: 'absolute', left: 0, right: 0, top: 7, height: 4, borderRadius: 99, background: '#DCE4F4' }} />
      {kind === 1 ? (
        <span style={{ position: 'absolute', left: '46%', top: 1, width: 16, height: 16, borderRadius: 99, background: colors.brand, boxShadow: '0 0 0 3px #FFFFFF, 0 4px 8px -3px rgba(31,64,140,0.6)', transform: on ? 'scale(1)' : 'scale(0.4)', opacity: on ? 1 : 0, transition: instant ? 'none' : `transform 520ms ${EASE}, opacity 520ms ${EASE}` }} />
      ) : (
        <span style={{ position: 'absolute', left: '12%', width: '76%', top: 4, height: 10, borderRadius: 99, background: `linear-gradient(90deg, #6F95FF, ${colors.brand})`, transformOrigin: '0 50%', transform: on ? 'scaleX(1)' : 'scaleX(0)', transition: instant ? 'none' : `transform 820ms ${EASE}` }} />
      )}
    </span>
  )
}

const D_T17: Fig = (p) => {
  const step = Number(p.step ?? 0)
  const held = useHeld()
  const hot = useHot(4, step, PERIOD * 1000)
  const on = (k: number) => held || step >= k
  const row = (icon: string, label: string, kind: 1 | 2, k: number, lit: boolean) => (
    <Show on={on(k)} lift={4}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 28, padding: '0 10px', borderRadius: 10, background: lit ? '#FFF3EA' : '#F4F7FF', boxShadow: lit ? `inset 0 0 0 2px ${ORANGE}` : 'inset 0 0 0 1px #DFE7F7' }}>
        <Ico3D name={nm(icon)} size={22} loop="bob" d={k * 0.3} />
        <span style={{ ...tag(14), textAlign: 'left', width: 54 }}>{label}</span>
        <Track kind={kind} on={on(k)} />
      </div>
    </Show>
  )
  return (
    <Frame w={A7.W} h={A7.H}>
      {/* ISO 27001: the certificate, stamped by an accredited body */}
      <Panel x={A7.LX} y={A7.PY} w={A7.PW} h={A7.PH} lit={hot === 0}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 16, textAlign: 'center', ...heading(18) }}>ISO 27001</div>
        <div style={{ position: 'absolute', left: 40, top: 58, width: 76, height: 76, display: 'grid', placeItems: 'center' }}>
          <Ico3D name="certificate" size={76} loop="float" d={0.1} />
        </div>
        <Show on={on(1)} style={{ position: 'absolute', left: 136, top: 66, width: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Plinth size={48} lit={hot === 0}><Ico3D name="stamp" size={36} loop="beat" t={2.6} /></Plinth>
          <span style={tag(14)}>Accredited</span>
        </Show>
      </Panel>
      {/* SOC 2: the report, then Type I (one point in time) and Type II (a period) */}
      <Panel x={A7.RX} y={A7.PY} w={A7.PW} h={A7.PH}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 16, textAlign: 'center', ...heading(18) }}>SOC 2</div>
        <div style={{ position: 'absolute', left: A7.PW / 2 - 26, top: 46, width: 52, height: 52, display: 'grid', placeItems: 'center' }}>
          <Ico3D name="report" size={52} loop="float" d={0.6} />
        </div>
        <div style={{ position: 'absolute', left: 20, right: 20, top: 108, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {row('clock', 'Type I', 1, 2, hot === 1)}
          {row('calendar', 'Type II', 2, 3, hot === 2)}
        </div>
      </Panel>
      {/* both published through AWS Artifact, for customers to download */}
      <Wire pts={A7_AL} on={on(4)} head={10} lit={hot === 3} />
      <Wire pts={A7_AR} on={on(4)} head={10} lit={hot === 3} delay={150} />
      <Token cls={A7_R1} on={on(4) && !held} size={9} tone={hot === 3 ? ORANGE : colors.brand} />
      <Token cls={A7_R2} on={on(4) && !held} size={9} tone={hot === 3 ? ORANGE : colors.brand} />
      <Chip x={A7_LC - 30} y={(A7.PY + A7.PH + A7.AY) / 2} icon="download" on={on(4)} />
      <Chip x={A7_RC + 30} y={(A7.PY + A7.PH + A7.AY) / 2} icon="download" on={on(4)} d={0.5} />
      <Node x={A7.W / 2} y={A7.AY} label="AWS Artifact" mark={artifactMark} size={A7.AS} on={on(4)} lit={hot === 3} />
    </Frame>
  )
}

/* ================================================================== slides 44-45 · D_T19 · three laws */

const L9 = { W: 546, H: 300, Y: 20, PH: 260, PW: 160, GAP: 13 }
const L9_X = [20, 20 + L9.PW + L9.GAP, 20 + 2 * (L9.PW + L9.GAP)]
type Clause = { icon: string; label: string; badge?: Badge }
const L9_LAW: { flag: string; name: string; rows: Clause[] }[] = [
  { flag: 'flag-eu', name: 'GDPR', rows: [{ icon: 'eye', label: 'Access' }, { icon: 'docfix', label: 'Correction' }, { icon: 'trash', label: 'Erasure' }, { icon: 'download', label: 'Portability' }, { icon: 'clock', label: '72 Hours' }] },
  { flag: 'flag-in', name: 'DPDP Act', rows: [{ icon: 'idcard', label: 'Fiduciary' }, { icon: 'consent', label: 'Consent' }] },
  { flag: 'flag-us', name: 'HIPAA', rows: [{ icon: 'health', label: 'Health Data' }, { icon: 'doc', label: 'Signed BAA', badge: 'check' }, { icon: 'cloud', label: 'Eligible', badge: 'check' }] },
]
/* the press that shows each row: [law][row]; 0 = already there; -1 = not on this frame (a grey placeholder) */
const L9_AT: Record<number, number[][]> = {
  1: [[1, 1, 1, 1, 2], [-1, -1], [-1, -1, -1]],
  2: [[0, 0, 0, 0, 0], [1, 2], [3, 3, 3]],
}

const D_T19: Fig = (p) => {
  const step = Number(p.step ?? 0)
  const part = Number(p.part ?? 1)
  const held = useHeld()
  const instant = useInstant()
  const n = part === 1 ? 2 : 3
  const hot = useHot(n, step, PERIOD * 1000)
  const at = L9_AT[part]
  return (
    <Frame w={L9.W} h={L9.H}>
      {L9_LAW.map((law, li) => {
        const active = at[li].some((a) => a > 0)
        const panelLit = hot >= 0 && at[li].some((a) => a === hot + 1)
        return (
          <Panel key={law.name} x={L9_X[li]} y={L9.Y} w={L9.PW} h={L9.PH} lit={panelLit && li === 2}>
            <div style={{ position: 'absolute', left: 14, top: 12, display: 'flex', alignItems: 'center', gap: 8, opacity: active || part === 2 || li === 0 ? 1 : 0.85 }}>
              <Ico3D name={nm(law.flag)} size={40} loop="swing" d={li * 0.6} t={3.4} />
              <span style={heading(17)}>{law.name}</span>
            </div>
            <span style={{ position: 'absolute', left: 14, right: 14, top: 62, height: 2, borderRadius: 2, background: '#E4EAF6' }} />
            <div style={{ position: 'absolute', left: 14, right: 14, top: 72, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {law.rows.map((r, ri) => {
                const a = at[li][ri]
                const shown = a >= 0 && (held || a === 0 || step >= a)
                /* a row still to come waits as a grey placeholder (no words before the point that names it) */
                return (
                  <div key={ri} style={{ position: 'relative', height: 28 }}>
                    <div style={{ position: 'absolute', inset: 0, opacity: shown ? 0 : 1, transition: instant ? 'none' : `opacity 360ms ${EASE}` }}><Ghost w={ri % 2 ? 64 : 84} /></div>
                    {a >= 0 && <div style={{ position: 'absolute', inset: 0 }}><Row icon={r.icon} label={r.label} badge={r.badge} on={shown} lit={hot >= 0 && a === hot + 1 && li !== 2} d={ri * 0.3 + li * 0.5} /></div>}
                  </div>
                )
              })}
            </div>
          </Panel>
        )
      })}
    </Frame>
  )
}

/* ================================================================== slide 47 · D_T20 · residency and transfers */

const R0 = { W: 546, H: 330, Y: 30, PH: 270, CY: 165, DB: 64, LK: 48, GT: 52 }
const R0_EU = { x: 20, w: 210 }
const R0_IN = { x: 316, w: 210 }
const R0_EUDB = 125
const R0_INDB = 372
const R0_GATE = 477
const R0_LOCK = 273
const R0_STOP: Pt[] = [[R0_EUDB + R0.DB / 2, R0.CY], [R0_EU.x + R0_EU.w - 16, R0.CY]]
const R0_CROSS1: Pt[] = [[R0_EUDB + R0.DB / 2, R0.CY], [R0_LOCK - R0.LK / 2, R0.CY]]
const R0_CROSS2: Pt[] = [[R0_LOCK + R0.LK / 2, R0.CY], [R0_INDB - R0.DB / 2, R0.CY]]
const R0_OUT: Pt[] = [[R0_INDB + R0.DB / 2, R0.CY], [R0_GATE - R0.GT / 2, R0.CY]]
const R0_RS = K.ride('r0-s', R0_STOP, 0.1, 1.2, PERIOD)
const R0_R1 = K.ride('r0-1', [...R0_CROSS1, ...R0_CROSS2], 0.1, 1.8, PERIOD)
const R0_R2 = K.ride('r0-2', R0_OUT, 1.9, 2.6, PERIOD)

/** a region: a soft dashed boundary, its flag and name in the corner */
const Region = ({ x, w, flag, name, lit }: { x: number; w: number; flag: string; name: string; lit: boolean }) => {
  const instant = useInstant()
  return (
    <>
      <div aria-hidden style={{ position: 'absolute', left: x, top: R0.Y, width: w, height: R0.PH, borderRadius: 22, background: 'linear-gradient(180deg, #F7FAFF 0%, #EDF3FF 100%)', border: `2px dashed ${lit ? ORANGE : '#9DB6EE'}`, transition: instant ? 'none' : `border-color 420ms ${EASE}` }} />
      <div style={{ position: 'absolute', left: x + 18, top: R0.Y + 16, display: 'flex', alignItems: 'center', gap: 8, zIndex: 3 }}>
        <Ico3D name={nm(flag)} size={36} loop="swing" t={3.4} d={x / 300} />
        <span style={heading(17)}>{name}</span>
      </div>
    </>
  )
}

const D_T20: Fig = (p) => {
  const step = Number(p.step ?? 0)
  const held = useHeld()
  const hot = useHot(4, step, PERIOD * 1000)
  const on = (k: number) => held || step >= k
  const stopped = on(1) && !on(2)
  return (
    <Frame w={R0.W} h={R0.H}>
      <Region x={R0_EU.x} w={R0_EU.w} flag="flag-eu" name="EU" lit={hot === 0} />
      <Region x={R0_IN.x} w={R0_IN.w} flag="flag-in" name="India" lit={hot === 2} />
      {/* 1 · a transfer out of the EU stops at the boundary */}
      <Wire pts={R0_STOP} on={stopped} head={10} color={ORANGE} />
      <Token cls={R0_RS} on={stopped && !held} size={9} tone={ORANGE} />
      <Show on={stopped} style={{ position: 'absolute', left: R0_EU.x + R0_EU.w - 16, top: R0.CY - 16, width: 32, height: 32, zIndex: 5 }}>
        <span style={{ display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: 99, background: '#FFFFFF', boxShadow: `inset 0 0 0 2px ${ORANGE}, 0 4px 10px -5px rgba(31,64,140,0.6)` }}>
          <Ico3D name="ban" size={24} loop="pulse" t={2.2} />
        </span>
      </Show>
      {/* 2 · an SCC lets it cross */}
      <Wire pts={R0_CROSS1} on={on(2)} head={10} lit={hot === 1} />
      <Wire pts={R0_CROSS2} on={on(2)} head={10} lit={hot === 1} delay={300} />
      <Token cls={R0_R1} on={on(2) && !held} size={9} tone={hot === 1 ? ORANGE : colors.brand} />
      <Node x={R0_LOCK} y={R0.CY} label="SCC" tagUp icon="lock" size={R0.LK} on={on(2)} lit={hot === 1} loop="beat" w={70} />
      {/* 3 · India: a gate for transfers to specific countries */}
      <Wire pts={R0_OUT} on={on(3)} head={10} lit={hot === 2} />
      <Token cls={R0_R2} on={on(3) && !held} size={9} tone={hot === 2 ? ORANGE : colors.brand} />
      <Node x={R0_GATE} y={R0.CY} label="Restrict" icon="gate" size={R0.GT} on={on(3)} lit={hot === 2} loop="tilt" w={80} />
      {/* the data, stored and processed in each region */}
      <Node x={R0_EUDB} y={R0.CY} label="Data" icon="database" size={R0.DB} lit={hot === 3} d={0.2} />
      <Node x={R0_INDB} y={R0.CY} label="Data" icon="database" size={R0.DB} lit={hot === 3} d={0.8} />
      {/* 4 · security controls stay on, alongside residency */}
      <Chip x={R0_EUDB + R0.DB / 2 - 2} y={R0.CY - R0.DB / 2 + 2} icon="shield" on={on(4)} size={34} />
      <Chip x={R0_INDB + R0.DB / 2 - 2} y={R0.CY - R0.DB / 2 + 2} icon="shield" on={on(4)} size={34} d={0.5} />
    </Frame>
  )
}

/* ================================================================== slide 48 · D_T21 · who proves what */

const W1 = { W: 526, H: 330, Y: 20, PH: 290, PW: 186, LX: 20, RX: 320, AY: 90, AS: 48, UY: 232, US: 60 }
const W1_MID = W1.W / 2
const W1_L: Clause[] = [{ icon: 'building', label: 'Data Centres' }, { icon: 'server', label: 'Hardware' }, { icon: 'certificate', label: 'Certifications' }, { icon: 'report', label: 'Audit Reports' }]
const W1_R: Clause[] = [{ icon: 'gear', label: 'Configuration' }, { icon: 'lock', label: 'Encryption' }, { icon: 'policy', label: 'Policies' }, { icon: 'log', label: 'Logs' }]
const W1_TOA: Pt[] = [[W1.LX + W1.PW, W1.AY], [W1_MID - W1.AS / 2, W1.AY]]
const W1_TOU: Pt[] = [[W1_MID, W1.AY + W1.AS / 2 + 32], [W1_MID, W1.UY - W1.US / 2]]
const W1_TOR: Pt[] = [[W1_MID + W1.US / 2, W1.UY], [W1.RX, W1.UY]]
const W1_R1 = K.ride('w1-a', [...W1_TOA], 0.1, 0.8, PERIOD)
const W1_R2 = K.ride('w1-u', W1_TOU, 0.9, 1.6, PERIOD)
const W1_R3 = K.ride('w1-r', W1_TOR, 1.7, 2.3, PERIOD)

const D_T21: Fig = (p) => {
  const step = Number(p.step ?? 0)
  const held = useHeld()
  const hot = useHot(4, step, PERIOD * 1000)
  const on = (k: number) => held || step >= k
  /* point 4: the auditor's magnifier passes over logs, encryption and policies (rows 1-3 of the customer side) */
  const sweep = useCycle(3, hot === 3, 900)
  const side = (x: number, title: string, rows: Clause[], k: number, lit: boolean, sweepRows: boolean) => (
    <Panel x={x} y={W1.Y} w={W1.PW} h={W1.PH} lit={lit}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 14, textAlign: 'center', ...heading(17) }}>{title}</div>
      <div style={{ position: 'absolute', left: 16, right: 16, top: 52, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map((r, i) => (
          <Show key={r.label} on={on(k)} delay={i * 110} lift={4}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 44 }}>
              <Plinth size={44} lit={sweepRows && i >= 1 && sweep === i - 1}><Ico3D name={nm(r.icon)} size={32} loop="bob" d={i * 0.35 + x / 400} /></Plinth>
              <span style={{ ...tag(14), textAlign: 'left' }}>{r.label}</span>
            </div>
          </Show>
        ))}
      </div>
    </Panel>
  )
  return (
    <Frame w={W1.W} h={W1.H}>
      {side(W1.LX, 'Provider Proves', W1_L, 1, hot === 0, false)}
      {side(W1.RX, 'Customer Proves', W1_R, 2, hot === 1, true)}
      {/* 3 · AWS Artifact supplies the provider's reports to the auditor */}
      <Wire pts={W1_TOA} on={on(3)} head={9} lit={hot === 2} />
      <Wire pts={W1_TOU} on={on(3)} head={10} lit={hot === 2} delay={250} />
      <Token cls={W1_R1} on={on(3) && !held} size={9} tone={hot === 2 ? ORANGE : colors.brand} />
      <Token cls={W1_R2} on={on(3) && !held} size={9} tone={hot === 2 ? ORANGE : colors.brand} />
      <Node x={W1_MID} y={W1.AY} label="AWS Artifact" mark={artifactMark} size={W1.AS} on={on(3)} lit={hot === 2} w={104} />
      {/* the auditor, between the two halves */}
      <Node x={W1_MID} y={W1.UY} label="Auditor" size={W1.US} lit={hot === 3} w={90} node={<Duo main="user" over="search" size={38} d={0.3} />} />
      {/* 4 · the auditor examines the customer's evidence directly */}
      <Wire pts={W1_TOR} on={on(4)} head={9} lit={hot === 3} />
      <Token cls={W1_R3} on={on(4) && !held} size={9} tone={hot === 3 ? ORANGE : colors.brand} />
    </Frame>
  )
}

export const figures: Record<string, Fig> = { D_T16, D_T17, D_T19, D_T20, D_T21 }
export const css = `
${K.css()}
.cc-still [class*="s17d-"], .deck-thumb [class*="s17d-"] { animation: none !important; opacity: 0 !important; }
`
