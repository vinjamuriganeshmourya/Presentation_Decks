import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { TILE_SKIN } from '@/decks/figures/card'
import { MOTION, motionHeld } from '@/motion/tokens'
import { litRing } from '@/decks/figures/net/frames'
import { Icon } from '@/engine/icon'
import { ThreeStage, lightRig, mat } from './three-stage'
import { useCycle } from './r4'
import amiUrl from '../images/aws-ami.svg'
import ec2Url from '../images/aws-ec2.svg'
import instUrl from '../images/aws-ec2-instance.svg'
import asgUrl from '../images/aws-auto-scaling-res.svg'
import snapUrl from '../images/aws-ebs-snapshot.svg'
import elbUrl from '../images/aws-elb.svg'
import ebUrl from '../images/aws-elastic-beanstalk.svg'
import pyUrl from '../images/python.svg'
import linuxUrl from '../images/linux.png'

/*
 * BUILDER C · Elastic Compute Instances, sections 4 and 5 and the practical's two drawn figures.
 *
 * ROUND 2 (user, 2026-11-10, standing correction 13 / cloud course R10): every visual on slides 34-53 is an
 * icon picture, not a labelled diagram. No chips, no number badges, no connector-line labels, no explaining
 * text; a 1-3 word plain label only where an icon alone would be ambiguous (the TR picture on slide 36 keeps
 * its own words, slide 43 keeps the TR table text). Every visual carries a quiet loop (flow dots riding
 * straight arrows, a ring breathing round a mark, a glyph bobbing, a scaling cycle) plus the step's one-shot
 * reveal. Loops are CSS classes `c2-loop` / `c2-dot`, or a JS tick that only runs while motion is allowed:
 * all held on `?still` (`.cc-still`), in picker thumbnails (`.deck-thumb`) and under reduced motion.
 * Every arrow is one straight segment drawn from the rim of its source to the rim of its target.
 * Every inner card sits in its stage with equal margins. Logos (AWS marks) never move: they get a ring.
 * Slide 43's four card icons are real 3D (three.js through the deck's one shared renderer, `three-stage`).
 */

const EASE = MOTION.ease
const HEAD = "'DM Sans', system-ui, sans-serif"
const MONO = "'Fira Code', ui-monospace, monospace"
const img = (u: string) => `img:${u}`
const BOY = 'lib:build-boy-laptop'

/* ------------------------------------------------------------------ the kit */

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

/** a counter that ticks every `ms` while `on` and motion is allowed (scaling cycles, pointer cycles) */
function useTick(ms: number, on: boolean) {
  const held = useHeld()
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!on || held) {
      setN(0)
      return
    }
    const id = window.setInterval(() => setN((v) => v + 1), ms)
    return () => window.clearInterval(id)
  }, [ms, on, held])
  return n
}

type Loop = 'bob' | 'pulse' | 'ring' | 'sway' | 'none'

/**
 * ROUND 4 (user, 2026-11-10, "Looping highlights"): the orange highlight follows the step while the build runs,
 * and once the last step is reached it keeps walking step 1 → … → last → step 1, never stopping on the last item.
 * Held frames (?still, thumbnails, reduced motion) light nothing.
 */
function useHot(step: number, n: number) {
  const held = useHeld()
  const cyc = useCycle(n, step >= n)
  return (i: number) => (cyc >= 0 ? cyc + 1 === i : step === i && !held)
}

/**
 * AN ICON at (x, y): an official mark (`src`) or a lucide glyph on the white tile, or a 3D library render
 * (`lib`) with no plate. `label` is a short plain caption under it (no pill). A mark never moves: its loop is
 * a ring breathing round the tile.
 */
function Ico({ x, y, s = 56, src, icon, lib, tone = colors.brand, loop = 'none', lit = false, on = true, delay = 0, label, labelSide = 'below', faint = false, ph = 0, badge, badgeTone, ls = 15 }: { x: number; y: number; s?: number; src?: string; icon?: string; lib?: string; tone?: string; loop?: Loop; lit?: boolean; on?: boolean; delay?: number; label?: ReactNode; labelSide?: 'below' | 'right' | 'above' | 'left'; faint?: boolean; ph?: number; badge?: string; badgeTone?: string; ls?: number }) {
  const held = useHeld()
  const r = Math.round(s * 0.27)
  const lp: Loop = src && (loop === 'bob' || loop === 'sway') ? 'ring' : loop
  const glyphCls = lp === 'bob' ? 'c2-loop c2-bob' : lp === 'sway' ? 'c2-loop c2-sway' : ''
  const plateCls = lp === 'pulse' ? 'c2-loop c2-pulse' : ''
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
          ? { left: s + 10, top: '50%', transform: 'translateY(-50%)' }
          : { right: s + 10, top: '50%', transform: 'translateY(-50%)', textAlign: 'right' }
  return (
    <div
      style={{
        position: 'absolute',
        left: x - s / 2,
        top: y - s / 2,
        width: s,
        height: s,
        zIndex: 6,
        opacity: on ? (faint ? 0.5 : 1) : 0,
        filter: faint ? 'grayscale(1)' : undefined,
        transform: on ? 'none' : 'translateY(8px) scale(0.92)',
        transition: held ? 'none' : `opacity ${MOTION.reveal}ms ${EASE} ${on ? delay : 0}ms, transform ${MOTION.reveal}ms ${EASE} ${on ? delay : 0}ms`,
      }}
    >
      {lp === 'ring' && !lib && <span aria-hidden className="c2-loop c2-ring" style={{ position: 'absolute', inset: 0, borderRadius: r, boxShadow: `0 0 0 2px ${tone}`, ...anim }} />}
      <div className={plateCls} style={{ position: 'relative', width: '100%', height: '100%', ...anim }}>
        {lib ? (
          <span className={glyphCls} style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%', ...anim }}>
            {glyph}
          </span>
        ) : (
          <span style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%', borderRadius: r, ...TILE_SKIN, boxShadow: litRing(lit, TILE_SKIN.boxShadow as string), color: tone, transition: held ? 'none' : `box-shadow 420ms ${EASE}` }}>
            <span className={glyphCls} style={{ display: 'grid', placeItems: 'center', ...anim }}>
              {glyph}
            </span>
          </span>
        )}
        {badge && (
          <span style={{ position: 'absolute', right: -8, top: -8, display: 'grid', placeItems: 'center', width: 24, height: 24, borderRadius: 99, background: badgeTone ?? colors.success, color: colors.white, boxShadow: `0 0 0 2px ${colors.white}, 0 6px 12px -6px rgba(16,32,58,0.5)` }}>
            <Icon name={badge} size={14} />
          </span>
        )}
      </div>
      {label && <div style={{ position: 'absolute', whiteSpace: 'nowrap', fontFamily: HEAD, fontWeight: 600, fontSize: ls, lineHeight: 1.2, color: colors.ink, ...lbl }}>{label}</div>}
    </div>
  )
}

/**
 * A STRAIGHT ARROW from (x1, y1) to (x2, y2): one segment, its head's tip exactly on the target point.
 * It draws itself once when it arrives; `flow` adds a dot that rides it on a loop (no rest between rides).
 */
function Line({ x1, y1, x2, y2, on = true, tone = colors.brand, dashed = false, head = true, flow = true, dur = 2.2, delay = 0, width = 2.5, ph = 0, two = false, blocked = false }: { x1: number; y1: number; x2: number; y2: number; on?: boolean; tone?: string; dashed?: boolean; head?: boolean; flow?: boolean; dur?: number; delay?: number; width?: number; ph?: number; two?: boolean; blocked?: boolean }) {
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
  const sx = two ? x1 + ux * (HL - 1) : x1
  const sy = two ? y1 + uy * (HL - 1) : y1
  const headAt = (tx: number, ty: number, vx: number, vy: number) => `${tx},${ty} ${tx - vx * HL - vy * hw},${ty - vy * HL + vx * hw} ${tx - vx * HL + vy * hw},${ty - vy * HL - vx * hw}`
  const fade: CSSProperties = { opacity: on ? 1 : 0, transition: held ? 'none' : `opacity ${MOTION.reveal}ms ${EASE} ${on ? delay : 0}ms` }
  return (
    <>
      <svg aria-hidden width={1} height={1} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', zIndex: 3, pointerEvents: 'none', ...fade }}>
        <line
          x1={sx}
          y1={sy}
          x2={ex}
          y2={ey}
          stroke={tone}
          strokeWidth={width}
          strokeLinecap="round"
          {...(dashed ? { strokeDasharray: '6 6' } : { pathLength: 1, strokeDasharray: 1, strokeDashoffset: on ? 0 : 1, style: { transition: held ? 'none' : `stroke-dashoffset 700ms ${EASE} ${on ? delay : 0}ms` } })}
        />
        {head && !blocked && <polygon points={headAt(x2, y2, ux, uy)} fill={tone} />}
        {two && <polygon points={headAt(x1, y1, -ux, -uy)} fill={tone} />}
        {blocked && (
          <g transform={`translate(${x2 - ux * 4},${y2 - uy * 4})`}>
            <circle r={10} fill={colors.white} stroke={colors.danger} strokeWidth={2} />
            <path d="M -4.5 -4.5 L 4.5 4.5 M 4.5 -4.5 L -4.5 4.5" stroke={colors.danger} strokeWidth={2.4} strokeLinecap="round" />
          </g>
        )}
      </svg>
      {flow && on && !held && (
        <span
          aria-hidden
          className="c2-dot c2-loop"
          style={
            {
              position: 'absolute',
              left: sx - 5,
              top: sy - 5,
              width: 10,
              height: 10,
              borderRadius: 99,
              background: tone,
              boxShadow: `0 0 0 3px ${tone}33`,
              zIndex: 8,
              opacity: 0,
              '--dx': `${ex - sx}px`,
              '--dy': `${ey - sy}px`,
              /* the first ride waits for the line to finish drawing itself, then loops with its phase */
              animation: `c2-ride ${dur}s linear ${(delay + 720) / 1000 + (dur - (ph % dur))}s infinite`,
            } as CSSProperties
          }
        />
      )}
    </>
  )
}

