import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, Frame, Show, Plinth, MarkTile, Panel, Wire, Junction, Token, keyframes, loopCls, loopVars, tag, heading, useHeld, useHot, type Pt } from '@/engine/figkit'
import { iconUrl } from '@/decks/figures/net/fx'
import k8sMark from '../images/tech-kubernetes.svg'
import eksMark from '../images/aws-eks.svg'
import clientMark from '../images/res-client.svg'

/*
 * SESSION 20 · SECTION 1 (Need for Orchestration) technical figures, builder A.
 * Built to generate-slides standing corrections 13-17 and cloud course R7-R14: glossy 3D icons on white plinth tiles,
 * official marks on white tiles, >= 20 px equal padding, orthogonal wires computed from the same constants as the boxes,
 * a flow dot on every live wire, a lit item walking last -> first -> ... after the build (S18 `useBuild`). Loops are
 * transform / opacity on HTML elements only. Held (?still): the full final state, nothing lit, nothing moving.
 * Class prefix `s20a-`. The engineer is the engine library's 3D render `coder` (R7.1), facing right, at the hosts.
 *
 *   slide 6  A_T01   1080 x 380  One Host (engineer, commands, one host with two containers) | Many Hosts (the same
 *                                engineer before a 4 x 3 grid of hosts, stopped containers and alerts) | press 2 the wire
 *                                from the grid to the Automated Controller (Kubernetes mark) (2)
 *   slide 7  A_T01B  566 x 360   the controller over three hosts: a container lands on the least-loaded host; a
 *                                stopped container is replaced (2)
 *   slide 8  A_T01C  566 x 360   the same hosts: containers come and go with Demand; a container moves host and its
 *                                network link re-attaches (2)
 *   slide 10 A_T02   566 x 360   timeline: Traffic spike, Manual lane (orange delay, Placement / Health / Scaling),
 *                                Automated lane reacting at the spike (3)
 *   slide 11 A_T02B  566 x 320   Updates (a new image rolling across hosts, Downtime) | Discovery (a static link to a
 *                                moved container breaks) | Kubernetes inside Amazon EKS (3)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('s20a')
const BLUE = colors.brand
const CODER = iconUrl('coder')
const CODER_K = 171 / 256 // the render's height / width

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)
const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })
const pc = (v: number) => `${Math.max(0, Math.min(100, v)).toFixed(2)}%`

/** the build of a figure: the step, the lit item, held (S18 c.tsx: the walk starts on the LAST item) */
function useBuild(p: Record<string, unknown>, period: number) {
  const cnt = Number(p.steps ?? 1)
  const held = useHeld()
  const step = held ? cnt : stepOf(p)
  const raw = useHot(cnt, stepOf(p), period)
  const hot = raw >= 0 && stepOf(p) >= cnt ? (raw + cnt - 1) % cnt : raw
  return { step, hot, held, s: (n: number) => step >= n, live: !held }
}

/** a 3D icon (or an official mark) on its plinth with its tag under (or above) it; the TILE is centred on (x, y) */
function Node({ x, y, label, icon, mark, size = 52, k = 0.74, on = true, lit = false, loop = 'bob', d = 0, t, w = 120, tagSize = 14, up = false, delay = 0, z = 3, dim = false, children }: { x: number; y: number; label?: string; icon?: Ico3DName; mark?: string; size?: number; k?: number; on?: boolean; lit?: boolean; loop?: Loop; d?: number; t?: number; w?: number; tagSize?: number; up?: boolean; delay?: number; z?: number; dim?: boolean; children?: ReactNode }) {
  const instant = useInstant()
  const tile = mark ? <MarkTile src={mark} size={size} /> : (
    <Plinth size={size}>
      <Ico3D name={icon ?? 'doc'} size={Math.round(size * k)} loop={loop} d={d} t={t} />
    </Plinth>
  )
  const lab = label ? <span style={{ ...tag(tagSize), [up ? 'marginBottom' : 'marginTop']: 6 }}>{label}</span> : null
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, width: w, zIndex: z, display: 'flex', flexDirection: up ? 'column-reverse' : 'column', alignItems: 'center', ...(up ? { bottom: `calc(100% - ${y + size / 2}px)` } : { top: y - size / 2 }) }}>
      <div style={{ position: 'relative', width: size, height: size, display: 'grid', placeItems: 'center', opacity: dim ? 0.5 : 1, transition: instant ? 'none' : `opacity 520ms ${EASE}` }}>
        {tile}
        <Ring on={lit} r={Math.round(size * 0.28)} />
        {children}
      </div>
      {lab}
    </Show>
  )
}

/** the engine's 3D cross turned to the template's orange (failure = orange, never red; S18 c.tsx) */
const OrangeCross = ({ size }: { size: number }) => (
  <span style={{ display: 'grid', filter: 'hue-rotate(28deg) saturate(1.15) brightness(1.06)' }}>
    <Ico3D name="cross" size={size} loop="none" />
  </span>
)

/** the lit ring in the deck blue: orange means failure on these slides (R8.2, one meaning; S18 slide 9 correction) */
const BLUE_LIT = `0 0 0 3px ${BLUE}, 0 10px 22px -12px rgba(45,99,251,0.7)`
function Ring({ on, r, inset = 0 }: { on: boolean; r: number; inset?: number }) {
  const instant = useInstant()
  return <span aria-hidden style={{ position: 'absolute', inset, borderRadius: r, pointerEvents: 'none', zIndex: 1, boxShadow: on ? BLUE_LIT : '0 0 0 0 rgba(45,99,251,0)', transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }} />
}

/** a Panel whose lit ring is the deck blue */
function BPanel({ lit = false, children, ...p }: Parameters<typeof Panel>[0]) {
  return (
    <Panel {...p}>
      <Ring on={lit} r={p.radius ?? 18} />
      {children}
    </Panel>
  )
}

