import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, Frame, Plinth, MarkTile, Panel, Wire, Junction, Show, Token, useHot, useHeld, keyframes, tag, heading, type Pt } from '@/engine/figkit'
import elbMark from '../images/aws-elastic-load-balancing.svg'
import acmMark from '../images/aws-certificate-manager.svg'
import pcaMark from '../images/aws-private-certificate-authority.svg'
import acmCaMark from '../images/res-acm-certificate-authority.svg'
import cfMark from '../images/aws-cloudfront.svg'
import apigwMark from '../images/aws-api-gateway.svg'
import bucketMark from '../images/res-s3-bucket.svg'

/*
 * SESSION 15 · SECTION 3 (Encryption in Transit) technical figures, builder B.
 * Built to generate-slides standing correction 17: 3D icons on plinth tiles, official marks on white tiles, >= 20 px
 * equal padding, orthogonal wires computed from the same constants as the boxes, a flow dot (or a sealed / open
 * packet) on every wire, a lit item walking first -> last -> first after the build. Loops are transform / opacity on
 * HTML elements only. Held (?still): the full final state, nothing lit, nothing moving. Class prefix `t15b-`.
 *
 *   slide 16 B_T08   546 x 330  Client -> padlocked link -> Load Balancer (certificate) -> Backend; plaintext path cut (3)
 *   slide 17 B_T09   546 x 330  TLS handshake sequence, arrows 1-3 (3)
 *   slide 18 B_T09   546 x 380  the same sequence, arrows 1-3 built, then Key Exchange, Finished, Encrypted Data (2, from 3)
 *   slide 19 B_T10   546 x 330  Termination / Passthrough / Re-encryption lanes, padlock per hop, CPU meter (4)
 *   slide 21 B_T11   546 x 330  Root CA -> Intermediate CA -> Leaf, browser and Private CA trust, auto-renew clock (4)
 *   slide 22 B_T12   546 x 330  drawn ACM console (Issued, domain blurred) fanning to ELB, CloudFront, API Gateway (3)
 *   slide 23 B_T12B  566 x 380  bucket policy `aws:SecureTransport` false -> Deny; minimum TLS version gate (2)
 *
 * A "packet" is a small white tile riding a wire: a shut padlock = encrypted, an open one = plaintext.
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('t15b')
const BLUE = colors.brand
const LINE = '#B9C6E0'
const MONO = "'Fira Code', ui-monospace, monospace"

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)
const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })

/** a tile + tag group whose TILE centre is (x, y); `up` puts the tag above the tile */
function Node({ x, y, size, label, children, w = 130, on = true, delay = 0, tagSize = 13.5, up = false, z = 3 }: { x: number; y: number; size: number; label?: string; children: ReactNode; w?: number; on?: boolean; delay?: number; tagSize?: number; up?: boolean; z?: number }) {
  const t = label ? <span style={{ ...tag(tagSize), [up ? 'marginBottom' : 'marginTop']: 5 }}>{label}</span> : null
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, width: w, zIndex: z, display: 'flex', flexDirection: up ? 'column-reverse' : 'column', alignItems: 'center', ...(up ? { bottom: `calc(100% - ${y + size / 2}px)` } : { top: y - size / 2 }) }}>
      <div style={{ width: size, height: size, display: 'grid', placeItems: 'center', position: 'relative' }}>{children}</div>
      {t}
    </Show>
  )
}

/** a 3D icon on its plinth */
const Tile = ({ name, size = 52, k = 0.72, loop = 'bob', d = 0, t, lit = false, warm = false }: { name: Ico3DName; size?: number; k?: number; loop?: Loop; d?: number; t?: number; lit?: boolean; warm?: boolean }) => (
  <Plinth size={size} lit={lit} warm={warm}><Ico3D name={name} size={Math.round(size * k)} loop={loop} d={d} t={t} /></Plinth>
)

const ROUND_SHADOW = '0 4px 10px -5px rgba(31,64,140,0.6)'

/** a small round badge (3D icon or official mark) on a tile corner; fades in with `on`, rings orange when lit */
function Corner({ name, src, size = 22, on = true, loop = 'pulse', d = 0, t = 2.4, top = false, left = false, lit = false }: { name?: Ico3DName; src?: string; size?: number; on?: boolean; loop?: Loop; d?: number; t?: number; top?: boolean; left?: boolean; lit?: boolean }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'absolute', [left ? 'left' : 'right']: -size * 0.34, ...(top ? { top: -size * 0.3 } : { bottom: -size * 0.3 }), width: size + 4, height: size + 4, borderRadius: 99, background: '#FFFFFF', boxShadow: lit ? `0 0 0 2.5px ${ORANGE}, ${ROUND_SHADOW}` : ROUND_SHADOW, display: 'grid', placeItems: 'center', opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}, box-shadow 420ms ${EASE}`, zIndex: 4 }}>
      {src ? <img src={src} alt="" aria-hidden draggable={false} style={{ width: size - 2, height: size - 2, display: 'block' }} /> : <Ico3D name={name ?? 'check'} size={size} loop={loop} d={d} t={t} />}
    </span>
  )
}

/** a round badge standing on its own at (x, y) */
function Badge({ x, y, name, size = 22, on = true, lit = false, loop = 'beat', d = 0 }: { x: number; y: number; name: Ico3DName; size?: number; on?: boolean; lit?: boolean; loop?: Loop; d?: number }) {
  const instant = useInstant()
  return (
    <span style={{ ...box(x - (size + 4) / 2, y - (size + 4) / 2, size + 4, size + 4), borderRadius: 99, background: '#FFFFFF', boxShadow: lit ? `0 0 0 2.5px ${ORANGE}, ${ROUND_SHADOW}` : ROUND_SHADOW, display: 'grid', placeItems: 'center', opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE} ${on ? 500 : 0}ms, transform 520ms ${EASE} ${on ? 500 : 0}ms, box-shadow 420ms ${EASE}`, zIndex: 4 }}>
      <Ico3D name={name} size={size} loop={loop} d={d} t={2.4} />
    </span>
  )
}

/** a small padlock tile sitting ON a wire (shut = encrypted, open = plaintext); packets pass behind it */
function Hop({ x, y, shut, size = 26, on = true, lit = false, warm = false, children }: { x: number; y: number; shut: boolean; size?: number; on?: boolean; lit?: boolean; warm?: boolean; children?: ReactNode }) {
  return (
    <Show on={on} style={{ ...box(x - size / 2, y - size / 2, size, size), zIndex: 7 }}>
      <Plinth size={size} lit={lit} warm={warm}><Ico3D name={shut ? 'lock' : 'unlock'} size={Math.round(size * 0.74)} loop={shut ? 'glint' : 'tilt'} t={3} /></Plinth>
      {children}
    </Show>
  )
}

