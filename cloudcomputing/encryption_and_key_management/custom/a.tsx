import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Loop, type Badge } from '@/engine/icons3d'
import { EASE, ORANGE, Frame, Plinth, Panel, Wire, Junction, Show, Token, useHot, useHeld, keyframes, tag, type Pt } from '@/engine/figkit'

/*
 * SESSION 15 · SECTIONS 1-2 (Data States, Cryptography Essentials) technical figures, builder A.
 * Built to generate-slides standing correction 17: 3D icons on white plinth tiles, >= 20 px equal padding, orthogonal
 * wires computed from the same constants as the boxes, a flow dot on every wire, a lit item that walks
 * first -> last -> first after the build. Every loop is a CSS animation of transform / opacity on an HTML element.
 * Held (?still): the full final state, nothing lit, nothing moving. Class prefix `t15a-`.
 *
 *   slide 6  A_T01  546 x 330  Rest (disk) -> Transit (two servers, a link) -> Use (memory, CPU), a data block on the chain (3)
 *   slide 9  A_T03  546 x 330  Symmetric / Asymmetric / Hashing cards, each acting on a Data document (3)
 *   slide 10 A_T04  546 x 330  AES and RSA / ECC cards with their locks; one key-length scale 128 / 256 / 2048; key exchange, signature (3)
 *   slide 12 A_T05  546 x 330  Data -> Hash -> SHA-256 digest, blocked return; file and salted password lanes; bit flip (3)
 *   slide 14 A_T07  546 x 330  Handshake -> Session Key -> Integrity over a Server -> Client lane of packets (3)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('t15a')
const BLUE = colors.brand
const TRACK = '#DCE5F7'
const RING = `0 0 0 3px ${ORANGE}, 0 10px 22px -12px ${ORANGE}`

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)
const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })

/* ------------------------------------------------------------------ loop keyframes (transform / opacity only) */

const KF: string[] = []
const pc = (t: number, P: number) => `${Math.max(0, Math.min(100, (t / P) * 100)).toFixed(2)}%`
function anim(name: string, P: number, frames: string, timing = 'linear') {
  const c = `t15a-${name}`
  KF.push(`@keyframes ${c} { ${frames} }\n.${c} { animation: ${c} ${P}s ${timing} infinite; }`)
  return c
}
/** opacity 1 during [a, b] of a P-second loop (fade f), else 0; `inv` swaps the two */
function win(name: string, P: number, a: number, b: number, f = 0.14, inv = false) {
  const on = inv ? 0 : 1
  const off = inv ? 1 : 0
  return anim(name, P, `0%, ${pc(a - f, P)} { opacity: ${off} } ${pc(a, P)}, ${pc(b, P)} { opacity: ${on} } ${pc(b + f, P)}, 100% { opacity: ${off} }`)
}
/** opacity 1 across the loop seam: [a, P] and [0, b] */
function seamWin(name: string, P: number, a: number, b: number, f = 0.14) {
  return anim(name, P, `0%, ${pc(b, P)} { opacity: 1 } ${pc(b + f, P)}, ${pc(a - f, P)} { opacity: 0 } ${pc(a, P)}, 100% { opacity: 1 }`)
}
const dl = (d = 0): CSSProperties => ({ animationDelay: `${-d}s` })

/* ------------------------------------------------------------------ pieces */

/** a tile + tag group whose TILE centre is (x, y); `up` puts the tag above the tile */
function Node({ x, y, size, label, children, w = 120, on = true, delay = 0, tagSize = 13.5, up = false, z = 3 }: { x: number; y: number; size: number; label?: string; children: ReactNode; w?: number; on?: boolean; delay?: number; tagSize?: number; up?: boolean; z?: number }) {
  const t = label ? <span style={{ ...tag(tagSize), [up ? 'marginBottom' : 'marginTop']: 5 }}>{label}</span> : null
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, width: w, zIndex: z, display: 'flex', flexDirection: up ? 'column-reverse' : 'column', alignItems: 'center', ...(up ? { bottom: `calc(100% - ${y + size / 2}px)` } : { top: y - size / 2 }) }}>
      <div style={{ width: size, height: size, display: 'grid', placeItems: 'center', position: 'relative' }}>{children}</div>
      {t}
    </Show>
  )
}

/** a 3D icon on its plinth */
const Tile = ({ name, size = 52, k = 0.72, loop = 'bob', d = 0, t, lit = false, warm = false, badge }: { name: Ico3DName; size?: number; k?: number; loop?: Loop; d?: number; t?: number; lit?: boolean; warm?: boolean; badge?: Badge }) => (
  <Plinth size={size} lit={lit} warm={warm}><Ico3D name={name} size={Math.round(size * k)} loop={loop} d={d} t={t} badge={badge} /></Plinth>
)