/** a small white disc holding a 3D icon (or the orange cross), centred on (x, y) of the frame; `cls` loops its wrapper */
function Disc({ x, y, on = true, size = 26, icon = 'check', loop = 'pulse', d = 0, t = 2.4, warn = false, grey = false, cls, lit = false, z = 6, delay = 0 }: { x: number; y: number; on?: boolean; size?: number; icon?: Ico3DName; loop?: Loop; d?: number; t?: number; warn?: boolean; grey?: boolean; cls?: string; lit?: boolean; z?: number; delay?: number }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: z, opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE} ${on ? delay : 0}ms, transform 520ms ${EASE} ${on ? delay : 0}ms` }}>
      <span className={cls} style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: lit ? `0 0 0 2.5px ${BLUE}, 0 4px 10px -5px rgba(45,99,251,0.7)` : '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6', transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
        {warn ? <OrangeCross size={size - 6} /> : (
          <span style={{ display: 'grid', filter: grey ? 'grayscale(1)' : undefined, opacity: grey ? 0.6 : 1 }}>
            <Ico3D name={icon} size={size - 6} loop={loop} d={d} t={t} />
          </span>
        )}
      </span>
    </span>
  )
}

/** a white disc carrying a mini 3D icon along a `ride` class (placed from the frame's 0,0); nothing on held frames */
function Rider({ cls, icon, size = 26, on = true }: { cls: string; icon: Ico3DName; size?: number; on?: boolean }) {
  const held = useHeld()
  if (held || !on) return null
  return (
    <span aria-hidden style={{ position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, zIndex: 7, pointerEvents: 'none' }}>
      <span className={cls} style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -4px rgba(31,64,140,0.55), inset 0 0 0 1px #D3DEF6', opacity: 0 }}>
        <Ico3D name={icon} size={size - 6} loop="none" />
      </span>
    </span>
  )
}

/** a wire on its own layer above the cards (a Panel is z 2 and would hide a wire drawn inside it); tiles (z 3) stay on top */
const W = (props: Parameters<typeof Wire>[0] & { cls?: string }) => {
  const { cls, ...rest } = props
  return (
    <div className={cls} style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}><Wire {...rest} /></div>
  )
}

/** a title row: a 3D icon on its plinth and the heading beside it, the row's left edge at x, centred on y */
function TitleRow({ x, y, icon, text, size = 32, on = true, lit = false, delay = 0 }: { x: number; y: number; icon: Ico3DName; text: string; size?: number; on?: boolean; lit?: boolean; delay?: number }) {
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x, top: y - size / 2, height: size, display: 'flex', alignItems: 'center', gap: 10, zIndex: 3 }}>
      <span style={{ position: 'relative', display: 'grid' }}><Plinth size={size}><Ico3D name={icon} size={Math.round(size * 0.76)} loop="bob" /></Plinth><Ring on={lit} r={Math.round(size * 0.28)} /></span>
      <span style={{ ...heading(17), whiteSpace: 'nowrap' }}>{text}</span>
    </Show>
  )
}

/** the engineer (the library's 3D render, facing right), top-left at (x, y), a quiet breathing bob while live */
function Engineer({ x, y, w, on = true, delay = 0, live }: { x: number; y: number; w: number; on?: boolean; delay?: number; live: boolean }) {
  return (
    <Show on={on} delay={delay} style={{ ...box(x, y, w, Math.round(w * CODER_K)), zIndex: 3 }}>
      <img src={CODER} alt="" aria-hidden draggable={false} className={live ? 's20a-l s20a-breathe' : undefined} style={{ display: 'block', width: w, height: Math.round(w * CODER_K), transformOrigin: '50% 100%' }} />
    </Show>
  )
}

/** a DOM tag placed by its centre (x) and top (y) */
const Tag = ({ x, y, text, w = 160, size = 14, on = true, delay = 0, align = 'center' }: { x: number; y: number; text: string; w?: number; size?: number; on?: boolean; delay?: number; align?: 'center' | 'left' }) => (
  <Show on={on} delay={delay} style={{ ...box(align === 'center' ? x - w / 2 : x, y, w, size + 4), zIndex: 3, display: 'flex', justifyContent: align === 'center' ? 'center' : 'flex-start' }}>
    <span style={tag(size)}>{text}</span>
  </Show>
)

/* ================================================================== slide 6 · A_T01 · one host vs many hosts */

/*
 * 1080 x 380 (the lead stage). Left card One Host (x 20..380): the engineer (x 36, 130 wide) types Docker commands (a
 * terminal rides the wire at y 224) into one host (310, 224) carrying two containers, a green tick: calm. Right card
 * Many Hosts (x 400..860): the same engineer before a 4 x 3 grid of hosts (pitch 66, centres x 604..802, y 158..290),
 * each with its container on the top-right corner; three containers have stopped (orange cross), three hosts raise
 * alerts, and alerts ring the engineer. Press 2: an elbow-free wire from the grid's right edge (826) into the Automated
 * Controller (the Kubernetes mark, 80, at 970, 224). After the build the failures pile up one by one, a dot carries
 * them to the controller, its ring pings, and the failures clear: the controller takes over. Loop 6 s.
 */
const T1 = { W: 1080, H: 380, LX: 20, LR: 380, RX: 400, RR: 860, PY: 20, PB: 360, WY: 224, HX: 316, HS: 64, EW: 118, EY: 171, GS: 48, CX: 970, CS: 80, PER: 6 }
const T1_GX = [604, 670, 736, 802]
const T1_GY = [158, 224, 290]
const T1_GRID = T1_GY.flatMap((y) => T1_GX.map((x) => [x, y] as Pt))
const T1_STOP = [1, 6, 11] // hosts whose container has stopped
const T1_ALERT = [3, 4, 9] // hosts raising an alert
const T1_WL: Pt[] = [[152, T1.WY], [T1.HX - T1.HS / 2, T1.WY]]
const T1_WR: Pt[] = [[530, T1.WY], [T1_GX[0] - T1.GS / 2, T1.WY]]
const T1_WC: Pt[] = [[T1_GX[3] + T1.GS / 2, T1.WY], [T1.CX - T1.CS / 2, T1.WY]]
const T1_RL = K.ride('t1l', T1_WL, 0.2, 1.5, 2.8)
const T1_RR = K.ride('t1r', T1_WR, 0.1, 0.7, 1.4)
const T1_RC = K.ride('t1c', T1_WC, 2.9, 3.7, T1.PER)
/* the failures appear one by one from 0.2 s, hold, and clear when the dot reaches the controller (3.7 s) */
const T1_FAIL = [...T1_STOP, ...T1_ALERT]
const T1_AT = (k: number) => 0.2 + T1_FAIL.indexOf(k) * 0.45

const A_T01: Fig = (p) => {
  const { hot, s, live } = useBuild({ ...p, steps: p.steps ?? 2 }, 2200)
  const run = live && s(2)
  const failCls = (k: number) => (run ? `s20a-l s20a-f${k}` : undefined)
  const okCls = (k: number) => (run ? `s20a-l s20a-o${k}` : undefined)
  return (
    /* the lead stage is figH tall (330 after the 2026-11-23 merge, so it clears the player bar): the 1080 x 380 drawing is scaled to fit, centred */
    <div style={{ width: T1.W, height: Number(p.h ?? T1.H), display: 'flex', justifyContent: 'center' }}>
    <div style={{ width: T1.W, height: T1.H, flexShrink: 0, transformOrigin: '50% 0', transform: `scale(${Math.min(1, Number(p.h ?? T1.H) / T1.H)})` }}>
    <Frame w={T1.W} h={T1.H}>
      {/* ---------- One Host */}
      <Panel x={T1.LX} y={T1.PY} w={T1.LR - T1.LX} h={T1.PB - T1.PY} />
      <TitleRow x={T1.LX + 20} y={56} icon="server" text="One Host" />
      <Engineer x={36} y={T1.EY} w={T1.EW} live={live} />
      <Tag x={36 + T1.EW / 2} y={266} text="Engineer" w={120} />
      <W pts={T1_WL} head={9} />
      <Rider cls={T1_RL} icon="terminal" size={26} />
      <Tag x={(152 + T1.HX - T1.HS / 2) / 2} y={T1.WY - 30} text="Docker Commands" w={128} size={13} />
      <Node x={T1.HX} y={T1.WY} icon="server" size={T1.HS} label="Host" w={80} loop="pulse" t={3} />
      {[0, 1].map((i) => (
        <div key={i} style={{ ...box(T1.HX - 36 + i * 38, 152, 34, 34), zIndex: 3 }}>
          <Plinth size={34}><Ico3D name="container" size={25} loop="bob" d={i * 0.6} /></Plinth>
        </div>
      ))}
      <Tag x={T1.HX} y={128} text="Containers" w={110} />
      <Disc x={T1.HX + 28} y={T1.WY + 28} icon="check" size={24} />

      {/* ---------- Many Hosts */}
      <BPanel x={T1.RX} y={T1.PY} w={T1.RR - T1.RX} h={T1.PB - T1.PY} on={s(1)} lit={hot === 0} />
      <TitleRow x={T1.RX + 20} y={56} icon="server" text="Many Hosts" on={s(1)} lit={hot === 0} />
      <Engineer x={416} y={T1.EY} w={T1.EW} on={s(1)} delay={120} live={live} />
      <Tag x={416 + T1.EW / 2} y={266} text="Engineer" w={120} on={s(1)} delay={120} />
      {/* the engineer, overwhelmed: alerts ring his head */}
      {[[432, 150], [478, 112], [528, 142]].map(([x, y], i) => (
        <Disc key={i} x={x} y={y} icon="alert" size={26} loop="beat" d={i * 0.5} on={s(1)} delay={500 + i * 140} cls={run ? `s20a-l s20a-e${i}` : undefined} />
      ))}
      <W pts={T1_WR} head={8} on={s(1)} delay={200} />
      <Rider cls={T1_RR} icon="terminal" size={22} on={s(1)} />
      {T1_GRID.map(([x, y], k) => (
        <div key={k}>
          <Show on={s(1)} delay={140 + k * 40} style={{ ...box(x - T1.GS / 2, y - T1.GS / 2, T1.GS, T1.GS), zIndex: 3 }}>
            <Plinth size={T1.GS}><Ico3D name="server" size={35} loop="bob" d={(k % 5) * 0.37} /></Plinth>
          </Show>
          {/* its container on the top-right corner; a stopped one shows the orange cross instead */}
          <Disc x={x + 20} y={y - 20} icon="container" size={24} loop="bob" d={k * 0.21} on={s(1)} delay={300 + k * 40} cls={T1_STOP.includes(k) ? okCls(k) : undefined} z={5} />
          {T1_STOP.includes(k) && <Disc x={x + 20} y={y - 20} warn size={24} on={s(1)} delay={300 + k * 40} cls={failCls(k)} />}
          {T1_ALERT.includes(k) && <Disc x={x - 20} y={y - 20} icon="alert" size={24} loop="beat" d={k * 0.3} on={s(1)} delay={300 + k * 40} cls={failCls(k)} />}
        </div>
      ))}
      <Tag x={(T1_GX[0] + T1_GX[3]) / 2} y={322} text="Hosts" w={100} on={s(1)} delay={300} />

      {/* ---------- press 2: the Automated Controller takes over */}
      <W pts={T1_WC} on={s(2)} color={(hot === 1) ? colors.brandDark : BLUE} width={(hot === 1) ? 3.4 : 2.6} head={10} />
      <Token cls={T1_RC} on={run} size={10} />
      <Show on={s(2)} delay={420} style={{ ...box(T1.CX - T1.CS / 2, T1.WY - T1.CS / 2, T1.CS, T1.CS), zIndex: 3 }}>
        {run && <span aria-hidden className="s20a-l s20a-ping" style={{ position: 'absolute', inset: -8, borderRadius: 30, boxShadow: `0 0 0 3px ${BLUE}66`, opacity: 0 }} />}
        <MarkTile src={k8sMark} size={T1.CS} /><Ring on={hot === 1} r={Math.round(T1.CS * 0.28)} />
      </Show>
      <Tag x={T1.CX} y={T1.WY + T1.CS / 2 + 12} text="Automated Controller" w={170} on={s(2)} delay={420} />
    </Frame>
    </div>
    </div>
  )
}

/* ================================================================== slides 7, 8 · the controller over three hosts */

/*
 * 566 x 360, shared by slides 7 and 8. The Automated Controller (Kubernetes mark, 64) at (283, 65), its trunk down to a
 * junction at y 131 and one drop into the top edge of each host card (x 33 / 213 / 393, w 140, y 163..327). A host card:
 * four container slots (34, gap 8) in a 2 x 2 block at the top (local x 32 / 74, y 20 / 62), then its server tile and
 * the tag `Host` (local y 108..144).
 */
const H = { W: 566, H: 360, CY: 65, TS: 64, BUS: 131, CT: 163, CW: 140, CH: 164, SS: 34 }
const H_X = [33, 213, 393]
const H_C = H_X.map((x) => x + H.CW / 2) // 103, 283, 463
const H_SLOT: Pt[] = [[49, 37], [91, 37], [49, 79], [91, 79]]
const slotAt = (h: number, s: number): Pt => [H_X[h] + H_SLOT[s][0], H.CT + H_SLOT[s][1]]
const H_TB = H.CY + H.TS / 2 // 90, the controller's bottom edge
const hWire = (h: number): Pt[] => (h === 1 ? [[283, H_TB], [283, H.CT]] : [[283, H_TB], [283, H.BUS], [H_C[h], H.BUS], [H_C[h], H.CT]])

/** a host card: the slot wells, the server tile and its tag (children are placed in FRAME coordinates) */
function HostCard({ h, lit = false, on = true, delay = 0 }: { h: number; lit?: boolean; on?: boolean; delay?: number }) {
  return (
    <BPanel x={H_X[h]} y={H.CT} w={H.CW} h={H.CH} lit={lit} on={on} delay={delay}>
      {H_SLOT.map(([x, y], i) => (
        <span key={i} aria-hidden style={{ ...box(x - H.SS / 2, y - H.SS / 2, H.SS, H.SS), borderRadius: 10, background: '#F2F6FF', boxShadow: 'inset 0 0 0 1.5px #DCE5F7' }} />
      ))}
      <div style={{ ...box(30, 108, 80, 36), display: 'flex', alignItems: 'center', gap: 8 }}>
        <Plinth size={36}><Ico3D name="server" size={27} loop="pulse" d={h * 0.5} t={3} /></Plinth>
        <span style={tag(14)}>Host</span>
      </div>
    </BPanel>
  )
}

/** a container in slot s of host h; `cls` loops its wrapper, `dim` greys a stopped one */
function Ctr({ h, s: sl, on = true, delay = 0, cls, dim = false, lit = false, d = 0, z = 4 }: { h: number; s: number; on?: boolean; delay?: number; cls?: string; dim?: boolean; lit?: boolean; d?: number; z?: number }) {
  const [x, y] = slotAt(h, sl)
  const instant = useInstant()
  return (
    <Show on={on} delay={delay} lift={-10} style={{ ...box(x - H.SS / 2, y - H.SS / 2, H.SS, H.SS), zIndex: z }}>
      <span className={cls} style={{ position: 'relative', display: 'grid', placeItems: 'center', width: H.SS, height: H.SS }}>
        <span style={{ display: 'grid', filter: dim ? 'grayscale(1)' : undefined, opacity: dim ? 0.45 : 1, transition: instant ? 'none' : `opacity 520ms ${EASE}` }}>
          <Plinth size={H.SS}><Ico3D name="container" size={25} loop={dim ? 'none' : 'bob'} d={d} /></Plinth>
        </span>
        <Ring on={lit} r={10} />
      </span>
    </Show>
  )
}

/** the controller tile with its tag to the right */
function Controller({ lit = false }: { lit?: boolean }) {
  return (
    <>
      <div style={{ ...box(283 - H.TS / 2, H.CY - H.TS / 2, H.TS, H.TS), zIndex: 3 }}><MarkTile src={k8sMark} size={H.TS} lit={lit} /></div>
      <div style={{ ...box(283 + H.TS / 2 + 12, H.CY - 10, 170, 20), zIndex: 3, display: 'flex', alignItems: 'center' }}><span style={tag(14)}>Automated Controller</span></div>
    </>
  )
}

/* ------------------------------------------------------------------ slide 7 · A_T01B · placement and restart */

/*
 * Press 0: the controller and three hosts, loaded 3 / 1 / 2. Press 1 (point 1, placement): a container rides the
 * drop into the middle host, the least loaded, and lands in its second slot. Press 2 (point 2, restart): the right
 * host's second container stops (greyed, orange cross) and a replacement rides down and lands in its third slot with
 * the refresh badge. After the build both arrivals repeat (4.8 s), a dot rides the first host's drop.
 */
const B1 = { PER: 4.8 }
const B1_RB = K.ride('b1b', hWire(1), 0.2, 1.2, B1.PER, 0.9)
const B1_RC = K.ride('b1c', hWire(2), 2.6, 3.9, B1.PER, 0.9)
const B1_RA = K.ride('b1a', hWire(0), 1.1, 2.4, B1.PER)
/* before a drop carries its container, a plain dot keeps it live */
const B1_RP = [1, 2].map((h) => K.ride(`b1p${h}`, hWire(h), 0.3 + h * 0.9, 1.3 + h * 0.9, 3.6))

const A_T01B: Fig = (p) => {
  const { hot, s, live } = useBuild({ ...p, steps: p.steps ?? 2 }, 2000)
  return (
    <Frame w={H.W} h={H.H}>
      <Controller />
      {[0, 1, 2].map((h) => <W key={h} pts={hWire(h)} head={9} color={(h > 0 && hot === h - 1) ? colors.brandDark : BLUE} width={(h > 0 && hot === h - 1) ? 3.4 : 2.6} />)}
      <Junction x={283} y={H.BUS} />
      {[0, 1, 2].map((h) => <HostCard key={h} h={h} lit={h > 0 && hot === h - 1} />)}
      {/* the loads: 3 / 1 / 2 */}
      {[0, 1, 2].map((sl) => <Ctr key={`a${sl}`} h={0} s={sl} d={sl * 0.4} />)}
      <Ctr h={1} s={0} d={0.3} />
      <Ctr h={2} s={0} d={0.5} />
      <Ctr h={2} s={1} d={0.9} dim={s(2)} />
      <Disc x={slotAt(2, 1)[0] + 14} y={slotAt(2, 1)[1] - 14} warn size={22} on={s(2)} />

      {/* point 1: a container lands on the least-loaded host */}
      <Ctr h={1} s={1} on={s(1)} delay={820} lit={hot === 0} cls={live && s(1) ? 's20a-l s20a-landb' : undefined} />
      <Rider cls={B1_RB} icon="container" size={26} on={s(1)} />
      {/* point 2: the stopped container is replaced */}
      <Ctr h={2} s={2} on={s(2)} delay={820} lit={hot === 1} cls={live && s(2) ? 's20a-l s20a-landc' : undefined} />
      <Disc x={slotAt(2, 2)[0] + 14} y={slotAt(2, 2)[1] - 14} icon="refresh" loop="spin" t={4} size={22} on={s(2)} delay={900} />
      <Rider cls={B1_RC} icon="container" size={26} on={s(2)} />
      <Token cls={B1_RA} size={9} />
      <Token cls={B1_RP[0]} size={9} on={!s(1)} />
      <Token cls={B1_RP[1]} size={9} on={!s(2)} />
    </Frame>
  )
}

/* ------------------------------------------------------------------ slide 8 · A_T01C · scale and move */

/*
 * The same controller and hosts. Demand (the gauge, 56, at 90, 65, its level bar at x 28) feeds the controller along
 * y 65. Press 1 (point 3): containers are added on every host as demand rises; after the build the bar rises and
 * falls and the added containers come and go with it (6.4 s). Press 2 (point 4): the first host's linked container
 * (link badge) moves to the right host along the controller's wires, and the network link from the middle host's
 * container re-attaches from the left gap (173..213, y 200) to the right gap (353..393); after the build it moves back
 * and forth (8 s) and the link follows it.
 */
const C1 = { PER: 8, DPER: 6.4, GX: 90, GS: 56, LY: 200 }
const C1_GW: Pt[] = [[C1.GX + C1.GS / 2, H.CY], [283 - H.TS / 2, H.CY]]
const C1_BA: Pt[] = [[H_X[1], C1.LY], [H_X[0] + H.CW, C1.LY]]
const C1_BC: Pt[] = [[H_X[1] + H.CW, C1.LY], [H_X[2], C1.LY]]
const C1_FROM = slotAt(0, 1) // 124, 200
const C1_TO = slotAt(2, 0) // 442, 200
const C1_MOVE: Pt[] = [C1_FROM, [C1_FROM[0], H.BUS], [C1_TO[0], H.BUS], C1_TO]
const C1_RF = K.ride('c1f', C1_MOVE, 1.0, 2.6, C1.PER, 1)
const C1_RB = K.ride('c1b', [...C1_MOVE].reverse(), 5.0, 6.6, C1.PER, 1)
const C1_RG = K.ride('c1g', C1_GW, 0.3, 1.3, 2.6)
const C1_RD = [0, 1, 2].map((h) => K.ride(`c1d${h}`, hWire(h), 1.4 + h * 0.5, 2.4 + h * 0.5, 4))
const C1_RL = [K.ride('c1la', C1_BA, 0.1, 0.8, 1.6), K.ride('c1lc', C1_BC, 0.1, 0.8, 1.6)]
/* the containers added with demand: [host, slot] */
const C1_ADD: [number, number][] = [[0, 2], [1, 1], [1, 2], [2, 3]]

const A_T01C: Fig = (p) => {
  const { hot, s, held, live, step } = useBuild({ ...p, steps: p.steps ?? 2 }, 2200)
  const run3 = live && s(1)
  const run4 = live && s(2)
  /* where the linked container is when nothing moves: the first host before press 2, the right host after it */
  const atC = s(2)
  const instant = useInstant()
  return (
    <Frame w={H.W} h={H.H}>
      <Controller />
      {[0, 1, 2].map((h) => <W key={h} pts={hWire(h)} head={9} />)}
      <Junction x={283} y={H.BUS} />
      {C1_RD.map((c, h) => <Token key={h} cls={c} size={8} />)}

      {/* Demand: the gauge, its level bar, its wire into the controller */}
      <Node x={C1.GX} y={H.CY} icon="gauge" size={C1.GS} label="Demand" loop="pulse" lit={hot === 0} w={90} />
      <div aria-hidden style={{ ...box(28, H.CY - C1.GS / 2, 10, C1.GS), zIndex: 3, borderRadius: 5, background: '#E6EDFB', boxShadow: 'inset 0 0 0 1px #D3DEF6', overflow: 'hidden' }}>
        <span className={run3 ? 's20a-l s20a-level' : undefined} style={{ position: 'absolute', inset: 0, borderRadius: 5, background: `linear-gradient(180deg, #5C8BFF 0%, ${BLUE} 100%)`, transformOrigin: '50% 100%', transform: s(1) ? 'scaleY(1)' : 'scaleY(0.35)', transition: instant ? 'none' : `transform 820ms ${EASE}` }} />
      </div>
      <W pts={C1_GW} head={9} color={(hot === 0) ? colors.brandDark : BLUE} width={(hot === 0) ? 3.4 : 2.6} />
      <Token cls={C1_RG} size={9} />

      {[0, 1, 2].map((h) => <HostCard key={h} h={h} />)}
      {/* the base load */}
      <Ctr h={0} s={0} d={0.2} />
      <Ctr h={1} s={0} d={0.6} />
      <Ctr h={2} s={1} d={0.4} />

      {/* point 3: containers added as demand rises (and removed as it falls, after the build) */}
      {C1_ADD.map(([h, sl], i) => (
        <Ctr key={`${h}${sl}`} h={h} s={sl} on={s(1)} delay={200 + i * 140} lit={hot === 0} d={i * 0.3} cls={run3 ? `s20a-l s20a-add${i}` : undefined} />
      ))}

      {/* point 4: the linked container moves host; its network link re-attaches */}
      <Ctr h={0} s={1} on={held ? false : !atC || run4} cls={run4 ? 's20a-l s20a-inA' : undefined} lit={hot === 1} d={0.8} z={5} />
      <Disc x={C1_FROM[0] + 14} y={C1_FROM[1] - 14} icon="link" size={20} on={held ? false : !atC || run4} cls={run4 ? 's20a-l s20a-inA' : undefined} z={6} />
      <Ctr h={2} s={0} on={atC} cls={run4 ? 's20a-l s20a-inC' : undefined} lit={hot === 1} d={0.8} z={5} />
      <Disc x={C1_TO[0] + 14} y={C1_TO[1] - 14} icon="link" size={20} on={atC} cls={run4 ? 's20a-l s20a-inC' : undefined} z={6} />
      <Rider cls={C1_RF} icon="container" size={28} on={run4} />
      <Rider cls={C1_RB} icon="container" size={28} on={run4} />

      <W pts={C1_BA} head={0} on={!atC || run4} color={(hot === 1) ? colors.brandDark : BLUE} width={(hot === 1) ? 3.4 : 2.6} cls={run4 ? 's20a-l s20a-inA' : undefined} />
      <W pts={C1_BC} head={0} on={atC} color={(hot === 1) ? colors.brandDark : BLUE} width={(hot === 1) ? 3.4 : 2.6} cls={run4 ? 's20a-l s20a-inC' : undefined} />
      <Token cls={C1_RL[0]} size={7} on={!atC && step < 2} />
      <Token cls={C1_RL[1]} size={7} on={atC && !run4} />
    </Frame>
  )
}