/** a soft white card at (x, y, w, h), lit on its step */
function Panel({ x, y, w, h, lit = false, dashed = false, tone = colors.brand, children, on = true, delay = 0 }: { x: number; y: number; w: number; h: number; lit?: boolean; dashed?: boolean; tone?: string; children?: ReactNode; on?: boolean; delay?: number }) {
  const held = useHeld()
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x, top: y, width: w, height: h, zIndex: 1 }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 18,
          background: dashed ? `${tone}0A` : (TILE_SKIN.background as string),
          boxShadow: litRing(lit, dashed ? 'none' : (TILE_SKIN.boxShadow as string)),
          border: dashed ? `2px dashed ${tone}88` : undefined,
          transition: held ? 'none' : `box-shadow 420ms ${EASE}`,
        }}
      />
      {children}
    </Show>
  )
}

/** a plain short caption (no pill) */
const Cap = ({ x, y, children, size = 15, tone = colors.ink, weight = 600, align = 'center', style }: { x: number; y: number; children: ReactNode; size?: number; tone?: string; weight?: number; align?: 'center' | 'left' | 'right'; style?: CSSProperties }) => (
  <div style={{ position: 'absolute', left: x, top: y, transform: align === 'center' ? 'translate(-50%, -50%)' : align === 'right' ? 'translate(-100%, -50%)' : 'translateY(-50%)', whiteSpace: 'nowrap', fontFamily: HEAD, fontWeight: weight, fontSize: size, lineHeight: 1.2, color: tone, zIndex: 7, ...style }}>{children}</div>
)

/* ------------------------------------------------------------------ 34 · T18 · three launch inputs into one launch */

function C_T18({ step }: { step: number }) {
  const held = useHeld()
  const Y = [72, 190, 308]
  const IN = [
    { src: amiUrl, label: 'Machine Image' },
    { icon: 'FileCode', label: 'User Data' },
    { icon: 'KeyRound', label: 'Key Pair' },
  ]
  const BX = 300
  const BY = 30
  const BW = 276
  const BH = 320
  const hot = useHot(step, 4)
  const MINI = ['Image', 'Data', 'Key']
  return (
    <Frame w={606} h={380}>
      {/* the launch: one card holding the instance it makes */}
      <Panel x={BX} y={BY} w={BW} h={BH} lit={hot(4)}>
        <Ico x={46} y={40} s={44} lib="lib:rocket" loop="bob" />
        <Cap x={74} y={40} align="left" size={16}>
          Instance Launch
        </Cap>
      </Panel>
      <Ico x={BX + BW / 2} y={BY + 150} s={92} src={instUrl} loop="ring" lit={hot(4)} label="Instance" />
      {/* the three inputs, merged inside the launch once all are chosen */}
      {IN.map((p, i) => (
        <Ico key={i} x={BX + BW / 2 + (i - 1) * 62} y={BY + 262} s={44} src={p.src} icon={p.icon} on={step >= 4} delay={i * 120} loop={p.src ? 'ring' : 'bob'} ph={i * 0.6} badge={i === 2 ? 'Check' : undefined} label={MINI[i]} ls={13} />
      ))}
      {IN.map((p, i) => (
        <Ico key={p.label} x={86} y={Y[i]} s={60} src={p.src} icon={p.icon} on={step >= i + 1} lit={hot(i + 1)} loop={p.src ? 'ring' : 'bob'} ph={i * 0.7} label={p.label} />
      ))}
      {Y.map((y, i) => (
        <Line key={i} x1={120} y1={y} x2={BX - 4} y2={y} on={step >= i + 1} dur={2} ph={i * 0.66} />
      ))}
    </Frame>
  )
}

/* ------------------------------------------------------------------ 35 · T19 · one AMI, identical instances */

function MiniSet({ x, y, on, delay = 0, ph = 0 }: { x: number; y: number; on: boolean; delay?: number; ph?: number }) {
  return (
    <>
      <Ico x={x} y={y} s={40} src={linuxUrl} on={on} delay={delay} loop="none" label="OS" ls={12} />
      <Ico x={x + 56} y={y} s={40} icon="Package" on={on} delay={delay + 80} loop="bob" ph={ph} label="Software" ls={12} />
      <Ico x={x + 112} y={y} s={40} icon="Settings" on={on} delay={delay + 160} loop="bob" ph={ph + 0.5} label="Config" ls={12} />
    </>
  )
}

function C_T19({ step }: { step: number }) {
  const held = useHeld()
  const AX = 212
  const AY = 132
  const IX = 556
  const Y = [70, 165, 260]
  const hot = useHot(step, 2)
  return (
    <Frame w={1000} h={330}>
      <Ico x={AX} y={AY} s={100} src={amiUrl} loop="ring" lit={hot(1)} on={step >= 1} label="AMI" />
      {/* what the image holds: an OS, installed software, configuration */}
      <MiniSet x={AX - 56} y={AY + 112} on={step >= 1} delay={200} />
      {Y.map((y, i) => (
        <Line key={i} x1={AX + 54} y1={AY + (y - AY) * 0.18} x2={IX - 36} y2={y} on={step >= 2} delay={i * 120} dur={2.2} ph={i * 0.7} />
      ))}
      {Y.map((y, i) => (
        <Ico key={i} x={IX} y={y} s={64} src={instUrl} on={step >= 2} delay={200 + i * 140} loop="ring" ph={i * 0.8} lit={hot(2)} label="Instance" ls={12} />
      ))}
      {Y.map((y, i) => (
        <MiniSet key={i} x={IX + 92} y={y} on={step >= 2} delay={400 + i * 140} ph={i * 0.4} />
      ))}
      {Y.map((y, i) => (
        <Ico key={i} x={IX + 292} y={y} s={40} icon="Check" tone={colors.success} on={step >= 2} delay={700 + i * 140} loop="pulse" ph={i * 0.5} label="Ready" ls={12} />
      ))}
    </Frame>
  )
}

/* ------------------------------------------------------------------ 36 · T19-B · the TR's AMI lifecycle picture, its own words */

function Verb({ x, y, icon, children, on, delay = 0 }: { x: number; y: number; icon: string; children: ReactNode; on: boolean; delay?: number }) {
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', zIndex: 7 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: HEAD, fontWeight: 600, fontSize: 15, color: colors.brandDark, whiteSpace: 'nowrap' }}>
        <span className="c2-loop c2-bob" style={{ display: 'grid', placeItems: 'center', color: colors.brand }}>
          <Icon name={icon} size={16} />
        </span>
        {children}
      </div>
    </Show>
  )
}

function C_T19B({ step }: { step: number }) {
  const hot = useHot(step, 4)
  const Y = 216
  const CX = 112
  const SX = 330
  const AX = 622
  const IX = 930
  const IY = 92
  const CY2 = 336
  const DY = 368
  return (
    <Frame w={1060} h={440}>
      <Ico x={CX} y={Y} s={58} icon="Sparkles" loop="bob" on={step >= 1} lit={hot(1)} label="Create" />
      <Line x1={CX + 33} y1={Y} x2={SX - 44} y2={Y} on={step >= 1} />
      <Ico x={SX} y={Y} s={80} src={snapUrl} loop="ring" on={step >= 1} lit={hot(1)} label="EBS Snapshot" />
      <Show on={step >= 1} delay={240} style={{ position: 'absolute', left: SX, top: Y + 78, transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontFamily: HEAD, fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 1.3 }}>
        (Or Template If Instance
        <br />
        Store Backed)
      </Show>
      <Line x1={SX + 44} y1={Y} x2={AX - 48} y2={Y} on={step >= 2} />
      <Verb x={(SX + AX) / 2} y={Y - 24} icon="ClipboardCheck" on={step >= 2}>
        Register
      </Verb>
      <Ico x={AX} y={Y} s={88} src={amiUrl} loop="ring" on={step >= 2} lit={hot(2)} label="AMI #1" labelSide="above" />
      {/* launch and copy: two straight lines from AMI #1 */}
      <Line x1={AX + 46} y1={Y - 22} x2={IX - 42} y2={IY + 10} on={step >= 3} ph={0.4} />
      <Verb x={(AX + IX) / 2 - 18} y={(Y + IY) / 2 - 32} icon="Rocket" on={step >= 3}>
        Launch
      </Verb>
      <Ico x={IX} y={IY} s={78} src={instUrl} loop="ring" on={step >= 3} delay={200} lit={hot(3)} label="Instance" />
      <Line x1={AX + 46} y1={Y + 22} x2={IX - 42} y2={CY2 - 10} on={step >= 3} ph={1.2} />
      <Verb x={(AX + IX) / 2 - 18} y={(Y + CY2) / 2 + 32} icon="Copy" on={step >= 3}>
        Copy
      </Verb>
      <Ico x={IX} y={CY2} s={78} src={amiUrl} loop="ring" on={step >= 3} delay={300} lit={hot(3)} label="AMI #2" />
      {/* deregister: straight down */}
      <Line x1={AX} y1={Y + 46} x2={AX} y2={DY - 28} on={step >= 4} flow={false} tone={colors.muted} />
      <Ico x={AX} y={DY} s={50} icon="Trash2" tone={colors.danger} loop="sway" on={step >= 4} lit={hot(4)} label="Deregister" labelSide="right" />
    </Frame>
  )
}

/* ------------------------------------------------------------------ 39 · T20 · first boot runs the script, a reboot skips it */

/** a small shell script card: a prompt and lines that type themselves on a loop */
function ScriptCard({ x, y, on, lit }: { x: number; y: number; on: boolean; lit: boolean }) {
  const held = useHeld()
  const W = [56, 40, 64]
  return (
    <Show on={on} style={{ position: 'absolute', left: x - 64, top: y - 34, width: 128, height: 68, zIndex: 6 }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 14, background: '#13234A', boxShadow: litRing(lit, '0 12px 22px -14px rgba(16,32,58,0.6)'), transition: held ? 'none' : `box-shadow 420ms ${EASE}` }} />
      {W.map((w, i) => (
        <div key={i} style={{ position: 'absolute', left: 14, top: 12 + i * 17, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: MONO, fontSize: 13, color: '#7FE0A8', lineHeight: 1 }}>$</span>
          <span className="c2-loop c2-type" style={{ display: 'block', width: w, height: 6, borderRadius: 4, background: '#9DB8FF', transformOrigin: 'left center', animationDelay: `${-i * 0.5}s` }} />
        </div>
      ))}
    </Show>
  )
}

