import { type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Badge, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, Frame, Show, Plinth, MarkTile, Panel, Wire, Junction, Token, keyframes, tag, heading, useHeld, useHot, type Pt } from '@/engine/figkit'
import dockerMark from '../images/tech-docker.svg'
import smMark from '../images/aws-secrets-manager.svg'

/*
 * SESSION 19 · SECTION 4 (Container Configuration) technical figures, builder E.
 * Standing corrections 13-18, cloud R7-R15: 3D icons on plinth tiles, official marks on white tiles (never moving),
 * >= 20 px equal padding, orthogonal wires from the same constants as the boxes, a flow dot on every live wire, the lit
 * item walking after the build (starting on the last item). Loops are transform / opacity on HTML elements or root svgs
 * only. Held (?still): the full final picture, nothing lit, nothing moving. Class prefix `s19e-`.
 *
 *   slide 36 E_T15B  506 x 380  one host holding two containers, outside traffic on the left, Volume / Image / Bind
 *                               Mount down the right: `-v` plugs the named volume into container 1 (1); `-p` forwards
 *                               host port 8080 to the container's 5000 (2)
 *   slide 37 E_T15C  506 x 380  the same host: container 2 published with the host port omitted, a random one (dice) (1);
 *                               EXPOSE on each container port, documentation only, no arrow of its own (2)
 *   slide 38 E_T15D  506 x 380  the same host: -p publishes, outside traffic reaches both containers (1); both containers
 *                               come from ONE image, on two different host ports (2)
 *   slide 39 E_T16   546 x 400  a Dockerfile with a password on its RUN line: banned (1); built, the password is baked
 *                               into the image's RUN layer, where inspect finds it (2)
 *   slide 40 E_T16B  546 x 400  the safe path into one container (the env var route blocked): a mounted secret file (1);
 *                               AWS Secrets Manager injecting the key at runtime (2); the key rotates, the image unchanged (3)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('s19e')
const BLUE = colors.brand
const MONO = "'JetBrains Mono', ui-monospace, monospace"
const RIM = 'inset 0 0 0 1.5px #D3DEF6, 0 12px 24px -16px rgba(31,64,140,0.34)'
const LIT = `inset 0 0 0 2.5px ${ORANGE}, 0 10px 22px -12px rgba(255,138,61,0.7)`
const HOST_TINT = 'linear-gradient(180deg, #F6F9FF 0%, #E9F0FD 100%)'

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)
const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })

/** the build: the step, the lit item, held. The walk after the build starts on the LAST item (S18 fix). */
function useBuild(p: Record<string, unknown>, period = 2000) {
  const cnt = Number(p.steps ?? 1)
  const held = useHeld()
  const step = held ? cnt : stepOf(p)
  const raw = useHot(cnt, stepOf(p), period)
  const hot = raw >= 0 && stepOf(p) >= cnt ? (raw + cnt - 1) % cnt : raw
  return { step, hot, held, s: (n: number) => step >= n, done: !held && stepOf(p) >= cnt }
}

/* ------------------------------------------------------------------ pieces */

