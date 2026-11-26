import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { Box, CloudAt, FACE_STROKE, ISO, P, Plate, Quad, Shadow, faces, pts, shade, useIso } from './iso'

/**
 * THE OBJECT CATALOGUE. Every figure in the deck is built from these: a few
 * boxes with flat detail on their faces (the digest's rule: "a box is three
 * faces plus flat detail"). Dimensions are grid units (one unit = `U` px, a
 * rack is 1 x 0.8 x 2.4). Each takes a grid position and a colour and draws
 * itself with its own floor shadow; a scene lists them back to front.
 *
 * Colours: `ISO.provider` (brand blue) for what the provider owns, `ISO.customer`
 * (amber) for what the customer brings, `ISO.steel` for hardware that belongs
 * to nobody in the argument. A lit part (an LED, a glow) is the one accent.
 */

const T = 'cubic-bezier(0.22,1,0.36,1)'
const ease = (ms = 420) => `all ${ms}ms ${T}`

/* ------------------------------------------------------------------ hardware */

/**
 * A server rack: a tall box with slot bands and an LED per slot on its right
 * face. `lit[i]` is a colour (a tenant's) or false; `on` dims the whole rack.
 */
export function Rack({ x, y, z = 0, w = 1, d = 0.8, h = 2.4, color = ISO.steel, lit = [], slots = 4, on = true, opacity, style }: { x: number; y: number; z?: number; w?: number; d?: number; h?: number; color?: string; lit?: (string | false | undefined)[]; slots?: number; on?: boolean; opacity?: number; style?: CSSProperties }) {
  const { u } = useIso()
  const fw = d * u
  const fh = h * u
  const pad = fw * 0.12
  const bandH = (fh - pad * (slots + 1)) / slots
  const f = faces(color)
  return (
    <g opacity={opacity ?? (on ? 1 : 0.38)} style={{ transition: ease(), ...style }}>
      <Shadow x={x} y={y} w={w} d={d} />
      <Box
        x={x}
        y={y}
        z={z}
        w={w}
        d={d}
        h={h}
        color={color}
        onRight={
          <g>
            {Array.from({ length: slots }, (_, i) => {
              const by = pad + i * (bandH + pad)
              const c = lit[i]
              return (
                <g key={i}>
                  <rect x={pad} y={by} width={fw - pad * 2} height={bandH} rx={2} fill={shade(color, -0.42)} opacity={0.55} />
                  <rect x={pad * 1.6} y={by + bandH * 0.3} width={(fw - pad * 2) * 0.5} height={bandH * 0.4} rx={1} fill={shade(color, 0.25)} opacity={0.35} />
                  <circle cx={fw - pad * 2.2} cy={by + bandH / 2} r={Math.max(2, bandH * 0.22)} fill={c || shade(color, -0.1)} opacity={c ? 1 : 0.5} style={{ transition: ease(360) }} />
                  {c && <circle cx={fw - pad * 2.2} cy={by + bandH / 2} r={Math.max(2, bandH * 0.22) * 2.2} fill={c} opacity={0.22} />}
                </g>
              )
            })}
          </g>
        }
        onLeft={<rect x={fw * 0.15} y={fh * 0.08} width={w * u - fw * 0.3} height={fh * 0.06} rx={1.5} fill={f.top} opacity={0.5} />}
      />
    </g>
  )
}