function C_T20({ step }: { step: number }) {
  const hot = useHot(step, 3)
  const Y = 184
  const X = [70, 226, 382, 538]
  const S = 62
  const RX = X[2]
  const RY = 306
  return (
    <Frame w={646} h={380}>
      <ScriptCard x={X[0]} y={70} on={step >= 1} lit={hot(1)} />
      <Show on={step >= 1} style={{ position: 'absolute', left: X[0] + 72, top: 60, zIndex: 7, fontFamily: HEAD, fontWeight: 600, fontSize: 15, color: colors.ink, whiteSpace: 'nowrap' }}>
        Script
      </Show>
      <Line x1={X[0]} y1={106} x2={X[0]} y2={Y - S / 2 - 4} on={step >= 1} dur={1.6} />
      <Ico x={X[0]} y={Y} s={S} lib="lib:rocket" loop="bob" lit={hot(1)} label="Launch" />
      <Ico x={X[1]} y={Y} s={S} icon="Power" loop="pulse" lit={hot(2)} label="First Boot" />
      <Ico x={X[2]} y={Y} s={S} icon="SquareTerminal" loop="bob" ph={0.6} lit={hot(2)} label="Script Runs" />
      <Ico x={X[3]} y={Y} s={S} icon="CircleCheck" tone={colors.success} loop="pulse" ph={0.9} lit={hot(3)} label="Application Ready" />
      {[0, 1, 2].map((i) => (
        <Line key={i} x1={X[i] + S / 2 + 4} y1={Y} x2={X[i + 1] - S / 2 - 4} y2={Y} on={step >= 2} delay={i * 160} dur={1.8} ph={i * 0.6} />
      ))}
      {/* a reboot later: the script is skipped */}
      <Line x1={X[3] - 22} y1={Y + S / 2 + 30} x2={RX + 34} y2={RY - 12} on={step >= 2} dashed tone={colors.muted} flow={false} />
      <Ico x={RX} y={RY} s={52} icon="RotateCcw" tone={colors.muted} loop="sway" on={step >= 2} delay={200} label="Reboot" labelSide="left" />
      <Line x1={RX} y1={RY - 30} x2={RX} y2={Y + S / 2 + 50} on={step >= 2} delay={300} tone={colors.muted} flow={false} head={false} blocked />
      <Show on={step >= 2} delay={400} style={{ position: 'absolute', left: RX + 36, top: RY - 10, whiteSpace: 'nowrap', fontFamily: HEAD, fontWeight: 600, fontSize: 15, color: colors.muted }}>
        Script Skipped
      </Show>
      {/* what the script typically does: install, pull, start */}
      {['Package', 'Download', 'Play'].map((ic, i) => (
        <Ico key={ic} x={X[3] - 52 + i * 52} y={74} s={42} icon={ic} on={step >= 3} delay={i * 140} loop="bob" ph={i * 0.5} badge="Check" label={['Install', 'Pull', 'Start'][i]} labelSide="above" ls={13} />
      ))}
      <Line x1={X[3]} y1={Y - S / 2 - 4} x2={X[3]} y2={102} on={step >= 3} dur={1.6} />
    </Frame>
  )
}

/* ------------------------------------------------------------------ 40 · T21 · the key pair as a picture */

function C_T21({ step }: { step: number }) {
  const held = useHeld()
  const Y = 196
  const BX = 92
  const PX = 236
  const UX = 386
  const IX = 524
  const lit = useHot(step, 4)
  return (
    <Frame w={606} h={380}>
      {/* the owner with the laptop holds the private key */}
      <Ico x={BX} y={Y + 12} s={140} lib={BOY} />
      <Cap x={BX} y={Y - 66}>User</Cap>
      <Ico x={PX} y={Y} s={60} icon="KeyRound" tone={colors.accentDark} loop="sway" on={step >= 2} lit={lit(2)} label="Private Key" />
      {/* the two keys are one linked pair */}
      <Line x1={PX + 34} y1={Y} x2={UX - 34} y2={Y} on={step >= 2} two dashed flow={false} />
      <Show on={step >= 2} delay={300} style={{ position: 'absolute', left: (PX + UX) / 2 - 14, top: Y - 44, zIndex: 7 }}>
        <span className="c2-loop c2-pulse" style={{ display: 'grid', placeItems: 'center', width: 28, height: 28, borderRadius: 99, background: colors.white, color: colors.brand, boxShadow: `inset 0 0 0 1.5px ${colors.brand}` }}>
          <Icon name="Link2" size={15} />
        </span>
        <span style={{ position: 'absolute', left: '50%', bottom: 32, transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontFamily: HEAD, fontWeight: 600, fontSize: 13, color: colors.ink }}>Pair</span>
      </Show>
      <Ico x={UX} y={Y} s={60} icon="LockKeyhole" loop="bob" on={step >= 1} lit={lit(1)} label="Public Key" />
      <Line x1={UX + 34} y1={Y} x2={IX - 44} y2={Y} on={step >= 1} dur={1.8} />
      <Ico x={IX} y={Y} s={80} src={instUrl} loop="ring" lit={lit(1)} label="Instance" labelSide="above" badge={step >= 1 ? 'ListChecks' : undefined} badgeTone={colors.brand} />
      {/* downloaded once from the provider, never stored there again */}
      <Ico x={PX + 76} y={66} s={62} lib="lib:cloud" loop="bob" on={step >= 2} label="Cloud" labelSide="above" ls={13} />
      <Line x1={PX + 60} y1={92} x2={PX + 14} y2={Y - 36} on={step >= 2} dur={1.6} tone={colors.accentDark} />
      <Ico x={PX + 140} y={60} s={40} icon="KeyRound" tone={colors.muted} on={step >= 2} delay={400} faint badge="X" badgeTone={colors.danger} label="Deleted" labelSide="above" ls={13} />
      {/* no password login */}
      <Ico x={IX} y={66} s={56} icon="RectangleEllipsis" tone={colors.muted} on={step >= 3} lit={lit(3)} loop="pulse" badge="Ban" badgeTone={colors.danger} label="Password" labelSide="above" ls={13} />
      {/* a lost private key, and the new key that restores access */}
      <Ico x={PX} y={322} s={46} icon="KeyRound" tone={colors.muted} on={step >= 4} lit={lit(4)} faint badge="CircleHelp" badgeTone={colors.danger} label="Lost" ls={13} />
      <Ico x={IX} y={322} s={50} icon="KeyRound" tone={colors.success} on={step >= 4} delay={300} lit={lit(4)} loop="sway" badge="Plus" label="New" ls={13} />
      <Line x1={IX} y1={322 - 29} x2={IX} y2={Y + 46} on={step >= 4} delay={400} tone={colors.success} dur={1.6} />
    </Frame>
  )
}

/* ------------------------------------------------------------------ 43 · T22-B · the launch order, four cards with real 3D icons */

type Model = 'image' | 'key' | 'script' | 'ready'

/** one small three.js object per card, through the deck's one shared renderer; it sways and bobs on a loop */
function Icon3D({ kind, w = 132, h = 108 }: { kind: Model; w?: number; h?: number }) {
  return (
    <ThreeStage
      w={w}
      h={h}
      step={0}
      holdT={1.2}
      setup={({ scene, camera }) => {
        camera.fov = 30
        camera.position.set(0, 1.1, 5.2)
        camera.lookAt(0, 0, 0)
        lightRig(scene, [0, 0, 0])
        const g = new THREE.Group()
        scene.add(g)
        const rb = (x: number, y: number, z: number, r = 0.08) => new RoundedBoxGeometry(x, y, z, 4, r)
        const add = (geo: THREE.BufferGeometry, m: THREE.Material, p: [number, number, number], parent: THREE.Object3D = g) => {
          const o = new THREE.Mesh(geo, m)
          o.position.set(...p)
          o.castShadow = true
          parent.add(o)
          return o
        }
        const parts: THREE.Object3D[] = []
        if (kind === 'image') {
          /* a machine image: three stacked layers (OS, software, configuration) with the AMI orange on top */
          const cols = ['#C7D7F7', '#7FA4F5', '#F58536']
          cols.forEach((c, i) => parts.push(add(rb(1.7, 0.26, 1.2, 0.1), mat(c, { roughness: 0.45 }), [0, -0.42 + i * 0.36, 0])))
          const top = parts[2]
          for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) add(rb(0.34, 0.06, 0.3, 0.03), mat('#FFFFFF', { roughness: 0.4 }), [-0.45 + i * 0.45, 0.16, -0.22 + j * 0.44], top)
          g.rotation.set(0.25, -0.6, 0)
        } else if (kind === 'key') {
          /* a key: a ring bow, a shaft and two teeth */
          const gold = mat('#F2B935', { metalness: 0.55, roughness: 0.3 })
          add(new THREE.TorusGeometry(0.42, 0.14, 18, 36), gold, [-0.75, 0, 0])
          add(new THREE.CylinderGeometry(0.11, 0.11, 1.45, 20), gold, [0.3, 0, 0]).rotation.z = Math.PI / 2
          add(rb(0.16, 0.34, 0.16, 0.04), gold, [0.62, -0.22, 0])
          add(rb(0.16, 0.24, 0.16, 0.04), gold, [0.88, -0.17, 0])
          g.rotation.set(0.35, -0.35, 0.2)
        } else if (kind === 'script') {
          /* a user data script: a sheet with a folded corner and code lines that type */
          add(rb(1.3, 1.62, 0.12, 0.06), mat('#FFFFFF', { roughness: 0.5 }), [0, 0, 0])
          add(rb(0.38, 0.38, 0.14, 0.04), mat('#DCE6FB'), [0.46, 0.62, 0.02]).rotation.z = Math.PI / 4
          const w = [0.78, 0.58, 0.86, 0.48]
          w.forEach((len, i) => {
            const line = add(rb(len, 0.1, 0.06, 0.03), mat(i % 2 ? '#7FA4F5' : '#2D63FB', { roughness: 0.4 }), [-0.42 + len / 2, 0.36 - i * 0.28, 0.09])
            line.userData = { len, x0: -0.42 }
            parts.push(line)
          })
          add(rb(0.12, 0.12, 0.06, 0.03), mat('#16A34A'), [-0.5, 0.36, 0.09]).position.x = -0.52
          g.rotation.set(0.15, -0.45, 0)
        } else {
          /* instance ready: a server chip with pins and a green check above it */
          add(rb(1.25, 0.34, 1.25, 0.1), mat('#2D63FB', { roughness: 0.4 }), [0, -0.25, 0])
          add(rb(0.7, 0.08, 0.7, 0.04), mat('#9DB8FF'), [0, -0.06, 0])
          for (let i = 0; i < 4; i++)
            for (const s of [-1, 1]) {
              add(rb(0.1, 0.06, 0.22, 0.02), mat('#C7D7F7'), [-0.42 + i * 0.28, -0.28, s * 0.72])
              add(rb(0.22, 0.06, 0.1, 0.02), mat('#C7D7F7'), [s * 0.72, -0.28, -0.42 + i * 0.28])
            }
          const tick = new THREE.Group()
          const green = mat('#16A34A', { roughness: 0.35 })
          add(rb(0.18, 0.5, 0.18, 0.06), green, [-0.18, 0, 0], tick).rotation.z = Math.PI / 4
          add(rb(0.18, 0.9, 0.18, 0.06), green, [0.15, 0.15, 0], tick).rotation.z = -Math.PI / 5.5
          tick.position.set(0, 0.6, 0)
          g.add(tick)
          parts.push(tick)
          g.rotation.set(0.35, -0.5, 0)
        }
        const base = g.rotation.y
        return (t) => {
          g.rotation.y = base + Math.sin(t * 1.1) * 0.32
          g.position.y = Math.sin(t * 1.6) * 0.06
          if (kind === 'image') parts.forEach((p, i) => (p.position.y = -0.42 + i * (0.36 + 0.06 * (0.5 + 0.5 * Math.sin(t * 1.8)))))
          if (kind === 'script')
            parts.forEach((p, i) => {
              const k = Math.min(1, Math.max(0.08, ((t * 0.8 - i * 0.25) % 2.2) / 1.2))
              const { len, x0 } = p.userData as { len: number; x0: number }
              p.scale.x = k
              p.position.x = x0 + (len * k) / 2
            })
          if (kind === 'ready') parts[0].scale.setScalar(1 + 0.08 * Math.sin(t * 2.4))
        }
      }}
    />
  )
}

