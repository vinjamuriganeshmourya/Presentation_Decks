import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Badge, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, Frame, Show, Plinth, MarkTile, Panel, Wire, Junction, Token, keyframes, tag, useHeld, useHot, type Pt } from '@/engine/figkit'
import ecrMark from '../images/aws-ecr.svg'

/*
 * SESSION 19 · SECTION 5 (Multi-Container Apps & Registries) · builder G: registry push / pull and locked tags.
 * Standing corrections 13-18, cloud course R7-R15: glossy 3D icons on plinth tiles, the official Amazon ECR mark on its
 * white tile (it never moves), >= 20 px equal padding inside every panel, orthogonal wires from the box constants, a flow
 * dot on every live wire, the lit item walking last -> first -> ... after the build. Loops are transform / opacity on HTML
 * elements only. Held (?still): the full final picture, nothing lit, nothing moving. Class prefix `s19g-`.
 *
 *   slide 49 G_T22   526 x 380  Build machine -> Amazon ECR -> Deploy machine, an image layer stack in each:
 *                               login: a key rides to the registry and its lock opens (1); the tag snaps onto the
 *                               build machine's image (2)
 *   slide 50 G_T22B  526 x 380  the same flow: push sends only the layer the registry lacks (1); pull brings down only
 *                               the layer the deploy machine's cache lacks (2)
 *   slide 51 G_T23   566 x 380  an image tagged `v1` in the repository: the padlock closes and a second push to `v1`
 *                               bounces (dashed, orange cross) (1); a deployment points at the sha256 digest (2)
 *   slide 52 G_T23B  566 x 380  two deployments resolving `v1` land on the same image (1); a rollback from `v2` back to
 *                               the locked `v1` redeploys the exact same image (2)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('s19g')
const BLUE = colors.brand
const RIM = 'inset 0 0 0 1.5px #D3DEF6, 0 10px 20px -14px rgba(31,64,140,0.4)'
const LIT = `inset 0 0 0 2.5px ${ORANGE}, 0 10px 22px -12px rgba(255,138,61,0.7)`
const MONO = "'JetBrains Mono', ui-monospace, monospace"

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)
const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })

/** the build: the step, the lit item, held. The walk after the build starts on the LAST item (S18 fix). */
function useBuild(p: Record<string, unknown>, period = 2200) {
  const cnt = Number(p.steps ?? 1)
  const held = useHeld()
  const step = held ? cnt : stepOf(p)
  const raw = useHot(cnt, stepOf(p), period)
  const hot = raw >= 0 && stepOf(p) >= cnt ? (raw + cnt - 1) % cnt : raw
  return { step, hot, held, s: (n: number) => step >= n }
}

/* ------------------------------------------------------------------ pieces */

/** a 3D icon (or a mark) on its plinth with its tag under it; the TILE is centred on (x, y) */
function Node({ x, y, label, icon, mark, size = 52, k = 0.74, on = true, lit = false, loop = 'bob', d = 0, t, badge, w = 120, tagSize = 14, mono = false, children }: { x: number; y: number; label?: string; icon?: Ico3DName; mark?: string; size?: number; k?: number; on?: boolean; lit?: boolean; loop?: Loop; d?: number; t?: number; badge?: Badge; w?: number; tagSize?: number; mono?: boolean; children?: ReactNode }) {
  const tile = mark ? <MarkTile src={mark} size={size} lit={lit} /> : (
    <Plinth size={size} lit={lit}><Ico3D name={icon ?? 'doc'} size={Math.round(size * k)} loop={loop} d={d} t={t} badge={badge} /></Plinth>
  )
  return (
    <Show on={on} style={{ position: 'absolute', left: x - w / 2, width: w, top: y - size / 2, zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size, display: 'grid', placeItems: 'center' }}>
        {tile}
        {children}
      </div>
      {label && <span style={{ ...tag(tagSize), marginTop: 6, ...(mono ? { fontFamily: MONO, fontWeight: 600, fontVariantLigatures: 'none' } : {}) }}>{label}</span>}
    </Show>
  )
}

/** the engine's 3D cross turned to the template's orange (blocked = orange, never red) */
const OrangeCross = ({ size }: { size: number }) => (
  <span style={{ display: 'grid', filter: 'hue-rotate(28deg) saturate(1.15) brightness(1.06)' }}>
    <Ico3D name="cross" size={size} loop="none" />
  </span>
)

