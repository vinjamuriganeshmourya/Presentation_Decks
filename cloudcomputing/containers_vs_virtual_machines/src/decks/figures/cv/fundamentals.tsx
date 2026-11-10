import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AppWindow, Box as BoxIco, Cog, Copy, FolderTree, ListTree, MessagesSquare, Network, PenLine, Tag as TagIco, UserRound, Cpu, Droplets, Eye, FileText, Gauge, HardDrive, Layers, MemoryStick, Package, X as XIco, Zap } from 'lucide-react'
import { useAutoAnim } from '@/deck/autoAnim'
import { colors } from '@/design/tokens'
import { Arrow, At, BOX_W, Card, Label, STILL, Stage, useCycle, useLoop } from '../scene'
import { LAB } from '../d3/kit'
import { Box, FACE_STROKE, ISO, IsoAt, IsoScene, IsoSvg, P, Quad, Shadow, pts, shade, useP } from '../iso/iso'
import { Lock } from '../iso/objects'
import { AN_W, FIG_H, IsoAnalogy, lead } from '../iso/frames'
import { Badge, fx, LitFigure, LitPoints, NeedleGauge, Ripple } from './fx'
import { VisualTable } from './vtable'
import { Chip, LayerStack, LockGlyph, Logo, Slab, STACK, Tile } from './frames'

/**
 * SECTION 1 · CONTAINER FUNDAMENTALS (T01-1 to T03-2). The one container
 * picture (`ContainerHost`) and the one layer stack (`LayerStack`) from this
 * session's frames; every label is a word the card already has.
 *
 * Each figure runs ONE loop whose motion is the card's press sequence:
 *   T01-1   the TR image's stack: the three containers stand on the Container Engine one by one
 *   T01-AN  the pairs light in turn: lock beside namespaces, foundation beside host kernel
 *   T02-1   each namespace box lights and points at the kernel, in the table's row order
 *   T03-1   the three meters' needles rise and fall inside one cgroup box
 *   T03-2   the read-only layers merge into one view, then the writable top layer
 *           takes a copy of the one changed file; the layers under it never change
 * On harness URLs every loop holds its most complete state.
 */

const EASE = 'cubic-bezier(0.22,1,0.36,1)'

/** 0 before a, 1 after b, eased between. */
function within(t: number, a: number, b: number) {
  if (t <= a) return 0
  if (t >= b) return 1
  const x = (t - a) / (b - a)
  return x * x * (3 - 2 * x)
}

/* ================================================================== T01-1 · what a container is */

const T01_POINTS = ['Namespaces : limit WHAT a process can see', 'Control groups : limit HOW MUCH it can use', 'Union filesystem : layers that build the image itself']

/* the TR image (shots/slide-01-1.png) calls all three apps "App 1"; one name per box (user, 2026-10-30) */
const T01_APPS = ['App 1', 'App 2', 'App 3']
const COL_W = 118
const COL_GAP = 12
const COLS_W = COL_W * 3 + COL_GAP * 2
const ENGINE_W = COLS_W + 28
const HOSTOS_W = COLS_W + 96
const FAST = 320

/* the three isolation features, one icon each, the same icon on the point and on every container */
const FEATURE_ICON = [<Eye key="e" />, <Gauge key="g" />, <Layers key="l" />]

/**
 * THE TR DIAGRAM, BUILT AS THE DESCRIPTION READS (user, 2026-11-03, slide 5):
 *   0  the Host OS alone, the machine's one kernel
 *   1  the Container Engine lands on it, its gear turning: it runs the containers
 *   2-4 the three containers land on the engine one by one, no OS of their own
 *   5  every container gets the eye (namespaces: WHAT it can see), point 1 lit
 *   6  every container gets the gauge, its needle sweeping (cgroups: HOW MUCH), point 2 lit
 *   7  every container gets the layers (union filesystem), point 3 lit
 * One press per state with auto animation off; harness URLs hold state 7.
 */
function useContainerBuild() {
  return useCycle(9, 1300, 7, 7)
}

function FeatureBadge({ i, on }: { i: number; on: boolean }) {
  return (
    <Badge on={on} size={30} ring={i === 0 ? colors.brand : i === 1 ? colors.accent : STACK.layer}>
      <span className="grid place-items-center [&>svg]:h-[16px] [&>svg]:w-[16px]" style={{ color: i === 0 ? colors.brand : i === 1 ? colors.accent : STACK.layer }}>
        {/* the gauge's needle moves, never the dial (corrections, slide 5) */}
        {/* each feature acts out its job: the eye looks (glows), the needle measures, the layers stack (hop) */}
        {i === 1 ? (
          <NeedleGauge size={16} run={on} />
        ) : (
          <span className={`grid place-items-center ${on ? fx(i === 0 ? 'glow' : 'hop', i * 0.3, i === 0 ? 2 : 2.4).className : ''}`} style={on ? fx(i === 0 ? 'glow' : 'hop', i * 0.3, i === 0 ? 2 : 2.4).style : undefined}>
            {FEATURE_ICON[i]}
          </span>
        )}
      </span>
    </Badge>
  )
}