/** a packet carried by a `ride` class: a white tile with a padlock (or another icon) inside; nothing on held frames */
function Packet({ cls, icon = 'lock', size = 20, on = true, open = false }: { cls: string; icon?: Ico3DName; size?: number; on?: boolean; open?: boolean }) {
  const held = useHeld()
  if (held || !on) return null
  return (
    <span aria-hidden style={{ position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, zIndex: 5, pointerEvents: 'none' }}>
      <span className={cls} style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: Math.round(size * 0.3), background: '#FFFFFF', boxShadow: open ? `inset 0 0 0 1.5px ${LINE}, 0 4px 10px -4px rgba(31,64,140,0.55)` : `inset 0 0 0 1.5px ${BLUE}66, 0 4px 10px -4px rgba(31,64,140,0.55)`, opacity: 0 }}>
        <Ico3D name={open ? 'unlock' : icon} size={Math.round(size * 0.76)} loop="none" />
      </span>
    </span>
  )
}

/** a dashed lifeline / guide in a ROOT svg (static) */
const VLine = ({ x, y0, y1 }: { x: number; y0: number; y1: number }) => (
  <svg aria-hidden width={4} height={y1 - y0} style={{ position: 'absolute', left: x - 2, top: y0, overflow: 'visible', zIndex: 0 }}>
    <line x1={2} y1={0} x2={2} y2={y1 - y0} stroke={LINE} strokeWidth={2.4} strokeDasharray="6 6" strokeLinecap="round" />
  </svg>
)

/* ================================================================== slide 16 · B_T08 · the transit map */

/*
 * 546 x 330, centred vertically. Main row y 106: Client (70), the
 * padlock on the link (171), Load Balancer (273, certificate badge on its lower right), Backend (476); tags ABOVE
 * the main row so the plaintext lane can leave the tiles' bottom edges. The plaintext fallback lane (dashed) spans
 * the stage under it: Client bottom -> y 244 -> the open padlock `Plaintext` (171) -> the middle (273) -> x 476 -> up
 * into the Backend. Press 1 the link draws and its padlock shuts; 2 the certificate lights at the load balancer;
 * 3 the lane is cut in the middle: a ban badge at x 273, the near half turns orange, the far half greys out and
 * loses its arrowhead; open packets now stop at the ban.
 */
const TM8 = { W: 546, H: 330, Y: 106, LY: 244, CX: 70, LBX: 273, BX: 476, S: 60, PX: 171, PS: 42, CUT: 273 }
const T8_CR = TM8.CX + TM8.S / 2
const T8_LL = TM8.LBX - TM8.S / 2
const T8_LR = TM8.LBX + TM8.S / 2
const T8_BL = TM8.BX - TM8.S / 2
const T8_BOT = TM8.Y + TM8.S / 2
const T8_P1: Pt[] = [[TM8.CX, T8_BOT], [TM8.CX, TM8.LY], [TM8.PX - TM8.PS / 2, TM8.LY]]
const T8_P2: Pt[] = [[TM8.PX + TM8.PS / 2, TM8.LY], [TM8.CUT, TM8.LY]]
const T8_P3: Pt[] = [[TM8.CUT, TM8.LY], [TM8.BX, TM8.LY], [TM8.BX, T8_BOT]]
const T8_SEAL = [0, 1].map((k) => K.ride(`t08s${k}`, [[T8_CR, TM8.Y], [T8_LL, TM8.Y]], 0.1 + k * 1.2, 1.0 + k * 1.2, 2.4))
const T8_BACK = K.ride('t08b', [[T8_LR, TM8.Y], [T8_BL, TM8.Y]], 1.0, 2.0, 2.4)
const T8_PLAIN = K.ride('t08p', [T8_P1[0], T8_P1[1], [TM8.BX, TM8.LY], T8_P3[2]], 0.2, 2.6, 3.0)
const T8_STOP = K.ride('t08x', [T8_P1[0], T8_P1[1], [TM8.CUT - 22, TM8.LY]], 0.2, 1.6, 2.6)

