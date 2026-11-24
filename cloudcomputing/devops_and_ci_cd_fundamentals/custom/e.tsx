import { type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, Frame, Show, Plinth, MarkTile, Panel, Wire, Token, keyframes, loopCls, loopVars, tag, heading, useHeld, useHot, type Pt } from '@/engine/figkit'
import ghMark from '../images/tech-github.png'
import ghaMark from '../images/tech-githubactions.svg'
import jenkinsMark from '../images/tech-jenkins.png'
import gitlabMark from '../images/tech-gitlab.svg'
import codebuildMark from '../images/aws-codebuild.svg'

/*
 * SESSION 22 · builder E: TR 14 (pull requests and review) and TR 17 (why CI exists) technical figures.
 * Standing corrections 13-17: 3D icons on plinth tiles, official marks on white tiles, >= 20 px equal padding,
 * orthogonal wires from the box constants, a flow dot on every live wire, the lit item walking first -> last -> first
 * after the build (starting on the LAST item, S21 `useBuild`). Loops are transform / opacity on HTML elements only.
 * Held (?still): the full picture, nothing lit, nothing moving. Failure is the template orange (rule 51), a pass green.
 * Class prefix `s22e-`.
 *
 *   slide 31 E_T14   566 x 380  a drawn GitHub Pull Requests page: diff view (removed / added line bars) | reviewer,
 *                               comment bubble pinned to a line, Approve / Request Changes (2)
 *   slide 32 E_T14B  566 x 380  the same page: required approval + padlocked Merge | status checks with the GitHub
 *                               Actions mark, spinner -> tick (2)
 *   slide 37 E_T17   566 x 380  Developer laptop -> push (merge disc) -> CI server: Build (gear) -> Test (checklist),
 *                               a tick or an orange cross back to the developer; the build's package below (2)
 *   slide 38 E_T17B  566 x 380  the same CI server: the test rows ticking | the GitHub Actions, Jenkins, GitLab and AWS
 *                               CodeBuild marks inside the box (2)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('s22e')
const KF: string[] = []
const GREEN = colors.success
const MONO = "'Fira Code', ui-monospace, monospace"
const EZ = 'cubic-bezier(0.45,0,0.55,1)'
const W0 = 566
const H0 = 380

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)
const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })

/** the build of a figure: the step, the lit item, held (S21 e.tsx: the walk starts on the LAST item) */
function useBuild(p: Record<string, unknown>, period = 1800) {
  const cnt = Number(p.steps ?? 1)
  const held = useHeld()
  const step = held ? cnt : stepOf(p)
  const raw = useHot(cnt, stepOf(p), period)
  const hot = raw >= 0 && stepOf(p) >= cnt ? (raw + cnt - 1) % cnt : raw
  return { step, hot, held, live: !held }
}

/** an opacity loop (percent -> opacity) of `period` seconds */
function fade(name: string, period: number, frames: [number, number][]) {
  const cls = `s22e-${name}`
  KF.push(`@keyframes ${cls} { ${frames.map(([at, o]) => `${at}% { opacity: ${o} }`).join(' ')} }\n.${cls} { animation: ${cls} ${period}s ${EZ} infinite; }`)
  return cls
}
/** a transform + opacity loop */
function move(name: string, period: number, frames: [number, string, number][], ease = EZ) {
  const cls = `s22e-${name}`
  KF.push(`@keyframes ${cls} { ${frames.map(([at, t, o]) => `${at}% { transform: ${t}; opacity: ${o} }`).join(' ')} }\n.${cls} { animation: ${cls} ${period}s ${ease} infinite; }`)
  return cls
}

/** the engine's 3D cross turned to the template's orange (blocked = orange, never red) */
const OrangeCross = ({ size }: { size: number }) => (
  <span style={{ display: 'grid', filter: 'hue-rotate(28deg) saturate(1.15) brightness(1.06)' }}>
    <Ico3D name="cross" size={size} loop="none" />
  </span>
)

