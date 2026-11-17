import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { SPEED } from '@/deck/autoAnim'
import { At, Label, REDUCED, STILL, type LabelTone } from '@/decks/figures/scene'
import { Box, ISO, IsoScene, IsoSvg, P, Quad, Shadow, measure, along, pts, screenPts, shade, useIso, type GridPt } from '@/decks/figures/iso/iso'
import { iconUrl } from '@/decks/figures/net/fx'
import pBoy from './ppl/boy.png'
import pGirl from './ppl/girl.png'
import pWaiter from './ppl/waiter.png'
import pWoman from './ppl/woman.png'
import pMan from './ppl/man.png'
import pSuit from './ppl/suit.png'
import pReception from './ppl/reception.png'
import pDoctor from './ppl/doctor.png'
import pUserBoy from './ppl/userboy.png'
import pUserGirl from './ppl/usergirl.png'
import pTeacher from './ppl/teacher.png'
import pMansuit from './ppl/mansuit.png'
import pUserRed from './ppl/userred.png'
import pUserTie from './ppl/usertie.png'
import pUserYellow from './ppl/useryellow.png'
import pVisitor from './ppl/visitor.png'
import pTabWoman from './ppl/tabwoman.png'
import pElb from '../images/aws-elb.svg'

/**
 * BUILDER F · THE SIX ANALOGY SLIDES OF "LOAD BALANCING & CDN" (2026-11-05).
 *
 * One visual language for all six (course R7.10): every picture is an
 * isometric scene from `figures/iso` (one camera, one grid unit, one floor),
 * every person is a realistic 3D library render (R7.1, the same source on
 * every scene: `assets/icons/Icons`, trimmed into `./ppl/`), every technical
 * part is a 3D library render from `net/icons` standing on the same floor.
 * The everyday scene (left) and the concept (right) share the grid, so a
 * matched pair stands on the same spot on both stages.
 *
 * Text (course R3, lesson 2): no sentence, no caption; every clause of the
 * TR's analogy is a Title Case tag inside the picture it describes, in the
 * TR's words. Labels are DOM (`Label`), never svg text.
 *
 * Motion: the layout's ONE build track (`step`, 0..n) reveals the pairs, the
 * same press on both stages; after the build a quiet loop runs with no pause
 * (R7.8, R8.1). Harness URLs (`?still`), thumbnails and reduced motion hold
 * the complete frame.
 */

/* ------------------------------------------------------------------ shared */

const SW = 470
const SH = 390
const UU = 46
const EASE = 'cubic-bezier(0.22,1,0.36,1)'
/* a second, quieter blue-grey for "nothing is happening here" */
const DIM = shade(ISO.slate, 0.35)

function useHeld() {
  const instant = useInstant()
  return STILL || REDUCED || instant
}

function useTr(ms = 520) {
  const instant = useInstant()
  return (p: string) => (instant ? 'none' : `${p} ${ms}ms ${EASE}`)
}

/**
 * The quiet loop: a sawtooth phase 0..1 that starts once the build is complete
 * (`on`) and never pauses between laps. Before that, and on every held frame,
 * it reads `still` (a frame where every moving part is in view); the lap starts
 * FROM `still`, so nothing jumps when it begins.
 */
