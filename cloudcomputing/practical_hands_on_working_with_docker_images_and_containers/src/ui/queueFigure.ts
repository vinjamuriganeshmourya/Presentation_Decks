import type { ReactNode } from 'react'
import type { IconName } from '@/ui/icons'

/**
 * THE SHARED CONTRACT FOR EVERY CANDIDATE IN THIS LAB.
 *
 * All candidates take these identical props, so swapping one for another in a
 * deck is a rename and nothing else. `flow-lab` established the pattern with
 * `flowFigure.ts`, `comparison-lab` repeated it with `compareFigure.ts`, and
 * `cicd-reach-lab` with `cicdReach.ts`. It is what makes picking a winner cheap:
 * the gallery renders one fixture N times and the only variable is the drawing.
 *
 * WHAT A QUEUE FIGURE IS FOR
 *
 * ONE definition is triggered, each trigger creates a RUN, runs WAIT IN LINE,
 * and a FIXED number of worker slots take them one at a time. Four things have
 * to be legible at once, and session 7 needs all four because they are four
 * words the room has to learn: job, build, build queue, executor.
 *
 * Asked for on 2026-09-09: *"I want a clear illustration of arriving of job into
 * the build queue, build, executor, all these must be represented, consider
 * actual flow."*
 *
 * WHY NOTHING IN THE KIT DOES THIS
 *
 *   - `SpineFlow` and `FlowChart` are SEQUENCES. A queue and an executor are not
 *     two steps in a row: the queue is a place work waits and the executor is a
 *     resource that consumes from it. Drawing them as two boxes in a chain says
 *     every run passes through a thing called a queue and then a thing called an
 *     executor, which is true, and hides the only fact that matters, that there
 *     are TWO executors and the queue exists because there are not more.
 *   - `FanOut` is one-to-many with no ordering and no capacity. It draws job to
 *     builds correctly and cannot draw waiting at all.
 *   - `LaneFlow` is parallel tracks that each run end to end, not one line
 *     feeding several servers.
 *   - `ThreeLanes` asserts containment. Nothing here contains anything.
 *
 * HOW THE FIELD DRAWS IT (content rule 27)
 *
 * Queue-and-servers is the conventional form, and it is the one queueing theory
 * has drawn for a century: one waiting line, N servers, items leaving the line
 * as a server frees up. Jenkins' own documentation models capacity as EXECUTOR
 * SLOTS, where "a machine either has a free slot or it doesn't"
 * (`jenkins.io/doc/book/using/executor-starvation`), calls agents "the workers
 * that perform operations" (`jenkins.io/doc/book/managing/nodes`), and the
 * clearest published gloss of the pair is that a build queue and a build
 * executor are "as different as a todo list is from the person actually doing
 * the tasks".
 *
 * Jenkins also draws it itself, on the dashboard, as two panels: `Build Queue`
 * and `Build Executor Status` with a `0/2` count. A candidate that reads like
 * those two panels is worth more than a prettier one that does not, because the
 * room has the real thing on screen in front of them.
 */

/** The definition that gets triggered. It never moves and never divides. */
export interface QueueJob {
  /** The job's name, as it appears in Jenkins. */
  label: string
  /** What kind of thing it is, in two or three words. */
  caption?: string
  icon?: IconName
}

/**
 * One run waiting for a slot.
 *
 * `label` is the build number Jenkins will give it. The array is ORDERED and the
 * FRONT OF THE LINE IS FIRST: a candidate that renders it in any other order is
 * claiming a different queue discipline, which is a content error rather than a
 * layout one.
 */
export interface QueuedRun {
  id: string
  label: string
  /** Why it is still waiting, in a few words. Never a repeat of the label. */
  note?: string
}

/**
 * A worker slot, and the whole point of the figure.
 *
 * `running` ABSENT MEANS FREE, and a free slot must be drawn as an EMPTY slot
 * rather than as a filled one at reduced opacity. That is the lesson
 * `isolation-lab` recorded for `LoneHost`: opacity reads as "present but
 * unimportant", and an empty frame is the only device that reads as "nothing
 * here". A viewer has to be able to count free slots at a glance, because that
 * count is why the queue is or is not moving.
 *
 * The NUMBER of executors is fixed by the array's length and must be visible.
 * Jenkins ships with two, so two is the honest default for this course.
 */
export interface ExecutorSlot {
  id: string
  /** The slot's name. Jenkins numbers them, so "Executor 1" and "Executor 2". */
  label: string
  /** The run this slot is executing right now. Omit for a free slot. */
  running?: {
    /** The build number, matching what the queue would have called it. */
    label: string
    /** What it is doing, in a few words. */
    note?: string
  }
}

/** A run that has already finished, with its verdict. */
export interface FinishedRun {
  label: string
  verdict: 'success' | 'failure'
  note?: string
}

export interface QueueFigureProps {
  job: QueueJob
  /**
   * What causes a run to be created, in two or three words.
   *
   * Carried in the figure rather than only in the slide's lead, because the
   * arrival is the first of the four things the figure has to say and a lead is
   * already out of the eye by the time it reaches the drawing.
   */
  trigger: string
  /** Waiting runs, FRONT OF THE LINE FIRST. Empty array is a legal, quiet state. */
  queue: QueuedRun[]
  /** The slots. Length is the capacity and is never inferred from anything else. */
  executors: ExecutorSlot[]
  /** Optional, for candidates that show where a finished run ends up. */
  done?: FinishedRun[]
  caption?: ReactNode
  className?: string
}

/**
 * THE ONE FIXTURE, so the candidates differ only in their drawing.
 *
 * Chosen to make every one of the four words do visible work:
 *
 *   - the job is named, and is the thing that did not move
 *   - two executors, which is what Jenkins ships with
 *   - ONE executor busy and ONE free, so a reader can see that free is a state a
 *     slot can be in, and cannot mistake the drawing for "executors are always
 *     full"
 *   - TWO runs still waiting, so the queue is not an empty box with a label. A
 *     queue drawn empty teaches nothing about what a queue is for
 *   - one finished run, so the verdict has somewhere to live
 *
 * The numbers are consistent: #1 finished, #2 is running, #3 and #4 are waiting.
 * A candidate that renumbers them is drawing a different story.
 */
export const QUEUE_FIXTURE: QueueFigureProps = {
  job: { label: 'hello-jenkins', caption: 'the job you saved', icon: 'settings' },
  trigger: 'You click Build Now',
  queue: [
    { id: 'q3', label: '#3', note: 'next in line' },
    { id: 'q4', label: '#4', note: 'waiting behind #3' },
  ],
  executors: [
    { id: 'e1', label: 'Executor 1', running: { label: '#2', note: 'running now' } },
    { id: 'e2', label: 'Executor 2' },
  ],
  done: [{ label: '#1', verdict: 'success', note: 'finished' }],
}