function ContainerScene({ k }: { k: number }) {
  const engine = k >= 1
  const stand = Math.max(0, Math.min(3, k - 1))
  const bracket = k >= 4
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <div className="relative flex items-end" style={{ gap: COL_GAP }}>
        {/* the dashed bracket on the containers' left, "Containers" turned up its side */}
        <div className="absolute flex items-center" style={{ right: COLS_W + 12, top: 36, bottom: 0, opacity: bracket ? 1 : 0, transition: `opacity ${FAST}ms ${EASE}` }}>
          <span className="whitespace-nowrap font-heading text-[16px] font-semibold" style={{ color: colors.ink, writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            Containers
          </span>
          <div className="ml-2 self-stretch" style={{ width: 12, borderTop: `2px dashed ${colors.muted}`, borderLeft: `2px dashed ${colors.muted}`, borderBottom: `2px dashed ${colors.muted}`, borderRadius: '4px 0 0 4px' }} />
        </div>
        {T01_APPS.map((a, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5" style={{ opacity: i < stand ? 1 : 0, transform: i < stand ? 'none' : 'translateY(-22px)', transition: `opacity ${FAST}ms ${EASE}, transform ${FAST + 120}ms cubic-bezier(0.34,1.4,0.64,1)` }}>
            {/* the features this container gets, one badge per press */}
            <div className="flex gap-1.5" style={{ height: 30 }}>
              {[0, 1, 2].map((f) => (
                <FeatureBadge key={f} i={f} on={k >= 5 + f} />
              ))}
            </div>
            <Tile w={COL_W} lit={!STILL && k >= 5 && k <= 7} style={{ position: 'relative' }}>
              {/* a running process: its status light comes on when the container lands */}
              <span aria-hidden className={`absolute rounded-full ${i < stand ? fx('glow', i * 0.4, 1.6).className : ''}`} style={{ ...(i < stand ? fx('glow', i * 0.4, 1.6).style : {}), right: 7, top: 7, width: 8, height: 8, background: colors.success, boxShadow: '0 0 0 2px #fff' }} />
              <div className="flex flex-col gap-1.5">
                <div className="flex h-[48px] items-center justify-center gap-1.5 rounded-[9px] font-heading text-[16px] font-semibold" style={{ color: colors.ink, background: 'linear-gradient(180deg, #FFFFFF 0%, #F4F7FE 100%)', boxShadow: 'inset 0 0 0 1px #CFDCF5' }}>
                  <AppWindow size={16} color={colors.brand} aria-hidden />
                  {a}
                </div>
                <div className="flex h-[48px] items-center justify-center gap-1.5 rounded-[9px] font-heading text-[16px] font-semibold" style={{ color: colors.ink, background: 'linear-gradient(180deg, #E9F0FF 0%, #D6E3FB 100%)', boxShadow: 'inset 0 0 0 1px #B9CCF2' }}>
                  <Package size={15} color={STACK.layer} aria-hidden />
                  libs/bins
                </div>
              </div>
            </Tile>
          </div>
        ))}
      </div>
      {/* the containers stand ON the engine, no gap (user, 2026-10-30: stacked layers) */}
      <div style={{ opacity: engine ? 1 : 0, transform: engine ? 'none' : 'translateY(-18px)', transition: `opacity ${FAST}ms ${EASE}, transform ${FAST + 80}ms ${EASE}` }}>
        <Slab w={ENGINE_W} fill={STACK.engine}>
          <span className="inline-flex items-center gap-2">
            <span className={`grid place-items-center ${fx('spin', 0, 5).className}`} style={fx('spin', 0, 5).style}>
              <Cog size={18} aria-hidden />
            </span>
            Container Engine
            <span className="ml-1 grid h-[26px] w-[34px] place-items-center rounded-[8px] bg-white">
              <Logo name="docker" h={18} />
            </span>
          </span>
        </Slab>
      </div>
      <div className="mt-2.5">
        <Slab w={HOSTOS_W} h={46} fill={STACK.kernel} size={19}>
          <span className="inline-flex items-center gap-2">
            <Cpu size={19} aria-hidden />
            Host OS
            <span className="ml-1 grid h-[28px] w-[28px] place-items-center rounded-[8px] bg-white">
              <Logo name="linux" h={21} />
            </span>
          </span>
        </Slab>
      </div>
      <span className="mt-4 font-heading text-[20px] font-bold" style={{ color: colors.ink }}>
        Containerization
      </span>
    </div>
  )
}

function ContainerFigure() {
  const k = useContainerBuild()
  return (
    <div className="flex items-center" style={{ width: BOX_W, gap: 24 }}>
      <LitPoints items={T01_POINTS.map((t, i) => ({ icon: FEATURE_ICON[i], text: t }))} lit={k >= 5 && k <= 7 ? k - 5 : -1} />
      <Stage w={BOX_W - 452 - 24} h={FIG_H} active={false}>
        <ContainerScene k={k} />
      </Stage>
    </div>
  )
}

export function Container({ lesson }: { lesson: string }) {
  return (
    <Card
      id="T01-1"
      kicker="Container Isolation Basics"
      title="Process-Level Isolation"
      lead={lead('A container is a running process that shares the host machine\'s kernel but gets its own isolated view of files, network and other processes, with no separate guest operating system of its own')}
      lesson={lesson}
    >
      <ContainerFigure />
    </Card>
  )
}

/* ================================================================== T01-AN · flats in one building */

/* both scenes share one baseline: the foundation and the host kernel sit at the same height */
const AN_SH = 400 // the stage height: with no lead and no captions (user, 2026-10-28) the pictures take the freed space
const AN_SLAB_BOTTOM = 84
const SLAB_W = 380 // the host kernel slab on the concept side
/*
  THE BUILDING (user, 2026-10-30: "recreate the analogy visual from scratch,
  realistic and 3D, with real-life proportions and real-world object shapes"):
  session 2's isometric engine (`../iso/iso`), one scale for everything. A
  three-storey block on a concrete foundation slab, one flat per floor, each
  with its own front door and padlock on the right face and windows on both
  faces, floor slabs between the storeys, a flat roof. ONE electricity line (a
  utility pole, a cable to the wall, a yellow riser with a meter per floor)
  and ONE water line (a street valve, a blue pipe up the same wall with a
  meter per floor), both on the left face, shared by every flat. Labels are
  HTML over the svg, as the engine asks.
*/
const BU = 46 // px per grid unit
const B = { x: 0.3, y: 0.3, w: 2.6, d: 1.8 } // the walls' footprint on the foundation
const FOUND = { x: 0.18, y: 0.18, w: 2.84, d: 2.04, h: 0.35 } // the foundation slab, a ledge of 0.12 round the walls
const FY = B.y + B.d // the left face's plane (the utilities' wall)
const FLOOR_H = 1
const SLAB_H = 0.08
const FLOORS = 3
const floorZ = (i: number) => FOUND.h + i * (FLOOR_H + SLAB_H)
const ROOF_Z = floorZ(FLOORS)
const WALL = '#F4F6FA'
const SLAB_TONE = '#D3DAE6'
const CONCRETE = '#B9C2CF'
const DOOR = '#4A5B74'
const CABLE = '#F2C14E'
const PIPE = '#3B82F6'
const CABLE_X = 0.5 // the electricity riser's place along the left face
const PIPE_X = 0.86 // the water riser's place along the left face
const DOOR_A = 0.7 // the door's place along the right face, a fraction of d
const LOCK_Y = B.y + B.d * DOOR_A + 0.16 // the padlock on the door's latch side
const LOCK_Z = 0.4 // the padlock's height above a floor
const POLE = { x: -0.9, y: 2.6, h: 3.3 }
const VALVE = { x: -0.3, y: 2.6 }

/** The left face of one storey: two windows, right of the risers. */
function LeftWindows() {
  const fw = B.w * BU
  const fh = FLOOR_H * BU
  const win = (a: number) => <rect x={fw * a} y={fh * 0.3} width={fw * 0.19} height={fh * 0.36} rx={1.2} fill={ISO.glass} stroke="#9FB3D1" strokeWidth={1} style={FACE_STROKE} />
  return (
    <g>
      {win(0.4)}
      {win(0.7)}
    </g>
  )
}

/** The right face of one storey: a window and the flat's own front door. */
function RightDoor() {
  const fw = B.d * BU
  const fh = FLOOR_H * BU
  const dx = fw * (DOOR_A - 0.12)
  const dw = fw * 0.24
  return (
    <g>
      <rect x={fw * 0.16} y={fh * 0.3} width={fw * 0.24} height={fh * 0.36} rx={1.2} fill={ISO.glass} stroke="#9FB3D1" strokeWidth={1} style={FACE_STROKE} />
      <rect x={dx} y={fh * 0.3} width={dw} height={fh * 0.7} rx={1.5} fill={DOOR} />
      <rect x={dx + 2.5} y={fh * 0.3 + 2.5} width={dw - 5} height={fh * 0.7 - 2.5} rx={1} fill="none" stroke="#8798B3" strokeWidth={0.8} style={FACE_STROKE} />
    </g>
  )
}

/**
 * A meter box on the wall where a riser branches into a flat: the CONNECTION POINT
 * (corrections 2026-11-03, slide 6: "define the connection points more clearly"):
 * a white-rimmed box in the line's colour with its mark, a bolt stroke or a drop.
 */
function Meter({ at, tone, kind }: { at: [number, number]; tone: string; kind: 'power' | 'water' }) {
  const [x, y] = at
  return (
    <g>
      <rect x={x - 7} y={y - 7} width={14} height={14} rx={2.5} fill="#fff" stroke={shade(tone, -0.3)} strokeWidth={1.4} />
      {kind === 'power' ? (
        <path d={`M ${x + 1.2} ${y - 4.5} L ${x - 2.6} ${y + 0.6} L ${x + 0.2} ${y + 0.6} L ${x - 1.2} ${y + 4.5} L ${x + 2.8} ${y - 0.8} L ${x} ${y - 0.8} Z`} fill={shade(tone, -0.15)} />
      ) : (
        <path d={`M ${x} ${y - 4.6} C ${x + 3.4} ${y - 0.6} ${x + 3.4} ${y + 4.2} ${x} ${y + 4.2} C ${x - 3.4} ${y + 4.2} ${x - 3.4} ${y - 0.6} ${x} ${y - 4.6} Z`} fill={tone} />
      )}
    </g>
  )
}

/** A dot running along a straight stretch of a line, the line's flow (power down from the cable, water up from the main). */
function FlowDots({ from, to, tone, n = 3, dur = 1.8 }: { from: [number, number]; to: [number, number]; tone: string; n?: number; dur?: number }) {
  if (STILL) return null
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const f = fx('flow', (-i * dur) / n, dur)
        return <circle key={i} cx={from[0]} cy={from[1]} r={3.2} fill="#fff" stroke={tone} strokeWidth={2} className={f.className} style={{ ...f.style, ['--dx' as string]: `${to[0] - from[0]}px`, ['--dy' as string]: `${to[1] - from[1]}px` }} />
      })}
    </>
  )
}

