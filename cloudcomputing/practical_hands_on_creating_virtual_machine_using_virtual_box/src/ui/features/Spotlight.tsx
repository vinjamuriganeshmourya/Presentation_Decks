import { useId, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { colors } from '@/design/tokens'
import { iconByName } from '@/ui/icons'
import { E, c4 } from '@/ui/figureTiming'
import { FcEdgeLabel, FcNodeIn, useBeats } from '@/ui/figures/motion'
import { resolveFeatures, type FeatureItem, type FeaturesFigureProps } from './featuresFigure'

/**
 * SPOTLIGHT — the whole list is on screen, and exactly one row is legible.
 *
 * THE ARGUMENT
 *
 * A features slide gets TALKED THROUGH one feature at a time. That is how the
 * session actually runs, and every other layout in this lab ignores it: they put
 * five equally finished tiles up and hope the room happens to look wherever the
 * voice is. It usually does not. People read the whole grid in the first four
 * seconds, finish before the instructor has finished the first capability, and
 * spend the rest of the slide ahead of the talking.
 *
 * So this makes the slide follow the instructor. All five capabilities are
 * listed from the moment the slide arrives, because the room needs to know how
 * many there are and roughly what they cover, but only the current one is opened
 * up: its body, its `outcome`, its full type scale. The other four are one dim
 * line each, present but deliberately not worth reading yet. A click moves the
 * spotlight down the list rather than adding another tile, so what the presenter
 * is saying and what is bright on screen are the same thing by construction.
 *
 * The `outcome` line appears ONLY on the open row. "What it buys you" is a claim,
 * and five claims stacked up read as marketing; one claim, on the thing being
 * discussed, reads as a point.
 *
 * WORST AT: THE COMPARISON, AND THE SLIDE AFTER IT.
 *
 * This is a genuinely bad figure for any slide whose job is "look at these
 * together". If the audience has to weigh feature two against feature four, or
 * count what the set covers, they can never see both at full strength at once,
 * and the layout is actively fighting them. It is also the only variant here
 * whose FINAL frame is not its best frame: when the presenter reaches the last
 * capability, the four above it are collapsed, so a screenshot of the finished
 * slide, a PDF export, or anyone reading the deck alone afterwards gets one
 * legible feature and four headings. Every other variant in this lab ends
 * complete. And it needs a presenter: dropped into a self-serve deck with no one
 * clicking, it opens showing a single feature and looks broken.
 *
 * GEOMETRY
 *
 * A fixed 1100px stage on a 1280x720 slide. Full width and no columns is the
 * point: a row that has the whole stage does not need to abbreviate, so the open
 * feature's body and outcome each sit on one line rather than wrapping.
 *
 *   open row       132px
 *   collapsed row   48px
 *   gutter           8px
 *   five rows      132 + 4 * 48 + 4 * 8 = 356px, caption at 368, figure 392
 *
 * THE TOTAL HEIGHT DOES NOT DEPEND ON WHICH ROW IS OPEN. Exactly one row is open
 * at any time, so the stack is `ROW_OPEN + (n - 1) * ROW_SHUT` whatever the
 * spotlight is doing, and the caption underneath never moves. A figure whose own
 * height changed under the presenter would walk the caption off the bottom of
 * the video-safe rectangle on the last click.
 *
 * Padding is a floor, not a declaration: a card shows `(box height - content
 * height) / 2`, and `py-3.5` means nothing once content outgrows the box. The
 * open row stacks a 17px label, a 13px body and a 12px outcome pill to about
 * 80px, so its real padding is ~26px, and ~17px if the body takes a second line.
 * The collapsed row holds one 13px line in 48px, so ~16px. The floor is 12.
 */

const W = 1100
const ROW_OPEN = 132
const ROW_SHUT = 48
const GAP = 8

/**
 * The hover popover's duration, and deliberately not one of `T`'s.
 *
 * `T` is the explanatory tier, for a figure read once from the back of a room. A
 * hover is the UI tier: the presenter triggers it on purpose and waits for it.
 * The lift itself is a CSS transition in `index.css` and is not written here.
 */
const POPOVER = 0.18

export function Spotlight({ items, caption, className = '' }: FeaturesFigureProps) {
  const { hero, rest, all, problems } = resolveFeatures({ items })

  /*
    THE ROWS ARE RENDERED IN SPOTLIGHT ORDER, NOT AUTHORED ORDER.

    The hero leads, then everything else in the order it was written. Rendering
    the list in that same order is what makes the spotlight travel strictly
    downward: if the hero were authored third, a list in authored order would
    open row three, jump to row one, and then walk down past a row it had already
    done. "Moves down the list" has to be true on screen, not just in the beats.
  */
  const order = hero ? [hero, ...rest] : all

  /*
    BEATS ARE DERIVED FROM `items` AND NEVER FROM STATE, so the step count the
    slide registers with the deck is stable while the slide is up. Beat 0 is free
    (`useBeats` does not claim it) and it opens on the hero, so the slide arrives
    with the thing it is about already legible instead of on a dead stage. Then
    one click per remaining feature, and one for the caption. No beat is empty:
    every click moves the spotlight, which is the largest visual change any
    variant in this lab makes per press.
  */
  const CAPTION_AT = order.length
  const shown = useBeats(CAPTION_AT + 1)

  /*
    `shown` is monotonic, the spotlight is not. The open row is the LAST beat
    reached rather than every beat reached, which is the whole difference between
    this variant and a build that accumulates tiles. Derived on every render from
    `shown` alone, so there is no second source of truth to fall out of sync with
    the deck's own step position.
  */
  let current = 0
  for (let i = 0; i < order.length; i += 1) if (shown[i]) current = i

  const tops: number[] = []
  let y = 0
  for (let i = 0; i < order.length; i += 1) {
    tops.push(y)
    y += (i === current ? ROW_OPEN : ROW_SHUT) + GAP
  }
  const listH = Math.max(0, y - GAP)

  const probY = listH + 10
  const captionY = listH + 12 + (problems.length ? 26 : 0)
  const H = captionY + 24

  return (
    <figure className={`relative mx-auto ${className}`} style={{ width: W, height: H }}>
      {order.map((item, i) => (
        <FcNodeIn
          key={item.id}
          /*
            Every row is present from beat 0. This is not the build step: the
            build step is which row is open, below. `FcNodeIn` is still what
            wraps the row, because it supplies the `fc-node-slot` class the
            `:has()` rule in `index.css` needs to lift a hover popover above the
            rows drawn after it.
          */
          at={0}
          shown={shown[0]}
          className="absolute"
          style={{
            left: 0,
            top: tops[i],
            width: W,
            height: i === current ? ROW_OPEN : ROW_SHUT,
          }}
        >
          <Row
            item={item}
            index={i}
            total={order.length}
            open={i === current}
            openAt={i}
            openShown={shown[i]}
            /* The popover goes downward out of the top half of the list and
               upward out of the bottom half, so it never leaves the slide. */
            side={i < order.length / 2 ? 'bottom' : 'top'}
          />
        </FcNodeIn>
      ))}

      {/*
        CONTRACT VIOLATIONS ARE PRINTED, NOT SWALLOWED. `resolveFeatures` knows
        about two heroes, seven features, or an item carrying neither body nor
        outcome. A figure that quietly spotlights the first of two heroes is
        worse than one that says what it found.
      */}
      {problems.length > 0 && (
        <div
          className="absolute text-[11.5px] leading-[1.4]"
          style={{ left: 0, top: probY, width: W, color: colors.danger }}
        >
          {problems.join('. ')}
        </div>
      )}

      {caption && (
        <FcEdgeLabel
          at={CAPTION_AT}
          shown={shown[CAPTION_AT]}
          className="absolute block text-center text-body-sm"
          style={{ left: 0, top: captionY, width: W, color: colors.body }}
        >
          {caption}
        </FcEdgeLabel>
      )}
    </figure>
  )
}

/**
 * ONE ROW, IN TWO STATES.
 *
 * The two states are not the same box at two opacities. A collapsed row is a
 * different composition: no icon, no rule, smaller and dimmer type, no border,
 * so it reads as a heading in a list rather than as a card that has been turned
 * down. That is what stops the four quiet rows competing with the open one.
 */
function Row({
  item,
  index,
  total,
  open,
  openAt,
  openShown,
  side,
}: {
  item: FeatureItem
  index: number
  total: number
  open: boolean
  /** The beat this row's open state belongs to, for the body's entrance. */
  openAt: number
  openShown: boolean
  side: 'top' | 'bottom'
}) {
  const [hovered, setHovered] = useState(false)
  const reduce = useReducedMotion()
  const id = useId()
  const Icon = item.icon ? iconByName[item.icon] : null
  const hasDetail = Boolean(item.detail)

  return (
    <div
      className="relative h-full w-full"
      onPointerEnter={() => hasDetail && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <div
        /*
          `fc-node--hoverable` is the kit's existing 160ms CSS lift in
          `index.css`, gated behind `hover: hover` so a tap cannot leave a row
          stuck raised. CSS rather than framer because a transition retargets
          from wherever it is when the pointer leaves, and a quick sweep down
          five rows is exactly the case keyframes get wrong.
        */
        className={`fc-node flex h-full w-full items-center gap-3.5 rounded-card px-4 py-3.5 ${hasDetail ? 'fc-node--hoverable' : ''}`}
        style={
          open
            ? {
                /* Tint over an opaque white base, never a bare wash: a
                   translucent fill lets the ground read through and the open row
                   is the one thing that must not look like a hole. */
                background: `linear-gradient(${colors.brand}0f, ${colors.brand}0f), ${colors.white}`,
                border: `2px solid ${colors.brand}`,
                boxShadow: `0 10px 34px -14px ${colors.brand}4d`,
              }
            : {
                background: colors.surface,
                border: `1px solid ${colors.line}`,
              }
        }
        aria-describedby={hovered ? id : undefined}
      >
        {/* THE NUMBER IS THE SPINE. It is the only element in a fixed position
            down the whole list, so the collapsed rows still read as a sequence
            with a place in it rather than as four leftover captions. */}
        <span
          className={`grid shrink-0 place-items-center rounded-lg font-heading font-bold ${
            open ? 'h-7 w-7 text-[13px]' : 'h-6 w-6 text-[12px]'
          }`}
          style={
            open
              ? { background: colors.brand, color: colors.white }
              : { background: colors.white, color: colors.muted, border: `1px solid ${colors.line}` }
          }
        >
          {index + 1}
        </span>

        {/* A DIV, NOT A SPAN. `FcNodeIn` renders a `motion.div`, and a div
            inside a span is invalid nesting that React will hydrate but the
            browser is free to reparent. */}
        <div className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            {open && Icon && (
              <span
                className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-lg"
                style={{ background: `${colors.brand}1a`, color: colors.brand }}
              >
                <Icon width={13} height={13} />
              </span>
            )}
            <span
              className={
                open
                  ? 'block font-heading text-[17px] font-bold leading-[1.25]'
                  : 'block font-heading text-[13px] font-semibold leading-[1.25]'
              }
              style={{ color: open ? colors.ink : colors.muted }}
            >
              {item.label}
            </span>
          </span>

          {/*
            THE OPEN BODY IS THE BUILD STEP, so it is the thing wrapped in
            `FcNodeIn` rather than the row. It mounts when the spotlight arrives
            and unmounts when the spotlight leaves, so the entrance plays on
            every move down the list, not only the first time.
          */}
          {open && (
            <FcNodeIn at={openAt} shown={openShown}>
              {item.body && (
                <span className="mt-1.5 block text-[13px] leading-[1.45]" style={{ color: colors.body }}>
                  {item.body}
                </span>
              )}
              {item.outcome && (
                <span
                  className="mt-2 inline-block rounded-pill px-2.5 py-1 text-[12px] font-semibold leading-[1.35]"
                  style={{ background: colors.brand, color: colors.white }}
                >
                  {item.outcome}
                </span>
              )}
            </FcNodeIn>
          )}
        </div>

        {/* Where the room is in the set. A spotlight without a position is a
            slide that shows one feature and gives no sense of how many are left,
            which is the first thing anyone watching wants to know. */}
        {open && (
          <span
            className="shrink-0 self-start font-heading text-[12px] font-bold tracking-wide"
            style={{ color: `${colors.brand}b3` }}
          >
            {index + 1} of {total}
          </span>
        )}

        {hasDetail && (
          <span
            aria-hidden
            className="fc-node__more absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full"
            style={{ background: open ? colors.brand : `${colors.muted}99` }}
          />
        )}
      </div>

      {/*
        THE POPOVER IS NEVER IN THE DOM UNLESS IT IS OPEN. All three harnesses
        measure static rectangles, so a panel parked at `opacity: 0` is reported
        as overflowing the frame on every run. `AnimatePresence` keeps it out of
        the tree entirely, which also keeps the slide complete without it: the
        room cannot hover a projector, so `detail` is the presenter's aside.
      */}
      <AnimatePresence>
        {hovered && item.detail && (
          <motion.span
            id={id}
            role="tooltip"
            className="pointer-events-none absolute left-[120px] z-30 block w-[320px] rounded-card border border-line bg-white px-3.5 py-3 text-left text-[12.5px] leading-snug shadow-float"
            style={{
              color: colors.body,
              [side === 'top' ? 'bottom' : 'top']: 'calc(100% + 10px)',
              /* Out of the edge nearest the row, so it reads as coming from the
                 row rather than appearing beside it. */
              transformOrigin: side === 'top' ? 'bottom left' : 'top left',
            }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.96)' }}
            animate={{ opacity: 1, transform: 'scale(1)' }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.98)' }}
            transition={{ duration: POPOVER, ease: c4(E.out) }}
          >
            <span
              className="mb-1 block font-heading text-[11px] font-bold uppercase tracking-wide"
              style={{ color: colors.brand }}
            >
              {item.label}
            </span>
            {item.detail as ReactNode}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
