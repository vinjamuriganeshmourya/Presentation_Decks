import { createContext, useContext, type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { At, Label, STILL, REDUCED, useLoop, useCycle, useTicker } from '../scene'

/**
 * THE ISOMETRIC ENGINE (Deployment & Service Models, 2026-10-23).
 *
 * Every figure in this deck is drawn with this file: a true isometric
 * projection (the 2:1 pixel ratio, a 30 degree floor), cuboids as three flat
 * faces with one fixed shading rule, a floor the objects stand on, links that
 * run along that floor, and packets that travel on the links as a pure
 * function of one clock. The techniques are the user's skill repos, digested:
 *
 *   projection   system-atlas: tile 72x36, P(gx, gy, z) = [(gx - gy) * 36,
 *                (gx + gy) * 18 - z]; here one grid unit is `U` px of half
 *                tile, so a tile is 2U wide and U tall, and one unit of height
 *                is U px. Painter's order by gx + gy (+ z).
 *   solids       anatomy / isometric-anatomy: solids, never wireframes; the top
 *                face lightest, the two sides darker by fixed steps; fine
 *                outlines (under 1px) in a darker tone of the same hue; a soft
 *                shadow under the base; one lit accent per scene.
 *   hatching     system-atlas hatches the side faces; here the right face is
 *                darker instead (projector contrast), hatch is an option.
 *   motion       live-panel: state = f(t) from one clock, seamless loop, frame 0
 *                a complete picture; visual-explainer / SeeCode: a packet is a
 *                dot on the path with a short trail, 1.6 to 5.2 s per route, a
 *                pause at each hop; explainer-pack: the data layer has few hues
 *                with fixed meanings, and here they are: brand blue = provider,
 *                amber = customer, slate = anything neutral, one accent for the
 *                thing to look at.
 *
 * LABELS ARE HTML. Every word on a figure is a `Label` placed with `IsoAt`
 * over the svg, never svg `<text>`: the harnesses measure DOM text against
 * its box, the presenter's edit mode edits DOM text, and the text audit reads
 * DOM text. The svg draws shapes only.
 *
 * STILL FRAMES. `useLoop`, `useCycle` and `useTicker` (scene.tsx) hold at
 * their `still` value on harness URLs, under reduced motion and in picker
 * thumbnails (InstantContext), so every harness frame is the still design and
 * nothing re-renders while a screenshot is taken.
 */

/* ------------------------------------------------------------------ scale */

/** Half the tile width in px: a tile is 2U wide, U tall, and one unit of height is U px. */
export const U = 28

const IsoCtx = createContext<{ u: number; ox: number; oy: number }>({ u: U, ox: 0, oy: 0 })

export function useIso() {
  return useContext(IsoCtx)
}

/** Grid (x, y, z) to screen (px), in the scene's own units; `u` defaults to the scene's. */
export function P(x: number, y: number, z = 0, u = U): [number, number] {
  return [(x - y) * u, (x + y) * (u / 2) - z * u]
}

export const pts = (q: [number, number][]) => q.map(([a, b]) => `${a.toFixed(2)},${b.toFixed(2)}`).join(' ')

/* ------------------------------------------------------------------ colour */

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const rgbToHex = (r: number, g: number, b: number) => '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')

/** Mix a hex colour toward white (amt > 0) or black (amt < 0), amt in -1..1. */
export function shade(hex: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex)
  const t = amt > 0 ? 255 : 0
  const k = Math.abs(amt)
  return rgbToHex(r + (t - r) * k, g + (t - g) * k, b + (t - b) * k)
}

/** Mix two hex colours, `k` toward `b`. */
export function mix(a: string, b: string, k: number): string {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  return rgbToHex(r1 + (r2 - r1) * k, g1 + (g2 - g1) * k, b1 + (b2 - b1) * k)
}

/**
 * THE DATA PALETTE: few hues, fixed meanings (explainer-pack's rule). Chrome
 * colours stay the template's (`tokens.ts`); these are what the drawn objects
 * are made of.
 */
