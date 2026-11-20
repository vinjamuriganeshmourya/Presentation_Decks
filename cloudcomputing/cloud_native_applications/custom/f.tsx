import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, Frame, Show, Plinth, Panel, Token, keyframes, loopCls, loopVars, tag, heading, useHeld, type Pt } from '@/engine/figkit'
import { BLUE, MONO, NOLIG, RIM, LIT, I, box, useBuild, Node, Corner, W, XMark, type Fig } from './e'
import elbMark from '../images/aws-elastic-load-balancing.svg'

/*
 * SESSION 18 · SECTION 5 (Scalability & Resilience Patterns) technical figures T22-T25, builder E (file f). Shares the
 * pieces exported by e.tsx (Node, Corner, Wire layer, XMark, useBuild). Same standard: 3D icons on plinth tiles, >= 20 px
 * equal padding, orthogonal wires from the same constants as the boxes, a flow dot on every wire, a lit item walking
 * after the build; loops are transform / opacity on HTML elements only; held (?still) = the full end state, nothing lit.
 * Class prefix `s18f-`.
 *
 *   slide 48 F_T22  546 x 340  timeline: request, timeout boundary, failed attempts, growing backoff gaps, jitter;
 *                              idempotency key (charged once vs twice); the AWS SDK applying the backoff (4)
 *   slide 49 F_T23  586 x 360  Caller -> Closed / Open / Half-Open state cards, a breaker switch in each, orthogonal transitions;
 *                              the caller's threads and connections kept free (4)
 *   slide 51 F_T24  586 x 360  full product page beside the degraded page (Recommendations off); Cached Data, Circuit Breaker (4)
 *   slide 52 F_T25  586 x 264  Client -> Load Balancer -> Checkout; timeline Call, Timeout, Retry, Breaker Open, Fallback (3)
 *   slide 53 F_T25  586 x 400, from 3: failure count rising, the breaker's 30-second block, the fallback screen with the cart (3)
 */

const K = keyframes('s18f')
const cardStyle = (lit: boolean, instant: boolean, extra?: CSSProperties): CSSProperties => ({ borderRadius: 14, background: '#FFFFFF', boxShadow: lit ? LIT : RIM, transition: instant ? 'none' : `box-shadow 420ms ${EASE}`, ...extra })
/** the card's rim drawn OVER its contents (an inset shadow is painted under children such as a browser bar) */
const Rim = ({ lit, instant }: { lit: boolean; instant: boolean }) => <span aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: 14, zIndex: 2, pointerEvents: 'none', boxShadow: lit ? `inset 0 0 0 2.5px ${ORANGE}` : 'inset 0 0 0 1.5px #D3DEF6', transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }} />
const val: CSSProperties = { fontFamily: MONO, ...NOLIG, fontSize: 14, fontWeight: 600, lineHeight: '18px', color: colors.brandDark, whiteSpace: 'nowrap', textAlign: 'center' }

/* ================================================================== slide 48 · F_T22 · retries and timeouts */

/*
 * 546 x 340. The timeline card x 20..526, y 20..198: attempts (blue bars on the time axis y 114) start at t = 0, 1.6, 4.2,
 * 8.8 and last 0.6 each, x = 60 + t * 45.7. The first three end at the timeout boundary in an orange cross; the gaps after
 * them double (1, 2, 4: exponential backoff, an hourglass under each); the last attempt carries the jitter band and
 * succeeds (tick). The stopwatch marks the timeout boundary, the dice the jitter. Under it: the idempotency card
 * x 20..356 (with the key: charged once; without: charged twice) and the AWS SDK card x 376..526, wired up into the
 * timeline's backoff. Presses: 1 backoff, 2 jitter, 3 idempotency key, 4 AWS SDK.
 */
const A = { W: 546, H: 340, X0: 60, SC: 45.7, AY: 114, BH: 14, TB: 198, BY: 220, BB: 320, RY: 258, PER: 6.4 }
const A_ST = [0, 1.6, 4.2, 8.8]
const ax = (t: number) => A.X0 + t * A.SC
const A_BAR = A_ST.map((t) => [ax(t), ax(t + 0.6)] as const)
const A_GAP = [0, 1, 2].map((k) => [A_BAR[k][1], A_BAR[k + 1][0]] as const)
const A_SDK = 451
const A_CUR = K.ride('t22c', [[A.X0, A.AY], [ax(9.4), A.AY]], 0.1, 5.6, A.PER, 1)
const A_SDKR = K.ride('t22s', [[A_SDK, A.RY - 22], [A_SDK, A.TB]], 0.3, 1.0, 2.6)
const A_PAYA = K.ride('t22pa', [[90, A.RY], [140, A.RY]], 0.2, 0.8, 2.4)
const A_PAYB = K.ride('t22pb', [[260, A.RY], [292, A.RY]], 0.2, 0.8, 2.4)