function useLap(on: boolean, ms: number, still: number) {
  const held = useHeld()
  const [t, setT] = useState(still)
  useEffect(() => {
    if (held || !on) {
      setT(still)
      return
    }
    let raf = 0
    let last = -1
    const t0 = performance.now()
    const period = ms * SPEED
    const tick = (now: number) => {
      const q = Math.floor((((now - t0) / period + still) % 1) * 360)
      if (q !== last) {
        last = q
        setT(q / 360)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [held, on, ms, still])
  return held || !on ? still : t
}

/**
 * A damped swing (a hung sign settling): from the moment `on` turns true, an angle in degrees that starts at
 * `amp` and dies away as a damped cosine, `amp * e^(-t/tau) * cos(2 pi t / period)`. 0 while off and on every
 * held frame (harness, thumbnail, reduced motion), so the still frame is the settled sign.
 */
function useSwing(on: boolean, amp = 16, tau = 900, period = 1150) {
  const held = useHeld()
  const [a, setA] = useState(0)
  useEffect(() => {
    if (held || !on) {
      setA(0)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const t = (now - t0) / SPEED
      const v = amp * Math.exp(-t / tau) * Math.cos((2 * Math.PI * t) / period)
      setA(Math.abs(v) < 0.05 && t > tau * 3 ? 0 : v)
      if (t < tau * 6) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [held, on, amp, tau, period])
  return held || !on ? 0 : a
}

/** A spring step 0..1 with one soft overshoot (an hourglass turned over and settling). */
const springStep = (k: number) => (k >= 1 ? 1 : 1 - Math.exp(-k * 7) * Math.cos(k * 9))

/* the sprites: realistic people (the library renders) and the 3D technical renders, with their aspect */
const SPR = {
  boy: [pBoy, 131 / 220],
  girl: [pGirl, 123 / 220],
  waiter: [pWaiter, 128 / 220],
  woman: [pWoman, 128 / 220],
  man: [pMan, 126 / 220],
  suit: [pSuit, 144 / 220],
  reception: [pReception, 127 / 220],
  doctor: [pDoctor, 103 / 220],
  userBoy: [pUserBoy, 166 / 220],
  userGirl: [pUserGirl, 167 / 220],
  teacher: [pTeacher, 126 / 220],
  mansuit: [pMansuit, 134 / 220],
  userRed: [pUserRed, 181 / 220],
  userTie: [pUserTie, 179 / 220],
  userYellow: [pUserYellow, 189 / 220],
  visitor: [pVisitor, 125 / 220],
  tabWoman: [pTabWoman, 118 / 220],
  /* the official AWS Elastic Load Balancing service icon (G1, G2): "Load Balancer" on a concept stage */
  elb: [pElb, 1],
  hourglass: [iconUrl('hourglass'), 146 / 236],
  server: [iconUrl('server-stack'), 227 / 216],
  globe: [iconUrl('globe-www'), 227 / 214],
  balancer: [iconUrl('hierarchy'), 210 / 197],
  database: [iconUrl('database'), 199 / 229],
  files: [iconUrl('files'), 256 / 182],
  clerk: [iconUrl('routing-clerk'), 87 / 96],
  layers: [iconUrl('layers'), 204 / 207],
  meter: [iconUrl('meter'), 202 / 111],
} as const
type SprKey = keyof typeof SPR

/**
 * A sprite standing on grid (x, y, z): its bottom centre on that point, `h` px tall, a soft floor shadow
 * under it. Drawn inside the scene's svg, so the painter's order of the scene puts it in front of what is
 * behind it and behind what is in front.
 */
function Spr({ k, x, y, z = 0, h, op = 1, cls, dx = 0, flip = false, shadow = true, style }: { k: SprKey; x: number; y: number; z?: number; h: number; op?: number; cls?: string; dx?: number; flip?: boolean; shadow?: boolean; style?: CSSProperties }) {
  const tr = useTr()
  const { u } = useIso()
  const [px0, py] = P(x, y, z, u)
  const px = px0 + dx
  const [src, ar] = SPR[k]
  const w = h * ar
  return (
    <g style={{ opacity: op, transition: tr('opacity'), ...style }}>
      {shadow && <ellipse cx={px} cy={py - 1} rx={w * 0.34} ry={w * 0.1} fill={ISO.slate} opacity={0.18} />}
      <g className={cls}>
        <image href={src} x={px - w / 2} y={py - h} width={w} height={h} preserveAspectRatio="xMidYMax meet" transform={flip ? `translate(${px * 2} 0) scale(-1 1)` : undefined} style={{ filter: 'drop-shadow(0 4px 3px rgba(16,32,58,0.18))' }} />
      </g>
    </g>
  )
}

/**
 * The official AWS Elastic Load Balancing icon (G1, G2) where a concept stage draws "a load balancer": the service
 * tile stands upright on its spot like the other parts, on a low plinth, with the same floor shadow.
 */
function Elb({ x, y, z = 0, h }: { x: number; y: number; z?: number; h: number }) {
  const { u } = useIso()
  const [px, py] = P(x, y, z, u)
  return (
    <g>
      <ellipse cx={px} cy={py - 1} rx={h * 0.5} ry={h * 0.15} fill={ISO.slate} opacity={0.18} />
      <rect x={px - h / 2 - 3} y={py - h - 9} width={h + 6} height={h + 6} rx={7} fill={colors.white} style={{ filter: 'drop-shadow(0 5px 4px rgba(16,32,58,0.2))' }} />
      <image href={SPR.elb[0]} x={px - h / 2} y={py - h - 6} width={h} height={h} preserveAspectRatio="xMidYMid meet" style={{ clipPath: 'inset(0 round 5px)' }} />
    </g>
  )
}

/** A tag inside a picture, in the TR's words: a DOM chip centred on `x`, its top at `y` (stage px). */
function Tag({ x, y, on = true, tone = 'plain', children, w }: { x: number; y: number; on?: boolean; tone?: LabelTone; children: ReactNode; w?: number }) {
  const tr = useTr()
  return (
    <At x={x} y={y} cx w={w}>
      <span className="block" style={{ opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(6px)', transition: `${tr('opacity')}, ${tr('transform')}` }}>
        <Label size={14} strong tone={tone} raised>
          {children}
        </Label>
      </span>
    </At>
  )
}

/** A red stop disc with a cross (a closed counter, a failed server), at stage px. No text. */
function Cross({ x, y, on = true, r = 11 }: { x: number; y: number; on?: boolean; r?: number }) {
  const tr = useTr()
  return (
    <g style={{ opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transformOrigin: `${x}px ${y}px`, transition: `${tr('opacity')}, ${tr('transform')}` }}>
      <circle cx={x} cy={y} r={r + 3} fill={colors.danger} opacity={0.18} />
      <circle cx={x} cy={y} r={r} fill={colors.danger} stroke={colors.white} strokeWidth={2} />
      <path d={`M${x - r * 0.4} ${y - r * 0.4} L${x + r * 0.4} ${y + r * 0.4} M${x + r * 0.4} ${y - r * 0.4} L${x - r * 0.4} ${y + r * 0.4}`} stroke={colors.white} strokeWidth={2.4} strokeLinecap="round" />
    </g>
  )
}

/** A green tick disc (a check passed, a hit), at stage px. */
function Tick({ x, y, on = true, r = 11 }: { x: number; y: number; on?: boolean; r?: number }) {
  const tr = useTr()
  return (
    <g style={{ opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transformOrigin: `${x}px ${y}px`, transition: `${tr('opacity')}, ${tr('transform')}` }}>
      <circle cx={x} cy={y} r={r + 3} fill={colors.success} opacity={0.18} />
      <circle cx={x} cy={y} r={r} fill={colors.success} stroke={colors.white} strokeWidth={2} />
      <path d={`M${x - r * 0.45} ${y + r * 0.02} L${x - r * 0.1} ${y + r * 0.38} L${x + r * 0.48} ${y - r * 0.34}`} fill="none" stroke={colors.white} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

/**
 * A route on the floor (grid points), drawn thin and solid with its head on the last point; `head` false for a
 * plain line. The head is a filled triangle along the last segment, so it always faces the target it lands on.
 */
function Route({ points, z = 0.05, color = colors.brand, width = 2.2, head = true, op = 1, dash }: { points: GridPt[]; z?: number; color?: string; width?: number; head?: boolean; op?: number; dash?: string }) {
  const tr = useTr()
  const { u } = useIso()
  const q = screenPts(points, z, u)
  const d = q.map(([a, b], i) => `${i ? 'L' : 'M'}${a.toFixed(2)} ${b.toFixed(2)}`).join(' ')
  let tip: ReactNode = null
  if (head && q.length >= 2) {
    const [ax, ay] = q[q.length - 2]
    const [bx, by] = q[q.length - 1]
    const ang = Math.atan2(by - ay, bx - ax)
    const L = 10
    const W = 4.6
    const p1: [number, number] = [bx - L * Math.cos(ang) + W * Math.sin(ang), by - L * Math.sin(ang) - W * Math.cos(ang)]
    const p2: [number, number] = [bx - L * Math.cos(ang) - W * Math.sin(ang), by - L * Math.sin(ang) + W * Math.cos(ang)]
    tip = <polygon points={pts([[bx, by], p1, p2])} fill={color} style={{ transition: tr('fill') }} />
  }
  /* the line stops short of the tip so the head is the end, not a blunt cap under it */
  return (
    <g style={{ opacity: op, transition: tr('opacity') }}>
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} pathLength={head ? undefined : undefined} style={{ transition: tr('stroke') }} />
      {tip}
    </g>
  )
}

/** A dot riding a floor route at phase `t` (0..1), fading in and out at the ends. */
function Dot({ points, t, z = 0.18, color = colors.brand, r = 5, on = true }: { points: GridPt[]; t: number; z?: number; color?: string; r?: number; on?: boolean }) {
  const { u } = useIso()
  const q = screenPts(points, z, u)
  const { seg, len } = measure(q)
  const tt = Math.min(1, Math.max(0, t))
  const [hx, hy] = along(q, seg, tt * len)
  const [tx, ty] = along(q, seg, Math.max(0, tt * len - 14))
  const edge = Math.min(1, Math.min(tt, 1 - tt) / 0.08)
  return (
    <g opacity={on ? edge : 0}>
      <line x1={tx} y1={ty} x2={hx} y2={hy} stroke={color} strokeWidth={r * 0.9} strokeLinecap="round" opacity={0.35} />
      <circle cx={hx} cy={hy} r={r} fill={color} stroke={colors.white} strokeWidth={1.5} />
    </g>
  )
}

/** The scene: the isometric box every picture is drawn in (one camera for all twelve). */
function Scene({ ox, oy, children, tags }: { ox: number; oy: number; children: ReactNode; tags?: ReactNode }) {
  return (
    <IsoScene w={SW} h={SH} ox={ox} oy={oy} u={UU}>
      <IsoSvg>{children}</IsoSvg>
      {tags}
    </IsoScene>
  )
}

/** Grid point to stage px, for placing a DOM tag or a badge against a drawn part. */
const at = (ox: number, oy: number, x: number, y: number, z = 0): [number, number] => {
  const [a, b] = P(x, y, z, UU)
  return [a + ox, b + oy]
}

/* ------------------------------------------------------------------ T01 · one ticket counter */

/*
 * TR 1: "A railway station with only one ticket counter forces every passenger to wait once that counter closes
 * for a break, exactly as a single server failing removes the only route available for every user's request."
 * Pairs, one press each: 1 the counter closes / the server fails; 2 every passenger waits / every request has
 * no route. Frame 0 is the working state (the clerk at the window, the requests reaching the server).
 * Loop after the build: requests ride the one route and stop at the cross; the passengers shift on their feet.
 */
const T01 = { ox: 196, oy: 150 } as const
/* the window (and the server) stand at x = 4.3 on the block's front; the queue runs left from it */
const T01_W: GridPt = [4.0, 0.9]
const T01_Q: GridPt[] = [
  [3.4, 1.6],
  [2.8, 2.4],
  [2.2, 3.2],
  [1.6, 4.0],
]
const T01_BLOCK = { x: 1.6, y: -0.1, w: 3.8, d: 1.0, h: 2.4 } as const

/** The floor every T01 picture stands on: the platform, the track bed behind its edge. */
function T01Floor({ rails }: { rails: boolean }) {
  const u = UU
  return (
    <g>
      <Quad x={-0.3} y={-0.3} w={5.7} d={4.6} fill={ISO.paper} />
      {rails && (
        <g>
          <Quad x={-0.3} y={-0.3} w={1.35} d={4.6} fill={shade(ISO.slate, 0.62)} />
          {[-0.02, 0.78].map((rx) => (
            <polyline key={rx} points={pts([P(rx, -0.3, 0.02, u), P(rx, 4.3, 0.02, u)])} fill="none" stroke={shade(ISO.slate, -0.1)} strokeWidth={2} />
          ))}
          {[0.1, 0.8, 1.5, 2.2, 2.9, 3.6].map((ry) => (
            <polyline key={ry} points={pts([P(-0.2, ry, 0.01, u), P(0.95, ry, 0.01, u)])} fill="none" stroke={shade(ISO.slate, 0.25)} strokeWidth={3} />
          ))}
          <Box x={1.05} y={-0.3} w={0.14} d={4.6} h={0.14} color={ISO.gold} />
        </g>
      )}
    </g>
  )
}

function T01Everyday({ step }: { step: number }) {
  const tr = useTr()
  const closed = step >= 1
  const waiting = step >= 2
  const { ox, oy } = T01
  const u = UU
  const B = T01_BLOCK
  /* the window on the block's front face, in face px (a along +x, b down from the top) */
  const winW = 46
  const winH = 36
  const winA = (T01_W[0] - B.x) * u - winW / 2
  const winB = B.h * u - 0.95 * u - winH
  const winPx = at(ox, oy, T01_W[0], B.y + B.d, 0.95 + winH / u)
  /* the break sign: hung from a nail over the window when it closes, it swings and settles (a damped swing) */
  const swing = useSwing(closed)
  const nail: [number, number] = [winA + winW / 2, winB - 9]
  /* the station clock left of the window: its second hand sweeps on while everyone waits */
  const sec = useLap(waiting, 6000, 0.3)
  const ck: [number, number] = [B.d * u * 0.5, 0.62 * u]
  const hand = (deg: number, len: number): [number, number] => [ck[0] + len * Math.sin((deg * Math.PI) / 180), ck[1] - len * Math.cos((deg * Math.PI) / 180)]
  return (
    <Scene
      ox={ox}
      oy={oy}
      tags={
        <>
          <Tag x={112} y={30}>
            A Railway Station
          </Tag>
          <Tag x={winPx[0] + 6} y={winPx[1] - 74}>
            Only One Ticket Counter
          </Tag>
          <Tag x={384} y={316} on={closed} tone="bad">
            Closes For A Break
          </Tag>
          <Tag x={176} y={316} on={waiting}>
            Forces Every Passenger To Wait
          </Tag>
        </>
      }
    >
      <T01Floor rails />
      {/* a train waiting on the track behind the platform */}
      <Shadow x={-0.12} y={-0.25} w={0.95} d={2.0} />
      <Box
        x={-0.12}
        y={-0.25}
        z={0.1}
        w={0.95}
        d={2.0}
        h={1.3}
        color={ISO.provider}
        onRight={
          <g>
            {[0.2, 0.85, 1.5].map((k) => (
              <rect key={k} x={k * u} y={0.22 * u} width={0.5 * u} height={0.38 * u} rx={2} fill={ISO.glass} />
            ))}
            <rect x={0} y={0.82 * u} width={2.0 * u} height={0.08 * u} fill={shade(ISO.provider, 0.5)} />
          </g>
        }
        onLeft={<rect x={0.18 * u} y={0.22 * u} width={0.58 * u} height={0.38 * u} rx={2} fill={ISO.glass} />}
      />
      {/* the station block, the one ticket window on its front */}
      <Shadow x={B.x} y={B.y} w={B.w} d={B.d} />
      <Box
        x={B.x}
        y={B.y}
        w={B.w}
        d={B.d}
        h={B.h}
        color={shade(ISO.steel, 0.4)}
        onRight={
          <g>
              {/* the station clock */}
              <circle cx={ck[0]} cy={ck[1]} r={13} fill={colors.white} stroke={ISO.provider} strokeWidth={2} />
              {[0, 90, 180, 270].map((d) => {
                const [a1, b1] = hand(d, 9)
                const [a2, b2] = hand(d, 11)
                return <line key={d} x1={a1} y1={b1} x2={a2} y2={b2} stroke={ISO.slate} strokeWidth={1.2} />
              })}
              <line x1={ck[0]} y1={ck[1]} x2={hand(300, 5.6)[0]} y2={hand(300, 5.6)[1]} stroke={ISO.ink} strokeWidth={1.8} strokeLinecap="round" />
              <line x1={ck[0]} y1={ck[1]} x2={hand(60, 8.6)[0]} y2={hand(60, 8.6)[1]} stroke={ISO.ink} strokeWidth={1.3} strokeLinecap="round" />
              <line x1={ck[0]} y1={ck[1]} x2={hand(sec * 360, 10)[0]} y2={hand(sec * 360, 10)[1]} stroke={colors.danger} strokeWidth={0.9} strokeLinecap="round" />
              <circle cx={ck[0]} cy={ck[1]} r={1.4} fill={ISO.ink} />
          </g>
        }
        onLeft={
          <g>
            <rect x={winA - 5} y={winB - 5} width={winW + 10} height={winH + 10} rx={3} fill={ISO.provider} />
            <rect x={winA} y={winB} width={winW} height={winH} rx={2} fill={ISO.glass} />
            {/* the shutter: a strip while open, down over the glass once the counter closes */}
            <rect x={winA} y={winB} width={winW} rx={1} fill={ISO.red} style={{ height: closed ? winH : 4, transition: tr('height') }} />
            {[0.25, 0.5, 0.75].map((k) => (
              <line key={k} x1={winA + 2} x2={winA + winW - 2} y1={winB + winH * k} y2={winB + winH * k} stroke={shade(ISO.red, -0.3)} strokeWidth={1} style={{ opacity: closed ? 1 : 0, transition: tr('opacity') }} />
            ))}
            <rect x={winA - 10} y={winB + winH + 5} width={winW + 20} height={5} rx={1.5} fill={shade(ISO.steel, -0.25)} />
            {[0.25, 0.75, 3.15].map((k) => (
              <rect key={k} x={k * u} y={0.5 * u} width={0.26 * u} height={0.8 * u} rx={1.5} fill={ISO.glass} />
            ))}
            {/* the break sign on its nail: a cup, no words; it swings in the wall's plane and settles */}
            <g style={{ opacity: closed ? 1 : 0, transition: tr('opacity') }}>
              <circle cx={nail[0]} cy={nail[1]} r={1.6} fill={ISO.ink} />
              <g transform={`rotate(${swing.toFixed(2)} ${nail[0]} ${nail[1]})`}>
                <path d={`M${nail[0]} ${nail[1]} L${nail[0] - 9} ${nail[1] + 9} M${nail[0]} ${nail[1]} L${nail[0] + 9} ${nail[1] + 9}`} stroke={ISO.ink} strokeWidth={0.9} fill="none" />
                <rect x={nail[0] - 14} y={nail[1] + 9} width={28} height={19} rx={3} fill={colors.white} stroke={ISO.ink} strokeWidth={1.2} />
                <path d={`M${nail[0] - 6} ${nail[1] + 14} h10 v6 a4 4 0 0 1 -4 4 h-2 a4 4 0 0 1 -4 -4 z`} fill={ISO.provider} />
                <path d={`M${nail[0] + 4} ${nail[1] + 15.5} a2.6 2.6 0 0 1 0 5.2`} fill="none" stroke={ISO.provider} strokeWidth={1.4} />
              </g>
            </g>
          </g>
        }
      />
      <Box x={B.x - 0.06} y={B.y - 0.06} z={B.h} w={B.w + 0.12} d={B.d + 0.12} h={0.14} color={shade(ISO.steel, 0.1)} />
      {/* the clerk at the window while it is open */}
      <g style={{ opacity: closed ? 0 : 1, transition: tr('opacity') }}>
        <Spr k="clerk" x={T01_W[0]} y={B.y + B.d + 0.01} z={0.95} h={34} shadow={false} />
      </g>
      {/* the queue, back to front: once they wait, each one shifts weight from foot to foot, out of step */}
      <Spr k="waiter" x={T01_Q[0][0]} y={T01_Q[0][1]} h={108} cls={waiting ? 'f-lean' : undefined} />
      <Spr k="girl" x={T01_Q[1][0]} y={T01_Q[1][1]} h={106} cls={waiting ? 'f-lean f-d1' : undefined} />
      <Spr k="man" x={T01_Q[2][0]} y={T01_Q[2][1]} h={108} cls={waiting ? 'f-lean f-d2' : undefined} />
      <Spr k="woman" x={T01_Q[3][0]} y={T01_Q[3][1]} h={108} cls={waiting ? 'f-lean f-d3' : undefined} />
    </Scene>
  )
}

/**
 * The requests after the failure: each rides the one route, brakes where the route is cut and joins the pile
 * there; the pile creeps forward and the front request fails at the cross (a red flash) and is gone. Phases are
 * spread evenly, so the pile never empties and the loop never pauses.
 */
function Piled({ points, t, n = 6 }: { points: GridPt[]; t: number; n?: number }) {
  const { u } = useIso()
  const q = screenPts(points, 0.18, u)
  const { seg, len } = measure(q)
  const PILE = 34
  const ARRIVE = 0.58
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const p = (t + i / n) % 1
        let s: number
        let op = 1
        let flash = -1
        if (p < ARRIVE) {
          const k = p / ARRIVE
          s = (1 - (1 - k) * (1 - k)) * (len - PILE)
          op = Math.min(1, k / 0.1)
        } else {
          const k = (p - ARRIVE) / (1 - ARRIVE)
          s = len - PILE + k * (PILE - 4)
          if (k > 0.82) {
            flash = (k - 0.82) / 0.18
            op = 1 - flash
          }
        }
        const [hx, hy] = along(q, seg, s)
        return (
          <g key={i}>
            {flash >= 0 && <circle cx={hx} cy={hy} r={5 + flash * 9} fill="none" stroke={colors.danger} strokeWidth={1.6} opacity={1 - flash} />}
            <circle cx={hx} cy={hy} r={5} fill={colors.danger} stroke={colors.white} strokeWidth={1.5} opacity={op} />
          </g>
        )
      })}
    </g>
  )
}

function T01Concept({ step }: { step: number }) {
  const tr = useTr()
  const held = useHeld()
  const failed = step >= 1
  const blocked = step >= 2
  const { ox, oy } = T01
  const t = useLap(true, 4200, 0.62)
  /* the hourglass over the waiting users: turned over once a lap, it settles with one soft overshoot */
  const hg = useLap(blocked, 3600, 0.5)
  const turn = springStep(Math.min(1, hg / 0.32)) * 180
  const B = T01_BLOCK
  /* the one route: in front of the users, from the last one to the server */
  const lane: GridPt[] = T01_Q.slice().reverse().map(([x, y]) => [x + 0.6, y + 0.6] as GridPt)
  const route: GridPt[] = [...lane, [T01_W[0] + 0.05, 1.55]]
  /* after the failure the route stops short of the server, at a cross */
  const cut: GridPt = [T01_W[0] + 0.02, 2.0]
  const srv = at(ox, oy, T01_W[0], 0.5, 0.3)
  const srvIn = at(0, 0, T01_W[0], 0.5, 0.3)
  const cutPx = at(0, 0, cut[0], cut[1], 0.05)
  const hgPx: [number, number] = [150 - ox, 156 - oy]
  return (
    <Scene
      ox={ox}
      oy={oy}
      tags={
        <>
          <Tag x={srv[0]} y={srv[1] - 154} on={failed} tone="bad">
            A Single Server Failing
          </Tag>
          <Tag x={360} y={308} on={blocked} tone="bad">
            Removes The Only Route
          </Tag>
          <Tag x={170} y={308} on={blocked}>
            Every User&apos;s Request
          </Tag>
        </>
      }
    >
      <T01Floor rails={false} />
      {/* the server on a plinth where the counter stood; the plinth's status light: green blinking while it serves, red once it fails */}
      <Box
        x={B.x + 1.6}
        y={B.y}
        w={B.w - 1.6}
        d={B.d}
        h={0.3}
        color={shade(ISO.steel, 0.4)}
        onLeft={
          <g>
            <rect x={0.86 * UU} y={3.5} width={0.5 * UU} height={7} rx={3.5} fill={shade(ISO.ink, 0.15)} />
            <circle cx={0.86 * UU + 5} cy={7} r={2.4} fill={failed ? colors.danger : ISO.green} className={held ? undefined : failed ? 'f-alarm' : 'f-blink'} />
            <circle cx={0.86 * UU + 11.5} cy={7} r={2.4} fill={failed ? shade(colors.danger, 0.5) : ISO.green} className={held ? undefined : failed ? 'f-alarm f-d1' : 'f-blink f-d2'} />
            <circle cx={0.86 * UU + 18} cy={7} r={2.4} fill={failed ? shade(colors.danger, 0.5) : ISO.green} className={held ? undefined : failed ? 'f-alarm f-d2' : 'f-blink f-d1'} />
          </g>
        }
      />
      <g style={{ filter: failed ? 'grayscale(0.9)' : 'none', opacity: failed ? 0.55 : 1, transition: `${tr('opacity')}, ${tr('filter')}` }}>
        <Spr k="server" x={T01_W[0]} y={0.5} z={0.3} h={106} />
      </g>
      <Cross x={srvIn[0]} y={srvIn[1] - 56} on={failed} r={15} />
      {/* the route and its requests: riding to the server, or piling up and failing where the route is cut */}
      <Route points={failed ? [...lane, cut] : route} color={failed ? DIM : colors.brand} head={!failed} />
      {failed ? (
        <Piled points={[...lane, cut]} t={t} />
      ) : (
        [0, 1, 2, 3].map((i) => <Dot key={i} points={route} t={(t + i * 0.25) % 1} color={colors.brand} />)
      )}
      <Cross x={cutPx[0]} y={cutPx[1]} on={failed} r={9} />
      {T01_Q.map(([x, y], i) => (
        <Spr key={i} k={(['userBoy', 'userGirl', 'userRed', 'userTie'] as const)[i]} x={x} y={y} h={82} />
      ))}
      {/* every user waits: the hourglass over the queue */}
      <g style={{ opacity: blocked ? 1 : 0, transition: tr('opacity') }}>
        <g transform={`rotate(${turn.toFixed(2)} ${hgPx[0]} ${hgPx[1] - 22})`}>
          <image href={SPR.hourglass[0]} x={hgPx[0] - (44 * SPR.hourglass[1]) / 2} y={hgPx[1] - 44} width={44 * SPR.hourglass[1]} height={44} style={{ filter: 'drop-shadow(0 4px 3px rgba(16,32,58,0.18))' }} />
        </g>
      </g>
    </Scene>
  )
}

/* ------------------------------------------------------------------ T06 · reception desk and staff corridors */

/*
 * TR 6: "An office building has a public reception desk anyone off the street can walk into, and separate
 * staff-only corridors reachable only by employees already inside, just as an internet-facing balancer accepts
 * any public visitor while an internal balancer accepts only traffic that already originates inside the VPC."
 * The building's floor is the VPC; the desk stands where the internet-facing balancer stands, the corridor where
 * the internal one stands, the employee where the inside server stands. Blue = public, teal = inside (both stages).
 * Pairs: 1 the desk and the visitor / the internet-facing balancer and the public visitor; 2 the corridors and the
 * employee / the internal balancer and the inside traffic. Loop: the visitor walks in, the employee walks the
 * corridor; the requests ride in.
 */
const T06 = { ox: 234, oy: 150 } as const
const IN = { x: 0, y: 0, w: 4.6, d: 3.0 } as const
const T06_DESK: GridPt = [1.45, 1.9]
const T06_STREET: GridPt = [1.45, 3.85]
const T06_CORR: GridPt = [2.3, 0.55]
const T06_EMP: GridPt = [4.3, 0.55]
const PART_Y = 1.2
const PUB = colors.brand
const INT = colors.teal

function T06Floor({ concept }: { concept: boolean }) {
  const u = UU
  return (
    <g>
      <Quad x={-0.25} y={-0.25} w={5.25} d={4.55} fill={ISO.paper} />
      {/* the street in front, its kerb */}
      <Quad x={-0.25} y={3.33} w={5.25} d={0.97} fill={shade(ISO.slate, 0.45)} />
      {[0.15, 1.15, 2.15, 3.15, 4.15].map((k) => (
        <Quad key={k} x={k} y={3.78} w={0.55} d={0.07} fill={colors.white} opacity={0.75} />
      ))}
      <Box x={-0.25} y={3.2} w={5.25} d={0.13} h={0.08} color={shade(ISO.steel, 0.3)} />
      {/* the building's floor (on the concept stage, the VPC) */}
      <Quad x={IN.x} y={IN.y} w={IN.w} d={IN.d} fill={concept ? shade(PUB, 0.9) : shade(ISO.steel, 0.72)} stroke={concept ? PUB : shade(ISO.steel, 0.1)} width={1.4} />
      {/* the staff side behind the partition line */}
      <Quad x={IN.x} y={IN.y} w={IN.w} d={PART_Y} fill={shade(INT, 0.82)} opacity={0.9} />
      {!concept && <polyline points={pts([P(0.1, 0.6, 0.01, u), P(4.5, 0.6, 0.01, u)])} fill="none" stroke={shade(INT, 0.4)} strokeWidth={1.2} />}
    </g>
  )
}

function useWalk(on: boolean, ms: number, still: number, from: GridPt, to: GridPt) {
  const t = useLap(on, ms, still)
  const k = Math.min(1, t / 0.8)
  const op = t < 0.08 ? t / 0.08 : t > 0.9 ? Math.max(0, (1 - t) / 0.1) : 1
  return { p: [from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k] as GridPt, op }
}

function T06Everyday({ step }: { step: number }) {
  const tr = useTr()
  const pub = step >= 1
  const staff = step >= 2
  const { ox, oy } = T06
  const u = UU
  const v = useWalk(pub, 5200, 0.8, T06_STREET, [T06_DESK[0] + 0.45, T06_DESK[1] + 0.72])
  const e = useWalk(staff, 6400, 0.45, [4.5, 0.6], [2.7, 0.6])
  const desk = at(ox, oy, T06_DESK[0], T06_DESK[1], 0.9)
  const corr = at(ox, oy, T06_CORR[0], T06_CORR[1], 0)
  const street = at(ox, oy, T06_STREET[0], T06_STREET[1], 0)
  return (
    <Scene
      ox={ox}
      oy={oy}
      tags={
        <>
          <Tag x={380} y={318}>
            An Office Building
          </Tag>
          <Tag x={100} y={desk[1] - 34} on={pub}>
            Public Reception Desk
          </Tag>
          <Tag x={112} y={street[1] + 6} on={pub}>
            Anyone Off The Street
          </Tag>
          <Tag x={corr[0] + 20} y={corr[1] - 124} on={staff} tone="brand">
            Staff-Only Corridors
          </Tag>
          <Tag x={356} y={corr[1] + 44} on={staff} tone="brand">
            Employees Already Inside
          </Tag>
        </>
      }
    >
      <T06Floor concept={false} />
      {/* the two back walls, with the staff offices' doors along the corridor */}
      <Box
        x={-0.15}
        y={0}
        w={0.15}
        d={IN.d}
        h={2.0}
        color={shade(ISO.steel, 0.42)}
        onRight={
          <g>
            {[0.45, 1.4, 2.3].map((k) => (
              <rect key={k} x={k * u} y={0.35 * u} width={0.5 * u} height={0.7 * u} rx={2} fill={ISO.glass} />
            ))}
          </g>
        }
      />
      <Box
        x={0}
        y={-0.15}
        w={IN.w}
        d={0.15}
        h={2.0}
        color={shade(ISO.steel, 0.42)}
        onLeft={
          <g>
            {[1.3, 2.85].map((k) => (
              <g key={k}>
                <rect x={k * u} y={0.55 * u} width={0.55 * u} height={1.45 * u} rx={2} fill={shade(INT, 0.25)} />
                <circle cx={(k + 0.44) * u} cy={1.3 * u} r={2} fill={colors.white} />
              </g>
            ))}
            {[0.35, 2.1, 3.65].map((k) => (
              <rect key={k} x={k * u} y={0.35 * u} width={0.55 * u} height={0.6 * u} rx={2} fill={ISO.glass} />
            ))}
          </g>
        }
      />
      {/* the employee walking the corridor (behind the partition) */}
      <g style={{ opacity: staff ? 1 : 0.0, transition: tr('opacity') }}>
        <Spr k="suit" x={e.p[0]} y={e.p[1]} h={98} op={e.op} />
      </g>
      {/* the glass partition with the staff door and its lock */}
      <Box x={0} y={PART_Y - 0.08} w={2.9} d={0.08} h={1.0} color={ISO.glass} opacity={0.78} />
      <Box x={3.6} y={PART_Y - 0.08} w={1.0} d={0.08} h={1.0} color={ISO.glass} opacity={0.78} />
      <Box
        x={2.9}
        y={PART_Y - 0.08}
        w={0.7}
        d={0.08}
        h={1.5}
        color={shade(INT, 0.1)}
        onLeft={
          <g>
            <rect x={0.5 * u} y={0.75 * u} width={7} height={9} rx={1.5} fill={ISO.gold} />
            <path d={`M${0.5 * u + 1.5} ${0.75 * u} v-3 a2 2 0 0 1 4 0 v3`} fill="none" stroke={ISO.gold} strokeWidth={1.6} />
          </g>
        }
      />
      {/* the receptionist behind the desk, the desk */}
      <Spr k="reception" x={T06_DESK[0] + 0.1} y={T06_DESK[1] - 0.45} h={94} />
      <Shadow x={T06_DESK[0] - 0.75} y={T06_DESK[1] - 0.22} w={1.5} d={0.5} />
      <Box x={T06_DESK[0] - 0.75} y={T06_DESK[1] - 0.22} w={1.5} d={0.5} h={0.85} color={shade(PUB, 0.55)} />
      <Box x={T06_DESK[0] - 0.8} y={T06_DESK[1] - 0.27} z={0.85} w={1.6} d={0.6} h={0.08} color={shade(PUB, 0.3)} />
      {/* the entrance in the front: open on the public side */}
      <Quad x={T06_DESK[0] - 0.55} y={2.75} w={1.1} d={0.3} fill={shade(PUB, 0.6)} />
      <Box x={2.15} y={2.92} w={2.45} d={0.08} h={0.35} color={shade(ISO.steel, 0.25)} />
      <Box x={0} y={2.92} w={0.85} d={0.08} h={0.35} color={shade(ISO.steel, 0.25)} />
      {/* the visitor off the street: an adult passer-by walking in */}
      <g style={{ opacity: pub ? 1 : 0, transition: tr('opacity') }}>
        <Spr k="visitor" x={v.p[0]} y={v.p[1]} h={104} op={v.op} />
      </g>
    </Scene>
  )
}

function T06Concept({ step }: { step: number }) {
  const pub = step >= 1
  const staff = step >= 2
  const { ox, oy } = T06
  const t = useLap(true, 3000, 0.55)
  const desk = at(ox, oy, T06_DESK[0], T06_DESK[1], 0.9)
  const corr = at(ox, oy, T06_CORR[0], T06_CORR[1], 0)
  const street = at(ox, oy, T06_STREET[0], T06_STREET[1], 0)
  const inRoute: GridPt[] = [
    [T06_STREET[0], T06_STREET[1] - 0.4],
    [T06_DESK[0], T06_DESK[1] + 0.32],
  ]
  const intRoute: GridPt[] = [
    [T06_EMP[0] - 0.55, T06_EMP[1] + 0.1],
    [T06_CORR[0] + 0.62, T06_CORR[1] + 0.1],
  ]
  return (
    <Scene
      ox={ox}
      oy={oy}
      tags={
        <>
          <Tag x={380} y={318} tone="brand">
            Inside The VPC
          </Tag>
          <Tag x={140} y={desk[1] - 78} on={pub}>
            Internet-Facing Balancer
          </Tag>
          <Tag x={112} y={street[1] + 6} on={pub}>
            Accepts Any Public Visitor
          </Tag>
          <Tag x={corr[0] + 20} y={corr[1] - 124} on={staff} tone="brand">
            Internal Balancer
          </Tag>
          <Tag x={356} y={corr[1] + 44} on={staff} tone="brand">
            Already Originates Inside
          </Tag>
        </>
      }
    >
      <T06Floor concept />
      {/* the internal balancer in the corridor, the inside server where the employee walks */}
      <g style={{ opacity: staff ? 1 : 0.35 }}>
        <Route points={intRoute} color={INT} op={staff ? 1 : 0} />
        <Dot points={intRoute} t={(t + 0.5) % 1} color={INT} on={staff} />
        <Dot points={intRoute} t={t} color={INT} on={staff} />
        <Quad x={T06_CORR[0] - 0.55} y={T06_CORR[1] - 0.45} w={1.1} d={0.9} fill={shade(INT, 0.55)} stroke={INT} width={1.2} />
        <Elb x={T06_CORR[0]} y={T06_CORR[1]} h={50} />
        <Spr k="server" x={T06_EMP[0]} y={T06_EMP[1]} h={76} />
      </g>
      {/* the internet-facing balancer where the desk stands, and the public visitor on the street */}
      <g style={{ opacity: pub ? 1 : 0.35 }}>
        <Quad x={T06_DESK[0] - 0.55} y={T06_DESK[1] - 0.45} w={1.1} d={0.9} fill={shade(PUB, 0.7)} stroke={PUB} width={1.2} />
        <Elb x={T06_DESK[0]} y={T06_DESK[1]} h={50} />
        <Route points={inRoute} color={PUB} op={pub ? 1 : 0} />
        <Dot points={inRoute} t={t} color={PUB} on={pub} />
        <Dot points={inRoute} t={(t + 0.5) % 1} color={PUB} on={pub} />
        <Spr k="globe" x={T06_STREET[0]} y={T06_STREET[1] + 0.1} h={64} />
      </g>
    </Scene>
  )
}

/* ------------------------------------------------------------------ T11 · exam halls by roll number */

/*
 * TR 11: "In an exam, each student's hall is decided by their roll number (for example, the last digit decides
 * the hall), so the same student always goes to the same hall. In the same way, IP hash uses the client's IP
 * address to always route that client to the same backend server."
 * Left to right on both stages: three students (clients) with one colour each, the notice (the balancer) in the
 * middle, Hall 1 and Hall 2 (Server 1 and Server 2) on the right. Pairs: 1 the roll numbers / the clients' IP
 * addresses; 2 the last digit decides the hall / IP hash; 3 the same hall / the same backend server, every time.
 * Loop: each one rides its own two legs again, to the same place.
 */
const T11 = { ox: 235, oy: 40 } as const
/** Stage px to grid (floor, z = 0) on a scene's camera: a layout is set where it reads, then drawn in the iso grid. */
const gridOf = (ox: number, oy: number) => (sx: number, sy: number): GridPt => {
  const a = (sx - ox) / UU
  const b = (sy - oy) / (UU / 2)
  return [(a + b) / 2, (b - a) / 2]
}
const g11 = gridOf(T11.ox, T11.oy)
type Px = [number, number]
type Foot = { x: number; y: number; w: number; d: number; h: number }
/** A building's footprint from its front (lowest) corner in stage px. */
const footAt = (g: (sx: number, sy: number) => GridPt, F: Px, w: number, d: number, h: number): Foot => {
  const [x, y] = g(F[0], F[1])
  return { x: x - w, y: y - d, w, d, h }
}
/** The point just in front of the middle of a footprint's left (door) face, in stage px, `k` px along the face. */
const doorPx = (F: Px, w: number, k = 0): Px => [F[0] - (w * UU) / 2 - 5.5 + k * 0.894, F[1] - (w * UU) / 4 + 2.8 + k * 0.447]
const T11_C = [colors.brand, colors.teal, ISO.customer] as const
/* the three students (clients), feet in stage px; their hall by the last digit: A and B Hall 1, C Hall 2 */
const T11_S: Px[] = [
  [78, 145],
  [78, 235],
  [78, 325],
]
/* the notice (balancer) and its square pad: corners left, top, right, bottom */
const T11_M: Px = [240, 235]
const T11_PAD = 1.6
const T11_F1: Px = [412, 160]
const T11_F2: Px = [412, 318]
const HW = 1.2
const HD = 0.9
const T11_H1 = footAt(g11, T11_F1, HW, HD, 1.45)
const T11_H2 = footAt(g11, T11_F2, HW, HD, 1.45)

/**
 * The legs, in stage px. In: each student's line fans in and lands on the pad's near edges, three separate heads.
 * Out: the two Hall 1 lines leave the pad's far edge side by side and land on the two halves of Hall 1's door,
 * parallel, never crossing; the Hall 2 line leaves the pad's bottom corner and reaches Hall 2's door from the front.
 */
const T11_IN: Px[][] = [
  [
    [114, 150],
    [196, 220],
  ],
  [
    [114, 237],
    [165, 235],
  ],
  [
    [114, 321],
    [196, 250],
  ],
]
const T11_OUT: Px[][] = [
  [[284, 220], doorPx(T11_F1, HW, -7)],
  [[304, 230], doorPx(T11_F1, HW, 7)],
  [[250, 267], doorPx(T11_F2, HW, 0)],
]
const gp = (g: (sx: number, sy: number) => GridPt, q: Px[]) => q.map(([a, b]) => g(a, b))

function T11Floor() {
  return (
    <g>
      <Quad x={-3} y={-3} w={14} d={14} fill={ISO.paper} />
    </g>
  )
}

/** The square pad under the middle part (the notice, the balancer). */
function Pad({ c, n, fill, stroke }: { c: GridPt; n: number; fill: string; stroke: string }) {
  return <Quad x={c[0] - n / 2} y={c[1] - n / 2} w={n} d={n} fill={fill} stroke={stroke} width={1.2} />
}

function Hall({ x, y, w, d, h }: Foot) {
  const u = UU
  const fw = w * u
  return (
    <g>
      <Shadow x={x} y={y} w={w} d={d} />
      <Box
        x={x}
        y={y}
        w={w}
        d={d}
        h={h}
        color={shade(ISO.steel, 0.38)}
        onLeft={
          <g>
            {[0.08, 0.74].map((k) => (
              <rect key={k} x={fw * k} y={0.28 * u} width={fw * 0.18} height={0.42 * u} rx={2} fill={ISO.glass} />
            ))}
            <rect x={fw * 0.36} y={h * u - 0.95 * u} width={fw * 0.28} height={0.95 * u} rx={2} fill={shade(ISO.provider, -0.1)} />
            <rect x={fw * 0.36 + 3} y={h * u - 0.95 * u + 3} width={fw * 0.28 - 6} height={0.95 * u - 3} rx={1.5} fill={shade(ISO.provider, 0.25)} />
          </g>
        }
        onRight={
          <g>
            {[0.2, 0.6].map((k) => (
              <rect key={k} x={d * u * k} y={0.28 * u} width={d * u * 0.2} height={0.42 * u} rx={2} fill={ISO.glass} />
            ))}
          </g>
        }
      />
      <Box x={x - 0.08} y={y - 0.08} z={h} w={w + 0.16} d={d + 0.16} h={0.14} color={shade(ISO.provider, 0.2)} />
    </g>
  )
}

/** The centre of a footprint's top at height z, in stage px. */
const topAt = (ox: number, oy: number, H: Foot, z: number) => at(ox, oy, H.x + H.w / 2, H.y + H.d / 2, z)

function T11Paths({ step, t }: { step: number; t: number }) {
  return (
    <>
      {[0, 1, 2].map((i) => {
        const into = gp(g11, T11_IN[i])
        const out = gp(g11, T11_OUT[i])
        return (
          <g key={i}>
            <Route points={into} z={0} color={T11_C[i]} op={step >= 1 ? 1 : 0} />
            <Route points={out} z={0} color={T11_C[i]} op={step >= 3 ? 1 : 0} />
            <Dot points={into} z={0.12} t={(t + i * 0.33) % 1} color={T11_C[i]} on={step >= 3} />
            <Dot points={out} z={0.12} t={(t + i * 0.33 + 0.5) % 1} color={T11_C[i]} on={step >= 3} />
          </g>
        )
      })}
    </>
  )
}

/** The digit (or IP) colour chip beside each student, left of the figure so the lines on the right stay clear. */
function T11Chips({ step, text }: { step: number; text?: string[] }) {
  const tr = useTr()
  return (
    <>
      {T11_S.map(([x, y], i) => (
        <At key={i} x={x - 46} y={y - 66} cx>
          <span className="block" style={{ opacity: step >= 1 ? 1 : 0, transition: tr('opacity') }}>
            {text ? (
              <Label size={14} strong mono raised style={{ background: T11_C[i], color: colors.white, boxShadow: `inset 0 0 0 1.5px ${T11_C[i]}, 0 8px 16px -10px rgba(16,32,58,0.35)` }}>
                {text[i]}
              </Label>
            ) : (
              <span className="block rounded-full" style={{ width: 20, height: 20, marginTop: 3, background: T11_C[i], boxShadow: `0 0 0 2px ${colors.white}, 0 8px 16px -10px rgba(16,32,58,0.35)` }} />
            )}
          </span>
        </At>
      ))}
    </>
  )
}

function T11Everyday({ step }: { step: number }) {
  const { ox, oy } = T11
  const t = useLap(step >= 3, 3600, 0.62)
  const r1 = topAt(ox, oy, T11_H1, T11_H1.h + 0.14)
  const r2 = topAt(ox, oy, T11_H2, T11_H2.h + 0.14)
  const M = g11(...T11_M)
  return (
    <Scene
      ox={ox}
      oy={oy}
      tags={
        <>
          <Tag x={r1[0]} y={r1[1] - 14}>
            Hall 1
          </Tag>
          <Tag x={r2[0]} y={r2[1] - 14}>
            Hall 2
          </Tag>
          <T11Chips step={step} text={['1', '1', '2']} />
          <Tag x={92} y={20} on={step >= 1}>
            Roll Number
          </Tag>
          <Tag x={T11_M[0]} y={84} on={step >= 2} tone="brand">
            The Last Digit
          </Tag>
          <Tag x={T11_M[0]} y={116} on={step >= 2} tone="brand">
            Decides The Hall
          </Tag>
          <Tag x={240} y={350} on={step >= 3}>
            Same Student Always Goes To The Same Hall
          </Tag>
        </>
      }
    >
      <T11Floor />
      <Hall {...T11_H1} />
      <Hall {...T11_H2} />
      <Pad c={M} n={T11_PAD} fill={shade(ISO.steel, 0.72)} stroke={shade(ISO.steel, 0.15)} />
      <T11Paths step={step} t={t} />
      {/* the notice in the middle of its pad: a post and a board */}
      <Box x={M[0] - 0.05} y={M[1] - 0.05} w={0.1} d={0.1} h={1.2} color={ISO.slate} />
      <Box
        x={M[0] - 0.5}
        y={M[1] - 0.03}
        z={0.95}
        w={1.0}
        d={0.06}
        h={0.72}
        color={colors.white}
        tone={{ left: colors.white, top: shade(ISO.steel, 0.5), right: shade(ISO.steel, 0.3) }}
        onLeft={
          <g>
            {[0.16, 0.34, 0.52].map((k) => (
              <rect key={k} x={6} y={k * UU} width={UU - 12} height={3} rx={1.5} fill={shade(ISO.steel, 0.1)} />
            ))}
          </g>
        }
      />
      {T11_S.map((p, i) => {
        const [x, y] = g11(...p)
        return <Spr key={i} k={(['boy', 'teacher', 'girl'] as const)[i]} x={x} y={y} h={90} />
      })}
    </Scene>
  )
}

function T11Concept({ step }: { step: number }) {
  const { ox, oy } = T11
  const t = useLap(step >= 3, 3600, 0.62)
  const SRV = 78
  const s1 = topAt(ox, oy, T11_H1, 0.3)
  const s2 = topAt(ox, oy, T11_H2, 0.3)
  const M = g11(...T11_M)
  const mid = (H: Foot): GridPt => [H.x + H.w / 2, H.y + H.d / 2]
  return (
    <Scene
      ox={ox}
      oy={oy}
      tags={
        <>
          <Tag x={s1[0]} y={s1[1] - SRV - 30}>
            Server 1
          </Tag>
          <Tag x={s2[0]} y={s2[1] - SRV - 30}>
            Server 2
          </Tag>
          <T11Chips step={step} />
          <Tag x={104} y={20} on={step >= 1}>
            Client&apos;s IP Address
          </Tag>
          <Tag x={T11_M[0]} y={116} on={step >= 2} tone="brand">
            IP Hash
          </Tag>
          <Tag x={240} y={350} on={step >= 3}>
            Always Route That Client To The Same Backend Server
          </Tag>
        </>
      }
    >
      <T11Floor />
      {[T11_H1, T11_H2].map((H, i) => (
        <g key={i}>
          <Shadow x={H.x} y={H.y} w={H.w} d={H.d} />
          <Box x={H.x} y={H.y} w={H.w} d={H.d} h={0.3} color={shade(ISO.steel, 0.38)} />
          <Spr k="server" x={mid(H)[0]} y={mid(H)[1]} z={0.3} h={SRV} shadow={false} />
        </g>
      ))}
      <Pad c={M} n={T11_PAD} fill={shade(colors.brand, 0.8)} stroke={colors.brand} />
      <T11Paths step={step} t={t} />
      {/* the load balancer applying the hash, where the notice stands: the official ELB mark (G1, G2) */}
      <Elb x={M[0]} y={M[1]} h={50} />
      {T11_S.map((p, i) => {
        const [x, y] = g11(...p)
        /* three different clients: the first, the second and the third are three different people */
        return <Spr key={i} k={(['userBoy', 'userGirl', 'userYellow'] as const)[i]} x={x} y={y} h={74} />
      })}
    </Scene>
  )
}

/* ------------------------------------------------------------------ shared parts of T14, T18, T20 */

/** A pulse ring (breathing / running): a loop of rings growing out, held as one still ring. */
function Ring({ x, y, r, on, color = ISO.green }: { x: number; y: number; r: number; on: boolean; color?: string }) {
  const held = useHeld()
  const tr = useTr()
  return (
    <g style={{ opacity: on ? 1 : 0, transition: tr('opacity') }}>
      <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={2} opacity={held ? 0.55 : 0.25} />
      {!held && on && (
        <>
          <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={2} className="f-ring" />
          <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={2} className="f-ring f-ring2" />
        </>
      )}
    </g>
  )
}

/** A row of `n` result ticks centred on (x, y): the first `lit` full, the rest faint. */
function TickRow({ x, y, n, lit, on, gap = 28 }: { x: number; y: number; n: number; lit: number; on: boolean; gap?: number }) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <g key={i} style={{ opacity: i < lit ? 1 : 0.28 }}>
          <Tick x={x + (i - (n - 1) / 2) * gap} y={y} r={9} on={on} />
        </g>
      ))}
    </g>
  )
}