/** a small white disc on a tile's corner (inside a Node's tile box); fades in with `on`; `cls` = an opacity loop */
function Corner({ children, size = 24, on = true, at = 'tr', cls, d = 0 }: { children: ReactNode; size?: number; on?: boolean; at?: 'tr' | 'br' | 'tc' | 'tl'; cls?: string; d?: number }) {
  const instant = useInstant()
  const pos: CSSProperties = at === 'tc' ? { left: '50%', top: -(size + 4) / 2, marginLeft: -(size + 4) / 2 } : at === 'tl' ? { left: -size * 0.34, top: -size * 0.3 } : { right: -size * 0.34, ...(at === 'tr' ? { top: -size * 0.3 } : { bottom: -size * 0.3 }) }
  return (
    <span style={{ position: 'absolute', ...pos, width: size + 4, height: size + 4, zIndex: 4, opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}` }}>
      <span className={cls ? `t15a-l ${cls}` : undefined} style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%', borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6', ...dl(d) }}>
        {children}
      </span>
    </span>
  )
}

/** a white disc carrying a mini icon along a `ride` class (or a plain dot with `dot`); nothing on held frames */
function Rider({ cls, on = true, size = 26, d = 0, dot, children }: { cls: string; on?: boolean; size?: number; d?: number; dot?: string; children?: ReactNode }) {
  const held = useHeld()
  if (held || !on) return null
  const sz = dot ? 10 : size
  return (
    <span aria-hidden style={{ position: 'absolute', left: -sz / 2, top: -sz / 2, width: sz, height: sz, zIndex: 7, pointerEvents: 'none' }}>
      <span
        className={`t15a-l ${cls}`}
        style={{
          display: 'grid', placeItems: 'center', width: sz, height: sz, borderRadius: 99, opacity: 0, ...dl(d),
          ...(dot ? { background: dot, boxShadow: `0 0 0 4px ${dot}2e, 0 4px 10px -4px ${dot}` } : { background: '#FFFFFF', boxShadow: '0 4px 10px -4px rgba(31,64,140,0.55), inset 0 0 0 1px #D3DEF6' }),
        }}
      >
        {children}
      </span>
    </span>
  )
}

/** one key of the engine's key pair (the public key is the blue one, the private key the gold one), cut from `keypair` */
function KeyHalf({ side, size = 24 }: { side: 'pub' | 'priv'; size?: number }) {
  return (
    <span aria-hidden style={{ position: 'relative', display: 'block', width: size / 2, height: size, overflow: 'hidden', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 0, left: side === 'pub' ? 0 : -size / 2 }}>
        <Ico3D name="keypair" size={size} loop="none" />
      </span>
    </span>
  )
}

/** a padlock that shuts and opens on a loop (`shut` / `open` = opacity classes); held or idle: shut */
function LockFlip({ size, run, shut, open, d = 0 }: { size: number; run: boolean; shut: string; open: string; d?: number }) {
  return (
    <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: size, height: size }}>
      <span className={run ? `t15a-l ${shut}` : undefined} style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', ...dl(d) }}><Ico3D name="lock" size={size} loop="none" /></span>
      {run && <span className={`t15a-l ${open}`} style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: 0, ...dl(d) }}><Ico3D name="unlock" size={size} loop="none" /></span>}
    </span>
  )
}

/** wires drawn over the cards they cross (a Panel sits at z 2; tiles at z 3 stay above) */
const Wires = ({ children }: { children: ReactNode }) => <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>{children}</div>

/** an orange ring over a card, shown by an opacity loop (keeps a lit card in step with the flow dots) */
const LoopRing = ({ x, y, w, h, cls }: { x: number; y: number; w: number; h: number; cls: string }) => (
  <span aria-hidden className={`t15a-l ${cls}`} style={box(x, y, w, h, { borderRadius: 18, boxShadow: RING, opacity: 0, zIndex: 2, pointerEvents: 'none' })} />
)

/* ================================================================== slide 6 · A_T01 · three data states */

/*
 * 546 x 330. Three cards on one row, y 51..221: Rest (x 20, w 118: the disk), Transit (x 168, w 210: two servers
 * joined by a network link), Use (x 408, w 118: the memory stick with the CPU). The chain runs along the tile centres
 * (y 125): disk -> server -> server -> memory; the return wire leaves the Use card's bottom edge, runs under the cards
 * (y 279) and enters the Rest card's bottom edge (the data is written back). Press 1 lights Rest, the data block sits
 * on the disk; 2 draws the link, the block rides it; 3 closes the chain and the loop runs Use -> Rest -> Transit.
 */
const DS = { W: 546, H: 330, Y: 51, CH: 170, RY: 125, RX: 20, RW: 118, TX: 168, TW: 210, UX: 408, UW: 118, BY: 279, MS: 72, SS: 42, P: 4.8 }
const DS_RC = DS.RX + DS.RW / 2
const DS_UC = DS.UX + DS.UW / 2
const DS_T1 = DS.TX + 20 + DS.SS / 2
const DS_T2 = DS.TX + DS.TW - 20 - DS.SS / 2
const DS_TM = (DS_T1 + DS_T2) / 2
const DS_W1: Pt[] = [[DS_RC + DS.MS / 2, DS.RY], [DS_T1 - DS.SS / 2, DS.RY]]
const DS_W2: Pt[] = [[DS_T1 + DS.SS / 2, DS.RY], [DS_T2 - DS.SS / 2, DS.RY]]
const DS_W3: Pt[] = [[DS_T2 + DS.SS / 2, DS.RY], [DS_UC - DS.MS / 2, DS.RY]]
const DS_WB: Pt[] = [[DS_UC, DS.Y + DS.CH], [DS_UC, DS.BY], [DS_RC, DS.BY], [DS_RC, DS.Y + DS.CH]]
/* one 4.8 s loop: Use 0-1.6 (block in memory, then written back), Rest 1.6-3.2 (on the disk, then sent), Transit 3.2-4.8 */
const DS_RB = K.ride('t01b', DS_WB, 0.7, 1.5, DS.P)
const DS_R1 = K.ride('t01w1', DS_W1, 2.6, 3.15, DS.P)
const DS_R2 = K.ride('t01w2', DS_W2, 3.3, 4.15, DS.P)
const DS_R3 = K.ride('t01w3', DS_W3, 4.2, 4.72, DS.P)
const DS_ON_DISK = win('t01disk', DS.P, 1.55, 2.62)
const DS_ON_CHIP = seamWin('t01chip', DS.P, 4.72, 0.72)
const DS_RINGS = [win('t01rR', DS.P, 1.6, 3.06), win('t01rT', DS.P, 3.2, 4.66), seamWin('t01rU', DS.P, 4.8, 1.46)]
const DS_STEP2 = K.ride('t01s2', DS_W2, 0.15, 1.1, 1.5)

/** the data block: a document on a blue disc, so it reads on white tiles */
const DataMini = () => (
  <span style={{ display: 'grid', placeItems: 'center', width: 24, height: 24, borderRadius: 99, background: `linear-gradient(180deg, #5A86FF 0%, ${BLUE} 60%, ${colors.brandDark} 100%)` }}>
    <Ico3D name="doc" size={18} loop="none" />
  </span>
)

const A_T01: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const s = (n: number) => held || step >= n
  const live = !held
  const cyc = live && step >= 3
  const cards = [
    { x: DS.RX, w: DS.RW, lit: live && step === 1 },
    { x: DS.TX, w: DS.TW, lit: live && step === 2 },
    { x: DS.UX, w: DS.UW, lit: false },
  ]
  const tagTop = DS.RY + DS.MS / 2 + 6
  return (
    <Frame w={DS.W} h={DS.H}>
      {cards.map((c, k) => <Panel key={k} x={c.x} y={DS.Y} w={c.w} h={DS.CH} lit={c.lit} />)}
      {cyc && cards.map((c, k) => <LoopRing key={k} x={c.x} y={DS.Y} w={c.w} h={DS.CH} cls={DS_RINGS[k]} />)}

      {/* the chain, and the write-back under the cards */}
      <Wires>
        <Wire pts={DS_W1} on={s(2)} />
        <Wire pts={DS_W2} on={s(2)} delay={200} />
        <Wire pts={DS_W3} on={s(3)} />
        <Wire pts={DS_WB} on={s(3)} delay={200} />
      </Wires>

      {/* Rest: the disk */}
      <Node x={DS_RC} y={DS.RY} size={DS.MS} label="Rest" w={110}>
        <Tile name="disk" size={DS.MS} d={0.2} />
        {step === 1 && live && <Corner><DataMini /></Corner>}
        {cyc && <Corner cls={DS_ON_DISK}><DataMini /></Corner>}
      </Node>

      {/* Transit: two systems and the network link between them */}
      <Node x={DS_T1} y={DS.RY} size={DS.SS}><Tile name="server" size={DS.SS} k={0.72} d={0.5} /></Node>
      <Node x={DS_T2} y={DS.RY} size={DS.SS}><Tile name="server" size={DS.SS} k={0.72} d={1.1} /></Node>
      <span style={box(DS_TM - 15, DS.RY - 15, 30, 30, { zIndex: 4, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6', display: 'grid', placeItems: 'center' })}>
        <Ico3D name="link" size={22} loop="pulse" />
      </span>
      <span style={box(DS_TM - 60, tagTop, 120, 18, { ...tag(13.5), zIndex: 3 })}>Transit</span>

      {/* Use: the memory stick, with the CPU */}
      <Node x={DS_UC} y={DS.RY} size={DS.MS} label="Use" w={110}>
        <Tile name="chip" size={DS.MS} k={0.74} d={0.8} />
        <Corner at="br" size={26}><Ico3D name="cpu" size={22} loop="pulse" t={2.4} /></Corner>
        {cyc && <Corner cls={DS_ON_CHIP}><DataMini /></Corner>}
      </Node>

      {/* the data block on the move */}
      {step === 2 && <Rider cls={DS_STEP2}><DataMini /></Rider>}
      {cyc && (
        <>
          <Rider cls={DS_RB}><DataMini /></Rider>
          <Rider cls={DS_R1}><DataMini /></Rider>
          <Rider cls={DS_R2}><DataMini /></Rider>
          <Rider cls={DS_R3}><DataMini /></Rider>
        </>
      )}
    </Frame>
  )
}

/* ================================================================== slide 9 · A_T03 · three core tools */

/*
 * 546 x 330: three cards (x 20 / 195 / 370, w 156, y 20..310). In each: the tool on top (y 84) and a Data document
 * below (y 236), joined by orthogonal wires down the card's sides (20 px inside the card edge).
 * Symmetric: one key rides to the document twice, the padlock on it shuts, then opens. Asymmetric: the pair splits,
 * the blue public key rides down the left side and shuts the padlock, the gold private key rides down the right side
 * and opens it. Hashing: the document rides up into the fingerprint. Press N draws card N's action.
 */
const CT = { W: 546, H: 330, Y: 20, CH: 290, CW: 156, TY: 84, TS: 64, DY: 236, DS: 52, P: 3.2 }
const CT_X = [20, 195, 370]
const CT_C = CT_X.map((x) => x + CT.CW / 2)
const CT_SYM: Pt[] = [[CT_C[0] + CT.TS / 2, CT.TY], [CT_X[0] + CT.CW - 20, CT.TY], [CT_X[0] + CT.CW - 20, CT.DY], [CT_C[0] + CT.DS / 2, CT.DY]]
const CT_PUB: Pt[] = [[CT_C[1] - CT.TS / 2, CT.TY], [CT_X[1] + 20, CT.TY], [CT_X[1] + 20, CT.DY], [CT_C[1] - CT.DS / 2, CT.DY]]
const CT_PRIV: Pt[] = [[CT_C[1] + CT.TS / 2, CT.TY], [CT_X[1] + CT.CW - 20, CT.TY], [CT_X[1] + CT.CW - 20, CT.DY], [CT_C[1] + CT.DS / 2, CT.DY]]
const CT_HASH: Pt[] = [[CT_C[2] + CT.DS / 2, CT.DY], [CT_X[2] + CT.CW - 20, CT.DY], [CT_X[2] + CT.CW - 20, CT.TY], [CT_C[2] + CT.TS / 2, CT.TY]]
/* the padlock shuts when the first key arrives (1.1 s) and opens when the second arrives (2.7 s) */
const LK_SHUT = win('lkshut', CT.P, 1.1, 2.7)
const LK_OPEN = win('lkopen', CT.P, 1.1, 2.7, 0.14, true)
const CT_R_SYM1 = K.ride('t03s1', CT_SYM, 0.2, 1.1, CT.P)
const CT_R_SYM2 = K.ride('t03s2', CT_SYM, 1.8, 2.7, CT.P)
const CT_R_PUB = K.ride('t03pub', CT_PUB, 0.2, 1.1, CT.P)
const CT_R_PRIV = K.ride('t03priv', CT_PRIV, 1.8, 2.7, CT.P)
const CT_R_HASH = K.ride('t03h', CT_HASH, 0.2, 1.3, 2.4)
const CT_TOOLS: [Ico3DName, string, Loop][] = [['key', 'Symmetric', 'tilt'], ['keypair', 'Asymmetric', 'bob'], ['fingerprint', 'Hashing', 'pulse']]

const A_T03: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const hot = useHot(3, step, 1800)
  const s = (n: number) => held || step >= n
  const live = !held
  const phase = [0, 1.07, 0]
  return (
    <Frame w={CT.W} h={CT.H}>
      {CT_X.map((x, k) => <Panel key={k} x={x} y={CT.Y} w={CT.CW} h={CT.CH} lit={hot === k} />)}

      <Wires>
        <Wire pts={CT_SYM} on={s(1)} />
        <Wire pts={CT_PUB} on={s(2)} />
        <Wire pts={CT_PRIV} on={s(2)} delay={250} />
        <Wire pts={CT_HASH} on={s(3)} />
      </Wires>

      {CT_TOOLS.map(([icon, label, loop], k) => (
        <Node key={k} x={CT_C[k]} y={CT.TY} size={CT.TS} label={label} w={140}><Tile name={icon} size={CT.TS} k={0.74} loop={loop} d={k * 0.5} /></Node>
      ))}
      {CT_C.map((x, k) => (
        <Node key={k} x={x} y={CT.DY} size={CT.DS} label="Data" w={100} on={s(k + 1)}>
          <Tile name="doc" size={CT.DS} d={0.3 + k * 0.4} loop={k === 2 ? 'bob' : 'none'} />
          {k < 2 && (
            <Corner at="tc" size={28}>
              <LockFlip size={22} run={live && s(k + 1)} shut={LK_SHUT} open={LK_OPEN} d={phase[k]} />
            </Corner>
          )}
        </Node>
      ))}

      <Rider cls={CT_R_SYM1} on={s(1)} d={phase[0]}><Ico3D name="key" size={18} loop="none" /></Rider>
      <Rider cls={CT_R_SYM2} on={s(1)} d={phase[0]}><Ico3D name="key" size={18} loop="none" /></Rider>
      <Rider cls={CT_R_PUB} on={s(2)} d={phase[1]}><KeyHalf side="pub" size={22} /></Rider>
      <Rider cls={CT_R_PRIV} on={s(2)} d={phase[1]}><KeyHalf side="priv" size={22} /></Rider>
      <Rider cls={CT_R_HASH} on={s(3)}><Ico3D name="doc" size={18} loop="none" /></Rider>
    </Frame>
  )
}

/* ================================================================== slide 10 · A_T04 · keys compared */

/*
 * 546 x 330 (re-laid 2026-11-18 on the coordinator's word: no empty half card).
 * Row 1, two compact cards (y 28..137): AES (x 20, w 244): the one key (82) rides to its padlock (202), which shuts,
 * then opens on the next ride. RSA / ECC (x 282): the key pair (344) and its padlock (464): the blue public key shuts
 * it, the gold private key opens it.
 * Row 2, one key-length scale across the stage (track x 40..460, y 171): 2048 bits = 400 px, so 128 = 25 px and
 * 256 = 50 px (the TR's ratio); the 2048 bar runs on into a fading tail for "or more". Number tags: 128 and 2048 above
 * the track, 256 below, each on a tick at its bar's end.
 * Row 3 (y 262): Key Exchange (183) and Signature (363), fed from the RSA / ECC card by a riser at x 506 (right of the
 * track) and a bus at y 214. Press 1 the AES bars, 2 the RSA bar, 3 row 3.
 */
const KC = { W: 546, H: 330, Y: 28, CH: 109, AX: 20, RX: 282, CW: 244, RA: 72, TS: 48, X0: 40, L: 400, TAIL: 20, TY: 171, BH: 14, BUS: 214, RC: 262, CS: 48, RISER: 506, KE: 183, SG: 363, P: 3.2 }
const KC_AK = KC.AX + 62
const KC_AL = KC.AX + 182
const KC_RK = KC.RX + 62
const KC_RL = KC.RX + 182
const KC_CB = KC.Y + KC.CH // the cards' bottom edge
const KC_AES_W: Pt[] = [[KC_AK + KC.TS / 2, KC.RA], [KC_AL - KC.TS / 2, KC.RA]]
const KC_RSA_W: Pt[] = [[KC_RK + KC.TS / 2, KC.RA], [KC_RL - KC.TS / 2, KC.RA]]
const KC_TO_KE: Pt[] = [[KC.RISER, KC_CB], [KC.RISER, KC.BUS], [KC.KE, KC.BUS], [KC.KE, KC.RC - KC.CS / 2]]
const KC_TO_SG: Pt[] = [[KC.RISER, KC_CB], [KC.RISER, KC.BUS], [KC.SG, KC.BUS], [KC.SG, KC.RC - KC.CS / 2]]
const KC_DROP_SG: Pt[] = [[KC.SG, KC.BUS], [KC.SG, KC.RC - KC.CS / 2]]
const KC_R_A1 = K.ride('t04a1', KC_AES_W, 0.3, 1.1, KC.P)
const KC_R_A2 = K.ride('t04a2', KC_AES_W, 1.9, 2.7, KC.P)
const KC_R_PUB = K.ride('t04pub', KC_RSA_W, 0.3, 1.1, KC.P)
const KC_R_PRIV = K.ride('t04priv', KC_RSA_W, 1.9, 2.7, KC.P)
const KC_R_KE = K.ride('t04ke', KC_TO_KE, 0.2, 1.6, 3.2)
const KC_R_SG = K.ride('t04sg', KC_TO_SG, 1.7, 2.9, 3.2)
const KC_STAMP = anim('stamp', 1.8, `0%, 100% { transform: translateY(-7px) } 40% { transform: translateY(-7px) } 55%, 68% { transform: translateY(1px) } 85% { transform: translateY(-7px) }`, 'cubic-bezier(0.45,0,0.55,1)')
const MONO = "'JetBrains Mono', ui-monospace, monospace"
const KC_LEN = (bits: number) => (bits / 2048) * KC.L

/** one bar on the shared scale, grown from the track's left end; `tail` fades past its end ("or more") */
function Bar({ bits, fill, on, tail = 0, delay = 0 }: { bits: number; fill: string; on: boolean; tail?: number; delay?: number }) {
  const instant = useInstant()
  const len = KC_LEN(bits)
  return (
    <span aria-hidden style={box(KC.X0, KC.TY, len + tail, KC.BH, { zIndex: 3, transformOrigin: '0 50%', transform: on ? 'scaleX(1)' : 'scaleX(0)', transition: instant ? 'none' : `transform 820ms ${EASE} ${delay}ms` })}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: KC.BH / 2, background: tail ? `linear-gradient(90deg, ${fill} 0%, ${fill} ${(len / (len + tail)) * 100}%, ${fill}00 100%)` : fill, transition: instant ? 'none' : `background 420ms ${EASE}` }} />
    </span>
  )
}

/** a bar's number tag on a short tick at its end, above or below the track */
function BitTag({ bits, below = false, on, delay = 0, lit }: { bits: number; below?: boolean; on: boolean; delay?: number; lit: boolean }) {
  const instant = useInstant()
  const x = KC.X0 + KC_LEN(bits)
  const tick = 6
  return (
    <div style={box(x - 26, below ? KC.TY + KC.BH : KC.TY - tick - 20, 52, tick + 20, { zIndex: 4, display: 'flex', flexDirection: below ? 'column' : 'column-reverse', alignItems: 'center', opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 520ms ${EASE} ${delay + 500}ms` })}>
      <span style={{ width: 2, height: tick, background: lit ? ORANGE : colors.brandDeep, borderRadius: 1 }} />
      <span style={{ fontFamily: MONO, fontVariantLigatures: 'none', fontSize: 13.5, fontWeight: 700, lineHeight: '20px', color: colors.brandDeep }}>{bits}</span>
    </div>
  )
}

const A_T04: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const hot = useHot(3, step, 1800)
  const s = (n: number) => held || step >= n
  const live = !held
  return (
    <Frame w={KC.W} h={KC.H}>
      <Panel x={KC.AX} y={KC.Y} w={KC.CW} h={KC.CH} />
      <Panel x={KC.RX} y={KC.Y} w={KC.CW} h={KC.CH} />

      <Wires>
        <Wire pts={KC_AES_W} />
        <Wire pts={KC_RSA_W} />
        <Wire pts={KC_TO_KE} on={s(3)} lit={hot === 2} />
        <Wire pts={KC_DROP_SG} on={s(3)} lit={hot === 2} head={8} delay={300} />
      </Wires>
      <Junction x={KC.SG} y={KC.BUS} on={s(3)} lit={hot === 2} />

      {/* row 1: one key and its padlock; the key pair and its padlock */}
      <Node x={KC_AK} y={KC.RA} size={KC.TS} label="AES" w={90}><Tile name="key" size={KC.TS} k={0.72} loop="tilt" /></Node>
      <Node x={KC_AL} y={KC.RA} size={KC.TS} label="Lock" w={90}>
        <Plinth size={KC.TS}><LockFlip size={34} run={live} shut={LK_SHUT} open={LK_OPEN} /></Plinth>
      </Node>
      <Node x={KC_RK} y={KC.RA} size={KC.TS} label="RSA / ECC" w={100}><Tile name="keypair" size={KC.TS} k={0.76} d={0.4} /></Node>
      <Node x={KC_RL} y={KC.RA} size={KC.TS} label="Lock" w={90}>
        <Plinth size={KC.TS}><LockFlip size={34} run={live} shut={LK_SHUT} open={LK_OPEN} /></Plinth>
      </Node>
      <Rider cls={KC_R_A1} size={24}><Ico3D name="key" size={17} loop="none" /></Rider>
      <Rider cls={KC_R_A2} size={24}><Ico3D name="key" size={17} loop="none" /></Rider>
      <Rider cls={KC_R_PUB} size={24}><KeyHalf side="pub" size={20} /></Rider>
      <Rider cls={KC_R_PRIV} size={24}><KeyHalf side="priv" size={20} /></Rider>

      {/* row 2: one key-length scale, to the TR's ratio */}
      <Show on={s(1)} lift={0} style={box(KC.X0, KC.TY, KC.L + KC.TAIL, KC.BH, { borderRadius: KC.BH / 2, background: TRACK, zIndex: 2 })}>{null}</Show>
      <Bar bits={2048} tail={KC.TAIL} fill={hot === 1 ? ORANGE : '#8DB0FF'} on={s(2)} />
      <Bar bits={256} fill={hot === 0 ? ORANGE : BLUE} on={s(1)} delay={150} />
      <Bar bits={128} fill={hot === 0 ? colors.accentDark : colors.brandDeep} on={s(1)} />
      <BitTag bits={128} on={s(1)} lit={hot === 0} />
      <BitTag bits={256} below on={s(1)} delay={150} lit={hot === 0} />
      <BitTag bits={2048} on={s(2)} lit={hot === 1} />

      {/* row 3: what the key pair is used for */}
      <Node x={KC.KE} y={KC.RC} size={KC.CS} label="Key Exchange" w={120} on={s(3)}><Tile name="envelope" size={KC.CS} k={0.74} lit={hot === 2} loop="float" /></Node>
      <Node x={KC.SG} y={KC.RC} size={KC.CS} label="Signature" w={110} on={s(3)} delay={150}>
        <Tile name="certificate" size={KC.CS} k={0.74} lit={hot === 2} loop="beat" t={1.8} />
        <Corner at="tl" size={24} on={s(3)}>
          <span className={live ? `t15a-l ${KC_STAMP}` : undefined} style={{ display: 'grid' }}><KeyHalf side="priv" size={22} /></span>
        </Corner>
      </Node>
      <Rider cls={KC_R_KE} on={s(3)} size={24}><Ico3D name="key" size={17} loop="none" /></Rider>
      <Rider cls={KC_R_SG} on={s(3)} size={24}><KeyHalf side="priv" size={20} /></Rider>
    </Frame>
  )
}

/* ================================================================== slide 12 · A_T05 · one-way fingerprint */

/*
 * 546 x 330. Top band (y 30..122): the Data card (x 20, w 130: a document and its six bits) -> the Hash machine
 * (236, 76) -> the SHA-256 digest card (x 340, w 186: one row of eight cells per run). A return wire from the digest
 * back to the machine (y 90) is orange, dashed and crossed: no reverse path.
 * Lanes (press 2): File -> Hash -> Digest (y 190) and Password -> Salt -> Slow Hash -> Digest (y 262), each digest
 * with a check. Press 1: the data runs twice, the second row of cells comes out the same. Press 3: one bit flips
 * (orange) and every cell of the second row changes.
 */
const HS = { W: 546, H: 330, Y: 30, CH: 92, DX: 20, DW: 130, HX: 236, HS: 64, GX: 340, GW: 186, L1: 190, L2: 262, LS: 42, P: 2.4 }
const HS_CY = HS.Y + HS.CH / 2
const HS_FWD = HS_CY - 14
const HS_BACK = HS_CY + 14
const HS_COL = [66, 190, 320, 466]
const HS_IN: Pt[] = [[HS.DX + HS.DW, HS_CY], [HS.HX - HS.HS / 2, HS_CY]]
const HS_OUT: Pt[] = [[HS.HX + HS.HS / 2, HS_FWD], [HS.GX, HS_FWD]]
const HS_RET: Pt[] = [[HS.GX, HS_BACK], [HS.HX + HS.HS / 2, HS_BACK]]
const HS_LANE1: Pt[] = [[HS_COL[0] + HS.LS / 2, HS.L1], [HS_COL[2] - HS.LS / 2, HS.L1]]
const HS_LANE1B: Pt[] = [[HS_COL[2] + HS.LS / 2, HS.L1], [HS_COL[3] - HS.LS / 2, HS.L1]]
const HS_LANE2: Pt[][] = [0, 1, 2].map((k) => [[HS_COL[k] + HS.LS / 2, HS.L2], [HS_COL[k + 1] - HS.LS / 2, HS.L2]])
const HS_R_IN = K.ride('t05in', HS_IN, 0.1, 0.7, HS.P)
const HS_R_OUT = K.ride('t05out', HS_OUT, 0.9, 1.5, HS.P)
const HS_R_L1 = [K.ride('t05l1a', HS_LANE1, 0.1, 1.0, 2.8), K.ride('t05l1b', HS_LANE1B, 1.2, 1.9, 2.8)]
const HS_R_L2 = HS_LANE2.map((pts, k) => K.ride(`t05l2${k}`, pts, 0.1 + k * 0.85, 0.75 + k * 0.85, 2.8))
const HS_REFRESH = anim('refresh', HS.P, `0%, 62% { opacity: 1 } 66% { opacity: 0.25 } 76%, 100% { opacity: 1 }`)
const BITS = [1, 0, 1, 1, 0, 1]
const FLIP = 2
const SHADES = [BLUE, colors.brandDark, '#8DB0FF', '#C9D8FF']
const DIG_A = [0, 2, 1, 3, 2, 0, 3, 1]
const DIG_B = [2, 0, 3, 1, 0, 3, 1, 2] // differs from DIG_A in every cell

function Cells({ pat, refresh }: { pat: number[]; refresh?: boolean }) {
  return (
    <div className={refresh ? `t15a-l ${HS_REFRESH}` : undefined} style={{ display: 'flex', gap: 3.5, height: 20 }}>
      {pat.map((c, i) => <span key={i} style={{ width: 15, height: 20, borderRadius: 4, background: SHADES[c], boxShadow: 'inset 0 -2px 0 rgba(0,37,75,0.18)' }} />)}
    </div>
  )
}

const A_T05: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const hot = useHot(3, step, 1800)
  const s = (n: number) => held || step >= n
  const live = !held
  const flipped = s(3)
  const instant = useInstant()
  const fade = (on: boolean): CSSProperties => ({ opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 520ms ${EASE}` })
  return (
    <Frame w={HS.W} h={HS.H}>
      {/* the data: a document and its bits */}
      <Panel x={HS.DX} y={HS.Y} w={HS.DW} h={HS.CH} lit={hot === 2} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Ico3D name="doc" size={30} loop="bob" />
        <div style={{ display: 'flex', gap: 3.6 }}>
          {BITS.map((b, i) => (
            <span key={i} style={{ position: 'relative', width: 12, height: 14, borderRadius: 3, background: b ? BLUE : TRACK }}>
              {i === FLIP && <span style={{ position: 'absolute', inset: 0, borderRadius: 3, background: ORANGE, ...fade(flipped) }} />}
            </span>
          ))}
        </div>
      </Panel>
      <span style={box(HS.DX, HS.Y + HS.CH + 6, HS.DW, 18, { ...tag(13.5), zIndex: 3 })}>Data</span>

      {/* the machine, its way out, and the way back that does not exist */}
      <Wire pts={HS_IN} />
      <Wire pts={HS_OUT} />
      <Wire pts={HS_RET} color={ORANGE} dash="5 6" width={2.4} />
      <span style={box((HS.GX + HS.HX + HS.HS / 2) / 2 - 15, HS_BACK - 15, 30, 30, { zIndex: 4, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #FFD2B0', display: 'grid', placeItems: 'center' })}>
        <Ico3D name="cross" size={20} loop="pulse" t={2.4} />
      </span>
      <Node x={HS.HX} y={HS_CY} size={HS.HS} label="Hash" w={100}><Tile name="hash" size={HS.HS} k={0.74} loop="beat" t={HS.P} d={1.4} /></Node>

      {/* the SHA-256 digest: run 1, and run 2 (the same, until a bit flips) */}
      <Panel x={HS.GX} y={HS.Y} w={HS.GW} h={HS.CH} lit={hot === 0} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Cells pat={DIG_A} />
        <div style={{ position: 'relative', ...fade(s(1)) }}>
          <div style={fade(!flipped)}><Cells pat={DIG_A} /></div>
          <div style={{ position: 'absolute', inset: 0, ...fade(flipped) }}><Cells pat={DIG_B} refresh={flipped && live} /></div>
        </div>
      </Panel>
      <span style={box(HS.GX, HS.Y + HS.CH + 6, HS.GW, 18, { ...tag(13.5), zIndex: 3 })}>SHA-256</span>
      <span style={box(HS.GX + HS.GW - 16, HS.Y - 12, 28, 28, { zIndex: 5, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6', display: 'grid', placeItems: 'center', ...fade(s(1) && !flipped) })}>
        <Ico3D name="check" size={20} loop="beat" />
      </span>

      <Token cls={HS_R_IN} />
      <Token cls={HS_R_OUT} />

      {/* press 2: a file's integrity, a stored password */}
      <Wire pts={HS_LANE1} on={s(2)} lit={hot === 1} />
      <Wire pts={HS_LANE1B} on={s(2)} lit={hot === 1} delay={200} />
      {HS_LANE2.map((pts, k) => <Wire key={k} pts={pts} on={s(2)} lit={hot === 1} delay={k * 150} />)}
      <Node x={HS_COL[0]} y={HS.L1} size={HS.LS} label="File" w={90} on={s(2)}><Tile name="doc" size={HS.LS} lit={hot === 1} d={0.2} /></Node>
      <Node x={HS_COL[2]} y={HS.L1} size={HS.LS} label="Hash" w={90} on={s(2)}><Tile name="hash" size={HS.LS} k={0.76} loop="beat" t={2.8} d={1.0} /></Node>
      <Node x={HS_COL[3]} y={HS.L1} size={HS.LS} label="Digest" w={90} on={s(2)}>
        <Tile name="digest" size={HS.LS} k={0.78} d={0.4} />
        <Corner size={20} on={s(2)}><Ico3D name="check" size={16} loop="beat" t={2.8} /></Corner>
      </Node>
      <Node x={HS_COL[0]} y={HS.L2} size={HS.LS} label="Password" w={90} on={s(2)}><Tile name="password" size={HS.LS} lit={hot === 1} d={0.6} /></Node>
      <Node x={HS_COL[1]} y={HS.L2} size={HS.LS} label="Salt" w={90} on={s(2)}><Tile name="plus" size={HS.LS} k={0.62} loop="pulse" d={0.3} /></Node>
      <Node x={HS_COL[2]} y={HS.L2} size={HS.LS} label="Slow Hash" w={90} on={s(2)}>
        <Tile name="hash" size={HS.LS} k={0.76} loop="beat" t={2.8} d={0.2} />
        <Corner size={20} at="tr" on={s(2)}><Ico3D name="hourglass" size={16} loop="swing" t={2.8} /></Corner>
      </Node>
      <Node x={HS_COL[3]} y={HS.L2} size={HS.LS} label="Digest" w={90} on={s(2)}>
        <Tile name="digest" size={HS.LS} k={0.78} d={0.9} />
        <Corner size={20} on={s(2)}><Ico3D name="check" size={16} loop="beat" t={2.8} d={0.6} /></Corner>
      </Node>
      {HS_R_L1.map((c, k) => <Token key={k} cls={c} on={s(2)} size={9} />)}
      {HS_R_L2.map((c, k) => <Token key={k} cls={c} on={s(2)} size={9} />)}
    </Frame>
  )
}

/* ================================================================== slide 14 · A_T07 · TLS building blocks */

/*
 * 546 x 330. Top flow (y 94, tags above): Handshake (key pair, x 80) -> Session Key (273) -> Integrity (a document
 * with a check seal, 466). Bottom (y 244): Server (80) -> a lane of packets -> Client (466). Each top part reaches
 * down to the connection: press 1 the server's certificate rides up to the handshake (the server proves its
 * identity); press 2 the session key drops onto the lane and the packets beyond it ride padlocked; press 3 the
 * integrity seal checks every packet arriving at the client.
 */
const TL = { W: 546, H: 330, Y1: 94, Y2: 244, TS: 60, BS: 56, P: 2.4 }
const TL_X = [80, 273, 466]
const TL_TOP1: Pt[] = [[TL_X[0] + TL.TS / 2, TL.Y1], [TL_X[1] - TL.TS / 2, TL.Y1]]
const TL_TOP2: Pt[] = [[TL_X[1] + TL.TS / 2, TL.Y1], [TL_X[2] - TL.TS / 2, TL.Y1]]
const TL_CERT: Pt[] = [[TL_X[0], TL.Y2 - TL.BS / 2], [TL_X[0], TL.Y1 + TL.TS / 2]]
const TL_KEY: Pt[] = [[TL_X[1], TL.Y1 + TL.TS / 2], [TL_X[1], TL.Y2]]
const TL_SEAL: Pt[] = [[TL_X[2], TL.Y1 + TL.TS / 2], [TL_X[2], TL.Y2 - TL.BS / 2]]
const TL_LANE_A: Pt[] = [[TL_X[0] + TL.BS / 2, TL.Y2], [TL_X[1], TL.Y2]]
const TL_LANE_B: Pt[] = [[TL_X[1], TL.Y2], [TL_X[2] - TL.BS / 2, TL.Y2]]
const TL_R_TOP1 = K.ride('t07t1', TL_TOP1, 0.1, 0.9, TL.P)
const TL_R_TOP2 = K.ride('t07t2', TL_TOP2, 1.1, 1.9, TL.P)
const TL_R_CERT = K.ride('t07c', TL_CERT, 0.2, 1.2, TL.P)
const TL_R_KEY = K.ride('t07k', TL_KEY, 0.2, 1.1, TL.P)
const TL_R_SEAL = K.ride('t07s', TL_SEAL, 0.4, 1.2, 1.6)
const TL_R_A = K.ride('t07a', TL_LANE_A, 0, 0.72, TL.P)
const TL_R_B = K.ride('t07b', TL_LANE_B, 0.78, 1.55, TL.P)
const TL_PACKETS = [0, 0.8, 1.6]

const A_T07: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const hot = useHot(3, step, 1800)
  const s = (n: number) => held || step >= n
  return (
    <Frame w={TL.W} h={TL.H}>
      {/* the three blocks, in the order TLS uses them */}
      <Wire pts={TL_TOP1} on={s(2)} lit={hot === 1} />
      <Wire pts={TL_TOP2} on={s(3)} lit={hot === 2} />
      <Node x={TL_X[0]} y={TL.Y1} size={TL.TS} label="Handshake" w={110} up><Tile name="keypair" size={TL.TS} k={0.74} lit={hot === 0} d={0.2} /></Node>
      <Node x={TL_X[1]} y={TL.Y1} size={TL.TS} label="Session Key" w={110} up><Tile name="key" size={TL.TS} k={0.7} loop="tilt" lit={hot === 1} /></Node>
      <Node x={TL_X[2]} y={TL.Y1} size={TL.TS} label="Integrity" w={110} up><Tile name="doc" size={TL.TS} k={0.72} badge="check" lit={hot === 2} d={0.6} /></Node>

      {/* the connection they protect */}
      <Wire pts={TL_CERT} on={s(1)} lit={hot === 0} />
      <Wire pts={TL_LANE_A} on={s(2)} head={0} lit={hot === 1} />
      <Wire pts={TL_LANE_B} on={s(2)} lit={hot === 1} delay={200} />
      <Wire pts={TL_KEY} on={s(2)} head={0} lit={hot === 1} />
      <Junction x={TL_X[1]} y={TL.Y2} on={s(2)} lit={hot === 1} />
      <Wire pts={TL_SEAL} on={s(3)} lit={hot === 2} />

      <Node x={TL_X[0]} y={TL.Y2} size={TL.BS} label="Server" w={100}>
        <Tile name="server" size={TL.BS} k={0.7} lit={hot === 0} d={0.4} />
        <Corner size={26} on={s(1)}><Ico3D name="certificate" size={22} loop="beat" t={2.4} /></Corner>
      </Node>
      <Node x={TL_X[2]} y={TL.Y2} size={TL.BS} label="Client" w={100} on={s(2)}>
        <Tile name="laptop" size={TL.BS} k={0.7} lit={hot === 2} d={0.8} />
        <Corner size={24} at="br" on={s(3)}><Ico3D name="check" size={20} loop="beat" t={0.8} /></Corner>
      </Node>

      <Rider cls={TL_R_CERT} on={s(1)}><Ico3D name="certificate" size={18} loop="none" /></Rider>
      <Rider cls={TL_R_KEY} on={s(2)}><Ico3D name="key" size={18} loop="none" /></Rider>
      <Rider cls={TL_R_SEAL} on={s(3)}><Ico3D name="check" size={16} loop="none" /></Rider>
      <Token cls={TL_R_TOP1} on={s(2)} />
      <Token cls={TL_R_TOP2} on={s(3)} />
      {TL_PACKETS.map((d) => <Rider key={`a${d}`} cls={TL_R_A} on={s(2)} d={d} dot={BLUE} />)}
      {TL_PACKETS.map((d) => <Rider key={`b${d}`} cls={TL_R_B} on={s(2)} d={d} size={24}><Ico3D name="lock" size={16} loop="none" /></Rider>)}
    </Frame>
  )
}

export const figures: Record<string, Fig> = { A_T01, A_T03, A_T04, A_T05, A_T07 }

export const css = `
${KF.join('\n')}
${K.css()}
.cc-still .t15a-l, .deck-thumb .t15a-l { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .t15a-l { animation: none !important; } }
`
