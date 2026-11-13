import type { CSSProperties, ReactNode } from 'react'
import { ShotImage } from './e'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { TILE_SKIN } from '@/decks/figures/card'
import { MOTION, motionHeld } from '@/motion/tokens'
import { litRing } from '@/decks/figures/net/frames'
import { BOX_W, Card, STILL, useBuild } from '@/decks/figures/scene'
import { VisualTable } from '@/decks/figures/net/vtable'
import { Icon, Rich } from '@/engine/icon'
import { dims } from 'virtual:deck'
import dynamoUrl from '../images/aws-dynamodb.svg'
import cognitoUrl from '../images/aws-cognito.svg'
import s3Url from '../images/aws-s3.svg'
import receptionUrl from '../images/reception.png'

/*
 * BUILDER C · Serverless Computing (Session 10), section 5 figures and the practical's compare frame.
 *
 * Built to Session 9's final review state (generate-slides standing corrections 13-14, cloud course R10-R11): icon
 * pictures, not labelled diagrams. No chips, number badges, connector-line labels or explaining text; a 1-3 word
 * plain label only where an icon alone would be ambiguous. Every visual builds on the slide's track and then keeps a
 * quiet continuous loop (flow dots riding straight arrows, glyphs bobbing, a meter ticking, a scan sweeping a chart)
 * with no rest between cycles. Loops are the `c3-loop` / `c3-dot` classes, all held on `?still` (`.cc-still`), in
 * picker thumbnails (`.deck-thumb`) and under reduced motion. Official AWS marks never move: they get a ring.
 *
 *   C_T18   slide 37  BaaS box (database, lock, disk) beside the Anti-Patterns box (three labelled workload icons)
 *   C_T19   slide 38  TR guidance as written: a phone call to a hotel reception, mirrored by an API call to a cloud DB
 *   C_T20B  slide 41  an application with direct API calls to DynamoDB, Cognito and S3
 *   C_T21   slide 42  a ticking taxi meter (Per-Ride Cost) beside a parked owned car (Fixed Cost)
 *   C_T22   slide 44  the TR table, rows one per press, each Better Fit cell in its own colour (the TR asks for it)
 *   C_T22B  slide 45  cost against utilisation: a rising per-invocation line, a flat reserved line, the break-even band
 *   L_Compare slide 53 two invocation summaries side by side, captions top-aligned, rings one per press, note under both
 */

const EASE = MOTION.ease
const HEAD = "'DM Sans', system-ui, sans-serif"

/* ------------------------------------------------------------------ the kit (Session 9's c.tsx parts) */

function useHeld() {
  return motionHeld(useInstant())
}

/** a w x h frame centred in the stage; children are placed in figure px */
const Frame = ({ w, h, children }: { w: number; h: number; children: ReactNode }) => (
  <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
    <div style={{ position: 'relative', width: w, height: h }}>{children}</div>
  </div>
)