/* ================================================================== slide 10 · A_T02 · the timeline strip */

/*
 * 566 x 360. Three cards, one timeline (x 186..526) shared by all: Traffic (y 20..100: the users tile and the traffic
 * curve, flat, then a spike at x 232 that stays high), Manual (y 112..236: the engineer; an orange delay bar from the
 * spike to x 476 before his containers launch at 500), Automated (y 248..340: the Kubernetes mark; containers launch at
 * the spike itself, x 260 / 308 / 356). A dashed spike marker runs down all three cards at x 232. Point N (Placement,
 * Health, Scaling) builds and lights its failure tile on the delay bar (x 280 / 356 / 432). Loop 5.4 s: a dot rides
 * the curve; at the spike the automated containers pop at once, while the orange delay creeps along the manual lane
 * and its container pops only at the end.
 */
const T2 = { W: 566, H: 360, X0: 186, X1: 526, XS: 232, TY: 20, TB: 100, MY: 112, MB: 236, AY: 248, AB: 340, CY: 60, MC: 174, BY: 164, BEND: 476, LX: 500, AC: 294, PER: 5.4, RUN: 4.6 }
const T2_FX = [280, 356, 432]
const T2_AX = [260, 308, 356]
const T2_FAIL: { icon: Ico3DName; label: string }[] = [
  { icon: 'target', label: 'Placement' },
  { icon: 'heartbeat', label: 'Health' },
  { icon: 'chart', label: 'Scaling' },
]
/* the traffic curve: flat at y 86, the spike from x 214 to 248, then high with a gentle wave */
const T2_CURVE: Pt[] = (() => {
  const out: Pt[] = []
  for (let x = T2.X0; x <= T2.X1; x += 4) {
    let y = 86
    if (x > 212) {
      const k = Math.min(1, (x - 212) / 36)
      const e = k * k * (3 - 2 * k)
      y = 86 - e * 46 + (x > 248 ? Math.sin((x - 248) / 22) * 3 : 0)
    }
    out.push([x, Math.round(y * 10) / 10])
  }
  return out
})()
const T2_D = 'M ' + T2_CURVE.map(([x, y]) => `${x} ${y}`).join(' L ')
const t2at = (x: number) => ((x - T2.X0) / (T2.X1 - T2.X0)) * T2.RUN // seconds into the loop when the dot is at x
const T2_TS = t2at(T2.XS)