const STAGES: { step: string; input: string; det: string; model: Model }[] = [
  { step: 'Choose Template', input: 'Machine Image', det: 'OS And Pre-Installed Software', model: 'image' },
  { step: 'Attach Credential', input: 'Key Pair', det: 'Who Can Log In, And How', model: 'key' },
  { step: 'Supply Script', input: 'User Data', det: 'What Gets Configured On First Boot', model: 'script' },
  { step: 'Instance Ready', input: 'All Three Combined', det: 'A Working, Reachable Instance', model: 'ready' },
]

function C_T22B({ step }: { step: number }) {
  const held = useHeld()
  const hot = useHot(step, 4)
  const CW = 230
  const CH = 300
  const G = 32
  const X0 = (1080 - 4 * CW - 3 * G) / 2
  const Y0 = (400 - CH) / 2
  const green = colors.success
  return (
    <Frame w={1080} h={400}>
      {STAGES.map((s, i) => {
        const x = X0 + i * (CW + G)
        const last = i === 3
        const lit = hot(i + 1)
        return (
          <Show key={s.step} on={step >= i + 1} dy={12} style={{ position: 'absolute', left: x, top: Y0, width: CW, height: CH }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 18,
                ...(last ? { background: `linear-gradient(180deg, ${green}12 0%, ${green}24 100%)`, boxShadow: litRing(lit, `inset 0 0 0 2px ${green}, 0 12px 24px -16px rgba(19,122,58,0.45)`) } : { ...TILE_SKIN, boxShadow: litRing(lit, TILE_SKIN.boxShadow as string) }),
                transition: held ? 'none' : `box-shadow 420ms ${EASE}`,
              }}
            />
            <div style={{ position: 'absolute', inset: 0, padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 15, letterSpacing: '0.02em', color: last ? colors.success : colors.brand }}>{s.step}</span>
              <div style={{ width: 132, height: 108, display: 'grid', placeItems: 'center' }}>{step >= i + 1 && <Icon3D kind={s.model} />}</div>
              <span style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 18, color: colors.ink, textAlign: 'center' }}>{s.input}</span>
              <span style={{ fontSize: 16, lineHeight: 1.3, color: colors.ink, textAlign: 'center', maxWidth: 196 }}>{s.det}</span>
            </div>
          </Show>
        )
      })}
      {[0, 1, 2].map((i) => {
        const x1 = X0 + (i + 1) * CW + i * G + 3
        return <Line key={i} x1={x1} y1={Y0 + 94} x2={x1 + G - 6} y2={Y0 + 94} on={step >= i + 2} tone={i === 2 ? colors.success : colors.brand} dur={1.4} ph={i * 0.4} width={3} />
      })}
    </Frame>
  )
}

/* ------------------------------------------------------------------ 46 · T24-B · the ASG and its parts */

/**
 * Slide 46, round 3 (user, 2026-11-10, item 8).
 *
 * THE GLITCH, and its cause: the old capacity bar moved its Desired marker with a CSS `left: calc(...)` transition on
 * an OVERSHOOTING curve (cubic-bezier 0.34, 1.32, 0.64, 1), and the blue fill with a separate `width` transition on
 * the same curve. Every cycle the marker sprang past its target (at the 0.86 stop it ran into the Max end and the
 * "Max" label), bounced back, and the jump 0.86 → 0.38 swung through the whole bar; the fixed "Min" / "Max" words sat
 * on the track's ends, so the marker and the words collided. Fixed by: positions in figure pixels moved with
 * `transform: translateX` on the deck's non-overshooting ease, the fill drawn from the same numbers, the words moved
 * under their own handles, and the Desired marker drawn ABOVE the track so it never meets a handle.
 *
 * THE HANDLES: Min and Max are presenter-draggable (`role="slider"`, pointer capture, arrow keys), clamped to the
 * track and never crossing: they keep one handle's width apart (they meet edge to edge, never overlap, never swap).
 * Desired always stays inside [Min, Max]; its loop pauses while a handle is held and resumes 1.2 s after release.
 * The number of running instances follows Desired (1 to 6 across the two zones).
 */

const T24 = {
  /** the three driver cards on the left: 18 px from the parent's edge, 12 px inner padding (user: text off the border) */
  DX: 18,
  DW: 140,
  DH: 98,
  DY: [84, 214, 340],
  /** the group */
  GX: 192,
  GY: 18,
  GW: 406,
  GH: 384,
  AZW: 179,
  AZY: 162,
  IY: [228, 290, 350],
  /** the capacity bar: track geometry in figure px (inside the group) */
  TX: 40,
  TW: 326,
  TY: 98,
  KNOB: 22,
}
/** the handles keep one knob apart, as a fraction of the track */
const T24_SEP = T24.KNOB / T24.TW
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

function Driver({ y, icon, label, tone = colors.brand, loop, on = true, lit = false }: { y: number; icon: string; label: string; tone?: string; loop: Loop; on?: boolean; lit?: boolean }) {
  const held = useHeld()
  const glyph = loop === 'bob' ? 'c2-loop c2-bob' : loop === 'sway' ? 'c2-loop c2-sway' : loop === 'pulse' ? 'c2-loop c2-pulse' : ''
  return (
    <Show on={on} dy={8} style={{ position: 'absolute', left: T24.DX, top: y - T24.DH / 2, width: T24.DW, height: T24.DH, zIndex: 6 }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 16,
          ...TILE_SKIN,
          boxShadow: litRing(lit, TILE_SKIN.boxShadow as string),
          transition: held ? 'none' : `box-shadow 420ms ${EASE}`,
          padding: 12,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <span style={{ display: 'grid', placeItems: 'center', width: 44, height: 44, borderRadius: 12, background: `${tone}14`, color: tone }}>
          <span className={glyph} style={{ display: 'grid' }}>
            <Icon name={icon} size={24} />
          </span>
        </span>
        <span style={{ fontFamily: HEAD, fontWeight: 600, fontSize: 14, lineHeight: 1.15, color: colors.ink, whiteSpace: 'nowrap' }}>{label}</span>
      </div>
    </Show>
  )
}

function Knob({ v, label, onMove, onEnd, z, active, side = 'center' }: { v: number; label: string; onMove: (frac: number) => void; onEnd: () => void; z: number; active: boolean; side?: 'center' | 'left' | 'right' }) {
  const [drag, setDrag] = useState(false)
  const held = useHeld()
  const frac = (e: React.PointerEvent<HTMLSpanElement>) => {
    const track = (e.currentTarget.parentElement as HTMLElement).querySelector('[data-track]') as HTMLElement
    const r = track.getBoundingClientRect()
    return clamp01((e.clientX - r.left) / r.width)
  }
  const stop = (e: React.SyntheticEvent) => e.stopPropagation()
  return (
    <>
    <span
      role="slider"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
      tabIndex={0}
      onPointerDown={(e) => {
        e.stopPropagation()
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
        setDrag(true)
        onMove(frac(e))
      }}
      onPointerMove={(e) => {
        e.stopPropagation()
        if (drag) onMove(frac(e))
      }}
      onPointerUp={(e) => {
        e.stopPropagation()
        setDrag(false)
        onEnd()
      }}
      onPointerCancel={() => {
        setDrag(false)
        onEnd()
      }}
      onClick={stop}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.stopPropagation()
          e.preventDefault()
          onMove(v + (e.key === 'ArrowRight' ? 0.05 : -0.05))
          onEnd()
        }
      }}
      style={{
        position: 'absolute',
        left: 0,
        top: T24.TY - T24.KNOB / 2,
        width: T24.KNOB,
        height: T24.KNOB,
        transform: `translateX(${T24.TX + v * T24.TW - T24.KNOB / 2}px)`,
        transition: drag || held ? 'none' : `transform 260ms ${EASE}`,
        borderRadius: 99,
        background: colors.white,
        boxShadow: `inset 0 0 0 2.5px ${colors.brand}, 0 6px 14px -6px rgba(31,64,140,0.55)${drag ? `, 0 0 0 6px ${colors.brand}22` : ''}`,
        cursor: drag ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
        pointerEvents: active ? 'auto' : 'none',
        zIndex: z,
        display: 'grid',
        placeItems: 'center',
        outline: 'none',
      }}
    >
      <span aria-hidden style={{ width: 8, height: 8, borderRadius: 99, background: colors.brand }} />
    </span>
    {/* the word under the handle: a sibling, not a child, so it never sits outside the knob's own box */}
    <span
      aria-hidden
      style={{
        position: 'absolute',
        left: 0,
        top: T24.TY + T24.KNOB / 2 + 4,
        transform: `translateX(${T24.TX + v * T24.TW}px) translateX(${side === 'left' ? 'calc(-100% + 4px)' : side === 'right' ? '-4px' : '-50%'})`,
        transition: drag || held ? 'none' : `transform 260ms ${EASE}`,
        fontFamily: HEAD,
        fontWeight: 600,
        fontSize: 13,
        color: colors.ink,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        zIndex: z,
      }}
    >
      {label}
    </span>
    </>
  )
}