/* ------------------------------------------------------------------ T14 · a repeated vitals check */

/*
 * TR 14: "A doctor does not assume a patient is fine just because they are breathing; a short, repeated vitals
 * check confirms the body is actually functioning, just as a health check confirms the server is actually serving
 * requests correctly, not merely running."
 * The doctor stands where the load balancer stands, the patient where the server stands. Pairs: 1 breathing / merely
 * running (the same pulse ring on both); 2 the short, repeated vitals check / the health check (a check rides the
 * line again and again); 3 actually functioning / actually serving requests correctly (a tick for every check).
 * Loop: four checks a lap, each lighting the next tick, then the row starts again at once.
 */
const T14 = { ox: 235, oy: 40 } as const
const g14 = gridOf(T14.ox, T14.oy)
const T14_D: Px = [95, 300]
const T14_P: Px = [395, 300]
const T14_PAD = 1.3
const T14_LINE: Px[] = [
  [160, 300],
  [333, 300],
]
const T14_TICKS: Px = [395, 82]
/* the vitals monitor (everyday) and the meter (concept), behind the line between the two */
const T14_MON: Px = [222, 212]

function useChecks(step: number) {
  const t = useLap(step >= 2, 6400, 0.999)
  const k = t * 4
  return { dot: k % 1, lit: Math.min(4, Math.floor(k) + 1) }
}

