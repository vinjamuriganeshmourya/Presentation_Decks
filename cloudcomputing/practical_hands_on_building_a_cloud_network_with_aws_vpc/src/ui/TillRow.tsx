import { colors } from '@/design/tokens'
import { iconByName } from '@/ui/icons'
import { litBadge, litCard } from '@/ui/annotatedSurface'
import { FcArrowDefs, FcEdgeDraw, FcNodeIn, useBeats } from '@/ui/figures/motion'
import type { QueueFigureProps } from './queueFigure'

/**
 * TILL ROW: the queue drawn the way a supermarket is drawn: one vertical
 * waiting line, front of the line at the BOTTOM, and two service desks beside
 * it that the front of the line can go to either of.
 *
 * THE ARGUMENT
 *
 * Queue-and-servers is the century-old form of queueing theory, and the room
 * already owns it from life. Everybody in it has stood in a line at a counter,
 * watched a till free up, and watched the person at the front step across. That
 * is exactly the mechanism session 7 has to teach, and it is a mechanism nobody
 * has to be taught: a build queue is the line, an executor is the till, and the
 * reason the line exists is that there are two tills and not four.
 *
 * Three things fall out of the supermarket shape rather than having to be
 * asserted on top of it:
 *
 *   - THE LINE HAS A DIRECTION, and it is the direction of a real line. New
 *     arrivals join at the BACK, which is the top, because that is where the
 *     `trigger` arrow lands. The FRONT is the bottom, nearest the desks. A row
 *     of chips left to right has to label its own ends; a line that meets the
 *     counter at one end does not.
 *   - CAPACITY IS A COUNT OF FRAMES. Two desks are two boxes, drawn the same
 *     size whether or not anything is in them, so the free one is a hole in the
 *     picture rather than a faded copy of the busy one. `isolation-lab` recorded
 *     that lesson for `LoneHost`: opacity reads as "present but unimportant",
 *     and only an empty frame reads as "nothing here". A viewer counts free
 *     desks at a glance, and that count is why the line is or is not moving.
 *   - THE FAN IS THE POINT. One connector leaves the front of the line, runs
 *     along a counter rail, and rises into BOTH desks with an arrowhead each.
 *     The next ticket is not promised to a particular executor: it goes to
 *     whichever frees up first. A single arrow into one desk would quietly
 *     teach a wrong queue discipline.
 *
 * It also reads like the two panels Jenkins puts on its own dashboard, `Build
 * Queue` and `Build Executor Status` with its `0/2` count, which is the thing
 * the room has on screen in front of them.
 *
 * WHAT IT IS WORST AT
 *
 * WIDTH, AND THEREFORE THE SIZE OF A DESK'S NOTE. The line is a column, so it
 * spends 268px of the stage on two tickets that would fit in a 90px row. Two
 * desks plus a finished column then have to share the remaining 740px, and a
 * desk's note gets one short line. Anything longer than "running now" wraps to
 * two lines and eats the run card.
 *
 * It is also the WEAKEST CANDIDATE ON TIME. A supermarket line is a snapshot,
 * and this draws a snapshot: #1 finished, #2 running, #3 and #4 waiting, all
 * true at one instant. It cannot show the same run moving from the line into a
 * desk, because nothing here moves along a track. A candidate built on a
 * timeline says "and then #3 takes that slot" in the drawing itself, and this
 * one needs the instructor to say it.
 *
 * And the vertical line costs a beat of orientation. Every other figure in this
 * kit reads left to right, so the first thing a viewer does here is work out
 * which end of the column is the front. The `front of the line` chip on the
 * bottom ticket is there because that beat is real, and a chip is a repair
 * rather than a design that never needed one.
 *
 * GEOMETRY, AND THE HEIGHT ARITHMETIC
 *
 * A fixed 1080 x 356 stage. The slide well is 439px tall and a caption goes
 * underneath it, so the working ceiling for this lab is 400px. This lands at
 * 356, which leaves 44px of that ceiling unspent and is deliberate: `ThreeLanes`
 * took a slide with no points and a one-line lead because it measured 394, and
 * the point of a column layout is that it can afford not to.
 *
 *   JOB_H      58   the job card, top left, above the line
 *   TRIG_H     64   the arrow band. The arrow is drawn 64 to 118 and the
 *                   `trigger` words sit beside it as their own element
 *   PANEL_TOP 122   = 58 + 64. The line, the desks and the finished column all
 *                   open on this line and all close on the same one
 *   PANEL_H   176   = 14 pad + 22 header + 12 + (2 x 52 tickets + 10 gap) + 14
 *                   pad. Grows by 62 per waiting ticket, which is what caps the
 *                   fixture at four: 5 tickets would put the rail at 448
 *   RAIL_DROP  26   panel bottom 298 down to the counter rail at 324
 *   fan label  32   8 of air plus a 24 line under the rail
 *   H         356   = 324 + 32
 *
 * Column x is fixed rather than fractional, because a desk's run card is the
 * tightest box in the figure and a percentage would let it drift:
 *
 *   queue     0..268     one column of tickets
 *   desks     340..832   two 236px frames on a 256px pitch (20px gap)
 *   finished  872..1080  where a run goes when its verdict is in
 */