/** A low wide hall (a data centre): a box with roof units and a door, and racks inside drawn by the caller in front. */
export function Hall({ x, y, w = 4, d = 3, h = 1.5, color = ISO.steel, roof = 3, opacity = 1, style }: { x: number; y: number; w?: number; d?: number; h?: number; color?: string; roof?: number; opacity?: number; style?: CSSProperties }) {
  const { u } = useIso()
  const f = faces(color)
  return (
    <g opacity={opacity} style={{ transition: ease(), ...style }}>
      <Shadow x={x} y={y} w={w} d={d} grow={0.22} />
      <Box
        x={x}
        y={y}
        w={w}
        d={d}
        h={h}
        color={color}
        onRight={
          <g>
            <rect x={d * u * 0.12} y={h * u * 0.2} width={d * u * 0.76} height={h * u * 0.32} rx={2} fill={shade(color, -0.35)} opacity={0.45} />
            <rect x={d * u * 0.4} y={h * u * 0.56} width={d * u * 0.2} height={h * u * 0.44} rx={1.5} fill={shade(color, -0.45)} opacity={0.7} />
          </g>
        }
        onLeft={
          <g>
            {Array.from({ length: Math.max(2, Math.round(w * 2)) }, (_, i) => (
              <rect key={i} x={w * u * 0.06 + i * ((w * u * 0.88) / Math.max(2, Math.round(w * 2)))} y={h * u * 0.22} width={(w * u * 0.88) / Math.max(2, Math.round(w * 2)) - 6} height={h * u * 0.3} rx={1.5} fill={shade(color, -0.35)} opacity={0.4} />
            ))}
          </g>
        }
      />
      {Array.from({ length: roof }, (_, i) => (
        <Box key={i} x={x + 0.35 + i * ((w - 0.7) / roof)} y={y + d * 0.55} z={h} w={0.42} d={0.42} h={0.26} color={shade(color, 0.12)} />
      ))}
      <rect x={0} y={0} width={0} height={0} fill={f.top} />
    </g>
  )
}

/** An office building: a box with a window grid on both faces and a door. */
export function Building({ x, y, w = 1.6, d = 1.6, h = 2.6, color = ISO.steel, rows = 3, cols = 3, lit = false, opacity = 1, style }: { x: number; y: number; w?: number; d?: number; h?: number; color?: string; rows?: number; cols?: number; lit?: boolean; opacity?: number; style?: CSSProperties }) {
  const { u } = useIso()
  const win = (fw: number, n: number, door: boolean) => {
    const fh = h * u
    const gx = fw / (n + 1)
    const gy = (fh * 0.78) / (rows + 1)
    const ww = gx * 0.5
    const wh = gy * 0.5
    return (
      <g>
        {Array.from({ length: rows }, (_, r) =>
          Array.from({ length: n }, (_, c) => (
            <rect key={`${r}-${c}`} x={gx * (c + 1) - ww / 2} y={gy * (r + 0.8) - wh / 2 + fh * 0.04} width={ww} height={wh} rx={1} fill={lit ? ISO.gold : ISO.glass} opacity={lit ? 0.9 : 0.85} style={{ transition: ease() }} />
          )),
        )}
        {door && <rect x={fw / 2 - gx * 0.28} y={fh * 0.74} width={gx * 0.56} height={fh * 0.26} rx={1.5} fill={shade(color, -0.45)} opacity={0.8} />}
      </g>
    )
  }
  return (
    <g opacity={opacity} style={{ transition: ease(), ...style }}>
      <Shadow x={x} y={y} w={w} d={d} />
      <Box x={x} y={y} w={w} d={d} h={h} color={color} onRight={win(d * u, Math.max(1, Math.round(cols * (d / w))), true)} onLeft={win(w * u, cols, false)} />
      <Box x={x - 0.06} y={y - 0.06} z={h} w={w + 0.12} d={d + 0.12} h={0.12} color={shade(color, 0.05)} />
    </g>
  )
}

/** Stacked storage drums (a database or storage). */
export function Drums({ x, y, z = 0, n = 3, r = 0.42, h = 0.34, color = ISO.provider, opacity = 1, style }: { x: number; y: number; z?: number; n?: number; r?: number; h?: number; color?: string; opacity?: number; style?: CSSProperties }) {
  const { u } = useIso()
  const [cx, cy] = P(x, y, z, u)
  const rx = r * u * 1.4
  const ry = rx * 0.5
  const hh = h * u
  const f = faces(color)
  return (
    <g opacity={opacity} style={{ transition: ease(), ...style }}>
      <ellipse cx={cx} cy={cy + 2} rx={rx * 1.25} ry={ry * 1.25} fill={ISO.slate} opacity={0.1} />
      {Array.from({ length: n }, (_, i) => {
        const base = cy - i * (hh + 2)
        return (
          <g key={i}>
            <path d={`M${cx - rx} ${base - hh} v${hh} a${rx} ${ry} 0 0 0 ${rx * 2} 0 v${-hh}`} fill={f.right} />
            <path d={`M${cx - rx} ${base - hh} v${hh} a${rx} ${ry} 0 0 0 ${rx} ${ry} v${-hh}`} fill={f.left} />
            <path d={`M${cx - rx} ${base - hh} v${hh} a${rx} ${ry} 0 0 0 ${rx * 2} 0 v${-hh}`} fill="none" stroke={f.line} strokeWidth={0.75} />
            <ellipse cx={cx} cy={base - hh} rx={rx} ry={ry} fill={f.top} stroke={f.line} strokeWidth={0.75} />
          </g>
        )
      })}
    </g>
  )
}