function T14Stage({ step, everyday }: { step: number; everyday: boolean }) {
  const { dot, lit } = useChecks(step)
  const line = gp(g14, T14_LINE)
  const D = g14(...T14_D)
  const Pp = g14(...T14_P)
  const [ox, oy] = [T14.ox, T14.oy]
  return (
    <>
      <T11Floor />
      <Pad c={D} n={T14_PAD} fill={everyday ? shade(ISO.steel, 0.72) : shade(colors.brand, 0.8)} stroke={everyday ? shade(ISO.steel, 0.15) : colors.brand} />
      <Pad c={Pp} n={T14_PAD} fill={everyday ? shade(ISO.green, 0.82) : shade(ISO.green, 0.82)} stroke={shade(ISO.green, 0.2)} />
      <Route points={line} z={0} color={colors.brand} op={step >= 2 ? 1 : 0} />
      <Dot points={line} z={0.12} t={dot} color={colors.brand} on={step >= 2} />
      {everyday ? (
        <>
          {/* the vitals monitor on its stand: a flat trace until the check confirms the body is functioning */}
          {(() => {
            const Mo = g14(...T14_MON)
            const fw = 0.95 * UU
            const fh = 0.62 * UU
            const ok = step >= 3
            return (
              <g>
                <Box x={Mo[0] - 0.05} y={Mo[1] - 0.05} w={0.1} d={0.1} h={1.5} color={ISO.slate} />
                <Box x={Mo[0] - 0.3} y={Mo[1] - 0.3} w={0.6} d={0.6} h={0.06} color={ISO.slate} />
                <Box
                  x={Mo[0] - 0.47}
                  y={Mo[1] - 0.03}
                  z={1.45}
                  w={0.95}
                  d={0.06}
                  h={0.62}
                  color={ISO.ink}
                  tone={{ left: shade(ISO.ink, 0.12), top: shade(ISO.ink, 0.3), right: ISO.ink }}
                  onLeft={
                    <g>
                      <rect x={3} y={3} width={fw - 6} height={fh - 6} rx={2} fill={shade(ISO.ink, 0.25)} />
                      <polyline
                        points={pts(ok ? [[5, fh / 2], [14, fh / 2], [18, fh / 2 - 9], [22, fh / 2 + 8], [26, fh / 2], [fw - 5, fh / 2]] : [[5, fh / 2], [fw - 5, fh / 2]])}
                        fill="none"
                        stroke={ok ? ISO.green : shade(ISO.steel, 0.2)}
                        strokeWidth={1.8}
                        strokeLinejoin="round"
                      />
                    </g>
                  }
                />
              </g>
            )
          })()}
          <Spr k="doctor" x={D[0]} y={D[1]} h={150} />
          <Ring x={T14_P[0] - ox} y={T14_P[1] - oy - 80} r={44} on={step >= 1} />
          <Spr k="man" x={Pp[0]} y={Pp[1]} h={146} cls={step >= 1 ? 'f-sway' : undefined} />
        </>
      ) : (
        <>
          <Spr k="meter" x={g14(...T14_MON)[0]} y={g14(...T14_MON)[1]} h={50} />
          <Elb x={D[0]} y={D[1]} h={64} />
          <Ring x={T14_P[0] - ox} y={T14_P[1] - oy - 60} r={66} on={step >= 1} />
          <Spr k="server" x={Pp[0]} y={Pp[1]} h={120} />
        </>
      )}
      <TickRow x={T14_TICKS[0] - ox} y={T14_TICKS[1] - oy} n={4} lit={lit} on={step >= 3} />
    </>
  )
}