function C_T24B({ step }: { step: number }) {
  const held = useHeld()
  const lit = useHot(step, 4)
  const { GX, GY, GW, GH, AZW, AZY, IY } = T24
  const AZ = [GX + 16, GX + GW - 16 - AZW]
  const AZH = GH - (AZY - GY) - 16
  const CX = [AZ[0] + AZW / 2, AZ[1] + AZW / 2]

  /* the presenter's limits; the loop pauses while a handle is held */
  const [lim, setLim] = useState({ min: 0.15, max: 0.9 })
  const [paused, setPaused] = useState(false)
  const resume = useRef(0)
  useEffect(() => () => window.clearTimeout(resume.current), [])
  const grab = () => {
    window.clearTimeout(resume.current)
    setPaused(true)
  }
  const release = () => {
    window.clearTimeout(resume.current)
    resume.current = window.setTimeout(() => setPaused(false), 1200)
  }
  const setMin = (f: number) => {
    grab()
    setLim((l) => ({ ...l, min: Math.min(clamp01(f), l.max - T24_SEP) }))
  }
  const setMax = (f: number) => {
    grab()
    setLim((l) => ({ ...l, max: Math.max(clamp01(f), l.min + T24_SEP) }))
  }

  const tick = useTick(2400, step >= 1 && !paused)
  /* desired: three stops inside [min, max]; held frames sit on the middle one */
  const stops = [0.3, 0.6, 0.9]
  const k = held ? 0.6 : step >= 3 ? stops[tick % 3] : 0.6
  const desired = lim.min + (lim.max - lim.min) * k
  const dx = T24.TX + desired * T24.TW
  const mx = T24.TX + lim.min * T24.TW
  const xx = T24.TX + lim.max * T24.TW
  /* handles closer than two labels: their words move outward so "Min" and "Max" never run together */
  const close = xx - mx < 46
  const smooth = (p: string, ms = 700) => (held || paused ? 'none' : `${p} ${ms}ms ${EASE}`)

  /* running instances: before the capacity press, 5 and a scale-out sixth; after it, Desired decides (1 to 6) */
  const scaled = held ? true : step >= 1 ? tick % 2 === 0 : false
  const count = step >= 3 ? Math.max(1, Math.min(6, Math.round(1 + desired * 5))) : step >= 1 && scaled ? 6 : 5
  /* fill order across the zones: z1 s0, z2 s0, z1 s1, z2 s1, z2 s2, z1 s2 */
  const ORDER: [number, number][] = [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
    [1, 2],
    [0, 2],
  ]
  const shown = (z: number, s2: number) => ORDER.findIndex(([a, b2]) => a === z && b2 === s2) < count
  /* health: z1 s1 fails, is removed and comes back replaced */
  const phase = held ? 2 : step >= 2 ? tick % 3 : 2

  return (
    <Frame w={616} h={420}>
      {/* what drives the group: three cards with inner padding, clear of the parent's edge */}
      <Driver y={T24.DY[0]} icon="ClipboardList" label="Launch Template" loop="bob" />
      <Line x1={T24.DX + T24.DW + 2} y1={T24.DY[0]} x2={GX - 4} y2={T24.DY[0]} dur={1.6} dashed />
      <Driver y={T24.DY[1]} icon="SlidersHorizontal" label="Scaling Policy" loop="sway" on={step >= 1} lit={lit(1)} />
      <Line x1={T24.DX + T24.DW + 2} y1={T24.DY[1]} x2={GX - 4} y2={T24.DY[1]} on={step >= 1} dur={1.6} />
      <Driver y={T24.DY[2]} icon="HeartPulse" label="Health Check" tone={colors.danger} loop="pulse" on={step >= 2} lit={lit(2)} />
      <Line x1={T24.DX + T24.DW + 2} y1={T24.DY[2]} x2={GX - 4} y2={T24.DY[2]} on={step >= 2} dur={1.6} tone={colors.danger} />

      {/* the group */}
      <Panel x={GX} y={GY} w={GW} h={GH} dashed tone={colors.accentDark} />
      <Ico x={GX + 34} y={GY + 34} s={40} src={asgUrl} loop="ring" tone={colors.accentDark} />
      <Cap x={GX + 62} y={GY + 34} align="left" size={15}>
        Auto Scaling Group
      </Cap>

      {/* capacity limits: draggable Min and Max, Desired riding between them */}
      <Show on={step >= 3} style={{ position: 'absolute', left: GX, top: GY, width: GW, height: 136, zIndex: 8, pointerEvents: 'none' }}>
        <div data-track style={{ position: 'absolute', left: T24.TX, top: T24.TY - 4, width: T24.TW, height: 8, borderRadius: 99, background: colors.surface2, boxShadow: `inset 0 0 0 1px ${colors.line}` }} />
        {/* the allowed range, then the desired fill inside it */}
        <div style={{ position: 'absolute', left: 0, top: T24.TY - 4, height: 8, width: 1, borderRadius: 99, background: `${colors.brand}38`, transformOrigin: '0 0', transform: `translateX(${mx}px) scaleX(${xx - mx})`, transition: smooth('transform', 260) }} />
        <div style={{ position: 'absolute', left: 0, top: T24.TY - 4, height: 8, width: 1, background: colors.brand, transformOrigin: '0 0', transform: `translateX(${mx}px) scaleX(${Math.max(0.001, dx - mx)})`, transition: smooth('transform') }} />
        {/* Desired: a crosshair pin ABOVE the track, so it never meets a handle */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            top: T24.TY - 38,
            width: 24,
            height: 30,
            transform: `translateX(${dx - 12}px)`,
            transition: smooth('transform'),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            color: colors.brand,
          }}
        >
          <span style={{ display: 'grid', placeItems: 'center', width: 22, height: 22, borderRadius: 99, background: colors.white, boxShadow: litRing(lit(3), `inset 0 0 0 2px ${colors.brand}`) }}>
            <Icon name="Crosshair" size={13} />
          </span>
          <span style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: `7px solid ${colors.brand}` }} />
          <span style={{ position: 'absolute', top: 3, ...(dx < T24.TX + T24.TW / 2 ? { left: 28 } : { right: 28 }), whiteSpace: 'nowrap', fontFamily: HEAD, fontWeight: 600, fontSize: 12, lineHeight: '16px', color: colors.ink }}>Desired</span>
        </span>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <span data-track aria-hidden style={{ position: 'absolute', left: T24.TX, top: T24.TY - 4, width: T24.TW, height: 8, pointerEvents: 'none' }} />
          <Knob v={lim.min} label="Min" onMove={setMin} onEnd={release} z={3} active={step >= 3} side={close ? 'left' : 'center'} />
          <Knob v={lim.max} label="Max" onMove={setMax} onEnd={release} z={2} active={step >= 3} side={close ? 'right' : 'center'} />
        </div>
      </Show>

      {/* the zones */}
      {AZ.map((x, i) => (
        <Panel key={i} x={x} y={AZY} w={AZW} h={AZH} lit={lit(4)}>
          <div style={{ position: 'absolute', left: 12, top: 10, display: 'flex', alignItems: 'center', gap: 6, fontFamily: HEAD, fontWeight: 600, fontSize: 14, color: colors.brandDark, whiteSpace: 'nowrap' }}>
            <span className={step >= 4 ? 'c2-loop c2-bob' : ''} style={{ display: 'grid', color: colors.brand }}>
              <Icon name="MapPin" size={15} />
            </span>
            Availability Zone
          </div>
        </Panel>
      ))}
      {[0, 1].map((z) =>
        [0, 1, 2].map((s2) => {
          const sick = z === 0 && s2 === 1 && step >= 2
          const on = shown(z, s2) && !(sick && phase === 1)
          const badge = sick && phase === 0 ? 'HeartCrack' : sick && phase === 2 && !held ? 'Check' : z === 1 && s2 === 2 && step >= 1 && step < 3 && scaled ? 'Plus' : undefined
          return (
            <Ico
              key={`${z}-${s2}`}
              x={CX[z]}
              y={IY[s2]}
              s={50}
              src={instUrl}
              on={on}
              tone={sick && phase === 0 ? colors.danger : colors.brand}
              lit={(sick && phase === 0 && !held) || (z === 1 && s2 === 2 && lit(1))}
              badge={badge}
              badgeTone={badge === 'HeartCrack' ? colors.danger : badge === 'Plus' ? colors.brand : undefined}
              label="Instance"
              labelSide="right"
              ls={12}
            />
          )
        }),
      )}
    </Frame>
  )
}

/* ------------------------------------------------------------------ 47 · T25 · one versioned blueprint, read by the group for every new instance */

const CONFIG: { t: string; src?: string; icon?: string }[] = [
  { t: 'AMI', src: amiUrl },
  { t: 'Instance Type', icon: 'Server' },
  { t: 'Key Pair', icon: 'KeyRound' },
  { t: 'Security Group', icon: 'ShieldCheck' },
]

function VTag({ v, lit = false, faint = false, w = 60, tone = colors.brand }: { v: string; lit?: boolean; faint?: boolean; w?: number; tone?: string }) {
  const held = useHeld()
  return (
    <span
      style={{
        display: 'grid',
        placeItems: 'center',
        width: w,
        height: 38,
        borderRadius: 12,
        fontFamily: MONO,
        fontWeight: 600,
        fontSize: 17,
        color: faint ? colors.muted : colors.brandDark,
        background: faint ? colors.surface : 'linear-gradient(180deg, #FFFFFF 0%, #ECF2FD 100%)',
        boxShadow: litRing(lit, `inset 0 0 0 1.5px ${faint ? '#CFDCF5' : tone}, 0 8px 16px -12px rgba(31,64,140,0.4)`),
        transition: held ? 'none' : `box-shadow 420ms ${EASE}`,
        fontVariantLigatures: 'none',
      }}
    >
      {v}
    </span>
  )
}