/** A network router: a flat box with port dots and an antenna. */
export function Router({ x, y, z = 0, w = 1.3, d = 0.9, h = 0.32, color = ISO.provider, opacity = 1, style }: { x: number; y: number; z?: number; w?: number; d?: number; h?: number; color?: string; opacity?: number; style?: CSSProperties }) {
  const { u } = useIso()
  const [ax, ay] = P(x + w * 0.2, y + d * 0.2, z + h, u)
  return (
    <g opacity={opacity} style={{ transition: ease(), ...style }}>
      <Shadow x={x} y={y} w={w} d={d} grow={0.12} />
      <Box
        x={x}
        y={y}
        z={z}
        w={w}
        d={d}
        h={h}
        color={color}
        onRight={
          <g>
            {[0.25, 0.45, 0.65].map((k, i) => (
              <circle key={i} cx={d * u * k} cy={h * u * 0.5} r={2.2} fill={ISO.green} />
            ))}
          </g>
        }
      />
      <line x1={ax} y1={ay} x2={ax} y2={ay - u * 0.9} stroke={shade(color, -0.4)} strokeWidth={2} strokeLinecap="round" />
      <circle cx={ax} cy={ay - u * 0.9} r={3} fill={shade(color, -0.4)} />
      <line x1={ax + u * 0.7} y1={ay - u * 0.35} x2={ax + u * 0.7} y2={ay - u * 1.1} stroke={shade(color, -0.4)} strokeWidth={2} strokeLinecap="round" />
      <circle cx={ax + u * 0.7} cy={ay - u * 1.1} r={3} fill={shade(color, -0.4)} />
    </g>
  )
}

/* ------------------------------------------------------------------ devices */

/** A laptop: a base and a raised lid with a screen, facing the viewer. */
export function Laptop({ x, y, z = 0, w = 1.1, d = 0.8, color = ISO.steel, screen = ISO.glass, opacity = 1, style, onScreen }: { x: number; y: number; z?: number; w?: number; d?: number; color?: string; screen?: string; opacity?: number; style?: CSSProperties; onScreen?: ReactNode }) {
  const { u } = useIso()
  return (
    <g opacity={opacity} style={{ transition: ease(), ...style }}>
      <Shadow x={x} y={y} w={w} d={d} grow={0.1} />
      <Box x={x} y={y} z={z} w={w} d={d} h={0.07} color={color} onTop={<rect x={w * u * 0.12} y={d * u * 0.25} width={w * u * 0.76} height={d * u * 0.5} rx={2} fill={shade(color, -0.25)} opacity={0.45} />} />
      <Box
        x={x}
        y={y}
        z={z + 0.07}
        w={w}
        d={0.06}
        h={0.72}
        color={color}
        onLeft={
          <g>
            <rect x={3} y={3} width={w * u - 6} height={0.72 * u - 6} rx={2} fill={screen} style={{ transition: ease() }} />
            {onScreen}
          </g>
        }
      />
    </g>
  )
}

/** A tablet lying flat with a screen on top. */
export function Tablet({ x, y, z = 0, w = 0.9, d = 1.2, color = ISO.steel, screen = ISO.glass, opacity = 1, style }: { x: number; y: number; z?: number; w?: number; d?: number; color?: string; screen?: string; opacity?: number; style?: CSSProperties }) {
  const { u } = useIso()
  return (
    <g opacity={opacity} style={{ transition: ease(), ...style }}>
      <Shadow x={x} y={y} w={w} d={d} grow={0.08} />
      <Box x={x} y={y} z={z} w={w} d={d} h={0.08} color={color} onTop={<rect x={4} y={4} width={w * u - 8} height={d * u - 8} rx={3} fill={screen} style={{ transition: ease() }} />} />
    </g>
  )
}

