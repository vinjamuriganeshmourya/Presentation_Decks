import { motion, useReducedMotion } from 'framer-motion'
import { colors, accentByTone } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { iconByName } from '@/ui/icons'
import { T, E, perSegment } from './figureTiming'
import type { FlowFigureProps, FlowLeg, FlowStation, StationLogo } from './flowFigure'

/**
 * BoundaryBridge — the machine boundary is the subject.
 *
 * WHAT IT ARGUES
 *   An image is stuck on the machine that built it. Session 6 exists because a
 *   registry is the one thing that carries it to another computer, so this
 *   figure draws the computers first: two dashed machine boundaries, labelled
 *   as separate machines, with the registry lifted onto its own card spanning
 *   the gap between them like a bridge. The legs are the bridge's two spans,
 *   and each one visibly CROSSES a dashed boundary line. That crossing is the
 *   event: `docker push` is not a step in a list, it is the moment the image
 *   stops being local.
 *
 * WHAT THE OLD DRAWING CLAIMED, AND WHY IT WAS WRONG
 *   The first pass read `leg.direction` and, on `direction: 'reverse'`, drew the
 *   second span as a leg CLIMBING out of the right machine with its arrowhead
 *   parked under the hub card. On screen that says the image travels from the
 *   machine INTO Docker Hub, which is the exact opposite of what `docker pull`
 *   does. The mistake was treating "who typed the command" as if it were "which
 *   way the bytes move". They are different facts and only one of them is an
 *   arrow.
 *
 *   The new drawing claims what actually happens: every payload span runs along
 *   the chain, `stations[i]` to `stations[i + 1]`, head at the far end, no
 *   exceptions. `docker push` climbs from the left machine onto the deck;
 *   `docker pull` falls off the deck into the right machine. Who issued the
 *   command survives as a hairline dashed glyph and a ten-pixel caption inside
 *   the leg's own label block, never as a second arrow, because it is a
 *   footnote on the leg and not a second movement of data. If you are about to
 *   turn a payload arrow around, read `issuedBy` in `types.ts` first.
 *
 * WHERE A SPAN ATTACHES, AND WHY IT IS NOT THE BOUNDARY LINE
 *   The first pass ran both spans at the panel's vertical middle and started
 *   them a few pixels inside the dashed edge. With two stations in a machine
 *   that middle is exactly where the internal `docker build` leg sits, so the
 *   orange span's origin landed on top of both the dashed boundary and the blue
 *   internal arrow, and the teal span's head landed on the other boundary
 *   instead of on a tile. The user saw it immediately: "arrow start and end
 *   point are overlapping".
 *
 *   So the attachment is now derived from the TILES, not from the panel:
 *     - `docker push` starts at the RIGHT edge of the LAST left tile, at that
 *       tile's own vertical centre. That is the station the image is actually
 *       in.
 *     - `docker pull` ends at the LEFT edge of the FIRST right tile, at that
 *       tile's centre. That is the station the image actually arrives in.
 *   A tile is inset 22px on the side a span crosses, so every endpoint has 22px
 *   of air between it and the dashed edge and the 10px arrowhead sits entirely
 *   inside that corridor. A tile centre is at least 30px clear of the internal
 *   leg row that sits between tiles. The gate tick is drawn as TWO short rects
 *   with a 24px hole where the span passes through, so the boundary lights up at
 *   the crossing and nothing is drawn on top of anything.
 *
 * WHY THIS GEOMETRY MAKES THAT ARGUMENT
 *   The three failures of the kit's `FlowChart` fall out of the shape rather
 *   than being patched onto it:
 *     - An edge can be labelled, because a bridge span is long and diagonal and
 *       has a whole gap column to itself. The command sits in that gap, beside
 *       the boundary it crosses, and never has to become a box.
 *     - Direction is geometric, not decorative. A leg that leaves a machine
 *       CLIMBS onto the bridge deck; a leg that arrives at a machine FALLS off
 *       it. `push` and `pull` are mirror slopes and different hues (orange
 *       leaving, teal arriving), so nobody reads them as the same arrow.
 *     - Hierarchy is positional. The hub is the only thing above the machines,
 *       the only card with a lifted shadow, and the only one whose type is
 *       `text-body-lg`. It cannot be mistaken for the laptop beside it because
 *       it is not beside it.
 *   It also gives the cycle slide an honest home. `build` and `run` never cross
 *   a boundary, so they are drawn INSIDE a machine, short and vertical and in
 *   the machine's own blue. `push` and `pull` are the only legs that cross.
 *
 * WHAT IT COSTS (honestly, against a straight left-to-right row)
 *   - It hard-codes a THREE-ZONE world: one machine, one hub, one other
 *     machine. A flow with two registries, or with no hub at all, has nowhere
 *     to go; the fallback picks a middle station as the hub and the picture
 *     starts lying. `FlowChart` degrades to any length.
 *   - Only ONE leg can cross each boundary. Extra legs on a side are drawn as
 *     internal stack legs, which is right for `build` and `run` and wrong for
 *     anything that should have been a second crossing.
 *   - It spends its width on air. The two gap columns and the raised deck eat
 *     roughly 300px that a row of boxes would have given to labels, so station
 *     captions have to be short and a long station name has to drop a type step
 *     to stay on one line.
 *   - The reading path is a zigzag: down-left, up, across, down-right. That is
 *     more work than a straight row for a room seeing it for the first time,
 *     and it only pays off because the zigzag is the point.
 *
 * MOTION BEATS (vocabulary: animation-vocabulary/SKILL.md)
 *   Every duration, delay and stagger comes from `T`, every curve from `E`.
 *   Total assembly is 2.60s on the four-tile slide and 2.34s on the two-tile
 *   slide, measured to the last arrowhead settling: explanatory tier, slow
 *   enough to read from the back of a room, short enough that an instructor
 *   never waits on it.
 *   1. Scale in + fade in    both machine boundaries, `T.stagger` apart. The
 *                            ground arrives before anything stands on it.
 *   2. Stagger of slide ins  the station tiles, top to bottom, left machine
 *                            then right, `T.stagger` apart.
 *   3. Fade in               each internal leg, just after the tile below it.
 *   4. Scale in              the hub card last of the stations, from 0.97.
 *                            Nothing else scales, so the deck arriving is its
 *                            own moment.
 *   5. Line draw             each crossing span, `pathLength` 0 to 1 over
 *                            `T.draw`, outbound span first and the answering
 *                            inbound span behind it.
 *   6. Pop                   the two boundary gate ticks, one 1 to 1.28 to 1
 *                            scaleY on `E.pop`, `perSegment` so a three
 *                            keyframe track gets two easings and not four.
 *                            The one emphasis beat, dropped under
 *                            `prefers-reduced-motion`.
 *   7. Fade in               the leg label, then the figure caption.
 *   Every beat is transform and opacity only, except beat 5 which is the
 *   sanctioned `pathLength` line drawing. `useInstant()` collapses every
 *   duration and delay to zero, so a Ctrl+arrow jump mounts the finished
 *   picture.
 */

