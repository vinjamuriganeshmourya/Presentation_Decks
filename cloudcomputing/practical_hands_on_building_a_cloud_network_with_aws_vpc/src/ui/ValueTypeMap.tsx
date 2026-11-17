import { Reveal, RevealGroup } from '@/motion/Reveal'
import { colors, accentByTone, type Tone } from '@/design/tokens'
import { MonoBadge } from './MonoBadge'
import { T } from './figureTiming'

/**
 * Values on the left, the type of each on the right.
 *
 * THE ARGUMENT
 *
 * `2` and `"2"` look alike and are not alike. The slide's whole claim is the
 * pairing, so the figure is the pairing and nothing else: a value in the mono
 * face, an arrow, its type as a chip. Two or three rows; a fourth is a table
 * (`DataTable`), and a value with no partner is a `MonoBadge`.
 *
 * From Python session 3, where the source drew it three times by hand
 * (2 vs "2", 2 vs 2.0 vs "2.0", True vs "True"). DOM, colours from tokens.
 */

export interface ValueTypePair {
  /** Exactly as it is typed, quotes included. */
  value: string
  type: string
  tone?: Tone
}

const TYPE_TONE: Record<string, Tone> = {
  String: 'accent',
  Integer: 'brand',
  Float: 'teal',
  Boolean: 'success',
}

export function ValueTypeMap({ pairs, className = '' }: { pairs: ValueTypePair[]; className?: string }) {
  return (
    <RevealGroup stagger={T.stagger * 2} delayChildren={T.lead} className={`flex flex-col gap-5 ${className}`}>
      {pairs.map((p) => {
        const color = accentByTone[p.tone ?? TYPE_TONE[p.type] ?? 'brand']
        return (
          <Reveal key={p.value} dir="up" className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
            <MonoBadge size="lg" className="justify-self-end">
              {p.value}
            </MonoBadge>
            <svg width="44" height="24" viewBox="0 0 44 24" fill="none" stroke={colors.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M2 12h38M32 5l8 7-8 7" />
            </svg>
            <span className="inline-flex justify-self-start rounded-pill px-5 py-2" style={{ background: color }}>
              <span className="font-heading text-[20px] font-bold leading-none text-white">{p.type}</span>
            </span>
          </Reveal>
        )
      })}
    </RevealGroup>
  )
}