/** a small white disc holding a 3D icon, centred on (x, y) */
function Disc({ x, y, on = true, size = 26, icon = 'check', loop = 'pulse', d = 0, t = 2.4, cross = false, z = 6 }: { x: number; y: number; on?: boolean; size?: number; icon?: Ico3DName; loop?: Loop; d?: number; t?: number; cross?: boolean; z?: number }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: z, opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}` }}>
      <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6' }}>
        {cross ? <OrangeCross size={size - 4} /> : <Ico3D name={icon} size={size - 6} loop={loop} d={d} t={t} />}
      </span>
    </span>
  )
}

/** a white disc carrying a mini 3D icon along a `ride` class; nothing on held frames */
function Rider({ cls, icon, size = 24, on = true }: { cls: string; icon: Ico3DName; size?: number; on?: boolean }) {
  const held = useHeld()
  if (held || !on) return null
  return (
    <span aria-hidden style={{ position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, zIndex: 8, pointerEvents: 'none' }}>
      <span className={cls} style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -4px rgba(31,64,140,0.55)', opacity: 0 }}>
        <Ico3D name={icon} size={size - 6} loop="none" />
      </span>
    </span>
  )
}

/** a layer slab riding a `ride` class (the layer itself moving); nothing on held frames */
function SlabRider({ cls, on = true }: { cls: string; on?: boolean }) {
  const held = useHeld()
  if (held || !on) return null
  return (
    <span aria-hidden style={{ position: 'absolute', left: -SL.W * 0.35, top: -SL.H * 0.35, width: SL.W * 0.7, height: SL.H * 0.7, zIndex: 8, pointerEvents: 'none' }}>
      <span className={cls} style={{ display: 'block', width: '100%', height: '100%', borderRadius: 5, background: 'linear-gradient(180deg, #FFB27A 0%, #FF8A3D 100%)', boxShadow: '0 6px 12px -6px rgba(229,115,42,0.8)', opacity: 0 }} />
    </span>
  )
}

/** a wire on its own layer (z 3), over the panels (z 2), under the tiles (z 4) */
const W = (props: Parameters<typeof Wire>[0]) => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}><Wire {...props} /></div>
)

/* an image layer: one glossy slab (HTML, so its loop stays on the compositor) */
const SL = { W: 80, H: 20, GAP: 8 }
function Slab({ cx, y, on = true, lit = false, fresh = false, tick = false, d = 0 }: { cx: number; y: number; on?: boolean; lit?: boolean; fresh?: boolean; tick?: boolean; d?: number }) {
  const instant = useInstant()
  const held = useHeld()
  return (
    <div style={{ ...box(cx - SL.W / 2, y, SL.W, SL.H), zIndex: 4, opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(-10px) scale(0.92)', transition: instant ? 'none' : `opacity 520ms ${EASE} ${on ? d : 0}ms, transform 620ms ${EASE} ${on ? d : 0}ms` }}>
      <span className={held ? undefined : 's19g-slab'} style={{ display: 'block', width: '100%', height: '100%', borderRadius: 6, background: fresh ? 'linear-gradient(180deg, #8FB0FF 0%, #2D63FB 100%)' : 'linear-gradient(180deg, #DCE7FF 0%, #A9C1FA 100%)', boxShadow: lit ? `inset 0 0 0 2.5px ${ORANGE}, 0 8px 16px -8px rgba(255,138,61,0.8)` : 'inset 0 1.5px 0 rgba(255,255,255,0.75), inset 0 0 0 1px rgba(45,99,251,0.28), 0 6px 12px -8px rgba(31,64,140,0.55)', transition: instant ? 'none' : `box-shadow 420ms ${EASE}`, animationDelay: `${-d / 600}s` }} />
      {tick && <Disc x={SL.W + 2} y={SL.H / 2} size={20} icon="check" loop="none" z={5} />}
    </div>
  )
}

/** a monospace tag pill (`v1`), centred on (x, y) */
function Pill({ x, y, text, on = true, lit = false, w = 54 }: { x: number; y: number; text: string; on?: boolean; lit?: boolean; w?: number }) {
  const instant = useInstant()
  return (
    <Show on={on} style={{ ...box(x - w / 2, y - 15, w, 30), zIndex: 4 }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: 99, background: 'linear-gradient(180deg, #FFFFFF 0%, #EEF3FF 100%)', boxShadow: lit ? LIT : RIM, display: 'grid', placeItems: 'center', transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
        <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 15, color: colors.brandDeep, fontVariantLigatures: 'none' }}>{text}</span>
      </span>
    </Show>
  )
}

/* ================================================================== slides 49-50 · push and pull */

/*
 * 526 x 380. Three panels 120 wide, y 44..336 (PAD 20 inside): Build (x 20, centre 80), Amazon ECR (x 203, centre
 * 263), Deploy (x 386, centre 446). Header tile at y 90 with its tag under; an image stack of slabs at the foot of each
 * (rows y 240 / 268 / 296: TOP / MID / BOT). The push wire runs the gaps at the TOP row's centre (y 250), Build ->
 * ECR, the pull wire ECR -> Deploy. The login wire runs the header row (y 90), laptop -> ECR mark, the key on it in the
 * first gap; a padlock disc on the mark's corner opens at the login press. The tag tile sits above the build stack.
 */
const PP = { W: 526, H: 380, PY: 44, PH: 292, PW: 120, HY: 90, HS: 52, TOP: 240, WY: 250, KX: 171.5, TAGY: 188 }
const PP_X = [80, 263, 446] // panel centres
const PP_ROWS = [PP.TOP, PP.TOP + SL.H + SL.GAP, PP.TOP + 2 * (SL.H + SL.GAP)]
const PP_L = PP_X.map((x) => x - PP.PW / 2)
const PP_R = PP_X.map((x) => x + PP.PW / 2)
const PP_PUSH: Pt[] = [[PP_R[0], PP.WY], [PP_L[1], PP.WY]]
const PP_PULL: Pt[] = [[PP_R[1], PP.WY], [PP_L[2], PP.WY]]
const PP_LOGIN: Pt[] = [[PP_X[0] + PP.HS / 2, PP.HY], [PP_X[1] - PP.HS / 2, PP.HY]]
/* riders: the login token, the pushed layer (build top slab -> ECR top slab), the pulled layer (ECR -> deploy) */
const R_LOGIN = K.ride('login', PP_LOGIN, 0.2, 1.4, 2.4)
const R_PUSH = K.ride('push', [[PP_X[0] + SL.W / 2 - 6, PP.WY], [PP_X[1] - SL.W / 2 + 6, PP.WY]], 0.2, 1.6, 2.8, 1)
const R_PULL = K.ride('pull', [[PP_X[1] + SL.W / 2 - 6, PP.WY], [PP_X[2] - SL.W / 2 + 6, PP.WY]], 0.2, 1.6, 2.8, 1)

/** the three machines and their stacks. `reg` / `dep`: whether the registry / the deploy machine hold the new layer */
function PushPull({ s, hot, login, tagged, reg, dep, hotPush = false, hotPull = false, hotLogin = false, ticks = false }: { s: (n: number) => boolean; hot: number; hotLogin?: boolean; login: boolean; tagged: boolean; reg: boolean; dep: boolean; hotPush?: boolean; hotPull?: boolean; ticks?: boolean }) {
  void s
  void hot
  return (
    <>
      {PP_L.map((x, i) => <Panel key={i} x={x} y={PP.PY} w={PP.PW} h={PP.PH} tint={i === 1 ? 'linear-gradient(180deg, #FFFFFF 0%, #FFF6EE 100%)' : undefined} />)}
      <Node x={PP_X[0]} y={PP.HY} icon="laptop" size={PP.HS} label="Build" loop="bob" />
      <Node x={PP_X[1]} y={PP.HY} mark={ecrMark} size={PP.HS} label="Amazon ECR" tagSize={13}>
        <Disc x={PP.HS - 2} y={2} size={24} icon={login ? 'unlock' : 'lock'} loop="none" />
      </Node>
      <Node x={PP_X[2]} y={PP.HY} icon="server" size={PP.HS} label="Deploy" loop="pulse" t={2.8} d={0.5} />
      {/* login wire (header row) with the key on it */}
      <W pts={PP_LOGIN} head={8} on={login} lit={hotLogin} width={2.2} />
      <Token cls={R_LOGIN} size={9} on={login} />
      {/* the tag tile above the build stack */}
      <Node x={PP_X[0]} y={PP.TAGY} icon="tag" size={40} k={0.76} label="Tag" tagSize={13} on={tagged} loop="swing" t={2.6} />
      {/* image stacks: build holds all three; ECR and deploy hold the two lower layers, the top one only when moved */}
      {PP_ROWS.map((y, r) => <Slab key={`b${r}`} cx={PP_X[0]} y={y} fresh={r === 0} d={r * 90} />)}
      <Slab cx={PP_X[1]} y={PP_ROWS[0]} fresh on={reg} lit={hotPush} />
      {PP_ROWS.slice(1).map((y, r) => <Slab key={`r${r}`} cx={PP_X[1]} y={y} tick={ticks} d={r * 90} />)}
      <Slab cx={PP_X[2]} y={PP_ROWS[0]} fresh on={dep} lit={hotPull} />
      {PP_ROWS.slice(1).map((y, r) => <Slab key={`d${r}`} cx={PP_X[2]} y={y} tick={ticks} d={r * 90} />)}
      {/* the flow: push and pull wires */}
      <W pts={PP_PUSH} head={8} lit={hotPush} />
      <W pts={PP_PULL} head={8} lit={hotPull} />
    </>
  )
}

const G_T22: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 2 })
  return (
    <Frame w={PP.W} h={PP.H}>
      <PushPull s={s} hot={hot} login={s(1)} tagged={s(2)} reg={false} dep={false} hotLogin={hot === 0} />
      {/* point 1: log in: the key on the login wire (its token expires: the clock badge) */}
      <Node x={PP.KX} y={PP.HY} icon="key" size={40} k={0.76} label="Login" tagSize={13} on={s(1)} lit={hot === 0} badge="clock" loop="tilt" t={2.8} />
      {/* point 2: the tag lit */}
      <TagLit on={hot === 1} />
    </Frame>
  )
}

/** the tag tile's orange ring while point 2 is the lit item (laid exactly over the tag tile) */
function TagLit({ on }: { on: boolean }) {
  const instant = useInstant()
  return <span aria-hidden style={{ ...box(PP_X[0] - 20, PP.TAGY - 20, 40, 40), zIndex: 5, borderRadius: 11, boxShadow: LIT, opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE}`, pointerEvents: 'none' }} />
}