/* ------------------------------------------------------------------ */
/* Geometry. Fixed canvas, so these are absolute px on a 980x330 box.  */
/* ------------------------------------------------------------------ */

const W = 980
const H = 330

/** Each machine. Same size and same treatment: both of them are just computers. */
const PANEL = { w: 216, h: 210, y: 112 }
const LEFT_X = 0
const RIGHT_X = W - PANEL.w // 764

/** The bridge deck: narrower, higher, and the only thing above the machines. */
const HUB = { w: 248, h: 130, x: (W - 248) / 2, y: 4 } // x 366..614, bottom 134

/** The height a single-station machine centres its one tile on. */
const MID = PANEL.y + PANEL.h / 2 // 217

/**
 * Tile insets, and they are ASYMMETRIC on purpose. This is the clearance
 * budget: a span attaches to a tile edge, so whatever air the tile leaves on
 * the boundary side is the air the arrowhead gets.
 *
 * `INNER` is the side facing the gap column, which is the side a span crosses.
 * 22px there leaves the arrowhead's 10px body entirely inside the corridor
 * with room to spare, so the head reads as landing ON the tile and not as
 * growing out of the dashed line. `OUTER` is the far side, where nothing is
 * drawn and 14px is plenty. The tile is the same width either way, so both
 * machines still hold the same layout.
 */
const INSET_OUTER = 14
const INSET_INNER = 22
const TILE_W = PANEL.w - INSET_OUTER - INSET_INNER // 180

/** Left of a tile, given which machine it stands in. */
const tileLeft = (x: number, side: 'left' | 'right') =>
  x + (side === 'left' ? INSET_OUTER : INSET_INNER)