/** A phone standing upright, its screen on the left face. */
export function Phone({ x, y, z = 0, w = 0.46, d = 0.1, h = 0.9, color = ISO.steel, screen = ISO.glass, opacity = 1, style }: { x: number; y: number; z?: number; w?: number; d?: number; h?: number; color?: string; screen?: string; opacity?: number; style?: CSSProperties }) {
  const { u } = useIso()
  return (
    <g opacity={opacity} style={{ transition: ease(), ...style }}>
      <Shadow x={x} y={y} w={w} d={d} grow={0.12} />
      <Box x={x} y={y} z={z} w={w} d={d} h={h} color={color} onLeft={<rect x={2.5} y={3} width={w * u - 5} height={h * u - 7} rx={2.5} fill={screen} style={{ transition: ease() }} />} />
    </g>
  )
}

/* ------------------------------------------------------------------ small things */

/** A small cube (a workload, a block of cost, a slab of the stack). */
export function Cube({ x, y, z = 0, s = 0.5, w, d, h, color = ISO.customer, opacity = 1, ghost = false, style, onTop, onLeft, onRight }: { x: number; y: number; z?: number; s?: number; w?: number; d?: number; h?: number; color?: string; opacity?: number; ghost?: boolean; style?: CSSProperties; onTop?: ReactNode; onLeft?: ReactNode; onRight?: ReactNode }) {
  return (
    <g opacity={opacity} style={{ transition: ease(), ...style }}>
      {!ghost && <Shadow x={x} y={y} w={w ?? s} d={d ?? s} grow={0.08} opacity={0.08} />}
      <Box x={x} y={y} z={z} w={w ?? s} d={d ?? s} h={h ?? s} color={color} ghost={ghost} onTop={onTop} onLeft={onLeft} onRight={onRight} />
    </g>
  )
}

/** A coin (or a stack of them) on the floor. */
export function Coins({ x, y, z = 0, n = 1, r = 0.22, color = ISO.gold, opacity = 1, style }: { x: number; y: number; z?: number; n?: number; r?: number; color?: string; opacity?: number; style?: CSSProperties }) {
  const { u } = useIso()
  const [cx, cy] = P(x, y, z, u)
  const rx = r * u * 1.4
  const ry = rx * 0.5
  const hh = u * 0.12
  const f = faces(color)
  return (
    <g opacity={opacity} style={{ transition: ease(), ...style }}>
      {Array.from({ length: n }, (_, i) => {
        const base = cy - i * (hh + 1)
        return (
          <g key={i}>
            <path d={`M${cx - rx} ${base - hh} v${hh} a${rx} ${ry} 0 0 0 ${rx * 2} 0 v${-hh}`} fill={f.right} stroke={f.line} strokeWidth={0.6} />
            <ellipse cx={cx} cy={base - hh} rx={rx} ry={ry} fill={f.top} stroke={f.line} strokeWidth={0.6} />
            <ellipse cx={cx} cy={base - hh} rx={rx * 0.55} ry={ry * 0.55} fill="none" stroke={f.line} strokeWidth={0.6} opacity={0.6} />
          </g>
        )
      })}
    </g>
  )
}

/** A padlock glyph at a grid point (a flat sprite): closed or open. */
export function Lock({ x, y, z = 0, open = false, size = 1, color = colors.brandDark, opacity = 1, style }: { x: number; y: number; z?: number; open?: boolean; size?: number; color?: string; opacity?: number; style?: CSSProperties }) {
  const { u } = useIso()
  const [cx, cy] = P(x, y, z, u)
  const s = (u / 28) * size
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`} opacity={opacity} style={{ transition: ease(), ...style }}>
      <path d={open ? 'M-7 -14 a7 7 0 0 1 14 0 v-6' : 'M-7 -14 a7 7 0 0 1 14 0 v6'} fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round" style={{ transition: ease() }} />
      <rect x={-11} y={-9} width={22} height={17} rx={4} fill={color} />
      <circle cx={0} cy={-2} r={2.4} fill={colors.white} />
      <rect x={-1.2} y={-2} width={2.4} height={5} rx={1} fill={colors.white} />
    </g>
  )
}

/** A key glyph at a grid point. */
export function Key({ x, y, z = 0, size = 1, color = ISO.gold, opacity = 1, turn = 0, style }: { x: number; y: number; z?: number; size?: number; color?: string; opacity?: number; turn?: number; style?: CSSProperties }) {
  const { u } = useIso()
  const [cx, cy] = P(x, y, z, u)
  const s = (u / 28) * size
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s}) rotate(${turn})`} opacity={opacity} style={{ transition: `transform 520ms ${T}, opacity 420ms ${T}`, ...style }}>
      <circle cx={-10} cy={0} r={7} fill="none" stroke={shade(color, -0.3)} strokeWidth={4} />
      <path d="M-3 0 H14 M8 0 v5 M12 0 v4" fill="none" stroke={shade(color, -0.3)} strokeWidth={4} strokeLinecap="round" />
    </g>
  )
}