const G_T22B: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 2 })
  return (
    <Frame w={PP.W} h={PP.H}>
      <PushPull s={s} hot={hot} login tagged reg={s(1)} dep={s(2)} hotPush={hot === 0} hotPull={hot === 1} ticks />
      <Node x={PP.KX} y={PP.HY} icon="key" size={40} k={0.76} label="Login" tagSize={13} badge="clock" loop="tilt" t={2.8} />
      {/* point 1: push: only the missing layer rides up; point 2: pull: only the missing layer comes down */}
      <Disc x={PP.KX} y={PP.WY} size={28} icon="upload" on={s(1)} loop="bob" z={7} />
      <Disc x={(PP_R[1] + PP_L[2]) / 2} y={PP.WY} size={28} icon="download" on={s(2)} loop="bob" d={0.6} z={7} />
      <SlabRider cls={R_PUSH} on={s(1)} />
      <SlabRider cls={R_PULL} on={s(2)} />
    </Frame>
  )
}

/* ================================================================== slide 51 · the locked tag and the digest */

/*
 * 566 x 380. Build laptop (80, 190) on the left. The repository panel x 200..420, y 40..350: Amazon ECR mark (310, 86)
 * with its tag; the image tile (275, 196) with its `v1` pill (355, 196) and the pill's padlock disc; the digest tile
 * (355, 286) tagged `sha256`, linked from the image. Push wires leave the laptop at y 176 (the first push, solid, into
 * the image) and y 206 (the second push to `v1`, refused at the panel edge: dashed, faded, orange cross, a dot that
 * bounces back). The deployment server (505, 286) points at the digest.
 */