const A_T02: Fig = (p) => {
  const { hot, s, live } = useBuild({ ...p, steps: p.steps ?? 3 }, 2000)
  const run = live
  const instant = useInstant()
  return (
    <Frame w={T2.W} h={T2.H}>
      <Panel x={20} y={T2.TY} w={T2.W - 40} h={T2.TB - T2.TY} />
      <Panel x={20} y={T2.MY} w={T2.W - 40} h={T2.MB - T2.MY} />
      <Panel x={20} y={T2.AY} w={T2.W - 40} h={T2.AB - T2.AY} />

      {/* lane labels */}
      <div style={{ ...box(36, T2.CY - 20, 40, 40), zIndex: 3 }}><Plinth size={40}><Ico3D name="users" size={30} loop="bob" /></Plinth></div>
      <div style={{ ...box(86, T2.CY - 10, 80, 20), zIndex: 3, display: 'flex', alignItems: 'center' }}><span style={tag(14)}>Traffic</span></div>
      <Engineer x={30} y={T2.MC - 26} w={78} live={live} />
      <div style={{ ...box(114, T2.MC - 10, 60, 20), zIndex: 3, display: 'flex', alignItems: 'center' }}><span style={tag(14)}>Manual</span></div>
      <div style={{ ...box(36, T2.AC - 21, 42, 42), zIndex: 3 }}><MarkTile src={k8sMark} size={42} /></div>
      <div style={{ ...box(86, T2.AC - 10, 90, 20), zIndex: 3, display: 'flex', alignItems: 'center' }}><span style={tag(14)}>Automated</span></div>

      {/* the traffic curve and the spike marker down all three lanes */}
      <svg aria-hidden width={T2.W} height={T2.H} style={{ position: 'absolute', left: 0, top: 0, zIndex: 3, overflow: 'visible', pointerEvents: 'none' }}>
        <defs>
          <linearGradient id="s20a-tr" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={BLUE} stopOpacity={0.22} />
            <stop offset="1" stopColor={BLUE} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <line x1={T2.XS} y1={T2.TY + 12} x2={T2.XS} y2={T2.AB - 12} stroke="#9DB6EE" strokeWidth={1.6} strokeDasharray="4 5" />
        <line x1={T2.X0} y1={88} x2={T2.X1} y2={88} stroke="#D3DEF6" strokeWidth={1.6} strokeLinecap="round" />
        <path d={`${T2_D} L ${T2.X1} 88 L ${T2.X0} 88 Z`} fill="url(#s20a-tr)" />
        <path d={T2_D} fill="none" stroke={BLUE} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {run && <span aria-hidden className="s20a-l s20a-tdot" style={{ position: 'absolute', left: -7, top: -7, width: 14, height: 14, borderRadius: 99, background: BLUE, boxShadow: `0 0 0 4px ${BLUE}30, inset 0 0 0 2px #FFFFFF`, zIndex: 5 }} />}

      {/* Manual: the orange delay before the human reacts; it creeps along the lane while live */}
      <div aria-hidden style={{ ...box(T2.XS, T2.BY - 6, T2.BEND - T2.XS, 12), zIndex: 3, borderRadius: 6, overflow: 'hidden', background: run ? 'rgba(255,138,61,0.22)' : undefined }}>
        <span className={run ? 's20a-l s20a-delay' : undefined} style={{ position: 'absolute', inset: 0, borderRadius: 6, background: `linear-gradient(90deg, #FFB27A 0%, ${ORANGE} 100%)`, transformOrigin: '0 50%' }} />
      </div>
      <Disc x={T2.XS + 14} y={T2.BY} icon="hourglass" size={24} loop="swing" z={4} />
      <div style={{ ...box(T2.LX - 20, T2.BY - 20, 40, 40), zIndex: 3 }}>
        <span className={run ? 's20a-l s20a-late' : undefined} style={{ display: 'grid' }}><Plinth size={40}><Ico3D name="container" size={30} loop="bob" /></Plinth></span>
      </div>
      <Disc x={T2.LX + 18} y={T2.BY - 18} icon="plus" size={20} cls={run ? 's20a-l s20a-late' : undefined} />
      {T2_FAIL.map((f, i) => (
        <Node key={f.label} x={T2_FX[i]} y={T2.BY} icon={f.icon} size={40} label={f.label} tagSize={13} w={90} on={s(i + 1)} lit={hot === i} loop={i === 1 ? 'beat' : 'pulse'} d={i * 0.4} z={4} />
      ))}

      {/* Automated: containers launch at the spike */}
      {T2_AX.map((x, i) => (
        <div key={x} style={{ ...box(x - 20, T2.AC - 20, 40, 40), zIndex: 3 }}>
          <span className={run ? `s20a-l s20a-now${i}` : undefined} style={{ display: 'grid' }}><Plinth size={40}><Ico3D name="container" size={30} loop="bob" d={i * 0.4} /></Plinth></span>
        </div>
      ))}
      <Disc x={T2_AX[0] + 18} y={T2.AC - 18} icon="plus" size={20} cls={run ? 's20a-l s20a-now0' : undefined} />
      <Disc x={T2_AX[2] + 44} y={T2.AC} icon="check" size={24} cls={run ? 's20a-l s20a-now2' : undefined} />
      {instant && null}
    </Frame>
  )
}

