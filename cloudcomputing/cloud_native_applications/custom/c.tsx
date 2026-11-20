import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, Frame, Show, Plinth, MarkTile, Panel, Wire, Junction, Token, keyframes, loopCls, loopVars, tag, heading, useHeld, useHot, type Pt } from '@/engine/figkit'
import gatewayMark from '../images/aws-api-gateway.svg'
import sqsMark from '../images/aws-sqs.svg'
import snsMark from '../images/aws-sns.svg'
import clientMark from '../images/res-client.svg'

/*
 * SESSION 18 · SECTION 3 (Monolith vs Microservices) technical figures, builder C.
 * Built to generate-slides standing correction 17 (Sessions 14-16): 3D icons on plinth tiles, official marks on white
 * tiles, >= 20 px equal padding, orthogonal wires computed from the same constants as the boxes, a flow dot on every
 * wire, a lit item walking first -> last -> first after the build. Loops are transform / opacity on HTML elements (or a
 * root svg) only. Held (?still): the full final state, nothing lit, nothing moving. Class prefix `s18c-`.
 *
 *   slide 25 C_T11   566 x 340  Monolith card (three modules, one shared database) | Microservices rows (own API and
 *                               database each, thin links between APIs); press 3 copies only the busy Orders service (3)
 *   slide 28 C_T13   546 x 330  one box split into Orders, Payments, Inventory with their own databases; Payments reaches
 *                               Orders' data through its API (tick), never its tables (cross); links; bounded contexts (4)
 *   slide 29 C_T14   566 x 360  Synchronous lane (REST / gRPC call, caller waits) and Asynchronous lane (queue) (2)
 *   slide 30 C_T14B  586 x 324  Client -> API Gateway -> three services; Payments drops a message on SQS (SNS beside),
 *                               Inventory reads it later (2)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('s18c')
const BLUE = colors.brand
const I = (n: string) => n as Ico3DName

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)
const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })

/** the build of a figure: the step, the lit item, held */
function useBuild(p: Record<string, unknown>, period: number) {
  const cnt = Number(p.steps ?? 1)
  const held = useHeld()
  const step = held ? cnt : stepOf(p)
  /* figkit's walk starts at item 0 the moment the build ends, so the last press would light the FIRST item; start the
     walk on the last item instead (last -> first -> ... -> last), so the final press lights what it built */
  const raw = useHot(cnt, stepOf(p), period)
  const hot = raw >= 0 && stepOf(p) >= cnt ? (raw + cnt - 1) % cnt : raw
  return { step, hot, held, s: (n: number) => step >= n, live: !held }
}

/** a 3D icon (or an official mark) on its plinth with its tag under (or above) it; the TILE is centred on (x, y) */
function Node({ x, y, label, icon, mark, size = 52, k = 0.74, on = true, lit = false, loop = 'bob', d = 0, t, w = 120, tagSize = 14, up = false, delay = 0, z = 3, children }: { x: number; y: number; label?: string; icon?: Ico3DName; mark?: string; size?: number; k?: number; on?: boolean; lit?: boolean; loop?: Loop; d?: number; t?: number; w?: number; tagSize?: number; up?: boolean; delay?: number; z?: number; children?: ReactNode }) {
  const tile = mark ? <MarkTile src={mark} size={size} lit={lit} /> : (
    <Plinth size={size} lit={lit}>
      <Ico3D name={icon ?? 'doc'} size={Math.round(size * k)} loop={loop} d={d} t={t} />
    </Plinth>
  )
  const lab = label ? <span style={{ ...tag(tagSize), [up ? 'marginBottom' : 'marginTop']: 6 }}>{label}</span> : null
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, width: w, zIndex: z, display: 'flex', flexDirection: up ? 'column-reverse' : 'column', alignItems: 'center', ...(up ? { bottom: `calc(100% - ${y + size / 2}px)` } : { top: y - size / 2 }) }}>
      <div style={{ position: 'relative', width: size, height: size, display: 'grid', placeItems: 'center' }}>
        {tile}
        {children}
      </div>
      {lab}
    </Show>
  )
}