function C_T25({ step }: { step: number }) {
  const held = useHeld()
  const hot = useHot(step, 3)
  const tick = useTick(1600, step >= 3)
  const TX = 40
  const TY = 40
  const TW = 330
  const TH = 240
  const ASX = 600
  const Y = 160
  const NX = [748, 842, 936]
  const shownN = held ? 3 : step >= 3 ? 1 + (tick % 3) : 0
  return (
    <Frame w={1000} h={320}>
      {/* earlier versions stacked behind the template */}
      {[2, 1].map((k) => (
        <Show key={k} on={step >= 2} delay={(2 - k) * 120} style={{ position: 'absolute', left: TX + k * 12, top: TY - k * 12, width: TW, height: TH, borderRadius: 18, ...TILE_SKIN, opacity: 0.7, zIndex: 0 }}>
          <span />
        </Show>
      ))}
      <Panel x={TX} y={TY} w={TW} h={TH} lit={hot(1)}>
        <div style={{ position: 'absolute', left: 18, top: 16, display: 'flex', alignItems: 'center', gap: 8, fontFamily: HEAD, fontWeight: 700, fontSize: 16, color: colors.brandDark }}>
          <span className="c2-loop c2-bob" style={{ display: 'grid', color: colors.brand }}>
            <Icon name="ClipboardList" size={18} />
          </span>
          Launch Template
        </div>
        {CONFIG.map((c, i) => (
          <Ico key={c.t} x={(i % 2) * 160 + 86} y={Math.floor(i / 2) * 92 + 92} s={50} src={c.src} icon={c.icon} loop={c.src ? 'ring' : 'bob'} ph={i * 0.5} label={c.t} />
        ))}
      </Panel>
      {/* the versions */}
      {['v1', 'v2', 'v3'].map((v, i) => (
        <Show key={v} on={step >= 2} delay={i * 140} dx={-8} dy={0} style={{ position: 'absolute', left: 404, top: Y - 19 + (i - 1) * 66, zIndex: 6 }}>
          <VTag v={v} lit={hot(2)} />
        </Show>
      ))}
      {/* the group reads the template whenever it starts a new instance */}
      <Line x1={468} y1={Y} x2={ASX - 38} y2={Y} on={step >= 3} dur={1.6} />
      <Ico x={ASX} y={Y} s={68} src={asgUrl} loop="ring" on={step >= 3} delay={200} label="Auto Scaling Group" tone={colors.accentDark} />
      <Line x1={ASX + 40} y1={Y} x2={NX[0] - 34} y2={Y} on={step >= 3} delay={300} dur={1.6} ph={0.5} />
      {NX.map((x, i) => (
        <Ico key={i} x={x} y={Y} s={60} src={instUrl} on={step >= 3 && i < shownN} lit={hot(3) && i === shownN - 1} delay={held ? 0 : 120} loop="ring" ph={i * 0.4} label="Instance" ls={13} badge={step >= 3 && i < shownN ? 'Check' : undefined} />
      ))}
    </Frame>
  )
}

/* ------------------------------------------------------------------ 48 · T25-B · versions, the group's pointer, roll back, the old format */

/** a pointer from (x, y) of length `len` at `deg` degrees: one straight ray that turns smoothly to its target */
function Ray({ x, y, len, deg, on, tone = colors.brand }: { x: number; y: number; len: number; deg: number; on: boolean; tone?: string }) {
  const held = useHeld()
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        left: x,
        top: y - 1.5,
        width: len,
        height: 3,
        transformOrigin: '0 50%',
        transform: `rotate(${deg}deg)`,
        transition: held ? 'none' : 'transform 700ms cubic-bezier(0.34,1.32,0.64,1), width 700ms cubic-bezier(0.34,1.32,0.64,1), opacity 360ms',
        opacity: on ? 1 : 0,
        zIndex: 3,
      }}
    >
      <div style={{ position: 'absolute', left: 0, right: 10, top: 0, height: 3, borderRadius: 3, background: tone }} />
      <svg width={12} height={12} viewBox="0 0 12 12" style={{ position: 'absolute', right: -1, top: -4.5 }}>
        <path d="M 0 0.5 L 12 6 L 0 11.5 Z" fill={tone} />
      </svg>
    </div>
  )
}

function C_T25B({ step }: { step: number }) {
  const held = useHeld()
  const lit = useHot(step, 4)
  const tick = useTick(2200, step >= 2)
  const VX = [196, 336, 476]
  const VY = 70
  const AX = 304
  const AY = 250
  /* default = v2, latest = v3, fixed number = v1; rolling back points the group at the prior version */
  const MODES = [
    { t: 'Default', icon: 'Pointer', v: 1 },
    { t: 'Latest', icon: 'ArrowUpToLine', v: 2 },
    { t: 'Fixed Number', icon: 'Hash', v: 0 },
  ]
  const mode = held ? 0 : step === 2 ? tick % 3 : 0
  const back = step >= 3 && (held || tick % 2 === 1)
  const target = step >= 3 ? (back ? 1 : 2) : MODES[mode].v
  const tx = VX[target]
  const ty = VY + 22
  const dx = tx - AX
  const dy = ty - (AY - 34)
  const deg = (Math.atan2(dy, dx) * 180) / Math.PI
  const len = Math.hypot(dx, dy)
  return (
    <Frame w={606} h={400}>
      {/* the template and its numbered versions; each edit makes the next */}
      <Panel x={30} y={22} w={546} h={96} lit={lit(1)}>
        <span />
      </Panel>
      <Ico x={78} y={VY - 10} s={40} icon="ClipboardList" loop="bob" label="Template" ls={13} />
      {['v1', 'v2', 'v3'].map((v, i) => (
        <Show key={v} on={step >= 1} delay={i * 160} dx={-8} dy={0} style={{ position: 'absolute', left: VX[i] - 30, top: VY - 19, zIndex: 6 }}>
          <VTag v={v} lit={step >= 2 && target === i && !held} tone={step >= 3 && i === 2 ? colors.danger : colors.brand} />
        </Show>
      ))}
      {[0, 1].map((i) => (
        <span key={i}>
          <Line x1={VX[i] + 36} y1={VY} x2={VX[i + 1] - 36} y2={VY} on={step >= 1} delay={300 + i * 160} dur={1.5} ph={i * 0.5} />
          <Show on={step >= 1} delay={300 + i * 160} style={{ position: 'absolute', left: (VX[i] + VX[i + 1]) / 2 - 8, top: VY - 36, zIndex: 7 }}>
            <span className="c2-loop c2-sway" style={{ display: 'grid', color: colors.muted, animationDelay: `${-i * 0.6}s` }}>
              <Icon name="PencilLine" size={16} />
            </span>
            <span style={{ position: 'absolute', left: 20, top: 0, whiteSpace: 'nowrap', fontFamily: HEAD, fontWeight: 600, fontSize: 12, lineHeight: '16px', color: colors.muted }}>Edit</span>
          </Show>
        </span>
      ))}
      {/* the group, and the version it launches from */}
      <Ray x={AX} y={AY - 34} len={len - 4} deg={deg} on={step >= 2} tone={back ? colors.accentDark : colors.brand} />
      <Ico x={AX} y={AY} s={64} src={asgUrl} loop="ring" tone={colors.accentDark} on={step >= 2} lit={lit(2)} label="ASG" />
      <Ico x={AX - 54} y={AY - 30} s={34} icon="Undo2" tone={colors.accentDark} on={step >= 3} lit={lit(3)} loop="sway" label="Rollback" labelSide="above" ls={13} />
      <Show on={step >= 2} delay={200} style={{ position: 'absolute', left: 420, top: 196, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 6 }}>
        {MODES.map((m, i) => {
          const on = step === 2 && mode === i && !held
          return (
            <div key={m.t} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: HEAD, fontWeight: 600, fontSize: 15, color: on ? colors.brandDark : colors.ink, transition: held ? 'none' : 'color 300ms' }}>
              <span style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 10, background: on ? colors.brand : colors.white, color: on ? colors.white : colors.brand, boxShadow: `inset 0 0 0 1.5px ${colors.brand}`, transition: held ? 'none' : 'background 300ms, color 300ms' }}>
                <Icon name={m.icon} size={15} />
              </span>
              {m.t}
            </div>
          )
        })}
      </Show>
      {/* the older, non-versioned format the template replaces */}
      <Ico x={92} y={318} s={52} icon="FileX" tone={colors.muted} faint on={step >= 4} lit={lit(4)} label={<span style={{ textDecoration: 'line-through', color: colors.muted }}>Launch Configuration</span>} />
      <Line x1={92} y1={318 - 30} x2={92} y2={122} on={step >= 4} delay={200} tone={colors.muted} dur={1.8} />
      <Show on={step >= 4} delay={300} style={{ position: 'absolute', left: 104, top: 200, zIndex: 7 }}>
        <span className="c2-loop c2-sway" style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 99, background: colors.white, color: colors.brand, boxShadow: `inset 0 0 0 1.5px ${colors.brand}` }}>
          <Icon name="Replace" size={15} />
        </span>
        <span style={{ position: 'absolute', left: 36, top: 7, whiteSpace: 'nowrap', fontFamily: HEAD, fontWeight: 600, fontSize: 13, color: colors.ink }}>Replaces</span>
      </Show>
    </Frame>
  )
}

/* ------------------------------------------------------------------ 50 · T26 · min, desired, max, the waits, the cost */