export const ISO = {
  provider: colors.brand, // what the provider owns or manages
  customer: '#F5A623', // what the customer owns, brings or manages (the reference's amber)
  steel: '#8FA3BF', // neutral hardware: racks, buildings, devices
  slate: '#5B6F8A', // darker neutral: roads, shadows' hue, inactive things
  paper: '#EEF3FB', // floors and plates
  floor: '#DCE6F7', // the floor grid's lines
  grass: '#9CCB8E', // ground outside a building (analogies)
  gold: '#F2C14E', // coins, price tags, a taxi
  red: '#E8655A', // a stop, a reclaim, a closed shutter
  green: '#3DBB7A', // a go, a healthy light
  glass: '#CFE0FF', // screens and glass
  ink: colors.ink,
} as const

/** The three face tones of a solid, from its base colour. */
export const faces = (c: string) => ({ top: shade(c, 0.3), left: shade(c, 0.02), right: shade(c, -0.2), line: shade(c, -0.45) })

/* ------------------------------------------------------------------ the scene */

/**
 * One isometric scene: a positioned box (`w` x `h` px) that provides the scale
 * and the origin to everything inside it. `IsoSvg` draws into it; `IsoAt`
 * places HTML labels on grid points. `ox`, `oy` put grid (0, 0, 0) at that
 * pixel of the box.
 */
export function IsoScene({ w, h, ox, oy, u = U, children, className = '', style }: { w: number; h: number; ox: number; oy: number; u?: number; children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <IsoCtx.Provider value={{ u, ox, oy }}>
      <div className={`relative ${className}`} style={{ width: w, height: h, ...style }}>
        {children}
      </div>
    </IsoCtx.Provider>
  )
}

