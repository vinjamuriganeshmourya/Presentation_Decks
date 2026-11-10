import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { TILE_SKIN } from '@/decks/figures/card'
import { Arrow, At, BOX_W, Card, Fade, Label, REDUCED, STILL, Stage, useBuild, useLoop } from '@/decks/figures/scene'
import { NoMark } from '@/decks/figures/net/frames'
import { Icon, Rich } from '@/engine/icon'
import { Diagram, diagramSteps } from '@/engine/Diagram'
import type { Figure } from '@/engine/types'
import elbSvg from '../images/aws-elb.svg'

/**
 * BUILDER C · Section 4 (Health Checks & Sessions) custom figures.
 *   C_TopicCards     T13  three linked cards: Health Checks (heartbeat), Draining (tap closing), Sessions (cookie)
 *   C_HealthCards    T14  (a whole slide) the lead, one wide check strip with the four brackets, the four points as four cards
 *   C_DelayTimer     T15-B the deregistration delay: new requests stopped, in-flight ones finishing, the rest closed at 300 s
 * Every label is DOM text; loops are CSS (`x-` classes) held on `?still`, thumbnails and reduced motion.
 */

const EASE = 'cubic-bezier(0.22,1,0.36,1)'
/* the tones the engine's own Label uses (scene.tsx LABEL): ink a shade darker than the hue, tint a shade lighter */
const TONE = {
  good: { hue: colors.success, ink: '#137A3A', tint: '#E9F8EF' },
  warn: { hue: colors.warning, ink: '#9A5B00', tint: '#FFF4E0' },
  teal: { hue: colors.teal, ink: colors.tealDark, tint: `${colors.teal}1A` },
  bad: { hue: colors.danger, ink: colors.danger, tint: '#FDECEC' },
  brand: { hue: colors.brand, ink: colors.brandDark, tint: colors.surface2 },
} as const
type ToneName = keyof typeof TONE

const held = () => STILL || REDUCED

/** a loop class, or none when the frame must hold still */
function useLoopClass(cls: string): string {
  const instant = useInstant()
  return held() || instant ? '' : cls
}

/* ================================================================== T13 */

/** the heartbeat: a heart that beats and an ECG trace whose bright stretch runs along it */
function HeartArt() {
  const beat = useLoopClass('x-beat')
  const run = useLoopClass('x-ecg')
  const t = TONE.good
  return (
    <div className="relative flex items-center gap-3" style={{ width: 230, height: 70 }}>
      <span className={`grid shrink-0 place-items-center rounded-[16px] ${beat}`} style={{ width: 58, height: 58, ...TILE_SKIN, color: t.hue }}>
        <Icon name="HeartPulse" size={32} />
      </span>
      <svg width={160} height={56} viewBox="0 0 160 56" aria-hidden>
        <path d="M2 30 H44 L52 30 L58 12 L66 48 L74 6 L82 40 L88 30 H158" fill="none" stroke={`${t.hue}55`} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        <path d="M2 30 H44 L52 30 L58 12 L66 48 L74 6 L82 40 L88 30 H158" fill="none" stroke={t.hue} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" pathLength={100} strokeDasharray="34 66" className={run} style={{ strokeDashoffset: run ? undefined : -40 }} />
      </svg>
    </div>
  )
}

