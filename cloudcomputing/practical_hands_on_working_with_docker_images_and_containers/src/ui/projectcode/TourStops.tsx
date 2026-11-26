import { useId, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { colors } from '@/design/tokens'
import { E, c4 } from '@/ui/figureTiming'
import { FcEdgeLabel, FcNodeIn, useBeats } from '@/ui/figures/motion'
import { resolveProject, type ProjectFigureProps } from './projectFigure'
import { RouteToggle, TOGGLE_CLEAR, TOGGLE_H, useRoute } from './routeToggle'

/**
 * TOUR STOPS — a small map that never leaves, and one snippet at a time beside it.
 *
 * THE ARGUMENT
 *
 * This is the form the walkthrough literature actually describes: a guided tour,
 * with snippets as points of interest ON A MAP. The map is four rows down the
 * left, one per file, carrying the path and the `role` and tinted by `layer`. It
 * is on screen from the first frame and it never changes size. The right two
 * thirds is the current stop: its `title` as a claim, its `body`, and the sliced
 * snippet at a size a back row can read.
 *
 * Every click advances one stop. The map marks where you ARE and where you have
 * BEEN, so the question "which file is this" is answered by a glance sideways
 * rather than by remembering the slide before. That is the thing four separate
 * code slides structurally cannot do: each of them is a file with no map, and the
 * room is asked to hold the project's shape in its head while reading code.
 *
 * WHAT IT IS WORST AT
 *
 * THE HANDOVER. `via` is not drawn anywhere. The map states which files exist and
 * the tour states their order, and neither of those is causation: nothing on this
 * figure says the URL pattern DISPATCHES to the view, only that the view comes
 * next. A room watching this can finish the tour able to name all four files and
 * still not be able to say what calls what. `CallFlow` exists for exactly that
 * failure.
 *
 * Second, it shows ONE snippet. Two stops cannot be compared side by side, so
 * "the field list here must match the model there" is a sentence the presenter
 * says, not a thing the slide shows.
 *
 * DID IT USE THE KIT'S `CodeBlock`? NO, AND THIS IS THE REASON.
 *
 * `CodeBlock` renders its gutter as `{i + 1}`, hardcoded. A snippet whose numbers
 * start at 1 tells the room this code is at the top of its file, which for four
 * of the fixture's five stops is false: the view body starts at line 8. Honouring
 * `snippet().from` would mean editing a kit-owned file, so the panel below is a
 * 30-line local renderer: a CSS grid of `[gutter, code]` rows, which also
 * guarantees a number can never drift off the line it belongs to. The cost is the
 * syntax highlighter, and it is the right trade: a wrong line number is a false
 * statement about the codebase, and colour is a nicety.
 *
 * GEOMETRY, AND THE PADDING ARITHMETIC
 *
 * A fixed 1100x398 stage. Map column 300 wide, 24px gutter, snippet panel 776
 * wide at x=324. Both run from y=0 to y=362, and the caption sits at 374.
 *
 * THE TOGGLE OWNS THE TOP-LEFT CORNER, AND IT IS PAID FOR. Its box is 230 x 28
 * inside the map column's 300, and the first map row starts at 42, which is the
 * control's height plus 14px of air. That air is OUTSIDE the control: a box that
 * butts against the row beneath it is the same padding failure as a card with 0px
 * inside it, and it does not stop being one because the box is a button.
 *
 * PADDING IS A FLOOR. A box shows `(box - content) / 2`, so every height below is
 * derived from the fixture's longest string rather than declared and hoped for.
 *
 *   MAP ROW. Content width 300 - 28 (px-14) - 48 (two pips) - 8 = 216.
 *   `products/serializers.py` is 23 chars at 12px mono (0.6em = 7.2px) = 166px,
 *   one line. The longest role, "What a product IS, and the table behind it", is
 *   42 chars at 11px (~5.4px) = 227px, which is WIDER than 216, so it wraps to
 *   two. Content = 15.6 + 3 + 2 x 14.85 = 49px. ROW_H 74 gives (74 - 49) / 2 =
 *   12.5px real against 12px declared. Four rows on an 82px pitch, starting one
 *   clear gap under the toggle: 42, 124, 206, 288, ending at 362.
 *
 *   SNIPPET PANEL. Content width 776 - 40 = 736. Chips 22 + 8 + title 25 + 6 +
 *   body 22 + 12 + code panel (28 header + 7 lines at 13px x 1.6 = 147 + 24 pad =
 *   199) = 294px. PANEL_H 362 leaves 28px of slack, which the code panel absorbs
 *   with `flex-1` rather than leaving a hole, so the declared 20px stays real.
 *   Worst case ceiling is 362 - 40 = 322 > 294.
 *
 *   SEVEN CODE LINES, WHICH IS WHY THE FONT CAME DOWN TO 13. The panel shows the
 *   stop's range plus one line of context either side, and the longest range in the
 *   fixture is five, so the window is at most seven lines. The longest line in it,
 *   `    data = ProductSerializer(products, many=True).data`, is 54 chars at 13px
 *   mono (7.8px) = 421px inside 696px of code column, so nothing wraps and nothing
 *   scrolls.
 */

const W = 1100
const H = 398
const MAP_W = 300
const PANEL_X = 324
const PANEL_W = 776
const COL_H = 362

/* THE TOGGLE OWNS THE TOP-LEFT CORNER AND THE ROWS START BELOW ITS CLEARANCE, not
   2px under it as they did at first. 28 tall plus 14 of air, from
   `routeToggle.tsx`, so the number cannot drift from the control's own box. */
const ROW_TOP = TOGGLE_H + TOGGLE_CLEAR
const ROW_H = 74
const ROW_PITCH = 82

const CAPTION_Y = 374

/**
 * THE LAYER RAMP, AND WHY ALL THREE VARIANTS CARRY THE SAME ARRAY.
 *
 * Colour per layer, held constant, is the one thing every source on walkthrough
 * documentation agrees about: it is how a reader identifies a module without
 * reading its name again. So the colour is a function of the layer's position in
 * `resolveProject().layers`, which is first-appearance order in `files` and
 * therefore stable, and never of anything a variant decides for itself. Routing
 * is blue in all three figures, data is amber in all three.
 */
const RAMP = [colors.brand, colors.info, colors.teal, colors.accentDark, colors.success, colors.warning]

/** One card, one hover aside. Copied in idea from `NodeShell` in the sibling lab. */
function HoverAside({
  label,
  detail,
  paint,
  side = 'bottom',
  className = '',
  children,
}: {
  label: string
  detail?: ReactNode
  paint: string
  side?: 'top' | 'bottom'
  className?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()
  const id = useId()
  const has = Boolean(detail)
  return (
    <span
      className={`relative inline-block ${className}`}
      onPointerEnter={() => has && setOpen(true)}
      onPointerLeave={() => setOpen(false)}
    >
      <span
        className={`fc-node block ${has ? 'fc-node--hoverable' : ''}`}
        aria-describedby={open ? id : undefined}
      >
        {children}
      </span>
      {/*
        NEVER IN THE DOM UNLESS OPEN. All three harnesses measure static
        rectangles, so a panel parked at `opacity: 0` is reported as overflowing
        the frame on every run. `AnimatePresence` keeps it out of the tree.
        0.18s is the documented UI-tier exception: a hover is triggered by the
        presenter, deliberately, while they wait for it.
      */}
      <AnimatePresence>
        {open && detail && (
          <motion.span
            id={id}
            role="tooltip"
            className="pointer-events-none absolute left-1/2 z-30 block w-[268px] rounded-card border border-line bg-white px-3.5 py-3 text-left text-[12.5px] leading-snug shadow-float"
            style={{
              color: colors.body,
              [side === 'top' ? 'bottom' : 'top']: 'calc(100% + 10px)',
              transformOrigin: side === 'top' ? 'bottom center' : 'top center',
            }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateX(-50%) scale(0.96)' }}
            animate={{ opacity: 1, transform: 'translateX(-50%) scale(1)' }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateX(-50%) scale(0.98)' }}
            transition={{ duration: 0.18, ease: c4(E.out) }}
          >
            <span
              className="mb-1 block font-heading text-[11px] font-bold uppercase tracking-wide"
              style={{ color: paint }}
            >
              {label}
            </span>
            {detail}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

/**
 * A WINDOW ON THE FILE, NOT A SNIPPET FLOATING FREE.
 *
 * Line numbers start at the window's first line and never at 1, which is the whole
 * reason this exists rather than `CodeBlock`, whose gutter is hardcoded `{i + 1}`.
 *
 * AND ONE LINE OF CONTEXT EITHER SIDE, WHICH WAS A REPORTED FAULT AND NOT A
 * REFINEMENT. Showing lines 5 to 7 with a gutter reading 5, 6, 7 and nothing above
 * them puts a number on screen with no code at that number: the room reads it as a
 * panel that starts at line 5, which is not a thing a file can do. The dimmed
 * neighbours prove the position the numbers are claiming, and the header states the
 * file's real length so a window can be seen to be a window.
 *
 * The stop's own lines carry a tinted ground and full-strength text; the context
 * lines are dimmed. One grid row per line, so a number cannot drift off its code.
 */
function SnippetLines({
  lines,
  from,
  hot,
  fontSize,
}: {
  lines: string[]
  from: number
  /** The stop's own range, 1-based and inclusive, inside this window. */
  hot: [number, number]
  fontSize: number
}) {
  return (
    <code
      className="grid font-mono"
      style={{ fontSize, lineHeight: `${Math.round(fontSize * 1.6)}px` }}
    >
      {lines.map((line, i) => {
        const n = from + i
        const on = n >= hot[0] && n <= hot[1]
        return (
          <span
            key={i}
            className="grid rounded"
            style={{
              gridTemplateColumns: '26px 1fr',
              columnGap: 12,
              background: on ? `${colors.info}26` : undefined,
            }}
          >
            <span
              className="select-none text-right"
              style={{ color: on ? `${colors.white}c4` : `${colors.white}3d` }}
            >
              {n}
            </span>
            <span
              style={{
                color: on ? `${colors.white}ed` : `${colors.white}6b`,
                whiteSpace: 'pre',
              }}
            >
              {line === '' ? ' ' : line}
            </span>
          </span>
        )
      })}
    </code>
  )
}

export function TourStops({ files, stops, routes, caption, className = '' }: ProjectFigureProps) {
  const p = resolveProject({ files, stops, routes })
  /* WHICH ORDER. A control rather than a build step: see `routeToggle.tsx`. */
  const { route, index, pick, many } = useRoute(p)

  /*
    BEATS. Beat 0 is free and carries the MAP AND THE FIRST STOP, so the slide
    arrives with a figure rather than with an empty frame, and the first click
    does something. Then one click per remaining stop, then the caption. Count is
    derived from `stops.length`, never from state, so the number of registered
    steps is stable while the slide is up.
  */
  /* FROM `stopCount`, THE LONGEST ROUTE, AND NEVER FROM THE ACTIVE ONE. The step
     count a slide registers cannot change while the slide is up, and picking a
     route is a click. */
  const CAPTION = p.stopCount
  const shown = useBeats(CAPTION + 1)

  /*
    THE CURRENT STOP IS DERIVED FROM THE BEATS, NOT HELD IN STATE. `useBeats`
    reveals in order, so the count of revealed stop beats IS the position on the
    tour, and there is no second source of truth to fall out of sync with the
    deck's own step counter.
  */
  const reached = route.stops.filter((_s, i) => shown[i]).length
  const cur = Math.max(0, reached - 1)
  const stop = route.stops[cur]

  /* Invalid input is REPORTED, not drawn. A stop pointing past the end of a file
     renders an empty panel that looks like a styling bug. */
  if (p.problems.length > 0) {
    return (
      <figure
        className={`mx-auto flex flex-col justify-center gap-2 rounded-card border-2 px-8 ${className}`}
        style={{ width: W, height: H, borderColor: colors.danger, background: colors.surface }}
      >
        <span className="font-heading text-[16px] font-bold" style={{ color: colors.danger }}>
          This tour cannot be drawn as authored.
        </span>
        {p.problems.map((m) => (
          <span key={m} className="text-body-sm" style={{ color: colors.body }}>
            {m}
          </span>
        ))}
      </figure>
    )
  }

  const layerPaint = (path: string) => {
    const f = p.byPath[path]
    const i = p.layers.indexOf(f?.layer ?? 'unassigned')
    return RAMP[i % RAMP.length]
  }

  const snip = stop ? p.snippet(stop) : { lines: [], from: 1, language: undefined }
  /*
    THE WINDOW. One line of context either side of the stop, clamped to the file,
    so the gutter's numbers always have code beside them and the room can see where
    the stop sits. Seven lines is the panel's ceiling: the longest range in the
    fixture is five.
  */
  const whole = stop ? (p.byPath[stop.file]?.lines ?? []) : []
  /*
    FILLED TO THE PANEL'S SEVEN LINES RATHER THAN A FIXED ONE LINE EITHER SIDE.

    A one-line margin is worth little around a range that sits between blank lines,
    which in this fixture it often does: the gutter proves the position, but the
    context proves nothing. Since the panel holds seven lines and the longest range
    is five, the spare rows are free. They are spent symmetrically and clamped to
    the file, so a stop at the top of a file spends them all downward instead of
    inventing lines above line 1.
  */
  const WINDOW_MAX = 7
  const rangeLen = stop ? stop.range[1] - stop.range[0] + 1 : 0
  const spare = Math.max(0, WINDOW_MAX - rangeLen)
  const wantUp = Math.ceil(spare / 2)
  const winFrom = stop ? Math.max(1, stop.range[0] - wantUp) : 1
  const winTo = stop
    ? Math.min(whole.length, stop.range[1] + (spare - (stop.range[0] - winFrom)))
    : 0
  const windowLines = whole.slice(winFrom - 1, winTo)

  return (
    <figure className={`relative mx-auto ${className}`} style={{ width: W, height: H }}>
      {/* THE MAP. Persistent, and the only part of the figure that does not
          change: the room's fixed reference for where a snippet lives. */}
      <FcNodeIn
        at={0}
        shown={shown[0]}
        className="absolute"
        style={{ left: 0, top: 0, width: MAP_W }}
      >
        {/* THE TOGGLE SITS WHERE THE MAP'S OWN LABEL USED TO. "The four files" was
            saying what the four rows underneath it already say, and the order the
            tour is walking in is the one thing the map cannot state by itself. */}
        {many ? (
          <RouteToggle routes={p.routes} index={index} onPick={pick} />
        ) : (
          <span
            className="block font-heading text-[12px] font-bold uppercase tracking-wider"
            style={{ color: colors.muted }}
          >
            The four files
          </span>
        )}
      </FcNodeIn>

      {p.files.map((f, fi) => {
        const paint = layerPaint(f.path)
        const mine = route.stops.map((s, i) => ({ s, i })).filter((x) => x.s.file === f.path)
        const here = stop?.file === f.path
        const seen = mine.some((x) => x.i < cur)
        return (
          <FcNodeIn
            key={f.path}
            at={0}
            shown={shown[0]}
            className="absolute"
            style={{ left: 0, top: ROW_TOP + fi * ROW_PITCH, width: MAP_W, height: ROW_H }}
          >
            <div
              className="flex h-full w-full items-center gap-2 rounded-card border px-3.5 py-3"
              style={{
                /* Two background layers, opaque base under the tint. A 7% wash
                   over nothing lets whatever is behind it read through, which is
                   how the sibling lab ended up with a rail running through a
                   card. */
                background: here
                  ? `linear-gradient(${paint}1f, ${paint}1f), ${colors.white}`
                  : colors.white,
                borderColor: here ? paint : colors.line,
                borderLeftColor: paint,
                borderLeftWidth: 4,
                opacity: here || seen ? 1 : 0.62,
              }}
            >
              <span className="min-w-0 flex-1">
                <span
                  className="block truncate font-mono text-[12px] font-semibold leading-[1.3]"
                  style={{ color: here ? paint : colors.ink }}
                >
                  {f.path}
                </span>
                {f.role && (
                  <span
                    className="mt-[3px] block text-[11px] leading-[1.35]"
                    style={{ color: colors.body }}
                  >
                    {f.role}
                  </span>
                )}
              </span>

              {/* WHERE YOU ARE AND WHERE YOU HAVE BEEN. One pip per stop in this
                  file, which is also how the two `views.py` stops declare
                  themselves as two stops in ONE file. */}
              <span className="flex shrink-0 items-center gap-1">
                {mine.map(({ s, i }) => {
                  const isCur = i === cur
                  const past = i < cur
                  return (
                    <HoverAside
                      key={s.id}
                      label={`Stop ${i + 1}`}
                      detail={shown[i] ? s.detail : undefined}
                      paint={paint}
                      side={fi < 2 ? 'bottom' : 'top'}
                    >
                      <span
                        className="grid h-[22px] w-[22px] place-items-center rounded-full font-mono text-[11px] font-bold"
                        style={
                          isCur
                            ? { background: paint, color: colors.white }
                            : past
                              ? { background: `${paint}26`, color: paint }
                              : { border: `1px dashed ${colors.line}`, color: colors.muted }
                        }
                      >
                        {i + 1}
                      </span>
                    </HoverAside>
                  )
                })}
              </span>
            </div>
          </FcNodeIn>
        )
      })}

      {/* THE CURRENT STOP. Keyed on the stop id so the panel re-mounts and plays
          its entrance again on every click: the snippet arriving is what says the
          tour moved. */}
      {stop && (
        <FcNodeIn
          key={stop.id}
          at={cur}
          shown={shown[cur]}
          className="absolute"
          style={{ left: PANEL_X, top: 0, width: PANEL_W, height: COL_H }}
        >
          <div
            className="flex h-full w-full flex-col rounded-card border bg-white px-5 py-5 shadow-card-soft"
            style={{ borderColor: colors.line }}
          >
            <span className="flex items-center gap-2">
              <HoverAside
                label={stop.title}
                detail={stop.detail}
                paint={layerPaint(stop.file)}
                side="bottom"
              >
                <span
                  className="block rounded-pill px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider"
                  style={{ background: layerPaint(stop.file), color: colors.white }}
                >
                  Stop {cur + 1} of {route.stops.length}
                </span>
              </HoverAside>
              <span
                className="flex items-center rounded-pill border px-2.5 py-1 font-mono text-[11px]"
                style={{ borderColor: colors.line, color: colors.body }}
              >
                {/*
                  THE PATH SITS IN ITS OWN TIGHT-LEADING SPAN.

                  `align-check.mjs` infers wrapped text by comparing an element's
                  height to its line-height, and this pill is 27px tall from its
                  own padding against a 16.5px line: measured, not guessed. The
                  harness read that as `products/models.py` wrapped over two
                  lines, which it never does. Giving the text its own element
                  means the padded box carries no direct text and the harness
                  measures the span. The flow-chart lab hit the identical false
                  positive on its token chips.
                */}
                <span className="leading-none">{stop.file}</span>
              </span>
              {/* "of N" IS THE OTHER HALF OF THE FIX. A range with no total reads
                  as the whole file, so a window looked like a file that starts at
                  line 8. */}
              <span className="ml-auto font-mono text-[11px]" style={{ color: colors.muted }}>
                lines {stop.range[0]} to {stop.range[1]} of {whole.length}
              </span>
            </span>

            <span
              className="mt-2 block font-heading text-[19px] font-bold leading-[1.3]"
              style={{ color: colors.ink }}
            >
              {stop.title}
            </span>
            {stop.body && (
              <span className="mt-1.5 block text-[15px] leading-[1.45]" style={{ color: colors.body }}>
                {stop.body}
              </span>
            )}

            {/* `flex-1` so the panel is filled rather than leaving a 67px hole at
                the bottom, which is what keeps the declared 20px padding real. */}
            <div
              className="mt-3 flex-1 overflow-hidden rounded-card"
              style={{ background: colors.night2 }}
            >
              <div
                className="flex items-center gap-2 border-b px-4 py-1.5"
                style={{ borderColor: `${colors.white}1a` }}
              >
                <span className="font-mono text-[11px]" style={{ color: `${colors.white}8a` }}>
                  {stop.file}
                </span>
                <span
                  className="ml-auto rounded-pill px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide"
                  style={{ background: `${colors.white}17`, color: `${colors.white}8a` }}
                >
                  {snip.language ?? 'text'}
                </span>
              </div>
              <div className="px-4 py-3">
                <SnippetLines
                  lines={windowLines}
                  from={winFrom}
                  hot={stop.range}
                  fontSize={13}
                />
              </div>
            </div>
          </div>
        </FcNodeIn>
      )}

      {/* THE ROUTE'S OWN CLAIM WINS THE CAPTION SLOT. The caption is the sentence
          under the figure, and when the room has just changed the order, what that
          order claims IS the sentence. */}
      {(route.claim ?? caption) && (
        <FcEdgeLabel
          at={CAPTION}
          shown={shown[CAPTION]}
          className="absolute text-center text-body-sm"
          style={{ left: 0, width: W, top: CAPTION_Y, color: colors.body }}
        >
          {route.claim ?? caption}
        </FcEdgeLabel>
      )}
    </figure>
  )
}