/** A price tag sprite at a grid point, hanging from a string. */
export function Tag({ x, y, z = 0, color = ISO.gold, size = 1, opacity = 1, style }: { x: number; y: number; z?: number; color?: string; size?: number; opacity?: number; style?: CSSProperties }) {
  const { u } = useIso()
  const [cx, cy] = P(x, y, z, u)
  const s = (u / 28) * size
  const f = faces(color)
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`} opacity={opacity} style={{ transition: ease(), ...style }}>
      <path d="M0 -4 l10 10 v16 a3 3 0 0 1 -3 3 h-14 a3 3 0 0 1 -3 -3 v-16 z" fill={f.top} stroke={f.line} strokeWidth={0.8} strokeLinejoin="round" />
      <circle cx={0} cy={4} r={2} fill={f.line} />
      <line x1={0} y1={-4} x2={0} y2={-14} stroke={f.line} strokeWidth={1} />
    </g>
  )
}

/** A meter: a round dial on a post, its needle at `level` 0..1. */
export function Meter({ x, y, z = 0, level = 0.3, size = 1, color = ISO.steel, opacity = 1, style }: { x: number; y: number; z?: number; level?: number; size?: number; color?: string; opacity?: number; style?: CSSProperties }) {
  const { u } = useIso()
  const [cx, cy] = P(x, y, z, u)
  const s = (u / 28) * size
  const a = -210 + level * 240
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`} opacity={opacity} style={{ transition: ease(), ...style }}>
      <line x1={0} y1={0} x2={0} y2={-26} stroke={shade(color, -0.35)} strokeWidth={3} />
      <circle cx={0} cy={-40} r={16} fill={colors.white} stroke={shade(color, -0.35)} strokeWidth={2} />
      <path d="M-11 -48 a14 14 0 0 1 22 0" fill="none" stroke={ISO.green} strokeWidth={3} />
      <path d="M8 -51 a14 14 0 0 1 6 11" fill="none" stroke={ISO.red} strokeWidth={3} />
      <line x1={0} y1={-40} x2={0} y2={-52} stroke={colors.ink} strokeWidth={2} strokeLinecap="round" transform={`rotate(${a} 0 -40)`} style={{ transition: `transform 520ms ${T}` }} />
      <circle cx={0} cy={-40} r={2.2} fill={colors.ink} />
    </g>
  )
}

/** A vertical gauge beside an object: a track, a fill at `level`, a threshold line. */
export function Gauge({ x, y, z = 0, level = 0.4, threshold = 0.7, h = 3, color = ISO.provider, over = ISO.red, opacity = 1, style }: { x: number; y: number; z?: number; level?: number; threshold?: number; h?: number; color?: string; over?: string; opacity?: number; style?: CSSProperties }) {
  const { u } = useIso()
  const [cx, cy] = P(x, y, z, u)
  const H = h * u
  const W = 14
  const past = level >= threshold
  return (
    <g transform={`translate(${cx} ${cy})`} opacity={opacity} style={{ transition: ease(), ...style }}>
      <rect x={-W / 2} y={-H} width={W} height={H} rx={W / 2} fill={colors.white} stroke={ISO.steel} strokeWidth={1.2} />
      <rect x={-W / 2 + 2} y={-H + 2} width={W - 4} height={H - 4} rx={(W - 4) / 2} fill={past ? over : color} style={{ transformOrigin: `0px ${-2}px`, transform: `scaleY(${Math.max(0.02, Math.min(1, level))})`, transition: `transform 240ms linear, fill 240ms ${T}` }} />
      <line x1={-W / 2 - 6} y1={-H * threshold} x2={W / 2 + 6} y2={-H * threshold} stroke={colors.ink} strokeWidth={2} strokeDasharray="3 2" />
    </g>
  )
}