/** The svg layer of a scene, filling it; children are drawn in grid units through `P`. */
export function IsoSvg({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  const { ox, oy } = useIso()
  return (
    <svg className={`absolute inset-0 h-full w-full overflow-visible ${className}`} style={style} aria-hidden>
      <g transform={`translate(${ox} ${oy})`}>{children}</g>
    </svg>
  )
}

/** The scene's own `P`: grid to px inside the scene's box (origin included). */
export function useP() {
  const { u, ox, oy } = useIso()
  return (x: number, y: number, z = 0): [number, number] => {
    const [a, b] = P(x, y, z, u)
    return [a + ox, b + oy]
  }
}

/** An HTML label (or anything) anchored on a grid point, offset in px; `cx` centres it on the point. */
export function IsoAt({ x, y, z = 0, dx = 0, dy = 0, cx = true, cy = false, w, children, style, className }: { x: number; y: number; z?: number; dx?: number; dy?: number; cx?: boolean; cy?: boolean; w?: number; children: ReactNode; style?: CSSProperties; className?: string }) {
  const p = useP()
  const [px, py] = p(x, y, z)
  return (
    <At x={px + dx} y={py + dy} cx={cx} cy={cy} w={w} style={style} className={className}>
      {children}
    </At>
  )
}

/* ------------------------------------------------------------------ solids */

export type Face = 'top' | 'left' | 'right'

/**
 * A face's local frame as an svg `transform` (ai-iso-skill's `plane()`: draw
 * flat, let the matrix lay it on the face), so a decoration drawn in face
 * units lands on the face. Local units are PIXELS along the face: on `right`
 * (the x = x + w plane) local (a, b) runs a along +y, `d * u` px wide, and b
 * DOWN the face, `h * u` px tall; on `left` (the y = y + d plane) a runs along
 * +x, `w * u` wide, b down; on `top` a runs along +x and b along +y. Strokes
 * inside a face group carry `vector-effect: non-scaling-stroke` (`FACE_STROKE`)
 * or the matrix thickens them.
 */
export function faceTransform(face: Face, x: number, y: number, z: number, w: number, d: number, h: number, u = U): string {
  if (face === 'right') {
    const [ex, ey] = P(x + w, y, z + h, u)
    return `matrix(-1 0.5 0 1 ${ex} ${ey})`
  }
  if (face === 'left') {
    const [ex, ey] = P(x, y + d, z + h, u)
    return `matrix(1 0.5 0 1 ${ex} ${ey})`
  }
  const [ex, ey] = P(x, y, z + h, u)
  return `matrix(1 0.5 -1 0.5 ${ex} ${ey})`
}

/** The style every stroked decoration inside a face group carries. */
export const FACE_STROKE: CSSProperties = { vectorEffect: 'non-scaling-stroke' }

/**
 * A cuboid at grid (x, y, z), `w` along x, `d` along y, `h` up. Three faces,
 * shaded from `color`; `onRight` / `onLeft` / `onTop` draw decorations in
 * face units (see `faceTransform`). `ghost` draws a dashed outline only.
 */
export function Box({
  x,
  y,
  z = 0,
  w = 1,
  d = 1,
  h = 1,
  color = ISO.steel,
  tone,
  opacity = 1,
  stroke = true,
  ghost = false,
  onRight,
  onLeft,
  onTop,
  style,
  className,
}: {
  x: number
  y: number
  z?: number
  w?: number
  d?: number
  h?: number
  color?: string
  /** override the three faces */
  tone?: { top?: string; left?: string; right?: string; line?: string }
  opacity?: number
  stroke?: boolean
  ghost?: boolean
  onRight?: ReactNode
  onLeft?: ReactNode
  onTop?: ReactNode
  style?: CSSProperties
  className?: string
}) {
  const { u } = useIso()
  const f = { ...faces(color), ...tone }
  const top: [number, number][] = [P(x, y, z + h, u), P(x + w, y, z + h, u), P(x + w, y + d, z + h, u), P(x, y + d, z + h, u)]
  const right: [number, number][] = [P(x + w, y, z + h, u), P(x + w, y + d, z + h, u), P(x + w, y + d, z, u), P(x + w, y, z, u)]
  const left: [number, number][] = [P(x, y + d, z + h, u), P(x + w, y + d, z + h, u), P(x + w, y + d, z, u), P(x, y + d, z, u)]
  const line = stroke ? f.line : 'none'
  if (ghost) {
    return (
      <g opacity={opacity} style={style} className={className}>
        {[top, right, left].map((q, i) => (
          <polygon key={i} points={pts(q)} fill="none" stroke={f.line} strokeWidth={1} strokeDasharray="5 4" strokeLinejoin="round" opacity={0.7} />
        ))}
      </g>
    )
  }
  return (
    <g opacity={opacity} style={{ transition: 'opacity 420ms cubic-bezier(0.22,1,0.36,1)', ...style }} className={className}>
      <polygon points={pts(left)} fill={f.left} stroke={line} strokeWidth={0.75} strokeLinejoin="round" style={{ transition: 'fill 420ms cubic-bezier(0.22,1,0.36,1)' }} />
      <polygon points={pts(right)} fill={f.right} stroke={line} strokeWidth={0.75} strokeLinejoin="round" style={{ transition: 'fill 420ms cubic-bezier(0.22,1,0.36,1)' }} />
      <polygon points={pts(top)} fill={f.top} stroke={line} strokeWidth={0.75} strokeLinejoin="round" style={{ transition: 'fill 420ms cubic-bezier(0.22,1,0.36,1)' }} />
      {onLeft && <g transform={faceTransform('left', x, y, z, w, d, h, u)}>{onLeft}</g>}
      {onRight && <g transform={faceTransform('right', x, y, z, w, d, h, u)}>{onRight}</g>}
      {onTop && <g transform={faceTransform('top', x, y, z, w, d, h, u)}>{onTop}</g>}
    </g>
  )
}

/** A flat plate on the floor (or at `z`): a plinth, a zone, a road. */
export function Plate({ x, y, z = 0, w, d, color = ISO.paper, h = 0.14, opacity = 1, stroke = true, style }: { x: number; y: number; z?: number; w: number; d: number; color?: string; h?: number; opacity?: number; stroke?: boolean; style?: CSSProperties }) {
  return <Box x={x} y={y} z={z} w={w} d={d} h={h} color={color} opacity={opacity} stroke={stroke} style={style} />
}

/** The soft shadow an object throws on the floor: a flat quad a little bigger than its base. */
export function Shadow({ x, y, w, d, grow = 0.18, opacity = 0.1 }: { x: number; y: number; w: number; d: number; grow?: number; opacity?: number }) {
  const { u } = useIso()
  const q: [number, number][] = [P(x - grow, y - grow, 0, u), P(x + w + grow, y - grow, 0, u), P(x + w + grow, y + d + grow, 0, u), P(x - grow, y + d + grow, 0, u)]
  return <polygon points={pts(q)} fill={ISO.slate} opacity={opacity} />
}

/** A flat quad on the floor at `z`, any tone: a tile, a tint, a highlight ring's fill. */
export function Quad({ x, y, z = 0, w, d, fill = ISO.paper, stroke, dashed = false, width = 1.2, opacity = 1, style }: { x: number; y: number; z?: number; w: number; d: number; fill?: string; stroke?: string; dashed?: boolean; width?: number; opacity?: number; style?: CSSProperties }) {
  const { u } = useIso()
  const q: [number, number][] = [P(x, y, z, u), P(x + w, y, z, u), P(x + w, y + d, z, u), P(x, y + d, z, u)]
  return <polygon points={pts(q)} fill={fill} stroke={stroke ?? 'none'} strokeWidth={width} strokeDasharray={dashed ? '6 5' : undefined} strokeLinejoin="round" opacity={opacity} style={style} />
}

/**
 * A fence around a plot: a dashed rectangle on the floor with short posts at
 * the corners, in the owner's colour (the TR's "organisation's fence" and
 * "provider's larger data centre fence").
 */
export function Fence({ x, y, w, d, color = colors.brand, dashed = true, posts = true, tint = 0.06, width = 1.8, style }: { x: number; y: number; w: number; d: number; color?: string; dashed?: boolean; posts?: boolean; tint?: number; width?: number; style?: CSSProperties }) {
  const { u } = useIso()
  const corners: [number, number][] = [
    [x, y],
    [x + w, y],
    [x + w, y + d],
    [x, y + d],
  ]
  const q = corners.map(([a, b]) => P(a, b, 0, u))
  return (
    <g style={style}>
      {tint > 0 && <polygon points={pts(q)} fill={color} opacity={tint} />}
      <polygon points={pts(q)} fill="none" stroke={color} strokeWidth={width} strokeDasharray={dashed ? '7 5' : undefined} strokeLinejoin="round" />
      {posts &&
        corners.map(([a, b], i) => {
          const [px, py] = P(a, b, 0, u)
          const [tx, ty] = P(a, b, 0.42, u)
          return <line key={i} x1={px} y1={py} x2={tx} y2={ty} stroke={color} strokeWidth={2.2} strokeLinecap="round" />
        })}
    </g>
  )
}

/* ------------------------------------------------------------------ links and packets */

export type GridPt = [number, number]

/** A polyline in grid units lifted to `z`, as screen points. */
export function screenPts(points: GridPt[], z: number, u: number): [number, number][] {
  return points.map(([x, y]) => P(x, y, z, u))
}

/** Length and segments of a screen polyline, for travel along it. */
export function measure(q: [number, number][]) {
  const seg: number[] = []
  let len = 0
  for (let i = 1; i < q.length; i++) {
    const d = Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1])
    seg.push(d)
    len += d
  }
  return { seg, len }
}