/** a small white disc holding a 3D icon, centred on (x, y) of the frame (a badge on a tile's corner or on a wire) */
function Disc({ x, y, on = true, size = 26, icon, loop = 'pulse', d = 0, t = 2.4, warn = false }: { x: number; y: number; on?: boolean; size?: number; icon: Ico3DName; loop?: Loop; d?: number; t?: number; warn?: boolean }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: 6, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6', display: 'grid', placeItems: 'center', opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}` }}>
      {warn ? <OrangeCross size={size - 6} /> : <Ico3D name={icon} size={size - 6} loop={loop} d={d} t={t} />}
    </span>
  )
}

/** the engine's 3D cross turned to the template's orange (blocked = orange, never red) */
const OrangeCross = ({ size }: { size: number }) => (
  <span style={{ display: 'grid', filter: 'hue-rotate(28deg) saturate(1.15) brightness(1.06)' }}>
    <Ico3D name="cross" size={size} loop="none" />
  </span>
)

/** a white disc carrying a mini 3D icon along a `ride` class (placed from the frame's 0,0); nothing on held frames */
function Rider({ cls, icon, size = 24, on = true }: { cls: string; icon: Ico3DName; size?: number; on?: boolean }) {
  const held = useHeld()
  if (held || !on) return null
  return (
    <span aria-hidden style={{ position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, zIndex: 7, pointerEvents: 'none' }}>
      <span className={cls} style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -4px rgba(31,64,140,0.55)', opacity: 0 }}>
        <Ico3D name={icon} size={size - 6} loop="none" />
      </span>
    </span>
  )
}

/** a wire on its own layer above the cards (a Panel is z 2 and would hide a wire drawn inside it); tiles (z 3) stay on top */
const W = (props: Parameters<typeof Wire>[0]) => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}><Wire {...props} /></div>
)

/** a title row: a 3D icon on its plinth and the heading beside it, the row's left edge at x, centred on y */
function TitleRow({ x, y, icon, text, size = 34, on = true, lit = false }: { x: number; y: number; icon: Ico3DName; text: string; size?: number; on?: boolean; lit?: boolean }) {
  return (
    <Show on={on} style={{ position: 'absolute', left: x, top: y - size / 2, height: size, display: 'flex', alignItems: 'center', gap: 10, zIndex: 3 }}>
      <Plinth size={size} lit={lit}><Ico3D name={icon} size={Math.round(size * 0.76)} loop="bob" /></Plinth>
      <span style={{ ...heading(17), whiteSpace: 'nowrap' }}>{text}</span>
    </Show>
  )
}

/** the three business capabilities (TR 13's words) */
const CAPS: { name: string; icon: Ico3DName }[] = [
  { name: 'Orders', icon: I('cart') },
  { name: 'Payments', icon: 'coin' },
  { name: 'Inventory', icon: 'package' },
]

/* ================================================================== slide 25 · C_T11 · monolith vs microservices */

/*
 * 566 x 340. Left: the title row (cube, `Monolith`, y 37) over the Monolith card (x 20..186, y 64..320): three module
 * bars stacked tight (x 40..166, h 36, gap 10, pinned together) wired to ONE shared database (103, 254). Right: the
 * title row (cubes, `Microservices`) over three service rows (x 206..546, h 78, gap 11): the name, the service tile, and
 * at the row's right end its own API (466) and its own database (508). Press 0 (the lead names both styles) draws both;
 * press 1 pins the modules together and wires them to the shared database; press 2 the thin wires joining the APIs row
 * to row; press 3 only Orders (the busy one) gets two more copies of its service tile, the load chart on the last copy.
 */
const A = { W: 566, H: 340, MX: 20, MW: 166, MY: 64, MB: 320, RX: 40, RW: 126, RH: 36, RG: 10, RY: 84, DBX: 103, DBY: 254, SX: 206, SR: 546, ROWH: 78, ROWG: 11, TS: 36, SV: 330, API: 466, DB: 508, CP: 42, PER: 3.6 }
const A_ROWY = [0, 1, 2].map((i) => A.MY + i * (A.ROWH + A.ROWG)) // 64, 153, 242
const A_CY = A_ROWY.map((y) => y + A.ROWH / 2) // 103, 192, 281
const A_BARY = [0, 1, 2].map((i) => A.RY + i * (A.RH + A.RG)) // 84, 130, 176
const A_STACKB = A_BARY[2] + A.RH // 212
const A_DBW: Pt[] = [[A.DBX, A_STACKB], [A.DBX, A.DBY - 20]]
const A_LINK: Pt[][] = [0, 1].map((i) => [[A.API, A_CY[i] + A.TS / 2], [A.API, A_CY[i + 1] - A.TS / 2]])
const A_DBR = K.ride('t11db', A_DBW, 0.2, 0.9, 1.8)
const A_LR = [K.ride('t11l0', A_LINK[0], 0.3, 1.3, A.PER), K.ride('t11l1', A_LINK[1], 1.6, 2.6, A.PER)]
const A_LB = [K.ride('t11b0', [...A_LINK[0]].reverse(), 2.0, 3.0, A.PER), K.ride('t11b1', [...A_LINK[1]].reverse(), 0.2, 1.2, A.PER)]

