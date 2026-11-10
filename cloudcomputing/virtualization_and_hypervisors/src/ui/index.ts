/** Barrel export for all shared slide building blocks. */
export { SlideBase, type SlideVariant } from './SlideBase'
export { SlideHeader } from './SlideHeader'
export { ZonedFrame, ZONE } from './ZonedFrame'
/*
  The sentence under the heading, drawn as the FIRST thing in the content well.
  The kit's slide types lay out through `ZonedFrame` (content rule 32), which
  places the lead itself; reach for this only in a slide that builds its own
  well outside `ZonedFrame`. Not for an aside or a warning, which is `Callout`.
*/
export { SlideLead } from './SlideLead'
export { Logo } from './Logo'
export { Tech } from './Tech'
export { DotGrid, Blob, Orb, WaveArc } from './Decor'
export { Kicker, Chip, NumberBadge } from './primitives'
export { BulletList, Card, CardGrid, StatTile, type BulletItem } from './content'
export { AnalogyMap } from './AnalogyMap'
export { Callout } from './Callout'
export { CodeBlock } from './CodeBlock'
export { Terminal, type TerminalLine } from './Terminal'
export { Shot, type ShotHighlight } from './Shot'
export { ContainerJourney } from './ContainerJourney'

/* Session 3 figures. Each one carries the argument of a slide that a table
   cannot make, and each reads its colours from `src/design/tokens.ts`. */
export { TwoRuntimes } from './TwoRuntimes'
export { OneProcessRule } from './OneProcessRule'
export { HandRitual } from './HandRitual'
export { Orchestra } from './Orchestra'
export { YamlNesting } from './YamlNesting'
export { VolumeSurvival } from './VolumeSurvival'
export { ComposeNetwork } from './ComposeNetwork'
export { StackUp } from './StackUp'
export { DataTable, type TableColumn, type TableRow } from './DataTable'
export { FileTree, type FileEntry, type FileState } from './FileTree'
export { LayerStack, LayerGap, type Layer, type LayerState } from './LayerStack'
export { MachineBoundary } from './MachineBoundary'
export { SocketBridge } from './SocketBridge'
export { NestedBoundary, DIND_LEVELS, type NestedLevel, type BoundaryTone } from './NestedBoundary'
export { TunnelPath } from './TunnelPath'
export { JourneyRoadmap } from './JourneyRoadmap'
export { StepList, FlowChart, type Step, type FlowNode } from './flow'

/*
  THE FLOW FIGURE, PROMOTED FROM `slide-kit/flow-lab`.

  `FlowChart` above is kept because sessions 1 to 5 render it, but it cannot
  label an edge, cannot tell a push from a pull, and gives a registry in the
  middle the same weight as the laptop beside it. Session 6 needed all three and
  worked around the first by rendering `docker push` as a NODE.

  `BoundaryBridge` is what four candidate designs were narrowed to. Prefer it for
  anything that moves an artifact between machines; `FlowChart` stays correct for
  a plain sequence of states.
*/
export { BoundaryBridge } from './BoundaryBridge'
export type { FlowFigureProps, FlowStation, FlowLeg, StationLogo } from './flowFigure'
export { T as figureTiming, E as figureEasing, perSegment, c4 } from './figureTiming'
export { ScenarioCard, type ScenarioBeat } from './ScenarioCard'

/* Figures behind the syntax, status and conversation slide types. Each is a
   FORM the kit did not previously have, not a variant of one it did:
   `SyntaxBreakdown` is a grammar diagram (neither a file nor a console),
   `StatusList` is a list whose rows carry verdicts, `ChatThread` is a two-voice
   exchange. See each file's header for what it must not be used for. */
export { SyntaxBreakdown, type SyntaxPart } from './SyntaxBreakdown'

/* A comparison where one side stands in for the other: one pairing is one
   object, familiar side recessed, new side raised. Chosen in
   `slide-kit/comparison-lab` over three other candidates. NOT for two peers
   being weighed against each other -- it asserts a direction. */
export { SwapRows } from './SwapRows'
export type { CompareFigureProps, ComparePair } from './compareFigure'

/* The style guide's surface lighting (section 9) for SVG figures, which cannot
   express it as CSS. Declare `<SurfaceDefs/>` once per `<svg>`, then spread
   `surface(tone)` onto a `<rect>`. */
export { SurfaceDefs, surface, TopHighlight, type SurfaceTone } from './svgDepth'
export { StatusList, type StatusItem, type StatusKind } from './StatusList'
export { ChatThread, type ChatTurn } from './ChatThread'