/** The point at distance `d` along the polyline (clamped). */
export function along(q: [number, number][], seg: number[], d: number): [number, number] {
  let rest = Math.max(0, d)
  for (let i = 0; i < seg.length; i++) {
    if (rest <= seg[i] || i === seg.length - 1) {
      const f = seg[i] ? Math.min(1, rest / seg[i]) : 0
      const a = q[i]
      const b = q[i + 1]
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]
    }
    rest -= seg[i]
  }
  return q[q.length - 1]
}

/**
 * A link along the floor between points, in grid units. `dashed` for a
 * return path or a link not yet in use; `on` dims it when false; `arrow`
 * draws a small filled head at the end (SeeCode's 8 x 3.2 head, scaled).
 */
export function Link({ points, z = 0.04, color = ISO.slate, width = 2, dashed = false, arrow = false, on = true, opacity, style }: { points: GridPt[]; z?: number; color?: string; width?: number; dashed?: boolean; arrow?: boolean; on?: boolean; opacity?: number; style?: CSSProperties }) {
  const { u } = useIso()
  const q = screenPts(points, z, u)
  const d = q.map(([a, b], i) => `${i ? 'L' : 'M'}${a.toFixed(2)} ${b.toFixed(2)}`).join(' ')
  let head: ReactNode = null
  if (arrow && q.length >= 2) {
    const [ax, ay] = q[q.length - 2]
    const [bx, by] = q[q.length - 1]
    const ang = Math.atan2(by - ay, bx - ax)
    const L = 9
    const W = 4
    const p1: [number, number] = [bx - L * Math.cos(ang) + W * Math.sin(ang), by - L * Math.sin(ang) - W * Math.cos(ang)]
    const p2: [number, number] = [bx - L * Math.cos(ang) - W * Math.sin(ang), by - L * Math.sin(ang) + W * Math.cos(ang)]
    head = <polygon points={pts([[bx, by], p1, p2])} fill={color} />
  }
  return (
    <g opacity={opacity ?? (on ? 1 : 0.3)} style={{ transition: 'opacity 420ms cubic-bezier(0.22,1,0.36,1)', ...style }}>
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeDasharray={dashed ? '6 5' : undefined} strokeLinecap="round" strokeLinejoin="round" />
      {head}
    </g>
  )
}