/** THE PARTS the analogy walks, one per press (corrections 2026-11-03, slide 6), then all of them at rest. */
const PART = { foundation: 0, power: 1, water: 2, lock: 3 } as const
const AN_STATES = 5 // the four parts, then the whole picture
const FADE = 0.26
const fadeT = `opacity 460ms ${EASE}`
/** 1 for the part in focus (or every part when none is), faded otherwise. */
const opFor = (focus: number, part: number) => (focus < 0 || focus === part ? 1 : FADE)
const focusOf = (k: number) => (STILL || k >= 4 ? -1 : k)

function Block({ k }: { k: number }) {
  const p = useP()
  const focus = focusOf(k)
  const lit = focus === PART.foundation
  const floors = Array.from({ length: FLOORS }, (_, i) => i)
  const opP = opFor(focus, PART.power)
  const opW = opFor(focus, PART.water)
  const opF = opFor(focus, PART.foundation)
  const opL = opFor(focus, PART.lock)
  /* the building itself steps back whenever one part is in focus */
  const opB = focus < 0 ? 1 : 0.42
  /* the top flat's padlock, where the "lock" label's arrow points */
  const [lx, ly] = p(B.x + B.w, LOCK_Y, floorZ(FLOORS - 1) + LOCK_Z)
  /* the cable: from the cross-arm's near end to the wall, with a sag */
  const a = P(POLE.x + 0.24, POLE.y - 0.2, POLE.h - 0.14, BU)
  const b = P(CABLE_X, FY, ROOF_Z - 0.34, BU)
  const cable = `M ${a[0]} ${a[1]} Q ${(a[0] + b[0]) / 2} ${Math.max(a[1], b[1]) + 18} ${b[0]} ${b[1]}`
  const foundTone = lit ? { top: shade(colors.brand, 0.62), left: shade(colors.brand, 0.42), right: shade(colors.brand, 0.22), line: colors.brand } : undefined
  const cw = focus === PART.power ? 4.2 : 3
  const pw = focus === PART.water ? 4.4 : 3.2
  const riserTop = P(CABLE_X, FY, ROOF_Z - 0.34, BU)
  const riserBot = P(CABLE_X, FY, FOUND.h, BU)
  const pipeBot = P(PIPE_X, FY, FOUND.h + 0.04, BU)
  const pipeTop = P(PIPE_X, FY, ROOF_Z - 0.5, BU)
  return (
    <>
      <IsoSvg>
        {/* the plot */}
        <Quad x={-1.3} y={-0.5} w={4.8} d={3.3} fill={ISO.grass} opacity={0.5} />
        <Shadow x={FOUND.x} y={FOUND.y} w={FOUND.w} d={FOUND.d} grow={0.3} opacity={0.14} />

        {/* ELECTRICITY (amber): the utility pole, its cross-arm, and the one cable to the building */}
        <g style={{ opacity: opP, transition: fadeT }}>
          <Shadow x={POLE.x - 0.06} y={POLE.y - 0.06} w={0.12} d={0.12} grow={0.1} opacity={0.12} />
          <Box x={POLE.x - 0.06} y={POLE.y - 0.06} w={0.12} d={0.12} h={POLE.h} color="#8B6B4A" />
          <Box x={POLE.x - 0.36} y={POLE.y - 0.1} z={POLE.h - 0.2} w={0.72} d={0.07} h={0.07} color="#8B6B4A" />
          <path d={cable} fill="none" stroke={CABLE} strokeWidth={focus === PART.power ? 3.4 : 2.4} strokeLinecap="round" style={{ transition: 'stroke-width 300ms' }} />
          <circle cx={b[0]} cy={b[1]} r={4} fill="#fff" stroke={shade(CABLE, -0.3)} strokeWidth={1.6} />
        </g>

        {/* WATER (blue): the street valve and the one water main along the ground to the wall */}
        <g style={{ opacity: opW, transition: fadeT }}>
          <Box x={VALVE.x - 0.13} y={VALVE.y - 0.13} w={0.26} d={0.26} h={0.2} color={ISO.slate} />
          <polyline points={pts([P(VALVE.x, VALVE.y, 0.2, BU), P(VALVE.x, VALVE.y, 0.42, BU)])} fill="none" stroke={ISO.slate} strokeWidth={3} strokeLinecap="round" />
          <circle cx={P(VALVE.x, VALVE.y, 0.42, BU)[0]} cy={P(VALVE.x, VALVE.y, 0.42, BU)[1]} r={5.5} fill={ISO.red} stroke={shade(ISO.red, -0.35)} strokeWidth={1.2} />
          <polyline
            points={pts([P(VALVE.x + 0.13, VALVE.y, 0.12, BU), P(PIPE_X, VALVE.y, 0.12, BU), P(PIPE_X, FOUND.y + FOUND.d + 0.02, 0.12, BU), P(PIPE_X, FOUND.y + FOUND.d + 0.02, FOUND.h, BU), pipeBot])}
            fill="none" stroke={PIPE} strokeWidth={pw} strokeLinecap="round" strokeLinejoin="round"
          />
        </g>

        {/* ONE foundation, under every flat */}
        <g style={{ opacity: opF, transition: fadeT }}>
          <Box x={FOUND.x} y={FOUND.y} w={FOUND.w} d={FOUND.d} h={FOUND.h} color={CONCRETE} tone={foundTone} />
        </g>

        {/* three flats, one storey each, a floor slab over each, the roof */}
        <g style={{ opacity: opB, transition: fadeT }}>
          {floors.map((i) => (
            <g key={i}>
              <Box x={B.x} y={B.y} z={floorZ(i)} w={B.w} d={B.d} h={FLOOR_H} color={WALL} onLeft={<LeftWindows />} onRight={<RightDoor />} />
              <Box x={B.x - 0.06} y={B.y - 0.06} z={floorZ(i) + FLOOR_H} w={B.w + 0.12} d={B.d + 0.12} h={SLAB_H} color={SLAB_TONE} />
            </g>
          ))}
          <Box x={B.x - 0.1} y={B.y - 0.1} z={ROOF_Z} w={B.w + 0.2} d={B.d + 0.2} h={0.14} color="#B4BECD" />
        </g>

        {/* the two risers up the left face, a branch and a meter (the connection point) into every flat */}
        <g style={{ opacity: opP, transition: fadeT }}>
          <polyline points={pts([riserTop, riserBot])} fill="none" stroke={CABLE} strokeWidth={cw} strokeLinecap="round" />
          {focus === PART.power && <FlowDots from={riserTop} to={riserBot} tone={shade(CABLE, -0.3)} />}
          {floors.map((i) => {
            const zc = floorZ(i) + 0.62
            const mc = P(CABLE_X + 0.24, FY, zc, BU)
            return (
              <g key={i}>
                <polyline points={pts([P(CABLE_X, FY, zc, BU), mc])} fill="none" stroke={CABLE} strokeWidth={2.4} strokeLinecap="round" />
                <circle cx={P(CABLE_X, FY, zc, BU)[0]} cy={P(CABLE_X, FY, zc, BU)[1]} r={2.6} fill={shade(CABLE, -0.3)} />
                <Meter at={mc} tone={CABLE} kind="power" />
              </g>
            )
          })}
        </g>
        <g style={{ opacity: opW, transition: fadeT }}>
          <polyline points={pts([pipeBot, pipeTop])} fill="none" stroke={PIPE} strokeWidth={pw} strokeLinecap="round" />
          {focus === PART.water && <FlowDots from={pipeBot} to={pipeTop} tone={shade(PIPE, -0.2)} />}
          {floors.map((i) => {
            const zp = floorZ(i) + 0.36
            const mp = P(PIPE_X + 0.24, FY, zp, BU)
            return (
              <g key={i}>
                <polyline points={pts([P(PIPE_X, FY, zp, BU), mp])} fill="none" stroke={PIPE} strokeWidth={2.6} strokeLinecap="round" />
                <circle cx={P(PIPE_X, FY, zp, BU)[0]} cy={P(PIPE_X, FY, zp, BU)[1]} r={2.6} fill={shade(PIPE, -0.3)} />
                <Meter at={mp} tone={PIPE} kind="water" />
              </g>
            )
          })}
        </g>

        {/* every flat's own padlock, on its door */}
        <g style={{ opacity: opL, transition: fadeT }}>
          {floors.map((i) => (
            <Lock key={i} x={B.x + B.w} y={LOCK_Y} z={floorZ(i) + LOCK_Z} size={0.4} color={focus === PART.lock ? colors.brand : colors.brandDark} />
          ))}
        </g>
      </IsoSvg>

      <div style={{ opacity: opL, transition: fadeT }}>
        <At x={lx + 122} y={ly - 74} cx>
          <Label size={15} strong tone={focus === PART.lock ? 'solid' : 'plain'}>
            lock
          </Label>
        </At>
        <Arrow x1={lx + 100} y1={ly - 40} x2={lx + 12} y2={ly - 6} tone={focus === PART.lock ? colors.brand : colors.muted} />
      </div>
      <div style={{ opacity: opF, transition: fadeT }}>
        <IsoAt x={FOUND.x + FOUND.w} y={FOUND.y + FOUND.d * 0.5} z={0} dx={58} dy={6} cx>
          <Label size={15} strong tone={lit ? 'solid' : 'plain'}>
            foundation
          </Label>
        </IsoAt>
      </div>
      <div className="absolute flex justify-center gap-6" style={{ left: 0, right: 0, top: AN_SH - AN_SLAB_BOTTOM + 22 }}>
        <span style={{ opacity: opP, transition: fadeT }}>
          <Label size={15} strong icon={<Zap />} tone={focus === PART.power ? 'warn' : 'plain'}>
            electricity
          </Label>
        </span>
        <span style={{ opacity: opW, transition: fadeT }}>
          <Label size={15} strong icon={<Droplets />} tone={focus === PART.water ? 'solid' : 'plain'}>
            water line
          </Label>
        </span>
      </div>
    </>
  )
}

