import { type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, TILE_BG, TILE_RIM, Frame, Show, Plinth, MarkTile, Panel, Wire, Junction, Token, keyframes, tag, useHeld, useHot, type Pt } from '@/engine/figkit'
import jiraMark from '../images/tech-jira.svg'
import ghMark from '../images/tech-github.png'
import gitMark from '../images/tech-git.png'
import cbMark from '../images/aws-codebuild.svg'

/*
 * SESSION 22 · SECTION 2 (The Cloud SDLC) technical figures, builder B.
 * Standing corrections 13-17: 3D icons on plinth tiles, official marks on white tiles, >= 20 px padding, orthogonal
 * wires from the same constants as the boxes, flow dots on live wires, a lit item walking after the build (S21
 * `useBuild`, the walk starting on the LAST item). Loops are transform / opacity on HTML elements only. Held (?still):
 * the full picture, nothing lit, nothing moving. Class prefix `s22b-`.
 *
 *   slide 14 B_T05   1080 x 340  the eight SDLC stages in a row, the loop wire Monitor -> Plan (2)
 *   slide 16 B_T06    566 x 380  Plan panel (blueprint + backlog rows) -> Code panel (editor -> Git repository) (2)
 *   slide 17 B_T06B   566 x 380  the same, + Jira on the plan with a link to a commit, the repository on GitHub (2)
 *   slide 19 B_T07    566 x 380  Code -> Build -> Test -> pass (Artifact) / fail (back to Code); inputs, test rows (2)
 *   slide 20 B_T07B   566 x 380  the same flow to Release: a failing test stopped (ban), CodeBuild round Build+Test (2)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('s22b')
const KF: string[] = []
const AN = 's22b-a'
const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })
const pc = (v: number) => `${Math.max(0, Math.min(100, v)).toFixed(2)}%`

/** an opacity loop: the element is at `hi` inside each window [t0, t1] (seconds) of a `period`, at `lo` elsewhere */
function win(name: string, ranges: [number, number][], period: number, lo = 0, hi = 1, ramp = 0.16) {
  const cls = `s22b-${name}`
  const pts: string[] = [`0% { opacity: ${lo} }`]
  for (const [a, b] of ranges) {
    pts.push(`${pc(((a - ramp) / period) * 100)} { opacity: ${lo} }`, `${pc((a / period) * 100)} { opacity: ${hi} }`, `${pc((b / period) * 100)} { opacity: ${hi} }`, `${pc(((b + ramp) / period) * 100)} { opacity: ${lo} }`)
  }
  pts.push(`100% { opacity: ${lo} }`)
  KF.push(`@keyframes ${cls} { ${pts.join(' ')} }\n.${cls} { animation: ${cls} ${period}s linear infinite; }`)
  return `${cls} ${AN}`
}
/** an editor line typing in from the left (scaleX), then holding; restarts every `period` */
function typing(name: string, t0: number, t1: number, period: number) {
  const cls = `s22b-${name}`
  KF.push(`@keyframes ${cls} { 0%, ${pc((t0 / period) * 100)} { transform: scaleX(0.02) } ${pc((t1 / period) * 100)}, 94% { transform: scaleX(1) } 100% { transform: scaleX(0.02) } }\n.${cls} { animation: ${cls} ${period}s cubic-bezier(0.45,0,0.55,1) infinite; transform-origin: 0 50%; }`)
  return `${cls} ${AN}`
}

/** the build of a figure: the step, the lit item, held (S21 e.tsx: the walk starts on the LAST item) */
function useBuild(p: Record<string, unknown>, period: number) {
  const cnt = Number(p.steps ?? 1)
  const held = useHeld()
  const raw0 = Number(p.step ?? 0)
  const step = held ? cnt : raw0
  const raw = useHot(cnt, raw0, period)
  const hot = raw >= 0 && raw0 >= cnt ? (raw + cnt - 1) % cnt : raw
  return { step, hot, held, s: (n: number) => step >= n, done: !held && raw0 >= cnt }
}

/* ------------------------------------------------------------------ pieces */