/**
 * A packet on a link: a dot with a short trail at phase `t` (0 to 1) along the
 * points, pure f(t). `fadeEnds` hides it just before and after the ends so it
 * enters and leaves the objects instead of popping. Render it under the
 * objects it enters (SeeCode runs tokens under the node layer).
 */
export function Packet({ points, t, z = 0.14, color = colors.brand, r = 5, trail = 14, fadeEnds = true, on = true, glyph }: { points: GridPt[]; t: number; z?: number; color?: string; r?: number; trail?: number; fadeEnds?: boolean; on?: boolean; glyph?: ReactNode }) {
  const { u } = useIso()
  const q = screenPts(points, z, u)
  const { seg, len } = measure(q)
  const tt = Math.min(1, Math.max(0, t))
  const d = tt * len
  const [hx, hy] = along(q, seg, d)
  const [tx, ty] = along(q, seg, Math.max(0, d - trail))
  const edge = fadeEnds ? Math.min(1, Math.min(tt, 1 - tt) / 0.06) : 1
  const op = on ? edge : 0
  return (
    <g opacity={op}>
      <line x1={tx} y1={ty} x2={hx} y2={hy} stroke={color} strokeWidth={r * 0.9} strokeLinecap="round" opacity={0.35} />
      <circle cx={hx} cy={hy} r={r} fill={color} stroke={colors.white} strokeWidth={1.5} />
      {glyph && <g transform={`translate(${hx} ${hy})`}>{glyph}</g>}
    </g>
  )
}

/**
 * Several packets spaced along one link, each at its own phase: `n` packets,
 * `t` the clock (0 to 1), `spread` their spacing as a fraction of the lap.
 */
export function Packets({ points, t, n = 2, spread, ...rest }: { points: GridPt[]; t: number; n?: number; spread?: number } & Omit<Parameters<typeof Packet>[0], 'points' | 't'>) {
  const gap = spread ?? 1 / n
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <Packet key={i} points={points} t={(t + i * gap) % 1} {...rest} />
      ))}
    </>
  )
}

/* ------------------------------------------------------------------ sprites that are not solids */

