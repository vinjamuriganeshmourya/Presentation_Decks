import type { ReactNode } from 'react'
import { CodeBlock, type CodeLineState } from '@/ui/CodeBlock'
import { StepControls, useBeats } from './beats'
import { TraceCaption } from './tracePieces'

/**
 * A TRACE IN BEATS — the program on the left, what it is doing on the right.
 *
 * From PF 14 "For Loop" (the worksheet trace, Riya's savings, the exit answer).
 * One beat per statement the program runs. On every beat the line running now
 * lights, the lines already run are tinted, and the right-hand side shows the
 * state at that moment (the variables, the sequence, what has printed). One
 * caption under both says what just happened.
 *
 * The code box is the deck's one code box: x 64, y 221, 560 wide, the run's
 * shared `rows`, so it does not move from the slide before (user, PF 14).
 */
export interface TraceBeat {
  lines?: Record<number, CodeLineState>
  caption: ReactNode
  /** What the right-hand side shows on this beat. */
  aside: ReactNode
}

export function TracePanel({
  code,
  rows,
  beats,
  below,
  showLineNumbers = true,
}: {
  code: string
  rows?: number
  beats: TraceBeat[]
  /** Under the code box on every beat: "input: 7". */
  below?: ReactNode
  showLineNumbers?: boolean
}) {
  const at = useBeats(beats.length)
  const b = beats[at - 1]
  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-10">
          <div className="flex w-[560px] shrink-0 flex-col gap-2">
            <CodeBlock
              code={code}
              filename="Python"
              chip={false}
              fontSize={20}
              rows={rows}
              lines={b.lines ?? {}}
              showLineNumbers={showLineNumbers}
              maxHeight={600}
            />
            {below}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-3">{b.aside}</div>
        </div>
        <TraceCaption>{b.caption}</TraceCaption>
      </div>
      <StepControls at={at} total={beats.length} />
    </>
  )
}