function C_T26({ step }: { step: number }) {
  const held = useHeld()
  const lit = useHot(step, 4)
  const tick = useTick(2600, step >= 1)
  const SLOTS = 8
  const sx = (i: number) => 72 + i * 66
  const desired = held ? 5 : step >= 1 ? [4, 5, 6, 5][tick % 4] : 3
  const minI = 1
  const maxI = SLOTS - 1
  const SY = 82
  const BAR_Y = 158
  const spring = held ? 'none' : 'left 900ms cubic-bezier(0.34,1.32,0.64,1), width 900ms cubic-bezier(0.34,1.32,0.64,1)'
  const BY = 284
  return (
    <Frame w={606} h={380}>
      {Array.from({ length: SLOTS }, (_, i) => {
        const on = i < desired
        const newest = i === desired - 1 && step >= 2
        return (
          <div key={i} style={{ position: 'absolute', left: sx(i) - 23, top: SY - 23, width: 46, height: 46 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 12, border: `1.5px dashed #CFDCF5` }} />
            <Ico x={23} y={23} s={46} src={instUrl} on={on} lit={lit(1) && i >= 3} badge={newest ? 'Hourglass' : step >= 4 && on ? 'Coins' : undefined} badgeTone={newest ? colors.brand : colors.warning} />
          </div>
        )
      })}
      <Cap x={(sx(0) + sx(SLOTS - 1)) / 2} y={SY - 42} size={14}>
        Instances
      </Cap>
      {/* the capacity range and the desired marker */}
      <div style={{ position: 'absolute', left: sx(minI), top: BAR_Y - 6, width: sx(maxI) - sx(minI), height: 12, borderRadius: 99, background: `linear-gradient(90deg, ${colors.surface2}, #D9E5FB)`, boxShadow: 'inset 0 0 0 1px #C3D3F0' }} />
      <div style={{ position: 'absolute', left: sx(minI), top: BAR_Y - 6, width: sx(desired - 1) - sx(minI), height: 12, borderRadius: 99, background: colors.brand, transition: spring }} />
      {[minI, maxI].map((i, k) => (
        <div key={k} style={{ position: 'absolute', left: sx(i) - 2, top: BAR_Y - 14, width: 4, height: 28, borderRadius: 4, background: colors.brandDark }} />
      ))}
      <Cap x={sx(minI)} y={BAR_Y + 34}>
        Min
      </Cap>
      <Cap x={sx(maxI)} y={BAR_Y + 34}>
        Max
      </Cap>
      <div style={{ position: 'absolute', left: sx(desired - 1), top: BAR_Y + 10, transition: spring, zIndex: 7 }}>
        <div style={{ transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <svg width={18} height={12} viewBox="0 0 18 12" aria-hidden>
            <path d="M 9 0 L 17 12 L 1 12 Z" fill={colors.brand} />
          </svg>
          <span style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 99, background: lit(1) ? colors.brand : colors.white, color: lit(1) ? colors.white : colors.brand, boxShadow: `inset 0 0 0 2px ${colors.brand}` }}>
            <Icon name="Crosshair" size={16} />
          </span>
          <span style={{ fontFamily: HEAD, fontWeight: 600, fontSize: 15, color: colors.ink }}>Desired</span>
        </div>
      </div>
      {/* the waits and the cost, one icon each */}
      <Ico x={150} y={BY} s={58} icon="Hourglass" loop="sway" on={step >= 2} lit={lit(2)} label="Grace Period" />
      <Ico x={303} y={BY} s={58} icon="Timer" loop="pulse" on={step >= 3} lit={lit(3)} label="Cooldown" />
      <Ico x={456} y={BY} s={58} icon="Wallet" tone={colors.warning} loop="bob" on={step >= 4} lit={lit(4)} label="Cost" />
      <Show on={step >= 4} delay={200} style={{ position: 'absolute', left: 456 + 18, top: BY - 54, zIndex: 8 }}>
        <span className="c2-loop c2-drop" style={{ display: 'grid', color: colors.warning }}>
          <Icon name="Coins" size={18} />
        </span>
      </Show>
    </Frame>
  )
}

/* ------------------------------------------------------------------ 53 · P01 · the two builds, side by side */

function C_P01({ step }: { step: number }) {
  /*
   * ROUND 4 (user, 2026-11-10, slide 53): the practical as two parallel flows, so self-managed and managed
   * provisioning compare at a glance. Each node carries one badge: a person where the learner does the work,
   * a gear where the platform does it. One orange highlight walks both rows in step, on a loop.
   */
  const held = useHeld()
  const tick = useTick(900, step >= 2)
  const M = 20
  const GAP = 20
  const RH = (330 - 2 * M - GAP) / 2
  const XS = [232, 372, 512, 652, 792, 932]
  const ROWS: { y: number; src: string; title: string; nodes: { t: string; src?: string; icon?: string; lib?: string; auto?: boolean; tone?: string }[] }[] = [
    {
      y: M,
      src: ec2Url,
      title: 'Self-Managed',
      nodes: [
        { t: 'AMI', src: amiUrl },
        { t: 'Type', icon: 'Cpu' },
        { t: 'Key', icon: 'KeyRound', tone: colors.accentDark },
        { t: 'Launch', src: instUrl },
        { t: 'Connect', icon: 'SquareTerminal' },
        { t: 'Manage', icon: 'Wrench' },
      ],
    },
    {
      y: M + RH + GAP,
      src: ebUrl,
      title: 'Managed',
      nodes: [
        { t: 'Flask', src: pyUrl },
        { t: 'ZIP', icon: 'FileArchive' },
        { t: 'Upload', icon: 'Upload' },
        { t: 'Provision', src: asgUrl, auto: true, tone: colors.accentDark },
        { t: 'Instances', src: instUrl, auto: true },
        { t: 'Live', icon: 'Globe', auto: true, tone: colors.success },
      ],
    },
  ]
  const k = tick % 6
  return (
    <Frame w={1000} h={330}>
      {ROWS.map((r, ri) => {
        const on = step >= ri + 1
        const cy = r.y + RH / 2 - 10
        return (
          <span key={r.title}>
            <Panel x={M} y={r.y} w={1000 - 2 * M} h={RH} on={on} lit={step === 1 && ri === 0 && !held} />
            <Ico x={98} y={cy} s={52} src={r.src} on={on} label={r.title} />
            <Show on={on} style={{ position: 'absolute', left: 166, top: r.y + 22, width: 2, height: RH - 44, borderRadius: 2, background: colors.line, zIndex: 2 }}>
              <span />
            </Show>
            {r.nodes.map((nd, i) => (
              <Ico
                key={nd.t}
                x={XS[i]}
                y={cy}
                s={54}
                src={nd.src}
                icon={nd.icon}
                tone={nd.tone}
                on={on}
                delay={i * 90}
                loop={nd.src ? 'ring' : 'bob'}
                ph={i * 0.4}
                lit={on && !held && step >= 2 && k === i}
                badge={nd.auto ? 'Cog' : 'User'}
                badgeTone={nd.auto ? colors.success : colors.brand}
                label={nd.t}
                ls={14}
              />
            ))}
            {XS.slice(0, -1).map((x, i) => (
              <Line key={i} x1={x + 31} y1={cy} x2={XS[i + 1] - 31} y2={cy} on={on} delay={200 + i * 90} dur={1.8} ph={i * 0.36} />
            ))}
          </span>
        )
      })}
    </Frame>
  )
}

/* ------------------------------------------------------------------ 37 · T19-C · where images come from, and the region tie */

function C_T19C({ step }: { step: number }) {
  const held = useHeld()
  const lit = useHot(step, 4)
  const SX = 70
  const SY = [66, 188, 310]
  const SRC = [
    { icon: 'Building2', label: 'Provider' },
    { icon: 'Camera', label: 'Custom' },
    { icon: 'Store', label: 'Marketplace' },
  ]
  const R1 = { x: 146, y: 30, w: 210, h: 340 }
  const R2 = { x: 376, y: 30, w: 190, h: 340 }
  const A1 = { x: R1.x + R1.w / 2, y: 188 }
  const A2 = { x: R2.x + R2.w / 2, y: 188 }
  const region = (r: typeof R1, on: boolean, l: boolean) => (
    <Panel x={r.x} y={r.y} w={r.w} h={r.h} lit={l} on={on}>
      <div style={{ position: 'absolute', left: 14, top: 12, display: 'flex', alignItems: 'center', gap: 6, fontFamily: HEAD, fontWeight: 600, fontSize: 15, color: colors.brandDark }}>
        <span className="c2-loop c2-bob" style={{ display: 'grid', color: colors.brand }}>
          <Icon name="MapPin" size={16} />
        </span>
        Region
      </div>
    </Panel>
  )
  return (
    <Frame w={586} h={400}>
      {region(R1, true, lit(4))}
      {region(R2, step >= 4, lit(4))}
      {SRC.map((p, i) => (
        <Ico key={p.label} x={SX} y={SY[i]} s={54} icon={p.icon} on={step >= i + 1} lit={lit(i + 1)} loop="bob" ph={i * 0.6} label={p.label} />
      ))}
      {SY.map((y, i) => {
        const dx = A1.x - 44 - (SX + 31)
        const dy = A1.y + (i - 1) * 22 - y
        return <Line key={i} x1={SX + 31} y1={y} x2={SX + 31 + dx} y2={y + dy} on={step >= i + 1} dur={1.8} ph={i * 0.6} />
      })}
      <Ico x={A1.x} y={A1.y} s={80} src={amiUrl} loop="ring" label="AMI" lit={lit(1) || lit(2) || lit(3)} badge={step >= 4 ? 'Lock' : undefined} badgeTone={colors.brand} />
      {/* tied to one region: copied before it can launch elsewhere */}
      <Line x1={A1.x + 44} y1={A1.y} x2={A2.x - 44} y2={A2.y} on={step >= 4} dur={1.6} />
      <Show on={step >= 4} delay={200} style={{ position: 'absolute', left: A2.x - 70, top: A2.y - 74, zIndex: 7 }}>
        <span className="c2-loop c2-pulse" style={{ display: 'grid', placeItems: 'center', width: 28, height: 28, borderRadius: 99, background: colors.white, color: colors.brand, boxShadow: `inset 0 0 0 1.5px ${colors.brand}` }}>
          <Icon name="Copy" size={15} />
        </span>
        <span style={{ position: 'absolute', left: '50%', bottom: 34, transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontFamily: HEAD, fontWeight: 600, fontSize: 13, color: colors.ink }}>Copy</span>
      </Show>
      <Ico x={A2.x} y={A2.y} s={80} src={amiUrl} loop="ring" on={step >= 4} delay={300} lit={lit(4)} label="AMI" labelSide="above" />
      <Line x1={A2.x} y1={A2.y + 44} x2={A2.x} y2={300} on={step >= 4} delay={400} dur={1.4} />
      <Ico x={A2.x} y={328} s={50} src={instUrl} on={step >= 4} delay={500} loop="ring" label="Instance" ls={13} badge={step >= 4 ? 'Check' : undefined} />
    </Frame>
  )
}