/** a 3D icon (or a mark) on its plinth, the TILE centred on (x, y), its tag under it or to one side */
function Node({ x, y, label, icon, mark, size = 50, k = 0.74, on = true, lit = false, loop = 'bob', d = 0, t, badge, w = 120, tagSize = 14, side, delay = 0, z = 3, mono = false, children }: { x: number; y: number; label?: string; icon?: Ico3DName; mark?: string; size?: number; k?: number; on?: boolean; lit?: boolean; loop?: Loop; d?: number; t?: number; badge?: Badge; w?: number; tagSize?: number; side?: 'right' | 'left'; delay?: number; z?: number; mono?: boolean; children?: ReactNode }) {
  const tile = mark ? <MarkTile src={mark} size={size} lit={lit} /> : (
    <Plinth size={size} lit={lit}><Ico3D name={icon ?? 'doc'} size={Math.round(size * k)} loop={loop} d={d} t={t} badge={badge} /></Plinth>
  )
  const tg: CSSProperties = { ...tag(tagSize), ...(mono ? { fontFamily: MONO, fontVariantLigatures: 'none', fontWeight: 600 } : {}) }
  const inner = <div style={{ position: 'relative', width: size, height: size, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{tile}{children}</div>
  if (side) {
    return (
      <Show on={on} delay={delay} style={{ position: 'absolute', top: y - size / 2, height: size, zIndex: z, display: 'flex', flexDirection: side === 'right' ? 'row' : 'row-reverse', alignItems: 'center', gap: 8, ...(side === 'right' ? { left: x - size / 2 } : { right: `calc(100% - ${x + size / 2}px)` }) }}>
        {inner}
        {label && <span style={tg}>{label}</span>}
      </Show>
    )
  }
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, width: w, top: y - size / 2, zIndex: z, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {inner}
      {label && <span style={{ ...tg, marginTop: 6 }}>{label}</span>}
    </Show>
  )
}

/** the engine's 3D cross turned to the template orange (blocked = orange, never red) */
const OrangeCross = ({ size }: { size: number }) => (
  <span style={{ display: 'grid', filter: 'hue-rotate(28deg) saturate(1.15) brightness(1.06)' }}>
    <Ico3D name="cross" size={size} loop="none" />
  </span>
)

/** a small white disc holding a 3D icon (or an orange cross, or a mark), centred on (x, y) */
function Disc({ x, y, on = true, size = 26, icon = 'check', loop = 'pulse', d = 0, t = 2.4, cross = false, mark, dashed = false, lit = false, z = 9 }: { x: number; y: number; on?: boolean; size?: number; icon?: Ico3DName; loop?: Loop; d?: number; t?: number; cross?: boolean; mark?: string; dashed?: boolean; lit?: boolean; z?: number }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: z, opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}` }}>
      <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxSizing: 'border-box', border: dashed ? `1.6px dashed ${lit ? ORANGE : '#8FA8E0'}` : undefined, boxShadow: dashed ? '0 4px 10px -5px rgba(31,64,140,0.5)' : `0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 ${lit ? 2 : 1}px ${lit ? ORANGE : '#D3DEF6'}`, transition: instant ? 'none' : `box-shadow 420ms ${EASE}, border-color 420ms ${EASE}` }}>
        {cross ? <OrangeCross size={size - 4} /> : mark ? <img src={mark} alt="" aria-hidden draggable={false} style={{ width: size - 10, height: size - 10, objectFit: 'contain' }} /> : <Ico3D name={icon} size={size - 7} loop={loop} d={d} t={t} />}
      </span>
    </span>
  )
}

/** a white disc carrying a mini 3D icon along a `ride` class; nothing on held frames */
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

/** a wire on its own layer, over the panels (z 2, later in the DOM) and under the tiles (z 3) */
const W = (props: Parameters<typeof Wire>[0]) => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}><Wire {...props} /></div>
)

/** a port pill centred on (x, y): white, rimmed, mono number and/or a 3D icon; rings orange while lit */
function Port({ x, y, w, text, icon, on = true, lit = false, dashed = false, delay = 0, iconLoop = 'pulse' }: { x: number; y: number; w: number; text?: string; icon?: Ico3DName; on?: boolean; lit?: boolean; dashed?: boolean; delay?: number; iconLoop?: Loop }) {
  const instant = useInstant()
  const h = 26
  return (
    <Show on={on} delay={delay} style={{ ...box(x - w / 2, y - h / 2, w, h), zIndex: 4 }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: 99, background: '#FFFFFF', boxSizing: 'border-box', border: dashed ? '1.6px dashed #8FA8E0' : undefined, boxShadow: lit ? LIT : RIM, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
        {icon && <Ico3D name={icon} size={18} loop={iconLoop} t={2.6} />}
        {text && <span style={{ fontFamily: MONO, fontVariantLigatures: 'none', fontWeight: 600, fontSize: 13, color: colors.brandDeep, lineHeight: 1 }}>{text}</span>}
      </span>
    </Show>
  )
}

/* ================================================================== slides 36-38 · one host, two containers */

/*
 * 506 x 380. Outside the host on the left: the traffic globe (tile 36, centre 38, 212). The host panel x 116..486,
 * y 20..360 (20 px inside it everywhere): its server tile and tag top-left; two container cards x 248..360 (rows at
 * y 84 and 230, 110 tall, centres R1 139 / R2 285), each with its port pill (5000) on its left edge; the host port
 * pills on the host's left edge (x 78..154). The storage column (centre 423): Volume (y 128), Image (y 212, slide 38
 * only), Bind Mount (y 296), each wired straight into a container's right edge (x 360); the image's two wires leave
 * through one junction (378, 212) into the containers at y 176 and 248, clear of the storage wires.
 * EXPOSE markers (slide 37): a dashed doc disc above each container port (204, R - 35), its mono tag to the left, a
 * dashed leader down to the port: documentation, no arrow.
 */
const H = { W: 506, H: 380, GX: 38, GY: 212, GS: 36, TX: 67, HX: 116, HY: 20, HW: 370, HH: 340, HPW: 76, CX: 248, CW: 112, CH: 110, CPW: 56, SX: 423, SS: 48, VY: 128, IY: 212, BY: 296, JX: 378 }
const H_ROWS = [139, 285]
const H_CY = [84, 230]
const H_HP_R = H.HX + H.HPW / 2 // 154
const H_CP_L = H.CX - H.CPW / 2 // 220
const H_CR = H.CX + H.CW // 360
/* outside traffic: globe -> trunk -> host port (left edge of the pill) */
const H_IN: Pt[][] = H_ROWS.map((y) => [[H.GX + H.GS / 2, H.GY], [H.TX, H.GY], [H.TX, y], [H.HX - H.HPW / 2, y]])
/* host port -> container port */
const H_MAP: Pt[][] = H_ROWS.map((y) => [[H_HP_R, y], [H_CP_L, y]])
const H_VOL: Pt[] = [[H.SX - H.SS / 2, H.VY], [H_CR, H.VY]]
const H_BIND: Pt[] = [[H.SX - H.SS / 2, H.BY], [H_CR, H.BY]]
const H_IMG: Pt[][] = [[[H.SX - 22, H.IY], [H.JX, H.IY], [H.JX, 176], [H_CR, 176]], [[H.SX - 22, H.IY], [H.JX, H.IY], [H.JX, 248], [H_CR, 248]]]
/* a request rides from the globe through the host port into each container */
const H_REQ = H_ROWS.map((y, i) => K.ride(`req${i}`, [[H.GX + H.GS / 2, H.GY], [H.TX, H.GY], [H.TX, y], [H_CP_L + 6, y]], 0.2 + i * 1.3, 1.7 + i * 1.3, 3.4))
const H_RV = K.ride('vol', [...H_VOL].map((p) => [p[0], p[1]] as Pt), 0.3, 1.5, 3.0)
const H_RB = K.ride('bind', [...H_BIND], 1.6, 2.8, 3.0)
const H_RI = H_IMG.map((pts, i) => K.ride(`img${i}`, pts, 0.2 + i * 1.4, 1.4 + i * 1.4, 3.2))

/** EXPOSE: a dashed doc disc above a container port, its mono tag to the left, a dashed leader down to the port */
function Expose({ y, on, lit }: { y: number; on: boolean; lit: boolean }) {
  const instant = useInstant()
  const dy = y - 35
  return (
    <>
      <Disc x={204} y={dy} size={28} icon="doc" loop="bob" dashed on={on} lit={lit} z={5} />
      <span style={{ ...box(136, dy - 9, 48, 18), zIndex: 5, fontFamily: MONO, fontVariantLigatures: 'none', fontWeight: 600, fontSize: 12, lineHeight: '18px', color: colors.brandDeep, textAlign: 'right', opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE}` }}>EXPOSE</span>
      <W pts={[[218, dy], [234, dy], [234, y - 13]]} head={0} dash="3 4" width={1.6} color={lit ? ORANGE : '#8FA8E0'} on={on} />
    </>
  )
}