/** shown from its step on: fade and a short rise; held on `?still` */
function Show({ on, children, style, delay = 0, dx = 0, dy = 8 }: { on: boolean; children: ReactNode; style?: CSSProperties; delay?: number; dx?: number; dy?: number }) {
  const held = useHeld()
  return (
    <div
      style={{
        opacity: on ? 1 : 0,
        transform: on ? 'none' : `translate(${dx}px, ${dy}px)`,
        transition: held ? 'none' : `opacity ${MOTION.reveal}ms ${EASE} ${on ? delay : 0}ms, transform ${MOTION.reveal}ms ${EASE} ${on ? delay : 0}ms`,
        pointerEvents: on ? undefined : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

type Loop = 'bob' | 'pulse' | 'ring' | 'sway' | 'wiggle' | 'none'

/**
 * AN ICON at (x, y): an official mark (`src`) or a lucide glyph on the white tile, or a 3D library render (`lib`,
 * no plate). `label` is a short plain caption beside it (no pill). A mark never moves: its loop is a ring.
 */
function Ico({ x, y, s = 56, src, icon, lib, tone = colors.brand, loop = 'none', lit = false, on = true, delay = 0, label, labelSide = 'below', ph = 0, plate }: { x: number; y: number; s?: number; src?: string; icon?: string; lib?: string; tone?: string; loop?: Loop; lit?: boolean; on?: boolean; delay?: number; label?: ReactNode; labelSide?: 'below' | 'right' | 'above' | 'left'; ph?: number; plate?: string }) {
  const held = useHeld()
  const r = Math.round(s * 0.27)
  const lp: Loop = src && loop !== 'none' ? 'ring' : loop
  const glyphCls = lp === 'bob' ? 'c3-loop c3-bob' : lp === 'sway' ? 'c3-loop c3-sway' : lp === 'wiggle' ? 'c3-loop c3-wiggle' : ''
  const plateCls = lp === 'pulse' ? 'c3-loop c3-pulse' : ''
  const anim = { animationDelay: `${-ph}s` }
  const glyph = src ? (
    <img src={src} alt="" aria-hidden draggable={false} style={{ width: Math.round(s * 0.76), display: 'block' }} />
  ) : lib ? (
    <Icon name={lib} size={s} />
  ) : (
    <Icon name={icon} size={Math.round(s * 0.5)} />
  )
  const lbl: CSSProperties =
    labelSide === 'below'
      ? { left: '50%', top: s + 8, transform: 'translateX(-50%)', textAlign: 'center' }
      : labelSide === 'above'
        ? { left: '50%', bottom: s + 8, transform: 'translateX(-50%)', textAlign: 'center' }
        : labelSide === 'right'
          ? { left: s + 12, top: '50%', transform: 'translateY(-50%)' }
          : { right: s + 12, top: '50%', transform: 'translateY(-50%)', textAlign: 'right' }
  return (
    <div
      style={{
        position: 'absolute',
        left: x - s / 2,
        top: y - s / 2,
        width: s,
        height: s,
        zIndex: 6,
        opacity: on ? 1 : 0,
        transform: on ? 'none' : 'translateY(8px) scale(0.92)',
        transition: held ? 'none' : `opacity ${MOTION.reveal}ms ${EASE} ${on ? delay : 0}ms, transform ${MOTION.reveal}ms ${EASE} ${on ? delay : 0}ms`,
      }}
    >
      {lp === 'ring' && !lib && <span aria-hidden className="c3-loop c3-ring" style={{ position: 'absolute', inset: 0, borderRadius: r, boxShadow: `0 0 0 2px ${tone}`, ...anim }} />}
      <div className={plateCls} style={{ position: 'relative', width: '100%', height: '100%', ...anim }}>
        {lib ? (
          <span className={glyphCls} style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%', ...anim }}>
            {glyph}
          </span>
        ) : (
          <span style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%', borderRadius: r, ...TILE_SKIN, ...(plate ? { background: plate } : {}), boxShadow: litRing(lit, TILE_SKIN.boxShadow as string), color: tone, transition: held ? 'none' : `box-shadow 420ms ${EASE}` }}>
            <span className={glyphCls} style={{ display: 'grid', placeItems: 'center', ...anim }}>
              {glyph}
            </span>
          </span>
        )}
      </div>
      {label && <div style={{ position: 'absolute', whiteSpace: 'nowrap', fontFamily: HEAD, fontWeight: 600, fontSize: 15, lineHeight: 1.2, color: colors.ink, ...lbl }}>{label}</div>}
    </div>
  )
}

/**
 * A STRAIGHT ARROW from (x1, y1) to (x2, y2): one segment, its head's tip exactly on the target point. It draws
 * itself once when it arrives; `flow` adds a dot that rides it on a loop (no rest between rides).
 */
function Line({ x1, y1, x2, y2, on = true, tone = colors.brand, head = true, flow = true, dur = 2.2, delay = 0, width = 2.5, ph = 0 }: { x1: number; y1: number; x2: number; y2: number; on?: boolean; tone?: string; head?: boolean; flow?: boolean; dur?: number; delay?: number; width?: number; ph?: number }) {
  const held = useHeld()
  const dx = x2 - x1
  const dy = y2 - y1
  const L = Math.hypot(dx, dy) || 1
  const ux = dx / L
  const uy = dy / L
  const HL = 11
  const hw = 5.5
  const ex = head ? x2 - ux * (HL - 1) : x2
  const ey = head ? y2 - uy * (HL - 1) : y2
  const headAt = (tx: number, ty: number, vx: number, vy: number) => `${tx},${ty} ${tx - vx * HL - vy * hw},${ty - vy * HL + vx * hw} ${tx - vx * HL + vy * hw},${ty - vy * HL - vx * hw}`
  const fade: CSSProperties = { opacity: on ? 1 : 0, transition: held ? 'none' : `opacity ${MOTION.reveal}ms ${EASE} ${on ? delay : 0}ms` }
  return (
    <>
      <svg aria-hidden width={1} height={1} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', zIndex: 3, pointerEvents: 'none', ...fade }}>
        <line x1={x1} y1={y1} x2={ex} y2={ey} stroke={tone} strokeWidth={width} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={on ? 0 : 1} style={{ transition: held ? 'none' : `stroke-dashoffset 700ms ${EASE} ${on ? delay : 0}ms` }} />
        {head && <polygon points={headAt(x2, y2, ux, uy)} fill={tone} />}
      </svg>
      {flow && on && !held && (
        <span
          aria-hidden
          className="c3-dot c3-loop"
          style={
            {
              position: 'absolute',
              left: x1 - 5,
              top: y1 - 5,
              width: 10,
              height: 10,
              borderRadius: 99,
              background: tone,
              boxShadow: `0 0 0 3px ${tone}33`,
              zIndex: 8,
              opacity: 0,
              '--dx': `${ex - x1}px`,
              '--dy': `${ey - y1}px`,
              animation: `c3-ride ${dur}s linear ${(delay + 720) / 1000 + (dur - (ph % dur))}s infinite`,
            } as CSSProperties
          }
        />
      )}
    </>
  )
}

/** a soft white card at (x, y, w, h), lit on its step */
function Panel({ x, y, w, h, lit = false, children, on = true, delay = 0, tint }: { x: number; y: number; w: number; h: number; lit?: boolean; children?: ReactNode; on?: boolean; delay?: number; tint?: string }) {
  const held = useHeld()
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x, top: y, width: w, height: h, zIndex: 1 }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 18, background: tint ?? (TILE_SKIN.background as string), boxShadow: litRing(lit, TILE_SKIN.boxShadow as string), transition: held ? 'none' : `box-shadow 420ms ${EASE}` }} />
      {children}
    </Show>
  )
}