/** Where a span docks under the bridge deck, 4px clear of the card's edge. */
const LEFT_DOCK = { x: 400, y: HUB.y + HUB.h + 4 } // 400, 138
const RIGHT_DOCK = { x: 580, y: HUB.y + HUB.h + 4 } // 580, 138

/** Interior of a machine panel, the band the tiles are laid out in. */
const INNER_TOP = PANEL.y + 34 // 146, clear of the machine's name chip
const INNER_BOTTOM = PANEL.y + PANEL.h - 14 // 308
const INNER_H = INNER_BOTTOM - INNER_TOP // 162
const STACK_GAP = 34

/** The arrowhead, and the hole left for it in the middle of a gate tick. */
const HEAD = 10
const HEAD_HALF = 5
const GATE_GAP = 12
const GATE_ARM = 14

/**
 * Beat offsets, as unitless multiples of `T`. No literal seconds live in this
 * file: change the tempo in `timing.ts` and every variant moves together.
 */
const F = {
  /** Second boundary behind the first. */
  boundary: 1,
  /** Tiles start this many staggers after `T.lead`. */
  tileLead: 2,
  /** An internal leg behind the tile below it. */
  internal: 0.5,
  /** The hub behind the last tile. */
  hub: 0.5,
  /** The first span behind the hub. */
  span: 1.5,
  /** The answering span behind the first, as a fraction of the draw. */
  spanGap: 0.42,
  /** Points on a span's own draw, as fractions of `T.draw`. */
  headAt: 0.86,
  gateAt: 0.5,
  labelAt: 0.65,
  captionAt: 0.75,
} as const

/* Rule 12: a named technology carries its logo. Literal paths only, or the
   single-file build ships a broken image. */
const LOGO_SRC: Record<StationLogo, string> = {
  docker: '/assets/tech/docker.png',
  git: '/assets/tech/git.png',
  github: '/assets/tech/github.png',
  jenkins: '/assets/tech/jenkins.png',
  python: '/assets/tech/python.png',
  nodejs: '/assets/tech/nodejs.png',
  makefile: '/assets/tech/makefile.png',
}