/* ------------------------------------------------------------------ 45 · T24 · the TR's Auto-Scaling picture, its own words as short labels */

function C_T24({ step }: { step: number }) {
  /*
   * ROUND 4 (user, 2026-11-10, slide 45): Launch Template → Auto Scaling Group → Instances (scale out / scale in),
   * with the Load Balancer in front of the instances. No Scale Up, no Data Center, no clients or internet.
   * Equal margins: the group sits 40 px from the top and bottom, the template and the balancer 60 px from the sides.
   */
  const held = useHeld()
  const hot = useHot(step, 4)
  const tick = useTick(1400, step >= 3)
  const H = 380
  const MID = H / 2
  const TX = 118
  const G = { x: 236, y: 40, w: 560, h: 300 }
  const LBX = 924
  /* the fleet: 2 → 6 → 2 instances, one change per beat, out then in, on a loop with no rest */
  const SEQ = [2, 3, 4, 5, 6, 5, 4, 3]
  const n = held ? 6 : step >= 3 ? SEQ[tick % SEQ.length] : 2
  const prev = held ? 6 : step >= 3 ? SEQ[(tick + SEQ.length - 1) % SEQ.length] : 2
  const out = n >= prev
  const COLS = [G.x + G.w / 2 - 150, G.x + G.w / 2, G.x + G.w / 2 + 150]
  const ROWS = [G.y + 92, G.y + 188]
  const slot = (i: number) => ({ x: COLS[i % 3], y: ROWS[Math.floor(i / 3)] })
  return (
    <Frame w={1060} h={H}>
      {/* the blueprint */}
      <Ico x={TX} y={MID} s={84} icon="ClipboardList" loop="bob" on={step >= 1} lit={hot(1)} label="Template" />
      <Line x1={TX + 46} y1={MID} x2={G.x - 4} y2={MID} on={step >= 2} dur={1.6} />
      {/* the group, holding the fleet it keeps at the right size */}
      <Panel x={G.x} y={G.y} w={G.w} h={G.h} dashed tone={colors.accentDark} on={step >= 2} lit={hot(2)} />
      <Ico x={G.x + 46} y={G.y + 44} s={48} src={asgUrl} loop="ring" tone={colors.accentDark} on={step >= 2} label="ASG" labelSide="right" />
      {Array.from({ length: 6 }, (_, i) => {
        const p = slot(i)
        const live = step >= 3 ? i < n : step >= 2 && i < 2
        const fresh = step >= 3 && !held && out && i === n - 1 && n !== prev
        return <Ico key={i} x={p.x} y={p.y} s={58} src={instUrl} on={live} delay={held ? 0 : 80} lit={hot(3) && i === n - 1} badge={fresh ? 'Plus' : undefined} badgeTone={colors.brand} label="Instance" ls={13} />
      })}
      {/* which way the fleet is moving right now */}
      <Show on={step >= 3} style={{ position: 'absolute', left: G.x + G.w / 2 - 70, top: G.y + 250, width: 140, height: 36, zIndex: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <span style={{ display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: 10, ...TILE_SKIN, color: out ? colors.brand : colors.accentDark, transition: held ? 'none' : `color 300ms ${EASE}` }}>
          <Icon name={out ? 'ChevronsRight' : 'ChevronsLeft'} size={20} />
        </span>
        <span style={{ fontFamily: HEAD, fontWeight: 600, fontSize: 13, color: colors.ink, whiteSpace: 'nowrap' }}>{out ? 'Scale Out' : 'Scale In'}</span>
      </Show>
      {/* the load balancer in front of the instances */}
      <Line x1={LBX - 40} y1={MID} x2={G.x + G.w + 4} y2={MID} on={step >= 4} dur={1.4} />
      <Ico x={LBX} y={MID} s={72} src={elbUrl} loop="ring" on={step >= 4} lit={hot(4)} label="Load Balancer" />
    </Frame>
  )
}

/* ------------------------------------------------------------------ 56 · P02-B · what the lab instance was launched with */

function C_P02B({ step }: { step: number }) {
  const held = useHeld()
  const lit = useHot(step, 3)
  const SG = { x: 236, y: 20, w: 330, h: 340 }
  const IX = SG.x + SG.w / 2 + 20
  const IY = 176
  const LX = 92
  const GY = 296
  const mono: CSSProperties = { fontFamily: MONO, fontWeight: 600, fontSize: 14, fontVariantLigatures: 'none' }
  return (
    <Frame w={586} h={380}>
      {/* the security group around the instance */}
      <Panel x={SG.x} y={SG.y} w={SG.w} h={SG.h} lit={lit(3)}>
        <div style={{ position: 'absolute', left: 16, top: 14, display: 'flex', alignItems: 'center', gap: 8, color: colors.brandDark, ...mono }}>
          <span className="c2-loop c2-pulse" style={{ display: 'grid', color: colors.brand }}>
            <Icon name="ShieldCheck" size={18} />
          </span>
          s9-ec2-sg
        </div>
      </Panel>
      <Ico x={IX} y={IY} s={86} src={instUrl} loop="ring" lit={lit(1)} label={<span style={mono}>t3.micro</span>} />
      {/* the image, the key, the learner's own IP */}
      <Ico x={LX} y={70} s={60} src={amiUrl} loop="ring" on={step >= 1} lit={lit(1)} label="Amazon Linux 2023" />
      <Line x1={LX + 34} y1={70 + 10} x2={IX - 48} y2={IY - 24} on={step >= 1} dur={2} />
      <Ico x={LX} y={IY} s={58} icon="KeyRound" tone={colors.accentDark} loop="sway" on={step >= 2} lit={lit(2)} label={<span style={mono}>s9-ec2-key</span>} />
      <Line x1={LX + 33} y1={IY} x2={IX - 48} y2={IY} on={step >= 2} dur={2} ph={0.6} />
      <Ico x={LX - 6} y={GY} s={100} lib={BOY} on={step >= 3} />
      <Show on={step >= 3} delay={200} style={{ position: 'absolute', left: LX + 40, top: GY + 30, zIndex: 7, fontFamily: HEAD, fontWeight: 600, fontSize: 15, color: colors.ink }}>
        My IP
      </Show>
      {/* SSH on port 22, let in from My IP only: a gate in the group's edge */}
      <Line x1={LX + 52} y1={GY - 8} x2={SG.x - 20} y2={GY - 8} on={step >= 3} dur={1.6} />
      <Ico x={SG.x} y={GY - 8} s={40} icon="DoorOpen" on={step >= 3} lit={lit(3)} loop="pulse" />
      <Show on={step >= 3} delay={200} style={{ position: 'absolute', left: SG.x + 30, top: GY - 18, zIndex: 7, display: 'flex', alignItems: 'center', gap: 6, color: colors.ink, ...mono }}>
        SSH (Port 22)
      </Show>
      <Line x1={SG.x + 24} y1={GY - 30} x2={IX - 46} y2={IY + 30} on={step >= 3} delay={300} dur={1.6} ph={0.4} />
    </Frame>
  )
}

/* ------------------------------------------------------------------ registry */

type Fig = (p: Record<string, unknown>) => ReactNode
const fig = (C: unknown) => C as Fig

export const figures: Record<string, Fig> = {
  C_T18: fig(C_T18),
  C_T19: fig(C_T19),
  C_T19B: fig(C_T19B),
  C_T19C: fig(C_T19C),
  C_T20: fig(C_T20),
  C_T21: fig(C_T21),
  C_T22B: fig(C_T22B),
  C_T24: fig(C_T24),
  C_T24B: fig(C_T24B),
  C_T25: fig(C_T25),
  C_T25B: fig(C_T25B),
  C_T26: fig(C_T26),
  C_P01: fig(C_P01),
  C_P02B: fig(C_P02B),
}

export const slides = {}

/* the round-2 loops: quiet, continuous, no rest between cycles (R8.1); all held on harness URLs, thumbnails and reduced motion */
export const css = `
@keyframes c2-bob { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
@keyframes c2-sway { 0%, 100% { transform: rotate(-7deg) } 50% { transform: rotate(7deg) } }
@keyframes c2-pulse { 0%, 100% { transform: scale(1) } 50% { transform: scale(1.05) } }
@keyframes c2-ring { 0% { transform: scale(1); opacity: 0.55 } 100% { transform: scale(1.32); opacity: 0 } }
@keyframes c2-ride { 0% { transform: translate(0, 0); opacity: 0 } 12% { opacity: 1 } 88% { opacity: 1 } 100% { transform: translate(var(--dx), var(--dy)); opacity: 0 } }
@keyframes c2-type { 0% { transform: scaleX(0.1) } 55%, 100% { transform: scaleX(1) } }
@keyframes c2-drop { 0% { transform: translateY(-6px); opacity: 0 } 25% { opacity: 1 } 80% { opacity: 1 } 100% { transform: translateY(26px); opacity: 0 } }
.c2-bob { animation: c2-bob 2.6s cubic-bezier(0.45,0,0.55,1) infinite; }
.c2-sway { animation: c2-sway 2.8s cubic-bezier(0.45,0,0.55,1) infinite; transform-origin: 50% 60%; }
.c2-pulse { animation: c2-pulse 2.4s cubic-bezier(0.45,0,0.55,1) infinite; }
.c2-ring { animation: c2-ring 2.4s cubic-bezier(0.22,1,0.36,1) infinite; }
.c2-type { animation: c2-type 2.2s cubic-bezier(0.22,1,0.36,1) infinite; }
.c2-drop { animation: c2-drop 1.8s cubic-bezier(0.45,0,0.55,1) infinite; }
.cc-still .c2-loop, .deck-thumb .c2-loop { animation: none !important; }
.cc-still .c2-dot, .deck-thumb .c2-dot { display: none !important; }
.cc-still .c2-ring, .deck-thumb .c2-ring { opacity: 0 !important; }
@media (prefers-reduced-motion: reduce) { .c2-loop { animation: none !important; } .c2-dot { display: none !important; } .c2-ring { opacity: 0 !important; } }
`