/* ================================================================== slide 11 · A_T02B · updates, discovery, EKS */

/*
 * 566 x 320. Updates (card x 20..392, y 20..160): the New Image (upload tile, x 76) wired through three hosts (x 180 /
 * 262 / 344, y 84), each with its container on the top-right corner, old (grey) at press 0. Press 1 (point 4): the
 * rollout reaches them one after another: the first runs the new container, the second is between versions (orange
 * cross, greyed: Downtime), the third still runs the old one. Discovery (card y 172..300): the Client's link (y 228)
 * runs to the host holding the container (x 200). Press 2 (point 5): the container moves to the right host (x 330,
 * New Address) and the static link to the old address turns dashed and faded, an orange cross before its end. Press 3
 * (the note): the Kubernetes mark inside the Amazon EKS group (x 412..546) builds and lights. Loops 3.6 s.
 */
const U = { W: 566, H: 320, RR: 392, R1Y: 20, R1B: 160, R2Y: 172, R2B: 300, Y1: 84, Y2: 228, TS: 44, UPX: 76, CLX: 76, OLD: 200, NEW: 330, XX: 162, GX: 412, GR: 546, GY: 20, GB: 266, PER: 3.6 }
const U_HX = [180, 262, 344]
const U_CHAIN: Pt[][] = [
  [[U.UPX + U.TS / 2, U.Y1], [U_HX[0] - U.TS / 2, U.Y1]],
  [[U_HX[0] + U.TS / 2, U.Y1], [U_HX[1] - U.TS / 2, U.Y1]],
  [[U_HX[1] + U.TS / 2, U.Y1], [U_HX[2] - U.TS / 2, U.Y1]],
]
const U_LINK: Pt[] = [[U.CLX + U.TS / 2, U.Y2], [U.OLD - U.TS / 2, U.Y2]]
const U_MOVE: Pt[] = [[U.OLD + U.TS / 2, U.Y2], [U.NEW - U.TS / 2, U.Y2]]
const U_RC = U_CHAIN.map((w, i) => K.ride(`u1${i}`, w, 0.2 + i * 0.9, 0.9 + i * 0.9, U.PER))
const U_RM = K.ride('u2m', U_MOVE, 0.4, 1.6, U.PER, 1)
const U_RL = K.ride('u2l', [U_LINK[0], [U.XX - 14, U.Y2]], 1.8, 2.7, U.PER, 0.4)
const U_RLok = K.ride('u2k', U_LINK, 0.3, 1.3, U.PER)