/** A low-alpha wash of a token hue, the way `DataTable` does it. No literal hex. */
function wash(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

/**
 * `perSegment` takes its curve default from `E.inOut`, so its parameter is typed
 * as that exact four-number tuple and `E.pop` is rejected even though every
 * curve in `E` is the same shape. One widening cast at the only site that needs
 * a non-default curve, rather than an edit to the shared `timing.ts`.
 */
const POP_CURVE = E.pop as unknown as Parameters<typeof perSegment>[1]

/** Degrees from one point to another, for pointing an arrowhead along a tangent. */
function deg(fromX: number, fromY: number, toX: number, toY: number) {
  return (Math.atan2(toY - fromY, toX - fromX) * 180) / Math.PI
}

/* ------------------------------------------------------------------ */
/* Span geometry, derived from the tile a span actually touches        */
/* ------------------------------------------------------------------ */

interface SpanGeom {
  d: string
  tip: { x: number; y: number }
  angle: number
  /** The boundary the span cuts, and the height it cuts it at. */
  gate: { x: number; y: number }
  label: { left: number; top: number; width: number }
}

/**
 * The outbound span: right edge of the last left tile, up onto the deck.
 * `y` is that tile's vertical centre, so the start point is never on the
 * boundary and never on the internal leg row between tiles.
 */
function leftSpan(y: number): SpanGeom {
  const x0 = LEFT_X + INSET_OUTER + TILE_W // 194, the tile's right border
  return {
    d: `M ${x0} ${y} H 268 C 340 ${y} 376 ${y} ${LEFT_DOCK.x} ${LEFT_DOCK.y}`,
    tip: LEFT_DOCK,
    angle: deg(376, y, LEFT_DOCK.x, LEFT_DOCK.y),
    gate: { x: LEFT_X + PANEL.w - 2, y },
    /* Above the climb, in the left gap column. Clamped so a high attachment
       point (one centred tile) cannot push the label into its own curve. */
    label: { left: PANEL.w + 6, top: Math.max(116, Math.min(146, y - 100)), width: 138 },
  }
}

/**
 * The inbound span: off the deck, down into the left edge of the first right
 * tile. `y` is that tile's centre, so the arrowhead lands on a station and not
 * on the dashed boundary it just crossed.
 */
function rightSpan(y: number): SpanGeom {
  const x1 = RIGHT_X + INSET_INNER // 786, the tile's left border
  return {
    d: `M ${RIGHT_DOCK.x} ${RIGHT_DOCK.y} C 604 ${y} 640 ${y} 712 ${y} H ${x1}`,
    tip: { x: x1, y },
    angle: 0,
    gate: { x: RIGHT_X - 2, y },
    /* Below the fall, because the inbound span lands high when the right
       machine stacks two tiles and would otherwise sit on its own label. */
    label: { left: HUB.x + HUB.w + 4, top: y + 26, width: 138 },
  }
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

function StationMark({ station, size }: { station: FlowStation; size: number }) {
  const color = accentByTone[station.tone ?? 'brand']
  if (station.logo) {
    return (
      <img
        src={LOGO_SRC[station.logo]}
        alt=""
        draggable={false}
        className="shrink-0 object-contain"
        style={{ width: size, height: size }}
      />
    )
  }
  const Icon = iconByName[station.icon ?? 'server']
  return (
    <span
      className="grid shrink-0 place-items-center rounded-lg"
      style={{ width: size, height: size, background: wash(color, 0.1), color }}
    >
      <Icon width={Math.round(size * 0.56)} height={Math.round(size * 0.56)} />
    </span>
  )
}

/**
 * A station standing inside a machine. Never larger than the hub, on purpose.
 *
 * A station name is a single token often enough (`nxttrendz-backend`) that
 * wrapping is not an option: a broken token reads as two names. So the label is
 * `whitespace-nowrap` and a long one drops a type step instead of wrapping.
 */
function StationTile({
  station,
  top,
  height,
  x,
  side,
  delay,
  dur,
  instant,
}: {
  station: FlowStation
  top: number
  height: number
  x: number
  side: 'left' | 'right'
  delay: number
  dur: number
  instant: boolean
}) {
  const color = accentByTone[station.tone ?? 'brand']
  const long = typeof station.label === 'string' && station.label.length > 13
  const mark = height > 70 ? 30 : 26
  return (
    <motion.div
      className="absolute flex items-center gap-2.5 rounded-xl border-2 bg-surface-card px-3"
      style={{ left: tileLeft(x, side), top, width: TILE_W, height, borderColor: color }}
      initial={instant ? false : { opacity: 0, transform: 'translateY(14px)' }}
      animate={{ opacity: 1, transform: 'translateY(0px)' }}
      transition={{ duration: dur, delay, ease: E.out }}
    >
      <StationMark station={station} size={long ? 24 : mark} />
      <span className="min-w-0 leading-tight">
        <span
          className={`block whitespace-nowrap font-semibold tracking-tight text-ink ${
            long ? 'text-xs' : 'text-body-sm'
          }`}
        >
          {station.label}
        </span>
        {station.caption && (
          <span className="block whitespace-nowrap text-[11px]" style={{ color: colors.body }}>
            {station.caption}
          </span>
        )}
      </span>
    </motion.div>
  )
}

/**
 * A leg with both ends inside one machine. It gets the machine's own blue and
 * no bridge: nothing here crossed anything, which is the whole distinction the
 * figure is built to make. It always points DOWN the chain, like every other
 * payload arrow in this file.
 */
function InternalLeg({
  leg,
  top,
  x,
  side,
  delay,
  instant,
}: {
  leg: FlowLeg
  top: number
  x: number
  side: 'left' | 'right'
  delay: number
  instant: boolean
}) {
  return (
    <motion.div
      className="absolute flex items-center justify-center gap-2"
      style={{ left: tileLeft(x, side), top, width: TILE_W, height: STACK_GAP }}
      initial={instant ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: T.label, delay, ease: E.out }}
    >
      <svg width="14" height="18" viewBox="0 0 14 18" fill="none" aria-hidden>
        <path
          d="M7 1v14M7 15l-5-5M7 15l5-5"
          stroke={colors.brand}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
      <span
        className="rounded-pill px-2 py-0.5 font-mono text-xs font-bold"
        style={{ background: wash(colors.brand, 0.1), color: colors.brandDark }}
      >
        {leg.label}
      </span>
    </motion.div>
  )
}

/**
 * WHO TYPED THE COMMAND, as a footnote.
 *
 * A hairline dashed stub with a small head, plus a ten-pixel caption, both in
 * `colors.muted`. It sits inside the leg's label block, so it can never be
 * mistaken for the 3px payload arrow beside it and can never collide with
 * anything drawn on the canvas. `left` means the station before the leg issued
 * it, `right` means the station after did.
 */
function Issuer({ issuedBy }: { issuedBy: 'left' | 'right' }) {
  const back = issuedBy === 'right'
  return (
    <span className="mt-1 flex items-center justify-center gap-1.5">
      <svg width="22" height="8" viewBox="0 0 22 8" fill="none" aria-hidden className="shrink-0">
        <path
          d={back ? 'M21 4H2' : 'M1 4h19'}
          stroke={colors.muted}
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray="3 2"
        />
        <path
          d={back ? 'M2 4l3.4-2.4M2 4l3.4 2.4' : 'M20 4l-3.4-2.4M20 4l-3.4 2.4'}
          stroke={colors.muted}
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-[10px] font-semibold leading-tight" style={{ color: colors.muted }}>
        {back ? 'the receiver types it' : 'the sender types it'}
      </span>
    </span>
  )
}

interface Crossing {
  leg: FlowLeg
  side: 'left' | 'right'
  /** True when the image is leaving a machine for the bridge. */
  outbound: boolean
  /** The tile centre this span attaches to. */
  attach: number
}

/** One span of the bridge, plus the gate ticks where it cuts the dashed edge. */
function Span({
  crossing,
  delay,
  instant,
  reduce,
}: {
  crossing: Crossing
  delay: number
  instant: boolean
  reduce: boolean
}) {
  const geom = crossing.outbound ? leftSpan(crossing.attach) : rightSpan(crossing.attach)
  /* Orange when the image is leaving a machine, teal when it is arriving at
     one. The two directions are two colours as well as two slopes. */
  const color = crossing.outbound ? colors.accent : colors.teal
  const textColor = crossing.outbound ? colors.accentDark : colors.tealDark
  const pop = reduce || instant ? 1 : [1, 1.28, 1]

  const gateArm = (key: string, top: number) => (
    <motion.rect
      key={key}
      x={geom.gate.x}
      y={top}
      width={4}
      height={GATE_ARM}
      rx={2}
      fill={color}
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      initial={instant ? false : { opacity: 0, scaleY: 1 }}
      animate={{ opacity: 1, scaleY: pop }}
      transition={{
        duration: T.accent,
        delay: delay + T.draw * F.gateAt,
        ease: Array.isArray(pop) ? perSegment(pop.length, POP_CURVE) : E.pop,
      }}
    />
  )

  return (
    <>
      <svg className="absolute inset-0" width={W} height={H} style={{ overflow: 'visible' }}>
        {/* The gate: the boundary line, lit at the point of crossing, with a
            hole where the span passes so nothing is drawn over anything. */}
        {gateArm('above', geom.gate.y - GATE_GAP - GATE_ARM)}
        {gateArm('below', geom.gate.y + GATE_GAP)}
        <motion.path
          d={geom.d}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          initial={instant ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: T.draw, delay, ease: E.inOut }}
        />
        {/* Arrow head as its own fade, so it cannot sit at the far end before
            the line has arrived there. */}
        <motion.path
          d={`M0 0 -${HEAD} -${HEAD_HALF} -${HEAD} ${HEAD_HALF} Z`}
          fill={color}
          transform={`translate(${geom.tip.x} ${geom.tip.y}) rotate(${geom.angle})`}
          initial={instant ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: T.label, delay: delay + T.draw * F.headAt, ease: E.out }}
        />
      </svg>
      <motion.div
        className="absolute text-center"
        style={{ left: geom.label.left, top: geom.label.top, width: geom.label.width }}
        initial={instant ? false : { opacity: 0, transform: 'translateY(8px)' }}
        animate={{ opacity: 1, transform: 'translateY(0px)' }}
        transition={{ duration: T.label, delay: delay + T.draw * F.labelAt, ease: E.out }}
      >
        <span
          className="inline-block rounded-pill border px-2 py-0.5 font-mono text-xs font-bold"
          style={{ background: colors.white, borderColor: wash(color, 0.45), color: textColor }}
        >
          {crossing.leg.label}
        </span>
        {crossing.leg.sub && (
          <span
            className="mt-0.5 block text-xs font-semibold leading-tight"
            style={{ color: colors.body }}
          >
            {crossing.leg.sub}
          </span>
        )}
        <Issuer issuedBy={crossing.leg.issuedBy ?? 'left'} />
      </motion.div>
    </>
  )
}