/* ------------------------------------------------------------------ vehicles and places */

/** A taxi cab on the floor, nose toward +x. */
export function Cab({ x, y, z = 0, color = ISO.gold, riders = [], opacity = 1, style }: { x: number; y: number; z?: number; color?: string; riders?: string[]; opacity?: number; style?: CSSProperties }) {
  const { u } = useIso()
  const w = 1.9
  const d = 0.9
  const f = faces(color)
  const wheel = (wx: number) => {
    const [px, py] = P(x + wx, y + d, z + 0.18, u)
    return <ellipse cx={px} cy={py} rx={0.22 * u} ry={0.22 * u * 0.9} fill={colors.ink} stroke={shade(colors.ink, 0.4)} strokeWidth={2} />
  }
  return (
    <g opacity={opacity} style={{ transition: `all 520ms ${T}`, ...style }}>
      <Shadow x={x - 0.05} y={y} w={w + 0.1} d={d} grow={0.1} opacity={0.12} />
      <Box x={x} y={y} z={z + 0.18} w={w} d={d} h={0.42} color={color} onRight={<rect x={d * u * 0.15} y={0.42 * u * 0.35} width={d * u * 0.7} height={0.42 * u * 0.22} rx={2} fill={colors.ink} opacity={0.7} />} />
      <Box
        x={x + 0.45}
        y={y + 0.06}
        z={z + 0.6}
        w={1}
        d={d - 0.12}
        h={0.44}
        color={color}
        onLeft={
          <g>
            {Array.from({ length: 3 }, (_, i) => (
              <rect key={i} x={3 + i * ((u - 6) / 3)} y={4} width={(u - 6) / 3 - 3} height={0.44 * u - 12} rx={2} fill={ISO.glass} opacity={0.9} />
            ))}
            {riders.map((c, i) => (
              <circle key={i} cx={3 + i * ((u - 6) / 3) + ((u - 6) / 3 - 3) / 2} cy={0.44 * u * 0.55} r={3.6} fill={c} style={{ transition: ease(360) }} />
            ))}
          </g>
        }
        onRight={<rect x={4} y={4} width={(d - 0.12) * u - 8} height={0.44 * u - 12} rx={2} fill={ISO.glass} opacity={0.9} />}
      />
      <Box x={x + 0.78} y={y + 0.3} z={z + 1.04} w={0.36} d={0.3} h={0.14} color={colors.white} />
      {wheel(0.4)}
      {wheel(1.5)}
      <g>
        <rect x={0} y={0} width={0} height={0} fill={f.top} />
      </g>
    </g>
  )
}

/** A road: a dark plate with a dashed centre line, along +x. */
export function Road({ x, y, w = 6, d = 1.2, z = 0, opacity = 1 }: { x: number; y: number; w?: number; d?: number; z?: number; opacity?: number }) {
  const { u } = useIso()
  const [ax, ay] = P(x + 0.2, y + d / 2, z + 0.02, u)
  const [bx, by] = P(x + w - 0.2, y + d / 2, z + 0.02, u)
  return (
    <g opacity={opacity}>
      <Quad x={x} y={y} z={z} w={w} d={d} fill={ISO.slate} opacity={0.9} />
      <line x1={ax} y1={ay} x2={bx} y2={by} stroke={colors.white} strokeWidth={2} strokeDasharray="8 7" opacity={0.7} />
    </g>
  )
}