/** the tap closing: a tap on a pipe, its handle turned toward shut, the flow thinning to single drops */
function TapArt() {
  const drip = useLoopClass('x-drip')
  const turn = useLoopClass('x-turn')
  const t = TONE.warn
  const metal = colors.brandDark
  return (
    <div className="relative" style={{ width: 230, height: 70 }}>
      <svg width={230} height={70} viewBox="0 0 230 70" aria-hidden className="absolute left-0 top-0">
        {/* pipe from the wall */}
        <rect x={40} y={20} width={70} height={14} rx={4} fill={`${metal}22`} stroke={metal} strokeWidth={2} />
        {/* tap body and spout */}
        <path d="M104 14 h24 a8 8 0 0 1 8 8 v8 h12 a8 8 0 0 1 8 8 v12 h-12 v-8 h-8 h-24 a8 8 0 0 1 -8 -8 z" fill="#FFFFFF" stroke={metal} strokeWidth={2.2} strokeLinejoin="round" />
        {/* the handle, turning shut */}
        <g className={turn} style={{ transformOrigin: '116px 12px', transformBox: 'view-box' } as CSSProperties}>
          <rect x={100} y={6} width={32} height={7} rx={3.5} fill={t.hue} />
          <rect x={113} y={8} width={6} height={10} rx={2} fill={metal} />
        </g>
        {/* the closing arrow over the handle */}
        <path d="M140 8 a20 20 0 0 1 12 12" fill="none" stroke={t.hue} strokeWidth={2} strokeLinecap="round" />
        <path d="M148 22 l5 -1 l-1 -5" fill="none" stroke={t.hue} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {[0, 1, 2].map((i) => (
        <span key={i} className={`absolute rounded-full ${drip}`} style={{ left: 147, top: 52, width: 7, height: 9, borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', background: colors.info, animationDelay: `${-i * 0.6}s`, opacity: drip ? undefined : i === 0 ? 1 : 0 }} />
      ))}
    </div>
  )
}

/** the cookie: a cookie tile bound to one server by a flowing tether */
function CookieArt() {
  const flow = useLoopClass('x-flow')
  const t = TONE.teal
  return (
    <div className="relative flex items-center" style={{ width: 230, height: 70 }}>
      <span className="grid shrink-0 place-items-center rounded-[16px]" style={{ width: 58, height: 58, ...TILE_SKIN, color: t.ink }}>
        <Icon name="Cookie" size={32} />
      </span>
      <svg width={84} height={20} viewBox="0 0 84 20" aria-hidden className="mx-2">
        <path d="M4 10 H70" stroke={t.hue} strokeWidth={2.5} strokeLinecap="round" />
        <path d="M4 10 H70" stroke="#FFFFFF" strokeWidth={1.2} strokeLinecap="round" strokeDasharray="5 9" className={flow} />
        <path d="M80 10 l-10 -5.5 v11 z" fill={t.hue} />
      </svg>
      <span className="grid shrink-0 place-items-center rounded-[16px]" style={{ width: 58, height: 58, ...TILE_SKIN, color: colors.brandDark }}>
        <Icon name="Server" size={30} />
      </span>
    </div>
  )
}

type TopicCard = { title: string; ask: string; answer: string; tone: ToneName; art: ReactNode }

function TopicCards({ step = 2, w = 1110, h = 300 }: { step?: number; w?: number; h?: number }) {
  const cards: TopicCard[] = [
    { title: 'Health Checks', ask: 'Is this backend working?', answer: 'The load balancer tests each backend regularly', tone: 'good', art: <HeartArt /> },
    { title: 'Draining', ask: 'How is a backend removed safely?', answer: 'Existing requests finish before it is taken out', tone: 'warn', art: <TapArt /> },
    { title: 'Sessions', ask: "Where do a user's next requests go?", answer: 'Sticky sessions send them to the same backend; stateless design lets any healthy backend serve them', tone: 'teal', art: <CookieArt /> },
  ]
  const side = 24
  const cw = 326
  const gap = (w - 3 * cw - 2 * side) / 2
  const top = 20
  const ch = h - 2 * top
  return (
    <div className="absolute inset-0">
      {cards.map((c, i) => {
        const x = side + i * (cw + gap)
        const t = TONE[c.tone]
        return (
          <At key={c.title} x={x} y={top} w={cw}>
            <Fade on={step >= i}>
              <div className="flex flex-col overflow-hidden rounded-[18px]" style={{ height: ch, ...TILE_SKIN }}>
                <div className="grid shrink-0 place-items-center" style={{ height: 84, background: `linear-gradient(180deg, ${t.tint} 0%, #FFFFFF 100%)`, boxShadow: `inset 0 -1px 0 ${colors.line}` }}>
                  {c.art}
                </div>
                <div className="flex flex-col gap-1 px-5 pt-3">
                  <span className="font-heading text-[22px] font-bold leading-tight" style={{ color: colors.ink }}>
                    {c.title}
                  </span>
                  {/* content rule 55 (user, 2026-11-06): blue is the only text-highlight colour, so the three questions are one blue */}
                  <span className="font-heading text-[17px] font-semibold leading-snug" style={{ color: colors.brand }}>
                    {c.ask}
                  </span>
                  <span className="text-[16px] leading-snug" style={{ color: colors.ink }}>
                    {c.answer}
                  </span>
                </div>
              </div>
            </Fade>
          </At>
        )
      })}
      {[0, 1].map((i) => {
        const x1 = side + (i + 1) * cw + i * gap + 7
        const x2 = x1 + gap - 14
        return <Arrow key={i} x1={x1} y1={top + 42} x2={x2} y2={top + 42} on={step >= i + 1} />
      })}
    </div>
  )
}

/* ================================================================== T14 */

function Disc({ state, size = 30 }: { state: 'wait' | 'pass' | 'fail'; size?: number }) {
  const instant = useInstant()
  const bg = state === 'pass' ? colors.success : state === 'fail' ? colors.danger : colors.white
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full"
      style={{ width: size, height: size, background: bg, color: colors.white, boxShadow: state === 'wait' ? `inset 0 0 0 2px ${colors.line}` : `0 6px 14px -8px ${bg}`, transition: instant ? 'none' : `background 420ms ${EASE}, box-shadow 420ms ${EASE}` }}
    >
      {state === 'pass' && <Icon name="Check" size={Math.round(size * 0.56)} />}
      {state === 'fail' && <Icon name="X" size={Math.round(size * 0.56)} />}
    </span>
  )
}

function Tile({ children, size = 56, tone = colors.brandDark }: { children: ReactNode; size?: number; tone?: string }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-[15px]" style={{ width: size, height: size, ...TILE_SKIN, color: tone }}>
      {children}
    </span>
  )
}