const TG = { W: 566, H: 380, LX: 80, LY: 190, PX: 200, PY: 40, PW: 220, PH: 310, MX: 310, MY: 86, IX: 275, IY: 196, IS: 56, VX: 355, DX: 355, DY: 286, DS: 44, SX: 505, Y1: 176, Y2: 206 }
const TG_PUSH1: Pt[] = [[TG.LX + 26, TG.Y1], [TG.IX - TG.IS / 2, TG.Y1]]
const TG_PUSH2: Pt[] = [[TG.LX + 26, TG.Y2], [TG.PX - 12, TG.Y2]]
const TG_LINK: Pt[] = [[TG.IX, TG.IY + TG.IS / 2], [TG.IX, TG.DY], [TG.DX - TG.DS / 2, TG.DY]]
const TG_DEP: Pt[] = [[TG.SX - 26, TG.DY], [TG.DX + TG.DS / 2, TG.DY]]
const R_BOUNCE = K.ride('bounce', [[TG.LX + 30, TG.Y2], [TG.PX - 30, TG.Y2], [TG.LX + 60, TG.Y2]], 0.2, 2.2, 2.8)
const R_DEP = K.ride('dep', TG_DEP, 0.2, 1.4, 2.4)
const R_PUSH1 = K.ride('push1', TG_PUSH1, 0.2, 1.3, 2.6)