/*
  FLOW CHART FIGURES. Six designs for one contract, chosen in
  `slide-kit/flowchart-lab`, which also records what each is WORST at. They all
  take the identical `FlowchartFigureProps`, so swapping one for another is a
  rename at the call site.

  These replace nothing: `FlowChart` in `flow.tsx` still draws a straight
  sequence and is the right choice for one. Reach for these when the process
  BRANCHES, labels an exit, or loops back, none of which `FlowChart` can do,
  because it takes `nodes` and no edges.
*/
export {
  type FlowchartFigureProps,
  type FcNode,
  type FcEdge,
  type FcNodeKind,
  resolveGraph,
} from './flowchart/flowchartFigure'
export { SpineFlow } from './flowchart/SpineFlow'
export { LaneFlow } from './flowchart/LaneFlow'
export { StepLedger } from './flowchart/StepLedger'
export { CircuitMap } from './flowchart/CircuitMap'
export { GateFlow } from './flowchart/GateFlow'
export { TrackSwitch } from './flowchart/TrackSwitch'
export { NodeShell, lookOf, NODE_MIN_H } from './flowchart/NodeShell'

/*
  ONE SOURCE, MANY COPIES.

  On the barrel, unlike the four promoted figure FAMILIES under `src/ui/points`,
  `pseudocode`, `projectcode` and `features`, which stay import-by-path. The
  difference is that a family offers a CHOICE between designs for one contract, and
  choosing should be a deliberate act at the import line; `FanOut` is a single
  figure with one shape, like `LayerStack` and `ContainerJourney` beside it.

  Promoted out of `deployement_session_1_v2`, where it was a deck-local
  `ImageFanout` hardcoded to one image and three containers. The contract carries
  no Docker in it: the same figure draws one build and many environments, or one
  template and many generated files.
*/
export {
  FanOut,
  type FanOutProps,
  type FanOutSource,
  type FanOutCopy,
} from './figures/FanOut'
/*
  OBJECT STATE, AND WHAT ONE METHOD DID TO IT.

  Promoted out of `oops_theory/state_behaviour_constructor`, where `ObjectState`
  carried eleven slides. On the barrel rather than import-by-path, because unlike
  the four figure FAMILIES under `src/ui/points`, `pseudocode`, `projectcode` and
  `features` there is no choice to make here: each is a single figure with one
  shape, like `LayerStack` and `ContainerJourney` beside them.

  Neither is OOP-specific. The contract is a named thing and the values it holds
  right now, which is also a build and its settings, a request and its headers, a
  container and its published ports.

  NOT `DataTable`: a table says "these rows are data" and has no owner to attach
  them to, and the owner is the teaching. NOT a `Card`: no row structure and
  nowhere to mark the row that moved.
*/
export { ObjectState, ObjectStateRow, type StateRow, type ObjectStateProps } from './ObjectState'
export { StateChange, type StateSide, type StateChangeProps } from './StateChange'

/*
  A SNIPPET, AND WHAT RUNNING IT PRINTED.

  Built in `python_programming/programming_with_python`, where thirteen slides
  needed it, then copied into `oops_theory/state_behaviour_constructor`. Two
  copies is where this repo stops: the syntax-anatomy figure was hand-rolled
  three times before it became `SyntaxBreakdown`.

  `CodeBlock` is a FILE (traffic lights, filename, line numbers) and `Terminal`
  is VS Code's panel, where the command and its output share one scrollback and
  the folder path is teaching content. Neither can say "this text, run, produces
  that text", which is what a language lesson is made of.

  Its own header says what `output` may and may not carry.
*/
export { CodeOutput, OutputPanel, type CodeOutputPane } from './CodeOutput'

/* Arrowheads as plain triangles, never SVG markers: Firefox misplaces markers in
   the CSS-zoomed stage. See the file header. */
export { ArrowHead } from './figures/ArrowHead'

/*
  THREE LANES — how far the automation reaches under each of the three CI/CD
  terms. On the barrel as one figure with one shape, like `FanOut` above it.

  Chosen out of `slide-kit/cicd-reach-lab`, which built four candidates for the
  same contract: `StopPoints` (three markers on one chain), `NestedSpans` (three
  brackets above it), `ReachBands` (three bars from a shared left edge) and this.
  The lab's brief came from the session 7 review, "research the best ways to
  represent CI/CD and use those", and the answer that survived is the
  conventional one: Atlassian, Red Hat, AWS Prescriptive Guidance, CircleCI, IBM
  and Bitrise all publish the same picture, so a learner who reads any article
  after the session meets this diagram again.

  It is also the only candidate that asks NOTHING of the viewer. The other three
  draw the reach as an abstraction over a single chain, so a reader has to carry
  a bar or bracket's right end back up to the stage above it. Here each lane
  states its own outcome in place. The price is height, paid three times, and it
  fits: measured at 394px against the 425px ceiling where a composite's top edge
  starts centring into the instructor-video reserve.

  `ReachBands` stays in the lab rather than the kit. It is the same convention
  drawn in 276px, and worth promoting if a future deck needs the height back.
*/
export { ThreeLanes } from './ThreeLanes'
export { ReachChain } from './ReachChain'
export { ApprovalMark } from './ApprovalMark'
export { CHAIN, REACH_PAINT, type CicdReachProps, type ReachStage, type ReachTerm } from './cicdReach'