const B_T08: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const instant = useInstant()
  const hot = useHot(3, step, 1800)
  const s = (n: number) => held || step >= n
  const cut = s(3)
  const fade = (on: boolean, delay = 0): CSSProperties => ({ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE} ${delay}ms` })
  return (
    <Frame w={TM8.W} h={TM8.H}>
      {/* the encrypted link, padlocked */}
      <Wire pts={[[T8_CR, TM8.Y], [T8_LL, TM8.Y]]} on={s(1)} lit={hot === 0} />
      <Show on={s(1)} style={{ position: 'absolute', inset: 0, zIndex: 7, pointerEvents: 'none' }}>
        <Node x={TM8.PX} y={TM8.Y} size={TM8.S} label="Encrypted" up w={100}>
          <Plinth size={TM8.PS} lit={hot === 0}>
            <span style={{ position: 'relative', width: 30, height: 30 }}>
              <span style={fade(!s(1) && !held, 0)}><Ico3D name="unlock" size={30} loop="none" /></span>
              <span style={fade(s(1), 650)}><Ico3D name="lock" size={30} loop="glint" t={3} /></span>
            </span>
          </Plinth>
        </Node>
      </Show>

      {/* load balancer -> backend */}
      <Wire pts={[[T8_LR, TM8.Y], [T8_BL, TM8.Y]]} />

      {/* the plaintext fallback path: dashed, cut at press 3 */}
      <Wire pts={T8_P1} dash="6 7" head={0} color={cut ? ORANGE : BLUE} opacity={cut ? 1 : 0.7} />
      <Wire pts={T8_P2} dash="6 7" head={0} color={cut ? ORANGE : BLUE} opacity={cut ? 1 : 0.7} />
      <Wire pts={T8_P3} dash="6 7" head={cut ? 0 : 10} color={cut ? LINE : BLUE} opacity={cut ? 1 : 0.7} />
      <Badge x={TM8.CUT} y={TM8.LY} name="ban" size={24} on={cut} lit={hot === 2} />
      <Node x={TM8.PX} y={TM8.LY} size={TM8.PS} label="Plaintext" w={100} z={7}>
        <Plinth size={TM8.PS} lit={hot === 2} warm={cut}><Ico3D name="unlock" size={30} loop="tilt" t={3.2} /></Plinth>
      </Node>

      <Node x={TM8.CX} y={TM8.Y} size={TM8.S} label="Client" up w={90}><Tile name="laptop" size={TM8.S} d={0.2} /></Node>
      <Node x={TM8.LBX} y={TM8.Y} size={TM8.S} label="Load Balancer" up w={120}>
        <MarkTile src={elbMark} size={TM8.S} lit={hot === 1} />
        <Corner name="certificate" size={28} on={s(2)} loop="glint" lit={hot === 1} />
      </Node>
      <Node x={TM8.BX} y={TM8.Y} size={TM8.S} label="Backend" up w={90}><Tile name="database" size={TM8.S} d={0.6} /></Node>

      {T8_SEAL.map((c, k) => <Packet key={k} cls={c} on={s(1)} />)}
      <Token cls={T8_BACK} />
      {cut ? <Packet cls={T8_STOP} open /> : <Packet cls={T8_PLAIN} open />}
    </Frame>
  )
}

/* ================================================================== slides 17-18 · B_T09 · the TLS handshake */

/*
 * Client (130) and Server (416) tiles at the top (y 46), dashed lifelines from y 100 down. Each arrow ends with its
 * tip ON the other lifeline; its tag (the TR's message name) sits above it as DOM text. Row 3 is the client's own
 * check: a certificate tile with a tick just right of the client lifeline. Rows 4-6 (slide 18 only): Key Exchange
 * both ways with a Session Key tile appearing outside each lifeline, Finished both ways, then the padlocked
 * Encrypted Data arrow. Slide 17 (330 tall) spaces rows 1-3 wider; slide 18 (380 tall) packs all six.
 */
const SQ = { W: 546, CX: 130, SX: 416, KXL: 62, KXR: 484, KS: 34, CS: 32 }
const SQ_MID = (SQ.CX + SQ.SX) / 2
type SqRows = { H: number; TY: number; TS: number; LY0: number; r1: number; r2: number; r3: number; r4: [number, number]; r5: [number, number]; r6: number; ky: number }
const SQ_A: SqRows = { H: 330, TY: 46, TS: 52, LY0: 100, r1: 140, r2: 200, r3: 258, r4: [0, 0], r5: [0, 0], r6: 0, ky: 0 }
const SQ_B: SqRows = { H: 380, TY: 43, TS: 46, LY0: 92, r1: 118, r2: 158, r3: 195, r4: [236, 246], r5: [284, 294], r6: 334, ky: 241 }
const fwd = (y: number): Pt[] => [[SQ.CX + 2, y], [SQ.SX - 1, y]]
const back = (y: number): Pt[] => [[SQ.SX - 2, y], [SQ.CX + 1, y]]
function sqRides(n: string, R: SqRows, period: number) {
  return {
    r1: K.ride(`${n}1`, fwd(R.r1), 0, 0.7, period),
    r2: K.ride(`${n}2`, back(R.r2), 0.8, 1.5, period),
    r4a: K.ride(`${n}4a`, fwd(R.r4[0]), 1.6, 2.2, period),
    r4b: K.ride(`${n}4b`, back(R.r4[1]), 1.6, 2.2, period),
    r5a: K.ride(`${n}5a`, fwd(R.r5[0]), 2.3, 2.9, period),
    r5b: K.ride(`${n}5b`, back(R.r5[1]), 2.3, 2.9, period),
    r6a: K.ride(`${n}6a`, fwd(R.r6), 3.0, 3.8, period),
    r6b: K.ride(`${n}6b`, fwd(R.r6), 3.7, 4.5, period),
    r6c: K.ride(`${n}6c`, fwd(R.r6), 4.4, 5.2, period),
  }
}
const SQ_RA = sqRides('t09a', SQ_A, 2.8)
const SQ_RB = sqRides('t09b', SQ_B, 5.4)

/** an arrow tag above a message line, centred between the lifelines (the TR's message name) */
function MsgTag({ y, text, on, lit, icon }: { y: number; text: string; on: boolean; lit: boolean; icon?: Ico3DName }) {
  const instant = useInstant()
  return (
    <Show on={on} delay={300} style={{ ...box(SQ_MID - 90, y - 24, 180, 18), zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
      <span style={{ ...tag(13, lit ? ORANGE : colors.brandDeep), transition: instant ? 'none' : `color 420ms ${EASE}` }}>{text}</span>
      {icon && <Ico3D name={icon} size={18} loop="pulse" t={2.4} />}
    </Show>
  )
}

const B_T09: Fig = (p) => {
  const off = Number(p.from ?? 0)
  const cnt = Number(p.steps ?? 3)
  const held = useHeld()
  const step = held ? off + cnt : stepOf(p) + off
  const local = useHot(cnt, stepOf(p), 1900)
  const hot = local < 0 ? -1 : local + off
  const s = (n: number) => step >= n
  const full = off + cnt > 3
  const R = full ? SQ_B : SQ_A
  const RD = full ? SQ_RB : SQ_RA
  const lifeEnd = R.H - 20
  return (
    <Frame w={SQ.W} h={R.H}>
      <VLine x={SQ.CX} y0={R.LY0} y1={lifeEnd} />
      <VLine x={SQ.SX} y0={R.LY0} y1={lifeEnd} />
      <Node x={SQ.CX} y={R.TY} size={R.TS} label="Client" w={90}><Tile name="laptop" size={R.TS} d={0.2} /></Node>
      <Node x={SQ.SX} y={R.TY} size={R.TS} label="Server" w={90}><Tile name="server" size={R.TS} d={0.7} /></Node>

      {/* 1 Client Hello, 2 Server Hello with the certificate */}
      <Wire pts={fwd(R.r1)} on={s(1)} lit={hot === 0} />
      <MsgTag y={R.r1} text="Client Hello" on={s(1)} lit={hot === 0} />
      <Wire pts={back(R.r2)} on={s(2)} lit={hot === 1} />
      <MsgTag y={R.r2} text="Server Hello" on={s(2)} lit={hot === 1} icon="certificate" />

      {/* 3 the client checks the chain and the name */}
      <Show on={s(3)} style={{ ...box(SQ.CX + 14, R.r3 - SQ.CS / 2, 220, SQ.CS), zIndex: 3, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ position: 'relative', display: 'grid' }}>
          <Tile name="certificate" size={SQ.CS} k={0.78} loop="glint" lit={hot === 2} />
          <Corner name="check" size={16} loop="beat" lit={hot === 2} />
        </span>
        <span style={{ ...tag(13, hot === 2 ? ORANGE : colors.brandDeep) }}>Certificate Chain</span>
      </Show>

      {full && (
        <>
          {/* 4 Key Exchange both ways, then one session key on each side */}
          <Wire pts={fwd(R.r4[0])} on={s(4)} lit={hot === 3} />
          <Wire pts={back(R.r4[1])} on={s(4)} lit={hot === 3} delay={250} />
          <MsgTag y={R.r4[0]} text="Key Exchange" on={s(4)} lit={hot === 3} />
          {[SQ.KXL, SQ.KXR].map((x, k) => (
            <Node key={k} x={x} y={R.ky} size={SQ.KS} label="Session Key" w={96} tagSize={12.5} on={s(4)} delay={700}>
              <Tile name="key" size={SQ.KS} k={0.76} loop="tilt" d={k * 0.5} lit={hot === 3} />
            </Node>
          ))}

          {/* 5 Finished both ways, then the padlocked Encrypted Data */}
          <Wire pts={fwd(R.r5[0])} on={s(5)} lit={hot === 4} />
          <Wire pts={back(R.r5[1])} on={s(5)} lit={hot === 4} delay={250} />
          <MsgTag y={R.r5[0]} text="Finished" on={s(5)} lit={hot === 4} />
          <Wire pts={fwd(R.r6)} on={s(5)} lit={hot === 4} width={3.4} delay={700} />
          <MsgTag y={R.r6} text="Encrypted Data" on={s(5)} lit={hot === 4} icon="lock" />
        </>
      )}

      <Token cls={RD.r1} on={s(1)} size={9} />
      <Packet cls={RD.r2} icon="certificate" on={s(2)} size={20} />
      {full && (
        <>
          <Packet cls={RD.r4a} icon="key" on={s(4)} size={18} />
          <Packet cls={RD.r4b} icon="key" on={s(4)} size={18} />
          <Token cls={RD.r5a} on={s(5)} size={9} />
          <Token cls={RD.r5b} on={s(5)} size={9} />
          {[RD.r6a, RD.r6b, RD.r6c].map((c, k) => <Packet key={k} cls={c} on={s(5)} size={20} />)}
        </>
      )}
    </Frame>
  )
}

/* ================================================================== slide 19 · B_T10 · where encryption ends */

/*
 * 546 x 330. Column tags at the top (y 20): Client (200), Load Balancer (336), Backend (470). Three lane cards below,
 * x 20..526, 80 tall, 10 apart (y 50, 140, 230): the lane name at x 40, then Client -> Load Balancer -> Backend, a
 * padlock tile ON each hop (shut / open as the TR says) and, where the load balancer opens the traffic, an open
 * padlock badge on its corner. Termination's backend has a CPU meter beside it (x 500) that drops at press 4.
 */
const TL10 = { W: 546, H: 330, LX0: 20, LW: 506, LY: [46, 136, 226], LH: 82, TX: 40, CX: 198, LBX: 334, BX: 462, S: 42, MX: 500 }
const T10_H1 = (TL10.CX + TL10.S / 2 + TL10.LBX - TL10.S / 2) / 2
const T10_H2 = (TL10.LBX + TL10.S / 2 + TL10.BX - TL10.S / 2) / 2
const T10_LANES: { name: string; hop: [boolean, boolean]; opens: boolean }[] = [
  { name: 'Termination', hop: [true, false], opens: true },
  { name: 'Passthrough', hop: [true, true], opens: false },
  { name: 'Re-encryption', hop: [true, true], opens: true },
]
const T10_MID = TL10.LY.map((y) => y + TL10.LH / 2)
const T10_RIDE = T10_MID.map((y, k) => ({
  a: K.ride(`t10a${k}`, [[TL10.CX + TL10.S / 2, y], [TL10.LBX - TL10.S / 2, y]], 0.1 + k * 0.25, 1.1 + k * 0.25, 3.2),
  b: K.ride(`t10b${k}`, [[TL10.LBX + TL10.S / 2, y], [TL10.BX - TL10.S / 2, y]], 1.5 + k * 0.25, 2.5 + k * 0.25, 3.2),
}))

/** a CPU meter: a mini chip over a bar whose fill sits high, then drops when the work is offloaded */
function CpuMeter({ x, y, low, lit }: { x: number; y: number; low: boolean; lit: boolean }) {
  const instant = useInstant()
  return (
    <div style={{ ...box(x - 9, y - 21, 18, 42), zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <Ico3D name="cpu" size={16} loop="pulse" t={2} />
      <span style={{ position: 'relative', width: 11, height: 24, borderRadius: 5, background: '#E3EAF8', boxShadow: lit ? `0 0 0 2px ${ORANGE}` : 'inset 0 0 0 1px #D3DEF6', overflow: 'hidden', transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
        <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '100%', borderRadius: 5, background: `linear-gradient(180deg, #5A86FF 0%, ${BLUE} 100%)`, transformOrigin: '50% 100%', transform: `scaleY(${low ? 0.28 : 0.9})`, transition: instant ? 'none' : `transform 900ms ${EASE} 300ms` }} />
      </span>
    </div>
  )
}