/** a bracket over a span of a strip, its chip centred above it */
function Bracket({ x1, x2, y, children, tone = colors.brand }: { x1: number; x2: number; y: number; children: ReactNode; tone?: string }) {
  return (
    <>
      <svg aria-hidden className="pointer-events-none absolute" style={{ left: x1 - 2, top: y - 2, overflow: 'visible' }} width={x2 - x1 + 4} height={14}>
        <path d={`M2 12 V2 H${x2 - x1 + 2} V12`} fill="none" stroke={tone} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <At x={(x1 + x2) / 2} y={y - 32} cx>
        {children}
      </At>
    </>
  )
}

/**
 * T14 (corrections 2026-11-06, slide 36): the hierarchy redone after the reference deck's frame 33. The lead on
 * top, ONE wide strip under it (the load balancer and the backend at its two ends, the request and reply between
 * them, six checks with the interval and timeout brackets above and the two threshold brackets below), and the
 * TR's four points as four cards in a row under the strip, the card the strip is acting out lit. The two
 * "Consecutive Passes / Failures" boxes are gone: the threshold brackets carry them on the strip itself.
 */
const STRIP_H = 214
function CheckStrip({ step = 4, w = BOX_W }: { step?: number; w?: number }) {
  const ping = useLoopClass('x-ping')
  const pong = useLoopClass('x-pong')
  const L = 210
  const R = w - 210
  const xs = Array.from({ length: 6 }, (_, i) => L + 50 + (i * (R - L - 100)) / 5)
  /* the request / reply labels sit mid-strip, the interval and timeout chips to either side of them, so one band holds both */
  const axisY = 114
  const state = (i: number): 'wait' | 'pass' | 'fail' => {
    if (i < 3) return step >= 3 ? 'pass' : 'wait'
    if (i === 3) return step >= 2 ? 'fail' : 'wait'
    return step >= 4 ? 'fail' : 'wait'
  }
  const midY = 98
  const lineL = L + 20
  const lineR = R - 20
  return (
    <div className="absolute inset-0">
      {/* the two ends */}
      <At x={L / 2 + 6} y={midY} cx cy>
        <div className="flex flex-col items-center gap-2">
          <img src={elbSvg} alt="" aria-hidden draggable={false} className="block select-none" style={{ width: 60, height: 60, borderRadius: 12, boxShadow: '0 10px 20px -14px rgba(16,32,58,0.5)' }} />
          <Label strong>Load Balancer</Label>
        </div>
      </At>
      <At x={w - L / 2 - 6} y={midY} cx cy>
        <div className="flex flex-col items-center gap-2">
          <Tile size={60}>
            <Icon name="Server" size={30} />
          </Tile>
          <Label strong>Backend</Label>
        </div>
      </At>

      {/* the test request out and the reply back */}
      <At x={(lineL + lineR) / 2} y={4} cx>
        <span className="block whitespace-nowrap text-[14px] font-semibold leading-none" style={{ color: colors.brandDark }}>
          Test Request
        </span>
      </At>
      <Arrow x1={lineL} y1={24} x2={lineR} y2={24} tone={colors.brand} />
      <Arrow x1={lineR} y1={38} x2={lineL} y2={38} tone={colors.success} />
      <span aria-hidden className={`absolute rounded-full ${ping}`} style={{ left: lineL - 6, top: 18, width: 12, height: 12, background: colors.brand, boxShadow: `0 0 0 4px ${colors.brand}33`, opacity: ping ? undefined : 0, '--x-run': `${lineR - lineL - 14}px` } as CSSProperties} />
      <span aria-hidden className={`absolute rounded-full ${pong}`} style={{ left: lineR - 6, top: 32, width: 12, height: 12, background: colors.success, boxShadow: `0 0 0 4px ${colors.success}33`, opacity: pong ? undefined : 0, '--x-run': `${-(lineR - lineL - 14)}px` } as CSSProperties} />
      <At x={(lineL + lineR) / 2} y={48} cx>
        <span className="block whitespace-nowrap text-[14px] font-semibold leading-none" style={{ color: TONE.good.ink }}>
          Reply
        </span>
      </At>

      {/* the strip of checks */}
      <svg aria-hidden className="pointer-events-none absolute" style={{ left: 0, top: axisY - 1 }} width={w} height={3}>
        <line x1={xs[0] - 40} y1={1.5} x2={xs[5] + 40} y2={1.5} stroke={colors.line} strokeWidth={3} strokeLinecap="round" />
      </svg>
      {xs.map((x, i) => (
        <At key={i} x={x} y={axisY - 15} cx>
          <Disc state={state(i)} />
        </At>
      ))}
      {xs.map((x, i) => (
        <At key={`t${i}`} x={x} y={axisY + 20} cx>
          <Fade on={step >= 1} lift={4}>
            <span className="whitespace-nowrap font-mono text-[14px] font-medium" style={{ color: colors.muted, fontVariantLigatures: 'none' }}>
              {i * 30} s
            </span>
          </Fade>
        </At>
      ))}
      <Fade on={step >= 1} className="absolute inset-0">
        <Bracket x1={xs[0]} x2={xs[1]} y={axisY - 30}>
          <Label tone="brand" strong icon={<Icon name="Repeat" size={14} />}>
            Interval
          </Label>
        </Bracket>
      </Fade>
      <Fade on={step >= 2} className="absolute inset-0">
        <Bracket x1={xs[3]} x2={xs[3] + 66} y={axisY - 30} tone={colors.warning}>
          <Label tone="warn" strong icon={<Icon name="Timer" size={14} />}>
            Timeout
          </Label>
        </Bracket>
      </Fade>

      {/* the two thresholds, under the runs of checks that reach them */}
      <Fade on={step >= 3} className="absolute inset-0">
        <Under x1={xs[0]} x2={xs[2]} y={axisY + 44} tone={colors.success}>
          <Label tone="good" strong icon={<Icon name="Check" size={14} />} iconRound>
            Healthy Threshold
          </Label>
        </Under>
      </Fade>
      <Fade on={step >= 4} className="absolute inset-0">
        <Under x1={xs[3]} x2={xs[5]} y={axisY + 44} tone={colors.danger}>
          <Label tone="bad" strong icon={<Icon name="X" size={14} />} iconRound>
            Unhealthy Threshold
          </Label>
        </Under>
      </Fade>
    </div>
  )
}