const A_T02B: Fig = (p) => {
  const { hot, s, live } = useBuild({ ...p, steps: p.steps ?? 3 }, 2000)
  const instant = useInstant()
  const moved = s(2)
  return (
    <Frame w={U.W} h={U.H}>
      {/* ---------- Updates */}
      <BPanel x={20} y={U.R1Y} w={U.RR - 20} h={U.R1B - U.R1Y} lit={hot === 0} />
      <Node x={U.UPX} y={U.Y1} icon="upload" size={U.TS} label="New Image" loop="bob" lit={hot === 0} w={100} />
      {U_CHAIN.map((w, i) => <W key={i} pts={w} head={8} on={s(1)} delay={i * 260} color={(hot === 0) ? colors.brandDark : BLUE} width={(hot === 0) ? 3.4 : 2.6} />)}
      {U_RC.map((c, i) => <Token key={i} cls={c} size={8} on={live && s(1)} />)}
      {U_HX.map((x, i) => (
        <Node key={x} x={x} y={U.Y1} icon="server" size={U.TS} loop="pulse" t={3} d={i * 0.4} dim={s(1) && i === 1} />
      ))}
      <Tag x={U_HX[1]} y={U.Y1 + U.TS / 2 + 6} text="Downtime" w={100} on={s(1)} delay={500} />
      {/* the containers: old (grey) at press 0; press 1 the new one on the first host, none on the second */}
      <Disc x={U_HX[0] + 18} y={U.Y1 - 18} icon="container" size={24} grey={!s(1)} loop="bob" />
      <Disc x={U_HX[1] + 18} y={U.Y1 - 18} icon="container" size={24} grey on={!s(1)} />
      <Disc x={U_HX[1] + 18} y={U.Y1 - 18} warn size={24} on={s(1)} delay={500} lit={hot === 0} cls={live && s(1) ? 's20a-l s20a-gap' : undefined} />
      <Disc x={U_HX[2] + 18} y={U.Y1 - 18} icon="container" size={24} grey />

      {/* ---------- Discovery */}
      <BPanel x={20} y={U.R2Y} w={U.RR - 20} h={U.R2B - U.R2Y} lit={hot === 1} />
      <Node x={U.CLX} y={U.Y2} mark={clientMark} size={U.TS} label="Client" />
      <W pts={U_LINK} head={9} dash={moved ? '6 6' : undefined} opacity={moved ? 0.5 : 1} color={(hot === 1) ? colors.brandDark : BLUE} width={(hot === 1) ? 3.4 : 2.6} />
      <Token cls={U_RLok} size={8} on={live && !moved} />
      <Token cls={U_RL} size={8} on={live && moved} />
      <Disc x={U.XX} y={U.Y2} warn size={22} on={moved} delay={300} lit={hot === 1} />
      <Tag x={(U.CLX + U.OLD) / 2} y={U.Y2 - 34} text="Static Link" w={96} size={13} on={moved} delay={300} />
      <Node x={U.OLD} y={U.Y2} icon="server" size={U.TS} loop="pulse" t={3} d={0.3} />
      <Node x={U.NEW} y={U.Y2} icon="server" size={U.TS} loop="pulse" t={3} d={0.7} label="New Address" w={110} on={moved} />
      <Disc x={U.OLD + 18} y={U.Y2 - 18} icon="container" size={24} on={!moved} />
      <Disc x={U.NEW + 18} y={U.Y2 - 18} icon="container" size={24} on={moved} delay={700} lit={hot === 1} />
      <W pts={U_MOVE} head={8} on={moved} color={(hot === 1) ? colors.brandDark : BLUE} width={(hot === 1) ? 3.4 : 2.6} />
      <Rider cls={U_RM} icon="container" size={24} on={live && moved} />

      {/* ---------- the answer: Kubernetes, run in AWS as Amazon EKS */}
      <Show on={s(3)} style={{ ...box(U.GX, U.GY, U.GR - U.GX, U.GB - U.GY), zIndex: 2 }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: 16, background: 'linear-gradient(180deg, #FFFFFF 0%, #F3F7FF 100%)', boxShadow: 'inset 0 0 0 2px #B9CEFB, 0 12px 24px -16px rgba(31,64,140,0.34)' }} />
        <img src={eksMark} alt="" aria-hidden draggable={false} style={{ position: 'absolute', left: 0, top: 0, width: 34, height: 34, borderRadius: '16px 0 8px 0', display: 'block' }} />
      </Show>
      <Node x={(U.GX + U.GR) / 2} y={(U.GY + U.GB) / 2 + 6} mark={k8sMark} size={68} label="Kubernetes" on={s(3)} delay={200} lit={hot === 2} />
      {live && s(3) && <span aria-hidden className={loopCls('ripple')} style={{ ...box((U.GX + U.GR) / 2 - 40, (U.GY + U.GB) / 2 + 6 - 40, 80, 80), zIndex: 2, borderRadius: 26, boxShadow: `0 0 0 2px ${BLUE}55`, ...loopVars(0, 2.6) }} />}
      <Tag x={(U.GX + U.GR) / 2} y={U.GB + 12} text="Amazon EKS" w={130} on={s(3)} delay={200} />
    </Frame>
  )
}