const C_T11: Fig = (p) => {
  const { hot, s, held } = useBuild({ ...p, steps: p.steps ?? 3 }, 1800)
  return (
    <Frame w={A.W} h={A.H}>
      {/* point 1: one codebase, modules pinned together, one shared database */}
      <TitleRow x={A.MX} y={37} icon={I('cube')} text="Monolith" lit={hot === 0} />
      <Panel x={A.MX} y={A.MY} w={A.MW} h={A.MB - A.MY} lit={hot === 0}>
        {CAPS.map((c, i) => (
          <div key={c.name} style={{ ...box(A.RX - A.MX, A_BARY[i] - A.MY, A.RW, A.RH), borderRadius: 10, background: '#F2F6FF', boxShadow: 'inset 0 0 0 1.5px #D3DEF6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 0 12px' }}>
            <span style={{ ...heading(15), fontWeight: 600 }}>{c.name}</span>
            <Plinth size={28}><Ico3D name={c.icon} size={21} loop="bob" d={i * 0.4} /></Plinth>
          </div>
        ))}
        {/* the pins holding the modules together (tightly coupled) */}
        {[0, 1].map((i) => [56, 96].map((x) => (
          <Show key={`${i}-${x}`} on={s(1)} delay={i * 120} style={{ ...box(x - A.MX, A_BARY[i] + A.RH - 3 - A.MY, 6, A.RG + 6), borderRadius: 3, background: hot === 0 ? ORANGE : '#9DB6EE' }} />
        )))}
      </Panel>
      <W pts={A_DBW} on={s(1)} lit={hot === 0} head={8} />
      <Node x={A.DBX} y={A.DBY} icon="database" size={40} w={140} label="Shared Database" lit={hot === 0} loop="pulse" t={3} />
      <Token cls={A_DBR} on={s(1)} size={8} />

      {/* point 2: separate services, each with its own API and its own database */}
      <TitleRow x={A.SX} y={37} icon={I('cubes')} text="Microservices" lit={hot === 1} />
      {CAPS.map((c, i) => {
        const busy = i === 0
        const cy = A_CY[i]
        return (
          <div key={c.name}>
            <Panel x={A.SX} y={A_ROWY[i]} w={A.SR - A.SX} h={A.ROWH} lit={hot === 1 || (hot === 2 && busy)} />
            <Show on style={{ ...box(A.SX + 20, cy - 11, 96, 22), zIndex: 3, display: 'flex', alignItems: 'center' }}>
              <span style={{ ...heading(16), whiteSpace: 'nowrap' }}>{c.name}</span>
            </Show>
            {/* the service, and (Orders only, press 3) its copies */}
            {[0, 1, 2].map((k) => (
              k > 0 && !busy ? null : (
                <Show key={k} on={k === 0 || s(3)} delay={k === 0 ? 0 : (k - 1) * 160} style={{ ...box(A.SV - A.TS / 2 + k * A.CP, cy - A.TS / 2, A.TS, A.TS), zIndex: 3 }}>
                  {busy && k === 0 && s(3) && !held && (
                    <span aria-hidden className={loopCls('ripple')} style={{ position: 'absolute', inset: -6, borderRadius: 16, boxShadow: `0 0 0 2px ${BLUE}55`, ...loopVars(0, 2.4) }} />
                  )}
                  <Plinth size={A.TS} lit={hot === 2 && busy}><Ico3D name={c.icon} size={27} loop="bob" d={i * 0.4 + k * 0.3} /></Plinth>
                </Show>
              )
            ))}
            <Show on style={{ ...box(A.API - A.TS / 2, cy - A.TS / 2, A.TS, A.TS), zIndex: 3 }}>
              <Plinth size={A.TS}><Ico3D name={I('api')} size={27} loop="pulse" d={i * 0.5} t={3} /></Plinth>
            </Show>
            <Show on style={{ ...box(A.DB - A.TS / 2, cy - A.TS / 2, A.TS, A.TS), zIndex: 3 }}>
              <Plinth size={A.TS}><Ico3D name="database" size={27} loop="bob" d={i * 0.5 + 0.3} /></Plinth>
            </Show>
          </div>
        )
      })}
      {A_LINK.map((pts, i) => <W key={i} pts={pts} on={s(2)} lit={hot === 1} head={0} width={1.8} delay={300} />)}
      {A_LR.map((c, i) => <Token key={i} cls={c} on={s(2)} size={7} />)}
      {A_LB.map((c, i) => <Token key={`b${i}`} cls={c} on={s(2)} size={7} />)}

      {/* point 3: the load on Orders; only Orders is copied */}
      <Disc x={A.SV + 2 * A.CP + A.TS / 2 - 3} y={A_CY[0] - A.TS / 2 + 1} icon="chart" size={24} on={s(3)} loop="pulse" />
    </Frame>
  )
}