function FlatsScene({ k }: { k: number }) {
  return (
    <IsoScene w={AN_W} h={AN_SH} ox={205} oy={180} u={BU}>
      <Block k={k} />
    </IsoScene>
  )
}

/*
  THE TECHNICAL SIDE, PART FOR PART (corrections 2026-11-03, slide 6): the host kernel
  slab (the foundation) with the Linux mark; two lines up from it into every container,
  amber for processor time (the electricity line) and blue for memory (the water line),
  each with a connection point at both ends and its resource icon; a padlock on every
  container (the flat's lock), the "namespaces" tag pointing at one.
*/
const K_TOP = AN_SH - AN_SLAB_BOTTOM - 44 // the kernel slab's top
const T_BOT = K_TOP - 78 // the containers' feet
const T_H = 84

function KernelScene({ k }: { k: number }) {
  const focus = focusOf(k)
  const left = (AN_W - SLAB_W) / 2
  const gap = 14
  const cw = (SLAB_W - gap * 2) / 3
  const cx = (i: number) => left + i * (cw + gap) + cw / 2
  const opP = opFor(focus, PART.power)
  const opW = opFor(focus, PART.water)
  const opF = opFor(focus, PART.foundation)
  const opL = opFor(focus, PART.lock)
  const opC = focus < 0 || focus === PART.lock ? 1 : 0.42
  const line = (x: number, tone: string, part: number, op: number, icon: ReactNode) => (
    <g key={`${x}-${part}`} style={{ opacity: op, transition: fadeT }}>
      <line x1={x} y1={K_TOP} x2={x} y2={T_BOT} stroke={tone} strokeWidth={focus === part ? 4.2 : 3} strokeLinecap="round" />
      <circle cx={x} cy={K_TOP - 1} r={4.4} fill="#fff" stroke={shade(tone, -0.3)} strokeWidth={1.8} />
      <circle cx={x} cy={T_BOT + 1} r={4.4} fill="#fff" stroke={shade(tone, -0.3)} strokeWidth={1.8} />
      {focus === part && <FlowDots from={[x, K_TOP - 6]} to={[x, T_BOT + 6]} tone={shade(tone, -0.3)} dur={1.4} />}
      <foreignObject x={x - 12} y={(K_TOP + T_BOT) / 2 - 12} width={24} height={24}>
        <span className="grid h-[24px] w-[24px] place-items-center rounded-full bg-white [&>svg]:h-[14px] [&>svg]:w-[14px]" style={{ color: shade(tone, -0.3), boxShadow: `inset 0 0 0 1.8px ${tone}` }}>
          {icon}
        </span>
      </foreignObject>
    </g>
  )
  return (
    <>
      {/* the host kernel: ONE slab under every container, the foundation's place */}
      <div className="absolute" style={{ left, top: K_TOP, opacity: opF, transition: fadeT }}>
        <Slab w={SLAB_W} h={44} fill={STACK.kernel} lit={focus === PART.foundation}>
          <span className="inline-flex items-center gap-2">
            <span className="grid h-[28px] w-[28px] place-items-center rounded-[8px] bg-white">
              <Logo name="linux" h={21} />
            </span>
            Host kernel
          </span>
        </Slab>
      </div>
      <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        {[0, 1, 2].map((i) => [line(cx(i) - 18, CABLE, PART.power, opP, <Cpu />), line(cx(i) + 18, PIPE, PART.water, opW, <MemoryStick />)])}
      </svg>
      {['App 1', 'App 2', 'App 3'].map((a, i) => (
        <div key={a} className="absolute" style={{ left: cx(i) - cw / 2, top: T_BOT - T_H, opacity: opC, transition: fadeT }}>
          <Tile w={cw} h={T_H} lit={focus === PART.lock}>
            <div className="flex h-full flex-col justify-between">
              <div className="flex justify-center" style={{ opacity: opL === 1 ? 1 : 0.5, transition: fadeT }}>
                <span className={focus === PART.lock ? fx('shackle', i * 0.25, 2.6).className : ''} style={focus === PART.lock ? fx('shackle', i * 0.25, 2.6).style : undefined}>
                  <LockGlyph size={17} tone={focus === PART.lock ? colors.brand : colors.brandDark} />
                </span>
              </div>
              <Chip>
                <span className="inline-flex items-center gap-1.5">
                  <AppWindow size={15} color={colors.brand} aria-hidden />
                  {a}
                </span>
              </Chip>
            </div>
          </Tile>
        </div>
      ))}
      <div style={{ opacity: opL, transition: fadeT }}>
        <At x={cx(2)} y={T_BOT - T_H - 74} cx>
          <Label size={15} strong tone={focus === PART.lock ? 'solid' : 'plain'}>
            namespaces
          </Label>
        </At>
        <Arrow x1={cx(2)} y1={T_BOT - T_H - 40} x2={cx(2)} y2={T_BOT - T_H - 6} tone={focus === PART.lock ? colors.brand : colors.muted} />
      </div>
    </>
  )
}