/** the host and everything that stays put across slides 36-38 */
function Host({ s }: { s: { vol: boolean; map1: boolean; map2: boolean; expose: boolean; image: boolean; hot: { vol?: boolean; map1?: boolean; map2?: boolean; expose?: boolean; globe?: boolean; image?: boolean } } }) {
  const h = s.hot
  return (
    <>
      {/* the host machine */}
      <Panel x={H.HX} y={H.HY} w={H.HW} h={H.HH} radius={22} tint={HOST_TINT} />
      <Node x={136 + 17} y={57} icon="server" size={34} k={0.76} label="Host" side="right" tagSize={15} loop="pulse" t={3} z={3} />
      {/* outside traffic */}
      <Node x={H.GX} y={H.GY} icon="globe" size={H.GS} k={0.78} label="Traffic" tagSize={13} w={56} lit={!!h.globe} loop="spin" t={9} />
      {/* the two containers */}
      {H_CY.map((y, i) => (
        <Panel key={i} x={H.CX} y={y} w={H.CW} h={H.CH} radius={16} lit={!!(i === 0 ? h.map1 || h.vol : h.map2) || !!h.image}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Plinth size={48}><Ico3D name="container" size={36} loop="bob" d={i * 0.7} t={3.2} /></Plinth>
            <span style={tag(13)}>Container</span>
          </div>
        </Panel>
      ))}
      {/* container ports */}
      {H_ROWS.map((y, i) => <Port key={i} x={H.CX} y={y} w={H.CPW} text="5000" lit={i === 0 ? !!h.map1 : !!h.map2} />)}
      {/* storage column */}
      <Node x={H.SX} y={H.VY} icon="database" size={H.SS} label="Volume" tagSize={13} w={86} lit={!!h.vol} loop="bob" t={3.4}>
        <Disc x={H.SS - 2} y={2} size={22} mark={dockerMark} z={6} />
      </Node>
      <Node x={H.SX} y={H.BY} icon="folder" size={H.SS} label="Bind Mount" tagSize={13} w={86} loop="bob" d={0.8} t={3.4} />
      <W pts={H_BIND} head={9} />
      <Token cls={H_RB} size={8} />
      <W pts={H_VOL} head={9} on={s.vol} lit={!!h.vol} />
      <Rider cls={H_RV} icon="database" size={22} on={s.vol} />
      {/* host ports and the traffic through them */}
      <Port x={H.HX} y={H_ROWS[0]} w={H.HPW} icon="router" text="8080" on={s.map1} lit={!!h.map1 || !!h.globe} />
      <Port x={H.HX} y={H_ROWS[1]} w={H.HPW - 18} icon="dice" iconLoop="tilt" on={s.map2} lit={!!h.map2 || !!h.globe} />
      <W pts={H_IN[0]} head={8} on={s.map1} lit={!!h.map1 || !!h.globe} />
      <W pts={H_MAP[0]} head={9} on={s.map1} lit={!!h.map1 || !!h.globe} delay={200} />
      <W pts={H_IN[1]} head={8} on={s.map2} lit={!!h.map2 || !!h.globe} />
      <W pts={H_MAP[1]} head={9} on={s.map2} lit={!!h.map2 || !!h.globe} delay={200} />
      <Junction x={H.TX} y={H.GY} on={s.map1} lit={!!h.globe} />
      <Token cls={H_REQ[0]} size={9} on={s.map1} />
      <Token cls={H_REQ[1]} size={9} on={s.map2} />
      {/* EXPOSE: documentation on each container port */}
      {H_ROWS.map((y) => <Expose key={y} y={y} on={s.expose} lit={!!h.expose} />)}
      {/* one image behind both containers */}
      <Node x={H.SX} y={H.IY} icon="image" size={44} label="Image" tagSize={13} w={86} on={s.image} lit={!!h.image} loop="float" t={3.2} />
      {H_IMG.map((pts, i) => <W key={i} pts={pts} head={8} on={s.image} lit={!!h.image} delay={i * 140} />)}
      <Junction x={H.JX} y={H.IY} on={s.image} lit={!!h.image} />
      {H_RI.map((c, i) => <Token key={i} cls={c} size={8} on={s.image} />)}
    </>
  )
}