function Repo({ children }: { children?: ReactNode }) {
  return (
    <>
      <Panel x={TG.PX} y={TG.PY} w={TG.PW} h={TG.PH} tint="linear-gradient(180deg, #FFFFFF 0%, #FFF6EE 100%)" />
      <Node x={TG.MX} y={TG.MY} mark={ecrMark} size={52} label="Amazon ECR" tagSize={13} />
      {children}
    </>
  )
}

const G_T23: Fig = (p) => {
  const { hot, s, held } = useBuild({ ...p, steps: p.steps ?? 2 })
  return (
    <Frame w={TG.W} h={TG.H}>
      <Repo />
      <Node x={TG.LX} y={TG.LY} icon="laptop" size={52} label="Build" loop="bob" />
      {/* the image already pushed as v1 */}
      <Node x={TG.IX} y={TG.IY} icon="image" size={TG.IS} k={0.72} loop="float" t={3.2} />
      <Pill x={TG.VX} y={TG.IY} text="v1" lit={hot === 0} />
      <Disc x={TG.VX + 24} y={TG.IY - 16} size={26} icon={s(1) ? 'lock' : 'unlock'} loop="none" z={7} />
      <W pts={TG_PUSH1} head={8} />
      <Token cls={R_PUSH1} size={9} on={!s(1)} />
      {/* point 1: a second push to the same tag is refused */}
      <W pts={TG_PUSH2} head={0} dash="5 6" width={2.2} color={ORANGE} opacity={0.7} on={s(1)} />
      <Disc x={TG.PX - 12} y={TG.Y2} size={26} cross on={s(1)} z={7} />
      <Rider cls={R_BOUNCE} icon="image" size={24} on={s(1) && !held} />
      {/* point 2: the deployment points at the digest */}
      <W pts={TG_LINK} head={0} width={2} on={s(2)} color="#8FA8E0" />
      <Node x={TG.DX} y={TG.DY} icon="digest" size={TG.DS} k={0.76} label="sha256" mono tagSize={13} on={s(2)} lit={hot === 1} loop="pulse" t={2.6} />
      <Node x={TG.SX} y={TG.DY} icon="server" size={52} label="Deploy" on={s(2)} loop="pulse" t={2.8} />
      <W pts={TG_DEP} head={8} on={s(2)} lit={hot === 1} />
      <Token cls={R_DEP} size={9} on={s(2)} />
    </Frame>
  )
}

/* ================================================================== slide 52 · reproducible and rollback-safe */

/*
 * 566 x 380. The repository panel x 80..330, y 40..350: Amazon ECR mark (205, 86); image v1 (250, 180) with its locked
 * `v1` pill (160, 180); image v2 (250, 290) with its `v2` pill (160, 290), arriving at press 2. Two deployment servers
 * (480, 130) and (480, 250) each wire to a junction (380, 180) that lands on v1's right edge (one exact image, the
 * target disc on the junction) (1); a rollback wire from v2 up into v1, the refresh disc on it, v1 ticked (2).
 */