const B_T10: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const hot = useHot(4, step, 1700)
  const s = (n: number) => held || step >= n
  return (
    <Frame w={TL10.W} h={TL10.H}>
      {(
        [
          ['Client', TL10.CX],
          ['Load Balancer', TL10.LBX],
          ['Backend', TL10.BX],
        ] as const
      ).map(([t, x]) => (
        <span key={t} style={{ ...box(x - 60, 20, 120, 17), ...tag(13.5), zIndex: 3 }}>{t}</span>
      ))}
      {T10_LANES.map((ln, k) => {
        const y = T10_MID[k]
        const lit = hot === k
        const bLit = hot === 3 && k === 0
        return (
          <div key={ln.name}>
            <Panel x={TL10.LX0} y={TL10.LY[k]} w={TL10.LW} h={TL10.LH} lit={lit} radius={16} />
            <span style={{ ...box(TL10.TX, y - 10, 120, 20), ...heading(15, lit ? ORANGE : colors.ink), zIndex: 3, transition: 'color 420ms' }}>{ln.name}</span>
            <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
              <Wire pts={[[TL10.CX + TL10.S / 2, y], [TL10.LBX - TL10.S / 2, y]]} lit={lit} head={8} />
              <Wire pts={[[TL10.LBX + TL10.S / 2, y], [TL10.BX - TL10.S / 2, y]]} lit={lit} head={8} dash={ln.hop[1] ? undefined : '5 6'} />
            </div>
            <Hop x={T10_H1} y={y} shut={ln.hop[0]} lit={lit} />
            <Hop x={T10_H2} y={y} shut={ln.hop[1]} lit={lit} />
            <div style={{ ...box(TL10.CX - TL10.S / 2, y - TL10.S / 2, TL10.S, TL10.S), zIndex: 3 }}><Tile name="laptop" size={TL10.S} k={0.74} d={k * 0.3} /></div>
            <div style={{ ...box(TL10.LBX - TL10.S / 2, y - TL10.S / 2, TL10.S, TL10.S), zIndex: 3 }}>
              <MarkTile src={elbMark} size={TL10.S} lit={lit} />
              {ln.opens && <Corner name="unlock" size={16} top loop="tilt" d={k * 0.4} />}
            </div>
            <div style={{ ...box(TL10.BX - TL10.S / 2, y - TL10.S / 2, TL10.S, TL10.S), zIndex: 3 }}><Tile name="server" size={TL10.S} k={0.74} d={0.5 + k * 0.3} lit={bLit} /></div>
            {k === 0 && <CpuMeter x={TL10.MX} y={y} low={s(4)} lit={bLit} />}
            <Packet cls={T10_RIDE[k].a} on={s(k + 1)} size={18} />
            <Packet cls={T10_RIDE[k].b} on={s(k + 1)} size={18} open={!ln.hop[1]} />
          </div>
        )
      })}
    </Frame>
  )
}