/** a plain short caption (no pill) */
const Cap = ({ x, y, children, size = 15, tone = colors.ink, weight = 600, align = 'center', style }: { x: number; y: number; children: ReactNode; size?: number; tone?: string; weight?: number; align?: 'center' | 'left' | 'right'; style?: CSSProperties }) => (
  <div style={{ position: 'absolute', left: x, top: y, transform: align === 'center' ? 'translate(-50%, -50%)' : align === 'right' ? 'translate(-100%, -50%)' : 'translateY(-50%)', whiteSpace: 'nowrap', fontFamily: HEAD, fontWeight: weight, fontSize: size, lineHeight: 1.2, color: tone, zIndex: 7, ...style }}>{children}</div>
)

/* ------------------------------------------------------------------ 37 · T18 · BaaS beside the anti-patterns */

/** a tile with a flat load line and a dot riding it: steady, predictable load */
function SteadyTile({ x, y, s = 48, on, delay = 0 }: { x: number; y: number; s?: number; on: boolean; delay?: number }) {
  const held = useHeld()
  return (
    <div style={{ position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, zIndex: 6, opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(8px) scale(0.92)', transition: held ? 'none' : `opacity ${MOTION.reveal}ms ${EASE} ${on ? delay : 0}ms, transform ${MOTION.reveal}ms ${EASE} ${on ? delay : 0}ms` }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: Math.round(s * 0.27), ...TILE_SKIN }} />
      <span aria-hidden style={{ position: 'absolute', left: s * 0.2, right: s * 0.2, bottom: s * 0.26, height: 2, background: colors.line }} />
      <span aria-hidden style={{ position: 'absolute', left: s * 0.2, right: s * 0.2, top: s * 0.46, height: 3, borderRadius: 3, background: colors.brand }} />
      <span aria-hidden className="c3-loop c3-glide" style={{ position: 'absolute', left: s * 0.2 - 4, top: s * 0.46 - 3, width: 9, height: 9, borderRadius: 99, background: colors.brand, boxShadow: `0 0 0 3px ${colors.brand}33`, ['--run' as string]: `${s * 0.6}px` }} />
    </div>
  )
}

function C_T18({ step, steps = 3 }: { step: number; steps?: number }) {
  const held = useHeld()
  /* a part is lit only while its step is the current one AND more steps follow: nothing stays lit once the build ends */
  const live = (k: number) => step === k && step < steps && !held
  const PW = 262
  const PH = 296
  const L = { x: 8, y: 7 }
  const R = { x: 296, y: 7 }
  const ROWS = [
    { icon: 'Hourglass', label: 'Long-Running Jobs', loop: 'sway' as Loop },
    { icon: 'Weight', label: 'Heavy State', loop: 'bob' as Loop },
    { steady: true, label: 'Steady Load' },
  ]
  return (
    <Frame w={566} h={310}>
      {/* BaaS: three ready-made backend pieces */}
      <Panel x={L.x} y={L.y} w={PW} h={PH} on={step >= 1} lit={live(1)}>
        <Ico x={40} y={40} s={40} icon="Boxes" loop="bob" />
        <Cap x={70} y={40} align="left" size={18} weight={700}>
          BaaS
        </Cap>
      </Panel>
      <Ico x={L.x + PW / 2} y={L.y + 132} s={84} lib="lib:database" loop="bob" on={step >= 1} delay={120} />
      <Ico x={L.x + PW / 2 - 64} y={L.y + 232} s={70} lib="lib:shield-lock" loop="bob" on={step >= 1} delay={240} ph={0.8} />
      <Ico x={L.x + PW / 2 + 64} y={L.y + 232} s={70} lib="lib:data-storage" loop="bob" on={step >= 1} delay={360} ph={1.6} />
      {/* Anti-Patterns: three workload shapes */}
      <Panel x={R.x} y={R.y} w={PW} h={PH} on={step >= 2} lit={live(2)}>
        <Ico x={40} y={40} s={40} icon="TriangleAlert" tone={colors.accent} loop="pulse" />
        <Cap x={70} y={40} align="left" size={18} weight={700}>
          Anti-Patterns
        </Cap>
      </Panel>
      {ROWS.map((r, i) => {
        const y = R.y + 112 + i * 72
        const on = step >= 3
        return r.steady ? (
          <div key={i}>
            <SteadyTile x={R.x + 52} y={y} on={on} delay={i * 160} />
            <Show on={on} delay={i * 160} style={{ position: 'absolute', left: R.x + 88, top: y - 9, zIndex: 7, fontFamily: HEAD, fontWeight: 600, fontSize: 15, lineHeight: 1.2, color: colors.ink, whiteSpace: 'nowrap' }}>
              {r.label}
            </Show>
          </div>
        ) : (
          <Ico key={i} x={R.x + 52} y={y} s={48} icon={r.icon} loop={r.loop} on={on} delay={i * 160} label={r.label} labelSide="right" ph={i * 0.7} />
        )
      })}
    </Frame>
  )
}

/* ------------------------------------------------------------------ 38 · T19 · a phone call to reception, mirrored by an API call */

function C_T19({ step, steps = 3 }: { step: number; steps?: number }) {
  const held = useHeld()
  /* a part is lit only while its step is the current one AND more steps follow: nothing stays lit once the build ends */
  const live = (k: number) => step === k && step < steps && !held
  const TY = 92
  const BY = 248
  const DX = 432
  return (
    <Frame w={590} h={322}>
      {/* the everyday call: a phone rings through to the hotel's reception desk */}
      <Ico x={78} y={TY} s={66} icon="PhoneCall" loop="wiggle" on={step >= 1} lit={live(1)} label="Phone Call" />
      <Line x1={124} y1={TY} x2={DX - 92} y2={TY} on={step >= 1} delay={200} dur={2.2} />
      {/* the receptionist stands BEHIND the desk (legs hidden by it), turned to face the incoming call */}
      <Show on={step >= 1} delay={300} style={{ position: 'absolute', left: DX - 86, top: TY - 76, width: 176, height: 140, zIndex: 4 }}>
        <img src={receptionUrl} alt="" aria-hidden draggable={false} style={{ position: 'absolute', left: 52, top: 0, height: 130, display: 'block', transform: 'scaleX(-1)' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 62, borderRadius: 14, background: 'linear-gradient(180deg, #2D63FB 0%, #1E47C7 100%)', boxShadow: '0 12px 22px -14px rgba(16,32,58,0.6), inset 0 2px 0 0 rgba(255,255,255,0.25)' }} />
        <span style={{ position: 'absolute', left: 18, bottom: 14, display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: 9, background: colors.white, color: colors.brand }}>
          <Icon name="Hotel" size={20} />
        </span>
        <span className="c3-loop c3-bob" style={{ position: 'absolute', right: 16, bottom: 62, display: 'grid', placeItems: 'center', color: '#F2C14E', animationDelay: '-0.6s' }}>
          <Icon name="ConciergeBell" size={30} />
        </span>
      </Show>
      {/* the mirror: an application's API call goes to a cloud database */}
      <span aria-hidden style={{ position: 'absolute', left: 20, right: 20, top: (TY + BY) / 2 + 2, height: 1.5, background: colors.line, opacity: step >= 2 ? 1 : 0, transition: held ? 'none' : `opacity ${MOTION.reveal}ms ${EASE}` }} />
      <Ico x={78} y={BY} s={66} icon="AppWindow" loop="bob" on={step >= 2} lit={live(2)} label="API Call" />
      <Line x1={124} y1={BY} x2={DX - 62} y2={BY} on={step >= 2} delay={200} dur={2.2} ph={1.1} />
      <Show on={step >= 2} delay={300} style={{ position: 'absolute', left: DX - 58, top: BY - 50, width: 116, height: 100, zIndex: 4 }}>
        <span className="c3-loop c3-float" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#D6E2FF' }}>
          <Icon name="Cloud" size={116} />
        </span>
      </Show>
      <Ico x={DX} y={BY + 6} s={56} src={dynamoUrl} tone="#4D27AA" loop="ring" on={step >= 2} delay={420} />
      {/* billed per request: a coin each time a call lands */}
      <Ico x={DX + 104} y={BY + 4} s={44} icon="Coins" tone={colors.brand} loop="pulse" on={step >= 3} lit={live(3)} />
    </Frame>
  )
}

/* ------------------------------------------------------------------ 41 · T20-B · direct API calls to three managed services */

function C_T20B({ step, steps = 3 }: { step: number; steps?: number }) {
  const held = useHeld()
  /* a part is lit only while its step is the current one AND more steps follow: nothing stays lit once the build ends */
  const live = (k: number) => step === k && step < steps && !held
  const AX = 160
  const AY = 190
  const MX = 742
  const T = [
    { y: 70, src: dynamoUrl, label: 'DynamoDB', tone: '#4D27AA' },
    { y: 190, src: cognitoUrl, label: 'Cognito', tone: '#DD344C' },
    { y: 310, src: s3Url, label: 'S3', tone: '#3F8624' },
  ]
  return (
    <Frame w={960} h={372}>
      <Show on={step >= 1} style={{ position: 'absolute', left: 340, top: 0, width: 280, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, zIndex: 7, fontFamily: HEAD, fontWeight: 600, fontSize: 16, color: colors.ink, whiteSpace: 'nowrap' }}>
        <span className="c3-loop c3-bob" style={{ display: 'grid', placeItems: 'center', color: colors.brand }}>
          <Icon name="Plug" size={20} />
        </span>
        Direct API Call
      </Show>
      <Ico x={AX} y={AY} s={128} lib="lib:laptop-front" loop="bob" on={step >= 1} lit={false} />
      <Ico x={AX} y={AY + 2} s={34} icon="AppWindow" loop="none" on={step >= 1} tone={colors.brand} />
      {T.map((t, i) => {
        const on = step >= i + 1
        const dy = t.y - AY
        return (
          <div key={t.label}>
            <Line x1={AX + 72} y1={AY + dy * 0.12} x2={MX - 50} y2={t.y} on={on} delay={100} dur={2.3} ph={i * 0.75} />
            <Ico x={MX} y={t.y} s={76} src={t.src} tone={t.tone} loop="ring" on={on} delay={260} ph={i * 0.8} lit={live(i + 1)} label={t.label} labelSide="right" />
          </div>
        )
      })}
    </Frame>
  )
}

/* ------------------------------------------------------------------ 42 · T21 · a taxi meter ticking beside a parked owned car */

function TaxiMeter({ x, y }: { x: number; y: number }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: 150, height: 46, borderRadius: 12, background: 'linear-gradient(180deg, #1F2E63 0%, #142048 100%)', boxShadow: '0 10px 20px -12px rgba(16,32,58,0.6), inset 0 1px 0 0 rgba(255,255,255,0.18)', zIndex: 5 }}>
      <span style={{ position: 'absolute', left: 10, top: 10, width: 98, height: 26, borderRadius: 6, background: '#0B1533', boxShadow: 'inset 0 0 0 1px rgba(242,193,78,0.35)' }} />
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} aria-hidden className="c3-loop c3-tick" style={{ position: 'absolute', left: 16 + i * 18, top: 16, width: 12, height: 14, borderRadius: 3, background: '#F2C14E', animationDelay: `${i * 0.5}s` }} />
      ))}
      <span aria-hidden className="c3-loop c3-flag" style={{ position: 'absolute', right: 12, top: 9, width: 20, height: 28, borderRadius: 5, background: '#F2C14E', transformOrigin: '50% 100%' }} />
    </div>
  )
}