export const figures: Record<string, Fig> = { A_T01, A_T01B, A_T01C, A_T02, A_T02B }

/* ------------------------------------------------------------------ loop keyframes (transform / opacity, HTML only) */

/** keyframes from [seconds, declarations] stops over a period */
const kf = (name: string, per: number, stops: [number, string][], ease = 'ease-in-out') =>
  `@keyframes ${name} { ${stops.map(([t, d]) => `${pc((t / per) * 100)} { ${d} }`).join(' ')} }\n.${name} { animation: ${name} ${per}s ${ease} infinite; }`
const ON = 'opacity: 1; transform: scale(1)'
const OFF = 'opacity: 0; transform: scale(0.6)'

/* slide 6: each failure shows from its moment to 3.7 s; the container under a stopped one shows the rest of the time */
const T1_KF = T1_FAIL.map((k) => {
  const a = T1_AT(k)
  return [
    kf(`s20a-f${k}`, T1.PER, [[0, OFF], [a, OFF], [a + 0.3, ON], [3.75, ON], [4.1, OFF], [T1.PER, OFF]]),
    T1_STOP.includes(k) ? kf(`s20a-o${k}`, T1.PER, [[0, ON], [a, ON], [a + 0.3, OFF], [3.75, OFF], [4.1, ON], [T1.PER, ON]]) : '',
  ].join('\n')
}).join('\n')
const T1_EKF = [0, 1, 2].map((i) => kf(`s20a-e${i}`, T1.PER, [[0, OFF], [0.9 + i * 0.4, OFF], [1.2 + i * 0.4, ON], [3.75, ON], [4.1, OFF], [T1.PER, OFF]])).join('\n')
const T1_PING = kf('s20a-ping', T1.PER, [[0, 'opacity: 0; transform: scale(0.92)'], [3.65, 'opacity: 0; transform: scale(0.92)'], [3.75, 'opacity: 1; transform: scale(0.96)'], [4.6, 'opacity: 0; transform: scale(1.22)'], [T1.PER, 'opacity: 0; transform: scale(1.22)']], 'ease-out')