const ORANGE_FILTER = 'hue-rotate(28deg) saturate(1.15) brightness(1.06)'
const LIT_RING = `inset 0 0 0 2.5px ${ORANGE}, 0 0 16px -2px rgba(255,138,61,0.55)`

/** a wire on its own layer above the panels */
const W = (props: Parameters<typeof Wire>[0]) => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}><Wire {...props} /></div>
)
/** flow dots on a layer UNDER the tiles, so a dot passing a tile's centre slips behind it */
const Under = ({ children }: { children: ReactNode }) => <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>{children}</div>

/** a tile (3D icon on its plinth, or an official mark) centred on (x, y), its tag under, right or left of it */
function Node({ x, y, size = 60, icon, mark, label, on = true, lit = false, loop = 'bob', d = 0, t, delay = 0, side = 'down', w = 130, ring, k = 0.72, tagSize = 14 }: { x: number; y: number; size?: number; icon?: Ico3DName; mark?: string; label?: string; on?: boolean; lit?: boolean; loop?: Loop; d?: number; t?: number; delay?: number; side?: 'down' | 'right' | 'left'; w?: number; ring?: string; k?: number; tagSize?: number }) {
  const r = Math.round(size * 0.28)
  const tile = (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {mark ? <MarkTile src={mark} size={size} lit={lit} /> : <Plinth size={size} lit={lit}><Ico3D name={icon ?? 'doc'} size={Math.round(size * k)} loop={loop} d={d} t={t} /></Plinth>}
      {ring && <span aria-hidden className={ring} style={{ position: 'absolute', inset: -4, borderRadius: r + 4, boxShadow: LIT_RING, opacity: 0, pointerEvents: 'none' }} />}
    </div>
  )
  const lab = label ? <span style={tag(tagSize)}>{label}</span> : null
  if (side === 'down') {
    return (
      <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, top: y - size / 2, width: w, zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        {tile}
        {lab}
      </Show>
    )
  }
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', top: y - size / 2, height: size, zIndex: 4, display: 'flex', alignItems: 'center', gap: 8, flexDirection: side === 'right' ? 'row' : 'row-reverse', ...(side === 'right' ? { left: x - size / 2 } : { right: `calc(100% - ${x + size / 2}px)` }) }}>
      {tile}
      {lab}
    </Show>
  )
}

