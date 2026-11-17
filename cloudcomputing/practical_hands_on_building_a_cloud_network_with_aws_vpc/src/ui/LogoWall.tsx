import { Reveal, RevealGroup } from '@/motion/Reveal'
import { T } from './figureTiming'

/**
 * A wall of marks, each with its name under it.
 *
 * WHAT IT ARGUES
 *
 * Scale. "Around 700 programming languages" and "the companies you have heard of
 * run on this" are both claims a sentence states and only a wall of marks makes
 * felt: the room recognises six of the twelve before it has read a single label,
 * and that recognition IS the argument.
 *
 * WHAT IT MUST NOT BE
 *
 * Decoration. Hard rule 8: if the marks are not themselves the claim, this is a
 * grid of pictures filling space. And hard rule 12's second half applies inside
 * it: every mark carries its name. A mark alone is a guessing game for anyone
 * who does not already know it, which on a slide arguing familiarity is exactly
 * backwards.
 *
 * Every `src` must resolve. Rule 12 again, and this component is the easiest
 * place in the kit to reference four logos that are not on disk.
 */

export interface WallMark {
  src: string
  /** The name, always. Rendered under the mark. */
  name: string
  /** A second, smaller line: an address, a version. Keeps the name to one line. */
  sub?: string
}

export function LogoWall({
  marks,
  cols = 6,
  size = 'md',
  className = '',
}: {
  marks: WallMark[]
  cols?: 4 | 5 | 6
  size?: 'sm' | 'md'
  className?: string
}) {
  const grid = { 4: 'grid-cols-4', 5: 'grid-cols-5', 6: 'grid-cols-6' }[cols]
  const box = size === 'sm' ? 'h-10' : 'h-12'
  return (
    <RevealGroup
      stagger={T.stagger / 2}
      delayChildren={T.lead}
      className={`grid ${grid} items-start gap-x-5 gap-y-6 ${className}`}
    >
      {marks.map((m) => (
        <Reveal key={m.name} dir="up" className="flex flex-col items-center gap-2 text-center">
          <span className={`flex ${box} items-center justify-center`}>
            <img
              src={m.src}
              alt={m.name}
              draggable={false}
              className="max-h-full max-w-full select-none object-contain"
            />
          </span>
          <span className="font-heading text-[13px] font-semibold leading-tight text-body">
            {m.name}
          </span>
          {m.sub && <span className="font-mono text-[11px] leading-tight text-muted">{m.sub}</span>}
        </Reveal>
      ))}
    </RevealGroup>
  )
}