const W = 1080

const JOB_W = 236
const JOB_H = 58

const TRIG_TOP = JOB_H
const TRIG_H = 64
/** The arrow drops down the job card's own centre line, into the panel's top edge. */
const TRIG_X = JOB_W / 2

const PANEL_TOP = TRIG_TOP + TRIG_H

const QUEUE_W = 268
const PAD = 14
const HEAD_H = 22
const HEAD_GAP = 12
const TICKET_H = 52
const TICKET_GAP = 10

const DESK_X0 = 340
const DESK_W = 236
const DESK_GAP = 20
/** Desks sit side by side on one pitch, so slot 3 would land where slot 3 goes. */
const deskLeft = (i: number) => DESK_X0 + i * (DESK_W + DESK_GAP)
const DONE_X = 872
const DONE_W = W - DONE_X

/** The group labels for the desks and the finished column, level with each other. */
const GROUP_LABEL_TOP = 96
const GROUP_LABEL_H = 24

const RAIL_DROP = 26
const FAN_LABEL_GAP = 8
const FAN_LABEL_H = 24

const ticketTop = (j: number) => PANEL_TOP + PAD + HEAD_H + HEAD_GAP + j * (TICKET_H + TICKET_GAP)

/**
 * The whole figure's height is a function of the queue's length and nothing
 * else, so a caller who passes five waiting tickets gets a figure that is
 * measurably too tall rather than one that quietly overlaps its caption.
 */
export function tillRowHeight(queueLength: number) {
  const n = Math.max(queueLength, 1)
  const panelH = PAD + HEAD_H + HEAD_GAP + n * TICKET_H + (n - 1) * TICKET_GAP + PAD
  return PANEL_TOP + panelH + RAIL_DROP + FAN_LABEL_GAP + FAN_LABEL_H
}

/* THE TWO PAINTS, AND NEITHER IS A VERDICT HUE.

   `success` green and `danger` red belong to the verdict of a finished run and
   to nothing else in this figure, which is why the line and the desks are drawn
   from the brand ramp: the line in `brand`, a busy desk in `brandDeep`. A
   waiting ticket is not a warning and a busy executor is not a failure, and the
   room has been trained all session on green meaning works and red meaning
   fails. A free desk carries no accent at all, because its state is the absence
   of one. */
const QUEUE_PAINT = colors.brand
const BUSY_PAINT = colors.brandDeep

const LABEL_STYLE = {
  fontSize: 14,
  lineHeight: 1.2,
  letterSpacing: '0.1em',
  color: colors.body,
} as const