/** a payment request tile, sent twice: a second card peeks out behind it */
function Repeat({ x, y, keyed }: { x: number; y: number; keyed: boolean }) {
  return (
    <>
      <span style={{ ...box(x - 20 - 6, y - 20 - 6, 40, 40), zIndex: 3, borderRadius: 11, background: '#F2F6FF', boxShadow: RIM }} />
      <span style={{ ...box(x - 20, y - 20, 40, 40), zIndex: 3 }}><Plinth size={40}><Ico3D name="receipt" size={30} loop="bob" d={keyed ? 0 : 0.6} /></Plinth></span>
      {keyed && <Corner x={x + 18} y={y - 18} icon="key" size={24} loop="tilt" z={4} />}
    </>
  )
}

const F_T22: Fig = (p) => {
  const { hot, s, live } = useBuild({ ...p, steps: p.steps ?? 4 }, 1800)
  const instant = useInstant()
  const litB = hot === 0
  const litJ = hot === 1
  return (
    <Frame w={A.W} h={A.H}>
      <Panel x={20} y={20} w={A.W - 40} h={A.TB - 20} />

      {/* the time axis and the attempts */}
      <svg aria-hidden width={A.W} height={A.H} style={{ position: 'absolute', left: 0, top: 0, zIndex: 3, pointerEvents: 'none', overflow: 'visible' }}>
        <line x1={44} y1={A.AY} x2={498} y2={A.AY} stroke="#C9D6F0" strokeWidth={2} strokeLinecap="round" />
        <polygon points={`506,${A.AY} 497,${A.AY - 5} 497,${A.AY + 5}`} fill="#C9D6F0" />
        <line x1={A_BAR[0][1]} y1={84} x2={A_BAR[0][1]} y2={A.AY + 14} stroke={ORANGE} strokeWidth={2} strokeDasharray="4 4" />
        {A_GAP.map(([g0, g1], k) => (
          <path key={k} d={`M ${g0 + 3} ${A.AY + 14} V ${A.AY + 20} H ${g1 - 3} V ${A.AY + 14}`} fill="none" stroke={litB ? ORANGE : '#9DB6EE'} strokeWidth={2} strokeLinecap="round" style={{ opacity: s(1) ? 1 : 0, transition: instant ? 'none' : `opacity 520ms ${EASE} ${k * 120}ms, stroke 420ms ${EASE}` }} />
        ))}
      </svg>
      {/* the jitter band round the last attempt's start */}
      <Show on={s(2)} style={{ ...box(A_BAR[3][0] - 20, A.AY - 15, A_BAR[3][1] - A_BAR[3][0] + 40, 30), zIndex: 3 }}>
        <span style={{ position: 'absolute', inset: 0, borderRadius: 8, background: 'rgba(45,99,251,0.08)', border: `2px dashed ${litJ ? ORANGE : '#9DB6EE'}`, transition: instant ? 'none' : `border-color 420ms ${EASE}` }} />
      </Show>
      {A_BAR.map(([b0, b1], k) => (
        <span key={k} className={k === 3 && live && s(2) ? 's18f-jit' : undefined} style={{ ...box(b0, A.AY - A.BH / 2, b1 - b0, A.BH), zIndex: 4, borderRadius: 7, background: 'linear-gradient(180deg, #5C8BFF 0%, #2D63FB 100%)', boxShadow: '0 4px 8px -4px rgba(31,64,140,0.6)' }} />
      ))}
      {A_BAR.slice(0, 3).map(([, b1], k) => <XMark key={k} x={b1} y={A.AY} size={22} d={k * 0.5} />)}
      <Corner x={A_BAR[3][1]} y={A.AY} icon="check" size={26} loop="pulse" />

      {/* the timeout boundary and the jitter marker */}
      <Node x={A_BAR[0][1]} y={62} icon={I('stopwatch')} size={40} label="Timeout" right loop="tilt" />
      <Show on={s(2)} style={{ ...box(A_BAR[3][0] + 14 - 20 - 58, 42, 58, 40), zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <span style={tag(14)}>Jitter</span>
      </Show>
      <Node x={A_BAR[3][0] + 14 + 10} y={62} icon={I('dice')} size={40} on={s(2)} lit={litJ} loop="spin" t={5} />

      {/* the backoff gaps, each twice the last */}
      {A_GAP.map(([g0, g1], k) => (
        <Node key={k} x={(g0 + g1) / 2} y={160} icon="hourglass" size={30} k={0.76} on={s(1)} lit={litB} delay={k * 120} loop="tilt" d={k * 0.5} />
      ))}
      <Show on={s(1)} delay={360} style={{ ...box((A_GAP[2][0] + A_GAP[2][1]) / 2 + 24, 151, 70, 18), zIndex: 3, ...tag(14), textAlign: 'left' }}>Backoff</Show>

      {/* press 3: the idempotency key: the repeat with the key is charged once, the repeat without it twice */}
      <Panel x={20} y={A.BY} w={336} h={A.BB - A.BY} on={s(3)} lit={hot === 2} />
      <Show on={s(3)} style={{ ...box(0, 0, A.W, A.H), zIndex: 3, pointerEvents: 'none' }}>
        <Repeat x={70} y={A.RY} keyed />
        <W pts={[[90, A.RY], [140, A.RY]]} head={8} />
        <span style={{ ...box(140, A.RY - 20, 40, 40), zIndex: 3 }}><Plinth size={40}><Ico3D name="coin" size={30} loop="spin" t={4} /></Plinth></span>
        <Corner x={178} y={A.RY - 18} icon="check" size={24} loop="pulse" z={4} />
        <div style={{ ...box(30, A.RY + 26, 170, 18), ...tag(14) }}>Idempotency Key</div>
        <span style={{ ...box(197, A.RY - 30, 0, 60), borderLeft: '2px dashed #C5D3EE' }} />
        <Repeat x={240} y={A.RY} keyed={false} />
        <W pts={[[260, A.RY], [292, A.RY]]} head={8} />
        <span style={{ ...box(292, A.RY - 20, 40, 40), zIndex: 3 }}>
          <Plinth size={40}>
            <span style={{ position: 'relative', width: 34, height: 30 }}>
              <span style={{ position: 'absolute', left: 0, top: 2 }}><Ico3D name="coin" size={24} loop="none" /></span>
              <span style={{ position: 'absolute', left: 11, top: 6 }}><Ico3D name="coin" size={24} loop="bob" /></span>
            </span>
          </Plinth>
        </span>
        <XMark x={328} y={A.RY - 18} size={22} z={4} />
      </Show>

      {/* press 4: the AWS SDK applies the backoff for you */}
      <Panel x={376} y={A.BY} w={A.W - 20 - 376} h={A.BB - A.BY} on={s(4)} lit={hot === 3} />
      <W pts={[[A_SDK, A.RY - 22], [A_SDK, A.TB]]} on={s(4)} head={8} lit={hot === 3} />
      <Node x={A_SDK} y={A.RY} icon="code" size={44} label="AWS SDK" on={s(4)} lit={hot === 3}>
        <Corner x={42} y={2} icon="hourglass" size={24} loop="tilt" />
      </Node>

      <Token cls={A_CUR} size={10} />
      <Token cls={A_PAYA} on={s(3)} size={8} />
      <Token cls={A_PAYB} on={s(3)} size={8} />
      <Token cls={A_SDKR} on={s(4)} size={8} />
    </Frame>
  )
}

/* ================================================================== slide 49 · F_T23 · the circuit breaker's three states */

/*
 * 586 x 360. The Caller card x 20..170 (the caller (95, 60); press 4 the shield (95, 200) over its pool of threads and
 * connections, all free). The three state cards x 210..430: Closed y 20..100, Open 140..220, Half-Open 260..340, each
 * with its breaker switch (76 x 40) and name, its icon on the card's corner. Transitions: Closed -> Open (x 270, after the
 * Threshold), Open -> Half-Open (x 270, after the Wait), Half-Open -> Open (x 370, on Failure), Half-Open -> Closed (round
 * the right side, x 480, on Success). Presses: 1 Closed, 2 Open, 3 Half-Open, 4 the caller kept free.
 */
const B = { W: 586, H: 360, CX: 210, CW: 220, CH: 80, YS: [20, 140, 260], RX: 480, PER: 6 }
const B_R = B.CX + B.CW
const B_MID = B.YS.map((y) => y + B.CH / 2)
const B_T1: Pt[] = [[270, B.YS[0] + B.CH], [270, B.YS[1]]]
const B_T2: Pt[] = [[270, B.YS[1] + B.CH], [270, B.YS[2]]]
const B_T3: Pt[] = [[370, B.YS[2]], [370, B.YS[1] + B.CH]]
const B_T4: Pt[] = [[B_R, B_MID[2]], [B.RX, B_MID[2]], [B.RX, B_MID[0]], [B_R, B_MID[0]]]
const B_CALL: Pt[] = [[121, B_MID[0]], [B.CX, B_MID[0]]]
const B_RIDES = [
  K.ride('t23c', B_CALL, 0.1, 0.7, B.PER),
  K.ride('t23a', B_T1, 0.9, 1.4, B.PER),
  K.ride('t23b', B_T2, 2.0, 2.5, B.PER),
  K.ride('t23f', B_T3, 3.0, 3.5, B.PER),
  K.ride('t23s', B_T4, 4.0, 5.4, B.PER),
]
const B_STATES: { name: string; icon: Ico3DName; loop: Loop; mode: 'closed' | 'open' | 'half' }[] = [
  { name: 'Closed', icon: I('power'), loop: 'pulse', mode: 'closed' },
  { name: 'Open', icon: 'ban', loop: 'beat', mode: 'open' },
  { name: 'Half-Open', icon: 'search', loop: 'tilt', mode: 'half' },
]

/** a breaker switch: two contacts, the lever down (closed, current flowing), up (open) or part-way with a test request */
export function Switch({ mode, live, w = 76 }: { mode: 'closed' | 'open' | 'half'; live: boolean; w?: number }) {
  const y = 28
  const c0 = 10
  const c1 = w - 10
  const ang = mode === 'closed' ? 0 : mode === 'open' ? -38 : -16
  const tone = mode === 'open' ? ORANGE : BLUE
  return (
    <span style={{ position: 'relative', display: 'block', width: w, height: 40, flexShrink: 0 }}>
      <svg aria-hidden width={w} height={40} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <line x1={0} y1={y} x2={c0} y2={y} stroke="#9DB6EE" strokeWidth={3} strokeLinecap="round" />
        <line x1={c1} y1={y} x2={w} y2={y} stroke="#9DB6EE" strokeWidth={3} strokeLinecap="round" />
        <circle cx={c0} cy={y} r={5} fill="#FFFFFF" stroke={colors.brandDeep} strokeWidth={2.4} />
        <circle cx={c1} cy={y} r={5} fill="#FFFFFF" stroke={colors.brandDeep} strokeWidth={2.4} />
      </svg>
      <span style={{ position: 'absolute', left: c0, top: y - 3, width: c1 - c0 + 2, height: 6, borderRadius: 3, background: tone, transformOrigin: '0 50%', transform: `rotate(${ang}deg)`, boxShadow: '0 3px 6px -3px rgba(31,64,140,0.6)' }} />
      <span style={{ position: 'absolute', left: c0 - 5, top: y - 5, width: 10, height: 10, borderRadius: 99, background: colors.brandDeep }} />
      {live && mode === 'closed' && [0, 1].map((i) => (
        <span key={i} className="s18f-cur" style={{ position: 'absolute', left: c0 - 3, top: y - 12, width: 7, height: 7, borderRadius: 99, background: '#F6B23C', boxShadow: '0 0 6px #F6B23C', ['--s18f-d' as string]: `${-i * 0.7}s` } as CSSProperties} />
      ))}
      {live && mode === 'half' && <span className="s18f-test" style={{ position: 'absolute', left: -4, top: y - 4, width: 8, height: 8, borderRadius: 99, background: BLUE, boxShadow: `0 0 0 3px ${BLUE}33` }} />}
    </span>
  )
}

const F_T23: Fig = (p) => {
  const { hot, s, live } = useBuild({ ...p, steps: p.steps ?? 4 }, 1800)
  const instant = useInstant()
  return (
    <Frame w={B.W} h={B.H}>
      {/* the caller */}
      <Panel x={20} y={20} w={150} h={B.H - 40} lit={hot === 3} />
      <Node x={95} y={B_MID[0]} icon="server" label="Caller" d={0.2} />
      <W pts={B_CALL} head={9} lit={hot === 0} />
      <Node x={95} y={206} icon="shield" size={52} on={s(4)} lit={hot === 3} loop="glint" />
      <Show on={s(4)} delay={160} style={{ ...box(50, 246, 90, 36), zIndex: 3 }}>
        {[0, 1].map((r) => [0, 1, 2, 3].map((c) => (
          <span key={`${r}${c}`} className={live ? loopCls('breathe') : undefined} style={{ position: 'absolute', left: c * 24, top: r * 22, width: 18, height: 14, borderRadius: 5, background: '#EAF0FF', border: '2px solid #9DB6EE', ...loopVars((r * 4 + c) * 0.35, 3.2) }} />
        )))}
      </Show>

      {/* the three states and their transitions */}
      <W pts={B_T1} head={9} lit={hot === 0} />
      <W pts={B_T2} head={9} lit={hot === 1} />
      <W pts={B_T3} head={9} lit={hot === 2} />
      <W pts={B_T4} head={9} lit={hot === 2} />
      <div style={{ ...box(282, B.YS[0] + B.CH + 11, 90, 18), zIndex: 3, ...tag(14, colors.brandDark), textAlign: 'left' }}>Threshold</div>
      <div style={{ ...box(282, B.YS[1] + B.CH + 11, 60, 18), zIndex: 3, ...tag(14, colors.brandDark), textAlign: 'left' }}>Wait</div>
      <div style={{ ...box(382, B.YS[1] + B.CH + 11, 60, 18), zIndex: 3, ...tag(14, colors.brandDark), textAlign: 'left' }}>Failure</div>
      <div style={{ ...box(B.RX + 12, (B_MID[0] + B_MID[2]) / 2 - 9, 70, 18), zIndex: 3, ...tag(14, colors.brandDark), textAlign: 'left' }}>Success</div>
      {B_STATES.map((st, i) => (
        <div key={st.name}>
          <div data-fk="card" style={{ ...box(B.CX, B.YS[i], B.CW, B.CH), zIndex: 3, ...cardStyle(hot === i, instant), display: 'flex', alignItems: 'center', gap: 16, paddingLeft: 20 }}>
            <Switch mode={st.mode} live={live} />
            <span style={heading(17)}>{st.name}</span>
          </div>
          <Corner x={B_R - 6} y={B.YS[i] + 6} icon={st.icon} size={32} loop={st.loop} d={i * 0.4} z={6} orange={st.icon === 'ban'} />
        </div>
      ))}

      {B_RIDES.map((c) => <Token key={c} cls={c} size={9} />)}
    </Frame>
  )
}

/* ================================================================== slide 51 · F_T24 · graceful degradation */

/*
 * 586 x 360. Two product pages, x 20..223 (full) and x 363..566 (degraded), y 20..340, drawn as pages: the browser bar,
 * the header, the product image, title, price and the add-to-cart button, the Recommendations row and two lines of
 * description. Between them (x 293): Cached Data (y 136), wired into the degraded page at its price row, fed from the
 * Circuit Breaker (y 262). Presses: 1 cached data fills the failed price call, 2 the Recommendations widget switches off,
 * 3 the partial page (still a page, not an error), 4 the breaker triggers the fallback path.
 */
const C = { W: 586, H: 360, LX: 20, RX: 363, Y: 20, SW: 203, SH: 320, MX: 293, DY: 136, BKY: 262, PER: 3.6 }
const C_FILL = K.ride('t24f', [[C.MX + 24, C.DY], [C.RX, C.DY]], 0.6, 1.4, C.PER)
const C_TRIG = K.ride('t24t', [[C.MX, C.BKY - 24], [C.MX, C.DY + 24]], 0.1, 0.7, C.PER)

function Page({ x, lit, degraded, cached, live }: { x: number; lit: boolean; degraded: boolean; cached: boolean; live: boolean }) {
  const instant = useInstant()
  const fade = instant ? 'none' : `opacity 520ms ${EASE}`
  const bar = (l: number, t: number, w: number, h: number, bg: string): ReactNode => <span style={{ ...box(l, t, w, h), borderRadius: h / 2, background: bg }} />
  const grey = '#D5DEEF'
  return (
    <div data-fk="card" style={{ ...box(x, C.Y, C.SW, C.SH), zIndex: 3, ...cardStyle(lit, instant), overflow: 'hidden' }}>
      {/* browser bar */}
      <span style={{ ...box(0, 0, C.SW, 30), background: '#EEF3FF', borderBottom: `1px solid ${colors.line}` }} />
      {[14, 26, 38].map((cx) => <span key={cx} style={{ ...box(cx - 4, 11, 8, 8), borderRadius: 99, background: '#B9C9EA' }} />)}
      {bar(52, 10, C.SW - 92, 10, '#FFFFFF')}
      {/* header */}
      <span style={{ ...box(20, 44, 20, 20), borderRadius: 6, background: 'linear-gradient(180deg, #5C8BFF 0%, #2D63FB 100%)' }} />
      {bar(98, 51, 22, 6, grey)}
      {bar(126, 51, 22, 6, grey)}
      {bar(154, 51, 29, 6, grey)}
      {/* the product: image, title, price, add to cart */}
      <span style={{ ...box(20, 80, 80, 90), borderRadius: 12, background: 'linear-gradient(160deg, #F0F5FF 0%, #DCE7FF 100%)', display: 'grid', placeItems: 'center' }}>
        <Ico3D name="package" size={50} loop="bob" d={x > 100 ? 0.5 : 0} />
      </span>
      {bar(112, 86, 71, 8, colors.brandDeep)}
      {bar(112, 100, 52, 8, colors.brandDeep)}
      {bar(112, 120, 40, 10, BLUE)}
      <span style={{ ...box(112, 144, 71, 26), borderRadius: 13, background: 'linear-gradient(180deg, #5C8BFF 0%, #2D63FB 100%)', display: 'grid', placeItems: 'center', boxShadow: '0 5px 10px -6px rgba(31,64,140,0.7)' }}>
        <Ico3D name={I('cart')} size={20} loop="none" />
      </span>
      {/* the Recommendations widget, or (degraded) its empty slot with the feature switched off */}
      <div style={{ ...box(20, 186, C.SW - 40, 76), opacity: degraded ? 0 : 1, transition: fade }}>
        <span style={{ ...tag(14), position: 'absolute', left: 0, top: 0 }}>Recommendations</span>
        {(['laptop', 'phone', 'camera'] as Ico3DName[]).map((ic, i) => (
          <span key={ic} style={{ ...box(i * 58, 26, 47, 50), borderRadius: 10, background: 'linear-gradient(160deg, #F0F5FF 0%, #DCE7FF 100%)', display: 'grid', placeItems: 'center' }}>
            <Ico3D name={ic} size={28} loop="bob" d={i * 0.4} />
          </span>
        ))}
      </div>
      <div style={{ ...box(20, 186, C.SW - 40, 76), opacity: degraded ? 1 : 0, transition: fade }}>
        <span className={live && degraded ? 's18f-dim' : undefined} style={{ position: 'absolute', inset: 0, borderRadius: 12, border: '2px dashed #C5D3EE', background: 'rgba(197,211,238,0.12)' }} />
        <span style={{ position: 'absolute', left: (C.SW - 40) / 2 - 22, top: 16 }}><Plinth size={44}><span style={{ display: 'grid', transform: 'scaleX(-1)', filter: 'grayscale(0.9) opacity(0.8)' }}><Ico3D name="toggle" size={32} loop="pulse" /></span></Plinth></span>
      </div>
      {bar(20, 280, C.SW - 40, 6, grey)}
      {bar(20, 294, 112, 6, grey)}
      <Rim lit={lit} instant={instant} />
      {/* the cached price */}
      <span style={{ position: 'absolute', left: 168, top: 125, transform: 'translate(-50%, -50%)', opacity: cached ? 1 : 0, transition: fade }}>
        <span style={{ display: 'grid', placeItems: 'center', width: 26, height: 26, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6' }}>
          <Ico3D name="doc" size={20} loop="beat" />
        </span>
      </span>
    </div>
  )
}

const F_T24: Fig = (p) => {
  const { hot, s, live } = useBuild({ ...p, steps: p.steps ?? 4 }, 1800)
  return (
    <Frame w={C.W} h={C.H}>
      <Page x={C.LX} lit={false} degraded={false} cached={false} live={live} />
      <Page x={C.RX} lit={hot === 2} degraded={s(2)} cached={s(1)} live={live} />
      <Corner x={C.RX + C.SW - 20} y={C.Y + 15} icon="webpage" size={26} on={s(3)} loop="float" z={6} />

      <W pts={[[C.MX + 24, C.DY], [C.RX, C.DY]]} on={s(1)} head={9} lit={hot === 0} />
      <Node x={C.MX} y={C.DY} icon="doc" size={48} w={130} label="Cached Data" up on={s(1)} lit={hot === 0} />
      <W pts={[[C.MX, C.BKY - 24], [C.MX, C.DY + 24]]} on={s(4)} head={9} lit={hot === 3} />
      <Node x={C.MX} y={C.BKY} icon={I('breaker')} size={48} w={130} label="Circuit Breaker" on={s(4)} lit={hot === 3} loop="beat" />
      <span style={{ ...box(C.RX + 20 - 6, C.Y + 186 - 6, C.SW - 40 + 12, 76 + 12), zIndex: 5, borderRadius: 16, boxShadow: `inset 0 0 0 2.5px ${ORANGE}`, opacity: hot === 1 ? 1 : 0, transition: `opacity 420ms ${EASE}`, pointerEvents: 'none' }} />

      <Token cls={C_FILL} on={s(1)} />
      <Token cls={C_TRIG} on={s(4)} />
    </Frame>
  )
}

/* ================================================================== slides 52-53 · F_T25 · one request traced */

/*
 * 586 wide; 264 tall on T25, 400 on T25-B (the first 264 identical). Top lane (y 44): Client (80) -> Load Balancer (293)
 * -> Checkout (506). The timeline (tiles y 140, names under, values under those): Call 66, Timeout 176 (3-second),
 * Retry 286 (500ms), Breaker Open 396 (5 Failures), Fallback 506; the 30 Seconds bracket from Breaker Open to Fallback
 * (y 222). T25-B adds the failure counter and its five crosses (x 140..300, y 318) and the fallback screen with the cart
 * and the message (x 356..566, y 270..380). Presses: 1 lane + Call, 2 Timeout, 3 Retry | 4 count, 5 Breaker Open, 6 Fallback.
 */
const D = { W: 586, LY: 44, TY: 140, NS: 48, BR: 222, CY: 318, SX0: 356, SY0: 270, SY1: 380, PER: 6 }
const D_LX = [80, 293, 506]
const D_SX = [66, 176, 286, 396, 506]
const D_ST: { name: string; icon: Ico3DName; loop: Loop; v?: string }[] = [
  { name: 'Call', icon: I('api'), loop: 'pulse' },
  { name: 'Timeout', icon: I('stopwatch'), loop: 'tilt', v: '3-second' },
  { name: 'Retry', icon: 'refresh', loop: 'spin', v: '500ms' },
  { name: 'Breaker Open', icon: I('breaker'), loop: 'beat', v: '5 Failures' },
  { name: 'Fallback', icon: I('cart'), loop: 'bob' },
]
const dh = D.NS / 2
const D_LANE: Pt[][] = [[[D_LX[0] + dh, D.LY], [D_LX[1] - dh, D.LY]], [[D_LX[1] + dh, D.LY], [D_LX[2] - dh, D.LY]]]
const D_AXIS: Pt[][] = [0, 1, 2, 3].map((i) => [[D_SX[i] + dh, D.TY], [D_SX[i + 1] - dh, D.TY]])
const D_RL = D_LANE.map((pts, i) => K.ride(`t25l${i}`, pts, 0.1 + i * 0.9, 0.8 + i * 0.9, D.PER))
const D_RA = D_AXIS.map((pts, i) => K.ride(`t25a${i}`, pts, 2.0 + i * 0.9, 2.6 + i * 0.9, D.PER))

const F_T25: Fig = (p) => {
  const { hot, s, live } = useBuild({ ...p, steps: p.steps ?? 3 }, 1800)
  const instant = useInstant()
  const H = p.from ? 400 : 264
  const litSt = (i: number) => (i < 3 ? hot === i : hot === i + 1)
  return (
    <Frame w={D.W} h={H}>
      {/* the request's path */}
      {D_LANE.map((pts, i) => <W key={i} pts={pts} head={9} lit={hot === 0} />)}
      <Node x={D_LX[0]} y={D.LY} icon="laptop" size={D.NS} label="Client" />
      <Node x={D_LX[1]} y={D.LY} mark={elbMark} size={D.NS} label="Load Balancer" w={140} lit={hot === 0} />
      <Node x={D_LX[2]} y={D.LY} icon="server" size={D.NS} label="Checkout" lit={hot === 0} d={0.4} />

      {/* the timeline: each step, its name, its value */}
      {D_AXIS.map((pts, i) => <W key={i} pts={pts} head={9} lit={hot === i + 1 || (i === 3 && hot === 5)} />)}
      {D_ST.map((st, i) => (
        <div key={st.name}>
          <Node x={D_SX[i]} y={D.TY} icon={st.icon} size={D.NS} w={110} label={st.name} lit={litSt(i)} loop={st.loop} t={st.loop === 'spin' ? 5 : undefined} d={i * 0.3} />
          {st.v && <div style={{ ...box(D_SX[i] - 55, D.TY + dh + 28, 110, 18), zIndex: 3, ...val }}>{st.v}</div>}
        </div>
      ))}
      <Corner x={D_SX[3] + dh - 2} y={D.TY - dh + 2} icon="ban" size={26} on={s(5)} orange />
      <svg aria-hidden width={D.W} height={H} style={{ position: 'absolute', left: 0, top: 0, zIndex: 3, pointerEvents: 'none', overflow: 'visible' }}>
        <path d={`M ${D_SX[3]} ${D.BR - 8} V ${D.BR} H ${D_SX[4]} V ${D.BR - 8}`} fill="none" stroke={hot === 4 ? ORANGE : '#9DB6EE'} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={{ transition: instant ? 'none' : `stroke 420ms ${EASE}` }} />
      </svg>
      <div style={{ ...box((D_SX[3] + D_SX[4]) / 2 - 60, D.BR + 6, 120, 18), zIndex: 3, ...val, color: hot === 4 ? colors.accentDark : colors.brandDark }}>30 Seconds</div>

      {p.from ? (<>
      {/* T25-B press 4: every failed call adds to the count */}
      <Node x={140} y={D.CY} icon={I('counter')} size={D.NS} on={s(4)} lit={hot === 3} loop="pulse" />
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className={live && s(4) ? `s18f-n s18f-n${i}` : undefined}>
          <XMark x={190 + i * 28} y={D.CY} size={22} on={s(4)} d={i * 0.3} />
        </span>
      ))}

      {/* T25-B press 6: the fallback screen keeps the cart and asks the user to try again */}
      <Show on={s(6)} style={{ ...box(D.SX0, D.SY0, D.W - 20 - D.SX0, D.SY1 - D.SY0), zIndex: 3 }}>
        <div data-fk="card" style={{ position: 'absolute', inset: 0, ...cardStyle(hot === 5, instant), overflow: 'hidden' }}>
          <span style={{ ...box(0, 0, D.W - 20 - D.SX0, 24), background: '#EEF3FF', borderBottom: `1px solid ${colors.line}` }} />
          {[14, 26, 38].map((cx) => <span key={cx} style={{ ...box(cx - 4, 8, 8, 8), borderRadius: 99, background: '#B9C9EA' }} />)}
          <span style={{ position: 'absolute', left: 20, top: 24 + (86 - 44) / 2 }}><Plinth size={44} lit={false}><Ico3D name={I('cart')} size={32} loop="bob" /></Plinth></span>
          <span style={{ position: 'absolute', left: 78, top: 24 + (86 - 40) / 2, width: 120, fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 600, fontSize: 14, lineHeight: '20px', color: colors.ink, whiteSpace: 'nowrap' }}>Checkout Busy<br />Try Again Shortly</span>
          <Rim lit={hot === 5} instant={instant} />
        </div>
      </Show>
      </>) : null}

      {D_RL.map((c) => <Token key={c} cls={c} />)}
      {D_RA.map((c) => <Token key={c} cls={c} />)}
    </Frame>
  )
}

export const figures: Record<string, Fig> = { F_T22, F_T23, F_T24, F_T25 }

const pc = (v: number) => `${v.toFixed(2)}%`
/* the failure count: the five crosses arrive one by one, hold, and start again */
const NK = [0, 1, 2, 3, 4].map((i) => `@keyframes s18f-n${i} { 0%, ${pc(6 + i * 14)} { opacity: 0 } ${pc(12 + i * 14)}, 92% { opacity: 1 } 98%, 100% { opacity: 0 } }
.s18f-n${i} { display: block; animation: s18f-n${i} 5.6s ease-out infinite; }`).join('\n')

export const css = `
${NK}
@keyframes s18f-cur { 0% { transform: translateX(0); opacity: 0 } 12% { opacity: 1 } 88% { opacity: 1 } 100% { transform: translateX(56px); opacity: 0 } }
.s18f-cur { animation: s18f-cur 1.4s linear infinite; animation-delay: var(--s18f-d, 0s); }
@keyframes s18f-test { 0%, 30% { transform: translateX(0); opacity: 0 } 36% { opacity: 1 } 60% { transform: translateX(26px); opacity: 1 } 66%, 100% { transform: translateX(26px); opacity: 0 } }
.s18f-test { animation: s18f-test 3s ease-in-out infinite; }
@keyframes s18f-jit { 0%, 100% { transform: translateX(0) } 25% { transform: translateX(-9px) } 50% { transform: translateX(6px) } 75% { transform: translateX(-4px) } }
.s18f-jit { animation: s18f-jit 3.2s cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes s18f-dim { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }
.s18f-dim { animation: s18f-dim 3s ease-in-out infinite; }
${K.css()}
.cc-still .s18f-n, .deck-thumb .s18f-n, .cc-still .s18f-cur, .deck-thumb .s18f-cur, .cc-still .s18f-test, .deck-thumb .s18f-test, .cc-still .s18f-jit, .deck-thumb .s18f-jit, .cc-still .s18f-dim, .deck-thumb .s18f-dim { animation: none !important; }
.cc-still .s18f-cur, .deck-thumb .s18f-cur, .cc-still .s18f-test, .deck-thumb .s18f-test { opacity: 0 !important; }
@media (prefers-reduced-motion: reduce) { .s18f-n, .s18f-cur, .s18f-test, .s18f-jit, .s18f-dim { animation: none !important; } }
`
void useHeld
