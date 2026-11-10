/**
 * Decorative prop SVGs used to build character scenes and concept
 * illustrations. All use the NxtWave-Evolve palette and rounded, glossy,
 * flat-vector styling to match the Nova mascot.
 */
import { useId } from 'react'

function useGrad(from: string, to: string, vertical = true) {
  const id = useId().replace(/:/g, '')
  const el = (
    <linearGradient id={id} x1="0" y1="0" x2={vertical ? '0' : '1'} y2={vertical ? '1' : '0'}>
      <stop offset="0%" stopColor={from} />
      <stop offset="100%" stopColor={to} />
    </linearGradient>
  )
  return { id, el }
}

export function QuestionMark({ className }: { className?: string }) {
  const g = useGrad('#4C80FF', '#12B5A8')
  return (
    <svg viewBox="0 0 200 260" className={className} aria-hidden>
      <defs>{g.el}</defs>
      <path
        d="M60 78 C 60 40 92 20 122 30 C 156 41 160 82 132 104 C 116 117 108 126 108 150 L 82 150 C 82 116 96 104 116 90 C 132 79 130 58 112 54 C 96 51 86 62 86 78 Z"
        fill={`url(#${g.id})`}
      />
      <circle cx="95" cy="188" r="18" fill="#FF8A3D" />
      <circle cx="90" cy="182" r="5" fill="#FFFFFF" fillOpacity="0.7" />
    </svg>
  )
}

export function Laptop({ className }: { className?: string }) {
  const screen = useGrad('#0B5FFF', '#0E9285')
  return (
    <svg viewBox="0 0 260 190" className={className} aria-hidden>
      <defs>{screen.el}</defs>
      {/* lid */}
      <rect x="46" y="24" width="168" height="112" rx="12" fill="#0B1A2B" />
      <rect x="56" y="34" width="148" height="92" rx="7" fill={`url(#${screen.id})`} />
      {/* abstract code bars (no text) */}
      {[
        [66, 48, 60], [66, 62, 84], [78, 76, 48], [66, 90, 96], [78, 104, 40],
      ].map(([x, y, w], i) => (
        <rect key={i} x={x} y={y} width={w} height="7" rx="3.5" fill="#FFFFFF" fillOpacity={0.85 - i * 0.08} />
      ))}
      <circle cx="176" cy="58" r="12" fill="#FF8A3D" fillOpacity="0.9" />
      {/* base */}
      <path d="M28 136 H232 L246 164 H14 Z" fill="#D8E3F5" />
      <rect x="108" y="146" width="44" height="7" rx="3.5" fill="#8A99A8" />
    </svg>
  )
}

/**
 * A rating bubble. Used on the FEEDBACK slide, which is a NIGHT stage.
 *
 * The stars are drawn here rather than through `Star`, which is hardcoded to
 * Evolve orange. Orange is correct where `Star` is used on light content slides
 * and wrong on navy — `tokens.ts` is explicit that orange and teal have no place
 * in the NxtWave style guide and must not be reached for on a dark ground. Gold
 * is the reflex colour for a rating and there is no gold in this palette, so the
 * filled stars are white over pale blue: the SHAPE carries the meaning, the hue
 * does not have to.
 */