function C_T21({ step, steps = 2 }: { step: number; steps?: number }) {
  const held = useHeld()
  /* a part is lit only while its step is the current one AND more steps follow: nothing stays lit once the build ends */
  const live = (k: number) => step === k && step < steps && !held
  const PW = 262
  const PH = 286
  return (
    <Frame w={566} h={300}>
      {/* per ride: the taxi's meter runs and the coins pile up */}
      <Panel x={8} y={7} w={PW} h={PH} on={step >= 1} lit={live(1)} />
      <Ico x={8 + PW / 2} y={92} s={104} icon="CarTaxiFront" tone="#1F2E63" plate="linear-gradient(160deg, #FFE08A 0%, #F2C14E 100%)" loop="bob" on={step >= 1} delay={120} />
      <Show on={step >= 1} delay={240}>
        <TaxiMeter x={8 + PW / 2 - 75} y={166} />
      </Show>
      <Show on={step >= 1} delay={300} style={{ position: 'absolute', left: 8, top: 236, width: PW, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, zIndex: 7, fontFamily: HEAD, fontWeight: 600, fontSize: 16, color: colors.ink }}>
        <span className="c3-loop c3-pulse" style={{ display: 'grid', placeItems: 'center', color: colors.brand }}>
          <Icon name="Coins" size={20} />
        </span>
        Per-Ride Cost
      </Show>
      {/* owned: the car stays parked, one fixed cost */}
      <Panel x={296} y={7} w={PW} h={PH} on={step >= 2} lit={live(2)} />
      <Ico x={296 + PW / 2} y={92} s={104} icon="Car" tone={colors.white} plate="linear-gradient(160deg, #5B86FF 0%, #2D63FB 100%)" loop="none" on={step >= 2} delay={120} />
      <Ico x={296 + PW / 2 + 86} y={50} s={40} icon="SquareParking" tone={colors.brand} loop="pulse" on={step >= 2} delay={220} />
      <Show on={step >= 2} delay={240} style={{ position: 'absolute', left: 296 + PW / 2 - 75, top: 166, width: 150, height: 46, borderRadius: 12, ...TILE_SKIN, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, zIndex: 5, color: colors.brand }}>
        <span className="c3-loop c3-sway" style={{ display: 'grid', placeItems: 'center' }}>
          <Icon name="KeyRound" size={22} />
        </span>
        <span aria-hidden style={{ width: 70, height: 6, borderRadius: 6, background: colors.brand }} />
      </Show>
      <Show on={step >= 2} delay={300} style={{ position: 'absolute', left: 296, top: 236, width: PW, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, zIndex: 7, fontFamily: HEAD, fontWeight: 600, fontSize: 16, color: colors.ink }}>
        <span style={{ display: 'grid', placeItems: 'center', color: colors.brand }}>
          <Icon name="Wallet" size={20} />
        </span>
        Fixed Cost
      </Show>
    </Frame>
  )
}