const E_T15B: Fig = (p) => {
  const { hot, s } = useBuild(p, 2200)
  return (
    <Frame w={H.W} h={H.H}>
      <Host s={{ vol: s(1), map1: s(2), map2: false, expose: false, image: false, hot: { vol: hot === 0, map1: hot === 1 } }} />
    </Frame>
  )
}

const E_T15C: Fig = (p) => {
  const { hot, s } = useBuild(p, 2200)
  return (
    <Frame w={H.W} h={H.H}>
      <Host s={{ vol: true, map1: true, map2: s(1), expose: s(2), image: false, hot: { map2: hot === 0, expose: hot === 1 } }} />
    </Frame>
  )
}

const E_T15D: Fig = (p) => {
  const { hot, s } = useBuild(p, 2200)
  return (
    <Frame w={H.W} h={H.H}>
      <Host s={{ vol: true, map1: true, map2: true, expose: true, image: s(2), hot: { globe: hot === 0, image: hot === 1 } }} />
    </Frame>
  )
}

/* ================================================================== slide 39 · a password hardcoded in the Dockerfile */

/*
 * 546 x 400. The Dockerfile panel x 20..264, y 82..322: a tab row, then four instruction lines (FROM, COPY, RUN with a
 * password, CMD), each one DOM block, the rest of each line a soft bar (no invented code). Press 1: the RUN line rings
 * orange and a ban disc lands at its end. Press 2: the image builds on the right (x 346..526): FROM, COPY and RUN slabs
 * (layers), CMD only a thin metadata tag on top (T05: CMD adds no layer); the password rides from the RUN line into
 * the RUN slab, which keeps it (password icon + alert); Inspect (eye) above the stack finds it.
 */