function T14Everyday({ step }: { step: number }) {
  return (
    <Scene
      ox={T14.ox}
      oy={T14.oy}
      tags={
        <>
          <Tag x={T14_D[0]} y={114}>
            A Doctor
          </Tag>
          <Tag x={T14_P[0]} y={118}>
            A Patient
          </Tag>
          <Tag x={330} y={345} on={step >= 1} tone="good">
            Just Because They Are Breathing
          </Tag>
          <Tag x={234} y={250} on={step >= 2} tone="brand">
            Short, Repeated Vitals Check
          </Tag>
          <Tag x={366} y={30} on={step >= 3} tone="good">
            Actually Functioning
          </Tag>
        </>
      }
    >
      <T14Stage step={step} everyday />
    </Scene>
  )
}

function T14Concept({ step }: { step: number }) {
  return (
    <Scene
      ox={T14.ox}
      oy={T14.oy}
      tags={
        <>
          <Tag x={T14_D[0]} y={174}>
            Load Balancer
          </Tag>
          <Tag x={T14_P[0]} y={138}>
            Server
          </Tag>
          <Tag x={330} y={345} on={step >= 1} tone="good">
            Not Merely Running
          </Tag>
          <Tag x={234} y={250} on={step >= 2} tone="brand">
            Health Check
          </Tag>
          <Tag x={318} y={30} on={step >= 3} tone="good">
            Actually Serving Requests Correctly
          </Tag>
        </>
      }
    >
      <T14Stage step={step} everyday={false} />
    </Scene>
  )
}

