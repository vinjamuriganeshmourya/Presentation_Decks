import type { ReactNode } from 'react'
import type { IconName } from '@/ui/icons'
import type { StationLogo } from '@/ui/flowFigure'

/**
 * ONE CONTRACT FOR EVERY FLOW-CHART VARIANT.
 *
 * Same principle as `flowFigure.ts` next door: it describes **meaning** and
 * never geometry, because turning meaning into geometry is the only thing the
 * variants disagree about. Picking a winner is renaming one component at the
 * call site.
 *
 * WHAT THE KIT'S `FlowChart` CANNOT DO, WHICH IS WHY THIS LAB EXISTS
 *
 * `slide-kit/slide-template/src/ui/flow.tsx` lays its nodes out with a single
 * flex row or column. That is not a limitation of its styling, it is the whole
 * data model: there is one list of nodes and each is drawn after the last.
 *
 *   1. **It cannot branch.** The registry calls `FlowChartSlide` "a process with
 *      branches" and the component cannot draw one. It takes `nodes`, not edges,
 *      so there is nowhere to say that this node leads to two others.
 *   2. **It cannot label an exit.** Established flow-chart practice is that every
 *      arrow leaving a decision carries its condition (Yes/No, Pass/Fail). With
 *      no edges there is nothing to hang the label on.
 *   3. **It cannot loop back.** A rework path returning to an earlier step is the
 *      single most common shape in a real process, and a flex row runs one way.
 *   4. **`shape: 'diamond'` is a costume.** It rotates a node 45 degrees and
 *      carries on in a straight line, so the figure LOOKS like it is asking a
 *      question and then shows only one answer.
 *
 * So this contract is edges-first. Nodes say what a thing IS, edges say what
 * leads to what and under which condition.
 */

/**
 * `start` and `end` are the terminals, and a chart has exactly one of each.
 * `decision` asks a question and MUST have at least two labelled exits.
 * `step` is everything else.
 */
export type FcNodeKind = 'start' | 'step' | 'decision' | 'end'

export interface FcNode {
  id: string
  kind?: FcNodeKind
  /**
   * On a `decision`, write the QUESTION, not the subject: "All checks pass?"
   * rather than "Check result". Established practice, and it is what makes the
   * two exit labels mean anything.
   */
  label: ReactNode
  /** One short line under the label. Not a sentence, and never a full stop. */
  caption?: ReactNode
  /**
   * The longer explanation, revealed when the presenter hovers this node.
   *
   * A SECOND LAYER, NOT AN OVERFLOW BIN. The slide has to work with nobody
   * hovering anything: the room is watching a projector and cannot hover at all,
   * and an exported deck may be read as stills. So `label` and `caption` carry
   * the teaching, and this carries the aside the instructor reaches for when
   * somebody asks. Anything the room MUST know does not go here.
   */
  detail?: ReactNode
  icon?: IconName
  /**
   * A TECHNOLOGY MARK, WHICH TAKES PRECEDENCE OVER `icon`.
   *
   * Hard rule 12: a technology named on a slide carries its logo, because a
   * learner scanning a diagram finds the mark before they finish reading the
   * label. `FcNode` had only `icon`, so session 7's architecture chain (GitHub,
   * Jenkins, Docker Hub) had to draw three house glyphs where three real marks
   * belonged, and a `<>` glyph is not GitHub to anyone who does not already know.
   *
   * Same union as `FlowStation.logo` next door, so a name that works on one
   * figure family works on the other and there is one list of PNGs to keep true.
   */
  logo?: StationLogo
  /**
   * Who owns this step. Optional, and only `LaneFlow` draws it.
   *
   * In the CONTRACT rather than inferred, deliberately. `flow-lab` next door
   * logged the opposite as a finding: `HubOrbit` worked out "one of many" from a
   * station's position because `FlowStation` had no way to say it, so the
   * meaning lived in the geometry and could not be checked. Ownership is a fact
   * about the process, so the caller states it.
   *
   * Established practice for lane names is the specific role, not the
   * department: "Reviewer" over "Review", "Grading service" over "System".
   */
  lane?: string
}