/* ================================================================== slide 28 · C_T13 · where to split */

/*
 * 546 x 330. Three columns (w 144, gap 36: x 20, 200, 380; y 30..306), centres 92 / 272 / 452. In each: the name
 * (y 62), its API (y 108), the capability tile (y 180) and its own database (y 260), joined top to bottom by thick
 * internal wires. Press 0 the three sit in ONE box split by dashed lines; press 1 the box splits into the three services
 * and each gets its database; press 2 the APIs, and Payments reaches Orders' data two ways: the solid thin wire into
 * Orders' API (green tick), and a dashed faded path straight at Orders' tables, stopped by an orange cross; press 3 the
 * links (thick inside, the one thin link across); press 4 a dashed bounded-context outline round each service.
 */
const B = { W: 546, H: 330, CW: 144, Y0: 30, Y1: 306, NY: 62, AY: 108, AS: 36, SY: 180, SS: 48, DY: 260, DS: 40, PER: 3.4 }
const B_X = [20, 200, 380]
const B_C = B_X.map((x) => x + B.CW / 2) // 92, 272, 452
const B_IN1: Pt[][] = B_C.map((x) => [[x, B.AY + B.AS / 2], [x, B.SY - B.SS / 2]])
const B_IN2: Pt[][] = B_C.map((x) => [[x, B.SY + B.SS / 2], [x, B.DY - B.DS / 2]])
const B_PL = B_C[1] - B.SS / 2 // 248, Payments tile's left edge
const B_GOOD: Pt[] = [[B_PL, B.SY - 8], [176, B.SY - 8], [176, B.AY], [B_C[0] + B.AS / 2, B.AY]]
const B_BAD: Pt[] = [[B_PL, B.SY + 12], [188, B.SY + 12], [188, B.DY], [154, B.DY]]
const B_XX = 138 // the orange cross, before Orders' tables (right edge 112)
const B_RG = K.ride('t13g', B_GOOD, 0.1, 1.2, B.PER)
const B_RG1 = K.ride('t13g1', B_IN1[0], 1.25, 1.6, B.PER)
const B_RG2 = K.ride('t13g2', B_IN2[0], 1.75, 2.15, B.PER)
const B_RB = K.ride('t13b', B_BAD, 1.6, 2.7, B.PER, 0.4)
const B_R1 = [1, 2].map((i) => K.ride(`t13i${i}`, B_IN1[i], 0.4 + i * 0.6, 0.8 + i * 0.6, B.PER))
const B_R2 = [1, 2].map((i) => K.ride(`t13j${i}`, B_IN2[i], 0.9 + i * 0.6, 1.3 + i * 0.6, B.PER))

