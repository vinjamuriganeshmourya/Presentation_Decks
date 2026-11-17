import type { ReactNode } from 'react'
import { colors } from '@/design/tokens'

/**
 * NestedBoundary — one thing inside another inside another, and whatever sits
 * at the centre is stuck there.
 *
 * WHAT IT ARGUES
 *   Containment. Docker-inside-Docker is the case it was built for: a Jenkins
 *   container on the host's engine, a SECOND engine installed inside that
 *   container, and the image that second engine builds two walls deep, where
 *   the host cannot see it. Drawn as nested boxes, so "inside" is a shape on the
 *   slide and not a word in the lead. A flat list of layers reads as a stack of
 *   equals; the whole point here is that nothing is equal, each thing is inside
 *   the one above.
 *
 * ITS PAIR
 *   `SocketBridge` draws the answer to this picture: two boundaries SIDE BY SIDE
 *   with a socket between them. Both figures use the same dashed boundary so a
 *   deck that shows this one and then that one is showing the same two things
 *   arranged two ways. Keep the boundary style in step with `SocketBridge` if
 *   either changes.
 *
 * WHY NOT THE FIGURES WE HAD
 *   `LayerStack` stacks layers on one machine as a flat list; session 8 tried it
 *   for this slide and it read as four bars. `MachineBoundary` is one boundary
 *   with one outsider, and this has no outsider: the problem is everything being
 *   inside. `YamlNesting` is YAML beside Python, not a general container.
 *
 * DOM, NOT SVG. Content rule 17: a figure made mostly of labels is built from
 * real elements so the browser keeps them apart and `align-check.mjs` can see
 * them. An `<svg>` is one rectangle to every harness.
 */

export type BoundaryTone = 'ink' | 'teal' | 'brand' | 'danger'

export interface NestedLevel {
  label: ReactNode
  /** Small right-aligned annotation, mono: what this level is, in three words. */
  note?: ReactNode
  tone?: BoundaryTone
  /**
   * The thing at the centre. A boundary has something inside it; the innermost
   * item does not, so it is drawn as a filled block rather than a dashed frame.
   */
  solid?: boolean
}

const TONE: Record<BoundaryTone, { stroke: string; text: string; fill: string }> = {
  ink: { stroke: colors.ink, text: colors.ink, fill: 'transparent' },
  teal: { stroke: colors.teal, text: '#0E6B63', fill: 'transparent' },
  brand: { stroke: colors.brand, text: colors.brandDark, fill: 'transparent' },
  danger: { stroke: colors.danger, text: '#991B1B', fill: '#FEF2F2' },
}

/** Docker-inside-Docker, the picture this figure was built for. Outermost first. */
export const DIND_LEVELS: NestedLevel[] = [
  { label: 'Your machine, the host', tone: 'ink' },
  { label: 'Docker Engine', note: 'the real one', tone: 'teal' },
  { label: 'Jenkins container', note: 'its pipeline runs docker build', tone: 'brand' },
  { label: 'A second Docker Engine', note: 'installed inside', tone: 'danger' },
  { label: 'The image it builds', note: 'trapped in here', tone: 'danger', solid: true },
]

function Level({ levels }: { levels: NestedLevel[] }) {
  const [head, ...rest] = levels
  if (!head) return null
  const tone = TONE[head.tone ?? 'ink']
  const solid = head.solid || rest.length === 0

  return (
    <div
      className="rounded-card"
      style={
        solid
          ? { background: tone.fill === 'transparent' ? colors.surface : tone.fill, border: `2px solid ${tone.stroke}` }
          : { border: `2px dashed ${tone.stroke}`, background: tone.fill }
      }
    >
      <div className="flex items-baseline justify-between gap-4 px-3.5 pt-1.5" style={{ paddingBottom: solid ? 7 : 3 }}>
        <span className="font-heading text-[17px] font-bold" style={{ color: tone.text }}>
          {head.label}
        </span>
        {head.note && (
          <span className="font-mono text-[13px]" style={{ color: solid ? tone.text : colors.body }}>
            {head.note}
          </span>
        )}
      </div>
      {rest.length > 0 && (
        <div className="px-2.5 pb-2.5">
          <Level levels={rest} />
        </div>
      )}
    </div>
  )
}

export function NestedBoundary({
  levels = DIND_LEVELS,
  className = '',
}: {
  /** Outermost first. The last entry is drawn solid, as the thing at the centre. */
  levels?: NestedLevel[]
  className?: string
}) {
  return (
    <div className={className}>
      <Level levels={levels} />
    </div>
  )
}