/* ================================================================== slide 21 · B_T11 · root to leaf */

/*
 * 546 x 330. The chain at x 196, tags on its LEFT: Root CA (y 50, crown badge), Intermediate CA (150), Leaf
 * Certificate (250, the ACM mark on its corner); a tick stamp beside each signing link (x 222). Public path: the
 * Browser (466, 50) trusts the root. Private path: the Internal Service (466, 150) trusts the Private CA (350, 150).
 * Bottom row: the auto-renew clock (300, 250) renews the leaf; the Imported certificate (440, 250) waits for a person.
 */
const TC = { W: 546, H: 330, X: 196, S: 52, Y: [50, 150, 250], RX: 466, PX: 350, KX: 300, KS: 42, IX: 440 }
const TC_LINKS: Pt[][] = [0, 1].map((k) => [[TC.X, TC.Y[k] + TC.S / 2], [TC.X, TC.Y[k + 1] - TC.S / 2]])
const TC_SIGN = TC_LINKS.map((pts, k) => K.ride(`t11s${k}`, pts, 0.1 + k * 0.9, 0.8 + k * 0.9, 2.6))
const TC_PUB = K.ride('t11pu', [[TC.RX - TC.S / 2, TC.Y[0]], [TC.X + TC.S / 2, TC.Y[0]]], 0.2, 1.4, 2.6)
const TC_PRI = K.ride('t11pr', [[TC.RX - TC.S / 2, TC.Y[1]], [TC.PX + TC.S / 2, TC.Y[1]]], 0.6, 1.3, 2.6)
const TC_REN = K.ride('t11rn', [[TC.KX - TC.KS / 2, TC.Y[2]], [TC.X + TC.S / 2, TC.Y[2]]], 1.0, 1.7, 2.6)

function LeftNode({ x, y, size, label, children, lit }: { x: number; y: number; size: number; label: string; children: ReactNode; lit?: boolean }) {
  const instant = useInstant()
  return (
    <>
      <span style={{ ...box(x - size / 2 - 150, y - 9, 136, 18), ...tag(13.5, lit ? ORANGE : colors.brandDeep), textAlign: 'right', zIndex: 3, transition: instant ? 'none' : `color 420ms ${EASE}` }}>{label}</span>
      <div style={{ ...box(x - size / 2, y - size / 2, size, size), zIndex: 3 }}>{children}</div>
    </>
  )
}

const B_T11: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const hot = useHot(4, step, 1800)
  const s = (n: number) => held || step >= n
  return (
    <Frame w={TC.W} h={TC.H}>
      {/* the chain: each CA signs the next */}
      {TC_LINKS.map((pts, k) => <Wire key={k} pts={pts} on={s(1)} lit={hot === 0} delay={k * 450} />)}
      {TC_LINKS.map((pts, k) => <Badge key={k} x={TC.X + 26} y={(pts[0][1] + pts[1][1]) / 2} name="check" size={18} on={s(1)} lit={hot === 0} d={k * 0.6} />)}
      <LeftNode x={TC.X} y={TC.Y[0]} size={TC.S} label="Root CA" lit={hot === 0 || hot === 1}>
        <MarkTile src={acmCaMark} size={TC.S} lit={hot === 0 || hot === 1} />
        <Corner name="crown" size={20} loop="float" />
      </LeftNode>
      <LeftNode x={TC.X} y={TC.Y[1]} size={TC.S} label="Intermediate CA" lit={hot === 0}>
        <MarkTile src={acmCaMark} size={TC.S} lit={hot === 0} />
      </LeftNode>
      <LeftNode x={TC.X} y={TC.Y[2]} size={TC.S} label="Leaf Certificate" lit={hot === 0 || hot === 3}>
        <Tile name="certificate" size={TC.S} loop="glint" t={3.2} lit={hot === 0 || hot === 3} />
        <Corner src={acmMark} size={20} />
      </LeftNode>

      {/* public path: the browser trusts the root */}
      <Wire pts={[[TC.RX - TC.S / 2, TC.Y[0]], [TC.X + TC.S / 2, TC.Y[0]]]} on={s(2)} lit={hot === 1} />
      <Node x={TC.RX} y={TC.Y[0]} size={TC.S} label="Browser" w={100} on={s(2)}>
        <Tile name="globe" size={TC.S} loop="float" lit={hot === 1} />
        <Corner name="check" size={18} loop="beat" on={s(2)} lit={hot === 1} />
      </Node>

      {/* private path: the internal service trusts the Private CA */}
      <Wire pts={[[TC.RX - TC.S / 2, TC.Y[1]], [TC.PX + TC.S / 2, TC.Y[1]]]} on={s(3)} lit={hot === 2} />
      <Node x={TC.PX} y={TC.Y[1]} size={TC.S} label="Private CA" w={100} on={s(3)}><MarkTile src={pcaMark} size={TC.S} lit={hot === 2} /></Node>
      <Node x={TC.RX} y={TC.Y[1]} size={TC.S} label="Internal Service" w={120} on={s(3)}>
        <Tile name="server" size={TC.S} d={0.4} lit={hot === 2} />
        <Corner name="check" size={18} loop="beat" on={s(3)} lit={hot === 2} />
      </Node>

      {/* renewal: ACM's clock renews its leaf; the imported certificate waits for a person */}
      <Wire pts={[[TC.KX - TC.KS / 2, TC.Y[2]], [TC.X + TC.S / 2, TC.Y[2]]]} on={s(4)} lit={hot === 3} />
      <Node x={TC.KX} y={TC.Y[2]} size={TC.S} label="Auto-Renew" w={100}>
        <Tile name="clock" size={TC.KS} k={0.74} loop="pulse" lit={hot === 3} />
        <Corner name="refresh" size={18} on={s(4)} loop={held ? 'none' : 'spin'} t={2.6} lit={hot === 3} />
      </Node>
      <Node x={TC.IX} y={TC.Y[2]} size={TC.S} label="Imported" w={100} on={s(4)}>
        <Tile name="certificate" size={TC.S} loop="bob" d={0.8} lit={hot === 3} />
        <Corner name="user" size={20} loop="bob" on={s(4)} />
      </Node>

      {TC_SIGN.map((c, k) => <Token key={k} cls={c} on={s(1)} size={9} />)}
      <Token cls={TC_PUB} on={s(2)} size={9} />
      <Token cls={TC_PRI} on={s(3)} size={9} />
      <Packet cls={TC_REN} icon="certificate" on={s(4)} size={20} />
    </Frame>
  )
}

