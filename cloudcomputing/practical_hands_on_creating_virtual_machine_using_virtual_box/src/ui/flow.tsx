import type { ReactNode } from 'react'
import { Step } from '@/motion/Stepper'
import { accentByTone, colors, type Tone } from '@/design/tokens'
import { iconByName, type IconName } from './icons'
import { NumberBadge } from './primitives'

/* ------------------------------------------------------------------ */
/* StepList — numbered procedure with a connecting rail                */
/* ------------------------------------------------------------------ */

export interface Step {
  title: ReactNode
  detail?: ReactNode
  icon?: IconName
  /**
   * A tail fragment of the title that claims a build step OF ITS OWN, revealed
   * one click after the row it sits in.
   *
   * For the "ask, then confirm" beat: the row states the need the room just
   * worked out ("a directory to store the files") and the next click puts the
   * concrete value beside it (`/app`). Without the second step the answer is on
   * screen before the room has been asked for it.
   */
  value?: ReactNode
}

export function StepList({
  steps,
  tone = 'brand',
  className = '',
}: {
  steps: Step[]
  tone?: Tone
  className?: string
}) {
  return (
    <div className={`relative ${className}`}>
      {/* vertical rail */}
      <span
        className="absolute left-[22px] top-3 bottom-6 w-[2px] rounded-pill"
        style={{ background: `${accentByTone[tone]}33` }}
      />
      <ol className="space-y-5">
        {steps.map((s, i) => (
          <Step as="li" dir="left" key={i} className="relative flex items-start gap-5">
            <NumberBadge n={i + 1} tone={tone} className="relative z-10 h-11 w-11" />
            <div className="rounded-card border border-line bg-white px-5 py-3.5 shadow-card-soft flex-1">
              <p className="font-heading text-lg font-bold text-ink">
                {s.title}
                {/*
                  Nested inside the row's own `Step`, so it claims the NEXT step
                  number. It carries its own `animate`, which is what stops the
                  parent's variants from propagating in and revealing it early.
                  `inline-block` because framer animates a transform.
                */}
                {s.value != null && (
                  <Step as="span" dir="fade" className="ml-2 inline-block">
                    {s.value}
                  </Step>
                )}
              </p>
              {s.detail && <p className="mt-0.5 text-body">{s.detail}</p>}
            </div>
          </Step>
        ))}
      </ol>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* FlowChart — linear node → arrow → node sequence                     */
/* ------------------------------------------------------------------ */

export interface FlowNode {
  label: ReactNode
  caption?: ReactNode
  icon?: IconName
  tone?: Tone
  shape?: 'box' | 'pill' | 'diamond'
}

/**
 * FLOW CHART — a process, drawn as one journey rather than a row of boxes.
 *
 * WHAT WAS WRONG WITH THE FIRST VERSION, AND WHY IT MATTERED
 *
 * Every node carried a 2px border in its own colour, auto-assigned by position
 * from a three-tone cycle. Five nodes came out blue, teal, orange, blue, green:
 * a rainbow in which the colour encoded NOTHING. The room reads colour as
 * meaning, so five meanings were being asserted and none existed. Meanwhile the
 * only thing that WAS meaningful, that this is one thing happening in order, was
 * carried by four small floating arrow glyphs with wide gaps either side.
 *
 * So the figure said "here are five unrelated coloured boxes" when the content
 * was "here is one request travelling through five places".
 *
 * WHAT IT DOES NOW
 *
 * 1. **One continuous rail** runs behind every node. The row reads as a route
 *    with stations on it, which is what a flow chart is. The arrows sit ON the
 *    rail rather than floating between cards.
 *
 * 2. **Colour encodes position in the journey, and nothing else.** The FIRST and
 *    LAST nodes are filled: the request enters at one end and the response
 *    leaves at the other, and those are the only two nodes the room can see the
 *    outside of. Everything between them is a neutral white station on the house
 *    accent, because they are all the same KIND of thing: somewhere the request
 *    passes through.
 *
 * 3. **`tone` on a node is still honoured, and no longer invented.** The
 *    auto-cycle is gone. Pass a tone to mark one station out as different and it
 *    will be different; pass nothing and it takes the chart's accent. A figure
 *    where every node is emphasised has no emphasis.
 *
 * MOTION
 *
 * Nodes are `Step`s revealing at `dir="scale"`, which starts at 0.9 rather than
 * 0: nothing in the world appears out of nothing, and a node scaling up from
 * zero reads as a pop rather than as an arrival. The connectors reveal on the
 * fade so the eye follows the rail forward instead of watching a glyph land.
 */
export function FlowChart({
  nodes,
  direction = 'horizontal',
  tone: chartTone = 'brand',
  className = '',
}: {
  nodes: FlowNode[]
  direction?: 'horizontal' | 'vertical'
  /** The accent for every station that does not name its own `tone`. */
  tone?: Tone
  className?: string
}) {
  const horizontal = direction === 'horizontal'
  const Arrow = iconByName.arrow
  const accent = accentByTone[chartTone]

  const children: ReactNode[] = []
  nodes.forEach((n, i) => {
    /* No auto-cycle. An un-toned node takes the chart's accent, so a toned one
       actually means something. */
    const color = n.tone ? accentByTone[n.tone] : accent
    const Icon = n.icon ? iconByName[n.icon] : null
    const diamond = n.shape === 'diamond'
    /* The two ends of the journey, which are the only nodes that are a different
       KIND of thing from their neighbours. A one-node chart is not a journey, so
       it gets no endpoint treatment. */
    const endpoint = nodes.length > 1 && (i === 0 || i === nodes.length - 1)
    const filled = endpoint && !diamond

    children.push(
      <Step dir="scale" key={`n${i}`} className={horizontal ? 'flex-1' : ''}>
        <div
          className={`relative mx-auto grid place-items-center text-center ${
            diamond ? 'rotate-45 rounded-2xl border-2 bg-white shadow-card-soft' : ''
          } ${filled ? 'rounded-pill shadow-card' : ''} ${
            !diamond && !filled ? 'rounded-card border border-line bg-white shadow-card-soft' : ''
          }`}
          style={{
            ...(diamond ? { borderColor: color } : {}),
            ...(filled ? { background: color } : {}),
            minWidth: horizontal ? 150 : 210,
            minHeight: diamond ? 128 : 92,
            padding: diamond ? 18 : '16px 20px',
          }}
        >
          <div className={diamond ? '-rotate-45' : ''}>
            {Icon && (
              <span
                className="mx-auto mb-1 grid h-9 w-9 place-items-center rounded-xl"
                style={
                  filled
                    ? { background: 'rgba(255,255,255,0.22)', color: '#FFFFFF' }
                    : { background: `${color}18`, color }
                }
              >
                <Icon width={18} height={18} />
              </span>
            )}
            <p
              className="font-heading font-bold leading-tight"
              style={{ color: filled ? '#FFFFFF' : colors.ink }}
            >
              {n.label}
            </p>
            {n.caption && (
              <p
                className="mt-0.5 text-body-sm"
                style={{ color: filled ? 'rgba(255,255,255,0.82)' : colors.body }}
              >
                {n.caption}
              </p>
            )}
          </div>
        </div>
      </Step>,
    )

    if (i < nodes.length - 1) {
      children.push(
        <Step dir="fade" key={`a${i}`}>
          {/*
            THE CONNECTOR CARRIES ITS OWN RAIL, and that is the second attempt.

            The first version drew ONE rail spanning the whole figure, behind
            every node. It was invisible: the nodes are opaque white cards, so the
            only rail the room could see was the few pixels either side of each
            arrow glyph, and the glyph's own disc covered most of that. A rail
            nobody can see does not turn a row of cards into a route.

            So the connective tissue lives in the gap where it can actually be
            seen: a fixed-width segment of rail with the arrow sitting on it. Four
            gaps of 64px is 256px of visible route rather than 30.
          */}
          <span
            className={`relative grid place-items-center ${horizontal ? 'h-8' : 'w-8'}`}
            style={horizontal ? { width: 64 } : { height: 64 }}
          >
            <span
              aria-hidden
              className={`pointer-events-none absolute rounded-pill ${
                horizontal ? 'inset-x-0 h-[2px]' : 'inset-y-0 w-[2px]'
              }`}
              style={{ background: `${accent}59` }}
            />
            {/* The glyph needs a ground of its own or the rail draws straight
                through it. `surface` rather than white, so it reads as the rail
                passing behind rather than as a chip sitting on top. */}
            <span
              className="relative grid h-8 w-8 place-items-center rounded-full"
              style={{ background: colors.surface, color: accent }}
            >
              <Arrow
                width={20}
                height={20}
                style={{ transform: horizontal ? 'none' : 'rotate(90deg)' }}
              />
            </span>
          </span>
        </Step>,
      )
    }
  })

  return (
    <div
      className={`flex ${
        horizontal ? 'flex-row items-center justify-center' : 'flex-col items-center'
      } ${className}`}
    >
      {children}
    </div>
  )
}