/* ------------------------------------------------------------------ T18 · a food delivery app */

/*
 * TR 18: "When you order from a restaurant chain on a food delivery app, the app automatically sends your order to
 * the branch nearest to you or the one that is open and least busy, even though you only searched the restaurant's
 * name. In the same way, DNS-based routing takes one domain name and returns the address of the regional server best
 * suited for each user."
 * Customers (users) on the left, the app (DNS) in the middle, three branches (regional servers) on the right. The
 * top customer's nearest branch is open; the bottom customer's nearest branch is closed, so that order goes to the
 * open, least busy one in the middle. Pairs: 1 only the restaurant's name / one domain name; 2 the branch nearest to
 * you / the regional server; 3 open and least busy / best suited for each user.
 */
const T18 = { ox: 235, oy: 40 } as const
const g18 = gridOf(T18.ox, T18.oy)
const T18_C: Px[] = [
  [55, 300],
  [420, 330],
]
const T18_M: Px = [235, 255]
const T18_PAD = 1.4
const KW = 0.95
const KD = 0.7
/* three branches along the back: the top-left customer's nearest (open), the open and least busy one, and the
   bottom-right customer's nearest, closed */
const T18_K: Px[] = [
  [116, 146],
  [300, 146],
  [420, 146],
]
const T18_KF = T18_K.map((F) => footAt(g18, F, KW, KD, 0.9))
const T18_IN: Px[][] = [
  [
    [90, 295],
    [190, 264.7],
  ],
  [
    [392, 322],
    [280, 264.7],
  ],
]
const T18_OUT: Px[][] = [
  [[205, 237.8], doorPx(T18_K[0], KW)],
  [[280, 245.3], doorPx(T18_K[1], KW)],
]
const T18_COL = [colors.brand, colors.teal] as const