/**
 * ONE clock for both pictures (it registers one step track): foundation with host kernel,
 * electricity with the amber line, water with the blue line, lock with namespaces, then the
 * whole picture; in auto mode it loops, by hand one press per part. Harness URLs: the whole picture.
 */
function useAnalogyPart() {
  return useCycle(AN_STATES, 2400, AN_STATES - 1, AN_STATES - 1)
}

/**
 * The analogy rule (user, 2026-10-28): no text that describes or explains the
 * visual. `IsoAnalogy` `bare`: no lead sentence, no caption pills, no SAME IDEA
 * words (the arrow stays); only the two pictures and the tags inside them.
 */
export function FlatsAnalogy({ lesson }: { lesson: string }) {
  const k = useAnalogyPart()
  return (
    <IsoAnalogy
      id="T01-AN"
      kicker="Container Isolation Basics"
      title="Flats in one building"
      lesson={lesson}
      bare
      h={AN_SH}
      everyday={{ label: 'Flats in one building', scene: <FlatsScene k={k} /> }}
      cloud={{ label: 'Containers on one host kernel', scene: <KernelScene k={k} /> }}
    />
  )
}

/* ================================================================== T02-1 · six namespaces */

const NS_ROWS: [string, string][] = [
  ['PID (process ID)', 'Own process tree, own PID 1'],
  ['Network', 'Own interfaces, IP address, ports'],
  ['Mount', 'Own filesystem view and mount points'],
  ['UTS (UNIX time-sharing)', 'Own hostname and domain name'],
  ['IPC (inter-process communication)', 'Own message queues, semaphores'],
  ['User', 'Own user and group ID mapping'],
]

const TABLE_W = 680
const NS_W = BOX_W - TABLE_W - 24
const NS_H = 340

/** The six names around the kernel, in the table's order, clockwise from the top left (hw: the tag's half width, its icon included). */
const NS_BOXES: { name: string; x: number; y: number; hw: number }[] = [
  { name: 'PID', x: 112, y: 50, hw: 44 },
  { name: 'Network', x: NS_W - 112, y: 50, hw: 64 },
  { name: 'Mount', x: NS_W - 70, y: NS_H / 2, hw: 54 },
  { name: 'UTS', x: NS_W - 112, y: NS_H - 50, hw: 44 },
  { name: 'IPC', x: 112, y: NS_H - 50, hw: 42 },
  { name: 'User', x: 66, y: NS_H / 2, hw: 48 },
]

/** Where a ray from a box's centre leaves a rectangle of half sizes hw x hh. */
function exit(dx: number, dy: number, hw: number, hh: number) {
  const len = Math.hypot(dx, dy)
  const ux = dx / len
  const uy = dy / len
  const t = Math.min(ux === 0 ? Infinity : hw / Math.abs(ux), uy === 0 ? Infinity : hh / Math.abs(uy))
  return [ux * t, uy * t] as const
}

const NS_ICONS: ReactNode[] = [<ListTree key="0" size={18} />, <Network key="1" size={18} />, <FolderTree key="2" size={18} />, <TagIco key="3" size={18} />, <MessagesSquare key="4" size={18} />, <UserRound key="5" size={18} />]

function NamespaceScene({ shown, lit }: { shown: number; lit: number }) {
  /*
    A row arrives in the table, its namespace tag arrives here with the same icon and its
    faint arrow draws to the kernel (line, then head). The lit namespace gets a brand
    arrow drawn OVER its faint one, line first then head; when the light moves on, that
    arrow leaves head first, then its line (G8). The kernel ripples while one is lit.
  */
  const KX = NS_W / 2
  const KY = NS_H / 2
  const KHW = 60
  const KHH = 50
  return (
    <>
      <Ripple x={KX} y={KY} r={58} tone={colors.brand} on={lit >= 0} n={2} dur={2.4} />
      <At x={KX} y={KY} cx cy>
        <div className="flex flex-col items-center justify-center gap-1 rounded-[18px]" style={{ width: KHW * 2, height: KHH * 2, background: `linear-gradient(180deg, ${LAB.navy} 0%, #1E2C6E 100%)`, boxShadow: '0 14px 26px -14px rgba(16,32,58,0.7)' }}>
          <span className="flex items-center gap-1.5">
            <Cpu size={26} color={colors.white} strokeWidth={1.8} aria-hidden />
            <span className="grid h-[26px] w-[26px] place-items-center rounded-[7px] bg-white">
              <Logo name="linux" h={19} />
            </span>
          </span>
          <span className="font-heading text-[16px] font-semibold" style={{ color: colors.white }}>
            Kernel
          </span>
        </div>
      </At>
      {NS_BOXES.map((b, i) => {
        const dx = KX - b.x
        const dy = KY - b.y
        const [sx, sy] = exit(dx, dy, b.hw + 6, 22)
        const [ex, ey] = exit(-dx, -dy, KHW + 8, KHH + 8)
        const on = lit === i
        const here = i < shown
        return (
          <div key={b.name}>
            <Arrow x1={b.x + sx} y1={b.y + sy} x2={KX + ex} y2={KY + ey} tone="#AFC2E4" on={here} />
            <Arrow x1={b.x + sx} y1={b.y + sy} x2={KX + ex} y2={KY + ey} tone={colors.brand} width={3.2} on={on} />
            <At x={b.x} y={b.y} cx cy style={{ opacity: here ? 1 : 0, transition: `opacity 360ms ${EASE}` }}>
              <span style={{ display: 'inline-block', transform: on ? 'scale(1.08)' : 'none', transition: `transform 360ms ${EASE}` }}>
                <Label size={16} strong tone={on ? 'solid' : 'plain'} raised icon={NS_ICONS[i]}>
                  {b.name}
                </Label>
              </span>
            </At>
          </div>
        )
      })}
    </>
  )
}