const RB = { W: 566, H: 380, PX: 80, PY: 40, PW: 250, PH: 310, MX: 205, MY: 86, IX: 250, V1: 180, V2: 290, IS: 56, PLX: 160, SX: 480, S1: 130, S2: 250, JX: 390 }
const RB_S: Pt[][] = [
  [[RB.SX - 26, RB.S1], [RB.JX, RB.S1], [RB.JX, RB.V1], [RB.IX + RB.IS / 2, RB.V1]],
  [[RB.SX - 26, RB.S2], [RB.JX, RB.S2], [RB.JX, RB.V1], [RB.IX + RB.IS / 2, RB.V1]],
]
const RB_BACK: Pt[] = [[RB.IX, RB.V2 - RB.IS / 2], [RB.IX, RB.V1 + RB.IS / 2]]
const R_RES = RB_S.map((pts, i) => K.ride(`res${i}`, pts, 0.2 + i * 0.3, 1.6 + i * 0.3, 2.8))
const R_BACK = K.ride('back', RB_BACK, 0.2, 1.2, 2.4)

const G_T23B: Fig = (p) => {
  const { hot, s } = useBuild({ ...p, steps: p.steps ?? 2 })
  return (
    <Frame w={RB.W} h={RB.H}>
      <Panel x={RB.PX} y={RB.PY} w={RB.PW} h={RB.PH} tint="linear-gradient(180deg, #FFFFFF 0%, #FFF6EE 100%)" />
      <Node x={RB.MX} y={RB.MY} mark={ecrMark} size={52} label="Amazon ECR" tagSize={13} />
      {/* the locked v1 image */}
      <Node x={RB.IX} y={RB.V1} icon="image" size={RB.IS} k={0.72} loop="float" t={3.2} lit={hot === 0}>
        <Disc x={RB.IS - 2} y={RB.IS - 2} size={22} icon="check" loop="none" on={s(2)} z={7} />
      </Node>
      <Pill x={RB.PLX} y={RB.V1} text="v1" />
      <Disc x={RB.PLX + 24} y={RB.V1 - 16} size={24} icon="lock" loop="none" z={7} />
      {/* point 1: two deployments resolving v1 land on the same image */}
      {[RB.S1, RB.S2].map((y, i) => <Node key={i} x={RB.SX} y={y} icon="server" size={52} label="Deploy" on={s(1)} lit={hot === 0} loop="pulse" t={2.8} d={i * 0.7} />)}
      {RB_S.map((pts, i) => <W key={i} pts={pts} head={8} on={s(1)} lit={hot === 0} delay={i * 160} />)}
      {R_RES.map((c, i) => <Token key={i} cls={c} size={9} on={s(1)} />)}
      <Disc x={RB.JX} y={RB.V1} size={28} icon="target" on={s(1)} loop="pulse" z={7} />
      {/* point 2: a newer v2, and the rollback back to the locked v1 */}
      <Node x={RB.IX} y={RB.V2} icon="image" size={RB.IS} k={0.72} on={s(2)} loop="float" t={3.2} d={0.6} />
      <Pill x={RB.PLX} y={RB.V2} text="v2" on={s(2)} lit={hot === 1} />
      <W pts={RB_BACK} head={8} on={s(2)} lit={hot === 1} />
      <Disc x={RB.IX} y={(RB.V1 + RB.V2) / 2} size={26} icon="refresh" on={s(2)} loop="spin" t={3.2} z={7} />
      <Token cls={R_BACK} size={9} on={s(2)} />
    </Frame>
  )
}

/* ------------------------------------------------------------------ css */

const LOCAL_CSS = `
@keyframes s19g-slab { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-1.5px) } }
.s19g-slab { animation: s19g-slab 3.2s cubic-bezier(0.45,0,0.55,1) infinite; }
.cc-still .s19g-slab, .deck-thumb .s19g-slab { animation: none !important; transform: none !important; }
@media (prefers-reduced-motion: reduce) { .s19g-slab { animation: none !important; } }
`

void BLUE
void Junction
export const figures: Record<string, Fig> = { G_T22, G_T22B, G_T23, G_T23B }
export const css = K.css() + LOCAL_CSS