/* ================================================================== slide 22 · B_T12 · ACM to the endpoints */

/*
 * 546 x 330. The drawn ACM console (x 20..226, y 70..238): title bar with the Certificate Manager mark, a search
 * row, header bars, and the certificate row (domain BLURRED, status Issued). Its right edge fans at a junction
 * (x 258) to Load Balancer (316, 56), CloudFront (316, 154), API Gateway (316, 252). The load balancer feeds its
 * listener card HTTPS 443 (x 372..526, y 32..80). The Client (480, 252) sends requests up into the listener and left
 * into API Gateway: open (plain HTTP) packets bounce back from the listener (redirect) and stop at API Gateway.
 */
const AC = { W: 546, H: 330, CX0: 20, CY0: 70, CW: 206, CH: 168, J: 258, MX: 316, MS: 52, MY: [56, 154, 252], LX0: 372, LY0: 32, LW: 154, LH: 48, KX: 480, KY: 252 }
const AC_CR = AC.CX0 + AC.CW
const AC_CMID = AC.CY0 + AC.CH / 2
const AC_ML = AC.MX - AC.MS / 2
const AC_MR = AC.MX + AC.MS / 2
const AC_FAN: Pt[][] = AC.MY.map((y) => (y === AC_CMID ? [[AC.J, y], [AC_ML, y]] : [[AC.J, AC_CMID], [AC.J, y], [AC_ML, y]]))
const AC_CERT = AC.MY.map((y, k) => K.ride(`t12c${k}`, [[AC_CR, AC_CMID], [AC.J, AC_CMID], ...(y === AC_CMID ? [] : ([[AC.J, y]] as Pt[])), [AC_ML, y]], 0.1, 1.0, 3.6))
const AC_LB = K.ride('t12l', [[AC_MR, AC.MY[0]], [AC.LX0, AC.MY[0]]], 1.1, 1.6, 3.6)
const AC_UP_OK = K.ride('t12u', [[AC.KX, AC.KY - AC.MS / 2], [AC.KX, AC.LY0 + AC.LH]], 0.2, 1.2, 3.2)
const AC_UP_BOUNCE = K.ride('t12ub', [[AC.KX, AC.KY - AC.MS / 2], [AC.KX, AC.LY0 + AC.LH + 14], [AC.KX, AC.KY - AC.MS / 2 - 10]], 1.6, 3.0, 3.2)
const AC_GW_OK = K.ride('t12g', [[AC.KX - AC.MS / 2, AC.KY], [AC_MR, AC.KY]], 1.0, 2.0, 3.2)
const AC_GW_STOP = K.ride('t12gs', [[AC.KX - AC.MS / 2, AC.KY], [AC_MR + 34, AC.KY]], 2.2, 2.9, 3.2)

const grey = (w: number | string, h = 8, c = '#DCE3EE') => <span style={{ display: 'block', width: w, height: h, borderRadius: 4, background: c }} />

function AcmConsole({ issued, lit }: { issued: boolean; lit: boolean }) {
  const instant = useInstant()
  return (
    <div style={{ ...box(AC.CX0, AC.CY0, AC.CW, AC.CH), zIndex: 3, borderRadius: 14, overflow: 'hidden', background: '#FFFFFF', boxShadow: 'inset 0 0 0 1.5px #D3DEF6, 0 14px 26px -16px rgba(31,64,140,0.55)' }}>
      <div style={{ height: 38, background: `linear-gradient(180deg, ${colors.brandDeep} 0%, #0B3566 100%)`, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px' }}>
        <span style={{ width: 24, height: 24, borderRadius: 6, background: '#FFFFFF', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <img src={acmMark} alt="" aria-hidden draggable={false} style={{ width: 19, height: 19, display: 'block' }} />
        </span>
        <span style={{ ...tag(13, '#FFFFFF') }}>Certificate Manager</span>
      </div>
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ height: 22, borderRadius: 6, boxShadow: 'inset 0 0 0 1px #C6CED9', display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px' }}>
          <Ico3D name="search" size={13} loop="none" />
          {grey(70, 6)}
        </div>
        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '26px 1fr 64px', columnGap: 8, alignItems: 'center' }}>
          <span />
          {grey('70%', 7, '#C9D3E3')}
          {grey('80%', 7, '#C9D3E3')}
        </div>
        <div style={{ marginTop: 10, paddingTop: 10, boxShadow: 'inset 0 1px 0 #E9EDF2', display: 'grid', gridTemplateColumns: '26px 1fr 64px', columnGap: 8, alignItems: 'center' }}>
          <Ico3D name="certificate" size={26} loop="glint" t={3.4} />
          {/* the domain name: the TR gives none, so it is blurred (rule 53, user 2026-11-18) */}
          <span style={{ display: 'block', width: '86%', height: 10, borderRadius: 5, background: '#8FA6C8', filter: 'blur(2.5px)' }} />
          <span style={{ position: 'relative', height: 24, display: 'grid', alignItems: 'center' }}>
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 4, opacity: issued ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE} 200ms` }}>
              <Ico3D name="check" size={16} loop="beat" />
              <span style={{ ...tag(13, colors.ink) }}>Issued</span>
            </span>
            <span style={{ position: 'absolute', left: 0, top: 8, opacity: issued ? 0 : 1, transition: instant ? 'none' : `opacity 300ms ${EASE}` }}>{grey(54, 8)}</span>
            {/* the TR's value is the only thing ringed */}
            <span aria-hidden style={{ position: 'absolute', left: -5, top: -1, width: 70, height: 26, borderRadius: 8, boxShadow: `0 0 0 2.5px ${ORANGE}`, opacity: lit ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE}` }} />
          </span>
        </div>
        <div style={{ marginTop: 10, paddingTop: 10, boxShadow: 'inset 0 1px 0 #E9EDF2', display: 'grid', gridTemplateColumns: '26px 1fr 64px', columnGap: 8, alignItems: 'center' }}>
          <span />
          {grey('60%', 7)}
          {grey('70%', 7)}
        </div>
      </div>
    </div>
  )
}