/** One computer. Dashed, named on a chip at its shoulder, exactly as `MachineBoundary` draws it. */
function Machine({
  x,
  name,
  delay,
  instant,
  children,
}: {
  x: number
  name: string
  delay: number
  instant: boolean
  children: React.ReactNode
}) {
  return (
    <>
      <motion.div
        className="absolute rounded-card border-[2.5px] border-dashed"
        style={{
          left: x,
          top: PANEL.y,
          width: PANEL.w,
          height: PANEL.h,
          borderColor: colors.brand,
          background: wash(colors.brand, 0.045),
        }}
        initial={instant ? false : { opacity: 0, transform: 'scale(0.97)' }}
        animate={{ opacity: 1, transform: 'scale(1)' }}
        transition={{ duration: T.enter, delay, ease: E.out }}
      />
      <motion.span
        className="absolute rounded-pill px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-white"
        style={{ left: x + 16, top: PANEL.y - 11, background: colors.brand }}
        initial={instant ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: T.enter, delay, ease: E.out }}
      >
        {name}
      </motion.span>
      {children}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* The figure                                                          */
/* ------------------------------------------------------------------ */

export function BoundaryBridge({
  stations,
  legs,
  caption,
  className = '',
  hubBadge = 'On neither machine',
}: FlowFigureProps & {
  /*
    THE PILL ABOVE THE BRIDGE DECK.

    Defaults to "On neither machine", which is what this figure said for its
    first five sessions: the argument the picture makes is that the payload
    sits outside both boundaries. That wording is abstract, and session 6's
    review found it landing badly on a slide whose middle station is Docker
    Hub, where a beginner reads "neither machine" as "nowhere". A deck that
    can name the place should name it, so this is now the caller's word.

    Keep it two or three words: it is a pill, and it overprints past about 20
    characters.
  */
  hubBadge?: string
}) {
  const instant = useInstant()
  const reduce = !!useReducedMotion()
  const t = instant ? 0 : 1

  /*
    Three zones, derived from MEANING and nothing else: everything before the
    hub lives on the first computer, everything after it on the second. When no
    station declares itself the hub we take the middle one, which keeps the
    figure drawable but is the point at which it starts guessing (see the cost
    note in the header).
  */
  const declared = stations.findIndex((s) => s.kind === 'hub')
  const hubIdx = declared >= 0 ? declared : Math.floor((stations.length - 1) / 2)
  const hub = stations[hubIdx]
  const leftStations = stations.slice(0, hubIdx)
  const rightStations = stations.slice(hubIdx + 1)

  /** Tile rows inside a machine, laid out on the fixed interior band. */
  const rows = (n: number) => {
    if (n <= 0) return { h: 0, top: (_i: number) => 0 }
    if (n === 1) {
      const h = 78
      return { h, top: (_i: number) => MID - h / 2 }
    }
    const h = (INNER_H - (n - 1) * STACK_GAP) / n
    return { h, top: (i: number) => INNER_TOP + i * (h + STACK_GAP) }
  }
  const leftRows = rows(leftStations.length)
  const rightRows = rows(rightStations.length)

  /*
    Where the two crossings attach. The image leaves from the LAST station on
    the first computer and arrives at the FIRST station on the second, so those
    are the two tiles a span is allowed to touch. Taking the tile's centre is
    what keeps an endpoint off the dashed boundary and off the internal leg row.
  */
  const leftAttach = leftStations.length
    ? leftRows.top(leftStations.length - 1) + leftRows.h / 2
    : MID
  const rightAttach = rightStations.length ? rightRows.top(0) + rightRows.h / 2 : MID

  /* legs[i] joins stations[i] to stations[i+1]. The two legs that touch the hub
     are the bridge spans; every other leg stays inside a machine. The payload
     always runs along the chain, so `outbound` is a fact about POSITION and
     never about `issuedBy`. */
  const crossings: Crossing[] = []
  const internals: { leg: FlowLeg; side: 'left' | 'right'; slot: number }[] = []
  legs.forEach((leg, i) => {
    if (i === hubIdx - 1) {
      crossings.push({ leg, side: 'left', outbound: true, attach: leftAttach })
    } else if (i === hubIdx) {
      crossings.push({ leg, side: 'right', outbound: false, attach: rightAttach })
    } else if (i < hubIdx - 1) {
      internals.push({ leg, side: 'left', slot: i })
    } else {
      internals.push({ leg, side: 'right', slot: i - hubIdx - 1 })
    }
  })
  /* Entrance order teaches reading order, so the span that leaves a machine is
     drawn before the span that answers it. */
  const orderedCrossings = [...crossings].sort((a, b) => Number(b.outbound) - Number(a.outbound))

  const nSt = leftStations.length + rightStations.length
  const dTile = (gi: number) => (T.lead + (F.tileLead + gi) * T.stagger) * t
  const dHub = (T.lead + (F.tileLead + nSt + F.hub) * T.stagger) * t
  const dSpan = (k: number) => dHub + (F.span * T.stagger + k * T.draw * F.spanGap) * t
  const dCaption = dSpan(Math.max(orderedCrossings.length - 1, 0)) + T.draw * F.captionAt * t

  const hubColor = accentByTone[hub?.tone ?? 'accent']

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: W, height: H }}>
        <Machine x={LEFT_X} name="One computer" delay={T.lead * t} instant={instant}>
          {leftStations.map((s, i) => (
            <StationTile
              key={`ls${i}`}
              station={s}
              x={LEFT_X}
              side="left"
              top={leftRows.top(i)}
              height={leftRows.h}
              delay={dTile(i)}
              dur={T.enter * t}
              instant={instant}
            />
          ))}
          {internals
            .filter((l) => l.side === 'left')
            .map((l) => (
              <InternalLeg
                key={`ll${l.slot}`}
                leg={l.leg}
                x={LEFT_X}
                side="left"
                top={leftRows.top(l.slot) + leftRows.h}
                delay={dTile(l.slot + 1) + F.internal * T.stagger * t}
                instant={instant}
              />
            ))}
        </Machine>

        <Machine
          x={RIGHT_X}
          name="A different computer"
          delay={(T.lead + F.boundary * T.stagger) * t}
          instant={instant}
        >
          {rightStations.map((s, i) => (
            <StationTile
              key={`rs${i}`}
              station={s}
              x={RIGHT_X}
              side="right"
              top={rightRows.top(i)}
              height={rightRows.h}
              delay={dTile(leftStations.length + i)}
              dur={T.enter * t}
              instant={instant}
            />
          ))}
          {internals
            .filter((l) => l.side === 'right')
            .map((l) => (
              <InternalLeg
                key={`rl${l.slot}`}
                leg={l.leg}
                x={RIGHT_X}
                side="right"
                top={rightRows.top(l.slot) + rightRows.h}
                delay={dTile(leftStations.length + l.slot + 1) + F.internal * T.stagger * t}
                instant={instant}
              />
            ))}
        </Machine>

        {/* The bridge deck. Higher than both machines, on neither of them. */}
        {hub && (
          <motion.div
            className="absolute rounded-card border-2 bg-surface-card px-4 shadow-card"
            style={{ left: HUB.x, top: HUB.y, width: HUB.w, height: HUB.h, borderColor: hubColor }}
            initial={instant ? false : { opacity: 0, transform: 'scale(0.97)' }}
            animate={{ opacity: 1, transform: 'scale(1)' }}
            transition={{ duration: T.enter * t, delay: dHub, ease: E.out }}
          >
            <span
              className="absolute -top-[11px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-pill px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-white"
              style={{ background: hubColor }}
            >
              {hubBadge}
            </span>
            <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
              <StationMark station={hub} size={34} />
              <span className="whitespace-nowrap font-heading text-body-lg font-bold leading-tight text-ink">
                {hub.label}
              </span>
              {hub.caption && (
                <span className="block whitespace-nowrap text-xs font-semibold" style={{ color: colors.body }}>
                  {hub.caption}
                </span>
              )}
            </div>
          </motion.div>
        )}

        {orderedCrossings.map((c, k) => (
          <Span
            key={`${c.side}-${k}`}
            crossing={c}
            delay={dSpan(k)}
            instant={instant}
            reduce={reduce}
          />
        ))}
      </div>

      {caption && (
        <motion.p
          className="mt-2 text-center text-body-sm"
          style={{ color: colors.body }}
          initial={instant ? false : { opacity: 0, transform: 'translateY(8px)' }}
          animate={{ opacity: 1, transform: 'translateY(0px)' }}
          transition={{ duration: T.label * t, delay: dCaption, ease: E.out }}
        >
          {caption}
        </motion.p>
      )}
    </div>
  )
}

export default BoundaryBridge