/** A house: a box with a pitched roof. */
export function House({ x, y, z = 0, w = 1.6, d = 1.3, h = 1.1, color = '#F1E4CF', roof = '#D9735B', opacity = 1, ghost = false, style }: { x: number; y: number; z?: number; w?: number; d?: number; h?: number; color?: string; roof?: string; opacity?: number; ghost?: boolean; style?: CSSProperties }) {
  const { u } = useIso()
  const rf = faces(roof)
  const ridge: [number, number][] = [P(x - 0.12, y + d / 2, z + h + 0.55, u), P(x + w + 0.12, y + d / 2, z + h + 0.55, u)]
  const eaveL: [number, number][] = [P(x - 0.12, y + d + 0.12, z + h, u), P(x + w + 0.12, y + d + 0.12, z + h, u)]
  const eaveB: [number, number][] = [P(x - 0.12, y - 0.12, z + h, u), P(x + w + 0.12, y - 0.12, z + h, u)]
  const front = pts([eaveL[0], eaveL[1], ridge[1], ridge[0]])
  const back = pts([eaveB[0], eaveB[1], ridge[1], ridge[0]])
  const gable = pts([P(x + w + 0.12, y - 0.12, z + h, u), P(x + w + 0.12, y + d + 0.12, z + h, u), ridge[1]])
  return (
    <g opacity={opacity} style={{ transition: ease(), ...style }}>
      {!ghost && <Shadow x={x} y={y} w={w} d={d} />}
      <Box x={x} y={y} z={z} w={w} d={d} h={h} color={color} ghost={ghost} onLeft={!ghost ? <g><rect x={w * u * 0.12} y={h * u * 0.3} width={w * u * 0.22} height={h * u * 0.28} rx={1.5} fill={ISO.glass} /><rect x={w * u * 0.6} y={h * u * 0.42} width={w * u * 0.2} height={h * u * 0.58} rx={1.5} fill={shade(color, -0.4)} /></g> : undefined} onRight={!ghost ? <rect x={d * u * 0.3} y={h * u * 0.3} width={d * u * 0.4} height={h * u * 0.28} rx={1.5} fill={ISO.glass} /> : undefined} />
      {ghost ? (
        <g>
          <polygon points={back} fill="none" stroke={rf.line} strokeWidth={1} strokeDasharray="5 4" opacity={0.7} />
          <polygon points={front} fill="none" stroke={rf.line} strokeWidth={1} strokeDasharray="5 4" opacity={0.7} />
        </g>
      ) : (
        <g>
          <polygon points={back} fill={rf.top} stroke={rf.line} strokeWidth={0.75} strokeLinejoin="round" />
          <polygon points={gable} fill={rf.right} stroke={rf.line} strokeWidth={0.75} strokeLinejoin="round" />
          <polygon points={front} fill={rf.left} stroke={rf.line} strokeWidth={0.75} strokeLinejoin="round" />
        </g>
      )}
    </g>
  )
}

/** A kitchen oven: a box with a door window that glows when `on`. */
export function Oven({ x, y, z = 0, on = false, color = ISO.steel, opacity = 1, style }: { x: number; y: number; z?: number; on?: boolean; color?: string; opacity?: number; style?: CSSProperties }) {
  const { u } = useIso()
  return (
    <g opacity={opacity} style={{ transition: ease(), ...style }}>
      <Shadow x={x} y={y} w={1} d={0.9} grow={0.1} />
      <Box
        x={x}
        y={y}
        z={z}
        w={1}
        d={0.9}
        h={1}
        color={color}
        onRight={
          <g>
            <rect x={0.9 * u * 0.14} y={u * 0.3} width={0.9 * u * 0.72} height={u * 0.5} rx={2} fill={on ? ISO.gold : shade(color, -0.45)} opacity={on ? 1 : 0.7} style={{ transition: ease() }} />
            {on && <rect x={0.9 * u * 0.14} y={u * 0.3} width={0.9 * u * 0.72} height={u * 0.5} rx={2} fill={ISO.red} opacity={0.35} />}
            <circle cx={0.9 * u * 0.3} cy={u * 0.16} r={2} fill={shade(color, -0.4)} />
            <circle cx={0.9 * u * 0.5} cy={u * 0.16} r={2} fill={shade(color, -0.4)} />
          </g>
        }
      />
      {[0.25, 0.55].map((k, i) => (
        <circle key={i} cx={P(x + k, y + 0.35, z + 1.02, u)[0]} cy={P(x + k, y + 0.35, z + 1.02, u)[1]} r={5} fill="none" stroke={shade(color, -0.4)} strokeWidth={2} />
      ))}
    </g>
  )
}