/* ------------------------------------------------------------------ 44 · T22 · the three anti-patterns, each better fit in its own colour */

const FIT = [
  { tone: '#0E9F8E', tint: '#E3F6F3', icon: 'Container' },
  { tone: '#7B4DFF', tint: '#EEE8FF', icon: 'HardDrive' },
  { tone: '#16A34A', tint: '#E5F6EA', icon: 'Server' },
]
const ROW_ICON = ['Hourglass', 'Weight', 'Activity']

function C_T22({ step, rows = [], columns = [] }: { step: number; rows?: string[][]; columns?: string[] }) {
  const COL_ICON = ['TriangleAlert', 'CircleX', 'CircleCheck']
  return (
    <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
      <div style={{ width: 1060 }}>
        <VisualTable
          size={18}
          shown={STILL ? rows.length : step}
          columns={columns.map((c, i) => ({ label: c, weight: [0.85, 1.45, 1.3][i], icon: <Icon name={COL_ICON[i]} size={16} /> }))}
          rows={rows.map((r, i) => ({
            icon: (
              /* the engine table animates every header and row icon (cvx-ticon, FIG-35): no second loop here */
              <Icon name={ROW_ICON[i]} size={18} />
            ),
            cells: [
              <Rich key="a" text={r[0]} />,
              <Rich key="b" text={r[1]} />,
              <span key="c" className="flex items-center gap-2.5 rounded-[6px] px-3 py-2" style={{ background: FIT[i].tint, boxShadow: `inset 3px 0 0 0 ${FIT[i].tone}`, color: colors.ink }}>
                <span className={`${STILL ? '' : 'cvx-ticon '}grid shrink-0 place-items-center`} style={{ color: FIT[i].tone, animationDelay: `${-(columns.length + rows.length + i) * 0.45}s` }}>
                  <Icon name={FIT[i].icon} size={18} />
                </span>
                <span className="min-w-0">
                  <Rich text={r[2]} />
                </span>
              </span>,
            ],
          }))}
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ 45 · T22-B · cost against utilisation, the break-even band */

function C_T22B({ step }: { step: number }) {
  const held = useHeld()
  const X0 = 118
  const X1 = 870
  const YT = 34
  const YB = 286
  const ux = (u: number) => X0 + u * (X1 - X0)
  /* per invocation: cost rises with utilisation; reserved: flat; they meet at 40% */
  const pY = (u: number) => YB - 14 - u * (YB - 14 - 52)
  const R = pY(0.4)
  const draw = (on: boolean, delay = 0): CSSProperties => ({ strokeDashoffset: on ? 0 : 1, transition: held ? 'none' : `stroke-dashoffset 900ms ${EASE} ${on ? delay : 0}ms` })
  const fade = (on: boolean, delay = 0): CSSProperties => ({ opacity: on ? 1 : 0, transition: held ? 'none' : `opacity ${MOTION.reveal}ms ${EASE} ${on ? delay : 0}ms` })
  return (
    <Frame w={940} h={344}>
      {/* the break-even band: 40% only as a rough guide */}
      <div style={{ position: 'absolute', left: ux(0.3), top: YT, width: ux(0.5) - ux(0.3), height: YB - YT, borderRadius: 10, background: 'linear-gradient(180deg, rgba(45,99,251,0.05) 0%, rgba(45,99,251,0.14) 100%)', ...fade(step >= 3) }} />
      <svg aria-hidden width={940} height={344} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', zIndex: 2 }}>
        <line x1={X0} y1={YB} x2={X1 + 18} y2={YB} stroke={colors.muted} strokeWidth={2} strokeLinecap="round" />
        <line x1={X0} y1={YB} x2={X0} y2={YT - 10} stroke={colors.muted} strokeWidth={2} strokeLinecap="round" />
        <polygon points={`${X1 + 28},${YB} ${X1 + 17},${YB - 5.5} ${X1 + 17},${YB + 5.5}`} fill={colors.muted} />
        <polygon points={`${X0},${YT - 20} ${X0 - 5.5},${YT - 9} ${X0 + 5.5},${YT - 9}`} fill={colors.muted} />
        <line x1={ux(0.4)} y1={YT + 6} x2={ux(0.4)} y2={YB} stroke={colors.brand} strokeWidth={1.5} strokeDasharray="5 6" style={fade(step >= 3, 200)} />
        <line x1={X0} y1={pY(0)} x2={X1} y2={pY(1)} stroke={colors.brand} strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray={1} style={draw(step >= 1)} />
        <line x1={X0} y1={R} x2={X1} y2={R} stroke="#16A34A" strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray={1} style={draw(step >= 2)} />
        <circle cx={ux(0.4)} cy={R} r={7} fill={colors.white} stroke={colors.brand} strokeWidth={3} style={fade(step >= 3, 300)} />
      </svg>
      {/* the scan: one utilisation level sweeping across, a dot riding each cost line */}
      {step >= 3 && !held && (
        <div aria-hidden className="c3-loop c3-scan" style={{ position: 'absolute', left: X0, top: YT, width: 0, height: YB - YT, zIndex: 3, ['--run' as string]: `${X1 - X0}px` }}>
          <span style={{ position: 'absolute', left: -1, top: 0, width: 2, height: YB - YT, background: `${colors.brand}40` }} />
        </div>
      )}
      {step >= 3 && !held && <span aria-hidden className="c3-loop c3-scanup" style={{ position: 'absolute', left: X0 - 6, top: pY(0) - 6, width: 12, height: 12, borderRadius: 99, background: colors.brand, boxShadow: `0 0 0 3px ${colors.brand}33`, zIndex: 4, ['--run' as string]: `${X1 - X0}px`, ['--rise' as string]: `${pY(1) - pY(0)}px` }} />}
      {step >= 3 && !held && <span aria-hidden className="c3-loop c3-scan" style={{ position: 'absolute', left: X0 - 6, top: R - 6, width: 12, height: 12, borderRadius: 99, background: '#16A34A', boxShadow: '0 0 0 3px #16A34A33', zIndex: 4, ['--run' as string]: `${X1 - X0}px` }} />}
      {/* labels: DOM text */}
      <Cap x={X0 - 14} y={YT - 14} align="right" size={15}>
        Cost
      </Cap>
      <Cap x={X1 + 26} y={YB + 26} align="right" size={15}>
        Utilisation
      </Cap>
      <Show on={step >= 1} delay={500} style={{ position: 'absolute', left: ux(0.6), top: pY(0.85) - 46, zIndex: 7, display: 'flex', alignItems: 'center', gap: 8, fontFamily: HEAD, fontWeight: 600, fontSize: 16, color: colors.ink, whiteSpace: 'nowrap' }}>
        <span className="c3-loop c3-bob" style={{ display: 'grid', placeItems: 'center', color: colors.brand }}>
          <Icon name="Zap" size={20} />
        </span>
        Per Invocation
      </Show>
      <Show on={step >= 2} delay={500} style={{ position: 'absolute', right: 940 - X1, top: R + 14, zIndex: 7, display: 'flex', alignItems: 'center', gap: 8, fontFamily: HEAD, fontWeight: 600, fontSize: 16, color: colors.ink, whiteSpace: 'nowrap' }}>
        <span className="c3-loop c3-pulse" style={{ display: 'grid', placeItems: 'center', color: '#16A34A' }}>
          <Icon name="Server" size={20} />
        </span>
        Reserved
      </Show>
      <Show on={step >= 3} delay={300} style={{ position: 'absolute', left: ux(0.4), top: YB + 10, transform: 'translateX(-50%)', zIndex: 7, fontFamily: HEAD, fontWeight: 700, fontSize: 17, color: colors.brand, whiteSpace: 'nowrap' }}>
        40%
      </Show>
      <Show on={step >= 3} delay={400} style={{ position: 'absolute', left: ux(0.4), top: YT - 26, transform: 'translateX(-50%)', zIndex: 7, display: 'flex', alignItems: 'center', gap: 6, fontFamily: HEAD, fontWeight: 600, fontSize: 15, color: colors.ink, whiteSpace: 'nowrap' }}>
        <Icon name="Compass" size={18} />
        Rough Guide
      </Show>
    </Frame>
  )
}

/* ------------------------------------------------------------------ 53 · P04 · L_Compare, two summaries side by side */

const CARD = '0 6px 18px -14px rgba(16,32,58,0.35)'

/** a lead with "\n" between its sentences: one line each (rule 36) */
const Lines = ({ text }: { text: string }) => (
  <>
    {text.split('\n').map((l, i) => (
      <span key={i} className="block">
        <Rich text={l} />
      </span>
    ))}
  </>
)

type CompareShot = { image: string; caption: string; icon?: string; rings?: [number, number, number, number][] }

/* box heights from the text they hold (17px body, ~8.4 px a character, 23.4 px a line, 26 px of padding and border) */
const boxH = (text: string, width: number) => {
  const per = Math.max(10, Math.floor((width - 66) / 8.4))
  return 26 + 23.4 * text.split('\n').reduce((a, l) => a + Math.max(1, Math.ceil(l.length / per)), 0)
}

/*
  BOTH CAPTURES WHOLE (Session 10 review, FIG-35: never cropped, own aspect ratio, contain). The tall capture takes the
  right column at the full body height; the wide one takes the left column with the note under it. Each caption box
  sits level with the top of its capture; rings are drawn inside their targets by `ShotImage` and clamped to the image.
*/
function L_Compare({ id, kicker, title, lead, shots, note, lesson }: { id: string; kicker: string; title: string; lead?: string; shots: CompareShot[]; note?: string; lesson: string }) {
  const all = shots.flatMap((s, si) => (s.rings ?? []).map((_, ri) => ({ si, ri })))
  const lit = useBuild(all.length + 1, MOTION.build, MOTION.buildLead)
  const held = motionHeld(useInstant())
  const shown = STILL ? all.length : lit
  const GAP = 28
  const GY = 12
  const leadLines = lead ? lead.split('\n').reduce((a, l) => a + Math.ceil(l.length / 78), 0) : 0
  const avail = 640 - (leadLines ? 162 + leadLines * 33 + 28 : 221)
  const dim = (img: string) => (dims as Record<string, [number, number]>)[img] ?? [1600, 900]
  const asp = shots.map((s) => { const [w, h] = dim(s.image); return w / h })
  const tall = asp[0] < asp[1] ? 0 : 1
  const wide = 1 - tall
  /* settle the two column widths: the tall capture's width follows its height, which follows its caption's wrap */
  let wT = 360
  for (let n = 0; n < 4; n++) wT = Math.round((avail - boxH(shots[tall].caption, wT) - GY) * asp[tall])
  const capT = boxH(shots[tall].caption, wT)
  const hT = Math.round(wT / asp[tall])
  const colW = BOX_W - GAP - wT
  const capW = boxH(shots[wide].caption, colW)
  const noteH = note ? boxH(note, colW) + GY : 0
  const hW = Math.round(Math.min(colW / asp[wide], avail - capW - GY - noteH))
  const wW = Math.round(hW * asp[wide])
  const size = [0, 0].map((_, i) => (i === tall ? [wT, hT] : [wW, hW]))
  const order = [wide, tall]
  return (
    <Card id={id} kicker={kicker} title={title} lead={lead ? <Lines text={lead} /> : undefined} lesson={lesson}>
      <div className="flex items-start" style={{ width: BOX_W, gap: GAP }}>
        {order.map((si) => {
          const s = shots[si]
          const [w, h] = size[si]
          const [nw] = dim(s.image)
          const before = all.findIndex((a) => a.si === si)
          const colWidth = si === tall ? wT : colW
          return (
            <div key={si} className="flex shrink-0 flex-col" style={{ width: colWidth, gap: GY }}>
              <div className="flex items-start gap-3 rounded-[14px] border border-line bg-white px-4 py-3" style={{ boxShadow: CARD }}>
                <span className="mt-[2px] shrink-0 c3-loop c3-bob" style={{ color: colors.brand, animationDelay: `${-si * 0.9}s` }}>
                  <Icon name={s.icon ?? 'Info'} size={20} />
                </span>
                <span className="l-nw text-[17px] leading-snug" style={{ color: colors.ink }}>
                  <Rich text={s.caption} />
                </span>
              </div>
              <ShotImage image={s.image} w={w} h={h} k={w / nw} rings={s.rings ?? []} shown={Math.max(0, shown - before)} held={held} />
              {si === wide && note && (
                <div className="flex items-start gap-3 rounded-[14px] border border-line bg-white px-4 py-3" style={{ boxShadow: CARD }}>
                  <span className="mt-[2px] shrink-0 c3-loop c3-pulse" style={{ color: colors.brand }}>
                    <Icon name="Calculator" size={20} />
                  </span>
                  <span className="l-nw text-[17px] leading-snug" style={{ color: colors.ink }}>
                    <Lines text={note} />
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ registry */

type Fig = (p: Record<string, unknown>) => ReactNode
const fig = (C: unknown) => C as Fig

export const figures: Record<string, Fig> = {
  C_T18: fig(C_T18),
  C_T19: fig(C_T19),
  C_T20B: fig(C_T20B),
  C_T21: fig(C_T21),
  C_T22: fig(C_T22),
  C_T22B: fig(C_T22B),
}

export const slides: Record<string, Fig> = {
  L_Compare: fig(L_Compare),
}

/* the loops: quiet, continuous, no rest between cycles (R8.1); all held on harness URLs, thumbnails and reduced motion */
export const css = `
@keyframes c3-bob { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
@keyframes c3-float { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }
@keyframes c3-sway { 0%, 100% { transform: rotate(-7deg) } 50% { transform: rotate(7deg) } }
@keyframes c3-wiggle { 0%, 40%, 100% { transform: rotate(0) } 8% { transform: rotate(-12deg) } 16% { transform: rotate(12deg) } 24% { transform: rotate(-9deg) } 32% { transform: rotate(9deg) } }
@keyframes c3-pulse { 0%, 100% { transform: scale(1) } 50% { transform: scale(1.06) } }
@keyframes c3-ring { 0% { transform: scale(1); opacity: 0.55 } 100% { transform: scale(1.32); opacity: 0 } }
@keyframes c3-ride { 0% { transform: translate(0, 0); opacity: 0 } 12% { opacity: 1 } 88% { opacity: 1 } 100% { transform: translate(var(--dx), var(--dy)); opacity: 0 } }
@keyframes c3-glide { 0% { transform: translateX(0); opacity: 0 } 12% { opacity: 1 } 88% { opacity: 1 } 100% { transform: translateX(var(--run)); opacity: 0 } }
@keyframes c3-scan { 0% { transform: translateX(0); opacity: 0 } 6% { opacity: 1 } 94% { opacity: 1 } 100% { transform: translateX(var(--run)); opacity: 0 } }
@keyframes c3-scanup { 0% { transform: translate(0, 0); opacity: 0 } 6% { opacity: 1 } 94% { opacity: 1 } 100% { transform: translate(var(--run), var(--rise)); opacity: 0 } }
@keyframes c3-tick { 0%, 8% { opacity: 0.18 } 14%, 92% { opacity: 1 } 100% { opacity: 0.18 } }
@keyframes c3-flag { 0%, 100% { transform: rotate(0) } 50% { transform: rotate(-14deg) } }
.c3-bob { animation: c3-bob 2.6s cubic-bezier(0.45,0,0.55,1) infinite; }
.c3-float { animation: c3-float 3.2s cubic-bezier(0.45,0,0.55,1) infinite; }
.c3-sway { animation: c3-sway 2.8s cubic-bezier(0.45,0,0.55,1) infinite; transform-origin: 50% 60%; }
.c3-wiggle { animation: c3-wiggle 2.4s cubic-bezier(0.45,0,0.55,1) infinite; transform-origin: 50% 60%; }
.c3-pulse { animation: c3-pulse 2.4s cubic-bezier(0.45,0,0.55,1) infinite; }
.c3-ring { animation: c3-ring 2.4s cubic-bezier(0.22,1,0.36,1) infinite; }
.c3-glide { animation: c3-glide 2.4s linear infinite; }
.c3-scan, .c3-scanup { animation-duration: 6s; animation-timing-function: linear; animation-iteration-count: infinite; }
.c3-scan { animation-name: c3-scan; }
.c3-scanup { animation-name: c3-scanup; }
.c3-tick { animation: c3-tick 2.5s linear infinite; }
.c3-flag { animation: c3-flag 2.5s cubic-bezier(0.45,0,0.55,1) infinite; }
.cc-still .c3-loop, .deck-thumb .c3-loop { animation: none !important; }
.cc-still .c3-dot, .deck-thumb .c3-dot, .cc-still .c3-scan, .deck-thumb .c3-scan, .cc-still .c3-scanup, .deck-thumb .c3-scanup, .cc-still .c3-glide, .deck-thumb .c3-glide { display: none !important; }
.cc-still .c3-ring, .deck-thumb .c3-ring { opacity: 0 !important; }
@media (prefers-reduced-motion: reduce) { .c3-loop { animation: none !important; } .c3-dot, .c3-scan, .c3-scanup, .c3-glide { display: none !important; } .c3-ring { opacity: 0 !important; } }
`