/** a white disc holding a 3D icon, centred on (x, y); `warn` turns a red icon to the template orange */
function Disc({ x, y, icon, on = true, size = 28, warn = false, cls, loop = 'pulse', d = 0 }: { x: number; y: number; icon: Ico3DName; on?: boolean; size?: number; warn?: boolean; cls?: string; loop?: Loop; d?: number }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: 6, opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}` }}>
      <span className={cls} style={{ position: 'absolute', inset: 0, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6', display: 'grid', placeItems: 'center' }}>
        <span style={{ display: 'grid', filter: warn ? ORANGE_FILTER : undefined }}><Ico3D name={icon} size={size - 7} loop={warn ? 'none' : loop} d={d} t={2.4} /></span>
      </span>
    </span>
  )
}

/* ================================================================== slide 14 · B_T05 · the eight SDLC stages, looped */

/*
 * 1080 x 340. Eight tiles (70 px) in a row on y 118, centres 130 apart from x 85; each a 3D icon with its stage tag
 * (the T05-B table's row icons, in order). Arrows tile edge to tile edge. Step 1 draws the forward arrows left to
 * right; step 2 the loop wire from Monitor's right edge, round under the tags (y 262) and back into Plan's left edge,
 * a refresh disc on it. After the build a dot walks the eight stages (0.8 s a stage) and returns along the loop, the
 * stage it reaches ringed orange in time with it (CSS, one 8.6 s loop). Held: everything drawn, nothing lit.
 */
const T5 = { W: 1080, H: 340, Y: 118, S: 70, X0: 85, DX: 130, LY: 262, LX0: 34, LX1: 1046 }
const STAGES: [string, Ico3DName, Loop][] = [
  ['Plan', 'doc', 'bob'], ['Code', 'code', 'bob'], ['Build', 'gear', 'spin'], ['Test', 'checklist', 'bob'],
  ['Release', 'tag', 'swing'], ['Deploy', 'rocket', 'float'], ['Operate', 'server', 'pulse'], ['Monitor', 'dashboard', 'bob'],
]
const t5x = (i: number) => T5.X0 + i * T5.DX
const P5 = 8.6
const T5_ROW = K.ride('t5row', [[t5x(0), T5.Y], [t5x(7), T5.Y]], 0, 5.6, P5, 1)
const T5_LOOP_PTS: Pt[] = [[t5x(7) + T5.S / 2 + 2, T5.Y], [T5.LX1, T5.Y], [T5.LX1, T5.LY], [T5.LX0, T5.LY], [T5.LX0, T5.Y], [t5x(0) - T5.S / 2 - 2, T5.Y]]
const T5_LOOP = K.ride('t5loop', [[t5x(7), T5.Y], ...T5_LOOP_PTS.slice(1, -1), [t5x(0), T5.Y]], 5.75, 8.45, P5, 1)
const T5_RING = STAGES.map((_, i) => win(`t5r${i}`, i === 0 ? [[0, 0.38], [8.32, 8.6]] : [[0.8 * i - 0.1, 0.8 * i + 0.4]], P5))

const B_T05: Fig = (p) => {
  const { s, done } = useBuild({ ...p, steps: p.steps ?? 2 }, 2800)
  const e = T5.S / 2 + 3
  return (
    <Frame w={T5.W} h={T5.H}>
      {STAGES.map(([label, icon, loop], i) => (
        <Node key={label} x={t5x(i)} y={T5.Y} size={T5.S} icon={icon} label={label} loop={loop} d={i * 0.35} t={loop === 'spin' ? 6 : undefined} w={T5.DX - 6} tagSize={16} ring={done ? T5_RING[i] : undefined} />
      ))}
      {STAGES.slice(0, 7).map((_, i) => (
        <W key={i} pts={[[t5x(i) + e, T5.Y], [t5x(i + 1) - e, T5.Y]]} on={s(1)} delay={i * 130} head={9} />
      ))}
      <W pts={T5_LOOP_PTS} on={s(2)} head={10} />
      <Disc x={(T5.LX0 + T5.LX1) / 2} y={T5.LY} icon="refresh" size={34} on={s(2)} loop="spin" />
      <Under>
        <Token cls={T5_ROW} on={done} size={11} />
        <Token cls={T5_LOOP} on={done} size={11} />
      </Under>
    </Frame>
  )
}

/* ================================================================== slides 16-17 · B_T06 / B_T06B · plan, then code */

/*
 * 566 x 380. Plan panel x 20..256, Code panel x 310..546, both y 26..356 (h 330). Plan: the blueprint tile (doc) on
 * the header line y 74 (T06B: the Jira mark beside it), tag under; three backlog rows x 40..236 at y 140 / 202 / 264
 * (h 50): Backlog (list), Criteria (check), Goals (target). Code: the editor tile (code) on y 74, an editor window
 * x 330..526 y 134..230 with four line bars, an arrow down to the repository tile (Git mark; T06B press 2: GitHub)
 * at y 288, tag under. The header arrow runs from the plan tile's right edge to the code tile's left edge.
 * Loop (after the build, 4.4 s): a backlog card rides the header arrow, the editor lines type in, a commit rides
 * into the repository. T06B press 1: a dashed link from the Backlog row to a commit dot on the editor's line 2.
 */
const T6 = { W: 566, H: 380, PY: 26, PH: 330, LX: 20, RX: 310, PW: 236, HY: 74, HS: 48, ROW0: 140, ROWH: 50, ROWG: 12, EX: 330, EY: 134, EW: 196, EH: 96, REPO: 288, RS: 44 }
const P6 = 4.4
const ROWS: [string, Ico3DName][] = [['Backlog', 'list'], ['Criteria', 'check'], ['Goals', 'target']]
const LINES = [{ y: 168, w: 128, c: colors.brand }, { y: 184, w: 92, c: '#8FB0F7' }, { y: 200, w: 148, c: '#8FB0F7' }, { y: 216, w: 70, c: colors.brand }]
const T6_TYPE = LINES.map((l, i) => typing(`t6l${i}`, 0.9 + i * 0.35, 1.25 + i * 0.35, P6))
const t6Head = (b: boolean): Pt[] => [[(b ? T6.LX + 168 + T6.HS / 2 : T6.LX + T6.PW / 2 + T6.HS / 2) + 6, T6.HY], [T6.RX + T6.PW / 2 - T6.HS / 2 - 6, T6.HY]]
const T6_CARD = [false, true].map((b) => K.ride(`t6card${b ? 'b' : 'a'}`, t6Head(b), 0.15, 1.2, P6, 1))
const T6_COMMIT_PTS: Pt[] = [[T6.EX + T6.EW / 2, T6.EY + T6.EH + 2], [T6.EX + T6.EW / 2, T6.REPO - T6.RS / 2 - 2]]
const T6_COMMIT = K.ride('t6commit', T6_COMMIT_PTS, 2.75, 3.5, P6, 0.8)
const T6_LINK: Pt[] = [[T6.LX + T6.PW - 20, T6.ROW0 + T6.ROWH / 2], [283, T6.ROW0 + T6.ROWH / 2], [283, LINES[1].y + 4], [T6.EX + 12, LINES[1].y + 4]]

function PlanCode({ p, b }: { p: Record<string, unknown>; b: boolean }) {
  const { s, hot, done, held } = useBuild({ ...p, steps: p.steps ?? 2 }, 2800)
  const instant = useInstant()
  const typed = b || s(2)
  const gh = b && s(2)
  const cx = T6.RX + T6.PW / 2
  const tr = instant ? 'none' : `opacity 520ms ${EASE}`
  return (
    <Frame w={T6.W} h={T6.H}>
      <Panel x={T6.LX} y={T6.PY} w={T6.PW} h={T6.PH} lit={!b && hot === 0} />
      <Panel x={T6.RX} y={T6.PY} w={T6.PW} h={T6.PH} lit={!b && hot === 1} />
      {/* plan header: the blueprint (and, on T06B, Jira) */}
      <Node x={b ? T6.LX + 68 : T6.LX + T6.PW / 2} y={T6.HY} size={T6.HS} icon="doc" label="Plan" w={100} />
      {b && <Node x={T6.LX + 168} y={T6.HY} size={T6.HS} mark={jiraMark} label="Jira" w={100} on={s(1)} lit={hot === 0} />}
      {/* code header */}
      <Node x={cx} y={T6.HY} size={T6.HS} icon="code" label="Code" w={100} d={0.6} />
      <W pts={t6Head(b)} head={9} />
      {/* backlog rows */}
      {ROWS.map(([label, icon], i) => {
        const y = T6.ROW0 + i * (T6.ROWH + T6.ROWG)
        return (
          <Show key={label} on={b || s(1)} delay={i * 130} style={{ ...box(T6.LX + 20, y, T6.PW - 40, T6.ROWH), zIndex: 4, borderRadius: 12, background: TILE_BG, boxShadow: TILE_RIM, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px' }}>
            <Ico3D name={icon} size={28} loop="bob" d={i * 0.5} />
            <span style={{ ...tag(15), textAlign: 'left', flex: '0 0 auto' }}>{label}</span>
            <span aria-hidden style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' }}>
              <span style={{ width: '86%', height: 5, borderRadius: 9, background: '#C9D8FA' }} />
              <span style={{ width: '58%', height: 5, borderRadius: 9, background: '#DCE6FB' }} />
            </span>
          </Show>
        )
      })}
      {/* the editor window */}
      <div style={{ ...box(T6.EX, T6.EY, T6.EW, T6.EH), zIndex: 4, borderRadius: 12, background: '#FFFFFF', boxShadow: hot === 1 && !b ? LIT_RING : 'inset 0 0 0 1.5px #D3DEF6, 0 10px 20px -14px rgba(31,64,140,0.5)', transition: instant ? 'none' : `box-shadow 420ms ${EASE}`, overflow: 'hidden' }}>
        <div style={{ height: 20, background: 'linear-gradient(180deg, #F3F7FF 0%, #E6EEFF 100%)', display: 'flex', alignItems: 'center', gap: 5, padding: '0 9px' }}>
          {['#FF8A3D', '#FFC24B', '#3CC27A'].map((c) => <span key={c} style={{ width: 7, height: 7, borderRadius: 9, background: c }} />)}
        </div>
      </div>
      {LINES.map((l, i) => (
        <span key={i} aria-hidden style={{ ...box(T6.EX + 26, l.y, l.w, 7), zIndex: 5, opacity: typed ? 1 : 0, transition: tr }}>
          <span className={done ? T6_TYPE[i] : undefined} style={{ display: 'block', width: '100%', height: '100%', borderRadius: 9, background: l.c }} />
        </span>
      ))}
      {!typed && <span aria-hidden className={held ? undefined : 'fk fk-blink'} style={{ ...box(T6.EX + 26, LINES[0].y - 3, 3, 14), zIndex: 5, background: colors.brand, borderRadius: 2 }} />}
      {/* T06B press 1: the requirement linked to a commit */}
      {b && (
        <>
          <W pts={T6_LINK} on={s(1)} head={0} dash="5 6" lit={hot === 0} width={2.2} />
          <Junction x={T6_LINK[0][0]} y={T6_LINK[0][1]} on={s(1)} lit={hot === 0} />
          <span aria-hidden style={{ ...box(T6.EX + 9, LINES[1].y - 2, 11, 11), zIndex: 6, borderRadius: 99, background: hot === 0 ? ORANGE : colors.brand, boxShadow: '0 0 0 3px #FFFFFF', opacity: s(1) ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE} 600ms, background 420ms ${EASE}` }} />
        </>
      )}
      {/* the repository: Git, then (T06B press 2) GitHub */}
      <W pts={T6_COMMIT_PTS} on={typed} head={9} />
      <div style={{ ...box(cx - 70, T6.REPO - T6.RS / 2, 140, T6.RS + 26), zIndex: 4, opacity: typed ? 1 : 0, transition: tr }}>
        <div style={{ position: 'absolute', left: 70 - T6.RS / 2, top: 0, opacity: gh ? 0 : 1, transition: tr }}><MarkTile src={gitMark} size={T6.RS} /></div>
        <div style={{ position: 'absolute', left: 70 - T6.RS / 2, top: 0, opacity: gh ? 1 : 0, transition: tr }}><MarkTile src={ghMark} size={T6.RS} lit={hot === 1 && b} /></div>
        <span style={{ ...tag(14), position: 'absolute', left: 0, right: 0, top: T6.RS + 6, opacity: gh ? 0 : 1, transition: tr }}>Repository</span>
        <span style={{ ...tag(14), position: 'absolute', left: 0, right: 0, top: T6.RS + 6, opacity: gh ? 1 : 0, transition: tr }}>GitHub</span>
      </div>
      <Token cls={T6_CARD[b ? 1 : 0]} on={done} size={12} square />
      <Token cls={T6_COMMIT} on={done} size={10} />
    </Frame>
  )
}
const B_T06: Fig = (p) => <PlanCode p={p} b={false} />
const B_T06B: Fig = (p) => <PlanCode p={p} b />