const D = { W: 546, H: 400, PX: 20, PY: 82, PW: 244, PH: 240, LX: 40, LH: 44, L0: 154, SX: 346, SW: 180, SH: 42, SG: 10, SB: 318, EY: 84 }
const D_LINES = ['FROM', 'COPY', 'RUN', 'CMD']
const D_LY = D_LINES.map((_, i) => D.L0 + i * D.LH) // centres 132, 176, 220, 264
const D_SLABS = [{ k: 'FROM', y: D.SB - D.SH }, { k: 'COPY', y: D.SB - 2 * D.SH - D.SG }, { k: 'RUN', y: D.SB - 3 * D.SH - 2 * D.SG }] // tops 276, 224, 172
const D_RUNY = D_SLABS[2].y + D.SH / 2 // 193
const D_META_Y = D_SLABS[2].y - 32 // 140, the CMD tag row
const D_BUILD: Pt[] = [[D.PX + D.PW, D_LY[2]], [305, D_LY[2]], [305, D_RUNY], [D.SX, D_RUNY]]
const D_RP = K.ride('pw', [[236, D_LY[2]], [305, D_LY[2]], [305, D_RUNY], [D.SX + 46, D_RUNY]], 0.2, 1.6, 3.2)
const D_EYE_SCAN = 's19e-scan'