/**
 * THE NAMESPACE WALK (corrections 2026-11-03, slide 6/7: "the animation stops at User,
 * make it loop"; tables faster and earlier). One clock, one step track:
 *   0     nothing lit (the loop's reset)
 *   1-6   row k arrives in the table (first lap) and namespace k lights and points at the kernel
 *   7     a rest with every namespace in place, then round again (auto mode only)
 * By hand one press per row, no self-loop. The table builds once and stays built.
 */
function useNamespaceWalk() {
  const auto = useAutoAnim()
  const k = useCycle(8, 900, 7, 6)
  const done = useRef(false)
  if (!auto) done.current = false
  else if (k === 7) done.current = true
  const shown = STILL || done.current ? 6 : Math.min(6, k)
  const lit = STILL || k === 0 || k === 7 ? -1 : k - 1
  return { shown, lit }
}

export function Namespaces({ lesson }: { lesson: string }) {
  const { shown, lit } = useNamespaceWalk()
  return (
    <Card
      id="T02-1"
      kicker="Linux Namespaces"
      title="Isolating Process Views"
      lead={lead('A namespace isolates a process’s view of system resources, so each container gets its own view of processes, networking, and filesystems')}
      lesson={lesson}
    >
      <div className="flex items-center" style={{ width: BOX_W, gap: 24 }}>
        <div style={{ width: TABLE_W }}>
          <VisualTable compact shown={shown} columns={[{ label: 'Namespace', icon: <BoxIco size={16} />, weight: 1 }, { label: 'Isolates', icon: <Eye size={16} />, weight: 1.08 }]} rows={NS_ROWS.map((r, i) => ({ icon: NS_ICONS[i], cells: r }))} />
        </div>
        <Stage w={NS_W} h={NS_H} active={false}>
          <NamespaceScene shown={shown} lit={lit} />
        </Stage>
      </div>
    </Card>
  )
}

/* ================================================================== T03-1 · control groups */

const T03_LEAD = 'Two more kernel features complete container isolation: control groups, known as cgroups, cap resource use, and a union filesystem builds the image itself from layers'
const T03_POINTS = ['CPU controller: caps processor time share per group', 'Memory controller: breach triggers an out-of-memory kill', 'Block I/O controller: caps disk read and write speed']

/*
  THREE REAL OBJECTS, NOT ONE GAUGE THREE TIMES (corrections 2026-11-03, slide 8): a CPU
  chip, a RAM stick, a disk drive, each with its usage meter at the bottom and the cgroup's
  cap marked on the meter. One lap, one press per controller:
    CPU     usage climbs to the cap and is held there (its time share is capped)
    Memory  usage climbs past the cap, the bar turns red and the process is killed (the X)
    Disk    the platter spins, the arm seeks, usage climbs to the cap and is held
*/
const CAP = 0.72
const MTR_W = 132

function UsageMeter({ v, tone, breach = false }: { v: number; tone: string; breach?: boolean }) {
  const fill = breach ? colors.danger : tone
  return (
    <div className="relative" style={{ width: MTR_W, height: 14 }}>
      <div className="absolute inset-0 overflow-hidden rounded-full" style={{ background: '#E4EBF8', boxShadow: 'inset 0 1px 2px rgba(16,32,58,0.18)' }}>
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: MTR_W, background: `linear-gradient(90deg, ${shade(fill, 0.25)} 0%, ${fill} 100%)`, transform: `scaleX(${Math.max(0, Math.min(1, v))})`, transformOrigin: 'left center', transition: 'background 300ms' }} />
      </div>
      {/* the cgroup's cap */}
      <div className="absolute" style={{ left: MTR_W * CAP - 1.5, top: -5, width: 3, height: 24, borderRadius: 2, background: LAB.orange, boxShadow: '0 0 0 1.5px #fff' }} />
    </div>
  )
}

function CpuChip({ v }: { v: number }) {
  const pins = Array.from({ length: 7 }, (_, i) => 22 + i * 9.4)
  const glow = 0.25 + 0.75 * Math.min(1, v / CAP)
  return (
    <svg width={112} height={112} viewBox="0 0 112 112" aria-hidden>
      {pins.map((p) => (
        <g key={p} fill="#B8C2D3">
          <rect x={p - 2} y={6} width={4} height={12} rx={1} />
          <rect x={p - 2} y={94} width={4} height={12} rx={1} />
          <rect x={6} y={p - 2} width={12} height={4} rx={1} />
          <rect x={94} y={p - 2} width={12} height={4} rx={1} />
        </g>
      ))}
      <rect x={16} y={16} width={80} height={80} rx={10} fill="#2B3347" />
      <rect x={19} y={19} width={74} height={74} rx={8} fill="none" stroke="#45506A" strokeWidth={1.5} />
      <rect x={32} y={32} width={48} height={48} rx={5} fill={colors.brand} opacity={glow} />
      {/* four cores, lighting as the share is used */}
      {[0, 1, 2, 3].map((c) => (
        <rect key={c} x={36 + (c % 2) * 21} y={36 + Math.floor(c / 2) * 21} width={19} height={19} rx={3} fill="#fff" opacity={v > (c + 0.5) * (CAP / 4) ? 0.85 : 0.22} style={{ transition: 'opacity 200ms' }} />
      ))}
      <circle cx={26} cy={26} r={2.6} fill="#6B778F" />
    </svg>
  )
}

function RamStick({ v, breach }: { v: number; breach: boolean }) {
  const chipOn = (c: number) => v > (c + 0.5) * (CAP / 4)
  return (
    <svg width={150} height={112} viewBox="0 0 150 112" aria-hidden>
      <g transform="translate(0 26)">
        <rect x={4} y={0} width={142} height={56} rx={4} fill="#1E7A4C" />
        <rect x={4} y={0} width={142} height={56} rx={4} fill="none" stroke="#14603A" strokeWidth={1.5} />
        {[0, 1, 2, 3].map((c) => (
          <g key={c}>
            <rect x={14 + c * 33} y={9} width={25} height={26} rx={2} fill="#1C2230" />
            <rect x={17 + c * 33} y={12} width={19} height={20} rx={1.5} fill={breach ? colors.danger : '#7FB8FF'} opacity={chipOn(c) ? 0.9 : 0.12} style={{ transition: 'opacity 200ms, fill 300ms' }} />
          </g>
        ))}
        {/* the gold contacts along the edge, the notch off centre */}
        {Array.from({ length: 22 }, (_, i) => i).map((i) => (i === 9 ? null : <rect key={i} x={9 + i * 6.1} y={44} width={3.6} height={10} rx={0.8} fill="#E2B34A" />))}
        <rect x={63} y={46} width={6} height={10} fill="#fff" />
      </g>
    </svg>
  )
}