/*
  TILL ROW. One waiting line, and a fixed number of service desks that the
  front of the line can go to either of. On the barrel as one figure with one
  shape, like `ThreeLanes` above it.

  Chosen out of `slide-kit/queue-lab`, which built three candidates for the same
  `QueueFigureProps` contract: `QueueBelt`, `DashboardPanels` and this. The claim
  all three had to carry is that one job is triggered, runs wait in a line, and a
  fixed number of executor slots take them.

  It won because it is the only candidate that DRAWS THE MECHANISM rather than
  the parts. A connector leaves the front of the line, runs along a rail under
  both desks, and rises into each desk's bottom edge with its own arrowhead, so
  the dependency between a free slot and the next ticket is geometry rather than
  words. That dependency is the one thing a learner cannot work out from a list
  of four definitions, and the other two candidates either state it in a caption
  or leave it to be inferred.

  It also keeps Jenkins' own panel titles, `Build queue` and `Build executor
  status` with its slot count, so it still passes content rule 27: a picture the
  learner meets again elsewhere beats a better one they see once.

  `QueueBelt` lost because its tickets run RIGHT TO LEFT inside the queue well,
  so a reader scanning left to right meets `#4` before `#3` and has to be told by
  a caption which end is the front. `DashboardPanels` lost because it draws the
  two panels and not the flow between them, which leaves the reader to infer the
  one relationship the figure exists to show. Both stay in the lab, and
  `DashboardPanels` is worth reaching for if a future slide needs the panels
  without the flow.
*/
export { TillRow, tillRowHeight } from './TillRow'
export {
  QUEUE_FIXTURE,
  type QueueFigureProps,
  type QueueJob,
  type QueuedRun,
  type ExecutorSlot,
  type FinishedRun,
} from './queueFigure'

export * as Icons from './icons'
export { iconByName, type IconName } from './icons'
/*
  THE PYTHON COURSE FIGURES, promoted from `python/1_programming_with_python`.

  `CodeOutput` is a snippet beside what it printed: the claim every language
  lesson makes and neither `CodeBlock` (a file) nor `Terminal` (a shell) could.
  `LogoWall` is marks with their names, for a claim about scale or familiarity.
  `RadialSpread` is one hub reaching into many places, the form STYLE_GUIDE §8
  names for "reach" and the kit did not have.
*/
/* `CodeOutput` itself is exported further up, with `OutputPanel`. */
export { LogoWall, type WallMark } from './LogoWall'
export { RadialSpread, type Spoke } from './RadialSpread'
/* Sessions 2 to 4 of the same course. `PromptCard` is text pasted into an AI
   tool, `ValueTypeMap` pairs values with their types, `VariableTrace` runs a
   program one line per click with its variables as boxes, `EvalSteps` rewrites an
   expression down to its value. */
export { PromptCard } from './PromptCard'
export { ValueTypeMap, type ValueTypePair } from './ValueTypeMap'
export { VariableTrace, type TraceStep } from './VariableTrace'
export { EvalSteps } from './EvalSteps'
export { MonoBadge } from './MonoBadge'
export { Illustration, type IllustrationName } from './characters/Illustration'
export { Nova, type NovaPose } from './characters/Nova'

// Motion helpers re-exported for slide authors.
export { RevealGroup, Reveal } from '@/motion/Reveal'

/*
  PANELS: slides taught in beats, with their own controls. Built for PF 14
  "For Loop" (python_programming/for_loop), whose lesson-plan page carried
  fifteen hand-built ones. Beats are the kit's build steps (`useBeats`), so the
  deck's keys, `?all` and the harnesses all see them; the panel's buttons are a
  second way to press the same key. Local-state panels (`StringWalker`,
  `RangeDial`, `RunCompare`) are played with, not presented, and keep their own.
*/
export { useBeats, useCount, useTween, PanelButton, StepControls } from './panels/beats'
export { Countdown } from './panels/Countdown'
export { MatchPairs, type MatchItem } from './panels/MatchPairs'
export { BeatStory, type BeatLine } from './panels/BeatStory'
export { ExamplesToShape, type Example } from './panels/ExamplesToShape'
export { VarTrail, SeqBoxes, TraceKey, TraceCaption, DayTrack, CallChip } from './panels/tracePieces'
export { StringWalker } from './panels/StringWalker'
export { TracePanel, type TraceBeat } from './panels/TracePanel'
export { RangeDial } from './panels/RangeDial'
export { SavingsStory, type SavingsDay, type SavingsBeat } from './panels/SavingsStory'
export { RunCompare, type RunSide } from './panels/RunCompare'
export { TakeawayTree, type TakeawayNode } from './panels/TakeawayTree'
export { PseudoShape, RangeCall, RangeArg, RangePunct, RangeCells, CrossList, OptionList, Row, type PseudoToken } from './panels/figures'
export { ChallengePanel } from './panels/ChallengePanel'
export { StoryArt, type StoryArtName } from './characters/StoryArt'
export { type CodeLineState } from './CodeBlock'