/** a white disc holding a 3D icon (or the orange cross), centred on (x, y) */
function Disc({ x, y, size = 26, icon, loop = 'pulse', d = 0, warn = false, lit = false, cls, z = 6, on = true }: { x: number; y: number; size?: number; icon?: Ico3DName; loop?: Loop; d?: number; warn?: boolean; lit?: boolean; cls?: string; z?: number; on?: boolean }) {
  const instant = useInstant()
  return (
    <span style={{ ...box(x - size / 2, y - size / 2, size, size), zIndex: z, opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE}` }}>
      <span className={cls} style={{ position: 'absolute', inset: 0, borderRadius: 99, background: '#FFFFFF', boxShadow: lit ? `inset 0 0 0 2.5px ${ORANGE}, 0 6px 14px -6px rgba(255,138,61,0.7)` : '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6', display: 'grid', placeItems: 'center', transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
        {warn ? <OrangeCross size={size - 6} /> : <Ico3D name={icon ?? 'check'} size={size - 6} loop={loop} d={d} />}
      </span>
    </span>
  )
}

/** a 3D icon on its plinth, the TILE centred on (x, y), its one-word tag above it */
function Node({ x, y, icon, label, size = 64, lit = false, loop = 'bob', t, d = 0, tagAbove = true }: { x: number; y: number; icon: Ico3DName; label: string; size?: number; lit?: boolean; loop?: Loop; t?: number; d?: number; tagAbove?: boolean }) {
  return (
    <>
      <div style={{ ...box(x - size / 2, y - size / 2, size, size), zIndex: 4 }}>
        <Plinth size={size} lit={lit}><Ico3D name={icon} size={Math.round(size * 0.74)} loop={loop} t={t} d={d} /></Plinth>
      </div>
      <div style={{ ...box(x - 60, tagAbove ? y - size / 2 - 26 : y + size / 2 + 8, 120, 18), zIndex: 4, display: 'grid', placeItems: 'center' }}>
        <span style={tag(15)}>{label}</span>
      </div>
    </>
  )
}

/** a wire on its own layer above the cards (a Panel is z 2 and would hide a wire drawn inside it) */
const Wl = (props: Parameters<typeof Wire>[0]) => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}><Wire {...props} /></div>
)

/* ================================================================== TR 14 · the drawn Pull Requests page */

const PG = { x: 20, y: 20, w: 526, h: 340 } // the page (padding 20 round the frame)
const IN = { l: 40, r: 526, t: 20, b: 340 } // its inner box (padding 20)
const HDR_Y = 48 // header centre line
const SEP_Y = 78
const DF = { x: 40, y: 92, w: 282, h: 248 } // the diff view card
const ROW0 = 132 // first diff row top
const ROW_H = 24
const ROW_GAP = 4
const rowY = (i: number) => ROW0 + i * (ROW_H + ROW_GAP) + ROW_H / 2 // a row's centre line
const RC = { x: 342, w: 184 } // the right column (ends at 526)
const CMT_ROW = 2 // the line the reviewer comments on
const CMT_X = 300 // the comment marker's centre on that line
type Kind = 'c' | 'r' | 'a'
const DIFF: [Kind, number][] = [['c', 0.62], ['r', 0.7], ['a', 0.78], ['a', 0.52], ['c', 0.44], ['r', 0.6], ['a', 0.74]]
const KIND: Record<Kind, { bg: string; bar: string; sign: string; ink: string }> = {
  c: { bg: 'transparent', bar: '#CBD7EE', sign: '', ink: '#9AA8C4' },
  r: { bg: '#FFF1E6', bar: '#FFC49A', sign: '−', ink: ORANGE },
  a: { bg: '#E6F6EC', bar: '#8FD8AA', sign: '+', ink: GREEN },
}

/* the diff scan: a soft band walks down the lines (5 s) */
const SCAN = move('scan', 5, [[0, `translateY(0px)`, 0], [6, `translateY(0px)`, 1], [88, `translateY(${(DIFF.length - 1) * (ROW_H + ROW_GAP)}px)`, 1], [96, `translateY(${(DIFF.length - 1) * (ROW_H + ROW_GAP)}px)`, 0], [100, `translateY(0px)`, 0]])
/* the comment's ripple */
const CMT_RIP = move('cmt-rip', 2.8, [[0, 'scale(0.9)', 0.85], [100, 'scale(1.7)', 0]], 'ease-out')

/** the page chrome: the GitHub mark, the heading, the branch pair feature -> main */
function PageHeader() {
  return (
    <>
      <div style={{ ...box(IN.l, HDR_Y - 16, 32, 32), zIndex: 4 }}><MarkTile src={ghMark} size={32} scale={0.72} /></div>
      <div style={{ ...box(IN.l + 44, HDR_Y - 11, 140, 22), zIndex: 4, display: 'flex', alignItems: 'center' }}>
        <span style={{ ...heading(17), whiteSpace: 'nowrap' }}>Pull Request</span>
      </div>
      {/* the branch pair, right-aligned: [feature] -> [main] */}
      <div style={{ ...box(IN.r - 76, HDR_Y - 12, 76, 24), zIndex: 4, borderRadius: 8, background: '#EEF3FF', boxShadow: 'inset 0 0 0 1px #D3DEF6', display: 'grid', placeItems: 'center' }}>
        <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: colors.brandDeep, fontVariantLigatures: 'none' }}>main</span>
      </div>
      <Wl pts={[[IN.r - 76 - 34, HDR_Y], [IN.r - 76 - 6, HDR_Y]]} head={8} width={2.2} />
      <div style={{ ...box(IN.r - 76 - 34 - 82, HDR_Y - 12, 82, 24), zIndex: 4, borderRadius: 8, background: '#EEF3FF', boxShadow: 'inset 0 0 0 1px #D3DEF6', display: 'grid', placeItems: 'center' }}>
        <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: colors.brandDeep, fontVariantLigatures: 'none' }}>feature</span>
      </div>
      <div aria-hidden style={{ ...box(IN.l, SEP_Y, IN.r - IN.l, 1.5), zIndex: 3, background: '#E1E8F6', borderRadius: 2 }} />
    </>
  )
}

/** the diff view card: removed lines warm, added lines green, context grey; `scan` runs the walking band */
function DiffCard({ lit, scan, marker, markerLit }: { lit: boolean; scan: boolean; marker: boolean; markerLit: boolean }) {
  return (
    <>
      <Panel x={DF.x} y={DF.y} w={DF.w} h={DF.h} lit={lit} radius={14} />
      <div style={{ ...box(DF.x + 16, DF.y + 12, DF.w - 32, 24), zIndex: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Ico3D name="list" size={22} loop="bob" />
        <span style={{ ...heading(15), whiteSpace: 'nowrap' }}>Diff View</span>
      </div>
      {DIFF.map(([k, f], i) => {
        const s = KIND[k]
        const x0 = DF.x + 12
        const barX = x0 + 26
        const barMax = CMT_X - 16 - barX
        return (
          <div key={i} style={{ ...box(x0, rowY(i) - ROW_H / 2, DF.w - 24, ROW_H), zIndex: 3, borderRadius: 6, background: s.bg }}>
            <span style={{ position: 'absolute', left: 6, top: 0, width: 14, height: ROW_H, display: 'grid', placeItems: 'center', fontFamily: MONO, fontSize: 15, fontWeight: 700, color: s.ink, lineHeight: 1 }}>{s.sign}</span>
            <span aria-hidden style={{ position: 'absolute', left: barX - x0, top: ROW_H / 2 - 4, width: Math.round(barMax * f), height: 8, borderRadius: 5, background: s.bar }} />
          </div>
        )
      })}
      {scan && (
        <span aria-hidden style={{ ...box(DF.x + 8, ROW0 - 2, DF.w - 16, ROW_H + 4), zIndex: 4, pointerEvents: 'none' }}>
          <span className={SCAN} style={{ position: 'absolute', inset: 0, borderRadius: 8, background: 'linear-gradient(90deg, rgba(45,99,251,0.00), rgba(45,99,251,0.16) 30%, rgba(45,99,251,0.16) 70%, rgba(45,99,251,0.00))', boxShadow: 'inset 0 0 0 1.5px rgba(45,99,251,0.35)', opacity: 0 }} />
        </span>
      )}
      {marker && <Disc x={CMT_X} y={rowY(CMT_ROW)} size={22} icon="chat" loop="pulse" lit={markerLit} z={7} />}
    </>
  )
}

/** a rounded UI button with an optional icon */
function Btn({ x, y, w, h = 30, label, icon, tone }: { x: number; y: number; w: number; h?: number; label: string; icon?: Ico3DName; tone: 'green' | 'plain' }) {
  const green = tone === 'green'
  return (
    <div style={{ ...box(x, y, w, h), zIndex: 4, borderRadius: 9, background: green ? 'linear-gradient(180deg, #34C46F 0%, #16A34A 100%)' : '#FFFFFF', boxShadow: green ? '0 8px 16px -10px rgba(22,120,60,0.8), inset 0 1px 0 rgba(255,255,255,0.35)' : 'inset 0 0 0 1.5px #D3DEF6, 0 6px 14px -10px rgba(31,64,140,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
      {icon && <span style={{ display: 'grid', placeItems: 'center', width: 20, height: 20, borderRadius: 99, background: green ? 'rgba(255,255,255,0.92)' : 'transparent' }}><Ico3D name={icon} size={green ? 16 : 18} loop="none" /></span>}
      <span style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: green ? '#FFFFFF' : colors.ink, whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  )
}

/** E_T14: point 1 the diff view, point 2 the review comment pinned to its line */
const E_T14: Fig = (p) => {
  const { step, hot, live } = useBuild(p)
  const cmtOn = step >= 2
  const bubY = rowY(CMT_ROW) - 42
  return (
    <Frame w={W0} h={H0}>
      <Panel x={PG.x} y={PG.y} w={PG.w} h={PG.h} radius={18} />
      <PageHeader />
      <DiffCard lit={hot === 0} scan={live && step >= 1} marker={cmtOn} markerLit={hot === 1} />
      {/* the reviewer */}
      <div style={{ ...box(RC.x, DF.y, 36, 36), zIndex: 4 }}><Plinth size={36}><Ico3D name="user" size={27} loop="bob" d={0.6} /></Plinth></div>
      <div style={{ ...box(RC.x + 46, DF.y + 7, 100, 22), zIndex: 4, display: 'flex', alignItems: 'center' }}><span style={{ ...tag(15), textAlign: 'left' }}>Reviewer</span></div>
      {/* the comment bubble, pinned by a wire to the marker on its line */}
      <Panel x={RC.x} y={bubY} w={RC.w} h={84} lit={hot === 1} on={cmtOn} radius={14}>
        <div style={{ position: 'absolute', left: 16, top: 16, width: 30, height: 30, display: 'grid', placeItems: 'center' }}>
          {live && cmtOn && <span aria-hidden className={CMT_RIP} style={{ position: 'absolute', inset: 0, borderRadius: 99, boxShadow: `0 0 0 2px ${colors.brand}55` }} />}
          <Ico3D name="chat" size={28} loop="pulse" />
        </div>
        <span aria-hidden style={{ position: 'absolute', left: 58, top: 22, width: 104, height: 8, borderRadius: 5, background: '#CBD7EE' }} />
        <span aria-hidden style={{ position: 'absolute', left: 58, top: 38, width: 78, height: 8, borderRadius: 5, background: '#CBD7EE' }} />
        <span aria-hidden style={{ position: 'absolute', left: 16, top: 58, width: 120, height: 8, borderRadius: 5, background: '#DCE4F4' }} />
      </Panel>
      <Wl pts={[[RC.x, rowY(CMT_ROW)], [CMT_X + 11, rowY(CMT_ROW)]]} on={cmtOn} head={8} width={2.2} lit={hot === 1} />
      {/* the two actions a reviewer takes */}
      <Btn x={RC.x} y={262} w={RC.w} label="Approve" icon="check" tone="green" />
      {live && <span aria-hidden className={loopCls('glow')} style={{ ...box(RC.x - 3, 259, RC.w + 6, 36), zIndex: 3, borderRadius: 12, boxShadow: `0 0 0 3px ${GREEN}33`, ...loopVars(0, 2.6) }} />}
      <Btn x={RC.x} y={302} w={RC.w} label="Request Changes" icon="chat" tone="plain" />
    </Frame>
  )
}

/* ---- TR 14 B: required approval + Merge padlock, status checks ---- */

const T14B_P = 6
/* status checks: spinner 0-40 %, the tick 40-96 % (each row half a beat apart), crossfade back by 100 % */
const SPIN_ROT = move('spin-rot', 1.1, [[0, 'rotate(0deg)', 1], [100, 'rotate(360deg)', 1]], 'linear')
const CHK = [0, 1].map((i) => ({
  spin: fade(`chk-spin${i}`, T14B_P, [[0, 1], [32 + i * 10, 1], [35 + i * 10, 0], [96, 0], [99, 1], [100, 1]]),
  tick: move(`chk-tick${i}`, T14B_P, [[0, 'scale(0.6)', 0], [32 + i * 10, 'scale(0.6)', 0], [37 + i * 10, 'scale(1)', 1], [95, 'scale(1)', 1], [99, 'scale(0.6)', 0], [100, 'scale(0.6)', 0]]),
}))
/* the reviewer's approval lands (54 %), then the padlock opens and Merge turns green (62 %) */
const APPROVE = move('approve', T14B_P, [[0, 'translateY(-14px) scale(0.6)', 0], [52, 'translateY(-14px) scale(0.6)', 0], [57, 'translateY(0px) scale(1)', 1], [95, 'translateY(0px) scale(1)', 1], [99, 'translateY(0px) scale(0.6)', 0], [100, 'translateY(-14px) scale(0.6)', 0]])
const LOCK_SHUT = fade('lock-shut', T14B_P, [[0, 1], [60, 1], [63, 0], [96, 0], [99, 1], [100, 1]])
const LOCK_OPEN = fade('lock-open', T14B_P, [[0, 0], [60, 0], [63, 1], [96, 1], [99, 0], [100, 0]])
const MERGE_ON = fade('merge-on', T14B_P, [[0, 0], [60, 0], [64, 1], [96, 1], [99, 0], [100, 0]])

const SC = { x: RC.x, y: DF.y, w: RC.w, h: 118 } // the status checks card
const scRow = (i: number) => SC.y + 66 + i * 30 // a check row's centre
const RV_Y = 232 // the reviewer row's centre
const MG = { x: RC.x, y: 266, w: RC.w, h: 40 } // the Merge button

/** a status check's spinner / tick (both drawn; held: the tick) */
function CheckState({ x, y, i, live }: { x: number; y: number; i: number; live: boolean }) {
  return (
    <span style={{ ...box(x - 11, y - 11, 22, 22), zIndex: 5 }}>
      {live && (
        <span className={CHK[i].spin} style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <span className={SPIN_ROT} style={{ width: 18, height: 18, borderRadius: 99, border: `2.5px solid ${colors.brand}30`, borderTopColor: colors.brand }} />
        </span>
      )}
      <span className={live ? CHK[i].tick : undefined} style={{ position: 'absolute', inset: 0, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6', display: 'grid', placeItems: 'center', opacity: live ? 0 : 1 }}>
        <Ico3D name="check" size={17} loop="none" />
      </span>
    </span>
  )
}

/** E_T14B: point 3 required approvals (padlocked Merge), point 4 the status checks */
const E_T14B: Fig = (p) => {
  const { hot, live } = useBuild(p)
  const instant = useInstant()
  return (
    <Frame w={W0} h={H0}>
      <Panel x={PG.x} y={PG.y} w={PG.w} h={PG.h} radius={18} />
      <PageHeader />
      <DiffCard lit={false} scan={false} marker markerLit={false} />
      {/* status checks */}
      <Panel x={SC.x} y={SC.y} w={SC.w} h={SC.h} lit={hot === 1} radius={14} />
      <div style={{ ...box(SC.x + 14, SC.y + 12, 30, 30), zIndex: 4 }}><MarkTile src={ghaMark} size={30} scale={0.7} /></div>
      <div style={{ ...box(SC.x + 52, SC.y + 16, SC.w - 60, 22), zIndex: 4, display: 'flex', alignItems: 'center' }}><span style={{ ...heading(15), whiteSpace: 'nowrap' }}>Status Checks</span></div>
      {['Build', 'Test'].map((lab, i) => (
        <div key={lab}>
          <div style={{ ...box(SC.x + 16, scRow(i) - 10, 54, 20), zIndex: 4, display: 'flex', alignItems: 'center' }}><span style={{ ...tag(14), textAlign: 'left' }}>{lab}</span></div>
          <span aria-hidden style={{ ...box(SC.x + 72, scRow(i) - 4, 66, 8), zIndex: 4, borderRadius: 5, background: '#CBD7EE' }} />
          <CheckState x={SC.x + SC.w - 26} y={scRow(i)} i={i} live={live} />
        </div>
      ))}
      {/* the required approval */}
      <div style={{ ...box(RC.x, RV_Y - 18, 36, 36), zIndex: 4, borderRadius: 11, boxShadow: hot === 0 ? `0 0 0 2.5px ${ORANGE}` : 'none', transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}><Plinth size={36}><Ico3D name="user" size={27} loop="bob" d={0.6} /></Plinth></div>
      <div style={{ ...box(RC.x + 46, RV_Y - 11, 90, 22), zIndex: 4, display: 'flex', alignItems: 'center' }}><span style={{ ...tag(15), textAlign: 'left' }}>Reviewer</span></div>
      <span style={{ ...box(RC.x + RC.w - 26 - 12, RV_Y - 12, 24, 24), zIndex: 5 }}>
        <span className={live ? APPROVE : undefined} style={{ position: 'absolute', inset: 0, borderRadius: 99, background: 'linear-gradient(180deg, #34C46F 0%, #16A34A 100%)', boxShadow: '0 6px 12px -6px rgba(22,120,60,0.8)', display: 'grid', placeItems: 'center', opacity: live ? 0 : 1 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><path d="M 3 7.4 L 6 10.2 L 11 4.2" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
      </span>
      {/* the Merge button: grey and padlocked until the approval lands, then green and open */}
      <div style={{ ...box(MG.x, MG.y, MG.w, MG.h), zIndex: 4, borderRadius: 10, background: '#EEF2F9', boxShadow: hot === 0 ? `inset 0 0 0 2.5px ${ORANGE}` : 'inset 0 0 0 1.5px #D3DEF6', transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
        <span className={live ? MERGE_ON : undefined} style={{ position: 'absolute', inset: 0, borderRadius: 10, background: 'linear-gradient(180deg, #34C46F 0%, #16A34A 100%)', boxShadow: '0 8px 16px -10px rgba(22,120,60,0.8)', opacity: live ? 0 : 1 }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span style={{ position: 'relative', width: 26, height: 26, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 3px 8px -4px rgba(31,64,140,0.5)' }}>
            <span className={live ? LOCK_SHUT : undefined} style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: live ? 1 : 0 }}><Ico3D name="lock" size={20} loop="none" /></span>
            <span className={live ? LOCK_OPEN : undefined} style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: live ? 0 : 1 }}><Ico3D name="unlock" size={20} loop="none" /></span>
          </span>
          <span style={{ position: 'relative', fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 700, fontSize: 15, color: colors.ink, whiteSpace: 'nowrap' }}>
            <span className={live ? LOCK_SHUT : undefined} style={{ opacity: live ? 1 : 0 }}>Merge</span>
            <span className={live ? LOCK_OPEN : undefined} style={{ position: 'absolute', left: 0, top: 0, color: '#FFFFFF', opacity: live ? 0 : 1 }}>Merge</span>
          </span>
        </div>
      </div>
      <Wl pts={[[RC.x + RC.w - 26, RV_Y + 12], [RC.x + RC.w - 26, MG.y]]} head={8} width={2.2} lit={hot === 0} />
    </Frame>
  )
}

/* ================================================================== TR 17 · push into the CI server */

const LAP = { x: 72, y: 150, s: 64 } // the developer's laptop tile centre
const CI = { x: 196, y: 20, w: 350, h: 340 } // the CI server box (padding 20 round the frame)
const BLD = { x: 290, y: 150 } // Build tile centre
const TST = { x: 446, y: 150 } // Test tile centre
const NS = 64 // node tile size
const RET_X = 516 // the return wire's riser (inside the box, 30 from its edge)
const RET_Y = 314 // the return wire's run under everything
const PUSH_DISC = 150 // the push / pull request disc on the push wire
const ROWS_X = 404 // the test rows' left edge
const rowsY = (i: number) => 214 + i * 26

const P17 = 9 // two 4.5 s runs: the first passes, the second fails on its last test
const PUSH: Pt[] = [[LAP.x + LAP.s / 2, LAP.y], [BLD.x - NS / 2, LAP.y]]
const B2T: Pt[] = [[BLD.x + NS / 2, BLD.y], [TST.x - NS / 2, TST.y]]
const RET: Pt[] = [[TST.x + NS / 2, TST.y], [RET_X, TST.y], [RET_X, RET_Y], [LAP.x, RET_Y], [LAP.x, LAP.y + LAP.s / 2]]
const R_PUSH = [K.ride('push-a', PUSH, 0.1, 1.0, P17), K.ride('push-b', PUSH, 4.6, 5.5, P17)]
/* the build's package rides Build -> Test */
const R_PKG = [K.ride('pkg-a', B2T, 1.2, 2.0, P17), K.ride('pkg-b', B2T, 5.7, 6.5, P17)]
/* the result rides back: a tick on the first run, the orange cross on the second */
const R_TICK = K.ride('ret-tick', RET, 2.95, 4.25, P17, 0.9)
const R_CROSS = K.ride('ret-cross', RET, 7.45, 8.75, P17, 0.9)
/* the test rows: each ticks in turn on both runs; on the second run the last row fails (orange cross) */
const rowAt = (i: number, run: number) => ((run * 4.5 + 2.0 + i * 0.3) / P17) * 100
const OFF_A = (4.3 / P17) * 100
const OFF_B = (8.8 / P17) * 100
const ROW_TICK = [0, 1, 2].map((i) =>
  fade(`row-tick${i}`, P17, i < 2
    ? [[0, 0], [rowAt(i, 0), 0], [rowAt(i, 0) + 2.5, 1], [OFF_A, 1], [OFF_A + 1.5, 0], [rowAt(i, 1), 0], [rowAt(i, 1) + 2.5, 1], [OFF_B, 1], [OFF_B + 1.5, 0], [100, 0]]
    : [[0, 0], [rowAt(i, 0), 0], [rowAt(i, 0) + 2.5, 1], [OFF_A, 1], [OFF_A + 1.5, 0], [100, 0]]),
)
const ROW_CROSS = fade('row-cross', P17, [[0, 0], [rowAt(2, 1), 0], [rowAt(2, 1) + 2.5, 1], [OFF_B, 1], [OFF_B + 1.5, 0], [100, 0]])

/** a ride class carrying a small 3D icon (or the orange cross) on a white disc */
function Rider({ cls, icon, warn = false, size = 24 }: { cls: string; icon?: Ico3DName; warn?: boolean; size?: number }) {
  const held = useHeld()
  if (held) return null
  return (
    <span aria-hidden style={{ position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, zIndex: 6, pointerEvents: 'none' }}>
      <span className={cls} style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: warn ? `0 0 0 3px ${ORANGE}33, 0 4px 10px -4px rgba(31,64,140,0.6)` : '0 0 0 3px rgba(45,99,251,0.16), 0 4px 10px -4px rgba(31,64,140,0.6)', opacity: 0 }}>
        {warn ? <OrangeCross size={size - 6} /> : <Ico3D name={icon ?? 'check'} size={size - 6} loop="none" />}
      </span>
    </span>
  )
}

/** the test rows under the Test tile: a mark disc and a line bar each (held: three ticks) */
function TestRows({ live, lit }: { live: boolean; lit: boolean }) {
  const instant = useInstant()
  return (
    <div style={{ ...box(ROWS_X - 8, rowsY(0) - 17, 104, 86), zIndex: 3, borderRadius: 12, boxShadow: lit ? `inset 0 0 0 2.5px ${ORANGE}` : 'inset 0 0 0 1.5px #E1E8F6', background: 'rgba(255,255,255,0.7)', transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
      {[0, 1, 2].map((i) => {
        const y = rowsY(i) - (rowsY(0) - 17)
        return (
          <div key={i}>
            <span style={{ position: 'absolute', left: 8, top: y - 9, width: 18, height: 18, borderRadius: 99, background: '#F1F5FD', boxShadow: 'inset 0 0 0 1px #D3DEF6' }}>
              <span className={live ? ROW_TICK[i] : undefined} style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: live ? 0 : 1 }}><Ico3D name="check" size={16} loop="none" /></span>
              {i === 2 && live && <span className={ROW_CROSS} style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: 0 }}><OrangeCross size={16} /></span>}
            </span>
            <span aria-hidden style={{ position: 'absolute', left: 34, top: y - 4, width: [56, 44, 50][i], height: 8, borderRadius: 5, background: '#CBD7EE' }} />
          </div>
        )
      })}
    </div>
  )
}

/** the official CI marks as a 2 x 2 grid under the Build tile, each with its one-word tag */
const MARKS: [string, string][] = [[ghaMark, 'Actions'], [jenkinsMark, 'Jenkins'], [gitlabMark, 'GitLab'], [codebuildMark, 'CodeBuild']]
function CiMarks({ lit }: { lit: boolean }) {
  return (
    <>
      {MARKS.map(([src, lab], i) => {
        const cx = BLD.x - 36 + (i % 2) * 72
        const ty = 202 + Math.floor(i / 2) * 52
        return (
          <div key={lab} style={{ ...box(cx - 36, ty, 72, 48), zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <MarkTile src={src} size={30} scale={0.7} lit={lit} />
            <span style={tag(12)}>{lab}</span>
          </div>
        )
      })}
    </>
  )
}

/** the shared TR 17 picture; `variant` 'a' = T17 (package under Build), 'b' = T17-B (the four CI marks) */
function CiFigure({ p, variant }: { p: Record<string, unknown>; variant: 'a' | 'b' }) {
  const { hot, live } = useBuild(p)
  const pushLit = variant === 'a' && hot === 0
  const buildLit = variant === 'a' && hot === 1
  const testLit = variant === 'b' && hot === 0
  const marksLit = variant === 'b' && hot === 1
  return (
    <Frame w={W0} h={H0}>
      {/* the CI server box */}
      <Panel x={CI.x} y={CI.y} w={CI.w} h={CI.h} radius={18} />
      <div style={{ ...box(CI.x + 20, CI.y + 16, 32, 32), zIndex: 4 }}><Plinth size={32}><Ico3D name="server" size={24} loop="bob" d={0.3} /></Plinth></div>
      <div style={{ ...box(CI.x + 62, CI.y + 21, 140, 22), zIndex: 4, display: 'flex', alignItems: 'center' }}><span style={{ ...heading(16), whiteSpace: 'nowrap' }}>CI Server</span></div>
      {/* the developer and the push / pull request */}
      <Node x={LAP.x} y={LAP.y} icon="laptop" label="Developer" size={LAP.s} loop="bob" />
      <Wl pts={PUSH} lit={pushLit} />
      <Disc x={PUSH_DISC} y={LAP.y} size={30} icon="merge" loop="pulse" lit={pushLit} z={7} />
      {R_PUSH.map((c) => <Token key={c} cls={c} size={10} />)}
      {/* build -> test */}
      <Node x={BLD.x} y={BLD.y} icon="gear" label="Build" lit={buildLit} loop="spin" t={6} />
      <Node x={TST.x} y={TST.y} icon="checklist" label="Test" lit={testLit} loop="pulse" d={0.5} />
      <Wl pts={B2T} />
      {R_PKG.map((c) => <Rider key={c} cls={c} icon="package" size={24} />)}
      {variant === 'a' ? (
        <>
          <Wl pts={[[BLD.x, BLD.y + NS / 2], [BLD.x, 228]]} head={9} lit={buildLit} />
          <div style={{ ...box(BLD.x - 26, 228, 52, 52), zIndex: 4 }}><Plinth size={52} lit={buildLit}><Ico3D name="package" size={38} loop="bob" d={1} /></Plinth></div>
          <div style={{ ...box(BLD.x - 60, 286, 120, 18), zIndex: 4, display: 'grid', placeItems: 'center' }}><span style={tag(14)}>Package</span></div>
        </>
      ) : (
        <CiMarks lit={marksLit} />
      )}
      <TestRows live={live} lit={testLit} />
      {/* the result back to the developer */}
      <Wl pts={RET} />
      <Rider cls={R_TICK} icon="check" size={26} />
      <Rider cls={R_CROSS} warn size={26} />
    </Frame>
  )
}

const E_T17: Fig = (p) => <CiFigure p={p} variant="a" />
const E_T17B: Fig = (p) => <CiFigure p={p} variant="b" />

export const figures: Record<string, Fig> = { E_T14, E_T14B, E_T17, E_T17B }
export const css = [K.css(), KF.join('\n'), '.cc-still [class*="s22e-"], .deck-thumb [class*="s22e-"] { animation: none !important; }'].join('\n')
