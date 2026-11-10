/**
 * Reusable decorative background elements — the visual "furniture" that gives
 * each slide-family its identity without competing with content. All are
 * absolutely positioned and pointer-events-none.
 */

export function DotGrid({
  className,
  color = '#0B5FFF',
  rows = 5,
  cols = 6,
  gap = 16,
  r = 2.6,
  opacity = 0.18,
}: {
  className?: string
  color?: string
  rows?: number
  cols?: number
  gap?: number
  r?: number
  opacity?: number
}) {
  const w = (cols - 1) * gap
  const h = (rows - 1) * gap
  return (
    <svg
      className={`pointer-events-none absolute ${className ?? ''}`}
      width={w + r * 2}
      height={h + r * 2}
      style={{ opacity }}
      aria-hidden
    >
      {Array.from({ length: rows }).map((_, ri) =>
        Array.from({ length: cols }).map((_, ci) => (
          <circle key={`${ri}-${ci}`} cx={r + ci * gap} cy={r + ri * gap} r={r} fill={color} />
        )),
      )}
    </svg>
  )
}

export function Blob({
  className,
  from = '#4C80FF',
  to = '#12B5A8',
  opacity = 0.16,
}: {
  className?: string
  from?: string
  to?: string
  opacity?: number
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={`pointer-events-none absolute ${className ?? ''}`}
      style={{ opacity }}
      aria-hidden
    >
      <defs>
        <linearGradient id="blobg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <path
        fill="url(#blobg)"
        d="M46 -60 C 66 -46 78 -22 76 2 C 74 26 58 48 36 62 C 14 76 -14 82 -38 70 C -62 58 -80 30 -78 2 C -76 -26 -56 -52 -32 -66 C -8 -80 26 -74 46 -60 Z"
        transform="translate(100 100)"
      />
    </svg>
  )
}

/** Large soft glowing orb for night/brand hero slides. */
export function Orb({
  className,
  color = '#0B5FFF',
  size = 420,
}: {
  className?: string
  color?: string
  size?: number
}) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full ${className ?? ''}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at center, ${color}66 0%, ${color}00 68%)`,
      }}
      aria-hidden
    />
  )
}

/** A flowing brand arc — echoes the "wave" identity. */
export function WaveArc({ className, color = '#12B5A8', opacity = 0.5 }: { className?: string; color?: string; opacity?: number }) {
  return (
    <svg
      viewBox="0 0 600 200"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute ${className ?? ''}`}
      style={{ opacity }}
      aria-hidden
    >
      <path
        d="M0 120 C 150 40 300 40 450 100 C 520 128 570 130 600 118 L600 200 L0 200 Z"
        fill={color}
      />
    </svg>
  )
}