/** A cloud silhouette floating over the floor at grid (x, y), `w` grid units wide; a soft shadow on the floor under it. */
export function CloudAt({ x, y, z = 1.4, w = 2.2, color = colors.brand, shadow = true, opacity = 1, style }: { x: number; y: number; z?: number; w?: number; color?: string; shadow?: boolean; opacity?: number; style?: CSSProperties }) {
  const { u } = useIso()
  const [cx, cy] = P(x, y, z, u)
  const [sx, sy] = P(x, y, 0, u)
  const s = (w * u * 2) / 120
  const f = faces(color)
  return (
    <g opacity={opacity} style={{ transition: 'opacity 420ms cubic-bezier(0.22,1,0.36,1)', ...style }}>
      {shadow && <ellipse cx={sx} cy={sy} rx={w * u * 0.8} ry={w * u * 0.32} fill={ISO.slate} opacity={0.1} />}
      <g transform={`translate(${cx} ${cy}) scale(${s})`}>
        <path d="M-44 14 a18 18 0 0 1 4 -35 a24 24 0 0 1 46 -8 a20 20 0 0 1 34 14 a16 16 0 0 1 4 29 Z" fill={f.top} stroke={f.line} strokeWidth={0.9 / s} strokeLinejoin="round" />
        <path d="M-44 14 a18 18 0 0 1 4 -35 a24 24 0 0 1 46 -8 a20 20 0 0 1 34 14 a16 16 0 0 1 4 29 Z" fill={f.left} opacity={0.35} transform="translate(0 5)" style={{ mixBlendMode: 'multiply' }} />
      </g>
    </g>
  )
}

/** A small standing person at grid (x, y): legs, a body, a head. No face. */
export function Person({ x, y, z = 0, color = ISO.slate, size = 1, opacity = 1, style }: { x: number; y: number; z?: number; color?: string; size?: number; opacity?: number; style?: CSSProperties }) {
  const { u } = useIso()
  const [fx, fy] = P(x, y, z, u)
  const s = (u / 28) * size
  const f = faces(color)
  return (
    <g transform={`translate(${fx} ${fy}) scale(${s})`} opacity={opacity} style={{ transition: 'opacity 420ms cubic-bezier(0.22,1,0.36,1), transform 520ms cubic-bezier(0.22,1,0.36,1)', ...style }}>
      <ellipse cx={0} cy={1} rx={9} ry={4} fill={ISO.slate} opacity={0.14} />
      <rect x={-6} y={-16} width={4.6} height={15} rx={2.3} fill={f.right} />
      <rect x={1.4} y={-16} width={4.6} height={15} rx={2.3} fill={f.right} />
      <rect x={-8} y={-38} width={16} height={24} rx={6} fill={f.left} stroke={f.line} strokeWidth={0.6} />
      <circle cx={0} cy={-45} r={7} fill="#F3D3B6" stroke={shade('#F3D3B6', -0.3)} strokeWidth={0.6} />
      <path d="M-7 -46 a7 7 0 0 1 14 0 v-1 a7 5 0 0 0 -14 0 z" fill={shade(color, -0.35)} />
    </g>
  )
}

/* ------------------------------------------------------------------ clocks and eases */

export { STILL, REDUCED, useLoop, useCycle, useTicker, Label }

/** A transition string on the house curve, `none` under InstantContext. */
export function useEase(ms = 480): string {
  const instant = useInstant()
  return instant ? 'none' : `all ${ms}ms cubic-bezier(0.22,1,0.36,1)`
}

/** Smoothstep 0..1. */
export const smooth = (k: number) => {
  const x = Math.min(1, Math.max(0, k))
  return x * x * (3 - 2 * x)
}

/** A sub-phase of the lap: 0 before `a`, 1 after `b`, smooth between. */
export const within = (t: number, a: number, b: number) => smooth((t - a) / (b - a))

/** Ping-pong of a sub-phase: rises over [a, b], holds, falls over [c, d]. */
export const pulse = (t: number, a: number, b: number, c: number, d: number) => within(t, a, b) * (1 - within(t, c, d))

/** A beat index for a lap split into `n` equal beats. */
export const beatOf = (t: number, n: number) => Math.min(n - 1, Math.floor(t * n))
