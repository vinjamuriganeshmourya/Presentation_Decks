import { Reveal, RevealGroup } from '@/motion/Reveal'
import { Terminal } from './Terminal'
import {
  flattenOutput,
  runCountLabel,
  FIGURE_ROOT,
  FIGURE_VIDEO_GUARD,
  type AnnotatedOutputProps,
} from './annotatedOutput'
import { Enclosure, EnclosureLabel } from './annotatedEnclosure'

/**
 * CANDIDATE 2 — COUNT BADGE
 *
 * The enclosure, with the DERIVED COUNT on its edge instead of a phrase. One box
 * around the run, one pill reading `3 layers`, and nothing else on the panel.
 *
 * This is the most direct answer to the slide that fails today. Session 6 slide
 * 30's lead is *"Read the panel again and count the lines between the first and
 * the last"*, and the thing the room is being walked towards is a NUMBER: three
 * layers, not one file. The box says which lines to count and the pill says what
 * the count comes to, both inside the panel, and there is no legend, no leader
 * line and no numbering to pair back.
 *
 * THE NUMBER IS ALWAYS DERIVED. `runCountLabel` counts the run's members. A
 * `count` prop would be a second source of truth and would go stale the first
 * time a line of real output was added, which is the drift `SyntaxBreakdown`'s
 * own header records and the reason this lab's contract has no indexes in it.
 *
 * THE BOX'S EDGE IS WHY THE NUMBER IS TRUE. Three is right only because
 * `b7f7d2967507: Mounted from library/python` is outside the box: that layer was
 * not uploaded, the registry already held it. A box around all four lines with a
 * pill reading `3 layers` would be a figure arguing with itself, and a pill
 * reading `4 layers` would be false.
 *
 * WORST AT: saying WHY the fourth line is out. The line sits immediately below
 * the box with nothing on it, so a learner who notices the gap has to be told out
 * loud, and one who does not notice reads four layers under a pill that says
 * three. `TwoEnclosures` is the candidate that fixes precisely that, at the cost
 * of a second box. It also carries no vocabulary: nothing on the figure says the
 * word "layer" comes from the Dockerfile.
 */

export function CountBadge({
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
          {/* UNCHANGED. Both chromes, all four kinds, nothing injected. */}
          <Terminal path={path} lines={terminalLines} fontSize={fontSize} chrome={chrome} />

          {runs.map((span) => {
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
                label={<EnclosureLabel tone="primary">{runCountLabel(span)}</EnclosureLabel>}
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