function DiskDrive({ v, spin }: { v: number; spin: boolean }) {
  /* the arm seeks across the platter as the drive works */
  const arm = -32 + 26 * Math.min(1, v / CAP)
  const f = fx('spin', 0, 1.2)
  return (
    <svg width={112} height={112} viewBox="0 0 112 112" aria-hidden>
      <rect x={12} y={4} width={88} height={104} rx={9} fill="#9AA6B9" />
      <rect x={15} y={7} width={82} height={98} rx={7} fill="#C5CEDB" />
      <circle cx={52} cy={48} r={34} fill="#E9EEF6" stroke="#8D99AD" strokeWidth={1.5} />
      <g className={spin ? f.className : undefined} style={{ ...(spin ? f.style : {}), transformBox: 'view-box', transformOrigin: '52px 48px' }}>
        <circle cx={52} cy={48} r={26} fill="none" stroke="#C9D2E0" strokeWidth={1} />
        <circle cx={52} cy={48} r={18} fill="none" stroke="#C9D2E0" strokeWidth={1} />
        <path d="M 52 48 L 52 16" stroke="#B3BED0" strokeWidth={2} />
      </g>
      <circle cx={52} cy={48} r={7} fill="#7C889C" />
      <circle cx={52} cy={48} r={2.5} fill="#E9EEF6" />
      <g transform={`rotate(${arm} 84 90)`} style={{ transition: 'transform 200ms' }}>
        <path d="M 84 90 L 62 44" stroke="#4A5568" strokeWidth={4.5} strokeLinecap="round" />
        <rect x={58} y={40} width={8} height={6} rx={1.5} fill="#2D3748" />
      </g>
      <circle cx={84} cy={90} r={6.5} fill="#4A5568" />
      {[18, 94].map((x) => [10, 102].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r={1.8} fill="#7C889C" />))}
    </svg>
  )
}

