import { Reveal, RevealGroup } from '@/motion/Reveal'
import { Terminal } from './Terminal'
import {
  flattenOutput,
  FIGURE_ROOT,
  FIGURE_VIDEO_GUARD,
  type AnnotatedOutputProps,
} from './annotatedOutput'
import { Enclosure, EnclosureLabel } from './annotatedEnclosure'

/**
 * CANDIDATE 1 — BRACED RUN, as an ENCLOSURE
 *
 * One box drawn around the run, in place, with the run's label on the box's own
 * edge. The primary direction, and the reviewer's words are the brief: *"it
 * better highlight as box included the required content instead of doing from
 * the end."*
 *
 * WHY A BOX AND NOT A BRACE. This candidate began as a brace and a label in a
 * lane beside the panel, which is a third of the way to a legend: the eye still
 * has to travel out of the output and come back. A box states the group where
 * the group is. The lines inside it are the ones being talked about, and that
 * reads before a single word does.
 *
 * WHERE THE BOX STOPS IS THE WHOLE ARGUMENT. It spans the three `Pushed` lines
 * and not `b7f7d2967507: Mounted from library/python`, which was NOT uploaded.
 * `members` already excludes the exception, so this cannot enclose the wrong
 * line without ignoring the contract. That exclusion is stated by geometry, not
 * by prose, which is the thing no legend or leader line can do.
 *
 * The panel is the kit's `Terminal`, unmodified: both chromes, all four line
 * kinds. The box is positioned from the panel's BOTTOM edge, which is the one
 * measurement identical in both chromes. See the geometry note in
 * `annotatedOutput.ts`.
 *
 * WORST AT: saying the NUMBER. It groups the lines and names the group, and then
 * still asks the room to count them, which is exactly what slide 30's lead asks
 * for. `CountBadge` is this candidate with the count on the edge instead of the
 * words. It is also worst at saying anything about the line it excludes — the
 * box says "not this one" and never says why — and at a NON-CONTIGUOUS group,
 * which it cannot draw and the contract cannot express.
 */

export function BracedRun({
  path,
  nodes,
  chrome = 'vscode',
  fontSize = 14,
  caption,
  className = '',
}: AnnotatedOutputProps) {
  const { lines, runs } = flattenOutput(nodes)
  const total = lines.length
  const terminalLines = lines.map((f) => ({ text: f.line.text, kind: f.line.kind }))

  return (
    <RevealGroup
      className={`${FIGURE_ROOT} max-w-[1000px] ${className}`}
      style={{ paddingTop: FIGURE_VIDEO_GUARD, paddingBottom: FIGURE_VIDEO_GUARD }}
      stagger={0.1}
    >
      <Reveal dir="up">
        <div className="relative">
          <Terminal path={path} lines={terminalLines} fontSize={fontSize} chrome={chrome} />

          {runs.map((span) => {
            /* THE BOX SPANS THE MEMBERS ONLY. `members` is the list with
               exceptions already filtered out, so the `Mounted from` line
               cannot land inside this box by accident. */
            const first = span.members[0]
            const last = span.members[span.members.length - 1]
            if (first === undefined || last === undefined) return null
            return (
              <Enclosure
                key={span.runIndex}
                from={first}
                to={last}
                fontSize={fontSize}
                total={total}
                tone="primary"
                label={<EnclosureLabel tone="primary">{span.run.label}</EnclosureLabel>}
              />
            )
          })}
        </div>
      </Reveal>

      {caption && (
        <Reveal dir="up">
          <p className="mt-4 text-center text-body-sm font-semibold text-ink">{caption}</p>
        </Reveal>
      )}
    </RevealGroup>
  )
}