export function StarBubble({ className }: { className?: string }) {
  const g = useGrad('#EAF1FF', '#FFFFFF')
  const s = useGrad('#FFFFFF', '#C7D6EF')
  const points = (cx: number, cy: number, r: number) =>
    Array.from({ length: 10 }, (_, i) => {
      const ang = (Math.PI / 5) * i - Math.PI / 2
      const rad = i % 2 === 0 ? r : r * 0.45
      return `${cx + Math.cos(ang) * rad},${cy + Math.sin(ang) * rad}`
    }).join(' ')
  return (
    <svg viewBox="0 0 240 190" className={className} aria-hidden>
      <defs>
        {g.el}
        {s.el}
      </defs>
      <path
        d="M28 20 H212 C 224 20 232 28 232 40 V120 C 232 132 224 140 212 140 H96 L60 172 V140 H28 C 16 140 8 132 8 120 V40 C 8 28 16 20 28 20 Z"
        fill={`url(#${g.id})`}
        stroke="#D8E3F5"
        strokeWidth="2"
      />
      {[0, 1, 2, 3, 4].map((i) => (
        <polygon
          key={i}
          points={points(44 + i * 38, 78, 16)}
          fill={i < 4 ? `url(#${s.id})` : 'none'}
          stroke={i < 4 ? '#A9B7CE' : '#C7D6EF'}
          strokeWidth={i < 4 ? 1.5 : 2.5}
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}

export function Star({
  cx,
  cy,
  r,
  filled = true,
}: {
  cx: number
  cy: number
  r: number
  filled?: boolean
}) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const ang = (Math.PI / 5) * i - Math.PI / 2
    const rad = i % 2 === 0 ? r : r * 0.45
    return `${cx + Math.cos(ang) * rad},${cy + Math.sin(ang) * rad}`
  }).join(' ')
  return (
    <polygon
      points={pts}
      fill={filled ? '#FF8A3D' : '#FFFFFF'}
      stroke="#FF8A3D"
      strokeWidth={filled ? 0 : 2.5}
      strokeLinejoin="round"
    />
  )
}

export function ChecklistCard({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 210 240" className={className} aria-hidden>
      <rect x="20" y="16" width="170" height="212" rx="16" fill="#FFFFFF" stroke="#D8E3F5" strokeWidth="2" />
      <rect x="72" y="12" width="66" height="20" rx="10" fill="#0B5FFF" />
      {[0, 1, 2, 3].map((i) => {
        const y = 64 + i * 42
        return (
          <g key={i}>
            <circle cx="52" cy={y} r="14" fill={i < 3 ? '#16A34A' : '#E8F0FF'} />
            {i < 3 && (
              <path
                d={`M45 ${y} l5 6 l9 -11`}
                stroke="#FFFFFF"
                strokeWidth="3.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            <rect x="76" y={y - 8} width={i < 3 ? 92 : 64} height="7" rx="3.5" fill="#D8E3F5" />
            <rect x="76" y={y + 4} width={i < 3 ? 64 : 44} height="7" rx="3.5" fill="#E8F0FF" />
          </g>
        )
      })}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Chrome-slide icons: Practice and Feedback                          */
/* ------------------------------------------------------------------ */

/**
 * PRACTICE — a spiral notepad with one task ticked and a pencil across it.
 *
 * Drawn rather than rendered. The reference for this was a 3D clay icon, and a
 * 3D icon is exactly what this deck must not use: every other figure here is
 * flat vector on the Nova palette, and one photoreal object among them reads as
 * a sticker someone dropped on the slide. The SHAPE follows the reference (rings
 * along the top, a green tick, a pencil lying diagonally); the RENDERING follows
 * Nova — flat fills, one soft gradient for form, rounded everything.
 *
 * COLOUR: the style-guide blues and white, nothing else. `tokens.ts` is explicit
 * that orange and teal are Evolve hues with no place in the NxtWave guide and
 * must not be reached for on a navy ground — the first cut of this icon had
 * orange rings, an orange pencil and a green tick, and it read as a sticker from
 * a different deck. Nothing here is mid-tone either: on navy, mid-tones vanish.
 */
export function PracticePad({ className }: { className?: string }) {
  const page = useGrad('#FFFFFF', '#EAF1FF')
  const barrel = useGrad('#2D63FB', '#0146C7')
  return (
    <svg viewBox="0 0 240 264" className={className} aria-hidden>
      <defs>
        {page.el}
        {barrel.el}
      </defs>

      {/* the pad */}
      <rect x="30" y="46" width="180" height="192" rx="20" fill={`url(#${page.id})`} />
      {/* a single darker edge along the bottom, so the pad has a thickness
          rather than reading as a flat white rectangle on the navy */}
      <path d="M30 214 H210 V218 C210 229 201 238 190 238 H50 C39 238 30 229 30 218 Z" fill="#D8E3F5" />

      {/* binding: four rings straddling the top edge */}
      {[70, 106, 142, 178].map((x) => (
        <g key={x}>
          <circle cx={x} cy="46" r="5" fill="#0B1A2B" fillOpacity="0.12" />
          <path
            d={`M${x - 9} 58 C ${x - 9} 30, ${x + 9} 30, ${x + 9} 52`}
            fill="none"
            stroke="#2D63FB"
            strokeWidth="8"
            strokeLinecap="round"
          />
        </g>
      ))}

      {/* the ticked task */}
      <circle cx="72" cy="104" r="17" fill="#2D63FB" />
      <path
        d="M64 104 l6 7 l11 -13"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="100" y="96" width="80" height="9" rx="4.5" fill="#C7D6EF" />
      <rect x="100" y="111" width="52" height="9" rx="4.5" fill="#D8E3F5" />

      {/* the task still to do */}
      <circle cx="72" cy="158" r="17" fill="#FFFFFF" stroke="#C7D6EF" strokeWidth="3.5" />
      <rect x="100" y="150" width="66" height="9" rx="4.5" fill="#D8E3F5" />
      <rect x="100" y="165" width="42" height="9" rx="4.5" fill="#E8F0FF" />

      {/*
        THE PENCIL, drawn upright and then rotated as one group.

        Building it on the diagonal directly means every coordinate is a
        trigonometry problem and the ferrule bands stop being parallel the moment
        anything is nudged. Upright-then-rotate keeps the geometry readable and
        the whole pencil movable by one number.
      */}
      <g transform="rotate(34 168 196)">
        {/* eraser */}
        <rect x="152" y="112" width="32" height="20" rx="9" fill="#00254B" />
        {/* ferrule */}
        <rect x="152" y="128" width="32" height="22" fill="#C7D6EF" />
        <rect x="152" y="134" width="32" height="3" fill="#A9B7CE" />
        <rect x="152" y="142" width="32" height="3" fill="#A9B7CE" />
        {/* barrel */}
        <rect x="152" y="148" width="32" height="94" fill={`url(#${barrel.id})`} />
        <rect x="172" y="148" width="12" height="94" fill="#00254B" fillOpacity="0.28" />
        {/* sharpened point */}
        <path d="M152 242 H184 L168 268 Z" fill="#EAF1FF" />
        <path d="M161 256 H175 L168 268 Z" fill="#00254B" />
      </g>
    </svg>
  )
}

/**
 * FEEDBACK — a speech bubble carrying three stars, with a heart notification.
 *
 * Same reasoning as `PracticePad`: the shape comes from the reference icon, the
 * rendering comes from Nova, and the colour comes from the style guide.
 *
 * The stars are drawn HERE rather than reusing `Star` from this file. `Star` is
 * hardcoded to Evolve orange, which is correct where it is used (light content
 * slides) and wrong on the night stage. Gold is the reflex colour for a rating,
 * but there is no gold in this palette, so the stars are white with a pale blue
 * underside — they still read as stars because the shape carries the meaning,
 * not the hue.
 *
 * The badge overlaps the bubble's top-right corner and carries a ring in the
 * stage colour, which is what separates two rounded shapes of similar size when
 * they touch. Without it the badge reads as a bite taken out of the bubble.
 */
export function FeedbackBubble({ className }: { className?: string }) {
  const body = useGrad('#FFFFFF', '#EAF1FF')
  const star = useGrad('#FFFFFF', '#C7D6EF')
  return (
    <svg viewBox="0 0 250 216" className={className} aria-hidden>
      <defs>
        {body.el}
        {star.el}
      </defs>

      <path
        d="M46 26 H186 C202 26 214 38 214 54 V132 C214 148 202 160 186 160
           H120 L86 196 V160 H46 C30 160 18 148 18 132 V54 C18 38 30 26 46 26 Z"
        fill={`url(#${body.id})`}
      />

      {[74, 116, 158].map((cx) => {
        const pts = Array.from({ length: 10 }, (_, i) => {
          const ang = (Math.PI / 5) * i - Math.PI / 2
          const rad = i % 2 === 0 ? 23 : 23 * 0.45
          return `${cx + Math.cos(ang) * rad},${94 + Math.sin(ang) * rad}`
        }).join(' ')
        return <polygon key={cx} points={pts} fill={`url(#${star.id})`} strokeLinejoin="round" />
      })}

      {/* notification badge */}
      {/* The outer rect is the stage colour, not a border: it is what stops two
          rounded shapes of similar size from fusing where they touch. */}
      <rect x="176" y="6" width="62" height="62" rx="20" fill="#00254B" />
      <rect x="180" y="10" width="54" height="54" rx="17" fill="#2D63FB" />
      <path
        d="M207 52 C 198 44, 189 37, 189 29 C 189 23, 194 20, 199 20
           C 203 20, 206 23, 207 25 C 208 23, 211 20, 215 20
           C 220 20, 225 23, 225 29 C 225 37, 216 44, 207 52 Z"
        fill="#FFFFFF"
      />
    </svg>
  )
}