/* ================================================================== slides 19-20 · B_T07 / B_T07B · build, test, fork */

/*
 * 566 x 380. Code (80) -> Build (200, gear) -> Test (320, checklist) -> junction (410) on the row line Y; tiles 60.
 * The pass branch climbs from the junction to the target tile at (500, TY) (T07: Artifact, package; T07B: Release,
 * tag) with a check disc; the fail branch drops to FY, runs left to x 30 and enters Code's left edge, dashed orange
 * with a cross disc. T07 (Y 165): press 1 the two inputs (Source, Dependencies) wire into the gear and the Artifact
 * lights; press 2 a test panel under Test with two rows, Unit and Integration. T07B (Y 190): press 1 the fail branch
 * lights and a ban stops the package before Release; press 2 a CodeBuild panel round Build and Test. Loop (8 s):
 * a commit rides to the gear, a package on to the junction; one pass (to the target), then one fail (back to Code).
 */
const P7 = 8
const F7 = { W: 566, H: 380, CX: 80, BX: 200, TX: 320, J: 410, AX: 500, S: 60, LX: 30 }
type V7 = { Y: number; TY: number; FY: number }
const V7A: V7 = { Y: 165, TY: 95, FY: 345 }
const V7B: V7 = { Y: 190, TY: 105, FY: 332 }
const passPts = (v: V7): Pt[] => [[F7.J, v.Y], [F7.J, v.TY], [F7.AX - F7.S / 2 - 2, v.TY]]
const failPts = (v: V7): Pt[] => [[F7.J, v.Y], [F7.J, v.FY], [F7.LX, v.FY], [F7.LX, v.Y], [F7.CX - F7.S / 2 - 2, v.Y]]
const e7 = F7.S / 2 + 3
const rides7 = (v: V7, n: string) => ({
  c1: K.ride(`${n}c1`, [[F7.CX, v.Y], [F7.BX, v.Y]], 0.1, 0.9, P7),
  p1: K.ride(`${n}p1`, [[F7.BX, v.Y], [F7.J, v.Y], ...passPts(v).slice(1)], 0.95, 2.6, P7, 1),
  c2: K.ride(`${n}c2`, [[F7.CX, v.Y], [F7.BX, v.Y]], 4.1, 4.9, P7),
  f2: K.ride(`${n}f2`, [[F7.BX, v.Y], [F7.J, v.Y], ...failPts(v).slice(1, -1), [F7.CX, v.Y]], 4.95, 7.6, P7, 1),
  /* T07B: in the fail half the package tries the pass branch and stops at the ban */
  b2: K.ride(`${n}b2`, [[F7.J, v.Y], [F7.J, v.TY], [F7.J + 16, v.TY]], 5.9, 6.5, P7, 0.6),
})
const R7A = rides7(V7A, 't7a')
const R7B = rides7(V7B, 't7b')
const IN7 = { SX: 150, DX: 250, Y: 62, S: 36, MY: 104 }
const in7 = (x: number, to: number): Pt[] => [[x, IN7.Y + IN7.S / 2 + 2], [x, IN7.MY], [to, IN7.MY], [to, V7A.Y - F7.S / 2 - 2]]
const IN7_RIDE = [K.ride('t7is', in7(IN7.SX, F7.BX - 8), 0.1, 0.85, P7), K.ride('t7id', in7(IN7.DX, F7.BX + 8), 0.1, 0.85, P7)]
const PASS_ON = win('t7pass', [[2.2, 3.6]], P7, 0.45, 1)
const FAIL_ON = win('t7fail', [[5.4, 7.2]], P7, 0.45, 1)
const BAN_ON = win('t7ban', [[6.2, 7.4]], P7, 0.5, 1)