const C_T13: Fig = (p) => {
  const { hot, s, held, step } = useBuild({ ...p, steps: p.steps ?? 4 }, 1800)
  const instant = useInstant()
  const whole = !held && step === 0
  return (
    <Frame w={B.W} h={B.H}>
      {/* press 0: one box, the future seams dashed */}
      <Panel x={B_X[0]} y={B.Y0} w={B_X[2] + B.CW - B_X[0]} h={B.Y1 - B.Y0} on={whole}>
        {[0, 1].map((i) => (
          <span key={i} aria-hidden style={{ ...box((B_X[i] + B.CW + B_X[i + 1]) / 2 - B_X[0] - 1, 16, 0, B.Y1 - B.Y0 - 32), borderLeft: '2px dashed #9DB6EE' }} />
        ))}
      </Panel>
      {/* press 1: the split, one service per business capability */}
      {B_X.map((x, i) => <Panel key={x} x={x} y={B.Y0} w={B.CW} h={B.Y1 - B.Y0} on={s(1)} delay={i * 100} lit={hot === 0} />)}

      {/* press 4: a bounded-context outline round each service */}
      {B_X.map((x, i) => (
        <Show key={x} on={s(4)} delay={i * 100} style={{ ...box(x, B.Y0, B.CW, B.Y1 - B.Y0), zIndex: 2, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 18, border: `2px dashed ${hot === 3 ? ORANGE : '#7FA0EA'}`, transition: instant ? 'none' : `border-color 420ms ${EASE}` }} />
        </Show>
      ))}
      {B_C.map((x, i) => <Disc key={x} x={B_X[i] + B.CW - 18} y={B.Y0} icon="book" size={26} on={s(4)} loop="bob" d={i * 0.4} />)}

      {/* names and capability tiles (always there: they ARE the monolith's parts at press 0) */}
      {CAPS.map((c, i) => (
        <Show key={c.name} on style={{ ...box(B_X[i], B.NY - 12, B.CW, 24), zIndex: 3, display: 'grid', placeItems: 'center' }}>
          <span style={{ ...heading(16), whiteSpace: 'nowrap' }}>{c.name}</span>
        </Show>
      ))}
      {CAPS.map((c, i) => <Node key={c.name} x={B_C[i]} y={B.SY} icon={c.icon} size={B.SS} lit={hot === 0} d={i * 0.4} />)}

      {/* press 1: each service's own database */}
      {B_IN2.map((pts, i) => <W key={i} pts={pts} on={s(1)} lit={hot === 2} head={8} width={3.4} delay={i * 100} />)}
      {B_C.map((x, i) => <Node key={x} x={x} y={B.DY} icon="database" size={B.DS} on={s(1)} delay={i * 100 + 150} loop="pulse" t={3} d={i * 0.5} />)}

      {/* press 2: the APIs, and the two ways Payments could reach Orders' data */}
      {B_IN1.map((pts, i) => <W key={i} pts={pts} on={s(2)} lit={hot === 2} head={8} width={3.4} />)}
      {B_C.map((x, i) => <Node key={x} x={x} y={B.AY} icon={I('api')} size={B.AS} on={s(2)} lit={hot === 1 && i === 0} loop="pulse" t={3} d={i * 0.4} />)}
      <W pts={B_GOOD} on={s(2)} lit={hot === 1 || hot === 2} head={9} width={2} delay={200} />
      <Disc x={224} y={B.SY - 8} icon="check" size={26} on={s(2)} loop="pulse" />
      <W pts={B_BAD} on={s(2)} color={ORANGE} head={0} width={2.2} dash="6 6" opacity={0.5} delay={300} />
      <Disc x={B_XX} y={B.DY} icon="cross" warn size={28} on={s(2)} />

      {/* press 3: tight links inside each service */}
      {B_C.map((x, i) => <Disc key={x} x={x} y={(B.SY + B.SS / 2 + B.DY - B.DS / 2) / 2} icon="link" size={24} on={s(3)} loop="tilt" d={i * 0.4} />)}

      <Token cls={B_RG} on={s(2)} size={8} />
      <Token cls={B_RG1} on={s(2)} size={8} />
      <Token cls={B_RG2} on={s(2)} size={8} />
      <Token cls={B_RB} on={s(2)} size={8} tone={ORANGE} />
      {B_R1.map((c, i) => <Token key={i} cls={c} on={s(2)} size={7} />)}
      {B_R2.map((c, i) => <Token key={i} cls={c} on={s(2)} size={7} />)}
    </Frame>
  )
}