function CgroupScene({ t }: { t: number }) {
  const reset = 1 - within(t, 0.965, 1)
  const cpu = CAP * within(t, 0.04, 0.24) * reset
  const memRaw = within(t, 0.34, 0.52)
  const mem = 0.84 * memRaw * reset
  const breach = mem > CAP + 0.02
  const disk = CAP * within(t, 0.64, 0.86) * reset
  const W = 560
  const H = 262
  const cols: { name: string; tone: string; v: number; art: ReactNode; breach?: boolean }[] = [
    { name: 'CPU', tone: colors.brand, v: cpu, art: <CpuChip v={cpu} /> },
    { name: 'Memory', tone: '#2FA36B', v: mem, art: <RamStick v={mem} breach={breach} />, breach },
    { name: 'Disk', tone: LAB.cobalt, v: disk, art: <DiskDrive v={disk} spin={!STILL && disk > 0.02} /> },
  ]
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="relative rounded-[22px]" style={{ width: W, height: H, background: 'rgba(45,99,251,0.05)', border: `2.5px dashed ${colors.brand}` }}>
        <div className="absolute" style={{ left: 18, top: -16 }}>
          <Label size={16} strong tone="solid">
            cgroup
          </Label>
        </div>
        <div className="absolute inset-x-0 flex justify-around" style={{ top: 34 }}>
          {cols.map((m) => (
            <div key={m.name} className="flex flex-col items-center" style={{ width: 160 }}>
              <div className="relative grid place-items-center" style={{ height: 116 }}>
                {m.art}
                {/* the out-of-memory kill: the process is stopped */}
                {m.breach !== undefined && (
                  <span className="absolute" style={{ right: -2, top: 6 }}>
                    <Badge on={!!m.breach} size={30} ring={colors.danger}>
                      <XIco size={17} color={colors.danger} strokeWidth={3} />
                    </Badge>
                  </span>
                )}
              </div>
              <div className="mt-3">
                <UsageMeter v={m.v} tone={m.tone} breach={m.breach} />
              </div>
              <div className="mt-4">
                <Label size={16} strong>
                  {m.name}
                </Label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function Cgroups({ lesson }: { lesson: string }) {
  /* one clock: the meters and the point lit beside the controller they are acting out */
  const t = useLoop(9000, { mode: 'sawtooth', still: 0.92, steps: 240, beats: [0.3, 0.6, 0.92] })
  const lit = t < 0.3 ? 0 : t < 0.6 ? 1 : 2
  return (
    <LitFigure
      id="T03-1"
      kicker="Cgroups And Union FS"
      title="Resource Limits Layers"
      lead={T03_LEAD}
      lesson={lesson}
      points={T03_POINTS.map((text, i) => ({ icon: [<Cpu key="c" />, <MemoryStick key="m" />, <HardDrive key="d" />][i], text }))}
      lit={lit}
      figure={<CgroupScene t={t} />}
    />
  )
}

/* ================================================================== T03-2 · union filesystem */

const T032_POINTS = ['Union filesystem merges read-only layers; OverlayFS is the current standard driver', 'Copy-on-write duplicates a file only when it is modified']

/* three read-only layers, top to bottom; the trailing spaces only keep the keys apart (HTML collapses them) */
const UFS_LAYERS = ['Read-only layer', 'Read-only layer ', 'Read-only layer  ']
const UFS_W = 340
const UFS_H = 44
const UFS_GAP = 8

/** A small file: a page icon and the word. */
function FileChip({ tone = 'plain' }: { tone?: 'plain' | 'warn' }) {
  return (
    <Label size={14} strong icon={<FileText />} tone={tone}>
      file
    </Label>
  )
}

/** A bare page glyph (no word): a file some layer holds, and the same file seen in the one view. */
function Page({ tone = colors.brand, size = 22 }: { tone?: string; size?: number }) {
  return (
    <span className="grid place-items-center rounded-[7px] bg-white" style={{ width: size + 8, height: size + 8, boxShadow: `inset 0 0 0 1.5px ${tone}`, color: tone, transition: `all 380ms ${EASE}` }}>
      <FileText size={size - 6} aria-hidden />
    </span>
  )
}

/** In when `on`; `inD` is its entry delay, `outD` its exit delay (later elements leave first: G8's reverse order). */
const show = (on: boolean, inD = 0, outD = 0, lift = 10) => ({
  opacity: on ? 1 : 0,
  transform: on ? 'none' : `translateY(${lift}px)`,
  transition: `opacity 420ms ${EASE} ${on ? inD : outD}ms, transform 480ms ${EASE} ${on ? inD : outD}ms`,
})

/*
  THE UNION FILESYSTEM, AS OVERLAYFS DOES IT (corrections round 2, 2026-11-03, slide 9: the merge arrows
  used to draw before One view and the writable layer existed). One element or group per state, and an
  arrow only once BOTH ends are on screen:
    0  the read-only layers, each holding its own files (arrives with the figure stage)
    1  the writable top layer appears on the stack
    2  One view appears above, every layer's file in it
    3  the merge arrows draw up from the stack into One view (G8: line, then head)
    4  the Copy-on-write arrow draws from the changed read-only file to the writable layer, then its label
    5  the file is copied UP into the writable layer
    6  the copy is modified (the pen), and One view now reads the copy (its page turns orange)
    7  a rest on the full picture
    8  auto only: the exit, in reverse (pen, copy, Copy-on-write, merge arrows, One view, writable layer),
       then 0 holds a beat before the build runs again
  By hand one press per state 1-6. Harness URLs hold state 6. Point 1 lit for 0-3, point 2 for 4-6.
*/
const UFS_FULL = 6
function useUnionStep() {
  const k = useCycle(9, 1500, UFS_FULL, UFS_FULL)
  return STILL ? UFS_FULL : k >= 8 ? 0 : Math.min(k, UFS_FULL)
}

/** `on`, but held for `lag` ms after it turns off: an Arrow's exit waits its turn in the reverse order. */
function useLagOff(on: boolean, lag: number) {
  const [held, setHeld] = useState(on)
  useEffect(() => {
    if (on) {
      setHeld(true)
      return
    }
    const t = window.setTimeout(() => setHeld(false), lag)
    return () => window.clearTimeout(t)
  }, [on, lag])
  return on || held
}

/* exit delays (ms), the reverse of the entry order */
const UFS_OUT = { pen: 0, copy: 100, cow: 250, merge: 500, view: 1250, writable: 1550 }

function UnionScene({ k }: { k: number }) {
  const s = k
  const X = 34
  const VIEW_Y = 16
  const VIEW_H = 92
  const STACK_Y = 156
  const rowY = (r: number) => STACK_Y + r * (UFS_H + UFS_GAP)
  const FILE_X = X + UFS_W - 86
  /* where each layer's file sits, and where it shows in the one view: [x in the stack, row] */
  const ARROW_X = [X + 32, X + 76, FILE_X + 32]
  const SRC: [number, number][] = [
    [ARROW_X[0] - 13, 3],
    [ARROW_X[1] - 13, 1],
  ]
  const modified = s >= 6
  const LANE = X + UFS_W + 22
  const mergeOn = useLagOff(s >= 3, UFS_OUT.merge)
  const cowOn = useLagOff(s >= 4, UFS_OUT.cow)
  return (
    <>
      {/* ONE VIEW: what the container sees, every layer's files merged */}
      <At x={X} y={VIEW_Y}>
        <div style={show(s >= 2, 0, UFS_OUT.view)}>
          <div className="relative flex flex-col items-center rounded-[16px] pt-3" style={{ width: UFS_W, height: VIEW_H, background: 'linear-gradient(180deg, #FFFFFF 0%, #EEF3FD 100%)', boxShadow: `inset 0 0 0 2px ${colors.brand}, 0 12px 22px -16px rgba(16,32,58,0.55)` }}>
            <span className="inline-flex items-center gap-2 font-heading text-[18px] font-semibold" style={{ color: colors.brandDark }}>
              <span className={s >= 2 ? fx('glow', 0, 2.2).className : ''} style={s >= 2 ? fx('glow', 0, 2.2).style : undefined}>
                <Eye size={18} aria-hidden />
              </span>
              One view
            </span>
            {/* the same files, each straight above the layer it comes from */}
            {ARROW_X.map((x, i) => (
              <span key={i} className="absolute" style={{ left: x - X - 13, bottom: 10 }}>
                <Page tone={i === 2 && modified ? LAB.orange : LAB.cobalt} size={18} />
              </span>
            ))}
          </div>
        </div>
      </At>
      {/* the merge: one arrow up from the stack into the view, only once the writable layer and One view are both there */}
      {ARROW_X.map((x, i) => (
        <Arrow key={i} x1={x} y1={STACK_Y - 8} x2={x} y2={VIEW_Y + VIEW_H + 6} on={mergeOn} delay={i * 140} />
      ))}
      <At x={X} y={STACK_Y}>
        <LayerStack w={UFS_W} h={UFS_H} layers={UFS_LAYERS} size={16} />
      </At>
      {/* the writable top layer, drawn here (not by LayerStack) so its exit can wait for everything above it to leave */}
      <At x={X} y={STACK_Y}>
        <div style={show(s >= 1, 0, UFS_OUT.writable, -10)}>
          <Slab w={UFS_W} h={UFS_H} fill={STACK.writable} size={16}>
            Writable top layer
          </Slab>
        </div>
      </At>
      {/* every read-only layer holds files of its own */}
      {SRC.map(([x, r], i) => (
        <At key={i} x={x} y={rowY(r) + 9}>
          <Page tone={LAB.cobalt} size={18} />
        </At>
      ))}
      {/* the one changed file: its original stays in its read-only layer */}
      <At x={FILE_X} y={rowY(2) + 8}>
        <FileChip />
      </At>
      {/* its copy, lifted up into the writable layer only when it is modified */}
      <div className="absolute" style={{ left: FILE_X, top: rowY(0) + 8, opacity: s >= 5 ? 1 : 0, transform: s >= 5 ? 'none' : `translateY(${rowY(2) - rowY(0)}px)`, transition: `opacity 360ms ${EASE} ${s >= 5 ? 0 : UFS_OUT.copy}ms, transform 760ms ${EASE} ${s >= 5 ? 0 : UFS_OUT.copy}ms` }}>
        <span className="relative inline-block">
          <FileChip tone="warn" />
          <span className="absolute" style={{ right: -14, top: -14 }}>
            <Badge on={modified} size={24} ring={LAB.orange}>
              <PenLine size={13} color={colors.accentDark} strokeWidth={2.6} />
            </Badge>
          </span>
        </span>
      </div>
      <Arrow x1={LANE} y1={rowY(2) + 22} x2={LANE} y2={rowY(0) + 22} on={cowOn} tone={LAB.orange} />
      <div className="absolute" style={{ left: LANE + 14, top: rowY(1) + 8, ...show(s >= 4, 900, UFS_OUT.cow, 6) }}>
        <Label size={16} strong tone="warn" icon={<Copy />}>
          Copy-on-write
        </Label>
      </div>
    </>
  )
}

export function UnionFs({ lesson }: { lesson: string }) {
  const s = useUnionStep()
  return (
    <LitFigure
      id="T03-2"
      kicker="Cgroups And Union FS"
      title="Resource Limits Layers"
      lesson={lesson}
      points={T032_POINTS.map((text, i) => ({ icon: i === 0 ? <Layers /> : <Copy />, text }))}
      lit={s <= 3 ? 0 : 1}
      figure={<UnionScene k={s} />}
      figH={400}
    />
  )
}

/** This section's own keyframes (corrections pass 2026-11-03), appended to the deck's CSS by cvDeck.tsx. */
export const FUNDAMENTALS_CSS = ``