export function TillRow({ job, trigger, queue, executors, done, caption, className = '' }: QueueFigureProps) {
  /*
    THE BEATS ARE THE FOUR WORDS, IN THE ORDER THE ROOM LEARNS THEM.

      0  the job          on screen when the slide arrives, free
      1  the trigger      the arrow, and what causes it
      2  the line         the queue panel and every waiting ticket
      3  the desks        both frames, so busy and free land together
      4  the fan          the rail into both desks, the mechanism
      5  finished         only when `done` is passed

    The desks arrive as ONE beat rather than two. Busy and free are a contrast
    and a contrast cannot be revealed in halves: a single frame on screen alone
    for one click reads as "this is what an executor is", and the free one then
    reads as an afterthought instead of as the other half of the count.
  */
  const beats = 5 + (done && done.length > 0 ? 1 : 0)
  const shown = useBeats(beats)

  const H = tillRowHeight(queue.length)
  const panelBottom = ticketTop(Math.max(queue.length, 1) - 1) + TICKET_H + PAD
  const railY = panelBottom + RAIL_DROP
  const deskTop = PANEL_TOP
  const deskH = panelBottom - PANEL_TOP

  const JobIcon = job.icon ? iconByName[job.icon] : undefined
  const freeCount = executors.filter((e) => !e.running).length

  /* The front of the line is the FIRST element of `queue` and is drawn at the
     BOTTOM, nearest the desks. `queueFigure.ts` fixes the array as front-first,
     so the display index is the reverse of the data index and that inversion
     lives in exactly this one line. */
  const displayIndex = (i: number) => queue.length - 1 - i
  const frontDropX = QUEUE_W / 2

  return (
    <figure className={`relative mx-auto ${className}`} style={{ width: W, height: H }}>
      {/* THE JOB. It never moves and never divides, so it sits outside the line. */}
      <FcNodeIn
        at={0}
        shown={shown[0]}
        className="absolute"
        style={{ left: 0, top: 0, width: JOB_W, height: JOB_H }}
      >
        <div
          className="flex h-full items-center gap-3 rounded-xl px-4"
          style={litCard(QUEUE_PAINT)}
        >
          {JobIcon && (
            <span
              className="flex shrink-0 items-center justify-center rounded-lg"
              style={{ width: 32, height: 32, ...litBadge(QUEUE_PAINT) }}
            >
              <JobIcon width={18} height={18} />
            </span>
          )}
          <span className="min-w-0">
            <span
              className="block truncate font-heading font-bold"
              style={{ fontSize: 17, lineHeight: 1.2, color: colors.ink }}
            >
              {job.label}
            </span>
            {job.caption && (
              <span
                className="block truncate"
                style={{ fontSize: 14, lineHeight: 1.25, color: colors.body }}
              >
                {job.caption}
              </span>
            )}
          </span>
        </div>
      </FcNodeIn>

      {/* WHAT CAUSES A RUN. Its own element beside the arrow, never svg text. */}
      <FcNodeIn
        at={1}
        shown={shown[1]}
        className="absolute"
        style={{ left: TRIG_X + 20, top: TRIG_TOP + 18, width: 200, height: 30 }}
      >
        <span
          className="flex h-full items-center rounded-pill px-3"
          style={{
            fontSize: 15,
            lineHeight: 1.2,
            ...litBadge(QUEUE_PAINT),
          }}
        >
          {trigger}
        </span>
      </FcNodeIn>

      {/* THE LINE. */}
      <FcNodeIn
        at={2}
        shown={shown[2]}
        className="absolute"
        style={{ left: 0, top: PANEL_TOP, width: QUEUE_W, height: panelBottom - PANEL_TOP }}
      >
        <div
          className="h-full w-full rounded-2xl"
          style={{ background: colors.surface, border: `2px solid ${colors.line}` }}
        />
      </FcNodeIn>

      <FcNodeIn
        at={2}
        shown={shown[2]}
        className="absolute"
        style={{ left: PAD, top: PANEL_TOP + PAD, width: QUEUE_W - PAD * 2, height: HEAD_H }}
      >
        <span className="flex h-full items-center font-heading font-bold uppercase" style={LABEL_STYLE}>
          Build queue · {queue.length} waiting
        </span>
      </FcNodeIn>

      {queue.map((run, i) => {
        const j = displayIndex(i)
        const isFront = i === 0
        return (
          <FcNodeIn
            key={run.id}
            at={2}
            shown={shown[2]}
            className="absolute"
            style={{
              left: PAD,
              top: ticketTop(j),
              width: QUEUE_W - PAD * 2,
              height: TICKET_H,
            }}
          >
            <div
              className="flex h-full items-center gap-3 rounded-xl px-3"
              style={{
                background: colors.white,
                border: `2px solid ${isFront ? QUEUE_PAINT : colors.line}`,
              }}
            >
              <span
                className="flex shrink-0 items-center justify-center rounded-lg font-heading font-bold"
                style={{ width: 48, height: 28, fontSize: 16, ...litBadge(QUEUE_PAINT) }}
              >
                {run.label}
              </span>
              <span className="min-w-0 flex-1">
                {run.note && (
                  <span
                    className="block truncate"
                    style={{ fontSize: 14, lineHeight: 1.2, color: colors.body }}
                  >
                    {run.note}
                  </span>
                )}
                {/* The one repair this layout needs: a column has no conventional
                    front, so the front says so in words. */}
                {isFront && (
                  <span
                    className="block truncate font-bold uppercase"
                    style={{
                      fontSize: 12,
                      lineHeight: 1.2,
                      letterSpacing: '0.08em',
                      color: QUEUE_PAINT,
                    }}
                  >
                    front of the line
                  </span>
                )}
              </span>
            </div>
          </FcNodeIn>
        )
      })}

      {/* THE DESKS. */}
      <FcNodeIn
        at={3}
        shown={shown[3]}
        className="absolute"
        style={{
          left: DESK_X0,
          top: GROUP_LABEL_TOP,
          width: deskLeft(Math.max(executors.length, 1) - 1) + DESK_W - DESK_X0,
          height: GROUP_LABEL_H,
        }}
      >
        <span className="flex h-full items-center font-heading font-bold uppercase" style={LABEL_STYLE}>
          Build executor status · {executors.length} slots · {freeCount} free
        </span>
      </FcNodeIn>

      {executors.map((slot, i) => {
        const busy = Boolean(slot.running)
        const left = deskLeft(i)
        return (
          <FcNodeIn
            key={slot.id}
            at={3}
            shown={shown[3]}
            className="absolute"
            style={{ left, top: deskTop, width: DESK_W, height: deskH }}
          >
            {/* A FREE DESK IS AN EMPTY FRAME, NOT A DIMMED FULL ONE. Dashed on
                white, same size as the busy one, and the word `free` is on it.
                No opacity anywhere in this figure. */}
            <div
              className="flex h-full w-full flex-col rounded-2xl"
              style={{
                padding: PAD,
                background: colors.white,
                border: busy ? `2px solid ${BUSY_PAINT}` : `2px dashed ${colors.muted}`,
              }}
            >
              <div className="flex items-center justify-between" style={{ height: HEAD_H }}>
                <span
                  className="font-heading font-bold uppercase"
                  style={{ ...LABEL_STYLE, color: busy ? colors.ink : colors.body }}
                >
                  {slot.label}
                </span>
                <span
                  className="rounded-pill font-bold uppercase"
                  style={
                    busy
                      ? {
                          fontSize: 12,
                          lineHeight: 1.6,
                          letterSpacing: '0.08em',
                          padding: '0 10px',
                          ...litBadge(BUSY_PAINT),
                        }
                      : {
                          fontSize: 12,
                          lineHeight: 1.6,
                          letterSpacing: '0.08em',
                          padding: '0 10px',
                          color: colors.body,
                          background: colors.white,
                          border: `1px dashed ${colors.muted}`,
                        }
                  }
                >
                  {busy ? 'busy' : 'free'}
                </span>
              </div>

              <div className="mt-3 flex-1">
                {slot.running ? (
                  <div
                    className="flex h-full flex-col items-start justify-center gap-2 rounded-xl px-4"
                    style={litCard(BUSY_PAINT)}
                  >
                    <span
                      className="rounded-lg px-3 font-heading font-bold"
                      style={{ fontSize: 20, lineHeight: 1.5, ...litBadge(BUSY_PAINT) }}
                    >
                      {slot.running.label}
                    </span>
                    {slot.running.note && (
                      <span
                        className="block w-full truncate"
                        style={{ fontSize: 15, lineHeight: 1.25, color: colors.body }}
                      >
                        {slot.running.note}
                      </span>
                    )}
                  </div>
                ) : (
                  <div
                    className="flex h-full items-center justify-center rounded-xl"
                    style={{
                      background: colors.white,
                      border: `2px dashed ${colors.line}`,
                    }}
                  >
                    <span style={{ fontSize: 15, lineHeight: 1.25, color: colors.muted }}>
                      no run in this slot
                    </span>
                  </div>
                )}
              </div>
            </div>
          </FcNodeIn>
        )
      })}

      {/* WHERE A FINISHED RUN GOES. */}
      {done && done.length > 0 && (
        <>
          <FcNodeIn
            at={5}
            shown={shown[5]}
            className="absolute"
            style={{ left: DONE_X, top: GROUP_LABEL_TOP, width: DONE_W, height: GROUP_LABEL_H }}
          >
            <span
              className="flex h-full items-center font-heading font-bold uppercase"
              style={LABEL_STYLE}
            >
              Finished
            </span>
          </FcNodeIn>
          {done.map((run, i) => {
            const paint = run.verdict === 'success' ? colors.success : colors.danger
            return (
              <FcNodeIn
                key={run.label}
                at={5}
                shown={shown[5]}
                className="absolute"
                style={{ left: DONE_X, top: deskTop + i * 74, width: DONE_W, height: 62 }}
              >
                <div
                  className="flex h-full flex-col justify-center rounded-xl px-4"
                  style={litCard(paint)}
                >
                  <span className="flex items-baseline gap-2">
                    <span
                      className="font-heading font-bold"
                      style={{ fontSize: 18, lineHeight: 1.2, color: colors.ink }}
                    >
                      {run.label}
                    </span>
                    {/* The verdict is a WORD as well as a colour, so it survives
                        a greyscale projector. */}
                    <span
                      className="font-bold uppercase"
                      style={{ fontSize: 13, lineHeight: 1.2, letterSpacing: '0.08em', color: paint }}
                    >
                      {run.verdict === 'success' ? 'passed' : 'failed'}
                    </span>
                  </span>
                  {run.note && (
                    <span
                      className="block truncate"
                      style={{ fontSize: 14, lineHeight: 1.25, color: colors.body }}
                    >
                      {run.note}
                    </span>
                  )}
                </div>
              </FcNodeIn>
            )
          })}
        </>
      )}

      {/* WHAT THE FAN MEANS, in words, under the rail it belongs to. */}
      <FcNodeIn
        at={4}
        shown={shown[4]}
        className="absolute"
        style={{
          left: DESK_X0,
          top: railY + FAN_LABEL_GAP,
          width: W - DESK_X0,
          height: FAN_LABEL_H,
        }}
      >
        <span
          className="flex h-full items-center"
          style={{ fontSize: 15, lineHeight: 1.25, color: colors.body }}
        >
          {caption}
        </span>
      </FcNodeIn>

      {/*
        CONNECTORS ONLY. One aria-hidden svg, rendered LAST so its lines paint
        over the panel lip the front ticket leaves through, and carrying no
        `<text>` of any kind: content rule 17 exists because session 4 shipped two
        svg figures whose labels overlapped and all three harnesses passed them,
        an svg being one rectangle to a harness. Every label above is an element.
      */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0"
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
      >
        <FcArrowDefs id="till" colors={{ queue: QUEUE_PAINT, busy: BUSY_PAINT }} />

        {/* ARRIVING. Into the TOP of the panel, which is the BACK of the line. */}
        <FcEdgeDraw
          d={`M ${TRIG_X} ${TRIG_TOP + 6} L ${TRIG_X} ${PANEL_TOP - 4}`}
          at={1}
          shown={shown[1]}
          stroke={QUEUE_PAINT}
          markerEnd="url(#till-queue)"
        />

        {/*
          THE FAN, IN THREE SEGMENTS AND ONE COLOUR.

          A drop out of the front ticket, a counter rail under both desks, and a
          riser into the BOTTOM edge of each desk with its own arrowhead. Under
          the desks rather than over them, because a line that crossed the near
          desk to reach the far one would read as passing THROUGH executor 1, and
          because routing under keeps the two risers the same length: the two
          desks are equally likely and the drawing must not make one look nearer.
        */}
        <FcEdgeDraw
          d={`M ${frontDropX} ${panelBottom - PAD} L ${frontDropX} ${railY} L ${deskLeft(Math.max(executors.length, 1) - 1) + DESK_W / 2} ${railY}`}
          at={4}
          shown={shown[4]}
          stroke={QUEUE_PAINT}
        />
        {executors.map((slot, i) => (
          <FcEdgeDraw
            key={slot.id}
            d={`M ${deskLeft(i) + DESK_W / 2} ${railY} L ${deskLeft(i) + DESK_W / 2} ${panelBottom + 4}`}
            at={4}
            shown={shown[4]}
            stroke={QUEUE_PAINT}
            markerEnd="url(#till-queue)"
          />
        ))}

        {/* LEAVING. Out of the desk band, to the right, where the verdict lives. */}
        {done && done.length > 0 && (
          <FcEdgeDraw
            d={`M ${deskLeft(Math.max(executors.length, 1) - 1) + DESK_W + 6} ${deskTop + 31} L ${DONE_X - 6} ${deskTop + 31}`}
            at={5}
            shown={shown[5]}
            stroke={BUSY_PAINT}
            markerEnd="url(#till-busy)"
          />
        )}
      </svg>
    </figure>
  )
}