/* ================================================================== slide 29 · C_T14 · sync vs async */

/*
 * 566 x 360. Two lanes (x 20..546, h 154): Synchronous (y 20) and Asynchronous (y 186). In each: the lane heading
 * (T + 30), Service A (110) and Service B (456) at T + 86. Sync: the call A -> B (tag `REST / gRPC` above it) and the
 * reply B -> A below it; A waits (hourglass). Async: A -> Queue (283) -> B; A carries on (gear), B reads later.
 */
const C = { W: 566, H: 360, X0: 20, X1: 546, LH: 154, AX: 110, BX: 456, QX: 283, NS: 52, QS: 56, OFF: 10 }
const C_T = [20, 186]
const C_Y = C_T.map((t) => t + 86) // 106, 272
const C_CALL: Pt[] = [[C.AX + C.NS / 2, C_Y[0] - C.OFF], [C.BX - C.NS / 2, C_Y[0] - C.OFF]]
const C_REPLY: Pt[] = [[C.BX - C.NS / 2, C_Y[0] + C.OFF], [C.AX + C.NS / 2, C_Y[0] + C.OFF]]
const C_DROP: Pt[] = [[C.AX + C.NS / 2, C_Y[1]], [C.QX - C.QS / 2, C_Y[1]]]
const C_READ: Pt[] = [[C.QX + C.QS / 2, C_Y[1]], [C.BX - C.NS / 2, C_Y[1]]]
/* sync: call, then the reply, the caller idle between; 3.2 s */
const C_RC = K.ride('t14c', C_CALL, 0.1, 1.0, 3.2)
const C_RR = K.ride('t14r', C_REPLY, 1.7, 2.6, 3.2)
/* async: A drops three messages in quick turns; B reads them later, at its own pace; 4.4 s */
const C_RD = [0, 1, 2].map((i) => K.ride(`t14d${i}`, C_DROP, 0.1 + i * 0.55, 0.7 + i * 0.55, 4.4))
const C_RQ = [0, 1, 2].map((i) => K.ride(`t14q${i}`, C_READ, 2.0 + i * 0.75, 2.7 + i * 0.75, 4.4))

const C_T14: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 2 }, 2400)
  const lanes = ['Synchronous', 'Asynchronous']
  return (
    <Frame w={C.W} h={C.H}>
      {lanes.map((name, i) => (
        <Panel key={name} x={C.X0} y={C_T[i]} w={C.X1 - C.X0} h={C.LH} lit={hot === i}>
          <span style={{ position: 'absolute', left: 20, top: 20, ...heading(16) }}>{name}</span>
        </Panel>
      ))}
      {C_Y.map((y, i) => (
        <div key={y}>
          <Node x={C.AX} y={y} icon="server" size={C.NS} label="Service A" d={i * 0.5}>
            {i === 0 ? <Disc x={4} y={4} icon="hourglass" size={28} on={s(1)} loop="tilt" t={2} /> : <Disc x={4} y={4} icon="gear" size={28} on={s(2)} loop="spin" t={4} />}
          </Node>
          <Node x={C.BX} y={y} icon="server" size={C.NS} label="Service B" d={i * 0.5 + 0.3} />
        </div>
      ))}

      {/* point 1: the call, the wait, the reply */}
      <W pts={C_CALL} on={s(1)} lit={hot === 0} head={9} />
      <W pts={C_REPLY} on={s(1)} lit={hot === 0} head={9} delay={300} />
      <Show on={s(1)} delay={200} style={{ ...box(C.QX - 70, C_Y[0] - C.OFF - 30, 140, 20), zIndex: 3, display: 'grid', placeItems: 'center' }}>
        <span style={tag(14)}>REST / gRPC</span>
      </Show>
      <Token cls={C_RC} on={s(1)} size={9} />
      <Token cls={C_RR} on={s(1)} size={9} tone={colors.brandDark} />

      {/* point 2: dropped on a queue, read later */}
      <W pts={C_DROP} on={s(2)} lit={hot === 1} head={9} />
      <W pts={C_READ} on={s(2)} lit={hot === 1} head={9} delay={300} />
      <Node x={C.QX} y={C_Y[1]} icon={I('queue')} size={C.QS} label="Queue" on={s(2)} lit={hot === 1} loop="pulse" t={3} delay={150} />
      {C_RD.map((c, i) => <Rider key={i} cls={c} icon="mail" size={22} on={s(2)} />)}
      {C_RQ.map((c, i) => <Rider key={`q${i}`} cls={c} icon="mail" size={22} on={s(2)} />)}
    </Frame>
  )
}