/** A flat disc of pizza (or dough) on the floor at a point. */
export function Pizza({ x, y, z = 0, stage = 3, size = 1, opacity = 1, style }: { x: number; y: number; z?: number; stage?: 0 | 1 | 2 | 3; size?: number; opacity?: number; style?: CSSProperties }) {
  const { u } = useIso()
  const [cx, cy] = P(x, y, z, u)
  const rx = 0.36 * u * size * 1.4
  const ry = rx * 0.5
  return (
    <g transform={`translate(${cx} ${cy})`} opacity={opacity} style={{ transition: ease(), ...style }}>
      {stage >= 0 && <ellipse cx={0} cy={0} rx={rx} ry={ry} fill="#F3D9A4" stroke="#C9A061" strokeWidth={0.8} />}
      {stage >= 1 && <ellipse cx={0} cy={0} rx={rx * 0.82} ry={ry * 0.82} fill="#E35B4A" style={{ transition: ease() }} />}
      {stage >= 2 && <ellipse cx={0} cy={0} rx={rx * 0.72} ry={ry * 0.72} fill="#F7E6A8" style={{ transition: ease() }} />}
      {stage >= 3 && [[-0.4, -0.2], [0.3, -0.3], [0.1, 0.3], [-0.3, 0.3], [0.45, 0.15]].map(([a, b], i) => <circle key={i} cx={a * rx} cy={b * ry} r={2.6} fill="#B7342B" style={{ transition: ease() }} />)}
    </g>
  )
}

/** A ledger book lying flat: a thin box with a spine and lines on top. */
export function Ledger({ x, y, z = 0, w = 1.5, d = 1.1, color = colors.brandDark, opacity = 1, style }: { x: number; y: number; z?: number; w?: number; d?: number; color?: string; opacity?: number; style?: CSSProperties }) {
  const { u } = useIso()
  return (
    <g opacity={opacity} style={{ transition: ease(), ...style }}>
      <Shadow x={x} y={y} w={w} d={d} grow={0.08} />
      <Box x={x} y={y} z={z} w={w} d={d} h={0.16} color={color} />
      <Box
        x={x + 0.05}
        y={y + 0.05}
        z={z + 0.16}
        w={w - 0.1}
        d={d - 0.1}
        h={0.06}
        color={colors.white}
        onTop={
          <g>
            {[0.3, 0.45, 0.6, 0.75].map((k, i) => (
              <line key={i} x1={(w - 0.1) * u * 0.12} y1={(d - 0.1) * u * k} x2={(w - 0.1) * u * 0.88} y2={(d - 0.1) * u * k} stroke={ISO.floor} strokeWidth={1.2} style={FACE_STROKE} />
            ))}
          </g>
        }
      />
    </g>
  )
}

/** A desk: a table top on four legs. */
export function Desk({ x, y, z = 0, w = 1.6, d = 1, h = 0.8, color = '#C8A27A', opacity = 1, style }: { x: number; y: number; z?: number; w?: number; d?: number; h?: number; color?: string; opacity?: number; style?: CSSProperties }) {
  const { u } = useIso()
  const leg = (lx: number, ly: number) => {
    const [ax, ay] = P(lx, ly, z, u)
    const [bx, by] = P(lx, ly, z + h, u)
    return <line x1={ax} y1={ay} x2={bx} y2={by} stroke={shade(color, -0.4)} strokeWidth={3} strokeLinecap="round" />
  }
  return (
    <g opacity={opacity} style={{ transition: ease(), ...style }}>
      <Shadow x={x} y={y} w={w} d={d} grow={0.06} opacity={0.07} />
      {leg(x + 0.08, y + 0.08)}
      {leg(x + w - 0.08, y + 0.08)}
      {leg(x + 0.08, y + d - 0.08)}
      <Box x={x} y={y} z={z + h} w={w} d={d} h={0.1} color={color} />
      {leg(x + w - 0.08, y + d - 0.08)}
    </g>
  )
}

/** A station platform, a low plinth a sign can stand on; re-exported Plate with a rounded tone. */
export function Plinth(props: Parameters<typeof Plate>[0]) {
  return <Plate {...props} />
}

export { CloudAt }