function Dockerfile({ hot, banned }: { hot: boolean; banned: boolean }) {
  const instant = useInstant()
  return (
    <>
      <Panel x={D.PX} y={D.PY} w={D.PW} h={D.PH} radius={18} lit={hot}>
        <div style={{ position: 'absolute', left: 20, top: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Ico3D name="doc" size={24} loop="bob" t={3.4} />
          <span style={{ fontFamily: MONO, fontVariantLigatures: 'none', fontWeight: 600, fontSize: 14, color: colors.brandDeep }}>Dockerfile</span>
        </div>
        <div style={{ position: 'absolute', left: 20, right: 20, top: 52, height: 1.5, background: '#D9E3F7' }} />
      </Panel>
      {D_LINES.map((k, i) => {
        const pw = k === 'RUN'
        return (
          <div key={k} style={{ ...box(D.LX - 6, D_LY[i] - 16, D.PW - 34, 32), zIndex: 3, borderRadius: 9, display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 6, boxSizing: 'border-box', background: pw && banned ? '#FFF1E6' : 'transparent', boxShadow: pw && banned ? `inset 0 0 0 1.5px ${hot ? ORANGE : '#FFD2B0'}` : 'none', transition: instant ? 'none' : `background 420ms ${EASE}, box-shadow 420ms ${EASE}` }}>
            <span style={{ fontFamily: MONO, fontVariantLigatures: 'none', fontWeight: 700, fontSize: 14, color: BLUE, width: 44 }}>{k}</span>
            {pw ? (
              <>
                <span style={{ width: 34, height: 8, borderRadius: 99, background: '#C9D6F1' }} />
                <Ico3D name="password" size={24} loop="pulse" t={2.6} />
              </>
            ) : (
              <span style={{ width: [96, 120, 0, 78][i], height: 8, borderRadius: 99, background: '#C9D6F1' }} />
            )}
          </div>
        )
      })}
    </>
  )
}

function Slab({ k, y, on, delay, lit, secret }: { k: string; y: number; on: boolean; delay: number; lit: boolean; secret?: boolean }) {
  const instant = useInstant()
  return (
    <Show on={on} delay={delay} lift={10} style={{ ...box(D.SX, y, D.SW, D.SH), zIndex: 3 }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: 12, background: secret ? 'linear-gradient(180deg, #FFFFFF 0%, #FFF1E6 100%)' : 'linear-gradient(180deg, #FFFFFF 0%, #E3ECFF 100%)', boxShadow: lit ? LIT : RIM, transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }} />
      <span style={{ position: 'absolute', left: 18, top: 0, bottom: 0, display: 'flex', alignItems: 'center', fontFamily: MONO, fontVariantLigatures: 'none', fontWeight: 700, fontSize: 14, color: BLUE }}>{k}</span>
      {secret && (
        <span style={{ position: 'absolute', right: 14, top: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Ico3D name="password" size={24} loop="pulse" t={2.6} />
        </span>
      )}
    </Show>
  )
}

const E_T16: Fig = (p) => {
  const { hot, s, held } = useBuild(p, 2200)
  const instant = useInstant()
  return (
    <Frame w={D.W} h={D.H}>
      <Dockerfile hot={hot === 0} banned={s(1)} />
      <Disc x={D.PX + D.PW - 38} y={D_LY[2]} size={28} icon="ban" loop="pulse" on={s(1)} z={6} />
      {/* the build into the image */}
      <W pts={D_BUILD} head={9} on={s(2)} lit={hot === 1} />
      {D_SLABS.map((sl, i) => <Slab key={sl.k} k={sl.k} y={sl.y} on={s(2)} delay={200 + (2 - i) * 0} lit={hot === 1 && sl.k === 'RUN'} secret={sl.k === 'RUN'} />)}
      {/* CMD adds only metadata: a thin tag on top of the stack */}
      <Show on={s(2)} delay={300} style={{ ...box(D.SX + 40, D_META_Y, D.SW - 80, 22), zIndex: 3 }}>
        <span style={{ position: 'absolute', inset: 0, borderRadius: 99, background: '#FFFFFF', boxShadow: RIM, display: 'grid', placeItems: 'center', fontFamily: MONO, fontVariantLigatures: 'none', fontWeight: 600, fontSize: 12, color: colors.brandDeep }}>CMD</span>
      </Show>
      <Disc x={D.SX + D.SW - 8} y={D_SLABS[2].y + 2} size={24} icon="alert" loop="pulse" on={s(2)} z={6} />
      <span style={{ ...box(D.SX, D.SB + 8, D.SW, 18), ...tag(14), opacity: s(2) ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE}` }}>Image</span>
      {/* inspect finds it */}
      <Node x={D.SX + D.SW / 2} y={D.EY} icon="eye" size={44} label="Inspect" side="right" tagSize={14} on={s(2)} lit={hot === 1} loop="tilt" t={2.8} />
      {!held && s(2) && <span aria-hidden className={D_EYE_SCAN} style={{ ...box(D.SX + 6, D_META_Y - 6, D.SW - 12, 3), zIndex: 6, borderRadius: 99, background: `linear-gradient(90deg, ${ORANGE}00, ${ORANGE}, ${ORANGE}00)` }} />}
      <Rider cls={D_RP} icon="password" size={24} on={s(2)} />
    </Frame>
  )
}

/* ================================================================== slide 40 · the safe path */

/*
 * 546 x 400. The container card centre (273, 200), 140 x 120. Image (left, 70, 200) wired into it (the image it runs);
 * the secret file (top, 273, 64) mounted into its top edge; AWS Secrets Manager (right, 466, 200) feeding its right edge;
 * the env var route (bottom, 273, 336) dashed, faded and crossed: the route this slide replaces.
 * Press 1 the file mounts (a doc rider); press 2 Secrets Manager injects the key at runtime (a key rider); press 3 a
 * refresh disc turns on Secrets Manager and the key rider changes, while the image keeps its tick (no rebuild).
 */
const S = { W: 546, H: 400, CX: 273, CY: 200, CW: 140, CH: 120, IX: 70, FY: 64, MX: 466, EY: 336 }
const S_L = S.CX - S.CW / 2 // 203
const S_R = S.CX + S.CW / 2 // 343
const S_T = S.CY - S.CH / 2 // 140
const S_B = S.CY + S.CH / 2 // 260
const S_IMG: Pt[] = [[S.IX + 26, S.CY], [S_L, S.CY]]
const S_FILE: Pt[] = [[S.CX, S.FY + 24], [S.CX, S_T]]
const S_SM: Pt[] = [[S.MX - 28, S.CY], [S_R, S.CY]]
const S_ENV: Pt[] = [[S.CX, S.EY - 22], [S.CX, S_B]]
const S_RF = K.ride('file', S_FILE, 0.2, 1.3, 3.0)
const S_RK = K.ride('key', S_SM, 1.4, 2.6, 3.0)
const S_RI = K.ride('run', S_IMG, 0.4, 1.4, 3.0)

const E_T16B: Fig = (p) => {
  const { hot, s } = useBuild(p, 2200)
  return (
    <Frame w={S.W} h={S.H}>
      {/* the container */}
      <Panel x={S_L} y={S_T} w={S.CW} h={S.CH} radius={18} lit={hot === 0 || hot === 1}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <Plinth size={52}><Ico3D name="container" size={40} loop="bob" t={3.2} /></Plinth>
          <span style={tag(14)}>Container</span>
        </div>
      </Panel>
      {/* the image it runs: unchanged when the secret rotates */}
      <Node x={S.IX} y={S.CY} icon="image" size={52} label="Image" lit={hot === 2} loop="float" t={3.4}>
        <Disc x={48} y={48} size={24} icon="check" on={s(3)} z={6} />
      </Node>
      <W pts={S_IMG} head={9} />
      <Token cls={S_RI} size={8} />
      {/* the old route: an env var holding the password, blocked */}
      <Node x={S.CX} y={S.EY} icon="password" size={44} label="Env Var" side="right" tagSize={13} loop="none">
        <Disc x={40} y={6} size={24} cross z={6} />
      </Node>
      <W pts={S_ENV} head={8} dash="4 5" width={2} color="#8FA8E0" opacity={0.6} />
      {/* point 1: a mounted secret file */}
      <Node x={S.CX} y={S.FY} icon="doc" badge="lock" size={48} label="Secret File" side="right" tagSize={14} on={s(1)} lit={hot === 0} loop="bob" t={3.2} />
      <W pts={S_FILE} head={9} on={s(1)} lit={hot === 0} />
      <Rider cls={S_RF} icon="doc" size={22} on={s(1)} />
      {/* point 2: AWS Secrets Manager injects the value at runtime */}
      <Node x={S.MX} y={S.CY} mark={smMark} size={56} label="Secrets Manager" tagSize={13} w={110} on={s(2)} lit={hot === 1}>
        <Disc x={52} y={4} size={26} icon="refresh" loop="spin" t={3} on={s(3)} lit={hot === 2} z={6} />
      </Node>
      <W pts={S_SM} head={9} on={s(2)} lit={hot === 1 || hot === 2} />
      <Rider cls={S_RK} icon="key" size={24} on={s(2)} />
    </Frame>
  )
}

/* ------------------------------------------------------------------ css */

const LOCAL_CSS = `
@keyframes s19e-scan { 0% { transform: translateY(0); opacity: 0 } 10% { opacity: 1 } 80% { transform: translateY(${D.SB - D_META_Y + 2}px); opacity: 1 } 100% { transform: translateY(${D.SB - D_META_Y + 2}px); opacity: 0 } }
.s19e-scan { animation: s19e-scan 2.8s cubic-bezier(0.45,0,0.55,1) infinite; }
.cc-still .s19e-scan, .deck-thumb .s19e-scan { animation: none !important; opacity: 0 !important; }
@media (prefers-reduced-motion: reduce) { .s19e-scan { animation: none !important; opacity: 0 } }
`

export const figures: Record<string, Fig> = { E_T15B, E_T15C, E_T15D, E_T16, E_T16B }
export const css = K.css() + LOCAL_CSS