/* ================================================================== slide 30 · C_T14B · API Gateway, SQS and SNS */

/*
 * 586 x 324. Client (60, 160) -> API Gateway (172, 160) -> a junction (248) fanning out to Orders, Payments and
 * Inventory (x 318; y 64, 160, 256). Payments drops a message on SQS (440, 160), SNS beside it (528, 160), their tags
 * above them; Inventory reads it later from SQS (down at x 440, then left into Inventory's right edge).
 */
const D = { W: 586, H: 324, CX: 60, GX: 172, J: 248, SX: 318, QX: 440, NX: 528, Y: 160, NS: 52, PER: 3.6 }
const D_SY = [64, 160, 256]
const D_IN: Pt[] = [[D.CX + D.NS / 2, D.Y], [D.GX - D.NS / 2, D.Y]]
const D_GJ: Pt[] = [[D.GX + D.NS / 2, D.Y], [D.J, D.Y]]
const dBranch = (y: number): Pt[] => (y === D.Y ? [[D.J, y], [D.SX - D.NS / 2, y]] : [[D.J, D.Y], [D.J, y], [D.SX - D.NS / 2, y]])
const D_DROP: Pt[] = [[D.SX + D.NS / 2, D.Y], [D.QX - D.NS / 2, D.Y]]
const D_READ: Pt[] = [[D.QX, D.Y + D.NS / 2], [D.QX, D_SY[2]], [D.SX + D.NS / 2, D_SY[2]]]
const D_REQ = D_SY.map((y, i) => K.ride(`t14bq${i}`, [...D_IN, ...D_GJ.slice(1), ...dBranch(y).slice(1)], 0.1 + i * 0.5, 1.4 + i * 0.5, D.PER))
const D_RM = K.ride('t14bm', D_DROP, 1.9, 2.5, D.PER)
const D_RR = K.ride('t14br', D_READ, 2.9, 3.5, D.PER)

const C_T14B: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 2 }, 2400)
  return (
    <Frame w={D.W} h={D.H}>
      <Node x={D.CX} y={D.Y} mark={clientMark} size={D.NS} label="Client" w={90} />
      {CAPS.map((c, i) => <Node key={c.name} x={D.SX} y={D_SY[i]} icon={c.icon} size={D.NS} label={c.name} w={100} d={i * 0.4} />)}

      {/* point 1: one entry point, fanning out to the services */}
      <W pts={D_IN} on={s(1)} lit={hot === 0} head={9} />
      <W pts={D_GJ} on={s(1)} lit={hot === 0} head={0} delay={200} />
      {D_SY.map((y, i) => <W key={y} pts={dBranch(y)} on={s(1)} lit={hot === 0} head={9} delay={300 + i * 100} />)}
      <Junction x={D.J} y={D.Y} on={s(1)} lit={hot === 0} />
      <Node x={D.GX} y={D.Y} mark={gatewayMark} size={D.NS} label="API Gateway" w={110} on={s(1)} lit={hot === 0} />

      {/* point 2: a message dropped on SQS (SNS beside it), read later */}
      <W pts={D_DROP} on={s(2)} lit={hot === 1} head={9} />
      <W pts={D_READ} on={s(2)} lit={hot === 1} head={9} delay={300} />
      <Node x={D.QX} y={D.Y} mark={sqsMark} size={D.NS} label="SQS" up w={70} on={s(2)} lit={hot === 1} delay={100} />
      <Node x={D.NX} y={D.Y} mark={snsMark} size={D.NS} label="SNS" up w={70} on={s(2)} lit={hot === 1} delay={250} />

      {D_REQ.map((c, i) => <Token key={i} cls={c} on={s(1)} size={9} />)}
      <Rider cls={D_RM} icon="mail" size={22} on={s(2)} />
      <Rider cls={D_RR} icon="mail" size={22} on={s(2)} />
    </Frame>
  )
}

export const figures: Record<string, Fig> = { C_T11, C_T13, C_T14, C_T14B }
export const css = K.css()