/** A branch: a small shop with an awning over its door; `closed` pulls the shutter down. */
function Kiosk({ x, y, w, d, h, closed = false, awning = ISO.gold }: Foot & { closed?: boolean; awning?: string }) {
  const tr = useTr()
  const u = UU
  const fw = w * u
  const dh = 0.62 * u
  return (
    <g>
      <Shadow x={x} y={y} w={w} d={d} />
      <Box
        x={x}
        y={y}
        w={w}
        d={d}
        h={h}
        color={shade(ISO.steel, 0.4)}
        onLeft={
          <g>
            <rect x={fw * 0.12} y={h * u - dh - 4} width={fw * 0.76} height={dh + 4} rx={2} fill={shade(ISO.provider, -0.05)} />
            <rect x={fw * 0.12 + 3} y={h * u - dh} width={fw * 0.76 - 6} height={dh} rx={1.5} fill={ISO.glass} />
            <rect x={fw * 0.12 + 3} y={h * u - dh} width={fw * 0.76 - 6} rx={1} fill={ISO.red} style={{ height: closed ? dh : 0, transition: tr('height') }} />
            {[0.3, 0.55, 0.8].map((k) => (
              <line key={k} x1={fw * 0.12 + 5} x2={fw * 0.88 - 5} y1={h * u - dh + dh * k} y2={h * u - dh + dh * k} stroke={shade(ISO.red, -0.3)} strokeWidth={1} opacity={closed ? 1 : 0} />
            ))}
          </g>
        }
        onRight={<rect x={d * u * 0.25} y={0.22 * u} width={d * u * 0.5} height={0.32 * u} rx={2} fill={ISO.glass} />}
      />
      {/* the awning over the door, and the roof */}
      <Box x={x + w * 0.08} y={y + d} z={h - 0.3} w={w * 0.84} d={0.12} h={0.07} color={awning} />
      <Box x={x - 0.06} y={y - 0.06} z={h} w={w + 0.12} d={d + 0.12} h={0.12} color={shade(ISO.provider, 0.2)} />
    </g>
  )
}

/**
 * The orders on the everyday stage: food bags in the customer's colour riding ONE path, customer to the app and on
 * to the branch, at one steady speed. Inside the app (the stretch across the pad) a bag fades out and back in: the
 * app takes the order and sends it on. Until a branch's line is shown, a bag that reaches the app stays there.
 * `t` is the lap phase; three orders per customer are always in flight.
 */
function Orders({ into, out, t, color, onward, on }: { into: GridPt[]; out: GridPt[]; t: number; color: string; onward: boolean; on: boolean }) {
  const { u } = useIso()
  const qi = screenPts(into, 0.12, u)
  const qa = screenPts([...into, ...out], 0.12, u)
  const { seg, len } = measure(qa)
  const Li = measure(qi).len
  const Lo = len - measure(screenPts(out, 0.12, u)).len
  return (
    <g style={{ opacity: on ? 1 : 0 }}>
      {[0, 1, 2].map((k) => {
        const p = (t + k / 3) % 1
        const sd = p * len
        if (!onward && sd > Li) return null
        const [hx, hy] = along(qa, seg, sd)
        /* fade in at the customer, out and back in across the app, out at the branch's door */
        let op = Math.min(1, sd / 18, (len - sd) / 18)
        if (sd > Li - 10 && sd < Lo + 10) op = Math.min(op, Math.abs(sd - (Li + Lo) / 2) / ((Lo - Li) / 2 + 10))
        return (
          <g key={k} transform={`translate(${hx.toFixed(2)} ${(hy - 6).toFixed(2)})`} opacity={Math.max(0, op)}>
            <ellipse cx={0} cy={10} rx={7.5} ry={2.4} fill={ISO.slate} opacity={0.18} />
            <path d="M-4.2 -5.6 a4.2 4.2 0 0 1 8.4 0" fill="none" stroke={color} strokeWidth={1.9} />
            <rect x={-8} y={-6} width={16} height={14} rx={2.6} fill={color} stroke={colors.white} strokeWidth={1.4} />
            <line x1={-5.5} x2={5.5} y1={-1.8} y2={-1.8} stroke={colors.white} strokeWidth={1.1} opacity={0.75} />
          </g>
        )
      })}
    </g>
  )
}

function T18Stage({ step, everyday }: { step: number; everyday: boolean }) {
  const t = useLap(step >= 3, 3400, 0.6)
  /* the everyday orders are live from the first press: they ride in, and on to a branch once its line is shown */
  const to = useLap(everyday && step >= 1, 4200, 0.6)
  const M = g18(...T18_M)
  const mid = (H: Foot): GridPt => [H.x + H.w / 2, H.y + H.d / 2]
  return (
    <>
      <T11Floor />
      {T18_KF.map((H, i) =>
        everyday ? (
          <Kiosk key={i} {...H} closed={i === 2} />
        ) : (
          <g key={i} style={{ filter: i === 2 ? 'grayscale(0.9)' : 'none', opacity: i === 2 ? 0.6 : 1 }}>
            <Shadow x={H.x} y={H.y} w={H.w} d={H.d} />
            <Box x={H.x} y={H.y} w={H.w} d={H.d} h={0.3} color={shade(ISO.steel, 0.38)} />
            <Spr k="server" x={mid(H)[0]} y={mid(H)[1]} z={0.3} h={60} shadow={false} />
          </g>
        ),
      )}
      <Pad c={M} n={T18_PAD} fill={everyday ? shade(ISO.steel, 0.72) : shade(colors.brand, 0.8)} stroke={everyday ? shade(ISO.steel, 0.15) : colors.brand} />
      {[0, 1].map((i) => {
        const into = gp(g18, T18_IN[i])
        const out = gp(g18, T18_OUT[i])
        return (
          <g key={i}>
            <Route points={into} z={0} color={T18_COL[i]} op={step >= 1 ? 1 : 0} />
            <Route points={out} z={0} color={T18_COL[i]} op={step >= 2 + i ? 1 : 0} />
            {everyday ? (
              <Orders into={into} out={out} t={(to + i * 0.17) % 1} color={T18_COL[i]} onward={step >= 2 + i} on={step >= 1} />
            ) : (
              <>
                <Dot points={into} z={0.12} t={(t + i * 0.5) % 1} color={T18_COL[i]} on={step >= 3} />
                <Dot points={out} z={0.12} t={(t + i * 0.5 + 0.5) % 1} color={T18_COL[i]} on={step >= 3} />
              </>
            )}
          </g>
        )
      })}
      {everyday ? (
        /* the app: a phone standing on the pad, the search bar and a list of branches on its screen */
        <Box
          x={M[0] - 0.42}
          y={M[1] - 0.05}
          w={0.84}
          d={0.1}
          h={1.55}
          color={ISO.ink}
          tone={{ left: shade(ISO.ink, 0.15), top: shade(ISO.ink, 0.3), right: ISO.ink }}
          onLeft={
            <g>
              <rect x={4} y={5} width={0.84 * UU - 8} height={1.55 * UU - 10} rx={4} fill={colors.white} />
              <rect x={4} y={5} width={0.84 * UU - 8} height={12} rx={4} fill={ISO.provider} />
              <rect x={8} y={22} width={0.84 * UU - 16} height={9} rx={4.5} fill={shade(ISO.steel, 0.7)} stroke={shade(ISO.steel, 0.2)} strokeWidth={0.8} />
              {[38, 48, 58].map((yy, r) => (
                <g key={yy}>
                  <rect x={8} y={yy} width={7} height={7} rx={1.5} fill={r === 2 && step >= 3 ? ISO.red : ISO.gold} />
                  <rect x={18} y={yy + 2} width={0.84 * UU - 28} height={3} rx={1.5} fill={shade(ISO.steel, 0.3)} />
                </g>
              ))}
            </g>
          }
        />
      ) : (
        <Spr k="globe" x={M[0]} y={M[1]} h={66} />
      )}
      {T18_C.map((p, i) => {
        const [x, y] = g18(...p)
        /* the customers ordering on a device: the top-left one faces the app on her right, the bottom-right one turns to it on his left */
        return everyday ? <Spr key={i} k={(['tabWoman', 'suit'] as const)[i]} x={x} y={y} h={98} flip={i === 1} /> : <Spr key={i} k={i ? 'userBoy' : 'userGirl'} x={x} y={y} h={74} />
      })}
      {(() => {
        const r = topAt(0, 0, T18_KF[2], everyday ? 0.5 : 0.95)
        return <Cross x={r[0]} y={r[1]} on={step >= 3} r={11} />
      })()}
    </>
  )
}

function T18Everyday({ step }: { step: number }) {
  return (
    <Scene
      ox={T18.ox}
      oy={T18.oy}
      tags={
        <>
          <Tag x={T18_M[0]} y={298}>
            Food Delivery App
          </Tag>
          <Tag x={T18_M[0]} y={342} on={step >= 1} tone="warn">
            Only Searched The Restaurant&apos;s Name
          </Tag>
          <Tag x={112} y={22} on={step >= 2} tone="brand">
            Branch Nearest To You
          </Tag>
          <Tag x={294} y={22} on={step >= 3} tone="good">
            Open And Least Busy
          </Tag>
        </>
      }
    >
      <T18Stage step={step} everyday />
    </Scene>
  )
}

function T18Concept({ step }: { step: number }) {
  return (
    <Scene
      ox={T18.ox}
      oy={T18.oy}
      tags={
        <>
          <Tag x={T18_M[0]} y={298}>
            DNS-Based Routing
          </Tag>
          <Tag x={T18_M[0]} y={342} on={step >= 1} tone="warn">
            One Domain Name
          </Tag>
          <Tag x={112} y={22} on={step >= 2} tone="brand">
            Regional Server
          </Tag>
          <Tag x={294} y={22} on={step >= 3} tone="good">
            Best Suited For Each User
          </Tag>
        </>
      }
    >
      <T18Stage step={step} everyday={false} />
    </Scene>
  )
}

/* ------------------------------------------------------------------ T20 · a neighbourhood shop */

/*
 * TR 20: "A neighbourhood shop stocks popular items so customers need not travel to a distant factory every time,
 * just as an edge location holds popular content and only the first request travels to the origin."
 * The shop stands where the edge location stands, the factory where the origin stands, the customers where the
 * users stand. Pairs: 1 stocks popular items / holds popular content; 2 the customers buy at the shop / the users
 * are answered at the edge; 3 no trip to the factory every time / only the first request travels to the origin.
 * Loop: the short trips run on; on the concept the long trip runs once a lap, the first request.
 */