/* slide 7: a landing pop when each rider arrives */
const POP = (t: number) => [[0, 'transform: scale(1)'], [t - 0.05, 'transform: scale(1)'], [t + 0.12, 'transform: scale(1.14)'], [t + 0.4, 'transform: scale(1)'], [B1.PER, 'transform: scale(1)']] as [number, string][]
const B1_KF = [kf('s20a-landb', B1.PER, POP(1.2)), kf('s20a-landc', B1.PER, POP(3.9))].join('\n')

/* slide 8: demand rises 0.1-1.3 s, holds, falls 4.2-5.5 s of 6.4; the added containers follow it; the linked container sits in
   the first host 0-1.0 s and 6.6-8 s, rides, and sits in the right host 2.6-5.0 s */
const C1_KF = [
  kf('s20a-level', C1.DPER, [[0, 'transform: scaleY(0.35)'], [0.1, 'transform: scaleY(0.35)'], [1.3, 'transform: scaleY(1)'], [4.2, 'transform: scaleY(1)'], [5.5, 'transform: scaleY(0.35)'], [C1.DPER, 'transform: scaleY(0.35)']]),
  ...C1_ADD.map((_, i) => kf(`s20a-add${i}`, C1.DPER, [[0, OFF], [0.3 + i * 0.25, OFF], [0.6 + i * 0.25, ON], [4.3 + i * 0.25, ON], [4.6 + i * 0.25, OFF], [C1.DPER, OFF]])),
  kf('s20a-inA', C1.PER, [[0, 'opacity: 1'], [1.0, 'opacity: 1'], [1.15, 'opacity: 0'], [6.5, 'opacity: 0'], [6.65, 'opacity: 1'], [C1.PER, 'opacity: 1']]),
  kf('s20a-inC', C1.PER, [[0, 'opacity: 0'], [2.5, 'opacity: 0'], [2.65, 'opacity: 1'], [5.0, 'opacity: 1'], [5.15, 'opacity: 0'], [C1.PER, 'opacity: 0']]),
].join('\n')

/* slide 10: the dot on the traffic curve, linear in x; the automated containers pop at the spike; the delay creeps from
   the spike to 3.7 s; the manual container pops only then */
const T2_DOT = (() => {
  const lines = [`0% { transform: translate(${T2_CURVE[0][0]}px, ${T2_CURVE[0][1]}px); opacity: 0 }`, `2% { opacity: 1 }`]
  T2_CURVE.forEach(([x, y], i) => i > 0 && i % 2 === 0 && lines.push(`${pc((t2at(x) / T2.PER) * 100)} { transform: translate(${x}px, ${y}px) }`))
  const [lx, ly] = T2_CURVE[T2_CURVE.length - 1]
  lines.push(`${pc((T2.RUN / T2.PER) * 100)} { transform: translate(${lx}px, ${ly}px); opacity: 1 }`, `${pc((T2.RUN / T2.PER) * 100 + 4)}, 100% { transform: translate(${lx}px, ${ly}px); opacity: 0 }`)
  return `@keyframes s20a-tdot { ${lines.join(' ')} }\n.s20a-tdot { animation: s20a-tdot ${T2.PER}s linear infinite; }`
})()
const T2_LATE = 3.7
const T2_KF = [
  T2_DOT,
  ...[0, 1, 2].map((i) => kf(`s20a-now${i}`, T2.PER, [[0, 'opacity: 0.25; transform: scale(0.8)'], [T2_TS + i * 0.08, 'opacity: 0.25; transform: scale(0.8)'], [T2_TS + 0.18 + i * 0.08, 'opacity: 1; transform: scale(1.12)'], [T2_TS + 0.45 + i * 0.08, 'opacity: 1; transform: scale(1)'], [5.0, 'opacity: 1; transform: scale(1)'], [5.3, 'opacity: 0.25; transform: scale(0.8)'], [T2.PER, 'opacity: 0.25; transform: scale(0.8)']])),
  kf('s20a-delay', T2.PER, [[0, 'transform: scaleX(0)'], [T2_TS, 'transform: scaleX(0)'], [T2_LATE, 'transform: scaleX(1)'], [5.0, 'transform: scaleX(1); opacity: 1'], [5.3, 'transform: scaleX(1); opacity: 0'], [5.31, 'transform: scaleX(0); opacity: 0'], [T2.PER, 'transform: scaleX(0); opacity: 1']], 'linear'),
  kf('s20a-late', T2.PER, [[0, 'opacity: 0.25; transform: scale(0.8)'], [T2_LATE, 'opacity: 0.25; transform: scale(0.8)'], [T2_LATE + 0.18, 'opacity: 1; transform: scale(1.12)'], [T2_LATE + 0.45, 'opacity: 1; transform: scale(1)'], [5.0, 'opacity: 1; transform: scale(1)'], [5.3, 'opacity: 0.25; transform: scale(0.8)'], [T2.PER, 'opacity: 0.25; transform: scale(0.8)']]),
].join('\n')

/* slide 11: the downtime gap blinks while the rollout passes the second host */
const U_KF = kf('s20a-gap', U.PER, [[0, 'opacity: 1; transform: scale(1)'], [1.0, 'opacity: 1; transform: scale(1)'], [1.2, 'opacity: 1; transform: scale(1.14)'], [1.5, 'opacity: 1; transform: scale(1)'], [U.PER, 'opacity: 1; transform: scale(1)']])

export const css = `
.s20a-l { will-change: transform, opacity; }
@keyframes s20a-breathe { 0%, 100% { transform: translateY(0) scale(1) } 50% { transform: translateY(-1.5px) scale(1.01) } }
.s20a-breathe { animation: s20a-breathe 3.6s cubic-bezier(0.45,0,0.55,1) infinite; }
${T1_KF}
${T1_EKF}
${T1_PING}
${B1_KF}
${C1_KF}
${T2_KF}
${U_KF}
${K.css()}
.cc-still .s20a-l, .deck-thumb .s20a-l { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .s20a-l { animation: none !important; } }
`