/** a bracket under a span of the strip, its chip centred below it */
function Under({ x1, x2, y, children, tone }: { x1: number; x2: number; y: number; children: ReactNode; tone: string }) {
  return (
    <>
      <svg aria-hidden className="pointer-events-none absolute" style={{ left: x1 - 2, top: y, overflow: 'visible' }} width={x2 - x1 + 4} height={14}>
        <path d={`M2 2 V12 H${x2 - x1 + 2} V2`} fill="none" stroke={tone} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <At x={(x1 + x2) / 2} y={y + 20} cx>
        {children}
      </At>
    </>
  )
}

/** a point's own words, its head (up to the colon) set bold so the four cards scan by name */
function HeadedText({ text }: { text: string }) {
  const k = text.indexOf(':')
  if (k < 0) return <Rich text={text} />
  return (
    <>
      <b className="font-heading font-semibold" style={{ color: colors.brandDark }}>
        {text.slice(0, k + 1)}
      </b>
      <Rich text={text.slice(k + 1)} />
    </>
  )
}

function HealthCardsSlide({ id, kicker, title, lead, points, lesson }: { id: string; kicker: string; title: string; lead: string; points: { text: string; icon: string }[]; lesson: string }) {
  const n = points.length
  const step = useBuild(n + 1)
  const ease = 'all 420ms cubic-bezier(0.22,1,0.36,1)'
  const gap = 16
  const cw = (BOX_W - gap * (n - 1)) / n
  return (
    <Card id={id} kicker={kicker} title={title} lead={lead} lesson={lesson}>
      <div className="flex flex-col" style={{ width: BOX_W, gap: 16 }}>
        <Stage w={BOX_W} h={STRIP_H} active={false}>
          <CheckStrip step={step} />
        </Stage>
        <div className="flex" style={{ gap }}>
          {points.map((p, i) => {
            const on = !STILL && step === i + 1
            return (
              <div
                key={i}
                className="flow-root rounded-2xl px-3.5 py-3"
                style={{
                  width: cw,
                  ...TILE_SKIN,
                  boxShadow: on ? `inset 0 0 0 2px ${colors.brand}, 0 12px 24px -14px ${colors.brand}` : TILE_SKIN.boxShadow,
                  background: on ? 'linear-gradient(180deg, #F4F8FF 0%, #E3ECFD 100%)' : TILE_SKIN.background,
                  transform: on ? 'translateY(-3px)' : 'none',
                  transition: ease,
                }}
              >
                {/* the icon floats at the card's corner and the words wrap round it: a short card, the name first */}
                <span aria-hidden className="float-left mr-2 grid h-[24px] w-[24px] place-items-center rounded-[7px]" style={{ background: on ? colors.brand : colors.surface2, color: on ? colors.white : colors.brand, transition: ease }}>
                  <Icon name={p.icon} size={15} />
                </span>
                <span className="text-[16px] leading-[24px]" style={{ color: colors.ink }}>
                  <HeadedText text={p.text} />
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

/* ================================================================== T15-B */

/**
 * The deregistration delay on a time strip, from deregistration (new requests stopped, three requests in flight),
 * one press per point: (1) the in-flight ones finishing in the grace period, (2) the delay's end at 300 s, the
 * AWS default, a target group setting, (3) the remaining connection closed there. After the build a cursor runs
 * the delay, over and over.
 */
function DelayTimer({ step = 3, w = 634, h = 380 }: { step?: number; w?: number; h?: number }) {
  const instant = useInstant()
  const t = useLoop(7000, { mode: 'sawtooth', still: 1 })
  const x0 = 206
  const x1 = w - 44
  const X = (f: number) => x0 + (x1 - x0) * f
  const lanes = [
    { y: 182, end: 0.34 },
    { y: 220, end: 0.66 },
    { y: 258, end: 1 },
  ]
  const axisY = 312
  const cursor = step >= 3 && !held() && !instant
  const fade = t < 0.06 ? t / 0.06 : t > 0.94 ? (1 - t) / 0.06 : 1
  void h
  return (
    <div className="absolute inset-0">
      {/* header */}
      <At x={20} y={18}>
        <div className="flex items-center gap-2.5">
          <span className="grid place-items-center rounded-[10px]" style={{ width: 36, height: 36, ...TILE_SKIN, color: colors.brandDark }}>
            <Icon name="Timer" size={20} />
          </span>
          <span className="font-heading text-[20px] font-semibold" style={{ color: colors.ink }}>
            Deregistration Delay
          </span>
        </div>
      </At>
      <At x={w - 20} y={24} style={{ transform: 'translateX(-100%)' }}>
        <Fade on={step >= 2} lift={4}>
          <Label tone="muted" strong icon={<Icon name="Settings" size={14} />}>
            Target Group Setting
          </Label>
        </Fade>
      </At>

      {/* (3) the grace period over the whole delay */}
      <Fade on={step >= 1} className="absolute inset-0">
        <Bracket x1={x0} x2={x1} y={98}>
          <Label tone="brand" strong>
            Grace Period
          </Label>
        </Bracket>
      </Fade>

      {/* (2) new requests: stopped as soon as deregistration starts */}
      <Fade on className="absolute inset-0">
        <At x={20} y={120}>
          <Label tone="bad" strong>
            New Requests
          </Label>
        </At>
        <Arrow x1={152} y1={132} x2={x0 - 16} y2={132} tone={colors.danger} />
        <At x={x0 - 12} y={120}>
          <NoMark size={24} />
        </At>
      </Fade>

      {/* (1) the in-flight requests */}
      <Fade on className="absolute inset-0">
        <At x={20} y={lanes[1].y - 22}>
          <span className="block font-heading text-[17px] font-semibold leading-tight" style={{ color: colors.ink, width: 130 }}>
            In-Flight Requests
          </span>
        </At>
        <svg aria-hidden className="pointer-events-none absolute" style={{ left: x0 - 34, top: lanes[0].y - 8 }} width={14} height={lanes[2].y - lanes[0].y + 16}>
          <path d={`M2 2 H10 V${lanes[2].y - lanes[0].y + 14} H2`} fill="none" stroke={colors.line} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Fade>
      {lanes.map((l, i) => {
        const last = i === 2
        const endX = last ? X(1) : X(l.end)
        return (
          <div key={i}>
            <At x={x0} y={l.y - 7}>
              <span className="block rounded-full" style={{ width: endX - x0 - 14, height: 14, background: `linear-gradient(90deg, ${colors.brand}40 0%, ${colors.brand} 100%)`, opacity: 1, transition: instant ? 'none' : `opacity 420ms ${EASE} ${i * 140}ms` }} />
            </At>
            <At x={endX} y={l.y - 13} cx>
              <Fade on={last ? step >= 3 : step >= 1} lift={4} delay={i * 160}>
                <span className="grid place-items-center rounded-full" style={{ width: 26, height: 26, background: last ? colors.danger : colors.success, color: colors.white, boxShadow: `0 6px 14px -8px ${last ? colors.danger : colors.success}` }}>
                  <Icon name={last ? 'X' : 'Check'} size={15} />
                </span>
              </Fade>
            </At>
          </div>
        )
      })}

      {/* (2) the end of the delay at 300 s */}
      <Fade on={step >= 2} className="absolute inset-0">
        <svg aria-hidden className="pointer-events-none absolute" style={{ left: X(1) - 1, top: 114 }} width={3} height={axisY - 114}>
          <line x1={1.5} y1={0} x2={1.5} y2={axisY - 114} stroke={colors.danger} strokeWidth={2} strokeDasharray="5 6" />
        </svg>
      </Fade>

      {/* (3) the remaining connection, closed at the end */}
      <At x={X(1) - 10} y={lanes[2].y + 16} style={{ transform: 'translateX(-100%)' }}>
        <Fade on={step >= 3} lift={4}>
          <Label tone="bad" strong>
            Remaining Connections Closed
          </Label>
        </Fade>
      </At>

      {/* the axis */}
      <svg aria-hidden className="pointer-events-none absolute" style={{ left: x0, top: axisY - 1 }} width={x1 - x0} height={4}>
        <line x1={1.5} y1={1.5} x2={x1 - x0 - 1.5} y2={1.5} stroke={colors.line} strokeWidth={3} strokeLinecap="round" />
      </svg>
      <At x={x0} y={axisY + 8} cx>
        <span className="whitespace-nowrap font-mono text-[14px] font-semibold" style={{ color: colors.ink }}>
          0 s
        </span>
      </At>
      <At x={X(1)} y={axisY + 8} cx>
        <span className="whitespace-nowrap font-mono text-[14px] font-semibold" style={{ color: colors.ink }}>
          300 s
        </span>
      </At>
      <At x={x0 - 8} y={axisY + 34} style={{ transform: 'translateX(-50%)' }}>
        <Fade on lift={4}>
          <span className="whitespace-nowrap text-[14px] font-medium" style={{ color: colors.muted }}>
            Deregistration Starts
          </span>
        </Fade>
      </At>
      <At x={X(1) + 24} y={axisY + 30} style={{ transform: 'translateX(-100%)' }}>
        <Fade on={step >= 2} lift={4}>
          <Label tone="warn" strong>
            AWS Default
          </Label>
        </Fade>
      </At>

      {/* time passing: a cursor that runs the delay from start to end, over and over */}
      {cursor && <span aria-hidden className="pointer-events-none absolute" style={{ left: X(t) - 1, top: lanes[0].y - 22, width: 2, height: axisY - lanes[0].y + 22, background: colors.brandDark, opacity: 0.5 * fade, borderRadius: 2 }} />}
    </div>
  )
}

/* ================================================================== the lead slide, one sentence per line */

/**
 * ENGINE GAP (deck-engine 2026-11-05): the `lead` layout prints its lead as one inline paragraph, so a lead of
 * two TR sentences runs on one line (text policy 2, content rule 36: two sentences are two lines). This is the
 * `lead` layout as `render.tsx` draws it (Card, a centred 20px lead, the figure on a Stage, one build track),
 * with the lead given as `lines`, each its own block. The figure is a `diagram` spec or one of this file's figures.
 */
const FIGS: Record<string, (p: { step?: number; w?: number; h?: number }) => ReactNode> = { C_TopicCards: TopicCards, C_DelayTimer: DelayTimer }
function LeadLinesSlide({ id, kicker, title, lines, figure, figW = 760, figH = 360, gap = 20, lesson }: { id: string; kicker: string; title: string; lines: string[]; figure: Figure; figW?: number; figH?: number; gap?: number; lesson: string }) {
  const Custom = figure.type === 'custom' ? FIGS[figure.name] : undefined
  const n = figure.type === 'diagram' ? diagramSteps(figure) : Number((figure as { props?: { steps?: number } }).props?.steps ?? 0)
  const step = useBuild(n + 1)
  return (
    <Card id={id} kicker={kicker} title={title} lesson={lesson}>
      {/* `gap`: the space between the lead and the figure; T13 (2026-11-06) widens it so the lead reads as its own group above the cards */}
      <div className="flex flex-col items-center" style={{ width: BOX_W, gap }}>
        <p className="text-center text-[20px] leading-snug" style={{ color: colors.ink, maxWidth: BOX_W }}>
          {lines.map((l, i) => (
            <span key={i} className="block">
              <Rich text={l} />
            </span>
          ))}
        </p>
        <Stage w={figW} h={figH}>
          {figure.type === 'diagram' ? <Diagram spec={figure} step={step} /> : Custom ? <Custom step={step} w={figW} h={figH} /> : null}
        </Stage>
      </div>
    </Card>
  )
}

export const figures = { C_TopicCards: TopicCards, C_DelayTimer: DelayTimer }
export const slides = { C_Lead: LeadLinesSlide, C_HealthCards: HealthCardsSlide }
export const css = `
@keyframes x-beat { 0%, 100% { transform: scale(1) } 12% { transform: scale(1.1) } 24% { transform: scale(1) } 36% { transform: scale(1.06) } 48% { transform: scale(1) } }
.x-beat { animation: x-beat 1.6s ease-in-out infinite; }
@keyframes x-ecg { from { stroke-dashoffset: 100 } to { stroke-dashoffset: 0 } }
.x-ecg { animation: x-ecg 1.6s linear infinite; }
@keyframes x-drip { 0% { transform: translateY(0) scale(0.6); opacity: 0 } 15% { opacity: 1; transform: translateY(0) scale(1) } 100% { transform: translateY(16px) scale(0.9); opacity: 0 } }
.x-drip { animation: x-drip 1.8s cubic-bezier(0.55,0,1,0.45) infinite; }
@keyframes x-turn { 0%, 100% { transform: rotate(0deg) } 50% { transform: rotate(-14deg) } }
.x-turn { animation: x-turn 3.6s ease-in-out infinite; }
@keyframes x-flow { to { stroke-dashoffset: -28 } }
.x-flow { animation: x-flow 1.4s linear infinite; }
@keyframes x-run { 0% { transform: translateX(0); opacity: 0 } 10% { opacity: 1 } 90% { opacity: 1 } 100% { transform: translateX(var(--x-run)); opacity: 0 } }
.x-ping { animation: x-run 3.2s ease-in-out infinite; }
.x-pong { animation: x-run 3.2s ease-in-out infinite; animation-delay: -1.6s; }
.cc-still .x-beat, .cc-still .x-ecg, .cc-still .x-drip, .cc-still .x-turn, .cc-still .x-flow, .cc-still .x-ping, .cc-still .x-pong,
.deck-thumb .x-beat, .deck-thumb .x-ecg, .deck-thumb .x-drip, .deck-thumb .x-turn, .deck-thumb .x-flow, .deck-thumb .x-ping, .deck-thumb .x-pong { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .x-beat, .x-ecg, .x-drip, .x-turn, .x-flow, .x-ping, .x-pong { animation: none !important; } }
`