function Flow({ p, b }: { p: Record<string, unknown>; b: boolean }) {
  const { s, hot, done } = useBuild({ ...p, steps: p.steps ?? 2 }, 2800)
  const v = b ? V7B : V7A
  const R = b ? R7B : R7A
  const failLit = b && hot === 0
  const CB = { x: 150, y: 68, w: 220, h: 194 }
  return (
    <Frame w={F7.W} h={F7.H}>
      {/* T07B press 2: CodeBuild round Build and Test */}
      {b && (
        <Panel x={CB.x} y={CB.y} w={CB.w} h={CB.h} on={s(2)} lit={hot === 1}>
          <div style={{ position: 'absolute', left: 20, top: 26, display: 'flex', alignItems: 'center', gap: 10 }}>
            <MarkTile src={cbMark} size={44} />
            <span style={tag(15)}>CodeBuild</span>
          </div>
        </Panel>
      )}
      <Node x={F7.CX} y={v.Y} size={F7.S} icon="code" label="Code" w={100} />
      <Node x={F7.BX} y={v.Y} size={F7.S} icon="gear" label="Build" loop="spin" t={6} w={100} lit={!b && hot === 0} />
      <Node x={F7.TX} y={v.Y} size={F7.S} icon="checklist" label="Test" w={100} d={0.5} lit={!b && hot === 1} />
      <W pts={[[F7.CX + e7, v.Y], [F7.BX - e7, v.Y]]} head={9} />
      <W pts={[[F7.BX + e7, v.Y], [F7.TX - e7, v.Y]]} head={9} />
      <W pts={[[F7.TX + e7, v.Y], [F7.J, v.Y]]} head={0} />
      <Junction x={F7.J} y={v.Y} />
      {/* pass: on to the target */}
      <W pts={passPts(v)} head={9} />
      <Node x={F7.AX} y={v.TY} size={F7.S} icon={b ? 'tag' : 'package'} label={b ? 'Release' : 'Artifact'} loop={b ? 'swing' : 'bob'} w={100} d={0.9} lit={!b && hot === 0} />
      <Disc x={F7.J} y={(v.Y + v.TY) / 2} icon="check" cls={done ? PASS_ON : undefined} />
      {/* fail: back to Code, dashed, orange */}
      <W pts={failPts(v)} head={9} dash="7 7" color={ORANGE} lit={failLit} opacity={failLit ? 1 : 0.62} width={failLit ? 3 : 2.4} />
      <Disc x={(F7.LX + F7.J) / 2} y={v.FY} icon="cross" warn cls={done ? FAIL_ON : undefined} />
      {b && <Disc x={F7.J + 30} y={v.TY} icon="ban" warn size={30} on={s(1)} cls={done ? BAN_ON : undefined} />}
      {/* T07 press 1: the inputs into the gear */}
      {!b && (
        <>
          <Node x={IN7.SX} y={IN7.Y} size={IN7.S} icon="doc" label="Source" side="left" on={s(1)} k={0.74} d={0.2} />
          <Node x={IN7.DX} y={IN7.Y} size={IN7.S} icon="package" label="Dependencies" side="right" on={s(1)} k={0.74} d={0.7} />
          <W pts={in7(IN7.SX, F7.BX - 8)} on={s(1)} head={8} width={2.2} />
          <W pts={in7(IN7.DX, F7.BX + 8)} on={s(1)} head={8} width={2.2} />
        </>
      )}
      {/* T07 press 2: what the tests cover */}
      {!b && (
        <Panel x={F7.TX - 70} y={226} w={140} h={98} on={s(2)} lit={hot === 1}>
          {[['Unit', 0], ['Integration', 1]].map(([label, i]) => (
            <div key={label} style={{ position: 'absolute', left: 20, top: 20 + Number(i) * 32, height: 26, display: 'flex', alignItems: 'center', gap: 7 }}>
              <Ico3D name="check" size={20} loop="pulse" d={Number(i) * 0.6} t={2.4} />
              <span style={{ ...tag(14), textAlign: 'left' }}>{label}</span>
            </div>
          ))}
        </Panel>
      )}
      <Under>
        <Token cls={R.c1} on={done} size={10} />
        <Token cls={R.p1} on={done} size={12} square />
        <Token cls={R.c2} on={done} size={10} />
        <Token cls={R.f2} on={done} size={11} tone={ORANGE} square />
        {b && <Token cls={R.b2} on={done} size={12} square />}
        {!b && IN7_RIDE.map((c) => <Token key={c} cls={c} on={done} size={8} />)}
      </Under>
    </Frame>
  )
}
const B_T07: Fig = (p) => <Flow p={p} b={false} />
const B_T07B: Fig = (p) => <Flow p={p} b />

export const figures: Record<string, Fig> = { B_T05, B_T06, B_T06B, B_T07, B_T07B }
export const css = [
  K.css(),
  KF.join('\n'),
  '.cc-still .s22b-a, .deck-thumb .s22b-a { animation: none !important; }',
  '@media (prefers-reduced-motion: reduce) { .s22b-a { animation: none !important; } }',
].join('\n')
