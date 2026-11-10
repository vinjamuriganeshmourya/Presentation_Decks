/**
 * Concept illustrations for the sample backend-development deck.
 * Flat-vector, brand-palette, text-free diagrams.
 */
import { useId } from 'react'

export function ConceptApi({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, '')
  const g1 = `api-a-${uid}`
  const g2 = `api-b-${uid}`
  return (
    <svg viewBox="0 0 420 220" className={className} aria-hidden>
      <defs>
        <linearGradient id={g1} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4C80FF" />
          <stop offset="100%" stopColor="#0B5FFF" />
        </linearGradient>
        <linearGradient id={g2} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#33C6B7" />
          <stop offset="100%" stopColor="#0E9285" />
        </linearGradient>
      </defs>

      {/* client */}
      <g>
        <rect x="16" y="66" width="104" height="88" rx="12" fill="#FFFFFF" stroke="#D8E3F5" strokeWidth="2" />
        <rect x="16" y="66" width="104" height="20" rx="10" fill="#EAF1FF" />
        <circle cx="30" cy="76" r="3.5" fill="#FF8A3D" />
        <circle cx="42" cy="76" r="3.5" fill="#12B5A8" />
        <rect x="32" y="100" width="72" height="8" rx="4" fill="#D8E3F5" />
        <rect x="32" y="116" width="52" height="8" rx="4" fill="#E8F0FF" />
        <rect x="32" y="132" width="60" height="8" rx="4" fill="#E8F0FF" />
      </g>

      {/* server / API */}
      <g>
        <rect x="168" y="58" width="92" height="104" rx="16" fill={`url(#${g1})`} />
        <rect x="182" y="74" width="64" height="10" rx="5" fill="#FFFFFF" fillOpacity="0.85" />
        <rect x="182" y="94" width="64" height="10" rx="5" fill="#FFFFFF" fillOpacity="0.55" />
        <rect x="182" y="114" width="64" height="10" rx="5" fill="#FFFFFF" fillOpacity="0.55" />
        <circle cx="214" cy="142" r="8" fill="#FF8A3D" />
      </g>

      {/* database */}
      <g>
        <DbCylinder x={306} y={62} w={92} h={96} gradId={g2} />
      </g>

      {/* arrows */}
      <Arrow x1={124} y1={98} x2={164} y2={98} color="#0B5FFF" />
      <Arrow x1={164} y1={128} x2={124} y2={128} color="#12B5A8" dashed />
      <Arrow x1={264} y1={98} x2={302} y2={98} color="#0B5FFF" />
      <Arrow x1={302} y1={128} x2={264} y2={128} color="#12B5A8" dashed />
    </svg>
  )
}

function DbCylinder({
  x,
  y,
  w,
  h,
  gradId,
}: {
  x: number
  y: number
  w: number
  h: number
  gradId: string
}) {
  const ry = 14
  return (
    <g>
      <path
        d={`M${x} ${y + ry} a ${w / 2} ${ry} 0 0 1 ${w} 0 v ${h - 2 * ry} a ${w / 2} ${ry} 0 0 1 ${-w} 0 Z`}
        fill={`url(#${gradId})`}
      />
      <ellipse cx={x + w / 2} cy={y + ry} rx={w / 2} ry={ry} fill="#7FE3D8" />
      <ellipse cx={x + w / 2} cy={y + ry + (h - 2 * ry) / 2} rx={w / 2 - 12} ry={ry - 5} fill="#FFFFFF" fillOpacity="0.25" />
    </g>
  )
}

export function Arrow({
  x1,
  y1,
  x2,
  y2,
  color,
  dashed,
}: {
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  dashed?: boolean
}) {
  const dir = x2 > x1 ? 1 : -1
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2 - dir * 8}
        y2={y2}
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={dashed ? '2 7' : undefined}
      />
      <path
        d={`M${x2} ${y2} l ${-dir * 9} -5 v 10 Z`}
        fill={color}
      />
    </g>
  )
}

export function ConceptDatabase({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, '')
  const g = `db-${uid}`
  return (
    <svg viewBox="0 0 260 240" className={className} aria-hidden>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4C80FF" />
          <stop offset="100%" stopColor="#0E9285" />
        </linearGradient>
      </defs>
      {[0, 1, 2].map((i) => {
        const y = 60 + i * 44
        return (
          <g key={i}>
            <path
              d={`M70 ${y + 16} a 60 16 0 0 1 120 0 v 28 a 60 16 0 0 1 -120 0 Z`}
              fill={`url(#${g})`}
              opacity={1 - i * 0.12}
            />
            <ellipse cx="130" cy={y + 16} rx="60" ry="16" fill="#7FE3D8" />
          </g>
        )
      })}
      <rect x="196" y="40" width="46" height="34" rx="7" fill="#FFFFFF" stroke="#D8E3F5" strokeWidth="2" transform="rotate(8 219 57)" />
      <circle cx="212" cy="28" r="10" fill="#FF8A3D" />
    </svg>
  )
}