function Listener({ lit, redirect }: { lit: boolean; redirect: boolean }) {
  const instant = useInstant()
  return (
    <div style={{ ...box(AC.LX0, AC.LY0, AC.LW, AC.LH), zIndex: 3, borderRadius: 12, background: 'linear-gradient(180deg, #FFFFFF 0%, #EEF3FF 100%)', boxShadow: lit ? `inset 0 0 0 2.5px ${ORANGE}, 0 10px 22px -12px rgba(255,138,61,0.7)` : 'inset 0 0 0 1.5px #D3DEF6, 0 10px 20px -12px rgba(31,64,140,0.5)', transition: instant ? 'none' : `box-shadow 420ms ${EASE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <Ico3D name="lock" size={24} loop="glint" t={3} />
      <code style={{ fontFamily: MONO, fontVariantLigatures: 'none', fontSize: 15, fontWeight: 600, color: colors.brandDeep }}>HTTPS 443</code>
      <span style={{ position: 'absolute', left: 44, bottom: -8, width: 24, height: 24 }}>
        <Corner name="refresh" size={18} left on={redirect} loop={redirect ? 'spin' : 'none'} t={2.4} lit={lit} />
      </span>
    </div>
  )
}

const B_T12: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const hot = useHot(3, step, 1800)
  const s = (n: number) => held || step >= n
  const marks = [
    { src: elbMark, label: 'Load Balancer' },
    { src: cfMark, label: 'CloudFront' },
    { src: apigwMark, label: 'API Gateway' },
  ]
  return (
    <Frame w={AC.W} h={AC.H}>
      <AcmConsole issued={s(1)} lit={hot === 0} />

      {/* the certificate fans out to the three services */}
      <Wire pts={[[AC_CR, AC_CMID], [AC.J, AC_CMID]]} head={0} on={s(1)} lit={hot === 0} />
      {AC_FAN.map((pts, k) => <Wire key={k} pts={pts} on={s(1)} lit={hot === 0} delay={250} />)}
      <Junction x={AC.J} y={AC_CMID} on={s(1)} lit={hot === 0} />
      {marks.map((m, k) => (
        <Node key={m.label} x={AC.MX} y={AC.MY[k]} size={AC.MS} label={m.label} w={120}>
          <MarkTile src={m.src} size={AC.MS} lit={hot === 0 || (hot === 1 && k === 0) || (hot === 2 && k === 2)} />
          {k === 2 && <Corner name="ban" size={18} on={s(3)} loop="beat" lit={hot === 2} />}
        </Node>
      ))}

      {/* the load balancer's listener */}
      <Wire pts={[[AC_MR, AC.MY[0]], [AC.LX0, AC.MY[0]]]} lit={hot === 1} />
      <Listener lit={hot === 1} redirect={s(2)} />

      {/* the client's requests */}
      <Wire pts={[[AC.KX, AC.KY - AC.MS / 2], [AC.KX, AC.LY0 + AC.LH]]} on={s(2)} lit={hot === 1} />
      <Wire pts={[[AC.KX - AC.MS / 2, AC.KY], [AC_MR, AC.KY]]} on={s(3)} lit={hot === 2} />
      <Node x={AC.KX} y={AC.KY} size={AC.MS} label="Client" w={90}><Tile name="laptop" size={AC.MS} d={0.3} /></Node>

      {AC_CERT.map((c, k) => <Packet key={k} cls={c} icon="certificate" on={s(1)} size={20} />)}
      <Token cls={AC_LB} on={s(1)} size={9} />
      <Packet cls={AC_UP_OK} on={s(2)} />
      <Packet cls={AC_UP_BOUNCE} open on={s(2)} />
      <Packet cls={AC_GW_OK} on={s(3)} />
      <Packet cls={AC_GW_STOP} open on={s(3)} />
    </Frame>
  )
}

/* ================================================================== slide 23 · B_T12B · deny plaintext, block old versions */

/*
 * 566 x 380. Row 1 (y 118): Client (60) -> the bucket policy document (x 128..408, y 44..192) -> S3 Bucket (506).
 * The policy shows the TR's condition `"aws:SecureTransport": "false"` and, under it, `Deny` in orange. Sealed packets
 * pass on to the bucket; an open (plaintext) packet hits the document and the Deny line flashes.
 * Row 2 (y 290): Client (60) -> the Minimum TLS Version gate (300) -> Endpoint (506). A request tagged Outdated stops
 * in front of the gate (ban); a sealed one passes. No version numbers anywhere: the TR gives none.
 */
const SP = { W: 566, H: 380, Y1: 118, Y2: 290, CX: 60, S: 52, DX0: 128, DY0: 44, DW: 280, DH: 148, BX: 506, GX: 300, EX: 506, PW: 94, PH: 26 }
const SP_CR = SP.CX + SP.S / 2
const SP_DR = SP.DX0 + SP.DW
const SP_OK1 = K.ride('t12bo1', [[SP_CR, SP.Y1], [SP.DX0, SP.Y1]], 0.1, 0.6, 3.2)
const SP_OK2 = K.ride('t12bo2', [[SP_DR, SP.Y1], [SP.BX - SP.S / 2, SP.Y1]], 0.75, 1.35, 3.2)
const SP_PLAIN = K.ride('t12bp', [[SP_CR, SP.Y1], [SP.DX0 - 6, SP.Y1]], 1.7, 2.2, 3.2)
const SP_HIT = 2.2 / 3.2
const SP_OLD = K.ride('t12bd', [[SP_CR + SP.PW / 2 + 4, SP.Y2], [SP.GX - SP.S / 2 - SP.PW / 2 - 6, SP.Y2]], 0.1, 1.0, 3.4)
const SP_NEW1 = K.ride('t12bn1', [[SP_CR, SP.Y2], [SP.GX - SP.S / 2, SP.Y2]], 1.5, 2.2, 3.4)
const SP_NEW2 = K.ride('t12bn2', [[SP.GX + SP.S / 2, SP.Y2], [SP.EX - SP.S / 2, SP.Y2]], 2.3, 3.0, 3.4)

/** the request tagged Outdated, as a riding pill (or parked, on held frames) */
function OldPill({ cls, parked }: { cls?: string; parked?: boolean }) {
  const pill = (
    <span className={cls} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, width: SP.PW, height: SP.PH, borderRadius: 9, background: '#FFFFFF', boxShadow: `inset 0 0 0 1.5px ${LINE}, 0 4px 10px -4px rgba(31,64,140,0.55)`, opacity: parked ? 1 : 0 }}>
      <Ico3D name="hourglass" size={16} loop="none" />
      <span style={tag(12.5)}>Outdated</span>
    </span>
  )
  if (parked) return <span style={{ ...box(SP.GX - SP.S / 2 - SP.PW - 10, SP.Y2 - SP.PH / 2, SP.PW, SP.PH), zIndex: 5 }}>{pill}</span>
  return <span aria-hidden style={{ position: 'absolute', left: -SP.PW / 2, top: -SP.PH / 2, width: SP.PW, height: SP.PH, zIndex: 5, pointerEvents: 'none' }}>{pill}</span>
}

function PolicyDoc({ lit, hit }: { lit: boolean; hit: boolean }) {
  const code: CSSProperties = { fontFamily: MONO, fontVariantLigatures: 'none', fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }
  return (
    <Panel x={SP.DX0} y={SP.DY0} w={SP.DW} h={SP.DH} lit={lit} radius={14} style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 11, zIndex: 3 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Ico3D name="policy" size={24} loop="bob" t={3} />
        <span style={heading(14)}>Bucket Policy</span>
      </div>
      {grey('46%', 7)}
      <code style={{ ...code, color: colors.brandDeep }}>"aws:SecureTransport": "false"</code>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content' }}>
        <Ico3D name="ban" size={18} loop="beat" t={2.4} />
        <code style={{ ...code, fontSize: 14, color: ORANGE }}>Deny</code>
        {hit && <span aria-hidden className="t15b-l t15b-hit" style={{ position: 'absolute', inset: '-4px -8px', borderRadius: 8, boxShadow: `0 0 0 2.5px ${ORANGE}, 0 0 12px 1px ${ORANGE}88`, opacity: 0 }} />}
      </div>
      {grey('34%', 7)}
    </Panel>
  )
}

const B_T12B: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const hot = useHot(2, step, 2200)
  const s = (n: number) => held || step >= n
  return (
    <Frame w={SP.W} h={SP.H}>
      {/* row 1: the bucket policy denies plaintext */}
      <Wire pts={[[SP_CR, SP.Y1], [SP.DX0, SP.Y1]]} lit={hot === 0} />
      <Wire pts={[[SP_DR, SP.Y1], [SP.BX - SP.S / 2, SP.Y1]]} lit={hot === 0} />
      <Node x={SP.CX} y={SP.Y1} size={SP.S} label="Client" w={90}><Tile name="laptop" size={SP.S} d={0.2} /></Node>
      <PolicyDoc lit={hot === 0} hit={s(1) && !held} />
      <Node x={SP.BX} y={SP.Y1} size={SP.S} label="S3 Bucket" w={100}><MarkTile src={bucketMark} size={SP.S} /></Node>
      <Packet cls={SP_OK1} on={s(1)} />
      <Packet cls={SP_OK2} on={s(1)} />
      <Packet cls={SP_PLAIN} open on={s(1)} />

      {/* row 2: the minimum TLS version gate in front of an endpoint */}
      <Wire pts={[[SP_CR, SP.Y2], [SP.GX - SP.S / 2, SP.Y2]]} lit={hot === 1} />
      <Wire pts={[[SP.GX + SP.S / 2, SP.Y2], [SP.EX - SP.S / 2, SP.Y2]]} lit={hot === 1} dash="6 6" opacity={0.4} />
      <span aria-hidden style={{ ...box((SP.GX + SP.EX) / 2 - 13, SP.Y2 - 13, 26, 26), zIndex: 4, display: 'grid', placeItems: 'center' }}><Ico3D name="cross" size={24} loop="none" /></span>
      <Node x={SP.CX} y={SP.Y2} size={SP.S} label="Client" w={90}><Tile name="laptop" size={SP.S} d={0.6} /></Node>
      <Node x={SP.GX} y={SP.Y2} size={SP.S} label="Minimum TLS Version" w={170}>
        <Tile name="gate" size={SP.S} loop="pulse" lit={hot === 1} />
        <Corner name="ban" size={18} on={s(2)} loop="beat" lit={hot === 1} />
      </Node>
      <Node x={SP.EX} y={SP.Y2} size={SP.S} label="Endpoint" w={100}><Tile name="server" size={SP.S} d={0.4} /></Node>
      {held ? <OldPill parked /> : s(2) && <OldPill cls={SP_OLD} />}
      <Packet cls={SP_NEW1} on={s(2)} />
    </Frame>
  )
}

export const figures: Record<string, Fig> = { B_T08, B_T09, B_T10, B_T11, B_T12, B_T12B }

const pc = (v: number) => `${(v * 100).toFixed(2)}%`
export const css = `
.t15b-l { animation-delay: var(--t15b-d, 0s); }
@keyframes t15b-hit { 0%, ${pc(SP_HIT - 0.02)} { opacity: 0 } ${pc(SP_HIT + 0.02)} { opacity: 1 } ${pc(SP_HIT + 0.2)}, 100% { opacity: 0 } }
.t15b-hit { animation: t15b-hit 3.2s linear infinite; }
${K.css()}
.cc-still .t15b-l, .deck-thumb .t15b-l { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .t15b-l { animation: none !important; } }
`