export interface FcEdge {
  from: string
  to: string
  /**
   * The condition under which this edge is taken.
   *
   * **Required on every edge leaving a `decision`.** An unlabelled exit is the
   * commonest flow-chart defect there is: the room can see the process forks and
   * cannot tell which way is which. `resolveGraph` reports it rather than
   * drawing it silently.
   */
  label?: ReactNode
  /**
   * `main` is the happy path and is drawn at full weight, because the dominant
   * path should be the visually dominant one. `alt` is an exception branch and
   * `loop` returns to an earlier node; both are drawn quieter and land later, so
   * the room reads the straight-through story first and the exceptions second.
   */
  kind?: 'main' | 'alt' | 'loop'
}

export interface FlowchartFigureProps {
  nodes: FcNode[]
  edges: FcEdge[]
  /** One line under the whole figure, for the claim the picture makes. */
  caption?: ReactNode
  className?: string
}

/* ------------------------------------------------------------------ */
/* Shared structure, so six variants disagree about geometry only      */
/* ------------------------------------------------------------------ */

export interface ResolvedGraph {
  byId: Record<string, FcNode>
  /**
   * The spine: `start` to `end` following `main` edges only. Every variant draws
   * this as its dominant line, whatever direction it runs in.
   */
  spine: FcNode[]
  /** Nodes reached by an `alt` edge. The exception branch. */
  offSpine: FcNode[]
  main: FcEdge[]
  alt: FcEdge[]
  loop: FcEdge[]
  /** Index of a node within `spine`, or -1. Variants position off it. */
  spineIndex: (id: string) => number
  /** Contract violations, surfaced rather than drawn silently. */
  problems: string[]
}

const kindOf = (e: FcEdge) => e.kind ?? 'main'

/**
 * Turn nodes and edges into the structure every variant needs, once.
 *
 * This is deliberately NOT a general graph layout engine. It resolves the one
 * shape a teaching flow chart actually has, which is a spine with exceptions
 * hanging off it, and it says so when the input is not that shape. A lab exists
 * to compare designs, and six half-written layout algorithms would compare those
 * instead of the designs.
 */
export function resolveGraph({ nodes, edges }: Pick<FlowchartFigureProps, 'nodes' | 'edges'>): ResolvedGraph {
  const byId: Record<string, FcNode> = Object.fromEntries(nodes.map((n) => [n.id, n]))
  const problems: string[] = []

  const main = edges.filter((e) => kindOf(e) === 'main')
  const alt = edges.filter((e) => kindOf(e) === 'alt')
  const loop = edges.filter((e) => kindOf(e) === 'loop')

  for (const e of edges) {
    if (!byId[e.from]) problems.push(`edge from unknown node "${e.from}"`)
    if (!byId[e.to]) problems.push(`edge to unknown node "${e.to}"`)
  }

  /* Every exit from a decision carries its condition. See `FcEdge.label`. */
  for (const n of nodes) {
    if (n.kind !== 'decision') continue
    const exits = edges.filter((e) => e.from === n.id)
    if (exits.length < 2) problems.push(`decision "${n.id}" has ${exits.length} exit(s), needs 2`)
    for (const e of exits) {
      if (!e.label) problems.push(`unlabelled exit from decision "${n.id}" to "${e.to}"`)
    }
  }

  /* Walk the spine from `start`, following main edges. A visited set rather than
     a depth cap: a main-edge cycle is a malformed chart, and hanging on it in a
     dev server is a worse way to find that out than being told. */
  const startNode = nodes.find((n) => n.kind === 'start') ?? nodes[0]
  const spine: FcNode[] = []
  const seen = new Set<string>()
  let cursor: FcNode | undefined = startNode
  while (cursor && !seen.has(cursor.id)) {
    seen.add(cursor.id)
    spine.push(cursor)
    const next = main.find((e) => e.from === cursor!.id)
    cursor = next ? byId[next.to] : undefined
  }
  if (cursor) problems.push(`main edges cycle at "${cursor.id}"; a loop edge should be kind "loop"`)

  const offSpine = alt.map((e) => byId[e.to]).filter((n): n is FcNode => Boolean(n) && !seen.has(n.id))

  return {
    byId,
    spine,
    offSpine,
    main,
    alt,
    loop,
    spineIndex: (id: string) => spine.findIndex((n) => n.id === id),
    problems,
  }
}