const T20 = { ox: 235, oy: 40 } as const
const g20 = gridOf(T20.ox, T20.oy)
const T20_SF: Px = [250, 300]
const SW20 = 1.1
const SD20 = 0.85
const T20_S = footAt(g20, T20_SF, SW20, SD20, 0.95)
const T20_FF: Px = [406, 196]
const FW20 = 1.5
const T20_F = footAt(g20, T20_FF, FW20, 1.0, 1.0)
const T20_C: Px[] = [
  [50, 235],
  [60, 350],
]
const T20_IN: Px[][] = [
  [[82, 244], doorPx(T20_SF, SW20, -8)],
  [[92, 345], doorPx(T20_SF, SW20, 8)],
]
/* the long trip: from the first customer to the factory door, above the shop's roof */
const T20_LONG: Px[] = [[84, 218], doorPx(T20_FF, FW20)]
/* the first request: from the edge's right corner to the origin */
const T20_FIRST: Px[] = [[T20_SF[0] + SD20 * UU + 4, T20_SF[1] - SD20 * (UU / 2) - 2], doorPx(T20_FF, FW20, 6)]

function Factory({ x, y, w, d, h }: Foot) {
  const u = UU
  const fw = w * u
  return (
    <g>
      <Shadow x={x} y={y} w={w} d={d} />
      {/* the chimney behind */}
      <Box x={x + w - 0.45} y={y + 0.1} w={0.28} d={0.28} h={h + 0.9} color={shade(ISO.slate, 0.2)} />
      <Box
        x={x}
        y={y}
        w={w}
        d={d}
        h={h}
        color={shade(ISO.steel, 0.25)}
        onLeft={
          <g>
            {[0.06, 0.32, 0.58].map((k) => (
              <rect key={k} x={fw * k} y={0.25 * u} width={fw * 0.16} height={0.3 * u} rx={2} fill={ISO.glass} />
            ))}
            <rect x={fw * 0.78} y={h * u - 0.7 * u} width={fw * 0.16} height={0.7 * u} rx={2} fill={shade(ISO.slate, -0.1)} />
            <rect x={fw * 0.36} y={h * u - 0.5 * u} width={fw * 0.28} height={0.5 * u} rx={1.5} fill={shade(ISO.provider, -0.05)} />
          </g>
        }
      />
      {/* the saw-tooth roof */}
      {[0, 1, 2].map((i) => (
        <Box key={i} x={x + (i * w) / 3} y={y} z={h} w={w / 3 - 0.04} d={d} h={0.22} color={shade(ISO.provider, 0.2)} />
      ))}
    </g>
  )
}

function T20Stage({ step, everyday }: { step: number; everyday: boolean }) {
  const t = useLap(step >= 2, 3200, 0.62)
  const tf = useLap(step >= 3, 6400, 0.5)
  const S = T20_S
  const midS: GridPt = [S.x + S.w / 2, S.y + S.d / 2]
  const tr = useTr()
  const longMid = gp(g20, T20_LONG)
  const cross = (() => {
    const [a, b] = T20_LONG
    return [a[0] + (b[0] - a[0]) * 0.75 - T20.ox, a[1] + (b[1] - a[1]) * 0.75 - T20.oy] as Px
  })()
  return (
    <>
      <T11Floor />
      {everyday ? (
        <Factory {...T20_F} />
      ) : (
        <g>
          <Shadow x={T20_F.x} y={T20_F.y} w={T20_F.w} d={T20_F.d} />
          <Box x={T20_F.x} y={T20_F.y} w={T20_F.w} d={T20_F.d} h={0.3} color={shade(ISO.steel, 0.38)} />
          <Spr k="server" x={T20_F.x + 0.45} y={T20_F.y + 0.5} z={0.3} h={76} shadow={false} />
          <Spr k="database" x={T20_F.x + 1.12} y={T20_F.y + 0.55} z={0.3} h={56} shadow={false} />
        </g>
      )}
      {everyday ? (
        <>
          <Kiosk {...S} />
          {/* the popular items: stacked boxes beside the shop's side window */}
          <g style={{ opacity: step >= 1 ? 1 : 0, transition: tr('opacity') }}>
            {[
              [0.15, 0, 0],
              [0.15, 0.32, 0],
              [0.15, 0.16, 0.26],
            ].map(([dy, dx, z], i) => (
              <Box key={i} x={S.x + S.w + 0.08 + dx * 0.2} y={S.y + dy + dx} z={z} w={0.28} d={0.28} h={0.26} color={ISO.gold} />
            ))}
          </g>
        </>
      ) : (
        <g>
          <Shadow x={S.x} y={S.y} w={S.w} d={S.d} />
          <Box x={S.x} y={S.y} w={S.w} d={S.d} h={0.3} color={shade(ISO.steel, 0.38)} />
          <Spr k="server" x={midS[0]} y={midS[1]} z={0.3} h={70} shadow={false} />
          <g style={{ opacity: step >= 1 ? 1 : 0, transition: tr('opacity') }}>
            <Spr k="files" x={S.x + S.w + 0.22} y={S.y + S.d - 0.12} h={32} />
          </g>
        </g>
      )}
      {/* the long trip */}
      {everyday ? (
        <g style={{ opacity: step >= 3 ? 1 : 0, transition: tr('opacity') }}>
          <Route points={longMid} z={0} color={ISO.slate} head={false} dash="5 6" op={0.55} />
          <Cross x={cross[0]} y={cross[1]} r={11} />
        </g>
      ) : (
        <g style={{ opacity: step >= 3 ? 1 : 0, transition: tr('opacity') }}>
          <Route points={gp(g20, T20_FIRST)} z={0} color={ISO.customer} />
          <Dot points={gp(g20, T20_FIRST)} z={0.12} t={tf} color={ISO.customer} on={step >= 3} />
        </g>
      )}
      {/* the short trips: customers (users) to the shop (edge) door */}
      {[0, 1].map((i) => {
        const p = gp(g20, T20_IN[i])
        return (
          <g key={i}>
            <Route points={p} z={0} color={colors.brand} op={step >= 2 ? 1 : 0} />
            <Dot points={p} z={0.12} t={(t + i * 0.5) % 1} color={colors.brand} on={step >= 2} />
          </g>
        )
      })}
      {T20_C.map((p, i) => {
        const [x, y] = g20(...p)
        return everyday ? <Spr key={i} k={(['girl', 'mansuit'] as const)[i]} x={x} y={y} h={92} /> : <Spr key={i} k={i ? 'userBoy' : 'userGirl'} x={x} y={y} h={74} />
      })}
    </>
  )
}

function T20Everyday({ step }: { step: number }) {
  return (
    <Scene
      ox={T20.ox}
      oy={T20.oy}
      tags={
        <>
          <Tag x={212} y={12} on={step >= 3} tone="bad">
            Need Not Travel To A Distant Factory Every Time
          </Tag>
          <Tag x={252} y={104}>
            A Distant Factory
          </Tag>
          <Tag x={190} y={146} on={step >= 1} tone="brand">
            Stocks Popular Items
          </Tag>
          <Tag x={56} y={110} on={step >= 2}>
            Customers
          </Tag>
          <Tag x={300} y={318}>
            A Neighbourhood Shop
          </Tag>
        </>
      }
    >
      <T20Stage step={step} everyday />
    </Scene>
  )
}

function T20Concept({ step }: { step: number }) {
  return (
    <Scene
      ox={T20.ox}
      oy={T20.oy}
      tags={
        <>
          <Tag x={212} y={12} on={step >= 3} tone="warn">
            Only The First Request Travels To The Origin
          </Tag>
          <Tag x={252} y={104}>
            The Origin
          </Tag>
          <Tag x={190} y={146} on={step >= 1} tone="brand">
            Holds Popular Content
          </Tag>
          <Tag x={300} y={318}>
            An Edge Location
          </Tag>
        </>
      }
    >
      <T20Stage step={step} everyday={false} />
    </Scene>
  )
}

/* ------------------------------------------------------------------ exports */

export const figures = {
  F_T01Everyday: T01Everyday,
  F_T01Concept: T01Concept,
  F_T06Everyday: T06Everyday,
  F_T06Concept: T06Concept,
  F_T11Everyday: T11Everyday,
  F_T11Concept: T11Concept,
  F_T14Everyday: T14Everyday,
  F_T14Concept: T14Concept,
  F_T18Everyday: T18Everyday,
  F_T18Concept: T18Concept,
  F_T20Everyday: T20Everyday,
  F_T20Concept: T20Concept,
}

export const slides = {}

export const css = `
@keyframes f-sway { 0% { transform: translateY(0) } 50% { transform: translateY(-2.5px) } 100% { transform: translateY(0) } }
.f-sway { animation: f-sway 2.4s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
.f-d1 { animation-delay: -0.6s } .f-d2 { animation-delay: -1.2s } .f-d3 { animation-delay: -1.8s }
.cc-still .f-sway, .deck-thumb .f-sway { animation: none !important; }
@keyframes f-ring { 0% { transform: scale(0.8); opacity: 0.75 } 100% { transform: scale(1.35); opacity: 0 } }
.f-ring { animation: f-ring 2s linear infinite; transform-box: fill-box; transform-origin: 50% 50%; }
.f-ring2 { animation-delay: -1s }
.cc-still .f-ring, .deck-thumb .f-ring { animation: none !important; opacity: 0 }
@keyframes f-lean { 0% { transform: rotate(0deg) translateX(0) } 25% { transform: rotate(-1.6deg) translateX(-1px) } 50% { transform: rotate(0deg) translateX(0) } 75% { transform: rotate(1.4deg) translateX(1px) } 100% { transform: rotate(0deg) translateX(0) } }
.f-lean { animation: f-lean 3.4s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
@keyframes f-blink { 0%, 100% { opacity: 1 } 50% { opacity: 0.35 } }
.f-blink { animation: f-blink 1.6s ease-in-out infinite; }
@keyframes f-alarm { 0%, 100% { opacity: 1 } 50% { opacity: 0.25 } }
.f-alarm { animation: f-alarm 0.9s ease-in-out infinite; }
.cc-still .f-lean, .deck-thumb .f-lean, .cc-still .f-blink, .deck-thumb .f-blink, .cc-still .f-alarm, .deck-thumb .f-alarm { animation: none !important; }
.f-lean.f-d1, .f-blink.f-d1, .f-alarm.f-d1 { animation-delay: -0.6s } .f-lean.f-d2, .f-blink.f-d2, .f-alarm.f-d2 { animation-delay: -1.2s } .f-lean.f-d3 { animation-delay: -1.8s }
@media (prefers-reduced-motion: reduce) { .f-sway, .f-ring, .f-lean, .f-blink, .f-alarm { animation: none !important; } }
`
